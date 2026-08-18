import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { MEANING_CONFIDENCE_KO, SPECIES_KO } from '@/components/bouquet/labels';
import { CONFIDENCE_LABELS } from '@/components/flow/labels';
import { loadCatalog } from '@/lib/data/catalog';
import { exclude } from '@/lib/engine/exclude';

/**
 * `/bouquet` 화면의 약속 — 회귀 가드 (2026-08-18 B-4).
 *
 * 판정 자체는 `tests/engine/bouquet.test.ts` 가 본다. 여기서 지키는 것은 **화면 쪽 약속**
 * 넷이고, 넷 다 한 번 깨지면 조용히 산다(빌드도 타입 검사도 통과한다).
 *
 *   ① **서버를 부르지 않는다.** 이 화면에는 서버 액션도 fetch 도 없다 — 하나라도 생기면
 *      `output: 'export'` 빌드가 깨지거나(액션) 정적 zip 에서 판정이 죽는다(fetch).
 *   ② **표가 브라우저로 새지 않는다.** 클라이언트 컴포넌트가 도판 표·카탈로그 로더·
 *      엔진 배럴(zod)을 값으로 import 하지 않는다(코드 리뷰 P1-7 이 실제로 겪은 자리).
 *   ③ **표기를 두 벌 두고 갈리지 않는다.** `components/bouquet/labels.ts` 는 원본
 *      (`flow/labels.ts` · 엔진)과 **같은 말**이어야 한다.
 *   ④ **§1.6b·§1.4 를 CSS 가 지킨다.** 칩 44px · 선택은 `--cta-bg` 짝 채움 ·
 *      골드 배경 금지.
 *
 * 소스를 문자열로 훑는 검사는 **주석을 걷어내고** 본다. 이 저장소의 주석은 금지 규칙을
 * 글자 그대로 적어 두기 때문에(`background: var(--accent)` 로 되돌리지 마라 …) 원문을
 * 그대로 훑으면 경고문에 걸린다(`no-dead-links.test.ts` 가 같은 이유로 같은 방법을 쓴다).
 */

const ROOT = path.resolve(__dirname, '../..');

function source(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8').replaceAll('\r\n', '\n');
}

/** 주석을 걷어낸 본문(TS·TSX·CSS 공용). */
function code(rel: string): string {
  return source(rel)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(?<!:)\/\/[^\n]*/g, ' ');
}

/** 브라우저로 건너가는 파일들 — ②·① 이 이 목록을 훑는다. */
const CLIENT_FILES = [
  'src/components/bouquet/BouquetStudio.tsx',
  'src/components/bouquet/BouquetVerdict.tsx',
  'src/components/bouquet/types.ts',
  'src/components/bouquet/labels.ts',
  'src/lib/engine/bouquet.ts',
];

const PAGE = code('src/app/bouquet/page.tsx');
const ENGINE = code('src/lib/engine/bouquet.ts');
const CSS = code('src/components/bouquet/bouquet.module.css');

describe('스캔이 실제로 돌고 있다', () => {
  it('주석만 걷혔고 화면 문자열은 살아 있다', () => {
    // 걷어내기가 과하면 아래 검사가 전부 공허하게 통과한다.
    expect(PAGE).toContain('다발 짜기');
    expect(code('src/components/bouquet/BouquetVerdict.tsx')).toContain('이 다발이 품는 말들');
    expect(CSS).toContain('min-height: 44px');
  });
});

/* ------------------------------------------------------------------ *
 * ① 서버를 부르지 않는다
 * ------------------------------------------------------------------ */

