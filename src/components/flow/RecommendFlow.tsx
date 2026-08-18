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
import type {
  FlowResponse,
  MessageStreamState,
  ResultPayload,
  WizardOptions,
  WizardSubmission,
} from './types';
import styles from './flow.module.css';

/**
 * 정적 드롭 데모인가 — 빌드 타임에 값이 박힌다.
 *
 * 데모에는 멘트 스트리밍 라우트(`/recommend/stream`)가 **없다.** Next 는 정적 export 에서
 * POST 라우트 핸들러를 산출물에 넣지 않기 때문이다(2026-08-18 실측). 그 사실을 알고
 * 아예 부르지 않는다 — 부르면 404 한 번을 낭비하고 그만큼 결과가 늦어진다.
 * 데모의 멘트는 어차피 언제나 예문이라 흘려보낼 글자 자체가 없다.
 */
const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === '1';

/** 멘트 스트림의 주소. 라우트 파일은 `src/app/recommend/stream/route.ts` 다. */
const STREAM_URL = '/recommend/stream';

/** 스트림이 흘려보내는 줄 하나. 프로토콜의 정본은 라우트 핸들러 머리말에 있다. */
type StreamLine =
  | { kind: 'result'; payload: ResultPayload }
  | { kind: 'draft'; tones: MessageStreamState['drafts'] }
  | { kind: 'tones'; tones: ResultPayload['tones']; messageSource?: unknown; messageNote?: unknown }
  | { kind: 'settled' }
  | { kind: 'error'; message?: unknown };

/** 멘트가 확정되면 payload 에 이만큼만 갈아 끼운다(3안·이야기·색 선택은 그대로). */
type SettledMessages = Pick<ResultPayload, 'tones' | 'messageSource' | 'messageNote'>;

/** 아직 아무것도 흘러오지 않은 상태. `pending` 만 참이면 화면이 "쓰는 중" 을 세운다. */
const STREAM_START: MessageStreamState = { pending: true, drafts: {} };

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

/**
 * NDJSON 한 줄씩 읽어 넘긴다.
 *
 * 줄이 청크 경계에 걸쳐 오는 것이 정상이라(그러라고 스트림이다) 버퍼에 모았다가
 * 개행에서만 자른다. 반쪽 줄을 파싱하려 들면 그때부터 화면이 거짓말을 하기 시작한다.
 */
