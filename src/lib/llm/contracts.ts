import { z } from 'zod';
import { intentSchema, relationshipSchema, toneSchema } from '@/lib/engine/normalize';

/**
 * 메시지 생성 LLM 호출의 입출력 계약.
 * 여기에는 스키마만 둔다 — 프롬프트와 호출 구현은 별도 모듈에서 맡는다.
 */

/** 응답에서 요구하는 톤 개수(항상 3안). */
export const RESPONSE_TONE_COUNT = 3;

const flowerBriefSchema = z.object({
  id: z.string().min(1),
  name_ko: z.string().min(1),
  meaning_ko: z.string().min(1),
  /** 꽃말 출처 id. 출처 없는 꽃말은 생성에 쓰지 않는다. */
  meaning_source_id: z.string().min(1),
});

/** §1.5l `직접 쓸게요` 한 줄의 길이 상한. 화면·서버·계약이 같은 값을 쓴다. */
export const INTENT_DETAIL_MAX_CHARS = 80;

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

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type GenerateResponse = z.infer<typeof generateResponseSchema>;
export type ToneMessage = z.infer<typeof toneMessageSchema>;
