import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseCsv, readCsv } from '../../db/seed/parse';
import {
  FlowerRowSchema,
  MeaningRowSchema,
  PetSafetyRowSchema,
  QuoteRowSchema,
  RuleRowSchema,
  StoryRowSchema,
  INTENTS,
  SEED_FILE_KEYS,
  SEED_FILE_NAMES,
  SEED_SCHEMAS,
  SOURCE_KINDS,
  STORY_MOODS,
  STORY_TYPES,
  crossValidate,
  validateFile,
  validateRows,
  type ExcerptType,
  type Intent,
  type SeedDataset,
  type SourceKind,
  type StoryMood,
  type StoryType,
} from '../../db/seed/schemas';
import { formatIssue, type SeedIssue } from '../../db/seed/report';

const CONTENT_DIR = path.resolve(process.cwd(), 'content');

/** content/ 전체를 읽어 행 검증까지 마친 데이터셋. */
function loadDataset() {
  const dataset: Record<string, unknown> = {};
  const issues: SeedIssue[] = [];
  for (const key of SEED_FILE_KEYS) {
    const fileName = SEED_FILE_NAMES[key];
    const records = readCsv(path.join(CONTENT_DIR, fileName));
    const result = validateFile(key, records);
    dataset[key] = result.rows;
    issues.push(...result.issues);
  }
  return { dataset: dataset as unknown as SeedDataset, issues };
}

/** 헤더 + 한 행짜리 인라인 CSV를 만들어 파싱한다. */
function oneRow(header: string, row: string) {
  const records = parseCsv(`${header}\n${row}\n`);
  expect(records).toHaveLength(1);
  return records[0];
}

const FLOWERS_HEADER =
  'id,name_ko,name_en,scientific_name,colors,bloom_months,fragrance_level,price_band,aesthetic_tags,care_summary,image_url,image_license,image_source_url,reviewed_at,reviewer,editorial_note';
const MEANINGS_HEADER =
  'flower_id,color,meaning_ko,culture_region,era,source_id,source_url,confidence_level,caution_note,editorial_note,reviewed_at';
const RULES_HEADER =
  'rule_id,relationship_type,intent,occasion,apology_level,aesthetic_tags,budget_range,urgency,flower_id,fit_score,avoid_reason,note';
const QUOTES_HEADER =
  'quote_id,flower_id,excerpt_type,text_ko,text_original,author,source_title,source_url,license,translator,era,tags,caveat,pd_basis,reviewed_at';
const PET_SAFETY_HEADER =
  'flower_id,species,toxic,severity,toxic_parts,safe_alternative_flower_ids,source_url,reviewed_at';
const STORIES_HEADER =
  'story_id,flower_id,title,story_ko,culture_region,era,source_title,source_url,confidence_level,story_type,reviewed_at,editorial_note,moods,intents,hook,source_kind';

type SafeParseLike =
  | { success: true }
  | { success: false; error: { issues: { path: PropertyKey[] }[] } };

/** 실패해야 하는 파싱 결과에서 오류가 붙은 컬럼 목록을 뽑는다. */
function failedColumns(result: SafeParseLike): string[] {
  if (result.success) {
    throw new Error('검증에 실패해야 하는 행이 통과했습니다');
  }
  return result.error.issues.map((issue) => issue.path.join('.'));
}

/* ------------------------------------------------------------------ *
 * 1. 실제 콘텐츠 파일이 전부 통과하는가
 * ------------------------------------------------------------------ */

