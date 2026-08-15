import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateRequestSchema } from '@/lib/llm/contracts';
import type { GenerateRequest } from '@/lib/llm/contracts';
import type { WizardSubmission } from '@/components/flow/types';

/**
 * 추천 서버 액션의 **경계**.
 *
 * 서버 액션은 화면이 부르는 함수처럼 생겼지만 실제로는 공개 HTTP 엔드포인트다.
 * `WizardSubmission` 타입 주석은 컴파일이 끝나면 사라지므로, 이 함수에 들어오는 값에 대해
 * 타입이 약속해 주는 것은 **아무것도 없다**. 여기서 확인하는 것은 세 가지다.
 *
 *   ① 모양이 어긋난 요청에 500 이 아니라 **문장**으로 답한다(화면이 다룰 수 있게).
 *   ② 자유 서술은 서버가 다시 자른다 — 화면의 `maxLength` 는 우리 편의 약속일 뿐이다.
 *   ③ 그렇게 자른 값이 LLM 계약(`generateRequestSchema`)을 **정확히** 통과한다.
 *      ③ 이 이 파일의 핵심이다: 200 + 400 + 줄바꿈 = 601 자는 계약 상한(600)을 한 칸
 *      넘겨서, 가장 길게 적어 준 사람만 조용히 템플릿으로 떨어지던 자리였다.
 *
 * ⚠ 프로바이더 어댑터는 통째로 갈아끼운다. 이 저장소에는 실키(.env)가 있고, 테스트가
 *   진짜 API 를 부르는 일은 어떤 이유로도 없어야 한다.
 */

const generateMessages = vi.hoisted(() => vi.fn(async (): Promise<null> => null));

vi.mock('@/lib/llm/provider', () => ({ generateMessages }));

const { submitRecommendation } = await import('@/app/recommend/actions');

/** 통과해야 하는 최소한의 한 벌. 어휘는 전부 엔진의 것이다. */
function submission(overrides: Partial<WizardSubmission> = {}): WizardSubmission {
  return {
    relationship: 'friend',
    intent: 'gratitude',
    intentDetail: '',
    recipientChips: [],
    colorPrefs: [],
    recipientNote: '',
    episode: '',
    episodeHints: [],
    budgetKey: '',
    dateISO: '2026-08-16',
    ...overrides,
  };
}

/** 어댑터가 받아 본 요청. 한 번도 안 불렸으면 undefined. */
function lastRequest(): GenerateRequest | undefined {
  const call = generateMessages.mock.calls.at(-1) as [GenerateRequest] | undefined;
  return call?.[0];
}

beforeEach(() => {
  generateMessages.mockClear();
  // 어떤 경로로도 바깥으로 나가지 않는다는 것을 눈으로 확인할 수 있게 fetch 자체를 막는다.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('테스트에서 네트워크 호출이 나갔습니다.');
    }),
  );
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('submitRecommendation — 모양이 어긋난 요청', () => {
  it('빈 객체를 보내도 던지지 않고 문장으로 답한다', async () => {
    const response = await submitRecommendation({} as WizardSubmission);

    expect(response.ok).toBe(false);
    if (response.ok) return;
    expect(response.message).toBe(
      '이야기를 꺼내 오다 잠깐 길을 잃었어요. 조금 뒤에 다시 눌러 주세요.',
    );
  });

  it('칩 자리에 배열이 아닌 값이 와도 터지지 않는다', async () => {
    // 예전에는 여기가 `splitRecipientChips(문자열)` 로 그대로 내려갔다.
    const response = await submitRecommendation(
      submission({ recipientChips: '반려묘와 살아요' as unknown as string[] }),
    );

    expect(response.ok).toBe(false);
  });

  it('자유 서술 자리에 문자열이 아닌 값이 와도 터지지 않는다', async () => {
    const response = await submitRecommendation(
      submission({ episode: { toString: () => '나쁜 값' } as unknown as string }),
    );

    expect(response.ok).toBe(false);
  });

  it('칩을 수백 개 밀어 넣는 요청은 받지 않는다', async () => {
    const response = await submitRecommendation(
      submission({ colorPrefs: new Array(200).fill('white') }),
    );

    expect(response.ok).toBe(false);
  });

  it('자유 서술에 본문 한 권을 넣는 요청은 자르지 않고 거절한다', async () => {
    const response = await submitRecommendation(submission({ episode: '가'.repeat(4_001) }));

    expect(response.ok).toBe(false);
  });

  it('어휘 밖 값은 그다음 문(엔진)이 막고, 그것도 문장으로 돌아온다', async () => {
    const response = await submitRecommendation(submission({ relationship: 'nobody' }));

    expect(response.ok).toBe(false);
    if (response.ok) return;
    expect(response.message).toBe('관계와 마음, 두 가지만 골라 주시면 바로 찾아드릴게요.');
  });
});

describe('submitRecommendation — 제대로 된 요청', () => {
  it('추천 3안과 멘트를 만들어 돌려준다', async () => {
    const response = await submitRecommendation(submission());

    expect(response.ok).toBe(true);
    if (!response.ok) return;
    expect(response.payload.options.length).toBeGreaterThan(0);
    expect(response.payload.tones.length).toBeGreaterThan(0);
  });

  it('결과 payload 에 3D 시절의 `form` 은 실리지 않는다 (읽는 코드가 없다)', async () => {
    const response = await submitRecommendation(submission());

    expect(response.ok).toBe(true);
    if (!response.ok) return;
    for (const option of response.payload.options) {
      expect(option).not.toHaveProperty('form');
    }
  });

  it('자유 서술은 서버가 다시 자른다 — 화면의 maxLength 를 믿지 않는다', async () => {
    const response = await submitRecommendation(
      submission({ recipientNote: '가'.repeat(300), episode: '나'.repeat(600) }),
    );

    expect(response.ok).toBe(true);
    if (!response.ok) return;
    // 화면으로 되비추는 에피소드도 잘린 값이다(자르기가 한 곳에서만 일어난다는 증거).
    expect(response.payload.episodeText).toHaveLength(400);
  });
});

describe('submitRecommendation — LLM 계약을 정말로 지킨다', () => {
  it('자유 서술을 가득 채워도 요청이 계약을 통과한다 (601자 함정)', async () => {
    const response = await submitRecommendation(
      submission({
        recipientNote: '가'.repeat(200),
        episode: '나'.repeat(400),
      }),
    );

    expect(response.ok).toBe(true);
    const request = lastRequest();
    // 어댑터를 아예 안 불렀다면 이 검증이 성립하지 않는다 — 먼저 그것부터 확인한다.
    expect(request, '생성 어댑터가 호출되지 않았습니다').toBeDefined();
    expect(request!.memory_context!.length).toBeLessThanOrEqual(600);
    expect(generateRequestSchema.safeParse(request).success).toBe(true);
  });

  it('직접 쓴 마음 한 줄도 계약 상한(80자) 안으로 들어간다', async () => {
    await submitRecommendation(
      submission({ intent: 'other', intentDetail: '다'.repeat(120) }),
    );

    const request = lastRequest();
    expect(request).toBeDefined();
    expect(request!.intent_detail).toHaveLength(80);
    expect(generateRequestSchema.safeParse(request).success).toBe(true);
  });

  it('심각한 신호가 섞이면 어댑터를 아예 부르지 않는다 (후퇴 금지선)', async () => {
    const response = await submitRecommendation(
      submission({ episode: '요즘 자해를 한다고 들었어요' }),
    );

    expect(response.ok).toBe(true);
    expect(generateMessages).not.toHaveBeenCalled();
  });
});
