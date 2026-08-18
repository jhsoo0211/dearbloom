/**
 * 화면 표기 사전 — 엔진 어휘(slug) → 한국어.
 *
 * **어휘를 새로 만들지 않는다.** 값 목록의 원본은 언제나 `src/lib/engine`(RELATIONSHIPS ·
 * INTENTS · RECIPIENT_TRAITS · TRAIT_LABELS · TONES)이고, 여기서는 그 slug 에 라벨만 붙인다.
 * 그래서 이 파일의 사전들은 전부 `Record<Slug, string>` 으로 선언한다 — 어휘가 늘면
 * 타입 검사가 여기서 먼저 깨져서, 라벨 없는 값이 화면에 slug 로 새는 일을 막는다.
 *
 * 서버 전용으로 쓴다(page.tsx · actions.ts). 클라이언트 컴포넌트는 여기 대신
 * `types.ts` 만 import 한다 — 이 파일이 엔진 배럴을 끌어오기 때문이다(zod 포함).
 */

import { STORY_MOODS, TRAIT_LABELS } from '@/lib/engine';
import type {
  Intent,
  RecipientTrait,
  Relationship,
  SeasonStatus,
  Severity,
  SourceKind,
  Species,
  StoryMood,
  StoryType,
  Tone,
} from '@/lib/engine';
import type { ChoiceOption, ColorChoice, FlowerForm } from './types';

/* ------------------------------------------------------------------ *
 * 관계 · 마음
 * ------------------------------------------------------------------ */

/** design-spec §1.5 ② 의 6종 + §1.5l `직접 쓸게요`. */
export const RELATIONSHIP_LABELS: Record<Relationship, { label: string; desc: string }> = {
  lover: { label: '연인', desc: '사귀는 사이예요' },
  spouse: { label: '배우자', desc: '결혼한 사이예요' },
  crush: { label: '썸', desc: '아직 조심스러운 사이예요' },
  friend: { label: '친구', desc: '편한 사이예요' },
  family: { label: '가족', desc: '부모님, 형제자매' },
  colleague: { label: '동료·선후배', desc: '일과 배움으로 만난 사이' },
  // §1.5l — 여섯 갈래에 없는 사이. 고르면 한 줄로 직접 적을 수 있다(적지 않아도 된다).
  other: { label: '직접 쓸게요', desc: '위에 없는 사이예요' },
};

/**
 * 조사가 붙은 형태. 결과 상단 맥락 칩에 쓴다(`연인에게`).
 *
 * `other` 는 **사용자가 적어 준 말이 있으면 그 말이 이 자리를 대신한다**(actions.ts).
 * 여기 값은 한 줄을 비워 둔 사람에게만 보이는 폴백이다 — 마음(`other`)과 같은 규칙이다.
 */
export const RELATIONSHIP_TO_LABELS: Record<Relationship, string> = {
  lover: '연인에게',
  spouse: '배우자에게',
  crush: '썸 타는 사이에게',
  friend: '친구에게',
  family: '가족에게',
  colleague: '동료·선후배에게',
  other: '직접 적은 사이에게',
};

/**
 * §1.5l `직접 쓸게요`(관계) 한 줄의 길이 상한.
 * 화면 `maxLength` · 서버 자르기 · LLM 계약(`relationship_detail`)이 같은 값을 쓴다.
 * 마음 쪽(`INTENT_DETAIL_MAX_CHARS`)과 같은 값이지만, 두 입력은 서로 다른 문이라
 * 상수도 따로 세운다 — 한쪽 상한이 바뀔 때 다른 쪽이 조용히 따라가지 않게.
 */
export const RELATIONSHIP_DETAIL_MAX_CHARS = 80;

/**
 * 마음 7종. 설명은 §1.5d 톤 — 직설적인 지시("사과해야 해요") 대신
 * 그 상황에 놓인 사람의 말로 적는다.
 */
export const INTENT_LABELS: Record<Intent, { label: string; desc: string }> = {
  apology: { label: '사과', desc: '먼저 손 내밀고 싶을 때' },
  confession: { label: '고백', desc: '마음을 처음 꺼내려고 할 때' },
  gratitude: { label: '감사', desc: '고맙다는 말을 오래 미뤄 뒀을 때' },
  celebration: { label: '축하', desc: '함께 기뻐하고 싶은 날에' },
  comfort: { label: '위로', desc: '말로는 다 못 전할 때' },
  anniversary: { label: '기념일', desc: '함께 지나온 날을 기억할 때' },
  just_because: { label: '그냥, 문득', desc: '이유 없이 떠올랐을 때' },
  // §1.5l — 일곱 갈래에 없는 마음. 고르면 한 줄로 직접 적을 수 있다(적지 않아도 된다).
  other: { label: '직접 쓸게요', desc: '위에 없는 마음이에요' },
};

/**
 * §1.5l `직접 쓸게요` 한 줄의 길이 상한.
 * 화면 `maxLength` · 서버 자르기 · LLM 계약(`intent_detail`)이 같은 값을 쓴다.
 */
export const INTENT_DETAIL_MAX_CHARS = 80;

/* ------------------------------------------------------------------ *
 * §1.5l 시작 프리셋
 * ------------------------------------------------------------------ */

/**
 * 질문 1번 위에 세우는 지름길 버튼.
 *
 * 관계·마음을 한 번에 채우고 3번 질문으로 건너뛴다. **경로를 바꾸는 것이 아니라
 * 줄이는 것이라** 라디오 목록은 그대로 남고, 뒤로 가면 언제든 고쳐 고를 수 있다.
 *
 * 문구는 §1.5d 톤 — "사과해야 해요" 같은 지시형 대신 그 순간을 서술한다.
 * 순서는 자주 쓰일 것부터다(부모님 감사 → 다툰 다음 날 → 생일 …).
 */
export interface PresetMoment {
  value: string;
  label: string;
  relationship: Relationship;
  intent: Intent;
}

export const PRESET_MOMENTS: PresetMoment[] = [
  { value: 'parents-thanks', label: '부모님 감사 인사', relationship: 'family', intent: 'gratitude' },
  { value: 'after-quarrel', label: '다툰 다음 날', relationship: 'lover', intent: 'apology' },
  { value: 'friend-birthday', label: '친구의 생일', relationship: 'friend', intent: 'celebration' },
  {
    value: 'colleague-new-start',
    label: '동료의 새 출발',
    relationship: 'colleague',
    intent: 'celebration',
  },
  { value: 'our-anniversary', label: '우리의 기념일', relationship: 'lover', intent: 'anniversary' },
  { value: 'tired-friend', label: '지친 친구에게', relationship: 'friend', intent: 'comfort' },
  { value: 'first-confession', label: '설레는 고백', relationship: 'crush', intent: 'confession' },
  { value: 'just-because', label: '이유 없이, 문득', relationship: 'lover', intent: 'just_because' },
];

