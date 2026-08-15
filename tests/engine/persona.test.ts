import { describe, expect, it } from 'vitest';
import { recommend } from '@/lib/engine';
import { REASON_TEXTS, buildColorSuggestion } from '@/lib/engine/explain';
import { TRAIT_LABELS, normalizeInput } from '@/lib/engine/normalize';
import { scoreCandidate } from '@/lib/engine/score';
import type { RecoResult } from '@/lib/engine/types';
import { DEFAULT_WEIGHTS } from '@/lib/engine/weights';
import {
  makeInput,
  testFlowers,
  testMeanings,
  testRuleSet,
  testRuleSetWithMeanings,
  testRules,
} from './fixtures';

function flowerById(id: string) {
  const flower = testFlowers.find((f) => f.id === id);
  if (!flower) throw new Error(`fixture에 없는 꽃: ${id}`);
  return flower;
}

function resultFor(results: RecoResult[], id: string): RecoResult {
  const hit = results.find((r) => r.flower.id === id);
  if (!hit) throw new Error(`추천 결과에 없는 꽃: ${id}`);
  return hit;
}

/* ------------------------------------------------------------------ *
 * 1. 페르소나 태그
 * ------------------------------------------------------------------ */

describe('recipientTraits (페르소나 태그)', () => {
  it('한국어 라벨을 slug로 옮기고 어휘 밖의 값은 거부한다', () => {
    const normalized = normalizeInput(
      makeInput({ recipientTraits: ['차분한', 'ELEGANT', '우아한'] }),
    );
    // '우아한' 과 'ELEGANT' 는 같은 태그라 하나로 합쳐진다.
    expect(normalized.recipientTraits).toEqual(['calm', 'elegant']);
    expect(TRAIT_LABELS['차분한']).toBe('calm');

    expect(() => normalizeInput(makeInput({ recipientTraits: ['시크한'] }))).toThrow();
  });

  it('태그가 맞는 꽃은 점수가 오르고, 맞지 않는 꽃은 그대로다', () => {
    const withTraits = makeInput({ recipientTraits: ['calm', 'elegant'] });
    const withoutTraits = makeInput();

    // lily-asiatic: elegant 하나 일치 (2개 중 1개)
    const lily = flowerById('lily-asiatic');
    const lilyBefore = scoreCandidate(lily, withoutTraits, testRules, DEFAULT_WEIGHTS);
    const lilyAfter = scoreCandidate(lily, withTraits, testRules, DEFAULT_WEIGHTS);
    expect(lilyAfter.total).toBeGreaterThan(lilyBefore.total);
    expect(lilyAfter.parts.A).toBe(0.5);
    expect(lilyAfter.matched).toContain('SC_PERSONA');

    // gerbera: cheerful|casual|cute — 일치 없음
    const gerbera = flowerById('gerbera');
    const gerberaBefore = scoreCandidate(gerbera, withoutTraits, testRules, DEFAULT_WEIGHTS);
    const gerberaAfter = scoreCandidate(gerbera, withTraits, testRules, DEFAULT_WEIGHTS);
    expect(gerberaAfter.total).toBe(gerberaBefore.total);
    expect(gerberaAfter.matched).not.toContain('SC_PERSONA');
  });

  it('색과 태그가 함께 오면 A는 0.6/0.4 가중 평균이다', () => {
    const lily = flowerById('lily-asiatic'); // colors: white|pink|orange, tags: elegant|statement|vivid

    const bothParts = scoreCandidate(
      lily,
      makeInput({ colorPrefs: ['white'], recipientTraits: ['calm', 'elegant'] }),
      testRules,
      DEFAULT_WEIGHTS,
    ).parts;
    // 색 1.0 × 0.6 + 태그 0.5 × 0.4
    expect(bothParts.A).toBe(0.8);

    // 한쪽만 오면 그쪽이 100%
    const colorOnly = scoreCandidate(
      lily,
      makeInput({ colorPrefs: ['white'] }),
      testRules,
      DEFAULT_WEIGHTS,
    ).parts;
    expect(colorOnly.A).toBe(1);

    const traitOnly = scoreCandidate(
      lily,
      makeInput({ recipientTraits: ['calm', 'elegant'] }),
      testRules,
      DEFAULT_WEIGHTS,
    ).parts;
    expect(traitOnly.A).toBe(0.5);

    // 둘 다 없으면 신호 없음
    const none = scoreCandidate(lily, makeInput(), testRules, DEFAULT_WEIGHTS).parts;
    expect(none.A).toBe(0);
  });

  it('추천 결과에서도 태그가 맞는 꽃의 fitScore가 올라간다', () => {
    const before = recommend(makeInput(), testRuleSetWithMeanings);
    const after = recommend(
      makeInput({ recipientTraits: ['calm', 'elegant'] }),
      testRuleSetWithMeanings,
    );

    expect(resultFor(after, 'lily-asiatic').fitScore).toBeGreaterThan(
      resultFor(before, 'lily-asiatic').fitScore,
    );
    expect(resultFor(after, 'gerbera').fitScore).toBe(resultFor(before, 'gerbera').fitScore);
  });

  it('SC_PERSONA도 설명 사전에 문장을 갖는다', () => {
    expect(REASON_TEXTS.SC_PERSONA).toBeTruthy();

    const results = recommend(
      makeInput({ recipientTraits: ['calm', 'elegant'] }),
      testRuleSetWithMeanings,
    );
    const reasons = results.flatMap((r) => r.reasons);
    expect(reasons).toContain('SC_PERSONA');
    for (const ruleId of reasons) {
      expect(Object.keys(REASON_TEXTS)).toContain(ruleId);
    }
  });
});

