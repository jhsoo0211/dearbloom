/**
 * 정적 데모의 **예시 상품** 한 벌 — 「사러 가기」 시트의 상품 칸을 세우는 자리 (2026-08-18).
 *
 * ═══ 왜 지어낸 목록을 만드는가 ════════════════════════════════════════
 * 실상품 공급원이 지금 **한 곳도 없다**(`.env.example` 에 기록: 네이버 쇼핑 API 2026-08-01
 * 종료 · 11번가는 셀러 전용으로 바뀜 · 쿠팡 파트너스는 수수료 링크라 「제휴 아님」 고지와
 * 충돌). 그 결과 시트의 상품 목록 자리가 본배포에서도 데모에서도 **늘 비어 있었고**, 데모를
 * 보는 사람에게는 그 기능이 아예 없는 것으로 읽혔다. 사용자 확정은 §1.5s ⑤ 의 연장이다 —
 * "데모는 안 깨짐이 아니라 실동작이다."
 *
 * ═══ 그래서 지키는 선 세 개 (하나라도 놓으면 이 파일은 거짓말이 된다) ═══
 *  ① **데모에서만 선다.** 본배포(`app/recommend/actions.ts`)에는 이 파일을 부르는 줄이
 *     한 곳도 없다. 실서비스에서 지어낸 상품을 파는 것은 데모에서 예시를 보여 주는 것과
 *     전혀 다른 일이다. 키가 없으면 본배포는 지금처럼 조용히 사이트 목록으로 내려간다.
 *  ② **예시라고 말한다.** 응답에 `sample: true` 가 실리고, 화면은 목록 위에 그 한 줄을
 *     세운다(`buy-products.ts` 의 `BuyProductsResponse` 머리말이 그 계약이다).
 *  ③ **없는 상품 페이지로 사람을 보내지 않는다.** 행의 목적지는 개별 상품이 아니라
 *     **그 판매처**이고, 주소는 지어내지 않고 `buildBuyLinks()` 에서 그대로 가져온다
 *     (실측을 거친 단일 원본 — `buy-links.ts`). 그래서 눌러도 죽은 링크가 없다.
 *
 * ═══ 왜 표가 아니라 생성기인가 ════════════════════════════════════════
 * 도감이 59종이고 계속 자란다(2026-08-17 하루에 47 → 59). 꽃마다 손으로 상품을 적어 두면
 * 꽃이 늘 때마다 조용히 빈칸이 생기고, 그 빈칸은 아무도 오류로 읽지 않는다. 이름만 받아
 * 세우는 규칙 한 벌이면 도감이 자라도 그대로 선다 — 도감 링크 대신 `mainName()` 규칙을
 * 쓰는 `buy-links.ts` 와 같은 판단이다.
 *
 * ⚠ **난수를 쓰지 않는다.** 같은 꽃은 언제나 같은 목록이어야 시연을 되풀이할 수 있고,
 *   스크린샷 검수가 가능하며, 정렬 칩을 눌렀다 되돌렸을 때 목록이 흔들리지 않는다
 *   (`message-variants.ts` 의 결정적 회전과 같은 규율).
 */

import { buildBuyLinks } from '@/components/flow/buy-links';
import type { BuyProduct } from '@/components/flow/buy-products';

/**
 * 예시가 걸리는 판매처 다섯 — **이름과 주소를 지어내지 않는다.**
 *
 * 다섯 다 이 시트가 원래 세우던 곳들이고(`buildBuyLinks`), 주소는 그 함수가 만든 것을
 * 그대로 쓴다. `key` 로 짝을 짓는 이유는 이름이 바뀌어도(`우체국 꽃배달` → 다른 표기)
 * 짝이 끊기지 않게 하려는 것이다 — 못 찾은 판매처는 조용히 빠진다(아래 `sellersFor`).
 *
 * ⚠ 다섯 중 셋(우체국·우리화원·플립플라워)이 `buy-products.ts` 의 추천순 가산 대상이다.
 *   일부러 그렇게 골랐다: 전부 가산 대상이거나 전부 아니면 **추천순 칩을 눌러도 목록이
 *   그대로**여서, 눌러도 아무 일 없는 버튼이 된다(P2-11 이 금지한 바로 그것).
 *   가산 어휘를 여기서 다시 적지 않는 이유도 같다 — 점수의 속은 그 파일만 안다.
 */
const SAMPLE_SELLERS: readonly { key: string; mallName: string }[] = [
  { key: 'epost', mallName: '우체국 꽃배달' },
  { key: 'kakao', mallName: '카카오톡 선물하기' },
  { key: 'woori', mallName: '우리화원' },
  { key: 'kukka', mallName: '꾸까' },
  { key: 'flip', mallName: '플립플라워 스토어' },
];

