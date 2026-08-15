import { monthFromISO } from './normalize';
import type { ScoredFlower } from './score';
import type {
  ColorOption,
  ColorSuggestion,
  FlowerData,
  FlowerMeaningRow,
  FlowerRef,
  RecoInput,
  RecoResult,
  RecommendationRuleRow,
  RuleId,
  SeasonStatus,
} from './types';

/** RuleId → 사용자에게 보여 줄 한국어 설명. */
export const REASON_TEXTS: Record<RuleId, string> = {
  EX_PET_TOXIC: '반려동물에게 심각한 독성이 있어 후보에서 제외했어요.',
  EX_BUDGET: '설정하신 예산 범위를 벗어나 제외했어요.',
  EX_DISLIKED: '제외하고 싶다고 하신 꽃이라 후보에서 뺐어요.',
  EX_FRAGRANCE: '향에 민감하다고 하셔서 향이 강한 꽃은 제외했어요.',
  SC_INTENT: '전하려는 마음에 잘 맞는 꽃이에요.',
  SC_RELATIONSHIP: '두 분의 관계에 어울리는 선택이에요.',
  SC_SEASON: '지금이 제철이라 상태 좋은 꽃을 구하기 쉬워요.',
  SC_AESTHETIC: '좋아하신다고 하신 색·분위기와 잘 어울려요.',
  SC_PERSONA: '상대의 분위기와 꽃의 인상이 잘 맞아요.',
  SC_FRAGRANCE: '향기를 좋아한다고 하셔서, 향이 살아 있는 꽃으로 골랐어요.',
};

const FALLBACK_REASON = '추천 규칙에 부합하는 선택이에요.';

/** 규칙 식별자의 설명 문장. 사전에 없는 id는 기본 문장으로 대체한다. */
export function reasonText(ruleId: RuleId): string {
  return REASON_TEXTS[ruleId] ?? FALLBACK_REASON;
}

function toRef(s: ScoredFlower): FlowerRef {
  return { id: s.flower.id, nameKo: s.flower.nameKo };
}

function isAdjacentMonth(month: number, bloomMonths: number[]): boolean {
  const prev = month === 1 ? 12 : month - 1;
  const next = month === 12 ? 1 : month + 1;
  return bloomMonths.includes(prev) || bloomMonths.includes(next);
}

/**
 * 개화월과 요청 날짜로 수급 상태를 추정한다.
 * 날짜나 개화월 정보가 없으면 unknown, 개화월이면 in_season,
 * 개화월 직전·직후 달이면 limited, 그 밖은 out_of_season.
 */
export function availabilityFor(bloomMonths: number[], dateISO?: string): SeasonStatus {
  const month = monthFromISO(dateISO);
  if (month === undefined || bloomMonths.length === 0) return 'unknown';
  if (bloomMonths.includes(month)) return 'in_season';
  if (isAdjacentMonth(month, bloomMonths)) return 'limited';
  return 'out_of_season';
}

/** 색 slug → 한국어 표기. 사전에 없으면 slug를 그대로 쓴다. */
const COLOR_LABELS: Record<string, string> = {
  red: '빨강',
  pink: '분홍',
  white: '흰색',
  ivory: '아이보리',
  yellow: '노랑',
  orange: '주황',
  peach: '피치',
  purple: '보라',
  blue: '파랑',
  green: '초록',
};

function colorLabel(color: string): string {
  return COLOR_LABELS[color.toLowerCase()] ?? color;
}

/**
 * 제안할 색 한 가지를 고른다.
 * 선호 색 중 그 꽃이 실제로 가진 색이 있으면 그것을, 없으면 그 꽃의 대표색(colors[0])을 쓴다.
 */
function pickColor(
  colors: string[],
  prefs: string[],
): { color: string; fromPrefs: boolean } | undefined {
  const owned = new Map(colors.map((c) => [c.trim().toLowerCase(), c]));
  for (const pref of prefs) {
    const hit = owned.get(pref.trim().toLowerCase());
    if (hit !== undefined) return { color: hit, fromPrefs: true };
  }
  const fallback = colors[0];
  if (fallback === undefined) return undefined;
  return { color: fallback, fromPrefs: false };
}

/**
 * 그 색에 붙는 꽃말을 찾는다.
 * 색이 정확히 일치하는 행이 우선이고, 없으면 색을 가리지 않는(color 빈 값) 행을 쓴다.
 */
