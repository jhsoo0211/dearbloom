'use client';

/**
 * 결과 화면 맨 위의 3D 꽃 무대.
 *
 * three 는 `flowerScene.ts` 안에만 있고 여기서는 `await import()` 로 늦게 부른다 —
 * 첫 화면(질문)에 3D 코드가 실려 오지 않게 하려는 것이다. WebGL 이 없거나 초기화가
 * 실패하면 아무 일도 없었다는 듯 SVG 폴백이 그대로 남는다.
 */

import { useEffect, useMemo, useRef, useState } from 'react';

import FlowerFallback from './FlowerFallback';
import type { SceneHandle } from './flowerScene';
import type { FlowerForm } from './types';
import styles from './flow.module.css';

export interface ViewerFlower {
  form: FlowerForm;
  /** 지금 고른 색 칩의 hex. 바뀌면 3D 꽃잎 색이 부드럽게 옮겨간다. */
  colorHex: string;
  /** 림라이트·무대 색조에 쓰는 강조색. */
  rimHex: string;
  /** 무대 배경 색조(radial-gradient 의 마지막 색면). */
  stageTone: string;
  /** 폴백 SVG 의 접근성 이름. */
  alt: string;
}

export interface FlowerViewerProps {
  flowers: ViewerFlower[];
  activeIndex: number;
  /** 무대 우하단 태그: `01 — Safe choice`. */
  tag: string;
}

export default function FlowerViewer({ flowers, activeIndex, tag }: FlowerViewerProps) {
  const hostRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const [live, setLive] = useState(false);
  const [dragging, setDragging] = useState(false);

  const active = flowers[activeIndex] ?? flowers[0];

  // 씬은 한 번만 세운다. 색·활성 안은 손잡이로 바꾼다(리마운트하면 회전이 튄다).
  const shape = useMemo(() => flowers.map((f) => f.form).join('|'), [flowers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    let cancelled = false;
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    void (async () => {
      try {
        const scene = await import('./flowerScene');
        if (cancelled || !scene.webglAvailable()) return;
        const handle = scene.mountFlowerScene({
          canvas,
          host,
          flowers: flowers.map((f) => ({
            form: f.form,
            petalHex: f.colorHex,
            rimHex: f.rimHex,
          })),
          active: activeIndex,
          reduceMotion,
          onDragChange: setDragging,
        });
        if (cancelled) {
          handle.dispose();
          return;
        }
        handleRef.current = handle;
        setLive(true);
      } catch (error) {
        // 3D 는 곁들임이다 — 실패하면 폴백 일러스트로 조용히 물러난다.
        console.warn('3D 뷰어를 사용할 수 없어 일러스트를 대신 보여줍니다.', error);
      }
    })();

    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
      setLive(false);
    };
    // shape 이 같으면 같은 씬이다. activeIndex·색은 아래 effect 가 손잡이로 넘긴다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape]);

  useEffect(() => {
    handleRef.current?.setActive(activeIndex);
  }, [activeIndex]);

  const colorKey = flowers.map((f) => f.colorHex).join('|');
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    flowers.forEach((flower, index) => handle.setPetalColor(index, flower.colorHex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorKey, live]);

  const className = [styles.viewer, live ? styles.isLive : '', dragging ? styles.isDrag : '']
    .filter(Boolean)
    .join(' ');

  return (
    <section
      ref={hostRef}
      className={className}
      aria-label="추천한 꽃 3D 뷰어"
      style={{ ['--stage-tone' as string]: active?.stageTone }}
    >
      <span className={styles.stageBg} aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        role="img"
        aria-label={`${active?.alt ?? '추천한 꽃'}의 3차원 모델. 드래그하면 돌려 볼 수 있어요.`}
      />
      <div className={styles.viewerFallback}>
        <FlowerFallback
          form={active?.form ?? 'rose'}
          colorHex={active?.colorHex ?? '#F6F1E8'}
          label={`${active?.alt ?? '추천한 꽃'} 일러스트`}
        />
      </div>
      <span className={styles.viewerVig} aria-hidden="true" />
      <span className={styles.viewerScrim} aria-hidden="true" />
      <span className={styles.viewerTopscrim} aria-hidden="true" />
      <p className={styles.viewerHead}>
        <span className={styles.overline}>
          No.&nbsp;{String(activeIndex + 1).padStart(2, '0')}{' '}
          <span className={styles.ko}>추천 {flowers.length}안</span>
        </span>
      </p>
      <span className={styles.viewerTag}>{tag}</span>
      <span className={styles.viewerHint}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.4 12a8.4 8.4 0 1 1-2.7-6.2" />
          <path d="M20.8 3.4v4.6h-4.6" />
        </svg>
        드래그해서 돌려보세요
      </span>
    </section>
  );
}
