import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ChoiceList, pendingChoice } from '@/components/flow/Wizard';
import { RELATIONSHIP_LABELS } from '@/components/flow/labels';
import type { ChoiceOption } from '@/components/flow/types';
import styles from '@/components/flow/flow.module.css';
import { RELATIONSHIPS } from '@/lib/engine';

/**
 * 하이드레이션 전에 누른 라디오가 유실되던 버그의 회귀 테스트.
 *
 * 무슨 일이 났었나 — 질문 1·2·4번의 선택지 목록은 제어 컴포넌트라 서버 HTML 에는 체크된
 * 라디오가 하나도 없다. 그래서 JS 가 닿기 전에 행을 누르면 **브라우저만** 그 라디오를
 * 체크하고, React 는 하이드레이션 때 그 체크를 덮지 않은 채 입력 트래커의 시작값으로
 * 삼는다. 그 뒤로는 같은 행을 다시 눌러도 DOM 값이 그대로라 change 가 삼켜져서, 그 답은
 * **다른 행을 누르기 전까지 영영 상태로 올라오지 못했다**(느린 회선의 실사용자 버그).
 *
 * ⚠ 이 저장소의 vitest 는 `environment: 'node'` 이고 jsdom·happy-dom·testing-library 가
 * 없다(vitest.config.ts 는 이 작업의 소유 파일이 아니다). 그래서 진짜 DOM 에 하이드레이트해
 * 클릭을 쏘는 대신, 위 세 가지 동작(브라우저의 선체크 · 트래커의 시작값 · 값이 그대로면
 * 삼켜지는 change)만 최소한으로 흉내 낸 하네스로 검증한다. 하네스가 흉내가 아니라 사실을
 * 딛고 서도록, 이 버그의 전제인 "서버 HTML 에 checked 가 없다"는 맨 아래에서 실제
 * `ChoiceList` 를 서버 렌더해 확인한다.
 */

/** 서버(`src/app/recommend/page.tsx`)가 만드는 것과 같은 모양의 관계 선택지 6종. */
const RELATIONSHIP_OPTIONS: ChoiceOption[] = RELATIONSHIPS.map((value) => ({
  value,
  label: RELATIONSHIP_LABELS[value].label,
  desc: RELATIONSHIP_LABELS[value].desc,
}));

/** 지금 화면에 걸려 있는 두 갈래. 껐다 켜 보며 버그를 재현·수정 확인한다. */
interface Wiring {
  /** 마운트 때 DOM 이 든 선택을 상태로 승격한다. */
  promoteOnMount: boolean;
  /** change 와 같은 규칙을 클릭에도 건다. */
  clickPath: boolean;
}

const FIXED: Wiring = { promoteOnMount: true, clickPath: true };

class RadioGroupSim {
  /** React 상태 — 화면이 그리는 유일한 근거다. */
  state = '';
  /** onChange 로 올라온 값들. 같은 값으로 괜히 다시 부르지 않는지 본다. */
  readonly handled: string[] = [];

  /** 브라우저가 체크해 둔 라디오. */
  private domChecked: string | null = null;
  /** React 입력 트래커가 라디오별로 기억하는 값. */
  private readonly tracked = new Map<string, string>();
  private mounted = false;

  constructor(
    private readonly options: ChoiceOption[],
    private readonly wiring: Wiring,
  ) {}

  /** JS 가 닿기 전 행을 누른다 — 브라우저만 반응하고 React 는 모른다. */
  tapBeforeHydration(value: string) {
    if (this.mounted) throw new Error('이미 하이드레이트된 뒤다 — tap 을 써라');
    this.domChecked = value;
  }

  /** 하이드레이션. React 는 사용자가 넣어 둔 체크를 덮지 않고 트래커의 시작값으로 삼는다. */
  hydrate() {
    this.mounted = true;
    this.syncTracker();
    if (this.wiring.promoteOnMount) {
      const next = pendingChoice(this.domChecked, this.state, this.options);
      if (next !== null) {
        this.handle(next);
        this.rerender();
      }
    }
  }

  /** 하이드레이션 뒤의 클릭 한 번. */
  tap(value: string) {
    if (!this.mounted) throw new Error('아직 하이드레이트 전이다 — tapBeforeHydration 을 써라');
    const before = this.state;
    this.domChecked = value; // 브라우저 기본 동작: 누른 것만 체크된다

    // React 이벤트 순서 — onClick(SimpleEventPlugin) 이 먼저, onChange(ChangeEventPlugin) 가 뒤.
    if (this.wiring.clickPath) {
      const next = pendingChoice(value, this.state, this.options);
      if (next !== null) this.handle(next);
    }
    // React 는 라디오의 change 를 클릭에서 만들어 내되, 트래커 값이 그대로면 삼킨다.
    if (this.tracked.get(value) !== 'true') this.handle(value);

    // 상태가 바뀌었을 때만 리렌더된다. 삼켜졌으면 React 는 아무것도 하지 않고,
    // 브라우저가 체크해 둔 DOM 이 그대로 남는다 — 이 버그가 굳어 버리는 지점이다.
    if (this.state !== before) this.rerender();
  }

  /** ChoiceList 의 onChange. */
  private handle(next: string) {
    this.handled.push(next);
    this.state = next;
  }

  /** 리렌더 — 제어 컴포넌트라 DOM 의 checked 는 상태에서 나온다. */
  private rerender() {
    this.domChecked = this.state === '' ? null : this.state;
    this.syncTracker();
  }

  private syncTracker() {
    for (const option of this.options) {
      this.tracked.set(option.value, String(option.value === this.domChecked));
    }
  }
}

