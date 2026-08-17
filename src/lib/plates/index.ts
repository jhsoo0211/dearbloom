/**
 * 꽃 세밀화 도판 59종 — 퍼블릭 도메인 보태니컬 도판의 **단일 원본**.
 *
 * 출처 문서: `docs/illustration-assets.md`
 * (2026-08-15 조사 32종 + 2026-08-16 확장 배치 1 15종 + 2026-08-17 확장 배치 2 12종 = 59/59).
 * 이 파일은 그 표를 **코드로 옮긴 사본**이다. 도판을 바꾸거나 늘릴 때는 문서를 먼저 고치고
 * 여기로 옮긴다 — 문서가 라이선스 근거를 들고 있고, 이 파일은 화면이 쓰는 모양만 갖는다.
 *
 * ⚠ 도판 상수는 **여기 한 벌뿐이다.** 예전에는 `components/stories/plates.ts` 와
 *   `components/flowers/illustrations.ts` 두 벌이 있었고, 벚꽃(A안/B안)과 거베라(호스트)가
 *   서로 다른 값을 들고 있어 같은 꽃이 화면마다 다른 그림을 보여 줬다. 그래서 `src/lib` 로
 *   끌어올려 양쪽 화면(`/stories` · `/flowers`)이 같은 모듈을 import 한다.
 *   **컴포넌트 폴더에 도판 상수를 다시 만들지 마라.**
 *
 * ── 두 가지 확정 사항 (Advisor, 2026-08-15) ──────────────────────────
 *   · `cherry-blossom` = **B안**(비테 《플로라》 Pl.14). A안(우키요에 화조화)은 새·물·담청
 *     하늘 때문에 나머지 30종과 화풍이 갈린다. 대신 B안은 벚나무가 아니라 같은 *Prunus* 속의
 *     겹꽃이므로 **종을 단정하지 않고 `note` 로 밝힌다**(문서 §미확보 A 권고).
 *   · `gerbera` = **Internet Archive 대안 URL**. 정본(Curtis t.7087)의 유일한 고해상 출처인
 *     plantillustrations.org 는 안정성을 신뢰할 수 없다(문서 §미확보 B).
 *
 * ── 라이선스 ────────────────────────────────────────────────────────
 * 59종 전부 퍼블릭 도메인 또는 CC0 다. 표기 의무는 없지만 **표기를 기본값으로 운용**한다
 * (BHL→Flickr 경유 파일 16종에 `CC BY 2.0` 상자가 기계적으로 붙어 있는 이슈를 한 번에 덮는
 * 가장 싼 보험이고, "야간 식물 아카이브" 라는 톤에도 출처 표기가 어울린다).
 * 표기 형식은 문서 사용 규칙 4 그대로 — `Plate: {작품명}, {연도} / {소장·제공 기관}`.
 *
 * ── 자체 호스팅 (문서 배포 규칙 1, 2026-08-15 적용 완료) ──────────────
 * `src` 는 전부 **우리 `public/plates/` 사본**이다. 47종이 전부 PD/CC0 라 재배포에 제약이
 * 없고, 위키미디어는 핫링크 연속 요청에 `HTTP 429` 를 돌려주기 때문이다(문서 배포 규칙 2 —
 * 레인 32줄이 한 화면에서 동시에 요청하면 그 상태가 곧바로 재현된다).
 *   · 취득 주소는 `remoteSrc` 에 그대로 남겨 둔다 — 재다운로드의 입력이자 출처 증빙이다.
 *   · 파일을 다시 받는 방법: `node scripts/fetch-plates.mjs`(`--force` 로 덮어쓰기,
 *     `--reencode` 로 재다운로드 없이 다시 정규화). 저장 경로는 이 파일의 `src` 가 정한다 —
 *     스크립트가 `src` 를 읽어 그 자리에 쓴다.
 *   · **59종 전부 `.jpg` 다** — 확장자를 원본대로 두지 않고 한 규격으로 정규화한다.
 *     스크립트가 `sharp` 로 폭 ≤1100px · 알파는 흰 배경 flatten · JPEG q82(mozjpeg) 로
 *     **다시 인코딩해** 저장하므로, 파일 바이트 자체가 JPEG 다(이름만 바꾼 게 아니다).
 *     그래서 정적 서버가 말하는 `Content-Type: image/jpeg` 가 사실과 맞는다.
 *     위키미디어 PNG 판본 7종이 장당 2.5~4.3MB 로 전체 용량의 2/3 를 먹던 문제가
 *     이 한 단계로 사라진다(레인 헤더는 44px 썸네일에 그 파일을 통째로 물고 있었다).
 *
 * ── 썸네일 한 벌 더 (성능 리뷰 P0-2, 2026-08-15) ─────────────────────
 * 본판은 ≤1100px 인데 화면이 그것을 거는 자리는 **레인 헤더 44px · 시트 액자 ≤92px** 뿐이다.
 * 32줄이 한 화면에 서면 44px 칸마다 200KB짜리 판면을 통째로 물어, 첫 화면에서만 1.4MB 를
 * 내려받았다. 그래서 `public/plates/thumbs/{같은 이름}.jpg` 에 **160px 사본**을 함께 둔다
 * (`scripts/fetch-plates.mjs` 가 본판을 쓸 때 같이 만든다). 고르는 일은 `plateSrc(plate, width)`
 * 한 곳에서 끝난다 — 자체 호스팅으로 옮긴 뒤 `width` 는 아무 일도 하지 않는 인자였다.
 *
 * ── 표는 서버·스크립트 전용이다 (코드 리뷰 P1-7) ─────────────────────
 * `remoteSrc`·`pageUrl` 은 **화면이 한 줄도 쓰지 않는다.** 그런데 클라이언트 컴포넌트가
 * `plateFor()` 를 부르면 이 표가 통째로 브라우저 번들에 실린다(실제로 `/stories` 청크에
 * 위키미디어 주소 32벌이 들어 있었다). 그래서 클라이언트로 건너가는 값은 `plateViewFor()`
 * 가 만든 **`PlateView`(`./view.ts`)** 뿐이고, 그 값은 서버 컴포넌트가 props 로 내려보낸다.
 * ⚠ 클라이언트 컴포넌트에서 이 모듈을 값으로 import 하지 마라(타입은 `./view` 에서 가져온다).
 *
 * 순수 데이터·순수 함수만 둔다(React·fs 의존 금지) — 서버 컴포넌트와
 * `scripts/fetch-plates.mjs`(node)가 같은 파일을 읽는다.
 */

import type { PlateView } from './view';

export type { PlateView };

export interface FlowerPlate {
  /** `content/flowers.csv` 의 id. */
  flowerId: string;
  /**
   * 화면이 쓰는 주소 = **자체 호스팅 사본**(`/plates/…` → `public/plates/…`).
   * 이 값이 곧 다운로드 저장 경로다(`scripts/fetch-plates.mjs`).
   */
  src: string;
  /**
   * 취득 URL = 문서 표의 `직접 URL`(위키미디어 표준 1280px 썸네일).
   * 런타임에 부르지 않는다 — 재다운로드용이자 출처 증빙이다.
   */
  remoteSrc: string;
  /** 파일 페이지 — 라이선스 증빙이자 사람이 확인하러 가는 자리. */
  pageUrl: string;
  /** 도판이 실제로 무엇을 그렸는지. 꽃 이름은 이미 헤딩에 있으므로 여기서는 그림만 말한다. */
  alt: string;
  /** 화가·석판공. 모르면 '작가 미상'. */
  artist: string;
  /** 작품명(표기 형식의 `{작품명}`). 같은 판본은 **같은 문자열**이어야 크레딧이 합쳐진다. */
  work: string;
  /** 그 작품 안에서의 도판 번호. 크레딧에는 안 들어가고 각주에만 붙는다. */
  plateNo?: string;
  /** 간행·제작 연도. 범위면 `1817–1824`. */
  year: string;
  /** 소장·제공 기관. */
  institution: string;
  /**
   * 카탈로그의 종과 도판의 종이 다르거나, 판면에 손을 댄 경우의 **정직한 한 줄**.
   * 화면(상세 시트 각주)에 그대로 나간다 — 감추지 않는 것이 이 서비스의 신뢰 규칙이다.
   */
  note?: string;
}