describe('content/*.csv 실제 데이터', () => {
  it('10개 파일이 모두 행 스키마를 통과한다', () => {
    const { issues } = loadDataset();
    expect(issues.map(formatIssue)).toEqual([]);
    // 2026-08-16 에 birth_photos · birth_stories 가 들어와 8 → 10 이 됐다.
    expect(SEED_FILE_KEYS).toHaveLength(10);
  });

  it('기대한 행 수를 갖는다 (flowers 59, pet_safety 118)', () => {
    const { dataset } = loadDataset();
    expect(dataset.flowers).toHaveLength(59);
    // 불변식: pet_safety 는 꽃 수 × cat·dog. 꽃이 늘면 여기도 같이 늘어야 한다.
    expect(dataset.pet_safety).toHaveLength(dataset.flowers.length * 2);
    expect(dataset.meanings.length).toBeGreaterThanOrEqual(20);
    expect(dataset.stories.length).toBeGreaterThanOrEqual(55);
    expect(dataset.rules.length).toBeGreaterThanOrEqual(6);
    // 사과 3톤(유쾌 제외) + 나머지 7마음 × 4톤. 아래 커버리지 테스트가 그 격자를 지킨다.
    expect(dataset.templates).toHaveLength(31);
    // 편집팀 자작 3행 + §1.5k 문학 발췌 74행(한국·동아시아 43행 + 외국 문학 확장 31행).
    expect(dataset.quotes).toHaveLength(77);
  });

  it('문학 발췌 74행은 전부 꽃·갈래·퍼블릭 도메인 근거를 갖는다 (§1.5k)', () => {
    const { dataset } = loadDataset();
    const literature = dataset.quotes.filter((row) => row.value.excerpt_type !== undefined);
    expect(literature).toHaveLength(74);

    for (const row of literature) {
      // 꽃이 없으면 결과 화면의 문학 블록이 이 행을 영영 못 찾는다.
      expect(row.value.flower_id).toBeDefined();
      // 검증된 인용만 싣는다(§1.5e) — 출처 없는 발췌는 존재할 수 없다.
      expect(row.value.license).toBe('pd');
      expect(row.value.source_url).toBeDefined();
      // 판정 근거를 안 적은 pd 주장은 "그냥 옛날 거니까 괜찮겠지"와 같다.
      expect(row.value.pd_basis).toBeDefined();
    }

    // 32종 중 28종 커버. 나머지는 근대에 명명돼 고전 문학에 등장하지 않는다
    // (freesia · gerbera · babys-breath · poinsettia) — 블록을 생략하는 쪽이 맞다.
    const covered = new Set(literature.map((row) => row.value.flower_id));
    expect(covered.size).toBe(28);
    for (const id of ['freesia', 'gerbera', 'babys-breath', 'poinsettia']) {
      expect(covered.has(id)).toBe(false);
    }
  });

  it('기존 3행은 문학 컬럼이 비어 있다 (꽃 비연동 인용으로 남는다)', () => {
    const { dataset } = loadDataset();
    for (const id of ['q-001', 'q-002', 'q-003']) {
      const row = dataset.quotes.find((r) => r.value.quote_id === id);
      expect(row?.value.flower_id).toBeUndefined();
      expect(row?.value.excerpt_type).toBeUndefined();
    }
  });

  it('자체 번역·현대어 표기 행은 translator 를 밝힌다 (원전 PD ≠ 번역 PD)', () => {
    const { dataset } = loadDataset();
    // 원문이 한국어가 아닌데 옮긴이가 비어 있으면, 남의 번역을 옮겼는지 우리가 옮겼는지
    // 데이터만 보고는 알 수 없게 된다. 그 상태를 만들지 않는 것이 이 검사의 목적이다.
    const foreign = dataset.quotes.filter(
      (row) => row.value.excerpt_type !== undefined && row.value.text_original !== undefined,
    );
    expect(foreign.length).toBeGreaterThan(0);
    for (const row of foreign) {
      expect(row.value.translator).toBe('dearbloom');
    }
  });

  /*
   * 예문 격자 — **키 없는 폴백과 정적 데모의 얼굴이다.**
   *
   * LLM 키가 없으면(그리고 정적 드롭 데모에서는 언제나) 결과 화면의 멘트는 전부
   * templates.csv 에서 온다. 한 칸이라도 비면 그 마음을 고른 사람은 그 톤 탭에서
   * "이 톤의 예문은 아직 모으는 중이에요" 만 보게 되므로, 격자를 여기서 못 박는다.
   *
   * 사과만 3칸인 것은 데이터의 결손이 아니라 **화면의 규칙**이다: `buildTones` 가
   * 사과에서 유쾌 톤을 내린다(§1.5 — "사과 상황에서는 유쾌 톤을 잠시 꺼두었어요").
   * 그 자리에 행을 만들어 두면 어디에도 안 나가는 죽은 데이터가 된다.
   */
  const TONE_KEYS = ['plain', 'romantic', 'sincere', 'playful'] as const;

  /** 그 마음이 화면에 세우는 톤 = 그 마음이 가져야 하는 예문. */
  function expectedTones(intent: string): readonly string[] {
    return intent === 'apology' ? TONE_KEYS.filter((tone) => tone !== 'playful') : TONE_KEYS;
  }

  it('마음 8종 × 화면에 서는 톤 격자가 빠짐없이 찬다 (사과는 유쾌 제외)', () => {
    const { dataset } = loadDataset();
    const filled = new Set(dataset.templates.map((row) => `${row.value.intent}/${row.value.tone}`));
    for (const intent of INTENTS) {
      for (const tone of expectedTones(intent)) {
        expect(filled, `${intent}/${tone}`).toContain(`${intent}/${tone}`);
      }
    }
    // 격자 밖의 행(= 화면에 나갈 길이 없는 행)이 생기면 여기서 걸린다.
    const expected = INTENTS.reduce((sum, intent) => sum + expectedTones(intent).length, 0);
    expect(filled.size).toBe(expected);
  });

  it('사과에는 유쾌 톤 예문을 두지 않는다 (화면이 내리는 톤이라 죽은 데이터가 된다)', () => {
    const { dataset } = loadDataset();
    const playful = dataset.templates.filter(
      (row) => row.value.intent === 'apology' && row.value.tone === 'playful',
    );
    expect(playful).toEqual([]);
  });

  it('§1.5l `직접 쓸게요`(other)도 네 톤을 모두 갖는다', () => {
    const { dataset } = loadDataset();
    const rows = dataset.templates.filter((row) => row.value.intent === 'other');
    expect(rows).toHaveLength(4);
    for (const row of rows) expect(row.value.template_text.trim()).not.toBe('');
  });

  it('관계를 적어 둔 예문은 기존 사과 2행뿐이다 (나머지는 관계 중립)', () => {
    const { dataset } = loadDataset();
    // 관계를 적으면 `buildTones` 가 그 관계의 사람에게만 골라 준다. 관계 없는 행이 모든
    // 관계의 폴백이 되는 자리이므로, 확장분은 어느 사이에게도 그대로 건넬 수 있어야 한다.
    const withRelationship = dataset.templates
      .filter((row) => row.value.relationship_type !== undefined)
      .map((row) => row.value.template_id);
    expect(withRelationship).toEqual(['tpl-apology-plain', 'tpl-apology-sincere']);
  });

  it('예문은 꽃·가격을 말하지 않는다 (3안 어디에 붙어도 성립해야 한다)', () => {
    const { dataset } = loadDataset();
    // 예문은 3안(서로 다른 꽃) 아래에 그대로 붙는다. 특정 꽃이나 값을 적으면 나머지 두
    // 안에서 거짓말이 되고, 가격 언급은 §1.5i 금지선(가격 ∝ 마음)에도 걸린다.
    for (const row of dataset.templates) {
      expect(row.value.template_text, row.value.template_id).not.toMatch(
        /꽃|송이|다발|가격|원어치|만 원/,
      );
    }
  });

  it('예문은 이름 자리표시 없이 그대로 복사할 수 있다', () => {
    const { dataset } = loadDataset();
    for (const row of dataset.templates) {
      expect(row.value.template_text, row.value.template_id).not.toMatch(/[{}[\]]|OO|XX|○○/);
    }
  });

  it('32종 모두 이야기를 최소 한 편씩 갖는다', () => {
    const { dataset } = loadDataset();
    const withStories = new Set(dataset.stories.map((row) => row.value.flower_id));
    for (const flower of dataset.flowers) {
      expect(withStories).toContain(flower.value.id);
    }
  });

  it('교차 검증 7종을 모두 통과한다', () => {
    const { dataset } = loadDataset();
    const { checks, issues } = crossValidate(dataset);
    expect(issues.map(formatIssue)).toEqual([]);
    // 참조 무결성 · 반려동물 커버리지 · 공유 어휘 · 탄생화 366일 · 탄생화 도감 연결
    // · 탄생화 사진(날짜·이름·slug) · 탄생화 이야기(이름·id 공간)
    expect(checks).toHaveLength(7);
    expect(checks.every((check) => check.ok)).toBe(true);
  });

  it('CSV 문자열이 도메인 값으로 변환된다 (파이프 배열·숫자·불리언)', () => {
    const { dataset } = loadDataset();
    const rose = dataset.flowers.find((row) => row.value.id === 'rose-red');
    expect(rose?.value.colors).toEqual(['red', 'pink', 'yellow', 'white']);
    expect(rose?.value.bloom_months).toEqual([5, 6, 7, 8, 9, 10]);
    expect(rose?.value.fragrance_level).toBe(2);

    const lilyCat = dataset.pet_safety.find(
      (row) => row.value.flower_id === 'lily-asiatic' && row.value.species === 'cat',
    );
    expect(lilyCat?.value.toxic).toBe(true);
    expect(lilyCat?.value.severity).toBe('life_threatening');
    expect(lilyCat?.value.safe_alternative_flower_ids).toEqual(['freesia', 'gerbera']);

    const roseCat = dataset.pet_safety.find(
      (row) => row.value.flower_id === 'rose-red' && row.value.species === 'cat',
    );
    expect(roseCat?.value.toxic).toBe(false);
    expect(roseCat?.value.toxic_parts).toEqual([]);
  });

  it('모든 꽃말에 출처 URL이 있다', () => {
    const { dataset } = loadDataset();
    expect(dataset.meanings.length).toBeGreaterThan(0);
    for (const row of dataset.meanings) {
      expect(row.value.source_url).toMatch(/^https?:\/\//);
      expect(row.value.source_id).not.toBe('');
    }
  });

  it('tulip-white 는 문화권마다 갈리는 꽃말을 여러 행으로 갖는다', () => {
    const { dataset } = loadDataset();
    const tulip = dataset.meanings.filter((row) => row.value.flower_id === 'tulip-white');
    expect(tulip.length).toBeGreaterThanOrEqual(6);

    // 같은 흰 튤립인데 문화권마다 뜻이 다르다는 것이 이 데이터의 요점이다.
    const regions = new Set(tulip.map((row) => row.value.culture_region));
    expect(regions).toContain('turkey');
    expect(regions).toContain('netherlands');
    expect(regions).toContain('korea');
    expect(regions.size).toBeGreaterThanOrEqual(4);

    // 해석이 갈리는 행은 varies 로 표시돼 있다.
    expect(tulip.filter((row) => row.value.confidence_level === 'varies').length).toBeGreaterThanOrEqual(2);
  });

  it('창작(original)이 아닌 모든 일화에 출처 URL 과 확신 수준이 있다', () => {
    const { dataset } = loadDataset();
    expect(dataset.stories.length).toBeGreaterThan(0);
    for (const row of dataset.stories) {
      if (row.value.story_type !== 'original') {
        expect(row.value.source_url).toMatch(/^https?:\/\//);
      }
      expect(['repeated', 'varies', 'single_source']).toContain(row.value.confidence_level);
      expect(row.value.story_ko.length).toBeGreaterThan(0);
    }
  });

  it('모든 일화가 어휘 안의 story_type 을 갖는다', () => {
    const { dataset } = loadDataset();
    for (const row of dataset.stories) {
      expect(STORY_TYPES).toContain(row.value.story_type);
    }
    // 갈래가 한쪽으로만 쏠려 있으면 라벨을 둔 의미가 없다.
    const kinds = new Set(dataset.stories.map((row) => row.value.story_type));
    expect(kinds.size).toBeGreaterThanOrEqual(3);

    const typeOf = (storyId: string) =>
      dataset.stories.find((row) => row.value.story_id === storyId)?.value.story_type;
    expect(typeOf('story-rose-aphrodite')).toBe('folklore'); // 신화·전승
    expect(typeOf('story-tulip-mania')).toBe('history'); // 기록된 사건
    expect(typeOf('story-tulip-black-dumas')).toBe('literary'); // 뒤마의 소설에서 온 이야기
  });

  it('모든 일화가 어휘 안의 source_kind 를 갖는다', () => {
    const { dataset } = loadDataset();
    for (const row of dataset.stories) {
      expect(SOURCE_KINDS, `${row.value.story_id} 의 source_kind`).toContain(row.value.source_kind);
    }

    const kindOf = (storyId: string) =>
      dataset.stories.find((row) => row.value.story_id === storyId)?.value.source_kind;
    // 소급 분류(기존 196행)가 도메인별로 제대로 갈렸는지 — 갈래마다 한 편씩 확인한다.
    expect(kindOf('story-tulip-mania')).toBe('wiki'); // en.wikipedia.org
    expect(kindOf('story-iris-message-across')).toBe('book-pd'); // gutenberg.org
    expect(kindOf('story-lily-valley-heart')).toBe('garden'); // aspca.org
    expect(kindOf('story-gerbera-hundreds-in-one')).toBe('paper'); // pmc.ncbi.nlm.nih.gov
    expect(kindOf('story-camellia-jeju-43')).toBe('newspaper'); // kookje.co.kr
    // 3차 적재분 — 문서에 적힌 값 그대로.
    expect(kindOf('story-carnation-korea-1956-mothers-day')).toBe('museum'); // 국가기록원
    expect(kindOf('story-rose-monteagudo-prickles')).toBe('paper');
  });

  it('single_source 의 절반 이상이 공신력 있는 원천이다 (라벨 분화의 근거)', () => {
    const { dataset } = loadDataset();
    const documented = new Set(['paper', 'museum', 'book-pd', 'newspaper', 'garden']);
    const single = dataset.stories.filter((row) => row.value.confidence_level === 'single_source');

    expect(single.length).toBeGreaterThan(0);
    const backed = single.filter((row) => documented.has(row.value.source_kind));
    // 이 비율이 무너지면 "드물게 전해지는 이야기예요" 하나로 되돌려도 무방하다는 뜻이 된다.
    expect(backed.length / single.length).toBeGreaterThan(0.5);
  });

  it('stories 는 tulip-white 에 여러 문화권의 일화를 갖는다', () => {
    const { dataset } = loadDataset();
    const tulip = dataset.stories.filter((row) => row.value.flower_id === 'tulip-white');
    expect(tulip.length).toBeGreaterThanOrEqual(2);

    // 같은 흰 튤립인데 문화권마다 다른 이야기가 붙는다는 것이 이 데이터의 요점이다.
    const regions = new Set(tulip.map((row) => row.value.culture_region));
    expect(regions).toContain('turkey');
    expect(regions).toContain('netherlands');
    expect(regions.size).toBeGreaterThanOrEqual(3);
  });

  it('사과 상황에 붙일 이야기가 여러 꽃에 걸쳐 있다', () => {
    const { dataset } = loadDataset();
    const apology = dataset.stories.filter((row) => row.value.intents.includes('apology'));
    expect(apology.length).toBeGreaterThanOrEqual(3);
    expect(new Set(apology.map((row) => row.value.flower_id)).size).toBeGreaterThanOrEqual(2);
  });

  it('모든 일화가 어휘 안의 moods 를 1개 이상 갖는다', () => {
    const { dataset } = loadDataset();
    for (const row of dataset.stories) {
      expect(row.value.moods.length).toBeGreaterThanOrEqual(1);
      for (const mood of row.value.moods) {
        expect(STORY_MOODS).toContain(mood);
      }
    }
  });

  it('선별 태그 3종이 도메인 값으로 변환된다 (moods·intents·hook)', () => {
    const { dataset } = loadDataset();

    const mania = dataset.stories.find((row) => row.value.story_id === 'story-tulip-mania');
    expect(mania?.value.moods).toEqual(['dramatic', 'funny']);
    expect(mania?.value.intents).toEqual(['just_because']);
    expect(mania?.value.hook).toBe('알뿌리 하나가 집 한 채 값이던 시절이 있었어요.');

    // intents 를 비운 행은 빈 배열 = 모든 상황.
    const ottoman = dataset.stories.find((row) => row.value.story_id === 'story-tulip-ottoman');
    expect(ottoman?.value.moods).toEqual(['mythic']);
    expect(ottoman?.value.intents).toEqual([]);

    // 상황을 콕 집어 둔 행도 최소 하나는 있다.
    const rose = dataset.stories.find((row) => row.value.story_id === 'story-rose-aphrodite');
    expect(rose?.value.intents).toEqual(['confession', 'anniversary']);
  });
});

/* ------------------------------------------------------------------ *
 * 2. 필수 필드가 빠지면 실패하는가
 * ------------------------------------------------------------------ */

describe('필수 필드 결손 검출', () => {
  it('meanings: source_url 이 비면 실패한다', () => {
    const record = oneRow(
      MEANINGS_HEADER,
      'rose-red,red,열정적인 사랑,western,victorian,src-1,,repeated,,note,2026-08-14',
    );
    const result = MeaningRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('source_url');
  });

  it('meanings: source_url 이 URL 형식이 아니면 실패한다', () => {
    const record = oneRow(
      MEANINGS_HEADER,
      'rose-red,red,열정적인 사랑,western,victorian,src-1,어디선가 봤음,repeated,,note,2026-08-14',
    );
    const result = MeaningRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('source_url');
  });

  it('meanings: confidence_level 이 어휘 밖이면 실패한다', () => {
    const record = oneRow(
      MEANINGS_HEADER,
      'rose-red,red,열정적인 사랑,western,victorian,src-1,https://example.com/a,아마도,,note,2026-08-14',
    );
    const result = MeaningRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('confidence_level');
  });

  it('flowers: bloom_months 가 13이면 실패한다', () => {
    const record = oneRow(
      FLOWERS_HEADER,
      'rose-red,빨간 장미,Red Rose,Rosa hybrida,red,5|13,2,2,classic,,,,,2026-08-14,content-team,note',
    );
    const result = FlowerRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('bloom_months.1');
  });

  it('flowers: reviewed_at 형식이 틀리면 실패한다', () => {
    const record = oneRow(
      FLOWERS_HEADER,
      'rose-red,빨간 장미,Red Rose,Rosa hybrida,red,5,2,2,classic,,,,,2026/08/14,content-team,note',
    );
    const result = FlowerRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('reviewed_at');
  });

  it('rules: fit_score 와 avoid_reason 이 둘 다 있으면 실패한다', () => {
    const record = oneRow(
      RULES_HEADER,
      'rule-x,lover,apology,,3,minimal,2-3,normal,tulip-white,88,향이 강함,note',
    );
    const result = RuleRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('fit_score');
  });

  it('rules: fit_score 와 avoid_reason 이 둘 다 없으면 실패한다', () => {
    const record = oneRow(RULES_HEADER, 'rule-x,lover,apology,,3,minimal,2-3,normal,tulip-white,,,note');
    const result = RuleRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('fit_score');
  });

  it('rules: 둘 중 하나만 있으면 통과한다', () => {
    const withScore = oneRow(
      RULES_HEADER,
      'rule-x,lover,apology,,3,minimal,2-3,normal,tulip-white,88,,note',
    );
    expect(RuleRowSchema.safeParse(withScore).success).toBe(true);

    const withAvoid = oneRow(
      RULES_HEADER,
      'rule-y,lover,apology,,3,minimal,2-3,normal,lily-asiatic,,향이 강하고 장례 연상 가능,note',
    );
    expect(RuleRowSchema.safeParse(withAvoid).success).toBe(true);
  });

  it('rules: intent 가 어휘 밖이면 실패한다', () => {
    const record = oneRow(
      RULES_HEADER,
      'rule-x,lover,사과,,3,minimal,2-3,normal,tulip-white,88,,note',
    );
    const result = RuleRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('intent');
  });

  it('quotes: license=pd 인데 source_url 이 없으면 실패한다', () => {
    const record = oneRow(
      QUOTES_HEADER,
      'q-x,,,어떤 문장입니다.,,셰익스피어,햄릿,,pd,,1600s,comfort,,,2026-08-14',
    );
    const result = QuoteRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('source_url');
  });

  it('quotes: license=original 이면 source_url 이 없어도 통과한다', () => {
    const record = oneRow(
      QUOTES_HEADER,
      'q-x,,,어떤 문장입니다.,,DearBloom 편집팀,,,original,,modern,comfort,,,2026-08-14',
    );
    expect(QuoteRowSchema.safeParse(record).success).toBe(true);
  });

  it('quotes: 문학 컬럼이 전부 비어도 통과한다 (꽃 비연동 인용이 정상 값)', () => {
    const record = oneRow(
      QUOTES_HEADER,
      'q-x,,,꽃을 가리지 않는 문장.,,DearBloom 편집팀,,,original,,modern,comfort,,,2026-08-14',
    );
    const result = QuoteRowSchema.safeParse(record);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.flower_id).toBeUndefined();
      expect(result.data.excerpt_type).toBeUndefined();
    }
  });

  it('quotes: excerpt_type 이 어휘 밖이면 실패한다', () => {
    const record = oneRow(
      QUOTES_HEADER,
      'q-x,rose-red,haiku,어떤 발췌입니다.,orig,작가,작품,https://example.com/a,pd,dearbloom,1794,comfort,,근거,2026-08-15',
    );
    const result = QuoteRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('excerpt_type');
  });

  it('quotes: excerpt_type 을 적었는데 flower_id 가 비면 실패한다', () => {
    // 꽃이 없는 발췌는 결과 화면의 문학 블록이 영영 못 찾는다 — 조용히 사장되지 않게 막는다.
    const record = oneRow(
      QUOTES_HEADER,
      'q-x,,poem,어떤 발췌입니다.,orig,작가,작품,https://example.com/a,pd,dearbloom,1794,comfort,,근거,2026-08-15',
    );
    const result = QuoteRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('flower_id');
  });

  it('stories: 창작(original)이 아닌데 source_url 이 비면 실패한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,궁정에서 귀하게 여겼다고 전해져요.,turkey,ottoman,Wikipedia — Tulip,,repeated,folklore,2026-08-14,note,mythic,,궁정이 사랑한 꽃이었어요.,wiki',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('source_url');
  });

  it('stories: story_type=original 이면 source_url 이 없어도 통과한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,우리가 지어 본 튤립 이야기,어느 봄에 있었을 법한 이야기를 지어 봤어요.,,,,,varies,original,2026-08-14,dearbloom 창작,healing,comfort,지어낸 이야기입니다.,wiki',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.story_type).toBe('original');
    expect(result.data.source_url).toBeUndefined();
  });

  it('stories: story_type=original 이어도 출처를 적어 두면 그대로 통과한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,우리가 지어 본 튤립 이야기,어느 봄에 있었을 법한 이야기를 지어 봤어요.,,,착안한 자료,https://en.wikipedia.org/wiki/Tulip,varies,original,2026-08-14,dearbloom 창작,healing,comfort,지어낸 이야기입니다.,wiki',
    );
    expect(StoryRowSchema.safeParse(record).success).toBe(true);
  });

  it('stories: story_type 이 비면 실패한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,궁정에서 귀하게 여겼다고 전해져요.,turkey,ottoman,Wikipedia — Tulip,https://en.wikipedia.org/wiki/Tulip,repeated,,2026-08-14,note,mythic,,궁정이 사랑한 꽃이었어요.,wiki',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('story_type');
  });

  it('stories: story_type 이 어휘 밖이면 실패한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,궁정에서 귀하게 여겼다고 전해져요.,turkey,ottoman,Wikipedia — Tulip,https://en.wikipedia.org/wiki/Tulip,repeated,설화,2026-08-14,note,mythic,,궁정이 사랑한 꽃이었어요.,wiki',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('story_type');
  });

  it('stories: source_kind 가 비면 실패한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,궁정에서 귀하게 여겼다고 전해져요.,turkey,ottoman,Wikipedia — Tulip,https://en.wikipedia.org/wiki/Tulip,repeated,folklore,2026-08-14,note,mythic,,궁정이 사랑한 꽃이었어요.,',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('source_kind');
  });

  it('stories: source_kind 가 어휘 밖이면 실패한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,궁정에서 귀하게 여겼다고 전해져요.,turkey,ottoman,Wikipedia — Tulip,https://en.wikipedia.org/wiki/Tulip,repeated,folklore,2026-08-14,note,mythic,,궁정이 사랑한 꽃이었어요.,블로그',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('source_kind');
  });

  it('stories: source_url 이 URL 형식이 아니면 실패한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,궁정에서 귀하게 여겼다고 전해져요.,turkey,ottoman,어디선가 들음,들은 이야기,repeated,folklore,2026-08-14,note,mythic,,궁정이 사랑한 꽃이었어요.,wiki',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('source_url');
  });

  it('stories: story_ko 가 비면 실패한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,,turkey,ottoman,Wikipedia — Tulip,https://en.wikipedia.org/wiki/Tulip,repeated,folklore,2026-08-14,note,mythic,,궁정이 사랑한 꽃이었어요.,wiki',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('story_ko');
  });

  it('stories: confidence_level 이 어휘 밖이면 실패한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,궁정에서 귀하게 여겼다고 전해져요.,turkey,ottoman,Wikipedia — Tulip,https://en.wikipedia.org/wiki/Tulip,아마도,folklore,2026-08-14,note,mythic,,궁정이 사랑한 꽃이었어요.,wiki',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('confidence_level');
  });

  it('stories: culture_region·era·source_title 은 비어도 통과한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,궁정에서 귀하게 여겼다고 전해져요.,,,,https://en.wikipedia.org/wiki/Tulip,varies,folklore,2026-08-14,,mythic,,,wiki',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(true);
  });

  it('stories: moods 가 비면 실패한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,궁정에서 귀하게 여겼다고 전해져요.,turkey,ottoman,Wikipedia — Tulip,https://en.wikipedia.org/wiki/Tulip,varies,folklore,2026-08-14,note,,,,wiki',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('moods');
  });

  it('stories: moods 에 어휘 밖의 값이 섞이면 그 원소를 짚어 실패한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,궁정에서 귀하게 여겼다고 전해져요.,turkey,ottoman,Wikipedia — Tulip,https://en.wikipedia.org/wiki/Tulip,varies,folklore,2026-08-14,note,mythic|무서운,,,wiki',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('moods.1');
  });

  it('stories: intents 는 비어도 통과한다 (= 모든 상황)', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,궁정에서 귀하게 여겼다고 전해져요.,turkey,ottoman,Wikipedia — Tulip,https://en.wikipedia.org/wiki/Tulip,varies,folklore,2026-08-14,note,mythic|dramatic,,,wiki',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.moods).toEqual(['mythic', 'dramatic']);
    expect(result.data.intents).toEqual([]);
    expect(result.data.hook).toBeUndefined();
  });

  it('stories: intents 가 어휘 밖이면 실패한다', () => {
    const record = oneRow(
      STORIES_HEADER,
      'story-x,tulip-white,오스만 궁정의 튤립,궁정에서 귀하게 여겼다고 전해져요.,turkey,ottoman,Wikipedia — Tulip,https://en.wikipedia.org/wiki/Tulip,varies,folklore,2026-08-14,note,mythic,사과,,wiki',
    );
    const result = StoryRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('intents.0');
  });

  it('pet_safety: toxic=true 인데 대체 꽃이 없으면 실패한다', () => {
    const record = oneRow(
      PET_SAFETY_HEADER,
      'lily-asiatic,cat,true,life_threatening,flower|pollen,,https://example.com/lily,2026-08-14',
    );
    const result = PetSafetyRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('safe_alternative_flower_ids');
  });

  it('pet_safety: toxic=false 면 부위·대체 꽃이 비어 있어도 통과한다', () => {
    const record = oneRow(
      PET_SAFETY_HEADER,
      'rose-red,cat,false,none,,,https://example.com/rose,2026-08-14',
    );
    expect(PetSafetyRowSchema.safeParse(record).success).toBe(true);
  });

  it('pet_safety: species 가 어휘 밖이면 실패한다', () => {
    const record = oneRow(
      PET_SAFETY_HEADER,
      'rose-red,rabbit,false,none,,,https://example.com/rose,2026-08-14',
    );
    const result = PetSafetyRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('species');
  });
});

