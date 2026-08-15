import { describe, expect, it } from 'vitest';
import * as engine from '@/lib/engine';
import {
  DEFAULT_STORY_COUNT,
  MOOD_AFFINITY,
  STORY_MOODS,
  pickStories,
} from '@/lib/engine/stories';
import { INTENTS } from '@/lib/engine/normalize';
import type { StoryMood, StoryRow } from '@/lib/engine/types';

/**
 * 선별 테스트용 인라인 이야기.
 * 실제 content/stories.csv 와는 독립이며(파일을 읽지 않는다), 선별 규칙 4단계를
 * 각각 갈라 볼 수 있는 최소한만 담는다. intents 를 비운 행이 "모든 상황" 쪽이다.
 */
function story(
  storyId: string,
  flowerId: string,
  moods: StoryMood[],
  overrides: Partial<StoryRow> = {},
): StoryRow {
  return {
    storyId,
    flowerId,
    title: `${storyId} 제목`,
    storyKo: `${storyId} 본문입니다.`,
    sourceUrl: `https://example.com/${storyId}`,
    confidenceLevel: 'repeated',
    moods,
    ...overrides,
  };
}

function ids(stories: StoryRow[]): string[] {
  return stories.map((s) => s.storyId);
}

function moodOrder(stories: StoryRow[]): Array<StoryMood | undefined> {
  return stories.map((s) => s.moods[0]);
}

/* ------------------------------------------------------------------ *
 * 1. featured 를 고르는 순서
 * ------------------------------------------------------------------ */

describe('pickStories — featured 선별', () => {
  it('intents 에 지금 상황이 있으면 결이 더 맞는 이야기보다 먼저 온다', () => {
    const stories = [
      // 결(healing)만 보면 apology 1순위지만 상황 태그가 없다.
      story('mood-only', 'rose-red', ['healing']),
      // 편집자가 apology 라고 직접 붙여 둔 이야기.
      story('intent-tagged', 'rose-red', ['dramatic'], { intents: ['apology'] }),
    ];

    const { featured } = pickStories('rose-red', 'apology', stories);
    expect(featured?.storyId).toBe('intent-tagged');
  });

  it('상황 태그가 없으면 mood 친화로 고른다 (apology → healing)', () => {
    const stories = [
      story('first', 'rose-red', ['funny']),
      story('healing-one', 'rose-red', ['healing']),
      story('tragic-one', 'rose-red', ['tragic']),
    ];

    const { featured } = pickStories('rose-red', 'apology', stories);
    // 목록 첫 행(funny)이 아니라 MOOD_AFFINITY.apology 의 1순위(healing)를 집는다.
    expect(featured?.storyId).toBe('healing-one');

    // 2순위(tragic)는 1순위가 없을 때만 올라온다.
    const withoutHealing = stories.filter((s) => s.storyId !== 'healing-one');
    expect(pickStories('rose-red', 'apology', withoutHealing).featured?.storyId).toBe('tragic-one');
  });

  it('다른 상황용으로 태그된 이야기는 결이 맞아도 2순위에서 건너뛴다', () => {
    const stories = [
      // healing 이지만 celebration 전용이라고 적혀 있다.
      story('for-celebration', 'rose-red', ['healing'], { intents: ['celebration'] }),
      story('all-purpose', 'rose-red', ['tragic']),
    ];

    // apology 친화는 healing → tragic 순이지만, 전용 태그가 붙은 쪽은 건너뛴다.
    expect(pickStories('rose-red', 'apology', stories).featured?.storyId).toBe('all-purpose');
  });

  it('상황도 결도 안 맞으면 첫 이야기를 그대로 내보낸다', () => {
    const stories = [
      story('first', 'rose-red', ['dramatic'], { intents: ['celebration'] }),
      story('second', 'rose-red', ['funny'], { intents: ['celebration'] }),
    ];

    // confession 친화는 romantic 뿐 — 맞는 게 없어도 빈손으로 돌려보내지 않는다.
    const { featured, others } = pickStories('rose-red', 'confession', stories);
    expect(featured?.storyId).toBe('first');
    expect(ids(others)).toEqual(['second']);
  });

  it('그 꽃에 이야기가 없으면 featured 는 null 이고 others 도 비어 있다', () => {
    const stories = [story('rose-1', 'rose-red', ['romantic'])];

    const picked = pickStories('gerbera', 'confession', stories);
    expect(picked.featured).toBeNull();
    expect(picked.others).toEqual([]);

    // 이야기 자체가 하나도 없을 때도 같다.
    expect(pickStories('rose-red', 'confession', [])).toEqual({ featured: null, others: [] });
  });

  it('다른 꽃의 이야기는 섞여 있어도 걸러진다', () => {
    const stories = [
      story('tulip-1', 'tulip-white', ['funny']),
      story('rose-1', 'rose-red', ['romantic']),
      story('tulip-2', 'tulip-white', ['dramatic']),
    ];

    const { featured, others } = pickStories('tulip-white', 'celebration', stories);
    expect(featured?.storyId).toBe('tulip-1');
    expect(ids(others)).toEqual(['tulip-2']);
  });
});

/* ------------------------------------------------------------------ *
 * 2. others — 다양성과 편수
 * ------------------------------------------------------------------ */

