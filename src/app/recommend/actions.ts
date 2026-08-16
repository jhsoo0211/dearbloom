'use server';

/**
 * 추천 제출 — 질문 5문항의 답을 받아 엔진을 돌리고 결과 화면이 쓸 값을 통째로 만든다.
 *
 * 설계 판단
 *  - **개인 입력을 URL 에 싣지 않는다.** 결과는 서버 액션의 반환값으로만 건너가고,
 *    화면은 같은 페이지에서 상태만 바꾼다. 새로고침하면 질문 처음으로 돌아간다(MVP).
 *  - **모양 검사가 첫 줄이다.** 서버 액션은 공개 HTTP 엔드포인트라 `WizardSubmission`
 *    타입 주석은 아무것도 지켜 주지 않는다(컴파일이 끝나면 사라진다). 그래서 함수 첫 줄이
 *    zod `safeParse` 이고, 여기서 걸리면 예외 대신 `{ ok:false }` 문장으로 돌려준다.
 *    어휘 검사는 그다음이다 — `recommend()` 안의 `normalizeInput`(zod)이 맡는다.
 *  - **꾸미기는 전부 여기서 끝낸다.** 클라이언트 컴포넌트는 라벨 사전도 엔진도
 *    import 하지 않는다(번들에 zod·node:fs 가 섞이지 않게).
 */

import { z } from 'zod';

import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog, CatalogFlower, CatalogMeaning, Quote } from '@/lib/data/types';
import {
  flowerCueName,
  flowerCueSlug,
  inferCuesFromTexts,
  pickStories,
  reasonText,
  recommend,
} from '@/lib/engine';
import type { Intent, RecoInput, RecoResult, Relationship, StoryRow, Tone } from '@/lib/engine';
import {
  INTENT_DETAIL_MAX_CHARS,
  MEMORY_CONTEXT_MAX_CHARS,
  RELATIONSHIP_DETAIL_MAX_CHARS,
  RESPONSE_TONE_COUNT,
} from '@/lib/llm/contracts';
import type { GenerateRequest } from '@/lib/llm/contracts';
import { generateMessages } from '@/lib/llm/provider';
import { isBlockedForGeneration } from '@/lib/llm/safety';
import { needsDarkOverlay, photoFor, photoSrc } from '@/lib/photos';
import { withParticle } from '@/lib/text';
import {
  AVAILABILITY_LABELS,
  BUDGET_DETAIL_MAX_CHARS,
  BUDGET_OTHER,
  CARD_LINE_NOTES,
  CONFIDENCE_LABELS,
  EPISODE_HINT_DETAIL_MAX_CHARS,
  FALLBACK_QUOTE,
  FRAGRANCE_LABELS,
  INTENT_LABELS,
  OPTION_LABELS,
  PRICE_BAND_NOTES,
  PRICE_LABELS,
  RELATIONSHIP_TO_LABELS,
  SEVERITY_LABELS,
  SPECIES_LABELS,
  STORY_MOOD_FILTERS,
  STORY_MOOD_LABELS,
  TONE_LABELS,
  TONE_ORDER,
  TRAIT_LABEL_BY_SLUG,
  budgetChoice,
  colorChoice,
  episodeHintLabels,
  eraLabel,
  excerptTypeLabel,
  firstSentence,
  flowerOccasions,
  orderLiterature,
  regionLabel,
  splitRecipientChips,
  storyConfidenceLabel,
  storyTypeLabel,
  toxicPartLabel,
} from '@/components/flow/labels';
import type {
  CultureMeaningRow,
  FlowOptionView,
  FlowResponse,
  FlowerPhotoView,
  LiteratureView,
  PetBadge,
  QuoteView,
  ResultColorChip,
  ResultPayload,
  StoryCard,
  ToneView,
  WizardSubmission,
} from '@/components/flow/types';

/* ------------------------------------------------------------------ *
 * 작은 조각들
 * ------------------------------------------------------------------ */

/** 'YYYY-MM-DD' → '8월 16일에 전해요'. 타임존에 따라 날짜가 밀리지 않게 문자열로 읽는다. */
function dateChip(dateISO: string): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO.trim());
  if (!m) return undefined;
  return `${Number(m[2])}월 ${Number(m[3])}일에 전해요`;
}

/** 그 꽃의 꽃말 중 가장 널리 전해지는 한 줄. 고른 색에 꽃말이 없을 때 대신 쓴다. */
function bestMeaning(meanings: CatalogMeaning[], flowerId: string) {
  const rows = meanings.filter((m) => m.flowerId === flowerId);
  const best = rows.find((m) => m.confidenceLevel === 'repeated') ?? rows[0];
  if (!best) return undefined;
  return { meaningKo: best.meaningKo, confidenceLabel: CONFIDENCE_LABELS[best.confidenceLevel] };
}

/** 나라별 꽃말 표 — cultureRegion 이 적힌 행만 모은다. */
function cultureRows(meanings: CatalogMeaning[], flowerId: string): CultureMeaningRow[] {
  return meanings
    .filter((m) => m.flowerId === flowerId && (m.cultureRegion ?? '') !== '')
    .map((m) => ({
      regionLabel: regionLabel(m.cultureRegion ?? ''),
      eraLabel: eraLabel(m.era),
      meaningKo: m.meaningKo,
      confidenceLabel: CONFIDENCE_LABELS[m.confidenceLevel],
    }));
}

