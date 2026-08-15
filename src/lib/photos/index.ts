/**
 * 꽃별 대표 실사 32종 — "이 꽃이 무슨 꽃인지 보여 주는" 사진의 **단일 원본**.
 *
 * 출처 문서: `docs/image-assets.md` §꽃별 대표 실사 32종 (2026-08-15 확장, 32/32 확보).
 * 이 파일은 그 표를 **코드로 옮긴 사본**이다. 컷을 바꾸거나 늘릴 때는 문서를 먼저 고치고
 * 여기로 옮긴다 — 문서가 라이선스·종 동정 근거를 들고 있고, 이 파일은 화면이 쓰는 모양만 갖는다.
 *
 * ⚠ 실사 상수는 **여기 한 벌뿐이다.** `src/lib/theme/flowers.ts` 의 `FlowerTheme.hero/card` 는
 *   꽃이 아니라 **카테고리 색감의 장면컷**(문서 앞쪽 16장)이라 성격이 다르다 — 그쪽은 "분위기",
 *   이쪽은 "종의 얼굴"이다. 둘을 한 표로 합치지 마라. 랜딩 카드는 편집 검수를 마친 테마 컷이
 *   있으면 그것을 먼저 쓰고, 없는 꽃을 이 표가 채운다(`landing-data.ts` 의 `toSlide`).
 *
 * ── 두 가지 확정 사항 (Advisor, 2026-08-15) ──────────────────────────
 *   · `corn-poppy` = **종 확정 백업 컷**(Tanya Cressey, 제목 "common poppy" = Papaver rhoeas).
 *     문서 대표컷은 형태로만 개양귀비를 동정한 정황 근거였다 — 도감이 종을 말하는 화면인 이상
 *     "확실히 그 종인 컷"이 "더 어두운 컷"보다 우선한다(문서 §대체안 비고와 같은 판단).
 *   · `rose-red` = **도감·카드 한정.** 히어로 승격은 금지다(문서 §사용 규칙 3 — 장미·로맨스
 *     코드). 카탈로그에 빨간 장미가 있는 이상 대표컷은 필요하지만, 첫 화면을 장미가 덮으면
 *     서비스 톤이 "야간 식물 아카이브"에서 "로맨스"로 넘어간다. 코드 가드는 `canLeadHero()`.
 *
 * ── 라이선스 ────────────────────────────────────────────────────────
 * 32장 전부 Unsplash 정규 무료 라이선스다(`images.unsplash.com/photo-…` 경로만 채택 —
 * `premium_photo-` · `plus.unsplash.com` 은 유료 Unsplash+ 라 전량 배제했다).
 * 표기 의무는 없지만 **표기를 기본값으로 운용**한다(문서 §사용 규칙 2).
 * 표기 형식은 `Photo: {작가} / Unsplash` 고정 — `credit` 에 그 완성된 한 줄이 들어 있다.
 *
 * ── 핫링크 (플레이트와 다른 점) ──────────────────────────────────────
 * 도판(`src/lib/plates`)은 우리 `public/plates/` 로 **받아 두지만**, 사진은 **Unsplash CDN 을
 * 그대로 부른다.** 두 가지 이유다:
 *   ① 도판 31종은 전부 PD/CC0 라 재배포에 제약이 없고 위키미디어는 핫링크를 만류한다
 *      (연속 요청에 HTTP 429). Unsplash 는 반대다 — 자기네 CDN(imgix)을 통한 핫링크가
 *      권장 사용법이고, 폭·포맷 파라미터로 응답을 깎아 주는 것도 그 CDN 이다.
 *   ② Unsplash License 는 "사진 파일 자체의 재배포"를 금지한다(문서 §라이선스 요약).
 *      원본 바이트를 우리 도메인에 복사해 서빙하는 것은 그 조항에 가까이 간다.
 * 그래서 `src` 는 **파라미터가 없는 순수 원본 주소**만 갖고, 폭·포맷은 `photoSrc()` 가 붙인다.
 *
 * 순수 데이터·순수 함수만 둔다(React·fs 의존 금지) — 서버·클라이언트 양쪽에서 import 한다.
 */

