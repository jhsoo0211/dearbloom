import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { planGroup } from '@/app/groups/actions';
import type { GroupPlanRequest } from '@/components/groups/types';

/**
 * 그룹 서버 액션의 **경계**.
 *
 * `planGroup` 은 예전에 받은 값을 곧바로 `request.members.map(...)` 으로 열었다 —
 * try 블록보다 **앞**이라, members 가 배열이 아니면 그 자리에서 TypeError 가 나고
 * 화면은 문장 대신 500 을 봤다. 이름도 `member.name.trim()` 으로 바로 만졌다.
 *
 * 여기서 확인하는 것은 하나다: 어떤 모양이 들어와도 이 함수는 **던지지 않고**
 * `{ ok:false, message }` 로 돌아온다. 그리고 제대로 된 명단은 예전 그대로 통과한다.
 */

const MEMBER: GroupPlanRequest['members'][number] = {
  name: '지수',
  recipientTraits: ['calm'],
  colorPrefs: ['white'],
  pets: ['cat'],
  fragranceSensitive: false,
};

function request(overrides: Partial<GroupPlanRequest> = {}): GroupPlanRequest {
  return { intent: 'gratitude', members: [MEMBER], ...overrides };
}

/** 모양이 어긋났을 때 화면에 나가는 한 문장. */
const SHAPE_MESSAGE = '이야기를 꺼내 오다 잠깐 길을 잃었어요. 조금 뒤에 다시 눌러 주세요.';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('planGroup — 모양이 어긋난 요청', () => {
  it('빈 객체를 보내도 던지지 않는다', async () => {
    const state = await planGroup({} as GroupPlanRequest);

    expect(state.ok).toBe(false);
    if (state.ok) return;
    expect(state.message).toBe(SHAPE_MESSAGE);
  });

  it('members 가 배열이 아니면 map 에 닿기 전에 막는다', async () => {
    const state = await planGroup(
      request({ members: '지수, 민준' as unknown as GroupPlanRequest['members'] }),
    );

    expect(state.ok).toBe(false);
  });

  it('이름이 문자열이 아니어도 trim 에 닿지 않는다', async () => {
    const state = await planGroup(
      request({ members: [{ ...MEMBER, name: 42 as unknown as string }] }),
    );

    expect(state.ok).toBe(false);
  });

  it('명단이 비어 있으면 받지 않는다', async () => {
    const state = await planGroup(request({ members: [] }));

    expect(state.ok).toBe(false);
  });

  it('인원 상한(10명)을 넘기면 받지 않는다', async () => {
    const many = Array.from({ length: 11 }, (_, index) => ({ ...MEMBER, name: `사람${index}` }));
    const state = await planGroup(request({ members: many }));

    expect(state.ok).toBe(false);
  });

  it('어휘 밖 값은 여기서 막는다 (화면은 slug 만 보낸다는 약속)', async () => {
    const badPet = await planGroup(
      request({ members: [{ ...MEMBER, pets: ['hamster'] as unknown as typeof MEMBER.pets }] }),
    );
    expect(badPet.ok).toBe(false);

    const badTrait = await planGroup(
      request({
        members: [{ ...MEMBER, recipientTraits: ['차분한'] as unknown as typeof MEMBER.recipientTraits }],
      }),
    );
    expect(badTrait.ok).toBe(false);

    const badIntent = await planGroup(
      request({ intent: '고마움' as unknown as GroupPlanRequest['intent'] }),
    );
    expect(badIntent.ok).toBe(false);
  });
});

describe('planGroup — 제대로 된 명단', () => {
  it('각각과 단체 부케를 한 번에 만들어 돌려준다', async () => {
    const state = await planGroup(
      request({
        members: [
          MEMBER,
          { ...MEMBER, name: '민준', recipientTraits: ['vivid'], colorPrefs: ['orange'], pets: [] },
        ],
      }),
    );

    expect(state.ok).toBe(true);
    if (!state.ok) return;
    expect(state.view.memberCount).toBe(2);
    expect(state.view.individual).toHaveLength(2);
    expect(state.view.individual.map((item) => item.name)).toEqual(['지수', '민준']);
    expect(state.view.bouquet.flowers.length).toBeGreaterThan(0);
  });

  it('이름은 앞뒤 공백을 털고 들어간다', async () => {
    const state = await planGroup(request({ members: [{ ...MEMBER, name: '  하린  ' }] }));

    expect(state.ok).toBe(true);
    if (!state.ok) return;
    expect(state.view.individual[0].name).toBe('하린');
    expect(state.view.individual[0].initial).toBe('하');
  });

  it('이름만 공백이면 "이름을 적어 달라"는 그 문장이 그대로 나온다', async () => {
    const state = await planGroup(request({ members: [{ ...MEMBER, name: '   ' }] }));

    expect(state.ok).toBe(false);
    if (state.ok) return;
    expect(state.message).toBe('부르실 이름 한 줄만 적어 주세요.');
  });
});
