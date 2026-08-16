/**
 * 콘텐츠 CSV 검증 스키마 — 공유 어휘와 행 규칙의 단일 진실 원천.
 *
 * `content/*.csv` 의 컬럼 정의, 허용 값(enum), 필수/선택 여부는 전부 여기서만 정한다.
 * DB 스키마나 앱 타입이 달라지면 이 파일을 먼저 고치고 나머지를 맞춘다.
 *
 * CSV 값은 언제나 문자열이므로, 각 필드는 "문자열 → 도메인 값" 변환 코덱을 거친다.
 *  - 파이프 배열: `red|pink` → `['red', 'pink']`
 *  - 숫자: `'92'` → `92`  (숫자가 아니면 오류)
 *  - 불리언: `'true' | 'false'` → boolean
 *  - 날짜: `YYYY-MM-DD` 형식 검사 후 문자열 유지
 *  - 빈 문자열은 "값 없음"(undefined) 으로 정규화한다. `-`, `N/A` 같은 자리표시자는 쓰지 않는다.
 */

import { z } from 'zod';
import type { CsvRecord } from './parse';
import { csvLineNumber } from './parse';
import type { CrossCheckResult, SeedIssue } from './report';

/* ------------------------------------------------------------------ *
 * 공유 어휘
 * ------------------------------------------------------------------ */

export const RELATIONSHIP_TYPES = [
  'lover',
  'spouse',
  'crush',
  'friend',
  'family',
  'colleague',
] as const;

export const INTENTS = [
  'apology',
  'confession',
  'gratitude',
  'celebration',
  'comfort',
  'anniversary',
  'just_because',
] as const;

export const TONES = ['plain', 'sincere', 'romantic', 'playful'] as const;

export const LENGTHS = ['short', 'medium'] as const;

export const SPECIES = ['cat', 'dog'] as const;

export const SEVERITIES = ['none', 'mild_gi', 'serious', 'life_threatening'] as const;

export const CONFIDENCE_LEVELS = ['repeated', 'varies', 'single_source'] as const;

export const QUOTE_LICENSES = ['pd', 'original'] as const;

/**
 * 인용문의 갈래(quotes.excerpt_type) — design-spec §1.5k(문학 연계).
 *   poem    — 시·시조·와카·하이쿠·한시
 *   novel   — 소설
 *   play    — 희곡
 *   essay   — 산문·수필
 *   classic — 어느 갈래로도 안 떨어지는 고전 원전
 *
 * §1.5k 원문은 poem·novel·play·essay 네 갈래만 적었지만, 『시경』·오비디우스 『변신
 * 이야기』·KJV 성경·『이세 이야기』처럼 **갈래 이전에 성립한 원전**이 6건 있어 `classic`
 * 을 더했다. 억지로 poem 이나 essay 로 접으면 화면 각주가 거짓말이 되기 때문이다.
 * 비워 두면 "문학 발췌가 아닌 인용"(편집팀 자작 문장 등)이라는 뜻이다.
 */
export const EXCERPT_TYPES = ['poem', 'novel', 'play', 'essay', 'classic'] as const;

/**
 * 이야기의 분위기 태그(stories.moods).
 * 상황(intent)에 딱 맞는 이야기가 없을 때, 선별기가 "이 상황이면 이런 결의 이야기"로
 * 대신 고르는 축이다. 대응표의 단일 원본은 `src/lib/engine/stories.ts` 의 MOOD_AFFINITY.
 */
export const STORY_MOODS = [
  'romantic',
  'tragic',
  'funny',
  'mythic',
  'dramatic',
  'healing',
] as const;

/**
 * 이야기의 갈래(stories.story_type) — design-spec §1.5f.
 *   folklore — 설화·전승·신화
 *   history  — 기록으로 확인되는 역사·사실
 *   literary — 특정 문학 작품에서 온 이야기
 *   original — dearbloom 창작. **화면에 "dearbloom이 지어 본 이야기예요" 라벨이 필수**이며,
 *              네 갈래 중 유일하게 출처(source_url)가 면제된다.
 */
export const STORY_TYPES = ['folklore', 'history', 'literary', 'original'] as const;

/**
 * 출처가 어떤 성격의 자료인가(stories.source_kind) — design-spec §1.5d 개정(2026-08-15).
 *   paper     — 학술 논문
 *   magazine  — 잡지·칼럼·블로그 기고
 *   museum    — 박물관·국가기록원 등 기관 자료
 *   newspaper — 신문
 *   book-pd   — 퍼블릭 도메인 고서 원문
 *   garden    — 식물원·대학 익스텐션·농업/독성 기관 자료
 *   wiki      — 위키·백과사전·정리 사이트
 *   other     — 위 어디에도 넣기 어려운 것
 *
 * **화면 문구가 여기에 매달려 있다.** `confidence_level = single_source` 라도 이 값이
 * paper·museum·book-pd·newspaper·garden 이면 "기록으로 남아 있는 이야기예요" 로 갈린다
 * (`storyConfidenceLabel`, src/components/flow/labels.ts). 1839년 원문이나 정부 보고서에
 * "드물게 전해지는" 이라는 카더라 라벨을 붙이지 않기 위한 컬럼이다 —
 * 현재 single_source 40편 중 29편(72.5%)이 그런 행이다.
 */
export const SOURCE_KINDS = [
  'paper',
  'magazine',
  'museum',
  'newspaper',
  'book-pd',
  'garden',
  'wiki',
  'other',
] as const;

