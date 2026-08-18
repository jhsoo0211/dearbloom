/**
 * 「이 결과 건네주기」 링크의 부호 — **서버에 아무것도 저장하지 않는 공유** (2026-08-18).
 *
 * ── 방식 A: 저장 0 ───────────────────────────────────────────────────
 * 링크를 만들 때 우리는 아무것도 쓰지 않는다. 받는 사람이 그 링크를 열면 주소에 실린
 * 값만으로 화면을 다시 세운다. 결과를 DB 에 넣고 짧은 코드를 나눠 주는 흔한 방식을
 * 택하지 않은 이유는 §1.5j 의 후퇴 금지선이다 — **저장하지 않기로 한 것을 공유를
 * 핑계로 저장하지 않는다.** 만료·삭제·유출을 걱정할 것이 애초에 생기지 않는다.
 *
 * ── 링크에 싣는 것 / 절대 싣지 않는 것 ───────────────────────────────
 * 싣는 것은 넷뿐이다: **3안의 꽃 id · 관계 · 마음 · 날짜.** 넷 다 우리 어휘이거나
 * 카탈로그의 id 라, 주소창·리퍼러·남의 채팅방에 남아도 그 사람에 대해 아무것도
 * 말하지 않는다.
 *
 * 싣지 않는 것:
 *   · **자유 서술 2필드**(수신자 메모 · 에피소드) — 링크는 남에게 건네지는 물건이다.
 *     원문이 실리면 그 순간이 곧 유출이고, 되돌릴 방법이 없다.
 *   · **멘트 본문** — LLM 산출물이고, 받는 사람의 것이 아니다(보내는 사람이 고쳐 쓸
 *     문장을 미리 보여 줄 이유도 없다).
 *   · **`직접 쓸게요` 한 줄들** — 관계·마음이 `other` 면 slug `other` 만 싣는다.
 *     그 한 줄 자체가 자유 서술이다.
 *   · 이름·연락처·예산·특징 칩 — 전부.
 *
 * ── 왜 압축하지 않는가 ───────────────────────────────────────────────
 * 실을 것이 id 3개와 어휘 2개뿐이라 압축 없이도 짧다(`tests/flow/share-link.test.ts` 가
 * 카탈로그 전종으로 250자 안을 지킨다). 압축을 얹으면 라이브러리가 하나 늘고, 사람이
 * 눈으로 읽어 무엇이 실렸는지 확인할 수 없게 된다 — 무저장 공유에서 그 투명함은 값이 있다.
 *
 * ── 디코딩은 **남이 준 문자열을 읽는 일**이다 ────────────────────────
 * 코드는 주소창에 있고 누구나 고칠 수 있다. 그래서 `decodeSharePlan` 은 zod 로 어휘까지
 * 본다(관계 7종 · 마음 8종 · id 모양 · 날짜 모양). 꽃 id 가 **실재하는지**는 카탈로그를
 * 아는 쪽이 마지막에 한 번 더 본다(`buildShareView`) — 여기서는 카탈로그를 모른다.
 */

import { z } from 'zod';

import { intentSchema, relationshipSchema } from '@/lib/engine/normalize';

/** 공유 주소의 쿼리 이름 — `/r?c=…`. */
export const SHARE_PARAM = 'c';

/** 공유 화면의 경로. 링크를 만드는 쪽과 읽는 쪽이 같은 상수를 쓴다. */
export const SHARE_PATH = '/r';

/**
 * 부호의 판.
 *
 * 지금은 1 하나뿐이다. 그래도 자리를 만들어 두는 이유: 나중에 싣는 값이 바뀌면
 * **옛 링크를 조용히 잘못 읽는 것**이 가장 나쁜 결과다. 판이 다르면 아예 안내 화면으로
 * 떨어지는 편이 낫다.
 */
export const SHARE_VERSION = 1;

/** 링크가 실어 나르는 전부. 이 인터페이스에 없는 값은 링크에 실리지 않는다. */
export interface SharePlan {
  /** 3안의 꽃 id(추천 순서 그대로). */
  flowerIds: string[];
  /** 엔진 어휘 그대로. `other` 면 사용자가 적은 한 줄은 **빠져 있다**. */
  relationship: string;
  intent: string;
  /** `YYYY-MM-DD`. 고르지 않았으면 없다. */
  dateISO?: string;
}

