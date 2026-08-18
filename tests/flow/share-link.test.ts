import { describe, expect, it } from 'vitest';

import {
  SHARE_PARAM,
  SHARE_PATH,
  decodeSharePlan,
  encodeSharePlan,
  shareCodeFromSearch,
  shareUrl,
} from '@/components/flow/share-link';
import { prepareResult, parseSubmission } from '@/app/recommend/build-result';
import { loadCatalog } from '@/lib/data/catalog';
import { INTENTS, RELATIONSHIPS } from '@/lib/engine';
import type { WizardSubmission } from '@/components/flow/types';

/**
 * 「이 결과 건네주기」 링크의 **경계**.
 *
 * 링크는 남에게 건네지는 물건이고, 주소창에 있는 동안 누구나 고칠 수 있다.
 * 그래서 여기서 지키는 것은 두 가지다.
 *
 *   ① **무엇이 실리지 않는가** — 자유 서술(수신자 메모·에피소드), `직접 쓸게요` 한 줄,
 *      멘트 본문. 하나라도 새면 그 순간이 곧 유출이고 되돌릴 방법이 없다.
 *   ② **남이 고친 부호를 믿지 않는가** — 어휘 밖 값·모양 밖 값·다른 판은 전부 `null`.
 *
 * ③ 길이(250자)는 방식 A(무저장)가 성립하는 조건이다. 넘기 시작하면 압축이나 서버
 *   저장으로 밀리게 되므로 카탈로그 **전종의 최악 조합**으로 잰다.
 */

