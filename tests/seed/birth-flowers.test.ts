/**
 * content/birth_flowers.csv — 366일 탄생화 표.
 *
 * 이 파일이 지키려는 것은 두 가지다.
 *  1. **달력에 구멍이 없다.** 생일은 366가지뿐이고, 하나라도 비면 그 날 태어난
 *     사람에게는 보여 줄 것이 없다. 2월 29일도 실재하는 생일이므로 365가 아니라 366이다.
 *  2. **도감으로 가는 다리가 끊겨 있지 않다.** flower_id 는 비어 있어도 되지만
 *     (카탈로그에 없는 꽃이 정상 값이다), 적혀 있으면 반드시 flowers.csv 안에 있어야 한다.
 */

import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseCsv, readCsv } from '../../db/seed/parse';
import {
  BirthFlowerRowSchema,
  DAYS_IN_MONTH,
  LEAP_YEAR_DAYS,
  SEED_FILE_KEYS,
  SEED_FILE_NAMES,
  crossValidate,
  validateFile,
  type SeedDataset,
} from '../../db/seed/schemas';
import { formatIssue, type SeedIssue } from '../../db/seed/report';

const CONTENT_DIR = path.resolve(process.cwd(), 'content');
const BIRTH_FLOWERS_CSV = path.join(CONTENT_DIR, 'birth_flowers.csv');

const BIRTH_HEADER =
  'month,day,name_ko,name_en,scientific_name,flower_id,meaning_ko,source_url,editorial_note';

const SOURCE_URL = 'https://www.xn--oi2bpqy92ashbd12b.kr/bbs/content.php?co_id=flower_02';

function loadDataset() {
  const dataset: Record<string, unknown> = {};
  const issues: SeedIssue[] = [];
  for (const key of SEED_FILE_KEYS) {
    const records = readCsv(path.join(CONTENT_DIR, SEED_FILE_NAMES[key]));
    const result = validateFile(key, records);
    dataset[key] = result.rows;
    issues.push(...result.issues);
  }
  return { dataset: dataset as unknown as SeedDataset, issues };
}

function loadBirthFlowers() {
  const { dataset, issues } = loadDataset();
  expect(issues.map(formatIssue)).toEqual([]);
  return dataset;
}

/** 헤더 + 한 행짜리 인라인 CSV. */
function oneRow(row: string) {
  const records = parseCsv(`${BIRTH_HEADER}\n${row}\n`);
  expect(records).toHaveLength(1);
  return records[0];
}

type SafeParseLike =
  | { success: true }
  | { success: false; error: { issues: { path: PropertyKey[] }[] } };

function failedColumns(result: SafeParseLike): string[] {
  if (result.success) throw new Error('검증에 실패해야 하는 행이 통과했습니다');
  return result.error.issues.map((issue) => issue.path.join('.'));
}

/* ------------------------------------------------------------------ *
 * 1. 달력 — 366일이 빠짐없이, 한 번씩
 * ------------------------------------------------------------------ */

