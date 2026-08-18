/**
 * 랜딩 뷰모델 — **화면이 그대로 쓰는 모양과, 그 모양을 만드는 상수들.**
 *
 * design-spec §1.4c v3.2·v3.3 / §1.5d(워딩) / §1.5g(사진 위 이름) / §1.5h(반려동물 강등·상황 예시)
 *
 * ── 이 파일과 `landing-build.ts` 의 경계 (2026-08-15 · 코드 리뷰 P0-1) ──────────────
 * 여기는 **클라이언트 번들에 들어가도 되는 것만** 둔다: 타입, 카테고리 표, 섹션 사진 주소,
 * 조사 붙이기 같은 순수 문자열 함수. `LandingPage` 가 `'use client'` 라 이 파일의 **값**
 * 임포트는 전부 브라우저로 따라 들어간다.
 *
 * 카탈로그를 읽어 뷰모델을 만드는 계산(`buildLandingData`)은 `landing-build.ts` 로 갈랐다.
 * 그 전에는 한 파일이었고, 그래서 엔진 배럴(`@/lib/engine` → zod·추천 로직 전부)과
 * 사진 상수 32종이 랜딩 전용 청크에 통째로 실렸다(실측: `/` 청크 310KB, first-load 762KB
 * vs 다른 라우트 450~500KB). **여기에 값 import 를 추가할 때는 그 값이 브라우저에
 * 실려도 되는지 먼저 확인하라.** 엔진·카탈로그·fs 는 `landing-build.ts` 쪽이다.
 *
 * ⚠ 이 파일은 `components/flowers`·`components/stories`·`app/stories` 도 함께 쓴다
 *   (`categoryOf` · `ThemeCategory` · `CATEGORY_THEMES`). 이름을 옮기지 마라.
 *
 * 테마 구조(§1.4c v3.2): 색감을 소유하는 것은 꽃이 아니라 **카테고리 5종**이다.
 * 다만 실제 CSS 변수 세트는 `globals.css` 의 `[data-flower="tulip|lily|freesia|anemone|hellebore"]`
 * 다섯 벌이고(=v3.1 테마의 승계), 카테고리는 그중 하나를 대표로 가리킨다.
 * 그래서 카테고리 → slug 매핑이 필요하다(아래 CATEGORY_THEMES).
 */

import type { CatalogFlower } from '@/lib/data/types';
import type { TodayBasis } from '@/lib/engine/today';
import type { FlowerThemeSlug } from '@/lib/theme/flowers';

/* ------------------------------------------------------------------ *
 * 카테고리 (§1.4c v3.2)
 * ------------------------------------------------------------------ */

export type ThemeCategory = 'forest' | 'ivory' | 'gold' | 'wine' | 'dusk';

export interface CategoryTheme {
  category: ThemeCategory;
  /** globals.css 의 `[data-flower]` 변수 세트 키. 이 값이 곧 화면의 색감이다. */
  slug: FlowerThemeSlug;
  /** 화면에 노출되는 색감 이름. */
  label: string;
  scheme: 'dark' | 'light';
}

/** 카테고리 5종 → v3.1 테마 승계(§1.4c 표). */
export const CATEGORY_THEMES: Record<ThemeCategory, CategoryTheme> = {
  forest: { category: 'forest', slug: 'tulip', label: '나이트 보태니컬', scheme: 'dark' },
  ivory: { category: 'ivory', slug: 'lily', label: '아이보리 스튜디오', scheme: 'light' },
  gold: { category: 'gold', slug: 'freesia', label: '잉크 앤 골드', scheme: 'dark' },
  wine: { category: 'wine', slug: 'anemone', label: '이브닝 와인', scheme: 'dark' },
  dusk: { category: 'dusk', slug: 'hellebore', label: '딥 라벤더', scheme: 'dark' },
};

