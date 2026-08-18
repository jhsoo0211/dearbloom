/**
 * §1.5h 「이런 날 건네보세요」 — 상황 예시 고르기.
 *
 * ── 왜 이 파일이 생겼나 (2026-08-18 이관) ────────────────────────────
 * 이 표는 **두 벌의 하드코딩**이었다. `components/flow/labels.ts` 의 `FLOWER_OCCASIONS`
 * (결과 화면·도감 상세)와 `components/landing/landing-build.ts` 의 `OCCASIONS`(랜딩
 * 슬라이드). §1.5h 가 예고한 대로 원장을 `content/occasions.csv` 로 옮기면서, 고르는
 * 규칙도 화면 밖 한 곳으로 나왔다.
 *
 * ⚠ **순수 모듈이다.** 값 import 가 한 줄도 없다(타입만 가져온다). 결과 조립
 *   (`app/recommend/build-result.ts`)이 정적 데모에서 **브라우저**로 건너가기 때문에
 *   `node:fs` 는 물론 엔진 배럴도 여기 들어오면 안 된다.
 * ⚠ 정렬하지 않는다. 화면에 서는 순서는 **CSV 의 행 순서**이고, 그 순서는 편집자가 정한다.
 */

import type { CatalogOccasion } from './types';

/**
 * 상황 예시가 서는 화면.
 *
 * 어휘의 원본은 `db/seed/schemas.ts` 의 `OCCASION_SURFACES` 다(시드가 CSV 를 그 값으로
 * 검사한다). 여기서는 부르는 쪽이 오타를 낼 수 없게 타입으로만 다시 세운다.
 */
export type OccasionSurface = 'detail' | 'landing';

/**
 * 그 꽃의 상황 예시 — **화면별 문구가 있으면 그것만, 없으면 공용 문구.**
 *
 * 두 화면의 문구가 갈라져 있는 것이 이 규칙의 이유다. §1.5h 표 5줄(흰 튤립·흰 백합·
 * 프리지아·아네모네·헬레보어)은 두 화면이 글자까지 같아 공용 행(`surface` 빈 칸) 한 벌로
 * 서 있고, 그 뒤로 각자 자란 12종은 화면별 행 두 벌로 서 있다. 합치려면 어느 한쪽 문구를
 * 버려야 하는데 그것은 편집 작업이라, 이관 시점에는 **문구를 한 글자도 바꾸지 않는 쪽**을
 * 골랐다(그 판단의 전문은 `schemas.ts` 의 `OCCASION_SURFACES` 주석에 있다).
 *
 * 공용 행과 화면별 행이 한 꽃에 섞이면 공용 쪽이 영영 안 서므로, 그 상태는 시드 교차
 * 검증 10 이 먼저 걸어 세운다 — 여기서 조용히 삼키지 않는다.
 *
 * 데이터가 없는 꽃은 빈 배열이다. 화면은 그때 **구획 자체를 세우지 않는다** — 없는 문구를
 * 지어내는 것보다 자리를 비우는 편이 낫다(§1.5e 와 같은 규범).
 */
export function occasionsFor(
  occasions: readonly CatalogOccasion[],
  flowerId: string,
  surface: OccasionSurface,
): string[] {
  const mine = occasions.filter((row) => row.flowerId === flowerId);
  const named = mine.filter((row) => row.surface === surface);
  const rows = named.length > 0 ? named : mine.filter((row) => row.surface === '');
  return rows.map((row) => row.occasionKo);
}
