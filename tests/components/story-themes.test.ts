/**
 * `/stories` 꽃말 테마 매핑 — 화면이 아니라 **규칙**을 지킨다.
 *
 * 이 매핑은 서버에서 한 번 돌아 `꽃 id → 테마` 로 굳은 채 화면에 내려간다. 그래서
 * 여기서 깨지면 화면에서는 "칩이 하나 없네" 정도로만 보이고 원인을 찾기 어렵다 —
 * 키워드 하나하나가 실제로 꽃말 문장에 걸리는지, 걸린 결과가 꽃 단위로 잘 모이는지,
 * 그리고 **아무 꽃도 못 가진 테마는 칩이 서지 않는지**를 이 파일이 못 박는다.
 */

import { describe, expect, it } from 'vitest';

import {
  STORY_THEMES,
  buildFlowerThemes,
  buildThemeChips,
  themeLabel,
  themesOfMeaning,
  type StoryThemeKey,
} from '@/components/stories/themes';

describe('themesOfMeaning — 꽃말 문장 → 테마', () => {
  it('테마 8종이 선언 순서대로 있고 라벨이 비어 있지 않다', () => {
    expect(STORY_THEMES.map((theme) => theme.key)).toEqual([
      'love',
      'beginning',
      'hope',
      'gratitude',
      'innocence',
      'comfort',
      'memory',
      'fortune',
    ]);
    for (const theme of STORY_THEMES) {
      expect(theme.label.length).toBeGreaterThan(0);
      expect(theme.keywords.length).toBeGreaterThan(0);
    }
  });

  it('각 테마의 키워드가 문장 안에 있으면 그 테마가 걸린다', () => {
    for (const theme of STORY_THEMES) {
      for (const keyword of theme.keywords) {
        // 실제 꽃말처럼 앞뒤에 말이 붙은 문장으로 확인한다(부분 일치가 규칙이다).
        expect(themesOfMeaning(`${keyword}을 담은 꽃`)).toContain(theme.key);
      }
    }
  });

  it('실제 meanings.csv 문장을 규칙대로 가른다', () => {
    expect(themesOfMeaning('열정적인 사랑과 깊은 애정')).toEqual(['love']);
    expect(themesOfMeaning('용서를 구하는 마음과 새로운 시작')).toEqual(['beginning']);
    expect(themesOfMeaning('감사와 우아함, 부드러운 호감')).toEqual(['gratitude']);
    expect(themesOfMeaning('겨울을 견디는 조용한 위로')).toEqual(['comfort']);
    expect(themesOfMeaning('깊은 슬픔과 애도')).toEqual(['memory']);
    expect(themesOfMeaning('부귀와 영화 — 꽃 중의 왕')).toEqual(['fortune']);
  });

  it('한 문장이 여러 테마에 걸리면 전부 담고, 순서는 언제나 선언 순서다', () => {
    // 'love'(사랑)가 뒤에 적혀 있어도 앞에 온다 — 입력 낱말 순서에 흔들리면 안 된다.
    expect(themesOfMeaning('새로운 시작, 그리고 설렘 가득한 사랑')).toEqual(['love', 'beginning']);
  });

  it('낱말 사이 공백이 있든 없든 같은 테마로 본다', () => {
    expect(themesOfMeaning('티 없는 마음')).toEqual(['innocence']);
    expect(themesOfMeaning('티없는 마음')).toEqual(['innocence']);
  });

  it('걸리는 말이 없으면 빈 배열이다', () => {
    expect(themesOfMeaning('마음을 씻어 낸다고 믿었던 약초')).toEqual([]);
    expect(themesOfMeaning('')).toEqual([]);
  });

  it('같은 문장을 여러 번 물어도 답이 같다(정규식 상태가 남지 않는다)', () => {
    const first = themesOfMeaning('변함없는 믿음과 용기');
    const second = themesOfMeaning('변함없는 믿음과 용기');
    expect(first).toEqual(second);
    expect(first).toEqual(['hope']);
  });
});

describe('buildFlowerThemes — 꽃 → 테마 집합', () => {
  const rows = [
    { flowerId: 'tulip-white', meaningKo: '용서를 구하는 마음과 새로운 시작' },
    { flowerId: 'tulip-white', meaningKo: '순수한 마음과 존경' },
    { flowerId: 'tulip-white', meaningKo: '새로운 시작, 봄의 설렘' },
    { flowerId: 'rose-red', meaningKo: '열정적인 사랑과 깊은 애정' },
    { flowerId: 'hellebore', meaningKo: '마음을 씻어 낸다고 믿었던 약초' },
  ];

  it('꽃 한 종이 여러 꽃말의 테마를 모두 갖는다(중복은 한 번만)', () => {
    const map = buildFlowerThemes(rows);
    // 사랑(설렘) · 새로운 시작 · 감사·존경 · 순수 — 선언 순서대로.
    expect(map['tulip-white']).toEqual(['love', 'beginning', 'gratitude', 'innocence']);
  });

  it('테마가 하나도 안 걸린 꽃은 키 자체가 없다', () => {
    const map = buildFlowerThemes(rows);
    expect(map['hellebore']).toBeUndefined();
    expect(Object.keys(map).sort()).toEqual(['rose-red', 'tulip-white']);
  });

  it('빈 표를 줘도 안전하다', () => {
    expect(buildFlowerThemes([])).toEqual({});
  });
});

describe('buildThemeChips — 칩 줄', () => {
  const flowerThemes: Record<string, StoryThemeKey[]> = {
    'tulip-white': ['beginning', 'innocence'],
    freesia: ['beginning'],
    'rose-red': ['love'],
  };
  const lanes = [
    { flowerId: 'tulip-white', storyCount: 9 },
    { flowerId: 'freesia', storyCount: 4 },
    { flowerId: 'rose-red', storyCount: 6 },
    // 레인은 있지만 테마가 없는 꽃 — 어느 칩의 숫자에도 들어가지 않는다.
    { flowerId: 'hellebore', storyCount: 3 },
  ];

  it('숫자는 그 테마를 가진 꽃들의 **편수 합**이다', () => {
    const chips = buildThemeChips(lanes, flowerThemes);
    expect(chips.find((chip) => chip.key === 'beginning')?.count).toBe(13);
    expect(chips.find((chip) => chip.key === 'love')?.count).toBe(6);
    expect(chips.find((chip) => chip.key === 'innocence')?.count).toBe(9);
  });

  it('매칭된 꽃이 없는 테마는 칩을 세우지 않는다', () => {
    const chips = buildThemeChips(lanes, flowerThemes);
    expect(chips.map((chip) => chip.key)).toEqual(['love', 'beginning', 'innocence']);
    expect(chips.some((chip) => chip.key === 'fortune')).toBe(false);
    expect(chips.every((chip) => chip.count > 0)).toBe(true);
  });

  it('칩 라벨은 테마 사전에서 온다(화면이 문장을 지어내지 않는다)', () => {
    const chips = buildThemeChips(lanes, flowerThemes);
    for (const chip of chips) expect(chip.label).toBe(themeLabel(chip.key));
    // 모르는 키는 영문 slug 를 흘리지 않고 빈 문자열이다.
    expect(themeLabel('nope')).toBe('');
  });

  it('레인이 없으면 칩도 없다', () => {
    expect(buildThemeChips([], flowerThemes)).toEqual([]);
  });
});
