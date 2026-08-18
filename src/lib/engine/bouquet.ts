/**
 * 다발 짜기 판정 — `/bouquet` 의 순수 계산 한 벌.
 *
 * 주 꽃 하나 + 곁들이 0~2종 + 색 하나를 받아, **우리 데이터가 실제로 말할 수 있는 것만**
 * 판정 카드로 돌려준다. 추천 엔진(`index.ts`)과 달리 여기서는 **아무것도 고르지 않는다** —
 * 고르는 사람은 사용자이고, 이 모듈은 그 조합을 읽어 줄 뿐이다.
 *
 * ── 이 모듈이 지키는 금지선 (design-spec §1.5v) ──────────────────────
 *  · **궁합 점수를 지어내지 않는다.** 색 이론(보색·유사색)으로 점수를 매기는 코드가 여기
 *    한 줄도 없다. 말할 수 있는 것은 셋뿐이다 — 같은 색을 낼 수 있는가(`colors` 교집합),
 *    같은 결인가(`aesthetic_tags` 5축 교집합), 그 색에 붙은 꽃말이 무엇인가(`meanings.csv`).
 *    셋 다 비면 **비었다고 말한다**(`notes` 의 마지막 갈래) — 그 자리를 그럴듯한 문장으로
 *    메우는 순간 이 화면 전체가 점집이 된다.
 *  · **안전 판정을 다시 짜지 않는다.** 반려동물 교차 검사는 `exclude()` 를 그대로 부른다
 *    (아래 `petBlocks` 머리말). 단체 부케(`group.ts` 의 `recommendGroupBouquet`)가 안전
 *    교집합을 만들 때 부르는 **바로 그 함수**다.
 *
 * ── 왜 zod 를 쓰지 않는가 ────────────────────────────────────────────
 * 이 모듈은 **브라우저에서 돈다.** `/bouquet` 은 서버 액션이 없다(정적 드롭 데모에서도
 * 판정이 그대로 서야 한다 — 조합은 사용자가 화면에서 바꾸고, 그때마다 다시 계산된다).
 * 그래서 입력 검증을 zod 로 하지 않고, 모르는 id 는 조용히 떨어뜨린다
 * (`judgeBouquet` 이 주 꽃을 못 찾으면 `null`). 같은 이유로 `normalize.ts`·`explain.ts`
 * 처럼 zod 를 끌고 오는 형제 모듈을 import 하지 않는다 — 딸려 오는 것이 곧 번들이다.
 * ⚠ 이 파일에 zod 를 들이지 마라. 들이는 순간 `/bouquet` 첫 화면에 스키마 한 벌이 얹힌다.
 *
 * 순수 TS 만 둔다(React·fs·fetch 의존 금지). 배럴(`index.ts`)에 얹지 않은 것도 의도다 —
 * 배럴은 zod 를 끌고 오므로 클라이언트는 이 파일을 **경로로 직접** import 한다.
 */

import { withParticle } from '../text';
import { exclude } from './exclude';
import type { FlowerData, FlowerMeaningRow, FlowerRef, RecoInput, Species } from './types';

/* ------------------------------------------------------------------ *
 * 어휘 · 상수
 * ------------------------------------------------------------------ */

/**
 * 한 다발에 담는 곁들이 상한.
 *
 * 주 꽃 1 + 곁들이 2 = **3종**이고, 그 3 은 단체 부케(`group.ts` 의 `MAX_BOUQUET_FLOWERS`)와
 * 같은 수다. 두 화면이 같은 "한 다발" 을 말하기 때문이다.
 * ⚠ `group.ts` 에서 그 상수를 import 하지 않는 이유는 하나다 — 그 파일이 zod 를 끌고 온다
 *   (위 머리말). 대신 `tests/engine/bouquet.test.ts` 가 `1 + MAX_ACCENTS === MAX_BOUQUET_FLOWERS`
 *   를 맞대어 본다. 한쪽만 고치면 그 테스트가 먼저 깨진다.
 */
