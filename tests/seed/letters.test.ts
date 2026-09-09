import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  SEED_LETTER_RPC,
  applyLetterSeed,
  maskCode,
  parseLetterSeedFile,
  renderIssue,
  renderLetterLine,
  resolveFileArg,
  type LetterSeed,
  type LetterSeedClient,
  type LetterSeedResponse,
} from '../../db/seed/letters';

/**
 * 편지 시드 CLI 의 그물 — **실 DB 없이** 잰다.
 *
 * 여기서 지키는 것은 다섯이다:
 *   · 잘못된 편지가 DB 까지 가지 않는가 (스키마·꽃 id·중복 번호·보관 기한)
 *   · 한 통이라도 걸리면 **한 통도 심지 않는가** (절반만 들어간 묶음이 더 나쁘다)
 *   · 번호가 로그에 그대로 찍히지 않는가 (터미널 로그가 곧 편지의 열쇠다)
 *   · 실패를 모아서 말하되 **DB 메시지를 싣지 않는가** (실패 행 = 편지 본문)
 *   · 화면(터미널)에 나가는 줄에 **제목·본문·서명이 없는가**
 */

const ROOT = path.resolve(__dirname, '../..');

/** 예시 파일에 실제로 있는 꽃들. 대조 집합은 CLI 가 flowers.csv 에서 만든다. */
const FLOWERS = new Set(['freesia', 'lavender', 'tulip-white']);

const NOW = new Date('2026-09-09T00:00:00+09:00');

function letter(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    code: 'HANBIT',
    recipientName: '한빛',
    body: '고맙다는 말, 너무 오래 미뤘지.',
    flowerId: 'freesia',
    theme: 'gold',
    signature: '수호',
    ...overrides,
  };
}

function parse(rows: unknown, now: Date = NOW) {
  return parseLetterSeedFile({ letters: rows }, FLOWERS, now);
}

/* ------------------------------------------------------------------ *
 * 1. 파싱·검증
 * ------------------------------------------------------------------ */

