'use client';

/**
 * 질문 5문항 — 한 화면에 한 질문(확정 시안 `design/app-v3/question.html` 문법).
 *
 *   ① 어떤 사이인가요        (시작 프리셋 8종 + 관계 6종 · 필수)
 *   ② 어떤 마음을 전하나요   (마음 8종 · 필수 — `직접 쓸게요` 를 고르면 한 줄 입력)
 *   ③ 상대는 어떤 분인가요   (특징 칩 한 그룹 · 좋아하는 색 · 상황 칩 + 자유 서술 2필드)
 *   ④ 현실 조건              (예산 · 전하는 날)
 *   ⑤ 확인하고 추천받기
 *
 * 선택지 값(slug)은 전부 서버가 엔진 어휘에서 만들어 props 로 내려준다 —
 * 화면이 어휘를 새로 만들지 않기 위해서다. 답은 서버 액션으로만 보내고 URL 에는 싣지 않는다.
 *
 * §1.5l 개편으로 늘어난 것은 **입력의 폭이지 단계 수가 아니다.** 프리셋은 1·2번을 한 번에
 * 채우고 3번으로 건너뛰는 지름길이고, 라디오 경로는 그대로 남아 있다.
 */

import { useState } from 'react';
import Link from 'next/link';

import type {
  ChoiceOption,
  ColorChoice,
  FlowResponse,
  PresetOption,
  ResultPayload,
  WizardOptions,
  WizardSubmission,
} from './types';
import styles from './flow.module.css';

const TOTAL_STEPS = 5;

/** 마음 목록에서 `직접 쓸게요` 를 가리키는 값. 어휘 원본은 엔진 INTENTS 다. */
const INTENT_OTHER = 'other';