export const MAX_ACCENTS = 2;

/**
 * 곁들이로 세우는 종 — **우리가 고른 목록**이다.
 *
 * `flowers.csv` 에 「곁들이」 컬럼은 없다. 지어낸 꽃은 하나도 없고 전부 카탈로그 59종 안의
 * id 이지만, 어느 종이 곁들이 자리에 서는가는 데이터가 아니라 **이 줄의 판단**이다.
 *   · `eucalyptus` · `babys-breath` · `statice` — 다발에서 주인공으로 서는 일이 거의 없는
 *     세 종(그린 소재 · 필러 두 종).
 *   · `cotton` — 마른 소재. 겨울 다발에서 같은 자리에 선다.
 *   · `cornflower` · `scabiosa` — 작은 들꽃 결. 마침 `pet_safety.csv` 가 유칼립투스·목화의
 *     **안전 대체**로 지목한 종들이라(안개꽃·스타티스와 같은 줄에 적혀 있다) 우리 데이터도
 *     이 둘을 같은 자리에 놓고 있는 셈이다.
 * ⚠ 늘리고 싶어지면 여기 id 를 더하기 전에 `flowers.csv` 에 컬럼을 만드는 쪽을 먼저 보라 —
 *   이 목록이 길어질수록 "우리가 고른 것" 이라는 사실이 코드 안에 숨는다(기술부채 기록).
 */
export const ACCENT_FLOWER_IDS = [
  'eucalyptus',
  'babys-breath',
  'statice',
  'cotton',
  'cornflower',
  'scabiosa',
] as const;

/**
 * 주 꽃 목록에서 **뒤로 미는** 종.
 *
 * 빼지 않는다 — 유칼립투스 한 종으로 다발을 채우고 싶은 사람도 있고, 뺄 근거가 데이터에
 * 없다. 다만 목록 맨 앞에서 만나면 "이게 주인공인가" 로 읽히므로 순서만 내린다.
 * 곁들이 여섯 중 셋만 내리는 이유: 수레국화·스카비오사·목화는 주인공으로도 흔히 선다.
 */
const MAIN_TAIL_IDS: ReadonlySet<string> = new Set(['eucalyptus', 'babys-breath', 'statice']);

/** 이 화면이 함께 보는 반려동물. `exclude.ts` · `group.ts` 와 같은 두 종이다. */
const PET_SPECIES: readonly Species[] = ['cat', 'dog'];

/** 사유 문장에 쓰는 표기 — `exclude.ts` 의 `SPECIES_KO` · `group.ts` 의 `PET_KO` 와 같은 말. */
const PET_KO: Record<Species, string> = { cat: '고양이', dog: '강아지' };

/**
 * 「향이 진하다」고 부르는 문턱.
 *
 * `exclude.ts` 의 `EX_FRAGRANCE`(향 민감 → `fragranceLevel >= 2` 제외)와 **같은 값**이다.
 * 같은 꽃을 한 화면에서는 "향이 진해요" 라고 하고 다른 화면에서는 후보로 세우면 두 화면이
 * 서로를 부정한다. 그 파일의 상수는 내보내지 않으므로 값을 여기 한 벌 두고,
 * `tests/engine/bouquet.test.ts` 가 카탈로그 59종 전수로 두 판정을 맞대어 본다.
 */
const STRONG_FRAGRANCE = 2;

/**
 * 결 5축의 한국어 표기 — `normalize.ts` 의 `TRAIT_LABELS` 를 뒤집은 값이다.
 * 그 표를 import 하지 않는 이유는 머리말 그대로(zod). 어긋남은 테스트가 잡는다.
 */
const TONE_KO: Record<string, string> = {
  calm: '차분한',
  vivid: '화려한',
  cute: '귀여운',
  elegant: '우아한',
  minimal: '미니멀',
};

