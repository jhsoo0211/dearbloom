import { z } from 'zod';

import { CUE_LEXICON, FLOWER_KEYWORDS, RECIPIENT_TRAITS, SPECIES } from '@/lib/engine';
import type { RecipientTrait, Species } from '@/lib/engine';

/**
 * 자유 서술 해석(AI 성향·에피소드 층)의 입출력 계약 — design-spec §1.5j.
 *
 * ── 이 층이 하는 일과 하지 않는 일 ───────────────────────────────────
 * **LLM 은 읽기만 하고, 판단은 엔진이 한다.** 사용자가 3단계에 적어 준 자유 서술 두 줄을
 * 모델에게 주고 시키는 것은 단 하나 — **우리 어휘로 번역**하는 것이다. 어떤 꽃을 고를지,
 * 어떤 꽃을 뺄지는 지금까지처럼 전부 엔진이 결정한다(결정적·설명 가능·안전 규칙은 코드
 * 강제). 그래서 이 파일이 여는 출력 칸은 전부 **엔진이 이미 아는 어휘**뿐이고, 그 밖의
 * 값이 오면 조용히 버려진다.
 *
 * ── 어휘 밖 값을 왜 "실패" 가 아니라 "버림" 으로 다루나 ────────────────
 * 이 호출은 결과 화면 **앞에** 선다. 모델이 여섯 칸 중 한 칸에 엉뚱한 낱말을 하나 적었다는
 * 이유로 요청 전체를 실패로 돌리면, 나머지 다섯 칸이 멀쩡한데도 사용자는 4초를 더 기다린
 * 뒤 아무것도 못 얻는다. 그래서 칸마다 따로 거른다 — 알아들은 것만 쓰고 나머지는 없던
 * 일로 한다. **전부 걸러져 빈 값만 남는 것도 정상적인 성공**이다(아래 `parseExtractResponse`).
 *
 * ⚠ 원문은 이 파일을 통과하지 못한다. 출력 칸 어디에도 자유 문자열이 없고
 *   (`personalCues` 조차 사전에 있는 낱말로만 정규화된다), 그것이 §1.5j 의 금지선이다.
 */

/* ------------------------------------------------------------------ *
 * 어휘 — 전부 **이미 있는 표에서 뽑아 온다**
 * ------------------------------------------------------------------ */

/**
 * 색 어휘. `content/flowers.csv` 의 `colors` 컬럼이 실제로 쓰는 13색이다.
 *
 * 여기를 손으로 적어 둔 이유는 이 파일이 CSV 를 읽지 않기 때문이다(순수 TS —
 * `infer.ts` 의 사전이 카탈로그와 따로 노는 것과 같은 사정). 대신
 * `tests/llm/extract.test.ts` 가 **카탈로그와 정확히 같은 집합인지**를 지킨다 —
 * 색이 늘거나 줄면 그 테스트가 먼저 빨개진다.
 */
export const EXTRACT_COLORS = [
  'white',
  'cream',
  'pink',
  'coral',
  'red',
  'magenta',
  'purple',
  'blue',
  'yellow',
  'orange',
  'green',
  'brown',
  'variegated',
] as const;

export type ExtractColor = (typeof EXTRACT_COLORS)[number];

/**
 * 장면 낱말 어휘 — **엔진의 `CUE_LEXICON` 이 아는 낱말 전부**다.
 *
 * 모델에게 "장면을 요약해 줘" 가 아니라 "이 목록에서 골라 줘" 를 시키는 이유가 여기 있다.
 * 엔진의 P(개인화) 항은 이 사전으로만 문장을 읽으므로(`readCues`), 사전에 없는 낱말은
 * 아무 꽃과도 겹치지 않아 **조용히 죽는다**. 목록 밖의 말을 받아 봐야 점수에 닿지 못한 채
 * 원문 조각만 우리 쪽으로 옮겨 오는 셈이라, 개인정보만 늘고 얻는 것은 없다.
 */
export const EXTRACT_SCENE_CUES: readonly string[] = Array.from(
  new Set(CUE_LEXICON.flatMap((rule) => rule.stems)),
);

