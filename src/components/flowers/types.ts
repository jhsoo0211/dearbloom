/**
 * 꽃 도감(`/flowers`)이 주고받는 모양 — **서버가 확정해 클라이언트로 내려보내는 값**.
 *
 * `/stories` 와 같은 규칙이다: 라벨 사전도 엔진도 클라이언트로 넘기지 않는다.
 * 한국어 문구·카테고리·검색 색인까지 전부 서버에서 만들어 문자열로 실어 보낸다
 * (어휘가 늘면 서버 파일 하나만 따라가면 된다).
 *
 * ⚠ 순수 타입만 둔다. 값(상수·함수)을 여기 두면 클라이언트 번들에 섞인다 —
 *   상수는 `category.ts`(순수 데이터)로, 계산은 `data.ts`(서버)로 간다.
 */

import type { LiteratureView } from '@/components/flow/types';
import type { MetaNote } from '@/components/stories/meta';
import type { ThemeCategory } from '@/components/landing/landing-data';
import type { BirthPhotoView } from '@/lib/birth-photos/view';

export type { ThemeCategory };

/**
 * §1.5k 문학 발췌 한 편 — **결과 화면과 같은 모양을 그대로 쓴다**(`flow/types.ts`).
 *
 * 도감이 제 타입을 따로 세우지 않는 이유: 두 화면이 같은 `quotes.csv` 행을 같은 조판으로
 * 세우는데 모양만 둘이면, 한쪽에 필드가 늘어난 날 다른 쪽은 조용히 옛 모양으로 남는다.
 * 여기서 가리키고 있으면 그날 타입 검사가 먼저 걸린다.
 */
export type { LiteratureView };

/* ------------------------------------------------------------------ *
 * 목록·검색 (`/flowers`)
 * ------------------------------------------------------------------ */

/** 검색 결과 카드 한 장 = 꽃 한 종의 요약. */
export interface FlowerSummary {
  /** = `content/flowers.csv` 의 id. 그대로 상세 경로가 된다(`/flowers/{slug}`). */
  slug: string;
  nameKo: string;
  /** 비어 있을 수 있다(CSV 의 name_en 은 선택). */
  nameEn: string;
  scientificName: string;
  category: ThemeCategory;
  categoryLabel: string;
  /** 대표 꽃말 한 줄. 카드에 한 줄만 세운다. */
  meaning: string;
  /** 그 꽃에 쌓인 이야기 편수. */
  storyCount: number;
  /**
   * 검색 색인 — 이름 세 가지(한국어·영문·학명)를 **정규화해 이어 붙인 문자열**.
   * 대소문자·공백·하이픈·`×` 를 지운 형태라 질의도 같은 함수를 통과시켜 비교한다.
   */
  haystack: string;
}

/** 카테고리 한 묶음(§1.4c v3.2 테마 카테고리 5종). */
export interface FlowerGroup {
  category: ThemeCategory;
  /** 계열 이름(`숲빛` `상아빛` …) — `/stories` 필터 칩과 같은 말이다. */
  label: string;
  /** 어떤 색 계열이 모이는 칸인지 한 줄(§1.4c v3.2 배정 규칙). */
  hint: string;
  flowers: FlowerSummary[];
}

/** `/flowers` 한 페이지 분량. */
export interface FlowerIndexData {
  flowers: FlowerSummary[];
  groups: FlowerGroup[];
  /** 인트로 숫자 — 실데이터를 그대로 센다. */
  meaningCount: number;
  storyCount: number;
  /**
   * 생일 꽃 찾기의 **일 셀렉트가 쓸 달력** — `[0]` 이 1월, 값은 그 달의 마지막 날이다.
   * 표에서 직접 센 값이라(`birthCalendar`) 2월은 29 다 — 2월 29일도 실재하는 생일이다.
   */
  birthCalendar: number[];
  /**
   * 인트로 통계가 **2단 티어**를 말할 때 쓰는 두 숫자(§1.5m ⑤).
   *
   * `flowers.length`(정식 도감) 옆에 이것이 서야 "꽃이 32종뿐인가" 라는 오해가 풀린다.
   * 둘 다 표에서 직접 센다 — 366 과 303 을 상수로 베껴 두면 표가 늘 때 화면만 옛말을 한다.
   */
  birthDayCount: number;
  birthSpeciesCount: number;
}