/** 이름·색을 나열할 때 쓰는 구분자. 화면 전체가 같은 기호를 쓴다(`외 2종` 과 한 짝). */
const JOIN = '·';

/* ------------------------------------------------------------------ *
 * 타입
 * ------------------------------------------------------------------ */

/** 꽃말의 신뢰 등급. 어휘의 원본은 `meanings.csv`(= `FlowerMeaningRow`). */
export type MeaningConfidence = FlowerMeaningRow['confidenceLevel'];

/**
 * 색 한 칸 — slug 에 **표기와 꽃말까지 붙여 둔** 값.
 *
 * 판정 문장이 `label` 을 그대로 쓴다(`white` 가 아니라 `흰색`). 엔진이 표기를 들고 있는 것이
 * 어색해 보이지만, 대안은 화면이 문장을 다시 조립하는 것이라 더 나쁘다 — `exclude.ts` 가
 * 이미 같은 판단으로 `TOXIC_PART_KO` 를 들고 있다.
 * 값은 서버가 `buildColorOptions()`(explain.ts)로 만들어 넘긴다 — 색 → 꽃말 찾기 규칙이
 * 결과 화면과 한 벌이어야 하기 때문이다.
 */
export interface BouquetColor {
  /** `flowers.csv` 의 색 slug. */
  value: string;
  /** 화면 표기(`흰색`). */
  label: string;
  /** 그 색에 붙은 꽃말. **출처를 찾은 색에만 있다**(없는 것이 정상 값이다). */
  meaningKo?: string;
  confidence?: MeaningConfidence;
}

/**
 * 판정이 보는 꽃 한 종 = 엔진의 `FlowerData` + 이 화면이 더 아는 두 가지.
 *
 * `FlowerData` 를 그대로 품으므로 **`exclude()` 에 그대로 넘길 수 있다** — 안전 판정을
 * 다시 짜지 않는다는 이 모듈의 금지선이 이 한 줄에 걸려 있다.
 */
export interface BouquetSpecies extends FlowerData {
  /** 그 꽃이 실제로 나오는 색 전부(대표색이 맨 앞). 서버가 좁혀 실어 보낸다. */
  paletteKo: readonly BouquetColor[];
  /** `pet_safety.csv` 의 `safe_alternative_flower_ids` 를 이름까지 풀어 둔 값. */
  safeAlternatives: readonly FlowerRef[];
}

/** 사용자가 화면에서 짠 조합. */
export interface BouquetChoice {
  mainId: string;
  /** 주 꽃의 색 slug. 고르지 않았으면 그 꽃의 대표색을 쓴다. */
  colorValue?: string;
  /** 곁들이 id. `MAX_ACCENTS` 를 넘으면 앞에서부터 자른다. */
  accentIds: readonly string[];
}

export type BouquetSlot = 'main' | 'accent';

/** 다발에 실제로 담긴 한 줄기. */
export interface BouquetStem {
  slot: BouquetSlot;
  flower: FlowerRef;
  /** 색 정보가 아예 없는 꽃이면 없다. */
  color?: BouquetColor;
}

/** 반려동물 교차 검사 결과. 위험이 하나도 없으면 이 값 자체가 `null` 이다. */
export interface BouquetPetVerdict {
  /** 걸린 종. 둘 다 걸리면 둘 다 들어 있다. */
  species: Species[];
  /** 위험 판정이 난 꽃. */
  blocked: FlowerRef[];
  /** 대신 권할 수 있는 꽃. 못 찾으면 빈 배열이다. */
  alternatives: FlowerRef[];
  /** §1.5h 직설 한 줄 — 돌려 말하지 않는다. */
  headline: string;
  /** 대체 제안 한 줄. `alternatives` 가 비면 없다. */
  swap?: string;
}

