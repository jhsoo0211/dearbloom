/**
 * 꽃 도감 뷰모델 — 카탈로그(실데이터) → 화면이 그대로 쓰는 모양.
 *
 * design-spec §1.4c v3.2·v3.3(카테고리) / §1.5d(워딩) / §1.5h(반려동물 강등·상황 예시)
 * / §1.5i(이야기 위계 — 본문 우선·메타 후치)
 *
 * **서버에서만 부른다.** 엔진 배럴(zod)과 라벨 사전을 끌어오므로 클라이언트 컴포넌트가
 * 이 파일을 import 하면 그것들이 통째로 브라우저 번들에 실린다. 화면에 내려보낼 값은
 * 전부 여기서 문자열로 확정해 `types.ts` 의 모양으로 넘긴다.
 *   (fs 의존은 없다 — 카탈로그는 호출부가 `loadCatalog()` 로 읽어 넘겨준다.)
 *
 * 문구를 여기서 새로 짓지 않는다. 라벨의 원본은 셋뿐이다:
 *   · 꽃말·가격·안전            → `@/components/flow/labels`
 *     (상황 예시는 2026-08-18 부터 라벨이 아니라 **데이터**다 — `content/occasions.csv`,
 *      조회는 `@/lib/data/occasions` 의 `occasionsFor`.)
 *   · 이야기 각주 한 줄        → `@/components/stories/meta` 의 `metaNotes`
 *   · 꽃 계열 이름             → `@/components/stories/categories` 의 `storyCategoryLabel`
 * 같은 값이 화면마다 다른 말을 하지 않게 하려는 것이라, 라벨이 필요하면 저기부터 고친다.
 *
 * ⚠ 계열 이름은 **`숲빛·상아빛·금빛·와인빛·보랏빛`** 이다(`/stories` 의 필터 칩과 같은 말).
 *   `landing-data` 의 `CATEGORY_THEMES[…].label`(`나이트 보태니컬` …)은 **테마 색감 이름**이라
 *   랜딩이 "색감"을 소개할 때만 쓴다 — 도감에서 그걸 카테고리 이름으로 내보내면 같은 묶음이
 *   화면마다 다른 이름을 갖게 된다(2026-08-15 Advisor 확정).
 */

import {
  CONFIDENCE_LABELS,
  PRICE_LABELS,
  SEVERITY_LABELS,
  SPECIES_LABELS,
  STORY_MOOD_LABELS,
  colorChoice,
  eraLabel,
  orderLiterature,
  regionLabel,
  storyConfidenceLabel,
  storyTypeLabel,
} from '@/components/flow/labels';
/*
 * 발췌 한 편을 짓는 규칙은 결과 화면과 **같은 한 벌**이다(`flow/view-format.ts`).
 * 예전에는 이 파일에 몸통을 한 벌 더 세우고 대조 테스트로 어긋남을 잡았다 —
 * 지금은 부르는 곳이 둘, 몸통이 하나다.
 */
import { toLiteratureView } from '@/components/flow/view-format';
import { categoryOf } from '@/components/landing/landing-data';
import { storyCategoryLabel } from '@/components/stories/categories';
import { metaNotes } from '@/components/stories/meta';
import type { ArchiveStory } from '@/components/stories/types';
import {
  birthCalendar,
  birthDatesLabel,
  birthDaysOf,
  birthSpeciesCount,
} from '@/lib/data/birth-flowers';
import type { Catalog, CatalogFlower, CatalogMeaning, CatalogStory, Quote } from '@/lib/data/types';
import { occasionsFor } from '@/lib/data/occasions';
import { pickStories } from '@/lib/engine';
import { photoSrc, photoSrcSet, photosFor } from '@/lib/photos';
import { plateCredit, plateFor } from '@/lib/plates';
import { CATEGORY_HINT, CATEGORY_ORDER, normalizeQuery } from './category';
import type {
  FlowerDetailData,
  FlowerGroup,
  FlowerIndexData,
  FlowerStory,
  FlowerSummary,
  LiteratureView,
  MeaningGroup,
  PetNote,
} from './types';

/* ------------------------------------------------------------------ *
 * 공용 조각
 * ------------------------------------------------------------------ */

