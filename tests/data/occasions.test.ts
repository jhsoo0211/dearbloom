import { describe, expect, it } from 'vitest';

import { occasionsFor } from '@/lib/data/occasions';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';

/**
 * §1.5h 「이런 날 건네보세요」 — **이관 스냅숏** (2026-08-18).
 *
 * 이 표는 원래 하드코딩 **두 벌**이었다:
 *   · `components/flow/labels.ts` 의 `FLOWER_OCCASIONS` — 결과 화면·도감 상세
 *   · `components/landing/landing-build.ts` 의 `OCCASIONS`  — 랜딩 슬라이드
 * 둘 다 §1.5h 표 5줄에서 출발했지만 각자 자랐고, 겹치는 17종 가운데 **12종의 문구가
 * 서로 달랐다.** 원장을 `content/occasions.csv` 한 파일로 합치면서 **문구는 한 글자도
 * 바꾸지 않기로** 했고(합치는 것은 편집 작업이라 이번 범위 밖), 그 약속을 지키는 것이
 * 아래 두 표다.
 *
 * ⚠ 아래 리터럴은 **걷어 내기 직전의 두 상수를 글자 그대로 옮겨 온 것**이다.
 *   CSV 를 고쳐서 이 테스트가 깨지면, 그것은 이관이 아니라 편집이 일어났다는 뜻이다 —
 *   문구를 정말 바꾸기로 했다면 여기 표도 함께 고치고, 무엇을 왜 바꿨는지 남겨라.
 *   (편집 없이 두 화면 문구를 하나로 합치는 길은 없다. 그 판단은 Advisor 몫이다.)
 */

/** 걷어 낸 `flow/labels.ts` 의 `FLOWER_OCCASIONS` — 글자 그대로. */
const DETAIL_BEFORE: Record<string, string[]> = {
  'tulip-white': ['다툰 다음 날 아침에', '새 출발을 앞둔 사람에게', '오래 미룬 사과를 전할 때'],
  'lily-asiatic': ['새로 시작하는 자리에(결혼·개업)', '오래 존경한 분께'],
  freesia: ['첫 출근을 축하할 때', '고마운 친구에게 가볍게'],
  anemone: ['오래 기다린 마음을 전할 때', '먼저 떠난 이를 기억하는 날에'],
  hellebore: ['위로가 필요한 겨울에', '말없이 곁을 지키고 싶을 때'],
  'rose-red': ['마음을 처음 꺼내는 날에', '함께 지나온 날을 세는 자리에'],
  gerbera: ['기운을 북돋아 주고 싶을 때', '가볍게 축하하고 싶은 날에'],
  hyacinth: ['봄을 먼저 건네고 싶을 때', '오래 기억되길 바라는 자리에'],
  peony: ['크게 축하할 일이 생겼을 때', '초여름의 짧은 계절을 선물할 때'],
  hydrangea: ['집들이에 한 아름 들고 갈 때', '장마 끝의 안부를 물을 때'],
  lavender: ['잠 못 드는 사람에게', '먼 길을 떠나는 이를 배웅할 때'],
  sunflower: ['기운을 크게 북돋고 싶을 때', '한여름의 응원을 보낼 때'],
  carnation: ['부모님께 마음을 전할 때', '오래 돌봐 주신 분께'],
  lisianthus: ['격식이 필요한 자리에', '차분한 축하를 건넬 때'],
  ranunculus: ['봄에 마음을 고백할 때', '작지만 화사한 선물을 하고 싶을 때'],
  'lily-of-the-valley': ['다시 찾아온 행복을 축하할 때', '오월의 인사를 건넬 때'],
  chrysanthemum: ['먼저 떠난 이를 기억하는 날에', '가을의 안부를 물을 때'],
};

