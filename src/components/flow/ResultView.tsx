'use client';

/**
 * 결과 화면 — 확정 시안 `design/app-v3/result.html` 을 실데이터로 옮긴 것.
 *
 * 위계는 §1.5i 가 확정한 5단이다(위 → 아래):
 *   ① 꽃(3D) + 이름 + 꽃말 (+ 색 다시 고르기)
 *   ② 꽃에 얽힌 설화 + 나라별 꽃말   ← 멘트보다 위. "정보"보다 "이야기"가 먼저다
 *   ③ 추천 이유 · 이런 날 건네보세요
 *   ④ 멘트 3톤 + 함께 담을 한 줄
 *   ⑤ 최하단 참고(작게) — 반려동물 배지 · 계절 · 향 · 관리 · 가격 1줄 · 제휴 고지
 *
 * 값은 전부 서버가 만들어 준 `ResultPayload` 다. 여기서 문장을 새로 지어내지 않는다
 * (라벨 사전·엔진·카탈로그는 서버 쪽에만 있다).
 */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';

import FlowerViewer from './FlowerViewer';
import type { FlowerForm, ResultPayload, StoryCard } from './types';
import styles from './flow.module.css';

/** 색 정보가 없는 꽃에 쓰는 형태별 기본 꽃잎 색(확정 시안 값). */
const FORM_PETAL: Record<FlowerForm, string> = {
  rose: '#B5768A',
  tulip: '#E9E1D3',
  spike: '#7E71A0',
};

/** 형태별 림라이트 — §1.4 팔레트 안에서 고른다. */
const FORM_RIM: Record<FlowerForm, string> = {
  rose: '#8A3448',
  tulip: '#C8963E',
  spike: '#83779C',
};

/** 무대 배경의 마지막 색면. */
const FORM_TONE: Record<FlowerForm, string> = {
  rose: 'rgba(138, 52, 72, 0.20)',
  tulip: 'rgba(200, 150, 62, 0.22)',
  spike: 'rgba(131, 119, 156, 0.34)',
};

/** 결 필터의 `전체` 칸 — 서버가 내려보내는 필터 목록의 첫 값과 같은 key 다. */
const MOOD_ALL = 'all';

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

  const viewerFlowers = useMemo(
    () =>
      payload.options.map((item, index) => {
        const picked = item.colors[colorIndex[index]];
        return {
          form: item.form,
          colorHex: picked?.hex ?? FORM_PETAL[item.form],
          rimHex: FORM_RIM[item.form],
          stageTone: FORM_TONE[item.form],
          alt: item.nameKo,
        };
      }),
    [payload.options, colorIndex],
  );

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

  /** 다른 안으로 갈아탈 때 이야기 상태(펼침·필터·시트)는 초기화한다 — 꽃이 바뀌면 이야기도 다르다. */
  function selectOption(next: number) {
    setActive(next);
    setStoriesOpen(false);
    setMoodFilter(MOOD_ALL);
    setOpenStoryId(null);
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
            우단만 스크롤한다(설화 → 나라별 → 이유 → 멘트 → 참고). 모바일에서는 이
            래퍼들이 그냥 블록이라 **DOM 순서 = 지금까지의 한 칼럼 순서** 그대로다.
            좌/우를 나눈 자리가 하필 탭 패널 한가운데라, 패널을 둘로 나누고 탭의
            aria-controls 가 두 id 를 함께 가리키게 했다(둘 다 이 탭이 바꾸는 영역이다).
          */}
          <div className={styles.two}>
            <div className={styles.colA}>
              <div className={styles.colAInner}>

                {/* ═══ ① 꽃 — 주인공 ═══ */}
                <FlowerViewer flowers={viewerFlowers} activeIndex={active} tag={option.segmentTag} />

                <ul className={styles.ctx} aria-label="입력한 조건">
                  {payload.contextChips.map((chipText) => (
                    <li key={chipText}>{chipText}</li>
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
                            ? `${chip.label} 꽃말은 아직 출처를 찾는 중이에요.`
                            : '이 꽃의 꽃말은 아직 모으는 중이에요. 출처를 찾는 대로 들려드릴게요.'}
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

              {/* ═══ ② 꽃에 얽힌 설화 — 멘트보다 위(§1.5i) ═══ */}
              <section className={styles.sect} aria-labelledby="story-h">
                <p className={styles.overline} id="story-h">
                  Lore <span className={styles.ko}>꽃에 얽힌 설화</span>
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

                {/* ═══ 나라별 꽃말 — 설화와 같은 블록에 붙인다(§1.5i) ═══ */}
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
                    <li>고르신 조건에서 크게 어긋나는 데가 없는 꽃이에요.</li>
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

                {/* §1.5e 인용 한 줄 — 멘트가 주인공, 이건 곁들임 */}
                <figure className={styles.qline}>
                  <figcaption className={styles.qlineLab}>함께 담을 한 줄</figcaption>
                  <blockquote>
                    <p className={styles.qlineKo}>{payload.quote.textKo}</p>
                  </blockquote>
                  <p className={styles.qlineBy}>{payload.quote.attribution}</p>
                  <button
                    type="button"
                    className={`${styles.copy} ${styles.copySm}`}
                    aria-label="함께 담을 한 줄 복사"
                    onClick={() => copy(payload.quote.textKo, 'quote')}
                  >
                    <IconCopy />
                    <span>{copied === 'quote' ? '복사했어요' : '복사'}</span>
                  </button>
                </figure>
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
                  {/* 가격은 한 줄 언급까지다 — 표·강조 금지(§1.5i) */}
                  <div className={styles.noteLine}>{option.priceLabel}</div>
                </div>

                <div className={styles.aff} style={{ marginTop: 18 }}>
                  <a href="#">
                    <span className={styles.txt}>이 꽃 주문하러 가기 — 제휴 꽃집 보기</span>
                    <span className={styles.ar} aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 17 17 7M8.6 7H17v8.4" />
                      </svg>
                    </span>
                  </a>
                  <a href="#">
                    <span className={styles.txt}>내일 도착 꽃 배달 알아보기</span>
                    <span className={styles.ar} aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 17 17 7M8.6 7H17v8.4" />
                      </svg>
                    </span>
                  </a>
                </div>
                <p className={styles.disc}>구매 링크는 제휴 링크로 연결돼요.</p>
              </section>
            </div>
          </div>

          <footer className={styles.foot}>
            <p>
              꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
              들려드려요.
            </p>
            <div className={styles.credits}>
              <h2>About this view</h2>
              <p>
                이 화면의 꽃은 사진이 아니라 절차적으로 그린 3D 모델이에요. 꽃말·이야기·안전
                정보는 출처를 확인한 콘텐츠에서 가져옵니다.
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