/**
 * 탄생화 달력의 길이 — **윤년 기준**이다.
 *
 * 2월 29일에 태어난 사람에게 "그 날은 없습니다" 라고 할 수는 없으므로, 탄생화 표는
 * 365일이 아니라 366일이어야 한다. 실제로 조사한 두 표가 여기서 갈렸다
 * (순천만 365일 · 로얄플라워 366일 — `docs/birth-flowers-research.md` §4).
 */
export const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/** 윤년 하루 수(366). `DAYS_IN_MONTH` 와 따로 세지 않도록 여기서 한 번만 더한다. */
export const LEAP_YEAR_DAYS = DAYS_IN_MONTH.reduce((sum, days) => sum + days, 0);

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];
export type Intent = (typeof INTENTS)[number];
export type Tone = (typeof TONES)[number];
export type Length = (typeof LENGTHS)[number];
export type Species = (typeof SPECIES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];
export type QuoteLicense = (typeof QUOTE_LICENSES)[number];
export type ExcerptType = (typeof EXCERPT_TYPES)[number];
export type StoryMood = (typeof STORY_MOODS)[number];
export type StoryType = (typeof STORY_TYPES)[number];
export type SourceKind = (typeof SOURCE_KINDS)[number];

/* ------------------------------------------------------------------ *
 * 변환 코덱
 * ------------------------------------------------------------------ */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

/** 파이프 구분 문자열 → 문자열 배열. 공백만 있는 조각은 버린다. */
function splitPipe(value: string | undefined): string[] {
  if (value === undefined) return [];
  return value
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

/** 빈 문자열을 undefined 로 정규화하는 선택 문자열. */
function optionalText() {
  return z
    .string()
    .optional()
    .transform((value) => {
      const trimmed = value?.trim() ?? '';
      return trimmed === '' ? undefined : trimmed;
    });
}

function requiredText(label: string) {
  return z
    .string({ error: `${label}: 필수 값입니다` })
    .trim()
    .min(1, { error: `${label}: 필수 값입니다` });
}

function requiredSlug(label: string) {
  return requiredText(label).refine((value) => SLUG.test(value), {
    error: `${label}: 소문자·숫자·하이픈 slug 형식이어야 합니다`,
  });
}

/** 비어 있어도 되는 slug. 값이 있으면 requiredSlug 와 같은 형식을 요구한다. */
function optionalSlug(label: string) {
  return optionalText().pipe(
    z
      .string()
      .refine((value) => SLUG.test(value), {
        error: `${label}: 소문자·숫자·하이픈 slug 형식이어야 합니다`,
      })
      .optional(),
  );
}

function requiredUrl(label: string) {
  return requiredText(label).pipe(
    z.url({ error: `${label}: 올바른 URL 형식이어야 합니다` }),
  );
}

function optionalUrl(label: string) {
  return optionalText().pipe(
    z.url({ error: `${label}: 올바른 URL 형식이어야 합니다` }).optional(),
  );
}

function requiredDate(label: string) {
  return requiredText(label).refine(
    (value) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)),
    { error: `${label}: YYYY-MM-DD 형식이어야 합니다` },
  );
}

function optionalDate(label: string) {
  return optionalText().pipe(
    z
      .string()
      .refine((value) => ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)), {
        error: `${label}: YYYY-MM-DD 형식이어야 합니다`,
      })
      .optional(),
  );
}

function requiredBoolean(label: string) {
  return z
    .string({ error: `${label}: 필수 값입니다` })
    .trim()
    .refine((value) => value.toLowerCase() === 'true' || value.toLowerCase() === 'false', {
      error: `${label}: true 또는 false 여야 합니다`,
    })
    .transform((value) => value.toLowerCase() === 'true');
}

/** 정수 컬럼(범위 포함). */
function requiredInt(label: string, min: number, max: number) {
  return z
    .string({ error: `${label}: 필수 값입니다` })
    .trim()
    .refine((value) => value !== '' && Number.isFinite(Number(value)), {
      error: `${label}: 숫자여야 합니다`,
    })
    .transform(Number)
    .pipe(
      z
        .number()
        .int({ error: `${label}: 정수여야 합니다` })
        .min(min, { error: `${label}: ${min}~${max} 범위여야 합니다` })
        .max(max, { error: `${label}: ${min}~${max} 범위여야 합니다` }),
    );
}

function optionalInt(label: string, min: number, max: number) {
  return optionalText().pipe(
    z
      .string()
      .refine((value) => Number.isFinite(Number(value)), {
        error: `${label}: 숫자여야 합니다`,
      })
      .transform(Number)
      .pipe(
        z
          .number()
          .int({ error: `${label}: 정수여야 합니다` })
          .min(min, { error: `${label}: ${min}~${max} 범위여야 합니다` })
          .max(max, { error: `${label}: ${min}~${max} 범위여야 합니다` }),
      )
      .optional(),
  );
}

/** 선택 파이프 배열. 비어 있으면 빈 배열. */
function optionalList() {
  return z
    .string()
    .optional()
    .transform(splitPipe);
}

/** 최소 1개가 필요한 파이프 배열. */
function requiredList(label: string) {
  return z
    .string({ error: `${label}: 필수 값입니다` })
    .transform(splitPipe)
    .pipe(
      z.array(z.string()).min(1, { error: `${label}: 최소 1개 이상 필요합니다` }),
    );
}

