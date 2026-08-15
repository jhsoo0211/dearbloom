import { describe, expect, it } from 'vitest';

import { buildLetterFlowers } from '@/components/letter/data';
import { loadCatalog } from '@/lib/data/catalog';
import { photoFor, photoSrc } from '@/lib/photos';

/**
 * 편지에 곁들이는 꽃 목록의 그물.
 *
 * 잡고 싶은 것은 하나다 — **꽃이 늘었는데 편지 쪽만 못 따라가는 경우**. 목록이 카탈로그
 * 전종을 그대로 담고, 카드에 걸 사진과 한 줄 꽃말이 비어 있지 않아야 고르는 화면이 성립한다.
 * (실사 상수 자체의 그물은 `tests/components/photos.test.ts` 가 따로 든다.)
 */

describe('buildLetterFlowers', () => {
  it('카탈로그 전종을 카탈로그 순서 그대로 담는다', async () => {
    const catalog = await loadCatalog();
    const options = buildLetterFlowers(catalog);

    expect(options.map((option) => option.flowerId)).toEqual(
      catalog.flowers.map((flower) => flower.id),
    );
  });

  it('카드가 그릴 것이 전부 있다 — 이름·꽃말·사진·검색 색인', async () => {
    const catalog = await loadCatalog();
    for (const option of buildLetterFlowers(catalog)) {
      expect(option.nameKo.length, option.flowerId).toBeGreaterThan(0);
      expect(option.meaning.length, option.flowerId).toBeGreaterThan(0);
      expect(option.searchKey.length, option.flowerId).toBeGreaterThan(0);
      expect(option.thumbSrc.startsWith('https://'), option.flowerId).toBe(true);
      expect(option.thumbSrcSet, option.flowerId).toContain('640w');
      expect(option.alt.length, option.flowerId).toBeGreaterThan(0);
      expect(option.credit, option.flowerId).toMatch(/^Photo: .+ \/ Unsplash$/);
    }
  });

  it('사진은 다른 화면과 **같은 컷**이고, 자리에 맞는 폭으로 온다', async () => {
    const catalog = await loadCatalog();
    const options = buildLetterFlowers(catalog);

    for (const slug of ['freesia', 'rose-red', 'lavender']) {
      const option = options.find((row) => row.flowerId === slug);
      const photo = photoFor(slug);
      if (!option || !photo) throw new Error(`${slug} 가 비었다`);
      // 카드 썸네일은 640, 편지지 액자는 1080.
      expect(option.thumbSrc).toBe(photoSrc(photo, 640));
      expect(option.photoSrc).toBe(photoSrc(photo, 1080));
      expect(option.alt).toBe(photo.alt);
    }
  });

  it('배경이 밝은 넷만 다크 오버레이 표시를 받는다', async () => {
    const catalog = await loadCatalog();
    const bright = buildLetterFlowers(catalog)
      .filter((option) => option.bright)
      .map((option) => option.flowerId)
      .sort();

    expect(bright).toEqual(['babys-breath', 'lavender', 'lily-of-the-valley', 'violet']);
  });

  it('도판은 썸네일 경로로 온다(편지지 위 소품이라 본판을 물지 않는다)', async () => {
    const catalog = await loadCatalog();
    for (const option of buildLetterFlowers(catalog)) {
      if (!option.plate) continue;
      expect(option.plate.src, option.flowerId).toContain('/plates/thumbs/');
      expect(option.plate.alt.length, option.flowerId).toBeGreaterThan(0);
    }
  });
});
