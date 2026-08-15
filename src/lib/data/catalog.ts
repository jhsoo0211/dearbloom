/**
 * 콘텐츠 로더 — `content/*.csv` → 엔진이 먹는 `Catalog`.
 *
 * **서버 전용이다.** 클라이언트 컴포넌트에서 import 하지 마라
 * (`node:fs` 를 쓰므로 번들에 섞이는 순간 빌드가 깨진다).
 * 화면에 내려보낼 값은 서버 컴포넌트에서 골라 props 로 넘긴다.
 *   ※ `server-only` 패키지는 쓰지 않았다. 그 패키지는 react-server 조건이 아닌 환경에서
 *     import 즉시 예외를 던져 vitest(node 환경) 통합 테스트가 실행 자체를 못 한다.
 *     경계는 이 주석 + "fs 를 쓰는 모듈" 이라는 사실로 지킨다.
 *
 * 설계 원칙
 *  - **검증 규칙을 두 번 쓰지 않는다.** 행 스키마·교차 검증은 `db/seed/schemas.ts` 를
 *    그대로 가져다 쓴다. `npm run seed` 가 통과시키는 데이터와 앱이 읽는 데이터가
 *    같은 규칙을 통과했음을 보장하기 위해서다. (schemas.ts 는 zod + 순수 타입만 쓰고
 *    부수효과가 없어 서버 번들에 그대로 들어가도 문제가 없다.)
 *  - **여기가 유일한 교체점이다.** Supabase 로 갈아탈 때 `loadCatalog()` 안쪽만 바꾸고
 *    `Catalog` 인터페이스를 유지하면 호출부는 손대지 않는다.
 *  - snake_case(CSV) → camelCase(엔진) 매핑은 아래 map* 함수에 전부 명시한다.
 */

import path from 'node:path';
import { readFile } from 'node:fs/promises';

import { parseCsv } from '../../../db/seed/parse';
import { formatIssue, type SeedIssue } from '../../../db/seed/report';
import {
  SEED_FILE_KEYS,
  SEED_FILE_NAMES,
  crossValidate,
  validateFile,
  type FlowerRow,
  type MeaningRow,
  type PetSafetyRow,
  type QuoteRow,
  type RuleRow,
  type SeedDataset,
  type SeedFileKey,
  type StoryRow as StoryCsvRow,
  type TemplateRow,
} from '../../../db/seed/schemas';
import type {
  FlowerData,
  PetSafetyEntry,
  RecommendationRuleRow,
} from '@/lib/engine/types';
import type {
  Catalog,
  CatalogFlower,
  CatalogMeaning,
  CatalogStory,
  MessageTemplate,
  PetSafetyRecord,
  Quote,
} from './types';

/* ------------------------------------------------------------------ *
 * 오류
 * ------------------------------------------------------------------ */

/**
 * 콘텐츠가 검증을 통과하지 못했을 때 던진다.
 * "일부만 싣고 조용히 넘어가기"는 하지 않는다 — 출처 없는 꽃말이나 끊어진 참조가
 * 화면까지 흘러가는 것보다 로드 실패가 낫다(시드 CLI 와 같은 판단).
 */
export class CatalogLoadError extends Error {
  readonly issues: SeedIssue[];

  constructor(contentDir: string, issues: SeedIssue[]) {
    const lines = issues.map((issue) => `  - ${formatIssue(issue)}`).join('\n');
    super(`콘텐츠 검증 실패 (${contentDir}) — ${issues.length}건\n${lines}`);
    this.name = 'CatalogLoadError';
    this.issues = issues;
  }
}

/* ------------------------------------------------------------------ *
 * 위치
 * ------------------------------------------------------------------ */

/**
 * CSV 디렉터리. 시드 CLI 와 같은 규칙이다(`DEARBLOOM_CONTENT_DIR` → `<cwd>/content`).
 *
 * 주의: 런타임에 파일을 읽으므로 서버리스 배포에서는 `content/` 가 함께 배포되어야 한다.
 * Supabase 연결 전까지만 유효한 임시 경로다.
 */
export function resolveContentDir(): string {
  const fromEnv = process.env.DEARBLOOM_CONTENT_DIR;
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(process.cwd(), 'content');
}

/* ------------------------------------------------------------------ *
 * snake_case → camelCase 매핑
 * ------------------------------------------------------------------ */

/** 스키마가 0~3 으로 좁혀 주지만 타입까지 좁혀 오지는 않아 여기서 한 번 확인한다. */
function toFragranceLevel(value: number, flowerId: string): FlowerData['fragranceLevel'] {
  if (value === 0 || value === 1 || value === 2 || value === 3) return value;
  throw new Error(`${flowerId}: fragrance_level 은 0~3 이어야 합니다 (받은 값: ${value})`);
}

