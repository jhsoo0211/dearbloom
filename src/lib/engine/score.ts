import { flowerCueSlug } from './infer';
import { monthFromISO } from './normalize';
import type { FlowerData, RecoInput, RecommendationRuleRow, RuleId, Weights } from './types';

/**
 * 점수식의 여섯 항. `weights.ts` 의 `Weights` 와 같은 어휘다(합 1.0).
 *   I 마음 · R 관계 · S 계절 · A 미감 · P 개인화 · D 다양성
 */
export type ScorePart = 'I' | 'R' | 'S' | 'A' | 'P' | 'D';

export interface ScoreBreakdown {
  /**
   * 0~1.
   *
   * ⚠ **두 걸음짜리 값이다.** `scoreCandidate` 가 돌려줄 때는 D 자리가 비어 있고(0),
   * `diversify()` 가 세 안을 고른 뒤 D 를 채우며 다시 계산한다 — D 는 "이 안이 나머지
   * 두 안과 얼마나 다른가" 라서 집합이 정해지기 전에는 셀 수 없기 때문이다.
   * 화면에 나가는 `fitScore` 는 `buildResults` 가 읽는 **두 번째 걸음의 값**이다.
   */
  total: number;
  parts: Record<ScorePart, number>; // 각 0~1
  matched: RuleId[];
}

export interface ScoredFlower {
  flower: FlowerData;
  score: ScoreBreakdown;
}

/** 개화월 정보가 없는 달의 기본 계절 점수(제철도 비수기도 아닌 중립값). */
const SEASON_OFF = 0.3;
/** 날짜 미입력 시 계절 점수(정보 없음). */
const SEASON_UNKNOWN = 0.5;

/**
 * 자유 서술에서 읽어 낼 것이 하나도 없을 때의 P(정보 없음).
 *
 * **0 이 아니라 중립값**인 것이 요점이다. 에피소드를 적지 않은 사람의 후보는 전부 같은
 * P 를 받으므로 순위가 흔들리지 않고(가산 상수는 순서를 바꾸지 못한다), 그러면서도
 * "모르는 것"을 0점 취급해 점수 상한을 깎지 않는다.
 * 값을 `SEASON_UNKNOWN` 과 같은 0.5 로 둔 것도 같은 이유다 — 이 엔진에서 "정보 없음"은
 * 이미 한가운데로 정해져 있다(위 `SEASON_UNKNOWN` 주석).
 */
const P_NEUTRAL = 0.5;

/**
 * A(미적 취향) 안에서 신호별 배분.
 *
 * 색이 가장 직접적인 신호라 0.6, 분위기 태그 0.4, 향 선호는 보조라 0.3 이다.
 * **들어온 신호끼리만 나눠 갖는다** — 실제 A 는 몫의 합으로 나눈 가중 평균이라
 * 하나만 들어오면 그쪽이 100% 가 되고, 신호가 늘어도 A 는 0~1 을 벗어나지 않는다.
 * (가중치 합 1.0 은 `weights.ts` 의 zod refine 이 지킨다 — 그래서 향 선호를 7번째
 * 가중치로 세우지 않고 A 안에서 나눈다.)
 */
const A_COLOR_SHARE = 0.6;
const A_TRAIT_SHARE = 0.4;
const A_FRAGRANCE_SHARE = 0.3;

/**
 * P(개인화) 안에서 신호별 배분. A 와 **같은 문법**이다 — 들어온 신호끼리만 몫을 나눈다.
 *
 *   이름 1.0 — 사용자가 그 꽃의 이름을 직접 적었다. 가장 강하고 가장 덜 모호한 신호다.
 *   미감 0.6 / 색 0.5 / 계절 0.3 — 이야기에서 읽어 낸 결·색·때.
 *     색보다 미감을 앞에 둔 것은, 색은 A 가 이미 한 번 세기 때문이다(사용자가 고른 색 칩).
 *     계절이 가장 낮은 것은 "봄에 만났다"가 "봄에 피는 꽃을 준다"로 곧장 이어지지는
 *     않기 때문이다 — 거들 뿐 이끌지는 못하는 신호다.
 */
const P_NAMED_SHARE = 1.0;
const P_TRAIT_SHARE = 0.6;
const P_COLOR_SHARE = 0.5;
const P_MONTH_SHARE = 0.3;

/** flowers.csv 의 fragrance_level 최댓값. 0~3 을 0~1 로 옮길 때 쓴다. */
const MAX_FRAGRANCE_LEVEL = 3;

