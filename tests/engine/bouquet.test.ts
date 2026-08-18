import { describe, expect, it } from 'vitest';

import { buildBouquetIndex } from '@/components/bouquet/build';
import { loadCatalog } from '@/lib/data/catalog';
import {
  ACCENT_FLOWER_IDS,
  MAX_ACCENTS,
  accentCandidates,
  judgeBouquet,
  mainCandidates,
} from '@/lib/engine/bouquet';
import { exclude } from '@/lib/engine/exclude';
import { MAX_BOUQUET_FLOWERS } from '@/lib/engine/group';
import { TRAIT_LABELS } from '@/lib/engine/normalize';
import type { RecoInput, Species } from '@/lib/engine/types';

/**
 * 다발 짜기 판정 — `/bouquet` 회귀 가드 (2026-08-18 B-4).
 *
 * 이 그물이 지키는 것은 다섯이다.
 *
 *   ① **안전을 두 번 짜지 않는다.** 반려동물 교차 검사는 `exclude()` 가 하고, 이 화면은
 *      그것을 부를 뿐이다. 카탈로그 59종 × 2종 전수로 두 판정을 맞대어 본다 — 어느 한쪽만
 *      고치면 여기가 먼저 깨진다(단체 부케 `recommendGroupBouquet` 도 같은 함수를 쓴다).
 *   ② **지어내지 않는다.** 색 궁합에 점수가 없고, 데이터가 말해 주지 않는 조합에는
 *      "말해 줄 게 없다" 고 적힌다. 그 문장이 사라지면 그 자리는 반드시 지어낸 말이 채운다.
 *   ③ **문턱이 화면마다 다르지 않다.** "향이 진하다"(>=2)는 `exclude()` 의 향 민감 제외와
 *      같은 문턱이고, 결 5축 표기는 `normalize.ts` 의 `TRAIT_LABELS` 와 같은 말이다.
 *   ④ **한 다발의 크기가 하나다.** 주 꽃 1 + 곁들이 2 = 단체 부케의 `MAX_BOUQUET_FLOWERS`.
 *   ⑤ **결정적이다.** 같은 조합에는 늘 같은 카드가 선다 — 정적 데모와 본배포가 같은 화면
 *      이어야 하는 이유이자, 무작위·시계가 끼어들지 못하게 하는 자물쇠다.
 *
 * 픽스처가 아니라 **실제 카탈로그**로 돈다. 이 화면이 판정하는 대상이 곧 그 59종이고,
 * 미니 픽스처로는 "고양이×유칼립투스" 같은 실제 조합을 확인할 수 없다.
 */

const catalog = await loadCatalog();
const { flowers } = buildBouquetIndex(catalog);

const SPECIES: readonly Species[] = ['cat', 'dog'];

function flowerById(id: string) {
  const hit = flowers.find((flower) => flower.id === id);
  if (!hit) throw new Error(`카탈로그에 없는 꽃: ${id}`);
  return hit;
}

function judge(mainId: string, accentIds: string[] = [], colorValue?: string) {
  const verdict = judgeBouquet({ mainId, accentIds, colorValue }, flowers);
  if (verdict === null) throw new Error(`판정이 서지 않았다: ${mainId}`);
  return verdict;
}

/* ------------------------------------------------------------------ *
 * 0. 데이터 전제 — 그물이 헛돌지 않는지 먼저 본다
 * ------------------------------------------------------------------ */

describe('전제', () => {
  it('카탈로그 59종을 통째로 읽었다', () => {
    expect(flowers.length).toBeGreaterThanOrEqual(59);
  });

  it('이 테스트가 기대는 위험 조합이 데이터에 실제로 있다', () => {
    const eucalyptus = flowerById('eucalyptus');
    for (const species of SPECIES) {
      const entry = eucalyptus.petSafety.find((row) => row.species === species);
      expect(entry?.severity, species).toBe('serious');
    }

    // 백합은 고양이에게만 치명적이고 강아지에게는 가벼운 위장 장애다 — 두 갈래를 가른다.
    const lily = flowerById('lily-asiatic');
    expect(lily.petSafety.find((row) => row.species === 'cat')?.severity).toBe(
      'life_threatening',
    );
    expect(lily.petSafety.find((row) => row.species === 'dog')?.severity).toBe('mild_gi');
  });
});

/* ------------------------------------------------------------------ *
 * 1. 반려동물 교차 검사
 * ------------------------------------------------------------------ */

