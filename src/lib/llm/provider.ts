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
 *  - **SDK 를 새로 설치하지 않는다.** 두 프로바이더 모두 REST 한 번이면 끝나고,
 *    의존성이 늘면 서버 번들과 감사 범위만 커진다. `fetch` 는 호출 시점에 꺼내 쓴다
 *    (테스트가 전역 fetch 를 갈아끼울 수 있게).
 *  - **10초 예산은 호출 전체의 것이다.** 재시도까지 합쳐 10초를 넘기지 않는다.
 *    사용자는 결과 화면을 기다리는 중이고, 늦은 멘트보다 준비된 예문이 낫다.
 *  - **원문은 로그에 남기지 않는다.** §1.5j 의 금지선이다. 실패는 짧은 사유 코드로만
 *    찍고, 응답 본문·요청 본문·예외 객체를 그대로 console 에 넘기지 않는다.
 *    (오류 메시지에 우리가 보낸 프롬프트가 되돌아오는 API 가 흔하다.)
 */

import { generateResponseSchema } from './contracts';
import type { GenerateRequest, GenerateResponse } from './contracts';
import { buildGeminiSchema, buildJsonSchema, buildSystemPrompt, buildUserPrompt } from './prompt';

/** 호출 전체(재시도 포함)에 주는 시간. */
const TIMEOUT_MS = 10_000;

/** zod 파싱까지 실패했을 때 한 번 더 부른다. 그 다음은 폴백이다. */
const MAX_ATTEMPTS = 2;

const GEMINI_DEFAULT_MODEL = 'gemini-2.0-flash';
const CLAUDE_DEFAULT_MODEL = 'claude-opus-5';

/** 3톤 × 200자 + 부연이면 넉넉하다. */
const MAX_OUTPUT_TOKENS = 2048;

type ProviderName = 'gemini' | 'claude';

interface ResolvedProvider {
  name: ProviderName;
  apiKey: string;
  model: string;
}

/**
 * 환경변수로 프로바이더를 고른다. 둘 다 있으면 Gemini 가 먼저다
 * (무료 티어가 있어 "키 하나 꽂고 확인" 이 쉬운 쪽).
 */
function resolveProvider(): ResolvedProvider | null {
  const override = process.env.LLM_MODEL?.trim();

  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (gemini) {
    return { name: 'gemini', apiKey: gemini, model: override || GEMINI_DEFAULT_MODEL };
  }

  const anthropic = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropic) {
    return { name: 'claude', apiKey: anthropic, model: override || CLAUDE_DEFAULT_MODEL };
  }

  return null;
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

/* ------------------------------------------------------------------ *
 * 프로바이더별 호출 — 각자 "본문 텍스트 한 덩이" 까지만 책임진다
 * ------------------------------------------------------------------ */

async function callGemini(
  provider: ResolvedProvider,
  req: GenerateRequest,
  signal: AbortSignal,
): Promise<string | null> {
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
      },
    }),
    signal,
  });

  if (!response.ok) {
    // 본문은 읽지 않는다 — 오류 응답에 우리가 보낸 프롬프트가 되돌아올 수 있다.
    console.error(`[llm] gemini 응답이 ${response.status} 입니다. (내용은 남기지 않습니다)`);
    return null;
  }

  const body = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const parts = body.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((part) => part.text ?? '').join('');
  return text === '' ? null : text;
}

async function callClaude(
  provider: ResolvedProvider,
  req: GenerateRequest,
  signal: AbortSignal,
): Promise<string | null> {
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
    return null;
  }

  const body = (await response.json()) as {
    stop_reason?: string;
    content?: Array<{ type?: string; text?: string }>;
  };

  // 안전 분류기가 거절하면 content 가 비거나 잘려 있다 — 폴백으로 보낸다.
  if (body.stop_reason === 'refusal') {
    console.error('[llm] claude 가 요청을 거절했습니다. (내용은 남기지 않습니다)');
    return null;
  }

  const text = (body.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('');
  return text === '' ? null : text;
}

/* ------------------------------------------------------------------ *
 * 공개 함수
 * ------------------------------------------------------------------ */

/**
 * 3톤 멘트를 한 번에 만들어 온다.
 *
 * `null` 이 돌아오는 경우는 전부 "템플릿 폴백" 이다:
 *   키가 없음 / 타임아웃 / 네트워크·HTTP 오류 / JSON·zod 파싱 실패(재시도 후에도)
 */
export async function generateMessages(req: GenerateRequest): Promise<GenerateResponse | null> {
  const provider = resolveProvider();
  if (!provider) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      // 예산이 이미 끝났으면 다시 부르지 않는다(두 번째 호출도 곧바로 abort 될 뿐이다).
      if (controller.signal.aborted) break;

      let raw: string | null = null;
      try {
        raw =
          provider.name === 'gemini'
            ? await callGemini(provider, req, controller.signal)
            : await callClaude(provider, req, controller.signal);
      } catch {
        // 타임아웃(abort)·네트워크 오류. 예외 객체에는 요청 본문이 붙어 있을 수 있어 찍지 않는다.
        if (controller.signal.aborted) {
          console.error('[llm] 생성이 제한 시간을 넘겼습니다.');
          break;
        }
        console.error(`[llm] 생성 호출이 실패했습니다. (시도 ${attempt})`);
        continue;
      }

      const parsed = parseResponse(raw);
      if (parsed) return parsed;

      console.error(`[llm] 응답을 계약대로 읽지 못했습니다. (시도 ${attempt})`);
    }

    return null;
  } finally {
    clearTimeout(timer);
  }
}
