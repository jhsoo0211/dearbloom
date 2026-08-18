/**
 * 계절 달력 뷰모델 — 카탈로그(실데이터) → 화면이 그대로 쓰는 모양.
 *
 * **서버에서만 부른다.** 실사 상수(`@/lib/photos`)와 탄생화 조회를 끌어오므로 클라이언트
 * 컴포넌트가 이 파일을 import 하면 그것들이 통째로 브라우저 번들에 실린다(`data.ts` 와
 * 같은 경계). 화면에 내려보낼 값은 전부 여기서 확정해 `types.ts` 의 모양으로 넘긴다.
 *   (fs 의존은 없다 — 카탈로그는 호출부가 `loadCatalog()` 로 읽어 넘겨준다.)
 *
 * ═══ 이 조립이 지키는 것 ═══════════════════════════════════════════════
 * ① **가볍다.** 59종 × 개화달이 전부다(슬러그·이름·썸네일 주소 한 벌). 탄생화 366행은
 *    싣지 않는다 — 달마다 가는 것은 그리로 건너가는 다리가 쓸 **숫자 하나**뿐이다(§1.5m ③).
 * ② **오늘을 보지 않는다.** 「지금 달」 판정은 브라우저의 몫이라(`bloom-calendar.ts` 머리말)
 *    여기서 `new Date()` 를 부르면 그 판정이 정적 HTML 에 굳는다. 이 파일에 시계는 없다.
 * ③ **순서는 카탈로그 순서다.** 정렬 규칙을 새로 지어내지 않는다 — 다시 찾아온 사람이
 *    같은 달에서 같은 자리의 꽃을 만난다.
 * ④ **없는 것을 지어내지 않는다.** 컷이 없는 꽃은 `thumbSrc` 키 자체가 없고, 그달에 피는
 *    꽃이 없으면 빈 배열이다. 화면이 그 빈자리를 그대로 말한다.
 */

import { birthFlowersInMonth } from '@/lib/data/birth-flowers';
import type { Catalog, CatalogFlower } from '@/lib/data/types';
import { photoCredits, photoFor, photoSrc } from '@/lib/photos';
import { BLOOM_MONTHS, bloomMonthLabel, isYearRound } from './bloom-calendar';
import type { BloomCalendarData, BloomChip, BloomMonthGroup } from './types';

/**
 * 칩 썸네일의 폭.
 *
 * 화면에서 36px 로 서는 자리에 640 은 커 보이지만, `photoSrc()` 가 허용하는 가장 작은
 * 폭이 640 이다(CDN 캐시가 갈라지지 않게 네 폭으로 묶어 둔 그 표). 사전 목록의 44px
 * 썸네일도 같은 값을 쓰므로 **이미 받아 둔 사본을 그대로 재사용**하게 된다 — 폭을
 * 새로 만들면 오히려 캐시가 갈린다.
 */
const CHIP_WIDTH = 640 as const;

function toChip(flower: CatalogFlower): BloomChip {
  const photo = photoFor(flower.id);

  return {
    slug: flower.id,
    nameKo: flower.nameKo,
    ...(photo ? { thumbSrc: photoSrc(photo, CHIP_WIDTH) } : {}),
  };
}

export function buildBloomCalendar(catalog: Catalog): BloomCalendarData {
  /**
   * 달력에 서는 꽃 = **개화 달이 적힌 종**만. 표에 달을 못 적어 둔 꽃은 어느 칸에도
   * 넣지 않는다 — 지어내서 아무 달에나 세우면 달력이 곧 거짓말이 된다.
   */
  const blooming = catalog.flowers.filter((flower) => flower.bloomMonths.length > 0);

  const months: BloomMonthGroup[] = BLOOM_MONTHS.map((month) => ({
    month,
    monthLabel: bloomMonthLabel(month),
    slugs: blooming
      .filter((flower) => flower.bloomMonths.includes(month))
      .map((flower) => flower.id),
    // 표에서 직접 센다 — 28·29·30·31 을 상수로 베껴 두면 표가 바뀌는 날 화면만 옛말을 한다.
    birthDayCount: birthFlowersInMonth(catalog.birthFlowers, month).length,
  }));

  return {
    flowers: blooming.map(toChip),
    months,
    flowerCount: catalog.flowers.length,
    bloomingCount: blooming.length,
    yearRoundCount: blooming.filter((flower) => isYearRound(flower.bloomMonths)).length,
    /**
     * 크레딧은 **화면에 실제로 건 컷**만 센다(`photoCredits` 가 중복을 지우고 세운다).
     * 달마다 같은 꽃이 여러 번 서지만 사진은 한 장이므로, 여기서 한 벌로 접힌다.
     */
    credits: photoCredits(blooming.map((flower) => flower.id)),
  };
}
