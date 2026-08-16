'use client';

/**
 * 탄생화 사전 상세 시트 — 도감에 아직 없는 꽃 한 장(§1.5m ⑤ · §C ①).
 *
 * ── 왜 상세 **페이지**가 아닌가 ──────────────────────────────────────
 * 사진과 이야기가 붙은 지금도 답은 같다. 정식 도감 상세에는 색깔별 꽃말, 반려동물 안전성,
 * 계절·시세, 이야기까지 **검증을 마친 다섯 갈래**가 있다. 여기 있는 것은 그중 둘이고
 * 검증 등급도 다르다 — 같은 무게의 페이지로 세우면 사전이 도감인 척하게 된다.
 * 그래서 열람은 시트로 끝내고, 티어 고지 두 줄(`BIRTH_DICT_TIER*`)을 그 안에 붙인다.
 *
 * ── 왜 이제는 다시 가져오는가 (성능 규율, 2026-08-16 변경) ────────────
 * 예전 주석은 "여기는 다시 묻지 않는다 — 사전 한 줄이 200바이트라 목록에 다 들어 있다"
 * 였다. 사진 한 장과 이야기 416편이 들어오면서 그 전제가 뒤집혔다: 달치 목록에 본문까지
 * 실으면 한 달 응답이 8~10KB 에서 30KB 안팎이 된다. 그런데 사전을 여는 사람의 대부분은
 * 목록을 훑기만 하고 시트는 하루치만 연다 — `/stories` 가 전문 317편으로 겪은 자리와
 * 같은 모양이라 같은 답을 쓴다(성능 리뷰 P1-7). 목록이 들고 오는 것은 **썸네일 주소
 * 한 줄**이고, 사진 본판과 이야기는 이 시트가 열릴 때 `loadBirthDictDetail` 로 온다.
 *   · 기다리는 동안 — 이야기 톤의 한 줄. 스피너를 돌리지 않는다(아카이브와 같은 톤).
 *   · 실패하면 — 빈 자리 대신 폴백 한 줄과 다시 부르는 길.
 *   · 그동안에도 **이름·꽃말·티어 고지·출처는 이미 화면에 있다** — 목록이 들고 온 값이라
 *     네트워크가 죽어도 시트가 빈손이 되지 않는다.
 *
 * ── 사진과 라이선스 ─────────────────────────────────────────────────
 * 사진 위에 글자를 얹지 않는다. CC BY-SA 사본에 글자를 합성하면 그것부터가 또 다른
 * 파생물이고, 밝은 실사 위 아이보리 타이포는 어차피 죽는다(도판 사용 규칙 3 과 같은 자리).
 * 크레딧은 `BirthPhotoCredit` 이 사진 **아래** 접어서 단다 — 사진을 거는 자리는 언제나
 * 그 컴포넌트를 함께 세운다.
 *
 * 접근성 네 가지는 `StorySheet` 와 같은 방식으로 직접 챙긴다: `aria-modal`,
 * 포커스 트랩(Tab 순환), ESC·배경 탭 닫기, body 스크롤 잠금. 등장 모션은 CSS 애니메이션이라
 * `prefers-reduced-motion` 전역 규칙(globals.css)이 알아서 0 으로 만든다.
 */

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { loadBirthDictDetail } from '@/app/flowers/actions';
import BirthPhotoCredit from './BirthPhotoCredit';
import {
  BIRTH_DICT_ALSO_ON,
  BIRTH_DICT_DETAIL_FAILED,
  BIRTH_DICT_DETAIL_PENDING,
  BIRTH_DICT_DETAIL_RETRY,
  BIRTH_DICT_SOURCE,
  BIRTH_DICT_STORIES_TITLE,
  BIRTH_DICT_STORY_MORE,
  BIRTH_DICT_STORY_SOURCE,
  BIRTH_DICT_TIER,
  BIRTH_DICT_TIER_SUB,
  BIRTH_SOURCE_NOTE,
} from './birth-copy';
import styles from './flowers.module.css';
import type { BirthDictDetail, BirthDictEntry, BirthDictStory } from './types';

interface BirthDictSheetProps {
  entry: BirthDictEntry;
  /** 시트가 그 하루를 다시 물을 때 쓰는 달(줄에는 일만 실려 있다). */
  month: number;
  onClose: () => void;
}

/** 사진·이야기를 가져오는 중인지 · 왔는지 · 실패했는지. */
type LoadState = 'loading' | 'ready' | 'failed';

/**
 * 이야기 한 편 — **hook 이 먼저, 전문은 접어서**(§1.5i 본문 우선의 사전판).
 *
 * 한 이름에 최대 여섯 편이 붙는다. 여섯 편의 전문을 한 번에 펼치면 시트가 스크롤 3천 px
 * 짜리 벽이 되어, 사진을 보러 온 사람이 이야기 더미부터 만난다. 그래서 목록은 제목과 hook
 * 으로 훑고, 읽고 싶은 편만 편다 — `<details>` 를 쓰는 이유는 크레딧 쪽과 같다
 * (브라우저가 키보드·낭독기 동작을 이미 갖고 있다).
 */
