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
  type BirthFlowerRow,
  type BirthPhotoRow,
  type BirthStoryRow,
  type FlowerRow,
  type MeaningRow,
  type PetSafetyRow,
  type QuoteRow,
  type OccasionRow,
  type ReadRow,
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
  BirthFlower,
  BirthPhoto,
  BirthStory,
  Catalog,
  CatalogFlower,
  CatalogMeaning,
  CatalogStory,
  CatalogOccasion,
  CatalogRead,
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

/**
 * birth_flowers.csv 한 행 → 화면이 쓰는 탄생화.
 *
 * **`editorial_note` 는 일부러 옮기지 않는다**(`mapQuote` 의 `pd_basis` 와 같은 판단).
 * 158행에 붙어 있는 메모는 두 표의 표기 차이·철자 교정 같은 **편집·감사 기록**이라
 * 사용자에게 보여 줄 값이 아니다(조사 문서 §8-4). 여기서 떨어뜨리면 `Catalog` 어디에도
 * 실려 가지 않아 실수로 렌더될 길이 없다.
 *
 * 선택 컬럼은 빈 문자열로 메우지 않고 **키 자체를 만들지 않는다** — `''` 를 넣으면
 * 화면이 "영문명이 있는데 비어 있다"와 "영문명이 없다"를 구별하지 못한다.
 */
function mapBirthFlower(row: BirthFlowerRow): BirthFlower {
  return {
    month: row.month,
    day: row.day,
    nameKo: row.name_ko,
    ...(row.name_en ? { nameEn: row.name_en } : {}),
    ...(row.scientific_name ? { scientificName: row.scientific_name } : {}),
    ...(row.flower_id ? { flowerId: row.flower_id } : {}),
    meaningKo: row.meaning_ko,
    sourceUrl: row.source_url,
  };
}

/**
 * birth_photos.csv 한 행 → 화면이 쓰는 사진.
 *
 * **`species_note` 는 일부러 옮기지 않는다**(`mapBirthFlower` 의 `editorial_note` 와 같은
 * 판단). 종 동정 판정 근거는 편집자가 CSV 에서 읽는 값이지 사용자에게 보여 줄 값이 아니다 —
 * `Catalog` 에 싣지 않으면 실수로 렌더될 길이 없다.
 *
 * `direct_url` 은 옮긴다. 화면은 쓰지 않지만(자체 호스팅 사본을 건다) 재다운로드 스크립트가
 * 이 값을 읽어 파일을 다시 받는다 — 그쪽도 `loadCatalog()` 를 통과해 같은 검증을 받는다.
 */
function mapBirthPhoto(row: BirthPhotoRow): BirthPhoto {
  return {
    month: row.month,
    day: row.day,
    nameKo: row.name_ko,
    ...(row.slug ? { slug: row.slug } : {}),
    ...(row.commons_page_url ? { pageUrl: row.commons_page_url } : {}),
    ...(row.direct_url ? { directUrl: row.direct_url } : {}),
    ...(row.author ? { author: row.author } : {}),
    ...(row.license ? { license: row.license } : {}),
    ...(row.width !== undefined ? { width: row.width } : {}),
    ...(row.family_line ? { familyLine: row.family_line } : {}),
  };
}

/**
 * birth_stories.csv 한 행 → 화면이 쓰는 이야기.
 *
 * `editorial_note` 는 옮기지 않는다(위와 같은 판단). CSV 의 `confidence` 는 여기서
 * `confidenceLevel` 로 합류한다 — 화면 라벨(`storyConfidenceLabel`)이 카탈로그 이야기와
 * **같은 함수**를 쓰기 때문이다. 두 표가 다른 이름을 들고 다니면 그 함수가 두 벌이 된다.
 */
