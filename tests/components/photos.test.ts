import { describe, expect, it } from 'vitest';

import { buildFlowerDetail } from '@/components/flowers/data';
import { buildLandingData } from '@/components/landing/landing-data';
import { loadCatalog } from '@/lib/data/catalog';
import {
  FLOWER_PHOTOS,
  canLeadHero,
  needsDarkOverlay,
  photoCredit,
  photoCredits,
  photoFor,
  photoSrc,
} from '@/lib/photos';

/**
 * 꽃별 대표 실사 상수의 그물.
 *
 * 도판(`plates.test.ts`)과 같은 이유로 여기서 걸러야 한다 — 사진은 화면이 아니라 **데이터**다.
 * 특히 잡고 싶은 것:
 *   · 카탈로그에 꽃이 늘었는데 컷을 안 붙인 경우(카드가 조용히 그라디언트로 남는다 — #4)
 *   · 유료 라이선스(`premium_photo-` · `plus.unsplash.com`)가 섞여 든 경우
 *   · `src` 에 쿼리 파라미터가 붙어 `photoSrc()` 가 두 번 붙이는 경우
 *   · 히어로 금지 규칙(장미)이 조용히 풀린 경우 — 첫 화면이 로맨스 코드로 넘어간다
 *   · 랜딩 히어로가 다시 "오늘의 꽃 아닌 사진"으로 돌아간 경우(#5)
 */

/**
 * 기준일. **일부러 장미가 아닌 날**을 골랐다 — 실제 2026-08-15 의 오늘의 꽃은 `rose-red`
 * 이고, 그날 히어로는 규칙대로 카테고리 대표 컷으로 물러나기 때문이다(아래 전용 케이스).
 */
const TODAY = '2026-08-16';

describe('FLOWER_PHOTOS', () => {
  it('카탈로그 꽃 전종에 대표 실사가 있고, 카탈로그 밖 컷은 없다', async () => {
    const catalog = await loadCatalog();
    const catalogIds = catalog.flowers.map((flower) => flower.id).sort();
    const photoIds = Object.keys(FLOWER_PHOTOS).sort();

    expect(photoIds).toEqual(catalogIds);
    for (const id of catalogIds) expect(photoFor(id)).toBeDefined();
  });

  it('키와 flowerId 가 어긋나지 않는다', () => {
    for (const [key, photo] of Object.entries(FLOWER_PHOTOS)) {
      expect(photo.flowerId).toBe(key);
    }
  });

  it('무료 라이선스 경로만 쓰고, src 에는 쿼리 파라미터가 없다', () => {
    for (const photo of Object.values(FLOWER_PHOTOS)) {
      // Unsplash+ 유료분은 경로가 다르다 — 한 장이라도 섞이면 라이선스가 깨진다.
      expect(photo.src, `${photo.flowerId} — 유료 경로다`).not.toContain('premium_photo-');
      expect(photo.src, `${photo.flowerId} — 유료 호스트다`).not.toContain('plus.unsplash.com');
      expect(photo.src).toMatch(/^https:\/\/images\.unsplash\.com\/photo-[\w-]+$/);
      // 폭·포맷은 `photoSrc()` 한 곳에서만 붙인다(상수에 붙으면 두 번 붙는다).
      expect(photo.src).not.toContain('?');
    }
  });

  it('크레딧은 문서 표기 형식(Photo: {작가} / Unsplash)을 지킨다', () => {
    for (const photo of Object.values(FLOWER_PHOTOS)) {
      expect(photo.credit).toMatch(/^Photo: .+ \/ Unsplash$/);
      expect(photoCredit(photo)).toBe(photo.credit);
      expect(photo.alt.length).toBeGreaterThan(0);
    }
  });

  it('alt 는 한국어 한 줄이고, 포인세티아는 "꽃잎"이라 말하지 않는다', () => {
    for (const photo of Object.values(FLOWER_PHOTOS)) {
      expect(photo.alt).toMatch(/[가-힣]/);
      expect(photo.alt).not.toContain('\n');
    }
    // 붉은 부분은 포엽(잎)이다 — CSV editorial_note·도감 본문과 어긋나면 안 된다(문서 §주의 2).
    const poinsettia = photoFor('poinsettia');
    expect(poinsettia?.alt).not.toContain('꽃잎');
    expect(poinsettia?.alt).toContain('포엽');
  });

  it('photoSrc — 아는 호스트에만 폭·포맷을 붙이고, 폭이 그대로 반영된다', () => {
    const daisy = photoFor('daisy');
    if (!daisy) throw new Error('실사 상수가 비었다');

    expect(photoSrc(daisy)).toBe(`${daisy.src}?auto=format&fit=crop&w=1080&q=80`);
    expect(photoSrc(daisy, 2560)).toContain('w=2560');
    expect(photoSrc(daisy, 640)).toContain('w=640');
    // auto=format 이 빠지면 WebP/AVIF 대체 서빙이 사라진다(문서 §채택 이미지 머리말).
    expect(photoSrc(daisy, 1600)).toContain('auto=format');

    // 모르는 주소는 깨뜨리지 않고 그대로 돌려준다.
    const foreign = { ...daisy, src: 'https://example.test/flower.jpg' };
    expect(photoSrc(foreign, 2560)).toBe('https://example.test/flower.jpg');
  });

  it('밝은 배경 컷은 딱 4종이고, 전부 각주를 달고 있다', () => {
    const bright = Object.values(FLOWER_PHOTOS)
      .filter(needsDarkOverlay)
      .map((photo) => photo.flowerId)
      .sort();

    expect(bright).toEqual(['babys-breath', 'lavender', 'lily-of-the-valley', 'violet']);
    for (const id of bright) expect(photoFor(id)?.note).toBeTruthy();
  });

  it('히어로 금지는 장미 한 종뿐이고, 그 사실이 각주에 적혀 있다', async () => {
    const catalog = await loadCatalog();
    const banned = catalog.flowers.map((flower) => flower.id).filter((id) => !canLeadHero(id));

    expect(banned).toEqual(['rose-red']);
    expect(photoFor('rose-red')?.note).toContain('히어로');
  });

  it('corn-poppy 는 Advisor 가 고른 종 확정 컷이다', () => {
    const poppy = photoFor('corn-poppy');
    // 정황 동정이던 대표컷(photo-1606952460453)이 아니라 제목에 "common poppy" 가 적힌 백업 컷.
    expect(poppy?.src).toContain('photo-1560255261');
    expect(poppy?.credit).toBe('Photo: Tanya Cressey / Unsplash');
  });

  it('크레딧 집계는 중복을 지우고 정렬한다', async () => {
    const catalog = await loadCatalog();
    const ids = catalog.flowers.map((flower) => flower.id);
    const credits = photoCredits(ids);

    expect(credits.length).toBeGreaterThan(0);
    expect([...new Set(credits)]).toHaveLength(credits.length);
    expect([...credits].sort((a, b) => a.localeCompare(b, 'en'))).toEqual(credits);
    for (const line of credits) expect(line).toMatch(/^Photo: .+ \/ Unsplash$/);
  });
});

