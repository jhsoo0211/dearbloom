import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadCatalog } from '@/lib/data/catalog';
import { photoCredit, photoCredits, photoFor, photoSrc, photosFor } from '@/lib/photos';
import { THUMB_DIR, plateCredits, plateFor, plateViewFor } from '@/lib/plates';
import { READ_KINDS } from '../../db/seed/schemas';

/**
 * 카드 미리보기 액자 — `/reads` · `/stories` 회귀 가드 (2026-08-18 B-2).
 *
 * 사용자 요구는 한 줄이었다: "글만 있으니까 보기 좀 까다로워서." 답은 **우리 자산으로만**
 * 그림을 세우는 것이고(남의 썸네일·핫링크 금지), 그래서 이 그물이 지키는 것은 넷이다.
 *
 *   ① **빈 액자를 만들지 않는다.** 도판이나 실사 중 하나는 반드시 걸린다 — 카드마다
 *      그림이 있다 없다 하면 목록이 한 화면으로 읽히지 않는다.
 *   ② **주소가 실재한다.** 도판은 `public/plates/thumbs/` 에 파일이 있어야 하고, 실사는
 *      승인된 폭 표(`PHOTO_SOURCES`)를 지나온 주소여야 한다. 여기가 가장 잘 깨진다 —
 *      꽃이 늘고 자산이 늦으면 화면이 **조용히** 빈다.
 *   ③ **표가 브라우저로 새지 않는다.** 클라이언트 컴포넌트는 `@/lib/plates` · `@/lib/photos`
 *      를 값으로 import 하지 않는다(코드 리뷰 P1-7 — 그 한 줄이 표를 통째로 번들에 싣는다).
 *   ④ **크레딧이 그림을 따라간다.** 실사를 새 화면에 걸었으면 그 화면이 표기를 함께 진다.
 *
 * 화면 조립(`toCard`·`buildLanes`)은 서버 컴포넌트 안에 있어 직접 부를 수 없다. 그래서
 * **같은 규칙을 데이터에 대고** 확인하고, 컴포넌트 쪽 약속은 소스 문자열로 본다
 * (`bloom-calendar.test.ts` 가 쓰는 것과 같은 방법이다).
 */

const ROOT = path.resolve(__dirname, '../..');
const PUBLIC_DIR = path.join(ROOT, 'public');

function source(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8').replaceAll('\r\n', '\n');
}

