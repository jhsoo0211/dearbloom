import { describe, expect, it } from 'vitest';

import * as copy from '@/components/flowers/birth-copy';
import { buildBirthMonth } from '@/components/flowers/birth-dict';
import { buildFlowerIndex } from '@/components/flowers/data';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';

/**
 * 탄생화 **사전 티어**(§1.5m ⑤) — 366일 표가 열람 가능한 화면 값까지 살아 오는지.
 *
 * 조회 규칙 자체는 `tests/data/birth-flowers.test.ts` 가 픽스처로 본다. 여기서 보는 것은
 * 실데이터를 통과시켰을 때 **2단 티어가 실제로 갈리는가**다:
 *   · 도감에 있는 날 → 상세 경로 + 도감 쪽 이름 + 실사 썸네일
 *   · 없는 날        → `link` 키 자체가 없다(사진을 지어내지 않는다)
 * 그리고 성능 규율 하나 — 한 번에 가는 것은 **한 달치**여야 한다(366행 금지).
 *
 * 마지막으로 워딩 대전제(`docs/birth-flowers-research.md` §2·§8). 사전은 화면에 나가는
 * 문장이 가장 많은 자리라, 여기가 뚫리면 서비스 전체가 "전통 탄생화"를 주장하게 된다.
 */

/** 화면 문구가 절대 **주장**하면 안 되는 말(§2 — 계보상 사실이 아니다). */
const FORBIDDEN = ['전통', '공식', '예로부터 정해진', '정해진 탄생화'];

/**
 * 딱 한 문장만 예외다 — 금지어를 **부정하는** 계보 각주(§1.5m ①의 "정직한 선").
 * `…예로부터 정해진 목록은 아니에요` 는 그 말을 주장하는 것이 아니라 부인하는 것이라,
 * 스캔 전에 이 문장을 통째로 덜어 내고 나머지를 훑는다(그리고 이 문장 자체가 글자
 * 그대로 남아 있는지는 아래에서 따로 못 박는다).
 */
const SANCTIONED = copy.BIRTH_SOURCE_NOTE;

function withoutSanctioned(text: string): string {
  return text.split(SANCTIONED).join('');
}

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog();
  return cached;
}

describe('buildBirthMonth — 한 달치 사전', () => {
  it('열두 달이 전부 서고, 합치면 366일이다', async () => {
    const data = await catalog();
    let total = 0;
    for (let month = 1; month <= 12; month += 1) {
      const view = buildBirthMonth(data, month);
      expect(view, `${month}월`).not.toBeNull();
      expect(view?.monthLabel).toBe(`${month}월`);
      total += view?.entries.length ?? 0;
    }
    expect(total).toBe(366);
  });

  it('2월은 29일까지 — 4년에 한 번 태어난 사람이 자기 날짜를 찾는다', async () => {
    const view = buildBirthMonth(await catalog(), 2);

    expect(view?.entries).toHaveLength(29);
    expect(view?.entries.at(-1)).toMatchObject({ day: 29, nameKo: '아르메리아', meaning: '배려' });
  });

  it('일 순으로 세운다 (표가 어떤 순서로 오든)', async () => {
    const view = buildBirthMonth(await catalog(), 7);
    const days = view?.entries.map((entry) => entry.day) ?? [];

    expect(days).toEqual([...days].sort((a, b) => a - b));
    expect(days[0]).toBe(1);
  });

  it('범위 밖은 null — 화면이 폴백 문구를 세운다', async () => {
    const data = await catalog();
    expect(buildBirthMonth(data, 0)).toBeNull();
    expect(buildBirthMonth(data, 13)).toBeNull();
    expect(buildBirthMonth(data, Number.NaN)).toBeNull();
  });

  it('모든 줄이 이름과 꽃말을 갖는다 (빈 줄을 세우지 않는다)', async () => {
    const data = await catalog();
    for (let month = 1; month <= 12; month += 1) {
      for (const entry of buildBirthMonth(data, month)?.entries ?? []) {
        expect(entry.nameKo, `${month}/${entry.day}`).not.toBe('');
        expect(entry.meaning, `${month}/${entry.day}`).not.toBe('');
        expect(entry.dateLabel).toBe(`${month}월 ${entry.day}일`);
      }
    }
  });
});