export function presetMoment(value: string): PresetMoment | undefined {
  return PRESET_MOMENTS.find((preset) => preset.value === value);
}

/* ------------------------------------------------------------------ *
 * 페르소나 · 색
 * ------------------------------------------------------------------ */

/**
 * 페르소나 태그 라벨. `TRAIT_LABELS`(한국어 → slug)를 뒤집어 만든다 —
 * 어휘와 표기의 원본을 둘로 나누지 않기 위해서다.
 */
export const TRAIT_LABEL_BY_SLUG = Object.fromEntries(
  Object.entries(TRAIT_LABELS).map(([ko, slug]) => [slug, ko]),
) as Record<RecipientTrait, string>;

/** 태그별 한 줄 설명(§1.5b 의 어휘를 풀어 쓴 것). */
export const TRAIT_DESCS: Record<RecipientTrait, string> = {
  calm: '조용하고 담담한 분',
  vivid: '눈에 띄는 걸 좋아하는 분',
  cute: '작고 사랑스러운 걸 좋아하는 분',
  elegant: '단정하고 기품 있는 분',
  minimal: '군더더기 없는 걸 좋아하는 분',
};

/* ------------------------------------------------------------------ *
 * §1.5l 받는 분 특징 칩
 * ------------------------------------------------------------------ */

/**
 * 질문 3번의 **하나뿐인 다중선택 칩 그룹**(§1.5l).
 *
 * 예전에는 분위기·반려동물·향이 각각 따로 서 있었다. 묻는 것이 결국 "받는 분은 어떤
 * 분인가"로 같은데 위계만 셋이라, 화면이 길고 반려동물 칸은 유난히 무겁게 읽혔다.
 * 그래서 한 그룹으로 합치고, 대신 **칩 하나가 엔진 입력의 어디로 가는지**를 여기에
 * 표로 적어 둔다. 분해는 `splitRecipientChips` 한 곳에서만 한다.
 *
 * 엔진에 신호가 없는 칩(처음 받아봄·오래 두고 봄)은 억지로 어휘를 만들지 않고
 * 멘트 재료로만 흘려보낸다 — 없는 근거를 지어내는 것보다 낫다.
 */
export interface RecipientChip {
  value: string;
  label: string;
  /** 엔진 recipientTraits 로 가는 페르소나 태그. */
  trait?: RecipientTrait;
  /** 함께 사는 반려동물 — 안전 제외(EX_PET_TOXIC)로 이어진다. */
  pet?: Species;
  /** 향에 민감 — 향 강한 꽃 제외(EX_FRAGRANCE)로 이어진다. */
  fragranceSensitive?: true;
  /** 향기를 좋아함 — A(미적) 안의 향 신호로 들어간다(SC_FRAGRANCE). */
  fragrancePreference?: true;
}

export const RECIPIENT_CHIPS: RecipientChip[] = [
  { value: 'vivid', label: '화려한 걸 좋아해요', trait: 'vivid' },
  { value: 'calm', label: '은은하고 담백한 걸 좋아해요', trait: 'calm' },
  { value: 'loves-fragrance', label: '향기를 좋아해요', fragrancePreference: true },
  { value: 'fragrance-sensitive', label: '향에 민감해요', fragranceSensitive: true },
  { value: 'first-flowers', label: '꽃을 처음 받아봐요' },
  { value: 'long-lasting', label: '오래 두고 보고 싶어해요' },
  { value: 'cat-home', label: '반려묘와 살아요', pet: 'cat' },
  { value: 'dog-home', label: '반려견과 살아요', pet: 'dog' },
  { value: 'cute', label: '귀엽고 사랑스러운 걸 좋아해요', trait: 'cute' },
  { value: 'elegant', label: '단정하고 기품 있는 걸 좋아해요', trait: 'elegant' },
  { value: 'minimal', label: '군더더기 없는 걸 좋아해요', trait: 'minimal' },
];

/** 칩 하나를 엔진 입력의 여러 자리로 나눈 결과. */
export interface RecipientChipSplit {
  /** 엔진 recipientTraits(어휘 검사를 통과하는 값만). */
  traits: RecipientTrait[];
  pets: Species[];
  fragranceSensitive: boolean;
  fragrancePreference: boolean;
  /** 고른 칩 전체의 라벨(고른 순서). 결과 화면 맥락 칩에 그대로 세운다. */
  labels: string[];
  /**
   * 멘트에 재료로 넘겨도 되는 칩의 라벨.
   *
   * 반려동물·향 민감 칩은 **일부러 뺀다.** 그 둘은 안전 판단이고, 프롬프트의 절대 규칙 3
   * ("반려동물 안전·독성·알레르기를 문장에 쓰지 않는다")이 금지한 자리로 모델을 끌어들이는
   * 미끼가 된다. 그 판단은 데이터가 하고 화면 배지가 말한다.
   */
  messageNotes: string[];
}

/**
 * 특징 칩 → 엔진 입력. **화면이 아니라 서버가 나눈다**(§1.5l).
 *
 * 사전에 없는 값은 조용히 버린다 — 화면은 여기서 만든 목록만 그리므로 사전 밖 값은
 * 조작된 요청이라는 뜻이고, 어휘 밖 값을 엔진에 밀어 넣으면 zod 가 요청 전체를 던진다.
 * `향에 민감` 과 `향기를 좋아함` 이 함께 오면 안전 쪽이 이긴다(엔진도 같은 판단을 한다).
 */
export function splitRecipientChips(values: readonly string[]): RecipientChipSplit {
  const chips = values
    .map((value) => RECIPIENT_CHIPS.find((chip) => chip.value === value.trim()))
    .filter((chip): chip is RecipientChip => chip !== undefined);

  const unique = Array.from(new Map(chips.map((chip) => [chip.value, chip])).values());

  const fragranceSensitive = unique.some((chip) => chip.fragranceSensitive === true);

  return {
    traits: unique
      .map((chip) => chip.trait)
      .filter((trait): trait is RecipientTrait => trait !== undefined),
    pets: unique.map((chip) => chip.pet).filter((pet): pet is Species => pet !== undefined),
    fragranceSensitive,
    fragrancePreference:
      !fragranceSensitive && unique.some((chip) => chip.fragrancePreference === true),
    labels: unique.map((chip) => chip.label),
    messageNotes: unique
      .filter((chip) => chip.pet === undefined && chip.fragranceSensitive === undefined)
      .map((chip) => chip.label),
  };
}

