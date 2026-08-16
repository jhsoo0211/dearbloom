import { describe, expect, it } from 'vitest';

import { buildFlowerDetail } from '@/components/flowers/data';
import { buildLandingData } from '@/components/landing/landing-build';
import { loadCatalog } from '@/lib/data/catalog';
import {
  FLOWER_PHOTOS,
  canLeadHero,
  needsDarkOverlay,
  photoCredit,
  photoCredits,
  photoFor,
  photoSource,
  photoSourceLabel,
  photoSrc,
  photoSrcSet,
} from '@/lib/photos';

/**
 * 꽃별 대표 실사 상수의 그물.
 *
 * 도판(`plates.test.ts`)과 같은 이유로 여기서 걸러야 한다 — 사진은 화면이 아니라 **데이터**다.
 * 특히 잡고 싶은 것:
 *   · 카탈로그에 꽃이 늘었는데 컷을 안 붙인 경우(카드가 조용히 그라디언트로 남는다 — #4)
 *   · 유료 라이선스(`premium_photo-` · `plus.unsplash.com`)가 섞여 든 경우
 *   · **승인되지 않은 소스**가 섞여 든 경우(2026-08-16 확장 뒤로는 소스가 둘 이상이다)
 *   · 크레딧 꼬리표가 **주소의 소스와 어긋난** 경우 — Pexels 사진에 `/ Unsplash` 를 달면
 *     표기가 거짓이 된다. 사람 눈으로는 32줄 중 한 줄을 놓치기 쉬운 자리다
 *   · `src` 에 쿼리 파라미터가 붙어 `photoSrc()` 가 두 번 붙이는 경우
 *   · 히어로 금지 규칙(장미)이 조용히 풀린 경우 — 첫 화면이 로맨스 코드로 넘어간다
 *   · 랜딩 히어로가 다시 "오늘의 꽃 아닌 사진"으로 돌아간 경우(#5)
 */

/**
 * **실제로 쓰는** 소스의 주소 모양. 여기 없는 호스트가 상수에 들어오면 아래 테스트가 잡는다.
 *
 * 승인 풀(문서 §확장 소스 풀)에는 Wikimedia Commons 도 있지만 채택분이 0장이라 **넣지 않는다** —
 * 쓰지도 않는 소스를 미리 허용하면 그물이 그만큼 헐거워진다. 실제로 채택하는 날 함께 늘린다.
 */
const SOURCE_PATTERNS: Record<string, RegExp> = {
  unsplash: /^https:\/\/images\.unsplash\.com\/photo-[\w-]+$/,
  pexels: /^https:\/\/images\.pexels\.com\/photos\/\d+\/[\w./-]+\.jpe?g$/,
};