export interface FlowerPhoto {
  /** `content/flowers.csv` 의 id. */
  flowerId: string;
  /**
   * 원본 주소 — **쿼리 파라미터 없이** 둔다.
   * 화면이 쓰는 주소는 `photoSrc(photo, 폭)` 이 만든다(용도별 해상도를 한 자리에서 정한다).
   */
  src: string;
  /** `Photo: {작가} / Unsplash` — 표기 형식 고정(문서 §사용 규칙 2). */
  credit: string;
  /** 사진이 실제로 무엇을 보여 주는지. 꽃 이름이 헤딩에 이미 있어도 여기서는 종을 말한다. */
  alt: string;
  /** 원본 가로 픽셀(imgix `?fm=json` 실측값). 히어로에 걸 수 있는 컷인지 가르는 근거다. */
  width?: number;
  /** 이 컷을 쓸 때 알아야 하는 한 줄. 화면에 나가지 않는 **개발자용 각주**다. */
  note?: string;
}

/**
 * 배경이 밝은 4종의 각주 — **같은 문자열을 재사용**해야 `needsDarkOverlay()` 가 걸린다.
 *
 * 이 넷은 어두운 배경 후보가 전부 저채도·모션블러·흑백뿐이라 밝고 선명한 컷을 택한 결과다
 * (문서 §선정 기준 3). 검정 배경 컷과 카드 그리드에 나란히 놓이면 톤이 튀므로 **컴포넌트
 * 쪽에서** 다크 오버레이로 밝기 차를 흡수한다(문서 §통합할 때 주의할 것 4 — "이건 이미지가
 * 아니라 컴포넌트 쪽에서 풀 문제다").
 */
const BRIGHT_BACKGROUND = '배경이 밝은 컷 — 카드 다크 오버레이 필요(문서 §주의 4).';

/** 원본 가로가 3000px 에 못 미치거나 겨우 넘는 컷의 각주(문서 §통합할 때 주의할 것 3). */
const SMALL_SOURCE = '원본이 작다 — 카드·도감까지가 안전 범위이고, 풀스크린 히어로는 피한다.';

