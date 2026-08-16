/**
 * 랜딩 뷰모델 **계산** — 카탈로그(실데이터) + 테마 상수 → `landing-data.ts` 의 모양.
 *
 * design-spec §1.4c v3.2·v3.3 / §1.5d(워딩) / §1.5g(사진 위 이름) / §1.5h(반려동물 강등·상황 예시)
 *
 * ── 왜 파일이 갈라져 있나 (2026-08-15 · 코드 리뷰 P0-1) ─────────────────────────────
 * **이 파일은 서버에서만 돈다.** `app/page.tsx` 가 부르고, 결과(순수 데이터)를
 * `'use client'` 컴포넌트에 props 로 넘긴다. 그러니 여기서는 엔진·카탈로그를 마음껏 쓴다.
 *
 * 예전에는 이 코드가 `landing-data.ts` 안에 있었고, 그 파일을 `LandingPage`(클라이언트)가
 * import 했다. 타입만 가져와도 **값 import 한 줄이 섞이면** 번들러는 모듈 전체를
 * 클라이언트 그래프에 넣는다 — 엔진 배럴(`@/lib/engine` → zod·추천 로직 전부)과 사진
 * 상수 32종이 랜딩 청크에 실렸다(실측: `/` 전용 청크 310KB, first-load 762KB).
 *
 * ⚠ **엔진은 배럴(`@/lib/engine`)이 아니라 딥 임포트로 가져온다.** 배럴은 `index.ts` 가
 *   score·infer·group·llm 계약까지 전부 다시 내보내므로, 오늘의 꽃 하나 뽑자고 추천
 *   엔진 전체를 끌고 온다. 필요한 것은 `today` 와 `stories` 둘뿐이다.
 * ⚠ 화면이 읽는 **모양(타입)·상수**는 `landing-data.ts` 가 갖는다. 여기에 화면용 상수를
 *   새로 만들지 마라 — 그 순간 클라이언트가 이 파일을 import 하게 된다.
 */

import { birthDateLabel, birthFlowerOn } from '@/lib/data/birth-flowers';
import type { Catalog, CatalogFlower, CatalogStory } from '@/lib/data/types';
import { pickStories } from '@/lib/engine/stories';
import { todayFlower, type TodayBasis } from '@/lib/engine/today';
import {
  canLeadHero,
  needsDarkOverlay,
  photoFor,
  photoSrc,
  photoSrcSet,
  unsplashSrcSet,
} from '@/lib/photos';
import { FLOWER_THEMES, getFlowerTheme } from '@/lib/theme/flowers';

import {
  CATEGORY_THEMES,
  SECTION_IMAGES,
  categoryOf,
  hasFinalConsonant,
  type BirthFlowerLine,
  type HeroImage,
  type LandingData,
  type SlideImage,
  type SlideView,
} from './landing-data';

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
  /* ── 확장 배치 1 (2026-08-16, seed-v6 15종) ────────────────────────────────
   * 같은 기준이다 — `meanings.csv` 에 실린 그 꽃의 꽃말에서만 끌어왔고, 꽃말이 슬픈 쪽인
   * 꽃(금잔화·스위트피)은 축하 자리로 데려가지 않았다(`caution_note` 가 이미 그렇게 적혀 있다).
   * 편집 검수 대상. */
  'sweet-pea': ['졸업하는 사람에게', '떠나는 이를 웃으며 배웅할 때'],
  gladiolus: ['오래 준비한 시험이 끝난 날에', '큰 무대를 마치고 내려온 사람에게'],
  dahlia: ['한껏 차려입은 자리에', '오래 기억될 축하를 하고 싶을 때'],
  zinnia: ['멀리 있는 친구를 떠올릴 때', '오래된 사이라고 말하고 싶을 때'],
  aster: ['믿고 있다고 말해주고 싶을 때', '가을 초입의 안부를 물을 때'],
  calendula: ['아쉬운 이별을 담담히 건널 때', '달이 바뀌는 첫날에 안부를 물을 때'],
  cyclamen: ['말수 적은 사람에게', '겨울 창가에 둘 화분을 고를 때'],
  geranium: ['오래된 친구에게 고맙다고 말할 때', '새집 창가를 밝혀 주고 싶을 때'],
  primula: ['봄이 오기 전에 먼저 인사할 때', '첫 마음을 조심스레 꺼낼 때'],
  stock: ['오래 함께한 사이를 기념할 때', '향으로 방을 채워 주고 싶을 때'],
  delphinium: ['훌쩍 떠나는 사람에게', '맑은 여름 인사를 건넬 때'],
  amaryllis: ['자랑스러운 소식을 들었을 때', '연말에 오래 두고 볼 선물을 고를 때'],
  cornflower: ['섬세한 사람에게', '기억하고 있다고 전하고 싶을 때'],
  crocus: ['새 학기를 시작하는 사람에게', '눈 속에서 봄을 기다리는 날에'],
  'water-lily': ['마음을 가라앉히고 싶은 사람에게', '한여름의 안부를 물을 때'],
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
 * 사진 — 폭 규율 (성능 리뷰 P1-4·5)
 * ------------------------------------------------------------------ */