/**
 * 대표 꽃말 한 줄 — 대표색(colors[0])과 같은 색의 행을 먼저 보고, 없으면 첫 행.
 * `landing-data.ts` 의 `meaningFor` 와 같은 규칙이다(같은 꽃이 두 화면에서 다른 꽃말을
 * 대표로 내세우지 않게).
 */
function primaryMeaning(flower: CatalogFlower, meanings: CatalogMeaning[]) {
  const mine = meanings.filter((row) => row.flowerId === flower.id);
  if (mine.length === 0) return undefined;
  const primaryColor = flower.colors[0];
  return mine.find((row) => row.color === primaryColor) ?? mine[0];
}

/** 꽃말이 한 줄도 없는 꽃에 세우는 자리 문구(§1.5d 톤). 데이터가 비어도 화면은 성립해야 한다. */
const NO_MEANING = '아직 갈래를 고르는 중이에요';

/* ------------------------------------------------------------------ *
 * 목록·검색 (`/flowers`)
 * ------------------------------------------------------------------ */

function toSummary(
  flower: CatalogFlower,
  meanings: CatalogMeaning[],
  storyCountByFlower: Map<string, number>,
): FlowerSummary {
  const category = categoryOf(flower);
  const meaning = primaryMeaning(flower, meanings);

  return {
    slug: flower.id,
    nameKo: flower.nameKo,
    nameEn: flower.nameEn,
    scientificName: flower.scientificName,
    category,
    categoryLabel: storyCategoryLabel(category),
    meaning: meaning?.meaningKo ?? NO_MEANING,
    storyCount: storyCountByFlower.get(flower.id) ?? 0,
    // 검색은 **이름 세 가지**만 본다(한국어명·영문명·학명). 꽃말·이야기 본문까지 넣으면
    // "사랑" 한 번에 스무 종이 걸려 목록이 아니라 소음이 된다.
    haystack: normalizeQuery(`${flower.nameKo} ${flower.nameEn} ${flower.scientificName}`),
  };
}

/**
 * 카테고리 5종으로 접는다 — 검색어가 없을 때의 기본 뷰.
 *
 * 31종을 한 판에 늘어놓으면 "무엇부터 볼지"가 사라진다(§1.4c v3.2 가 카테고리를 도입한
 * 이유와 같다). 줄 순서는 `CATEGORY_ORDER`, 줄 안은 카탈로그 순서라 둘 다 결정적이다 —
 * 다시 찾아온 사람이 같은 자리에서 같은 꽃을 만난다.
 */
function buildGroups(flowers: FlowerSummary[]): FlowerGroup[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: storyCategoryLabel(category),
    hint: CATEGORY_HINT[category],
    flowers: flowers.filter((flower) => flower.category === category),
  })).filter((group) => group.flowers.length > 0);
}

export function buildFlowerIndex(catalog: Catalog): FlowerIndexData {
  const storyCountByFlower = new Map<string, number>();
  for (const story of catalog.stories) {
    storyCountByFlower.set(story.flowerId, (storyCountByFlower.get(story.flowerId) ?? 0) + 1);
  }

  const flowers = catalog.flowers.map((flower) =>
    toSummary(flower, catalog.meanings, storyCountByFlower),
  );

  return {
    flowers,
    groups: buildGroups(flowers),
    meaningCount: catalog.meanings.length,
    storyCount: catalog.stories.length,
    /**
     * 생일 꽃 찾기의 일 셀렉트가 쓸 달력 12개 숫자.
     *
     * **탄생화 표 366행 자체는 내려보내지 않는다** — 실제로 읽히는 것은 고른 하루뿐이라
     * 서버 액션(`lookupBirthFlower`)이 가져온다(근거는 `app/flowers/actions.ts` 주석).
     * 여기 실리는 것은 그 셀렉트가 마운트 시점에 필요로 하는 것뿐이다.
     */
    birthCalendar: birthCalendar(catalog.birthFlowers),
    /**
     * 인트로 통계의 **2단 티어 숫자**(§1.5m ⑤) — 날짜 수와 고유 이름 수 둘 다 표에서 센다.
     *
     * 이것 역시 366행이 아니라 **숫자 두 개**다. 사전 목록 자체는 달을 고른 사람만
     * 서버 액션(`listBirthMonth`)으로 받아 간다.
     */
    birthDayCount: catalog.birthFlowers.length,
    birthSpeciesCount: birthSpeciesCount(catalog.birthFlowers),
  };
}