function findMeaning(
  meanings: FlowerMeaningRow[],
  flowerId: string,
  color: string,
): FlowerMeaningRow | undefined {
  const rows = meanings.filter((m) => m.flowerId === flowerId);
  const wanted = color.trim().toLowerCase();
  const exact = rows.find((m) => (m.color ?? '').trim().toLowerCase() === wanted);
  if (exact) return exact;
  return rows.find((m) => (m.color ?? '').trim() === '');
}

/** 색 제안 한 건. 색 정보가 없는 꽃이면 null. */
export function buildColorSuggestion(
  flower: FlowerData,
  input: RecoInput,
  meanings: FlowerMeaningRow[],
): ColorSuggestion | null {
  const picked = pickColor(flower.colors, input.colorPrefs ?? []);
  if (picked === undefined) return null;

  const label = colorLabel(picked.color);
  const suggestion: ColorSuggestion = {
    color: picked.color,
    reason: picked.fromPrefs
      ? `좋아하신다고 하신 ${label} 계열을 이 꽃도 가지고 있어 그 색으로 골랐어요.`
      : `${label}이(가) ${flower.nameKo}을(를) 가장 잘 보여 주는 대표색이라 이 색으로 제안해요.`,
  };

  const meaning = findMeaning(meanings, flower.id, picked.color);
  if (meaning) {
    suggestion.meaningKo = meaning.meaningKo;
    suggestion.sourceId = meaning.sourceId;
  }

  return suggestion;
}

/**
 * 사용자가 색을 다시 고를 수 있도록, 그 꽃이 실제로 나오는 색 전체를 선택지로 편다.
 * 색별 꽃말은 buildColorSuggestion 과 같은 규칙으로 찾는다
 * (색이 일치하는 행 → 색을 가리지 않는 행 → 둘 다 없으면 꽃말 없이 색 이름만).
 * suggestedColor 와 같은 색에는 isSuggested 를 세워 기본 제안이 무엇이었는지 남긴다.
 */
export function buildColorOptions(
  flower: FlowerData,
  meanings: FlowerMeaningRow[],
  suggestedColor?: string,
): ColorOption[] {
  const wanted = suggestedColor?.trim().toLowerCase();
  const seen = new Set<string>();
  const options: ColorOption[] = [];

  for (const raw of flower.colors) {
    const color = raw.trim();
    if (color === '') continue;
    const key = color.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const option: ColorOption = { color, isSuggested: key === wanted };
    const meaning = findMeaning(meanings, flower.id, color);
    if (meaning) {
      option.meaningKo = meaning.meaningKo;
      option.sourceId = meaning.sourceId;
      option.confidenceLevel = meaning.confidenceLevel;
    }
    options.push(option);
  }

  return options;
}

/**
 * 선정된 안을 최종 응답 형태로 바꾼다.
 * fitScore는 0~1 내부 점수를 0~100 정수로 환산한 값이다.
 * substitutes는 같은 intent 규칙에 걸린 차순위 후보 중 아직 추천되지 않은 최대 2개.
 * meanings를 주지 않으면 색과 근거만 제안하고 꽃말은 비운다(출처 없는 꽃말은 싣지 않는다).
 * colorOptions는 사용자가 색을 다시 고를 수 있도록 그 꽃의 색 전체를 함께 싣는다.
 */
export function buildResults(
  picked: ScoredFlower[],
  allScored: ScoredFlower[],
  input: RecoInput,
  rules: RecommendationRuleRow[],
  cautionsByFlower: Map<string, string[]>,
  meanings: FlowerMeaningRow[] = [],
): RecoResult[] {
  const pickedIds = new Set(picked.map((p) => p.flower.id));

  const intentFlowerIds = new Set(
    rules.filter((r) => r.intent !== undefined && r.intent === input.intent).map((r) => r.flowerId),
  );

  const substitutePool = [...allScored]
    .sort((a, b) => b.score.total - a.score.total)
    .filter((s) => !pickedIds.has(s.flower.id) && intentFlowerIds.has(s.flower.id));

  return picked.map((p) => {
    const colorSuggestion = buildColorSuggestion(p.flower, input, meanings);
    return {
      flower: toRef(p),
      fitScore: Math.round(p.score.total * 100),
      reasons: [...p.score.matched],
      cautions: [...(cautionsByFlower.get(p.flower.id) ?? [])],
      substitutes: substitutePool.slice(0, 2).map(toRef),
      availability: availabilityFor(p.flower.bloomMonths, input.dateISO),
      colorSuggestion,
      colorOptions: buildColorOptions(p.flower, meanings, colorSuggestion?.color),
    };
  });
}
