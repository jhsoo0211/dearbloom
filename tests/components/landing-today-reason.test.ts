import { describe, expect, it } from 'vitest';

import {
  buildLandingData,
  composeTodayReason,
  pickReasonHook,
} from '@/components/landing/landing-build';
import { CATEGORY_THEMES } from '@/components/landing/landing-data';
import { STORY_CATEGORIES } from '@/components/stories/categories';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';
import type { TodayBasis } from '@/lib/engine/today';

/**
 * 랜딩 리드의 "고른 이유" 한 문장 (§1.5n) — 이야기에서 끌어온 문장인가.
 *
 * 사용자 요청(2026-08-16): "오늘의 꽃 추천 멘트를 우리가 모은 이야기 기반으로 감성적으로.
 * 로컬에서도 작동." 뒷문장이 이 파일이 존재하는 이유다 — **모델을 부르지 않는다.** 그래서
 * 여기서 지켜야 하는 것은 문장의 아름다움이 아니라 **결정성**이다: 같은 날에는 몇 번을
 * 지어도 같은 문장이 나와야 하고, 서버·테스트·로컬이 모두 같은 값을 봐야 한다.
 *
 * 함께 보는 것 둘:
 *   · 재료 3단(이야기 훅 → 꽃말 → 없음) × basis 3분기 = 9칸이 전부 채워지는가
 *   · 그 문장에 **사무 어휘가 섞이지 않는가**(§1.5d 이야기 톤). 이 선은 코드 주석이 아니라
 *     여기서 지킨다 — `tests/components/birth-flowers-ui.test.ts` 의 금지어 목록과 같은 장치다.
 */

let cached: Catalog | undefined;
async function catalog(): Promise<Catalog> {
  cached ??= await loadCatalog();
  return cached;
}

const BASES: TodayBasis[] = ['in_season', 'adjacent', 'all'];

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
 * 금지어 검사를 문장 전체에 걸 수 없다: 훅은 편집자가 쓴 헤드라인 원문이고 377편 중 2편에
 * `기준` 이 들어 있다(`나라꽃을 고르는 기준이…`). 그건 이야기의 말이지 우리 말이 아니다.
 */
function frameOf(sentence: string): string {
  return sentence.replace(/“[^”]*”/g, '').replace(/‘[^’]*’/g, '');
}

describe('§1.5n — 재료 3단 × basis 3분기', () => {
  it('이야기 훅이 있으면 훅을 인용하고 초대의 말로 받는다', () => {
    const reason = composeTodayReason({
      basis: 'in_season',
      hook: '천 년째 답장을 못 받고 있는 새가 있습니다',
      meaning: '열정적인 사랑과 깊은 애정',
    });

    expect(reason).toBe(
      '일 년을 기다려 지금이 한창인 꽃이에요. ' +
        '“천 년째 답장을 못 받고 있는 새가 있습니다” — 오늘은 이 이야기부터 들려드리고 싶었어요.',
    );
    // 훅이 있으면 꽃말은 부르지 않는다(한 문장에 재료 둘을 겹치지 않는다).
    expect(reason).not.toContain('열정적인 사랑');
  });

  it('훅이 없으면 꽃말을 재료로 물러선다', () => {
    expect(composeTodayReason({ basis: 'in_season', meaning: '맑은 마음' })).toBe(
      '일 년을 기다려 지금이 한창인 꽃이에요. ' +
        '‘맑은 마음’이라는 말을 품은 꽃이라, 오늘 같은 날 꺼내고 싶었어요.',
    );
  });

  it('훅도 꽃말도 없으면 제철 사정만으로 한 문장을 세운다 (빈손 금지)', () => {
    for (const basis of BASES) {
      const reason = composeTodayReason({ basis });
      expect(reason.length, basis).toBeGreaterThan(20);
      expect(reason.endsWith('.'), basis).toBe(true);
      expect(reason, basis).not.toContain('“');
      expect(reason, basis).not.toContain('‘');
    }
  });

  it('9칸이 모두 서로 다른 문장이다 (basis 가 문장에 실제로 반영된다)', () => {
    const cells = BASES.flatMap((basis) => [
      composeTodayReason({ basis, hook: '천 년째 답장을 못 받고 있는 새가 있습니다' }),
      composeTodayReason({ basis, meaning: '맑은 마음' }),
      composeTodayReason({ basis }),
    ]);

    expect(new Set(cells).size).toBe(9);
  });

  it('꽃말 뒤 조사를 받침으로 가른다', () => {
    // 받침 있음(`마음`) → 이라는
    expect(composeTodayReason({ basis: 'all', meaning: '맑은 마음' })).toContain('’이라는 말을');
    // 받침 없음(`인내`) → 라는
    expect(composeTodayReason({ basis: 'all', meaning: '인내' })).toContain('’라는 말을');
  });

  it('빈 문자열·공백만 있는 재료는 없는 것으로 본다', () => {
    const bare = composeTodayReason({ basis: 'all' });

    expect(composeTodayReason({ basis: 'all', hook: '   ', meaning: '' })).toBe(bare);
    expect(composeTodayReason({ basis: 'all', hook: '.' })).toBe(bare);
  });
});

