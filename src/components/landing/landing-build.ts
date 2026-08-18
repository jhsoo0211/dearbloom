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
import { occasionsFor } from '@/lib/data/occasions';
import type { Catalog, CatalogFlower, CatalogStory } from '@/lib/data/types';
import { pickStories } from '@/lib/engine/stories';
/**
 * ⚠ `@/lib/engine` 배럴이 아니라 **타입만** 딥 임포트한다(파일 머리말의 규율). `import type`
 *   은 컴파일에서 통째로 지워지므로 번들에 아무것도 싣지 않는다. `pickStories` 가 돌려주는
 *   것이 `StoryRow` 라 `CatalogStory`(= StoryRow + reviewedAt)로 좁혀 받을 수 없다.
 */
import type { StoryRow } from '@/lib/engine/types';
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
  withParticle,
  type BirthFlowerLine,
  type HeroImage,
  type LandingData,
  type SlideImage,
  type SlideView,
  type TodayReasonLink,
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

/* ── "이런 날 건네보세요" (§1.5h) — 걷어 냄 (2026-08-18) ──────────────────
 * `OCCASIONS` 하드코딩 33종이 여기 있었다. 원장은 이제 `content/occasions.csv` 이고,
 * 고르는 일은 `@/lib/data/occasions` 의 `occasionsFor` 가 한다.
 *
 * ⚠ 이 화면의 문구는 `surface=landing` 행이다. 결과 화면·도감이 쓰는 `detail` 행과
 *   **문구가 다른 꽃이 12종 있다** — 이관 시점에 두 하드코딩이 이미 갈라져 있었고,
 *   한쪽으로 접는 것은 편집 작업이라 문구를 그대로 두고 화면만 갈랐다.
 *   합치기로 정해지면 CSV 에서 이긴 쪽만 남기고 `surface` 를 비우면 된다.
 */

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
 * 오늘의 꽃 리드 — 세 마디 문단 (§1.5n v3)
 * ------------------------------------------------------------------ */

/**
 * ── 왜 세 마디인가 (2026-08-17 사용자 피드백) ────────────────────────────────
 *
 * v2 는 두 마디였다: `{꽃 이름 + 고른 이유}` 다음에 곧바로 `“{이야기 훅}” — {맺음}`.
 * 사용자가 짚은 것 두 가지다.
 *
 *   ⑴ **이야기가 첫마디 바로 뒤에 붙어 버린다.** 처음 온 사람에게 설화 한 줄부터
 *      들이미는 모양이라, 꽃을 건네는 말이 아니라 지식 카드처럼 읽힌다.
 *   ⑵ 맺음 한 벌이 `이 한 줄을 아는 사람이 많지 않더라고요.` 였다. **아는 사람과
 *      모르는 사람을 가르는 말**이다. 건네는 서비스가 할 말이 아니다.
 *
 * 그래서 마디를 셋으로 늘린다:
 *   ① **오늘이라는 날** — `8월 중순이잖아요.`
 *   ② **그래서 이 꽃을 골랐어요** — `이맘때는 눈이라도 시원한 게 반가워서, 마침 제철인
 *      수국을 골랐어요.`
 *   ③ **(있으면) 이야기 한 줄** — `“…” — 저도 찾아보다 알게 된 이야기예요.`
 *
 * 사용자의 말: "오늘 날씨가 덥더라구요 그래서 시원한 수국을 골랐어요 이런 느낌".
 *
 * ⚠ **날씨를 지어내지 않는다.** 우리에게 기상 데이터가 없다 — `오늘 더웠어요` 는 우리가
 *   모르는 사실이다. 대신 **날짜에서 참으로 끌어낼 수 있는 것**(달·순·계절)만 ① 에 쓰고,
 *   ② 는 그 계절과 꽃의 **실제 속성**(대표색·향·결·개화 폭·제철)을 잇는다. 그러면
 *   사용자가 원한 결이 거짓말 없이 선다.
 * ⚠ **24절기 이름은 부르지 않는다.** 절기는 해마다 하루 안팎 움직여 표 없이 못박으면
 *   틀린 날이 생긴다. 달과 순(旬)만으로도 같은 일을 할 수 있어 표를 들이지 않았다.
 *
 * ── v2 에서 이어지는 원칙(그대로 유지) ────────────────────────────────────────
 * 값이 아니라 **틀을 회전시킨다.** 씨앗은 날짜(+슬롯 이름)뿐이라 결정성은 그대로다:
 * 같은 날 새로고침은 같은 문단이고, 서버·테스트가 같은 값을 본다.
 *   · **날짜를 통보하지 않는다.** `8월 16일` 은 히어로 캡션과 탄생화 줄이 이미 말한다.
 *     ① 이 부르는 것은 날짜가 아니라 **계절 속의 위치**(`8월 중순`)다.
 *   · **문장끼리 잇는다.** 독립 완결문 나열(사실 → 사실 → 안내)은 사람의 말이 아니다.
 *   · 꽃 이름은 조사를 데이터에서 맞춘다(`withParticle`) — `프리지아을` 이 나오는 순간
 *     공들인 문장 전체가 기계 티를 낸다.
 */

/** 달의 순(旬). 1–10 초순 · 11–20 중순 · 21–말일 하순. */
type DayPhase = 'early' | 'mid' | 'late';

/** 계절. 3–5 봄 · 6–8 여름 · 9–11 가을 · 12–2 겨울. */
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * **날짜가 실제로 말해 주는 것만** 담은 쪽지. 여기에 없는 것(기온·비·눈)은 문장에 쓸 수 없다.
 */
interface DayNote {
  /** 1–12. */
  month: number;
  /** 1–말일. */
  day: number;
  /** 그 달의 말일. `며칠 남지 않았어요` 를 참으로 만들려면 필요하다. */
  lastDay: number;
  phase: DayPhase;
  season: Season;
}

const SEASON_LABEL: Record<Season, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function lastDayOf(year: number, month: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  if (month === 2 && leap) return 29;
  return MONTH_LENGTHS[month - 1];
}