/**
 * 명시 배정 1순위 (§1.4c v3.2 "현 9종 배정" + seed-v4 14종 · seed-v5 1종 · seed-v6 15종).
 *
 * 배정 기준은 폴백과 같다 — **대표색(`colors[0]`)**. 폴백에 맡겨도 같은 값이 나오는 꽃까지
 * 여기 적어 두는 이유는, 흰색 계열 세 종(`jasmine` `babys-breath` `magnolia`)을 폴백의
 * `forest` 가 아니라 `ivory` 로 **일부러 옮겼기** 때문이다. `ivory` 는 유일한 라이트 테마인데
 * 배정이 2종뿐이라 오늘의 꽃 로테이션에서 사실상 안 나왔다(조사 문서 §5). 크림·화이트가
 * 그대로 어울리는 세 꽃을 옮겨 2 → 5 로 채운다.
 *
 * 분홍(`cherry-blossom` `cosmos`)은 폴백 표의 `pink → wine` 과 같은 값이지만, 기존 17종에
 * 대표색이 분홍인 꽃이 없어 처음 쓰이는 경로라 여기 명시해 둔다.
 */
const CATEGORY_BY_FLOWER: Record<string, ThemeCategory> = {
  'tulip-white': 'forest',
  'lily-asiatic': 'ivory',
  peony: 'ivory',
  freesia: 'gold',
  gerbera: 'gold',
  'rose-red': 'wine',
  anemone: 'wine',
  hellebore: 'dusk',
  hyacinth: 'dusk',
  // seed-v4 — 노랑·주황 대표색
  narcissus: 'gold',
  marigold: 'gold',
  // seed-v4 — 파랑·보라 대표색
  'forget-me-not': 'dusk',
  iris: 'dusk',
  violet: 'dusk',
  pansy: 'dusk',
  // seed-v4 — 빨강·분홍 대표색
  camellia: 'wine',
  'corn-poppy': 'wine',
  poinsettia: 'wine',
  'cherry-blossom': 'wine',
  cosmos: 'wine',
  // seed-v4 — 흰색 대표색. 폴백(forest) 대신 ivory 로 옮긴 세 종
  jasmine: 'ivory',
  'babys-breath': 'ivory',
  magnolia: 'ivory',
  /**
   * seed-v5 — 데이지. 대표색(`colors[0]`)이 `white` 라 **폴백과 같은 `forest`** 지만
   * 일부러 적어 둔다: 바로 위 흰색 세 종이 `ivory` 로 옮겨 가 있어, 명시가 없으면
   * "데이지도 옮기려다 빠뜨린 것"으로 읽히기 때문이다.
   *
   * 옮기지 않는 이유는 두 가지다. ① `ivory` 를 채운 목적(라이트 테마 배정 2 → 5종)은
   * 이미 이뤄졌다. ② 데이지는 나머지 색이 분홍·빨강이고 화단·화분에 낮게 피는 들꽃이라,
   * 크림·화이트 스튜디오보다 숲빛 쪽 결에 가깝다.
   */
  daisy: 'forest',
  /* ── 확장 배치 1 (2026-08-16, flowers.csv seed-v6 15종) ───────────────────
   * 열다섯 줄 전부 **폴백과 같은 값**이다(대표색 규칙 그대로). 그래도 적어 두는 이유는
   * 위 데이지 주석과 같다 — 명시 표가 이미 스물넷 줄이라, 빠진 꽃은 "배정을 빠뜨린 것"으로
   * 읽힌다. 색이 카테고리를 정한다는 사실을 이 표가 눈으로 확인시켜 주는 편이 낫다. */
  // 빨강·분홍 대표색
  'sweet-pea': 'wine',
  gladiolus: 'wine',
  dahlia: 'wine',
  zinnia: 'wine',
  cyclamen: 'wine',
  geranium: 'wine',
  amaryllis: 'wine',
  // 노랑 대표색
  calendula: 'gold',
  primula: 'gold',
  // 파랑·보라 대표색
  aster: 'dusk',
  delphinium: 'dusk',
  cornflower: 'dusk',
  crocus: 'dusk',
  /**
   * 흰·크림 대표색이지만 **`ivory` 로 옮기지 않는다** — 데이지와 같은 판단이다.
   * `ivory` 를 채운 목적(라이트 테마 배정 2 → 5종)은 이미 이뤄졌고, 두 꽃 다
   * 밝은 스튜디오보다 어두운 물·밤 화단 쪽 결이 어울린다(수련은 검은 수면 위의 흰 꽃,
   * 스토크는 나머지 색이 분홍·보라인 겹꽃 수상화서다).
   */
  stock: 'forest',
  'water-lily': 'forest',
};

