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
  photosFor,
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

/**
 * 도감 갤러리(`photosFor`) — 2026-08-16 다중 사진 라운드.
 *
 * 여기서 꼭 잡아야 하는 것은 **첫 장이 대표컷이라는 약속**이다. 랜딩 카드를 누르고 들어온
 * 사람이 방금 본 사진을 상세에서 다시 만나야 두 화면이 한 꽃을 가리킨다는 게 읽힌다
 * (사용자 확정). 지금은 `photosFor()` 가 구조로 지키지만, 표 둘을 하나로 합치려는 다음
 * 사람이 순서를 잃기 쉬운 자리라 그물을 따로 둔다.
 *
 * 추가컷도 대표컷과 **같은 규정**을 통과해야 한다 — 승인 소스·무료 경로·쿼리 없는 주소·
 * 크레딧 꼬리표 일치·원본 가로 2400px 하한. 갤러리라고 기준이 헐거워지면 대표 32장을
 * 두 번에 걸쳐 다시 고른 일이 무의미해진다.
 */
describe('photosFor — 도감 갤러리', () => {
  /**
   * 색이 아닌 변형(같은 색의 다른 앵글·상태)에 허용한 어휘.
   * 색 라벨은 `…빛` 으로 끝난다 — 둘 중 하나가 아니면 아래 테스트가 잡는다.
   * 새 어휘를 쓰고 싶으면 **여기 먼저 적어라.** 캡션이 제각각이 되는 것을 막는 자리다.
   */
  const ANGLE_LABELS = new Set([
    '가까이',
    '뒤에서',
    '위에서',
    '한 송이',
    '한 다발',
    '잎 사이',
    '잎까지',
    '가지 위',
    '겹꽃 속',
    '어둠 속',
    '막 벌어질 때',
    '검붉은 무늬',
    '자주 테두리',
    '붉은 테두리',
  ]);

  it('첫 장은 언제나 대표컷이다 — 홈에서 본 그 사진', async () => {
    const catalog = await loadCatalog();
    for (const flower of catalog.flowers) {
      const primary = photoFor(flower.id);
      const gallery = photosFor(flower.id);
      if (!primary) throw new Error(`${flower.id} 대표컷이 없다`);

      const first = gallery[0];
      expect(first?.src, `${flower.id} — 첫 장이 대표컷이 아니다`).toBe(primary.src);
      expect(first?.credit, flower.id).toBe(primary.credit);
      expect(first?.alt, flower.id).toBe(primary.alt);
      expect(first?.width, flower.id).toBe(primary.width);
      // 대표 상수 자체는 갤러리 라벨을 갖지 않는다 — 한 장만 보여 주는 자리에서는 뜻이 없다.
      expect(primary.variant, `${flower.id} — 대표 상수에 variant 가 새어 들어갔다`).toBeUndefined();
    }
  });

  it('컷이 없는 꽃은 빈 배열이다 — photoFor 의 undefined 와 짝을 맞춘다', () => {
    expect(photosFor('없는-꽃')).toEqual([]);
    expect(photoFor('없는-꽃')).toBeUndefined();
  });

  it('꽃마다 2~4장이고, 같은 컷을 두 번 싣지 않는다', async () => {
    const catalog = await loadCatalog();
    for (const flower of catalog.flowers) {
      const cuts = photosFor(flower.id);
      expect(cuts.length, `${flower.id} — 컷 수가 2~4장을 벗어났다`).toBeGreaterThanOrEqual(2);
      expect(cuts.length, `${flower.id} — 컷 수가 2~4장을 벗어났다`).toBeLessThanOrEqual(4);

      const srcs = cuts.map((cut) => cut.src);
      expect(new Set(srcs).size, `${flower.id} — 같은 주소가 두 번 실렸다`).toBe(srcs.length);
      // flowerId 가 어긋나면 갤러리가 남의 꽃을 보여 준다.
      for (const cut of cuts) expect(cut.flowerId, cut.src).toBe(flower.id);
    }
  });

  it('추가컷도 대표컷과 같은 규정을 통과한다 — 소스·무료 경로·쿼리·크레딧·해상도', async () => {
    const catalog = await loadCatalog();
    for (const flower of catalog.flowers) {
      for (const cut of photosFor(flower.id)) {
        expect(cut.src, `${cut.src} — 유료 경로다`).not.toContain('premium_photo-');
        expect(cut.src, `${cut.src} — 유료 호스트다`).not.toContain('plus.unsplash.com');
        // 폭·포맷은 `photoSrc()` 한 곳에서만 붙인다(상수에 붙으면 두 번 붙는다).
        expect(cut.src, `${cut.src} — 쿼리가 붙어 있다`).not.toContain('?');

        const source = photoSource(cut);
        expect(source, `${cut.src} — 승인되지 않은 소스다`).toBeDefined();
        expect(cut.src, `${cut.src} — ${source} 주소 모양이 아니다`).toMatch(
          SOURCE_PATTERNS[source as string],
        );

        expect(cut.credit, cut.src).toMatch(CREDIT_LINE);
        expect(
          cut.credit.endsWith(` / ${photoSourceLabel(cut)}`),
          `${cut.src} — 꼬리표가 주소의 소스와 다르다`,
        ).toBe(true);

        expect(cut.width, `${cut.src} — width 가 없다`).toBeDefined();
        expect(cut.width as number, `${cut.src} — 원본이 너무 작다`).toBeGreaterThanOrEqual(2400);
      }
    }
  });

  it('alt 는 한국어 한 줄이고, 포인세티아는 갤러리에서도 "꽃잎"이라 말하지 않는다', async () => {
    const catalog = await loadCatalog();
    for (const flower of catalog.flowers) {
      for (const cut of photosFor(flower.id)) {
        expect(cut.alt, cut.src).toMatch(/[가-힣]/);
        expect(cut.alt, cut.src).not.toContain('\n');
      }
    }
    // 붉은 부분은 포엽(잎)이다 — 컷이 늘어도 이 사실은 변하지 않는다(문서 §주의 2).
    for (const cut of photosFor('poinsettia')) {
      expect(cut.alt, cut.src).not.toContain('꽃잎');
      expect(cut.alt, cut.src).toContain('포엽');
    }
  });

  it('변형 라벨은 정해진 어휘를 쓰고, 한 꽃 안에서 겹치지 않는다', async () => {
    const catalog = await loadCatalog();
    for (const flower of catalog.flowers) {
      const cuts = photosFor(flower.id);
      const labels = cuts.map((cut) => cut.variant);

      for (const label of labels) {
        expect(label, `${flower.id} — 라벨 없는 컷이 있다`).toBeTruthy();
        const ok = (label as string).endsWith('빛') || ANGLE_LABELS.has(label as string);
        expect(ok, `${flower.id} — "${label}" 은 허용된 어휘가 아니다`).toBe(true);
        // §1.6b 캡션 하한 12px 자리에 서는 한 줄이라 길면 액자 위에서 접힌다.
        expect((label as string).length, `${flower.id} — "${label}" 이 너무 길다`).toBeLessThanOrEqual(8);
      }

      expect(new Set(labels).size, `${flower.id} — 같은 라벨이 두 번 붙었다`).toBe(labels.length);
    }
  });

  it('색 변형이 실제로 들어와 있다 — "색상이 여러 가지" 라는 요청의 알맹이', async () => {
    const catalog = await loadCatalog();
    // 색 라벨(`…빛`)이 둘 이상인 꽃 = 갤러리가 색 변형을 보여 주는 꽃.
    const colorful = catalog.flowers.filter(
      (flower) =>
        photosFor(flower.id).filter((cut) => (cut.variant ?? '').endsWith('빛')).length >= 2,
    );
    // 2026-08-16 갤러리 라운드에서 32종 중 20종 → 확장 배치 1 의 15종이 전부 색 라벨 둘
    // 이상이라 35종. 하한을 같이 올려야 새 꽃이 앵글 라벨만 달고 들어오는 것을 막는다.
    expect(colorful.length).toBeGreaterThanOrEqual(35);
  });

  it('갤러리 컷도 두 소스를 함께 쓴다 — 확장이 조용히 되돌려지지 않았다', async () => {
    const catalog = await loadCatalog();
    const used = new Set(
      catalog.flowers.flatMap((flower) => photosFor(flower.id).map((cut) => photoSource(cut))),
    );
    expect([...used].sort()).toEqual(['pexels', 'unsplash']);
  });

  /**
   * 정식 도감 확장 배치 1(2026-08-16)의 15종.
   *
   * 위 테스트들은 전부 카탈로그를 돌기 때문에, **CSV 에서 꽃이 빠지면 함께 조용히 초록**이
   * 된다. 이 배치는 실사·도판·본문이 서로 다른 작업으로 들어왔으므로, 15종이 실제로
   * 붙어 있다는 사실만큼은 이름을 적어 못 박아 둔다.
   */
  const BATCH_ONE = [
    'sweet-pea',
    'gladiolus',
    'dahlia',
    'zinnia',
    'aster',
    'calendula',
    'cyclamen',
    'geranium',
    'primula',
    'stock',
    'delphinium',
    'amaryllis',
    'cornflower',
    'crocus',
    'water-lily',
  ] as const;

  it('확장 배치 1 의 15종이 전부 대표컷 + 갤러리를 갖는다', () => {
    for (const id of BATCH_ONE) {
      const primary = photoFor(id);
      expect(primary, `${id} — 대표컷이 없다`).toBeDefined();
      // 이번 배치는 전부 Pexels 다(Unsplash 검색이 봇 차단 뒤로 들어갔다 — 모듈 주석 참조).
      expect(photoSource(primary as never), id).toBe('pexels');
      // 대표를 어두운 배경으로만 고른 결과다 — 밝은 컷 명단이 넷에서 늘지 않아야 한다.
      expect(needsDarkOverlay(primary as never), `${id} — 밝은 컷 명단이 늘었다`).toBe(false);
      expect(photosFor(id).length, `${id} — 컷이 3장이 아니다`).toBe(3);
    }
  });

  it('제비꽃 갤러리가 종 확실성을 되찾았다 — 대표컷은 속까지만이었다', () => {
    // 문서 §남은 판단 1: 대표컷(Tom Fisk)은 제목이 "Violet Flower" 라 Viola 속까지만이다.
    const odorata = photosFor('violet').find((cut) => cut.note?.includes('viola odorata'));
    expect(odorata, '제비꽃 갤러리에 Viola odorata 명시 컷이 없다').toBeDefined();
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
      expect(detail?.photos.length, `${flower.id} — 상세에 실사가 없다`).toBeGreaterThan(0);
      expect(detail?.plate, `${flower.id} — 상세에 도판이 없다`).toBeDefined();
    }
  });

  it('상세 갤러리의 첫 장은 아카이브·랜딩과 같은 컷이고, 상세용 폭으로 온다', async () => {
    const catalog = await loadCatalog();
    for (const slug of ['daisy', 'rose-red', 'lavender']) {
      const detail = buildFlowerDetail(catalog, slug);
      const photo = photoFor(slug);
      if (!detail || !photo) throw new Error(`${slug} 가 비었다`);
      const first = detail.photos[0];
      expect(first?.src).toBe(photoSrc(photo, 1600));
      expect(first?.alt).toBe(photo.alt);
      expect(first?.credit).toBe(photo.credit);
    }
  });

  it('상세 갤러리는 컷마다 srcSet 과 상세용 폭을 함께 낸다', async () => {
    const catalog = await loadCatalog();
    const detail = buildFlowerDetail(catalog, 'tulip-white');
    if (!detail) throw new Error('흰 튤립 상세가 비었다');

    for (const cut of detail.photos) {
      // `sizes` 없이 srcset 만 주면 브라우저가 늘 최대 후보를 고른다 — 폭 후보는 셋이다.
      expect(cut.srcSet).toContain('640w');
      expect(cut.srcSet).toContain('1080w');
      expect(cut.srcSet).toContain('1600w');
      // 화면에 거는 기본 주소는 상세 히어로 폭이다.
      expect(cut.src).toContain('w=1600');
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
