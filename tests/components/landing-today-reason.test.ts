import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildLandingData,
  composeTodayAside,
  composeTodayReason,
  pickReasonHook,
} from '@/components/landing/landing-build';
import { BIRTH_FINDER_HREF, CATEGORY_THEMES } from '@/components/landing/landing-data';
import { STORY_CATEGORIES } from '@/components/stories/categories';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';
import type { TodayBasis } from '@/lib/engine/today';

/**
 * 랜딩 리드 (§1.5n) — **사람이 쓴 것처럼 읽히는가**를 코드가 지킬 수 있는 만큼만.
 *
 * 사용자 요청(2026-08-16 ①): "오늘의 꽃 추천 멘트를 우리가 모은 이야기 기반으로 감성적으로.
 * 로컬에서도 작동." 뒷문장이 이 파일이 존재하는 이유다 — **모델을 부르지 않는다.** 그래서
 * 여기서 지켜야 하는 것은 문장의 아름다움이 아니라 **결정성**이다: 같은 날에는 몇 번을
 * 지어도 같은 문장이 나와야 하고, 서버·테스트·로컬이 모두 같은 값을 봐야 한다.
 *
 * 사용자 피드백(2026-08-16 ②): "워딩이 너무 작위적. 진심을 담아 사람이 하는 것처럼."
 * 진단은 문장 하나하나가 아니라 **틀이 한 벌뿐이라는 것**이었다 — 값만 갈아 끼우는 서식이
 * 며칠만 보면 눈에 익는다. 그래서 틀 자체가 날짜로 회전하고, 이 파일은 그 회전이
 * ① 정말 돌아가는지 ② 돌면서도 같은 날에는 흔들리지 않는지 둘 다 본다.
 *
 * 함께 보는 것 셋:
 *   · 재료 3단(이야기 훅 → 꽃말 → 없음) × basis 3분기 = 9칸이 전부 채워지는가
 *   · 그 문장에 **사무 어휘가 섞이지 않는가**(§1.5d 이야기 톤). 이 선은 코드 주석이 아니라
 *     여기서 지킨다 — `tests/components/birth-flowers-ui.test.ts` 의 금지어 목록과 같은 장치다.
 *   · 리드가 놓아 준 것들이 되돌아오지 않는가(날짜 두 번 부르기 · 캐러셀 조작 안내)
 */

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog();
  return cached;
}

const BASES: TodayBasis[] = ['in_season', 'adjacent', 'all'];

/** 나흘 연속 — 회전을 보는 창. 이 넷은 `opening` 네 벌을 한 번씩 다 쓴다. */
const FOUR_DAYS = ['2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19'];

/** 기본 재료 한 벌. 테스트마다 필요한 것만 덮어쓴다. */
function reason(input: {
  basis?: TodayBasis;
  flowerName?: string;
  todayISO?: string;
  hook?: string;
  meaning?: string;
}): string {
  return composeTodayReason({
    basis: input.basis ?? 'all',
    flowerName: input.flowerName ?? '국화',
    todayISO: input.todayISO ?? '2026-08-16',
    ...(input.hook === undefined ? {} : { hook: input.hook }),
    ...(input.meaning === undefined ? {} : { meaning: input.meaning }),
  });
}

/**
 * 이 문장이 절대 쓰면 안 되는 말 (§1.5d).
 *
 * "왜 이 꽃인가"는 엔진의 선정 근거를 옮긴 자리라, 방심하면 근거를 근거의 말로 적게 된다
 * ("제철 조건에 해당하는 꽃을 자동 선정했어요"). 그 순간 이야기·설화 톤이 안내문으로 굳는다.
 */
const OFFICE_WORDS = [
  '선정',
  '기준',
  '조건',
  '해당',
  '알고리즘',
  '시스템',
  '데이터',
  '자동',
  '무작위',
  '추출',
  '적용',
  '설정',
  '분석',
  '엔진',
  '로직',
  '제공',
  '항목',
];

/**
 * 인용 부호 안쪽을 들어낸 나머지 — **우리가 쓴 말만** 남는다.
 *
 * 금지어 검사를 문장 전체에 걸 수 없다: 훅은 편집자가 쓴 헤드라인 원문이고 438편 중 2편에
 * `기준` 이 들어 있다(`나라꽃을 고르는 기준이…`). 그건 이야기의 말이지 우리 말이 아니다.
 */
