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
  SHARE_UNREADABLE,
  assemblePayload,
  buildShareView,
  buildTones,
  parseSubmission,
  prepareResult,
} from '@/app/recommend/build-result';
import type { MessageLength } from '@/lib/llm/contracts';
import type { BuyProductsResponse } from '@/components/flow/buy-products';
import type {
  FlowResponse,
  ShareResponse,
  ToneView,
  WizardSubmission,
} from '@/components/flow/types';

import { loadDemoCatalog } from './catalog';
import { demoVariantBody } from './message-variants';
import { sampleBuyProducts } from './sample-products';

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
  /*
   * `canReword` 는 **데모에서만** 켠다 — 아래 `regenerateMessages` 가 실제로 다른 문장을
   * 돌려주기 때문이다(손으로 쓴 변주 한 벌이 `message-variants.ts` 에 있다).
   * 본배포의 예문 폴백에는 그 변주가 없어서 버튼을 세우지 않는다(그쪽은 지금 그대로다).
   */
  return { ok: true, payload: { ...assemblePayload(prepared.draft, tones), canReword: true } };
}

/**
 * 몇 번째로 갈아 끼우는가. **모듈 스코프의 결정적 회전**이다.
 *
 * 난수를 쓰지 않는 이유는 데모를 보여 주는 사람 쪽에 있다 — 같은 순서로 누르면 같은
 * 문장이 나와야 시연을 되풀이할 수 있고, 스크린샷 검수도 가능해진다.
 * 탭을 새로 고치면 0 으로 돌아간다(그것도 예측 가능한 동작이다).
 */
let rewordRound = 0;

/**
 * 멘트만 다시 받기 — **데모에서도 실제로 돈다** (2026-08-18).
 *
 * ── 무엇이 바뀌었나 ──────────────────────────────────────────────────
 * 예전에는 언제나 빈손이었고, 화면은 그래서 길이·새로 받기 버튼을 아예 세우지 않았다.
 * 사용자 확정("모든 기능이 제대로 작동하는 것처럼 보여야 해")으로 기준이 "안 깨짐"에서
 * "실동작"으로 올라갔고, 그래서 데모 전용 예문 변주 한 벌을 갖췄다
 * (`./message-variants.ts` — 원장 `templates.csv` 는 손대지 않았다).
 *
 * ⚠ **LLM 금지선은 그대로다.** 여기서도 모델을 부르지 않는다. 바뀐 것은 "고를 문장이
 *   한 벌뿐이라 고를 수 없다" 는 사정이지 "브라우저에 키를 심는다" 가 아니다.
 * ⚠ 톤의 `source` 는 계속 `template` 이다 — 화면의 "당신의 이야기를 담아 썼어요" 배지가
 *   데모에서 서면 그건 거짓말이 된다. 각주도 예문 문구 그대로 남는다.
 *
 * 회전 규칙(`demoVariantBody`)
 *   · `short`  — 손으로 쓴 두 벌을 오간다.
 *   · `medium` — 원장의 문장 ↔ 손으로 쓴 다른 한 벌.
 * 변주가 없는 조합은 그 톤만 지금 문장을 그대로 둔다(없는 문장을 지어내지 않는다).
 */
export async function regenerateMessages(
  submission: WizardSubmission,
  length: MessageLength,
  /**
   * 화면의 3안 꽃 id — 원본(`actions.ts`)이 멘트의 첫 안을 되돌리는 데 쓰는 값이다.
   * **데모는 쓰지 않는다.** 여기 멘트는 상황·톤으로만 고르는 예문이라(꽃 이름이 문장에
   * 들어가지 않는다) 되돌릴 첫 안이라는 것이 없다. 그래도 인자는 받는다 — 이 파일은
   * 원본과 시그니처가 한 글자도 달라선 안 되는 쌍둥이다(머리말).
   */
  flowerIds?: string[],
): Promise<{ ok: true; tones: ToneView[] } | { ok: false }> {
  // 받기만 하고 쓰지 않는다(위 주석). 읽어 두어야 "빠뜨린 것" 이 아님이 드러난다.
  void flowerIds;

  const received = parseSubmission(submission);
  if (!received.ok) return { ok: false };

  let catalog;
  try {
    catalog = await loadDemoCatalog();
  } catch {
    console.error('[recommend] 콘텐츠 번들을 읽지 못했습니다.');
    return { ok: false };
  }

  const prepared = prepareResult(received.answers, catalog);
  if (!prepared.ok) return { ok: false };

  const { intent, relationship } = prepared.draft;
  const base = buildTones(catalog, intent, relationship);
  rewordRound += 1;

  const tones = base.map((tone) => {
    const body = demoVariantBody(intent, tone.key, length, rewordRound);
    if (body === undefined) return tone;
    const next: ToneView = { ...tone, body, source: 'template' };
    delete next.emptyNote;
    return next;
  });

  /*
   * 갈아 끼울 것이 있는 조합인가.
   *
   * ⚠ "이번 반환이 원장과 다른가" 로 재면 안 된다 — `medium` 의 짝수 번째는 **원장으로
   *   되돌아오는 차례**라 원장과 같아지는데, 그것도 화면에서는 문장이 바뀐 것이다
   *   (직전에 서 있던 것은 변주였다). 그 자리에서 실패를 돌려주면 화면이 "새로 써 오지
   *   못했어요" 라고 거짓말을 한다. 그래서 **회전이 성립하는지**만 본다.
   */
  const rotatable = base.some((tone) => demoVariantBody(intent, tone.key, 'short', 0) !== undefined);
  return rotatable ? { ok: true, tones } : { ok: false };
}

