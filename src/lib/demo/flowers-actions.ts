/**
 * 정적 데모의 생일 꽃 찾기 — `app/flowers/actions.ts` 자리에 서는 브라우저용 한 벌.
 *
 * 빌드 설정(`next.config.ts`)이 `NEXT_PUBLIC_STATIC_DEMO=1` 일 때
 * `@/app/flowers/actions` 를 이 파일로 바꿔치기한다(turbopack `resolveAlias`).
 *
 * 도감 목록·상세 31장은 서버 컴포넌트라 정적 빌드에서 그대로 굳는다. 서버가 없어서
 * 끊기는 것은 생일 하루를 묻는 이 함수 하나뿐이다.
 *
 * ── 표를 그대로 싣지 않고 "답"을 싣는다 ──────────────────────────────
 * 366일치 **화면 값**(`BirthFlowerView`)이 빌드 때 이미 계산돼 있다
 * (`scripts/build-demo-catalog.mjs`). 날짜 문구·받침 조사·도감 링크 이름을 브라우저에서
 * 다시 조립하면 서버가 만들던 문장과 어긋날 여지가 생기는데, 그 여지를 없애려고
 * 서버와 같은 함수로 한 번 계산해 굳혔다. 그래서 여기 남은 일은 조회 한 번이다.
 */

import type { BirthFlowerView } from '@/components/flowers/types';

let cached: Promise<Record<string, BirthFlowerView>> | null = null;

function loadTable(): Promise<Record<string, BirthFlowerView>> {
  cached ??= import('./data/birth-flowers').then(
    ({ DEMO_BIRTH_FLOWERS_JSON }) =>
      JSON.parse(DEMO_BIRTH_FLOWERS_JSON) as Record<string, BirthFlowerView>,
  );
  return cached;
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
