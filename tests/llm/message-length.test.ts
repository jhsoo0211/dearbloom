import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MESSAGE_LENGTH_MAX_CHARS,
  generateRequestSchema,
  generateResponseSchemaFor,
} from '@/lib/llm/contracts';
import { MESSAGE_LENGTH_CHARS, MESSAGE_MAX_CHARS, buildSystemPrompt, buildUserPrompt } from '@/lib/llm/prompt';
import { generateMessages } from '@/lib/llm/provider';

/**
 * 멘트 **분량 상한** (2026-08-18 사용자 요구: "너무 길지 않게").
 *
 * 상한이 지켜지려면 세 곳이 같은 수를 봐야 한다 — 프롬프트가 요구하고, 계약이 막고,
 * 화면이 그 수를 말한다. 여기서는 앞의 둘을 잰다(화면은 같은 상수를 import 한다).
 *
 * ⚠ **잘라 붙이지 않는다**가 이 파일의 두 번째 축이다. 넘긴 답은 계약 위반으로 다뤄
 *   재시도·폴백으로 흘러가고, 중간에서 끊긴 문장이 화면에 서는 길은 어디에도 없다.
 */

const FLOWER = {
  id: 'freesia',
  name_ko: '프리지아',
  meaning_ko: '새로운 시작',
  meaning_source_id: 'src-freesia-1',
};

function request(length: 'short' | 'medium') {
  return generateRequestSchema.parse({
    relationship: 'friend',
    intent: 'gratitude',
    flower: FLOWER,
    tones: ['plain', 'romantic', 'sincere'],
    length,
  });
}

/** 길이 축에 맞는 3톤 응답 한 벌. `message` 길이만 인자로 정한다. */
function response(chars: number) {
  return {
    tones: ['plain', 'romantic', 'sincere'].map((tone) => ({
      tone,
      headline: '고마워',
      message: '가'.repeat(chars),
      why_it_fits: '고마운 마음을 담았어요.',
      safety_flags: [],
    })),
  };
}

describe('상한 상수 — 한 벌만 있다', () => {
  it('프롬프트의 분량은 계약의 상한을 그대로 읽는다', () => {
    expect(MESSAGE_LENGTH_CHARS.short.max).toBe(MESSAGE_LENGTH_MAX_CHARS.short);
    expect(MESSAGE_LENGTH_CHARS.medium.max).toBe(MESSAGE_LENGTH_MAX_CHARS.medium);
  });

  it('짧게가 보통보다 짧고, 하한이 상한을 넘지 않는다', () => {
    expect(MESSAGE_LENGTH_MAX_CHARS.short).toBeLessThan(MESSAGE_LENGTH_MAX_CHARS.medium);
    for (const key of ['short', 'medium'] as const) {
      expect(MESSAGE_LENGTH_CHARS[key].min, key).toBeLessThan(MESSAGE_LENGTH_CHARS[key].max);
    }
  });

  it('고쳐 쓰기 상한(200)은 생성 상한과 별개다 — 사용자의 자유는 우리 약속이 아니다', () => {
    expect(MESSAGE_MAX_CHARS).toBe(200);
    expect(MESSAGE_MAX_CHARS).toBeGreaterThan(MESSAGE_LENGTH_MAX_CHARS.medium);
  });
});

describe('프롬프트 — 상한을 말한다', () => {
  it('요청한 길이의 상한이 분량 줄에 그대로 실린다', () => {
    expect(buildUserPrompt(request('short'))).toContain(
      `${MESSAGE_LENGTH_MAX_CHARS.short}자를 넘기지 않는다`,
    );
    expect(buildUserPrompt(request('medium'))).toContain(
      `${MESSAGE_LENGTH_MAX_CHARS.medium}자를 넘기지 않는다`,
    );
  });

  it('상한을 넘기면 버려진다는 사실을 시스템 규칙이 말한다', () => {
    expect(buildSystemPrompt()).toContain('상한을 넘긴 답은 쓰이지 않고 버려진다');
  });
});

