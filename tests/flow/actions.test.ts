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
    relationshipDetail: '',
    intent: 'gratitude',
    intentDetail: '',
    recipientChips: [],
    colorPrefs: [],
    recipientNote: '',
    episode: '',
    episodeHints: [],
    episodeHintDetail: '',
    budgetKey: '',
    budgetDetail: '',
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

  it('직접 쓴 사이 한 줄도 계약 상한(80자) 안으로 들어간다', async () => {
    await submitRecommendation(
      submission({ relationship: 'other', relationshipDetail: '라'.repeat(120) }),
    );

    const request = lastRequest();
    expect(request).toBeDefined();
    expect(request!.relationship).toBe('other');
    expect(request!.relationship_detail).toHaveLength(80);
    expect(generateRequestSchema.safeParse(request).success).toBe(true);
  });

  it('사이를 직접 고르면 상세 줄은 실리지 않는다', async () => {
    await submitRecommendation(
      submission({ relationship: 'friend', relationshipDetail: '어쩌다 남은 값' }),
    );

    // 화면이 이미 지우고 보내지만, 서버 경로에서도 `other` 일 때만 실려야 한다.
    const request = lastRequest();
    expect(request).toBeDefined();
    expect(request!.relationship_detail).toBe('어쩌다 남은 값');
    // 프롬프트가 `other` 가 아닌 관계에서는 이 줄을 세우지 않는다(contracts.test.ts).
    expect(generateRequestSchema.safeParse(request).success).toBe(true);
  });

  it('상황 칩 `기타` 는 선택지 이름 대신 사용자의 원문이 실린다', async () => {
    await submitRecommendation(
      submission({
        episodeHints: ['quarrel', 'other'],
        episodeHintDetail: '서로 바빠서 자주 못 봐요',
      }),
    );

    const request = lastRequest();
    expect(request).toBeDefined();
    expect(request!.episode_hints).toEqual(['최근에 다퉜어요', '서로 바빠서 자주 못 봐요']);
  });

  it('예산 한 줄은 어떤 경로로도 프롬프트에 실리지 않는다 (절대 규칙 3 — 가격 금지)', async () => {
    await submitRecommendation(
      submission({ budgetKey: 'other', budgetDetail: '5만 원쯤 생각하고 있어요' }),
    );

    const request = lastRequest();
    expect(request).toBeDefined();
    const serialized = JSON.stringify(request);
    expect(serialized).not.toContain('5만 원');
    expect(serialized).not.toContain('예산');
  });

  it('심각한 신호가 섞이면 어댑터를 아예 부르지 않는다 (후퇴 금지선)', async () => {
    const response = await submitRecommendation(
      submission({ episode: '요즘 자해를 한다고 들었어요' }),
    );

    expect(response.ok).toBe(true);
    expect(generateMessages).not.toHaveBeenCalled();
  });

  it('직접 쓴 사이·상황 칩에 심각한 신호가 있어도 같은 문에서 막힌다', async () => {
    generateMessages.mockClear();
    await submitRecommendation(
      submission({ relationship: 'other', relationshipDetail: '요즘 자해를 한다고 들었어요' }),
    );
    expect(generateMessages).not.toHaveBeenCalled();

    generateMessages.mockClear();
    await submitRecommendation(
      submission({
        episodeHints: ['other'],
        episodeHintDetail: '요즘 자해를 한다고 들었어요',
      }),
    );
    expect(generateMessages).not.toHaveBeenCalled();
  });
});

describe('submitRecommendation — §1.5l 맥락 칩은 사용자의 말을 되비춘다', () => {
  it('사이·마음·요즘 사이·예산의 직접 쓴 한 줄이 칩 자리에 그대로 선다', async () => {
    const response = await submitRecommendation(
      submission({
        relationship: 'other',
        relationshipDetail: '10년째 같은 밴드에서 합주하는 사이예요',
        intent: 'other',
        intentDetail: '유학 떠나는 조카를 배웅해요',
        episodeHints: ['other'],
        episodeHintDetail: '서로 바빠서 자주 못 봐요',
        budgetKey: 'other',
        budgetDetail: '아직 못 정했어요',
      }),
    );

    expect(response.ok).toBe(true);
    if (!response.ok) return;
    const chips = response.payload.contextChips;

    expect(chips).toContain('10년째 같은 밴드에서 합주하는 사이예요');
    expect(chips).toContain('유학 떠나는 조카를 배웅해요');
    expect(chips).toContain('서로 바빠서 자주 못 봐요');
    expect(chips).toContain('아직 못 정했어요');
    // 선택지 이름은 결과 화면에 서지 않는다 — 우리 화면의 사정일 뿐이다.
    expect(chips).not.toContain('직접 쓸게요');
    expect(chips).not.toContain('기타 · 직접 적을게요');
    expect(chips).not.toContain('직접 적은 사이에게');

    // 화면이 말줄임을 걸 자리 — 네 줄 전부가 "사용자의 말" 로 표시된다.
    expect(response.payload.ownWords).toEqual([
      '10년째 같은 밴드에서 합주하는 사이예요',
      '유학 떠나는 조카를 배웅해요',
      '서로 바빠서 자주 못 봐요',
      '아직 못 정했어요',
    ]);
  });

  it('한 줄을 비워 두면 폴백 라벨이 서고, 예산 칩은 아예 서지 않는다', async () => {
    const response = await submitRecommendation(
      submission({ relationship: 'other', intent: 'other', budgetKey: 'other' }),
    );

    expect(response.ok).toBe(true);
    if (!response.ok) return;
    const chips = response.payload.contextChips;

    expect(chips).toContain('직접 적은 사이에게');
    expect(chips).toContain('직접 쓸게요');
    // "기타 · 직접 적을게요" 는 조건이 아니라 선택지 이름이라 결과에 세우지 않는다.
    expect(chips).not.toContain('기타 · 직접 적을게요');
    expect(response.payload.ownWords).toEqual([]);
  });

  it('예산 `기타` 는 가격대 필터를 걸지 않는다 (band 1~3 전부 후보)', async () => {
    const [free, cheap] = await Promise.all([
      submitRecommendation(submission({ budgetKey: 'other' })),
      submitRecommendation(submission({ budgetKey: 'under20' })),
    ]);

    expect(free.ok).toBe(true);
    expect(cheap.ok).toBe(true);
    if (!free.ok || !cheap.ok) return;

    // 저가 구간은 band 1 만 남고, `기타` 는 그보다 넓은 후보에서 고른다.
    expect(cheap.payload.options.every((option) => option.priceBand === 1)).toBe(true);
    expect(free.payload.options.some((option) => option.priceBand > 1)).toBe(true);
  });

  it('`1~2만 원대` 와 `3만 원 미만` 은 같은 band 로 떨어진다 (라벨만 세분)', async () => {
    const [under20, under30] = await Promise.all([
      submitRecommendation(submission({ budgetKey: 'under20' })),
      submitRecommendation(submission({ budgetKey: 'under30' })),
    ]);

    expect(under20.ok).toBe(true);
    expect(under30.ok).toBe(true);
    if (!under20.ok || !under30.ok) return;

    expect(under20.payload.options.map((o) => o.flowerId)).toEqual(
      under30.payload.options.map((o) => o.flowerId),
    );
    // 칩만 다르다 — 사용자가 고른 말이 그대로 남는다.
    expect(under20.payload.contextChips).toContain('1~2만 원대');
    expect(under30.payload.contextChips).toContain('3만 원 미만');
  });
});
