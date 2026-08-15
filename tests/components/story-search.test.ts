/**
 * `/stories` 아카이브 검색의 **규칙** — 무엇이 걸리고 무엇이 안 걸리는가.
 *
 * 화면(콤보박스)이 아니라 매칭만 본다. 정규화가 `/flowers` 와 같은 함수라
 * 대소문자·공백·하이픈·학명의 `×` 차이가 사라지는지, 결과 상한과 "더 있어요" 숫자가
 * 맞는지, 그리고 **빈 질의가 전량을 쏟지 않는지**를 못 박는다.
 */

import { describe, expect, it } from 'vitest';

import {
  HIT_CAP,
  flowerSearchKey,
  searchArchive,
  storySearchKey,
  type SearchableFlower,
  type SearchableStory,
} from '@/components/stories/search';

function flower(flowerId: string, nameKo: string, nameEn: string, scientificName: string): SearchableFlower {
  return {
    flowerId,
    nameKo,
    searchKey: flowerSearchKey({ nameKo, nameEn, scientificName }),
    count: 3,
  };
}

function story(storyId: string, title: string, hook: string, flowerNameKo: string): SearchableStory {
  return { storyId, title, flowerNameKo, searchKey: storySearchKey({ title, hook }) };
}

const FLOWERS = [
  flower('tulip-white', '흰 튤립', 'White Tulip', 'Tulipa gesneriana'),
  flower('rose-red', '붉은 장미', 'Red Rose', 'Rosa hybrida'),
  flower('gypsophila', '안개꽃', "Baby's Breath", 'Gypsophila paniculata'),
];

const STORIES = [
  story('s1', '오스만 궁정의 튤립', '술탄의 정원에 핀 신성한 꽃', '흰 튤립'),
  story('s2', '아프로디테의 장미', '여신이 흘린 피로 붉어졌다는 이야기', '붉은 장미'),
  story('s3', '튤립 마니아', '구근 하나가 집 한 채 값이 되던 시절', '흰 튤립'),
];

describe('searchArchive — 꽃과 이야기를 함께 훑는다', () => {
  it('꽃 이름 부분 일치로 레인을 찾는다', () => {
    const result = searchArchive('튤립', FLOWERS, STORIES);
    expect(result.flowers.map((hit) => hit.flowerId)).toEqual(['tulip-white']);
    // 같은 질의가 이야기 제목에도 걸린다 — 두 갈래는 서로를 가리지 않는다.
    expect(result.stories.map((hit) => hit.storyId)).toEqual(['s1', 's3']);
    expect(result.hasHit).toBe(true);
  });

  it('영문명·학명으로도 찾는다(대소문자 무시)', () => {
    expect(searchArchive('rosa', FLOWERS, STORIES).flowers.map((hit) => hit.flowerId)).toEqual([
      'rose-red',
    ]);
    expect(searchArchive('GESNERIANA', FLOWERS, STORIES).flowers.map((hit) => hit.flowerId)).toEqual(
      ['tulip-white'],
    );
  });

  it("공백·어깨점 차이를 지운다(baby's breath → Baby's Breath)", () => {
    expect(searchArchive("baby's breath", FLOWERS, STORIES).flowers[0]?.flowerId).toBe('gypsophila');
    expect(searchArchive('babysbreath', FLOWERS, STORIES).flowers[0]?.flowerId).toBe('gypsophila');
  });

  it('이야기는 제목과 hook 을 함께 본다', () => {
    expect(searchArchive('아프로디테', FLOWERS, STORIES).stories.map((s) => s.storyId)).toEqual([
      's2',
    ]);
    // hook 에만 있는 말
    expect(searchArchive('구근', FLOWERS, STORIES).stories.map((s) => s.storyId)).toEqual(['s3']);
  });

  it('빈 질의·기호만 적은 질의는 아무것도 걸지 않는다(전량이 쏟아지지 않게)', () => {
    for (const query of ['', '   ', '···']) {
      const result = searchArchive(query, FLOWERS, STORIES);
      expect(result.flowers).toEqual([]);
      expect(result.stories).toEqual([]);
      expect(result.hasHit).toBe(false);
    }
  });

  it('걸리는 것이 없으면 hasHit 이 false 다', () => {
    const result = searchArchive('zzzz', FLOWERS, STORIES);
    expect(result.hasHit).toBe(false);
    expect(result.flowerMore).toBe(0);
    expect(result.storyMore).toBe(0);
  });

  it('갈래마다 최대 6개까지 세우고 나머지 수를 따로 알린다', () => {
    const many = Array.from({ length: 9 }, (_, index) =>
      story(`m${index}`, `튤립 이야기 ${index}`, '', '흰 튤립'),
    );
    const result = searchArchive('튤립', FLOWERS, many);
    expect(HIT_CAP).toBe(6);
    expect(result.stories).toHaveLength(6);
    expect(result.storyMore).toBe(3);
    // 순서는 입력 순서 그대로다(점수로 섞지 않는다).
    expect(result.stories.map((hit) => hit.storyId)).toEqual(['m0', 'm1', 'm2', 'm3', 'm4', 'm5']);
  });
});
