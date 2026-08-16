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
 * 두 소스만 쓴다(2026-08-16 품질 재검토에서 확장, 문서 §확장 소스 풀):
 *   · **Unsplash** — `images.unsplash.com/photo-…` 경로만. `premium_photo-` · `plus.unsplash.com`
 *     은 유료 Unsplash+ 라 전량 배제한다.
 *   · **Pexels** — `images.pexels.com/photos/…` 경로. Pexels License 도 상업적 사용 무료·표기 선택이다.
 * 표기 의무는 어느 쪽도 없지만 **표기를 기본값으로 운용**한다(문서 §사용 규칙 2).
 * 표기 형식은 `Photo: {작가} / {소스}` 고정 — `credit` 에 그 완성된 한 줄이 들어 있다.
 *
 * Wikimedia Commons 도 승인된 소스지만 **이번 라운드 채택분은 0장**이다. 이유는 라이선스가
 * 아니라 배달 방식이다 — 아래 `PHOTO_SOURCES` 의 위키미디어 주석을 보라.
 *
 * ── 핫링크 (플레이트와 다른 점) ──────────────────────────────────────
 * 도판(`src/lib/plates`)은 우리 `public/plates/` 로 **받아 두지만**, 사진은 **소스 CDN 을
 * 그대로 부른다.** 두 가지 이유다:
 *   ① 도판 31종은 전부 PD/CC0 라 재배포에 제약이 없고 위키미디어는 핫링크를 만류한다
 *      (연속 요청에 HTTP 429). Unsplash·Pexels 는 반대다 — 자기네 이미지 CDN 을 통한 핫링크가
 *      권장 사용법이고, 폭·포맷 파라미터로 응답을 깎아 주는 것도 그 CDN 이다.
 *   ② 두 라이선스 모두 "사진 파일 자체의 재배포"를 금지한다(문서 §라이선스 요약).
 *      원본 바이트를 우리 도메인에 복사해 서빙하는 것은 그 조항에 가까이 간다.
 * 그래서 `src` 는 **파라미터가 없는 순수 원본 주소**만 갖고, 폭·포맷은 `photoSrc()` 가 붙인다.
 *
 * ── 컷이 한 장이 아니다 (2026-08-16 갤러리 라운드) ───────────────────
 * 표가 둘이다. **대표 32장**(`FLOWER_PHOTOS`)과 그 뒤에 붙는 **갤러리 추가컷**
 * (`GALLERY_EXTRAS`, 꽃당 1~3장). 나누어 둔 이유는 자리마다 필요가 다르기 때문이다:
 *   · 한 장만 보여 주는 자리(랜딩 히어로·카드, 결과, 편지)는 `photoFor()` — **대표 하나**.
 *   · 여러 장을 넘겨 보는 자리(도감 상세)는 `photosFor()` — **대표를 첫 장으로** 한 전부.
 * 그래서 대표를 바꾸면 서비스 전체가 따라 움직이고, 갤러리를 늘려도 다른 화면은 그대로다.
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
  /** `Photo: {작가} / {소스}` — 표기 형식 고정(문서 §사용 규칙 2). 소스는 `photoSource()` 가 안다. */
  credit: string;
  /** 사진이 실제로 무엇을 보여 주는지. 꽃 이름이 헤딩에 이미 있어도 여기서는 종을 말한다. */
  alt: string;
  /** 원본 가로 픽셀(imgix `?fm=json` 실측값). 히어로에 걸 수 있는 컷인지 가르는 근거다. */
  width?: number;
  /** 이 컷을 쓸 때 알아야 하는 한 줄. 화면에 나가지 않는 **개발자용 각주**다. */
  note?: string;
  /**
   * 같은 꽃의 **다른 컷들 사이에서 이 컷이 무엇인가** — 도감 갤러리 캡션에 그대로 나간다
   * (`흰빛` `분홍빛` 같은 색 변형, 색이 같으면 `가까이` `뒤에서` 같은 앵글).
   *
   * ⚠ 이 라벨은 **이웃한 컷이 있을 때만 뜻이 있다.** 한 장만 보여 주는 자리(랜딩 히어로·
   *   결과 카드·편지)에서 "분홍빛"이라고 말해 봐야 무엇과 견준 분홍인지 알 수 없다.
   *   그래서 `photoFor()` 가 주는 대표컷에는 이 값이 없고, `photosFor()` 가 갤러리를
   *   조립할 때만 첫 장에 붙여 준다(`PRIMARY_VARIANT`).
   *
   * 어휘는 §1.5d 톤 — `…빛` 계열의 색 이름이거나 두세 어절짜리 한국어 구다.
   */
  variant?: string;
}

