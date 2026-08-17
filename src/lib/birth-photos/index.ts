/**
 * 탄생화 실사 274장의 **경로·크레딧·slug** 를 한곳에서 정한다 — 자체 호스팅 자산 규칙.
 *
 * 표 원본은 코드가 아니라 **CSV** 다(`content/birth_photos.csv` → `Catalog.birthPhotos`).
 * 도판(`src/lib/plates/index.ts`)이 59종을 TS 상수로 들고 있는 것과 갈린 지점이고, 이유는
 * 규모다 — 280행짜리 표를 손으로 관리하는 TS 파일에 넣으면 편집자가 손댈 수 없다.
 * 그래서 이 모듈에는 **표가 없고 규칙만 있다**: 어디에 저장하고, 어떤 이름을 붙이고,
 * 화면에 어떤 한 벌을 내려보내는가.
 *
 * ── 저장 규격 (`scripts/fetch-birth-photos.mjs` 가 이 규칙대로 놓는다) ─
 *   · 본판   `public/birth/{slug}.jpg`        — 960px · JPEG q80 (사전 시트가 건다)
 *   · 썸네일 `public/birth/thumbs/{slug}.jpg` — 320px · JPEG q80 (목록 44px · 결과 카드 88px)
 * 도판과 같은 이유로 두 벌이다. 목록 한 달이 서른한 줄이라, 44px 칸이 960px 본판을 물면
 * 한 화면이 수 MB 가 된다(도판이 실측으로 겪은 성능 리뷰 P0-2 와 같은 자리).
 *
 * ── slug 는 CSV 컬럼이 단일 원본이다 ─────────────────────────────────
 * 아래 `assignBirthPhotoSlugs()` 는 그 컬럼을 **만든 규칙**이지 런타임 조회 경로가 아니다.
 * 화면도 스크립트도 CSV 의 `slug` 를 그대로 읽는다 — 규칙을 두 곳에서 다시 계산하면
 * 이름이 한 글자 바뀌는 날 파일 이름과 화면이 조용히 어긋난다.
 * (`tests/components/birth-photos.test.ts` 가 "CSV 의 slug == 규칙의 결과" 를 지킨다.)
 *
 * 순수 데이터·순수 함수만 둔다(React·fs 의존 금지) — 서버 컴포넌트와
 * `scripts/fetch-birth-photos.mjs`(node)가 같은 파일을 읽는다.
 * ⚠ 클라이언트 컴포넌트는 이 모듈을 **값으로** import 하지 마라(타입은 `./view` 에서).
 */

import type { BirthPhoto } from '@/lib/data/types';
import type { BirthPhotoView } from './view';

export type { BirthPhotoView };

/* ------------------------------------------------------------------ *
 * 저장 위치 · 규격
 * ------------------------------------------------------------------ */

/** 본판이 사는 자리. `public/birth/` 와 같은 말이다. */
export const BIRTH_PHOTO_DIR = '/birth/';
/** 썸네일이 사는 자리. 본판과 **파일 이름이 같다**(경로를 두 번 적지 않는다). */
export const BIRTH_THUMB_DIR = '/birth/thumbs/';

/**
 * 본판 폭. 사전 시트의 사진 자리가 폰에서 화면 폭 전부(≤430px)를, 768px 위에서는
 * 시트 폭(≤520px - 패딩 44px = 476px)을 쓴다 — 레티나 2배가 곧 960px 이다.
 */
export const BIRTH_PHOTO_WIDTH = 960;
/**
 * 썸네일 폭. 거는 자리는 목록 줄 44px 과 생일 찾기 카드 88px 뿐이라,
 * 320px 이면 3배 DPR(=264px)까지 덮는다.
 */
export const BIRTH_THUMB_WIDTH = 320;

/** 그 slug 의 본판 주소. */
export function birthPhotoSrc(slug: string): string {
  return `${BIRTH_PHOTO_DIR}${slug}.jpg`;
}

