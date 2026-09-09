/**
 * 편지 시드 CLI — 운영자가 미리 쓴 편지를 번호로 열 수 있게 심는다.
 *
 *   npm run letters:seed -- --file db/seed/letters.example.json            검증만(dry-run)
 *   npm run letters:seed -- --file db/seed/private/2026-recipients.json --apply
 *
 * 옵션
 *   --file=<path> | --file <path>   편지 JSON (필수)
 *   --content=<dir>                 꽃 id 대조용 CSV 디렉터리 (기본: <cwd>/content)
 *   --apply                         실제로 심는다. 없으면 DB 를 건드리지 않는다.
 *
 * 종료 코드
 *   0 — 검증 통과(dry-run) / 반영 완료(apply)
 *   1 — 검증 오류 / 파일 없음 / Supabase 미설정
 *   2 — 예상치 못한 실패
 *   3 — 반영 중 실패(환경은 정상)
 *
 * ── 이 파일이 지키는 한 가지 ──────────────────────────────────────────
 * **편지 본문은 어디에도 출력하지 않는다.** 제목·본문·서명은 파싱한 뒤 곧장 payload 로
 * 들어가고, 화면(터미널)에 나가는 것은 받는 분 이름·꽃·**가린 번호**·기한뿐이다. 시드
 * 파일은 대개 진짜 편지라, 확인하겠다고 찍어 둔 터미널 로그가 곧 유출이다.
 *   같은 이유로 실패도 가린 번호 + SQLSTATE 만 말한다 — Postgres 는 제약 위반 시 실패한
 *   행 전체를 메시지에 실어 보내는 일이 있고, 그 행이 곧 편지 본문이다.
 *
 * ── 번호는 우리가 되돌려 줄 수 없다 ───────────────────────────────────
 * 서버(0014 `seed_letter`)는 bcrypt 해시만 든다. 그래서 **시드 파일이 번호의 유일한
 * 원본**이다 — 파일을 잃으면 그 편지를 여는 길이 사라진다. 진짜 편지를 담은 파일은
 * 커밋하지 않는다(`.gitignore` 의 `/db/seed/private/`).
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

import { loadDotEnv, resolveContentDir } from './env';
import { readCsv } from './parse';
import { readSupabaseConfig, type SupabaseConfig } from './upsert';
import {
  letterCodeSchema,
  letterContentSchema,
  normalizeLetterCode,
  type LetterContent,
} from '../../src/lib/letters/types';

/* ------------------------------------------------------------------ *
 * 계약
 * ------------------------------------------------------------------ */

/** 0014 가 세운 시드 문. service_role 만 부를 수 있다. */
export const SEED_LETTER_RPC = 'seed_letter';

/** 검증을 통과한 편지 한 통 — 이대로 RPC 로 나간다. */
export interface LetterSeed extends LetterContent {
  /** 정규화(대문자·공백 제거)한 평문 번호. 해시는 서버가 만든다. */
  code: string;
  /** 보관 기한(타임존 포함 ISO). 없으면 기한 없음. */
  expiresAt?: string;
}

/**
 * 검증에서 걸린 한 줄.
 *
 * ⚠ `message` 에 **값을 싣지 않는다** — 어느 칸이 왜 걸렸는지까지만 말한다.
 *   본문이 길다고 알려 주면 되지, 본문을 되뇌어 줄 이유는 없다.
 */
export interface LetterSeedIssue {
  /** `letters` 배열에서의 자리(0-based). 파일 전체의 문제면 null. */
  index: number | null;
  field: string;
  message: string;
}

export interface LetterSeedParseResult {
  letters: LetterSeed[];
  issues: LetterSeedIssue[];
}

/* ------------------------------------------------------------------ *
 * 번호 가리기
 * ------------------------------------------------------------------ */

/**
 * 번호를 눈으로 짚을 수 있을 만큼만 남기고 가린다(앞 2 · 뒤 2).
 *
 * 시드 파일에는 여러 통이 들어 있어서 "몇 번째 편지가 실패했는지" 를 말할 방법이 필요한데,
 * 번호를 그대로 찍으면 터미널·CI 로그가 곧 편지의 열쇠가 된다. 4자짜리 짧은 번호는
 * 앞 2·뒤 2 로 가리면 하나도 안 가려지므로 첫 글자만 남긴다.
 */
export function maskCode(code: string): string {
  const value = normalizeLetterCode(code);
  if (value.length <= 4) return value.slice(0, 1) + '*'.repeat(Math.max(value.length - 1, 0));
  return `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`;
}

