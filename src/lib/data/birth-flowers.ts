/**
 * 탄생화 366일 표를 읽는 **순수 함수**들.
 *
 * `catalog.ts` 와 갈라 둔 이유는 두 가지다.
 *  · **fs 가 없다.** 여기 있는 것은 배열을 받아 배열을 돌려주는 계산뿐이라, 테스트가
 *    디스크 없이 픽스처만으로 규칙을 검증할 수 있다.
 *  · **zod 가 없다.** `db/seed/schemas.ts` 를 건드리지 않으므로(타입 import 도 없다)
 *    이 모듈은 클라이언트 번들에 섞여도 무해하다. 그 대신 달력 길이 같은 값은 상수로
 *    베껴 오지 않고 **표 자체에서 센다**(아래 `birthCalendar`) — 표가 바뀌면 화면이 따라간다.
 *
 * ⚠ 화면 문구 대전제: 이 표는 **전통적으로 정해진 탄생화가 아니다.** 하루 한 종씩 꽃을
 *   소개하던 페이지에서 퍼져 널리 통하게 된 목록이다(`docs/birth-flowers-research.md` §2).
 *   "전통"·"공식"·"예로부터 정해진" 류 단정을 쓰지 마라.
 */

import type { BirthFlower } from './types';

/**
 * 그 날짜의 탄생화 한 줄. 없는 날짜(2월 30일 등)면 `undefined`.
 *
 * 366행을 선형 탐색한다 — 화면 한 장이 한 번 부르는 조회라 색인을 만들 이유가 없고,
 * 색인을 두면 "언제 무효화하나"라는 상태가 하나 더 생긴다.
 */
export function birthFlowerOn(
  rows: readonly BirthFlower[],
  month: number,
  day: number,
): BirthFlower | undefined {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return undefined;
  return rows.find((row) => row.month === month && row.day === day);
}

/**
 * 역조회 — 그 꽃이 탄생화로 놓인 날들. 달력 순(월 → 일)으로 정렬해 돌려준다.
 *
 * 한 종이 여러 날에 걸리는 것이 정상이다(장미 10일 · 국화 4일). 카탈로그에 없는 꽃이거나
 * 표에 안 걸린 꽃이면 빈 배열이고, 그 경우 화면은 줄 자체를 세우지 않는다.
 */
export function birthDaysOf(rows: readonly BirthFlower[], flowerId: string): BirthFlower[] {
  if (flowerId === '') return [];
  return rows
    .filter((row) => row.flowerId === flowerId)
    .sort((a, b) => a.month - b.month || a.day - b.day);
}

/** `3월 21일`. 날짜 표기를 화면마다 새로 짓지 않게 여기 한 곳에 둔다. */
export function birthDateLabel(month: number, day: number): string {
  return `${month}월 ${day}일`;
}

/** `3월 21일 · 10월 9일`. 빈 목록이면 빈 문자열이라 호출부가 그것으로 유무를 가른다. */
export function birthDatesLabel(rows: readonly BirthFlower[]): string {
  return rows.map((row) => birthDateLabel(row.month, row.day)).join(' · ');
}

/**
 * 달마다 며칠까지 고를 수 있는지 — **표에 실제로 실린 날짜에서 센다.**
 *
 * `DAYS_IN_MONTH`(`db/seed/schemas.ts`)를 그대로 쓰지 않는 이유: 그 모듈은 zod 를 끌고 와서
 * 클라이언트 번들에 들어가면 안 되고, 상수를 여기 한 벌 더 베껴 두면 표와 화면이 조용히
 * 어긋날 수 있다. 시드 교차 검증이 이미 366일 전수·중복 0 을 강제하므로, 표에서 센 값이
 * 곧 달력이다(2월은 29 — 2월 29일도 실재하는 생일이다).
 *
 * 돌려주는 것은 길이 12 배열이고 `[0]` 이 1월이다.
 */
export function birthCalendar(rows: readonly BirthFlower[]): number[] {
  const days = Array.from({ length: 12 }, () => 0);
  for (const row of rows) {
    const index = row.month - 1;
    if (index < 0 || index > 11) continue;
    if (row.day > days[index]) days[index] = row.day;
  }
  return days;
}
