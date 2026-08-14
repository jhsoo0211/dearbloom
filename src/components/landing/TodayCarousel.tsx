'use client';

/**
 * 오늘의 꽃 슬라이드 캐러셀 — design-spec §1.4c v3.3.
 *
 * 규칙(스펙 그대로):
 *  · 카탈로그 전종을 카드로 늘어놓고 **scroll-snap** 으로 넘긴다.
 *    모바일 터치 스와이프는 네이티브 스크롤, 데스크톱은 드래그 + 화살표 키.
 *  · 넘겨도 바뀌는 것은 **카드 내부뿐**이다 — 카드마다 `data-flower` 로 카테고리 색감을
 *    국소 적용한다. 전역 배경·내비·CTA 는 건드리지 않는다(슬라이드 부수효과 금지).
 *  · 전역 테마 변경은 카드 안의 명시적 버튼("이 꽃의 분위기로 바꾸기")으로만 일어난다.
 *  · reduced-motion 이면 스냅은 즉시 전환, 자동 넘김은 애초에 없다.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { SlideView } from './landing-data';

interface Props {
  slides: SlideView[];
  /** 지금 전역 테마가 쓰는 `data-flower` 값. 버튼의 눌림 상태를 가른다. */
  globalSlug: string;
  onAdopt: (slide: SlideView) => void;
}

