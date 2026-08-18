/**
 * 멘트 생성 프로바이더 어댑터 — **서버 전용**.
 *
 * 하는 일은 하나다: `GenerateRequest` 를 받아 3톤 멘트를 만들어 오거나, 못 만들면
 * `null` 을 돌려준다. `null` 은 "템플릿 폴백으로 가라" 는 신호이고, 호출부(actions.ts)는
 * 이 값 하나만 보면 된다.
 *
 * ── HTTP·폴백은 여기 없다 (2026-08-18) ───────────────────────────────
 * 프로바이더 넷을 부르는 배관(키 해석 · 재시도 · SSE · 오류 로그 규율)은 `chain.ts` 로
 * 나갔다. 같은 체인을 자유 서술 해석(`extract.ts`)도 타야 했고, 체인이 두 벌이 되는 순간
 * 둘은 서로 다르게 늙기 때문이다. 이 파일에 남은 것은 **멘트라는 용도**뿐이다 —
 * 어떤 프롬프트를 세우고, 무엇을 계약으로 삼고, 시간을 얼마나 쓰는가.
 */

import { runChain } from './chain';
import type { PartialSink, PromptBundle } from './chain';
import { generateRequestSchema, generateResponseSchemaFor } from './contracts';
import type {
  GenerateRequest,
  GenerateRequestParsed,
  GenerateResponse,
  MessageLength,
} from './contracts';
import { buildGeminiSchema, buildJsonSchema, buildSystemPrompt, buildUserPrompt } from './prompt';
import { stripCodeFence } from './chain';

/**
 * 호출 전체(재시도 + 폴백)에 주는 시간.
 * 사용자는 결과 화면을 기다리는 중이고, 늦은 멘트보다 준비된 예문이 낫다.
 */
const TIMEOUT_MS = 10_000;

/** 3톤 × 200자 + 부연이면 넉넉하다. */
const MAX_OUTPUT_TOKENS = 2048;

/** 스트리밍 콜백의 모양. 배관 쪽 타입을 그대로 쓰되 이름은 이 자리에서도 열어 둔다. */
export type { PartialSink };

/**
 * 텍스트 → JSON → zod. 어디서 깨지든 `null` 이다(무엇이 왔는지는 찍지 않는다).
 *
 * `length` 를 받는 이유는 **멘트 상한이 길이 축마다 다르기 때문**이다
 * (`MESSAGE_LENGTH_MAX_CHARS`). 상한을 넘긴 답은 여기서 `null` 이 되고, 부르는 쪽의
 * 재시도·폴백이 그대로 돈다 — 잘라 붙이는 길은 없다.
 */
function parseResponse(raw: string | null, length: MessageLength): GenerateResponse | null {
  if (raw === null || raw.trim() === '') return null;

  let json: unknown;
  try {
    json = JSON.parse(stripCodeFence(raw));
  } catch {
    return null;
  }

  const parsed = generateResponseSchemaFor(length).safeParse(json);
  return parsed.success ? parsed.data : null;
}

/** 요청 한 건을 체인이 실어 보낼 한 벌로 옮긴다. */
function bundleFor(req: GenerateRequestParsed): PromptBundle {
  return {
    system: buildSystemPrompt(),
    user: buildUserPrompt(req),
    jsonSchema: buildJsonSchema(req),
    geminiSchema: buildGeminiSchema(req),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  };
}

/**
 * 3톤 멘트를 한 번에 만들어 온다.
 *
 * `null` 이 돌아오는 경우는 전부 "템플릿 폴백" 이다:
 *   계약 위반 / 키가 없음 / 타임아웃 / 체인의 모든 프로바이더가 실패(HTTP 오류·네트워크·파싱)
 *
 * **첫 줄이 계약 검사다.** 타입 주석은 컴파일이 끝나면 사라지고, 이 함수에 들어오는 값의
 * 뿌리에는 사용자가 쓴 글(자유 서술)이 있다. 길이·어휘가 계약을 벗어난 요청을 그대로
 * 프롬프트에 실어 보내면 토큰 예산도 안전 규칙도 지켜 줄 사람이 없다 — 여기서 막고
 * 준비된 예문으로 떨어뜨린다.
 *
 * `onPartial` 을 주면 **스트리밍이 가능한 프로바이더만** 흘려보내며 부른다(gemini · claude ·
 * nvidia). CLOVA 와 모든 실패 경로는 지금까지와 똑같이 한 번에 온다 — 폴백 체인의
 * 순서도 재시도 규칙도 이 인자에 따라 달라지지 않는다.
 */
export async function generateMessages(
  req: GenerateRequest,
  onPartial?: PartialSink,
): Promise<GenerateResponse | null> {
  const validated = generateRequestSchema.safeParse(req);
  if (!validated.success) {
    // ⚠ 오류 객체를 찍지 않는다 — zod 의 issue 에는 받은 값(자유 서술 원문)이 섞인다(§1.5j).
    console.error('[llm] 생성 요청이 계약을 벗어났습니다. (내용은 남기지 않습니다)');
    return null;
  }
  const request = validated.data;

  return runChain(
    bundleFor(request),
    (raw) => parseResponse(raw, request.length),
    onPartial ? { timeoutMs: TIMEOUT_MS, onPartial } : { timeoutMs: TIMEOUT_MS },
  );
}
