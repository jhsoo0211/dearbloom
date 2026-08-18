'use server';

/**
 * 추천 제출 — 질문 5문항의 답을 받아 엔진을 돌리고 결과 화면이 쓸 값을 통째로 만든다.
 *
 * ── 이 파일에 남은 것 ────────────────────────────────────────────────
 * **서버에서만 할 수 있는 두 가지**뿐이다.
 *   ① `loadCatalog()` — `node:fs` 로 `content/*.csv` 를 읽는다.
 *   ② 멘트 생성 — 서버 전용 API 키로 LLM 을 한 번 부른다(`./messages.ts`).
 *
 * 나머지(모양 검사·엔진 호출·3안 조립·맥락 칩·인용·문학·공유 부호)는 전부 순수 함수라
 * `./build-result.ts` 로 옮겼다. 정적 드롭 데모가 **같은 함수**를 브라우저에서 부른다
 * (`src/lib/demo/recommend-actions.ts`) — 두 경로에서 다른 결과가 나오지 않게 하려면
 * 조립 코드가 한 벌이어야 한다.
 *
 * 멘트 조립(`buildToneViews`)도 2026-08-18 에 `./messages.ts` 로 나갔다. 스트리밍
 * 라우트 핸들러(`./stream/route.ts`)가 **같은 요청**을 만들어야 하는데, `'use server'`
 * 파일은 async 함수만 내보낼 수 있어 거기서 가져다 쓸 수가 없기 때문이다.
 *
 * 설계 판단
 *  - **개인 입력을 URL 에 싣지 않는다.** 결과는 서버 액션의 반환값으로만 건너가고,
 *    화면은 같은 페이지에서 상태만 바꾼다. 새로고침하면 질문 처음으로 돌아간다(MVP).
 *  - **모양 검사가 첫 줄이다.** 서버 액션은 공개 HTTP 엔드포인트라 `WizardSubmission`
 *    타입 주석은 아무것도 지켜 주지 않는다(컴파일이 끝나면 사라진다).
 */

import {
  ELEVENST_ENDPOINT,
  encodeKeyword,
  parseElevenstProducts,
  type KeywordEncoding,
} from '@/lib/buy/elevenst';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';
import { messageLengthSchema } from '@/lib/llm/contracts';
import type { MessageLength } from '@/lib/llm/contracts';
import type { BuyProduct, BuyProductsResponse } from '@/components/flow/buy-products';
import type {
  FlowResponse,
  ShareResponse,
  ToneView,
  WizardSubmission,
} from '@/components/flow/types';

import {
  GENERIC_FAILURE,
  SHARE_UNREADABLE,
  assemblePayload,
  buildShareView,
  parseSubmission,
  pinFirstPick,
  prepareResult,
} from './build-result';
import { readStoryCues } from './extract-cues';
import { buildToneViews } from './messages';

/* ------------------------------------------------------------------ *
 * 서버 액션
 * ------------------------------------------------------------------ */

/**
 * 질문 5문항 → 추천 결과.
 * 실패도 예외 대신 값으로 돌려준다(화면이 문장으로 보여 줄 수 있게).
 */
export async function submitRecommendation(
  submission: WizardSubmission,
): Promise<FlowResponse> {
  const received = parseSubmission(submission);
  if (!received.ok) return { ok: false, message: received.message };

  let catalog: Catalog;
  try {
    catalog = await loadCatalog();
  } catch (error) {
    console.error('[recommend] 콘텐츠를 읽지 못했습니다.', error);
    return { ok: false, message: GENERIC_FAILURE };
  }

  /*
   * §1.5j — 엔진보다 **앞에** 선다. 적어 준 글이 있으면 AI 가 우리 어휘로 읽어 주고,
   * 못 읽으면(키 없음·타임아웃·전 프로바이더 실패) `null` 이 와서 기존 사전 경로가 돈다.
   * 글이 없으면 부르지도 않으므로 이 줄의 비용은 0 이다.
   */
  const extracted = await readStoryCues(received.answers);

  const prepared = prepareResult(received.answers, catalog, extracted);
  if (!prepared.ok) return { ok: false, message: prepared.message };

  const tones = await buildToneViews(catalog, prepared.draft);
  return { ok: true, payload: assemblePayload(prepared.draft, tones) };
}