/* ------------------------------------------------------------------ *
 * §1.5l 상황 칩(에피소드)
 * ------------------------------------------------------------------ */

/**
 * 자유 서술 앞에 세우는 상황 칩(§1.5l).
 *
 * 빈 칸 앞에서 멈추는 사람이 많아 "고를 수도 있게" 열어 둔 길이다. 자유 글과 **별개
 * 필드**로 보내고(`episodeHints`), 글에서 단서를 읽는 `inferCuesFromText` 경로는
 * 자유 글에만 그대로 걸린다 — 칩은 이미 어휘라 다시 읽어 낼 것이 없다.
 * 쓰임은 멘트 재료이며, 저장하지 않는다는 §1.5j 원칙은 그대로다.
 */
export const EPISODE_HINTS: ChoiceOption[] = [
  { value: 'long-time', label: '오랜만에 연락해요' },
  { value: 'quarrel', label: '최근에 다퉜어요' },
  { value: 'trip-memory', label: '함께 여행한 추억이 있어요' },
  { value: 'worn-out', label: '많이 지쳐 보여요' },
  { value: 'good-news', label: '축하할 일이 생겼어요' },
  { value: 'far-apart', label: '멀리 떨어져 지내요' },
  // §1.5l — 여섯 갈래에 없는 사이. 마음(`other`)과 같은 문법이다: 고르면 한 줄이 열린다.
  { value: 'other', label: '기타 · 직접 적을게요' },
];

/** 상황 칩의 `기타`. 어휘 원본은 위 `EPISODE_HINTS` 다. */
export const EPISODE_HINT_OTHER = 'other';

/**
 * §1.5l 상황 칩 `기타` 한 줄의 길이 상한.
 * 마음·관계와 같은 값이되, 세 입력은 서로 다른 문이라 상수를 따로 세운다.
 */
export const EPISODE_HINT_DETAIL_MAX_CHARS = 80;

/**
 * 상황 칩 slug → 한국어 라벨. 사전 밖 값은 버린다(칩 목록도 서버가 만든다).
 *
 * `기타` 를 고르고 한 줄을 적어 주었으면 **그 원문이 라벨 자리를 대신한다** — 마음의
 * `other` 와 같은 규칙이다(§1.5l). `기타 · 직접 적을게요` 라는 선택지 이름이 결과 칩과
 * 프롬프트에 그대로 서 있으면, 정작 사용자가 말해 준 사이가 어디에도 남지 않는다.
 * ⚠ 원문은 자유 서술과 같은 취급이다 — 추천·멘트에만 쓰고 저장하지 않는다(§1.5j).
 */
export function episodeHintLabels(values: readonly string[], detail = ''): string[] {
  const trimmed = detail.trim();
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const value of values) {
    const hit = EPISODE_HINTS.find((hint) => hint.value === value.trim());
    if (!hit || seen.has(hit.value)) continue;
    seen.add(hit.value);
    if (hit.value === EPISODE_HINT_OTHER) {
      // 적지 않았으면 라벨도 세우지 않는다 — "기타" 세 글자는 아무것도 말해 주지 않는다.
      if (trimmed !== '') labels.push(trimmed);
      continue;
    }
    labels.push(hit.label);
  }
  return labels;
}

/**
 * 색 slug → 표기·스와치.
 *
 * hex 는 §1.4 팔레트 6색과 승인 파생(틴트·셰이드) 안에서만 고른다.
 * 파랑은 팔레트에 없어 §1.5 의 판단대로 Lavender 계열(딥 라벤더)로 표현한다.
 * 이 표는 `flowers.csv` 의 colors 어휘를 따라간다.
 */
export const COLOR_CHOICES: Record<string, ColorChoice> = {
  white: { value: 'white', label: '흰색', hex: '#FFFFFF', needsRing: true },
  cream: { value: 'cream', label: '크림', hex: '#F6F1E8', needsRing: true },
  pink: { value: 'pink', label: '분홍', hex: '#E2CCD1' },
  coral: { value: 'coral', label: '코랄', hex: '#C98A9B' },
  red: { value: 'red', label: '빨강', hex: '#8A3448' },
  magenta: { value: 'magenta', label: '자주', hex: '#5C2230' },
  purple: { value: 'purple', label: '보라', hex: '#83779C' },
  blue: { value: 'blue', label: '푸른색', hex: '#4A4160' },
  yellow: { value: 'yellow', label: '노랑', hex: '#C8963E' },
  orange: { value: 'orange', label: '주황', hex: '#8A672B' },
  green: { value: 'green', label: '초록', hex: '#263B2E' },
  // 갈색은 팔레트에 없다 — Pollen Gold 를 어둡게 내린 셰이드로 표현한다(§1.4 파생 허용).
  brown: { value: 'brown', label: '갈색', hex: '#6B4B22' },
  // 복색(무늬가 섞인 꽃)은 한 색으로 찍을 수 없어 아이보리 바탕에 테두리로 구분한다.
  variegated: { value: 'variegated', label: '복색', hex: '#F1EADC', needsRing: true },
};

/** 사전에 없는 색이 데이터에 들어와도 화면이 깨지지 않게 한다. */
export function colorChoice(slug: string): ColorChoice {
  const key = slug.trim().toLowerCase();
  return COLOR_CHOICES[key] ?? { value: key, label: key, hex: '#F6F1E8', needsRing: true };
}

/* ------------------------------------------------------------------ *
 * 예산 · 반려동물 · 톤
 * ------------------------------------------------------------------ */

/**
 * 예산 선택지. 화면은 key 만 주고받고 금액 해석은 서버가 한다.
 * max 는 `allowedPriceBands()`(exclude.ts)가 읽는 값이다:
 *   max < 30000 → band 1 / max < 50000 → band 1·2 / 그 밖 → 전부
 */
export interface BudgetChoice {
  value: string;
  label: string;
  desc: string;
  min?: number;
  max?: number;
}

