/**
 * 멘트 생성 프로바이더 어댑터 — **서버 전용**.
 *
 * 하는 일은 하나다: `GenerateRequest` 를 받아 3톤 멘트를 만들어 오거나, 못 만들면
 * `null` 을 돌려준다. `null` 은 "템플릿 폴백으로 가라" 는 신호이고, 호출부(actions.ts)는
 * 이 값 하나만 보면 된다.
 *
 * 설계 판단
 *  - **키가 없으면 아무 일도 하지 않는다.** 개발자가 키를 안 넣어도 서비스는 그대로
 *    돌아가야 한다(멘트는 준비된 예문으로 나간다). 그래서 기본값이 `null` 이다.
 *  - **키가 여럿이면 체인으로 넘긴다.** 한 곳이 쿼터를 다 써도(429) 다음 곳이 받는다.
 *    순서는 gemini → claude → clova → nvidia 이고, 있는 것만 줄을 선다.
 *  - **SDK 를 새로 설치하지 않는다.** 네 프로바이더 모두 REST 한 번이면 끝나고,
 *    의존성이 늘면 서버 번들과 감사 범위만 커진다. `fetch` 는 호출 시점에 꺼내 쓴다
 *    (테스트가 전역 fetch 를 갈아끼울 수 있게).
 *  - **10초 예산은 호출 전체의 것이다.** 재시도와 폴백까지 합쳐 10초를 넘기지 않는다.
 *    사용자는 결과 화면을 기다리는 중이고, 늦은 멘트보다 준비된 예문이 낫다.
 *  - **원문은 로그에 남기지 않는다.** §1.5j 의 금지선이다. 실패는 짧은 사유 코드로만
 *    찍고, 응답 본문·요청 본문·예외 객체를 그대로 console 에 넘기지 않는다.
 *    (오류 메시지에 우리가 보낸 프롬프트가 되돌아오는 API 가 흔하다.)
 */

import { generateResponseSchema } from './contracts';
import type { GenerateRequest, GenerateResponse } from './contracts';
import { buildGeminiSchema, buildJsonSchema, buildSystemPrompt, buildUserPrompt } from './prompt';

/** 호출 전체(재시도 + 폴백)에 주는 시간. */
const TIMEOUT_MS = 10_000;

/** zod 파싱까지 실패했을 때 같은 프로바이더로 한 번 더 부른다. 그 다음은 다음 프로바이더다. */
const MAX_ATTEMPTS = 2;

/**
 * 자동 추적 별칭을 쓴다. 고정 버전명(`gemini-2.0-flash`)을 박아 두었더니 그 모델이
 * 서비스 종료되면서 404 만 돌아왔고, 실패가 조용히 템플릿 폴백으로 흡수돼 한동안
 * "LLM 이 도는 줄 알았던" 사고가 있었다. 별칭은 구글이 현행 모델로 옮겨 준다.
 *
 * 큰 flash(`gemini-flash-latest`)를 쓰지 않는 이유는 thinking 이 기본으로 켜져 있어
 * 10초 예산을 넘기기 때문이다. lite 계열은 애초에 `thinkingConfig` 를 주면 400 으로
 * 거부하므로 — 그리고 줄 필요도 없으므로 — 생성 설정에 thinking 항목을 넣지 않는다.
 */
const GEMINI_DEFAULT_MODEL = 'gemini-flash-lite-latest';
const CLAUDE_DEFAULT_MODEL = 'claude-opus-5';

/**
 * NVIDIA NIM 기본 모델 — 실키 실측으로 고른 값이다(2026-08-15).
 *
 *  - `openai/gpt-oss-20b`: `reasoning_effort: 'low'` 와 함께 **2초**에 3톤 JSON 통과.
 *  - `meta/llama-3.3-70b-instruct`(이전 기본값): 40초 무응답(서버리스 콜드스타트로
 *    추정)이라 10초 예산에서는 사실상 사용 불가 — 폐기.
 *
 * IfSave 가 같은 계정으로 `google/gemma-4-31b-it` 를 쓰고 있어, 레이트리밋을 나눠 쓰지
 * 않도록 다른 모델을 유지한다. 바꾸려면 `NVIDIA_MODEL` 환경변수로 덮어써라.
 */
const NVIDIA_DEFAULT_MODEL = 'openai/gpt-oss-20b';

/**
 * CLOVA Studio(HyperCLOVA X) 기본 모델 — 실키 실측으로 고른 값이다(2026-08-15).
 *
 *  - `HCX-DASH-002`: 3톤 JSON 을 **4.0초**에 통과. 경량이라 크레딧도 덜 쓴다.
 *  - `HCX-005`(플래그십): 5.7초. 품질을 더 원하면 `CLOVA_MODEL` 로 갈아끼울 수 있지만
 *    크레딧 소모가 크다.
 *  - `HCX-003`·`HCX-006`·`HCX-007`·`HCX-008` 은 400 이다(이 계정에서 열려 있지 않다).
 */
