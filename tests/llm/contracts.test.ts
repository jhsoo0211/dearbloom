import { describe, expect, it } from 'vitest';

import {
  INTENT_DETAIL_MAX_CHARS,
  MEMORY_CONTEXT_MAX_CHARS,
  RELATIONSHIP_DETAIL_MAX_CHARS,
  generateRequestSchema,
} from '@/lib/llm/contracts';
import type { GenerateRequest } from '@/lib/llm/contracts';
import { buildUserPrompt } from '@/lib/llm/prompt';

/**
 * §1.5l 이 계약에 들여온 네 필드.
 *   relationship_detail — 직접 쓴 사이 한 줄(80자). 'other' 일 때 이 값이 곧 관계다.
 *   intent_detail       — 직접 쓴 마음 한 줄(80자). 'other' 일 때 이 값이 곧 상황이다.
 *   recipient_traits    — 특징 칩 라벨(멘트 재료). 반려동물·향 민감 칩은 담지 않는다.
 *   episode_hints       — 상황 칩 라벨. 자유 서술과 달리 서비스 어휘다.
 *
 * 넷 다 **선택**이다 — 아무것도 고르지 않은 요청이 예전과 똑같이 통과해야 한다.
 *
 * ⚠ 예산은 여기 **없다.** §1.5l 이 예산 `기타` 에 자유 한 줄을 열었지만 그 값은 계약에
 *   담지 않는다 — 프롬프트 절대 규칙 3 이 "가격을 문장에 쓰지 않는다" 이기 때문이다.
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
    expect(parsed.relationship_detail).toBeUndefined();
    expect(parsed.intent_detail).toBeUndefined();
    expect(parsed.recipient_traits).toBeUndefined();
    expect(parsed.episode_hints).toBeUndefined();
  });

  it("사이 'other' 와 직접 쓴 한 줄을 받는다", () => {
    const parsed = generateRequestSchema.parse(
      baseRequest({
        relationship: 'other',
        relationship_detail: '10년째 같은 밴드에서 합주하는 사이예요',
      }),
    );
    expect(parsed.relationship).toBe('other');
    expect(parsed.relationship_detail).toBe('10년째 같은 밴드에서 합주하는 사이예요');
  });

  it('사이 한 줄도 80자를 넘으면 계약이 막는다', () => {
    expect(() =>
      generateRequestSchema.parse(
        baseRequest({
          relationship: 'other',
          relationship_detail: '가'.repeat(RELATIONSHIP_DETAIL_MAX_CHARS + 1),
        }),
      ),
    ).toThrow();

    expect(
      generateRequestSchema.parse(
        baseRequest({
          relationship: 'other',
          relationship_detail: '가'.repeat(RELATIONSHIP_DETAIL_MAX_CHARS),
        }),
      ).relationship_detail,
    ).toHaveLength(RELATIONSHIP_DETAIL_MAX_CHARS);
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

describe('generateRequestSchema — 자유 서술의 상한', () => {
  /**
   * `memory_context` 는 이 계약에서 **사용자가 쓴 글을 그대로 나르는 유일한 필드**다.
   * 상한이 없으면 프롬프트 길이도, 10초 응답 예산도 지켜 줄 사람이 없다.
   */
  it('상한(600자)까지는 통과하고, 한 글자만 넘어도 막는다', () => {
    expect(
      generateRequestSchema.parse(
        baseRequest({ memory_context: '가'.repeat(MEMORY_CONTEXT_MAX_CHARS) }),
      ).memory_context,
    ).toHaveLength(MEMORY_CONTEXT_MAX_CHARS);

    expect(() =>
      generateRequestSchema.parse(
        baseRequest({ memory_context: '가'.repeat(MEMORY_CONTEXT_MAX_CHARS + 1) }),
      ),
    ).toThrow();
  });

  it('화면 상한 두 개(200 · 400)를 이어 붙인 길이를 담을 수 있다', () => {
    // 호출부는 두 자유 서술을 줄바꿈으로 잇는다 — 200 + 1 + 400 = 601 이라 그대로면 계약을
    // 넘긴다. 그래서 호출부가 이 값으로 한 번 더 자르고, 잘린 결과는 반드시 통과해야 한다.
    const joined = ['가'.repeat(200), '나'.repeat(400)].join('\n');
    expect(joined.length).toBe(601);

    expect(
      generateRequestSchema.safeParse(
        baseRequest({ memory_context: joined.slice(0, MEMORY_CONTEXT_MAX_CHARS) }),
      ).success,
    ).toBe(true);
  });

  it('자유 서술을 아예 적지 않은 요청도 그대로 통과한다', () => {
    expect(generateRequestSchema.parse(baseRequest()).memory_context).toBeUndefined();
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

  it("사이 'other' 는 관계 바로 아래에 직접 적은 사이를 세운다", () => {
    const prompt = buildUserPrompt(
      generateRequestSchema.parse(
        baseRequest({
          relationship: 'other',
          relationship_detail: '10년째 같은 밴드에서 합주하는 사이예요',
        }),
      ),
    );

    expect(prompt).toContain('관계: 사용자가 직접 적은 사이');
    expect(prompt).toContain('직접 적어 주신 사이: 10년째 같은 밴드에서 합주하는 사이예요');
    // 말투 규칙이 기댈 근거이므로 `전하려는 마음` 보다 **앞**에 선다.
    expect(prompt.indexOf('직접 적어 주신 사이')).toBeGreaterThan(prompt.indexOf('관계:'));
    expect(prompt.indexOf('직접 적어 주신 사이')).toBeLessThan(prompt.indexOf('전하려는 마음'));
  });

  it('여섯 갈래에서는 사이 상세 줄이 서지 않는다', () => {
    const prompt = buildUserPrompt(
      generateRequestSchema.parse(baseRequest({ relationship_detail: '어쩌다 남은 값' })),
    );
    expect(prompt).not.toContain('직접 적어 주신 사이');
    expect(prompt).toContain('관계: 친구');
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
