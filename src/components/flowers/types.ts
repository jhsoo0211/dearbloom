/**
 * 꽃 도감(`/flowers`)이 주고받는 모양 — **서버가 확정해 클라이언트로 내려보내는 값**.
 *
 * `/stories` 와 같은 규칙이다: 라벨 사전도 엔진도 클라이언트로 넘기지 않는다.
 * 한국어 문구·카테고리·검색 색인까지 전부 서버에서 만들어 문자열로 실어 보낸다
 * (어휘가 늘면 서버 파일 하나만 따라가면 된다).
 *
 * ⚠ 순수 타입만 둔다. 값(상수·함수)을 여기 두면 클라이언트 번들에 섞인다 —
 *   상수는 `category.ts`(순수 데이터)로, 계산은 `data.ts`(서버)로 간다.
 */

import type { MetaNote } from '@/components/stories/meta';
import type { ThemeCategory } from '@/components/landing/landing-data';

export type { ThemeCategory };

/* ------------------------------------------------------------------ *
 * 목록·검색 (`/flowers`)
 * ------------------------------------------------------------------ */

/** 검색 결과 카드 한 장 = 꽃 한 종의 요약. */
export interface FlowerSummary {
  /** = `content/flowers.csv` 의 id. 그대로 상세 경로가 된다(`/flowers/{slug}`). */
  slug: string;
  nameKo: string;
  /** 비어 있을 수 있다(CSV 의 name_en 은 선택). */
  nameEn: string;
  scientificName: string;
  category: ThemeCategory;
  categoryLabel: string;
  /** 대표 꽃말 한 줄. 카드에 한 줄만 세운다. */
  meaning: string;
  /** 그 꽃에 쌓인 이야기 편수. */
  storyCount: number;
  /**
   * 검색 색인 — 이름 세 가지(한국어·영문·학명)를 **정규화해 이어 붙인 문자열**.
   * 대소문자·공백·하이픈·`×` 를 지운 형태라 질의도 같은 함수를 통과시켜 비교한다.
   */
  haystack: string;
}

/** 카테고리 한 묶음(§1.4c v3.2 테마 카테고리 5종). */
export interface FlowerGroup {
  category: ThemeCategory;
  /** 계열 이름(`숲빛` `상아빛` …) — `/stories` 필터 칩과 같은 말이다. */
  label: string;
  /** 어떤 색 계열이 모이는 칸인지 한 줄(§1.4c v3.2 배정 규칙). */
  hint: string;
  flowers: FlowerSummary[];
}

/** `/flowers` 한 페이지 분량. */
export interface FlowerIndexData {
  flowers: FlowerSummary[];
  groups: FlowerGroup[];
  /** 인트로 숫자 — 실데이터를 그대로 센다. */
  meaningCount: number;
  storyCount: number;
}

/* ------------------------------------------------------------------ *
 * 상세 (`/flowers/[slug]`)
 * ------------------------------------------------------------------ */

/** 같은 색으로 묶인 꽃말들. */
export interface MeaningGroup {
  key: string;
  /** `흰색` `보라` … 색이 비어 있는 행은 `색을 가리지 않는 이야기`. */
  colorLabel: string;
  /** 스와치 색(§1.4 팔레트 승인 틴트). 색 없는 묶음은 undefined. */
  hex?: string;
  /** 흰·크림처럼 배경과 붙는 색은 링을 둘러 형태를 남긴다. */
  needsRing?: boolean;
  items: MeaningItem[];
}

export interface MeaningItem {
  key: string;
  /** 꽃말 본문 — 주인공 문장. */
  text: string;
  /** 각주 한 줄: 문화권 · 시대 · 신뢰 라벨(§1.5i 메타 후치). */
  note: string;
  /** 편집 주의 문구가 있을 때만. */
  caution?: string;
  sourceUrl?: string;
}

/** 이야기 한 편 — 카드가 그대로 쓰는 모양(hook·본문 먼저, 메타는 각주). */
export interface FlowerStory {
  id: string;
  title: string;
  hook?: string;
  body: string;
  /** 결(mood) 칩. 상단에 허용된 유일한 분류 표시다(§1.5i). */
  moodLabels: string[];
  /** 본문 아래 각주 줄(지역 · 시대 · 갈래 · 신뢰). */
  notes: MetaNote[];
  sourceTitle?: string;
  sourceUrl?: string;
  /** 처음부터 펼쳐 두는 한 편(§1.5i — featured 전체 노출). */
  featured: boolean;
}

/** 최하단 참고 블록의 반려동물 칸(§1.5h — 배지 1곳 + 상세는 접힘). */
export interface PetNote {
  safe: boolean;
  badge: string;
  /** 종별 한 줄(`고양이 — 적은 양도 생명을 위협할 수 있어요`). */
  lines: string[];
  sourceUrl?: string;
}

/** `/flowers/[slug]` 한 페이지 분량. */
export interface FlowerDetailData {
  slug: string;
  nameKo: string;
  nameEn: string;
  scientificName: string;
  category: ThemeCategory;
  categoryLabel: string;
  categoryHint: string;
  /**
   * 히어로 맨 위에 거는 **대표 실사** — 원본은 `@/lib/photos`(Unsplash CDN 주소가 온다).
   *
   * 도감이 먼저 답해야 하는 질문은 "이 꽃이 어떻게 생겼나"다. 19세기 세밀화는 그 답을
   * 아름답게는 하지만 정확하게는 못 한다(판본에 따라 종이 다르고, 겹꽃 변종이 섞인다).
   * 그래서 **실사가 앞이고 도판이 보조**다 — 도판은 아래 `plate` 로 액자에 남는다.
   */
  photo?: { src: string; alt: string; credit: string };
  /**
   * 히어로 액자에 거는 세밀화 — 원본은 `@/lib/plates`(자체 호스팅 사본 주소가 온다).
   * `note` 는 종이 다르거나 판면에 손댄 도판의 **정직한 한 줄**이다(없는 꽃이 더 많다).
   * 있으면 크레딧 아래 각주로 그대로 나간다 — 감추면 "벚꽃이라며 다른 꽃을 보여 준" 화면이 된다.
   */
  plate?: { src: string; alt: string; credit: string; note?: string };
  /** 대표 꽃말 — 히어로에 크게 세우는 한 줄. */
  headline: string;
  meaningGroups: MeaningGroup[];
  meaningCount: number;
  stories: FlowerStory[];
  /** §1.5h `이런 날 건네보세요`. 데이터가 없는 꽃은 빈 배열 → 섹션을 세우지 않는다. */
  occasions: string[];
  pet: PetNote;
  seasonLine: string;
  priceLine: string;
}
