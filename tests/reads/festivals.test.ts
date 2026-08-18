import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { READ_TAGS, READ_TAG_GROUPS } from '@/components/reads/tags';
import {
  FESTIVAL_PROVIDER,
  FESTIVAL_PROVIDER_LABEL,
  FestivalsLoadError,
  clampSummary,
  composeSummary,
  festivalPlaceTag,
  festivalSeasonTags,
  festivalTags,
  festivalTitleKey,
  firstHttpsUrl,
  hideDuplicates,
  isFlowerFestival,
  isNearPeriod,
  isSimilarTitle,
  loadFestivals,
  shortRegion,
  toFestivalCard,
  toYmd,
  type FestivalRecord,
} from '@/lib/data/reads-festivals';

/**
 * API 축제 — 「읽을거리」에 합류하는 기계 목록의 회귀 가드.
 *
 * 이 파일이 지키는 것 셋(브리프의 완료 기준 그대로):
 *   ① **필터 오탐 경계** — 「꽃게 축제」가 꽃 축제로 읽히면 안 된다.
 *   ② **중복 숨김** — 같은 축제가 원장에도 있으면 API 쪽이 빠진다.
 *   ③ **빈 배열 경로** — 파일이 없어도 화면이 조용히 돈다(빌드가 안 깨진다).
 *
 * ⚠ 실호출 테스트는 여기 없다. 이 목록은 키가 없는 상태에서도 전부 통과해야 한다 —
 *   그것이 이 설계의 요점이다(네트워크를 타는 순간 그 요점이 무너진다).
 */

/* ------------------------------------------------------------------ *
 * 1. 꽃 축제인가 — 오탐 경계
 * ------------------------------------------------------------------ */

