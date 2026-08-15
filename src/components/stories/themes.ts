/**
 * 꽃말 테마 8종 — `/stories` 필터 바의 `꽃말` 칩 줄.
 *
 * 계열(색) 칩이 "어떤 색의 꽃인가" 로 레인을 접는다면, 이 줄은 **"어떤 마음의 꽃인가"** 로
 * 접는다. 아카이브에 오는 사람이 실제로 품는 질문("고백에 쓰는 꽃이 뭐가 있지")은 색이
 * 아니라 마음 쪽이라, 색 하나만으로는 그 질문에 닿지 못했다.
 *
 * ── 값은 어디서 오나 ────────────────────────────────────────────────
 * 테마는 새로 지어낸 분류가 아니라 `content/meanings.csv` 의 **꽃말 문장(meaning_ko)** 을
 * 훑어 붙인다. 꽃 한 종에 꽃말이 여러 줄이면 그 줄들이 걸린 테마를 **모두** 갖는다
 * (튤립은 "새로운 시작" 과 "순수한 마음" 을 동시에 가진 꽃이다 — 하나로 자르면 거짓말이 된다).
 *
 * ⚠ 스캔은 **서버에서 한 번**만 돈다(`app/stories/page.tsx`). 화면에는 그 결과
 *   `꽃 id → 테마 키` 만 내려간다. 칩을 누를 때마다 브라우저에서 정규식 200줄을 돌리면
 *   느려지기도 하지만, 무엇보다 **같은 꽃이 화면마다 다른 테마를 갖게 될 여지**가 생긴다.
 *
 * ⚠ 키워드에 정규식 메타문자를 넣지 마라(그대로 패턴에 박힌다). 지금은 한국어 낱말뿐이고,
 *   낱말 안의 공백만 `\s*` 로 바꿔 "티 없는" 과 "티없는" 을 함께 잡는다.
 *
 * 순수 모듈이다 — 엔진·카탈로그 로더를 import 하지 않는다(`types.ts`·`meta.ts` 와 같은 규칙).
 */

import type { ArchiveFilterChip } from './types';

/** 테마 키. 화면에는 나가지 않는 내부 어휘다(라벨만 나간다). */
export type StoryThemeKey =
  | 'love'
  | 'beginning'
  | 'hope'
  | 'gratitude'
  | 'innocence'
  | 'comfort'
  | 'memory'
  | 'fortune';

export interface StoryTheme {
  key: StoryThemeKey;
  /** 칩에 나가는 이름. 계열 칩(`숲빛`…)과 나란히 서므로 짧게 — 44px 칩 한 칸 안이다. */
  label: string;
  /**
   * 꽃말 문장에서 이 말들이 보이면 그 테마다.
   * 어간까지만 적는다 — `그리움` 이 아니라 `그리`… 처럼 지나치게 짧으면 엉뚱한 낱말이
   * 걸리므로(그리다·그리스), 낱말 전체를 적되 어미는 붙이지 않는다.
   */
  keywords: readonly string[];
}

/** 순서가 곧 칩 순서다. 자주 찾을 마음부터. */
export const STORY_THEMES: readonly StoryTheme[] = [
  { key: 'love', label: '사랑·설렘', keywords: ['사랑', '애정', '연모', '열정', '고백', '설렘'] },
  { key: 'beginning', label: '새로운 시작', keywords: ['시작', '출발', '재생', '갱생'] },
  { key: 'hope', label: '희망·응원', keywords: ['희망', '용기', '응원', '기대', '믿음'] },
  { key: 'gratitude', label: '감사·존경', keywords: ['감사', '존경', '경의', '은혜'] },
  { key: 'innocence', label: '순수한 마음', keywords: ['순수', '순진', '순결', '천진', '티 없'] },
  { key: 'comfort', label: '위로·치유', keywords: ['위로', '치유', '평안', '안식', '휴식'] },
  { key: 'memory', label: '그리움·기억', keywords: ['그리움', '이별', '추억', '기억', '애도'] },
  { key: 'fortune', label: '행운·축복', keywords: ['행운', '축복', '번영', '영광', '부귀'] },
];