export const BUDGET_CHOICES: BudgetChoice[] = [
  /*
   * `1~2만 원대` 는 `3만 원 미만` 과 **같은 band 1** 로 떨어진다(max < 30000).
   * 그래도 따로 세우는 이유는 고르는 사람의 말이 다르기 때문이다 — "3만 원 미만" 은
   * 상한을 말하고 "1~2만 원대" 는 실제로 쥔 돈을 말한다. 엔진이 가를 수 없는 구간을
   * 화면이 갈라 두는 것이므로, **추천 결과가 같아도 그것이 버그가 아니다.**
   * (price_band 가 1·2·3 뿐인 한 이 아래를 더 쪼개도 고를 수 있는 꽃은 늘지 않는다.)
   */
  { value: 'under20', label: '1~2만 원대', desc: '한 송이나 작은 다발로', max: 20000 },
  { value: 'under30', label: '3만 원 미만', desc: '가볍게 건네고 싶어요', max: 29000 },
  { value: '30to50', label: '3~5만 원', desc: '가장 많이 고르는 범위예요', min: 30000, max: 50000 },
  { value: '50to100', label: '5~10만 원', desc: '조금 넉넉하게', min: 50000, max: 100000 },
  { value: 'over100', label: '10만 원 이상', desc: '특별한 자리예요', min: 100000 },
  /*
   * §1.5l `기타` — 아직 정하지 않았거나 직접 적고 싶은 경우.
   * min·max 가 **없다**: 예산 필터를 걸지 않는다는 뜻이고(`allowedPriceBands` 는 전 구간을
   * 허용한다), 서버는 이 값에 `budgetKrw` 자체를 세우지 않는다.
   */
  { value: 'other', label: '기타 · 직접 적을게요', desc: '아직 정하지 않았거나, 따로 적고 싶어요' },
];

/** 예산 목록의 `기타`. 어휘 원본은 위 `BUDGET_CHOICES` 다. */
export const BUDGET_OTHER = 'other';

/** §1.5l 예산 `기타` 한 줄의 길이 상한. */
export const BUDGET_DETAIL_MAX_CHARS = 80;

export function budgetChoice(key: string): BudgetChoice | undefined {
  return BUDGET_CHOICES.find((b) => b.value === key);
}

export const SPECIES_LABELS: Record<Species, { label: string; desc: string }> = {
  cat: { label: '고양이', desc: '함께 사는 고양이가 있어요' },
  dog: { label: '강아지', desc: '함께 사는 강아지가 있어요' },
};

/** 멘트 톤 4종. 화면 순서도 이 배열 순서다(§1.5 는 담백·다정·진지 3종을 보여 준다). */
export const TONE_LABELS: Record<Tone, { label: string; hint: string }> = {
  plain: { label: '담백', hint: '짧고 정확하게, 부담 없이' },
  romantic: { label: '다정', hint: '그 사람의 마음을 먼저 헤아릴 때' },
  sincere: { label: '진지', hint: '신뢰가 걸린 일일 때' },
  playful: { label: '유쾌', hint: '가볍게 웃으며 건네고 싶을 때' },
};

/** 화면에 세우는 톤 순서. */
export const TONE_ORDER: Tone[] = ['plain', 'romantic', 'sincere', 'playful'];

/* ------------------------------------------------------------------ *
 * 신뢰 라벨 · 수급 · 가격 · 향
 * ------------------------------------------------------------------ */

/**
 * confidence_level → 화면 문구(§1.5d).
 * 데이터 레이어(source_url·confidence_level)는 그대로 두고 표기만 이야기 톤으로 바꾼다.
 */
export const CONFIDENCE_LABELS: Record<'repeated' | 'varies' | 'single_source', string> = {
  repeated: '오래, 두루 전해지는 꽃말',
  varies: '시대마다 조금씩 다르게 전해져요',
  single_source: '드물게 전해지는 이야기예요',
};

/** 이야기 쪽 신뢰 라벨 — 꽃말이 아니라 이야기라 말끝이 다르다. */
export const STORY_CONFIDENCE_LABELS: Record<'repeated' | 'varies' | 'single_source', string> = {
  repeated: '오래, 두루 전해지는 이야기',
  varies: '시대마다 조금씩 다르게 전해져요',
  single_source: '드물게 전해지는 이야기예요',
};

/**
 * 단일 출처라도 "카더라"가 아닌 출처들(§1.5d 개정 2026-08-15).
 * 논문·박물관·퍼블릭 도메인 원문·신문·식물원 자료는 출처가 하나여도 그 하나가 기록이다.
 */
export const DOCUMENTED_SOURCE_KINDS: readonly SourceKind[] = [
  'paper',
  'museum',
  'book-pd',
  'newspaper',
  'garden',
];

/** 위 다섯 갈래의 single_source 가 받는 문구. */
export const DOCUMENTED_SINGLE_SOURCE_LABEL = '기록으로 남아 있는 이야기예요';

/**
 * 이야기의 신뢰 문구를 고른다 — **이야기 라벨의 유일한 진입점이다.**
 *
 * `confidence_level` 만 보면 `single_source` 40편이 전부 "드물게 전해지는 이야기예요" 를
 * 달게 된다. 그런데 그중 29편은 학술 논문·국가기록원·1839년 『보태니컬 매거진』 원문처럼
 * **출처가 하나일 뿐 단단한** 자료다. 저 문구는 원래 1차 사료가 없는 전승을 위한 말이라
 * 그런 행에 붙으면 오히려 우리가 우리 데이터를 깎아내리게 된다. 그래서
 * "출처가 몇 개인가"(confidence)와 "그 하나가 무엇인가"(sourceKind)를 함께 읽는다.
 *
 * repeated·varies 는 이미 출처 수가 말해 주므로 갈리지 않는다.
 * sourceKind 가 없으면 보수적인 쪽(기존 문구)으로 떨어진다 — 없는 근거를 지어내지 않는다.
 *
 * 결과 화면(actions.ts)과 이야기 아카이브(/stories)가 **같은 이 함수를 쓴다.**
 * 같은 이야기가 두 화면에서 다른 신뢰 문구를 다는 일이 생기지 않게 하려는 것이라,
 * 라벨을 새로 계산하려거든 여기부터 고친다.
 */
export function storyConfidenceLabel(
  confidenceLevel: 'repeated' | 'varies' | 'single_source',
  sourceKind?: SourceKind,
): string {
  if (
    confidenceLevel === 'single_source' &&
    sourceKind !== undefined &&
    DOCUMENTED_SOURCE_KINDS.includes(sourceKind)
  ) {
    return DOCUMENTED_SINGLE_SOURCE_LABEL;
  }
  return STORY_CONFIDENCE_LABELS[confidenceLevel];
}

export const AVAILABILITY_LABELS: Record<SeasonStatus, string> = {
  in_season: '지금이 제철이라 상태 좋은 꽃을 만나기 쉬워요',
  limited: '제철을 살짝 비껴갔어요 — 구할 수는 있지만 값이 오를 수 있어요',
  out_of_season: '지금은 제철이 아니에요 — 수입 꽃이거나 구하기 어려울 수 있어요',
  unknown: '전하실 날짜를 알려주시면 제철인지 함께 봐드려요',
};

/**
 * price_band → 가격대 표기.
 * ⚠ 가격이 마음의 크기에 비례한다는 표현은 쓰지 않는다(design-spec §1.5).
 */
