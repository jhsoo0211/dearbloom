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
 *
 * ── 본문 우선 (§1.5i 2026-08-15 사용자 16차) ──────────────────────────
 * 열자마자 보이는 첫 화면이 **이야기**여야 한다. 예전에는 본문 뒤에 꼬리표 칩이 두 줄로
 * 붙어 있었고 문화권·시대가 갈래·신뢰와 같은 무게였는데, 그러면 짧은 이야기에서는
 * 분류표가 화면의 절반을 차지한다. 지금은 본문이 끝난 뒤 헤어라인 하나를 긋고
 * **각주 블록**(작은 한 줄 + 출처)으로 접는다 — 찾으면 있고, 먼저 읽히지는 않는다.
 * ⚠ 메타를 본문 위로 다시 올리지 마라.
 *
 * ── 전문은 열 때 가져온다 (성능 리뷰 P1-7, 2026-08-15) ────────────────
 * 이야기 317편의 **전문**이 첫 응답에 통째로 실려 인라인 RSC payload 가 275KB 였다
 * (파싱만으로 롱태스크 107~124ms). 카드가 쓰는 것은 제목과 hook 뿐이고 전문은 이 시트를
 * 연 한 편만 읽히므로, 그 한 편을 서버 액션(`app/stories/actions.ts`)으로 그때 부른다.
 *   · 기다리는 동안 — 이야기 톤의 한 줄(`.sheetWait`). 스피너를 돌리지 않는다(아카이브의
 *     톤에 맞지 않고, 대개 한 프레임 만에 끝나 깜빡임만 남는다).
 *   · 실패하면 — 빈 시트 대신 폴백 한 줄과 다시 여는 길을 남긴다.
 *   · 이전/다음으로 넘기면 `story.id` 가 바뀌므로 그때마다 다시 부른다. 늦게 도착한 응답이
 *     이미 넘어간 이야기 위에 덮이지 않도록 **id 를 맞춰 보고** 버린다.
 */

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { loadStoryDetail } from '@/app/stories/actions';
import type { PlateView } from '@/lib/plates/view';
import PlateFrame from './PlateFrame';
import { metaNotes } from './meta';
import styles from './stories.module.css';
import type { ArchiveStory, StoryDetail } from './types';

