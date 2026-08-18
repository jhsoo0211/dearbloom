/**
 * 콘텐츠 카탈로그 타입 — "앱이 쓰는 데이터 한 덩어리".
 *
 * 값의 원본은 `content/*.csv`(스키마: `db/seed/schemas.ts`)이고, 여기서는 그것을
 * **엔진 타입(camelCase)** 으로 옮긴 결과의 모양만 정의한다. 어휘(relationship 6종 /
 * intent 7종 / tone 4종 …)는 `src/lib/engine/types.ts` 가 단일 원본이며 여기서 다시
 * 정의하지 않는다.
 *
 * `Catalog` 는 `RuleSet` 을 그대로 확장한다. 즉 `recommend(input, catalog)` 처럼
 * **카탈로그를 엔진에 통째로 넘길 수 있다.** 나중에 CSV 대신 Supabase 에서 읽게 되어도
 * 이 인터페이스만 유지하면 호출부는 그대로다(로더 교체점이 여기 하나).
 */

import type {
  FlowerData,
  FlowerMeaningRow,
  Intent,
  Relationship,
  RuleSet,
  Severity,
  SourceKind,
  Species,
  StoryRow,
  StoryType,
  Tone,
} from '@/lib/engine/types';

/** 이야기·꽃말이 공유하는 신뢰 등급. 원본은 `db/seed/schemas.ts` 의 CONFIDENCE_LEVELS. */
export type ConfidenceLevel = FlowerMeaningRow['confidenceLevel'];

/**
 * 엔진 타입에 없지만 화면이 반드시 쓰는 컬럼만 얹은 확장 3종.
 *
 * 엔진 타입(`FlowerData` / `FlowerMeaningRow` / `StoryRow`)은 추천 계산에 필요한 것만
 * 갖고 있다. 하지만 화면에는 "출처가 보이는 꽃말"·"검수 시점"처럼 **신뢰를 보여 주는
 * 값**이 함께 나가야 한다(design-spec §1.5·§1.5b). 그 값을 로더에서 버리면 다음 사람이
 * 로더부터 다시 고쳐야 하므로, 엔진 타입을 그대로 확장해서 실어 보낸다.
 * (확장형은 원본 타입에 그대로 대입되므로 엔진 호출에는 아무 영향이 없다.)
 */

/** flowers.csv — 엔진용 `FlowerData` + 화면용 관리법. */
export interface CatalogFlower extends FlowerData {
  /** 손질·관리 한 줄. CSV 가 비어 있으면 없음. */
  careSummary?: string;
}

/** meanings.csv — 엔진용 `FlowerMeaningRow` + 출처 URL·주의 문구. */
export interface CatalogMeaning extends FlowerMeaningRow {
  /** 출처 링크. 스키마가 필수로 잡고 있어 항상 있다(출처 없는 꽃말은 싣지 않는다). */
  sourceUrl: string;
  /** "이 해석은 조심해서 써 주세요" 류의 편집 주의 문구. */
  cautionNote?: string;
}

/** stories.csv — 엔진용 `StoryRow` + 검수 시점(화면의 `검수 2026.08` 라벨). */
export interface CatalogStory extends StoryRow {
  reviewedAt: string;
}

/** templates.csv 의 length 어휘. */
export type TemplateLength = 'short' | 'medium';

/** quotes.csv 의 license 어휘. `pd` 는 퍼블릭 도메인 근거(sourceUrl) 필수. */
export type QuoteLicense = 'pd' | 'original';

/**
 * 메시지 템플릿 한 줄 (templates.csv).
 * 엔진은 아직 이 표를 쓰지 않는다 — 멘트 생성(LLM) 레이어가 쓸 재료다.
 */
