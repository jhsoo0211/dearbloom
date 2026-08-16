import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHUNK_SIZE,
  SEED_TARGETS,
  SeedUpsertError,
  applyUpsert,
  planUpsert,
  readSupabaseConfig,
  toSeedRows,
  type SeedDbClient,
  type SeedRow,
} from '../../db/seed/upsert';
import { SEED_FILE_KEYS, type SeedDataset } from '../../db/seed/schemas';

/**
 * DB 반영 단계의 그물 — **실 DB 없이** 잰다.
 *
 * 여기서 지키는 것은 넷이다:
 *   · 시드 파일이 늘어도 반영에서 조용히 빠지지 않는가 (등록표 전수 검사)
 *   · 어느 테이블에 · 몇 행을 · 어떤 onConflict 로 보내는가
 *   · 자연키가 없는 표(meanings)를 "지우고 다시" 로 처리하는가
 *   · 실패했을 때 어느 테이블에서 멈췄는지 말하는가
 */

/* ------------------------------------------------------------------ *
 * 가짜 클라이언트
 * ------------------------------------------------------------------ */

interface RecordedCall {
  table: string;
  op: 'upsert' | 'insert' | 'delete';
  rows: number;
  onConflict?: string;
  filter?: string;
  first?: SeedRow;
}

interface FailAt {
  table: string;
  op: RecordedCall['op'];
  message: string;
}

function fakeDb(fail?: FailAt): { client: SeedDbClient; calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];

  const respond = (table: string, op: RecordedCall['op']) =>
    Promise.resolve(
      fail && fail.table === table && fail.op === op
        ? { error: { message: fail.message } }
        : { error: null },
    );

  const client: SeedDbClient = {
    from(table: string) {
      return {
        upsert(rows: SeedRow[], options: { onConflict: string }) {
          calls.push({
            table,
            op: 'upsert',
            rows: rows.length,
            onConflict: options.onConflict,
            first: rows[0],
          });
          return respond(table, 'upsert');
        },
        insert(rows: SeedRow[]) {
          calls.push({ table, op: 'insert', rows: rows.length, first: rows[0] });
          return respond(table, 'insert');
        },
        delete() {
          return {
            not(column: string, operator: string, value: unknown) {
              calls.push({
                table,
                op: 'delete',
                rows: 0,
                filter: `${column} ${operator} ${String(value)}`,
              });
              return respond(table, 'delete');
            },
          };
        },
      };
    },
  };

  return { client, calls };
}

/** 파일 키 → 행 목록을 시드 데이터셋 모양(줄 번호가 붙은 행)으로 감싼다. */
function makeDataset(files: Record<string, Record<string, unknown>[]>): SeedDataset {
  const dataset: Record<string, { line: number; value: unknown }[]> = {};
  for (const [key, rows] of Object.entries(files)) {
    dataset[key] = rows.map((value, index) => ({ line: index + 2, value }));
  }
  return dataset as unknown as SeedDataset;
}

const FLOWER = { id: 'rose-red', name_ko: '빨간 장미', colors: ['red'], name_en: undefined };
const MEANING = { flower_id: 'rose-red', meaning_ko: '사랑', color: undefined };

/* ------------------------------------------------------------------ *
 * 등록표
 * ------------------------------------------------------------------ */

