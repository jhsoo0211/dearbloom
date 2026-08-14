/**
 * 그룹 화면(`/groups`)이 주고받는 값의 모양.
 *
 * 서버 액션(`src/app/groups/actions.ts`)과 클라이언트 컴포넌트가 **같이** 쓰는 파일이라
 * 순수 타입만 둔다 — 엔진·fs·React 의존을 넣지 마라(클라이언트 번들에 zod 가 딸려 온다).
 * 엔진 어휘(Intent·Species·RecipientTrait)는 타입만 가져온다(컴파일 시 지워진다).
 */

import type { Intent, RecipientTrait, Species } from '@/lib/engine/types';

/** 화면에서 편집 중인 멤버 한 줄. `key` 는 React 목록 키 전용이며 서버로 보내지 않는다. */
export interface MemberDraft {
  key: string;
  name: string;
  traits: RecipientTrait[];
  colors: string[];
  pets: Species[];
  fragranceSensitive: boolean;
}

/** 서버 액션이 받는 멤버(= 엔진 GroupMemberInput 중 이 화면이 채우는 부분). */
export interface GroupPlanMember {
  name: string;
  recipientTraits: RecipientTrait[];
  colorPrefs: string[];
  pets: Species[];
  fragranceSensitive: boolean;
}

export interface GroupPlanRequest {
  intent: Intent;
  members: GroupPlanMember[];
}

/**
 * 결과 한 송이. 엔진 `RecoResult` 에서 화면이 쓰는 값만 뽑아 문자열로 굳힌 뷰 모델이다.
 * (규칙 id → 한국어 문장 변환도 서버에서 끝낸다.)
 */
export interface FlowerView {
  id: string;
  nameKo: string;
  /** 제안 색의 한국어 표기. 색 정보가 없는 꽃이면 비어 있다. */
  colorLabel?: string;
  /** 그 색의 꽃말. 출처 있는 꽃말을 못 찾으면 비어 있다(없는 꽃말은 지어내지 않는다). */
  meaningKo?: string;
  /** 그 색을 고른 근거 한 문장. */
  colorReason?: string;
  /** 엔진이 남긴 주의 문구(반려동물 가벼운 위장 장애·중복 분산 안내 등). */
  cautions: string[];
}

/** 각각 모드 — 멤버 한 사람에게 배정된 꽃. */
export interface MemberAssignment {
  name: string;
  /** 아바타에 쓰는 이름 첫 글자. */
  initial: string;
  /** 그 사람에게 입력한 조건을 그대로 옮긴 칩. */
  memo: string[];
  /** 후보가 전부 걸러진 드문 경우 null. */
  flower: FlowerView | null;
  /** 추천 이유(규칙 문장). */
  reasons: string[];
  /** 배정되지 않은 차순위 꽃 이름. */
  alternatives: string[];
}

export interface BouquetExclusionView {
  nameKo: string;
  reason: string;
  /** 이 제외 사유를 만든 멤버 이름들. 예산처럼 그룹 공통 사유면 빈 배열. */
  because: string[];
}

export interface GroupPlanView {
  intentLabel: string;
  memberCount: number;
  individual: MemberAssignment[];
  bouquet: {
    flowers: FlowerView[];
    excluded: BouquetExclusionView[];
    /** 반려동물 때문에 뺀 꽃이 있을 때만 채워지는 안내 한 문장(§1.5c 안전 각주). */
    caution?: string;
  };
}

/** 서버 액션의 응답. 검증 실패는 throw 하지 않고 문구로 돌려준다. */
export type GroupPlanState =
  | { ok: true; view: GroupPlanView }
  | { ok: false; message: string };
