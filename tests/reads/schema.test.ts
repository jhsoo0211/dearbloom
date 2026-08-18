import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseCsv, readCsv } from '../../db/seed/parse';
import {
  READ_ACCESS_LEVELS,
  READ_KINDS,
  READ_PLACE_TAGS,
  READ_SEASON_TAGS,
  READ_STRAND_TAGS,
  READ_TAGS,
  READ_THEME_LABELS,
  ReadRowSchema,
  SEED_FILE_KEYS,
  SEED_FILE_NAMES,
  crossValidate,
  validateFile,
  type SeedDataset,
} from '../../db/seed/schemas';
import { SEED_TARGETS } from '../../db/seed/upsert';
import { formatIssue, type SeedIssue } from '../../db/seed/report';
import { READ_TAG_GROUPS, READ_TAGS as SCREEN_READ_TAGS } from '@/components/reads/tags';

/**
 * `content/reads.csv` — 「읽을거리」 원장의 회귀 가드.
 *
 * 조사 문서(`docs/reads-research.md`) §5-5 가 스크래치패드 스크립트로 한 번 돌린 검사를
 * 시드 스키마로 옮겼고, 이 파일이 그것이 계속 도는지 본다.
 *
 * 여기서 지키는 것 중 **가장 중요한 하나**: `event` 행에 종료일이 반드시 있다는 것.
 * 종료일이 없는 행사는 만료를 판정할 수 없어 화면에서 영영 사라지지 않는다(§6-2).
 */

const CONTENT_DIR = path.resolve(process.cwd(), 'content');

const READS_HEADER =
  'read_id,kind,title,source_title,author,source_url,published_at,starts_at,ends_at,region,summary_ko,access,confidence,reviewed_at,tags,links_to,editorial_note';

/** 통과하는 최소 행 — 검사마다 한 칸씩만 어긋뜨려 본다. */
const OK_EVENT = [
  'read-sample-festival',
  'event',
  '샘플 꽃축제',
  '샘플시',
  '',
  'https://example.com/festival',
  '',
  '2026-09-01',
  '2026-09-06',
  '샘플 지역',
  '샘플 축제예요.',
  'open',
  'repeated',
  '2026-08-17',
  '가을|축제|지방',
  '',
  '',
];

const OK_ARTICLE = [
  'read-sample-article',
  'article',
  '샘플 글',
  '샘플 매체',
  '',
  'https://example.com/article',
  '2026-02-20',
  '',
  '',
  '온라인',
  '샘플 글이에요.',
  'open',
  'single_source',
  '2026-08-17',
  '이야기|온라인',
  '',
  '',
];

/** 열 이름 → OK 행의 그 칸을 바꾼 한 줄을 파싱한다. */
function rowWith(base: string[], patch: Record<string, string>) {
  const columns = READS_HEADER.split(',');
  const cells = [...base];
  for (const [column, value] of Object.entries(patch)) {
    const index = columns.indexOf(column);
    expect(index, `${column} 컬럼이 헤더에 없다`).toBeGreaterThanOrEqual(0);
    cells[index] = value;
  }
  // 값에 쉼표·따옴표가 없는 샘플만 쓰므로 그대로 이어 붙여도 안전하다.
  const records = parseCsv(`${READS_HEADER}\n${cells.join(',')}\n`);
  expect(records).toHaveLength(1);
  return ReadRowSchema.safeParse(records[0]);
}

function messagesOf(result: ReturnType<typeof rowWith>): string[] {
  if (result.success) throw new Error('검증에 실패해야 하는 행이 통과했습니다');
  return result.error.issues.map((issue) => issue.message);
}

/** content/ 전체를 읽어 행 검증까지 마친 데이터셋. */
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

/* ------------------------------------------------------------------ *
 * 1. 원장이 실제로 통과하는가
 * ------------------------------------------------------------------ */