describe('정적 zip 에서도 그대로 선다', () => {
  it('`/bouquet` 어디에도 서버 액션이 없다', () => {
    /* `output: 'export'` 는 서버 액션이 하나라도 살아 있으면 빌드가 실패한다.
       정적 데모는 이 라우트를 alias 로 갈아 끼우지 않으므로 애초에 두지 않는다. */
    for (const rel of [...CLIENT_FILES, 'src/app/bouquet/page.tsx']) {
      expect(code(rel), rel).not.toContain("'use server'");
    }
  });

  it('판정이 네트워크를 타지 않는다', () => {
    for (const rel of CLIENT_FILES) {
      expect(code(rel), rel).not.toMatch(/\bfetch\s*\(/);
      expect(code(rel), rel).not.toMatch(/\bXMLHttpRequest\b/);
    }
  });

  it('페이지는 서버 컴포넌트 그대로다 — 카탈로그를 서버에서 한 번만 읽는다', () => {
    expect(PAGE).not.toContain("'use client'");
    expect(PAGE).toContain('loadCatalog');
    expect(PAGE).toContain('export const revalidate');
  });
});

/* ------------------------------------------------------------------ *
 * ② 표가 브라우저로 새지 않는다
 * ------------------------------------------------------------------ */

describe('클라이언트 번들에 표를 싣지 않는다 (코드 리뷰 P1-7)', () => {
  const BANNED = [
    // 도판 59벌 + 취득 주소. 화면은 서버가 좁혀 준 `plate` 한 벌만 쓴다.
    '@/lib/plates',
    // node:fs 로 CSV 를 읽는다 — 섞이면 빌드가 깨진다.
    '@/lib/data/catalog',
    // 엔진 배럴과 표기 사전은 둘 다 zod 를 끌고 온다.
    '@/components/flow/labels',
  ];

  it('클라이언트 파일이 서버 전용 모듈을 값으로 import 하지 않는다', () => {
    for (const rel of CLIENT_FILES) {
      const body = code(rel);
      for (const banned of BANNED) {
        expect(body.includes(`from '${banned}'`), `${rel} → ${banned}`).toBe(false);
      }
      // 배럴(`@/lib/engine`)도 마찬가지다 — 경로로 직접 부른다(`@/lib/engine/bouquet`).
      expect(body.includes("from '@/lib/engine'"), rel).toBe(false);
    }
  });

  it('엔진 판정 모듈이 zod 를 끌고 오지 않는다', () => {
    /* `bouquet.ts` 는 브라우저에서 돈다. zod 를 쓰는 형제(normalize·explain·group·index)를
       하나라도 import 하면 첫 화면에 스키마 한 벌이 얹힌다. */
    expect(ENGINE).not.toContain("from 'zod'");
    for (const sibling of ['./normalize', './explain', './group', './index']) {
      expect(ENGINE.includes(`from '${sibling}'`), sibling).toBe(false);
    }
  });

  it('안전 판정을 다시 짜지 않고 `exclude()` 를 부른다', () => {
    expect(ENGINE).toContain("from './exclude'");
    expect(ENGINE).toMatch(/exclude\(\s*flowers,\s*input\s*\)/);
  });

  it('배럴에 얹지 않았다 — 얹으면 zod 가 딸려 온다', () => {
    expect(code('src/lib/engine/index.ts')).not.toContain("./bouquet");
  });
});

/* ------------------------------------------------------------------ *
 * ③ 표기가 원본과 갈리지 않는다
 * ------------------------------------------------------------------ */

describe('표기 한 벌 더 — 원본과 같은 말인가', () => {
  it('꽃말 신뢰 등급이 `CONFIDENCE_LABELS` 와 글자까지 같다', () => {
    expect(MEANING_CONFIDENCE_KO).toEqual(CONFIDENCE_LABELS);
  });

  it('반려동물 표기가 엔진이 쓰는 말과 같다', async () => {
    /* `exclude.ts` 의 `SPECIES_KO` 는 내보내지 않는다. 그래서 상수를 맞대는 대신
       **그 함수가 실제로 쓴 문장**에 우리 표기가 들어 있는지 본다. */
    const catalog = await loadCatalog();
    const lily = catalog.flowers.find((flower) => flower.id === 'lily-asiatic');
    expect(lily).toBeDefined();

    const { excluded } = exclude([lily!], {
      relationship: 'other',
      intent: 'other',
      pets: ['cat'],
    });
    expect(excluded[0]?.reason).toContain(SPECIES_KO.cat);

    const { cautionsByFlower } = exclude([lily!], {
      relationship: 'other',
      intent: 'other',
      pets: ['dog'],
    });
    expect(cautionsByFlower.get('lily-asiatic')?.[0]).toContain(SPECIES_KO.dog);
  });
});

/* ------------------------------------------------------------------ *
 * ④ 컨트롤 규격 · 팔레트 금지선
 * ------------------------------------------------------------------ */

describe('§1.6b 컨트롤 · §1.4 팔레트', () => {
  it('칩·스와치가 44px 타깃을 지킨다', () => {
    for (const selector of ['.chip {', '.swatch {', '.chipGrid']) {
      expect(CSS, selector).toContain(selector);
    }
    // 44px 아래로 내려간 컨트롤이 없다.
    const heights = [...CSS.matchAll(/min-height:\s*(\d+)px/g)].map((m) => Number(m[1]));
    expect(heights.length).toBeGreaterThan(4);
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(24);
    for (const selector of ['.chip', '.swatch', '.buyBtn', '.btn', '.ghostBtn']) {
      const start = CSS.indexOf(`${selector} {`);
      expect(start, selector).toBeGreaterThan(-1);
      const block = CSS.slice(start, CSS.indexOf('}', start));
      const found = /min-height:\s*(\d+)px/.exec(block);
      expect(found, selector).not.toBeNull();
      expect(Number(found?.[1]), selector).toBeGreaterThanOrEqual(44);
    }
  });

  it('선택 상태는 `--cta-bg` 짝 채움이다 — 골드 배경 금지(§1.4)', () => {
    expect(CSS).toContain('--ctrl-on: var(--cta-bg)');
    expect(CSS).toContain('--ctrl-on-fg: var(--cta-fg)');
    expect(CSS).not.toMatch(/background:\s*var\(--accent\)/);
    expect(CSS).not.toMatch(/background:\s*var\(--gold\)/);
  });

  it('팔레트를 다시 정의하지 않는다 — 전역 변수만 쓴다', () => {
    /* 6색 hex 를 모듈 CSS 에 다시 적으면 테마 전환이 이 화면만 비껴간다.
       스와치 hex 는 데이터에서 오므로(`COLOR_CHOICES`) CSS 에는 한 줄도 없다. */
    const hex = [...CSS.matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((m) => m[0]);
    expect(hex).toEqual([]);
  });

  it('focus-visible 은 2px 링 + 2px 오프셋이다(§1.6b 공통 상태)', () => {
    expect(CSS).toContain('outline: 2px solid var(--focus)');
    expect(CSS).toContain('outline-offset: 2px');
    expect(CSS).not.toContain('outline-offset: 3px');
  });
});

/* ------------------------------------------------------------------ *
 * ⑤ 이어지는 길 — 목적지와 정직 고지
 * ------------------------------------------------------------------ */

describe('사러 가기와 지도', () => {
  it('시트를 다시 만들지 않고 도감 것을 그대로 쓴다', () => {
    /* 목적지·검색어 규칙의 단일 원본은 `flow/buy-links.ts` 이고, 시트 UI 는 도감 쪽
       한 벌이다. 여기서 URL 을 한 줄이라도 베끼면 세 화면이 갈린다. */
    const studio = code('src/components/bouquet/BouquetStudio.tsx');
    expect(studio).toContain("from '@/components/flowers/BuySheet'");

    for (const rel of CLIENT_FILES) {
      expect(code(rel), rel).not.toMatch(/https?:\/\//);
    }
  });

  it('재고를 약속하지 않는다 — 결과 화면·도감과 같은 문장이다', () => {
    const verdict = code('src/components/bouquet/BouquetVerdict.tsx');
    const buySheet = source('src/components/flowers/BuySheet.tsx');
    const FACT = '값과 재고는 저마다 그때그때 달라요';

    expect(verdict).toContain(FACT);
    expect(buySheet).toContain(FACT);
  });

  it('sitemap 에 한 줄이 실려 있다', () => {
    expect(source('src/app/sitemap.ts')).toContain('/bouquet');
  });

  it('갈 곳 없는 길을 세우지 않는다 — 내부 링크가 실재하는 라우트를 가리킨다', () => {
    const routes = new Set(['/', '/recommend', '/flowers', '/groups', '/stories', '/reads']);
    const hrefs = [
      ...PAGE.matchAll(/href="([^"]+)"/g),
      ...code('src/components/bouquet/BouquetStudio.tsx').matchAll(/href="([^"]+)"/g),
    ].map((match) => match[1]);

    expect(hrefs.length).toBeGreaterThan(3);
    for (const href of hrefs) expect(routes.has(href), href).toBe(true);
  });
});
