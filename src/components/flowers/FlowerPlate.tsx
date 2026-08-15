'use client';

/**
 * 도감 히어로의 **세밀화 액자 안쪽** — 도판 한 장, 또는 그 자리를 대신할 색면.
 *
 * 클라이언트인 이유는 단 하나, `onError` 다. 도판은 우리 `public/plates/` 사본이라
 * 예전처럼 위키미디어의 429 로 통째로 사라지지는 않지만(docs/illustration-assets.md
 * 배포 규칙 1 — 자체 호스팅), 파일 하나가 빠졌을 때 깨진 이미지 아이콘이 액자 한가운데
 * 뜨는 것보다 그 꽃의 카테고리 색면이 채우는 편이 낫다.
 *
 * ⚠ `onError` 만으로는 부족하다. 하이드레이션 **전에** 이미 실패한 이미지는 이벤트가
 *   지나간 뒤라 리스너에 걸리지 않는다 — 그래서 마운트 직후 `complete && naturalWidth === 0`
 *   을 한 번 직접 확인한다(브라우저가 "다 끝났는데 폭이 0" 이라고 말하면 그게 실패다).
 */

import { useEffect, useRef, useState } from 'react';

import styles from './flowers.module.css';

/**
 * ⚠ 컷별 예외 필터(`grade`)는 없앴다. 그 예외는 벚꽃 A안(우키요에 담청 하늘) 하나를 위한
 *   것이었는데, 벚꽃이 B안(비테 세트)으로 확정되면서 31종이 전부 크림 판면으로 모였다 —
 *   이제 톤 통일은 `.plateImg` 의 공통 필터 한 겹이 전부다(사용 규칙 2).
 */
interface FlowerPlateProps {
  src?: string;
  alt?: string;
}

export default function FlowerPlate({ src, alt }: FlowerPlateProps) {
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
    // eslint-disable-next-line @next/next/no-img-element -- 자체 호스팅 도판 1벌(폭 변형 없음). next/image 최적화는 도입하지 않았다(docs/illustration-assets.md).
    <img
      ref={ref}
      className={styles.plateImg}
      src={src}
      alt={alt ?? ''}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
