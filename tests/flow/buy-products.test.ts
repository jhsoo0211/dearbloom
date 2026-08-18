import { describe, expect, it } from 'vitest';

import {
  parsePrice,
  sortBuyProducts,
  stripSearchMarkup,
  type BuyProduct,
} from '@/components/flow/buy-products';

function product(overrides: Partial<BuyProduct>): BuyProduct {
  return { title: '장미 꽃다발', link: 'https://example.com', mallName: '어느꽃집', price: 30000, ...overrides };
}

describe('사러 가기 실상품 — 정렬·점수 (buy-products.ts)', () => {
  it('추천순은 확인해 둔 판매처를 조용히 끌어올린다 — 화면에는 이유를 적지 않는다', () => {
    const products = [
      product({ title: 'A', mallName: '아무꽃집1' }),
      product({ title: 'B', mallName: '아무꽃집2' }),
      product({ title: 'C', mallName: '우체국쇼핑' }),
    ];
    const sorted = sortBuyProducts(products, 'recommended');
    expect(sorted[0].title).toBe('C');
    // 나머지는 API 가 준 차례 그대로다.
    expect(sorted.map((p) => p.title)).toEqual(['C', 'A', 'B']);
  });

  it('값이 없는 상품은 추천순에서 한 발 뒤로 간다', () => {
    const products = [
      product({ title: 'A', price: null }),
      product({ title: 'B' }),
    ];
    expect(sortBuyProducts(products, 'recommended').map((p) => p.title)).toEqual(['B', 'A']);
  });

  it('가격 낮은순 — 값 없는 상품은 0원인 척하지 않고 맨 뒤다', () => {
    const products = [
      product({ title: 'A', price: 50000 }),
      product({ title: 'B', price: null }),
      product({ title: 'C', price: 20000 }),
    ];
    expect(sortBuyProducts(products, 'priceAsc').map((p) => p.title)).toEqual(['C', 'A', 'B']);
  });

  it('가격 높은순 — 값 없는 상품은 무한대인 척하지 않고 역시 맨 뒤다', () => {
    const products = [
      product({ title: 'A', price: 50000 }),
      product({ title: 'B', price: null }),
      product({ title: 'C', price: 20000 }),
    ];
    expect(sortBuyProducts(products, 'priceDesc').map((p) => p.title)).toEqual(['A', 'C', 'B']);
  });

  it('정렬은 원본 배열을 바꾸지 않는다', () => {
    const products = [product({ title: 'A', price: 50000 }), product({ title: 'B', price: 20000 })];
    sortBuyProducts(products, 'priceAsc');
    expect(products.map((p) => p.title)).toEqual(['A', 'B']);
  });
});

describe('사러 가기 실상품 — API 응답 다듬기', () => {
  it('상품명의 <b> 강조와 엔티티를 걷는다', () => {
    expect(stripSearchMarkup('<b>장미</b> 꽃다발 &amp; 안개꽃')).toBe('장미 꽃다발 & 안개꽃');
  });

  it('값 문자열은 숫자로, 빈 값·이상값은 null 로', () => {
    expect(parsePrice('128000')).toBe(128000);
    expect(parsePrice('')).toBeNull();
    expect(parsePrice('0')).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
    expect(parsePrice('abc')).toBeNull();
  });
});
