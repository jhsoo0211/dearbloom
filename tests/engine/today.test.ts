import { afterEach, describe, expect, it, vi } from 'vitest';
import * as engine from '@/lib/engine';
import { todayFlower } from '@/lib/engine/today';
import type { FlowerData } from '@/lib/engine/types';
import { flowerIds, testFlowers } from './fixtures';

/**
 * 오늘의 꽃 선택 엔진 테스트.
 *
 * 날짜 계산이 섞이므로 여기서도 로컬 Date 를 쓰지 않는다 — daysFrom 은 UTC 로만 하루를 센다.
 *
 * fixtures 의 testFlowers 5종은 달마다 후보 수가 달라 세 가지 후보군을 그대로 덮는다.
 *   3월 프리지아·튤립(2) · 5월 백합·튤립·장미·거베라(4) · 9~10월 장미·거베라(2)  → in_season
 *   11월 개화 꽃이 없어 10월(장미·거베라)까지 넓힘                                → adjacent
 *   12월 11·12·1월 개화가 하나도 없음                                            → all
 *   1·2월 프리지아(2월 개화) 한 종뿐                                             → 후보 1종
 */

/** 개화월만 다른 최소 꽃. 선택 로직은 id 와 bloomMonths 만 본다. */
function flower(id: string, bloomMonths: number[]): FlowerData {
  return {
    id,
    nameKo: id,
    nameEn: id,
    scientificName: id,
    colors: ['white'],
    bloomMonths,
    fragranceLevel: 0,
    priceBand: 1,
    aestheticTags: ['calm'],
    petSafety: [],
  };
}

const EVERY_MONTH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** startISO 부터 count 일치 'YYYY-MM-DD'. 로컬 타임존이 끼지 않게 UTC 로만 센다. */
function daysFrom(startISO: string, count: number): string[] {
  const [year, month, day] = startISO.split('-').map(Number);
  const base = Date.UTC(year, month - 1, day);
  return Array.from({ length: count }, (_, index) =>
    new Date(base + index * 86_400_000).toISOString().slice(0, 10),
  );
}

function pickIds(dates: string[], flowers: FlowerData[]): string[] {
  return dates.map((dateISO) => todayFlower(dateISO, flowers).flower.id);
}

/** 앞뒤로 같은 꽃이 나온 날. */
function repeatedDates(dates: string[], flowers: FlowerData[]): string[] {
  const picked = pickIds(dates, flowers);
  return dates.filter((_, index) => index > 0 && picked[index] === picked[index - 1]);
}

afterEach(() => {
  vi.useRealTimers();
});

/* ------------------------------------------------------------------ *
 * 1. 결정론
 * ------------------------------------------------------------------ */

describe('todayFlower — 결정론', () => {
  it('같은 날짜·같은 카탈로그면 언제나 같은 결과', () => {
    const first = todayFlower('2026-05-10', testFlowers);
    const second = todayFlower('2026-05-10', testFlowers);

    expect(second.flower.id).toBe(first.flower.id);
    expect(second.basis).toBe(first.basis);
    expect(second).toEqual(first);
  });

  it('카탈로그 배열 순서가 바뀌어도 같은 꽃 (해시 최솟값 + id 동점 처리)', () => {
    const reversed = [...testFlowers].reverse();
    for (const dateISO of daysFrom('2026-05-01', 40)) {
      expect(todayFlower(dateISO, reversed).flower.id).toBe(
        todayFlower(dateISO, testFlowers).flower.id,
      );
    }
  });

  it('현재 시각을 보지 않는다 — 시스템 시계를 바꿔도 결과가 그대로', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-05-10T00:00:00Z'));
    const onMay = todayFlower('2026-07-04', testFlowers);

    vi.setSystemTime(new Date('2019-11-30T23:59:59Z'));
    expect(todayFlower('2026-07-04', testFlowers)).toEqual(onMay);
  });

  it('날짜가 바뀌면 꽃도 돌아간다 — 7일 창마다 최소 2종', () => {
    const starts = [
      '2026-03-01',
      '2026-04-01',
      '2026-05-01',
      '2026-06-01',
      '2026-07-01',
      '2026-08-01',
      '2026-09-01',
      '2026-10-01',
      '2026-11-01',
      '2026-12-01',
    ];

    for (const start of starts) {
      const distinct = new Set(pickIds(daysFrom(start, 7), testFlowers));
      expect(distinct.size).toBeGreaterThanOrEqual(2);
    }
  });
});

