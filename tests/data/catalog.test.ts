import { beforeEach, describe, expect, it } from 'vitest';

import { SOURCE_KINDS } from '../../db/seed/schemas';
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

const EXPECTED_FLOWERS = 59;
const EXPECTED_STORIES = 445;
/** 윤년 366일. 하루라도 비면 그 날 태어난 사람에게 보여 줄 것이 없다. */
const EXPECTED_BIRTH_DAYS = 366;

async function load(): Promise<Catalog> {
  return loadCatalog();
}

beforeEach(() => {
  clearCatalogCache();
});

describe('loadCatalog', () => {
  it('content/*.csv 8종을 모두 읽어 카탈로그를 만든다', async () => {
    const catalog = await load();

    expect(catalog.flowers).toHaveLength(EXPECTED_FLOWERS);
    expect(catalog.stories).toHaveLength(EXPECTED_STORIES);
    expect(catalog.rules.length).toBeGreaterThan(0);
    expect(catalog.meanings.length).toBeGreaterThan(0);
    expect(catalog.templates.length).toBeGreaterThan(0);
    expect(catalog.quotes.length).toBeGreaterThan(0);
    // 꽃 59종 × cat·dog = 118행 (교차 검증이 강제하는 커버리지)
    expect(catalog.petSafety).toHaveLength(EXPECTED_FLOWERS * 2);
    expect(catalog.birthFlowers).toHaveLength(EXPECTED_BIRTH_DAYS);
  });

  it('탄생화 표를 화면용 필드로 옮기고, editorial_note 는 옮기지 않는다', async () => {
    const catalog = await load();

    // 학명만 있는 날 · 영문명만 있는 날 · 도감으로 이어지는 날이 각각 살아 있어야 한다.
    const jan2 = catalog.birthFlowers.find((row) => row.month === 1 && row.day === 2);
    expect(jan2).toMatchObject({
      nameKo: '노랑수선화',
      scientificName: 'Narcissus jonquilla',
      flowerId: 'narcissus',
      meaningKo: '사랑에 답하여',
    });
    // 표가 영문명을 안 적어 둔 날은 **키 자체가 없다**(빈 문자열로 메우지 않는다).
    expect(jan2).not.toHaveProperty('nameEn');

    const jan1 = catalog.birthFlowers.find((row) => row.month === 1 && row.day === 1);
    expect(jan1).toMatchObject({ nameKo: '스노드롭', nameEn: 'Snow Drop', meaningKo: '희망' });
    // 카탈로그에 없는 꽃이 정상 값이다 — 309일이 여기에 해당한다.
    expect(jan1).not.toHaveProperty('flowerId');

    // 편집·감사용 메모는 화면에 나갈 값이 아니다(조사 문서 §8-4 · pd_basis 와 같은 판단).
    for (const row of catalog.birthFlowers) {
      expect(row).not.toHaveProperty('editorialNote');
      expect(row).not.toHaveProperty('editorial_note');
      // 출처 없는 표는 싣지 않는다(꽃말·일화와 같은 원칙).
      expect(row.sourceUrl).toMatch(/^https?:\/\//);
      expect(row.meaningKo).not.toBe('');
    }
  });

  it('탄생화의 flower_id 는 전부 카탈로그 안에 있다 (링크가 404 로 새지 않게)', async () => {
    const catalog = await load();
    const ids = new Set(catalog.flowers.map((flower) => flower.id));

    const linked = catalog.birthFlowers.filter((row) => row.flowerId !== undefined);
    // 조사 결과: 86일이 도감으로 이어지고 카탈로그 59종 중 38종이 걸린다.
    // (확장 배치 2 의 12종은 탄생화 표가 가리키는 이름에 없어 연결 수는 그대로다.)
    expect(linked).toHaveLength(86);
    expect(new Set(linked.map((row) => row.flowerId)).size).toBe(38);
    for (const row of linked) {
      expect(ids, `${row.month}/${row.day} 의 flower_id`).toContain(row.flowerId);
    }
  });

  it('문학 발췌를 화면용 필드로 옮기고, pd_basis 는 옮기지 않는다 (§1.5k)', async () => {
    const catalog = await load();
    const camellia = catalog.quotes.find((q) => q.quoteId === 'q-lit-camellia-kimyujeong');

    expect(camellia).toMatchObject({
      flowerId: 'camellia',
      excerptType: 'novel',
      author: '김유정',
      license: 'pd',
    });
    // 각주 없이 실으면 서비스가 틀린 정보를 준다 — 생강나무 각주가 화면까지 살아 와야 한다.
    expect(camellia?.caveat).toContain('생강나무');
    // 한국어 원전이라 옮긴이가 없다.
    expect(camellia?.translator).toBeUndefined();

    const shijing = catalog.quotes.find((q) => q.quoteId === 'q-lit-peony-shijing');
    expect(shijing?.textOriginal).toContain('贈之以勺藥');
    expect(shijing?.translator).toBe('dearbloom');

    // pd_basis 는 편집자용 값이다. 타입에도 없고 로더도 옮기지 않으므로 실수로 렌더될 수 없다.
    for (const quote of catalog.quotes) {
      expect(quote).not.toHaveProperty('pdBasis');
      expect(quote).not.toHaveProperty('pd_basis');
    }
  });

  it('꽃 비연동 인용(기존 3행)은 flowerId 없이 남는다', async () => {
    const catalog = await load();
    const general = catalog.quotes.filter((q) => q.flowerId === undefined);
    expect(general.map((q) => q.quoteId)).toEqual(['q-001', 'q-002', 'q-003']);
  });

  it('snake_case CSV 를 camelCase 엔진 타입으로 옮긴다', async () => {
    const catalog = await load();
    const tulip = catalog.flowers.find((flower) => flower.id === 'tulip-white');

    expect(tulip).toBeDefined();
    expect(tulip).toMatchObject({
      nameKo: '흰 튤립',
      nameEn: 'White Tulip',
      scientificName: 'Tulipa gesneriana',
      colors: ['white', 'cream', 'yellow', 'red', 'variegated', 'pink', 'purple'],
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

  it('모든 이야기가 source_kind 를 싣고 온다 (화면 신뢰 문구가 여기에 매달려 있다)', async () => {
    const catalog = await load();

    for (const story of catalog.stories) {
      expect(SOURCE_KINDS, `${story.storyId} 의 source_kind`).toContain(story.sourceKind);
    }
    // 소스가 한 갈래로만 몰려 있으면 라벨을 갈라 둔 의미가 없다.
    const kinds = new Set(catalog.stories.map((story) => story.sourceKind));
    expect(kinds.size).toBeGreaterThanOrEqual(5);
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