export const PRICE_LABELS: Record<1 | 2 | 3, string> = {
  1: '3만 원 안쪽에서 만들 수 있어요',
  2: '3~6만 원대가 흔해요',
  3: '6만 원대부터 시작해요',
};

/**
 * 가격 구간 표기의 칸 수(#11).
 *
 * 화면은 `₩ ₩₩ ₩₩₩` 세 칸을 **전부** 세워 두고 그 꽃의 band 까지만 채운다.
 * 채운 칸만 보여 주면 "₩"가 적은 것인지 싼 것인지 알 수 없고, 무엇보다 세 구간이
 * 있다는 사실 자체가 안 보인다 — band 1 이 "부족한 값"이 아니라 "세 구간 중 하나"로
 * 읽히려면 나머지 두 칸이 흐리게라도 함께 서 있어야 한다.
 */
export const PRICE_BAND_SLOTS = [1, 2, 3] as const;

/**
 * 가격 한 줄에 덧붙는 §1.5d 한마디. band 1(가장 낮은 구간)에만 붙는다(#11).
 *
 * ⚠ 금지선은 그대로다 — 가격이 마음의 크기에 비례한다는 함의를 어떤 표현으로도 쓰지
 * 않는다(§1.5i). 그래서 "적어도 괜찮아요"(= 원래는 더 써야 한다는 전제)가 아니라
 * "이 꽃은 이 값에 이미 충분하다"로 적는다.
 */
export const PRICE_BAND_NOTES: Partial<Record<1 | 2 | 3, string>> = {
  1: '가볍게 준비해도 충분히 마음이 서는 꽃이에요',
};

export const FRAGRANCE_LABELS: Record<0 | 1 | 2 | 3, string> = {
  0: '향이 거의 없어요',
  1: '가까이서 은은하게 나요',
  2: '향이 뚜렷한 편이에요',
  3: '향이 진해요 — 좁은 방은 피해 주세요',
};

/* ------------------------------------------------------------------ *
 * 반려동물
 * ------------------------------------------------------------------ */

export const SEVERITY_LABELS: Record<Severity, string> = {
  none: '알려진 독성이 없어요',
  mild_gi: '먹으면 가벼운 위장 장애를 일으킬 수 있어요',
  serious: '먹으면 심각한 증상이 올 수 있어요',
  life_threatening: '적은 양도 생명을 위협할 수 있어요',
};

/** pet_safety.csv 의 toxic_parts 어휘. */
export const TOXIC_PART_LABELS: Record<string, string> = {
  bulb: '알뿌리',
  stem: '줄기',
  leaf: '잎',
  flower: '꽃',
  pollen: '꽃가루',
  vase_water: '화병 물',
  root: '뿌리',
  sap: '수액',
  seed: '씨앗',
  bark: '껍질',
};

export function toxicPartLabel(part: string): string {
  return TOXIC_PART_LABELS[part] ?? part;
}

/* ------------------------------------------------------------------ *
 * 문화권 · 시대
 * ------------------------------------------------------------------ */

/**
 * 문화권 slug → 한국어. 데이터의 slug 는 `greece-rome` 처럼 여러 낱말이 붙는다.
 * 두 낱말이 한 이름인 경우만 먼저 묶고(NEAR EAST 등), 나머지는 낱말 단위로 옮겨 `·` 로 잇는다.
 */
const REGION_PHRASES: Record<string, string> = {
  'near-east': '근동',
  'middle-east': '중동',
  'south-africa': '남아프리카',
  'north-america': '북아메리카',
  'southeast-asia': '동남아시아',
  'central-asia': '중앙아시아',
  'east-asia': '동아시아',
  /* 두 표기가 같은 섬을 가리킨다 — 조사 배치가 달라 slug 가 갈렸다. 화면에서는 한 이름이다. */
  'saint-helena': '세인트헬레나',
  'st-helena': '세인트헬레나',
  'northern-ireland': '북아일랜드',
  'sapmi-norway': '사프미·노르웨이',
  'saudi-arabia': '사우디아라비아',
  'mughal-india': '무굴 인도',
};

const REGION_WORDS: Record<string, string> = {
  western: '서양',
  global: '여러 나라',
  europe: '유럽',
  greece: '그리스',
  sparta: '스파르타',
  rome: '로마',
  crete: '크레타',
  turkey: '튀르키예',
  netherlands: '네덜란드',
  france: '프랑스',
  uk: '영국',
  england: '잉글랜드',
  scotland: '스코틀랜드',
  spain: '스페인',
  italy: '이탈리아',
  belgium: '벨기에',
  germany: '독일',
  russia: '러시아',
  usa: '미국',
  canada: '캐나다',
  americas: '아메리카',
  mexico: '멕시코',
  bermuda: '버뮤다',
  ukraine: '우크라이나',
  portugal: '포르투갈',
  egypt: '이집트',
  israel: '이스라엘',
  armenia: '아르메니아',
  iran: '이란',
  persia: '페르시아',
  bulgaria: '불가리아',
  africa: '아프리카',
  kenya: '케냐',
  mauritius: '모리셔스',
  china: '중국',
  taiwan: '대만',
  japan: '일본',
  korea: '한국',
  india: '인도',
  philippines: '필리핀',
  indonesia: '인도네시아',
  /* ── 2026-08-16 확장 (탄생화 이야기 416편 + 기존 표에서 새던 낱말들) ────
     탄생화 이야기가 82가지 문화권을 들고 왔고, 그중 37가지가 영문 slug 그대로 화면에
     새고 있었다. 같은 김에 `stories.csv`·`meanings.csv` 가 예전부터 흘리던 낱말도 함께
     메운다 — 사전이 한 벌뿐이라 어느 표에서 왔든 같은 자리에서 고쳐진다.
     ⚠ 없는 낱말은 slug 를 그대로 보여 준다(위 폴백). 그건 "깨지지 않는다"는 뜻이지
       "괜찮다"는 뜻이 아니다 — 표를 늘리면 여기도 함께 늘려라. */
  britain: '영국',
  ireland: '아일랜드',
  wales: '웨일스',
  switzerland: '스위스',
  austria: '오스트리아',
  denmark: '덴마크',
  sweden: '스웨덴',
  norway: '노르웨이',
  finland: '핀란드',
  poland: '폴란드',
  hungary: '헝가리',
  croatia: '크로아티아',
  serbia: '세르비아',
  estonia: '에스토니아',
  latvia: '라트비아',
  georgia: '조지아',
  sicily: '시칠리아',
  anatolia: '아나톨리아',
  byzantium: '비잔티움',
  gaul: '갈리아',
  caucasus: '캅카스',
  eurasia: '유라시아',
  alps: '알프스',
  levant: '레반트',
  arab: '아랍',
  arabia: '아라비아',
  kazakhstan: '카자흐스탄',
  thailand: '태국',
  vietnam: '베트남',
  australia: '오스트레일리아',
  peru: '페루',
  chile: '칠레',
  brazil: '브라질',
  colombia: '콜롬비아',
  ecuador: '에콰도르',
  andes: '안데스',
  ethiopia: '에티오피아',
  tanzania: '탄자니아',
  rwanda: '르완다',
  // 나라가 아닌 값도 데이터에 들어온다 — 꽃말이 어디서 온 말인지를 가리키는 자리다.
  commonwealth: '영연방',
  aztec: '아스텍',
  navajo: '나바호',
  ainu: '아이누',
  norse: '노르드',
  victorian: '빅토리아 영국',
  etymology: '어원',
};

