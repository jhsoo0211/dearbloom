/**
 * 비밀 편지 화면이 쓰는 **좁힌 값들**.
 *
 * 서버 컴포넌트(`app/letter/**`)가 카탈로그·실사·도판을 읽어 이 모양으로 확정해
 * props 로 내려보낸다. 클라이언트는 카탈로그도 라벨 사전도 갖지 않는다 —
 * `/stories` 가 `PlateView` 로 표를 좁혀 보낸 것과 같은 규율이다
 * (`src/lib/plates/index.ts` 머리말 "표는 서버·스크립트 전용이다").
 *
 * ⚠ 여기서 `@/lib/data/catalog`(node:fs)·`@/lib/engine`(zod 배럴)을 import 하지 마라.
 *   이 파일은 클라이언트 컴포넌트가 함께 읽는다.
 */

import type { LetterTheme } from '@/lib/letters/types';

/** 스튜디오의 꽃 한 칸 + 편지지에 서는 꽃 한 송이. 두 자리가 같은 값을 쓴다. */
export interface LetterFlowerOption {
  flowerId: string;
  nameKo: string;
  /** 대표 꽃말 한 줄(도감·랜딩과 **같은 규칙**으로 고른 행). */
  meaning: string;
  /** 꽃 계열(§1.4c) — 고르기 화면의 묶음 기준. */
  category: string;
  /** 서버가 만든 이름 색인(한국어명·영문명·학명). 영문명·학명은 화면에 없다. */
  searchKey: string;
  /** 카드 썸네일(640) + 후보 폭. */
  thumbSrc: string;
  thumbSrcSet: string;
  /** 편지지 액자(1080까지). */
  photoSrc: string;
  photoSrcSet: string;
  alt: string;
  credit: string;
  /** 배경이 밝은 컷 — 카드에서 다크 오버레이가 필요하다(docs/image-assets §주의 4). */
  bright?: boolean;
  /** 세밀화 도판(썸네일 폭). 편지지 위 소품으로만 쓴다. */
  plate?: { src: string; alt: string };
}

/** 색감 칩 한 칸. 라벨은 `storyCategoryLabel()` 이 정한 말 그대로다. */
export interface LetterThemeOption {
  key: LetterTheme;
  label: string;
  hint: string;
}
