/**
 * 만료 판정과 기간 문구 — 「읽을거리」에서 **지난 행사가 남지 않게** 하는 자리.
 *
 * ═══ 이 파일이 존재하는 이유 (조사 문서 §6·§7-2) ═══════════════════════
 * 이 섹션의 최대 위험은 지난 행사가 화면에 남는 것이다. 데이터에 종료일이 있으니 거를 수
 * 있는데, **어디서 거르느냐**가 정적 배포에서 갈린다.
 *
 *   서버(빌드)에서 거르면 → 배포한 날의 "오늘" 이 HTML 에 박힌다.
 *                          10월에 배포한 사이트가 12월에도 10월 기준으로 행사를 보여 준다.
 *   브라우저에서 거르면   → 보는 사람의 오늘로 판정한다. 서버가 필요 없는 처방이다.
 *
 * 그래서 이 모듈의 **판정 함수는 전부 `today` 를 인자로 받는다.** 안에서 `new Date()` 를
 * 부르지 않는다 — 그래야 서버 렌더에서 실수로 부를 수 없고, 테스트가 경계일을 짚을 수 있다.
 * `todayInKst()` 만 시계를 보고, 그것을 부르는 곳은 클라이언트 컴포넌트의 이펙트 하나다.
 *
 * ⚠ 판정은 **KST 날짜 문자열끼리** 비교한다. `Date` 객체로 비교하면 UTC 자정 경계에서
 *   하루가 밀린다 — `YYYY-MM-DD` 는 사전순 비교가 곧 날짜순 비교다.
 * ⚠ 경계는 **포함**이다. 오늘이 마지막 날인 행사는 아직 갈 수 있다(`<`, `>` 를 쓰고
 *   `<=`, `>=` 로 뒤집지 않는다).
 * ⚠ 사용자 기기 시계를 믿는 셈이라는 것을 알고 쓴다. 시계가 틀린 기기에서는 판정도 틀리지만,
 *   잘못 보이는 최악이 "지난 축제가 하나 남는 것" 이라 서버를 세우는 비용과 맞지 않는다.
 */

/** 만료 판정에 필요한 최소한의 모양. 카드 전체를 받지 않는 이유는 테스트가 두 칸만 세우기 위해서다. */
export interface DatedRead {
  /** `YYYY-MM-DD`. 행사만 갖는다. */
  startsAt?: string;
  endsAt?: string;
}

/**
 * 항목의 상태 네 가지.
 *   evergreen — 날짜가 없다(글·실용·트렌드). **만료 판정 대상이 아니다.**
 *   ended     — 끝났다. 목록에서 **숨긴다**(「종료된 행사입니다」 카드를 남기지 않는다).
 *   open      — 지금 열려 있다.
 *   upcoming  — 아직 시작 전이다.
 */
export type ReadStatus = 'evergreen' | 'ended' | 'open' | 'upcoming';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * KST 기준 오늘 `YYYY-MM-DD`.
 *
 * UTC 시각을 9시간 밀고 그 **UTC 달력**을 읽는다. 기기의 로컬 시간대를 쓰지 않는 이유:
 * 해외에서 열어도 우리 데이터의 날짜(전부 KST 기준으로 적힌 공식 안내)와 같은 자로 재야
 * 한다. `toISOString()` 은 언제나 UTC 를 내므로 이 셈이 시간대에 흔들리지 않는다.
 */
