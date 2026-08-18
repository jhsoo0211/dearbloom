import { describe, expect, it } from 'vitest';

import { buildBuyLinks } from '@/components/flow/buy-links';

/**
 * 「사러 가기」 시트의 목적지 회귀 가드.
 *
 * URL 패턴 자체는 2026-08-17 실측을 거쳤고(`docs/partners-research.md` §6),
 * 살아 있는지는 네트워크 점검(사람이 돌리는 쪽)의 몫이다. 여기서 지키는 것은
 * **우리 쪽 규칙**이다 — 검색어 규칙(§5 와 한 원리), 우선순위, 필터의 성립.
 */
describe('사러 가기 목적지 (docs/partners-research.md §6)', () => {
  const links = buildBuyLinks('장미');

  it('전부 https 다', () => {
    for (const link of links) expect(link.href, link.key).toMatch(/^https:\/\//);
  });

  it('쇼핑몰 검색은 `{이름} 꽃다발` 로 좁힌다 — 이름만 넣으면 닭발·차·비누가 나온다', () => {
    const naver = links.find((link) => link.key === 'naver');
    expect(naver?.href).toContain(encodeURIComponent('장미 꽃다발'));
  });

  it('우체국은 `{이름} 꽃배달` 규칙 그대로다 (§5 실측)', () => {
    const epost = links.find((link) => link.key === 'epost');
    expect(epost?.href).toContain(encodeURIComponent('장미 꽃배달'));
  });

  it('값을 한눈에 견주는 곳이 맨 앞이다 — 사용자 확정 우선순위', () => {
    expect(links[0].key).toBe('naver');
  });

  it('확인한 곳과 쇼핑몰이 둘 다 있다 — 필터가 헛돌지 않는다', () => {
    expect(links.some((link) => link.kind === 'partner')).toBe(true);
    expect(links.some((link) => link.kind === 'market')).toBe(true);
  });

  it('공백이 든 이름(`아시아틱 백합`)도 URL 이 깨지지 않는다', () => {
    for (const link of buildBuyLinks('아시아틱 백합')) {
      expect(link.href, link.key).not.toContain(' ');
    }
  });

  it('재고·배송을 약속하는 말이 소개에 없다', () => {
    for (const link of links) {
      expect(link.desc, link.key).not.toMatch(/내일 도착|당일 배송|재고 보장|가장 싸/);
    }
  });

  /**
   * 2026-08-18 실사의 결론을 코드로 붙들어 둔다 — 원장의
   * 「딥링크에 카테고리 필터를 실을 것인가」 절이 셋 다 기각했다.
   *
   * 이 테스트가 지키는 것은 URL 의 생김새가 아니라 **판단**이다: 카테고리 id 는
   * 빗나가면 0건(빈 화면)이지만 검색어는 빗나가도 결과가 줄 뿐이다. 그래서 우리는
   * 검색어만 싣는다. 누군가 "필터가 있으면 좋잖아" 하며 id 를 붙이면 여기서 걸린다.
   */
  it('카테고리 id 파라미터를 싣지 않는다 — 빗나가면 0건이 되는 손잡이다 (2026-08-18 기각)', () => {
    for (const link of buildBuyLinks('장미')) {
      // 네이버 catId · 쿠팡 component · 카카오 categoryCode — 셋 다 기각된 이름이다.
      expect(link.href, link.key).not.toMatch(/[?&](catId|cat_id|component|categoryCode)=/i);
    }
  });

  it('그래도 검색어로 좁히는 일은 계속한다 — 빗나가도 빈 화면이 되지 않는 유일한 손잡이', () => {
    for (const key of ['naver', 'kakao', 'coupang']) {
      const link = links.find((item) => item.key === key);
      expect(link?.query, key).toContain('꽃다발');
    }
  });
});
