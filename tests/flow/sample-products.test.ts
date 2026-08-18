import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildBuyLinks } from '@/components/flow/buy-links';
import { sortBuyProducts } from '@/components/flow/buy-products';
import { loadCatalog } from '@/lib/data/catalog';
import { sampleBuyProducts } from '@/lib/demo/sample-products';

/**
 * 정적 데모의 **예시 상품** 그물 (2026-08-18).
 *
 * 이 목록은 우리가 지어낸 것이라, 다른 어떤 데이터보다 **거짓말이 되기 쉽다.** 그래서
 * 그물이 지키는 것도 모양이 아니라 정직이다:
 *   ① 주소를 지어내지 않는가(전부 `buildBuyLinks` 가 실측해 둔 목적지인가)
 *   ② 데모 밖으로 새지 않는가(본배포 액션에는 이 파일을 부르는 줄이 없는가)
 *   ③ 예시라는 표식을 반드시 함께 돌려주는가
 *   ④ 정렬 칩이 **실제로 도는가**(눌러도 아무 일 없는 버튼을 세우지 않는다 — P2-11)
 */

const SAMPLE_NAMES = ['장미', '튤립', '국화', '수국', '리시안셔스', '프리지아'];

describe('데모 예시 상품 — 모양과 결정성', () => {
  it('꽃마다 4~6줄이 서고, 이름이 비면 아무것도 세우지 않는다', () => {
    for (const name of SAMPLE_NAMES) {
      const products = sampleBuyProducts(name);
      expect(products.length, name).toBeGreaterThanOrEqual(4);
      expect(products.length, name).toBeLessThanOrEqual(6);
    }
    expect(sampleBuyProducts('')).toEqual([]);
    expect(sampleBuyProducts('   ')).toEqual([]);
  });

  it('같은 이름은 언제나 같은 목록 — 난수를 쓰지 않는다(시연·스크린샷이 되풀이된다)', () => {
    expect(sampleBuyProducts('장미')).toEqual(sampleBuyProducts('장미'));
    expect(sampleBuyProducts('튤립')).not.toEqual(sampleBuyProducts('장미'));
  });

  it('상품명은 그 꽃 이름으로 시작한다 — 시트 제목과 같은 이름을 쓴다', () => {
    for (const product of sampleBuyProducts('장미')) {
      expect(product.title.startsWith('장미 ')).toBe(true);
    }
  });

  it('값은 현실적인 띠 안의 천 원 단위다 — 값 없는 줄을 만들지 않는다', () => {
    for (const name of SAMPLE_NAMES) {
      for (const product of sampleBuyProducts(name)) {
        expect(product.price, `${name}/${product.title}`).not.toBeNull();
        expect(product.price! % 1000).toBe(0);
        expect(product.price!).toBeGreaterThanOrEqual(20_000);
        expect(product.price!).toBeLessThanOrEqual(150_000);
      }
    }
  });
});

describe('데모 예시 상품 — 정직선', () => {
  it('행의 목적지는 전부 `buildBuyLinks` 가 실측해 둔 판매처다 — 주소를 지어내지 않는다', () => {
    for (const name of SAMPLE_NAMES) {
      const known = new Set(buildBuyLinks(name).map((link) => link.href));
      for (const product of sampleBuyProducts(name)) {
        expect(known.has(product.link), `${name}/${product.link}`).toBe(true);
      }
    }
  });

  it('판매처 이름이 두 곳 이상 섞인다 — 정렬 칩이 가를 것이 있어야 한다', () => {
    for (const name of SAMPLE_NAMES) {
      const malls = new Set(sampleBuyProducts(name).map((product) => product.mallName));
      expect(malls.size, name).toBeGreaterThanOrEqual(2);
    }
  });

  it('재고·배송·최저가를 약속하는 말을 상품명에 넣지 않는다', () => {
    const forbidden = ['당일', '직송', '최저가', '무료배송', '정품', '보장'];
    for (const name of SAMPLE_NAMES) {
      for (const product of sampleBuyProducts(name)) {
        for (const word of forbidden) {
          expect(product.title.includes(word), `${product.title} ← ${word}`).toBe(false);
        }
      }
    }
  });

  it('도감 전종에서 선다 — 꽃이 늘어도 빈칸이 생기지 않는다', async () => {
    const catalog = await loadCatalog();
    for (const flower of catalog.flowers) {
      // 화면이 넘기는 값과 같은 결(대표 이름)로 잰다 — 괄호 속 딴이름·색 수식을 뗀 뒤.
      const main = flower.nameKo.replace(/\([^)]*\)/g, ' ').trim().split(/\s+/).pop() ?? '';
      expect(sampleBuyProducts(main).length, flower.id).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('데모 예시 상품 — 정렬 칩이 실제로 돈다', () => {
  it('추천순과 가격순이 서로 다른 차례를 낸다', () => {
    let differed = 0;
    for (const name of SAMPLE_NAMES) {
      const products = sampleBuyProducts(name);
      const recommended = sortBuyProducts(products, 'recommended').map((p) => p.title);
      const asc = sortBuyProducts(products, 'priceAsc').map((p) => p.title);
      const desc = sortBuyProducts(products, 'priceDesc').map((p) => p.title);
      expect(asc, name).not.toEqual(desc);
      if (recommended.join() !== asc.join()) differed += 1;
    }
    // 추천순은 가산 판매처가 위로 올라오는 정렬이라, 값순과 늘 같으면 칩이 죽은 것이다.
    expect(differed).toBe(SAMPLE_NAMES.length);
  });

  it('가격 낮은순은 실제로 오름차순이다', () => {
    const sorted = sortBuyProducts(sampleBuyProducts('장미'), 'priceAsc');
    const prices = sorted.map((product) => product.price ?? 0);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });
});

describe('데모 예시 상품 — 데모 밖으로 새지 않는다', () => {
  async function source(relative: string): Promise<string> {
    return readFile(path.resolve(process.cwd(), relative), 'utf8');
  }

  it('본배포 액션은 예시를 부르지도, `sample` 을 켜지도 않는다', async () => {
    const text = await source('src/app/recommend/actions.ts');
    expect(text).not.toContain('sample-products');
    expect(text).not.toContain('sample: true');
  });

  it('데모 액션은 예시를 세우고 `sample: true` 를 함께 돌려준다', async () => {
    const text = await source('src/lib/demo/recommend-actions.ts');
    expect(text).toContain('sampleBuyProducts');
    expect(text).toContain('sample: true');
  });

  it('화면은 그 표식으로 예시 고지를 세운다 — 목록만 세우고 말없이 넘기지 않는다', async () => {
    const text = await source('src/components/flow/ResultView.tsx');
    expect(text).toContain('response.sample === true');
    expect(text).toContain('보여드리는 예시예요');
  });
});