/* 판본 이름은 문자열을 재사용해 크레딧이 자동으로 합쳐지게 한다(오타 방지도 겸한다). */
const WITTE = 'Witte, Flora';
const STEP_FAVOURITE = 'Step, Favourite Flowers of Garden and Greenhouse';
const REDOUTE_LILIACEES = 'Redouté, Les Liliacées';
const CURTIS = "Curtis's Botanical Magazine";
const WENDEL = 'A.J. Wendel · G. Severeyns';
const STEP_WAYSIDE = 'Step, Wayside and Woodland Blossoms';
const REDOUTE = 'Pierre-Joseph Redouté';
const STEP = 'Edward Step';
/**
 * 아래 둘은 2026-08-17 확장 배치 2 에서 **상수로 승격**했다. 그전에는 각각 한 종
 * (camellia · jasmine)뿐이라 문자열을 그 자리에 적어 두었는데, 이번에 같은 판본을 쓰는
 * 꽃이 하나씩 더 붙었다 — 두 곳에 손으로 같은 문자열을 적으면 오타 한 글자에
 * `plateCredits()` 가 크레딧을 두 줄로 갈라 놓는다(머리말의 "판본 이름은 재사용한다").
 */
const BOTANICAL_REGISTER = 'Edwards, The Botanical Register';
const DESCOURTILZ = 'Descourtilz, Flore médicale des Antilles';
/** 확장 배치 2 에서 새로 들어온 판본 둘 — 나머지 열 종은 기존 판본으로 채웠다. */
const THE_GARDEN = 'Hamilton, The Garden';
const FLORA_JAPONICA = 'Siebold · Zuccarini, Flora Japonica';

const COMMONS = 'Wikimedia Commons';
const BHL = 'Biodiversity Heritage Library';

