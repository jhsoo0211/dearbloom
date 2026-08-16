/**
 * 정적 데모의 콘텐츠 로더 — `loadCatalog()`(node:fs) 자리에 서는 브라우저용 한 벌.
 *
 * 원본 로더와 **같은 계약**이다: `Promise<Catalog>` 를 돌려주고, 한 번 읽은 것은
 * 모듈 스코프에 붙들어 둔다. 그래서 `prepareResult`·`planWithCatalog` 같은 순수 함수는
 * 자기가 서버에서 도는지 브라우저에서 도는지 알 필요가 없다.
 *
 * ── 왜 정적 import 가 아니라 `import()` 인가 ──────────────────────────
 * 굳혀 둔 카탈로그는 270KB 다(gzip 65KB). 정적으로 import 하면 `/recommend` 를
 * **열기만 해도** 그 무게가 첫 화면에 얹힌다 — 질문 5문항을 다 채우기 전에는 한 글자도
 * 쓰이지 않는데. 동적 import 는 번들러가 별도 청크로 떼어 내므로, 실제로 "꽃 고르기"를
 * 누른 사람만 그때 받는다. 카탈로그를 읽는 함수가 원래 async 라 기다림도 공짜다.
 */

import type { Catalog } from '@/lib/data/types';

let cached: Promise<Catalog> | null = null;

/** 굳혀 둔 카탈로그. 두 번째 호출부터는 같은 프로미스를 그대로 돌려준다. */
export function loadDemoCatalog(): Promise<Catalog> {
  cached ??= import('./data/catalog').then(
    ({ DEMO_CATALOG_JSON }) => JSON.parse(DEMO_CATALOG_JSON) as Catalog,
  );
  return cached;
}
