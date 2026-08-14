/**
 * 오늘의 꽃 — 날짜가 꽃을 고르고, 그 꽃이 테마를 구동한다 (design-spec §1.4c v3.2).
 *
 * 순수 함수다. 현재 시각을 보지 않고(dateISO 는 호출자가 넣는다), 외부 의존은 types 뿐이다.
 * 같은 날짜 + 같은 카탈로그면 서버에서 계산하든 브라우저에서 계산하든 같은 꽃이 나온다.
 */

import type { FlowerData } from './types';

/**
 * 그 꽃을 어느 후보군에서 뽑았는지.
 *   in_season — 그 달을 개화월로 가진 꽃들
 *   adjacent  — 그 달 제철 꽃이 하나도 없어 앞뒤 달(12↔1 순환)까지 넓힌 경우
 *   all       — 앞뒤 달에도 없어 카탈로그 전체에서 뽑은 경우
 */
export type TodayBasis = 'in_season' | 'adjacent' | 'all';

export interface TodayFlowerResult {
  flower: FlowerData;
  basis: TodayBasis;
}

/* ------------------------------------------------------------------ *
 * 해시 — FNV-1a 32비트
 * ------------------------------------------------------------------ */

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * FNV-1a 32비트. 외부 패키지 없이 어디서나 같은 값을 내려고 직접 둔다.
 * Math.imul 로 32비트 곱셈을 고정하고(부동소수점으로 새면 값이 달라진다),
 * 마지막에 >>> 0 으로 부호 없는 정수로 되돌린다.
 */
function fnv1a32(input: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/* ------------------------------------------------------------------ *
 * 날짜 — 타임존이 끼어들지 않는 달력 계산
 * ------------------------------------------------------------------ */

interface CivilDate {
  year: number;
  /** 1–12 */
  month: number;
  /** 1–31 */
  day: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * 날짜 계산에 Date 객체를 아예 쓰지 않는다.
 *
 * new Date('2026-08-14') 는 UTC 자정으로 읽히는데 getMonth()/getDate() 는 로컬 시각을 돌려준다.
 * UTC 게터(getUTCDate)와 로컬 게터를 하나만 섞어도 KST(+9)나 UTC-5 에서 날짜가 하루 밀려
 * "어제의 꽃"이 오늘 다시 나오거나 제철 판정이 한 달 어긋난다. 눈에 잘 띄지도 않는 종류의 버그다.
 * 그래서 아래 세 함수(말일·하루 더하기·하루 빼기)로 달력 규칙만 직접 다룬다 — Date.UTC 조차 필요 없다.
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) return 29;
  return MONTH_LENGTHS[month - 1];
}

function addOneDay(date: CivilDate): CivilDate {
  if (date.day < daysInMonth(date.year, date.month)) {
    return { year: date.year, month: date.month, day: date.day + 1 };
  }
  if (date.month < 12) return { year: date.year, month: date.month + 1, day: 1 };
  return { year: date.year + 1, month: 1, day: 1 };
}

function subtractOneDay(date: CivilDate): CivilDate {
  if (date.day > 1) return { year: date.year, month: date.month, day: date.day - 1 };
  if (date.month > 1) {
    const month = date.month - 1;
    return { year: date.year, month, day: daysInMonth(date.year, month) };
  }
  return { year: date.year - 1, month: 12, day: 31 };
}

/** 그 해 1월 1일을 1일로 센 날짜 순번(1–366). */
function dayOfYear(date: CivilDate): number {
  let total = date.day;
  for (let month = 1; month < date.month; month += 1) {
    total += daysInMonth(date.year, month);
  }
  return total;
}

