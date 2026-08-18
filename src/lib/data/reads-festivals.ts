/**
 * API 축제 — 「읽을거리」 행사 구획에 합류하는 **기계가 모아 온 한 벌**.
 *
 * ═══ 원장과 이 파일의 관계 (섞지 않는다) ═══════════════════════════════
 * `content/reads.csv` 는 **사람이 직접 열어 보고 고른** 원장이다. 이 파일이 읽는
 * `content/generated/festivals.json` 은 한국관광공사 TourAPI 가 준 목록을 걸러 굳힌
 * **생성 산출물**이고, 둘은 끝까지 다른 파일로 남는다. 한 번 섞으면 「우리가 직접 열어
 * 봤다」는 원장의 약속이 그 자리에서 거짓이 된다(`docs/reads-research.md` §1).
 *
 * 그래서 이 모듈은
 *   · 원장을 읽지 않고 **쓰지도 않는다**(로더는 JSON 한 파일만 본다),
 *   · 화면에서는 카드에 `한국관광공사 제공` 라벨을 달아 출처를 분명히 하고,
 *   · 같은 축제가 원장에도 있으면 **원장이 이긴다**(아래 `hideDuplicates`).
 *
 * ═══ 여기 있는 것이 왜 순수 함수인가 ═══════════════════════════════════
 * 꽃 어휘 판정·지역 축약·태그 파생은 **수집 스크립트와 화면이 함께 쓴다**
 * (`scripts/fetch-festivals.mjs` 가 이 파일을 import 한다). 두 벌로 적으면 스크립트가
 * 거른 것과 화면이 믿는 것이 조용히 어긋난다 — 그래서 한 자리에 두고, 시계·네트워크·
 * 파일을 만지지 않는 함수로 둬 테스트가 경계를 짚을 수 있게 한다.
 * 파일을 만지는 것은 맨 아래 `loadFestivals()` 하나뿐이다(서버 전용).
 */

import path from 'node:path';
import { readFile } from 'node:fs/promises';

import { z } from 'zod';

import { daysBetween, readPeriodLabel } from '@/components/reads/expiry';
import { READ_SEASON_TAGS } from '@/components/reads/tags';
import type { ReadCard } from '@/components/reads/types';

import { resolveContentDir } from './catalog';

/* ------------------------------------------------------------------ *
 * 1. 모양
 * ------------------------------------------------------------------ */

/**
 * 굳혀 둔 축제 한 건.
 *
 * ⚠ **이미지 칸이 없다.** TourAPI 는 `firstimage` 를 주지만 이 섹션은 활자 카드이고
 *   (조사 문서 §2), 남의 서버 이미지를 화면에 거는 것은 핫링크다. 칸을 만들지 않는 것이
 *   가장 싼 방어다 — 원장 스키마가 `image_url` 을 모르는 것과 같은 이유다.
 * ⚠ **API 소개문 칸도 없다.** `summary` 는 우리가 사실만으로 지어낸 한 줄이다
 *   (`composeSummary`). 공공누리가 허용하더라도 남의 문장을 그대로 옮기지 않는다.
 */
export interface FestivalRecord {
  /** `festival-<contentid>` — 원장의 `read-` 와 섞이지 않는 접두사다. */
  id: string;
  title: string;
  /** `YYYY-MM-DD`. 둘 다 **필수**다 — 종료일 없는 행사는 영영 안 사라진다(§6-2). */
  startsAt: string;
  endsAt: string;
  /** `전남 함평` 꼴. 주소를 못 읽으면 키 자체가 없다. */
  region?: string;
  /** 주최 쪽 공식 페이지. https 만 싣는다 — 없으면 그 축제는 아예 담기지 않는다. */
  url: string;
  /** 우리가 쓴 한 줄. API 원문이 아니다. */
  summary: string;
}

/** `content/generated/festivals.json` 통째. */
export interface FestivalsFile {
  /** 언제 받아 왔는가(ISO). 목록이 얼마나 묵었는지 판단하는 유일한 근거다. */
  fetchedAt: string;
  source: {
    provider: string;
    service: string;
    license: string;
  };
  /** 받아 온 창(포함 경계). 밖의 축제가 없다는 뜻이 아니라 **묻지 않았다**는 뜻이다. */
  window: { from: string; to: string };
  festivals: FestivalRecord[];
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

const FestivalRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  startsAt: z.string().regex(YMD),
  endsAt: z.string().regex(YMD),
  region: z.string().min(1).optional(),
  url: z.string().regex(/^https:\/\//),
  summary: z.string().min(1),
});