/** 색 궁합 — **데이터가 말해 주는 것만**. 셋 다 비면 `notes` 가 비었다고 말한다. */
export interface BouquetColorVerdict {
  /** 주 꽃이 입은 색. 색 정보가 없는 꽃이면 `null`. */
  main: BouquetColor | null;
  /** 그 색을 곁들이도 낼 수 있는 경우. */
  echoes: FlowerRef[];
  /** 담긴 꽃 **전부가** 함께 갖는 결(5축)의 한국어 표기. */
  sharedTones: string[];
  /** 화면에 그대로 나가는 문장들. */
  notes: string[];
}

/** 향 겹침. `total` 은 `fragrance_level`(0~3)의 단순 합이다 — 지수가 아니다. */
export interface BouquetFragranceVerdict {
  total: number;
  /** `fragranceLevel >= STRONG_FRAGRANCE` 인 줄기. */
  strong: FlowerRef[];
  note: string;
}

/** 「이 다발이 품는 말들」 한 줄. 꽃말을 찾은 줄기만 선다. */
export interface BouquetMeaningLine {
  flower: FlowerRef;
  color: BouquetColor;
  meaningKo: string;
  confidence?: MeaningConfidence;
}

export interface BouquetVerdict {
  stems: BouquetStem[];
  /** 위험이 없으면 `null`. */
  pet: BouquetPetVerdict | null;
  /**
   * 빼지는 않지만 알려야 하는 주의(가벼운 위장 장애).
   * `exclude()` 가 만든 문장을 **그대로** 싣는다 — 같은 사실을 두 번 쓰지 않는다.
   */
  mildCautions: string[];
  color: BouquetColorVerdict;
  fragrance: BouquetFragranceVerdict;
  meanings: BouquetMeaningLine[];
}

/* ------------------------------------------------------------------ *
 * 목록 만들기
 * ------------------------------------------------------------------ */

function toRef(flower: FlowerRef): FlowerRef {
  return { id: flower.id, nameKo: flower.nameKo };
}

/**
 * 주 꽃 고르기 목록 — **카탈로그 순서 그대로**, 곁들이 결이 강한 세 종만 뒤로.
 * 정렬 기준을 점수로 두지 않는 이유: 이 화면에는 "마음" 이 없다(사용자가 직접 고른다).
 * 순서를 매길 근거가 없으면 데이터가 적힌 순서를 그대로 두는 것이 정직하다.
 */
export function mainCandidates<T extends { id: string }>(all: readonly T[]): T[] {
  const head: T[] = [];
  const tail: T[] = [];
  for (const flower of all) (MAIN_TAIL_IDS.has(flower.id) ? tail : head).push(flower);
  return [...head, ...tail];
}

/** 곁들이 목록 — `ACCENT_FLOWER_IDS` 순서대로, 카탈로그에 실제로 있는 것만. */
export function accentCandidates<T extends { id: string }>(all: readonly T[]): T[] {
  const byId = new Map(all.map((flower) => [flower.id, flower]));
  return ACCENT_FLOWER_IDS.flatMap((id) => {
    const hit = byId.get(id);
    return hit ? [hit] : [];
  });
}

/* ------------------------------------------------------------------ *
 * 판정 ① 반려동물 교차
 * ------------------------------------------------------------------ */

interface PetProbe {
  blocked: FlowerRef[];
  cautions: string[];
}

/**
 * 이 조합을 그 종이 있는 집에 내놓아도 되는가 — **판정은 `exclude()` 가 한다.**
 *
 * 단체 부케(`recommendGroupBouquet`)가 안전 교집합을 만들 때 부르는 바로 그 함수이고,
 * 문턱(`serious` · `life_threatening` 은 제외 / `mild_gi` 는 주의만)도 그 안에 있다.
 * 여기서 문턱을 다시 적으면 두 화면이 같은 꽃을 다르게 판정하게 된다.
 *
 * `relationship`·`intent` 는 `exclude()` 가 **읽지 않는** 칸이라 중립값을 채운다
 * (`other` 는 규칙표에 행이 없는 값이다 — `types.ts` 의 두 주석). 예산·싫어하는 꽃·향
 * 민감을 비워 두므로 이 호출에서 설 수 있는 규칙은 `EX_PET_TOXIC` 하나뿐이지만,
 * 나중에 규칙이 늘어도 여기가 조용히 넓어지지 않도록 ruleId 로 한 번 더 좁힌다.
 */
