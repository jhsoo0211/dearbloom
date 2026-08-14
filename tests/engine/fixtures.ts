import type { FlowerData, RecoInput, RecommendationRuleRow, RuleSet } from '@/lib/engine/types';

/**
 * 엔진 테스트용 인라인 미니 데이터셋.
 * 실제 콘텐츠 CSV와는 독립이며(파일을 읽지 않는다), 규칙 동작 검증에 필요한 최소한만 담는다.
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
    aestheticTags: ['elegant', 'statement'],
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
    aestheticTags: ['fresh', 'light'],
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
    aestheticTags: ['clean', 'modern'],
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
    aestheticTags: ['romantic', 'classic'],
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
    aestheticTags: ['cheerful', 'casual'],
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

export const testRuleSet: RuleSet = { flowers: testFlowers, rules: testRules };

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
