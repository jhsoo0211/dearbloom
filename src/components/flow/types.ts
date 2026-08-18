/**
 * 추천 플로우(질문 5문항 → 결과)의 서버·클라이언트 공용 타입.
 *
 * **여기에는 순수 타입만 둔다.** 클라이언트 컴포넌트가 이 파일만 import 하면
 * 엔진(zod 포함)·카탈로그 로더(node:fs)가 브라우저 번들에 섞이지 않는다.
 * 어휘의 원본은 `src/lib/engine/types.ts` 이고, 화면 라벨은 서버에서
 * `src/components/flow/labels.ts` 가 붙여 이 모양으로 내려보낸다.
 */

/**
 * 절차적 꽃의 형태.
 *
 * ⚠ 2026-08-15(#14) 결과 화면이 3D 뷰어를 **실사로 교체**하면서 화면에서는 쓰이지 않는다.
 * 롤백 후보인 `FlowerViewer`·`flowerScene`·`FlowerFallback` 이 이 어휘를 쓰고 있어
 * 타입과 `labels.ts` 의 매핑(`flowerForm()`)은 그대로 둔다 — 되돌릴 때 다시 필요하다.
 *
 * 다만 **결과 payload 에서는 뺐다**(`FlowOptionView.form`). 3안마다 계산해서 클라이언트까지
 * 실어 보냈지만 읽는 코드가 한 곳도 없었다. 되돌릴 때는 이 타입이 여기 있으니 필드만
 * 다시 세우면 된다.
 */
export type FlowerForm = 'rose' | 'tulip' | 'spike';

/**
 * 결과 화면 맨 위에 거는 **대표 실사**(#14). 원본은 `@/lib/photos` 한 벌뿐이고,
 * 서버가 폭·다크 오버레이 여부까지 정해 이 모양으로 내려보낸다.
 *
 * `bright` 는 배경이 밝은 컷 4종(라벤더·안개꽃·은방울꽃·제비꽃)이라는 표시다 —
 * 화면은 이 값으로 BRIGHT_GRADE 필터와 강화 스크림을 건다(랜딩 카드와 같은 규칙).
 */
export interface FlowerPhotoView {
  src: string;
  alt: string;
  /** `Photo: {작가} / Unsplash` — 이미 완성된 한 줄이다. */
  credit: string;
  bright: boolean;
}

/** 라디오·칩 한 칸. value 는 엔진 어휘(slug), label 은 화면 표기. */
export interface ChoiceOption {
  value: string;
  label: string;
  /** 한 줄 설명(선택). */
  desc?: string;
}

/** 색 칩 한 칸. hex 는 §1.4 팔레트와 승인 파생 셰이드 안에서만 고른다. */
export interface ColorChoice {
  value: string;
  label: string;
  hex: string;
  /** 흰색처럼 배경과 구분이 안 되는 색에 테두리를 두른다. */
  needsRing?: boolean;
}

/**
 * §1.5l 시작 프리셋 한 칸 — 누르면 관계·마음을 한 번에 채운다.
 * 값의 원본은 엔진 어휘이고, 짝을 짓는 표는 서버(`labels.ts` PRESET_MOMENTS)에 있다.
 */
export interface PresetOption {
  value: string;
  label: string;
  relationship: string;
  intent: string;
}

/** 질문 화면이 서버에서 받아 가는 선택지 묶음. */
export interface WizardOptions {
  /** §1.5l 시작 프리셋 8종. */
  presets: PresetOption[];
  /** 사이 7종(6종 + `other` = 직접 쓸게요). */
  relationships: ChoiceOption[];
  /** 마음 8종(7종 + `other` = 직접 쓸게요). */
  intents: ChoiceOption[];
  /** §1.5l 받는 분 특징 칩 — 분위기·향·반려동물을 한 그룹으로 합친 목록. */
  recipientChips: ChoiceOption[];
  colors: ColorChoice[];
  /** §1.5l 상황 칩 6종. 자유 서술 위에 선다. */
  episodeHints: ChoiceOption[];
  budgets: ChoiceOption[];
}

