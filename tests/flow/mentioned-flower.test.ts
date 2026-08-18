import { describe, expect, it } from 'vitest';

import { parseSubmission, prepareResult } from '@/app/recommend/build-result';
import { loadCatalog } from '@/lib/data/catalog';
import { FLOWER_CUE_PREFIX, inferCuesFromTexts, mentionedFlowerIds } from '@/lib/engine';
import type { WizardSubmission } from '@/components/flow/types';

/**
 * §1.5d **적어 주신 꽃 한 줄** — 점수를 비틀지 않고 화면이 이유를 말하는 자리.
 *
 * 실측된 한계에서 나온 기능이다: 규칙이 촘촘한 자리(고백 × 연인)에서는 에피소드에 꽃
 * 이름을 직접 적어도 I·R 가점이 그 이름을 이겨 3안에 못 든다. 그때 점수를 손대는 대신
 * 화면이 "살펴봤지만 셋에 세우진 않았다"고 말하기로 했다.
 *
 * 세 갈래를 여기서 못박는다.
 *   ① 3안 **안** → 아무것도 붙지 않는다.
 *   ② **제외**됨(반려동물 등) → 붙지 않는다. 그 사정은 제외 쪽의 말이다.
 *   ③ 3안 **밖** + 제외도 아님 → 한 줄이 선다.
 *
 * 그리고 이 줄에는 **꽃 이름만** 실린다(에피소드 원문 되비추기 금지 — §1.5j).
 */

function submission(overrides: Partial<WizardSubmission> = {}): WizardSubmission {
  return {
    relationship: 'lover',
    relationshipDetail: '',
    intent: 'confession',
    intentDetail: '',
    recipientChips: [],
    colorPrefs: [],
    recipientNote: '',
    episode: '',
    episodeHints: [],
    episodeHintDetail: '',
    budgetKey: '',
    budgetDetail: '',
    dateISO: '2026-08-19',
    ...overrides,
  };
}

async function draftFor(overrides: Partial<WizardSubmission> = {}) {
  const catalog = await loadCatalog();
  const received = parseSubmission(submission(overrides));
  if (!received.ok) throw new Error(received.message);
  const prepared = prepareResult(received.answers, catalog);
  if (!prepared.ok) throw new Error(prepared.message);
  return prepared.draft;
}

describe('mentionedFlowerIds — 엔진이 여는 최소 한 줄', () => {
  /*
   * 이름 읽기는 **두 걸음**이다. `infer.ts` 가 자유 글에서 꽃 이름을 찾아
   * `flower:<slug>` 단서로 바꾸고(`inferCuesFromTexts`), `readCues` 는 그 단서만 읽는다.
   * `mentionedFlowerIds` 는 뒷걸음의 판정을 그대로 여는 얇은 창이라, 원문을 통째로
   * 넘기면 아무것도 나오지 않는 것이 **정상**이다 — 사전을 두 벌로 만들지 않기 위해서다.
   * 실제 호출부(`prepareResult`)는 두 걸음을 이미 이어 두었고, 그 이음매는 아래
   * `세 갈래` 묶음이 실데이터로 지킨다.
   */
  it('이미 해석된 `flower:` 단서를 읽는다', async () => {
    const catalog = await loadCatalog();
    expect(mentionedFlowerIds([`${FLOWER_CUE_PREFIX}lavender`], catalog.flowers)).toEqual([
      'lavender',
    ]);
  });

  it('자유 글이 `flower:` 로 바뀌는 앞걸음까지 이으면 이름이 읽힌다', async () => {
    const catalog = await loadCatalog();
    const inferred = inferCuesFromTexts(['작년에 라벤더를 함께 심었어요']);
    expect(mentionedFlowerIds(inferred.personalCues, catalog.flowers)).toEqual(['lavender']);
  });

  it('원문만 넘기면 아무것도 읽지 않는다 — 사전은 앞걸음 한 벌뿐이다', async () => {
    const catalog = await loadCatalog();
    expect(mentionedFlowerIds(['작년에 라벤더를 함께 심었어요'], catalog.flowers)).toEqual([]);
  });

  it('카탈로그에 없는 꽃은 돌려주지 않는다 — 갈 곳 없는 링크를 만들지 않는다', () => {
    expect(mentionedFlowerIds([`${FLOWER_CUE_PREFIX}lavender`], [{ id: 'freesia' }])).toEqual([]);
  });

  it('단서가 없으면 빈 배열이다(억측하지 않는다)', async () => {
    const catalog = await loadCatalog();
    expect(mentionedFlowerIds(['그냥 고마운 마음이에요'], catalog.flowers)).toEqual([]);
    expect(mentionedFlowerIds(undefined, catalog.flowers)).toEqual([]);
  });

  it('원문 조각은 반환값에 담기지 않는다 (§1.5j)', async () => {
    const catalog = await loadCatalog();
    const secret = '작년 봄에 라벤더를 함께 심었어요';
    const ids = mentionedFlowerIds(inferCuesFromTexts([secret]).personalCues, catalog.flowers);
    expect(JSON.stringify(ids)).not.toContain('작년');
  });
});

