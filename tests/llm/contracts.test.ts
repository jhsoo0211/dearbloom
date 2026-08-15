import { describe, expect, it } from 'vitest';

import { INTENT_DETAIL_MAX_CHARS, generateRequestSchema } from '@/lib/llm/contracts';
import type { GenerateRequest } from '@/lib/llm/contracts';
import { buildUserPrompt } from '@/lib/llm/prompt';

/**
 * §1.5l 이 계약에 들여온 세 필드.
 *   intent_detail    — 직접 쓴 마음 한 줄(80자). 'other' 일 때 이 값이 곧 상황이다.
 *   recipient_traits — 특징 칩 라벨(멘트 재료). 반려동물·향 민감 칩은 담지 않는다.
 *   episode_hints    — 상황 칩 라벨. 자유 서술과 달리 서비스 어휘다.
 *
 * 셋 다 **선택**이다 — 아무것도 고르지 않은 요청이 예전과 똑같이 통과해야 한다.
 */

const FLOWER: GenerateRequest['flower'] = {
  id: 'freesia',
  name_ko: '프리지아',
  meaning_ko: '새로운 시작',
  meaning_source_id: 'src-freesia-1',
};

function baseRequest(overrides: Partial<GenerateRequest> = {}): Record<string, unknown> {
  return {
    relationship: 'friend',
    intent: 'gratitude',
    flower: FLOWER,
    tones: ['plain', 'romantic', 'sincere'],
    ...overrides,
  };
}

describe('generateRequestSchema — §1.5l 확장', () => {
  it('예전 모양의 요청이 그대로 통과한다 (새 필드는 전부 선택)', () => {
    const parsed = generateRequestSchema.parse(baseRequest());
    expect(parsed.intent_detail).toBeUndefined();
    expect(parsed.recipient_traits).toBeUndefined();
    expect(parsed.episode_hints).toBeUndefined();
  });

  it("마음 'other' 와 직접 쓴 한 줄을 받는다", () => {
    const parsed = generateRequestSchema.parse(
      baseRequest({ intent: 'other', intent_detail: '유학 떠나는 조카를 배웅해요' }),
    );
    expect(parsed.intent).toBe('other');
    expect(parsed.intent_detail).toBe('유학 떠나는 조카를 배웅해요');
  });

  it('한 줄이 80자를 넘으면 계약이 막는다', () => {
    expect(() =>
      generateRequestSchema.parse(
        baseRequest({ intent: 'other', intent_detail: '가'.repeat(INTENT_DETAIL_MAX_CHARS + 1) }),
      ),
    ).toThrow();

    expect(
      generateRequestSchema.parse(
        baseRequest({ intent: 'other', intent_detail: '가'.repeat(INTENT_DETAIL_MAX_CHARS) }),
      ).intent_detail,
    ).toHaveLength(INTENT_DETAIL_MAX_CHARS);
  });

  it('상황 칩은 6개까지, 특징 칩 라벨은 12개까지 싣는다', () => {
    const hints = ['오랜만에 연락해요', '최근에 다퉜어요'];
    expect(generateRequestSchema.parse(baseRequest({ episode_hints: hints })).episode_hints).toEqual(
      hints,
    );

    expect(() =>
      generateRequestSchema.parse(baseRequest({ episode_hints: new Array(7).fill('칩') })),
    ).toThrow();
    expect(() =>
      generateRequestSchema.parse(baseRequest({ recipient_traits: new Array(13).fill('칩') })),
    ).toThrow();
  });
});

describe('buildUserPrompt — §1.5l 재료가 프롬프트에 실린다', () => {
  it("'other' 는 직접 적은 상황을 자료로 세운다", () => {
    const prompt = buildUserPrompt(
      generateRequestSchema.parse(
        baseRequest({ intent: 'other', intent_detail: '유학 떠나는 조카를 배웅해요' }),
      ),
    );

    expect(prompt).toContain('직접 적어 주신 상황: 유학 떠나는 조카를 배웅해요');
    // 상황 줄은 <자료> 블록 안, 꽃 정보 앞에 선다.
    expect(prompt.indexOf('직접 적어 주신 상황')).toBeGreaterThan(prompt.indexOf('<자료>'));
    expect(prompt.indexOf('직접 적어 주신 상황')).toBeLessThan(prompt.indexOf('꽃: 프리지아'));
  });

  it('일곱 갈래에서는 상세 줄이 서지 않는다', () => {
    const prompt = buildUserPrompt(
      generateRequestSchema.parse(baseRequest({ intent_detail: '어쩌다 남은 값' })),
    );
    expect(prompt).not.toContain('직접 적어 주신 상황');
  });

  it('특징 칩·상황 칩이 각자의 줄로 들어간다', () => {
    const prompt = buildUserPrompt(
      generateRequestSchema.parse(
        baseRequest({
          recipient_traits: ['꽃을 처음 받아봐요', '향기를 좋아해요'],
          episode_hints: ['오랜만에 연락해요'],
        }),
      ),
    );

    expect(prompt).toContain('받는 분에 대해: 꽃을 처음 받아봐요 · 향기를 좋아해요');
    expect(prompt).toContain('두 사람 사이의 상황: 오랜만에 연락해요');
  });

  it('아무것도 고르지 않으면 빈 줄을 만들지 않는다', () => {
    const prompt = buildUserPrompt(generateRequestSchema.parse(baseRequest()));
    expect(prompt).not.toContain('받는 분에 대해');
    expect(prompt).not.toContain('두 사람 사이의 상황');
    expect(prompt).toContain('전하려는 마음: 감사');
  });
});
