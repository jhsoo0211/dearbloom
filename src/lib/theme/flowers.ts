/**
 * 꽃-테마 5종 — "꽃이 테마를 구동한다" (design-spec §1.4c v3.1).
 *
 * 색을 따로 고르는 게 아니라 **맨 위 꽃(오늘의 꽃)이 바뀌면 컨셉 컬러가 따라 바뀐다.**
 * 실제 색값은 `src/app/globals.css` 의 `[data-flower="…"]` 변수 세트가 갖고 있고,
 * 이 파일은 **꽃의 정체(이름·꽃말·사진·스위치용 스와치)** 를 담는 단일 원본이다.
 * 화면은 `<html data-flower={slug}>` 를 바꾸는 것으로 테마를 전환한다.
 *
 * 순수 데이터만 둔다 — 서버·클라이언트 어디서든 import 할 수 있어야 하므로
 * fs·엔진·React 의존을 넣지 마라.
 *
 * 이미지는 `docs/image-assets.md` 승인 목록의 direct URL 만 쓴다(번호를 함께 적어 둔다).
 * 16번(매거진풍 어레인지)은 붉은 기가 있어 **히어로 금지 + 그레이딩 필수**다.
 */

/** 테마 slug = `<html data-flower>` 값 = 칩의 식별자. */
export type FlowerThemeSlug = 'tulip' | 'lily' | 'freesia' | 'anemone' | 'hellebore';

/** 이 테마가 밝은 바탕인지 어두운 바탕인지. 라이트는 백합 하나뿐이다. */
export type FlowerThemeScheme = 'dark' | 'light';

export interface FlowerThemeImage {
  /** docs/image-assets.md 의 채택 번호. 승인 목록 밖 이미지는 쓰지 않는다. */
  assetNo: number;
  /** 데스크톱용 direct URL. */
  src: string;
  /** 모바일(4:5) 대체 URL. 카드용 이미지는 원본 하나로 충분해 비워 둔다. */
  srcMobile?: string;
  alt: string;
  /** `Photo: {작가} / Unsplash` — 표기 형식 고정(image-assets.md 사용 규칙 2). */
  credit: string;
  /** 팔레트 밖 색을 눌러야 하는 컷에만 붙는 CSS filter 값. */
  grade?: string;
}

export interface FlowerTheme {
  slug: FlowerThemeSlug;
  /** 화면에 그대로 노출되는 이름. */
  nameKo: string;
  /** 학명(세리프로 작게 붙는 보조 표기). */
  latin: string;
  scheme: FlowerThemeScheme;
  /**
   * `content/flowers.csv` 의 꽃 id. 오늘의 꽃을 실데이터(꽃말·안전 정보)와 잇는 열쇠다.
   *
   * ⚠ lily 는 시안이 흰 백합(Lilium candidum)인데 카탈로그에는 아시아틱 백합
   * (`lily-asiatic`, Lilium hybridum)만 있다. 같은 백합류라 안전 정보(반려묘 위험)는
   * 그대로 유효하지만 **품종이 다르므로 실데이터 연결 시 편집 판단이 필요하다.**
   */
  catalogFlowerId: string;
  /** `<meta name="theme-color">` 값 = 그 테마의 기본 배경. */
  themeColor: string;
  /**
   * 팔레트 키 — globals.css 의 `[data-flower]` 세트가 실제로 쓰는 색.
   * 여기 값은 "이 테마가 무슨 색인지" 를 JS 쪽에서 알아야 할 때(칩 스와치·3D 틴트 등)
   * 참조하는 사본이며, 화면 스타일링은 CSS 변수를 쓴다.
   */
  palette: {
    /** 기본 배경 (--bg). */
    base: string;
    /** 보조 배경 (--bg-2). */
    baseAlt: string;
    /** 그 테마의 성격을 드러내는 색면 (--bg-3). */
    tone: string;
    /** 강조 텍스트·라인 (--accent). */
    accent: string;
    /** 주 CTA 배경 (--cta-bg). */
    cta: string;
  };
  /** 꽃말 한 줄(주인공 문장). */
  meaning: string;
  /** 꽃말에 붙는 설명 한 줄. */
  note: string;
  /** 신뢰 라벨 — 어디까지 확인된 이야기인지 그대로 말한다. */
  sourceLabel: string;
  /** 안전 각주. 반려동물 주의가 필요한 꽃에만 붙는다. */
  caveat?: string;
  /** 히어로 배경(풀스크린). */
  hero: FlowerThemeImage;
  /**
   * 오늘의 꽃 카드 사진.
   *
   * ⚠ 카드는 화면에서 **380px(좁은 화면 340px)** 로 뜬다 — `w=1920` 은 레티나 기준으로도
   *   두 배 넘는 과발주였다(성능 리뷰 P1-4). 카드용 최대 폭은 **1080**(2배)으로 못 박는다.
   *   더 작은 후보(640)는 `photos/unsplashSrcSet()` 이 srcset 으로 함께 내보낸다.
   */
  card: FlowerThemeImage;
}

