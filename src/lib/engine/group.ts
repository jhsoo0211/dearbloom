import { z } from 'zod';
import { diversify } from './diversity';
import { exclude } from './exclude';
import { buildResults } from './explain';
import { recommend } from './index';
import { intentSchema, normalizeInput, relationshipSchema, speciesSchema } from './normalize';
import { scoreCandidate } from './score';
import type { ScoreBreakdown, ScorePart, ScoredFlower } from './score';
import type {
  FlowerData,
  FlowerRef,
  Intent,
  RecipientTrait,
  RecoInput,
  RecoResult,
  RecommendationRuleRow,
  Relationship,
  RuleId,
  RuleSet,
  Species,
  Weights,
} from './types';
import { DEFAULT_WEIGHTS } from './weights';

/** 한 번에 다룰 수 있는 인원 상한(원문 리서치 §24). */
export const MAX_GROUP_MEMBERS = 10;

/** 단체 부케 한 다발에 담는 꽃 종류 상한. */
export const MAX_BOUQUET_FLOWERS = 3;

/** 멤버가 관계를 밝히지 않았을 때 쓰는 기본 관계(팀·모임 맥락). */
const DEFAULT_RELATIONSHIP: Relationship = 'friend';

/** 반려동물 사유 문장에 쓰는 표기. */
const PET_KO: Record<Species, string> = { cat: '반려묘', dog: '반려견' };

/** 그 멤버 한 사람 때문에 생긴 제외인지(예산은 그룹 공통이라 제외). */
const MEMBER_SPECIFIC_RULES: ReadonlySet<RuleId> = new Set<RuleId>([
  'EX_PET_TOXIC',
  'EX_FRAGRANCE',
  'EX_DISLIKED',
]);

const SCORE_PARTS = ['I', 'R', 'S', 'A', 'P'] as const satisfies readonly ScorePart[];

export interface GroupMemberInput {
  name: string;
  relationship?: Relationship;
  recipientTraits?: RecipientTrait[];
  colorPrefs?: string[];
  pets?: Species[];
  fragranceSensitive?: boolean;
  dislikedFlowerIds?: string[];
}

export interface GroupInput {
  intent: Intent;
  /** 1~10명. 11명 이상이면 검증 단계에서 throw 한다. */
  members: GroupMemberInput[];
  budgetKrw?: { min?: number; max?: number };
  dateISO?: string;
}

/** 멤버 한 사람의 결과. picks[0]이 배정된 꽃이고 나머지는 대안이다. */
export interface GroupIndividualResult {
  member: GroupMemberInput;
  picks: RecoResult[];
}

export interface GroupBouquetExclusion {
  flower: FlowerRef;
  reason: string;
  /** 이 제외의 사유를 제공한 멤버 이름들. 예산처럼 그룹 공통 사유면 빈 배열. */
  because: string[];
}

export interface GroupBouquetResult {
  /** 부케 구성(최대 3종). */
  flowers: RecoResult[];
  excluded: GroupBouquetExclusion[];
  /** 반려동물 때문에 뺀 꽃이 있을 때만 채우는 안내 한 문장. */
  caution?: string;
}

const budgetSchema = z.object({
  min: z.number().nonnegative().optional(),
  max: z.number().nonnegative().optional(),
});

/**
 * 멤버 한 명의 입력.
 * recipientTraits/dateISO 등 세부 어휘 검증은 멤버별 normalizeInput 이 다시 한다.
 */
export const groupMemberSchema = z.object({
  name: z.string().min(1, { message: '멤버 이름은 비워 둘 수 없습니다.' }),
  relationship: relationshipSchema.optional(),
  recipientTraits: z.array(z.string()).default([]),
  colorPrefs: z.array(z.string()).default([]),
  pets: z.array(speciesSchema).default([]),
  fragranceSensitive: z.boolean().default(false),
  dislikedFlowerIds: z.array(z.string()).default([]),
});

export const groupInputSchema = z.object({
  intent: intentSchema,
  members: z
    .array(groupMemberSchema)
    .min(1, { message: '최소 1명은 있어야 추천할 수 있어요.' })
    .max(MAX_GROUP_MEMBERS, {
      message: `한 번에 최대 ${MAX_GROUP_MEMBERS}명까지 추천할 수 있어요.`,
    }),
  budgetKrw: budgetSchema.optional(),
  dateISO: z.string().optional(),
});