describe('계약 — 넘긴 멘트는 통과하지 못한다', () => {
  it('상한까지는 통과하고, 한 글자만 넘어도 막힌다', () => {
    for (const length of ['short', 'medium'] as const) {
      const cap = MESSAGE_LENGTH_MAX_CHARS[length];
      const schema = generateResponseSchemaFor(length);
      expect(schema.safeParse(response(cap)).success, `${length}/${cap}`).toBe(true);
      expect(schema.safeParse(response(cap + 1)).success, `${length}/${cap + 1}`).toBe(false);
    }
  });

  it('앞뒤 공백은 분량이 아니다 — 다듬은 뒤에 잰다', () => {
    const cap = MESSAGE_LENGTH_MAX_CHARS.medium;
    const padded = {
      tones: response(cap).tones.map((tone) => ({ ...tone, message: `\n  ${tone.message}  \n` })),
    };
    const parsed = generateResponseSchemaFor('medium').safeParse(padded);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.tones[0].message).toHaveLength(cap);
  });

  it('보통 길이로 받은 답이라도 짧게 계약에는 걸린다', () => {
    const mediumLength = MESSAGE_LENGTH_MAX_CHARS.short + 10;
    expect(generateResponseSchemaFor('medium').safeParse(response(mediumLength)).success).toBe(true);
    expect(generateResponseSchemaFor('short').safeParse(response(mediumLength)).success).toBe(false);
  });
});

describe('프로바이더 — 넘긴 답은 재시도, 그다음은 폴백', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.GEMINI_API_KEY = 'test-gemini';
    process.env.ANTHROPIC_API_KEY = 'test-claude';
    delete process.env.CLOVA_API_KEY;
    delete process.env.NVIDIA_API_KEY;
    delete process.env.LLM_MODEL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  /** gemini 는 상한을 넘긴 답만, claude 는 알맞은 답을 준다. */
  function stubFetch(geminiChars: number, claudeChars: number) {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const target = String(url);
        calls.push(target);
        const gemini = target.includes('googleapis.com');
        const text = JSON.stringify(response(gemini ? geminiChars : claudeChars));
        const body = gemini
          ? { candidates: [{ content: { parts: [{ text }] } }] }
          : { content: [{ type: 'text', text }] };
        return { ok: true, json: async () => body } as unknown as Response;
      }),
    );
    return calls;
  }

  it('상한을 넘긴 답은 같은 프로바이더로 한 번 더, 그래도 넘치면 다음으로 간다', async () => {
    const over = MESSAGE_LENGTH_MAX_CHARS.medium + 40;
    const calls = stubFetch(over, MESSAGE_LENGTH_MAX_CHARS.medium);

    const result = await generateMessages({
      relationship: 'friend',
      intent: 'gratitude',
      flower: FLOWER,
      tones: ['plain', 'romantic', 'sincere'],
      length: 'medium',
    });

    // gemini 두 번(재시도) → claude 한 번.
    expect(calls.filter((url) => url.includes('googleapis.com'))).toHaveLength(2);
    expect(calls.filter((url) => url.includes('api.anthropic.com'))).toHaveLength(1);

    // 확정된 문장은 상한 안이다 — 잘라 붙인 흔적(말줄임)도 없다.
    expect(result).not.toBeNull();
    for (const tone of result!.tones) {
      expect(tone.message.length).toBeLessThanOrEqual(MESSAGE_LENGTH_MAX_CHARS.medium);
      expect(tone.message.endsWith('…')).toBe(false);
    }
  });

  it('전부 넘치면 빈손이다 — 잘라서라도 내보내지 않는다', async () => {
    const over = MESSAGE_LENGTH_MAX_CHARS.short + 30;
    stubFetch(over, over);

    const result = await generateMessages({
      relationship: 'friend',
      intent: 'gratitude',
      flower: FLOWER,
      tones: ['plain', 'romantic', 'sincere'],
      length: 'short',
    });

    expect(result).toBeNull();
  });
});
