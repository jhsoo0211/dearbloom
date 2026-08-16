import { describe, expect, it } from 'vitest';

import { recommend } from '@/lib/engine';
import { REASON_TEXTS } from '@/lib/engine/explain';
import { INTENTS, RELATIONSHIPS, normalizeInput } from '@/lib/engine/normalize';
import { scoreCandidate } from '@/lib/engine/score';
import type { RecommendationRuleRow } from '@/lib/engine/types';
import { DEFAULT_WEIGHTS } from '@/lib/engine/weights';
import { makeInput, testFlowers, testRuleSetWithMeanings, testRules } from './fixtures';

/**
 * §1.5l 추천 입력 개편이 엔진에 들여온 신호들.
 *   ① intent `other` — 직접 쓴 마음. 상황 가점(I)을 **중립(0)** 으로 둔다.
 *   ② relationship `other` — 직접 쓴 사이. 관계 가점(R)을 같은 규칙으로 중립에 둔다.
 *   ③ fragrancePreference — `향기를 좋아해요` 칩. A(미적) 안의 향 신호로 들어간다.
 */

function flowerById(id: string) {
  const flower = testFlowers.find((f) => f.id === id);
  if (!flower) throw new Error(`fixture에 없는 꽃: ${id}`);
  return flower;
}

describe("intent 'other' — 직접 쓴 마음", () => {
  it('어휘에 들어 있어 정규화를 통과한다', () => {
    expect(INTENTS).toContain('other');
    expect(normalizeInput(makeInput({ intent: 'other' })).intent).toBe('other');
  });

  it('규칙표에 other 행이 있어도 상황 가점(I)은 0이다', () => {
    // 누군가 실수로 other 규칙을 넣더라도 중립이 유지되어야 한다.
    const rulesWithOther: RecommendationRuleRow[] = [
      ...testRules,
      { ruleId: 'SC_INTENT', intent: 'other', flowerId: 'rose-red', fitScore: 99 },
    ];

    const score = scoreCandidate(
      flowerById('rose-red'),
      makeInput({ intent: 'other', relationship: 'lover' }),
      rulesWithOther,
      DEFAULT_WEIGHTS,
    );

    expect(score.parts.I).toBe(0);
    expect(score.matched).not.toContain('SC_INTENT');
    // 관계·제철 같은 나머지 신호는 그대로 산다.
    expect(score.parts.R).toBeGreaterThan(0);
    expect(score.parts.S).toBe(1);
  });

  it('색·제철·분위기 신호만으로 순서가 정해진다', () => {
    const base = recommend(makeInput({ intent: 'other' }), testRuleSetWithMeanings);
    expect(base.length).toBeGreaterThan(0);

    // 같은 입력에 색 선호만 얹으면 그 색을 가진 꽃이 위로 올라온다.
    const withColor = recommend(
      makeInput({ intent: 'other', colorPrefs: ['red'] }),
      testRuleSetWithMeanings,
    );
    const scoreOf = (results: typeof base, id: string) =>
      results.find((r) => r.flower.id === id)?.fitScore ?? 0;

    expect(scoreOf(withColor, 'rose-red')).toBeGreaterThan(scoreOf(base, 'rose-red'));

    // 상황 가점이 없으니 어떤 결과도 SC_INTENT 를 근거로 달지 않는다.
    for (const result of [...base, ...withColor]) {
      expect(result.reasons).not.toContain('SC_INTENT');
      for (const ruleId of result.reasons) expect(Object.keys(REASON_TEXTS)).toContain(ruleId);
    }
  });

  it('일곱 갈래는 예전 그대로 상황 가점을 받는다 (중립이 other 에만 걸린다)', () => {
    const score = scoreCandidate(
      flowerById('rose-red'),
      makeInput({ intent: 'confession', relationship: 'lover' }),
      testRules,
      DEFAULT_WEIGHTS,
    );
    expect(score.parts.I).toBeCloseTo(0.95, 5);
    expect(score.matched).toContain('SC_INTENT');
  });
});

