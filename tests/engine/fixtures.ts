import type {
  FlowerData,
  FlowerMeaningRow,
  RecoInput,
  RecommendationRuleRow,
  RuleSet,
} from '@/lib/engine/types';

/**
 * 엔진 테스트용 인라인 미니 데이터셋.
 * 실제 콘텐츠 CSV와는 독립이며(파일을 읽지 않는다), 규칙 동작 검증에 필요한 최소한만 담는다.
 *
 * aestheticTags 는 앞쪽 2개가 원래의 분위기 표현이고, 뒤에 페르소나 어휘
 * (calm/vivid/cute/elegant/minimal)를 덧붙여 두었다. 다양성 단계가 첫 태그만 보므로
 * 뒤에 붙이면 기존 추천 순서를 건드리지 않는다.
 */

const ASPCA = 'https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants';
const REVIEWED_AT = '2026-01-15';

export const testFlowers: FlowerData[] = [
  {
    id: 'lily-asiatic',
    nameKo: '아시아틱 릴리',
    nameEn: 'Asiatic Lily',
    scientificName: 'Lilium asiatica',
    colors: ['white', 'pink', 'orange'],
    bloomMonths: [5, 6, 7],
    fragranceLevel: 2,
    priceBand: 2,
    aestheticTags: ['elegant', 'statement', 'vivid'],
    petSafety: [
      {
        species: 'cat',
        toxic: true,
        severity: 'life_threatening',
        toxicParts: ['flower', 'leaf', 'pollen', 'vase water'],
        sourceUrl: `${ASPCA}/lily`,
        reviewedAt: REVIEWED_AT,
      },
      {
        species: 'dog',
        toxic: true,
        severity: 'mild_gi',
        toxicParts: ['flower', 'leaf'],
        sourceUrl: `${ASPCA}/lily`,
        reviewedAt: REVIEWED_AT,
      },
    ],
  },
  {
    id: 'freesia',
    nameKo: '프리지아',
    nameEn: 'Freesia',
    scientificName: 'Freesia refracta',
    colors: ['yellow', 'white', 'purple'],
    bloomMonths: [2, 3, 4],
    fragranceLevel: 3,
    priceBand: 1,
    aestheticTags: ['fresh', 'light', 'calm'],
    petSafety: [
      {
        species: 'cat',
        toxic: false,
        severity: 'none',
        toxicParts: [],
        sourceUrl: `${ASPCA}/freesia`,
        reviewedAt: REVIEWED_AT,
      },
      {
        species: 'dog',
        toxic: false,
        severity: 'none',
        toxicParts: [],
        sourceUrl: `${ASPCA}/freesia`,
        reviewedAt: REVIEWED_AT,
      },
    ],
  },
  {
    id: 'tulip-white',
    nameKo: '흰 튤립',
    nameEn: 'White Tulip',
    scientificName: 'Tulipa gesneriana',
    colors: ['white'],
    bloomMonths: [3, 4, 5],
    fragranceLevel: 1,
    priceBand: 2,
    aestheticTags: ['clean', 'modern', 'minimal', 'calm'],
    petSafety: [
      {
        species: 'cat',
        toxic: true,
        severity: 'mild_gi',
        toxicParts: ['bulb'],
        sourceUrl: `${ASPCA}/tulip`,
        reviewedAt: REVIEWED_AT,
      },
      {
        species: 'dog',
        toxic: true,
        severity: 'mild_gi',
        toxicParts: ['bulb'],
        sourceUrl: `${ASPCA}/tulip`,
        reviewedAt: REVIEWED_AT,
      },
    ],
  },
  {
    id: 'rose-red',
    nameKo: '빨간 장미',
    nameEn: 'Red Rose',
    scientificName: 'Rosa hybrida',
    colors: ['red'],
    bloomMonths: [5, 6, 7, 8, 9, 10],
    fragranceLevel: 2,
    priceBand: 3,
    aestheticTags: ['romantic', 'classic', 'vivid'],
    petSafety: [
      {
        species: 'cat',
        toxic: false,
        severity: 'none',
        toxicParts: [],
        sourceUrl: `${ASPCA}/rose`,
        reviewedAt: REVIEWED_AT,
      },
      {
        species: 'dog',
        toxic: false,
        severity: 'none',
        toxicParts: [],
        sourceUrl: `${ASPCA}/rose`,
        reviewedAt: REVIEWED_AT,
      },
    ],
  },
  {
    id: 'gerbera',
    nameKo: '거베라',
    nameEn: 'Gerbera Daisy',
    scientificName: 'Gerbera jamesonii',
    colors: ['pink', 'yellow', 'orange', 'red'],
    bloomMonths: [4, 5, 6, 7, 8, 9, 10],
    fragranceLevel: 0,
    priceBand: 1,
    aestheticTags: ['cheerful', 'casual', 'cute'],
    petSafety: [
      {
        species: 'cat',
        toxic: false,
        severity: 'none',
        toxicParts: [],
        sourceUrl: `${ASPCA}/gerber-daisy`,
        reviewedAt: REVIEWED_AT,
      },
      {
        species: 'dog',
        toxic: false,
        severity: 'none',
        toxicParts: [],
        sourceUrl: `${ASPCA}/gerber-daisy`,
        reviewedAt: REVIEWED_AT,
      },
    ],
  },
];

