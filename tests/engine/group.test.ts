import { describe, expect, it } from 'vitest';
import * as engine from '@/lib/engine';
import { recommend } from '@/lib/engine';
import {
  MAX_BOUQUET_FLOWERS,
  MAX_GROUP_MEMBERS,
  recommendGroupBouquet,
  recommendGroupIndividual,
  type GroupInput,
  type GroupMemberInput,
} from '@/lib/engine/group';
import type { ColorOption, RecoResult, RuleSet } from '@/lib/engine/types';
import {
  makeInput,
  testFlowers,
  testRuleSet,
  testRuleSetWithMeanings,
  testRules,
} from './fixtures';

const GROUP_DATE = '2026-05-10';

function makeGroup(members: GroupMemberInput[], overrides: Partial<GroupInput> = {}): GroupInput {
  return { intent: 'gratitude', dateISO: GROUP_DATE, members, ...overrides };
}

function assignedIds(results: Array<{ picks: RecoResult[] }>): string[] {
  return results.map((r) => r.picks[0]?.flower.id ?? '');
}

function flowerById(id: string) {
  const flower = testFlowers.find((f) => f.id === id);
  if (!flower) throw new Error(`fixture에 없는 꽃: ${id}`);
  return flower;
}

function optionFor(options: ColorOption[] | undefined, color: string): ColorOption {
  const hit = (options ?? []).find((o) => o.color === color);
  if (!hit) throw new Error(`색 선택지에 없는 색: ${color}`);
  return hit;
}

/* ------------------------------------------------------------------ *
 * 1. 여러 명에게 각각 추천
 * ------------------------------------------------------------------ */

describe('recommendGroupIndividual (각각 모드)', () => {
  it('4명에게 각각 배정하고 배정된 꽃이 서로 겹치지 않는다', () => {
    const results = recommendGroupIndividual(
      makeGroup([
        { name: '지수', relationship: 'friend' },
        { name: '민준', relationship: 'lover' },
        { name: '서연', relationship: 'friend', recipientTraits: ['minimal', 'calm'] },
        { name: '하늘', relationship: 'lover', colorPrefs: ['red'] },
      ]),
      testRuleSetWithMeanings,
    );

    expect(results).toHaveLength(4);
    expect(results.map((r) => r.member.name)).toEqual(['지수', '민준', '서연', '하늘']);

    for (const result of results) {
      expect(result.picks.length).toBeGreaterThan(0);
    }

    const assigned = assignedIds(results);
    expect(new Set(assigned).size).toBe(4);
  });

  it('취향이 같은 두 사람이면 두 번째 사람은 차순위로 밀리고 분산 안내가 붙는다', () => {
    const solo = recommend(
      makeInput({ relationship: 'friend', intent: 'gratitude', dateISO: GROUP_DATE }),
      testRuleSet,
    );
    const first = solo[0].flower.id;
    const second = solo[1].flower.id;

    const results = recommendGroupIndividual(
      makeGroup([
        { name: '가은', relationship: 'friend' },
        { name: '나윤', relationship: 'friend' },
      ]),
      testRuleSet,
    );

    expect(results[0].picks[0].flower.id).toBe(first);
    expect(results[1].picks[0].flower.id).toBe(second);

    // 밀려난 쪽에만 분산 안내가 붙는다.
    expect(results[1].picks[0].cautions.some((c) => c.includes('겹치지'))).toBe(true);
    expect(results[0].picks[0].cautions.some((c) => c.includes('겹치지'))).toBe(false);

    // 나머지는 대안으로 남는다.
    expect(results[1].picks.map((p) => p.flower.id)).toContain(first);
  });

  it('후보가 한 종뿐이면 실패하지 않고 중복을 허용한다', () => {
    const singleFlowerSet: RuleSet = {
      flowers: testFlowers.filter((f) => f.id === 'gerbera'),
      rules: testRules,
    };

    const results = recommendGroupIndividual(
      makeGroup([{ name: '가은' }, { name: '나윤' }, { name: '다인' }]),
      singleFlowerSet,
    );

    expect(assignedIds(results)).toEqual(['gerbera', 'gerbera', 'gerbera']);
    // 바꿔 배정할 대안이 없었으니 분산 안내도 붙지 않는다.
    for (const result of results) {
      expect(result.picks[0].cautions.some((c) => c.includes('겹치지'))).toBe(false);
    }
  });

  it('엔진 배럴에서도 그룹 함수를 그대로 꺼내 쓸 수 있다', () => {
    expect(engine.recommendGroupIndividual).toBe(recommendGroupIndividual);
    expect(engine.recommendGroupBouquet).toBe(recommendGroupBouquet);
    expect(engine.MAX_GROUP_MEMBERS).toBe(MAX_GROUP_MEMBERS);
  });

  it('11명이면 zod가 최대 인원을 알리며 거부한다', () => {
    const tooMany = makeGroup(
      Array.from({ length: MAX_GROUP_MEMBERS + 1 }, (_, i) => ({ name: `멤버${i + 1}` })),
    );

    expect(() => recommendGroupIndividual(tooMany, testRuleSet)).toThrow(/최대 10명/);
    expect(() => recommendGroupBouquet(tooMany, testRuleSet)).toThrow(/최대 10명/);

    // 정확히 10명은 통과한다.
    const exactly = makeGroup(
      Array.from({ length: MAX_GROUP_MEMBERS }, (_, i) => ({ name: `멤버${i + 1}` })),
    );
    expect(recommendGroupIndividual(exactly, testRuleSet)).toHaveLength(MAX_GROUP_MEMBERS);
  });
});

