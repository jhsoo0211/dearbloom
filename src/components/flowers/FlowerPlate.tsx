'use client';

/**
 * 도감 히어로의 **세밀화 액자 안쪽** — 도판 한 장, 또는 그 자리를 대신할 색면.
 *
 * 클라이언트인 이유는 단 하나, `onError` 다. 도판은 위키미디어 표준 썸네일을 핫링크하는데
 * 위키미디어는 연속 요청에 429 를 돌려준다(docs/illustration-assets.md 배포 규칙 2).
 * 깨진 이미지 아이콘이 액자 한가운데 뜨는 것보다, 그 꽃의 카테고리 색면이 채우는 편이 낫다.
 *
 * ⚠ `onError` 만으로는 부족하다. 하이드레이션 **전에** 이미 실패한 이미지는 이벤트가
 *   지나간 뒤라 리스너에 걸리지 않는다 — 그래서 마운트 직후 `complete && naturalWidth === 0`
 *   을 한 번 직접 확인한다(브라우저가 "다 끝났는데 폭이 0" 이라고 말하면 그게 실패다).
 */

import { useEffect, useRef, useState } from 'react';

import styles from './flowers.module.css';

interface FlowerPlateProps {
  src?: string;
  alt?: string;
  /**
   * 공통 톤 통일 필터로 수렴되지 않는 컷의 CSS filter(예: 벚꽃 우키요에).
   * 인라인 style 이라 `.plateImg` 의 공통 필터를 **덮어쓴다** — 값에 공통 필터가 포함돼
   * 있다는 전제다(illustrations.ts 의 `grade` 주석과 같은 약속).
   */
  grade?: string;
}

export default function FlowerPlate({ src, alt, grade }: FlowerPlateProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (!src || failed) {
    // 폴백은 장식이다 — 이름·꽃말은 액자 밖에 이미 있으므로 스크린리더에 두 번 읽히지 않게 한다.
    return <span className={styles.plateFallback} aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 퍼블릭 도메인 도판 원격 URL. next/image 리모트 최적화는 도입하지 않았다(docs/illustration-assets.md).
    <img
      ref={ref}
      className={styles.plateImg}
      src={src}
      alt={alt ?? ''}
      style={grade ? { filter: grade } : undefined}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
