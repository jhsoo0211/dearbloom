/**
 * 비밀 편지 저장소 — **Supabase 어댑터**(`LetterStore` 포트의 두 번째 구현).
 *
 * ── 지금 이 파일은 어디까지 사실인가 (감추지 않는다) ──────────────────
 * 코드는 다 있고, **아직 아무 화면도 이것을 쓰지 않는다.** 이유를 순서대로 적는다.
 *
 *  1. **로그인이 없다.** 0009 의 소유자 정책은 전부 `to authenticated ... owner_uid =
 *     auth.uid()` 다. 지금 앱에는 로그인(익명 로그인 포함)이 없어서 anon 키로 부르면
 *     `list` · `get` · `remove` 는 **언제나 0행**이고 `save` 는 **거절**된다.
 *     로그인 없이 anon 키로 되는 것은 `open_letter(code)` 하나뿐이다
 *     (0009 가 그 함수에만 anon 실행 권한을 준다).
 *  2. 그래서 `createLetterStore()` 는 **env 가 채워져 있어도 localStorage 를 돌려준다.**
 *     반쪽만 전환하면 "쓰기는 이 기기, 읽기는 서버" 가 되어 사용자의 편지가 두 곳으로
 *     갈라진다. 그 상태를 화면 문구로 정직하게 설명할 방법이 없다 —
 *     **Supabase 전환은 auth(익명 로그인)를 붙이는 날 한 번에 한다.**
 *
 * ── 0009 와 어긋나는 곳 (여기서 고치지 않는다) ────────────────────────
 *  a. **쓰기 함수가 없다.** 번호 해시는 서버가 만들어야 하는데(`crypt(p_code,
 *     gen_salt('bf'))`), PostgREST 로는 insert 값에 SQL 함수를 실을 수 없다. 0009 는
 *     읽기 문(`open_letter`)만 정의하고 "insert 경로가 같은 비교를 먼저 해야 한다" 는
 *     주석만 남겨 두었다. 그래서 이 어댑터는 아래 `SAVE_LETTER_RPC` 를 부른다 —
 *     **그 함수는 아직 마이그레이션에 없다.** 계약은 이렇다(0011 후보):
 *
 *       create or replace function save_letter(
 *         p_id uuid, p_code text, p_payload jsonb
 *       ) returns table (id uuid, payload jsonb, created_at timestamptz,
 *                        updated_at timestamptz)
 *       language plpgsql security definer set search_path = public, extensions as $$
 *       declare v_code text := upper(btrim(p_code)); v_id uuid;
 *       begin
 *         if v_code !~ '^[A-Z0-9]{4,12}$' then raise exception 'bad code'; end if;
 *         -- 번호 선점 검사: bcrypt 는 행마다 salt 가 달라 unique 인덱스로 못 막는다.
 *         if exists (select 1 from letters l
 *                     where (l.expires_at is null or l.expires_at > now())
 *                       and l.code_hash = crypt(v_code, l.code_hash)
 *                       and (p_id is null or l.id <> p_id))
 *         then raise exception 'code taken' using errcode = '23505'; end if;
 *         ...insert 또는 update(owner_uid = auth.uid() 인 행만)...
 *         return query select l.id, l.payload, l.created_at, l.updated_at
 *                        from letters l where l.id = v_id;
 *       end $$;
 *
 *     `errcode = '23505'` 하나가 계약의 핵심이다 — 이 어댑터는 그 코드를 보고
 *     `LetterCodeTakenError`("이 번호는 다른 편지가 쓰고 있어요")로 옮긴다.
 *  b. **`open_letter` 는 `updated_at` 을 돌려주지 않는다**(id · payload · created_at 뿐).
 *     번호로 연 편지의 `updatedAt` 은 그래서 `createdAt` 으로 세운다. 읽는 쪽은 "언제
 *     쓴 편지" 만 보여 주므로 화면에 거짓이 생기지는 않지만, 고쳐 쓴 편지를 열면
 *     수정 시각이 사라진다는 사실은 적어 둔다.
 *  c. 0009 의 번호 형식은 `^[A-Z0-9]{4,8}$` 인데 앱은 그새 **4~12자**로 넓혔다
 *     (`LETTER_LIMITS.codeMax` = 12, 2026-08-16 사용자 요청). 지금 `open_letter` 에
 *     9자 이상 번호를 넣으면 **형식 검사에서 걸려 조용히 0행**이 나온다 —
 *     마이그레이션을 적용하기 전에 그 정규식을 함께 넓혀야 한다.
 *
 * ⚠ 편지 본문은 **어디에도 기록하지 않는다**(store.ts 와 같은 규율). DB 오류 메시지도
 *   그대로 올리지 않는다 — Postgres 는 제약 위반 시 실패한 행 전체를 메시지에 실어
 *   보내는 일이 있고, 그 행이 곧 편지 본문이다. `LetterRemoteError` 는 코드만 든다.
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

import {
  LetterCodeTakenError,
  LetterNotFoundError,
  LetterStoreError,
  createLocalLetterStore,
  type LetterStore,
  type SaveLetterInput,
} from './store';
import {
  letterCodeSchema,
  letterContentSchema,
  letterSchema,
  type Letter,
} from './types';

/* ------------------------------------------------------------------ *
 * 계약 상수
 * ------------------------------------------------------------------ */