/* ------------------------------------------------------------------ *
 * 생일 꽃 찾기 (`/flowers` — 서버 액션 `lookupBirthFlower` 의 응답)
 * ------------------------------------------------------------------ */

/**
 * 그 날짜의 탄생화 한 장.
 *
 * ⚠ **워딩 대전제**(`docs/birth-flowers-research.md` §2·§8): 이 표는 전통적으로 정해진
 *   탄생화가 **아니다.** 하루 한 종씩 꽃을 소개하던 페이지에서 퍼져 널리 통하게 된 목록이다.
 *   화면에 "전통"·"공식"·"예로부터 정해진" 류 단정을 쓰지 마라 — 계보 각주(`sourceNote`)가
 *   그 자리를 대신한다.
 */
export interface BirthFlowerView {
  /** `3월 21일`. */
  dateLabel: string;
  nameKo: string;
  /** 표가 영문명을 적어 둔 날만. */
  nameEn?: string;
  /** 표가 학명을 적어 둔 날만. 영문명과 둘 중 하나만 있는 날이 많다. */
  scientificName?: string;
  meaning: string;
  /** 꽃말 뒤 서술격 조사(`이에요` / `예요`). 따옴표가 끼는 자리라 서버가 정한다. */
  meaningCopula: string;
  /**
   * 도감에 그 꽃이 있을 때만 — 상세 경로와 **도감 쪽 이름**.
   * 표 이름(`노랑수선화`)과 도감 이름(`수선화`)이 다를 수 있어 둘 다 싣는다.
   * 없으면 화면은 "도감에는 아직 없는 꽃이에요" 쪽으로 간다(280일이 그렇다).
   */
  link?: { href: string; nameKo: string };
  /**
   * 그 날짜의 실사 한 장 — 카드가 썸네일(320)로 건다. 366일 중 274일에 있다.
   *
   * ⚠ **크레딧 한 벌이 통째로 온다**(저작자·라이선스 라벨·파일 페이지). 이 카드는 시트가
   *   아니라 그 자리에서 끝나는 화면이라, 크레딧을 여기서 달지 않으면 CC BY-SA 사본을
   *   출처 없이 거는 셈이 된다. 사진만 뽑아 쓰고 크레딧을 떼지 마라.
   */
  photo?: BirthPhotoView;
}

/* ------------------------------------------------------------------ *
 * 탄생화 사전 (`/flowers` — 서버 액션 `listBirthMonth` 의 응답, §1.5m ⑤)
 * ------------------------------------------------------------------ */

/**
 * 사전 목록 한 줄 = 표의 하루.
 *
 * **행의 주인은 꽃이 아니라 날짜다**(`BirthFlower` 와 같은 이유). 같은 이름이 여러 날에
 * 걸리면 그 이름이 여러 줄로 선다 — 표가 실제로 그렇게 생겼고, 화면이 그것을 접어 버리면
 * "내 생일"로 찾아온 사람이 자기 날짜를 못 찾는다.
 *
 * ⚠ 이 줄은 **사전 티어**다. 정식 도감(32종)이 색깔별 꽃말·이야기·반려동물 안전성까지
 *   확인한 것과 달리, 여기 실린 것은 표가 적어 둔 **이름과 꽃말뿐**이다. 그 차이를 화면이
 *   말하게 하는 문구는 `birth-copy.ts` 에 있다(`BIRTH_DICT_TIER`). 지우지 마라.
 */
