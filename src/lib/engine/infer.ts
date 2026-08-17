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
 * 꽃 이름 키워드 → flowers.csv 의 id. 카탈로그 **59종 전수**의 한국어명을 **부분 일치**로 잡는다
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
 * ⚠ 이름이 **다른 꽃의 이름을 품는 것**은 이제 괜찮다 — `matchKeys` 가 최장일치를 하므로
 *   `수레국화` 는 수레국화만, `삼색제비꽃` 은 팬지만 건다(2026-08-17 이전에는 둘 다
 *   단서를 둘로 만들어서 표준명·별칭을 아예 못 넣고 있었다). 자세한 사정은 그 함수 주석.
 *
 * ⚠ 그래도 **한국어 이름이 다른 식물과 겹치는 꽃**은 겹치는 쪽 이름을 여기 넣지 않는다.
 *   이건 최장일치로 풀 수 있는 문제가 아니다 — 낱말이 같으면 자리도 같아서, 사전이
 *   고를 근거가 없다. 넣는 순간 다른 식물을 말한 사람에게 우리 꽃 칩을 띄우게 된다.
 *   각 줄의 주석이 그 짝을 적어 둔다(확장 배치 1·2, 2026-08-16~17).
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
  /** `삼색제비꽃` 은 '제비꽃'(violet)을 품지만 최장일치가 갈라 준다 — 팬지만 걸린다. */
  pansy: ['팬지', '삼색제비꽃'],
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
  /** 표준명 '수레국화' 가 '국화'(chrysanthemum)를 품는다 — 2026-08-17 최장일치 전에는
   *  단서가 둘이 되어 표준명을 아예 못 싣고 별칭만 남겨 두었다. 이제 실린다. */
  cornflower: ['수레국화', '콘플라워', '센토레아'],
  /** '사프란' 은 넣지 않는다 — 가을에 피는 다른 종(Crocus sativus)이다. */
  crocus: ['크로커스'],
  /** '연꽃' 은 넣지 않는다 — 수련(Nymphaea)과 연꽃(Nelumbo)은 과가 다른 남이다. */
  'water-lily': ['수련'],
  // ── 확장 배치 2 (2026-08-17) — flowers.csv seed-v7 12종 ─────────────────
  // 12종을 넣기 전에 **부분문자열 충돌을 전수 점검했다.** 새 낱말이 기존 낱말을 품는
  // 경우도, 기존 낱말이 새 낱말을 품는 경우도 없었다(브리핑이 짚은 자리 넷을 포함해서 —
  // `매화`↔`벚꽃`·`목화`, `진달래`↔`철쭉`, `치자`, `목화`↔`국화` 는 글자가 겹치지 않는다).
  // 걸린 것은 낱말이 아니라 **이름 자체가 같은 식물**이었고, 그건 아래 주석들이 적어 둔다.
  phalaenopsis: ['호접란', '팔레놉시스'],
  alstroemeria: ['알스트로메리아'],
  anthurium: ['안스리움', '안시리움'],
  /** ⚠ 낱말 '치자' 는 넣지 않는다 — 다른 식물이 아니라 **한국어 어미**에 걸린다
   *  ('고치자'·'마치자'·'합치자'…). 공백을 지우고 부분 일치를 하는 사전이라 그 문장이
   *  통째로 걸린다. 꽃을 뜻할 때 사람들이 쓰는 말은 '치자꽃'·'치자나무' 쪽이다. */
  gardenia: ['치자꽃', '치자나무'],
  eucalyptus: ['유칼립투스', '유칼리'],
  statice: ['스타티스'],
  /** ⚠ '신경초' 는 넣지 않는다 — 잎을 건드리면 접히는 그 풀(Mimosa pudica)은 우리 미모사
   *  (은엽아카시아 Acacia dealbata)와 다른 식물이다. '미모사' 한 낱말은 양쪽을 다 뜻해서
   *  가를 방법이 없고, 꽃집에서 미모사라 부르는 쪽이 우리 꽃이라 그대로 둔다. */
  mimosa: ['미모사'],
  bouvardia: ['부바르디아'],
  /** '체꽃' 은 같은 속(Scabiosa)의 한국 이름이라 함께 싣는다(primula 의 '앵초' 와 같은 판단). */
  scabiosa: ['스카비오사', '체꽃'],
  /** '매실' 은 넣지 않는다 — 같은 나무지만 그 낱말을 적은 사람은 열매(매실차·매실청)를
   *  말하고 있다. 꽃 단서 칩이 뜰 자리가 아니다. */
  'plum-blossom': ['매화'],
  /** ⚠ '철쭉' 은 넣지 않는다 — 진달래(Rhododendron mucronulatum)와 철쭉(R. schlippenbachii)은
   *  같은 속의 다른 종이고, 꽃이 잎보다 먼저 피는지로 갈린다(도판 각주와 같은 사실). */
  azalea: ['진달래'],
  cotton: ['목화'],
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

