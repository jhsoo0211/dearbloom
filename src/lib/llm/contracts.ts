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

const toneMessageSchema = z.object({
  tone: toneSchema,
  headline: z.string().min(1),
  message: z.string().min(1),
  why_it_fits: z.string().min(1),
  // 플래그가 없으면 필드째 생략하고 보내는 모델이 있다(CLOVA HCX 실측 — 매 호출 재현).
  // "없음 = 빈 배열" 이므로 생략을 관용한다. 파싱 후에는 항상 배열이다.
  safety_flags: z.array(z.string()).default([]),
});

export const generateResponseSchema = z.object({
  tones: z.array(toneMessageSchema).length(RESPONSE_TONE_COUNT),
});

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
export type ToneMessage = z.infer<typeof toneMessageSchema>;