describe("relationship 'other' — 직접 쓴 사이", () => {
  it('어휘에 들어 있어 정규화를 통과한다', () => {
    expect(RELATIONSHIPS).toContain('other');
    expect(normalizeInput(makeInput({ relationship: 'other' })).relationship).toBe('other');
  });

  it('규칙표에 other 행이 있어도 관계 가점(R)은 0이다', () => {
    // 마음의 other 와 같은 약속이다 — 실수로 규칙이 들어와도 중립이 유지된다.
    const rulesWithOther: RecommendationRuleRow[] = [
      ...testRules,
      { ruleId: 'SC_RELATIONSHIP', relationship: 'other', flowerId: 'rose-red', fitScore: 99 },
    ];

    const score = scoreCandidate(
      flowerById('rose-red'),
      makeInput({ relationship: 'other', intent: 'confession' }),
      rulesWithOther,
      DEFAULT_WEIGHTS,
    );

    expect(score.parts.R).toBe(0);
    expect(score.matched).not.toContain('SC_RELATIONSHIP');
    // 마음·제철 같은 나머지 신호는 그대로 산다.
    expect(score.parts.I).toBeGreaterThan(0);
    expect(score.parts.S).toBe(1);
  });

  it('사이와 마음을 둘 다 직접 썼으면 규칙표 가점이 하나도 남지 않는다', () => {
    const score = scoreCandidate(
      flowerById('rose-red'),
      makeInput({ relationship: 'other', intent: 'other' }),
      testRules,
      DEFAULT_WEIGHTS,
    );

    expect(score.parts.I).toBe(0);
    expect(score.parts.R).toBe(0);
    expect(score.matched).not.toContain('SC_INTENT');
    expect(score.matched).not.toContain('SC_RELATIONSHIP');

    // 그래도 추천은 나온다 — 색·제철·분위기만으로 고른다는 것이 §1.5l 의 약속이다.
    const results = recommend(
      makeInput({ relationship: 'other', intent: 'other' }),
      testRuleSetWithMeanings,
    );
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.reasons).not.toContain('SC_RELATIONSHIP');
      expect(result.reasons).not.toContain('SC_INTENT');
      for (const ruleId of result.reasons) expect(Object.keys(REASON_TEXTS)).toContain(ruleId);
    }
  });

  it('여섯 갈래는 예전 그대로 관계 가점을 받는다 (중립이 other 에만 걸린다)', () => {
    const score = scoreCandidate(
      flowerById('rose-red'),
      makeInput({ relationship: 'lover', intent: 'confession' }),
      testRules,
      DEFAULT_WEIGHTS,
    );
    expect(score.parts.R).toBeGreaterThan(0);
    expect(score.matched).toContain('SC_RELATIONSHIP');
  });
});

describe('fragrancePreference — 향기를 좋아해요', () => {
  it('향이 진한 꽃일수록 A 가 높다 (0~1 을 벗어나지 않는다)', () => {
    const input = makeInput({ fragrancePreference: true });

    // freesia 3 / lily 2 / gerbera 0
    const freesia = scoreCandidate(flowerById('freesia'), input, testRules, DEFAULT_WEIGHTS);
    const lily = scoreCandidate(flowerById('lily-asiatic'), input, testRules, DEFAULT_WEIGHTS);
    const gerbera = scoreCandidate(flowerById('gerbera'), input, testRules, DEFAULT_WEIGHTS);

    expect(freesia.parts.A).toBe(1);
    expect(lily.parts.A).toBeCloseTo(2 / 3, 3);
    expect(gerbera.parts.A).toBe(0);

    expect(freesia.matched).toContain('SC_FRAGRANCE');
    expect(gerbera.matched).not.toContain('SC_FRAGRANCE');
    expect(REASON_TEXTS.SC_FRAGRANCE).toBeTruthy();
  });

  it('색·분위기와 함께 오면 몫을 나눠 갖는다 (0.6 / 0.4 / 0.3)', () => {
    const parts = scoreCandidate(
      flowerById('freesia'), // colors: yellow|white|purple, tags: fresh|light|calm, 향 3
      makeInput({ colorPrefs: ['yellow'], recipientTraits: ['calm'], fragrancePreference: true }),
      testRules,
      DEFAULT_WEIGHTS,
    ).parts;

    // (1×0.6 + 1×0.4 + 1×0.3) / 1.3 = 1
    expect(parts.A).toBe(1);

    const half = scoreCandidate(
      flowerById('lily-asiatic'), // 색 1.0 · 태그 0.5(elegant) · 향 2/3
      makeInput({
        colorPrefs: ['white'],
        recipientTraits: ['calm', 'elegant'],
        fragrancePreference: true,
      }),
      testRules,
      DEFAULT_WEIGHTS,
    ).parts;
    expect(half.A).toBeCloseTo((1 * 0.6 + 0.5 * 0.4 + (2 / 3) * 0.3) / 1.3, 3);
  });

  it('향에 민감하다는 말이 함께 오면 취향 신호는 접힌다 (안전이 앞선다)', () => {
    const normalized = normalizeInput(
      makeInput({ fragrancePreference: true, fragranceSensitive: true }),
    );
    expect(normalized.fragrancePreference).toBe(false);
    expect(normalized.fragranceSensitive).toBe(true);

    // 향 강한 프리지아(3)는 EX_FRAGRANCE 로 후보에서 빠진다.
    const results = recommend(
      makeInput({ fragrancePreference: true, fragranceSensitive: true }),
      testRuleSetWithMeanings,
    );
    expect(results.map((r) => r.flower.id)).not.toContain('freesia');
  });

  it('신호를 주지 않으면 A 계산은 예전 그대로다', () => {
    const withoutFlag = scoreCandidate(
      flowerById('freesia'),
      makeInput({ colorPrefs: ['yellow'] }),
      testRules,
      DEFAULT_WEIGHTS,
    ).parts;
    expect(withoutFlag.A).toBe(1);

    const none = scoreCandidate(flowerById('freesia'), makeInput(), testRules, DEFAULT_WEIGHTS)
      .parts;
    expect(none.A).toBe(0);
  });
});
