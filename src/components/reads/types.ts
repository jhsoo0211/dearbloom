/**
 * `/reads` 가 서버 → 클라이언트로 넘기는 모양.
 *
 * `/stories` 의 `components/stories/types.ts` 와 같은 경계다: 화면이 그리는 칸만 담고,
 * 라벨은 **전부 서버가 붙여 준 값**이다(클라이언트는 사전도 로더도 갖지 않는다).
 *
 * ⚠ `editorialNote` 는 여기 없다 — 카탈로그 타입에도 없다(로더가 아예 안 옮긴다).
 * ⚠ **원장(`reads.csv`)에는 이미지 칸이 없고, 앞으로도 두지 않는다.** 매거진 썸네일·기사
 *   사진 핫링크 금지는 그대로다(조사 문서 §2). 카드에 서는 그림은 `preview` 한 칸뿐이고,
 *   그 값은 원장이 아니라 **우리 자산**(`src/lib/plates` 의 자체 호스팅 도판)에서 온다.
 */

import type { ReadAccess, ReadKind } from '@/lib/data/types';

/** 카드에서 도감으로 건너가는 다리 한 칸. */
export interface ReadFlowerLink {
  /** `flowers.csv` 의 id. 교차 검증 9 가 실재를 보증한다. */
  id: string;
  nameKo: string;
}

/**
 * 카드 왼쪽에 서는 **미리보기 액자** — 도판 한 벌.
 *
 * ── 왜 도판이고 실사가 아닌가 (2026-08-18 실측) ─────────────────────
 * 이 자리에 걸 수 있는 우리 자산은 둘이었다. 재 보고 도판을 골랐다:
 *   · 도판 썸네일 — `public/plates/thumbs/` **자체 호스팅**, 59종 전원, 평균 7.8KB
 *     (최대 13KB). 24장을 다 걸어도 190KB 이고 **외부 요청은 0** 이다.
 *   · 실사 — Unsplash·Pexels CDN 핫링크. 허용된 가장 좁은 폭이 640px 이라 장당 50~80KB,
 *     24장이면 1.4MB 에 **외부 요청 24개**가 새로 는다. 게다가 47/59 종만 있다.
 * 값은 도판이 열 배 싸고 빠짐이 없으며, 다크 배경 위 세밀화 액자가 이 서비스의 시그니처다
 * (`/stories` 레인 헤더·상세 시트와 같은 결).
 *
 * ── 좁혀서 온다 (코드 리뷰 P1-7 과 같은 경계) ────────────────────────
 * `PlateView` 통째가 아니라 **두 칸**만 담는다. 클라이언트가 쓰는 것이 주소 하나뿐이라
 * 각주 줄(`sourceLine`)·정직 각주(`note`)까지 실어 보내면 54장 곱하기 만큼 payload 만 는다
 * (도판 출처는 푸터의 일괄 크레딧이 판본 단위로 말한다).
 */
export interface ReadPreview {
  /** `flowers.csv` 의 id. 액자의 `data-plate` 로 나가 실측·테스트가 잡을 자리를 만든다. */
  flowerId: string;
  /** 자체 호스팅 160px 썸네일 주소(`plateSrc(plate, 250)` 의 결과). */
  src: string;
}

/**
 * 화면이 그대로 그리는 읽을거리 한 장.
 *
 * 날짜 두 칸(`startsAt`·`endsAt`)이 원본 문자열 그대로 실려 오는 것은 **클라이언트가
 * 만료를 판정해야 하기 때문**이다(`expiry.ts` 머리말). 사람이 읽는 기간 문구
 * (`periodLabel`)는 시계를 보지 않으므로 서버가 미리 굳혀 보낸다.
 */
export interface ReadCard {
  id: string;
  kind: ReadKind;
  /** 갈래 이름(`지금 가 볼 곳`·`읽을거리`·`알아두면 좋은 것`·`빛깔·트렌드`). */
  kindLabel: string;
  title: string;
  sourceTitle: string;
  author?: string;
  /**
   * 외부 원문 주소. 우리 서버가 대신 부르지 않는다 — 브라우저가 그 사이트로 간다.
   *
   * ⚠ **원장 카드는 늘 갖고, API 축제 카드는 없을 수 있다.** 없으면 제목이 링크가 아닌
   *   **정보 카드**로 선다(기간·지역·사진만). 갈 곳 없는 자리를 링크처럼 세우지 않는다는
   *   규범(접근성 리뷰 P2-11)은 링크를 **아예 만들지 않는 것**으로 지킨다.
   */
  url?: string;
  /** 우리가 쓴 한 줄. 원문 요약이 아니다. */
  summary: string;
  /** 통제 어휘 13종 중 이 항목이 가진 것들. 칩 필터가 이 배열만 본다. */
  tags: string[];
  /** 행사만. 만료 판정의 입력이라 **원본 문자열 그대로** 간다. */
  startsAt?: string;
  endsAt?: string;
  /** 사람이 읽는 기간(`2026년 9월 1일 – 9월 6일`). 서버가 굳힌다. */
  periodLabel?: string;
  /** 오프라인이면 지역. 온라인 항목은 자리 태그가 대신 말하므로 비어 있다. */
  region?: string;
  /** 발행일(`2026. 2. 20.`). 원문에 표기가 있는 항목만. */
  publishedLabel?: string;
  access: ReadAccess;
  /** `open` 이 아닐 때만. 「눌러도 못 읽을 수 있다」를 미리 말하는 한 줄이다. */
  accessNote?: string;
  /**
   * 「이건 우리가 고른 게 아니다」 — API 로 받아 온 카드에만 붙는 작은 라벨
   * (`한국관광공사 제공`). 원장 54건은 이 칸이 **없는 것이 정상**이다.
   *
   * 이 한 칸이 두 가지 일을 한다: 공공누리 제1유형의 **출처표시 의무**를 지고,
   * 사람이 열어 본 목록과 기계가 모아 온 목록을 화면에서 갈라 준다
   * (`@/lib/data/reads-festivals` 머리말).
   */
  provider?: string;
  /**
   * 장소 사진 한 장 — **API 축제 카드에만** 붙는다(`firstimage2`).
   *
   * ⚠ 한국관광공사 CDN 원본 주소를 그대로 건다. 받아 두지도, 크기를 바꾸지도 않는다 —
   *   공공누리 제3유형이 금지하는 것이 **변경**이라 리사이즈·크롭이 곧 위반이다.
   *   표시 크기는 CSS(`object-fit`)가 맞춘다(원본 파일은 손대지 않는다).
   * ⚠ **원장 카드에는 이 칸을 채우지 마라.** 이 예외는 공공 API 한 곳에 한정된다
   *   (`@/lib/data/reads-festivals` 의 `FestivalRecord` 머리말).
   */
  imageUrl?: string;
  /** 「우리 도감의 그 꽃」. 없는 것이 정상 값이다. */
  flowers: ReadFlowerLink[];
  /**
   * 카드 액자에 걸 도판 — **`flowers[0]` 이 있을 때만** 채운다.
   *
   * 없는 것이 정상 값이고(54건 중 30건), 그때 화면은 **빈 상자를 세우지 않는다** —
   * 같은 크기·같은 골드 헤어라인의 액자에 갈래 표식을 대신 넣는다(`ReadsBoard` 의
   * `PreviewFrame`). 액자 문법이 한 벌이어야 카드 목록이 한 화면으로 읽힌다.
   */
  preview?: ReadPreview;
}

/** 칩 하나 — 라벨과 그 칩을 눌렀을 때 남는 수. */
export interface ReadFilterChip {
  tag: string;
  count: number;
}