/**
 * 꽃-테마 5종. 배열 순서가 곧 칩·로테이션 순서다(기본값은 첫 번째).
 * 꽃말·라벨 문구는 design-spec §1.4c 표와 확정 시안(design/landing-v3)에서 옮겼다.
 */
export const FLOWER_THEMES: readonly FlowerTheme[] = [
  {
    slug: 'tulip',
    nameKo: '흰 튤립',
    latin: 'Tulipa gesneriana',
    scheme: 'dark',
    catalogFlowerId: 'tulip-white',
    themeColor: '#0B0C0A',
    palette: {
      base: '#0B0C0A',
      baseAlt: '#141613',
      tone: '#1B2C21',
      accent: '#C8963E',
      cta: '#F6F1E8',
    },
    meaning: '용서, 새로운 시작, 진심',
    note: '빅토리아 시대의 꽃말 이야기와 오늘의 플로리스트가 같은 뜻으로 이어 전하는 꽃이에요.',
    sourceLabel: '두 갈래로 전해지는 이야기',
    // §1.4c — 튤립에도 각주를 붙인다. 백합에만 붙으면 안전 정보가 편향돼 보인다.
    caveat: '반려동물이 있다면 잎과 알뿌리는 조심해 주세요.',
    hero: {
      assetNo: 1,
      src: 'https://images.unsplash.com/photo-1692520883599-d543cfe6d43d?auto=format&fit=crop&w=2560&h=1440&q=80',
      srcMobile:
        'https://images.unsplash.com/photo-1692520883599-d543cfe6d43d?auto=format&fit=crop&w=1440&h=1800&q=80',
      alt: '어둠에 잠긴 초록 잎 군락',
      credit: 'Photo: Spruce / Unsplash',
    },
    card: {
      assetNo: 5,
      src: 'https://images.unsplash.com/photo-1772724718360-58108ae57433?auto=format&fit=crop&w=1080&q=80',
      alt: '어둠 속에서 조명을 받은 흰 튤립 한 송이',
      credit: 'Photo: Liana S / Unsplash',
    },
  },
  {
    slug: 'lily',
    nameKo: '흰 백합',
    latin: 'Lilium candidum',
    scheme: 'light',
    catalogFlowerId: 'lily-asiatic',
    themeColor: '#F6F1E8',
    palette: {
      base: '#F6F1E8',
      baseAlt: '#FBF9F4',
      tone: '#F1EADC',
      accent: '#263B2E',
      cta: '#263B2E',
    },
    meaning: '순수, 그리고 다시 피는 마음',
    note: '흰 백합을 순수와 다시 피어남으로 읽는 이야기는 오래도록 되풀이돼 왔어요.',
    sourceLabel: '오래, 두루 전해지는 꽃말',
    // §1.4c — 백합 테마는 반려묘 각주가 필수다.
    caveat: '반려묘가 있는 집이라면 백합은 피해주세요. 고양이에게는 적은 양도 위험한 꽃이에요.',
    hero: {
      assetNo: 3,
      src: 'https://images.unsplash.com/photo-1768243243786-721dab163e7f?auto=format&fit=crop&w=2560&h=1440&q=80',
      srcMobile:
        'https://images.unsplash.com/photo-1768243243786-721dab163e7f?auto=format&fit=crop&w=1440&h=1800&q=80',
      alt: '흰 백합과 어두운 잎으로 짠 어레인지',
      credit: 'Photo: Evie S. / Unsplash',
    },
    card: {
      assetNo: 13,
      src: 'https://images.unsplash.com/photo-1782884239672-ece5cc51e528?auto=format&fit=crop&w=1080&h=1350&q=80',
      alt: '어두운 배경의 유리 화병에 꽂힌 흰 백합 여러 송이',
      credit: 'Photo: Little Annabell / Unsplash',
    },
  },
  {
    slug: 'freesia',
    nameKo: '프리지아',
    latin: 'Freesia × hybrida',
    scheme: 'dark',
    catalogFlowerId: 'freesia',
    themeColor: '#141613',
    palette: {
      base: '#141613',
      baseAlt: '#0B0C0A',
      tone: '#1B2C21',
      accent: '#C8963E',
      // 원색 #C8963E 배경 위 텍스트는 §1.4 에서 금지 — CTA 는 Gold Deep 셰이드로 내린다.
      cta: '#8A672B',
    },
    meaning: '새로운 시작, 우정',
    note: '흰 프리지아를 먼저 권해요. 봄에 가장 흔하고, 고양이·강아지에게도 안전한 꽃이에요.',
    sourceLabel: '오래, 두루 전해지는 꽃말',
    hero: {
      assetNo: 2,
      src: 'https://images.unsplash.com/photo-1533563906091-fdfdffc3e3c4?auto=format&fit=crop&w=2560&h=1440&q=80',
      srcMobile:
        'https://images.unsplash.com/photo-1533563906091-fdfdffc3e3c4?auto=format&fit=crop&w=1440&h=1800&q=80',
      alt: '순수한 검정 배경 위에 놓인 고사리 잎',
      credit: 'Photo: Kendal / Unsplash',
    },
    card: {
      assetNo: 15,
      src: 'https://images.unsplash.com/photo-1590791211964-cb77c1e61a3d?auto=format&fit=crop&w=1080&q=80',
      alt: '어두운 배경에 놓인 흰 꽃과 초록 잎',
      credit: 'Photo: Christina / Unsplash',
    },
  },
  {
    slug: 'anemone',
    nameKo: '아네모네',
    latin: 'Anemone coronaria',
    scheme: 'dark',
    catalogFlowerId: 'anemone',
    themeColor: '#141613',
    palette: {
      base: '#141613',
      baseAlt: '#0B0C0A',
      tone: '#5C2230',
      // 다크 배경에서 Wine Rose 원색은 본문 금지(§1.4) — 틴트를 강조색으로 쓴다.
      accent: '#C98A9B',
      cta: '#8A3448',
    },
    meaning: '기다림, 그리고 진심',
    note: '빅토리아 시대에는 ‘기다림’으로 읽혔고, 요즘은 색에 따라 다르게 풀이돼요.',
    sourceLabel: '색상·문화권에 따라 해석이 달라요',
    hero: {
      assetNo: 11,
      src: 'https://images.unsplash.com/photo-1722069596548-9128d1921810?auto=format&fit=crop&w=2560&h=1440&q=80',
      srcMobile:
        'https://images.unsplash.com/photo-1722069596548-9128d1921810?auto=format&fit=crop&w=1440&h=1800&q=80',
      alt: '검정 배경 위로 방사형으로 퍼지는 꽃 클로즈업',
      credit: 'Photo: Sies Kranen / Unsplash',
      // 원본에 푸른 기가 있다 — 팔레트 밖 파랑이 남지 않게 저채도로 눌러 쓴다.
      grade: 'saturate(.26) brightness(.84) contrast(1.06)',
    },
    card: {
      assetNo: 16,
      src: 'https://images.unsplash.com/photo-1634771141792-12c6a8df9103?auto=format&fit=crop&w=1080&q=80',
      alt: '어둠 속 자줏빛이 도는 꽃 어레인지',
      credit: 'Photo: Margaret Jaszowska / Unsplash',
      // image-assets.md 16번 — 붉은 기 그레이딩 필수, 히어로에는 쓰지 않는다.
      grade: 'saturate(.5) hue-rotate(-12deg) brightness(.98)',
    },
  },
  {
    slug: 'hellebore',
    nameKo: '헬레보어',
    latin: 'Helleborus orientalis',
    scheme: 'dark',
    catalogFlowerId: 'hellebore',
    themeColor: '#141613',
    palette: {
      base: '#141613',
      baseAlt: '#0B0C0A',
      tone: '#4A4160',
      // 원색 #83779C 는 다크 위 4.4:1 로 본문 미달 — 라벤더 틴트를 쓴다.
      accent: '#A99CC2',
      cta: '#4A4160',
    },
    meaning: '위로, 그리고 평온',
    note: '한겨울에 피는 꽃이에요. 위로·평온이라는 풀이는 아직 드물게 전해져 참고만 해주세요.',
    sourceLabel: '드물게 전해지는 이야기예요',
    hero: {
      assetNo: 4,
      src: 'https://images.unsplash.com/photo-1518343161123-c7e9ab4dc4da?auto=format&fit=crop&w=2560&h=1440&q=80',
      srcMobile:
        'https://images.unsplash.com/photo-1518343161123-c7e9ab4dc4da?auto=format&fit=crop&w=1440&h=1800&q=80',
      alt: '어두운 배경에 놓인 헬레보어, 탁한 자줏빛',
      credit: 'Photo: Annie Spratt / Unsplash',
    },
    card: {
      assetNo: 10,
      src: 'https://images.unsplash.com/photo-1769445919416-f66fcc827056?auto=format&fit=crop&w=1080&h=1080&q=80',
      alt: '검정 배경 위로 고개를 숙인 흰 꽃 한 송이',
      credit: 'Photo: Dario Ghisini / Unsplash',
    },
  },
];

