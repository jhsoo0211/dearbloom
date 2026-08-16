import { afterEach, describe, expect, it } from 'vitest';

import {
  LETTER_COLUMNS,
  LetterRemoteError,
  OPEN_LETTER_RPC,
  SAVE_LETTER_RPC,
  createLetterStore,
  createSupabaseLetterStore,
  hasSupabaseLetterEnv,
  type LetterQueryBuilder,
  type SupabaseLetterClient,
  type SupabaseResponse,
} from '@/lib/letters/supabase-store';
import { LetterCodeTakenError, LetterNotFoundError } from '@/lib/letters/store';

/**
 * Supabase 어댑터의 그물 — **네트워크를 타지 않는다**(가짜 클라이언트).
 *
 * 여기서 지키는 것은 다섯이다:
 *   · 0009 가 정한 문으로만 드나드는가 (읽기 = open_letter RPC, 소유자 조회 = letters 표)
 *   · 번호를 **서버로 넘기기만** 하는가 (해시를 클라이언트가 만들지 않는다)
 *   · 틀린 번호에 아무것도 흘리지 않는가 (형식 오류면 서버를 부르지도 않는다)
 *   · 서버 오류 메시지가 화면으로 새지 않는가 (편지 본문이 딸려 올 수 있다)
 *   · env 가 채워져도 저장소를 바꾸지 않는가 (전환은 auth 붙는 날)
 */

/* ------------------------------------------------------------------ *
 * 가짜 클라이언트
 * ------------------------------------------------------------------ */

interface FakeOptions {
  /** await 로 끝나는 체인의 응답 — list · remove 가 받는다. */
  table?: SupabaseResponse;
  /** maybeSingle 의 응답 — get 이 받는다. */
  single?: SupabaseResponse;
  rpc?: Record<string, SupabaseResponse>;
}

interface Fake {
  client: SupabaseLetterClient;
  steps: string[];
  rpcCalls: { fn: string; args: Record<string, unknown> }[];
}

function fakeClient(options: FakeOptions = {}): Fake {
  const steps: string[] = [];
  const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
  const tableResponse: SupabaseResponse = options.table ?? { data: [], error: null };
  const singleResponse: SupabaseResponse = options.single ?? { data: null, error: null };

  const builder: LetterQueryBuilder = {
    select(columns) {
      steps.push(`select(${columns})`);
      return builder;
    },
    eq(column, value) {
      steps.push(`eq(${column}=${value})`);
      return builder;
    },
    order(column, opts) {
      steps.push(`order(${column},${opts.ascending ? 'asc' : 'desc'})`);
      return builder;
    },
    maybeSingle() {
      steps.push('maybeSingle()');
      return Promise.resolve(singleResponse);
    },
    // await 로 끝나는 체인(list · remove)이 여기로 떨어진다.
    then(onfulfilled, onrejected) {
      return Promise.resolve(tableResponse).then(onfulfilled, onrejected);
    },
  };

  const client: SupabaseLetterClient = {
    from(table: string) {
      steps.push(`from(${table})`);
      return {
        select(columns: string) {
          return builder.select(columns);
        },
        delete() {
          steps.push('delete()');
          return builder;
        },
      };
    },
    rpc(fn: string, args: Record<string, unknown>) {
      rpcCalls.push({ fn, args });
      return Promise.resolve(options.rpc?.[fn] ?? { data: [], error: null });
    },
  };

  return { client, steps, rpcCalls };
}

const PAYLOAD = {
  recipientName: '한빛',
  body: '고맙다는 말, 너무 오래 미뤘지.',
  flowerId: 'freesia',
  theme: 'gold',
  signature: '수호',
} as const;

const DRAFT = { ...PAYLOAD, code: 'HANBIT' };

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'letter-1',
    payload: PAYLOAD,
    created_at: '2026-08-16T09:00:00.000Z',
    updated_at: '2026-08-16T10:00:00.000Z',
    ...overrides,
  };
}

/* ------------------------------------------------------------------ *
 * 소유자 조회
 * ------------------------------------------------------------------ */

