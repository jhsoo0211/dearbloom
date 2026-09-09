/**
 * 비밀 편지 저장소 — **Supabase 어댑터**(`LetterStore` 포트의 두 번째 구현).
 *
 * ── 지금 이 파일은 어디까지 사실인가 (감추지 않는다) ──────────────────
 * 이 어댑터는 **실제로 화면이 쓴다.** `NEXT_PUBLIC_SUPABASE_URL` 과
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` 가 채워진 배포의 브라우저에서는 아래
 * `createLetterStore()` 가 이것을 돌려주고, 비어 있으면 localStorage 어댑터를
 * 돌려준다. 서버(프리렌더)에서는 언제나 로컬이다 — 그쪽에는 브라우저 세션이 없다.
 *
 * ── 세 개의 문 ────────────────────────────────────────────────────────
 *  1. **번호로 열기**(`open_letter`) — 세션이 필요 없다. 0009 가 anon 에게 실행
 *     권한을 준 단 하나의 함수이고, 이 기능의 주인공(번호를 받아 찾아온 사람)이
 *     지나는 문이다.
 *  2. **소유자 조회**(`letters` 표 select/delete) — RLS 가 `owner_uid = auth.uid()`
 *     로 좁힌다. 세션이 없으면 **서버를 부르지도 않는다**(어차피 0행이다).
 *  3. **쓰기**(`save_letter`) — 0014 가 세운 security definer 함수. 세션이 없으면
 *     먼저 익명 로그인(`signInAnonymously`)을 하고 부른다. 번호 해시는 **서버가**
 *     만든다(`crypt(p_code, gen_salt('bf'))`) — 클라이언트가 만든 해시를 받아 주는
 *     순간 번호 검사가 클라이언트 몫이 된다.
 *     `errcode = '23505'` 하나가 계약의 핵심이다 — 이 어댑터는 그 코드를 보고
 *     `LetterCodeTakenError`("이 번호는 다른 편지가 쓰고 있어요")로 옮긴다.
 *
 * ── 익명 로그인이라는 선택 ────────────────────────────────────────────
 * 계정을 만들라고 하지 않으려고 익명 로그인을 쓴다. 대가는 정직하게 적어 둔다:
 *   · 세션은 그 브라우저에 있다. **저장소를 비우면 "내가 만든 편지" 목록이 사라진다**
 *     (편지 자체는 서버에 남아 번호로 계속 열린다 — 화면 문구가 그렇게 말한다).
 *   · 그러므로 다른 기기에서는 목록이 비어 보이는 것이 정상이다. 목록은 소유자의
 *     것이고, 번호는 받는 사람의 것이다.
 *
 * ── 남은 위험 (여기서 고치지 않는다) ─────────────────────────────────
 *  a. **`open_letter` 는 `updated_at` 을 돌려주지 않는다**(id · payload · created_at 뿐).
 *     번호로 연 편지의 `updatedAt` 은 그래서 `createdAt` 으로 세운다. 읽는 쪽은 "언제
 *     쓴 편지" 만 보여 주므로 화면에 거짓이 생기지는 않지만, 고쳐 쓴 편지를 열면
 *     수정 시각이 사라진다는 사실은 적어 둔다.
 *  b. **익명 사용자는 쌓인다.** 편지를 한 통 쓸 때마다 `auth.users` 에 한 줄이 생기고
 *     지우는 일은 아직 사람 몫이다(deploy/README.md 의 해당 절). 무료 플랜의 7일
 *     휴면도 같은 절에 적혀 있다.
 *  c. **번호 대입 방어는 아직 서버에 없다.** 0009 §2 의 시도 기록 표는 주석으로만 있고,
 *     지금 막는 것은 bcrypt 비용과 화면의 20초 쉼표뿐이다.
 *
 * ⚠ 편지 본문은 **어디에도 기록하지 않는다**(store.ts 와 같은 규율). DB 오류 메시지도
 *   그대로 올리지 않는다 — Postgres 는 제약 위반 시 실패한 행 전체를 메시지에 실어
 *   보내는 일이 있고, 그 행이 곧 편지 본문이다. `LetterRemoteError` 는 코드만 든다.
 * ⚠ service_role 키는 이 파일이 한 글자도 읽지 않는다(그 키는 시드 CLI 에만 산다).
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

/** 쓰기 문 — 0014 가 세운 security definer 함수(authenticated 전용). */
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

/**
 * 세션에서 우리가 보는 것은 **있는가 없는가** 하나뿐이다.
 *
 * 사용자 id 를 읽어 쓰지 않는다 — 소유자 판정은 서버가 한다(RLS 와 `save_letter` 의
 * `owner_uid = auth.uid()`). 여기서 id 를 들고 다니면 그 판정을 클라이언트가 한 번 더
 * 흉내 내는 셈이고, 두 판정은 언젠가 어긋난다.
 */
export interface SupabaseSession {
  user: { id: string };
}

/** 익명 로그인에 쓰는 최소 포트. supabase-js 의 `auth` 중 우리가 부르는 둘뿐이다. */
export interface SupabaseAuthClient {
  getSession(): PromiseLike<{ data: { session: SupabaseSession | null } }>;
  signInAnonymously(): PromiseLike<{
    data: { session: SupabaseSession | null };
    error: SupabaseErrorLike | null;
  }>;
}