/**
 * 상품 한 줄의 틀 — 국내 꽃배달 상품명의 실제 결에서 골랐다.
 *
 * 값의 띠(`min`~`max`)도 그 결을 따른다: 미니 다발이 가장 싸고 화병 세트가 가장 비싸다.
 * 띠가 서로 겹치게 둔 것은 일부러다 — 겹치지 않으면 가격순 정렬이 늘 같은 순서를 내서
 * "정렬이 도는 것"과 "목록이 원래 그 순서인 것"을 구별할 수 없다.
 *
 * ⚠ 문구에 **재고·배송·품질을 약속하는 말**을 넣지 마라(`당일 배송`·`산지 직송`·`최저가`).
 *   예시라고 적어 두더라도 그 낱말들은 우리가 하지 않은 약속이고, 시트 아래 두 줄
 *   ("값과 재고는 저마다 그때그때 달라요")과 정면으로 어긋난다.
 */
const SAMPLE_ITEMS: readonly { suffix: string; min: number; max: number }[] = [
  { suffix: '미니 다발', min: 25_000, max: 39_000 },
  { suffix: '꽃다발 10송이', min: 45_000, max: 69_000 },
  { suffix: '라운드 꽃다발 (카드 동봉)', min: 55_000, max: 82_000 },
  { suffix: '꽃바구니', min: 69_000, max: 99_000 },
  { suffix: '다발 + 유리 화병 세트', min: 89_000, max: 129_000 },
  { suffix: '한 아름 다발', min: 78_000, max: 118_000 },
];

/** 꽃마다 몇 줄을 세우는가. 넷보다 적으면 정렬 칩이 무의미하고, 여섯을 넘으면 목록이 검색 결과처럼 읽힌다. */
const MIN_ROWS = 4;
const MAX_ROWS = SAMPLE_ITEMS.length;

/**
 * 이름 → 정수 하나. **암호용이 아니다** — 같은 이름이 언제나 같은 목록을 내게 하는 것이 전부다.
 *
 * 곱수 31 의 고전적인 문자열 해시이고, 유니코드 코드포인트를 그대로 먹으므로 한글에서도
 * 골고루 흩어진다. 32비트로 자르고 절댓값을 취해 아래 계산이 음수를 만나지 않게 한다.
 */
function hashOf(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** 띠 안의 한 값 — 천 원 단위로 떨어뜨린다(꽃집 값표가 그렇게 적혀 있다). */
function priceIn(min: number, max: number, seed: number): number {
  const span = Math.floor((max - min) / 1000) + 1;
  return min + (seed % span) * 1000;
}

/** 이 꽃의 예시가 걸릴 판매처들 — 주소는 `buildBuyLinks` 가 만든 것을 그대로 쓴다. */
function sellersFor(flowerName: string): { mallName: string; href: string }[] {
  const links = buildBuyLinks(flowerName);
  const sellers: { mallName: string; href: string }[] = [];
  for (const seller of SAMPLE_SELLERS) {
    const link = links.find((item) => item.key === seller.key);
    // 목록에서 빠진 판매처는 조용히 건너뛴다 — 없는 주소를 지어내느니 줄이 하나 줄어드는 게 낫다.
    if (link) sellers.push({ mallName: seller.mallName, href: link.href });
  }
  return sellers;
}

/**
 * 그 꽃의 예시 상품 목록 — 4~6줄. 이름이 비면 빈 배열이다(빈 이름의 상품을 세우지 않는다).
 *
 * 받는 이름은 화면이 이미 다듬은 **대표 이름**이다(`빨간 장미` → `장미`). 여기서 다시
 * 다듬지 않는 이유는 시트 제목·검색어·이 목록이 **한 이름**을 써야 하기 때문이다 —
 * 제목은 「‘장미’ 살 수 있는 곳」인데 상품만 「빨간 장미 꽃다발」이면 다른 것으로 읽힌다.
 *
 * 줄마다 판매처를 돌려 가며 붙인다(`seed + index`). 한 판매처에 몰아 주면 정렬 칩을 눌러도
 * 판매처 열이 통째로 안 움직여서 추천순이 하는 일이 눈에 보이지 않는다.
 */
export function sampleBuyProducts(flowerName: string): BuyProduct[] {
  const name = typeof flowerName === 'string' ? flowerName.trim() : '';
  if (name === '') return [];

  const sellers = sellersFor(name);
  if (sellers.length === 0) return [];

  const seed = hashOf(name);
  const rows = MIN_ROWS + (seed % (MAX_ROWS - MIN_ROWS + 1));

  const products: BuyProduct[] = [];
  for (let i = 0; i < rows; i += 1) {
    // 시작 칸도 이름으로 정한다 — 모든 꽃이 「미니 다발」로 시작하면 3안이 나란히 같아 보인다.
    const item = SAMPLE_ITEMS[(seed + i) % SAMPLE_ITEMS.length];
    const seller = sellers[(seed + i) % sellers.length];
    products.push({
      title: `${name} ${item.suffix}`,
      // ⚠ 개별 상품 주소가 아니다 — 그 판매처로 간다(머리말 ③). 지어낸 상품 상세는 없다.
      link: seller.href,
      mallName: seller.mallName,
      price: priceIn(item.min, item.max, seed + i * 7),
    });
  }
  return products;
}
