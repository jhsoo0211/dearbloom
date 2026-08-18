/**
 * `/bouquet` 이 서버에서 클라이언트로 넘기는 값의 모양.
 *
 * ⚠ **이 파일에 값을 두지 마라**(`lib/plates/view.ts` 와 같은 규율). 타입만 두는 파일이라
 *   클라이언트 컴포넌트가 마음 놓고 import 할 수 있고, 런타임에는 통째로 지워진다.
 *
 * 판정에 쓰는 타입은 **엔진이 원본**이다(`@/lib/engine/bouquet`). 여기서는 화면이 더 아는
 * 것(색의 hex·도판 썸네일·「사러 가기」 검색어)만 얹는다 — 얹은 타입은 원본 타입에 그대로
 * 대입되므로 `judgeBouquet(choice, flowers)` 호출에는 아무 영향이 없다.
 */

import type { BouquetColor, BouquetSpecies } from '@/lib/engine/bouquet';

/** 색 한 칸 + 스와치. hex·테두리 여부는 `COLOR_CHOICES`(flow/labels.ts)가 정한다. */
export interface BouquetColorView extends BouquetColor {
  hex: string;
  /** 흰색·크림처럼 배경과 구분이 안 되는 색에 테두리를 두른다. */
  needsRing?: boolean;
}

/** 칩에 거는 세밀화 썸네일. 취득 주소·판본은 여기 없다(`PlateView` 와 같은 판단). */
export interface BouquetPlateView {
  src: string;
  alt: string;
}

/**
 * 화면이 쥐는 꽃 한 종.
 *
 * `BouquetSpecies`(= 엔진 `FlowerData` + 팔레트 + 안전 대체)를 그대로 품는다 —
 * 그래야 판정이 `exclude()` 를 부를 수 있다(엔진 머리말의 금지선).
 */
export interface BouquetFlowerView extends Omit<BouquetSpecies, 'paletteKo'> {
  paletteKo: BouquetColorView[];
  /** 「사러 가기」 검색어로 쓰는 대표 이름 — `buySearchName()` 을 거친 값이다. */
  buyName: string;
  /** 도판이 없는 꽃이면 없다. 화면은 도판 없이도 성립해야 한다. */
  plate?: BouquetPlateView;
}

/**
 * 서버가 한 번에 확정해 내려보내는 묶음.
 *
 * ⚠ **목록은 한 벌뿐이다.** 주 꽃 목록·곁들이 목록을 여기서 따로 만들어 넘기면 같은 꽃이
 *   두 번, 세 번 직렬화된다(59종이 그만큼 무거워진다). 두 목록은 순수 함수
 *   `mainCandidates()` · `accentCandidates()` 가 브라우저에서 이 배열 하나로 만든다 —
 *   정렬 규칙이 엔진에 있으니 화면이 그것을 다시 알 이유도 없다.
 */
export interface BouquetIndex {
  /** 카탈로그 전종. 안전 대체 제안도 이 목록에서 이름을 찾는다. */
  flowers: BouquetFlowerView[];
  /** 푸터 도판 크레딧 — 화면에 실제로 액자를 세운 판본만(`plateCredits`). */
  credits: string[];
}
