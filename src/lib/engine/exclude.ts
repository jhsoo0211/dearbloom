import type { FlowerData, FlowerRef, RecoInput, RuleId, Species } from './types';

export interface ExcludedFlower {
  flower: FlowerRef;
  ruleId: RuleId;
  reason: string;
}

export interface ExcludeResult {
  candidates: FlowerData[];
  excluded: ExcludedFlower[];
  /** flowerId → 제외하지는 않았지만 사용자에게 알려야 할 주의 문구 */
  cautionsByFlower: Map<string, string[]>;
}

const SPECIES_KO: Record<Species, string> = { cat: '고양이', dog: '강아지' };

/**
 * 예산 → 허용 priceBand.
 *   max < 30000 → [1] / max < 50000 → [1,2] / 그 외·미지정 → [1,2,3]
 */
export function allowedPriceBands(maxKrw?: number): Array<1 | 2 | 3> {
  if (maxKrw === undefined) return [1, 2, 3];
  if (maxKrw < 30000) return [1];
  if (maxKrw < 50000) return [1, 2];
  return [1, 2, 3];
}

function toRef(f: FlowerData): FlowerRef {
  return { id: f.id, nameKo: f.nameKo };
}

function petCaution(f: FlowerData, species: Species, toxicParts: string[]): string {
  const parts = toxicParts.length > 0 ? ` (주의 부위: ${toxicParts.join(', ')})` : '';
  return `${f.nameKo}은(는) ${SPECIES_KO[species]}가 먹으면 가벼운 위장 장애를 일으킬 수 있어요${parts}. 반려동물의 손이 닿지 않는 곳에 두세요.`;
}

/**
 * 강제 제외 단계. 적합도 계산 전에 후보를 걸러낸다.
 * 규칙 우선순위(먼저 걸린 규칙 하나만 기록):
 *   1) EX_PET_TOXIC  — 입력 pets 종에 serious/life_threatening 독성이면 제외.
 *                      mild_gi면 제외하지 않고 caution만 남긴다.
 *   2) EX_BUDGET     — 예산으로 허용되지 않는 priceBand
 *   3) EX_DISLIKED   — 사용자가 제외를 요청한 꽃
 *   4) EX_FRAGRANCE  — 향 민감 + fragranceLevel >= 2
 */
export function exclude(flowers: FlowerData[], input: RecoInput): ExcludeResult {
  const pets = input.pets ?? [];
  const disliked = new Set((input.dislikedFlowerIds ?? []).map((id) => id.trim().toLowerCase()));
  const bands = allowedPriceBands(input.budgetKrw?.max);

  const candidates: FlowerData[] = [];
  const excluded: ExcludedFlower[] = [];
  const cautionsByFlower = new Map<string, string[]>();

  for (const flower of flowers) {
    const cautions: string[] = [];
    let blocked: ExcludedFlower | undefined;

    // 1) 반려동물 독성
    for (const species of pets) {
      const entry = flower.petSafety.find((p) => p.species === species);
      if (!entry || !entry.toxic) continue;
      if (entry.severity === 'serious' || entry.severity === 'life_threatening') {
        blocked = {
          flower: toRef(flower),
          ruleId: 'EX_PET_TOXIC',
          reason: `${flower.nameKo}은(는) ${SPECIES_KO[species]}에게 심각한 독성이 있어 제외했어요.`,
        };
        break;
      }
      if (entry.severity === 'mild_gi') {
        cautions.push(petCaution(flower, species, entry.toxicParts));
      }
    }

    // 2) 예산
    if (!blocked && !bands.includes(flower.priceBand)) {
      blocked = {
        flower: toRef(flower),
        ruleId: 'EX_BUDGET',
        reason: `${flower.nameKo}은(는) 설정한 예산 범위를 넘어 제외했어요.`,
      };
    }

    // 3) 사용자가 뺀 꽃
    if (!blocked && disliked.has(flower.id.toLowerCase())) {
      blocked = {
        flower: toRef(flower),
        ruleId: 'EX_DISLIKED',
        reason: `${flower.nameKo}은(는) 제외하고 싶다고 하셔서 후보에서 뺐어요.`,
      };
    }

    // 4) 향 민감
    if (!blocked && input.fragranceSensitive && flower.fragranceLevel >= 2) {
      blocked = {
        flower: toRef(flower),
        ruleId: 'EX_FRAGRANCE',
        reason: `${flower.nameKo}은(는) 향이 강해 향에 민감한 분께는 부담될 수 있어 제외했어요.`,
      };
    }

    if (blocked) {
      excluded.push(blocked);
      continue;
    }

    candidates.push(flower);
    if (cautions.length > 0) cautionsByFlower.set(flower.id, cautions);
  }

  return { candidates, excluded, cautionsByFlower };
}
