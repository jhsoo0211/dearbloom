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
/**
 * 받는 사람의 분위기·취향 태그(페르소나).
 * 화면의 한국어 라벨은 normalize.ts 의 TRAIT_LABELS 가 이 slug 로 옮긴다.
 *   calm(차분한) | vivid(화려한) | cute(귀여운) | elegant(우아한) | minimal(미니멀)
 * flowers.csv 의 aesthetic_tags 도 같은 어휘를 쓴다.
 */
export type RecipientTrait = 'calm' | 'vivid' | 'cute' | 'elegant' | 'minimal';
export type Species = 'cat' | 'dog';
export type Severity = 'none' | 'mild_gi' | 'serious' | 'life_threatening';
export type SeasonStatus = 'in_season' | 'limited' | 'out_of_season' | 'unknown';

/**
 * 규칙 식별자. 현재 사용 중인 값:
 * 'EX_PET_TOXIC' | 'EX_BUDGET' | 'EX_DISLIKED' | 'EX_FRAGRANCE'
 * | 'SC_INTENT' | 'SC_RELATIONSHIP' | 'SC_SEASON' | 'SC_AESTHETIC' | 'SC_PERSONA'
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
  /** 받는 사람의 분위기·취향 태그. RecipientTrait slug 배열이며 미지정도 허용한다. */
  recipientTraits?: string[];
}

/**
 * 꽃말 한 줄. meanings.csv 한 행에 대응한다.
 *   color          — 비어 있으면 색을 가리지 않는 꽃 전체의 꽃말
 *   cultureRegion  — 'turkey' / 'netherlands' / 'korea' 처럼 해석이 갈리는 문화권
 */
export interface FlowerMeaningRow {
  flowerId: string;
  color?: string;
  meaningKo: string;
  cultureRegion?: string;
  era?: string;
  sourceId: string;
  confidenceLevel: 'repeated' | 'varies' | 'single_source';
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
  /** 색상 추천에 쓰는 꽃말 표. 없으면 색은 제안하되 꽃말은 비워 둔다. */
  meanings?: FlowerMeaningRow[];
}

export interface Weights {
  I: number;
  R: number;
  S: number;
  A: number;
  P: number;
  D: number;
}

/**
 * "이 꽃은 무슨 색으로" 제안.
 * meaningKo/sourceId 는 해당 색의 꽃말을 찾았을 때만 채운다(출처 없는 꽃말은 싣지 않는다).
 */
export interface ColorSuggestion {
  color: string;
  meaningKo?: string;
  sourceId?: string;
  /** 그 색을 고른 근거 한 문장. */
  reason: string;
}

export interface RecoResult {
  flower: FlowerRef;
  fitScore: number;
  reasons: RuleId[];
  cautions: string[];
  substitutes: FlowerRef[];
  availability: SeasonStatus;
  /** 색 정보가 아예 없는 꽃이면 null. */
  colorSuggestion?: ColorSuggestion | null;
}

/**
 * 예산 → priceBand 매핑 규칙 (구현은 exclude.ts의 allowedPriceBands).
 *   budgetKrw.max < 30000          → band 1만 허용
 *   30000 <= budgetKrw.max < 50000 → band 1, 2 허용
 *   그 이상 또는 미지정             → band 1, 2, 3 전부 허용
 */