/** 질문 화면이 서버 액션에 보내는 답변. 검증·정규화는 전부 서버가 한다. */
export interface WizardSubmission {
  relationship: string;
  /**
   * §1.5l 사이가 `other` 일 때 직접 적은 한 줄(선택, 80자).
   * ⚠ `intentDetail` 과 같은 취급이다 — 추천·멘트에만 쓰고 저장하지 않는다.
   */
  relationshipDetail: string;
  intent: string;
  /**
   * §1.5l 마음이 `other` 일 때 직접 적은 한 줄(선택, 80자).
   * ⚠ 자유 서술과 같은 취급이다 — 추천·멘트에만 쓰고 저장하지 않는다.
   */
  intentDetail: string;
  /** §1.5l 받는 분 특징 칩. 엔진 입력(태그·반려동물·향)으로 나누는 일은 서버가 한다. */
  recipientChips: string[];
  colorPrefs: string[];
  /**
   * §1.5j `그 사람은 어떤 사람인가요?` 자유 서술(선택, 200자).
   * ⚠ 이 값과 `episode` 는 추천·멘트에만 쓰고 로그·DB 어디에도 남기지 않는다.
   */
  recipientNote: string;
  /** §1.5j `함께한 기억이나 에피소드가 있나요?` 자유 서술(선택). 저장하지 않는다. */
  episode: string;
  /** §1.5l 상황 칩. 자유 글과 별개 필드이며 멘트 재료로만 쓴다. */
  episodeHints: string[];
  /**
   * §1.5l 상황 칩에서 `기타` 를 고를 때 직접 적은 한 줄(선택, 80자).
   * ⚠ 자유 서술과 같은 취급 — 저장하지 않는다.
   */
  episodeHintDetail: string;
  budgetKey: string;
  /**
   * §1.5l 예산이 `기타` 일 때 직접 적은 한 줄(선택, 80자).
   *
   * ⚠ 이 값은 **멘트 생성에 넘기지 않는다.** 프롬프트 절대 규칙 3 이 "가격을 문장에 쓰지
   * 않는다" 이므로, 금액이 적힌 글을 <자료> 에 실어 보내는 것은 모델을 금지된 자리로
   * 끌어들이는 미끼가 된다(반려동물·향 민감 칩을 `messageNotes` 에서 빼는 것과 같은 판단).
   * 쓰임은 결과 화면 맥락 칩 하나뿐이고, 저장하지 않는다.
   */
  budgetDetail: string;
  dateISO: string;
}

/** 결과 화면의 색 칩 한 칸(= 엔진 ColorOption + 화면 표기). */
export interface ResultColorChip {
  value: string;
  label: string;
  hex: string;
  needsRing?: boolean;
  /** 이 칩에 붙는 꽃말. 출처를 찾은 색에만 있다. */
  meaningKo?: string;
  /**
   * 위 `meaningKo` 가 **정말 그 색의 것**인가(= `meanings.csv` 에 그 색 행이 있었나).
   *
   * `false` 면 색을 가리지 않는 행에서 온 값이다 — 엔진이 색별 행을 못 찾으면 조용히
   * 그리로 내려가기 때문이다(`explain.ts` 의 `findMeaning`). 화면은 이 값으로 각주를
   * 가른다: 참이면 「{색} {꽃}이 품은 말」, 거짓이면 「색과 무관하게 …」.
   * 갈라 놓지 않으면 색과 상관없는 꽃말에 색 이름을 붙이는 거짓말이 된다.
   */
  meaningIsForColor?: boolean;
  /** §1.5d 이야기 톤으로 옮긴 confidence_level. */
  confidenceLabel?: string;
  isSuggested: boolean;
}

/** 이야기 한 편(화면용). */
export interface StoryCard {
  id: string;
  title: string;
  hook?: string;
  body: string;
  /** §1.5f — 창작 이야기는 라벨을 눈에 띄게 세운다(사실처럼 보이지 않게). 표시 강조에만 쓴다. */
  isOriginal: boolean;
  /** story_type 한국어 라벨(네 갈래 전부). `original` 이면 "dearbloom이 지어 본 이야기예요". */
  typeLabel: string;
  /** `이야기의 갈래 — …` 각주(§1.5d). 창작 이야기는 출처가 면제라 없을 수 있다. */
  sourceNote?: string;
  /** 각주를 링크로 세울 때 쓰는 조각 — 상세 시트에서 원문으로 건너간다(§1.5i). */
  sourceTitle?: string;
  sourceUrl?: string;
  confidenceLabel: string;
  regionLabel?: string;
  /**
   * 이야기의 결(stories.csv 의 moods). 어휘 원본은 엔진의 `StoryMood` 이고
   * 여기서는 필터 비교용 문자열로만 쓴다(클라이언트가 엔진을 import 하지 않게).
   */
  moods: string[];
  /** moods 를 한국어로 옮긴 칩 라벨. moods 와 같은 순서다. */
  moodLabels: string[];
}

/** 이야기 목록 상단의 결 필터 칩 한 칸(§1.5i). `all` 이 `전체`다. */
export interface StoryMoodFilter {
  key: string;
  label: string;
}

/** 나라별 꽃말 표의 한 행. */
export interface CultureMeaningRow {
  regionLabel: string;
  eraLabel?: string;
  meaningKo: string;
  confidenceLabel: string;
}