describe('pendingChoice — 화면이 든 선택이 상태와 어긋났는가', () => {
  it('상태가 비어 있는데 DOM 이 답을 들고 있으면 그 값을 올린다', () => {
    expect(pendingChoice('lover', '', RELATIONSHIP_OPTIONS)).toBe('lover');
  });

  it('상태와 이미 같으면 아무것도 하지 않는다', () => {
    // 같은 행을 다시 눌렀을 때 프리셋 표기 같은 곁가지 상태를 괜히 지우지 않기 위해서다.
    expect(pendingChoice('lover', 'lover', RELATIONSHIP_OPTIONS)).toBeNull();
  });

  it('바꾸는 클릭은 그대로 올린다', () => {
    expect(pendingChoice('friend', 'lover', RELATIONSHIP_OPTIONS)).toBe('friend');
  });

  it('어휘 밖 값은 버린다 — 상태에는 서버가 내려준 slug 만 들어간다', () => {
    expect(pendingChoice('drop-table', '', RELATIONSHIP_OPTIONS)).toBeNull();
  });

  it('체크된 라디오가 없으면 조용히 넘어간다', () => {
    expect(pendingChoice(null, '', RELATIONSHIP_OPTIONS)).toBeNull();
    expect(pendingChoice(undefined, '', RELATIONSHIP_OPTIONS)).toBeNull();
    expect(pendingChoice('', '', RELATIONSHIP_OPTIONS)).toBeNull();
  });
});

describe('하이드레이션 전에 누른 라디오', () => {
  it('[버그 재현] 두 갈래가 다 없으면 같은 행을 다시 눌러도 답이 영영 올라오지 못한다', () => {
    const sim = new RadioGroupSim(RELATIONSHIP_OPTIONS, {
      promoteOnMount: false,
      clickPath: false,
    });

    sim.tapBeforeHydration('lover');
    sim.hydrate();
    expect(sim.state).toBe('');

    sim.tap('lover'); // 화면에 티가 안 나니 사용자는 같은 행을 다시 누른다
    expect(sim.state).toBe(''); // ← change 가 삼켜진다. 여기가 버그다
    expect(sim.handled).toEqual([]);

    sim.tap('friend'); // 다른 행을 누르면 그제야 살아난다(제보 그대로)
    expect(sim.state).toBe('friend');
  });

  it('마운트 승격이 하이드레이션 전에 누른 답을 그대로 살린다', () => {
    const sim = new RadioGroupSim(RELATIONSHIP_OPTIONS, FIXED);

    sim.tapBeforeHydration('lover');
    sim.hydrate();

    expect(sim.state).toBe('lover'); // 다시 묻지 않는다
    expect(sim.handled).toEqual(['lover']);
  });

  it('승격이 없었더라도 같은 행 재클릭이 반드시 먹는다 (두 번째 그물)', () => {
    const sim = new RadioGroupSim(RELATIONSHIP_OPTIONS, {
      promoteOnMount: false,
      clickPath: true,
    });

    sim.tapBeforeHydration('lover');
    sim.hydrate();
    sim.tap('lover');

    expect(sim.state).toBe('lover');
  });

  it('두 갈래가 겹쳐도 값이 흔들리지 않는다', () => {
    const sim = new RadioGroupSim(RELATIONSHIP_OPTIONS, FIXED);

    sim.tapBeforeHydration('lover');
    sim.hydrate();
    sim.tap('lover'); // 승격으로 이미 올라온 행을 한 번 더
    sim.tap('lover');

    expect(sim.state).toBe('lover');
    expect(sim.handled).toEqual(['lover']); // 같은 값으로 다시 부르지 않는다
  });
});

describe('정상 흐름은 그대로다', () => {
  it('고르고, 바꾸고, 같은 행을 다시 눌러도 값이 흔들리지 않는다', () => {
    const sim = new RadioGroupSim(RELATIONSHIP_OPTIONS, FIXED);
    sim.hydrate();

    sim.tap('lover');
    expect(sim.state).toBe('lover');

    sim.tap('friend');
    expect(sim.state).toBe('friend');

    const settled = sim.handled.length;
    sim.tap('friend');
    expect(sim.state).toBe('friend');
    expect(sim.handled.length).toBe(settled); // 이미 같은 값이면 한 번도 부르지 않는다
  });

  it('클릭과 change 가 겹쳐 불려도 같은 값만 올라온다', () => {
    const sim = new RadioGroupSim(RELATIONSHIP_OPTIONS, FIXED);
    sim.hydrate();
    sim.tap('lover');

    expect(new Set(sim.handled)).toEqual(new Set(['lover']));
    expect(sim.state).toBe('lover');
  });
});

describe('서버 HTML — 이 버그의 전제', () => {
  function markup(value: string) {
    return renderToStaticMarkup(
      createElement(ChoiceList, {
        name: 'relationship',
        labelledBy: 'q-title',
        options: RELATIONSHIP_OPTIONS,
        value,
        onChange: () => {},
      }),
    );
  }

  it('상태가 비어 있으면 체크된 라디오가 하나도 없다', () => {
    // 그래서 JS 가 닿기 전에 누른 답이 DOM 에만 남는다(위 하네스의 출발점).
    expect(markup('')).not.toContain('checked');
    expect(markup('')).not.toContain(styles.relOn);
  });

  it('고른 값의 checked 와 선택 표현이 둘 다 상태에서 나온다', () => {
    const html = markup('lover');

    // 제어 컴포넌트 — defaultChecked 로 도망가면 이 줄이 먼저 깨진다.
    expect(html).toContain('checked=""');
    expect(html.split('checked=""')).toHaveLength(2);

    // §1.6b — 한 화면에 선택 표현 하나. 그 하나도 상태에서만 붙는다.
    expect(html.split(styles.relOn)).toHaveLength(2);
  });
});
