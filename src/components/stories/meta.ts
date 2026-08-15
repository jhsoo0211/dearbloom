/**
 * 이야기의 **각주 메타** 한 줄을 조립한다 — 카드와 상세 시트가 같은 함수를 쓴다.
 *
 * §1.5i(2026-08-15 사용자 16차) 이야기 내부 위계: 화면에 먼저 오는 것은 hook 과 본문이고,
 * 문화권("케냐")·시대·갈래·신뢰 라벨은 **이야기 아래 각주 줄**로 내려간다. 카드 상단에
 * 지역·시대 칩을 세우면 "이야기를 읽으러 온 사람"이 분류표부터 읽게 된다 —
 * 그래서 이 메타는 칩(pill)이 아니라 작은 글씨 한 줄로만 존재한다.
 *
 * 순서는 카드·시트가 같아야 한다(같은 정보가 화면마다 다른 자리에 있으면 다시 찾게 된다).
 * 문화권·시대는 비어 있는 행이 있어서 없으면 칸 자체를 만들지 않고,
 * 갈래·신뢰는 모든 행에 있으므로 항상 붙는다.
 *
 * ⚠ 여기서 문장을 새로 지어내지 않는다 — 라벨은 전부 서버가 붙여 준 값이다.
 *
 * 순수 함수만 둔다(types.ts 와 같은 규칙) — 엔진·카탈로그 로더가 브라우저 번들에 섞이지 않게.
 */

import type { ArchiveStory } from './types';

export interface MetaNote {
  key: string;
  text: string;
  /**
   * 액센트로 세울 칸인지. §1.5f — 창작 이야기의 갈래 라벨만 해당한다
   * (각주로 내려가도 "지어 본 이야기"라는 사실은 흐려지면 안 된다).
   */
  accent?: boolean;
}

export function metaNotes(story: ArchiveStory): MetaNote[] {
  const notes: MetaNote[] = [];
  if (story.regionLabel) notes.push({ key: 'region', text: story.regionLabel });
  if (story.eraLabel) notes.push({ key: 'era', text: story.eraLabel });
  notes.push({ key: 'type', text: story.typeLabel, accent: story.isOriginal });
  notes.push({ key: 'confidence', text: story.confidenceLabel });
  return notes;
}
