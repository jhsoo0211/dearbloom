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
 *
 * `scored` 의 total 은 D 이전 소계이고, `diversify()` 가 세 안을 고른 뒤 D 를 얹어
 * 최종 total 로 바꾼다(`ScoreBreakdown.total` 의 "두 걸음" 주석). 그래서 가중치를
 * diversify 에도 넘겨야 한다 — 넘기지 않으면 config 로 바꾼 D 가 기본값으로 돈다.
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

  const picked = diversify(scored, MAX_RESULTS, weights);

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
