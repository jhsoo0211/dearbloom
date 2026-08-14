import { beforeEach, describe, expect, it } from 'vitest';

import { clearCatalogCache, loadCatalog } from '@/lib/data/catalog';
import { recommend } from '@/lib/engine';
import { pickStories } from '@/lib/engine/stories';
import type { Catalog } from '@/lib/data/types';

/**
 * 실데이터 통합 스모크.
 *
 * 엔진 테스트는 인라인 픽스처로 규칙을 검증한다(tests/engine/*). 여기서는 반대로
 * **`content/*.csv` 를 그대로 읽어 엔진에 넣었을 때 끝까지 도는지**만 본다.
 * 콘텐츠 편집이 앱을 조용히 망가뜨리는 경우(컬럼 이름 변경·꽃 id 오타 등)를 잡는 그물이다.
 *
 * 행 수 같은 숫자는 "지금 이만큼 실려 있다"는 사실 확인이라 콘텐츠가 늘면 함께 고친다.
 */

const EXPECTED_FLOWERS = 9;
const EXPECTED_STORIES = 61;

async function load(): Promise<Catalog> {
  return loadCatalog();
}

beforeEach(() => {
  clearCatalogCache();
});

describe('loadCatalog', () => {
  it('content/*.csv 7종을 모두 읽어 카탈로그를 만든다', async () => {
    const catalog = await load();

    expect(catalog.flowers).toHaveLength(EXPECTED_FLOWERS);
    expect(catalog.stories).toHaveLength(EXPECTED_STORIES);
    expect(catalog.rules.length).toBeGreaterThan(0);
    expect(catalog.meanings.length).toBeGreaterThan(0);
    expect(catalog.templates.length).toBeGreaterThan(0);
    expect(catalog.quotes.length).toBeGreaterThan(0);
    // 꽃 9종 × cat·dog = 18행 (교차 검증이 강제하는 커버리지)
    expect(catalog.petSafety).toHaveLength(EXPECTED_FLOWERS * 2);
  });

  it('snake_case CSV 를 camelCase 엔진 타입으로 옮긴다', async () => {
    const catalog = await load();
    const tulip = catalog.flowers.find((flower) => flower.id === 'tulip-white');

    expect(tulip).toBeDefined();
    expect(tulip).toMatchObject({
      nameKo: '흰 튤립',
      nameEn: 'White Tulip',
      scientificName: 'Tulipa gesneriana',
      colors: ['white'],
      bloomMonths: [3, 4, 5],
      fragranceLevel: 1,
      priceBand: 2,
    });
    expect(tulip?.aestheticTags).toContain('minimal');
    // 파이프 배열·숫자·불리언 코덱이 살아 있는지 (문자열이 그대로 새어 나오면 실패)
    expect(typeof tulip?.fragranceLevel).toBe('number');

    const cat = tulip?.petSafety.find((entry) => entry.species === 'cat');
    expect(cat).toMatchObject({ toxic: true, severity: 'mild_gi' });
    expect(cat?.toxicParts).toEqual(['bulb', 'stem', 'leaf']);
    expect(cat?.sourceUrl).toMatch(/^https?:\/\//);
  });

  it('대체 꽃 목록은 평면 pet_safety 표가 갖고 있다', async () => {
    const catalog = await load();
    const record = catalog.petSafety.find(
      (entry) => entry.flowerId === 'tulip-white' && entry.species === 'cat',
    );

    expect(record?.safeAlternativeFlowerIds).toEqual(['freesia', 'gerbera']);
  });

  it('꽃말은 출처 URL 을 잃지 않는다 (출처 없는 꽃말은 싣지 않는다)', async () => {
    const catalog = await load();

    expect(catalog.meanings.length).toBeGreaterThan(0);
    for (const meaning of catalog.meanings) {
      expect(meaning.sourceId).not.toBe('');
      expect(meaning.sourceUrl).toMatch(/^https?:\/\//);
    }
  });

  it('창작(original)이 아닌 이야기는 모두 출처가 있다', async () => {
    const catalog = await load();

    for (const story of catalog.stories) {
      if (story.storyType === 'original') continue;
      expect(story.sourceUrl, `${story.storyId} 에 출처가 없습니다`).toMatch(/^https?:\/\//);
    }
  });

  it('두 번 불러도 같은 객체를 돌려준다 (요청마다 다시 읽지 않는다)', async () => {
    const first = await loadCatalog();
    const second = await loadCatalog();

    expect(second).toBe(first);
  });
});

describe('카탈로그 → 엔진', () => {
  it('recommend() 에 그대로 넣으면 3안이 나온다', async () => {
    const catalog = await load();

    const picks = recommend(
      {
        relationship: 'lover',
        intent: 'apology',
        apologyLevel: 3,
        dateISO: '2026-04-10',
        recipientTraits: ['calm'],
      },
      catalog,
    );

    expect(picks).toHaveLength(3);
    expect(new Set(picks.map((pick) => pick.flower.id)).size).toBe(3);
    for (const pick of picks) {
      expect(pick.flower.nameKo).not.toBe('');
      expect(pick.fitScore).toBeGreaterThan(0);
      expect(pick.reasons.length).toBeGreaterThan(0);
    }
  });

  it('반려묘가 있으면 백합은 후보에서 빠진다', async () => {
    const catalog = await load();

    const picks = recommend(
      { relationship: 'friend', intent: 'gratitude', pets: ['cat'], dateISO: '2026-04-10' },
      catalog,
    );

    expect(picks.map((pick) => pick.flower.id)).not.toContain('lily-asiatic');
  });

  it("pickStories('tulip-white', 'apology') 가 이야기를 골라 온다", async () => {
    const catalog = await load();

    const { featured, others } = pickStories('tulip-white', 'apology', catalog.stories);

    expect(featured).not.toBeNull();
    expect(featured?.flowerId).toBe('tulip-white');
    expect(featured?.moods.length).toBeGreaterThan(0);
    // featured 1편 + others 최대 3편 = 기본 4편
    expect(others.length).toBeGreaterThan(0);
    expect(others.length).toBeLessThanOrEqual(3);
    expect(others.every((story) => story.flowerId === 'tulip-white')).toBe(true);
    expect(others.map((story) => story.storyId)).not.toContain(featured?.storyId);
  });
});
