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
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import TodayCarousel from './TodayCarousel';
import { SECTION_IMAGES, withParticle, type LandingData, type SlideView } from './landing-data';
import { useLandingMotion } from './useLandingMotion';
import './landing.css';

/**
 * 인용 밴드(§1.5e — 화면당 1개). 에머슨 〈Hamatreya〉를 『시경』으로 교체했다.
 *
 * 봄날 진수·유수 강가에서 남녀가 어울려 놀다가 헤어질 때 작약을 꺾어 건네는 장면으로,
 * **기록에 남은 가장 오래된 '꽃 선물' 장면 중 하나**다. 서비스가 하는 일 그 자체가
 * 기원전 문헌에 이미 적혀 있다는 것이 이 자리를 에머슨보다 잘 채운다.
 *
 * ⚠ **`content/quotes.csv` 의 `q-lit-peony-shijing` 행과 같은 내용이다.** 랜딩은 서버
 * 데이터를 타지 않는 정적 페이지라 상수로 두었으니, 그 행을 고치면 여기도 같이 고칠 것.
 * (`text_ko` = ko, `text_original` 의 마지막 구 = hanja, `source_title`·`era` = caption)
 */
const SHIJING = {
  ko: '사내와 아가씨가 / 서로 웃고 놀리다가 / 그에게 작약을 건넨다.',
  hanja: '贈之以勺藥',
  caption: '『시경』 정풍 「진유」, 기원전 7세기경',
  note: '기록에 남은 가장 오래된 꽃 선물의 장면이에요.',
};

/* ═══ 로딩 게이트 — 세션당 1회 (#21) ═══════════════════════════════════
   "들어가기"는 첫 방문의 의식(儀式)이지, 홈에 돌아올 때마다 치를 통행세가 아니다.
   추천을 받고 뒤로 가기로 돌아온 사람에게 다시 로고와 진행 바를 보여 주면 그건
   분위기가 아니라 벽이다. 그래서 **한 세션에 한 번만** 세운다.

   기억은 `sessionStorage` 다(탭을 닫으면 잊는다 — 다음 방문에는 다시 첫 방문이다).
   그런데 그 값을 **언제** 읽느냐가 이 문제의 전부다. 세 경로가 각각 다르다:

     ① 첫 로드          — 서버 HTML 에 게이트가 들어 있고 브라우저가 먼저 그린다.
                          React 가 아무리 빨라도 이미 한 프레임 번쩍인 뒤다.
                          → **부트 스크립트**(아래 `GATE_BOOT`)가 파싱 중에 막는다.
     ② 하이드레이션     — 서버가 그린 것과 다르게 그리면 하이드레이션이 깨진다.
                          → `useSyncExternalStore` 의 서버 스냅샷이 항상 `false` 라
                            첫 렌더는 서버와 같고, 그 직후 실제 값으로 다시 그린다.
     ③ 클라 네비게이션  — 뒤로 가기로 돌아오면 서버 HTML 도 부트 스크립트도 없다.
                          → 이때 `useSyncExternalStore` 는 하이드레이션이 아니므로
                            처음부터 실제 값을 쓴다. 게이트는 렌더된 적조차 없다.

   ⚠ 부트 스크립트는 **루트 엘리먼트를 건드리지 않는다.** `<html>` 에 data 속성을 붙이는
     흔한 수법을 먼저 썼다가 React 19 가 그대로 잡아냈다("some attributes of the server
     rendered HTML didn't match the client properties" — `data-db-gate` 를 지목한다).
     레이아웃이 소유한 노드라 React 가 속성 전부를 견주기 때문이다. 그래서 아무도 소유하지
     않은 것을 만든다 — `<head>` 에 넣는 **스타일 규칙 한 줄**. 렌더 트리 밖이라 비교 대상이
     아니고, 하는 일은 속성판과 똑같다(첫 프레임부터 게이트가 없다).
   ⚠ 들어간 뒤 이 규칙을 런타임에 넣지는 않는다 — 넣으면 `display:none` 이 즉시 먹어
     "게이트가 사라지는" 페이드(0.55s)가 잘린다. 그 자리는 `.db-entered` 가 맡는다. */