/**
 * 꽃 id 어휘 — `infer.ts` 의 꽃 이름 사전이 아는 id 전부(카탈로그 전종을 덮는다).
 *
 * 카탈로그와 한 번 더 대조하는 문은 이 뒤에 또 있다(`mentionedFlowerIds` 가 실재하는
 * 꽃만 남긴다). 여기서는 "우리가 이름을 아는 꽃인가" 까지만 본다.
 */
export const EXTRACT_FLOWER_IDS: readonly string[] = Object.keys(FLOWER_KEYWORDS);

/* ------------------------------------------------------------------ *
 * 들어가는 값
 * ------------------------------------------------------------------ */

/**
 * 자유 서술 두 칸의 상한. 화면(§1.5j 200 · 400)과 같은 수를 쓰지만 **따로 둔다** —
 * 이 계약은 화면을 거치지 않은 값도 받을 수 있어야 하고, 그때 마지막 문이 여기다.
 */
export const EXTRACT_NOTE_MAX_CHARS = 200;
export const EXTRACT_EPISODE_MAX_CHARS = 400;

export const extractRequestSchema = z.object({
  /** "그 사람은 어떤 사람인가요?" 원문. */
  recipient_note: z.string().max(EXTRACT_NOTE_MAX_CHARS).default(''),
  /** "함께한 기억이나 에피소드가 있나요?" 원문. */
  episode: z.string().max(EXTRACT_EPISODE_MAX_CHARS).default(''),
});

export type ExtractRequest = z.input<typeof extractRequestSchema>;
export type ExtractRequestParsed = z.output<typeof extractRequestSchema>;

/* ------------------------------------------------------------------ *
 * 나오는 값
 * ------------------------------------------------------------------ */

/**
 * 읽어 낸 것. **여섯 칸 모두 우리 어휘**이고, 자유 문자열은 하나도 없다.
 *
 * 이 모양이 곧 "LLM 이 넘겨받을 수 있는 권한의 전부" 다 — 모델은 이 칸들 밖으로는
 * 아무 영향도 줄 수 없고, 각 칸의 값이 추천에 어떻게 쓰이는지는 전부 기존 엔진 규칙이다.
 */
export interface ExtractedCues {
  /** 받는 분의 분위기(A 항으로 간다 — 칩으로 직접 고른 것과 같은 자리). */
  recipientTraits: RecipientTrait[];
  /** 좋아한다고 읽힌 색(A 항 · 색 제안). */
  colorPrefs: ExtractColor[];
  /** 장면 낱말(P 항으로 간다 — `CUE_LEXICON` 어휘로 정규화돼 있다). */
  personalCues: string[];
  /** 이름을 직접 부른 꽃의 id. */
  mentionedFlowerIds: string[];
  /** 받는 분이 **함께 사는** 반려동물. 제외 규칙(EX_PET_TOXIC)에 닿는 칸이다. */
  pets: Species[];
  /** 향에 민감하다고 읽혔는가. 제외 규칙(EX_FRAGRANCE)에 닿는 칸이다. */
  fragranceSensitive: boolean;
}

/** 아무것도 못 읽었을 때의 값. "실패" 가 아니라 "읽을 것이 없었다" 이다. */
export const EMPTY_EXTRACTED: ExtractedCues = {
  recipientTraits: [],
  colorPrefs: [],
  personalCues: [],
  mentionedFlowerIds: [],
  pets: [],
  fragranceSensitive: false,
};

/**
 * 칸마다의 개수 상한.
 *
 * 상한이 필요한 이유는 토큰이 아니라 **신호 대 잡음**이다. 다섯 갈래뿐인 분위기를 모델이
 * 전부 적어 오면 그것은 "다 해당된다" 가 아니라 "아무것도 못 읽었다" 와 같은 말이고,
 * 그 값이 A 항에 들어가면 후보 전체가 골고루 올라 순위가 흐려진다.
 */
const LIMITS = {
  recipientTraits: 3,
  colorPrefs: 3,
  personalCues: 6,
  mentionedFlowerIds: 4,
  pets: 2,
} as const;

