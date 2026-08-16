/**
 * 정적 데모의 이야기 전문 — `app/stories/actions.ts` 자리에 서는 브라우저용 한 벌.
 *
 * 빌드 설정(`next.config.ts`)이 `NEXT_PUBLIC_STATIC_DEMO=1` 일 때
 * `@/app/stories/actions` 를 이 파일로 바꿔치기한다(turbopack `resolveAlias`).
 *
 * ── 아카이브는 왜 손댈 필요가 없었나 ─────────────────────────────────
 * `/stories` 목록은 서버 컴포넌트가 만든다 — 정적 빌드에서는 그 렌더가 **빌드 타임에**
 * 한 번 돌아 HTML 로 굳는다. 즉 카드 317장은 서버가 있을 때와 똑같이 나온다.
 * 서버가 없어서 끊기는 것은 시트를 열 때 부르는 이 함수 하나뿐이라, 여기만 바꿔 끼운다.
 *
 * 전문 317편은 270KB 라 첫 화면에 얹지 않는다 — 시트를 처음 여는 사람만 그때 받는다
 * (`loadDemoCatalog` 와 같은 판단, 그쪽 머리말 참조).
 */

import type { StoryDetail } from '@/components/stories/types';

let cached: Promise<Map<string, StoryDetail>> | null = null;

function loadDetails(): Promise<Map<string, StoryDetail>> {
  cached ??= import('./data/story-details').then(({ DEMO_STORY_DETAILS_JSON }) => {
    const rows = JSON.parse(DEMO_STORY_DETAILS_JSON) as StoryDetail[];
    return new Map(rows.map((row) => [row.id, row]));
  });
  return cached;
}

/**
 * 그 이야기의 전문과 출처. 없는 id 면 `null` — 원본과 같은 규칙이다
 * (던지면 클라이언트에는 뭉개진 오류만 남고 사람이 읽을 문장은 남지 않는다).
 *
 * 출처 각주(창작만 면제)는 이미 빌드 때 굳어 있다 — `scripts/build-demo-catalog.mjs`
 * 가 원본 액션과 **같은 규칙**으로 계산해 넣는다.
 */
export async function loadStoryDetail(storyId: string): Promise<StoryDetail | null> {
  const details = await loadDetails();
  return details.get(storyId) ?? null;
}
