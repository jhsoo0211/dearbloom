import { z } from 'zod';
import type { Intent, RecoInput, Relationship, Species, Tone } from './types';

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
] as const satisfies readonly Intent[];

export const TONES = ['plain', 'sincere', 'romantic', 'playful'] as const satisfies readonly Tone[];

export const SPECIES = ['cat', 'dog'] as const satisfies readonly Species[];

export const relationshipSchema = z.enum(RELATIONSHIPS);
export const intentSchema = z.enum(INTENTS);
export const toneSchema = z.enum(TONES);
export const speciesSchema = z.enum(SPECIES);

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
  personalCues: z.array(z.string()).default([]),
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
    fragranceSensitive: parsed.fragranceSensitive,
    personalCues: cleanTexts(parsed.personalCues),
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