export interface MessageTemplate {
  templateId: string;
  /** 비어 있으면 관계를 가리지 않는 템플릿. */
  relationship?: Relationship;
  intent: Intent;
  tone: Tone;
  length?: TemplateLength;
  /** 사과 멘트에 반드시 들어가야 하는 요소(예: 인정·재발방지). 없으면 빈 배열. */
  requiredApologyElements: string[];
  templateText: string;
  reviewedAt?: string;
}

/** quotes.csv 의 excerpt_type 어휘 — §1.5k 문학 연계. 원본은 `db/seed/schemas.ts`. */
export type ExcerptType = 'poem' | 'novel' | 'play' | 'essay' | 'classic';

/**
 * 인용문 한 줄 (quotes.csv).
 *
 * 두 종류가 한 표에 산다:
 *   - **범용 인용** — `flowerId` 가 없다. 결과 화면의 "함께 담을 한 줄"(§1.5e) 자리.
 *   - **문학 발췌** — `flowerId` 가 있다. 결과 화면의 "문학 속의 이 꽃"(§1.5k) 자리.
 * 둘을 가르는 것은 `flowerId` 하나뿐이라, 조회하는 쪽이 어느 자리인지 정하면 된다.
 *
 * `pd_basis`(퍼블릭 도메인 판정 근거)는 **일부러 여기 없다.** 화면 비노출 컬럼이라
 * 로더가 아예 옮기지 않는다 — 타입에 없으면 실수로 렌더할 수도 없다.
 */
export interface Quote {
  quoteId: string;
  /** 이 발췌가 붙는 꽃. 없으면 꽃을 가리지 않는 범용 인용이다. */
  flowerId?: string;
  excerptType?: ExcerptType;
  textKo: string;
  /** 원어 원문. 화면에 번역과 나란히 소형으로 병기한다. */
  textOriginal?: string;
  author?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  license: QuoteLicense;
  /** 자체 번역·자체 현대어 표기이면 `dearbloom`. 한국어 원전 그대로면 없다. */
  translator?: string;
  era?: string;
  tags: string[];
  /** 화면에 나가는 한 줄 각주(종 차이·이름 혼동·판본 차이). */
  caveat?: string;
  reviewedAt?: string;
}

/**
 * 탄생화 한 줄 (birth_flowers.csv) — **행의 주인은 꽃이 아니라 날짜다.**
 *
 * 366일이 카탈로그 32종보다 훨씬 많은 종을 부르고, 반대로 한 종이 여러 날에 걸리기도 한다
 * (장미 10일 · 국화 4일). 그래서 자연키는 `(month, day)` 이고 `flowerId` 는 **도감으로
 * 건너가는 선택 다리**다 — 비어 있는 것이 정상 값이며(309일이 그렇다) "아직 안 정했다"가
 * 아니라 "카탈로그에 그 꽃이 없다"는 뜻이다.
 *
 * ⚠ 이 표는 **전통적으로 정해진 탄생화가 아니다.** 하루에 한 종씩 꽃을 소개하던 페이지에서
 *   퍼져 널리 통하게 된 목록이다(`docs/birth-flowers-research.md` §2). 화면 문구에서
 *   "전통"·"공식"·"예로부터 정해진" 류 단정을 쓰면 안 된다.
 *
 * `editorial_note` 는 **일부러 여기 없다**(`Quote.pdBasis` 와 같은 판단). 158행에 붙어 있는
 * 메모는 전부 편집·감사용이라 화면에 나갈 값이 아니다 — 타입에 없으면 실수로 렌더할 수도 없다
 * (조사 문서 §8-4).
 */
export interface BirthFlower {
  /** 1~12. */
  month: number;
  /** 1~31. 달력 유효성(2/30 금지·366일 전수)은 시드 교차 검증이 본다. */
  day: number;
  /** 그 날 표가 부르는 이름. 카탈로그 이름과 다를 수 있다(`노랑수선화` ↔ `수선화`). */
  nameKo: string;
  nameEn?: string;
  scientificName?: string;
  /** 카탈로그에 그 꽃이 있을 때만. 없는 것이 정상 값이다. */
  flowerId?: string;
  /** 스키마가 필수로 잡고 있어 항상 있다(꽃말 없는 탄생화는 싣지 않는다). */
  meaningKo: string;
  sourceUrl: string;
}

