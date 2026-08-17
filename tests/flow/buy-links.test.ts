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
});