const CLOVA_DEFAULT_MODEL = 'HCX-DASH-002';

/**
 * CLOVA Studio 앱 스코프. 지금 쓰는 키는 **테스트 앱** 스코프라 `/testapp/` 로만 붙는다
 * (`/serviceapp/` 는 400). 서비스 앱으로 전환하면 여기를 `serviceapp` 으로 수정해라.
 */
const CLOVA_APP_SCOPE = 'testapp';

/** 3톤 × 200자 + 부연이면 넉넉하다. */
const MAX_OUTPUT_TOKENS = 2048;

type ProviderName = 'gemini' | 'claude' | 'clova' | 'nvidia';

interface ResolvedProvider {
  name: ProviderName;
  apiKey: string;
  model: string;
}

/**
 * 호출 한 번의 결과. HTTP 오류와 "200 인데 본문이 비었다" 를 구분해야
 * 재시도 여부가 갈린다(429 에 재시도하는 것은 시간 낭비다).
 */
type CallOutcome =
  | { kind: 'text'; text: string }
  | { kind: 'retry' } // 같은 프로바이더로 한 번 더 해 볼 만하다
  | { kind: 'skip' }; // 다시 불러도 같다 — 다음 프로바이더로

/**
 * 환경변수로 프로바이더 체인을 만든다. 키가 있는 것만, 이 순서대로 줄을 선다.
 *
 *  1. gemini — 무료 티어가 있어 "키 하나 꽂고 확인" 이 제일 쉽다.
 *  2. claude — 품질 기준선.
 *  3. clova — 한국어 특화(HyperCLOVA X). 무료 티어가 있어 유료 둘 다음에 세운다.
 *  4. nvidia — 무료 크레딧. 앞의 셋이 전부 마른 날의 비상용이다.
 *
 * `LLM_MODEL` 은 gemini·claude 의 모델명만 덮는다. CLOVA(`HCX-…`)와 NVIDIA(`벤더/모델`)는
 * 모델 이름 규칙이 아예 달라서 같은 값을 나눠 쓸 수 없고, 각각 `CLOVA_MODEL`·`NVIDIA_MODEL`
 * 만 본다.
 */
function resolveProviders(): ResolvedProvider[] {
  const override = process.env.LLM_MODEL?.trim();
  const providers: ResolvedProvider[] = [];

  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (gemini) {
    providers.push({ name: 'gemini', apiKey: gemini, model: override || GEMINI_DEFAULT_MODEL });
  }

  const anthropic = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropic) {
    providers.push({ name: 'claude', apiKey: anthropic, model: override || CLAUDE_DEFAULT_MODEL });
  }

  const clova = process.env.CLOVA_API_KEY?.trim();
  if (clova) {
    const model = process.env.CLOVA_MODEL?.trim();
    providers.push({ name: 'clova', apiKey: clova, model: model || CLOVA_DEFAULT_MODEL });
  }

  const nvidia = process.env.NVIDIA_API_KEY?.trim();
  if (nvidia) {
    const model = process.env.NVIDIA_MODEL?.trim();
    providers.push({ name: 'nvidia', apiKey: nvidia, model: model || NVIDIA_DEFAULT_MODEL });
  }

  return providers;
}