describe('소유자 조회 — letters 표 (RLS 가 owner 로 좁힌다)', () => {
  it('최근에 고친 편지부터 읽고, 읽는 칸을 명시한다', async () => {
    const fake = fakeClient({ table: { data: [row(), row({ id: 'letter-2' })], error: null } });
    const letters = await createSupabaseLetterStore(fake.client).list();

    expect(fake.steps).toEqual([
      'from(letters)',
      `select(${LETTER_COLUMNS})`,
      'order(updated_at,desc)',
      'order(created_at,desc)',
    ]);
    // code_hash·owner_uid 는 애초에 읽지 않는다.
    expect(LETTER_COLUMNS).not.toContain('code_hash');
    expect(LETTER_COLUMNS).not.toContain('owner_uid');
    expect(letters.map((letter) => letter.id)).toEqual(['letter-1', 'letter-2']);
    expect(letters[0]?.body).toBe(PAYLOAD.body);
  });

  it('모양이 어긋난 줄 하나가 나머지 편지를 막지 않는다', async () => {
    const fake = fakeClient({
      table: { data: [{ id: 'broken', payload: { body: '' }, created_at: 'x' }, row()], error: null },
    });
    const letters = await createSupabaseLetterStore(fake.client).list();
    expect(letters.map((letter) => letter.id)).toEqual(['letter-1']);
  });

  it('get 은 id 로 한 줄만 읽고, 없으면 null 이다', async () => {
    const found = fakeClient({ single: { data: row(), error: null } });
    expect((await createSupabaseLetterStore(found.client).get('letter-1'))?.id).toBe('letter-1');
    expect(found.steps).toContain('eq(id=letter-1)');
    expect(found.steps).toContain('maybeSingle()');

    const missing = fakeClient({ single: { data: null, error: null } });
    expect(await createSupabaseLetterStore(missing.client).get('letter-9')).toBeNull();
  });

  it('remove 는 지워진 줄을 되받아 성공 여부를 가른다', async () => {
    const deleted = fakeClient({ table: { data: [{ id: 'letter-1' }], error: null } });
    expect(await createSupabaseLetterStore(deleted.client).remove('letter-1')).toBe(true);
    expect(deleted.steps).toEqual(['from(letters)', 'delete()', 'eq(id=letter-1)', 'select(id)']);

    // RLS 에 막혀 한 줄도 안 지워진 경우와 성공을 구분한다.
    const blocked = fakeClient({ table: { data: [], error: null } });
    expect(await createSupabaseLetterStore(blocked.client).remove('letter-1')).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * 쓰기
 * ------------------------------------------------------------------ */

describe('save — 번호는 서버가 해시한다', () => {
  it('save_letter RPC 에 정규화한 번호와 본문을 넘긴다', async () => {
    const fake = fakeClient({ rpc: { [SAVE_LETTER_RPC]: { data: [row()], error: null } } });
    const saved = await createSupabaseLetterStore(fake.client).save({ ...DRAFT, code: ' hanbit ' });

    expect(fake.rpcCalls).toHaveLength(1);
    const call = fake.rpcCalls[0];
    expect(call?.fn).toBe(SAVE_LETTER_RPC);
    expect(call?.args.p_id).toBeNull();
    // 대문자·공백 정규화만 하고 넘긴다 — 해시는 서버(pgcrypto)가 만든다.
    expect(call?.args.p_code).toBe('HANBIT');
    expect(call?.args.p_payload).toEqual(expect.objectContaining({ body: PAYLOAD.body }));
    // 해시로 보이는 값을 클라이언트가 만들어 보내지 않는다.
    expect(JSON.stringify(call?.args)).not.toContain('$2');

    expect(saved.id).toBe('letter-1');
    expect(saved).not.toHaveProperty('codeHash');
  });

  it('고쳐 쓸 때는 편지 id 를 함께 넘긴다', async () => {
    const fake = fakeClient({ rpc: { [SAVE_LETTER_RPC]: { data: [row()], error: null } } });
    await createSupabaseLetterStore(fake.client).save({ ...DRAFT, id: 'letter-1' });
    expect(fake.rpcCalls[0]?.args.p_id).toBe('letter-1');
  });

  it('번호가 이미 쓰이고 있으면(23505) 번호 오류로 옮긴다', async () => {
    const fake = fakeClient({
      rpc: { [SAVE_LETTER_RPC]: { data: null, error: { message: 'code taken', code: '23505' } } },
    });
    await expect(createSupabaseLetterStore(fake.client).save({ ...DRAFT })).rejects.toBeInstanceOf(
      LetterCodeTakenError,
    );
  });

  it('고쳐 쓰려던 편지가 없으면(0행) 찾지 못했다고 말한다', async () => {
    const fake = fakeClient({ rpc: { [SAVE_LETTER_RPC]: { data: [], error: null } } });
    await expect(
      createSupabaseLetterStore(fake.client).save({ ...DRAFT, id: 'letter-9' }),
    ).rejects.toBeInstanceOf(LetterNotFoundError);
  });

  it('서버 오류 메시지를 화면 문구에 싣지 않는다 (실패 행이 곧 편지 본문이다)', async () => {
    const leaky = `check constraint 실패 — 실패한 행: (${PAYLOAD.body})`;
    const fake = fakeClient({
      rpc: { [SAVE_LETTER_RPC]: { data: null, error: { message: leaky, code: '23514' } } },
    });

    const error = await createSupabaseLetterStore(fake.client)
      .save({ ...DRAFT })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LetterRemoteError);
    expect((error as LetterRemoteError).message).not.toContain(PAYLOAD.body);
    expect((error as LetterRemoteError).code).toBe('23514');
  });

  it('형식이 어긋난 번호는 서버까지 가지 않는다', async () => {
    const fake = fakeClient();
    await expect(
      createSupabaseLetterStore(fake.client).save({ ...DRAFT, code: 'AB' }),
    ).rejects.toThrow();
    expect(fake.rpcCalls).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * 번호로 열기
 * ------------------------------------------------------------------ */

describe('findByCode — 0009 의 open_letter 가 유일한 문이다', () => {
  it('정규화한 번호로 RPC 를 부른다', async () => {
    const fake = fakeClient({ rpc: { [OPEN_LETTER_RPC]: { data: [row()], error: null } } });
    const found = await createSupabaseLetterStore(fake.client).findByCode(' hanbit ');

    expect(fake.rpcCalls).toEqual([{ fn: OPEN_LETTER_RPC, args: { p_code: 'HANBIT' } }]);
    expect(found?.id).toBe('letter-1');
    // 표를 직접 뒤지지 않는다 — 그 길은 0009 가 일부러 막아 두었다(오프라인 속도의 대입 방지).
    expect(fake.steps).toEqual([]);
  });

  it('못 찾으면 null 이고, 왜 못 찾았는지는 말하지 않는다', async () => {
    const fake = fakeClient({ rpc: { [OPEN_LETTER_RPC]: { data: [], error: null } } });
    expect(await createSupabaseLetterStore(fake.client).findByCode('ZZZZZZ')).toBeNull();
  });

  it('형식이 어긋난 번호는 서버를 부르지도 않는다', async () => {
    const fake = fakeClient();
    expect(await createSupabaseLetterStore(fake.client).findByCode('가나다라')).toBeNull();
    expect(await createSupabaseLetterStore(fake.client).findByCode('AB')).toBeNull();
    expect(fake.rpcCalls).toEqual([]);
  });

  it('open_letter 가 수정 시각을 주지 않으면 쓴 시각으로 세운다', async () => {
    const fake = fakeClient({
      rpc: {
        [OPEN_LETTER_RPC]: {
          data: [{ id: 'letter-1', payload: PAYLOAD, created_at: '2026-08-16T09:00:00.000Z' }],
          error: null,
        },
      },
    });
    const found = await createSupabaseLetterStore(fake.client).findByCode('HANBIT');
    expect(found?.updatedAt).toBe('2026-08-16T09:00:00.000Z');
  });
});

/* ------------------------------------------------------------------ *
 * 포트 계약 · 저장소 선택
 * ------------------------------------------------------------------ */

describe('포트 계약과 저장소 선택', () => {
  it('서버 어댑터에는 revealCode 가 없다 (해시는 되돌아가지 않는다)', () => {
    expect(createSupabaseLetterStore(fakeClient().client).revealCode).toBeUndefined();
  });

  const KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;
  const saved = new Map(KEYS.map((key) => [key, process.env[key]]));

  afterEach(() => {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('env 가 비어 있으면 붙을 수 없다고 답한다', () => {
    for (const key of KEYS) delete process.env[key];
    expect(hasSupabaseLetterEnv()).toBe(false);
  });

  it('env 가 다 채워져 있어도 저장소는 localStorage 다 (전환은 auth 붙는 날)', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    expect(hasSupabaseLetterEnv()).toBe(true);

    // 로컬 어댑터만 갖는 메서드로 가른다 — 서버 어댑터에는 revealCode 가 없다.
    expect(typeof createLetterStore().revealCode).toBe('function');
  });
});