describe('반려동물 교차 검사 (§1.5h)', () => {
  it('고양이 × 유칼립투스 — 곁들이 하나 때문에 조합 전체가 걸린다', () => {
    const verdict = judge('rose-red', ['eucalyptus'], 'red');

    expect(verdict.pet).not.toBeNull();
    expect(verdict.pet?.species).toContain('cat');
    expect(verdict.pet?.blocked.map((f) => f.id)).toEqual(['eucalyptus']);

    // §1.5h — 직설. 무엇 때문인지 이름으로 말한다.
    expect(verdict.pet?.headline).toContain('고양이');
    expect(verdict.pet?.headline).toContain('유칼립투스');
    expect(verdict.pet?.headline).toContain('어려워요');
  });

  it('주 꽃이 위험해도 똑같이 걸린다 — 백합 × 고양이', () => {
    const verdict = judge('lily-asiatic');

    expect(verdict.pet?.blocked.map((f) => f.id)).toEqual(['lily-asiatic']);
    // 강아지에게는 mild_gi 라 위험 목록에 없다. 그 사실이 문장에도 그대로 있어야 한다.
    expect(verdict.pet?.species).toEqual(['cat']);
    expect(verdict.pet?.headline).toContain('고양이');
    expect(verdict.pet?.headline).not.toContain('강아지');
  });

  it('mild_gi 는 빼지 않고 주의로만 남는다 — 그 문장은 `exclude()` 가 쓴 그대로다', () => {
    const verdict = judge('lily-asiatic');
    const mine = verdict.mildCautions.join('\n');

    const { cautionsByFlower } = exclude([flowerById('lily-asiatic')], {
      relationship: 'other',
      intent: 'other',
      pets: ['dog'],
    } satisfies RecoInput);
    const theirs = (cautionsByFlower.get('lily-asiatic') ?? []).join('\n');

    expect(theirs).not.toBe('');
    expect(mine).toContain(theirs);
  });

  it('안전한 조합에는 경고 자체가 없다', () => {
    const verdict = judge('rose-red', ['babys-breath'], 'red');
    expect(verdict.pet).toBeNull();
  });

  it('안전 대체는 `pet_safety.csv` 가 지목한 꽃에서만 나온다', () => {
    const verdict = judge('rose-red', ['eucalyptus']);
    const named = new Set(flowerById('eucalyptus').safeAlternatives.map((f) => f.id));

    expect(verdict.pet?.alternatives.length).toBeGreaterThan(0);
    for (const alt of verdict.pet?.alternatives ?? []) {
      expect(named.has(alt.id), alt.id).toBe(true);
    }
  });

  it('대체로 권한 꽃은 그 종에게 독성이 없다 — 대안이 또 위험하면 대안이 아니다', () => {
    for (const flower of flowers) {
      const verdict = judge(flower.id);
      if (verdict.pet === null) continue;

      for (const alt of verdict.pet.alternatives) {
        const full = flowerById(alt.id);
        for (const species of verdict.pet.species) {
          const entry = full.petSafety.find((row) => row.species === species);
          expect(entry?.toxic ?? false, `${alt.id}/${species}`).toBe(false);
        }
      }
    }
  });

  it('이미 담긴 꽃을 대체로 권하지 않는다', () => {
    // 백합의 대체 1순위는 프리지아다 — 그 프리지아를 이미 담았으면 다른 것을 권해야 한다.
    const verdict = judge('lily-asiatic', ['freesia']);
    const ids = verdict.pet?.alternatives.map((f) => f.id) ?? [];

    expect(ids).not.toContain('freesia');
    expect(ids.length).toBeGreaterThan(0);
  });

  it('`exclude()` 와 판정이 어긋나지 않는다 — 59종 × 2종 전수', () => {
    for (const flower of flowers) {
      const mine = judge(flower.id).pet;

      for (const species of SPECIES) {
        const { excluded } = exclude([flower], {
          relationship: 'other',
          intent: 'other',
          pets: [species],
        } satisfies RecoInput);
        const blockedThere = excluded.some((item) => item.ruleId === 'EX_PET_TOXIC');
        const blockedHere = mine !== null && mine.species.includes(species);

        expect(blockedHere, `${flower.id}/${species}`).toBe(blockedThere);
      }
    }
  });
});

/* ------------------------------------------------------------------ *
 * 2. 색 궁합 — 지어내지 않는다
 * ------------------------------------------------------------------ */