function petProbe(flowers: FlowerData[], species: Species): PetProbe {
  const input: RecoInput = { relationship: 'other', intent: 'other', pets: [species] };
  const { excluded, cautionsByFlower } = exclude(flowers, input);

  return {
    blocked: excluded.filter((item) => item.ruleId === 'EX_PET_TOXIC').map((item) => item.flower),
    cautions: [...cautionsByFlower.values()].flat(),
  };
}

/** 그 종에게 독성이 **전혀 없는** 꽃인가. 대체 제안이 "안전하다" 고 말할 근거다. */
function isClearFor(flower: BouquetSpecies, species: readonly Species[]): boolean {
  return species.every((one) => {
    const entry = flower.petSafety.find((row) => row.species === one);
    return entry === undefined || (!entry.toxic && entry.severity === 'none');
  });
}

function petVerdict(
  picked: BouquetSpecies[],
  all: readonly BouquetSpecies[],
): { pet: BouquetPetVerdict | null; mildCautions: string[] } {
  const hitSpecies: Species[] = [];
  const blocked = new Map<string, FlowerRef>();
  const mild: string[] = [];

  for (const species of PET_SPECIES) {
    const probe = petProbe(picked, species);
    for (const text of probe.cautions) if (!mild.includes(text)) mild.push(text);
    if (probe.blocked.length === 0) continue;

    hitSpecies.push(species);
    for (const flower of probe.blocked) blocked.set(flower.id, flower);
  }

  if (hitSpecies.length === 0) return { pet: null, mildCautions: mild };

  const blockedList = [...blocked.values()];
  const inBouquet = new Set(picked.map((flower) => flower.id));
  const byId = new Map(all.map((flower) => [flower.id, flower]));

  /*
   * 대체 제안 — 걸린 꽃이 스스로 지목한 대안(`safe_alternative_flower_ids`)만 쓴다.
   * 우리가 새로 고르지 않는다. 다만 두 가지는 걸러야 그 제안이 거짓말이 되지 않는다:
   *   · 이미 이 다발에 담긴 꽃(바꾸라면서 같은 꽃을 가리킬 수 없다)
   *   · 걸린 그 종에게 독성이 조금이라도 있는 꽃(대안이 또 위험하면 대안이 아니다)
   */
  const alternatives: FlowerRef[] = [];
  const seen = new Set<string>();
  for (const flower of blockedList) {
    const source = byId.get(flower.id);
    for (const candidate of source?.safeAlternatives ?? []) {
      if (seen.has(candidate.id) || inBouquet.has(candidate.id)) continue;
      const full = byId.get(candidate.id);
      if (full === undefined || !isClearFor(full, hitSpecies)) continue;
      seen.add(candidate.id);
      alternatives.push(toRef(candidate));
      if (alternatives.length === 3) break;
    }
    if (alternatives.length === 3) break;
  }

  const petNames = hitSpecies.map((one) => PET_KO[one]).join(JOIN);
  const blame = blockedList.map((flower) => flower.nameKo).join(JOIN);

  // §1.5h — 안전은 직설이다. 완곡하게 돌리지 않는다.
  const pet: BouquetPetVerdict = {
    species: hitSpecies,
    blocked: blockedList,
    alternatives,
    headline: `이 조합은 ${withParticle(petNames, 'subject')} 있는 집엔 어려워요 — ${blame} 때문이에요.`,
  };

  if (alternatives.length > 0) {
    const names = alternatives.map((flower) => flower.nameKo).join(JOIN);
    pet.swap = `대신 ${withParticle(names, 'topic')} 어떠세요 — ${petNames}에게 독성이 없는 꽃이에요.`;
  }

  return { pet, mildCautions: mild };
}

