import { describe, expect, it } from 'vitest';

import {
  EPISODE_HINTS,
  INTENT_DETAIL_MAX_CHARS,
  INTENT_LABELS,
  PRESET_MOMENTS,
  RECIPIENT_CHIPS,
  episodeHintLabels,
  presetMoment,
  splitRecipientChips,
} from '@/components/flow/labels';
import { INTENTS, RECIPIENT_TRAITS, RELATIONSHIPS, SPECIES, recommend } from '@/lib/engine';
import { INTENT_DETAIL_MAX_CHARS as CONTRACT_INTENT_DETAIL_MAX } from '@/lib/llm/contracts';
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
  it('6종이며 값·라벨이 겹치지 않는다', () => {
    expect(EPISODE_HINTS).toHaveLength(6);
    expect(new Set(EPISODE_HINTS.map((h) => h.value)).size).toBe(6);
    expect(EPISODE_HINTS.map((h) => h.label)).toEqual([
      '오랜만에 연락해요',
      '최근에 다퉜어요',
      '함께 여행한 추억이 있어요',
      '많이 지쳐 보여요',
      '축하할 일이 생겼어요',
      '멀리 떨어져 지내요',
    ]);
  });

  it('slug 를 라벨로 옮기고 사전 밖 값·중복은 버린다', () => {
    expect(episodeHintLabels(['quarrel', 'trip-memory'])).toEqual([
      '최근에 다퉜어요',
      '함께 여행한 추억이 있어요',
    ]);
    expect(episodeHintLabels(['quarrel', 'quarrel', '아무말'])).toEqual(['최근에 다퉜어요']);
    expect(episodeHintLabels([])).toEqual([]);
  });
});