/** §1.5l 직접 쓴 마음 한 줄의 길이 상한(서버 `INTENT_DETAIL_MAX_CHARS` 와 같은 값). */
const INTENT_DETAIL_MAX = 80;

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
  // §1.5l `직접 쓸게요` 한 줄. 비워도 진행된다 — 고르는 것 자체가 이미 답이다.
  const [intentDetail, setIntentDetail] = useState('');
  /** 어떤 프리셋으로 시작했는지. 관계·마음을 직접 고치면 지운다(요약이 거짓말하지 않게). */
  const [preset, setPreset] = useState('');
  const [recipientChips, setRecipientChips] = useState<string[]>([]);
  const [colorPrefs, setColorPrefs] = useState<string[]>([]);
  // §1.5j 자유 서술 2필드. 둘 다 선택이고, 서버로만 건너가며 저장되지 않는다.
  const [recipientNote, setRecipientNote] = useState('');
  const [episode, setEpisode] = useState('');
  const [episodeHints, setEpisodeHints] = useState<string[]>([]);
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

  function labelsOf(list: ChoiceOption[] | ColorChoice[], values: string[]): string {
    return values.length > 0 ? values.map((v) => labelOf(list, v)).join(' · ') : '';
  }

  /**
   * §1.5l 시작 프리셋 — 관계·마음을 한 번에 채우고 3번 질문으로 건너뛴다.
   * **건너뛴 것이지 잠근 것이 아니다.** 뒤로 가면 1·2번이 고른 값 그대로 서 있다.
   */
  function applyPreset(option: PresetOption) {
    setPreset(option.value);
    setRelationship(option.relationship);
    setIntent(option.intent);
    setIntentDetail('');
    setStep(3);
    window.scrollTo({ top: 0 });
  }

  function chooseRelationship(next: string) {
    setRelationship(next);
    setPreset('');
  }

  function chooseIntent(next: string) {
    setIntent(next);
    setPreset('');
    if (next !== INTENT_OTHER) setIntentDetail('');
  }

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const response = await action({
        relationship,
        intent,
        intentDetail: intent === INTENT_OTHER ? intentDetail : '',
        recipientChips,
        colorPrefs,
        recipientNote,
        episode,
        episodeHints,
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
            <>
              {/*
                #20 — 여러 명에게 주는 경우는 **이 위저드가 다루지 않는다.**
                랜딩 내비에 `여러 명에게` 를 따로 세워 두었더니 두 갈래가 첫 화면에서
                갈려 버렸고("추천 시작"과 "여러 명에게" 중 무엇이 본류인지 알 수 없다),
                묶음 추천은 질문 자체가 다르다(누구누구인지·몇 다발인지). 그래서 진입은
                하나로 모으고 갈림길만 여기 한 줄로 둔다 — 고르면 기존 그룹 플로우로
                건너간다. 위저드를 둘로 나누거나 합치지 않는다.
              */}
              <div className={styles.group}>
                <p className={styles.groupHead} id="q-count">
                  몇 분께 드리나요?
                </p>
                <div className={styles.chips} role="group" aria-labelledby="q-count">
                  <button
                    type="button"
                    className={`${styles.chip} ${styles.chipOn}`}
                    aria-pressed={true}
                  >
                    한 분께
                  </button>
                  <Link
                    className={`${styles.chip} ${styles.chipLink}`}
                    href="/groups"
                    prefetch={false}
                  >
                    여러 분께
                  </Link>
                </div>
                <p className={styles.groupNote}>
                  여러 분께 드릴 거라면 묶음 추천으로 안내해 드려요 — 받는 분마다 꽃을 따로
                  골라드립니다. 이 질문은 한 분께 드리는 경우예요.
                </p>
              </div>

              {/* §1.5l 시작 프리셋 — 자주 오는 순간 8가지. 1·2번을 한 번에 채운다. */}
              <div className={styles.group}>
                <p className={styles.groupHead} id="q-presets">
                  이런 순간이신가요?
                </p>
                <p className={styles.groupNote}>
                  고르면 두 질문을 건너뛰어요. 다음 화면에서 언제든 되돌아와 바꿀 수 있어요.
                </p>
                <div className={styles.chips} role="group" aria-labelledby="q-presets">
                  {options.presets.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={styles.chip}
                      onClick={() => applyPreset(option)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className={styles.presetDivider}>또는 직접 고를게요</p>

              <ChoiceList
                name="relationship"
                labelledBy="q-title"
                options={options.relationships}
                value={relationship}
                onChange={chooseRelationship}
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <ChoiceList
                name="intent"
                labelledBy="q-title"
                options={options.intents}
                value={intent}
                onChange={chooseIntent}
              />

              {/* §1.5l — 목록에 없는 마음. 적어 주면 멘트가 그 상황을 직접 다룬다. */}
              {intent === INTENT_OTHER ? (
                <div className={styles.group}>
                  <label className={styles.fieldLabel} htmlFor="q-intent-detail">
                    어떤 마음인지 한 줄로 적어 주세요
                  </label>
                  <input
                    id="q-intent-detail"
                    className={styles.field}
                    type="text"
                    maxLength={INTENT_DETAIL_MAX}
                    placeholder="예: 유학 떠나는 조카를 배웅해요"
                    value={intentDetail}
                    onChange={(e) => setIntentDetail(e.target.value)}
                  />
                  <p className={styles.fieldNote}>
                    비워 두셔도 괜찮아요. 적어주신 내용은 추천과 멘트에만 쓰고, 저장하지 않아요.
                  </p>
                </div>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              {/*
                §1.5l — 분위기·향·반려동물을 한 그룹으로 합쳤다. 묻는 것이 결국 같은
                질문이라 위계를 셋으로 나눌 이유가 없다. 반려동물 안전 제외는 칩이
                그대로 이어받는다(서버가 pets 로 나눈다).
              */}
              <fieldset className={styles.group}>
                <legend className={styles.groupHead}>받는 분은 어떤 분인가요</legend>
                <p className={styles.groupNote}>
                  여러 개 골라도 좋아요. 반려동물을 알려주시면 위험한 꽃은 미리 빼드려요.
                </p>
                <ToggleChips
                  options={options.recipientChips}
                  values={recipientChips}
                  onToggle={(v) => setRecipientChips(toggle(recipientChips, v))}
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

              {/* §1.5j — 이야기로 적어 주면 그 안에서 분위기·색·꽃 단서를 읽어 낸다. */}
              <fieldset className={styles.group}>
                <legend className={styles.groupHead}>들려주고 싶은 이야기</legend>
                <p className={styles.groupNote}>전부 선택이에요. 한 줄이면 충분해요.</p>

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

                {/* §1.5l 상황 칩 — 빈 칸 앞에서 멈추지 않도록 고를 수도 있게 열어 둔 길. */}
                <p className={styles.fieldLabel} id="q-episode-hints">
                  요즘 두 분 사이는 어떤가요?
                </p>
                <div className={styles.hintChips} role="group" aria-labelledby="q-episode-hints">
                  <ToggleChips
                    options={options.episodeHints}
                    values={episodeHints}
                    onToggle={(v) => setEpisodeHints(toggle(episodeHints, v))}
                  />
                </div>

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
              {/* 프리셋으로 시작했다면 그 사실부터 — 관계·마음이 어디서 왔는지 보이게. */}
              {preset !== '' ? (
                <div className={styles.row}>
                  <dt>고른 순간</dt>
                  <dd>{labelOf(options.presets, preset)}</dd>
                </div>
              ) : null}
              <div className={styles.row}>
                <dt>사이</dt>
                <dd>{labelOf(options.relationships, relationship)}</dd>
              </div>
              <div className={styles.row}>
                <dt>마음</dt>
                <dd>
                  {labelOf(options.intents, intent)}
                  {intent === INTENT_OTHER && intentDetail.trim() !== ''
                    ? ` — ${intentDetail.trim()}`
                    : ''}
                </dd>
              </div>
              <div className={styles.row}>
                <dt>받는 분</dt>
                <dd>{labelsOf(options.recipientChips, recipientChips) || '고르지 않았어요'}</dd>
              </div>
              <div className={styles.row}>
                <dt>좋아하는 색</dt>
                <dd>{labelsOf(options.colors, colorPrefs) || '고르지 않았어요'}</dd>
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
              {episodeHints.length > 0 ? (
                <div className={styles.row}>
                  <dt>요즘 사이</dt>
                  <dd>{labelsOf(options.episodeHints, episodeHints)}</dd>
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
