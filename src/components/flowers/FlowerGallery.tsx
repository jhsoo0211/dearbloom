'use client';

import { useCallback, useId, useRef, useState } from 'react';

import styles from './flowers.module.css';
import type { DetailPhoto } from './types';

/**
 * 도감 상세 히어로의 **실사 갤러리** — 같은 꽃의 컷 2~4장을 넘겨 본다.
 *
 * 왜 슬라이드인가(2026-08-16 사용자 요청): "같은 꽃이라도 색상이 여러 가지니까."
 * 흰 튤립 한 장은 튤립이 흰색이라고만 말한다. 크림·분홍이 옆에 서야 도감이
 * `content/flowers.csv` 의 `colors` 로 적어 둔 것을 **보여 준다.**
 *
 * ⚠ **첫 장은 언제나 대표컷이다**(`photosFor()` 가 구조로 보장한다 — 여기서 정렬하지 마라).
 *   랜딩 카드를 누르고 들어온 사람이 방금 본 그 사진이 먼저 서야 두 화면이 이어진다.
 *
 * ── 이 컴포넌트가 지키는 것 ──────────────────────────────────────────
 * ① **CLS 0.** 액자(`.shotFrame`)가 `aspect-ratio` 로 자리를 먼저 잡고 컷들은 그 안에
 *    겹쳐 눕는다. 라벨 줄도 비어 있을 때를 위해 높이를 미리 비워 둔다 — 변형 라벨이
 *    없는 컷으로 넘어갈 때 아래 것들이 밀려 올라가면 안 된다.
 * ② **크로스페이드가 성립하려면 요소가 처음부터 다 서 있어야 한다**(결과 화면
 *    `ResultView` 의 선례와 같은 문법이다). opacity 0 이던 칸이 1 이 되는 것이 전환이고,
 *    그 순간에 요소를 만들면 시작값이 곧 1 이라 전환이 없다.
 * ③ **받아 오는 시점은 미룬다**(`warmed`). 겹쳐 두는 것과 네 장을 한꺼번에 내려받는 것은
 *    다른 일이다. 첫 장만 즉시 받고, 넘어갈 때 그 장과 다음 장을 데운다. 갤러리에
 *    마우스가 얹히거나 포커스가 들어오면 그때 미리 한 장 데워 둔다(의도 감지).
 * ④ **JS 가 없어도 첫 장과 크레딧은 그대로 있다.** 버튼만 조용히 아무 일도 하지 않는다.
 * ⑤ reduced-motion 은 `globals.css` 가 전환을 0 으로 만든다 — 컷이 즉시 갈린다.
 */

/**
 * 이 자리의 실측 폭. `sizes` 가 없으면 브라우저는 `100vw` 로 가정해 언제나 가장 큰
 * 후보를 고른다(`photoSrcSet()` 주석) — 폰이 1600px 을 받는 낭비가 그래서 생긴다.
 *   · 880px 미만: 셸 좌우 여백(`--pad` 22px×2)을 뺀 화면 폭 전부
 *   · 880px 이상: 히어로 그리드의 왼쪽 칸(1.12fr / 2.12fr, 셸 최대 1120px 기준 ≈ 545px)
 */
const SIZES = '(max-width: 880px) calc(100vw - 44px), 570px';

/** 스와이프로 칠 최소 거리(px). 이보다 짧으면 탭·스크롤로 본다. */
const SWIPE_MIN = 44;

interface Props {
  photos: DetailPhoto[];
  /** 낭독기에 "무엇의 사진 몇 장인지" 알리는 데만 쓴다. */
  flowerName: string;
}

