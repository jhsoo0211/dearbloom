import { describe, expect, it } from 'vitest';

import { buildBirthDictDetail, buildBirthFlower, buildBirthMonth } from '@/components/flowers/birth-dict';
import { birthStoriesOfName } from '@/lib/data/birth-flowers';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';

/**
 * 탄생화 사전 **상세**(§C ①) — 사진 한 장과 그 이름의 이야기들이 시트까지 살아 오는가.
 *
 * 여기서 보는 것은 세 가지다.
 *   ① **경계**: 이야기 407편은 시트를 연 사람에게만 간다 — 달치 목록에는 본문이 한 글자도
 *      실리지 않는다(`/stories` 가 겪은 성능 리뷰 P1-7 을 되풀이하지 않는다).
 *   ② **이름이 주인**: 이야기는 날짜가 아니라 이름에 붙는다 — 한 이름이 여러 날에 걸리면
 *      그 날들이 **같은 이야기**를 펼쳐야 한다.
 *   ③ **빈손을 빈손이라고**: 사진 없는 날·이야기 없는 이름이 정상 값이고, 그때 응답은
 *      `null` 이 아니라 빈 배열이다(화면이 "못 불러왔다"와 "없다"를 다르게 그린다).
 */

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog();
  return cached;
}

describe('buildBirthDictDetail — 시트가 여는 하루치', () => {
  it('사진과 이야기가 함께 있는 날 (1월 1일 스노드롭)', async () => {
    const detail = buildBirthDictDetail(await catalog(), 1, 1);

    expect(detail?.photo?.src).toBe('/birth/seunodeurop.jpg');
    expect(detail?.photo?.familyLine).toBeTruthy();
    expect(detail?.stories.length).toBeGreaterThan(0);
    expect(detail?.stories[0].title).toBeTruthy();
    expect(detail?.stories[0].body.length).toBeGreaterThan(100);
  });

  it('사진만 있고 이야기는 없는 날 (1월 10일 회양목)', async () => {
    const detail = buildBirthDictDetail(await catalog(), 1, 10);

    expect(detail?.photo).toBeDefined();
    // 빈 배열이다 — `undefined` 가 아니라. 화면은 이야기 구획을 아예 세우지 않는다.
    expect(detail?.stories).toEqual([]);
  });

  it('사진도 이야기도 없는 날 (5월 19일 아리스타타)', async () => {
    const detail = buildBirthDictDetail(await catalog(), 5, 19);

    expect(detail).not.toBeNull();
    expect(detail).not.toHaveProperty('photo');
    expect(detail?.stories).toEqual([]);
  });

  it('표에 없는 날짜는 null — 화면이 폴백 문구를 세운다', async () => {
    const data = await catalog();
    expect(buildBirthDictDetail(data, 2, 30)).toBeNull();
    expect(buildBirthDictDetail(data, 13, 1)).toBeNull();
  });

  it('한 이름이 여러 날에 걸리면 그 날들이 **같은 이야기**를 펼친다', async () => {
    const data = await catalog();
    // 단양쑥부쟁이 = 7/1 · 11/5 · 12/11. 이야기는 이름에 붙으므로 셋이 같아야 한다.
    const ids = [
      buildBirthDictDetail(data, 7, 1),
      buildBirthDictDetail(data, 11, 5),
      buildBirthDictDetail(data, 12, 11),
    ].map((detail) => detail?.stories.map((story) => story.id));

    expect(ids[0]?.length).toBeGreaterThan(0);
    expect(ids[1]).toEqual(ids[0]);
    expect(ids[2]).toEqual(ids[0]);
  });

  it('사진은 반대로 **날짜마다 다를 수 있다** (삼나무 2/15 숲 · 9/30 열매)', async () => {
    const data = await catalog();
    const feb = buildBirthDictDetail(data, 2, 15);
    const sep = buildBirthDictDetail(data, 9, 30);

    expect(feb?.photo?.src).toBe('/birth/samnamu-0215.jpg');
    expect(sep?.photo?.src).toBe('/birth/samnamu-0930.jpg');
    // 그런데 이야기는 같은 이름의 것이라 같다.
    expect(sep?.stories.map((s) => s.id)).toEqual(feb?.stories.map((s) => s.id));
  });
});