export interface SupabaseLetterClient {
  auth: SupabaseAuthClient;
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

/** DB 가 돌려주는 한 줄. `updated_at` 은 `open_letter` 가 주지 않아 선택이다(머리말 a). */
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
 * 세션
 * ------------------------------------------------------------------ */

/** 지금 세션이 있는가. 없으면 null — **여기서 만들지 않는다**(만드는 자리는 `save` 뿐이다). */
async function currentSession(client: SupabaseLetterClient): Promise<SupabaseSession | null> {
  const { data } = await client.auth.getSession();
  return data.session ?? null;
}

/**
 * 쓰기 직전에만 부르는 익명 로그인.
 *
 * 읽기(목록·번호로 열기)에서는 부르지 않는다 — 편지를 구경만 한 사람에게까지
 * `auth.users` 한 줄을 남기지 않으려는 것이다(머리말 b).
 */
async function requireSession(client: SupabaseLetterClient): Promise<SupabaseSession> {
  const existing = await currentSession(client);
  if (existing) return existing;

  const { data, error } = await client.auth.signInAnonymously();
  if (error) raise(error);
  // 오류 없이 세션도 없는 응답(익명 로그인이 꺼진 프로젝트)이 실제로 온다.
  if (!data.session) throw new LetterRemoteError(null);
  return data.session;
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
      // 세션이 없으면 RLS 가 어차피 0행을 준다 — 그 왕복을 하지 않는다.
      // (편지를 한 통도 쓰지 않은 사람에게 로그인을 만들어 주지도 않는다.)
      if (!(await currentSession(client))) return [];

      // RLS 가 소유자 행으로 좁힌다(0009 §1).
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
      if (!(await currentSession(client))) return null;

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
      // 고쳐 쓰기 + 빈 번호 = "번호는 그대로" (`SaveLetterInput` 주석). 서버에는
      // null 로 넘어가고, 0014 의 `coalesce` 가 있던 해시를 그대로 둔다.
      // 새 편지의 빈 번호는 여기서 zod 오류가 된다 — 번호 없는 편지는 열 길이 없다.
      const keepCode = Boolean(input.id) && input.code.trim() === '';
      // 번호는 정규화만 해서 넘긴다. **해시는 서버가 만든다**(머리말 3) —
      // 클라이언트가 만든 해시를 받아 주는 순간 번호 검사가 클라이언트 몫이 된다.
      const code = keepCode ? null : letterCodeSchema.parse(input.code);

      // 검증을 지난 뒤에야 로그인한다 — 형식이 어긋난 요청에 익명 사용자를 만들지 않는다.
      await requireSession(client);

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
      if (!(await currentSession(client))) return false;

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
 * `process.env.X` 를 그대로 적는다 — Next 는 빌드 때 이 표기를 값으로 치환하므로
 * 변수로 돌려 읽으면 브라우저에서 undefined 가 된다.
 */
export function hasSupabaseLetterEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && anonKey);
}

/**
 * 이 배포에서 편지가 어디에 남는가 — **빌드 타임에 정해지는 한 값**이다.
 *
 * 화면 문구가 이 값으로 갈린다(`components/letter/copy.ts`). 그래서 `createLetterStore()`
 * 처럼 `typeof window` 를 보면 **안 된다** — 서버가 그린 HTML 과 브라우저가 그린 첫
 * 렌더가 다른 문장을 갖게 되고, 그게 하이드레이션 불일치다. env 만 본다:
 * 서버 렌더와 클라이언트가 같은 값을 읽는다.
 *
 * ⚠ 'server' 는 "편지가 서버에 남는다" 는 뜻이지 "지금 로그인돼 있다" 는 뜻이 아니다.
 *   세션은 저장할 때 만들어진다(`requireSession`).
 */
export const LETTER_STORAGE_MODE: 'server' | 'device' = hasSupabaseLetterEnv()
  ? 'server'
  : 'device';

/**
 * 브라우저에서 쓰는 클라이언트 — **한 번만 만든다.**
 *
 * supabase-js 의 클라이언트는 세션(익명 로그인 토큰)을 들고 있다. 화면마다 새로 만들면
 * 저장 탭에서 만든 세션을 목록 탭이 모르는 일이 생긴다. 모듈 단위로 하나만 둔다.
 */
let sharedClient: SupabaseLetterClient | null = null;

function browserLetterClient(): SupabaseLetterClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  sharedClient ??= createSupabaseLetterClient(url, anonKey);
  return sharedClient;
}

/**
 * 지금 쓸 편지 저장소.
 *
 *   브라우저 + env 있음 → 서버 어댑터(번호로 어느 기기에서든 열린다)
 *   그 밖               → localStorage 어댑터
 *
 * 서버(프리렌더)에서 로컬을 돌려주는 것은 도피가 아니라 사실이다 — 그쪽에는 브라우저
 * 세션이 없어서 소유자 조회가 성립하지 않고, 이 화면들은 어차피 정적으로 서고 편지를
 * 읽고 쓰는 일은 전부 마운트 뒤에 일어난다.
 *
 * ⚠ **이 함수의 결과로 갈리는 JSX 를 첫 렌더에 두지 마라.** 서버와 브라우저가 다른
 *   어댑터를 받으므로(위 두 줄) 그 순간 하이드레이션이 어긋난다. 문구처럼 렌더에
 *   실려야 하는 것은 `LETTER_STORAGE_MODE`(빌드 타임 상수)를 본다.
 */
export function createLetterStore(): LetterStore {
  if (typeof window === 'undefined') return createLocalLetterStore();
  const client = browserLetterClient();
  return client ? createSupabaseLetterStore(client) : createLocalLetterStore();
}
