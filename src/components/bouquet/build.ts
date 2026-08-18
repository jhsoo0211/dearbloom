/**
 * `/bouquet` 의 서버 조립 — 카탈로그 한 덩어리를 화면이 쥘 한 벌로 좁힌다.
 *
 * ⚠ **서버에서만 부른다.** `@/lib/plates`(도판 표 59벌)와 `@/components/flow/labels`
 *   (엔진 배럴 → zod)를 값으로 import 하기 때문이다. 클라이언트 컴포넌트가 이 파일을
 *   부르면 그 둘이 통째로 번들에 실린다 — `/stories` 가 실제로 겪은 자리다(코드 리뷰 P1-7).
 *   화면으로 건너가는 것은 이 함수가 만든 `BouquetIndex` 뿐이다.
 *
 * ── 무엇을 싣고 무엇을 버리는가 ──────────────────────────────────────
 * 이 화면은 **서버 액션이 없다**(정적 드롭 데모에서도 조합을 바꿀 때마다 판정이 다시
 * 서야 한다). 그래서 판정에 필요한 것은 미리 다 실어 보낸다:
 *   · 엔진 `FlowerData` 전체 — `exclude()` 가 먹는 모양 그대로여야 안전 판정을 재사용한다
 *     (`lib/engine/bouquet.ts` 머리말의 금지선). 실측 59종 ≈ 72KB / gzip ≈ 10KB.
 *   · 색 팔레트 — 색당 **꽃말 한 줄만**. `meanings.csv` 369행을 통째로 보내지 않는다.
 *     고르는 규칙은 결과 화면과 같은 함수(`buildColorOptions`)가 정한다.
 *   · 안전 대체 — id 가 아니라 **이름까지 풀어서**. 화면이 id 를 이름으로 되돌릴 표를
 *     따로 갖지 않게.
 * 버리는 것: 이야기 407편·탄생화 366일·읽을거리 54건·도판 취득 주소·인용문. 이 화면이
 * 한 줄도 쓰지 않는다.
 */

import { colorChoice } from '@/components/flow/labels';
import { buySearchName } from '@/components/flowers/buy-name';
import type { Catalog } from '@/lib/data/types';
import { accentCandidates, mainCandidates } from '@/lib/engine/bouquet';
import { buildColorOptions } from '@/lib/engine/explain';
import type { FlowerRef } from '@/lib/engine/types';
import { plateCredits, plateViewFor } from '@/lib/plates';

import type { BouquetColorView, BouquetFlowerView, BouquetIndex } from './types';

/**
 * 그 꽃이 실제로 나오는 색 + 색별 꽃말 + 스와치.
 *
 * 꽃말을 고르는 일은 `buildColorOptions()` 가 한다 — 결과 화면의 색 재선택과 **같은 규칙**
 * (색이 일치하는 행 → 색을 가리지 않는 행 → 둘 다 없으면 꽃말 없이 색 이름만)이어야
 * 같은 꽃이 두 화면에서 다른 말을 품지 않는다. 실측 279칸 중 271칸에 꽃말이 붙는다.
 */
function paletteFor(
  flower: Catalog['flowers'][number],
  meanings: Catalog['meanings'],
): BouquetColorView[] {
  return buildColorOptions(flower, meanings).map((option) => {
    const swatch = colorChoice(option.color);
    const view: BouquetColorView = {
      value: option.color,
      label: swatch.label,
      hex: swatch.hex,
    };
    if (swatch.needsRing) view.needsRing = true;
    if (option.meaningKo !== undefined) view.meaningKo = option.meaningKo;
    if (option.confidenceLevel !== undefined) view.confidence = option.confidenceLevel;
    return view;
  });
}

/**
 * `pet_safety.csv` 의 `safe_alternative_flower_ids` → 이름까지 붙인 목록.
 *
 * 두 종(고양이·강아지) 행이 같은 대안을 적어 두는 일이 흔해서 id 로 한 번 접는다.
 * 카탈로그에 없는 id 는 떨어뜨린다 — 이름을 못 찾은 꽃을 화면에 세울 수는 없다
 * (시드 교차 검증이 막고 있어 실제로는 만나지 않지만, 화면이 그것에 기대지 않는다).
 */
function safeAlternativesFor(
  flowerId: string,
  catalog: Catalog,
  names: ReadonlyMap<string, string>,
): FlowerRef[] {
  const seen = new Set<string>();
  const refs: FlowerRef[] = [];

  for (const record of catalog.petSafety) {
    if (record.flowerId !== flowerId) continue;
    for (const id of record.safeAlternativeFlowerIds) {
      if (seen.has(id)) continue;
      const nameKo = names.get(id);
      if (nameKo === undefined) continue;
      seen.add(id);
      refs.push({ id, nameKo });
    }
  }

  return refs;
}

/** 카탈로그 → 화면 한 벌. 순서는 카탈로그(=`flowers.csv`) 그대로다. */
export function buildBouquetIndex(catalog: Catalog): BouquetIndex {
  const names = new Map(catalog.flowers.map((flower) => [flower.id, flower.nameKo]));

  const flowers: BouquetFlowerView[] = catalog.flowers.map((flower) => {
    const view: BouquetFlowerView = {
      id: flower.id,
      nameKo: flower.nameKo,
      nameEn: flower.nameEn,
      scientificName: flower.scientificName,
      colors: flower.colors,
      bloomMonths: flower.bloomMonths,
      fragranceLevel: flower.fragranceLevel,
      priceBand: flower.priceBand,
      aestheticTags: flower.aestheticTags,
      petSafety: flower.petSafety,
      paletteKo: paletteFor(flower, catalog.meanings),
      safeAlternatives: safeAlternativesFor(flower.id, catalog, names),
      buyName: buySearchName(flower.nameKo),
    };

    /*
     * 칩 썸네일 — 폭은 **여기서** 정한다(기본값 250 = 160px 썸네일).
     * 이 그림이 서는 자리는 48px 칩 하나뿐이라 본판(≤1100px · 장당 200KB)을 물릴 이유가
     * 없다. `/stories` 레인 헤더가 예전에 그 값을 되돌려 첫 화면에서만 1.4MB 를 받았다.
     */
    const plate = plateViewFor(flower.id);
    if (plate) view.plate = { src: plate.src, alt: plate.alt };

    return view;
  });

  /*
   * 도판 크레딧 — 칩에 액자를 세운 꽃만, 판본 단위로 합쳐서
   * (`docs/illustration-assets.md` 사용 규칙 4 · `/stories` · `/reads` 푸터와 같은 함수).
   */
  const credits = plateCredits(flowers.flatMap((flower) => (flower.plate ? [flower.id] : [])));

  return { flowers, credits };
}

/**
 * 인트로 숫자 세 개 — 목록을 두 번 만들지 않으려고 같은 순수 함수를 서버에서도 부른다.
 * (브라우저가 칩을 세울 때 부르는 것과 **같은 함수**다.)
 */
export function bouquetStats(index: BouquetIndex): {
  mainCount: number;
  accentCount: number;
  colorCount: number;
} {
  const colors = new Set(
    index.flowers.flatMap((flower) => flower.paletteKo.map((color) => color.value)),
  );

  return {
    mainCount: mainCandidates(index.flowers).length,
    accentCount: accentCandidates(index.flowers).length,
    colorCount: colors.size,
  };
}