/** 카드가 쓰는 폭. 카드는 화면에서 380px(좁은 화면 340px)라 1080 이 레티나 상한이다. */
const CARD_WIDTHS = [640, 1080] as const;

/** 히어로가 쓰는 폭. 풀블리드라 데스크톱은 2560 까지 올라간다. */
const HERO_WIDTHS = [1080, 1600, 2560] as const;

/** 히어로 모바일 소스(`max-width:720px`)가 쓰는 폭. */
const HERO_MOBILE_WIDTHS = [640, 1080] as const;

/**
 * 배경이 밝은 컷을 다크 팔레트로 끌어내리는 그레이딩(§1.4 팔레트 · §1.5g).
 *
 * 스크림만 올려도 글자는 읽히지만, 검정 배경 컷 27장 사이에 흰 배경 카드가 끼면 **그리드
 * 자체가 튄다**(docs/image-assets.md §통합할 때 주의할 것 4). 그래서 스크림 강화(카드 CSS)와
 * 이 필터를 함께 건다 — 색은 죽이지 않고 밝기만 내리는 값이라 라벤더 보라·안개꽃 흰빛은 남는다.
 */
const BRIGHT_GRADE = 'brightness(.74) saturate(.94) contrast(1.04)';

/** 카탈로그 꽃 id → 테마 상수(있을 때만). 사진·시안 꽃말의 출처다. */
function themeForFlower(flowerId: string) {
  return FLOWER_THEMES.find((theme) => theme.catalogFlowerId === flowerId);
}

/**
 * 카드 사진 한 장.
 *
 * 순서에 뜻이 있다: **테마 상수 컷이 먼저**다(§1.4c 5종은 편집 검수를 통과한 "장면"이고
 * 그레이딩 값까지 손으로 맞춰 뒀다). 나머지는 `@/lib/photos` 의 대표 실사가 채운다 —
 * 카탈로그 32종 전원에 컷이 있으므로 **"사진이 없어 그라디언트로 남는 카드"는 이제 없다.**
 *
 * 두 갈래 모두 `srcSet` 을 함께 낸다. 테마 컷은 크롭비(`h`)가 박힌 완성 주소라
 * `unsplashSrcSet` 이 폭·높이를 같은 비율로 갈아 끼운다.
 */