/**
 * 배경이 밝은 4종의 각주 — **같은 문자열을 재사용**해야 `needsDarkOverlay()` 가 걸린다.
 *
 * 이 넷은 어두운 배경 후보가 전부 저채도·모션블러·흑백뿐이라 밝고 선명한 컷을 택한 결과다
 * (문서 §선정 기준 3). 검정 배경 컷과 카드 그리드에 나란히 놓이면 톤이 튀므로 **컴포넌트
 * 쪽에서** 다크 오버레이로 밝기 차를 흡수한다(문서 §통합할 것 4 — "이건 이미지가
 * 아니라 컴포넌트 쪽에서 풀 문제다").
 *
 * ⚠ **명단이 2026-08-16 재검토에서 한 칸 바뀌었다**(수는 그대로 넷).
 *   · `violet` **제외** — 새 컷(Tom Fisk)은 어두운 초록 보케 배경이라 오버레이가 필요 없다.
 *   · `forget-me-not` **편입** — 새 컷(Nancy Hughes)은 밝은 풀잎이 화면 오른쪽을 채운다.
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
    // 2026-08-16 교체. 옛 컷(MARIOLA GROBELSKA)은 주황·노랑만 남은 **추상 매크로**라
    // 무슨 꽃인지 읽히지 않았다 — 도감 대표컷의 존재 이유를 정면으로 어긴다.
    src: 'https://images.pexels.com/photos/12224117/pexels-photo-12224117.jpeg',
    credit: 'Photo: Gintare Baradinske / Pexels',
    alt: '검은 배경 위에 한쪽으로 휜 꽃대를 따라 피어난 연보라 프리지아',
    width: 3747,
    note: 'Pexels 제목이 "Freesia Flower in Bloom in Black Background" — 종이 문자로 확인된다.',
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
    // 2026-08-16 교체. 옛 컷(Theo Lonic)은 갈빛이 도는 탁한 분홍에 배경 하이라이트가 날아가
    // "거무칙칙 금지" 기준에 걸렸다. 새 컷은 흰 바탕에 자주 반점이 또렷하다.
    src: 'https://images.pexels.com/photos/6580045/pexels-photo-6580045.jpeg',
    credit: 'Photo: Gordon Bishop / Pexels',
    alt: '자주색 반점이 번진 흰 헬레보어 한 송이 클로즈업',
    width: 4333,
    note: 'Pexels 제목이 "Close-up Photo of a White Hellebore Flower" — 속이 문자로 확인된다.',
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
    // 2026-08-16 교체. 옛 컷(Michelle Tresemer)은 **밭 원경**이라 이번 라운드 1번 기준
    // (꽃송이가 화면의 주인공)에 걸렸다. 새 컷은 이삭 하나의 잔꽃까지 보이는 매크로다.
    src: 'https://images.unsplash.com/photo-1783094674172-90ca237a47f3',
    credit: 'Photo: Mia Brzeskot / Unsplash',
    alt: '보라색 잔꽃이 촘촘히 달린 라벤더 이삭 매크로',
    width: 6720,
    // 배경 보케에 흰·주황 밝은 띠가 남아 밝은 컷 판정은 그대로 유지한다.
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
    // 2026-08-16 교체. 옛 컷(Blu)은 꽃잎 가장자리가 갈변해 **시드는 꽃**으로 읽혔다.
    // 새 컷은 문서 §대체안이 이미 검증해 둔 보라 컷이다(Advisor 승인 범위 안).
    src: 'https://images.unsplash.com/photo-1783835697342-7c0ccffcfe12',
    credit: 'Photo: Pedro Vit / Unsplash',
    alt: '검은 배경 위에 나란히 벌어진 진보라 리시안셔스 세 송이',
    width: 4606,
    note: '속(Eustoma)까지 확인 — 겹꽃잎·가시 없는 매끈한 줄기로 장미와 구분된다.',
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
    // 2026-08-16 교체. 옛 컷(Dear Sunflower)은 잎이 올리브빛으로 죽고 꽃이 화면의 15% 도
    // 못 차지했으며 32장 중 유일하게 3000px 미달이었다 — 세 가지 결함을 한 번에 턴다.
    // 새 컷은 문서 §대체안이 "가로 3000px 이상이 필요할 때"로 이미 세워 둔 컷이다.
    src: 'https://images.unsplash.com/photo-1650634693805-4ca42ddc1af5',
    credit: 'Photo: Nancy Hughes / Unsplash',
    alt: '노란 화심을 가진 하늘색 물망초가 다발로 모여 핀 클로즈업',
    width: 3996,
    // 종은 확실하지만(설명에 학명 명기) 배경 풀잎이 밝아 오버레이 대상으로 새로 편입됐다.
    note: BRIGHT_BACKGROUND,
  },
  'cherry-blossom': {
    flowerId: 'cherry-blossom',
    // 2026-08-16 교체 — **사용자 지적 컷**. 옛 컷(Chris Weiher)은 나무 전체를 올려다본
    // 원경이라 건물 모서리까지 들어왔다. 새 컷은 꽃송이 몇 개가 화면을 채우는 클로즈업이다.
    src: 'https://images.unsplash.com/photo-1671042512616-41e6f8ade6e0',
    credit: 'Photo: Ricky LK / Unsplash',
    alt: '어두운 배경 앞에서 활짝 벌어진 분홍 벚꽃 무리 클로즈업',
    width: 4654,
    note: '제목이 "pink cherry blossom" — 끝이 갈라진 꽃잎과 긴 수술로 벚나무를 확인했다.',
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
    // 2026-08-16 교체. 옛 컷(Alexandra Marta)은 화면 위 절반을 풀·씨방이 덮어 꽃이 주인공이
    // 아니었고 색도 바랬다. 새 컷은 어두운 초록 보케 위 두 송이 클로즈업이다.
    src: 'https://images.pexels.com/photos/12556024/pexels-photo-12556024.jpeg',
    credit: 'Photo: Tom Fisk / Pexels',
    alt: '어두운 초록 배경 앞에 홀로 핀 자주색 제비꽃 클로즈업',
    width: 8640,
    // ⚠ 종 근거가 한 단계 내려갔다 — 옛 컷은 제목이 "Sweet violets"(= V. odorata) 였다.
    note: '속(Viola)까지 확인 — 제목이 "Violet Flower" 이고 V. odorata 여부는 문자로 없다.',
  },
  iris: {
    flowerId: 'iris',
    // 2026-08-16 교체. 같은 촬영분의 다른 컷(문서 §대체안)이다 — 옛 컷은 꽃이 화면 오른쪽에
    // 몰려 4:5 카드에서 잘릴 위험이 있었다. 종 근거·작가·톤은 그대로 두고 구도만 고쳤다.
    src: 'https://images.unsplash.com/photo-1779286341675-be412c1448f9',
    credit: 'Photo: Lisa Siefert / Unsplash',
    alt: '검정 배경 위에 곧게 선 보라 아이리스 한 송이',
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
    // 2026-08-16 교체. 옛 컷(Zayed Ahmed Zadu)은 꽃이 화면 오른쪽 위 구석에 **2% 남짓**
    // 걸려 있고 나머지는 거의 검은 잎이었다 — 32장 중 근접도 최악이었다.
    src: 'https://images.pexels.com/photos/34677052/pexels-photo-34677052.jpeg',
    credit: 'Photo: Louis Tran / Pexels',
    alt: '검은 배경 위에 모여 핀 흰 겹꽃 재스민 클로즈업',
    width: 4624,
    note: 'Jasminum 속까지 확인 — 겹꽃 로제트는 J. sambac 겹꽃 계열 형태다(품종은 형태 근거).',
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
    // 2026-08-16 교체. 옛 컷(Arya Arjun)은 꽃이 화면 위쪽 10% 에 걸리고 아래 절반이 빈
    // 어둠·줄기였다 — 4:5 카드로 자르면 꽃이 잘려 나간다.
    src: 'https://images.unsplash.com/photo-1704265586510-f09575135f35',
    credit: 'Photo: William Warby / Unsplash',
    alt: '노란 화심을 가운데 두고 활짝 펼쳐진 자홍 코스모스 매크로',
    width: 3648,
    // 주황 노랑코스모스(C. sulphureus)는 CSV 학명과 달라 이번에도 전량 배제했다.
    note: '분홍 설상화 + 노란 관상화 = C. bipinnatus 계열(CSV 학명과 일치).',
  },
  magnolia: {
    flowerId: 'magnolia',
    // 2026-08-16 교체. 옛 컷(Bernd Dittrich)은 해질녘 나뭇가지 덤불 원경이라 꽃 한 송이도
    // 또렷하지 않았다 — 벚꽃과 같은 실패다.
    src: 'https://images.unsplash.com/photo-1713727747459-2c5774698437',
    credit: 'Photo: Ronin / Unsplash',
    alt: '어두운 맨가지 위에 겹겹이 벌어진 흰 목련 한 송이',
    width: 3024,
    note: '제목 "Star Magnolia" = M. stellata(M. kobus 와 같은 절). 맨가지 개화가 CSV 서술과 맞는다.',
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

/* ------------------------------------------------------------------ *
 * 도감 갤러리 — 같은 꽃의 여러 컷 (2026-08-16 다중 사진 라운드)
 * ------------------------------------------------------------------ */

