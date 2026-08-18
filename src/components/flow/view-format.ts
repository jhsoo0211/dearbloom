/**
 * 결과 화면과 도감이 **함께 쓰는 조립 규칙** — 검색어 대표 이름 · 문학 발췌 한 편.
 *
 * ── 왜 이 파일이 생겼나 (2026-08-18) ─────────────────────────────────
 * 여기 있는 규칙들은 원래 화면마다 한 벌씩, 모두 **내보내지 않는 파일 내부 함수**로
 * 서 있었다:
 *
 *   · `mainName`               — `flow/ResultView.tsx`  ↔ `flowers/buy-name.ts`
 *   · `literatureAttribution`  — `app/recommend/build-result.ts` ↔ `flowers/data.ts`
 *   · `toLiteratureView`       — 위와 같음
 *
 * 베낀 것이 아니라 "같은 사실을 두 화면이 각자 아는" 상태였고, 그래서 두 몸통을 소스로
 * 맞대어 보는 대조 테스트가 그물 노릇을 했다(`tests/components/flowers-buy.test.ts` ·
 * `flowers-literature.test.ts`). 그 테스트들이 스스로 적어 둔 답이 "합치는 쪽이 낫다"였고,
 * 이 파일이 그 자리다. 대조 테스트는 지우지 않고 **"두 화면이 같은 한 벌을 부른다"를
 * 확인하는 테스트로 바꿨다** — 그물을 걷은 것이 아니라 옮긴 것이다.
 *
 * ⚠ **값 import 를 늘리지 마라.** 이 파일은 타입만 가져오는 순수 모듈이고, 그래야만 한다:
 *   `ResultView.tsx` 가 `'use client'` 라 여기서 무엇을 끌어오든 그대로 브라우저 번들에
 *   실린다. `labels.ts` 를 부르고 싶어지는 순간(그 파일이 `@/lib/engine` 배럴 → zod ·
 *   추천 로직 전부를 끌어온다) 결과 화면 청크가 통째로 무거워진다. `excerptTypeLabel` 이
 *   labels.ts 가 아니라 여기 사는 이유도 그것이다.
 */

import type { Quote } from '@/lib/data/types';
import type { LiteratureView } from './types';

/* ------------------------------------------------------------------ *
 * 「사러 가기」 검색어
 * ------------------------------------------------------------------ */

/**
 * 검색에 쓸 대표 이름 — `빨간 장미` → `장미`, `아시아틱 백합` → `백합`,
 * `미모사(은엽아카시아)` → `미모사`.
 *
 * 두 가지를 떼어 낸다. 둘 다 **검색 결과를 좁히기만** 하기 때문이다:
 *   · 괄호 속 딴이름 — 검색창에 괄호를 넣으면 걸리는 것이 없다
 *   · 앞에 붙은 색·품종 수식 — `빨간 장미 꽃배달` 은 0건이고 `장미 꽃배달` 은 12건이다
 *     (실측 근거는 `docs/partners-research.md` §5)
 * 한 낱말짜리 이름(`수국` `프리지아`)은 그대로 돌려준다.
 *
 * ⚠ 도감이 늘어도 이 규칙은 그대로 선다. 이름 목록을 여기 적어 두지 않는 이유다 —
 *   `content/flowers.csv` 는 계속 자란다(2026-08-17 하루에도 47종 → 59종이 됐다).
 */
export function buySearchName(nameKo: string): string {
  const parts = nameKo
    .replace(/\([^)]*\)/g, ' ')
    .trim()
    .split(/\s+/);

  return parts[parts.length - 1] || nameKo;
}

/* ------------------------------------------------------------------ *
 * §1.5k 문학 발췌 한 편
 * ------------------------------------------------------------------ */

/**
 * §1.5k 문학 발췌의 갈래 라벨 — quotes.excerpt_type 어휘와 1:1.
 * `classic` 이 "고전"인 이유: 『시경』·오비디우스·KJV 성경처럼 시·소설·희곡 어느 쪽으로도
 * 안 떨어지는 원전을 억지로 접으면 각주가 거짓이 된다(어휘 원본은 db/seed/schemas.ts).
 */
export const EXCERPT_TYPE_LABELS: Record<string, string> = {
  poem: '시',
  novel: '소설',
  play: '희곡',
  essay: '산문',
  classic: '고전',
};

export function excerptTypeLabel(type: string | undefined): string | undefined {
  if (type === undefined) return undefined;
  return EXCERPT_TYPE_LABELS[type];
}

/**
 * `김유정, 「동백꽃」(1936, 《조광》)` 형태의 각주 한 줄.
 * `source_title` 이 이미 연도를 품고 있는 행이 많아, 겹칠 때는 era 를 덧붙이지 않는다.
 */
export function literatureAttribution(quote: Quote): string {
  const base = [quote.author, quote.sourceTitle]
    .filter((part): part is string => Boolean(part))
    .join(', ');
  const era = quote.era ?? '';
  if (era === '' || base.includes(era)) return base;
  return `${base}(${era})`;
}

/** 카탈로그 한 행 → 화면 발췌 한 편. 없는 필드는 아예 두지 않는다(있는 척하지 않는다). */
export function toLiteratureView(quote: Quote): LiteratureView {
  const view: LiteratureView = {
    id: quote.quoteId,
    textKo: quote.textKo,
    attribution: literatureAttribution(quote),
  };
  if (quote.textOriginal) view.textOriginal = quote.textOriginal;
  const typeLabel = excerptTypeLabel(quote.excerptType);
  if (typeLabel) view.typeLabel = typeLabel;
  // 옮긴이는 사실이 아니라 예의의 문제다 — 우리가 옮긴 문장을 원문인 척 두지 않는다.
  if (quote.translator) view.translatorNote = `옮김: ${quote.translator}`;
  if (quote.caveat) view.caveat = quote.caveat;
  if (quote.sourceTitle) view.sourceTitle = quote.sourceTitle;
  if (quote.sourceUrl) view.sourceUrl = quote.sourceUrl;
  return view;
}
