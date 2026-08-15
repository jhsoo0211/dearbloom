/**
 * 랜딩 뷰모델 — 카탈로그(실데이터) + 테마 상수 → 화면이 그대로 쓰는 모양.
 *
 * design-spec §1.4c v3.2·v3.3 / §1.5d(워딩) / §1.5g(사진 위 이름) / §1.5h(반려동물 강등·상황 예시)
 *
 * 서버에서 한 번 계산해 클라이언트 컴포넌트에 props 로 내려보낸다.
 * **여기에는 fs·React 의존이 없다** — 순수 데이터 가공만 둔다.
 *
 * 테마 구조(§1.4c v3.2): 색감을 소유하는 것은 꽃이 아니라 **카테고리 5종**이다.
 * 다만 실제 CSS 변수 세트는 `globals.css` 의 `[data-flower="tulip|lily|freesia|anemone|hellebore"]`
 * 다섯 벌이고(=v3.1 테마의 승계), 카테고리는 그중 하나를 대표로 가리킨다.
 * 그래서 카테고리 → slug 매핑이 필요하다(아래 CATEGORY_THEMES).
 */

import type { Catalog, CatalogFlower, CatalogStory } from '@/lib/data/types';
import { pickStories, todayFlower, type TodayBasis } from '@/lib/engine';
import { canLeadHero, needsDarkOverlay, photoFor, photoSrc } from '@/lib/photos';
import { FLOWER_THEMES, getFlowerTheme, type FlowerThemeSlug } from '@/lib/theme/flowers';

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
 * 명시 배정 1순위 (§1.4c v3.2 "현 9종 배정" + seed-v4 신규 14종).
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
 * 문구 — §1.5d 이야기 톤 / §1.5h 상황 예시
 * ------------------------------------------------------------------ */

/** confidence_level → 화면 라벨(§1.5d 워딩 개정표). */
const CONFIDENCE_LABEL: Record<'repeated' | 'varies' | 'single_source', string> = {
  repeated: '오래, 두루 전해지는 꽃말',
  varies: '시대마다 조금씩 다르게 전해져요',
  single_source: '드물게 전해지는 이야기예요',
};

/**
 * "이런 날 건네보세요" (§1.5h 표).
 *
 * 표에 있는 5종은 스펙 문구 그대로다. 나머지 4종(장미·거베라·히아신스·작약)은 표에 없어
 * rules.csv 의 intent 태그와 meanings/stories 의 결에 맞춰 새로 썼다.
 * ⚠ 기술부채: §1.5h 가 예고한 대로 flowers.csv `occasions` 컬럼으로 이관해야 한다.
 */
const OCCASIONS: Record<string, string[]> = {
  'tulip-white': ['다툰 다음 날 아침에', '새 출발을 앞둔 사람에게', '오래 미룬 사과를 전할 때'],
  'lily-asiatic': ['새로 시작하는 자리에(결혼·개업)', '오래 존경한 분께'],
  freesia: ['첫 출근을 축하할 때', '고마운 친구에게 가볍게'],
  anemone: ['오래 기다린 마음을 전할 때', '먼저 떠난 이를 기억하는 날에'],
  hellebore: ['위로가 필요한 겨울에', '말없이 곁을 지키고 싶을 때'],
  'rose-red': ['오래 미뤄 둔 고백을 할 때', '처음 만난 날을 함께 세는 자리에'],
  gerbera: ['새 자리로 옮기는 동료에게', '기운을 북돋아 주고 싶은 날에'],
  hyacinth: ['봄이 왔다고 먼저 알리고 싶을 때', '조용히 애도를 건네는 자리에'],
  peony: ['귀한 자리를 크게 축하할 때', '수줍은 마음을 대신 전할 때'],
  // 카탈로그 확장분(seed-v3). 위와 같은 기준으로 새로 쓴 문구 — 편집 검수 대상.
  hydrangea: ['비 오는 날 안부를 물을 때', '오래 함께한 가족에게'],
  lavender: ['잠 못 드는 사람에게', '잠깐 쉬어 가라고 말하고 싶을 때'],
  sunflower: ['기운이 필요한 사람에게', '멀리서 응원을 보낼 때'],
  carnation: ['부모님께 감사를 전할 때', '가르쳐 준 분께 인사드릴 때'],
  lisianthus: ['흰 튤립을 구하기 어려운 계절에', '차분한 축하가 필요한 자리에'],
  ranunculus: ['봄맞이 인사를 건넬 때', '화사한 축하가 필요한 날에'],
  'lily-of-the-valley': ['5월의 첫날, 행운을 빌어 줄 때', '오래 기다린 소식을 축하할 때'],
  chrysanthemum: ['고인을 기억하는 자리에', '어른께 절기 인사를 드릴 때'],
  // 카탈로그 확장분(seed-v5). 꽃말 '순수한 마음'·'같은 마음이에요 — 당신 뜻에 함께합니다' 에서 왔다.
  daisy: ['괜찮냐고 묻고 싶은 날에', '같은 편이라고 말해주고 싶을 때'],
};

