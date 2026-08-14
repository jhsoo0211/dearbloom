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

/** fitScore가 비어 있는 규칙 행은 만점 매칭으로 본다. */
const DEFAULT_FIT_SCORE = 100;

/** 개화월 정보가 없는 달의 기본 계절 점수(제철도 비수기도 아닌 중립값). */
const SEASON_OFF = 0.3;
/** 날짜 미입력 시 계절 점수(정보 없음). */
const SEASON_UNKNOWN = 0.5;

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
    const fit = clamp01((row.fitScore ?? DEFAULT_FIT_SCORE) / 100);
    if (fit > best) best = fit;
  }
  return best;
}

/**
 * 후보 한 송이의 적합도.
 *   I: 규칙표에서 intent가 일치하는 행의 fitScore(0~100 → 0~1) 최댓값
 *   R: 규칙표에서 relationship이 일치하는 행의 fitScore 최댓값
 *   S: dateISO의 월이 bloomMonths에 있으면 1, 없으면 0.3, 날짜가 없으면 0.5
 *   A: colorPrefs와 flower.colors의 교집합 비율(선호 색 미입력이면 신호 없음 → 0)
 *   P: 개인화 스텁. personalCues/메모리 기반 점수는 후속 작업이라 지금은 항상 0.
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

  const intentRows = rows.filter((r) => r.intent !== undefined && r.intent === input.intent);
  const I = bestFit(intentRows);
  if (I > 0) matched.push('SC_INTENT');

  const relationshipRows = rows.filter(
    (r) => r.relationship !== undefined && r.relationship === input.relationship,
  );
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
  let A = 0;
  if (prefs.length > 0) {
    const colors = new Set(f.colors.map((c) => c.toLowerCase()));
    const hit = prefs.filter((c) => colors.has(c.toLowerCase())).length;
    A = clamp01(hit / prefs.length);
    if (A > 0) matched.push('SC_AESTHETIC');
  }

  // P: 개인화 스텁 (personalCues → 기억/취향 반영은 후속 작업)
  const P = 0;

  const total = round4(w.I * I + w.R * R + w.S * S + w.A * A + w.P * P);

  return { total, parts: { I, R, S, A, P }, matched };
}
