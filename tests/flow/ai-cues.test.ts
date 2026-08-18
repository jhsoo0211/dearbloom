import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseSubmission, pinFirstPick, prepareResult } from '@/app/recommend/build-result';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';
import type { ExtractedCues } from '@/lib/llm/extract-contracts';
import type { WizardSubmission } from '@/components/flow/types';

/**
 * §1.5j AI 해석 층이 **엔진 입력의 제 자리로** 합류하는가 (2026-08-18).
 *
 * 여기서 확인하는 것은 LLM 이 아니라 **병합 규칙**이다. 모델 호출은 이 파일에 없고
 * (`tests/llm/extract.test.ts` 가 맡는다), 읽어 낸 값을 손으로 만들어 넘긴다 —
 * 그래야 "이 값이 들어오면 결과가 이렇게 바뀐다" 를 결정적으로 붙잡을 수 있다.
 *
 * 규칙 넷을 지킨다.
 *   ① 해석이 없으면(폴백) **지금까지와 한 글자도 다르지 않다** — 정적 데모가 사는 자리다.
 *   ② 분위기·색은 기존 추론과 같은 자리에서 합쳐지고, **직접 고른 칩이 앞**이다.
 *   ③ 반려동물·향은 **안전 쪽이 이긴다**(칩과 글 중 조심스러운 쪽).
 *   ④ 꽃 이름은 **한 소스**에서만 온다(AI 성공 시 AI, 폴백 시 사전).
 */

let catalog: Catalog;

beforeEach(async () => {
  catalog = await loadCatalog();
  // 이 파일은 네트워크를 쓸 일이 없다 — 나가면 그 자체가 버그다.
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
    dateISO: '2026-08-18',
    ...overrides,
  };
}

/** 아무것도 못 읽은 해석 — "모델이 답은 했는데 읽을 것이 없었다" 이다(`null` 과 다르다). */
const NOTHING_READ: ExtractedCues = {
  recipientTraits: [],
  colorPrefs: [],
  personalCues: [],
  mentionedFlowerIds: [],
  pets: [],
  fragranceSensitive: false,
};

function draftOf(sub: WizardSubmission, extracted?: ExtractedCues | null) {
  const parsed = parseSubmission(sub);
  expect(parsed.ok, '제출이 모양 검사를 통과하지 못했다').toBe(true);
  if (!parsed.ok) throw new Error('unreachable');

  const prepared = prepareResult(parsed.answers, catalog, extracted);
  expect(prepared.ok, '결과를 만들지 못했다').toBe(true);
  if (!prepared.ok) throw new Error('unreachable');

  return prepared.draft;
}

function pickIds(sub: WizardSubmission, extracted?: ExtractedCues | null): string[] {
  return draftOf(sub, extracted).options.map((option) => option.flowerId);
}

/* ------------------------------------------------------------------ *
 * ① 폴백 — 해석이 없으면 지금까지와 같다
 * ------------------------------------------------------------------ */

describe('해석이 없으면 기존 로컬 사전 경로 그대로다', () => {
  /**
   * 정적 데모(`src/lib/demo/recommend-actions.ts`)는 이 함수를 **두 인자로** 부른다.
   * 브라우저에는 키를 둘 수 없으니 데모는 언제나 이 자리이고, 그것이 곧
   * "API 다 쓰면 로컬 폴백" 의 데모판이다 — 이 테스트가 그 쌍둥이를 지킨다.
   */
  it('세 번째 인자를 생략한 결과와 null 을 넘긴 결과가 같다', () => {
    const sub = submission({ recipientNote: '조용하고 차분한 사람이에요.' });

    expect(draftOf(sub)).toEqual(draftOf(sub, null));
  });

  it('사전이 읽어 낸 것은 해석이 없어도 그대로 선다', () => {
    const draft = draftOf(submission({ recipientNote: '조용한 사람이에요. 흰색을 좋아해요.' }));

    expect(draft.storyCues).toContain('차분한 분위기');
    expect(draft.storyCues).toContain('흰색');
  });
});

/* ------------------------------------------------------------------ *
 * ② 분위기·색 — 같은 자리에서 합쳐진다
 * ------------------------------------------------------------------ */