function toStoryCard(story: StoryRow): StoryCard {
  const isOriginal = story.storyType === 'original';
  const region = regionLabel(story.cultureRegion ?? '');
  const era = eraLabel(story.era);

  const card: StoryCard = {
    id: story.storyId,
    title: story.title,
    body: story.storyKo,
    isOriginal,
    typeLabel: storyTypeLabel(story.storyType),
    confidenceLabel: storyConfidenceLabel(story.confidenceLevel, story.sourceKind),
    moods: story.moods,
    moodLabels: story.moods.map((mood) => STORY_MOOD_LABELS[mood]),
  };

  if (story.hook) card.hook = story.hook;
  // 창작(original)만 출처가 면제다 — 나머지는 갈래를 각주로 밝힌다(§1.5d).
  if (!isOriginal && story.sourceTitle) {
    card.sourceNote = `이야기의 갈래 — ${story.sourceTitle}`;
    card.sourceTitle = story.sourceTitle;
    // 상세 시트에서만 원문으로 건너뛴다 — 각주 톤을 지키려고 링크는 제목에만 건다(§1.5i).
    if (story.sourceUrl) card.sourceUrl = story.sourceUrl;
  }
  if (region) card.regionLabel = era ? `${region} · ${era}` : region;

  return card;
}

/** 반려동물 배지 — 화면에는 소형 배지 1곳만 나오고 상세는 접힌다(§1.5h). */
function petBadge(flower: CatalogFlower, catalog: Catalog): PetBadge {
  const entries = flower.petSafety;
  if (entries.length === 0) {
    return {
      toxic: false,
      label: '반려동물 정보 확인 중',
      summary: '이 꽃은 아직 확인하지 못했어요',
      details: ['고양이·강아지 안전 정보를 아직 모으는 중이에요. 확인되면 바로 알려드릴게요.'],
      alternatives: [],
    };
  }

  const toxicEntries = entries.filter((e) => e.toxic);
  const toxic = toxicEntries.length > 0;

  const details = entries.map((entry) => {
    const species = SPECIES_LABELS[entry.species].label;
    const parts = entry.toxicParts.map(toxicPartLabel);
    // 괄호 안의 목록(`(주의 부위: 알뿌리·잎)`)은 눈으로도 낭독으로도 문장이 아니다.
    const partNote =
      parts.length > 0 ? ` ${withParticle(parts.join('·'), 'object')} 특히 조심해 주세요.` : '';
    return `${species} — ${SEVERITY_LABELS[entry.severity]}${partNote}`;
  });

  const altIds = new Set(
    catalog.petSafety
      .filter((row) => row.flowerId === flower.id)
      .flatMap((row) => row.safeAlternativeFlowerIds),
  );
  const alternatives = catalog.flowers
    .filter((f) => altIds.has(f.id) && f.id !== flower.id)
    .map((f) => f.nameKo);

  return {
    toxic,
    label: toxic ? '반려동물 주의' : '반려동물 안전',
    summary: toxic
      ? `${toxicEntries.map((e) => SPECIES_LABELS[e.species].label).join('·')}에게 독성이 있어요`
      : `${entries.map((e) => SPECIES_LABELS[e.species].label).join('·')}에게 알려진 독성이 없어요`,
    details,
    alternatives: toxic ? alternatives : [],
  };
}

/** 엔진 ColorOption → 화면 색 칩. 색별 꽃말은 출처를 찾은 색에만 붙는다. */
function toColorChips(result: RecoResult): ResultColorChip[] {
  return (result.colorOptions ?? []).map((option) => {
    const choice = colorChoice(option.color);
    const chip: ResultColorChip = {
      value: option.color,
      label: choice.label,
      hex: choice.hex,
      isSuggested: option.isSuggested,
    };
    if (choice.needsRing) chip.needsRing = true;
    if (option.meaningKo) chip.meaningKo = option.meaningKo;
    if (option.confidenceLevel) chip.confidenceLabel = CONFIDENCE_LABELS[option.confidenceLevel];
    return chip;
  });
}

/**
 * 멘트 3~4톤의 밑바닥 — 카탈로그 템플릿에서 상황·톤이 맞는 문장을 고른다.
 *
 * #13 — 예문을 찾은 톤에는 `함께 담을 한 줄`도 그 예문의 **첫 문장**으로 함께 붙인다.
 * `templates.csv` 에 한 줄짜리 컬럼이 따로 없어서(있는 것은 `template_text` 뿐이다)
 * 새 컬럼을 만드는 대신 있는 문장에서 떼어 낸다 — 톤마다 다른 말이 나온다는 것이
 * 목적이고, 그건 예문 자체가 이미 톤별로 다르기 때문에 첫 문장만으로 충족된다.
 * 예문조차 없는 톤(`other` 처럼 templates.csv 에 상황이 없는 경우)은 이 필드가 없고,
 * 화면이 공용 인용(김소월)으로 떨어진다 — 톤별 접미사를 붙여 억지로 변형하지 않는다.
 */
