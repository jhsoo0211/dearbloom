/**
 * 프로바이더 체인 — **서버 전용**. LLM 을 부르는 모든 길이 지나는 공통 배관이다.
 *
 * ── 왜 `provider.ts` 에서 갈라 나왔나 (2026-08-18) ────────────────────
 * 2026-08-18 에 두 번째 용도가 생겼다: 멘트 생성(`provider.ts`)에 더해 **자유 서술 해석**
 * (`extract.ts`)이 같은 4단 체인을 타야 한다. 체인을 한 벌 더 적으면 그 순간 두 벌이
 * 서로 다르게 늙는다 — 한쪽만 프로바이더가 늘고, 한쪽만 오류 로그 규율이 느슨해진다.
 * 그래서 **"무엇을 물어보는가"(프롬프트·계약)와 "어떻게 부르는가"(HTTP·폴백)를 갈랐다.**
 * 이 파일은 뒤엣것만 안다 — 멘트도 추출도 모른다.
 *
 * 설계 판단(원본 `provider.ts` 머리말에서 그대로 옮겨 온 것들)
 *  - **키가 없으면 아무 일도 하지 않는다.** 개발자가 키를 안 넣어도 서비스는 그대로
 *    돌아가야 한다. 그래서 `resolveProviders()` 가 빈 배열이면 곧바로 `null` 이다.
 *  - **키가 여럿이면 체인으로 넘긴다.** 한 곳이 쿼터를 다 써도(429) 다음 곳이 받는다.
 *    순서는 gemini → claude → clova → nvidia 이고, 있는 것만 줄을 선다.
 *  - **SDK 를 새로 설치하지 않는다.** 네 프로바이더 모두 REST 한 번이면 끝나고,
 *    의존성이 늘면 서버 번들과 감사 범위만 커진다. `fetch` 는 호출 시점에 꺼내 쓴다
 *    (테스트가 전역 fetch 를 갈아끼울 수 있게).
 *  - **시간 예산은 호출 전체의 것이다.** 재시도와 폴백까지 합쳐 예산을 넘기지 않는다.
 *    예산의 크기는 부르는 쪽이 정한다 — 멘트는 10초, 추출은 4초다(결과 화면 앞에 서므로).
 *  - **원문은 로그에 남기지 않는다.** §1.5j 의 금지선이다. 실패는 짧은 사유 코드로만
 *    찍고, 응답 본문·요청 본문·예외 객체를 그대로 console 에 넘기지 않는다.
 *    (오류 메시지에 우리가 보낸 프롬프트가 되돌아오는 API 가 흔하다.)
 */

/** zod 파싱까지 실패했을 때 같은 프로바이더로 한 번 더 부른다. 그 다음은 다음 프로바이더다. */
const MAX_ATTEMPTS = 2;

/**
 * 자동 추적 별칭을 쓴다. 고정 버전명(`gemini-2.0-flash`)을 박아 두었더니 그 모델이
 * 서비스 종료되면서 404 만 돌아왔고, 실패가 조용히 템플릿 폴백으로 흡수돼 한동안
 * "LLM 이 도는 줄 알았던" 사고가 있었다. 별칭은 구글이 현행 모델로 옮겨 준다.
 *
 * 큰 flash(`gemini-flash-latest`)를 쓰지 않는 이유는 thinking 이 기본으로 켜져 있어
 * 시간 예산을 넘기기 때문이다. lite 계열은 애초에 `thinkingConfig` 를 주면 400 으로
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

type ProviderName = 'gemini' | 'claude' | 'clova' | 'nvidia';

interface ResolvedProvider {
  name: ProviderName;
  apiKey: string;
  model: string;
}

/**
 * 한 번의 호출에 실어 보낼 것 전부.
 *
 * 프로바이더마다 구조화 출력을 요구하는 방법이 달라서 스키마가 두 벌이다 —
 * Claude 는 표준 JSON Schema(`jsonSchema`), Gemini 는 OpenAPI 부분집합(`geminiSchema`),
 * CLOVA·NVIDIA 는 둘 다 못 받아 **프롬프트 끝에 스키마를 붙여** 부탁한다
 * (`buildSchemaPinnedPrompt` — 지원하지 않는 모델에 구조화 출력 필드를 주면 400 으로
 * 통째로 실패하기 때문이다).
 */
