'use client';

/**
 * 열람 연출 — 봉투가 열리고 편지가 떠오른다.
 *
 * ── 무엇으로 만들었나 ────────────────────────────────────────────────
 * **CSS 3D 뿐이다**(`transform-style: preserve-3d`). three.js 도 GSAP 도 부르지 않는다 —
 * 이 화면이 하는 일은 사각형 넉 장을 축 하나로 젖히는 것이고, 그 일에 3D 엔진을 부르면
 * 편지 한 통을 열자고 수백 KB 를 내려받게 된다. 봉투의 모양·타이밍은 letter.module.css 가 갖고,
 * 이 파일은 **단계(sealed → open)만** 든다.
 *
 * ── 세 갈래 (랜딩 게이트와 같은 규율) ────────────────────────────────
 *   ① `prefers-reduced-motion: reduce` → 연출을 **아예 시작하지 않는다.** 첫 렌더부터 편지다.
 *      (`다시 보기` 버튼도 세우지 않는다 — 되돌려 볼 연출이 없다.)
 *   ② 정상 → 2.4초 뒤 편지로 넘어간다.
 *   ③ 애니메이션이 한 프레임도 안 돌아도 → 편지는 **이미 DOM 에 있고** 타이머가 단계를
 *      넘긴다. `animationend` 에 매달지 않은 이유다(그 이벤트가 안 오면 편지가 영영 안 열린다).
 *
 * 낭독기에게는 연출이 없다. 봉투는 전부 `aria-hidden` 이고 편지 본문은 처음부터 트리에 있다 —
 * 눈으로 보는 사람만 2.4초를 기다린다.
 */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import type { Letter } from '@/lib/letters/types';
import LetterSheet from './LetterSheet';
import styles from './letter.module.css';
import type { LetterFlowerOption } from './types';

/** 봉투가 열리는 데 걸리는 시간. letter.module.css 의 애니메이션 합계(0.26s+0.9s / 0.95s+1.2s)와 짝이다. */
const REVEAL_MS = 2400;

function IconClose() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      /* §1.6b 아이콘 버튼 — 스트로크 1.6(다른 화면의 닫기와 같은 굵기) */
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export interface LetterRevealProps {
  letter: Letter;
  flower?: LetterFlowerOption;
  onClose: () => void;
  /** 만든 사람이 자기 편지를 미리 열어 보는 경우. 안내 한 줄이 달라진다. */
  ownPreview?: boolean;
}

export default function LetterReveal({ letter, flower, onClose, ownPreview }: LetterRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  /**
   * 연출을 재생할 것인가. **첫 렌더에서 정한다** — 상태를 나중에 뒤집으면
   * reduced-motion 사용자도 봉투를 한 프레임 보게 된다.
   * (이 컴포넌트는 사용자가 `열기` 를 누른 뒤에만 마운트되므로 서버 렌더를 거치지 않는다.
   *  그래도 `typeof window` 를 확인하는 것은 값싼 보험이다.)
   */
  const animates = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const [phase, setPhase] = useState<'sealed' | 'open'>(animates ? 'sealed' : 'open');
  /**
   * `다시 보기` 세는 값 — **봉투의 key 로 쓴다.**
   * CSS 애니메이션은 `fill: both` 로 끝난 자리에 멈춰 있어서, 단계만 되돌리면 봉투가
   * "이미 열린 채" 다시 나타난다. key 를 바꿔 봉투를 새로 심으면 처음부터 다시 열린다.
   */
  const [replays, setReplays] = useState(0);

  function replay() {
    setReplays((count) => count + 1);
    setPhase('sealed');
  }

  // 단계 넘김은 **타이머 하나**다(위 ③ — animationend 에 매달지 않는다).
  useEffect(() => {
    if (phase !== 'sealed') return;
    const timer = window.setTimeout(() => setPhase('open'), REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // 열려 있는 동안 뒤 화면이 따라 스크롤되지 않게 잠그고, 닫으면 부르던 자리로 포커스를 돌린다.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    rootRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  /**
   * ESC 로 닫고, Tab 은 이 안에서 돈다.
   * `aria-modal="true"` 는 "밖은 없는 셈 친다" 는 **약속**이라, 포커스가 뒤 화면으로 새면
   * 그 약속이 거짓이 된다(`FlowerPicker`·`StorySheet` 와 같은 규격을 그대로 지킨다).
   */
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = rootRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const heading = letter.title?.trim() ?? '';
  const label = heading !== '' ? `${heading} — 편지` : `${letter.recipientName}에게 온 편지`;

  return (
    <div
      className={styles.revealRoot}
      data-phase={phase}
      data-testid="letter-reveal"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      ref={rootRef}
      onKeyDown={onKeyDown}
    >
      <span className={styles.revealScrim} aria-hidden="true" />

      <div className={styles.revealBar}>
        <p className={styles.revealHint}>
          {ownPreview ? '받는 분에게는 이렇게 보여요.' : '조용한 자리에서 읽어 보세요.'}
        </p>
        <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="편지 닫기">
          <IconClose />
        </button>
      </div>

      <div className={styles.revealInner}>
        {/* 봉투 — 장식이다. 낭독기는 이 아래 편지를 곧바로 읽는다. */}
        <div className={styles.stage} key={replays} aria-hidden="true">
          {/* 봉투도 편지지와 **같은 색 토큰**을 단다(`paperTheme`) — 둘은 형제라 상속되지 않는다. */}
          <div
            className={`${styles.envelope} ${styles.paperTheme}`}
            data-letter-theme={letter.theme}
          >
            <span className={styles.envBack} />
            <span className={styles.envPaper} />
            <span className={styles.envLining} />
            <span className={styles.envFront} />
            <span className={styles.envFlap} />
            <span className={styles.envSeal}>편지</span>
          </div>
        </div>

        <div className={styles.letterWrap}>
          <LetterSheet
            recipientName={letter.recipientName}
            {...(letter.title ? { title: letter.title } : {})}
            body={letter.body}
            signature={letter.signature}
            theme={letter.theme}
            {...(flower ? { flower } : {})}
          />
        </div>
      </div>

      <div className={`${styles.revealBar} ${styles.revealBarEnd}`}>
        {/* 연출이 없는 사람에게는 되돌려 볼 것도 없다(위 ①). */}
        {animates && phase === 'open' ? (
          <button type="button" className={styles.ghost} onClick={replay}>
            다시 보기
          </button>
        ) : null}
        <button type="button" className={styles.ghost} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