/** 꽃 id → 대표 실사. 카탈로그 32종 전원이 여기 있다(`tests/components/photos.test.ts` 가 지킨다). */
export const FLOWER_PHOTOS: Record<string, FlowerPhoto> = {
  'rose-red': {
    flowerId: 'rose-red',
    src: 'https://images.unsplash.com/photo-1643282046863-c51a0e6d39bf',
    credit: 'Photo: Lye Clicks / Unsplash',
    alt: '검은 배경 위에 놓인 붉은 장미 한 송이와 초록 잎',
    width: 3448,
    // Advisor 확정 — 코드 가드는 `canLeadHero()` 가 들고 있다.
    note: '도감·카드 한정, 히어로 승격 금지(문서 §사용 규칙 3 — 장미·로맨스 코드).',
  },
  'tulip-white': {
    flowerId: 'tulip-white',
    src: 'https://images.unsplash.com/photo-1616160513556-9eca56c718d3',
    credit: 'Photo: Rainhard Wiesinger / Unsplash',
    alt: '검은 배경 앞에 나란히 선 흰 튤립 무리',
    width: 6024,
  },
  freesia: {
    flowerId: 'freesia',
    src: 'https://images.unsplash.com/photo-1612168829364-7cbd22935ab1',
    credit: 'Photo: MARIOLA GROBELSKA / Unsplash',
    alt: '안쪽에 주황빛이 번지는 노란 프리지아 꽃송이',
    width: 5184,
  },
  'lily-asiatic': {
    flowerId: 'lily-asiatic',
    src: 'https://images.unsplash.com/photo-1598443207199-33af6ea1aaa3',
    credit: 'Photo: M Poiss / Unsplash',
    alt: '밤의 어둠 속에서 활짝 벌어진 주황 백합',
    width: 3840,
  },
  gerbera: {
    flowerId: 'gerbera',
    src: 'https://images.unsplash.com/photo-1636799666540-4d90bcbf82d6',
    credit: 'Photo: Marija Ivanovic / Unsplash',
    alt: '검정 배경 위 초록 화심을 가진 붉은 거베라 한 송이',
    width: 6240,
  },
  anemone: {
    flowerId: 'anemone',
    src: 'https://images.unsplash.com/photo-1777567457818-a9e91885ff96',
    credit: 'Photo: Siegfried Poepperl / Unsplash',
    alt: '짙은 화심을 가진 파란 아네모네 한 송이',
    width: 6000,
  },
  hellebore: {
    flowerId: 'hellebore',
    src: 'https://images.unsplash.com/photo-1774093125643-893c3c1f1bd4',
    credit: 'Photo: Theo Lonic / Unsplash',
    alt: '초록 잎 사이에서 고개를 든 짙은 분홍 헬레보어 두 송이',
    width: 6000,
  },
  hyacinth: {
    flowerId: 'hyacinth',
    src: 'https://images.unsplash.com/photo-1606675647699-e6f0e1c39261',
    credit: 'Photo: Oscar Helgstrand / Unsplash',
    alt: '검은 배경 위 층층이 꽃이 달린 분홍 히아신스 한 대',
    width: 4016,
  },
  peony: {
    flowerId: 'peony',
    src: 'https://images.unsplash.com/photo-1596907731844-b2c4156abab0',
    credit: 'Photo: Gayatri Malhotra / Unsplash',
    alt: '검은 배경 위 겹겹이 벌어진 분홍 작약',
    width: 6000,
  },
  hydrangea: {
    flowerId: 'hydrangea',
    src: 'https://images.unsplash.com/photo-1579833931255-04fca9af45be',
    credit: 'Photo: César Couto / Unsplash',
    alt: '검은 배경 위 파랗게 뭉친 수국 꽃차례',
    width: 6244,
  },
  lavender: {
    flowerId: 'lavender',
    src: 'https://images.unsplash.com/photo-1687878267753-cb6421710196',
    credit: 'Photo: Michelle Tresemer / Unsplash',
    alt: '보랏빛 이삭이 빽빽하게 선 라벤더 밭',
    width: 8256,
    note: BRIGHT_BACKGROUND,
  },
  sunflower: {
    flowerId: 'sunflower',
    src: 'https://images.unsplash.com/photo-1593003520833-5c874a3cef28',
    credit: 'Photo: Kelly Sikkema / Unsplash',
    alt: '검은 배경 위에 홀로 놓인 해바라기 한 송이',
    width: 3712,
  },
  carnation: {
    flowerId: 'carnation',
    src: 'https://images.unsplash.com/photo-1699316048896-928064608723',
    credit: 'Photo: Townsend Walton / Unsplash',
    alt: '검은 배경 앞 화병에 꽂힌 붉은 카네이션',
    width: 6048,
  },
  lisianthus: {
    flowerId: 'lisianthus',
    src: 'https://images.unsplash.com/photo-1779911533677-ac22845be7f4',
    credit: 'Photo: Blu / Unsplash',
    alt: '검은 배경 위 부드럽게 벌어진 분홍 리시안셔스 한 송이',
    width: 3032,
    note: '태그 `eustoma` 로 속까지만 확인됐다(CSV 학명 Eustoma grandiflorum 과 속 일치).',
  },
  ranunculus: {
    flowerId: 'ranunculus',
    src: 'https://images.unsplash.com/photo-1767555489475-2a38e30535e8',
    credit: 'Photo: Pedro Vit / Unsplash',
    alt: '어두운 배경 위 겹꽃잎이 촘촘한 주황 라넌큘러스',
    width: 7006,
  },
  'lily-of-the-valley': {
    flowerId: 'lily-of-the-valley',
    src: 'https://images.unsplash.com/photo-1525106285486-d9fd5a988a23',
    credit: 'Photo: Océane George / Unsplash',
    alt: '초록 잎 사이에 줄지어 매달린 흰 종 모양 은방울꽃',
    width: 6016,
    note: BRIGHT_BACKGROUND,
  },
  chrysanthemum: {
    flowerId: 'chrysanthemum',
    src: 'https://images.unsplash.com/photo-1624373400586-b7f27ea22aad',
    credit: 'Photo: Yang Yu / Unsplash',
    alt: '가느다란 꽃잎이 방사형으로 퍼진 노란 국화',
    width: 5772,
  },
  narcissus: {
    flowerId: 'narcissus',
    src: 'https://images.unsplash.com/photo-1758141302921-aaf087d2617f',
    credit: 'Photo: Sebastian Schuster / Unsplash',
    alt: '검은 배경 위 주황 부화관을 가진 흰 수선화 세 송이',
    width: 4000,
  },
  'forget-me-not': {
    flowerId: 'forget-me-not',
    src: 'https://images.unsplash.com/photo-1685802315667-0a738e574558',
    credit: 'Photo: Dear Sunflower / Unsplash',
    alt: '어두운 배경 위 노란 화심을 가진 작고 푸른 물망초',
    // 32장 중 유일하게 3000px 미달. 종은 설명에 학명(Myosotis sylvatica)까지 적혀 있어 확실하다.
    width: 2981,
    note: SMALL_SOURCE,
  },
  'cherry-blossom': {
    flowerId: 'cherry-blossom',
    src: 'https://images.unsplash.com/photo-1776356829303-072ac14b63e5',
    credit: 'Photo: Chris Weiher / Unsplash',
    alt: '밤하늘을 배경으로 흐드러진 분홍 벚꽃 가지',
    width: 3812,
  },
  camellia: {
    flowerId: 'camellia',
    src: 'https://images.unsplash.com/photo-1615931632997-c592e375d6ef',
    credit: 'Photo: Nick Fewings / Unsplash',
    alt: '활짝 벌어진 붉은 동백 한 송이',
    // 설명에 학명(Camellia japonica)이 적힌 몇 안 되는 컷이다 — 해상도보다 종 확실성을 택했다.
    width: 3032,
    note: SMALL_SOURCE,
  },
  violet: {
    flowerId: 'violet',
    src: 'https://images.unsplash.com/photo-1651348864532-03a607500ba0',
    credit: 'Photo: Alexandra Marta / Unsplash',
    alt: '초록 들판에 낮게 핀 보라 제비꽃',
    width: 3676,
    note: BRIGHT_BACKGROUND,
  },
  iris: {
    flowerId: 'iris',
    src: 'https://images.unsplash.com/photo-1779286341675-8e3fa558d9c5',
    credit: 'Photo: Lisa Siefert / Unsplash',
    alt: '검정 배경 위 초록 잎과 함께 선 보라 아이리스',
    width: 6000,
  },
  marigold: {
    flowerId: 'marigold',
    src: 'https://images.unsplash.com/photo-1620005807545-2e08850d6591',
    credit: 'Photo: Julia Kwiek / Unsplash',
    alt: '짙은 초록 잎을 배경으로 뭉쳐 핀 주황 마리골드',
    width: 5616,
  },
  'corn-poppy': {
    flowerId: 'corn-poppy',
    // Advisor 확정 = 문서 §대체안의 **종 확정 컷**. 대표컷(Eduardo Goody)은 더 어두웠지만
    // 종명이 문자로 없는 정황 동정이었다.
    src: 'https://images.unsplash.com/photo-1560255261-85cbc816539f',
    credit: 'Photo: Tanya Cressey / Unsplash',
    alt: '들판에 홀로 선 붉은 개양귀비 한 송이',
    width: 4015,
    note: '제목이 "common poppy"(= Papaver rhoeas) 라 종이 문자로 확인된다.',
  },
  jasmine: {
    flowerId: 'jasmine',
    src: 'https://images.unsplash.com/photo-1760036268954-7e21f3eef3e8',
    credit: 'Photo: Zayed Ahmed Zadu / Unsplash',
    alt: '짙은 초록 잎 사이에서 홀로 핀 흰 재스민 한 송이',
    width: 4512,
    note: 'Jasminum 속까지만 확인됐다(sambac 여부는 문자로 없음).',
  },
  'babys-breath': {
    flowerId: 'babys-breath',
    src: 'https://images.unsplash.com/photo-1591868308567-c36f3a2c5407',
    credit: 'Photo: Tatiana Koroleva / Unsplash',
    alt: '잔가지마다 자잘하게 흐드러진 흰 안개꽃',
    width: 5184,
    note: BRIGHT_BACKGROUND,
  },
  cosmos: {
    flowerId: 'cosmos',
    src: 'https://images.unsplash.com/photo-1763047329472-2849ebd6c507',
    credit: 'Photo: Arya Arjun / Unsplash',
    alt: '어두운 배경 속에 홀로 선 분홍 코스모스와 꽃봉오리',
    width: 3998,
  },
  magnolia: {
    flowerId: 'magnolia',
    src: 'https://images.unsplash.com/photo-1773953942162-a63e82051318',
    credit: 'Photo: Bernd Dittrich / Unsplash',
    alt: '해질 무렵 어두운 맨가지 위에 핀 흰 목련',
    width: 3024,
    note: '잎 없는 맨가지 = CSV 의 "잎보다 꽃이 먼저" 서술과 맞는다(M. kobus 계열).',
  },
  pansy: {
    flowerId: 'pansy',
    src: 'https://images.unsplash.com/photo-1705947722737-519c0bab7814',
    credit: 'Photo: Wyxina Tresse / Unsplash',
    alt: '검은 배경 위 주황과 노랑이 번지는 팬지 클로즈업',
    width: 4640,
  },
  poinsettia: {
    flowerId: 'poinsettia',
    src: 'https://images.unsplash.com/photo-1637538286398-10173661522b',
    credit: 'Photo: Samantha Jean / Unsplash',
    // ⚠ 붉은 부분은 **포엽(잎)** 이다 — alt·캡션에 "꽃잎"이라 쓰지 마라(문서 §주의 2,
    //   CSV editorial_note 와 도감 본문이 이 사실을 다룬다).
    alt: '붉은 포엽이 별처럼 펼쳐진 포인세티아',
    width: 5184,
  },
  daisy: {
    flowerId: 'daisy',
    src: 'https://images.unsplash.com/photo-1770061737103-18986c61fa5f',
    credit: 'Photo: Antje Winkler / Unsplash',
    alt: '노란 화심을 가진 흰 데이지 한 송이',
    width: 7008,
  },
};

