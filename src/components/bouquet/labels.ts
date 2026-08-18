/**
 * `/bouquet` 이 화면에 쓰는 표기 몇 가지 — **클라이언트로 건너가는 값**이다.
 *
 * ── 왜 `components/flow/labels.ts` 를 쓰지 않나 ──────────────────────
 * 그 파일이 이 프로젝트의 표기 사전 원본이 맞다. 다만 그쪽은 머리말이 못 박아 둔 대로
 * **서버 전용**이다 — 엔진 배럴(`@/lib/engine`)을 값으로 import 하고, 그 배럴이 zod 를
 * 끌고 온다. 이 화면의 판정은 브라우저에서 도므로(서버 액션 없음) 그 무게를 첫 화면에
 * 얹을 수 없다.
 *
 * 그래서 **꼭 필요한 표기만** 여기 한 벌 둔다. 베낀 것이 아니라 같은 사실을 두 자리가
 * 각자 아는 상태이고, 어긋나지 못하게 `tests/components/bouquet-labels.test.ts` 가 원본과
 * 맞대어 본다(`flowers/buy-name.ts` 가 같은 처지에서 같은 방법을 쓴다).
 * ⚠ 늘리지 마라. 한 줄 더할 때마다 원본과 갈릴 자리가 하나씩 는다 —
 *   합칠 자리가 생기면 zod 없는 표기 전용 모듈을 `src/lib` 로 올리는 것이 맞다.
 */

/** 꽃말 신뢰 등급 — `flow/labels.ts` 의 `CONFIDENCE_LABELS` 와 **같은 문장**이어야 한다. */
export const MEANING_CONFIDENCE_KO: Record<'repeated' | 'varies' | 'single_source', string> = {
  repeated: '오래, 두루 전해지는 꽃말',
  varies: '시대마다 조금씩 다르게 전해져요',
  single_source: '드물게 전해지는 이야기예요',
};

/** 반려동물 표기 — 엔진(`exclude.ts` · `group.ts` · `bouquet.ts`)과 같은 말. */
export const SPECIES_KO: Record<'cat' | 'dog', string> = {
  cat: '고양이',
  dog: '강아지',
};
