import { monthFromISO } from './normalize';
import type { FlowerData, RecoInput, RecommendationRuleRow, RuleId, Weights } from './types';

export type ScorePart = 'I' | 'R' | 'S' | 'A' | 'P';

export interface ScoreBreakdown {
  total: number; // 0~1
  parts: Record<ScorePart, number>; // 각 0~1
  matched: RuleId[];
}

export interface ScoredFlower {
  flower: FlowerData;
  score: ScoreBreakdown;
}

/** 개화월 정보가 없는 달의 기본 계절 점수(제철도 비수기도 아닌 중립값). */
const SEASON_OFF = 0.3;
/** 날짜 미입력 시 계절 점수(정보 없음). */
const SEASON_UNKNOWN = 0.5;

/**
 * A(미적 취향) 안에서 신호별 배분.
 *
 * 색이 가장 직접적인 신호라 0.6, 분위기 태그 0.4, 향 선호는 보조라 0.3 이다.
 * **들어온 신호끼리만 나눠 갖는다** — 실제 A 는 몫의 합으로 나눈 가중 평균이라
 * 하나만 들어오면 그쪽이 100% 가 되고, 신호가 늘어도 A 는 0~1 을 벗어나지 않는다.
 * (가중치 합 1.0 은 `weights.ts` 의 zod refine 이 지킨다 — 그래서 향 선호를 6번째
 * 가중치로 세우지 않고 A 안에서 나눈다.)
 */
const A_COLOR_SHARE = 0.6;
const A_TRAIT_SHARE = 0.4;
const A_FRAGRANCE_SHARE = 0.3;

/** flowers.csv 의 fragrance_level 최댓값. 0~3 을 0~1 로 옮길 때 쓴다. */
const MAX_FRAGRANCE_LEVEL = 3;

