import type { Metadata } from 'next';
import { connection } from 'next/server';

import RecommendFlow from '@/components/flow/RecommendFlow';
import {
  BUDGET_CHOICES,
  COLOR_CHOICES,
  INTENT_LABELS,
  RELATIONSHIP_LABELS,
  SPECIES_LABELS,
  TRAIT_DESCS,
  TRAIT_LABEL_BY_SLUG,
  colorChoice,
} from '@/components/flow/labels';
import type { ColorChoice, WizardOptions } from '@/components/flow/types';
import { loadCatalog } from '@/lib/data/catalog';
import { INTENTS, RECIPIENT_TRAITS, RELATIONSHIPS, SPECIES } from '@/lib/engine';

import { submitRecommendation } from './actions';

export const metadata: Metadata = {
  title: 'dearbloom — 45초 만에 추천받기',
  description:
    '관계와 마음, 상대의 분위기만 알려주세요. 어울리는 꽃과 꽃말, 그 꽃에 얽힌 이야기까지 골라드려요.',
};

/** 기본 날짜 = 내일(한국 시간). 'YYYY-MM-DD' 는 en-CA 포맷과 같다. */
function tomorrowInSeoul(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

/**
 * 질문 화면 — 선택지는 **엔진 어휘에서 만들어** 내려보낸다.
 *
 * 화면(클라이언트 컴포넌트)은 어휘도 라벨 사전도 갖지 않는다. 여기서 만든 값만 쓰기 때문에
 * relationship 6종·intent 7종·trait 5종이 늘거나 바뀌면 이 페이지가 자동으로 따라간다.
 * 좋아하는 색 칩도 카탈로그에 실제로 존재하는 색만 세운다(고를 수 없는 색을 보여 주지 않는다).
 *
 * `connection()` 으로 요청 시점 렌더를 명시한다 — 기본 날짜가 "내일"이라 빌드 때 미리
 * 만들어 두면 배포 다음 날부터 지난 날짜를 보여 주기 때문이다. 서버가 정한 날짜를 그대로
 * 내려보내야 하이드레이션도 어긋나지 않는다(화면에서 effect 로 채우면 그때 값이 튄다).
 */
export default async function RecommendPage() {
  await connection();
  const catalog = await loadCatalog();

  const present = new Set(catalog.flowers.flatMap((flower) => flower.colors));
  const known = Object.keys(COLOR_CHOICES).filter((slug) => present.has(slug));
  const extra = [...present].filter((slug) => !(slug in COLOR_CHOICES));
  const colors: ColorChoice[] = [...known, ...extra].map(colorChoice);

  const options: WizardOptions = {
    relationships: RELATIONSHIPS.map((value) => ({
      value,
      label: RELATIONSHIP_LABELS[value].label,
      desc: RELATIONSHIP_LABELS[value].desc,
    })),
    intents: INTENTS.map((value) => ({
      value,
      label: INTENT_LABELS[value].label,
      desc: INTENT_LABELS[value].desc,
    })),
    traits: RECIPIENT_TRAITS.map((value) => ({
      value,
      label: TRAIT_LABEL_BY_SLUG[value],
      desc: TRAIT_DESCS[value],
    })),
    colors,
    pets: SPECIES.map((value) => ({
      value,
      label: SPECIES_LABELS[value].label,
      desc: SPECIES_LABELS[value].desc,
    })),
    budgets: BUDGET_CHOICES.map((budget) => ({
      value: budget.value,
      label: budget.label,
      desc: budget.desc,
    })),
  };

  return (
    <RecommendFlow
      options={options}
      defaultDateISO={tomorrowInSeoul()}
      action={submitRecommendation}
    />
  );
}
