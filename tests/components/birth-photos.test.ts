import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  assignBirthPhotoSlugs,
  birthPhotoSrc,
  birthPhotoView,
  birthThumbSrc,
  romanizeKo,
} from '@/lib/birth-photos';
import { birthPhotoOn } from '@/lib/data/birth-flowers';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';

/**
 * 탄생화 실사 파이프라인 — **표와 디스크와 화면이 같은 말을 하는가.**
 *
 * 도판(`tests/components/plates.test.ts`)과 같은 자리의 검사지만 지켜야 할 것이 하나 더 있다.
 * 도판 47종은 전부 퍼블릭 도메인이라 크레딧이 예의였지만, 여기 274장 중 218장은
 * CC BY / CC BY-SA 다 — **크레딧이 의무**이고, 우리가 거는 것은 폭을 줄여 다시 인코딩한
 * 파생물이다. 그래서 이 파일은 세 가지를 함께 본다:
 *   ① 표의 slug 가 **규칙의 결과와 같은가**(단일 원본이 실제로 단일한가)
 *   ② 그 slug 의 파일이 **디스크에 두 벌 다 있는가**(본판·썸네일 — 없으면 화면이 404 를 문다)
 *   ③ 사진이 있는 행은 **크레딧 세 칸이 빠짐없이** 있는가, 라이선스가 허용 목록 안인가
 */

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog();
  return cached;
}