describe('꽃 어휘 판정 — 부정 어휘를 먼저 지우고 찾는다', () => {
  it('꽃 축제를 통과시킨다', () => {
    expect(isFlowerFestival('제27회 함평모악산 꽃무릇축제')).toBe(true);
    expect(isFlowerFestival('태안 세계튤립꽃축제')).toBe(true);
    expect(isFlowerFestival('진해군항제')).toBe(false); // 이름에 꽃이 없다 — 제목만으로는 못 줍는다
    expect(isFlowerFestival('진해군항제', '벚꽃이 만개하는')).toBe(true); // 소개까지 보면 걸린다
    expect(isFlowerFestival('고창 청보리밭 축제')).toBe(false);
    expect(isFlowerFestival('구례 산수유꽃축제')).toBe(true);
    expect(isFlowerFestival('서울 장미축제')).toBe(true);
    expect(isFlowerFestival('경주 첨성대 핑크뮬리')).toBe(true);
  });

  it('꽃 글자를 달았지만 꽃이 아닌 것을 배제한다 — 오탐의 본체', () => {
    expect(isFlowerFestival('서산 꽃게 축제')).toBe(false);
    expect(isFlowerFestival('부산불꽃축제')).toBe(false);
    expect(isFlowerFestival('태백산 눈꽃축제')).toBe(false);
    expect(isFlowerFestival('대관령 얼음꽃 트레킹')).toBe(false);
    expect(isFlowerFestival('꽃등심 한우 축제')).toBe(false);
  });

  it('부정 어휘와 꽃 어휘가 **함께** 있으면 통과한다 — 지우기가 먼저인 이유', () => {
    /* 「먼저 찾고 나중에 배제」로 짜면 이 제목이 통째로 버려진다. 실제로 불꽃놀이를
       함께 여는 꽃 축제가 있으므로 이 한 줄이 규칙의 순서를 붙잡아 둔다. */
    expect(isFlowerFestival('영광 불꽃과 꽃무릇 축제')).toBe(true);
    expect(isFlowerFestival('눈꽃과 동백이 함께 피는 겨울 축제')).toBe(true);
  });

  it('억새·갈대는 꽃이 아니다 (경계 규칙 — 이삭이지 꽃이 아니다)', () => {
    expect(isFlowerFestival('정선 민둥산 억새축제')).toBe(false);
    expect(isFlowerFestival('창녕 우포늪 억새꽃 축제')).toBe(false);
    expect(isFlowerFestival('순천만 갈대꽃 축제')).toBe(false);
    // 반대편 — 같은 가을 이삭처럼 보여도 꽃을 보러 가는 것은 담는다.
    expect(isFlowerFestival('서천 장항 맥문동 꽃축제')).toBe(true);
  });

  it('공백·대소문자에 흔들리지 않는다', () => {
    expect(isFlowerFestival('S e o u l FLOWER Show')).toBe(true);
    expect(isFlowerFestival('불 꽃 축제')).toBe(false);
  });

  it('빈 입력·undefined 는 꽃 축제가 아니다', () => {
    expect(isFlowerFestival()).toBe(false);
    expect(isFlowerFestival('', undefined)).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * 2. 값 다듬기
 * ------------------------------------------------------------------ */

describe('주소 → 원장 문법의 지역 두 마디', () => {
  it('시도를 줄이고 시군구의 접미사를 뗀다', () => {
    expect(shortRegion('전라남도 함평군 해보면 용천사길 209')).toBe('전남 함평');
    expect(shortRegion('충청남도 태안군 남면 신온리')).toBe('충남 태안');
    expect(shortRegion('서울특별시 강서구 마곡동로 161')).toBe('서울 강서');
    expect(shortRegion('강원특별자치도 평창군 봉평면')).toBe('강원 평창');
    expect(shortRegion('경기도 고양시 일산동구')).toBe('경기 고양');
  });

  it('시군구가 없는 곳은 시도 한 마디로 끝난다', () => {
    expect(shortRegion('세종특별자치시')).toBe('세종');
  });

  it('모르는 주소는 `undefined` 다 — 빈 문자열을 돌려주지 않는다', () => {
    expect(shortRegion(undefined)).toBeUndefined();
    expect(shortRegion('')).toBeUndefined();
    expect(shortRegion('   ')).toBeUndefined();
  });
});

describe('태그 파생 — 세 축을 반드시 채운다', () => {
  it('계절은 걸친 달을 전부 센다', () => {
    expect(festivalSeasonTags('2026-09-16', '2026-09-20')).toEqual(['가을']);
    expect(festivalSeasonTags('2026-07-01', '2026-09-30')).toEqual(['여름', '가을']);
    // 해를 넘겨도 센다(12월 → 겨울, 1월 → 겨울, 3월 → 봄).
    expect(festivalSeasonTags('2026-12-01', '2027-03-05')).toEqual(['봄', '겨울']);
  });

  it('자리는 수도권/지방 둘뿐이다 — 국내 API 라 해외·온라인이 나올 수 없다', () => {
    expect(festivalPlaceTag('서울 강서')).toBe('서울·수도권');
    expect(festivalPlaceTag('경기 고양')).toBe('서울·수도권');
    expect(festivalPlaceTag('인천 강화')).toBe('서울·수도권');
    expect(festivalPlaceTag('전남 함평')).toBe('지방');
    expect(festivalPlaceTag(undefined)).toBe('지방');
  });

  it('파생한 태그는 **전부 칩 어휘 13종 안**이다 — 여기가 어긋나면 카드가 조용히 사라진다', () => {
    /* `ReadsBoard` 의 `passes` 는 고른 태그를 **가진** 카드만 남긴다. 어휘 밖 값이 섞이면
       그 축의 칩을 누르는 순간 API 카드가 통째로 없어지고, 아무도 그 이유를 모른다. */
    const tags = festivalTags({ startsAt: '2026-09-16', endsAt: '2026-09-20', region: '전남 함평' });
    for (const tag of tags) expect(READ_TAGS, tag).toContain(tag);
    for (const group of READ_TAG_GROUPS) {
      expect(
        tags.filter((tag) => (group.tags as readonly string[]).includes(tag)).length,
        group.axis,
      ).toBeGreaterThan(0);
    }
    expect(tags).toEqual(['가을', '축제', '지방']);
  });
});

describe('한 줄 소개 — 우리가 사실로 짓는다', () => {
  it('지역이 있으면 지역으로 열고, 확인하지 않았다는 사실을 함께 말한다', () => {
    const line = composeSummary('전남 함평');
    expect(line).toContain('전남 함평');
    expect(line).toContain('직접 확인한 일정이 아니');
  });

  it('지역을 몰라도 문장이 성립한다', () => {
    expect(composeSummary()).toMatch(/^저희가 직접 확인한/);
  });

  it('길이 상한에서 자른다 (안전핀)', () => {
    expect(clampSummary('가'.repeat(200)).length).toBe(120);
    expect(clampSummary('가'.repeat(200))).toMatch(/…$/);
    expect(clampSummary('짧은 줄')).toBe('짧은 줄');
  });
});

describe('원본 값 읽기', () => {
  it('여덟 자리 날짜만 받는다', () => {
    expect(toYmd('20260901')).toBe('2026-09-01');
    expect(toYmd(20260901)).toBe('2026-09-01');
    expect(toYmd('2026090')).toBeUndefined();
    expect(toYmd('20261301')).toBeUndefined(); // 13월
    expect(toYmd('20260900')).toBeUndefined(); // 0일
    expect(toYmd('')).toBeUndefined();
    expect(toYmd(undefined)).toBeUndefined();
  });

  it('앵커 문자열에서 https 주소 하나를 꺼낸다 — http 는 받지 않는다', () => {
    expect(firstHttpsUrl('<a href="https://example.com/fest" target="_blank">공식</a>')).toBe(
      'https://example.com/fest',
    );
    expect(firstHttpsUrl("<a href='https://example.com/a'>a</a><a href='https://b.kr'>b</a>")).toBe(
      'https://example.com/a',
    );
    expect(firstHttpsUrl('https://example.com/fest')).toBe('https://example.com/fest');
    expect(firstHttpsUrl('<a href="http://example.com">평문</a>')).toBeUndefined();
    expect(firstHttpsUrl('')).toBeUndefined();
    expect(firstHttpsUrl(undefined)).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ *
 * 3. 중복 — 원장이 이긴다
 * ------------------------------------------------------------------ */

describe('제목 열쇠 — 회차와 연도는 해마다 바뀌는 부분이라 지운다', () => {
  it('회차·연도·구두점을 턴다', () => {
    expect(festivalTitleKey('제27회 함평모악산 꽃무릇축제')).toBe('함평모악산꽃무릇축제');
    expect(festivalTitleKey('2026 태안 튤립축제(봄)')).toBe('태안튤립축제');
    expect(festivalTitleKey('제 26 회 영광불갑산상사화축제')).toBe('영광불갑산상사화축제');
  });
});

describe('같은 축제인가 — 제목 근사 × 기간 근사', () => {
  it('회차 표기만 다른 같은 축제를 같은 것으로 읽는다', () => {
    expect(isSimilarTitle('제27회 함평모악산 꽃무릇축제', '함평 꽃무릇축제')).toBe(true);
    expect(isSimilarTitle('2026 태안 튤립축제', '태안 튤립 축제')).toBe(true);
  });

  it('남남인 축제를 붙이지 않는다', () => {
    expect(isSimilarTitle('제27회 함평모악산 꽃무릇축제', '영광불갑산상사화축제')).toBe(false);
    expect(isSimilarTitle('서울 장미축제', '태안 튤립축제')).toBe(false);
  });

  it('기간이 겹치거나 30일 안쪽이면 같은 회차로 본다', () => {
    const a = { startsAt: '2026-09-16', endsAt: '2026-09-20' };
    expect(isNearPeriod(a, { startsAt: '2026-09-18', endsAt: '2026-09-27' })).toBe(true);
    expect(isNearPeriod(a, { startsAt: '2026-10-10', endsAt: '2026-10-14' })).toBe(true); // 24일 뒤
    expect(isNearPeriod(a, { startsAt: '2027-09-16', endsAt: '2027-09-20' })).toBe(false); // 내년 회차
    expect(isNearPeriod(a, { startsAt: undefined, endsAt: undefined })).toBe(false);
  });

  it('원장에 있는 축제를 API 쪽에서 뗀다 — 원장이 이긴다', () => {
    const fetched = [
      { title: '함평 꽃무릇축제', startsAt: '2026-09-17', endsAt: '2026-09-21' },
      { title: '태안 세계튤립꽃축제', startsAt: '2027-04-10', endsAt: '2027-05-10' },
    ];
    const curated = [
      { title: '제27회 함평모악산 꽃무릇축제', startsAt: '2026-09-16', endsAt: '2026-09-20' },
    ];
    expect(hideDuplicates(fetched, curated).map((row) => row.title)).toEqual(['태안 세계튤립꽃축제']);
  });

  it('같은 이름이어도 **다른 회차**면 남긴다 — 내년 축제를 지우지 않는다', () => {
    const fetched = [{ title: '함평 꽃무릇축제', startsAt: '2027-09-16', endsAt: '2027-09-20' }];
    const curated = [
      { title: '제27회 함평모악산 꽃무릇축제', startsAt: '2026-09-16', endsAt: '2026-09-20' },
    ];
    expect(hideDuplicates(fetched, curated)).toHaveLength(1);
  });

  it('원장이 비어 있으면 아무것도 떼지 않는다', () => {
    const fetched = [{ title: '함평 꽃무릇축제', startsAt: '2026-09-17', endsAt: '2026-09-21' }];
    expect(hideDuplicates(fetched, [])).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------ *
 * 4. 카드
 * ------------------------------------------------------------------ */

const SAMPLE: FestivalRecord = {
  id: 'festival-3302552',
  title: '함평 꽃무릇축제',
  startsAt: '2026-09-16',
  endsAt: '2026-09-20',
  region: '전남 함평',
  url: 'https://example.com/festival',
  summary: '전남 함평 일대에서 열려요.',
};

describe('카드로 옮기기', () => {
  it('출처 라벨이 붙는다 — 공공누리 제1유형의 출처표시 의무를 지는 칸이다', () => {
    const card = toFestivalCard(SAMPLE, '지금 가 볼 곳');
    expect(card.provider).toBe(FESTIVAL_PROVIDER_LABEL);
    expect(card.provider).toContain(FESTIVAL_PROVIDER);
    expect(card.sourceTitle).toBe(FESTIVAL_PROVIDER);
  });

  it('만료 판정에 필요한 날짜 두 칸이 원본 문자열 그대로 실린다', () => {
    const card = toFestivalCard(SAMPLE, '지금 가 볼 곳');
    expect(card.kind).toBe('event');
    expect(card.startsAt).toBe('2026-09-16');
    expect(card.endsAt).toBe('2026-09-20');
  });

  it('기간 문구가 붙는다 — 원장 카드와 **같은 함수**를 지난다', () => {
    /* 이 검사가 없어서 실제로 빠뜨렸던 자리다(2026-08-18 스크린샷에서 발견). 행사 카드의
       첫 줄이 통째로 비는데도 화면은 멀쩡해 보인다 — 그래서 여기서 못 박는다. */
    expect(toFestivalCard(SAMPLE, '지금 가 볼 곳').periodLabel).toBe('2026년 9월 16일 – 9월 20일');
    // 달 경계에 딱 맞으면 원장과 똑같이 **달로 말한다**(없는 정확성을 지어내지 않는다).
    expect(
      toFestivalCard({ ...SAMPLE, startsAt: '2026-07-01', endsAt: '2026-09-30' }, '지금 가 볼 곳')
        .periodLabel,
    ).toBe('2026년 7월 – 9월');
  });

  it('상태 배지는 서버가 굳히지 않는다 — 브라우저의 오늘로만 씌어진다(§7-2)', () => {
    const card = toFestivalCard(SAMPLE, '지금 가 볼 곳');
    expect(Object.keys(card)).not.toContain('statusLabel');
  });

  it('도감으로 건너가는 다리는 비어 있다 — 사람이 손으로 잇는 값이다', () => {
    expect(toFestivalCard(SAMPLE, '지금 가 볼 곳').flowers).toEqual([]);
  });

  it('지역을 모르면 키 자체를 만들지 않는다', () => {
    const { region: _region, ...withoutRegion } = SAMPLE;
    void _region;
    const card = toFestivalCard(withoutRegion, '지금 가 볼 곳');
    expect('region' in card).toBe(false);
    expect(card.tags).toContain('지방');
  });
});

/* ------------------------------------------------------------------ *
 * 5. 파일 읽기 — 빈 배열 경로가 이 설계의 요점이다
 * ------------------------------------------------------------------ */

describe('생성 파일 읽기', () => {
  const originalDir = process.env.DEARBLOOM_CONTENT_DIR;
  const temporary: string[] = [];

  afterEach(async () => {
    if (originalDir === undefined) delete process.env.DEARBLOOM_CONTENT_DIR;
    else process.env.DEARBLOOM_CONTENT_DIR = originalDir;
    for (const dir of temporary.splice(0)) await rm(dir, { recursive: true, force: true });
  });

  /** 빈 content 디렉터리를 하나 만들고 로더가 그쪽을 보게 한다. */
  async function useTempContent(): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), 'dearbloom-festivals-'));
    temporary.push(dir);
    process.env.DEARBLOOM_CONTENT_DIR = dir;
    return dir;
  }

  async function writeGenerated(dir: string, text: string) {
    await mkdir(path.join(dir, 'generated'), { recursive: true });
    await writeFile(path.join(dir, 'generated', 'festivals.json'), text, 'utf8');
  }

  it('파일이 아예 없으면 빈 배열이다 — 화면이 조용히 돌고 빌드가 안 깨진다', async () => {
    await useTempContent();
    await expect(loadFestivals()).resolves.toEqual([]);
  });

  it('목록이 빈 파일도 빈 배열이다 (없는 것과 같은 모양)', async () => {
    const dir = await useTempContent();
    await writeGenerated(
      dir,
      JSON.stringify({
        fetchedAt: '2026-08-18T00:00:00.000Z',
        source: { provider: '한국관광공사', service: 's', license: 'l' },
        window: { from: '2026-08-18', to: '2027-02-18' },
        festivals: [],
      }),
    );
    await expect(loadFestivals()).resolves.toEqual([]);
  });

  it('멀쩡한 파일을 읽는다', async () => {
    const dir = await useTempContent();
    await writeGenerated(
      dir,
      JSON.stringify({
        fetchedAt: '2026-08-18T00:00:00.000Z',
        source: { provider: '한국관광공사', service: 's', license: 'l' },
        window: { from: '2026-08-18', to: '2027-02-18' },
        festivals: [SAMPLE],
      }),
    );
    await expect(loadFestivals()).resolves.toEqual([SAMPLE]);
  });

  it('깨진 파일은 **던진다** — 없는 것과 다르게 다룬다', async () => {
    const dir = await useTempContent();
    await writeGenerated(dir, '{ 이건 JSON 이 아니다');
    await expect(loadFestivals()).rejects.toBeInstanceOf(FestivalsLoadError);
  });

  it('http 출처나 날짜 결손을 막는다 — 화면이 못 쓰는 행을 통과시키지 않는다', async () => {
    const dir = await useTempContent();
    await writeGenerated(
      dir,
      JSON.stringify({
        fetchedAt: '2026-08-18T00:00:00.000Z',
        source: { provider: '한국관광공사', service: 's', license: 'l' },
        window: { from: '2026-08-18', to: '2027-02-18' },
        festivals: [{ ...SAMPLE, url: 'http://example.com' }],
      }),
    );
    await expect(loadFestivals()).rejects.toBeInstanceOf(FestivalsLoadError);

    await writeGenerated(
      dir,
      JSON.stringify({
        fetchedAt: '2026-08-18T00:00:00.000Z',
        source: { provider: '한국관광공사', service: 's', license: 'l' },
        window: { from: '2026-08-18', to: '2027-02-18' },
        festivals: [{ ...SAMPLE, endsAt: '' }],
      }),
    );
    await expect(loadFestivals()).rejects.toBeInstanceOf(FestivalsLoadError);
  });
});

/* ------------------------------------------------------------------ *
 * 6. 저장소에 실제로 놓여 있는 파일
 * ------------------------------------------------------------------ */

describe('content/generated/festivals.json 실물', () => {
  it('읽히고, 읽힌 행은 전부 화면이 쓸 수 있는 모양이다', async () => {
    /* 키가 등록되지 않은 지금은 빈 배열이 정상이다 — 그래서 개수를 못 박지 않는다.
       못 박는 것은 **실린 행의 모양**이다: 하나라도 실렸다면 그 행으로 카드가 서야 한다. */
    const records = await loadFestivals();
    for (const record of records) {
      expect(record.id.startsWith('festival-'), record.id).toBe(true);
      expect(record.url.startsWith('https://'), record.id).toBe(true);
      expect(record.endsAt >= record.startsAt, record.id).toBe(true);
      const card = toFestivalCard(record, '지금 가 볼 곳');
      for (const tag of card.tags) expect(READ_TAGS, `${record.id} / ${tag}`).toContain(tag);
    }
  });
});