/**
 * 테마별 매칭 패턴. 모듈이 뜰 때 한 번만 컴파일한다.
 * `g` 플래그를 쓰지 않는다 — `lastIndex` 가 남아 같은 정규식이 번갈아 다른 답을 내놓는다.
 */
const PATTERNS: ReadonlyMap<StoryThemeKey, RegExp> = new Map(
  STORY_THEMES.map((theme) => [
    theme.key,
    new RegExp(theme.keywords.map((word) => word.replace(/ /g, '\\s*')).join('|')),
  ]),
);

/** 키 → 이름. 모르는 키는 빈 문자열이다(영문 slug 노출 금지 — `categories.ts` 와 같은 규칙). */
export function themeLabel(key: string): string {
  return STORY_THEMES.find((theme) => theme.key === key)?.label ?? '';
}

/**
 * 꽃말 한 줄이 걸리는 테마 전부. 순서는 항상 `STORY_THEMES` 순서다
 * (입력 문장의 낱말 순서에 흔들리면 같은 꽃이 화면마다 다른 순서를 갖는다).
 */
export function themesOfMeaning(meaningKo: string): StoryThemeKey[] {
  if (!meaningKo) return [];
  const hits: StoryThemeKey[] = [];
  for (const theme of STORY_THEMES) {
    if (PATTERNS.get(theme.key)?.test(meaningKo)) hits.push(theme.key);
  }
  return hits;
}

/** 꽃 id → 그 꽃이 가진 테마. 테마가 하나도 없는 꽃은 키 자체가 없다. */
export type FlowerThemeMap = Record<string, StoryThemeKey[]>;

/** `meanings.csv` 한 행에서 이 모듈이 보는 것 — 꽃과 꽃말 문장뿐이다. */
export interface ThemeMeaningRow {
  flowerId: string;
  meaningKo: string;
}

/**
 * 꽃말 표 전체 → 꽃 id → 테마 집합.
 *
 * 같은 테마가 여러 꽃말에서 걸려도 한 번만 담고, 담기는 순서는 `STORY_THEMES` 순서다.
 */
export function buildFlowerThemes(rows: readonly ThemeMeaningRow[]): FlowerThemeMap {
  const found = new Map<string, Set<StoryThemeKey>>();

  for (const row of rows) {
    const hits = themesOfMeaning(row.meaningKo ?? '');
    if (hits.length === 0) continue;
    const bucket = found.get(row.flowerId) ?? new Set<StoryThemeKey>();
    for (const hit of hits) bucket.add(hit);
    found.set(row.flowerId, bucket);
  }

  const map: FlowerThemeMap = {};
  for (const [flowerId, bucket] of found) {
    map[flowerId] = STORY_THEMES.filter((theme) => bucket.has(theme.key)).map((theme) => theme.key);
  }
  return map;
}

/** 칩 숫자를 세는 데 필요한 최소한 — 레인 하나(꽃 하나)와 그 편수. */
export interface ThemeCountable {
  flowerId: string;
  storyCount: number;
}

/**
 * `꽃말` 칩 줄 — 매칭된 꽃이 한 종도 없는 테마는 **세우지 않는다**.
 *
 * 숫자는 계열 칩과 같은 단위(편수)다. 한 화면에서 어떤 칩은 종 수, 어떤 칩은 편수를
 * 달고 있으면 같은 자리의 숫자를 두 가지로 읽어야 한다.
 */
export function buildThemeChips(
  lanes: readonly ThemeCountable[],
  flowerThemes: FlowerThemeMap,
): ArchiveFilterChip[] {
  return STORY_THEMES.map((theme) => ({
    key: theme.key as string,
    label: theme.label,
    count: lanes
      .filter((lane) => (flowerThemes[lane.flowerId] ?? []).includes(theme.key))
      .reduce((sum, lane) => sum + lane.storyCount, 0),
  })).filter((chip) => chip.count > 0);
}
