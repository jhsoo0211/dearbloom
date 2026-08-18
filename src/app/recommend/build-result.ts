/**
 * 추천 결과 조립 — **서버 액션과 정적 데모가 함께 쓰는 순수 부분.**
 *
 * ── 왜 파일이 갈라졌나 (2026-08-16) ──────────────────────────────────
 * 원래 이 코드는 전부 `actions.ts` 한 파일에 있었다. 정적 드롭 데모
 * (`NEXT_PUBLIC_STATIC_DEMO=1`)가 같은 결과 화면을 **브라우저에서** 그려야 하는데,
 * `'use server'` 파일은 클라이언트에서 import 할 수 없고(하면 그건 다시 서버 호출이다)
 * 그렇다고 900줄을 복사해 두면 두 벌이 반드시 어긋난다. 그래서 갈랐다:
 *
 *   · 이 파일  — 순수 함수. 카탈로그와 답변을 받아 화면 값(`ResultPayload`)을 만든다.
 *   · actions.ts — 서버 전용. `loadCatalog()`(node:fs) 와 LLM 호출을 얹는다.
 *   · lib/demo/recommend-actions.ts — 데모 전용. 굳혀 둔 카탈로그 + 템플릿 멘트.
 *
 * **여기에는 서버 전용 의존이 한 줄도 없어야 한다**(`node:fs` · LLM 프로바이더 · API 키).
 * 이 파일이 브라우저 번들에 들어가는 것이 정적 데모의 전제다.
 *
 * ── 원래 머리말 (설계 판단) ──────────────────────────────────────────
 *  - **개인 입력을 URL 에 싣지 않는다.** 결과는 호출의 반환값으로만 건너가고,
 *    화면은 같은 페이지에서 상태만 바꾼다. 새로고침하면 질문 처음으로 돌아간다(MVP).
 *  - **모양 검사가 첫 줄이다.** 서버 액션은 공개 HTTP 엔드포인트라 `WizardSubmission`
 *    타입 주석은 아무것도 지켜 주지 않는다(컴파일이 끝나면 사라진다). 그래서
 *    `parseSubmission` 이 zod `safeParse` 이고, 여기서 걸리면 예외 대신 문장으로 돌려준다.
 *    어휘 검사는 그다음이다 — `recommend()` 안의 `normalizeInput`(zod)이 맡는다.
 *  - **꾸미기는 전부 여기서 끝낸다.** 화면 컴포넌트는 라벨 사전도 엔진도 import 하지 않는다.
 */

import { z } from 'zod';

import type { Catalog, CatalogFlower, CatalogMeaning, CatalogRead, Quote } from '@/lib/data/types';
/*
 * ⚠ 두 import 다 **순수 모듈**이라 이 파일의 금지선(머리말 — 서버 전용 의존 0)을 지킨다.
 *   `reads-links` 는 타입 하나만 import 하고, `reads/expiry` 는 import 가 아예 없다.
 *   `lib/data/reads-festivals` 를 대신 가져오면 `node:fs` 가 딸려 와 정적 데모가 죽는다
 *   (그 판단의 전문은 `reads-links.ts` 머리말에 있다).
 */
import { readsForFlowerInScreenOrder } from '@/lib/data/reads-links';
import { readPeriodLabel } from '@/components/reads/expiry';
import {
  FLOWER_CUE_PREFIX,
  exclude,
  flowerCueName,
  flowerCueSlug,
  inferCuesFromTexts,
  mentionedFlowerIds,
  pickStories,
  reasonText,
  recommend,
} from '@/lib/engine';
import type {
  InferredCues,
  Intent,
  RecoInput,
  RecoResult,
  Relationship,
  Species,
  StoryRow,
  Tone,
} from '@/lib/engine';
import {
  INTENT_DETAIL_MAX_CHARS,
  MEMORY_CONTEXT_MAX_CHARS,
  RELATIONSHIP_DETAIL_MAX_CHARS,
} from '@/lib/llm/contracts';
/*
 * ⚠ **타입만** 가져온다. `@/lib/llm/extract` (실제 호출부)는 서버 전용이고, 이 파일은
 *   브라우저 번들에 들어간다(머리말의 "서버 전용 의존이 한 줄도 없어야 한다").
 *   타입 import 는 컴파일이 끝나면 사라지므로 그 약속을 깨지 않는다.
 */