describe('SEED_TARGETS — 시드 파일이 늘어도 반영에서 빠지지 않는다', () => {
  it('모든 시드 파일 키가 반영 대상 테이블을 갖는다', () => {
    const missing = SEED_FILE_KEYS.filter((key) => SEED_TARGETS[key] === undefined);
    // 이 테스트가 깨졌다면 content/ 에 CSV 가 늘었는데 upsert.ts 의 등록표가 그대로다.
    // 그대로 두면 `--apply` 가 그 파일만 조용히 빼놓고 성공을 알린다.
    expect(missing).toEqual([]);
  });

  it('등록되지 않은 키가 오면 DB 를 부르기 전에 멈춘다', async () => {
    const { client, calls } = fakeDb();
    const dataset = makeDataset({ flowers: [FLOWER], moon_phases: [{ id: 'full' }] });

    await expect(applyUpsert(client, dataset)).rejects.toThrow(SeedUpsertError);
    await expect(applyUpsert(client, dataset)).rejects.toThrow(/SEED_TARGETS/);
    expect(calls).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * 계획
 * ------------------------------------------------------------------ */

describe('planUpsert — 무엇을 어디에 넣을 것인가', () => {
  it('파일 키를 테이블 이름으로 옮긴다', () => {
    const plans = planUpsert(
      makeDataset({ meanings: [MEANING], stories: [{ story_id: 's1' }], flowers: [FLOWER] }),
    );
    expect(plans.map((plan) => plan.table)).toEqual([
      'flowers',
      'flower_meanings',
      'flower_stories',
    ]);
  });

  it('flowers 를 언제나 먼저 넣는다 (나머지가 그 외래키를 문다)', () => {
    const plans = planUpsert(makeDataset({ pet_safety: [], meanings: [], flowers: [FLOWER] }));
    expect(plans[0]?.key).toBe('flowers');
  });

  it('값 없는 칸은 null 로 세우고, 한 파일의 모든 행이 같은 칸을 갖는다', () => {
    const rows = toSeedRows([
      { value: { id: 'a', name_en: 'A', note: undefined } },
      { value: { id: 'b' } },
    ]);
    expect(rows).toEqual([
      { id: 'a', name_en: 'A', note: null },
      { id: 'b', name_en: null, note: null },
    ]);
    expect(Object.keys(rows[0] ?? {})).toEqual(Object.keys(rows[1] ?? {}));
  });

  it('배열·숫자·불리언은 그대로 둔다 (CSV 코덱이 이미 도메인 값으로 바꿔 뒀다)', () => {
    const [row] = toSeedRows([
      { value: { colors: ['red', 'pink'], bloom_months: [5, 6], toxic: true } },
    ]);
    expect(row).toEqual({ colors: ['red', 'pink'], bloom_months: [5, 6], toxic: true });
  });
});

/* ------------------------------------------------------------------ *
 * 반영
 * ------------------------------------------------------------------ */

describe('applyUpsert — 실제로 보내는 호출', () => {
  it('키가 있는 표는 onConflict 로 upsert 한다', async () => {
    const { client, calls } = fakeDb();
    const outcomes = await applyUpsert(
      client,
      makeDataset({
        flowers: [FLOWER, { id: 'tulip-white' }],
        pet_safety: [{ flower_id: 'rose-red', species: 'cat', toxic: false }],
      }),
    );

    expect(calls).toEqual([
      { table: 'flowers', op: 'upsert', rows: 2, onConflict: 'id', first: expect.anything() },
      {
        table: 'pet_safety',
        op: 'upsert',
        rows: 1,
        onConflict: 'flower_id,species',
        first: expect.anything(),
      },
    ]);
    expect(outcomes).toEqual([
      { key: 'flowers', table: 'flowers', strategy: 'upsert', rows: 2, chunks: 1 },
      { key: 'pet_safety', table: 'pet_safety', strategy: 'upsert', rows: 1, chunks: 1 },
    ]);
  });

  it('자연키가 없는 meanings 는 전체를 지우고 다시 넣는다', async () => {
    const { client, calls } = fakeDb();
    const outcomes = await applyUpsert(client, makeDataset({ meanings: [MEANING, MEANING] }));

    expect(calls.map((call) => `${call.table}:${call.op}`)).toEqual([
      'flower_meanings:delete',
      'flower_meanings:insert',
    ]);
    expect(calls[0]?.filter).toBe('id is null'); // 필터 없는 delete 를 PostgREST 가 거부한다
    expect(calls[1]?.rows).toBe(2);
    expect(outcomes[0]?.strategy).toBe('replace');
  });

  it('빈 데이터셋은 표를 비우지 않는다', async () => {
    const { client, calls } = fakeDb();
    const outcomes = await applyUpsert(client, makeDataset({ meanings: [] }));

    expect(calls).toEqual([]);
    expect(outcomes).toEqual([
      { key: 'meanings', table: 'flower_meanings', strategy: 'replace', rows: 0, chunks: 0 },
    ]);
  });

  it('큰 표는 나눠 보낸다', async () => {
    const { client, calls } = fakeDb();
    const rows = Array.from({ length: 5 }, (_, index) => ({ story_id: `s${index}` }));
    const outcomes = await applyUpsert(client, makeDataset({ stories: rows }), { chunkSize: 2 });

    expect(calls.map((call) => call.rows)).toEqual([2, 2, 1]);
    expect(calls.every((call) => call.onConflict === 'story_id')).toBe(true);
    expect(outcomes[0]).toEqual({
      key: 'stories',
      table: 'flower_stories',
      strategy: 'upsert',
      rows: 5,
      chunks: 3,
    });
  });

  it('기본 분할 크기 안이면 한 번에 보낸다', async () => {
    const { client, calls } = fakeDb();
    const rows = Array.from({ length: DEFAULT_CHUNK_SIZE }, (_, index) => ({ id: `f${index}` }));
    await applyUpsert(client, makeDataset({ flowers: rows }));
    expect(calls).toHaveLength(1);
  });

  it('실패하면 그 테이블 이름과 함께 멈추고 다음 표로 넘어가지 않는다', async () => {
    const { client, calls } = fakeDb({
      table: 'flowers',
      op: 'upsert',
      message: 'duplicate key value',
    });

    await expect(
      applyUpsert(client, makeDataset({ flowers: [FLOWER], meanings: [MEANING] })),
    ).rejects.toThrow(/flowers: duplicate key value/);
    expect(calls).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ *
 * 환경변수
 * ------------------------------------------------------------------ */

describe('readSupabaseConfig — 환경이 준비됐는가', () => {
  it('둘 다 있으면 설정을 돌려준다', () => {
    expect(
      readSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role',
      }),
    ).toEqual({ url: 'https://example.supabase.co', serviceRoleKey: 'service-role' });
  });

  it('하나라도 비면 null 이다 (빈 문자열도 없는 것으로 본다)', () => {
    expect(readSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://x.supabase.co' })).toBeNull();
    expect(readSupabaseConfig({ SUPABASE_SERVICE_ROLE_KEY: 'k' })).toBeNull();
    expect(
      readSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: '  ', SUPABASE_SERVICE_ROLE_KEY: 'k' }),
    ).toBeNull();
    expect(readSupabaseConfig({})).toBeNull();
  });
});