function mapBirthStory(row: BirthStoryRow): BirthStory {
  return {
    nameKo: row.name_ko,
    storyId: row.story_id,
    title: row.title,
    ...(row.hook ? { hook: row.hook } : {}),
    storyKo: row.story_ko,
    ...(row.culture_region ? { cultureRegion: row.culture_region } : {}),
    ...(row.era ? { era: row.era } : {}),
    storyType: row.story_type,
    sourceKind: row.source_kind,
    ...(row.source_url ? { sourceUrl: row.source_url } : {}),
    confidenceLevel: row.confidence,
  };
}

/**
 * reads.csv 한 행 → 화면이 쓰는 읽을거리.
 *
 * **`editorial_note` 는 일부러 옮기지 않는다**(`mapQuote` 의 `pd_basis` 와 같은 판단).
 * 채택 근거·봇 차단 이력·왜 그 꽃을 안 이었는지는 편집자가 CSV 에서 읽는 값이다.
 * 그 칸이 화면에 안 나간다는 사실이 곧 조사 문서 §3-4 의 규범(사용자의 결정을 바꾸는
 * 사실은 `summary_ko`·`access` 로 올린다)이 존재하는 이유이므로, 여기서 떨어뜨려
 * **실수로 렌더될 길 자체를 없앤다.**
 *
 * 선택 컬럼은 빈 문자열로 메우지 않고 **키 자체를 만들지 않는다**(`mapBirthFlower` 와 같다).
 */
function mapRead(row: ReadRow): CatalogRead {
  return {
    readId: row.read_id,
    kind: row.kind,
    title: row.title,
    sourceTitle: row.source_title,
    ...(row.author ? { author: row.author } : {}),
    sourceUrl: row.source_url,
    ...(row.published_at ? { publishedAt: row.published_at } : {}),
    ...(row.starts_at ? { startsAt: row.starts_at } : {}),
    ...(row.ends_at ? { endsAt: row.ends_at } : {}),
    ...(row.region ? { region: row.region } : {}),
    summaryKo: row.summary_ko,
    access: row.access,
    confidenceLevel: row.confidence,
    reviewedAt: row.reviewed_at,
    tags: row.tags,
    linksTo: row.links_to,
  };
}

/**
 * occasions.csv 한 행 → 상황 예시 한 줄.
 *
 * `source_note` 는 옮기지 않는다 — 편집 메모지 화면 값이 아니다(`pd_basis` 와 같은 처리).
 * `surface` 는 빈 칸을 `undefined` 가 아니라 **빈 문자열**로 받는다: 여기서 뜻하는 것이
 * "값이 없다" 가 아니라 "모든 화면" 이라는 **하나의 값**이라서다.
 */
function mapOccasion(row: OccasionRow): CatalogOccasion {
  return {
    flowerId: row.flower_id,
    surface: row.surface ?? '',
    occasionKo: row.occasion_ko,
  };
}

/* ------------------------------------------------------------------ *
 * 로드
 * ------------------------------------------------------------------ */

/** 파일 12종을 읽어 행 스키마 → 교차 검증까지 마친 데이터셋. */
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
    // CSV 순서(1월 1일 → 12월 31일) 그대로다. 조회는 `@/lib/data/birth-flowers` 가 맡는다.
    birthFlowers: dataset.birth_flowers.map((row) => mapBirthFlower(row.value)),
    birthPhotos: dataset.birth_photos.map((row) => mapBirthPhoto(row.value)),
    birthStories: dataset.birth_stories.map((row) => mapBirthStory(row.value)),
    // CSV 순서 그대로다. **만료 판정은 여기서 하지 않는다** — 서버가 거르면 그 판정이
    // 정적 HTML 에 굳는다(조사 문서 §7-2). 화면 순서와 거르기는 `/reads` 가 맡는다.
    reads: dataset.reads.map((row) => mapRead(row.value)),
    // CSV 순서 그대로다 — 그 순서가 화면에 서는 순서다(`occasionsFor` 는 다시 정렬하지 않는다).
    occasions: dataset.occasions.map((row) => mapOccasion(row.value)),
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