/** 그 slug 의 썸네일 주소. */
export function birthThumbSrc(slug: string): string {
  return `${BIRTH_THUMB_DIR}${slug}.jpg`;
}

/* ------------------------------------------------------------------ *
 * 한국어 → 로마자 (slug 생성)
 * ------------------------------------------------------------------ */

/** 초성 19. 국어의 로마자 표기법(문화체육관광부 고시) 자음 표기. */
const CHO = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's',
  'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];

/** 중성 21. */
const JUNG = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa',
  'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
];

/** 종성 28(0 = 받침 없음). 받침은 대표음으로 적는다(ㅅ·ㅆ·ㅈ·ㅊ·ㅌ·ㅎ → t 등). */
const JONG = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k',
  'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't',
  't', 'ng', 't', 't', 'k', 't', 'p', 't',
];

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;

/**
 * 한글 이름 → 파일 이름에 쓸 로마자.
 *
 * **음운 변화를 반영하지 않는다**(`좁은잎배풍등` → `jobeunipbaepungdeung`). 이 값이 하는
 * 일은 사람이 읽고 부르는 것이지 발음을 옮기는 것이 아니라, 규칙이 단순할수록 좋다 —
 * 자모를 그대로 이어 붙이면 같은 이름은 언제나 같은 결과가 나오고(결정적), 표기법이
 * 바뀌어도 이미 받아 둔 파일 이름이 흔들리지 않는다.
 *
 * 한글이 아닌 글자는 이렇게 다룬다:
 *   · `a-z0-9` 는 소문자로 그대로 둔다(표에 아직 없지만 들어와도 깨지지 않게).
 *   · 나머지(공백·중점 …)는 하이픈 한 칸으로 접는다.
 * 결과가 비면 빈 문자열을 돌려준다 — 호출부가 그것을 보고 멈춘다(이름을 지어내지 않는다).
 */
