import { describe, expect, it } from 'vitest';

import {
  CARD_LINE_NOTES,
  PRICE_BAND_NOTES,
  PRICE_BAND_SLOTS,
  PRICE_LABELS,
  firstSentence,
  interleaveByAuthor,
  literatureLanguage,
  orderLiterature,
  type LiteratureCandidate,
} from '@/components/flow/labels';
import { loadCatalog } from '@/lib/data/catalog';
import { INTENTS } from '@/lib/engine';
import type { Intent } from '@/lib/engine';
import { FLOWER_PHOTOS, needsDarkOverlay, photoFor, photoSrc } from '@/lib/photos';

/**
 * 결과 화면 마감(2026-08-15)의 **판단 규칙**을 지키는 그물.
 *
 * 여기 있는 것은 전부 화면이 아니라 그 앞의 결정이다 — 어느 발췌를 앞에 세울지(#1),
 * 톤마다 어떤 한 줄을 실을지(#13), 가격 구간을 어떻게 말할지(#11), 어떤 사진을 걸지(#14).
 * 화면은 눈으로 볼 수 있지만 이 결정들은 조합이 많아(꽃 32종 × 상황 8종) 볼 수가 없다.
 *
 * ⚠ 서버 액션(`actions.ts`)은 `'use server'` 라 순수 함수를 내보낼 수 없다. 그래서 규칙은
 *   `labels.ts` 에 살고, 액션은 그것을 부르기만 한다 — 이 테스트가 그 배치의 이유다.
 */

/** 그 꽃에 붙은 문학 발췌(= flowerId 와 excerptType 이 둘 다 있는 행). */
async function literatureByFlower() {
  const catalog = await loadCatalog();
  const byFlower = new Map<string, LiteratureCandidate[]>();
  for (const quote of catalog.quotes) {
    if (!quote.flowerId || quote.excerptType === undefined) continue;
    const rows = byFlower.get(quote.flowerId) ?? [];
    rows.push(quote);
    byFlower.set(quote.flowerId, rows);
  }
  return byFlower;
}

/** `A / B 옮김` 은 앞사람(원저자)으로 센다 — 규칙 쪽과 같은 기준이다. */
function author(candidate: LiteratureCandidate): string {
  return (candidate.author ?? '').split('/')[0]?.trim() ?? '';
}

