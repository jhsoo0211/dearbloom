import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  LETTER_COLUMNS,
  LETTER_STORAGE_MODE,
  LetterRemoteError,
  OPEN_LETTER_RPC,
  SAVE_LETTER_RPC,
  createLetterStore,
  createSupabaseLetterStore,
  hasSupabaseLetterEnv,
  type LetterQueryBuilder,
  type SupabaseLetterClient,
  type SupabaseResponse,
  type SupabaseSession,
} from '@/lib/letters/supabase-store';
import { LetterCodeTakenError, LetterNotFoundError } from '@/lib/letters/store';

/**
 * Supabase 어댑터의 그물 — **네트워크를 타지 않는다**(가짜 클라이언트).
 *
 * 여기서 지키는 것은 일곱이다:
 *   · 0009 가 정한 문으로만 드나드는가 (읽기 = open_letter RPC, 소유자 조회 = letters 표)
 *   · 번호를 **서버로 넘기기만** 하는가 (해시를 클라이언트가 만들지 않는다)
 *   · 틀린 번호에 아무것도 흘리지 않는가 (형식 오류면 서버를 부르지도 않는다)
 *   · 서버 오류 메시지가 화면으로 새지 않는가 (편지 본문이 딸려 올 수 있다)
 *   · **세션이 없으면 소유자 경로에서 서버를 부르지 않는가** (어차피 0행이다)
 *   · **로그인은 저장할 때만 만드는가** (구경만 한 사람에게 계정을 남기지 않는다)
 *   · 저장소 선택이 env + 브라우저 여부로 갈리는가
 */

/* ------------------------------------------------------------------ *
 * 가짜 클라이언트
 * ------------------------------------------------------------------ */

const SESSION: SupabaseSession = { user: { id: 'anon-1' } };

interface FakeOptions {
  /** await 로 끝나는 체인의 응답 — list · remove 가 받는다. */
  table?: SupabaseResponse;
  /** maybeSingle 의 응답 — get 이 받는다. */
  single?: SupabaseResponse;
  rpc?: Record<string, SupabaseResponse>;
  /** 지금 세션. 넘기지 않으면 **있는** 것으로 본다(대부분의 경로가 로그인 뒤를 잰다). */
  session?: SupabaseSession | null;
  /** 익명 로그인의 응답. 기본은 성공. */
  signIn?: { data: { session: SupabaseSession | null }; error: { message: string; code?: string } | null };
}

interface Fake {
  client: SupabaseLetterClient;
  /** 표를 향한 체이닝. 세션이 없을 때 이 배열이 비어 있는 것이 곧 "서버를 안 불렀다" 이다. */
  steps: string[];
  rpcCalls: { fn: string; args: Record<string, unknown> }[];
  /** auth 로 간 호출 — steps 와 섞지 않는다(표 검사가 흔들리지 않게). */
  authCalls: string[];
}

