import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadCatalog } from '@/lib/data/catalog';
import {
  READ_FLOWER_PREFIX,
  readFlowerIds,
  readsForFlower,
  readsForFlowerInScreenOrder,
} from '@/lib/data/reads-links';
import type { CatalogRead } from '@/lib/data/types';

/**
 * §1.5t 읽을거리 ↔ 도감의 **역방향 조회** 그물.
 *
 * 세 층을 본다.
 *   ① 순수 규칙 — 접두사 판정·차례 보존·행사 우선(작은 가짜 입력으로).
 *   ② 원장과의 대조 — `content/reads.csv` 가 실제로 가리키는 꽃이 도감에 있는가.
 *   ③ **경계** — 이 함수가 사는 파일에 서버 전용 의존이 새어 들지 않았는가.
 *      ③ 이 가장 값싸 보이지만 가장 자주 깨진다: 한 줄만 잘못 import 해도
 *      `npm run build:static` 이 죽는데, 그 사실은 몇 분짜리 빌드 끝에야 드러난다.
 */

function read(overrides: Partial<CatalogRead> & { linksTo: string[] }): CatalogRead {
  return {
    readId: 'read-x',
    kind: 'article',
    title: '어떤 글',
    sourceTitle: '어떤 매체',
    sourceUrl: 'https://example.com',
    summaryKo: '한 줄이에요.',
    access: 'open',
    confidenceLevel: 'repeated',
    reviewedAt: '2026-08-18',
    tags: [],
    ...overrides,
  };
}

describe('§1.5t 역방향 조회 — 순수 규칙 (reads-links.ts)', () => {
  it('`flower:` 만 도감 id 로 읽는다 — color·theme 은 목적지가 없어 세지 않는다', () => {
    const ids = readFlowerIds(read({ linksTo: ['flower:rose-red', 'color:red', 'theme:autumn'] }));
    expect(ids).toEqual(['rose-red']);
  });

  it('접두사 뒤가 비면 버린다 — 빈 id 는 어떤 꽃과도 이어지지 않는다', () => {
    expect(readFlowerIds(read({ linksTo: [READ_FLOWER_PREFIX, 'flower:   '] }))).toEqual([]);
  });

  it('가리키는 꽃이 없는 행은 빈 배열 — 원장 54건 중 30건이 그렇다(정상 값)', () => {
    expect(readFlowerIds(read({ linksTo: [] }))).toEqual([]);
  });

  it('그 꽃을 가리키는 행만 고르고, 원장 차례를 흔들지 않는다', () => {
    const reads = [
      read({ readId: 'a', linksTo: ['flower:rose-red'] }),
      read({ readId: 'b', linksTo: ['flower:peony'] }),
      read({ readId: 'c', linksTo: ['flower:peony', 'flower:rose-red'] }),
    ];
    expect(readsForFlower('rose-red', reads).map((row) => row.readId)).toEqual(['a', 'c']);
  });

  it('id 가 비면 아무것도 고르지 않는다 — 빈 문자열이 전부를 부르는 일이 없게', () => {
    expect(readsForFlower('', [read({ linksTo: ['flower:rose-red'] })])).toEqual([]);
  });

  it('부분 일치로 걸리지 않는다 — `rose` 가 `rose-red` 를 부르지 않는다', () => {
    expect(readsForFlower('rose', [read({ linksTo: ['flower:rose-red'] })])).toEqual([]);
  });

  it('화면 차례는 **행사 먼저**, 그 안에서는 원장 차례 그대로다', () => {
    const reads = [
      read({ readId: 'article-1', kind: 'article', linksTo: ['flower:tulip-white'] }),
      read({ readId: 'event-1', kind: 'event', linksTo: ['flower:tulip-white'] }),
      read({ readId: 'guide-1', kind: 'guide', linksTo: ['flower:tulip-white'] }),
      read({ readId: 'event-2', kind: 'event', linksTo: ['flower:tulip-white'] }),
    ];
    expect(readsForFlowerInScreenOrder('tulip-white', reads).map((row) => row.readId)).toEqual([
      'event-1',
      'event-2',
      'article-1',
      'guide-1',
    ]);
  });

  it('원본 배열을 바꾸지 않는다', () => {
    const reads = [
      read({ readId: 'a', kind: 'article', linksTo: ['flower:peony'] }),
      read({ readId: 'b', kind: 'event', linksTo: ['flower:peony'] }),
    ];
    readsForFlowerInScreenOrder('peony', reads);
    expect(reads.map((row) => row.readId)).toEqual(['a', 'b']);
  });
});

