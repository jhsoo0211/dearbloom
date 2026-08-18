import { describe, expect, it } from 'vitest';

import { buildLandingData, todayReasonLinkOf } from '@/components/landing/landing-build';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';

/**
 * 리드 맺음이 **실제 길**인가 (§1.5n · 크로스 링크 2026-08-18).
 *
 * 리드 ③ 의 맺음 네 벌은 전부 `나머지는 도감에서 천천히 읽어 보셔도 좋아요.` 류 **초대**다.
 * 그 초대가 참인 근거는 그 꽃의 도감 상세에 이야기 전문이 실려 있다는 것인데, 여태 문장
 * 자체는 갈 곳이 없는 글자였다. 이제 그 한 문장이 링크가 된다.
 *
 * 여기서 지키는 선 셋:
 *   ① **문구 불변** — `lead + text` 는 리드 문단과 글자 하나까지 같다. 링크를 입히려고
 *      문장을 다시 쓰거나 자르지 않는다(§1.5n 이 여러 차례 되돌린 자리다).
 *   ② **막다른 링크 0** — 목적지는 언제나 카탈로그에 실재하는 꽃의 상세이고, 카드 덮개
 *      링크와 **같은 곳**이다(두 길이 갈리면 화면이 두 말을 하는 셈이다).
 *   ③ **없으면 안 만든다** — 맺음이 서지 않는 날(훅이 없어 ③ 이 꽃말·침묵으로 물러난 날)은
 *      키 자체가 없다. 없는 길을 만들지 않는다.
 */

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog();
  return cached;
}

/** 2026년 366일 전수 — 리드 테스트와 같은 창(회전 표가 날짜로 도는 것을 전부 지난다). */
function everyDayOf2026(): string[] {
  return Array.from({ length: 366 }, (_, day) =>
    new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10),
  );
}

describe('todayReasonLinkOf — 맺음만 떼어 링크 조각으로', () => {
  it('맺음이 없는 문단(꽃말로 물러난 날)에는 조각을 만들지 않는다', () => {
    const meaningLede =
      '8월 중순이잖아요. 언제 건네도 어색하지 않은 꽃이거든요. ' +
      '‘순수한 마음’이라는 말을 오래 들어 온 꽃이에요.';

    expect(todayReasonLinkOf(meaningLede, 'daisy')).toBeUndefined();
  });

  it('맺음이 문단 한가운데 있으면(꼬리가 아니면) 만들지 않는다 — 꼬리만 잘라 낸다', async () => {
    const landing = buildLandingData(await catalog(), '2026-08-18');
    const closing = landing.todayReasonLink?.text;
    expect(closing).toBeDefined();

    expect(todayReasonLinkOf(`${closing} 그리고 한마디 더 붙였어요.`, 'tulip-white')).toBeUndefined();
  });
});

describe('오늘의 꽃 리드 — 맺음이 도감으로 간다', () => {
  it('실데이터 366일 전부 맺음이 서고, 전부 링크가 된다', async () => {
    const data = await catalog();

    for (const iso of everyDayOf2026()) {
      const landing = buildLandingData(data, iso);
      // 훅은 366일 전부 서는 것이 현 카탈로그의 실측값이다(리드 테스트와 같은 전제).
      expect(landing.todayReasonLink, iso).toBeDefined();
    }
  });

  it('문구를 바꾸지 않는다 — 두 조각을 이으면 리드 문단 그대로다', async () => {
    const data = await catalog();

    for (const iso of everyDayOf2026()) {
      const landing = buildLandingData(data, iso);
      const link = landing.todayReasonLink;
      if (!link) continue;

      expect(`${link.lead}${link.text}`, iso).toBe(landing.todayReason);
      // 링크가 되는 것은 **맺음 한 문장**이지 문단 전체가 아니다.
      expect(link.text.length, iso).toBeLessThan(landing.todayReason.length);
      // 앞 조각의 끝은 공백이라 글자가 맞붙지 않는다(`— 나머지는…`).
      expect(link.lead.endsWith(' '), iso).toBe(true);
      // 맺음은 초대다 — 어디로 가라는 말인지가 문장 안에 있어야 링크 이름이 성립한다.
      expect(link.text, iso).toContain('도감');
    }
  });

  it('막다른 링크가 없다 — 목적지는 카드 덮개 링크와 같은 도감 상세다', async () => {
    const data = await catalog();
    const slugs = new Set(data.flowers.map((flower) => flower.id));

    for (const iso of everyDayOf2026()) {
      const landing = buildLandingData(data, iso);
      const link = landing.todayReasonLink;
      if (!link) continue;

      expect(link.href, iso).toBe(`/flowers/${landing.today.flowerId}`);
      expect(slugs.has(landing.today.flowerId), `${iso} — ${link.href}`).toBe(true);
    }
  });
});
