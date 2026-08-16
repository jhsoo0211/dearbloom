'use client';

/**
 * 질문 5문항 — 한 화면에 한 질문(확정 시안 `design/app-v3/question.html` 문법).
 *
 *   ① 어떤 사이인가요        (시작 프리셋 8종 + 관계 7종 · 필수 — `직접 쓸게요` 는 한 줄 입력)
 *   ② 어떤 마음을 전하나요   (마음 8종 · 필수 — `직접 쓸게요` 를 고르면 한 줄 입력)
 *   ③ 받는 분은 어떤 분인가요 (특징 칩 한 그룹 · 좋아하는 색 · 상황 칩 7종 + 자유 서술 2필드)
 *   ④ 현실 조건              (예산 6종 · 전하는 날 — 예산 `기타` 도 한 줄 입력)
 *   ⑤ 확인하고 추천받기
 *
 * 선택지 값(slug)은 전부 서버가 엔진 어휘에서 만들어 props 로 내려준다 —
 * 화면이 어휘를 새로 만들지 않기 위해서다. 답은 서버 액션으로만 보내고 URL 에는 싣지 않는다.
 *
 * §1.5l 개편으로 늘어난 것은 **입력의 폭이지 단계 수가 아니다.** 프리셋은 1·2번을 한 번에
 * 채우고 3번으로 건너뛰는 지름길이고, 라디오 경로는 그대로 남아 있다.
 */

import { useEffect, useRef, useState, useTransition } from 'react';
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

/** 사이 목록에서 `직접 쓸게요` 를 가리키는 값. 어휘 원본은 엔진 RELATIONSHIPS 다. */
const RELATIONSHIP_OTHER = 'other';

/** 상황 칩에서 `기타` 를 가리키는 값. 어휘 원본은 서버 `EPISODE_HINTS` 다. */
const EPISODE_HINT_OTHER = 'other';

/** 예산 목록에서 `기타` 를 가리키는 값. 어휘 원본은 서버 `BUDGET_CHOICES` 다. */
const BUDGET_OTHER = 'other';

/**
 * §1.5l 직접 쓴 한 줄의 길이 상한 — 사이·마음·요즘 사이·예산이 모두 80자다.
 * 서버의 네 상수(`RELATIONSHIP_DETAIL_MAX_CHARS` · `INTENT_DETAIL_MAX_CHARS` ·
 * `EPISODE_HINT_DETAIL_MAX_CHARS` · `BUDGET_DETAIL_MAX_CHARS`)와 같은 값이다.
 */
const DETAIL_MAX = 80;

/**
 * 진행 표기를 우리말로 — `5문항 중 3번째` 는 설문지의 말이지 이야기의 말이 아니다.
 * 눈으로 보는 `3 / 5` 눈금은 그대로 두고, **읽히는 문장**만 이쪽으로 바꾼다.
 */
const STEP_ORDINALS = ['첫', '두', '세', '네', '다섯'] as const;

function stepPhrase(step: number): string {
  return `다섯 걸음 중 ${STEP_ORDINALS[step - 1] ?? step} 번째`;
}

/** 'YYYY-MM-DD' → '8월 16일'. 요약 한 줄에 기계가 읽는 날짜를 그대로 세우지 않는다. */
function dateLabel(dateISO: string): string {
  const trimmed = dateISO.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!m) return trimmed;
  return `${Number(m[2])}월 ${Number(m[3])}일`;
}

