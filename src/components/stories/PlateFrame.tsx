'use client';

/**
 * 세밀화 액자 — 레인 헤더의 작은 원판(`thumb`)과 상세 시트의 세로 액자(`card`).
 *
 * ── 왜 액자인가 (docs/illustration-assets.md 사용 규칙 1) ─────────────
 * 도판 배경을 누끼로 날리면 19세기 판면의 종이 질감과 인쇄 활자가 사라져 "꽃 클립아트" 가
 * 된다. 크림 판면을 그대로 둔 채 **파스파르투 카드로 감싸는** 것이 이 애셋의 사용법이다 —
 * 어두운 방에 걸린 표본 액자처럼 읽히게. 톤 통일 필터·아이보리 매트·골드 헤어라인은
 * CSS(`stories.module.css` 의 `.plate*`)가 전 애셋에 **같은 값으로** 건다.
 * ⚠ 도판 위에 본문 텍스트를 올리지 마라(사용 규칙 3) — 밝은 바탕이라 아이보리 타이포가 죽는다.
 *
 * ── 주소는 이미 정해져 온다 (코드 리뷰 P1-7 · 성능 리뷰 P0-2) ──────────
 * 예전에는 이 컴포넌트가 `plateSrc(plate, width)` 로 폭을 골랐고, 그러려고 도판 표
 * (`@/lib/plates`)를 **클라이언트에서** import 했다. 그 한 줄 때문에 취득 주소
 * (`remoteSrc`)와 파일 페이지(`pageUrl`)까지 32벌이 브라우저 번들에 실려 나갔다.
 * 지금은 서버가 `plateViewFor()` 로 좁혀 `PlateView` 를 props 에 담아 준다 —
 * 이 파일은 **타입만** import 하므로(`import type`, 런타임에 지워진다) 표가 따라오지 않는다.
 * ⚠ 여기서 `@/lib/plates` 를 값으로 import 하지 마라.
 *
 * ── 실패는 조용히 감춘다 ─────────────────────────────────────────────
 * 도판은 우리 `public/plates/` 사본이라 예전처럼 위키미디어의 `HTTP 429` 로 통째로
 * 사라지지는 않는다(문서 배포 규칙 1 — 자체 호스팅). 그래도 이 화면은 도판이 없어도
 * 성립해야 하므로 실패 처리는 그대로 남긴다 — 파일 하나가 빠졌을 때 깨진 이미지 아이콘이
 * 레인 헤더마다 뜨는 쪽이 도판이 없는 쪽보다 훨씬 나쁘다.
 * ⚠ `onError` 만으로는 부족하다. 하이드레이션 **전에** 이미 실패한 이미지는 이벤트가 이미
 *   지나가 리스너에 걸리지 않는다 — 마운트 직후 `complete && naturalWidth === 0` 을 한 번
 *   직접 확인한다(브라우저가 "다 끝났는데 폭이 0" 이라고 말하면 그게 실패다).
 */

import { useEffect, useRef, useState } from 'react';

import type { PlateView } from '@/lib/plates/view';
import styles from './stories.module.css';

export interface PlateFrameProps {
  /** 서버가 좁혀 준 한 벌. 주소는 그 자리의 표시 크기에 맞춰 **이미 골라져 있다**. */
  plate: PlateView;
  /** `thumb` = 레인 헤더 원형 · `card` = 시트 상단 세로 액자. */
  variant: 'thumb' | 'card';
  /**
   * 장식으로 둘 것인지. 레인 헤더는 바로 옆에 꽃 이름이 있어 도판 설명이 두 번 읽히므로
   * 장식으로 두고, 상세 시트에서는 그림이 정보라 설명을 읽어 준다.
   */
  decorative?: boolean;
}

export default function PlateFrame({ plate, variant, decorative = false }: PlateFrameProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return null;

  return (
    <span
      className={variant === 'thumb' ? styles.plateThumb : styles.plateCard}
      data-plate={plate.flowerId}
      aria-hidden={decorative ? 'true' : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 자체 호스팅 도판(본판 + 160px 썸네일 2벌). next/image 최적화는 도입하지 않았다(docs/illustration-assets.md). */}
      <img
        ref={ref}
        className={styles.plateImg}
        src={plate.src}
        alt={decorative ? '' : plate.alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