describe('parseLetterSeedFile — 잘못된 편지는 DB 까지 가지 않는다', () => {
  it('제대로 된 편지 한 통을 통과시키고 번호를 정규화한다', () => {
    const { letters, issues } = parse([letter({ code: ' hanbit ' })]);

    expect(issues).toEqual([]);
    expect(letters).toHaveLength(1);
    expect(letters[0]?.code).toBe('HANBIT');
    expect(letters[0]?.body).toBe('고맙다는 말, 너무 오래 미뤘지.');
    // 제목은 선택이다 — 비우면 칸 자체가 없다(letterContentSchema).
    expect(letters[0]).not.toHaveProperty('title');
  });

  it('파일 모양이 아니면 그 자리에서 멈춘다', () => {
    expect(parseLetterSeedFile([], FLOWERS, NOW).issues[0]?.field).toBe('-');
    expect(parseLetterSeedFile({}, FLOWERS, NOW).issues[0]?.field).toBe('letters');
    expect(parseLetterSeedFile({ letters: [] }, FLOWERS, NOW).issues[0]?.message).toContain(
      '한 통도',
    );
  });

  it('편지 스키마를 그대로 쓴다 — 빈 본문·상한 초과·모르는 색감', () => {
    expect(parse([letter({ body: '' })]).issues.some((i) => i.field === 'body')).toBe(true);
    expect(parse([letter({ body: '가'.repeat(1001) })]).issues.some((i) => i.field === 'body')).toBe(
      true,
    );
    expect(parse([letter({ theme: 'neon' })]).issues.some((i) => i.field === 'theme')).toBe(true);
    expect(
      parse([letter({ recipientName: '' })]).issues.some((i) => i.field === 'recipientName'),
    ).toBe(true);
  });

  it('번호 형식이 어긋나면 걸린다', () => {
    expect(parse([letter({ code: 'AB' })]).issues.some((i) => i.field === 'code')).toBe(true);
    expect(parse([letter({ code: '한글번호' })]).issues.some((i) => i.field === 'code')).toBe(true);
    expect(parse([letter({ code: undefined })]).issues.some((i) => i.field === 'code')).toBe(true);
  });

  it('꽃 도감에 없는 id 는 걸린다 — 화면에서 꽃 자리가 조용히 비기 때문', () => {
    const { issues } = parse([letter({ flowerId: 'no-such-flower' })]);
    expect(issues.some((issue) => issue.field === 'flowerId')).toBe(true);
  });

  it('파일 안에서 같은 번호를 두 통이 쓰지 못한다', () => {
    const { issues } = parse([letter(), letter({ recipientName: '다른 분' })]);
    const clash = issues.find((issue) => issue.field === 'code');
    expect(clash?.index).toBe(1);
    expect(clash?.message).toContain('1번째');
  });

  it('대소문자만 다른 번호도 같은 번호로 본다', () => {
    const { issues } = parse([letter(), letter({ code: 'hanbit', recipientName: '다른 분' })]);
    expect(issues.some((issue) => issue.field === 'code')).toBe(true);
  });

  it('모르는 칸은 오타로 본다 — 조용히 무시하면 그 값이 영영 안 들어간다', () => {
    const { issues } = parse([letter({ expiresat: '2027-01-01T00:00:00+09:00' })]);
    expect(issues.some((issue) => issue.field === 'expiresat')).toBe(true);
  });

  describe('보관 기한', () => {
    it('시간대가 붙은 미래 시각만 통과한다', () => {
      const { letters, issues } = parse([letter({ expiresAt: '2027-01-01T00:00:00+09:00' })]);
      expect(issues).toEqual([]);
      expect(letters[0]?.expiresAt).toBe('2027-01-01T00:00:00+09:00');
    });

    it('시간대가 없으면 걸린다 — 돌리는 기계마다 다른 순간이 된다', () => {
      const { issues } = parse([letter({ expiresAt: '2027-01-01T00:00:00' })]);
      expect(issues[0]?.field).toBe('expiresAt');
    });

    it('이미 지난 기한은 걸린다 — 심는 순간부터 아무도 못 여는 편지가 된다', () => {
      const { issues } = parse([letter({ expiresAt: '2020-01-01T00:00:00Z' })]);
      expect(issues[0]?.message).toContain('이미 지났습니다');
    });

    it('빈 값은 "기한 없음" 으로 읽는다', () => {
      const { letters, issues } = parse([letter({ expiresAt: '' })]);
      expect(issues).toEqual([]);
      expect(letters[0]).not.toHaveProperty('expiresAt');
    });
  });

  it('한 통이라도 걸리면 한 통도 넘기지 않는다', () => {
    const { letters, issues } = parse([
      letter({ code: 'GOODCODE' }),
      letter({ code: 'AB', recipientName: '두 번째' }),
    ]);
    expect(issues.length).toBeGreaterThan(0);
    expect(letters).toEqual([]);
  });

  it('오류 문구에 편지 본문을 싣지 않는다', () => {
    const secret = '아무도 몰라야 하는 문장이에요.';
    const { issues } = parse([letter({ body: secret, code: 'AB' })]);
    for (const issue of issues) {
      expect(issue.message).not.toContain(secret);
    }
  });
});

/* ------------------------------------------------------------------ *
 * 2. 번호 가리기
 * ------------------------------------------------------------------ */

describe('maskCode — 번호는 로그에 남지 않는다', () => {
  it('앞 2 · 뒤 2 만 남긴다', () => {
    expect(maskCode('HANBIT')).toBe('HA**IT');
    expect(maskCode('ABCDEFGHIJ')).toBe('AB******IJ');
  });

  it('가장 짧은 번호(4자)도 절반 넘게 가린다', () => {
    expect(maskCode('ABCD')).toBe('A***');
  });

  it('정규화한 뒤에 가린다 — 소문자로 적어 와도 같은 모양이다', () => {
    expect(maskCode(' hanbit ')).toBe('HA**IT');
  });

  it('원문 글자가 가운데에 남지 않는다', () => {
    const masked = maskCode('SECRET77');
    expect(masked).not.toContain('CRE');
    expect(masked.length).toBe('SECRET77'.length);
  });
});

