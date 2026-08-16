/**
 * 정적 데모의 탄생화 조회 두 벌 — `app/flowers/actions.ts` 자리에 서는 브라우저용 한 벌.
 *
 * 빌드 설정(`next.config.ts`)이 `NEXT_PUBLIC_STATIC_DEMO=1` 일 때
 * `@/app/flowers/actions` 를 이 파일로 바꿔치기한다(turbopack `resolveAlias`).
 *
 * 도감 목록·상세 31장은 서버 컴포넌트라 정적 빌드에서 그대로 굳는다. 서버가 없어서
 * 끊기는 것은 표를 그때그때 묻는 두 함수뿐이다 — 생일 하루(`lookupBirthFlower`)와
 * 사전 한 달(`listBirthMonth`).
 *
 * ── 표를 그대로 싣지 않고 "답"을 싣는다 ──────────────────────────────
 * 366일치 **화면 값**(`BirthFlowerView`)이 빌드 때 이미 계산돼 있다
 * (`scripts/build-demo-catalog.mjs`). 날짜 문구·받침 조사·도감 링크 이름을 브라우저에서
 * 다시 조립하면 서버가 만들던 문장과 어긋날 여지가 생기는데, 그 여지를 없애려고
 * 서버와 같은 함수로 한 번 계산해 굳혔다. 그래서 여기 남은 일은 조회 한 번이다.
 */

import type { BirthFlowerView, BirthMonthView } from '@/components/flowers/types';

let cached: Promise<Record<string, BirthFlowerView>> | null = null;

function loadTable(): Promise<Record<string, BirthFlowerView>> {
  cached ??= import('./data/birth-flowers').then(
    ({ DEMO_BIRTH_FLOWERS_JSON }) =>
      JSON.parse(DEMO_BIRTH_FLOWERS_JSON) as Record<string, BirthFlowerView>,
  );
  return cached;
}

/**
 * 사전 번들은 **따로** 지연 로드한다.
 *
 * 하루치 표(`birth-flowers`)와 달치 목록(`birth-months`)은 같은 CSV 에서 나오지만 화면이
 * 다르다 — 생일만 찾아본 사람에게 사전 번들까지 내려보낼 이유가 없다. 본배포에서 두 액션이
 * 서로 다른 크기의 응답을 내는 것과 같은 이치다.
 */
let cachedMonths: Promise<Record<string, BirthMonthView>> | null = null;

function loadMonths(): Promise<Record<string, BirthMonthView>> {
  cachedMonths ??= import('./data/birth-months').then(
    ({ DEMO_BIRTH_MONTHS_JSON }) =>
      JSON.parse(DEMO_BIRTH_MONTHS_JSON) as Record<string, BirthMonthView>,
  );
  return cachedMonths;
}

/**
 * 그 날짜의 탄생화. 표에 없는 날짜(2월 30일 등)면 `null`.
 *
 * 범위 검사를 남겨 두는 이유는 원본과 같다 — 인자는 화면이 주는 값이지만 타입 선언이
 * 런타임을 지켜 주지는 않는다.
 */
export async function lookupBirthFlower(
  month: number,
  day: number,
): Promise<BirthFlowerView | null> {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;

  const table = await loadTable();
  return table[`${month}-${day}`] ?? null;
}

/**
 * 그달의 탄생화 전부 — 탄생화 사전(§1.5m ⑤)이 펼치는 한 달치.
 *
 * 서버 쪽과 달리 여기서 조립할 것은 없다. 빌드 타임에 **같은 함수**(`buildBirthMonth`)로
 * 이미 계산해 굳혀 뒀기 때문이다(`scripts/build-demo-catalog.mjs`) — 브라우저에서 다시
 * 맞추면 서버가 만들던 문장과 어긋날 여지가 생긴다.
 */
export async function listBirthMonth(month: number): Promise<BirthMonthView | null> {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;

  const months = await loadMonths();
  return months[String(month)] ?? null;
}
