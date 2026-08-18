import { describe, expect, it } from 'vitest';

import { loadCatalog } from '@/lib/data/catalog';
import { MAX_RESULTS, recommend } from '@/lib/engine';
import { diversify, diversityScores } from '@/lib/engine/diversity';
import { REASON_TEXTS } from '@/lib/engine/explain';
import {
  CUE_LEXICON,
  readCues,
  scoreCandidate,
  scorePersonal,
  type ScoredFlower,
} from '@/lib/engine/score';
import type { FlowerData, RecoInput, RecommendationRuleRow, RuleSet } from '@/lib/engine/types';
import { DEFAULT_WEIGHTS, weightsSchema } from '@/lib/engine/weights';
import { makeInput, testFlowers, testRuleSetWithMeanings, testRules } from './fixtures';

/**
 * 점수식 `0.30I + 0.25R + 0.15S + 0.15A + 0.10P + 0.05D` 의 **뒤 두 항**.
 *
 * 2026-08-17 감사 P1-1 이 잡은 자리다 — P 는 `const P = 0` 스텁이었고 D 는 합산식에
 * 아예 없어서 fitScore 가 구조적으로 85 를 넘지 못했다. 여기서 지키는 것은 셋이다.
 *   ① 에피소드를 적으면 그 글이 **순위를 움직인다**(P).
 *   ② 에피소드를 적지 않은 사람의 순위는 **그대로다**(P 중립값).
 *   ③ 만점 조건에서 100 이 **실제로 나온다**(여섯 항이 다 살아 있다).
 *
 * ⚠ 테스트 문장은 전부 합성이다(§1.5j — 실제 사용자 원문을 픽스처로 쓰지 않는다).
 */

function flowerById(id: string): FlowerData {
  const flower = testFlowers.find((f) => f.id === id);
  if (!flower) throw new Error(`fixture에 없는 꽃: ${id}`);
  return flower;
}

function scoreOf(f: FlowerData, input: RecoInput) {
  return scoreCandidate(f, input, testRules, DEFAULT_WEIGHTS);
}

/* ------------------------------------------------------------------ *
 * 1. 사전 — 이야기를 꽃 속성으로 옮긴다
 * ------------------------------------------------------------------ */

describe('readCues (자유 서술 → 꽃 속성)', () => {
  it('장면 낱말을 태그·색·달로 옮긴다', () => {
    const sea = readCues(['바다 여행을 함께 갔어요']);
    // 바다 → calm / blue·white, 여행 → vivid
    expect(sea.tags).toContain('calm');
    expect(sea.tags).toContain('vivid');
    expect(sea.colors).toEqual(expect.arrayContaining(['blue', 'white']));
    expect(sea.months).toEqual([]);
    expect(sea.flowerIds).toEqual([]);

    const spring = readCues(['봄날 소풍을 갔던 기억이 있어요']);
    expect(spring.months).toEqual([3, 4, 5]);
  });

  it('`flower:` 단서는 사전을 거치지 않고 꽃 id 로 들어간다', () => {
    const cues = readCues(['flower:tulip-white', '작년에 함께 본 꽃이에요']);
    expect(cues.flowerIds).toEqual(['tulip-white']);
  });

  it('읽어 낼 것이 없으면 네 배열이 모두 비어 있다 (억측보다 침묵)', () => {
    expect(readCues([])).toEqual({ tags: [], colors: [], months: [], flowerIds: [] });
    expect(readCues(['', '   '])).toEqual({ tags: [], colors: [], months: [], flowerIds: [] });
    expect(readCues(['그냥 고마워서요'])).toEqual({
      tags: [],
      colors: [],
      months: [],
      flowerIds: [],
    });
  });

  it('어미에 걸리는 낱말을 사전에 넣지 않았다 (infer.ts 의 `치자` 교훈)', () => {
    // 아래 문장들은 각각 '이사'·'특별'·'준비'·'계산' 처럼 사전에 있을 뻔한 낱말을 품는다.
    for (const sentence of [
      '그것이 사실은 오래된 이야기예요',
      '특별한 날은 아니었어요',
      '준비를 많이 했어요',
      '계산은 제가 했어요',
      '눈치가 빠른 사람이에요',
      '선물을 고르고 있어요',
    ]) {
      expect(readCues([sentence])).toEqual({
        tags: [],
        colors: [],
        months: [],
        flowerIds: [],
      });
    }
  });

  it('같은 문장은 언제나 같은 단서다 (결정성)', () => {
    const sentence = '겨울 바다에서 사진을 찍었어요';
    expect(readCues([sentence])).toEqual(readCues([sentence]));
  });
});

