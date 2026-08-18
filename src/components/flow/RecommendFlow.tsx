'use client';

/**
 * 추천 플로우의 껍데기 — 질문과 결과를 **같은 페이지에서** 갈아 끼우고, 걸음(1~5 → 결과)을
 * **히스토리 스택과 한 벌로** 움직인다(2026-08-17 사용자 신고).
 *
 * 신고: "추천을 다 받고 구매 링크(파트너 화면)로 갔다가 뒤로가기를 누르면 아예 맨
 * 처음으로 온다." 걸음·답·결과가 메모리에만 있어서 페이지가 다시 서는 순간 다 잊었기
 * 때문이다. 지금은 걸음마다 히스토리 엔트리가 하나씩 쌓이고(브라우저 뒤로가기 = 이전
 * 질문·결과 복귀), 답과 결과는 탭 한정 sessionStorage 로 살아남는다 — 원칙과 이유는
 * `flow-session.ts` 머리말에 있다.
 *
 * 결과·답을 URL 로 넘기지 않는 원칙은 그대로다 — 개인적인 입력(관계·마음·반려동물)이
 * 주소창과 리퍼러에 남지 않게. 히스토리 상태에 실리는 것은 **걸음 번호뿐**이다.
 */

import { useEffect, useRef, useState } from 'react';

import type { MessageLength } from '@/lib/llm/contracts';

import { regenerateMessages, submitRecommendation } from '@/app/recommend/actions';
import ResultView from './ResultView';
import Wizard, { TOTAL_STEPS } from './Wizard';
import {
  clearFlowSession,
  loadFlowSession,
  phaseOf,
  pushPhase,
  readPhase,
  replacePhase,
  saveFlowSession,
} from './flow-session';
import type { ResultPayload, WizardOptions, WizardSubmission } from './types';
import styles from './flow.module.css';

/**
 * 결과가 도착했다는 것을 화면을 못 보는 사람에게도 알리는 한 줄.
 * 아래 live 영역은 **처음부터 비어 있는 채로 서 있다** — 나중에 통째로 생겨나는 영역은
 * 스크린리더가 읽어 주지 않는다. 값이 채워지는 순간이 곧 안내다.
 */
const RESULT_ANNOUNCEMENT = '꽃 세 가지를 골라 두었어요. 아래에서 하나씩 들려드릴게요.';

/** 히스토리·저장에서 온 값은 남의 손을 탄 값이다 — 걸음 범위(1~5)로 눌러 담는다. */
function clampStep(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 1;
  return Math.min(TOTAL_STEPS, Math.max(1, n));
}

/*
 * 질문 ↔ 결과를 오갈 때는 맨 위에서 시작한다. effect(`[payload]`)로 하지 않는 이유:
 * 스크롤은 "값이 바뀌어서 따라오는 일"이 아니라 **사용자가 누른 결과**다 — 누른 자리에
 * 두는 편이 언제 도는지 읽기 쉽고, 최초 마운트의 스크롤 복원도 건드리지 않는다.
 */
function toTop() {
  window.scrollTo({ top: 0 });
}

export interface RecommendFlowProps {
  options: WizardOptions;
  /** 전하는 날의 기본값(서버가 정한 "내일"). 서버·화면이 같은 값을 그려야 한다. */
  defaultDateISO: string;
}

/*
 * 제출 함수를 **props 로 받지 않고 여기서 import 한다.**
 *
 * 이 화면의 형제들(`GroupPlanner` · `StorySheet` · `BirthdayFinder`)이 전부 그렇게 하고
 * 있어서 모양을 맞춘 것이기도 하지만, 실질적인 이유는 정적 드롭 데모다:
 * `NEXT_PUBLIC_STATIC_DEMO=1` 빌드는 `@/app/recommend/actions` 를 브라우저용 어댑터로
 * 바꿔치기하는데(next.config.ts 의 `resolveAlias`), 서버 컴포넌트가 함수를 props 로
 * 건네는 구조에서는 그 바꿔치기가 성립하지 않는다 — 함수는 RSC 경계를 건널 수 없고,
 * 건널 수 있는 것은 "서버 액션"이라는 참조뿐이기 때문이다.
 */