/** 미배정 신규 꽃의 폴백 — 대표색(colors[0]) 규칙. */
const CATEGORY_BY_COLOR: Record<string, ThemeCategory> = {
  white: 'forest',
  cream: 'forest',
  green: 'forest',
  yellow: 'gold',
  orange: 'gold',
  red: 'wine',
  pink: 'wine',
  coral: 'wine',
  magenta: 'wine',
  purple: 'dusk',
  blue: 'dusk',
};

export function categoryOf(flower: CatalogFlower): ThemeCategory {
  const explicit = CATEGORY_BY_FLOWER[flower.id];
  if (explicit) return explicit;
  return CATEGORY_BY_COLOR[flower.colors[0] ?? ''] ?? 'forest';
}

/* ------------------------------------------------------------------ *
 * 뷰모델 — 서버가 만들고(`landing-build.ts`) 화면이 그대로 읽는 모양
 * ------------------------------------------------------------------ */

export interface SlideImage {
  src: string;
  /**
   * 같은 컷의 여러 폭(`photos/photoSrcSet` · `unsplashSrcSet`).
   * ⚠ 화면에서 `sizes` 를 함께 주지 않으면 브라우저가 100vw 로 가정해 늘 최대 폭을 받는다.
   */
  srcSet?: string;
  alt: string;
  credit: string;
  /** 팔레트 밖 색을 눌러야 하는 컷의 CSS filter. */
  grade?: string;
  /**
   * 배경이 밝은 컷인가(docs/image-assets.md §통합할 때 주의할 것 4).
   * 카드가 스크림을 한 단 더 올려 사진 위 이름의 대비를 지킨다(§1.5g).
   */
  bright?: boolean;
}

export interface SlideView {
  flowerId: string;
  /** 화면 이름. 테마 상수가 있으면 시안 이름(흰 백합 등), 없으면 카탈로그 이름. */
  name: string;
  latin: string;
  category: ThemeCategory;
  /** 카드 국소 색감에 쓰는 `data-flower` 값. */
  themeSlug: FlowerThemeSlug;
  categoryLabel: string;
  meaning: string;
  /** 꽃말에 붙는 설명 한 줄(테마 상수가 있을 때만). */
  note?: string;
  sourceLabel: string;
  /** 이야기 티저 — pickStories 로 고른 실데이터. */
  storyTitle?: string;
  storyHook?: string;
  /** "이런 날 건네보세요" (§1.5h). */
  occasions: string[];
  /** 위험한 꽃일 때만 있는 각주 1줄. */
  petCaveat?: string;
  /** 카드 사진. 카탈로그 전종에 대표 실사가 있어 실제로는 언제나 채워진다(`slideImage`). */
  image?: SlideImage;
  /** 오늘의 꽃인가. */
  isToday: boolean;
}

export interface HeroImage extends SlideImage {
  srcMobile?: string;
  /** 모바일 소스(`<source media="(max-width:720px)">`)의 폭 후보들. */
  srcSetMobile?: string;
}