/**
 * 화면이 쓰는 폭. Unsplash imgix 는 임의 폭을 받아 주지만(위키미디어와 다른 점),
 * 값이 화면마다 제각각이면 CDN 캐시가 갈라진다 — **쓰는 폭을 여기 네 가지로 묶는다.**
 *   · 640  카드 썸네일·모바일 카드
 *   · 1080 카드 기본(4:5 카드의 레티나 2배)
 *   · 1600 도감 상세 히어로
 *   · 2560 랜딩 풀스크린 히어로
 */
export type PhotoWidth = 640 | 1080 | 1600 | 2560;

/**
 * 그 폭의 이미지 주소 — `?auto=format&fit=crop&w={폭}&q=80`.
 * `auto=format` 이 브라우저에 따라 WebP/AVIF 를 대신 내준다(문서 §채택 이미지 머리말).
 * 아는 호스트(Unsplash)만 파라미터를 붙이고, 모르는 주소는 **그대로 돌려준다**(깨뜨리지 않는다).
 */
export function photoSrc(photo: FlowerPhoto, width: PhotoWidth = 1080): string {
  if (!photo.src.startsWith('https://images.unsplash.com/')) return photo.src;
  return `${photo.src}?auto=format&fit=crop&w=${width}&q=80`;
}

/**
 * `srcset` 한 줄 — 같은 컷의 여러 폭을 브라우저에게 고르게 한다.
 *
 * 왜 필요한가: `photoSrc()` 하나만 쓰면 **모든 기기가 같은 폭을 받는다.** 380px 카드에
 * 1080 을 내려보내는 것은 데스크톱 레티나에서는 맞고 폰에서는 네 배 낭비다.
 *
 * ⚠ **`sizes` 를 함께 주지 않으면 소용이 없다.** `sizes` 가 없으면 브라우저는 폭을
 *   `100vw` 로 가정해 언제나 가장 큰 후보를 고른다. 화면별 권장값은 이렇다:
 *     · 랜딩 카드 (`.db-slide` = min(86%, 380px), 640 이하에서는 min(88%, 340px))
 *         `(max-width: 640px) 88vw, (max-width: 1180px) 46vw, 380px`
 *     · 랜딩 히어로 (풀블리드) → `100vw`
 *     · 도감 상세 히어로 (셸 폭) → `(max-width: 900px) 100vw, 900px`
 *
 * 폭 목록은 `photoSrc()` 를 그대로 통과시키므로 CDN 캐시 키가 갈라지지 않는다.
 */
