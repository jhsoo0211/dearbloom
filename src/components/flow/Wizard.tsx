'use client';

/**
 * 질문 5문항 — 한 화면에 한 질문(확정 시안 `design/app-v3/question.html` 문법).
 *
 *   ① 어떤 사이인가요        (관계 6종 · 필수)
 *   ② 어떤 마음을 전하나요   (마음 7종 · 필수)
 *   ③ 상대는 어떤 분인가요   (분위기 태그 · 좋아하는 색 · 반려동물 · 향)
 *   ④ 현실 조건              (예산 · 전하는 날)
 *   ⑤ 확인하고 추천받기
 *
 * 선택지 값(slug)은 전부 서버가 엔진 어휘에서 만들어 props 로 내려준다 —
 * 화면이 어휘를 새로 만들지 않기 위해서다. 답은 서버 액션으로만 보내고 URL 에는 싣지 않는다.
 */

import { useState } from 'react';
import Link from 'next/link';

import type { ChoiceOption, ColorChoice, FlowResponse, ResultPayload, WizardOptions, WizardSubmission } from './types';
import styles from './flow.module.css';

const TOTAL_STEPS = 5;

const STEP_HEADS = [
  { overline: 'Question 01', title: '어떤 사이인가요?', lede: '관계에 따라 같은 꽃말도 다르게 풀어드려요.' },
  {
    overline: 'Question 02',
    title: '어떤 마음을 전하나요?',
    lede: '하고 싶은 말을 먼저 고르면, 그 말에 어울리는 꽃을 찾아드려요.',
  },
  {
    overline: 'Question 03',
    title: '상대는 어떤 분인가요?',
    lede: '떠오르는 대로 골라주세요. 꽃과 색을 그 사람에게 맞춰드려요.',
  },
  {
    overline: 'Question 04',
    title: '언제, 얼마쯤 생각하세요?',
    lede: '제철과 예산을 함께 보고 실제로 구할 수 있는 꽃만 권해드려요.',
  },
  {
    overline: 'Question 05',
    title: '이대로 찾아볼까요?',
    lede: '고르신 내용을 한 번만 확인해 주세요. 언제든 되돌아가 바꿀 수 있어요.',
  },
] as const;

function IconCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.6l4.2 4.2L19 7.2" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h13M12.5 6l6 6-6 6" />
    </svg>
  );
}

/** 관계·마음·예산처럼 하나만 고르는 목록. 시안의 헤어라인 리스트 그대로다. */
function ChoiceList({
  name,
  labelledBy,
  options,
  value,
  onChange,
}: {
  name: string;
  labelledBy: string;
  options: ChoiceOption[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className={styles.rels} role="radiogroup" aria-labelledby={labelledBy}>
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <label
            key={option.value}
            className={selected ? `${styles.rel} ${styles.relOn}` : styles.rel}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.relNo} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className={styles.relBody}>
              <span className={styles.relName}>{option.label}</span>
              {option.desc ? <span className={styles.relDesc}>{option.desc}</span> : null}
            </span>
            <span className={styles.relCheck} aria-hidden="true">
              <IconCheck />
            </span>
          </label>
        );
      })}
    </div>
  );
}

/**
 * 여러 개 고르는 칩. 버튼 + aria-pressed 로 토글 상태를 읽어 준다.
 *
 * 선택 표현은 §1.6b 대로 **채움 하나뿐**이다 — 예전엔 채움과 체크 아이콘을
 * 겹쳐 썼는데, 한 화면에 선택 표현이 둘이면 규격 위반이다.
 */