/**
 * 탄생화 사진 한 줄 (birth_photos.csv) — **주인은 날짜다**(`BirthFlower` 와 같은 자연키).
 *
 * 같은 이름이 여러 날에 걸리고 그 날들이 서로 다른 사진을 들기도 한다(`삼나무` 2/15 는 숲,
 * 9/30 은 열매). 그래서 이름이 아니라 `(month, day)` 가 행을 가른다.
 *
 * `slug` 가 없는 행이 6개 있다 — 커먼즈에 검증 가능한 실사가 없었거나, 표의 국명과 영문명이
 * 다른 식물을 가리켜 무엇을 실을지 정하지 못한 날이다. **그 사실 자체가 조사 결과**라 행을
 * 지우지 않는다. 화면은 `slug` 유무로 사진 자리를 세울지 정한다(빈 액자를 그대로 둔다).
 *
 * `species_note` 는 **일부러 여기 없다**(`Quote.pdBasis` · `BirthFlower.editorialNote` 와 같은
 * 판단). 종 동정 판정 근거는 편집자가 CSV 에서 읽는 값이지 사용자에게 보여 줄 값이 아니다 —
 * 타입에 없으면 실수로 렌더할 수도 없다.
 *
 * ⚠ 크레딧 세 칸(`author`·`license`·`pageUrl`)은 사진이 있으면 **함께 있다**(시드 교차 검증).
 *   화면에 거는 것은 폭을 줄여 다시 인코딩한 사본이라 CC BY-SA 에서는 파생물이고, 그 의무는
 *   저작자·라이선스 라벨·원본 링크를 이미지 단위로 밝혀야 이행된다.
 */
export interface BirthPhoto {
  month: number;
  day: number;
  /** 그날 표가 부르는 이름. 표와 **같은 문자열**이어야 한다(시드 교차 검증 6). */
  nameKo: string;
  /** 자체 호스팅 파일 이름. 없으면 미확보 행이다. */
  slug?: string;
  /** 위키미디어 파일 페이지 — 원본으로 돌아가는 링크이자 라이선스 증빙. */
  pageUrl?: string;
  /** 취득 주소(1280px 썸네일). 런타임에 부르지 않는다 — 재다운로드의 입력이다. */
  directUrl?: string;
  author?: string;
  /** 파일 페이지 표기 그대로(`CC BY-SA 4.0`). 우리가 다시 지어내지 않는다. */
  license?: string;
  /** 원본 가로 픽셀. 더 큰 사본이 필요할 때 무엇이 가능한지 아는 근거다. */
  width?: number;
  /** 그 식물을 한 줄로 소개하는 문장. 사진 **아래** 캡션으로 나간다(위에 합성하지 않는다). */
  familyLine?: string;
}

/**
 * 탄생화 이야기 한 편 (birth_stories.csv) — **주인은 이름이다**(꽃 id 가 아니라).
 *
 * `CatalogStory`(stories.csv)와 판박이지만 걸리는 자리가 다르다. 366일 중 도감으로 이어지는
 * 날은 86일뿐이라 나머지 280일에는 걸어 둘 `flowerId` 가 없고, 없는 id 를 지어내면 도감이
 * 검증하지 않은 종이 카탈로그에 섞인다. 그래서 표를 나눴다 — 조회는 이름으로 한다
 * (`birthStoriesOfName`, `@/lib/data/birth-flowers`).
 *
 * `moods`·`intents` 가 없는 것도 의도다. 그 두 축은 추천 선별기(`pickStories`)가 쓰는데,
 * 사전 시트는 그 이름의 이야기를 **전부 순서대로** 펼칠 뿐 고르지 않는다.
 *
 * `editorialNote` 는 **일부러 여기 없다** — 편집·감사 기록이라 화면에 나갈 값이 아니다.
 */
