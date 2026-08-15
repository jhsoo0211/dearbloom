/**
 * `/stories` 이야기 아카이브의 서버·클라이언트 공용 타입.
 *
 * **순수 타입만 둔다.** 클라이언트 컴포넌트가 이 파일만 import 하면 엔진(zod 포함)과
 * 카탈로그 로더(node:fs)가 브라우저 번들에 섞이지 않는다 —
 * `src/components/flow/types.ts` 가 지키는 경계와 같은 규칙이다.
 *
 * 어휘의 원본은 `src/lib/engine/types.ts`(StoryMood·StoryType)이고, 한국어 표기는
 * 서버에서 `src/components/flow/labels.ts` 가 붙여 이 모양으로 내려보낸다.
 *
 * ── 카드와 상세를 가른다 (성능 리뷰 P1-7, 2026-08-15) ────────────────
 * 예전에는 이야기 **전문**까지 한 덩이(`body`)로 묶어 317편 전량을 첫 응답에 실었다.
 * 인라인 RSC payload 만 275KB 였고, 그것을 파싱하느라 롱태스크가 107~124ms 씩 걸렸다 —
 * 그런데 전문은 **시트를 연 한 편**만 읽힌다. 그래서 모양을 둘로 가른다:
 *   · `ArchiveStory` — 카드가 그리는 것(제목·hook·꽃 이름·결·각주 라벨). 처음에 전량 내려간다.
 *   · `StoryDetail`  — 전문과 출처. 시트를 열 때 서버 액션(`app/stories/actions.ts`)이 한 편만 준다.
 * 검색 색인은 제목·hook 이라 카드 쪽에 그대로 남는다(본문은 원래 색인에 없었다).
 * ⚠ `body` 를 `ArchiveStory` 로 되돌리지 마라 — 그 한 줄이 첫 화면을 다시 무겁게 만든다.
 */

import type { PlateView } from '@/lib/plates/view';

/** 아카이브 카드 한 장 = stories.csv 한 행 + 꽃 이름. **전문은 여기 없다.** */
export interface ArchiveStory {
  /** stories.csv 의 story_id. 상세를 부를 때의 열쇠이기도 하다. */
  id: string;
  flowerId: string;
  /** flowers.csv 의 name_ko — 카드의 오버라인이자 꽃 필터의 표기다. */
  flowerNameKo: string;
  title: string;
  /** 티저 한 줄. 카드에서 이야기를 대신 말하는 문장이다. */
  hook?: string;
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
  /** 이야기의 결(moods). 필터 비교용 문자열로만 쓴다(클라이언트가 엔진을 import 하지 않게). */
  moods: string[];
  /** moods 를 한국어로 옮긴 칩 라벨. moods 와 같은 순서다. */
  moodLabels: string[];
}

/**
 * 시트를 열 때만 가져오는 부분 — **전문과 출처**.
 *
 * 서버 액션 `loadStoryDetail(storyId)` 이 돌려주는 모양이다. 없는 id 를 물으면 `null` 이고,
 * 화면은 그때 폴백 문구를 세운다(빈 시트를 보여 주지 않는다).
 */
export interface StoryDetail {
  /** 물어본 story_id 그대로 — 늦게 도착한 응답을 지금 열린 이야기와 맞춰 보는 데 쓴다. */
  id: string;
  /** 전문(story_ko). 상세 시트에서만 펼친다(§1.5i). */
  body: string;
  /** 출처 각주에 쓰는 원문 제목. 창작 이야기는 출처가 면제라 없을 수 있다. */
  sourceTitle?: string;
  /** 원문 링크. 상세 시트에서 새 탭으로 건너간다. */
  sourceUrl?: string;
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
  /**
   * 검색 색인 — 이름 **세 가지**(한국어명·영문명·학명)를 정규화해 이어 붙인 문자열.
   *
   * 영문명·학명은 아카이브 화면 어디에도 나오지 않으므로 클라이언트가 만들 수 없다.
   * 그래서 서버가 `/flowers` 와 **같은 함수**(`normalizeQuery`)로 미리 접어 내려보낸다 —
   * 질의도 같은 함수를 지나 `includes` 한 번으로 만난다("튤" · "rosa" · "baby's breath").
   */
  searchKey: string;
  /**
   * 그 꽃의 세밀화 — **서버가 좁혀 실어 보낸 한 벌**(`@/lib/plates` 의 `plateViewFor`).
   *
   * 예전에는 레인·시트가 `plateFor()` 를 클라이언트에서 불렀는데, 그러면 도판 표 전체가
   * (취득 주소 `remoteSrc` 와 파일 페이지 `pageUrl` 까지) 브라우저 번들에 실린다 —
   * 실제로 `/stories` 청크에 위키미디어 주소 32벌이 들어 있었다(코드 리뷰 P1-7).
   * 액자에 필요한 것만 서버에서 골라 여기 담는다. 도판이 없는 꽃이면 없다.
   */
  plate?: PlateView;
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