/** 걷어 낸 `landing/landing-build.ts` 의 `OCCASIONS` — 글자 그대로. */
const LANDING_BEFORE: Record<string, string[]> = {
  'tulip-white': ['다툰 다음 날 아침에', '새 출발을 앞둔 사람에게', '오래 미룬 사과를 전할 때'],
  'lily-asiatic': ['새로 시작하는 자리에(결혼·개업)', '오래 존경한 분께'],
  freesia: ['첫 출근을 축하할 때', '고마운 친구에게 가볍게'],
  anemone: ['오래 기다린 마음을 전할 때', '먼저 떠난 이를 기억하는 날에'],
  hellebore: ['위로가 필요한 겨울에', '말없이 곁을 지키고 싶을 때'],
  'rose-red': ['오래 미뤄 둔 고백을 할 때', '처음 만난 날을 함께 세는 자리에'],
  gerbera: ['새 자리로 옮기는 동료에게', '기운을 북돋아 주고 싶은 날에'],
  hyacinth: ['봄이 왔다고 먼저 알리고 싶을 때', '조용히 애도를 건네는 자리에'],
  peony: ['귀한 자리를 크게 축하할 때', '수줍은 마음을 대신 전할 때'],
  hydrangea: ['비 오는 날 안부를 물을 때', '오래 함께한 가족에게'],
  lavender: ['잠 못 드는 사람에게', '잠깐 쉬어 가라고 말하고 싶을 때'],
  sunflower: ['기운이 필요한 사람에게', '멀리서 응원을 보낼 때'],
  carnation: ['부모님께 감사를 전할 때', '가르쳐 준 분께 인사드릴 때'],
  lisianthus: ['흰 튤립을 구하기 어려운 계절에', '차분한 축하가 필요한 자리에'],
  ranunculus: ['봄맞이 인사를 건넬 때', '화사한 축하가 필요한 날에'],
  'lily-of-the-valley': ['5월의 첫날, 행운을 빌어 줄 때', '오래 기다린 소식을 축하할 때'],
  chrysanthemum: ['고인을 기억하는 자리에', '어른께 절기 인사를 드릴 때'],
  daisy: ['괜찮냐고 묻고 싶은 날에', '같은 편이라고 말해주고 싶을 때'],
  'sweet-pea': ['졸업하는 사람에게', '떠나는 이를 웃으며 배웅할 때'],
  gladiolus: ['오래 준비한 시험이 끝난 날에', '큰 무대를 마치고 내려온 사람에게'],
  dahlia: ['한껏 차려입은 자리에', '오래 기억될 축하를 하고 싶을 때'],
  zinnia: ['멀리 있는 친구를 떠올릴 때', '오래된 사이라고 말하고 싶을 때'],
  aster: ['믿고 있다고 말해주고 싶을 때', '가을 초입의 안부를 물을 때'],
  calendula: ['아쉬운 이별을 담담히 건널 때', '달이 바뀌는 첫날에 안부를 물을 때'],
  cyclamen: ['말수 적은 사람에게', '겨울 창가에 둘 화분을 고를 때'],
  geranium: ['오래된 친구에게 고맙다고 말할 때', '새집 창가를 밝혀 주고 싶을 때'],
  primula: ['봄이 오기 전에 먼저 인사할 때', '첫 마음을 조심스레 꺼낼 때'],
  stock: ['오래 함께한 사이를 기념할 때', '향으로 방을 채워 주고 싶을 때'],
  delphinium: ['훌쩍 떠나는 사람에게', '맑은 여름 인사를 건넬 때'],
  amaryllis: ['자랑스러운 소식을 들었을 때', '연말에 오래 두고 볼 선물을 고를 때'],
  cornflower: ['섬세한 사람에게', '기억하고 있다고 전하고 싶을 때'],
  crocus: ['새 학기를 시작하는 사람에게', '눈 속에서 봄을 기다리는 날에'],
  'water-lily': ['마음을 가라앉히고 싶은 사람에게', '한여름의 안부를 물을 때'],
};

/**
 * 상황 예시가 아직 한 줄도 없는 종.
 *
 * **비어 있는 것이 정상 값이다.** 문구를 짓는 것은 편집 작업이라, 없는 자리를 급히
 * 메우면 §1.5h 가 요구한 "rules·stories 의 intent 와 결이 같은 문구"가 아니라 그냥
 * 지어낸 말이 된다. 화면은 빈 배열이면 구획 자체를 세우지 않는다.
 * (26종 = seed-v4 확장 14종 + 정식 도감 확장 배치 2 의 12종.)
 */
const WITHOUT_OCCASIONS = [
  'narcissus',
  'forget-me-not',
  'cherry-blossom',
  'camellia',
  'violet',
  'iris',
  'marigold',
  'corn-poppy',
  'jasmine',
  'babys-breath',
  'cosmos',
  'magnolia',
  'pansy',
  'poinsettia',
  // ── 정식 도감 확장 배치 2 (47종 → 59종) ──
  'phalaenopsis',
  'alstroemeria',
  'anthurium',
  'gardenia',
  'eucalyptus',
  'statice',
  'mimosa',
  'bouvardia',
  'scabiosa',
  'plum-blossom',
  'azalea',
  'cotton',
];

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog();
  return cached;
}