/** 꽃 id → 도판. 카탈로그 59종 전원이 여기 있다(`tests/components/plates.test.ts` 가 지킨다). */
export const FLOWER_PLATES: Record<string, FlowerPlate> = {
  'rose-red': {
    flowerId: 'rose-red',
    src: '/plates/rose-red.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Redoute_-_Rosa_gallica_regalis.jpg/1280px-Redoute_-_Rosa_gallica_regalis.jpg',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Redoute_-_Rosa_gallica_regalis.jpg',
    alt: '연분홍 겹장미가 만개한 세밀화',
    artist: REDOUTE,
    work: 'Redouté, Les Roses',
    year: '1817–1824',
    institution: COMMONS,
    note: '도판은 현대 원예장미의 원종 계열인 Rosa gallica 예요.',
  },
  'tulip-white': {
    flowerId: 'tulip-white',
    src: '/plates/tulip-white.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Gc16_tulipa_gesneriana.jpg/1280px-Gc16_tulipa_gesneriana.jpg',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Gc16_tulipa_gesneriana.jpg',
    alt: '크림빛 양피지 위에 그린 튤립 네 송이 세밀화',
    artist: 'Hans-Simon Holtzbecker',
    work: 'Holtzbecker, Gottorfer Codex',
    year: '1649–1659',
    institution: 'Statens Museum for Kunst',
  },
  freesia: {
    flowerId: 'freesia',
    src: '/plates/freesia.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Freesia-J.Eudes-02.JPG/1280px-Freesia-J.Eudes-02.JPG',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Freesia-J.Eudes-02.JPG',
    alt: '연노랑 프리지아와 휴면 구근을 함께 그린 세밀화',
    artist: 'Eugène-Jules Eudes',
    work: 'Eudes, Les Fleurs de Jardins',
    year: '1929',
    institution: COMMONS,
  },
  'lily-asiatic': {
    flowerId: 'lily-asiatic',
    src: '/plates/lily-asiatic.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Lilium_lancifolium_in_Les_liliacees.jpg/1280px-Lilium_lancifolium_in_Les_liliacees.jpg',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Lilium_lancifolium_in_Les_liliacees.jpg',
    alt: '주황빛 꽃잎이 뒤로 말린 참나리 세밀화',
    artist: REDOUTE,
    work: REDOUTE_LILIACEES,
    year: '1802–1816',
    institution: COMMONS,
    note: '도판은 아시아틱 백합의 실제 모종인 참나리(Lilium lancifolium)예요.',
  },
  gerbera: {
    flowerId: 'gerbera',
    src: '/plates/gerbera.jpg',
    // Advisor 확정 — plantillustrations.org 대신 같은 스캔의 Internet Archive 사본.
    remoteSrc: 'https://archive.org/download/mobot31753002721907/page/n169_w1800.jpg',
    pageUrl: 'https://archive.org/details/mobot31753002721907/page/n169/mode/1up',
    alt: '살구빛과 크림빛 거베라 두 송이 세밀화',
    artist: 'Matilda Smith · J.N. Fitch',
    work: CURTIS,
    plateNo: 't.7087',
    year: '1889',
    institution: 'Internet Archive · Missouri Botanical Garden',
  },
  anemone: {
    flowerId: 'anemone',
    src: '/plates/anemone.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/WitteHeinrichFlora1868-051-Anemone_coronaria.png/1280px-WitteHeinrichFlora1868-051-Anemone_coronaria.png',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-051-Anemone_coronaria.png',
    alt: '붉은빛·자줏빛·흰빛 아네모네 일곱 송이를 모은 세밀화',
    artist: WENDEL,
    work: WITTE,
    plateNo: 'Pl.51',
    year: '1868',
    institution: COMMONS,
  },
  hellebore: {
    flowerId: 'hellebore',
    src: '/plates/hellebore.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/WitteHeinrichFlora1868-033-Helleborus_niger.png/1280px-WitteHeinrichFlora1868-033-Helleborus_niger.png',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-033-Helleborus_niger.png',
    alt: '흰빛에서 연분홍으로 물든 헬레보어 네 송이와 짙은 잎 세밀화',
    artist: WENDEL,
    work: WITTE,
    plateNo: 'Pl.33',
    year: '1868',
    institution: COMMONS,
  },
  hyacinth: {
    flowerId: 'hyacinth',
    src: '/plates/hyacinth.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/De_blauwe_hyacint_Franciscus_Primus%2C_RP-T-1948-46.jpg/1280px-De_blauwe_hyacint_Franciscus_Primus%2C_RP-T-1948-46.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:De_blauwe_hyacint_Franciscus_Primus,_RP-T-1948-46.jpg',
    alt: '연푸른 겹히아신스 한 대를 곧게 세워 그린 수채 세밀화',
    artist: 'Jan Augustini',
    work: 'Augustini, De blauwe hyacint Franciscus Primus',
    year: '1762',
    institution: 'Rijksmuseum',
  },
  peony: {
    flowerId: 'peony',
    src: '/plates/peony.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Favourite_flowers_of_garden_and_greenhouse_%28Pl._13%29_%287789025266%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._13%29_%287789025266%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(Pl._13)_(7789025266).jpg',
    alt: '흰 작약 두 송이와 잎을 그린 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.13',
    year: '1896',
    institution: BHL,
  },
  hydrangea: {
    flowerId: 'hydrangea',
    src: '/plates/hydrangea.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/WitteHeinrichFlora1868-060-Hydrangea_macrophylla.png/1280px-WitteHeinrichFlora1868-060-Hydrangea_macrophylla.png',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-060-Hydrangea_macrophylla.png',
    alt: '붉은 얼룩이 섞인 레이스캡형 수국 세밀화',
    artist: WENDEL,
    work: WITTE,
    plateNo: 'Pl.60',
    year: '1868',
    institution: COMMONS,
    note: '도판은 레이스캡형 옛 변종이라, 요즘 꽃집에서 보는 둥근 겹꽃 수국과 모양이 달라요.',
  },
  lavender: {
    flowerId: 'lavender',
    src: '/plates/lavender.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Illustration_Lavandula_angustifolia0.jpg/1280px-Illustration_Lavandula_angustifolia0.jpg',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Illustration_Lavandula_angustifolia0.jpg',
    alt: '라벤더 전초와 꽃·수술·씨 해부도를 함께 그린 도감형 세밀화',
    artist: 'Otto Wilhelm Thomé',
    work: 'Thomé, Flora von Deutschland, Österreich und der Schweiz',
    year: '1885',
    institution: COMMONS,
  },
  sunflower: {
    flowerId: 'sunflower',
    src: '/plates/sunflower.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/American_medicinal_plants_%28Plate_83%29_%286025414321%29.jpg/1280px-American_medicinal_plants_%28Plate_83%29_%286025414321%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:American_medicinal_plants_(Plate_83)_(6025414321).jpg',
    alt: '왼쪽 반은 채색, 오른쪽 반은 선묘로 그린 해바라기 세밀화',
    artist: 'Charles F. Millspaugh',
    work: 'Millspaugh, American Medicinal Plants',
    plateNo: 'Pl.83',
    year: '1887',
    institution: BHL,
  },
  carnation: {
    flowerId: 'carnation',
    src: '/plates/carnation.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Favourite_flowers_of_garden_and_greenhouse_%28Pl._36%29_%287789066486%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._36%29_%287789066486%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(Pl._36)_(7789066486).jpg',
    alt: '단색 카네이션 네 송이와 줄무늬 카네이션 두 송이를 한 판에 그린 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.36',
    year: '1896',
    institution: BHL,
  },
  lisianthus: {
    flowerId: 'lisianthus',
    src: '/plates/lisianthus.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Eustoma_exaltatum_subsp._russellianum_%28Lisianthius_russellianus%29_Bot._Mag._65._3626._1838.jpg/1280px-Eustoma_exaltatum_subsp._russellianum_%28Lisianthius_russellianus%29_Bot._Mag._65._3626._1838.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Eustoma_exaltatum_subsp._russellianum_(Lisianthius_russellianus)_Bot._Mag._65._3626._1838.jpg',
    alt: '자줏빛 리시안셔스 네 송이 세밀화',
    artist: 'Walter Hood Fitch',
    work: CURTIS,
    plateNo: 't.3626',
    year: '1838',
    institution: COMMONS,
  },
  ranunculus: {
    flowerId: 'ranunculus',
    src: '/plates/ranunculus.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Ranunculus_asiaticus-Favourite_Flowers_Garden_Greenhouse-1-0030-6.png/1280px-Ranunculus_asiaticus-Favourite_Flowers_Garden_Greenhouse-1-0030-6.png',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Ranunculus_asiaticus-Favourite_Flowers_Garden_Greenhouse-1-0030-6.png',
    alt: '겹꽃 라넌큘러스 세 송이 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.6',
    year: '1896',
    institution: BHL,
    note: '배경을 지운 복원본이라 다른 도판과 달리 종이 질감이 없어요.',
  },
  'lily-of-the-valley': {
    flowerId: 'lily-of-the-valley',
    src: '/plates/lily-of-the-valley.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Convallaria_majalis_in_Les_liliacees.jpg/1280px-Convallaria_majalis_in_Les_liliacees.jpg',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Convallaria_majalis_in_Les_liliacees.jpg',
    alt: '뿌리까지 그린 은방울꽃 전초 세밀화',
    artist: REDOUTE,
    work: REDOUTE_LILIACEES,
    year: '1802–1816',
    institution: COMMONS,
  },
  chrysanthemum: {
    flowerId: 'chrysanthemum',
    src: '/plates/chrysanthemum.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flora_conspicua_%28Pl._51%29_%286046903472%29.jpg/1280px-Flora_conspicua_%28Pl._51%29_%286046903472%29.jpg',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Flora_conspicua_(Pl._51)_(6046903472).jpg',
    alt: '진분홍 대륜 국화 한 송이 세밀화',
    artist: 'William Clark',
    work: 'Clark · Morris, Flora Conspicua',
    plateNo: 'Pl.51',
    year: '1826',
    institution: BHL,
    note: '진분홍 대륜이라, 흰 국화를 쓰는 상례 자리와는 색이 달라요.',
  },
  narcissus: {
    flowerId: 'narcissus',
    src: '/plates/narcissus.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Narcissus_pseudonarcissus_-_Les_liliac%C3%A9es%2C_vol._3_-_t._158.jpg/1280px-Narcissus_pseudonarcissus_-_Les_liliac%C3%A9es%2C_vol._3_-_t._158.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Narcissus_pseudonarcissus_-_Les_liliacées,_vol._3_-_t._158.jpg',
    alt: '나팔 모양 부화관이 뚜렷한 노란 수선화 세밀화',
    artist: REDOUTE,
    work: REDOUTE_LILIACEES,
    plateNo: 'v.3 t.158',
    year: '1802–1816',
    institution: COMMONS,
    note: '도판은 나팔수선화(N. pseudonarcissus) 쪽이에요.',
  },
  'forget-me-not': {
    flowerId: 'forget-me-not',
    src: '/plates/forget-me-not.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Favourite_flowers_of_garden_and_greenhouse_%2810593688896%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810593688896%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10593688896).jpg',
    alt: '자잘한 푸른 물망초가 모여 핀 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.194',
    year: '1897',
    institution: BHL,
    note: '도판은 같은 물망초군의 알프스 물망초(M. alpestris)예요.',
  },
  'cherry-blossom': {
    flowerId: 'cherry-blossom',
    src: '/plates/cherry-blossom.jpg',
    // Advisor 확정 = B안(비테 세트). 나머지 30종과 판본·화풍이 같아 레인에 나란히 세워도 튀지 않는다.
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/WitteHeinrichFlora1868-014-Prunus_japonica.png/1280px-WitteHeinrichFlora1868-014-Prunus_japonica.png',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-014-Prunus_japonica.png',
    alt: '겹분홍 꽃이 가득 달린 꽃가지 세밀화',
    artist: WENDEL,
    work: WITTE,
    plateNo: 'Pl.14',
    year: '1868',
    institution: COMMONS,
    note: '벚꽃 채색 도판이 남아 있지 않아, 같은 Prunus 속의 겹꽃 도판으로 대신했어요.',
  },
  camellia: {
    flowerId: 'camellia',
    src: '/plates/camellia.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/The_Botanical_register_%28Plate_22%29_BHL8339.jpg/1280px-The_Botanical_register_%28Plate_22%29_BHL8339.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:The_Botanical_register_(Plate_22)_BHL8339.jpg',
    alt: '희고 연분홍빛이 도는 겹동백 한 송이와 짙은 잎 세밀화',
    artist: 'Sydenham Edwards',
    work: BOTANICAL_REGISTER,
    plateNo: 'Pl.22',
    year: '1815',
    institution: BHL,
  },
  violet: {
    flowerId: 'violet',
    src: '/plates/violet.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Favourite_flowers_of_garden_and_greenhouse_%28Pl._32%29_%287789059768%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._32%29_%287789059768%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(Pl._32)_(7789059768).jpg',
    alt: '겹꽃 파르마 제비꽃이 모여 핀 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.32',
    year: '1896',
    institution: BHL,
    note: '도판은 겹꽃 변종인 파르마 제비꽃이에요.',
  },
  iris: {
    flowerId: 'iris',
    src: '/plates/iris.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/WitteHeinrichFlora1868-049-Iris_xiphium.png/1280px-WitteHeinrichFlora1868-049-Iris_xiphium.png',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-049-Iris_xiphium.png',
    alt: '보라·황백·청자빛 아이리스 다섯 송이를 모은 세밀화',
    artist: WENDEL,
    work: WITTE,
    plateNo: 'Pl.49',
    year: '1868',
    institution: COMMONS,
    note: '도판은 더치 아이리스의 주 모종인 Iris xiphium 이에요.',
  },
  marigold: {
    flowerId: 'marigold',
    src: '/plates/marigold.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Favourite_flowers_of_garden_and_greenhouse_%2810575191053%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810575191053%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10575191053).jpg',
    alt: '노란 아프리칸 메리골드 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.144',
    year: '1897',
    institution: BHL,
  },
  'corn-poppy': {
    flowerId: 'corn-poppy',
    src: '/plates/corn-poppy.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Wayside_and_woodland_blossoms_%28Pl._61%29_%288747771268%29.jpg/1280px-Wayside_and_woodland_blossoms_%28Pl._61%29_%288747771268%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Wayside_and_woodland_blossoms_(Pl._61)_(8747771268).jpg',
    alt: '붉은 개양귀비 한 송이를 여백 넓게 그린 세밀화',
    artist: STEP,
    work: STEP_WAYSIDE,
    plateNo: 'Pl.61',
    year: '1895',
    institution: BHL,
  },
  jasmine: {
    flowerId: 'jasmine',
    src: '/plates/jasmine.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Flore_m%C3%A9dicale_des_Antilles%2C_ou%2C_Trait%C3%A9_des_plantes_usuelles_%2810421471426%29.jpg/1280px-Flore_m%C3%A9dicale_des_Antilles%2C_ou%2C_Trait%C3%A9_des_plantes_usuelles_%2810421471426%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Flore_médicale_des_Antilles,_ou,_Traité_des_plantes_usuelles_(10421471426).jpg',
    alt: '흰 재스민 꽃가지와 꽃·씨 해부도를 함께 그린 세밀화',
    artist: 'J. Théodore Descourtilz',
    work: DESCOURTILZ,
    plateNo: 'Pl.447',
    year: '1828',
    institution: BHL,
  },
  'babys-breath': {
    flowerId: 'babys-breath',
    src: '/plates/babys-breath.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Favourite_flowers_of_garden_and_greenhouse_%28Pl._34%29_%287789063128%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._34%29_%287789063128%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(Pl._34)_(7789063128).jpg',
    alt: '자잘한 흰 꽃이 흩뿌려진 안개꽃 가지 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.34',
    year: '1896',
    institution: BHL,
    note: '도판은 같은 속의 Gypsophila elegans 예요(꽃말·안전 정보의 근거와 같은 종이에요).',
  },
  cosmos: {
    flowerId: 'cosmos',
    src: '/plates/cosmos.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Favourite_flowers_of_garden_and_greenhouse_%2810575182183%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810575182183%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10575182183).jpg',
    alt: '연분홍에서 살구빛으로 물든 코스모스 세 송이 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.142',
    year: '1897',
    institution: BHL,
  },
  magnolia: {
    flowerId: 'magnolia',
    src: '/plates/magnolia.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Magnolia_kobus_138-8428.jpg/1280px-Magnolia_kobus_138-8428.jpg',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Magnolia_kobus_138-8428.jpg',
    alt: '크림빛 바탕 위에 흰 목련 가지를 그린 세밀화',
    artist: 'Matilda Smith · J.N. Fitch',
    work: CURTIS,
    plateNo: 't.8428',
    year: '1912',
    institution: COMMONS,
  },
  pansy: {
    flowerId: 'pansy',
    src: '/plates/pansy.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/WitteHeinrichFlora1868-069-Viola_tricolor.png/1280px-WitteHeinrichFlora1868-069-Viola_tricolor.png',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-069-Viola_tricolor.png',
    alt: '자주·노랑·적갈빛 팬지 아홉 송이가 모여 핀 세밀화',
    artist: WENDEL,
    work: WITTE,
    plateNo: 'Pl.69',
    year: '1868',
    institution: COMMONS,
    note: '도판은 현대 팬지의 직계 모종인 Viola tricolor 예요.',
  },
  poinsettia: {
    flowerId: 'poinsettia',
    src: '/plates/poinsettia.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Curtis%27s_botanical_magazine_%28Plate_3493%29_%288043241073%29.jpg/1280px-Curtis%27s_botanical_magazine_%28Plate_3493%29_%288043241073%29.jpg',
    pageUrl:
      "https://commons.wikimedia.org/wiki/File:Curtis's_botanical_magazine_(Plate_3493)_(8043241073).jpg",
    alt: '붉은 포엽이 화면을 채운 포인세티아 세밀화',
    artist: '작가 미상',
    work: CURTIS,
    plateNo: 'Pl.3493',
    year: '1836',
    institution: 'Royal Botanic Gardens Kew',
    note: '세트에서 유일한 가로 판면이라, 액자 안에서 가운데를 잘라 보여드려요.',
  },
  daisy: {
    flowerId: 'daisy',
    src: '/plates/daisy.jpg',
    // 32번째(seed-v5 신규 꽃). `corn-poppy` 와 **같은 책·같은 해·같은 기관**이라 크레딧이 합쳐진다.
    // 판면 캡션에 `Daisy. / Bellis perennis.` 가 직접 찍혀 있어 종 동정이 문자로 확인된다.
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Wayside_and_woodland_blossoms_%28Pl._1%29_%288746620415%29.jpg/1280px-Wayside_and_woodland_blossoms_%28Pl._1%29_%288746620415%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Wayside_and_woodland_blossoms_(Pl._1)_(8746620415).jpg',
    alt: '분홍빛이 비치는 흰 꽃 세 송이와 뿌리째 그린 잎 세밀화',
    artist: STEP,
    work: STEP_WAYSIDE,
    plateNo: 'Pl.1',
    year: '1895',
    institution: BHL,
  },

  /* ---------------------------------------------------------------- *
   * 정식 도감 확장 배치 1 — 15종 (2026-08-16)
   *
   * 15종 중 12종이 **《Favourite Flowers of Garden and Greenhouse》 한 판본**에서 왔다.
   * 우연이 아니라 의도다 — 문서 §출처 분포가 "상위 판본을 우선 쓰면 세트 일관성이
   * 자연스럽게 확보된다" 고 적어 둔 방침을 그대로 따랐다. 판면 하단에 학명이 활자로
   * 찍혀 있어 **종 동정이 문자로 확인되는 것**도 이 판본을 우선한 이유다.
   * 나머지 셋: 델피니움(비테 《플로라》) · 수레국화(스텝 《길가와 숲의 꽃》) ·
   * 아마릴리스(커티스 《보태니컬 매거진》 — 기존 네 종과 같은 판본이라 새 이름이 필요 없다).
   *
   * 라이선스는 15종 전부 Commons 파일 페이지에서 **개별 확인**했다(전부 Public domain).
   * ---------------------------------------------------------------- */

  'sweet-pea': {
    flowerId: 'sweet-pea',
    src: '/plates/sweet-pea.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Favourite_flowers_of_garden_and_greenhouse_%28Pl._71%29_%287789123758%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._71%29_%287789123758%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(Pl._71)_(7789123758).jpg',
    alt: '자주·연분홍·크림빛 스위트피가 덩굴손과 함께 뻗은 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.71',
    year: '1896',
    institution: BHL,
  },
  gladiolus: {
    flowerId: 'gladiolus',
    src: '/plates/gladiolus.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Favourite_flowers_of_garden_and_greenhouse_%288346028424%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%288346028424%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(8346028424).jpg',
    alt: '주홍과 연분홍 글라디올러스 꽃대를 구근까지 함께 그린 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.258',
    year: '1897',
    institution: BHL,
    note: '도판은 현대 원예 글라디올러스의 모태가 된 교잡종 Gladiolus gandavensis 예요.',
  },
  dahlia: {
    flowerId: 'dahlia',
    src: '/plates/dahlia.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Favourite_flowers_of_garden_and_greenhouse_%2810574940876%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810574940876%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10574940876).jpg',
    alt: '붉은빛·주황빛·연노랑 홑달리아를 한 판에 모은 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.141',
    year: '1897',
    institution: BHL,
    note: '도판은 꽃잎이 한 겹인 홑달리아라, 요즘 꽃집에서 보는 겹달리아와 모양이 달라요.',
  },
  zinnia: {
    flowerId: 'zinnia',
    src: '/plates/zinnia.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Favourite_flowers_of_garden_and_greenhouse_%2810574885715%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810574885715%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10574885715).jpg',
    alt: '연분홍·주홍·노랑·진홍 백일홍을 잎과 함께 한 판에 모은 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.138',
    year: '1897',
    institution: BHL,
  },
  aster: {
    flowerId: 'aster',
    src: '/plates/aster.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Favourite_flowers_of_garden_and_greenhouse_%2810575130263%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810575130263%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10575130263).jpg',
    alt: '연분홍·진홍·흰빛 겹과꽃을 한 다발로 모은 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.132',
    year: '1897',
    institution: BHL,
    note: '판면 활자는 옛 이름 Callistephus sinensis 예요 — 지금 쓰는 이름은 C. chinensis 로, 같은 꽃이에요.',
  },
  calendula: {
    flowerId: 'calendula',
    src: '/plates/calendula.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Favourite_flowers_of_garden_and_greenhouse_%2810575241163%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810575241163%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10575241163).jpg',
    alt: '주황과 붉은 테가 도는 금잔화 세 송이와 잎을 그린 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.155',
    year: '1897',
    institution: BHL,
  },
  cyclamen: {
    flowerId: 'cyclamen',
    src: '/plates/cyclamen.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Favourite_flowers_of_garden_and_greenhouse_%2810593586076%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810593586076%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10593586076).jpg',
    alt: '연분홍 시클라멘과 하트 모양 잎을 알뿌리까지 그린 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.176',
    year: '1897',
    institution: BHL,
  },
  geranium: {
    flowerId: 'geranium',
    src: '/plates/geranium.jpg',
    // ⚠ Commons 파일의 작가 칸이 "Chromolithographie, France, 19e siècle" 로 잘못 적혀 있다.
    //   판면 활자(`ZONAL GERANIUM … PL. 54`)와 BHL 플리커 연번(Pl.53 = 7789095372 바로 다음이
    //   이 파일의 7789096990)이 스텝 판본임을 함께 가리킨다. 문서 §확장 배치 1 에 근거를 적어 두었다.
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Pelargonium_zonal_flickr.jpg/1280px-Pelargonium_zonal_flickr.jpg',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Pelargonium_zonal_flickr.jpg',
    alt: '주홍과 연분홍 제라늄 꽃차례와 고리 무늬가 든 둥근 잎 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.54',
    year: '1896',
    institution: BHL,
    note: '판면 활자가 알려 주듯, 제라늄이라 불리는 이 꽃의 학명은 Pelargonium 이에요.',
  },
  primula: {
    flowerId: 'primula',
    src: '/plates/primula.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Favourite_flowers_of_garden_and_greenhouse_%2810593580946%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810593580946%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10593580946).jpg',
    alt: '흰빛과 주홍빛 프리뮬러가 주름진 잎과 함께 핀 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.175',
    year: '1897',
    institution: BHL,
    note: '도판은 같은 속의 중국앵초(Primula sinensis)예요.',
  },
  stock: {
    flowerId: 'stock',
    src: '/plates/stock.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Favourite_flowers_of_garden_and_greenhouse_%28Pl._22%29_%287789042742%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._22%29_%287789042742%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(Pl._22)_(7789042742).jpg',
    alt: '연분홍·크림빛·검붉은 겹스토크 꽃대를 모은 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.22',
    year: '1896',
    institution: BHL,
    note: '판면 활자는 옛 이름 Matthiola annua 예요 — 절화로 도는 Matthiola incana 의 한해살이 계통이에요.',
  },
  delphinium: {
    flowerId: 'delphinium',
    src: '/plates/delphinium.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/WitteHeinrichFlora1868-024-Delphinium_formosum.png/1280px-WitteHeinrichFlora1868-024-Delphinium_formosum.png',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-024-Delphinium_formosum.png',
    alt: '짙푸른 델피니움 꽃이 촘촘히 달린 꽃대 세밀화',
    artist: WENDEL,
    work: WITTE,
    plateNo: 'Pl.24',
    year: '1868',
    institution: COMMONS,
    note: '도판은 원예 델피니움의 모종 계열인 Delphinium formosum 이에요.',
  },
  amaryllis: {
    flowerId: 'amaryllis',
    src: '/plates/amaryllis.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/The_Botanical_Magazine%2C_Plate_129_%28Volume_4%2C_1791%29.png/1280px-The_Botanical_Magazine%2C_Plate_129_%28Volume_4%2C_1791%29.png',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:The_Botanical_Magazine,_Plate_129_(Volume_4,_1791).png',
    alt: '흰 바탕에 붉은 줄무늬가 든 아마릴리스 두 송이와 굵은 꽃대 세밀화',
    artist: 'William Curtis',
    work: CURTIS,
    plateNo: 'Pl.129',
    year: '1791',
    institution: BHL,
    note: '도판은 원예 아마릴리스의 모종인 Hippeastrum vittatum 이에요.',
  },
  cornflower: {
    flowerId: 'cornflower',
    src: '/plates/cornflower.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Wayside_and_woodland_blossoms_%28Pl._67%29_%288747773790%29.jpg/1280px-Wayside_and_woodland_blossoms_%28Pl._67%29_%288747773790%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Wayside_and_woodland_blossoms_(Pl._67)_(8747773790).jpg',
    alt: '가느다란 잎 위로 파란 수레국화 한 송이가 선 세밀화',
    artist: STEP,
    work: STEP_WAYSIDE,
    plateNo: 'Pl.67',
    year: '1895',
    institution: BHL,
  },
  crocus: {
    flowerId: 'crocus',
    src: '/plates/crocus.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Favourite_flowers_of_garden_and_greenhouse_%288346027178%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%288346027178%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(8346027178).jpg',
    alt: '노란 크로커스와 자주 크로커스를 알뿌리까지 나란히 그린 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.256',
    year: '1897',
    institution: BHL,
    note: '봄에 피는 노란 크로커스와 자주 크로커스를 함께 그린 판이에요 — 가을에 피는 사프란과는 다른 꽃이에요.',
  },
  'water-lily': {
    flowerId: 'water-lily',
    src: '/plates/water-lily.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Favourite_flowers_of_garden_and_greenhouse_%28Pl._16%29_%287789031322%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._16%29_%287789031322%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(Pl._16)_(7789031322).jpg',
    alt: '붉은 수련 한 송이와 봉오리를 둥근 잎과 함께 그린 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.16',
    year: '1896',
    institution: BHL,
    note: '도판은 같은 속의 붉은 이집트수련(Nymphaea lotus var. rubra)이에요.',
  },

  /* ---------------------------------------------------------------- *
   * 정식 도감 확장 배치 2 — 12종 (2026-08-17)
   *
   * 배치 1 이 《Favourite Flowers》 한 판본으로 몰아 갔다면, 이번 12종의 무게중심은
   * **커티스 《보태니컬 매거진》 다섯 장**이다(호접란·유칼립투스·스타티스·스카비오사·진달래).
   * 이유는 같다 — 이미 다섯 종(gerbera·lisianthus·magnolia·poinsettia·amaryllis)이
   * 쓰는 판본이라 크레딧이 그 줄에 얹히고, 커티스는 온실 화훼와 동아시아 수입종을
   * 200년 동안 실어 왔기 때문에 이번 12종처럼 **난초·상록수·관엽**이 섞인 목록에
   * 색 판면이 남아 있는 거의 유일한 자리다.
   *
   * 나머지는 이렇게 갈렸다.
   *   · `anthurium` `bouvardia` — 스텝 《Favourite Flowers》(배치 1 의 12종과 같은 책)
   *   · `alstroemeria` — 비테 《플로라》(기존 7종과 같은 책)
   *   · `gardenia` — 에드워즈 《보태니컬 레지스터》(camellia 와 같은 책·같은 해)
   *   · `cotton` — 데스쿠르티 《앤틸리스 약용식물지》(jasmine 과 같은 책)
   *   · `mimosa` `plum-blossom` — **새 판본 둘**. 아카시아 데알바타와 매화는 위 판본들에
   *     채색 판면이 없었고, 두 종 모두 종 동정이 가장 위험한 자리라(신경초·벚꽃)
   *     "종이 문자로 박힌 판면"을 판본 일관성보다 앞에 두었다.
   *
   * 라이선스는 12종 전부 Commons 파일 페이지의 라이선스 틀을 **개별 확인**했다
   * (`PD-Art` · `PD-old` · `PD-scan|PD-old-70-1923` · `PD-1923`). BHL→플리커 경유 넷에
   * `CC-BY-2.0` 상자가 함께 붙어 있는 것은 머리말이 말한 그 기계적 이슈다 — 표기를
   * 기본값으로 운용하는 것으로 덮는다.
   * ---------------------------------------------------------------- */

  phalaenopsis: {
    flowerId: 'phalaenopsis',
    src: '/plates/phalaenopsis.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Phalaenopsis_amabilis_-_Curtis%27_73_%28Ser._3_no._3%29_pl._4297_%281847%29.jpg/1280px-Phalaenopsis_amabilis_-_Curtis%27_73_%28Ser._3_no._3%29_pl._4297_%281847%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Phalaenopsis_amabilis_-_Curtis%27_73_(Ser._3_no._3)_pl._4297_(1847).jpg',
    alt: '흰 나비 모양 꽃이 줄지어 달린 호접란 꽃대와 굵은 뿌리를 그린 세밀화',
    artist: 'Walter Hood Fitch',
    work: CURTIS,
    plateNo: 't.4297',
    year: '1847',
    institution: COMMONS,
    note: '도판은 원예 호접란의 원종인 팔라이놉시스 아마빌리스(Phalaenopsis amabilis)예요.',
  },
  alstroemeria: {
    flowerId: 'alstroemeria',
    src: '/plates/alstroemeria.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/WitteHeinrichFlora1868-026-Alstroemeria_aurea.png/1280px-WitteHeinrichFlora1868-026-Alstroemeria_aurea.png',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-026-Alstroemeria_aurea.png',
    alt: '주홍 꽃잎 안쪽에 검붉은 줄무늬가 든 알스트로메리아 꽃대 세밀화',
    artist: WENDEL,
    work: WITTE,
    plateNo: 'Pl.26',
    year: '1868',
    institution: COMMONS,
    note: '판면 활자는 옛 이름 Alstroemeria aurantiaca 예요 — 지금 쓰는 이름은 A. aurea 로, 원예 알스트로메리아의 모종 계열이에요.',
  },
  anthurium: {
    flowerId: 'anthurium',
    src: '/plates/anthurium.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Favourite_flowers_of_garden_and_greenhouse_%288346053060%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%288346053060%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(8346053060).jpg',
    alt: '주홍 불염포와 노란 육수꽃차례를 세운 안스리움을 뿌리까지 그린 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.296',
    year: '1897',
    institution: BHL,
    note: '도판은 같은 속의 홍학꽃(Anthurium scherzerianum)이라, 꽃차례가 하트 모양 불염포의 안스리움과 달리 돌돌 말려 있어요.',
  },
  gardenia: {
    flowerId: 'gardenia',
    src: '/plates/gardenia.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/The_Botanical_register_%28Plate_73%29_BHL8494.jpg/1280px-The_Botanical_register_%28Plate_73%29_BHL8494.jpg',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:The_Botanical_register_(Plate_73)_BHL8494.jpg',
    alt: '겹겹이 말린 흰 치자꽃 한 송이와 봉오리를 짙은 잎과 함께 그린 세밀화',
    // camellia 와 **같은 책·같은 해·같은 기관**이라 크레딧이 한 줄로 합쳐진다.
    artist: 'Sydenham Edwards',
    work: BOTANICAL_REGISTER,
    plateNo: 'Pl.73',
    year: '1815',
    institution: BHL,
    note: '도판은 겹꽃으로 개량된 치자예요 — 산에서 보는 홑꽃 치자는 꽃잎이 여섯 장이에요.',
  },
  eucalyptus: {
    flowerId: 'eucalyptus',
    src: '/plates/eucalyptus.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Curtis%27s_botanical_magazine_%28Tab_7835%29_%288346194831%29.jpg/1280px-Curtis%27s_botanical_magazine_%28Tab_7835%29_%288346194831%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Curtis%27s_botanical_magazine_(Tab_7835)_(8346194831).jpg',
    alt: '둥근 은청빛 잎이 줄기를 감싼 유칼립투스 가지와 꽃봉오리·열매 세밀화',
    artist: 'Matilda Smith · J.N. Fitch',
    work: CURTIS,
    plateNo: 't.7835',
    year: '1902',
    institution: BHL,
    note: '도판은 같은 속의 Eucalyptus cordata 예요 — 줄기를 감싸는 둥근 은청빛 잎은 우리 유칼립투스(cinerea)와 같은 모습이에요.',
  },
  statice: {
    flowerId: 'statice',
    src: '/plates/statice.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/The_Botanical_Magazine%2C_Plate_71_%28Volume_2%2C_1788%29.png/1280px-The_Botanical_Magazine%2C_Plate_71_%28Volume_2%2C_1788%29.png',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:The_Botanical_Magazine,_Plate_71_(Volume_2,_1788).png',
    alt: '날개가 달린 줄기 끝에 연보라 꽃이 모여 핀 스타티스와 물결 모양 잎 세밀화',
    artist: 'William Curtis',
    work: CURTIS,
    plateNo: 'Pl.71',
    year: '1788',
    institution: BHL,
    note: '판면 활자는 옛 이름 Statice sinuata 예요 — 지금 쓰는 이름은 Limonium sinuatum 으로, 같은 꽃이에요.',
  },
  mimosa: {
    flowerId: 'mimosa',
    src: '/plates/mimosa.jpg',
    // ⚠ 원본이 1262px 라 위키미디어가 1280px 썸네일을 **살짝 확대해** 내준다(HTTP 200 실측).
    //   폭 규칙(`/1280px-`)을 지키면서 1100px 정규화에도 손실이 없다 — 차이가 1.4% 다.
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Gardenillustrate4292lond_0023.jpg/1280px-Gardenillustrate4292lond_0023.jpg',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Gardenillustrate4292lond_0023.jpg',
    alt: '은녹색 깃꼴 잎 사이로 노란 방울꽃이 흐드러진 미모사 가지 세밀화',
    artist: 'Gertrude Hamilton',
    work: THE_GARDEN,
    plateNo: 'Pl.864',
    year: '1892',
    institution: BHL,
    note: '판면에 Acacia dealbata 라 적혀 있어요 — 꽃집에서 미모사라 부르는 그 나무이고, 잎을 건드리면 접히는 신경초(Mimosa pudica)와는 다른 식물이에요.',
  },
  bouvardia: {
    flowerId: 'bouvardia',
    src: '/plates/bouvardia.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Favourite_flowers_of_garden_and_greenhouse_%2810574873714%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810574873714%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10574873714).jpg',
    alt: '가느다란 꽃통 끝이 네 갈래 별로 벌어진 흰 부바르디아 꽃가지 세밀화',
    artist: STEP,
    work: STEP_FAVOURITE,
    plateNo: 'Pl.122',
    year: '1897',
    institution: BHL,
    note: '도판은 같은 속의 Bouvardia longiflora 예요 — 꽃통이 길고 흰 이 종이 원예 부바르디아의 모종 계열이에요.',
  },
  scabiosa: {
    flowerId: 'scabiosa',
    src: '/plates/scabiosa.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/The_Botanical_Magazine%2C_Plate_247_%28Volume_7%2C_1794%29.png/1280px-The_Botanical_Magazine%2C_Plate_247_%28Volume_7%2C_1794%29.png',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:The_Botanical_Magazine,_Plate_247_(Volume_7,_1794).png',
    alt: '짙은 자주빛 방석 모양 꽃이 가는 꽃대 위에 선 스카비오사 세밀화',
    // 판면 하단 서명이 `Edwards del. Sansom sculp` 이라 Commons 의 작가 칸(William Curtis)
    // 대신 판면 활자를 따랐다 — camellia·gardenia 와 같은 화가다.
    artist: 'Sydenham Edwards',
    work: CURTIS,
    plateNo: 'Pl.247',
    year: '1794',
    institution: BHL,
  },
  'plum-blossom': {
    flowerId: 'plum-blossom',
    src: '/plates/plum-blossom.jpg',
    remoteSrc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Prunus_mume_SZ11.png/1280px-Prunus_mume_SZ11.png',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Prunus_mume_SZ11.png',
    alt: '맨가지에 흰 매화와 진분홍 겹매화가 함께 핀 가지와 노랗게 익은 매실 세밀화',
    artist: 'Philipp Franz von Siebold · Joseph Gerhard Zuccarini',
    work: FLORA_JAPONICA,
    plateNo: 'Tab.11',
    year: '1870',
    institution: COMMONS,
    // 벚꽃 도판(비테 Pl.14)이 종을 단정하지 못한 것과 반대로, 이쪽은 열매까지 그려 종이 분명하다.
    note: '한 판에 흰 매화·겹분홍 매화와 노랗게 익은 매실을 함께 그렸어요 — 열매가 벚꽃과 갈리는 지점이에요.',
  },
  azalea: {
    flowerId: 'azalea',
    src: '/plates/azalea.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Rhododendron_mucronulatum_136-8304.jpg/1280px-Rhododendron_mucronulatum_136-8304.jpg',
    pageUrl: 'https://commons.wikimedia.org/wiki/File:Rhododendron_mucronulatum_136-8304.jpg',
    alt: '잎이 나기 전 맨가지에 연분홍 꽃이 벌어진 진달래 세밀화',
    artist: 'Matilda Smith · J.N. Fitch',
    work: CURTIS,
    plateNo: 't.8304',
    year: '1910',
    institution: COMMONS,
    note: '판면 학명이 Rhododendron mucronulatum — 잎보다 꽃이 먼저 피는 우리 진달래예요.',
  },
  cotton: {
    flowerId: 'cotton',
    src: '/plates/cotton.jpg',
    remoteSrc:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Flore_m%C3%A9dicale_des_Antilles%2C_ou%2C_Trait%C3%A9_des_plantes_usuelles_%289920564033%29.jpg/1280px-Flore_m%C3%A9dicale_des_Antilles%2C_ou%2C_Trait%C3%A9_des_plantes_usuelles_%289920564033%29.jpg',
    pageUrl:
      'https://commons.wikimedia.org/wiki/File:Flore_m%C3%A9dicale_des_Antilles,_ou,_Trait%C3%A9_des_plantes_usuelles_(9920564033).jpg',
    alt: '연노랑 목화꽃과 껍질이 벌어져 솜이 드러난 다래를 함께 그린 세밀화',
    artist: 'J. Théodore Descourtilz',
    work: DESCOURTILZ,
    plateNo: 'Pl.278',
    year: '1827',
    institution: BHL,
    note: '판면 활자는 프랑스어 `COTONNIER`(목화) 한 단어뿐이라, 도판이 어느 목화 종인지까지는 알 수 없어요.',
  },
};

