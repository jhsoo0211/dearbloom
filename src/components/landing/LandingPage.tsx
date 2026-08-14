'use client';

/**
 * dearbloom 랜딩 — 나이트 보태니컬 아카이브.
 *
 * 확정 시안 `design/landing-v3/home.html` 을 React 로 옮기되, v3.3 확정 사항을 따른다:
 *  · 전역 테마는 **진입 시 1회**(오늘의 꽃 → 카테고리)로 정해지고 세션 중 저절로 바뀌지 않는다.
 *  · 오늘의 꽃 탐색은 슬라이드 캐러셀이며, 넘겨도 카드 안쪽만 바뀐다.
 *  · 전역 전환은 카드 안 "이 꽃의 분위기로 바꾸기" 버튼을 눌렀을 때만.
 *
 * 데이터(오늘의 꽃·꽃말·설화)는 서버에서 계산해 props 로 받는다 — 여기서 fs 를 만지지 않는다.
 */

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import TodayCarousel from './TodayCarousel';
import { SECTION_IMAGES, withParticle, type LandingData, type SlideView } from './landing-data';
import { useLandingMotion } from './useLandingMotion';
import './landing.css';

const EMERSON = {
  ko: '대지는 꽃으로 웃는다.',
  en: 'Earth laughs in flowers',
  caption: '랄프 월도 에머슨, 〈Hamatreya〉(1846)',
};