/** 반려동물 정보 — §1.5h 에 따라 화면에서는 소형 배지 1곳 + 접힌 상세다. */
export interface PetBadge {
  toxic: boolean;
  /** `반려동물 안전` / `반려동물 주의`. */
  label: string;
  /** 배지 옆 한 줄(예: `고양이·강아지에게 알려진 독성이 없어요`). */
  summary: string;
  /** 접었다 펴는 상세 문장들. */
  details: string[];
  /** 위험할 때 대신 권할 꽃 이름. */
  alternatives: string[];
}

/**
 * §1.5k `문학 속의 이 꽃` — 결과 화면의 소형 문학 블록.
 *
 * **있을 때만 세운다.** 31종 중 26종만 검증된 퍼블릭 도메인 발췌를 갖고 있고, 나머지
 * 5종(프리지아·거베라·안개꽃·포인세티아·라넌큘러스)은 근대에 명명돼 고전 문학에
 * 등장하지 않는다. 그 자리를 편집팀 문장으로 메우지 않는 것이 §1.5e "검증된 인용만"
 * 이라, 이 필드는 `undefined` 가 정상 값이다.
 */
export interface LiteratureView {
  /** `quotes.csv` 의 quote_id. 여러 편을 넘겨 볼 때 React 키·자리 계산에 쓴다(#1). */
  id: string;
  /** 발췌 본문(한국어). 세리프 이탤릭으로 세운다. */
  textKo: string;
  /** 원어 원문. 소형으로 병기한다. 한국어 원전이면 없다. */
  textOriginal?: string;
  /** `김유정, 「동백꽃」(1936)` 형태의 각주 한 줄. */
  attribution: string;
  /** `시` `소설` `희곡` `산문` `고전` — 갈래 라벨. */
  typeLabel?: string;
  /** 옮긴이 각주. 자체 번역일 때만 있다. */
  translatorNote?: string;
  /** 종 차이·이름 혼동처럼 밝히지 않으면 틀린 정보가 되는 한 줄. */
  caveat?: string;
  /** 원문으로 건너뛰는 링크. 각주 톤을 지키려고 제목에만 건다(§1.5i). */
  sourceTitle?: string;
  sourceUrl?: string;
}

/** 추천 한 안(3안 중 하나). */
export interface FlowOptionView {
  /** 0·1·2 — RecoResult 순서 그대로다(안심 → 의미 → 대담). */
  index: number;
  /** 세그먼트 라벨: 안심 / 의미 / 대담. */
  segmentLabel: string;
  /** 뷰어 우하단 태그: `01 — Safe choice`. */
  segmentTag: string;
  /** 오버라인 뒤 한국어: `1안 — 가장 안전한 선택 (안심)`. */
  headline: string;
  flowerId: string;
  /** #14 대표 실사. 32종 전원이 갖고 있지만, 없어도 화면은 성립해야 한다(폴백 색면). */
  photo?: FlowerPhotoView;
  nameKo: string;
  scientificName: string;
  fitScore: number;
  /** RuleId → reasonText() 한국어 문장. */
  reasons: string[];
  /** 반려동물 관련 주의(접힌 상세로 내린다 — §1.5h). */
  petCautions: string[];
  /** 그 밖의 주의(그대로 노출한다). */
  otherCautions: string[];
  availabilityLabel: string;
  /** 제철이 아닐 때 대신 권할 꽃 이름. */
  substitutes: string[];
  priceLabel: string;
  /**
   * `flowers.csv` 의 price_band 그대로(1·2·3). 화면은 `₩ ₩₩ ₩₩₩` 세 구간을 **전부**
   * 세워 두고 이 구간까지만 채운다 — "얼마쯤인지"가 아니라 "셋 중 어디인지"를 보여 준다(#11).
   */
  priceBand: 1 | 2 | 3;
  /**
   * 가격 한 줄에 덧붙는 §1.5d 톤 한마디. 지금은 band 1(가장 낮은 구간)에만 붙는다 —
   * 싼 꽃을 고른 사람이 미안해질 자리를 만들지 않는다.
   * ⚠ "가격이 클수록 마음이 크다"는 함의는 어떤 표현으로도 쓰지 않는다(§1.5i).
   */
  priceNote?: string;
  fragranceLabel: string;
  careSummary?: string;
  /** §1.5h `이런 날 건네보세요` 2~3줄. */
  occasions: string[];
  petBadge: PetBadge;
  colors: ResultColorChip[];
  /** 엔진이 그 색을 고른 근거 한 문장. */
  colorReason: string;
  /** 고른 색에 꽃말이 없을 때 대신 보여 줄 그 꽃의 꽃말. */
  fallbackMeaning?: { meaningKo: string; confidenceLabel: string };
  stories: { featured: StoryCard | null; others: StoryCard[] };
  cultureMeanings: CultureMeaningRow[];
  /**
   * §1.5k 문학 속의 이 꽃. 검증된 발췌가 없거나 중복 배제에 걸리면 필드 자체가 없다.
   *
   * #1 로 **다중 반환**이 됐다 — 대표 1편은 그대로 서고, 나머지는 "다른 문학도 보기"
   * 뒤에서 넘겨 본다. 이야기(`stories`)와 같은 `{ featured, others }` 모양을 쓴다.
   */
  literature?: { featured: LiteratureView; others: LiteratureView[] };
}

