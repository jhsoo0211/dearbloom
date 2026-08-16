import { describe, expect, it } from 'vitest';

import {
  BUDGET_CHOICES,
  BUDGET_DETAIL_MAX_CHARS,
  BUDGET_OTHER,
  EPISODE_HINTS,
  EPISODE_HINT_DETAIL_MAX_CHARS,
  EPISODE_HINT_OTHER,
  INTENT_DETAIL_MAX_CHARS,
  INTENT_LABELS,
  PRESET_MOMENTS,
  RECIPIENT_CHIPS,
  RELATIONSHIP_DETAIL_MAX_CHARS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_TO_LABELS,
  budgetChoice,
  episodeHintLabels,
  presetMoment,
  splitRecipientChips,
} from '@/components/flow/labels';
import {
  INTENTS,
  RECIPIENT_TRAITS,
  RELATIONSHIPS,
  SPECIES,
  allowedPriceBands,
  recommend,
} from '@/lib/engine';
import {
  INTENT_DETAIL_MAX_CHARS as CONTRACT_INTENT_DETAIL_MAX,
  RELATIONSHIP_DETAIL_MAX_CHARS as CONTRACT_RELATIONSHIP_DETAIL_MAX,
} from '@/lib/llm/contracts';
import { makeInput, testRuleSetWithMeanings } from '../engine/fixtures';

/**
 * §1.5l 추천 입력 개편의 화면↔엔진 접합부.
 *
 * 여기서 지키려는 것은 하나다 — **화면은 칩만 돌려주고, 엔진 입력으로 나누는 일은
 * 서버가 한 곳(`splitRecipientChips`)에서 한다.** 그 표가 어긋나면 반려동물 안전 제외처럼
 * 조용히 사라지는 규칙이 생긴다.
 */

describe('시작 프리셋 (§1.5l)', () => {
  it('8종이며 값은 전부 엔진 어휘 안에 있다', () => {
    expect(PRESET_MOMENTS).toHaveLength(8);
    for (const preset of PRESET_MOMENTS) {
      expect(RELATIONSHIPS, preset.value).toContain(preset.relationship);
      expect(INTENTS, preset.value).toContain(preset.intent);
      expect(preset.label.trim()).not.toBe('');
    }
  });

  it('값·라벨이 겹치지 않고 자주 쓰일 순서를 지킨다', () => {
    expect(new Set(PRESET_MOMENTS.map((p) => p.value)).size).toBe(PRESET_MOMENTS.length);
    expect(new Set(PRESET_MOMENTS.map((p) => p.label)).size).toBe(PRESET_MOMENTS.length);

    expect(PRESET_MOMENTS.map((p) => p.label)).toEqual([
      '부모님 감사 인사',
      '다툰 다음 날',
      '친구의 생일',
      '동료의 새 출발',
      '우리의 기념일',
      '지친 친구에게',
      '설레는 고백',
      '이유 없이, 문득',
    ]);

    expect(presetMoment('after-quarrel')).toMatchObject({
      relationship: 'lover',
      intent: 'apology',
    });
    expect(presetMoment('없는-값')).toBeUndefined();
  });

  it('라벨이 상황 서술이지 지시가 아니다 (§1.5d)', () => {
    // "사과해야 해요" 같은 명시형 지시를 쓰지 않는다.
    for (const preset of PRESET_MOMENTS) {
      expect(preset.label, preset.value).not.toMatch(/해야|하세요|하십시오/);
    }
  });
});

describe("마음 'other' 표기 (§1.5l)", () => {
  it('마음 어휘 8종 전부에 라벨이 있고 other 문구가 스펙 그대로다', () => {
    expect(INTENTS).toHaveLength(8);
    for (const intent of INTENTS) expect(INTENT_LABELS[intent].label.trim()).not.toBe('');

    expect(INTENT_LABELS.other).toEqual({ label: '직접 쓸게요', desc: '위에 없는 마음이에요' });
  });

  it('한 줄 입력의 길이 상한을 화면·서버·계약이 같은 값으로 쓴다', () => {
    expect(INTENT_DETAIL_MAX_CHARS).toBe(80);
    expect(CONTRACT_INTENT_DETAIL_MAX).toBe(INTENT_DETAIL_MAX_CHARS);
  });
});

