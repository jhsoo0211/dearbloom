import { describe, expect, it } from 'vitest';

import {
  birthCalendar,
  birthDateLabel,
  birthDatesLabel,
  birthDaysOf,
  birthFlowerOn,
} from '@/lib/data/birth-flowers';
import type { BirthFlower } from '@/lib/data/types';

/**
 * 탄생화 조회 헬퍼 — **디스크 없이** 규칙만 본다.
 *
 * 실데이터가 366일을 채우고 있는지는 `tests/seed/birth-flowers.test.ts` 가 이미 보고,
 * 로더가 그 표를 카탈로그로 옮겨 오는지는 `tests/data/catalog.test.ts` 가 본다.
 * 여기서 지키려는 것은 그 사이의 계산이다 — 특히 **2월 29일**. 그 날이 조용히 빠지면
 * 4년에 한 번 태어난 사람에게만 화면이 비고, 그 사실은 아무도 눈치채지 못한다.
 */

function row(month: number, day: number, extra: Partial<BirthFlower> = {}): BirthFlower {
  return {
    month,
    day,
    nameKo: `${month}월 ${day}일의 꽃`,
    meaningKo: '희망',
    sourceUrl: 'https://example.test/birth',
    ...extra,
  };
}

describe('birthFlowerOn', () => {
  const rows = [
    row(1, 1, { nameKo: '스노드롭' }),
    row(2, 29, { nameKo: '아르메리아', meaningKo: '배려' }),
    row(3, 21, { nameKo: '벚꽃난' }),
  ];

  it('월·일로 그 날의 한 행을 집는다', () => {
    expect(birthFlowerOn(rows, 3, 21)?.nameKo).toBe('벚꽃난');
  });

  it('2월 29일도 실재하는 생일이다 — 빠뜨리지 않는다', () => {
    const leapDay = birthFlowerOn(rows, 2, 29);
    expect(leapDay?.nameKo).toBe('아르메리아');
    expect(leapDay?.meaningKo).toBe('배려');
  });

  it('표에 없는 날짜는 undefined 다 (화면이 폴백 문구를 세우게)', () => {
    expect(birthFlowerOn(rows, 2, 30)).toBeUndefined();
    expect(birthFlowerOn(rows, 12, 25)).toBeUndefined();
  });

  it('정수가 아닌 입력은 조용히 undefined — 서버 액션 인자가 네트워크에서 온다', () => {
    expect(birthFlowerOn(rows, Number.NaN, 1)).toBeUndefined();
    expect(birthFlowerOn(rows, 1.5, 1)).toBeUndefined();
    expect(birthFlowerOn(rows, 1, Number.NaN)).toBeUndefined();
  });
});

describe('birthDaysOf (역조회)', () => {
  const rows = [
    row(10, 27, { flowerId: 'rose-red' }),
    row(6, 1, { flowerId: 'rose-red' }),
    row(7, 15, { flowerId: 'rose-red' }),
    row(6, 4, { flowerId: 'rose-red' }),
    row(1, 4, { flowerId: 'hyacinth' }),
    row(5, 5),
  ];

  it('한 종이 여러 날에 걸린다 — 전부 모아 달력 순으로 세운다', () => {
    const days = birthDaysOf(rows, 'rose-red');
    expect(days.map((day) => [day.month, day.day])).toEqual([
      [6, 1],
      [6, 4],
      [7, 15],
      [10, 27],
    ]);
  });

  it('표에 안 걸린 꽃은 빈 배열이다 (화면이 줄 자체를 세우지 않는다)', () => {
    expect(birthDaysOf(rows, 'peony')).toEqual([]);
    expect(birthDaysOf(rows, '')).toEqual([]);
  });

  it('flower_id 가 빈 행을 빈 질의로 긁어오지 않는다', () => {
    // `flowerId` 없는 행이 `undefined` 라, 빈 문자열 질의가 그것들과 만나면 안 된다.
    expect(birthDaysOf(rows, '')).toHaveLength(0);
  });

  it('원본 배열을 뒤집어 놓지 않는다 (정렬이 호출부로 새면 CSV 순서가 무너진다)', () => {
    const before = rows.map((item) => `${item.month}-${item.day}`);
    birthDaysOf(rows, 'rose-red');
    expect(rows.map((item) => `${item.month}-${item.day}`)).toEqual(before);
  });
});

describe('날짜 표기', () => {
  it('birthDateLabel 은 `3월 21일`', () => {
    expect(birthDateLabel(3, 21)).toBe('3월 21일');
    expect(birthDateLabel(10, 9)).toBe('10월 9일');
  });

  it('birthDatesLabel 은 가운뎃점으로 잇는다', () => {
    expect(birthDatesLabel([row(3, 21), row(10, 9)])).toBe('3월 21일 · 10월 9일');
  });

  it('빈 목록은 빈 문자열 — 호출부가 그것으로 유무를 가른다', () => {
    expect(birthDatesLabel([])).toBe('');
  });
});

describe('birthCalendar', () => {
  it('달마다 마지막 날을 표에서 직접 센다', () => {
    const rows = [row(1, 31), row(1, 5), row(2, 29), row(4, 30)];
    const calendar = birthCalendar(rows);

    expect(calendar).toHaveLength(12);
    expect(calendar[0]).toBe(31);
    // 2월 29 — 상수를 베껴 오지 않고 표에서 세므로 윤일이 저절로 살아 있다.
    expect(calendar[1]).toBe(29);
    expect(calendar[3]).toBe(30);
    // 행이 없는 달은 0 이고, 화면은 그 달에 고를 날이 없다는 뜻으로 읽는다.
    expect(calendar[11]).toBe(0);
  });
});