export function romanizeKo(text: string): string {
  let out = '';
  for (const char of text.normalize('NFC')) {
    const code = char.codePointAt(0) ?? 0;
    if (code >= HANGUL_BASE && code <= HANGUL_LAST) {
      const index = code - HANGUL_BASE;
      out += CHO[Math.floor(index / 588)];
      out += JUNG[Math.floor((index % 588) / 28)];
      out += JONG[index % 28];
      continue;
    }
    if (/[a-z0-9]/.test(char)) out += char;
    else if (/[A-Z]/.test(char)) out += char.toLowerCase();
    else out += '-';
  }
  return out.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/* ------------------------------------------------------------------ *
 * slug 배정
 * ------------------------------------------------------------------ */

/** slug 를 배정할 때 필요한 최소한의 행 정보. */
export interface BirthPhotoSlugInput {
  month: number;
  day: number;
  nameKo: string;
  /** 취득 주소. 비어 있으면 미확보 행이라 slug 자체를 주지 않는다. */
  directUrl?: string;
}

/** `0916` — 같은 이름이 서로 다른 사진을 들 때의 꼬리표. */
function dateTag(month: number, day: number): string {
  return `${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
}

/**
 * 행 → slug 표(`"{month}/{day}"` → slug). **미확보 행은 표에 없다.**
 *
 * ── 왜 이름 하나에 slug 하나가 아닌가 ───────────────────────────────
 * 표는 날짜가 주인이라 같은 이름이 여러 날에 걸린다(`삼나무` 2/15·9/30). 그중 35개
 * 이름이 그렇고, 절반인 17개는 **날짜마다 다른 사진**이다(2/15 는 숲, 9/30 은 열매).
 * 그래서 slug 가 가리키는 것은 이름도 날짜도 아닌 **사진 파일 한 장**이다:
 *   · 같은 이름 + 같은 취득 주소 → 같은 slug (파일도 한 장, 내려받기도 한 번)
 *   · 같은 이름 + 다른 취득 주소 → `{로마자}-{MMDD}` 로 가른다(그 사진을 처음 쓴 날짜)
 * 날짜를 언제나 붙이지 않는 이유는 읽히는 이름을 지키기 위해서다 —
 * 274장 중 239장이 `haedanghwa.jpg` 처럼 이름만으로 끝난다.
 *
 * 이름이 서로 다른데 로마자가 같아지면 **던진다.** 조용히 한쪽을 덮으면 화면이 다른 꽃의
 * 사진을 보여 주게 되고, 그건 이 서비스가 가장 하면 안 되는 실수다.
 */
export function assignBirthPhotoSlugs(
  rows: readonly BirthPhotoSlugInput[],
): Map<string, string> {
  const ordered = [...rows].sort((a, b) => a.month - b.month || a.day - b.day);

  /** 이름 → (취득 주소 → 그 주소를 처음 쓴 행). */
  const byName = new Map<string, Map<string, BirthPhotoSlugInput>>();
  for (const row of ordered) {
    if (!row.directUrl) continue;
    const urls = byName.get(row.nameKo) ?? new Map<string, BirthPhotoSlugInput>();
    if (!urls.has(row.directUrl)) urls.set(row.directUrl, row);
    byName.set(row.nameKo, urls);
  }

  /** slug → 그 slug 를 가진 이름. 다른 이름이 같은 slug 를 집으면 여기서 걸린다. */
  const owner = new Map<string, string>();
  /** 이름 → (취득 주소 → slug). */
  const slugByUrl = new Map<string, Map<string, string>>();

  for (const [nameKo, urls] of byName) {
    const base = romanizeKo(nameKo);
    if (base === '') {
      throw new Error(`birth_photos: 로마자로 옮길 수 없는 이름입니다 — ${nameKo}`);
    }

    const perUrl = new Map<string, string>();
    for (const [url, first] of urls) {
      const slug = urls.size === 1 ? base : `${base}-${dateTag(first.month, first.day)}`;
      const taken = owner.get(slug);
      if (taken !== undefined && taken !== nameKo) {
        throw new Error(
          `birth_photos: slug 가 겹칩니다 — '${slug}' 를 '${taken}' 와 '${nameKo}' 가 함께 집었습니다.`,
        );
      }
      owner.set(slug, nameKo);
      perUrl.set(url, slug);
    }
    slugByUrl.set(nameKo, perUrl);
  }

  const out = new Map<string, string>();
  for (const row of ordered) {
    if (!row.directUrl) continue;
    const slug = slugByUrl.get(row.nameKo)?.get(row.directUrl);
    if (slug) out.set(`${row.month}/${row.day}`, slug);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 화면으로 내려보낼 한 벌
 * ------------------------------------------------------------------ */

/**
 * 표의 한 행 → 화면이 쓰는 한 벌. **미확보 행이면 `undefined`** 다 —
 * 사진이 없는 날은 화면이 사진 자리를 세우지 않는다(다른 꽃 사진을 끌어다 쓰지 않는다).
 *
 * 라이선스 세 칸(저작자·라벨·파일 페이지)이 하나라도 비면 그것도 `undefined` 로 친다.
 * 크레딧을 못 다는 사진은 **걸지 않는 것**이 CC BY-SA 파생물 규칙을 지키는 유일한 길이다
 * (표는 이미 시드 교차 검증이 막지만, 화면 쪽에도 같은 문을 하나 더 둔다).
 */
export function birthPhotoView(photo: BirthPhoto | undefined): BirthPhotoView | undefined {
  if (!photo?.slug) return undefined;
  if (!photo.author || !photo.license || !photo.pageUrl) return undefined;
  return {
    src: birthPhotoSrc(photo.slug),
    thumbSrc: birthThumbSrc(photo.slug),
    author: photo.author,
    license: photo.license,
    pageUrl: photo.pageUrl,
    ...(photo.familyLine ? { familyLine: photo.familyLine } : {}),
  };
}
