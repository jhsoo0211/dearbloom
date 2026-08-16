import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildFlowerIndex, buildFlowerDetail } from '@/components/flowers/data';
import { STORY_CATEGORIES, storyCategoryLabel } from '@/components/stories/categories';
import { loadCatalog } from '@/lib/data/catalog';
import {
  FLOWER_PLATES,
  THUMB_DIR,
  plateCredit,
  plateCredits,
  plateFor,
  plateSourceLine,
  plateSrc,
  plateViewFor,
} from '@/lib/plates';

/**
 * 세밀화 도판 상수의 그물.
 *
 * 도판은 화면이 아니라 **데이터**라 눈으로 보기 전에 여기서 걸러야 한다. 특히 잡고 싶은 것:
 *   · 카탈로그에 꽃이 늘었는데 도판을 안 붙인 경우(레인 헤더만 조용히 빈다)
 *   · 상수에는 있는데 `public/plates/` 에 파일이 없는 경우 — 자체 호스팅으로 옮긴 뒤
 *     **가장 잘 깨지는 자리**다(모듈만 고치고 `node scripts/fetch-plates.mjs` 를 잊는다)
 *   · 취득 URL 의 폭 규칙을 깬 경우(위키미디어는 표준 폭 밖 요청을 거절한다)
 *   · 크레딧 표기 형식이 문서(`docs/illustration-assets.md` 사용 규칙 4)에서 벗어난 경우
 */

/** `public/` 의 실제 자리 — 테스트 파일 기준으로 잡아 cwd 에 기대지 않는다. */
const PUBLIC_DIR = fileURLToPath(new URL('../../public/', import.meta.url));