/* ------------------------------------------------------------------ *
 * 2. 색상 추천
 * ------------------------------------------------------------------ */

describe('colorSuggestion (색상 추천)', () => {
  it('선호 색을 가진 꽃이면 그 색과 해당 색의 꽃말을 고른다', () => {
    const results = recommend(
      makeInput({ colorPrefs: ['white'] }),
      testRuleSetWithMeanings,
    );

    const lily = resultFor(results, 'lily-asiatic').colorSuggestion;
    expect(lily?.color).toBe('white');
    expect(lily?.meaningKo).toBe('순수한 마음과 존경');
    expect(lily?.sourceId).toBe('test-lily-white');
    expect(lily?.reason).toContain('좋아하신다고');
  });

  it('선호 색이 없으면 대표색(colors[0])을 고르고 근거 문장이 달라진다', () => {
    const lily = flowerById('lily-asiatic');

    const withPref = buildColorSuggestion(lily, makeInput({ colorPrefs: ['orange'] }), testMeanings);
    expect(withPref?.color).toBe('orange');
    expect(withPref?.meaningKo).toBe('위엄과 자부심');
    expect(withPref?.reason).toContain('좋아하신다고');

    const withoutPref = buildColorSuggestion(lily, makeInput(), testMeanings);
    expect(withoutPref?.color).toBe('white'); // colors[0]
    expect(withoutPref?.reason).toContain('그 꽃답게');
    expect(withoutPref?.reason).not.toContain('좋아하신다고');
    // 괄호 조사(`흰색이(가) …을(를)`)가 화면 문자열로 새어 나가지 않는다.
    expect(withoutPref?.reason).not.toMatch(/[은이을](\(|（)/);

    // 꽃이 갖지 않은 색을 선호해도 대표색으로 떨어진다.
    const unmatched = buildColorSuggestion(lily, makeInput({ colorPrefs: ['blue'] }), testMeanings);
    expect(unmatched?.color).toBe('white');
    expect(unmatched?.reason).toContain('그 꽃답게');
  });

  it('색을 가리지 않는 꽃말 행은 어떤 색에도 붙는다', () => {
    const gerbera = flowerById('gerbera'); // colors[0] = pink, 꽃말 행에는 color 가 없다
    const suggestion = buildColorSuggestion(gerbera, makeInput(), testMeanings);
    expect(suggestion?.color).toBe('pink');
    expect(suggestion?.meaningKo).toBe('언제나 곁에 있는 밝은 응원');
    expect(suggestion?.sourceId).toBe('test-gerbera-any');
  });

  it('꽃말을 주지 않은 기존 RuleSet에서도 추천 결과가 그대로 나온다', () => {
    const input = makeInput({ colorPrefs: ['white'] });
    const withMeanings = recommend(input, testRuleSetWithMeanings);
    const withoutMeanings = recommend(input, testRuleSet);

    // 꽃말에서 나오는 색 정보(제안·선택지)를 뺀 나머지 결과는 완전히 동일하다(하위 호환).
    const strip = (results: RecoResult[]) =>
      results.map((result) => {
        const copy = { ...result };
        delete copy.colorSuggestion;
        delete copy.colorOptions;
        return copy;
      });
    expect(strip(withoutMeanings)).toEqual(strip(withMeanings));

    // 색과 근거는 채우되, 출처 없는 꽃말은 싣지 않는다.
    for (const result of withoutMeanings) {
      expect(result.colorSuggestion?.color).toBeTruthy();
      expect(result.colorSuggestion?.reason).toBeTruthy();
      expect(result.colorSuggestion?.meaningKo).toBeUndefined();
      expect(result.colorSuggestion?.sourceId).toBeUndefined();
    }
  });
});