/** 자리표 접두사 — slug 에는 나올 수 없는 글자를 쓴다. */
const MARK = '@@';

export function regionLabel(slug: string): string {
  const key = slug.trim().toLowerCase();
  if (key === '') return '';

  // 두 낱말이 한 이름인 값을 먼저 자리표로 묶어 둔다(순서를 지키려고 치환으로 처리한다).
  let rest = key;
  const marks: string[] = [];
  for (const [phrase, label] of Object.entries(REGION_PHRASES)) {
    if (!rest.includes(phrase)) continue;
    marks.push(label);
    rest = rest.replace(phrase, `${MARK}${marks.length - 1}`);
  }

  return rest
    .split('-')
    .filter((word) => word !== '')
    .map((word) => {
      const mark = /^@@(\d+)$/.exec(word);
      if (mark) return marks[Number(mark[1])];
      // 사전에 없는 문화권은 slug 를 그대로 보여 준다 — 표의 행 이름이라 비우면 깨져 보인다.
      return REGION_WORDS[word] ?? word;
    })
    .join('·');
}

/**
 * 시대 slug → 한국어. 데이터에는 `17c` 같은 세기 표기와 `ancient-medieval`,
 * `19c-modern` 같은 **구간**이 섞여 있다. 구간은 `~` 로 잇는다.
 *
 * 모르는 값은 slug 를 그대로 내보내지 않고 **감춘다**(undefined). 시대는 문화권 옆에
 * 덧붙는 보조 정보라, 화면에 `bronze-age` 같은 영문이 새는 것보다 없는 편이 낫다.
 */
const ERA_PHRASES: [RegExp, string][] = [
  [/(\d{1,2})c-bc/g, '기원전 $1세기'],
  [/bronze-age/g, '청동기'],
  [/early-modern/g, '근세'],
];

const ERA_WORDS: Record<string, string> = {
  ancient: '고대',
  medieval: '중세',
  victorian: '빅토리아 시대',
  ottoman: '오스만 시대',
  edo: '에도 시대',
  meiji: '메이지 시대',
  joseon: '조선',
  goryeo: '고려',
  prehistoric: '선사 시대',
  traditional: '전통 시대',
  modern: '오늘날',
  tang: '당나라',
};

/** 자리표는 문화권 쪽과 같은 접두사(MARK)를 쓴다. */

export function eraLabel(era?: string): string | undefined {
  if (!era) return undefined;
  let rest = era.trim().toLowerCase();
  if (rest === '') return undefined;

  // 두 낱말이 한 시대인 값(청동기·근세·기원전 N세기)을 먼저 치환해 자리표로 묶어 둔다.
  const marks: string[] = [];
  for (const [pattern, label] of ERA_PHRASES) {
    rest = rest.replace(pattern, (_match, digits: string | undefined) => {
      marks.push(label.replace('$1', digits ?? ''));
      return `${MARK}${marks.length - 1}`;
    });
  }

  const parts = rest
    .split('-')
    .filter((token) => token !== '')
    .map((token) => {
      const mark = /^@@(\d+)$/.exec(token);
      if (mark) return marks[Number(mark[1])];
      const century = /^(\d{1,2})c$/.exec(token);
      if (century) return `${century[1]}세기`;
      /*
       * 연대 표기(`1950s` · `2010s`). 이 갈래가 없어서 **24가지 값이 통째로 감춰지고**
       * 있었다(`1780s` 부터 `2010s` 까지 — 근현대 이야기의 시대가 전부 여기 걸린다).
       * `19c` 를 `19세기` 로 옮기는 규칙과 같은 성격이라 사전이 아니라 패턴으로 둔다.
       */
      const decade = /^(\d{4})s$/.exec(token);
      if (decade) return `${decade[1]}년대`;
      return ERA_WORDS[token];
    });

  if (parts.length === 0 || parts.some((part) => part === undefined)) return undefined;
  return parts.join('~');
}

/* ------------------------------------------------------------------ *
 * 이야기 갈래
 * ------------------------------------------------------------------ */

/**
 * story_type 라벨. `original`(dearbloom 창작)만 화면에 반드시 드러낸다 —
 * 창작을 사실처럼 보이게 하지 않는 것이 §1.5f 의 유일한 금지선이다.
 */
export const ORIGINAL_STORY_LABEL = 'dearbloom이 지어 본 이야기예요';

/**
 * 네 갈래 전부의 표기(§1.5f). 상세 시트에서 이야기의 출신을 한 줄로 밝힌다.
 * 문구는 §1.5d 이야기 톤 — `history` 도 "사실"이 아니라 "기록"이라고 적는다.
 */
export const STORY_TYPE_LABELS: Record<StoryType, string> = {
  folklore: '오래 전해 온 설화',
  history: '기록으로 남은 이야기',
  literary: '문학에서 온 이야기',
  original: ORIGINAL_STORY_LABEL,
};

/** stories.csv 의 storyType 은 선택 컬럼이다 — 비어 있으면 설화로 본다(엔진 주석과 같은 기본값). */
export function storyTypeLabel(storyType?: StoryType): string {
  return STORY_TYPE_LABELS[storyType ?? 'folklore'];
}

/**
 * 이야기의 결(mood) → 한국어(§1.5i). 목록 필터 칩과 이야기 칩이 같은 말을 쓴다.
 * 어휘 원본은 엔진의 `STORY_MOODS` 이고, 순서도 그쪽을 따른다.
 */
export const STORY_MOOD_LABELS: Record<StoryMood, string> = {
  romantic: '로맨틱',
  tragic: '비극',
  funny: '유쾌',
  mythic: '신화',
  dramatic: '드라마',
  healing: '위로',
};