/** 꽃 id 한 칸의 모양. 카탈로그의 id 는 전부 소문자·숫자·하이픈이다. */
const flowerIdSchema = z.string().regex(/^[a-z0-9-]{1,40}$/);

/**
 * 부호 안쪽의 모양. 키를 한 글자로 줄인 것은 250자 예산 때문이고,
 * 그 대응은 아래 `encodeSharePlan` · `decodeSharePlan` 두 곳에만 있다.
 */
const sharePlanSchema = z.object({
  v: z.literal(SHARE_VERSION),
  f: z.array(flowerIdSchema).min(1).max(3),
  r: relationshipSchema,
  i: intentSchema,
  d: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/* ------------------------------------------------------------------ *
 * base64url — 브라우저·Node 양쪽에서 같은 함수로 돈다
 * ------------------------------------------------------------------ */

/**
 * `btoa`/`atob` 는 latin1 만 받는다. 우리 값은 전부 ASCII 지만(id·slug·날짜) 그것에
 * 기대지 않고 UTF-8 로 한 번 옮긴 뒤 태운다 — 어휘가 늘어 한글이 섞여도 깨지지 않게.
 */
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string | null {
  // 우리가 만든 부호의 글자는 이 넷뿐이다. 아니면 읽어 볼 것도 없다.
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return null;
  const padded = code.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * 공개 함수
 * ------------------------------------------------------------------ */

/** 결과 한 벌 → 링크에 실을 부호. */
export function encodeSharePlan(plan: SharePlan): string {
  const body: Record<string, unknown> = {
    v: SHARE_VERSION,
    f: plan.flowerIds.slice(0, 3),
    r: plan.relationship,
    i: plan.intent,
  };
  if (plan.dateISO !== undefined && plan.dateISO !== '') body.d = plan.dateISO;
  return toBase64Url(JSON.stringify(body));
}

/**
 * 부호 → 결과 한 벌. **읽지 못하면 `null`** 이고, 화면은 안내로 떨어진다.
 *
 * 던지지 않는 이유: 이 함수의 입력은 언제나 남이 고칠 수 있는 문자열이라 "잘못된 값"이
 * 예외 상황이 아니라 정상 경로다. 그리고 zod 의 오류 객체에는 받은 값이 섞여 있어
 * 그대로 위로 던지면 로그에 남을 자리가 생긴다.
 */
export function decodeSharePlan(code: string): SharePlan | null {
  if (typeof code !== 'string' || code === '' || code.length > 400) return null;

  const json = fromBase64Url(code);
  if (json === null) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }

  const parsed = sharePlanSchema.safeParse(raw);
  if (!parsed.success) return null;

  const plan: SharePlan = {
    // 같은 꽃을 두 번 실은 링크도 남이 만들 수 있다 — 화면에 두 번 세우지 않는다.
    flowerIds: [...new Set(parsed.data.f)],
    relationship: parsed.data.r,
    intent: parsed.data.i,
  };
  if (parsed.data.d !== undefined) plan.dateISO = parsed.data.d;
  return plan;
}

/**
 * 건네줄 주소 한 줄.
 *
 * `origin` 을 인자로 받는 이유: 배포 도메인이 아직 없어 `SITE_URL` 은 빌드 시점의
 * `localhost` 로 굳는다(`src/lib/site.ts` 의 선례 — 가짜 도메인을 상수로 박지 않는다).
 * 사람이 손에 쥐고 남에게 건넬 주소는 **지금 그 사람이 보고 있는 주소**여야 하므로,
 * 화면이 `location.origin` 을 넘긴다.
 */
export function shareUrl(origin: string, code: string): string {
  return `${origin.replace(/\/+$/, '')}${SHARE_PATH}?${SHARE_PARAM}=${code}`;
}

/** 주소의 쿼리에서 부호를 꺼낸다(`?c=…`). 없으면 빈 문자열. */
export function shareCodeFromSearch(search: string): string {
  try {
    return new URLSearchParams(search).get(SHARE_PARAM) ?? '';
  } catch {
    return '';
  }
}