const GATE_KEY = 'dearbloom.gate.entered';

/**
 * 게이트보다 먼저 실행돼 게이트를 지우는 한 줄.
 * `!important` 인 이유: 미디어 쿼리 안의 `.db-page .db-gate{display:grid}` 보다 뒤에
 * 오는지 보장할 수 없는 자리(런타임 삽입)라, 순서에 기대지 않고 이긴다.
 */
const GATE_BOOT =
  `try{if(sessionStorage.getItem('${GATE_KEY}')==='1'){` +
  `var s=document.createElement('style');` +
  `s.setAttribute('data-db-gate','skip');` +
  `s.textContent='.db-gate{display:none!important}';` +
  `document.head.appendChild(s)}}catch(e){}`;

/**
 * 세션 기억의 캐시. sessionStorage 를 못 쓰는 환경(사생활 보호 모드 등)에서도
 * 최소한 이 탭 안에서는 기억한다 — 저장이 막혔다고 게이트가 안 닫히면 안 된다.
 */
let gateMemo: boolean | undefined;
const gateListeners = new Set<() => void>();

function subscribeGate(onChange: () => void): () => void {
  gateListeners.add(onChange);
  return () => {
    gateListeners.delete(onChange);
  };
}

function gateSnapshot(): boolean {
  if (gateMemo === undefined) {
    try {
      gateMemo = window.sessionStorage.getItem(GATE_KEY) === '1';
    } catch {
      gateMemo = false;
    }
  }
  return gateMemo;
}

/** 서버에는 세션이 없다. 항상 "아직 안 들어왔다" — 그래야 첫 렌더가 서버 HTML 과 같다. */
function gateServerSnapshot(): boolean {
  return false;
}

function markGateEntered() {
  gateMemo = true;
  try {
    window.sessionStorage.setItem(GATE_KEY, '1');
  } catch {
    // 저장이 막힌 환경 — 위 캐시가 이 탭 동안 대신 기억한다.
  }
  for (const listener of gateListeners) listener();
}

