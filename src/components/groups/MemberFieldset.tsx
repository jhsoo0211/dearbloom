'use client';

/**
 * 받는 사람 한 명을 편집하는 칸.
 *
 * 칩은 전부 **네이티브 input(radio/checkbox)** 위에 라벨을 씌운 것이다 —
 * 키보드·스크린리더 동작(그룹 이동·선택 상태 읽기)을 브라우저에게 맡기려는 것이고,
 * 보이는 모양만 CSS 로 칩처럼 만든다.
 */

import { useId, type Ref } from 'react';

import { withParticle } from '@/lib/text';
import { COLOR_OPTIONS, PET_OPTIONS, TRAIT_OPTIONS } from './labels';
import { IconRemove } from './icons';
import styles from './groups.module.css';
import type { MemberDraft } from './types';

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export type MemberPatch = Partial<Omit<MemberDraft, 'key'>>;

interface MemberFieldsetProps {
  member: MemberDraft;
  index: number;
  canRemove: boolean;
  onChange: (patch: MemberPatch) => void;
  onRemove: () => void;
  /** 이 칸이 방금 폼을 막은 자리인가. 이름이 비었을 때만 켜진다. */
  invalid?: boolean;
  /** 무엇이 문제인지 적어 둔 문장의 id — 이름 칸이 그 문장을 자기 설명으로 들고 간다. */
  errorId?: string;
  /** 이름 칸을 바깥에서 포커스하기 위한 손잡이(제출이 막히면 그 칸으로 데려간다). */
  nameRef?: Ref<HTMLInputElement>;
}

export function MemberFieldset({
  member,
  index,
  canRemove,
  onChange,
  onRemove,
  invalid = false,
  errorId,
  nameRef,
}: MemberFieldsetProps) {
  const uid = useId();
  const nameId = `${uid}-name`;
  const order = index + 1;
  const who = member.name.trim() === '' ? `${order}번째 사람` : member.name.trim();

  return (
    <fieldset className={styles.member}>
      <legend className="sr-only">받는 사람 {order}</legend>

      <div className={styles.memberHead}>
        <span className={styles.ava} aria-hidden="true">
          {member.name.trim().slice(0, 1) || order}
        </span>
        <label className="sr-only" htmlFor={nameId}>
          받는 사람 {order} 이름
        </label>
        <input
          id={nameId}
          ref={nameRef}
          className={styles.nameInput}
          type="text"
          value={member.name}
          placeholder="이름"
          autoComplete="off"
          maxLength={20}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid && errorId ? errorId : undefined}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <button
          type="button"
          className={styles.removeBtn}
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`${who} 삭제`}
        >
          <IconRemove />
        </button>
      </div>

      <div className={styles.field} role="group" aria-label={`${who}의 분위기`}>
        <span className={styles.fieldLabel}>어떤 분인가요</span>
        <div className={styles.chipRow}>
          {TRAIT_OPTIONS.map((option) => {
            const on = member.traits.includes(option.value);
            return (
              <label
                key={option.value}
                className={`${styles.chip} ${on ? styles.chipOn : ''}`}
              >
                <input
                  className={styles.chipInput}
                  type="checkbox"
                  checked={on}
                  onChange={() => onChange({ traits: toggle(member.traits, option.value) })}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </div>

      {/*
        괄호 조사(`지수이(가)`)는 눈으로도 낭독으로도 문장이 아니다 — 이름이 데이터라
        받침을 알 수 없다는 사정은 `withParticle` 한 번으로 끝난다(src/lib/text.ts).
      */}
      <div className={styles.field} role="group" aria-label={`${withParticle(who, 'subject')} 좋아하는 색`}>
        <span className={styles.fieldLabel}>좋아하는 색</span>
        <div className={styles.chipRow}>
          {COLOR_OPTIONS.map((option) => {
            const on = member.colors.includes(option.value);
            return (
              <label
                key={option.value}
                className={`${styles.chip} ${on ? styles.chipOn : ''}`}
              >
                <input
                  className={styles.chipInput}
                  type="checkbox"
                  checked={on}
                  onChange={() => onChange({ colors: toggle(member.colors, option.value) })}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </div>

      <div className={styles.field} role="group" aria-label={`${who}의 안전 조건`}>
        <span className={styles.fieldLabel}>함께 사는 반려동물 · 향</span>
        <div className={styles.chipRow}>
          {PET_OPTIONS.map((option) => {
            const on = member.pets.includes(option.value);
            return (
              <label
                key={option.value}
                className={`${styles.chip} ${on ? styles.chipOn : ''}`}
              >
                <input
                  className={styles.chipInput}
                  type="checkbox"
                  checked={on}
                  onChange={() => onChange({ pets: toggle(member.pets, option.value) })}
                />
                {option.label}
              </label>
            );
          })}
          <label
            className={`${styles.chip} ${member.fragranceSensitive ? styles.chipOn : ''}`}
          >
            <input
              className={styles.chipInput}
              type="checkbox"
              checked={member.fragranceSensitive}
              onChange={(event) => onChange({ fragranceSensitive: event.target.checked })}
            />
            향에 민감
          </label>
        </div>
      </div>
    </fieldset>
  );
}