/** 기본 테마 — 나이트 보태니컬(흰 튤립). */
export const DEFAULT_FLOWER_THEME: FlowerTheme = FLOWER_THEMES[0];

/** slug 목록. `<html data-flower>` 에 들어갈 수 있는 값 전부. */
export const FLOWER_THEME_SLUGS: readonly FlowerThemeSlug[] = FLOWER_THEMES.map(
  (theme) => theme.slug,
);

/** slug → 테마. 모르는 slug 면 undefined (호출부가 기본값을 고르게 둔다). */
export function findFlowerTheme(slug: string): FlowerTheme | undefined {
  return FLOWER_THEMES.find((theme) => theme.slug === slug);
}

/** slug → 테마. 모르는 slug 면 기본 테마로 떨어진다. */
export function getFlowerTheme(slug: string | undefined): FlowerTheme {
  if (slug === undefined) return DEFAULT_FLOWER_THEME;
  return findFlowerTheme(slug) ?? DEFAULT_FLOWER_THEME;
}

/** 오늘의 꽃 로테이션에서 다음 꽃. 마지막이면 처음으로 돌아온다. */
export function nextFlowerTheme(slug: FlowerThemeSlug): FlowerTheme {
  const index = FLOWER_THEMES.findIndex((theme) => theme.slug === slug);
  return FLOWER_THEMES[(index + 1) % FLOWER_THEMES.length];
}
