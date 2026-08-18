import { describe, expect, it } from 'vitest';

import {
  DEMO_MESSAGE_VARIANTS,
  demoVariantBody,
  demoVariantsOutOfBand,
  hasDemoVariant,
} from '@/lib/demo/message-variants';
import { loadCatalog } from '@/lib/data/catalog';
import { MESSAGE_LENGTH_CHARS } from '@/lib/llm/prompt';
import { INTENTS, TONES } from '@/lib/engine';

/**
 * 정적 데모의 **예문 변주** — `새로 받기` 가 실제로 돌게 하는 문안.
 *
 * 데모는 "안 깨지는 화면"이 아니라 **전 기능이 도는 화면**이어야 한다(2026-08-18 사용자
 * 확정). 원장(`templates.csv`)이 길이 축을 갖춘 뒤로 길이 토글은 원장만으로 돌지만,
 * `새로 받기` 는 길이마다 **원장 아닌 한 벌**이 있어야 성립한다 — 그 한 벌이 이 표다.
 *
 * 여기서 지키는 것
 *   ① **원장의 전 조합을 덮는다** — 어떤 마음·톤으로 들어와도 회전이 도는가.
 *   ② **화면이 말하는 분량 띠 안이다** — 140자라고 해 놓고 200자를 보여 주지 않는가.
 *   ③ **회전이 결정적이고 실제로 갈린다** — 눌렀는데 같은 문장이 오지 않는가.
 *   ④ **원장을 베끼지 않았다** — 축약본이 아니라 다시 쓴 문장인가.
 */

describe('데모 예문 변주 — 덮는 범위', () => {
  it('원장(templates.csv)의 전 조합을 덮는다', async () => {
    const catalog = await loadCatalog();
    for (const template of catalog.templates) {
      const variant = DEMO_MESSAGE_VARIANTS[template.intent]?.[template.tone];
      expect(variant, `${template.intent}/${template.tone}`).toBeDefined();
    }
  });

  it('원장에 없는 조합을 지어내지 않는다', async () => {
    const catalog = await loadCatalog();
    const owned = new Set(catalog.templates.map((row) => `${row.intent}/${row.tone}`));
    for (const [intent, tones] of Object.entries(DEMO_MESSAGE_VARIANTS)) {
      for (const tone of Object.keys(tones)) {
        expect(owned.has(`${intent}/${tone}`), `${intent}/${tone}`).toBe(true);
      }
    }
  });

  it('사과에는 유쾌 톤이 없다 (§1.5)', () => {
    expect(DEMO_MESSAGE_VARIANTS.apology?.playful).toBeUndefined();
  });

  it('`hasDemoVariant` 가 표와 어긋나지 않는다 (화면이 버튼을 세우는 근거다)', () => {
    for (const intent of [...INTENTS, 'bogus']) {
      for (const tone of [...TONES, 'bogus']) {
        const owned = DEMO_MESSAGE_VARIANTS[intent]?.[tone as 'plain'] !== undefined;
        expect(hasDemoVariant(intent, tone), `${intent}/${tone}`).toBe(owned);
      }
    }
  });
});

describe('데모 예문 변주 — 분량', () => {
  it('짧게·보통 모두 화면이 말하는 띠 안이다', () => {
    expect(demoVariantsOutOfBand()).toEqual([]);
  });

  it('띠는 생성 경로가 지키는 그 띠다 — 데모와 본배포가 다른 분량을 보이지 않게', () => {
    for (const tones of Object.values(DEMO_MESSAGE_VARIANTS)) {
      for (const variant of Object.values(tones)) {
        expect(variant.shortAlt.length).toBeGreaterThanOrEqual(MESSAGE_LENGTH_CHARS.short.min);
        expect(variant.shortAlt.length).toBeLessThanOrEqual(MESSAGE_LENGTH_CHARS.short.max);
        expect(variant.mediumAlt.length).toBeGreaterThanOrEqual(MESSAGE_LENGTH_CHARS.medium.min);
        expect(variant.mediumAlt.length).toBeLessThanOrEqual(MESSAGE_LENGTH_CHARS.medium.max);
      }
    }
  });

  it('보통이 짧게보다 확실히 길다 — 2026-08-18 신고가 바로 이 자리였다', () => {
    for (const tones of Object.values(DEMO_MESSAGE_VARIANTS)) {
      for (const variant of Object.values(tones)) {
        expect(variant.mediumAlt.length).toBeGreaterThan(variant.shortAlt.length * 2);
      }
    }
  });
});