/**
 * 멘트만 다시 받아 온다 — 결과 화면의 `새로 받기` · `짧게/보통` (2026-08-18).
 *
 * 3안·이야기·꽃말은 그대로 두고 **멘트 3~4톤만** 갈아 끼운다. 그래서 반환도 톤 목록
 * 하나뿐이다(payload 전체를 다시 내려보내면 읽고 있던 이야기·색 선택이 통째로 초기화된다).
 *
 * ── 왜 답변(`submission`)을 다시 받나 ────────────────────────────────
 * 멘트 재료(자유 서술·상황 칩)는 **서버에 남아 있지 않다**(§1.5j — 로그·DB 어디에도
 * 남기지 않는다). 결과 payload 에도 싣지 않는다. 그러니 다시 쓰려면 그때 그 답을
 * 다시 받는 수밖에 없고, 그 답은 지금 그 탭의 화면이 들고 있다. 저장하지 않기로 한
 * 값을 다시 쓰는 유일하게 정직한 방법이다.
 *
 * ⚠ 사용자가 **고쳐 쓴 멘트는 여기로 오지 않는다.** 편집본은 화면 상태로만 살고
 *   어디에도(로그·저장소·다음 프롬프트) 흘리지 않는다 — 우리 문장을 고친 결과를
 *   다시 모델에 먹이면 그 편집이 다음 생성에 배어든다(에피소드 에코 방지와 같은 선례).
 *   이 액션이 받는 것은 처음의 답변과 길이뿐이다.
 *
 * 실패는 전부 `{ ok: false }` 다 — 화면은 지금 서 있는 멘트를 그대로 둔다.
 * 키가 없거나 예문 경로면 새로 받을 것이 없으므로 그것도 실패로 돌려준다.
 */
export async function regenerateMessages(
  submission: WizardSubmission,
  length: MessageLength,
  /**
   * 화면에 서 있는 3안의 꽃 id (2026-08-18).
   *
   * 이 값이 있으면 멘트가 **그 첫 안**을 이야기한다 — 여기서 3안을 다시 계산해 봐야
   * §1.5j 해석 층 때문에 화면과 어긋날 수 있고, 어긋난 멘트는 없는 꽃을 이야기한다.
   * 넘기지 않아도(구버전 화면·데모) 동작은 지금까지와 같다.
   */
  flowerIds?: string[],
): Promise<{ ok: true; tones: ToneView[] } | { ok: false }> {
  // 서버 액션은 공개 엔드포인트다 — 길이도 모양 검사를 통과해야 한다(위 머리말).
  const parsedLength = messageLengthSchema.safeParse(length);
  if (!parsedLength.success) return { ok: false };

  const received = parseSubmission(submission);
  if (!received.ok) return { ok: false };

  let catalog: Catalog;
  try {
    catalog = await loadCatalog();
  } catch (error) {
    console.error('[recommend] 콘텐츠를 읽지 못했습니다.', error);
    return { ok: false };
  }

  /*
   * ⚠ 이 경로는 **해석(§1.5j AI 층)을 부르지 않는다.**
   *
   * 잠깐 불렀던 적이 있다. 부르지 않으면 여기서 다시 계산한 첫 안이 화면과 어긋날 수
   * 있어서였는데, 그건 대가가 컸다 — 새로 받기 한 번마다 4초가 더 붙고, 해석이 흔들리면
   * 어차피 또 어긋난다. 답은 다시 읽는 것이 아니라 **화면이 아는 것을 넘겨받는 것**이다
   * (`pinFirstPick`). 그래서 여기는 사전 경로로만 조립하고 첫 안만 되돌린다.
   */
  const prepared = prepareResult(received.answers, catalog);
  if (!prepared.ok) return { ok: false };

  const draft = pinFirstPick(prepared.draft, catalog, flowerIds);
  const tones = await buildToneViews(catalog, draft, parsedLength.data);
  // 한 톤도 새로 못 썼으면(키 없음·타임아웃·전 프로바이더 실패) 예문이 그대로 돌아온 것이다.
  // 같은 문장을 "새로 받았다"며 내려보내지 않는다 — 화면이 아무 일도 없던 척할 수 있게.
  if (!tones.some((tone) => tone.source === 'llm')) return { ok: false };

  return { ok: true, tones };
}

/* ------------------------------------------------------------------ *
 * 공유 화면 `/r` (2026-08-18)
 * ------------------------------------------------------------------ */

/**
 * 공유 부호 → 읽기 전용 화면 값.
 *
 * 서버가 하는 일은 **카탈로그를 읽는 것 하나뿐이다**(`node:fs`). 해석·검증·조립은
 * 전부 `buildShareView` 라는 순수 함수가 하고, 정적 데모는 같은 함수를 브라우저에서
 * 부른다(`src/lib/demo/recommend-actions.ts`) — 두 곳에서 다른 화면이 나오지 않게.
 *
 * ⚠ 저장이 없다. 조회할 레코드도, 만료도, 지울 것도 없다 — 부호가 곧 데이터다
 *   (`share-link.ts` 머리말의 "방식 A: 저장 0").
 * ⚠ 부호는 **주소창에서 온 남의 문자열**이다. 어휘 검사는 `decodeSharePlan`(zod)이,
 *   꽃이 실재하는지는 `buildShareView` 가 본다. 여기서는 모양만 한 번 눌러 담는다.
 */