function frameOf(sentence: string): string {
  return sentence.replace(/“[^”]*”/g, '').replace(/‘[^’]*’/g, '');
}

describe('§1.5n — 재료 3단 × basis 3분기', () => {
  it('이야기 훅이 있으면 훅을 인용하고 우리 말로 받는다', () => {
    const lede = reason({
      basis: 'in_season',
      hook: '천 년째 답장을 못 받고 있는 새가 있습니다',
      meaning: '열정적인 사랑과 깊은 애정',
    });

    expect(lede).toBe(
      '오늘은 국화를 꺼냈어요. 마침 지금이 한창이라 오래 고민하지 않았어요. ' +
        '“천 년째 답장을 못 받고 있는 새가 있습니다” — 읽다가 한참을 멈췄던 문장이에요.',
    );
    // 훅이 있으면 꽃말은 부르지 않는다(한 문장에 재료 둘을 겹치지 않는다).
    expect(lede).not.toContain('열정적인 사랑');
  });

  it('훅이 없으면 꽃말을 재료로 물러선다', () => {
    expect(reason({ basis: 'in_season', meaning: '맑은 마음' })).toBe(
      '오늘은 국화를 꺼냈어요. 마침 지금이 한창이라 오래 고민하지 않았어요. ' +
        '‘맑은 마음’이라는 말을 오래 들어 온 꽃이에요.',
    );
  });

  it('훅도 꽃말도 없으면 꽃 이름만으로 한 문단을 세운다 (빈손 금지)', () => {
    for (const basis of BASES) {
      const bare = reason({ basis });
      expect(bare.length, basis).toBeGreaterThan(30);
      expect(bare.endsWith('.'), basis).toBe(true);
      expect(bare, basis).not.toContain('“');
      expect(bare, basis).not.toContain('‘');
      // 재료가 없어도 주인공 이름은 반드시 부른다.
      expect(bare, basis).toContain('국화');
    }
  });

  it('9칸이 모두 서로 다른 문단이다 (basis 가 문장에 실제로 반영된다)', () => {
    const cells = BASES.flatMap((basis) => [
      reason({ basis, hook: '천 년째 답장을 못 받고 있는 새가 있습니다' }),
      reason({ basis, meaning: '맑은 마음' }),
      reason({ basis }),
    ]);

    expect(new Set(cells).size).toBe(9);
  });
});

/**
 * §1.5n 개정 (2026-08-16 ② 사용자 피드백: "워딩이 너무 작위적") ────────────────────
 *
 * 회전이 **실제로 도는가**를 보는 자리. 값만 갈리고 뼈대가 그대로면 이 describe 가 전부
 * 무너진다 — 그게 정확히 피드백이 가리킨 상태였다.
 */
describe('§1.5n — 문장 틀이 날마다 회전한다', () => {
  it('나흘 연속이면 리드 첫 문장이 나흘 다 다르다', () => {
    const openings = FOUR_DAYS.map(
      (todayISO) => reason({ basis: 'in_season', todayISO, hook: '새가 있습니다' }).split('“')[0],
    );

    expect(new Set(openings).size).toBe(4);
  });

  it('인용을 받는 맺음말도 함께 회전한다', () => {
    const closings = FOUR_DAYS.map(
      (todayISO) => reason({ basis: 'all', todayISO, hook: '새가 있습니다' }).split('” — ')[1],
    );

    expect(new Set(closings).size).toBe(4);
  });

  it('훅 없는 폴백(꽃말·빈손)도 한 벌로 굳지 않는다', () => {
    const days = ['2026-08-16', '2026-08-17', '2026-08-19', '2026-03-14'];

    const meanings = days.map((todayISO) => reason({ todayISO, meaning: '맑은 마음' }));
    const bares = days.map((todayISO) => reason({ todayISO }));

    expect(new Set(meanings).size).toBeGreaterThan(2);
    expect(new Set(bares).size).toBeGreaterThan(2);
  });

  it('빛깔 한 줄도 회전하고, 캐러셀 조작 안내는 되돌아오지 않는다', () => {
    const asides = new Set(
      Array.from({ length: 40 }, (_, day) => {
        const iso = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
        return composeTodayAside(iso);
      }),
    );

    expect(asides.size).toBe(2);
    for (const line of asides) {
      // "카드를 옆으로 넘기면…" — 캐러셀이 화살표·점·건너뛰기로 이미 말하는 것을
      // 문장으로 한 번 더 적지 않는다(어포던스 두 벌 관리 금지).
      expect(line).not.toContain('넘기');
      expect(line).not.toContain('카드');
      expect(line.endsWith('.'), line).toBe(true);
    }
  });

  it('탄생화 각주도 세 벌이 다 쓰인다', async () => {
    const data = await catalog();
    const leads = new Set<string>();

    for (let day = 0; day < 60; day += 1) {
      const iso = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
      leads.add(buildLandingData(data, iso).birthFlower?.lead.replace(/\d+월 \d+일/, '') ?? '');
    }

    expect(leads.size).toBe(3);
  });
});

