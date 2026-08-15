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

export const generateRequestSchema = z.object({
  relationship: relationshipSchema,
  intent: intentSchema,
  flower: flowerBriefSchema,
  memory_context: z.string().optional(),
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
