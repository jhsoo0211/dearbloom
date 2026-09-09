'use client';

/**
 * 편지 만들기·고쳐 쓰기.
 *
 * ── 저장한다는 사실을 감추지 않는다 ──────────────────────────────────
 * dearbloom 의 자유 서술은 저장하지 않는 것이 원칙이지만(§1.5j), 편지는 **남기려고 쓰는 글**
 * 이라 저장한다. 그 차이를 화면 맨 위 안내 한 줄이 말하고, 편지가 어디에 남는지도 같은
 * 자리에서 말한다(`src/lib/letters/store.ts` 머리말과 같은 문장).
 *   ⚠ **번호를 건네기 전에** 그 사실을 읽어야 한다(design-spec §1.5o). 그래서 저장 방식
 *     고지(`LETTER_STORAGE_NOTICE`)가 폼 맨 위와 저장 완료 화면 **두 자리**에 선다. 저장
 *     완료 화면이 더 중요한 자리다 — 사람이 번호를 복사해 건네는 순간이 거기다.
 *   문구 원본은 전부 `copy.ts` 다. 여기서 새로 짓지 않는다.
 *
 * ── 고쳐 쓰기로 들어오는 길 ──────────────────────────────────────────
 * 목록에서 `/letter/studio?id=…` 로 온다. 그 id 는 **마운트 뒤에 `window.location` 에서**
 * 읽는다 — 서버가 검색 파라미터를 읽는 순간 이 화면이 정적 렌더에서 떨어져 나가는데,
 * 그렇게 얻을 것이 없다(서버에는 그 편지를 볼 세션이 없다).
 *   ⚠ 서버 어댑터에는 `revealCode()` 가 **없다.** 그래서 고쳐 쓰기로 들어와도 번호 칸이
 *     채워지지 않는다 — 그때 번호를 다시 적으라고 요구하면 적어 두지 않은 사람은 편지를
 *     **영영 고칠 수 없다.** 비워 둔 채 저장하면 번호는 그대로다(`LETTER_CODE_KEEP_HINT`).
 *
 * ⚠ 편지 본문을 console·로그·URL 어디에도 싣지 마라. 이 파일에 console 이 없는 것은 규칙이다.
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';

import {
  LETTER_LIMITS,
  createLetterCode,
  letterCodeSchema,
  letterContentSchema,
  type Letter,
  type LetterTheme,
} from '@/lib/letters/types';
import { LetterStoreError } from '@/lib/letters/store';
import { createLetterStore } from '@/lib/letters/supabase-store';
import {
  LETTER_CODE_KEEP_HINT,
  LETTER_SAVED_KEPT_CODE,
  LETTER_SAVED_LEAD,
  LETTER_SAVED_NOTE,
  LETTER_STORAGE_NOTICE,
  LETTER_STUDIO_NOTICE,
  letterCodeHint,
} from './copy';
import FlowerChoice from './FlowerChoice';
import LetterReveal from './LetterReveal';
import LetterSheet from './LetterSheet';
import { LETTER_THEME_OPTIONS } from './themes';
import styles from './letter.module.css';
import type { LetterFlowerOption } from './types';

export interface LetterStudioProps {
  flowers: readonly LetterFlowerOption[];
  /** 색감을 고르지 않았을 때의 기본값(서버가 정해 내려보낸다). */
  defaultTheme: LetterTheme;
}