function buildTones(catalog: Catalog, intent: Intent, relationship: Relationship): ToneView[] {
  // 사과 자리에서 유쾌 톤은 내린다(§1.5).
  const tones: Tone[] = TONE_ORDER.filter((tone) => !(intent === 'apology' && tone === 'playful'));

  return tones.map((tone) => {
    const rows = catalog.templates.filter((t) => t.intent === intent && t.tone === tone);
    const hit =
      rows.find((t) => t.relationship === relationship) ??
      rows.find((t) => t.relationship === undefined) ??
      rows[0];

    const view: ToneView = { key: tone, label: TONE_LABELS[tone].label, hint: TONE_LABELS[tone].hint };
    if (hit) {
      view.body = hit.templateText;
      view.source = 'template';
      view.cardLine = {
        textKo: firstSentence(hit.templateText),
        attribution: CARD_LINE_NOTES.template,
      };
    } else {
      view.emptyNote = '이 톤의 예문은 아직 모으는 중이에요. 다른 톤을 먼저 봐주세요.';
    }
    return view;
  });
}

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
 * 멘트에 함께 실어 보내는 §1.5l 재료.
 * 자유 서술(memoryContext)과 달리 **서비스 어휘**라 원문 그대로 실어도 안전하다.
 */
interface MessageExtras {
  /** 사이가 `other` 일 때 직접 적은 한 줄. 잘라 낸 뒤의 값이다. */
  relationshipDetail: string;
  /** 마음이 `other` 일 때 직접 적은 한 줄. 잘라 낸 뒤의 값이다. */
  intentDetail: string;
  /** 특징 칩 라벨(반려동물·향 민감 칩은 빠져 있다 — 프롬프트 절대 규칙 3). */
  recipientNotes: string[];
  /** 상황 칩 라벨. `기타` 를 골랐다면 그 자리에 사용자가 적은 원문이 서 있다. */
  episodeHints: string[];
}

/*
 * ⚠ 예산은 `MessageExtras` 에 **없다.**
 *
 * §1.5l 이 예산 `기타` 에 자유 한 줄을 열었지만, 그 값은 프롬프트로 가지 않는다 —
 * 절대 규칙 3 이 "가격을 문장에 쓰지 않는다" 이고, 금액이 적힌 글을 <자료> 에 실으면
 * 모델을 그 금지선 앞으로 데려다 놓는 셈이 된다. 반려동물·향 민감 칩을 `messageNotes`
 * 에서 빼 두는 것과 같은 판단이다. 예산 한 줄의 쓰임은 결과 맥락 칩 하나뿐이다.
 */

/**
 * 멘트 조립 — LLM 을 한 번 부르고, 못 받으면 템플릿 그대로 둔다.
 *
 * 계약(`contracts.ts`)이 3톤 1회 호출로 고정돼 있어 요청은 앞 3톤(담백·다정·진지)까지다.
 * 사과가 아닐 때 화면에 함께 서는 유쾌 톤은 템플릿을 유지한다 — 그래서 톤마다
 * `source` 를 따로 들고 다닌다.
 *
 * intent 가 `other` 면 템플릿이 아예 없다(templates.csv 에 그 상황이 없다). 이때는 기존
 * "이 톤의 예문은 아직 모으는 중" 경로를 그대로 타고, LLM 이 붙으면 그 자리가 채워진다 —
 * `other` 전용 템플릿을 새로 만들지 않는다.
 *
 * ⚠ `memoryContext` 는 요청 본문에만 들어간다. 로그·에러·반환값 어디에도 싣지 않는다(§1.5j).
 */
async function buildToneViews(
  catalog: Catalog,
  intent: Intent,
  relationship: Relationship,
  pick: RecoResult,
  memoryContext: string,
  extras: MessageExtras,
): Promise<ToneView[]> {
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

  const flower = flowerBriefFor(catalog, pick);
  if (!flower) return views;

  const tones = views.slice(0, RESPONSE_TONE_COUNT).map((view) => view.key as Tone);
  if (tones.length < RESPONSE_TONE_COUNT) return views;

  const request: GenerateRequest = { relationship, intent, flower, tones };
  const rules = generationRules(intent);
  if (rules.length > 0) request.rules = rules;
  if (memoryContext !== '') request.memory_context = memoryContext;
  if (extras.relationshipDetail !== '') request.relationship_detail = extras.relationshipDetail;
  if (extras.intentDetail !== '') request.intent_detail = extras.intentDetail;
  if (extras.recipientNotes.length > 0) request.recipient_traits = extras.recipientNotes;
  if (extras.episodeHints.length > 0) request.episode_hints = extras.episodeHints;

  let generated;
  try {
    generated = await generateMessages(request);
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
    // #13 — 이 톤에 맞춘 `함께 담을 한 줄`. 방금 쓴 첫 마디가 그 자리에 가장 어울린다
    //       (톤을 바꾸면 문장도 함께 바뀐다는 것을 사용자가 눈으로 확인하는 자리다).
    if (hit.headline) {
      next.cardLine = { textKo: hit.headline, attribution: CARD_LINE_NOTES.llm };
    }
    return next;
  });
}

/**
 * §1.5e 함께 담을 한 줄.
 * quotes.csv 에 김소월 〈산유화〉가 적재되면 그쪽을 쓰고, 아직 없으면 스펙 상수로 떨어진다.
 *
 * 작가 이름을 본문과 함께 돌려주는 이유: 바로 아래 문학 블록이 **같은 작가를 한 화면에
 * 두 번 세우지 않으려고** 이 값을 본다. 각주 문자열(`김소월, 〈산유화〉(1925)`)에서
 * 이름을 다시 파싱하는 대신 처음부터 따로 들고 다닌다.
 */
