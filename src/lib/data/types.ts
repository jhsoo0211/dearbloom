/**
 * 콘텐츠 카탈로그 타입 — "앱이 쓰는 데이터 한 덩어리".
 *
 * 값의 원본은 `content/*.csv`(스키마: `db/seed/schemas.ts`)이고, 여기서는 그것을
 * **엔진 타입(camelCase)** 으로 옮긴 결과의 모양만 정의한다. 어휘(relationship 6종 /
 * intent 7종 / tone 4종 …)는 `src/lib/engine/types.ts` 가 단일 원본이며 여기서 다시
 * 정의하지 않는다.
 *
 * `Catalog` 는 `RuleSet` 을 그대로 확장한다. 즉 `recommend(input, catalog)` 처럼
 * **카탈로그를 엔진에 통째로 넘길 수 있다.** 나중에 CSV 대신 Supabase 에서 읽게 되어도
 * 이 인터페이스만 유지하면 호출부는 그대로다(로더 교체점이 여기 하나).
 */

import type {
  FlowerData,
  FlowerMeaningRow,
  Intent,
  Relationship,
  RuleSet,
  Severity,
  Species,
  StoryRow,
  Tone,
} from '@/lib/engine/types';

/**
 * 엔진 타입에 없지만 화면이 반드시 쓰는 컬럼만 얹은 확장 3종.
 *
 * 엔진 타입(`FlowerData` / `FlowerMeaningRow` / `StoryRow`)은 추천 계산에 필요한 것만
 * 갖고 있다. 하지만 화면에는 "출처가 보이는 꽃말"·"검수 시점"처럼 **신뢰를 보여 주는
 * 값**이 함께 나가야 한다(design-spec §1.5·§1.5b). 그 값을 로더에서 버리면 다음 사람이
 * 로더부터 다시 고쳐야 하므로, 엔진 타입을 그대로 확장해서 실어 보낸다.
 * (확장형은 원본 타입에 그대로 대입되므로 엔진 호출에는 아무 영향이 없다.)
 */

/** flowers.csv — 엔진용 `FlowerData` + 화면용 관리법. */
export interface CatalogFlower extends FlowerData {
  /** 손질·관리 한 줄. CSV 가 비어 있으면 없음. */
  careSummary?: string;
}

/** meanings.csv — 엔진용 `FlowerMeaningRow` + 출처 URL·주의 문구. */
export interface CatalogMeaning extends FlowerMeaningRow {
  /** 출처 링크. 스키마가 필수로 잡고 있어 항상 있다(출처 없는 꽃말은 싣지 않는다). */
  sourceUrl: string;
  /** "이 해석은 조심해서 써 주세요" 류의 편집 주의 문구. */
  cautionNote?: string;
}

/** stories.csv — 엔진용 `StoryRow` + 검수 시점(화면의 `검수 2026.08` 라벨). */
export interface CatalogStory extends StoryRow {
  reviewedAt: string;
}

/** templates.csv 의 length 어휘. */
export type TemplateLength = 'short' | 'medium';

/** quotes.csv 의 license 어휘. `pd` 는 퍼블릭 도메인 근거(sourceUrl) 필수. */
export type QuoteLicense = 'pd' | 'original';

/**
 * 메시지 템플릿 한 줄 (templates.csv).
 * 엔진은 아직 이 표를 쓰지 않는다 — 멘트 생성(LLM) 레이어가 쓸 재료다.
 */
export interface MessageTemplate {
  templateId: string;
  /** 비어 있으면 관계를 가리지 않는 템플릿. */
  relationship?: Relationship;
  intent: Intent;
  tone: Tone;
  length?: TemplateLength;
  /** 사과 멘트에 반드시 들어가야 하는 요소(예: 인정·재발방지). 없으면 빈 배열. */
  requiredApologyElements: string[];
  templateText: string;
  reviewedAt?: string;
}

/** quotes.csv 의 excerpt_type 어휘 — §1.5k 문학 연계. 원본은 `db/seed/schemas.ts`. */
export type ExcerptType = 'poem' | 'novel' | 'play' | 'essay' | 'classic';

/**
 * 인용문 한 줄 (quotes.csv).
 *
 * 두 종류가 한 표에 산다:
 *   - **범용 인용** — `flowerId` 가 없다. 결과 화면의 "함께 담을 한 줄"(§1.5e) 자리.
 *   - **문학 발췌** — `flowerId` 가 있다. 결과 화면의 "문학 속의 이 꽃"(§1.5k) 자리.
 * 둘을 가르는 것은 `flowerId` 하나뿐이라, 조회하는 쪽이 어느 자리인지 정하면 된다.
 *
 * `pd_basis`(퍼블릭 도메인 판정 근거)는 **일부러 여기 없다.** 화면 비노출 컬럼이라
 * 로더가 아예 옮기지 않는다 — 타입에 없으면 실수로 렌더할 수도 없다.
 */
