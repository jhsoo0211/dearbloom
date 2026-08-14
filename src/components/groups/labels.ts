/**
 * 그룹 화면의 어휘표 — 화면 라벨 ↔ 엔진 slug.
 *
 * 서버 액션과 클라이언트가 같은 표를 봐야 "칩에 고른 말"과 "결과에 적힌 말"이 어긋나지 않는다.
 * 순수 데이터만 둔다(엔진 import 금지 — 타입만 가져온다).
 *
 * 문구 출처: design-spec §1.5b(페르소나·색 칩) · §1.5c(4명 시나리오) · §1.5d(개정 워딩).
 */

import type { Intent, RecipientTrait, Species } from '@/lib/engine/types';
import type { MemberDraft } from './types';

export interface Option<T extends string> {
  value: T;
  label: string;
}

/**
 * 그룹 전체가 함께 고르는 마음.
 * `화해의 꽃` 은 §1.5d 가 확정한 표기다(구 `사과·화해`).
 */
export const INTENT_OPTIONS: ReadonlyArray<Option<Intent>> = [
  { value: 'gratitude', label: '고마움' },
  { value: 'celebration', label: '축하' },
  { value: 'comfort', label: '위로' },
  { value: 'apology', label: '화해의 꽃' },
  { value: 'confession', label: '고백' },
  { value: 'anniversary', label: '기념일' },
  { value: 'just_because', label: '그냥, 문득' },
];

/** 페르소나 태그(§1.5b). 엔진 normalize 의 TRAIT_LABELS 와 같은 어휘다. */
export const TRAIT_OPTIONS: ReadonlyArray<Option<RecipientTrait>> = [
  { value: 'calm', label: '차분한' },
  { value: 'vivid', label: '화려한' },
  { value: 'cute', label: '귀여운' },
  { value: 'elegant', label: '우아한' },
  { value: 'minimal', label: '미니멀' },
];

/** 좋아하는 색 칩. flowers.csv 의 colors 어휘 중 실제로 쓰이는 값만 편다. */
export const COLOR_OPTIONS: ReadonlyArray<Option<string>> = [
  { value: 'white', label: '흰색' },
  { value: 'cream', label: '크림' },
  { value: 'pink', label: '분홍' },
  { value: 'red', label: '빨강' },
  { value: 'orange', label: '주황' },
  { value: 'yellow', label: '노랑' },
  { value: 'purple', label: '보라' },
];

export const PET_OPTIONS: ReadonlyArray<Option<Species>> = [
  { value: 'cat', label: '반려묘' },
  { value: 'dog', label: '반려견' },
];

/** 색 slug → 한국어 표기. 사전에 없으면 slug 를 그대로 쓴다(엔진 explain.ts 와 같은 규칙). */
const COLOR_LABELS: Record<string, string> = {
  red: '빨강',
  pink: '분홍',
  white: '흰색',
  cream: '크림',
  ivory: '아이보리',
  yellow: '노랑',
  orange: '주황',
  peach: '피치',
  coral: '코랄',
  magenta: '마젠타',
  purple: '보라',
  blue: '파랑',
  green: '초록',
};

export function colorLabel(color: string): string {
  return COLOR_LABELS[color.trim().toLowerCase()] ?? color;
}

export function traitLabel(trait: string): string {
  return TRAIT_OPTIONS.find((option) => option.value === trait)?.label ?? trait;
}

export function intentLabel(intent: Intent): string {
  return INTENT_OPTIONS.find((option) => option.value === intent)?.label ?? intent;
}

/** 반려동물 표기 — 안전 문구는 완곡하게 돌리지 않는다(§1.5d). */
export function petLabel(species: Species): string {
  return species === 'cat' ? '반려묘 있음' : '반려견 있음';
}

/**
 * 한 번에 다룰 수 있는 인원 상한.
 * 엔진 `MAX_GROUP_MEMBERS`(src/lib/engine/group.ts)와 같은 값이며, 넘기면 zod 가 막는다.
 * 여기에 사본을 두는 이유는 엔진(zod)을 클라이언트 번들로 끌고 오지 않기 위해서다.
 */
export const MAX_MEMBERS = 10;

/** 빈 멤버 한 줄. */
export function emptyMember(key: string): MemberDraft {
  return { key, name: '', traits: [], colors: [], pets: [], fragranceSensitive: false };
}

/**
 * §1.5c 시나리오 — "프로젝트를 함께 끝낸 팀원 4명에게 · 고마움".
 * 빈 폼 앞에서 멈추지 않도록 "예시로 채우기" 버튼이 이 값을 그대로 심는다.
 */
export const PRESET_INTENT: Intent = 'gratitude';

export const PRESET_MEMBERS: ReadonlyArray<Omit<MemberDraft, 'key'>> = [
  { name: '지수', traits: ['calm'], colors: ['white'], pets: ['cat'], fragranceSensitive: false },
  { name: '민준', traits: ['vivid'], colors: ['orange'], pets: [], fragranceSensitive: false },
  { name: '하린', traits: ['elegant'], colors: ['pink'], pets: [], fragranceSensitive: false },
  { name: '도윤', traits: ['minimal'], colors: [], pets: [], fragranceSensitive: true },
];