/**
 * 모델이 돌려준 한 칸을 어휘로 거른다.
 *
 * 대소문자·앞뒤 공백만 관용하고 그 밖은 보지 않는다 — 비슷한 낱말을 우리가 짐작해서
 * 붙여 주기 시작하면, 모델이 무엇을 말했는지와 우리가 무엇을 들었는지가 갈라진다.
 */
function keepKnown<T extends string>(
  values: readonly string[] | undefined,
  vocabulary: readonly string[],
  limit: number,
): T[] {
  if (values === undefined) return [];
  const allowed = new Set(vocabulary);
  const kept: string[] = [];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const key = value.trim().toLowerCase();
    if (!allowed.has(key) || kept.includes(key)) continue;
    kept.push(key);
    if (kept.length >= limit) break;
  }
  return kept as T[];
}

/**
 * 모델 응답의 **모양**만 본다. 어휘 판정은 아래 `normalizeExtracted` 가 한다.
 *
 * 칸마다 `.catch(undefined)` 를 두는 것이 이 스키마의 요점이다 — 한 칸이 배열이 아니라
 * 문자열로 왔다고 해서 나머지 다섯 칸을 함께 버리지 않는다(머리말의 "버림 ≠ 실패").
 * 모르는 키는 zod 가 조용히 떨군다.
 */
const extractRawSchema = z.object({
  recipientTraits: z.array(z.string()).optional().catch(undefined),
  colorPrefs: z.array(z.string()).optional().catch(undefined),
  personalCues: z.array(z.string()).optional().catch(undefined),
  mentionedFlowerIds: z.array(z.string()).optional().catch(undefined),
  pets: z.array(z.string()).optional().catch(undefined),
  fragranceSensitive: z.boolean().optional().catch(undefined),
});

type ExtractRaw = z.output<typeof extractRawSchema>;

/** 모양을 통과한 응답 → 어휘만 남은 값. */
export function normalizeExtracted(raw: ExtractRaw): ExtractedCues {
  return {
    recipientTraits: keepKnown<RecipientTrait>(
      raw.recipientTraits,
      RECIPIENT_TRAITS,
      LIMITS.recipientTraits,
    ),
    colorPrefs: keepKnown<ExtractColor>(raw.colorPrefs, EXTRACT_COLORS, LIMITS.colorPrefs),
    personalCues: keepKnown(raw.personalCues, EXTRACT_SCENE_CUES, LIMITS.personalCues),
    mentionedFlowerIds: keepKnown(
      raw.mentionedFlowerIds,
      EXTRACT_FLOWER_IDS,
      LIMITS.mentionedFlowerIds,
    ),
    pets: keepKnown<Species>(raw.pets, SPECIES, LIMITS.pets),
    fragranceSensitive: raw.fragranceSensitive === true,
  };
}

/**
 * 본문 텍스트 → 읽어 낸 것. JSON 이 아니거나 객체가 아니면 `null`(= 폴백 신호).
 *
 * ⚠ **빈 값과 `null` 은 다르다.** 모델이 "읽을 것이 없다" 며 빈 배열만 돌려준 것은
 *   성공이고(그 판단을 존중해 재시도하지 않는다), `null` 은 말 자체가 통하지 않은 것이라
 *   다음 프로바이더로 넘어간다. 이 구분을 뭉개면 조용한 사람의 요청마다 4초를 다 쓴다.
 * ⚠ 무엇이 왔는지는 찍지 않는다 — 모델 응답에는 우리가 보낸 원문이 되돌아올 수 있다.
 */
export function parseExtractResponse(raw: string): ExtractedCues | null {
  if (raw.trim() === '') return null;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }

  const parsed = extractRawSchema.safeParse(json);
  if (!parsed.success) return null;

  return normalizeExtracted(parsed.data);
}

/** 읽어 낸 것이 하나라도 있는가. 전부 비었으면 병합할 것도 없다. */
export function hasExtractedSignal(cues: ExtractedCues): boolean {
  return (
    cues.recipientTraits.length > 0 ||
    cues.colorPrefs.length > 0 ||
    cues.personalCues.length > 0 ||
    cues.mentionedFlowerIds.length > 0 ||
    cues.pets.length > 0 ||
    cues.fragranceSensitive
  );
}