/* ------------------------------------------------------------------ *
 * 3. 교차 검증이 결손을 잡는가
 * ------------------------------------------------------------------ */

describe('교차 검증', () => {
  it('cat 판정이 빠진 꽃을 잡아낸다', () => {
    const { dataset } = loadDataset();
    const withoutRoseCat: SeedDataset = {
      ...dataset,
      pet_safety: dataset.pet_safety.filter(
        (row) => !(row.value.flower_id === 'rose-red' && row.value.species === 'cat'),
      ),
    };
    const { checks, issues } = crossValidate(withoutRoseCat);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((issue) => issue.message.includes('cat'))).toBe(true);
    expect(checks.find((c) => c.name.includes('반려동물'))?.ok).toBe(false);
  });

  it('flowers 에 없는 flower_id 참조를 잡아낸다', () => {
    const { dataset } = loadDataset();
    const broken: SeedDataset = {
      ...dataset,
      meanings: dataset.meanings.map((row, index) =>
        index === 0 ? { ...row, value: { ...row.value, flower_id: 'ghost-flower' } } : row,
      ),
    };
    const { checks, issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.message.includes('ghost-flower'))).toBe(true);
    expect(checks.find((c) => c.name.includes('참조'))?.ok).toBe(false);
  });

  it('stories 의 끊어진 flower_id 참조도 잡아낸다', () => {
    const { dataset } = loadDataset();
    const broken: SeedDataset = {
      ...dataset,
      stories: dataset.stories.map((row, index) =>
        index === 0 ? { ...row, value: { ...row.value, flower_id: 'ghost-flower' } } : row,
      ),
    };
    const { checks, issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.file === 'stories.csv')).toBe(true);
    expect(checks.find((c) => c.name.includes('참조'))?.ok).toBe(false);
  });

  it('quotes 의 끊어진 flower_id 참조도 잡아낸다', () => {
    const { dataset } = loadDataset();
    const target = dataset.quotes.findIndex((row) => row.value.flower_id !== undefined);
    expect(target).toBeGreaterThanOrEqual(0);
    const broken: SeedDataset = {
      ...dataset,
      quotes: dataset.quotes.map((row, index) =>
        index === target ? { ...row, value: { ...row.value, flower_id: 'ghost-flower' } } : row,
      ),
    };
    const { checks, issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.file === 'quotes.csv')).toBe(true);
    expect(checks.find((c) => c.name.includes('참조'))?.ok).toBe(false);
  });

  it('quotes 의 빈 flower_id 는 참조 검사 대상이 아니다 (꽃 비연동 인용)', () => {
    // 기존 3행은 flower_id 가 비어 있다. 그 공란을 "끊어진 참조"로 읽으면
    // 범용 인용을 실을 방법이 없어진다.
    const { dataset } = loadDataset();
    const { checks, issues } = crossValidate(dataset);
    expect(issues.filter((issue) => issue.file === 'quotes.csv')).toEqual([]);
    expect(checks.find((c) => c.name.includes('참조'))?.ok).toBe(true);
  });

  it('quotes 의 어휘 밖 excerpt_type 을 잡아낸다', () => {
    const { dataset } = loadDataset();
    const target = dataset.quotes.findIndex((row) => row.value.excerpt_type !== undefined);
    const broken: SeedDataset = {
      ...dataset,
      quotes: dataset.quotes.map((row, index) =>
        index === target
          ? { ...row, value: { ...row.value, excerpt_type: '하이쿠' as unknown as ExcerptType } }
          : row,
      ),
    };
    const { checks, issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.column === 'excerpt_type')).toBe(true);
    expect(checks.find((c) => c.name.includes('공유 어휘'))?.ok).toBe(false);
  });

  it('stories 의 어휘 밖 mood·intent 를 잡아낸다', () => {
    const { dataset } = loadDataset();
    const broken: SeedDataset = {
      ...dataset,
      stories: dataset.stories.map((row, index) =>
        index === 0
          ? {
              ...row,
              value: {
                ...row.value,
                moods: ['무서운' as unknown as StoryMood],
                intents: ['사과' as unknown as Intent],
              },
            }
          : row,
      ) as typeof dataset.stories,
    };
    const { checks, issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.message.includes('무서운'))).toBe(true);
    expect(issues.some((issue) => issue.column === 'intents')).toBe(true);
    expect(checks.find((c) => c.name.includes('공유 어휘'))?.ok).toBe(false);
  });

  it('stories 의 어휘 밖 story_type 을 잡아낸다', () => {
    const { dataset } = loadDataset();
    const broken: SeedDataset = {
      ...dataset,
      stories: dataset.stories.map((row, index) =>
        index === 0
          ? { ...row, value: { ...row.value, story_type: '설화' as unknown as StoryType } }
          : row,
      ) as typeof dataset.stories,
    };
    const { checks, issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.column === 'story_type')).toBe(true);
    expect(checks.find((c) => c.name.includes('공유 어휘'))?.ok).toBe(false);
  });

  it('stories 의 어휘 밖 source_kind 를 잡아낸다', () => {
    const { dataset } = loadDataset();
    const broken: SeedDataset = {
      ...dataset,
      stories: dataset.stories.map((row, index) =>
        index === 0
          ? { ...row, value: { ...row.value, source_kind: '블로그' as unknown as SourceKind } }
          : row,
      ) as typeof dataset.stories,
    };
    const { checks, issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.column === 'source_kind')).toBe(true);
    expect(checks.find((c) => c.name.includes('공유 어휘'))?.ok).toBe(false);
  });

  it('오류 메시지가 [파일명:행번호] 컬럼 — 메시지 형식이다', () => {
    const issue = {
      file: 'meanings.csv',
      line: 4,
      column: 'source_url',
      message: '필수 값입니다',
    };
    expect(formatIssue(issue)).toBe('[meanings.csv:4] source_url — 필수 값입니다');
  });

  it('행 번호는 헤더를 1번 줄로 세어 붙는다', () => {
    const records = parseCsv(
      `${QUOTES_HEADER}\nq-1,,,좋은 문장.,,,,,original,,modern,,,,2026-08-14\nq-2,,,,,,,,original,,modern,,,,2026-08-14\n`,
    );
    const { rows, issues } = validateRows('quotes.csv', SEED_SCHEMAS.quotes, records);
    expect(rows).toHaveLength(1);
    expect(issues).toHaveLength(1);
    // 두 번째 데이터 행 = 파일의 3번째 줄
    expect(issues[0].line).toBe(3);
    expect(issues[0].column).toBe('text_ko');
  });
});