describe('§1.5t 역방향 조회 — 원장과의 대조 (content/reads.csv)', () => {
  it('원장이 가리키는 꽃은 전부 도감에 있고, 이어진 꽃이 하나라도 있다', async () => {
    const catalog = await loadCatalog();
    const known = new Set(catalog.flowers.map((flower) => flower.id));

    const linked = new Set<string>();
    for (const row of catalog.reads) {
      for (const id of readFlowerIds(row)) {
        // 교차 검증 9 가 시드에서 이미 막지만, 화면이 믿는 경로에서도 한 번 더 본다.
        expect(known.has(id), `${row.readId} → ${id}`).toBe(true);
        linked.add(id);
      }
    }

    expect(linked.size).toBeGreaterThan(0);
    // 이어진 꽃마다 조회가 실제로 그 행을 되찾아 온다(역방향이 정방향과 같은 표를 본다).
    for (const id of linked) {
      expect(readsForFlower(id, catalog.reads).length, id).toBeGreaterThan(0);
    }
  });

  it('이어지지 않은 꽃은 빈손이다 — 결과 화면에 아무것도 붙지 않는 것이 정상', async () => {
    const catalog = await loadCatalog();
    const linked = new Set(catalog.reads.flatMap(readFlowerIds));
    const orphan = catalog.flowers.find((flower) => !linked.has(flower.id));

    expect(orphan, '이어지지 않은 꽃이 하나는 있어야 이 규칙을 잴 수 있다').toBeDefined();
    expect(readsForFlower(orphan!.id, catalog.reads)).toEqual([]);
  });
});

describe('§1.5t 경계 — 순수 모듈이 서버 전용 의존을 물지 않는다', () => {
  /**
   * ⚠ 이 두 검사를 지우지 마라.
   *
   * `readsForFlower` 를 부르는 `app/recommend/build-result.ts` 는 정적 데모에서
   * **브라우저 번들에 통째로 들어간다.** `node:fs`(또는 그것을 쓰는 `reads-festivals`)를
   * 한 줄이라도 물면 `npm run build:static` 이 죽는데, 그 사실은 몇 분짜리 빌드 끝에야
   * 드러난다. 여기서 소스로 잡으면 1초 만에 드러난다.
   */
  /**
   * 그 파일이 실제로 **가져오는 것**들 — 주석에 적힌 파일 이름에 걸려 헛경보가 나지 않게
   * `from '…'` 자리만 본다(이 저장소의 머리말은 남의 파일 이름을 자주 언급한다).
   */
  async function importsOf(relative: string): Promise<string[]> {
    const text = await readFile(path.resolve(process.cwd(), relative), 'utf8');
    return [...text.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1]);
  }

  it('reads-links.ts 는 node 모듈도 축제 로더도 import 하지 않는다', async () => {
    const modules = await importsOf('src/lib/data/reads-links.ts');
    expect(modules.filter((name) => name.startsWith('node:'))).toEqual([]);
    expect(modules.some((name) => name.includes('reads-festivals'))).toBe(false);
  });

  it('build-result.ts 는 축제 로더가 아니라 reads-links 를 본다', async () => {
    const modules = await importsOf('src/app/recommend/build-result.ts');
    expect(modules).toContain('@/lib/data/reads-links');
    expect(modules.some((name) => name.includes('reads-festivals'))).toBe(false);
    expect(modules.filter((name) => name.startsWith('node:'))).toEqual([]);
  });
});
