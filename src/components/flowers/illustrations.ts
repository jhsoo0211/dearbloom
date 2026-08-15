/**
 * 꽃 도감 히어로에 거는 **퍼블릭 도메인 보태니컬 세밀화 31종**.
 *
 * 원본 목록·라이선스 근거는 `docs/illustration-assets.md` 다 — 이 파일은 그 표에서
 * flower_id·직접 URL·출처만 옮겨 온 사본이며, **여기서 새 이미지를 고르지 않는다.**
 * 목록 밖 이미지를 쓰려면 문서를 먼저 고치고 그 결과를 여기 옮긴다.
 *
 * ⚠ 두 가지 기술부채를 그대로 안고 간다(문서 '배포 규칙' 1·4번).
 *   1. URL 은 위키미디어 **표준 1280px 썸네일**이다. 위키미디어는 원본 핫링크를 만류하고
 *      연속 요청에 429 를 돌려준다 — 프로덕션에서는 빌드 타임에 내려받아 자체 호스팅해야 한다.
 *      그래서 화면은 **이미지가 없어도 성립해야 한다**(FlowerPlate 의 그라디언트 폴백).
 *   2. gerbera 1종만 Commons 밖(plantillustrations.org)이라 가장 먼저 깨질 자리다.
 *
 * 순수 데이터만 둔다 — 서버·클라이언트 어디서든 import 할 수 있어야 한다.
 */

export interface FlowerPlateAsset {
  /** 위키미디어 표준 1280px 썸네일(gerbera 만 원 사이트 풀사이즈). */
  src: string;
  alt: string;
  /** `Plate: {작품명}, {연도} / {소장·제공 기관}` — 문서 사용 규칙 4번의 표기 형식. */
  credit: string;
  /**
   * 공통 톤 통일 필터로 수렴되지 않는 컷만(문서 사용 규칙 2번의 예외).
   * ⚠ 값은 CSS `filter` 를 **통째로 대신한다**(더해지지 않는다) — 공통 필터
   * `sepia(.12) saturate(.92) contrast(1.04) brightness(.98)` 를 여기 포함해서 적어라.
   */
  grade?: string;
}