export interface BirthDictEntry {
  /** 그 달의 며칠. 목록 왼쪽에 선다(월은 구획 머리가 이미 말했다). */
  day: number;
  /** `3월 21일` — 시트가 쓴다. 목록은 `day` 만 쓴다. */
  dateLabel: string;
  nameKo: string;
  /** 표가 영문명을 적어 둔 날만(366일 중 277일). */
  nameEn?: string;
  /** 표가 학명을 적어 둔 날만(366일 중 89일). */
  scientificName?: string;
  meaning: string;
  /** 꽃말 뒤 서술격 조사(`이에요` / `예요`). 시트가 따옴표와 함께 쓴다. */
  meaningCopula: string;
  /**
   * 표가 **같은 이름으로** 부른 다른 날들 — `1월 2일 · 9월 5일`.
   * 그 하루뿐인 이름이면 키 자체가 없다 → 시트가 줄을 세우지 않는다.
   */
  alsoOn?: string;
  /**
   * 도감에 그 꽃이 있을 때만(366일 중 86일). 없는 것이 이 표의 정상 값이다.
   */
  link?: { href: string; nameKo: string };
  /**
   * 그 줄의 썸네일 **한 장**. 366일 중 274일에 있다(나머지는 점선 빈 액자).
   *
   * ── 두 티어가 한 칸을 나눠 쓴다 ────────────────────────────────────
   * 도감으로 이어지는 날은 **도감 대표컷**(원격 CDN 640px), 나머지는 자체 호스팅 320px
   * 사본이다. 필드를 둘로 나누지 않은 이유: 목록이 하는 일은 "이 줄의 그림 한 장"이고,
   * 어느 표에서 왔는지는 화면이 알 필요가 없다. 서버가 여기서 한 번 골라 두면 366줄에
   * 쓰지 않을 주소가 한 벌 더 얹히지도 않는다.
   * 고를 때 도감 쪽이 먼저인 이유는 이어짐이다 — 그 줄을 누르면 도감 상세로 가는데,
   * 거기서 만날 사진과 목록의 사진이 다르면 두 화면이 이어지지 않는다.
   *
   * ── 크레딧이 왜 여기 없나 ─────────────────────────────────────────
   * **주소 한 줄만 온다.** 저작자·라이선스는 그 줄을 눌러 열리는 시트가 단다
   * (`BirthDictDetail.photo`). 서른한 줄에 크레딧을 붙이면 목록이 크레딧 목록이 되고,
   * 44px 옆의 8pt 글씨는 읽히지도 않는다. 대신 **한 번의 탭으로 그 사진의 크레딧에 닿고**,
   * 목록의 줄과 시트가 1:1 이라 어느 사진의 출처인지 흐려지지 않는다
   * (CC BY-SA 의 "매체에 합당한 방식" 을 이 구조로 읽었다 — Advisor 판단 사항).
   */
  thumbSrc?: string;
  /** 표 출처. 시트에서만 링크로 선다. */
  sourceUrl: string;
  /** 그 출처를 사람이 읽는 이름(`한국화훼유통협회 로얄플라워`). */
  sourceLabel: string;
}

/* ------------------------------------------------------------------ *
 * 사전 시트 상세 (`/flowers` — 서버 액션 `loadBirthDictDetail` 의 응답)
 * ------------------------------------------------------------------ */

/**
 * 사전 시트가 펼치는 이야기 한 편.
 *
 * `/stories` 의 `ArchiveStory` 와 겹쳐 보이지만 **결 칩(mood)이 없다.** 그 축은 추천
 * 선별기가 쓰는 것이고(`pickStories`), 사전 시트는 그 이름의 이야기를 순서대로 펼칠 뿐
 * 고르지 않는다 — 쓰지 않는 분류를 화면에 세우면 그것부터 읽힌다(§1.5i 본문 우선).
 */
export interface BirthDictStory {
  id: string;
  title: string;
  /** 목록에서 먼저 보여 줄 한 줄. 없는 편도 있다. */
  hook?: string;
  body: string;
  /** 본문 아래 각주 줄(지역 · 시대 · 갈래 · 신뢰) — 이야기 시트와 **같은 함수**가 만든다. */
  notes: MetaNote[];
  /** 출처를 사람이 읽는 이름. 창작(`original`)만 없을 수 있다. */
  sourceLabel?: string;
  sourceUrl?: string;
}