describe('CUE_LEXICON 불변식', () => {
  it('사전이 내놓는 태그·색은 카탈로그가 실제로 쓰는 어휘다', async () => {
    const catalog = await loadCatalog();
    const tags = new Set(catalog.flowers.flatMap((f) => f.aestheticTags));
    const colors = new Set(catalog.flowers.flatMap((f) => f.colors));

    for (const rule of CUE_LEXICON) {
      for (const tag of rule.tags ?? []) expect(tags).toContain(tag);
      for (const color of rule.colors ?? []) expect(colors).toContain(color);
      for (const month of rule.months ?? []) {
        expect(month).toBeGreaterThanOrEqual(1);
        expect(month).toBeLessThanOrEqual(12);
      }
    }
  });

  it('낱말은 두 글자 이상이다 (한 글자는 어미·복합어에 걸린다)', () => {
    for (const rule of CUE_LEXICON) {
      expect(rule.stems.length).toBeGreaterThan(0);
      for (const stem of rule.stems) expect(stem.trim().length).toBeGreaterThanOrEqual(2);
    }
  });
});

/* ------------------------------------------------------------------ *
 * 2. P — 에피소드가 순위를 움직인다
 * ------------------------------------------------------------------ */

describe('P (개인화)', () => {
  it('단서가 없으면 전 후보가 같은 중립값을 받는다', () => {
    const input = makeInput();
    const values = testFlowers.map((f) => scoreOf(f, input).parts.P);
    expect(new Set(values).size).toBe(1);
    expect(values[0]).toBe(0.5);
  });

  it('분위기 칩·색 칩만으로는 P 가 흔들리지 않는다 (그 둘은 A 의 재료다)', () => {
    const chipsOnly = makeInput({
      recipientTraits: ['calm', 'elegant'],
      colorPrefs: ['white'],
      fragrancePreference: true,
    });
    for (const flower of testFlowers) {
      expect(scoreOf(flower, chipsOnly).parts.P).toBe(0.5);
    }
  });

  it('이야기와 결이 닿는 꽃이 위로, 닿지 않는 꽃이 아래로 간다', () => {
    // '바다' → calm · blue·white
    const input = makeInput({ personalCues: ['바다가 보이는 곳이었어요'] });

    const freesia = scoreOf(flowerById('freesia'), input).parts.P; // calm + white
    const rose = scoreOf(flowerById('rose-red'), input).parts.P; // 결도 색도 안 닿는다

    expect(freesia).toBeGreaterThan(0.5);
    expect(rose).toBe(0);
    for (const flower of testFlowers) {
      const P = scoreOf(flower, input).parts.P;
      expect(P).toBeGreaterThanOrEqual(0);
      expect(P).toBeLessThanOrEqual(1);
    }
  });

  it('한 문장이 여러 결을 말하면 어느 꽃도 그것을 다 담지 못한다', () => {
    /*
     * '바다 여행' 은 calm(바다)과 vivid(여행)를 한꺼번에 말한다. P 는 "말한 것 중 몇 개가
     * 이 꽃에 있나" 라서, 서로 반대인 두 결을 동시에 가진 꽃이 없으면 아무도 만점 근처로
     * 못 간다. 감점이 아니라 **정직한 눈금**이다 — 사람이 애매하게 말했으면 단서도 애매하다.
     */
    const input = makeInput({ personalCues: ['바다 여행을 함께 갔어요'] });
    const scores = testFlowers.map((f) => scoreOf(f, input).parts.P);

    expect(Math.max(...scores)).toBeLessThan(1);
    // 그래도 순위는 갈린다 — 하나도 안 닿는 꽃은 바닥이다.
    expect(scoreOf(flowerById('gerbera'), input).parts.P).toBe(0);
    expect(new Set(scores).size).toBeGreaterThan(1);
  });

  it('이름을 부른 꽃은 P 가 크게 오르고 SC_MEMORY_FLOWER 가 붙는다', () => {
    const input = makeInput({ personalCues: ['flower:tulip-white'] });

    const tulip = scoreOf(flowerById('tulip-white'), input);
    const lily = scoreOf(flowerById('lily-asiatic'), input);

    expect(tulip.parts.P).toBe(1);
    expect(tulip.matched).toContain('SC_MEMORY_FLOWER');
    expect(lily.parts.P).toBe(0);
    expect(lily.matched).not.toContain('SC_MEMORY_FLOWER');
    expect(lily.matched).not.toContain('SC_PERSONAL');
  });

  it('중립값보다 위로 올라간 꽃에만 SC_PERSONAL 이 붙는다', () => {
    const input = makeInput({ personalCues: ['바다가 보이는 카페에서 만났어요'] });

    for (const flower of testFlowers) {
      const score = scoreOf(flower, input);
      expect(score.matched.includes('SC_PERSONAL')).toBe(score.parts.P > 0.5);
    }
  });

  it('scorePersonal 은 단서가 없으면 grounded=false 로 중립을 말한다', () => {
    const lonely = scorePersonal(flowerById('rose-red'), readCues([]));
    expect(lonely).toEqual({ value: 0.5, named: false, grounded: false });
  });

  it('에피소드 한 줄이 추천 결과의 점수를 실제로 바꾼다', () => {
    const withoutEpisode = recommend(makeInput(), testRuleSetWithMeanings);
    const withEpisode = recommend(
      makeInput({ personalCues: ['바다가 보이는 곳이었어요'] }),
      testRuleSetWithMeanings,
    );

    const scoreFor = (results: typeof withEpisode, id: string) =>
      results.find((r) => r.flower.id === id)?.fitScore;

    // freesia(calm·white)는 이야기와 닿아 올라가고, gerbera 는 닿지 않아 내려간다.
    expect(scoreFor(withEpisode, 'freesia')).toBeGreaterThan(scoreFor(withoutEpisode, 'freesia')!);
    expect(scoreFor(withEpisode, 'gerbera')).toBeLessThan(scoreFor(withoutEpisode, 'gerbera')!);
  });

  it('실카탈로그에서 에피소드가 3안 자체를 바꾼다 (규칙 가점이 없는 자리)', async () => {
    const catalog = await loadCatalog();
    const data: RuleSet = {
      flowers: catalog.flowers,
      rules: catalog.rules,
      meanings: catalog.meanings,
    };
    // §1.5l `직접 쓴 사이·마음` — I·R 이 0 이라 색·제철·분위기·이야기만으로 고르는 자리다.
    const base: RecoInput = { relationship: 'other', intent: 'other', dateISO: '2026-08-17' };

    const before = recommend(base, data).map((r) => r.flower.id);
    const after = recommend(
      { ...base, personalCues: ['조용한 카페에서 책방 구경을 했어요'] },
      data,
    ).map((r) => r.flower.id);

    expect(before).toHaveLength(3);
    expect(after).toHaveLength(3);
    expect(after).not.toEqual(before);
  });

  it('붙는 근거는 전부 설명 사전에 문장이 있다', () => {
    const inputs = [
      makeInput({ personalCues: ['바다 여행을 함께 갔어요'] }),
      makeInput({ personalCues: ['flower:freesia', '졸업식 날 받았던 꽃이에요'] }),
      makeInput({ personalCues: ['특별한 이야기는 없어요'] }),
    ];
    for (const input of inputs) {
      for (const result of recommend(input, testRuleSetWithMeanings)) {
        for (const ruleId of result.reasons) {
          expect(Object.keys(REASON_TEXTS)).toContain(ruleId);
        }
      }
    }
    expect(REASON_TEXTS.SC_PERSONAL).toBeTruthy();
    expect(REASON_TEXTS.SC_MEMORY_FLOWER).toBeTruthy();
  });

  it('원문 조각이 근거·단서 어디에도 실려 나가지 않는다 (§1.5j)', () => {
    const secret = '지난 겨울 바다에서 우리끼리 부르던 별명 이야기';
    const cues = readCues([secret]);
    const serialized = JSON.stringify(cues);
    expect(serialized).not.toContain('별명');
    expect(serialized).not.toContain('우리끼리');

    const results = recommend(
      makeInput({ personalCues: [secret] }),
      testRuleSetWithMeanings,
    );
    const dump = JSON.stringify(results.map((r) => r.reasons));
    expect(dump).not.toContain('별명');
    expect(dump).not.toContain('바다');
  });
});