export interface PromptBundle {
  system: string;
  user: string;
  jsonSchema: Record<string, unknown>;
  geminiSchema: Record<string, unknown>;
  maxOutputTokens: number;
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
 * 흘러들어오는 본문을 **지금까지 받은 전부**로 알려 주는 콜백 (2026-08-18).
 *
 * 넘기는 값이 조각(delta)이 아니라 누적 텍스트인 것이 요점이다 — 받는 쪽
 * (`readPartialTones`)은 매번 처음부터 다시 읽고, 그래야 재시도로 새 답이 시작돼도
 * 화면이 옛 조각과 새 조각을 이어 붙이지 않는다.
 *
 * ⚠ 이 값은 **표시용**이다. 계약 판정은 스트림이 끝난 뒤 `parse` 가 한 번만 한다.
 * ⚠ 이 콜백을 주지 않으면 어느 프로바이더도 스트리밍으로 붙지 않는다.
 */
export type PartialSink = (rawSoFar: string) => void;

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
export function resolveProviders(): ResolvedProvider[] {
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
export function stripCodeFence(raw: string): string {
  const text = raw.trim();
  if (!text.startsWith('```')) return text;
  const withoutOpen = text.replace(/^```[a-zA-Z]*\s*/, '');
  const close = withoutOpen.lastIndexOf('```');
  return (close === -1 ? withoutOpen : withoutOpen.slice(0, close)).trim();
}

/** 본문 텍스트를 결과로 감싼다. 빈 문자열은 "한 번 더" 로 친다. */
function textOutcome(text: string): CallOutcome {
  return text === '' ? { kind: 'retry' } : { kind: 'text', text };
}

/* ------------------------------------------------------------------ *
 * SSE 읽기 — 스트리밍을 지원하는 프로바이더의 공통 배관
 * ------------------------------------------------------------------ */

/**
 * `text/event-stream` 응답에서 `data:` 줄의 본문만 차례로 흘려보낸다.
 *
 * 프레이밍은 프로바이더마다 같고(줄 단위 `data:`) **알맹이의 모양만 다르다.**
 * 그래서 여기는 프레이밍까지, 해석은 부르는 쪽이 맡는다.
 */
async function* sseData(response: Response): AsyncGenerator<string> {
  const body = response.body;
  if (!body) return;

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    for (let nl = buffer.indexOf('\n'); nl !== -1; nl = buffer.indexOf('\n')) {
      const line = buffer.slice(0, nl).replace(/\r$/, '');
      buffer = buffer.slice(nl + 1);
      if (line.startsWith('data:')) yield line.slice(5).trim();
    }
  }

  const tail = buffer.trim();
  if (tail.startsWith('data:')) yield tail.slice(5).trim();
}

/**
 * SSE 를 끝까지 읽어 본문 텍스트 한 덩이로 모은다.
 *
 * `extract` 가 알맹이 하나에서 이어 붙일 글자를 꺼낸다. `''` 를 돌려주면 그 알맹이는
 * 본문이 아니다(하트비트·사용량 통계 등) — 조용히 지나간다.
 * `stop` 이 참을 돌려주면 그 자리에서 **다시 불러도 같은 결과**라는 뜻이라 `skip` 이다
 * (Claude 의 거절 응답이 그 자리다).
 */
async function streamText(
  response: Response,
  extract: (payload: Record<string, unknown>) => string,
  onPartial: PartialSink | undefined,
  stop?: (payload: Record<string, unknown>) => boolean,
): Promise<CallOutcome> {
  let text = '';

  for await (const data of sseData(response)) {
    if (data === '' || data === '[DONE]') continue;

    let payload: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(data);
      if (typeof parsed !== 'object' || parsed === null) continue;
      payload = parsed as Record<string, unknown>;
    } catch {
      // 반쪽 줄은 다음 청크에서 이어지지 않는다(줄 단위로 잘라 왔다) — 버린다.
      continue;
    }

    if (stop?.(payload)) return { kind: 'skip' };

    const chunk = extract(payload);
    if (chunk === '') continue;
    text += chunk;
    onPartial?.(text);
  }

  return textOutcome(text);
}

/* ------------------------------------------------------------------ *
 * 프로바이더별 호출 — 각자 "본문 텍스트 한 덩이" 까지만 책임진다
 * ------------------------------------------------------------------ */

/**
 * Gemini.
 *
 * 스트리밍은 **엔드포인트만 다르다**(`:streamGenerateContent?alt=sse`) — 본문·스키마·
 * 생성 설정은 한 글자도 바뀌지 않는다. 알맹이도 비스트리밍과 같은 모양이라
 * (`candidates[0].content.parts[].text`) 이어 붙이기만 하면 된다.
 * `propertyOrdering` 이 톤을 맨 앞에 세워 두므로 부분 판독기가 톤부터 읽는다.
 */
async function callGemini(
  provider: ResolvedProvider,
  bundle: PromptBundle,
  signal: AbortSignal,
  onPartial?: PartialSink,
): Promise<CallOutcome> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(provider.model)}:` +
    (onPartial ? 'streamGenerateContent?alt=sse' : 'generateContent');

  const response = await globalThis.fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': provider.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: bundle.system }] },
      contents: [{ role: 'user', parts: [{ text: bundle.user }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: bundle.geminiSchema,
        maxOutputTokens: bundle.maxOutputTokens,
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

  const textOf = (payload: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  }) => (payload.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('');

  if (onPartial) return streamText(response, textOf, onPartial);

  const body = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return textOutcome(textOf(body));
}

/**
 * Claude.
 *
 * 스트리밍은 `stream: true` 한 줄이고, 알맹이는 `content_block_delta` 의 `delta.text` 다.
 * 구조화 출력(`output_config.format`)을 켜 두어도 본문은 여전히 text 블록으로 흐른다.
 * 거절(`stop_reason: 'refusal'`)은 비스트리밍과 같은 자리로 다룬다 — 스트림에서는
 * `message_delta` 가 그 사실을 실어 오므로 거기서 `skip` 으로 끊는다.
 */
async function callClaude(
  provider: ResolvedProvider,
  bundle: PromptBundle,
  signal: AbortSignal,
  onPartial?: PartialSink,
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
      max_tokens: bundle.maxOutputTokens,
      system: bundle.system,
      messages: [{ role: 'user', content: bundle.user }],
      // 짧은 답 한 벌에 사고 예산을 쓸 일이 아니다 — 시간 예산 안에 들어와야 한다.
      thinking: { type: 'disabled' },
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: bundle.jsonSchema },
      },
      ...(onPartial ? { stream: true } : {}),
    }),
    signal,
  });

  if (!response.ok) {
    console.error(`[llm] claude 응답이 ${response.status} 입니다. (내용은 남기지 않습니다)`);
    return { kind: 'skip' };
  }

  if (onPartial) {
    return streamText(
      response,
      (payload) => {
        if (payload.type !== 'content_block_delta') return '';
        const delta = payload.delta as { type?: string; text?: string } | undefined;
        return delta?.type === 'text_delta' ? (delta.text ?? '') : '';
      },
      onPartial,
      (payload) => {
        const delta = payload.delta as { stop_reason?: string } | undefined;
        if (delta?.stop_reason !== 'refusal') return false;
        console.error('[llm] claude 가 요청을 거절했습니다. (내용은 남기지 않습니다)');
        return true;
      },
    );
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
function buildSchemaPinnedPrompt(bundle: PromptBundle): string {
  return [
    bundle.user,
    '',
    '아래 JSON 스키마에 맞는 JSON 만 출력한다. 설명·코드펜스를 붙이지 않는다.',
    JSON.stringify(bundle.jsonSchema),
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
  bundle: PromptBundle,
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
        { role: 'system', content: bundle.system },
        { role: 'user', content: buildSchemaPinnedPrompt(bundle) },
      ],
      // camelCase 다. snake_case 로 보내면 조용히 무시된다.
      maxTokens: bundle.maxOutputTokens,
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
  bundle: PromptBundle,
  signal: AbortSignal,
  onPartial?: PartialSink,
): Promise<CallOutcome> {
  const response = await globalThis.fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [
        { role: 'system', content: bundle.system },
        { role: 'user', content: buildSchemaPinnedPrompt(bundle) },
      ],
      max_tokens: bundle.maxOutputTokens,
      // 추론 모델(gpt-oss 등)은 기본 effort 로 사고 과정을 수천 자 생성해 20초를 넘긴다
      // (실측: 기본 22초 → low 2초). 비추론 모델(gemma 실측 200)도 이 필드를 무시할 뿐
      // 거부하지 않으므로 조건 없이 보낸다.
      reasoning_effort: 'low',
      // OpenAI 호환이라 `stream: true` 한 줄이면 `choices[0].delta.content` 로 흐른다.
      ...(onPartial ? { stream: true } : {}),
    }),
    signal,
  });

  if (!response.ok) {
    console.error(`[llm] nvidia 응답이 ${response.status} 입니다. (내용은 남기지 않습니다)`);
    return { kind: 'skip' };
  }

  if (onPartial) {
    return streamText(
      response,
      (payload) => {
        const choices = payload.choices as
          | Array<{ delta?: { content?: string | null } }>
          | undefined;
        return choices?.[0]?.delta?.content ?? '';
      },
      onPartial,
    );
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return textOutcome(body.choices?.[0]?.message?.content ?? '');
}

/**
 * 프로바이더 하나를 부른다.
 *
 * ⚠ **CLOVA 에는 `onPartial` 을 넘기지 않는다.** 스트리밍 자체는 있지만 프레이밍이
 *   다르고(`event: token` + 별도 `Accept` 헤더) 실키로 확인하지 못했다. 확인하지 못한
 *   경로를 켜 두는 것보다 지금처럼 한 번에 받는 편이 낫다 — 그 경로는 이미 4초 안에
 *   끝나고, 화면은 스트리밍이 없으면 없는 대로 선다.
 */
function callProvider(
  provider: ResolvedProvider,
  bundle: PromptBundle,
  signal: AbortSignal,
  onPartial?: PartialSink,
): Promise<CallOutcome> {
  switch (provider.name) {
    case 'gemini':
      return callGemini(provider, bundle, signal, onPartial);
    case 'claude':
      return callClaude(provider, bundle, signal, onPartial);
    case 'clova':
      return callClova(provider, bundle, signal);
    case 'nvidia':
      return callNvidia(provider, bundle, signal, onPartial);
  }
}

/**
 * 프로바이더 하나에 걸어 보는 데까지 걸어 본다.
 *
 * 성공하면 파싱된 결과, 아니면 `null`(= 다음 프로바이더로). 재시도는 "말은 통했는데
 * 내용이 계약과 달랐을 때" 만 한다. HTTP 오류·거절은 같은 요청을 한 번 더 보낸다고
 * 달라지지 않으므로 바로 넘긴다.
 */
async function runProvider<T>(
  provider: ResolvedProvider,
  bundle: PromptBundle,
  parse: (raw: string) => T | null,
  signal: AbortSignal,
  onPartial?: PartialSink,
): Promise<T | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    // 예산이 이미 끝났으면 다시 부르지 않는다(두 번째 호출도 곧바로 abort 될 뿐이다).
    if (signal.aborted) return null;

    let outcome: CallOutcome;
    try {
      outcome = await callProvider(provider, bundle, signal, onPartial);
    } catch {
      // 타임아웃(abort)·네트워크 오류. 예외 객체에는 요청 본문이 붙어 있을 수 있어 찍지 않는다.
      if (signal.aborted) {
        console.error('[llm] 호출이 제한 시간을 넘겼습니다.');
        return null;
      }
      console.error(`[llm] ${provider.name} 호출이 실패했습니다. (시도 ${attempt})`);
      continue;
    }

    if (outcome.kind === 'skip') return null;

    if (outcome.kind === 'text') {
      const parsed = parse(outcome.text);
      if (parsed !== null) return parsed;
    }

    // 여기 오는 사유는 셋이다: JSON 이 아님 · 계약의 칸이 안 맞음 · 값이 상한을 넘김.
    // 셋 다 "같은 프로바이더에 한 번 더" 가 말이 되는 자리라 한 문장으로 다룬다.
    console.error(`[llm] ${provider.name} 응답을 계약대로 읽지 못했습니다. (시도 ${attempt})`);
  }

  return null;
}

/** 체인 한 번을 도는 데 필요한 것 중, 프롬프트 밖의 것들. */
export interface ChainOptions {
  /** 재시도·폴백까지 **전부 합친** 예산(ms). */
  timeoutMs: number;
  /** 주면 스트리밍이 가능한 프로바이더만 흘려보내며 부른다. */
  onPartial?: PartialSink;
}

/**
 * 4단 체인을 끝까지 돌려 첫 성공을 돌려준다. 하나도 성공하지 못하면 `null`.
 *
 * `null` 이 돌아오는 경우는 전부 "폴백으로 가라" 는 신호다:
 *   계약 위반 / 키가 없음 / 타임아웃 / 체인의 모든 프로바이더가 실패(HTTP 오류·네트워크·파싱)
 *
 * `parse` 가 계약의 최종 판정자다 — 이 파일은 무엇이 맞는 답인지 모르고, 알 필요도 없다.
 */
export async function runChain<T>(
  bundle: PromptBundle,
  parse: (raw: string) => T | null,
  options: ChainOptions,
): Promise<T | null> {
  const providers = resolveProviders();
  if (providers.length === 0) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    for (let index = 0; index < providers.length; index += 1) {
      const provider = providers[index];
      if (controller.signal.aborted) break;

      const parsed = await runProvider(
        provider,
        bundle,
        parse,
        controller.signal,
        options.onPartial,
      );
      if (parsed !== null) return parsed;

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