/**
 * 시트를 **연 사람만** 받는 한 벌 — 사진 한 장과 그 이름의 이야기들.
 *
 * ── 왜 목록에 실어 보내지 않나 (성능 규율) ──────────────────────────
 * 이야기 416편의 본문을 달치 목록에 얹으면 한 달이 8~10KB 에서 30KB 안팎으로 뛴다
 * (`/stories` 가 겪은 성능 리뷰 P1-7 과 같은 모양이고, 사전은 목록을 훑기만 하는 사람이
 * 훨씬 많다). 그래서 목록은 썸네일 주소 한 줄만 들고, 나머지는 시트를 열 때 가져온다.
 *
 * 사진도 이야기도 없는 날이 정상이다 — 그때는 `photo` 키가 없고 `stories` 가 빈 배열이라
 * 화면이 그 구획을 **세우지 않는다**(빈 제목만 남기지 않는다).
 */
export interface BirthDictDetail {
  photo?: BirthPhotoView;
  stories: BirthDictStory[];
}

/**
 * 사전이 한 번에 펼치는 단위 = **한 달**.
 *
 * 366행을 통째로 내려보내지 않는다는 규율(§1.5m ③·⑤)을 이 모양이 강제한다 —
 * 화면이 받을 수 있는 가장 큰 덩어리가 31행이다.
 */
export interface BirthMonthView {
  month: number;
  /** `3월`. */
  monthLabel: string;
  entries: BirthDictEntry[];
  /** 그달에 도감으로 건너갈 수 있는 날의 수. 구획 상태 줄이 쓴다. */
  linkedCount: number;
}

/* ------------------------------------------------------------------ *
 * 계절 달력 (`/calendar`)
 * ------------------------------------------------------------------ */

/**
 * 달 안에 서는 꽃 한 칩.
 *
 * 칩이 들고 가는 것은 **가는 길과 얼굴 한 장**뿐이다. 꽃말·이야기·안전은 칩을 누르면
 * 닿는 도감 상세가 이미 갖고 있다(사전 목록이 썸네일 주소 한 줄만 드는 것과 같은 판단 —
 * `BirthDictEntry.thumbSrc` 주석).
 */
export interface BloomChip {
  /** = `content/flowers.csv` 의 id. 그대로 상세 경로가 된다(`/flowers/{slug}`). */
  slug: string;
  nameKo: string;
  /**
   * 대표컷 썸네일 **주소 한 줄**. 아직 컷이 없는 꽃은 키 자체가 없다 — 그때 화면은 점선
   * 빈 액자를 그대로 둔다(사전 목록과 같은 규칙: 다른 꽃 사진을 끌어다 쓰거나 아이콘을
   * 지어내지 않는다).
   *
   * `srcSet` 을 함께 싣지 않는 이유: 이 자리는 어느 화면 폭에서도 36px 이라 후보가 하나뿐이고,
   * 한 폭짜리 `srcSet` 은 같은 주소를 한 번 더 적는 것에 지나지 않는다.
   */
  thumbSrc?: string;
}

/**
 * 달 한 칸 = 그달에 피는 꽃의 **슬러그 목록** + 탄생화 사전으로 건너가는 다리에 쓸 숫자 하나.
 *
 * ⚠ 여기에 칩을 통째로 담지 마라. 한 꽃이 평균 다섯 달에 서므로(280칸/59종) 칩을 달마다
 *   되풀이하면 같은 이름과 같은 사진 주소가 다섯 벌씩 실린다. 꽃 한 벌은
 *   `BloomCalendarData.flowers` 에 한 번만 두고 여기서는 이름표만 가리킨다.
 */
export interface BloomMonthGroup {
  /** 1~12. */
  month: number;
  /** `8월`. */
  monthLabel: string;
  /** 카탈로그 순서 그대로다 — 다시 찾아온 사람이 같은 자리에서 같은 꽃을 만난다. */
  slugs: string[];
  /**
   * 그달 탄생화 표에 실린 **날의 수**(28~31).
   *
   * ⚠ 여기 오는 것은 **숫자 하나**다. 사전 366행을 이 화면에 싣지 않는다(§1.5m ③) —
   *   달력은 도감의 곁문이고, 사전은 `/flowers` 가 달 단위로 펼친다. 이 숫자는 그리로
   *   건너가는 다리 한 줄이 쓸 값일 뿐이다.
   */
  birthDayCount: number;
}

