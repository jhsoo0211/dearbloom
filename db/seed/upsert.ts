/**
 * DB 반영 단계 — 검증을 통과한 CSV 데이터를 Supabase 로 밀어 넣는다.
 *
 * ── 이 파일이 지키는 두 가지 ──────────────────────────────────────────
 *  1. **반영 대상은 하드코딩하지 않는다.** 어떤 파일을 반영할지는 언제나 넘어온
 *     데이터셋의 키(= `SEED_FILE_KEYS`)가 정한다. 아래 `SEED_TARGETS` 는 "그 키가
 *     어느 테이블에 어느 충돌키로 들어가는가"만 답하는 표다 — 시드에 파일이 하나
 *     늘면 여기 한 줄만 더하면 되고, 표에 없는 키가 오면 **조용히 건너뛰지 않고 멈춘다**
 *     (반영 안 된 파일을 반영된 줄 알게 만드는 쪽이 훨씬 위험하다).
 *  2. **네트워크는 주입한 클라이언트로만 탄다.** `SeedDbClient` 는 우리가 실제로 쓰는
 *     세 호출(upsert / insert / delete)만 그린 좁은 포트라, 테스트가 실 DB 없이
 *     "어느 테이블에 몇 행을 어떤 onConflict 로 보냈는가"를 그대로 검사한다.
 *
 * ── 컬럼 매핑을 따로 적지 않는 이유 ───────────────────────────────────
 * CSV 컬럼명은 DB 컬럼명과 1:1 snake_case 다(0001 머리말의 약속). 그래서 행 변환은
 * 표가 아니라 규칙 하나로 끝난다: **검증을 통과한 행의 키를 그대로 컬럼으로 쓰고,
 * 값이 없는 칸(undefined)은 null 로 세운다.** 파일마다 매핑 표를 두면 새 컬럼이 늘 때
 * 표를 고치는 것을 잊은 만큼 데이터가 조용히 빠진다.
 *
 * ── 종료 코드(runUpsert) ──────────────────────────────────────────────
 *   1 — Supabase 환경변수 없음(.env 필요). **이때는 DB 를 부르지 않는다.**
 *   3 — 반영 중 실패(테이블·원인을 함께 출력한다)
 */

import { createClient } from '@supabase/supabase-js';

import type { SeedDataset } from './schemas';

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

/**
 * 환경변수 묶음. `NodeJS.ProcessEnv` 를 쓰지 않는 이유는 Next 가 그 타입에 `NODE_ENV` 를
 * 필수로 얹어 두어서다 — 테스트가 두 칸짜리 가짜 env 를 넘길 수 있어야 한다.
 */
export type SeedEnv = Record<string, string | undefined>;

/** 환경변수에서 Supabase 설정을 읽는다. 하나라도 비면 null. */
export function readSupabaseConfig(env: SeedEnv = process.env): SupabaseConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

/* ------------------------------------------------------------------ *
 * 클라이언트 포트
 * ------------------------------------------------------------------ */

/** DB 한 칸에 들어갈 수 있는 값. CSV 코덱이 내는 모양이 전부 여기에 든다. */
export type SeedCell = string | number | boolean | null | string[] | number[];

/** 반영할 한 행 — 키가 곧 컬럼명이다. */
export type SeedRow = Record<string, SeedCell>;

/** supabase-js 의 응답 중 우리가 보는 부분. */
export interface SeedWriteResponse {
  error: { message: string } | null;
}

export interface SeedDeleteBuilder {
  /** `not('id', 'is', null)` = 전체 행. PostgREST 는 필터 없는 delete 를 거부한다. */
  not(column: string, operator: string, value: unknown): PromiseLike<SeedWriteResponse>;
}

export interface SeedTableClient {
  upsert(rows: SeedRow[], options: { onConflict: string }): PromiseLike<SeedWriteResponse>;
  insert(rows: SeedRow[]): PromiseLike<SeedWriteResponse>;
  delete(): SeedDeleteBuilder;
}

/** 시드가 DB 에 요구하는 전부. 테스트는 이 모양의 가짜를 끼운다. */
export interface SeedDbClient {
  from(table: string): SeedTableClient;
}

/** 반영 중 실패. 어느 테이블에서 멈췄는지가 메시지의 절반이다. */
export class SeedUpsertError extends Error {
  constructor(
    readonly table: string,
    message: string,
  ) {
    super(`${table}: ${message}`);
    this.name = 'SeedUpsertError';
  }
}

