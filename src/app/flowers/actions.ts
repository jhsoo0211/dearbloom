'use server';

/**
 * `/flowers` 서버 액션 — 탄생화 표를 **필요한 만큼만** 가져온다.
 *
 * 두 벌이다. 생일 꽃 찾기가 부르는 **하루 한 장**(`lookupBirthFlower`)과 탄생화 사전이
 * 부르는 **한 달치**(`listBirthMonth`). 둘 다 같은 규율 위에 서 있다 — 366행을 첫 응답에
 * 얹지 않는다(아래 주석).
 *
 * ── 왜 클라이언트에 표를 내려보내지 않았나 (성능 리뷰 규율) ──────────────
 * 탄생화 표는 366행이다. 화면이 쓰는 칸(이름·영문명·학명·꽃말·flower_id)만 추려도
 * 직렬화하면 **50~60KB** 가 첫 응답에 얹힌다. 그런데 한 사람이 실제로 보는 것은
 * **자기 생일 하루**뿐이다 — 나머지 365일은 파싱 비용만 내고 화면에 서지 않는다.
 *
 * `/stories` 가 같은 문제를 이미 겪었다(성능 리뷰 P1-7): 이야기 317편의 전문을 통째로
 * 실어 보내 RSC payload 가 275KB 였고 첫 화면에서 107~124ms 롱태스크를 물었다. 전문은
 * 시트를 연 한 편만 읽히므로 그 한 편을 그때 가져오게 고쳤다. **여기가 그것과 같은 모양**이라
 * 같은 답을 쓴다. 대신 일 셀렉트가 필요로 하는 달력(12개 숫자)만 미리 내려보낸다
 * (`FlowerIndexData.birthCalendar` — 그것이 없으면 월을 고르는 순간마다 왕복이 한 번 더 는다).
 *
 * ⚠ `'use server'` 파일은 **async 함수만** 내보낼 수 있다(상수·타입 export 금지).
 *   모양(`BirthFlowerView`·`BirthMonthView`)의 원본은 `components/flowers/types.ts` 다.
 * ⚠ **액션을 하나 늘리면 데모 쌍둥이도 함께 늘려라** — `src/lib/demo/flowers-actions.ts`.
 *   `NEXT_PUBLIC_STATIC_DEMO=1` 빌드는 이 모듈을 **통째로** 그 파일로 갈아 끼운다
 *   (`next.config.ts` 의 turbopack `resolveAlias`). 즉 여기에만 있는 export 는 정적
 *   데모에서 `undefined` 가 되고, `output: 'export'` 빌드(`npm run build:static`)가 깨진다.
 *   쌍둥이는 **같은 이름·같은 시그니처**여야 하고, 값은 브라우저에서 다시 조립하지 말고
 *   빌드 타임에 **서버와 같은 함수로** 굳혀 둔다(`scripts/build-demo-catalog.mjs`) —
 *   조립을 두 번 쓰면 정적 데모에서만 다른 문장이 나온다.
 * ⚠ 서버 액션의 인자는 **네트워크에서 오는 값**이다. 타입 선언은 런타임 보증이 아니므로
 *   아래에서 범위를 직접 확인한다.
 *
 * 카탈로그는 `loadCatalog()` 가 프로세스 단위로 캐시하고 있어(모듈 스코프) 이 호출이
 * 매번 CSV 를 다시 읽지는 않는다 — 첫 한 번만 디스크를 본다.
 */

import type { BirthFlowerView, BirthMonthView } from '@/components/flowers/types';
import { birthDateLabel, birthFlowerOn } from '@/lib/data/birth-flowers';
import { buildBirthMonth } from '@/components/flowers/birth-dict';
import { hasFinalConsonant } from '@/components/landing/landing-data';
import { loadCatalog } from '@/lib/data/catalog';

/**
 * 그 날짜의 탄생화. 표에 없는 날짜(2월 30일 등)면 `null`.
 *
 * `null` 을 돌려주고 throw 하지 않는 이유는 `/stories` 의 `loadStoryDetail` 과 같다 —
 * 던지면 클라이언트에는 뭉개진 오류만 남고 사람이 읽을 문장은 남지 않는다.
 */
export async function lookupBirthFlower(month: number, day: number): Promise<BirthFlowerView | null> {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;

  const catalog = await loadCatalog();
  const row = birthFlowerOn(catalog.birthFlowers, month, day);
  if (!row) return null;

  // 도감 이름은 표 이름과 다를 수 있다(`노랑수선화` ↔ `수선화`). 링크를 걸 때는 도착지가
  // 실제로 뭐라고 불리는지 함께 보여 줘야 "다른 꽃으로 보내는 링크"로 읽히지 않는다.
  const linked = row.flowerId
    ? catalog.flowers.find((flower) => flower.id === row.flowerId)
    : undefined;

  return {
    dateLabel: birthDateLabel(row.month, row.day),
    nameKo: row.nameKo,
    ...(row.nameEn ? { nameEn: row.nameEn } : {}),
    ...(row.scientificName ? { scientificName: row.scientificName } : {}),
    meaning: row.meaningKo,
    meaningCopula: hasFinalConsonant(row.meaningKo) ? '이에요' : '예요',
    ...(linked ? { link: { href: `/flowers/${linked.id}`, nameKo: linked.nameKo } } : {}),
  };
}

/**
 * 그달의 탄생화 전부(28~31행) — **탄생화 사전**(§1.5m ⑤)이 한 번에 펼치는 단위.
 *
 * 하루 한 장으로는 "탄생화가 366일인데 도감은 32종"이라는 사실을 보여 줄 수 없다.
 * 그렇다고 366행을 첫 응답에 실으면 위 머리말이 든 그 문제를 되풀이하므로, 사람이 실제로
 * 훑는 단위인 **달**로 자른다. 실측 페이로드는 한 달에 8.2~10.0KB(gzip 1.4~1.8KB)이고 —
 * 달을 고른 사람만 받는다. 표 통짜는 64.8KB(gzip 9.2KB)다.
 *
 * 조립 규칙의 원본은 `components/flowers/birth-dict.ts` 다(정적 데모 생성기도 같은 함수를
 * 부른다 — 브라우저에서 문장을 다시 맞추면 서버가 만들던 것과 어긋날 여지가 생긴다).
 *
 * 범위 밖이거나 표에 없는 달이면 `null`. 던지지 않는 이유는 `lookupBirthFlower` 와 같다.
 */
export async function listBirthMonth(month: number): Promise<BirthMonthView | null> {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;

  const catalog = await loadCatalog();
  return buildBirthMonth(catalog, month);
}