export async function describeShare(code: string): Promise<ShareResponse> {
  const received = typeof code === 'string' ? code : '';
  if (received === '') return { ok: false, message: SHARE_UNREADABLE };

  let catalog: Catalog;
  try {
    catalog = await loadCatalog();
  } catch (error) {
    console.error('[recommend] 콘텐츠를 읽지 못했습니다.', error);
    return { ok: false, message: GENERIC_FAILURE };
  }

  return buildShareView(received, catalog);
}

/* ------------------------------------------------------------------ *
 * 「사러 가기」 실상품 검색 (2026-08-17)
 * ------------------------------------------------------------------ */

/**
 * 문서(EUC-KR)와 현실이 다를 수 있어, 상품이 실제로 나온 인코딩을 한 번 알아내면
 * 프로세스가 사는 동안 기억한다 — 매 검색마다 두 번 묻지 않기 위해서다.
 */
let provenKeywordEncoding: KeywordEncoding | null = null;

async function fetchElevenstProducts(
  key: string,
  keyword: string,
  encoding: KeywordEncoding,
): Promise<BuyProduct[]> {
  const url =
    `${ELEVENST_ENDPOINT}?key=${encodeURIComponent(key)}` +
    `&apiCode=ProductSearch&keyword=${encodeKeyword(keyword, encoding)}&pageSize=20`;
  const response = await fetch(url, { signal: AbortSignal.timeout(4000), cache: 'no-store' });
  if (!response.ok) return [];
  // 응답은 EUC-KR XML 이다(실측). Node 공식 빌드는 full-icu 라 TextDecoder 가 받는다.
  const xml = new TextDecoder('euc-kr').decode(await response.arrayBuffer());
  return parseElevenstProducts(xml);
}

/**
 * 추천된 꽃 이름 → 지금 살 수 있는 상품 목록(상품명·가격·상품 페이지).
 *
 * 공급원은 11번가 오픈API 하나다 — 왜 그곳뿐인지는 `lib/buy/elevenst.ts` 머리말
 * (네이버 쇼핑 API 2026-08-01 종료 · 쿠팡은 수수료 링크라 무제휴 고지가 깨진다).
 * `ELEVENST_API_KEY` 가 없으면 **조용히 빈손**이다 — 화면(BuySheet)은 사이트 목록으로
 * 내려가고, 아무것도 죽지 않는다(멘트 키와 같은 규칙). 실패도 예외 대신 값으로 돌려준다.
 *
 * 검색어는 `{이름} 꽃다발` — 이름만 넣으면 엉뚱한 것이 섞이는 것을 우체국 검색에서
 * 실측한 그 원리다(`buy-links.ts`). 키를 받은 날 `node tests/partners/check-buy-api.mjs`
 * 로 실응답(태그 이름·keyword 인코딩)을 확인하라.
 */
export async function searchBuyProducts(flowerName: string): Promise<BuyProductsResponse> {
  const key = process.env.ELEVENST_API_KEY;
  if (!key) return { ok: false };

  // 서버 액션은 공개 엔드포인트다 — 타입 주석은 아무것도 지켜 주지 않는다(위 머리말).
  const name = typeof flowerName === 'string' ? flowerName.trim().slice(0, 40) : '';
  if (name === '') return { ok: false };
  const keyword = `${name} 꽃다발`;

  try {
    const first = provenKeywordEncoding ?? 'euc-kr';
    let products = await fetchElevenstProducts(key, keyword, first);
    if (products.length > 0) {
      provenKeywordEncoding = first;
      return { ok: true, products };
    }
    // 0건 — 검색어 인코딩이 어긋난 것일 수 있다. 아직 증명된 인코딩이 없으면 반대쪽으로 한 번 더.
    if (provenKeywordEncoding === null) {
      products = await fetchElevenstProducts(key, keyword, 'utf-8');
      if (products.length > 0) {
        provenKeywordEncoding = 'utf-8';
        return { ok: true, products };
      }
    }
    // 두 인코딩 다 0건 — 정말 없는 꽃일 수 있다. 빈 목록도 정상 값이다.
    return { ok: true, products: [] };
  } catch {
    console.error('[recommend] 상품 검색에 실패했습니다.');
    return { ok: false };
  }
}
