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

import { TRAIT_LABELS } from '@/lib/engine';
import type {
  Intent,
  RecipientTrait,
  Relationship,
  SeasonStatus,
  Severity,
  Species,
  Tone,
} from '@/lib/engine';
import type { ColorChoice, FlowerForm } from './types';

/* ------------------------------------------------------------------ *
 * 관계 · 마음
 * ------------------------------------------------------------------ */

/** design-spec §1.5 ② 의 6종 그대로. */
export const RELATIONSHIP_LABELS: Record<Relationship, { label: string; desc: string }> = {
  lover: { label: '연인', desc: '사귀는 사이예요' },
  spouse: { label: '배우자', desc: '결혼한 사이예요' },
  crush: { label: '썸', desc: '아직 조심스러운 사이예요' },
  friend: { label: '친구', desc: '편한 사이예요' },
  family: { label: '가족', desc: '부모님, 형제자매' },
  colleague: { label: '동료·선후배', desc: '일과 배움으로 만난 사이' },
};

/** 조사가 붙은 형태. 결과 상단 맥락 칩에 쓴다(`연인에게`). */
export const RELATIONSHIP_TO_LABELS: Record<Relationship, string> = {
  lover: '연인에게',
  spouse: '배우자에게',
  crush: '썸 타는 사이에게',
  friend: '친구에게',
  family: '가족에게',
  colleague: '동료·선후배에게',
};

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
};

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
  { value: 'under30', label: '3만 원 미만', desc: '가볍게 건네고 싶어요', max: 29000 },
  { value: '30to50', label: '3~5만 원', desc: '가장 많이 고르는 범위예요', min: 30000, max: 50000 },
  { value: '50to100', label: '5~10만 원', desc: '조금 넉넉하게', min: 50000, max: 100000 },
  { value: 'over100', label: '10만 원 이상', desc: '특별한 자리예요', min: 100000 },
];

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
  romantic: { label: '다정', hint: '상대의 마음을 먼저 헤아릴 때' },
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
  'south-africa': '남아프리카',
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
  germany: '독일',
  russia: '러시아',
  usa: '미국',
  bermuda: '버뮤다',
  ukraine: '우크라이나',
  portugal: '포르투갈',
  egypt: '이집트',
  israel: '이스라엘',
  iran: '이란',
  persia: '페르시아',
  bulgaria: '불가리아',
  africa: '아프리카',
  china: '중국',
  japan: '일본',
  korea: '한국',
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
  attribution: '김소월, 〈산유화〉(1925)',
};
