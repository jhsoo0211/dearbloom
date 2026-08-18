/**
 * `POST /recommend/stream` — 결과를 먼저 보내고, 멘트를 **흘려보낸다** (2026-08-18).
 *
 * ── 왜 서버 액션이 아니라 라우트 핸들러인가 ──────────────────────────
 * 사용자 신고: "멘트가 2.4~3.1초 뒤에 한꺼번에 나타난다." 원인은 구조다 —
 * `submitRecommendation` 은 LLM 이 끝나야 반환하므로, 화면은 그동안 아무것도 못 세운다.
 * 서버 액션의 반환값은 한 번에 건너가는 값이라 "조금씩" 이 성립하지 않는다.
 * 라우트 핸들러는 `ReadableStream` 을 그대로 돌려줄 수 있어 그 자리에 맞는다.
 *
 * ── 프로토콜: NDJSON (줄 하나 = JSON 하나) ───────────────────────────
 *   {"kind":"result","payload":…,"pending":true}  결과 한 벌. **멘트는 아직 예문**이다.
 *   {"kind":"draft","tones":{…}}                  흘러나오는 글자(표시용).
 *   {"kind":"tones","tones":[…],"messageSource":…,"messageNote":…}  검증을 통과한 확정.
 *   {"kind":"settled"}                            새로 쓴 문장이 없다 — 예문이 그대로 선다.
 *   {"kind":"error","message":"…"}                결과 자체를 못 만들었다.
 * SSE 가 아니라 NDJSON 인 이유: 우리는 이벤트 이름도 재접속(`Last-Event-ID`)도 쓰지 않는데
 * SSE 는 그 규약을 지키느라 프레이밍이 는다. 줄 하나에 JSON 하나면 충분하다.
 *
 * ── 지켜야 하는 경계 ─────────────────────────────────────────────────
 *  · **`draft` 는 절대 `ToneView.body` 가 되지 않는다.** 확정은 스트림 끝에서 계약(zod)을
 *    통과한 값으로만 일어난다(`buildToneViews` → `generateResponseSchemaFor`).
 *  · **폴백 체인은 손대지 않는다.** gemini→claude→clova→nvidia 도, 재시도 규칙도 그대로다.
 *    스트리밍이 안 되는 프로바이더는 지금처럼 한 번에 오고, 그때는 `draft` 가 안 나갈 뿐이다.
 *  · **원문은 로그로 가지 않는다**(§1.5j). 실패는 짧은 사유만 찍는다.
 *
 * ── 정적 데모(`output: 'export'`)에서는 이 라우트가 **없다** ──────────
 * Next 는 export 빌드에서 POST 라우트 핸들러를 산출물에 넣지 않는다(2026-08-18 실측:
 * 빌드는 exit 0 이고 라우트 목록에서 빠진다). 화면은 그 사실을 알고 애초에 부르지 않는다
 * (`RecommendFlow` 의 `STATIC_DEMO` 분기) — 데모의 멘트는 언제나 예문이라 흘릴 것도 없다.
 */

import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog } from '@/lib/data/types';
import { messageLengthSchema } from '@/lib/llm/contracts';
import { readPartialTones } from '@/lib/llm/partial';
import type { ToneView, WizardSubmission } from '@/components/flow/types';

import {
  GENERIC_FAILURE,
  assemblePayload,
  buildTones,
  messageStateOf,
  parseSubmission,
  pinFirstPick,
  prepareResult,
} from '../build-result';
import { readStoryCues } from '../extract-cues';
import { buildToneViews } from '../messages';

/*
 * ⚠ `export const dynamic = 'force-dynamic'` 를 **쓰지 마라.**
 *
 * POST 라우트는 어차피 요청 시점에만 돈다(Next 가 그렇게 다룬다). 그런데 그 한 줄을
 * 붙이면 정적 export 빌드가 그 자리에서 죽는다 — 2026-08-18 실측:
 *   `Error: export const dynamic = "force-dynamic" on page "/recommend/stream"
 *    cannot be used with "output: export"`
 * 그 줄이 없으면 export 빌드는 이 라우트를 **조용히 빼고** exit 0 으로 끝난다(같은 실측).
 * 즉 지금 이 파일은 본배포에서 동적으로 돌고 데모에서는 없는 셈이 되는데, 그것이
 * 바라는 바다(데모 멘트는 언제나 예문이다).
 */

/**
 * 조각을 내보내는 최소 간격(ms).
 *
 * 토큰 하나마다 줄을 하나씩 내보내면 3톤 한 벌에 수백 줄이 되고, 받는 쪽은 그때마다
 * 리액트 상태를 갈아 끼운다. 사람 눈에는 어차피 이어져 보이는 간격이라 여기서 묶는다.
 * 마지막 조각은 간격과 무관하게 반드시 나간다(아래 `flush`).
 */
const DRAFT_INTERVAL_MS = 70;

/** 스트림에 실어 보내는 톤 조각 — 톤 어휘로 짝을 짓는다(도착 순서를 가정하지 않는다). */
type DraftMap = Record<string, { headline?: string; body?: string }>;

function draftsOf(raw: string): DraftMap {
  const drafts: DraftMap = {};
  for (const part of readPartialTones(raw)) {
    const entry: { headline?: string; body?: string } = {};
    if (part.headline !== undefined) entry.headline = part.headline;
    if (part.message !== undefined) entry.body = part.message;
    if (entry.headline !== undefined || entry.body !== undefined) drafts[part.tone] = entry;
  }
  return drafts;
}

