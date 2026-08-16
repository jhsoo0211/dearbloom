import { describe, expect, it } from 'vitest';

import { buildFlowerDetail, buildFlowerIndex } from '@/components/flowers/data';
import { buildLandingData } from '@/components/landing/landing-build';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';

/**
 * 탄생화가 **화면 뷰모델까지** 살아 오는지.
 *
 * 조회 규칙 자체는 `tests/data/birth-flowers.test.ts` 가 픽스처로 본다. 여기서 보는 것은
 * 실데이터를 통과시켰을 때 세 자리가 실제로 채워지는가다 — 랜딩 각주 한 줄, 도감 목록의
 * 달력, 도감 상세의 "놓인 날".
 *
 * 그리고 하나 더: **워딩 대전제**(`docs/birth-flowers-research.md` §2·§8). 이 표는
 * 전통적으로 정해진 탄생화가 아니라 널리 통하게 된 목록이라, 뷰모델이 만들어 내는 문자열에
 * "전통"·"공식"·"예로부터" 같은 단정이 섞이면 안 된다. 데이터가 늘거나 문구를 손댈 때
 * 그 선을 넘는 순간 여기서 걸린다.
 */

/** 화면 문구가 절대 주장하면 안 되는 말(§2 — 계보상 사실이 아니다). */
const FORBIDDEN = ['전통', '공식', '예로부터', '정해진 탄생화'];

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog();
  return cached;
}

describe('랜딩 — 오늘의 탄생화 각주', () => {
  it('366일 전수라 어느 날짜로 지어도 한 줄이 선다', async () => {
    const data = buildLandingData(await catalog(), '2026-08-16');

    expect(data.birthFlower).toBeDefined();
    expect(data.birthFlower?.dateLabel).toBe('8월 16일');
    expect(data.birthFlower?.name).not.toBe('');
    expect(data.birthFlower?.meaning).not.toBe('');
  });

  it('2월 29일에도 각주가 빈손이 되지 않는다', async () => {
    const data = buildLandingData(await catalog(), '2028-02-29');

    expect(data.birthFlower).toMatchObject({
      dateLabel: '2월 29일',
      name: '아르메리아',
      meaning: '배려',
    });
  });

  it('날짜는 todayISO 문자열에서 쪼갠다 — 시간대에 밀리지 않는다', async () => {
    // `new Date('2026-01-01')` 로 되돌리면 UTC 파싱이라 KST 밖 서버에서 12/31 이 나온다.
    const data = buildLandingData(await catalog(), '2026-01-01');
    expect(data.birthFlower?.dateLabel).toBe('1월 1일');
    expect(data.birthFlower?.name).toBe('스노드롭');
  });

  it('카탈로그에 있는 꽃이면 도감 링크가 붙고, 없으면 링크 없이 이름만 남는다', async () => {
    const linked = buildLandingData(await catalog(), '2026-01-02'); // 노랑수선화 → narcissus
    expect(linked.birthFlower?.href).toBe('/flowers/narcissus');

    const unlinked = buildLandingData(await catalog(), '2026-01-01'); // 스노드롭 — 도감에 없다
    expect(unlinked.birthFlower?.href).toBeUndefined();
  });

  it('꽃말 뒤 서술격 조사를 받침으로 가른다', async () => {
    // 받침 있음(`희망`) → 이에요
    expect(buildLandingData(await catalog(), '2026-01-01').birthFlower?.meaningCopula).toBe(
      '이에요',
    );
    // 받침 없음(`인내`) → 예요
    expect(buildLandingData(await catalog(), '2026-01-05').birthFlower?.meaningCopula).toBe('예요');
  });
});

describe('도감 목록 — 생일 꽃 찾기가 쓰는 달력', () => {
  it('12개월 · 2월은 29일까지', async () => {
    const { birthCalendar } = buildFlowerIndex(await catalog());

    expect(birthCalendar).toEqual([31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
  });

  it('366행 자체는 목록 뷰모델에 실리지 않는다 (하루치는 서버 액션이 가져온다)', async () => {
    const index = buildFlowerIndex(await catalog());

    // 첫 응답에 60KB 짜리 표가 얹히면 성능 리뷰 P1-7 이 고친 문제가 그대로 재발한다.
    expect(index).not.toHaveProperty('birthFlowers');
    expect(JSON.stringify(index)).not.toContain('아르메리아');
  });
});

describe('도감 상세 — 이 꽃이 탄생화로 놓인 날', () => {
  it('여러 날에 걸린 꽃은 달력 순으로 이어 붙인다', async () => {
    const rose = buildFlowerDetail(await catalog(), 'rose-red');

    expect(rose?.birthDays).toBe(
      '6월 1일 · 6월 4일 · 6월 19일 · 7월 15일 · 7월 17일 · 7월 18일 · 7월 21일 · 7월 23일 · 10월 16일 · 10월 27일',
    );
  });

  it('표에 안 걸린 꽃은 키 자체가 없다 (화면이 줄을 세우지 않는다)', async () => {
    const peony = buildFlowerDetail(await catalog(), 'peony');

    expect(peony).toBeDefined();
    expect(peony?.birthDays).toBeUndefined();
  });

  it('표에 걸린 24종 전부가 한 줄을 갖는다', async () => {
    const data = await catalog();
    const linkedIds = new Set(
      data.birthFlowers
        .map((row) => row.flowerId)
        .filter((id): id is string => id !== undefined),
    );

    expect(linkedIds.size).toBe(24);
    for (const id of linkedIds) {
      expect(buildFlowerDetail(data, id)?.birthDays, `${id} 의 탄생화 줄`).toBeTruthy();
    }
  });
});

describe('워딩 대전제 — 이 표는 전통이 아니다 (§2)', () => {
  it('랜딩 각주가 계보를 단정하지 않는다', async () => {
    const line = buildLandingData(await catalog(), '2026-08-16').birthFlower;
    const text = `${line?.dateLabel}${line?.name}${line?.meaning}${line?.meaningCopula}`;

    for (const word of FORBIDDEN) expect(text).not.toContain(word);
  });

  it('도감 상세의 날짜 줄이 계보를 단정하지 않는다', async () => {
    const data = await catalog();
    for (const id of ['rose-red', 'chrysanthemum', 'narcissus']) {
      const line = buildFlowerDetail(data, id)?.birthDays ?? '';
      for (const word of FORBIDDEN) expect(line, `${id}`).not.toContain(word);
    }
  });
});