function formatISO(date: CivilDate): string {
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${date.year}-${month}-${day}`;
}

/** 'YYYY-MM-DD' 만 받는다. 형식이 틀리거나 달력에 없는 날이면 그 자리에서 throw. */
function parseISODate(dateISO: string): CivilDate {
  const matched = ISO_DATE.exec(dateISO);
  if (matched === null) {
    throw new Error(`todayFlower: 날짜는 'YYYY-MM-DD' 형식이어야 합니다 — 받은 값: ${dateISO}`);
  }

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error(`todayFlower: 달력에 없는 날짜입니다 — 받은 값: ${dateISO}`);
  }

  return { year, month, day };
}

/* ------------------------------------------------------------------ *
 * 후보군 — 제철 → 앞뒤 달 → 전체
 * ------------------------------------------------------------------ */

/**
 * 그 달에 내보낼 후보를 고른다.
 * 앞뒤 달은 12↔1 로 순환한다(1월의 앞 달은 12월, 12월의 뒷 달은 1월).
 * explain.ts 의 availabilityFor 가 쓰는 in_season/limited 경계와 같은 규칙이다.
 */
function candidatesFor(
  month: number,
  flowers: FlowerData[],
): { list: FlowerData[]; basis: TodayBasis } {
  const inSeason = flowers.filter((flower) => flower.bloomMonths.includes(month));
  if (inSeason.length > 0) return { list: inSeason, basis: 'in_season' };

  const previousMonth = month === 1 ? 12 : month - 1;
  const nextMonth = month === 12 ? 1 : month + 1;
  const adjacent = flowers.filter(
    (flower) =>
      flower.bloomMonths.includes(previousMonth) || flower.bloomMonths.includes(nextMonth),
  );
  if (adjacent.length > 0) return { list: adjacent, basis: 'adjacent' };

  return { list: flowers, basis: 'all' };
}

/* ------------------------------------------------------------------ *
 * 그날의 순위 — HRW(highest random weight)
 * ------------------------------------------------------------------ */

/**
 * 후보를 그날의 해시값 오름차순으로 세운다. 맨 앞이 그날의 1순위다.
 *
 * "목록을 섞어 하나 고른다"가 아니라 **꽃마다 hash(날짜 + ':' + 꽃id) 점수를 따로 매겨**
 * 최솟값을 고르는 방식(HRW/rendezvous)이다. 카탈로그가 계속 늘어나기 때문에 이 성질이 중요하다.
 * 점수가 꽃 하나에만 매여 있어서, 꽃이 추가·삭제돼도 남은 꽃들의 점수는 그대로다.
 * 새 꽃은 자기 점수가 1등인 날(≈1/N)만 가져가고 나머지 날의 배정은 유지된다.
 * (dayIndex % flowers.length 같은 인덱스 방식은 꽃 하나만 늘어도 모든 날이 통째로 밀린다.)
 *
 * 다만 이 안정성은 "그날의 순위"까지의 이야기다. 뒤이어 붙는 연속 반복 회피(todayFlower 주석)가
 * 날과 날을 묶기 때문에 최종 배정은 며칠 더 흔들린다. 특히 후보가 2종뿐인 달은 매일 번갈아 나오는
 * 것 말고 다른 수가 없어서, 그 달에 꽃이 하나 늘면 순번 전체가 뒤집힌다 — 반복 회피를 지키는 한
 * 피할 수 없는 대가다. 후보가 4~5종인 달이면 새 꽃이 가져간 날 외에는 대체로 그대로다.
 *
 * 해시가 같으면 id 사전순으로 갈라, 카탈로그 배열 순서가 결과를 흔들지 못하게 한다.
 */
function rankByHash(dateISO: string, candidates: FlowerData[]): FlowerData[] {
  return candidates
    .map((flower) => ({ flower, weight: fnv1a32(`${dateISO}:${flower.id}`) }))
    .sort((a, b) => {
      if (a.weight !== b.weight) return a.weight - b.weight;
      return a.flower.id < b.flower.id ? -1 : 1;
    })
    .map((entry) => entry.flower);
}

/**
 * 사슬을 시작하는 날 — 그 해 1월 1일에서 예열 기간만큼 앞선 날(전해 11월 초).
 *
 * 사슬을 1월 1일에서 바로 시작하면 새해 첫날만 전날을 모른 채 뽑게 되어, 그 하루는
 * 12월 31일과 같은 꽃이 나올 수 있다(후보 N종이면 확률 약 1/N² — 실제 9종 카탈로그로
 * 돌려 보니 2027-01-01 에서 실제로 걸렸다).
 * 그래서 전해 말미 60일을 미리 굴려 두고 1월 1일을 맞이한다. 같은 날들을 지나는 두 해의 사슬은
 * 며칠이면 같은 상태로 합류하므로(하루마다 확률 (N-2)/N), 60일이면 새해 반복은 사실상 사라진다.
 * 실제 9종 카탈로그로 2024–2028년을 전부 돌려 확인했다(연속 반복 0건).
 *
 * 남는 한 가지: 후보가 딱 2종인 시기는 두 사슬이 엇갈린 채 영영 합류하지 않아
 * (2종이면 매일 무조건 번갈아 나오므로) 1월 1일 하루가 전날과 겹칠 수 있다.
 * 5년에 한두 번꼴이고 후보가 3종만 돼도 사라지는 잔여 오차라 여기까지만 막는다.
 */
const CHAIN_WARMUP_DAYS = 60;

function chainStart(year: number): CivilDate {
  let date: CivilDate = { year, month: 1, day: 1 };
  for (let i = 0; i < CHAIN_WARMUP_DAYS; i += 1) date = subtractOneDay(date);
  return date;
}

/** 하루치 선택. avoidId 와 같은 꽃은 건너뛰고, 후보가 그것뿐이면 그대로 쓴다. */
function pickOn(
  date: CivilDate,
  avoidId: string | undefined,
  flowers: FlowerData[],
): TodayFlowerResult {
  const { list, basis } = candidatesFor(date.month, flowers);
  const ranked = rankByHash(formatISO(date), list);
  const flower = ranked.find((candidate) => candidate.id !== avoidId) ?? ranked[0];
  return { flower, basis };
}

/* ------------------------------------------------------------------ *
 * 오늘의 꽃
 * ------------------------------------------------------------------ */

/**
 * 그 날짜의 꽃 한 종.
 *
 * 후보군은 제철(in_season) → 앞뒤 달(adjacent) → 전체(all) 순으로만 넓히고,
 * 그 안에서 HRW 해시로 하나를 고른다(rankByHash 주석 참고).
 *
 * **연속 반복 회피**: 어제 나온 꽃은 오늘 건너뛰고 차순위를 쓴다. 그런데 "어제 나온 꽃"은
 * 어제의 1순위가 아닐 수도 있다(어제도 그제를 피해 밀렸을 수 있다). 어제의 1순위만 보고 피하면
 * 이런 구멍이 남는다.
 *   그제=A, 어제 1순위=A → 어제는 B 로 밀림 · 오늘 1순위=B 는 A 와 다르니 그대로 B → 이틀 연속 B
 * 후보가 2종뿐인 달(현 카탈로그의 9·10월 — 장미·거베라)에서는 이 충돌이 날짜 쌍의 절반 가까이 난다.
 *
 * 그래서 어제의 **실제** 선택을 쓰는데, 그건 다시 그제의 실제 선택에 달려 있다. 끝없이 거슬러
 * 올라갈 수는 없으니 그 해를 기준점으로 삼아(chainStart) 거기서부터 하루씩 굴린다. 같은 해 안의
 * 이틀은 언제나 같은 사슬 위에 있으므로 연속 반복이 구조적으로 불가능하고, 계산량은 최대
 * 60+366일치로 묶인다 (9종 기준 수천 번의 정수 해시 — 한 번 호출에 1ms 미만).
 *
 * @param dateISO 'YYYY-MM-DD'. 호출자가 넣는다(이 함수는 현재 시각을 보지 않는다).
 * @param flowers 꽃 카탈로그. 비어 있으면 throw.
 */
export function todayFlower(dateISO: string, flowers: FlowerData[]): TodayFlowerResult {
  if (flowers.length === 0) {
    throw new Error('todayFlower: 꽃 카탈로그가 비어 있어 오늘의 꽃을 고를 수 없습니다.');
  }

  const target = parseISODate(dateISO);

  // 사슬의 첫날은 전날을 모르므로 그 하루 앞의 1순위를 씨앗으로 삼는다.
  // 예열 구간이라 목표 날짜에 닿기 전에 씻겨 나간다.
  let cursor = chainStart(target.year);
  const seedId = pickOn(subtractOneDay(cursor), undefined, flowers).flower.id;
  let current = pickOn(cursor, seedId, flowers);

  const steps = CHAIN_WARMUP_DAYS + dayOfYear(target) - 1;
  for (let step = 0; step < steps; step += 1) {
    cursor = addOneDay(cursor);
    current = pickOn(cursor, current.flower.id, flowers);
  }

  return current;
}
