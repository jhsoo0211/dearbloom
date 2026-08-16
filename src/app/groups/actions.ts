'use server';

/**
 * `/groups` 서버 액션 — 실제 추천 엔진을 돌린다.
 *
 * 이 파일에 남은 것은 **서버에서만 할 수 있는 한 가지**뿐이다:
 * `loadCatalog()` 가 `node:fs` 로 `content/*.csv` 를 읽는 일.
 * 검증·엔진 호출·뷰 조립은 전부 순수 함수라 `./plan.ts` 에 있고, 정적 드롭 데모가
 * **같은 함수**를 브라우저에서 부른다(`src/lib/demo/groups-actions.ts`).
 */

import { loadCatalog } from '@/lib/data/catalog';
import { planWithCatalog } from './plan';
import type { GroupPlanRequest, GroupPlanState } from '@/components/groups/types';

/**
 * 멤버 명단 하나로 두 가지 답을 만든다.
 *   · 각각      — 사람마다 다른 꽃(같은 꽃이 겹치면 차순위로 밀어 분산)
 *   · 단체 부케 — 전원에게 안전한 꽃만 남긴 한 다발(최대 3종) + 뺀 이유
 */
export async function planGroup(request: GroupPlanRequest): Promise<GroupPlanState> {
  return planWithCatalog(request, loadCatalog);
}