/**
 * 화면이 쓰는 폭. 위키미디어는 **사전 생성해 둔 표준 폭**만 내준다
 * (`20/40/60/120/250/330/500/960/1280/1920/3840`) — 비표준 폭(1100 등)은 거절당한다.
 */
export type PlateWidth = 250 | 500 | 1280;

/** Internet Archive BookReader 는 `_w{폭}` 을 URL 에 직접 적는다. 표준 폭 목록이 따로 없다. */
const IA_WIDTH: Record<PlateWidth, number> = { 250: 400, 500: 800, 1280: 1800 };

/** 자체 호스팅 본판이 사는 자리. `public/plates/` 와 같은 말이다. */
const LOCAL_DIR = '/plates/';
/**
 * 160px 썸네일이 사는 자리. 본판과 **파일 이름이 같다** — 두 경로를 따로 적으면
 * 한쪽만 바뀌는 날 조용히 어긋난다(스크립트도 이 함수를 불러 저장 경로를 정한다).
 */
export const THUMB_DIR = '/plates/thumbs/';
/** 썸네일로 갈아 끼우는 상한 폭. 이보다 크게 부르면 본판을 그대로 준다. */
const THUMB_MAX = 250;

/**
 * 그 폭의 이미지 주소.
 *
 * ── 자체 호스팅 사본(`/plates/…`) ────────────────────────────────────
 * 파일이 **두 벌**이다: 본판(≤1100px)과 썸네일(160px). `width ≤ 250` 이면 썸네일을 준다.
 * 지금 화면이 도판을 거는 자리는 둘뿐이고 둘 다 그 상한 아래다 —
 *   · 레인 헤더 `.plateThumb` 44×44px  (32줄이 한 화면에 선다)
 *   · 시트 액자 `.plateCard` clamp(72px, 19vw, 92px)
 * 도감 상세 히어로만 본판을 그대로 쓴다(실표시 ~550px → 레티나 2배가 1100px 인 근거).
 * ⚠ 예전에는 이 함수가 로컬 사본에 대해 **아무 일도 하지 않았다.** 그래서 44px 칸이
 *   200KB 판면을 통째로 물었다(첫 화면 도판만 1.4MB). `width` 를 되돌려 놓지 마라.
 *
 * ── 원격 폴백 ────────────────────────────────────────────────────────
 * 다운로드가 실패한 꽃은 `src` 에 `remoteSrc` 를 남겨 두는 것이 폴백이고, 그때는 폭을
 * 갈아 끼워 44px 칸에 1280px 원판을 물리지 않는다(위키미디어가 핫링크를 만류하는 이유다).
 * 아는 두 패턴만 갈아 끼우고, 모르는 주소는 **그대로 돌려준다**(깨뜨리지 않는다).
 */
