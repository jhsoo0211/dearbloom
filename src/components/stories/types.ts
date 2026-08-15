/**
 * `/stories` 이야기 아카이브의 서버·클라이언트 공용 타입.
 *
 * **순수 타입만 둔다.** 클라이언트 컴포넌트가 이 파일만 import 하면 엔진(zod 포함)과
 * 카탈로그 로더(node:fs)가 브라우저 번들에 섞이지 않는다 —
 * `src/components/flow/types.ts` 가 지키는 경계와 같은 규칙이다.
 *
 * 어휘의 원본은 `src/lib/engine/types.ts`(StoryMood·StoryType)이고, 한국어 표기는
 * 서버에서 `src/components/flow/labels.ts` 가 붙여 이 모양으로 내려보낸다.
 */

/** 아카이브 카드 한 장 = stories.csv 한 행 + 꽃 이름. */
export interface ArchiveStory {
  /** stories.csv 의 story_id. */
  id: string;
  flowerId: string;
  /** flowers.csv 의 name_ko — 카드의 오버라인이자 꽃 필터의 표기다. */
  flowerNameKo: string;
  title: string;
  /** 티저 한 줄. 카드에서 이야기를 대신 말하는 문장이다. */
  hook?: string;
  /** 전문(story_ko). 상세 시트에서만 펼친다(§1.5i). */
  body: string;
  /** §1.5f — 창작 이야기는 라벨을 눈에 띄게 세운다(사실처럼 보이지 않게). */
  isOriginal: boolean;
  /** story_type 한국어 라벨. `original` 이면 "dearbloom이 지어 본 이야기예요". */
  typeLabel: string;
  /** §1.5d 이야기 톤으로 옮긴 confidence_level. */
  confidenceLabel: string;
  /** 문화권(한국어). 비어 있는 행이 있을 수 있다. */
  regionLabel?: string;
  /** 시대(한국어). 사전에 없는 값은 서버가 감춘다(영문 slug 노출 금지). */
  eraLabel?: string;
  /** `이야기의 갈래 — …` 각주에 쓰는 원문 제목. 창작 이야기는 출처가 면제라 없을 수 있다. */
  sourceTitle?: string;
  /** 원문 링크. 상세 시트에서 새 탭으로 건너간다. */
  sourceUrl?: string;
  /** 이야기의 결(moods). 필터 비교용 문자열로만 쓴다(클라이언트가 엔진을 import 하지 않게). */
  moods: string[];
  /** moods 를 한국어로 옮긴 칩 라벨. moods 와 같은 순서다. */
  moodLabels: string[];
}

/**
 * 꽃 한 종 = 가로 레인 한 줄.
 *
 * 아카이브의 기본 뷰는 **꽃별 가로 레인**이라 서버가 꽃 순서(카탈로그 순서)대로
 * 이야기를 접어서 내려보낸다. 클라이언트는 레인 안에서 결(mood)로 거르기만 한다 —
 * 이야기가 없는 꽃은 서버가 아예 레인을 세우지 않는다.
 */
export interface ArchiveLane {
  flowerId: string;
  /** 레인 헤더의 제목이자 `꽃 고르기` 시트의 표기. */
  flowerNameKo: string;
  /**
   * 꽃 계열(§1.4c v3.2 테마 카테고리) — `forest|ivory|gold|wine|dusk`.
   *
   * 필터 칩 5칸이 이 값으로 레인을 거르고, `꽃 고르기` 시트가 이 값으로 31종을 묶는다.
   * 배정은 서버가 `landing-data.categoryOf()` 로 정한다 — 클라이언트는 문자열만 비교한다
   * (엔진·카탈로그를 브라우저 번들에 들이지 않으려는 경계).
   */
  category: string;
  /**
   * 레인 헤더의 카테고리 점 색.
   *
   * `flowers.csv` 대표색(colors[0])을 §1.4 승인 스와치(`COLOR_CHOICES`)로 옮긴 hex 다.
   * 테마 5종(forest·ivory·gold·wine·dusk)은 accent 가 겹쳐(튤립·프리지아 둘 다 골드)
   * 17줄을 구분하지 못한다 — 카테고리의 원본인 대표색을 그대로 쓰는 쪽이 정직하고 잘 갈린다.
   */
  dotColor: string;
  /** 그 색의 한국어 표기. 점은 장식(aria-hidden)이라 스크린리더는 이 말만 듣는다. */
  dotLabel: string;
  /** 이 꽃의 이야기. stories.csv 순서 그대로다. */
  stories: ArchiveStory[];
}

/** 필터 바의 칩 한 칸. 결 필터의 `전체` 는 key 가 `all` 이다. */
export interface ArchiveFilterChip {
  key: string;
  label: string;
  /**
   * 이 칩만 눌렀을 때 남는 편수(서버가 센 값 = 다른 필터가 없을 때의 수).
   * 화면에서는 **다른 축의 필터와 AND** 한 수로 다시 계산해 보여 준다 —
   * 눌러도 0편이 되는 칩이 큰 숫자를 달고 있으면 거짓말이 된다.
   * 서버 기준 0 인 칩은 아예 세우지 않는다.
   */
  count: number;
}
