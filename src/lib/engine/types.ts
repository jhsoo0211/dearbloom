/**
 * 추천 엔진 공용 타입.
 * 프로젝트 단일 어휘(relationship 6종 / intent 7종 / tone 4종 / species 2종 ...)의 원본이다.
 * 순수 TS만 사용한다 — Next/React/DB/fetch 의존 금지.
 */

export type Relationship = 'lover' | 'spouse' | 'crush' | 'friend' | 'family' | 'colleague';
export type Intent =
  | 'apology'
  | 'confession'
  | 'gratitude'
  | 'celebration'
  | 'comfort'
  | 'anniversary'
  | 'just_because';
export type Tone = 'plain' | 'sincere' | 'romantic' | 'playful';
export type Species = 'cat' | 'dog';
export type Severity = 'none' | 'mild_gi' | 'serious' | 'life_threatening';
export type SeasonStatus = 'in_season' | 'limited' | 'out_of_season' | 'unknown';

/**
 * 규칙 식별자. 현재 사용 중인 값:
 * 'EX_PET_TOXIC' | 'EX_BUDGET' | 'EX_DISLIKED' | 'EX_FRAGRANCE'
 * | 'SC_INTENT' | 'SC_RELATIONSHIP' | 'SC_SEASON' | 'SC_AESTHETIC'
 * CSV/DB에서 새 규칙이 유입될 수 있어 string으로 열어 둔다.
 */
export type RuleId = string;

export interface FlowerRef {
  id: string;
  nameKo: string;
}

export interface PetSafetyEntry {
  species: Species;
  toxic: boolean;
  severity: Severity;
  toxicParts: string[];
  sourceUrl: string;
  reviewedAt: string;
}

export interface FlowerData extends FlowerRef {
  nameEn: string;
  scientificName: string;
  colors: string[];
  bloomMonths: number[]; // 1–12
  fragranceLevel: 0 | 1 | 2 | 3;
  priceBand: 1 | 2 | 3;
  aestheticTags: string[];
  petSafety: PetSafetyEntry[];
}

export interface RecoInput {
  relationship: Relationship;
  intent: Intent;
  apologyLevel?: 0 | 1 | 2 | 3;
  colorPrefs?: string[];
  dislikedFlowerIds?: string[];
  budgetKrw?: { min?: number; max?: number };
  dateISO?: string;
  region?: string;
  pets?: Species[];
  fragranceSensitive?: boolean;
  personalCues?: string[];
}

export interface RecommendationRuleRow {
  ruleId: RuleId;
  relationship?: Relationship;
  intent?: Intent;
  occasion?: string;
  apologyLevel?: number;
  aestheticTags?: string[];
  budgetRange?: string;
  urgency?: string;
  flowerId: string;
  fitScore?: number;
  avoidReason?: string;
}

export interface RuleSet {
  flowers: FlowerData[];
  rules: RecommendationRuleRow[];
}

export interface Weights {
  I: number;
  R: number;
  S: number;
  A: number;
  P: number;
  D: number;
}

export interface RecoResult {
  flower: FlowerRef;
  fitScore: number;
  reasons: RuleId[];
  cautions: string[];
  substitutes: FlowerRef[];
  availability: SeasonStatus;
}

/**
 * 예산 → priceBand 매핑 규칙 (구현은 exclude.ts의 allowedPriceBands).
 *   budgetKrw.max < 30000          → band 1만 허용
 *   30000 <= budgetKrw.max < 50000 → band 1, 2 허용
 *   그 이상 또는 미지정             → band 1, 2, 3 전부 허용
 */