/* ------------------------------------------------------------------ *
 * 파싱·검증
 * ------------------------------------------------------------------ */

/**
 * 타임존이 붙은 ISO 시각인가.
 *
 * `Date.parse` 만으로는 부족하다 — `2026-12-24T09:00` 도 통과하는데, 그 값은 **읽는
 * 기계의 시간대**로 해석된다. 시드를 도쿄에서 돌리면 서울과 다른 순간이 된다는 뜻이라,
 * 오프셋(`Z` 또는 `+09:00`)을 요구한다.
 */
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/;

/** 파일 한 통의 원형. 알 수 없는 키는 여기서 걸러 낸다(오타가 조용히 무시되지 않게). */
const LETTER_KEYS = new Set([
  'code',
  'recipientName',
  'title',
  'body',
  'flowerId',
  'theme',
  'signature',
  'expiresAt',
]);

/**
 * 편지 시드 파일을 읽어 검증한다. **네트워크를 타지 않는다.**
 *
 * @param json      `JSON.parse` 한 값 그대로.
 * @param flowerIds `content/flowers.csv` 의 id 집합. 없는 꽃을 고르면 화면에서 꽃 자리가
 *                  비어 버리는데, 그때는 편지를 받은 사람만 그 사실을 안다.
 * @param now       기한이 미래인지 재는 기준 시각(테스트가 고정할 때만).
 */
export function parseLetterSeedFile(
  json: unknown,
  flowerIds: ReadonlySet<string>,
  now: Date = new Date(),
): LetterSeedParseResult {
  const issues: LetterSeedIssue[] = [];
  const letters: LetterSeed[] = [];

  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    issues.push({ index: null, field: '-', message: '편지 파일은 객체 하나여야 합니다.' });
    return { letters, issues };
  }

  const rows = (json as { letters?: unknown }).letters;
  if (!Array.isArray(rows)) {
    issues.push({ index: null, field: 'letters', message: '`letters` 배열이 없습니다.' });
    return { letters, issues };
  }
  if (rows.length === 0) {
    issues.push({ index: null, field: 'letters', message: '편지가 한 통도 없습니다.' });
    return { letters, issues };
  }

  /** 파일 안에서 같은 번호를 두 통이 쓰면 **어느 편지가 열릴지 정해지지 않는다.** */
  const seenCodes = new Map<string, number>();

  rows.forEach((row, index) => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      issues.push({ index, field: '-', message: '편지 한 통은 객체여야 합니다.' });
      return;
    }
    const entry = row as Record<string, unknown>;

    for (const key of Object.keys(entry)) {
      if (!LETTER_KEYS.has(key)) {
        issues.push({ index, field: key, message: '모르는 칸입니다(오타를 확인하세요).' });
      }
    }

    const content = letterContentSchema.safeParse({
      recipientName: entry.recipientName,
      title: entry.title,
      body: entry.body,
      flowerId: entry.flowerId,
      theme: entry.theme,
      signature: entry.signature,
    });
    if (!content.success) {
      for (const issue of content.error.issues) {
        issues.push({
          index,
          field: typeof issue.path[0] === 'string' ? issue.path[0] : '-',
          message: issue.message,
        });
      }
    }

    const code = letterCodeSchema.safeParse(entry.code);
    if (!code.success) {
      issues.push({
        index,
        field: 'code',
        message: code.error.issues[0]?.message ?? '편지 번호를 다시 봐 주세요.',
      });
    } else {
      const first = seenCodes.get(code.data);
      if (first !== undefined) {
        issues.push({
          index,
          field: 'code',
          message: `같은 번호를 ${first + 1}번째 편지가 이미 쓰고 있습니다.`,
        });
      } else {
        seenCodes.set(code.data, index);
      }
    }

    // 꽃 id 는 카탈로그가 정한다. 스키마는 "비어 있지 않다" 까지만 보므로 여기서 대조한다.
    if (content.success && !flowerIds.has(content.data.flowerId)) {
      issues.push({
        index,
        field: 'flowerId',
        message: '꽃 도감에 없는 id 입니다(content/flowers.csv 를 확인하세요).',
      });
    }

    let expiresAt: string | undefined;
    if (entry.expiresAt !== undefined && entry.expiresAt !== null && entry.expiresAt !== '') {
      if (typeof entry.expiresAt !== 'string' || !ISO_WITH_ZONE.test(entry.expiresAt)) {
        issues.push({
          index,
          field: 'expiresAt',
          message: '보관 기한은 시간대까지 적은 ISO 시각이어야 합니다(예: 2027-01-01T00:00:00+09:00).',
        });
      } else if (Number.isNaN(Date.parse(entry.expiresAt))) {
        issues.push({ index, field: 'expiresAt', message: '보관 기한을 읽지 못했습니다.' });
      } else if (Date.parse(entry.expiresAt) <= now.getTime()) {
        // 이미 지난 기한으로 심으면 **심은 순간부터 아무도 못 여는 편지**가 된다.
        issues.push({ index, field: 'expiresAt', message: '보관 기한이 이미 지났습니다.' });
      } else {
        expiresAt = entry.expiresAt;
      }
    }

    if (content.success && code.success) {
      // `title` 은 선택이라 **없으면 칸 자체를 두지 않는다**(letterContentSchema 주석).
      // 여기서 `title: undefined` 를 그대로 두면 payload 에 빈 제목이 실린 것처럼 읽힌다.
      const { title, ...rest } = content.data;
      letters.push({
        ...rest,
        ...(title ? { title } : {}),
        code: code.data,
        ...(expiresAt ? { expiresAt } : {}),
      });
    }
  });

  // 한 줄이라도 걸리면 한 통도 심지 않는다 — 절반만 들어간 편지 묶음은 고치기가 더 어렵다.
  return issues.length > 0 ? { letters: [], issues } : { letters, issues };
}