describe('content/reads.csv 실제 데이터', () => {
  it('시드 파이프라인에 등록돼 있다 (파일 목록 · 반영 대상)', () => {
    expect(SEED_FILE_KEYS).toContain('reads');
    expect(SEED_FILE_NAMES.reads).toBe('reads.csv');
    // 등록만 하고 반영 대상을 빠뜨리면 `seed:apply` 가 그 자리에서 멈춘다.
    expect(SEED_TARGETS.reads).toEqual({
      table: 'reads',
      strategy: { kind: 'upsert', onConflict: 'read_id' },
    });
  });

  it('54건이 전부 행 스키마를 통과한다', () => {
    const { dataset, issues } = loadDataset();
    expect(issues.filter((issue) => issue.file === 'reads.csv').map(formatIssue)).toEqual([]);
    expect(dataset.reads).toHaveLength(54);
  });

  it('갈래 분포가 조사 문서 §4 와 같다 (행사 20 · 글 13 · 트렌드 11 · 실용 10)', () => {
    const { dataset } = loadDataset();
    const count = (kind: string) => dataset.reads.filter((row) => row.value.kind === kind).length;
    expect(count('event')).toBe(20);
    expect(count('article')).toBe(13);
    expect(count('trend')).toBe(11);
    expect(count('guide')).toBe(10);
  });

  it('행사 20건이 전부 시작·종료일을 갖고 종료일이 시작일 뒤다', () => {
    const { dataset } = loadDataset();
    const events = dataset.reads.filter((row) => row.value.kind === 'event');
    expect(events).toHaveLength(20);
    for (const row of events) {
      expect(row.value.starts_at, row.value.read_id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(row.value.ends_at, row.value.read_id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(row.value.ends_at! >= row.value.starts_at!, row.value.read_id).toBe(true);
    }
  });

  it('행사가 아닌 행에는 날짜가 새어 들어오지 않았다', () => {
    const { dataset } = loadDataset();
    for (const row of dataset.reads) {
      if (row.value.kind === 'event') continue;
      expect(row.value.starts_at, row.value.read_id).toBeUndefined();
      expect(row.value.ends_at, row.value.read_id).toBeUndefined();
    }
  });

  it('본문을 담는 칸이 아예 없다 — 우리는 크롤링하지 않는다 (§1)', () => {
    /* 헤더에 본문·요약 원문·이미지 칸이 생기는 순간, 그 칸을 채우는 일이 곧 복제가 된다.
       스키마가 그 칸을 모르는 상태로 두는 것이 가장 싼 방어다. */
    const header = READS_HEADER.split(',');
    for (const forbidden of ['body', 'body_ko', 'content', 'excerpt', 'image_url', 'thumbnail']) {
      expect(header, forbidden).not.toContain(forbidden);
    }
    // `summary_ko` 는 **우리가 쓴 한 줄**이다 — 그 칸만 있다는 사실이 규범의 절반이다.
    expect(header).toContain('summary_ko');
  });

  it('출처는 전부 https 이고, 유료 장벽은 데이터에 표시돼 있다', () => {
    const { dataset } = loadDataset();
    for (const row of dataset.reads) {
      expect(row.value.source_url, row.value.read_id).toMatch(/^https:\/\//);
    }
    // 조사 문서 §3-4: 내셔널지오그래픽 한 건이 현재 유일한 비-open 항목이다.
    const gated = dataset.reads.filter((row) => row.value.access !== 'open');
    expect(gated).toHaveLength(1);
    expect(gated[0].value.read_id).toBe('read-natgeo-aalsmeer');
  });

  it('tags 세 축 규칙을 전 행이 지킨다 (자리 1 · 결 ≥1 · 행사는 계절 ≥1)', () => {
    const { dataset } = loadDataset();
    for (const row of dataset.reads) {
      const places = row.value.tags.filter((tag) =>
        (READ_PLACE_TAGS as readonly string[]).includes(tag),
      );
      expect(places, row.value.read_id).toHaveLength(1);
      expect(
        row.value.tags.some((tag) => (READ_STRAND_TAGS as readonly string[]).includes(tag)),
        row.value.read_id,
      ).toBe(true);
      if (row.value.kind === 'event') {
        expect(
          row.value.tags.some((tag) => (READ_SEASON_TAGS as readonly string[]).includes(tag)),
          row.value.read_id,
        ).toBe(true);
      }
    }
  });
});

/* ------------------------------------------------------------------ *
 * 2. 어휘 두 벌이 어긋나지 않는가
 * ------------------------------------------------------------------ */

describe('칩 어휘는 시드와 화면이 같은 13종을 본다', () => {
  it('평면 목록이 글자까지 같다', () => {
    // 값이 한국어 라벨 그 자체라 오타가 타입 오류로 잡히지 않는다 — 그래서 여기서 맞댄다.
    expect([...SCREEN_READ_TAGS].sort()).toEqual([...READ_TAGS].sort());
    expect(SCREEN_READ_TAGS).toHaveLength(13);
  });

  it('축별 묶음도 같다', () => {
    const byAxis = new Map(READ_TAG_GROUPS.map((group) => [group.axis, [...group.tags]]));
    expect(byAxis.get('season')).toEqual([...READ_SEASON_TAGS]);
    expect(byAxis.get('strand')).toEqual([...READ_STRAND_TAGS]);
    expect(byAxis.get('place')).toEqual([...READ_PLACE_TAGS]);
  });

  it('어휘 세 벌이 서로 겹치지 않는다 — 축 판정이 한 값에 두 답을 내면 안 된다', () => {
    expect(new Set(READ_TAGS).size).toBe(READ_TAGS.length);
  });
});

/* ------------------------------------------------------------------ *
 * 3. 행 스키마가 결손을 잡는가
 * ------------------------------------------------------------------ */

describe('reads 행 스키마', () => {
  it('멀쩡한 행사·글은 통과한다 (검사가 헛돌지 않는다)', () => {
    expect(rowWith(OK_EVENT, {}).success).toBe(true);
    expect(rowWith(OK_ARTICLE, {}).success).toBe(true);
  });

  it('종료일 없는 행사를 막는다 — 영원히 안 사라지는 행을 만들지 않는다', () => {
    expect(messagesOf(rowWith(OK_EVENT, { ends_at: '' })).join('\n')).toContain(
      '영원히 사라지지 않습니다',
    );
  });

  it('시작일 없는 행사를 막는다', () => {
    expect(messagesOf(rowWith(OK_EVENT, { starts_at: '' })).join('\n')).toContain('시작일이 필요');
  });

  it('종료일이 시작일보다 앞서면 막는다', () => {
    expect(messagesOf(rowWith(OK_EVENT, { ends_at: '2026-08-31' })).join('\n')).toContain(
      '종료일이 시작일보다 앞섭니다',
    );
  });

  it('행사가 아닌 행의 날짜를 막는다', () => {
    const messages = messagesOf(
      rowWith(OK_ARTICLE, { starts_at: '2026-09-01', ends_at: '2026-09-06' }),
    ).join('\n');
    expect(messages).toContain('조용히 사라집니다');
  });

  it('자리 태그가 없거나 둘이면 막는다', () => {
    expect(messagesOf(rowWith(OK_EVENT, { tags: '가을|축제' })).join('\n')).toContain(
      '정확히 1개',
    );
    expect(messagesOf(rowWith(OK_EVENT, { tags: '가을|축제|지방|해외' })).join('\n')).toContain(
      '정확히 1개',
    );
  });

  it('결 태그가 없으면 막는다', () => {
    expect(messagesOf(rowWith(OK_EVENT, { tags: '가을|지방' })).join('\n')).toContain(
      '결 태그',
    );
  });

  it('행사에 계절 태그가 없으면 막는다', () => {
    expect(messagesOf(rowWith(OK_EVENT, { tags: '축제|지방' })).join('\n')).toContain(
      '계절 태그가 최소 1개',
    );
  });

  it('어휘 밖 태그를 막는다', () => {
    expect(messagesOf(rowWith(OK_EVENT, { tags: '가을|축제|지방|봄맞이' })).join('\n')).toContain(
      '중 하나여야 합니다',
    );
  });

  it('어휘 밖 kind·access 를 막는다', () => {
    expect(rowWith(OK_EVENT, { kind: 'festival' }).success).toBe(false);
    expect(rowWith(OK_EVENT, { access: 'free' }).success).toBe(false);
    // 허용 값은 전부 통과한다.
    for (const kind of READ_KINDS) {
      // 행사가 아닌 갈래로 바꿀 때는 날짜도 함께 비운다(그 조합만이 유효한 행이다).
      const patch: Record<string, string> =
        kind === 'event' ? { kind } : { kind, starts_at: '', ends_at: '' };
      expect(rowWith(OK_EVENT, patch).success, kind).toBe(true);
    }
    for (const access of READ_ACCESS_LEVELS) {
      expect(rowWith(OK_EVENT, { access }).success, access).toBe(true);
    }
  });

  it('http 출처를 막는다 — 전 건을 https 로 열어 확인했다', () => {
    expect(
      messagesOf(rowWith(OK_EVENT, { source_url: 'http://example.com/festival' })).join('\n'),
    ).toContain('https');
  });

  it('`read-` 로 시작하지 않는 id 를 막는다', () => {
    expect(messagesOf(rowWith(OK_EVENT, { read_id: 'festival-sample' })).join('\n')).toContain(
      'read-',
    );
  });

  it('links_to 의 모양을 본다 (접두사:값)', () => {
    expect(messagesOf(rowWith(OK_EVENT, { links_to: 'rose-red' })).join('\n')).toContain(
      'links_to 는',
    );
    expect(messagesOf(rowWith(OK_EVENT, { links_to: 'species:rosa' })).join('\n')).toContain(
      'links_to 는',
    );
    expect(rowWith(OK_EVENT, { links_to: 'flower:rose-red|color:red|theme:숲빛' }).success).toBe(
      true,
    );
  });
});

/* ------------------------------------------------------------------ *
 * 4. 교차 검증이 끊어진 연결을 잡는가
 * ------------------------------------------------------------------ */

describe('읽을거리 교차 검증 (links_to 참조 무결성)', () => {
  const CHECK = '읽을거리';

  it('실제 원장은 통과한다', () => {
    const { dataset } = loadDataset();
    const { checks, issues } = crossValidate(dataset);
    expect(issues.filter((issue) => issue.file === 'reads.csv')).toEqual([]);
    const check = checks.find((candidate) => candidate.name.includes(CHECK));
    expect(check?.ok).toBe(true);
    expect(check?.detail).toMatch(/54건\(행사 20\)/);
  });

  it('없는 꽃 id 를 잡아낸다 — 조용히 깨진 도감 링크를 막는다', () => {
    const { dataset } = loadDataset();
    const target = dataset.reads.findIndex((row) =>
      row.value.links_to.some((link) => link.startsWith('flower:')),
    );
    expect(target).toBeGreaterThanOrEqual(0);
    const broken: SeedDataset = {
      ...dataset,
      reads: dataset.reads.map((row, index) =>
        index === target ? { ...row, value: { ...row.value, links_to: ['flower:ghost'] } } : row,
      ),
    };
    const { checks, issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.message.includes('ghost'))).toBe(true);
    expect(checks.find((candidate) => candidate.name.includes(CHECK))?.ok).toBe(false);
  });

  it('flowers.csv 의 colors 어휘 밖 색을 잡아낸다', () => {
    const { dataset } = loadDataset();
    const broken: SeedDataset = {
      ...dataset,
      reads: dataset.reads.map((row, index) =>
        index === 0 ? { ...row, value: { ...row.value, links_to: ['color:teal'] } } : row,
      ),
    };
    const { issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.message.includes('teal'))).toBe(true);
  });

  it('계열 5종 밖 라벨을 잡아낸다', () => {
    const { dataset } = loadDataset();
    const broken: SeedDataset = {
      ...dataset,
      reads: dataset.reads.map((row, index) =>
        index === 0 ? { ...row, value: { ...row.value, links_to: ['theme:하늘빛'] } } : row,
      ),
    };
    const { issues } = crossValidate(broken);
    expect(issues.some((issue) => issue.message.includes('하늘빛'))).toBe(true);
    // 메시지가 허용 목록을 그대로 적어 준다 — 고칠 사람이 문서를 찾지 않아도 되게.
    expect(issues.some((issue) => issue.message.includes(READ_THEME_LABELS[0]))).toBe(true);
  });

  it('같은 read_id 가 두 번 나오면 두 줄을 함께 짚는다', () => {
    const { dataset } = loadDataset();
    const first = dataset.reads[0];
    const broken: SeedDataset = {
      ...dataset,
      reads: [...dataset.reads, { ...first, line: first.line + 1000 }],
    };
    const { checks, issues } = crossValidate(broken);
    const issue = issues.find(
      (candidate) => candidate.file === 'reads.csv' && candidate.column === 'read_id',
    );
    expect(issue?.message).toContain(first.value.read_id);
    expect(issue?.message).toContain(`앞선 행: ${first.line}번째 줄`);
    expect(checks.find((candidate) => candidate.name.includes(CHECK))?.ok).toBe(false);
  });
});
