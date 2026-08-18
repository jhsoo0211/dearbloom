import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildFlowerDetail } from '@/components/flowers/data';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';

/**
 * 도감 상세의 「문학 속의 이 꽃」 — 회귀 가드 (2026-08-18).
 *
 * 여기서 지키는 것은 넷이다.
 *   ① **차례가 결과 화면과 같다.** 도감이 제 순서를 갖는 순간 같은 꽃에서 두 화면이 다른
 *      편을 앞세우고, 같은 작가의 연작이 붙어 나오는 것도 도감에서만 되살아난다 —
 *      그래서 도감 쪽에는 정렬 코드가 한 줄도 없어야 하고, 차례는
 *      `flow/labels.ts` 의 `orderLiterature` 에서 와야 한다.
 *   ② **원문을 화면 사정으로 고치지 않는다.** 1925년 초판 표기(`진달내꼿`·`즈려밟고`)와
 *      한시 한문이 글자 그대로 실려야 한다. 여기가 무너지면 서비스가 "원문"이라 부르며
 *      현대어를 보여 주게 된다.
 *   ③ **caveat 는 지워지지 않는다.** 진달래와 철쭉이 다른 종이라는 것, 옛 표기를 옮겨
 *      적었다는 것 — 밝히지 않으면 이 화면이 틀린 정보를 주는 화면이 된다.
 *   ④ **없는 꽃에는 구획이 없다.** 발췌가 없는 23종의 자리를 편집팀 문장으로 메우는 것은
 *      §1.5e "검증된 인용만" 에 어긋난다(빈 섹션 미렌더는 이 화면의 기존 규범이다).
 */

const ROOT = path.resolve(__dirname, '../..');

function source(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8').replaceAll('\r\n', '\n');
}

const DATA = source('src/components/flowers/data.ts');
const BLOCK = source('src/components/flowers/FlowerLiterature.tsx');
const DETAIL = source('src/app/flowers/[slug]/page.tsx');
const BUILD_RESULT = source('src/app/recommend/build-result.ts');

/** 주석을 지우면 줄이 밀린다 — 같은 길이의 공백으로 덮는다(`no-dead-links.test.ts` 와 같은 처리). */
function blankComments(code: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, ' ');
  return code
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(?<!:)\/\/[^\n]*/g, blank);
}

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog();
  return cached;
}

function literatureOf(data: Catalog, slug: string) {
  const detail = buildFlowerDetail(data, slug);
  expect(detail, slug).toBeDefined();
  return detail!.literature;
}

describe('있는 꽃에만 선다', () => {
  it('발췌가 있는 종에만 값이 서고, 나머지는 빈 배열이다', async () => {
    const data = await catalog();

    const withLit = data.flowers.filter((flower) => literatureOf(data, flower.id).length > 0);
    const without = data.flowers.filter((flower) => literatureOf(data, flower.id).length === 0);

    // 59종 = 36종(문학 있음) + 23종(근대에 명명돼 고전 문학에 나오지 않는 꽃들).
    expect(data.flowers).toHaveLength(59);
    expect(withLit).toHaveLength(36);
    expect(without).toHaveLength(23);
  });

  it('그 꽃에 붙은 행을 하나도 버리지 않는다 — 도감은 아카이브다', async () => {
    const data = await catalog();

    const shown = data.flowers.reduce(
      (sum, flower) => sum + literatureOf(data, flower.id).length,
      0,
    );
    const rows = data.quotes.filter(
      (quote) => quote.flowerId !== undefined && quote.excerptType !== undefined,
    );

    expect(rows.length).toBe(86);
    expect(shown).toBe(rows.length);
  });

  it('꽃을 가리지 않는 범용 인용은 이 자리에 오지 않는다', async () => {
    const data = await catalog();
    const general = data.quotes
      .filter((quote) => quote.excerptType === undefined)
      .map((quote) => quote.quoteId);

    expect(general.length).toBeGreaterThan(0);

    for (const flower of data.flowers) {
      for (const item of literatureOf(data, flower.id)) {
        expect(general, `${flower.id} / ${item.id}`).not.toContain(item.id);
      }
    }
  });
});