describe('2단 티어 — 도감으로 건너가는 날과 그러지 못하는 날', () => {
  it('매칭된 날은 상세 경로 · 도감 쪽 이름 · 실사 썸네일을 함께 갖는다', async () => {
    // 1월 2일 = 표 이름 `노랑수선화` → 도감 `수선화`(narcissus). 이름이 갈리는 대표 사례다.
    const jan = buildBirthMonth(await catalog(), 1);
    const entry = jan?.entries.find((row) => row.day === 2);

    expect(entry?.nameKo).toBe('노랑수선화');
    expect(entry?.link?.href).toBe('/flowers/narcissus');
    // 도착지 이름을 함께 싣지 않으면 "다른 꽃으로 보내는 링크"로 읽힌다.
    expect(entry?.link?.nameKo).toBe('수선화');
    expect(entry?.link?.thumbSrc).toMatch(/^https:\/\/images\.(unsplash|pexels)\.com\//);
    // 카드 규격 폭(640) — 이 화면만 쓰는 폭을 새로 만들지 않는다.
    expect(entry?.link?.thumbSrc).toContain('w=640');
  });

  it('도감에 없는 날은 link 키 자체가 없다 — 사진을 지어내지 않는다', async () => {
    // 1월 1일 = 스노드롭. 카탈로그에 없다.
    const entry = buildBirthMonth(await catalog(), 1)?.entries.find((row) => row.day === 1);

    expect(entry?.nameKo).toBe('스노드롭');
    expect(entry).not.toHaveProperty('link');
  });

  it('366일 중 도감으로 이어지는 날은 57일뿐이다 (나머지는 사전 티어)', async () => {
    const data = await catalog();
    let linked = 0;
    let total = 0;
    for (let month = 1; month <= 12; month += 1) {
      const view = buildBirthMonth(data, month);
      linked += view?.linkedCount ?? 0;
      total += view?.entries.length ?? 0;
    }

    expect(total).toBe(366);
    expect(linked).toBe(57);
  });

  it('매칭된 날은 하나도 빠짐없이 썸네일을 갖는다 (반쪽 링크를 만들지 않는다)', async () => {
    const data = await catalog();
    for (let month = 1; month <= 12; month += 1) {
      for (const entry of buildBirthMonth(data, month)?.entries ?? []) {
        if (!entry.link) continue;
        expect(entry.link.thumbSrc, `${month}/${entry.day} ${entry.nameKo}`).toBeTruthy();
      }
    }
  });
});

describe('사전 상세(라이트)가 쓰는 값', () => {
  it('같은 이름이 여러 날에 걸리면 다른 날들을 이어 붙인다 (그날 자신은 뺀다)', async () => {
    // `튤립` 은 1월 2일이 아니라 두 날에 걸린다 — 실데이터에서 이름으로 직접 찾는다.
    const data = await catalog();
    const repeated = data.birthFlowers.filter((row) => row.nameKo === '튤립');
    expect(repeated.length).toBeGreaterThan(1);

    const first = repeated[0];
    const view = buildBirthMonth(data, first.month);
    const entry = view?.entries.find((row) => row.day === first.day);

    expect(entry?.alsoOn).toBeTruthy();
    expect(entry?.alsoOn).not.toContain(`${first.month}월 ${first.day}일`);
    expect(entry?.alsoOn).toContain(`${repeated[1].month}월 ${repeated[1].day}일`);
  });

  it('하루뿐인 이름은 alsoOn 키가 없다 — 빈 줄을 남기지 않는다', async () => {
    const entry = buildBirthMonth(await catalog(), 1)?.entries.find((row) => row.day === 1);

    expect(entry?.nameKo).toBe('스노드롭');
    expect(entry).not.toHaveProperty('alsoOn');
  });

  it('출처 링크 이름이 퓨니코드가 아니라 사람이 읽는 이름이다', async () => {
    const entry = buildBirthMonth(await catalog(), 1)?.entries[0];

    expect(entry?.sourceUrl).toMatch(/^https:\/\//);
    expect(entry?.sourceLabel).not.toContain('xn--');
    expect(entry?.sourceLabel).toBe('한국화훼유통협회 로얄플라워');
  });

  it('꽃말 뒤 서술격 조사를 받침으로 가른다', async () => {
    const jan = buildBirthMonth(await catalog(), 1);
    // 1월 1일 `희망`(받침 있음) / 1월 5일 `인내`(받침 없음)
    expect(jan?.entries.find((row) => row.day === 1)?.meaningCopula).toBe('이에요');
    expect(jan?.entries.find((row) => row.day === 5)?.meaningCopula).toBe('예요');
  });

  it('선택 컬럼은 빈 문자열로 메우지 않는다 (없으면 키가 없다)', async () => {
    const data = await catalog();
    for (let month = 1; month <= 12; month += 1) {
      for (const entry of buildBirthMonth(data, month)?.entries ?? []) {
        if ('nameEn' in entry) expect(entry.nameEn, `${month}/${entry.day}`).not.toBe('');
        if ('scientificName' in entry) expect(entry.scientificName).not.toBe('');
        if ('alsoOn' in entry) expect(entry.alsoOn).not.toBe('');
      }
    }
  });
});

describe('성능 규율 — 한 번에 가는 것은 한 달치다', () => {
  it('한 달 응답에 다른 달의 항목이 섞이지 않는다', async () => {
    const view = buildBirthMonth(await catalog(), 3);

    expect(view?.entries.every((entry) => entry.dateLabel.startsWith('3월'))).toBe(true);
    // `alsoOn` 은 다른 달의 **날짜 문자열**을 담을 수 있지만(그게 그 줄의 뜻이다),
    // 다른 달의 **항목**이 실려 오면 안 된다.
    expect(view?.entries).toHaveLength(31);
  });

  it('한 달 페이로드가 12KB 를 넘지 않는다 (366행 통짜 60KB 의 1/5 이하)', async () => {
    const data = await catalog();
    for (let month = 1; month <= 12; month += 1) {
      const bytes = Buffer.byteLength(JSON.stringify(buildBirthMonth(data, month)), 'utf8');
      expect(bytes, `${month}월 페이로드 ${bytes}B`).toBeLessThan(12_000);
    }
  });

  it('목록 뷰모델에는 여전히 366행이 없다 — 첫 응답은 숫자 두 개만 늘었다', async () => {
    const index = buildFlowerIndex(await catalog());

    expect(index).not.toHaveProperty('birthFlowers');
    expect(JSON.stringify(index)).not.toContain('아르메리아');
    expect(index.birthDayCount).toBe(366);
    expect(index.birthSpeciesCount).toBe(303);
  });
});

describe('워딩 대전제 — 이 표는 전통이 아니다 (§1.5m ①)', () => {
  it('고정 문구 모듈 어디에도 계보 단정이 없다', () => {
    for (const [key, value] of Object.entries(copy)) {
      if (typeof value !== 'string') continue;
      const text = withoutSanctioned(value);
      for (const word of FORBIDDEN) expect(text, `${key}`).not.toContain(word);
    }
  });

  it('사전이 만들어 내는 문자열에도 계보 단정이 없다', async () => {
    const data = await catalog();
    for (let month = 1; month <= 12; month += 1) {
      const text = withoutSanctioned(JSON.stringify(buildBirthMonth(data, month)));
      for (const word of FORBIDDEN) expect(text, `${month}월`).not.toContain(word);
    }
  });

  it('계보 각주 한 줄은 §1.5m ① 의 문장 그대로다', () => {
    expect(copy.BIRTH_SOURCE_NOTE).toBe(
      '널리 통하는 탄생화 표에서 가져왔어요 — 예로부터 정해진 목록은 아니에요.',
    );
  });
});

describe('티어 고지 — 지우면 사전이 도감인 척한다 (§1.5m ⑤)', () => {
  it('두 줄이 모두 서 있다', () => {
    expect(copy.BIRTH_DICT_TIER).toBe(
      '아직 도감에 들이지 못한 꽃이에요 — 이름과 꽃말부터 먼저 건네요.',
    );
    expect(copy.BIRTH_DICT_TIER_SUB).not.toBe('');
  });

  it('둘째 줄이 **무엇을 확인하지 못했는지**를 말한다', () => {
    // 반려동물 안전성은 §1.5h 가 직설을 요구하는 항목이다. 이 단어가 빠지면 사전 항목이
    // "안전한지 확인된 꽃"으로 오해될 수 있다.
    expect(copy.BIRTH_DICT_TIER_SUB).toContain('반려동물');
    expect(copy.BIRTH_DICT_TIER_SUB).toContain('이야기');
    expect(copy.BIRTH_DICT_TIER_SUB).toMatch(/확인하지 못했어요/);
  });

  it('두 티어의 이름이 서로 다른 말이다', () => {
    expect(copy.BIRTH_DICT_CATALOG_TITLE).toBe('정식 도감');
    expect(copy.BIRTH_DICT_TITLE).toBe('탄생화 사전');
    expect(copy.BIRTH_DICT_MARK_CATALOG).not.toBe(copy.BIRTH_DICT_MARK_DICT);
  });
});
