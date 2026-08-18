import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseSubmission, prepareResult } from '@/app/recommend/build-result';
import { readPeriodLabel } from '@/components/reads/expiry';
import { loadCatalog } from '@/lib/data/catalog';
import { readFlowerIds, readsForFlowerInScreenOrder } from '@/lib/data/reads-links';
import { INTENTS } from '@/lib/engine';
import type { FlowOptionView, WizardSubmission } from '@/components/flow/types';

/**
 * §1.5t **「이 꽃과 이어지는 읽을거리」** — 결과 화면에 붙는 곁들임의 그물.
 *
 * 여기서 지키는 것은 화면 모양이 아니라 **서버가 무엇을 실어 보내는가**다. 셋이 핵심이다.
 *   ① 이어진 꽃에만 붙는다(없는 꽃은 필드 자체가 없다 — 빈 구획을 만들지 않는다).
 *   ② 원장 54건을 통째로 싣지 않는다. 그 꽃 것만, 최대 세 장.
 *   ③ **만료를 서버가 판정하지 않는다.** 날짜는 원본 문자열로 건너가고 거르기는
 *      브라우저의 몫이다 — 서버가 거르면 배포한 날이 정적 HTML 에 굳는다(§7-2).
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

/** 한 안을 실제 조립 경로로 만들어 본다 — 손으로 세운 값이 아니라 서버가 내는 값을 잰다. */
async function optionsFor(overrides: Partial<WizardSubmission> = {}): Promise<FlowOptionView[]> {
  const catalog = await loadCatalog();
  const received = parseSubmission(submission(overrides));
  if (!received.ok) throw new Error(received.message);
  const prepared = prepareResult(received.answers, catalog);
  if (!prepared.ok) throw new Error(prepared.message);
  return prepared.draft.options;
}

/**
 * 어휘 여덟 마음을 다 돌려 본 3안 전부.
 *
 * 한 조합만 재면 그 조합이 뽑는 세 꽃에 우연히 읽을거리가 없는 날 그물이 통째로 비어
 * 통과해 버린다(초록 불이 켜진 채 아무것도 안 재는 상태). 어휘를 다 도는 대신
 * 한 번만 계산해 두고 나눠 쓴다.
 */
let cachedOptions: FlowOptionView[] | null = null;

async function everyOption(): Promise<FlowOptionView[]> {
  if (cachedOptions) return cachedOptions;
  const collected: FlowOptionView[] = [];
  for (const intent of INTENTS) {
    for (const relationship of ['lover', 'friend', 'family'] as const) {
      collected.push(...(await optionsFor({ intent, relationship })));
    }
  }
  cachedOptions = collected;
  return collected;
}

/** 그중 읽을거리가 붙은 카드 전부. 하나도 없으면 그물이 아무것도 재지 않은 것이다. */
async function everyReadCard() {
  const cards = (await everyOption()).flatMap((option) => option.reads ?? []);
  expect(cards.length, '읽을거리가 붙은 안이 하나도 없다 — 그물이 헛돌고 있다').toBeGreaterThan(0);
  return cards;
}

/** 원장이 실제로 이어 둔 꽃 하나(카탈로그를 바꿔도 이 테스트가 따라간다). */
async function linkedFlowerId(): Promise<string> {
  const catalog = await loadCatalog();
  for (const flower of catalog.flowers) {
    if (readsForFlowerInScreenOrder(flower.id, catalog.reads).length > 0) return flower.id;
  }
  throw new Error('원장이 도감을 가리키는 행이 하나도 없다 — reads.csv 의 links_to 를 보라.');
}

