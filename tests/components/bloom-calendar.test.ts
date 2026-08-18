import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  BLOOM_MONTHS,
  bloomMonthLabel,
  currentMonthInKst,
  isYearRound,
} from '@/components/flowers/bloom-calendar';
import { buildBloomCalendar } from '@/components/flowers/calendar-data';
import { birthFlowersInMonth } from '@/lib/data/birth-flowers';
import { loadCatalog } from '@/lib/data/catalog';
import { photoFor } from '@/lib/photos';
import type { Catalog } from '@/lib/data/types';

/**
 * 계절 달력(`/calendar`) — 회귀 가드 (2026-08-18).
 *
 * 이 화면이 지켜야 하는 것은 넷이다.
 *   ① **「지금 달」이 빌드에 굳지 않는다.** 판정 함수는 `now` 를 인자로 받고, 서버 쪽
 *      조립에는 시계가 없다(「읽을거리」 만료 판정과 같은 원리 — §1.5q).
 *   ② **달력이 원장을 그대로 말한다.** 한 꽃은 `bloom_months` 에 적힌 달에만 서고,
 *      그 밖의 달에는 서지 않는다. 달을 못 적어 둔 꽃은 어느 칸에도 없다.
 *   ③ **가볍다.** 탄생화 366행을 싣지 않고(달마다 숫자 하나뿐), 칩을 달마다 되풀이하지
 *      않는다(꽃 한 벌 + 슬러그 목록).
 *   ④ **지어내지 않는다.** 컷이 없는 꽃은 `thumbSrc` 키 자체가 없다.
 */

const ROOT = path.resolve(__dirname, '../..');

function source(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8').replaceAll('\r\n', '\n');
}

/**
 * 주석을 걷어낸 본문.
 *
 * ⚠ 이걸 안 하면 검사가 거꾸로 선다. 이 저장소의 주석은 "여기서 `new Date()` 를 부르지
 *   마라" 처럼 **하지 말아야 할 것을 이름으로 적어 두는** 성격이라, 원문을 그대로 훑으면
 *   그 경고문에 걸려 빨간불이 켜지고 정작 남겨야 할 주석을 지우게 된다
 *   (`no-dead-links.test.ts`·`type-floor.test.ts` 가 같은 이유로 같은 처리를 한다).
 */
function code(rel: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, ' ');
  return source(rel)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(?<!:)\/\/[^\n]*/g, blank);
}

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog();
  return cached;
}

describe('「지금 달」은 브라우저가 KST 로 정한다', () => {
  it('KST 자정 직후는 그날의 달이다 — UTC 로 재면 하루가 밀린다', () => {
    // 2026-09-01 00:30 KST = 2026-08-31 15:30 UTC. 로컬/UTC 로 읽으면 8월이 나온다.
    expect(currentMonthInKst(new Date('2026-08-31T15:30:00Z'))).toBe(9);
  });

  it('KST 자정 직전은 아직 지난 달이다', () => {
    // 2026-08-31 23:30 KST = 2026-08-31 14:30 UTC.
    expect(currentMonthInKst(new Date('2026-08-31T14:30:00Z'))).toBe(8);
  });

  it('해를 넘는 경계도 맞는다', () => {
    // 2027-01-01 00:00 KST = 2026-12-31 15:00 UTC.
    expect(currentMonthInKst(new Date('2026-12-31T15:00:00Z'))).toBe(1);
    expect(currentMonthInKst(new Date('2026-12-31T14:59:00Z'))).toBe(12);
  });

  it('열두 달 전부를 돌려준다', () => {
    const months = new Set(
      Array.from({ length: 12 }, (_, index) =>
        currentMonthInKst(new Date(Date.UTC(2026, index, 15, 3, 0, 0))),
      ),
    );
    expect([...months].sort((a, b) => a - b)).toEqual([...BLOOM_MONTHS]);
  });

  /**
   * 서버 조립에 시계가 없어야 한다. `new Date()` 가 한 줄이라도 들어가면 그 판정이
   * 정적 HTML 에 굳는다 — 8월에 뽑은 데모가 12월에도 8월을 펼쳐 놓는다.
   */
  it('서버 조립에도, 순수 모듈에도 시계를 부르는 곳이 없다', () => {
    for (const rel of [
      'src/components/flowers/calendar-data.ts',
      'src/components/flowers/bloom-calendar.ts',
      'src/app/calendar/page.tsx',
    ]) {
      expect(code(rel), rel).not.toContain('new Date()');
    }
  });

  it('화면은 `useSyncExternalStore` 로 시계를 읽는다 — useState+useEffect 로 되돌리지 마라', () => {
    const view = source('src/components/flowers/BloomCalendar.tsx');
    expect(view).toContain('useSyncExternalStore');
    // 서버 스냅숏이 null 이어야 첫 렌더가 서버 HTML 과 글자 하나까지 같다.
    expect(view).toContain('noMonthOnServer');
  });
});