function pickQuote(catalog: Catalog): { view: QuoteView; author: string } {
  const fromCatalog = catalog.quotes.find((q) => (q.author ?? '').includes('김소월'));
  if (!fromCatalog) {
    return {
      view: { textKo: FALLBACK_QUOTE.textKo, attribution: FALLBACK_QUOTE.attribution },
      author: FALLBACK_QUOTE.author,
    };
  }
  const source = fromCatalog.sourceTitle ? `, 〈${fromCatalog.sourceTitle}〉` : '';
  const era = fromCatalog.era ? `(${fromCatalog.era})` : '';
  return {
    view: {
      textKo: fromCatalog.textKo,
      attribution: `${fromCatalog.author ?? ''}${source}${era}`.trim(),
    },
    author: fromCatalog.author ?? '',
  };
}

/* ------------------------------------------------------------------ *
 * §1.5k 문학 속의 이 꽃
 * ------------------------------------------------------------------ */

/**
 * 같은 작품을 이야기와 발췌로 두 번 보여 주지 않기 위한 배제 표
 * (literature-research §7). `stories.csv` 의 literary 17행은 **문학을 소재로 한
 * 이야기**이고 quotes 의 발췌는 **원문 그 자체**라 역할이 다르지만, 아래 세 쌍은
 * 같은 작품이라 나란히 놓으면 한 화면에서 같은 말을 두 번 하는 셈이 된다.
 *
 * 판정 대상은 **대표 이야기(featured) 하나뿐이다.** 결과 화면은 그 꽃의 이야기를 전부
 * 목록으로 내려보내므로(k=∞) 목록 전체와 견주면 ㉔·㊳ 두 발췌는 영영 뜨지 못한다 —
 * 위계상 눈에 먼저 들어오는 대표 자리와만 겹치지 않으면 된다는 판단이다.
 */
const LITERATURE_STORY_CONFLICTS: Record<string, string> = {
  'q-lit-chrysanthemum-taoyuanming': 'story-chrysanthemum-tao-yuanming',
  'q-lit-poppy-mccrae': 'story-poppy-in-flanders-fields',
  'q-lit-violet-hamlet': 'story-pansy-ophelia',
};

/**
 * `김유정, 「동백꽃」(1936, 《조광》)` 형태의 각주 한 줄.
 * `source_title` 이 이미 연도를 품고 있는 행이 많아, 겹칠 때는 era 를 덧붙이지 않는다.
 */
function literatureAttribution(quote: Quote): string {
  const base = [quote.author, quote.sourceTitle]
    .filter((part): part is string => Boolean(part))
    .join(', ');
  const era = quote.era ?? '';
  if (era === '' || base.includes(era)) return base;
  return `${base}(${era})`;
}

/** 카탈로그 한 행 → 화면 발췌 한 편. 없는 필드는 아예 두지 않는다(있는 척하지 않는다). */
function toLiteratureView(quote: Quote): LiteratureView {
  const view: LiteratureView = {
    id: quote.quoteId,
    textKo: quote.textKo,
    attribution: literatureAttribution(quote),
  };
  if (quote.textOriginal) view.textOriginal = quote.textOriginal;
  const typeLabel = excerptTypeLabel(quote.excerptType);
  if (typeLabel) view.typeLabel = typeLabel;
  // 옮긴이는 사실이 아니라 예의의 문제다 — 우리가 옮긴 문장을 원문인 척 두지 않는다.
  if (quote.translator) view.translatorNote = `옮김: ${quote.translator}`;
  if (quote.caveat) view.caveat = quote.caveat;
  if (quote.sourceTitle) view.sourceTitle = quote.sourceTitle;
  if (quote.sourceUrl) view.sourceUrl = quote.sourceUrl;
  return view;
}

/**
 * 그 꽃의 문학 발췌 — **대표 1편 + 나머지 전부**(§1.5k · #1). 없으면 블록 자체를 생략한다.
 *
 * 거르는 순서
 *   1. 그 꽃에 붙은 발췌만 후보로 둔다(`excerptType` 이 있는 행 = 문학 발췌).
 *   2. 대표 이야기와 같은 작품이면 뺀다(§7 상호배제).
 *   3. 함께 담을 한 줄과 같은 작가면 뺀다 — 한 화면에 같은 이름이 두 번 서지 않게.
 *
 * 거른 뒤의 **차례**는 `orderLiterature`(labels.ts)가 정한다 — 상황에 맞는 편을 대표로,
 * 그 안에서 원문 언어권을 갈라 세우고, 나머지는 작가 기준 인터리브로 넘긴다.
 * 어느 단계에도 난수가 없다: 새로고침마다 문장이 바뀌면 "우리가 고른 한 편"이라는
 * 인상이 사라지고, 무엇보다 결과를 재현할 수 없어 검수가 불가능해진다.
 */