function ToggleChips({
  options,
  values,
  onToggle,
}: {
  options: ChoiceOption[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className={styles.chips}>
      {options.map((option) => {
        const on = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={on ? `${styles.chip} ${styles.chipOn}` : styles.chip}
            aria-pressed={on}
            onClick={() => onToggle(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ColorChips({
  options,
  values,
  onToggle,
}: {
  options: ColorChoice[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className={styles.chips}>
      {options.map((option) => {
        const on = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            className={on ? `${styles.chip} ${styles.chipOn}` : styles.chip}
            aria-pressed={on}
            onClick={() => onToggle(option.value)}
          >
            <span
              className={
                option.needsRing ? `${styles.chipDot} ${styles.chipDotRing}` : styles.chipDot
              }
              style={{ background: option.hex }}
              aria-hidden="true"
            />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export interface WizardProps {
  options: WizardOptions;
  /** 서버가 정한 "내일". 화면에서 계산하면 서버 렌더와 값이 어긋난다. */
  defaultDateISO: string;
  action: (submission: WizardSubmission) => Promise<FlowResponse>;
  onResult: (payload: ResultPayload) => void;
}

export default function Wizard({ options, defaultDateISO, action, onResult }: WizardProps) {
  const [step, setStep] = useState(1);
  const [relationship, setRelationship] = useState('');
  const [intent, setIntent] = useState('');
  const [traits, setTraits] = useState<string[]>([]);
  const [colorPrefs, setColorPrefs] = useState<string[]>([]);
  const [pets, setPets] = useState<string[]>([]);
  const [fragranceSensitive, setFragranceSensitive] = useState(false);
  // §1.5j 자유 서술 2필드. 둘 다 선택이고, 서버로만 건너가며 저장되지 않는다.
  const [recipientNote, setRecipientNote] = useState('');
  const [episode, setEpisode] = useState('');
  const [budgetKey, setBudgetKey] = useState('');
  const [dateISO, setDateISO] = useState(defaultDateISO);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const head = STEP_HEADS[step - 1];
  const canAdvance = step === 1 ? relationship !== '' : step === 2 ? intent !== '' : true;

  function toggle(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  function labelOf(list: ChoiceOption[] | ColorChoice[], value: string): string {
    return list.find((o) => o.value === value)?.label ?? value;
  }

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const response = await action({
        relationship,
        intent,
        recipientTraits: traits,
        colorPrefs,
        pets,
        fragranceSensitive,
        recipientNote,
        episode,
        budgetKey,
        dateISO,
      });
      if (response.ok) onResult(response.payload);
      else setError(response.message);
    } catch {
      setError('추천을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setPending(false);
    }
  }

  function next() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    void submit();
  }

  return (
    <>
      <header className={`${styles.bar} ${styles.appbar}`}>
        {step === 1 ? (
          <Link className={styles.iconBtn} href="/" aria-label="홈으로 돌아가기">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </Link>
        ) : (
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setStep(step - 1)}
            aria-label="이전 질문으로"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
        )}

        {/* 데스크톱에서는 상단바가 사이트 헤더가 된다 — 로고가 있어야 페이지로 읽힌다 */}
        <Link className={`${styles.wm} ${styles.wmDesk}`} href="/">
          dearbloom
        </Link>

        <div className={styles.progress}>
          <span
            className={styles.track}
            role="progressbar"
            aria-label={`${TOTAL_STEPS}문항 중 ${step}번째`}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-valuenow={step}
            aria-valuetext={`${step} / ${TOTAL_STEPS}`}
          >
            <span className={styles.fill} style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </span>
          <span className={styles.step}>
            {step} / {TOTAL_STEPS}
          </span>
        </div>

        <Link className={styles.iconBtn} href="/" aria-label="질문 닫기">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
      </header>

      <div className={`${styles.phone} ${styles.phoneQuestion}`}>
        <main className={styles.qmain}>
          <div className={styles.qhead}>
            <p className={styles.overline}>
              {head.overline} <span className={styles.ko}>{TOTAL_STEPS}문항 중 {step}번째</span>
            </p>
            <h1 id="q-title">{head.title}</h1>
            <p className={styles.lede}>{head.lede}</p>
          </div>

          {step === 1 ? (
            <ChoiceList
              name="relationship"
              labelledBy="q-title"
              options={options.relationships}
              value={relationship}
              onChange={setRelationship}
            />
          ) : null}

          {step === 2 ? (
            <ChoiceList
              name="intent"
              labelledBy="q-title"
              options={options.intents}
              value={intent}
              onChange={setIntent}
            />
          ) : null}

          {step === 3 ? (
            <>
              <fieldset className={styles.group}>
                <legend className={styles.groupHead}>분위기</legend>
                <p className={styles.groupNote}>여러 개 골라도 좋아요.</p>
                <ToggleChips
                  options={options.traits}
                  values={traits}
                  onToggle={(v) => setTraits(toggle(traits, v))}
                />
              </fieldset>

              <fieldset className={styles.group}>
                <legend className={styles.groupHead}>좋아하는 색</legend>
                <p className={styles.groupNote}>그 사람이 자주 고르는 색이 있다면 알려주세요.</p>
                <ColorChips
                  options={options.colors}
                  values={colorPrefs}
                  onToggle={(v) => setColorPrefs(toggle(colorPrefs, v))}
                />
              </fieldset>

              <fieldset className={styles.group}>
                <legend className={styles.groupHead}>함께 사는 반려동물</legend>
                <p className={styles.groupNote}>
                  고양이·강아지에게 위험한 꽃은 후보에서 미리 빼드려요.
                </p>
                <ToggleChips
                  options={options.pets}
                  values={pets}
                  onToggle={(v) => setPets(toggle(pets, v))}
                />
                <div className={styles.chips} style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className={
                      fragranceSensitive ? `${styles.chip} ${styles.chipOn}` : styles.chip
                    }
                    aria-pressed={fragranceSensitive}
                    onClick={() => setFragranceSensitive(!fragranceSensitive)}
                  >
                    향에 민감해요
                  </button>
                </div>
              </fieldset>

              {/* §1.5j — 이야기로 적어 주면 그 안에서 분위기·색·꽃 단서를 읽어 낸다. */}
              <fieldset className={styles.group}>
                <legend className={styles.groupHead}>들려주고 싶은 이야기</legend>
                <p className={styles.groupNote}>둘 다 선택이에요. 한 줄이면 충분해요.</p>

                <label className={styles.fieldLabel} htmlFor="q-recipient-note">
                  상대방은 어떤 사람인가요?
                </label>
                <textarea
                  id="q-recipient-note"
                  className={`${styles.field} ${styles.fieldArea}`}
                  rows={2}
                  maxLength={200}
                  placeholder="예: 조용한 카페에서 책 읽는 걸 좋아해요"
                  value={recipientNote}
                  onChange={(e) => setRecipientNote(e.target.value)}
                />

                <label className={styles.fieldLabel} htmlFor="q-episode">
                  함께한 기억이나 에피소드가 있나요?
                </label>
                <textarea
                  id="q-episode"
                  className={`${styles.field} ${styles.fieldArea}`}
                  rows={3}
                  maxLength={400}
                  placeholder="예: 작년 봄에 같이 튤립 축제에 갔어요"
                  value={episode}
                  onChange={(e) => setEpisode(e.target.value)}
                />

                <p className={styles.fieldNote}>
                  적어주신 이야기는 추천과 멘트에만 쓰고, 저장하지 않아요.
                </p>
              </fieldset>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <ChoiceList
                name="budget"
                labelledBy="q-title"
                options={options.budgets}
                value={budgetKey}
                onChange={setBudgetKey}
              />
              <fieldset className={styles.group}>
                <legend className={styles.groupHead}>전하는 날</legend>
                <p className={styles.groupNote}>그날 제철인 꽃을 먼저 보여드릴게요.</p>
                <input
                  className={styles.field}
                  type="date"
                  value={dateISO}
                  onChange={(e) => setDateISO(e.target.value)}
                  aria-label="꽃을 전하는 날"
                />
              </fieldset>
            </>
          ) : null}

          {step === 5 ? (
            <dl className={styles.summary}>
              <div className={styles.row}>
                <dt>사이</dt>
                <dd>{labelOf(options.relationships, relationship)}</dd>
              </div>
              <div className={styles.row}>
                <dt>마음</dt>
                <dd>{labelOf(options.intents, intent)}</dd>
              </div>
              <div className={styles.row}>
                <dt>분위기</dt>
                <dd>
                  {traits.length > 0
                    ? traits.map((t) => labelOf(options.traits, t)).join(' · ')
                    : '고르지 않았어요'}
                </dd>
              </div>
              <div className={styles.row}>
                <dt>좋아하는 색</dt>
                <dd>
                  {colorPrefs.length > 0
                    ? colorPrefs.map((c) => labelOf(options.colors, c)).join(' · ')
                    : '고르지 않았어요'}
                </dd>
              </div>
              <div className={styles.row}>
                <dt>반려동물·향</dt>
                <dd>
                  {[
                    ...pets.map((p) => labelOf(options.pets, p)),
                    ...(fragranceSensitive ? ['향에 민감해요'] : []),
                  ].join(' · ') || '해당 없음'}
                </dd>
              </div>
              <div className={styles.row}>
                <dt>예산</dt>
                <dd>{budgetKey ? labelOf(options.budgets, budgetKey) : '정하지 않았어요'}</dd>
              </div>
              <div className={styles.row}>
                <dt>전하는 날</dt>
                <dd>{dateISO || '정하지 않았어요'}</dd>
              </div>
              {recipientNote.trim() !== '' ? (
                <div className={styles.row}>
                  <dt>어떤 분</dt>
                  <dd>{recipientNote.trim()}</dd>
                </div>
              ) : null}
              {episode.trim() !== '' ? (
                <div className={styles.row}>
                  <dt>함께한 기억</dt>
                  <dd>{episode.trim()}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}

          <p className={styles.qnote}>
            <span className={styles.seal} aria-hidden="true" />
            꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
            들려드려요.
          </p>
        </main>
      </div>

      <div className={`${styles.bar} ${styles.footbar}`}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={next}
          disabled={!canAdvance || pending}
        >
          {pending ? '꽃을 고르는 중이에요…' : step === TOTAL_STEPS ? '추천받기' : '다음'}
          {pending ? null : <IconArrow />}
        </button>
        <p className={styles.micro}>
          {canAdvance ? '45초면 충분해요' : '하나만 골라주세요'}
        </p>
      </div>
    </>
  );
}