export async function POST(request: Request): Promise<Response> {
  /*
   * 라우트 핸들러도 공개 HTTP 엔드포인트다 — 서버 액션과 같은 문을 통과시킨다.
   * ⚠ 파싱 오류를 그대로 찍지 않는다(본문에 자유 서술이 들어 있다).
   */
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: GENERIC_FAILURE }, { status: 400 });
  }

  const received = body as {
    submission?: WizardSubmission;
    length?: unknown;
    /**
     * 참이면 첫 줄(`result`)을 보내지 않는다 — 결과 화면의 `새로 받기` · `짧게/보통` 이
     * 쓰는 문이다. 그 자리에서는 3안·이야기·색 선택이 이미 서 있고 바뀌는 것은 멘트뿐이라,
     * 결과를 다시 내려보내면 읽고 있던 화면이 통째로 초기화된다
     * (`regenerateMessages` 가 톤만 돌려주는 것과 같은 판단).
     */
    messagesOnly?: unknown;
    /**
     * 화면에 서 있는 3안의 꽃 id — `messagesOnly` 일 때만 쓴다 (2026-08-18).
     * 여기서 3안을 다시 계산하면 §1.5j 해석 층 때문에 화면과 어긋날 수 있어서,
     * 다시 읽는 대신 화면이 아는 것을 받는다(`pinFirstPick` 머리말).
     */
    flowerIds?: unknown;
  };
  const parsedLength = messageLengthSchema.safeParse(received.length ?? 'medium');
  const parsed = parseSubmission((received.submission ?? {}) as WizardSubmission);
  if (!parsedLength.success || !parsed.ok) {
    return Response.json({ ok: false, message: GENERIC_FAILURE }, { status: 400 });
  }
  const messagesOnly = received.messagesOnly === true;

  let catalog: Catalog;
  try {
    catalog = await loadCatalog();
  } catch (error) {
    console.error('[recommend] 콘텐츠를 읽지 못했습니다.', error);
    return Response.json({ ok: false, message: GENERIC_FAILURE }, { status: 500 });
  }

  /*
   * §1.5j AI 해석 층 — **첫 줄(`result`)보다 앞에 선다.**
   *
   * 이 대기는 스트리밍으로 감출 수 없다. 첫 줄에 실어 보낼 3안 자체가 해석 결과에 따라
   * 달라지므로, 해석이 끝나기 전에는 보낼 것이 없다. 그래서 예산이 멘트의 10초가 아니라
   * 4초다(`EXTRACT_TIMEOUT_MS`) — 여기서 쓰는 시간은 사용자가 빈 화면을 보는 시간이다.
   * 적어 준 글이 없으면 부르지 않으므로 그때는 지금까지와 똑같이 즉시 첫 줄이 나간다.
   *
   * ⚠ **`messagesOnly` 면 부르지 않는다.** 그 자리는 3안이 이미 화면에 서 있고 바뀌는
   *   것은 멘트뿐이라, 다시 읽어 봐야 4초만 쓰고 어긋날 위험만 는다. 대신 화면이 보내 준
   *   꽃 id 로 첫 안을 되돌린다(아래 `pinFirstPick`).
   */
  const extracted = messagesOnly ? null : await readStoryCues(parsed.answers);

  const prepared = prepareResult(parsed.answers, catalog, extracted);
  if (!prepared.ok) {
    return Response.json({ ok: false, message: prepared.message }, { status: 200 });
  }

  const draft = messagesOnly
    ? pinFirstPick(prepared.draft, catalog, received.flowerIds)
    : prepared.draft;
  // 멘트를 뺀 결과는 지금 당장 보낼 수 있다 — 화면은 이것으로 먼저 선다.
  const firstPayload = messagesOnly
    ? null
    : assemblePayload(draft, buildTones(catalog, draft.intent, draft.relationship));

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (line: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(line)}\n`));
        } catch {
          // 받는 쪽이 먼저 끊었다(탭을 닫았다·다시 골라보기를 눌렀다). 조용히 그만둔다.
          closed = true;
        }
      };

      /*
       * 첫 줄은 **결과 한 벌**이다. `pending: true` 가 "멘트는 아직 오는 중" 이라는 뜻이고,
       * 화면은 그동안 예문 각주("미리 적어 둔 예문이에요")를 세우지 않는다 —
       * 곧 바뀔 문장을 두고 그렇게 말하면 그 각주가 거짓이 된다.
       */
      if (!messagesOnly) send({ kind: 'result', payload: firstPayload, pending: true });

      let lastSentAt = 0;
      let lastJson = '';
      const flush = (raw: string, force: boolean) => {
        const now = Date.now();
        if (!force && now - lastSentAt < DRAFT_INTERVAL_MS) return;
        const drafts = draftsOf(raw);
        const json = JSON.stringify(drafts);
        if (json === lastJson || json === '{}') return;
        lastJson = json;
        lastSentAt = now;
        send({ kind: 'draft', tones: drafts });
      };

      let tones: ToneView[];
      try {
        tones = await buildToneViews(catalog, draft, parsedLength.data, (raw) => flush(raw, false));
      } catch {
        console.error('[recommend] 멘트 스트리밍이 실패했습니다. (내용은 남기지 않습니다)');
        send({ kind: 'settled' });
        controller.close();
        return;
      }

      /*
       * 확정. 한 톤이라도 새로 쓴 문장이 있으면 그것으로 갈아 끼우고, 하나도 없으면
       * `settled` 다 — 화면은 이미 서 있는 예문을 그대로 두고 각주만 제자리로 돌린다.
       * (모든 프로바이더가 실패했거나 키가 없는 경우이고, 폴백 체인은 그대로 돌았다.)
       */
      if (tones.some((tone) => tone.source === 'llm')) {
        send({ kind: 'tones', tones, ...messageStateOf(tones) });
      } else {
        send({ kind: 'settled' });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      // 프록시가 통째로 모았다가 한 번에 내보내면 스트리밍이 아무 소용이 없다.
      'x-accel-buffering': 'no',
    },
  });
}