export default function LandingPage({ data }: { data: LandingData }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const gateButtonRef = useRef<HTMLButtonElement>(null);

  /** 전역 테마 — 진입 시 오늘의 꽃 카테고리. 명시적 액션으로만 바뀐다(§1.4c v3.3). */
  const [globalSlug, setGlobalSlug] = useState(data.themeSlug);
  const [entered, setEntered] = useState(false);
  const [gateReady, setGateReady] = useState(false);
  /** 게이트 로딩 바. 첫 프레임부터 조금 차 있는 편이 "멈춘 화면"으로 보이지 않는다. */
  const [gateProgress, setGateProgress] = useState(0.12);

  const motion = useLandingMotion(rootRef, entered);

  /* ── 전역 테마를 <html> 에도 반영 ─────────────────────────────────
     `.db-page` 만 바꾸면 body 배경(오버스크롤로 드러나는 면)이 어긋난다.
     레이아웃 파일은 건드리지 않고 런타임에만 덮어쓰며, 떠날 때 원래 값으로 돌려놓는다.
     ⚠ `<meta name="theme-color">` 는 손대지 않는다 — layout.tsx 의 viewport 가 만든
     **React 소유 노드**라 리렌더 때 값이 되돌아간다(실제로 되돌아가는 것을 확인했다).
     테마별 theme-color 가 필요하면 layout.tsx 에서 다뤄야 한다. */
  useEffect(() => {
    const root = document.documentElement;
    const previousFlower = root.getAttribute('data-flower');
    root.setAttribute('data-flower', globalSlug);
    return () => {
      if (previousFlower) root.setAttribute('data-flower', previousFlower);
      else root.removeAttribute('data-flower');
    };
  }, [globalSlug]);

  /* ── 스크롤 진행 바 · 내비 축소 ──────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = height > 0 ? Math.min(1, window.scrollY / height) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${ratio})`;
      document.body.classList.toggle('db-nav-compact', window.scrollY > 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.body.classList.remove('db-nav-compact');
    };
  }, []);

  /* ── 로딩 게이트 ──────────────────────────────────────────────────
     게이트 자체는 CSS(미디어 쿼리)가 띄운다. 여기서는 "언제 들어갈 수 있는지"와
     페일세이프만 다룬다. 모션을 끈 사용자에게는 게이트가 없으니 아무것도 하지 않는다. */
  const enter = useCallback(() => setEntered(true), []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // 게이트가 떠 있는 동안 뒤 페이지가 밀리지 않게 잠근다(CSS 로는 조상에 닿지 못한다).
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let done = 0;
    const step = () => {
      done += 1;
      setGateProgress(Math.min(1, done / 2));
      if (done >= 2) setGateReady(true);
    };

    const probe = new Image();
    probe.onload = step;
    probe.onerror = step;
    probe.src = window.matchMedia('(max-width:720px)').matches
      ? (data.hero.srcMobile ?? data.hero.src)
      : data.hero.src;

    if (document.fonts?.ready) void document.fonts.ready.then(step);
    else window.setTimeout(step, 400);

    const readyTimer = window.setTimeout(() => setGateReady(true), 2600);
    const failsafe = window.setTimeout(enter, 8000);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') enter();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(readyTimer);
      window.clearTimeout(failsafe);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [data.hero.src, data.hero.srcMobile, enter]);

  // 입장하면 스크롤 잠금을 푼다(게이트 효과의 정리는 언마운트 때만 돌기 때문).
  useEffect(() => {
    if (entered) document.body.style.overflow = '';
  }, [entered]);

  useEffect(() => {
    if (gateReady && !entered) gateButtonRef.current?.focus({ preventScroll: true });
  }, [gateReady, entered]);

  const adopt = useCallback((slide: SlideView) => setGlobalSlug(slide.themeSlug), []);

  const { today, hero } = data;
  const heroStyle = hero.grade
    ? ({ '--db-grade': hero.grade } as React.CSSProperties)
    : undefined;

  const pageClass = [
    'db-page',
    entered ? 'db-entered' : '',
    motion === 'ready' ? 'db-motion-ready' : '',
    motion === 'off' ? 'db-motion-off' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className={pageClass} data-flower={globalSlug} ref={rootRef}>
        {/* ═══ 로딩 게이트 ═══ */}
        <div className="db-gate" role="dialog" aria-modal="true" aria-labelledby="db-gate-title">
          <div className="db-gate-in">
            <p className="db-gate-over">Night Botanical Archive</p>
            <p className="db-gate-logo" id="db-gate-title">
              dearbloom
            </p>
            <p className="db-gate-sub">오늘의 꽃 아카이브를 여는 중이에요.</p>
            <div className="db-gate-bar" aria-hidden="true">
              <span style={{ transform: `scaleX(${gateProgress})` }} />
            </div>
            <button
              type="button"
              ref={gateButtonRef}
              className={`db-gate-btn${gateReady ? ' db-ready' : ''}`}
              onClick={enter}
            >
              들어가기
            </button>
          </div>
        </div>

        <div className="db-progress" aria-hidden="true">
          <span ref={progressRef} />
        </div>

        {/* ═══ 내비 ═══ */}
        <nav className="db-nav db-glass" aria-label="주요 메뉴" data-db-intro>
          <a className="db-brand" href="#db-hero" aria-label="dearbloom 홈">
            <svg className="db-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <g fill="currentColor">
                <path d="M12 2.2c2.55 1.85 3.82 3.98 3.82 6.4 0 2.33-1.27 4.18-3.82 5.55-2.55-1.37-3.82-3.22-3.82-5.55 0-2.42 1.27-4.55 3.82-6.4Z" />
                <path
                  d="M3.3 9.1c2.94-.5 5.28.14 7.03 1.92 1.62 1.65 2.02 3.74 1.2 6.26-2.86-.24-4.96-1.24-6.28-3.01C3.93 12.5 3.3 10.86 3.3 9.1Z"
                  opacity=".72"
                />
                <path
                  d="M20.7 9.1c-2.94-.5-5.28.14-7.03 1.92-1.62 1.65-2.02 3.74-1.2 6.26 2.86-.24 4.96-1.24 6.28-3.01 1.32-1.77 1.95-3.41 1.95-5.17Z"
                  opacity=".72"
                />
                <path d="M11.45 17.4h1.1V22h-1.1z" opacity=".45" />
              </g>
            </svg>
            <span className="db-wm">dearbloom</span>
          </a>

          <ul className="db-nav-links">
            <li>
              <a href="#db-today">오늘의 꽃</a>
            </li>
            <li>
              <a href="#db-trust">이야기</a>
            </li>
            <li>
              <a href="#db-start">시작하기</a>
            </li>
          </ul>

          <Link className="db-nav-cta" href="/recommend" prefetch={false}>
            추천 시작
          </Link>
        </nav>

        <main id="db-main">
          {/* ═══════════════ 히어로 ═══════════════ */}
          <section className="db-hero" id="db-hero" aria-labelledby="db-hero-h1">
            <div className="db-hero-media" aria-hidden="true">
              <picture>
                {hero.srcMobile ? (
                  <source media="(max-width:720px)" srcSet={hero.srcMobile} />
                ) : null}
                {/* Unsplash 승인 URL(docs/image-assets.md)을 그대로 쓴다 — next/image 리모트 최적화는 도입하지 않았다. */}
                <img
                  src={hero.src}
                  alt=""
                  fetchPriority="high"
                  decoding="async"
                  style={heroStyle}
                />
              </picture>
            </div>
            <div className="db-hero-scrim" aria-hidden="true" />
            <div className="db-hero-vig" aria-hidden="true" />

            <div className="db-shell db-hero-body">
              <div className="db-hero-top">
                <h1
                  className="db-hero-h1"
                  id="db-hero-h1"
                  aria-label="dearbloom — 하고 싶은 말부터 고르면, 꽃이 대신 말해드려요."
                >
                  <span className="db-hero-lead" data-db-intro data-db-split aria-hidden="true">
                    하고 싶은 말부터 고르면, 꽃이 대신 말해드려요.
                  </span>
                </h1>
              </div>

              <span className="db-logotype" aria-hidden="true" data-db-intro data-db-split>
                dearbloom
              </span>

              {/* 오늘의 꽃 요약 — 사진 위 텍스트라 유리 패널 안에 둔다(§1.5g) */}
              <div className="db-hero-card db-glass" data-db-intro>
                <span className="db-cap">오늘의 꽃 · {data.todayLabel}</span>
                <span className="db-hero-flower">{today.name}</span>
                <p className="db-hero-meaning">“{today.meaning}”</p>
                {today.petCaveat ? <p className="db-hero-caveat">{today.petCaveat}</p> : null}
              </div>

              <div className="db-hero-foot">
                <span className="db-scroll-hint" aria-hidden="true" data-db-intro>
                  <span className="db-bar" />
                  <span>scroll</span>
                </span>
                <p className="db-hero-note" data-db-intro>
                  관계와 상황만 알려주세요. 어울리는 꽃과 꽃말, 추천 이유, 진짜로 쓸 수 있는 멘트까지
                  45초 안에 골라드려요.
                </p>
                <div className="db-hero-acts" data-db-intro>
                  <Link
                    className="db-btn db-btn-ghost"
                    href="/recommend?intent=apology"
                    prefetch={false}
                  >
                    먼저 손 내밀고 싶을 때
                  </Link>
                  <Link
                    className="db-btn db-btn-ghost"
                    href="/recommend?intent=confession"
                    prefetch={false}
                  >
                    말로는 다 못 전할 때
                  </Link>
                  <Link
                    className="db-btn db-btn-primary"
                    href="/recommend"
                    prefetch={false}
                    data-db-magnetic
                  >
                    45초 만에 추천받기
                    <span className="db-arw" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════ 챕터 01 · 오늘의 꽃 ═══════════════ */}
          <section className="db-chapter db-today" id="db-today" aria-labelledby="db-today-title">
            <div className="db-shell">
              <div className="db-today-head">
                <p className="db-overline" data-db-reveal>
                  No.&nbsp;01 <span className="db-ko">오늘의 꽃</span>
                </p>
                <h2 className="db-today-title" id="db-today-title" data-db-split>
                  오늘 아카이브가 꺼내 온 한 송이, 그리고 나머지 이야기들.
                </h2>
                <p className="db-today-lede" data-db-reveal>
                  {data.todayLabel} 오늘의 꽃은 {withParticle(today.name, 'copula')}. 화면의 색도 이
                  꽃을 따라 {data.categoryLabel} 쪽으로 맞춰 두었어요. 옆으로 밀면 다른 꽃의 이야기가
                  이어집니다 — 카드 안만 바뀌고, 화면 전체는 그대로예요.
                </p>
              </div>

              <TodayCarousel slides={data.slides} globalSlug={globalSlug} onAdopt={adopt} />
            </div>
          </section>

          {/* ═══════════════ 챕터 02 · 신뢰 3요소 (§1.5h 개편) ═══════════════ */}
          <section className="db-chapter db-room" id="db-trust" aria-labelledby="db-trust-title">
            <div className="db-room-media" aria-hidden="true">
              <div
                className="db-media-bg"
                style={{ backgroundImage: `url("${SECTION_IMAGES.trust.src}"), var(--frame-fallback)` }}
              />
              <div className="db-media-scrim" />
            </div>

            <div className="db-room-flow">
              <div className="db-shell">
                <div className="db-room-head">
                  <p className="db-overline db-on-media" data-db-reveal>
                    No.&nbsp;02 <span className="db-ko">우리가 하는 일</span>
                  </p>
                  <h2 className="db-room-title" id="db-trust-title" data-db-split>
                    꽃을 고르는 일이 불안하지 않도록.
                  </h2>
                </div>

                <ol className="db-trust">
                  <li className="db-trust-row" data-db-trust>
                    <span className="db-num" aria-hidden="true">
                      01
                    </span>
                    <div>
                      <h3>이야기가 있는 꽃말</h3>
                      <p>같은 꽃도 시대와 나라마다 다른 이야기를 품어요. 그 갈래까지 들려드려요.</p>
                    </div>
                  </li>
                  <li className="db-trust-row" data-db-trust>
                    <span className="db-num" aria-hidden="true">
                      02
                    </span>
                    <div>
                      <h3>이런 날, 이 꽃</h3>
                      <p>
                        꽃말만 알려주고 끝내지 않아요. 어떤 날 건네면 좋은 꽃인지, 상황까지 함께
                        골라드려요.
                      </p>
                      {today.occasions.length > 0 ? (
                        <p className="db-eg">
                          {today.name} — {today.occasions.join(' · ')}
                        </p>
                      ) : null}
                    </div>
                  </li>
                  <li className="db-trust-row" data-db-trust>
                    <span className="db-num" aria-hidden="true">
                      03
                    </span>
                    <div>
                      <h3>바로 쓰는 멘트 3가지 톤</h3>
                      <p>담백하게, 다정하게, 진지하게. 복사해서 바로 보내세요.</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* ═══ 구분면 밴드 ═══ */}
          <section className="db-chapter db-band" aria-hidden="true">
            <div
              className="db-media-bg"
              style={{ backgroundImage: `url("${SECTION_IMAGES.band.src}"), var(--frame-fallback)` }}
            />
            <div className="db-media-scrim db-is-band" />
            <div className="db-band-in">
              <p className="db-lab">Night Botanical Archive</p>
              <p className="db-sub">밤에 자란 식물들의 기록 · 2026</p>
              <span className="db-rule" />
            </div>
          </section>

          {/* ═══════════════ 챕터 03 · 추천 예시 ═══════════════ */}
          <section
            className="db-chapter db-example"
            id="db-example"
            aria-labelledby="db-example-title"
          >
            <div
              className="db-media-bg"
              aria-hidden="true"
              style={{
                backgroundImage: `url("${SECTION_IMAGES.example.src}"), var(--frame-fallback)`,
              }}
            />
            <div className="db-media-scrim" aria-hidden="true" />

            <div className="db-shell">
              <p className="db-overline db-on-media" data-db-reveal>
                No.&nbsp;03 <span className="db-ko">추천 예시</span>
              </p>
              <h2 className="sr-only" id="db-example-title">
                추천 예시 — 약속을 잊은 연인에게
              </h2>
              <figure className="db-quote">
                <span className="db-mk" aria-hidden="true">
                  “
                </span>
                <p data-db-split>
                  약속을 잊은 연인에게 — 흰 튤립과 ‘변명 없이 사과할게’라는 첫 문장을 추천했어요.
                </p>
                <figcaption>dearbloom recommendation</figcaption>
              </figure>
            </div>
          </section>

          {/* ═══ 인용 밴드 · 꽃을 사랑한 문장 (§1.5e — 화면당 1개) ═══ */}
          <section className="db-chapter db-qband" aria-labelledby="db-qband-h">
            <div className="db-shell">
              <p className="db-overline" id="db-qband-h" data-db-reveal>
                꽃을 사랑한 문장
              </p>
              <figure className="db-qb" data-db-reveal>
                <blockquote>
                  <p className="db-qb-ko">“{EMERSON.ko}”</p>
                  <p className="db-qb-en" lang="en">
                    {EMERSON.en}
                  </p>
                </blockquote>
                <figcaption>{EMERSON.caption}</figcaption>
              </figure>
            </div>
          </section>

          {/* ═══════════════ 챕터 04 · 피날레 ═══════════════ */}
          <section className="db-chapter db-finale" id="db-start" aria-labelledby="db-start-title">
            <div
              className="db-media-bg"
              aria-hidden="true"
              style={{
                backgroundImage: `url("${SECTION_IMAGES.finale.src}"), var(--frame-fallback)`,
              }}
            />
            <div className="db-media-scrim" aria-hidden="true" />

            <div className="db-shell">
              <div className="db-finale-in">
                <p className="db-overline db-on-media" data-db-reveal>
                  No.&nbsp;04 <span className="db-ko">시작하기</span>
                </p>
                <h2 id="db-start-title" data-db-split>
                  하고 싶은 말부터 고르면, 꽃이 대신 말해드려요.
                </h2>
                <p className="db-lede" data-db-reveal>
                  관계와 상황만 알려주세요. 어울리는 꽃과 꽃말, 추천 이유, 진짜로 쓸 수 있는 멘트까지
                  45초 안에 골라드려요.
                </p>
                <div className="db-finale-acts" data-db-reveal>
                  <Link
                    className="db-btn db-btn-primary"
                    href="/recommend"
                    prefetch={false}
                    data-db-magnetic
                  >
                    45초 만에 추천받기
                    <span className="db-arw" aria-hidden="true">
                      →
                    </span>
                  </Link>
                  <Link
                    className="db-btn db-btn-ghost"
                    href="/recommend?intent=apology"
                    prefetch={false}
                  >
                    먼저 손 내밀고 싶을 때
                  </Link>
                  <Link
                    className="db-btn db-btn-ghost"
                    href="/recommend?intent=confession"
                    prefetch={false}
                  >
                    말로는 다 못 전할 때
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ═══════════════ 푸터 ═══════════════ */}
        <footer className="db-footer">
          <div className="db-shell">
            <div className="db-footer-top">
              <p className="db-disc">
                꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
                들려드려요.
              </p>
              <nav className="db-footer-links" aria-label="보조 메뉴">
                <a href="#db-today">오늘의 꽃</a>
                <a href="#db-trust">꽃에 얽힌 이야기</a>
                <Link href="/recommend?intent=apology" prefetch={false}>
                  화해의 꽃
                </Link>
                <Link href="/partners" prefetch={false}>
                  제휴 꽃집 안내
                </Link>
              </nav>
            </div>
            <div className="db-credits">
              <h2>Image credits</h2>
              <p>{data.credits.join(' · ')}</p>
              <p className="db-lic">
                Unsplash License · 상업적 사용 가능 · 출처 표기는 dearbloom 자체 운용 원칙입니다.
              </p>
            </div>
          </div>
        </footer>

        {/* 필름 그레인 */}
        <svg
          className="db-grain"
          aria-hidden="true"
          focusable="false"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <filter id="db-grain-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.82"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#db-grain-noise)" />
        </svg>
      </div>
    </>
  );
}