/**
 * 오늘 날짜의 탄생화 — 리드 아래 **각주 한 줄**(§1.5e 절제 원칙).
 *
 * 밴드도 박스도 만들지 않는다. 오늘의 꽃(추천 엔진이 고른 주인공)과 탄생화(날짜 표에서
 * 온 곁가지)는 다른 축이라, 둘을 같은 위계로 세우면 "오늘의 꽃"이 무엇인지 흐려진다.
 *
 * ⚠ 문구에서 **"전통"·"공식"·"예로부터 정해진" 류 단정을 쓰지 마라.** 이 표는 전통적으로
 *   정해진 탄생화가 아니라 널리 통하게 된 목록이다(`docs/birth-flowers-research.md` §2).
 */
export interface BirthFlowerLine {
  /** `8월 16일`. `todayLabel`(`2026.08.16`)과 표기가 달라 따로 만든다. */
  dateLabel: string;
  /** 그 날 표가 부르는 이름(카탈로그 이름과 다를 수 있다). */
  name: string;
  meaning: string;
  /**
   * 꽃말 뒤에 붙는 서술격 조사(`이에요` / `예요`).
   * 따옴표가 끼어 `withParticle` 을 그대로 쓸 수 없는 자리라 서버가 정해 내려보낸다.
   */
  meaningCopula: string;
  /**
   * 각주 문장에서 **이름 링크 앞에 서는 조각** — `참, 8월 16일의 탄생화는 `.
   *
   * 위 `dateLabel` · `meaning` · `meaningCopula` 와 재료가 겹치는데도 문장을 서버에서 짓는
   * 이유는 §1.5n 개정(2026-08-16)이 이 줄에 **날짜 씨앗 변주**를 들였기 때문이다. 변주 표를
   * 화면에 두면 같은 날 같은 문장이라는 계약을 클라이언트가 나눠 지게 되고, 테스트도 그
   * 문장을 볼 수 없다. 조각으로 자른 것은 이름 한 낱말이 링크라서다(문자열 하나로는 못 낸다).
   */
  lead: string;
  /** 이름 링크 뒤 조각 — `예요 — ‘사치’라는 말을 품고 있어요.` */
  tail: string;
  /** 카탈로그에 그 꽃이 있을 때만 — 도감 상세 경로. 309일은 없는 것이 정상이다. */
  href?: string;
}

/**
 * 도감 `/flowers` 의 **생일 꽃 찾기** 구획 (§1.5m ③).
 *
 * 탄생화 각주의 꽃이 도감에 없을 때(366일 중 309일) 이름이 가는 곳이다. 예전에는 그런 날
 * 이름이 그냥 검은 글자로 남아 **막다른 줄**이 됐다 — 표에만 있는 꽃이라는 사실은 맞지만,
 * 그 사람이 다음에 하고 싶은 일(다른 날짜도 찾아보기)로 가는 문이 화면 어디에도 없었다.
 *
 * ⚠ 앵커는 `BirthdayFinder` 의 `<h2 id="birth-title">` 다(그 구획의 `aria-labelledby` 이기도
 *   하다). 도감 쪽 마크업에 **이미 있는 id** 라 이 링크를 위해 새로 심은 것이 아니다 —
 *   저 id 를 지우면 이 링크가 페이지 맨 위로 떨어진다.
 */
export const BIRTH_FINDER_HREF = '/flowers#birth-title';

