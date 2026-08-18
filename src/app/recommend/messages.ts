/**
 * 멘트 조립 — **서버 전용, 그러나 서버 액션은 아니다.**
 *
 * ── 왜 `actions.ts` 에서 떨어져 나왔나 (2026-08-18) ───────────────────
 * 이 코드는 원래 `actions.ts` 안에 있었다. 멘트 스트리밍(라우트 핸들러
 * `recommend/stream/route.ts`)이 생기면서 **같은 요청을 만들어야 하는 곳이 둘**이 됐는데,
 * `'use server'` 파일은 async 함수만 내보낼 수 있어서 라우트가 거기서 가져다 쓸 수가 없다.
 * 한 벌을 복사해 두면 두 경로의 프롬프트가 반드시 어긋난다 — 안전 차단선(`isBlockedForGeneration`)
 * 과 절대 규칙(`generationRules`)이 걸린 자리라 그 어긋남은 조용히 위험해진다.
 * 그래서 서버 전용 순수 조립만 여기로 옮기고, 액션과 라우트가 함께 부른다.
 *
 * ⚠ 이 파일은 **브라우저로 가지 않는다**(LLM 프로바이더·API 키를 끌어온다).
 *   정적 데모는 이 파일을 아예 부르지 않는다 — 그쪽 멘트는 언제나 예문이다.
 */

import type { Catalog } from '@/lib/data/types';
import type { Intent, RecoResult, Tone } from '@/lib/engine';
import { RESPONSE_TONE_COUNT } from '@/lib/llm/contracts';
import type { GenerateRequest, MessageLength } from '@/lib/llm/contracts';
import { generateMessages, type PartialSink } from '@/lib/llm/provider';
import { isBlockedForGeneration } from '@/lib/llm/safety';
import type { ToneView } from '@/components/flow/types';

import { buildTones, type ResultDraft } from './build-result';

/**
 * LLM 에 넘길 꽃 정보 — **출처 id 가 있는 꽃말만** 싣는다(계약의 `meaning_source_id` 는 필수다).
 * 제안한 색의 꽃말을 먼저 보고, 없으면 그 꽃에서 가장 널리 전해지는 한 줄로 내려간다.
 */
function flowerBriefFor(
  catalog: Catalog,
  result: RecoResult,
): GenerateRequest['flower'] | undefined {
  const flower = catalog.flowers.find((f) => f.id === result.flower.id);
  if (!flower) return undefined;

  const rows = catalog.meanings.filter((m) => m.flowerId === flower.id && m.sourceId !== '');
  const suggested = result.colorOptions?.find((option) => option.isSuggested);

  const pick =
    (suggested ? rows.find((m) => m.color === suggested.color) : undefined) ??
    rows.find((m) => m.confidenceLevel === 'repeated') ??
    rows[0];

  if (!pick) return undefined;

  return {
    id: flower.id,
    name_ko: flower.nameKo,
    meaning_ko: pick.meaningKo,
    meaning_source_id: pick.sourceId,
  };
}

/** 상황이 요구하는 금지선 — 프롬프트에 그대로 실린다(§1.5). */
function generationRules(intent: Intent): string[] {
  if (intent !== 'apology') return [];
  return [
    '사과는 잘못을 인정하고, 되풀이하지 않겠다는 말까지 담는다.',
    '농담·가벼운 말투를 쓰지 않는다.',
    '용서를 재촉하거나 상대의 반응을 요구하지 않는다.',
  ];
}

