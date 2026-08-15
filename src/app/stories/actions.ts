'use server';

/**
 * `/stories` 서버 액션 — **이야기 한 편의 전문**을 가져온다.
 *
 * ── 왜 이 자리가 생겼나 (성능 리뷰 P1-7, 2026-08-15) ──────────────────
 * 아카이브는 이야기 317편을 첫 응답에 통째로 실어 보냈다. 카드가 쓰는 것은 제목과 hook
 * 한 줄뿐인데 **전문까지** 함께 갔고, 그래서 인라인 RSC payload 가 275KB 였다.
 * 브라우저는 그것을 파싱하느라 첫 화면에서 107~124ms 짜리 롱태스크를 물었다.
 * 전문은 시트를 연 **한 편**만 읽히므로, 그 한 편을 그때 가져오는 것이 옳다.
 *
 * ── 왜 서버 액션인가 ────────────────────────────────────────────────
 * 라우트 핸들러(`/api/...`)를 새로 열지 않은 이유는 이 프로젝트에 이미 서버 액션 두 벌
 * (`app/recommend/actions.ts` · `app/groups/actions.ts`)이 있고, 이 호출도 같은 성격이기
 * 때문이다 — 화면 하나가 자기 데이터를 부르는 자리라 공개 API 로 세울 이유가 없다.
 *
 * ⚠ `'use server'` 파일은 **async 함수만** 내보낼 수 있다(상수·타입 export 금지).
 *   모양(`StoryDetail`)의 원본은 `components/stories/types.ts` 다.
 *
 * 카탈로그는 `loadCatalog()` 가 프로세스 단위로 캐시하고 있어(모듈 스코프) 이 호출이
 * 매번 CSV 를 다시 읽지는 않는다 — 첫 한 번만 디스크를 본다.
 */

import type { StoryDetail } from '@/components/stories/types';
import { loadCatalog } from '@/lib/data/catalog';

/**
 * 그 이야기의 전문과 출처.
 *
 * 없는 id 면 `null` 이다 — 화면이 빈 시트를 그리지 않고 폴백 문구를 세우게 하려는 것이다
 * (throw 하면 클라이언트에는 뭉개진 오류만 남고 사람이 읽을 문장은 남지 않는다).
 *
 * 출처 규칙은 카드 쪽(`app/stories/page.tsx`)과 **같다**: 창작(`original`)만 출처가
 * 면제다(§1.5d·§1.5f). 두 자리가 어긋나면 "각주가 있다 없다" 가 시트를 열 때마다 달라진다.
 */
export async function loadStoryDetail(storyId: string): Promise<StoryDetail | null> {
  const catalog = await loadCatalog();
  const story = catalog.stories.find((row) => row.storyId === storyId);
  if (!story) return null;

  const detail: StoryDetail = { id: story.storyId, body: story.storyKo };
  if (story.storyType !== 'original' && story.sourceTitle) {
    detail.sourceTitle = story.sourceTitle;
    if (story.sourceUrl) detail.sourceUrl = story.sourceUrl;
  }
  return detail;
}