export const LETTERS_TABLE = 'letters';

/** 읽기 문 — 0009 가 정의하고 anon 에게 실행 권한을 준 단 하나의 함수. */
export const OPEN_LETTER_RPC = 'open_letter';

/** 쓰기 문 — **아직 마이그레이션에 없다**(머리말 a). */
export const SAVE_LETTER_RPC = 'save_letter';

/**
 * 소유자 조회에서 읽는 칸.
 *
 * `*` 를 쓰지 않는다: `code_hash` 와 `owner_uid` 는 화면이 쓸 일이 없는 값이고,
 * select 목록이 곧 "밖으로 나갈 수 있는 것의 전부" 라는 사실을 여기서 못 박는다
 * (store.ts 의 `toLetter` 가 나머지 연산을 쓰지 않는 것과 같은 이유).
 */
export const LETTER_COLUMNS = 'id, payload, created_at, updated_at';

/* ------------------------------------------------------------------ *
 * 오류
 * ------------------------------------------------------------------ */

/**
 * 서버가 거절했다(권한·연결·제약 …).
 *
 * **DB 메시지를 싣지 않는다** — 실패 행 전체(= 편지 본문)가 딸려 오는 오류가 있다.
 * 대신 SQLSTATE 만 `code` 로 든다: 사용자에게는 한 문장, 개발자에게는 코드 한 개.
 */
export class LetterRemoteError extends LetterStoreError {
  readonly code: string | null;

  constructor(code: string | null = null) {
    super('편지를 서버와 주고받지 못했어요. 잠시 뒤에 다시 해 주시겠어요?');
    this.name = 'LetterRemoteError';
    this.code = code;
  }
}

/** 번호가 이미 쓰이고 있을 때 서버가 올려 주는 SQLSTATE(unique_violation). */
const CODE_TAKEN_SQLSTATE = '23505';

/* ------------------------------------------------------------------ *
 * 클라이언트 포트
 * ------------------------------------------------------------------ */

export interface SupabaseErrorLike {
  message: string;
  code?: string | null;
}

export interface SupabaseResponse<T = unknown> {
  data: T;
  error: SupabaseErrorLike | null;
}

/**
 * 우리가 실제로 쓰는 체이닝만 그린 좁은 포트.
 * supabase-js 전체를 흉내 내지 않는다 — 테스트가 끼우는 가짜도 이만큼만 만들면 된다.
 */
export interface LetterQueryBuilder extends PromiseLike<SupabaseResponse> {
  select(columns: string): LetterQueryBuilder;
  eq(column: string, value: string): LetterQueryBuilder;
  order(column: string, options: { ascending: boolean }): LetterQueryBuilder;
  maybeSingle(): PromiseLike<SupabaseResponse>;
}

export interface LetterTableClient {
  select(columns: string): LetterQueryBuilder;
  delete(): LetterQueryBuilder;
}

export interface SupabaseLetterClient {
  from(table: string): LetterTableClient;
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<SupabaseResponse>;
}

