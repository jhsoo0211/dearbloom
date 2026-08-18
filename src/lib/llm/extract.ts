/**
 * 자유 서술 해석 — **서버 전용**. design-spec §1.5j.
 *
 * 하는 일은 하나다: 사용자가 적어 준 두 줄을 받아 **우리 어휘로 옮긴 값**을 돌려주거나,
 * 못 하면 `null` 을 돌려준다. `null` 은 "기존 로컬 경로로 가라" 는 신호이고
 * (`inferCuesFromTexts` — 지금까지 쓰던 사전), 호출부는 이 값 하나만 보면 된다.
 *
 * ── 폴백 사다리 ──────────────────────────────────────────────────────
 *   gemini → claude → clova → nvidia  (있는 키만, `chain.ts` 의 그 순서 그대로)
 *   전부 실패 · 키 없음 · 타임아웃  →  `null` → 로컬 사전 경로
 * 사용자 확정("성향+에피소드를 AI 로 처리하다가 API 다 쓰면 폴백으로 로컬 처리")이
 * 그대로 이 사다리다. 정적 데모는 키가 없으므로 **언제나** 로컬 경로다 — 그것이 이
 * 폴백의 데모판이고, 데모 쌍둥이(`src/lib/demo/recommend-actions.ts`)는 한 글자도
 * 바뀌지 않는다(애초에 이 함수를 부르지 않는다).
 *
 * ── 4초인 이유 ───────────────────────────────────────────────────────
 * 멘트 생성의 10초와 **별개의 예산**이다. 멘트는 결과 화면이 이미 선 뒤에 흘러 들어오지만
 * (`stream/route.ts` 의 첫 줄이 결과다), 추출은 엔진보다 **앞에** 선다 — 여기서 쓰는 시간은
 * 사용자가 빈 화면을 보는 시간에 그대로 더해진다. 그래서 짧게 끊고, 못 받으면 지금까지
 * 하던 대로 사전으로 고른다. 늦은 해석보다 제때 나오는 추천이 낫다.
 */

import { runChain, stripCodeFence } from './chain';
import type { PromptBundle } from './chain';
import { extractRequestSchema, parseExtractResponse } from './extract-contracts';
import type { ExtractRequest, ExtractRequestParsed, ExtractedCues } from './extract-contracts';
import {
  buildExtractGeminiSchema,
  buildExtractJsonSchema,
  buildExtractSystemPrompt,
  buildExtractUserPrompt,
} from './extract-prompt';

/**
 * 호출 전체(재시도 + 폴백)에 주는 시간. 위 머리말의 "4초인 이유" 참고.
 * 멘트의 10초(`provider.ts` 의 `TIMEOUT_MS`)와 **합쳐지지 않는다** — 서로 다른 호출이다.
 */
export const EXTRACT_TIMEOUT_MS = 4_000;

/**
 * 여섯 칸짜리 짧은 JSON 이라 넉넉하다. 멘트(2048)보다 훨씬 작게 잡는 것이 곧 속도다 —
 * 상한이 크면 추론 모델이 그 공간을 다 쓰려 든다.
 */
const MAX_OUTPUT_TOKENS = 512;

/** 요청 한 건을 체인이 실어 보낼 한 벌로 옮긴다. */
function bundleFor(req: ExtractRequestParsed): PromptBundle {
  return {
    system: buildExtractSystemPrompt(),
    user: buildExtractUserPrompt(req),
    jsonSchema: buildExtractJsonSchema(),
    geminiSchema: buildExtractGeminiSchema(),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  };
}

/**
 * 자유 서술 두 줄 → 우리 어휘.
 *
 * `null` 이 돌아오는 경우는 전부 "로컬 사전 경로로 가라" 이다:
 *   적어 준 글이 없음 / 계약 위반 / 키가 없음 / 타임아웃 / 체인의 모든 프로바이더가 실패
 *
 * **글이 둘 다 비면 부르지 않는다.** 읽을 것이 없는데 4초를 쓰는 것은 그 자체로 버그다 —
 * 칩만 고르고 넘어간 사용자의 결과가 늦어질 이유가 없다(브리프의 "지연 0").
 *
 * **첫 줄이 계약 검사다.** 이 함수에 들어오는 값의 뿌리에는 사용자가 쓴 글이 있고,
 * 길이가 계약을 벗어난 요청을 그대로 프롬프트에 실어 보내면 토큰 예산도 시간 예산도
 * 지켜 줄 사람이 없다.
 *
 * ⚠ 원문은 요청 본문으로만 흘러간다. 실패는 짧은 사유로만 찍고 받은 값·응답 본문·예외
 *   객체를 console 에 넘기지 않는다(§1.5j).
 */
export async function extractCues(req: ExtractRequest): Promise<ExtractedCues | null> {
  const validated = extractRequestSchema.safeParse(req);
  if (!validated.success) {
    // ⚠ 오류 객체를 찍지 않는다 — zod 의 issue 에는 받은 값(자유 서술 원문)이 섞인다.
    console.error('[llm] 해석 요청이 계약을 벗어났습니다. (내용은 남기지 않습니다)');
    return null;
  }
  const request = validated.data;

  if (request.recipient_note.trim() === '' && request.episode.trim() === '') return null;

  /*
   * 펜스를 여기서 벗긴다 — CLOVA·NVIDIA 는 구조화 출력 필드를 못 받아 프롬프트로 JSON 을
   * 부탁하는 경로라(`buildSchemaPinnedPrompt`) ```json 펜스가 붙어 오는 일이 있다.
   * 계약(`parseExtractResponse`)은 순수 함수로 두고 껍질만 이 자리에서 벗긴다.
   */
  return runChain(bundleFor(request), (raw) => parseExtractResponse(stripCodeFence(raw)), {
    timeoutMs: EXTRACT_TIMEOUT_MS,
  });
}