function IconClose() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      /* §1.6b 아이콘 버튼 — 스트로크 1.6(레인 화살표와 같은 굵기) */
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export interface StorySheetProps {
  story: ArchiveStory;
  /** 그 꽃의 세밀화 — 서버가 좁혀 준 한 벌(레인이 들고 있던 것을 그대로 받는다). */
  plate?: PlateView;
  /** 필터를 통과한 이야기 안에서의 자리(1부터). */
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

/** 전문을 가져오는 중인지 · 왔는지 · 실패했는지. */
type LoadState = 'loading' | 'ready' | 'failed';

export default function StorySheet({
  story,
  plate,
  position,
  total,
  onPrev,
  onNext,
  onClose,
}: StorySheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [detail, setDetail] = useState<StoryDetail | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  /** 다시 부를 때마다 늘려 effect 를 되돌린다("다시 펼쳐 볼까요" 가 실제로 다시 부르게). */
  const [attempt, setAttempt] = useState(0);

  /**
   * 이전/다음으로 넘어갔다 — 지금 들고 있는 본문은 **다른 이야기의 것**이다.
   *
   * effect 에서 `setState('loading')` 로 되돌리면 한 프레임 동안 옛 본문이 새 제목 아래
   * 붙어 보인다(그리고 `react-hooks/set-state-in-effect` 에 걸린다). React 가 권하는
   * **렌더 중 파생 상태 보정**을 쓴다 — 이 렌더는 커밋되지 않고 즉시 다시 돈다.
   * (`StoryLane` 이 필터 교체 때 쓰는 것과 같은 수법이다.)
   */
  const [loadedFor, setLoadedFor] = useState(story.id);
  if (loadedFor !== story.id) {
    setLoadedFor(story.id);
    setDetail(null);
    setState('loading');
  }

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

  /**
   * 전문 가져오기 — 열 때 한 번, 이전/다음으로 넘길 때마다 다시.
   *
   * ⚠ `cancelled` 플래그가 하는 일은 두 가지다: 언마운트 뒤 setState 를 막고, **빠르게
   *   넘긴 사람**에게 옛 이야기의 본문이 뒤늦게 덮이는 것을 막는다(응답 순서는 보장되지 않는다).
   */
  useEffect(() => {
    let cancelled = false;

    loadStoryDetail(story.id)
      .then((row) => {
        if (cancelled) return;
        if (row && row.id === story.id) {
          setDetail(row);
          setState('ready');
        } else {
          setState('failed');
        }
      })
      .catch(() => {
        if (!cancelled) setState('failed');
      });

    return () => {
      cancelled = true;
    };
  }, [story.id, attempt]);

  // 이전/다음으로 넘길 때마다 본문을 맨 위로 올리고 제목에 포커스를 준다(스크린리더가 새 이야기를 읽게).
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    titleRef.current?.focus();
  }, [story.id]);

  /** 다시 부른다 — 상태 되돌리기는 **이벤트 핸들러 안**이라 effect 규칙에 걸리지 않는다. */
  const retry = useCallback(() => {
    setDetail(null);
    setState('loading');
    setAttempt((n) => n + 1);
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

  /** 본문 **아래** 각주 줄 — 문화권 · 시대 · 갈래 · 신뢰(§1.5i 16차). 카드와 같은 순서다. */
  const notes = metaNotes(story);

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
          {/*
            §1.5i 상세 순서(2026-08-15 사용자 16차):
              꽃 이름·결 칩 → 제목 → hook(티저) → 전문 → **각주 블록**(문화권·시대·갈래·신뢰
              → 출처)
            열자마자 눈에 오는 것이 이야기여야 한다 — 메타를 본문 위로 올리지 마라.
          */}
          {/*
            머리 = 왼쪽 글, 오른쪽 도판.
            도판은 **본문보다 작게, 본문 옆에** 둔다 — 위계는 이야기가 먼저다(§1.5i).
            도판 위에 글자를 얹지 않는 것도 규칙이다(illustration-assets 사용 규칙 3:
            밝은 크림 판면 위에서는 아이보리 타이포가 완전히 죽는다).
          */}
          <div className={styles.sheetLede}>
            <div className={styles.sheetLedeMain}>
              <div className={styles.sheetTop}>
                <p className={styles.sheetFlower}>{story.flowerNameKo}</p>
                {story.moodLabels.map((label) => (
                  <span className={`${styles.tag} ${styles.tagMood}`} key={label}>
                    {label}
                  </span>
                ))}
              </div>

              <h2 className={styles.sheetTitle} id="story-sheet-title" tabIndex={-1} ref={titleRef}>
                {story.title}
              </h2>
            </div>

            {plate ? <PlateFrame plate={plate} variant="card" key={plate.flowerId} /> : null}
          </div>

          {story.hook ? <p className={styles.sheetHook}>{story.hook}</p> : null}

          {/*
            전문 — 서버 액션이 가져온다. 기다림·실패도 이야기 톤의 한 줄로 말한다.
            자리(min-height)를 미리 잡아 두어 본문이 도착할 때 각주가 크게 밀리지 않게 한다.
          */}
          {state === 'ready' && detail ? (
            <p className={styles.sheetText} data-testid="sheet-text">
              {detail.body}
            </p>
          ) : (
            <p
              className={styles.sheetWait}
              data-testid="sheet-wait"
              data-state={state}
              aria-live="polite"
            >
              {state === 'loading' ? (
                '이야기를 펼치는 중이에요…'
              ) : (
                <>
                  이야기를 펼치지 못했어요.{' '}
                  <button type="button" className={styles.sheetRetry} onClick={retry}>
                    다시 펼쳐 볼까요
                  </button>
                </>
              )}
            </p>
          )}

          <div className={styles.sheetNote} data-testid="sheet-note">
            <p className={styles.noteLine}>
              {notes.map((note, index) => (
                <span key={note.key}>
                  {index > 0 ? <span aria-hidden="true"> · </span> : null}
                  <span className={note.accent ? styles.noteOn : undefined}>{note.text}</span>
                </span>
              ))}
            </p>

            {detail?.sourceTitle ? (
              <p className={styles.sourceNote}>
                이야기의 갈래 —{' '}
                {detail.sourceUrl ? (
                  <a
                    className={styles.sourceLink}
                    href={detail.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {detail.sourceTitle}
                    <span className={styles.srOnly}> (새 창)</span>
                  </a>
                ) : (
                  detail.sourceTitle
                )}
              </p>
            ) : null}

            {/*
              도판 각주 — 그림의 출처는 이야기의 출처와 **다른 갈래**라 줄을 나눈다.
              종이 다르거나 판면에 손을 댄 도판은 `note` 로 그 사실을 밝힌다
              (감추면 "벚꽃이라며 다른 꽃을 보여 준" 화면이 된다).
            */}
            {plate ? (
              <p className={styles.plateNote} data-testid="sheet-plate-note">
                {plate.sourceLine}
                {plate.note ? <span className={styles.plateNoteTail}>{plate.note}</span> : null}
              </p>
            ) : null}
          </div>
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
