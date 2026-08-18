import type { ScoredFlower } from './score';
import type { FlowerData, Weights } from './types';
import { DEFAULT_WEIGHTS } from './weights';

const DEFAULT_K = 3;

/** D 를 이루는 축의 수 — 가격대·미감·색. */
const D_AXES = 3;

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function firstTag(s: ScoredFlower): string | undefined {
  return s.flower.aestheticTags[0];
}

function normalized(values: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const v of values) {
    const s = v.trim().toLowerCase();
    if (s !== '') out.add(s);
  }
  return out;
}

/**
 * 두 목록이 얼마나 겹치는가(0~1). 교집합 / 합집합.
 * 둘 다 비어 있으면 **구분할 근거가 없다**는 뜻이라 1(완전히 같음)로 본다 —
 * 그래야 정보가 없는 꽃끼리 서로 "다르다"는 가점을 받지 않는다.
 */
function jaccard(a: readonly string[], b: readonly string[]): number {
  const left = normalized(a);
  const right = normalized(b);
  if (left.size === 0 && right.size === 0) return 1;

  let hit = 0;
  for (const v of left) if (right.has(v)) hit += 1;
  const union = left.size + right.size - hit;
  return union === 0 ? 1 : hit / union;
}

/**
 * 두 안이 서로 얼마나 다른가(0~1). 세 축의 평균이다.
 *   가격대 — 같으면 0, 다르면 1 (band 는 1·2·3 세 칸뿐이라 거리 대신 같다/다르다로 센다)
 *   미감   — aestheticTags 의 1 - 자카드
 *   색     — colors 의 1 - 자카드
 */
function pairDistinctness(a: FlowerData, b: FlowerData): number {
  const price = a.priceBand === b.priceBand ? 0 : 1;
  const tag = 1 - jaccard(a.aestheticTags, b.aestheticTags);
  const color = 1 - jaccard(a.colors, b.colors);
  return (price + tag + color) / D_AXES;
}

/**
 * 고른 안들의 D(다양성) 점수 — 각 안이 **나머지 안들과 얼마나 다른가**의 평균.
 *
 * 안이 하나뿐이면 겹칠 상대가 없으므로 1 이다(감점할 근거가 없다).
 * 순서는 입력과 같다.
 */
export function diversityScores(picked: readonly ScoredFlower[]): number[] {
  if (picked.length <= 1) return picked.map(() => 1);

  return picked.map((self, i) => {
    let sum = 0;
    for (let j = 0; j < picked.length; j += 1) {
      if (j === i) continue;
      sum += pairDistinctness(self.flower, picked[j].flower);
    }
    return round4(sum / (picked.length - 1));
  });
}

/**
 * 비슷한 안이 겹치지 않게 상위 k개를 고르고, 고른 뒤 **D 가점을 얹는다**.
 *
 * ── 재정렬과 D 가중치의 역할 분담 ─────────────────────────────────────
 * 둘은 같은 목적의 다른 도구이고, 순서가 있다.
 *   ① **그리디 재정렬(고르기)** — 점수 내림차순으로 한 번만 훑으면서, 이미 뽑힌 안과
 *      priceBand·첫 aestheticTag 가 "모두" 같으면 건너뛴다. 되돌아가서 채우지 않으므로
 *      결과가 k 보다 적을 수 있다. 이것은 **문턱**이다 — 쌍둥이 세 송이를 애초에 막는다.
 *   ② **D 가중치(점수)** — 고른 세 안이 실제로 얼마나 흩어졌는지를 0~1 로 재서
 *      `w.D`(기본 0.05) 만큼 총점에 얹는다. 이것은 **눈금**이다 — ①의 문턱을 통과한
 *      뒤에도 "가격대만 다르고 색은 똑같은 세 송이"와 "세 축이 모두 흩어진 세 송이"를
 *      구분해 말할 수 있게 한다.
 * ①만 있으면 D 가중치가 죽고(감사 P1-1: 합이 0.95 에서 멈춘다), ②만 있으면 점수가
 * 낮은 이색 후보가 상위 3안을 밀어내는 일이 생긴다. 그래서 **고르는 일은 ①이, 말하는
 * 일은 ②가** 한다 — D 는 선정에 개입하지 않고, 선정된 뒤의 총점만 바꾼다.
 *
 * D 를 얹고 나면 세 안의 순서가 바뀔 수 있으므로(총점이 달라졌으니) 마지막에 다시
 * 정렬한다. `fitScore` 내림차순은 화면이 기대는 불변이다.
 *
 * 결정적이다 — 난수도 시각도 쓰지 않고, 동점이면 입력 순서를 지키는 안정 정렬을 쓴다.
 */
export function diversify(
  scored: ScoredFlower[],
  k: number = DEFAULT_K,
  w: Weights = DEFAULT_WEIGHTS,
): ScoredFlower[] {
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

  const scores = diversityScores(picked);

  return picked
    .map((p, i) => {
      const D = scores[i];
      // 이미 실려 있던 D 항을 걷어 내고 새로 얹는다 — 두 번 불러도 값이 부풀지 않는다.
      const base = round4(p.score.total - w.D * p.score.parts.D);
      return {
        flower: p.flower,
        score: {
          ...p.score,
          total: round4(base + w.D * D),
          parts: { ...p.score.parts, D },
        },
      };
    })
    .sort((a, b) => b.score.total - a.score.total);
}