/* ------------------------------------------------------------------ *
 * 시드 파일 키 → 테이블
 * ------------------------------------------------------------------ */

/**
 * 반영 방식.
 *
 *   upsert  — CSV 가 안정된 키를 들고 있는 표. 다시 돌려도 같은 행이 갱신된다.
 *   replace — CSV 에 키가 없는 표. 전부 지우고 다시 넣는 수밖에 없다.
 *             ⚠ `meanings` 한 곳뿐이다. `flower_meanings` 는 PK 가 서버 생성 uuid 이고
 *               CSV 에는 그 uuid 가 없다(한 꽃·한 색에 여러 꽃말이 정상이라 자연키도
 *               없다). 그래서 "지우고 다시" 가 유일하게 정직한 방식이다 —
 *               (flower_id, color, meaning_ko) 로 키를 지어내면 꽃말 오타 한 번에
 *               새 행이 생기고 옛 행이 남는다. 대신 이 방식은 지운 뒤 넣기 전에
 *               실패하면 표가 빈 채로 남는다. 다시 실행하면 복구되지만, 그 창을
 *               없애려면 `flower_meanings` 에 자연키 unique 를 세우는 마이그레이션이
 *               따로 필요하다(0011 후보 — db/README.md 에 남겨 둘 판단).
 */
export type SeedWriteStrategy =
  | { kind: 'upsert'; onConflict: string }
  | { kind: 'replace' };

export interface SeedTarget {
  table: string;
  strategy: SeedWriteStrategy;
}

/**
 * 시드 파일 키 → 어느 테이블에 어떻게 넣는가.
 *
 * **반영할 파일 목록이 아니다.** 목록은 데이터셋의 키가 정하고(= `SEED_FILE_KEYS`),
 * 이 표는 그 키를 테이블 이름과 충돌키로 옮겨 주기만 한다. 파일 이름과 테이블 이름이
 * 다른 곳(meanings → flower_meanings, stories → flower_stories …)이 있어 규칙으로는
 * 못 맞히기 때문에 표가 필요하다.
 *
 * `birth_flowers` 는 마이그레이션 0010 과 짝이다(탄생화 CSV 가 시드에 들어오는 날
 * 이 파일은 손대지 않아도 된다).
 */
export const SEED_TARGETS: Record<string, SeedTarget> = {
  flowers: { table: 'flowers', strategy: { kind: 'upsert', onConflict: 'id' } },
  meanings: { table: 'flower_meanings', strategy: { kind: 'replace' } },
  stories: { table: 'flower_stories', strategy: { kind: 'upsert', onConflict: 'story_id' } },
  rules: { table: 'recommendation_rules', strategy: { kind: 'upsert', onConflict: 'rule_id' } },
  templates: { table: 'message_templates', strategy: { kind: 'upsert', onConflict: 'template_id' } },
  quotes: { table: 'quotes', strategy: { kind: 'upsert', onConflict: 'quote_id' } },
  pet_safety: { table: 'pet_safety', strategy: { kind: 'upsert', onConflict: 'flower_id,species' } },
  birth_flowers: {
    table: 'birth_flowers',
    strategy: { kind: 'upsert', onConflict: 'month,day' },
  },
  /* 0011 과 짝이다. 사진은 날짜가 자연키이고(같은 이름이 날마다 다른 사진을 든다),
     이야기는 `story_id` 다 — `stories.csv` 와 같은 규칙이되 **id 공간이 다르다**
     (교차 검증 7 이 두 표의 id 가 겹치지 않는지 본다). */
  birth_photos: {
    table: 'birth_photos',
    strategy: { kind: 'upsert', onConflict: 'month,day' },
  },
  birth_stories: {
    table: 'birth_stories',
    strategy: { kind: 'upsert', onConflict: 'story_id' },
  },
};

/**
 * 부모 테이블 — **언제나 먼저 반영한다.**
 * 나머지 표는 거의 전부 `flowers.id` 를 외래키로 물고 있어서, 꽃이 먼저 들어가 있지
 * 않으면 새 꽃을 참조하는 행이 통째로 거절된다. 데이터셋 키 순서(= CSV 파일 등록 순서)에
 * 기대지 않고 여기서 못 박는다.
 */
const FIRST_KEYS = ['flowers'] as const;