/** `/calendar` 한 페이지 분량. */
export interface BloomCalendarData {
  /**
   * 달력에 서는 꽃 **한 벌**(개화 달이 적힌 종만). 카탈로그 순서 그대로다.
   * 달 칸들은 이 목록을 슬러그로 가리킨다 — 같은 값이 열두 번 실려 가지 않게 하는 자리다.
   */
  flowers: BloomChip[];
  /** 열두 달. 그달에 피는 꽃이 없어도 칸은 선다(빈 달도 사실이다). */
  months: BloomMonthGroup[];
  /** 카탈로그 전체 종 수(정식 도감 티어). */
  flowerCount: number;
  /** 개화 달이 적힌 종 수. 표에 달을 못 적어 둔 꽃은 어느 달에도 서지 않는다. */
  bloomingCount: number;
  /** 열한 달 이상 피는 종 수 — 인트로가 "사철 만나는 꽃"으로 한 줄 말한다. */
  yearRoundCount: number;
  /**
   * 화면에 실제로 건 사진들의 크레딧 — 푸터가 접어서 단다(랜딩 `Image credits` 와 같은 처리).
   * 칩 옆 12px 글씨로 붙이면 목록이 크레딧 목록이 되고 어차피 읽히지 않는다.
   */
  credits: string[];
}

/* ------------------------------------------------------------------ *
 * 상세 (`/flowers/[slug]`)
 * ------------------------------------------------------------------ */

/** 같은 색으로 묶인 꽃말들. */
export interface MeaningGroup {
  key: string;
  /** `흰색` `보라` … 색이 비어 있는 행은 `색을 가리지 않는 이야기`. */
  colorLabel: string;
  /** 스와치 색(§1.4 팔레트 승인 틴트). 색 없는 묶음은 undefined. */
  hex?: string;
  /** 흰·크림처럼 배경과 붙는 색은 링을 둘러 형태를 남긴다. */
  needsRing?: boolean;
  items: MeaningItem[];
}

export interface MeaningItem {
  key: string;
  /** 꽃말 본문 — 주인공 문장. */
  text: string;
  /** 각주 한 줄: 문화권 · 시대 · 신뢰 라벨(§1.5i 메타 후치). */
  note: string;
  /** 편집 주의 문구가 있을 때만. */
  caution?: string;
  sourceUrl?: string;
  /**
   * 그 출처를 사람이 읽는 이름(`Wikipedia` · `국립원예특작과학원` …).
   *
   * 한 화면에 출처 링크가 열세 개까지 서기 때문에 **링크 이름이 목적지를 구별해야 한다**
   * (예전에는 전부 `이야기의 갈래` 라는 같은 이름이었다 — 접근성 리뷰 P1-9).
   * `sourceUrl` 이 있을 때만 함께 온다.
   */
  sourceLabel?: string;
}

/** 이야기 한 편 — 카드가 그대로 쓰는 모양(hook·본문 먼저, 메타는 각주). */
export interface FlowerStory {
  id: string;
  title: string;
  hook?: string;
  body: string;
  /** 결(mood) 칩. 상단에 허용된 유일한 분류 표시다(§1.5i). */
  moodLabels: string[];
  /** 본문 아래 각주 줄(지역 · 시대 · 갈래 · 신뢰). */
  notes: MetaNote[];
  sourceTitle?: string;
  sourceUrl?: string;
  /** 처음부터 펼쳐 두는 한 편(§1.5i — featured 전체 노출). */
  featured: boolean;
}

/**
 * 히어로 갤러리의 한 컷 — 서버가 주소·폭 후보까지 다 만들어 내려보낸다.
 *
 * `srcSet` 이 함께 오는 이유: 이 자리는 폰에서 화면 폭 전부를, 데스크톱에서는 셸의
 * 절반쯤을 쓴다. 한 폭만 내려보내면 둘 중 하나는 반드시 틀린다
 * (`photoSrcSet()` 주석의 `sizes` 권장값이 짝이다).
 */
export interface DetailPhoto {
  src: string;
  /** 같은 컷의 여러 폭 후보. 폭 치환이 안 되는 소스면 주소 한 줄만 온다. */
  srcSet: string;
  alt: string;
  credit: string;
  /** `흰빛` `분홍빛` `뒤에서` … 이웃 컷과 견줘 이 장이 무엇인지(없을 수도 있다). */
  variant?: string;
}

