import { describe, expect, it } from 'vitest';

import {
  LETTER_STORAGE_KEY,
  LetterCodeTakenError,
  LetterNotFoundError,
  LetterStorageUnavailableError,
  createLocalLetterStore,
  localCodeDigest,
  type LetterStorageLike,
} from '@/lib/letters/store';

/**
 * 저장소 어댑터의 그물.
 *
 * 이 표가 지키는 것은 넷이다:
 *   · 저장한 편지를 **번호로** 다시 찾는가(그게 이 기능의 전부다)
 *   · 틀린 번호에 아무것도 흘리지 않는가(형식 오류도 "못 찾음"과 같은 답이어야 한다)
 *   · **저장 불가 환경**(시크릿 창·저장 차단)에서 조용히 삼키지 않는가
 *   · 손상된 줄 하나가 나머지 편지를 못 열게 만들지 않는가
 */

/** localStorage 흉내 — 실제 브라우저 API 중 우리가 쓰는 셋만 갖는다. */
function fakeStorage(seed?: Record<string, string>): LetterStorageLike & { dump(): string | null } {
  const map = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    dump: () => map.get(LETTER_STORAGE_KEY) ?? null,
  };
}

/** 언제나 던지는 저장소 — 용량이 꽉 찼거나 저장이 막힌 브라우저. */
function brokenStorage(): LetterStorageLike {
  return {
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    removeItem: () => undefined,
  };
}

const DRAFT = {
  recipientName: '한빛',
  body: '고맙다는 말, 너무 오래 미뤘지.',
  flowerId: 'freesia',
  theme: 'gold',
  signature: '수호',
  code: 'HANBIT',
} as const;

function makeStore(storage: LetterStorageLike, at = '2026-08-16T09:00:00.000Z') {
  let tick = 0;
  return createLocalLetterStore({
    storage,
    // 저장할 때마다 1분씩 흐른다 — 목록 정렬(최근 고친 것 먼저)을 재려면 시각이 달라야 한다.
    now: () => new Date(Date.parse(at) + tick++ * 60_000),
    newId: () => `letter-${tick}`,
  });
}

describe('localStorage 어댑터 — 쓰고 찾고 지우기', () => {
  it('저장한 편지를 번호로 찾는다', async () => {
    const store = makeStore(fakeStorage());
    const saved = await store.save({ ...DRAFT });

    expect(saved.id).toBeTruthy();
    expect(saved.recipientName).toBe('한빛');
    // 번호는 편지에 실려 나가지 않는다 — 저장소가 따로 든다.
    expect(saved).not.toHaveProperty('codeHash');
    expect(saved).not.toHaveProperty('code');

    const found = await store.findByCode('HANBIT');
    expect(found?.id).toBe(saved.id);
    expect(found?.body).toBe(DRAFT.body);
  });

  it('소문자·공백으로 적어도 같은 편지가 열린다', async () => {
    const store = makeStore(fakeStorage());
    await store.save({ ...DRAFT });
    expect(await store.findByCode('  hanbit ')).not.toBeNull();
  });

  it('틀린 번호와 형식이 어긋난 번호가 **같은 답**을 받는다(null)', async () => {
    const store = makeStore(fakeStorage());
    await store.save({ ...DRAFT });

    expect(await store.findByCode('NOPE12')).toBeNull();
    // 형식 오류도 예외가 아니라 null 이다 — 어느 쪽인지 알려 주면 그게 힌트가 된다.
    expect(await store.findByCode('한')).toBeNull();
    expect(await store.findByCode('')).toBeNull();
    expect(await store.findByCode('AB')).toBeNull();
  });

  it('고쳐 쓰면 만든 날은 그대로, 고친 날만 움직인다', async () => {
    const store = makeStore(fakeStorage());
    const first = await store.save({ ...DRAFT });
    const second = await store.save({ ...DRAFT, id: first.id, body: '조금 고쳐 적었어요.' });

    expect(second.id).toBe(first.id);
    expect(second.createdAt).toBe(first.createdAt);
    expect(Date.parse(second.updatedAt)).toBeGreaterThan(Date.parse(first.updatedAt));
    expect(await store.list()).toHaveLength(1);
    expect((await store.get(first.id))?.body).toBe('조금 고쳐 적었어요.');
  });

  it('없는 편지를 고쳐 쓰려 하면 그 사실을 말한다', async () => {
    const store = makeStore(fakeStorage());
    await expect(store.save({ ...DRAFT, id: 'no-such-letter' })).rejects.toBeInstanceOf(
      LetterNotFoundError,
    );
  });

  it('같은 번호를 두 편지가 쓰지 못한다 — 어느 편지가 열릴지 정해지지 않기 때문', async () => {
    const store = makeStore(fakeStorage());
    await store.save({ ...DRAFT });
    await expect(store.save({ ...DRAFT, recipientName: '다른 분' })).rejects.toBeInstanceOf(
      LetterCodeTakenError,
    );
    // 자기 자신을 고쳐 쓸 때는 같은 번호를 그대로 둘 수 있어야 한다.
    const mine = (await store.list())[0];
    if (!mine) throw new Error('편지가 비었다');
    await expect(store.save({ ...DRAFT, id: mine.id })).resolves.toBeTruthy();
  });

  it('목록은 최근에 고친 편지부터 세운다', async () => {
    const store = makeStore(fakeStorage());
    const first = await store.save({ ...DRAFT, code: 'AAAA11' });
    const second = await store.save({ ...DRAFT, code: 'BBBB22', recipientName: '두 번째' });

    const list = await store.list();
    expect(list.map((letter) => letter.id)).toEqual([second.id, first.id]);
  });

  it('지우면 목록에서도 번호로도 사라진다', async () => {
    const store = makeStore(fakeStorage());
    const saved = await store.save({ ...DRAFT });

    expect(await store.remove(saved.id)).toBe(true);
    expect(await store.remove(saved.id)).toBe(false);
    expect(await store.list()).toEqual([]);
    expect(await store.findByCode(DRAFT.code)).toBeNull();
  });

  it('번호 다시 보기는 로컬 어댑터에만 있다(서버 어댑터는 해시라 되돌릴 수 없다)', async () => {
    const store = makeStore(fakeStorage());
    const saved = await store.save({ ...DRAFT });

    expect(store.revealCode).toBeDefined();
    expect(await store.revealCode?.(saved.id)).toBe('HANBIT');
    expect(await store.revealCode?.('no-such-letter')).toBeNull();
    // 대조값은 이 함수 하나가 정한다 — 서버 어댑터는 이 자리만 갈아 끼운다.
    expect(localCodeDigest(' hanbit ')).toBe('HANBIT');
  });

  it('상한을 넘은 편지는 저장소도 막는다(화면 검사만 믿지 않는다)', async () => {
    const store = makeStore(fakeStorage());
    await expect(store.save({ ...DRAFT, body: '가'.repeat(1001) })).rejects.toThrow();
    await expect(store.save({ ...DRAFT, code: 'AB' })).rejects.toThrow();
  });
});