/** 모델이 ```json 펜스로 감싸 보내는 일이 있어 벗겨 준다. */
function stripCodeFence(raw: string): string {
  const text = raw.trim();
  if (!text.startsWith('```')) return text;
  const withoutOpen = text.replace(/^```[a-zA-Z]*\s*/, '');
  const close = withoutOpen.lastIndexOf('```');
  return (close === -1 ? withoutOpen : withoutOpen.slice(0, close)).trim();
}

/** 텍스트 → JSON → zod. 어디서 깨지든 `null` 이다(무엇이 왔는지는 찍지 않는다). */
function parseResponse(raw: string | null): GenerateResponse | null {
  if (raw === null || raw.trim() === '') return null;

  let json: unknown;
  try {
    json = JSON.parse(stripCodeFence(raw));
  } catch {
    return null;
  }

  const parsed = generateResponseSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

/** 본문 텍스트를 결과로 감싼다. 빈 문자열은 "한 번 더" 로 친다. */
function textOutcome(text: string): CallOutcome {
  return text === '' ? { kind: 'retry' } : { kind: 'text', text };
}

/* ------------------------------------------------------------------ *
 * 프로바이더별 호출 — 각자 "본문 텍스트 한 덩이" 까지만 책임진다
 * ------------------------------------------------------------------ */

async function callGemini(
  provider: ResolvedProvider,
  req: GenerateRequest,
  signal: AbortSignal,
): Promise<CallOutcome> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(provider.model)}:generateContent`;

  const response = await globalThis.fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': provider.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
      contents: [{ role: 'user', parts: [{ text: buildUserPrompt(req) }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: buildGeminiSchema(req),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        // thinkingConfig 는 넣지 않는다 — lite 계열은 이 항목 자체를 400 으로 거부한다.
      },
    }),
    signal,
  });

  if (!response.ok) {
    // 본문은 읽지 않는다 — 오류 응답에 우리가 보낸 프롬프트가 되돌아올 수 있다.
    console.error(`[llm] gemini 응답이 ${response.status} 입니다. (내용은 남기지 않습니다)`);
    return { kind: 'skip' };
  }

  const body = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const parts = body.candidates?.[0]?.content?.parts ?? [];
  return textOutcome(parts.map((part) => part.text ?? '').join(''));
}

async function callClaude(
  provider: ResolvedProvider,
  req: GenerateRequest,
  signal: AbortSignal,
): Promise<CallOutcome> {
  const response = await globalThis.fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: buildSystemPrompt(),
      messages: [{ role: 'user', content: buildUserPrompt(req) }],
      // 멘트 세 줄에 사고 예산을 쓸 일이 아니다 — 10초 예산 안에 들어와야 한다.
      thinking: { type: 'disabled' },
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: buildJsonSchema(req) },
      },
    }),
    signal,
  });

  if (!response.ok) {
    console.error(`[llm] claude 응답이 ${response.status} 입니다. (내용은 남기지 않습니다)`);
    return { kind: 'skip' };
  }

  const body = (await response.json()) as {
    stop_reason?: string;
    content?: Array<{ type?: string; text?: string }>;
  };

  // 안전 분류기가 거절하면 content 가 비거나 잘려 있다 — 같은 요청을 다시 보내도 같다.
  if (body.stop_reason === 'refusal') {
    console.error('[llm] claude 가 요청을 거절했습니다. (내용은 남기지 않습니다)');
    return { kind: 'skip' };
  }

  const text = (body.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('');
  return textOutcome(text);
}

/**
 * 스키마를 프롬프트 끝에 붙인 user 본문.
 *
 * 구조화 출력 필드(`response_format` 등)를 쓰지 않는 프로바이더용이다. 그 필드는 뒤에
 * 붙는 모델마다 지원 여부가 갈려서, 지원하지 않는 모델에 주면 400 으로 통째로 실패한다.
 * 대신 스키마를 그대로 붙여 보여 주고, 펜스나 잡음은 `stripCodeFence` + zod 가 걸러 낸다.
 */
function buildSchemaPinnedPrompt(req: GenerateRequest): string {
  return [
    buildUserPrompt(req),
    '',
    '아래 JSON 스키마에 맞는 JSON 만 출력한다. 설명·코드펜스를 붙이지 않는다.',
    JSON.stringify(buildJsonSchema(req)),
  ].join('\n');
}

/**
 * CLOVA Studio(HyperCLOVA X) — 네이버 클라우드의 한국어 특화 모델이다.
 *
 * 두 가지가 다른 프로바이더와 다르다.
 *  - 토큰 상한이 **camelCase `maxTokens`** 다(`max_tokens` 는 무시된다).
 *  - HTTP 200 이어도 성공이 아니다. 본문의 `status.code` 가 `'20000'` 이어야 한다.
 *    다른 코드는 같은 요청을 다시 보내도 같은 값이 오므로 바로 다음 프로바이더로 넘긴다.
 *
 * JSON 강제는 NVIDIA 와 같은 방식(프롬프트에 스키마 첨부)이다 — 실측에서 두 모델 다
 * 펜스 없는 순수 JSON 을 냈다.
 */
async function callClova(
  provider: ResolvedProvider,
  req: GenerateRequest,
  signal: AbortSignal,
): Promise<CallOutcome> {
  const url =
    `https://clovastudio.stream.ntruss.com/${CLOVA_APP_SCOPE}/v3/chat-completions/` +
    `${encodeURIComponent(provider.model)}`;

  const response = await globalThis.fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildSchemaPinnedPrompt(req) },
      ],
      // camelCase 다. snake_case 로 보내면 조용히 무시된다.
      maxTokens: MAX_OUTPUT_TOKENS,
    }),
    signal,
  });

  if (!response.ok) {
    console.error(`[llm] clova 응답이 ${response.status} 입니다. (내용은 남기지 않습니다)`);
    return { kind: 'skip' };
  }

  const body = (await response.json()) as {
    status?: { code?: string };
    result?: { message?: { content?: unknown } };
  };

  // 200 + 비정상 코드. 응답 본문의 메시지는 찍지 않는다(우리가 보낸 내용이 되돌아올 수 있다).
  if (body.status?.code !== '20000') {
    console.error('[llm] clova 가 정상 코드로 응답하지 않았습니다. (내용은 남기지 않습니다)');
    return { kind: 'skip' };
  }

  const content = body.result?.message?.content;
  return textOutcome(typeof content === 'string' ? content : '');
}

