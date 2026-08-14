import { diversify } from './diversity';
import { exclude } from './exclude';
import { buildResults } from './explain';
import { normalizeInput } from './normalize';
import { scoreCandidate, type ScoredFlower } from './score';
import type { RecoInput, RecoResult, RuleSet, Weights } from './types';
import { DEFAULT_WEIGHTS } from './weights';

/** 한 번에 돌려주는 추천 안의 최대 개수. */
export const MAX_RESULTS = 3;

/**
 * 추천 파이프라인.
 * 정규화 → 강제 제외 → 적합도 → 다양성 → 설명 순으로 처리한다.
 */
export function recommend(
  input: RecoInput,
  data: RuleSet,
  weights: Weights = DEFAULT_WEIGHTS,
): RecoResult[] {
  const normalized = normalizeInput(input);
  const { candidates, cautionsByFlower } = exclude(data.flowers, normalized);

  const scored: ScoredFlower[] = candidates
    .map((flower) => ({
      flower,
      score: scoreCandidate(flower, normalized, data.rules, weights),
    }))
    .sort((a, b) => b.score.total - a.score.total);

  const picked = diversify(scored, MAX_RESULTS);

  return buildResults(picked, scored, normalized, data.rules, cautionsByFlower, data.meanings ?? []);
}

export * from './diversity';
export * from './exclude';
export * from './explain';
export * from './group';
export * from './infer';
export * from './normalize';
export * from './score';
export * from './stories';
export * from './today';
export * from './types';
export * from './weights';
