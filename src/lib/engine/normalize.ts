import { z } from 'zod';
import type { Intent, RecipientTrait, RecoInput, Relationship, Species, Tone } from './types';

/** 프로젝트 공유 어휘. 값 목록의 단일 소스이며 types.ts의 타입과 동기화된다. */
export const RELATIONSHIPS = [
  'lover',
  'spouse',
  'crush',
  'friend',
  'family',
  'colleague',
] as const satisfies readonly Relationship[];

export const INTENTS = [
  'apology',
  'confession',
  'gratitude',
  'celebration',
  'comfort',
  'anniversary',
  'just_because',
  // §1.5l — "직접 쓸게요". 규칙표에 짝이 없는 값이라 점수는 중립이다(score.ts).
  'other',
] as const satisfies readonly Intent[];

export const TONES = ['plain', 'sincere', 'romantic', 'playful'] as const satisfies readonly Tone[];

export const SPECIES = ['cat', 'dog'] as const satisfies readonly Species[];

/** 받는 사람의 분위기 태그. flowers.csv 의 aesthetic_tags 와 같은 어휘를 쓴다. */
export const RECIPIENT_TRAITS = [
  'calm',
  'vivid',
  'cute',
  'elegant',
  'minimal',
] as const satisfies readonly RecipientTrait[];

/**
 * 페르소나 태그의 한국어 표기 → slug.
 * 화면 라벨이 그대로 넘어와도 같은 어휘 하나로 모이게 한다.
 */
export const TRAIT_LABELS = {
  차분한: 'calm',
  화려한: 'vivid',
  귀여운: 'cute',
  우아한: 'elegant',
  미니멀: 'minimal',
} as const satisfies Record<string, RecipientTrait>;

export const relationshipSchema = z.enum(RELATIONSHIPS);
export const intentSchema = z.enum(INTENTS);
export const toneSchema = z.enum(TONES);
export const speciesSchema = z.enum(SPECIES);
export const recipientTraitSchema = z.enum(RECIPIENT_TRAITS);

/** '차분한' 같은 한국어 표기를 slug 로 옮긴다. 이미 slug 면 소문자로만 정리한다. */
function toTraitSlug(value: string): string {
  const trimmed = value.trim();
  const mapped = (TRAIT_LABELS as Record<string, RecipientTrait | undefined>)[trimmed];
  return mapped ?? trimmed.toLowerCase();
}

const isoDateSchema = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: '해석할 수 없는 날짜 형식입니다.' });

const budgetSchema = z.object({
  min: z.number().nonnegative().optional(),
  max: z.number().nonnegative().optional(),
});

/** 추천 입력 스키마. 배열/불리언 옵션은 기본값을 채워 하위 단계가 undefined를 다루지 않게 한다. */
export const recoInputSchema = z.object({
  relationship: relationshipSchema,
  intent: intentSchema,
  apologyLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
  colorPrefs: z.array(z.string()).default([]),
  dislikedFlowerIds: z.array(z.string()).default([]),
  budgetKrw: budgetSchema.optional(),
  dateISO: isoDateSchema.optional(),
  region: z.string().optional(),
  pets: z.array(speciesSchema).default([]),
  fragranceSensitive: z.boolean().default(false),
  fragrancePreference: z.boolean().default(false),
  personalCues: z.array(z.string()).default([]),
  // 한국어 라벨을 slug 로 옮긴 뒤 어휘 검사를 한다. 어휘 밖의 값은 조용히 버리지 않고 throw.
  recipientTraits: z
    .array(z.string())
    .default([])
    .transform((values) => values.map(toTraitSlug).filter((value) => value !== ''))
    .pipe(z.array(recipientTraitSchema)),
});

function cleanSlugs(values: string[]): string[] {
  const seen = new Set<string>();
  for (const v of values) {
    const s = v.trim().toLowerCase();
    if (s) seen.add(s);
  }
  return Array.from(seen);
}

function cleanTexts(values: string[]): string[] {
  const seen = new Set<string>();
  for (const v of values) {
    const s = v.trim();
    if (s) seen.add(s);
  }
  return Array.from(seen);
}

/**
 * 임의의 입력(폼/JSON)을 검증하고 기본값·표기를 정규화한다.
 * 스키마 위반이면 zod가 throw한다.
 */
export function normalizeInput(raw: unknown): RecoInput {
  const parsed = recoInputSchema.parse(raw);

  const normalized: RecoInput = {
    relationship: parsed.relationship,
    intent: parsed.intent,
    colorPrefs: cleanSlugs(parsed.colorPrefs),
    dislikedFlowerIds: cleanSlugs(parsed.dislikedFlowerIds),
    pets: Array.from(new Set(parsed.pets)),
    // 향에 민감하다는 말이 있으면 향을 좋아한다는 신호는 접는다(안전이 취향보다 앞선다).
    fragranceSensitive: parsed.fragranceSensitive,
    fragrancePreference: parsed.fragrancePreference && !parsed.fragranceSensitive,
    personalCues: cleanTexts(parsed.personalCues),
    recipientTraits: Array.from(new Set(parsed.recipientTraits)),
  };

  if (parsed.apologyLevel !== undefined) normalized.apologyLevel = parsed.apologyLevel;
  if (parsed.budgetKrw !== undefined) normalized.budgetKrw = parsed.budgetKrw;
  if (parsed.dateISO !== undefined) normalized.dateISO = parsed.dateISO;
  if (parsed.region !== undefined) normalized.region = parsed.region.trim();

  return normalized;
}

/**
 * ISO 날짜 문자열에서 월(1–12)을 뽑는다.
 * 'YYYY-MM-DD' 접두는 문자열로 직접 읽어 타임존에 따른 월 밀림을 피한다.
 */
export function monthFromISO(dateISO?: string): number | undefined {
  if (!dateISO) return undefined;
  const m = /^(\d{4})-(\d{2})/.exec(dateISO);
  if (m) {
    const month = Number(m[2]);
    return month >= 1 && month <= 12 ? month : undefined;
  }
  const parsed = Date.parse(dateISO);
  if (Number.isNaN(parsed)) return undefined;
  return new Date(parsed).getUTCMonth() + 1;
}
