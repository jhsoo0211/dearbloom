'use client';

/**
 * 결과 화면 — 확정 시안 `design/app-v3/result.html` 을 실데이터로 옮긴 것.
 *
 * 위계는 §1.5i 가 확정한 5단이다(위 → 아래):
 *   ① 꽃(대표 실사) + 이름 + 꽃말 (+ 색 다시 고르기)
 *   ② 꽃에 얽힌 이야기 + 나라별 꽃말 ← 멘트보다 위. "정보"보다 "이야기"가 먼저다
 *   ③ 추천 이유 · 이런 날 건네보세요
 *   ④ 멘트 3톤 + 함께 담을 한 줄 + 문학 속의 이 꽃
 *   ⑤ 최하단 참고(작게) — 반려동물 배지 · 계절 · 향 · 관리 · 가격 1줄 ·
 *     「이 꽃 어디서 사지」 세 갈래(우체국 꽃배달 검색 · 지도 · 우리가 찾아본 곳들) + 정직 고지 2줄
 *
 * ⚠ ① 은 2026-08-15(#14)에 **3D 뷰어에서 대표 실사로 바뀌었다.** 절차적 3D 는 "이 꽃이
 *   어떻게 생겼나"에 답하지 못했다 — 도감이 실사를 먼저 세우는 것과 같은 이유다.
 *   되돌릴 수 있게 `FlowerViewer`·`flowerScene`·`FlowerFallback` 파일은 지우지 않았다.
 *
 * 값은 전부 서버가 만들어 준 `ResultPayload` 다. 여기서 문장을 새로 지어내지 않는다
 * (라벨 사전·엔진·카탈로그는 서버 쪽에만 있다).
 */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';

import type { ResultPayload, StoryCard } from './types';
import styles from './flow.module.css';

/** 결 필터의 `전체` 칸 — 서버가 내려보내는 필터 목록의 첫 값과 같은 key 다. */
const MOOD_ALL = 'all';

/** 가격 구간 칸 수 — 라벨 사전(`labels.ts` PRICE_BAND_SLOTS)과 같은 값이다(#11). */
const PRICE_SLOTS = [1, 2, 3] as const;

/**
 * ── 「이 꽃 어디서 사지」에 답하는 두 개의 바깥 링크 (2026-08-17) ──────────────
 *
 * 2026-08-17 실측으로 고른 것이다. **바꾸기 전에 아래 셋을 다시 재 보라.**
 *
 * ① 우체국 꽃배달 검색 — `searchTerm={대표이름} 꽃배달`
 *    운영은 재단법인 한국우편사업진흥원(우정사업본부)이고, 이용안내에 목적이 그대로 적혀 있다:
 *    「우체국 꽃배달은 국내 화훼농가 육성을 위해서 1998년 1월 15일부터 시행된 서비스입니다.」
 *    ⚠ `꽃배달` 을 검색어에 **반드시 붙인다.** 이름만 넣으면 엉뚱한 것이 나온다 —
 *      `튤립` → 튤립닭발, `수국` → 수국차, `프리지아` → 후리지아 비누(실측).
 *      `{이름} 꽃배달` 이면 결과가 전부 꽃배달 칸이고, 없으면 「해당하는 상품이 없습니다」
 *      안내가 정상으로 뜬다(HTTP 200).
 *    ⚠ 꽃 칸 안쪽 검색(`flowerSend.do?srchGoodsNm=…`)은 쓰지 마라. 결과가 0건이면
 *      **500 에러 페이지**가 뜬다(실측). 빈손으로 돌아오는 것과 고장 난 화면은 다르다.
 *
 * ② 네이버 지도 `꽃집` 검색
 *    데스크톱·모바일 웹 양쪽에서 결과가 그대로 뜬다. 카카오맵(`map.kakao.com/?q=`)은
 *    모바일에서 앱 설치 안내(`applink.map.kakao.com`)로 가로막혀 목록을 못 본다(실측).
 *    ⚠ 검색어에 꽃 이름을 붙이지 마라. 지도는 **가게 이름**을 찾는다 — `장미 꽃집` 은
 *      수원·대전·경산·부산의 「장미꽃집」(32~333km)을 끌어온다. 그 가게에 장미가 있다는
 *      뜻이 전혀 아니면서, 있는 것처럼 읽힌다.
 *
 * ③ 재고·가격·배송을 약속하지 않는다. 우리는 파는 사람이 아니라 찾아보는 길만 안내한다.
 */
const POST_FLOWER_SEARCH = 'https://mall.epost.go.kr/fo/search/search.do?searchTerm=';
const MAP_FLORIST_SEARCH = 'https://map.naver.com/p/search/';

/**
 * 검색에 쓸 대표 이름 — `빨간 장미` → `장미`, `아시아틱 백합` → `백합`,
 * `미모사(은엽아카시아)` → `미모사`.
 *
 * 두 가지를 떼어 낸다. 둘 다 **검색 결과를 좁히기만** 하기 때문이다:
 *   · 괄호 속 딴이름 — 검색창에 괄호를 넣으면 걸리는 것이 없다
 *   · 앞에 붙은 색·품종 수식 — `빨간 장미 꽃배달` 은 0건이고 `장미 꽃배달` 은 12건이다
 * 한 낱말짜리 이름은 그대로 돌려준다.
 *
 * ⚠ 도감이 늘어도 이 규칙은 그대로 선다. 이름 목록을 여기 적어 두지 않는 이유다 —
 *   `content/flowers.csv` 는 계속 자란다(2026-08-17 하루에도 47종 → 59종이 됐다).
 */
function mainName(nameKo: string): string {
  const parts = nameKo.replace(/\([^)]*\)/g, ' ').trim().split(/\s+/);

  return parts[parts.length - 1] || nameKo;
}

function IconCopy() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11.2" height="11.2" rx="2.6" />
      <path d="M15 9V6.6A2.6 2.6 0 0 0 12.4 4H6.4A2.6 2.6 0 0 0 3.8 6.6v6A2.6 2.6 0 0 0 6.4 15.2H9" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h13M12.5 6l6 6-6 6" />
    </svg>
  );
}