export interface BirthStory {
  /** 표가 부르는 이름. 이 값이 사전 시트와 이야기를 잇는 유일한 끈이다. */
  nameKo: string;
  storyId: string;
  title: string;
  /** 목록에서 먼저 보여 줄 한 줄. 없는 편도 있다. */
  hook?: string;
  storyKo: string;
  cultureRegion?: string;
  era?: string;
  /** `stories.csv` 와 **같은 어휘**다(folklore · history · literary · original). */
  storyType: StoryType;
  sourceKind: SourceKind;
  /** 창작(`original`)만 없을 수 있다 — 그 사실이 곧 "지어낸 이야기"라는 표시다(§1.5f). */
  sourceUrl?: string;
  /** CSV 컬럼 이름은 `confidence` 지만, 화면 라벨은 이야기 쪽과 같은 함수를 쓴다. */
  confidenceLevel: ConfidenceLevel;
}

/** reads.csv 의 kind 어휘 — **데이터의 종류**다. 원본은 `db/seed/schemas.ts` 의 READ_KINDS. */
export type ReadKind = 'article' | 'event' | 'guide' | 'trend';

/** reads.csv 의 access 어휘. 원본은 `db/seed/schemas.ts` 의 READ_ACCESS_LEVELS. */
export type ReadAccess = 'open' | 'paywall' | 'registration';

/**
 * 「읽을거리」 한 줄 (reads.csv) — 사람이 고른 **외부** 글·행사 하나.
 *
 * 다른 표와 결정적으로 다른 점: **본문이 없다.** 제목·출처·우리가 쓴 한 줄·링크가 전부다
 * (`docs/reads-research.md` §1). 이미지 칸도 일부러 없다 — 남의 썸네일을 걸지 않는다.
 *
 * ⚠ `startsAt`·`endsAt` 은 **행사만** 갖는다. 그리고 **만료 판정을 서버에서 하지 마라** —
 *   정적 배포에서 빌드 시각의 "오늘" 이 HTML 에 굳어, 10월에 배포한 사이트가 12월에도
 *   10월 기준으로 행사를 보여 준다(§7-2). 거르기는 브라우저의 오늘로만 한다
 *   (`src/components/reads/expiry.ts`).
 *
 * `editorialNote` 는 **일부러 여기 없다**(`Quote.pdBasis` · `BirthFlower.editorialNote` 와 같은
 * 판단). 그래서 조사 문서 §3-4 가 "사용자의 결정을 바꾸는 사실을 보이지 않는 칸에 묻지 마라"
 * 를 규범으로 세웠다 — 입장료·예약 필수·`(예정)` 표기는 전부 `summaryKo` 나 `access` 에 있다.
 */
export interface CatalogRead {
  readId: string;
  kind: ReadKind;
  /** 그 글·행사의 제목. 원문 표기 그대로다(우리가 다시 짓지 않는다). */
  title: string;
  sourceTitle: string;
  author?: string;
  sourceUrl: string;
  /** 원문에 발행일이 **표기된 것만**. 없는 것이 정상 값이다. */
  publishedAt?: string;
  /** `kind === 'event'` 일 때만 있다(스키마가 그렇게 묶어 둔다). */
  startsAt?: string;
  endsAt?: string;
  /** 오프라인이면 지역, 온라인/무관이면 `온라인` 또는 없음. */
  region?: string;
  /** **우리가 쓴 한 줄.** 원문 요약이 아니다(§1.5d 해요체). */
  summaryKo: string;
  access: ReadAccess;
  confidenceLevel: ConfidenceLevel;
  reviewedAt: string;
  /** 화면 칩이 되는 통제 어휘 13종(계절 4 · 결 5 · 자리 4). */
  tags: string[];
  /** `flower:<id>` · `color:<색>` · `theme:<계열>`. **비는 것이 정상 값**이다. */
  linksTo: string[];
}

