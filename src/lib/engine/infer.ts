/**
 * 자유 서술 → 추천 단서 (design-spec §1.5j).
 *
 * 사용자가 3단계에서 적어 준 두 줄("상대방은 어떤 사람인가요?" ·
 * "함께한 기억이나 에피소드가 있나요?")에서 **키워드만** 집어내
 * `recipientTraits` · `colorPrefs` · `personalCues` 를 보강한다.
 *
 * 설계 판단
 *  - **순수 함수다.** LLM 도 fs 도 fetch 도 쓰지 않는다 — 지금 단계의 휴리스틱이고,
 *    LLM 이 붙으면 이 함수는 그대로 두고 memory_context 쪽이 따로 붙는다.
 *  - **못 찾으면 빈 배열이다.** 억지로 하나를 집어내지 않는다. 잘못 짚은 단서가
 *    화면에 칩으로 뜨면("차분한 사람"이라고 적힌 적 없는데) 오히려 신뢰를 깎는다.
 *  - **원문은 여기서 끝난다.** 돌려주는 값에 원문 조각을 담지 않는다
 *    (§1.5j 후퇴 금지선 — 원문은 로그·분석·DB 어디에도 남기지 않는다).
 */

import type { RecipientTrait } from './types';

export interface InferredCues {
  /** 어휘는 RECIPIENT_TRAITS 그대로. 선언 순서(calm→minimal)로 정렬돼 나온다. */
  recipientTraits: RecipientTrait[];
  /** flowers.csv 의 colors 어휘(white·pink·red·yellow·purple·blue·cream). */
  colorPrefs: string[];
  /** 꽃 이름이 나오면 `flower:<slug>` 한 줄. 지금은 표시용이고 P 점수 반영은 후속이다. */
  personalCues: string[];
}

/**
 * 분위기 태그 키워드.
 *
 * 어간까지만 적는다("귀엽"이면 귀엽다·귀여운·귀엽고를 다 잡는다).
 * 사전에 없는 표현은 조용히 지나간다 — 억측보다 침묵이 낫다.
 */
export const TRAIT_KEYWORDS = {
  calm: ['조용', '차분', '잔잔', '고요', '얌전', '담담'],
  vivid: ['화려', '활발', '에너지', '발랄', '쾌활', '밝은', '텐션'],
  cute: ['귀엽', '귀여운', '아기자기', '깜찍', '사랑스'],
  elegant: ['우아', '고급', '단정', '기품', '세련'],
  minimal: ['심플', '미니멀', '깔끔', '군더더기', '단순'],
} as const satisfies Record<RecipientTrait, readonly string[]>;

/**
 * 색 이름 키워드 → flowers.csv 의 colors 어휘.
 *
 * 팔레트 전부가 아니라 사람들이 말로 자주 쓰는 7색만 잡는다.
 * (코랄·자주·주황 같은 색은 자유 서술에서 잘 안 나오고, 잘못 잡으면 색 추천이 통째로 어긋난다.)
 */
export const COLOR_KEYWORDS = {
  white: ['흰', '하양', '하얀', '화이트'],
  cream: ['크림', '아이보리'],
  pink: ['분홍', '핑크'],
  red: ['빨강', '빨간', '붉은', '레드'],
  yellow: ['노랑', '노란', '옐로'],
  purple: ['보라', '퍼플'],
  blue: ['파랑', '파란', '푸른', '블루'],
} as const satisfies Record<string, readonly string[]>;

/**
 * 꽃 이름 키워드 → flowers.csv 의 id. 카탈로그 17종의 한국어명을 **부분 일치**로 잡는다
 * (`흰 튤립` 은 '튤립' 으로, `아시아틱 백합` 은 '백합' 으로 걸린다).
 *
 * 배열 첫 값이 화면에 쓰는 짧은 이름이다(`튤립의 기억` 같은 단서 칩).
 *
 * ⚠ 기술부채: 카탈로그(content/flowers.csv)와 이 표가 따로 논다. 엔진은 순수 TS 라
 * CSV 를 읽지 않기 때문인데, 꽃이 늘면 여기도 한 줄 늘려야 한다
 * (`tests/engine/infer.test.ts` 가 개수를 지킨다).
 */
