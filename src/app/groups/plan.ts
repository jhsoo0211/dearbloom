/**
 * 여러 명 추천의 계산 — **서버 액션과 정적 데모가 함께 쓰는 순수 부분.**
 *
 * ── 왜 파일이 갈라졌나 (2026-08-16) ──────────────────────────────────
 * 원래 이 코드는 전부 `actions.ts` 에 있었다. 정적 드롭 데모
 * (`NEXT_PUBLIC_STATIC_DEMO=1`)는 서버가 없어 같은 계산을 브라우저에서 해야 하는데,
 * `'use server'` 파일은 클라이언트에서 import 할 수 없다(하면 그건 다시 서버 호출이다).
 * 그래서 **콘텐츠를 어디서 읽느냐**만 남기고 나머지를 여기로 옮겼다:
 *
 *   · 이 파일  — 순수 함수. 카탈로그를 인자로 받아 화면 값(`GroupPlanState`)을 만든다.
 *   · actions.ts — 서버 전용. `loadCatalog()`(node:fs) 를 넘겨 준다.
 *   · lib/demo/groups-actions.ts — 데모 전용. 굳혀 둔 카탈로그를 넘겨 준다.
 *
 * ── 원래 머리말 ──────────────────────────────────────────────────────
 * 화면이 보내는 건 멤버 명단과 공통 intent 뿐이고, 여기서 콘텐츠 카탈로그를 읽어
 * `recommendGroupIndividual`(각각) 과 `recommendGroupBouquet`(단체 부케)을 **둘 다** 호출한다.
 * 두 결과를 한 번에 만드는 이유: 모드 토글은 같은 입력을 보는 두 방식일 뿐이라
 * 토글할 때마다 왕복시키면 같은 계산을 다시 하게 된다.
 *
 * 규칙 id → 한국어 문장, 색 slug → 한국어 표기 같은 변환도 여기서 끝낸다.
 * 화면으로는 문자열로 굳은 뷰 모델만 내보낸다.
 */

import { z, ZodError } from 'zod';

import type { Catalog } from '@/lib/data/types';
import {
  MAX_GROUP_MEMBERS,
  intentSchema,
  reasonText,
  recipientTraitSchema,
  recommendGroupBouquet,
  recommendGroupIndividual,
  speciesSchema,
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
export function toMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? '입력을 다시 확인해 주세요.';
  }
  if (error instanceof Error) return error.message;
  return '이야기를 꺼내 오다 잠깐 길을 잃었어요. 조금 뒤에 다시 눌러 주세요.';
}

/* ------------------------------------------------------------------ *
 * 들어오는 값의 모양 (경계 검증)
 * ------------------------------------------------------------------ */

/** 이름 한 칸의 상한(화면 `maxLength` 와 같은 값). 넘겨받으면 자른다. */
const MEMBER_NAME_MAX_CHARS = 20;

/** 이름 칸에 본문을 밀어 넣는 요청은 자르지 않고 거절한다. */
const NAME_HARD_MAX = 200;

/** 색 칩 한 사람 몫의 개수 상한. 지금 고를 수 있는 색(7종)의 두 배쯤이다. */
const COLOR_PREFS_MAX = 14;

const SLUG_MAX_CHARS = 40;

/**
 * 화면이 보내는 명단 한 벌의 **모양**.
 *
 * 서버 액션은 공개 HTTP 엔드포인트다 — `GroupPlanRequest` 타입 주석은 컴파일이 끝나면
 * 사라지고, 아래 `request.members.map(...)` 은 members 가 배열이 아니면 그 자리에서 터진다
 * (화면은 문장 대신 500 을 본다). 그래서 첫 줄에서 모양을 먼저 본다.
 *
 * 어휘(마음 8종·분위기 5종·반려동물 2종)는 **여기서 본다.** 엔진 쪽 `groupInputSchema` 는
 * 라벨도 받아 주는 느슨한 문이라, 화면이 slug 만 보낸다는 이 화면의 약속은 여기서 지킨다.
 */
const groupPlanRequestSchema = z.object({
  intent: intentSchema,
  members: z
    .array(
      z.object({
        name: z
          .string()
          .max(NAME_HARD_MAX)
          .transform((value) => value.trim().slice(0, MEMBER_NAME_MAX_CHARS)),
        recipientTraits: z.array(recipientTraitSchema).max(COLOR_PREFS_MAX),
        colorPrefs: z.array(z.string().max(SLUG_MAX_CHARS)).max(COLOR_PREFS_MAX),
        pets: z.array(speciesSchema).max(COLOR_PREFS_MAX),
        fragranceSensitive: z.boolean(),
      }),
    )
    .min(1)
    .max(MAX_GROUP_MEMBERS),
});

/**
 * 멤버 명단 하나로 두 가지 답을 만든다.
 *   · 각각      — 사람마다 다른 꽃(같은 꽃이 겹치면 차순위로 밀어 분산)
 *   · 단체 부케 — 전원에게 안전한 꽃만 남긴 한 다발(최대 3종) + 뺀 이유
 *
 * 카탈로그를 **값이 아니라 로더로** 받는 이유: 모양 검사가 콘텐츠 읽기보다 **먼저** 와야
 * 한다. 이상한 요청 하나 때문에 366행짜리 CSV 를 읽고 시작할 이유가 없고, 순서가 바뀌면
 * "모양이 어긋난 요청" 이 "콘텐츠를 못 읽었다" 로 잘못 보고된다.
 */
export async function planWithCatalog(
  request: GroupPlanRequest,
  loadCatalog: () => Promise<Catalog>,
): Promise<GroupPlanState> {
  const received = groupPlanRequestSchema.safeParse(request);
  if (!received.success) {
    // ⚠ zod 의 issue 에는 받은 값(이름)이 섞인다 — 오류 객체를 그대로 찍지 않는다.
    console.error('[groups] 받은 값의 모양이 어긋납니다. (내용은 남기지 않습니다)');
    return {
      ok: false,
      message: '이야기를 꺼내 오다 잠깐 길을 잃었어요. 조금 뒤에 다시 눌러 주세요.',
    };
  }

  // 이름은 스키마가 이미 다듬었다(trim · 20자).
  const members: GroupPlanMember[] = received.data.members.map((member) => ({
    name: member.name,
    recipientTraits: member.recipientTraits,
    colorPrefs: member.colorPrefs,
    pets: member.pets,
    fragranceSensitive: member.fragranceSensitive,
  }));

  const input: GroupInput = { intent: received.data.intent, members };

  try {
    const catalog = await loadCatalog();
    const individual = recommendGroupIndividual(input, catalog);
    const bouquet = recommendGroupBouquet(input, catalog);

    const view: GroupPlanView = {
      intentLabel: intentLabel(received.data.intent),
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