function toPriceBand(value: number, flowerId: string): FlowerData['priceBand'] {
  if (value === 1 || value === 2 || value === 3) return value;
  throw new Error(`${flowerId}: price_band 는 1~3 이어야 합니다 (받은 값: ${value})`);
}

/** pet_safety.csv 한 행 → 꽃에 붙는 안전 판정(대체 꽃 목록은 평면 표에만 둔다). */
function toPetSafetyEntry(row: PetSafetyRow): PetSafetyEntry {
  return {
    species: row.species,
    toxic: row.toxic,
    severity: row.severity,
    toxicParts: row.toxic_parts,
    sourceUrl: row.source_url,
    reviewedAt: row.reviewed_at,
  };
}

function mapPetSafety(row: PetSafetyRow): PetSafetyRecord {
  return {
    flowerId: row.flower_id,
    ...toPetSafetyEntry(row),
    safeAlternativeFlowerIds: row.safe_alternative_flower_ids,
  };
}

function mapFlower(row: FlowerRow, petSafetyByFlower: Map<string, PetSafetyEntry[]>): CatalogFlower {
  return {
    id: row.id,
    nameKo: row.name_ko,
    nameEn: row.name_en ?? '',
    scientificName: row.scientific_name,
    colors: row.colors,
    bloomMonths: row.bloom_months,
    fragranceLevel: toFragranceLevel(row.fragrance_level, row.id),
    priceBand: toPriceBand(row.price_band, row.id),
    aestheticTags: row.aesthetic_tags,
    petSafety: petSafetyByFlower.get(row.id) ?? [],
    careSummary: row.care_summary,
  };
}

function mapMeaning(row: MeaningRow): CatalogMeaning {
  return {
    flowerId: row.flower_id,
    color: row.color,
    meaningKo: row.meaning_ko,
    cultureRegion: row.culture_region,
    era: row.era,
    sourceId: row.source_id,
    confidenceLevel: row.confidence_level,
    sourceUrl: row.source_url,
    cautionNote: row.caution_note,
  };
}

/**
 * intents 는 **빈 배열을 그대로 넘긴다.** 엔진(`pickStories`)이 "비어 있으면 모든 상황"
 * 으로 읽기 때문이다 — undefined 로 바꿔도 같은 뜻이지만, CSV 에 적힌 모양을 그대로
 * 옮기는 쪽이 데이터와 코드의 대응을 읽기 쉽다.
 */
function mapStory(row: StoryCsvRow): CatalogStory {
  return {
    storyId: row.story_id,
    flowerId: row.flower_id,
    title: row.title,
    storyKo: row.story_ko,
    cultureRegion: row.culture_region,
    era: row.era,
    sourceTitle: row.source_title,
    sourceUrl: row.source_url,
    confidenceLevel: row.confidence_level,
    storyType: row.story_type,
    sourceKind: row.source_kind,
    moods: row.moods,
    intents: row.intents,
    hook: row.hook,
    reviewedAt: row.reviewed_at,
  };
}

function mapRule(row: RuleRow): RecommendationRuleRow {
  return {
    ruleId: row.rule_id,
    relationship: row.relationship_type,
    intent: row.intent,
    occasion: row.occasion,
    apologyLevel: row.apology_level,
    aestheticTags: row.aesthetic_tags,
    budgetRange: row.budget_range,
    urgency: row.urgency,
    flowerId: row.flower_id,
    fitScore: row.fit_score,
    avoidReason: row.avoid_reason,
  };
}

function mapTemplate(row: TemplateRow): MessageTemplate {
  return {
    templateId: row.template_id,
    relationship: row.relationship_type,
    intent: row.intent,
    tone: row.tone,
    length: row.length,
    requiredApologyElements: row.required_apology_elements,
    templateText: row.template_text,
    reviewedAt: row.reviewed_at,
  };
}

/**
 * quotes.csv 한 행 → 화면이 쓰는 인용.
 *
 * **`pd_basis` 는 일부러 옮기지 않는다.** 퍼블릭 도메인 판정 근거는 편집자가 CSV 에서
 * 읽는 값이지 사용자에게 보여 줄 값이 아니다(§1.5d — 근거는 각주로, 법률 메모는 화면 밖).
 * 여기서 떨어뜨리면 `Catalog` 어디에도 실려 가지 않아 실수로 렌더될 길이 없다.
 */
function mapQuote(row: QuoteRow): Quote {
  return {
    quoteId: row.quote_id,
    flowerId: row.flower_id,
    excerptType: row.excerpt_type,
    textKo: row.text_ko,
    textOriginal: row.text_original,
    author: row.author,
    sourceTitle: row.source_title,
    sourceUrl: row.source_url,
    license: row.license,
    translator: row.translator,
    era: row.era,
    tags: row.tags,
    caveat: row.caveat,
    reviewedAt: row.reviewed_at,
  };
}