/* ------------------------------------------------------------------ *
 * 3. 반영
 * ------------------------------------------------------------------ */

interface RecordedRpc {
  fn: string;
  args: Record<string, unknown>;
}

/** 번호별로 답을 정해 두는 가짜 클라이언트. 네트워크를 타지 않는다. */
function fakeRpc(byCode: Record<string, LetterSeedResponse>): {
  client: LetterSeedClient;
  calls: RecordedRpc[];
} {
  const calls: RecordedRpc[] = [];
  const client: LetterSeedClient = {
    rpc(fn, args) {
      calls.push({ fn, args });
      const code = String(args.p_code);
      return Promise.resolve(
        byCode[code] ?? { data: [{ id: 'letter-x', action: 'inserted' }], error: null },
      );
    },
  };
  return { client, calls };
}

const SEED_ONE: LetterSeed = {
  recipientName: '한빛',
  body: '고맙다는 말, 너무 오래 미뤘지.',
  flowerId: 'freesia',
  theme: 'gold',
  signature: '수호',
  code: 'HANBIT',
};

describe('applyLetterSeed — 심고 나서 무엇이 일어났는지 센다', () => {
  it('seed_letter 에 번호·본문·기한을 넘긴다', async () => {
    const fake = fakeRpc({});
    await applyLetterSeed(fake.client, [{ ...SEED_ONE, expiresAt: '2027-01-01T00:00:00+09:00' }]);

    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0]?.fn).toBe(SEED_LETTER_RPC);
    expect(fake.calls[0]?.args.p_code).toBe('HANBIT');
    expect(fake.calls[0]?.args.p_expires_at).toBe('2027-01-01T00:00:00+09:00');
    // 번호는 payload 에 실리지 않는다 — 서버가 해시로만 든다.
    expect(fake.calls[0]?.args.p_payload).toEqual({
      recipientName: '한빛',
      body: SEED_ONE.body,
      flowerId: 'freesia',
      theme: 'gold',
      signature: '수호',
    });
  });

  it('기한이 없으면 null 로 넘긴다', async () => {
    const fake = fakeRpc({});
    await applyLetterSeed(fake.client, [SEED_ONE]);
    expect(fake.calls[0]?.args.p_expires_at).toBeNull();
  });

  it('inserted · updated 를 나누어 센다', async () => {
    const fake = fakeRpc({
      AAAA11: { data: [{ id: 'a', action: 'inserted' }], error: null },
      BBBB22: { data: [{ id: 'b', action: 'updated' }], error: null },
      CCCC33: { data: { id: 'c', action: 'updated' }, error: null },
    });
    const result = await applyLetterSeed(fake.client, [
      { ...SEED_ONE, code: 'AAAA11' },
      { ...SEED_ONE, code: 'BBBB22' },
      { ...SEED_ONE, code: 'CCCC33' },
    ]);

    expect(result).toEqual({ inserted: 1, updated: 2, failures: [] });
  });

  it('23505 는 실패로 세되 나머지는 계속 심는다', async () => {
    const fake = fakeRpc({
      TAKEN99: { data: null, error: { message: 'code taken', code: '23505' } },
    });
    const result = await applyLetterSeed(fake.client, [
      { ...SEED_ONE, code: 'AAAA11' },
      { ...SEED_ONE, code: 'TAKEN99' },
      { ...SEED_ONE, code: 'BBBB22' },
    ]);

    expect(result.inserted).toBe(2);
    expect(result.failures).toEqual([{ code: 'TA***99', sqlstate: '23505' }]);
    // 멈추지 않았다 — 세 통 모두 시도했다.
    expect(fake.calls).toHaveLength(3);
  });

  it('실패에 DB 메시지를 싣지 않는다 (실패 행이 곧 편지 본문이다)', async () => {
    const leaky = `check constraint 실패 — 실패한 행: (${SEED_ONE.body})`;
    const fake = fakeRpc({ HANBIT: { data: null, error: { message: leaky, code: '23514' } } });

    const result = await applyLetterSeed(fake.client, [SEED_ONE]);

    expect(result.failures).toEqual([{ code: 'HA**IT', sqlstate: '23514' }]);
    expect(JSON.stringify(result)).not.toContain(SEED_ONE.body);
    // 번호 원문도 결과에 없다.
    expect(JSON.stringify(result)).not.toContain('HANBIT');
  });

  it('SQLSTATE 가 없는 실패도 삼키지 않는다', async () => {
    const fake = fakeRpc({ HANBIT: { data: null, error: { message: '연결 실패' } } });
    const result = await applyLetterSeed(fake.client, [SEED_ONE]);
    expect(result.failures[0]?.sqlstate).toBe('알 수 없음');
  });

  it('응답이 비면 성공으로 세지 않는다', async () => {
    const fake = fakeRpc({ HANBIT: { data: [], error: null } });
    const result = await applyLetterSeed(fake.client, [SEED_ONE]);
    expect(result).toEqual({ inserted: 0, updated: 0, failures: [{ code: 'HA**IT', sqlstate: '응답 없음' }] });
  });
});