/* ------------------------------------------------------------------ *
 * 3. D — 세 안이 서로 다를수록 가점
 * ------------------------------------------------------------------ */

function scoredOf(flowers: FlowerData[]): ScoredFlower[] {
  return flowers.map((flower) => ({
    flower,
    score: { total: 0.5, parts: { I: 0, R: 0, S: 0, A: 0, P: 0, D: 0 }, matched: [] },
  }));
}

function fakeFlower(over: Partial<FlowerData> & { id: string }): FlowerData {
  return {
    nameKo: over.id,
    nameEn: over.id,
    scientificName: over.id,
    colors: [],
    bloomMonths: [],
    fragranceLevel: 0,
    priceBand: 1,
    aestheticTags: [],
    petSafety: [],
    ...over,
  };
}

describe('D (다양성)', () => {
  it('세 축이 모두 흩어진 세 안은 만점, 판박이 세 안은 0 이다', () => {
    const spread = scoredOf([
      fakeFlower({ id: 'a', priceBand: 1, aestheticTags: ['calm'], colors: ['white'] }),
      fakeFlower({ id: 'b', priceBand: 2, aestheticTags: ['vivid'], colors: ['red'] }),
      fakeFlower({ id: 'c', priceBand: 3, aestheticTags: ['cute'], colors: ['pink'] }),
    ]);
    expect(diversityScores(spread)).toEqual([1, 1, 1]);

    const twins = scoredOf([
      fakeFlower({ id: 'a', priceBand: 2, aestheticTags: ['calm'], colors: ['white'] }),
      fakeFlower({ id: 'b', priceBand: 2, aestheticTags: ['calm'], colors: ['white'] }),
      fakeFlower({ id: 'c', priceBand: 2, aestheticTags: ['calm'], colors: ['white'] }),
    ]);
    expect(diversityScores(twins)).toEqual([0, 0, 0]);
  });

  it('한 축만 다르면 그 축의 몫(1/3)만 받는다', () => {
    const priceOnly = scoredOf([
      fakeFlower({ id: 'a', priceBand: 1, aestheticTags: ['calm'], colors: ['white'] }),
      fakeFlower({ id: 'b', priceBand: 3, aestheticTags: ['calm'], colors: ['white'] }),
    ]);
    expect(diversityScores(priceOnly)).toEqual([0.3333, 0.3333]);
  });

  it('안이 하나뿐이면 겹칠 상대가 없으니 만점이다', () => {
    expect(diversityScores(scoredOf([fakeFlower({ id: 'a' })]))).toEqual([1]);
    expect(diversityScores([])).toEqual([]);
  });

  it('diversify 가 D 를 총점에 얹고, 두 번 불러도 부풀지 않는다', () => {
    const scored = scoredOf([
      fakeFlower({ id: 'a', priceBand: 1, aestheticTags: ['calm'], colors: ['white'] }),
      fakeFlower({ id: 'b', priceBand: 2, aestheticTags: ['vivid'], colors: ['red'] }),
      fakeFlower({ id: 'c', priceBand: 3, aestheticTags: ['cute'], colors: ['pink'] }),
    ]);

    const once = diversify(scored, 3, DEFAULT_WEIGHTS);
    expect(once.map((s) => s.score.parts.D)).toEqual([1, 1, 1]);
    // 0.5 + 0.05 × 1
    expect(once.map((s) => s.score.total)).toEqual([0.55, 0.55, 0.55]);

    const twice = diversify(once, 3, DEFAULT_WEIGHTS);
    expect(twice.map((s) => s.score.total)).toEqual([0.55, 0.55, 0.55]);
  });

  it('D 를 얹은 뒤에도 결과는 총점 내림차순이다', () => {
    const results = recommend(
      makeInput({ personalCues: ['바다 여행을 함께 갔어요'] }),
      testRuleSetWithMeanings,
    );
    const scores = results.map((r) => r.fitScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(results.length).toBeLessThanOrEqual(MAX_RESULTS);
  });
});

/* ------------------------------------------------------------------ *
 * 4. 가중치 여섯 항이 전부 살아 있다
 * ------------------------------------------------------------------ */

/**
 * 만점 경로용 픽스처.
 * `moon-lily` 는 여섯 항을 동시에 만점으로 만들 수 있는 유일한 후보이고,
 * 나머지 둘은 가격대·미감·색이 모두 달라 D 를 1 로 만들어 주는 짝이다.
 */
const perfectFlowers: FlowerData[] = [
  fakeFlower({
    id: 'moon-lily',
    nameKo: '문릴리',
    priceBand: 1,
    colors: ['blue', 'white'],
    bloomMonths: [6, 7, 8],
    fragranceLevel: 3,
    aestheticTags: ['calm'],
  }),
  fakeFlower({
    id: 'sun-dahlia',
    nameKo: '선달리아',
    priceBand: 2,
    colors: ['red'],
    bloomMonths: [9],
    aestheticTags: ['vivid'],
  }),
  fakeFlower({
    id: 'clay-pansy',
    nameKo: '클레이팬지',
    priceBand: 3,
    colors: ['pink'],
    bloomMonths: [4],
    aestheticTags: ['cute'],
  }),
];

const perfectRules: RecommendationRuleRow[] = [
  { ruleId: 'SC_INTENT', intent: 'confession', flowerId: 'moon-lily', fitScore: 100 },
  { ruleId: 'SC_RELATIONSHIP', relationship: 'lover', flowerId: 'moon-lily', fitScore: 100 },
];

const perfectSet: RuleSet = { flowers: perfectFlowers, rules: perfectRules };

/**
 * 여섯 항을 동시에 만점으로 만드는 입력.
 *   I·R 규칙표 100 · S 7월(개화월) · A 색 2/2 + 태그 1/1 + 향 3/3
 *   P `flower:` 단서 + '바다'(calm·blue·white) + '여름'(6·7·8) 전부 적중
 */
const perfectInput: RecoInput = {
  relationship: 'lover',
  intent: 'confession',
  dateISO: '2026-07-01',
  colorPrefs: ['blue', 'white'],
  recipientTraits: ['calm'],
  fragrancePreference: true,
  personalCues: ['flower:moon-lily', '바다가 보이던 여름 숙소에서요'],
};

describe('가중치 여섯 항', () => {
  it('기본 가중치의 합은 정확히 1.0 이고 스키마가 그것을 강제한다', () => {
    const w = DEFAULT_WEIGHTS;
    expect(w.I + w.R + w.S + w.A + w.P + w.D).toBeCloseTo(1, 10);
    expect(() => weightsSchema.parse(w)).not.toThrow();

    // D 를 빼면(=예전처럼 죽여 두면) 스키마가 막는다.
    expect(() => weightsSchema.parse({ ...w, D: 0 })).toThrow();
  });

  it('만점 조건에서 여섯 항이 모두 1 이고 fitScore 가 100 이다', () => {
    const score = scoreCandidate(perfectFlowers[0], perfectInput, perfectRules, DEFAULT_WEIGHTS);
    expect(score.parts.I).toBe(1);
    expect(score.parts.R).toBe(1);
    expect(score.parts.S).toBe(1);
    expect(score.parts.A).toBe(1);
    expect(score.parts.P).toBe(1);

    const results = recommend(perfectInput, perfectSet);
    const best = results[0];
    expect(best.flower.id).toBe('moon-lily');
    expect(best.fitScore).toBe(100);
  });

  it('D 가 죽어 있던 시절의 상한(85)을 넘는다', () => {
    const results = recommend(perfectInput, perfectSet);
    expect(results[0].fitScore).toBeGreaterThan(85);
  });

  it('같은 입력은 언제나 같은 결과다 (결정성)', () => {
    const once = recommend(perfectInput, perfectSet);
    const twice = recommend(perfectInput, perfectSet);
    expect(twice).toEqual(once);
  });
});