describe('적어 주신 꽃 한 줄 — 세 갈래', () => {
  it('③ 3안 밖이고 제외도 아니면 한 줄이 선다', async () => {
    // 고백 × 연인 — 규칙이 가장 촘촘한 자리(이 기능이 생긴 이유의 그 조합).
    const draft = await draftFor({ episode: '작년에 라벤더 밭에 함께 갔어요.' });
    const shown = draft.options.map((option) => option.flowerId);

    expect(shown, '전제가 깨졌다면 실측이 바뀐 것이다').not.toContain('lavender');
    expect(draft.mentionedNote).toBeDefined();
    expect(draft.mentionedNote?.flowers.map((flower) => flower.id)).toEqual(['lavender']);
  });

  it('① 언급한 꽃이 3안에 있으면 아무것도 붙지 않는다', async () => {
    const draft = await draftFor({ episode: '작년에 라벤더 밭에 함께 갔어요.' });
    const inTop = draft.options[0].flowerId;

    // 3안에 실제로 든 꽃의 이름을 적어 본다 — 그 꽃은 이미 화면에 서 있다.
    const catalog = await loadCatalog();
    const nameKo = catalog.flowers.find((flower) => flower.id === inTop)!.nameKo;
    const again = await draftFor({ episode: `${nameKo}를 좋아해요.` });

    const mentioned = again.mentionedNote?.flowers.map((flower) => flower.id) ?? [];
    for (const id of again.options.map((option) => option.flowerId)) {
      expect(mentioned, id).not.toContain(id);
    }
  });

  it('② 제외된 꽃은 붙지 않는다 — 제외 사유가 이미 그 자리를 갖는다', async () => {
    // 백합은 고양이에게 심각한 독성이라 EX_PET_TOXIC 으로 후보에서 빠진다.
    const draft = await draftFor({
      recipientChips: ['cat-home'],
      episode: '백합을 좋아하는 사람이에요.',
    });

    expect(draft.options.map((option) => option.flowerId)).not.toContain('lily-asiatic');
    expect(draft.mentionedNote?.flowers.map((flower) => flower.id) ?? []).not.toContain(
      'lily-asiatic',
    );
  });

  it('아무 꽃도 적지 않았으면 필드 자체가 없다', async () => {
    const draft = await draftFor({ episode: '요즘 부쩍 지쳐 보여요.' });
    expect(draft.mentionedNote).toBeUndefined();
  });
});

describe('적어 주신 꽃 한 줄 — 문구', () => {
  it('꽃 이름과 도감 slug 만 담는다 (에피소드 원문 금지)', async () => {
    const secret = '작년 봄에 라벤더 밭에서 프러포즈했어요';
    const draft = await draftFor({ episode: secret });
    expect(draft.mentionedNote).toBeDefined();

    const dump = JSON.stringify(draft.mentionedNote);
    expect(dump).not.toContain('프러포즈');
    expect(dump).not.toContain('작년');
    expect(dump).not.toContain('밭에서');
  });

  it('변명조·기계조를 쓰지 않는다 (§1.5d)', async () => {
    const draft = await draftFor({ episode: '작년에 라벤더 밭에 함께 갔어요.' });
    const line = `${draft.mentionedNote?.lead ?? ''}${draft.mentionedNote?.tail ?? ''}`;

    expect(line).not.toMatch(/죄송|아쉽|미안|유감/);
    expect(line).not.toMatch(/조건|부합|점수|알고리즘|매칭|해당하지/);
    // 해요체로 끝난다 — 결과 화면의 다른 문장들과 같은 결이다.
    expect(line.trim().endsWith('요.')).toBe(true);
  });

  it('도감 slug 는 실재하는 꽃이다 — 링크가 갈 곳이 있다', async () => {
    const catalog = await loadCatalog();
    const draft = await draftFor({ episode: '작년에 라벤더 밭에 함께 갔어요.' });
    for (const flower of draft.mentionedNote?.flowers ?? []) {
      expect(catalog.flowers.some((row) => row.id === flower.id), flower.id).toBe(true);
      expect(flower.nameKo).not.toBe('');
    }
  });
});