export function plateSrc(plate: FlowerPlate, width: PlateWidth = 250): string {
  if (plate.src.startsWith(LOCAL_DIR)) {
    return width <= THUMB_MAX ? `${THUMB_DIR}${plate.src.slice(LOCAL_DIR.length)}` : plate.src;
  }
  if (plate.src.includes('/1280px-')) return plate.src.replace('/1280px-', `/${width}px-`);
  if (plate.src.includes('_w1800.')) return plate.src.replace('_w1800.', `_w${IA_WIDTH[width]}.`);
  return plate.src;
}

/** 그 꽃의 도판. 아직 도판이 없는 꽃이면 undefined — 화면은 도판 없이도 성립해야 한다. */
export function plateFor(flowerId: string): FlowerPlate | undefined {
  return FLOWER_PLATES[flowerId];
}

/**
 * 상세 시트 각주 한 줄 — `도판: {작가} · {작품명} {번호}, {연도} / {기관}`.
 * 이야기의 출처(`이야기의 갈래 —`)와 나란히 서는 자리라 같은 무게의 작은 글씨다.
 */
export function plateSourceLine(plate: FlowerPlate): string {
  const work = plate.plateNo ? `${plate.work} ${plate.plateNo}` : plate.work;
  return `도판: ${plate.artist} · ${work}, ${plate.year} / ${plate.institution}`;
}

