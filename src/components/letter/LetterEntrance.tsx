'use client';

/**
 * 편지 입구 — 번호로 열기(위) · 내가 만든 편지(아래).
 *
 * ── 이 화면이 먼저 말해야 하는 것 (design-spec §1.5o) ────────────────
 * 편지는 만든 사람의 브라우저에만 있다. 그래서 번호를 받아 찾아온 사람이 **올바른 번호를
 * 넣어도 그 기기에서는 열리지 않는다.** 그 사실을 말하지 않으면 이 화면은 없는 문 앞에
 * 사람을 세워 두고 오타를 의심하게 만든다(2026-08-17 감사 P0-1).
 *   ⚠ 기기 제약 고지(`LETTER_DEVICE_NOTICE`)는 **편지 목록 유무와 무관하게**, 번호를 넣어
 *     보기 **전에** 선다. 예전처럼 `mine.length > 0` 분기 안으로 옮기지 마라 — 그 자리는
 *     이 문장이 가장 필요한 사람(편지를 만든 적 없는 수신자)에게만 보이지 않는 자리다.
 *   문구 원본은 전부 `copy.ts` 다. 여기서 새로 짓지 않는다.
 *
 * ── 연속 오입력 뒤의 짧은 기다림 ─────────────────────────────────────
 * 다섯 번 연달아 어긋나면 잠깐 멈춘다. **이 기다림은 보안이 아니다** — 같은 브라우저에서
 * 새로고침 한 번이면 풀린다. 그럼에도 두는 이유는 두 가지다. 하나는 습관이고(진짜 방어는
 * 서버가 들어야 한다 — `db/migrations/0009_letters.sql` §2 의 bcrypt·시도 기록), 다른 하나는
 * 사람이다. 다섯 번 틀렸다면 대개 번호를 잘못 옮겨 적은 것이라, 여섯 번째를 더 치는 것보다
 * 한 번 다시 보는 편이 빠르다. 그래서 문구도 잠금이 아니라 권유다.
 *   기다림은 그대로 두되 **그 문구도 기기 제약을 함께 말한다** — 기다렸다 다시 넣어도
 *   열리지 않는 경우가 있다는 것을 숨기면 기다림 자체가 두 번째 거짓말이 된다.
 *
 * ⚠ 못 찾은 이유를 나누어 말하지 않는다("형식이 틀렸어요" 같은 힌트 금지 —
 *   `store.findByCode` 가 같은 이유로 형식 오류도 null 로 답한다).
 */

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';

import { LETTER_LIMITS, type Letter } from '@/lib/letters/types';
import { createLocalLetterStore } from '@/lib/letters/store';
import LetterReveal from './LetterReveal';
import {
  LETTER_DEVICE_NOTICE,
  LETTER_LIST_EMPTY,
  LETTER_LIST_NOTE,
  LETTER_NOT_FOUND,
  LETTER_OPEN_LEAD,
  LETTER_WAIT_NOTE,
} from './copy';
import { SAMPLE_LETTER } from './sample';
import { letterThemeLabel } from './themes';
import styles from './letter.module.css';
import type { LetterFlowerOption } from './types';

/** 몇 번 연달아 어긋나면 잠깐 멈추는가. */
const MISS_LIMIT = 5;
/** 그때 기다리는 시간(초). 길게 잡지 않는다 — 벌이 아니라 쉼표다. */
const WAIT_SECONDS = 20;

export interface LetterEntranceProps {
  flowers: readonly LetterFlowerOption[];
}

/** 목록 한 줄의 날짜 — "2026년 8월 16일". 목록은 마운트 뒤에만 그려서 서버와 어긋날 일이 없다. */
function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(date);
}

