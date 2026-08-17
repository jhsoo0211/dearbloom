'use client';

/**
 * dearbloom 랜딩 — 나이트 보태니컬 아카이브.
 *
 * 확정 시안 `design/landing-v3/home.html` 을 React 로 옮기되, v3.3 확정 사항을 따른다:
 *  · 전역 테마는 **진입 시 1회**(오늘의 꽃 → 카테고리)로 정해지고 세션 중 저절로 바뀌지 않는다.
 *  · 오늘의 꽃 탐색은 슬라이드 캐러셀이며, 넘겨도 카드 안쪽만 바뀐다.
 *  · 전역 전환은 리드 아래 "화면의 빛깔" 선택기 한 줄로만 일어난다(§1.4c v3.4 —
 *    카드마다 있던 반복 버튼은 폐지했다).
 *  · 그렇게 고른 빛깔은 **세션이 기억한다**(§1.4c v3.4 · 2026-08-16). 도감을 다녀와도
 *    남아 있고, 저장값이 있으면 오늘의 꽃 카테고리 대신 그 값으로 시작한다.
 *
 * 데이터(오늘의 꽃·꽃말·설화)는 서버에서 계산해 props 로 받는다 — 여기서 fs 를 만지지 않는다.
 */

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { STORY_CATEGORIES } from '@/components/stories/categories';
import type { FlowerThemeSlug } from '@/lib/theme/flowers';

import MobileNavSheet from './MobileNavSheet';
import TodayCarousel from './TodayCarousel';
import { lockBodyScroll } from './body-scroll-lock';
import {
  BIRTH_FINDER_HREF,
  CATEGORY_THEMES,
  SECTION_IMAGES,
  type LandingData,
} from './landing-data';
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

/* ── 모션 선호 (접근성 리뷰 P0-1) ────────────────────────────────────
   게이트는 **CSS 가** 띄운다 — `@media (prefers-reduced-motion: no-preference)` 안에서만
   `display: grid` 다. 그래서 "게이트가 지금 떠 있는가"를 JS 쪽에서도 알아야 뒤 본문을
   `inert` 로 잠글 수 있다(모션을 끈 사용자에게 잠그면 게이트 없는 화면이 통째로 죽는다).

   상태(useState + 이펙트) 대신 **외부 저장소 구독**으로 읽는다: 미디어 쿼리는 React 밖의
   값이고, 이렇게 하면 렌더 중에 곧바로 파생값을 쓸 수 있어 이펙트에서 setState 하는
   캐스케이드 렌더가 없다. 서버 스냅샷은 `false` — 게이트가 있는 쪽이 서버 HTML 과 같다. */
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReduceMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function reduceMotionSnapshot(): boolean {
  return window.matchMedia(REDUCE_QUERY).matches;
}