/** toxic_parts → 한국어. 각주 한 줄을 데이터에서 만들기 위한 표. */
const PART_LABEL: Record<string, string> = {
  bulb: '알뿌리',
  stem: '줄기',
  leaf: '잎',
  flower: '꽃',
  pollen: '꽃가루',
  vase_water: '화병 물',
  root: '뿌리',
  sap: '수액',
  seed: '씨',
  bark: '껍질',
};

/**
 * 반려동물 각주 — **위험한 꽃일 때만 한 줄**(§1.5h: 안전 꽃엔 표기 없음).
 * 문구는 완곡하게 돌리지 않는다(§1.5h: 안전은 직설 유지).
 */
function petCaveatFor(flower: CatalogFlower): string | undefined {
  const toxic = flower.petSafety.filter((entry) => entry.toxic);
  if (toxic.length === 0) return undefined;

  const lethal = toxic.find((entry) => entry.severity === 'life_threatening');
  if (lethal) {
    const animal = lethal.species === 'cat' ? '반려묘' : '반려견';
    return `${animal}가 있는 집이라면 피해주세요. 적은 양도 위험한 꽃이에요.`;
  }

  const serious = toxic.some((entry) => entry.severity === 'serious');
  const parts = [...new Set(toxic.flatMap((entry) => entry.toxicParts))]
    .map((part) => PART_LABEL[part] ?? part)
    .slice(0, 3)
    .join('·');

  if (serious) {
    return `고양이·강아지에게 독성이 강한 꽃이에요. 반려동물이 있다면 피해주세요.`;
  }
  return parts
    ? `반려동물이 있다면 ${parts}은 조심해 주세요.`
    : '반려동물이 있다면 삼키지 않게 조심해 주세요.';
}

/* ------------------------------------------------------------------ *
 * 뷰모델
 * ------------------------------------------------------------------ */

export interface SlideImage {
  src: string;
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
  /** 설화 티저 — pickStories 로 고른 실데이터. */
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
}

export interface LandingData {
  /** KST 기준 오늘(YYYY-MM-DD). */
  todayISO: string;
  /** 화면 표기용 날짜 — `2026.08.15`. */
  todayLabel: string;
  /** 오늘의 꽃을 어느 후보군에서 뽑았는지(제철/앞뒤 달/전체). */
  basis: TodayBasis;
  category: ThemeCategory;
  /** 전역 테마 = 오늘의 꽃 카테고리(§1.4c v3.3 — 진입 시 1회 결정). */
  themeSlug: FlowerThemeSlug;
  categoryLabel: string;
  hero: HeroImage;
  today: SlideView;
  /** 카탈로그 전종. 오늘의 꽃이 맨 앞. */
  slides: SlideView[];
  /** 푸터 크레딧(중복 제거). */
  credits: string[];
}

/**
 * 챕터 색면 사진 — docs/image-assets.md 승인 목록에서만.
 * 꽃별이 아니라 "장면"이라 테마와 무관하게 고정이다.
 */
export const SECTION_IMAGES = {
  /** #6 그린 보태니컬 — 신뢰 3요소 scroll room */
  trust: {
    src: 'https://images.unsplash.com/photo-1599056481506-c4975215aff4?auto=format&fit=crop&w=1920&q=80',
    credit: 'Photo: Waseem Khan / Unsplash',
  },
  /** #14 모노톤 실루엣 — 구분면 밴드 */
  band: {
    src: 'https://images.unsplash.com/photo-1690553543873-ccaf9e2a9d5b?auto=format&fit=crop&w=1920&q=80',
    credit: 'Photo: Jens Riesenberg / Unsplash',
  },
  /** #7 매크로 질감 — 추천 예시 */
  example: {
    src: 'https://images.unsplash.com/photo-1778779213344-f6108acf3e01?auto=format&fit=crop&w=1920&q=80',
    credit: 'Photo: Julia Vivcharyk / Unsplash',
  },
  /** #12 흰 튤립 다발 — 피날레 */
  finale: {
    src: 'https://images.unsplash.com/photo-1676927116782-658e14df1dc5?auto=format&fit=crop&w=1600&q=80',
    credit: 'Photo: dariana / Unsplash',
  },
} as const;