/* ------------------------------------------------------------------ *
 * 4. BOM 내성
 * ------------------------------------------------------------------ */

describe('BOM 처리', () => {
  it('BOM 유무와 무관하게 같은 결과를 낸다 (인라인 문자열)', () => {
    const csv = `${MEANINGS_HEADER}\nrose-red,red,열정적인 사랑,western,victorian,src-1,https://example.com/a,repeated,,note,2026-08-14\n`;
    const plain = parseCsv(csv);
    const withBom = parseCsv(`﻿${csv}`);

    expect(Object.keys(withBom[0])).toEqual(Object.keys(plain[0]));
    expect(withBom).toEqual(plain);
    expect(withBom[0].flower_id).toBe('rose-red');
  });

  it('BOM 이 붙어도 첫 컬럼명이 깨지지 않는다', () => {
    const withBom = parseCsv(
      `﻿${PET_SAFETY_HEADER}\nrose-red,cat,false,none,,,https://example.com/rose,2026-08-14\n`,
    );
    expect(withBom[0]).toHaveProperty('flower_id');
    expect(PetSafetyRowSchema.safeParse(withBom[0]).success).toBe(true);
  });

  it('BOM 이 붙은 내용도 스키마 검증을 통과한다', () => {
    const csv = `﻿${FLOWERS_HEADER}\nfreesia,프리지아,Freesia,Freesia refracta,yellow|white,2|3|4,3,1,fresh,,,,,2026-08-14,content-team,seed-sample\n`;
    const result = validateRows('flowers.csv', SEED_SCHEMAS.flowers, parseCsv(csv));
    expect(result.issues).toEqual([]);
    expect(result.rows[0].value.id).toBe('freesia');
    expect(result.rows[0].value.bloom_months).toEqual([2, 3, 4]);
  });

  it('실제 파일은 BOM 없이 저장돼 있고, BOM 을 붙여도 같은 결과가 나온다', () => {
    const filePath = path.join(CONTENT_DIR, 'pet_safety.csv');
    const raw = readFileSync(filePath, 'utf8');
    expect(raw.startsWith('﻿')).toBe(false); // 저장 규칙: UTF-8 BOM 없음

    const fromFile = readCsv(filePath);
    const withBom = parseCsv(`﻿${raw}`);
    expect(withBom).toEqual(fromFile);
    expect(withBom).toHaveLength(118);
  });
});