/** 1~12 월 목록. */
function monthList(label: string) {
  return z
    .string({ error: `${label}: 필수 값입니다` })
    .transform(splitPipe)
    .pipe(
      z
        .array(
          z
            .string()
            .refine((value) => Number.isFinite(Number(value)), {
              error: `${label}: 숫자 목록이어야 합니다`,
            })
            .transform(Number)
            .pipe(
              z
                .number()
                .int({ error: `${label}: 정수여야 합니다` })
                .min(1, { error: `${label}: 1~12 사이의 월이어야 합니다` })
                .max(12, { error: `${label}: 1~12 사이의 월이어야 합니다` }),
            ),
        )
        .min(1, { error: `${label}: 최소 1개 이상 필요합니다` }),
    );
}

function requiredEnum<T extends readonly [string, ...string[]]>(label: string, values: T) {
  return z.enum(values, { error: `${label}: ${values.join(' | ')} 중 하나여야 합니다` });
}

function optionalEnum<T extends readonly [string, ...string[]]>(label: string, values: T) {
  return optionalText().pipe(
    z
      .enum(values, { error: `${label}: ${values.join(' | ')} 중 하나여야 합니다` })
      .optional(),
  );
}

/** 최소 1개가 필요한 파이프 배열 + 원소별 어휘 검사. */
function requiredEnumList<T extends readonly [string, ...string[]]>(label: string, values: T) {
  return z
    .string({ error: `${label}: 필수 값입니다` })
    .transform(splitPipe)
    .pipe(
      z
        .array(z.enum(values, { error: `${label}: ${values.join(' | ')} 중 하나여야 합니다` }))
        .min(1, { error: `${label}: 최소 1개 이상 필요합니다` }),
    );
}

/** 선택 파이프 배열 + 원소별 어휘 검사. 비어 있으면 빈 배열(= 조건 없음). */
function optionalEnumList<T extends readonly [string, ...string[]]>(label: string, values: T) {
  return z
    .string()
    .optional()
    .transform(splitPipe)
    .pipe(
      z.array(z.enum(values, { error: `${label}: ${values.join(' | ')} 중 하나여야 합니다` })),
    );
}

/* ------------------------------------------------------------------ *
 * 행 스키마
 * ------------------------------------------------------------------ */

/** flowers.csv — 꽃 기본 정보 */
export const FlowerRowSchema = z.object({
  id: requiredSlug('id'),
  name_ko: requiredText('name_ko'),
  name_en: optionalText(),
  scientific_name: requiredText('scientific_name'),
  colors: requiredList('colors'),
  bloom_months: monthList('bloom_months'),
  fragrance_level: requiredInt('fragrance_level', 0, 3),
  price_band: requiredInt('price_band', 1, 3),
  aesthetic_tags: optionalList(),
  care_summary: optionalText(),
  image_url: optionalUrl('image_url'),
  image_license: optionalText(),
  image_source_url: optionalUrl('image_source_url'),
  reviewed_at: requiredDate('reviewed_at'),
  reviewer: optionalText(),
  editorial_note: optionalText(),
});

/**
 * meanings.csv — 꽃말.
 * 출처 없는 꽃말은 싣지 않는다: source_id 와 source_url 이 모두 필수다.
 */
export const MeaningRowSchema = z.object({
  flower_id: requiredSlug('flower_id'),
  color: optionalText(),
  meaning_ko: requiredText('meaning_ko'),
  culture_region: optionalText(),
  era: optionalText(),
  source_id: requiredText('source_id'),
  source_url: requiredUrl('source_url'),
  confidence_level: requiredEnum('confidence_level', CONFIDENCE_LEVELS),
  caution_note: optionalText(),
  editorial_note: optionalText(),
  reviewed_at: requiredDate('reviewed_at'),
});

/**
 * rules.csv — 상황 → 꽃 매칭 규칙.
 * 추천 규칙이면 fit_score, 회피 규칙이면 avoid_reason. 둘 다이거나 둘 다 없으면 오류.
 */
export const RuleRowSchema = z
  .object({
    rule_id: requiredText('rule_id'),
    relationship_type: optionalEnum('relationship_type', RELATIONSHIP_TYPES),
    intent: optionalEnum('intent', INTENTS),
    occasion: optionalText(),
    apology_level: optionalInt('apology_level', 1, 5),
    aesthetic_tags: optionalList(),
    budget_range: optionalText(),
    urgency: optionalText(),
    flower_id: requiredSlug('flower_id'),
    fit_score: optionalInt('fit_score', 0, 100),
    avoid_reason: optionalText(),
    note: optionalText(),
  })
  .superRefine((row, ctx) => {
    const hasScore = row.fit_score !== undefined;
    const hasAvoid = row.avoid_reason !== undefined;
    if (hasScore === hasAvoid) {
      ctx.addIssue({
        code: 'custom',
        path: ['fit_score'],
        message: hasScore
          ? 'fit_score 와 avoid_reason 은 동시에 쓸 수 없습니다 (추천이면 점수, 회피면 이유 하나만)'
          : 'fit_score 또는 avoid_reason 중 하나는 반드시 있어야 합니다',
      });
    }
  });

