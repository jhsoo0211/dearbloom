'use client';

/**
 * 탄생화 사전 상세(라이트) 시트 — 도감에 아직 없는 꽃 한 장(§1.5m ⑤).
 *
 * ── 왜 상세 **페이지**가 아닌가 ──────────────────────────────────────
 * 사전 항목에 있는 것은 이름·영문명·학명·꽃말·놓인 날·출처가 전부다. 그 여섯 줄로
 * `/flowers/[slug]` 같은 한 장을 세우면 **정식 도감과 같은 무게로 읽힌다** — 사진도
 * 이야기도 안전성도 없는 페이지가 도감 상세인 척하게 된다. 그래서 열람은 시트로 끝내고,
 * 티어 고지 두 줄(`BIRTH_DICT_TIER*`)을 그 안에 붙인다. 승격되면 그때 진짜 상세가 생긴다.
 *
 * ── 왜 여기서 다시 가져오지 않나 ─────────────────────────────────────
 * `StorySheet` 는 전문을 열 때 서버에 물어본다(317편 전문이 첫 응답에 실리면 275KB 였다).
 * 여기는 반대다 — 사전 한 줄이 통째로 200바이트 남짓이라, 이미 받은 달치 목록 안에
 * 시트가 쓸 것이 전부 들어 있다. 한 번 더 왕복하면 대기 상태만 늘고 얻는 것이 없다.
 *
 * 접근성 네 가지는 `StorySheet` 와 같은 방식으로 직접 챙긴다: `aria-modal`,
 * 포커스 트랩(Tab 순환), ESC·배경 탭 닫기, body 스크롤 잠금. 등장 모션은 CSS 애니메이션이라
 * `prefers-reduced-motion` 전역 규칙(globals.css)이 알아서 0 으로 만든다.
 */

import { useEffect, useRef, type KeyboardEvent } from 'react';

import {
  BIRTH_DICT_ALSO_ON,
  BIRTH_DICT_SOURCE,
  BIRTH_DICT_TIER,
  BIRTH_DICT_TIER_SUB,
  BIRTH_SOURCE_NOTE,
} from './birth-copy';
import styles from './flowers.module.css';
import type { BirthDictEntry } from './types';

interface BirthDictSheetProps {
  entry: BirthDictEntry;
  onClose: () => void;
}

export default function BirthDictSheet({ entry, onClose }: BirthDictSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // 열려 있는 동안 뒤 화면이 따라 스크롤되지 않게 잠그고, 닫으면 부르던 자리로 포커스를 돌린다.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

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

  const latin = [entry.nameEn, entry.scientificName].filter(Boolean).join(' · ');

  return (
    <div className={styles.dictSheetRoot}>
      {/* 배경 탭으로도 닫힌다 — 같은 동작을 하는 닫기 버튼이 시트 안에 있어 여기는 장식이다. */}
      <div className={styles.dictScrim} onClick={onClose} aria-hidden="true" />

      <div
        className={styles.dictSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="birth-dict-sheet-title"
        ref={sheetRef}
        onKeyDown={onKeyDown}
      >
        <span className={styles.dictGrip} aria-hidden="true" />

        <div className={styles.dictSheetHead}>
          <p className={styles.dictSheetDate}>{entry.dateLabel}</p>
          <button
            type="button"
            className={styles.dictClose}
            onClick={onClose}
            aria-label="탄생화 사전 닫기"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.dictSheetBody}>
          <h3 className={styles.dictSheetName} id="birth-dict-sheet-title" tabIndex={-1} ref={titleRef}>
            {entry.nameKo}
          </h3>
          {latin && <p className={styles.dictSheetLatin}>{latin}</p>}

          <p className={styles.dictSheetMeaning}>
            꽃말은 ‘{entry.meaning}’{entry.meaningCopula}.
          </p>

          {/* 같은 이름이 하루뿐이면 키 자체가 없다 — 빈 줄을 남기지 않는다. */}
          {entry.alsoOn && (
            /* 머리말과 날짜 사이는 **글자로** 갈라야 한다 — 여백만 주면 눈에는 떨어져
               보여도 낭독기는 `다른 날1월 20일` 로 붙여 읽는다(출처 줄과 같은 대시). */
            <p className={styles.dictSheetDays}>
              <span className={styles.dictSheetDaysHead}>{BIRTH_DICT_ALSO_ON} —</span>{' '}
              {entry.alsoOn}
            </p>
          )}

          {/*
            티어 고지 — 이 블록이 사전과 정식 도감을 가르는 자리다(§1.5m ⑤).
            둘째 줄(안전성 미확인)을 지우지 마라: 반려동물 안전은 직설이 옳다(§1.5h).
          */}
          <div className={styles.dictSheetTier}>
            <p className={styles.dictSheetTierLine}>{BIRTH_DICT_TIER}</p>
            <p className={styles.dictSheetTierSub}>{BIRTH_DICT_TIER_SUB}</p>
          </div>

          <p className={styles.dictSheetSource}>
            {BIRTH_DICT_SOURCE} —{' '}
            <a
              className={styles.dictSourceLink}
              href={entry.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {entry.sourceLabel}
              <span className={styles.srOnly}> (새 창)</span>
            </a>
          </p>

          {/* 계보 각주 — 워딩 대전제의 자리(§1.5m ①). 지우지 마라. */}
          <p className={styles.dictSheetNote}>{BIRTH_SOURCE_NOTE}</p>
        </div>
      </div>
    </div>
  );
}
