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
 * 꽃 이름 키워드 → flowers.csv 의 id. 카탈로그 **47종 전수**의 한국어명을 **부분 일치**로 잡는다
 * (`흰 튤립` 은 '튤립' 으로, `아시아틱 백합` 은 '백합' 으로 걸린다).
 *
 * 배열 첫 값이 화면에 쓰는 짧은 이름이다(`튤립의 기억` 같은 단서 칩).
 *
 * ⚠ 기술부채: 카탈로그(content/flowers.csv)와 이 표가 따로 논다. 엔진은 순수 TS 라
 * CSV 를 읽지 않기 때문인데, 꽃이 늘면 여기도 한 줄 늘려야 한다.
 * `tests/engine/infer.test.ts` 가 **개수가 아니라 불변식**으로 지킨다 —
 * "모든 key 가 flowers.csv 에 실존" + "카탈로그 전종을 덮는다"(예전에는 17 이라는
 * 스냅샷 숫자를 박아 두어, 꽃이 15종 늘어난 뒤에도 테스트는 초록이었다).
 *
 * ⚠ 별칭을 늘릴 때는 **다른 꽃의 이름을 품지 않는지** 본다. 예를 들어 팬지의 별칭
 *   `삼색제비꽃` 은 '제비꽃'(violet)까지 함께 걸어 단서 두 개를 만든다 — 그래서 뺐다.
 *   같은 이유로 수레국화의 표준명이 여기 없다(아래 `cornflower` 주석).
 *
 * ⚠ **한국어 이름이 다른 식물과 겹치는 꽃**(확장 배치 1, 2026-08-16)은 겹치는 쪽 이름을
 *   여기 넣지 않는다. 사전이 잡을 수 있는 것은 낱말이지 종이 아니라서, 넣는 순간 다른
 *   식물을 말한 사람에게 우리 꽃 칩을 띄우게 된다 — 각 줄의 주석이 그 짝을 적어 둔다.
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
  narcissus: ['수선화', '나르시스'],
  'forget-me-not': ['물망초'],
  'cherry-blossom': ['벚꽃', '벚나무', '사쿠라'],
  camellia: ['동백', '카멜리아'],
  violet: ['제비꽃', '오랑캐꽃'],
  iris: ['아이리스', '붓꽃'],
  marigold: ['마리골드', '메리골드'],
  'corn-poppy': ['개양귀비', '꽃양귀비', '양귀비'],
  jasmine: ['재스민', '자스민', '쟈스민'],
  'babys-breath': ['안개꽃', '안개초'],
  cosmos: ['코스모스', '살사리꽃'],
  magnolia: ['목련', '매그놀리아'],
  pansy: ['팬지'],
  poinsettia: ['포인세티아', '포인세차'],
  daisy: ['데이지'],
  // ── 확장 배치 1 (2026-08-16) — flowers.csv seed-v6 15종 ─────────────────
  'sweet-pea': ['스위트피', '스윗피'],
  gladiolus: ['글라디올러스', '글라디올라스'],
  dahlia: ['달리아', '다알리아'],
  /** '백일홍' 은 배롱나무(목백일홍)와 이름이 겹친다. `목백일홍` 을 적은 사람도 이 줄에 걸리는데,
   *  겹치는 쪽이 카탈로그에 없어 단서가 둘이 되지는 않는다(칩 하나가 어긋날 뿐이다). */
  zinnia: ['백일홍', '지니아'],
  /** '개미취'(참취속 Aster)는 넣지 않는다 — 과꽃은 과꽃속(Callistephus)이라 다른 꽃이다. */
  aster: ['과꽃', '아스터'],
  /** '마리골드' 는 넣지 않는다 — 영어권이 금잔화를 Marigold 라 부르지만 그 이름은
   *  카탈로그의 만수국(`marigold`)이 이미 갖고 있다. 넣으면 단서가 둘이 된다. */
  calendula: ['금잔화', '칼렌듈라'],
  cyclamen: ['시클라멘'],
  geranium: ['제라늄', '제라니움'],
  /** '프림로즈' 는 넣지 않는다 — 국내에서 그 이름은 달맞이꽃(이브닝 프림로즈) 쪽으로 더 자주 간다. */
  primula: ['프리뮬러', '앵초'],
  stock: ['스토크', '비단향꽃무'],
  delphinium: ['델피니움', '델피늄'],
  amaryllis: ['아마릴리스'],
  /** ⚠ 표준명 '수레국화' 를 못 쓴다 — 그 낱말이 '국화'(chrysanthemum)를 품어 단서가 둘이 된다
   *  (팬지의 `삼색제비꽃` 과 같은 사정이고, 이번에는 별칭이 아니라 표준명이 걸렸다).
   *  '수레' 만 잘라 넣는 길도 있지만 수레(車)를 적은 문장까지 걸려 더 나쁘다. */
  cornflower: ['콘플라워', '센토레아'],
  /** '사프란' 은 넣지 않는다 — 가을에 피는 다른 종(Crocus sativus)이다. */
  crocus: ['크로커스'],
  /** '연꽃' 은 넣지 않는다 — 수련(Nymphaea)과 연꽃(Nelumbo)은 과가 다른 남이다. */
  'water-lily': ['수련'],
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