/* ------------------------------------------------------------------ *
 * 행 변환
 * ------------------------------------------------------------------ */

/** 값 없음(undefined)은 null 로. 나머지는 그대로 — CSV 코덱이 이미 도메인 값으로 바꿔 뒀다. */
function toCell(value: unknown): SeedCell {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return value as string[] | number[];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  // 여기 오는 값은 스키마가 바뀌었다는 뜻이다. 조용히 버리지 않고 문자열로 남긴다.
  return String(value);
}

/**
 * 검증을 통과한 행 → DB 행.
 *
 * 파일 안 모든 행의 **키 합집합**을 먼저 구해 모든 행이 같은 칸을 갖게 만든다.
 * (PostgREST 의 벌크 삽입은 행마다 키가 다르면 거절하거나 기본값으로 접는다 —
 *  선택 컬럼이 빈 행이 섞였다고 반영이 통째로 실패하는 일을 여기서 없앤다.)
 */
export function toSeedRows(rows: readonly { value: unknown }[]): SeedRow[] {
  const columns = new Set<string>();
  for (const row of rows) {
    if (row.value && typeof row.value === 'object') {
      for (const key of Object.keys(row.value as Record<string, unknown>)) columns.add(key);
    }
  }

  return rows.map((row) => {
    const source = (row.value ?? {}) as Record<string, unknown>;
    const mapped: SeedRow = {};
    for (const column of columns) mapped[column] = toCell(source[column]);
    return mapped;
  });
}

/* ------------------------------------------------------------------ *
 * 계획
 * ------------------------------------------------------------------ */

export interface SeedWritePlan {
  /** 시드 파일 키(= 데이터셋 키). */
  key: string;
  table: string;
  strategy: SeedWriteStrategy;
  rows: SeedRow[];
}

/**
 * 데이터셋 → 반영 계획. **네트워크를 타지 않는다**(계획만 세운다).
 *
 * 등록되지 않은 키를 만나면 여기서 멈춘다 — 반영 전에, 한 행도 건드리기 전에.
 */
export function planUpsert(dataset: SeedDataset): SeedWritePlan[] {
  const keys = Object.keys(dataset);
  const ordered = [
    ...FIRST_KEYS.filter((key) => keys.includes(key)),
    ...keys.filter((key) => !FIRST_KEYS.includes(key as (typeof FIRST_KEYS)[number])),
  ];

  return ordered.map((key) => {
    const target = SEED_TARGETS[key];
    if (!target) {
      throw new SeedUpsertError(
        key,
        `반영할 테이블이 등록되어 있지 않습니다 — db/seed/upsert.ts 의 SEED_TARGETS 에 '${key}' 를 추가하세요.`,
      );
    }
    const rows = (dataset as unknown as Record<string, readonly { value: unknown }[]>)[key] ?? [];
    return { key, table: target.table, strategy: target.strategy, rows: toSeedRows(rows) };
  });
}

/* ------------------------------------------------------------------ *
 * 반영
 * ------------------------------------------------------------------ */

/**
 * 한 번에 보낼 행 수. 300여 행짜리 이야기 표를 한 요청에 담으면 본문이 수 MB 가 되어
 * 게이트웨이가 먼저 끊는다. 나눠 보내면 실패했을 때 어디까지 들어갔는지도 드러난다.
 */
export const DEFAULT_CHUNK_SIZE = 500;

export interface SeedWriteOutcome {
  key: string;
  table: string;
  strategy: SeedWriteStrategy['kind'];
  rows: number;
  chunks: number;
}

export interface ApplyUpsertOptions {
  chunkSize?: number;
}

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * 계획대로 DB 에 반영한다. 실패하면 그 자리에서 `SeedUpsertError` 로 멈춘다 —
 * 남은 표를 마저 넣어 봐야 절반만 맞는 DB 가 될 뿐이다.
 */
