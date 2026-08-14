'use server';

/**
 * `/groups` 서버 액션 — 실제 추천 엔진을 돌린다.
 *
 * 화면이 보내는 건 멤버 명단과 공통 intent 뿐이고, 여기서 콘텐츠 카탈로그를 읽어
 * `recommendGroupIndividual`(각각) 과 `recommendGroupBouquet`(단체 부케)을 **둘 다** 호출한다.
 * 두 결과를 한 번에 만드는 이유: 모드 토글은 같은 입력을 보는 두 방식일 뿐이라
 * 토글할 때마다 왕복시키면 같은 계산을 다시 하게 된다.
 *
 * 규칙 id → 한국어 문장, 색 slug → 한국어 표기 같은 변환도 여기서 끝낸다.
 * 클라이언트로는 문자열로 굳은 뷰 모델만 내보내 엔진(zod)이 브라우저 번들에 끌려가지 않게 한다.
 */

import { ZodError } from 'zod';

import { loadCatalog } from '@/lib/data/catalog';
import {
  reasonText,
  recommendGroupBouquet,
  recommendGroupIndividual,
  type GroupIndividualResult,
  type GroupInput,
  type RecoResult,
} from '@/lib/engine';
import { colorLabel, intentLabel, petLabel, traitLabel } from '@/components/groups/labels';
import type {
  FlowerView,
  GroupPlanMember,
  GroupPlanRequest,
  GroupPlanState,
  GroupPlanView,
  MemberAssignment,
} from '@/components/groups/types';

/** 엔진 결과 한 건 → 화면이 그대로 그릴 수 있는 값. */
function toFlowerView(result: RecoResult): FlowerView {
  const view: FlowerView = {
    id: result.flower.id,
    nameKo: result.flower.nameKo,
    cautions: [...result.cautions],
  };

  const suggestion = result.colorSuggestion;
  if (suggestion) {
    view.colorLabel = colorLabel(suggestion.color);
    view.colorReason = suggestion.reason;
    // 출처를 찾은 꽃말만 싣는다 — 없으면 비워 둔다(꽃말은 지어내지 않는다).
    if (suggestion.meaningKo !== undefined) view.meaningKo = suggestion.meaningKo;
  }

  return view;
}

/** 그 사람에게 입력한 조건을 그대로 보여 주는 칩 목록. */
function memoChips(member: GroupPlanMember): string[] {
  return [
    ...member.recipientTraits.map(traitLabel),
    ...member.colorPrefs.map(colorLabel),
    ...member.pets.map(petLabel),
    ...(member.fragranceSensitive ? ['향에 민감'] : []),
  ];
}

function toAssignment(result: GroupIndividualResult, member: GroupPlanMember): MemberAssignment {
  const head = result.picks[0];
  const name = member.name.trim();

  return {
    name,
    initial: name.slice(0, 1),
    memo: memoChips(member),
    flower: head ? toFlowerView(head) : null,
    reasons: head ? head.reasons.map(reasonText) : [],
    alternatives: result.picks.slice(1).map((pick) => pick.flower.nameKo),
  };
}

/** zod 검증 실패는 화면에 그대로 보여 줄 한 문장으로 바꾼다. */
function toMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? '입력을 다시 확인해 주세요.';
  }
  if (error instanceof Error) return error.message;
  return '추천을 만들지 못했어요. 잠시 뒤 다시 시도해 주세요.';
}

/**
 * 멤버 명단 하나로 두 가지 답을 만든다.
 *   · 각각      — 사람마다 다른 꽃(같은 꽃이 겹치면 차순위로 밀어 분산)
 *   · 단체 부케 — 전원에게 안전한 꽃만 남긴 한 다발(최대 3종) + 뺀 이유
 */
export async function planGroup(request: GroupPlanRequest): Promise<GroupPlanState> {
  const members: GroupPlanMember[] = request.members.map((member) => ({
    name: member.name.trim(),
    recipientTraits: member.recipientTraits,
    colorPrefs: member.colorPrefs,
    pets: member.pets,
    fragranceSensitive: member.fragranceSensitive,
  }));

  const input: GroupInput = { intent: request.intent, members };

  try {
    const catalog = await loadCatalog();
    const individual = recommendGroupIndividual(input, catalog);
    const bouquet = recommendGroupBouquet(input, catalog);

    const view: GroupPlanView = {
      intentLabel: intentLabel(request.intent),
      memberCount: members.length,
      individual: individual.map((result, index) => toAssignment(result, members[index])),
      bouquet: {
        flowers: bouquet.flowers.map(toFlowerView),
        excluded: bouquet.excluded.map((item) => ({
          nameKo: item.flower.nameKo,
          reason: item.reason,
          because: [...item.because],
        })),
      },
    };

    if (bouquet.caution !== undefined) view.bouquet.caution = bouquet.caution;

    return { ok: true, view };
  } catch (error) {
    return { ok: false, message: toMessage(error) };
  }
}