export default function FlowerGallery({ photos, flowerName }: Props) {
  const [index, setIndex] = useState(0);
  /**
   * `src` 를 실제로 건 컷들. 첫 장만 처음부터 들어 있고 나머지는 필요해질 때 들어온다.
   * 배열이 아니라 Set 인 이유는 "이미 데웠나"를 묻는 일밖에 없어서다.
   */
  const [warmed, setWarmed] = useState<ReadonlySet<number>>(() => new Set([0]));
  const touchX = useRef<number | null>(null);
  const headId = useId();

  const count = photos.length;

  const warm = useCallback((...wanted: number[]) => {
    setWarmed((prev) => {
      const next = new Set(prev);
      let grew = false;
      for (const n of wanted) {
        if (!next.has(n)) {
          next.add(n);
          grew = true;
        }
      }
      // 같은 Set 을 돌려주면 리렌더가 없다 — 마우스가 얹힐 때마다 그리지 않게.
      return grew ? next : prev;
    });
  }, []);

  /**
   * 컷 수가 적어(2~4장) **끝에서 되돌아온다.** 마지막 장에서 '다음'이 죽어 있으면
   * 넷 중 셋째 장에 선 사람은 첫 장으로 돌아가려고 '이전'을 두 번 눌러야 한다.
   */
  const go = useCallback(
    (step: number) => {
      if (count < 2) return;
      const next = (index + step + count) % count;
      setIndex(next);
      // 지금 장과 그 다음 장을 함께 데운다 — 연달아 넘기는 사람이 빈 액자를 보지 않게.
      warm(next, (next + 1) % count, (next - 1 + count) % count);
    },
    [count, index, warm],
  );

  const jump = useCallback(
    (next: number) => {
      setIndex(next);
      warm(next, (next + 1) % count);
    },
    [count, warm],
  );

  const current = photos[index];
  if (!current) return null;

  /*
    컷이 한 장뿐인 꽃은 넘길 것이 없다 — 컨트롤을 세우지 않는다. 지금은 32종 전부
    두 장 이상이지만, 새 꽃이 컷 하나로 먼저 들어올 수 있는 자리다.
  */
  const single = count < 2;

  return (
    <figure
      className={styles.shot}
      /* 마우스·포커스가 들어오면 다음 장을 미리 받아 둔다(누르기 전에 도착한다). */
      onMouseEnter={single ? undefined : () => warm((index + 1) % count)}
      onFocus={single ? undefined : () => warm((index + 1) % count)}
    >
      {/*
        라벨 줄은 **액자 위**에 둔다. 사진 위에 얹지 않는 것이 이 화면의 규칙이고
        (§1.5g — 도판·사진 위에 글자를 올리지 않는다), 그래야 스크림도 필요 없다.
        변형 라벨이 없는 컷을 위해 줄 높이를 비워 둔다 — 없다고 줄을 접으면 액자가 튄다.
      */}
      <p className={styles.shotLabel} id={headId}>
        {current.variant && <span className={styles.shotVariant}>{current.variant}</span>}
        {!single && (
          <span className={styles.shotCount}>
            {index + 1} / {count}
          </span>
        )}
      </p>

      <div
        className={styles.shotFrame}
        role={single ? undefined : 'group'}
        aria-roledescription={single ? undefined : '사진 갤러리'}
        aria-label={single ? undefined : `${flowerName} 사진 ${count}장`}
        /*
          ←→ 는 갤러리 안 어디에 포커스가 있어도 듣는다(버튼에서 올라온 이벤트를 받는다).
          컨트롤에 포커스를 준 사람이 굳이 버튼 사이를 Tab 으로 옮겨 다니지 않게 하려는 것.
        */
        onKeyDown={
          single
            ? undefined
            : (event) => {
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  go(1);
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  go(-1);
                }
              }
        }
        onTouchStart={
          single
            ? undefined
            : (event) => {
                touchX.current = event.touches[0]?.clientX ?? null;
              }
        }
        onTouchEnd={
          single
            ? undefined
            : (event) => {
                const from = touchX.current;
                touchX.current = null;
                const to = event.changedTouches[0]?.clientX;
                if (from == null || to == null) return;
                const dx = to - from;
                if (Math.abs(dx) < SWIPE_MIN) return;
                go(dx < 0 ? 1 : -1);
              }
        }
      >
        {photos.map((photo, n) => (
          /* eslint-disable-next-line @next/next/no-img-element -- 원격 CDN(Unsplash·Pexels). 승인 URL 을 그대로 쓴다(docs/image-assets.md — 핫링크가 권장 사용법). */
          <img
            key={photo.src}
            className={`${styles.shotImg} ${n === index ? styles.shotOn : ''}`}
            src={warmed.has(n) ? photo.src : undefined}
            srcSet={warmed.has(n) ? photo.srcSet : undefined}
            sizes={SIZES}
            /* 활성 컷만 이름을 갖는다 — 겹쳐 둔 나머지는 낭독기에 없는 것으로 친다. */
            alt={n === index ? photo.alt : ''}
            aria-hidden={n === index ? undefined : true}
            fetchPriority={n === 0 ? 'high' : 'low'}
            decoding="async"
          />
        ))}

        {!single && (
          <>
            <button
              type="button"
              className={`${styles.shotNav} ${styles.shotPrev}`}
              onClick={() => go(-1)}
              aria-label="이전 사진"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 6 8 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className={`${styles.shotNav} ${styles.shotNext}`}
              onClick={() => go(1)}
              aria-label="다음 사진"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m10 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      <figcaption className={styles.shotCredit}>
        {!single && (
          /*
            §1.6b 세그먼트 — pill 트랙 안의 토글. 점은 보기용이고 **누르는 면은 44×44** 라
            버튼 자체를 크게 두고 그 안에 작은 점을 그린다.
          */
          <span className={styles.shotDots} role="group" aria-label="사진 고르기">
            {photos.map((photo, n) => (
              <button
                key={photo.src}
                type="button"
                className={`${styles.shotDot} ${n === index ? styles.shotDotOn : ''}`}
                onClick={() => jump(n)}
                onMouseEnter={() => warm(n)}
                aria-label={
                  photo.variant ? `${n + 1}번째 사진 — ${photo.variant}` : `${n + 1}번째 사진`
                }
                aria-current={n === index ? 'true' : undefined}
              >
                <span aria-hidden="true" />
              </button>
            ))}
          </span>
        )}

        {/*
          크레딧은 '출처' 한 단어 뒤로 접어 둔다(2026-08-15 사용자 피드백 — 전문이 상시
          노출되면 화면이 크레딧에 먹힌다). 표기가 사라지는 게 아니라 클릭 한 번 뒤로 갈
          뿐이고, `<details>` 라 JS 없이 열린다. **컷을 넘기면 안의 한 줄도 함께 바뀐다** —
          펼쳐 둔 채로 넘겨도 지금 보고 있는 컷의 작가가 서 있다.
        */}
        <details className={styles.creditFold}>
          <summary className={styles.creditSum}>
            출처
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <span className={styles.creditText}>{current.credit}</span>
        </details>
      </figcaption>
    </figure>
  );
}
