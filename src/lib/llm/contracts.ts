import { z } from 'zod';
import { intentSchema, relationshipSchema, toneSchema } from '@/lib/engine/normalize';

/**
 * 메시지 생성 LLM 호출의 입출력 계약.
 * 여기에는 스키마만 둔다 — 프롬프트와 호출 구현은 별도 모듈에서 맡는다.
 */

/** 응답에서 요구하는 톤 개수(항상 3안). */
export const RESPONSE_TONE_COUNT = 3;

/**
 * 멘트 길이 축 (2026-08-18) — 결과 화면의 `짧게 / 보통` 토글이 넘기는 값.
 *
 * 어휘는 `content/templates.csv` 의 `length` 컬럼(`short|medium`)과 같은 낱말을 쓴다.
 * 다만 **지금 이 축을 실제로 가르는 것은 생성 경로뿐**이다 — 예문 표에는 (intent × tone)
 * 조합마다 행이 하나씩만 있어서(2026-08-18 실측: 31행 중 short 는 1행) 고를 것이 없다.
 * 예문 표가 짧은 벌을 갖추는 날 `buildTones` 가 이 값을 함께 보면 된다.
 */
export const MESSAGE_LENGTHS = ['short', 'medium'] as const;
export type MessageLength = (typeof MESSAGE_LENGTHS)[number];
export const messageLengthSchema = z.enum(MESSAGE_LENGTHS);

/**
 * 멘트 한 편의 **글자 수 상한**(공백 포함) — 2026-08-18 사용자 요구 "너무 길지 않게".
 *
 * ── 이 상수가 계약 쪽에 사는 이유 ────────────────────────────────────
 * 상한은 세 곳이 함께 지켜야 한 번이라도 지켜진다: 프롬프트가 요구하고(`prompt.ts`),
 * 응답 검증이 막고(`generateResponseSchemaFor`), 화면이 사용자에게 같은 수를 말한다
 * (`ResultView` 의 길이 칸). 셋이 각자 숫자를 들고 있으면 어느 한 곳만 늘어난 채 남는다 —
 * 여기 한 벌만 두고 나머지가 읽어 간다.
 *
 * 수치는 **관측을 굳힌 값**이지 새로 조인 값이 아니다(2026-08-18 실측: 짧게 54~61자,
 * 보통 91~110자). 즉 지금 모델들이 이미 내고 있는 분량이고, 상한은 그 위로 새는 편만 막는다.
 *
 * ⚠ **넘긴 멘트는 잘라 쓰지 않는다.** 중간에서 끊긴 문장은 긴 문장보다 나쁘다 —
 *   계약 위반으로 다루어 한 번 더 부탁하고(같은 프로바이더), 그래도 넘치면 다음
 *   프로바이더로 넘긴다(`provider.ts` 의 `runProvider`). 잘라 붙이는 코드는 없다.
 * ⚠ 결과 화면 **고쳐 쓰기**의 200자는 이 값과 별개다(`prompt.ts` 의 `MESSAGE_MAX_CHARS`).
 *   우리가 쓰는 분량과 사용자가 고쳐 쓸 수 있는 분량은 다른 약속이다.
 */
export const MESSAGE_LENGTH_MAX_CHARS: Record<MessageLength, number> = {
  short: 60,
  medium: 120,
};

const flowerBriefSchema = z.object({
  id: z.string().min(1),
  name_ko: z.string().min(1),
  meaning_ko: z.string().min(1),
  /** 꽃말 출처 id. 출처 없는 꽃말은 생성에 쓰지 않는다. */
  meaning_source_id: z.string().min(1),
});

/** §1.5l `직접 쓸게요`(마음) 한 줄의 길이 상한. 화면·서버·계약이 같은 값을 쓴다. */
export const INTENT_DETAIL_MAX_CHARS = 80;

/** §1.5l `직접 쓸게요`(관계) 한 줄의 길이 상한. 마음 쪽과 같은 값이되 문이 다르므로 따로 둔다. */
export const RELATIONSHIP_DETAIL_MAX_CHARS = 80;

/**
 * §1.5j 자유 서술 두 필드를 이어 붙인 `memory_context` 의 상한.
 *
 * 상한이 필요한 이유는 두 가지다. ① 이 값은 **사용자가 쓴 글**이라 화면이 막아 준 길이를
 * 서버가 다시 믿을 수 없다(서버 액션은 공개 HTTP 엔드포인트다). ② 프롬프트에 그대로 실려
 * 나가므로, 길이를 열어 두면 토큰 예산과 10초 응답 예산이 함께 무너진다.
 *
 * ⚠ 화면 상한(200 + 400)과 줄바꿈 한 칸을 더하면 601 이다. 그래서 호출부는 이어 붙인 뒤
 *   이 값으로 한 번 더 자른다(`src/app/recommend/actions.ts`).
 */
export const MEMORY_CONTEXT_MAX_CHARS = 600;