function slideImage(flowerId: string): SlideImage | undefined {
  const theme = themeForFlower(flowerId);
  if (theme) {
    return {
      src: theme.card.src,
      srcSet: unsplashSrcSet(theme.card.src, CARD_WIDTHS),
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
    srcSet: photoSrcSet(photo, CARD_WIDTHS),
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
 * 이야기 티저 — pickStories 실데이터.
 * 랜딩에는 사용자 상황이 없으므로 상황을 가리지 않는 `just_because` 로 고른다.
 */
function storyFor(flowerId: string, stories: CatalogStory[]) {
  return pickStories(flowerId, 'just_because', stories, 1).featured ?? undefined;
}

/* ------------------------------------------------------------------ *
 * 오늘의 꽃을 고른 이유 — 이야기에서 끌어온 한두 문장 (§1.5n)
 * ------------------------------------------------------------------ */

/**
 * 이유 문장의 앞머리 — **엔진의 선정 근거(`basis`)를 사람의 말로 옮긴 것.**
 * 뒤에 이야기 인용이 붙으므로 예전 리드보다 짧다(한 문장에 사연을 둘 담지 않는다).
 */
const BASIS_OPENING: Record<TodayBasis, string> = {
  in_season: '일 년을 기다려 지금이 한창인 꽃이에요.',
  adjacent: '이제 막 제철로 들어서는 꽃이에요.',
  all: '계절을 가리지 않고 한결같이 곁에 있는 꽃이에요.',
};

/** ① 이야기 훅을 인용했을 때의 맺음. 인용을 "초대장"으로 받는 자리다. */
const HOOK_CLOSING: Record<TodayBasis, string> = {
  in_season: '오늘은 이 이야기부터 들려드리고 싶었어요.',
  adjacent: '피기도 전에 이 이야기가 먼저 떠올랐어요.',
  all: '어느 날에 꺼내도 좋을 이야기라, 오늘 먼저 꺼냈어요.',
};

/** ② 이야기가 없어 꽃말을 재료로 쓸 때의 맺음. */
const MEANING_CLOSING: Record<TodayBasis, string> = {
  in_season: '오늘 같은 날 꺼내고 싶었어요.',
  adjacent: '피기 전부터 먼저 건네고 싶었어요.',
  all: '어느 날에 꺼내도 좋았어요.',
};

/** ③ 이야기도 꽃말도 없을 때. 재료가 없다고 문장을 비우지는 않는다. */
const BARE_CLOSING: Record<TodayBasis, string> = {
  in_season: '오늘을 그냥 보내기 아까워서 먼저 꺼냈어요.',
  adjacent: '피기 직전의 설렘부터 먼저 건네고 싶었어요.',
  all: '어느 날에 꺼내도 좋아서 오늘 꺼냈어요.',
};

/**
 * 인용할 수 있는 훅으로 다듬는다 — **다듬는 것은 앞뒤 공백과 마침표 하나뿐이다.**
 *
 * 훅은 §1.5d 이야기 문체 규범이 합니다체 헤드라인을 허용한 자리이고, 그 무덤덤함이
 * 그대로 매력이라 **문장은 절대 다시 쓰지 않는다.** 다만 317편 중 212편은 마침표로
 * 끝나고 105편은 그냥 끝난다 — 그대로 인용하면 `“…있습니다.” —` 와 `“…있습니다” —` 가
 * 날마다 번갈아 나온다. 인용 부호 안의 문장부호는 인용하는 쪽 조판의 몫이라, 문장 끝
 * 마침표 하나만 떼어 317편을 같은 모양으로 세운다.
 * ⚠ `?` `!` 는 떼지 않는다 — 그건 조판이 아니라 화자의 어조다.
 */
function quotableHook(hook: string | undefined): string | undefined {
  const text = hook?.trim().replace(/\.$/, '').trim();
  return text ? text : undefined;
}

/**
 * FNV-1a 32비트 — `today.ts` 와 같은 함수를 여기에 한 벌 더 둔다.
 *
 * 그쪽은 모듈 내부 함수이고, 오늘의 꽃 배정이라는 **다른 계약**을 지키는 자리다.
 * 내보내 공유하면 이 문장 하나를 손보려다 날짜→꽃 배정이 통째로 밀릴 수 있어
 * (해시 입력이 같은 함수를 공유하는 순간 그렇게 된다) 일부러 갈라 둔다.
 */
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1a32(input: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/**
 * 오늘 인용할 훅 하나.
 *
 * 후보 순서는 **슬라이드 티저와 같은 경로**(`pickStories(…, 'just_because')`)에서 온다 —
 * 이야기 순서를 정하는 규칙을 두 벌 두지 않기 위해서다. 다르게 하는 것은 하나뿐:
 * 티저는 늘 1순위를 쓰고, 여기서는 **날짜를 씨앗으로 후보 중 하나를 고른다.**
 *
 * 그래서 같은 꽃이 다시 오늘의 꽃이 돼도 다른 이야기가 나온다(장미는 23편이다).
 * 결정성은 그대로다 — 씨앗이 `날짜 + 꽃 id` 뿐이라 **같은 날 새로고침은 같은 문장**이고,
 * 서버·클라이언트·테스트가 모두 같은 값을 낸다(LLM 을 쓰지 않는 이유이기도 하다).
 */
export function pickReasonHook(
  flowerId: string,
  stories: CatalogStory[],
  todayISO: string,
): string | undefined {
  const mine = stories.filter((story) => story.flowerId === flowerId);
  if (mine.length === 0) return undefined;

  const { featured, others } = pickStories(flowerId, 'just_because', stories, mine.length);
  const pool = [...(featured ? [featured] : []), ...others]
    .map((story) => quotableHook(story.hook))
    .filter((hook): hook is string => hook !== undefined);
  if (pool.length === 0) return undefined;

  return pool[fnv1a32(`${todayISO}:${flowerId}:reason`) % pool.length];
}

/**
 * "왜 이 꽃을 오늘 꺼냈는가" 한두 문장 (§1.5n).
 *
 * 재료 3단(이야기 훅 → 꽃말 → 없음) × `basis` 3분기 = 9가지 조합이며, 모두 규칙 조합이라
 * **로컬에서도 그대로 돈다**(모델 호출 없음 · 사용자 요청 2026-08-16).
 *
 * ⚠ 훅은 `“…”` 로, 꽃말은 `‘…’` 로 감싼다. 훅 원문에는 `"` 와 `'` 가 섞여 있어
 *   (317편 중 26편) 홑·겹 **타이포그래픽 따옴표**라야 안쪽 인용과 겹치지 않는다.
 */
export function composeTodayReason(input: {
  basis: TodayBasis;
  /** 그 꽃 이야기에서 끌어온 헤드라인 한 줄. `pickReasonHook` 이 고른다. */
  hook?: string;
  /** 대표 꽃말. 훅이 없을 때만 쓴다. */
  meaning?: string;
}): string {
  const opening = BASIS_OPENING[input.basis];

  const hook = quotableHook(input.hook);
  if (hook) return `${opening} “${hook}” — ${HOOK_CLOSING[input.basis]}`;

  const meaning = input.meaning?.trim();
  if (meaning) {
    const particle = hasFinalConsonant(meaning) ? '이라는' : '라는';
    return `${opening} ‘${meaning}’${particle} 말을 품은 꽃이라, ${MEANING_CLOSING[input.basis]}`;
  }

  return `${opening} ${BARE_CLOSING[input.basis]}`;
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

/* ------------------------------------------------------------------ *
 * 탄생화 각주 (§1.5e 절제)
 * ------------------------------------------------------------------ */

/**
 * 오늘 날짜의 탄생화 한 줄.
 *
 * 날짜는 **`todayISO` 문자열에서 쪼갠다** — `new Date(todayISO)` 로 되돌리면 UTC 로 파싱돼
 * 서버 시간대에 따라 하루가 밀린다(`seoulTodayISO` 가 애써 맞춰 놓은 서울 달력이 무너진다).
 *
 * 도감 링크는 **`flowerId` 가 실제로 카탈로그에 있을 때만** 건다. 시드 교차 검증이 이미
 * 참조 무결성을 보고 있지만, 링크는 끊기면 404 로 곧장 드러나는 자리라 화면 쪽에서도 확인한다.
 */
function birthFlowerLine(catalog: Catalog, todayISO: string): BirthFlowerLine | undefined {
  const [, monthText, dayText] = todayISO.split('-');
  const row = birthFlowerOn(catalog.birthFlowers, Number(monthText), Number(dayText));
  if (!row) return undefined;

  const linked = row.flowerId && catalog.flowers.some((flower) => flower.id === row.flowerId);

  return {
    dateLabel: birthDateLabel(row.month, row.day),
    name: row.nameKo,
    meaning: row.meaningKo,
    meaningCopula: hasFinalConsonant(row.meaningKo) ? '이에요' : '예요',
    ...(linked ? { href: `/flowers/${row.flowerId}` } : {}),
  };
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
  const birthFlower = birthFlowerLine(catalog, todayISO);

  /**
   * 고른 이유 한 문장 (§1.5n).
   *
   * 꽃말은 `today.meaning` 이 아니라 **원천에서 다시 읽는다** — 그 값은 꽃말이 없을 때
   * `아직 갈래를 고르는 중이에요` 라는 화면용 자리표시로 채워져 있어서, 그대로 인용하면
   * `‘아직 갈래를 고르는 중이에요’라는 말을 품은 꽃이라` 가 나온다.
   */
  const todayTheme = themeForFlower(todayCatalogFlower.id);
  const todayReason = composeTodayReason({
    basis: picked.basis,
    hook: pickReasonHook(todayCatalogFlower.id, catalog.stories, todayISO),
    meaning: todayTheme?.meaning ?? meaningFor(todayCatalogFlower, catalog)?.meaningKo,
  });
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
        srcSet: photoSrcSet(heroPhoto, HERO_WIDTHS),
        // 모바일은 4:5 별도 크롭 대신 같은 컷의 좁은 폭을 쓴다(히어로는 object-fit: cover 다).
        srcMobile: photoSrc(heroPhoto, 1080),
        srcSetMobile: photoSrcSet(heroPhoto, HERO_MOBILE_WIDTHS),
        alt: heroPhoto.alt,
        credit: heroPhoto.credit,
        // 밝은 컷 4종은 히어로에서도 같은 그레이딩으로 눌러야 다크 팔레트가 유지된다.
        ...(needsDarkOverlay(heroPhoto) ? { grade: BRIGHT_GRADE } : {}),
      }
    : {
        src: heroTheme.hero.src,
        srcSet: unsplashSrcSet(heroTheme.hero.src, HERO_WIDTHS),
        srcMobile: heroTheme.hero.srcMobile,
        srcSetMobile: heroTheme.hero.srcMobile
          ? unsplashSrcSet(heroTheme.hero.srcMobile, HERO_MOBILE_WIDTHS)
          : undefined,
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

  const [, todayMonth, todayDay] = todayISO.split('-');

  return {
    todayISO,
    todayLabel: todayISO.replaceAll('-', '.'),
    // 탄생화 각주와 **같은 함수**로 만든다 — 두 줄이 같은 오늘을 같은 말로 불러야 한다.
    todayDateLabel: birthDateLabel(Number(todayMonth), Number(todayDay)),
    basis: picked.basis,
    todayReason,
    category: today.category,
    themeSlug: categoryTheme.slug,
    categoryLabel: categoryTheme.label,
    hero,
    today,
    ...(birthFlower ? { birthFlower } : {}),
    slides,
    credits,
  };
}