describe('§1.5n — 조사는 데이터에서 맞춘다', () => {
  it('꽃 이름 뒤 목적격을 받침으로 가른다', () => {
    // 2026-08-16 은 `오늘은 {꽃}을/를 꺼냈어요` 틀이다.
    expect(reason({ flowerName: '흰 튤립' })).toContain('흰 튤립을 꺼냈어요');
    expect(reason({ flowerName: '국화' })).toContain('국화를 꺼냈어요');
  });

  it('꽃 이름 뒤 서술격도 받침으로 가른다', () => {
    // 2026-08-18 은 `오늘의 꽃은 {꽃}이에요/예요` 틀이다.
    const day = '2026-08-18';
    expect(reason({ todayISO: day, flowerName: '흰 튤립' })).toContain('오늘의 꽃은 흰 튤립이에요');
    expect(reason({ todayISO: day, flowerName: '국화' })).toContain('오늘의 꽃은 국화예요');
  });

  it('꽃말 뒤 조사를 받침으로 가른다', () => {
    // 받침 있음(`마음`) → 이라는
    expect(reason({ meaning: '맑은 마음' })).toContain('‘맑은 마음’이라는 말을');
    // 받침 없음(`인내`) → 라는
    expect(reason({ meaning: '인내' })).toContain('‘인내’라는 말을');
  });

  it('빈 문자열·공백만 있는 재료는 없는 것으로 본다', () => {
    const bare = reason({});

    expect(reason({ hook: '   ', meaning: '' })).toBe(bare);
    expect(reason({ hook: '.' })).toBe(bare);
  });
});

describe('§1.5n — 훅 인용은 원문 그대로', () => {
  it('문장을 다시 쓰지 않는다 (합니다체 헤드라인이 그대로 남는다)', () => {
    const hook = '30년을 싸운 사람들은 자기들이 \'장미전쟁\' 중인 줄 몰랐습니다';

    expect(reason({ hook })).toContain(`“${hook}”`);
  });

  it('겹따옴표가 든 훅도 바깥 인용과 겹치지 않는다', () => {
    // 훅 원문에는 `"` 와 `'` 가 섞여 있다(438편 중 26편) — 바깥은 타이포그래픽 따옴표라야 한다.
    const hook = '신들의 세계에서 장미는 "입 다물어"라는 뜻이었습니다';
    const lede = reason({ hook });

    expect(lede).toContain(`“${hook}”`);
    expect(lede.match(/“/g)).toHaveLength(1);
    expect(lede.match(/”/g)).toHaveLength(1);
  });

  it('문장 끝 마침표 하나만 떼어 438편을 같은 모양으로 세운다', () => {
    const withDot = reason({
      basis: 'in_season',
      hook: '인류가 살아 있는 생명에 처음으로 특허번호를 매긴 날, 그 1번은 장미였습니다.',
    });

    expect(withDot).toContain('그 1번은 장미였습니다” —');
    expect(withDot).not.toContain('장미였습니다.”');
  });

  it('물음표·느낌표는 떼지 않는다 (조판이 아니라 화자의 어조다)', () => {
    expect(reason({ hook: '향수 한 방울에 장미 몇 송이가 들어갈까요?' })).toContain('들어갈까요?”');
  });
});