/**
 * 푸터 크레딧 한 줄 — `Plate: {작품명}, {연도} / {소장·제공 기관}`.
 * 형식은 `docs/illustration-assets.md` 사용 규칙 4 그대로다(바꾸지 마라 —
 * BHL 경유 파일에 붙은 `CC BY 2.0` 병기 이슈를 이 한 형식으로 덮는다).
 */
export function plateCredit(plate: FlowerPlate): string {
  return `Plate: ${plate.work}, ${plate.year} / ${plate.institution}`;
}

/**
 * 화면으로 내려보낼 **좁힌 한 벌**(코드 리뷰 P1-7).
 *
 * 표(`FlowerPlate`)에는 취득 주소·파일 페이지·작가·판본·연도·기관이 들어 있지만 액자가
 * 쓰는 것은 주소 하나, 설명 하나, 각주 두 줄뿐이다. 서버 컴포넌트가 이 함수로 좁혀
 * props 에 실으면 클라이언트 번들에서 표가 통째로 사라진다.
 *
 * @param width 그 자리의 표시 크기. 기본값 250 은 **썸네일**을 뜻한다
 *              (레인 헤더 44px·시트 액자 ≤92px 둘 다 그 아래다).
 */
export function plateViewFor(flowerId: string, width: PlateWidth = 250): PlateView | undefined {
  const plate = plateFor(flowerId);
  if (!plate) return undefined;
  return {
    flowerId: plate.flowerId,
    src: plateSrc(plate, width),
    alt: plate.alt,
    ...(plate.note ? { note: plate.note } : {}),
    sourceLine: plateSourceLine(plate),
  };
}