/**
 * 공유 부호 → 읽기 전용 화면 값 — **데모에서도 그대로 돈다.**
 *
 * 위 두 함수와 달리 여기는 빈손이 아니다. 공유는 서버에 아무것도 저장하지 않는 방식이라
 * (`share-link.ts` 의 "방식 A") 필요한 것은 **부호 한 줄과 카탈로그**뿐이고, 둘 다 브라우저에
 * 있다. 서버 전용 자원(API 키·DB)이 끼지 않으므로 데모에서 못 할 이유가 없다 —
 * 오히려 서버가 없는 자리에서도 링크가 열린다는 것이 이 설계의 값어치다.
 *
 * 해석·검증·조립은 서버판과 **같은 함수**가 한다(`buildShareView`). 다른 것은
 * 카탈로그를 어디서 읽어 오는지 하나뿐이다.
 */
export async function describeShare(code: string): Promise<ShareResponse> {
  const received = typeof code === 'string' ? code : '';
  if (received === '') return { ok: false, message: SHARE_UNREADABLE };

  let catalog;
  try {
    catalog = await loadDemoCatalog();
  } catch {
    console.error('[recommend] 콘텐츠 번들을 읽지 못했습니다.');
    return { ok: false, message: GENERIC_FAILURE };
  }

  return buildShareView(received, catalog);
}

/**
 * 「사러 가기」 상품 목록 — 데모는 **예시 한 벌을 세운다** (2026-08-18).
 *
 * ── 무엇이 바뀌었나 ──────────────────────────────────────────────────
 * 예전에는 언제나 빈손이었다. 상품 검색은 서버 전용 키를 요구하고 서버가 없는 드롭
 * 데모에서 그 키를 둘 자리는 브라우저뿐이라(멘트 LLM 과 같은 금지선) 부를 수 없었기
 * 때문이다. 그런데 지금은 **본배포에도 공급원이 없다** — 11번가는 셀러 전용으로 바뀌었고
 * 네이버 쇼핑 API 는 끝났으며 쿠팡 파트너스는 수수료 링크라 「제휴 아님」 고지와 충돌한다
 * (`.env.example` 에 기록). 그래서 그 칸은 어디서도 서 본 적이 없고, 데모를 보는 사람에게는
 * 그 기능이 아예 없는 것으로 읽혔다. 사용자 확정("모든 기능이 작동하는 것처럼")에 따라
 * §1.5s ⑤ 의 예문 변주와 같은 처방을 쓴다 — **예시를 세우되 예시라고 말한다.**
 *
 * ⚠ **금지선은 그대로다.** 여기서도 바깥 API 를 부르지 않는다(키 없음). 바뀐 것은
 *   "보여 줄 목록이 하나도 없다" 는 사정이지 "브라우저에 키를 심는다" 가 아니다.
 * ⚠ `sample: true` 를 **반드시** 함께 돌려준다. 그 한 칸이 화면에 예시 고지를 세우고
 *   행의 목적지를 판매처 쪽으로 돌린다(계약은 `buy-products.ts` 머리말).
 * ⚠ 본배포 쌍둥이(`app/recommend/actions.ts`)는 이 파일을 부르지 않는다 —
 *   실서비스에 예시 상품은 안 된다. 그쪽은 키가 없으면 지금처럼 `{ ok: false }` 다.
 *
 * 이름 인자는 원본과 같은 자리다. 원본은 검색어로 쓰고 여기서는 상품명·판매처 주소를
 * 세우는 데 쓴다 — 시그니처는 한 글자도 다르지 않다(이 파일은 쌍둥이다 — 머리말).
 */
export async function searchBuyProducts(flowerName: string): Promise<BuyProductsResponse> {
  const products = sampleBuyProducts(typeof flowerName === 'string' ? flowerName : '');
  // 이름을 못 읽으면 예시도 세우지 않는다 — 빈손이면 화면은 사이트 목록으로 내려간다.
  if (products.length === 0) return { ok: false };
  return { ok: true, products, sample: true };
}