function fakeClient(options: FakeOptions = {}): Fake {
  const steps: string[] = [];
  const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
  const authCalls: string[] = [];
  const tableResponse: SupabaseResponse = options.table ?? { data: [], error: null };
  const singleResponse: SupabaseResponse = options.single ?? { data: null, error: null };
  let session: SupabaseSession | null = options.session === undefined ? SESSION : options.session;

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
    auth: {
      getSession() {
        authCalls.push('getSession()');
        return Promise.resolve({ data: { session } });
      },
      signInAnonymously() {
        authCalls.push('signInAnonymously()');
        const response = options.signIn ?? { data: { session: SESSION }, error: null };
        // 실제 supabase-js 처럼, 로그인에 성공하면 그 뒤의 getSession 이 세션을 준다.
        if (response.data.session) session = response.data.session;
        return Promise.resolve(response);
      },
    },
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

  return { client, steps, rpcCalls, authCalls };
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
 * 세션 — 읽기는 묻기만 하고, 쓰기만 만든다
 * ------------------------------------------------------------------ */

describe('세션이 없을 때 — 소유자 경로는 서버를 부르지 않는다', () => {
  it('list · get · remove 가 빈 손으로 답하고 표를 건드리지 않는다', async () => {
    const fake = fakeClient({ session: null });
    const store = createSupabaseLetterStore(fake.client);

    expect(await store.list()).toEqual([]);
    expect(await store.get('letter-1')).toBeNull();
    expect(await store.remove('letter-1')).toBe(false);

    // 왕복이 아예 없다 — RLS 가 어차피 0행을 주는 요청을 보내지 않는다.
    expect(fake.steps).toEqual([]);
    expect(fake.rpcCalls).toEqual([]);
    // 읽기가 로그인을 만들지도 않는다(구경만 한 사람에게 계정을 남기지 않는다).
    expect(fake.authCalls).not.toContain('signInAnonymously()');
  });

  it('번호로 열기는 세션과 무관하다 — 이 문이 이 기능의 주인공이다', async () => {
    const fake = fakeClient({
      session: null,
      rpc: { [OPEN_LETTER_RPC]: { data: [row()], error: null } },
    });
    const found = await createSupabaseLetterStore(fake.client).findByCode('HANBIT');

    expect(found?.id).toBe('letter-1');
    expect(fake.authCalls).toEqual([]);
  });
});

describe('save — 세션이 없으면 그때 익명 로그인을 한다', () => {
  it('로그인한 뒤에 RPC 를 부른다', async () => {
    const fake = fakeClient({
      session: null,
      rpc: { [SAVE_LETTER_RPC]: { data: [row()], error: null } },
    });
    await createSupabaseLetterStore(fake.client).save({ ...DRAFT });

    expect(fake.authCalls).toEqual(['getSession()', 'signInAnonymously()']);
    expect(fake.rpcCalls[0]?.fn).toBe(SAVE_LETTER_RPC);
  });

  it('이미 세션이 있으면 로그인을 다시 만들지 않는다', async () => {
    const fake = fakeClient({ rpc: { [SAVE_LETTER_RPC]: { data: [row()], error: null } } });
    await createSupabaseLetterStore(fake.client).save({ ...DRAFT });

    expect(fake.authCalls).toEqual(['getSession()']);
  });

  it('로그인이 거절되면 서버 오류로 말한다 (익명 로그인이 꺼진 프로젝트)', async () => {
    const fake = fakeClient({
      session: null,
      signIn: { data: { session: null }, error: { message: 'anonymous sign-ins are disabled', code: '422' } },
    });

    const error = await createSupabaseLetterStore(fake.client)
      .save({ ...DRAFT })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(LetterRemoteError);
    expect((error as LetterRemoteError).code).toBe('422');
    // 로그인에 실패했으면 편지를 보내지 않는다.
    expect(fake.rpcCalls).toEqual([]);
  });

  it('오류 없이 세션도 없는 응답도 실패로 본다', async () => {
    const fake = fakeClient({ session: null, signIn: { data: { session: null }, error: null } });
    await expect(createSupabaseLetterStore(fake.client).save({ ...DRAFT })).rejects.toBeInstanceOf(
      LetterRemoteError,
    );
    expect(fake.rpcCalls).toEqual([]);
  });

  it('형식이 어긋난 번호는 로그인도 만들지 않는다', async () => {
    const fake = fakeClient({ session: null });
    await expect(
      createSupabaseLetterStore(fake.client).save({ ...DRAFT, code: 'AB' }),
    ).rejects.toThrow();
    expect(fake.authCalls).toEqual([]);
    expect(fake.rpcCalls).toEqual([]);
  });
});

describe('save — 고쳐 쓸 때 번호를 비우면 그대로 둔다', () => {
  it('빈 번호는 p_code null 로 넘어간다 (0014 의 coalesce 가 옛 해시를 지킨다)', async () => {
    const fake = fakeClient({ rpc: { [SAVE_LETTER_RPC]: { data: [row()], error: null } } });
    await createSupabaseLetterStore(fake.client).save({ ...DRAFT, id: 'letter-1', code: '' });

    expect(fake.rpcCalls[0]?.args.p_id).toBe('letter-1');
    expect(fake.rpcCalls[0]?.args.p_code).toBeNull();
  });

  it('공백만 적은 번호도 같다 — 사람이 지운 칸과 구분할 이유가 없다', async () => {
    const fake = fakeClient({ rpc: { [SAVE_LETTER_RPC]: { data: [row()], error: null } } });
    await createSupabaseLetterStore(fake.client).save({ ...DRAFT, id: 'letter-1', code: '   ' });

    expect(fake.rpcCalls[0]?.args.p_code).toBeNull();
  });

  it('새 편지의 빈 번호는 여전히 거절한다 — 번호 없는 편지는 열 길이 없다', async () => {
    const fake = fakeClient();
    await expect(createSupabaseLetterStore(fake.client).save({ ...DRAFT, code: '' })).rejects.toThrow();
    expect(fake.rpcCalls).toEqual([]);
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
    vi.unstubAllGlobals();
  });

  it('env 가 비어 있으면 붙을 수 없다고 답한다', () => {
    for (const key of KEYS) delete process.env[key];
    expect(hasSupabaseLetterEnv()).toBe(false);
  });

  it('브라우저가 아니면(프리렌더) env 가 있어도 로컬이다', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    expect(hasSupabaseLetterEnv()).toBe(true);

    // 로컬 어댑터만 갖는 메서드로 가른다 — 서버 어댑터에는 revealCode 가 없다.
    expect(typeof createLetterStore().revealCode).toBe('function');
  });

  it('브라우저 + env 면 서버 어댑터다', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    vi.stubGlobal('window', {});

    expect(createLetterStore().revealCode).toBeUndefined();
  });

  it('브라우저라도 env 가 비면 로컬이다', () => {
    for (const key of KEYS) delete process.env[key];
    vi.stubGlobal('window', {});

    expect(typeof createLetterStore().revealCode).toBe('function');
  });

  it('저장 방식은 빌드 타임에 한 값으로 정해진다 (서버 렌더와 브라우저가 같은 문구를 그린다)', () => {
    // 값 자체는 이 실행의 env 가 정한다. 여기서 지키는 것은 **둘 중 하나**라는 사실과,
    // 나중에 env 를 바꿔도 이 값이 흔들리지 않는다는 사실이다.
    expect(['server', 'device']).toContain(LETTER_STORAGE_MODE);

    const before = LETTER_STORAGE_MODE;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    expect(LETTER_STORAGE_MODE).toBe(before);
  });
});
