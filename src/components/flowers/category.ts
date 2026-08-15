/**
 * 카테고리 5종의 **화면 표시값**과 검색 정규화 — 서버·클라이언트 공용 순수 모듈.
 *
 * 색감의 원본은 `landing-data.ts` 의 `CATEGORY_THEMES`(카테고리 → 테마 slug)이고,
 * 실제 CSS 변수 세트는 `globals.css` 의 `[data-flower]` 다섯 벌이다. 여기 있는 것은
 * 그 위에 얹는 두 가지뿐이다 — **점 하나 찍을 색**과 **그 칸이 무슨 색 계열인지 한 줄.**
 *
 * ⚠ 이 화면은 `<html data-flower>` 를 건드리지 않는다(§1.4c v3.3 — 전역 테마는 진입 시 1회).
 *   꽃 31종을 늘어놓는 화면에서 색이 종마다 흔들리면 읽기가 어려워지므로,
 *   `/stories` 와 같이 **기본 테마(흰 튤립·다크 그린) 고정**으로 두고 카테고리는
 *   점·라인 색으로만 드러낸다.
 */

import type { ThemeCategory } from '@/components/landing/landing-data';

/** 화면에 세우는 카테고리 순서(§1.4c v3.2 표 순서). */
export const CATEGORY_ORDER: readonly ThemeCategory[] = [
  'forest',
  'ivory',
  'gold',
  'wine',
  'dusk',
] as const;

/**
 * 카테고리 점·라인 색 = 그 테마의 색면(`--bg-3`) 값 그대로.
 * 텍스트로 쓰지 않는 **면 색**이라 다크 위에서도 §1.4 의 대비 규칙에 걸리지 않는다
 * (어두운 점은 형태가 묻히므로 CSS 가 헤어라인을 둘러 준다 — `/stories` 의 레인 점과 같은 처리).
 */
export const CATEGORY_TONE: Record<ThemeCategory, string> = {
  forest: '#1B2C21',
  ivory: '#F1EADC',
  gold: '#8A672B',
  wine: '#5C2230',
  dusk: '#4A4160',
};

/** 그 칸에 무슨 색 계열이 모이는지(§1.4c v3.2 "배정 규칙(대표색)" 열을 그대로 옮김). */
export const CATEGORY_HINT: Record<ThemeCategory, string> = {
  forest: '흰빛·초록빛 꽃',
  ivory: '크림빛·화이트 꽃',
  gold: '노란빛·주황빛 꽃',
  wine: '붉은빛·분홍빛 꽃',
  dusk: '보랏빛·푸른빛 꽃',
};

/**
 * 검색 정규화 — **질의와 색인이 반드시 같은 함수를 지난다.**
 *
 * 지우는 것: 대소문자 차이 · 공백 · 하이픈 · 마침표 · 어깨점 · 학명의 `×`.
 *   · `baby's breath` → `babysbreath` 로 접혀 `Baby's Breath` 와 만난다
 *   · `iris hollandica` → `irishollandica`, 색인의 `Iris × hollandica` 도 같은 모양이 된다
 * 남기는 것: 한글 음절·자모, 라틴 문자, 숫자. 라틴 확장 문자(`Redouté` 의 é)는
 *   결합 부호를 떨궈 기본 문자로 접는다 — `redoute` 로도 찾게.
 *
 * ⚠ 분해(NFD) 뒤에 **반드시 다시 합친다(NFC).** NFD 는 한글 음절도 자모로 쪼개는데,
 *   그 자모는 U+1100 대역이라 아래 `가-힣`·`ㄱ-ㅎ` 어디에도 안 걸려 한국어가 통째로
 *   지워진다. 결합 부호(U+0300~U+036F)만 떨구고 곧바로 NFC 로 되돌리면 한글은 원래대로
 *   합쳐지고 é 만 e 로 남는다.
 */
export function normalizeQuery(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^0-9a-z가-힣ㄱ-ㅎㅏ-ㅣ]/g, '');
}