export const FestivalsFileSchema = z.object({
  fetchedAt: z.string().min(1),
  source: z.object({
    provider: z.string().min(1),
    service: z.string().min(1),
    license: z.string().min(1),
  }),
  window: z.object({ from: z.string().regex(YMD), to: z.string().regex(YMD) }),
  festivals: z.array(FestivalRecordSchema),
});

/** 화면·수집이 함께 쓰는 출처 표기. 공공누리 제1유형의 **출처표시 의무**를 지는 문자열이다. */
export const FESTIVAL_PROVIDER = '한국관광공사';
/** 카드에 붙는 작은 라벨. 이 한 줄이 「우리가 고른 것」과 「기계가 모아 온 것」을 가른다. */
export const FESTIVAL_PROVIDER_LABEL = `${FESTIVAL_PROVIDER} 제공`;

/* ------------------------------------------------------------------ *
 * 2. 꽃 축제인가 — 어휘 판정
 * ------------------------------------------------------------------ */

/**
 * 꽃 어휘.
 *
 * ── 경계: 무엇을 꽃으로 치는가 ──────────────────────────────────────
 * 이 서비스가 말하는 꽃은 **선물이 되는 꽃**이다. 그래서 잎·이삭·열매를 보러 가는
 * 축제는 식물 축제여도 여기 들어오지 않는다:
 *   · 억새·갈대  — 이삭이다. 「억새꽃」이라 부르는 관용이 있어 아래 부정 어휘로 뗀다.
 *   · 단풍·은행  — 잎이다. 애초에 꽃 어휘가 없어 걸리지 않는다.
 *   · 녹차·인삼·사과 — 작물 축제다. 같은 이유로 걸리지 않는다.
 * 반대로 **꽃을 보러 가는 것이 목적이면** 우리 도감에 없는 종이어도 담는다(꽃무릇·
 * 맥문동·메밀꽃). 도감에 있는 종만 담으면 47종에 갇혀 「지금 갈 곳」이 텅 빈다.
 *
 * ⚠ 순서에 뜻이 없다 — 포함 검사만 한다. 다만 **긴 말이 먼저** 걸리도록 부정 어휘를
 *   먼저 지운다(아래 `isFlowerFestival`).
 */
export const FESTIVAL_FLOWER_WORDS: readonly string[] = [
  // 총칭
  '꽃', '플라워', 'flower', '화훼', '원예', '가든', '정원',
  // 종
  '장미', '튤립', '벚꽃', '국화', '연꽃', '수국', '유채', '매화', '철쭉', '진달래',
  '무궁화', '코스모스', '해바라기', '라벤더', '백합', '작약', '모란', '수선화',
  '동백', '배롱', '메밀', '구절초', '상사화', '꽃무릇', '맥문동', '핑크뮬리',
  '양귀비', '아이리스', '창포', '연산홍', '영산홍', '개나리', '목련', '복사꽃',
  '살구꽃', '이팝', '조팝', '금계국', '수레국화', '천일홍', '백일홍', '해국',
  '달맞이', '芍藥',
];

/**
 * 부정 어휘 — **꽃이 아닌데 꽃 글자를 달고 있는 말들.**
 *
 * ⚠ 이 목록은 실데이터로 다듬어야 한다. 지금 값은 국내 축제 이름의 관용에서 세운
 *   1차 목록이고(불꽃축제·꽃게축제가 대표), TourAPI 활용신청이 나면 실제 목록을 받아
 *   **여기부터 다시 보라**(`docs/reads-research.md` 「API 축제」 절).
 *
 * 판정 방법이 목록만큼 중요하다: 이 말들을 **먼저 지우고** 남은 글자에서 꽃 어휘를
 * 찾는다. 그래야 「불꽃과 꽃무릇」 같은 제목이 살아남는다(아래 `isFlowerFestival`).
 */
export const FESTIVAL_NEGATIVE_WORDS: readonly string[] = [
  // 꽃 글자를 쓰지만 꽃이 아닌 것
  '불꽃', '눈꽃', '얼음꽃', '서리꽃', '성에꽃', '물꽃', '빛꽃', '소금꽃', '별꽃놀이',
  // 먹는 것
  '꽃게', '꽃등심', '꽃삼겹', '꽃돼지', '꽃차롱', '꽃새우', '꽃빵',
  // 이삭·잎 — 위 「경계」 절 참조
  '억새꽃', '갈대꽃', '단풍꽃',
  // 사람·행사 이름의 비유
  '꽃보다', '꽃길만', '인생꽃',
];