export interface LandingData {
  /** KST 기준 오늘(YYYY-MM-DD). */
  todayISO: string;
  /** 화면 표기용 날짜 — `2026.08.15`. 히어로 캡션(`오늘의 꽃 · …`)이 쓴다. */
  todayLabel: string;
  /** 오늘의 꽃을 어느 후보군에서 뽑았는지(제철/앞뒤 달/전체). */
  basis: TodayBasis;
  /**
   * "오늘은 이 꽃을 꺼냈어요" — 리드 문단 전체 (§1.5n v4 · 2026-08-17 개정).
   *
   * **세 마디**를 서버가 한 문단으로 짓는다:
   *   ① 오늘이라는 날 — `8월 중순이잖아요.`
   *   ② 그래서 이 꽃 — `이맘때는 눈이라도 시원한 게 반가워서, 마침 제철인 수국을 골랐어요.`
   *   ③ (있으면) 이야기 — `일본 쪽 기록에서 온 이야기예요. “…” — 무슨 이야기인지는 도감에서…`
   * 이야기가 없으면 꽃말로 물러서고, 꽃말도 없으면 ③ 없이 두 마디로 끝난다. 모델 호출은
   * 없다 — 문장 틀 자체가 **날짜 씨앗으로 회전**할 뿐이라 같은 날 새로고침은 같은 문단이다.
   *
   * ⚠ ③ 은 다시 세 조각(㉠ 출처의 좌표 → ㉡ 훅 인용 → ㉢ 이어 읽을 곳)이다. 인용만 홀로
   *   두면 훅이 본문에서 떨어져 나온 헤드라인이라 단서가 없다(v3 사용자 피드백). ㉢ 이
   *   가리키는 곳은 **카드가 실제로 가는 `/flowers/{id}`** 다 — 그 동선을 걷어 내면 이
   *   문장들이 거짓이 되므로 함께 고쳐야 한다.
   *
   * ⚠ 화면에서 이 문자열을 자르거나 앞에 날짜·꽃 이름을 덧붙이지 마라. v2 이전에는 화면이
   *   `{날짜}, 오늘의 꽃은 {이름}이에요.` 를 앞에 붙였는데, 그 뼈대가 날마다 그대로 남는 것이
   *   "작위적"이라는 피드백의 첫 번째 원인이었다. 인용 부호도 서버가 붙인다(훅 원문에
   *   `"`·`'` 가 섞여 있어 바깥 따옴표를 화면에서 붙이면 겹친다).
   * ⚠ ① 이 부르는 것은 **날짜가 아니라 계절 속의 위치**다(`8월 중순`). `8월 16일` 은
   *   히어로 캡션과 탄생화 줄의 몫이고, 날씨·기온은 우리에게 데이터가 없어 쓰지 않는다.
   */
  todayReason: string;
  /**
   * 리드 아래 한 단 흐린 줄 — **화면 빛깔 한 마디**(`.db-today-aside`).
   *
   * 바로 아래 `화면의 빛깔` 선택기(§1.4c v3.4)를 여는 말이라 남는다. 함께 있던
   * "카드를 옆으로 넘기면…" 안내는 뺐다 — 캐러셀이 이미 화살표·점·건너뛰기 링크로 말하고
   * 있고(`role="group"` 의 `aria-label` 에도 적혀 있다) 문장으로 한 번 더 적으면
   * 어포던스를 두 벌 관리하게 된다.
   */
  todayAside: string;
  category: ThemeCategory;
  /** 전역 테마 = 오늘의 꽃 카테고리(§1.4c v3.3 — 진입 시 1회 결정). */
  themeSlug: FlowerThemeSlug;
  categoryLabel: string;
  hero: HeroImage;
  today: SlideView;
  /** 오늘 날짜의 탄생화 각주. 표는 366일 전수라 실제로는 언제나 채워진다. */
  birthFlower?: BirthFlowerLine;
  /** 카탈로그 전종. 오늘의 꽃이 맨 앞. */
  slides: SlideView[];
  /** 푸터 크레딧(중복 제거). */
  credits: string[];
}

/**
 * 챕터 색면 사진 — docs/image-assets.md 승인 목록에서만.
 * 꽃별이 아니라 "장면"이라 테마와 무관하게 고정이다.
 *
 * ⚠ 이 넷은 `<img>` 가 아니라 `.db-media-bg` 의 **배경 이미지**다. 그래서 srcset 을 쓸 수
 *   없어 폭을 둘로 나눠 두고 CSS 가 고른다(landing.css `--db-bg-sm` / `--db-bg-lg`).
 *   예전에는 전부 `w=1920` 한 벌이었다 — 폰에서도 1920 을 받았다(성능 리뷰 P1-4).
 *   풀블리드 색면이라 카드용 폭(640/1080)까지 내리지는 않는다: 스크림 아래 텍스처지만
 *   화면 전체를 덮으므로 데스크톱은 1600, 720px 이하는 1080 이 하한이다.
 */