function submission(overrides: Partial<WizardSubmission> = {}): WizardSubmission {
  return {
    relationship: 'friend',
    relationshipDetail: '',
    intent: 'gratitude',
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

async function payloadFor(overrides: Partial<WizardSubmission> = {}) {
  const catalog = await loadCatalog();
  const received = parseSubmission(submission(overrides));
  expect(received.ok).toBe(true);
  if (!received.ok) throw new Error('unreachable');
  const prepared = prepareResult(received.answers, catalog);
  expect(prepared.ok).toBe(true);
  if (!prepared.ok) throw new Error('unreachable');
  return prepared.draft;
}

describe('공유 부호 — 오가는 값', () => {
  it('실은 대로 되읽는다', () => {
    const code = encodeSharePlan({
      flowerIds: ['rose-red', 'freesia', 'lily-of-the-valley'],
      relationship: 'lover',
      intent: 'confession',
      dateISO: '2026-08-19',
    });

    expect(decodeSharePlan(code)).toEqual({
      flowerIds: ['rose-red', 'freesia', 'lily-of-the-valley'],
      relationship: 'lover',
      intent: 'confession',
      dateISO: '2026-08-19',
    });
  });

  it('날짜를 고르지 않았으면 부호에도 없다', () => {
    const code = encodeSharePlan({
      flowerIds: ['freesia'],
      relationship: 'friend',
      intent: 'celebration',
    });
    expect(decodeSharePlan(code)?.dateISO).toBeUndefined();
  });

  it('같은 꽃을 두 번 실은 부호는 한 번만 세운다', () => {
    const code = encodeSharePlan({
      flowerIds: ['freesia', 'freesia', 'rose-red'],
      relationship: 'friend',
      intent: 'celebration',
    });
    expect(decodeSharePlan(code)?.flowerIds).toEqual(['freesia', 'rose-red']);
  });

  it('관계·마음 어휘 전종이 오간다', () => {
    for (const relationship of RELATIONSHIPS) {
      for (const intent of INTENTS) {
        const plan = { flowerIds: ['freesia'], relationship, intent };
        expect(decodeSharePlan(encodeSharePlan(plan))).toEqual(plan);
      }
    }
  });
});

describe('공유 부호 — 남이 고친 부호', () => {
  const badCodes = [
    '',
    'not-base64!!',
    // 판이 다르다
    Buffer.from(JSON.stringify({ v: 2, f: ['freesia'], r: 'friend', i: 'gratitude' })).toString(
      'base64url',
    ),
    // 어휘 밖 관계
    Buffer.from(JSON.stringify({ v: 1, f: ['freesia'], r: 'boss', i: 'gratitude' })).toString(
      'base64url',
    ),
    // 어휘 밖 마음
    Buffer.from(JSON.stringify({ v: 1, f: ['freesia'], r: 'friend', i: 'revenge' })).toString(
      'base64url',
    ),
    // 꽃 id 모양이 아니다(경로 조작 시도)
    Buffer.from(
      JSON.stringify({ v: 1, f: ['../../etc/passwd'], r: 'friend', i: 'gratitude' }),
    ).toString('base64url'),
    // 꽃이 하나도 없다
    Buffer.from(JSON.stringify({ v: 1, f: [], r: 'friend', i: 'gratitude' })).toString('base64url'),
    // 셋보다 많다
    Buffer.from(
      JSON.stringify({ v: 1, f: ['a', 'b', 'c', 'd'], r: 'friend', i: 'gratitude' }),
    ).toString('base64url'),
    // 날짜 모양이 아니다
    Buffer.from(
      JSON.stringify({ v: 1, f: ['freesia'], r: 'friend', i: 'gratitude', d: '내일' }),
    ).toString('base64url'),
    // JSON 이 아니다
    Buffer.from('그냥 글자').toString('base64url'),
  ];

  it('읽지 못하는 부호는 전부 null 이다 — 던지지 않는다', () => {
    for (const code of badCodes) {
      expect(() => decodeSharePlan(code), code.slice(0, 24)).not.toThrow();
      expect(decodeSharePlan(code), code.slice(0, 24)).toBeNull();
    }
  });

  it('터무니없이 긴 부호는 열어 보지도 않는다', () => {
    expect(decodeSharePlan('A'.repeat(5000))).toBeNull();
  });
});

describe('공유 부호 — 실리지 않는 것 (§1.5j)', () => {
  /** 자유 서술 두 필드와 `직접 쓸게요` 한 줄들. 부호 어디에도 나오면 안 된다. */
  const SECRETS = {
    recipientNote: '조용하고 차분한 사람이고 라벤더를 좋아해요',
    episode: '작년 봄에 함께 수목원에 다녀왔어요. 그날 얘기를 꼭 담고 싶어요.',
    relationshipDetail: '10년째 같은 밴드에서 합주하는 사이예요',
    intentDetail: '유학 떠나는 조카를 배웅해요',
    budgetDetail: '5만 원쯤 생각하고 있어요',
    episodeHintDetail: '요즘 자주 다퉈요',
  };

  it('자유 서술도, 직접 쓴 한 줄도 부호에 들어가지 않는다', async () => {
    const draft = await payloadFor({
      relationship: 'other',
      intent: 'other',
      episodeHints: ['other'],
      budgetKey: 'other',
      ...SECRETS,
    });

    const decoded = Buffer.from(draft.shareCode, 'base64url').toString('utf8');
    for (const secret of Object.values(SECRETS)) {
      expect(decoded, secret).not.toContain(secret);
      // 낱말 단위로도 새지 않는다(잘라 실은 흔적까지 본다).
      for (const word of secret.split(/\s+/)) {
        if (word.length < 3) continue;
        expect(decoded, word).not.toContain(word);
      }
    }

    // 실린 것은 넷뿐이다 — 판·꽃·관계·마음(+날짜).
    expect(Object.keys(JSON.parse(decoded)).sort()).toEqual(['d', 'f', 'i', 'r', 'v']);
  });

  it("`직접 쓸게요` 는 slug 만 실린다 — 그 한 줄은 링크에 없다", async () => {
    const draft = await payloadFor({
      relationship: 'other',
      relationshipDetail: SECRETS.relationshipDetail,
      intent: 'other',
      intentDetail: SECRETS.intentDetail,
    });
    const plan = decodeSharePlan(draft.shareCode);
    expect(plan?.relationship).toBe('other');
    expect(plan?.intent).toBe('other');
  });

  it('멘트 본문은 애초에 부호를 만드는 자리에 오지 않는다', async () => {
    // `prepareResult` 는 멘트를 모른다(멘트는 그다음 단계다) — 구조가 곧 보증이다.
    const draft = await payloadFor();
    expect(draft.shareCode).not.toBe('');
    expect(Object.keys(draft)).not.toContain('tones');
  });
});

describe('공유 주소 — 250자 예산', () => {
  it('카탈로그 전종의 최악 조합에서도 250자 안이다', async () => {
    const catalog = await loadCatalog();
    // 가장 긴 id 셋을 골라 최악을 만든다.
    const longest = [...catalog.flowers.map((flower) => flower.id)]
      .sort((a, b) => b.length - a.length)
      .slice(0, 3);

    const code = encodeSharePlan({
      flowerIds: longest,
      relationship: 'colleague',
      intent: 'just_because',
      dateISO: '2026-12-31',
    });

    // 배포 도메인이 아직 없으니 넉넉한 가정으로 잰다(운영 도메인 + https).
    const url = shareUrl('https://dearbloom.example.com', code);
    expect(url.length, url).toBeLessThanOrEqual(250);
  });

  it('주소는 `/r?c=` 한 모양이다 — 정적 호스팅이 쿼리를 지나가게', () => {
    const url = shareUrl('https://example.com/', 'ABC');
    expect(url).toBe(`https://example.com${SHARE_PATH}?${SHARE_PARAM}=ABC`);
    expect(shareCodeFromSearch(`?${SHARE_PARAM}=ABC`)).toBe('ABC');
    expect(shareCodeFromSearch('')).toBe('');
    expect(shareCodeFromSearch('?other=1')).toBe('');
  });
});