/**
 * §1.5h 「이런 날 건네보세요」 한 줄 (occasions.csv).
 *
 * `source_note` 는 **일부러 여기 없다**(`Quote.pdBasis` 와 같은 판단) — 그 칸은 문구의
 * 출신을 적어 두는 편집 메모지 화면에 나가는 값이 아니다.
 *
 * 조회는 `@/lib/data/occasions` 의 `occasionsFor` 로만 한다. 이 배열을 직접 훑는 코드를
 * 화면마다 새로 쓰면 `surface` 를 가리는 규칙이 화면마다 갈린다.
 */
export interface CatalogOccasion {
  flowerId: string;
  /** `detail`(결과·도감) · `landing`(랜딩 슬라이드). **빈 문자열이면 모든 화면**이다. */
  surface: string;
  occasionKo: string;
}

/**
 * 반려동물 안전성 한 줄 (pet_safety.csv).
 *
 * 꽃별 판정은 `FlowerData.petSafety` 에도 들어가지만, 그쪽에는 대체 꽃 목록이 없다.
 * "위험하다"만 말하고 대안을 못 주는 화면을 막으려면 이 평면 목록이 필요하다.
 */
export interface PetSafetyRecord {
  flowerId: string;
  species: Species;
  toxic: boolean;
  severity: Severity;
  toxicParts: string[];
  safeAlternativeFlowerIds: string[];
  sourceUrl: string;
  reviewedAt: string;
}

/**
 * 앱이 쓰는 콘텐츠 전체.
 * `flowers` / `rules` / `meanings` / `stories` 는 `RuleSet` 필드 그대로라
 * 그대로 엔진에 넘길 수 있다(§ `recommend(input, catalog)`).
 */
export interface Catalog extends RuleSet {
  flowers: CatalogFlower[];
  /** CSV 에 한 행도 없을 수는 있어도, 필드 자체는 항상 존재한다(빈 배열). */
  meanings: CatalogMeaning[];
  stories: CatalogStory[];
  templates: MessageTemplate[];
  quotes: Quote[];
  petSafety: PetSafetyRecord[];
  /**
   * 366일 탄생화 달력. 조회는 `@/lib/data/birth-flowers` 의 순수 함수로 한다
   * (이 배열을 직접 훑는 코드를 화면마다 새로 쓰지 마라).
   */
  birthFlowers: BirthFlower[];
  /**
   * 탄생화 실사 280행(확보 274 · 미확보 6). 날짜로 조회한다(`birthPhotoOn`).
   * ⚠ **서버에서만 만진다.** 이 배열이 클라이언트로 통째로 건너가면 취득 주소 274벌이
   *   번들에 실린다 — 화면으로 내려보내는 것은 `birthPhotoView()` 가 좁힌 한 벌뿐이다.
   */
  birthPhotos: BirthPhoto[];
  /**
   * 탄생화 이야기 407편. **이름으로** 조회한다(`birthStoriesOfName`) — 이 표의 주인은
   * 날짜도 꽃 id 도 아닌 이름이다.
   * ⚠ 407편을 클라이언트로 통째로 직렬화하지 마라(`/stories` 가 겪은 성능 리뷰 P1-7).
   *   사전 시트가 여는 **그 이름의 몇 편**만 서버 액션으로 그때 간다.
   */
  birthStories: BirthStory[];
  /**
   * 「읽을거리」 54건. `/reads` 가 서버에서 카드로 좁혀 내려보낸다
   * (`editorial_note` 는 로더가 이미 떨궜고, 카드는 그중에서도 화면이 그리는 칸만 든다).
   */
  reads: CatalogRead[];
  /**
   * §1.5h 상황 예시. **CSV 순서가 화면 순서다** — 고르는 일은
   * `@/lib/data/occasions` 의 `occasionsFor` 한 곳이 한다.
   */
  occasions: CatalogOccasion[];
}
