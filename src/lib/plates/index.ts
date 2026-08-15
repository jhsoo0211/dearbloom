/**
 * 꽃 세밀화 도판 32종 — 퍼블릭 도메인 보태니컬 도판의 **단일 원본**.
 *
 * 출처 문서: `docs/illustration-assets.md` (2026-08-15 조사 31종 + 같은 날 데이지 1종 = 32/32).
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
 * 32종 전부 퍼블릭 도메인 또는 CC0 다. 표기 의무는 없지만 **표기를 기본값으로 운용**한다
 * (BHL→Flickr 경유 파일 16종에 `CC BY 2.0` 상자가 기계적으로 붙어 있는 이슈를 한 번에 덮는
 * 가장 싼 보험이고, "야간 식물 아카이브" 라는 톤에도 출처 표기가 어울린다).
 * 표기 형식은 문서 사용 규칙 4 그대로 — `Plate: {작품명}, {연도} / {소장·제공 기관}`.
 *
 * ── 자체 호스팅 (문서 배포 규칙 1, 2026-08-15 적용 완료) ──────────────
 * `src` 는 전부 **우리 `public/plates/` 사본**이다. 32종이 전부 PD/CC0 라 재배포에 제약이
 * 없고, 위키미디어는 핫링크 연속 요청에 `HTTP 429` 를 돌려주기 때문이다(문서 배포 규칙 2 —
 * 레인 32줄이 한 화면에서 동시에 요청하면 그 상태가 곧바로 재현된다).
 *   · 취득 주소는 `remoteSrc` 에 그대로 남겨 둔다 — 재다운로드의 입력이자 출처 증빙이다.
 *   · 파일을 다시 받는 방법: `node scripts/fetch-plates.mjs`(`--force` 로 덮어쓰기,
 *     `--reencode` 로 재다운로드 없이 다시 정규화). 저장 경로는 이 파일의 `src` 가 정한다 —
 *     스크립트가 `src` 를 읽어 그 자리에 쓴다.
 *   · **32종 전부 `.jpg` 다** — 확장자를 원본대로 두지 않고 한 규격으로 정규화한다.
 *     스크립트가 `sharp` 로 폭 ≤1100px · 알파는 흰 배경 flatten · JPEG q82(mozjpeg) 로
 *     **다시 인코딩해** 저장하므로, 파일 바이트 자체가 JPEG 다(이름만 바꾼 게 아니다).
 *     그래서 정적 서버가 말하는 `Content-Type: image/jpeg` 가 사실과 맞는다.
 *     위키미디어 PNG 판본 7종이 장당 2.5~4.3MB 로 전체 용량의 2/3 를 먹던 문제가
 *     이 한 단계로 사라진다(레인 헤더는 44px 썸네일에 그 파일을 통째로 물고 있었다).
 *
 * 순수 데이터·순수 함수만 둔다(React·fs 의존 금지) — 서버·클라이언트 양쪽에서 import 하고,
 * `scripts/fetch-plates.mjs`(node)도 같은 파일을 읽는다.
 */

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

const COMMONS = 'Wikimedia Commons';
const BHL = 'Biodiversity Heritage Library';

/** 꽃 id → 도판. 카탈로그 32종 전원이 여기 있다(`tests/components/plates.test.ts` 가 지킨다). */
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
    work: 'Edwards, The Botanical Register',
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
    work: 'Descourtilz, Flore médicale des Antilles',
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
};

/**
 * 화면이 쓰는 폭. 위키미디어는 **사전 생성해 둔 표준 폭**만 내준다
 * (`20/40/60/120/250/330/500/960/1280/1920/3840`) — 비표준 폭(1100 등)은 거절당한다.
 */
export type PlateWidth = 250 | 500 | 1280;

/** Internet Archive BookReader 는 `_w{폭}` 을 URL 에 직접 적는다. 표준 폭 목록이 따로 없다. */
const IA_WIDTH: Record<PlateWidth, number> = { 250: 400, 500: 800, 1280: 1800 };

/**
 * 그 폭의 이미지 주소.
 *
 * ⚠ 자체 호스팅으로 옮긴 뒤로 **31종 전부 로컬 사본 한 벌(≤1100px)뿐**이라, `/plates/…` 는
 *   폭을 갈아 끼울 자리가 없어 그대로 돌아간다(파일이 하나면 `width` 는 의도 표시일 뿐이다).
 *   폭 치환 분기는 원격 주소를 그대로 쓰는 경우를 위해 남겨 둔다 — 다운로드가 실패한 꽃은
 *   `src` 에 `remoteSrc` 를 남겨 두는 것이 폴백이고, 그때는 44px 썸네일에 1280px 원판을
 *   물리지 않는 것이 성능이자 예의다(위키미디어가 핫링크를 만류하는 이유이기도 하다).
 * 아는 두 패턴만 갈아 끼우고, 모르는 주소는 **그대로 돌려준다**(깨뜨리지 않는다).
 */
export function plateSrc(plate: FlowerPlate, width: PlateWidth = 250): string {
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
 * 화면에 실제로 쓴 도판들의 크레딧 — 판본 단위로 합치고 가나다·알파벳 순으로 세운다.
 * 32줄이 아니라 판본 수(14개 안팎)만큼만 나온다 — 그게 "일괄 표기" 의 뜻이다.
 */
export function plateCredits(flowerIds: readonly string[]): string[] {
  const lines = new Set<string>();
  for (const id of flowerIds) {
    const plate = plateFor(id);
    if (plate) lines.add(plateCredit(plate));
  }
  return [...lines].sort((a, b) => a.localeCompare(b, 'en'));
}