describe('§1.5d — 사무 어휘 0', () => {
  it('우리가 쓴 말에 안내문 어휘가 섞이지 않는다', () => {
    const frames = BASES.flatMap((basis) =>
      FOUR_DAYS.flatMap((todayISO) => [
        frameOf(
          reason({ basis, todayISO, hook: '나라꽃을 고르는 기준이 다들 아는 꽃이라서였습니다.' }),
        ),
        frameOf(reason({ basis, todayISO, meaning: '조건 없는 사랑' })),
        frameOf(reason({ basis, todayISO })),
        composeTodayAside(todayISO),
      ]),
    );

    for (const frame of frames) {
      for (const word of OFFICE_WORDS) expect(frame, frame).not.toContain(word);
    }
  });

  it('실데이터 366일 전수 — 화면용 자리표시가 문장으로 새지 않는다', async () => {
    const data = await catalog();

    for (let day = 0; day < 366; day += 1) {
      const date = new Date(Date.UTC(2026, 0, 1 + day));
      const iso = date.toISOString().slice(0, 10);
      const landing = buildLandingData(data, iso);
      const ourWords = [
        frameOf(landing.todayReason),
        landing.todayAside,
        frameOf(`${landing.birthFlower?.lead ?? ''}${landing.birthFlower?.tail ?? ''}`),
      ];

      for (const text of ourWords) {
        expect(text, iso).not.toContain('아직 갈래를 고르는 중이에요');
        expect(text, iso).not.toContain('undefined');
        for (const word of OFFICE_WORDS) expect(text, iso).not.toContain(word);
      }
    }
  });

  it('리드가 날짜를 다시 부르지 않는다 (한 화면에서 오늘을 한 번만 말한다)', async () => {
    const data = await catalog();

    for (let day = 0; day < 366; day += 1) {
      const date = new Date(Date.UTC(2026, 0, 1 + day));
      const iso = date.toISOString().slice(0, 10);
      const landing = buildLandingData(data, iso);

      // 인용 안쪽(훅 원문)은 우리 말이 아니라 검사에서 뺀다.
      expect(frameOf(landing.todayReason), iso).not.toMatch(/\d+월 \d+일/);
      expect(frameOf(landing.todayReason), iso).not.toContain(landing.todayLabel);
    }
  });
});

describe('§1.5n — 결정성 (LLM 없이 로컬에서 같은 값)', () => {
  it('같은 날은 몇 번을 지어도 같은 문장이다', async () => {
    const data = await catalog();

    const first = buildLandingData(data, '2026-08-16');
    const second = buildLandingData(data, '2026-08-16');
    const third = buildLandingData(data, '2026-08-16');

    expect(first.todayReason).toBe(second.todayReason);
    expect(second.todayReason).toBe(third.todayReason);
    expect(first.todayAside).toBe(third.todayAside);
    expect(first.birthFlower?.lead).toBe(third.birthFlower?.lead);
    expect(first.birthFlower?.tail).toBe(third.birthFlower?.tail);
  });

  it('날짜가 바뀌면 같은 꽃이라도 다른 이야기를 꺼낸다', async () => {
    const { stories } = await catalog();

    // 장미는 이야기가 23편이다 — 날짜만 바꿔 30번 물으면 여러 훅이 나와야 한다.
    const picked = new Set<string>();
    for (let day = 0; day < 30; day += 1) {
      const date = new Date(Date.UTC(2026, 0, 1 + day));
      const hook = pickReasonHook('rose-red', stories, date.toISOString().slice(0, 10));
      if (hook) picked.add(hook);
    }

    expect(picked.size).toBeGreaterThan(5);
  });

  it('고른 훅은 반드시 **그 꽃의** 이야기에서 온다', async () => {
    const { stories } = await catalog();
    const mine = new Set(
      stories
        .filter((story) => story.flowerId === 'rose-red')
        .map((story) => story.hook?.trim().replace(/\.$/, '').trim()),
    );

    for (let day = 0; day < 40; day += 1) {
      const date = new Date(Date.UTC(2026, 5, 1 + day));
      const hook = pickReasonHook('rose-red', stories, date.toISOString().slice(0, 10));
      expect(mine.has(hook), `${hook}`).toBe(true);
    }
  });

  it('이야기가 없는 꽃이면 훅 없이 물러선다 (던지지 않는다)', async () => {
    const { stories } = await catalog();

    expect(pickReasonHook('no-such-flower', stories, '2026-08-16')).toBeUndefined();
    expect(pickReasonHook('rose-red', [], '2026-08-16')).toBeUndefined();
  });

  it('실데이터 리드에는 오늘의 꽃 이름과 그 꽃 이야기가 함께 서 있다', async () => {
    const data = await catalog();
    const landing = buildLandingData(data, '2026-08-16');

    expect(landing.todayReason).toContain(landing.today.name);

    const quoted = landing.todayReason.match(/“([^”]*)”/)?.[1];
    expect(quoted).toBeTruthy();

    const hooks = data.stories
      .filter((story) => story.flowerId === landing.today.flowerId)
      .map((story) => story.hook?.trim().replace(/\.$/, '').trim());
    expect(hooks).toContain(quoted);
  });
});

