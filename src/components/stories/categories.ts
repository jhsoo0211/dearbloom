/**
 * 아카이브의 꽃 계열 5종 — 필터 칩과 `꽃 고르기` 시트의 묶음 머리말.
 *
 * 어휘의 원본은 design-spec §1.4c v3.2 의 **테마 카테고리 5종**(forest·ivory·gold·wine·dusk)이고,
 * 꽃 → 카테고리 배정은 `src/components/landing/landing-data.ts` 의 `categoryOf()` 가 갖는다.
 * 이 파일은 **화면에 나가는 한국어 표기만** 들고 있다 —
 * 클라이언트가 landing-data(엔진·zod 의존)를 import 하지 않게 하려는 경계이기도 하다
 * (`types.ts` 가 지키는 것과 같은 규칙).
 *
 * ── 라벨을 이렇게 정한 이유 ──────────────────────────────────────────
 * §1.4c 의 이름(`나이트 보태니컬`·`아이보리 스튜디오`·`잉크 앤 골드`·`이브닝 와인`·`딥 라벤더`)은
 * **테마 이름**이라 44px 칩에 넣기엔 길고, 랜딩에서 "색감" 을 소개할 때 쓰는 말이다.
 * 여기서는 31줄을 다섯으로 접는 **필터**라, 누르기 전에 무엇이 들어 있는지 한눈에 읽혀야 한다.
 * 그래서 카테고리의 성격(=배정 기준인 대표색)을 그대로 말하는 한 단어로 줄이고,
 * 다섯을 `-빛` 으로 맞춰 **한 가족으로 보이게** 했다 — 길이가 들쭉날쭉하면 칩 줄이 흔들린다.
 */

/** 카테고리 키. 값은 §1.4c·landing-data 의 `ThemeCategory` 와 같은 문자열이어야 한다. */
export type StoryCategoryKey = 'forest' | 'ivory' | 'gold' | 'wine' | 'dusk';

export interface StoryCategory {
  key: StoryCategoryKey;
  /** 칩·묶음 머리말에 나가는 이름. */
  label: string;
  /** 그 계열이 무엇인지 한 줄 — 시트의 묶음 머리말에만 붙는다(칩은 이름만). */
  hint: string;
}

/** 순서가 곧 칩 순서이자 시트의 묶음 순서다(§1.4c 표 순서 그대로). */
export const STORY_CATEGORIES: readonly StoryCategory[] = [
  { key: 'forest', label: '숲빛', hint: '흰 꽃과 초록 — 밤의 숲 색감' },
  { key: 'ivory', label: '상아빛', hint: '크림·상아 — 밝은 스튜디오 색감' },
  { key: 'gold', label: '금빛', hint: '노랑·주황 — 잉크 위의 금빛' },
  { key: 'wine', label: '와인빛', hint: '빨강·분홍 — 깊은 와인 색감' },
  { key: 'dusk', label: '보랏빛', hint: '보라·파랑 — 저녁의 라벤더 색감' },
];

/** 키 → 이름. 모르는 키는 키 자체를 돌려주지 않고 빈 문자열이다(영문 slug 노출 금지). */
export function storyCategoryLabel(key: string): string {
  return STORY_CATEGORIES.find((category) => category.key === key)?.label ?? '';
}
