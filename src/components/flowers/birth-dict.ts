/**
 * 탄생화 사전 뷰모델 — 366일 표 → 화면이 그대로 쓰는 **한 달치**(§1.5m ⑤).
 *
 * **서버에서만 부른다.** 출처 이름 사전(`sourceLabel`)이 `data.ts` 에 있고 그쪽은 엔진
 * 배럴(zod)을 끌어오므로, 클라이언트 컴포넌트가 이 파일을 import 하면 그것들이 통째로
 * 브라우저 번들에 실린다. 화면이 쓰는 **고정 문구**는 그래서 여기 없다 —
 * 의존 없는 `birth-copy.ts` 에 있고 양쪽이 그것을 본다.
 *   (fs 의존은 없다 — 카탈로그는 호출부가 `loadCatalog()` 로 읽어 넘겨준다.)
 *
 * ── 왜 "한 달"이 단위인가 ────────────────────────────────────────────
 * 표는 366행이고 직렬화하면 50~60KB 다. 정식 도감이 32종인데 탄생화가 366일이라는 사실을
 * 보여 주려면 열람 화면이 필요하지만, 그렇다고 366행을 첫 응답에 얹으면 `/stories` 가
 * 겪었던 문제(성능 리뷰 P1-7)를 도감이 되풀이한다. 사람이 실제로 훑는 단위는 **달**이라
 * (자기 생일이 있는 달, 선물할 사람의 달) 조회도 달로 자른다 — 한 번에 28~31행이다.
 *
 * ── 2단 티어 (이 파일이 지켜야 하는 선) ──────────────────────────────
 * 366일 중 도감으로 건너갈 수 있는 날은 **57일**(고유 24종)뿐이고, 나머지 309일은
 * 표가 적어 둔 이름과 꽃말이 전부다. 두 티어를 같은 카드로 그리면 사전 항목이
 * "도감이 확인해 준 꽃"으로 읽힌다. 그래서 여기서 하는 일의 절반은 **가르는 것**이다:
 *   · 매칭 → `link`(상세 경로 + 도감 쪽 이름 + 대표 실사 썸네일)
 *   · 미매칭 → `link` 자체가 없다. **사진을 지어내지 않는다.**
 *
 * ⚠ 워딩 대전제(`docs/birth-flowers-research.md` §2·§8): 이 표는 전통적으로 정해진
 *   탄생화가 아니다. 여기서 문구를 새로 짓지 마라 — 원본은 `birth-copy.ts` 다.
 */

import { hasFinalConsonant } from '@/components/landing/landing-data';
import { metaNotes } from '@/components/stories/meta';
import {
  eraLabel,
  regionLabel,
  storyConfidenceLabel,
  STORY_TYPE_LABELS,
} from '@/components/flow/labels';
import { birthPhotoView, birthThumbSrc } from '@/lib/birth-photos';
import {
  birthDateLabel,
  birthDatesLabel,
  birthDaysOfName,
  birthFlowerOn,
  birthFlowersInMonth,
  birthMonthLabel,
  birthPhotoOn,
  birthStoriesOfName,
} from '@/lib/data/birth-flowers';
import type { BirthFlower, BirthStory, Catalog } from '@/lib/data/types';
import { photoFor, photoSrc } from '@/lib/photos';
import { sourceLabel } from './data';
import type {
  BirthDictDetail,
  BirthDictEntry,
  BirthDictStory,
  BirthFlowerView,
  BirthMonthView,
} from './types';

/**
 * 표의 하루 → 사전 한 줄.
 *
 * 선택 컬럼은 빈 문자열로 메우지 않고 **키 자체를 만들지 않는다**(로더 `mapBirthFlower` 와
 * 같은 규칙). `''` 를 넣으면 화면이 "학명이 있는데 비어 있다"와 "학명이 없다"를 구별하지
 * 못하고, 페이로드에도 뜻 없는 바이트가 366번 실린다.
 */