/** 두 문자열 목록의 교집합 비율(기준: 사용자가 준 목록의 길이). */
function overlapRatio(userValues: string[], flowerValues: string[]): number {
  const owned = new Set(flowerValues.map((v) => v.trim().toLowerCase()));
  const hit = userValues.filter((v) => owned.has(v.trim().toLowerCase())).length;
  return clamp01(hit / userValues.length);
}

/** 위와 같되 달(1~12) 목록용. */
function monthOverlapRatio(cueMonths: number[], bloomMonths: number[]): number {
  const owned = new Set(bloomMonths);
  const hit = cueMonths.filter((m) => owned.has(m)).length;
  return clamp01(hit / cueMonths.length);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** (값, 몫) 목록의 가중 평균. 신호가 하나도 없으면 undefined — 부르는 쪽이 중립값을 정한다. */
function weightedAverage(signals: { value: number; share: number }[]): number | undefined {
  const shareSum = signals.reduce((sum, s) => sum + s.share, 0);
  if (shareSum === 0) return undefined;
  return round4(signals.reduce((sum, s) => sum + s.value * s.share, 0) / shareSum);
}

function bestFit(rows: RecommendationRuleRow[]): number {
  let best = 0;
  for (const row of rows) {
    /*
     * rules.csv 는 추천(fitScore)과 회피(avoidReason) 행을 같은 타입으로 싣는다.
     * 회피 행의 빈 fitScore를 기본 만점으로 해석하면, 피하라고 적은 꽃에 오히려
     * I/R 가점이 붙는다. 점수 단계에서는 명시적인 추천 점수만 사용한다.
     *
     * ⚠ **규칙표가 자라도 눈금은 안 무너진다.** 이 값은 합이 아니라 **최댓값**이고 각 행이
     *   `fitScore/100` 으로 먼저 정규화되므로, 행이 7개든 150개든 I·R 은 0~1 안에 있다.
     *   달라지는 것은 분포다 — 규칙이 늘면 I·R 이 0 인 꽃이 줄어 후보들이 서로 가까워진다.
     *   합성 규칙 195행(가점 177 · 회피 18 · fit_score 70~92)으로 42개 입력을 돌려 본 결과
     *   fitScore 는 47~73 에 머물렀고 1위−3위 평균 격차는 10.9 였다(2026-08-18 실측).
     *   후보가 가까워질수록 P(0.10)·D(0.05)의 발언권이 커진다 — 지금 규칙 7행에서 I·R 이
     *   0.55 를 독식하느라 P 가 상위 3안을 못 바꾸는 자리가 있는데, 규칙 병합이 그 자리를
     *   좁혀 준다. 즉 이 항들은 규칙 확장에 **역행하지 않고 함께 살아난다**.
     */
    if (row.fitScore === undefined) continue;
    const fit = clamp01(row.fitScore / 100);
    if (fit > best) best = fit;
  }
  return best;
}

/* ------------------------------------------------------------------ *
 * P(개인화) — 적어 준 이야기를 꽃의 실제 데이터에 맞춘다
 * ------------------------------------------------------------------ */

/**
 * 이야기 낱말 한 묶음 → 꽃의 실제 컬럼.
 *
 * 어휘는 **카탈로그가 실제로 쓰는 값만** 쓴다 — `tags` 는 flowers.csv 의 aesthetic_tags
 * (calm·vivid·cute·elegant·minimal), `colors` 는 같은 파일의 colors, `months` 는 bloom_months.
 * 사전에 없는 값을 적으면 아무 꽃과도 겹치지 않아 조용히 죽는다(테스트가 이를 막는다).
 */
export interface CueRule {
  readonly stems: readonly string[];
  readonly tags?: readonly string[];
  readonly colors?: readonly string[];
  readonly months?: readonly number[];
}

/**
 * 자유 서술 → 꽃 속성 대응표 (§1.5j P 점수).
 *
 * ── 왜 `infer.ts` 와 따로 두는가 ──────────────────────────────────────
 * `infer.ts` 의 사전은 **형용사**를 읽는다("조용한 사람" → calm). 그것은 화면 칩과
 * `recipientTraits`·`colorPrefs` 로 가고, 그래서 이미 A 가 센다. 여기 사전이 읽는 것은
 * **장면과 사건**이다("바다", "졸업", "다퉜어요") — 형용사 사전으로는 잡히지 않고,
 * 사람이 에피소드 칸에 실제로 적는 말은 대부분 이쪽이다. 두 사전이 겹치지 않으므로
 * P 는 A 가 못 보는 자리를 본다.
 *
 * ── 규칙 ─────────────────────────────────────────────────────────────
 *  · **결정적이다.** LLM 도 난수도 없다. 같은 문장은 언제나 같은 단서가 된다.
 *  · **못 읽으면 침묵한다.** 하나도 안 걸리면 P 는 중립값이고 순위는 그대로다
 *    (`infer.ts` 와 같은 태도 — 억측보다 침묵).
 *  · **원문은 여기서 끝난다.** 돌려주는 것은 태그·색·달 뿐이고, 원문 조각은 반환값에도
 *    `matched` 에도 담지 않는다(§1.5j 후퇴 금지선).
 *
 * ⚠ **낱말은 두 글자 이상, 어미에 걸리지 않는 것만 넣는다.** `infer.ts` 가 '치자'에서
 *   배운 함정이 여기도 그대로 있다. 그래서 아래에서 뺀 낱말들:
 *     '산'(계산·생산) · '물'(선물·물론) · '별'(특별) · '눈'(눈치·눈물) · '차'(기차·차분)
 *     · '비'(준비·비슷) · '길'(길다) · '기타'(그 기타 등등, 게다가 상황 칩의 `기타` 라벨)
 *     · '이사'(…이 사실 → 공백을 지우면 걸린다)
 *   `봄` 은 홀로 두면 '해 봄·가 봄' 같은 명사형 어미에 걸려서 `봄에`·`봄날` 처럼 붙여 적는다.
 *
 * ⚠ **여기서는 공백을 지우지 않는다.** `infer.ts` 는 "차 분한" 을 잡으려고 공백을 없애지만,
 *   이 사전의 낱말은 띄어 쓸 일이 없는 명사라 공백을 없애 봐야 없던 낱말만 생긴다
 *   ("그것이 사실" → '이사'). 공백을 남기는 쪽이 오탐이 적다.
 */
export const CUE_LEXICON: readonly CueRule[] = [
  // ── 풍경·장소 ──────────────────────────────────────────────────────
  { stems: ['바다', '해변', '파도', '해안', '등대', '서핑'], tags: ['calm'], colors: ['blue', 'white'] },
  { stems: ['하늘', '밤하늘', '구름', '별빛', '은하수'], tags: ['calm'], colors: ['blue', 'white'] },
  // '숲' 한 글자는 넣지 않는다(아래 ⚠ 규칙) — 조사가 붙은 꼴을 대신 적는다.
  { stems: ['숲에', '숲을', '숲길', '숲속', '정원', '수목원', '식물원', '텃밭', '산책'], tags: ['calm'], colors: ['green', 'white'] },
  { stems: ['등산', '산행', '캠핑', '계곡'], tags: ['vivid'], colors: ['green'] },
  { stems: ['카페', '독서', '도서관', '서점', '책방'], tags: ['calm', 'minimal'], colors: ['cream', 'white'] },
  { stems: ['노을', '석양', '일몰'], tags: ['calm'], colors: ['orange', 'pink'] },
  { stems: ['햇살', '햇빛', '햇볕'], tags: ['vivid'], colors: ['yellow'] },
  { stems: ['빗소리', '우산', '장마'], tags: ['calm'], colors: ['blue'] },

  // ── 계절 (때만 가리키는 낱말은 달만 준다 — 색·결까지 짐작하지 않는다) ──
  { stems: ['봄에', '봄날', '봄바람', '봄꽃', '새봄'], months: [3, 4, 5] },
  { stems: ['여름', '휴가', '바캉스', '물놀이'], months: [6, 7, 8] },
  { stems: ['가을', '단풍', '낙엽'], months: [9, 10, 11], colors: ['orange', 'yellow'] },
  { stems: ['겨울', '첫눈', '함박눈', '눈사람', '크리스마스', '성탄'], months: [12, 1, 2], colors: ['white', 'red'] },

  // ── 사건 ───────────────────────────────────────────────────────────
  { stems: ['결혼', '웨딩', '신혼', '청혼', '프러포즈', '혼인'], tags: ['elegant'], colors: ['white', 'cream'] },
  { stems: ['졸업', '입학', '합격', '취업', '승진', '개업', '이직', '첫 출근', '첫출근'], tags: ['vivid'], colors: ['yellow'] },
  { stems: ['생일', '파티', '축하', '기념일'], tags: ['vivid', 'cute'], colors: ['pink', 'yellow'] },
  { stems: ['여행', '기차', '비행기', '공항', '배낭'], tags: ['vivid'] },
  { stems: ['병원', '입원', '수술', '몸살', '감기', '지쳐', '지친', '힘들', '힘든', '번아웃'], tags: ['calm'], colors: ['white', 'green'] },
  { stems: ['이사했', '이사하', '새집', '집들이', '자취'], tags: ['minimal'], colors: ['white', 'green'] },
  { stems: ['다퉜', '다툰', '싸웠', '미안', '사과'], tags: ['calm'], colors: ['white'] },

  // ── 취향·물건 ──────────────────────────────────────────────────────
  { stems: ['베이킹', '디저트', '케이크', '제빵', '쿠키', '마카롱'], tags: ['cute'], colors: ['cream', 'pink'] },
  { stems: ['음악', '피아노', '바이올린', '공연', '콘서트', '합창'], tags: ['elegant'] },
  { stems: ['커피', '홍차', '티타임', '에스프레소', '라떼'], tags: ['calm'], colors: ['cream'] },
  { stems: ['러닝', '마라톤', '자전거', '요가', '헬스', '수영'], tags: ['vivid'] },
  { stems: ['사진', '카메라', '필름'], tags: ['minimal'] },
  { stems: ['아기', '조카', '유치원', '초등학'], tags: ['cute'], colors: ['pink', 'white'] },
  { stems: ['강아지', '고양이', '반려견', '반려묘'], tags: ['cute'] },
  { stems: ['드레스', '정장', '한복', '화장품', '향수'], tags: ['elegant'] },
];

/** 이야기에서 읽어 낸 것. 원문은 담기지 않는다(§1.5j). */
export interface CueSignals {
  /** aesthetic_tags 어휘. 사전 등장 순서로 중복 없이. */
  tags: string[];
  /** colors 어휘. */
  colors: string[];
  /** 이야기가 가리키는 달(1~12). */
  months: number[];
  /** 사용자가 이름을 직접 부른 꽃의 id(`flower:` 단서). */
  flowerIds: string[];
}

/** 이 이야기에서 읽어 낸 것이 하나라도 있는가. 없으면 P 는 중립값이다. */
export function hasCueSignal(signals: CueSignals): boolean {
  return (
    signals.flowerIds.length > 0 ||
    signals.tags.length > 0 ||
    signals.colors.length > 0 ||
    signals.months.length > 0
  );
}

/**
 * `personalCues` 를 훑어 꽃 속성으로 옮긴다.
 *
 * 들어오는 값은 두 갈래다 — 자유 서술 원문(수신자 메모·에피소드)과 `flower:<slug>` 단서
 * (`infer.ts` 가 이미 읽어 둔 꽃 이름). 앞엣것만 사전에 태우고 뒤엣것은 id 로 바로 쓴다.
 */
export function readCues(cues: readonly string[] = []): CueSignals {
  const tags = new Set<string>();
  const colors = new Set<string>();
  const months = new Set<number>();
  const flowerIds = new Set<string>();

  for (const cue of cues) {
    const slug = flowerCueSlug(cue);
    if (slug !== undefined) {
      // `flower:tulip-white` 는 이미 해석된 단서다. 사전에 다시 태우지 않는다
      // (슬러그의 영문 조각이 낱말에 걸리는 사고를 애초에 막는다).
      if (slug !== '') flowerIds.add(slug);
      continue;
    }

    const hay = cue.toLowerCase().replace(/\s+/g, ' ');
    if (hay.trim() === '') continue;

    for (const rule of CUE_LEXICON) {
      if (!rule.stems.some((stem) => hay.includes(stem))) continue;
      for (const tag of rule.tags ?? []) tags.add(tag);
      for (const color of rule.colors ?? []) colors.add(color);
      for (const month of rule.months ?? []) months.add(month);
    }
  }

  return {
    tags: [...tags],
    colors: [...colors],
    months: [...months],
    flowerIds: [...flowerIds],
  };
}

/** P 한 송이분. */
export interface PersonalScore {
  /** 0~1. 읽어 낸 단서가 없으면 `P_NEUTRAL`. */
  value: number;
  /** 사용자가 **이 꽃의 이름**을 적었는가. */
  named: boolean;
  /** 이야기에서 읽어 낸 것이 있었는가(없으면 value 는 중립값이고 전 후보가 동점이다). */
  grounded: boolean;
}

/**
 * 이 꽃이 "적어 준 이야기"와 얼마나 닿는가.
 *
 * A 와 같은 규칙으로, **들어온 신호끼리만** 몫을 나눈 가중 평균이다. 이름 단서가 있으면
 * 이름 축이 서고(그 꽃이면 1, 아니면 0), 사전이 읽어 낸 결·색·때가 있으면 그 축이 선다.
 *
 * ── recipientTraits·colorPrefs 를 여기서 다시 세지 않는 이유 ─────────────
 * 그 둘은 A 의 재료다. P 에서 한 번 더 세면 ⑴ 칩 하나가 점수를 두 번 움직이고
 * ⑵ **이야기를 한 줄도 적지 않은 사람의 P 가 후보마다 달라진다** — 칩만 고른 사용자의
 * 추천 순서가 P 때문에 뒤집힌다는 뜻이라, "단서가 없으면 전 후보 동점"이라는 이 항의
 * 약속과 정면으로 부딪힌다. 그래서 P 의 입력은 `personalCues` 하나로 못박는다.
 * (자유 서술에서 읽어 낸 분위기·색은 어차피 `build-result` 가 `recipientTraits`·
 * `colorPrefs` 에 병합해 A 로 보내므로, 에피소드는 A 와 P 두 길로 이미 반영된다.)
 */
export function scorePersonal(f: FlowerData, signals: CueSignals): PersonalScore {
  if (!hasCueSignal(signals)) return { value: P_NEUTRAL, named: false, grounded: false };

  const named = signals.flowerIds.includes(f.id);
  const parts: { value: number; share: number }[] = [];

  if (signals.flowerIds.length > 0) {
    parts.push({ value: named ? 1 : 0, share: P_NAMED_SHARE });
  }
  if (signals.tags.length > 0) {
    parts.push({ value: overlapRatio(signals.tags, f.aestheticTags), share: P_TRAIT_SHARE });
  }
  if (signals.colors.length > 0) {
    parts.push({ value: overlapRatio(signals.colors, f.colors), share: P_COLOR_SHARE });
  }
  if (signals.months.length > 0) {
    parts.push({ value: monthOverlapRatio(signals.months, f.bloomMonths), share: P_MONTH_SHARE });
  }

  return { value: weightedAverage(parts) ?? P_NEUTRAL, named, grounded: true };
}

/* ------------------------------------------------------------------ *
 * 적합도
 * ------------------------------------------------------------------ */

/**
 * 후보 한 송이의 적합도.
 *   I: 규칙표에서 intent가 일치하는 행의 fitScore(0~100 → 0~1) 최댓값
 *   R: 규칙표에서 relationship이 일치하는 행의 fitScore 최댓값
 *   S: dateISO의 월이 bloomMonths에 있으면 1, 없으면 0.3, 날짜가 없으면 0.5
 *   A: 미적 취향. 색 선호(colorPrefs ∩ flower.colors)·페르소나 태그
 *      (recipientTraits ∩ flower.aestheticTags)·향 선호(fragrancePreference 일 때
 *      fragranceLevel/3)의 가중 평균(0.6 / 0.4 / 0.3). 들어온 신호끼리만 몫을 나누므로
 *      한 가지만 입력되면 그쪽이 100%, 아무것도 없으면 신호 없음 → 0.
 *   P: 개인화. `personalCues`(수신자 메모·에피소드 원문 + `flower:` 단서)를 사전으로 읽어
 *      그 꽃의 aestheticTags·colors·bloomMonths 와 맞춘다(`scorePersonal`).
 *      읽어 낼 것이 없으면 **중립값 0.5** — 전 후보가 같은 값을 받아 순위는 그대로다.
 *   D: 다양성. **여기서는 0 이다** — 세 안이 정해져야 셀 수 있는 값이라 `diversify()` 가
 *      채운다(`ScoreBreakdown.total` 주석의 "두 걸음"). 식에는 자리를 남겨 둔다.
 *
 * intent 가 'other'(직접 쓴 마음)이면 I 는, relationship 이 'other'(직접 쓴 사이)이면 R 은
 * 규칙표를 보지 않고 0 이다 — §1.5l.
 *
 * ⚠ 결정적이다 — `Math.random`·`Date.now` 를 쓰지 않는다. 같은 입력은 언제나 같은 점수다.
 */
export function scoreCandidate(
  f: FlowerData,
  input: RecoInput,
  rules: RecommendationRuleRow[],
  w: Weights,
): ScoreBreakdown {
  const rows = rules.filter((r) => r.flowerId === f.id);
  const matched: RuleId[] = [];

  /*
   * §1.5l — 'other' 는 사용자가 직접 적은 마음이라 규칙표에 짝이 될 행이 없다.
   * 필터로도 자연히 0 이 나오지만, "우연히 0" 과 "일부러 중립" 은 다르다.
   * 나중에 규칙표에 other 행이 들어와도 상황 가점이 살아나지 않게 여기서 못박는다.
   */
  const intentRows =
    input.intent === 'other'
      ? []
      : rows.filter((r) => r.intent !== undefined && r.intent === input.intent);
  const I = bestFit(intentRows);
  if (I > 0) matched.push('SC_INTENT');

  /*
   * §1.5l — 관계의 'other' 도 마음의 'other' 와 같은 약속이다(바로 위 주석 참고).
   * 사용자가 직접 적은 사이라 규칙표에 짝이 될 행이 없고, 나중에 other 행이 들어와도
   * 관계 가점이 살아나지 않게 여기서 못박는다.
   */
  const relationshipRows =
    input.relationship === 'other'
      ? []
      : rows.filter((r) => r.relationship !== undefined && r.relationship === input.relationship);
  const R = bestFit(relationshipRows);
  if (R > 0) matched.push('SC_RELATIONSHIP');

  const month = monthFromISO(input.dateISO);
  let S: number;
  if (month === undefined) {
    S = SEASON_UNKNOWN;
  } else if (f.bloomMonths.includes(month)) {
    S = 1;
    matched.push('SC_SEASON');
  } else {
    S = SEASON_OFF;
  }

  const prefs = input.colorPrefs ?? [];
  const traits = input.recipientTraits ?? [];

  // 들어온 신호만 (값, 몫) 으로 모아 가중 평균한다. 몫의 합으로 나누므로
  // 신호가 하나뿐이면 그 값이 그대로 A 가 된다(기존 동작과 같다).
  const signals: { value: number; share: number }[] = [];

  if (prefs.length > 0) {
    const colorScore = overlapRatio(prefs, f.colors);
    if (colorScore > 0) matched.push('SC_AESTHETIC');
    signals.push({ value: colorScore, share: A_COLOR_SHARE });
  }

  if (traits.length > 0) {
    const traitScore = overlapRatio(traits, f.aestheticTags);
    if (traitScore > 0) matched.push('SC_PERSONA');
    signals.push({ value: traitScore, share: A_TRAIT_SHARE });
  }

  // §1.5l `향기를 좋아해요` — 향이 살아 있는 꽃을 위로 올린다.
  // 반대편(fragranceSensitive)은 점수가 아니라 제외(EX_FRAGRANCE)로 다룬다.
  if (input.fragrancePreference === true) {
    const fragranceScore = clamp01(f.fragranceLevel / MAX_FRAGRANCE_LEVEL);
    if (fragranceScore > 0) matched.push('SC_FRAGRANCE');
    signals.push({ value: fragranceScore, share: A_FRAGRANCE_SHARE });
  }

  // 신호가 하나도 없으면 A 는 0 이다(P 와 달리 중립값을 두지 않는다) — 색도 분위기도
  // 고르지 않은 사용자에게는 A 가 순위를 흔들 자격이 없고, 0 은 전 후보에 똑같이 붙어
  // 순서를 바꾸지 않는다. 상수라는 점에서 중립값과 같은 성질이다.
  const A = weightedAverage(signals) ?? 0;

  // §1.5j — 적어 준 이야기가 순위에 실리는 자리.
  const personal = scorePersonal(f, readCues(input.personalCues));
  const P = personal.value;
  if (personal.named) matched.push('SC_MEMORY_FLOWER');
  else if (personal.grounded && P > P_NEUTRAL) matched.push('SC_PERSONAL');

  /*
   * D 는 아직 0 이다(집합이 없다). 항을 지우지 않고 남겨 두는 이유는 이 한 줄이
   * 명세의 점수식 `0.30I + 0.25R + 0.15S + 0.15A + 0.10P + 0.05D` 그 자체이기 때문이다 —
   * 항이 빠지면 `weightsSchema` 가 강제하는 "합 1.0" 이 화면 값과 어긋난다(감사 P1-1).
   */
  const D = 0;

  const total = round4(w.I * I + w.R * R + w.S * S + w.A * A + w.P * P + w.D * D);

  return { total, parts: { I, R, S, A, P, D }, matched };
}
