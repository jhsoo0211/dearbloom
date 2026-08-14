'use server';

/**
 * 추천 제출 — 질문 5문항의 답을 받아 엔진을 돌리고 결과 화면이 쓸 값을 통째로 만든다.
 *
 * 설계 판단
 *  - **개인 입력을 URL 에 싣지 않는다.** 결과는 서버 액션의 반환값으로만 건너가고,
 *    화면은 같은 페이지에서 상태만 바꾼다. 새로고침하면 질문 처음으로 돌아간다(MVP).
 *  - **검증은 서버가 한다.** 화면이 보낸 값은 전부 문자열로 받고 `recommend()` 안의
 *    `normalizeInput`(zod)이 어휘를 검사한다. 어휘 밖 값이면 던지고, 여기서 잡아
 *    `{ ok:false }` 로 돌려준다 — 화면이 500 대신 문장을 보여 줄 수 있게.
 *  - **꾸미기는 전부 여기서 끝낸다.** 클라이언트 컴포넌트는 라벨 사전도 엔진도
 *    import 하지 않는다(번들에 zod·node:fs 가 섞이지 않게).
 */

import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog, CatalogFlower, CatalogMeaning } from '@/lib/data/types';
import { pickStories, reasonText, recommend } from '@/lib/engine';
import type {
  Intent,
  RecoInput,
  RecoResult,
  Relationship,
  Species,
  StoryRow,
  Tone,
} from '@/lib/engine';
import {
  AVAILABILITY_LABELS,
  CONFIDENCE_LABELS,
  FALLBACK_QUOTE,
  FRAGRANCE_LABELS,
  INTENT_LABELS,
  ORIGINAL_STORY_LABEL,
  OPTION_LABELS,
  PRICE_LABELS,
  RELATIONSHIP_TO_LABELS,
  SEVERITY_LABELS,
  SPECIES_LABELS,
  STORY_CONFIDENCE_LABELS,
  TONE_LABELS,
  TONE_ORDER,
  TRAIT_LABEL_BY_SLUG,
  budgetChoice,
  colorChoice,
  eraLabel,
  flowerForm,
  flowerOccasions,
  regionLabel,
  toxicPartLabel,
} from '@/components/flow/labels';
import type {
  CultureMeaningRow,
  FlowOptionView,
  FlowResponse,
  PetBadge,
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
    confidenceLabel: STORY_CONFIDENCE_LABELS[story.confidenceLevel],
  };

  if (story.hook) card.hook = story.hook;
  if (isOriginal) card.originalLabel = ORIGINAL_STORY_LABEL;
  // 창작(original)만 출처가 면제다 — 나머지는 갈래를 각주로 밝힌다(§1.5d).
  if (!isOriginal && story.sourceTitle) card.sourceNote = `이야기의 갈래 — ${story.sourceTitle}`;
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
    const partNote = parts.length > 0 ? ` (주의 부위: ${parts.join('·')})` : '';
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
      : `${entries.map((e) => SPECIES_LABELS[e.species].label).join('·')} 비독성`,
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

/** 멘트 3~4톤. LLM 은 아직 붙지 않아 카탈로그 템플릿에서 상황·톤이 맞는 문장을 보여 준다. */
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
    if (hit) view.body = hit.templateText;
    else view.emptyNote = '이 톤의 예문은 아직 모으는 중이에요. 다른 톤을 먼저 봐주세요.';
    return view;
  });
}

/**
 * §1.5e 함께 담을 한 줄.
 * quotes.csv 에 김소월 〈산유화〉가 적재되면 그쪽을 쓰고, 아직 없으면 스펙 상수로 떨어진다.
 */
