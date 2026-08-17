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
 *   ⑥ (2026-08-17) 여는 버튼이 **다시 원형 아이콘 버튼으로 돌아가는 것** — 채움 알약
 *      바로 옆의 아웃라인 원은 형태와 무게가 동시에 어긋나 딴 시스템 부품처럼 보였다
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
  it('860px 쿼리 한 블록이 링크를 숨기고 버튼을 켠다 (둘이 갈라지지 않는다)', () => {
    const narrow = blockAfter(css, '@media (max-width: 860px)');

    expect(narrow).toMatch(/\.db-nav-links\s*\{\s*display:\s*none;/);
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

/**
 * §1.6c-2 — 여는 버튼은 CTA 와 **같은 알약**이다 (2026-08-17 사용자 지적: "이질적이다").
 *
 * 원인은 하나가 아니라 둘이 겹친 것이었다: 채움 알약(`추천 시작`) 바로 옆에 아웃라인
 * **원**이 서면 ⑴ 형태(pill↔circle)와 ⑵ 무게(filled↔outline)가 동시에 어긋난다. 둘 중
 * 하나만 달랐다면 위계로 읽혔을 텐데 둘 다 다르니 서로 다른 시스템에서 온 부품처럼 보였다.
 * 게다가 유리 알약(radius 9999) 끝에 놓인 원은 그 알약의 오른쪽 캡을 한 번 더 그려
 * 동심원처럼 겹쳤다(실측 스크린샷에서 확인한 자리).
 *
 * 고친 방식은 **형태를 맞추고 무게로만 위계를 주는 것**이다 — §1.6b 표의 `주 CTA`(채움)와
 * `보조 버튼`(고스트 1px 보더) 짝이 이미 그 규격이라, 새 부품을 들이지 않고 표 안에서
 * 한 칸 옮겨 앉힌 것뿐이다.
 */
describe('§1.6c-2 — 채움 알약 옆에는 아웃라인 알약이 선다 (원이 아니다)', () => {
  const menuRule = blockAfter(css, '.db-nav-menu {');
  const ctaRule = blockAfter(css, '.db-nav-cta {');

  it('여는 버튼과 CTA 가 같은 캡(radius 9999)을 쓴다', () => {
    expect(menuRule).toMatch(/border-radius:\s*9999px;/);
    expect(ctaRule).toMatch(/border-radius:\s*9999px;/);
    // 원으로 되돌아가면 이 줄이 먼저 깨진다.
    expect(menuRule).not.toMatch(/border-radius:\s*50%;/);
  });

  it('위계는 무게로만 준다 — CTA 는 채움, 여는 버튼은 고스트 1px 보더', () => {
    expect(ctaRule).toMatch(/background:\s*var\(--cta-bg\);/);
    expect(menuRule).toMatch(/border:\s*1px solid var\(--ctrl-line\);/);
    // 골드 배경 금지선(§1.4)과 팔레트 밖 색을 들이지 않았는지 — 값 하드코딩이 없어야 한다.
    expect(menuRule).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('터치 타깃 44px 은 그대로다 (라벨이 붙어도 높이는 규격)', () => {
    expect(menuRule).toMatch(/min-height:\s*44px;/);
  });

  it('라벨이 실제로 있다 — 아이콘만 남으면 원이 아니어도 뜻이 흐려진다', () => {
    expect(page).toContain('<span className="db-nav-menu-t">메뉴</span>');
    expect(blockAfter(css, '.db-nav-menu {')).toMatch(/font-size:\s*13\.5px;/);
  });

  it('보이는 라벨이 접근성 이름 안에 있다 (WCAG 2.5.3 Label in Name)', () => {
    const button = page.slice(page.indexOf('className="db-nav-menu"'));
    const label = /aria-label="([^"]+)"/.exec(button)?.[1] ?? '';

    expect(label).toContain('메뉴');
  });

  it('폰 폭에서는 붙어 선 타깃 사이가 8px 이상이다 (ui-ux-pro-max Touch Spacing)', () => {
    /* 데스크톱 6px 은 그대로다 — 거기서는 포인터가 누른다. 이 줄이 지키는 것은
       "손가락 폭에서만 벌린다"는 판단이 통째로 사라지지 않는 것이다. */
    expect(blockAfter(css, '@media (max-width: 860px)')).toMatch(/\.db-nav\s*\{\s*gap:\s*8px;/);
  });

  it('가장 좁은 폭에서는 **라벨만** 접는다 — 버튼째 숨기면 다시 막다른 화면이다', () => {
    const fold = blockAfter(css, '@media (max-width: 344px)');

    expect(fold).toMatch(/\.db-nav-menu-t\s*\{\s*display:\s*none;/);
    // 버튼 자신에게 `display:none` 이 걸리면 그 폭에서는 메뉴로 가는 길이 사라진다.
    expect(fold).not.toMatch(/\.db-nav-menu\s*\{[^}]*display:\s*none/);
  });
});

describe('§1.6c — 목차가 내비를 하나도 빠뜨리지 않는다', () => {
  it('스캔이 실제로 목적지를 찾는다 (정규식이 낡으면 이 줄이 먼저 깨진다)', () => {
    expect(NAV_LINK_HREFS.length).toBeGreaterThanOrEqual(5);
    expect(SHEET_HREFS).toHaveLength(5);
  });

  it('데스크톱 내비의 콘텐츠 목적지가 전부 시트에 있다', () => {
    /* `#db-start`(시작하기)만 빠진다 — 같은 일을 시트에서는 아래 주 CTA(`/recommend`)가
       한다. 랜딩 안쪽 앵커로 내려보내는 대신 곧장 플로우로 보내는 편이 목차의 결론이다. */
    const expected = NAV_LINK_HREFS.filter((href) => href !== '#db-start');

    expect(expected).toContain('/flowers');
    expect(expected).toContain('/letter');
    for (const href of expected) expect(SHEET_HREFS, href).toContain(href);
  });

  it('`여러 명에게`(/groups)가 시트에는 있다 — #20 은 첫 화면 이야기였다', () => {
    expect(SHEET_HREFS).toContain('/groups');
    expect(NAV_LINK_HREFS).not.toContain('/groups');
    // 그 판단의 근거가 코드 옆에 남아 있어야 다음 사람이 다시 지우지 않는다.
    expect(sheet).toContain('#20');
  });

  it('주 CTA 는 추천 플로우로 간다', () => {
    expect(sheet).toMatch(
      /className="db-btn db-btn-primary db-navsheet-cta"[\s\S]*?href="\/recommend"/,
    );
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
    // nav · main · footer — 하나라도 빠지면 Tab 이 시트 밖으로 샌다.
    expect(page.match(/inert=\{gateOpen \|\| menuOpen \|\| undefined\}/g)).toHaveLength(3);
  });

  it('닫으면 연 버튼으로 포커스가 돌아간다 — 그것도 이펙트에서', () => {
    /* 닫기 핸들러 안에서 곧바로 `focus()` 하면 그 시점의 내비는 아직 `inert` 라
       포커스가 어디에도 앉지 않는다. 커밋 뒤(이펙트)라야 `inert` 가 걷혀 있다. */
    expect(page).toMatch(
      /useEffect\(\(\) => \{[\s\S]*?menuButtonRef\.current\?\.focus\(\{ preventScroll: true \}\);[\s\S]*?\}, \[menuOpen\]\);/,
    );
    expect(page).toContain('const closeMenu = useCallback(() => setMenuOpen(false), []);');
  });

  it('시트는 내비 **밖**에 그린다 (유리 알약이 전면 시트를 잘라 먹는다)', () => {
    expect(page.indexOf('<MobileNavSheet')).toBeGreaterThan(page.indexOf('</nav>'));
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