function prefersReduce(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function TodayCarousel({ slides, globalSlug, onAdopt }: Props) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [edge, setEdge] = useState({ atStart: true, atEnd: false });
  /** 사진 위 강화 상태(터치 첫 탭 토글) — 한 번에 한 장만. */
  const [revealed, setRevealed] = useState<number | null>(null);

  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: 0 });
  const ticking = useRef(false);

  /**
   * 지금 맨 앞에 걸린 카드.
   * 스크롤이 끝까지 갔으면(더 밀 수 없으면) 마지막 카드를 활성으로 친다 —
   * 카드가 여러 장 보이는 데스크톱에서는 마지막 몇 장이 영영 맨 앞에 오지 못한다.
   */
  const readPosition = useCallback(() => {
    const track = trackRef.current;
    if (!track) return { index: 0, atStart: true, atEnd: false };
    const maxScroll = track.scrollWidth - track.clientWidth;
    const atStart = track.scrollLeft <= 1;
    const atEnd = track.scrollLeft >= maxScroll - 1;
    if (atEnd) return { index: track.children.length - 1, atStart, atEnd };

    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    Array.from(track.children).forEach((node, i) => {
      const distance = Math.abs((node as HTMLElement).offsetLeft - track.scrollLeft);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    return { index: best, atStart, atEnd };
  }, []);

  const goTo = useCallback(
    (target: number, smooth = true) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = Math.max(0, Math.min(slides.length - 1, target));
      const el = track.children[clamped] as HTMLElement | undefined;
      if (!el) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const left = Math.max(0, Math.min(maxScroll, el.offsetLeft));
      track.scrollTo({ left, behavior: smooth && !prefersReduce() ? 'smooth' : 'auto' });
    },
    [slides.length],
  );

  const handleScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      const next = readPosition();
      setIndex((previous) => (next.index === previous ? previous : next.index));
      setEdge((previous) =>
        previous.atStart === next.atStart && previous.atEnd === next.atEnd
          ? previous
          : { atStart: next.atStart, atEnd: next.atEnd },
      );
    });
  }, [readPosition]);

  /* ── 데스크톱 드래그 ──────────────────────────────────────────────
     터치는 네이티브 스크롤에 맡긴다(스와이프 제스처와 충돌 금지 · §1.5g). */
  const onPointerDown = (event: React.PointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== 'mouse') return;
    const track = trackRef.current;
    if (!track) return;
    drag.current = { active: true, startX: event.clientX, startLeft: track.scrollLeft, moved: 0 };
    track.classList.add('db-dragging');
  };

  const onPointerMove = (event: React.PointerEvent<HTMLUListElement>) => {
    const track = trackRef.current;
    if (!track || !drag.current.active) return;
    const dx = event.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    // 이미 시작된 텍스트 선택은 user-select 로 되돌릴 수 없다 — 드래그로 판정되는 순간 지운다.
    if (drag.current.moved > 4) window.getSelection()?.removeAllRanges();
    track.scrollLeft = drag.current.startLeft - dx;
  };

  const endDrag = () => {
    const track = trackRef.current;
    if (!track || !drag.current.active) return;
    drag.current.active = false;
    track.classList.remove('db-dragging');
    if (drag.current.moved > 6) goTo(readPosition().index);
  };

  /** 드래그로 끝난 포인터가 카드 안 버튼을 누르는 것을 막는다. */
  const onClickCapture = (event: React.MouseEvent<HTMLUListElement>) => {
    if (drag.current.moved > 6) {
      event.preventDefault();
      event.stopPropagation();
    }
    drag.current.moved = 0;
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goTo(slides.length - 1);
    }
  };

  // 리사이즈로 카드 폭이 바뀌면 스냅 위치가 어긋난다 — 활성 카드에 다시 붙인다.
  useEffect(() => {
    const onResize = () => goTo(index, false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [goTo, index]);

  const active = slides[index];

  return (
    <div className="db-carousel">
      <ul
        className="db-track"
        ref={trackRef}
        tabIndex={0}
        role="group"
        aria-roledescription="캐러셀"
        aria-label={`꽃 아카이브 ${slides.length}종 — 좌우로 밀거나 화살표 키로 넘겨보세요`}
        data-lenis-prevent
        onScroll={handleScroll}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
      >
        {slides.map((slide, i) => {
          const isRevealed = revealed === i;
          const isGlobal = slide.themeSlug === globalSlug;
          const teaser = slide.storyHook ?? slide.note ?? slide.meaning;
          return (
            <li
              className="db-slide"
              key={slide.flowerId}
              data-flower={slide.themeSlug}
              aria-roledescription="슬라이드"
              aria-label={`${i + 1} / ${slides.length} ${slide.name}`}
            >
              <article className="db-card">
                <div
                  className={`db-card-media${isRevealed ? ' db-revealed' : ''}`}
                  data-db-media
                >
                  {slide.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Unsplash 원격 CDN. next/image 최적화 없이 승인 URL 을 그대로 쓴다(docs/image-assets.md).
                    <img
                      src={slide.image.src}
                      alt={slide.image.alt}
                      width={1080}
                      height={1350}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      style={
                        slide.image.grade
                          ? ({ '--db-grade': slide.image.grade } as React.CSSProperties)
                          : undefined
                      }
                    />
                  ) : (
                    <span className="db-card-fallback" aria-hidden="true" />
                  )}

                  <span className="db-card-scrim" aria-hidden="true" />
                  <span className="db-card-boost" aria-hidden="true" />

                  <span className={`db-card-badge db-glass${slide.isToday ? ' db-today-badge' : ''}`}>
                    <span className="db-seal" aria-hidden="true" />
                    {slide.isToday ? '오늘의 꽃' : slide.categoryLabel}
                  </span>

                  {/* 작가 크레딧은 푸터 "Image credits" 에 일괄 표기한다(사진 위 10px 글자 금지). */}

                  <h3 className="db-card-nameblock">
                    <button
                      type="button"
                      className="db-card-reveal"
                      aria-expanded={isRevealed}
                      onClick={() => setRevealed(isRevealed ? null : i)}
                    >
                      <span className="db-card-name">{slide.name}</span>
                      <span className="db-card-latin">{slide.latin}</span>
                      <span className="db-card-teaser">{teaser}</span>
                    </button>
                  </h3>
                </div>

                <div className="db-card-body">
                  <p className="db-card-meaning">
                    <span className="db-q" aria-hidden="true">
                      “
                    </span>
                    {slide.meaning}
                    <span className="db-q" aria-hidden="true">
                      ”
                    </span>
                  </p>
                  <p>
                    <span className="db-src-badge">
                      <span className="db-seal" aria-hidden="true" />
                      {slide.sourceLabel}
                    </span>
                  </p>

                  {slide.storyHook ? (
                    <div className="db-card-story">
                      <span className="db-lab">꽃에 얽힌 설화</span>
                      <p>
                        <span className="db-story-title">{slide.storyTitle}</span> — {slide.storyHook}
                      </p>
                    </div>
                  ) : null}

                  {slide.occasions.length > 0 ? (
                    <div className="db-occasions">
                      <span className="db-lab">이런 날 건네보세요</span>
                      <ul>
                        {slide.occasions.map((occasion) => (
                          <li key={occasion}>{occasion}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {slide.petCaveat ? <p className="db-caveat">{slide.petCaveat}</p> : null}

                  <button
                    type="button"
                    className="db-adopt"
                    aria-pressed={isGlobal}
                    onClick={() => onAdopt(slide)}
                  >
                    <span className="db-dot" aria-hidden="true" />
                    {isGlobal
                      ? `${slide.categoryLabel} 분위기로 보는 중`
                      : '이 꽃의 분위기로 바꾸기'}
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      <div className="db-carousel-foot">
        <div className="db-arrows">
          <button
            type="button"
            className="db-arrow"
            aria-label="이전 꽃"
            disabled={edge.atStart}
            onClick={() => goTo(index - 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="db-arrow"
            aria-label="다음 꽃"
            disabled={edge.atEnd}
            onClick={() => goTo(index + 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* 카탈로그가 커지면 점이 줄바꿈되며 지저분해진다 — 12종을 넘기면 카운터로 바꾼다. */}
        {slides.length <= 12 ? (
          <div className="db-dots">
            {slides.map((slide, i) => (
              <button
                key={slide.flowerId}
                type="button"
                aria-label={`${slide.name} 보기`}
                aria-current={i === index}
                onClick={() => goTo(i)}
              >
                <i aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : (
          <p className="db-counter" aria-hidden="true">
            <span>{String(index + 1).padStart(2, '0')}</span> / {slides.length}
          </p>
        )}

        <p className="db-carousel-hint" aria-hidden="true">
          밀어서 다른 꽃 보기 · ← → 키로도 넘어가요
        </p>
        <p className="sr-only" aria-live="polite">
          {active ? `${index + 1}번째 꽃 ${active.name}` : ''}
        </p>
      </div>
    </div>
  );
}
