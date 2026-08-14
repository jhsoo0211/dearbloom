/**
 * 추천 플로우(질문 5문항 → 결과)의 서버·클라이언트 공용 타입.
 *
 * **여기에는 순수 타입만 둔다.** 클라이언트 컴포넌트가 이 파일만 import 하면
 * 엔진(zod 포함)·카탈로그 로더(node:fs)가 브라우저 번들에 섞이지 않는다.
 * 어휘의 원본은 `src/lib/engine/types.ts` 이고, 화면 라벨은 서버에서
 * `src/components/flow/labels.ts` 가 붙여 이 모양으로 내려보낸다.
 */

/** 3D 뷰어가 그릴 절차적 꽃의 형태. 카탈로그의 꽃 slug → 형태 매핑은 labels.ts 가 갖는다. */
export type FlowerForm = 'rose' | 'tulip' | 'spike';

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

/** 질문 화면이 서버에서 받아 가는 선택지 묶음. */
export interface WizardOptions {
  relationships: ChoiceOption[];
  intents: ChoiceOption[];
  traits: ChoiceOption[];
  colors: ColorChoice[];
  pets: ChoiceOption[];
  budgets: ChoiceOption[];
}

/** 질문 화면이 서버 액션에 보내는 답변. 검증·정규화는 전부 서버가 한다. */
export interface WizardSubmission {
  relationship: string;
  intent: string;
  recipientTraits: string[];
  colorPrefs: string[];
  pets: string[];
  fragranceSensitive: boolean;
  personalCue: string;
  budgetKey: string;
  dateISO: string;
}

/** 결과 화면의 색 칩 한 칸(= 엔진 ColorOption + 화면 표기). */
export interface ResultColorChip {
  value: string;
  label: string;
  hex: string;
  needsRing?: boolean;
  /** 그 색의 꽃말. 출처를 찾은 색에만 있다. */
  meaningKo?: string;
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
  /** §1.5f — 창작 이야기는 반드시 라벨을 달아 사실처럼 보이지 않게 한다. */
  isOriginal: boolean;
  originalLabel?: string;
  /** `이야기의 갈래 — …` 각주(§1.5d). 창작 이야기는 출처가 면제라 없을 수 있다. */
  sourceNote?: string;
  confidenceLabel: string;
  regionLabel?: string;
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
  /** 배지 옆 한 줄(예: `고양이·강아지 비독성`). */
  summary: string;
  /** 접었다 펴는 상세 문장들. */
  details: string[];
  /** 위험할 때 대신 권할 꽃 이름. */
  alternatives: string[];
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
  form: FlowerForm;
  flowerId: string;
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
}

/** 멘트 한 톤. */
export interface ToneView {
  key: string;
  label: string;
  hint: string;
  /** 카탈로그 템플릿 문장. 아직 없는 톤이면 비어 있다. */
  body?: string;
  /** 템플릿을 못 찾았을 때 보여 줄 안내. */
  emptyNote?: string;
}

/** §1.5e 함께 담을 한 줄. */
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
  quote: QuoteView;
  /** 멘트가 아직 LLM 이 아니라 준비된 예문이라는 고지. */
  messageNote: string;
}

/** 서버 액션의 응답. 실패도 화면이 다룰 수 있게 값으로 돌려준다. */
export type FlowResponse =
  | { ok: true; payload: ResultPayload }
  | { ok: false; message: string };