/* ------------------------------------------------------------------ *
 * 4. 출력 — 화면에 나가도 되는 것만
 * ------------------------------------------------------------------ */

describe('출력 — 제목·본문·서명은 터미널에 나가지 않는다', () => {
  it('한 줄에 받는 분·꽃·가린 번호·기한만 담는다', () => {
    const line = renderLetterLine(
      { ...SEED_ONE, title: '오래 미뤄 둔 말', expiresAt: '2027-01-01T00:00:00+09:00' },
      0,
    );

    expect(line).toContain('한빛');
    expect(line).toContain('freesia');
    expect(line).toContain('HA**IT');
    expect(line).toContain('2027-01-01T00:00:00+09:00');

    expect(line).not.toContain('HANBIT');
    expect(line).not.toContain('오래 미뤄 둔 말');
    expect(line).not.toContain(SEED_ONE.body);
    expect(line).not.toContain('수호');
  });

  it('기한이 없으면 그렇게 말한다', () => {
    expect(renderLetterLine(SEED_ONE, 0)).toContain('기한 없음');
  });

  it('오류 줄은 몇 번째 편지의 어느 칸인지만 말한다', () => {
    expect(renderIssue({ index: 2, field: 'code', message: '번호를 다시 봐 주세요.' })).toContain(
      '3번째 편지',
    );
    expect(renderIssue({ index: null, field: 'letters', message: '없습니다.' })).toContain('파일');
  });
});

/* ------------------------------------------------------------------ *
 * 5. CLI 인자 · 예시 파일
 * ------------------------------------------------------------------ */

describe('CLI 인자', () => {
  it('--file <경로> 와 --file=<경로> 를 둘 다 받는다', () => {
    expect(resolveFileArg(['--file', 'a.json'])).toBe('a.json');
    expect(resolveFileArg(['--file=a.json', '--apply'])).toBe('a.json');
    expect(resolveFileArg(['--apply'])).toBeNull();
    // 값 자리에 다음 옵션이 오면 파일을 못 받은 것이다.
    expect(resolveFileArg(['--file', '--apply'])).toBeNull();
  });
});

describe('커밋된 예시 파일', () => {
  const example = JSON.parse(
    readFileSync(path.join(ROOT, 'db/seed/letters.example.json'), 'utf8'),
  ) as unknown;

  it('그대로 검증을 통과한다 — 문서가 곧 돌아가는 예시다', () => {
    const flowerIds = new Set(
      readFileSync(path.join(ROOT, 'content/flowers.csv'), 'utf8')
        .split('\n')
        .slice(1)
        .map((line) => line.split(',')[0]?.trim())
        .filter((id): id is string => Boolean(id)),
    );

    const { letters, issues } = parseLetterSeedFile(example, flowerIds, NOW);
    expect(issues).toEqual([]);
    expect(letters.length).toBeGreaterThan(1);
  });
});