import type { ExtractedCues } from '@/lib/llm/extract-contracts';
import { needsDarkOverlay, photoFor, photoSrc } from '@/lib/photos';
import { withParticle } from '@/lib/text';
import {
  AVAILABILITY_LABELS,
  BUDGET_DETAIL_MAX_CHARS,
  BUDGET_OTHER,
  CONFIDENCE_LABELS,
  EPISODE_HINT_DETAIL_MAX_CHARS,
  FALLBACK_QUOTE,
  FRAGRANCE_CHIP_LABEL,
  FRAGRANCE_LABELS,
  INTENT_LABELS,
  OPTION_LABELS,
  PRICE_BAND_NOTES,
  PRICE_LABELS,
  RELATIONSHIP_TO_LABELS,
  SEVERITY_LABELS,
  SPECIES_CHIP_LABELS,
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
  flowerOccasions,
  orderLiterature,
  regionLabel,
  splitRecipientChips,
  storyConfidenceLabel,
  storyTypeLabel,
  toxicPartLabel,
} from '@/components/flow/labels';
import { decodeSharePlan, encodeSharePlan } from '@/components/flow/share-link';
import type {
  CultureMeaningRow,
  FlowOptionView,
  FlowerPhotoView,
  LiteratureView,
  MentionedFlowerNote,
  PetBadge,
  QuoteView,
  ResultColorChip,
  ResultPayload,
  ResultReadCard,
  ShareResponse,
  SharedFlowerView,
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

/**
 * 엔진 ColorOption → 화면 색 칩.
 *
 * ⚠ **`meaningKo` 가 그 색의 것이라는 보장은 없다.** 엔진의 `buildColorOptions` 는
 *   색이 일치하는 행을 못 찾으면 **색을 가리지 않는 행**(color 빈칸)으로 조용히 내려간다
 *   (`explain.ts` 의 `findMeaning` — 그쪽 주석에 그렇게 적혀 있다). 값만 보고는 둘을
 *   구별할 수 없다.
 *
 *   화면이 「{색} {꽃}이 품은 말이에요」라고 말하려면 이 둘을 반드시 갈라야 한다 —
 *   안 가르면 색과 무관한 꽃말에 색 이름을 붙이는 **거짓 각주**가 된다(§1.5d 가 가장
 *   경계하는 종류의 문장이고, "없는 꽃말을 지어내지 않는다"는 규칙의 실질이다).
 *   그래서 원장(`meanings.csv`)에 그 색 행이 실제로 있는지 여기서 한 번 더 확인해
 *   `meaningIsForColor` 로 실어 보낸다. 판정 규칙은 `findMeaning` 의 `exact` 와 같다.
 */
function toColorChips(result: RecoResult, meanings: CatalogMeaning[]): ResultColorChip[] {
  const rows = meanings.filter((m) => m.flowerId === result.flower.id);

  return (result.colorOptions ?? []).map((option) => {
    const choice = colorChoice(option.color);
    const chip: ResultColorChip = {
      value: option.color,
      label: choice.label,
      hex: choice.hex,
      isSuggested: option.isSuggested,
    };
    if (choice.needsRing) chip.needsRing = true;
    if (option.meaningKo) {
      chip.meaningKo = option.meaningKo;
      const wanted = option.color.trim().toLowerCase();
      chip.meaningIsForColor = rows.some((m) => (m.color ?? '').trim().toLowerCase() === wanted);
    }
    if (option.confidenceLevel) chip.confidenceLabel = CONFIDENCE_LABELS[option.confidenceLevel];
    return chip;
  });
}

/**
 * 멘트 3~4톤의 밑바닥 — 카탈로그 템플릿에서 상황·톤이 맞는 문장을 고른다.
 *
 * **정적 데모는 여기까지가 전부다**(LLM 이 없다). 그래서 이 함수는 `export` 다 —
 * 데모 어댑터가 이 결과를 그대로 `assemblePayload` 에 넘긴다.
 *
 * ⚠ `templates.csv` 는 (intent × tone) 한 조합에 **행이 정확히 하나**다(2026-08-18 실측:
 *   31행 전부 서로 다른 조합). 그래서 여기에는 고를 여지가 없다 — 같은 톤의 "다른 예문"
 *   도, `length` 축으로 갈라 볼 "짧은 예문"도 존재하지 않는다(30행 medium · 1행 short).
 *   화면의 길이 토글·새로 받기가 예문 경로에서 서지 않는 이유가 이것이다.
 */
export function buildTones(
  catalog: Catalog,
  intent: Intent,
  relationship: Relationship,
): ToneView[] {
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
    } else {
      view.emptyNote = '이 톤의 예문은 아직 모으는 중이에요. 다른 톤을 먼저 봐주세요.';
    }
    return view;
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
 * §1.5t 이 꽃과 이어지는 읽을거리
 * ------------------------------------------------------------------ */

/**
 * 한 안에 싣는 읽을거리 수의 상한 — 화면이 세우는 수(2)보다 **한 장 많다.**
 *
 * 화면이 지난 행사를 브라우저의 오늘로 거르기 때문이다(`ResultReadCard` 머리말).
 * 딱 둘만 보내면 그 둘이 다 끝난 날 구획이 통째로 사라지는데, 원장에는 그 자리를
 * 대신할 글이 뒤에 서 있다. 반대로 여섯 장(국화가 그렇다)을 다 실으면 결과 payload 가
 * 3안 × 6장이 되어 곁들임이 본문만큼 무거워진다 — 셋이 그 사이의 자리다.
 */
const RESULT_READ_LIMIT = 3;

/**
 * 원장 한 행 → 결과 화면이 그대로 그리는 카드.
 *
 * `/reads` 의 `toCard` 와 **같은 규칙**을 쓰되 담는 칸이 더 적다(갈래 라벨·태그·발행일·
 * 접근 고지·도감 다리가 없다 — 이 자리는 목록이 아니라 곁들임이라 카드 두 장에 칩을
 * 세 겹 세우면 본문을 이긴다). 겹치는 두 규칙은 글자까지 같다:
 *   · 기간 문구는 `readPeriodLabel` **한 함수**를 지난다 — 두 화면이 「7월 – 9월」과
 *     「9월 1일 – 9월 30일」을 다르게 말하면 같은 행사가 다른 행사처럼 읽힌다.
 *   · `온라인` 지역은 싣지 않는다. 갈 곳이 있다는 뜻이 아닌 값을 지역 자리에 세우면
 *     「어디로 가면 되는가」에 거짓으로 답하는 셈이다.
 */
function toResultRead(read: CatalogRead): ResultReadCard {
  const card: ResultReadCard = {
    id: read.readId,
    title: read.title,
    sourceTitle: read.sourceTitle,
    url: read.sourceUrl,
    summary: read.summaryKo,
  };

  if (read.startsAt) card.startsAt = read.startsAt;
  if (read.endsAt) card.endsAt = read.endsAt;
  if (read.region && read.region !== '온라인') card.region = read.region;

  const period = readPeriodLabel(read.startsAt, read.endsAt);
  if (period) card.periodLabel = period;

  return card;
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
    colors: toColorChips(result, catalog.meanings),
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

  /*
   * §1.5t — 이 꽃을 가리키는 읽을거리. **없으면 필드 자체가 없다**(59종 중 25종만 있다).
   * 문학 블록과 같은 규칙이다: 있을 때만 서고, 빈 자리를 우리 문장으로 메우지 않는다.
   */
  const reads = readsForFlowerInScreenOrder(flower.id, catalog.reads).slice(0, RESULT_READ_LIMIT);
  if (reads.length > 0) view.reads = reads.map(toResultRead);

  return view;
}

/* ------------------------------------------------------------------ *
 * §1.5j 자유 서술
 * ------------------------------------------------------------------ */

/** 순서를 지키며 중복만 지운다(사용자가 직접 고른 값이 앞, 추론한 값이 뒤). */
function mergeUnique(chosen: string[], inferred: string[]): string[] {
  return Array.from(new Set([...chosen, ...inferred].map((v) => v.trim()).filter((v) => v !== '')));
}

/* ------------------------------------------------------------------ *
 * §1.5j AI 해석 층 — 사전이 읽은 것과 AI 가 읽은 것을 한 벌로 (2026-08-18)
 * ------------------------------------------------------------------ */

/**
 * 자유 서술에서 읽어 낸 것 한 벌. **출처(사전/AI)를 여기서 지운다.**
 *
 * 아래 조립 코드가 "이건 AI 가 읽은 것" 을 따로 알아야 할 이유가 하나도 없다 — 알게 되면
 * 언젠가 한 곳이 AI 결과만 특별대우하기 시작하고, 그때부터 두 경로의 화면이 갈라진다.
 * 그래서 병합은 이 함수 하나에서 끝내고, 그 뒤로는 값 한 벌만 흐른다.
 */
interface ResolvedCues {
  /** 글에서 읽어 낸 분위기(A 항). 사용자가 고른 칩과는 아직 합치지 않은 값이다. */
  recipientTraits: string[];
  /** 글에서 읽어 낸 색(A 항 · 색 제안). */
  colorPrefs: string[];
  /**
   * `flower:<id>` 단서 — 사전과 AI 의 **합집합**(아래 `resolveCues` 의 판단).
   * 화면의 단서 칩(`…의 기억`)과 §1.5d `적어 주신 꽃` 한 줄이 이 값을 함께 읽는다.
   */
  flowerCues: string[];
  /**
   * AI 가 엔진 어휘(`CUE_LEXICON`)로 옮겨 준 장면 낱말(P 항).
   * 사전 경로에는 이 칸이 없다 — 사전은 원문을 직접 훑으므로 옮길 필요가 없다.
   */
  sceneCues: string[];
  /** 함께 사는 반려동물. 칩과 합칠 때 **안전 쪽이 이긴다**(합집합). */
  pets: Species[];
  /** 향 민감. 칩과 합칠 때 역시 안전 쪽이 이긴다(둘 중 하나만 참이어도 참). */
  fragranceSensitive: boolean;
}

/**
 * 사전이 읽은 것(`inferCuesFromTexts`) + AI 가 읽은 것(`extractCues`) → 한 벌.
 *
 * ── 분위기·색: 합집합 ────────────────────────────────────────────────
 * 두 사전은 서로 다른 것을 본다. 사전은 형용사를("조용한 사람" → calm), AI 는 그 밖의
 * 표현을 우리 어휘로 옮긴다("파도 소리를 좋아하는" → calm · blue). 겹치면 한 번만 남고,
 * 어느 쪽도 못 읽었으면 빈 배열이다 — 지금까지와 같다.
 *
 * ── 꽃 이름: 합집합 (2026-08-18 개정) ────────────────────────────────
 * 처음에는 "한 소스만"(AI 성공 시 AI, 폴백 시 사전)으로 두었다. 두 감지기가 다른 답을
 * 주면 화면이 두 말을 할까 봐서였는데, **정밀도를 잘못 봤다.** 사전은 문자 그대로의
 * 이름 매칭이라 오탐이 거의 없다 — 글에 "수국" 이 있는데 AI 가 놓쳤다면 그건 중의성이
 * 아니라 그냥 AI 의 누락이다. 그 경우 "한 소스" 규칙은 사용자가 분명히 부른 이름을
 * 조용히 버리고, 그 꽃의 이름 가점(`SC_MEMORY_FLOWER`)과 §1.5d 한 줄을 함께 잃는다.
 *
 * 합집합이면 걱정하던 "두 말" 도 오히려 사라진다 — **놓친 이름이 없어지므로** 단서 칩과
 * §1.5d 한 줄이 같은 목록을 보게 된다(둘 다 이 값 하나를 읽는다).
 *
 * ⚠ 합집합 뒤에도 검증은 그대로 둘이다: AI 쪽은 이미 `EXTRACT_FLOWER_IDS`(사전의 id
 *   전수)로 걸러져 왔고, 실재 여부는 `mentionedFlowerIds` 가 카탈로그와 대조한다.
 *
 * ── 반려동물·향: 안전 쪽이 이긴다 ────────────────────────────────────
 * 여기만 규칙이 다르다. 둘 중 하나라도 "있다/민감하다" 고 하면 그렇게 다룬다 —
 * 칩과 자유 서술이 어긋날 때 덜 위험한 쪽으로 기우는 것이 §1.5h 의 태도다.
 */
function resolveCues(
  inferred: InferredCues,
  extracted: ExtractedCues | null | undefined,
): ResolvedCues {
  if (!extracted) {
    return {
      recipientTraits: inferred.recipientTraits,
      colorPrefs: inferred.colorPrefs,
      flowerCues: inferred.personalCues,
      sceneCues: [],
      pets: [],
      fragranceSensitive: false,
    };
  }

  return {
    recipientTraits: mergeUnique(inferred.recipientTraits, extracted.recipientTraits),
    colorPrefs: mergeUnique(inferred.colorPrefs, extracted.colorPrefs),
    // 사전이 먼저(정밀도가 높다), AI 가 더 찾아낸 것이 뒤 — 겹치면 한 번만 남는다.
    flowerCues: mergeUnique(
      inferred.personalCues,
      extracted.mentionedFlowerIds.map((id) => `${FLOWER_CUE_PREFIX}${id}`),
    ),
    sceneCues: extracted.personalCues,
    pets: extracted.pets,
    fragranceSensitive: extracted.fragranceSensitive,
  };
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
 * §1.5j AI 가 읽은 안전 신호를 화면이 말한다 (2026-08-18)
 * ------------------------------------------------------------------ */

/**
 * 맥락 칩 자리에 세울 문장. **신호의 종류만 말하고 원문은 되비추지 않는다**(§1.5j).
 *
 * 사용자가 직접 고른 칩과 같은 낱말을 앞에 두고(`반려묘와 살아요` — `RECIPIENT_CHIPS` 의
 * 라벨 그대로) 뒤에 출처를 붙인다. 같은 낱말을 쓰는 것이 중요하다 — 우리가 읽어 낸 것을
 * 사용자가 고른 것과 **다른 말로** 적으면, 화면은 같은 사실을 두 가지로 부르게 된다.
 */
const READ_CHIP_SUFFIX = ' · 이야기에서 읽었어요';

/**
 * AI 가 읽은 안전 신호 중 **실제로 꽃을 뺀 것**만 골라 칩 문장으로 만든다.
 *
 * ── 왜 "읽었다" 가 아니라 "뺐다" 를 기준으로 하나 ────────────────────
 * 이 칩의 쓸모는 하나뿐이다 — 사용자가 고르지 않은 신호 때문에 후보가 줄었을 때 그
 * 사실을 알리는 것. 읽기는 했지만 아무것도 안 빠진 경우(후보가 전부 안전한 꽃이었다)에
 * 칩을 세우면 **일어나지 않은 일을 알리는 칩**이 된다. 그건 정보가 아니라 잡음이고,
 * 사용자에게 "우리가 네 글에서 반려동물을 찾아냈다"는 사실만 자랑하는 꼴이 된다.
 *
 * ── 칩이 서는 조건 셋 ────────────────────────────────────────────────
 *   ① 그 신호가 **AI 에게서 왔다**(사용자가 칩으로 직접 고르지 않았다 — 골랐다면 이미
 *      맥락 칩에 그 라벨이 서 있고, 두 번 말할 이유가 없다).
 *   ② 그 신호를 빼고 다시 세어 보면 **제외가 실제로 줄어든다**(= 이 신호가 뺐다).
 *   ③ 규칙별로 따로 센다 — 반려동물이 뺐는데 향 칩이 서는 일이 없게.
 *
 * ⚠ `exclude()` 를 두 번 더 부른다. 꽃 59종을 훑는 순수 함수라 값이 싸고,
 *   `mentionedButNotShown` 이 이미 같은 선례를 만들어 두었다.
 */
function readSafetyChips(
  input: RecoInput,
  catalog: Catalog,
  chips: { pets: Species[]; fragranceSensitive: boolean; fragrancePreference: boolean },
  cues: ResolvedCues,
): string[] {
  const petsFromAi = cues.pets.filter((species) => !chips.pets.includes(species));
  const fragranceFromAi = cues.fragranceSensitive && !chips.fragranceSensitive;
  if (petsFromAi.length === 0 && !fragranceFromAi) return [];

  /** 그 규칙으로 빠진 꽃이 몇인가. */
  const blockedBy = (candidate: RecoInput, ruleId: string): number =>
    exclude(catalog.flowers, candidate).excluded.filter((item) => item.ruleId === ruleId).length;

  const labels: string[] = [];

  if (petsFromAi.length > 0) {
    // AI 가 읽은 반려동물을 뺀 입력 — 칩으로 고른 것만 남긴다.
    const withoutAiPets: RecoInput = { ...input, pets: chips.pets };
    if (blockedBy(input, 'EX_PET_TOXIC') > blockedBy(withoutAiPets, 'EX_PET_TOXIC')) {
      for (const species of petsFromAi) labels.push(SPECIES_CHIP_LABELS[species]);
    }
  }

  if (fragranceFromAi) {
    /*
     * 향은 되돌릴 때 **선호도 함께 되돌려야** 한다. 위 병합에서 민감이 이기면서
     * `fragrancePreference` 가 꺼졌으므로, 그 자리를 원래대로 두지 않으면 "AI 신호가
     * 없었다면" 이 아니라 "AI 신호도 선호도 없었다면" 을 재게 된다.
     */
    const withoutAiFragrance: RecoInput = {
      ...input,
      fragranceSensitive: chips.fragranceSensitive,
      fragrancePreference: chips.fragrancePreference && !chips.fragranceSensitive,
    };
    if (blockedBy(input, 'EX_FRAGRANCE') > blockedBy(withoutAiFragrance, 'EX_FRAGRANCE')) {
      labels.push(FRAGRANCE_CHIP_LABEL);
    }
  }

  return labels.map((label) => `${label}${READ_CHIP_SUFFIX}`);
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

/** 검증을 통과한 답 한 벌. */
export type WizardAnswers = z.output<typeof wizardSubmissionSchema>;

/** 어느 경로에서도 같은 문장을 쓴다 — 실패 화면이 배포 방식에 따라 달라지지 않게. */
export const GENERIC_FAILURE = '이야기를 꺼내 오다 잠깐 길을 잃었어요. 조금 뒤에 다시 눌러 주세요.';

/**
 * 답 한 벌의 모양 검사.
 *
 * ⚠ zod 의 issue 에는 받은 값(자유 서술 원문)이 섞인다 — 오류 객체를 찍지 않는다(§1.5j).
 */
export function parseSubmission(
  submission: WizardSubmission,
): { ok: true; answers: WizardAnswers } | { ok: false; message: string } {
  const received = wizardSubmissionSchema.safeParse(submission);
  if (!received.success) {
    console.error('[recommend] 받은 값의 모양이 어긋납니다. (내용은 남기지 않습니다)');
    return { ok: false, message: GENERIC_FAILURE };
  }
  return { ok: true, answers: received.data };
}

/* ------------------------------------------------------------------ *
 * 결과 조립
 * ------------------------------------------------------------------ */

/**
 * 멘트에 함께 실어 보내는 §1.5l 재료.
 * 자유 서술(memoryContext)과 달리 **서비스 어휘**라 원문 그대로 실어도 안전하다.
 */
export interface MessageExtras {
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
 * 멘트를 뺀 결과 한 벌.
 *
 * 멘트만 따로 남겨 두는 이유: 그 자리가 **경로마다 다른 유일한 칸**이다.
 * 서버는 LLM 을 한 번 부르고(실패하면 예문), 정적 데모는 처음부터 예문이다.
 * 나머지 — 3안·맥락 칩·인용·단서 — 는 두 경로가 글자 하나까지 같아야 한다.
 */
export interface ResultDraft {
  intent: Intent;
  relationship: Relationship;
  /** 멘트 생성이 꽃 정보를 뽑아 오는 첫 안. */
  firstPick: RecoResult;
  /**
   * 이번에 고른 세 안 전부. `firstPick` 은 이 중 첫째다.
   *
   * 목록째 들고 있는 이유는 `pinFirstPick` 하나 때문이다 — 멘트만 다시 받는 경로가
   * 화면에 서 있는 꽃으로 첫 안을 되돌릴 때, 그 꽃의 **온전한 `RecoResult`**(색 제안까지)를
   * 여기서 찾는다. 카탈로그에서 새로 지어내면 색별 꽃말이 화면과 어긋난다.
   */
  picks: RecoResult[];
  /**
   * §1.5j 자유 서술 두 필드를 이어 붙인 값(계약 상한까지 잘려 있다).
   * ⚠ 로그·DB 어디에도 싣지 않는다. 멘트 요청 본문으로만 흘러간다.
   */
  memoryContext: string;
  extras: MessageExtras;
  options: FlowOptionView[];
  contextChips: string[];
  quote: QuoteView;
  storyCues: string[];
  ownWords: string[];
  /**
   * §1.5j — 맥락 칩 중 **우리가 이야기에서 읽어 낸 안전 신호**의 문장들.
   * `ownWords` 와 같은 문법이다: `contextChips` 안에 이미 들어 있고, 이 목록은 화면이
   * 그 칸만 다른 결로 세우게 하는 표식이다(사용자가 고른 칩과 눈으로 갈리게).
   */
  readChips: string[];
  episodeText?: string;
  /** 「이 결과 건네주기」 부호. 만드는 규칙은 `share-link.ts` 머리말. */
  shareCode: string;
  /** §1.5d 적어 준 꽃 한 줄. 세 갈래 중 한 자리에서만 선다. */
  mentionedNote?: MentionedFlowerNote;
}

/**
 * 화면이 들고 있는 꽃 id 목록의 **모양**. 새로 받기 요청과 함께 건너온다.
 * 어휘 검사는 아래에서 카탈로그와 대조해서 한다 — 여기서는 문자열이고 짧다는 것까지다.
 */
const pinnedFlowerIdsSchema = z.array(z.string().max(SLUG_MAX_CHARS)).max(CHIP_LIST_MAX);

/**
 * 멘트가 이야기할 꽃을 **화면에 서 있는 첫 안으로 되돌린다** (2026-08-18).
 *
 * ── 왜 필요한가 ──────────────────────────────────────────────────────
 * 멘트만 다시 받는 경로(`새로 받기` · `짧게/보통`)는 서버에 아무것도 저장하지 않으므로
 * (§1.5j) 답변을 다시 받아 3안을 **다시 계산**해 왔다. 그런데 §1.5j AI 해석 층이 붙으면서
 * 그 계산이 결정적이지 않게 됐다 — 처음 제출 때 AI 가 읽어 낸 신호로 고른 첫 안과, 다시
 * 계산한 첫 안이 다를 수 있다. 그러면 **화면에 없는 꽃을 이야기하는 멘트**가 나온다.
 *
 * 답은 다시 읽는 것이 아니라 **화면이 아는 것을 넘겨받는 것**이다. 3안의 꽃 id 는 이미
 * 클라이언트 상태에 있고(`ResultPayload.options`), id 는 우리 어휘라 자유 서술처럼
 * 조심할 값도 아니다. 덕분에 이 경로는 해석을 다시 부를 이유가 없어져 4초를 돌려준다.
 *
 * ── 신뢰하지 않는 값이다 ─────────────────────────────────────────────
 * 서버 액션·라우트 핸들러는 공개 HTTP 엔드포인트라 이 목록은 남의 문자열일 수 있다.
 * 그래서 문 둘을 통과시킨다: ① 모양(문자열·길이·개수) ② **카탈로그 실재**.
 * 어느 하나라도 어긋나면 **조용히 지금 계산한 첫 안을 그대로 쓴다** — 거절하지 않는 이유는
 * 이 값이 멘트의 품질을 높이는 힌트일 뿐 결과의 전제가 아니기 때문이다.
 */
export function pinFirstPick(draft: ResultDraft, catalog: Catalog, flowerIds: unknown): ResultDraft {
  const received = pinnedFlowerIdsSchema.safeParse(flowerIds);
  if (!received.success) return draft;

  const owned = new Set(catalog.flowers.map((flower) => flower.id));
  const wanted = received.data.map((id) => id.trim()).find((id) => owned.has(id));
  if (wanted === undefined || wanted === draft.firstPick.flower.id) return draft;

  /*
   * 이번 계산에도 그 꽃이 있으면 **그 안을 그대로** 쓴다 — 색 제안(`colorOptions`)까지
   * 살아 있어야 멘트가 화면과 같은 색의 꽃말을 인용한다. 없으면(해석이 달라져 3안이
   * 통째로 바뀐 경우) 카탈로그의 이름만으로 최소한의 안을 세운다. 그때는 색별 꽃말 대신
   * 그 꽃에서 가장 널리 전해지는 한 줄로 내려간다(`flowerBriefFor` 의 폴백).
   */
  const already = draft.picks.find((pick) => pick.flower.id === wanted);
  if (already) return { ...draft, firstPick: already };

  const flower = catalog.flowers.find((item) => item.id === wanted);
  if (!flower) return draft;

  return {
    ...draft,
    firstPick: {
      flower: { id: flower.id, nameKo: flower.nameKo },
      fitScore: 0,
      reasons: [],
      cautions: [],
      substitutes: [],
      availability: 'unknown',
    },
  };
}

/* ------------------------------------------------------------------ *
 * §1.5d 적어 준 꽃 한 줄 (2026-08-18)
 * ------------------------------------------------------------------ */

/**
 * 문장 두 토막. 가운데 자리에는 화면이 **꽃 이름을 도감 링크로** 세운다.
 *
 * 결은 §1.5d 다 — 변명("아쉽게도")도, 기계조("조건에 부합하지 않아")도 쓰지 않는다.
 * 하는 일은 두 가지뿐이다: ⑴ 우리가 그 꽃을 못 본 것이 아니라는 사실, ⑵ 그런데도
 * 셋에 세우지 않은 이유. 사과하지 않는 것이 중요하다 — 이건 실수가 아니라 판단이다.
 */
const MENTIONED_NOTE_LEAD = '적어 주신 ';
const MENTIONED_NOTE_TAIL =
  '도 살펴봤어요 — 지금 고른 셋이 이 마음에 더 가까워서 함께 세우진 않았어요.';

/**
 * 이름을 직접 부른 꽃 중 **3안 밖이면서 제외당하지도 않은** 꽃들.
 *
 * 제외된 꽃을 빼는 이유: 그 사정(반려동물 독성·예산·향)은 이미 제 문장을 갖고 있고
 * (`exclude.ts` 의 `reason`), 같은 자리에 "더 가까운 셋을 골랐다" 를 겹쳐 놓으면 두 이유가
 * 서로를 흐린다. 안전 때문에 뺀 꽃을 "덜 가까워서" 로 덮어 말하는 것은 §1.5h 위반이다.
 *
 * ⚠ `exclude()` 를 한 번 더 부르는 값이다(`recommend()` 안에서도 돈다). 꽃 59종을 훑는
 *   순수 함수라 값이 싸고, 무엇보다 **엔진의 반환 모양을 바꾸지 않는다** — 이 화면 하나
 *   때문에 `RecoResult` 에 제외 목록을 매달지 않기로 한 판단이다.
 */
function mentionedButNotShown(
  input: RecoInput,
  catalog: Catalog,
  shownIds: readonly string[],
): MentionedFlowerNote | undefined {
  const mentioned = mentionedFlowerIds(input.personalCues, catalog.flowers);
  if (mentioned.length === 0) return undefined;

  const shown = new Set(shownIds);
  const blocked = new Set(exclude(catalog.flowers, input).excluded.map((item) => item.flower.id));

  const flowers = mentioned
    .filter((id) => !shown.has(id) && !blocked.has(id))
    .map((id) => catalog.flowers.find((flower) => flower.id === id))
    .filter((flower): flower is CatalogFlower => flower !== undefined)
    .map((flower) => ({ id: flower.id, nameKo: flower.nameKo }));

  if (flowers.length === 0) return undefined;
  return { flowers, lead: MENTIONED_NOTE_LEAD, tail: MENTIONED_NOTE_TAIL };
}

/**
 * 답변 + 카탈로그 → 멘트를 뺀 결과 한 벌.
 *
 * 실패도 예외 대신 값으로 돌려준다(화면이 문장으로 보여 줄 수 있게).
 * 여기서 나오는 실패 문장 세 가지는 각각 다른 사정을 말한다 — 뭉뚱그리지 않는다.
 */
export function prepareResult(
  answers: WizardAnswers,
  catalog: Catalog,
  /**
   * §1.5j AI 해석 층이 읽어 낸 것 (2026-08-18). **없으면 지금까지와 정확히 같다.**
   *
   * 이 인자를 선택으로 열어 둔 것이 "API 다 쓰면 로컬 폴백" 의 구현 그 자체다.
   * 서버 경로는 `extractCues()` 를 먼저 부르고 그 결과를(성공했으면) 여기 넘긴다.
   * 실패·타임아웃·키 없음이면 `null` 이 오고, 그러면 기존 사전 경로가 그대로 돈다.
   *
   * ⚠ **정적 데모는 이 인자를 넘기지 않는다**(`src/lib/demo/recommend-actions.ts` 는
   *   두 인자로 부른다). 브라우저에는 키를 둘 수 없으니 데모는 언제나 로컬 경로이고,
   *   그것이 이 폴백의 데모판이다 — 데모 쌍둥이 파일은 한 글자도 바뀌지 않았다.
   */
  extracted?: ExtractedCues | null,
): { ok: true; draft: ResultDraft } | { ok: false; message: string } {
  const budget = budgetChoice(answers.budgetKey);
  const dateISO = answers.dateISO;

  /*
   * §1.5j — 자유 서술 2필드.
   * 원문은 이 흐름 안에서만 살아 있다. 로그·에러 메시지에 절대 싣지 않고,
   * 화면으로 돌려보내는 것도 에피소드 한 덩이(클라이언트 상태)뿐이다.
   * 길이는 위 스키마가 이미 잘라 두었다(200 · 400).
   */
  const recipientNote = answers.recipientNote;
  const episode = answers.episode;
  /*
   * 단서 추론은 **자유 글에만** 건다(§1.5l) — 상황 칩은 이미 어휘라 읽어 낼 것이 없다.
   *
   * 사전은 **언제나 돈다.** AI 가 읽어 냈든 못 읽었든 순수 함수 한 번은 값이 싸고,
   * 그래야 `resolveCues` 가 두 경로를 같은 자리에서 합칠 수 있다(폴백이 별도 분기가
   * 아니라 "AI 쪽이 빈손인 경우" 로 자연히 흡수된다).
   */
  const inferred = inferCuesFromTexts([recipientNote, episode]);
  const cues = resolveCues(inferred, extracted);

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

  /*
   * §1.5j 안전 신호는 **칩과 글 중 조심스러운 쪽이 이긴다.**
   *
   * 칩을 안 눌렀어도 글에 "고양이 두 마리와 살아요" 가 있으면 반려동물 안전 제외
   * (EX_PET_TOXIC)가 돌아야 하고, 그 반대는 성립하지 않는다 — 칩을 눌렀는데 글에
   * 언급이 없다고 해서 제외를 풀 수는 없다. 그래서 합집합이고, `fragrancePreference`
   * 는 민감이 이기면 **여기서 다시 꺼진다**(`splitRecipientChips` 가 칩끼리 이미
   * 같은 판단을 하지만, 글에서 온 민감 신호는 그 함수가 볼 수 없었다).
   */
  const pets = mergeUnique(chips.pets, cues.pets) as Species[];
  const fragranceSensitive = chips.fragranceSensitive || cues.fragranceSensitive;

  // 어휘 검사는 recommend() 안의 normalizeInput(zod)이 한다 — 위 스키마는 모양까지다.
  // (단언은 "아직 어휘 검사 전"이라는 뜻일 뿐이고, 어휘 밖 값이면 바로 아래에서 throw 된다.)
  const input: RecoInput = {
    relationship: answers.relationship as Relationship,
    intent: answers.intent as Intent,
    // 직접 고른 칩이 먼저, 글에서 읽어 낸 단서가 뒤 — 겹치면 한 번만 남는다.
    recipientTraits: mergeUnique(chips.traits, cues.recipientTraits),
    colorPrefs: mergeUnique(answers.colorPrefs, cues.colorPrefs),
    pets,
    fragranceSensitive,
    fragrancePreference: chips.fragrancePreference && !fragranceSensitive,
    /*
     * P(개인화)의 재료. 원문 두 덩이는 엔진이 `CUE_LEXICON` 으로 직접 훑고
     * (`readCues`), `flower:` 단서와 AI 가 옮겨 준 장면 낱말은 이미 해석된 값으로 실린다.
     */
    personalCues: [recipientNote, episode, ...cues.sceneCues, ...cues.flowerCues].filter(
      (v) => v !== '',
    ),
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
  /*
   * §1.5j — AI 가 읽어 낸 안전 신호 때문에 후보가 줄었다면 그 사실을 말한다.
   * 사용자가 고른 칩 뒤에 세운다: 고른 것이 먼저, 우리가 읽은 것이 뒤(단서 칩과 같은 순서).
   */
  const readChips = readSafetyChips(input, catalog, chips, cues);
  contextChips.push(...readChips);

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

  const draft: ResultDraft = {
    intent,
    relationship,
    firstPick: picks[0],
    picks,
    memoryContext,
    extras: {
      relationshipDetail,
      intentDetail,
      recipientNotes: chips.messageNotes,
      episodeHints: hints,
    },
    options,
    contextChips,
    quote: sideQuote.view,
    /*
     * 단서 칩은 **읽어 낸 한 벌**로 만든다 — 사전이 읽었든 AI 가 읽었든 사용자에게는
     * 같은 말이다("적어 주신 이야기에서 이런 걸 봤어요"). 어느 쪽이 읽었는지는
     * 화면이 알 필요가 없고, 알게 되면 두 경로의 화면이 갈라지기 시작한다.
     */
    storyCues: cueChips({
      recipientTraits: cues.recipientTraits,
      colorPrefs: cues.colorPrefs,
      personalCues: cues.flowerCues,
    }),
    ownWords,
    readChips,
    /*
     * 「이 결과 건네주기」 부호 — **여기서 만든다.**
     *
     * 화면(클라이언트)에서 만들지 않는 이유는 두 가지다. ⑴ 무엇이 실리는지 정하는 자리가
     * 하나여야 자유 서술이 새어 나가지 않는다. ⑵ 서버 경로와 정적 데모가 **같은 함수**로
     * 같은 부호를 만들어야 두 곳에서 만든 링크가 서로 열린다(쌍둥이 규칙).
     * 싣는 값은 아래 넷뿐이고, 목록이 늘 때는 `share-link.ts` 머리말을 먼저 고쳐라.
     */
    shareCode: encodeSharePlan({
      flowerIds: options.map((option) => option.flowerId),
      relationship,
      intent,
      ...(dateISO !== '' ? { dateISO } : {}),
    }),
  };

  if (episode !== '') draft.episodeText = episode;

  const mentioned = mentionedButNotShown(
    input,
    catalog,
    options.map((option) => option.flowerId),
  );
  if (mentioned) draft.mentionedNote = mentioned;

  return { ok: true, draft };
}

const MESSAGE_NOTES: Record<ResultPayload['messageSource'], string> = {
  llm: '멘트는 들려주신 이야기를 담아 방금 쓴 문장이에요. 그대로 보내도, 고쳐 써도 좋아요.',
  template:
    '지금 보이는 멘트는 미리 적어 둔 예문이에요. 들려주신 이야기에 맞춰 직접 써 드릴 날도 곧 올 거예요.',
  empty: '이 상황의 멘트는 아직 모으는 중이에요. 곧 들려드릴게요.',
};

/**
 * 톤 목록 → 고지 한 벌(어디서 온 문장인지 + 그 사실을 말하는 각주).
 *
 * 따로 뽑아 둔 이유: 스트리밍 경로는 결과를 먼저 내보내고(예문) 멘트를 나중에 갈아
 * 끼운다. 그때 각주도 함께 바뀌어야 하는데, 그 계산이 `assemblePayload` 안에만 있으면
 * 갈아 끼우는 쪽이 각주를 직접 지어내게 된다 — 화면 문구가 두 벌이 되는 첫걸음이다.
 */
export function messageStateOf(
  tones: ToneView[],
): Pick<ResultPayload, 'messageSource' | 'messageNote'> {
  const hasLlm = tones.some((tone) => tone.source === 'llm');
  const hasBody = tones.some((tone) => tone.body !== undefined);
  const messageSource: ResultPayload['messageSource'] = hasLlm
    ? 'llm'
    : hasBody
      ? 'template'
      : 'empty';

  return { messageSource, messageNote: MESSAGE_NOTES[messageSource] };
}

/** 초안 + 멘트 → 화면이 통째로 받는 값. */
export function assemblePayload(draft: ResultDraft, tones: ToneView[]): ResultPayload {
  const { messageSource } = messageStateOf(tones);

  const payload: ResultPayload = {
    contextChips: draft.contextChips,
    isApology: draft.intent === 'apology',
    options: draft.options,
    tones,
    // `draft.quote` 는 payload 에 싣지 않는다 — 화면의 `함께 담을 한 줄` 이 걷히면서
    // 읽는 곳이 없어졌다(2026-08-18). 서버 안에서는 계속 쓴다: 문학 블록이 그 작가로
    // "한 화면에 같은 작가 두 번 금지"를 판정한다(pickLiterature).
    messageSource,
    messageNote: MESSAGE_NOTES[messageSource],
    storyCues: draft.storyCues,
    // 어떤 칩이 사용자의 원문인지 — 화면은 이 목록으로 그 칩에만 말줄임 규격을 건다.
    ownWords: draft.ownWords,
    readChips: draft.readChips,
    storyMoodFilters: STORY_MOOD_FILTERS,
    shareCode: draft.shareCode,
  };

  if (draft.episodeText !== undefined && draft.episodeText !== '') {
    payload.episodeText = draft.episodeText;
  }

  if (draft.mentionedNote) payload.mentionedNote = draft.mentionedNote;

  if (draft.intent === 'apology') payload.toneOffNote = '사과 상황에서는 유쾌 톤을 잠시 꺼두었어요.';

  return payload;
}

/* ------------------------------------------------------------------ *
 * 공유 화면 `/r` — 부호 한 줄에서 읽기 전용 화면 값을 만든다
 * ------------------------------------------------------------------ */

/** 부호가 읽히지 않을 때의 안내. 조작된 부호도 오래된 부호도 같은 자리로 온다. */
export const SHARE_UNREADABLE =
  '이 링크는 읽을 수 없는 주소예요. 건네주신 분께 다시 한 번 받아보시겠어요?';

/** 부호의 꽃이 우리 도감에 없을 때(도감이 바뀌었거나 남이 고친 주소다). */
const SHARE_UNKNOWN_FLOWER =
  '이 링크가 가리키는 꽃을 도감에서 찾지 못했어요. 대신 직접 골라보시겠어요?';

/** 공유 화면의 사진 폭 — 카드 세 장이 나란히 서는 자리라 결과 무대(1600)보다 한 단 낮다. */
const SHARE_PHOTO_WIDTH = 1080;

function toSharedFlower(flower: CatalogFlower, catalog: Catalog): SharedFlowerView {
  const view: SharedFlowerView = {
    flowerId: flower.id,
    nameKo: flower.nameKo,
    scientificName: flower.scientificName,
  };

  const photo = photoFor(flower.id);
  if (photo) {
    view.photo = {
      src: photoSrc(photo, SHARE_PHOTO_WIDTH),
      alt: photo.alt,
      credit: photo.credit,
      bright: needsDarkOverlay(photo),
    };
  }

  const meaning = bestMeaning(catalog.meanings, flower.id);
  if (meaning) {
    view.meaningKo = meaning.meaningKo;
    view.confidenceLabel = meaning.confidenceLabel;
  }

  /*
   * 이야기 훅 한 줄. `pickStories` 에 상황을 그대로 넘겨 **결과 화면과 같은 대표 이야기**가
   * 서게 한다 — 건넨 사람이 본 화면과 받은 사람이 보는 화면이 다른 이야기를 말하면
   * "이걸 보고 골랐대요" 라는 문장 자체가 어긋난다.
   */
  const stories = pickStories(flower.id, 'just_because', catalog.stories, 1);
  const featured = stories.featured;
  if (featured) view.storyLine = featured.hook ?? featured.title;

  return view;
}

/**
 * 공유 부호 → 읽기 전용 화면 값.
 *
 * **순수 함수다.** 서버 액션도 정적 데모도 이 함수 하나를 부른다(쌍둥이 규칙) — 카탈로그를
 * 어디서 읽어 왔는지만 다르다.
 *
 * 검증은 두 걸음이다. ① `decodeSharePlan` 이 모양과 어휘를 본다(zod). ② 여기서 **꽃이
 * 실재하는지** 본다 — 부호는 남이 고칠 수 있는 문자열이라, 어휘를 통과했다고 그 id 가
 * 우리 도감에 있다는 뜻은 아니다. 둘 중 하나라도 어긋나면 화면은 안내로 떨어진다.
 */
export function buildShareView(code: string, catalog: Catalog): ShareResponse {
  const plan = decodeSharePlan(code);
  if (!plan) return { ok: false, message: SHARE_UNREADABLE };

  const flowers = plan.flowerIds
    .map((id) => catalog.flowers.find((flower) => flower.id === id))
    .filter((flower): flower is CatalogFlower => flower !== undefined);

  // 하나라도 못 찾으면 반쪽을 보여 주지 않는다 — "셋 중 둘" 은 건넨 사람의 결과가 아니다.
  if (flowers.length !== plan.flowerIds.length) {
    return { ok: false, message: SHARE_UNKNOWN_FLOWER };
  }

  /*
   * 맥락 칩 — 링크에 실린 어휘만 옮긴다.
   * `other`(직접 쓸게요)는 사용자가 적은 한 줄이 **링크에 없으므로** 폴백 라벨이 선다
   * (`직접 적은 사이에게` · `직접 쓸게요`). 그 한 줄은 자유 서술이라 애초에 싣지 않는다.
   */
  const chips = [
    RELATIONSHIP_TO_LABELS[plan.relationship as Relationship],
    INTENT_LABELS[plan.intent as Intent].label,
  ];
  const whenChip = plan.dateISO ? dateChip(plan.dateISO) : undefined;
  if (whenChip) chips.push(whenChip);

  return {
    ok: true,
    payload: { chips, flowers: flowers.map((flower) => toSharedFlower(flower, catalog)) },
  };
}