describe('birth_flowers.csv 달력', () => {
  it('윤년 366일이 정확히 366행이다', () => {
    expect(LEAP_YEAR_DAYS).toBe(366);
    const { birth_flowers: rows } = loadBirthFlowers();
    expect(rows).toHaveLength(LEAP_YEAR_DAYS);
  });

  it('모든 날짜가 정확히 한 번씩 나온다 (빠짐·중복 0)', () => {
    const { birth_flowers: rows } = loadBirthFlowers();
    const seen = new Map<string, number>();
    for (const row of rows) {
      const key = `${row.value.month}/${row.value.day}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }

    const missing: string[] = [];
    const duplicated: string[] = [];
    for (let month = 1; month <= 12; month += 1) {
      for (let day = 1; day <= DAYS_IN_MONTH[month - 1]; day += 1) {
        const count = seen.get(`${month}/${day}`) ?? 0;
        if (count === 0) missing.push(`${month}/${day}`);
        if (count > 1) duplicated.push(`${month}/${day}`);
      }
    }
    expect(missing).toEqual([]);
    expect(duplicated).toEqual([]);
    // 달력 밖의 날짜(2/30 등)가 섞여 있지 않다는 뜻이기도 하다.
    expect(seen.size).toBe(LEAP_YEAR_DAYS);
  });

  it('2월 29일이 있다 — 365일 표를 그대로 옮기지 않았다는 증거', () => {
    const { birth_flowers: rows } = loadBirthFlowers();
    const leapDay = rows.find((row) => row.value.month === 2 && row.value.day === 29);
    expect(leapDay).toBeDefined();
    expect(leapDay?.value.name_ko).toBe('아르메리아');
    // 대조 소스(순천만 365일 표)에 없는 유일한 행이라, 그 사실이 메모에 남아 있어야 한다.
    expect(leapDay?.value.editorial_note).toContain('순천만');
  });

  it('파일 순서가 1월 1일부터 12월 31일까지 달력 순이다', () => {
    const { birth_flowers: rows } = loadBirthFlowers();
    const asNumber = rows.map((row) => row.value.month * 100 + row.value.day);
    expect(asNumber).toEqual([...asNumber].sort((a, b) => a - b));
    expect(asNumber[0]).toBe(101);
    expect(asNumber[asNumber.length - 1]).toBe(1231);
  });
});

/* ------------------------------------------------------------------ *
 * 2. 필수 컬럼 — 이름·꽃말·출처
 * ------------------------------------------------------------------ */

describe('birth_flowers.csv 필수 컬럼', () => {
  it('모든 행이 이름·꽃말·출처를 갖는다', () => {
    const { birth_flowers: rows } = loadBirthFlowers();
    for (const row of rows) {
      const where = `${row.value.month}/${row.value.day}`;
      expect(row.value.name_ko.length, where).toBeGreaterThan(0);
      expect(row.value.meaning_ko.length, where).toBeGreaterThan(0);
      expect(row.value.source_url, where).toMatch(/^https?:\/\//);
    }
  });

  it('적재 회차 접두사(birth-v1)가 모든 행에 남아 있다', () => {
    const { birth_flowers: rows } = loadBirthFlowers();
    for (const row of rows) {
      expect(row.value.editorial_note ?? '').toMatch(/^birth-v1\b/);
    }
  });

  it('name_ko 가 비면 실패한다', () => {
    const record = oneRow(`1,1,,Snow Drop,,,희망,${SOURCE_URL},note`);
    const result = BirthFlowerRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('name_ko');
  });

  it('meaning_ko 가 비면 실패한다 — DB(0010)는 null 을 허용하지만 CSV 는 막는다', () => {
    const record = oneRow(`1,1,스노드롭,Snow Drop,,,,${SOURCE_URL},note`);
    const result = BirthFlowerRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('meaning_ko');
  });

  it('source_url 이 비거나 URL 형식이 아니면 실패한다', () => {
    const empty = BirthFlowerRowSchema.safeParse(oneRow('1,1,스노드롭,Snow Drop,,,희망,,note'));
    expect(empty.success).toBe(false);
    expect(failedColumns(empty)).toContain('source_url');

    const junk = BirthFlowerRowSchema.safeParse(oneRow('1,1,스노드롭,Snow Drop,,,희망,어디선가 봤음,note'));
    expect(junk.success).toBe(false);
    expect(failedColumns(junk)).toContain('source_url');
  });

  it('name_en·scientific_name·flower_id·editorial_note 는 비어도 통과한다', () => {
    const record = oneRow(`1,1,스노드롭,,,,희망,${SOURCE_URL},`);
    const result = BirthFlowerRowSchema.safeParse(record);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.name_en).toBeUndefined();
    expect(result.data.scientific_name).toBeUndefined();
    expect(result.data.flower_id).toBeUndefined();
    expect(result.data.editorial_note).toBeUndefined();
  });

  it('month·day 가 숫자로 변환된다', () => {
    const record = oneRow(`12,25,서양호랑가시나무,Holly,,,선견지명,${SOURCE_URL},note`);
    const result = BirthFlowerRowSchema.safeParse(record);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.month).toBe(12);
    expect(result.data.day).toBe(25);
  });

  it('month 13 · day 32 는 행 스키마가 막는다', () => {
    const badMonth = BirthFlowerRowSchema.safeParse(
      oneRow(`13,1,스노드롭,Snow Drop,,,희망,${SOURCE_URL},note`),
    );
    expect(failedColumns(badMonth)).toContain('month');

    const badDay = BirthFlowerRowSchema.safeParse(
      oneRow(`1,32,스노드롭,Snow Drop,,,희망,${SOURCE_URL},note`),
    );
    expect(failedColumns(badDay)).toContain('day');
  });

  it('flower_id 가 slug 형식이 아니면 실패한다', () => {
    const record = oneRow(`1,4,히아신스,Hyacinth,,Hyacinth!,차분한 사랑,${SOURCE_URL},note`);
    const result = BirthFlowerRowSchema.safeParse(record);
    expect(result.success).toBe(false);
    expect(failedColumns(result)).toContain('flower_id');
  });
});

/* ------------------------------------------------------------------ *
 * 3. 도감 연결 — 선택 참조이되 끊겨 있으면 안 된다
 * ------------------------------------------------------------------ */

describe('birth_flowers.csv 도감 연결', () => {
  it('적힌 flower_id 는 모두 flowers.csv 안에 있다', () => {
    const { flowers, birth_flowers: rows } = loadBirthFlowers();
    const ids = new Set(flowers.map((row) => row.value.id));
    for (const row of rows) {
      if (row.value.flower_id === undefined) continue;
      expect(ids, `${row.value.month}/${row.value.day}`).toContain(row.value.flower_id);
    }
  });

  it('빈 flower_id 가 다수다 — 366일은 카탈로그 47종보다 훨씬 넓다', () => {
    const { birth_flowers: rows } = loadBirthFlowers();
    const linked = rows.filter((row) => row.value.flower_id !== undefined);
    expect(linked.length).toBeGreaterThan(0);
    expect(linked.length).toBeLessThan(rows.length);
  });

  it('카탈로그 47종 중 절반 이상이 어느 날짜엔가 걸린다', () => {
    const { flowers, birth_flowers: rows } = loadBirthFlowers();
    const linked = new Set(
      rows.map((row) => row.value.flower_id).filter((id): id is string => id !== undefined),
    );
    // 이 비율이 무너지면 "생일로 도감에 들어간다"는 동선이 사실상 죽는다.
    expect(linked.size * 2).toBeGreaterThanOrEqual(flowers.length);
  });

  it('같은 꽃이 여러 날에 걸리는 것이 정상이다 (장미가 가장 많다)', () => {
    const { birth_flowers: rows } = loadBirthFlowers();
    const perFlower = new Map<string, number>();
    for (const row of rows) {
      const id = row.value.flower_id;
      if (id === undefined) continue;
      perFlower.set(id, (perFlower.get(id) ?? 0) + 1);
    }
    expect(perFlower.get('rose-red') ?? 0).toBeGreaterThanOrEqual(5);
    expect([...perFlower.values()].some((count) => count > 1)).toBe(true);
  });

  it('종이 갈리는데도 이어 붙인 행은 그 사실을 메모에 남긴다', () => {
    const { birth_flowers: rows } = loadBirthFlowers();
    const at = (month: number, day: number) =>
      rows.find((row) => row.value.month === month && row.value.day === day)?.value;

    // 붓꽃속 3행: 카탈로그 iris 는 더치 아이리스라 종이 다르다.
    for (const [month, day] of [[4, 17], [5, 10], [6, 6]] as const) {
      const row = at(month, day);
      expect(row?.flower_id, `${month}/${day}`).toBe('iris');
      expect(row?.editorial_note, `${month}/${day}`).toContain('도감 연결');
    }
    // 만수국 ↔ 금잔화 혼동은 flowers.csv 가 이미 기록해 둔 함정이다.
    expect(at(6, 5)?.editorial_note).toContain('Calendula');
    // 이름만 겹치는 꽃은 이어 붙이지 않는다.
    expect(at(3, 19)?.flower_id).toBeUndefined(); // 치자나무(Cape Jasmine)
    expect(at(8, 17)?.flower_id).toBeUndefined(); // 튤립나무(Tulip-Tree)
    // 사프란(Crocus sativus)·콜키쿰은 봄 크로커스와 종이 달라 잇지 않는다.
    expect(at(1, 24)?.flower_id).toBeUndefined(); // 가을에 피는 사프란(Saffron-Crocus)
    expect(at(9, 21)?.flower_id).toBeUndefined(); // 사프란(Autumn Crocus)
    // 같은 표가 종 이름으로 따로 세워 둔 앵초 친척들도 잇지 않는다.
    expect(at(5, 1)?.flower_id).toBeUndefined(); // 카우슬립 앵초(Primula veris)
    expect(at(5, 18)?.flower_id).toBeUndefined(); // 옥슬립 앵초(Primula elatior)
    expect(at(6, 21)?.flower_id).toBeUndefined(); // 달맞이꽃(Evening Primrose — 과가 다르다)
  });

  /*
   * seed-v6 에서 도감이 47종으로 늘며 **비연결이 연결로 뒤집힌 두 날**이다.
   * 그 전까지 이 두 행은 "이름만 겹치는 꽃"의 사례였다(수련≠백합 · 금잔화≠만수국).
   * 카탈로그가 그 꽃 자체를 갖게 되었으므로, 이제는 이어져 있어야 맞다.
   */
  it('도감이 늘면서 이어진 두 날은 그 사실을 메모에 남긴다 (seed-v6)', () => {
    const { birth_flowers: rows } = loadBirthFlowers();
    const at = (month: number, day: number) =>
      rows.find((row) => row.value.month === month && row.value.day === day)?.value;

    expect(at(4, 27)?.flower_id).toBe('water-lily'); // 수련(Water Lily)
    expect(at(4, 27)?.editorial_note).toContain('seed-v6');
    expect(at(8, 24)?.flower_id).toBe('calendula'); // 금잔화(Calendula)
    expect(at(8, 24)?.editorial_note).toContain('seed-v6');
  });
});

/* ------------------------------------------------------------------ *
 * 4. 교차 검증이 결손을 잡는가
 * ------------------------------------------------------------------ */

describe('birth_flowers 교차 검증', () => {
  it('날짜가 하나 빠지면 잡아낸다', () => {
    const { dataset } = loadDataset();
    const broken: SeedDataset = {
      ...dataset,
      birth_flowers: dataset.birth_flowers.filter(
        (row) => !(row.value.month === 7 && row.value.day === 7),
      ),
    };
    const { checks, issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.message.includes('7/7'))).toBe(true);
    expect(checks.find((check) => check.name.includes('366일'))?.ok).toBe(false);
  });

  it('같은 날짜가 두 번 나오면 잡아낸다', () => {
    const { dataset } = loadDataset();
    const first = dataset.birth_flowers[0];
    const broken: SeedDataset = {
      ...dataset,
      birth_flowers: [...dataset.birth_flowers, { line: 999, value: { ...first.value } }],
    };
    const { checks, issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.message.includes('두 번 나옵니다'))).toBe(true);
    expect(checks.find((check) => check.name.includes('366일'))?.ok).toBe(false);
  });

  it('달력에 없는 날짜(2/30)를 잡아낸다', () => {
    const { dataset } = loadDataset();
    const broken: SeedDataset = {
      ...dataset,
      birth_flowers: dataset.birth_flowers.map((row) =>
        row.value.month === 2 && row.value.day === 29
          ? { ...row, value: { ...row.value, day: 30 } }
          : row,
      ),
    };
    const { checks, issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.message.includes('2월은 29일까지'))).toBe(true);
    expect(checks.find((check) => check.name.includes('366일'))?.ok).toBe(false);
  });

  it('끊어진 flower_id 참조를 잡아낸다', () => {
    const { dataset } = loadDataset();
    const target = dataset.birth_flowers.findIndex((row) => row.value.flower_id !== undefined);
    expect(target).toBeGreaterThanOrEqual(0);
    const broken: SeedDataset = {
      ...dataset,
      birth_flowers: dataset.birth_flowers.map((row, index) =>
        index === target ? { ...row, value: { ...row.value, flower_id: 'ghost-flower' } } : row,
      ),
    };
    const { checks, issues } = crossValidate(broken);
    expect(
      issues.some(
        (issue) => issue.file === 'birth_flowers.csv' && issue.message.includes('ghost-flower'),
      ),
    ).toBe(true);
    expect(checks.find((check) => check.name.includes('카탈로그 연결'))?.ok).toBe(false);
  });

  it('빈 flower_id 는 참조 검사 대상이 아니다', () => {
    const { dataset } = loadDataset();
    const { checks, issues } = crossValidate(dataset);
    expect(issues.filter((issue) => issue.file === 'birth_flowers.csv')).toEqual([]);
    expect(checks.find((check) => check.name.includes('카탈로그 연결'))?.ok).toBe(true);
  });

  it('리포트가 행 수와 카탈로그 매칭 수를 함께 적는다', () => {
    const { dataset } = loadDataset();
    const { checks } = crossValidate(dataset);
    const calendar = checks.find((check) => check.name.includes('366일'));
    expect(calendar?.detail).toContain('366행');
    const link = checks.find((check) => check.name.includes('카탈로그 연결'));
    expect(link?.detail).toMatch(/카탈로그 \d+종 중 \d+종/);
  });
});

/* ------------------------------------------------------------------ *
 * 5. 저장 형식
 * ------------------------------------------------------------------ */

describe('birth_flowers.csv 저장 형식', () => {
  it('UTF-8 BOM 없이 LF 로 저장돼 있다', () => {
    const raw = readFileSync(BIRTH_FLOWERS_CSV, 'utf8');
    expect(raw.startsWith('﻿')).toBe(false);
    expect(raw.includes('\r')).toBe(false);
  });

  it('헤더가 0010_birth_flowers.sql 의 컬럼과 1:1 이다', () => {
    const raw = readFileSync(BIRTH_FLOWERS_CSV, 'utf8');
    expect(raw.split('\n')[0]).toBe(BIRTH_HEADER);
  });

  it('BOM 을 붙여 읽어도 같은 결과가 나온다', () => {
    const raw = readFileSync(BIRTH_FLOWERS_CSV, 'utf8');
    const fromFile = readCsv(BIRTH_FLOWERS_CSV);
    expect(parseCsv(`﻿${raw}`)).toEqual(fromFile);
    expect(fromFile).toHaveLength(366);
  });
});