/**
 * NVIDIA NIM — OpenAI 호환 엔드포인트다.
 *
 * JSON 강제는 `response_format` 이 아니라 프롬프트로 한다(`buildSchemaPinnedPrompt` 참고).
 */
async function callNvidia(
  provider: ResolvedProvider,
  req: GenerateRequest,
  signal: AbortSignal,
): Promise<CallOutcome> {
  const userContent = buildSchemaPinnedPrompt(req);

  const response = await globalThis.fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: userContent },
      ],
      max_tokens: MAX_OUTPUT_TOKENS,
      // 추론 모델(gpt-oss 등)은 기본 effort 로 사고 과정을 수천 자 생성해 20초를 넘긴다
      // (실측: 기본 22초 → low 2초). 비추론 모델(gemma 실측 200)도 이 필드를 무시할 뿐
      // 거부하지 않으므로 조건 없이 보낸다.
      reasoning_effort: 'low',
    }),
    signal,
  });

  if (!response.ok) {
    console.error(`[llm] nvidia 응답이 ${response.status} 입니다. (내용은 남기지 않습니다)`);
    return { kind: 'skip' };
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return textOutcome(body.choices?.[0]?.message?.content ?? '');
}

function callProvider(
  provider: ResolvedProvider,
  req: GenerateRequest,
  signal: AbortSignal,
): Promise<CallOutcome> {
  switch (provider.name) {
    case 'gemini':
      return callGemini(provider, req, signal);
    case 'claude':
      return callClaude(provider, req, signal);
    case 'clova':
      return callClova(provider, req, signal);
    case 'nvidia':
      return callNvidia(provider, req, signal);
  }
}

/**
 * 프로바이더 하나에 걸어 보는 데까지 걸어 본다.
 *
 * 성공하면 파싱된 결과, 아니면 `null`(= 다음 프로바이더로). 재시도는 "말은 통했는데
 * 내용이 계약과 달랐을 때" 만 한다. HTTP 오류·거절은 같은 요청을 한 번 더 보낸다고
 * 달라지지 않으므로 바로 넘긴다.
 */
async function runProvider(
  provider: ResolvedProvider,
  req: GenerateRequest,
  signal: AbortSignal,
): Promise<GenerateResponse | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    // 예산이 이미 끝났으면 다시 부르지 않는다(두 번째 호출도 곧바로 abort 될 뿐이다).
    if (signal.aborted) return null;

    let outcome: CallOutcome;
    try {
      outcome = await callProvider(provider, req, signal);
    } catch {
      // 타임아웃(abort)·네트워크 오류. 예외 객체에는 요청 본문이 붙어 있을 수 있어 찍지 않는다.
      if (signal.aborted) {
        console.error('[llm] 생성이 제한 시간을 넘겼습니다.');
        return null;
      }
      console.error(`[llm] ${provider.name} 생성 호출이 실패했습니다. (시도 ${attempt})`);
      continue;
    }

    if (outcome.kind === 'skip') return null;

    if (outcome.kind === 'text') {
      const parsed = parseResponse(outcome.text);
      if (parsed) return parsed;
    }

    console.error(`[llm] ${provider.name} 응답을 계약대로 읽지 못했습니다. (시도 ${attempt})`);
  }

  return null;
}

/* ------------------------------------------------------------------ *
 * 공개 함수
 * ------------------------------------------------------------------ */

/**
 * 3톤 멘트를 한 번에 만들어 온다.
 *
 * `null` 이 돌아오는 경우는 전부 "템플릿 폴백" 이다:
 *   키가 없음 / 타임아웃 / 체인의 모든 프로바이더가 실패(HTTP 오류·네트워크·파싱)
 */
export async function generateMessages(req: GenerateRequest): Promise<GenerateResponse | null> {
  const providers = resolveProviders();
  if (providers.length === 0) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    for (let index = 0; index < providers.length; index += 1) {
      const provider = providers[index];
      if (controller.signal.aborted) break;

      const parsed = await runProvider(provider, req, controller.signal);
      if (parsed) return parsed;

      // 예산이 끝났으면 다음 프로바이더도 부를 시간이 없다.
      if (controller.signal.aborted) break;

      const next = providers[index + 1];
      if (next) console.error(`[llm] ${provider.name}에서 ${next.name}(으)로 폴백합니다.`);
    }

    return null;
  } finally {
    clearTimeout(timer);
  }
}