function reduceMotionServerSnapshot(): boolean {
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

/* ═══ 화면의 빛깔 기억 — 세션당 1키 (§1.4c v3.4) ═══════════════════════
   빛깔은 **고른 사람이 있는 선택**이다. 그런데 그 선택이 도감 한 번 다녀오면 사라졌다 —
   `useState` 로만 들고 있었으니 랜딩이 언마운트되는 순간 오늘의 꽃 카테고리로 되돌아갔다.
   고른 것이 말없이 되돌려지면 그건 선택이 아니라 장식이다.

   기억은 게이트와 **같은 문법**이다(`sessionStorage` + `useSyncExternalStore`):
     · 서버 스냅샷이 늘 `null` 이라 첫 렌더가 서버 HTML 과 같다 → 하이드레이션 경고 0.
     · 뒤로 가기·클라 네비게이션으로 돌아올 때는 하이드레이션이 아니므로 처음부터 실제 값.
     · 탭을 닫으면 잊는다 — 다음 방문은 다시 그날의 오늘의 꽃로 시작한다.

   ⚠ 게이트와 달리 **부트 스크립트를 두지 않는다.** 게이트는 `<head>` 스타일 한 줄로
     "아무도 소유하지 않은 것"을 만들 수 있었지만, 빛깔은 `<html data-flower>` 를 만져야
     하고 그 속성은 layout.tsx 가 소유한 노드에 있다 — React 19 가 그대로 잡아낸다
     (위 게이트 주석의 실패 사례와 같은 자리). 테마는 지금도 마운트 뒤 이펙트가 입히므로
     첫 프레임 기준이 달라지지 않는다.
   ⚠ 선택 해제라는 개념은 없다(다섯 중 하나는 늘 눌려 있다). 그래서 저장값이 있으면
     **무조건 이긴다** — "오늘의 꽃 따라가기"는 저장 전의 기본값이지 되돌아갈 상태가 아니다. */

const TINT_KEY = 'dearbloom.tint';

/** 저장값은 남이 넣을 수도 있는 문자열이다 — 아는 slug 다섯 개만 통과시킨다. */
const TINT_SLUGS = new Set<string>(
  Object.values(CATEGORY_THEMES).map((theme) => theme.slug),
);

/** 게이트와 같은 이유의 캐시 — 저장이 막힌 환경에서도 이 탭 안에서는 기억한다. */
let tintMemo: FlowerThemeSlug | null | undefined;
const tintListeners = new Set<() => void>();

function subscribeTint(onChange: () => void): () => void {
  tintListeners.add(onChange);
  return () => {
    tintListeners.delete(onChange);
  };
}

function tintSnapshot(): FlowerThemeSlug | null {
  if (tintMemo === undefined) {
    try {
      const saved = window.sessionStorage.getItem(TINT_KEY);
      tintMemo = saved && TINT_SLUGS.has(saved) ? (saved as FlowerThemeSlug) : null;
    } catch {
      tintMemo = null;
    }
  }
  return tintMemo;
}

/** 서버에는 세션이 없다. 항상 "아직 안 골랐다" — 그래야 첫 렌더가 서버 HTML 과 같다. */
function tintServerSnapshot(): FlowerThemeSlug | null {
  return null;
}

function rememberTint(slug: FlowerThemeSlug) {
  tintMemo = slug;
  try {
    window.sessionStorage.setItem(TINT_KEY, slug);
  } catch {
    // 저장이 막힌 환경 — 위 캐시가 이 탭 동안 대신 기억한다.
  }
  for (const listener of tintListeners) listener();
}

/**
 * 색면 배경 한 장의 스타일.
 *
 * `background-image` 를 여기서 직접 쓰지 않고 **변수 두 개**만 넘긴다 — 배경 이미지는
 * `srcset` 이 없어서 폭을 CSS 가 골라야 하기 때문이다(landing.css `.db-media-bg`).
 * 폰이 1920 짜리 색면을 받던 것을 끊는 자리다(성능 리뷰 P1-4).
 */
function mediaBg(image: { src: string; srcMobile: string }): React.CSSProperties {
  return {
    '--db-bg-lg': `url("${image.src}")`,
    '--db-bg-sm': `url("${image.srcMobile}")`,
  } as React.CSSProperties;
}

export default function LandingPage({ data }: { data: LandingData }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);
  const gateButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * 전역 테마 — 명시적 액션으로만 바뀐다(§1.4c v3.3).
   *
   * 상태를 따로 들지 않는다. 세션에 고른 빛깔이 있으면 그것이고, 없으면 오늘의 꽃
   * 카테고리다 — 값이 한 곳(`sessionStorage` + 그 캐시)에만 있으니 둘이 어긋날 자리가 없다.
   */
  const savedTint = useSyncExternalStore(subscribeTint, tintSnapshot, tintServerSnapshot);
  const globalSlug = savedTint ?? data.themeSlug;
  /** 이 세션에서 이미 들어왔는가(#21). 서버·하이드레이션에서는 늘 false 다 — 위 주석 참고. */
  const entered = useSyncExternalStore(subscribeGate, gateSnapshot, gateServerSnapshot);
  const [gateReady, setGateReady] = useState(false);
  const reduceMotion = useSyncExternalStore(
    subscribeReduceMotion,
    reduceMotionSnapshot,
    reduceMotionServerSnapshot,
  );
  /**
   * 게이트가 **실제로 떠 있는가**(접근성 리뷰 P0-1).
   *
   * `!entered` 만으로는 모자란다 — 모션을 끈 사용자에게는 CSS 가 게이트를 아예 띄우지
   * 않으므로, 그때 본문을 `inert` 로 잠그면 **게이트 없는 화면이 통째로 죽는다.**
   * 두 조건이 함께여야 "지금 화면에 게이트가 있다"가 된다.
   */
  const gateOpen = !entered && !reduceMotion;
  /** 게이트 로딩 바. 첫 프레임부터 조금 차 있는 편이 "멈춘 화면"으로 보이지 않는다. */
  const [gateProgress, setGateProgress] = useState(0.12);

  /* ── 모바일 내비 메뉴 (§1.6c) ──────────────────────────────────────
     860px 아래에서 내비 링크가 숨는 자리를 메우는 전체 목차. 시트 자체는
     `MobileNavSheet` 가 그리고, 여기서는 **뒤 화면의 책임**만 진다:
       · 열려 있는 동안 nav·main·footer 에 `inert` (게이트와 같은 문법)
       · 닫히면 연 버튼으로 포커스 복귀
     ⚠ 게이트가 떠 있는 동안에는 내비가 이미 `inert` 라 이 메뉴는 열릴 수 없다 —
       두 대화상자가 겹칠 자리가 애초에 없다. */
  const [menuOpen, setMenuOpen] = useState(false);
  const menuUsed = useRef(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  /* 포커스 복귀는 **이펙트에서** 해야 한다. 닫기 핸들러 안에서 곧바로 `focus()` 하면
     그 시점의 내비는 아직 `inert` 라(리렌더 전) 포커스가 어디에도 앉지 않는다.
     React 는 DOM 을 커밋한 뒤 이펙트를 돌리므로 여기서는 이미 `inert` 가 걷혀 있다. */
  useEffect(() => {
    if (menuOpen) {
      menuUsed.current = true;
      return;
    }
    if (!menuUsed.current) return;
    menuUsed.current = false;
    menuButtonRef.current?.focus({ preventScroll: true });
  }, [menuOpen]);

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

  /* ── 스크롤 진행 바 · 내비 축소 ────────────────────────────────────
     ⚠ `scrollHeight` 를 **매 프레임 읽지 않는다**(성능 리뷰 P1-8). 그 속성은 읽는 순간
       브라우저가 밀린 스타일·레이아웃을 강제로 계산하게 만들어(forced reflow), 스크롤
       한 번에 수백 번 레이아웃이 돌았다. 문서 높이는 스크롤로 바뀌지 않으므로 **캐시하고
       바뀔 만한 때만 다시 잰다** — 리사이즈, 로드 완료, 그리고 실제 크기 변화(ResizeObserver:
       이미지가 늦게 들어오거나 게이트가 걷히며 높이가 변하는 경우를 잡는다). */
  useEffect(() => {
    let scrollable = 0;

    const measure = () => {
      scrollable = document.documentElement.scrollHeight - window.innerHeight;
      draw();
    };
    const draw = () => {
      const ratio = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${ratio})`;
      document.body.classList.toggle('db-nav-compact', window.scrollY > 80);
    };

    window.addEventListener('scroll', draw, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => measure());
    observer?.observe(document.documentElement);

    measure();
    return () => {
      window.removeEventListener('scroll', draw);
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
      observer?.disconnect();
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
    if (!gateOpen) return;

    /* 게이트가 떠 있는 동안 뒤 페이지가 밀리지 않게 잠근다(CSS 로는 조상에 닿지 못한다).
       잠금은 **셈하는 한 벌**이다 — 모바일 메뉴(§1.6c)도 같은 것을 쓰므로 둘이 겹쳐도
       해제 순서가 어긋나지 않는다(`body-scroll-lock.ts` 머리말). */
    const unlockScroll = lockBodyScroll();

    let done = 0;
    const step = () => {
      done += 1;
      setGateProgress(Math.min(1, done / 2));
      if (done >= 2) setGateReady(true);
    };

    /* 히어로가 실제로 받아 오는 그 파일을 기다린다.
       ⚠ `src` 만 넣으면 안 된다 — 화면의 `<img>` 는 `srcset`/`sizes` 로 폭을 고르므로,
         프로브가 기본 주소(가장 큰 폭)를 따로 받아 **같은 사진을 두 벌** 내려받는다
         (실측으로 확인: 모바일에서 w=1440 195KB + w=640 33KB). `HTMLImageElement` 는
         프로브에서도 srcset 을 그대로 해석하므로 같은 후보를 골라 캐시를 공유한다. */
    const onMobile = window.matchMedia('(max-width:720px)').matches;
    const probe = new Image();
    probe.onload = step;
    probe.onerror = step;
    probe.sizes = '100vw';
    const probeSet = onMobile ? data.hero.srcSetMobile : data.hero.srcSet;
    if (probeSet) probe.srcset = probeSet;
    probe.src = onMobile ? (data.hero.srcMobile ?? data.hero.src) : data.hero.src;

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
      unlockScroll();
    };
    /* `gateOpen` 이 deps 에 있는 것이 잠금 해제의 전부다 — 들어가는 순간 위 정리 함수가
       돌아 원래 overflow 로 되돌리고, 다시 실행된 이펙트는 첫 줄에서 물러난다. */
  }, [gateOpen, data.hero.src, data.hero.srcMobile, data.hero.srcSet, data.hero.srcSetMobile, enter]);

  /* ── 게이트 포커스 (접근성 리뷰 P0-1) ──────────────────────────────
     `aria-modal` 은 **약속**일 뿐이고, 포커스를 실제로 가두는 것은 코드다.
     ① 뜨는 즉시 대화상자 자체에 포커스를 옮긴다 — "들어가기"는 준비되기 전(0.5s 페이드)
        까지 눌리지 않는 상태라, 그 전에 Tab 을 눌러도 트랩이 걸려 있어야 한다.
     ② 준비되면 버튼으로 옮긴다(Enter 한 번으로 들어갈 수 있는 자리).
     ③ 뒤 본문은 `inert` 라 Tab 이 애초에 그쪽으로 가지 않는다(아래 nav/main/footer). */
  useEffect(() => {
    if (!gateOpen) return;
    gateRef.current?.focus({ preventScroll: true });
  }, [gateOpen]);

  useEffect(() => {
    if (gateReady && gateOpen) gateButtonRef.current?.focus({ preventScroll: true });
  }, [gateReady, gateOpen]);

  /**
   * 게이트 안의 키보드 — Esc 는 들어가기, Tab 은 게이트 안에서 순환.
   *
   * Esc 는 `document` 리스너(위 이펙트)도 듣고 있다. 두 곳이 겹쳐도 `markGateEntered()` 는
   * 같은 값을 다시 쓰는 멱등 연산이라 안전하고, 포커스가 게이트 밖(첫 프레임의 body)에
   * 있을 때와 안에 있을 때를 각각 책임진다.
   */
  const onGateKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        enter();
        return;
      }
      if (event.key !== 'Tab') return;

      const gate = gateRef.current;
      if (!gate) return;
      const focusables = Array.from(
        gate.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) {
        event.preventDefault();
        gate.focus({ preventScroll: true });
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || active === gate) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || active === gate) {
        event.preventDefault();
        first.focus();
      }
    },
    [enter],
  );

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

      {/*
        히어로 프리로드 (성능 리뷰 P1-6).

        첫 화면을 덮는 것은 히어로 사진 한 장인데, 정작 프리로드가 걸려 있던 것은 **폴드 밖
        카드 0번**이었다(그쪽 `eager` 는 아래 TodayCarousel 에서 `lazy` 로 내렸다).
        여기서는 실제로 그려지는 두 벌을 그대로 예약한다 — `<picture>` 의 갈림(720px)과
        같은 `media`, 같은 `imageSrcSet`/`imageSizes` 를 써야 브라우저가 **다시 고르지 않고**
        이미 받아 둔 후보를 쓴다. 값이 어긋나면 같은 사진을 두 번 받는다.

        React 19 는 트리 어디에 있든 `<link>` 를 `<head>` 로 끌어올린다(float) — 클라이언트
        컴포넌트지만 서버 렌더 HTML 의 head 에 그대로 실린다.
      */}
      {hero.srcMobile ? (
        <link
          rel="preload"
          as="image"
          href={hero.srcMobile}
          imageSrcSet={hero.srcSetMobile}
          imageSizes="100vw"
          media="(max-width: 720px)"
          fetchPriority="high"
        />
      ) : null}
      <link
        rel="preload"
        as="image"
        href={hero.src}
        imageSrcSet={hero.srcSet}
        imageSizes="100vw"
        media={hero.srcMobile ? '(min-width: 721px)' : undefined}
        fetchPriority="high"
      />

      <div className={pageClass} data-flower={globalSlug} ref={rootRef}>
        {/* ═══ 로딩 게이트 ═══ */}
        <div
          className="db-gate"
          role="dialog"
          aria-modal="true"
          aria-labelledby="db-gate-title"
          ref={gateRef}
          tabIndex={-1}
          onKeyDown={onGateKeyDown}
        >
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

        {/* ═══ 내비 ═══
            `inert` 는 대화상자가 떠 있는 동안만 붙는다 — 그 뒤의 것은 Tab 으로도
            스크린리더로도 닿지 않아야 한다(접근성 리뷰 P0-1). 대화상자는 둘이다:
            로딩 게이트(#21)와 모바일 내비 메뉴(§1.6c).

            `<header>` 가 배너 랜드마크를 맡고, `inert` 도 그 안의 내비 전체에 건다. */}
        <header className="db-site-head" inert={gateOpen || menuOpen || undefined}>
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
            <li>
              <Link href="/letter" prefetch={false}>편지</Link>
            </li>
            {/*
              #20 — `여러 명에게`(/groups)는 내비에서 내렸다. 첫 화면에 진입이 둘이면
              "추천 시작"과 나란히 놓인 그 항목이 별개 서비스처럼 읽혔다. 페이지는
              그대로 살아 있고, 갈림길은 질문 1번 위("몇 분께 드리나요?")로 옮겼다 —
              한 명/여러 명은 랜딩에서 고를 일이 아니라 질문의 첫 줄이다.
            */}
            {/*
              2026-08-17 사용자 지적 — `시작하기`(#db-start 앵커)는 내비에서 뺐다. 바로
              오른쪽 `추천 시작` CTA 와 같은 일을 하는 항목이 나란히 둘 서 있었다.
              마무리 절(#db-start)은 그대로다 — 스크롤로 닿는 길만 남기고 중복 진입을 덜었다.
            */}
          </ul>

          <Link className="db-nav-cta" href="/recommend" prefetch={false}>
            추천 시작
          </Link>

          {/*
            §1.6c — 860px 아래에서만 서는 메뉴 버튼(CSS 가 `display` 로 가른다).
            모바일에서는 중복 CTA 를 헤더에서 덜고 `워드마크 + 메뉴`만 남긴다. 추천 진입은
            바로 아래 히어로와 펼친 시트 하단의 주 CTA가 맡는다.
          */}
          <button
            type="button"
            ref={menuButtonRef}
            className="db-nav-menu"
            aria-label="전체 메뉴 열기"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={openMenu}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4 7.5h16M4 12h16M4 16.5h16" strokeLinecap="round" />
            </svg>
            <span className="db-nav-menu-t">메뉴</span>
          </button>
          </nav>
        </header>

        {/*
          모바일 내비 메뉴 (§1.6c).

          ⚠ 헤더·내비 **밖**이다. `.db-nav` 는 `backdrop-filter` 를 쓰는 `.db-glass` 라
            고정 위치 자손의 컨테이닝 블록이 되고 `overflow: hidden` 까지 걸려 있어서,
            안에 두면 전면 시트가 알약 크기로 잘린다.
        */}
        <MobileNavSheet open={menuOpen} onClose={closeMenu} />

        <main id="db-main" inert={gateOpen || menuOpen || undefined}>
          {/* ═══════════════ 히어로 ═══════════════ */}
          <section className="db-hero" id="db-hero" aria-labelledby="db-hero-h1">
            <div className="db-hero-media" aria-hidden="true">
              <picture>
                {hero.srcMobile ? (
                  <source
                    media="(max-width:720px)"
                    srcSet={hero.srcSetMobile ?? hero.srcMobile}
                    sizes="100vw"
                  />
                ) : null}
                {/* Unsplash 승인 URL(docs/image-assets.md)을 그대로 쓴다 — next/image 리모트 최적화는 도입하지 않았다.
                    폭은 `srcSet`(1080·1600·2560) + `sizes="100vw"` 로 브라우저가 고른다 —
                    예전에는 화면 폭과 무관하게 2560 한 벌이었다(성능 리뷰 P1-5). */}
                <img
                  src={hero.src}
                  srcSet={hero.srcSet}
                  sizes="100vw"
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
                {/*
                  §1.5d — 스펙 언어(카드 안만 바뀌고…) 금지. 테마 이름도 여기서는 부르지 않는다
                  (카드가 이미 말해 준다).

                  리드는 **세 줄로 내려간다**(§1.5n · 2026-08-16 재작성):
                    ① `db-today-lede`  — 리드 문단 전체. **문장을 여기서 짓지 않는다.**
                       꽃 이름·고른 이유·이야기 인용까지 서버가 한 문단으로 만들어 내려보내고
                       (`data.todayReason`), 그 문장 틀은 날짜로 회전한다.
                    ② `db-today-aside` — 화면 빛깔 한 마디(`data.todayAside`). 아래 빛깔
                       선택기를 여는 말이다. 읽지 않아도 되는 줄이다.
                    ③ `db-today-birth` — 탄생화 각주.

                  ⚠ 리드 앞에 `{날짜}, 오늘의 꽃은 {이름}이에요.` 를 되돌리지 마라. 그 뼈대가
                    날마다 그대로 서는 것이 "작위적"이라는 피드백의 첫 원인이었고, 날짜는 이미
                    히어로 캡션(`오늘의 꽃 · 2026.08.16`)과 아래 탄생화 줄이 말한다.
                  ⚠ `todayReason` 은 인용 부호까지 서버가 붙여 내려보낸다. 여기서 자르거나
                    따옴표를 덧붙이지 마라(훅 원문에 `"`·`'` 가 섞여 있다).
                */}
                <h2 className="db-today-title" id="db-today-title" data-db-split>
                  오늘 꺼내 온 한 송이, 그리고 이어지는 이야기들
                </h2>
                <p className="db-today-lede" data-db-reveal>
                  {data.todayReason}
                </p>
                <p className="db-today-aside" data-db-reveal>
                  {data.todayAside}
                </p>
                {/*
                  탄생화 각주 (§1.5e 절제 — 밴드도 박스도 만들지 않는다).
                  오늘의 꽃은 엔진이 제철로 고른 주인공이고 탄생화는 날짜 표에서 온 곁가지라,
                  둘을 같은 위계로 세우면 "오늘의 꽃"이 무엇인지 흐려진다. 그래서 리드 아래
                  한 줄이 전부다.

                  ⚠ **"전통"·"공식"·"예로부터 정해진" 이라고 쓰지 마라.** 이 표는 전통적으로
                    정해진 탄생화가 아니라, 하루 한 종씩 꽃을 소개하던 페이지에서 퍼져 널리
                    통하게 된 목록이다(`docs/birth-flowers-research.md` §2). 계보를 풀어 적는
                    자리는 도감(`/flowers` 생일 꽃 찾기)이고, 여기서는 단정만 하지 않으면 된다.
                */}
                {/*
                  문장은 서버가 조각으로 내려보낸다(`lead` · `tail`) — 이 줄도 §1.5n 개정에서
                  날짜 씨앗 변주가 들어왔고, 이름 한 낱말만 링크라 조각이 필요하다.

                  링크는 **언제나 붙는다.** 도감에 있는 꽃(366일 중 57일)은 상세로 가고,
                  나머지는 도감의 `생일 꽃 찾기` 구획으로 간다. 예전에는 그 309일에 이름이
                  검은 글자로 남아 막다른 줄이 됐다 — 표에만 있는 꽃인 것은 맞지만, 다음에
                  하고 싶은 일(다른 날짜도 찾아보기)로 가는 문이 화면에 없었다.
                  ⚠ 폴백 링크의 `aria-label` 은 **보이는 이름으로 시작한다**(WCAG 2.5.3
                    Label in Name) — 이름을 지우고 목적지만 읽히게 하면 음성 조작이 깨진다.
                */}
                {data.birthFlower && (
                  <p className="db-today-birth" data-db-reveal>
                    {data.birthFlower.lead}
                    {data.birthFlower.href ? (
                      <Link href={data.birthFlower.href}>{data.birthFlower.name}</Link>
                    ) : (
                      <Link
                        href={BIRTH_FINDER_HREF}
                        aria-label={`${data.birthFlower.name} — 도감의 생일 꽃 찾기에서 다른 날짜도 보기`}
                      >
                        {data.birthFlower.name}
                      </Link>
                    )}
                    {data.birthFlower.tail}
                  </p>
                )}

                {/*
                  화면의 빛깔 선택기 (§1.4c v3.4 — 2026-08-16 개정).

                  예전에는 전역 테마를 카드 안 "이 꽃의 분위기로 바꾸기" 버튼이 바꿨다.
                  카드가 32장이라 **같은 컨트롤이 32번 반복**됐고, 그건 §1.6b 가 컨트롤을
                  한 벌로 통합한 취지와 정면으로 어긋난다. 전환은 여기 한 줄로 모은다.

                  누르는 것은 꽃이 아니라 **계열**이다 — 색감을 소유하는 것이 카테고리이므로
                  (§1.4c v3.2) 고르는 단위도 카테고리여야 말이 맞는다.
                */}
                <div
                  className="db-tint"
                  role="group"
                  aria-labelledby="db-tint-label"
                  data-db-reveal
                >
                  <span className="db-tint-label" id="db-tint-label">
                    화면의 빛깔
                  </span>
                  <div className="db-tint-chips">
                    {STORY_CATEGORIES.map((tint) => {
                      const slug = CATEGORY_THEMES[tint.key].slug;
                      const on = slug === globalSlug;
                      return (
                        <button
                          key={tint.key}
                          type="button"
                          className="db-tint-chip"
                          data-tint={tint.key}
                          aria-pressed={on}
                          aria-label={`${tint.label} 색감으로 보기`}
                          onClick={() => rememberTint(slug)}
                        >
                          <span className="db-tint-dot" aria-hidden="true" />
                          {tint.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/*
                캐러셀 건너뛰기 (접근성 리뷰 P1-5). 예전에는 카드 한 장에 링크 하나 +
                분위기 버튼 하나라 32장이면 탭 정지점이 64개였다. 버튼을 걷어 낸 지금도
                (§1.4c v3.4 — 전환은 위 "화면의 빛깔" 한 줄로 모았다) 32개는 남는다.
                평소에는 숨어 있다가 포커스가 오면 나타난다.
              */}
              <a className="db-skip db-skip-inline" href="#db-trust">
                꽃 카드 {data.slides.length}장 건너뛰기
              </a>

              <TodayCarousel slides={data.slides} />
            </div>
          </section>

          {/* ═══════════════ 챕터 02 · 신뢰 3요소 (§1.5h 개편) ═══════════════ */}
          {/* `tabIndex={-1}` 은 위 "건너뛰기" 링크의 착지점이다 — 없으면 앵커만 이동하고
              포커스는 캐러셀에 남아 다음 Tab 이 다시 카드로 돌아간다. */}
          <section
            className="db-chapter db-room"
            id="db-trust"
            aria-labelledby="db-trust-title"
            tabIndex={-1}
          >
            <div className="db-room-media" aria-hidden="true">
              <div className="db-media-bg" style={mediaBg(SECTION_IMAGES.trust)} />
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
            <div className="db-media-bg" style={mediaBg(SECTION_IMAGES.band)} />
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
            <div className="db-media-bg" aria-hidden="true" style={mediaBg(SECTION_IMAGES.example)} />
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
            <div className="db-media-bg" aria-hidden="true" style={mediaBg(SECTION_IMAGES.finale)} />
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
        <footer className="db-footer" inert={gateOpen || menuOpen || undefined}>
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
                {/* ⚠ `제휴 꽃집 안내` 로 되돌리지 마라 — 제휴 관계는 아직 없다(파트너 페이지
                    `NO_AFFILIATION`). 화면 이름도 그 페이지 제목과 같은 말로 통일한다. */}
                <Link href="/partners" prefetch={false}>
                  함께하는 꽃집
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
                  Unsplash License로 쓰고 있어요. 표기 의무는 없지만, 찍어 준 분의 이름은
                  dearbloom이 늘 함께 적어 둬요.
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