/* ------------------------------------------------------------------ *
 * 반영
 * ------------------------------------------------------------------ */

export interface LetterSeedResponse {
  data: unknown;
  error: { message: string; code?: string | null } | null;
}

/** 편지 시드가 DB 에 요구하는 전부. 테스트는 이 모양의 가짜를 끼운다. */
export interface LetterSeedClient {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<LetterSeedResponse>;
}

export interface LetterSeedFailure {
  /** **가린** 번호. 원문은 여기 들어오지 않는다. */
  code: string;
  /** Postgres SQLSTATE. 23505 = 그 번호를 사용자가 쓰고 있다(0014). */
  sqlstate: string;
}

export interface LetterSeedApplyResult {
  inserted: number;
  updated: number;
  failures: LetterSeedFailure[];
}

/** 응답 첫 줄의 `action` 칸. PostgREST 는 함수 반환형에 따라 배열/객체 둘 다 준다. */
function readAction(data: unknown): string | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (typeof row !== 'object' || row === null) return null;
  const action = (row as { action?: unknown }).action;
  return typeof action === 'string' ? action : null;
}

/**
 * 검증을 통과한 편지들을 `seed_letter` 로 심는다.
 *
 * 한 통이 실패해도 **멈추지 않는다** — 스무 통 중 한 통이 번호 충돌이면 나머지 열아홉
 * 통은 들어가는 편이 낫고, 다시 돌려도 같은 편지는 갱신될 뿐이다(`seed_letter` 는
 * 같은 번호를 다시 받으면 payload 를 고친다). 실패는 모아서 마지막에 말한다.
 */
export async function applyLetterSeed(
  client: LetterSeedClient,
  letters: readonly LetterSeed[],
): Promise<LetterSeedApplyResult> {
  const result: LetterSeedApplyResult = { inserted: 0, updated: 0, failures: [] };

  for (const letter of letters) {
    const { code, expiresAt, ...content } = letter;
    const { data, error } = await client.rpc(SEED_LETTER_RPC, {
      p_code: code,
      p_payload: content,
      p_expires_at: expiresAt ?? null,
    });

    if (error) {
      // 메시지는 버린다(실패 행 = 편지 본문이 딸려 올 수 있다). 코드만 든다.
      result.failures.push({ code: maskCode(code), sqlstate: error.code ?? '알 수 없음' });
      continue;
    }

    const action = readAction(data);
    if (action === 'inserted') result.inserted += 1;
    else if (action === 'updated') result.updated += 1;
    else result.failures.push({ code: maskCode(code), sqlstate: '응답 없음' });
  }

  return result;
}

/**
 * service_role 키로 붙는 클라이언트.
 *
 * `upsert.ts` 의 `createServiceRoleClient` 와 같은 판단이되 **포트가 다르다**(그쪽은
 * 표 쓰기 `from`, 이쪽은 함수 호출 `rpc`). 이 키는 RLS 를 통째로 우회하므로 CLI 밖으로
 * 나가면 안 된다 — 브라우저 코드는 이 함수를 부르지 않는다.
 */
export function createLetterSeedClient(config: SupabaseConfig): LetterSeedClient {
  const client = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client as unknown as LetterSeedClient;
}