describe('색 궁합', () => {
  it('같은 색을 낼 수 있는 곁들이를 짚는다', () => {
    const verdict = judge('tulip-white', ['babys-breath'], 'white');

    expect(verdict.color.main?.value).toBe('white');
    expect(verdict.color.echoes.map((f) => f.id)).toEqual(['babys-breath']);
    expect(verdict.color.notes[0]).toContain('안개꽃');
    expect(verdict.color.notes[0]).toContain('흰색');
  });

  it('같은 색이어도 품는 말이 다르면 두 꽃말을 나란히 인용한다', () => {
    // 수국 푸른색 = "변덕", 스타티스 푸른색 = "변하지 않는 마음" — 데이터가 그렇게 적혀 있다.
    const verdict = judge('hydrangea', ['statice'], 'blue');
    const quoted = verdict.color.notes.find((note) => note.includes('색이 같아도'));

    expect(quoted).toBeDefined();
    expect(quoted).toContain(flowerById('hydrangea').paletteKo[0].label);
    expect(quoted).toContain('변하지 않는 마음');
  });

  it('결 5축이 겹치면 그 사실만 말한다 — 점수가 아니다', () => {
    const verdict = judge('tulip-white', ['babys-breath'], 'white');

    expect(verdict.color.sharedTones.length).toBeGreaterThan(0);
    const tone = verdict.color.notes.find((note) => note.includes('결이 겹쳐요'));
    expect(tone).toBeDefined();
    for (const label of verdict.color.sharedTones) expect(tone).toContain(label);
  });

  it('결 표기는 `TRAIT_LABELS` 와 같은 말이다', () => {
    const known = new Set(Object.keys(TRAIT_LABELS));

    for (const flower of flowers) {
      const verdict = judge(flower.id, ['babys-breath']);
      for (const label of verdict.color.sharedTones) {
        expect(known.has(label), label).toBe(true);
      }
    }
  });

  it('말해 줄 게 없으면 없다고 적는다 — 그 자리를 지어낸 문장으로 메우지 않는다', () => {
    // 빨간 장미(vivid·elegant)와 유칼립투스(minimal·calm)는 색도 결도 겹치지 않는다.
    const verdict = judge('rose-red', ['eucalyptus'], 'red');

    expect(verdict.color.echoes).toEqual([]);
    expect(verdict.color.sharedTones).toEqual([]);
    expect(verdict.color.notes).toHaveLength(1);
    expect(verdict.color.notes[0]).toContain('말해 주는 건 없어요');
    expect(verdict.color.notes[0]).toContain('점수로 지어내지는 않을게요');
  });

  it('색 궁합에 점수가 하나도 없다', () => {
    for (const flower of flowers.slice(0, 20)) {
      const verdict = judge(flower.id, ['eucalyptus', 'babys-breath']);
      expect(Object.keys(verdict.color)).toEqual(['main', 'echoes', 'sharedTones', 'notes']);
    }
  });

  it('색을 고르지 않으면 그 꽃의 대표색이 선다', () => {
    for (const flower of flowers) {
      const verdict = judge(flower.id);
      expect(verdict.color.main?.value, flower.id).toBe(flower.paletteKo[0]?.value);
    }
  });

  it('곁들이는 주 꽃이 입은 색을 낼 수 있으면 그 색으로 선다', () => {
    const verdict = judge('tulip-white', ['babys-breath'], 'pink');
    const accent = verdict.stems.find((stem) => stem.flower.id === 'babys-breath');

    expect(verdict.color.main?.value).toBe('pink');
    expect(accent?.color?.value).toBe('pink');
  });
});

/* ------------------------------------------------------------------ *
 * 3. 향 겹침
 * ------------------------------------------------------------------ */

describe('향 겹침', () => {
  it('합은 `fragrance_level` 의 단순 합이다', () => {
    const verdict = judge('rose-red', ['eucalyptus']);
    const expected =
      flowerById('rose-red').fragranceLevel + flowerById('eucalyptus').fragranceLevel;

    expect(verdict.fragrance.total).toBe(expected);
  });

  it('진한 꽃이 둘 이상이면 자리를 피하라고 말한다', () => {
    // 빨간 장미(2) + 유칼립투스(3) — 둘 다 문턱 위다.
    const verdict = judge('rose-red', ['eucalyptus']);

    expect(verdict.fragrance.strong.map((f) => f.id).sort()).toEqual(['eucalyptus', 'rose-red']);
    expect(verdict.fragrance.note).toContain('식탁 옆은 피해 주세요');
  });

  it('진한 꽃이 하나면 그 꽃이 향을 정한다고 말한다', () => {
    const verdict = judge('freesia', ['babys-breath']);

    expect(verdict.fragrance.strong.map((f) => f.id)).toEqual(['freesia']);
    expect(verdict.fragrance.note).toContain('프리지아');
  });

  it('향이 하나도 없으면 그 사실을 말한다', () => {
    const verdict = judge('gerbera', ['babys-breath', 'statice']);

    expect(verdict.fragrance.total).toBe(0);
    expect(verdict.fragrance.note).toContain('향이 거의 없는');
  });

  it('「향이 진하다」는 `exclude()` 의 향 민감 제외와 같은 문턱이다 — 59종 전수', () => {
    for (const flower of flowers) {
      const verdict = judge(flower.id);
      const callsStrong = verdict.fragrance.strong.some((f) => f.id === flower.id);

      const { excluded } = exclude([flower], {
        relationship: 'other',
        intent: 'other',
        fragranceSensitive: true,
      } satisfies RecoInput);
      const droppedThere = excluded.some((item) => item.ruleId === 'EX_FRAGRANCE');

      expect(callsStrong, flower.id).toBe(droppedThere);
    }
  });
});