/** templates.csv — 메시지 템플릿 */
export const TemplateRowSchema = z.object({
  template_id: requiredText('template_id'),
  relationship_type: optionalEnum('relationship_type', RELATIONSHIP_TYPES),
  intent: requiredEnum('intent', INTENTS),
  tone: requiredEnum('tone', TONES),
  length: optionalEnum('length', LENGTHS),
  required_apology_elements: optionalList(),
  template_text: requiredText('template_text'),
  reviewed_at: optionalDate('reviewed_at'),
});

/**
 * quotes.csv — 인용문.
 * 퍼블릭 도메인(pd) 주장은 근거 URL 없이 실을 수 없다.
 *
 * §1.5k 문학 연계로 6컬럼이 늘었다. 전부 **선택**이라 기존 3행(편집팀 자작 문장)은
 * 공란 그대로 통과한다 — 꽃에 매달리지 않는 범용 인용이 계속 유효하다는 뜻이다.
 *
 *   flower_id     — 이 발췌가 붙는 꽃. 비면 꽃 비연동 인용(결과 화면의 문학 블록에 안 뜬다).
 *   excerpt_type  — 갈래(EXCERPT_TYPES 주석 참조).
 *   text_original — 원어 원문. 화면에 소형으로 병기한다(§1.5e).
 *                   **번역과 원문을 한 칸에 섞지 않는 것이 이 컬럼의 존재 이유다.**
 *   translator    — 자체 번역·자체 현대어 표기이면 `dearbloom`. 한국어 원전 그대로면 공란.
 *                   기존 출판 번역은 어떤 경우에도 옮기지 않는다(원전 PD ≠ 번역 PD).
 *   caveat        — **화면에 나가는** 한 줄 각주. 종 차이·이름 혼동·판본 차이처럼,
 *                   적지 않으면 서비스가 틀린 정보를 주게 되는 사실을 담는다
 *                   (예: 김유정 「동백꽃」의 동백은 강원 방언의 생강나무다).
 *   pd_basis      — 퍼블릭 도메인 판정 근거. **데이터 레이어 전용이라 화면에 안 나간다**
 *                   (로더가 `Catalog` 로 옮기지 않는다 — src/lib/data/catalog.ts).
 */
export const QuoteRowSchema = z
  .object({
    quote_id: requiredText('quote_id'),
    flower_id: optionalSlug('flower_id'),
    excerpt_type: optionalEnum('excerpt_type', EXCERPT_TYPES),
    text_ko: requiredText('text_ko'),
    text_original: optionalText(),
    author: optionalText(),
    source_title: optionalText(),
    source_url: optionalUrl('source_url'),
    license: requiredEnum('license', QUOTE_LICENSES),
    translator: optionalText(),
    era: optionalText(),
    tags: optionalList(),
    caveat: optionalText(),
    pd_basis: optionalText(),
    reviewed_at: optionalDate('reviewed_at'),
  })
  .superRefine((row, ctx) => {
    if (row.license === 'pd' && row.source_url === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['source_url'],
        message: 'license=pd 이면 퍼블릭 도메인 근거 source_url 이 필요합니다',
      });
    }
    // 갈래를 적었으면 어느 꽃의 문학인지도 적어야 한다. 꽃 없는 발췌는 결과 화면의
    // 문학 블록이 영영 못 찾으므로, 데이터가 조용히 사장되는 것을 여기서 막는다.
    if (row.excerpt_type !== undefined && row.flower_id === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['flower_id'],
        message: 'excerpt_type 을 적었으면 어느 꽃의 발췌인지 flower_id 도 필요합니다',
      });
    }
  });

/**
 * pet_safety.csv — 반려동물 안전성.
 * 독성이 있다고 표시하면 어느 부위가 위험한지와 대체 꽃을 반드시 함께 준다.
 * (사용자에게 경고만 던지고 대안을 못 주는 상태를 막는다.)
 */
export const PetSafetyRowSchema = z
  .object({
    flower_id: requiredSlug('flower_id'),
    species: requiredEnum('species', SPECIES),
    toxic: requiredBoolean('toxic'),
    severity: requiredEnum('severity', SEVERITIES),
    toxic_parts: optionalList(),
    safe_alternative_flower_ids: optionalList(),
    source_url: requiredUrl('source_url'),
    reviewed_at: requiredDate('reviewed_at'),
  })
  .superRefine((row, ctx) => {
    if (row.toxic) {
      if (row.toxic_parts.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['toxic_parts'],
          message: 'toxic=true 이면 위험 부위를 최소 1개 적어야 합니다',
        });
      }
      if (row.safe_alternative_flower_ids.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['safe_alternative_flower_ids'],
          message: 'toxic=true 이면 대체 꽃(safe_alternative_flower_ids)을 최소 1개 적어야 합니다',
        });
      }
      if (row.severity === 'none') {
        ctx.addIssue({
          code: 'custom',
          path: ['severity'],
          message: 'toxic=true 이면 severity 가 none 일 수 없습니다',
        });
      }
    } else if (row.severity !== 'none') {
      ctx.addIssue({
        code: 'custom',
        path: ['severity'],
        message: 'toxic=false 이면 severity 는 none 이어야 합니다',
      });
    }
  });