/** 카탈로그 꽃 id → 테마 상수(있을 때만). 사진·시안 꽃말의 출처다. */
function themeForFlower(flowerId: string) {
  return FLOWER_THEMES.find((theme) => theme.catalogFlowerId === flowerId);
}

/**
 * 배경이 밝은 컷을 다크 팔레트로 끌어내리는 그레이딩(§1.4 팔레트 · §1.5g).
 *
 * 스크림만 올려도 글자는 읽히지만, 검정 배경 컷 27장 사이에 흰 배경 카드가 끼면 **그리드
 * 자체가 튄다**(docs/image-assets.md §통합할 때 주의할 것 4). 그래서 스크림 강화(카드 CSS)와
 * 이 필터를 함께 건다 — 색은 죽이지 않고 밝기만 내리는 값이라 라벤더 보라·안개꽃 흰빛은 남는다.
 */
const BRIGHT_GRADE = 'brightness(.74) saturate(.94) contrast(1.04)';

/**
 * 카드 사진 한 장.
 *
 * 순서에 뜻이 있다: **테마 상수 컷이 먼저**다(§1.4c 5종은 편집 검수를 통과한 "장면"이고
 * 그레이딩 값까지 손으로 맞춰 뒀다). 나머지는 `@/lib/photos` 의 대표 실사가 채운다 —
 * 카탈로그 32종 전원에 컷이 있으므로 **"사진이 없어 그라디언트로 남는 카드"는 이제 없다.**
 */
function slideImage(flowerId: string): SlideImage | undefined {
  const theme = themeForFlower(flowerId);
  if (theme) {
    return {
      src: theme.card.src,
      alt: theme.card.alt,
      credit: theme.card.credit,
      grade: theme.card.grade,
    };
  }

  const photo = photoFor(flowerId);
  if (!photo) return undefined;

  const bright = needsDarkOverlay(photo);
  return {
    src: photoSrc(photo, 1080),
    alt: photo.alt,
    credit: photo.credit,
    ...(bright ? { grade: BRIGHT_GRADE, bright: true } : {}),
  };
}

/** 대표 꽃말 — 대표색과 같은 색의 행을 먼저 보고, 없으면 첫 행. */
function meaningFor(flower: CatalogFlower, catalog: Catalog) {
  const mine = catalog.meanings.filter((row) => row.flowerId === flower.id);
  if (mine.length === 0) return undefined;
  const primaryColor = flower.colors[0];
  return mine.find((row) => row.color === primaryColor) ?? mine[0];
}

/**
 * 설화 티저 — pickStories 실데이터.
 * 랜딩에는 사용자 상황이 없으므로 상황을 가리지 않는 `just_because` 로 고른다.
 */
function storyFor(flowerId: string, stories: CatalogStory[]) {
  return pickStories(flowerId, 'just_because', stories, 1).featured ?? undefined;
}

function toSlide(flower: CatalogFlower, catalog: Catalog, isToday: boolean): SlideView {
  const theme = themeForFlower(flower.id);
  const category = categoryOf(flower);
  const categoryTheme = CATEGORY_THEMES[category];
  const meaningRow = meaningFor(flower, catalog);
  const story = storyFor(flower.id, catalog.stories);

  return {
    flowerId: flower.id,
    name: theme?.nameKo ?? flower.nameKo,
    latin: theme?.latin ?? flower.scientificName,
    category,
    themeSlug: categoryTheme.slug,
    categoryLabel: categoryTheme.label,
    meaning: theme?.meaning ?? meaningRow?.meaningKo ?? '아직 갈래를 고르는 중이에요',
    note: theme?.note,
    sourceLabel:
      theme?.sourceLabel ??
      (meaningRow ? CONFIDENCE_LABEL[meaningRow.confidenceLevel] : '아직 갈래를 고르는 중이에요'),
    storyTitle: story?.title,
    storyHook: story?.hook,
    occasions: OCCASIONS[flower.id] ?? [],
    // 테마 상수의 각주가 있으면 그것을(편집 검수를 거친 문장), 없으면 데이터에서 만든다.
    petCaveat: theme?.caveat ?? petCaveatFor(flower),
    image: slideImage(flower.id),
    isToday,
  };
}