export async function applyUpsert(
  client: SeedDbClient,
  dataset: SeedDataset,
  options: ApplyUpsertOptions = {},
): Promise<SeedWriteOutcome[]> {
  const chunkSize = Math.max(1, options.chunkSize ?? DEFAULT_CHUNK_SIZE);
  const plans = planUpsert(dataset);
  const outcomes: SeedWriteOutcome[] = [];

  for (const plan of plans) {
    const batches = chunk(plan.rows, chunkSize);

    if (plan.strategy.kind === 'replace') {
      // 지우고 다시 넣는다(위 SeedWriteStrategy 주석 참고). 빈 데이터셋이면 지우지도
      // 않는다 — CSV 를 못 읽은 실행이 표를 비우는 사고를 막는다.
      if (plan.rows.length === 0) {
        outcomes.push({ key: plan.key, table: plan.table, strategy: 'replace', rows: 0, chunks: 0 });
        continue;
      }
      const cleared = await client.from(plan.table).delete().not('id', 'is', null);
      if (cleared.error) throw new SeedUpsertError(plan.table, cleared.error.message);

      for (const batch of batches) {
        const inserted = await client.from(plan.table).insert(batch);
        if (inserted.error) throw new SeedUpsertError(plan.table, inserted.error.message);
      }
      outcomes.push({
        key: plan.key,
        table: plan.table,
        strategy: 'replace',
        rows: plan.rows.length,
        chunks: batches.length,
      });
      continue;
    }

    const onConflict = plan.strategy.onConflict;
    for (const batch of batches) {
      const written = await client.from(plan.table).upsert(batch, { onConflict });
      if (written.error) throw new SeedUpsertError(plan.table, written.error.message);
    }
    outcomes.push({
      key: plan.key,
      table: plan.table,
      strategy: 'upsert',
      rows: plan.rows.length,
      chunks: batches.length,
    });
  }

  return outcomes;
}

/* ------------------------------------------------------------------ *
 * CLI 진입점
 * ------------------------------------------------------------------ */

/**
 * service_role 키로 붙는 클라이언트.
 *
 * 이 키는 RLS 를 통째로 우회한다(0003 이 편집 데이터에 select 정책을 하나도 두지 않은
 * 이유가 그것이다). **서버·CLI 밖으로 나가면 안 되는 값**이라 브라우저 코드에서는 이
 * 함수를 부르지 않는다.
 *
 * 포트(`SeedDbClient`)는 우리가 쓰는 세 호출만 그린 좁은 모양이라 supabase-js 의 촘촘한
 * 제네릭 빌더와 구조적으로 딱 맞물리지 않는다. 그래서 좁히는 일을 **이 경계 한 곳에서만**
 * 한다 — 나머지 코드는 포트만 본다.
 */
export function createServiceRoleClient(config: SupabaseConfig): SeedDbClient {
  const client = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client as unknown as SeedDbClient;
}

export function renderOutcomes(outcomes: SeedWriteOutcome[]): string {
  const lines: string[] = ['DB 반영'];
  for (const outcome of outcomes) {
    const how = outcome.strategy === 'replace' ? '교체(전체 삭제 후 삽입)' : 'upsert';
    const chunks = outcome.chunks > 1 ? ` · ${outcome.chunks}회 분할` : '';
    lines.push(`  ${outcome.table} — ${outcome.rows}행 ${how}${chunks}`);
  }
  const total = outcomes.reduce((sum, outcome) => sum + outcome.rows, 0);
  lines.push(`  합계 ${total}행`);
  return lines.join('\n');
}

/**
 * 검증을 통과한 데이터셋을 DB 에 반영한다.
 *
 * 환경이 없으면 **DB 를 부르기 전에** 종료한다(코드 1). 반영 중 실패하면 코드 3.
 * @param client 테스트·다른 진입점이 가짜/다른 클라이언트를 끼울 때만 넘긴다.
 */
export async function runUpsert(dataset: SeedDataset, client?: SeedDbClient): Promise<void> {
  const config = readSupabaseConfig();

  if (config === null) {
    console.error('Supabase 미설정 — .env 필요');
    console.error('  NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 를 설정하세요.');
    console.error('  .env.example 을 복사해 .env 로 만든 뒤 값을 채우면 됩니다.');
    process.exit(1);
  }

  const db = client ?? createServiceRoleClient(config);
  console.log(`대상: ${config.url}`);

  try {
    const outcomes = await applyUpsert(db, dataset);
    console.log(renderOutcomes(outcomes));
    console.log('');
    console.log('반영 완료. 0005 의 남은 한 줄을 아직 안 돌렸다면 지금 돌리세요:');
    console.log('  alter table flower_stories validate constraint flower_stories_moods_not_empty;');
  } catch (error) {
    console.error('DB 반영에 실패했습니다.');
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
    console.error('  마이그레이션 0001~0010 을 모두 적용했는지 먼저 확인하세요(db/README.md).');
    process.exit(3);
  }
}