/**
 * stories.csv — 꽃에 얽힌 일화.
 * 꽃말과 같은 원칙: 출처 없는 이야기는 싣지 않는다.
 * 어디까지 확인된 이야기인지는 confidence_level 로 말한다.
 *
 * `story_type` 은 이야기의 갈래(folklore | history | literary | original)이고,
 * **출처 규칙이 여기에 매달려 있다**: `original`(dearbloom 창작)만 source_url 이 면제되고
 * 나머지 셋은 필수다. 창작을 사실처럼 보이게 하지 않는 것이 유일한 금지선이라,
 * 출처가 없다는 사실 자체가 "이건 우리가 지어낸 이야기"라는 표시가 되게 묶어 둔다.
 * (DB 쪽 같은 규칙: 0006_story_type.sql 의 flower_stories_source_required CHECK)
 *
 * `source_kind` 는 그 출처가 **어떤 성격의 자료인지**를 말한다(논문·박물관·신문·고서 …).
 * `confidence_level` 이 "출처가 몇 개인가"라면 이쪽은 "그 하나가 무엇인가"라서, 둘을 같이
 * 봐야 화면 문구가 정직해진다 — 단일 출처라도 1839년 원문이면 "기록으로 남아 있는
 * 이야기"이지 "드물게 전해지는 이야기"가 아니다(§1.5d 개정, SOURCE_KINDS 주석 참조).
 *
 * 선별 태그 3종(선별기: `src/lib/engine/stories.ts` 의 pickStories)
 *   moods   — 이야기의 결. 최소 1개 필수. 첫 값이 대표 분위기이며 목록의 다양성 기준이 된다.
 *   intents — 이 이야기가 특히 어울리는 상황. **비워 두면 "모든 상황"** 이라는 뜻이다.
 *             (없음을 뜻하려고 자리표시자를 넣지 않는다.)
 *   hook    — 목록에서 먼저 보여 줄 한 줄 후킹 문장(선택).
 */
export const StoryRowSchema = z
  .object({
    story_id: requiredText('story_id'),
    flower_id: requiredSlug('flower_id'),
    title: requiredText('title'),
    story_ko: requiredText('story_ko'),
    culture_region: optionalText(),
    era: optionalText(),
    source_title: optionalText(),
    source_url: optionalUrl('source_url'),
    confidence_level: requiredEnum('confidence_level', CONFIDENCE_LEVELS),
    story_type: requiredEnum('story_type', STORY_TYPES),
    reviewed_at: requiredDate('reviewed_at'),
    editorial_note: optionalText(),
    moods: requiredEnumList('moods', STORY_MOODS),
    intents: optionalEnumList('intents', INTENTS),
    hook: optionalText(),
    source_kind: requiredEnum('source_kind', SOURCE_KINDS),
  })
  .superRefine((row, ctx) => {
    if (row.story_type !== 'original' && row.source_url === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['source_url'],
        message:
          'story_type=original 인 창작 이야기가 아니면 출처 source_url 이 필요합니다',
      });
    }
  });

/**
 * birth_flowers.csv — 날짜별 탄생화(366일 달력).
 *
 * **행의 주인은 꽃이 아니라 날짜다.** 366일이 카탈로그 32종보다 훨씬 많은 종을 부르고,
 * 반대로 한 종이 여러 날에 걸리기도 한다(장미 10일 · 국화 4일). 그래서 (month, day) 가
 * 자연키이고 `flower_id` 는 **도감으로 건너가는 선택 다리**다 — 비어 있는 것이 정상 값이며
 * "아직 안 정했다"는 뜻이 아니라 "카탈로그에 그 꽃이 없다"는 뜻이다.
 * (DB 쪽 같은 판단: `0010_birth_flowers.sql` 의 `flower_id … on delete set null`)
 *
 * 날짜 자체의 유효성은 여기서 보지 않는다. `month` 1~12 · `day` 1~31 만 막고,
 * **2/30 같은 조합과 366일 전수 여부는 교차 검증**(`crossValidate`)이 달력으로 본다 —
 * 한 행만 보고는 "2월은 29일까지" 를 알 수 없기 때문이다.
 *
 * DB 보다 두 칸을 더 조인다:
 *   meaning_ko — 0010 은 null 을 허용하지만 CSV 에서는 필수다. 꽃말 없는 탄생화는
 *                화면에 올릴 것이 이름뿐이라, 조용히 빈 채로 실리는 쪽을 막는다.
 *   source_url — 꽃말·일화와 같은 원칙. 출처 없는 표는 싣지 않는다.
 */
export const BirthFlowerRowSchema = z.object({
  month: requiredInt('month', 1, 12),
  day: requiredInt('day', 1, 31),
  name_ko: requiredText('name_ko'),
  name_en: optionalText(),
  scientific_name: optionalText(),
  flower_id: optionalSlug('flower_id'),
  meaning_ko: requiredText('meaning_ko'),
  source_url: requiredUrl('source_url'),
  editorial_note: optionalText(),
});

export type FlowerRow = z.output<typeof FlowerRowSchema>;
export type MeaningRow = z.output<typeof MeaningRowSchema>;
export type RuleRow = z.output<typeof RuleRowSchema>;
export type TemplateRow = z.output<typeof TemplateRowSchema>;
export type QuoteRow = z.output<typeof QuoteRowSchema>;
export type PetSafetyRow = z.output<typeof PetSafetyRowSchema>;
export type StoryRow = z.output<typeof StoryRowSchema>;
export type BirthFlowerRow = z.output<typeof BirthFlowerRowSchema>;

/* ------------------------------------------------------------------ *
 * 파일 레지스트리
 * ------------------------------------------------------------------ */

