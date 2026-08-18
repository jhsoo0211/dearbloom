import { describe, expect, it } from 'vitest';

import { recommend } from '@/lib/engine';
import type { RecommendationRuleRow, RuleSet } from '@/lib/engine/types';
import { makeInput, testFlowers, testMeanings } from './fixtures';

/**
 * 대체 꽃(substitutes)에 **회피 행이 새지 않는다**.
 *
 * rules.csv 는 추천 행(fit_score)과 회피 행(avoid_reason 만 있고 fit_score 는 빈 행)을
 * 같은 표에 싣는다. `score.ts` 의 `bestFit` 은 회피 행을 명시적으로 건너뛰지만
 * `explain.ts` 의 대체안 풀은 그 방어가 없어서, **피하라고 적어 둔 꽃이 "대신 이 꽃은
 * 어때요" 자리에 올라오고 있었다**(2026-08-18 발견). 회피 행이 한 줄뿐이라 눈에 띄지
 * 않았을 뿐, 규칙표가 150행 규모(회피 ~18행)로 자라면 곧장 사고가 되는 자리다.
 */

/** celebration 규칙 한 벌 — 추천 4행 + 회피 3행(그중 하나는 추천 행과 겹친다). */
const celebrationRules: RecommendationRuleRow[] = [
  { ruleId: 'SC_INTENT', intent: 'celebration', flowerId: 'gerbera', fitScore: 80 },
  { ruleId: 'SC_INTENT', intent: 'celebration', flowerId: 'rose-red', fitScore: 78 },
  { ruleId: 'SC_INTENT', intent: 'celebration', flowerId: 'lily-asiatic', fitScore: 76 },
  { ruleId: 'SC_INTENT', intent: 'celebration', flowerId: 'tulip-white', fitScore: 74 },
  // 회피 행 — fit_score 가 비어 있다. 대체안에 서면 안 된다.
  { ruleId: 'AVOID_CELEBRATION_FREESIA', intent: 'celebration', flowerId: 'freesia', avoidReason: '장례 연상' },
  {
    ruleId: 'AVOID_CELEBRATION_FREESIA_2',
    intent: 'celebration',
    occasion: 'promotion',
    flowerId: 'freesia',
    avoidReason: '향이 강해 사무실에 부담',
  },
  // 추천 행과 회피 행이 **둘 다** 있는 꽃(데이터 모순). 지금은 추천 행이 이긴다 — 그 사실을 못박는다.
  { ruleId: 'AVOID_CELEBRATION_TULIP', intent: 'celebration', flowerId: 'tulip-white', avoidReason: '색이 옅어 밋밋' },
];

const celebrationSet: RuleSet = {
  flowers: testFlowers,
  rules: celebrationRules,
  meanings: testMeanings,
};

describe('substitutes (대체 꽃)', () => {
  const results = recommend(
    makeInput({ relationship: 'friend', intent: 'celebration' }),
    celebrationSet,
  );

  it('회피 행만 있는 꽃은 어떤 결과의 대체안에도 서지 않는다', () => {
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.substitutes.map((s) => s.id)).not.toContain('freesia');
    }
  });

  it('추천 행이 있는 차순위 꽃은 그대로 대체안이 된다 (가드가 과하게 걷어 내지 않는다)', () => {
    const pickedIds = results.map((r) => r.flower.id);
    expect(pickedIds).not.toContain('tulip-white');

    for (const result of results) {
      // 추천 행(74)과 회피 행이 함께 있는 꽃 — 지금 약속은 "추천 행이 이긴다".
      expect(result.substitutes.map((s) => s.id)).toEqual(['tulip-white']);
    }
  });

  it('회피 행은 점수에도 실리지 않는다 (score.ts 와 같은 약속)', () => {
    const freesia = recommend(
      makeInput({ relationship: 'friend', intent: 'celebration', dislikedFlowerIds: ['gerbera'] }),
      celebrationSet,
    ).find((r) => r.flower.id === 'freesia');

    // 후보로 남더라도 SC_INTENT 근거는 붙지 않는다.
    expect(freesia?.reasons ?? []).not.toContain('SC_INTENT');
  });
});
