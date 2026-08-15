import { withParticle } from '../text';
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
 * `pet_safety.csv` 의 `toxic_parts` 어휘 → 한국어.
 *
 * 예전에는 이 값을 **영문 slug 그대로**(`주의 부위: bulb, stem`) 화면에 내보냈다.
 * 같은 표가 `components/flow/labels.ts` 에도 있지만 엔진은 컴포넌트를 import 하지 않는다
 * (거꾸로 labels 쪽이 엔진 타입을 가져다 쓴다 — 순환이 된다). 그래서 여기 한 벌을 둔다.
 * ⚠ CSV 에 새 부위가 늘면 **양쪽**을 함께 늘려야 한다. 모르는 값은 slug 를 그대로 쓴다.
 */
const TOXIC_PART_KO: Record<string, string> = {
  bulb: '알뿌리',
  stem: '줄기',
  leaf: '잎',
  flower: '꽃',
  pollen: '꽃가루',
  vase_water: '화병 물',
  root: '뿌리',
  seed: '씨앗',
  sap: '수액',
  bark: '껍질',
  bud: '꽃봉오리',
  berry: '열매',
};

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

/**
 * mild_gi 주의 한 줄.
 *
 * ⚠ 안전 문구는 §1.5h 대로 **직설**이다 — 여기서만 완곡하게 돌리지 않는다.
 *   손본 것은 두 가지뿐이다: 괄호 조사(`은(는)`)와 `(주의 부위: bulb, stem)` 같은
 *   영문 slug 괄호 표기 → 사람이 읽는 한 문장.
 */
function petCaution(f: FlowerData, species: Species, toxicParts: string[]): string {
  const named = toxicParts.map((part) => TOXIC_PART_KO[part] ?? part);
  const parts =
    named.length > 0 ? ` 특히 ${withParticle(named.join('·'), 'object')} 조심해 주세요.` : '';
  return `${withParticle(f.nameKo, 'topic')} ${SPECIES_KO[species]}가 먹으면 가벼운 위장 장애를 일으킬 수 있어요.${parts} 반려동물의 손이 닿지 않는 곳에 두세요.`;
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
          // 안전은 직설(§1.5h) — 조사만 바로잡고 문장의 무게는 그대로 둔다.
          reason: `${withParticle(flower.nameKo, 'topic')} ${SPECIES_KO[species]}에게 심각한 독성이 있어 후보에서 뺐어요.`,
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
        reason: `${withParticle(flower.nameKo, 'topic')} 말씀하신 값보다 조금 위라 이번엔 접어 두었어요.`,
      };
    }

    // 3) 사용자가 뺀 꽃
    if (!blocked && disliked.has(flower.id.toLowerCase())) {
      blocked = {
        flower: toRef(flower),
        ruleId: 'EX_DISLIKED',
        reason: `${withParticle(flower.nameKo, 'topic')} 빼고 싶다고 하셔서 이번엔 담지 않았어요.`,
      };
    }

    // 4) 향 민감
    if (!blocked && input.fragranceSensitive && flower.fragranceLevel >= 2) {
      blocked = {
        flower: toRef(flower),
        ruleId: 'EX_FRAGRANCE',
        reason: `${withParticle(flower.nameKo, 'topic')} 향이 짙어 향에 민감한 분께 부담이 될 수 있어 이번엔 접어 두었어요.`,
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