describe('pickStories — others 목록', () => {
  it('같은 결이 연달아 나오지 않게 순서를 다시 짠다', () => {
    const stories = [
      story('romantic-1', 'rose-red', ['romantic']), // featured (confession)
      story('mythic-1', 'rose-red', ['mythic']),
      story('mythic-2', 'rose-red', ['mythic']),
      story('funny-1', 'rose-red', ['funny']),
      story('tragic-1', 'rose-red', ['tragic']),
    ];

    const { featured, others } = pickStories('rose-red', 'confession', stories, 5);
    expect(featured?.storyId).toBe('romantic-1');

    // 원래 순서라면 mythic 이 두 번 이어지지만, 사이에 다른 결이 끼어든다.
    expect(ids(others)).toEqual(['mythic-1', 'funny-1', 'mythic-2', 'tragic-1']);

    const moods = [featured?.moods[0], ...moodOrder(others)];
    for (let i = 1; i < moods.length; i += 1) {
      expect(moods[i]).not.toBe(moods[i - 1]);
    }
  });

  it('결이 전부 같아도 이야기를 버리지 않는다', () => {
    const stories = [
      story('a', 'rose-red', ['mythic']),
      story('b', 'rose-red', ['mythic']),
      story('c', 'rose-red', ['mythic']),
    ];

    const { featured, others } = pickStories('rose-red', 'just_because', stories);
    expect(featured?.storyId).toBe('a');
    expect(ids(others)).toEqual(['b', 'c']);
  });

  it('others[0] 은 featured 와 결이 겹치지 않게 밀린다', () => {
    const stories = [
      story('healing-1', 'rose-red', ['healing']), // featured (comfort)
      story('healing-2', 'rose-red', ['healing']),
      story('funny-1', 'rose-red', ['funny']),
    ];

    const { featured, others } = pickStories('rose-red', 'comfort', stories);
    expect(featured?.storyId).toBe('healing-1');
    expect(ids(others)).toEqual(['funny-1', 'healing-2']);
  });

  it('k 는 featured 를 포함한 총 편수다 (기본 4편)', () => {
    const stories = [
      story('a', 'rose-red', ['romantic']),
      story('b', 'rose-red', ['mythic']),
      story('c', 'rose-red', ['funny']),
      story('d', 'rose-red', ['tragic']),
      story('e', 'rose-red', ['dramatic']),
      story('f', 'rose-red', ['healing']),
    ];

    const byDefault = pickStories('rose-red', 'confession', stories);
    expect(byDefault.others).toHaveLength(DEFAULT_STORY_COUNT - 1);
    expect(DEFAULT_STORY_COUNT).toBe(4);

    expect(pickStories('rose-red', 'confession', stories, 2).others).toHaveLength(1);

    // k=1 이면 featured 만 남는다.
    const single = pickStories('rose-red', 'confession', stories, 1);
    expect(single.featured?.storyId).toBe('a');
    expect(single.others).toEqual([]);

    // k 가 이야기 수보다 크면 있는 만큼만.
    expect(pickStories('rose-red', 'confession', stories, 99).others).toHaveLength(5);

    // 0 이하는 아무것도 돌려주지 않는다.
    expect(pickStories('rose-red', 'confession', stories, 0)).toEqual({
      featured: null,
      others: [],
    });
  });
});

/* ------------------------------------------------------------------ *
 * 3. intents 를 비운 이야기 = 전천후
 * ------------------------------------------------------------------ */

describe('pickStories — 빈 intents 는 모든 상황', () => {
  it('intents 가 비어 있으면 어떤 상황에서든 후보로 남는다', () => {
    const empty = story('empty-intents', 'rose-red', ['romantic'], { intents: [] });
    const absent = story('no-intents', 'rose-red', ['romantic']);

    for (const intent of INTENTS) {
      expect(pickStories('rose-red', intent, [empty]).featured?.storyId).toBe('empty-intents');
      expect(pickStories('rose-red', intent, [absent]).featured?.storyId).toBe('no-intents');
    }
  });

  it('빈 intents 도 mood 친화 선별을 그대로 받는다', () => {
    const stories = [
      story('dramatic-tagged', 'rose-red', ['dramatic'], { intents: [] }),
      story('romantic-empty', 'rose-red', ['romantic'], { intents: [] }),
    ];

    // confession 친화는 romantic — 목록 순서를 뒤집는다.
    expect(pickStories('rose-red', 'confession', stories).featured?.storyId).toBe('romantic-empty');
  });

  it('명시적으로 태그된 이야기가 있으면 빈 intents 보다 뒤로 밀리지 않는다', () => {
    const stories = [
      story('all-purpose', 'rose-red', ['romantic'], { intents: [] }),
      story('tagged', 'rose-red', ['funny'], { intents: ['confession'] }),
    ];

    // ①(명시 태그)이 ②(결 친화)보다 항상 앞선다.
    const { featured, others } = pickStories('rose-red', 'confession', stories);
    expect(featured?.storyId).toBe('tagged');
    expect(ids(others)).toEqual(['all-purpose']);
  });
});

/* ------------------------------------------------------------------ *
 * 4. 어휘·배럴
 * ------------------------------------------------------------------ */

describe('어휘와 배럴 export', () => {
  it('MOOD_AFFINITY 는 상황 어휘 전부(§1.5l other 포함)를 덮고 값은 STORY_MOODS 안에 있다', () => {
    expect(Object.keys(MOOD_AFFINITY).sort()).toEqual([...INTENTS].sort());
    for (const intent of INTENTS) {
      const moods: readonly StoryMood[] = MOOD_AFFINITY[intent];
      expect(moods.length).toBeGreaterThan(0);
      for (const mood of moods) {
        expect(STORY_MOODS).toContain(mood);
      }
    }
  });

  it('엔진 배럴에서도 선별기를 그대로 꺼내 쓸 수 있다', () => {
    expect(engine.pickStories).toBe(pickStories);
    expect(engine.MOOD_AFFINITY).toBe(MOOD_AFFINITY);
    expect(engine.DEFAULT_STORY_COUNT).toBe(DEFAULT_STORY_COUNT);
  });
});
