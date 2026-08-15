import { describe, expect, it } from 'vitest';

import { STORY_CATEGORIES } from '@/components/stories/categories';
import {
  FLOWER_PLATES,
  plateCredit,
  plateCredits,
  plateFor,
  plateSourceLine,
  plateSrc,
} from '@/components/stories/plates';
import { loadCatalog } from '@/lib/data/catalog';

/**
 * 세밀화 도판 상수의 그물.
 *
 * 도판은 화면이 아니라 **데이터**라 눈으로 보기 전에 여기서 걸러야 한다. 특히 잡고 싶은 것:
 *   · 카탈로그에 꽃이 늘었는데 도판을 안 붙인 경우(레인 헤더만 조용히 빈다)
 *   · URL 폭 규칙을 깬 경우(위키미디어는 표준 폭 밖 요청을 거절한다)
 *   · 크레딧 표기 형식이 문서(`docs/illustration-assets.md` 사용 규칙 4)에서 벗어난 경우
 */

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

  it('URL 은 https 이고, 취득 폭은 문서가 정한 1280px 표준 썸네일이다', () => {
    for (const plate of Object.values(FLOWER_PLATES)) {
      expect(plate.src.startsWith('https://')).toBe(true);
      expect(plate.pageUrl.startsWith('https://')).toBe(true);
      // 위키미디어(30종)는 표준 썸네일, gerbera 1종만 Internet Archive 의 `_w1800`.
      const known = plate.src.includes('/1280px-') || plate.src.includes('_w1800.');
      expect(known, `${plate.flowerId} 의 src 가 아는 폭 패턴이 아니다`).toBe(true);
    }
  });

  it('plateSrc 는 두 호스트 모두에서 폭만 갈아 끼운다', () => {
    const commons = plateFor('tulip-white');
    const archive = plateFor('gerbera');
    if (!commons || !archive) throw new Error('도판 상수가 비었다');

    expect(plateSrc(commons, 250)).toContain('/250px-');
    expect(plateSrc(commons, 250)).not.toContain('/1280px-');
    expect(plateSrc(commons, 1280)).toBe(commons.src);

    expect(plateSrc(archive, 250)).toContain('_w400.');
    expect(plateSrc(archive, 500)).toContain('_w800.');
    expect(plateSrc(archive, 1280)).toBe(archive.src);
  });

  it('Advisor 확정 두 건이 그대로 반영돼 있다', () => {
    // 벚꽃 = B안(비테 세트) — A안(우키요에)이 아니다. 종을 단정하지 않는 각주가 함께 있어야 한다.
    const cherry = plateFor('cherry-blossom');
    expect(cherry?.src).toContain('WitteHeinrichFlora1868-014');
    expect(cherry?.note).toBeTruthy();

    // 거베라 = Internet Archive 대안 — plantillustrations.org 를 런타임에 부르지 않는다.
    const gerbera = plateFor('gerbera');
    expect(gerbera?.src).toContain('archive.org');
    for (const plate of Object.values(FLOWER_PLATES)) {
      expect(plate.src).not.toContain('plantillustrations.org');
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
});