/**
 * 대표컷의 색 라벨 — **갤러리 첫 장의 캡션**이다.
 *
 * 왜 위 `FLOWER_PHOTOS` 안에 안 넣었나: 대표컷 32장은 랜딩 히어로·결과 카드·편지가
 * 함께 쓰는 자리이고, 사용자가 "홈에서 본 그 사진이 갤러리 첫 장"이라고 못 박은 값이다.
 * 32줄에 손을 대면 그 약속이 눈에 안 보이게 흔들릴 수 있다 — **표를 건드리지 않고
 * 라벨만 옆에 둔다.** `photosFor()` 가 조립할 때만 합쳐진다.
 *
 * 라벨은 `content/flowers.csv` 의 `colors` 첫 값과 **대체로** 일치한다. 다르면 사진이
 * 이긴다(예: 팬지의 CSV 대표색은 purple 이지만 대표컷은 주황이다) — 캡션은 분류가 아니라
 * **눈에 보이는 것**을 말해야 한다.
 */
const PRIMARY_VARIANT: Record<string, string> = {
  'rose-red': '붉은빛',
  'tulip-white': '흰빛',
  freesia: '연보랏빛',
  'lily-asiatic': '주황빛',
  gerbera: '붉은빛',
  anemone: '푸른빛',
  hellebore: '흰빛',
  hyacinth: '분홍빛',
  peony: '분홍빛',
  hydrangea: '푸른빛',
  lavender: '보랏빛',
  sunflower: '노란빛',
  carnation: '붉은빛',
  lisianthus: '보랏빛',
  ranunculus: '주황빛',
  'lily-of-the-valley': '흰빛',
  chrysanthemum: '노란빛',
  narcissus: '흰빛',
  'forget-me-not': '하늘빛',
  'cherry-blossom': '분홍빛',
  camellia: '붉은빛',
  violet: '자줏빛',
  iris: '보랏빛',
  marigold: '주황빛',
  'corn-poppy': '붉은빛',
  jasmine: '흰빛',
  'babys-breath': '흰빛',
  cosmos: '자홍빛',
  magnolia: '흰빛',
  pansy: '주황빛',
  poinsettia: '붉은빛',
  daisy: '흰빛',
};

/**
 * 대표 **다음에** 오는 컷들 — 꽃마다 1~3장(합쳐서 2~4장).
 *
 * 출처 문서: `docs/image-assets.md` §도감 갤러리 컷 (2026-08-16). 위 32장과 같은 규정을
 * 통과했다 — Unsplash·Pexels 무료 경로만, `premium_photo-`·`plus.` 배제, 근접샷,
 * 원본 가로 2400px 이상, 색 생동, 종 정확성. 전수 HTTP 200 + 원본 픽셀 실측을 마쳤다.
 *
 * **고르는 순서는 색이 먼저다**(사용자 요청 — "같은 꽃이라도 색상이 여러 가지니까").
 * `content/flowers.csv` 의 `colors` 에 있는 색을 우선 채우고, 그 색의 쓸 만한 컷이 없으면
 * 같은 색의 **다른 앵글**로 간다(해바라기·라벤더·동백이 그 경우다).
 *
 * ⚠ 여기 줄을 더할 때 **첫 장을 여기 넣지 마라.** 첫 장은 언제나 `FLOWER_PHOTOS` 의
 *   대표컷이고, 그것이 랜딩 카드를 누르고 들어온 사람이 방금 본 사진이다.
 */
