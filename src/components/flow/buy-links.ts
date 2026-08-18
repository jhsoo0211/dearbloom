/**
 * 결과 화면 「사러 가기」 시트의 목적지들 — 전부 2026-08-17 에 실측을 거쳤다.
 * 근거 원장: `docs/partners-research.md` 의 「결과 화면 사러 가기 시트」 절
 * (URL 패턴·0건일 때의 화면·모바일 웹 동작까지 거기 적혀 있다).
 *
 * 사용자 요구(2026-08-17)가 이 파일의 모양을 정했다:
 *   "다나와처럼 가격을 한눈에 견주는 곳을 먼저, 우리 파트너 우선,
 *    없다면 다른 사이트도 — 그리고 필터로 가를 수 있게."
 *
 * 그래서 두 갈래다:
 *   · partner — 우리가 하나하나 확인해 소개하는 곳(파트너 페이지 큐레이션과 같은 결).
 *   · market  — 일반 쇼핑몰. 값·상품을 한눈에 견주는 쓸모로 넣었다.
 *     (화면 라벨은 `쇼핑몰` — 처음의 `바깥 장` 은 어색하다는 사용자 확정 워딩이다.)
 * 배열 순서가 곧 화면 순서다 — **값을 견주는 곳(네이버쇼핑)이 맨 앞**이고,
 * 우리가 확인한 곳들이 그 바로 뒤다. 어느 쪽과도 제휴가 아니다(시트가 그대로 말한다).
 *
 * ⚠ 검색어 규칙 — 큰 장 검색은 `{이름} 꽃다발` 로 좁힌다. 이름만 넣으면 엉뚱한 것이
 *   나오는 것을 우체국 검색에서 실측한 그 원리다(`튤립` → 튤립닭발 · `수국` → 수국차).
 *   우체국만 그쪽 실측 규칙 그대로 `{이름} 꽃배달`, 우리화원은 꽃집 전용몰이라 이름
 *   그대로 넣는다(0건이어도 「총 0개 상품」 정상 안내가 뜨는 것까지 실측했다).
 * ⚠ 재고·가격·배송을 약속하는 소개는 쓰지 않는다 — 우리는 길만 잇는다.
 * ⚠ 11번가도 실측을 통과했지만(레거시 `Search.tmall` 리다이렉트 생존) 쇼핑몰이 넷이면
 *   목록이 장바구니처럼 읽혀 보류했다. 되살리려면 원장의 그 칸을 먼저 보라.
 *
 * ⚠ **카테고리 파라미터는 일부러 붙이지 않는다**(2026-08-18 실사 — 원장의
 *   「딥링크에 카테고리 필터를 실을 것인가」 절). 네이버 `catId`·쿠팡 `component`·
 *   카카오 `categoryCode` 셋을 다 재 봤고 셋 다 기각이다: 쿠팡은 스스로 "카테고리를
 *   반기마다 리뉴얼한다"고 적어 두었고, 네이버는 쓸 만한 `꽃다발` 리프가 없으며(가장
 *   가까운 칸에 **화환**이 섞인다), 카카오는 듣기는 하지만 **틀린 코드에 조용히 0건**을
 *   주면서 첫 화면은 필터 유무가 같다. 붙이려거든 그 절부터 읽어라 —
 *   깨지는 딥링크는 필터가 없는 것보다 나쁘다는 것이 이 파일의 전제다.
 */

export type BuyLinkKind = 'partner' | 'market';

export interface BuyLink {
  key: string;
  kind: BuyLinkKind;
  name: string;
  /** 한 줄 소개. 재고·가격·배송을 약속하는 말은 금지다. */
  desc: string;
  /** 최종 목적지. 검색형이면 꽃 이름이 이미 인코딩되어 들어 있다. */
  href: string;
  /** 검색형일 때 행 부제로 보여 줄 검색어 원문. 고정 링크면 없다. */
  query?: string;
}

export function buildBuyLinks(mainName: string): BuyLink[] {
  const bouquet = `${mainName} 꽃다발`;
  const delivery = `${mainName} 꽃배달`;

  return [
    {
      key: 'naver',
      kind: 'market',
      name: '네이버쇼핑',
      query: bouquet,
      desc: '여러 판매처의 값을 한눈에 견줘 볼 수 있어요.',
      href: `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(bouquet)}`,
    },
    {
      key: 'epost',
      kind: 'partner',
      name: '우체국 꽃배달',
      query: delivery,
      desc: '공공 창구예요. 전국 우체국이 지역 화원과 이어 줘요.',
      href: `https://mall.epost.go.kr/fo/search/search.do?searchTerm=${encodeURIComponent(delivery)}`,
    },
    {
      key: 'woori',
      kind: 'partner',
      name: '우리화원',
      query: mainName,
      desc: '장애인표준사업장 꽃집이에요. 꽃다발과 화환을 전국으로 보내요.',
      href: `https://xn--oy2b11v1cz53e.com/goods/goods_search/s_keyword/${encodeURIComponent(mainName)}`,
    },
    {
      key: 'kakao',
      kind: 'market',
      name: '카카오톡 선물하기',
      query: bouquet,
      desc: '찾아서 그 자리에서 선물로 보낼 수 있어요.',
      href: `https://gift.kakao.com/search/result?query=${encodeURIComponent(bouquet)}`,
    },
    {
      key: 'coupang',
      kind: 'market',
      name: '쿠팡',
      query: bouquet,
      desc: '여러 판매자가 모인 쇼핑몰이에요. 꽃다발이 함께 나와요.',
      href: `https://www.coupang.com/np/search?q=${encodeURIComponent(bouquet)}`,
    },
    {
      key: 'flip',
      kind: 'partner',
      name: '플립플라워 스토어',
      desc: '청각장애 플로리스트가 만든 단품 꽃다발을 파는 곳이에요.',
      href: 'https://flipflower.co.kr/product/list.html?cate_no=65',
    },
    {
      key: 'kukka',
      kind: 'market',
      name: '꾸까',
      desc: '꽃 전문몰이에요. 검색창에 꽃 이름을 넣어 찾아보세요.',
      // 검색어를 URL 로 미리 채우는 길이 없다(실측 — 번들이 쿼리 파라미터를 읽지 않는다).
      href: 'https://kukka.kr/catalog/product/search/',
    },
  ];
}