/**
 * 브라우저에서 쓰는 클라이언트 — **anon 키 전용**이다.
 *
 * service_role 키는 RLS 를 통째로 우회하므로 여기서는 절대 쓰지 않는다(그 키는
 * 시드 CLI 의 `db/seed/upsert.ts` 안에서만 산다). 포트가 supabase-js 의 제네릭
 * 빌더와 구조적으로 딱 맞물리지는 않아 좁히는 일을 **이 경계 한 곳에서만** 한다.
 */
export function createSupabaseLetterClient(url: string, anonKey: string): SupabaseLetterClient {
  const client = createClient(url, anonKey);
  return client as unknown as SupabaseLetterClient;
}

/* ------------------------------------------------------------------ *
 * 행 → 편지
 * ------------------------------------------------------------------ */

/** DB 가 돌려주는 한 줄. `updated_at` 은 `open_letter` 가 주지 않아 선택이다(머리말 b). */
const letterRowSchema = z.object({
  id: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  created_at: z.string(),
  updated_at: z.string().nullish(),
});

/**
 * 한 줄을 편지로 세운다. 모양이 어긋나면 **null** 이다(예외로 올리지 않는다).
 * 상한 줄 하나가 목록 전체를 못 열게 만드는 것이 더 나쁜 실패라는 판단은
 * localStorage 어댑터와 같다.
 */
function toLetter(row: unknown): Letter | null {
  const parsedRow = letterRowSchema.safeParse(row);
  if (!parsedRow.success) return null;

  const { id, payload, created_at: createdAt, updated_at: updatedAt } = parsedRow.data;
  const parsed = letterSchema.safeParse({
    ...payload,
    id,
    createdAt,
    // open_letter 는 수정 시각을 돌려주지 않는다 — 그때는 쓴 시각으로 세운다.
    updatedAt: updatedAt ?? createdAt,
  });
  return parsed.success ? parsed.data : null;
}

/** 배열이면 첫 줄, 객체면 그 자체. PostgREST 는 함수 반환형에 따라 둘 다 준다. */
function firstRow(data: unknown): unknown {
  if (Array.isArray(data)) return data.length > 0 ? data[0] : null;
  return data ?? null;
}

function toRows(data: unknown): unknown[] {
  return Array.isArray(data) ? data : [];
}

function raise(error: SupabaseErrorLike): never {
  throw new LetterRemoteError(error.code ?? null);
}

/* ------------------------------------------------------------------ *
 * 어댑터
 * ------------------------------------------------------------------ */

/**
 * Supabase 어댑터.
 *
 * `revealCode()` 가 **없다** — 서버는 해시만 들고 있어 번호를 되돌릴 수 없다. 포트가
 * 그 메서드를 선택으로 둔 이유이며, 화면은 메서드가 없으면 `번호 다시 보기` 버튼을
 * 세우지 않는다(store.ts 머리말).
 */