describe('랜딩 — 오늘의 꽃과 화면 일치(#5) · 전 카드 사진(#4)', () => {
  it('히어로는 오늘의 꽃 본인의 실사다', async () => {
    const catalog = await loadCatalog();
    const data = buildLandingData(catalog, TODAY);
    const photo = photoFor(data.today.flowerId);
    if (!photo) throw new Error(`${data.today.flowerId} 의 실사가 없다`);

    expect(data.hero.src).toBe(photoSrc(photo, 2560));
    expect(data.hero.alt).toBe(photo.alt);
    expect(data.hero.credit).toBe(photo.credit);
    // 모바일도 같은 컷이어야 한다(다른 꽃로 갈아 끼우면 #5 가 되살아난다).
    expect(data.hero.srcMobile).toContain(photo.src);
  });

  it('오늘의 꽃이 어느 날짜든 히어로가 그 꽃을 가리킨다', async () => {
    const catalog = await loadCatalog();
    for (const day of ['2026-01-09', '2026-03-21', '2026-06-30', '2026-11-02', '2026-12-24']) {
      const data = buildLandingData(catalog, day);
      const photo = photoFor(data.today.flowerId);
      // 장미는 히어로 금지라 이 단언에서 제외된다(아래 전용 케이스가 따로 잡는다).
      if (!photo || data.today.flowerId === 'rose-red') continue;
      expect(data.hero.src, `${day} — ${data.today.flowerId}`).toBe(photoSrc(photo, 2560));
    }
  });

  it('장미가 오늘의 꽃이면 히어로는 카테고리 대표 컷으로 물러난다', async () => {
    const catalog = await loadCatalog();
    // 오늘의 꽃이 반드시 장미가 되도록 후보를 한 종으로 좁힌다.
    const roseOnly = {
      ...catalog,
      flowers: catalog.flowers.filter((flower) => flower.id === 'rose-red'),
    };
    const data = buildLandingData(roseOnly, TODAY);
    const rose = photoFor('rose-red');
    if (!rose) throw new Error('장미 실사가 없다');

    expect(data.today.flowerId).toBe('rose-red');
    expect(data.hero.src).not.toContain(rose.src);
    // 카드에서는 그대로 쓴다 — 금지는 "히어로 자리"에만 걸린다.
    expect(data.today.image?.src).toContain(rose.src);
  });

  it('슬라이드 전 카드에 사진이 있다 — 그라디언트 폴백 0건', async () => {
    const catalog = await loadCatalog();
    const data = buildLandingData(catalog, TODAY);

    expect(data.slides).toHaveLength(catalog.flowers.length);
    for (const slide of data.slides) {
      expect(slide.image, `${slide.flowerId} — 카드 사진이 비었다`).toBeDefined();
      expect(slide.image?.src.startsWith('https://')).toBe(true);
      expect(slide.image?.alt.length).toBeGreaterThan(0);
      expect(slide.image?.credit).toMatch(/^Photo: .+ \/ Unsplash$/);
    }
  });

  it('밝은 컷 카드는 bright 플래그와 그레이딩을 함께 받는다', async () => {
    const catalog = await loadCatalog();
    const data = buildLandingData(catalog, TODAY);
    const bright = data.slides.filter((slide) => slide.image?.bright).map((s) => s.flowerId);

    expect(bright.sort()).toEqual(['babys-breath', 'lavender', 'lily-of-the-valley', 'violet']);
    for (const slide of data.slides) {
      if (!slide.image?.bright) continue;
      expect(slide.image.grade, `${slide.flowerId} — 그레이딩이 없다`).toBeTruthy();
    }
  });

  it('푸터 크레딧이 히어로·카드 사진을 모두 담는다', async () => {
    const catalog = await loadCatalog();
    const data = buildLandingData(catalog, TODAY);

    expect(data.credits).toContain(data.hero.credit);
    for (const slide of data.slides) {
      if (slide.image) expect(data.credits).toContain(slide.image.credit);
    }
    expect([...new Set(data.credits)]).toHaveLength(data.credits.length);
  });

  it('데이지가 랜딩 슬라이드에 있고 상황 예시 두 줄을 갖는다', async () => {
    const catalog = await loadCatalog();
    const data = buildLandingData(catalog, TODAY);
    const daisy = data.slides.find((slide) => slide.flowerId === 'daisy');

    expect(daisy).toBeDefined();
    expect(daisy?.category).toBe('forest');
    expect(daisy?.occasions).toHaveLength(2);
  });
});