/** 필터 칩의 `전체` 칸. 값은 mood 어휘와 겹치지 않는 `all` 이다. */
export const STORY_MOOD_ALL = { key: 'all', label: '전체' } as const;

/** 결 필터 칩 목록 — `전체` 다음에 STORY_MOODS 순서 그대로. */
export const STORY_MOOD_FILTERS: { key: string; label: string }[] = [
  { key: STORY_MOOD_ALL.key, label: STORY_MOOD_ALL.label },
  ...STORY_MOODS.map((mood) => ({ key: mood, label: STORY_MOOD_LABELS[mood] })),
];

/* ------------------------------------------------------------------ *
 * 3안 라벨 · 꽃 형태 · 상황 예시
 * ------------------------------------------------------------------ */

/** RecoResult 순서 → 3안 라벨(§1.5 ③). */
export const OPTION_LABELS = [
  { segment: '안심', tag: '01 — Safe choice', headline: '1안 — 가장 안전한 선택 (안심)' },
  { segment: '의미', tag: '02 — Meaningful choice', headline: '2안 — 가장 의미 있는 선택 (의미)' },
  { segment: '대담', tag: '03 — Bold choice', headline: '3안 — 조금 더 기억에 남는 선택 (대담)' },
] as const;

/**
 * 꽃 → 3D 뷰어가 그릴 절차적 형태.
 * 형태는 장미형(겹꽃)·튤립형(컵꽃)·수상형(작은 꽃이 줄기에 층층이) 셋뿐이고,
 * 맞는 형태가 없는 꽃은 인상이 가장 가까운 대표 형태에 카테고리 색을 얹는다.
 */
export const FLOWER_FORMS: Record<string, FlowerForm> = {
  // 겹꽃·꽃잎이 촘촘한 꽃 → 장미형
  'rose-red': 'rose',
  peony: 'rose',
  anemone: 'rose',
  gerbera: 'rose',
  carnation: 'rose',
  ranunculus: 'rose',
  lisianthus: 'rose',
  chrysanthemum: 'rose',
  sunflower: 'rose',
  hydrangea: 'rose',
  // 꽃잎이 컵을 이루는 꽃 → 튤립형
  'tulip-white': 'tulip',
  'lily-asiatic': 'tulip',
  hellebore: 'tulip',
  // 작은 꽃이 줄기를 따라 층층이 달리는 꽃 → 수상형
  freesia: 'spike',
  hyacinth: 'spike',
  lavender: 'spike',
  'lily-of-the-valley': 'spike',
};

export function flowerForm(flowerId: string): FlowerForm {
  return FLOWER_FORMS[flowerId] ?? 'rose';
}

/**
 * §1.5h `이런 날 건네보세요`.
 *
 * ⚠ 기술부채: 스펙은 이 표의 자리를 `src/lib/theme/flowers.ts` 로 정해 두었고(이후
 * `flowers.csv` 의 `occasions` 컬럼으로 이관), 이 작업은 `src/lib` 을 읽기만 할 수 있어
 * 화면 쪽에 둔다. 컬럼이 생기면 이 상수는 지우고 카탈로그에서 읽는다.
 * 흰 튤립·흰 백합·프리지아·아네모네·헬레보어 다섯 줄은 스펙 표 그대로다.
 */
export const FLOWER_OCCASIONS: Record<string, string[]> = {
  'tulip-white': ['다툰 다음 날 아침에', '새 출발을 앞둔 사람에게', '오래 미룬 사과를 전할 때'],
  'lily-asiatic': ['새로 시작하는 자리에(결혼·개업)', '오래 존경한 분께'],
  freesia: ['첫 출근을 축하할 때', '고마운 친구에게 가볍게'],
  anemone: ['오래 기다린 마음을 전할 때', '먼저 떠난 이를 기억하는 날에'],
  hellebore: ['위로가 필요한 겨울에', '말없이 곁을 지키고 싶을 때'],
  'rose-red': ['마음을 처음 꺼내는 날에', '함께 지나온 날을 세는 자리에'],
  gerbera: ['기운을 북돋아 주고 싶을 때', '가볍게 축하하고 싶은 날에'],
  hyacinth: ['봄을 먼저 건네고 싶을 때', '오래 기억되길 바라는 자리에'],
  peony: ['크게 축하할 일이 생겼을 때', '초여름의 짧은 계절을 선물할 때'],
  hydrangea: ['집들이에 한 아름 들고 갈 때', '장마 끝의 안부를 물을 때'],
  lavender: ['잠 못 드는 사람에게', '먼 길을 떠나는 이를 배웅할 때'],
  sunflower: ['기운을 크게 북돋고 싶을 때', '한여름의 응원을 보낼 때'],
  carnation: ['부모님께 마음을 전할 때', '오래 돌봐 주신 분께'],
  lisianthus: ['격식이 필요한 자리에', '차분한 축하를 건넬 때'],
  ranunculus: ['봄에 마음을 고백할 때', '작지만 화사한 선물을 하고 싶을 때'],
  'lily-of-the-valley': ['다시 찾아온 행복을 축하할 때', '오월의 인사를 건넬 때'],
  chrysanthemum: ['먼저 떠난 이를 기억하는 날에', '가을의 안부를 물을 때'],
};

export function flowerOccasions(flowerId: string): string[] {
  return FLOWER_OCCASIONS[flowerId] ?? [];
}

/* ------------------------------------------------------------------ *
 * 인용
 * ------------------------------------------------------------------ */

/**
 * §1.5e 함께 담을 한 줄 — 김소월 〈산유화〉(1925).
 *
 * ⚠ 기술부채: `content/quotes.csv` 에 아직 이 행이 없다. 실데이터가 들어오면
 * (author 에 '김소월') 서버가 카탈로그 쪽을 우선 쓰고 이 상수는 지운다.
 * 원전이 퍼블릭 도메인인 인용만 싣는다는 규칙은 그대로다.
 */
export const FALLBACK_QUOTE = {
  textKo: '산에는 꽃 피네, 갈 봄 여름 없이 꽃이 피네.',
  /** 작가 이름을 따로 두는 이유: 문학 블록이 "같은 작가 두 번 금지"를 이 값으로 판단한다. */
  author: '김소월',
  attribution: '김소월, 〈산유화〉(1925)',
};

/**
 * §1.5k 문학 발췌의 갈래 라벨 — quotes.excerpt_type 어휘와 1:1.
 * `classic` 이 "고전"인 이유: 『시경』·오비디우스·KJV 성경처럼 시·소설·희곡 어느 쪽으로도
 * 안 떨어지는 원전을 억지로 접으면 각주가 거짓이 된다(어휘 원본은 db/seed/schemas.ts).
 */