export const SECTION_IMAGES = {
  /** #6 그린 보태니컬 — 신뢰 3요소 scroll room */
  trust: {
    src: 'https://images.unsplash.com/photo-1599056481506-c4975215aff4?auto=format&fit=crop&w=1600&q=80',
    srcMobile:
      'https://images.unsplash.com/photo-1599056481506-c4975215aff4?auto=format&fit=crop&w=1080&q=80',
    credit: 'Photo: Waseem Khan / Unsplash',
  },
  /** #14 모노톤 실루엣 — 구분면 밴드 */
  band: {
    src: 'https://images.unsplash.com/photo-1690553543873-ccaf9e2a9d5b?auto=format&fit=crop&w=1600&q=80',
    srcMobile:
      'https://images.unsplash.com/photo-1690553543873-ccaf9e2a9d5b?auto=format&fit=crop&w=1080&q=80',
    credit: 'Photo: Jens Riesenberg / Unsplash',
  },
  /** #7 매크로 질감 — 추천 예시 */
  example: {
    src: 'https://images.unsplash.com/photo-1778779213344-f6108acf3e01?auto=format&fit=crop&w=1600&q=80',
    srcMobile:
      'https://images.unsplash.com/photo-1778779213344-f6108acf3e01?auto=format&fit=crop&w=1080&q=80',
    credit: 'Photo: Julia Vivcharyk / Unsplash',
  },
  /** #12 흰 튤립 다발 — 피날레 */
  finale: {
    src: 'https://images.unsplash.com/photo-1676927116782-658e14df1dc5?auto=format&fit=crop&w=1600&q=80',
    srcMobile:
      'https://images.unsplash.com/photo-1676927116782-658e14df1dc5?auto=format&fit=crop&w=1080&q=80',
    credit: 'Photo: dariana / Unsplash',
  },
} as const;

/**
 * 낱말에 받침이 있는가.
 *
 * `withParticle` 이 쓰는 판정을 따로 내보내는 이유: 낱말 **뒤에 따옴표·괄호가 끼는 자리**
 * (`꽃말은 ‘희망’이에요`)에서는 조사를 붙여 돌려주는 함수를 쓸 수 없다. 그런 자리는
 * 조사만 골라 써야 하는데, 판정을 두 벌 두면 한쪽만 고쳐지는 날이 온다.
 */
export function hasFinalConsonant(word: string): boolean {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  return isHangul && (code - 0xac00) % 28 !== 0;
}

/**
 * 한국어 조사 — 받침 유무로 갈린다.
 * 꽃 이름이 데이터에서 오므로 "프리지아이에요" 같은 문장이 나오지 않게 여기서 맞춘다.
 *
 * `object`(을/를)는 §1.5n 리드 개정에서 들어왔다 — 리드가 `오늘은 {꽃}을 꺼냈어요` 처럼
 * 꽃 이름을 **목적어로** 데려가는 문장을 쓰기 시작했다.
 */
export function withParticle(
  word: string,
  kind: 'topic' | 'subject' | 'object' | 'copula',
): string {
  const hasFinal = hasFinalConsonant(word);
  if (kind === 'topic') return `${word}${hasFinal ? '은' : '는'}`;
  if (kind === 'subject') return `${word}${hasFinal ? '이' : '가'}`;
  if (kind === 'object') return `${word}${hasFinal ? '을' : '를'}`;
  return `${word}${hasFinal ? '이에요' : '예요'}`;
}