function pickLiterature(
  catalog: Catalog,
  flowerId: string,
  intent: Intent,
  featuredStoryId: string | undefined,
  sideQuoteAuthor: string,
): { featured: LiteratureView; others: LiteratureView[] } | undefined {
  const candidates = catalog.quotes.filter((quote) => {
    if (quote.flowerId !== flowerId || quote.excerptType === undefined) return false;
    if (
      featuredStoryId !== undefined &&
      LITERATURE_STORY_CONFLICTS[quote.quoteId] === featuredStoryId
    ) {
      return false;
    }
    const author = quote.author ?? '';
    if (author !== '' && sideQuoteAuthor !== '' && author.includes(sideQuoteAuthor)) return false;
    return true;
  });

  const ordered = orderLiterature(candidates, flowerId, intent);
  if (!ordered) return undefined;

  return {
    featured: toLiteratureView(ordered.featured),
    others: ordered.others.map(toLiteratureView),
  };
}

/* ------------------------------------------------------------------ *
 * #14 대표 실사
 * ------------------------------------------------------------------ */

/**
 * 결과 화면 맨 위에 걸 실사 한 컷.
 *
 * 폭은 **1600**(도감 상세와 같은 값)이다. 결과 무대는 폰 프레임 안이지만 데스크톱
 * 2단에서는 좌단을 가득 채우고, 레티나에서 1080 은 눈에 띄게 물러진다.
 * `photoSrc` 가 허용하는 네 폭 밖의 값을 쓰지 않는 것이 CDN 캐시를 가르지 않는 조건이다.
 */
function photoView(flowerId: string): FlowerPhotoView | undefined {
  const photo = photoFor(flowerId);
  if (!photo) return undefined;
  return {
    src: photoSrc(photo, 1600),
    alt: photo.alt,
    credit: photo.credit,
    bright: needsDarkOverlay(photo),
  };
}

/* ------------------------------------------------------------------ *
 * 한 안 만들기
 * ------------------------------------------------------------------ */

function toOptionView(
  result: RecoResult,
  index: number,
  catalog: Catalog,
  intent: Intent,
  sideQuoteAuthor: string,
): FlowOptionView | null {
  const flower = catalog.flowers.find((f) => f.id === result.flower.id);
  if (!flower) return null;

  // 3안 라벨은 최대 3개다. 그보다 뒤는 나오지 않지만, 데이터가 늘어도 깨지지 않게 마지막을 쓴다.
  const labels = OPTION_LABELS[Math.min(index, OPTION_LABELS.length - 1)];

  // 반려동물 주의는 접힌 상세로 내리고(§1.5h), 그 밖의 주의는 그대로 노출한다.
  const petCautions = result.cautions.filter((c) => c.includes('반려동물'));
  const otherCautions = result.cautions.filter((c) => !c.includes('반려동물'));

  // k 를 열어 두고 그 꽃의 이야기를 **전부** 내려보낸다(§1.5i — 썰 탐색이 결과 화면의 핵심).
  // featured 선별과 mood 다양성 정렬은 그대로다.
  const stories = pickStories(flower.id, intent, catalog.stories, Number.POSITIVE_INFINITY);

  const view: FlowOptionView = {
    index,
    segmentLabel: labels.segment,
    segmentTag: labels.tag,
    headline: labels.headline,
    flowerId: flower.id,
    nameKo: flower.nameKo,
    scientificName: flower.scientificName,
    fitScore: result.fitScore,
    reasons: result.reasons.map(reasonText),
    petCautions,
    otherCautions,
    availabilityLabel: AVAILABILITY_LABELS[result.availability],
    substitutes: result.substitutes.map((s) => s.nameKo),
    priceLabel: PRICE_LABELS[flower.priceBand],
    priceBand: flower.priceBand,
    fragranceLabel: FRAGRANCE_LABELS[flower.fragranceLevel],
    occasions: flowerOccasions(flower.id),
    petBadge: petBadge(flower, catalog),
    colors: toColorChips(result),
    colorReason: result.colorSuggestion?.reason ?? '',
    stories: {
      featured: stories.featured ? toStoryCard(stories.featured) : null,
      others: stories.others.map(toStoryCard),
    },
    cultureMeanings: cultureRows(catalog.meanings, flower.id),
  };

  if (flower.careSummary) view.careSummary = flower.careSummary;
  // #11 — 가장 낮은 구간에만 붙는 한마디. 나머지 두 구간은 값 자체가 이미 충분한 설명이다.
  const priceNote = PRICE_BAND_NOTES[flower.priceBand];
  if (priceNote) view.priceNote = priceNote;
  // #14 — 32종 전원에 컷이 있지만, 없어도 화면이 서야 하므로 있을 때만 붙인다.
  const photo = photoView(flower.id);
  if (photo) view.photo = photo;
  const fallback = bestMeaning(catalog.meanings, flower.id);
  if (fallback) view.fallbackMeaning = fallback;

  // §1.5k — 검증된 발췌가 있는 꽃에만 붙는다. 없으면 필드 자체가 없다.
  const literature = pickLiterature(
    catalog,
    flower.id,
    intent,
    stories.featured?.storyId,
    sideQuoteAuthor,
  );
  if (literature) view.literature = literature;

  return view;
}

/* ------------------------------------------------------------------ *
 * §1.5j 자유 서술
 * ------------------------------------------------------------------ */

/** 순서를 지키며 중복만 지운다(사용자가 직접 고른 값이 앞, 추론한 값이 뒤). */
function mergeUnique(chosen: string[], inferred: string[]): string[] {
  return Array.from(new Set([...chosen, ...inferred].map((v) => v.trim()).filter((v) => v !== '')));
}

/**
 * 추론한 단서 → 화면에 세울 한국어 칩.
 * **사용자가 직접 고른 칩은 넣지 않는다** — "적어 준 이야기에서 우리가 읽어 낸 것"만 보여 준다.
 */