/* ------------------------------------------------------------------ *
 * 상세 (`/flowers/[slug]`)
 * ------------------------------------------------------------------ */

/**
 * 꽃말을 **색으로 묶는다.**
 *
 * meanings.csv 는 한 꽃에 최대 13행까지 있고(빨간 장미 12행·흰 튤립 13행) 색·문화권·시대가
 * 뒤섞여 있다. 평평하게 늘어놓으면 "노란 장미는 질투"와 "붉은 장미는 사랑"이 같은 무게로
 * 읽혀 무엇이 무엇인지 사라진다 — 색이 곧 그 꽃을 고르는 단위(§1.5c 색 재선택)라 색부터 접는다.
 *
 * 색 순서는 `flowers.csv` 의 colors 순서(= 대표색이 맨 앞)를 따르고, 표에 없는 색이
 * meanings 에만 있으면 뒤에 붙인다. 색이 비어 있는 행(문화권 전체를 아우르는 이야기)은
 * 맨 끝에 따로 묶는다.
 */
function buildMeaningGroups(flower: CatalogFlower, meanings: CatalogMeaning[]): MeaningGroup[] {
  const mine = meanings.filter((row) => row.flowerId === flower.id);

  const order: string[] = [...flower.colors];
  for (const row of mine) {
    const color = row.color ?? '';
    if (color !== '' && !order.includes(color)) order.push(color);
  }

  const groups: MeaningGroup[] = [];
  for (const color of order) {
    const rows = mine.filter((row) => row.color === color);
    if (rows.length === 0) continue;
    const swatch = colorChoice(color);
    groups.push({
      key: color,
      colorLabel: swatch.label,
      hex: swatch.hex,
      needsRing: swatch.needsRing,
      items: rows.map(toMeaningItem),
    });
  }

  const colorless = mine.filter((row) => (row.color ?? '') === '');
  if (colorless.length > 0) {
    groups.push({
      key: 'any',
      colorLabel: '색을 가리지 않는 이야기',
      items: colorless.map(toMeaningItem),
    });
  }

  return groups;
}

/**
 * 출처 주소 → **사람이 읽는 이름**(접근성 리뷰 P1-9).
 *
 * 상세 한 장에 꽃말 출처 링크가 최대 13개까지 서는데, 예전에는 전부 `이야기의 갈래` 라는
 * **같은 이름**이었다. 화면 낭독기로 링크 목록을 훑으면 같은 말이 열세 번 나오고 어디가
 * 어디인지 알 수 없다 — 링크 이름은 목적지를 구별해야 한다.
 *
 * 아는 호스트만 제 이름으로 부르고, 모르는 곳은 도메인을 그대로 쓴다
 * (모르는 곳을 "웹사이트" 라고 뭉뚱그리면 다시 구별할 수 없게 된다).
 * 주소가 망가진 행은 문자열을 그대로 돌려준다 — 링크 이름이 비는 편이 가장 나쁘다.
 */
const SOURCE_LABELS: Record<string, string> = {
  'en.wikipedia.org': 'Wikipedia',
  'ko.wikipedia.org': '위키백과',
  'ja.wikipedia.org': 'ウィキペディア',
  'www.gutenberg.org': 'Project Gutenberg',
  'archive.org': 'Internet Archive',
  'www.nihhs.go.kr': '국립원예특작과학원',
  'www.nongsaro.go.kr': '농사로',
  /**
   * 탄생화 366일 표의 출처(조사 문서 §3 소스 B). 퓨니코드를 그대로 두면 링크 이름이
   * `xn--oi2bpqy92ashbd12b.kr` 이 되어 어디로 가는지 아무도 읽을 수 없다
   * (도메인 자체는 `로얄플라워.kr` 이고, 운영 주체는 한국화훼유통협회다).
   */
  'www.xn--oi2bpqy92ashbd12b.kr': '한국화훼유통협회 로얄플라워',
};

