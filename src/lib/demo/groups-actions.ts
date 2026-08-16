/**
 * 정적 데모의 그룹 추천 — `app/groups/actions.ts` 자리에 서는 브라우저용 한 벌.
 *
 * 빌드 설정(`next.config.ts`)이 `NEXT_PUBLIC_STATIC_DEMO=1` 일 때
 * `@/app/groups/actions` 를 이 파일로 바꿔치기한다(turbopack `resolveAlias`).
 * 내보내는 이름과 시그니처는 원본과 같아야 한다 — `GroupPlanner` 는 자기가 서버를
 * 부르는지 아닌지 모른 채 그대로 돈다.
 *
 * 서버판과 다른 점은 **콘텐츠를 어디서 읽느냐** 하나뿐이다. 그룹 추천에는 LLM 이
 * 애초에 없어서(각각·단체 부케 둘 다 엔진 계산이다) 결과가 서버판과 완전히 같다.
 */

import { planWithCatalog } from '@/app/groups/plan';
import type { GroupPlanRequest, GroupPlanState } from '@/components/groups/types';

import { loadDemoCatalog } from './catalog';

/**
 * 멤버 명단 하나로 두 가지 답을 만든다.
 *   · 각각      — 사람마다 다른 꽃(같은 꽃이 겹치면 차순위로 밀어 분산)
 *   · 단체 부케 — 전원에게 안전한 꽃만 남긴 한 다발(최대 3종) + 뺀 이유
 */
export async function planGroup(request: GroupPlanRequest): Promise<GroupPlanState> {
  return planWithCatalog(request, loadDemoCatalog);
}