export const SEED_FILE_KEYS = [
  'flowers',
  'meanings',
  'stories',
  'rules',
  'templates',
  'quotes',
  'pet_safety',
  'birth_flowers',
] as const;

export type SeedFileKey = (typeof SEED_FILE_KEYS)[number];

export const SEED_FILE_NAMES: Record<SeedFileKey, string> = {
  flowers: 'flowers.csv',
  meanings: 'meanings.csv',
  stories: 'stories.csv',
  rules: 'rules.csv',
  templates: 'templates.csv',
  quotes: 'quotes.csv',
  pet_safety: 'pet_safety.csv',
  birth_flowers: 'birth_flowers.csv',
};

export const SEED_SCHEMAS = {
  flowers: FlowerRowSchema,
  meanings: MeaningRowSchema,
  stories: StoryRowSchema,
  rules: RuleRowSchema,
  templates: TemplateRowSchema,
  quotes: QuoteRowSchema,
  pet_safety: PetSafetyRowSchema,
  birth_flowers: BirthFlowerRowSchema,
} as const;

/* ------------------------------------------------------------------ *
 * 행 검증
 * ------------------------------------------------------------------ */

/** 검증을 통과한 행 + 원본 CSV 줄 번호(오류 리포트용). */
export interface ParsedRow<T> {
  line: number;
  value: T;
}

export interface ValidateRowsResult<T> {
  rows: ParsedRow<T>[];
  issues: SeedIssue[];
}

/**
 * CSV 레코드 배열을 스키마로 검증한다.
 * 첫 오류에서 멈추지 않고 모든 행의 오류를 모아서 돌려준다(한 번에 고칠 수 있도록).
 */
export function validateRows<T>(
  fileName: string,
  schema: z.ZodType<T>,
  records: CsvRecord[],
): ValidateRowsResult<T> {
  const rows: ParsedRow<T>[] = [];
  const issues: SeedIssue[] = [];

  records.forEach((record, index) => {
    const line = csvLineNumber(index);
    const result = schema.safeParse(record);
    if (result.success) {
      rows.push({ line, value: result.data });
      return;
    }
    for (const issue of result.error.issues) {
      issues.push({
        file: fileName,
        line,
        column: issue.path.length > 0 ? issue.path.join('.') : '-',
        message: issue.message,
      });
    }
  });

  return { rows, issues };
}

/** 파일 키 → 해당 파일의 행 타입. */
export interface SeedRowMap {
  flowers: FlowerRow;
  meanings: MeaningRow;
  stories: StoryRow;
  rules: RuleRow;
  templates: TemplateRow;
  quotes: QuoteRow;
  pet_safety: PetSafetyRow;
  birth_flowers: BirthFlowerRow;
}

/**
 * 파일 키로 검증한다. `SEED_SCHEMAS[key]` 를 유니온 키로 인덱싱하면 TS 가 행 타입을
 * 첫 멤버로 좁혀 버리므로, 키와 행 타입의 대응을 여기서 한 번만 고정한다.
 */
export function validateFile<K extends SeedFileKey>(
  key: K,
  records: CsvRecord[],
): ValidateRowsResult<SeedRowMap[K]> {
  const schema = SEED_SCHEMAS[key] as unknown as z.ZodType<SeedRowMap[K]>;
  return validateRows(SEED_FILE_NAMES[key], schema, records);
}

/* ------------------------------------------------------------------ *
 * 교차 검증
 * ------------------------------------------------------------------ */

export interface SeedDataset {
  flowers: ParsedRow<FlowerRow>[];
  meanings: ParsedRow<MeaningRow>[];
  stories: ParsedRow<StoryRow>[];
  rules: ParsedRow<RuleRow>[];
  templates: ParsedRow<TemplateRow>[];
  quotes: ParsedRow<QuoteRow>[];
  pet_safety: ParsedRow<PetSafetyRow>[];
  birth_flowers: ParsedRow<BirthFlowerRow>[];
}

export interface CrossValidateResult {
  checks: CrossCheckResult[];
  issues: SeedIssue[];
}

/**
 * 파일을 가로지르는 규칙 검증.
 *
 *  1. flower_id 참조 무결성 — meanings / stories / rules / pet_safety 가 가리키는 꽃이 flowers 에 있는가.
 *     pet_safety 가 제안하는 대체 꽃(safe_alternative_flower_ids)도 같이 본다.
 *     quotes 는 flower_id 가 **선택**이라(꽃 비연동 인용이 정상 값) 적힌 행만 골라 본다.
 *  2. 반려동물 안전성 커버리지 — 모든 꽃이 cat·dog 두 종 모두에 대해 판정을 갖는가.
 *     "모르면 표시 안 함"이 아니라 "모르면 시드 실패"로 막는다.
 *  3. 공유 어휘 일치 — rules / templates 의 relationship_type·intent·tone,
 *     그리고 stories 의 moods·intents·story_type·source_kind 가 어휘 안에 있는가.
 *     행 스키마가 이미 enum 으로 막지만, 어휘가 늘어날 때 파일마다 따로 새지 않도록
 *     "모든 파일이 같은 어휘를 쓴다"는 사실을 여기서 한 번 더 못 박는다.
 *  4. 탄생화 366일 커버리지 — 윤년 달력의 366칸이 **빠짐없이, 한 번씩** 채워졌는가.
 *     날짜가 하나라도 비면 그 생일에는 화면에 보여 줄 것이 없다. 한 행만 봐서는
 *     2/30 같은 조합을 알 수 없으므로 달력을 아는 이곳에서 본다.
 *  5. 탄생화 → 카탈로그 연결 — birth_flowers.flower_id 가 flowers 에 있는가.
 *     quotes 처럼 **선택 참조**라 빈 값은 검사 대상이 아니다(카탈로그에 없는 꽃이
 *     정상 값이다). 대신 몇 종·며칠이 도감으로 이어지는지를 리포트에 함께 적는다.
 */