export function todayInKst(now: Date): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` 두 개 사이의 날수(`to - from`). 양쪽 다 UTC 자정으로 읽어 시간대가 끼지 않는다. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/**
 * 조사 문서 §6-1 의 판정표 그대로.
 *
 *   끝남 = ends_at !== '' && ends_at < todayKST
 *   아직 = starts_at !== '' && starts_at > todayKST
 *   열림 = !끝남 && !아직
 */
export function readStatus(item: DatedRead, today: string): ReadStatus {
  if (item.startsAt === undefined && item.endsAt === undefined) return 'evergreen';
  if (item.endsAt !== undefined && item.endsAt < today) return 'ended';
  if (item.startsAt !== undefined && item.startsAt > today) return 'upcoming';
  return 'open';
}

/** 끝난 항목인가 — 목록에서 거를 때 부르는 이름. `evergreen` 은 언제나 false 다. */
export function hasEnded(item: DatedRead, today: string): boolean {
  return readStatus(item, today) === 'ended';
}

/**
 * 카드에 붙는 상태 한 줄. 없으면(`undefined`) 배지를 세우지 않는다.
 *
 * 남은 날을 말하는 이유: 「지금 열려 있어요」만으로는 오늘이 마지막 날인 행사와 두 달 남은
 * 행사가 같아 보인다. 그 차이가 갈지 말지를 가른다.
 */
export function readStatusLabel(item: DatedRead, today: string): string | undefined {
  const status = readStatus(item, today);

  if (status === 'open') {
    if (item.endsAt === undefined) return '지금 열려 있어요';
    const left = daysBetween(today, item.endsAt);
    if (left === 0) return '오늘까지예요';
    if (left <= 7) return `${left}일 남았어요`;
    return '지금 열려 있어요';
  }

  if (status === 'upcoming' && item.startsAt !== undefined) {
    const until = daysBetween(today, item.startsAt);
    if (until === 1) return '내일 열려요';
    if (until <= 14) return `${until}일 뒤에 열려요`;
    const [, month, day] = item.startsAt.split('-');
    return `${Number(month)}월 ${Number(day)}일부터`;
  }

  return undefined;
}

/* ------------------------------------------------------------------ *
 * 기간 문구 — 시계를 보지 않으므로 **서버에서 굳혀도 된다**
 * ------------------------------------------------------------------ */

/** 그 달의 마지막 날. `Date` 의 0일 = 전달 말일 규칙을 쓴다(윤년도 저절로 맞는다). */
function lastDayOf(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

interface Ymd {
  year: number;
  month: number;
  day: number;
}

function parseYmd(value: string): Ymd {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

/**
 * 화면에 거는 기간 한 줄.
 *
 * ── 달로만 말하는 자리 (조사 문서 §6-1 마지막 항) ─────────────────────
 * 공식이 `2026. 7. ~ 9.` 처럼 **월까지만** 공지한 행사가 있다. 원장은 그 달의 말일을
 * `ends_at` 에 채워 두었으므로, 그대로 「9월 30일까지」라고 쓰면 우리가 **없는 정확성을
 * 지어내는** 셈이 된다. 그래서 시작일이 그 달 1일이고 종료일이 그 달 말일이면 —
 * 즉 기간이 달 경계에 정확히 맞아떨어지면 — 날짜를 접고 **달로 말한다.**
 *
 * 이 규칙은 진짜로 7/1~9/30 을 여는 행사에도 「7월 – 9월」이라고 말하지만 그것도 사실이다.
 * 덜 말하는 쪽으로만 틀리므로 안전하다(2026-08-18 현재 걸리는 행은 서울식물원 《정원 속
 * 아틀리에》 한 건이고, 그 행의 `summary_ko` 가 이미 같은 말을 하고 있다).
 */
export function readPeriodLabel(startsAt?: string, endsAt?: string): string | undefined {
  if (startsAt === undefined || endsAt === undefined) return undefined;

  const from = parseYmd(startsAt);
  const to = parseYmd(endsAt);

  const wholeMonths = from.day === 1 && to.day === lastDayOf(to.year, to.month);
  if (wholeMonths) {
    if (from.year === to.year && from.month === to.month) return `${from.year}년 ${from.month}월 한 달`;
    if (from.year === to.year) return `${from.year}년 ${from.month}월 – ${to.month}월`;
    return `${from.year}년 ${from.month}월 – ${to.year}년 ${to.month}월`;
  }

  if (startsAt === endsAt) return `${from.year}년 ${from.month}월 ${from.day}일`;
  if (from.year === to.year) {
    return `${from.year}년 ${from.month}월 ${from.day}일 – ${to.month}월 ${to.day}일`;
  }
  return `${from.year}년 ${from.month}월 ${from.day}일 – ${to.year}년 ${to.month}월 ${to.day}일`;
}

/** 발행일 한 줄(`2026. 2. 20.`). 원문에 표기가 있는 항목만 갖는다. */
export function readPublishedLabel(publishedAt?: string): string | undefined {
  if (publishedAt === undefined) return undefined;
  const { year, month, day } = parseYmd(publishedAt);
  return `${year}. ${month}. ${day}.`;
}