/* ------------------------------------------------------------------ *
 * 2. 단체 부케
 * ------------------------------------------------------------------ */

describe('recommendGroupBouquet (단체 부케)', () => {
  it('한 명이라도 고양이를 키우면 백합을 빼고 그 사람 이름으로 사유를 남긴다', () => {
    const bouquet = recommendGroupBouquet(
      makeGroup([{ name: '지수', pets: ['cat'] }, { name: '민준' }]),
      testRuleSetWithMeanings,
    );

    expect(bouquet.flowers.map((f) => f.flower.id)).not.toContain('lily-asiatic');

    const lily = bouquet.excluded.find((e) => e.flower.id === 'lily-asiatic');
    expect(lily).toBeDefined();
    expect(lily?.because).toEqual(['지수']);
    expect(lily?.reason).toContain('고양이');

    expect(bouquet.caution).toContain('지수님과 사는 고양이를');
    expect(bouquet.caution).toContain('아시아틱 릴리');
    expect(bouquet.caution).toContain('다발에서 뺐어요');
    // 괄호 조사(`아시아틱 릴리은(는)`)·`반려견를` 류가 화면 문자열로 새어 나가지 않는다.
    expect(bouquet.caution).not.toMatch(/[은이을](\(|（)/);
  });

  it('mild_gi 꽃은 부케에 남기고 주의 문구만 붙인다', () => {
    const bouquet = recommendGroupBouquet(
      makeGroup([{ name: '지수', pets: ['cat'] }, { name: '민준' }]),
      testRuleSetWithMeanings,
    );

    const tulip = bouquet.flowers.find((f) => f.flower.id === 'tulip-white');
    expect(tulip).toBeDefined();
    expect(tulip?.cautions.some((c) => c.includes('고양이'))).toBe(true);
    expect(bouquet.excluded.some((e) => e.flower.id === 'tulip-white')).toBe(false);
  });

  it('향에 민감한 멤버가 있으면 향이 강한 꽃은 전부 빠진다', () => {
    const bouquet = recommendGroupBouquet(
      makeGroup([{ name: '하람', fragranceSensitive: true }, { name: '도윤' }]),
      testRuleSetWithMeanings,
    );

    for (const result of bouquet.flowers) {
      expect(flowerById(result.flower.id).fragranceLevel).toBeLessThan(2);
    }

    const fragrant = bouquet.excluded.filter((e) => e.reason.includes('향'));
    expect(fragrant.map((e) => e.flower.id).sort()).toEqual([
      'freesia',
      'lily-asiatic',
      'rose-red',
    ]);
    for (const item of fragrant) {
      expect(item.because).toEqual(['하람']);
    }

    // 반려동물 사유가 없으면 caution 은 만들지 않는다.
    expect(bouquet.caution).toBeUndefined();
  });

  it('부케는 최대 3종이고 멤버 평균 적합도 내림차순으로 담긴다', () => {
    const bouquet = recommendGroupBouquet(
      makeGroup([
        { name: '가은', relationship: 'friend' },
        { name: '나윤', relationship: 'lover' },
        { name: '다인', relationship: 'friend' },
        { name: '라온', relationship: 'lover' },
      ]),
      testRuleSetWithMeanings,
    );

    expect(bouquet.flowers.length).toBeLessThanOrEqual(MAX_BOUQUET_FLOWERS);
    expect(bouquet.flowers).toHaveLength(3);
    expect(bouquet.excluded).toHaveLength(0);

    const scores = bouquet.flowers.map((f) => f.fitScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));

    // friend 2명 + lover 2명의 평균이라 friend 전용 gerbera 가 lover 전용 rose 를 앞선다.
    const ids = bouquet.flowers.map((f) => f.flower.id);
    expect(ids[0]).toBe('gerbera');
    expect(ids).not.toContain('rose-red');
  });
});

