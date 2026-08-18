import { describe, expect, it } from 'vitest';

import { STORY_PARAM, storyHref, storyIdFromSearch } from '@/components/stories/deep-link';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';

/**
 * `/stories?story={storyId}` — 이야기 한 편을 **주소로 여는 길**(크로스 링크 2026-08-18).
 *
 * 아카이브의 상세는 페이지가 아니라 시트라, 이야기 한 편에는 여태 가리킬 주소가 없었다.
 * 이 쿼리가 그 자리를 메운다 — 그래서 여기서 지키는 것은 두 가지다.
 *
 *   ① **읽히는가** — 만들어 준 주소(`storyHref`)를 다시 읽으면 그 id 가 그대로 나오는가.
 *      실데이터 438편 전수로 본다. 한 편이라도 못 읽히면 그 편에는 길이 없는 것이다.
 *   ② **거절하는가** — 주소창은 **남이 적는 자리**다. 생김새가 어긋난 값이 화면 상태로
 *      건너가면 안 된다. 던지지도 않는다(빈손으로 돌려보내고 화면은 목록만 세운다).
 *
 * ⚠ 실재 여부까지는 여기서 보지 않는다. 그 판정은 화면이 서버가 내려보낸 목록과 맞춰
 *   하는 일이고(`StoriesArchive`), 이 모듈은 **생김새**만 본다 — 두 문을 다 통과해야
 *   시트가 열린다는 것이 설계다.
 */

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog();
  return cached;
}

describe('storyIdFromSearch — 주소에서 이야기 id 를 꺼낸다', () => {
  it('`?story=…` 를 읽는다 (앞의 물음표는 있어도 없어도 된다)', () => {
    expect(storyIdFromSearch('?story=story-tulip-ottoman')).toBe('story-tulip-ottoman');
    expect(storyIdFromSearch('story=story-tulip-ottoman')).toBe('story-tulip-ottoman');
  });

  it('다른 쿼리와 섞여 있어도 찾아낸다', () => {
    expect(storyIdFromSearch('?utm=mail&story=story-rose-aphrodite&x=1')).toBe(
      'story-rose-aphrodite',
    );
  });

  it('없는 주소에는 빈손으로 답한다 — 그런 사람에게는 목록만 서면 된다', () => {
    expect(storyIdFromSearch('')).toBe('');
    expect(storyIdFromSearch('?')).toBe('');
    expect(storyIdFromSearch('?flower=tulip-white')).toBe('');
    expect(storyIdFromSearch('?story=')).toBe('');
    expect(storyIdFromSearch('?story=%20%20')).toBe('');
  });

  /**
   * 주소창은 남이 고쳐 쓰는 자리다. 여기 있는 값들은 전부 **화면 상태가 되면 안 되는** 것들이고,
   * 그렇다고 던져서도 안 된다 — 조작된 주소로 들어온 사람에게 화면이 깨지면 그것도 사고다.
   */
  it.each([
    ['경로 탈출', '?story=../../etc/passwd'],
    ['슬래시', '?story=story/tulip'],
    ['꺾쇠(주입 시도)', '?story=<script>alert(1)</script>'],
    ['공백이 낀 값', '?story=story tulip'],
    ['대문자', '?story=Story-Tulip-Ottoman'],
    ['하이픈으로 시작', '?story=-story-tulip'],
    ['밑줄', '?story=story_tulip'],
    ['한글', '?story=튤립'],
  ])('%s 은 거절한다 (던지지 않는다)', (_label, search) => {
    expect(() => storyIdFromSearch(search)).not.toThrow();
    expect(storyIdFromSearch(search)).toBe('');
  });

  it('터무니없이 긴 값은 상한에서 잘린다 — 목록 순회를 끌고 다니지 않는다', () => {
    expect(storyIdFromSearch(`?story=${'a'.repeat(80)}`)).toBe('a'.repeat(80));
    expect(storyIdFromSearch(`?story=${'a'.repeat(81)}`)).toBe('');
  });
});

describe('storyHref — 다른 화면이 "그 이야기로" 보낼 주소', () => {
  it('쿼리 이름을 한 곳에서만 적는다', () => {
    expect(storyHref('story-tulip-ottoman')).toBe(`/stories?${STORY_PARAM}=story-tulip-ottoman`);
    expect(STORY_PARAM).toBe('story');
  });

  it('실데이터 전수 — 만든 주소를 다시 읽으면 그 이야기가 나온다', async () => {
    const { stories } = await catalog();
    expect(stories.length).toBeGreaterThan(100);

    for (const story of stories) {
      const search = storyHref(story.storyId).replace('/stories', '');
      expect(storyIdFromSearch(search), story.storyId).toBe(story.storyId);
    }
  });
});
