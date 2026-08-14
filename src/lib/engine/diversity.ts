import type { ScoredFlower } from './score';

const DEFAULT_K = 3;

function firstTag(s: ScoredFlower): string | undefined {
  return s.flower.aestheticTags[0];
}

/**
 * 비슷한 안이 겹치지 않게 상위 k개를 고른다.
 * 점수 내림차순으로 한 번만 훑으면서(그리디 1패스),
 * 이미 뽑힌 안과 priceBand·첫 aestheticTag가 "모두" 같으면 건너뛴다.
 * 되돌아가서 채우지 않으므로 결과가 k보다 적을 수 있다.
 */
export function diversify(scored: ScoredFlower[], k: number = DEFAULT_K): ScoredFlower[] {
  if (k <= 0) return [];

  const ordered = [...scored].sort((a, b) => b.score.total - a.score.total);
  const picked: ScoredFlower[] = [];

  for (const candidate of ordered) {
    if (picked.length >= k) break;
    const tag = firstTag(candidate);
    const tooSimilar = picked.some(
      (p) => p.flower.priceBand === candidate.flower.priceBand && firstTag(p) === tag,
    );
    if (tooSimilar) continue;
    picked.push(candidate);
  }

  return picked;
}
