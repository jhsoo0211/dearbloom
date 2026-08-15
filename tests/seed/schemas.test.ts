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
  SEED_FILE_KEYS,
  SEED_FILE_NAMES,
  SEED_SCHEMAS,
  SOURCE_KINDS,
  STORY_MOODS,
  STORY_TYPES,
  crossValidate,
  validateFile,
  validateRows,
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
  'quote_id,text_ko,author,source_title,source_url,license,era,tags,reviewed_at';
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
  it('7개 파일이 모두 행 스키마를 통과한다', () => {
    const { issues } = loadDataset();
    expect(issues.map(formatIssue)).toEqual([]);
  });

  it('기대한 행 수를 갖는다 (flowers 31, pet_safety 62)', () => {
    const { dataset } = loadDataset();
    expect(dataset.flowers).toHaveLength(31);
    // 불변식: pet_safety 는 꽃 수 × cat·dog. 꽃이 늘면 여기도 같이 늘어야 한다.
    expect(dataset.pet_safety).toHaveLength(dataset.flowers.length * 2);
    expect(dataset.meanings.length).toBeGreaterThanOrEqual(20);
    expect(dataset.stories.length).toBeGreaterThanOrEqual(55);
    expect(dataset.rules.length).toBeGreaterThanOrEqual(6);
    expect(dataset.templates).toHaveLength(3);
    expect(dataset.quotes).toHaveLength(3);
  });

  it('31종 모두 이야기를 최소 한 편씩 갖는다', () => {
    const { dataset } = loadDataset();
    const withStories = new Set(dataset.stories.map((row) => row.value.flower_id));
    for (const flower of dataset.flowers) {
      expect(withStories).toContain(flower.value.id);
    }
  });

  it('교차 검증 3종을 모두 통과한다', () => {
    const { dataset } = loadDataset();
    const { checks, issues } = crossValidate(dataset);
    expect(issues.map(formatIssue)).toEqual([]);
    expect(checks).toHaveLength(3);
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
      'q-x,어떤 문장입니다.,셰익스피어,햄릿,,pd,1600s,comfort,2026-08-14',
    );
    const result = QuoteRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('source_url');
  });

  it('quotes: license=original 이면 source_url 이 없어도 통과한다', () => {
    const record = oneRow(
      QUOTES_HEADER,
      'q-x,어떤 문장입니다.,DearBloom 편집팀,,,original,modern,comfort,2026-08-14',
    );
    expect(QuoteRowSchema.safeParse(record).success).toBe(true);
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
      `${QUOTES_HEADER}\nq-1,좋은 문장.,,,,original,modern,,2026-08-14\nq-2,,,,,original,modern,,2026-08-14\n`,
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
    expect(withBom).toHaveLength(62);
  });
});