/** 주석을 걷어낸 본문 — 이 저장소의 주석은 금지 규칙을 **글자 그대로** 적어 두기 때문이다. */
function code(rel: string): string {
  return source(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

/** `links_to` 에서 이 카드가 액자에 걸 꽃 — 화면과 **같은 규칙**(`flower:` 만 · 첫 종). */
function previewFlowerId(linksTo: readonly string[]): string | undefined {
  for (const entry of linksTo) {
    if (entry.startsWith('flower:')) return entry.slice('flower:'.length).trim();
  }
  return undefined;
}

describe('/reads 카드 액자', () => {
  it('도감과 이어진 카드는 전부 도판을 걸 수 있고, 그 썸네일 파일이 실제로 있다', async () => {
    const catalog = await loadCatalog();
    const linked = catalog.reads.filter((read) => previewFlowerId(read.linksTo) !== undefined);

    // 원장이 통째로 비면 아래 루프가 아무것도 안 돌고 조용히 통과한다 — 그 침묵을 막는다.
    expect(linked.length).toBeGreaterThan(0);

    for (const read of linked) {
      const flowerId = previewFlowerId(read.linksTo) as string;
      const view = plateViewFor(flowerId);
      expect(view, `${read.readId} — ${flowerId} 의 도판이 없다(액자가 조용히 빈다)`).toBeDefined();

      // 64px 액자에 ≤1100px 본판을 물리지 않는다(성능 리뷰 P0-2 가 되돌린 그 자리).
      expect(view?.src.startsWith(THUMB_DIR), `${flowerId} 가 썸네일이 아니다`).toBe(true);

      const file = path.join(PUBLIC_DIR, (view?.src ?? '').replace(/^\//, ''));
      expect(existsSync(file), `public${view?.src} 가 없다`).toBe(true);
    }
  });

  it('`links_to` 의 꽃 id 는 전부 카탈로그에 있다 — 없는 꽃이면 액자도 다리도 서지 않는다', async () => {
    const catalog = await loadCatalog();
    const known = new Set(catalog.flowers.map((flower) => flower.id));
    for (const read of catalog.reads) {
      for (const entry of read.linksTo) {
        if (!entry.startsWith('flower:')) continue;
        const id = entry.slice('flower:'.length).trim();
        expect(known.has(id), `${read.readId} 가 없는 꽃 ${id} 을 가리킨다`).toBe(true);
      }
    }
  });

  it('도감과 이어지지 않은 카드를 위해 갈래 넷 전부에 표식이 있다', () => {
    const board = source('src/components/reads/ReadsBoard.tsx');
    const table = board.slice(board.indexOf('const KIND_GLYPHS'));
    const body = table.slice(0, table.indexOf('\n};'));
    for (const kind of READ_KINDS) {
      expect(body, `KIND_GLYPHS 에 ${kind} 가 없다 — 그 갈래의 액자가 빈다`).toContain(`${kind}:`);
    }
  });

  it('액자는 지연 로드되는 장식이고, 클라이언트가 도판 표를 끌어오지 않는다', () => {
    const board = code('src/components/reads/ReadsBoard.tsx');
    expect(board).toContain("'use client'");
    // 54장이 한 화면에 실리는 목록이라 지연 로드가 전제다.
    expect(board).toContain('loading="lazy"');
    // 꽃 이름은 카드 아래 다리가, 갈래는 첫 줄 라벨이 이미 말한다 — 낭독기는 액자를 지나친다.
    expect(board).toContain('aria-hidden="true"');
    // ⚠ 이 한 줄이 들어오면 도판 59벌(취득 주소·파일 페이지 포함)이 브라우저 번들에 실린다.
    expect(board).not.toContain('@/lib/plates');
  });

  it('서버가 도판을 좁혀 싣고, 푸터가 그 판본의 크레딧을 진다', async () => {
    const page = code('src/app/reads/page.tsx');
    expect(page).toContain('plateViewFor(');
    expect(page).toContain('plateCredits(');

    const catalog = await loadCatalog();
    const used = catalog.reads
      .map((read) => previewFlowerId(read.linksTo))
      .filter((id): id is string => id !== undefined && plateFor(id) !== undefined);
    const lines = plateCredits(used);

    expect(lines.length).toBeGreaterThan(0);
    // 형식은 `docs/illustration-assets.md` 사용 규칙 4 고정 — `/stories` 푸터와 같은 말이다.
    for (const line of lines) expect(line).toMatch(/^Plate: .+, .+ \/ .+$/);
    // 판본 단위로 합쳐지므로 줄 수는 꽃 수보다 적다(그게 "일괄 표기" 의 뜻이다).
    expect(lines.length).toBeLessThan(new Set(used).size);
  });
});

describe('/stories 레인 카드 액자', () => {
  /** 레인이 서는 꽃 = 이야기가 한 편이라도 있는 꽃(서버가 빈 레인을 세우지 않는다). */
  async function laneFlowerIds(): Promise<string[]> {
    const catalog = await loadCatalog();
    const withStories = new Set(catalog.stories.map((story) => story.flowerId));
    return catalog.flowers.map((flower) => flower.id).filter((id) => withStories.has(id));
  }

  it('레인이 서는 꽃은 전부 액자에 걸 그림이 있다(실사가 없으면 도판)', async () => {
    const ids = await laneFlowerIds();
    expect(ids.length).toBeGreaterThan(0);

    for (const id of ids) {
      const has = photoFor(id) !== undefined || plateFor(id) !== undefined;
      expect(has, `${id} — 실사도 도판도 없어 카드 액자가 빈다`).toBe(true);
    }
  });

  it('카드에 거는 컷은 갤러리 첫 장과 **같은 컷**이다 (photosFor 의 약속)', async () => {
    for (const id of await laneFlowerIds()) {
      const primary = photoFor(id);
      if (!primary) continue;
      const [head] = photosFor(id);
      expect(head?.src, `${id} — 카드와 도감 첫 장이 다른 사진을 가리킨다`).toBe(primary.src);
    }
  });

  it('실사 주소는 승인된 폭 표를 지나온 640px 사본이다', async () => {
    for (const id of await laneFlowerIds()) {
      const photo = photoFor(id);
      if (!photo) continue;
      const src = photoSrc(photo, 640);
      // 폭 치환 표(`PHOTO_SOURCES`) 밖의 임의 폭 금지 — 캐시가 갈라진다.
      expect(src, `${id} 의 640px 주소가 원본 그대로다`).not.toBe(photo.src);
      expect(src).toContain('w=640');
      expect(src.startsWith('https://images.unsplash.com/') || src.startsWith('https://images.pexels.com/')).toBe(true);
    }
  });

  it('서버가 640px 로 좁혀 싣고, 클라이언트는 사진 표를 끌어오지 않는다', () => {
    const page = code('src/app/stories/page.tsx');
    expect(page).toContain('CARD_PHOTO_WIDTH = 640');
    expect(page).toContain('photoSrc(shot, CARD_PHOTO_WIDTH)');

    const lane = code('src/components/stories/StoryLane.tsx');
    expect(lane).toContain("'use client'");
    expect(lane).toContain('loading="lazy"');
    expect(lane).toContain('aria-hidden="true"');
    // ⚠ 이 한 줄이 들어오면 사진 표(47종 × 주소·크레딧·설명)가 브라우저 번들에 실린다.
    expect(lane).not.toContain('@/lib/photos');
  });

  it('푸터가 화면에 실제로 건 컷의 사진 크레딧을 전부 덮는다', async () => {
    const page = code('src/app/stories/page.tsx');
    expect(page).toContain('photoCredits(');

    const used = (await laneFlowerIds()).filter((id) => photoFor(id) !== undefined);
    const lines = photoCredits(used);
    expect(lines.length).toBeGreaterThan(0);

    for (const id of used) {
      const photo = photoFor(id);
      if (!photo) continue;
      expect(lines, `${id} 의 작가가 크레딧에서 빠졌다`).toContain(photoCredit(photo));
    }
    // 표기 형식은 `docs/image-assets.md` §사용 규칙 2 고정.
    for (const line of lines) expect(line).toMatch(/^Photo: .+ \/ (Unsplash|Pexels)$/);
  });

  it('카드 액자는 상자 크기를 CSS 가 못 박는다 — 그림이 늦게 와도 줄이 밀리지 않는다', () => {
    const css = source('src/components/stories/stories.module.css');
    const rule = css.slice(css.indexOf('.cardShot {'));
    const body = rule.slice(0, rule.indexOf('}'));
    expect(body).toMatch(/width:\s*\d+px/);
    expect(body).toMatch(/height:\s*\d+px/);

    // 자리표시 높이는 액자가 붙은 뒤 다시 잰 값이다(전 363/337 → 후 397/371).
    expect(css).toContain('--lane-h: 397px');
    expect(css).toContain('--lane-h: 371px');
  });
});