export function crossValidate(data: SeedDataset): CrossValidateResult {
  const checks: CrossCheckResult[] = [];
  const issues: SeedIssue[] = [];

  const flowerIds = new Set(data.flowers.map((row) => row.value.id));
  const flowerList = `${flowerIds.size}종 (${[...flowerIds].join(', ')})`;

  /* 1. flower_id 참조 무결성 --------------------------------------- */
  const refBefore = issues.length;
  const refSources: Array<{ key: SeedFileKey; rows: ParsedRow<{ flower_id: string }>[] }> = [
    { key: 'meanings', rows: data.meanings },
    { key: 'stories', rows: data.stories },
    { key: 'rules', rows: data.rules },
    { key: 'pet_safety', rows: data.pet_safety },
  ];
  let refCount = 0;
  for (const { key, rows } of refSources) {
    for (const row of rows) {
      refCount += 1;
      if (!flowerIds.has(row.value.flower_id)) {
        issues.push({
          file: SEED_FILE_NAMES[key],
          line: row.line,
          column: 'flower_id',
          message: `flowers.csv 에 없는 꽃 id 입니다: ${row.value.flower_id}`,
        });
      }
    }
  }
  for (const row of data.pet_safety) {
    for (const alternative of row.value.safe_alternative_flower_ids) {
      refCount += 1;
      if (!flowerIds.has(alternative)) {
        issues.push({
          file: SEED_FILE_NAMES.pet_safety,
          line: row.line,
          column: 'safe_alternative_flower_ids',
          message: `flowers.csv 에 없는 대체 꽃 id 입니다: ${alternative}`,
        });
      }
    }
  }
  // quotes.flower_id 는 선택이다 — 비어 있는 행(꽃 비연동 인용)은 참조 대상이 아니다.
  for (const row of data.quotes) {
    const flowerId = row.value.flower_id;
    if (flowerId === undefined) continue;
    refCount += 1;
    if (!flowerIds.has(flowerId)) {
      issues.push({
        file: SEED_FILE_NAMES.quotes,
        line: row.line,
        column: 'flower_id',
        message: `flowers.csv 에 없는 꽃 id 입니다: ${flowerId}`,
      });
    }
  }
  const refFailures = issues.length - refBefore;
  checks.push({
    name: 'flower_id 참조 무결성',
    ok: refFailures === 0,
    detail:
      refFailures === 0
        ? `참조 ${refCount}건 모두 flowers.csv 안에 있음 — ${flowerList}`
        : `끊어진 참조 ${refFailures}건`,
  });

  /* 2. 반려동물 안전성 커버리지 ------------------------------------ */
  const coverBefore = issues.length;
  const covered = new Map<string, Set<string>>();
  for (const row of data.pet_safety) {
    const speciesSet = covered.get(row.value.flower_id) ?? new Set<string>();
    speciesSet.add(row.value.species);
    covered.set(row.value.flower_id, speciesSet);
  }
  for (const flower of data.flowers) {
    const speciesSet = covered.get(flower.value.id) ?? new Set<string>();
    const missing = SPECIES.filter((species) => !speciesSet.has(species));
    if (missing.length > 0) {
      issues.push({
        file: SEED_FILE_NAMES.flowers,
        line: flower.line,
        column: 'id',
        message: `pet_safety.csv 에 ${missing.join('·')} 판정이 없습니다 (${flower.value.id}) — 모든 꽃은 cat·dog 두 행이 모두 있어야 합니다`,
      });
    }
  }
  const coverFailures = issues.length - coverBefore;
  checks.push({
    name: '반려동물 안전성 커버리지 (cat·dog 전수)',
    ok: coverFailures === 0,
    detail:
      coverFailures === 0
        ? `${data.flowers.length}종 × ${SPECIES.length}종(cat·dog) = ${data.flowers.length * SPECIES.length}행 모두 존재`
        : `판정 누락 ${coverFailures}종`,
  });

  /* 3. 공유 어휘 일치 ----------------------------------------------- */
  const vocabBefore = issues.length;
  const relationships = new Set<string>(RELATIONSHIP_TYPES);
  const intents = new Set<string>(INTENTS);
  const tones = new Set<string>(TONES);
  const moods = new Set<string>(STORY_MOODS);
  const storyTypes = new Set<string>(STORY_TYPES);
  const sourceKinds = new Set<string>(SOURCE_KINDS);
  const excerptTypes = new Set<string>(EXCERPT_TYPES);

  const check = (
    key: SeedFileKey,
    line: number,
    column: string,
    value: string | undefined,
    allowed: Set<string>,
  ) => {
    if (value !== undefined && !allowed.has(value)) {
      issues.push({
        file: SEED_FILE_NAMES[key],
        line,
        column,
        message: `공유 어휘에 없는 값입니다: ${value}`,
      });
    }
  };

  /** 파이프 배열 컬럼(moods·intents)은 원소를 하나씩 본다. */
  const checkEach = (
    key: SeedFileKey,
    line: number,
    column: string,
    values: readonly string[],
    allowed: Set<string>,
  ) => {
    for (const value of values) check(key, line, column, value, allowed);
  };

  for (const row of data.rules) {
    check('rules', row.line, 'relationship_type', row.value.relationship_type, relationships);
    check('rules', row.line, 'intent', row.value.intent, intents);
  }
  for (const row of data.templates) {
    check('templates', row.line, 'relationship_type', row.value.relationship_type, relationships);
    check('templates', row.line, 'intent', row.value.intent, intents);
    check('templates', row.line, 'tone', row.value.tone, tones);
  }
  for (const row of data.stories) {
    checkEach('stories', row.line, 'moods', row.value.moods, moods);
    checkEach('stories', row.line, 'intents', row.value.intents, intents);
    check('stories', row.line, 'story_type', row.value.story_type, storyTypes);
    check('stories', row.line, 'source_kind', row.value.source_kind, sourceKinds);
  }
  for (const row of data.quotes) {
    check('quotes', row.line, 'excerpt_type', row.value.excerpt_type, excerptTypes);
  }
  const vocabFailures = issues.length - vocabBefore;
  checks.push({
    name: '공유 어휘 일치 (relationship·intent·tone·mood·story_type·source_kind·excerpt_type)',
    ok: vocabFailures === 0,
    detail:
      vocabFailures === 0
        ? `rules ${data.rules.length}행 · templates ${data.templates.length}행 · stories ${data.stories.length}행 · quotes ${data.quotes.length}행 모두 어휘 안에 있음`
        : `어휘 밖의 값 ${vocabFailures}건`,
  });

  /* 4. 탄생화 366일 커버리지 ---------------------------------------- */
  const calendarBefore = issues.length;
  const filled = new Map<string, number>(); // 'M/D' → 처음 채운 CSV 줄 번호
  for (const row of data.birth_flowers) {
    const { month, day } = row.value;
    const limit = DAYS_IN_MONTH[month - 1];
    if (day > limit) {
      issues.push({
        file: SEED_FILE_NAMES.birth_flowers,
        line: row.line,
        column: 'day',
        message: `${month}월은 ${limit}일까지입니다 (2월은 윤년 기준 29일)`,
      });
      continue;
    }
    const key = `${month}/${day}`;
    const first = filled.get(key);
    if (first !== undefined) {
      issues.push({
        file: SEED_FILE_NAMES.birth_flowers,
        line: row.line,
        column: 'day',
        message: `${month}월 ${day}일이 두 번 나옵니다 (앞선 행: ${first}번째 줄)`,
      });
      continue;
    }
    filled.set(key, row.line);
  }
  const missingDates: string[] = [];
  for (let month = 1; month <= 12; month += 1) {
    for (let day = 1; day <= DAYS_IN_MONTH[month - 1]; day += 1) {
      if (!filled.has(`${month}/${day}`)) missingDates.push(`${month}/${day}`);
    }
  }
  if (missingDates.length > 0) {
    // 파일 전체의 문제라 행을 짚을 수 없다(빠진 날짜에는 행이 없다).
    issues.push({
      file: SEED_FILE_NAMES.birth_flowers,
      line: null,
      column: 'month.day',
      message: `탄생화가 없는 날짜 ${missingDates.length}일: ${missingDates.slice(0, 10).join(', ')}${missingDates.length > 10 ? ' …' : ''}`,
    });
  }
  const calendarFailures = issues.length - calendarBefore;
  checks.push({
    name: '탄생화 366일 커버리지 (2/29 포함 · 중복 0)',
    ok: calendarFailures === 0,
    detail:
      calendarFailures === 0
        ? `${data.birth_flowers.length}행이 윤년 366일을 빠짐없이 한 번씩 채움`
        : `달력 결손·중복 ${calendarFailures}건 (채워진 날짜 ${filled.size}/${LEAP_YEAR_DAYS}일)`,
  });

  /* 5. 탄생화 → 카탈로그 연결 --------------------------------------- */
  const linkBefore = issues.length;
  const linkedDays = new Map<string, number>(); // flower_id → 며칠에 걸리는가
  for (const row of data.birth_flowers) {
    const flowerId = row.value.flower_id;
    if (flowerId === undefined) continue; // 카탈로그에 없는 꽃 — 정상 값
    if (!flowerIds.has(flowerId)) {
      issues.push({
        file: SEED_FILE_NAMES.birth_flowers,
        line: row.line,
        column: 'flower_id',
        message: `flowers.csv 에 없는 꽃 id 입니다: ${flowerId}`,
      });
      continue;
    }
    linkedDays.set(flowerId, (linkedDays.get(flowerId) ?? 0) + 1);
  }
  const linkedRows = [...linkedDays.values()].reduce((sum, count) => sum + count, 0);
  const linkFailures = issues.length - linkBefore;
  checks.push({
    name: '탄생화 → 카탈로그 연결 (선택 참조)',
    ok: linkFailures === 0,
    detail:
      linkFailures === 0
        ? `${linkedRows}일이 도감으로 이어짐 — 카탈로그 ${flowerIds.size}종 중 ${linkedDays.size}종 · 나머지 ${data.birth_flowers.length - linkedRows}일은 카탈로그에 없는 꽃`
        : `끊어진 참조 ${linkFailures}건`,
  });

  return { checks, issues };
}
