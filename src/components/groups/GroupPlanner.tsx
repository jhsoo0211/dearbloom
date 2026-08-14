'use client';

/**
 * 여러 명 추천 화면의 본체.
 *
 * 입력(멤버 명단 + 공통 intent)은 여기서 들고, 계산은 전부 서버 액션 `planGroup` 이 한다
 * (실제 엔진 `recommendGroupIndividual` / `recommendGroupBouquet` 호출).
 * 두 모드의 결과를 한 번에 받아 두므로 토글은 왕복 없이 즉시 바뀐다.
 *
 * 문구 출처: design-spec §1.5c(모드 카피·인원 제한·안전 각주) · §1.5d(개정 워딩).
 */

import { useId, useRef, useState, useTransition } from 'react';

import { planGroup } from '@/app/groups/actions';
import { IconArrowRight, IconPlus } from './icons';
import {
  INTENT_OPTIONS,
  MAX_MEMBERS,
  PRESET_INTENT,
  PRESET_MEMBERS,
  emptyMember,
  intentLabel,
} from './labels';
import { MemberFieldset, type MemberPatch } from './MemberFieldset';
import { BouquetPanel, IndividualPanel } from './ResultPanels';
import styles from './groups.module.css';
import type { GroupPlanView, MemberDraft } from './types';
import type { Intent } from '@/lib/engine/types';

/** 0 = 각각 · 1 = 단체 부케. 배열 순서가 곧 토글 순서다. */
const MODE_LABELS = ['각각', '단체 부케'] as const;
/** §1.5c 모드 카피 — 결과가 없을 때 그 모드가 무엇인지 그대로 말해 준다. */
const MODE_LEADS = [
  '여러 명에게 각자 다른 꽃을 주고 싶어요',
  '팀·모임에 함께 줄 꽃 한 다발',
] as const;
const MODE_OVERLINES = ['한 사람씩 배정했어요', '한 다발에 담은 구성'] as const;
const MODE_CTA_NOTES = [
  '받는 사람마다 카드가 따로 만들어져요',
  '한 다발에 카드 한 장이 담겨요',
] as const;

