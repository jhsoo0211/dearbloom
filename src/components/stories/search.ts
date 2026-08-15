/**
 * 아카이브 검색의 **규칙** — 무엇을 무엇에 견주는가. 화면은 `ArchiveSearch.tsx` 가 그린다.
 *
 * ── 정규화는 `/flowers` 와 **같은 함수**를 쓴다 ──────────────────────
 * `normalizeQuery` 하나를 `components/flowers/category.ts` 에서 그대로 가져온다. 복사하면
 * 그 순간에는 같아 보여도, 한쪽만 고쳐지는 날 "같은 말을 적었는데 화면마다 다른 결과" 가
 * 된다(NFD→NFC 되돌리기를 빠뜨리면 한국어가 통째로 지워지는, 되풀이하기 쉬운 함정이다).
 * 그 파일은 화면 표시값과 정규화만 든 순수 모듈이라 엔진·로더를 끌고 오지 않는다 —
 * `/stories` 클라이언트 번들의 경계는 그대로다.
 *
 * ── 무엇을 훑는가 ──────────────────────────────────────────────────
 *   · 꽃  — 이름 세 가지(한국어명·영문명·학명). `/flowers` 와 같은 색인이라
 *           "튤" · "rosa" · "baby's breath" 가 모두 걸린다.
 *   · 이야기 — 제목과 hook(티저 한 줄).
 * 이야기 **본문**은 일부러 넣지 않는다. 본문까지 훑으면 "사랑" 한 번에 수십 편이 걸려
 * 목록이 아니라 소음이 된다(`/flowers` 가 꽃말을 색인에서 뺀 것과 같은 판단).
 *
 * 색인은 두 갈래로 만든다. 꽃 색인은 **서버**가 만들어 내려보내고(영문명·학명이 화면에
 * 없다), 이야기 색인은 제목·hook 이 이미 화면에 있으므로 **클라이언트가 한 번** 만든다
 * (같은 문자열을 payload 에 두 번 실을 이유가 없다).
 */

import { normalizeQuery } from '@/components/flowers/category';

export { normalizeQuery };

/** 한 갈래에 한 번에 세우는 결과 수. 넘치는 만큼은 "더 있어요" 한 줄로만 알린다. */
export const HIT_CAP = 6;

/** 검색이 보는 꽃 한 칸 — 레인 하나에 대응한다. */
export interface SearchableFlower {
  flowerId: string;
  nameKo: string;
  /** 서버가 만든 이름 색인(한국어명·영문명·학명을 정규화해 이어 붙인 문자열). */
  searchKey: string;
  /** 지금 이 꽃에 걸린 이야기 편수 — 결과 줄의 꼬리에 붙는다. */
  count: number;
}

/** 검색이 보는 이야기 한 칸. */
export interface SearchableStory {
  storyId: string;
  title: string;
  flowerNameKo: string;
  /** 제목 + hook 을 정규화해 이어 붙인 문자열. */
  searchKey: string;
}

export interface ArchiveSearchResult {
  /** 앞에서 `HIT_CAP` 개까지. */
  flowers: SearchableFlower[];
  stories: SearchableStory[];
  /** 잘라 낸 나머지 수(0이면 "더 있어요" 줄을 세우지 않는다). */
  flowerMore: number;
  storyMore: number;
  /** 두 갈래를 합쳐 하나라도 걸렸는가. */
  hasHit: boolean;
}

const EMPTY: ArchiveSearchResult = {
  flowers: [],
  stories: [],
  flowerMore: 0,
  storyMore: 0,
  hasHit: false,
};

/** 이야기 색인 한 줄 — 제목과 hook 만(본문 제외). */
export function storySearchKey(story: { title: string; hook?: string }): string {
  return normalizeQuery(`${story.title} ${story.hook ?? ''}`);
}

/** 꽃 색인 한 줄 — 이름 세 가지. 서버가 부른다(`/flowers` 와 같은 조합). */
export function flowerSearchKey(flower: {
  nameKo: string;
  nameEn?: string;
  scientificName?: string;
}): string {
  return normalizeQuery(
    `${flower.nameKo} ${flower.nameEn ?? ''} ${flower.scientificName ?? ''}`,
  );
}

/**
 * 질의 하나로 꽃과 이야기를 함께 훑는다.
 *
 * 질의도 색인과 **같은 함수**를 지나므로 대소문자·공백·하이픈·학명의 `×` 차이는 저절로
 * 사라진다. 정규화 뒤 빈 문자열이면(공백·기호만 적었다) 아무것도 걸지 않는다 —
 * 빈 색인은 모든 문자열에 `includes` 로 걸려서 전량이 쏟아진다.
 *
 * 결과 순서는 **입력 순서 그대로**다(꽃은 카탈로그 순서, 이야기는 csv 순서). 점수를
 * 매겨 섞지 않는 이유는 아카이브의 다른 목록과 같다 — 다시 찾아온 사람이 같은 자리에서
 * 같은 것을 만나야 한다.
 */
export function searchArchive(
  query: string,
  flowers: readonly SearchableFlower[],
  stories: readonly SearchableStory[],
  cap: number = HIT_CAP,
): ArchiveSearchResult {
  const needle = normalizeQuery(query);
  if (needle === '') return EMPTY;

  const flowerHits = flowers.filter((flower) => flower.searchKey.includes(needle));
  const storyHits = stories.filter((story) => story.searchKey.includes(needle));

  return {
    flowers: flowerHits.slice(0, cap),
    stories: storyHits.slice(0, cap),
    flowerMore: Math.max(0, flowerHits.length - cap),
    storyMore: Math.max(0, storyHits.length - cap),
    hasHit: flowerHits.length > 0 || storyHits.length > 0,
  };
}