/* ------------------------------------------------------------------ *
 * 로드
 * ------------------------------------------------------------------ */

/** 파일 7종을 읽어 행 스키마 → 교차 검증까지 마친 데이터셋. */
async function readValidatedDataset(contentDir: string): Promise<SeedDataset> {
  const issues: SeedIssue[] = [];
  const dataset: Partial<Record<SeedFileKey, unknown>> = {};

  const texts = await Promise.all(
    SEED_FILE_KEYS.map(async (key) => {
      const fileName = SEED_FILE_NAMES[key];
      try {
        return { key, text: await readFile(path.join(contentDir, fileName), 'utf8') };
      } catch (error) {
        issues.push({
          file: fileName,
          line: null,
          column: '-',
          message: `파일을 읽을 수 없습니다: ${error instanceof Error ? error.message : String(error)}`,
        });
        return { key, text: null };
      }
    }),
  );

  for (const { key, text } of texts) {
    if (text === null) continue;
    const fileName = SEED_FILE_NAMES[key];
    try {
      const result = validateFile(key, parseCsv(text));
      dataset[key] = result.rows;
      issues.push(...result.issues);
    } catch (error) {
      issues.push({
        file: fileName,
        line: null,
        column: '-',
        message: `CSV 파싱 실패: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  // 교차 검증(참조 무결성·반려동물 커버리지·공유 어휘)은 모든 파일이 온전할 때만 의미가 있다.
  const allRead = SEED_FILE_KEYS.every((key) => dataset[key] !== undefined);
  if (allRead && issues.length === 0) {
    issues.push(...crossValidate(dataset as SeedDataset).issues);
  }

  if (issues.length > 0) throw new CatalogLoadError(contentDir, issues);

  return dataset as SeedDataset;
}

/** 검증된 행 묶음 → 엔진 타입. `ParsedRow` 의 줄 번호는 여기서 떨군다. */
function toCatalog(dataset: SeedDataset): Catalog {
  const petSafety = dataset.pet_safety.map((row) => mapPetSafety(row.value));

  const petSafetyByFlower = new Map<string, PetSafetyEntry[]>();
  for (const row of dataset.pet_safety) {
    const entries = petSafetyByFlower.get(row.value.flower_id) ?? [];
    entries.push(toPetSafetyEntry(row.value));
    petSafetyByFlower.set(row.value.flower_id, entries);
  }

  return {
    flowers: dataset.flowers.map((row) => mapFlower(row.value, petSafetyByFlower)),
    rules: dataset.rules.map((row) => mapRule(row.value)),
    meanings: dataset.meanings.map((row) => mapMeaning(row.value)),
    stories: dataset.stories.map((row) => mapStory(row.value)),
    templates: dataset.templates.map((row) => mapTemplate(row.value)),
    quotes: dataset.quotes.map((row) => mapQuote(row.value)),
    petSafety,
  };
}

/**
 * 모듈 레벨 메모이즈.
 *
 * 콘텐츠는 배포에 고정된 읽기 전용 데이터라 요청마다 다시 읽을 이유가 없다.
 * `cache()`(React) 대신 모듈 스코프를 쓰는 이유: `cache()` 는 요청 단위라 프로세스가
 * 살아 있는 동안 계속 다시 읽고, 렌더 밖(테스트·스크립트)에서는 캐시가 아예 안 걸린다.
 * 프로미스를 담아 두어 동시 호출도 한 번만 읽는다.
 */
let cached: { dir: string; catalog: Promise<Catalog> } | null = null;

/**
 * 콘텐츠 카탈로그를 읽는다. 검증에 실패하면 `CatalogLoadError` 를 던진다.
 *
 * 결과는 그대로 엔진에 넘길 수 있다:
 * ```ts
 * const catalog = await loadCatalog();
 * const picks = recommend({ relationship: 'lover', intent: 'apology' }, catalog);
 * const { featured } = pickStories('tulip-white', 'apology', catalog.stories);
 * ```
 */
export function loadCatalog(): Promise<Catalog> {
  const dir = resolveContentDir();
  if (cached && cached.dir === dir) return cached.catalog;

  const catalog = readValidatedDataset(dir).then(toCatalog);
  const entry = { dir, catalog };
  cached = entry;

  // 실패는 캐시하지 않는다 — 다음 호출이 디스크를 다시 읽게 비워 둔다.
  // (여기서 삼킨 건 캐시 비우기용 가지일 뿐, 호출자가 받는 프로미스는 그대로 reject 된다.)
  catalog.catch(() => {
    if (cached === entry) cached = null;
  });

  return catalog;
}

/** 테스트·스크립트용. 다음 `loadCatalog()` 가 디스크를 다시 읽게 한다. */
export function clearCatalogCache(): void {
  cached = null;
}