describe('§1.5t 결과 payload — 이어진 꽃에만, 그 꽃 것만', () => {
  it('원장이 이어 둔 꽃은 카드를 받는다 — 실제로 그 꽃의 행들이다', async () => {
    const catalog = await loadCatalog();
    const flowerId = await linkedFlowerId();
    const expected = readsForFlowerInScreenOrder(flowerId, catalog.reads);
    expect(expected.length).toBeGreaterThan(0);

    // 조립 함수가 그대로 쓰는 규칙이라, 같은 입력에서 같은 앞머리가 나와야 한다.
    const ids = expected.slice(0, 3).map((row) => row.readId);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('이어지지 않은 꽃은 `reads` 필드 자체가 없다 — 빈 배열도 아니다', async () => {
    const catalog = await loadCatalog();
    const linked = new Set(catalog.reads.flatMap(readFlowerIds));
    const orphan = catalog.flowers.find((flower) => !linked.has(flower.id));
    expect(orphan).toBeDefined();
    expect(readsForFlowerInScreenOrder(orphan!.id, catalog.reads)).toEqual([]);
  });

  it('한 안에 실리는 카드는 세 장을 넘지 않는다 — 여섯 건이 걸린 꽃도 있다', async () => {
    await everyReadCard();
    for (const option of await everyOption()) {
      if (!option.reads) continue;
      // 빈 배열을 실어 보내지 않는다(있으면 화면이 빈 구획을 세울 판단 재료를 잃는다).
      expect(option.reads.length, option.flowerId).toBeGreaterThan(0);
      expect(option.reads.length, option.flowerId).toBeLessThanOrEqual(3);
    }
  });

  it('실린 카드는 전부 **그 안의 꽃**이 가리키는 행이다 — 남의 꽃 글이 섞이지 않는다', async () => {
    const catalog = await loadCatalog();
    const byId = new Map(catalog.reads.map((row) => [row.readId, row]));

    for (const option of await everyOption()) {
      for (const card of option.reads ?? []) {
        const row = byId.get(card.id);
        expect(row, card.id).toBeDefined();
        expect(readFlowerIds(row!), `${option.flowerId} ← ${card.id}`).toContain(option.flowerId);
      }
      // 한 안에 같은 글이 두 번 서지 않는다.
      const ids = (option.reads ?? []).map((card) => card.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('한 안이 원장 54건을 통째로 들고 가지 않는다 — payload 무게의 상한', async () => {
    const catalog = await loadCatalog();
    for (const option of await everyOption()) {
      const bytes = JSON.stringify(option.reads ?? []).length;
      expect(bytes, option.flowerId).toBeLessThan(1200);
    }
    // 참고: 원장을 통째로 실으면 이 값이 수만 바이트가 된다.
    expect(JSON.stringify(catalog.reads).length).toBeGreaterThan(10_000);
  });
});

describe('§1.5t 카드 한 장 — 무엇을 담고 무엇을 담지 않는가', () => {
  it('제목·출처·주소·한 줄이 다 차 있고, 주소는 바깥 https 다', async () => {
    for (const card of await everyReadCard()) {
      expect(card.title.length).toBeGreaterThan(0);
      expect(card.sourceTitle.length).toBeGreaterThan(0);
      expect(card.summary.length).toBeGreaterThan(0);
      expect(card.url.startsWith('https://'), card.url).toBe(true);
    }
  });

  it('기간 문구는 `/reads` 와 **같은 함수**를 지난다 — 두 화면이 같은 날짜를 같게 말한다', async () => {
    const catalog = await loadCatalog();
    const byId = new Map(catalog.reads.map((row) => [row.readId, row]));

    for (const card of await everyReadCard()) {
      const row = byId.get(card.id)!;
      expect(card.periodLabel).toBe(readPeriodLabel(row.startsAt, row.endsAt));
      // 행사만 기간을 갖는다 — 글에 기간이 붙어 있으면 그건 없는 일정을 지어낸 것이다.
      if (card.periodLabel !== undefined) expect(row.kind).toBe('event');
    }
  });

  it('날짜는 **원본 문자열 그대로** 간다 — 만료 판정은 브라우저의 몫이다', async () => {
    const catalog = await loadCatalog();
    const byId = new Map(catalog.reads.map((row) => [row.readId, row]));

    let dated = 0;
    for (const card of await everyReadCard()) {
      const row = byId.get(card.id)!;
      expect(card.startsAt).toBe(row.startsAt || undefined);
      expect(card.endsAt).toBe(row.endsAt || undefined);
      if (card.endsAt !== undefined) dated += 1;
    }
    // 날짜를 가진 카드가 하나는 있어야 이 규칙을 실제로 잰 것이다.
    expect(dated).toBeGreaterThan(0);
  });

  it('`온라인` 은 지역 자리에 세우지 않는다 — `/reads` 와 같은 규칙', async () => {
    for (const card of await everyReadCard()) expect(card.region).not.toBe('온라인');
  });

  it('이미지 칸도 태그 칸도 없다 — 활자 카드다(남의 썸네일을 걸지 않는다)', async () => {
    for (const card of await everyReadCard()) {
      expect(Object.keys(card)).not.toContain('imageUrl');
      expect(Object.keys(card)).not.toContain('tags');
    }
  });
});

describe('§1.5t 화면과 데모 쌍둥이', () => {
  async function source(relative: string): Promise<string> {
    return readFile(path.resolve(process.cwd(), relative), 'utf8');
  }

  it('화면은 만료를 `/reads` 와 같은 함수로 거르고, 스스로 시계를 읽지 않는다', async () => {
    const text = await source('src/components/flow/ResultView.tsx');
    expect(text).toContain("from '@/components/reads/expiry'");
    expect(text).toContain('hasEnded');
    // 서버 스냅숏이 null 인 useSyncExternalStore — 첫 렌더가 서버 HTML 과 어긋나지 않게.
    expect(text).toContain('useSyncExternalStore');
  });

  it('화면에 「읽을거리 더 보기」 내부 링크가 있다 — 목록으로 가는 길이 막히지 않는다', async () => {
    const text = await source('src/components/flow/ResultView.tsx');
    expect(text).toContain('읽을거리 더 보기');
    expect(text).toContain('href="/reads"');
  });

  it('데모 번들 생성기가 도감을 가리키는 행을 싣는다 — 데모에서만 구획이 사라지지 않게', async () => {
    const text = await source('scripts/build-demo-catalog.mjs');
    expect(text).toContain('flowerLinkedReads');
    expect(text).toContain('reads: flowerLinkedReads');
  });
});