const STEP_HEADS = [
  { overline: 'Question 01', title: '어떤 사이인가요?', lede: '관계에 따라 같은 꽃말도 다르게 풀어드려요.' },
  {
    overline: 'Question 02',
    title: '어떤 마음을 전하나요?',
    lede: '하고 싶은 말을 먼저 고르면, 그 말에 어울리는 꽃을 찾아드려요.',
  },
  {
    overline: 'Question 03',
    title: '받는 분은 어떤 분인가요?',
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

/**
 * 화면(DOM)이 들고 있는 선택 중 **아직 상태로 올라오지 못한 값**. 없으면 null.
 *
 * 라디오는 "사용자가 골랐다"는 사실을 두 갈래로 전해 온다 — ① 하이드레이션 전에
 * 브라우저가 혼자 체크해 둔 것, ② 클릭. 둘이 묻는 것은 결국 같다: *화면이 든 선택이
 * 상태와 다른가?* 다르면 그 값을 상태로 올려야 한다. 그래서 판정을 한 곳에 모았다
 * (두 경로가 서로 다른 규칙을 갖게 되면 그 사이로 답이 또 샌다).
 *
 * 어휘 밖 값은 버린다 — 상태에 들어가는 slug 는 서버가 내려준 선택지뿐이다.
 */
export function pendingChoice(
  domValue: string | null | undefined,
  stateValue: string,
  options: readonly ChoiceOption[],
): string | null {
  if (!domValue) return null;
  if (domValue === stateValue) return null;
  if (!options.some((option) => option.value === domValue)) return null;
  return domValue;
}

/**
 * 관계·마음·예산처럼 하나만 고르는 목록. 시안의 헤어라인 리스트 그대로다.
 * (export 는 테스트가 이 목록만 따로 세워 보기 위한 것 — 화면에서는 이 파일 안에서만 쓴다.)
 */
export function ChoiceList({
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
  const groupRef = useRef<HTMLDivElement>(null);
  const promoted = useRef(false);

  /*
   * 하이드레이션 전에 누른 답을 상태로 끌어올린다(마운트 직후 딱 한 번).
   *
   * 서버가 보낸 HTML 에는 체크된 라디오가 하나도 없다 — 제어 컴포넌트라 `checked` 가
   * 상태에서 나오는데 그 상태가 아직 비어 있기 때문이다. 그래서 JS 가 닿기 전에 행을
   * 누르면 **브라우저만** 그 라디오를 체크하고 React 는 그 사실을 모른다. 게다가 React 는
   * 하이드레이션 때 사용자가 이미 넣어 둔 입력을 일부러 덮지 않으므로, 그 체크는 그대로
   * 남아 입력 트래커의 시작값이 된다. 그 뒤로는 **같은 행을 다시 눌러도** DOM 값이 그대로라
   * change 가 삼켜지고, 그 답은 다른 행을 누르기 전까지 영영 상태로 올라오지 못한다
   * (느린 회선의 실사용자에게 실제로 나던 버그).
   *
   * 두 갈래 중 답을 잃지 않는 쪽을 먼저 택했다 — 다시 묻지 않고 이미 누른 것을 살린다.
   * 화면은 여전히 상태에서만 그리므로 제어 컴포넌트 원칙도, §1.6b 선택 표현 하나도
   * 그대로다(DOM 을 읽는 것은 사용자의 의도를 전해 듣기 위해서지 화면을 그리기 위해서가
   * 아니다). 승격이 어떤 이유로든 새더라도 아래 onClick 이 같은 규칙으로 한 번 더 받는다.
   */
  useEffect(() => {
    if (promoted.current) return;
    promoted.current = true;
    const checked = groupRef.current?.querySelector<HTMLInputElement>('input:checked');
    const next = pendingChoice(checked?.value, value, options);
    if (next !== null) onChange(next);
  }, [options, value, onChange]);

  return (
    <div ref={groupRef} className={styles.rels} role="radiogroup" aria-labelledby={labelledBy}>
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
              /*
               * change 와 같은 규칙을 클릭에도 건다. React 는 라디오의 change 를 클릭에서
               * 만들어 내는데, 입력 트래커가 "값이 그대로"라고 보면 그 change 를 삼킨다 —
               * 위 주석의 상황이 정확히 그렇다. 클릭 자체는 삼켜지지 않으니 여기서 받는다.
               * 상태와 이미 같은 행이면 pendingChoice 가 null 을 돌려줘 아무 일도 하지
               * 않으므로(프리셋 표기 같은 곁가지 상태를 괜히 지우지 않는다), change 와
               * 겹쳐 두 번 불리더라도 값은 같다.
               */
              onClick={() => {
                const next = pendingChoice(option.value, value, options);
                if (next !== null) onChange(next);
              }}
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
  // §1.5l 사이 `직접 쓸게요` 한 줄. 마음 쪽과 같은 규칙이다 — 비워도 진행된다.
  const [relationshipDetail, setRelationshipDetail] = useState('');
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
  // §1.5l 상황 칩 `기타` 한 줄. 칩을 끄면 아래 toggleEpisodeHint 가 함께 지운다.
  const [episodeHintDetail, setEpisodeHintDetail] = useState('');
  const [budgetKey, setBudgetKey] = useState('');
  // §1.5l 예산 `기타` 한 줄. 엔진에는 가지 않고 결과 맥락 칩에만 선다.
  const [budgetDetail, setBudgetDetail] = useState('');
  const [dateISO, setDateISO] = useState(defaultDateISO);
  const [pending, startSubmit] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const head = STEP_HEADS[step - 1];
  const canAdvance = step === 1 ? relationship !== '' : step === 2 ? intent !== '' : true;

  /*
   * 단계가 바뀌면 그 단계의 제목으로 포커스를 옮긴다.
   *
   * 화면은 통째로 갈아 끼워지는데 포커스는 `<body>` 에 남아 있었다 — 키보드로 오는 사람은
   * Tab 을 문서 처음부터 다시 세어야 했고, 스크린리더에게는 방금 무엇이 바뀌었는지
   * 아무도 말해 주지 않았다. 제목은 그 단계가 무엇을 묻는지 그대로 말하는 자리다.
   *
   * **최초 마운트에서는 옮기지 않는다.** 페이지에 막 들어온 사람의 포커스를 빼앗을 이유가
   * 없다. `preventScroll` 은 바로 앞에서 이미 맨 위로 올려 둔 스크롤과 다투지 않으려는 것이다.
   */
  const titleRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    titleRef.current?.focus({ preventScroll: true });
  }, [step]);

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
    setRelationshipDetail('');
    setIntent(option.intent);
    setIntentDetail('');
    setStep(3);
    window.scrollTo({ top: 0 });
  }

  function chooseRelationship(next: string) {
    setRelationship(next);
    setPreset('');
    // 다른 사이로 옮기면 직접 쓴 한 줄은 남겨 둘 자리가 없다(요약이 거짓말하지 않게).
    if (next !== RELATIONSHIP_OTHER) setRelationshipDetail('');
  }

  function chooseIntent(next: string) {
    setIntent(next);
    setPreset('');
    if (next !== INTENT_OTHER) setIntentDetail('');
  }

  function chooseBudget(next: string) {
    setBudgetKey(next);
    if (next !== BUDGET_OTHER) setBudgetDetail('');
  }

  /** 상황 칩 토글. `기타` 를 끄면 그 아래 한 줄도 함께 지운다. */
  function toggleEpisodeHint(value: string) {
    const next = toggle(episodeHints, value);
    setEpisodeHints(next);
    if (value === EPISODE_HINT_OTHER && !next.includes(EPISODE_HINT_OTHER)) {
      setEpisodeHintDetail('');
    }
  }

  /**
   * 제출은 트랜지션 안에서 돈다 — 대기 표시(`pending`)를 우리가 켜고 끄지 않고 React 가
   * 잡아 준다. 직접 들고 있던 boolean 은 `finally` 를 한 번만 빠뜨려도 버튼이 영영
   * 잠기는 종류의 상태였다.
   */
  function submit() {
    setError(null);
    startSubmit(async () => {
      try {
        const response = await action({
          relationship,
          relationshipDetail: relationship === RELATIONSHIP_OTHER ? relationshipDetail : '',
          intent,
          intentDetail: intent === INTENT_OTHER ? intentDetail : '',
          recipientChips,
          colorPrefs,
          recipientNote,
          episode,
          episodeHints,
          episodeHintDetail: episodeHints.includes(EPISODE_HINT_OTHER) ? episodeHintDetail : '',
          budgetKey,
          budgetDetail: budgetKey === BUDGET_OTHER ? budgetDetail : '',
          dateISO,
        });
        if (response.ok) onResult(response.payload);
        else setError(response.message);
      } catch {
        setError('추천을 받아 오다 잠깐 길이 끊겼어요. 조금 뒤에 다시 눌러 주세요.');
      }
    });
  }

  function next() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    submit();
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
            aria-label="질문 진행"
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-valuenow={step}
            aria-valuetext={stepPhrase(step)}
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
          {/*
            데스크톱(1024px↑)은 결과 화면과 같은 2단이다 — 좌단(질문)이 sticky 로 붙어 있고
            우단(답)만 스크롤한다. 모바일에서는 이 래퍼들이 그냥 블록이라 **DOM 순서 =
            지금까지의 한 칼럼 순서** 그대로다. 폰 프레임을 흉내 낸 좁은 캔버스가 아니라
            사이트의 한 페이지로 읽히게 하는 것이 이 골격의 목적이다(§1.5l ⑥).
          */}
          <div className={styles.qtwo}>
            <div className={styles.qcolA}>
              <div className={styles.qcolAInner}>
                <div className={styles.qhead}>
                  <p className={styles.overline}>
                    {head.overline} <span className={styles.ko}>{stepPhrase(step)}</span>
                  </p>
                  {/* tabIndex={-1} — 단계가 바뀔 때 포커스를 받는 자리다(마우스로는 눌리지 않는다). */}
                  <h1 id="q-title" tabIndex={-1} ref={titleRef}>
                    {head.title}
                  </h1>
                  <p className={styles.lede}>{head.lede}</p>
                </div>
              </div>
            </div>

            <div className={styles.qcolB}>
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
                      여러 분께 드릴 거라면 받는 분마다 꽃을 따로 골라드릴게요. 지금은 한 분께 드리는
                      길이에요.
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

                  {/* §1.5l — 목록에 없는 사이. 적어 주면 멘트가 그 말투로 쓰인다. */}
                  {relationship === RELATIONSHIP_OTHER ? (
                    <div className={styles.group}>
                      <label className={styles.fieldLabel} htmlFor="q-relationship-detail">
                        어떤 사이인지 한 줄로 적어 주세요
                      </label>
                      <input
                        id="q-relationship-detail"
                        className={styles.field}
                        type="text"
                        maxLength={DETAIL_MAX}
                        placeholder="예: 10년째 같은 밴드에서 합주하는 사이예요"
                        value={relationshipDetail}
                        onChange={(e) => setRelationshipDetail(e.target.value)}
                      />
                      <p className={styles.fieldNote}>
                        비워 두셔도 괜찮아요. 적어주신 내용은 추천과 멘트에만 쓰고, 저장하지 않아요.
                      </p>
                    </div>
                  ) : null}
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
                        maxLength={DETAIL_MAX}
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
                    {/* 이 단계의 제목이 이미 `받는 분은 어떤 분인가요?` 다 — 여기서 되풀이하지 않는다. */}
                    <legend className={styles.groupHead}>어떤 분인가요</legend>
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
                      그 사람은 어떤 사람인가요?
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
                        onToggle={toggleEpisodeHint}
                      />
                    </div>

                    {/* §1.5l `기타` — 여섯 갈래에 없는 사이. 마음·관계와 같은 문법이다. */}
                    {episodeHints.includes(EPISODE_HINT_OTHER) ? (
                      <>
                        <label className={styles.fieldLabel} htmlFor="q-episode-hint-detail">
                          요즘 어떤 사이인지 한 줄로 적어 주세요
                        </label>
                        <input
                          id="q-episode-hint-detail"
                          className={styles.field}
                          type="text"
                          maxLength={DETAIL_MAX}
                          placeholder="예: 서로 바빠서 자주 못 보지만 마음은 그대로예요"
                          value={episodeHintDetail}
                          onChange={(e) => setEpisodeHintDetail(e.target.value)}
                        />
                      </>
                    ) : null}

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
                    onChange={chooseBudget}
                  />

                  {/*
                    §1.5l 예산 `기타` — 아직 정하지 않았거나 직접 적고 싶은 경우.
                    ⚠ 이 한 줄은 **멘트로 넘어가지 않는다**(프롬프트 절대 규칙 3: 가격 금지).
                       그래서 안내 문구도 "멘트에 쓴다" 고 말하지 않는다.
                  */}
                  {budgetKey === BUDGET_OTHER ? (
                    <div className={styles.group}>
                      <label className={styles.fieldLabel} htmlFor="q-budget-detail">
                        생각하시는 값이 있다면 한 줄로 적어 주세요
                      </label>
                      <input
                        id="q-budget-detail"
                        className={styles.field}
                        type="text"
                        maxLength={DETAIL_MAX}
                        placeholder="예: 아직 못 정했어요 / 받는 분이 부담 없을 만큼만"
                        value={budgetDetail}
                        onChange={(e) => setBudgetDetail(e.target.value)}
                      />
                      <p className={styles.fieldNote}>
                        비워 두셔도 괜찮아요. 값을 정하지 않으면 모든 가격대의 꽃을 함께
                        보여드릴게요. 적어주신 내용은 저장하지 않아요.
                      </p>
                    </div>
                  ) : null}

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
                    <dd>
                      {labelOf(options.relationships, relationship)}
                      {relationship === RELATIONSHIP_OTHER && relationshipDetail.trim() !== ''
                        ? ` — ${relationshipDetail.trim()}`
                        : ''}
                    </dd>
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
                    <dd>
                      {budgetKey ? labelOf(options.budgets, budgetKey) : '정하지 않았어요'}
                      {budgetKey === BUDGET_OTHER && budgetDetail.trim() !== ''
                        ? ` — ${budgetDetail.trim()}`
                        : ''}
                    </dd>
                  </div>
                  <div className={styles.row}>
                    <dt>전하는 날</dt>
                    <dd>{dateISO ? dateLabel(dateISO) : '정하지 않았어요'}</dd>
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
                      <dd>
                        {labelsOf(options.episodeHints, episodeHints)}
                        {episodeHints.includes(EPISODE_HINT_OTHER) && episodeHintDetail.trim() !== ''
                          ? ` — ${episodeHintDetail.trim()}`
                          : ''}
                      </dd>
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
            </div>
          </div>
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