/** 두 문자열 목록의 교집합 비율(기준: 사용자가 준 목록의 길이). */
function overlapRatio(userValues: string[], flowerValues: string[]): number {
  const owned = new Set(flowerValues.map((v) => v.trim().toLowerCase()));
  const hit = userValues.filter((v) => owned.has(v.trim().toLowerCase())).length;
  return clamp01(hit / userValues.length);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function bestFit(rows: RecommendationRuleRow[]): number {
  let best = 0;
  for (const row of rows) {
    /*
     * rules.csv 는 추천(fitScore)과 회피(avoidReason) 행을 같은 타입으로 싣는다.
     * 회피 행의 빈 fitScore를 기본 만점으로 해석하면, 피하라고 적은 꽃에 오히려
     * I/R 가점이 붙는다. 점수 단계에서는 명시적인 추천 점수만 사용한다.
     */
    if (row.fitScore === undefined) continue;
    const fit = clamp01(row.fitScore / 100);
    if (fit > best) best = fit;
  }
  return best;
}

/**
 * 후보 한 송이의 적합도.
 *   I: 규칙표에서 intent가 일치하는 행의 fitScore(0~100 → 0~1) 최댓값
 *   R: 규칙표에서 relationship이 일치하는 행의 fitScore 최댓값
 *   S: dateISO의 월이 bloomMonths에 있으면 1, 없으면 0.3, 날짜가 없으면 0.5
 *   A: 미적 취향. 색 선호(colorPrefs ∩ flower.colors)·페르소나 태그
 *      (recipientTraits ∩ flower.aestheticTags)·향 선호(fragrancePreference 일 때
 *      fragranceLevel/3)의 가중 평균(0.6 / 0.4 / 0.3). 들어온 신호끼리만 몫을 나누므로
 *      한 가지만 입력되면 그쪽이 100%, 아무것도 없으면 신호 없음 → 0.
 *   P: 개인화 스텁. personalCues/메모리 기반 점수는 후속 작업이라 지금은 항상 0.
 *
 * intent 가 'other'(직접 쓴 마음)이면 I 는, relationship 이 'other'(직접 쓴 사이)이면 R 은
 * 규칙표를 보지 않고 0 이다 — §1.5l.
 * D(다양성) 가중치는 여기서 쓰지 않고 diversity 단계에서 반영한다.
 */
export function scoreCandidate(
  f: FlowerData,
  input: RecoInput,
  rules: RecommendationRuleRow[],
  w: Weights,
): ScoreBreakdown {
  const rows = rules.filter((r) => r.flowerId === f.id);
  const matched: RuleId[] = [];

  /*
   * §1.5l — 'other' 는 사용자가 직접 적은 마음이라 규칙표에 짝이 될 행이 없다.
   * 필터로도 자연히 0 이 나오지만, "우연히 0" 과 "일부러 중립" 은 다르다.
   * 나중에 규칙표에 other 행이 들어와도 상황 가점이 살아나지 않게 여기서 못박는다.
   */
  const intentRows =
    input.intent === 'other'
      ? []
      : rows.filter((r) => r.intent !== undefined && r.intent === input.intent);
  const I = bestFit(intentRows);
  if (I > 0) matched.push('SC_INTENT');

  /*
   * §1.5l — 관계의 'other' 도 마음의 'other' 와 같은 약속이다(바로 위 주석 참고).
   * 사용자가 직접 적은 사이라 규칙표에 짝이 될 행이 없고, 나중에 other 행이 들어와도
   * 관계 가점이 살아나지 않게 여기서 못박는다.
   */
  const relationshipRows =
    input.relationship === 'other'
      ? []
      : rows.filter((r) => r.relationship !== undefined && r.relationship === input.relationship);
  const R = bestFit(relationshipRows);
  if (R > 0) matched.push('SC_RELATIONSHIP');

  const month = monthFromISO(input.dateISO);
  let S: number;
  if (month === undefined) {
    S = SEASON_UNKNOWN;
  } else if (f.bloomMonths.includes(month)) {
    S = 1;
    matched.push('SC_SEASON');
  } else {
    S = SEASON_OFF;
  }

  const prefs = input.colorPrefs ?? [];
  const traits = input.recipientTraits ?? [];

  // 들어온 신호만 (값, 몫) 으로 모아 가중 평균한다. 몫의 합으로 나누므로
  // 신호가 하나뿐이면 그 값이 그대로 A 가 된다(기존 동작과 같다).
  const signals: { value: number; share: number }[] = [];

  if (prefs.length > 0) {
    const colorScore = overlapRatio(prefs, f.colors);
    if (colorScore > 0) matched.push('SC_AESTHETIC');
    signals.push({ value: colorScore, share: A_COLOR_SHARE });
  }

  if (traits.length > 0) {
    const traitScore = overlapRatio(traits, f.aestheticTags);
    if (traitScore > 0) matched.push('SC_PERSONA');
    signals.push({ value: traitScore, share: A_TRAIT_SHARE });
  }

  // §1.5l `향기를 좋아해요` — 향이 살아 있는 꽃을 위로 올린다.
  // 반대편(fragranceSensitive)은 점수가 아니라 제외(EX_FRAGRANCE)로 다룬다.
  if (input.fragrancePreference === true) {
    const fragranceScore = clamp01(f.fragranceLevel / MAX_FRAGRANCE_LEVEL);
    if (fragranceScore > 0) matched.push('SC_FRAGRANCE');
    signals.push({ value: fragranceScore, share: A_FRAGRANCE_SHARE });
  }

  const shareSum = signals.reduce((sum, s) => sum + s.share, 0);
  const A =
    shareSum === 0
      ? 0
      : round4(signals.reduce((sum, s) => sum + s.value * s.share, 0) / shareSum);

  // P: 개인화 스텁 (personalCues → 기억/취향 반영은 후속 작업)
  const P = 0;

  const total = round4(w.I * I + w.R * R + w.S * S + w.A * A + w.P * P);

  return { total, parts: { I, R, S, A, P }, matched };
}