export function sourceLabel(url: string): string {
  try {
    const host = new URL(url).hostname;
    return SOURCE_LABELS[host] ?? host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** 꽃말 한 줄 + 각주(문화권 · 시대 · 신뢰). 메타는 언제나 본문 **뒤**다(§1.5i). */
function toMeaningItem(row: CatalogMeaning, index: number) {
  const parts = [regionLabel(row.cultureRegion ?? ''), eraLabel(row.era)].filter(
    (part): part is string => !!part,
  );
  parts.push(CONFIDENCE_LABELS[row.confidenceLevel]);

  return {
    key: `${row.flowerId}-${row.color ?? 'any'}-${index}`,
    text: row.meaningKo,
    note: parts.join(' · '),
    ...(row.cautionNote ? { caution: row.cautionNote } : {}),
    ...(row.sourceUrl ? { sourceUrl: row.sourceUrl, sourceLabel: sourceLabel(row.sourceUrl) } : {}),
  };
}

/**
 * stories.csv 한 행 → 각주 라벨을 붙이기 위한 `/stories` 카드와 **같은 모양**.
 *
 * ⚠ `ArchiveStory` 는 이제 **카드가 그리는 것만** 담는다(전문·출처는 시트가 따로 가져간다 —
 *   성능 리뷰 P1-7). 도감은 한 꽃의 이야기만 다뤄 그런 분리가 필요 없으므로, 전문과 출처는
 *   아래 `toStory` 가 원본 행에서 **곧장** 읽는다. 이 함수는 각주 라벨을 만들기 위한
 *   `metaNotes` 의 입력을 짓는 것이 전부다.
 */
function toArchiveShape(story: CatalogStory, flowerNameKo: string): ArchiveStory {
  const region = regionLabel(story.cultureRegion ?? '');
  const era = eraLabel(story.era);

  const shaped: ArchiveStory = {
    id: story.storyId,
    flowerId: story.flowerId,
    flowerNameKo,
    title: story.title,
    isOriginal: story.storyType === 'original',
    typeLabel: storyTypeLabel(story.storyType),
    confidenceLabel: storyConfidenceLabel(story.confidenceLevel, story.sourceKind),
    moods: story.moods,
    moodLabels: story.moods.map((mood) => STORY_MOOD_LABELS[mood]),
  };

  if (story.hook) shaped.hook = story.hook;
  if (region) shaped.regionLabel = region;
  if (era) shaped.eraLabel = era;

  return shaped;
}

function toStory(story: CatalogStory, flowerNameKo: string, featured: boolean): FlowerStory {
  const shaped = toArchiveShape(story, flowerNameKo);
  // 창작(original)만 출처가 면제다 — 나머지는 어디서 온 이야기인지 각주로 밝힌다(§1.5d·§1.5f).
  // ⚠ 이 규칙은 `app/stories/actions.ts` 의 `loadStoryDetail` 과 **같아야 한다.**
  const hasSource = !shaped.isOriginal && !!story.sourceTitle;

  return {
    id: shaped.id,
    title: shaped.title,
    ...(shaped.hook ? { hook: shaped.hook } : {}),
    body: story.storyKo,
    moodLabels: shaped.moodLabels,
    notes: metaNotes(shaped),
    ...(hasSource ? { sourceTitle: story.sourceTitle } : {}),
    ...(hasSource && story.sourceUrl ? { sourceUrl: story.sourceUrl } : {}),
    featured,
  };
}

/**
 * 그 꽃의 **이야기 전부**를 §1.5i(15차)가 정한 순서로 세운다.
 *
 * 도감에는 "지금 이 상황"이 없으므로 상황을 가리지 않는 `just_because` 로 부르고,
 * k 는 그 꽃의 이야기 편수 = **제한 없음**이다. 그러면 `pickStories` 는 아무것도 버리지
 * 않고 순서만 정해 준다 — featured 한 편을 앞세우고 나머지는 결(mood)이 연달아 겹치지
 * 않게 재배열한다. 순서를 여기서 다시 정하지 않는 이유는, 결과 화면과 도감이 같은 꽃에서
 * 같은 이야기를 앞세우게 하기 위해서다.
 */
function buildStories(flower: CatalogFlower, stories: CatalogStory[]): FlowerStory[] {
  const mine = stories.filter((story) => story.flowerId === flower.id);
  if (mine.length === 0) return [];

  const picked = pickStories(flower.id, 'just_because', mine, mine.length);
  const byId = new Map(mine.map((story) => [story.storyId, story]));

  const ordered: FlowerStory[] = [];
  if (picked.featured) {
    const source = byId.get(picked.featured.storyId);
    if (source) ordered.push(toStory(source, flower.nameKo, true));
  }
  for (const story of picked.others) {
    const source = byId.get(story.storyId);
    if (source) ordered.push(toStory(source, flower.nameKo, false));
  }
  return ordered;
}

/* ------------------------------------------------------------------ *
 * §1.5k 문학 속의 이 꽃 (2026-08-18)
 *
 * quotes.csv 의 문학 발췌 86행(36종)은 여태 **결과 화면에서만** 보였다. 그 꽃을 알아보러
 * 온 사람이 정작 도감에서는 못 보는 자료였다 — 데이터가 화면을 앞서 있던 자리다.
 *
 * ⚠ **차례를 여기서 다시 정하지 마라.** 무엇을 앞에 세우고 나머지를 어떤 순서로 넘길지는
 *   `orderLiterature`(flow/labels.ts) 한 곳이 정한다. 도감이 제 순서를 따로 가지면 같은
 *   꽃에서 두 화면이 다른 편을 앞세우고, 같은 작가의 연작이 붙어 나오는 것도 도감에서만
 *   되살아난다(그 규칙의 근거는 그 파일 머리말에 있다).
 * ------------------------------------------------------------------ */

/**
 * 그 꽃의 문학 발췌 **전부**를 §1.5k 의 차례로 세운다.
 *
 * 결과 화면(`pickLiterature`)과 다른 것은 **거르기 두 줄뿐**이다. 그쪽은 대표 이야기와
 * 같은 작품·「함께 담을 한 줄」과 같은 작가를 빼는데, 둘 다 "한 화면에 같은 이름이 두 번
 * 서지 않게" 하는 결과 화면 사정이고 도감에는 그 두 자리가 없다. 도감은 아카이브라
 * **그 꽃에 붙은 행을 하나도 버리지 않는다.**
 *
 * 상황(intent)이 없는 화면이라 `just_because` 로 부른다 — 이야기 쪽(`buildStories`)이
 * `pickStories` 를 부르는 방식과 같다. 어느 단계에도 난수가 없어 새로고침해도 같은 차례다.
 */
function buildLiterature(flower: CatalogFlower, quotes: Quote[]): LiteratureView[] {
  // `excerptType` 이 있는 행 = 문학 발췌. 없으면 꽃을 가리지 않는 범용 인용이라 이 자리가 아니다.
  const mine = quotes.filter(
    (quote) => quote.flowerId === flower.id && quote.excerptType !== undefined,
  );

  const ordered = orderLiterature(mine, flower.id, 'just_because');
  if (!ordered) return [];

  return [ordered.featured, ...ordered.others].map(toLiteratureView);
}

/**
 * 반려동물 칸 — §1.5h 위계 강등. **배지 하나 + 접힌 상세**가 전부다.
 *
 * 문구는 완곡하게 돌리지 않는다(§1.5h: 안전은 직설이 옳음). 다만 안전한 꽃도 배지를
 * 세우는 이유는 이 화면이 도감이기 때문이다 — 홈처럼 "위험할 때만" 말하면
 * 도감에서는 "확인해 보지 않은 꽃"과 "안전한 꽃"이 구분되지 않는다.
 */
function buildPetNote(flower: CatalogFlower): PetNote {
  const toxic = flower.petSafety.filter((entry) => entry.toxic);
  const lines = flower.petSafety.map(
    (entry) => `${SPECIES_LABELS[entry.species].label} — ${SEVERITY_LABELS[entry.severity]}`,
  );
  const sourceUrl = flower.petSafety.find((entry) => entry.sourceUrl)?.sourceUrl;

  return {
    safe: toxic.length === 0,
    badge: toxic.length === 0 ? '반려동물 안전' : '반려동물 주의',
    lines,
    ...(sourceUrl ? { sourceUrl } : {}),
  };
}

/**
 * 계절 한 줄 — `bloom_months` 를 그대로 읽는다.
 *
 * 오늘 날짜로 제철 여부를 판정하지 않는 이유: 이 화면은 SSG 라 문장이 **언제 생성됐느냐**에
 * 따라 달라지면 안 된다(캐시된 페이지가 계절을 거짓말하게 된다). 날짜에 따라 달라지는
 * 제철 안내는 추천 결과 화면(`availabilityFor`)의 몫이다.
 */
function buildSeasonLine(flower: CatalogFlower): string {
  const months = flower.bloomMonths;
  if (months.length === 0) return '언제 피는지는 아직 적어 두지 못했어요';
  if (months.length >= 11) return '사철 만날 수 있어요';
  return `${months.join('·')}월에 주로 만나요`;
}

export function buildFlowerDetail(catalog: Catalog, slug: string): FlowerDetailData | undefined {
  const flower = catalog.flowers.find((row) => row.id === slug);
  if (!flower) return undefined;

  const category = categoryOf(flower);
  // 실사 상수의 단일 원본은 `@/lib/photos` 다. 상세만 **여러 컷**을 받는다 —
  // 그리고 `photosFor()` 의 첫 원소가 랜딩 카드가 쓰는 바로 그 대표컷이라,
  // 카드를 누르고 들어온 사람이 방금 본 사진을 갤러리 첫 장에서 다시 만난다.
  // 히어로는 도감에서 사진이 가장 크게 서는 자리라 기본 폭으로 1600px 을 부른다.
  const photos = photosFor(flower.id);
  // 도판 상수의 단일 원본은 `@/lib/plates` 다(`/stories` 레인·시트와 **같은 그림**을 쓴다).
  // 화면에는 액자가 필요로 하는 것만 내려보낸다 — 주소·설명·크레딧, 그리고 있을 때만 각주.
  const plate = plateFor(flower.id);
  const meaningGroups = buildMeaningGroups(flower, catalog.meanings);
  const meaningCount = meaningGroups.reduce((sum, group) => sum + group.items.length, 0);
  // 탄생화 역조회 — 표에 안 걸린 꽃은 빈 문자열이라 아래에서 키 자체를 만들지 않는다.
  const birthDays = birthDatesLabel(birthDaysOf(catalog.birthFlowers, flower.id));

  return {
    slug: flower.id,
    nameKo: flower.nameKo,
    nameEn: flower.nameEn,
    scientificName: flower.scientificName,
    category,
    categoryLabel: storyCategoryLabel(category),
    categoryHint: CATEGORY_HINT[category],
    photos: photos.map((photo) => ({
      src: photoSrc(photo, 1600),
      // 폰은 화면 폭 전부, 데스크톱은 셸의 절반쯤을 쓴다 — 한 폭만 주면 둘 중 하나가 틀린다.
      // `sizes` 는 화면 쪽(`FlowerGallery`)이 들고 있다(`photoSrcSet()` 주석의 권장값).
      srcSet: photoSrcSet(photo, [640, 1080, 1600]),
      alt: photo.alt,
      credit: photo.credit,
      ...(photo.variant ? { variant: photo.variant } : {}),
    })),
    ...(plate
      ? {
          plate: {
            src: plate.src,
            alt: plate.alt,
            credit: plateCredit(plate),
            // 종이 다르거나 판면에 손댄 도판만 갖는 한 줄 — 없는 꽃은 키 자체를 만들지 않는다.
            ...(plate.note ? { note: plate.note } : {}),
          },
        }
      : {}),
    headline: primaryMeaning(flower, catalog.meanings)?.meaningKo ?? NO_MEANING,
    meaningGroups,
    meaningCount,
    stories: buildStories(flower, catalog.stories),
    // §1.5k — 발췌가 없는 23종은 빈 배열이고, 화면은 구획 자체를 세우지 않는다.
    literature: buildLiterature(flower, catalog.quotes),
    // 데이터가 없는 꽃은 빈 배열 — 화면은 섹션 자체를 세우지 않는다(문구를 지어내지 않는다).
    occasions: occasionsFor(catalog.occasions, flower.id, 'detail'),
    pet: buildPetNote(flower),
    seasonLine: buildSeasonLine(flower),
    priceLine: PRICE_LABELS[flower.priceBand],
    ...(birthDays ? { birthDays } : {}),
  };
}

/** `generateStaticParams` 용. 카탈로그 순서 그대로다. */
export function flowerSlugs(catalog: Catalog): string[] {
  return catalog.flowers.map((flower) => flower.id);
}
