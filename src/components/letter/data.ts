/**
 * 비밀 편지 뷰모델 — 카탈로그(실데이터) → 화면이 그대로 쓰는 꽃 목록.
 *
 * **서버에서만 부른다.** 도감 인덱스를 거쳐 엔진·라벨 사전을 끌어오므로 클라이언트
 * 컴포넌트가 이 파일을 import 하면 그것들이 통째로 브라우저 번들에 실린다
 * (`components/flowers/data.ts` 와 같은 경계).
 *
 * ── 왜 도감 인덱스를 다시 쓰는가 ─────────────────────────────────────
 * 편지 화면에 필요한 것은 꽃 이름·대표 꽃말·계열·검색 색인인데, 그 넷은 이미
 * `buildFlowerIndex()` 가 만든다. 여기서 다시 계산하면 "대표 꽃말을 고르는 규칙" 이 두 벌이
 * 되고, 어느 날 도감과 편지가 같은 꽃에 다른 꽃말을 붙인다. 32종을 한 번 훑는 비용은
 * 그 위험보다 싸다.
 */

import { buildFlowerIndex } from '@/components/flowers/data';
import type { Catalog } from '@/lib/data/types';
import { needsDarkOverlay, photoFor, photoSrc, photoSrcSet } from '@/lib/photos';
import { plateViewFor } from '@/lib/plates';
import type { LetterFlowerOption } from './types';

/**
 * 편지에 곁들일 꽃 전종. 순서는 **카탈로그 순서** 그대로다 —
 * 다시 찾아온 사람이 같은 자리에서 같은 꽃을 만난다(무작위 금지).
 *
 * 사진이 없는 꽃은 목록에서 빼지 않는다. 편지지의 꽃 칸은 사진이 없어도
 * 이름과 꽃말로 성립하고, 실사가 비는 것은 데이터가 늘어나는 동안의 상태다.
 */
export function buildLetterFlowers(catalog: Catalog): LetterFlowerOption[] {
  const { flowers } = buildFlowerIndex(catalog);

  return flowers.map((flower) => {
    const photo = photoFor(flower.slug);
    // 도판은 편지지 위 **소품**이라 썸네일(기본 250)이면 넉넉하다.
    const plate = plateViewFor(flower.slug);

    const option: LetterFlowerOption = {
      flowerId: flower.slug,
      nameKo: flower.nameKo,
      meaning: flower.meaning,
      category: flower.category,
      searchKey: flower.haystack,
      thumbSrc: photo ? photoSrc(photo, 640) : '',
      thumbSrcSet: photo ? photoSrcSet(photo, [640, 1080]) : '',
      photoSrc: photo ? photoSrc(photo, 1080) : '',
      photoSrcSet: photo ? photoSrcSet(photo, [640, 1080]) : '',
      alt: photo?.alt ?? `${flower.nameKo} 사진`,
      credit: photo?.credit ?? '',
    };

    if (photo && needsDarkOverlay(photo)) option.bright = true;
    if (plate) option.plate = { src: plate.src, alt: plate.alt };

    return option;
  });
}
