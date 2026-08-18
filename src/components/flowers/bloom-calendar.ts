/**
 * 계절 달력(`/calendar`)의 **순수 계산** — 시계 읽기와 달 라벨.
 *
 * ⚠ 순수 함수만 둔다. 이 파일은 클라이언트 컴포넌트(`BloomCalendar.tsx`)가 import 하므로
 *   카탈로그 로더·라벨 사전·엔진이 딸려 오면 그것들이 통째로 브라우저 번들에 실린다.
 *   화면에 세울 값을 만드는 쪽은 서버 전용인 `calendar-data.ts` 다.
 *
 * ═══ 「지금 달」은 왜 브라우저가 정하는가 ═══════════════════════════════
 * 「읽을거리」의 만료 판정과 **같은 원리**다(`components/reads/expiry.ts` 머리말 §7-2).
 *
 *   서버(빌드)에서 정하면 → 배포한 날의 "이번 달" 이 HTML 에 박힌다.
 *                          8월에 뽑은 정적 데모가 12월에도 8월을 펼쳐 놓는다.
 *   브라우저에서 정하면   → 보는 사람의 이번 달이다. 서버가 필요 없는 처방이다.
 *
 * 그래서 이 함수는 **`now` 를 인자로 받는다.** 안에서 `new Date()` 를 부르지 않아야
 * 서버 렌더에서 실수로 부를 수 없고, 테스트가 자정 경계를 짚을 수 있다.
 * 시계를 보는 곳은 클라이언트 컴포넌트의 `useSyncExternalStore` 스냅숏 하나뿐이다.
 *
 * ⚠ 판정은 **KST 기준**이다. 기기 로컬 시간대를 쓰면 해외에서 열었을 때 우리 데이터
 *   (전부 한국 개화기 기준)와 다른 자로 재게 된다 — `expiry.ts` 와 같은 판단이다.
 * ⚠ 기기 시계를 믿는 셈이라는 것을 알고 쓴다. 틀린 시계에서 잘못 보이는 최악은
 *   "엉뚱한 달이 펼쳐져 있는 것" 이고, 열두 달이 전부 그 자리에 있으므로 잃는 것이 없다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 달 열둘. 화면이 도는 순서이자 데이터가 갖는 칸 수다. */
export const BLOOM_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/**
 * KST 기준 이번 달(1~12).
 *
 * UTC 시각을 9시간 밀고 그 **UTC 달력**을 읽는다(`todayInKst()` 와 같은 셈).
 * `getUTCMonth()` 는 0부터라 1을 더한다.
 */
export function currentMonthInKst(now: Date): number {
  return new Date(now.getTime() + KST_OFFSET_MS).getUTCMonth() + 1;
}

/** `8월`. 탄생화 쪽 `birthMonthLabel` 과 **같은 모양**이다 — 두 화면이 달을 다르게 부르지 않는다. */
export function bloomMonthLabel(month: number): string {
  return `${month}월`;
}

/**
 * 사철 꽃인가 — 열두 달 중 열한 달 이상 피는 종.
 *
 * 도감 상세의 계절 한 줄(`buildSeasonLine`)이 쓰는 것과 **같은 문턱**이다(11 이상).
 * 문턱을 두 곳에서 다르게 잡으면 같은 꽃이 상세에서는 "사철", 달력에서는 "가을 꽃"이 된다.
 */
export function isYearRound(bloomMonths: readonly number[]): boolean {
  return bloomMonths.length >= 11;
}