describe('도감 상세 — 실사 우선, 세밀화는 보조', () => {
  it('전종이 실사와 도판을 함께 갖는다', async () => {
    const catalog = await loadCatalog();
    for (const flower of catalog.flowers) {
      const detail = buildFlowerDetail(catalog, flower.id);
      expect(detail?.photo, `${flower.id} — 상세에 실사가 없다`).toBeDefined();
      expect(detail?.plate, `${flower.id} — 상세에 도판이 없다`).toBeDefined();
    }
  });

  it('상세의 실사는 아카이브·랜딩과 같은 컷이고, 상세용 폭으로 온다', async () => {
    const catalog = await loadCatalog();
    for (const slug of ['daisy', 'rose-red', 'lavender']) {
      const detail = buildFlowerDetail(catalog, slug);
      const photo = photoFor(slug);
      if (!detail || !photo) throw new Error(`${slug} 가 비었다`);
      expect(detail.photo?.src).toBe(photoSrc(photo, 1600));
      expect(detail.photo?.alt).toBe(photo.alt);
      expect(detail.photo?.credit).toBe(photo.credit);
    }
  });

  it('데이지가 도감 목록·검색·상세에 모두 나온다', async () => {
    const { buildFlowerIndex } = await import('@/components/flowers/data');
    const { normalizeQuery } = await import('@/components/flowers/category');
    const catalog = await loadCatalog();

    const { flowers, groups } = buildFlowerIndex(catalog);
    const summary = flowers.find((flower) => flower.slug === 'daisy');
    expect(summary).toBeDefined();
    // 그룹(계열)에도 실제로 담겨 있어야 목록 화면에 카드가 선다.
    expect(groups.some((group) => group.flowers.some((f) => f.slug === 'daisy'))).toBe(true);
    // 검색 색인은 이름 세 가지를 정규화해 이어 붙인 문자열이다.
    for (const query of ['데이지', 'daisy', 'Bellis']) {
      expect(summary?.haystack).toContain(normalizeQuery(query));
    }

    const detail = buildFlowerDetail(catalog, 'daisy');
    expect(detail?.nameKo).toBe('데이지');
    expect(detail?.scientificName).toBe('Bellis perennis');
    expect(detail?.plate?.src).toBe('/plates/daisy.jpg');
  });
});