function seasonOf(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * `YYYY-MM-DD` → 오늘이라는 날.
 *
 * ⚠ `new Date(todayISO)` 로 되돌리지 않는다 — UTC 로 파싱돼 서버 시간대에 따라 하루가
 *   밀린다(`seoulTodayISO` 가 애써 맞춰 놓은 서울 달력이 무너진다). 문자열에서 쪼갠다.
 *
 * 읽을 수 없는 값이면 `undefined` 다. 그런 날은 ① 을 통째로 생략하고 ②(+③)만 세운다 —
 * 리드 한 문단 때문에 첫 화면이 무너지는 편보다 한 마디 짧은 편이 낫다.
 */
function dayNoteOf(todayISO: string): DayNote | undefined {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(todayISO);
  if (matched === null) return undefined;

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (month < 1 || month > 12) return undefined;

  const lastDay = lastDayOf(year, month);
  if (day < 1 || day > lastDay) return undefined;

  const phase: DayPhase = day <= 10 ? 'early' : day <= 20 ? 'mid' : 'late';
  return { month, day, lastDay, phase, season: seasonOf(month) };
}

/**
 * 마디 ① — **오늘이라는 날 한 마디.**
 *
 * 전부 날짜에서 참으로 끌어낸 말이다(달·순·말일까지 남은 날). 짧아야 한다 — ②·③ 이
 * 뒤에 서므로 여기서 두 문장을 쓰면 문단이 화면 자리를 넘긴다.
 *
 * ⚠ **여기서 계절 이름을 부르지 않는다.** ② 가 `여름에는 …` 을 쓰는 벌이 있어, 둘 다
 *   계절을 부르면 한 문단에서 같은 말을 두 번 하게 된다. ① 은 달과 순까지만 말한다.
 *
 * ── ⚠⚠ 변주 칸을 채우려고 문장을 지어내지 마라 (2026-08-17 사용자 피드백 세 번째) ──────
 *
 * v3 의 중순 칸에는 `{M}월의 가운데 열흘이에요.` 가 있었다. 중순(中旬)을 글자 그대로 푼
 * 말이라 **뜻으로는 맞지만 아무도 그렇게 말하지 않는다.** 사용자가 그 한 줄을 보고
 * "이게 뭔 말이니" 라고 했다. 왜 그 문장이 태어났는지는 당시 계측 보고에 그대로 적혀
 * 있다 — *"날짜만으로 중순에 대해 참으로 할 수 있는 말이 많지 않아 표현 변주로 채웠다."*
 *
 * **벌 수는 목표가 아니다.** 자연스러운 말이 셋뿐이면 셋으로 간다. 네 번째 자리를 억지로
 * 채운 어색한 문장 하나가, 늘어난 변주가 주는 이득을 통째로 까먹는다 — 사용자는 그 하나를
 * 보고 서비스 전체를 의심한다. 새 벌을 넣기 전에 **소리 내어 읽고** 물어라:
 * "사람이 말할 때 이렇게 말하나?" 애매하면 넣지 마라.
 *
 * 이 개정에서 버린 것: `{M}월의 가운데 열흘이에요`(중순의 직역) · `{M}월 한가운데예요`
 * (문어투) · `{M}월의 첫머리예요`(글의 첫머리에 쓰는 말) · `{M}월이 저물어 가요`(해·하루에
 * 쓰는 말) · `{M}월에서 {M+1}월로 넘어가는 참이에요`(설명조) · `이제 막 {M}월에
 * 들어섰어요`(문어투 → `막 시작됐어요` 로 고쳐 씀) · `{M}월도 하순으로 접어들었어요`
 * (일기예보 말투 → `{M}월도 하순이네요` 로 고쳐 씀).
 *
 * 적용되지 않는 벌은 `undefined` 를 돌려주고 `pickApplicable` 이 걸러 낸다.
 */
type Opener = (note: DayNote) => string | undefined;

const OPENERS: readonly Opener[] = [
  // 초순 — 셋은 늘 서고, 넷째는 정말 초입일 때만.
  ({ month, phase }) => (phase === 'early' ? `${month}월 초예요.` : undefined),
  ({ month, phase }) => (phase === 'early' ? `달이 바뀌어 ${month}월이에요.` : undefined),
  ({ month, phase }) => (phase === 'early' ? `이제 ${month}월이네요.` : undefined),
  ({ month, day, phase }) =>
    phase === 'early' && day <= 5 ? `${month}월이 막 시작됐어요.` : undefined,
  // 중순 — **셋뿐이다.** 넷째 자리를 억지로 채우지 않았다(위 주석).
  ({ month, phase }) => (phase === 'mid' ? `${month}월 중순이잖아요.` : undefined),
  ({ month, phase }) => (phase === 'mid' ? `벌써 ${month}월 중순이네요.` : undefined),
  ({ month, phase }) => (phase === 'mid' ? `${month}월도 절반쯤 왔어요.` : undefined),
  // 하순
  ({ month, phase }) => (phase === 'late' ? `${month}월 끝자락이에요.` : undefined),
  ({ month, phase }) => (phase === 'late' ? `${month}월도 하순이네요.` : undefined),
  /** ⚠ 말일 **당일**은 뺀다 — 남은 날이 0인데 `며칠 남았다` 고 하면 그날 하루가 틀린 말이 된다. */
  ({ month, day, lastDay, phase }) =>
    phase === 'late' && lastDay - day >= 1 && lastDay - day <= 6
      ? `${month}월도 며칠 남지 않았어요.`
      : undefined,
  /** 달의 길목. `며칠 남지 않았어요` 보다 좁게 잡아 마지막 나흘에만 선다. */
  ({ month, day, lastDay, phase }) =>
    phase === 'late' && lastDay - day <= 3 ? `곧 ${month === 12 ? 1 : month + 1}월이에요.` : undefined,
];

/* ------------------------------------------------------------------ *
 * 마디 ② — 날과 꽃을 **실제 속성으로** 잇는다
 * ------------------------------------------------------------------ */

/** 색에서 오는 인상의 갈래. 사실 주장이 아니라 **우리 눈에 그렇게 보인다**는 뜻이다. */
type ToneKey = 'cool' | 'warm' | 'bright' | 'soft' | 'deep';

interface ColorTone {
  /** 관형형 — `${adnominal} 빛이 반갑잖아요`. */
  adnominal: string;
  /** `빛깔이 ${looks} 눈이 갔어요` 자리. 한국어 어미가 색마다 갈려 통째로 적어 둔다. */
  looks: string;
  key: ToneKey;
}

/**
 * 대표색(`colors[0]`) → 인상 한 마디.
 *
 * ⚠ **단정하지 않는다.** `시원합니다` 가 아니라 `시원해 보여서` 다 — 색이 주는 인상은
 *   우리가 그렇게 봤다는 말이지 꽃의 성질이 아니다(§1.5d 과장 금지).
 *
 * `variegated` 는 일부러 비워 뒀다 — 카탈로그 59종 중 그것을 대표색으로 가진 꽃이 없고,
 * "무늬가 섞인 색"에서 한 갈래의 인상을 뽑는 것 자체가 무리다. 없으면 색을 쓰는 벌이
 * 통째로 빠지고 향·결·제철 쪽 벌이 대신 선다.
 */
const COLOR_TONES: Record<string, ColorTone> = {
  blue: { adnominal: '시원한', looks: '시원해 보여서', key: 'cool' },
  green: { adnominal: '서늘한', looks: '서늘해 보여서', key: 'cool' },
  white: { adnominal: '맑은', looks: '맑아 보여서', key: 'cool' },
  cream: { adnominal: '포근한', looks: '포근해 보여서', key: 'soft' },
  pink: { adnominal: '부드러운', looks: '부드러워 보여서', key: 'soft' },
  yellow: { adnominal: '환한', looks: '환해 보여서', key: 'bright' },
  orange: { adnominal: '따뜻한', looks: '따뜻해 보여서', key: 'warm' },
  coral: { adnominal: '따뜻한', looks: '따뜻해 보여서', key: 'warm' },
  red: { adnominal: '따뜻한', looks: '따뜻해 보여서', key: 'warm' },
  magenta: { adnominal: '짙은', looks: '짙어 보여서', key: 'deep' },
  purple: { adnominal: '차분한', looks: '차분해 보여서', key: 'deep' },
  brown: { adnominal: '깊은', looks: '깊어 보여서', key: 'deep' },
};

/**
 * 이름 앞에 붙은 색말 → 색. **화면 이름이 색을 말하면 그 색을 믿는다.**
 *
 * 대표색(`colors[0]`)은 **종(種)** 의 색이고, 화면 이름은 테마 상수가 고른 **품종**의 이름이다.
 * 둘이 어긋나는 꽃이 실제로 있다: `lily-asiatic` 의 `colors[0]` 은 `orange` 인데 화면에는
 * `흰 백합` 으로 선다(§1.4c 시안 이름). 그대로 두면 `빛깔이 따뜻해 보여서 흰 백합을
 * 꺼냈어요` 가 나온다 — **읽는 사람 눈에 곧장 걸리는 모순**이다. 이름이 흰색이라고 말하고
 * 있으면 그 이름을 따른다.
 *
 * ⚠ 이름에 색말이 없으면(대부분) 그냥 `colors[0]` 이다. 이 표는 이름이 색을 **명시할 때만**
 *   끼어든다 — 꽃 이름에서 색을 추측하는 표가 아니다.
 */
const NAME_COLOR: Record<string, string> = {
  흰: 'white',
  하얀: 'white',
  빨간: 'red',
  붉은: 'red',
  노란: 'yellow',
  파란: 'blue',
  보라: 'purple',
  분홍: 'pink',
};

/** 화면 이름이 색을 말하면 그 색을, 아니면 카탈로그 대표색을. */
export function reasonColorOf(flowerName: string, catalogColor: string | undefined) {
  return NAME_COLOR[flowerName.trim().split(' ')[0]] ?? catalogColor;
}

/**
 * 그 계절에 **반가운 인상**. 사용자가 말한 "더우니까 시원한 걸 골랐어요"를 날씨 없이
 * 세우는 고리다 — 여름이 시원한 색을 반긴다는 것은 오늘의 기온이 아니라 계절의 일반화다.
 */
const SEASON_WELCOME: Record<Season, readonly ToneKey[]> = {
  spring: ['bright', 'soft'],
  summer: ['cool'],
  autumn: ['deep', 'warm'],
  winter: ['warm', 'bright'],
};

const WELCOME_PHRASE: Record<ToneKey, string> = {
  cool: '눈이라도 시원한 게 반가워서',
  warm: '눈이라도 따뜻한 게 반가워서',
  bright: '환한 색이 먼저 반가워서',
  soft: '부드러운 색이 편해서',
  deep: '조금 가라앉은 색이 어울려서',
};

/**
 * `aestheticTags` 5종 → 결 한 마디. 뒤에 `눈이 갔어요` 가 붙으므로 **연결어미로 끝난다.**
 * 모양을 단정하는 말(`동글동글한`)은 피했다 — 같은 태그 아래 생김새가 제각각이다.
 */
const TAG_PHRASE: Record<string, string> = {
  calm: '요란하지 않은 꽃이라',
  minimal: '군더더기 없이 생긴 꽃이라',
  elegant: '선이 단정한 꽃이라',
  cute: '보고 있으면 마음이 조금 풀리는 꽃이라',
  vivid: '색이 또렷한 꽃이라',
};

/** 개화 폭이 아주 좁은 꽃의 달 수를 세는 말. */
const SPAN_WORD: Record<number, string> = { 1: '한', 2: '두' };

/** ② 가 쥘 수 있는 재료 전부. 없는 재료는 그 벌을 통째로 물러나게 한다. */
interface WhyNote {
  note?: DayNote;
  /** 화면에 서는 꽃 이름. 조사는 `withParticle` 이 붙인다. */
  name: string;
  tone?: ColorTone;
  fragranceLevel?: 0 | 1 | 2 | 3;
  /** 오늘 고른 결 한 마디(`TAG_PHRASE`). */
  tagPhrase?: string;
  /** `bloomMonths` 의 달 수. */
  bloomSpan?: number;
}

type Why = (note: WhyNote) => string | undefined;

/**
 * 마디 ② — `basis` 3분기.
 *
 * ⚠ **`in_season` 이 가장 두껍다.** 현 카탈로그는 366일 전부 `in_season` 이라(감사 리포트
 *   P1-3) 화면에 실제로 뜨는 것은 이 갈래뿐이다. 나머지 둘은 카탈로그가 얇아지는 날을
 *   위한 사다리라 네 벌씩만 둔다.
 * ⚠ **꽃말은 ② 에 쓰지 않는다.** 꽃말은 ③ 의 폴백 재료라, 여기서 부르면 훅이 없는 날
 *   한 문단이 같은 재료를 두 번 말하게 된다(§1.5n 재료 겹침 금지).
 */
const WHYS: Record<TodayBasis, readonly Why[]> = {
  in_season: [
    /**
     * 색 인상이 계절과 공명할 때 — 사용자가 말한 그 자리다.
     * `8월 중순이잖아요. 이맘때는 눈이라도 시원한 게 반가워서, 마침 제철인 수국을 골랐어요.`
     */
    ({ note, tone, name }) =>
      note && tone && SEASON_WELCOME[note.season].includes(tone.key)
        ? `이맘때는 ${WELCOME_PHRASE[tone.key]}, 마침 제철인 ${withParticle(name, 'object')} 골랐어요.`
        : undefined,
    ({ note, tone, name }) =>
      note && tone && SEASON_WELCOME[note.season].includes(tone.key)
        ? `${SEASON_LABEL[note.season]}에는 ${tone.adnominal} 빛이 반갑잖아요. 지금 한창인 ${withParticle(name, 'object')} 꺼냈어요.`
        : undefined,
    ({ note, tone, name }) =>
      note && tone && SEASON_WELCOME[note.season].includes(tone.key)
        ? `${SEASON_LABEL[note.season]}이라 ${tone.adnominal} 쪽으로 손이 갔어요. 마침 제철인 ${withParticle(name, 'copula')}.`
        : undefined,
    /**
     * 계절과 어긋나는 색이어도 **우리 눈에 든 것**은 말할 수 있다.
     *
     * ⚠ 공명하는 날에는 물러난다. `여름에는 시원한 빛이 반갑잖아요` 와 `빛깔이 시원해
     *   보여서` 는 같은 말을 세기만 달리한 것이라, 둘을 같은 후보군에 두면 사용자가 짚어
     *   준 그 문장(계절 ↔ 색)이 절반 이하로 밀린다.
     */
    ({ note, tone, name }) =>
      tone && !(note && SEASON_WELCOME[note.season].includes(tone.key))
        ? `빛깔이 ${tone.looks} 눈이 갔어요. 마침 제철이라 ${withParticle(name, 'object')} 꺼냈어요.`
        : undefined,
    ({ fragranceLevel, name }) =>
      fragranceLevel === 3
        ? `향이 진해서 한 송이만 둬도 티가 나요. 지금이 제철이라 ${withParticle(name, 'object')} 꺼냈어요.`
        : undefined,
    ({ fragranceLevel, name }) =>
      fragranceLevel === 0
        ? `향이 거의 없어 어디에 둬도 편해요. 지금이 제철이라 ${withParticle(name, 'object')} 골랐어요.`
        : undefined,
    ({ tagPhrase, name }) =>
      tagPhrase
        ? `${tagPhrase} 눈이 갔어요. 마침 제철이라 ${withParticle(name, 'object')} 꺼냈어요.`
        : undefined,
    /** `지금이 그 안이라` 는 "그 안"이 무엇인지 되짚게 만들어서 `딱 그 {N} 달` 로 고쳐 썼다. */
    ({ bloomSpan, name }) =>
      bloomSpan !== undefined && SPAN_WORD[bloomSpan]
        ? `일 년에 ${SPAN_WORD[bloomSpan]} 달만 피는 꽃이에요. 지금이 딱 그 ${SPAN_WORD[bloomSpan]} 달이라 ${withParticle(name, 'object')} 꺼냈어요.`
        : undefined,
    ({ bloomSpan, name }) =>
      bloomSpan === 12
        ? `일 년 내내 볼 수 있는 꽃이지만, 오늘은 ${withParticle(name, 'subject')} 먼저 떠올랐어요.`
        : undefined,
    /** ① 을 받아 잇는 벌. ① 이 없는 날(읽을 수 없는 날짜)에는 `그래서` 가 붕 뜨므로 물러난다. */
    ({ note, name }) =>
      note
        ? `그래서 지금 피어 있는 꽃들 사이에서 ${withParticle(name, 'object')} 꺼냈어요.`
        : undefined,
  ],
  adjacent: [
    /** `제철은 한 뼘 비켜 있지만요` 는 문어투라 `조금 비켜 있긴 하지만요` 로 고쳐 썼다. */
    ({ tone, name }) =>
      tone
        ? `빛깔이 ${tone.looks} ${withParticle(name, 'object')} 꺼냈어요. 제철에서 조금 비켜 있긴 하지만요.`
        : undefined,
    ({ tagPhrase, name }) =>
      tagPhrase
        ? `${tagPhrase} 제철이 아닌 날에도 눈이 갔어요. 그래서 ${withParticle(name, 'object')} 골랐어요.`
        : undefined,
    /**
     * `adjacent` 는 앞뒤 달을 함께 훑은 결과라(`today.ts`) 갓 피는 꽃일 수도, 막 진 꽃일
     * 수도 있다. 그래서 **방향을 말하지 않는 벌**을 함께 둔다.
     */
    ({ note, name }) =>
      note
        ? `제철에서 조금 비켜난 날인데도 눈에 들어왔어요. 그래서 ${withParticle(name, 'object')} 골랐어요.`
        : undefined,
  ],
  all: [
    ({ tone, name }) =>
      tone
        ? `빛깔이 ${tone.looks} ${withParticle(name, 'object')} 골랐어요. 철을 따지지 않고 곁에 두기 좋은 꽃이에요.`
        : undefined,
    ({ tagPhrase, name }) =>
      tagPhrase
        ? `${tagPhrase} 오늘 먼저 떠올랐어요. 철도 크게 가리지 않아서 ${withParticle(name, 'object')} 꺼냈어요.`
        : undefined,
    ({ note, name }) =>
      note
        ? `철을 크게 가리지 않는 꽃이라, 오늘 같은 날에도 어울릴 것 같아 ${withParticle(name, 'object')} 꺼냈어요.`
        : undefined,
  ],
};

/**
 * 후보군이 통째로 빈 날의 **마지막 한 벌** — `basis` 별로 하나씩.
 *
 * 위 표는 벌마다 재료(날짜·색·향·결·개화 폭)를 하나씩 쥐고 있어, 그 재료가 전부 없으면
 * 아무 벌도 서지 못한다. 그런 날에도 문단은 서야 하므로 여기서 받는다.
 *
 * ⚠ 표 안에 무조건 서는 벌을 하나 끼워 두는 편이 짧지만, 그러면 그 벌이 **매일 후보군에
 *   섞여** 실제 화면에서 5분의 1쯤을 가져간다 — 재료를 쥔 문장들이 그만큼 밀린다.
 *   재료 없는 문장은 재료가 없을 때만 서는 게 맞아서 표 밖으로 뺐다.
 */
const WHY_FALLBACKS: Record<TodayBasis, (name: string) => string> = {
  in_season: (name) =>
    `지금이 딱 ${withParticle(name, 'subject')} 피는 때예요. 그래서 오래 고민하지 않았어요.`,
  adjacent: (name) =>
    `아직 한창은 아니지만, 곧 올 계절을 먼저 기다리고 싶어 ${withParticle(name, 'object')} 꺼냈어요.`,
  /** `순서를 미루지 않고` 는 무슨 순서인지 짚이지 않아 뺐다 — 우리 머릿속 로테이션의 말이다. */
  all: (name) =>
    `언제 건네도 어색하지 않은 꽃이거든요. 그래서 오늘 ${withParticle(name, 'object')} 골랐어요.`,
};

/* ------------------------------------------------------------------ *
 * 마디 ③ — 이야기 (§1.5n v4 · 2026-08-17 사용자 피드백 두 번째)
 * ------------------------------------------------------------------ */

/**
 * ── 왜 ③ 이 세 조각인가 ────────────────────────────────────────────────────
 *
 * v3 의 ③ 은 `“{훅}” — {맺음}` 두 조각이었다. 사용자가 짚은 것:
 * *"갑자기 이야기 한 줄 나오고 «멈추게 되는 문장이었어요» 하니까 뭔 말인지 모를 수도 있다."*
 *
 * 진단: **훅은 이야기 본문 위에 얹히도록 쓰인 헤드라인이다.** 본문에서 떼어 문단 끝에 홀로
 * 두면 단서가 없다 — `“물을 많이 먹어서 붙은 이름이 아니었습니다”` 만 보면 무엇의 이름인지,
 * 그럼 어디서 왔는지 알 길이 없어 수수께끼가 된다. 그 상태에서 `읽다가 한참을 멈추게 되는
 * 문장이었어요` 라고 하면 **멈출 이유를 못 찾은 채 멈추라는 말만** 듣는다. 우리만 아는
 * 감동을 통보하는 꼴이라, v2 의 "아는 사람만 아는" 문제가 형태를 바꿔 되살아난 것이다.
 *
 * 그래서 ③ 을 세 조각으로 나눈다:
 *   ㉠ **어디서 온 이야기인지** — `19세기 프랑스에서 온 이야기예요.`
 *   ㉡ **훅 인용** — 규칙 그대로(마침표 하나만 떼고 `“…”`, `?`·`!` 유지, 원문 불변)
 *   ㉢ **이어 읽을 수 있다는 안내** — `이어지는 이야기는 도감에 옮겨 두었어요.`
 *
 * ⚠ ㉠ 은 **출처의 좌표만** 말한다. 이야기 내용을 요약하려 들면 우리가 본문을 다시 쓰는
 *   셈이고, 그 순간 사실이 틀어진다.
 */

/**
 * ㉢ 맺음 — **감정 통보에서 초대로.**
 *
 * v3 의 네 벌은 전부 우리가 느낀 것을 알리는 말이었다(`읽다가 한참을 멈추게 되는 문장…`).
 * 독자는 아직 이야기를 읽지 않았으므로 그 감정을 가질 수가 없다 — 대신 **뒷이야기가 어디
 * 있는지**를 말한다.
 *
 * ⚠ 이 안내가 참인 근거: 오늘의 꽃 카드는 덮개 링크로 `/flowers/{id}` 로 가고
 *   (`TodayCarousel` — 카드에 `도감에서 보기` 라벨이 보인다), 그 상세의 `꽃에 얽힌 이야기`
 *   구획이 그 꽃의 이야기를 **전문 그대로** 싣는다(`app/flowers/[slug]/page.tsx`).
 *   그 동선을 걷어 내면 이 네 문장이 거짓이 되므로 함께 고쳐야 한다.
 * ⚠ **아직 읽지 않은 것에 대한 감상을 대신 단정하지 않는다**(§1.5n v4 금지선).
 *   `멈추게·뭉클·소름·감동…` 류는 366일 전수 검사가 막는다.
 * ⚠ **㉠ 과 같은 낱말을 쓰지 않는다.** ㉠ 은 거의 모든 벌이 `…이야기예요.` 로 끝나고 한
 *   벌은 `…옮겨 볼게요.` 다. ㉢ 까지 `이어지는 이야기는 도감에 옮겨 두었어요.` 라고 하면
 *   한 문단에서 `이야기` 세 번, `옮기다` 두 번이 된다. 그래서 넷 중 셋은 **다른 낱말**로
 *   같은 말을 한다(`대목` · `사연` · 아예 생략).
 */
const HOOK_CLOSINGS = [
  '이어지는 대목은 도감에 적어 두었어요.',
  '앞뒤 사연은 도감에 다 있어요.',
  '무슨 이야기인지는 도감에서 마저 읽어 보실 수 있어요.',
  '나머지는 도감에서 천천히 읽어 보셔도 좋아요.',
];

/**
 * ㉠ 의 재료 — 그 이야기 행이 **실제로 갖고 있는 것만** 추린 좌표.
 * 없는 칸은 `undefined` 이고, 그 칸을 쓰는 벌은 물러난다.
 */
interface HookSource {
  /** `culture_region` 을 한국어로 옮긴 값. **표를 통과한 것만** 채워진다. */
  region?: string;
  /** `era` 를 한국어로 옮긴 값. 마찬가지로 표를 통과한 것만. */
  era?: string;
  /** 그 시대 이름이 지역까지 함께 가리키는가(`조선 시대`·`에도 시대`). */
  eraImpliesRegion?: boolean;
  storyType?: CatalogStory['storyType'];
  confidenceLevel?: CatalogStory['confidenceLevel'];
}

/**
 * `culture_region` → 한국어 지명. **단일 지역이고 문장에 자연스럽게 놓이는 값만** 싣는다.
 *
 * 표에는 438편이 120가지가 넘는 값을 쓰고 있고, 그중에는 문장으로 만들 수 없는 것이 섞여
 * 있다: `western`·`global`·`europe`·`near-east` 처럼 지명이 아니라 범주인 값, 그리고
 * `japan-bermuda-usa`·`persia-bulgaria` 처럼 여러 곳을 이어 붙인 값(합쳐 100편 남짓).
 *
 * ⚠ **그런 값은 여기 넣지 마라.** `서양에서 온 이야기예요` 는 아무 좌표도 주지 못하고,
 *   `일본·버뮤다·미국에서 온 이야기예요` 는 문장이 아니다. 표에 없으면 지명을 부르지 않고
 *   시대·갈래로만 잡거나 ㉠ 을 통째로 생략한다 — 그래도 ㉡㉢ 로 문단은 선다.
 */
const REGION_LABEL: Record<string, string> = {
  korea: '한국',
  japan: '일본',
  china: '중국',
  taiwan: '대만',
  usa: '미국',
  canada: '캐나다',
  mexico: '멕시코',
  colombia: '콜롬비아',
  ecuador: '에콰도르',
  chile: '칠레',
  england: '영국',
  uk: '영국',
  scotland: '스코틀랜드',
  wales: '웨일스',
  ireland: '아일랜드',
  france: '프랑스',
  netherlands: '네덜란드',
  belgium: '벨기에',
  germany: '독일',
  italy: '이탈리아',
  spain: '스페인',
  portugal: '포르투갈',
  switzerland: '스위스',
  sweden: '스웨덴',
  finland: '핀란드',
  estonia: '에스토니아',
  latvia: '라트비아',
  poland: '폴란드',
  hungary: '헝가리',
  serbia: '세르비아',
  croatia: '크로아티아',
  bulgaria: '불가리아',
  ukraine: '우크라이나',
  russia: '러시아',
  georgia: '조지아',
  greece: '그리스',
  rome: '로마',
  turkey: '튀르키예',
  persia: '페르시아',
  iran: '이란',
  israel: '이스라엘',
  'saudi-arabia': '사우디아라비아',
  egypt: '이집트',
  ethiopia: '에티오피아',
  kenya: '케냐',
  tanzania: '탄자니아',
  rwanda: '르완다',
  'south-africa': '남아프리카',
  india: '인도',
  thailand: '태국',
  vietnam: '베트남',
  indonesia: '인도네시아',
  philippines: '필리핀',
  australia: '오스트레일리아',
  hawaii: '하와이',
};

interface EraLabel {
  label: string;
  /** `{시대} {지역}에서 온 이야기` 로 지역과 나란히 세울 수 있는가. */
  withRegion: boolean;
}

/**
 * `era` → 한국어 시대. 여기도 **문장에 놓이는 값만** 싣는다.
 *
 * `modern`(130편)·`traditional`·`19c-20c` 같은 폭 넓은 값과 합성 값은 뺐다 — `근현대에
 * 있었던 이야기예요` 는 좌표라기보다 하나 마나 한 말이고, 그런 날은 지역·갈래가 대신 선다.
 *
 * `withRegion: false` 는 **시대 이름이 이미 지역을 가리키는** 경우다. `조선 시대 한국에서 온
 * 이야기예요` 처럼 같은 말을 두 번 하지 않으려고 나눠 뒀다.
 */
const ERA_LABEL: Record<string, EraLabel> = {
  ancient: { label: '아주 오래전', withRegion: true },
  medieval: { label: '중세', withRegion: true },
  '8c': { label: '8세기', withRegion: true },
  '12c': { label: '12세기', withRegion: true },
  '13c': { label: '13세기', withRegion: true },
  '14c': { label: '14세기', withRegion: true },
  '15c': { label: '15세기', withRegion: true },
  '16c': { label: '16세기', withRegion: true },
  '17c': { label: '17세기', withRegion: true },
  '18c': { label: '18세기', withRegion: true },
  '19c': { label: '19세기', withRegion: true },
  '20c': { label: '20세기', withRegion: true },
  victorian: { label: '빅토리아 시대', withRegion: false },
  joseon: { label: '조선 시대', withRegion: false },
  edo: { label: '에도 시대', withRegion: false },
};

/**
 * 이야기 갈래 → ㉠ 이 쓰는 말. `original` 은 여기 없다 — 아래 라벨 규칙이 따로 받는다.
 *
 * `alone` 이 두 벌인 이유: 지명이 표에 없는 날은 갈래가 유일한 좌표가 되는데, 그런 날이
 * 366일 중 3분의 1이다(실측). 한 벌만 두면 그 3분의 1이 **전부 같은 문장**으로 열린다.
 */
const STORY_TYPE_PHRASE: Record<string, { withRegion: string; alone: readonly [string, string] }> =
  {
    folklore: {
      withRegion: '에서 오래 전해 오는',
      alone: ['오래 전해 오는 이야기가 하나 있어요.', '입에서 입으로 전해 온 이야기예요.'],
    },
    history: {
      withRegion: ' 쪽 기록에서 온',
      alone: ['기록에 남아 있는 이야기예요.', '기록으로 남은 이야기 하나를 옮겨 볼게요.'],
    },
    literary: {
      withRegion: ' 문학에서 온',
      alone: ['문학에서 온 이야기예요.', '글 속에 남은 이야기예요.'],
    },
  };

/**
 * ㉠ 후보. `pickApplicable` 이 오늘 쓸 수 있는 것만 추린다.
 *
 * ⚠ **`original`(dearbloom 창작)은 이 표를 타지 않는다.** §1.5f 가 창작 라벨을 의무로
 *   걸어 둔 자리라, 라벨이 회전 표의 한 벌이 되면 다른 벌이 뽑히는 날 라벨이 사라진다.
 *   `composeTodayReason` 이 그 갈래를 먼저 가로챈다.
 */
type HookLead = (source: HookSource) => string | undefined;

const HOOK_LEADS: readonly HookLead[] = [
  /** 시대 + 지역 — 가장 또렷한 좌표. */
  ({ region, era, eraImpliesRegion }) =>
    region && era && !eraImpliesRegion ? `${era} ${region}에서 온 이야기예요.` : undefined,
  /** 지역 + 갈래. */
  ({ region, storyType }) => {
    const phrase = storyType ? STORY_TYPE_PHRASE[storyType] : undefined;
    return region && phrase ? `${region}${phrase.withRegion} 이야기예요.` : undefined;
  },
  /** 지역만 — `한국에서 건너온` 은 쓰지 않는다(우리 독자에게 한국은 건너올 곳이 아니다). */
  ({ region }) => (region ? `${region}에서 전해지는 이야기예요.` : undefined),
  /**
   * 시대만. 지역이 있으면 위 두 벌이 더 또렷하므로 물러난다 — 다만 `조선 시대`처럼 시대가
   * 이미 지역을 품은 값은 위 0번이 서지 못하니 여기서 받는다.
   */
  ({ region, era, eraImpliesRegion }) =>
    era && (!region || eraImpliesRegion) ? `${era}에 있었던 이야기예요.` : undefined,
  /**
   * 갈래만 — **지역이 없을 때만.**
   *
   * 지역이 있는 날에도 후보로 두면, 좌표를 두 칸 쥐고도 `기록에 남아 있는 이야기예요.`
   * 한 마디로 여는 날이 366일 중 122일까지 올라갔다(실측). 덜 아는 쪽 문장이 더 아는 쪽을
   * 밀어내는 셈이라, ② 에서 색인상을 공명 날에 물린 것과 같은 판단으로 뺐다.
   */
  ({ region, storyType }) =>
    !region && storyType ? STORY_TYPE_PHRASE[storyType]?.alone[0] : undefined,
  ({ region, storyType }) =>
    !region && storyType ? STORY_TYPE_PHRASE[storyType]?.alone[1] : undefined,
  /** 신뢰 등급 — 화면 라벨(`CONFIDENCE_LABEL`)과 같은 사실을 문단 안에서 말한다. */
  ({ confidenceLevel }) =>
    confidenceLevel === 'single_source' ? '드물게 전해지는 이야기예요.' : undefined,
  ({ confidenceLevel }) =>
    confidenceLevel === 'varies' ? '전하는 데마다 조금씩 다른 이야기인데요.' : undefined,
];

/** §1.5f — 창작 이야기는 **반드시** 창작이라고 먼저 밝힌다. 회전 대상이 아니다. */
const ORIGINAL_LEAD = 'dearbloom이 지어 본 이야기예요.';

/** 이야기 행 → ㉠ 이 쥘 수 있는 좌표. 표를 통과하지 못한 값은 조용히 버린다. */
function hookSourceOf(source: {
  cultureRegion?: string;
  era?: string;
  storyType?: CatalogStory['storyType'];
  confidenceLevel?: CatalogStory['confidenceLevel'];
}): HookSource {
  const era = source.era ? ERA_LABEL[source.era] : undefined;
  return {
    ...(source.cultureRegion && REGION_LABEL[source.cultureRegion]
      ? { region: REGION_LABEL[source.cultureRegion] }
      : {}),
    ...(era ? { era: era.label, eraImpliesRegion: !era.withRegion } : {}),
    ...(source.storyType ? { storyType: source.storyType } : {}),
    ...(source.confidenceLevel ? { confidenceLevel: source.confidenceLevel } : {}),
  };
}

/**
 * ③ 이야기가 없어 꽃말을 재료로 쓸 때. 훅이 있으면 꽃말은 부르지 않는다(재료 겹침 금지).
 * 현 카탈로그로는 **366일 전부 인용이 서서**(실측) 화면에 오르지 않는 사다리다 — 데이터가
 * 얇아지는 날을 위해 둔다.
 *
 * ⚠ 이야기도 꽃말도 없으면 **③ 을 아예 세우지 않는다.** v2 에는 `이야기는 아직 모으는
 *   중이에요…` 같은 빈손용 문장이 한 벌 더 있었는데, 세 마디로 늘어난 지금 ①+② 만으로도
 *   문단이 완결된다. 없는 것을 굳이 말하면 그 자체가 안내문 어조다.
 */
type Fallback = (meaning: string) => string;

const MEANING_LINES: Fallback[] = [
  (meaning) =>
    `‘${meaning}’${hasFinalConsonant(meaning) ? '이라는' : '라는'} 말을 품고 있어요. 오늘 같은 날 꺼내기 좋은 말이라서요.`,
  (meaning) =>
    `품고 있는 말은 ‘${meaning}’${hasFinalConsonant(meaning) ? '이에요' : '예요'}. 그 말이 오늘 먼저 떠올랐어요.`,
  (meaning) =>
    `‘${meaning}’${hasFinalConsonant(meaning) ? '이라는' : '라는'} 말을 오래 들어 온 꽃이에요.`,
];

/**
 * 리드 아래 한 단 흐린 줄 — 화면 빛깔 한 마디(`.db-today-aside`).
 * 바로 아래 오는 `화면의 빛깔` 선택기(§1.4c v3.4)를 여는 말이라 남긴다.
 */
const ASIDE_LINES = [
  '화면 빛깔도 오늘의 꽃을 따라 물들여 두었어요.',
  '화면에 도는 색도 이 꽃에서 가져왔어요.',
];

/**
 * 인용할 수 있는 훅으로 다듬는다 — **다듬는 것은 앞뒤 공백과 마침표 하나뿐이다.**
 *
 * 훅은 §1.5d 이야기 문체 규범이 합니다체 헤드라인을 허용한 자리이고, 그 무덤덤함이
 * 그대로 매력이라 **문장은 절대 다시 쓰지 않는다.** 다만 438편 중 333편은 마침표로
 * 끝나고 105편은 그냥 끝난다 — 그대로 인용하면 `“…있습니다.” —` 와 `“…있습니다” —` 가
 * 날마다 번갈아 나온다. 인용 부호 안의 문장부호는 인용하는 쪽 조판의 몫이라, 문장 끝
 * 마침표 하나만 떼어 438편을 같은 모양으로 세운다.
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
 * 오늘의 한 벌을 고른다 — **씨앗은 `날짜:슬롯` 뿐이다.**
 *
 * 슬롯 이름(`opening` `hook` `aside` …)을 씨앗에 섞는 이유: 같은 날짜만으로 고르면 표 길이가
 * 같은 슬롯끼리 **늘 같은 번호**를 뽑는다(4벌짜리 두 표가 매일 나란히 0번, 나란히 3번).
 * 그러면 조합이 4가지로 줄어 회전을 넣은 뜻이 사라진다.
 */
function pickVariant<T>(pool: readonly T[], seed: string): T {
  return pool[fnv1a32(seed) % pool.length];
}

/**
 * **오늘 쓸 수 있는 벌만 추린 뒤** 그중 하나를 고른다 (§1.5n v3).
 *
 * 마디 ①·② 의 표는 한 벌인데 후보군은 날마다 다르다 — 초순에는 초순 문장만, 향이 없는
 * 꽃에는 향을 말하지 않는 문장만 남는다. 그래서 표를 순(旬)별·재료별로 갈라 두는 대신
 * 각 벌이 스스로 "나는 오늘 쓸 수 있나"를 답하게 하고(`undefined` 면 물러난다) 여기서
 * 남은 것만 센다. 표가 하나라 새 벌을 끼워 넣을 때 어느 칸에 넣을지 고민할 일이 없다.
 *
 * ⚠ 걸러진 뒤의 **자리 번호**로 뽑으므로, 같은 씨앗이라도 후보군이 달라지면 다른 문장이
 *   나온다. 그것이 노림수다 — 후보가 3벌인 날과 5벌인 날이 같은 번호에 묶이지 않는다.
 *   후보군은 날짜와 카탈로그만으로 정해지므로 결정성은 그대로다.
 */
function pickApplicable<A, R>(
  makers: readonly ((arg: A) => R | undefined)[],
  arg: A,
  seed: string,
): R | undefined {
  const made: R[] = [];
  for (const make of makers) {
    const value = make(arg);
    if (value !== undefined) made.push(value);
  }
  if (made.length === 0) return undefined;
  return made[fnv1a32(seed) % made.length];
}

/**
 * 오늘 인용할 이야기 **한 행**.
 *
 * v3 까지는 훅 문자열만 돌려줬다. 그러면 인용은 얻어도 **그 훅이 어디서 온 이야기인지**를
 * 알 수 없어, 문단 끝에 헤드라인 한 줄이 홀로 서고 독자는 발 디딜 데가 없었다
 * (2026-08-17 사용자 피드백). 행 통째로 돌려줘야 `culture_region`·`era`·`story_type`·
 * `confidence_level` 로 마디 ③ ㉠ 을 세울 수 있다. 훅이 없는 편은 여전히 후보에서 뺀다.
 *
 * 후보 순서는 **슬라이드 티저와 같은 경로**(`pickStories(…, 'just_because')`)에서 온다 —
 * 이야기 순서를 정하는 규칙을 두 벌 두지 않기 위해서다. 다르게 하는 것은 하나뿐:
 * 티저는 늘 1순위를 쓰고, 여기서는 **날짜를 씨앗으로 후보 중 하나를 고른다.**
 *
 * 그래서 같은 꽃이 다시 오늘의 꽃이 돼도 다른 이야기가 나온다(장미는 23편이다).
 * 결정성은 그대로다 — 씨앗이 `날짜 + 꽃 id` 뿐이라 **같은 날 새로고침은 같은 문장**이고,
 * 서버·클라이언트·테스트가 모두 같은 값을 낸다(LLM 을 쓰지 않는 이유이기도 하다).
 */
export function pickReasonStory(
  flowerId: string,
  stories: CatalogStory[],
  todayISO: string,
): StoryRow | undefined {
  const mine = stories.filter((story) => story.flowerId === flowerId);
  if (mine.length === 0) return undefined;

  const { featured, others } = pickStories(flowerId, 'just_because', stories, mine.length);
  const pool = [...(featured ? [featured] : []), ...others].filter(
    (story) => quotableHook(story.hook) !== undefined,
  );
  if (pool.length === 0) return undefined;

  return pool[fnv1a32(`${todayISO}:${flowerId}:reason`) % pool.length];
}

/**
 * "오늘은 이 꽃을 꺼냈어요" — 리드 문단 (§1.5n v3).
 *
 * **세 마디**를 잇는다: ① 오늘이라는 날 → ② 그래서 이 꽃을 골랐어요 → ③ (있으면)
 * 이야기 한 줄. ③ 의 재료는 3단(이야기 훅 → 꽃말 → 없음)이고, ② 는 `basis` 3분기다.
 * 마디마다 틀이 **날짜로 회전**하며, 조합은 전부 규칙이라 **로컬에서도 그대로 돈다**
 * (모델 호출 없음 · 사용자 요청 2026-08-16).
 *
 * 꽃의 속성 넷(`color`·`fragranceLevel`·`tags`·`bloomSpan`)은 **전부 선택**이다 —
 * 없으면 그 재료를 쓰는 벌이 물러나고 재료 없이 서는 벌이 대신 선다. 그래서 이 함수는
 * 카탈로그가 얇아져도 문단을 비우지 않는다.
 *
 * ⚠ 훅은 `“…”` 로, 꽃말은 `‘…’` 로 감싼다. 훅 원문에는 `"` 와 `'` 가 섞여 있어
 *   (438편 중 26편) 홑·겹 **타이포그래픽 따옴표**라야 안쪽 인용과 겹치지 않는다.
 * ⚠ 날씨·기온처럼 **우리가 모르는 사실**을 여기에 들이지 마라. ① 이 말할 수 있는 것은
 *   `dayNoteOf` 가 날짜에서 꺼낸 것뿐이다.
 */
export function composeTodayReason(input: {
  basis: TodayBasis;
  /** 화면에 서는 꽃 이름. 문장 안에서 조사가 붙으므로 이름만 넘긴다(`흰 튤립`). */
  flowerName: string;
  /** 변주 씨앗이자 마디 ① 의 재료. 시각·난수가 아니라 **날짜**라야 같은 날 같은 문단이다. */
  todayISO: string;
  /** 대표색(`colors[0]`). 색 인상 한 마디의 재료 — `COLOR_TONES` 에 없는 색이면 무시된다. */
  color?: string;
  /** `flowers.csv` 의 향 세기 0–3. */
  fragranceLevel?: 0 | 1 | 2 | 3;
  /** 그 꽃의 결(`aestheticTags`). 여럿이면 날짜 씨앗으로 하나를 고른다. */
  tags?: string[];
  /** `bloomMonths` 의 달 수. 아주 좁거나(1–2) 열두 달인 꽃만 문장에 쓴다. */
  bloomSpan?: number;
  /** 그 꽃 이야기에서 끌어온 헤드라인 한 줄. `pickReasonStory` 가 고른다. */
  hook?: string;
  /**
   * 그 훅이 **어디서 온 이야기인지** — 마디 ③ ㉠ 의 재료(§1.5n v4).
   * `hook` 이 있을 때만 쓰인다. 표를 통과하지 못한 값은 조용히 버려지고 ㉠ 이 짧아지거나
   * 통째로 빠진다 — 없는 좌표를 지어내는 것보다 말하지 않는 편이 낫다.
   */
  hookSource?: {
    cultureRegion?: string;
    era?: string;
    storyType?: CatalogStory['storyType'];
    confidenceLevel?: CatalogStory['confidenceLevel'];
  };
  /** 대표 꽃말. 훅이 없을 때만 쓴다. */
  meaning?: string;
}): string {
  const { todayISO } = input;
  const note = dayNoteOf(todayISO);

  /** ① 오늘이라는 날. 날짜를 못 읽으면 이 마디만 빠지고 문단은 선다. */
  const opening = note ? pickApplicable(OPENERS, note, `${todayISO}:opening`) : undefined;

  /**
   * ② 의 씨앗에는 **꽃 이름도 섞는다.**
   *
   * ① 은 날짜만 보면 되지만 ② 는 꽃을 고른 이유다 — 날짜만으로 뽑으면 이틀 연속 같은
   * 자리 번호가 걸렸을 때 서로 다른 꽃이 같은 이유를 대게 된다(`그래서 지금 피어 있는
   * 꽃들 사이에서 …` 이 이틀 내리 서는 모양). 이름을 섞으면 그 상관이 끊긴다.
   * 결정성은 그대로다 — 이름도 날짜가 정하는 값이다.
   */
  const whySeed = `${todayISO}:${input.flowerName}`;

  /** 결이 여럿인 꽃(대부분 2~3개)은 날짜로 하나를 고른다 — 같은 꽃이 다시 와도 결이 갈린다. */
  const tags = (input.tags ?? []).filter((tag) => TAG_PHRASE[tag] !== undefined);
  const tagPhrase = tags.length > 0 ? TAG_PHRASE[pickVariant(tags, `${whySeed}:tag`)] : undefined;

  /** ② 그래서 이 꽃을 골랐어요. 재료를 하나도 못 쥔 날은 `WHY_FALLBACKS` 가 받는다. */
  const why =
    pickApplicable(
      WHYS[input.basis],
      {
        note,
        name: input.flowerName,
        tone: input.color === undefined ? undefined : COLOR_TONES[input.color],
        fragranceLevel: input.fragranceLevel,
        tagPhrase,
        bloomSpan: input.bloomSpan,
      },
      `${whySeed}:why`,
    ) ?? WHY_FALLBACKS[input.basis](input.flowerName);

  const beats = [opening, why].filter((beat): beat is string => beat !== undefined);

  /** ③ 이야기. 훅 → 꽃말 → (없으면 마디 자체를 생략). */
  const hook = quotableHook(input.hook);
  if (hook) {
    const source = hookSourceOf(input.hookSource ?? {});
    /**
     * ㉠ 좌표. `original`(dearbloom 창작)만 회전 밖에서 가로챈다 — §1.5f 가 건 창작 라벨은
     * 다른 벌이 뽑히는 날 사라지면 안 되는 의무 표시다.
     */
    const lead =
      source.storyType === 'original'
        ? ORIGINAL_LEAD
        : pickApplicable(HOOK_LEADS, source, `${todayISO}:lead`);

    if (lead) beats.push(lead);
    beats.push(`“${hook}” — ${pickVariant(HOOK_CLOSINGS, `${todayISO}:hook`)}`);
  } else {
    const meaning = input.meaning?.trim();
    if (meaning) beats.push(pickVariant(MEANING_LINES, `${todayISO}:meaning`)(meaning));
  }

  return beats.join(' ');
}

/**
 * 리드 문단에서 **맺음 문장만 떼어** 링크 조각으로 만든다 (§1.5n · 크로스 링크 2026-08-18).
 *
 * 맺음 네 벌(`HOOK_CLOSINGS`)은 전부 "나머지는 도감에 있어요" 라고 말한다. 그 초대가
 * 글자로만 남아 있던 자리라, 그 한 문장을 그 꽃의 도감 상세로 가는 링크로 세운다.
 *
 * ⚠ **문장을 다시 짓지 않는다.** 이미 지어진 문단의 꼬리를 알아보는 일만 한다 —
 *   맺음을 고르는 씨앗 계산(`pickVariant(HOOK_CLOSINGS, …)`)을 여기 한 벌 더 두면
 *   `composeTodayReason` 의 회전 규칙이 두 곳으로 갈라져 언젠가 조용히 어긋난다.
 *   붙여 놓은 문자열에서 되찾는 편이 **틀릴 수 없는** 쪽이다.
 * ⚠ 맺음이 없는 날(훅이 없어 ③ 이 꽃말이나 침묵으로 물러난 날)은 `undefined` 다.
 *   그런 날 화면은 리드를 통짜로 찍는다 — 없는 길을 만들지 않는다.
 */
export function todayReasonLinkOf(reason: string, flowerId: string): TodayReasonLink | undefined {
  const text = HOOK_CLOSINGS.find((closing) => reason.endsWith(closing));
  if (text === undefined) return undefined;

  return {
    lead: reason.slice(0, reason.length - text.length),
    text,
    // 카드 덮개 링크와 **같은 목적지**여야 초대와 카드가 같은 곳을 가리킨다.
    href: `/flowers/${flowerId}`,
  };
}

/** 리드 아래 흐린 한 줄 — 화면 빛깔 (§1.5n 리듬 ②). */
export function composeTodayAside(todayISO: string): string {
  return pickVariant(ASIDE_LINES, `${todayISO}:aside`);
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
    occasions: occasionsFor(catalog.occasions, flower.id, 'landing'),
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
 * 탄생화 각주의 문장 틀 — 세 벌 (§1.5n 개정).
 *
 * 이름 한 낱말이 링크라 문장을 **앞뒤 조각으로** 낸다. 세 벌 중 둘은 날짜를 부르고 하나는
 * 부르지 않는데, 리드가 날짜를 놓아 준 지금 **오늘 화면에서 날짜를 말하는 자리는 여기뿐이라**
 * 그 편이 자연스럽다(예전에는 리드가 `8월 16일`, 이 줄이 `오늘 8월 16일` 로 두 번 불렀다).
 */
const BIRTH_PHRASES: readonly ((line: {
  dateLabel: string;
  name: string;
  meaning: string;
  meaningCopula: string;
}) => { lead: string; tail: string })[] = [
  ({ dateLabel, name, meaning }) => ({
    lead: `참, ${dateLabel}의 탄생화는 `,
    tail:
      `${hasFinalConsonant(name) ? '이에요' : '예요'} — ` +
      `‘${meaning}’${hasFinalConsonant(meaning) ? '이라는' : '라는'} 말을 품고 있어요.`,
  }),
  ({ meaning, meaningCopula }) => ({
    lead: '오늘의 탄생화는 따로 있어요. ',
    tail: `, 품은 말은 ‘${meaning}’${meaningCopula}.`,
  }),
  ({ dateLabel, name, meaning }) => ({
    lead: `${dateLabel}의 탄생화를 찾아보면 `,
    tail:
      `${hasFinalConsonant(name) ? '이' : '가'} 나와요 — ` +
      `‘${meaning}’${hasFinalConsonant(meaning) ? '이라는' : '라는'} 말을 품은 꽃이에요.`,
  }),
];

/**
 * 오늘 날짜의 탄생화 한 줄.
 *
 * 날짜는 **`todayISO` 문자열에서 쪼갠다** — `new Date(todayISO)` 로 되돌리면 UTC 로 파싱돼
 * 서버 시간대에 따라 하루가 밀린다(`seoulTodayISO` 가 애써 맞춰 놓은 서울 달력이 무너진다).
 *
 * 도감 링크는 **`flowerId` 가 실제로 카탈로그에 있을 때만** 건다. 시드 교차 검증이 이미
 * 참조 무결성을 보고 있지만, 링크는 끊기면 404 로 곧장 드러나는 자리라 화면 쪽에서도 확인한다.
 * 나머지 309일은 이름이 `BIRTH_FINDER_HREF`(생일 꽃 찾기)로 간다 — 화면 쪽 결정이라
 * 여기서는 `href` 를 비워 두는 것까지만 한다(그 대비를 `birth-flowers-ui.test.ts` 가 본다).
 */
function birthFlowerLine(catalog: Catalog, todayISO: string): BirthFlowerLine | undefined {
  const [, monthText, dayText] = todayISO.split('-');
  const row = birthFlowerOn(catalog.birthFlowers, Number(monthText), Number(dayText));
  if (!row) return undefined;

  const linked = row.flowerId && catalog.flowers.some((flower) => flower.id === row.flowerId);
  const parts = {
    dateLabel: birthDateLabel(row.month, row.day),
    name: row.nameKo,
    meaning: row.meaningKo,
    meaningCopula: hasFinalConsonant(row.meaningKo) ? '이에요' : '예요',
  };

  return {
    ...parts,
    ...pickVariant(BIRTH_PHRASES, `${todayISO}:birth`)(parts),
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
   * 리드 문단 (§1.5n).
   *
   * 꽃 이름은 **`today.name`** 을 넘긴다 — 화면에 서는 이름과 문장 속 이름이 갈리면 안 된다
   * (테마 상수가 있는 꽃은 시안 이름 `흰 튤립`, 없으면 카탈로그 이름).
   *
   * 꽃말은 `today.meaning` 이 아니라 **원천에서 다시 읽는다** — 그 값은 꽃말이 없을 때
   * `아직 갈래를 고르는 중이에요` 라는 화면용 자리표시로 채워져 있어서, 그대로 인용하면
   * `‘아직 갈래를 고르는 중이에요’라는 말을 품고 있어요` 가 나온다.
   *
   * 속성 넷(대표색·향·결·개화 폭)은 §1.5n v3 의 마디 ② 재료다. **테마 상수가 아니라
   * 카탈로그 행에서 곧장 읽는다** — 테마는 이름·꽃말·사진만 갖고 있고, 색과 향은
   * `flowers.csv` 가 유일한 원천이다.
   */
  const todayTheme = themeForFlower(todayCatalogFlower.id);
  /**
   * 인용할 이야기는 **행 통째로** 받는다(§1.5n v4). 훅 문자열만 받던 예전에는 그 훅이
   * 어디서 온 이야기인지 알 길이 없어, 문단 끝에 인용만 홀로 서고 독자는 발 디딜 데가
   * 없었다. `culture_region`·`era`·`story_type`·`confidence_level` 이 ㉠ 의 재료다.
   */
  const todayStory = pickReasonStory(todayCatalogFlower.id, catalog.stories, todayISO);
  const todayReason = composeTodayReason({
    basis: picked.basis,
    flowerName: today.name,
    todayISO,
    // 이름이 색을 말하면 그 색이 이긴다 — `흰 백합`(대표색 orange)이 그 자리다.
    color: reasonColorOf(today.name, todayCatalogFlower.colors[0]),
    fragranceLevel: todayCatalogFlower.fragranceLevel,
    tags: todayCatalogFlower.aestheticTags,
    bloomSpan: new Set(todayCatalogFlower.bloomMonths).size,
    hook: todayStory?.hook,
    ...(todayStory
      ? {
          hookSource: {
            cultureRegion: todayStory.cultureRegion,
            era: todayStory.era,
            storyType: todayStory.storyType,
            confidenceLevel: todayStory.confidenceLevel,
          },
        }
      : {}),
    meaning: todayTheme?.meaning ?? meaningFor(todayCatalogFlower, catalog)?.meaningKo,
  });
  /**
   * 리드 맺음을 실제 길로 — 문단은 그대로 두고 **꼬리 문장만** 링크 조각으로 갈라 둔다.
   * 목적지는 카드 덮개 링크와 같은 `/flowers/{id}` 다(`today.flowerId` = 카탈로그 id).
   */
  const todayReasonLink = todayReasonLinkOf(todayReason, today.flowerId);
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

  return {
    todayISO,
    todayLabel: todayISO.replaceAll('-', '.'),
    basis: picked.basis,
    todayReason,
    ...(todayReasonLink ? { todayReasonLink } : {}),
    todayAside: composeTodayAside(todayISO),
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