describe('AI 가 읽어 낸 분위기·색이 추천을 바꾼다', () => {
  /**
   * 브리프의 실측 사례 — "파도 소리를 좋아하는 사람이에요".
   *
   * `infer.ts` 의 사전은 **형용사**를 읽으므로 이 문장에서 아무것도 못 읽는다(칩이 빈다).
   * AI 는 같은 문장을 `calm` · `blue` · `white` 로 옮기고, 그 값이 A 항을 지나 3안의
   * 순서를 바꾼다. 이 테스트가 이 기능이 실제로 무언가를 한다는 증거다.
   */
  const WAVE_NOTE = '파도 소리를 좋아하는 사람이에요.';

  const WAVE_READING: ExtractedCues = {
    ...NOTHING_READ,
    recipientTraits: ['calm'],
    colorPrefs: ['blue', 'white'],
    personalCues: ['파도'],
  };

  it('사전은 이 문장에서 분위기·색을 못 읽는다', () => {
    expect(draftOf(submission({ recipientNote: WAVE_NOTE })).storyCues).toEqual([]);
  });

  it('AI 가 읽으면 3안이 달라진다', () => {
    const sub = submission({ recipientNote: WAVE_NOTE });

    const local = pickIds(sub);
    const withAi = pickIds(sub, WAVE_READING);

    expect(withAi).not.toEqual(local);
  });

  it('읽어 낸 것이 단서 칩으로 화면에 선다', () => {
    const draft = draftOf(submission({ recipientNote: WAVE_NOTE }), WAVE_READING);

    expect(draft.storyCues).toContain('차분한 분위기');
    expect(draft.storyCues).toContain('푸른색');
    expect(draft.storyCues).toContain('흰색');
  });

  /**
   * 사전과 AI 가 같은 것을 읽으면 칩이 둘로 늘지 않는다 — 사용자에게는 한 번 읽은 것이다.
   */
  it('사전과 AI 가 같은 것을 읽어도 칩은 한 번만 선다', () => {
    const draft = draftOf(submission({ recipientNote: '조용한 사람이에요.' }), {
      ...NOTHING_READ,
      recipientTraits: ['calm'],
    });

    expect(draft.storyCues.filter((chip) => chip === '차분한 분위기')).toHaveLength(1);
  });

  /**
   * 직접 고른 칩이 언제나 앞이다. 순서가 뒤집히면 A 항의 가중치가 사용자가 명시한 취향보다
   * 우리가 읽어 낸 짐작을 먼저 세우게 된다.
   */
  it('직접 고른 색이 AI 가 읽은 색보다 앞에 선다', () => {
    const draft = draftOf(
      submission({ colorPrefs: ['red'], recipientNote: '파란 바다를 좋아해요.' }),
      { ...NOTHING_READ, colorPrefs: ['blue'] },
    );

    const chips = draft.contextChips;
    expect(chips).toContain('빨강 선호');
    // 맥락 칩은 사용자가 고른 것만 세운다 — AI 가 읽은 색은 단서 칩 쪽이다.
    expect(draft.storyCues).toContain('푸른색');
  });
});

/* ------------------------------------------------------------------ *
 * ③ 안전 — 조심스러운 쪽이 이긴다
 * ------------------------------------------------------------------ */