/* ------------------------------------------------------------------ *
 * 2. 후보군 — 제철 → 앞뒤 달 → 전체
 * ------------------------------------------------------------------ */

describe('todayFlower — 후보군', () => {
  it('제철 꽃이 있으면 그 달에 피는 꽃만 나온다 (basis=in_season)', () => {
    for (const dateISO of daysFrom('2026-05-01', 31)) {
      const { flower: picked, basis } = todayFlower(dateISO, testFlowers);
      expect(basis).toBe('in_season');
      expect(picked.bloomMonths).toContain(5);
    }

    // 5월에 피지 않는 프리지아(2·3·4월)는 5월 내내 한 번도 나오지 않는다.
    expect(pickIds(daysFrom('2026-05-01', 31), testFlowers)).not.toContain('freesia');
  });

  it('그 달 제철이 없으면 앞뒤 달까지 넓힌다 (basis=adjacent)', () => {
    // fixture 11월: 11월 개화 꽃이 없고 앞 달(10월)에 장미·거베라가 있다.
    for (const dateISO of daysFrom('2026-11-01', 30)) {
      const { flower: picked, basis } = todayFlower(dateISO, testFlowers);
      expect(basis).toBe('adjacent');
      expect(['rose-red', 'gerbera']).toContain(picked.id);
    }
  });

  it('앞뒤 달은 12↔1 로 순환한다', () => {
    // 1월의 앞 달은 12월 — 12월에만 피는 꽃이 이웃이 된다.
    const decemberOnly = [flower('dec-only', [12]), flower('summer', [7])];
    const january = todayFlower('2026-01-20', decemberOnly);
    expect(january.basis).toBe('adjacent');
    expect(january.flower.id).toBe('dec-only');

    // 12월의 뒷 달은 1월 — 1월에만 피는 꽃이 이웃이 된다.
    const januaryOnly = [flower('jan-only', [1]), flower('summer', [7])];
    const december = todayFlower('2026-12-20', januaryOnly);
    expect(december.basis).toBe('adjacent');
    expect(december.flower.id).toBe('jan-only');
  });

  it('앞뒤 달에도 없으면 카탈로그 전체에서 뽑는다 (basis=all)', () => {
    // fixture 12월: 11·12·1월 개화가 하나도 없다.
    for (const dateISO of daysFrom('2026-12-01', 31)) {
      const { flower: picked, basis } = todayFlower(dateISO, testFlowers);
      expect(basis).toBe('all');
      expect(flowerIds(testFlowers)).toContain(picked.id);
    }

    // 개화월 정보가 아예 없는 카탈로그도 빈손으로 돌려보내지 않는다.
    const undated = [flower('a', []), flower('b', [])];
    const picked = todayFlower('2026-03-03', undated);
    expect(picked.basis).toBe('all');
    expect(['a', 'b']).toContain(picked.flower.id);
  });
});

/* ------------------------------------------------------------------ *
 * 3. 연속 반복 회피
 * ------------------------------------------------------------------ */

