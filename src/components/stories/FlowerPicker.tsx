'use client';

/**
 * `꽃 고르기` 시트 — 31종을 계열별로 묶어 놓고, 이름으로 찾아 그 레인으로 건너뛴다.
 *
 * ── 왜 시트인가 (2026-08-15 사용자 지시: "선택지가 너무 많다") ─────────
 * 예전에는 꽃 31칸이 필터 바에 그대로 서 있었다. 390px 화면에서 여섯 줄로 접혀
 * 바가 화면의 65%를 먹었고, 무엇을 고르든 **고르기 전에 31개를 읽어야** 했다.
 * 지금은 필터 바에 계열 5칸만 남기고(=거르기), 꽃 한 종을 콕 집는 일은 이 시트가 맡는다
 * (=찾기). 늘 보이던 것을 필요할 때만 꺼내는 쪽으로 옮긴 것이지 기능을 뺀 것이 아니다.
 *
 * 접근성은 `StorySheet` 와 **같은 네 가지**를 그대로 지킨다 — `aria-modal`, 포커스 트랩,
 * ESC·배경 탭 닫기, body 스크롤 잠금. 코드를 공유하지 않고 규격을 지키는 방식도 같다
 * (StorySheet 주석 참고 — 두 시트는 내용물이 달라 한 컴포넌트로 묶으면 조건문만 늘어난다).
 *
 * ⚠ 여기서는 도판(세밀화)을 걸지 않는다. 목록이 31줄이라 열자마자 31장을 한꺼번에
 *   요청하게 되는데, 위키미디어는 그런 연속 요청에 429 를 돌려준다
 *   (docs/illustration-assets.md 배포 규칙 2). 도판은 레인 헤더와 상세 시트에만 건다.
 */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { STORY_CATEGORIES } from './categories';
import styles from './stories.module.css';

function IconClose() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      /* §1.6b 아이콘 버튼 — 스트로크 1.6(레인 화살표·이야기 시트와 같은 굵기) */
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/** 시트에 세우는 꽃 한 칸. 편수는 **지금 결 필터를 통과한** 수다. */
export interface PickableFlower {
  flowerId: string;
  nameKo: string;
  /** 계열 키(§1.4c) — 묶음의 기준. */
  category: string;
  count: number;
}

export interface FlowerPickerProps {
  flowers: PickableFlower[];
  /** 결 필터가 걸려 있으면 그 이름. 목록이 왜 줄었는지 한 줄로 밝히는 데 쓴다. */
  moodLabel?: string;
  onPick: (flowerId: string) => void;
  onClose: () => void;
}

/** 검색 정규화 — 대소문자·공백만 지운다(이름 부분 일치). */
function fold(input: string): string {
  return input.toLowerCase().replace(/\s+/g, '');
}

export default function FlowerPicker({ flowers, moodLabel, onPick, onClose }: FlowerPickerProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

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

  // 열면 곧바로 칠 수 있게 — 이 시트의 첫 일은 "찾기" 다.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const matched = useMemo(() => {
    const needle = fold(query);
    if (!needle) return flowers;
    return flowers.filter((flower) => fold(flower.nameKo).includes(needle));
  }, [flowers, query]);

  /** 계열 순서(§1.4c)대로 묶는다. 비어 있는 묶음은 세우지 않는다. */
  const groups = useMemo(
    () =>
      STORY_CATEGORIES.map((category) => ({
        category,
        items: matched.filter((flower) => flower.category === category.key),
      })).filter((group) => group.items.length > 0),
    [matched],
  );

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = sheetRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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
      <div className={styles.sheetScrim} onClick={onClose} aria-hidden="true" />

      <div
        className={`${styles.sheet} ${styles.pickerSheet}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flower-picker-title"
        data-testid="flower-picker"
        ref={sheetRef}
        onKeyDown={onKeyDown}
      >
        <span className={styles.sheetGrip} aria-hidden="true" />

        <div className={styles.sheetHead}>
          <h2 className={styles.pickerTitle} id="flower-picker-title">
            꽃 고르기
          </h2>
          <button
            type="button"
            className={styles.sheetClose}
            onClick={onClose}
            aria-label="꽃 고르기 닫기"
          >
            <IconClose />
          </button>
        </div>

        <div className={styles.pickerSearch}>
          <label className={styles.srOnly} htmlFor="flower-picker-q">
            꽃 이름으로 찾기
          </label>
          <input
            id="flower-picker-q"
            className={styles.pickerInput}
            ref={inputRef}
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder="꽃 이름으로 찾아보세요"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <p className={styles.pickerHint} aria-live="polite" data-testid="picker-count">
            {matched.length}종
            {moodLabel ? (
              <span className={styles.pickerHintTail}>
                · ‘{moodLabel}’ 이야기가 있는 꽃만 보여드려요
              </span>
            ) : null}
          </p>
        </div>

        <div className={styles.pickerBody}>
          {groups.length > 0 ? (
            groups.map(({ category, items }) => (
              <section className={styles.pickerGroup} key={category.key}>
                <h3 className={styles.pickerGroupHead}>
                  {category.label}
                  <span className={styles.pickerGroupHint}>{category.hint}</span>
                </h3>
                <ul className={styles.pickerList}>
                  {items.map((flower) => (
                    <li key={flower.flowerId}>
                      <button
                        type="button"
                        className={styles.pickerItem}
                        data-testid="picker-item"
                        data-flower={flower.flowerId}
                        aria-label={`${flower.nameKo} 이야기 ${flower.count}편으로 건너뛰기`}
                        onClick={() => onPick(flower.flowerId)}
                      >
                        <span className={styles.pickerName}>{flower.nameKo}</span>
                        <span className={styles.pickerNum} aria-hidden="true">
                          {flower.count}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <p className={styles.pickerEmpty}>
              그 이름의 꽃은 아직 없어요. 이름 일부만 적어도 찾아드려요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