function toEntry(catalog: Catalog, row: BirthFlower): BirthDictEntry {
  // 도감 이름은 표 이름과 다를 수 있다(`노랑수선화` ↔ `수선화`) — 도착지 이름을 함께 싣는다.
  const linked = row.flowerId
    ? catalog.flowers.find((flower) => flower.id === row.flowerId)
    : undefined;
  // 썸네일 폭은 `PhotoWidth` 의 카드 규격(640)이다. 목록에 48px 로 서지만 레티나·CDN 캐시를
  // 생각하면 이 화면만 쓰는 폭을 새로 만들 이유가 없다(`photos/index.ts` 의 네 폭 주석).
  const photo = linked ? photoFor(linked.id) : undefined;
  // 사전 티어의 썸네일 — 자체 호스팅 320px 사본. 미확보 날이면 `undefined` 라 화면이
  // 점선 빈 액자를 그대로 세운다(다른 꽃 사진을 끌어다 쓰지 않는다).
  const birthPhoto = birthPhotoOn(catalog.birthPhotos, row.month, row.day);

  // 같은 이름이 놓인 **다른** 날들. 그날 자신은 뺀다 — 시트 머리에 이미 적혀 있다.
  const alsoOn = birthDatesLabel(
    birthDaysOfName(catalog.birthFlowers, row.nameKo).filter(
      (other) => !(other.month === row.month && other.day === row.day),
    ),
  );

  // 도감 대표컷이 있으면 그것을 쓴다 — 카드를 누르고 들어갈 화면과 같은 사진이어야 두
  // 화면이 이어진다. 둘 다 실어 보내면 366줄에 쓰지 않을 주소가 한 벌 더 얹힌다.
  const thumbSrc = photo ? photoSrc(photo, 640) : birthPhoto?.slug ? birthThumbSrc(birthPhoto.slug) : undefined;

  return {
    day: row.day,
    dateLabel: birthDateLabel(row.month, row.day),
    nameKo: row.nameKo,
    ...(row.nameEn ? { nameEn: row.nameEn } : {}),
    ...(row.scientificName ? { scientificName: row.scientificName } : {}),
    meaning: row.meaningKo,
    meaningCopula: hasFinalConsonant(row.meaningKo) ? '이에요' : '예요',
    ...(alsoOn ? { alsoOn } : {}),
    ...(linked
      ? {
          link: {
            href: `/flowers/${linked.id}`,
            nameKo: linked.nameKo,
          },
        }
      : {}),
    ...(thumbSrc ? { thumbSrc } : {}),
    sourceUrl: row.sourceUrl,
    sourceLabel: sourceLabel(row.sourceUrl),
  };
}

/**
 * 표의 이야기 한 행 → 시트가 그대로 쓰는 모양.
 *
 * 각주 줄은 `/stories` 시트와 **같은 함수**(`metaNotes`)로 만든다. 같은 정보가 화면마다
 * 다른 순서로 서면 사람이 다시 찾게 되고, 라벨을 여기서 새로 지으면 두 화면이 같은 값을
 * 다르게 부르게 된다(`storyConfidenceLabel` 이 출처 성격까지 보고 문구를 가르는 것도
 * 그대로 물려받는다 — 1839년 원문에 "드물게 전해지는" 을 붙이지 않기 위한 규칙이다).
 */
function toStory(story: BirthStory): BirthDictStory {
  const notes = metaNotes({
    ...(story.cultureRegion ? { regionLabel: regionLabel(story.cultureRegion) } : {}),
    ...(eraLabel(story.era) ? { eraLabel: eraLabel(story.era) } : {}),
    typeLabel: STORY_TYPE_LABELS[story.storyType],
    isOriginal: story.storyType === 'original',
    confidenceLabel: storyConfidenceLabel(story.confidenceLevel, story.sourceKind),
  });

  return {
    id: story.storyId,
    title: story.title,
    ...(story.hook ? { hook: story.hook } : {}),
    body: story.storyKo,
    notes,
    ...(story.sourceUrl
      ? { sourceLabel: sourceLabel(story.sourceUrl), sourceUrl: story.sourceUrl }
      : {}),
  };
}