/** 멘트 한 톤. */
export interface ToneView {
  key: string;
  label: string;
  hint: string;
  /** 멘트 본문. 아직 없는 톤이면 비어 있다. */
  body?: string;
  /** 말문을 여는 한 마디. LLM 이 쓴 멘트에만 있다(템플릿에는 없는 필드다). */
  headline?: string;
  /**
   * 이 톤의 문장이 어디서 왔는지. 없으면 문장 자체가 없다는 뜻이다.
   * 3안이 섞일 수 있어(예: LLM 은 3톤만 쓰고 유쾌 톤은 템플릿) 톤마다 따로 둔다.
   */
  source?: 'llm' | 'template';
  /** 템플릿을 못 찾았을 때 보여 줄 안내. */
  emptyNote?: string;
}

/**
 * 인용 한 줄(본문 + 각주).
 *
 * 화면의 `함께 담을 한 줄` 자리는 2026-08-18 에 걷혔지만(ResultView 의 그 대목 참조)
 * 이 모양은 **서버 안에서** 아직 산다 — `pickQuote()` 가 고른 공용 인용의 작가를
 * 문학 블록이 "한 화면에 같은 작가 두 번 금지" 판정에 쓴다(build-result.ts).
 */
export interface QuoteView {
  textKo: string;
  attribution: string;
}

/** 결과 화면이 통째로 받는 값. 서버 액션이 만들고 URL 에는 싣지 않는다. */
export interface ResultPayload {
  /** 상단 맥락 칩: `연인에게` `사과` `3~5만 원` … */
  contextChips: string[];
  isApology: boolean;
  options: FlowOptionView[];
  tones: ToneView[];
  /** 사과 상황에서 유쾌 톤을 껐다는 각주. 끄지 않았으면 없다. */
  toneOffNote?: string;
  /**
   * 멘트가 어디서 왔는지 한 덩이로 본 값.
   *   `llm`      — 한 톤이라도 이번에 새로 쓴 문장이 있다
   *   `template` — 전부 미리 준비해 둔 예문이다
   *   `empty`    — 보여 줄 문장이 한 톤도 없다
   * 화면 라벨은 톤별 `ToneView.source` 를 보고 세운다. 이 값은 고지 문구·집계용이다.
   */
  messageSource: 'llm' | 'template' | 'empty';
  /** 멘트가 어떻게 만들어졌는지 알리는 각주. */
  messageNote: string;
  /**
   * §1.5j 자유 서술에서 찾아낸 단서 칩(한국어 라벨). 못 찾았으면 비어 있다.
   * 원문이 아니라 **매칭된 단서만** 담는다.
   */
  storyCues: string[];
  /**
   * 사용자가 적어 준 에피소드 원문 — 결과 화면에 그대로 되비추기 위한 값이다.
   * ⚠ 클라이언트 상태로만 살아 있다(§1.5j: 로그·분석·DB 저장 금지).
   */
  episodeText?: string;
  /**
   * §1.5l `직접 쓸게요`·`기타` 로 적어 준 한 줄들의 **원문**(사이·마음·요즘 사이·예산).
   *
   * 맥락 칩이 `직접 쓸게요` 라는 빈 라벨 대신 사용자가 쓴 말을 그대로 세우기 위한 값이고
   * (그 자리에 `직접 쓸게요` 가 서 있으면 우리가 무엇을 들었는지 화면이 못 보여 준다),
   * 화면은 이 목록에 든 칩에만 말줄임 규격을 건다 — 우리가 지은 라벨은 길이를 우리가
   * 정했지만 사용자의 말은 그렇지 않기 때문이다.
   * ⚠ `episodeText` 와 같은 취급이다 — 클라이언트 상태로만 살아 있고 로그·DB 에 남기지 않는다.
   */
  ownWords: string[];
  /** 이야기 목록의 결 필터 칩(전체 + 6종). 화면은 실제로 있는 결만 골라 세운다. */
  storyMoodFilters: StoryMoodFilter[];
}

/** 서버 액션의 응답. 실패도 화면이 다룰 수 있게 값으로 돌려준다. */
export type FlowResponse =
  | { ok: true; payload: ResultPayload }
  | { ok: false; message: string };