describe('달력이 원장을 그대로 말한다', () => {
  it('칸이 열둘이고 라벨이 `n월` 이다', async () => {
    const { months } = buildBloomCalendar(await catalog());

    expect(months).toHaveLength(12);
    expect(months.map((month) => month.month)).toEqual([...BLOOM_MONTHS]);
    for (const month of months) {
      expect(month.monthLabel).toBe(bloomMonthLabel(month.month));
    }
  });

  it('한 꽃은 `bloom_months` 에 적힌 달에만 선다 — 그 밖의 달에는 없다', async () => {
    const data = buildBloomCalendar(await catalog());
    const rows = await catalog();

    for (const flower of rows.flowers) {
      for (const month of data.months) {
        const stands = month.slugs.includes(flower.id);
        expect(stands, `${flower.id} / ${month.monthLabel}`).toBe(
          flower.bloomMonths.includes(month.month),
        );
      }
    }
  });

  it('개화 달을 못 적어 둔 꽃은 어느 칸에도 없다 — 아무 달에나 세우지 않는다', async () => {
    const rows = await catalog();
    const data = buildBloomCalendar(rows);
    const listed = new Set(data.flowers.map((chip) => chip.slug));

    for (const flower of rows.flowers) {
      expect(listed.has(flower.id), flower.id).toBe(flower.bloomMonths.length > 0);
    }
  });

  it('사철 꽃은 열두 칸에 다 선다 — 문턱은 상세의 계절 한 줄과 같다', async () => {
    const rows = await catalog();
    const data = buildBloomCalendar(rows);
    const yearRound = rows.flowers.filter((flower) => isYearRound(flower.bloomMonths));

    expect(yearRound.length).toBeGreaterThan(0);
    expect(data.yearRoundCount).toBe(yearRound.length);

    for (const flower of yearRound) {
      for (const month of data.months) {
        expect(month.slugs, `${flower.id} / ${month.monthLabel}`).toContain(flower.id);
      }
    }
  });

  it('칸 안 순서는 카탈로그 순서다 — 다시 와도 같은 자리에 같은 꽃이 있다', async () => {
    const rows = await catalog();
    const data = buildBloomCalendar(rows);
    const rank = new Map(rows.flowers.map((flower, index) => [flower.id, index]));

    for (const month of data.months) {
      const ranks = month.slugs.map((slug) => rank.get(slug) ?? -1);
      expect([...ranks].sort((a, b) => a - b), month.monthLabel).toEqual(ranks);
    }
  });

  it('탄생화 날 수는 표에서 직접 센 값이다', async () => {
    const rows = await catalog();
    const data = buildBloomCalendar(rows);

    for (const month of data.months) {
      expect(month.birthDayCount, month.monthLabel).toBe(
        birthFlowersInMonth(rows.birthFlowers, month.month).length,
      );
      // 28~31 사이가 아니면 표가 무너진 것이다(윤년 366일이 전제다).
      expect(month.birthDayCount, month.monthLabel).toBeGreaterThanOrEqual(28);
      expect(month.birthDayCount, month.monthLabel).toBeLessThanOrEqual(31);
    }
  });
});

