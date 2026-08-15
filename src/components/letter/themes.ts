/**
 * 편지 색감 5계열의 **화면 표기** — 어휘도 라벨도 새로 짓지 않는다.
 *
 * 값(키)은 `@/lib/letters/types` 의 `LETTER_THEMES`, 한국어 표기는 `/stories`·도감이
 * 쓰는 `STORY_CATEGORIES`(숲빛·상아빛·금빛·와인빛·보랏빛) 그대로다. 같은 계열이 화면마다
 * 다른 이름을 갖는 일을 막는 자리다(`components/flowers/data.ts` 머리말과 같은 규칙).
 *
 * 순수 데이터라 클라이언트 컴포넌트가 그대로 import 한다.
 */

import { STORY_CATEGORIES } from '@/components/stories/categories';
import { LETTER_THEMES } from '@/lib/letters/types';
import type { LetterThemeOption } from './types';

/** 칩 순서 = §1.4c 표 순서. 사전에 없는 키가 생기면 키를 그대로 세우지 않고 비워 둔다. */
export const LETTER_THEME_OPTIONS: readonly LetterThemeOption[] = LETTER_THEMES.map((key) => {
  const category = STORY_CATEGORIES.find((row) => row.key === key);
  return { key, label: category?.label ?? '', hint: category?.hint ?? '' };
});

export function letterThemeLabel(key: string): string {
  return LETTER_THEME_OPTIONS.find((option) => option.key === key)?.label ?? '';
}
