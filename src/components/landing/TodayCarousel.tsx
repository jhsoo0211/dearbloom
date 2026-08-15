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
 *
 * ── 카드 = 링크 (2026-08-15) ────────────────────────────────────────
 * 카드를 누르면 그 꽃의 도감(`/flowers/{id}`)으로 간다. 구현은 **스트레치 링크** 패턴이다:
 * 링크는 이름 블록 하나뿐이고, 그 `::after` 가 카드 전면을 덮는다(landing.css).
 *   · 그래서 링크 안에 버튼이 들어가는 **중첩 인터랙티브가 생기지 않는다** — "이 꽃의 분위기로
 *     바꾸기" 버튼은 DOM 상 링크의 형제이고, `z-index` 로 덮개 위에 떠 있을 뿐이다.
 *   · 탭 순서도 자연스럽다: 카드 링크 → (본문) → 분위기 버튼.
 *   · 드래그로 끝난 포인터는 `onClickCapture` 가 이미 막고 있어 링크에도 그대로 적용된다.
 *
 * ⚠ 예전에는 이름 블록이 **터치 첫 탭으로 티저를 펼치는 버튼**이었다. 카드가 링크가 된 이상
 *   그 자리를 두 가지로 쓸 수 없어 없앴고, 대신 호버가 없는 기기에서는 티저를 **처음부터
 *   보여 준다**(landing.css `@media (hover: none)`). 정보가 사라지지 않는 쪽으로 옮긴 것이다.
 */

import Link from 'next/link';
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
                {/*
                  카드 전면 덮개 링크. 버튼("이 꽃의 분위기로 바꾸기")의 **형제**라
                  중첩 인터랙티브가 아니다(landing.css `.db-card-hit`).
                  `draggable={false}` 는 데스크톱 드래그 스크롤이 네이티브 링크 드래그로
                  가로채이지 않게 한다 — 드래그로 끝난 클릭은 `onClickCapture` 가 막는다.
                */}
                <Link
                  className="db-card-hit"
                  href={`/flowers/${slide.flowerId}`}
                  prefetch={false}
                  draggable={false}
                  aria-label={`${slide.name} — 도감에서 보기`}
                />
                <div
                  className={
                    'db-card-media' +
                    // 밝은 배경 컷(라벤더·안개꽃·은방울꽃·제비꽃) — 스크림을 한 단 올려
                    // 사진 위 이름의 대비를 지킨다(§1.5g · docs/image-assets.md §주의 4).
                    (slide.image?.bright ? ' db-on-bright' : '')
                  }
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

                  {/* 이름 블록은 글자만 갖는다 — 클릭은 위의 덮개 링크가 받는다. */}
                  <h3 className="db-card-nameblock">
                    <span className="db-card-reveal">
                      <span className="db-card-name">{slide.name}</span>
                      <span className="db-card-latin">{slide.latin}</span>
                      <span className="db-card-teaser">{teaser}</span>
                      <span className="db-card-go" aria-hidden="true">
                        도감에서 보기
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </span>
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

                  {/* 꽃 칩 — §1.6b 칩 규격(44px·선택은 액센트 채움 하나로만).
                      예전의 색 점 표식은 "선택을 다른 표현으로 이중 표시"라 뺐다. */}
                  <button
                    type="button"
                    className="db-adopt"
                    aria-pressed={isGlobal}
                    onClick={() => onAdopt(slide)}
                  >
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
