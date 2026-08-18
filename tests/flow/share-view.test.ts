import { describe, expect, it } from 'vitest';

import {
  SHARE_UNREADABLE,
  buildShareView,
  parseSubmission,
  prepareResult,
} from '@/app/recommend/build-result';
import { encodeSharePlan } from '@/components/flow/share-link';
import { loadCatalog } from '@/lib/data/catalog';
import type { WizardSubmission } from '@/components/flow/types';

/**
 * 공유 화면 `/r` 이 부호 하나로 세우는 값.
 *
 * 이 함수는 **서버 액션과 정적 데모가 함께 쓰는 한 벌**이다(쌍둥이 규칙). 그래서 여기서
 * 지키는 것은 "카탈로그만 있으면 어디서든 같은 화면이 나온다" 이고, 부호가 남의 손을
 * 탄 값이라는 사실은 `share-link.test.ts` 와 여기가 나눠 지킨다 —
 * 저쪽이 **어휘**를, 이쪽이 **실재**를 본다.
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

async function realShareCode(overrides: Partial<WizardSubmission> = {}) {
  const catalog = await loadCatalog();
  const received = parseSubmission(submission(overrides));
  if (!received.ok) throw new Error('unreachable');
  const prepared = prepareResult(received.answers, catalog);
  if (!prepared.ok) throw new Error('unreachable');
  return { code: prepared.draft.shareCode, draft: prepared.draft, catalog };
}

describe('buildShareView — 건네받은 결과', () => {
  it('결과 화면이 만든 부호를 그대로 연다 (같은 꽃, 같은 차례)', async () => {
    const { code, draft, catalog } = await realShareCode();
    const view = buildShareView(code, catalog);

    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(view.payload.flowers.map((flower) => flower.flowerId)).toEqual(
      draft.options.map((option) => option.flowerId),
    );
  });

  it('관계·마음·날짜가 칩으로 선다', async () => {
    const { code, catalog } = await realShareCode();
    const view = buildShareView(code, catalog);
    if (!view.ok) throw new Error('unreachable');

    expect(view.payload.chips[0]).toBe('연인에게');
    expect(view.payload.chips[1]).toBe('고백');
    expect(view.payload.chips.some((chip) => chip.includes('8월 19일'))).toBe(true);
  });

  it("`직접 쓸게요` 는 폴백 라벨로 선다 — 적어 준 한 줄은 링크에 없다", async () => {
    const catalog = await loadCatalog();
    const code = encodeSharePlan({
      flowerIds: ['freesia'],
      relationship: 'other',
      intent: 'other',
    });
    const view = buildShareView(code, catalog);
    if (!view.ok) throw new Error('unreachable');

    expect(view.payload.chips).toEqual(['직접 적은 사이에게', '직접 쓸게요']);
  });

  it('꽃마다 사진·꽃말·이야기 훅이 붙는다(있는 것만)', async () => {
    const { code, catalog } = await realShareCode();
    const view = buildShareView(code, catalog);
    if (!view.ok) throw new Error('unreachable');

    for (const flower of view.payload.flowers) {
      expect(flower.nameKo, flower.flowerId).not.toBe('');
      expect(flower.scientificName, flower.flowerId).not.toBe('');
      // 도감 전종이 대표 실사를 갖는다(`tests/flow/result.test.ts` 의 #14 와 같은 사실).
      expect(flower.photo, flower.flowerId).toBeDefined();
      expect(flower.photo?.src, flower.flowerId).toContain('w=1080');
      // 없는 값을 지어내지 않는다 — 있으면 문자열, 없으면 필드 자체가 없다.
      if (flower.meaningKo !== undefined) expect(flower.meaningKo).not.toBe('');
      if (flower.storyLine !== undefined) expect(flower.storyLine).not.toBe('');
    }
  });

  it('읽을 수 없는 부호는 안내 문장으로 답한다 — 던지지 않는다', async () => {
    const catalog = await loadCatalog();
    const view = buildShareView('조작된부호', catalog);
    expect(view.ok).toBe(false);
    if (view.ok) return;
    expect(view.message).toBe(SHARE_UNREADABLE);
  });

  it('도감에 없는 꽃을 가리키면 반쪽을 보여 주지 않는다', async () => {
    const catalog = await loadCatalog();
    const code = encodeSharePlan({
      flowerIds: ['freesia', 'no-such-flower'],
      relationship: 'friend',
      intent: 'gratitude',
    });
    const view = buildShareView(code, catalog);
    expect(view.ok).toBe(false);
    if (view.ok) return;
    expect(view.message).toContain('도감에서 찾지 못했어요');
  });

  it('공유 화면 값에는 자유 서술도 멘트도 들어 있지 않다', async () => {
    const secret = '작년 봄에 함께 수목원에 다녀왔어요';
    const { code, catalog } = await realShareCode({
      recipientNote: '조용한 사람이에요',
      episode: secret,
    });
    const view = buildShareView(code, catalog);
    if (!view.ok) throw new Error('unreachable');

    const dump = JSON.stringify(view.payload);
    expect(dump).not.toContain(secret);
    expect(dump).not.toContain('조용한 사람이에요');
    expect(dump).not.toContain('tones');
  });
});
