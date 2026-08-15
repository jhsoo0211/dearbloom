import { describe, expect, it } from 'vitest';

import { loadStoryDetail } from '@/app/stories/actions';
import { loadCatalog } from '@/lib/data/catalog';

/**
 * `/stories` 상세 액션의 그물 — 성능 리뷰 P1-7 로 갈라 놓은 두 조각이 어긋나지 않는지.
 *
 * 아카이브는 이야기 **카드**(제목·hook·라벨)만 처음에 내려보내고, **전문과 출처**는
 * 시트를 열 때 이 액션이 한 편만 가져온다. 그래서 잡아야 하는 것은 세 가지다:
 *   · 전문이 정말 오는가(그리고 카드가 그 전문을 들고 있지 **않은가**)
 *   · 출처 규칙이 카드 쪽과 같은가 — 창작(original)만 출처 면제(§1.5d·§1.5f)
 *   · 없는 id 를 물으면 던지지 않고 `null` 인가(화면이 폴백 문구를 세울 수 있게)
 *
 * ⚠ 화면(시트)이 아니라 **액션만** 부른다. `'use server'` 파일은 vitest 에서 그냥 모듈로
 *   읽히고(디렉티브는 문자열 한 줄일 뿐이다), 안에서 카탈로그 로더가 CSV 를 읽는다.
 */

describe('loadStoryDetail — 시트가 여는 한 편', () => {
  it('전문을 그대로 돌려준다', async () => {
    const catalog = await loadCatalog();
    const source = catalog.stories[0];

    const detail = await loadStoryDetail(source.storyId);
    expect(detail).not.toBeNull();
    expect(detail?.id).toBe(source.storyId);
    expect(detail?.body).toBe(source.storyKo);
    expect(detail?.body.length).toBeGreaterThan(0);
  });

  it('없는 id 는 던지지 않고 null 이다(빈 시트 대신 폴백 문구를 세우게)', async () => {
    await expect(loadStoryDetail('없는-이야기')).resolves.toBeNull();
    await expect(loadStoryDetail('')).resolves.toBeNull();
  });

  it('창작 이야기만 출처가 면제다 — 나머지는 원문 제목이 함께 온다', async () => {
    const catalog = await loadCatalog();

    const original = catalog.stories.find((row) => row.storyType === 'original');
    const sourced = catalog.stories.find(
      (row) => row.storyType !== 'original' && !!row.sourceTitle,
    );
    if (!sourced) throw new Error('출처가 있는 이야기가 한 편도 없다');

    if (original) {
      const detail = await loadStoryDetail(original.storyId);
      expect(detail?.sourceTitle).toBeUndefined();
      expect(detail?.sourceUrl).toBeUndefined();
    }

    const detail = await loadStoryDetail(sourced.storyId);
    expect(detail?.sourceTitle).toBe(sourced.sourceTitle);
    if (sourced.sourceUrl) expect(detail?.sourceUrl).toBe(sourced.sourceUrl);
  });

  it('전량을 한 편씩 물어도 전부 전문이 있다', async () => {
    const catalog = await loadCatalog();
    const details = await Promise.all(
      catalog.stories.map((story) => loadStoryDetail(story.storyId)),
    );

    expect(details.filter((row) => row === null)).toHaveLength(0);
    for (const detail of details) expect(detail?.body.length).toBeGreaterThan(0);
  });
});