/**
 * 한국어 조사 — 받침 유무로 갈린다.
 * 꽃 이름이 데이터에서 오므로 "프리지아이에요" 같은 문장이 나오지 않게 여기서 맞춘다.
 */
export function withParticle(word: string, kind: 'topic' | 'subject' | 'copula'): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const hasFinal = isHangul && (code - 0xac00) % 28 !== 0;
  if (kind === 'topic') return `${word}${hasFinal ? '은' : '는'}`;
  if (kind === 'subject') return `${word}${hasFinal ? '이' : '가'}`;
  return `${word}${hasFinal ? '이에요' : '예요'}`;
}

/** KST 기준 오늘 날짜(YYYY-MM-DD). 서버 시간대와 무관하게 서울 달력을 쓴다. */
export function seoulTodayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * 랜딩 한 페이지 분량의 뷰모델.
 *
 * 전역 테마는 **오늘의 꽃 카테고리로 진입 시 1회** 결정된다(§1.4c v3.3).
 * 슬라이드 탐색은 카드 국소 색감만 바꾸고 이 값을 건드리지 않는다.
 */
export function buildLandingData(catalog: Catalog, todayISO: string): LandingData {
  const picked = todayFlower(todayISO, catalog.flowers);
  const todayCatalogFlower =
    catalog.flowers.find((flower) => flower.id === picked.flower.id) ?? catalog.flowers[0];

  const today = toSlide(todayCatalogFlower, catalog, true);
  const rest = catalog.flowers
    .filter((flower) => flower.id !== todayCatalogFlower.id)
    .map((flower) => toSlide(flower, catalog, false));
  const slides = [today, ...rest];

  const categoryTheme = CATEGORY_THEMES[today.category];
  const heroTheme = getFlowerTheme(categoryTheme.slug);

  /**
   * 히어로 = **오늘의 꽃 본인의 실사**(#5 화면 일치).
   *
   * 예전에는 카테고리 대표 테마의 "장면컷"을 걸었다. 오늘의 꽃에 사진이 없는 경우가 많아
   * "그 꽃 아닌 사진"과 "그 꽃 이름"을 나란히 세우는 절충이었는데, 32종 전수 확보로
   * 그 근거가 사라졌다(docs/image-assets.md §꽃별 대표 실사 32종). 색감 테마는 그대로
   * 카테고리가 소유한다 — 바뀐 것은 **사진이 가리키는 대상**뿐이다.
   *
   * ⚠ 예외 하나: **rose-red 가 오늘의 꽃이면 카테고리 대표 컷을 유지한다.** 첫 화면을
   *   빨간 장미가 덮으면 서비스 톤이 "야간 식물 아카이브"에서 로맨스로 넘어간다
   *   (문서 §사용 규칙 3 · Advisor 확정). 장미 실사는 카드·도감에서만 나온다.
   */
  const heroPhoto = canLeadHero(today.flowerId) ? photoFor(today.flowerId) : undefined;
  const hero: HeroImage = heroPhoto
    ? {
        src: photoSrc(heroPhoto, 2560),
        // 모바일은 4:5 별도 크롭 대신 같은 컷의 좁은 폭을 쓴다(히어로는 object-fit: cover 다).
        srcMobile: photoSrc(heroPhoto, 1080),
        alt: heroPhoto.alt,
        credit: heroPhoto.credit,
        // 밝은 컷 4종은 히어로에서도 같은 그레이딩으로 눌러야 다크 팔레트가 유지된다.
        ...(needsDarkOverlay(heroPhoto) ? { grade: BRIGHT_GRADE } : {}),
      }
    : {
        src: heroTheme.hero.src,
        srcMobile: heroTheme.hero.srcMobile,
        alt: heroTheme.hero.alt,
        credit: heroTheme.hero.credit,
        grade: heroTheme.hero.grade,
      };

  const credits = [
    ...new Set([
      hero.credit,
      ...slides.map((slide) => slide.image?.credit).filter((credit): credit is string => !!credit),
      ...Object.values(SECTION_IMAGES).map((image) => image.credit),
    ]),
  ];

  return {
    todayISO,
    todayLabel: todayISO.replaceAll('-', '.'),
    basis: picked.basis,
    category: today.category,
    themeSlug: categoryTheme.slug,
    categoryLabel: categoryTheme.label,
    hero,
    today,
    slides,
    credits,
  };
}