export function createSupabaseLetterStore(client: SupabaseLetterClient): LetterStore {
  return {
    async list(): Promise<Letter[]> {
      // RLS 가 소유자 행으로 좁힌다(0009 §1) — 로그인 전에는 언제나 빈 목록이다.
      const { data, error } = await client
        .from(LETTERS_TABLE)
        .select(LETTER_COLUMNS)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) raise(error);

      const letters: Letter[] = [];
      for (const row of toRows(data)) {
        const letter = toLetter(row);
        if (letter) letters.push(letter);
      }
      return letters;
    },

    async get(id: string): Promise<Letter | null> {
      const { data, error } = await client
        .from(LETTERS_TABLE)
        .select(LETTER_COLUMNS)
        .eq('id', id)
        .maybeSingle();
      if (error) raise(error);
      return data ? toLetter(data) : null;
    },

    async save(input: SaveLetterInput): Promise<Letter> {
      // 화면이 이미 한 번 검증하지만 여기서도 한다 — 저장소를 지난 값은 다음에 그대로
      // 화면으로 돌아 나온다(localStorage 어댑터와 같은 이유).
      const content = letterContentSchema.parse({
        recipientName: input.recipientName,
        title: input.title,
        body: input.body,
        flowerId: input.flowerId,
        theme: input.theme,
        signature: input.signature,
      });
      // 번호는 정규화만 해서 넘긴다. **해시는 서버가 만든다**(머리말 a) —
      // 클라이언트가 만든 해시를 받아 주는 순간 번호 검사가 클라이언트 몫이 된다.
      const code = letterCodeSchema.parse(input.code);

      const { data, error } = await client.rpc(SAVE_LETTER_RPC, {
        p_id: input.id ?? null,
        p_code: code,
        p_payload: content,
      });

      if (error) {
        if (error.code === CODE_TAKEN_SQLSTATE) throw new LetterCodeTakenError();
        raise(error);
      }

      const row = firstRow(data);
      // 0행 = 고쳐 쓰려던 편지가 없거나 내 것이 아니다(RLS 가 남의 편지를 안 보여 준다).
      if (!row) {
        if (input.id) throw new LetterNotFoundError();
        throw new LetterRemoteError(null);
      }

      const letter = toLetter(row);
      if (!letter) throw new LetterRemoteError(null);
      return letter;
    },

    async remove(id: string): Promise<boolean> {
      // `select('id')` 를 붙여야 "정말 지워졌는지" 를 알 수 있다 — 붙이지 않으면
      // 남의 편지를 지우려다 RLS 에 막힌 것과 성공이 같은 응답으로 온다.
      const { data, error } = await client
        .from(LETTERS_TABLE)
        .delete()
        .eq('id', id)
        .select('id');
      if (error) raise(error);
      return toRows(data).length > 0;
    },

    async findByCode(code: string): Promise<Letter | null> {
      // 형식이 어긋난 번호는 **던지지 않고 못 찾은 것으로 답한다**(로컬 어댑터와 같은
      // 규칙). 서버를 부르지도 않는다 — 틀린 모양에 서버 CPU 를 쓰지 않는다.
      const parsed = letterCodeSchema.safeParse(code);
      if (!parsed.success) return null;

      const { data, error } = await client.rpc(OPEN_LETTER_RPC, { p_code: parsed.data });
      if (error) raise(error);

      const row = firstRow(data);
      return row ? toLetter(row) : null;
    },
  };
}

/* ------------------------------------------------------------------ *
 * 저장소 선택
 * ------------------------------------------------------------------ */

/**
 * Supabase 로 붙을 수 있는 환경인가.
 *
 * ⚠ 이 값이 `true` 여도 **지금은 저장소를 바꾸지 않는다**(아래 `createLetterStore`).
 *   env 는 "붙을 수 있다" 만 말하고, 붙어도 되는지는 auth 가 정한다.
 *
 * `process.env.X` 를 그대로 적는다 — Next 는 빌드 때 이 표기를 값으로 치환하므로
 * 변수로 돌려 읽으면 브라우저에서 undefined 가 된다.
 */
export function hasSupabaseLetterEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && anonKey);
}

/**
 * 지금 쓸 편지 저장소.
 *
 * **env 가 다 채워져 있어도 localStorage 다.** 로그인이 없는 동안 서버 어댑터는
 * 읽기(번호로 열기)만 되고 쓰기는 RLS 에 막힌다 — 그 반쪽 상태로 갈아 끼우면 사용자의
 * 편지가 기기와 서버로 갈라지고, 화면이 그 사실을 설명할 방법이 없다.
 *
 * **Supabase 전환은 auth(익명 로그인) 붙는 날.** 그날 할 일은 셋이다:
 *   1. 0009 적용(+ 머리말 a 의 `save_letter`, 머리말 c 의 번호 길이)
 *   2. 익명 로그인 켜기 → `owner_uid = auth.uid()` 가 성립한다
 *   3. 이 함수의 분기 한 줄만 되살리기 —
 *      `if (hasSupabaseLetterEnv()) return createSupabaseLetterStore(createSupabaseLetterClient(url, anonKey));`
 *      호출부(LetterStudio·LetterEntrance)는 손대지 않는다. 그것이 포트를 먼저 세운 이유다.
 */
export function createLetterStore(): LetterStore {
  return createLocalLetterStore();
}