/** 최하단 참고 블록의 반려동물 칸(§1.5h — 배지 1곳 + 상세는 접힘). */
export interface PetNote {
  safe: boolean;
  badge: string;
  /** 종별 한 줄(`고양이 — 적은 양도 생명을 위협할 수 있어요`). */
  lines: string[];
  sourceUrl?: string;
}

/** `/flowers/[slug]` 한 페이지 분량. */
export interface FlowerDetailData {
  slug: string;
  nameKo: string;
  nameEn: string;
  scientificName: string;
  category: ThemeCategory;
  categoryLabel: string;
  categoryHint: string;
  /**
   * 히어로 갤러리가 넘겨 보는 **실사 여러 컷** — 원본은 `@/lib/photos`(원격 CDN 주소).
   *
   * 도감이 먼저 답해야 하는 질문은 "이 꽃이 어떻게 생겼나"다. 19세기 세밀화는 그 답을
   * 아름답게는 하지만 정확하게는 못 한다(판본에 따라 종이 다르고, 겹꽃 변종이 섞인다).
   * 그래서 **실사가 앞이고 도판이 보조**다 — 도판은 아래 `plate` 로 액자에 남는다.
   *
   * ⚠ **`[0]` 은 랜딩·결과·편지가 쓰는 그 대표컷이다**(`photosFor()` 가 구조로 보장한다).
   *   카드를 누르고 들어온 사람이 방금 본 사진이 첫 장이어야 두 화면이 이어진다.
   *   나머지는 같은 꽃의 색 변형이나 다른 앵글이고, `variant` 가 그것을 한 마디로 말한다.
   *
   * 컷이 없는 꽃이면 **빈 배열**이다 — 화면은 갤러리 자리를 세우지 않는다.
   */
  photos: DetailPhoto[];
  /**
   * 히어로 액자에 거는 세밀화 — 원본은 `@/lib/plates`(자체 호스팅 사본 주소가 온다).
   * `note` 는 종이 다르거나 판면에 손댄 도판의 **정직한 한 줄**이다(없는 꽃이 더 많다).
   * 있으면 크레딧 아래 각주로 그대로 나간다 — 감추면 "벚꽃이라며 다른 꽃을 보여 준" 화면이 된다.
   */
  plate?: { src: string; alt: string; credit: string; note?: string };
  /** 대표 꽃말 — 히어로에 크게 세우는 한 줄. */
  headline: string;
  meaningGroups: MeaningGroup[];
  meaningCount: number;
  stories: FlowerStory[];
  /**
   * §1.5k 「문학 속의 이 꽃」 — 그 꽃에 붙은 발췌 **전부**를, 결과 화면과 **같은 차례**로.
   *
   * 결과 화면은 한 편을 앞세우고 나머지를 넘겨 보게 하지만(곁들임 위계), 도감은
   * 아카이브라 전 행을 그대로 세운다. 차례를 정하는 것은 두 화면 모두
   * `orderLiterature`(flow/labels.ts) 한 곳이다 — 같은 꽃에서 같은 편이 맨 앞에 선다.
   *
   * 발췌가 한 줄도 없는 꽃(59종 중 23종)은 **빈 배열**이다 → 화면은 구획 자체를 세우지
   * 않는다. 근대에 명명돼 고전 문학에 나오지 않는 종들이라, 그 자리를 편집팀 문장으로
   * 메우지 않는 것이 §1.5e "검증된 인용만" 이다.
   */
  literature: LiteratureView[];
  /** §1.5h `이런 날 건네보세요`. 데이터가 없는 꽃은 빈 배열 → 섹션을 세우지 않는다. */
  occasions: string[];
  pet: PetNote;
  seasonLine: string;
  priceLine: string;
  /**
   * 이 꽃이 탄생화로 놓인 날들 — `3월 21일 · 10월 9일`.
   *
   * 표에 안 걸린 꽃(32종 중 8종)은 **키 자체가 없다** → 화면이 줄을 세우지 않는다.
   * 한 종이 여러 날에 걸리는 것이 정상이다(장미 10일 · 국화 4일).
   * ⚠ 문구에서 "전통"·"공식"·"예로부터 정해진" 류 단정 금지(조사 문서 §2).
   */
  birthDays?: string;
}