/** flower_id → 도판. 카탈로그 31종 전부 있다(문서와 같은 순서). */
export const FLOWER_PLATES: Record<string, FlowerPlateAsset> = {
  'rose-red': {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Redoute_-_Rosa_gallica_regalis.jpg/1280px-Redoute_-_Rosa_gallica_regalis.jpg',
    alt: '빨간 장미 보태니컬 세밀화 — 연분홍 만개 로제트',
    credit: 'Plate: Redouté, Les Roses, 1817–1824',
  },
  'tulip-white': {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Gc16_tulipa_gesneriana.jpg/1280px-Gc16_tulipa_gesneriana.jpg',
    alt: '흰 튤립 보태니컬 세밀화 — 크림 벨럼 판면에 그린 튤립 네 송이',
    credit: 'Plate: Holtzbecker, Gottorfer Codex, 1649–1659 / Statens Museum for Kunst',
  },
  freesia: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Freesia-J.Eudes-02.JPG/1280px-Freesia-J.Eudes-02.JPG',
    alt: '프리지아 보태니컬 세밀화 — 연노랑 꽃대와 구근',
    credit: 'Plate: E.-J. Eudes, Les Fleurs de Jardins, 1929',
  },
  'lily-asiatic': {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Lilium_lancifolium_in_Les_liliacees.jpg/1280px-Lilium_lancifolium_in_Les_liliacees.jpg',
    alt: '백합 보태니컬 세밀화 — 참나리 한 대',
    credit: 'Plate: Redouté, Les Liliacées, 1802–1816',
  },
  gerbera: {
    src: 'https://www.plantillustrations.org/ILLUSTRATIONS_FULL_SIZE/4557.jpg',
    alt: '거베라 보태니컬 세밀화 — 살구빛과 크림빛 두 송이',
    credit: 'Plate: Curtis’s Botanical Magazine t.7087, 1889 / plantillustrations.org',
  },
  anemone: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/WitteHeinrichFlora1868-051-Anemone_coronaria.png/1280px-WitteHeinrichFlora1868-051-Anemone_coronaria.png',
    alt: '아네모네 보태니컬 세밀화 — 붉은·자줏빛·흰 일곱 송이',
    credit: 'Plate: Witte, Flora, 1868 / Biodiversity Heritage Library',
  },
  hellebore: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/WitteHeinrichFlora1868-033-Helleborus_niger.png/1280px-WitteHeinrichFlora1868-033-Helleborus_niger.png',
    alt: '헬레보어 보태니컬 세밀화 — 흰빛에서 연분홍으로 물든 네 송이',
    credit: 'Plate: Witte, Flora, 1868 / Biodiversity Heritage Library',
  },
  hyacinth: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/De_blauwe_hyacint_Franciscus_Primus%2C_RP-T-1948-46.jpg/1280px-De_blauwe_hyacint_Franciscus_Primus%2C_RP-T-1948-46.jpg',
    alt: '히아신스 보태니컬 세밀화 — 연푸른 겹꽃 한 대',
    credit: 'Plate: Jan Augustini, 1762 / Rijksmuseum',
  },
  peony: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Favourite_flowers_of_garden_and_greenhouse_%28Pl._13%29_%287789025266%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._13%29_%287789025266%29.jpg',
    alt: '작약 보태니컬 세밀화 — 흰 겹꽃',
    credit: 'Plate: Step, Favourite Flowers, 1896 / Biodiversity Heritage Library',
  },
  hydrangea: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/WitteHeinrichFlora1868-060-Hydrangea_macrophylla.png/1280px-WitteHeinrichFlora1868-060-Hydrangea_macrophylla.png',
    alt: '수국 보태니컬 세밀화 — 레이스캡형 복색 꽃차례',
    credit: 'Plate: Witte, Flora, 1868 / Biodiversity Heritage Library',
  },
  lavender: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Illustration_Lavandula_angustifolia0.jpg/1280px-Illustration_Lavandula_angustifolia0.jpg',
    alt: '라벤더 보태니컬 세밀화 — 꽃·수술·씨 해부도가 함께 있는 도감 판면',
    credit: 'Plate: Thomé, Flora von Deutschland, 1885',
  },
  sunflower: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/American_medicinal_plants_%28Plate_83%29_%286025414321%29.jpg/1280px-American_medicinal_plants_%28Plate_83%29_%286025414321%29.jpg',
    alt: '해바라기 보태니컬 세밀화 — 왼쪽은 채색, 오른쪽은 선묘',
    credit: 'Plate: Millspaugh, American Medicinal Plants, 1887 / Biodiversity Heritage Library',
  },
  carnation: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Favourite_flowers_of_garden_and_greenhouse_%28Pl._36%29_%287789066486%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._36%29_%287789066486%29.jpg',
    alt: '카네이션 보태니컬 세밀화 — 단색과 줄무늬 복색이 한 판면에',
    credit: 'Plate: Step, Favourite Flowers, 1896 / Biodiversity Heritage Library',
  },
  lisianthus: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Eustoma_exaltatum_subsp._russellianum_%28Lisianthius_russellianus%29_Bot._Mag._65._3626._1838.jpg/1280px-Eustoma_exaltatum_subsp._russellianum_%28Lisianthius_russellianus%29_Bot._Mag._65._3626._1838.jpg',
    alt: '리시안셔스 보태니컬 세밀화 — 자줏빛 대형 꽃 네 송이',
    credit: 'Plate: Curtis’s Botanical Magazine t.3626, 1838 / Royal Botanic Gardens Kew',
  },
  ranunculus: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Ranunculus_asiaticus-Favourite_Flowers_Garden_Greenhouse-1-0030-6.png/1280px-Ranunculus_asiaticus-Favourite_Flowers_Garden_Greenhouse-1-0030-6.png',
    alt: '라넌큘러스 보태니컬 세밀화 — 겹겹이 접힌 꽃잎',
    credit: 'Plate: Step, Favourite Flowers, 1896',
  },
  'lily-of-the-valley': {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Convallaria_majalis_in_Les_liliacees.jpg/1280px-Convallaria_majalis_in_Les_liliacees.jpg',
    alt: '은방울꽃 보태니컬 세밀화 — 뿌리까지 그린 전초',
    credit: 'Plate: Redouté, Les Liliacées, 1802–1816',
  },
  chrysanthemum: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flora_conspicua_%28Pl._51%29_%286046903472%29.jpg/1280px-Flora_conspicua_%28Pl._51%29_%286046903472%29.jpg',
    alt: '국화 보태니컬 세밀화 — 진분홍 대륜 한 송이',
    credit: 'Plate: Clark, Flora Conspicua, 1826 / Biodiversity Heritage Library',
  },
  narcissus: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Narcissus_pseudonarcissus_-_Les_liliac%C3%A9es%2C_vol._3_-_t._158.jpg/1280px-Narcissus_pseudonarcissus_-_Les_liliac%C3%A9es%2C_vol._3_-_t._158.jpg',
    alt: '수선화 보태니컬 세밀화 — 나팔수선화 한 대',
    credit: 'Plate: Redouté, Les Liliacées, 1802',
  },
  'forget-me-not': {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Favourite_flowers_of_garden_and_greenhouse_%2810593688896%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810593688896%29.jpg',
    alt: '물망초 보태니컬 세밀화 — 작은 꽃이 줄지어 달린 꽃대',
    credit: 'Plate: Step, Favourite Flowers, 1897 / Biodiversity Heritage Library',
  },
  'cherry-blossom': {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Bairei_kach%C5%8D_gafu%2C_Spring_08%2C_cherry_blossoms_and_gulls.jpg/1280px-Bairei_kach%C5%8D_gafu%2C_Spring_08%2C_cherry_blossoms_and_gulls.jpg',
    alt: '벚꽃 화조화 — 벚꽃 가지와 갈매기',
    credit: 'Plate: 河野楳嶺, 楳嶺花鳥画譜, 1883 / 国立国会図書館',
    // 담청 하늘이 팔레트 밖 파랑이라 공통 필터만으로는 안 수렴한다 — 채도를 더 낮춰 쓴다.
    grade: 'sepia(0.18) saturate(0.42) contrast(1.04) brightness(0.98)',
  },
  camellia: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/The_Botanical_register_%28Plate_22%29_BHL8339.jpg/1280px-The_Botanical_register_%28Plate_22%29_BHL8339.jpg',
    alt: '동백 보태니컬 세밀화 — 겹동백 한 송이와 짙은 잎',
    credit: 'Plate: The Botanical Register Pl.22, 1815 / Biodiversity Heritage Library',
  },
  violet: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Favourite_flowers_of_garden_and_greenhouse_%28Pl._32%29_%287789059768%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._32%29_%287789059768%29.jpg',
    alt: '제비꽃 보태니컬 세밀화 — 겹꽃 파르마 제비꽃',
    credit: 'Plate: Step, Favourite Flowers, 1896 / Biodiversity Heritage Library',
  },
  iris: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/WitteHeinrichFlora1868-049-Iris_xiphium.png/1280px-WitteHeinrichFlora1868-049-Iris_xiphium.png',
    alt: '아이리스 보태니컬 세밀화 — 보라·황백·청자 다섯 송이',
    credit: 'Plate: Witte, Flora, 1868 / Biodiversity Heritage Library',
  },
  marigold: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Favourite_flowers_of_garden_and_greenhouse_%2810575191053%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810575191053%29.jpg',
    alt: '마리골드 보태니컬 세밀화 — 노란 겹꽃',
    credit: 'Plate: Step, Favourite Flowers, 1897 / Biodiversity Heritage Library',
  },
  'corn-poppy': {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Wayside_and_woodland_blossoms_%28Pl._61%29_%288747771268%29.jpg/1280px-Wayside_and_woodland_blossoms_%28Pl._61%29_%288747771268%29.jpg',
    alt: '개양귀비 보태니컬 세밀화 — 붉은 꽃 한 송이',
    credit: 'Plate: Step, Wayside and Woodland Blossoms, 1895 / Biodiversity Heritage Library',
  },
  jasmine: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Flore_m%C3%A9dicale_des_Antilles%2C_ou%2C_Trait%C3%A9_des_plantes_usuelles_%2810421471426%29.jpg/1280px-Flore_m%C3%A9dicale_des_Antilles%2C_ou%2C_Trait%C3%A9_des_plantes_usuelles_%2810421471426%29.jpg',
    alt: '재스민 보태니컬 세밀화 — 흰 꽃과 해부도',
    credit: 'Plate: Descourtilz, Flore médicale des Antilles, 1828 / Biodiversity Heritage Library',
  },
  'babys-breath': {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Favourite_flowers_of_garden_and_greenhouse_%28Pl._34%29_%287789063128%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._34%29_%287789063128%29.jpg',
    alt: '안개꽃 보태니컬 세밀화 — 잔가지에 달린 작은 흰 꽃',
    credit: 'Plate: Step, Favourite Flowers, 1896 / Biodiversity Heritage Library',
  },
  cosmos: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Favourite_flowers_of_garden_and_greenhouse_%2810575182183%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810575182183%29.jpg',
    alt: '코스모스 보태니컬 세밀화 — 연분홍 세 송이와 해부도',
    credit: 'Plate: Step, Favourite Flowers, 1897 / Biodiversity Heritage Library',
  },
  magnolia: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Magnolia_kobus_138-8428.jpg/1280px-Magnolia_kobus_138-8428.jpg',
    alt: '목련 보태니컬 세밀화 — 잎보다 먼저 핀 흰 꽃',
    credit: 'Plate: Curtis’s Botanical Magazine t.8428, 1912 / Royal Botanic Gardens Kew',
  },
  pansy: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/WitteHeinrichFlora1868-069-Viola_tricolor.png/1280px-WitteHeinrichFlora1868-069-Viola_tricolor.png',
    alt: '팬지 보태니컬 세밀화 — 자줏빛·노란빛 아홉 송이',
    credit: 'Plate: Witte, Flora, 1868 / Biodiversity Heritage Library',
  },
  poinsettia: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Curtis%27s_botanical_magazine_%28Plate_3493%29_%288043241073%29.jpg/1280px-Curtis%27s_botanical_magazine_%28Plate_3493%29_%288043241073%29.jpg',
    alt: '포인세티아 보태니컬 세밀화 — 붉은 포엽이 펼쳐진 가로 판면',
    credit: 'Plate: Curtis’s Botanical Magazine Pl.3493, 1836 / Royal Botanic Gardens Kew',
  },
};

/** 목록에 없는 꽃이 들어와도 화면이 깨지지 않게 한다(폴백은 카테고리 그라디언트). */
export function flowerPlate(flowerId: string): FlowerPlateAsset | undefined {
  return FLOWER_PLATES[flowerId];
}