export const generateRequestSchema = z.object({
  relationship: relationshipSchema,
  /**
   * §1.5l — relationship 이 'other' 일 때 사용자가 직접 적은 사이 한 줄.
   * 여섯 갈래에 없는 사이라 이 값이 곧 관계 설명이다(프롬프트가 말투를 여기에 맞춘다).
   */
  relationship_detail: z.string().max(RELATIONSHIP_DETAIL_MAX_CHARS).optional(),
  intent: intentSchema,
  /**
   * §1.5l — intent 가 'other' 일 때 사용자가 직접 적은 상황 한 줄.
   * 일곱 갈래에 없는 마음이라 이 값이 곧 상황 설명이다(프롬프트가 그대로 다룬다).
   */
  intent_detail: z.string().max(INTENT_DETAIL_MAX_CHARS).optional(),
  flower: flowerBriefSchema,
  /** 자유 서술 원문. 길이는 계약이 막는다 — 원문을 다루는 유일한 필드라 여기가 마지막 문이다. */
  memory_context: z.string().max(MEMORY_CONTEXT_MAX_CHARS).optional(),
  /**
   * §1.5l 받는 분 특징 칩의 라벨(멘트 재료).
   * 반려동물·향 민감 칩은 여기 담지 않는다 — 절대 규칙 3 이 금지한 자리다.
   */
  recipient_traits: z.array(z.string()).max(12).optional(),
  /** §1.5l 상황 칩의 라벨. 자유 서술과 달리 서비스 어휘라 그대로 실어도 안전하다. */
  episode_hints: z.array(z.string()).max(6).optional(),
  tones: z.array(toneSchema).min(1).max(3),
  /**
   * 멘트 한 편의 길이. 생략하면 `medium`(지금까지의 유일한 길이)이라 기존 호출부는
   * 한 글자도 바뀌지 않는다 — 프롬프트가 이 값으로 글자 수 범위를 갈아 끼운다.
   */
  length: messageLengthSchema.default('medium'),
  rules: z.array(z.string()).optional(),
});

/**
 * 응답 한 톤. `length` 를 받는 이유는 **message 상한이 길이 축마다 다르기 때문**이다
 * (`MESSAGE_LENGTH_MAX_CHARS`). 나머지 칸은 길이와 무관하다.
 *
 * `message` 만 `.trim()` 을 먼저 건다 — 모델이 끝에 붙이는 줄바꿈 한두 칸 때문에
 * 멀쩡한 멘트가 상한에 걸리는 것은 분량 문제가 아니라 공백 문제다.
 */
function toneMessageSchemaFor(length: MessageLength) {
  return z.object({
    tone: toneSchema,
    headline: z.string().min(1),
    message: z.string().trim().min(1).max(MESSAGE_LENGTH_MAX_CHARS[length]),
    why_it_fits: z.string().min(1),
    // 플래그가 없으면 필드째 생략하고 보내는 모델이 있다(CLOVA HCX 실측 — 매 호출 재현).
    // "없음 = 빈 배열" 이므로 생략을 관용한다. 파싱 후에는 항상 배열이다.
    safety_flags: z.array(z.string()).default([]),
  });
}

/**
 * 요청한 길이에 맞는 응답 계약.
 *
 * 상한을 넘긴 멘트는 여기서 **파싱 실패와 같은 자리**로 떨어진다 — 부르는 쪽
 * (`provider.ts` 의 `parseResponse`)이 `null` 을 받고, 그 뒤는 기존 재시도·폴백 선례
 * 그대로다. 잘라 붙이는 길은 어디에도 열어 두지 않는다.
 */
export function generateResponseSchemaFor(length: MessageLength) {
  return z.object({
    tones: z.array(toneMessageSchemaFor(length)).length(RESPONSE_TONE_COUNT),
  });
}

/** 길이를 말하지 않은 자리의 기본 계약(= `medium`). 타입의 원본이기도 하다. */
export const generateResponseSchema = generateResponseSchemaFor('medium');

/**
 * 호출부가 **만들어 넘기는** 모양 — `length` 처럼 기본값이 있는 필드는 생략할 수 있다
 * (`z.input`). 그래서 이 축이 생겨도 기존 호출부는 한 글자도 바뀌지 않는다.
 */
export type GenerateRequest = z.input<typeof generateRequestSchema>;
/**
 * 검증을 **통과한 뒤의** 모양 — 기본값이 채워져 있다(`length` 는 항상 있다).
 * 프롬프트 조립처럼 "값이 반드시 있다"에 기대는 쪽이 이 타입을 쓴다.
 */
export type GenerateRequestParsed = z.output<typeof generateRequestSchema>;
export type GenerateResponse = z.infer<typeof generateResponseSchema>;
/** 응답 한 톤의 모양. 길이 축과 무관한 타입이라 기본 계약에서 뽑는다. */
export type ToneMessage = GenerateResponse['tones'][number];
