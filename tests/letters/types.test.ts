import { describe, expect, it } from 'vitest';

import { STORY_CATEGORIES } from '@/components/stories/categories';
import { LETTER_THEME_OPTIONS } from '@/components/letter/themes';
import {
  LETTER_CODE_ALPHABET,
  LETTER_LIMITS,
  LETTER_THEMES,
  createLetterCode,
  letterCodeSchema,
  letterContentSchema,
  normalizeLetterCode,
} from '@/lib/letters/types';

/**
 * 편지의 **상한과 어휘**를 지키는 그물.
 *
 * 특히 잡고 싶은 것:
 *   · 화면 `maxLength` 만 믿고 스키마 상한이 헐거워지는 경우(붙여넣기 한 번에 뚫린다)
 *   · 색감 5계열이 `/stories`·도감의 계열 어휘와 갈라지는 경우
 *     (`src/lib` 은 `src/components` 를 import 하지 않아 타입이 잡아 주지 못한다 —
 *      두 목록을 맞대는 일은 여기서만 할 수 있다)
 *   · 만들어 준 번호가 정작 번호 스키마에서 떨어지는 경우
 */

/** 폼이 통과시키는 최소한의 한 벌. 각 테스트가 필요한 칸만 덮어쓴다. */
const BASE = {
  recipientName: '한빛',
  body: '오래 미뤄 둔 말을 이제야 적어요.',
  flowerId: 'freesia',
  theme: 'ivory',
  signature: '수호',
} as const;

describe('편지 색감 어휘', () => {
  it('5계열의 키가 아카이브·도감의 계열 어휘와 같다', () => {
    expect([...LETTER_THEMES]).toEqual(STORY_CATEGORIES.map((category) => category.key));
  });

  it('칩 라벨은 계열 이름을 그대로 쓴다(새 이름을 짓지 않는다)', () => {
    for (const option of LETTER_THEME_OPTIONS) {
      const category = STORY_CATEGORIES.find((row) => row.key === option.key);
      expect(option.label).toBe(category?.label);
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  it('어휘 밖 계열은 스키마가 막는다', () => {
    expect(letterContentSchema.safeParse({ ...BASE, theme: 'neon' }).success).toBe(false);
  });
});

describe('길이 상한', () => {
  it('상한과 같은 길이는 통과하고, 한 글자 넘으면 걸린다', () => {
    const cases: [keyof typeof BASE, number][] = [
      ['recipientName', LETTER_LIMITS.recipientName],
      ['body', LETTER_LIMITS.body],
      ['signature', LETTER_LIMITS.signature],
    ];

    for (const [field, max] of cases) {
      expect(
        letterContentSchema.safeParse({ ...BASE, [field]: '가'.repeat(max) }).success,
        `${field} — 상한과 같은 길이는 통과해야 한다`,
      ).toBe(true);
      expect(
        letterContentSchema.safeParse({ ...BASE, [field]: '가'.repeat(max + 1) }).success,
        `${field} — 상한을 넘으면 걸려야 한다`,
      ).toBe(false);
    }
  });

  it('제목은 선택이고 30자까지다', () => {
    expect(letterContentSchema.safeParse(BASE).success).toBe(true);
    expect(
      letterContentSchema.safeParse({ ...BASE, title: '가'.repeat(LETTER_LIMITS.title) }).success,
    ).toBe(true);
    expect(
      letterContentSchema.safeParse({ ...BASE, title: '가'.repeat(LETTER_LIMITS.title + 1) })
        .success,
    ).toBe(false);
  });

  it('빈 제목은 없는 것으로 접힌다 — 저장소에 빈 문자열이 남지 않는다', () => {
    const parsed = letterContentSchema.parse({ ...BASE, title: '   ' });
    expect(parsed.title).toBeUndefined();
  });

  it('앞뒤 공백은 털어 내고 재고, 공백뿐인 칸은 빈 칸이다', () => {
    const parsed = letterContentSchema.parse({ ...BASE, recipientName: '  한빛  ' });
    expect(parsed.recipientName).toBe('한빛');
    expect(letterContentSchema.safeParse({ ...BASE, body: '   ' }).success).toBe(false);
  });

  it('꽃을 고르지 않으면 걸린다', () => {
    expect(letterContentSchema.safeParse({ ...BASE, flowerId: '' }).success).toBe(false);
  });

  it('오류 문구는 해요체다(§1.5d) — 그대로 화면에 나가는 문장이다', () => {
    const result = letterContentSchema.safeParse({ ...BASE, recipientName: '' });
    expect(result.success).toBe(false);
    if (result.success) return;
    for (const issue of result.error.issues) {
      expect(issue.message).toMatch(/요[.?]$|세요[.?]$/);
    }
  });
});

describe('편지 번호', () => {
  it('4~12자 영문·숫자만 통과한다', () => {
    for (const good of ['ABCD', 'HANBIT', 'A1B2C3D4', '2468', 'A1B2C3D4E5F6']) {
      expect(letterCodeSchema.safeParse(good).success, good).toBe(true);
    }
    for (const bad of ['ABC', 'A1B2C3D4E5F67', '한빛하나', 'AB CD', 'ABC-12', '']) {
      expect(letterCodeSchema.safeParse(bad).success, bad).toBe(false);
    }
  });

  it('소문자·앞뒤 공백은 같은 번호로 모인다', () => {
    expect(letterCodeSchema.parse('  hanbit ')).toBe('HANBIT');
    expect(normalizeLetterCode(' hanbit ')).toBe('HANBIT');
  });

  it('만들어 준 번호는 언제나 스키마를 통과한다 — 기본 10자리(맞히기 어렵게)', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = createLetterCode();
      expect(letterCodeSchema.safeParse(code).success, code).toBe(true);
      expect(code).toHaveLength(10);
    }
  });

  it('자릿수는 4~12 안으로 끌어당긴다 — 만든 번호가 스키마에서 떨어지지 않는다', () => {
    expect(createLetterCode(1)).toHaveLength(LETTER_LIMITS.codeMin);
    expect(createLetterCode(99)).toHaveLength(LETTER_LIMITS.codeMax);
    expect(createLetterCode(Number.NaN)).toHaveLength(LETTER_LIMITS.codeMin);
  });

  it('헷갈리는 글자(I·L·O·0·1)는 쓰지 않는다', () => {
    expect(LETTER_CODE_ALPHABET).not.toMatch(/[ILO01]/);
    for (let i = 0; i < 200; i += 1) {
      expect(createLetterCode(8)).not.toMatch(/[ILO01]/);
    }
  });

  it('난수를 고정하면 결과도 고정된다(자릿수 계산이 알파벳 순서를 따른다)', () => {
    expect(createLetterCode(6, () => 0)).toBe('AAAAAA');
    expect(createLetterCode(4, () => LETTER_CODE_ALPHABET.length - 1)).toBe('9999');
  });
});