/**
 * 그 날짜의 **사진 + 이야기** — 사전 시트를 연 사람만 받는 한 벌(§C ①).
 *
 * 이야기를 **이름으로** 찾는 것이 이 함수의 유일한 특이점이다. 사진은 날짜에 붙지만
 * (`삼나무` 2/15 는 숲, 9/30 은 열매) 이야기는 식물에 붙는다 — `단양쑥부쟁이` 의 네 편은
 * 그 이름이 놓인 세 날 어디서 열어도 같아야 한다.
 *
 * 표에 없는 날짜면 `null`. 사진도 이야기도 없는 날은 `{ stories: [] }` 이고,
 * 그때 화면은 두 구획을 아예 세우지 않는다(빈 제목만 남기지 않는다).
 */
export function buildBirthDictDetail(
  catalog: Catalog,
  month: number,
  day: number,
): BirthDictDetail | null {
  const row = birthFlowerOn(catalog.birthFlowers, month, day);
  if (!row) return null;

  const photo = birthPhotoView(birthPhotoOn(catalog.birthPhotos, month, day));
  const stories = birthStoriesOfName(catalog.birthStories, row.nameKo).map(toStory);

  return { ...(photo ? { photo } : {}), stories };
}

/**
 * 그 날짜의 탄생화 한 장 — **생일 꽃 찾기**가 쓰는 카드 값.
 *
 * 조립이 여기 있는 이유: 같은 값을 서버 액션(`app/flowers/actions.ts`)과 정적 데모
 * 생성기(`scripts/build-demo-catalog.mjs`)가 **둘 다** 만들어야 한다. 두 곳에 손으로
 * 베껴 두면 받침 조사나 도감 이름 하나가 어긋나는 날 정적 데모에서만 다른 문장이 나온다 —
 * `buildBirthMonth` 를 데모가 그대로 부르는 것과 같은 이유다.
 *
 * 표에 없는 날짜(2월 30일 등)면 `null`. 던지지 않는 이유는 `buildBirthMonth` 와 같다.
 */
export function buildBirthFlower(
  catalog: Catalog,
  month: number,
  day: number,
): BirthFlowerView | null {
  const row = birthFlowerOn(catalog.birthFlowers, month, day);
  if (!row) return null;

  // 도감 이름은 표 이름과 다를 수 있다(`노랑수선화` ↔ `수선화`). 링크를 걸 때는 도착지가
  // 실제로 뭐라고 불리는지 함께 보여 줘야 "다른 꽃으로 보내는 링크"로 읽히지 않는다.
  const linked = row.flowerId
    ? catalog.flowers.find((flower) => flower.id === row.flowerId)
    : undefined;
  const photo = birthPhotoView(birthPhotoOn(catalog.birthPhotos, month, day));

  return {
    dateLabel: birthDateLabel(row.month, row.day),
    nameKo: row.nameKo,
    ...(row.nameEn ? { nameEn: row.nameEn } : {}),
    ...(row.scientificName ? { scientificName: row.scientificName } : {}),
    meaning: row.meaningKo,
    meaningCopula: hasFinalConsonant(row.meaningKo) ? '이에요' : '예요',
    ...(linked ? { link: { href: `/flowers/${linked.id}`, nameKo: linked.nameKo } } : {}),
    ...(photo ? { photo } : {}),
  };
}

/**
 * 그달의 사전 한 판. 범위 밖(0월·13월)이거나 표에 그달이 없으면 `null`.
 *
 * `null` 을 돌려주고 throw 하지 않는 이유는 `lookupBirthFlower` 와 같다 — 던지면
 * 클라이언트에는 뭉개진 오류만 남고 사람이 읽을 문장은 남지 않는다.
 */
export function buildBirthMonth(catalog: Catalog, month: number): BirthMonthView | null {
  const rows = birthFlowersInMonth(catalog.birthFlowers, month);
  if (rows.length === 0) return null;

  const entries = rows.map((row) => toEntry(catalog, row));

  return {
    month,
    monthLabel: birthMonthLabel(month),
    entries,
    linkedCount: entries.filter((entry) => entry.link).length,
  };
}
