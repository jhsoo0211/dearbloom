/**
 * 정적 데모의 추천 — `app/recommend/actions.ts` 자리에 서는 브라우저용 한 벌.
 *
 * 빌드 설정(`next.config.ts`)이 `NEXT_PUBLIC_STATIC_DEMO=1` 일 때
 * `@/app/recommend/actions` 를 **이 파일로 바꿔치기한다**(turbopack `resolveAlias`).
 * 그래서 내보내는 이름과 시그니처가 원본과 한 글자도 다르면 안 된다.
 *
 * ── 서버판과 다른 점은 정확히 두 가지다 ──────────────────────────────
 *   ① 콘텐츠를 CSV 가 아니라 빌드 때 굳혀 둔 번들에서 읽는다(`loadDemoCatalog`).
 *   ② 멘트가 **언제나 준비된 예문**이다 — LLM 을 부르지 않는다.
 *
 * ②는 타협이 아니라 금지선이다. 브라우저에서 모델을 부르려면 키를 브라우저에 심어야
 * 하고, 그 순간 키는 공개된다. 드롭 데모는 서버가 없는 자리이므로 **키가 없는 쪽**을
 * 택한다 — 화면은 `messageSource: 'template'` 각주로 그 사실을 그대로 말한다
 * ("지금 보이는 멘트는 미리 적어 둔 예문이에요").
 *
 * 3안 선정·꽃말·이야기·문학·반려동물·맥락 칩은 서버판과 **같은 함수**가 만든다
 * (`app/recommend/build-result.ts`). 데모라고 다른 꽃이 나오지 않는다.
 */

import {
  GENERIC_FAILURE,
  assemblePayload,
  buildTones,
  parseSubmission,
  prepareResult,
} from '@/app/recommend/build-result';
import type { BuyProductsResponse } from '@/components/flow/buy-products';
import type { FlowResponse, ToneView, WizardSubmission } from '@/components/flow/types';

import { loadDemoCatalog } from './catalog';

/** 질문 5문항 → 추천 결과. 실패도 예외 대신 값으로 돌려준다(원본과 같은 규칙). */
export async function submitRecommendation(
  submission: WizardSubmission,
): Promise<FlowResponse> {
  const received = parseSubmission(submission);
  if (!received.ok) return { ok: false, message: received.message };

  let catalog;
  try {
    catalog = await loadDemoCatalog();
  } catch {
    // 청크를 못 받는 경우(네트워크가 끊겼다)뿐이다 — 원본의 "콘텐츠를 읽지 못했다"와 같은 자리다.
    console.error('[recommend] 콘텐츠 번들을 읽지 못했습니다.');
    return { ok: false, message: GENERIC_FAILURE };
  }

  const prepared = prepareResult(received.answers, catalog);
  if (!prepared.ok) return { ok: false, message: prepared.message };

  const tones = buildTones(catalog, prepared.draft.intent, prepared.draft.relationship);
  return { ok: true, payload: assemblePayload(prepared.draft, tones) };
}

/**
 * 멘트만 다시 받기 — 데모에서는 **언제나 빈손**이다.
 *
 * 위 `submitRecommendation` 이 LLM 을 부르지 않는 것과 같은 금지선이다. 새로 쓸 곳이
 * 없으니 새로 받을 것도 없다. 화면은 이 빈손을 받으면 지금 서 있는 예문을 그대로 두고,
 * 애초에 `새로 받기` · `짧게/보통` 버튼 자체를 세우지 않는다(예문 경로에는 고를 여지가
 * 없다 — `templates.csv` 는 조합마다 행이 하나뿐이다).
 */
export async function regenerateMessages(): Promise<
  { ok: true; tones: ToneView[] } | { ok: false }
> {
  return { ok: false };
}

/**
 * 「사러 가기」 실상품 검색 — 데모에서는 **언제나 빈손**이다.
 *
 * 상품 검색(11번가 오픈API)은 서버 전용 키를 요구하고, 서버가 없는 드롭 데모에서
 * 그 키를 둘 자리는 브라우저뿐이다 — 멘트 LLM 과 같은 금지선이라 부르지 않는다.
 * 화면(BuySheet)은 이 빈손을 받으면 사이트 목록으로 조용히 내려간다.
 */
export async function searchBuyProducts(): Promise<BuyProductsResponse> {
  return { ok: false };
}
