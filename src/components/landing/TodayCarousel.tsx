'use client';

/**
 * 오늘의 꽃 슬라이드 캐러셀 — design-spec §1.4c v3.3.
 *
 * 규칙(스펙 그대로):
 *  · 카탈로그 전종을 카드로 늘어놓고 **scroll-snap** 으로 넘긴다.
 *    모바일 터치 스와이프는 네이티브 스크롤, 데스크톱은 드래그 + 화살표 키.
 *  · 넘겨도 바뀌는 것은 **카드 내부뿐**이다 — 카드마다 `data-flower` 로 카테고리 색감을
 *    국소 적용한다. 전역 배경·내비·CTA 는 건드리지 않는다(슬라이드 부수효과 금지).
 *  · reduced-motion 이면 스냅은 즉시 전환, 자동 넘김은 애초에 없다.
 *
 * ── 카드에는 컨트롤이 없다 (§1.4c v3.4 — 2026-08-16) ────────────────
 * 예전에는 카드마다 "이 꽃의 분위기로 바꾸기" 버튼이 있어 거기서 전역 테마가 바뀌었다.
 * 카드가 32장이라 **같은 컨트롤이 32번 반복**됐고(§1.6b 통합 취지 위반), 전환은 리드 아래
 * "화면의 빛깔" 선택기 한 줄로 옮겼다(`LandingPage`). 여기 남은 인터랙션은 도감 링크뿐이다.
 *
 * ── 카드 = 링크 (2026-08-15) ────────────────────────────────────────
 * 카드를 누르면 그 꽃의 도감(`/flowers/{id}`)으로 간다. 구현은 **덮개 링크** 패턴이다:
 * 링크는 빈 `<a>` 하나이고 절대 배치로 카드 전면을 덮는다(landing.css `.db-card-hit`).
 *   · 버튼이 사라진 지금도 카드를 통째로 `<a>` 로 감싸지 않는다 — 감싸면 링크의 접근 가능한
 *     이름이 카드 본문 전체(꽃말·이야기 티저·상황 예시…)가 된다. 덮개 링크는 이름을
 *     `aria-label` 한 줄로 붙들어 둔다.
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
}

function prefersReduce(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function TodayCarousel({ slides }: Props) {
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

  /** 드래그로 끝난 포인터가 카드 링크를 여는 것을 막는다. */
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

  /* ── 티저 칸 높이 실측 (성능 리뷰 P1-9) ────────────────────────────
     티저 펼침은 `max-height` 애니메이션이었다 — 매 프레임 레이아웃을 다시 잡는 종류다.
     지금은 이름 블록을 티저 높이만큼 아래로 밀어 두고(`--db-teaser-h`), 펼칠 때 그
     이동만 되돌린다(transform). 그러려면 **그 높이가 정확해야** 한다: 티저는 카드마다
     1~3줄로 길이가 다르고, 카드 폭·폰트에 따라 줄 수도 바뀐다. CSS 만으로는 알 수 없다.

     그래서 여기서 잰다. 순서가 중요하다 — **읽기를 전부 끝낸 뒤 쓴다**(읽기·쓰기를
     번갈아 하면 카드 수만큼 레이아웃이 강제된다). 다시 재는 때는 세 가지뿐이다:
     최초 마운트 · 리사이즈(줄 수가 바뀐다) · 웹폰트 로드 완료(글자 높이가 바뀐다). */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const sync = () => {
      const cards = Array.from(track.querySelectorAll<HTMLElement>('.db-slide'));
      const heights = cards.map(
        (card) => card.querySelector<HTMLElement>('.db-card-teaser-in')?.offsetHeight ?? 0,
      );
      cards.forEach((card, i) => {
        if (heights[i] > 0) card.style.setProperty('--db-teaser-h', `${heights[i]}px`);
      });
    };
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(sync);
    };

    schedule();
    if (document.fonts?.ready) void document.fonts.ready.then(schedule);
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
    };
  }, [slides]);

  const active = slides[index];

  return (
    /*
      캐러셀의 역할(`group` + `aria-roledescription`)은 **바깥 div** 가 갖는다.
      예전에는 `<ul>` 이 그것을 달고 있었는데, ARIA 역할은 암시 역할을 덮어쓰므로
      `list` 가 사라지고 자식 `<li>` 32장이 통째로 "리스트 밖 listitem" 이 됐다
      (axe serious ×32 · 접근성 리뷰 P1-4). 이제 `<ul>` 은 그냥 목록이다.
    */
    <div
      className="db-carousel"
      role="group"
      aria-roledescription="캐러셀"
      aria-label={`꽃 아카이브 ${slides.length}종 — 좌우로 밀거나 화살표 키로 넘겨보세요`}
    >
      <ul
        className="db-track"
        ref={trackRef}
        tabIndex={0}
        aria-label={`꽃 카드 ${slides.length}장`}
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
                  카드 전면 덮개 링크(landing.css `.db-card-hit`) — 카드의 유일한 컨트롤이다.
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
                      /* 카드는 380px(좁은 화면 340px)로 뜬다 — `sizes` 가 없으면 브라우저가
                         100vw 로 가정해 늘 최대 폭을 받는다(성능 리뷰 P1-5). */
                      srcSet={slide.image.srcSet}
                      sizes="(max-width: 640px) 88vw, (max-width: 1180px) 46vw, 380px"
                      alt={slide.image.alt}
                      width={1080}
                      height={1350}
                      /* 32장 전부 lazy 다. 0번만 eager 였는데 그 카드도 **폴드 밖**이라,
                         첫 화면에 필요한 히어로보다 먼저 대역폭을 가져갔다(성능 리뷰 P1-6). */
                      loading="lazy"
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
                      <span className="db-card-teaser">
                        {/* 안쪽 span 은 높이 실측용이다 — 아래 useEffect 주석 참고. */}
                        <span className="db-card-teaser-in">{teaser}</span>
                      </span>
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
                      {/* "설화"는 story_type 라벨 자리에만 쓴다 — 화면 용어는 "이야기"로
                          통일한다(워딩 리뷰 확정). */}
                      <span className="db-lab">꽃에 얽힌 이야기</span>
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