function cueChips(cues: {
  recipientTraits: string[];
  colorPrefs: string[];
  personalCues: string[];
}): string[] {
  const chips = [
    ...cues.recipientTraits
      .map((slug) => TRAIT_LABEL_BY_SLUG[slug as keyof typeof TRAIT_LABEL_BY_SLUG])
      .filter((label): label is string => Boolean(label))
      .map((label) => `${label} 분위기`),
    ...cues.colorPrefs.map((slug) => colorChoice(slug).label),
    ...cues.personalCues
      .map(flowerCueSlug)
      .filter((slug): slug is string => slug !== undefined)
      // 사전의 첫 낱말이 사람들이 실제로 쓰는 짧은 이름이다(`흰 튤립` 이 아니라 `튤립`).
      .map(flowerCueName)
      .filter((name): name is string => name !== undefined)
      .map((name) => `${name}의 기억`),
  ];
  return Array.from(new Set(chips));
}

/* ------------------------------------------------------------------ *
 * 들어오는 값의 모양 (경계 검증)
 * ------------------------------------------------------------------ */

/**
 * slug 한 칸의 길이 상한. 우리 어휘 중 가장 긴 값(`just_because`)의 세 배쯤이라
 * 어휘가 늘어도 걸리지 않고, 본문을 slug 칸에 밀어 넣는 요청은 막힌다.
 */
const SLUG_MAX_CHARS = 40;

/** 칩 목록 한 줄의 개수 상한. 지금 가장 긴 목록(특징 칩 11종)의 두 배다. */
const CHIP_LIST_MAX = 24;

/**
 * 자유 서술의 **절대** 상한. 화면 상한(200·400)과 별개로, 이보다 긴 본문은
 * 잘라 쓰는 대신 요청째로 거절한다 — 잘라 봐야 우리가 쓸 수 있는 글이 아니고,
 * 공개 엔드포인트에 메가바이트짜리 본문이 들어오는 길을 열어 둘 이유도 없다.
 */
const FREE_TEXT_HARD_MAX = 4_000;

/** §1.5j 자유 서술 `그 사람은 어떤 사람인가요?` 의 서버측 상한(화면 maxLength 와 같은 값). */
const RECIPIENT_NOTE_MAX_CHARS = 200;

/** §1.5j 자유 서술 `함께한 기억이나 에피소드가 있나요?` 의 서버측 상한. */
const EPISODE_MAX_CHARS = 400;

/** 어휘 검사는 뒤(엔진·라벨 사전)가 한다 — 여기서는 "문자열이고, 터무니없이 길지 않다"까지다. */
const slugField = z.string().max(SLUG_MAX_CHARS);

/**
 * 자유 서술 한 칸.
 * 상한을 넘긴 글은 **거절이 아니라 자르기**다 — 사용자가 쓴 글이고, 화면이 이미 같은 값으로
 * 막아 두었으니 여기 걸리는 것은 화면을 거치지 않은 요청뿐이다. 다만 절대 상한은 거절한다.
 */
function freeTextField(max: number) {
  return z
    .string()
    .max(FREE_TEXT_HARD_MAX)
    .transform((value) => value.trim().slice(0, max));
}

/**
 * 화면이 보내는 답 한 벌의 **모양**.
 *
 * ⚠ 어휘(관계 6종·마음 8종·색 slug…)는 여기서 보지 않는다. 그 검사는 `recommend()` 안의
 *   `normalizeInput` 한 곳에 있고, 두 곳에서 같은 어휘를 검사하면 반드시 한쪽이 늦게 늘어난다.
 */
