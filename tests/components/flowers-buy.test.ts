import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildBuyLinks } from '@/components/flow/buy-links';
import { buySearchName } from '@/components/flowers/buy-name';
import { buySearchName as sharedBuySearchName } from '@/components/flow/view-format';
import { loadCatalog } from '@/lib/data/catalog';

/**
 * 도감 상세의 「사러 가기」 — 회귀 가드 (2026-08-18).
 *
 * 여기서 지키는 것은 셋이다.
 *   ① **목적지가 결과 화면과 같다.** 도감이 URL 을 따로 갖는 순간 두 화면이 갈린다 —
 *      그래서 도감 쪽 파일에는 주소가 한 줄도 없어야 하고, 목록은
 *      `flow/buy-links.ts` 에서 와야 한다(그 파일이 실측의 단일 원본이다).
 *   ② **검색어 규칙이 결과 화면과 같다.** `빨간 장미 꽃배달` 은 0건이고 `장미 꽃배달` 은
 *      12건이다(`docs/partners-research.md` §5). 그 규칙이 도감에서만 빠지면 도감으로
 *      들어온 사람만 빈 검색 결과를 만난다.
 *   ③ **정직 고지가 지워지지 않는다.** 없으면 목록이 재고와 제휴를 약속하는 말이 된다.
 */

const ROOT = path.resolve(__dirname, '../..');

function source(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8').replaceAll('\r\n', '\n');
}

const BUY_SHEET = source('src/components/flowers/BuySheet.tsx');
const FLOWER_BUY = source('src/components/flowers/FlowerBuy.tsx');
const BUY_NAME = source('src/components/flowers/buy-name.ts');
const DETAIL = source('src/app/flowers/[slug]/page.tsx');
const RESULT_VIEW = source('src/components/flow/ResultView.tsx');

/** 주석을 지우면 줄이 밀린다 — 같은 길이의 공백으로 덮는다(`no-dead-links.test.ts` 와 같은 처리). */
function blankComments(code: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, ' ');
  return code
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(?<!:)\/\/[^\n]*/g, blank);
}

describe('목적지는 한 곳에서만 온다', () => {
  it('시트가 `flow/buy-links` 에서 목록을 받아 온다', () => {
    expect(BUY_SHEET).toContain("from '@/components/flow/buy-links'");
    expect(BUY_SHEET).toContain('buildBuyLinks');
  });

  it('도감 쪽 파일에는 주소가 한 줄도 없다 — 베끼는 순간 두 화면이 갈린다', () => {
    for (const [name, code] of [
      ['BuySheet.tsx', BUY_SHEET],
      ['FlowerBuy.tsx', FLOWER_BUY],
      ['buy-name.ts', BUY_NAME],
    ] as const) {
      expect(blankComments(code), name).not.toMatch(/https?:\/\//);
    }
  });

  it('상세 화면이 그 버튼을 실제로 세운다', () => {
    const code = blankComments(DETAIL);
    expect(code).toContain("from '@/components/flowers/FlowerBuy'");
    expect(code).toContain('<FlowerBuy');
    // 문구는 결과 화면과 같은 결이다("이 꽃 어디서 사지" 에 답하는 자리).
    expect(DETAIL).toContain('이 꽃 어디서 살까요');
  });
});

describe('검색어 규칙 (docs/partners-research.md §5)', () => {
  it('앞에 붙은 색·품종 수식을 뗀다', () => {
    expect(buySearchName('빨간 장미')).toBe('장미');
    expect(buySearchName('흰 튤립')).toBe('튤립');
    expect(buySearchName('아시아틱 백합')).toBe('백합');
  });

  it('괄호 속 딴이름을 뗀다 — 검색창에 괄호를 넣으면 걸리는 것이 없다', () => {
    expect(buySearchName('미모사(은엽아카시아)')).toBe('미모사');
  });

  it('한 낱말짜리 이름은 그대로다', () => {
    expect(buySearchName('수국')).toBe('수국');
    expect(buySearchName('프리지아')).toBe('프리지아');
  });

  /**
   * 같은 규칙이 결과 화면에도 있었다 — `ResultView.tsx` 의 파일 내부 함수 `mainName`.
   * 여기는 그 두 몸통을 소스로 맞대어 보던 자리다. 2026-08-18 에 규칙이
   * `flow/view-format.ts` 한 벌로 합쳐지면서, 이 테스트가 지키는 것도 "두 몸통이 같은가"
   * 에서 **"두 화면이 같은 한 벌을 부르는가"** 로 바뀌었다. 그물을 걷은 것이 아니라
   * 옮긴 것이다 — 어느 한쪽이 다시 제 몸통을 세우면 여기서 걸린다.
   */
  it('도감은 규칙을 베끼지 않는다 — 공용 한 벌을 그대로 내보낸다', () => {
    const code = blankComments(BUY_NAME);
    expect(code).toContain("from '@/components/flow/view-format'");
    expect(code).toContain('buySearchName');
    // 몸통이 다시 생기면 걸린다.
    expect(code).not.toMatch(/function\s+buySearchName/);
    // 그리고 부르는 것이 정말 그 한 벌인가는 소스가 아니라 런타임이 답한다.
    expect(buySearchName).toBe(sharedBuySearchName);
  });

  it('결과 화면도 그 한 벌을 부른다 — 제 몸통을 세우지 않는다', () => {
    const code = blankComments(RESULT_VIEW);
    expect(code).toContain("from './view-format'");
    expect(code).toContain('buySearchName');
    expect(code).not.toMatch(/function\s+mainName/);
  });

  it('카탈로그 전종이 깨지지 않는 목적지를 얻는다', async () => {
    const catalog = await loadCatalog();
    expect(catalog.flowers.length).toBeGreaterThan(0);

    for (const flower of catalog.flowers) {
      const name = buySearchName(flower.nameKo);
      expect(name, flower.id).not.toContain('(');
      expect(name, flower.id).not.toContain(' ');

      for (const link of buildBuyLinks(name)) {
        expect(link.href, `${flower.id}/${link.key}`).toMatch(/^https:\/\//);
        expect(link.href, `${flower.id}/${link.key}`).not.toContain(' ');
      }
    }
  });
});

describe('정직 고지 — 지우면 목록이 약속이 된다', () => {
  it('값·재고를 우리가 보증하지 않는다고 적는다', () => {
    expect(BUY_SHEET).toContain('값과 재고는 저마다 그때그때 달라요');
  });

  it('제휴 관계가 아니라는 문장이 결과 화면·파트너 페이지와 **같다**', () => {
    // 세 화면이 같은 사실을 말해야 한다 — 한쪽만 고치면 어느 쪽을 믿을지 알 수 없다.
    expect(BUY_SHEET).toContain('아직 제휴 관계는 아니에요');
    expect(BUY_SHEET).toContain('좋은 곳을 먼저 알려 드리는 거예요.');
    expect(RESULT_VIEW).toContain('아직 제휴 관계는 아니에요');
  });

  it('바깥으로 나가는 줄은 새 창이라고 미리 알린다 (P1-6)', () => {
    const code = blankComments(BUY_SHEET);
    expect(code).toContain('target="_blank"');
    expect(code).toContain('(새 창)');
  });
});