export const testRules: RecommendationRuleRow[] = [
  { ruleId: 'SC_INTENT', intent: 'apology', apologyLevel: 2, flowerId: 'tulip-white', fitScore: 92 },
  { ruleId: 'SC_INTENT', intent: 'confession', flowerId: 'rose-red', fitScore: 95 },
  { ruleId: 'SC_INTENT', intent: 'gratitude', flowerId: 'lily-asiatic', fitScore: 88 },
  { ruleId: 'SC_INTENT', intent: 'gratitude', flowerId: 'gerbera', fitScore: 85 },
  { ruleId: 'SC_INTENT', intent: 'gratitude', flowerId: 'freesia', fitScore: 80 },
  { ruleId: 'SC_RELATIONSHIP', relationship: 'lover', flowerId: 'rose-red', fitScore: 90 },
  { ruleId: 'SC_RELATIONSHIP', relationship: 'friend', flowerId: 'gerbera', fitScore: 88 },
];

/**
 * 색상 추천 테스트용 꽃말.
 * gerbera 행은 color 를 비워 두어 "색을 가리지 않는 꽃말" 폴백 경로를 덮는다.
 */
export const testMeanings: FlowerMeaningRow[] = [
  {
    flowerId: 'lily-asiatic',
    color: 'white',
    meaningKo: '순수한 마음과 존경',
    cultureRegion: 'western',
    sourceId: 'test-lily-white',
    confidenceLevel: 'repeated',
  },
  {
    flowerId: 'lily-asiatic',
    color: 'orange',
    meaningKo: '위엄과 자부심',
    cultureRegion: 'western',
    sourceId: 'test-lily-orange',
    confidenceLevel: 'varies',
  },
  {
    flowerId: 'tulip-white',
    color: 'white',
    meaningKo: '용서를 구하는 마음',
    cultureRegion: 'uk',
    era: 'victorian',
    sourceId: 'test-tulip-uk',
    confidenceLevel: 'varies',
  },
  {
    flowerId: 'rose-red',
    color: 'red',
    meaningKo: '열정적인 사랑',
    sourceId: 'test-rose-red',
    confidenceLevel: 'repeated',
  },
  {
    flowerId: 'gerbera',
    meaningKo: '언제나 곁에 있는 밝은 응원',
    sourceId: 'test-gerbera-any',
    confidenceLevel: 'single_source',
  },
];

/** 꽃말 없는 기존 형태의 RuleSet. 하위 호환 검증에 쓴다. */
export const testRuleSet: RuleSet = { flowers: testFlowers, rules: testRules };

/** 꽃말까지 갖춘 RuleSet. 색상 추천 검증에 쓴다. */
export const testRuleSetWithMeanings: RuleSet = {
  flowers: testFlowers,
  rules: testRules,
  meanings: testMeanings,
};

/** 기본 입력(친구에게 감사, 5월) + 필요한 필드만 덮어쓰기. */
export function makeInput(overrides: Partial<RecoInput> = {}): RecoInput {
  return {
    relationship: 'friend',
    intent: 'gratitude',
    dateISO: '2026-05-10',
    ...overrides,
  };
}

export function flowerIds(flowers: Array<{ id: string }>): string[] {
  return flowers.map((f) => f.id);
}