export interface Quote {
  quoteId: string;
  /** 이 발췌가 붙는 꽃. 없으면 꽃을 가리지 않는 범용 인용이다. */
  flowerId?: string;
  excerptType?: ExcerptType;
  textKo: string;
  /** 원어 원문. 화면에 번역과 나란히 소형으로 병기한다. */
  textOriginal?: string;
  author?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  license: QuoteLicense;
  /** 자체 번역·자체 현대어 표기이면 `dearbloom`. 한국어 원전 그대로면 없다. */
  translator?: string;
  era?: string;
  tags: string[];
  /** 화면에 나가는 한 줄 각주(종 차이·이름 혼동·판본 차이). */
  caveat?: string;
  reviewedAt?: string;
}

/**
 * 탄생화 한 줄 (birth_flowers.csv) — **행의 주인은 꽃이 아니라 날짜다.**
 *
 * 366일이 카탈로그 32종보다 훨씬 많은 종을 부르고, 반대로 한 종이 여러 날에 걸리기도 한다
 * (장미 10일 · 국화 4일). 그래서 자연키는 `(month, day)` 이고 `flowerId` 는 **도감으로
 * 건너가는 선택 다리**다 — 비어 있는 것이 정상 값이며(309일이 그렇다) "아직 안 정했다"가
 * 아니라 "카탈로그에 그 꽃이 없다"는 뜻이다.
 *
 * ⚠ 이 표는 **전통적으로 정해진 탄생화가 아니다.** 하루에 한 종씩 꽃을 소개하던 페이지에서
 *   퍼져 널리 통하게 된 목록이다(`docs/birth-flowers-research.md` §2). 화면 문구에서
 *   "전통"·"공식"·"예로부터 정해진" 류 단정을 쓰면 안 된다.
 *
 * `editorial_note` 는 **일부러 여기 없다**(`Quote.pdBasis` 와 같은 판단). 158행에 붙어 있는
 * 메모는 전부 편집·감사용이라 화면에 나갈 값이 아니다 — 타입에 없으면 실수로 렌더할 수도 없다
 * (조사 문서 §8-4).
 */
export interface BirthFlower {
  /** 1~12. */
  month: number;
  /** 1~31. 달력 유효성(2/30 금지·366일 전수)은 시드 교차 검증이 본다. */
  day: number;
  /** 그 날 표가 부르는 이름. 카탈로그 이름과 다를 수 있다(`노랑수선화` ↔ `수선화`). */
  nameKo: string;
  nameEn?: string;
  scientificName?: string;
  /** 카탈로그에 그 꽃이 있을 때만. 없는 것이 정상 값이다. */
  flowerId?: string;
  /** 스키마가 필수로 잡고 있어 항상 있다(꽃말 없는 탄생화는 싣지 않는다). */
  meaningKo: string;
  sourceUrl: string;
}

/**
 * 반려동물 안전성 한 줄 (pet_safety.csv).
 *
 * 꽃별 판정은 `FlowerData.petSafety` 에도 들어가지만, 그쪽에는 대체 꽃 목록이 없다.
 * "위험하다"만 말하고 대안을 못 주는 화면을 막으려면 이 평면 목록이 필요하다.
 */
export interface PetSafetyRecord {
  flowerId: string;
  species: Species;
  toxic: boolean;
  severity: Severity;
  toxicParts: string[];
  safeAlternativeFlowerIds: string[];
  sourceUrl: string;
  reviewedAt: string;
}

/**
 * 앱이 쓰는 콘텐츠 전체.
 * `flowers` / `rules` / `meanings` / `stories` 는 `RuleSet` 필드 그대로라
 * 그대로 엔진에 넘길 수 있다(§ `recommend(input, catalog)`).
 */
export interface Catalog extends RuleSet {
  flowers: CatalogFlower[];
  /** CSV 에 한 행도 없을 수는 있어도, 필드 자체는 항상 존재한다(빈 배열). */
  meanings: CatalogMeaning[];
  stories: CatalogStory[];
  templates: MessageTemplate[];
  quotes: Quote[];
  petSafety: PetSafetyRecord[];
  /**
   * 366일 탄생화 달력. 조회는 `@/lib/data/birth-flowers` 의 순수 함수로 한다
   * (이 배열을 직접 훑는 코드를 화면마다 새로 쓰지 마라).
   */
  birthFlowers: BirthFlower[];
}