describe('todayFlower — 연속 반복 회피', () => {
  it('후보가 2종 이상인 날은 전날과 같은 꽃이 나오지 않는다 (3~11월 275일)', () => {
    // fixture 는 3월부터 11월까지 매일 후보가 2종 이상이다.
    expect(repeatedDates(daysFrom('2026-03-01', 275), testFlowers)).toEqual([]);
  });

  it('후보가 딱 2종이면 매일 번갈아 나온다', () => {
    const pair = [flower('a', EVERY_MONTH), flower('b', EVERY_MONTH)];
    const picked = pickIds(daysFrom('2026-04-01', 90), pair);

    expect(new Set(picked)).toEqual(new Set(['a', 'b']));
    for (let index = 1; index < picked.length; index += 1) {
      expect(picked[index]).not.toBe(picked[index - 1]);
    }
  });

  it('해가 바뀌는 자리에서도 반복되지 않는다', () => {
    const trio = [flower('a', EVERY_MONTH), flower('b', EVERY_MONTH), flower('c', EVERY_MONTH)];

    // 사슬은 해마다 새로 시작하지만(chainStart) 전해 말미를 예열해 두므로 12/31→1/1 도 이어진다.
    for (const start of ['2024-12-01', '2026-12-01', '2027-12-01']) {
      expect(repeatedDates(daysFrom(start, 90), trio)).toEqual([]);
    }
  });

  it('후보가 한 종뿐이면 반복을 허용한다', () => {
    // fixture 2월: 프리지아(2·3·4월)만 제철이다.
    const february = daysFrom('2026-02-05', 20).map((dateISO) =>
      todayFlower(dateISO, testFlowers),
    );
    expect(february.every((result) => result.flower.id === 'freesia')).toBe(true);
    expect(february.every((result) => result.basis === 'in_season')).toBe(true);

    // 카탈로그에 꽃이 하나뿐이어도 마찬가지.
    const solo = [flower('only-one', [3])];
    expect(new Set(pickIds(daysFrom('2026-03-01', 10), solo))).toEqual(new Set(['only-one']));
  });
});

/* ------------------------------------------------------------------ *
 * 4. 카탈로그가 자랄 때 — HRW 의 이유
 * ------------------------------------------------------------------ */

describe('todayFlower — 카탈로그 변화', () => {
  it('그 달 후보가 아닌 꽃을 더해도 배정이 한 칸도 안 바뀐다', () => {
    // 11·12월에만 피는 꽃은 여름 후보군에 끼지 못한다 → 여름 배정은 그대로여야 한다.
    const grown = [...testFlowers, flower('winter-only', [11, 12])];

    for (const start of ['2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01']) {
      const dates = daysFrom(start, 30);
      expect(pickIds(dates, grown)).toEqual(pickIds(dates, testFlowers));
    }
  });

  it('그 달 후보가 아닌 꽃을 빼도 배정이 한 칸도 안 바뀐다', () => {
    // 프리지아는 2·3·4월 꽃이라 5월 이후 후보군에 없다.
    const shrunk = testFlowers.filter((candidate) => candidate.id !== 'freesia');

    for (const start of ['2026-05-01', '2026-06-01', '2026-07-01', '2026-09-01', '2026-11-01']) {
      const dates = daysFrom(start, 30);
      expect(pickIds(dates, shrunk)).toEqual(pickIds(dates, testFlowers));
    }
  });

  it('같은 달 후보로 꽃이 늘어도, 새 꽃이 가져간 날 말고는 대부분 그대로다', () => {
    // 인덱스 로테이션(dayIndex % 꽃 수)이라면 꽃 하나만 늘어도 모든 날이 통째로 밀린다.
    // HRW 는 새 꽃이 자기 점수 1등인 날(≈1/N)만 가져가고 나머지 날은 원래 꽃을 유지한다.
    const grown = [...testFlowers, flower('newcomer', [5, 6])];
    const starts = ['2026-05-01', '2026-05-06', '2026-05-11', '2026-05-16', '2026-05-21'];

    for (const start of starts) {
      const dates = daysFrom(start, 30);
      const before = pickIds(dates, testFlowers);
      const after = pickIds(dates, grown);

      // 새 꽃이 가져간 날은 바뀌는 게 정상이다. 그 외의 날을 본다.
      const otherDays = dates
        .map((_, index) => index)
        .filter((index) => after[index] !== 'newcomer');
      const kept = otherDays.filter((index) => before[index] === after[index]).length;

      expect(kept).toBeGreaterThan(otherDays.length / 2);
    }
  });

  it('새로 들어온 꽃도 제 몫의 날을 가져간다', () => {
    const dates = daysFrom('2026-05-01', 30);
    const grown = [...testFlowers, flower('newcomer', [5, 6])];
    expect(pickIds(dates, grown)).toContain('newcomer');
  });
});

