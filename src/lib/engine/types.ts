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
/**
 * 이야기의 결(stories.csv 의 moods).
 * 상황에 딱 맞는 이야기가 없을 때 선별기가 대신 잡는 축이다.
 * intent → 어울리는 mood 대응표는 stories.ts 의 MOOD_AFFINITY 가 단일 원본이다.
 */
export type StoryMood = 'romantic' | 'tragic' | 'funny' | 'mythic' | 'dramatic' | 'healing';
/**
 * 이야기의 갈래(stories.csv 의 story_type) — design-spec §1.5f.
 *   folklore(설화·전승) | history(역사) | literary(문학 유래) | original(dearbloom 창작)
 * `original` 은 화면에 "dearbloom이 지어 본 이야기예요" 라벨이 필수이며,
 * 네 갈래 중 유일하게 출처(sourceUrl)가 면제된다.
 */
export type StoryType = 'folklore' | 'history' | 'literary' | 'original';
/**
 * 출처가 어떤 성격의 자료인가(stories.csv 의 source_kind) — design-spec §1.5d 개정.
 *   paper(논문) | magazine(잡지·칼럼) | museum(박물관·기관) | newspaper(신문)
 *   | book-pd(퍼블릭 도메인 고서) | garden(식물원·익스텐션) | wiki(위키·사전) | other
 *
 * `confidenceLevel` 이 "출처가 몇 개인가"라면 이쪽은 "그 하나가 무엇인가"다.
 * 화면은 둘을 함께 읽어 신뢰 문구를 고른다(`storyConfidenceLabel`).
 * 어휘의 단일 원본은 `db/seed/schemas.ts` 의 SOURCE_KINDS.
 */
export type SourceKind =
  | 'paper'
  | 'magazine'
  | 'museum'
  | 'newspaper'
  | 'book-pd'
  | 'garden'
  | 'wiki'
  | 'other';
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

/**
 * 꽃에 얽힌 이야기 한 편. stories.csv 한 행에 대응한다.
 *   moods     — 이야기의 결. 최소 1개이며 moods[0] 이 대표 분위기(목록 다양성 기준)다.
 *   intents   — 특히 어울리는 상황. **비어 있거나 없으면 "모든 상황"** 이라는 뜻이다.
 *   hook      — 본문 앞에 먼저 보여 줄 한 줄.
 *   storyType — 이야기의 갈래. 없으면 'folklore' 로 본다(CSV·DB 의 기본값과 같다).
 *   sourceUrl — storyType 이 'original' 인 창작 이야기에서만 비어 있을 수 있다.
 *               화면은 'original' 을 반드시 창작 라벨과 함께 보여 준다.
 *   sourceKind — 그 출처가 어떤 성격의 자료인가. 없으면 'other' 로 본다(CSV·DB 의 기본값과
 *               같고, 신뢰 문구가 보수적인 쪽으로 떨어진다).
 */
export interface StoryRow {
  storyId: string;
  flowerId: string;
  title: string;
  storyKo: string;
  cultureRegion?: string;
  era?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  confidenceLevel: 'repeated' | 'varies' | 'single_source';
  storyType?: StoryType;
  sourceKind?: SourceKind;
  moods: StoryMood[];
  intents?: Intent[];
  hook?: string;
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
  /**
   * 꽃별 이야기 모음. recommend() 는 이 값을 쓰지 않는다
   * (선별은 독립 함수 pickStories 가 하고, API 레이어가 추천 결과와 조합한다).
   * 데이터 묶음을 한 덩어리로 넘기려는 호출자를 위해 선택 필드로만 열어 둔다.
   */
  stories?: StoryRow[];
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

/**
 * 결과 화면에서 사용자가 색을 직접 다시 고를 수 있게 주는 선택지 한 칸.
 * 그 꽃이 실제로 나오는 색만 담고, 색별 꽃말은 출처를 찾았을 때만 채운다.
 */
export interface ColorOption {
  color: string;
  meaningKo?: string;
  sourceId?: string;
  confidenceLevel?: FlowerMeaningRow['confidenceLevel'];
  /** 엔진이 기본으로 제안한 색(colorSuggestion.color)과 같은 색인지. */
  isSuggested: boolean;
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
  /** 사용자가 직접 다시 고를 수 있는 색 목록. 색 정보가 없는 꽃이면 빈 배열. */
  colorOptions?: ColorOption[];
}

/**
 * 예산 → priceBand 매핑 규칙 (구현은 exclude.ts의 allowedPriceBands).
 *   budgetKrw.max < 30000          → band 1만 허용
 *   30000 <= budgetKrw.max < 50000 → band 1, 2 허용
 *   그 이상 또는 미지정             → band 1, 2, 3 전부 허용
 */