/** 걸린 낱말 한 자리 — 어느 key 의 낱말이 문장의 `[start, end)` 를 차지했는지. */
interface KeywordHit {
  key: string;
  start: number;
  end: number;
}

/** 사전의 모든 낱말을, 문장에 나온 **자리마다 한 번씩** 모은다(같은 낱말이 두 번 나오면 둘). */
function collectHits(dict: Record<string, readonly string[]>, hay: string): KeywordHit[] {
  const hits: KeywordHit[] = [];
  for (const [key, words] of Object.entries(dict)) {
    for (const word of words) {
      if (word === '') continue; // 빈 낱말은 아래 루프를 멈추지 못한다(사전 오타 방어).
      for (let at = hay.indexOf(word); at !== -1; at = hay.indexOf(word, at + 1)) {
        hits.push({ key, start: at, end: at + word.length });
      }
    }
  }
  return hits;
}

/**
 * 사전 하나를 훑어 걸린 key 를 **사전 선언 순서로** 돌려준다(입력 순서에 흔들리지 않게).
 *
 * ── 최장일치 (2026-08-17) ────────────────────────────────────────────
 * 예전에는 `words.some((word) => hay.includes(word))` 한 줄이었다. 부분 일치라서
 * **긴 이름이 짧은 이름을 품는 순간 단서가 둘이 됐다** — `수레국화` 한 낱말이 수레국화와
 * 국화를 함께 걸었고, 그래서 수레국화의 표준명을 사전에 아예 못 넣고 있었다(팬지의
 * 별칭 `삼색제비꽃` 도 같은 이유로 빠져 있었다). 사전 등록 순서로 피하는 길도 있지만
 * 그건 회피지 처방이 아니다 — 사전이 자랄 때마다 같은 함정이 다시 파인다.
 *
 * 그래서 걸린 **자리(span)** 를 전부 모은 뒤, *다른 key 의 더 긴 자리에 통째로 덮인 자리*를
 * 버린다. 두 가지가 자연히 따라온다.
 *   · `수레국화를 좋아해요` → 국화의 자리 `[2,4)` 가 수레국화의 `[0,4)` 에 덮여 사라진다.
 *   · `수레국화도 국화도 좋아요` → 국화는 덮이지 않은 자리를 따로 가지므로 **둘 다 남는다**
 *     (사람이 둘 다 말했으니 단서도 둘이 맞다).
 * 같은 key 끼리는 덮지 않는다 — 별칭이 서로를 품는 일(`은방울` ⊂ `은방울꽃`)은 흔하고,
 * 그건 어차피 같은 꽃이라 결과가 달라지지 않는다.
 */
function matchKeys(dict: Record<string, readonly string[]>, hay: string): string[] {
  const hits = collectHits(dict, hay);
  const kept = new Set<string>();

  for (const hit of hits) {
    const swallowed = hits.some(
      (other) =>
        other.key !== hit.key &&
        other.start <= hit.start &&
        other.end >= hit.end &&
        other.end - other.start > hit.end - hit.start,
    );
    if (!swallowed) kept.add(hit.key);
  }

  return Object.keys(dict).filter((key) => kept.has(key));
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