export default function RecommendFlow({ options, defaultDateISO }: RecommendFlowProps) {
  /**
   * 걸음의 주인은 위저드가 아니라 이 컴포넌트다 — 히스토리 이벤트(popstate)는 위저드가
   * 결과 화면에 자리를 내준 뒤에도 계속 들려야 하기 때문이다.
   */
  const [step, setStep] = useState(1);
  const [payload, setPayload] = useState<ResultPayload | null>(null);
  const [view, setView] = useState<'wizard' | 'result'>('wizard');
  /**
   * 방금 보낸 답 — 멘트 `새로 받기`가 같은 재료로 다시 부탁할 때만 쓴다.
   *
   * ⚠ **메모리에만 둔다.** 이어가기 저장(sessionStorage)에는 위저드가 자기 몫으로 이미
   *   답을 넣지만, 여기서 또 넣지 않는다 — 이 값의 쓸모는 지금 이 화면 한 번뿐이고,
   *   새로고침해서 결과가 복원된 자리에는 재생성 버튼이 서지 않아도 된다(§1.5j 최소 보관).
   */
  const [submission, setSubmission] = useState<WizardSubmission | null>(null);
  /** popstate 클로저가 최신 결과를 보게 하는 거울 — 리스너는 마운트에 한 번만 걸기 때문이다. */
  const payloadRef = useRef<ResultPayload | null>(null);
  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  /** 다음·프리셋 건너뛰기 — 걸음 하나 = 히스토리 엔트리 하나. */
  function goToStep(next: number) {
    const target = clampStep(next);
    setView('wizard');
    setStep(target);
    saveFlowSession({ step: target });
    pushPhase({ view: 'wizard', step: target, depth: (readPhase()?.depth ?? 0) + 1 });
    toTop();
  }

  /**
   * `이전 질문` — 쌓아 온 엔트리가 실제로 있으면(depth > 0) 브라우저 뒤로가기와 **같은
   * 길**을 쓴다. UI 버튼과 브라우저 버튼이 다른 자리로 데려가면 스택이 거짓말이 된다.
   * 복원 직후처럼 뒤에 우리 엔트리가 없는 자리(depth 0)에서는 걸음만 바꾼다 —
   * 거기서 `back()` 을 부르면 플로우 밖(이전 페이지)으로 나가 버린다.
   */
  function stepBack() {
    const phase = readPhase();
    if (phase && phase.depth > 0) {
      window.history.back();
      return;
    }
    const prev = clampStep(step - 1);
    setStep(prev);
    saveFlowSession({ step: prev });
    replacePhase({ view: 'wizard', step: prev, depth: 0 });
    toTop();
  }

  function showResult(next: ResultPayload, submission: WizardSubmission) {
    setPayload(next);
    setSubmission(submission);
    setView('result');
    saveFlowSession({ payload: next });
    pushPhase({ view: 'result', depth: (readPhase()?.depth ?? 0) + 1 });
    toTop();
  }

  /**
   * 멘트만 다시 받아 온다 — 결과 화면의 `새로 받기` · `짧게/보통` (2026-08-18).
   *
   * 재료(답변)를 여기서 들고 있는 이유는 두 가지다. ① 서버는 그 답을 저장하지 않으므로
   * (§1.5j) 다시 부탁하려면 다시 보내는 수밖에 없다. ② 위저드는 결과가 서면 언마운트라
   * 답이 거기 남아 있을 수 없다.
   *
   * 새 톤이 오면 payload 의 `tones` 만 갈아 끼운다 — 3안·이야기·색 선택은 그대로 둔다.
   * 빈손이면 `false` 를 돌려주고 화면은 지금 멘트를 그대로 세워 둔다.
   */
  async function regenerate(length: MessageLength): Promise<boolean> {
    const current = payloadRef.current;
    if (!submission || !current) return false;

    let response;
    try {
      response = await regenerateMessages(submission, length);
    } catch {
      return false;
    }
    if (!response.ok) return false;

    const next: ResultPayload = { ...current, tones: response.tones };
    setPayload(next);
    saveFlowSession({ payload: next });
    return true;
  }

  /** 다시 골라보기 — 답·결과와 이어가기 저장을 함께 비운다(처음의 백지로). */
  function restart() {
    clearFlowSession();
    setPayload(null);
    setSubmission(null);
    setView('wizard');
    setStep(1);
    saveFlowSession({ step: 1 });
    pushPhase({ view: 'wizard', step: 1, depth: (readPhase()?.depth ?? 0) + 1 });
    toTop();
  }

  /*
   * 마운트 한 번 — ① 돌아온 자리 복원, ② popstate 구독.
   *
   * 복원이 effect 인 이유: 서버 HTML(질문 1번)과 하이드레이션 첫 렌더가 같아야 하므로
   * 첫 그리기 **뒤에** 바꾼다. 결과를 복원하는 순간 질문 화면이 한 프레임 스칠 수
   * 있는데, 그것이 하이드레이션 불일치보다 낫다.
   */
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 하이드레이션 뒤 정확히 한 번의
       복원이다. 첫 클라이언트 렌더는 서버 HTML(질문 1번)과 같아야 해서 lazy 초기값으로는
       옮길 수 없고, 추가 렌더 한 번으로 끝난다(연쇄 렌더가 아니다). */
    const saved = loadFlowSession();
    const phase = readPhase();

    if (phase?.view === 'result') {
      if (saved?.payload) {
        setPayload(saved.payload);
        setStep(clampStep(saved.step ?? TOTAL_STEPS));
        setView('result');
      } else {
        // 결과 엔트리인데 보여 줄 결과가 없다(새 탭이거나 `다시 골라보기`로 비웠다).
        replacePhase({ view: 'wizard', step: 1, depth: phase.depth });
      }
    } else if (phase) {
      setStep(clampStep(phase.step));
      if (saved?.payload) setPayload(saved.payload);
    } else {
      // 플로우에 막 들어온 엔트리 — 이어가던 걸음이 있으면 그 자리에서 다시 선다.
      const startStep = clampStep(saved?.step ?? 1);
      setStep(startStep);
      if (saved?.payload) setPayload(saved.payload);
      replacePhase({ view: 'wizard', step: startStep, depth: 0 });
    }
    /* eslint-enable react-hooks/set-state-in-effect -- 아래 popstate 콜백의 setState 는
       외부 이벤트 구독이라 규칙이 권하는 바로 그 모양이다. */

    const onPop = (event: PopStateEvent) => {
      const next = phaseOf(event.state);
      if (!next) return; // 플로우 밖 엔트리 — 라우터의 몫이다.
      if (next.view === 'result') {
        // 앞으로가기로 결과에 돌아온 경우. 결과가 이미 비워졌다면(다시 시작) 그대로 둔다.
        if (payloadRef.current) {
          setView('result');
          toTop();
        }
        return;
      }
      setView('wizard');
      setStep(clampStep(next.step));
      toTop();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <div className={`${styles.flow} ${styles.frame}`}>
      {/* 결과 도착 안내 — 화면에는 없고 낭독에만 있다. 빈 채로 미리 서 있어야 읽힌다. */}
      <p className="sr-only" role="status">
        {view === 'result' && payload ? RESULT_ANNOUNCEMENT : ''}
      </p>

      {view === 'result' && payload ? (
        <ResultView
          payload={payload}
          onRestart={restart}
          onRegenerate={submission ? regenerate : undefined}
        />
      ) : (
        <Wizard
          options={options}
          defaultDateISO={defaultDateISO}
          step={step}
          onStepChange={goToStep}
          onStepBack={stepBack}
          action={submitRecommendation}
          onResult={showResult}
        />
      )}

      {/* 필름 그레인 — 밴딩을 감춘다(확정 시안 공통) */}
      <svg
        className={styles.grain}
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="none"
      >
        <filter id="db-flow-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#db-flow-grain)" />
      </svg>
    </div>
  );
}