function pickQuote(catalog: Catalog) {
  const fromCatalog = catalog.quotes.find((q) => (q.author ?? '').includes('김소월'));
  if (!fromCatalog) return FALLBACK_QUOTE;
  const source = fromCatalog.sourceTitle ? `, 〈${fromCatalog.sourceTitle}〉` : '';
  const era = fromCatalog.era ? `(${fromCatalog.era})` : '';
  return {
    textKo: fromCatalog.textKo,
    attribution: `${fromCatalog.author ?? ''}${source}${era}`.trim(),
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
): FlowOptionView | null {
  const flower = catalog.flowers.find((f) => f.id === result.flower.id);
  if (!flower) return null;

  // 3안 라벨은 최대 3개다. 그보다 뒤는 나오지 않지만, 데이터가 늘어도 깨지지 않게 마지막을 쓴다.
  const labels = OPTION_LABELS[Math.min(index, OPTION_LABELS.length - 1)];

  // 반려동물 주의는 접힌 상세로 내리고(§1.5h), 그 밖의 주의는 그대로 노출한다.
  const petCautions = result.cautions.filter((c) => c.includes('반려동물'));
  const otherCautions = result.cautions.filter((c) => !c.includes('반려동물'));

  const stories = pickStories(flower.id, intent, catalog.stories);

  const view: FlowOptionView = {
    index,
    segmentLabel: labels.segment,
    segmentTag: labels.tag,
    headline: labels.headline,
    form: flowerForm(flower.id),
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
  const fallback = bestMeaning(catalog.meanings, flower.id);
  if (fallback) view.fallbackMeaning = fallback;

  return view;
}

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
  let catalog: Catalog;
  try {
    catalog = await loadCatalog();
  } catch (error) {
    console.error('[recommend] 콘텐츠를 읽지 못했습니다.', error);
    return { ok: false, message: '꽃 이야기를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.' };
  }

  const budget = budgetChoice(submission.budgetKey);
  const cue = submission.personalCue.trim();
  const dateISO = submission.dateISO.trim();

  // 어휘 검사는 recommend() 안의 normalizeInput(zod)이 한다 — 여기서는 모양만 맞춘다.
  // (단언은 "아직 검사 전"이라는 뜻일 뿐이고, 어휘 밖 값이면 바로 아래에서 throw 된다.)
  const input: RecoInput = {
    relationship: submission.relationship as Relationship,
    intent: submission.intent as Intent,
    recipientTraits: submission.recipientTraits,
    colorPrefs: submission.colorPrefs,
    pets: submission.pets as Species[],
    fragranceSensitive: submission.fragranceSensitive,
    personalCues: cue === '' ? [] : [cue],
  };
  if (budget) {
    input.budgetKrw = {};
    if (budget.min !== undefined) input.budgetKrw.min = budget.min;
    if (budget.max !== undefined) input.budgetKrw.max = budget.max;
  }
  if (dateISO !== '') input.dateISO = dateISO;

  let picks: RecoResult[];
  try {
    picks = recommend(input, catalog);
  } catch (error) {
    console.error('[recommend] 입력을 해석하지 못했습니다.', error);
    return { ok: false, message: '입력을 다시 확인해 주세요. 관계와 마음은 꼭 골라야 해요.' };
  }

  if (picks.length === 0) {
    return {
      ok: false,
      message:
        '조건에 맞는 꽃을 찾지 못했어요. 예산을 조금 넓히거나 향·반려동물 조건을 다시 봐주세요.',
    };
  }

  const intent = input.intent;
  const relationship = input.relationship;

  const options = picks
    .map((pick, index) => toOptionView(pick, index, catalog, intent))
    .filter((option): option is FlowOptionView => option !== null);

  if (options.length === 0) {
    return { ok: false, message: '추천한 꽃의 정보를 찾지 못했어요. 잠시 뒤 다시 시도해 주세요.' };
  }

  const whenChip = dateChip(submission.dateISO);
  const contextChips: string[] = [
    RELATIONSHIP_TO_LABELS[relationship],
    INTENT_LABELS[intent].label,
    ...submission.recipientTraits
      .map((slug) => TRAIT_LABEL_BY_SLUG[slug as keyof typeof TRAIT_LABEL_BY_SLUG])
      .filter((label): label is string => Boolean(label)),
    ...submission.colorPrefs.map((slug) => `${colorChoice(slug).label} 선호`),
    ...submission.pets
      .map((slug) => SPECIES_LABELS[slug as Species])
      .filter(Boolean)
      .map((s) => `${s.label}와 함께 살아요`),
    ...(submission.fragranceSensitive ? ['향에 민감해요'] : []),
    ...(budget ? [budget.label] : []),
    ...(whenChip ? [whenChip] : []),
  ];

  const payload: ResultPayload = {
    contextChips,
    isApology: intent === 'apology',
    options,
    tones: buildTones(catalog, intent, relationship),
    quote: pickQuote(catalog),
    messageNote:
      '지금 보이는 멘트는 미리 준비해 둔 예문이에요. 상황에 맞춰 직접 써 드리는 기능은 곧 붙습니다.',
  };

  if (intent === 'apology') payload.toneOffNote = '사과 상황에서는 유쾌 톤을 잠시 꺼두었어요.';

  return { ok: true, payload };
}
