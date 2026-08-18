import { describe, expect, it } from 'vitest';

import {
  daysBetween,
  hasEnded,
  readPeriodLabel,
  readPublishedLabel,
  readStatus,
  readStatusLabel,
  todayInKst,
} from '@/components/reads/expiry';

/**
 * 만료 판정 — 「읽을거리」에서 **지난 행사가 남지 않게** 하는 자리의 경계 검사.
 *
 * 조사 문서 §6-1 이 못 박은 규칙:
 *   끝남 = ends_at !== '' && ends_at < todayKST
 *   아직 = starts_at !== '' && starts_at > todayKST
 *   열림 = !끝남 && !아직
 * **경계는 포함이다** — 오늘이 마지막 날인 행사는 아직 갈 수 있다. 이 파일이 지키는 것이
 * 바로 그 한 칸이다(`<` 를 `<=` 로 뒤집으면 마지막 날 아침에 축제가 사라진다).
 */

const TODAY = '2026-08-18';

describe('§6-1 판정표 — 경계는 포함이다', () => {
  it('어제 끝난 행사는 끝났다', () => {
    const item = { startsAt: '2026-08-01', endsAt: '2026-08-17' };
    expect(readStatus(item, TODAY)).toBe('ended');
    expect(hasEnded(item, TODAY)).toBe(true);
  });

  it('오늘 끝나는 행사는 **아직 열려 있다**', () => {
    const item = { startsAt: '2026-08-01', endsAt: TODAY };
    expect(readStatus(item, TODAY)).toBe('open');
    expect(hasEnded(item, TODAY)).toBe(false);
    expect(readStatusLabel(item, TODAY)).toBe('오늘까지예요');
  });

  it('오늘 시작하는 행사는 열려 있다', () => {
    const item = { startsAt: TODAY, endsAt: '2026-09-01' };
    expect(readStatus(item, TODAY)).toBe('open');
  });

  it('내일 시작하는 행사는 아직이다 (보이되 시작 전이라고 말한다)', () => {
    const item = { startsAt: '2026-08-19', endsAt: '2026-08-30' };
    expect(readStatus(item, TODAY)).toBe('upcoming');
    expect(hasEnded(item, TODAY)).toBe(false);
    expect(readStatusLabel(item, TODAY)).toBe('내일 열려요');
  });

  it('날짜가 없는 항목(글·실용·트렌드)은 만료 판정 대상이 아니다', () => {
    expect(readStatus({}, TODAY)).toBe('evergreen');
    expect(hasEnded({}, TODAY)).toBe(false);
    expect(readStatusLabel({}, TODAY)).toBeUndefined();
  });

  it('연례 미정 — 종료일 없이 시작일만 있는 행은 절대 사라지지 않는다', () => {
    /* 그래서 스키마가 `event` 에 종료일을 **필수**로 걸었다(§6-2). 이 검사는 그 규칙이
       왜 필요한지를 코드로 남긴다: 여기서 `ended` 가 나오는 길이 없다. */
    const noEnd = { startsAt: '2026-01-01' };
    expect(readStatus(noEnd, TODAY)).toBe('open');
    expect(hasEnded(noEnd, '2099-12-31')).toBe(false);

    // 반대로 시작일 없이 종료일만 있으면 종료일 하나로 판정한다.
    expect(readStatus({ endsAt: '2026-08-17' }, TODAY)).toBe('ended');
  });
});

describe('상태 한 줄 — 남은 날을 말한다', () => {
  it('일주일 안에 끝나면 남은 날을 센다', () => {
    expect(readStatusLabel({ startsAt: '2026-08-01', endsAt: '2026-08-21' }, TODAY)).toBe(
      '3일 남았어요',
    );
    // 8일째부터는 날수를 세지 않는다 — 아직 급하지 않다는 뜻이 그 경계다.
    expect(readStatusLabel({ startsAt: '2026-08-01', endsAt: '2026-08-25' }, TODAY)).toBe(
      '7일 남았어요',
    );
    expect(readStatusLabel({ startsAt: '2026-08-01', endsAt: '2026-08-26' }, TODAY)).toBe(
      '지금 열려 있어요',
    );
  });

  it('시작 전은 가까우면 날수로, 멀면 날짜로 말한다', () => {
    expect(readStatusLabel({ startsAt: '2026-08-25', endsAt: '2026-08-30' }, TODAY)).toBe(
      '7일 뒤에 열려요',
    );
    // 2주까지는 날수, 그 너머는 날짜 — `D-200` 은 아무 감각도 주지 않는다.
    expect(readStatusLabel({ startsAt: '2026-09-01', endsAt: '2026-09-06' }, TODAY)).toBe(
      '14일 뒤에 열려요',
    );
    expect(readStatusLabel({ startsAt: '2026-09-02', endsAt: '2026-09-06' }, TODAY)).toBe(
      '9월 2일부터',
    );
    // 해가 바뀌어도 「월 일부터」 로 말한다.
    expect(readStatusLabel({ startsAt: '2027-05-18', endsAt: '2027-05-22' }, TODAY)).toBe(
      '5월 18일부터',
    );
  });
});