/** `Photo: {작가} / {소스}` — 꼬리표도 실제로 쓰는 둘만 받는다(위와 같은 이유). */
const CREDIT_LINE = /^Photo: .+ \/ (Unsplash|Pexels)$/;

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

  it('승인된 소스의 무료 경로만 쓰고, src 에는 쿼리 파라미터가 없다', () => {
    for (const photo of Object.values(FLOWER_PHOTOS)) {
      // Unsplash+ 유료분은 경로가 다르다 — 한 장이라도 섞이면 라이선스가 깨진다.
      expect(photo.src, `${photo.flowerId} — 유료 경로다`).not.toContain('premium_photo-');
      expect(photo.src, `${photo.flowerId} — 유료 호스트다`).not.toContain('plus.unsplash.com');

      const source = photoSource(photo);
      expect(source, `${photo.flowerId} — 승인되지 않은 소스다`).toBeDefined();
      const pattern = SOURCE_PATTERNS[source as string];
      expect(pattern, `${photo.flowerId} — ${source} 는 아직 쓰기로 한 소스가 아니다`).toBeDefined();
      expect(photo.src, `${photo.flowerId} — ${source} 주소 모양이 아니다`).toMatch(pattern);
      // 폭·포맷은 `photoSrc()` 한 곳에서만 붙인다(상수에 붙으면 두 번 붙는다).
      expect(photo.src).not.toContain('?');
    }
  });

  it('크레딧은 표기 형식을 지키고, 꼬리표가 주소의 소스와 일치한다', () => {
    for (const photo of Object.values(FLOWER_PHOTOS)) {
      expect(photo.credit, photo.flowerId).toMatch(CREDIT_LINE);
      expect(photoCredit(photo)).toBe(photo.credit);
      expect(photo.alt.length).toBeGreaterThan(0);
      // 표기의 진실성 — Pexels 컷에 `/ Unsplash` 가 붙으면 크레딧이 거짓말이 된다.
      const label = photoSourceLabel(photo);
      expect(photo.credit.endsWith(` / ${label}`), `${photo.flowerId} — 꼬리표가 ${label} 이 아니다`).toBe(
        true,
      );
    }
  });

  it('두 소스를 실제로 함께 쓰고 있다 — 확장이 조용히 되돌려지지 않았다', () => {
    const used = new Set(Object.values(FLOWER_PHOTOS).map((photo) => photoSource(photo)));
    // 2026-08-16 품질 재검토에서 Pexels 를 열었다(문서 §확장 소스 풀).
    expect([...used].sort()).toEqual(['pexels', 'unsplash']);
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

  it('photoSrc — Unsplash 는 imgix 키로 폭을 받는다', () => {
    const daisy = photoFor('daisy');
    if (!daisy) throw new Error('실사 상수가 비었다');
    expect(photoSource(daisy)).toBe('unsplash');

    expect(photoSrc(daisy)).toBe(`${daisy.src}?auto=format&fit=crop&w=1080&q=80`);
    expect(photoSrc(daisy, 2560)).toContain('w=2560');
    expect(photoSrc(daisy, 640)).toContain('w=640');
    // auto=format 이 빠지면 WebP/AVIF 대체 서빙이 사라진다(문서 §채택 이미지 머리말).
    expect(photoSrc(daisy, 1600)).toContain('auto=format');
  });

  it('photoSrc — Pexels 는 imgix 키가 아니라 자기 키로 폭을 받는다', () => {
    const jasmine = photoFor('jasmine');
    if (!jasmine) throw new Error('재스민 실사가 없다');
    expect(photoSource(jasmine)).toBe('pexels');

    expect(photoSrc(jasmine)).toBe(`${jasmine.src}?auto=compress&cs=tinysrgb&fit=crop&w=1080`);
    expect(photoSrc(jasmine, 2560)).toContain('w=2560');
    // Pexels 는 imgix 가 아니다 — `auto=format`·`q=` 를 붙이면 무시되고 캐시 키만 갈라진다.
    expect(photoSrc(jasmine, 640)).not.toContain('auto=format');
    expect(photoSrc(jasmine, 640)).not.toContain('q=');
  });

  it('photoSrc — 폭을 못 받는 소스와 모르는 주소는 원본을 그대로 돌려준다', () => {
    const daisy = photoFor('daisy');
    if (!daisy) throw new Error('실사 상수가 비었다');

    // 위키미디어 썸네일은 정해진 폭에만 존재한다(그 밖의 폭은 HTTP 400) — 치환하지 않는다.
    const commons = {
      ...daisy,
      src: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Bellis_perennis.jpg',
    };
    expect(photoSrc(commons, 2560)).toBe(commons.src);
    // srcset 도 거짓 폭을 신고하지 않고 한 줄만 낸다.
    expect(photoSrcSet(commons, [640, 1080])).toBe(commons.src);

    // 모르는 주소는 깨뜨리지 않고 그대로 돌려준다.
    const foreign = { ...daisy, src: 'https://example.test/flower.jpg' };
    expect(photoSrc(foreign, 2560)).toBe('https://example.test/flower.jpg');
    expect(photoSrcSet(foreign, [640, 1080])).toBe('https://example.test/flower.jpg');
  });

  it('photoSrcSet — 폭을 받는 소스는 소스가 달라도 디스크립터를 붙인다', () => {
    for (const id of ['daisy', 'jasmine']) {
      const photo = photoFor(id);
      if (!photo) throw new Error(`${id} 실사가 없다`);
      const set = photoSrcSet(photo, [640, 1080]);
      expect(set, id).toContain('640w');
      expect(set, id).toContain('1080w');
      expect(set.split(', '), id).toHaveLength(2);
    }
  });

  it('밝은 배경 컷은 딱 4종이고, 전부 각주를 달고 있다', () => {
    const bright = Object.values(FLOWER_PHOTOS)
      .filter(needsDarkOverlay)
      .map((photo) => photo.flowerId)
      .sort();

    // 2026-08-16 재검토: `violet` 이 어두운 컷으로 바뀌어 빠지고, 밝은 풀밭 배경이 된
    // `forget-me-not` 이 들어왔다(수는 그대로 넷).
    expect(bright).toEqual(['babys-breath', 'forget-me-not', 'lavender', 'lily-of-the-valley']);
    for (const id of bright) expect(photoFor(id)?.note).toBeTruthy();
  });

  it('원본 가로는 전부 2400px 이상이다 — 카드·도감이 업스케일을 보지 않는다', () => {
    for (const photo of Object.values(FLOWER_PHOTOS)) {
      expect(photo.width, `${photo.flowerId} — width 가 없다`).toBeDefined();
      expect(photo.width as number, `${photo.flowerId} — 원본이 너무 작다`).toBeGreaterThanOrEqual(
        2400,
      );
    }
  });

  it('벚꽃은 사용자가 지적한 원경 컷이 아니다', () => {
    const sakura = photoFor('cherry-blossom');
    // 옛 컷(photo-1776356829303)은 나무 전체를 올려다본 원경이라 건물까지 들어와 있었다.
    expect(sakura?.src).not.toContain('photo-1776356829303');
    expect(sakura?.alt).toContain('클로즈업');
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
    for (const line of credits) expect(line).toMatch(CREDIT_LINE);
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
      expect(slide.image?.credit).toMatch(CREDIT_LINE);
    }
  });

  it('밝은 컷 카드는 bright 플래그와 그레이딩을 함께 받는다', async () => {
    const catalog = await loadCatalog();
    const data = buildLandingData(catalog, TODAY);
    const bright = data.slides.filter((slide) => slide.image?.bright).map((s) => s.flowerId);

    expect(bright.sort()).toEqual(['babys-breath', 'forget-me-not', 'lavender', 'lily-of-the-valley']);
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