/* ------------------------------------------------------------------ *
 * 4b. 개화 폭 가중 — 연간 노출 평탄화 (2026-08-17 감사 P1-2)
 * ------------------------------------------------------------------ */

/**
 * 감사 실측: 365일 중 국화 26일 대 벚꽃 1일(26:1). 버그가 아니라 구조였다 — 후보군은
 * 달마다 새로 꾸려지므로 개화월이 넓은 꽃은 열두 번의 추첨에 다 끼고 좁은 꽃은 한 번만 낀다.
 * 그래서 HRW 점수에 **개화 폭의 역수**를 가중치로 넣었다.
 *
 * ⚠ 여기서 실데이터의 최대/최소 일수를 단정하지 않는다. 그 숫자는 카탈로그가 자랄 때마다
 *   움직이고(59종 시점의 평탄화는 표준편차 4.84 → 3.06), 특정 꽃 이름에 기대는 단정은
 *   도감이 늘어나는 순간 거짓이 된다. 대신 **종 수와 무관하게 성립하는 성질**만 본다:
 *   같은 후보군에서 좁은 쪽이 자주 나오는가, 그리고 개화 폭이 다른 무리끼리 연간 몫이
 *   비슷해지는가. 가중치를 걷어 내면 둘 다 곧바로 깨진다.
 */