type ParsedGroup = z.infer<typeof groupInputSchema>;
type ParsedMember = ParsedGroup['members'][number];

/** 멤버 한 명 + 그룹 공통 조건을 단일 추천 입력으로 병합한다. */
function toRecoInput(member: ParsedMember, group: ParsedGroup): RecoInput {
  const input: RecoInput = {
    relationship: member.relationship ?? DEFAULT_RELATIONSHIP,
    intent: group.intent,
    colorPrefs: member.colorPrefs,
    dislikedFlowerIds: member.dislikedFlowerIds,
    pets: member.pets,
    fragranceSensitive: member.fragranceSensitive,
    recipientTraits: member.recipientTraits,
  };
  if (group.budgetKrw !== undefined) input.budgetKrw = group.budgetKrw;
  if (group.dateISO !== undefined) input.dateISO = group.dateISO;
  return input;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function distinctNote(nameKo: string): string {
  return `다른 분과 꽃이 겹치지 않도록 ${nameKo}(으)로 바꿔 배정했어요.`;
}

/**
 * 같은 꽃이 여러 명에게 겹치지 않게 그리디로 재배정한다.
 * 입력 순서가 우선이고, 차순위에도 미배정 꽃이 없으면 중복을 그대로 둔다(강제 실패 금지).
 */
function assignDistinct(results: GroupIndividualResult[]): void {
  const taken = new Set<string>();

  for (const result of results) {
    if (result.picks.length === 0) continue;

    const head = result.picks[0];
    if (!taken.has(head.flower.id)) {
      taken.add(head.flower.id);
      continue;
    }

    const altIndex = result.picks.findIndex((p, i) => i > 0 && !taken.has(p.flower.id));
    if (altIndex === -1) continue; // 남은 대안이 전부 이미 배정됨 — 중복 허용

    const [alt] = result.picks.splice(altIndex, 1);
    alt.cautions = [...alt.cautions, distinctNote(alt.flower.nameKo)];
    result.picks.unshift(alt);
    taken.add(alt.flower.id);
  }
}

/**
 * 여러 명에게 각각 다른 꽃을 추천한다.
 * 멤버별로 기존 recommend() 를 돌린 뒤, 배정(picks[0])이 겹치면 차순위로 밀어 분산한다.
 */
export function recommendGroupIndividual(
  input: GroupInput,
  data: RuleSet,
  weights: Weights = DEFAULT_WEIGHTS,
): GroupIndividualResult[] {
  const parsed = groupInputSchema.parse(input);

  const results: GroupIndividualResult[] = parsed.members.map((member, index) => ({
    member: input.members[index],
    picks: recommend(toRecoInput(member, parsed), data, weights),
  }));

  assignDistinct(results);
  return results;
}

interface MemberContext {
  name: string;
  input: RecoInput;
}

interface PetBlock {
  memberName: string;
  species: Species;
  flower: FlowerRef;
}

/** 그 멤버의 반려동물 때문에 통째로 빠지는 꽃들(문구에 쓸 종 정보까지 남긴다). */
function petBlocksFor(flowers: FlowerData[], ctx: MemberContext): PetBlock[] {
  const blocks: PetBlock[] = [];
  for (const flower of flowers) {
    for (const species of ctx.input.pets ?? []) {
      const entry = flower.petSafety.find((p) => p.species === species);
      if (!entry || !entry.toxic) continue;
      if (entry.severity === 'serious' || entry.severity === 'life_threatening') {
        blocks.push({
          memberName: ctx.name,
          species,
          flower: { id: flower.id, nameKo: flower.nameKo },
        });
        break;
      }
    }
  }
  return blocks;
}

/** "지수님의 반려묘를 생각해 아시아틱 릴리은(는) 부케에서 뺐어요." 형태의 한 문장. */
function buildBouquetCaution(blocks: PetBlock[]): string | undefined {
  if (blocks.length === 0) return undefined;
  const first = blocks[0];
  const rest = blocks.length - 1;
  const flowerPart = rest > 0 ? `${first.flower.nameKo} 외 ${rest}건` : first.flower.nameKo;
  return `${first.memberName}님의 ${PET_KO[first.species]}를 생각해 ${flowerPart}은(는) 부케에서 뺐어요.`;
}

/** 멤버 전원의 적합도 평균. matched 는 누구에게든 걸린 규칙의 합집합이다. */
function averageScore(
  flower: FlowerData,
  contexts: MemberContext[],
  rules: RecommendationRuleRow[],
  weights: Weights,
): ScoreBreakdown {
  const sums: Record<ScorePart, number> = { I: 0, R: 0, S: 0, A: 0, P: 0 };
  const matched = new Set<RuleId>();
  let total = 0;

  for (const ctx of contexts) {
    const score = scoreCandidate(flower, ctx.input, rules, weights);
    total += score.total;
    for (const part of SCORE_PARTS) sums[part] += score.parts[part];
    for (const ruleId of score.matched) matched.add(ruleId);
  }

  const n = Math.max(contexts.length, 1);
  const parts = { I: 0, R: 0, S: 0, A: 0, P: 0 } as Record<ScorePart, number>;
  for (const part of SCORE_PARTS) parts[part] = round4(sums[part] / n);

  return { total: round4(total / n), parts, matched: Array.from(matched) };
}

/**
 * 전원에게 안전한 꽃만 남겨 단체 부케 한 다발을 구성한다.
 *   1) 어느 한 멤버라도 강제 제외에 걸리는 꽃은 부케에서 빼고 사유·멤버 이름을 남긴다
 *   2) 남은 후보를 멤버별 적합도 평균으로 정렬
 *   3) diversify 로 최대 3종 선정
 *   4) 반려동물 사유가 있으면 caution 한 문장을 만든다
 * mild_gi 꽃은 빼지 않고 그 결과의 cautions 에 기존 주의 문구를 그대로 붙인다.
 */
export function recommendGroupBouquet(
  input: GroupInput,
  data: RuleSet,
  weights: Weights = DEFAULT_WEIGHTS,
): GroupBouquetResult {
  const parsed = groupInputSchema.parse(input);

  const contexts: MemberContext[] = parsed.members.map((member) => ({
    name: member.name.trim(),
    input: normalizeInput(toRecoInput(member, parsed)),
  }));

  // 1) 안전 교집합
  const blocked = new Map<string, GroupBouquetExclusion>();
  const cautionsByFlower = new Map<string, string[]>();
  const petBlocks: PetBlock[] = [];

  for (const ctx of contexts) {
    const { excluded, cautionsByFlower: memberCautions } = exclude(data.flowers, ctx.input);

    for (const item of excluded) {
      const memberSpecific = MEMBER_SPECIFIC_RULES.has(item.ruleId);
      const prev = blocked.get(item.flower.id);
      if (prev === undefined) {
        blocked.set(item.flower.id, {
          flower: item.flower,
          reason: item.reason,
          because: memberSpecific ? [ctx.name] : [],
        });
      } else if (memberSpecific && !prev.because.includes(ctx.name)) {
        prev.because.push(ctx.name);
      }
    }

    for (const [flowerId, texts] of memberCautions) {
      const merged = cautionsByFlower.get(flowerId) ?? [];
      for (const text of texts) {
        if (!merged.includes(text)) merged.push(text);
      }
      cautionsByFlower.set(flowerId, merged);
    }

    petBlocks.push(...petBlocksFor(data.flowers, ctx));
  }

  // 2) 멤버 평균 적합도로 정렬
  const scored: ScoredFlower[] = data.flowers
    .filter((flower) => !blocked.has(flower.id))
    .map((flower) => ({ flower, score: averageScore(flower, contexts, data.rules, weights) }))
    .sort((a, b) => b.score.total - a.score.total);

  // 3) 최대 3종
  const picked = diversify(scored, MAX_BOUQUET_FLOWERS);

  const bouquetInput: RecoInput = {
    relationship: parsed.members[0].relationship ?? DEFAULT_RELATIONSHIP,
    intent: parsed.intent,
    colorPrefs: Array.from(new Set(contexts.flatMap((ctx) => ctx.input.colorPrefs ?? []))),
  };
  if (parsed.budgetKrw !== undefined) bouquetInput.budgetKrw = parsed.budgetKrw;
  if (parsed.dateISO !== undefined) bouquetInput.dateISO = parsed.dateISO;

  const flowers = buildResults(
    picked,
    scored,
    bouquetInput,
    data.rules,
    cautionsByFlower,
    data.meanings ?? [],
  );

  const result: GroupBouquetResult = {
    flowers,
    excluded: Array.from(blocked.values()),
  };

  // 4) 반려동물 사유 안내
  const caution = buildBouquetCaution(petBlocks);
  if (caution !== undefined) result.caution = caution;

  return result;
}
