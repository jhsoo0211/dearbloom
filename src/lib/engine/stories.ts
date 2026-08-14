/**
 * 이야기 선별기 — "지금 이 상황에 맞는 이야기 하나 + 더 읽어 볼 이야기들".
 *
 * 서비스의 본질은 꽃말 한 줄이 아니라 그 꽃에 얽힌 이야기다. 한 꽃에 이야기가 여러 편
 * 쌓이면 "무엇을 먼저 보여 줄까"가 문제가 되는데, 여기서 그 순서를 정한다.
 *
 * 순수 함수다. recommend() 와는 독립이며(추천 파이프라인을 건드리지 않는다),
 * 추천 결과와 이야기를 붙이는 일은 API 레이어가 한다.
 */

import type { Intent, StoryMood, StoryRow } from './types';

/** stories.csv 의 moods 어휘. 값 목록의 단일 소스이며 types.ts 의 StoryMood 와 동기화된다. */
export const STORY_MOODS = [
  'romantic',
  'tragic',
  'funny',
  'mythic',
  'dramatic',
  'healing',
] as const satisfies readonly StoryMood[];

/**
 * 상황(intent) → 그 상황에 어울리는 이야기의 결.
 *
 * 이 상황용으로 태그해 둔 이야기가 없을 때 쓰는 2순위 기준이다.
 * 배열 순서가 곧 우선순위다(apology 면 healing 을 tragic 보다 먼저 본다).
 */
export const MOOD_AFFINITY = {
  apology: ['healing', 'tragic'],
  confession: ['romantic'],
  gratitude: ['healing', 'mythic'],
  celebration: ['funny', 'dramatic'],
  comfort: ['healing'],
  anniversary: ['romantic', 'mythic'],
  just_because: ['funny', 'mythic'],
} as const satisfies Record<Intent, readonly StoryMood[]>;

/** 한 번에 보여 주는 이야기 수(featured 1편 + others 최대 3편). */
export const DEFAULT_STORY_COUNT = 4;

export interface StoryPick {
  /** 먼저 보여 줄 이야기. 그 꽃에 이야기가 하나도 없으면 null. */
  featured: StoryRow | null;
  /** "다른 이야기도 보기" 목록. featured 를 뺀 나머지에서 최대 k-1편. */
  others: StoryRow[];
}

/** 대표 분위기 = moods 의 첫 값. 목록의 다양성은 이 값 하나로 판단한다. */
function primaryMood(story: StoryRow): StoryMood | undefined {
  return story.moods[0];
}

/** 이 상황용으로 명시해 둔 이야기인가. */
function taggedFor(story: StoryRow, intent: Intent): boolean {
  return story.intents !== undefined && story.intents.includes(intent);
}

/** intents 가 비어 있으면 "모든 상황" — 어떤 상황에서도 후보로 남는다. */
function allPurpose(story: StoryRow): boolean {
  return story.intents === undefined || story.intents.length === 0;
}

/**
 * featured 로 올릴 이야기의 인덱스.
 *   ① intents 에 지금 상황이 들어 있는 이야기 (편집자가 직접 붙여 둔 짝)
 *   ② 상황을 가리지 않는 이야기 중 결(mood)이 맞는 것 — MOOD_AFFINITY 순서대로
 *   ③ 그래도 없으면 첫 이야기 (빈손으로 돌려보내지 않는다)
 *
 * ②에서 "다른 상황용으로 태그된 이야기"는 건너뛴다. 편집자가 celebration 이라고
 * 적어 둔 이야기를 결이 비슷하다는 이유로 apology 자리에 올리지 않기 위해서다.
 * 그런 이야기밖에 없으면 ③이 받아 준다.
 */
function pickFeaturedIndex(mine: StoryRow[], intent: Intent): number {
  const tagged = mine.findIndex((story) => taggedFor(story, intent));
  if (tagged !== -1) return tagged;

  for (const mood of MOOD_AFFINITY[intent]) {
    const byMood = mine.findIndex((story) => allPurpose(story) && story.moods.includes(mood));
    if (byMood !== -1) return byMood;
  }

  return 0;
}

/**
 * 같은 결이 연달아 나오지 않게 순서를 다시 짠다(diversity.ts 와 같은 그리디 1패스).
 *
 * diversify() 와 달리 후보를 버리지 않는다. 여기서 걸러 내면 "다른 이야기도 보기"에
 * 이야기가 통째로 사라지므로, 자리만 미루고 limit 까지는 반드시 채운다.
 * seedMood 는 바로 앞에 놓일 featured 의 결이다(others[0] 이 featured 와 겹치지 않게).
 */
function diversifyByMood(
  pool: StoryRow[],
  limit: number,
  seedMood: StoryMood | undefined,
): StoryRow[] {
  const rest = [...pool];
  const ordered: StoryRow[] = [];
  let lastMood = seedMood;

  while (ordered.length < limit && rest.length > 0) {
    let index = rest.findIndex((story) => primaryMood(story) !== lastMood);
    if (index === -1) index = 0; // 남은 이야기가 전부 같은 결 — 원래 순서대로 채운다
    const [next] = rest.splice(index, 1);
    ordered.push(next);
    lastMood = primaryMood(next);
  }

  return ordered;
}

/**
 * 한 꽃의 이야기들에서 상황에 맞는 한 편을 앞세우고 나머지를 뒤에 붙인다.
 *
 * @param flowerId 추천된 꽃의 id
 * @param intent   지금 상황
 * @param stories  이야기 전체(다른 꽃 것이 섞여 있어도 된다 — 여기서 걸러 낸다)
 * @param k        featured 를 포함한 최대 편수. 기본 4편. 0 이하면 아무것도 돌려주지 않는다.
 */
export function pickStories(
  flowerId: string,
  intent: Intent,
  stories: StoryRow[],
  k: number = DEFAULT_STORY_COUNT,
): StoryPick {
  const mine = stories.filter((story) => story.flowerId === flowerId);
  if (mine.length === 0 || k <= 0) return { featured: null, others: [] };

  const featuredIndex = pickFeaturedIndex(mine, intent);
  const featured = mine[featuredIndex];
  const rest = mine.filter((_, index) => index !== featuredIndex);

  return {
    featured,
    others: diversifyByMood(rest, k - 1, primaryMood(featured)),
  };
}