describe('반려동물·향 신호는 안전 쪽이 이긴다', () => {
  /**
   * 실측으로 고른 자리(2026-08-18): 배우자 × 축하 는 해석이 없으면 고양이에게 독성이 있는
   * 꽃 둘(은방울꽃 · 매화)이 3안에 선다. AI 가 "고양이와 함께 산다" 를 읽어 내면 그 둘이
   * 안전 제외(EX_PET_TOXIC)로 빠지고 자리가 바뀐다.
   *
   * ⚠ 자유 서술을 **일부러 비워 둔다.** 이 테스트가 보는 것은 `prepareResult` 의 병합
   *   규칙이고, 해석 결과는 손으로 넘긴다(모델을 부르는 자리는 아래 `readStoryCues` 와
   *   `tests/llm/extract.test.ts` 가 본다). 여기에 "고양이와 살아요" 를 적으면 엔진의
   *   `CUE_LEXICON` 이 그 낱말을 먼저 읽어(`고양이` → cute) 순위가 움직이고, 그러면
   *   이 테스트가 재는 것이 병합인지 사전인지 알 수 없게 된다.
   */
  const SPOUSE_CELEBRATION = submission({
    relationship: 'spouse',
    intent: 'celebration',
  });

  function catToxicIds(): Set<string> {
    return new Set(
      catalog.flowers
        .filter((flower) => flower.petSafety.some((p) => p.species === 'cat' && p.toxic))
        .map((flower) => flower.id),
    );
  }

  it('해석이 없으면 고양이 독성 꽃이 3안에 설 수 있다 (이 테스트의 전제)', () => {
    const toxic = catToxicIds();
    const ids = pickIds(SPOUSE_CELEBRATION);

    expect(
      ids.some((id) => toxic.has(id)),
      '전제가 깨졌다 — 이 조합에서 더는 독성 꽃이 3안에 서지 않는다. 조합을 다시 골라라.',
    ).toBe(true);
  });

  it('AI 가 읽은 반려묘가 독성 꽃을 3안에서 뺀다', () => {
    const toxic = catToxicIds();
    const ids = pickIds(SPOUSE_CELEBRATION, { ...NOTHING_READ, pets: ['cat'] });

    for (const id of ids) expect(toxic.has(id), `${id} 은(는) 고양이에게 독성이다`).toBe(false);
  });

  /**
   * 칩과 글이 서로 다른 동물을 가리키면 **둘 다** 다룬다. 칩을 눌렀다는 이유로 글에서
   * 읽은 신호를 덮어쓰거나, 그 반대로 하는 것은 어느 쪽이든 안전을 깎는다.
   */
  it('칩의 반려동물과 AI 가 읽은 반려동물은 합집합이다', () => {
    const dogToxic = new Set(
      catalog.flowers
        .filter((flower) => flower.petSafety.some((p) => p.species === 'dog' && p.toxic))
        .map((flower) => flower.id),
    );
    const catToxic = catToxicIds();

    const ids = pickIds(
      submission({
        relationship: 'spouse',
        intent: 'celebration',
        recipientChips: ['dog-home'],
        recipientNote: '고양이도 함께 살아요.',
      }),
      { ...NOTHING_READ, pets: ['cat'] },
    );

    for (const id of ids) {
      expect(catToxic.has(id), `${id} 은(는) 고양이에게 독성이다`).toBe(false);
      expect(dogToxic.has(id), `${id} 은(는) 강아지에게 독성이다`).toBe(false);
    }
  });

  /**
   * 향 선호 칩을 눌러 두었어도 글에서 민감 신호를 읽으면 민감이 이긴다.
   * `splitRecipientChips` 는 칩끼리만 그 판단을 하므로(글을 볼 수 없다) 병합 자리에서
   * 한 번 더 눌러 준다 — 안 누르면 향 선호 가점과 향 제외가 동시에 걸린다.
   */
  it('AI 가 읽은 향 민감이 향 선호 칩을 이긴다', () => {
    const sub = submission({
      recipientChips: ['loves-fragrance'],
      recipientNote: '향이 강하면 두통이 있어요.',
    });

    const withoutAi = pickIds(sub);
    const withAi = pickIds(sub, { ...NOTHING_READ, fragranceSensitive: true });

    expect(withAi).not.toEqual(withoutAi);
    // 향이 센 꽃(fragranceLevel >= 2)은 하나도 남지 않는다 — EX_FRAGRANCE 가 돌았다는 뜻.
    const strong = new Set(
      catalog.flowers.filter((flower) => flower.fragranceLevel >= 2).map((flower) => flower.id),
    );
    for (const id of withAi) expect(strong.has(id), `${id} 은(는) 향이 센 꽃이다`).toBe(false);
  });

  it('AI 가 아무 신호도 안 읽으면 칩의 안전 신호는 그대로 산다', () => {
    const catToxic = catToxicIds();
    const ids = pickIds(
      submission({ relationship: 'spouse', intent: 'celebration', recipientChips: ['cat-home'] }),
      NOTHING_READ,
    );

    for (const id of ids) expect(catToxic.has(id)).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * ④ 꽃 이름 — 한 소스에서만 온다
 * ------------------------------------------------------------------ */

describe('언급된 꽃은 사전 ∪ AI 다', () => {
  /**
   * 이 값은 두 곳이 함께 읽는다 — 단서 칩(`…의 기억`)과 §1.5d `적어 주신 꽃` 한 줄.
   * 한때 "한 소스만"(AI 성공 시 AI) 이었으나 그건 정밀도를 잘못 본 규칙이었다:
   * 사전은 문자 그대로의 이름 매칭이라 오탐이 없고, AI 가 놓친 것은 중의성이 아니라
   * 그냥 누락이다. 합집합이면 **놓친 이름이 없어져** 두 자리가 같은 목록을 본다.
   */
  const TULIP_EPISODE = submission({ episode: '튤립을 참 좋아했어요.' });

  it('폴백이면 사전이 읽은 꽃이 선다', () => {
    const draft = draftOf(TULIP_EPISODE);

    expect(draft.storyCues).toContain('튤립의 기억');
    expect(draft.mentionedNote?.flowers.map((f) => f.id)).toContain('tulip-white');
  });

  it('AI 가 다른 꽃을 더 읽어 내면 둘 다 선다', () => {
    const draft = draftOf(TULIP_EPISODE, { ...NOTHING_READ, mentionedFlowerIds: ['rose-red'] });

    expect(draft.storyCues).toContain('튤립의 기억');
    expect(draft.storyCues).toContain('장미의 기억');
  });

  /**
   * **이 테스트가 합집합으로 바꾼 이유 그 자체다.** 사용자가 분명히 "튤립" 이라고 적었는데
   * AI 가 그 칸을 비워 돌려주는 일은 있을 수 있다(누락). 그때 사전 결과를 버리면 사용자가
   * 직접 부른 이름이 조용히 사라지고, 그 꽃의 이름 가점과 §1.5d 한 줄을 함께 잃는다.
   */
  it('AI 가 꽃을 못 읽어도 사전이 읽은 이름은 살아남는다', () => {
    const draft = draftOf(TULIP_EPISODE, NOTHING_READ);

    expect(draft.storyCues).toContain('튤립의 기억');
    expect(draft.mentionedNote?.flowers.map((f) => f.id)).toContain('tulip-white');
  });

  it('둘이 같은 꽃을 읽으면 한 번만 선다', () => {
    const draft = draftOf(TULIP_EPISODE, {
      ...NOTHING_READ,
      mentionedFlowerIds: ['tulip-white'],
    });

    expect(draft.storyCues.filter((chip) => chip === '튤립의 기억')).toHaveLength(1);
  });

  /** 카탈로그에 없는 id 는 화면까지 오지 못한다(§1.5d 링크가 갈 곳이 없어진다). */
  it('AI 가 실재하지 않는 꽃 id 를 주면 한 줄에 서지 않는다', () => {
    const draft = draftOf(submission({ episode: '이름 없는 꽃을 좋아했어요.' }), {
      ...NOTHING_READ,
      // 계약을 통과한 값이라도 카탈로그 대조가 마지막 문이다.
      mentionedFlowerIds: ['rose-red'],
    });

    const ids = draft.mentionedNote?.flowers.map((f) => f.id) ?? [];
    for (const id of ids) expect(catalog.flowers.some((f) => f.id === id)).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * ⑤ 읽어 낸 안전 신호를 화면이 말한다
 * ------------------------------------------------------------------ */

describe('AI 가 읽은 안전 신호는 실제로 뺐을 때만 칩이 된다', () => {
  /** 이 조합은 고양이 독성 꽃이 3안에 서는 자리다(위 ③ 의 전제와 같다). */
  const SPOUSE_CELEBRATION = submission({ relationship: 'spouse', intent: 'celebration' });

  it('AI 가 읽은 반려묘로 후보가 줄면 그 사실을 칩으로 말한다', () => {
    const draft = draftOf(SPOUSE_CELEBRATION, { ...NOTHING_READ, pets: ['cat'] });

    expect(draft.readChips).toEqual(['반려묘와 살아요 · 이야기에서 읽었어요']);
    // 맥락 칩 줄에도 실제로 서 있어야 화면이 그릴 수 있다.
    expect(draft.contextChips).toContain('반려묘와 살아요 · 이야기에서 읽었어요');
  });

  /**
   * 이 규칙이 이 기능의 요점이다 — 읽기는 했지만 **그 신호가 아무 꽃도 빼지 않았다면**
   * 칩을 세우지 않는다. 세우면 일어나지 않은 일을 알리는 칩이 되고, "우리가 네 글에서
   * 반려동물을 찾아냈다"는 사실만 자랑하는 꼴이 된다.
   *
   * 자리를 고른 근거(2026-08-18 실측): 카탈로그에서 **강아지에게 심각한 꽃은 전부 고양이
   * 에게도 심각하다**(dog 11종 ⊂ cat 12종). 그래서 사용자가 이미 `반려묘와 살아요` 를
   * 골라 둔 상태에서 AI 가 강아지를 더 읽어 내면, 그 신호로 새로 빠지는 꽃이 하나도 없다.
   */
  it('읽었지만 그 신호로 빠진 꽃이 없으면 칩을 세우지 않는다', () => {
    const severe = (species: 'cat' | 'dog') =>
      new Set(
        catalog.flowers
          .filter((flower) =>
            flower.petSafety.some(
              (entry) =>
                entry.species === species &&
                entry.toxic &&
                (entry.severity === 'serious' || entry.severity === 'life_threatening'),
            ),
          )
          .map((flower) => flower.id),
      );

    const cat = severe('cat');
    const dogOnly = [...severe('dog')].filter((id) => !cat.has(id));
    // 전제가 깨지면(강아지에게만 심각한 꽃이 생기면) 이 자리는 더 이상 무해하지 않다.
    expect(dogOnly, '전제가 깨졌다 — 자리를 다시 골라라').toEqual([]);

    const draft = draftOf(
      submission({ relationship: 'spouse', intent: 'celebration', recipientChips: ['cat-home'] }),
      { ...NOTHING_READ, pets: ['cat', 'dog'] },
    );

    expect(draft.readChips).toEqual([]);
  });

  /**
   * 사용자가 칩으로 직접 고른 신호는 이미 맥락 칩에 그 라벨이 서 있다 — 같은 사실을
   * 두 번 말하지 않는다.
   */
  it('사용자가 칩으로 고른 신호는 "읽었어요" 칩이 되지 않는다', () => {
    const draft = draftOf(
      submission({ relationship: 'spouse', intent: 'celebration', recipientChips: ['cat-home'] }),
      { ...NOTHING_READ, pets: ['cat'] },
    );

    expect(draft.readChips).toEqual([]);
    expect(draft.contextChips).toContain('반려묘와 살아요');
  });

  it('향 민감도 같은 규칙으로 선다', () => {
    const draft = draftOf(submission({ recipientNote: '향이 강하면 두통이 있어요.' }), {
      ...NOTHING_READ,
      fragranceSensitive: true,
    });

    expect(draft.readChips).toEqual(['향에 민감해요 · 이야기에서 읽었어요']);
  });

  it('해석이 없으면 이 칩은 아예 없다', () => {
    expect(draftOf(SPOUSE_CELEBRATION).readChips).toEqual([]);
    expect(draftOf(SPOUSE_CELEBRATION, null).readChips).toEqual([]);
  });

  /** 원문 되비춤 금지 — 신호의 종류만 말한다(§1.5j). */
  it('칩에 자유 서술 원문이 섞이지 않는다', () => {
    const SECRET = '아무도모르는우리이야기';
    const draft = draftOf(
      submission({ relationship: 'spouse', intent: 'celebration', recipientNote: SECRET }),
      { ...NOTHING_READ, pets: ['cat'] },
    );

    for (const chip of draft.readChips) expect(chip).not.toContain(SECRET);
  });
});

/* ------------------------------------------------------------------ *
 * ⑥ 멘트만 다시 받기 — 화면의 첫 안을 넘겨받는다
 * ------------------------------------------------------------------ */

describe('pinFirstPick — 멘트가 화면에 서 있는 꽃을 이야기한다', () => {
  const SUB = submission({ recipientNote: '조용한 사람이에요.' });

  it('화면이 보낸 첫 안으로 되돌린다', () => {
    const draft = draftOf(SUB);
    const other = catalog.flowers.find((f) => f.id !== draft.firstPick.flower.id);
    expect(other).toBeDefined();
    if (!other) return;

    const pinned = pinFirstPick(draft, catalog, [other.id]);
    expect(pinned.firstPick.flower.id).toBe(other.id);
    expect(pinned.firstPick.flower.nameKo).toBe(other.nameKo);
  });

  /**
   * 이번 계산에도 그 꽃이 있으면 **그 안을 통째로** 쓴다 — 색 제안까지 살아 있어야
   * 멘트가 화면과 같은 색의 꽃말을 인용한다.
   */
  it('이번 3안 안에 있는 꽃이면 색 제안까지 살아 있는 안을 쓴다', () => {
    const draft = draftOf(SUB);
    const second = draft.picks[1];
    expect(second).toBeDefined();
    if (!second) return;

    const pinned = pinFirstPick(draft, catalog, [second.flower.id]);
    expect(pinned.firstPick).toBe(second);
  });

  /**
   * 이 값은 공개 엔드포인트로 들어온 남의 문자열일 수 있다. 어긋나면 **조용히** 지금
   * 계산한 첫 안을 쓴다 — 멘트의 힌트일 뿐 결과의 전제가 아니라 거절할 자리가 아니다.
   */
  it('모양이 어긋난 값은 조용히 무시한다', () => {
    const draft = draftOf(SUB);
    const original = draft.firstPick.flower.id;

    for (const bad of [
      undefined,
      null,
      'rose-red',
      42,
      [42],
      [{ id: 'rose-red' }],
      ['가'.repeat(500)],
      new Array(200).fill('rose-red'),
    ]) {
      expect(pinFirstPick(draft, catalog, bad).firstPick.flower.id).toBe(original);
    }
  });

  it('카탈로그에 없는 id 는 무시한다', () => {
    const draft = draftOf(SUB);
    const original = draft.firstPick.flower.id;

    expect(pinFirstPick(draft, catalog, ['no-such-flower']).firstPick.flower.id).toBe(original);
  });

  it('첫째가 모르는 꽃이면 그다음으로 아는 꽃을 쓴다', () => {
    const draft = draftOf(SUB);
    const other = catalog.flowers.find((f) => f.id !== draft.firstPick.flower.id);
    if (!other) return;

    const pinned = pinFirstPick(draft, catalog, ['no-such-flower', other.id]);
    expect(pinned.firstPick.flower.id).toBe(other.id);
  });
});

/* ------------------------------------------------------------------ *
 * 호출 자리 — 적어 준 글이 없으면 부르지 않는다
 * ------------------------------------------------------------------ */

describe('readStoryCues — 지연 0 의 약속', () => {
  it('자유 서술이 둘 다 비면 네트워크로 나가지 않고 null 이다', async () => {
    const { readStoryCues } = await import('@/app/recommend/extract-cues');
    const parsed = parseSubmission(submission());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    // 위 beforeEach 의 fetch 는 부르는 즉시 던진다 — null 이 왔다면 나가지 않은 것이다.
    await expect(readStoryCues(parsed.answers)).resolves.toBeNull();
  });

  /**
   * 해석은 있으면 좋은 것이지 결과의 전제가 아니다. 어떤 이유로든 실패하면 조용히
   * 사전 경로로 내려간다 — 던지면 결과 화면 전체가 실패 문장으로 바뀐다.
   */
  it('적어 준 글이 있어도(키가 없으면) 던지지 않고 null 이다', async () => {
    const { readStoryCues } = await import('@/app/recommend/extract-cues');
    const parsed = parseSubmission(submission({ recipientNote: '조용한 사람이에요.' }));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    await expect(readStoryCues(parsed.answers)).resolves.toBeNull();
  });
});
