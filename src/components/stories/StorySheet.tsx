'use client';

/**
 * 이야기 상세 시트 (§1.5i 규격).
 *
 * 결과 화면(`components/flow/ResultView.tsx`)에도 같은 규격의 시트가 있지만, 그쪽은
 * 폰 프레임(430px) 안에 갇힌 바텀 시트라 아카이브의 넓은 화면에는 맞지 않는다.
 * 코드를 끌어다 쓰는 대신 규격만 그대로 지켜 여기서 다시 세웠다 —
 * 모바일은 바텀 시트, 768px 위에서는 가운데 카드로 갈린다(CSS 가 처리).
 *
 * 접근성 네 가지는 직접 챙긴다: `aria-modal`, 포커스 트랩(Tab 순환), ESC·배경 탭 닫기,
 * body 스크롤 잠금. 등장 모션은 CSS 애니메이션이라 `prefers-reduced-motion` 전역
 * 규칙(globals.css)이 알아서 0 으로 만든다.
 */

import { useEffect, useRef, type KeyboardEvent } from 'react';

import styles from './stories.module.css';
import type { ArchiveStory } from './types';

function IconClose() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export interface StorySheetProps {
  story: ArchiveStory;
  /** 필터를 통과한 이야기 안에서의 자리(1부터). */
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

export default function StorySheet({
  story,
  position,
  total,
  onPrev,
  onNext,
  onClose,
}: StorySheetProps) {
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

  // 이전/다음으로 넘길 때마다 본문을 맨 위로 올리고 제목에 포커스를 준다(스크린리더가 새 이야기를 읽게).
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

  /** 문화권·시대는 한 칸에 묶는다 — 둘 다 없으면 칸 자체를 세우지 않는다. */
  const place = [story.regionLabel, story.eraLabel].filter((part) => Boolean(part)).join(' · ');

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

        <div className={styles.sheetBody} ref={bodyRef}>
          <p className={styles.sheetFlower}>{story.flowerNameKo}</p>
          <h2 className={styles.sheetTitle} id="story-sheet-title" tabIndex={-1} ref={titleRef}>
            {story.title}
          </h2>

          {/* §1.5i 상세 순서: hook(티저) → 전문 → 문화권·시대 → 갈래 라벨 → 출처 각주 */}
          {story.hook ? <p className={styles.sheetHook}>{story.hook}</p> : null}
          <p className={styles.sheetText}>{story.body}</p>

          <p className={styles.sheetTags}>
            {place ? <span className={styles.tag}>{place}</span> : null}
            <span className={story.isOriginal ? `${styles.tag} ${styles.tagOriginal}` : styles.tag}>
              {story.typeLabel}
            </span>
            <span className={styles.tag}>{story.confidenceLabel}</span>
          </p>

          {story.moodLabels.length > 0 ? (
            <p className={styles.sheetTags}>
              {story.moodLabels.map((label) => (
                <span className={`${styles.tag} ${styles.tagMood}`} key={label}>
                  {label}
                </span>
              ))}
            </p>
          ) : null}

          {story.sourceTitle ? (
            <p className={styles.sourceNote}>
              이야기의 갈래 —{' '}
              {story.sourceUrl ? (
                <a
                  className={styles.sourceLink}
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
          <button type="button" className={styles.sheetNavBtn} onClick={onPrev} disabled={total < 2}>
            이전 이야기
          </button>
          <button type="button" className={styles.sheetNavBtn} onClick={onNext} disabled={total < 2}>
            다음 이야기
          </button>
        </div>
      </div>
    </div>
  );
}