describe('특징 칩 → 엔진 입력 (§1.5l)', () => {
  it('엔진 페르소나 어휘 5종을 빠짐없이 덮는다', () => {
    const traits = RECIPIENT_CHIPS.map((chip) => chip.trait).filter(Boolean);
    for (const trait of RECIPIENT_TRAITS) expect(traits, trait).toContain(trait);
  });

  it('반려동물 칩은 종 2종을 덮고, 값·라벨이 겹치지 않는다', () => {
    const pets = RECIPIENT_CHIPS.map((chip) => chip.pet).filter(Boolean);
    for (const species of SPECIES) expect(pets, species).toContain(species);

    expect(new Set(RECIPIENT_CHIPS.map((c) => c.value)).size).toBe(RECIPIENT_CHIPS.length);
    expect(new Set(RECIPIENT_CHIPS.map((c) => c.label)).size).toBe(RECIPIENT_CHIPS.length);
  });

  it('칩 하나가 제 자리로 나뉜다 — 태그·반려동물·향', () => {
    const split = splitRecipientChips([
      'vivid',
      'cat-home',
      'dog-home',
      'loves-fragrance',
      'long-lasting',
    ]);

    expect(split.traits).toEqual(['vivid']);
    expect(split.pets).toEqual(['cat', 'dog']);
    expect(split.fragrancePreference).toBe(true);
    expect(split.fragranceSensitive).toBe(false);
    expect(split.labels).toEqual([
      '화려한 걸 좋아해요',
      '반려묘와 살아요',
      '반려견과 살아요',
      '향기를 좋아해요',
      '오래 두고 보고 싶어해요',
    ]);
  });

  it('향에 민감하면 향기 선호는 접힌다 (안전이 취향보다 앞선다)', () => {
    const split = splitRecipientChips(['loves-fragrance', 'fragrance-sensitive']);
    expect(split.fragranceSensitive).toBe(true);
    expect(split.fragrancePreference).toBe(false);
  });

  it('멘트 재료에서 반려동물·향 민감 칩은 빠진다 (프롬프트 절대 규칙 3)', () => {
    const split = splitRecipientChips([
      'cat-home',
      'fragrance-sensitive',
      'first-flowers',
      'elegant',
    ]);

    expect(split.messageNotes).toEqual(['꽃을 처음 받아봐요', '단정하고 기품 있는 걸 좋아해요']);
    // 맥락 칩에는 그대로 남는다 — 화면에서는 우리가 무엇을 들었는지 보여야 한다.
    expect(split.labels).toContain('반려묘와 살아요');
  });

  it('사전 밖 값과 중복은 조용히 버린다', () => {
    const split = splitRecipientChips(['vivid', 'vivid', 'cat', '   ', 'drop-table']);
    expect(split.traits).toEqual(['vivid']);
    expect(split.pets).toEqual([]);
    expect(split.labels).toEqual(['화려한 걸 좋아해요']);
  });

  it('반려묘 칩이 백합류 배제로 그대로 이어진다', () => {
    const chips = splitRecipientChips(['cat-home']);
    const results = recommend(
      makeInput({ pets: chips.pets, fragranceSensitive: chips.fragranceSensitive }),
      testRuleSetWithMeanings,
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results.map((r) => r.flower.id)).not.toContain('lily-asiatic');
  });

  it('칩을 하나도 고르지 않으면 엔진 입력이 비어 있다', () => {
    const split = splitRecipientChips([]);
    expect(split).toEqual({
      traits: [],
      pets: [],
      fragranceSensitive: false,
      fragrancePreference: false,
      labels: [],
      messageNotes: [],
    });
  });
});