/* ------------------------------------------------------------------ *
 * 판정 ② 색 궁합
 * ------------------------------------------------------------------ */

/** 그 꽃이 그 색을 낼 수 있으면 그 색 칸을, 아니면 대표색 칸을 준다. */
function colorOf(flower: BouquetSpecies, wanted?: string): BouquetColor | undefined {
  const key = wanted?.trim().toLowerCase();
  if (key !== undefined && key !== '') {
    const hit = flower.paletteKo.find((color) => color.value.trim().toLowerCase() === key);
    if (hit) return hit;
  }
  return flower.paletteKo[0];
}

function colorVerdict(
  main: BouquetSpecies,
  accents: BouquetSpecies[],
  mainColor: BouquetColor | undefined,
): BouquetColorVerdict {
  const notes: string[] = [];
  const echoing: BouquetSpecies[] = [];

  if (mainColor !== undefined) {
    const key = mainColor.value.trim().toLowerCase();
    for (const accent of accents) {
      if (accent.paletteKo.some((color) => color.value.trim().toLowerCase() === key)) {
        echoing.push(accent);
      }
    }
  }
  const echoes = echoing.map((flower) => toRef(flower));

  /* 결 5축 교집합 — 담긴 꽃 **전부**가 갖고 있는 태그만. 하나라도 빠지면 "겹친다" 가 아니다. */
  const inBouquet = [main, ...accents];
  const sharedTones =
    inBouquet.length < 2
      ? []
      : main.aestheticTags
          .filter((tag) => inBouquet.every((flower) => flower.aestheticTags.includes(tag)))
          .map((tag) => TONE_KO[tag] ?? tag);

  if (mainColor !== undefined && echoing.length > 0) {
    const names = echoes.map((flower) => flower.nameKo).join(JOIN);
    notes.push(
      `${names}도 같은 ${withParticle(mainColor.label, 'to')} 나와요 — 한 색으로 모아 담을 수 있어요.`,
    );

    /*
     * 같은 색인데 품는 말은 다를 수 있다 — 그것이 이 자리에서 우리가 아는 **유일한**
     * 색 이야기다. 궁합을 점수로 매기는 대신 그 색의 꽃말 두 줄을 나란히 놓는다.
     */
    const partner = echoing[0];
    const partnerColor = colorOf(partner, mainColor.value);
    if (
      mainColor.meaningKo !== undefined &&
      partnerColor?.meaningKo !== undefined &&
      partnerColor.meaningKo !== mainColor.meaningKo
    ) {
      notes.push(
        `색이 같아도 품는 말은 달라요 — ${main.nameKo}의 ${withParticle(mainColor.label, 'topic')} ‘${mainColor.meaningKo}’, ${partner.nameKo}의 ${withParticle(partnerColor.label, 'topic')} ‘${partnerColor.meaningKo}’.`,
      );
    }
  }

  if (sharedTones.length > 0) {
    notes.push(`담긴 꽃들이 결을 나눠 가져요 — ${sharedTones.join(JOIN)} 결이 겹쳐요.`);
  }

  if (notes.length === 0) {
    notes.push(
      accents.length === 0
        ? '곁들이를 더하면 두 꽃의 색과 결이 어떻게 만나는지도 함께 봐 드릴게요.'
        : '이 조합에 대해 저희 데이터가 말해 주는 건 없어요 — 색 궁합을 점수로 지어내지는 않을게요. 눈으로 골라 주세요.',
    );
  }

  return { main: mainColor ?? null, echoes, sharedTones, notes };
}

/* ------------------------------------------------------------------ *
 * 판정 ③ 향 겹침
 * ------------------------------------------------------------------ */