const wizardSubmissionSchema = z.object({
  relationship: slugField,
  relationshipDetail: freeTextField(RELATIONSHIP_DETAIL_MAX_CHARS),
  intent: slugField,
  intentDetail: freeTextField(INTENT_DETAIL_MAX_CHARS),
  recipientChips: z.array(slugField).max(CHIP_LIST_MAX),
  colorPrefs: z.array(slugField).max(CHIP_LIST_MAX),
  recipientNote: freeTextField(RECIPIENT_NOTE_MAX_CHARS),
  episode: freeTextField(EPISODE_MAX_CHARS),
  episodeHints: z.array(slugField).max(CHIP_LIST_MAX),
  episodeHintDetail: freeTextField(EPISODE_HINT_DETAIL_MAX_CHARS),
  budgetKey: slugField,
  budgetDetail: freeTextField(BUDGET_DETAIL_MAX_CHARS),
  dateISO: z.string().max(SLUG_MAX_CHARS).transform((value) => value.trim()),
});

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
  const received = wizardSubmissionSchema.safeParse(submission);
  if (!received.success) {
    // ⚠ zod 의 issue 에는 받은 값(자유 서술 원문)이 섞인다 — 오류 객체를 찍지 않는다(§1.5j).
    console.error('[recommend] 받은 값의 모양이 어긋납니다. (내용은 남기지 않습니다)');
    return {
      ok: false,
      message: '이야기를 꺼내 오다 잠깐 길을 잃었어요. 조금 뒤에 다시 눌러 주세요.',
    };
  }
  const answers = received.data;

  let catalog: Catalog;
  try {
    catalog = await loadCatalog();
  } catch (error) {
    console.error('[recommend] 콘텐츠를 읽지 못했습니다.', error);
    return {
      ok: false,
      message: '이야기를 꺼내 오다 잠깐 길을 잃었어요. 조금 뒤에 다시 눌러 주세요.',
    };
  }

  const budget = budgetChoice(answers.budgetKey);
  const dateISO = answers.dateISO;

  /*
   * §1.5j — 자유 서술 2필드.
   * 원문은 이 함수 안에서만 살아 있다. 로그·에러 메시지에 절대 싣지 않고,
   * 화면으로 돌려보내는 것도 에피소드 한 덩이(클라이언트 상태)뿐이다.
   * 길이는 위 스키마가 이미 잘라 두었다(200 · 400).
   */
  const recipientNote = answers.recipientNote;
  const episode = answers.episode;
  // 단서 추론은 **자유 글에만** 건다(§1.5l) — 상황 칩은 이미 어휘라 읽어 낼 것이 없다.
  const inferred = inferCuesFromTexts([recipientNote, episode]);

  /*
   * §1.5l 직접 쓴 한 줄들(사이 · 마음 · 요즘 사이 · 예산).
   * 넷 다 자유 서술과 같은 취급이라 길이만 잘라 넘기고 어디에도 저장하지 않는다.
   * `기타` 를 고른 상황 칩은 라벨 자리에 원문이 들어간다(`episodeHintLabels`).
   */
  const relationshipDetail = answers.relationshipDetail;
  const intentDetail = answers.intentDetail;
  const budgetDetail = answers.budgetDetail;
  const hints = episodeHintLabels(answers.episodeHints, answers.episodeHintDetail);

  /*
   * §1.5l — 특징 칩 한 줄을 엔진 입력의 제 자리로 나눈다.
   * 반려묘·반려견 칩이 pets 로 가야 반려동물 안전 제외(EX_PET_TOXIC)가 그대로 돈다.
   */
  const chips = splitRecipientChips(answers.recipientChips);

  // 어휘 검사는 recommend() 안의 normalizeInput(zod)이 한다 — 위 스키마는 모양까지다.
  // (단언은 "아직 어휘 검사 전"이라는 뜻일 뿐이고, 어휘 밖 값이면 바로 아래에서 throw 된다.)
  const input: RecoInput = {
    relationship: answers.relationship as Relationship,
    intent: answers.intent as Intent,
    // 직접 고른 칩이 먼저, 글에서 읽어 낸 단서가 뒤 — 겹치면 한 번만 남는다.
    recipientTraits: mergeUnique(chips.traits, inferred.recipientTraits),
    colorPrefs: mergeUnique(answers.colorPrefs, inferred.colorPrefs),
    pets: chips.pets,
    fragranceSensitive: chips.fragranceSensitive,
    fragrancePreference: chips.fragrancePreference,
    personalCues: [recipientNote, episode, ...inferred.personalCues].filter((v) => v !== ''),
  };
  /*
   * §1.5l `기타` 예산은 금액이 없다(min·max 둘 다 undefined). 그때는 `budgetKrw` 를
   * **세우지 않는다** — 빈 객체를 넘겨도 `allowedPriceBands` 는 전 구간을 허용하지만,
   * "예산을 말하지 않았다" 와 "예산을 빈 객체로 말했다" 는 다른 문장이고 뒤엣것은 나중에
   * 이 값을 읽는 코드를 헷갈리게 한다.
   */
  if (budget && (budget.min !== undefined || budget.max !== undefined)) {
    input.budgetKrw = {};
    if (budget.min !== undefined) input.budgetKrw.min = budget.min;
    if (budget.max !== undefined) input.budgetKrw.max = budget.max;
  }
  if (dateISO !== '') input.dateISO = dateISO;

  let picks: RecoResult[];
  try {
    picks = recommend(input, catalog);
  } catch {
    // ⚠ 오류 객체를 그대로 찍지 않는다 — 검증 오류에는 받은 값(자유 서술 원문)이 섞일 수
    //   있고, §1.5j 의 금지선은 "원문은 로그 어디에도 남기지 않는다" 이다.
    console.error('[recommend] 입력을 해석하지 못했습니다. (내용은 남기지 않습니다)');
    return { ok: false, message: '관계와 마음, 두 가지만 골라 주시면 바로 찾아드릴게요.' };
  }

  if (picks.length === 0) {
    return {
      ok: false,
      message:
        '말씀하신 자리에 딱 맞는 꽃을 아직 못 찾았어요. 값을 조금 넓히거나 향·반려동물 쪽을 하나만 풀어 주시겠어요?',
    };
  }

  const intent = input.intent;
  const relationship = input.relationship;

  // 함께 담을 한 줄을 먼저 고른다 — 문학 블록이 "같은 작가 두 번 금지"를 이 작가로 판단한다.
  const sideQuote = pickQuote(catalog);

  const options = picks
    .map((pick, index) => toOptionView(pick, index, catalog, intent, sideQuote.author))
    .filter((option): option is FlowOptionView => option !== null);

  if (options.length === 0) {
    return {
      ok: false,
      message: '꽃은 골랐는데 그 꽃의 이야기를 꺼내 오지 못했어요. 조금 뒤에 다시 눌러 주세요.',
    };
  }

  const whenChip = dateChip(answers.dateISO);
  /*
   * §1.5l `직접 쓸게요`·`기타` 의 맥락 칩 — **라벨 대신 사용자가 쓴 말**을 세운다.
   * `직접 쓸게요` 는 질문 화면에서는 선택지 이름이라 맞지만, 결과 화면의 맥락 칩은
   * "우리가 무엇을 듣고 골랐는가" 를 되비추는 자리다. 거기 선택지 이름이 서 있으면
   * 정작 사용자가 적어 준 상황("유학 떠나는 조카를 배웅해요")이 화면 어디에도 없다.
   * 네 자리(사이·마음·요즘 사이·예산)가 같은 규칙을 쓴다.
   * ⚠ 자유 서술과 같은 취급 — 여기서 화면으로만 건너가고 어디에도 저장하지 않는다.
   */
  const relationshipChip =
    relationship === 'other' && relationshipDetail !== ''
      ? relationshipDetail
      : RELATIONSHIP_TO_LABELS[relationship];
  const intentChip =
    intent === 'other' && intentDetail !== '' ? intentDetail : INTENT_LABELS[intent].label;
  /*
   * 예산 `기타` — 적어 준 말이 있으면 그 말이, 없으면 칩 자체를 세우지 않는다.
   * "기타 · 직접 적을게요" 라는 선택지 이름은 조건이 아니라 우리 화면의 사정이라
   * 결과의 맥락 칩 자리에 설 이유가 없다.
   */
  const budgetChip =
    budget === undefined
      ? undefined
      : budget.value === BUDGET_OTHER
        ? budgetDetail !== ''
          ? budgetDetail
          : undefined
        : budget.label;
  const contextChips: string[] = [
    relationshipChip,
    intentChip,
    // 특징 칩은 고른 라벨을 그대로 세운다 — 화면과 결과가 같은 말을 쓰게(§1.5l).
    ...chips.labels,
    ...answers.colorPrefs.map((slug) => `${colorChoice(slug).label} 선호`),
    ...hints,
    ...(budgetChip ? [budgetChip] : []),
    ...(whenChip ? [whenChip] : []),
  ];

  /*
   * 그중 **사용자의 말 그대로인 칩**. 화면은 이 목록에 든 칩에만 말줄임 규격을 건다
   * (우리가 지은 라벨은 길이를 우리가 정했지만, 사용자의 말은 그렇지 않다).
   * `기타` 상황 칩의 원문은 `hints` 안에 이미 섞여 있어 여기서 다시 골라 담는다.
   */
  const episodeHintDetail = answers.episodeHintDetail;
  const ownWords = [
    ...(relationshipChip === relationshipDetail && relationshipDetail !== ''
      ? [relationshipDetail]
      : []),
    ...(intentChip === intentDetail && intentDetail !== '' ? [intentDetail] : []),
    ...(episodeHintDetail !== '' && hints.includes(episodeHintDetail) ? [episodeHintDetail] : []),
    ...(budgetChip !== undefined && budgetChip === budgetDetail ? [budgetDetail] : []),
  ];

  /*
   * ⚠ 자유 서술 원문은 여기서 요청 본문으로만 흘러간다(로그·DB 금지 — §1.5j).
   *
   * 두 필드(200 · 400)와 줄바꿈 한 칸을 더하면 601 자라 계약 상한(600)을 딱 한 칸 넘긴다.
   * 그 한 칸 때문에 가장 길게 적어 준 사람만 조용히 템플릿으로 떨어지지 않도록 여기서 자른다.
   */
  const memoryContext = [recipientNote, episode]
    .filter((text) => text !== '')
    .join('\n')
    .slice(0, MEMORY_CONTEXT_MAX_CHARS);
  const tones = await buildToneViews(catalog, intent, relationship, picks[0], memoryContext, {
    relationshipDetail,
    intentDetail,
    recipientNotes: chips.messageNotes,
    episodeHints: hints,
  });

  const hasLlm = tones.some((tone) => tone.source === 'llm');
  const hasBody = tones.some((tone) => tone.body !== undefined);
  const messageSource: ResultPayload['messageSource'] = hasLlm
    ? 'llm'
    : hasBody
      ? 'template'
      : 'empty';

  const MESSAGE_NOTES: Record<ResultPayload['messageSource'], string> = {
    llm: '멘트는 들려주신 이야기를 담아 방금 쓴 문장이에요. 그대로 보내도, 고쳐 써도 좋아요.',
    template:
      '지금 보이는 멘트는 미리 적어 둔 예문이에요. 들려주신 이야기에 맞춰 직접 써 드릴 날도 곧 올 거예요.',
    empty: '이 상황의 멘트는 아직 모으는 중이에요. 곧 들려드릴게요.',
  };

  const payload: ResultPayload = {
    contextChips,
    isApology: intent === 'apology',
    options,
    tones,
    quote: sideQuote.view,
    messageSource,
    messageNote: MESSAGE_NOTES[messageSource],
    storyCues: cueChips(inferred),
    // 어떤 칩이 사용자의 원문인지 — 화면은 이 목록으로 그 칩에만 말줄임 규격을 건다.
    ownWords,
    storyMoodFilters: STORY_MOOD_FILTERS,
  };

  if (episode !== '') payload.episodeText = episode;

  if (intent === 'apology') payload.toneOffNote = '사과 상황에서는 유쾌 톤을 잠시 꺼두었어요.';

  return { ok: true, payload };
}