const GALLERY_EXTRAS: Record<string, readonly FlowerPhoto[]> = {
  'rose-red': [
    {
      flowerId: 'rose-red',
      src: 'https://images.pexels.com/photos/18829227/pexels-photo-18829227.jpeg',
      credit: 'Photo: Tanya Budchenko / Pexels',
      alt: '검은 배경 앞에 겹쳐 선 연분홍 장미 세 송이',
      width: 4000,
      variant: '분홍빛',
      // §사용 규칙 3 은 **빨강·와인 레드** 장미를 막는다. 분홍은 그 금지선 밖이고,
      // 이 컷도 대표컷과 같이 `canLeadHero()` 가 히어로에서 걸러 낸다(자리로만 막는다).
      note: '장미는 갤러리도 도감·카드 한정 — 히어로 금지는 대표컷과 같다.',
    },
  ],
  'tulip-white': [
    {
      flowerId: 'tulip-white',
      src: 'https://images.pexels.com/photos/36998694/pexels-photo-36998694.jpeg',
      credit: 'Photo: Andromeda99 / Pexels',
      alt: '검은 배경 위에 서로 기댄 크림빛 튤립 두 송이',
      width: 5000,
      variant: '크림빛',
    },
    {
      flowerId: 'tulip-white',
      src: 'https://images.pexels.com/photos/12620487/pexels-photo-12620487.jpeg',
      credit: 'Photo: Tatsiana Snitko / Pexels',
      alt: '물방울이 촘촘히 맺힌 분홍 튤립 클로즈업',
      width: 4000,
      variant: '분홍빛',
    },
  ],
  freesia: [
    {
      flowerId: 'freesia',
      src: 'https://images.pexels.com/photos/11724820/pexels-photo-11724820.jpeg',
      credit: 'Photo: Ahmed / Pexels',
      alt: '검은 배경 위에 옆으로 누운 흰 프리지아 클로즈업',
      width: 3915,
      variant: '흰빛',
    },
    {
      flowerId: 'freesia',
      src: 'https://images.pexels.com/photos/12224120/pexels-photo-12224120.jpeg',
      credit: 'Photo: Gintare Baradinske / Pexels',
      alt: '짙푸른 배경 앞에 붉게 물든 프리지아 꽃대',
      width: 4000,
      // 대표컷과 같은 작가·같은 촬영분이라 종 근거가 그대로 따라온다.
      note: '대표컷(Gintare Baradinske)과 같은 촬영분 — 종 근거를 공유한다.',
      variant: '붉은빛',
    },
  ],
  'lily-asiatic': [
    {
      flowerId: 'lily-asiatic',
      src: 'https://images.pexels.com/photos/37010067/pexels-photo-37010067.jpeg',
      credit: 'Photo: Sephina Cornwall / Pexels',
      alt: '주황 꽃잎 안쪽이 검붉게 물든 아시아틱 백합 클로즈업',
      width: 5184,
      note: 'Pexels 제목이 "asiatic lily" — 위를 향해 벌어진 무향 대륜이라 오리엔탈과 구분된다.',
      variant: '검붉은 무늬',
    },
    {
      flowerId: 'lily-asiatic',
      src: 'https://images.pexels.com/photos/18302276/pexels-photo-18302276.jpeg',
      credit: 'Photo: MikeGz / Pexels',
      alt: '검은 배경 앞에서 막 벌어지는 주황 백합 봉오리',
      width: 3470,
      variant: '막 벌어질 때',
    },
  ],
  gerbera: [
    {
      flowerId: 'gerbera',
      src: 'https://images.unsplash.com/photo-1724122720444-1f54bc5ba04d',
      credit: 'Photo: Anna Jackowska / Unsplash',
      alt: '검은 배경 위에 눕혀 놓은, 물방울이 맺힌 주황 거베라',
      width: 5760,
      variant: '주황빛',
    },
    {
      flowerId: 'gerbera',
      src: 'https://images.pexels.com/photos/2343173/pexels-photo-2343173.jpeg',
      credit: 'Photo: Ylanite Koppens / Pexels',
      alt: '어두운 배경 위에 곧게 선 분홍 거베라 한 송이',
      width: 6000,
      variant: '분홍빛',
    },
  ],
  anemone: [
    {
      flowerId: 'anemone',
      src: 'https://images.pexels.com/photos/7185715/pexels-photo-7185715.jpeg',
      credit: 'Photo: Karola G / Pexels',
      alt: '검은 천 위에 놓인, 검은 화심을 가진 붉은 아네모네 한 송이',
      width: 6720,
      note: '검은 화심 + 흰 테 = A. coronaria 특징(CSV 학명과 일치). 흰 일본아네모네는 종이 달라 배제했다.',
      variant: '붉은빛',
    },
  ],
  hellebore: [
    {
      flowerId: 'hellebore',
      src: 'https://images.pexels.com/photos/31261507/pexels-photo-31261507.jpeg',
      credit: 'Photo: Siegfried Poepperl / Pexels',
      alt: '초록 잎을 배경으로 활짝 벌어진 진분홍 헬레보어',
      width: 5255,
      variant: '분홍빛',
    },
    {
      flowerId: 'hellebore',
      src: 'https://images.pexels.com/photos/3796630/pexels-photo-3796630.jpeg',
      credit: 'Photo: Ellie Burgin / Pexels',
      alt: '연둣빛 꽃과 봉오리가 층층이 달린 헬레보어',
      width: 3898,
      variant: '연둣빛',
    },
  ],
  hyacinth: [
    {
      flowerId: 'hyacinth',
      src: 'https://images.pexels.com/photos/38051960/pexels-photo-38051960.jpeg',
      credit: 'Photo: Pescha Taylor / Pexels',
      alt: '잔꽃이 빽빽이 달린 보라 히아신스 꽃대 여럿',
      width: 8688,
      variant: '보랏빛',
    },
    {
      flowerId: 'hyacinth',
      src: 'https://images.pexels.com/photos/4023531/pexels-photo-4023531.jpeg',
      credit: 'Photo: Jeffrey Riley / Pexels',
      alt: '어두운 배경 앞에 모여 핀 흰 히아신스 꽃차례',
      width: 3456,
      // 히아신스 검색은 무스카리(그레이프 히아신스)가 대량으로 섞인다 — 속이 다르다.
      note: '굵은 꽃대에 별 모양 소화 = Hyacinthus. 무스카리·블루벨은 이번에도 배제했다.',
      variant: '흰빛',
    },
  ],
  peony: [
    {
      flowerId: 'peony',
      src: 'https://images.unsplash.com/photo-1747348744574-e8119373cbaf',
      credit: 'Photo: Haberdoedas / Unsplash',
      alt: '검은 배경 위 노란 수술을 드러낸 크림빛 작약',
      width: 7656,
      variant: '크림빛',
    },
    {
      flowerId: 'peony',
      src: 'https://images.pexels.com/photos/38039807/pexels-photo-38039807.jpeg',
      credit: 'Photo: Fez Brook / Pexels',
      alt: '검은 배경 위 겹겹이 부푼 흰 작약 한 송이',
      width: 5272,
      variant: '흰빛',
    },
  ],
  hydrangea: [
    {
      flowerId: 'hydrangea',
      src: 'https://images.pexels.com/photos/38085976/pexels-photo-38085976.jpeg',
      credit: 'Photo: Sveta Moisseyeva / Pexels',
      alt: '화면을 가득 채운 분홍 수국 꽃차례',
      width: 3072,
      variant: '분홍빛',
    },
    {
      flowerId: 'hydrangea',
      src: 'https://images.pexels.com/photos/29158296/pexels-photo-29158296.jpeg',
      credit: 'Photo: Siegfried Poepperl / Pexels',
      alt: '어두운 잎을 배경으로 크게 벌어진 자홍빛 수국 헛꽃 두 송이',
      width: 4800,
      variant: '자홍빛',
    },
  ],
  lavender: [
    {
      flowerId: 'lavender',
      src: 'https://images.pexels.com/photos/1196311/pexels-photo-1196311.jpeg',
      credit: 'Photo: Brett Sayles / Pexels',
      alt: '보라 보케를 배경으로 잔꽃이 벌어진 라벤더 이삭 매크로',
      width: 5568,
      // 토끼귀 포엽을 단 스페인라벤더(L. stoechas)는 CSV 학명과 달라 전량 배제했다.
      note: '포엽 없이 이삭에 잔꽃만 붙는 형태 = L. angustifolia 계열(CSV 학명과 일치).',
      variant: '가까이',
    },
  ],
  sunflower: [
    {
      flowerId: 'sunflower',
      src: 'https://images.pexels.com/photos/17296674/pexels-photo-17296674.jpeg',
      credit: 'Photo: DI LAI / Pexels',
      alt: '어두운 바탕에 꽃가루가 흩어진 해바라기 한 송이를 위에서 본 컷',
      width: 4996,
      variant: '위에서',
    },
    {
      flowerId: 'sunflower',
      src: 'https://images.pexels.com/photos/19944973/pexels-photo-19944973.jpeg',
      credit: 'Photo: Roman Bengaiev / Pexels',
      alt: '검은 배경 앞에서 초록 총포와 노란 꽃잎이 겹쳐 보이는 해바라기 옆모습',
      width: 4000,
      variant: '뒤에서',
    },
  ],
  carnation: [
    {
      flowerId: 'carnation',
      src: 'https://images.pexels.com/photos/37902604/pexels-photo-37902604.jpeg',
      credit: 'Photo: Marek Ruczaj / Pexels',
      alt: '검은 배경 앞에 모여 핀 연분홍 카네이션과 꽃봉오리',
      width: 5184,
      variant: '분홍빛',
    },
    {
      flowerId: 'carnation',
      src: 'https://images.pexels.com/photos/35156328/pexels-photo-35156328.jpeg',
      credit: 'Photo: Irene Asthetik / Pexels',
      alt: '꽃잎 가장자리마다 자주색 테가 둘린 분홍 카네이션 클로즈업',
      width: 2548,
      // CSV colors 의 `variegated` 를 눈으로 보여 주는 컷이다.
      variant: '자주 테두리',
    },
  ],
  lisianthus: [
    {
      flowerId: 'lisianthus',
      src: 'https://images.pexels.com/photos/15252970/pexels-photo-15252970.jpeg',
      credit: 'Photo: Pawel Konrad / Pexels',
      alt: '검은 배경 위에 옆으로 벌어진 분홍 리시안셔스와 봉오리',
      width: 6000,
      variant: '분홍빛',
    },
    {
      flowerId: 'lisianthus',
      src: 'https://images.pexels.com/photos/34978903/pexels-photo-34978903.jpeg',
      credit: 'Photo: Maison Lighthouse / Pexels',
      alt: '초록 줄기 끝마다 봉오리를 단 흰 리시안셔스',
      width: 3769,
      variant: '흰빛',
    },
  ],
  ranunculus: [
    {
      flowerId: 'ranunculus',
      src: 'https://images.unsplash.com/photo-1742341383956-ae09c07675a3',
      credit: 'Photo: Pedro Vit / Unsplash',
      alt: '검은 배경 위 겹꽃잎이 촘촘한 분홍 라넌큘러스',
      width: 7002,
      note: '대표컷과 같은 작가·같은 셋업 — 종 근거를 공유한다.',
      variant: '분홍빛',
    },
    {
      flowerId: 'ranunculus',
      src: 'https://images.pexels.com/photos/7409640/pexels-photo-7409640.jpeg',
      credit: 'Photo: Albina White / Pexels',
      alt: '검은 배경 위에 한 송이만 핀 흰 라넌큘러스와 봉오리',
      width: 3820,
      variant: '흰빛',
    },
    {
      flowerId: 'ranunculus',
      src: 'https://images.pexels.com/photos/38566138/pexels-photo-38566138.jpeg',
      credit: 'Photo: Siegfried Poepperl / Pexels',
      alt: '검은 배경 위 흰 꽃잎마다 붉은 테가 번진 라넌큘러스',
      width: 5504,
      variant: '붉은 테두리',
    },
  ],
  'lily-of-the-valley': [
    {
      flowerId: 'lily-of-the-valley',
      src: 'https://images.unsplash.com/photo-1683547049214-b30698e79dc5',
      credit: 'Photo: Julia Butsykina / Unsplash',
      alt: '짙은 초록 잎 사이로 늘어진 흰 은방울꽃 꽃대',
      width: 3456,
      variant: '잎 사이',
    },
  ],
  chrysanthemum: [
    {
      flowerId: 'chrysanthemum',
      src: 'https://images.unsplash.com/photo-1618927483829-2d16941299e8',
      credit: 'Photo: Олександр К / Unsplash',
      alt: '검은 배경 위 가느다란 꽃잎이 겹겹이 선 흰 국화',
      width: 4424,
      note: '종명이 문자로 없는 정황 근거 — 국화 검색 둘에서 모두 상위였다(문서 §대체안).',
      variant: '흰빛',
    },
    {
      flowerId: 'chrysanthemum',
      src: 'https://images.pexels.com/photos/17239995/pexels-photo-17239995.jpeg',
      credit: 'Photo: Wyxina Tresse / Pexels',
      alt: '어두운 배경 위 물방울이 맺힌 보라 국화 두 송이',
      width: 6960,
      variant: '보랏빛',
    },
  ],
  narcissus: [
    {
      flowerId: 'narcissus',
      src: 'https://images.pexels.com/photos/36679109/pexels-photo-36679109.jpeg',
      credit: 'Photo: Siegfried Poepperl / Pexels',
      alt: '어두운 배경 앞에 나팔 부화관을 세운 노란 수선화 한 송이',
      width: 7200,
      note: '길게 뻗은 나팔 부화관 = N. pseudonarcissus 계열(CSV 학명과 일치).',
      variant: '노란빛',
    },
  ],
  'forget-me-not': [
    {
      flowerId: 'forget-me-not',
      src: 'https://images.unsplash.com/photo-1622483327420-667f2913c907',
      credit: 'Photo: Jean-Yves Matroule / Unsplash',
      alt: '어두운 초록 배경 앞 노란 화심을 가진 하늘색 물망초 두 송이 매크로',
      width: 3904,
      // 대표컷은 배경 풀잎이 밝다 — 이 컷이 그 짝의 어두운 쪽이다(문서 §대체안).
      note: '속(Myosotis)까지 확인 — 대표컷과 달리 배경이 어둡다.',
      variant: '가까이',
    },
  ],
  'cherry-blossom': [
    {
      flowerId: 'cherry-blossom',
      src: 'https://images.unsplash.com/photo-1615632427664-f7444e047182',
      credit: 'Photo: Takashi Miyazaki / Unsplash',
      alt: '검은 배경 앞 가지에 줄지어 핀 연분홍 벚꽃',
      width: 5568,
      // 짙은 자주 잎과 함께 피는 자엽자두(Prunus cerasifera)는 이번에도 배제했다.
      note: '순수 검정 배경 컷(문서 §대체안). 초록 잎·갈라진 꽃잎으로 벚나무를 확인했다.',
      variant: '연분홍빛',
    },
  ],
  camellia: [
    {
      flowerId: 'camellia',
      src: 'https://images.unsplash.com/photo-1708183704955-da3601e1fc04',
      credit: 'Photo: Annie Spratt / Unsplash',
      alt: '노란 수술 뭉치가 드러난 붉은 동백 클로즈업',
      width: 8256,
      // 대표컷(3032px)이 이 표에서 가장 작다 — 크게 걸 자리에는 이 컷이 여유가 있다.
      note: '종 근거는 태그 `camellia` 수준. 학명 명기는 대표컷 쪽에만 있다(문서 §대체안).',
      variant: '가까이',
    },
  ],
  violet: [
    {
      flowerId: 'violet',
      src: 'https://images.pexels.com/photos/19632845/pexels-photo-19632845.jpeg',
      credit: 'Photo: Petr Ganaj / Pexels',
      alt: '초록 풀 사이에 홀로 핀 연보라 제비꽃 한 송이',
      width: 4261,
      // 문서 §남은 판단 1 이 열어 둔 구멍을 메운다 — 대표컷은 속(Viola)까지만이었다.
      note: 'Pexels 설명에 "viola odorata" 명기 — CSV 학명과 일치한다.',
      variant: '연보랏빛',
    },
  ],
  iris: [
    {
      flowerId: 'iris',
      src: 'https://images.pexels.com/photos/32806170/pexels-photo-32806170.jpeg',
      credit: 'Photo: Oliver Wagenblatt / Pexels',
      alt: '검은 배경 위에 활짝 펼쳐진 진보라 아이리스 한 송이',
      width: 8192,
      note: '속(Iris)까지 — 수염이 없는 계열이라 수염붓꽃(bearded iris)은 아니다.',
      variant: '가까이',
    },
    {
      flowerId: 'iris',
      src: 'https://images.pexels.com/photos/11619585/pexels-photo-11619585.jpeg',
      credit: 'Photo: Aaron Burden / Pexels',
      alt: '흐린 배경 앞에 곧게 선 짙푸른 아이리스 한 송이',
      width: 2927,
      note: '속(Iris)까지 — 수염 없는 계열. CSV 의 Dutch iris 와 같은 무수염 무리다.',
      variant: '푸른빛',
    },
  ],
  marigold: [
    {
      flowerId: 'marigold',
      src: 'https://images.pexels.com/photos/34103630/pexels-photo-34103630.jpeg',
      credit: 'Photo: Mr. Pugo / Pexels',
      alt: '어두운 잎을 배경으로 활짝 벌어진 주황 마리골드 한 송이',
      width: 4000,
      variant: '한 송이',
    },
    {
      flowerId: 'marigold',
      src: 'https://images.pexels.com/photos/5445090/pexels-photo-5445090.jpeg',
      credit: 'Photo: Medina Loh / Pexels',
      alt: '겹겹이 말린 주황 꽃잎이 화면을 가득 채운 마리골드 매크로',
      width: 3024,
      // 노란 금잔화(Calendula)가 마리골드 검색에 섞여 든다 — 속이 다르다.
      note: '속(Tagetes)까지 확인 — 금잔화(Calendula)는 배제했다.',
      variant: '겹꽃 속',
    },
  ],
  'corn-poppy': [
    {
      flowerId: 'corn-poppy',
      src: 'https://images.unsplash.com/photo-1606952460453-3b7edc2f67a7',
      credit: 'Photo: Eduardo Goody / Unsplash',
      alt: '어두운 배경 위에 홀로 벌어진 붉은 개양귀비 클로즈업',
      width: 6016,
      // 2026-08-15 대표컷이었다가 종 확실성 때문에 내려온 컷이다(문서 §통합 상태).
      note: '종명이 문자로 없는 정황 동정 — 대표컷 쪽이 "common poppy" 로 명시돼 있다.',
      variant: '가까이',
    },
  ],
  jasmine: [
    {
      flowerId: 'jasmine',
      src: 'https://images.pexels.com/photos/34677051/pexels-photo-34677051.jpeg',
      credit: 'Photo: Louis Tran / Pexels',
      alt: '검은 배경 위에 둥글게 모여 핀 흰 겹꽃 재스민 한 다발',
      width: 4624,
      note: '대표컷과 같은 촬영분 — 종 근거를 공유한다(겹꽃 로제트 = J. sambac 겹꽃 계열).',
      variant: '한 다발',
    },
  ],
  'babys-breath': [
    {
      flowerId: 'babys-breath',
      src: 'https://images.pexels.com/photos/6064918/pexels-photo-6064918.jpeg',
      credit: 'Photo: Eva Bronzini / Pexels',
      alt: '검은 배경 위쪽에서 드리운 흰 안개꽃 잔가지',
      width: 3909,
      // 문서가 "다크 배경 무료 컷 중 실제 Gypsophila 를 못 찾았다" 고 적어 둔 구멍을 메운다.
      note: '어두운 배경의 실제 Gypsophila — 대표컷이 밝은 컷일 수밖에 없던 이유를 이 컷이 푼다.',
      variant: '어둠 속',
    },
  ],
  cosmos: [
    {
      flowerId: 'cosmos',
      src: 'https://images.unsplash.com/photo-1739308759028-c22d926c3634',
      credit: 'Photo: Seven Colors / Unsplash',
      alt: '깃털처럼 갈라진 잎과 함께 핀 연분홍 코스모스 한 송이',
      width: 4288,
      note: '깃꼴로 갈라진 잎이 함께 보여 C. bipinnatus 근거가 한 단 더 있다(문서 §대체안).',
      variant: '잎까지',
    },
    {
      flowerId: 'cosmos',
      src: 'https://images.pexels.com/photos/14675701/pexels-photo-14675701.jpeg',
      credit: 'Photo: Niki Emmert / Pexels',
      alt: '노란 화심을 가운데 둔 흰 코스모스 한 송이',
      width: 6000,
      note: 'Pexels 설명에 "Cosmos bipinnatus" 명기 — CSV 학명과 일치한다.',
      variant: '흰빛',
    },
  ],
  magnolia: [
    {
      flowerId: 'magnolia',
      src: 'https://images.unsplash.com/photo-1525723479413-421d81fea02d',
      credit: 'Photo: Brendan Church / Unsplash',
      alt: '어두운 맨가지에 줄지어 벌어진 흰 별목련',
      width: 3648,
      note: '대표컷과 같은 별목련(M. stellata). 상록 잎이 함께 찍힌 컷은 종이 달라 배제했다.',
      variant: '가지 위',
    },
  ],
  pansy: [
    {
      flowerId: 'pansy',
      src: 'https://images.pexels.com/photos/28003582/pexels-photo-28003582.jpeg',
      credit: 'Photo: Wyxina Tresse / Pexels',
      alt: '어두운 잎을 배경으로 활짝 벌어진 짙은 보라 팬지',
      width: 4640,
      variant: '보랏빛',
    },
    {
      flowerId: 'pansy',
      src: 'https://images.pexels.com/photos/4611318/pexels-photo-4611318.jpeg',
      credit: 'Photo: Magda Ehlers / Pexels',
      alt: '어두운 흙 위에 놓인, 노랑과 진자주가 갈라지는 팬지',
      width: 3648,
      variant: '노란빛',
    },
  ],
  poinsettia: [
    {
      flowerId: 'poinsettia',
      src: 'https://images.pexels.com/photos/5947869/pexels-photo-5947869.jpeg',
      credit: 'Photo: Eva Bronzini / Pexels',
      alt: '초록 잎 사이에서 별처럼 펼쳐진 흰 포인세티아 포엽',
      width: 6000,
      variant: '흰빛',
    },
    {
      flowerId: 'poinsettia',
      src: 'https://images.pexels.com/photos/5947770/pexels-photo-5947770.jpeg',
      credit: 'Photo: Eva Bronzini / Pexels',
      alt: '연분홍으로 물든 포인세티아 포엽 한 송이',
      width: 6000,
      variant: '분홍빛',
    },
  ],
  daisy: [
    {
      flowerId: 'daisy',
      src: 'https://images.unsplash.com/photo-1647808713955-64685f28f728',
      credit: 'Photo: Pierre Bamin / Unsplash',
      alt: '어두운 풀밭을 배경으로 홀로 고개 든 흰 데이지',
      width: 5472,
      variant: '한 송이',
    },
  ],
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

/** 채택 소스의 식별자. `credit` 꼬리표와 폭 치환 규칙이 여기에 묶인다. */
export type PhotoSourceId = 'unsplash' | 'pexels' | 'wikimedia';

interface PhotoSourceRule {
  readonly id: PhotoSourceId;
  /** 이 소스인지 가리는 주소 접두사. */
  readonly prefix: string;
  /** `credit` 문자열의 꼬리표 — `Photo: {작가} / {label}`. */
  readonly label: string;
  /**
   * 그 폭의 주소를 만든다. **`null` 이면 이 소스는 임의 폭을 못 받는다** —
   * 그때는 원본 주소 한 벌만 쓴다(아래 위키미디어 주석).
   */
  readonly sized: ((src: string, width: number) => string) | null;
}

/**
 * 소스별 폭 치환 규칙 — **여기가 유일한 자리**다. 새 소스를 늘릴 때 이 표에만 줄을 더한다.
 *
 * 세 소스의 CDN 이 서로 다르게 동작한다는 것이 이 표가 있는 이유다:
 *   · **Unsplash**(imgix) — 임의 폭 + `auto=format` 으로 WebP/AVIF 자동 협상까지 해 준다.
 *   · **Pexels** — 임의 폭은 받지만 포맷 협상 키가 다르다(`auto=compress&cs=tinysrgb`).
 *     `fm=` 같은 imgix 키는 없다 — 그래서 `q=` 도 넣지 않는다(무시되고 캐시 키만 갈라진다).
 *   · **Wikimedia Commons** — **임의 폭을 못 받는다.** 썸네일은 미리 정해진 폭에만 존재하고
 *     그 밖의 폭은 `HTTP 400` 이다(2026-08-16 실측: 같은 파일이 1280px 는 200, 640·1080·
 *     1600·2560px 는 전부 400). 우리가 쓰는 네 폭 중 **하나도 통과하지 못한다.** 게다가
 *     위키미디어는 핫링크 자체를 만류한다(연속 요청에 429 — 도판을 내려받아 두는 이유).
 *     그래서 규칙은 `null` 이고, 이번 라운드 채택분도 0장이다(문서 §확장 소스 풀).
 */
const PHOTO_SOURCES: readonly PhotoSourceRule[] = [
  {
    id: 'unsplash',
    prefix: 'https://images.unsplash.com/',
    label: 'Unsplash',
    sized: (src, width) => `${src}?auto=format&fit=crop&w=${width}&q=80`,
  },
  {
    id: 'pexels',
    prefix: 'https://images.pexels.com/',
    label: 'Pexels',
    sized: (src, width) => `${src}?auto=compress&cs=tinysrgb&fit=crop&w=${width}`,
  },
  {
    id: 'wikimedia',
    prefix: 'https://upload.wikimedia.org/',
    label: 'Wikimedia Commons',
    sized: null,
  },
];

function ruleFor(src: string): PhotoSourceRule | undefined {
  return PHOTO_SOURCES.find((rule) => src.startsWith(rule.prefix));
}

/** 이 컷이 어느 소스에서 왔는가. 모르는 주소면 undefined. */
export function photoSource(photo: FlowerPhoto): PhotoSourceId | undefined {
  return ruleFor(photo.src)?.id;
}

/** `credit` 이 달아야 하는 꼬리표(`Photo: {작가} / {label}`). 모르는 주소면 undefined. */
export function photoSourceLabel(photo: FlowerPhoto): string | undefined {
  return ruleFor(photo.src)?.label;
}

/**
 * 그 폭의 이미지 주소.
 *
 * 폭 파라미터의 모양은 소스마다 다르다 — `PHOTO_SOURCES` 가 그 차이를 들고 있다.
 * 폭을 못 받는 소스(위키미디어)와 모르는 주소는 **원본을 그대로 돌려준다**(깨뜨리지 않는다).
 */
export function photoSrc(photo: FlowerPhoto, width: PhotoWidth = 1080): string {
  const rule = ruleFor(photo.src);
  if (!rule?.sized) return photo.src;
  return rule.sized(photo.src, width);
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
 *
 * ⚠ **폭을 못 받는 소스**(위키미디어)와 모르는 주소는 후보가 한 벌뿐이다. 그때 `640w, 1080w`
 *   를 붙이면 **같은 그림에 거짓 폭을 신고**하는 꼴이라, 브라우저가 640 자리에 원본을 받아
 *   놓고 1080 이 필요해지면 또 받는다. 그래서 그 경우에는 **디스크립터 없이 한 줄만** 낸다
 *   (`srcset="…jpg"` 는 1x 후보 하나로 유효하다).
 */
export function photoSrcSet(
  photo: FlowerPhoto,
  widths: readonly PhotoWidth[] = [640, 1080],
): string {
  const rule = ruleFor(photo.src);
  if (!rule?.sized) return photo.src;
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
 * 그 꽃의 **컷 전부** — 도감 갤러리가 넘겨 보는 순서 그대로다(2~4장).
 *
 * ⚠ **`[0]` 은 언제나 `photoFor()` 와 같은 컷이다.** 이건 성능이나 취향이 아니라 화면의
 *   약속이다 — 랜딩 카드를 누르고 들어온 사람이 방금 본 사진이 상세의 첫 장이어야
 *   두 화면이 한 꽃을 가리킨다는 것이 눈으로 읽힌다(2026-08-16 사용자 확정).
 *   그 약속을 **구조로** 지킨다: 대표는 `FLOWER_PHOTOS` 에서 오고 나머지는
 *   `GALLERY_EXTRAS` 에서 온다 — 순서를 뒤집을 자리가 아예 없다.
 *   (그래도 `tests/components/photos.test.ts` 가 한 번 더 못 박는다. 표 두 개를 합치려는
 *    다음 사람에게 그물이 필요하다.)
 *
 * 첫 장에는 대표컷의 색 라벨(`PRIMARY_VARIANT`)을 얹어 준다 — 갤러리에서만 뜻이 있는
 * 값이라 원본 상수에는 두지 않는다(`FlowerPhoto.variant` 주석).
 *
 * 컷이 없는 꽃이면 빈 배열이다(`photoFor()` 의 undefined 와 짝을 맞춘다).
 */
export function photosFor(flowerId: string): FlowerPhoto[] {
  const primary = photoFor(flowerId);
  if (!primary) return [];

  const label = PRIMARY_VARIANT[flowerId];
  const head = label ? { ...primary, variant: label } : primary;
  return [head, ...(GALLERY_EXTRAS[flowerId] ?? [])];
}

/**
 * 배경이 밝아 **카드에서 다크 오버레이가 필요한** 컷인가(문서 §주의 4).
 * 지금은 `lavender` `babys-breath` `lily-of-the-valley` `forget-me-not` 넷이다
 * (2026-08-16 재검토에서 `violet` 이 빠지고 `forget-me-not` 이 들어왔다 — `BRIGHT_BACKGROUND` 주석).
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

/** 크레딧 한 줄 — 이미 `Photo: {작가} / {소스}` 형식으로 완성돼 있다(소스는 Unsplash·Pexels). */
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