export function photoSrcSet(
  photo: FlowerPhoto,
  widths: readonly PhotoWidth[] = [640, 1080],
): string {
  return widths.map((width) => `${photoSrc(photo, width)} ${width}w`).join(', ');
}

/**
 * 이미 파라미터가 붙어 있는 Unsplash 주소의 `srcset`.
 *
 * `FLOWER_PHOTOS` 는 파라미터 없는 원본만 갖지만(위 머리말), `src/lib/theme/flowers.ts` 의
 * 장면컷은 크롭비(`h`)까지 손으로 맞춘 **완성된 주소**라 폭만 갈아 끼워야 한다.
 * 그래서 `w` 를 바꾸고 `h` 가 있으면 **같은 비율로 함께 줄인다** — 크롭이 달라지면
 * 후보들끼리 다른 그림이 되어 브라우저가 폭을 바꿀 때 화면이 튄다.
 *
 * 아는 호스트가 아니면 원본 한 벌만 돌려준다(깨뜨리지 않는다).
 */
export function unsplashSrcSet(src: string, widths: readonly number[]): string {
  if (!src.startsWith('https://images.unsplash.com/')) return src;
  const [base, query = ''] = src.split('?');
  const source = new URLSearchParams(query);
  const originalWidth = Number(source.get('w'));
  const originalHeight = Number(source.get('h'));

  return widths
    .map((width) => {
      const params = new URLSearchParams(source);
      if (originalWidth > 0 && originalHeight > 0) {
        params.set('h', String(Math.round((originalHeight * width) / originalWidth)));
      }
      params.set('w', String(width));
      if (!params.has('auto')) params.set('auto', 'format');
      if (!params.has('fit')) params.set('fit', 'crop');
      if (!params.has('q')) params.set('q', '80');
      return `${base}?${params.toString()} ${width}w`;
    })
    .join(', ');
}

