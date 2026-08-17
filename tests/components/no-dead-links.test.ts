import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * 갈 곳 없는 링크와, 있지도 않은 제휴 — 화면 전체 회귀 가드.
 *
 * 사용자 신고(2026-08-17): "꽃집 연결되는 링크가 실제로 안 넘어간다."
 * 결과 화면(`ResultView.tsx`)의 CTA 두 줄이 `href="#"` 였다. 파트너 페이지는 이미
 * 이 규범대로 고쳐졌는데(접근성 리뷰 P2-11) 결과 화면만 옛 상태로 남아 있었다 —
 * **한 화면에서 고친 규범이 다른 화면에서 살아남은 것**이 이 버그의 진짜 모습이다.
 * 그래서 `tests/partners/curation.test.ts` 처럼 한 파일만 보지 않고 `src` 전수로 본다.
 *
 * 여기서 막는 것은 둘이다:
 *   ① `href="#"` — 낭독기에는 멀쩡한 링크로 읽히고, 눌러도 페이지 맨 위로 튄다
 *   ② 화면에 나가는 `제휴 링크` · `제휴 꽃집` — 우리는 어느 곳과도 제휴 관계가 아니다
 *
 * ── 왜 주석을 걷어내고 보나 ──────────────────────────────────────────
 * 이 저장소의 주석은 "예전에 `href="#"` 였고 `제휴 꽃집 안내` 로 되돌리지 마라" 처럼
 * **하지 말아야 할 것을 이름으로 적어 두는** 성격이다. 원문을 그대로 훑으면 그 경고문에
 * 걸려 빨간불이 켜지고, 그걸 끄려고 정작 남겨야 할 주석을 지우게 된다.
 * 그래서 주석 자리를 **같은 길이의 공백으로 덮는다** — 줄 번호가 어긋나지 않아야
 * 위반을 `파일:줄` 로 짚어 줄 수 있다.
 */

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'src');

/** `src` 아래 `.tsx` 전부. 새 화면이 늘면 검사 대상도 저절로 늘어난다. */
function collectTsx(dir: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) found.push(...collectTsx(full));
    else if (entry.name.endsWith('.tsx')) found.push(full);
  }

  return found.sort();
}

/**
 * 주석을 지우는 대신 **공백으로 덮는다.** 줄 수와 열 위치가 그대로라 위반 자리를
 * 원문 줄 번호로 되짚을 수 있다(그냥 지우면 줄이 밀려 엉뚱한 줄을 가리킨다).
 */
function blankComments(source: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, ' ');

  return source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank) // JSX 주석
    .replace(/\/\*[\s\S]*?\*\//g, blank) // 블록 주석
    .replace(/(?<!:)\/\/[^\n]*/g, blank); // 줄 주석 — `https://` 의 `//` 는 건드리지 않는다
}

interface Screen {
  /** 저장소 기준 상대 경로 — 실패 메시지에 그대로 찍는다. */
  rel: string;
  /** 주석을 공백으로 덮은 본문. 줄 번호는 원문과 같다. */
  code: string;
}

const SCREENS: Screen[] = collectTsx(SRC).map((file) => ({
  rel: path.relative(ROOT, file).replaceAll('\\', '/'),
  code: blankComments(readFileSync(file, 'utf8').replaceAll('\r\n', '\n')),
}));

/** 화면 본문에서 찾은 자리를 `파일:줄  본문` 으로 적어 낸다. */
function findAll(needle: RegExp): string[] {
  const hits: string[] = [];

  for (const screen of SCREENS) {
    screen.code.split('\n').forEach((line, index) => {
      if (needle.test(line)) hits.push(`${screen.rel}:${index + 1}  ${line.trim()}`);
    });
  }

  return hits;
}

function screenOf(rel: string): string {
  const found = SCREENS.find((screen) => screen.rel === rel);
  if (!found) throw new Error(`${rel} 를 찾지 못했다 — 파일이 옮겨졌는지 보라`);

  return found.code;
}

