import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * 글자 크기 하한 12px — 회귀 가드 (§1.6 · 2026-08-16 UI/UX 점검).
 *
 * 2026-08-16 점검에서 **10~11.5px 선언 39건**이 나왔다. 오버라인·배지·카운터처럼 "작아도
 * 되는 자리" 라고 부르던 것들인데, 그 자리들이 모여 화면 곳곳에서 읽히지 않는 줄을 만들고
 * 있었다. 39건을 12px 로 일괄 상향하면서, **다시 내려가지 못하게** 못을 박는다.
 *
 * ── 왜 CSS 를 문자열로 읽나 ───────────────────────────────────────────
 * 실제 렌더 크기를 재려면 브라우저가 필요하고(그건 QA 가 Playwright 로 한다), 여기서
 * 잡고 싶은 것은 **선언이 다시 생기는 순간**이다. 소스에 없으면 화면에도 없다.
 * 대신 정규식이 낡아 아무것도 못 잡는 경우를 대비해 건수부터 먼저 확인한다.
 *
 * ── 예외를 넣는 법 ────────────────────────────────────────────────────
 * `EXCEPTIONS` 에 `파일:셀렉터 근거` 형태로 **이유와 함께** 적는다. 지금은 비어 있고,
 * 비어 있는 것이 정상이다 — 예외가 필요하다고 느껴지면 먼저 "이 글자가 정말 12px 아래여야
 * 하는가" 를 의심하라. §1.6 의 하한은 장식이 아니라 읽을 수 있는지의 문제다.
 */

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'src');
const FLOOR = 12;

/**
 * 하한 아래를 허용하는 자리. `{ file, selectorHint, px, why }` 로 적는다.
 * ⚠ 비어 있는 것이 기본값이다. 채우기 전에 위 머리말을 읽어라.
 */
const EXCEPTIONS: { file: string; px: number; why: string }[] = [];

function cssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...cssFiles(full));
    else if (entry.endsWith('.css')) out.push(full);
  }
  return out;
}

/**
 * 주석을 걷어낸 본문.
 *
 * ⚠ 이걸 안 하면 검사가 거꾸로 선다. 이 저장소의 CSS 주석은 "예전에는 10.5px 이었다 ·
 *   34% 는 2.49:1 이었다" 처럼 **하지 말아야 할 것을 수치로 적어 두는** 성격이라,
 *   원문을 그대로 훑으면 그 기록에 걸려 빨간불이 켜지고 정작 중요한 주석을 지우게 된다.
 */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** `font-size` 선언 하나에서 **가장 작아질 수 있는 px 값**. 못 읽으면 `null`. */
function smallestPx(value: string): number | null {
  const text = value.trim();

  // clamp(최솟값, 유동, 최댓값) — 첫 인자가 하한이다.
  const clamp = /^clamp\(\s*([^,]+),/.exec(text);
  const target = clamp ? clamp[1].trim() : text;

  const px = /^(\d+(?:\.\d+)?)px$/.exec(target);
  if (px) return Number(px[1]);

  // rem 은 루트 16px 기준으로 환산한다(globals.css 가 html 폰트를 바꾸지 않는다).
  const rem = /^(\d+(?:\.\d+)?)rem$/.exec(target);
  if (rem) return Number(rem[1]) * 16;

  // var()·inherit·calc() 등 — 값이 여기 없으므로 이 검사의 대상이 아니다.
  return null;
}

interface Declared {
  file: string;
  line: number;
  raw: string;
  px: number;
}

const declarations: Declared[] = [];
for (const file of cssFiles(SRC)) {
  const rel = path.relative(ROOT, file).replaceAll('\\', '/');
  const body = stripComments(readFileSync(file, 'utf8'));
  body.split('\n').forEach((text, index) => {
    for (const match of text.matchAll(/font-size:\s*([^;{}]+)/g)) {
      const px = smallestPx(match[1]);
      if (px !== null) declarations.push({ file: rel, line: index + 1, raw: match[1].trim(), px });
    }
  });
}

describe('글자 크기 하한 (§1.6)', () => {
  it('스캔이 실제로 선언을 찾는다 — 정규식이 낡으면 이 줄이 먼저 깨진다', () => {
    // 2026-08-16 기준 200건대. 절반 아래로 떨어지면 훑는 방식 자체가 고장 난 것이다.
    expect(declarations.length).toBeGreaterThan(100);
    expect(declarations.some((d) => d.file.includes('landing.css'))).toBe(true);
    expect(declarations.some((d) => d.file.includes('flowers.module.css'))).toBe(true);
  });

  it('12px 미만 선언이 없다', () => {
    const allowed = new Set(EXCEPTIONS.map((e) => `${e.file}@${e.px}`));
    const violations = declarations
      .filter((d) => d.px < FLOOR)
      .filter((d) => !allowed.has(`${d.file}@${d.px}`))
      .map((d) => `${d.file}:${d.line} — font-size: ${d.raw}`);

    expect(violations).toEqual([]);
  });

  it('clamp 의 하한도 12px 위다 — 좁은 화면에서만 작아지는 것도 작은 것이다', () => {
    const clamped = declarations.filter((d) => d.raw.startsWith('clamp('));
    expect(clamped.length).toBeGreaterThan(0);
    expect(clamped.filter((d) => d.px < FLOOR)).toEqual([]);
  });
});