describe('차례는 결과 화면과 한 곳에서 온다', () => {
  it('도감은 순서를 다시 정하지 않는다 — `orderLiterature` 를 가져다 쓴다', () => {
    const code = blankComments(DATA);
    expect(code).toContain('orderLiterature');
    expect(code).toContain("from '@/components/flow/labels'");
    // 정렬을 도감 쪽에서 다시 짜면 여기서 걸린다(베끼는 순간 두 화면이 갈린다).
    expect(code).not.toMatch(/literature[\s\S]{0,400}?\.sort\(/i);
  });

  it('같은 작가가 연달아 서지 않는다 (작가 인터리브)', async () => {
    const data = await catalog();

    for (const flower of data.flowers) {
      const authors = literatureOf(data, flower.id).map(
        (item) => item.attribution.split(',')[0]?.trim() ?? '',
      );
      for (let n = 1; n < authors.length; n += 1) {
        expect(authors[n], `${flower.id} ${n}번째`).not.toBe(authors[n - 1]);
      }
    }
  });

  it('난수가 없다 — 다시 불러도 같은 차례다', async () => {
    const data = await catalog();
    const once = literatureOf(data, 'rose-red').map((item) => item.id);
    const twice = literatureOf(data, 'rose-red').map((item) => item.id);

    expect(once).toEqual(twice);
    expect(once).toHaveLength(9);
  });
});

describe('원문은 화면 사정으로 고치지 않는다', () => {
  it('김소월 〈진달래꽃〉 — 1925 초판 표기가 글자 그대로 실린다', async () => {
    const data = await catalog();
    const sowol = literatureOf(data, 'azalea').find((item) => item.id === 'q-lit-azalea-kimsowol');

    expect(sowol).toBeDefined();
    // 옛 표기(종성 ㅅ·옛 어형)를 현대 맞춤법으로 고치면 원문 자리가 현대어와 겹쳐 버린다.
    expect(sowol!.textOriginal).toContain('진달내꼿');
    expect(sowol!.textOriginal).toContain('노힌그꼿츨');
    expect(sowol!.textOriginal).toContain('삽분히즈려밟고');
    // 한자 지명도 그대로 — 한글로 풀어 적으면 그것은 원문이 아니다.
    expect(sowol!.textOriginal).toContain('寧邊');
    expect(sowol!.textOriginal).toContain('藥山');

    // 현대어 쪽은 그 반대다. 둘이 같아지면 병기할 이유가 사라진다.
    expect(sowol!.textKo).toContain('진달래꽃');
    expect(sowol!.textKo).toContain('즈려밟고'); // 옛 어형 그대로 남긴 낱말(§6-2)
    expect(sowol!.textKo).not.toBe(sowol!.textOriginal);

    // 우리가 옮긴 문장을 원문인 척 두지 않는다.
    expect(sowol!.translatorNote).toBe('옮김: dearbloom');
    expect(sowol!.attribution).toContain('김소월');
  });

  it('매화 한시 3편 — 한문 원문이 그대로 병기된다', async () => {
    const data = await catalog();
    const plum = literatureOf(data, 'plum-blossom');

    expect(plum).toHaveLength(3);
    for (const item of plum) {
      expect(item.textOriginal, item.id).toBeDefined();
      // 한자가 한 글자도 없으면 원문 칸이 번역으로 채워졌다는 뜻이다.
      expect(item.textOriginal!, item.id).toMatch(/[一-鿿]/);
      expect(item.translatorNote, item.id).toBe('옮김: dearbloom');
    }

    const wang = plum.find((item) => item.id === 'q-lit-plum-wanganshi');
    expect(wang?.textOriginal).toBe('牆角數枝梅，凌寒獨自開。遙知不是雪，為有暗香來。');
  });

  it('원문이 있는 행은 번역과 원문이 서로 다르다 — 한 칸을 복사해 채우지 않는다', async () => {
    const data = await catalog();

    for (const flower of data.flowers) {
      for (const item of literatureOf(data, flower.id)) {
        if (item.textOriginal === undefined) continue;
        expect(item.textOriginal, `${flower.id} / ${item.id}`).not.toBe(item.textKo);
      }
    }
  });
});

describe('각주 — 밝히지 않으면 틀린 정보가 되는 줄', () => {
  it('표에 적힌 caveat 는 한 줄도 빠지지 않는다', async () => {
    const data = await catalog();
    const shown = new Map<string, string>();

    for (const flower of data.flowers) {
      for (const item of literatureOf(data, flower.id)) {
        if (item.caveat) shown.set(item.id, item.caveat);
      }
    }

    const rows = data.quotes.filter(
      (quote) => quote.flowerId !== undefined && quote.excerptType !== undefined && quote.caveat,
    );
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(shown.get(row.quoteId), row.quoteId).toBe(row.caveat);
    }
  });

  it('진달래 — 철쭉이 다른 종이라는 사실이 화면에 남는다', async () => {
    const data = await catalog();
    const samguk = literatureOf(data, 'azalea').find(
      (item) => item.id === 'q-lit-azalea-samgukyusa',
    );

    expect(samguk?.caveat).toContain('철쭉은 진달래와 같은 진달래속이지만 다른 종이에요');
  });

  it('옛 표기를 옮겨 적었다는 사실도 화면이 직접 말한다', async () => {
    const data = await catalog();
    const sowol = literatureOf(data, 'azalea').find((item) => item.id === 'q-lit-azalea-kimsowol');

    expect(sowol?.caveat).toContain('1925년 초판 표기');
    expect(sowol?.caveat).toContain('출처 링크에서 볼 수 있어요');
  });

  it('화면이 그 줄들을 실제로 그린다', () => {
    const code = blankComments(BLOCK);
    expect(code).toContain('item.caveat');
    expect(code).toContain('item.textOriginal');
    expect(code).toContain('item.translatorNote');
    expect(code).toContain('item.typeLabel');
    // 바깥으로 나가는 줄은 새 창이라고 미리 알린다(P1-6).
    expect(code).toContain('target="_blank"');
    expect(code).toContain('(새 창)');
  });
});