/** 연도 범위를 잇는 기호 — 표 안의 `1817–1824` 와 같은 엔 대시다(하이픈이 아니다). */
const YEAR_DASH = '–';

/**
 * 여러 도판의 연도 칸을 **한 범위로** 접는다.
 *
 * 연도 칸은 단년(`1868`)일 수도 범위(`1802–1816`)일 수도 있어서, 문자열을 파싱하는 대신
 * 네 자리 수를 전부 긁어 최소·최대만 취한다. 커티스 열 장이 `1788–1912` 한 칸이 되는 자리다.
 * 최소와 최대가 같으면 범위 기호를 붙이지 않는다(`1868–1868` 은 사실이지만 읽기 나쁘다).
 */
function mergeYears(years: readonly string[]): string {
  const found = years.flatMap((year) => (year.match(/\d{3,4}/g) ?? []).map(Number));
  if (found.length === 0) return years.join(' · ');

  const from = Math.min(...found);
  const to = Math.max(...found);
  return from === to ? `${from}` : `${from}${YEAR_DASH}${to}`;
}

/**
 * 화면에 실제로 쓴 도판들의 크레딧 — **판본 단위로** 합치고 알파벳 순으로 세운다.
 * 59줄이 아니라 판본 수(지금 16)만큼만 나온다 — 그게 "일괄 표기" 의 뜻이다.
 *
 * ── 합치는 단위가 왜 판본인가 (2026-08-17) ───────────────────────────
 * 예전에는 `plateCredit()` 이 만든 **완성된 줄**을 Set 에 넣어 중복만 지웠다. 그래서
 * 같은 책이라도 권이 다르면 줄이 갈렸다 — 커티스 《보태니컬 매거진》이 연도별로 8줄,
 * 데스쿠르티가 1827·1828 두 줄이었고, 59종에서 벌써 27줄이었다. 판본을 몰아 고르는
 * 이 프로젝트의 방침(머리말 "판본 이름은 문자열을 재사용한다")이 화면에서는 전혀
 * 보이지 않았던 셈이다.
 *
 * 이제 `work` 하나가 한 줄이고, 갈렸던 값은 **버리는 대신 합친다** —
 *   · 연도는 범위로(`1788–1912`). 어느 해 판면을 썼는지가 사라지지 않는다.
 *   · 기관은 전부 나열한다(` · ` 로 잇고 알파벳 순). 소장처를 임의로 대표시키지 않는다.
 * 줄을 줄이려고 정보를 지우지 않는 것이 이 함수의 유일한 규칙이다.
 *
 * ⚠ 낱장 크레딧(`plateCredit`)은 그대로다 — 도감 상세는 **그 한 장**의 출처를 말하는
 *   자리라 범위로 뭉개면 오히려 틀린 말이 된다. 합치는 것은 푸터 일괄 표기뿐이다.
 */
export function plateCredits(flowerIds: readonly string[]): string[] {
  /** 판본(`work`) → 그 판본으로 실제 화면에 선 도판들. 등장 순서는 아래에서 정렬로 지운다. */
  const byWork = new Map<string, FlowerPlate[]>();

  for (const id of flowerIds) {
    const plate = plateFor(id);
    if (!plate) continue;
    const group = byWork.get(plate.work);
    if (group) group.push(plate);
    else byWork.set(plate.work, [plate]);
  }

  const lines = [...byWork].map(([work, plates]) => {
    const years = mergeYears(plates.map((plate) => plate.year));
    const institutions = [...new Set(plates.map((plate) => plate.institution))]
      .sort((a, b) => a.localeCompare(b, 'en'))
      .join(' · ');
    return `Plate: ${work}, ${years} / ${institutions}`;
  });

  return lines.sort((a, b) => a.localeCompare(b, 'en'));
}