export const FLOWER_KEYWORDS = {
  'rose-red': ['장미'],
  'tulip-white': ['튤립'],
  freesia: ['프리지아'],
  'lily-asiatic': ['백합'],
  gerbera: ['거베라'],
  anemone: ['아네모네'],
  hellebore: ['헬레보어'],
  hyacinth: ['히아신스'],
  peony: ['작약'],
  hydrangea: ['수국'],
  lavender: ['라벤더'],
  sunflower: ['해바라기'],
  carnation: ['카네이션'],
  lisianthus: ['리시안셔스'],
  ranunculus: ['라넌큘러스'],
  'lily-of-the-valley': ['은방울꽃', '은방울'],
  chrysanthemum: ['국화'],
} as const satisfies Record<string, readonly string[]>;

/** `personalCues` 에 담는 꽃 단서의 접두사. */
export const FLOWER_CUE_PREFIX = 'flower:';

/**
 * 대소문자·공백을 지운 검색용 문자열.
 * "차 분한" 처럼 띄어 쓴 말도 잡으려고 공백을 통째로 없앤다(§1.5j "관용").
 */
function haystack(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '');
}

/** 사전 하나를 훑어 걸린 key 를 **사전 선언 순서로** 돌려준다(입력 순서에 흔들리지 않게). */
function matchKeys(dict: Record<string, readonly string[]>, hay: string): string[] {
  const hits: string[] = [];
  for (const [key, words] of Object.entries(dict)) {
    if (words.some((word) => hay.includes(word))) hits.push(key);
  }
  return hits;
}

/**
 * 자유 서술 한 덩이에서 추천 단서를 뽑아낸다.
 *
 * 매칭이 없으면 세 배열 모두 비어 있다. 같은 단서가 여러 번 나와도 한 번만 담는다
 * (사전을 한 번씩만 훑기 때문에 자연히 중복이 없다).
 *
 * @param text 사용자가 적은 문장. 빈 문자열·공백만 있어도 안전하다.
 */
export function inferCuesFromText(text: string): InferredCues {
  const hay = haystack(text ?? '');
  if (hay === '') return { recipientTraits: [], colorPrefs: [], personalCues: [] };

  return {
    recipientTraits: matchKeys(TRAIT_KEYWORDS, hay) as RecipientTrait[],
    colorPrefs: matchKeys(COLOR_KEYWORDS, hay),
    personalCues: matchKeys(FLOWER_KEYWORDS, hay).map((slug) => `${FLOWER_CUE_PREFIX}${slug}`),
  };
}

/**
 * 여러 덩이(상대방 서술 · 에피소드)를 각각 훑어 합친다.
 *
 * 이어 붙여서 한 번에 훑지 않는 이유: 두 문장을 붙이면 경계에서 없던 낱말이 생길 수 있다
 * (…"차" + "분한"… → '차분'). 따로 훑고 합치면 그럴 일이 없다.
 */
export function inferCuesFromTexts(texts: readonly string[]): InferredCues {
  const traits = new Set<RecipientTrait>();
  const colors = new Set<string>();
  const cues = new Set<string>();

  for (const text of texts) {
    const found = inferCuesFromText(text);
    for (const trait of found.recipientTraits) traits.add(trait);
    for (const color of found.colorPrefs) colors.add(color);
    for (const cue of found.personalCues) cues.add(cue);
  }

  return {
    recipientTraits: [...traits],
    colorPrefs: [...colors],
    personalCues: [...cues],
  };
}

/** `flower:tulip-white` → `tulip-white`. 접두사가 없으면 undefined. */
export function flowerCueSlug(cue: string): string | undefined {
  return cue.startsWith(FLOWER_CUE_PREFIX) ? cue.slice(FLOWER_CUE_PREFIX.length) : undefined;
}

/**
 * 꽃 id → 사람들이 실제로 쓰는 짧은 이름(`tulip-white` → `튤립`).
 * 사전의 첫 낱말이다. 카탈로그의 `nameKo`(`흰 튤립`)와는 일부러 다르다 —
 * 단서 칩은 "적어 준 말"에 가까워야 하기 때문이다(`튤립의 기억`).
 */
export function flowerCueName(slug: string): string | undefined {
  const words: readonly string[] | undefined = (
    FLOWER_KEYWORDS as Record<string, readonly string[] | undefined>
  )[slug];
  return words?.[0];
}