function fragranceVerdict(stems: BouquetSpecies[]): BouquetFragranceVerdict {
  const total = stems.reduce((sum, flower) => sum + flower.fragranceLevel, 0);
  const strong = stems
    .filter((flower) => flower.fragranceLevel >= STRONG_FRAGRANCE)
    .map((flower) => toRef(flower));

  let note: string;
  if (strong.length >= 2) {
    note = `향이 진한 꽃이 ${strong.length}종이에요 — 향끼리 부딪힐 수 있으니 식탁 옆은 피해 주세요.`;
  } else if (strong.length === 1) {
    note = `${withParticle(strong[0].nameKo, 'subject')} 향이 진해요 — 이 다발의 향은 그 꽃이 정해요. 식탁 옆은 피해 주세요.`;
  } else if (total === 0) {
    note = '향이 거의 없는 조합이에요 — 향에 민감한 분께도 편하게 건넬 수 있어요.';
  } else {
    note = '향은 은은한 편이에요 — 방 안에 두어도 부담스럽지 않아요.';
  }

  return { total, strong, note };
}

/* ------------------------------------------------------------------ *
 * 판정 전체
 * ------------------------------------------------------------------ */

/**
 * 조합 하나를 읽어 판정 카드를 만든다.
 *
 * 같은 입력에는 늘 같은 답이 나온다 — 무작위도, 시계도, 정렬 불안정도 없다
 * (정적 데모와 본배포가 같은 화면이어야 하는 이유이자, 테스트가 그것을 잠근다).
 *
 * @returns 주 꽃을 목록에서 못 찾으면 `null`. 그 밖에는 언제나 카드가 선다.
 */
export function judgeBouquet(
  choice: BouquetChoice,
  all: readonly BouquetSpecies[],
): BouquetVerdict | null {
  const byId = new Map(all.map((flower) => [flower.id, flower]));

  const main = byId.get(choice.mainId);
  if (main === undefined) return null;

  /* 곁들이 — 모르는 id·중복·주 꽃과 같은 꽃은 떨어뜨리고, 상한까지만 담는다. */
  const accents: BouquetSpecies[] = [];
  const taken = new Set<string>([main.id]);
  for (const id of choice.accentIds) {
    if (accents.length >= MAX_ACCENTS || taken.has(id)) continue;
    const hit = byId.get(id);
    if (hit === undefined) continue;
    taken.add(id);
    accents.push(hit);
  }

  const mainColor = colorOf(main, choice.colorValue);

  /*
   * 곁들이의 색은 **주 꽃이 입은 색을 낼 수 있으면 그 색**, 아니면 그 꽃의 대표색이다.
   * 한 색으로 모으려는 사람의 다발을 화면이 제멋대로 다른 색으로 그리지 않게 하는 규칙이고,
   * 바로 아래 `echoes` 판정과 같은 사실을 본다.
   */
  const stems: BouquetStem[] = [
    { slot: 'main', flower: toRef(main), ...(mainColor ? { color: mainColor } : {}) },
    ...accents.map((flower) => {
      const color = colorOf(flower, mainColor?.value);
      return {
        slot: 'accent' as const,
        flower: toRef(flower),
        ...(color ? { color } : {}),
      };
    }),
  ];

  const picked = [main, ...accents];
  const { pet, mildCautions } = petVerdict(picked, all);

  const meanings: BouquetMeaningLine[] = stems.flatMap((stem) =>
    stem.color?.meaningKo === undefined
      ? []
      : [
          {
            flower: stem.flower,
            color: stem.color,
            meaningKo: stem.color.meaningKo,
            ...(stem.color.confidence ? { confidence: stem.color.confidence } : {}),
          },
        ],
  );

  return {
    stems,
    pet,
    mildCautions,
    color: colorVerdict(main, accents, mainColor),
    fragrance: fragranceVerdict(picked),
    meanings,
  };
}
