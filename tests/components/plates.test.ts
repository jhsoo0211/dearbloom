import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildFlowerIndex, buildFlowerDetail } from '@/components/flowers/data';
import { STORY_CATEGORIES, storyCategoryLabel } from '@/components/stories/categories';
import { loadCatalog } from '@/lib/data/catalog';
import {
  FLOWER_PLATES,
  plateCredit,
  plateCredits,
  plateFor,
  plateSourceLine,
  plateSrc,
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

  it('plateSrc — 로컬 사본은 그대로, 원격 폴백은 폭만 갈아 끼운다', () => {
    const commons = plateFor('tulip-white');
    const archive = plateFor('gerbera');
    if (!commons || !archive) throw new Error('도판 상수가 비었다');

    // 자체 호스팅 사본은 폭 변형이 없다(파일이 한 벌뿐이다).
    expect(plateSrc(commons, 250)).toBe(commons.src);
    expect(plateSrc(commons, 1280)).toBe(commons.src);

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
    // 31종이 14개 판본에서 왔다 — 줄 수가 꽃 수만큼이면 합치기가 깨진 것이다.
    expect(credits.length).toBeGreaterThan(0);
    expect(credits.length).toBeLessThan(ids.length);
    expect([...new Set(credits)]).toHaveLength(credits.length);

    const one = plateFor('anemone');
    if (!one) throw new Error('도판 상수가 비었다');
    expect(plateCredit(one)).toBe('Plate: Witte, Flora, 1868 / Wikimedia Commons');
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