describe('저장 불가 환경', () => {
  it('저장소가 없으면 읽기는 빈 손으로 답하고, 쓰기는 그 사실을 말한다', async () => {
    const store = createLocalLetterStore({ storage: null });

    expect(await store.list()).toEqual([]);
    expect(await store.get('any')).toBeNull();
    expect(await store.findByCode('HANBIT')).toBeNull();
    expect(await store.remove('any')).toBe(false);
    expect(await store.revealCode?.('any')).toBeNull();

    // 조용히 삼키지 않는다 — 저장된 줄 알고 번호를 건네는 것이 가장 나쁜 실패다.
    await expect(store.save({ ...DRAFT })).rejects.toBeInstanceOf(LetterStorageUnavailableError);
  });

  it('용량이 꽉 찬 저장소도 같은 문장으로 말한다', async () => {
    const store = createLocalLetterStore({ storage: brokenStorage() });
    await expect(store.save({ ...DRAFT })).rejects.toBeInstanceOf(LetterStorageUnavailableError);
    await expect(store.save({ ...DRAFT })).rejects.toThrow(/시크릿 창/);
  });
});

describe('저장소가 상했을 때', () => {
  it('깨진 JSON 은 빈 목록으로 읽는다(예외로 화면을 세우지 않는다)', async () => {
    const store = makeStore(fakeStorage({ [LETTER_STORAGE_KEY]: '{ 이건 JSON 이 아니다' }));
    expect(await store.list()).toEqual([]);
    // 그 위에 새로 쓰는 일은 그대로 된다.
    await expect(store.save({ ...DRAFT })).resolves.toBeTruthy();
    expect(await store.list()).toHaveLength(1);
  });

  it('모양이 어긋난 줄만 버리고 나머지 편지는 지킨다', async () => {
    const good = {
      id: 'letter-good',
      recipientName: '한빛',
      body: '잘 지내요?',
      flowerId: 'freesia',
      theme: 'ivory',
      signature: '수호',
      createdAt: '2026-08-16T09:00:00.000Z',
      updatedAt: '2026-08-16T09:00:00.000Z',
      codeHash: 'HANBIT',
    };
    const storage = fakeStorage({
      [LETTER_STORAGE_KEY]: JSON.stringify({
        version: 1,
        letters: [{ id: 'letter-broken' }, good, null, 'letter'],
      }),
    });
    const store = makeStore(storage);

    const list = await store.list();
    expect(list.map((letter) => letter.id)).toEqual(['letter-good']);
    expect(await store.findByCode('HANBIT')).not.toBeNull();
  });

  it('저장 파일은 버전과 편지 목록만 든다', async () => {
    const storage = fakeStorage();
    const store = makeStore(storage);
    await store.save({ ...DRAFT });

    const raw = storage.dump();
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? '{}') as { version: number; letters: unknown[] };
    expect(parsed.version).toBe(1);
    expect(parsed.letters).toHaveLength(1);
  });
});