/** 비교용 정규화 — 공백·구두점을 지우고 소문자로 만든다(한글에는 대소문자가 없어 영문만 준다). */
function flatten(text: string): string {
  return text.replace(/[\s ]+/g, '').toLowerCase();
}

/**
 * 이 제목(+소개)이 꽃 축제인가.
 *
 * 순서가 규칙이다.
 *   ① 부정 어휘를 **지운다** — 「서산 꽃게 축제」의 `꽃`이 여기서 사라진다.
 *   ② 남은 글자에서 꽃 어휘를 찾는다 — 「불꽃과 꽃무릇 축제」는 `불꽃`만 지워지고
 *      `꽃무릇`이 남아 통과한다.
 * 두 단계를 뒤집으면(먼저 찾고 나중에 배제) 위 두 번째 제목이 통째로 버려진다.
 */
export function isFlowerFestival(...texts: (string | undefined)[]): boolean {
  let text = flatten(texts.filter(Boolean).join(' '));
  for (const bad of FESTIVAL_NEGATIVE_WORDS) {
    text = text.split(flatten(bad)).join(' ');
  }
  return FESTIVAL_FLOWER_WORDS.some((word) => text.includes(flatten(word)));
}

/* ------------------------------------------------------------------ *
 * 3. 값 다듬기 — 주소 · 날짜 · 태그 · 한 줄
 * ------------------------------------------------------------------ */

/** 시도 정식 명칭 → 원장이 쓰는 짧은 이름. 원장의 `강원 평창`·`전남 함평` 과 같은 자다. */
const PROVINCE_SHORT: Record<string, string> = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  세종시: '세종',
  경기도: '경기',
  강원도: '강원',
  강원특별자치도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전라북도: '전북',
  전북특별자치도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
  제주도: '제주',
  제주특별자치도: '제주',
};

/** 수도권 시도 — 자리 태그를 가르는 유일한 기준이다. */
const CAPITAL_AREA = new Set(['서울', '경기', '인천']);

/**
 * `addr1` → 원장 문법의 지역 두 마디(`전남 함평`).
 *
 * 시군구는 접미사(`시`·`군`·`구`)를 뗀다 — 원장이 그렇게 적혀 있어서다. 다만 **한 글자만
 * 남는 이름은 떼지 않는다**(`시흥시`→`시흥` 은 괜찮지만 `구미시`의 뒤를 자르는 실수를
 * 막는 것이 아니라, `동구`·`남구` 처럼 접미사가 곧 이름인 자리를 지킨다).
 * 세종처럼 시군구가 없는 곳은 시도 한 마디로 끝난다.
 *
 * 못 읽으면 `undefined` 다 — 빈 문자열을 돌려주지 않는다. 화면이 「지역이 있는데 비어
 * 있다」와 「지역을 모른다」를 구별해야 하기 때문이다.
 */
export function shortRegion(addr1?: string): string | undefined {
  if (!addr1) return undefined;
  const parts = addr1.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return undefined;

  const province = PROVINCE_SHORT[parts[0]] ?? parts[0];
  const district = parts[1];
  if (district === undefined) return province;

  const trimmed = /[시군구]$/.test(district) ? district.slice(0, -1) : district;
  if (trimmed.length === 0) return province;
  return `${province} ${trimmed}`;
}

/** 지역 → 자리 태그. 국내 API 라 `해외`·`온라인` 은 나올 수 없다. */
export function festivalPlaceTag(region?: string): string {
  const province = region?.split(' ')[0] ?? '';
  return CAPITAL_AREA.has(province) ? '서울·수도권' : '지방';
}

/**
 * 기간이 걸친 달들 → 계절 태그.
 *
 * 걸친 달을 **전부** 센다: 7/1~9/30 은 `여름`·`가을` 둘 다 단다(원장의 서울식물원 행이
 * 실제로 그렇게 적혀 있다). 순서는 `READ_SEASON_TAGS` 순서를 따라 굳힌다 — 같은 입력이
 * 같은 배열을 내야 생성 파일이 실행마다 흔들리지 않는다.
 */