describe('FLOWER_PLATES', () => {
  it('카탈로그 꽃 전종에 도판이 있고, 카탈로그 밖 도판은 없다', async () => {
    const catalog = await loadCatalog();
    const catalogIds = catalog.flowers.map((flower) => flower.id).sort();
    const plateIds = Object.keys(FLOWER_PLATES).sort();

    expect(plateIds).toEqual(catalogIds);
    for (const id of catalogIds) expect(plateFor(id)).toBeDefined();
  });

  it('키와 flowerId 가 어긋나지 않는다', () => {
    for (const [key, plate] of Object.entries(FLOWER_PLATES)) {
      expect(plate.flowerId).toBe(key);
    }
  });

  it('화면이 쓰는 주소는 자체 호스팅 사본이고, 그 파일이 실제로 있다', () => {
    for (const plate of Object.values(FLOWER_PLATES)) {
      // 런타임에 위키미디어·아카이브를 부르지 않는다(문서 배포 규칙 1).
      expect(plate.src.startsWith('/plates/'), `${plate.flowerId} 의 src 가 로컬 경로가 아니다`).toBe(
        true,
      );
      expect(plate.src).toMatch(/^\/plates\/[a-z0-9-]+\.jpg$/);

      const file = join(PUBLIC_DIR, plate.src.replace(/^\//, ''));
      expect(existsSync(file), `${plate.flowerId} — public${plate.src} 가 없다`).toBe(true);
      expect(statSync(file).size, `${plate.flowerId} — 파일이 비어 있다`).toBeGreaterThan(0);
    }
  });

  /**
   * 정규화 불변식 — `scripts/fetch-plates.mjs` 가 sharp 로 **한 규격(≤1280px JPEG q82)** 을
   * 강제한다. 이 그물이 잡고 싶은 것은 "원본 확장자 그대로 받아 두던 시절로의 조용한 회귀" 다:
   * 위키미디어 PNG 판본 7종은 장당 2.5~4.3MB 라, 한 장만 섞여 들어와도 레인 헤더의 44px
   * 썸네일이 그 파일을 통째로 물게 된다.
   */
  it('도판 파일은 전부 .jpg 이고, 한 장도 1MB 를 넘지 않는다', () => {
    const MAX_BYTES = 1024 * 1024;

    for (const plate of Object.values(FLOWER_PLATES)) {
      expect(plate.src.endsWith('.jpg'), `${plate.flowerId} — 정규화 산출물은 언제나 .jpg 다`).toBe(
        true,
      );

      const file = join(PUBLIC_DIR, plate.src.replace(/^\//, ''));
      const size = statSync(file).size;
      expect(
        size,
        `${plate.flowerId} — ${(size / 1024).toFixed(0)}KB 다. 1MB 를 넘으면 정규화를 건너뛴 파일이다`,
      ).toBeLessThanOrEqual(MAX_BYTES);
    }
  });

  it('취득 URL 은 https 이고, 폭은 문서가 정한 1280px 표준 썸네일이다', () => {
    for (const plate of Object.values(FLOWER_PLATES)) {
      expect(plate.remoteSrc.startsWith('https://')).toBe(true);
      expect(plate.pageUrl.startsWith('https://')).toBe(true);
      // 위키미디어(30종)는 표준 썸네일, gerbera 1종만 Internet Archive 의 `_w1800`.
      const known = plate.remoteSrc.includes('/1280px-') || plate.remoteSrc.includes('_w1800.');
      expect(known, `${plate.flowerId} 의 remoteSrc 가 아는 폭 패턴이 아니다`).toBe(true);
    }
  });

  /**
   * 썸네일 그물 — 성능 리뷰 P0-2 의 재발 방지선.
   *
   * 화면이 도판을 거는 자리는 레인 헤더 44px 과 시트 액자 ≤92px 뿐인데, 예전에는 그 칸이
   * 200KB 짜리 본판을 통째로 물었다(첫 화면 도판만 1.4MB). 이제 `plateSrc(plate, ≤250)`
   * 이 `/plates/thumbs/…` 를 가리키므로 **그 파일이 실제로 있어야** 한다 —
   * 모듈만 고치고 `node scripts/fetch-plates.mjs` 를 잊으면 32칸이 전부 404 가 된다.
   */
  it('썸네일이 카탈로그 전종에 있고, 본판보다 확실히 가볍다', () => {
    /** 썸네일 한 장의 상한. 160px q82 라면 실제로는 4~13KB 사이에 든다. */
    const MAX_THUMB_BYTES = 40 * 1024;
    let totalThumb = 0;

    for (const plate of Object.values(FLOWER_PLATES)) {
      const thumb = plateSrc(plate, 250);
      expect(thumb.startsWith(THUMB_DIR), `${plate.flowerId} — 250px 이 본판을 가리킨다`).toBe(true);
      // 파일 이름은 본판과 같다(경로만 다르다) — 짝을 잃으면 어느 그림인지 알 수 없다.
      expect(thumb).toBe(`${THUMB_DIR}${plate.flowerId}.jpg`);

      const file = join(PUBLIC_DIR, thumb.replace(/^\//, ''));
      expect(existsSync(file), `${plate.flowerId} — public${thumb} 가 없다`).toBe(true);

      const size = statSync(file).size;
      expect(size, `${plate.flowerId} — 썸네일이 비었다`).toBeGreaterThan(0);
      expect(
        size,
        `${plate.flowerId} — 썸네일이 ${(size / 1024).toFixed(0)}KB 다(본판을 그대로 복사했나?)`,
      ).toBeLessThanOrEqual(MAX_THUMB_BYTES);

      const full = statSync(join(PUBLIC_DIR, plate.src.replace(/^\//, ''))).size;
      expect(size, `${plate.flowerId} — 썸네일이 본판보다 작지 않다`).toBeLessThan(full);
      totalThumb += size;
    }

    // 레인 32줄이 첫 화면에서 무는 무게. 예전에는 도판 7장만으로 1.4MB 였다.
    expect(totalThumb).toBeLessThan(512 * 1024);
  });

  it('plateSrc — 좁은 자리는 썸네일로, 큰 자리는 본판으로 간다', () => {
    const commons = plateFor('tulip-white');
    const archive = plateFor('gerbera');
    if (!commons || !archive) throw new Error('도판 상수가 비었다');

    // 자체 호스팅 사본은 두 벌이다 — 44px·92px 자리(≤250)는 썸네일, 그 위는 본판.
    expect(plateSrc(commons, 250)).toBe('/plates/thumbs/tulip-white.jpg');
    expect(plateSrc(commons, 500)).toBe(commons.src);
    expect(plateSrc(commons, 1280)).toBe(commons.src);
    // 기본값이 곧 썸네일이다(부르는 쪽이 잊어도 44px 칸에 본판이 걸리지 않게).
    expect(plateSrc(commons)).toBe(plateSrc(commons, 250));

    // 다운로드가 실패해 원격 주소를 그대로 쓰는 폴백 상태에서는 폭이 살아 있어야 한다.
    const remoteCommons = { ...commons, src: commons.remoteSrc };
    expect(plateSrc(remoteCommons, 250)).toContain('/250px-');
    expect(plateSrc(remoteCommons, 250)).not.toContain('/1280px-');
    expect(plateSrc(remoteCommons, 1280)).toBe(commons.remoteSrc);

    const remoteArchive = { ...archive, src: archive.remoteSrc };
    expect(plateSrc(remoteArchive, 250)).toContain('_w400.');
    expect(plateSrc(remoteArchive, 500)).toContain('_w800.');
    expect(plateSrc(remoteArchive, 1280)).toBe(archive.remoteSrc);
  });

  /**
   * 클라이언트로 건너가는 모양의 그물 — 코드 리뷰 P1-7.
   *
   * `/stories` 청크에 `upload.wikimedia.org/...` 문자열 32벌이 실려 있었다. 레인·시트가
   * `plateFor()` 를 클라이언트에서 불러 표 전체를 끌고 갔기 때문이다. 화면은 그 주소를
   * 한 줄도 쓰지 않는다 — 그래서 건너가는 값은 `plateViewFor()` 가 좁힌 한 벌뿐이어야 한다.
   */
  it('plateViewFor — 화면이 받는 값에 취득 주소·파일 페이지가 없다', () => {
    for (const plate of Object.values(FLOWER_PLATES)) {
      const view = plateViewFor(plate.flowerId);
      if (!view) throw new Error(`${plate.flowerId} 의 뷰가 비었다`);

      // 키는 딱 다섯(있을 때만 붙는 note 포함) — 늘리려면 왜 화면에 필요한지부터 말해야 한다.
      const allowed = new Set(['flowerId', 'src', 'alt', 'note', 'sourceLine']);
      for (const key of Object.keys(view)) expect(allowed.has(key), `${key} 가 새어 나갔다`).toBe(true);

      const serialized = JSON.stringify(view);
      expect(serialized).not.toContain('upload.wikimedia.org');
      expect(serialized).not.toContain('commons.wikimedia.org');
      expect(serialized).not.toContain(plate.remoteSrc);
      expect(serialized).not.toContain(plate.pageUrl);

      // 좁혔어도 화면이 필요로 하는 것은 다 있다.
      expect(view.src).toBe(plateSrc(plate, 250));
      expect(view.alt).toBe(plate.alt);
      expect(view.sourceLine).toBe(plateSourceLine(plate));
      expect(view.note).toBe(plate.note);
    }

    expect(plateViewFor('없는-꽃')).toBeUndefined();
    // 큰 자리(도감 히어로)를 부르면 본판이 온다.
    expect(plateViewFor('tulip-white', 1280)?.src).toBe('/plates/tulip-white.jpg');
  });

  it('Advisor 확정 두 건이 그대로 반영돼 있다', () => {
    // 벚꽃 = B안(비테 세트) — A안(우키요에)이 아니다. 종을 단정하지 않는 각주가 함께 있어야 한다.
    const cherry = plateFor('cherry-blossom');
    expect(cherry?.remoteSrc).toContain('WitteHeinrichFlora1868-014');
    expect(cherry?.note).toBeTruthy();

    // 거베라 = Internet Archive 대안 — plantillustrations.org 는 취득 주소로도 남기지 않는다.
    const gerbera = plateFor('gerbera');
    expect(gerbera?.remoteSrc).toContain('archive.org');
    for (const plate of Object.values(FLOWER_PLATES)) {
      expect(plate.src).not.toContain('plantillustrations.org');
      expect(plate.remoteSrc).not.toContain('plantillustrations.org');
    }
  });

  it('크레딧은 문서 표기 형식을 지키고, 판본 단위로 합쳐진다', async () => {
    const catalog = await loadCatalog();
    const ids = catalog.flowers.map((flower) => flower.id);
    const credits = plateCredits(ids);

    for (const line of credits) {
      // `Plate: {작품명}, {연도} / {소장·제공 기관}`
      expect(line).toMatch(/^Plate: .+, .+ \/ .+$/);
    }
    // 47종이 15개 판본에서 왔다 — 줄 수가 꽃 수만큼이면 합치기가 깨진 것이다.
    // 확장 배치 1(2026-08-16)의 15종 중 12종이 스텝 《Favourite Flowers》 한 판본이라,
    // 꽃이 15종 늘어도 크레딧 줄은 그만큼 늘지 않는다 — 그게 판본을 몰아 고른 이유다.
    expect(credits.length).toBeGreaterThan(0);
    expect(credits.length).toBeLessThan(ids.length / 2);
    expect([...new Set(credits)]).toHaveLength(credits.length);

    const one = plateFor('anemone');
    if (!one) throw new Error('도판 상수가 비었다');
    expect(plateCredit(one)).toBe('Plate: Witte, Flora, 1868 / Wikimedia Commons');
  });

  /**
   * 정식 도감 확장 배치 1(2026-08-16)의 15종.
   *
   * 위 테스트는 전부 카탈로그를 돌기 때문에 **CSV 에서 꽃이 빠지면 함께 조용히 초록**이 된다.
   * 판본을 한 곳으로 몰아 고른 것이 이 배치의 설계 결정이므로, 그 사실을 이름으로 못 박는다.
   */
  it('확장 배치 1 의 15종이 전부 도판을 갖고, 열두 종이 한 판본에서 왔다', () => {
    const batch = [
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
    ];

    for (const id of batch) expect(plateFor(id), `${id} — 도판이 없다`).toBeDefined();

    const step = batch.filter(
      (id) => plateFor(id)?.work === 'Step, Favourite Flowers of Garden and Greenhouse',
    );
    expect(step).toHaveLength(12);
  });

  it('시트 각주 한 줄에 작가·연도·기관이 모두 있다', () => {
    for (const plate of Object.values(FLOWER_PLATES)) {
      const line = plateSourceLine(plate);
      expect(line.startsWith('도판: ')).toBe(true);
      expect(line).toContain(plate.artist);
      expect(line).toContain(plate.year);
      expect(line).toContain(plate.institution);
    }
  });

  it('도감 상세가 쓰는 도판이 아카이브와 같은 그림·같은 크레딧이다', async () => {
    const catalog = await loadCatalog();
    // 상수가 두 벌이던 시절 이 둘이 서로 다른 그림을 보여 줬다(벚꽃 A안/B안 · 거베라 호스트).
    for (const slug of ['cherry-blossom', 'gerbera', 'rose-red']) {
      const detail = buildFlowerDetail(catalog, slug);
      const plate = plateFor(slug);
      if (!detail || !plate) throw new Error(`${slug} 가 비었다`);
      expect(detail.plate?.src).toBe(plate.src);
      expect(detail.plate?.alt).toBe(plate.alt);
      expect(detail.plate?.credit).toBe(plateCredit(plate));
      // `note` 는 상세 화면 각주로 그대로 나간다 — 여기서 끊기면 화면이 조용히 정직함을 잃는다.
      // (cherry-blossom·rose-red 는 note 가 있고, gerbera 는 없다 — 양쪽 갈래를 함께 잡는다.)
      expect(detail.plate?.note).toBe(plate.note);
    }
  });
});

describe('STORY_CATEGORIES', () => {
  it('§1.4c 카테고리 5종을 그 순서대로 갖는다', () => {
    expect(STORY_CATEGORIES.map((category) => category.key)).toEqual([
      'forest',
      'ivory',
      'gold',
      'wine',
      'dusk',
    ]);
  });

  it('칩에 들어갈 만큼 짧은 한국어 라벨이다(영문 slug 노출 금지)', () => {
    for (const category of STORY_CATEGORIES) {
      expect(category.label).toMatch(/^[가-힣]{2,4}$/);
      expect(category.hint.length).toBeGreaterThan(0);
    }
  });

  it('꽃 도감도 같은 계열 이름을 쓴다 — 테마 색감 이름을 노출하지 않는다', async () => {
    const catalog = await loadCatalog();
    const { flowers, groups } = buildFlowerIndex(catalog);
    const allowed = new Set(STORY_CATEGORIES.map((category) => category.label));

    // 그룹 머리말(`숲빛 · 흰빛·초록빛 꽃`)
    for (const group of groups) {
      expect(allowed.has(group.label), `${group.category} 그룹 라벨이 계열 이름 밖이다`).toBe(true);
      expect(group.label).toBe(storyCategoryLabel(group.category));
    }
    // 검색 결과 카드의 계열 표기
    for (const flower of flowers) {
      expect(allowed.has(flower.categoryLabel), `${flower.slug} 카드 라벨이 계열 이름 밖이다`).toBe(
        true,
      );
    }
    // 상세 히어로(`숲빛 · 흰빛·초록빛 꽃`)
    const detail = buildFlowerDetail(catalog, 'tulip-white');
    expect(detail?.categoryLabel).toBe('숲빛');
  });
});