describe('데모 예문 변주 — 회전', () => {
  it('두 길이 모두 원장 ↔ 손으로 쓴 한 벌을 오간다', () => {
    for (const length of ['short', 'medium'] as const) {
      // 짝수 번째는 `undefined` = "지금 문장(원장)을 그대로 둔다".
      expect(demoVariantBody('gratitude', 'plain', length, 0), length).toBeUndefined();
      expect(demoVariantBody('gratitude', 'plain', length, 2), length).toBeUndefined();
      const alt = demoVariantBody('gratitude', 'plain', length, 1);
      expect(alt, length).toBeDefined();
      // 결정적이다 — 같은 차례면 같은 문장이다.
      expect(demoVariantBody('gratitude', 'plain', length, 3), length).toBe(alt);
    }
  });

  it('같은 차례라도 길이가 다르면 다른 문장이다', () => {
    const short = demoVariantBody('gratitude', 'plain', 'short', 1);
    const medium = demoVariantBody('gratitude', 'plain', 'medium', 1);
    expect(short).toBeDefined();
    expect(medium).toBeDefined();
    expect(short).not.toBe(medium);
  });

  it('변주가 없는 조합은 조용히 빈손이다 (지어내지 않는다)', () => {
    expect(demoVariantBody('apology', 'playful', 'short', 1)).toBeUndefined();
    expect(demoVariantBody('nonexistent', 'plain', 'short', 1)).toBeUndefined();
  });

  it('어휘 밖 값이 들어와도 던지지 않는다', () => {
    for (const intent of [...INTENTS, 'bogus']) {
      for (const tone of [...TONES, 'bogus']) {
        expect(() => demoVariantBody(intent, tone, 'short', 7)).not.toThrow();
      }
    }
  });
});

describe('데모 예문 변주 — 문안', () => {
  it('원장 문장을 그대로 베끼지 않았다', async () => {
    const catalog = await loadCatalog();
    const ledger = new Set(catalog.templates.map((row) => row.templateText.trim()));
    for (const tones of Object.values(DEMO_MESSAGE_VARIANTS)) {
      for (const variant of Object.values(tones)) {
        for (const text of [variant.shortAlt, variant.mediumAlt]) {
          expect(ledger.has(text.trim()), text).toBe(false);
        }
      }
    }
  });

  it('짧은 벌은 긴 예문의 앞부분을 자른 것이 아니다', async () => {
    const catalog = await loadCatalog();
    for (const [intent, tones] of Object.entries(DEMO_MESSAGE_VARIANTS)) {
      for (const [tone, variant] of Object.entries(tones)) {
        // 같은 조합의 원장 행 **전부**와 견준다(길이마다 한 행씩 있다).
        const ledger = catalog.templates.filter((row) => row.intent === intent && row.tone === tone);
        for (const row of ledger) {
          expect(row.templateText.startsWith(variant.shortAlt), `${intent}/${tone}`).toBe(false);
        }
      }
    }
  });

  it('같은 문장이 두 번 실리지 않는다', () => {
    const seen = new Set<string>();
    for (const tones of Object.values(DEMO_MESSAGE_VARIANTS)) {
      for (const variant of Object.values(tones)) {
        for (const text of [variant.shortAlt, variant.mediumAlt]) {
          expect(seen.has(text), text).toBe(false);
          seen.add(text);
        }
      }
    }
  });

  it('해요체·합쇼체로 끝나고 지시형·가격 언급을 쓰지 않는다 (§1.5d)', () => {
    for (const tones of Object.values(DEMO_MESSAGE_VARIANTS)) {
      for (const variant of Object.values(tones)) {
        for (const text of [variant.shortAlt, variant.mediumAlt]) {
          // 해요체(…요 · …죠)와 합쇼체(…니다). 사과·감사 자리는 합쇼체가 더 맞을 때가 있다.
          expect(text.trim(), text).toMatch(/(요|죠|니다)[.?!]$/);
          expect(text, text).not.toMatch(/힘내세요|기운 내세요|파이팅/);
          expect(text, text).not.toMatch(/원|가격|저렴|비싼/);
        }
      }
    }
  });
});