export function festivalSeasonTags(startsAt: string, endsAt: string): string[] {
  const seasonOf = (month: number): string => {
    if (month >= 3 && month <= 5) return '봄';
    if (month >= 6 && month <= 8) return '여름';
    if (month >= 9 && month <= 11) return '가을';
    return '겨울';
  };

  const [fromYear, fromMonth] = startsAt.split('-').map(Number);
  const [toYear, toMonth] = endsAt.split('-').map(Number);

  const found = new Set<string>();
  // 열두 달이 넘는 기간은 어차피 네 계절을 다 덮는다 — 무한 루프만 막으면 된다.
  let cursor = fromYear * 12 + (fromMonth - 1);
  const last = Math.min(toYear * 12 + (toMonth - 1), cursor + 11);
  for (; cursor <= last; cursor += 1) found.add(seasonOf((cursor % 12) + 1));

  return READ_SEASON_TAGS.filter((tag) => found.has(tag));
}

/**
 * 칩 어휘 13종 중 이 축제가 갖는 것들 — **원장과 같은 순서**(계절 · 결 · 자리)로 굳힌다.
 *
 * ⚠ 세 축을 전부 채우는 것이 필수다. 한 축이라도 비면 그 칩을 누르는 순간 이 카드가
 *   조용히 사라진다(`ReadsBoard` 의 `passes` 는 고른 태그를 **가진** 카드만 남긴다).
 * 결이 늘 `축제` 인 것은 이 목록의 출처가 `searchFestival2` 하나이기 때문이다 —
 * 전시 API 를 붙이는 날 여기가 갈린다.
 */
export function festivalTags(record: Pick<FestivalRecord, 'startsAt' | 'endsAt' | 'region'>): string[] {
  return [
    ...festivalSeasonTags(record.startsAt, record.endsAt),
    '축제',
    festivalPlaceTag(record.region),
  ];
}

/** 한 줄이 길어지면 자른다. 우리가 짓는 문장이라 걸릴 일이 거의 없는 안전핀이다. */
export function clampSummary(text: string, max = 120): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

/**
 * 카드에 실을 한 줄 — **사실만으로 우리가 짓는다.**
 *
 * API 의 `overview` 를 옮기지 않는 이유가 둘이다. ① 남의 문장을 전재하지 않는 것이 이
 * 섹션의 규범이고(§1), ② 공공누리가 허용하더라도 홍보 문구는 우리 화면의 문체와 어긋난다.
 * 그래서 아는 사실(지역)만 쓰고, **우리가 확인하지 않았다는 사실**을 함께 적는다 —
 * 원장의 54건은 사람이 공식 안내를 열어 봤지만 이 목록은 그렇지 않다. 그 차이를 카드가
 * 스스로 말하지 않으면 두 목록이 같은 무게로 읽힌다.
 */
export function composeSummary(region?: string): string {
  const where = region ? `${region} 일대에서 열려요. ` : '';
  return clampSummary(`${where}저희가 직접 확인한 일정이 아니라서, 가시기 전에 주최 쪽 안내를 한 번 봐 주세요.`);
}

/**
 * `detailCommon2` 의 `homepage` 에서 주소 하나를 꺼낸다.
 *
 * 그 칸은 주소가 아니라 **앵커 태그 문자열**이 온다(`<a href="https://…" target="_blank">…</a>`).
 * 게다가 여러 개가 이어 붙어 오기도 하고, `http://` 만 있는 곳도 있다.
 * **https 만 받는다** — 원장이 전 건을 https 로 확인해 실은 것과 같은 자다(§5-1).
 * 못 찾으면 `undefined` 이고, 그 축제는 카드를 세우지 않는다(제목이 곧 링크인 화면이다).
 */