describe('§1.5k 문학 고르기 — 대표 1편 + 넘겨 보기 (#1)', () => {
  it('후보가 없으면 undefined — 블록 자체를 세우지 않는다', () => {
    expect(orderLiterature([], 'rose-red', 'comfort')).toBeUndefined();
  });

  it('대표는 이 상황(intent)에 어울린다고 적힌 발췌 안에서 고른다', async () => {
    const byFlower = await literatureByFlower();
    for (const [flowerId, rows] of byFlower) {
      for (const intent of INTENTS) {
        const picked = orderLiterature(rows, flowerId, intent);
        expect(picked, flowerId).toBeDefined();
        const fitting = rows.filter((row) => row.tags.includes(intent));
        // 어울리는 발췌가 하나라도 있으면 대표는 반드시 그 안에서 나온다.
        if (fitting.length > 0) {
          expect(fitting.map((row) => row.quoteId), `${flowerId}/${intent}`).toContain(
            picked?.featured.quoteId,
          );
        }
      }
    }
  });

  it('같은 입력이면 같은 결과다 — 새로고침으로 문장이 바뀌지 않는다', async () => {
    const byFlower = await literatureByFlower();
    const rows = byFlower.get('rose-red') ?? [];
    expect(rows.length).toBeGreaterThan(1);

    const once = orderLiterature(rows, 'rose-red', 'confession');
    const twice = orderLiterature(rows, 'rose-red', 'confession');
    expect(once?.featured.quoteId).toBe(twice?.featured.quoteId);
    expect(once?.others.map((row) => row.quoteId)).toEqual(
      twice?.others.map((row) => row.quoteId),
    );
  });

  it('대표는 목록에서 빠지고, 후보는 하나도 잃지 않는다', async () => {
    const byFlower = await literatureByFlower();
    for (const [flowerId, rows] of byFlower) {
      const picked = orderLiterature(rows, flowerId, 'just_because');
      const ids = [picked!.featured.quoteId, ...picked!.others.map((row) => row.quoteId)];
      expect(new Set(ids).size, flowerId).toBe(rows.length);
      expect(picked!.others.map((row) => row.quoteId), flowerId).not.toContain(
        picked!.featured.quoteId,
      );
    }
  });

  it('같은 작가가 연달아 나오지 않는다 — 실데이터 전 꽃·전 상황', async () => {
    const byFlower = await literatureByFlower();
    for (const [flowerId, rows] of byFlower) {
      for (const intent of INTENTS) {
        const picked = orderLiterature(rows, flowerId, intent)!;
        const line = [picked.featured, ...picked.others];
        for (let i = 1; i < line.length; i += 1) {
          const previous = author(line[i - 1]);
          if (previous === '') continue;
          expect(author(line[i]), `${flowerId}/${intent} @${i}`).not.toBe(previous);
        }
      }
    }
  });

  it('작가가 겹칠 때 번갈아 뽑는다 (베르길리우스 3행이 붙지 않게)', () => {
    const rows: LiteratureCandidate[] = [
      { quoteId: 'v1', author: '베르길리우스', tags: [] },
      { quoteId: 'v2', author: '베르길리우스', tags: [] },
      { quoteId: 'v3', author: '베르길리우스', tags: [] },
      { quoteId: 's1', author: '셸리', tags: [] },
      { quoteId: 's2', author: '셸리', tags: [] },
    ];
    expect(interleaveByAuthor(rows).map((row) => row.quoteId)).toEqual([
      'v1',
      's1',
      'v2',
      's2',
      'v3',
    ]);
  });

  it('작가가 한 명뿐이면 원래 순서 그대로다 (섞을 이유가 없다)', () => {
    const rows: LiteratureCandidate[] = [
      { quoteId: 'a', author: '릴케', tags: [] },
      { quoteId: 'b', author: '릴케', tags: [] },
    ];
    expect(interleaveByAuthor(rows).map((row) => row.quoteId)).toEqual(['a', 'b']);
  });

  it('원문 언어권을 문자로 가른다 — 한글이 섞인 한문은 한국 것이다', () => {
    expect(literatureLanguage({ quoteId: 'x', tags: [] })).toBe('ko'); // 원문 없음 = 한국어 원전
    expect(literatureLanguage({ quoteId: 'x', tags: [], textOriginal: '菊花야 너는 어이' })).toBe(
      'ko',
    );
    expect(literatureLanguage({ quoteId: 'x', tags: [], textOriginal: '採菊東籬下' })).toBe('han');
    expect(literatureLanguage({ quoteId: 'x', tags: [], textOriginal: 'さまざまの事' })).toBe('ja');
    expect(literatureLanguage({ quoteId: 'x', tags: [], textOriginal: 'Когда, росой' })).toBe(
      'cyrillic',
    );
    expect(literatureLanguage({ quoteId: 'x', tags: [], textOriginal: 'αἷμα χέει' })).toBe('greek');
    expect(literatureLanguage({ quoteId: 'x', tags: [], textOriginal: 'به چه کار' })).toBe('arabic');
    expect(literatureLanguage({ quoteId: 'x', tags: [], textOriginal: 'O my Luve' })).toBe('latin');
  });

  it('언어권이 여럿인 꽃은 대표가 한 언어에만 붙어 있지 않다', async () => {
    const byFlower = await literatureByFlower();
    // 후보가 여러 언어권인 꽃들을 모아, 상황을 가로질러 두 언어권 이상이 대표로 선다.
    const seen = new Set<string>();
    for (const [flowerId, rows] of byFlower) {
      if (new Set(rows.map(literatureLanguage)).size < 2) continue;
      for (const intent of INTENTS) {
        seen.add(literatureLanguage(orderLiterature(rows, flowerId, intent)!.featured));
      }
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('§1.5e 함께 담을 한 줄 — 톤별 변형 (#13)', () => {
  it('첫 문장만 떼어 낸다', () => {
    expect(firstSentence('지난번 일은 제 잘못이었습니다. 변명 없이 사과드립니다.')).toBe(
      '지난번 일은 제 잘못이었습니다.',
    );
    expect(firstSentence('  받아 줄래?  그리고 커피도.  ')).toBe('받아 줄래?');
  });

  it('문장부호가 없으면 통째로 돌려준다 — 글자 수로 자르지 않는다', () => {
    expect(firstSentence('고맙다는 말 너무 오래 미뤘어')).toBe('고맙다는 말 너무 오래 미뤘어');
    expect(firstSentence('   ')).toBe('');
  });

  it('예문이 있는 상황에서는 톤마다 다른 한 줄이 나온다', async () => {
    const catalog = await loadCatalog();
    const rows = catalog.templates.filter((template) => template.intent === 'apology');
    expect(rows.length).toBeGreaterThan(1);

    const lines = rows.map((template) => firstSentence(template.templateText));
    for (const line of lines) expect(line).not.toBe('');
    // 톤이 다르면 카드에 적을 한 줄도 달라야 한다 — 이것이 #13 의 전부다.
    expect(new Set(lines).size).toBe(lines.length);
  });

  it('각주는 출처가 아니라 출신을 말한다 (사람 이름을 흉내 내지 않는다)', () => {
    for (const note of Object.values(CARD_LINE_NOTES)) {
      expect(note).toContain('첫 마디');
      // `김소월, 〈산유화〉(1925)` 같은 인용 각주 형식을 쓰면 우리 문장이 인용처럼 읽힌다.
      expect(note).not.toMatch(/[〈《(]/);
    }
  });
});

describe('가격 표기 (#11)', () => {
  it('구간은 셋이고 라벨이 셋 다 있다', () => {
    expect([...PRICE_BAND_SLOTS]).toEqual([1, 2, 3]);
    for (const band of PRICE_BAND_SLOTS) expect(PRICE_LABELS[band].trim()).not.toBe('');
  });

  it('가장 낮은 구간에만 §1.5d 한마디가 붙는다', () => {
    expect(PRICE_BAND_NOTES[1]).toBe('가볍게 준비해도 충분히 마음이 서는 꽃이에요');
    expect(PRICE_BAND_NOTES[2]).toBeUndefined();
    expect(PRICE_BAND_NOTES[3]).toBeUndefined();
  });

  it('가격이 마음의 크기라는 함의를 쓰지 않는다 (§1.5i 금지선)', () => {
    const lines = [...Object.values(PRICE_LABELS), ...Object.values(PRICE_BAND_NOTES)];
    for (const line of lines) {
      expect(line, line).not.toMatch(/성의|정성만큼|마음의 크기|비쌀수록|저렴하지만/);
      // "부족하다·미안하다"로 읽히는 말도 금지다 — 낮은 구간을 변명하게 만든다.
      expect(line, line).not.toMatch(/부족|아쉽|죄송/);
    }
  });

  it('카탈로그의 모든 꽃이 세 구간 중 하나에 든다', async () => {
    const catalog = await loadCatalog();
    for (const flower of catalog.flowers) {
      expect([...PRICE_BAND_SLOTS], flower.id).toContain(flower.priceBand);
    }
  });
});

describe('결과 화면 대표 실사 (#14)', () => {
  it('추천에 나올 수 있는 꽃 전원이 컷을 갖는다', async () => {
    const catalog = await loadCatalog();
    for (const flower of catalog.flowers) {
      expect(photoFor(flower.id), flower.id).toBeDefined();
    }
    expect(Object.keys(FLOWER_PHOTOS)).toHaveLength(catalog.flowers.length);
  });

  it('결과 무대가 쓰는 폭은 1600 — 도감 상세와 같은 값이다', () => {
    const photo = photoFor('rose-red')!;
    expect(photoSrc(photo, 1600)).toContain('w=1600');
    // 파라미터는 주소에 없고 `photoSrc` 가 붙인다(CDN 캐시를 폭마다 하나로 모은다).
    expect(photo.src).not.toContain('?');
  });

  it('다크 오버레이가 필요한 컷은 넷이다 (화면이 필터를 거는 기준)', async () => {
    const catalog = await loadCatalog();
    const bright = catalog.flowers
      .map((flower) => photoFor(flower.id))
      .filter((photo) => photo !== undefined)
      .filter(needsDarkOverlay)
      .map((photo) => photo.flowerId)
      .sort();
    expect(bright).toEqual(['babys-breath', 'lavender', 'lily-of-the-valley', 'violet']);
  });
});

describe('맥락 칩의 원문 표시 (§1.5l 부수)', () => {
  it("마음 어휘에 'other' 가 있어 원문 치환 경로가 성립한다", () => {
    const intents: readonly Intent[] = INTENTS;
    expect(intents).toContain('other');
  });
});