/**
 * §1.5n 4 — 탄생화 각주에서 도감으로 나가는 문 (2026-08-16).
 *
 * 366일 중 309일은 표에만 있고 도감에 없는 꽃이라 이름이 검은 글자로 남았다. 표에만 있다는
 * 사실은 맞지만, 그 사람이 다음에 하고 싶은 일(다른 날짜도 찾아보기)로 가는 문이 화면에
 * 없었다. 그래서 미매칭 날에는 이름이 **도감의 생일 꽃 찾기 구획**으로 간다.
 *
 * ⚠ 링크를 거는 것은 화면(`LandingPage`)이고 뷰모델의 `href` 는 **도감 상세일 때만** 찬다
 *   (그 대비를 `birth-flowers-ui.test.ts` 가 본다). 여기서 보는 것은 목적지가 실재하는가다.
 */
describe('§1.5n 4 — 생일 꽃 찾기 앵커', () => {
  it('앵커가 도감 쪽 마크업에 실제로 있다', () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/components/flowers/BirthdayFinder.tsx'),
      'utf8',
    );
    const anchor = BIRTH_FINDER_HREF.split('#')[1];

    expect(BIRTH_FINDER_HREF.startsWith('/flowers#')).toBe(true);
    expect(source).toContain(`id="${anchor}"`);
  });

  it('각주 문장이 이름을 삼키지 않는다 (링크가 낱말 하나로 남는다)', async () => {
    const data = await catalog();

    for (let day = 0; day < 366; day += 1) {
      const iso = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
      const line = buildLandingData(data, iso).birthFlower;

      expect(line, iso).toBeDefined();
      expect(line?.lead, iso).not.toContain(line?.name ?? '');
      expect(line?.tail, iso).not.toContain(line?.name ?? '');
      expect(`${line?.lead}${line?.name}${line?.tail}`.endsWith('.'), iso).toBe(true);
    }
  });
});

/**
 * §1.4c v3.4 — 전역 테마 전환은 리드 아래 "화면의 빛깔" 칩 한 줄이 전부다.
 *
 * 화면(클릭 → `data-flower` 전환)은 브라우저에서 봐야 하지만, **선택기가 테마 전부를
 * 덮는가**는 여기서 지킬 수 있다. 카테고리를 하나 늘리면서 칩 목록을 잊는 것이 이 자리의
 * 유일한 회귀 경로다 — 그러면 그 계열은 영영 고를 수 없는 색감이 된다.
 */
describe('§1.4c v3.4 — 화면의 빛깔 선택기', () => {
  it('칩 5개가 테마 카테고리 5종을 하나도 빠짐없이 덮는다', () => {
    const chipKeys = STORY_CATEGORIES.map((tint) => tint.key);

    expect(chipKeys).toEqual(Object.keys(CATEGORY_THEMES));
  });

  it('칩마다 서로 다른 `data-flower` 로 간다 (한 번에 하나만 눌린 상태가 된다)', () => {
    const slugs = STORY_CATEGORIES.map((tint) => CATEGORY_THEMES[tint.key].slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('칩 라벨은 `-빛` 어휘다 — 테마 이름(나이트 보태니컬…)을 부르지 않는다', () => {
    for (const tint of STORY_CATEGORIES) {
      expect(tint.label, tint.key).toMatch(/빛$/);
      expect(tint.label.length, tint.key).toBeLessThanOrEqual(4);
    }
  });

  it('오늘의 꽃 계열이 진입 시 눌린 칩이 된다', async () => {
    const landing = buildLandingData(await catalog(), '2026-08-16');
    const pressed = STORY_CATEGORIES.filter(
      (tint) => CATEGORY_THEMES[tint.key].slug === landing.themeSlug,
    );

    expect(pressed).toHaveLength(1);
    expect(pressed[0].key).toBe(landing.category);
  });
});