describe('todayInKst — 기기 시간대가 아니라 KST 달력을 읽는다', () => {
  it('UTC 자정 직후는 KST 로 이미 그날 아침이다', () => {
    expect(todayInKst(new Date('2026-08-18T00:30:00Z'))).toBe('2026-08-18');
  });

  it('UTC 15:00 을 넘기면 KST 로는 다음 날이다', () => {
    /* 이것이 `Date` 객체로 비교하면 하루가 밀리는 자리다 —
       한국 저녁 자정 직후(UTC 15:00)에 열어도 판정이 어제로 남으면 안 된다. */
    expect(todayInKst(new Date('2026-08-18T14:59:00Z'))).toBe('2026-08-18');
    expect(todayInKst(new Date('2026-08-18T15:00:00Z'))).toBe('2026-08-19');
  });

  it('월·해 경계를 넘긴다', () => {
    expect(todayInKst(new Date('2026-12-31T15:00:00Z'))).toBe('2027-01-01');
  });
});

describe('daysBetween', () => {
  it('같은 날은 0이고 뒤로 가면 음수다', () => {
    expect(daysBetween(TODAY, TODAY)).toBe(0);
    expect(daysBetween(TODAY, '2026-08-19')).toBe(1);
    expect(daysBetween(TODAY, '2026-08-17')).toBe(-1);
  });

  it('윤년 2월을 건너도 맞는다', () => {
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });
});

/* ------------------------------------------------------------------ *
 * 기간 문구 — 시계를 보지 않으므로 서버가 굳혀도 되는 값
 * ------------------------------------------------------------------ */

describe('readPeriodLabel', () => {
  it('같은 해 안의 기간은 연도를 한 번만 적는다', () => {
    expect(readPeriodLabel('2026-09-01', '2026-09-06')).toBe('2026년 9월 1일 – 9월 6일');
  });

  it('해를 넘기면 양쪽에 연도를 적는다', () => {
    expect(readPeriodLabel('2026-06-23', '2027-05-16')).toBe(
      '2026년 6월 23일 – 2027년 5월 16일',
    );
  });

  it('달 경계에 정확히 맞는 기간은 **달로 말한다** (§6-1 월 단위 공지)', () => {
    /* 공식이 `2026. 7. ~ 9.` 로만 공지한 행사가 있다. 원장은 말일을 채워 두었으므로
       「9월 30일까지」라고 쓰면 없는 정확성을 우리가 지어내는 셈이 된다. */
    expect(readPeriodLabel('2026-07-01', '2026-09-30')).toBe('2026년 7월 – 9월');
    expect(readPeriodLabel('2026-09-01', '2026-09-30')).toBe('2026년 9월 한 달');
    expect(readPeriodLabel('2026-11-01', '2027-01-31')).toBe('2026년 11월 – 2027년 1월');
  });

  it('말일이 아니면 달로 접지 않는다 — 덜 말하는 쪽으로만 틀린다', () => {
    expect(readPeriodLabel('2026-05-01', '2026-10-27')).toBe('2026년 5월 1일 – 10월 27일');
    expect(readPeriodLabel('2026-07-03', '2026-12-31')).toBe('2026년 7월 3일 – 12월 31일');
  });

  it('윤년 2월 말일을 안다', () => {
    expect(readPeriodLabel('2028-02-01', '2028-02-29')).toBe('2028년 2월 한 달');
    expect(readPeriodLabel('2026-02-01', '2026-02-28')).toBe('2026년 2월 한 달');
  });

  it('하루짜리는 한 날짜로 적는다', () => {
    expect(readPeriodLabel('2026-09-06', '2026-09-06')).toBe('2026년 9월 6일');
  });

  it('날짜가 없으면 문구도 없다', () => {
    expect(readPeriodLabel(undefined, undefined)).toBeUndefined();
    expect(readPeriodLabel('2026-09-01', undefined)).toBeUndefined();
  });
});

describe('readPublishedLabel', () => {
  it('발행일이 있을 때만 적는다', () => {
    expect(readPublishedLabel('2026-02-20')).toBe('2026. 2. 20.');
    expect(readPublishedLabel(undefined)).toBeUndefined();
  });
});
