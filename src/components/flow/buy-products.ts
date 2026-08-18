/**
 * 「사러 가기」 시트의 실상품 목록 — 순수 함수 한 벌.
 *
 * 사용자 요구(2026-08-17): "그냥 검색한 느낌이 아니라 구체적 상품 링크를 보여 달라.
 * 추천순·가격순 정렬을 넣고, 공익 판매처는 화면에 명시하지 말고 **추천순 점수로만**
 * 반영해라."
 *
 * 상품을 받아 오는 일은 서버 액션(`app/recommend/actions.ts` 의 `searchBuyProducts`)이
 * 한다 — 11번가 오픈API 를 부르고(공급원 선정 근거는 `lib/buy/elevenst.ts` 머리말),
 * 키가 없으면 조용히 빈손을 돌려준다(화면은 사이트 목록으로 내려간다).
 * 여기는 그 결과를 다듬고 세우는 **순수 계산**만 둔다 — 공급원이 바뀌어도 그대로 선다.
 */

export interface BuyProduct {
  /** 상품명 — HTML 강조 태그(<b>)와 엔티티를 걷어낸 순수 문자열. */
  title: string;
  link: string;
  mallName: string;
  /** 최저가(원). API 가 값을 비워 보내면 null — 화면은 "눌러서 확인"으로 말한다. */
  price: number | null;
}

/**
 * 상품 검색의 응답.
 *
 * `sample` 이 이 타입에서 가장 조심스러운 칸이다 — **지어낸 목록임을 화면에 강제하는 표식**이다
 * (2026-08-18, 정적 드롭 데모). 실상품 공급원이 없는 자리에서 시트의 상품 칸이 늘 비어 있어
 * 데모를 보는 사람은 그 기능이 없는 줄 알았고, 사용자 확정은 "모든 기능이 작동하는 것처럼
 * 보여야 한다" 였다. 그래서 데모는 예시 목록을 세우되 **예시라고 말한다.**
 *
 * ⚠ 본배포는 이 값을 **절대 켜지 않는다**(`app/recommend/actions.ts` 에는 켜는 줄이 없다).
 *   실서비스에서 지어낸 상품을 파는 것은 데모에서 예시를 보여 주는 것과 완전히 다른 일이다 —
 *   키가 없으면 지금처럼 조용히 빈손이고 화면은 사이트 목록으로 내려간다.
 * ⚠ 켜져 있으면 화면은 두 가지를 **반드시** 한다: ① 목록 위에 예시라고 적고,
 *   ② 행을 개별 상품 상세가 아니라 **그 판매처**로 보낸다(존재하지 않는 상품 페이지로
 *   사람을 보내지 않는다). 그 계약은 `ResultView` 의 BuySheet 가 지킨다.
 */
export type BuyProductsResponse =
  | { ok: true; products: BuyProduct[]; sample?: boolean }
  | { ok: false };

export type BuySort = 'recommended' | 'priceAsc' | 'priceDesc';

/**
 * 추천순에서 위로 끌어올리는 판매처 — 공공 창구·좋은 취지로 확인해 둔 곳들이다
 * (`docs/partners-research.md` 의 큐레이션과 같은 얼굴들).
 * ⚠ 화면 어디에도 "공익이라 올렸다"고 적지 않는다 — 사용자 확정: **점수로만 갈라라.**
 *   그래서 이 이름들은 배지가 아니라 정렬 점수에만 쓰인다.
 */
const BOOSTED_MALLS = [
  '우체국쇼핑',
  '우체국',
  '플립플라워',
  '우리화원',
  '같이일터',
  '남도장터',
  'e경남몰',
];

/** API 의 정확도순 자리를 기본 점수로 삼고, 확인해 둔 판매처만 조용히 끌어올린다. */
function recommendScore(product: BuyProduct, index: number): number {
  let score = index;
  if (BOOSTED_MALLS.some((mall) => product.mallName.includes(mall))) score -= 6;
  // 값을 안 보여 주는 상품은 견주기 어렵다 — 한 발 뒤로.
  if (product.price === null) score += 3;
  return score;
}

/** 정렬 — 원본을 바꾸지 않고 새 배열을 돌려준다. 같은 점수면 API 가 준 차례를 지킨다. */
export function sortBuyProducts(products: readonly BuyProduct[], sort: BuySort): BuyProduct[] {
  const indexed = products.map((product, index) => ({ product, index }));

  if (sort === 'recommended') {
    return indexed
      .sort(
        (a, b) =>
          recommendScore(a.product, a.index) - recommendScore(b.product, b.index) ||
          a.index - b.index,
      )
      .map((entry) => entry.product);
  }

  // 가격순 — 값이 없는 상품은 어느 방향이든 맨 뒤다(0원이나 무한대인 척하지 않는다).
  const priced = indexed.filter((entry) => entry.product.price !== null);
  const unpriced = indexed.filter((entry) => entry.product.price === null);
  priced.sort(
    (a, b) =>
      (sort === 'priceAsc'
        ? (a.product.price as number) - (b.product.price as number)
        : (b.product.price as number) - (a.product.price as number)) || a.index - b.index,
  );
  return [...priced, ...unpriced].map((entry) => entry.product);
}

/** 검색 API 상품명에는 강조 태그와 엔티티가 섞여 오곤 한다 — 화면에 세우기 전에 걷는다. */
export function stripSearchMarkup(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

/** `'128000'` → 128000. 숫자가 아니거나 0 이하면 null(없는 값 취급). */
export function parsePrice(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}