describe('가볍다 — 사전 366행을 싣지 않고 칩을 되풀이하지 않는다', () => {
  it('달 칸이 드는 것은 슬러그와 숫자뿐이다', async () => {
    const data = buildBloomCalendar(await catalog());

    for (const month of data.months) {
      expect(Object.keys(month).sort()).toEqual(['birthDayCount', 'month', 'monthLabel', 'slugs']);
      for (const slug of month.slugs) expect(typeof slug).toBe('string');
    }
  });

  it('꽃 한 벌은 한 번만 실린다 — 슬러그가 중복되지 않는다', async () => {
    const data = buildBloomCalendar(await catalog());
    const slugs = data.flowers.map((chip) => chip.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(data.flowers.length).toBe(data.bloomingCount);
  });

  it('탄생화 꽃말·이름이 페이로드에 섞이지 않는다', async () => {
    const rows = await catalog();
    const serialized = JSON.stringify(buildBloomCalendar(rows));

    // 사전에만 있는 이름(도감에 없는 꽃) 하나라도 새면 366행이 흘러든 것이다.
    const dictOnly = rows.birthFlowers.find((row) => row.flowerId === undefined);
    expect(dictOnly).toBeDefined();
    expect(serialized).not.toContain(dictOnly!.meaningKo);
  });

  /**
   * 페이로드 상한. 지금은 20KB 안쪽이다(꽃 59벌 + 슬러그 280개 + 크레딧).
   * 칩을 달마다 되풀이하는 모양으로 되돌리면 곧장 배 이상으로 뛰어 여기서 걸린다.
   */
  it('직렬화가 40KB 를 넘지 않는다', async () => {
    const bytes = Buffer.byteLength(JSON.stringify(buildBloomCalendar(await catalog())), 'utf8');
    expect(bytes).toBeLessThan(40_000);
  });
});

describe('지어내지 않는다', () => {
  it('컷이 없는 꽃은 `thumbSrc` 키 자체가 없다', async () => {
    const data = buildBloomCalendar(await catalog());
    let missing = 0;

    for (const chip of data.flowers) {
      const has = photoFor(chip.slug) !== undefined;
      expect('thumbSrc' in chip, chip.slug).toBe(has);
      if (!has) missing += 1;
    }

    // 스캔이 헛돌지 않는지 — 컷이 있는 꽃이 실제로 대부분이다.
    expect(data.flowers.length - missing).toBeGreaterThan(0);
  });

  it('크레딧이 중복 없이 한 벌로 접힌다', async () => {
    const { credits } = buildBloomCalendar(await catalog());

    expect(credits.length).toBeGreaterThan(0);
    expect(new Set(credits).size).toBe(credits.length);
  });
});

describe('가는 길과 오는 길', () => {
  it('도감 두 자리에서 달력으로 건너간다 — 내비에는 넣지 않는다', () => {
    expect(source('src/app/flowers/page.tsx')).toContain('href="/calendar"');
    expect(source('src/components/flowers/BirthdayFinder.tsx')).toContain('href="/calendar"');
    // 랜딩 내비는 이 라운드에서 건드리지 않는다(§1.6c 레일이 이미 찼다).
    expect(source('src/components/landing/LandingPage.tsx')).not.toContain('/calendar');
  });

  it('달 칸마다 탄생화 사전으로 가는 다리가 있고, 그 자리가 실재한다', () => {
    expect(source('src/components/flowers/BloomCalendar.tsx')).toContain('/flowers#birth-dict');
    expect(source('src/components/flowers/BirthDictionary.tsx')).toContain('id="birth-dict"');
  });

  it('sitemap 에 한 줄이 실려 있다', () => {
    expect(source('src/app/sitemap.ts')).toContain('/calendar');
  });
});