export function firstHttpsUrl(homepage?: string): string | undefined {
  if (typeof homepage !== 'string' || homepage.length === 0) return undefined;
  const fromHref = /href\s*=\s*["']?(https:\/\/[^"'\s>]+)/i.exec(homepage)?.[1];
  const bare = /(https:\/\/[^\s"'<>]+)/i.exec(homepage)?.[1];
  const found = fromHref ?? bare;
  if (found === undefined) return undefined;
  // 앵커에서 잘라 온 주소 끝에 문장부호가 붙어 오는 일이 있다.
  const cleaned = found.replace(/[.,)"'\]]+$/, '');
  return cleaned.length > 'https://'.length ? cleaned : undefined;
}

/** `20260901` → `2026-09-01`. 여덟 자리가 아니거나 달·일이 범위를 벗어나면 `undefined`. */
export function toYmd(compact?: string | number): string | undefined {
  const raw = String(compact ?? '').trim();
  if (!/^\d{8}$/.test(raw)) return undefined;
  const month = Number(raw.slice(4, 6));
  const day = Number(raw.slice(6, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

/* ------------------------------------------------------------------ *
 * 4. 중복 — 원장이 이긴다
 * ------------------------------------------------------------------ */

/**
 * 제목 비교용 열쇠.
 *
 * 지우는 것: 괄호 주석 · `제27회` 같은 회차 · 네 자리 연도 · 글자가 아닌 것 전부.
 * 회차와 연도를 지우는 이유는 그 둘이 **해마다 바뀌는 부분**이라서다 — 남기면 같은
 * 축제의 올해 회차와 작년 회차가 다른 축제로 읽힌다.
 */
export function festivalTitleKey(title: string): string {
  return title
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[[〈《][^\]〉》]*[\]〉》]/g, ' ')
    .replace(/제?\s*\d+\s*회차?/g, ' ')
    .replace(/\d{4}\s*년?/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .toLowerCase();
}

/** 글자 두 개씩 끊은 집합. 한 글자짜리 열쇠는 자기 자신 하나를 담는다. */
function bigrams(text: string): Set<string> {
  if (text.length <= 1) return new Set(text ? [text] : []);
  const out = new Set<string>();
  for (let i = 0; i < text.length - 1; i += 1) out.add(text.slice(i, i + 2));
  return out;
}

/**
 * 두 제목이 같은 축제를 가리키는가 — Dice 계수 0.6 이 기준이다.
 *
 * 완전 일치나 포함만으로는 모자란다: 원장의 `제27회 함평모악산 꽃무릇축제` 와 API 의
 * `함평 꽃무릇축제` 는 서로를 포함하지 않는다(`모악산` 이 한쪽에만 있다). 글자 두 개씩
 * 끊어 겹치는 비율을 보면 0.67 이 나와 같은 것으로 읽히고, 남남인 `영광불갑산상사화축제`
 * 와는 0.11 이라 멀찍이 떨어진다. **0.6 은 그 사이를 가르는 자리**다.
 */
export function isSimilarTitle(a: string, b: string, threshold = 0.6): boolean {
  const left = festivalTitleKey(a);
  const right = festivalTitleKey(b);
  if (left.length === 0 || right.length === 0) return false;
  if (left === right) return true;
  if (left.length >= 4 && right.length >= 4 && (left.includes(right) || right.includes(left))) {
    return true;
  }

  const from = bigrams(left);
  const to = bigrams(right);
  let shared = 0;
  for (const gram of from) if (to.has(gram)) shared += 1;
  return (2 * shared) / (from.size + to.size) >= threshold;
}

/** 같은 회차로 볼 수 있는 기간인가 — 겹치거나, 시작일이 30일 안쪽으로 붙어 있으면 그렇다. */
export function isNearPeriod(
  a: { startsAt?: string; endsAt?: string },
  b: { startsAt?: string; endsAt?: string },
): boolean {
  if (!a.startsAt || !a.endsAt || !b.startsAt || !b.endsAt) return false;
  const overlaps = a.startsAt <= b.endsAt && b.startsAt <= a.endsAt;
  if (overlaps) return true;
  return Math.abs(daysBetween(a.startsAt, b.startsAt)) <= 30;
}

/**
 * 원장에 이미 있는 축제를 API 쪽에서 뗀다.
 *
 * 판정은 **제목 근사 + 기간 근사**를 둘 다 요구한다. 제목만 보면 같은 축제의 내년 회차가
 * 올해 것으로 덮이고(다른 행사인데 사라진다), 기간만 보면 같은 주에 열리는 남남이 서로를
 * 지운다. 둘을 곱해야 「같은 축제의 같은 회차」에만 걸린다.
 *
 * **이기는 쪽은 언제나 원장이다.** 사람이 공식 안내를 열어 보고 쓴 한 줄이 기계가 지어낸
 * 한 줄보다 낫고, 원장에는 도감으로 건너가는 다리도 붙어 있다.
 */
export function hideDuplicates<T extends { title: string; startsAt?: string; endsAt?: string }>(
  fetched: readonly T[],
  curated: readonly { title: string; startsAt?: string; endsAt?: string }[],
): T[] {
  return fetched.filter(
    (item) =>
      !curated.some((row) => isSimilarTitle(item.title, row.title) && isNearPeriod(item, row)),
  );
}

/* ------------------------------------------------------------------ *
 * 5. 카드로
 * ------------------------------------------------------------------ */

/**
 * 굳혀 둔 축제 한 건 → 화면이 그대로 그리는 카드.
 *
 * ⚠ 기간 문구(`periodLabel`)를 **여기서 반드시 붙인다.** 행사 카드의 첫 줄이자 갈지 말지를
 *   가르는 값인데, 빠뜨리면 카드가 지역만 달고 서고 아무도 그것을 오류로 읽지 않는다
 *   (2026-08-18 실측으로 실제 겪은 자리다 — 스크린샷에서 그 한 줄이 비어 있었다).
 *   문구의 원본은 `expiry.ts` 의 `readPeriodLabel` 하나다: 원장 카드와 **같은 함수**를
 *   지나야 「9월 1일 – 9월 6일」과 「7월 – 9월」의 규칙이 두 목록에서 같게 나온다.
 * ⚠ 반대로 **상태 배지는 여기서 만들지 않는다.** 그건 브라우저의 오늘을 봐야 하는 값이라
 *   서버가 굳히면 배포 날짜가 HTML 에 박힌다(§7-2).
 *
 * `flowers` 가 늘 비어 있는 것이 정상이다 — 도감으로 건너가는 다리는 사람이 원장에
 * 손으로 이은 값이라(§4-2), 기계가 제목만 보고 지어낼 수 있는 값이 아니다.
 */
export function toFestivalCard(record: FestivalRecord, kindLabel: string): ReadCard {
  const card: ReadCard = {
    id: record.id,
    kind: 'event',
    kindLabel,
    title: record.title,
    sourceTitle: FESTIVAL_PROVIDER,
    url: record.url,
    summary: record.summary,
    tags: festivalTags(record),
    startsAt: record.startsAt,
    endsAt: record.endsAt,
    access: 'open',
    provider: FESTIVAL_PROVIDER_LABEL,
    flowers: [],
  };
  if (record.region) card.region = record.region;

  const period = readPeriodLabel(record.startsAt, record.endsAt);
  if (period) card.periodLabel = period;

  return card;
}

/* ------------------------------------------------------------------ *
 * 6. 파일 읽기 — 여기만 디스크를 만진다 (서버 전용)
 * ------------------------------------------------------------------ */

/** 생성 산출물의 자리. 원장과 같은 뿌리(`DEARBLOOM_CONTENT_DIR`)를 쓰되 폴더를 나눈다. */
export function festivalsFilePath(): string {
  return path.join(resolveContentDir(), 'generated', 'festivals.json');
}

/** 파일이 있는데 모양이 깨졌을 때. 없는 것과는 **다르게** 다룬다(아래 머리말 참조). */
export class FestivalsLoadError extends Error {
  constructor(file: string, detail: string) {
    super(`축제 생성 파일이 깨졌습니다 (${file})\n${detail}`);
    this.name = 'FestivalsLoadError';
  }
}

/**
 * `content/generated/festivals.json` 을 읽는다.
 *
 * ── 없는 것과 깨진 것을 다르게 다룬다 ────────────────────────────────
 *   없다   → **빈 배열.** 키를 아직 신청하지 않았거나 한 번도 안 돌린 상태이고, 그때
 *            화면은 API 구획이 통째로 없는 모습으로 조용히 돈다. 정상 값이다.
 *   깨졌다 → **던진다.** 이건 우리가 만든 파일이라 깨질 이유가 없다. 반쪽을 싣느니
 *            빌드가 멈추는 게 낫다(`CatalogLoadError` 와 같은 판단).
 *
 * 수집 스크립트가 실패해도 **기존 파일을 지우지 않으므로**, API 가 죽은 날의 화면은
 * 마지막으로 성공한 목록 그대로다. 지난 행사는 브라우저가 자기 오늘로 숨긴다.
 */
export async function loadFestivals(): Promise<FestivalRecord[]> {
  const file = festivalsFilePath();

  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new FestivalsLoadError(file, error instanceof Error ? error.message : String(error));
  }

  const result = FestivalsFileSchema.safeParse(parsed);
  if (!result.success) {
    const lines = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(뿌리)'}: ${issue.message}`)
      .join('\n');
    throw new FestivalsLoadError(file, lines);
  }

  return result.data.festivals;
}