describe('이관 — 문구가 한 글자도 바뀌지 않았다', () => {
  it('결과·도감(detail)이 걷어 내기 직전과 같은 줄을 같은 순서로 받는다', async () => {
    const data = await catalog();
    for (const [flowerId, before] of Object.entries(DETAIL_BEFORE)) {
      expect(occasionsFor(data.occasions, flowerId, 'detail'), flowerId).toEqual(before);
    }
  });

  it('랜딩(landing)이 걷어 내기 직전과 같은 줄을 같은 순서로 받는다', async () => {
    const data = await catalog();
    for (const [flowerId, before] of Object.entries(LANDING_BEFORE)) {
      expect(occasionsFor(data.occasions, flowerId, 'landing'), flowerId).toEqual(before);
    }
  });

  it('없던 꽃에 문구가 생기지 않았다 — 빈 자리는 빈 채로 옮겨 왔다', async () => {
    const data = await catalog();

    for (const flowerId of WITHOUT_OCCASIONS) {
      expect(occasionsFor(data.occasions, flowerId, 'detail'), flowerId).toEqual([]);
      expect(occasionsFor(data.occasions, flowerId, 'landing'), flowerId).toEqual([]);
    }

    // 두 표 밖의 꽃이 CSV 에 몰래 들어오지 않았는지도 함께 본다.
    const covered = new Set(data.occasions.map((row) => row.flowerId));
    expect([...covered].sort()).toEqual([...new Set(Object.keys(LANDING_BEFORE))].sort());
    expect(covered.size + WITHOUT_OCCASIONS.length).toBe(data.flowers.length);
  });
});

describe('surface 가리기 규칙', () => {
  it('두 화면이 다른 줄을 받는 꽃이 정확히 12종이다', async () => {
    const data = await catalog();
    const split = data.flowers.filter((flower) => {
      const detail = occasionsFor(data.occasions, flower.id, 'detail');
      const landing = occasionsFor(data.occasions, flower.id, 'landing');
      return detail.length > 0 && landing.length > 0 && detail.join('|') !== landing.join('|');
    });

    // 이 숫자가 줄면 두 화면 문구를 합쳤다는 뜻이다 — 좋은 일이지만, 이관이 아니라 편집이다.
    expect(split.map((flower) => flower.id).sort()).toEqual(
      [
        'carnation',
        'chrysanthemum',
        'gerbera',
        'hyacinth',
        'hydrangea',
        'lavender',
        'lily-of-the-valley',
        'lisianthus',
        'peony',
        'ranunculus',
        'rose-red',
        'sunflower',
      ].sort(),
    );
  });

  it('§1.5h 표 5종은 공용 한 벌이다 — 두 화면이 같은 줄을 본다', async () => {
    const data = await catalog();
    for (const flowerId of ['tulip-white', 'lily-asiatic', 'freesia', 'anemone', 'hellebore']) {
      const rows = data.occasions.filter((row) => row.flowerId === flowerId);
      expect(rows.length, flowerId).toBeGreaterThan(0);
      // 공용 행이라는 것은 `surface` 가 비어 있다는 뜻이다.
      expect(new Set(rows.map((row) => row.surface)), flowerId).toEqual(new Set(['']));
      expect(occasionsFor(data.occasions, flowerId, 'detail'), flowerId).toEqual(
        occasionsFor(data.occasions, flowerId, 'landing'),
      );
    }
  });

  it('화면별 행이 있으면 공용 행은 쓰이지 않는다 (규칙 자체)', () => {
    const rows = [
      { flowerId: 'x', surface: '', occasionKo: '공용 1' },
      { flowerId: 'x', surface: 'landing', occasionKo: '랜딩 1' },
      { flowerId: 'y', surface: '', occasionKo: '공용 2' },
    ];

    expect(occasionsFor(rows, 'x', 'landing')).toEqual(['랜딩 1']);
    // detail 에는 화면별 행이 없으니 공용으로 떨어진다.
    expect(occasionsFor(rows, 'x', 'detail')).toEqual(['공용 1']);
    expect(occasionsFor(rows, 'y', 'detail')).toEqual(['공용 2']);
    expect(occasionsFor(rows, 'z', 'detail')).toEqual([]);
  });
});

describe('원장이 한 벌이다 — 하드코딩이 남아 있지 않다', () => {
  it('두 화면 모두 카탈로그에서 읽는다', async () => {
    const { readFileSync } = await import('node:fs');
    const path = await import('node:path');
    const root = path.resolve(__dirname, '../..');
    const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8');

    for (const rel of ['src/components/flow/labels.ts', 'src/components/landing/landing-build.ts']) {
      const code = read(rel);
      // 표가 다시 서면 걸린다. 문구 한 줄을 골라 소스에서 찾는다.
      expect(code, rel).not.toContain('다툰 다음 날 아침에');
      expect(code, rel).not.toContain('오래 존경한 분께');
    }

    expect(read('src/components/landing/landing-build.ts')).toContain('occasionsFor');
  });
});
