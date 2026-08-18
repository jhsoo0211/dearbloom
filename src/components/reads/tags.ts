/**
 * 「읽을거리」의 칩 어휘 13종 — 세 축으로 나뉜 통제 어휘.
 *
 * 값의 원본은 `db/seed/schemas.ts` 의 `READ_SEASON_TAGS` · `READ_STRAND_TAGS` ·
 * `READ_PLACE_TAGS` 이고, 여기는 **화면 쪽 사본**이다(`stories/categories.ts` 가 §1.4c 의
 * 사본을 드는 것과 같은 경계 — 클라이언트가 zod·node:fs 를 끌고 오는 시드 모듈을 import
 * 하지 않게 한다). ⚠ 두 벌이 어긋나면 칩이 조용히 0건이 된다: 값은 한국어 라벨 그 자체라
 * 오타가 타입 오류로 잡히지 않는다. 한쪽을 고치면 반드시 다른 쪽도 고친다
 * (`tests/reads/tags.test.ts` 가 두 벌을 맞대어 본다).
 *
 * ── 왜 세 줄로 나누는가 ──────────────────────────────────────────────
 * 13칸을 한 줄에 늘어놓으면 무엇으로 고르고 있는지가 사라진다. 「무엇을」(결) ·
 * 「언제」(계절) · 「어디서」(자리)는 서로 다른 질문이라 축이 다르고, 그래서 **AND** 로 만난다
 * (`/stories` 의 계열↔꽃말이 배타인 것과 반대다 — 그 둘은 같은 축을 두 번 자르는 필터였다).
 * 한 축 안에서는 하나만 고르고, 같은 칩을 다시 누르면 꺼진다(`전체` 칸을 두지 않는다).
 */

/** 축 키. 화면 라벨이 아니라 코드가 쓰는 이름이다. */
export type ReadTagAxis = 'strand' | 'season' | 'place';

export interface ReadTagGroup {
  axis: ReadTagAxis;
  /** 칩 줄 앞에 서는 라벨. */
  label: string;
  /** 낭독기에만 붙는 꼬리(`골라 거르기`) — 눈으로는 라벨만 읽힌다. */
  tags: readonly string[];
}

/** 계절 — 행사는 개최 시기 기준 1개 이상, 글·트렌드는 계절색이 뚜렷할 때만. */
export const READ_SEASON_TAGS = ['봄', '여름', '가을', '겨울'] as const;

/** 결 — **모든 행에 최소 1개.** 이 축이 「무엇을 보는가」를 가른다. */
export const READ_STRAND_TAGS = ['축제', '전시', '이야기', '빛깔', '꽃 다루기'] as const;

/** 자리 — **모든 행에 정확히 1개.** 물리적으로 갈 곳이 없는 것은 전부 `온라인` 이다. */
export const READ_PLACE_TAGS = ['서울·수도권', '지방', '해외', '온라인'] as const;

/**
 * 줄 순서가 곧 화면 순서다.
 *
 * 결이 맨 위인 이유: 「축제를 볼까, 읽을거리를 볼까」가 이 화면에서 사람이 가장 먼저 하는
 * 구분이다. 계절·자리는 그다음에 좁히는 축이라 아래로 내린다.
 */
export const READ_TAG_GROUPS: readonly ReadTagGroup[] = [
  { axis: 'strand', label: '결', tags: READ_STRAND_TAGS },
  { axis: 'season', label: '계절', tags: READ_SEASON_TAGS },
  { axis: 'place', label: '자리', tags: READ_PLACE_TAGS },
];

/** 어휘 13종 전부(줄 순서대로). 검증·테스트가 쓰는 평면 목록이다. */
export const READ_TAGS: readonly string[] = READ_TAG_GROUPS.flatMap((group) => [...group.tags]);

/** 그 태그가 어느 축의 값인가. 어휘 밖이면 `null` — 영문 slug 나 오타를 화면에 세우지 않는다. */
export function axisOfTag(tag: string): ReadTagAxis | null {
  return READ_TAG_GROUPS.find((group) => group.tags.includes(tag))?.axis ?? null;
}
