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

/**
 * 역조회 ②, **이름으로** — 표가 같은 이름으로 부른 날들. 달력 순.
 *
 * `birthDaysOf` 는 `flowerId` 를 쓰지만 366일 중 그것을 가진 행은 57일뿐이다. 나머지
 * 309일(= 사전 티어)에는 **이름이 유일한 신원**이라, 사전 항목이 "이 꽃이 또 언제 놓였나"
 * 를 말하려면 이름으로 물어야 한다(`튤립` 2일 · `수영` 3일처럼 50개 이름이 여러 날에 걸린다).
 *
 * ⚠ 도감 상세(`birthDays`)는 계속 `birthDaysOf` 를 쓴다 — 그쪽의 신원은 카탈로그의 꽃이고,
 *   표 이름과 도감 이름이 다를 수 있다(`노랑수선화` ↔ `수선화`). 두 함수를 바꿔 쓰지 마라.
 */
export function birthDaysOfName(rows: readonly BirthFlower[], nameKo: string): BirthFlower[] {
  if (nameKo === '') return [];
  return rows
    .filter((row) => row.nameKo === nameKo)
    .sort((a, b) => a.month - b.month || a.day - b.day);
}

/**
 * 그 달의 탄생화 전부 — 일 순으로 정렬해 돌려준다.
 *
 * 탄생화 사전(§1.5m ⑤)이 한 번에 펼치는 단위다. **366행을 통째로 내려보내지 않기 위한
 * 조각**이라, 이 함수가 돌려주는 것은 28~31행이고 화면 한 장이 그만큼만 받는다.
 * 범위 밖(0월·13월)이나 표에 없는 달이면 빈 배열이고, 그때 화면은 목록을 세우지 않는다.
 */
export function birthFlowersInMonth(
  rows: readonly BirthFlower[],
  month: number,
): BirthFlower[] {
  if (!Number.isInteger(month) || month < 1 || month > 12) return [];
  return rows.filter((row) => row.month === month).sort((a, b) => a.day - b.day);
}

/**
 * 표가 부르는 **고유한 이름의 수**(= 사전 항목 수).
 *
 * 366일보다 적다 — 한 이름이 여러 날에 걸리기 때문이다. 인트로 통계가 "366일"과 함께
 * 이 숫자를 세워 두 티어의 크기를 정직하게 말한다. 상수로 베껴 두지 않고 표에서 세는
 * 이유는 `birthCalendar` 와 같다: 표가 바뀌면 화면이 따라가야 한다.
 */
export function birthSpeciesCount(rows: readonly BirthFlower[]): number {
  return new Set(rows.map((row) => row.nameKo)).size;
}

/** `3월`. 월 표기도 화면마다 새로 짓지 않게 여기 한 곳에 둔다. */
export function birthMonthLabel(month: number): string {
  return `${month}월`;
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
