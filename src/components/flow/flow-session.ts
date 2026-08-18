/**
 * 추천 플로우의 "돌아올 수 있는 길" — 히스토리 스택 표식 + 탭 한정 이어가기 저장.
 *
 * 사용자 신고(2026-08-17): "추천을 다 받고 구매 링크로 나갔다가 뒤로가기를 누르면
 * 아예 맨 처음(질문 1번)으로 온다." 원인은 걸음·답·결과가 전부 메모리에만 있던 것 —
 * 라우터가 페이지를 다시 세우는 순간(뒤로가기 복귀·새로고침) 셋 다 사라졌다.
 *
 * 재료는 둘이고 역할이 다르다:
 *   · 히스토리 상태(`dbFlow`) — **어느 걸음에 서 있었나**(걸음 번호·결과 여부·쌓은 깊이).
 *     엔트리마다 붙어 다녀서 뒤로/앞으로가 걸음 단위로 움직인다.
 *   · sessionStorage — **무엇을 골랐고 무엇을 받았나**(답·결과 payload).
 *     히스토리 상태에 싣지 않는 이유는 개인적인 입력(관계·마음·반려동물)을 세션
 *     히스토리에 남기지 않기 위해서다(RecommendFlow 머리말의 원칙 그대로).
 *
 * ⚠ 저장 위치는 sessionStorage **한 곳**이다 — 탭을 닫으면 사라지고, 서버·로그·DB 로는
 *   여전히 아무것도 가지 않는다. 화면의 약속("적어주신 내용은 저장하지 않아요")은 서버
 *   저장에 대한 말이고, 이것은 같은 탭 안에서 뒤로가기를 성립시키는 임시 기억이다.
 *   랜딩 게이트(`GATE_KEY`)와 같은 문법이다.
 */

import type { ResultPayload } from './types';

/** 위저드의 답 전부 — `Wizard` 의 상태 필드와 1:1 이다. */
export interface FlowAnswers {
  relationship: string;
  relationshipDetail: string;
  intent: string;
  intentDetail: string;
  preset: string;
  recipientChips: string[];
  colorPrefs: string[];
  recipientNote: string;
  episode: string;
  episodeHints: string[];
  episodeHintDetail: string;
  budgetKey: string;
  budgetDetail: string;
  dateISO: string;
}

export interface FlowSession {
  answers?: FlowAnswers;
  step?: number;
  payload?: ResultPayload;
}

/**
 * 히스토리 엔트리에 붙는 표식.
 *
 * `depth` 는 플로우의 첫 엔트리(0)부터 이 엔트리까지 **쌓아 온 수**다 — UI 의 `이전` 버튼이
 * `history.back()` 을 불러도 되는지(뒤에 우리 엔트리가 실제로 있는지)를 이 값으로 안다.
 * 복원된 새 엔트리는 depth 0 으로 다시 시작한다(그 뒤에는 플로우 밖 페이지가 있다).
 */
export type FlowPhase =
  | { view: 'wizard'; step: number; depth: number }
  | { view: 'result'; depth: number };

const SESSION_KEY = 'db-flow-v1';
const STATE_KEY = 'dbFlow';

export function loadFlowSession(): FlowSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as FlowSession) : null;
  } catch {
    // 사생활 보호 모드 등 sessionStorage 를 못 쓰는 환경 — 이어가기 없이도 플로우는 돈다.
    return null;
  }
}

export function saveFlowSession(patch: Partial<FlowSession>): void {
  try {
    const merged = { ...(loadFlowSession() ?? {}), ...patch };
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(merged));
  } catch {
    // 저장 실패는 조용히 넘어간다 — 이어가기가 안 될 뿐 지금 화면은 그대로다.
  }
}

export function clearFlowSession(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // 위와 같다.
  }
}

function isFlowPhase(value: unknown): value is FlowPhase {
  if (typeof value !== 'object' || value === null) return false;
  const phase = value as Record<string, unknown>;
  if (typeof phase.depth !== 'number') return false;
  if (phase.view === 'result') return true;
  return phase.view === 'wizard' && typeof phase.step === 'number';
}

/** 지금 서 있는 히스토리 엔트리의 표식. 우리 것이 아니면 null. */
export function readPhase(): FlowPhase | null {
  return phaseOf(window.history.state);
}

/** popstate 이벤트가 실어 온 상태에서 표식을 읽는다. */
export function phaseOf(state: unknown): FlowPhase | null {
  const phase = (state as Record<string, unknown> | null)?.[STATE_KEY];
  return isFlowPhase(phase) ? phase : null;
}

/**
 * 표식을 새 엔트리로 쌓거나(push) 지금 엔트리에 바꿔 단다(replace).
 * 기존 state 를 스프레드로 보존한다 — Next 라우터가 자기 몫을 같은 자리에 두기 때문이다.
 */
export function pushPhase(phase: FlowPhase): void {
  window.history.pushState({ ...window.history.state, [STATE_KEY]: phase }, '');
}

export function replacePhase(phase: FlowPhase): void {
  window.history.replaceState({ ...window.history.state, [STATE_KEY]: phase }, '');
}