export const EXCERPT_TYPE_LABELS: Record<string, string> = {
  poem: '시',
  novel: '소설',
  play: '희곡',
  essay: '산문',
  classic: '고전',
};

export function excerptTypeLabel(type: string | undefined): string | undefined {
  if (type === undefined) return undefined;
  return EXCERPT_TYPE_LABELS[type];
}

/* ------------------------------------------------------------------ *
 * §1.5k 문학 발췌 고르기 — 순서 규칙 (#1)
 *
 * `pickLiterature`(actions.ts)는 **후보를 거르는 일**을 하고, 거른 뒤 무엇을 앞에
 * 세우고 나머지를 어떤 차례로 넘길지는 여기 있는 순수 함수가 정한다. 규칙을 여기
 * 두는 이유는 하나다 — 이 순서는 눈으로 검수할 수 없어서(꽃 32종 × 상황 8종)
 * 테스트가 대신 봐야 하는데, actions.ts 는 `'use server'` 라 순수 함수를 내보낼 수 없다.
 * ------------------------------------------------------------------ */

/** 순서 규칙이 후보에게 요구하는 최소한의 모양. 카탈로그 `Quote` 가 이 모양을 만족한다. */
export interface LiteratureCandidate {
  quoteId: string;
  author?: string;
  /** 원어 원문. 없으면 한국어 원전이라는 뜻이다. */
  textOriginal?: string;
  tags: string[];
}

/**
 * 원문이 어느 언어권인지 — **문자(script)로 가른다.**
 *
 * `quotes.csv` 에 언어 컬럼이 없고, 만들 이유도 없다. 우리가 알고 싶은 것은
 * ISO 코드가 아니라 "방금 보여 준 것과 다른 세계의 글인가" 뿐이고, 그건 문자가 답한다.
 * 한글이 섞인 한문(이정보 〈국화야〉)은 한국 것으로 읽히는 게 맞아서 한글을 먼저 본다.
 */
export function literatureLanguage(candidate: LiteratureCandidate): string {
  const original = candidate.textOriginal ?? '';
  if (original === '') return 'ko'; // 원문이 없다 = 한국어 원전
  if (/[가-힣]/.test(original)) return 'ko';
  if (/[぀-ヿ]/.test(original)) return 'ja';
  if (/[Ѐ-ӿ]/.test(original)) return 'cyrillic';
  if (/[Ͱ-Ͽ]/.test(original)) return 'greek';
  if (/[؀-ۿ]/.test(original)) return 'arabic';
  if (/[一-鿿]/.test(original)) return 'han';
  return 'latin';
}

/** 같은 사람의 글을 한 묶음으로 본다. `A / B 옮김` 형태는 앞사람(원저자)으로 센다. */
function authorKey(candidate: LiteratureCandidate): string {
  const author = (candidate.author ?? '').split('/')[0]?.trim() ?? '';
  // 작가가 비어 있으면 서로 다른 작품으로 본다 — 한 바구니에 담아 붙여 놓지 않는다.
  return author === '' ? `#${candidate.quoteId}` : author;
}

/** 꽃 id 하나로 정해지는 값. 새로고침해도 같은 편이 나와야 검수가 가능하다(§1.5k). */
function stableHash(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
}

/**
 * 작가 기준 인터리브 — 같은 작가의 글이 **연달아** 나오지 않게 번갈아 뽑는다.
 *
 * 베르길리우스 3행이나 셸리의 인접 연처럼 한 사람의 여러 행이 붙어 있으면, 넘겨 보는
 * 사람에게는 "다른 문학"이 아니라 "같은 시의 다음 줄"로 읽힌다. 작가별 줄을 세워
 * 한 명씩 돌아가며 뽑으면 그 붙음이 풀린다(작가가 한 명뿐이면 원래 순서 그대로다).
 */
export function interleaveByAuthor<T extends LiteratureCandidate>(rows: readonly T[]): T[] {
  const buckets = new Map<string, T[]>();
  for (const row of rows) {
    const key = authorKey(row);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(row);
    else buckets.set(key, [row]);
  }

  const queues = [...buckets.values()];
  const out: T[] = [];
  let moved = true;
  while (moved) {
    moved = false;
    for (const queue of queues) {
      const next = queue.shift();
      if (!next) continue;
      out.push(next);
      moved = true;
    }
  }
  return out;
}

/**
 * 대표 1편 + 나머지 순서(#1).
 *
 *   ① 이 상황(intent)에 어울린다고 적힌 발췌가 있으면 대표는 **그 안에서만** 고른다.
 *   ② 그 안에서는 **원문 언어권**으로 가른다 — 꽃 id 로 언어권 하나를 정하고 그 언어권의
 *      첫 편을 세운다. 3안이 서로 다른 꽃이므로 세 블록의 원문이 한 언어로 몰리지 않는다.
 *      상태를 저장하지 않고도 "직전과 다른 언어권"에 가까워지는 가장 싼 방법이다.
 *   ③ 나머지는 작가 기준 인터리브로 넘긴다.
 *
 * 후보가 비어 있으면 `undefined` — 화면은 블록 자체를 세우지 않는다(§1.5k "있을 때만").
 */
export function orderLiterature<T extends LiteratureCandidate>(
  candidates: readonly T[],
  flowerId: string,
  intent: Intent,
): { featured: T; others: T[] } | undefined {
  if (candidates.length === 0) return undefined;

  const fitting = candidates.filter((quote) => quote.tags.includes(intent));
  const pool = fitting.length > 0 ? fitting : candidates;

  const languages = [...new Set(pool.map(literatureLanguage))];
  const language = languages[stableHash(flowerId) % languages.length];
  const featured = pool.find((quote) => literatureLanguage(quote) === language) ?? pool[0];
  if (!featured) return undefined;

  const others = interleaveByAuthor(
    candidates.filter((quote) => quote.quoteId !== featured.quoteId),
  );
  return { featured, others };
}

/* ------------------------------------------------------------------ *
 * §1.5e 함께 담을 한 줄 — 걷어 냄 (2026-08-18)
 *
 * `firstSentence()` 와 `CARD_LINE_NOTES` 가 여기 있었다(#13). 화면의 그 줄은 고른 톤의
 * **첫 문장**을 다시 세우는 자리였고, 그래서 각주가 "방금 쓴 멘트의 첫 마디"라고 반복을
 * 해명해야 했다 — 해명이 필요한 중복은 중복이라 판단해 줄과 함께 상수도 걷었다.
 * 자세한 근거는 `ResultView.tsx` 의 그 자리와 §1.5e 에 남겼다.
 * ------------------------------------------------------------------ */