describe('todayFlower — 개화 폭 가중', () => {
  const EVERY = EVERY_MONTH;

  /** 열두 달 × perMonth 종(그 달에만 핌) + 열두 달 내내 피는 꽃 세 종. */
  function spreadCatalog(perMonth: number): FlowerData[] {
    const catalog: FlowerData[] = [];
    for (const month of EVERY) {
      for (let k = 0; k < perMonth; k += 1) {
        catalog.push(flower(`m${String(month).padStart(2, '0')}-${k}`, [month]));
      }
    }
    for (let k = 0; k < 3; k += 1) catalog.push(flower(`all-${k}`, EVERY));
    return catalog;
  }

  function yearCounts(flowers: FlowerData[]): Map<string, number> {
    const counts = new Map(flowers.map((row) => [row.id, 0]));
    for (const id of pickIds(daysFrom('2026-01-01', 365), flowers)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }

  it('같은 후보군이면 개화 폭이 좁은 꽃이 더 자주 1등을 한다', () => {
    // 6월 후보 세 종 — 6월에만 피는 꽃 하나와 열두 달 꽃 둘.
    const pool = [flower('narrow', [6]), flower('wide-a', EVERY), flower('wide-b', EVERY)];
    const counts = new Map<string, number>([
      ['narrow', 0],
      ['wide-a', 0],
      ['wide-b', 0],
    ]);
    for (const id of pickIds(daysFrom('2026-06-01', 30), pool)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    // 가중치가 없으면 셋이 1/3 씩 나눠 갖는다. 좁은 쪽은 연속 반복 회피가 씌우는 천장
    // (이틀에 하루)까지 올라간다.
    expect(counts.get('narrow')).toBeGreaterThan(counts.get('wide-a') as number);
    expect(counts.get('narrow')).toBeGreaterThan(counts.get('wide-b') as number);
  });

  it('개화 폭이 달라도 연간 몫이 비슷해진다 — 넓은 무리가 한 해를 차지하지 않는다', () => {
    const flowers = spreadCatalog(3);
    const counts = yearCounts(flowers);

    const narrow = [...counts].filter(([id]) => !id.startsWith('all-')).map(([, n]) => n);
    const wide = [...counts].filter(([id]) => id.startsWith('all-')).map(([, n]) => n);
    const average = (rows: number[]): number => rows.reduce((a, b) => a + b, 0) / rows.length;

    // 가중치가 없다면 한 달 후보 여섯 중 셋이 열두 달 꽃이라, 그 셋이 각각 한 해의 1/6
    // (≈61일)을 가져가고 한 달 꽃은 5일 남짓에 그친다 — 12배 차이.
    expect(average(wide)).toBeLessThan(average(narrow) * 2);
    expect(average(narrow)).toBeLessThan(average(wide) * 2);
  });

  it('좁은 꽃끼리도 고르다 — 어느 달에 피든 연간 몫이 비슷하다', () => {
    const counts = yearCounts(spreadCatalog(3));
    const narrow = [...counts].filter(([id]) => !id.startsWith('all-')).map(([, n]) => n);

    expect(Math.min(...narrow)).toBeGreaterThan(0);
    expect(Math.max(...narrow)).toBeLessThanOrEqual(Math.min(...narrow) * 2.5);
  });

  it('종 수가 늘어도 같은 성질이 선다 — 27종·39종·51종', () => {
    for (const perMonth of [2, 3, 4]) {
      const flowers = spreadCatalog(perMonth);
      const counts = yearCounts(flowers);

      // 한 종이 한 해의 5분의 1을 넘게 차지하지 않는다(가중치 없이 돌리면 열두 달 꽃 셋이
      // 각각 1/6~1/4 를 가져간다).
      for (const [id, days] of counts) {
        expect(days, `${perMonth}종/달 · ${id}`).toBeLessThan(365 / 5);
      }
    }
  });

  it('개화월이 비어 있는 꽃도 빈손으로 돌려보내지 않는다', () => {
    // 개화 폭을 셀 수 없는 꽃은 가장 넓은 쪽(12)으로 본다 — 점수가 0 이 되어 영영 밀리면
    // `all` 후보군만 있는 카탈로그가 통째로 멈춘다.
    const undated = [flower('a', []), flower('b', []), flower('c', [])];
    const picked = new Set(pickIds(daysFrom('2026-03-01', 60), undated));

    expect(picked.size).toBeGreaterThanOrEqual(2);
    for (const id of picked) expect(['a', 'b', 'c']).toContain(id);
  });
});

/* ------------------------------------------------------------------ *
 * 5. 잘못된 입력
 * ------------------------------------------------------------------ */

describe('todayFlower — 잘못된 입력', () => {
  it('빈 카탈로그는 분명한 오류로 막는다', () => {
    expect(() => todayFlower('2026-05-10', [])).toThrow(/카탈로그가 비어/);
  });

  it("날짜는 'YYYY-MM-DD' 만 받는다", () => {
    for (const bad of ['', '2026-5-1', '2026/05/10', '20260510', '2026-05-10T09:00:00Z', 'today']) {
      expect(() => todayFlower(bad, testFlowers)).toThrow(/YYYY-MM-DD/);
    }
  });

  it('달력에 없는 날짜도 막는다', () => {
    for (const bad of ['2026-13-01', '2026-00-10', '2026-02-30', '2026-04-31', '2025-02-29']) {
      expect(() => todayFlower(bad, testFlowers)).toThrow(/달력에 없는 날짜/);
    }

    // 윤년 2월 29일은 정상 날짜다.
    expect(todayFlower('2024-02-29', testFlowers).flower.id).toBe('freesia');
  });
});

/* ------------------------------------------------------------------ *
 * 6. 배럴
 * ------------------------------------------------------------------ */

describe('배럴 export', () => {
  it('엔진 배럴에서도 그대로 꺼내 쓸 수 있다', () => {
    expect(engine.todayFlower).toBe(todayFlower);
  });
});