async function readNdjson(response: Response, onLine: (line: StreamLine) => void): Promise<void> {
  const body = response.body;
  if (!body) return;

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const take = (raw: string) => {
    const text = raw.trim();
    if (text === '') return;
    try {
      onLine(JSON.parse(text) as StreamLine);
    } catch {
      // 우리가 만든 줄이 아니다(프록시가 끼워 넣은 무엇이거나 잘렸다). 지나간다.
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    for (let nl = buffer.indexOf('\n'); nl !== -1; nl = buffer.indexOf('\n')) {
      take(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
    }
  }
  take(buffer);
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
  /**
   * 흘러나오는 중인 멘트 — **표시용**이다(`MessageStreamState` 주석의 경계).
   * `null` 이면 스트리밍이 도는 중이 아니고, 화면은 확정된 톤만 세운다.
   */
  const [stream, setStream] = useState<MessageStreamState | null>(null);
  /** popstate 클로저가 최신 결과를 보게 하는 거울 — 리스너는 마운트에 한 번만 걸기 때문이다. */
  const payloadRef = useRef<ResultPayload | null>(null);
  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);
  /**
   * 결과 화면이 서기 **전에** 멘트가 확정되면 여기서 기다린다.
   *
   * 스트림의 첫 줄이 위저드의 제출을 풀어 주고, 그 뒤 리액트가 결과 화면을 세운다.
   * 두 일 사이는 마이크로태스크 한 칸이라 실제로 겹칠 일은 없지만, 겹치면 **새로 쓴
   * 멘트가 조용히 사라진다** — 그 종류의 버그는 재현이 안 돼서 영영 안 잡힌다.
   */
  const pendingSettleRef = useRef<SettledMessages | null>(null);
  /** 도는 중인 스트림. `다시 골라보기` · 새 제출이 앞의 것을 끊는다. */
  const streamAbortRef = useRef<AbortController | null>(null);

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
    // 결과가 서기 전에 멘트가 확정됐다면(위 `pendingSettleRef`) 여기서 함께 얹는다.
    const early = pendingSettleRef.current;
    pendingSettleRef.current = null;
    const merged = early ? { ...next, ...early } : next;

    setPayload(merged);
    payloadRef.current = merged;
    setSubmission(submission);
    setView('result');
    saveFlowSession({ payload: merged });
    pushPhase({ view: 'result', depth: (readPhase()?.depth ?? 0) + 1 });
    toTop();
  }

  /** 확정된 멘트를 지금 결과에 갈아 끼운다. 결과가 아직 없으면 세워질 때까지 들고 있는다. */
  function settleMessages(settled: SettledMessages) {
    if (payloadRef.current === null) {
      pendingSettleRef.current = settled;
      return;
    }
    const next = { ...payloadRef.current, ...settled };
    payloadRef.current = next;
    setPayload(next);
    saveFlowSession({ payload: next });
  }

  /**
   * 멘트 스트림 한 판.
   *
   * 돌려주는 값은 **첫 결과**다(`messagesOnly` 면 `undefined`). 나머지 줄은 이 함수가
   * 끝난 뒤에도 계속 들어오고, 그때마다 위 상태를 갈아 끼운다 — 그래서 반환은
   * "화면을 세울 수 있게 됐다" 는 신호일 뿐 "다 끝났다" 가 아니다.
   *
   * 스트림을 못 열면 `null` 이다. 부르는 쪽은 **지금까지의 서버 액션 경로로 그대로
   * 내려간다** — 폴백 체인은 서버 안에 그대로 있고, 여기 실패는 "흘려보내지 못했다" 일 뿐
   * "멘트를 못 받았다" 가 아니다.
   */
  async function runStream(
    body: {
      submission: WizardSubmission;
      length?: MessageLength;
      messagesOnly?: boolean;
      /** 지금 화면에 서 있는 3안 — 멘트만 다시 받을 때 서버가 첫 안을 되돌리는 데 쓴다. */
      flowerIds?: string[];
    },
  ): Promise<{ payload?: ResultPayload; settled: boolean } | null> {
    if (STATIC_DEMO) return null;

    streamAbortRef.current?.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;

    let response: Response;
    try {
      response = await fetch(STREAM_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      return null;
    }
    // 본문은 읽지 않는다 — 오류 응답 본문 미독취 규칙(프로바이더 어댑터와 같은 선례).
    if (!response.ok || !response.body) return null;

    setStream(STREAM_START);

    let first: ResultPayload | undefined;
    let settled = false;
    let failed = false;

    /** 첫 결과가 오면 풀리는 문 — 위저드의 제출을 여기서 놓아 준다. */
    let openGate: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });

    const pump = (async () => {
      try {
        await readNdjson(response, (line) => {
          switch (line.kind) {
            case 'result':
              first = line.payload;
              openGate();
              break;
            case 'draft':
              setStream({ pending: true, drafts: line.tones });
              break;
            case 'tones':
              settled = true;
              settleMessages({
                tones: line.tones,
                messageSource: 'llm',
                messageNote:
                  typeof line.messageNote === 'string'
                    ? line.messageNote
                    : (payloadRef.current?.messageNote ?? ''),
              });
              break;
            case 'error':
              failed = true;
              openGate();
              break;
            default:
              // `settled` — 새로 쓴 문장이 없다. 예문이 그대로 선다.
              break;
          }
        });
      } catch {
        // 중간에 끊겼다. 이미 세운 화면은 그대로 두고 "쓰는 중" 표시만 내린다.
      } finally {
        if (streamAbortRef.current === controller) streamAbortRef.current = null;
        setStream(null);
        openGate();
      }
    })();

    // `messagesOnly` 는 세울 결과가 없으므로 끝까지 기다린다(멘트가 곧 반환값이다).
    if (body.messagesOnly) await pump;
    else await gate;

    if (failed) return null;
    if (!body.messagesOnly && first === undefined) return null;
    return first === undefined ? { settled } : { payload: first, settled };
  }

  /**
   * 위저드가 부르는 제출 — **스트리밍을 먼저 시도하고, 안 되면 지금까지의 길로 간다.**
   *
   * 스트리밍 경로에서는 결과가 멘트보다 먼저 온다(예문이 서 있는 채로). 그래서 사용자는
   * 3안·이야기를 곧바로 읽기 시작하고, 멘트는 그 아래에서 글자로 흘러 들어온다.
   */
  async function runSubmit(next: WizardSubmission): Promise<FlowResponse> {
    const streamed = await runStream({ submission: next });
    if (streamed?.payload) return { ok: true, payload: streamed.payload };
    return submitRecommendation(next);
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

    /*
     * 지금 화면에 서 있는 3안을 함께 보낸다 (2026-08-18).
     *
     * 서버는 이 답변으로 3안을 다시 계산하는데, §1.5j 해석 층이 붙은 뒤로 그 계산이
     * 결정적이지 않다 — 다시 고른 첫 안이 지금 화면의 첫 안과 다를 수 있고, 그러면
     * 새로 받은 멘트가 **화면에 없는 꽃**을 이야기한다. 우리가 아는 것을 넘겨주면
     * 서버가 다시 읽을 이유가 없어진다(그쪽 4초도 함께 사라진다).
     * ⚠ 꽃 id 는 우리 어휘다 — 자유 서술과 달리 실어 보내도 되는 값이다(§1.5j).
     */
    const flowerIds = current.options.map((option) => option.flowerId);

    // 새로 받기도 글자로 흘러 들어온다 — 첫 도착과 다른 규격을 쓸 이유가 없다.
    const streamed = await runStream({ submission, length, messagesOnly: true, flowerIds });
    if (streamed) return streamed.settled;

    let response;
    try {
      response = await regenerateMessages(submission, length, flowerIds);
    } catch {
      return false;
    }
    if (!response.ok) return false;

    const next: ResultPayload = { ...current, tones: response.tones };
    setPayload(next);
    payloadRef.current = next;
    saveFlowSession({ payload: next });
    return true;
  }

  /** 다시 골라보기 — 답·결과와 이어가기 저장을 함께 비운다(처음의 백지로). */
  function restart() {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    pendingSettleRef.current = null;
    clearFlowSession();
    setStream(null);
    setPayload(null);
    payloadRef.current = null;
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
          stream={stream}
        />
      ) : (
        <Wizard
          options={options}
          defaultDateISO={defaultDateISO}
          step={step}
          onStepChange={goToStep}
          onStepBack={stepBack}
          action={runSubmit}
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