export function GroupPlanner() {
  const uid = useId();
  const keySeed = useRef(1);
  const nextKey = () => `m${keySeed.current++}`;

  const [intent, setIntent] = useState<Intent>(PRESET_INTENT);
  const [members, setMembers] = useState<MemberDraft[]>([emptyMember('m0')]);
  const [mode, setMode] = useState<0 | 1>(0);
  const [view, setView] = useState<GroupPlanView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const atLimit = members.length >= MAX_MEMBERS;

  function patchMember(key: string, patch: MemberPatch) {
    setMembers((prev) =>
      prev.map((member) => (member.key === key ? { ...member, ...patch } : member)),
    );
  }

  function addMember() {
    if (atLimit) return;
    setMembers((prev) => [...prev, emptyMember(nextKey())]);
  }

  function removeMember(key: string) {
    setMembers((prev) => (prev.length <= 1 ? prev : prev.filter((member) => member.key !== key)));
  }

  /** §1.5c 4명 시나리오를 그대로 심는다 — 빈 폼 앞에서 멈추지 않도록. */
  function applyPreset() {
    setIntent(PRESET_INTENT);
    setMembers(PRESET_MEMBERS.map((member) => ({ ...member, key: nextKey() })));
    setView(null);
    setError(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleaned = members.map((member) => ({ ...member, name: member.name.trim() }));
    if (cleaned.some((member) => member.name === '')) {
      setError('이름이 비어 있는 칸이 있어요. 부르는 이름만 적어 주셔도 돼요.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const state = await planGroup({
        intent,
        members: cleaned.map((member) => ({
          name: member.name,
          recipientTraits: member.traits,
          colorPrefs: member.colors,
          pets: member.pets,
          fragranceSensitive: member.fragranceSensitive,
        })),
      });

      if (state.ok) {
        setView(state.view);
      } else {
        setView(null);
        setError(state.message);
      }
    });
  }

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = ((index + step + MODE_LABELS.length) % MODE_LABELS.length) as 0 | 1;
    setMode(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <>
      <div className={styles.head}>
        <p className={styles.overline}>
          No.&nbsp;01 <span className={styles.ko}>여러 명에게</span>
        </p>
        <h1>여러 명에게, 각자 다른 꽃을</h1>
        <p className={styles.headLead}>
          이름과 분위기만 적어 주세요. 같은 꽃이 겹치지 않게 나눠 드리고, 한 다발로 묶는 구성도
          함께 만들어 드려요.
        </p>
        <ul className={styles.ctx} aria-label="지금 조건">
          <li>{intentLabel(intent)}</li>
          <li>{members.length}명</li>
          <li>{mode === 0 ? '겹치지 않게' : '한 다발로'}</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── 공통 마음 ─────────────────────────────────────────── */}
        <section className={styles.sect} aria-labelledby={`${uid}-intent`}>
          <p className={styles.overline} id={`${uid}-intent`}>
            Intent <span className={styles.ko}>전하려는 마음</span>
          </p>
          <h2 className={styles.sectTitle}>모두에게 전할 마음은 하나예요</h2>
          <p className={styles.sectNote}>꽃은 사람마다 달라도, 자리의 마음은 같으니까요.</p>
          <div className={styles.chipRow} role="radiogroup" aria-label="전하려는 마음">
            {INTENT_OPTIONS.map((option) => {
              const on = intent === option.value;
              return (
                <label key={option.value} className={`${styles.chip} ${on ? styles.chipOn : ''}`}>
                  <input
                    className={styles.chipInput}
                    type="radio"
                    name={`${uid}-intent-radio`}
                    value={option.value}
                    checked={on}
                    onChange={() => setIntent(option.value)}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </section>

        {/* ── 받는 사람 ─────────────────────────────────────────── */}
        <section className={styles.sect} aria-labelledby={`${uid}-roster`}>
          <p className={styles.overline} id={`${uid}-roster`}>
            Recipients <span className={styles.ko}>받는 사람</span>
          </p>
          <h2 className={styles.sectTitle}>누구에게 건네나요</h2>
          <p className={styles.sectNote}>
            떠오르는 대로 골라주세요. 꽃과 색을 그 사람에게 맞춰드려요.
          </p>

          <ul className={styles.roster}>
            {members.map((member, index) => (
              <li key={member.key}>
                <MemberFieldset
                  member={member}
                  index={index}
                  canRemove={members.length > 1}
                  onChange={(patch) => patchMember(member.key, patch)}
                  onRemove={() => removeMember(member.key)}
                />
              </li>
            ))}
          </ul>

          <div className={styles.rosterFoot}>
            <p className={styles.limit}>최대 {MAX_MEMBERS}명까지</p>
            <button type="button" className={styles.ghostBtn} onClick={applyPreset}>
              예시로 채우기
            </button>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={addMember}
              disabled={atLimit}
            >
              <IconPlus />
              추가
            </button>
          </div>

          <div className={styles.formFoot}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={pending}>
              {pending ? '고르는 중…' : view ? '다시 고르기' : '꽃 고르기'}
              {pending ? null : <IconArrowRight />}
            </button>
            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
            <p className={styles.formNote} role="status">
              {view
                ? `${view.memberCount}명에게 각각 배정하고, 한 다발 구성도 함께 만들었어요.`
                : '이름만 적어도 골라드려요. 나머지는 비워 두셔도 괜찮아요.'}
            </p>
          </div>
        </section>
      </form>

      {/* ── 결과 ────────────────────────────────────────────────── */}
      <section className={styles.sect} aria-labelledby={`${uid}-result`}>
        <p className={styles.overline} id={`${uid}-result`}>
          No.&nbsp;02 <span className={styles.ko}>{MODE_OVERLINES[mode]}</span>
        </p>

        <div className={styles.seg} role="tablist" aria-label="전달 방식 선택">
          <span
            className={styles.segThumb}
            aria-hidden="true"
            style={{ '--i': mode } as React.CSSProperties}
          />
          {MODE_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              role="tab"
              id={`${uid}-tab-${index}`}
              className={styles.segBtn}
              aria-controls={`${uid}-panel-${index}`}
              aria-selected={mode === index}
              tabIndex={mode === index ? 0 : -1}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              onClick={() => setMode(index as 0 | 1)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              {label}
            </button>
          ))}
        </div>

        {MODE_LABELS.map((label, index) => (
          <div
            key={label}
            className={styles.panel}
            id={`${uid}-panel-${index}`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${index}`}
            tabIndex={0}
            hidden={mode !== index}
          >
            {view === null ? (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>{MODE_LEADS[index]}</p>
                <p className={styles.emptyText}>
                  받는 사람을 적고 <b>꽃 고르기</b>를 눌러 주세요. 처음이라면 <b>예시로 채우기</b>로
                  네 명짜리 예시를 그대로 볼 수 있어요.
                </p>
              </div>
            ) : index === 0 ? (
              <IndividualPanel view={view} />
            ) : (
              <BouquetPanel view={view} />
            )}
          </div>
        ))}
      </section>

      {/* ── CTA (더미) ──────────────────────────────────────────── */}
      <section className={styles.sect} aria-label="카드에 담기">
        <a className={`${styles.btn} ${styles.btnPrimary}`} href="#">
          카드에 담기
          <IconArrowRight />
        </a>
        <p className={styles.ctaNote}>{MODE_CTA_NOTES[mode]}</p>
      </section>
    </>
  );
}