export default function LetterEntrance({ flowers }: LetterEntranceProps) {
  const store = useMemo(() => createLocalLetterStore(), []);

  const [code, setCode] = useState('');
  const [gateError, setGateError] = useState('');
  const [misses, setMisses] = useState(0);
  const [waitLeft, setWaitLeft] = useState(0);

  const [mine, setMine] = useState<Letter[]>([]);
  /**
   * 저장소를 한 번이라도 읽었는가.
   *
   * 이 페이지는 정적으로 서고 목록은 마운트 뒤에 온다. 그래서 읽기 전에 "아직 만든 편지가
   * 없어요" 를 세우면, 편지를 가진 사람에게 한 프레임 동안 **없다고 말하게 된다.**
   * 읽고 나서 말한다.
   */
  const [loaded, setLoaded] = useState(false);
  const [shownCodes, setShownCodes] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  /**
   * 지금 열려 있는 편지.
   *
   * `sample` 이면 내장 예시(`sample.ts`)다 — **저장소를 거치지 않고** 이 자리로 곧장 온다.
   * 예시는 목록에도 저장소에도 남지 않는다(그래서 `refresh()` 도 부르지 않는다).
   */
  const [opened, setOpened] = useState<{
    letter: Letter;
    own: boolean;
    sample?: boolean;
  } | null>(null);

  const refresh = useCallback(async () => {
    setMine(await store.list());
  }, [store]);

  /**
   * 첫 목록 — **저장소(외부 시스템)를 구독하듯 읽는다.**
   * 상태를 콜백 안에서만 바꾸는 모양이라 효과 본문이 곧바로 렌더를 부르지 않는다
   * (`react-hooks/set-state-in-effect` 가 막는 것이 그 모양이다).
   */
  useEffect(() => {
    let alive = true;
    void store.list().then((rows) => {
      if (!alive) return;
      setMine(rows);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [store]);

  /* 기다리는 동안 1초씩 줄인다. 다 지나면 실패 횟수도 함께 0 으로 돌린다. */
  useEffect(() => {
    if (waitLeft <= 0) return;
    const timer = window.setTimeout(() => {
      const next = waitLeft - 1;
      setWaitLeft(next);
      if (next <= 0) setMisses(0);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [waitLeft]);

  async function onOpen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (waitLeft > 0) return;

    const found = await store.findByCode(code);
    if (found) {
      setGateError('');
      setMisses(0);
      setCode('');
      setOpened({ letter: found, own: false });
      return;
    }

    const missed = misses + 1;
    setMisses(missed);
    setGateError(LETTER_NOT_FOUND);
    if (missed >= MISS_LIMIT) setWaitLeft(WAIT_SECONDS);
  }

  async function onRevealCode(id: string) {
    if (!store.revealCode) return;
    const found = await store.revealCode(id);
    if (found) setShownCodes((previous) => ({ ...previous, [id]: found }));
  }

  async function onDelete(id: string) {
    await store.remove(id);
    setPendingDelete(null);
    setShownCodes((previous) => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
    await refresh();
  }

  const openedFlower = opened
    ? flowers.find((row) => row.flowerId === opened.letter.flowerId)
    : undefined;

  return (
    <>
      {/* ── 편지 열기 ──────────────────────────────────────────────── */}
      <section className={styles.panel} aria-labelledby="letter-open-title">
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle} id="letter-open-title">
            편지 열기
          </h2>
          <span className={styles.eyebrow}>Open</span>
        </div>
        <p className={styles.panelLead}>{LETTER_OPEN_LEAD}</p>

        {/*
          기기 제약 고지 — **번호 칸 위**. 편지 목록이 있든 없든 언제나 선다.
          면(배경+보더)을 갖는 이유는 사전 티어 고지(§1.5m ⑤)와 같다: 건너뛰어 읽히면 안 된다.
        */}
        <p className={styles.notice} data-testid="device-notice">
          <span className={styles.noticeStrong}>{LETTER_DEVICE_NOTICE.lead}</span>{' '}
          {LETTER_DEVICE_NOTICE.body}
        </p>

        <form onSubmit={onOpen} noValidate>
          <label className={styles.srOnly} htmlFor="letter-open-code">
            편지 번호
          </label>
          <div className={styles.codeRow}>
            <input
              id="letter-open-code"
              className={styles.codeInput}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={LETTER_LIMITS.codeMax}
              placeholder="편지 번호"
              value={code}
              disabled={waitLeft > 0}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase());
                setGateError('');
              }}
            />
            <button type="submit" className={styles.btn} disabled={waitLeft > 0}>
              열기
            </button>
          </div>
        </form>

        {gateError !== '' && waitLeft <= 0 ? (
          <p className={styles.fieldError} role="alert" data-testid="gate-error">
            {gateError}
          </p>
        ) : null}

        {waitLeft > 0 ? (
          <p className={styles.waitNote} role="alert" data-testid="gate-wait">
            {LETTER_WAIT_NOTE.lead} <span className={styles.waitNum}>{waitLeft}</span>
            {LETTER_WAIT_NOTE.tail}
          </p>
        ) : null}

        {/*
          번호 없이 들어와 본 사람에게 남기는 조용한 한 줄.
          번호 칸 **아래** 에 두어 위계를 뺏지 않는다 — 이 화면의 주인은 편지를 받은 사람이다.
          예시는 저장소를 거치지 않고 곧장 열람 연출로 간다(`sample.ts` 머리말).
        */}
        {/*
          2026-08-16 · 위계 상향. 예전에는 이 진입이 문장 속 밑줄 링크였다 — 번호 없이
          들어온 사람에게 **이 화면에서 할 수 있는 유일한 일**인데, 본문에 섞여 있으니
          읽는 줄로 지나쳤다. 보조 버튼(고스트 필)으로 세워 "여기 누를 것이 있다"를
          모양으로 먼저 말한다. 문구는 그대로다.

          ⚠ 주 CTA(`.btn`)로 올리지 마라. 이 화면의 주인은 번호를 들고 온 사람이고,
            예시는 그 사람이 아닌 이에게 건네는 곁문이다 — 고스트가 그 위계다.
        */}
        <div className={styles.sampleLine}>
          <p className={styles.sampleNote}>어떤 모습으로 열리는지 궁금하시면 —</p>
          <button
            type="button"
            className={styles.ghost}
            data-testid="open-sample"
            onClick={() => setOpened({ letter: SAMPLE_LETTER, own: false, sample: true })}
          >
            예시 편지 먼저 열어 보세요
          </button>
        </div>
      </section>

      {/* ── 편지 만들기 · 내가 만든 편지 ───────────────────────────── */}
      <section className={styles.panel} aria-labelledby="letter-mine-title">
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle} id="letter-mine-title">
            편지 만들기
          </h2>
          <span className={styles.eyebrow}>Write</span>
        </div>
        <p className={styles.panelLead}>
          하고 싶었던 말과 함께 보낼 꽃 한 송이를 고르면, 번호로 잠긴 편지 한 통이 돼요.
        </p>

        <div className={styles.formActions}>
          <Link className={styles.btn} href="/letter/studio">
            편지 쓰러 가기
          </Link>
        </div>

        {mine.length > 0 ? (
          <>
            <h3 className={styles.label} id="letter-list-title">
              내가 만든 편지
            </h3>
            <ul className={styles.letterList} aria-labelledby="letter-list-title">
              {mine.map((letter) => {
                const shown = shownCodes[letter.id];
                const confirming = pendingDelete === letter.id;
                return (
                  <li className={styles.letterRow} key={letter.id} data-letter={letter.id}>
                    <div className={styles.rowMain}>
                      <p className={styles.rowTitle}>
                        {letter.title?.trim() || `${letter.recipientName}에게`}
                      </p>
                      <p className={styles.rowMeta}>
                        {letter.recipientName}님께 · {formatDay(letter.createdAt)} ·{' '}
                        {letterThemeLabel(letter.theme)}
                      </p>
                    </div>

                    {confirming ? (
                      <div className={styles.rowActions}>
                        <span className={styles.note}>이 편지를 지울까요?</span>
                        <button
                          type="button"
                          className={`${styles.miniBtn} ${styles.miniBtnDanger}`}
                          onClick={() => void onDelete(letter.id)}
                        >
                          지울게요
                        </button>
                        <button
                          type="button"
                          className={styles.miniBtn}
                          onClick={() => setPendingDelete(null)}
                        >
                          그냥 둘게요
                        </button>
                      </div>
                    ) : (
                      <div className={styles.rowActions}>
                        {shown ? (
                          <span className={styles.rowCode} data-testid="row-code">
                            {shown}
                          </span>
                        ) : store.revealCode ? (
                          <button
                            type="button"
                            className={styles.miniBtn}
                            onClick={() => void onRevealCode(letter.id)}
                          >
                            번호 다시 보기
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={styles.miniBtn}
                          onClick={() => setOpened({ letter, own: true })}
                        >
                          열어보기
                        </button>
                        <Link className={styles.miniBtn} href={`/letter/studio?id=${letter.id}`}>
                          고쳐 쓰기
                        </Link>
                        <button
                          type="button"
                          className={`${styles.miniBtn} ${styles.miniBtnDanger}`}
                          onClick={() => setPendingDelete(letter.id)}
                        >
                          지우기
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {/* 기기 제약 자체는 위 패널이 이미 말했다. 여기서는 사라질 수 있다는 사실만. */}
            <p className={styles.empty}>{LETTER_LIST_NOTE}</p>
          </>
        ) : loaded ? (
          <p className={styles.empty}>{LETTER_LIST_EMPTY}</p>
        ) : null}
      </section>

      {opened ? (
        <LetterReveal
          letter={opened.letter}
          {...(openedFlower ? { flower: openedFlower } : {})}
          {...(opened.own ? { ownPreview: true } : {})}
          {...(opened.sample ? { sample: true } : {})}
          onClose={() => setOpened(null)}
        />
      ) : null}
    </>
  );
}
