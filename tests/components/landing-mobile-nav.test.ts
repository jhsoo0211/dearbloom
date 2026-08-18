import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * 모바일 내비 메뉴 (§1.6c) — 회귀 가드.
 *
 * 사용자 지적(2026-08-16): 860px 아래에서 `.db-nav-links` 가 통째로 숨어 폰에서는 로고와
 * `추천 시작` 만 남았다. 이야기·도감·편지로 가는 길이 **첫 화면에 하나도 없었다.**
 *
 * ── 여기서 지킬 수 있는 것과 없는 것 ────────────────────────────────────
 * 실제 열림·포커스 이동·잠금은 브라우저가 있어야 보인다(그건 Playwright 가 한다).
 * 이 파일이 막는 것은 **소스에서 사라지는 순간**이다. 이 화면에서 조용히 무너질 수 있는
 * 자리는 다섯이고, 다섯 다 문자열로 잡힌다:
 *   ① 두 `display` 가 갈라지는 것 — 링크는 숨겼는데 버튼은 안 켜지면 다시 막다른 화면이다
 *   ② 내비에 항목을 더하면서 시트를 잊는 것 — 그 항목은 폰에서 영영 닿을 수 없게 된다
 *   ③ 대화상자 규격이 빠지는 것 — `aria-modal` 만 적고 트랩·`inert` 를 잊는 흔한 실패
 *   ④ 스크롤 잠금이 각자 저장·복원으로 되돌아가는 것 — 겹치면 화면이 잠긴 채 남는다
 *   ⑤ `opacity: 0` 이 미디어 쿼리 밖으로 새는 것 — 모션을 끈 사용자에게 빈 목차가 뜬다
 *   ⑥ (2026-08-17) 모바일 상단에 CTA가 다시 들어오는 것 — 히어로 CTA와 겹치며
 *      `워드마크 + CTA + 메뉴`의 밀도 높은 툴바로 돌아간다
 *
 * (`tests/components/type-floor.test.ts` 와 같은 장치다 — 소스에 없으면 화면에도 없다.)
 */

const ROOT = path.resolve(__dirname, '../..');
const LANDING = path.join(ROOT, 'src/components/landing');

/** 줄바꿈은 파일마다 다르다(landing.css 는 CRLF) — 검사는 그것과 무관해야 한다. */
function read(file: string): string {
  return readFileSync(path.join(LANDING, file), 'utf8').replaceAll('\r\n', '\n');
}

const page = read('LandingPage.tsx');
const sheet = read('MobileNavSheet.tsx');
const lock = read('body-scroll-lock.ts');
const css = read('landing.css');

/** `opener` 로 시작하는 블록을 짝이 맞는 닫는 중괄호까지 잘라 낸다. 없으면 던진다. */
function blockAfter(source: string, opener: string): string {
  const start = source.indexOf(opener);
  if (start < 0) throw new Error(`소스에 \`${opener}\` 가 없다`);

  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`\`${opener}\` 블록이 닫히지 않았다`);
}

/**
 * 여는 표식과 닫는 표식 사이.
 *
 * ⚠ TSX 에는 중괄호 세기가 통하지 않는다 — `prefetch={false}` 하나에 깊이가 0으로 돌아가
 *   목록이 첫 줄에서 끊긴다(실제로 그렇게 끊긴 것을 보고 나눴다). 표식으로 자른다.
 */
function between(source: string, open: string, close: string): string {
  const start = source.indexOf(open);
  if (start < 0) throw new Error(`소스에 \`${open}\` 가 없다`);
  const end = source.indexOf(close, start);
  if (end < 0) throw new Error(`\`${open}\` 뒤에 \`${close}\` 가 없다`);
  return source.slice(start, end);
}

/** 데스크톱 내비 링크 줄(`.db-nav-links` 목록)의 목적지들. */
const NAV_LINK_HREFS = Array.from(
  between(page, '<ul className="db-nav-links">', '</ul>').matchAll(/href="([^"]+)"/g),
  (match) => match[1],
);

/** 시트 목차(`SHEET_ITEMS`)의 목적지들. */
const SHEET_HREFS = Array.from(
  between(sheet, 'const SHEET_ITEMS', '] as const;').matchAll(/href: '([^']+)'/g),
  (match) => match[1],
);