describe('상황 칩 (§1.5l)', () => {
  it('6종 + 기타 = 7종이며 값·라벨이 겹치지 않는다', () => {
    expect(EPISODE_HINTS).toHaveLength(7);
    expect(new Set(EPISODE_HINTS.map((h) => h.value)).size).toBe(7);
    expect(EPISODE_HINTS.map((h) => h.label)).toEqual([
      '오랜만에 연락해요',
      '최근에 다퉜어요',
      '함께 여행한 추억이 있어요',
      '많이 지쳐 보여요',
      '축하할 일이 생겼어요',
      '멀리 떨어져 지내요',
      '기타 · 직접 적을게요',
    ]);
    // `기타` 는 목록의 **맨 끝**이다 — 갈래를 먼저 보여 주고 마지막에 빠져나갈 길을 연다.
    expect(EPISODE_HINTS.at(-1)?.value).toBe(EPISODE_HINT_OTHER);
  });

  it('slug 를 라벨로 옮기고 사전 밖 값·중복은 버린다', () => {
    expect(episodeHintLabels(['quarrel', 'trip-memory'])).toEqual([
      '최근에 다퉜어요',
      '함께 여행한 추억이 있어요',
    ]);
    expect(episodeHintLabels(['quarrel', 'quarrel', '아무말'])).toEqual(['최근에 다퉜어요']);
    expect(episodeHintLabels([])).toEqual([]);
  });

  it('`기타` 는 선택지 이름 대신 사용자가 적어 준 원문이 라벨 자리에 선다', () => {
    expect(episodeHintLabels(['quarrel', 'other'], '  서로 바빠서 자주 못 봐요  ')).toEqual([
      '최근에 다퉜어요',
      '서로 바빠서 자주 못 봐요',
    ]);
  });

  it('`기타` 를 골라도 한 줄이 비어 있으면 라벨을 세우지 않는다', () => {
    // "기타" 세 글자는 프롬프트에도 결과 칩에도 아무것도 말해 주지 않는다.
    expect(episodeHintLabels(['other'])).toEqual([]);
    expect(episodeHintLabels(['other', 'worn-out'], '   ')).toEqual(['많이 지쳐 보여요']);
  });

  it('한 줄 입력의 길이 상한이 다른 `직접 쓸게요` 들과 같다', () => {
    expect(EPISODE_HINT_DETAIL_MAX_CHARS).toBe(80);
  });
});

describe("사이 'other' 표기 (§1.5l)", () => {
  it('관계 어휘 7종 전부에 라벨이 있고 other 문구가 스펙 그대로다', () => {
    expect(RELATIONSHIPS).toHaveLength(7);
    for (const relationship of RELATIONSHIPS) {
      expect(RELATIONSHIP_LABELS[relationship].label.trim()).not.toBe('');
      expect(RELATIONSHIP_TO_LABELS[relationship].trim()).not.toBe('');
    }

    expect(RELATIONSHIP_LABELS.other).toEqual({
      label: '직접 쓸게요',
      desc: '위에 없는 사이예요',
    });
  });

  it('한 줄 입력의 길이 상한을 화면·서버·계약이 같은 값으로 쓴다', () => {
    expect(RELATIONSHIP_DETAIL_MAX_CHARS).toBe(80);
    expect(CONTRACT_RELATIONSHIP_DETAIL_MAX).toBe(RELATIONSHIP_DETAIL_MAX_CHARS);
  });

  it('`other` 는 목록의 맨 끝이다 — 갈래를 먼저 보여 주고 마지막에 길을 연다', () => {
    expect(RELATIONSHIPS.at(-1)).toBe('other');
  });
});

describe('예산 선택지 (§1.5l)', () => {
  it('6종이며 값·라벨이 겹치지 않고 낮은 값부터 선다', () => {
    expect(BUDGET_CHOICES).toHaveLength(6);
    expect(new Set(BUDGET_CHOICES.map((b) => b.value)).size).toBe(6);
    expect(BUDGET_CHOICES.map((b) => b.label)).toEqual([
      '1~2만 원대',
      '3만 원 미만',
      '3~5만 원',
      '5~10만 원',
      '10만 원 이상',
      '기타 · 직접 적을게요',
    ]);
  });

  it('`1~2만 원대` 는 `3만 원 미만` 과 같은 band 1 로 떨어진다 (라벨 세분이 목적)', () => {
    const under20 = budgetChoice('under20');
    const under30 = budgetChoice('under30');
    expect(under20?.max).toBeLessThan(30_000);
    expect(under30?.max).toBeLessThan(30_000);
    // price_band 가 1·2·3 뿐이라 두 선택지가 고를 수 있는 꽃은 같다 — 그것이 버그가 아니다.
    expect(allowedPriceBands(under20?.max)).toEqual(allowedPriceBands(under30?.max));
    expect(allowedPriceBands(under20?.max)).toEqual([1]);
  });

  it('`기타` 는 금액이 없어 예산 필터가 걸리지 않는다', () => {
    const other = budgetChoice(BUDGET_OTHER);
    expect(other).toBeDefined();
    expect(other?.min).toBeUndefined();
    expect(other?.max).toBeUndefined();
    // 값을 말하지 않은 것과 같은 자리 — 전 구간이 후보로 남는다.
    expect(allowedPriceBands(undefined)).toEqual([1, 2, 3]);
  });

  it('한 줄 입력의 길이 상한이 다른 `직접 쓸게요` 들과 같다', () => {
    expect(BUDGET_DETAIL_MAX_CHARS).toBe(80);
  });
});