/**
 * 멘트 조립 — LLM 을 한 번 부르고, 못 받으면 템플릿 그대로 둔다.
 *
 * 계약(`contracts.ts`)이 3톤 1회 호출로 고정돼 있어 요청은 앞 3톤(담백·다정·진지)까지다.
 * 사과가 아닐 때 화면에 함께 서는 유쾌 톤은 템플릿을 유지한다 — 그래서 톤마다
 * `source` 를 따로 들고 다닌다.
 *
 * [2026-08-16 개정] templates.csv 가 8마음 × 화면 톤 전부(31행)를 갖춘다 — `other` 포함.
 * 키가 없거나 정적 데모면 전 탭이 예문으로 차고, LLM 이 붙으면 앞 3톤이 생성문으로
 * 바뀐다(§1.5l 개정 항목 참조).
 *
 * [2026-08-18] `onPartial` 을 주면 흘러들어오는 본문을 그대로 위로 넘긴다(표시용).
 * 그 값은 여기서 **아무것도 하지 않는다** — 톤 목록으로 바뀌는 것은 계약을 통과한 뒤뿐이다.
 *
 * ⚠ `memoryContext` 는 요청 본문에만 들어간다. 로그·에러·반환값 어디에도 싣지 않는다(§1.5j).
 */
export async function buildToneViews(
  catalog: Catalog,
  draft: ResultDraft,
  length: MessageLength = 'medium',
  onPartial?: PartialSink,
): Promise<ToneView[]> {
  const { intent, relationship, extras, memoryContext } = draft;
  const views = buildTones(catalog, intent, relationship);

  // 심각한 상황은 생성 호출 **전에** 차단한다(기획안 v2 후퇴 금지선).
  // 직접 적은 사이·마음·상황도 사용자가 쓴 글이라 모두 같은 문을 통과해야 한다.
  if (
    isBlockedForGeneration([
      memoryContext,
      extras.relationshipDetail,
      extras.intentDetail,
      ...extras.episodeHints,
    ])
  ) {
    return views;
  }

  const flower = flowerBriefFor(catalog, draft.firstPick);
  if (!flower) return views;

  const tones = views.slice(0, RESPONSE_TONE_COUNT).map((view) => view.key as Tone);
  if (tones.length < RESPONSE_TONE_COUNT) return views;

  const request: GenerateRequest = { relationship, intent, flower, tones, length };
  const rules = generationRules(intent);
  if (rules.length > 0) request.rules = rules;
  if (memoryContext !== '') request.memory_context = memoryContext;
  if (extras.relationshipDetail !== '') request.relationship_detail = extras.relationshipDetail;
  if (extras.intentDetail !== '') request.intent_detail = extras.intentDetail;
  if (extras.recipientNotes.length > 0) request.recipient_traits = extras.recipientNotes;
  if (extras.episodeHints.length > 0) request.episode_hints = extras.episodeHints;

  let generated;
  try {
    generated = await generateMessages(request, onPartial);
  } catch {
    // 어댑터가 값으로 실패를 돌려주지만, 예상 못 한 예외로도 결과 화면이 깨지지 않게 한다.
    console.error('[recommend] 멘트 생성에 실패했습니다. (내용은 남기지 않습니다)');
    return views;
  }
  if (!generated) return views;

  const byTone = new Map(generated.tones.map((item) => [item.tone, item]));
  return views.map((view) => {
    const hit = byTone.get(view.key as Tone);
    if (!hit) return view;
    const next: ToneView = { ...view, body: hit.message, headline: hit.headline, source: 'llm' };
    delete next.emptyNote;
    return next;
  });
}

/**
 * 이 배포에 멘트를 새로 써 줄 곳이 하나라도 있는가.
 *
 * 화면이 "지금 쓰고 있어요" 를 세울지 정하는 데 쓴다 — 키가 하나도 없으면 스트림을 열어
 * 봐야 예문만 돌아오고, 그 사이 사용자는 오지 않을 문장을 기다린다.
 *
 * ⚠ **키 이름만 본다.** 값은 읽지도, 옮기지도, 돌려주지도 않는다.
 */
export function hasMessageProvider(): boolean {
  return [
    process.env.GEMINI_API_KEY,
    process.env.ANTHROPIC_API_KEY,
    process.env.CLOVA_API_KEY,
    process.env.NVIDIA_API_KEY,
  ].some((key) => (key ?? '').trim() !== '');
}