/** 바깥으로 나가는 링크에만 쓴다 — 같은 탭에서 열리는 우리 화면에는 `IconArrow` 다. */
function IconExternal() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M8.6 7H17v8.4" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * 이야기 한 편의 꼬리표들(갈래·문화권·신뢰).
 *
 * §1.5i 16차 — 이건 **본문 아래 각주 줄**이다. 칩으로 세워 카드 위쪽에 두면
 * "케냐 · 19세기" 같은 메타가 이야기보다 먼저 읽혀서, 읽는 순서가 뒤집힌다.
 * 그래서 칩을 버리고 한 줄 각주로 내렸다. 창작 라벨만 강조를 남긴다(§1.5f).
 */
function StoryMeta({ story }: { story: StoryCard }) {
  const rest = [story.regionLabel, story.confidenceLabel].filter(Boolean) as string[];
  return (
    <p className={styles.storyFoot}>
      <span className={story.isOriginal ? styles.storyFootOriginal : undefined}>
        {story.typeLabel}
      </span>
      {rest.map((label) => (
        <span key={label}>
          <span className={styles.sep} aria-hidden="true">
            ·
          </span>
          {label}
        </span>
      ))}
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * 이야기 상세 시트 (§1.5i)
 * ------------------------------------------------------------------ */

interface StorySheetProps {
  story: StoryCard;
  /** 필터를 통과한 이야기 안에서의 자리(1부터). */
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

/**
 * 바텀 시트. 열려 있는 동안만 마운트되므로 "마운트 = 열림" 이다.
 *
 * 접근성은 네 가지를 직접 챙긴다 — `aria-modal`, 포커스 트랩(Tab 순환),
 * ESC·배경 탭 닫기, body 스크롤 잠금. 등장 모션은 CSS 애니메이션이라
 * `prefers-reduced-motion` 전역 규칙(globals.css)이 알아서 0으로 만든다.
 */
function StorySheet({ story, position, total, onPrev, onNext, onClose }: StorySheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // 열려 있는 동안 뒤 화면이 따라 스크롤되지 않게 잠그고, 닫으면 부르던 자리로 포커스를 돌린다.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  // 이전/다음으로 넘길 때마다 제목으로 포커스를 옮긴다(스크린리더가 새 이야기를 읽게).
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    titleRef.current?.focus();
  }, [story.id]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = sheetRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={styles.sheetRoot}>
      {/* 배경 탭으로도 닫힌다 — 같은 동작을 하는 닫기 버튼이 시트 안에 있어 여기는 장식이다. */}
      <div className={styles.sheetScrim} onClick={onClose} aria-hidden="true" />

      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-sheet-title"
        ref={sheetRef}
        onKeyDown={onKeyDown}
      >
        <span className={styles.sheetGrip} aria-hidden="true" />

        <div className={styles.sheetHead}>
          <p className={styles.sheetCount}>
            {position} / {total}
          </p>
          <button
            type="button"
            className={styles.sheetClose}
            onClick={onClose}
            aria-label="이야기 닫기"
          >
            <IconClose />
          </button>
        </div>

        {/* §1.5i 16차 순서 — 제목·mood 칩(상단 허용) → hook → 본문 → 메타 각주 → 출처 */}
        <div className={styles.sheetBody} ref={bodyRef}>
          <h3 className={styles.storyTitle} id="story-sheet-title" tabIndex={-1} ref={titleRef}>
            {story.title}
          </h3>
          {story.moodLabels.length > 0 ? (
            <p className={styles.storyMoods}>
              {story.moodLabels.map((label) => (
                <span className={styles.tagline} key={label}>
                  {label}
                </span>
              ))}
            </p>
          ) : null}
          {story.hook ? <p className={styles.storyHook}>{story.hook}</p> : null}
          <p className={styles.storyBody}>{story.body}</p>
          <StoryMeta story={story} />
          {story.sourceTitle ? (
            <p className={styles.loreSrc}>
              이야기의 갈래 —{' '}
              {story.sourceUrl ? (
                <a
                  className={styles.sheetLink}
                  href={story.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {story.sourceTitle}
                </a>
              ) : (
                story.sourceTitle
              )}
            </p>
          ) : null}
        </div>

        <div className={styles.sheetNav}>
          <button
            type="button"
            className={styles.sheetNavBtn}
            onClick={onPrev}
            disabled={total < 2}
          >
            이전 이야기
          </button>
          <button
            type="button"
            className={styles.sheetNavBtn}
            onClick={onNext}
            disabled={total < 2}
          >
            다음 이야기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 결과 화면
 * ------------------------------------------------------------------ */

export interface ResultViewProps {
  payload: ResultPayload;
  /** 질문 처음으로 돌아가기. */
  onRestart: () => void;
}

export default function ResultView({ payload, onRestart }: ResultViewProps) {
  const [active, setActive] = useState(0);
  const [colorIndex, setColorIndex] = useState<number[]>(() =>
    payload.options.map((option) => {
      const suggested = option.colors.findIndex((c) => c.isSuggested);
      return suggested === -1 ? 0 : suggested;
    }),
  );
  const [tone, setTone] = useState(0);
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [moodFilter, setMoodFilter] = useState<string>(MOOD_ALL);
  const [openStoryId, setOpenStoryId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  /** §1.5k 문학 — 펼침 상태와 지금 보고 있는 발췌의 자리(0 = 대표). */
  const [litOpen, setLitOpen] = useState(false);
  const [litIndex, setLitIndex] = useState(0);
  /**
   * 실사를 실제로 받아 온 안의 자리들 — 처음에는 눈에 보이는 1안뿐이다.
   *
   * 3안이 전부 폭 1600 실사라, 셋을 한꺼번에 받으면 **보이지도 않는 두 장**이 첫 화면의
   * 대역폭을 나눠 갖는다(실측 175KB). 그래서 나머지는 그 탭에 손이 닿는 순간(hover ·
   * 포커스 · 누름 · 활성)에 받는다.
   *
   * ⚠ `<img>` 자체는 처음부터 셋 다 세워 둔다 — 크로스페이드는 "이미 opacity:0 으로 서 있던
   *   칸이 1 로 바뀔 때" 만 도는데, 활성화 시점에 요소를 새로 만들면 시작값이 곧 1 이라
   *   페이드가 아예 일어나지 않는다. 여기서 미루는 것은 요소가 아니라 `src` 하나다.
   */
  const [warmed, setWarmed] = useState<readonly number[]>(() => [0]);

  function warmPhoto(index: number) {
    setWarmed((current) => (current.includes(index) ? current : [...current, index]));
  }

  const option = payload.options[active];
  const chip = option.colors[colorIndex[active]];
  const suggestedChip = option.colors.find((c) => c.isSuggested);

  const meaning = chip?.meaningKo ?? option.fallbackMeaning?.meaningKo;
  const confidence = chip?.meaningKo
    ? chip.confidenceLabel
    : option.fallbackMeaning?.confidenceLabel;

  /** 대표 이야기를 맨 앞에 둔 그 꽃의 이야기 전부(§1.5i — k 제한 없이 내려온다). */
  const allStories = useMemo(() => {
    const featured = option.stories.featured;
    return featured ? [featured, ...option.stories.others] : option.stories.others;
  }, [option.stories]);

  /** 실제로 이야기가 있는 결만 칩으로 세운다(빈 필터를 눌러 보게 하지 않는다). */
  const moodChips = useMemo(
    () =>
      payload.storyMoodFilters.filter(
        (filter) =>
          filter.key === MOOD_ALL || allStories.some((story) => story.moods.includes(filter.key)),
      ),
    [payload.storyMoodFilters, allStories],
  );

  const filteredStories = useMemo(
    () =>
      moodFilter === MOOD_ALL
        ? allStories
        : allStories.filter((story) => story.moods.includes(moodFilter)),
    [allStories, moodFilter],
  );

  /**
   * 시트의 이전/다음이 도는 목록.
   * 대표 이야기는 필터와 상관없이 열 수 있어서, 열린 이야기가 필터 밖이면 전체를 돈다.
   */
  const navStories = filteredStories.some((story) => story.id === openStoryId)
    ? filteredStories
    : allStories;
  const navIndex = navStories.findIndex((story) => story.id === openStoryId);
  const openStory = navIndex === -1 ? null : navStories[navIndex];

  /**
   * §1.5k 문학 — 대표를 맨 앞에 둔 그 꽃의 발췌 전부(#1).
   * 화면은 이 목록을 한 편씩 넘겨 보고, 첫 칸(대표)이 접힌 상태의 기본값이다.
   */
  const literature = useMemo(() => {
    const block = option.literature;
    if (!block) return [];
    return [block.featured, ...block.others];
  }, [option.literature]);
  const currentLit = literature[Math.min(litIndex, literature.length - 1)];

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드를 못 쓰는 환경(비보안 컨텍스트 등)에서도 화면은 그대로 둔다.
    }
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1600);
  }

  function pickColor(next: number, focus = false) {
    const count = option.colors.length;
    if (count === 0) return;
    const index = ((next % count) + count) % count;
    setColorIndex((current) => current.map((value, i) => (i === active ? index : value)));
    if (focus) {
      const node = document.getElementById(`color-${index}`);
      node?.focus();
    }
  }

  /** 다른 안으로 갈아탈 때 이야기·문학 상태는 초기화한다 — 꽃이 바뀌면 읽을 것도 다르다. */
  function selectOption(next: number) {
    warmPhoto(next);
    setActive(next);
    setStoriesOpen(false);
    setMoodFilter(MOOD_ALL);
    setOpenStoryId(null);
    setLitOpen(false);
    setLitIndex(0);
  }

  /** 문학 발췌 넘기기 — 목록 안에서 순환한다(끝에서 처음으로 돌아온다). */
  function moveLit(delta: number) {
    if (literature.length < 2) return;
    setLitIndex((current) => (current + delta + literature.length) % literature.length);
  }

  function moveTab(delta: number) {
    const count = payload.options.length;
    const next = (active + delta + count) % count;
    selectOption(next);
    document.getElementById(`opt-tab-${next}`)?.focus();
  }

  function moveTone(delta: number) {
    const count = payload.tones.length;
    const next = (tone + delta + count) % count;
    setTone(next);
    document.getElementById(`tone-tab-${next}`)?.focus();
  }

  /** 시트의 이전/다음 — 필터 결과 안에서 순환한다. */
  function moveStory(delta: number) {
    if (navStories.length === 0 || navIndex === -1) return;
    const next = (navIndex + delta + navStories.length) % navStories.length;
    setOpenStoryId(navStories[next].id);
  }

  const currentTone = payload.tones[tone];
  // 복사는 화면에 보이는 그대로 — 첫 마디가 있으면 함께 담는다.
  const toneCopyText = currentTone.headline
    ? `${currentTone.headline}\n\n${currentTone.body ?? ''}`
    : (currentTone.body ?? '');
  /**
   * §1.5e 함께 담을 한 줄 — **고른 톤의 것**(#13).
   * 그 톤에 맞춘 줄이 없으면(예문도 생성도 없는 상황) 공용 인용으로 떨어진다.
   */
  const cardLine = currentTone.cardLine ?? payload.quote;
  const hasCueBand = Boolean(payload.episodeText) || payload.storyCues.length > 0;
  const featured = option.stories.featured;

  return (
    <>
      <header className={`${styles.bar} ${styles.appbar}`}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onRestart}
          aria-label="질문 처음으로 돌아가기"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
        <Link className={styles.wm} href="/">
          dearbloom
        </Link>
        <span className={styles.spacer} />
        <Link className={styles.iconBtn} href="/" aria-label="홈으로">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
            <path d="M9.6 20.5v-5.6h4.8v5.6" />
          </svg>
        </Link>
      </header>

      <div className={`${styles.phone} ${styles.phoneResult}`}>
        <main className={styles.rmain}>
          <h1 className="sr-only">추천 결과 — {payload.contextChips.join(' · ')}</h1>

          {/*
            데스크톱(1024px↑)은 2단이다 — 좌단은 꽃·이름·꽃말·색 칩을 sticky 로 붙들고,
            우단만 스크롤한다(이야기 → 나라별 → 이유 → 멘트 → 참고). 모바일에서는 이
            래퍼들이 그냥 블록이라 **DOM 순서 = 지금까지의 한 칼럼 순서** 그대로다.
            좌/우를 나눈 자리가 하필 탭 패널 한가운데라, 패널을 둘로 나누고 탭의
            aria-controls 가 두 id 를 함께 가리키게 했다(둘 다 이 탭이 바꾸는 영역이다).
          */}
          <div className={styles.two}>
            <div className={styles.colA}>
              <div className={styles.colAInner}>

                {/*
                  ═══ ① 꽃 — 주인공. 대표 실사 한 컷(#14) ═══

                  3안의 `<img>` 를 **전부 겹쳐 두고** 활성 안만 띄운다(3D 뷰어가 한 씬 안에서
                  활성 꽃을 바꾸던 것과 같은 문법이다). 요소가 처음부터 셋 다 서 있어야
                  크로스페이드가 성립한다 — opacity 0 으로 이미 있던 칸이 1 로 바뀌는 것이
                  전환이고, 그 순간에 요소를 만들면 시작값이 곧 1 이라 전환이 없다.

                  다만 **받아 오는 시점은 미룬다**(`warmed`) — 겹쳐 두는 것과 세 장을 한꺼번에
                  내려받는 것은 다른 일이다.
                */}
                <figure className={styles.shotFig}>
                  <div className={styles.shotStage}>
                    {payload.options.map((item, index) =>
                      item.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Unsplash 원격 CDN. 승인 URL 을 그대로 쓴다(docs/image-assets.md — 핫링크가 권장 사용법).
                        <img
                          key={item.flowerId}
                          className={[
                            styles.shotImg,
                            item.photo.bright ? styles.shotBright : '',
                            index === active ? styles.shotOn : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          src={warmed.includes(index) ? item.photo.src : undefined}
                          alt={index === active ? item.photo.alt : ''}
                          aria-hidden={index === active ? undefined : true}
                          fetchPriority={index === 0 ? 'high' : 'low'}
                          decoding="async"
                        />
                      ) : null,
                    )}

                    <span className={styles.shotVig} aria-hidden="true" />
                    <span
                      className={
                        option.photo?.bright
                          ? `${styles.shotScrim} ${styles.shotScrimBright}`
                          : styles.shotScrim
                      }
                      aria-hidden="true"
                    />
                    <span className={styles.shotTopscrim} aria-hidden="true" />

                    <p className={styles.shotHead}>
                      <span className={styles.overline}>
                        No.&nbsp;{String(active + 1).padStart(2, '0')}{' '}
                        <span className={styles.ko}>추천 {payload.options.length}안</span>
                      </span>
                    </p>
                    <span className={styles.shotTag}>{option.segmentTag}</span>
                  </div>

                  {/*
                    사진 크레딧은 '출처' 한 단어 뒤로 접는다 — 도감 상세와 같은 문법이다
                    (2026-08-15 피드백: `Photo: … / Unsplash` 전문이 상시 노출되면 화면이
                    크레딧에 먹힌다). 표기가 사라지는 게 아니라 한 번의 클릭 뒤로 갈 뿐이고,
                    `<details>` 라 JS 없이 열리며 스크린리더는 접힌 내용까지 읽는다.
                  */}
                  {option.photo ? (
                    <figcaption className={styles.shotCredit}>
                      <details className={styles.creditFold}>
                        <summary className={styles.creditSum}>
                          출처
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </summary>
                        <span className={styles.creditText}>{option.photo.credit}</span>
                      </details>
                    </figcaption>
                  ) : null}
                </figure>

                <ul className={styles.ctx} aria-label="들려주신 이야기">
                  {payload.contextChips.map((chipText) => (
                    <li
                      key={chipText}
                      /* §1.5l — 사용자가 직접 쓴 한 줄만 말줄임 규격을 탄다(칩 높이는 그대로). */
                      className={payload.ownWords.includes(chipText) ? styles.ctxOwn : undefined}
                      title={payload.ownWords.includes(chipText) ? chipText : undefined}
                    >
                      {chipText}
                    </li>
                  ))}
                </ul>

                {/* §1.5j — 적어 준 이야기에서 읽어 낸 단서를 먼저 되비춘다 */}
                {hasCueBand ? (
                  <section className={styles.cueBand} aria-label="들려주신 이야기에서 찾은 단서">
                    <p className={styles.cueLede}>당신이 들려준 이야기를 담아 골랐어요</p>
                    {payload.storyCues.length > 0 ? (
                      <ul className={styles.cueChips}>
                        {payload.storyCues.map((cue) => (
                          <li className={styles.tagline} key={cue}>
                            {cue}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {payload.episodeText ? (
                      <p className={styles.cueEcho}>{payload.episodeText}</p>
                    ) : null}
                  </section>
                ) : null}

                {payload.isApology ? (
                  <aside className={styles.apology} aria-label="마음을 먼저 전하는 방법 안내">
                    <span className={styles.aic} aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 11.6a7.4 7.4 0 0 1-7.4 7.4c-1.2 0-2.3-.3-3.3-.8L4.6 19.4 5.9 15A7.4 7.4 0 1 1 20 11.6z" />
                        <path d="M12 8v3.6M12 14.3v.1" />
                      </svg>
                    </span>
                    <p>
                      <b>꽃보다 마음이 먼저예요.</b> 아래 문장부터 건네보세요.
                    </p>
                  </aside>
                ) : null}

                {/* ═══ 3안 세그먼트 ═══ */}
                <div
                  className={`${styles.seg} ${styles.segTop}`}
                  role="tablist"
                  aria-label={`꽃 ${payload.options.length}안 선택`}
                  style={{
                    ['--i' as string]: active,
                    ['--n' as string]: payload.options.length,
                  }}
                >
                  <span className={styles.segThumb} aria-hidden="true" />
                  {payload.options.map((item, index) => (
                    <button
                      key={item.flowerId}
                      type="button"
                      role="tab"
                      id={`opt-tab-${index}`}
                      aria-controls="opt-panel opt-panel-more"
                      aria-selected={index === active}
                      tabIndex={index === active ? 0 : -1}
                      onClick={() => selectOption(index)}
                      /*
                       * 누르기 전에 사진을 미리 받아 둔다 — 눌린 뒤에 받기 시작하면
                       * 크로스페이드가 빈 칸에서 시작한다. 셋 다 활성화보다 먼저 오는
                       * 신호다(마우스는 hover, 키보드는 포커스, 터치는 누름).
                       */
                      onMouseEnter={() => warmPhoto(index)}
                      onFocus={() => warmPhoto(index)}
                      onPointerDown={() => warmPhoto(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          moveTab(1);
                        }
                        if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          moveTab(-1);
                        }
                      }}
                    >
                      {item.segmentLabel}
                    </button>
                  ))}
                </div>

                <div id="opt-panel" role="tabpanel" aria-labelledby={`opt-tab-${active}`} tabIndex={-1}>
                  {/* ═══ 꽃 이름·꽃말 ═══ */}
                  <section className={styles.optHead} key={`head-${option.flowerId}`}>
                    <p className={styles.optNo}>
                      {String(active + 1).padStart(2, '0')}{' '}
                      <span className={styles.ko}>{option.headline}</span>
                    </p>
                    <h2 className={styles.flName}>{option.nameKo}</h2>
                    <p className={styles.flSci}>{option.scientificName}</p>
                    {/* 색 칩을 바꾸면 이 꽃말과 라벨이 함께 바뀐다 — 그래서 여기가 live 영역이다. */}
                    <div aria-live="polite">
                      {meaning ? (
                        <p className={styles.flMean}>
                          <span className={styles.q} aria-hidden="true">
                            “
                          </span>
                          {meaning}
                          <span className={styles.q} aria-hidden="true">
                            ”
                          </span>
                        </p>
                      ) : (
                        <p className={styles.flMeanEmpty}>
                          {chip
                            ? '이 색의 꽃말은 아직 갈래를 고르는 중이에요.'
                            : '이 꽃의 꽃말은 아직 모으는 중이에요. 갈래가 잡히면 바로 들려드릴게요.'}
                        </p>
                      )}
                      {confidence ? (
                        <p className={`${styles.trustBadge} ${styles.trustTop}`}>{confidence}</p>
                      ) : null}
                    </div>
                  </section>

                  {/* ═══ 색 다시 고르기 (§1.5c) — 꽃말 바로 옆자리를 지킨다 ═══ */}
                  {option.colors.length > 0 ? (
                    <section className={styles.sect} aria-labelledby="pick-h">
                      <p className={styles.overline} id="pick-h">
                        Color <span className={styles.ko}>이 색으로 주세요</span>
                      </p>
                      <p className={styles.pickLede}>다른 색이 더 그 사람답다면, 직접 골라보세요.</p>

                      <div className={styles.swatches} role="radiogroup" aria-labelledby="pick-h">
                        {option.colors.map((item, index) => (
                          <button
                            key={item.value}
                            id={`color-${index}`}
                            type="button"
                            role="radio"
                            className={styles.sw}
                            aria-checked={index === colorIndex[active]}
                            tabIndex={index === colorIndex[active] ? 0 : -1}
                            onClick={() => pickColor(index)}
                            onKeyDown={(e) => {
                              const delta =
                                e.key === 'ArrowRight' || e.key === 'ArrowDown'
                                  ? 1
                                  : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
                                    ? -1
                                    : 0;
                              if (!delta) return;
                              e.preventDefault();
                              pickColor(index + delta, true);
                            }}
                          >
                            <span
                              className={
                                item.needsRing ? `${styles.swDot} ${styles.swDotRing}` : styles.swDot
                              }
                              style={{ background: item.hex }}
                              aria-hidden="true"
                            />
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* 고른 색의 꽃말·신뢰 라벨은 위(꽃 이름 아래)에서 함께 바뀐다 — 여기서 또 쓰지 않는다. */}
                      <div className={styles.pickOut}>
                        {chip && suggestedChip && !chip.isSuggested ? (
                          <p className={styles.pickNote}>
                            <span className={styles.nic} aria-hidden="true">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="8.4" />
                                <path d="M12 8v4.6M12 15.6v.1" />
                              </svg>
                            </span>
                            <span>
                              추천은 {suggestedChip.label}이었어요 — 고른 색으로도 충분히 전해져요.
                            </span>
                          </p>
                        ) : option.colorReason ? (
                          <p className={styles.footNote}>{option.colorReason}</p>
                        ) : null}
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              className={styles.colB}
              id="opt-panel-more"
              role="tabpanel"
              aria-labelledby={`opt-tab-${active}`}
              tabIndex={-1}
            >

              {/* ═══ ② 꽃에 얽힌 이야기 — 멘트보다 위(§1.5i) ═══ */}
              <section className={styles.sect} aria-labelledby="story-h">
                <p className={styles.overline} id="story-h">
                  Lore <span className={styles.ko}>꽃에 얽힌 이야기</span>
                </p>

                {featured ? (
                  <article>
                    <h3 className={styles.storyTitle}>
                      <button
                        type="button"
                        className={styles.storyOpen}
                        onClick={() => setOpenStoryId(featured.id)}
                      >
                        {featured.title}
                      </button>
                    </h3>
                    {featured.hook ? <p className={styles.storyHook}>{featured.hook}</p> : null}
                    <p className={styles.storyBody}>{featured.body}</p>
                    <StoryMeta story={featured} />
                    {featured.sourceNote ? (
                      <p className={styles.loreSrc}>{featured.sourceNote}</p>
                    ) : null}
                    <button
                      type="button"
                      className={styles.storyDetail}
                      onClick={() => setOpenStoryId(featured.id)}
                    >
                      이 이야기 자세히 보기
                    </button>
                  </article>
                ) : (
                  <p className={styles.storyBody}>
                    이 꽃의 이야기는 아직 모으는 중이에요. 곧 들려드릴게요.
                  </p>
                )}

                {option.stories.others.length > 0 ? (
                  <>
                    <button
                      type="button"
                      className={styles.teaser}
                      aria-expanded={storiesOpen}
                      onClick={() => setStoriesOpen(!storiesOpen)}
                    >
                      다른 이야기 보기 ({option.stories.others.length})
                      <span className={styles.tar} aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h13M12.5 6l6 6-6 6" />
                        </svg>
                      </span>
                    </button>

                    {storiesOpen ? (
                      <>
                        {/* 결 필터 — 있는 결만 세운다(§1.5i) */}
                        {moodChips.length > 1 ? (
                          <div className={styles.moodFilter} role="group" aria-label="이야기 결 고르기">
                            {moodChips.map((filter) => {
                              const on = filter.key === moodFilter;
                              return (
                                <button
                                  key={filter.key}
                                  type="button"
                                  className={
                                    on ? `${styles.moodChip} ${styles.moodChipOn}` : styles.moodChip
                                  }
                                  aria-pressed={on}
                                  onClick={() => setMoodFilter(filter.key)}
                                >
                                  {filter.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}

                        <div className={styles.storyList}>
                          {filteredStories.map((story) => (
                            <button
                              key={story.id}
                              type="button"
                              className={styles.storyItem}
                              onClick={() => setOpenStoryId(story.id)}
                            >
                              <span className={styles.storyItemHead}>
                                {story.title}
                                <span className={styles.tar} aria-hidden="true">
                                  자세히
                                </span>
                              </span>
                              {story.hook ? (
                                <span className={styles.storyItemHook}>{story.hook}</span>
                              ) : null}
                              <span className={styles.storyItemMoods}>
                                {story.id === featured?.id ? (
                                  <span className={`${styles.tagline} ${styles.tagFeatured}`}>
                                    먼저 보여 드린 이야기
                                  </span>
                                ) : null}
                                {story.moodLabels.map((label) => (
                                  <span className={styles.tagline} key={label}>
                                    {label}
                                  </span>
                                ))}
                              </span>
                            </button>
                          ))}
                        </div>

                        {filteredStories.length === 0 ? (
                          <p className={styles.storyEmpty}>이 결의 이야기는 아직 없어요.</p>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : null}

                {/* ═══ 나라별 꽃말 — 이야기와 같은 블록에 붙인다(§1.5i) ═══ */}
                {option.cultureMeanings.length > 0 ? (
                  <>
                    <h3 className={styles.loreH}>나라별 꽃말</h3>
                    <dl className={styles.lore}>
                      {option.cultureMeanings.map((row) => (
                        <div className={styles.row} key={`${row.regionLabel}-${row.meaningKo}`}>
                          <dt>
                            {row.regionLabel}
                            {row.eraLabel ? ` · ${row.eraLabel}` : ''}
                          </dt>
                          <dd>
                            {row.meaningKo}
                            <br />
                            <span className={styles.petNote}>{row.confidenceLabel}</span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className={styles.loreNote}>
                      같은 꽃이 나라마다 다른 이야기를 품어요. 갈래가 나뉘는 해석은 표시해 드려요.
                    </p>
                  </>
                ) : null}
              </section>

              {/* ═══ ③ 추천 이유 · 이런 날 건네보세요 ═══ */}
              <section className={styles.optDetail} aria-label={`${option.nameKo} 추천 이유`}>
                <p className={styles.overline}>
                  Why <span className={styles.ko}>이 꽃을 고른 이유</span>
                </p>
                <ul className={styles.reasons}>
                  {option.reasons.length > 0 ? (
                    option.reasons.map((reason) => <li key={reason}>{reason}</li>)
                  ) : (
                    <li>들려주신 이야기와 어디 하나 부딪히지 않는 꽃이에요.</li>
                  )}
                </ul>

                {/* 안전에 걸리는 주의는 접지 않는다(§1.5h — 위계만 내리고 문구는 직설 유지) */}
                {option.otherCautions.map((caution) => (
                  <div className={styles.warn} key={caution}>
                    <span className={styles.wic} aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 4.4 21 19.6H3z" />
                        <path d="M12 10v4M12 16.7v.1" />
                      </svg>
                    </span>
                    <div>
                      <h4>먼저 봐주세요</h4>
                      <p>{caution}</p>
                    </div>
                  </div>
                ))}

                {option.occasions.length > 0 ? (
                  <>
                    <p className={styles.loreH}>이런 날 건네보세요</p>
                    <ul className={styles.occasions}>
                      {option.occasions.map((occasion) => (
                        <li key={occasion}>{occasion}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </section>

              {/* ═══ ④ 멘트 ═══ */}
              <section className={styles.sect} aria-labelledby="msg-h">
                <p className={styles.overline} id="msg-h">
                  Message <span className={styles.ko}>방금 도착한 멘트</span>
                </p>

                {/* 톤 고르기는 3안 고르기와 같은 일이다 — §1.6b 대로 같은 세그먼트를 쓴다 */}
                <div
                  className={`${styles.seg} ${styles.segTones}`}
                  role="tablist"
                  aria-label="멘트 톤 선택"
                  style={{
                    ['--i' as string]: tone,
                    ['--n' as string]: payload.tones.length,
                  }}
                >
                  <span className={styles.segThumb} aria-hidden="true" />
                  {payload.tones.map((item, index) => (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      id={`tone-tab-${index}`}
                      aria-controls="tone-panel"
                      aria-selected={index === tone}
                      tabIndex={index === tone ? 0 : -1}
                      onClick={() => setTone(index)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          moveTone(1);
                        }
                        if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          moveTone(-1);
                        }
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div
                  className={styles.tonePanel}
                  id="tone-panel"
                  role="tabpanel"
                  aria-labelledby={`tone-tab-${tone}`}
                  tabIndex={0}
                >
                  <p className={styles.toneHint}>{currentTone.hint}</p>
                  {/* 이 톤이 방금 쓰인 문장일 때만 세운다 — 예문과 구별되게(§1.5j). */}
                  {currentTone.source === 'llm' ? (
                    <p className={styles.trustBadge} style={{ marginTop: 12 }}>
                      당신의 이야기를 담아 썼어요
                    </p>
                  ) : null}
                  <div className={styles.msg}>
                    <h3 className="sr-only">{currentTone.label} 톤 멘트</h3>
                    {currentTone.body ? (
                      <>
                        {currentTone.headline ? (
                          <p>
                            <b>{currentTone.headline}</b>
                          </p>
                        ) : null}
                        <p>{currentTone.body}</p>
                      </>
                    ) : (
                      <p className={styles.msgEmpty}>{currentTone.emptyNote}</p>
                    )}
                  </div>
                  {currentTone.body ? (
                    <button
                      type="button"
                      className={styles.copy}
                      onClick={() => copy(toneCopyText, `tone-${tone}`)}
                    >
                      <IconCopy />
                      <span>{copied === `tone-${tone}` ? '복사했어요' : '복사'}</span>
                    </button>
                  ) : null}
                </div>

                <p className={styles.footNote}>{payload.messageNote}</p>
                {payload.toneOffNote ? (
                  <p className={styles.footNote}>{payload.toneOffNote}</p>
                ) : null}

                {/*
                  §1.5e 인용 한 줄 — 멘트가 주인공, 이건 곁들임.
                  #13 부터 **고른 톤을 따라간다**: 톤을 바꾸면 이 줄도 함께 바뀐다.
                  `aria-live` 를 두는 이유가 그것이다 — 화면을 못 보는 사람에게도 톤을
                  바꾼 결과가 여기까지 미쳤다는 사실이 전해져야 한다.
                */}
                <figure className={styles.qline} aria-live="polite">
                  <figcaption className={styles.qlineLab}>함께 담을 한 줄</figcaption>
                  <blockquote>
                    <p className={styles.qlineKo}>{cardLine.textKo}</p>
                  </blockquote>
                  <p className={styles.qlineBy}>{cardLine.attribution}</p>
                  <button
                    type="button"
                    className={`${styles.copy} ${styles.copySm}`}
                    aria-label="함께 담을 한 줄 복사"
                    onClick={() => copy(cardLine.textKo, 'quote')}
                  >
                    <IconCopy />
                    <span>{copied === 'quote' ? '복사했어요' : '복사'}</span>
                  </button>
                </figure>

                {/*
                  §1.5k 문학 속의 이 꽃 — 함께 담을 한 줄 바로 아래, 같은 "곁들임" 위계다.
                  서버가 발췌를 못 찾았거나 중복 배제에 걸리면 필드가 아예 없고, 그때는
                  블록도 서지 않는다(§1.5k "있을 때만"). 억지로 채우지 않는 것이 규칙이다.

                  #1 — 한 편 고정에서 **넘겨 보기**로 바뀌었다. 기본은 여전히 대표 한 편이고
                  (첫 화면이 목록이 되면 곁들임이 본문을 이긴다), '다른 문학도 보기'를 눌러야
                  이전/다음이 열린다. 나오는 차례는 서버가 정한다(작가 인터리브·언어권 분산).
                */}
                {currentLit ? (
                  <>
                    <figure className={styles.lit} aria-live="polite">
                      <figcaption className={styles.litLab}>
                        문학 속의 이 꽃
                        {currentLit.typeLabel ? (
                          <span className={styles.litType}>{currentLit.typeLabel}</span>
                        ) : null}
                      </figcaption>
                      <blockquote>
                        <p className={styles.litKo}>{currentLit.textKo}</p>
                      </blockquote>
                      {/* 원문 병기 — 번역으로는 살지 않는 것들이 여기 남는다(아크로스틱·AI AI) */}
                      {currentLit.textOriginal ? (
                        <p className={styles.litOrig}>{currentLit.textOriginal}</p>
                      ) : null}
                      <p className={styles.litBy}>
                        {currentLit.sourceUrl ? (
                          <a
                            className={styles.litLink}
                            href={currentLit.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {currentLit.attribution}
                          </a>
                        ) : (
                          currentLit.attribution
                        )}
                        {currentLit.translatorNote ? (
                          <>
                            <span className={styles.sep} aria-hidden="true">
                              ·
                            </span>
                            {currentLit.translatorNote}
                          </>
                        ) : null}
                      </p>
                      {/* 밝히지 않으면 서비스가 틀린 정보를 주게 되는 한 줄 */}
                      {currentLit.caveat ? (
                        <p className={styles.litCaveat}>{currentLit.caveat}</p>
                      ) : null}
                    </figure>

                    {literature.length > 1 ? (
                      <>
                        <button
                          type="button"
                          className={styles.teaser}
                          aria-expanded={litOpen}
                          aria-controls="lit-more"
                          onClick={() => setLitOpen(!litOpen)}
                        >
                          다른 문학도 보기 ({literature.length - 1})
                          <span className={styles.tar} aria-hidden="true">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12h13M12.5 6l6 6-6 6" />
                            </svg>
                          </span>
                        </button>

                        {litOpen ? (
                          <div className={styles.litNav} id="lit-more">
                            <button
                              type="button"
                              className={styles.litNavBtn}
                              onClick={() => moveLit(-1)}
                            >
                              앞 구절
                            </button>
                            <p className={styles.litCount}>
                              {litIndex + 1} / {literature.length}
                            </p>
                            <button
                              type="button"
                              className={styles.litNavBtn}
                              onClick={() => moveLit(1)}
                            >
                              다음 구절
                            </button>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : null}
              </section>

              {/* ═══ 공유·저장 (더미) ═══ */}
              <section className={`${styles.sect} ${styles.share}`} aria-label="공유하고 저장하기">
                <button type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
                  카드에 담기
                  <IconArrow />
                </button>
                <div className={styles.btnPair}>
                  <button type="button" className={`${styles.btn} ${styles.btnGhost}`}>
                    링크로 공유
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={onRestart}
                  >
                    다시 골라보기
                  </button>
                </div>
              </section>

              {/* ═══ ⑤ 최하단 참고 — 작게. 안전·계절·가격·구매는 "찾을 수 있으면 충분"(§1.5i) ═══ */}
              <section className={styles.sect} aria-labelledby="notes-h">
                <p className={styles.overline} id="notes-h">
                  Notes <span className={styles.ko}>참고</span>
                </p>

                <div className={styles.notes}>
                  {/* 반려동물은 소형 배지 1곳 + 접힌 상세가 전부다(§1.5h) */}
                  <div className={styles.noteLine}>
                    <span
                      className={`${styles.pet} ${
                        option.petBadge.toxic ? styles.petCare : styles.petSafe
                      }`}
                    >
                      {option.petBadge.label}
                    </span>
                    <span>{option.petBadge.summary}</span>
                    <details className={styles.petMore}>
                      <summary>자세히</summary>
                      <ul>
                        {option.petBadge.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                        {option.petCautions.map((caution) => (
                          <li key={caution}>{caution}</li>
                        ))}
                        {option.petBadge.alternatives.length > 0 ? (
                          <li>대신 권하는 꽃: {option.petBadge.alternatives.join(', ')}</li>
                        ) : null}
                      </ul>
                    </details>
                  </div>

                  <div className={styles.noteLine}>
                    {option.availabilityLabel}
                    {option.substitutes.length > 0
                      ? ` · 대신 ${option.substitutes.join(', ')}도 좋아요`
                      : ''}
                  </div>
                  <div className={styles.noteLine}>{option.fragranceLabel}</div>
                  {option.careSummary ? (
                    <div className={styles.noteLine}>{option.careSummary}</div>
                  ) : null}
                  {/*
                    가격은 한 줄 언급까지다 — 표·강조 금지(§1.5i).
                    #11 로 그 한 줄이 두 가지를 더 말한다:
                      · `₩ ₩₩ ₩₩₩` 세 칸을 다 세우고 이 꽃의 구간까지만 채운다
                        (셋 중 어디인지가 보여야 낮은 구간이 "부족"으로 읽히지 않는다)
                      · 가장 낮은 구간에는 §1.5d 톤 한마디를 붙인다
                    ⚠ 가격이 마음의 크기에 비례한다는 함의는 여전히 금지다.
                  */}
                  <div className={styles.noteLine}>
                    <span className={styles.priceBand} aria-hidden="true">
                      {PRICE_SLOTS.map((slot) => (
                        <span
                          key={slot}
                          className={slot <= option.priceBand ? styles.priceOn : styles.priceOff}
                        >
                          ₩
                        </span>
                      ))}
                    </span>
                    <span className="sr-only">가격대는 셋 중 {option.priceBand}번째예요.</span>
                    <span>
                      {option.priceLabel}
                      {option.priceNote ? (
                        <span className={styles.priceNote}> — {option.priceNote}</span>
                      ) : null}
                    </span>
                  </div>
                </div>

                {/*
                  ── 마지막 한 걸음 — 이 꽃 어디서 사지 (2026-08-17) ──────────────
                  사용자 신고 둘: "꽃집 연결되는 링크가 실제로 안 넘어간다",
                  "실제 해당 꽃을 살 수 있는 곳으로 연결해줘야 해".

                  여기 있던 두 줄은 둘 다 `href="#"` 였다 — 눌러도 페이지 맨 위로 튀고,
                  낭독기에는 멀쩡한 링크로 읽힌다(접근성 리뷰 P2-11).
                  `app/partners/page.tsx` 머리 주석 · `GroupPlanner.tsx` 와 같은 규범이다:
                  **아직 없는 길은 링크로 만들지 않는다.**

                  지금은 셋이고, 좁은 답에서 넓은 답 순이다:
                    ① 이 꽃 이름 그대로 공공 창구에서 찾아보기(우체국 꽃배달)
                    ② 이름을 들고 가까운 꽃집에 물어보기(지도)
                    ③ 우리가 실제로 확인해 둔 곳들(`/partners#florists`)
                  검색어를 만드는 규칙과 그렇게 고른 근거는 파일 위 `POST_FLOWER_SEARCH` 주석에
                  전부 적어 두었다 — **링크를 고치기 전에 반드시 읽어라.**

                  ⚠ 옛 둘째 줄(`내일 도착 꽃 배달 알아보기`)은 살리지 않았다. 우리가 배달을
                    주선하는 것처럼 읽혔지만 그런 수단이 없다. ①은 우체국이 **자기 서비스로**
                    배달하는 것이고, 우리는 그 창구를 가리킬 뿐이다.
                  ⚠ 제휴·할인·재고·배송 보장을 암시하는 문구로 되돌리지 마라. 넷 다 없다.

                  화살표는 두 종류다. 바깥으로 나가면 ↗(`IconExternal`), 같은 탭에서 열리는
                  우리 화면이면 →(`IconArrow`). 섞으면 어디로 가는지 거짓말이 된다.
                */}
                <div className={styles.aff} style={{ marginTop: 18 }}>
                  <a
                    href={`${POST_FLOWER_SEARCH}${encodeURIComponent(
                      `${mainName(option.nameKo)} 꽃배달`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={styles.txt}>
                      우체국 꽃배달에서 ‘{mainName(option.nameKo)}’ 찾아보기
                      <span className="sr-only"> (새 창)</span>
                    </span>
                    <span className={styles.ar} aria-hidden="true">
                      <IconExternal />
                    </span>
                  </a>
                  <a
                    href={`${MAP_FLORIST_SEARCH}${encodeURIComponent('꽃집')}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={styles.txt}>
                      가까운 꽃집 지도에서 찾아보기
                      <span className="sr-only"> (새 창)</span>
                    </span>
                    <span className={styles.ar} aria-hidden="true">
                      <IconExternal />
                    </span>
                  </a>
                  <Link href="/partners#florists" prefetch={false}>
                    <span className={styles.txt}>우리가 찾아본 곳들 — 먼저 알려 드리는 꽃집</span>
                    <span className={styles.ar} aria-hidden="true">
                      <IconArrow />
                    </span>
                  </Link>
                </div>
                {/*
                  ⚠ 이 두 줄은 링크와 한 몸이다. 위 셋 중 어느 것도 "여기 있어요"라고 말하지
                    못하기 때문에 둔 것이다 — 지우면 링크가 재고를 약속하는 말이 된다.
                    첫 줄은 빈손으로 돌아왔을 때의 다음 걸음을, 둘째 줄은 우리와 그곳들의
                    관계를 말한다. 둘째 줄은 `/partners` 의 `NO_AFFILIATION` 과 **같은 사실**을
                    말해야 한다 — 두 화면이 다른 말을 하면 어느 쪽도 믿을 수 없다.
                    제휴가 실제로 생기면 그 상수와 **함께** 고친다.
                    `tests/components/no-dead-links.test.ts` 가 둘이 어긋나는 것을 잡는다.
                */}
                <p className={styles.disc}>
                  꽃은 철 따라 들고 나요. 찾아본 곳에 없으면 가까운 꽃집에 ‘
                  {mainName(option.nameKo)}’ 있는지 물어보시는 게 제일 빨라요.
                </p>
                <p className={styles.disc}>
                  이어지는 곳들과 아직 제휴 관계는 아니에요 — 좋은 곳을 먼저 알려 드리는 거예요.
                </p>
              </section>
            </div>
          </div>

          <footer className={styles.foot}>
            <p>
              꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
              들려드려요.
            </p>
            <div className={styles.credits}>
              <h2>이 화면에 대하여</h2>
              <p>
                맨 위 사진은 그 꽃을 담은 한 컷이에요. 찍은 분의 이름은 사진 아래 ‘출처’에 적어
                두었어요. 꽃말과 이야기, 안전한지 아닌지는 갈래를 확인한 자료에서 가져와요.
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* 폰 프레임 밖(=.flow 바로 아래)에 세운다 — .phone 의 overflow:hidden 을 피하려고. */}
      {openStory ? (
        <StorySheet
          story={openStory}
          position={navIndex + 1}
          total={navStories.length}
          onPrev={() => moveStory(-1)}
          onNext={() => moveStory(1)}
          onClose={() => setOpenStoryId(null)}
        />
      ) : null}
    </>
  );
}