/** 그 꽃의 대표 실사. 아직 컷이 없는 꽃이면 undefined — 화면은 사진 없이도 성립해야 한다. */
export function photoFor(flowerId: string): FlowerPhoto | undefined {
  return FLOWER_PHOTOS[flowerId];
}

/**
 * 배경이 밝아 **카드에서 다크 오버레이가 필요한** 컷인가(문서 §주의 4).
 * 지금은 `lavender` `babys-breath` `lily-of-the-valley` `violet` 넷이다.
 */
export function needsDarkOverlay(photo: FlowerPhoto): boolean {
  return photo.note === BRIGHT_BACKGROUND;
}

/**
 * 랜딩 히어로(첫 화면)에 걸어도 되는 꽃인가.
 *
 * 문서 §사용 규칙 3 이 장미·로맨스 코드를 히어로에서 금지한다. 카탈로그에 빨간 장미가 있는
 * 이상 대표컷 자체는 필요하므로, **금지는 자리(히어로)에만 건다** — 도감·카드에서는 그대로 쓴다.
 */
export function canLeadHero(flowerId: string): boolean {
  return flowerId !== 'rose-red';
}

/** 크레딧 한 줄 — 이미 `Photo: {작가} / Unsplash` 형식으로 완성돼 있다. */
export function photoCredit(photo: FlowerPhoto): string {
  return photo.credit;
}

/**
 * 화면에 실제로 쓴 사진들의 크레딧 — 중복을 지우고 알파벳 순으로 세운다.
 * (도판의 `plateCredits` 와 같은 규칙이다. 사진은 판본이 없어 합쳐질 여지가 작지만,
 *  같은 작가의 두 컷을 쓰게 되는 날에는 한 줄로 접힌다.)
 */
export function photoCredits(flowerIds: readonly string[]): string[] {
  const lines = new Set<string>();
  for (const id of flowerIds) {
    const photo = photoFor(id);
    if (photo) lines.add(photoCredit(photo));
  }
  return [...lines].sort((a, b) => a.localeCompare(b, 'en'));
}