const RESULT_VIEW = screenOf('src/components/flow/ResultView.tsx');
const PARTNERS = screenOf('src/app/partners/page.tsx');

describe('전수 스캔이 실제로 돌고 있다', () => {
  it('`src` 아래 화면을 충분히 모았다', () => {
    // 0건이면 아래 검사가 전부 공허하게 통과한다. 그 함정을 여기서 막는다.
    expect(SCREENS.length).toBeGreaterThanOrEqual(30);
  });

  it('주석만 덮였고 화면 문자열은 살아 있다', () => {
    // 덮기가 과하면(예: 문자열까지 먹으면) 역시 공허한 초록불이 된다.
    expect(RESULT_VIEW).toContain('우리가 찾아본 곳들');
    expect(PARTNERS).toContain('아직 제휴 관계는 아니에요');
  });
});

describe('아직 없는 길은 링크로 만들지 않는다 (접근성 리뷰 P2-11)', () => {
  it('화면 어디에도 `href="#"` 가 없다', () => {
    /* 갈 곳이 없으면 잠긴 버튼 + 준비 중 한 줄로 둔다
       (`GroupPlanner.tsx` · `app/partners/page.tsx` 푸터가 그 본보기다). */
    expect(findAll(/href=["']#["']/)).toEqual([]);
  });
});

describe('있지도 않은 제휴를 화면에 적지 않는다', () => {
  it('`제휴 링크` 라는 말이 화면에 없다', () => {
    // 예전 고지 "구매 링크는 제휴 링크로 연결돼요" — 제휴 링크는 하나도 없었다.
    expect(findAll(/제휴 링크/)).toEqual([]);
  });

  it('`제휴 꽃집` 이라는 말이 화면에 없다', () => {
    // 소개하는 곳들은 우리가 찾아본 곳이지, 우리와 이어진 곳이 아니다.
    expect(findAll(/제휴 꽃집/)).toEqual([]);
  });
});

describe('결과 화면의 마지막 한 걸음 (2026-08-17 사용자 신고)', () => {
  /**
   * `.aff` 블록(「이 꽃 어디서 사지」 세 줄)의 목적지들.
   *
   * 여는 표식과 닫는 표식으로 자른다 — TSX 는 중괄호 세기가 통하지 않는다
   * (`landing-mobile-nav.test.ts` 가 같은 이유로 같은 방법을 쓴다).
   */
  const AFF = (() => {
    const open = 'className={styles.aff}';
    const start = RESULT_VIEW.indexOf(open);
    if (start < 0) throw new Error('ResultView 에 `.aff` 블록이 없다');
    const end = RESULT_VIEW.indexOf('</div>', start);
    if (end < 0) throw new Error('`.aff` 블록이 닫히지 않았다');

    return RESULT_VIEW.slice(start, end);
  })();

  it('세 줄 다 목적지를 갖고 있다 (스캔이 헛돌지 않는다)', () => {
    expect(AFF.match(/href=/g)).toHaveLength(3);
  });

  it('어느 줄도 `#` 으로 가지 않는다 — 절대 URL 아니면 내부 경로다', () => {
    /* 신고의 본체가 이것이다. `href="#"` 는 눌러도 페이지 맨 위로 튄다.
       목적지는 두 모양으로 적힌다: 따옴표 문자열, 그리고 상수로 시작하는 템플릿.
       템플릿은 그 **상수 선언까지 따라가** 절대 URL 인지 본다. */
    const literals = [...AFF.matchAll(/href="([^"]*)"/g)].map((match) => match[1]);
    const templated = [...AFF.matchAll(/href=\{`\$\{(\w+)\}/g)].map((match) => match[1]);

    expect(literals.length + templated.length).toBe(3);

    for (const href of literals) {
      expect(href, href).not.toBe('#');
      expect(href, href).toMatch(/^\//); // 우리 화면은 내부 경로다
    }

    for (const name of templated) {
      const declared = new RegExp(`const ${name} = '([^']+)'`).exec(RESULT_VIEW)?.[1];

      expect(declared, `${name} 선언을 찾지 못했다`).toBeTruthy();
      expect(declared, name).toMatch(/^https:\/\//);
    }
  });

  it('우리 화면으로 가는 줄이 파트너 페이지의 실재하는 앵커를 가리킨다', () => {
    // 앵커가 없으면 링크는 넘어가되 엉뚱한 곳(맨 위)에 선다 — 신고와 같은 증상이다.
    expect(AFF).toMatch(/<Link\s+href="\/partners#florists"\s+prefetch=\{false\}>/);
    expect(PARTNERS).toContain('id="florists"');
  });

  it('바깥으로 나가는 줄은 새 창이라고 미리 알린다 (P1-6)', () => {
    const external = [...AFF.matchAll(/target="_blank"/g)];
    expect(external).toHaveLength(2);

    for (const match of external) {
      const tail = AFF.slice(match.index, match.index + 400);
      expect(tail).toContain('rel="noreferrer"');
      expect(tail).toContain('(새 창)');
    }
  });

  it('꽃 이름을 넘길 때는 반드시 인코딩한다', () => {
    // 이름에 공백이 들어간다(`장미 꽃배달`). 날것으로 붙이면 검색어가 잘린다.
    expect(AFF).toContain('encodeURIComponent');
  });

  it('지도 검색어에 꽃 이름을 붙이지 않는다', () => {
    /* 지도는 **가게 이름**을 찾는다. `장미 꽃집` 은 수백 km 밖 「장미꽃집」을 끌어오면서
       그 가게에 장미가 있는 것처럼 읽힌다(2026-08-17 실측, partners-research.md §5). */
    expect(AFF).toContain("encodeURIComponent('꽃집')");
  });

  it('주선하지 않는 배달을 다시 내걸지 않는다', () => {
    /* 삭제한 둘째 CTA(`내일 도착 꽃 배달 알아보기`) — 우리에게는 배달 수단이 없다.
       지금 있는 `우체국 꽃배달` 은 **우체국이 자기 서비스로** 배달하는 것을 가리킬 뿐이다. */
    expect(RESULT_VIEW).not.toContain('내일 도착');
  });

  it('재고를 약속하지 않는다 — 못 찾았을 때의 다음 걸음이 링크 옆에 있다', () => {
    // 이 줄을 지우면 위 세 링크가 "여기 있어요"라는 약속으로 읽힌다.
    expect(RESULT_VIEW).toContain('꽃은 철 따라 들고 나요');
  });
});

describe('두 화면이 제휴에 대해 같은 말을 한다', () => {
  /**
   * 파트너 페이지의 `NO_AFFILIATION` 과 결과 화면의 고지는 **같은 사실**을 말해야 한다.
   * 한쪽만 고치면 사용자는 어느 쪽을 믿어야 할지 알 수 없다.
   *
   * (상수를 공유 모듈로 빼지 않은 이유: `tests/partners/curation.test.ts` 가
   *  `page.tsx` **소스에** 이 문장이 적혀 있는지를 본다. import 로 바꾸면 그 검사가
   *  빈 페이지를 통과시키게 된다. 그래서 문장은 각 화면에 두고, 어긋남은 여기서 잡는다.)
   */
  const FACT = '아직 제휴 관계는 아니에요';
  const TAIL = '좋은 곳을 먼저 알려 드리는 거예요.';

  it('둘 다 "아직 제휴 관계는 아니에요" 라고 적는다', () => {
    expect(RESULT_VIEW).toContain(FACT);
    expect(PARTNERS).toContain(FACT);
  });

  it('그다음 한마디까지 같다 — 한쪽만 다정해지지 않는다', () => {
    expect(RESULT_VIEW).toContain(TAIL);
    expect(PARTNERS).toContain(TAIL);
  });
});
