import { describe, expect, it } from 'vitest';
import { recommend } from '@/lib/engine';
import { REASON_TEXTS } from '@/lib/engine/explain';
import { makeInput, testRuleSet } from './fixtures';

describe('recommend', () => {
  it('최대 3안을 fitScore 내림차순으로 주고, 고양이가 있으면 백합을 넣지 않는다', () => {
    const results = recommend(makeInput({ pets: ['cat'] }), testRuleSet);

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);

    const scores = results.map((r) => r.fitScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));

    expect(results.map((r) => r.flower.id)).not.toContain('lily-asiatic');
  });

  it('mild_gi 꽃이 추천되면 해당 결과의 cautions에 반려동물 주의 문장이 붙는다', () => {
    const results = recommend(makeInput({ pets: ['dog'] }), testRuleSet);

    const withCautions = results.filter((r) => r.cautions.length > 0);
    expect(withCautions.length).toBeGreaterThan(0);

    for (const result of withCautions) {
      expect(result.cautions.some((c) => c.includes('반려동물'))).toBe(true);
    }
  });

  it('모든 결과의 reasons는 설명 사전에 있는 RuleId만 담는다', () => {
    const inputs = [
      makeInput({ pets: ['dog'] }),
      makeInput({ relationship: 'lover', intent: 'confession', colorPrefs: ['red'] }),
      makeInput({ relationship: 'spouse', intent: 'apology', apologyLevel: 2, dateISO: undefined }),
    ];

    for (const input of inputs) {
      const results = recommend(input, testRuleSet);
      for (const result of results) {
        for (const ruleId of result.reasons) {
          expect(Object.keys(REASON_TEXTS)).toContain(ruleId);
        }
      }
    }
  });
});