function StoryItem({ story }: { story: BirthDictStory }) {
  return (
    <li className={styles.dictStory}>
      <details className={styles.dictStoryDetails}>
        <summary className={styles.dictStorySummary}>
          <span className={styles.dictStoryTitle}>{story.title}</span>
          {story.hook ? <span className={styles.dictStoryHook}>{story.hook}</span> : null}
          <span className={styles.dictStoryMore} aria-hidden="true">
            {BIRTH_DICT_STORY_MORE}
          </span>
        </summary>

        <p className={styles.dictStoryText}>{story.body}</p>

        {/* 각주 — 문화권 · 시대 · 갈래 · 신뢰. 순서와 문구가 `/stories` 시트와 같다. */}
        <p className={styles.dictStoryNote}>
          {story.notes.map((note, index) => (
            <span key={note.key}>
              {index > 0 ? <span aria-hidden="true"> · </span> : null}
              <span className={note.accent ? styles.dictStoryNoteOn : undefined}>{note.text}</span>
            </span>
          ))}
        </p>

        {story.sourceUrl && story.sourceLabel ? (
          <p className={styles.dictStoryNote}>
            {BIRTH_DICT_STORY_SOURCE} —{' '}
            <a
              className={styles.dictSourceLink}
              href={story.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {story.sourceLabel}
              <span className={styles.srOnly}> (새 창)</span>
            </a>
          </p>
        ) : null}
      </details>
    </li>
  );
}

export default function BirthDictSheet({ entry, month, onClose }: BirthDictSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const [detail, setDetail] = useState<BirthDictDetail | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  /** 다시 부를 때마다 늘려 effect 를 되돌린다("다시 펼쳐 볼까요" 가 실제로 다시 부르게). */
  const [attempt, setAttempt] = useState(0);

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

  /**
   * 사진 본판과 이야기 가져오기.
   *
   * ⚠ `cancelled` 플래그가 하는 일은 언마운트 뒤 setState 를 막는 것이다. 시트는 한 번에
   *   하루만 열리고(다른 날을 누르면 이 컴포넌트가 통째로 다시 마운트된다) 이전/다음
   *   넘기기도 없어서, `StorySheet` 처럼 id 를 맞춰 볼 필요까지는 없다.
   */
  useEffect(() => {
    let cancelled = false;

    loadBirthDictDetail(month, entry.day)
      .then((row) => {
        if (cancelled) return;
        if (row) {
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
  }, [month, entry.day, attempt]);

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
      'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
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
  const photo = detail?.photo;
  const stories = detail?.stories ?? [];

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

          {/*
            사진 자리.
            ⚠ **자리를 미리 잡아 두지 않는다.** 366일 중 92일은 사진이 없고, 그 날들에
              4:3 짜리 빈 상자를 세우면 시트가 구멍부터 보여 준다. 대신 목록 줄이 이미
              썸네일을 갖고 있으므로(있는 날은 있다고 알고 온다) 사진이 도착하며 아래가
              밀리는 것은 **시트 안에서** 일어나고 첫 화면 이동으로 세어지지 않는다.
            사진 위에는 아무것도 얹지 않는다 — 소개 한 줄은 아래 캡션으로 간다.
          */}
          {photo ? (
            <figure className={styles.dictPhotoFigure}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 자체 호스팅 정적 파일(`public/birth`). `next/image` 최적화 엔드포인트는 정적 데모(output:'export')에서 서지 않는다. */}
              <img
                className={styles.dictPhoto}
                src={photo.src}
                alt={`${entry.nameKo} 사진`}
                width={960}
                height={640}
                loading="lazy"
                decoding="async"
                data-testid="birth-sheet-photo"
              />
              {photo.familyLine ? (
                <figcaption className={styles.dictPhotoCaption}>{photo.familyLine}</figcaption>
              ) : null}
              <BirthPhotoCredit photo={photo} />
            </figure>
          ) : null}

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
            이야기 구획 — **있는 날만 선다.** 205가지 이름에 416편이 붙어 있고, 나머지
            이름에는 한 편도 없다. 빈 제목만 남기면 "이 꽃은 이야기가 없다"가 아니라
            "이야기를 못 불러왔다"로 읽힌다.
          */}
          {state === 'ready' && stories.length > 0 ? (
            <section className={styles.dictStories} aria-labelledby="birth-dict-stories-title">
              <h4 className={styles.dictStoriesTitle} id="birth-dict-stories-title">
                {BIRTH_DICT_STORIES_TITLE}
                <span className={styles.dictStoriesCount}> · {stories.length}편</span>
              </h4>
              <ul className={styles.dictStoryList} data-testid="birth-sheet-stories">
                {stories.map((story) => (
                  <StoryItem key={story.id} story={story} />
                ))}
              </ul>
            </section>
          ) : null}

          {state !== 'ready' ? (
            <p
              className={styles.dictDetailWait}
              data-testid="birth-sheet-wait"
              data-state={state}
              aria-live="polite"
            >
              {state === 'loading' ? (
                BIRTH_DICT_DETAIL_PENDING
              ) : (
                <>
                  {BIRTH_DICT_DETAIL_FAILED}{' '}
                  <button type="button" className={styles.dictDetailRetry} onClick={retry}>
                    {BIRTH_DICT_DETAIL_RETRY}
                  </button>
                </>
              )}
            </p>
          ) : null}

          {/*
            티어 고지 — 이 블록이 사전과 정식 도감을 가르는 자리다(§1.5m ⑤).
            둘째 줄(안전성 미확인)을 지우지 마라: 반려동물 안전은 직설이 옳다(§1.5h).
            사진과 이야기가 붙은 뒤에는 **더 중요해졌다** — 겉모습이 도감 상세에 가까워질수록
            "이건 아직 검증 전"이라는 말이 필요하다.
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