/* ------------------------------------------------------------------ *
 * 4. 꽃말 조합
 * ------------------------------------------------------------------ */

describe('이 다발이 품는 말들', () => {
  it('꽃말을 찾은 줄기만 선다 — 출처 없는 꽃말은 싣지 않는다', () => {
    for (const flower of flowers) {
      const verdict = judge(flower.id, ['statice', 'cotton']);
      const withMeaning = verdict.stems.filter((stem) => stem.color?.meaningKo !== undefined);

      expect(verdict.meanings).toHaveLength(withMeaning.length);
      for (const line of verdict.meanings) {
        expect(line.meaningKo.trim()).not.toBe('');
      }
    }
  });

  it('주 꽃과 곁들이의 말이 순서대로 나란히 선다', () => {
    const verdict = judge('tulip-white', ['babys-breath'], 'white');

    expect(verdict.meanings.map((line) => line.flower.id)).toEqual([
      'tulip-white',
      'babys-breath',
    ]);
  });
});

/* ------------------------------------------------------------------ *
 * 5. 조합 상한 · 목록
 * ------------------------------------------------------------------ */

describe('한 다발의 크기', () => {
  it('주 꽃 1 + 곁들이 2 = 단체 부케의 한 다발과 같은 수다', () => {
    expect(1 + MAX_ACCENTS).toBe(MAX_BOUQUET_FLOWERS);
  });

  it('곁들이를 더 넣어도 상한까지만 담긴다', () => {
    const verdict = judge('rose-red', ['eucalyptus', 'babys-breath', 'statice', 'cotton']);
    expect(verdict.stems).toHaveLength(1 + MAX_ACCENTS);
  });

  it('중복·주 꽃과 같은 꽃·모르는 id 는 조용히 떨어진다', () => {
    const verdict = judge('babys-breath', [
      'babys-breath',
      'statice',
      'statice',
      'no-such-flower',
    ]);

    expect(verdict.stems.map((stem) => stem.flower.id)).toEqual(['babys-breath', 'statice']);
  });

  it('모르는 주 꽃이면 카드를 세우지 않는다', () => {
    expect(judgeBouquet({ mainId: 'no-such-flower', accentIds: [] }, flowers)).toBeNull();
  });
});

describe('고르기 목록', () => {
  it('주 꽃 목록은 카탈로그 전종이고, 곁들이 결이 강한 세 종만 뒤에 선다', () => {
    const mains = mainCandidates(flowers);

    expect(mains).toHaveLength(flowers.length);
    expect(mains.slice(-3).map((flower) => flower.id)).toEqual([
      'babys-breath',
      'eucalyptus',
      'statice',
    ]);
    // 나머지는 카탈로그 순서 그대로다 — 순서를 매길 근거가 없으면 데이터 순서를 둔다.
    const tail = new Set(['babys-breath', 'eucalyptus', 'statice']);
    expect(mains.slice(0, -3).map((flower) => flower.id)).toEqual(
      flowers.filter((flower) => !tail.has(flower.id)).map((flower) => flower.id),
    );
  });

  it('곁들이 목록은 지어낸 꽃 없이 전부 카탈로그 안에 있다', () => {
    const accents = accentCandidates(flowers);
    const known = new Set(flowers.map((flower) => flower.id));

    expect(accents.map((flower) => flower.id)).toEqual([...ACCENT_FLOWER_IDS]);
    for (const id of ACCENT_FLOWER_IDS) expect(known.has(id), id).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * 6. 결정성
 * ------------------------------------------------------------------ */

describe('결정성', () => {
  it('같은 조합에는 늘 같은 카드가 선다', () => {
    const once = JSON.stringify(judge('hydrangea', ['statice', 'cotton'], 'blue'));
    for (let i = 0; i < 20; i += 1) {
      expect(JSON.stringify(judge('hydrangea', ['statice', 'cotton'], 'blue'))).toBe(once);
    }
  });

  it('59종 × 곁들이 6종 조합 전부가 예외 없이 카드를 세운다', () => {
    for (const flower of flowers) {
      for (const accent of ACCENT_FLOWER_IDS) {
        const verdict = judgeBouquet(
          { mainId: flower.id, accentIds: [accent] },
          flowers,
        );
        expect(verdict, `${flower.id}+${accent}`).not.toBeNull();
        expect(verdict?.color.notes.length, `${flower.id}+${accent}`).toBeGreaterThan(0);
        expect(verdict?.fragrance.note, `${flower.id}+${accent}`).not.toBe('');
      }
    }
  });
});
