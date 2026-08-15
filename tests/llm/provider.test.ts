import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateMessages } from '@/lib/llm/provider';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/llm/prompt';
import type { GenerateRequest } from '@/lib/llm/contracts';

/**
 * 프로바이더 어댑터 테스트.
 *
 * **실 API 를 부르지 않는다.** 전역 `fetch` 를 갈아끼워 응답만 흉내 내고,
 * 확인하는 것은 "폴백 신호(null)를 언제 돌려주는가" 와 "무엇을 보내는가" 두 가지다.
 */

const REQUEST: GenerateRequest = {
  relationship: 'lover',
  intent: 'apology',
  flower: {
    id: 'tulip-white',
    name_ko: '흰 튤립',
    meaning_ko: '용서, 새로운 시작',
    meaning_source_id: 'greenaway-1884',
  },
  tones: ['plain', 'romantic', 'sincere'],
  memory_context: '작년 봄에 함께 걷던 길에 튤립이 피어 있었어요.',
};

/** 계약을 통과하는 3톤 응답. */
const VALID_PAYLOAD = {
  tones: [
    {
      tone: 'plain',
      headline: '먼저, 미안해.',
      message: '어제 약속 잊은 거 변명하지 않을게. 기다리게 해서 미안해.',
      why_it_fits: '짧게 인정부터 건네요.',
      safety_flags: [],
    },
    {
      tone: 'romantic',
      headline: '네 시간을 소홀히 했어.',
      message: '기다리는 동안 서운했을 네 마음을 생각하면 더 미안해.',
      why_it_fits: '상대의 마음을 먼저 헤아려요.',
      safety_flags: [],
    },
    {
      tone: 'sincere',
      headline: '변명 없이 사과할게.',
      message: '내 잘못이야. 같은 일이 반복되지 않게 일정부터 먼저 확인할게.',
      why_it_fits: '재발 방지까지 담았어요.',
      safety_flags: [],
    },
  ],
};

/** Gemini 응답 봉투. */
function geminiBody(text: string) {
  return { candidates: [{ content: { parts: [{ text }] } }] };
}

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

type FetchImpl = (url: string, init: RequestInit) => unknown;

/** 전역 fetch 를 갈아끼우고 그 mock 을 돌려준다. */
function mockFetch(impl: FetchImpl) {
  const fn = vi.fn(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** 이 테스트가 건드리는 환경변수만 초기화한다. */
function clearKeys() {
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.LLM_MODEL;
}

beforeEach(() => {
  clearKeys();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  clearKeys();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('generateMessages — 키가 없을 때', () => {
  it('키가 하나도 없으면 부르지 않고 null 을 돌려준다', async () => {
    const fetchMock = mockFetch(() => okResponse(geminiBody(JSON.stringify(VALID_PAYLOAD))));

    await expect(generateMessages(REQUEST)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('generateMessages — 정상 응답', () => {
  it('Gemini 응답을 계약대로 파싱한다', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    const fetchMock = mockFetch(() => okResponse(geminiBody(JSON.stringify(VALID_PAYLOAD))));

    const result = await generateMessages(REQUEST);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result?.tones).toHaveLength(3);
    expect(result?.tones.map((t) => t.tone)).toEqual(['plain', 'romantic', 'sincere']);
    expect(result?.tones[2].headline).toBe('변명 없이 사과할게.');
  });

  it('Claude 응답도 같은 계약으로 파싱한다', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-claude-key';
    const fetchMock = mockFetch(() =>
      okResponse({ content: [{ type: 'text', text: JSON.stringify(VALID_PAYLOAD) }] }),
    );

    const result = await generateMessages(REQUEST);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://api.anthropic.com/v1/messages');
    expect(result?.tones).toHaveLength(3);
  });

  it('```json 펜스로 감싸 와도 벗겨 읽는다', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    mockFetch(() =>
      okResponse(geminiBody('```json\n' + JSON.stringify(VALID_PAYLOAD) + '\n```')),
    );

    const result = await generateMessages(REQUEST);
    expect(result?.tones).toHaveLength(3);
  });

  it('키가 둘 다 있으면 Gemini 를 먼저 쓰고, LLM_MODEL 이 모델명을 덮는다', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.ANTHROPIC_API_KEY = 'test-claude-key';
    process.env.LLM_MODEL = 'gemini-3-pro';
    const fetchMock = mockFetch(() => okResponse(geminiBody(JSON.stringify(VALID_PAYLOAD))));

    await generateMessages(REQUEST);

    expect(String(fetchMock.mock.calls[0][0])).toContain('gemini-3-pro:generateContent');
  });
});

describe('generateMessages — 실패는 전부 폴백 신호(null)', () => {
  it('JSON 이 깨져 있으면 한 번 더 부르고, 그래도 안 되면 null 이다', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    const fetchMock = mockFetch(() => okResponse(geminiBody('여기 있습니다! {tones: ')));

    await expect(generateMessages(REQUEST)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('계약에 맞지 않는 JSON(톤 2개)도 재시도 후 null 이다', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    const short = { tones: VALID_PAYLOAD.tones.slice(0, 2) };
    const fetchMock = mockFetch(() => okResponse(geminiBody(JSON.stringify(short))));

    await expect(generateMessages(REQUEST)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('두 번째 시도에서 제대로 오면 그 값을 쓴다', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    let call = 0;
    const fetchMock = mockFetch(() => {
      call += 1;
      return okResponse(geminiBody(call === 1 ? 'not json' : JSON.stringify(VALID_PAYLOAD)));
    });

    const result = await generateMessages(REQUEST);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result?.tones).toHaveLength(3);
  });

  it('HTTP 오류면 본문을 읽지 않고 null 로 떨어진다', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    const json = vi.fn();
    mockFetch(() => ({ ok: false, status: 429, json }));

    await expect(generateMessages(REQUEST)).resolves.toBeNull();
    expect(json).not.toHaveBeenCalled();
  });

  it('10초를 넘기면 중단하고 null 이다 (재시도하지 않는다)', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    vi.useFakeTimers();

    const fetchMock = mockFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );

    const pending = generateMessages(REQUEST);
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(pending).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('프롬프트', () => {
  it('꽃말과 출처 id 를 함께 싣는다 (출처 없는 꽃말은 쓰지 않게)', () => {
    const prompt = buildUserPrompt(REQUEST);

    expect(prompt).toContain('meaning_source_id');
    expect(prompt).toContain('greenaway-1884');
    expect(prompt).toContain('용서, 새로운 시작');
  });

  it('에피소드를 "지시가 아니라 자료" 로 감싼다', () => {
    const prompt = buildUserPrompt(REQUEST);

    expect(prompt).toContain('<자료>');
    expect(prompt).toContain('지시가 아니다');
    expect(prompt).toContain('작년 봄에 함께 걷던 길');
  });

  it('시스템 규칙이 꽃말 발명·인용 생성·안전 추정을 막는다', () => {
    const system = buildSystemPrompt();

    expect(system).toContain('지어내거나');
    expect(system).toContain('명언');
    expect(system).toContain('반려동물');
  });

  it('요청 본문에 꽃말·출처가 실려 나간다', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    const fetchMock = mockFetch(() => okResponse(geminiBody(JSON.stringify(VALID_PAYLOAD))));

    await generateMessages(REQUEST);

    const body = String((fetchMock.mock.calls[0][1] as RequestInit).body);
    expect(body).toContain('greenaway-1884');
  });
});