describe('이야기의 각주 — /stories 시트와 같은 말을 쓴다', () => {
  it('문화권·시대가 한국어로 온다 (영문 slug 가 화면에 새지 않는다)', async () => {
    const data = await catalog();
    for (const row of data.birthFlowers) {
      for (const story of buildBirthDictDetail(data, row.month, row.day)?.stories ?? []) {
        for (const note of story.notes) {
          expect(note.text, `${story.id} — ${note.key}`).not.toMatch(/[a-z]{3}/i);
        }
      }
    }
  });

  it('갈래와 신뢰는 모든 편에 붙는다 (문화권·시대는 없을 수 있다)', async () => {
    const detail = buildBirthDictDetail(await catalog(), 1, 1);
    for (const story of detail?.stories ?? []) {
      const keys = story.notes.map((note) => note.key);
      expect(keys).toContain('type');
      expect(keys).toContain('confidence');
    }
  });

  it('출처는 사람이 읽는 이름으로 온다 (퓨니코드·맨 URL 금지)', async () => {
    const data = await catalog();
    let checked = 0;
    for (const row of data.birthFlowers) {
      for (const story of buildBirthDictDetail(data, row.month, row.day)?.stories ?? []) {
        if (!story.sourceUrl) continue;
        checked += 1;
        expect(story.sourceLabel, story.id).toBeTruthy();
        expect(story.sourceLabel).not.toContain('xn--');
        expect(story.sourceLabel).not.toMatch(/^https?:/);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('성능 경계 — 407편은 목록에 실리지 않는다', () => {
  it('달치 목록에 이야기 본문이 한 글자도 없다', async () => {
    const data = await catalog();
    // 1월 1일 스노드롭 첫 편의 본문 한 조각. 목록에 이것이 있으면 경계가 무너진 것이다.
    const sample = birthStoriesOfName(data.birthStories, '스노드롭')[0].storyKo.slice(0, 24);
    expect(sample.length).toBe(24);

    for (let month = 1; month <= 12; month += 1) {
      const json = JSON.stringify(buildBirthMonth(data, month));
      expect(json, `${month}월`).not.toContain(sample);
    }
  });

  it('시트 한 장은 8KB 를 넘지 않는다 (가장 무거운 날 기준)', async () => {
    const data = await catalog();
    for (const row of data.birthFlowers) {
      const bytes = Buffer.byteLength(
        JSON.stringify(buildBirthDictDetail(data, row.month, row.day)),
        'utf8',
      );
      expect(bytes, `${row.month}/${row.day} ${row.nameKo} — ${bytes}B`).toBeLessThan(8_000);
    }
  });

  it('407편이 하나도 빠짐없이 어느 날짜에서든 닿는다 (사장되는 이야기 0)', async () => {
    const data = await catalog();
    const reachable = new Set<string>();
    for (const row of data.birthFlowers) {
      for (const story of buildBirthDictDetail(data, row.month, row.day)?.stories ?? []) {
        reachable.add(story.id);
      }
    }
    expect(reachable.size).toBe(data.birthStories.length);
    // 2026-08-17 소재 중복 정리로 416 → 407 (도도나·로열오크·민테×2·정이품송·스패그넘·사이호지·삼나무 조림·페르세포네 — 각 이름에서 더 검증된 한 벌만 남김).
    expect(reachable.size).toBe(407);
  });
});

describe('생일 꽃 찾기 카드 — 사진과 크레딧이 한 몸이다', () => {
  it('사진이 오면 크레딧 세 칸도 함께 온다', async () => {
    const view = buildBirthFlower(await catalog(), 1, 1);

    expect(view?.nameKo).toBe('스노드롭');
    expect(view?.photo?.thumbSrc).toBe('/birth/thumbs/seunodeurop.jpg');
    expect(view?.photo?.author).toBeTruthy();
    expect(view?.photo?.license).toBeTruthy();
    expect(view?.photo?.pageUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
  });

  it('사진이 없는 날은 photo 키 자체가 없다', async () => {
    const view = buildBirthFlower(await catalog(), 5, 19);

    expect(view?.nameKo).toBe('아리스타타');
    expect(view).not.toHaveProperty('photo');
  });

  it('표에 없는 날짜는 null', async () => {
    expect(buildBirthFlower(await catalog(), 2, 30)).toBeNull();
  });
});

describe('표 정정 — 2026-08-16 이름·영문명 교정이 화면까지 살아 있다', () => {
  it('오탈자 이름 다섯이 바로잡혀 있다', async () => {
    const names = new Set((await catalog()).birthFlowers.map((row) => row.nameKo));

    for (const wrong of ['서양까지밥나무', '좁은입배풍동', '조팝나물', '개옻나무', '튜베 로즈']) {
      expect(names.has(wrong), wrong).toBe(false);
    }
    for (const right of ['서양까치밥나무', '좁은잎배풍등', '조밥나물', '안개나무', '튜베로즈']) {
      expect(names.has(right), right).toBe(true);
    }
  });

  it('이름을 고친 날은 사진·이야기도 같은 이름을 부른다', async () => {
    const data = await catalog();
    // 11월 25일 = 안개나무(옛 표기 개옻나무). 학명 Rhus cotinus 를 따라 바로잡은 날이다.
    const detail = buildBirthDictDetail(data, 11, 25);
    expect(detail?.photo).toBeDefined();
    expect(detail?.stories.length).toBeGreaterThan(0);

    const photo = data.birthPhotos.find((row) => row.month === 11 && row.day === 25);
    expect(photo?.nameKo).toBe('안개나무');
  });

  it('다른 식물을 가리키던 영문명이 국명 기준으로 바뀌었다', async () => {
    const data = await catalog();
    const at = (month: number, day: number) =>
      data.birthFlowers.find((row) => row.month === month && row.day === day);

    expect(at(10, 29)?.nameEn).toBe('Rugosa Rose'); // was Crab Apple (Malus)
    expect(at(9, 26)?.nameEn).toBe('Persimmon'); // was Date Plum (D. lotus)
    expect(at(9, 30)?.nameEn).toBe('Japanese Cedar'); // was Cedar (Cedrus)
    expect(at(12, 30)?.nameEn).toBe('Wintersweet'); // was Carolina Allspice (Calycanthus)
  });

  it('영문명이 없는 한국 특산종에는 이름을 지어내지 않았다 (단양쑥부쟁이 3일)', async () => {
    const data = await catalog();
    const rows = data.birthFlowers.filter((row) => row.nameKo === '단양쑥부쟁이');

    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row).not.toHaveProperty('nameEn');
  });
});