/** 폼 한 벌. 필드 이름은 스키마의 키와 같게 두어 오류를 그대로 옮겨 붙인다. */
interface FormState {
  recipientName: string;
  title: string;
  body: string;
  flowerId: string;
  theme: LetterTheme;
  signature: string;
  code: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function LetterStudio({ flowers, defaultTheme }: LetterStudioProps) {
  /*
    서버(프리렌더)에서는 로컬 어댑터, 브라우저에서는 배포에 따라 서버 어댑터다.
    어느 쪽인지로 갈리는 JSX 는 **마운트 뒤에만** 선다(`editingId` 는 주소를 읽은 뒤에
    채워진다) — 그래서 하이드레이션이 어긋날 자리가 없다.
  */
  const store = useMemo(() => createLetterStore(), []);

  const [form, setForm] = useState<FormState>({
    recipientName: '',
    title: '',
    body: '',
    flowerId: '',
    theme: defaultTheme,
    signature: '',
    code: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>('');
  const [saved, setSaved] = useState<{ letter: Letter; code: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);

  const flower = flowers.find((row) => row.flowerId === form.flowerId);

  /* 고쳐 쓰기 — 주소에 id 가 있으면 그 편지를 불러 폼을 채운다. */
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;

    let alive = true;
    void (async () => {
      const [letter, code] = await Promise.all([
        store.get(id),
        store.revealCode ? store.revealCode(id) : Promise.resolve(null),
      ]);
      if (!alive) return;
      if (!letter) {
        setFormError('고쳐 쓰려던 편지를 찾지 못했어요. 목록에서 다시 골라 주시겠어요?');
        return;
      }
      setEditingId(letter.id);
      setForm({
        recipientName: letter.recipientName,
        title: letter.title ?? '',
        body: letter.body,
        flowerId: letter.flowerId,
        theme: letter.theme,
        signature: letter.signature,
        code: code ?? '',
      });
    })();

    return () => {
      alive = false;
    };
  }, [store]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => ({ ...previous, [key]: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setBusy(true);

    try {
      // 검증은 저장소도 다시 하지만(방어), 화면은 **어느 칸이 걸렸는지** 말해야 해서
      // 여기서 한 번 더 돌려 오류를 칸에 붙인다.
      const content = letterContentSchema.safeParse({
        recipientName: form.recipientName,
        title: form.title,
        body: form.body,
        flowerId: form.flowerId,
        theme: form.theme,
        signature: form.signature,
      });
      // 고쳐 쓸 때 번호 칸을 비워 두면 **번호는 그대로**다(머리말). 그때는 번호 검사를
      // 돌리지 않는다 — 빈 칸을 형식 오류로 되돌려 주면 그 길이 막힌다.
      const keepingCode = editingId !== null && form.code.trim() === '';
      const code = keepingCode ? null : letterCodeSchema.safeParse(form.code);

      if (!content.success || (code !== null && !code.success)) {
        const next: FieldErrors = {};
        if (!content.success) {
          for (const issue of content.error.issues) {
            const key = issue.path[0];
            if (typeof key === 'string' && !(key in next)) {
              next[key as keyof FormState] = issue.message;
            }
          }
        }
        if (code !== null && !code.success) {
          next.code = code.error.issues[0]?.message ?? '편지 번호를 다시 봐 주세요.';
        }
        setFieldErrors(next);
        return;
      }

      // 번호를 그대로 두는 저장은 빈 문자열로 넘긴다 — 두 어댑터가 같은 규칙을 쓴다
      // (`SaveLetterInput` 주석).
      const nextCode = code === null ? '' : code.data;

      const letter = await store.save({
        ...(editingId ? { id: editingId } : {}),
        ...content.data,
        code: nextCode,
      });

      setEditingId(letter.id);
      setForm((previous) => ({ ...previous, code: nextCode }));
      setSaved({ letter, code: nextCode });
    } catch (error) {
      // 저장소가 말해 주는 문장은 이미 해요체다(`LetterStoreError`). 그대로 옮긴다.
      setFormError(
        error instanceof LetterStoreError
          ? error.message
          : '편지를 간직해 두지 못했어요. 잠시 뒤에 다시 눌러 주시겠어요?',
      );
    } finally {
      setBusy(false);
    }
  }

  const bodyLength = form.body.length;
  const bodyOver = bodyLength > LETTER_LIMITS.body;

  /* ── 저장 뒤 — 번호를 크게 한 번 보여 주는 자리 ──────────────────── */
  if (saved) {
    return (
      <>
        <section className={styles.saved} aria-labelledby="letter-saved-title">
          <span className={styles.eyebrow}>Saved</span>
          <h2 className={styles.panelTitle} id="letter-saved-title">
            편지를 간직해 두었어요
          </h2>
          {/*
            번호를 비워 둔 채 고쳐 쓴 경우에는 **보여 줄 번호가 우리에게 없다**(서버는
            해시만 든다). 빈 칸을 크게 세우는 대신 일어난 일을 말한다.
          */}
          {saved.code !== '' ? (
            <>
              <p className={styles.panelLead}>{LETTER_SAVED_LEAD}</p>

              <strong className={styles.savedCode} data-testid="saved-code">
                {saved.code}
              </strong>
            </>
          ) : (
            <p className={styles.panelLead} data-testid="saved-code-kept">
              {LETTER_SAVED_KEPT_CODE}
            </p>
          )}

          {/*
            번호를 건네기 직전의 자리다. 편지가 어디에 남는지를 여기서 말하지 않으면,
            만든 사람은 열리지 않을 번호를 건네거나(device) 다시 못 볼 번호를 그냥
            흘려보내게 된다(server) — §1.5o 가 이 자리를 가장 중요하다고 적은 이유다.
          */}
          <p className={styles.notice} data-testid="device-notice">
            <span className={styles.noticeStrong}>{LETTER_STORAGE_NOTICE.lead}</span>{' '}
            {LETTER_STORAGE_NOTICE.body}
          </p>

          {saved.code !== '' ? <p className={styles.note}>{LETTER_SAVED_NOTE}</p> : null}

          <div className={styles.savedActions}>
            <button type="button" className={styles.btn} onClick={() => setPreviewing(true)}>
              미리 열어보기
            </button>
            <button type="button" className={styles.ghost} onClick={() => setSaved(null)}>
              이어서 고치기
            </button>
            <Link className={styles.ghost} href="/letter">
              편지 입구로
            </Link>
          </div>
        </section>

        {previewing ? (
          <LetterReveal
            letter={saved.letter}
            {...(flower ? { flower } : {})}
            ownPreview
            onClose={() => setPreviewing(false)}
          />
        ) : null}
      </>
    );
  }

  /* ── 폼 ──────────────────────────────────────────────────────────── */
  return (
    <div className={styles.studio}>
      <form className={styles.panel} onSubmit={onSubmit} noValidate>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{editingId ? '편지 고쳐 쓰기' : '편지 쓰기'}</h2>
        </div>

        {/* 정직한 한 줄 — 저장한다는 사실과, 그 편지가 어디에 남는지. */}
        <p className={styles.notice} data-testid="device-notice">
          <span className={styles.noticeStrong}>{LETTER_STUDIO_NOTICE.strong}</span>{' '}
          {LETTER_STUDIO_NOTICE.body} <b>{LETTER_STORAGE_NOTICE.lead}</b>{' '}
          {LETTER_STORAGE_NOTICE.body}
        </p>

        {formError !== '' ? (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        ) : null}

        {/* 받는 분 */}
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <label className={styles.label} htmlFor="letter-recipient">
              받는 분 이름
            </label>
          </div>
          <input
            id="letter-recipient"
            className={styles.input}
            type="text"
            autoComplete="off"
            maxLength={LETTER_LIMITS.recipientName}
            placeholder="편지지 첫 줄에 이 이름이 앉아요"
            value={form.recipientName}
            onChange={(event) => update('recipientName', event.target.value)}
          />
          {fieldErrors.recipientName ? (
            <p className={styles.fieldError}>{fieldErrors.recipientName}</p>
          ) : null}
        </div>

        {/* 제목(선택) */}
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <label className={styles.label} htmlFor="letter-title">
              편지 제목
            </label>
            <span className={styles.optional}>적지 않아도 괜찮아요</span>
          </div>
          <input
            id="letter-title"
            className={styles.input}
            type="text"
            autoComplete="off"
            maxLength={LETTER_LIMITS.title}
            placeholder="예: 오래 미뤄 둔 말"
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
          />
          {fieldErrors.title ? <p className={styles.fieldError}>{fieldErrors.title}</p> : null}
        </div>

        {/* 본문 */}
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <label className={styles.label} htmlFor="letter-body">
              편지 내용
            </label>
          </div>
          <textarea
            id="letter-body"
            className={styles.textarea}
            maxLength={LETTER_LIMITS.body}
            placeholder="하고 싶었던 말을 천천히 적어 보세요."
            value={form.body}
            onChange={(event) => update('body', event.target.value)}
          />
          <p className={`${styles.counter} ${bodyOver ? styles.counterOver : ''}`}>
            {bodyLength} / {LETTER_LIMITS.body}
          </p>
          {fieldErrors.body ? <p className={styles.fieldError}>{fieldErrors.body}</p> : null}
        </div>

        {/* 꽃 */}
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.label}>함께 보낼 꽃</span>
          </div>
          <p className={styles.hint}>고른 꽃의 꽃말이 편지 아래에 한 줄로 함께 실려요.</p>
          <FlowerChoice
            flowers={flowers}
            value={form.flowerId}
            onChange={(flowerId) => update('flowerId', flowerId)}
          />
          {fieldErrors.flowerId ? (
            <p className={styles.fieldError}>{fieldErrors.flowerId}</p>
          ) : null}
        </div>

        {/* 색감 */}
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <span className={styles.label}>편지의 색감</span>
          </div>
          <p className={styles.hint}>종이는 그대로 두고, 이름과 선의 색이 이 계열을 따라가요.</p>
          <div className={styles.chips} role="group" aria-label="편지의 색감">
            {LETTER_THEME_OPTIONS.map((option) => {
              const on = option.key === form.theme;
              return (
                <button
                  type="button"
                  className={`${styles.chip} ${on ? styles.chipOn : ''}`}
                  key={option.key}
                  data-theme={option.key}
                  aria-pressed={on}
                  title={option.hint}
                  onClick={() => update('theme', option.key)}
                >
                  {/* 계열색 점 — 도감 계열 칩과 같은 문법(점검 P1-6). 색은 CSS 가 data-theme 으로 정한다. */}
                  <span className={styles.chipDot} aria-hidden="true" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 서명 */}
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <label className={styles.label} htmlFor="letter-signature">
              보내는 분 이름
            </label>
          </div>
          <input
            id="letter-signature"
            className={styles.input}
            type="text"
            autoComplete="off"
            maxLength={LETTER_LIMITS.signature}
            placeholder="편지 끝에 남길 이름이에요"
            value={form.signature}
            onChange={(event) => update('signature', event.target.value)}
          />
          {fieldErrors.signature ? (
            <p className={styles.fieldError}>{fieldErrors.signature}</p>
          ) : null}
        </div>

        {/* 편지 번호 */}
        <div className={styles.field}>
          <div className={styles.fieldHead}>
            <label className={styles.label} htmlFor="letter-code">
              편지 번호
            </label>
          </div>
          <p className={styles.hint}>
            {letterCodeHint(LETTER_LIMITS.codeMin, LETTER_LIMITS.codeMax)}
          </p>
          <div className={styles.codeRow}>
            <input
              id="letter-code"
              className={styles.codeInput}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={LETTER_LIMITS.codeMax}
              placeholder="예: HANBIT"
              value={form.code}
              onChange={(event) => update('code', event.target.value.toUpperCase())}
            />
            <button
              type="button"
              className={styles.ghost}
              onClick={() => update('code', createLetterCode())}
            >
              만들어 줘
            </button>
          </div>
          {/*
            고쳐 쓰기에서만 선다. 서버 모드에서는 번호 칸이 비어 있는 채로 들어오는데
            (`revealCode()` 가 없다), 그때 이 한 줄이 없으면 사람은 다시 적을 수 없는
            번호를 요구받았다고 읽는다.
          */}
          {editingId ? <p className={styles.hint}>{LETTER_CODE_KEEP_HINT}</p> : null}
          {fieldErrors.code ? <p className={styles.fieldError}>{fieldErrors.code}</p> : null}
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.btn} disabled={busy}>
            {editingId ? '고쳐 쓴 편지 간직하기' : '이 편지 간직하기'}
          </button>
          <Link className={styles.ghost} href="/letter">
            그만두고 돌아가기
          </Link>
        </div>
      </form>

      {/* 미리보기 — 받는 사람이 열게 될 그 편지지다(같은 컴포넌트). */}
      <aside className={styles.previewCol} aria-label="편지 미리보기">
        <LetterSheet
          recipientName={form.recipientName}
          {...(form.title.trim() !== '' ? { title: form.title } : {})}
          body={form.body}
          signature={form.signature}
          theme={form.theme}
          {...(flower ? { flower } : {})}
          preview
        />
        <p className={`${styles.note} ${styles.previewNote}`}>
          받는 분은 봉투가 열리는 연출을 지나 이 편지를 만나요.
        </p>
      </aside>
    </div>
  );
}