/* ------------------------------------------------------------------ *
 * 출력
 * ------------------------------------------------------------------ */

/**
 * 한 통을 한 줄로 — **받는 분 · 꽃 · 가린 번호 · 기한**.
 * 제목·본문·서명은 여기 오지 않는다(머리말).
 */
export function renderLetterLine(letter: LetterSeed, index: number): string {
  const order = String(index + 1).padStart(2, ' ');
  const expiry = letter.expiresAt ? `기한 ${letter.expiresAt}` : '기한 없음';
  return `  ${order}. ${letter.recipientName} · ${letter.flowerId} · ${maskCode(letter.code)} · ${expiry}`;
}

export function renderIssue(issue: LetterSeedIssue): string {
  const where = issue.index === null ? '파일' : `${issue.index + 1}번째 편지`;
  return `  ${where} · ${issue.field} — ${issue.message}`;
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */

/** `--file <path>` 와 `--file=<path>` 를 둘 다 받는다(PowerShell 습관 차이). */
export function resolveFileArg(argv: string[]): string | null {
  const inline = argv.find((arg) => arg.startsWith('--file='));
  if (inline) return inline.slice('--file='.length);
  const at = argv.indexOf('--file');
  if (at >= 0 && argv[at + 1] && !argv[at + 1]!.startsWith('--')) return argv[at + 1]!;
  return null;
}

/** `content/flowers.csv` 의 id 집합. */
function readFlowerIds(contentDir: string): Set<string> {
  const file = path.join(contentDir, 'flowers.csv');
  if (!existsSync(file)) {
    throw new Error(`꽃 목록을 찾지 못했습니다: ${file}`);
  }
  return new Set(readCsv(file).map((row) => row.id).filter((id): id is string => Boolean(id)));
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  loadDotEnv();

  const fileArg = resolveFileArg(argv);
  if (!fileArg) {
    console.error('편지 파일을 지정하세요: npm run letters:seed -- --file <경로> [--apply]');
    process.exit(1);
  }

  const filePath = path.resolve(fileArg);
  if (!existsSync(filePath)) {
    console.error(`편지 파일을 찾지 못했습니다: ${filePath}`);
    process.exit(1);
  }

  let json: unknown;
  try {
    json = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    // 파싱 오류 메시지에는 파일 조각이 실릴 수 있다 — 위치만 남기고 원문은 버린다.
    console.error(`편지 파일을 읽지 못했습니다(JSON 형식): ${filePath}`);
    console.error(`  ${error instanceof Error ? error.name : '알 수 없는 오류'}`);
    process.exit(1);
  }

  const contentDir = resolveContentDir(argv);
  const { letters, issues } = parseLetterSeedFile(json, readFlowerIds(contentDir));

  const apply = argv.includes('--apply');
  console.log(`편지 시드 — ${apply ? 'apply' : 'dry-run'}`);
  console.log(`  파일: ${filePath}`);
  console.log(`  꽃 목록: ${contentDir}`);
  console.log('');

  if (issues.length > 0) {
    console.error(`검증 오류 ${issues.length}건 — 한 통도 심지 않았습니다.`);
    for (const issue of issues) console.error(renderIssue(issue));
    process.exit(1);
  }

  console.log(`편지 ${letters.length}통`);
  letters.forEach((letter, index) => console.log(renderLetterLine(letter, index)));
  console.log('');

  if (!apply) {
    console.log('검증만 했습니다. 실제로 심으려면 --apply 를 붙이세요.');
    return;
  }

  const config = readSupabaseConfig();
  if (config === null) {
    console.error('Supabase 미설정 — .env 필요');
    console.error('  NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 를 설정하세요.');
    process.exit(1);
  }

  console.log(`대상: ${config.url}`);
  const result = await applyLetterSeed(createLetterSeedClient(config), letters);
  console.log(`  새로 심음 ${result.inserted}통 · 갱신 ${result.updated}통`);

  if (result.failures.length > 0) {
    console.error(`  실패 ${result.failures.length}통`);
    for (const failure of result.failures) {
      console.error(`    ${failure.code} — SQLSTATE ${failure.sqlstate}`);
    }
    console.error('  23505 = 그 번호를 이미 쓰는 편지가 있습니다(0014 seed_letter).');
    process.exit(3);
  }
}

/**
 * 진입 가드 — 이 파일을 **직접 실행했을 때만** 돈다.
 * 테스트는 위 순수 함수들만 import 하고, 그때 CLI 가 깨어나면 안 된다.
 */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error('편지 시드 실행 중 예상치 못한 오류가 발생했습니다.');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  });
}