describe('§1.5n — 훅 인용은 원문 그대로', () => {
  it('문장을 다시 쓰지 않는다 (합니다체 헤드라인이 그대로 남는다)', () => {
    const hook = '30년을 싸운 사람들은 자기들이 \'장미전쟁\' 중인 줄 몰랐습니다';

    expect(composeTodayReason({ basis: 'all', hook })).toContain(`“${hook}”`);
  });

  it('겹따옴표가 든 훅도 바깥 인용과 겹치지 않는다', () => {
    // 훅 원문에는 `"` 와 `'` 가 섞여 있다(377편 중 26편) — 바깥은 타이포그래픽 따옴표라야 한다.
    const hook = '신들의 세계에서 장미는 "입 다물어"라는 뜻이었습니다';
    const reason = composeTodayReason({ basis: 'all', hook });

    expect(reason).toContain(`“${hook}”`);
    expect(reason.match(/“/g)).toHaveLength(1);
    expect(reason.match(/”/g)).toHaveLength(1);
  });

  it('문장 끝 마침표 하나만 떼어 377편을 같은 모양으로 세운다', () => {
    const withDot = composeTodayReason({
      basis: 'in_season',
      hook: '인류가 살아 있는 생명에 처음으로 특허번호를 매긴 날, 그 1번은 장미였습니다.',
    });

    expect(withDot).toContain('그 1번은 장미였습니다” —');
    expect(withDot).not.toContain('장미였습니다.”');
  });

  it('물음표·느낌표는 떼지 않는다 (조판이 아니라 화자의 어조다)', () => {
    expect(
      composeTodayReason({ basis: 'all', hook: '향수 한 방울에 장미 몇 송이가 들어갈까요?' }),
    ).toContain('들어갈까요?”');
  });
});

describe('§1.5d — 사무 어휘 0', () => {
  it('우리가 쓴 말에 안내문 어휘가 섞이지 않는다', () => {
    const frames = BASES.flatMap((basis) => [
      frameOf(composeTodayReason({ basis, hook: '나라꽃을 고르는 기준이 다들 아는 꽃이라서였습니다.' })),
      frameOf(composeTodayReason({ basis, meaning: '조건 없는 사랑' })),
      frameOf(composeTodayReason({ basis })),
    ]);

    for (const frame of frames) {
      for (const word of OFFICE_WORDS) expect(frame, frame).not.toContain(word);
    }
  });

  it('실데이터 366일 전수 — 화면용 자리표시가 문장으로 새지 않는다', async () => {
    const data = await catalog();

    for (let day = 0; day < 366; day += 1) {
      const date = new Date(Date.UTC(2026, 0, 1 + day));
      const iso = date.toISOString().slice(0, 10);
      const reason = buildLandingData(data, iso).todayReason;

      expect(reason, iso).not.toContain('아직 갈래를 고르는 중이에요');
      expect(reason, iso).not.toContain('undefined');
      for (const word of OFFICE_WORDS) expect(frameOf(reason), iso).not.toContain(word);
    }
  });
});

describe('§1.5n — 결정성 (LLM 없이 로컬에서 같은 값)', () => {
  it('같은 날은 몇 번을 지어도 같은 문장이다', async () => {
    const data = await catalog();

    const first = buildLandingData(data, '2026-08-16').todayReason;
    const second = buildLandingData(data, '2026-08-16').todayReason;
    const third = buildLandingData(data, '2026-08-16').todayReason;

    expect(first).toBe(second);
    expect(second).toBe(third);
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

  it('실데이터 리드에는 오늘의 꽃 이야기가 실제로 인용돼 있다', async () => {
    const data = await catalog();
    const landing = buildLandingData(data, '2026-08-16');

    const quoted = landing.todayReason.match(/“([^”]*)”/)?.[1];
    expect(quoted).toBeTruthy();

    const hooks = data.stories
      .filter((story) => story.flowerId === landing.today.flowerId)
      .map((story) => story.hook?.trim().replace(/\.$/, '').trim());
    expect(hooks).toContain(quoted);
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
