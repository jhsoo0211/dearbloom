/**
 * 읽을거리 → 도감의 다리를 **거꾸로** 건너는 순수 한 벌 (2026-08-18).
 *
 * ═══ 무엇을 푸는가 ════════════════════════════════════════════════════
 * 원장(`content/reads.csv`)의 `links_to` 는 **읽을거리 쪽에서 꽃을 가리킨다**
 * (`flower:chrysanthemum` — 24행이 25종을 가리킨다). `/reads` 는 그 방향 그대로
 * 카드 아래에 도감 다리를 세우면 되지만, 결과 화면은 반대쪽에서 묻는다:
 * **「지금 보고 있는 이 꽃을 가리키는 읽을거리가 있는가」.**
 * 그 한 줄이 여기 있다.
 *
 * ═══ 왜 `reads-festivals.ts` 안이 아닌가 (중요) ═══════════════════════
 * 결이 같아 그 파일 옆자리가 자연스럽지만, 거기 둘 수 없다. 그 모듈은 맨 아래
 * `loadFestivals()` 가 `node:fs` 로 디스크를 읽는 **서버 전용** 파일이고(그 머리말이
 * 직접 그렇게 적어 두었다), 이 함수를 부르는 곳은 `app/recommend/build-result.ts` —
 * **정적 데모에서 브라우저 번들에 통째로 들어가는** 파일이다. 한 줄만 가져와도
 * `node:fs` 가 클라이언트 그래프에 딸려 들어가 `npm run build:static` 이 그 자리에서
 * 죽는다(build-result.ts 머리말의 "서버 전용 의존이 한 줄도 없어야 한다").
 *
 * 그래서 **순수한 쪽만 따로 산다.** 여기에는 import 가 타입 하나뿐이고, 시계도
 * 파일도 네트워크도 만지지 않는다 — `/reads`(서버)와 결과 화면(서버·브라우저 양쪽)이
 * 같은 판정을 쓰게 하는 것이 이 파일의 유일한 일이다.
 *
 * ⚠ **만료는 여기서 보지 않는다.** 지난 행사를 거르는 일은 언제나 브라우저의 오늘로
 *   한다(`components/reads/expiry.ts` 머리말 — 서버에서 거르면 배포한 날이 HTML 에
 *   박힌다). 이 파일은 "이어져 있는가" 만 답하고, "아직 갈 수 있는가" 는 화면이 답한다.
 */

import type { CatalogRead } from './types';

/**
 * `links_to` 에서 도감을 가리키는 접두사.
 *
 * 어휘의 원본은 `db/seed/schemas.ts` 의 `READ_LINK_PREFIXES` 이고(`flower:`·`color:`·
 * `theme:` 셋), 그중 **우리 화면에 목적지가 실제로 있는 것은 `flower:` 하나**다 —
 * `/reads` 도 같은 이유로 나머지 둘을 화면에서 뗀다(그쪽 `bridgeFlowers` 머리말).
 */
export const READ_FLOWER_PREFIX = 'flower:';

/** 조회에 필요한 최소한의 모양. 카드 전체를 요구하지 않는 이유는 테스트가 한 칸만 세우기 위해서다. */
export interface ReadLinkRow {
  linksTo: readonly string[];
}

/**
 * 이 읽을거리가 가리키는 도감 id 들. 하나도 없는 것이 **정상 값**이다(54건 중 30건).
 *
 * 값은 다듬어서 돌려준다(`flower: rose-red` 처럼 공백이 섞여도 같은 것으로 읽힌다).
 * 접두사만 있고 뒤가 빈 항목은 버린다 — 빈 id 는 어떤 꽃과도 이어지지 않는다.
 */
export function readFlowerIds(read: ReadLinkRow): string[] {
  const ids: string[] = [];
  for (const entry of read.linksTo) {
    if (!entry.startsWith(READ_FLOWER_PREFIX)) continue;
    const id = entry.slice(READ_FLOWER_PREFIX.length).trim();
    if (id === '') continue;
    ids.push(id);
  }
  return ids;
}

/**
 * 그 꽃을 가리키는 읽을거리들 — **원장 차례 그대로** 돌려준다.
 *
 * 차례를 흔들지 않는 이유는 `/reads` 와 같다: CSV 순서는 편집자가 정한 순서이고,
 * 같은 꽃을 두 번 본 사람이 같은 자리에서 같은 글을 만나야 한다. 무엇을 앞에 세울지는
 * **부르는 쪽**이 정한다(결과 화면은 행사를 먼저 세운다 — `build-result.ts`).
 *
 * 빈 배열이 정상 값이다. 59종 중 25종만 이어져 있고, 나머지 꽃은 결과 화면에
 * **아무것도 붙지 않는다** — 없는 구획을 「아직 없어요」로 채우지 않는다.
 */
export function readsForFlower<T extends ReadLinkRow>(
  flowerId: string,
  reads: readonly T[],
): T[] {
  const wanted = flowerId.trim();
  if (wanted === '') return [];
  return reads.filter((read) => readFlowerIds(read).includes(wanted));
}

/**
 * 결과 화면이 세우는 차례 — **행사 먼저, 그다음 나머지.**
 *
 * `/reads` 의 `inScreenOrder` 와 같은 판단이다(조사 문서 §6-3): 행사는 사라지는 것이라
 * 위쪽이 늘 "지금 서두를 것" 이 된다. 다만 이쪽은 종료일로 다시 정렬하지 **않는다** —
 * 한 꽃에 걸린 행사는 많아야 두어 건이고, 원장 차례를 흔들면 같은 꽃을 다시 본 사람이
 * 다른 목록을 만난다.
 *
 * ⚠ 여기서도 "오늘" 을 보지 마라. 열린 행사를 위로 올리고 싶어지겠지만 그 정렬은
 *   빌드 시각으로 굳는다(`/reads` 의 같은 자리에 같은 경고가 있다).
 */
export function readsForFlowerInScreenOrder(
  flowerId: string,
  reads: readonly CatalogRead[],
): CatalogRead[] {
  const found = readsForFlower(flowerId, reads);
  return [
    ...found.filter((read) => read.kind === 'event'),
    ...found.filter((read) => read.kind !== 'event'),
  ];
}
