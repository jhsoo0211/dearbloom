/**
 * 11번가 오픈API ProductSearch — 서버 전용 헬퍼(인코딩·XML 파싱).
 *
 * 왜 11번가인가(2026-08-17 실사, `docs/partners-research.md` §6):
 *   · 네이버 쇼핑 검색 오픈API 는 **2026-08-01 서비스 종료**됐다(약관 부칙 원문 확인).
 *     공식 대체 API 없음. 쿠팡 파트너스는 수수료 추적 링크만 주는 제휴형이라
 *     "제휴 관계 아니에요" 고지가 거짓이 되고, 공공데이터포털에는 상품 목록 API 가 없다.
 *   · 11번가는 약관 전문에 제휴·수수료 조항이 0건이고 상품 URL 도 순수 상품 페이지다 —
 *     무제휴 고지가 참으로 남는 유일한 공급원이었다.
 *
 * ⚠ 이 모듈은 iconv-lite 를 물고 있어 **서버에서만 import 한다** — 클라이언트가 물면
 *   인코딩 테이블이 통째로 브라우저 번들에 실린다. 순수 정렬·다듬기는
 *   `components/flow/buy-products.ts` 에 있다(그쪽은 양쪽에서 쓴다).
 *
 * ── 실측으로 확인한 것과 못 한 것 ──────────────────────────────────────
 * 확인: 엔드포인트 생존(더미 키 → ErrorCode 003 XML), 응답이 EUC-KR XML 이라는 것,
 *       응답에 상품명·가격·상세 URL 이 실린다는 것.
 * 못 함: 키가 없어 **실키 응답의 정확한 태그 이름**은 못 봤다. 그래서 파서는 알려진
 *       이름 후보를 모두 받고(`DetailPageUrl`/`ProductDetailUrl`, `SalePrice`/`ProductPrice`),
 *       키를 받은 날 `node tests/partners/check-buy-api.mjs` 로 실측해 이 주석을 갱신하라.
 * 요청 keyword 인코딩도 문서(EUC-KR)와 현실이 다를 수 있어, 부르는 쪽이 EUC-KR 로
 * 먼저 묻고 0건이면 UTF-8 로 한 번 더 묻는다(`app/recommend/actions.ts`).
 */

import iconv from 'iconv-lite';

import {
  parsePrice,
  stripSearchMarkup,
  type BuyProduct,
} from '@/components/flow/buy-products';

export const ELEVENST_ENDPOINT = 'https://openapi.11st.co.kr/openapi/OpenApiService.tmall';

export type KeywordEncoding = 'euc-kr' | 'utf-8';

/** 검색어를 지정한 인코딩의 퍼센트 표기로 바꾼다 — URL 에 그대로 잇는다. */
export function encodeKeyword(keyword: string, encoding: KeywordEncoding): string {
  if (encoding === 'utf-8') return encodeURIComponent(keyword);
  const bytes = iconv.encode(keyword, 'euc-kr');
  let out = '';
  for (const byte of bytes) out += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
  return out;
}

/** `<Tag>값</Tag>` 한 칸 — CDATA 래퍼까지 벗긴다. 없으면 ''. */
function tagValue(block: string, tag: string): string {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(block);
  if (!match) return '';
  return match[1].replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1').trim();
}

/**
 * ProductSearch 응답 XML → 상품 목록. 에러 응답(<ErrorCode>)이나 못 알아볼 블록은
 * 조용히 빈 값으로 — 이 목록이 비면 화면은 사이트 목록으로 내려간다(고장이 아니다).
 */
export function parseElevenstProducts(xml: string, limit = 20): BuyProduct[] {
  if (xml.includes('<ErrorCode>')) return [];

  const blocks = xml.match(/<Product>[\s\S]*?<\/Product>/g) ?? [];
  const products: BuyProduct[] = [];

  for (const block of blocks) {
    if (products.length >= limit) break;

    const title = stripSearchMarkup(tagValue(block, 'ProductName'));
    const link = tagValue(block, 'DetailPageUrl') || tagValue(block, 'ProductDetailUrl');
    if (title === '' || !/^https?:\/\//.test(link)) continue;

    // 실판매가(SalePrice)를 먼저 본다 — ProductPrice 는 할인 전 정가일 수 있다.
    const price = parsePrice(tagValue(block, 'SalePrice')) ?? parsePrice(tagValue(block, 'ProductPrice'));
    const seller = stripSearchMarkup(tagValue(block, 'SellerNick') || tagValue(block, 'Seller'));

    products.push({
      title,
      // http 상세 URL 이 와도 https 로 올린다 — 11번가는 https 를 받는다(대문이 그렇다).
      link: link.replace(/^http:\/\//, 'https://'),
      mallName: seller === '' ? '11번가' : seller,
      price,
    });
  }

  return products;
}