describe('화면 — 없는 꽃에는 구획도 없다', () => {
  it('상세가 발췌 유무로 구획을 가른다', () => {
    const code = blankComments(DETAIL);
    expect(code).toContain("from '@/components/flowers/FlowerLiterature'");
    expect(code).toContain('flower.literature.length > 0 &&');
    expect(code).toContain('<FlowerLiterature items={flower.literature} />');
    expect(DETAIL).toContain('문학 속의 이 꽃');
  });

  it('자리는 이야기 아래·사러 가기 위다 (읽을 것 → 할 것)', () => {
    const code = blankComments(DETAIL);
    const stories = code.indexOf('id="stories-title"');
    const literature = code.indexOf('id="literature-title"');
    const buy = code.indexOf('id="buy-title"');

    expect(stories).toBeGreaterThan(-1);
    expect(literature).toBeGreaterThan(stories);
    expect(buy).toBeGreaterThan(literature);
  });

  it('다섯 편이 넘으면 접는다 — `<details>` 라 JS 없이 열린다', async () => {
    const data = await catalog();
    const code = blankComments(BLOCK);

    expect(code).toContain('const OPEN_COUNT = 5;');
    expect(code).toContain('<details');
    expect(code).toContain('<summary');

    // 실제로 그 선을 넘는 꽃이 있어야 접힘이 죽은 코드가 아니다.
    expect(literatureOf(data, 'rose-red').length).toBeGreaterThan(5);
    // 그리고 대부분은 접히지 않는다(접힘이 기본이 되면 아카이브가 아니다).
    expect(literatureOf(data, 'plum-blossom').length).toBeLessThanOrEqual(5);
  });

  it('조판은 도감 제 파일에서 온다 — 결과 화면 모듈을 끌어다 쓰지 않는다', () => {
    expect(BLOCK).toContain("from './flowers.module.css'");
    expect(BLOCK).not.toContain('flow.module.css');
    // 발췌 스타일이 실제로 도감 파일에 있다.
    const css = source('src/components/flowers/flowers.module.css');
    for (const rule of ['.lits {', '.lit {', '.litKo {', '.litOrig {', '.litCaveat {']) {
      expect(css, rule).toContain(rule);
    }
  });
});

/**
 * 뷰 조립 몸통 — 결과 화면과 **글자까지 같아야 한다.**
 *
 * `build-result.ts` 의 두 함수는 내보내지 않는 파일 내부 함수라 가져다 쓸 길이 없어
 * 도감 쪽에 한 벌을 세웠다. 그러면 **한쪽만 고쳐지는 날**이 온다 — 두 몸통을 공백만
 * 지워 맞대어 본다. 어긋나면 답은 둘 중 하나다: 같이 고치거나, 한 벌로 합치거나
 * (합치는 쪽이 낫다). `buy-name.ts` ↔ `mainName` 이 맺은 것과 같은 약속이다.
 */
describe('발췌 한 편을 짓는 규칙이 두 화면에서 같다', () => {
  const pick = (code: string, head: string) => {
    const blanked = blankComments(code);
    const start = blanked.indexOf(head);
    expect(start, head).toBeGreaterThan(-1);
    const end = blanked.indexOf('\n}', start);
    expect(end, head).toBeGreaterThan(start);
    const body = blanked.slice(start + head.length, end).replace(/\s/g, '');
    // 몸통을 못 집으면 `'' === ''` 로 조용히 통과한다 — 그 함정을 여기서 막는다.
    expect(body.length, head).toBeGreaterThan(40);
    return body;
  };

  it('각주 한 줄(`작가, 제목(연도)`)을 짓는 몸통이 같다', () => {
    const head = 'function literatureAttribution(quote: Quote): string {';
    const body = pick(DATA, head);
    expect(body).toContain('quote.sourceTitle');
    expect(body).toBe(pick(BUILD_RESULT, head));
  });

  it('카탈로그 한 행 → 화면 값으로 옮기는 몸통이 같다', () => {
    const head = 'function toLiteratureView(quote: Quote): LiteratureView {';
    const body = pick(DATA, head);
    expect(body).toContain('view.translatorNote=`옮김:${quote.translator}`');
    expect(body).toBe(pick(BUILD_RESULT, head));
  });
});
