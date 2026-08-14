import { monthFromISO } from './normalize';
import type { ScoredFlower } from './score';
import type {
  FlowerRef,
  RecoInput,
  RecoResult,
  RecommendationRuleRow,
  RuleId,
  SeasonStatus,
} from './types';

/** RuleId → 사용자에게 보여 줄 한국어 설명. */
export const REASON_TEXTS: Record<RuleId, string> = {
  EX_PET_TOXIC: '반려동물에게 심각한 독성이 있어 후보에서 제외했어요.',
  EX_BUDGET: '설정하신 예산 범위를 벗어나 제외했어요.',
  EX_DISLIKED: '제외하고 싶다고 하신 꽃이라 후보에서 뺐어요.',
  EX_FRAGRANCE: '향에 민감하다고 하셔서 향이 강한 꽃은 제외했어요.',
  SC_INTENT: '전하려는 마음에 잘 맞는 꽃이에요.',
  SC_RELATIONSHIP: '두 분의 관계에 어울리는 선택이에요.',
  SC_SEASON: '지금이 제철이라 상태 좋은 꽃을 구하기 쉬워요.',
  SC_AESTHETIC: '좋아하신다고 하신 색·분위기와 잘 어울려요.',
};

const FALLBACK_REASON = '추천 규칙에 부합하는 선택이에요.';

/** 규칙 식별자의 설명 문장. 사전에 없는 id는 기본 문장으로 대체한다. */
export function reasonText(ruleId: RuleId): string {
  return REASON_TEXTS[ruleId] ?? FALLBACK_REASON;
}

function toRef(s: ScoredFlower): FlowerRef {
  return { id: s.flower.id, nameKo: s.flower.nameKo };
}

function isAdjacentMonth(month: number, bloomMonths: number[]): boolean {
  const prev = month === 1 ? 12 : month - 1;
  const next = month === 12 ? 1 : month + 1;
  return bloomMonths.includes(prev) || bloomMonths.includes(next);
}

/**
 * 개화월과 요청 날짜로 수급 상태를 추정한다.
 * 날짜나 개화월 정보가 없으면 unknown, 개화월이면 in_season,
 * 개화월 직전·직후 달이면 limited, 그 밖은 out_of_season.
 */
export function availabilityFor(bloomMonths: number[], dateISO?: string): SeasonStatus {
  const month = monthFromISO(dateISO);
  if (month === undefined || bloomMonths.length === 0) return 'unknown';
  if (bloomMonths.includes(month)) return 'in_season';
  if (isAdjacentMonth(month, bloomMonths)) return 'limited';
  return 'out_of_season';
}

/**
 * 선정된 안을 최종 응답 형태로 바꾼다.
 * fitScore는 0~1 내부 점수를 0~100 정수로 환산한 값이다.
 * substitutes는 같은 intent 규칙에 걸린 차순위 후보 중 아직 추천되지 않은 최대 2개.
 */
export function buildResults(
  picked: ScoredFlower[],
  allScored: ScoredFlower[],
  input: RecoInput,
  rules: RecommendationRuleRow[],
  cautionsByFlower: Map<string, string[]>,
): RecoResult[] {
  const pickedIds = new Set(picked.map((p) => p.flower.id));

  const intentFlowerIds = new Set(
    rules.filter((r) => r.intent !== undefined && r.intent === input.intent).map((r) => r.flowerId),
  );

  const substitutePool = [...allScored]
    .sort((a, b) => b.score.total - a.score.total)
    .filter((s) => !pickedIds.has(s.flower.id) && intentFlowerIds.has(s.flower.id));

  return picked.map((p) => ({
    flower: toRef(p),
    fitScore: Math.round(p.score.total * 100),
    reasons: [...p.score.matched],
    cautions: [...(cautionsByFlower.get(p.flower.id) ?? [])],
    substitutes: substitutePool.slice(0, 2).map(toRef),
    availability: availabilityFor(p.flower.bloomMonths, input.dateISO),
  }));
}