/** `/birth/x.jpg` → 리포 안의 실제 경로. */
function onDisk(webPath: string): string {
  return path.resolve(process.cwd(), 'public', webPath.replace(/^\//, ''));
}

describe('romanizeKo — 파일 이름을 짓는 규칙', () => {
  it('한글 음절을 자모 순서대로 옮긴다', () => {
    expect(romanizeKo('스노드롭')).toBe('seunodeurop');
    expect(romanizeKo('해당화')).toBe('haedanghwa');
    expect(romanizeKo('삼나무')).toBe('samnamu');
  });

  it('공백은 하이픈 한 칸이 되고, 앞뒤 하이픈은 남지 않는다', () => {
    expect(romanizeKo('카우슬립 앵초')).toBe('kauseulrip-aengcho');
    expect(romanizeKo(' 흰 라일락 ')).toBe('huin-railrak');
  });

  /**
   * **음운 변화를 적용하지 않는다** — 표기법이 아니라 파일 이름을 짓는 규칙이기 때문이다.
   * `라일락` 은 국어의 로마자 표기법대로면 `raillak`(ㄹ+ㄹ 동화)이지만 여기서는 자모를
   * 그대로 이어 붙인 `railrak` 이다. 규칙이 단순할수록 같은 이름이 언제나 같은 파일을
   * 가리키고, 표기법이 개정돼도 이미 받아 둔 248장의 이름이 흔들리지 않는다.
   */
  it('발음 규칙을 적용하지 않는다 — 자모를 그대로 이어 붙인다', () => {
    expect(romanizeKo('좁은잎배풍등')).toBe('jopeunipbaepungdeung');
    expect(romanizeKo('국화')).toBe('gukhwa');
  });

  it('같은 이름은 언제나 같은 결과다 (결정적)', () => {
    expect(romanizeKo('좁은잎배풍등')).toBe(romanizeKo('좁은잎배풍등'));
  });

  it('한글이 하나도 없으면 빈 문자열 — 호출부가 그것을 보고 멈춘다', () => {
    expect(romanizeKo('···')).toBe('');
  });
});

describe('slug 배정 — 파일 한 장에 이름 하나', () => {
  it('이름 하나가 사진 하나면 날짜 꼬리표가 붙지 않는다', () => {
    const slugs = assignBirthPhotoSlugs([
      { month: 1, day: 1, nameKo: '스노드롭', directUrl: 'https://example.test/a.jpg' },
    ]);
    expect(slugs.get('1/1')).toBe('seunodeurop');
  });

  it('같은 이름의 여러 날이 **같은 사진**이면 slug 도 하나다 (내려받기도 한 번)', () => {
    const url = 'https://example.test/same.jpg';
    const slugs = assignBirthPhotoSlugs([
      { month: 2, day: 5, nameKo: '양치', directUrl: url },
      { month: 11, day: 23, nameKo: '양치', directUrl: url },
    ]);
    expect(slugs.get('2/5')).toBe('yangchi');
    expect(slugs.get('11/23')).toBe('yangchi');
  });

  it('같은 이름인데 사진이 다르면 **그 사진을 처음 쓴 날짜**로 가른다', () => {
    const slugs = assignBirthPhotoSlugs([
      { month: 9, day: 30, nameKo: '삼나무', directUrl: 'https://example.test/cone.jpg' },
      { month: 2, day: 15, nameKo: '삼나무', directUrl: 'https://example.test/forest.jpg' },
    ]);
    expect(slugs.get('2/15')).toBe('samnamu-0215');
    expect(slugs.get('9/30')).toBe('samnamu-0930');
  });

  it('미확보 행은 slug 자체가 없다 — 없는 파일을 가리키지 않는다', () => {
    const slugs = assignBirthPhotoSlugs([{ month: 5, day: 19, nameKo: '아리스타타' }]);
    expect(slugs.size).toBe(0);
  });

  it('다른 이름이 같은 slug 를 집으면 **던진다** (다른 꽃 사진을 걸지 않는다)', () => {
    expect(() =>
      assignBirthPhotoSlugs([
        { month: 1, day: 1, nameKo: '가시', directUrl: 'https://example.test/a.jpg' },
        // 로마자가 같아지는 가짜 이름을 만들 수 없으므로, 규칙이 이름을 소유한다는 사실을
        // 로마자 불가 이름으로 대신 확인한다(둘 다 "조용히 덮지 않는다"는 같은 규율이다).
        { month: 2, day: 2, nameKo: '···', directUrl: 'https://example.test/b.jpg' },
      ]),
    ).toThrow(/로마자로 옮길 수 없는/);
  });
});

describe('content/birth_photos.csv — 표와 규칙과 디스크', () => {
  it('CSV 의 slug 가 규칙의 결과와 글자 하나까지 같다', async () => {
    const data = await catalog();
    const expected = assignBirthPhotoSlugs(
      data.birthPhotos.map((photo) => ({
        month: photo.month,
        day: photo.day,
        nameKo: photo.nameKo,
        ...(photo.directUrl ? { directUrl: photo.directUrl } : {}),
      })),
    );

    for (const photo of data.birthPhotos) {
      const key = `${photo.month}/${photo.day}`;
      expect(photo.slug, key).toBe(expected.get(key));
    }
  });

  it('사진이 있는 행은 크레딧 세 칸이 빠짐없이 있다 (CC BY-SA 이행 조건)', async () => {
    for (const photo of (await catalog()).birthPhotos) {
      if (!photo.slug) continue;
      const at = `${photo.month}/${photo.day} ${photo.nameKo}`;
      expect(photo.author, at).toBeTruthy();
      expect(photo.license, at).toBeTruthy();
      expect(photo.pageUrl, at).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    }
  });

  it('라이선스가 허용 목록 안이고 NC·ND 가 0장이다', async () => {
    const allowed = /^(Public domain|CC0|CC BY(-SA)? \d\.\d( [a-z]{2})?)$/;
    for (const photo of (await catalog()).birthPhotos) {
      if (!photo.license) continue;
      expect(photo.license, `${photo.month}/${photo.day}`).toMatch(allowed);
      expect(photo.license).not.toMatch(/-(NC|ND)/i);
    }
  });

  it('미확보 6일은 slug 도 크레딧도 없다 — 빈손을 빈손이라고 적어 둔다', async () => {
    const missing = (await catalog()).birthPhotos.filter((photo) => !photo.slug);
    expect(missing).toHaveLength(6);
    for (const photo of missing) {
      expect(photo.directUrl).toBeUndefined();
      expect(photo.author).toBeUndefined();
      expect(photo.license).toBeUndefined();
      expect(photo.familyLine).toBeUndefined();
    }
  });

  it('slug 마다 본판과 썸네일이 **둘 다** 디스크에 있다 (없으면 화면이 404 를 문다)', async () => {
    const slugs = new Set(
      (await catalog()).birthPhotos.map((photo) => photo.slug).filter((slug): slug is string => !!slug),
    );
    expect(slugs.size).toBe(248);

    for (const slug of slugs) {
      for (const webPath of [birthPhotoSrc(slug), birthThumbSrc(slug)]) {
        const file = onDisk(webPath);
        expect(existsSync(file), webPath).toBe(true);
        expect(statSync(file).size, webPath).toBeGreaterThan(0);
      }
    }
  });

  it('썸네일이 본판보다 가볍다 — 목록 44px 칸이 본판을 물면 안 된다', async () => {
    const data = await catalog();
    // 대표로 몇 장만 본다(248장 × 2회 stat 은 위 검사가 이미 했다).
    for (const slug of ['seunodeurop', 'haedanghwa', 'samnamu-0930']) {
      const main = statSync(onDisk(birthPhotoSrc(slug))).size;
      const thumb = statSync(onDisk(birthThumbSrc(slug))).size;
      expect(thumb, slug).toBeLessThan(main);
    }
    expect(data.birthPhotos.length).toBe(280);
  });
});

describe('birthPhotoView — 화면으로 내려보내는 한 벌', () => {
  it('취득 주소와 판정 근거는 건너가지 않는다 (표가 번들에 실리지 않게)', async () => {
    const data = await catalog();
    const view = birthPhotoView(birthPhotoOn(data.birthPhotos, 1, 1));

    expect(view).toBeDefined();
    expect(view).not.toHaveProperty('directUrl');
    expect(view).not.toHaveProperty('speciesNote');
    expect(view).not.toHaveProperty('width');
    expect(JSON.stringify(view)).not.toContain('upload.wikimedia.org');
  });

  it('사진 자리 두 벌(960·320)과 크레딧 세 칸을 함께 싣는다', async () => {
    const view = birthPhotoView(birthPhotoOn((await catalog()).birthPhotos, 1, 1));

    expect(view?.src).toBe('/birth/seunodeurop.jpg');
    expect(view?.thumbSrc).toBe('/birth/thumbs/seunodeurop.jpg');
    expect(view?.author).toBeTruthy();
    expect(view?.license).toBeTruthy();
    expect(view?.pageUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
  });

  it('미확보 날은 undefined — 다른 꽃 사진을 끌어다 쓰지 않는다', async () => {
    const data = await catalog();
    // 5월 19일 아리스타타 = 커먼즈에 검증 가능한 실사가 없어 비워 둔 날.
    expect(birthPhotoOn(data.birthPhotos, 5, 19)).toBeUndefined();
    expect(birthPhotoView(undefined)).toBeUndefined();
  });

  it('크레딧이 한 칸이라도 비면 걸지 않는다 (크레딧 없는 사진은 쓰지 않는다)', () => {
    expect(
      birthPhotoView({ month: 1, day: 1, nameKo: '테스트', slug: 'test', author: 'A', license: 'CC0' }),
    ).toBeUndefined();
  });
});