/* ------------------------------------------------------------------ *
 * 3. 색상 선택지
 * ------------------------------------------------------------------ */

describe('colorOptions (색 다시 고르기)', () => {
  it('그 꽃의 색 전체를 선택지로 주고 제안한 색에만 isSuggested가 선다', () => {
    const results = recommend(makeInput({ colorPrefs: ['orange'] }), testRuleSetWithMeanings);
    const lily = results.find((r) => r.flower.id === 'lily-asiatic');
    expect(lily).toBeDefined();

    const options = lily?.colorOptions ?? [];
    expect(options.map((o) => o.color)).toEqual(['white', 'pink', 'orange']);
    expect(options.filter((o) => o.isSuggested)).toHaveLength(1);
    expect(optionFor(options, 'orange').isSuggested).toBe(true);
    expect(lily?.colorSuggestion?.color).toBe('orange');

    // 색별 꽃말과 신뢰도가 색마다 따로 붙는다.
    const white = optionFor(options, 'white');
    expect(white.meaningKo).toBe('순수한 마음과 존경');
    expect(white.sourceId).toBe('test-lily-white');
    expect(white.confidenceLevel).toBe('repeated');

    const orange = optionFor(options, 'orange');
    expect(orange.meaningKo).toBe('위엄과 자부심');
    expect(orange.confidenceLevel).toBe('varies');

    // 그 색의 꽃말을 못 찾으면 색 이름만 남긴다.
    const pink = optionFor(options, 'pink');
    expect(pink.meaningKo).toBeUndefined();
    expect(pink.confidenceLevel).toBeUndefined();
  });

  it('꽃말을 주지 않아도 색 이름만으로 선택지를 채운다', () => {
    const results = recommend(makeInput({ colorPrefs: ['orange'] }), testRuleSet);
    const lily = results.find((r) => r.flower.id === 'lily-asiatic');

    expect(lily?.colorOptions?.map((o) => o.color)).toEqual(['white', 'pink', 'orange']);
    for (const option of lily?.colorOptions ?? []) {
      expect(option.meaningKo).toBeUndefined();
      expect(option.sourceId).toBeUndefined();
      expect(option.confidenceLevel).toBeUndefined();
    }
    expect(optionFor(lily?.colorOptions, 'orange').isSuggested).toBe(true);
  });

  it('색을 가리지 않는 꽃말 행은 모든 색 선택지에 똑같이 붙는다', () => {
    const results = recommend(makeInput(), testRuleSetWithMeanings);
    const gerbera = results.find((r) => r.flower.id === 'gerbera');

    const options = gerbera?.colorOptions ?? [];
    expect(options.map((o) => o.color)).toEqual(['pink', 'yellow', 'orange', 'red']);
    for (const option of options) {
      expect(option.meaningKo).toBe('언제나 곁에 있는 밝은 응원');
      expect(option.confidenceLevel).toBe('single_source');
    }
    // 제안한 색(대표색 pink)과 선택지의 꽃말이 어긋나지 않는다.
    expect(gerbera?.colorSuggestion?.color).toBe('pink');
    expect(optionFor(options, 'pink').meaningKo).toBe(gerbera?.colorSuggestion?.meaningKo);
  });

  it('단체 부케 결과에도 색 선택지가 함께 온다', () => {
    const bouquet = recommendGroupBouquet(
      makeGroup([{ name: '가은' }, { name: '나윤', colorPrefs: ['red'] }]),
      testRuleSetWithMeanings,
    );

    for (const result of bouquet.flowers) {
      const options = result.colorOptions ?? [];
      expect(options.length).toBe(flowerById(result.flower.id).colors.length);
      expect(options.filter((o) => o.isSuggested)).toHaveLength(1);
    }
  });
});