export default function LandingPage({ data }: { data: LandingData }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const gateButtonRef = useRef<HTMLButtonElement>(null);

  /** 전역 테마 — 진입 시 오늘의 꽃 카테고리. 명시적 액션으로만 바뀐다(§1.4c v3.3). */
  const [globalSlug, setGlobalSlug] = useState(data.themeSlug);
  /** 이 세션에서 이미 들어왔는가(#21). 서버·하이드레이션에서는 늘 false 다 — 위 주석 참고. */
  const entered = useSyncExternalStore(subscribeGate, gateSnapshot, gateServerSnapshot);
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
  const enter = useCallback(() => markGateEntered(), []);

  useEffect(() => {
    /* #21 — 이미 지난 세션이면 게이트 자체가 없다. 그러니 **잠금도 타이머도 걸지 않는다.**
       (여기서 일찍 물러나지 않으면 게이트 없는 화면에서 body 스크롤만 잠긴다.) */
    if (entered) return;
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
    /* `entered` 가 deps 에 있는 것이 잠금 해제의 전부다 — 들어가는 순간 위 정리 함수가
       돌아 원래 overflow 로 되돌리고, 다시 실행된 이펙트는 첫 줄에서 물러난다. */
  }, [entered, data.hero.src, data.hero.srcMobile, enter]);

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
      {/*
        #21 — 게이트보다 **먼저** 파싱돼야 하는 한 줄. 인라인 스크립트라 파서가 여기서
        멈추고 실행하므로, 아래 `.db-gate` 는 만들어지기 전에 이미 숨겨질 운명이 된다.
        (마운트를 기다리면 이미 한 프레임 그린 뒤다 — 그게 "번쩍임"의 정체다.)
      */}
      <script dangerouslySetInnerHTML={{ __html: GATE_BOOT }} />

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
              <a href="/stories">이야기</a>
            </li>
            <li>
              <Link href="/flowers" prefetch={false}>도감</Link>
            </li>
            {/*
              #20 — `여러 명에게`(/groups)는 내비에서 내렸다. 첫 화면에 진입이 둘이면
              "추천 시작"과 나란히 놓인 그 항목이 별개 서비스처럼 읽혔다. 페이지는
              그대로 살아 있고, 갈림길은 질문 1번 위("몇 분께 드리나요?")로 옮겼다 —
              한 명/여러 명은 랜딩에서 고를 일이 아니라 질문의 첫 줄이다.
            */}
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
                {/* 보조 진입 2종은 §1.5d 16차에서 폐지됐다 — 주 CTA 하나로 직행한다.
                    모드 구분(화해·고백 등)은 플로우 안의 모드 카드가 맡는다. */}
                <div className="db-hero-acts" data-db-intro>
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
                {/* §1.5d — 스펙 언어(카드 안만 바뀌고…) 금지. 테마 이름도 여기서는 부르지 않는다
                    (카드가 이미 말해 준다). 리드는 세 문장 리듬: 오늘의 꽃 → 화면 분위기 → 넘기기 안내. */}
                <h2 className="db-today-title" id="db-today-title" data-db-split>
                  오늘 꺼내 온 한 송이, 그리고 이어지는 이야기들
                </h2>
                <p className="db-today-lede" data-db-reveal>
                  {data.todayLabel}, 오늘의 꽃은 {withParticle(today.name, 'copula')}. 화면의 빛깔도
                  이 꽃의 분위기를 닮아 있어요. 카드를 옆으로 넘기면 다른 꽃들의 이야기가 이어져요.
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
                추천 예시 — 오래 고마웠던 친구에게
              </h2>
              {/* §1.5d 16차 확정 문구. 이전 사과 예시(“약속을 잊은 연인에게…”)는 폐기됐다. */}
              <figure className="db-quote">
                <span className="db-mk" aria-hidden="true">
                  “
                </span>
                <p data-db-split>
                  오래 고마웠던 친구에게 — 프리지아와 ‘고맙다는 말, 너무 오래 미뤘지’라는 첫 문장을
                  추천했어요.
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
                  {/* 세 행을 줄로 끊어야 강가의 장면이 장면으로 읽힌다 */}
                  <p className="db-qb-ko">
                    {SHIJING.ko.split(' / ').map((line, index) => (
                      <span className="db-qb-line" key={line}>
                        {index === 0 ? '“' : null}
                        {line}
                        {index === 2 ? '”' : null}
                      </span>
                    ))}
                  </p>
                  <p className="db-qb-han" lang="zh-Hant">
                    {SHIJING.hanja}
                  </p>
                </blockquote>
                <figcaption>{SHIJING.caption}</figcaption>
                <p className="db-qb-note">{SHIJING.note}</p>
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
                {/* 히어로와 같은 이유로 보조 진입 없음(§1.5d 16차) — 마지막 화면도 주 CTA 하나. */}
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
                <a href="/stories">꽃에 얽힌 이야기</a>
                <Link href="/recommend?intent=apology" prefetch={false}>
                  화해의 꽃
                </Link>
                <Link href="/partners" prefetch={false}>
                  제휴 꽃집 안내
                </Link>
              </nav>
            </div>
            {/*
              이미지 크레딧 — **한 번의 클릭 뒤로** 옮겼다(2026-08-15 사용자 피드백:
              "Photo: … / Unsplash" 가 서른 줄 넘게 깔려 푸터가 크레딧 밴드가 돼 버렸다).
              ⚠ 표기가 사라진 게 아니다. `<details>` 라 JS 없이도 열리고, 검색엔진·스크린리더는
                접힌 내용까지 읽는다 — Unsplash License 의 표기 권고는 그대로 지켜진다.
            */}
            <div className="db-credits">
              <h2 className="sr-only">Image credits</h2>
              <details className="db-credit-fold">
                <summary className="db-credit-sum">
                  <span>사진 출처 보기</span>
                  <span className="db-credit-n">{data.credits.length}</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <p>{data.credits.join(' · ')}</p>
                <p className="db-lic">
                  Unsplash License · 상업적 사용 가능 · 출처 표기는 dearbloom 자체 운용 원칙입니다.
                </p>
              </details>
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