/** 시트의 순차 등장을 켜는 reduced-motion 쿼리 블록. */
const MOTION_BLOCK = (() => {
  for (const match of css.matchAll(/@media \(prefers-reduced-motion: no-preference\)/g)) {
    const block = blockAfter(css.slice(match.index), '@media');
    if (block.includes('.db-navsheet-item')) return block;
  }
  throw new Error('시트 등장 연출이 no-preference 쿼리 안에 없다');
})();

describe('§1.6c — 접힌 줄과 그것을 여는 문은 한 몸이다', () => {
  it('860px 쿼리 한 블록이 링크·중복 CTA를 숨기고 메뉴를 켠다', () => {
    const narrow = blockAfter(css, '@media (max-width: 860px)');

    expect(narrow).toMatch(/\.db-nav-links\s*\{\s*display:\s*none;/);
    expect(narrow).toMatch(/\.db-nav-cta\s*\{\s*display:\s*none;/);
    expect(narrow).toMatch(/\.db-nav-menu\s*\{\s*display:\s*inline-flex;/);
  });

  it('861px 위에서는 버튼이 `display:none` 이다 — 안 보이는 탭 정지점을 남기지 않는다', () => {
    expect(blockAfter(css, '.db-nav-menu {')).toMatch(/display:\s*none;/);
  });

  it('시트 닫기 버튼은 §1.6b 아이콘 버튼 그대로다 (원형 44×44 · 1px 보더)', () => {
    /* 시트 안에서는 옆에 낄 알약이 없다 — 모서리에 혼자 서는 아이콘 버튼이라
       원형 규격을 그대로 쓴다. 내비 쪽만 아래 §1.6c-2 로 갈라졌다. */
    const rule = blockAfter(css, '.db-navsheet-x {');
    expect(rule).toMatch(/width:\s*44px;/);
    expect(rule).toMatch(/height:\s*44px;/);
    expect(rule).toMatch(/border-radius:\s*50%;/);
    expect(rule).toMatch(/border:\s*1px solid var\(--ctrl-line\);/);
  });

  it('두 햄버거·닫기 아이콘 모두 스트로크 1.6 이다', () => {
    for (const selector of ['.db-nav-menu svg {', '.db-navsheet-x svg {']) {
      expect(blockAfter(css, selector), selector).toMatch(/stroke-width:\s*1\.6;/);
    }
  });
});

/** §1.6c-2 — A안: 모바일 상단은 브랜드와 탐색만 맡는 조용한 레일이다. */
describe('§1.6c-2 — 모바일 상단은 워드마크 + 메뉴만 남긴다', () => {
  const menuRule = blockAfter(css, '.db-nav-menu {');
  const ctaRule = blockAfter(css, '.db-nav-cta {');
  const narrow = blockAfter(css, '@media (max-width: 860px)');

  it('데스크톱 CTA와 메뉴는 기존 디자인 토큰을 그대로 쓴다', () => {
    expect(menuRule).toMatch(/border-radius:\s*9999px;/);
    expect(ctaRule).toMatch(/border-radius:\s*9999px;/);
    expect(ctaRule).toMatch(/background:\s*var\(--cta-bg\);/);
    expect(menuRule).toMatch(/border:\s*1px solid var\(--ctrl-line\);/);
    expect(menuRule).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('레일은 화면 폭을 쓰고 양 끝에 브랜드와 메뉴를 놓는다', () => {
    expect(narrow).toMatch(/\.db-nav\s*\{[\s\S]*?width:\s*min\([\s\S]*?560px,[\s\S]*?100vw - 24px/);
    expect(narrow).toMatch(/justify-content:\s*space-between;/);
  });

  it('메뉴는 44px 터치 타깃과 보이는 라벨을 유지한다', () => {
    expect(menuRule).toMatch(/min-height:\s*44px;/);
    expect(page).toContain('<span className="db-nav-menu-t">메뉴</span>');
    expect(menuRule).toMatch(/font-size:\s*13\.5px;/);
  });

  it('보이는 라벨이 접근성 이름 안에 있다 (WCAG 2.5.3 Label in Name)', () => {
    const button = page.slice(page.indexOf('className="db-nav-menu"'));
    const label = /aria-label="([^"]+)"/.exec(button)?.[1] ?? '';

    expect(label).toContain('메뉴');
  });

  it('320px에서도 라벨을 접지 않는다 — CTA를 덜어 공간을 확보했다', () => {
    expect(css).not.toMatch(/\.db-nav-menu-t\s*\{\s*display:\s*none;/);
  });

  it('상단 레일과 전면 시트가 노치·홈 인디케이터를 피한다', () => {
    const nav = blockAfter(css, '.db-nav {');
    expect(nav).toContain('env(safe-area-inset-top, 0px)');
    expect(nav).toContain('env(safe-area-inset-left, 0px)');
    expect(nav).toContain('env(safe-area-inset-right, 0px)');
    const sheetInner = blockAfter(css, '.db-navsheet-in {');
    expect(sheetInner).toContain('env(safe-area-inset-top, 0px)');
    expect(sheetInner).toContain('env(safe-area-inset-bottom, 0px)');
    expect(sheetInner).toContain('env(safe-area-inset-left, 0px)');
    expect(sheetInner).toContain('env(safe-area-inset-right, 0px)');
  });

  it('헤더에서 덜어낸 추천 CTA는 히어로와 메뉴 시트에 남는다', () => {
    expect(between(page, '<div className="db-hero-acts"', '</div>')).toContain('href="/recommend"');
    expect(sheet).toMatch(
      /className="db-btn db-btn-primary db-navsheet-cta"[\s\S]*?href="\/recommend"/,
    );
  });
});

describe('§1.6c — 목차가 내비를 하나도 빠뜨리지 않는다', () => {
  it('스캔이 실제로 목적지를 찾는다 (정규식이 낡으면 이 줄이 먼저 깨진다)', () => {
    expect(NAV_LINK_HREFS.length).toBeGreaterThanOrEqual(4);
    // 2026-08-18 에 「읽을거리」(/reads)가 합류해 4 → 5 가 됐다.
    expect(SHEET_HREFS).toHaveLength(5);
  });

  it('`시작하기`(#db-start)가 내비로 돌아오지 않는다 — CTA 와 같은 일이 둘 서 있었다', () => {
    /* 2026-08-17 사용자 지적: 내비의 `시작하기` 앵커와 `추천 시작` CTA 가 같은 일을 하는
       진입 둘로 읽혔다. 앵커를 덜었고, 마무리 절(#db-start 섹션)은 스크롤로만 닿는다. */
    expect(NAV_LINK_HREFS).not.toContain('#db-start');
  });

  it('데스크톱 내비의 콘텐츠 목적지가 전부 시트에 있다', () => {
    expect(NAV_LINK_HREFS).toContain('/flowers');
    expect(NAV_LINK_HREFS).toContain('/letter');
    for (const href of NAV_LINK_HREFS) expect(SHEET_HREFS, href).toContain(href);
  });

  it('`여러 명에게`(/groups)는 시트에도 내비에도 없다 (2026-08-17 사용자 확정)', () => {
    /* 처음에는 시트에 실었지만(#20 은 "첫 화면" 이야기라는 논리) 사용자가 뒤집었다 —
       "추천받기가 있으니까". 여러 명에게 가는 길은 추천 플로우 1번 질문의 `여러 분께`
       갈림길이 맡고, 페이지 자체는 살아 있다. 그 근거가 시트 소스 주석에 남아 있어야
       다음 사람이 다시 넣지 않는다. */
    expect(SHEET_HREFS).not.toContain('/groups');
    expect(NAV_LINK_HREFS).not.toContain('/groups');
    expect(sheet).toContain('2026-08-17 사용자');
  });

  it('주 CTA 는 추천 플로우로 간다', () => {
    expect(sheet).toMatch(
      /className="db-btn db-btn-primary db-navsheet-cta"[\s\S]*?href="\/recommend"/,
    );
  });

  it('번호와 라벨이 링크 안에 있고 행 전체가 56px 이상 터치 타깃이다', () => {
    const rowLink = blockAfter(css, '.db-navsheet-item a {');

    expect(rowLink).toMatch(/display:\s*grid;/);
    expect(rowLink).toMatch(/width:\s*100%;/);
    expect(rowLink).toMatch(/min-height:\s*56px;/);
    expect(sheet).toMatch(/<Link[\s\S]*?<span className="db-navsheet-no"[\s\S]*?db-navsheet-label/);
    expect(sheet).toMatch(/<a href=\{item\.href\}[\s\S]*?<span className="db-navsheet-no"/);
  });
});

describe('§1.6c — 대화상자 규격 (게이트와 같은 문법)', () => {
  it('role·aria-modal·라벨·포커스 착지점이 모두 있다', () => {
    expect(sheet).toContain('role="dialog"');
    expect(sheet).toContain('aria-modal="true"');
    expect(sheet).toContain('aria-label="전체 메뉴"');
    expect(sheet).toContain('tabIndex={-1}');
    expect(sheet).toContain('sheetRef.current?.focus({ preventScroll: true })');
  });

  it('Esc 로 닫고 Tab 은 시트 안에서 순환한다', () => {
    expect(sheet).toContain("event.key === 'Escape'");
    expect(sheet).toContain("event.key !== 'Tab'");
    expect(sheet).toContain('event.shiftKey');
  });

  it('여는 버튼이 상태를 말한다 (`aria-expanded` · `aria-haspopup`)', () => {
    const button = page.slice(page.indexOf('className="db-nav-menu"'));

    expect(button).toContain('aria-expanded={menuOpen}');
    expect(button).toContain('aria-haspopup="dialog"');
    expect(button).toContain('aria-label="전체 메뉴 열기"');
  });

  it('열려 있는 동안 뒤 화면 셋이 전부 `inert` 다', () => {
    // header · main · footer — 하나라도 빠지면 Tab 이 시트 밖으로 샌다.
    expect(page.match(/inert=\{gateOpen \|\| menuOpen \|\| undefined\}/g)).toHaveLength(3);
    expect(page).toContain(
      '<header className="db-site-head" inert={gateOpen || menuOpen || undefined}>',
    );
  });

  it('닫으면 연 버튼으로 포커스가 돌아간다 — 그것도 이펙트에서', () => {
    /* 닫기 핸들러 안에서 곧바로 `focus()` 하면 그 시점의 내비는 아직 `inert` 라
       포커스가 어디에도 앉지 않는다. 커밋 뒤(이펙트)라야 `inert` 가 걷혀 있다. */
    expect(page).toMatch(
      /useEffect\(\(\) => \{[\s\S]*?menuButtonRef\.current\?\.focus\(\{ preventScroll: true \}\);[\s\S]*?\}, \[menuOpen\]\);/,
    );
    expect(page).toContain('const closeMenu = useCallback(() => setMenuOpen(false), []);');
  });

  it('시트는 헤더·내비 **밖**에 그린다 (유리 알약이 전면 시트를 잘라 먹는다)', () => {
    expect(page.indexOf('<MobileNavSheet')).toBeGreaterThan(page.indexOf('</nav>'));
    expect(page.indexOf('<MobileNavSheet')).toBeGreaterThan(page.indexOf('</header>'));
    expect(page.indexOf('<MobileNavSheet')).toBeLessThan(page.indexOf('<main id="db-main"'));
  });

  it('닫혀 있으면 DOM 에 없다 — 하이드레이션에서 견줄 것이 없다', () => {
    expect(sheet).toContain('if (!open) return null;');
  });
});

describe('§1.6c — 스크롤 잠금은 셈하는 한 벌', () => {
  it('게이트와 시트가 같은 잠금을 쓴다', () => {
    expect(page).toContain('lockBodyScroll()');
    expect(sheet).toContain('lockBodyScroll()');
  });

  it('`body.style.overflow` 를 만지는 곳은 그 한 벌뿐이다', () => {
    // 각자 저장·복원하면 겹치는 순간 값이 어긋나 화면이 잠긴 채 남는다.
    expect(page).not.toContain('document.body.style.overflow');
    expect(sheet).not.toContain('document.body.style.overflow');
    expect(lock.match(/document\.body\.style\.overflow/g)).toHaveLength(3);
  });

  it('해제는 멱등이다 (정리 함수가 두 번 불려도 셈이 깨지지 않는다)', () => {
    expect(lock).toContain('if (released) return;');
  });
});

describe('§1.6c — reduced-motion 이면 여는 즉시 다 서 있다', () => {
  it('순차 등장의 `opacity: 0` 이 no-preference 안에만 있다', () => {
    expect(MOTION_BLOCK).toMatch(/opacity:\s*0;/);
    expect(MOTION_BLOCK).toContain('--db-i');

    /* 쿼리 밖에 시트 조각을 숨기는 선언이 하나라도 있으면 모션을 끈 사용자에게 빈 목차가
       뜬다. `.db-navsheet` 로 시작하는 규칙 어디에도 `opacity: 0` 이 없어야 한다. */
    const outside = css.replace(MOTION_BLOCK, '');
    for (const match of outside.matchAll(/\.db-navsheet[\w-]*\s*[,{][^}]*\}/g)) {
      expect(match[0], match[0].slice(0, 40)).not.toMatch(/opacity:\s*0;/);
    }
  });
});
