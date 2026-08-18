/**
 * 앞으로 여섯 달 안에 열리는 **꽃 축제**를 한국관광공사 TourAPI 에서 받아
 * `content/generated/festivals.json` 에 굳힌다 — `npm run reads:festivals`.
 *
 * ═══ 이 스크립트가 절대 하지 않는 일 ═══════════════════════════════════
 * · **`content/reads.csv` 를 건드리지 않는다.** 그 원장은 사람이 직접 열어 보고 고른
 *   54건이고, 여기서 받아 온 목록은 끝까지 다른 파일로 남는다(섞는 순간 원장의
 *   약속이 거짓이 된다 — `docs/reads-research.md` §1).
 * · **API 소개문(`overview`)을 옮기지 않는다.** 카드의 한 줄은 우리가 사실만으로
 *   짓는다(`composeSummary`). 공공누리가 허용하더라도 남의 문장은 전재하지 않는다.
 * · **이미지 주소를 담지 않는다.** `firstimage` 가 와도 버린다 — 이 섹션은 활자 카드이고
 *   남의 서버 이미지를 거는 것은 핫링크다(§2).
 *
 * ═══ 키가 없어도 성립한다 (이 설계의 요점) ═════════════════════════════
 * 어떤 실패에서도 **exit 0** 이고 기존 JSON 을 지우지 않는다. 파일이 아예 없으면 빈
 * 목록을 하나 써 두고 끝낸다. 그래야 키를 신청하지 않은 사람의 저장소에서도
 * `npm run build` 가 그대로 돈다 — API 가 죽는 날 화면이 깨지지 않는 것과 같은 성질이다.
 *
 * ═══ 실측 (2026-08-18) ═════════════════════════════════════════════════
 * 엔드포인트를 문서가 아니라 응답으로 확인했다. data.go.kr 게이트웨이는 **경로가 있으면**
 * 키 문제를(403), **없으면** 서비스 없음을(400) 돌려주므로 이 둘로 갈라 읽을 수 있다.
 *
 *   GET .../B551011/KorService2/searchFestival2  → 403 SERVICE_KEY_IS_NOT_REGISTERED_ERROR
 *   GET .../B551011/KorService2/detailCommon2    → 403 SERVICE_KEY_IS_NOT_REGISTERED_ERROR
 *   GET .../B551011/KorService1/searchFestival1  → 400 NO_OPENAPI_SERVICE_ERROR (폐기)
 *   GET .../B551011/KorService2/<없는이름>       → 400 NO_OPENAPI_SERVICE_ERROR
 *
 * 즉 **KorService2 가 살아 있는 판(TourAPI 4.0)** 이고, 우리 공용 인증키는 이 서비스에
 * **활용신청이 안 돼 있다.** 신청 뒤 다시 돌리면 그날부터 목록이 찬다.
 *
 * ═══ 라이선스 ══════════════════════════════════════════════════════════
 * data.go.kr 15101578(한국관광공사_국문 관광정보 서비스_GW) 안내 기준:
 * 이용허락범위 **제한 없음**, **공공누리 제1유형**(이미지만 제3유형), 무료,
 * 활용신청은 개발단계 자동승인 · 운영단계 심의승인.
 * 제1유형은 **출처표시**가 의무다 — 화면에서는 카드마다 `한국관광공사 제공` 라벨이,
 * 푸터에서는 각주 한 줄이 그 의무를 진다. 우리는 사진을 쓰지 않으므로 제3유형은
 * 애초에 적용될 자리가 없다.
 *
 * ═══ 실행 ══════════════════════════════════════════════════════════════
 *   npm run reads:festivals                 # 앞으로 6개월
 *   npm run reads:festivals -- --months 12  # 창을 넓힌다
 *   npm run reads:festivals -- --keep-all   # 꽃 어휘 필터를 끄고 전량을 본다(조사용)
 *
 * ⚠ **tsx 로 돈다.** `src/lib/data/reads-festivals.ts` 를 import 하고 그쪽이 다시
 *   `db/seed/*` 로 내려가는데, 그 import 들은 확장자가 없어 순수 ESM 해석기가 못 찾는다
 *   (`build-demo-catalog.mjs` 와 같은 이유).
 * ⚠ **키를 찍지 마라.** 로그·오류 메시지·생성 파일 어디에도 값이 새면 안 된다.
 *   이 파일이 키를 다루는 곳은 URL 을 만드는 `buildUrl` 한 군데뿐이고, 그 URL 을
 *   그대로 출력하는 경로는 없다.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  composeSummary,
  festivalsFilePath,
  firstHttpsUrl,
  isFlowerFestival,
  shortRegion,
  toYmd,
  FESTIVAL_PROVIDER,
} from '../src/lib/data/reads-festivals.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ *
 * 설정
 * ------------------------------------------------------------------ */

/** TourAPI 4.0 국문 관광정보. 위 「실측」 절이 이 경로가 살아 있음을 확인한 근거다. */
const BASE = 'https://apis.data.go.kr/B551011/KorService2';
const SERVICE_LABEL = 'TourAPI 국문 관광정보(KorService2) · searchFestival2';
const LICENSE_LABEL = '공공누리 제1유형(출처표시) — 출처: 한국관광공사';

/** 한 장에 100건. 게이트웨이 기본 상한이 넉넉하지만 응답이 커지면 타임아웃이 는다. */
const PAGE_SIZE = 100;
/** 페이지 수 상한 — 창이 6개월이면 국내 축제 전량이 수천 건 규모라 여기서 멈출 일은 없다. */
const MAX_PAGES = 40;
/** 요청 시작 간격(ms) — 공공 API 에 연달아 붙지 않는다(`fetch-birth-photos.mjs` 와 같은 예절). */
const REQUEST_GAP = 350;
/** 재시도 간격(ms). 상한 두 번 — 세 번째도 실패하면 그 페이지는 포기한다. */
const RETRY_DELAYS = [1500, 5000];
/** 한 요청이 이 시간을 넘기면 끊는다. 게이트웨이가 가끔 붙잡고 놓지 않는다. */
const TIMEOUT_MS = 20_000;

/** data.go.kr 이 「사용처」로 읽는 값. 우리 이름을 정직하게 적는다. */
const MOBILE_APP = 'dearbloom';

const OUT_FILE = festivalsFilePath();

/* ------------------------------------------------------------------ *
 * 인자
 * ------------------------------------------------------------------ */

function parseArgs(argv) {
  const args = { months: 6, keepAll: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--keep-all') args.keepAll = true;
    if (argv[i] === '--months') {
      args.months = Number(argv[i + 1]);
      i += 1;
    }
  }
  if (!Number.isInteger(args.months) || args.months < 1 || args.months > 24) {
    throw new Error('--months 는 1~24 사이의 정수여야 합니다.');
  }
  return args;
}

/* ------------------------------------------------------------------ *
 * 날짜 — KST 로만 센다
 * ------------------------------------------------------------------ */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** KST 기준 오늘 `YYYY-MM-DD`. `expiry.ts` 의 `todayInKst` 와 같은 셈이다. */
function todayInKst(now) {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` 에서 n 달 뒤. 말일 넘침은 그 달 말일로 접는다(3/31 + 1달 = 4/30). */
function addMonths(ymd, months) {
  const [year, month, day] = ymd.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

/** `2026-09-01` → `20260901`. API 가 붙여 쓴 여덟 자리만 받는다. */
const compact = (ymd) => ymd.replace(/-/g, '');

/* ------------------------------------------------------------------ *
 * 요청
 * ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

let nextSlot = 0;
/** 요청 시작 시각을 줄 세우는 문지기(`fetch-birth-photos.mjs` 와 같은 장치). */
async function waitForSlot() {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + REQUEST_GAP;
  if (at > now) await sleep(at - now);
}

/**
 * 인증키를 URL 에 넣을 모양으로.
 *
 * 공공데이터포털은 **인코딩된 키**와 **디코딩된 키**를 둘 다 준다. 인코딩된 것을 다시
 * 인코딩하면 `%2F` 가 `%252F` 가 되어 조용히 인증에 실패한다 — 그래서 `%` 가 이미 들어
 * 있으면 그대로 쓰고, 아니면 우리가 인코딩한다. (`.env.example` 은 인코딩된 키를 붙이라고
 * 안내한다.)
 */
function encodeKey(key) {
  return key.includes('%') ? key : encodeURIComponent(key);
}

/**
 * 질의 URL 한 개.
 *
 * ⚠ `serviceKey` 만 `URLSearchParams` 를 태우지 않고 직접 이어 붙인다. 그쪽에 넣으면
 *   이미 퍼센트 인코딩된 키가 한 번 더 인코딩된다.
 */
function buildUrl(operation, key, params) {
  const query = new URLSearchParams({
    MobileOS: 'ETC',
    MobileApp: MOBILE_APP,
    _type: 'json',
    ...params,
  });
  return `${BASE}/${operation}?serviceKey=${encodeKey(key)}&${query.toString()}`;
}

/** 게이트웨이가 오류를 알리는 두 가지 봉투 중 무엇이든 한 줄로 만든다. 없으면 `null`. */
function gatewayError(payload) {
  const header =
    payload?.OpenAPI_ServiceResponse?.cmmMsgHeader ?? payload?.cmmMsgHeader ?? null;
  if (header) {
    return {
      code: String(header.errMsg ?? header.returnReasonCode ?? 'UNKNOWN'),
      message: String(header.returnAuthMsg ?? header.errMsg ?? '알 수 없는 오류'),
    };
  }
  const result = payload?.response?.header;
  if (result && String(result.resultCode) !== '0000') {
    return {
      code: String(result.resultCode ?? 'UNKNOWN'),
      message: String(result.resultMsg ?? '알 수 없는 오류'),
    };
  }
  return null;
}

/** 던지는 오류에 게이트웨이 코드를 실어 보낸다 — 위쪽이 안내 문구를 고르는 근거다. */
class ApiError extends Error {
  constructor(code, message) {
    super(`${code} — ${message}`);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * 한 번 부르고 JSON 으로 읽는다. 재시도는 부르는 쪽이 한다.
 *
 * ⚠ `_type=json` 을 줘도 **오류일 때는 XML 이 오는 경우가 있다.** 그때 `JSON.parse` 가
 *   던지는 메시지는 아무 도움이 안 되므로, 본문 앞머리에서 `<errMsg>` 를 긁어 말이 되는
 *   오류로 바꾼다.
 */
async function callApi(url) {
  await waitForSlot();

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await response.text();

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    const code = /<errMsg>([^<]+)<\/errMsg>/.exec(text)?.[1];
    const reason = /<returnAuthMsg>([^<]+)<\/returnAuthMsg>/.exec(text)?.[1];
    throw new ApiError(code ?? `HTTP_${response.status}`, reason ?? 'JSON 이 아닌 응답');
  }

  const failure = gatewayError(payload);
  if (failure) throw new ApiError(failure.code, failure.message);
  if (!response.ok) throw new ApiError(`HTTP_${response.status}`, response.statusText);

  return payload;
}

/** 재시도까지 감싼 호출. 키 문제는 **재시도해도 소용없으므로** 곧장 던진다. */
async function callWithRetry(url) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await callApi(url);
    } catch (error) {
      const fatal = error instanceof ApiError && /SERVICE_KEY|NO_OPENAPI|LIMITED_NUMBER/.test(error.code);
      if (fatal || attempt >= RETRY_DELAYS.length) throw error;
      await sleep(RETRY_DELAYS[attempt]);
    }
  }
}

/* ------------------------------------------------------------------ *
 * 응답 읽기
 * ------------------------------------------------------------------ */

/**
 * `response.body.items.item` 을 배열로.
 *
 * 이 API 는 결과가 0건이면 `items` 가 **빈 문자열**이고, 1건이면 배열이 아니라 **객체
 * 하나**다. 두 경우를 다 배열로 만들어 주지 않으면 호출부가 매번 같은 방어를 쓴다.
 */
function itemsOf(payload) {
  const items = payload?.response?.body?.items;
  if (!items || typeof items !== 'object') return [];
  const item = items.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function totalCountOf(payload) {
  const total = Number(payload?.response?.body?.totalCount);
  return Number.isFinite(total) ? total : 0;
}

/* ------------------------------------------------------------------ *
 * 수집
 * ------------------------------------------------------------------ */

/**
 * 창에 걸치는 축제 전량.
 *
 * `eventStartDate`·`eventEndDate` 는 **행사 기간이 그 창에 걸치는 것**을 고르는 자다
 * (시작일이 창 안에 있는 것만 고르는 게 아니다) — 그래서 이미 열려 있는 축제도 잡힌다.
 * `arrange=A`(제목순)를 쓰는 이유는 페이지를 넘겨도 순서가 흔들리지 않게 하기 위해서다.
 * 수정일순으로 두면 수집 도중 갱신된 행이 페이지 사이를 옮겨 다니며 빠지거나 겹친다.
 */
async function collectFestivals(key, from, to) {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const payload = await callWithRetry(
      buildUrl('searchFestival2', key, {
        numOfRows: String(PAGE_SIZE),
        pageNo: String(page),
        arrange: 'A',
        eventStartDate: compact(from),
        eventEndDate: compact(to),
      }),
    );

    const items = itemsOf(payload);
    all.push(...items);
    const total = totalCountOf(payload);
    if (items.length === 0 || all.length >= total) {
      return { items: all, total };
    }
  }
  console.log(`  ⚠ 페이지 상한(${MAX_PAGES})에서 멈췄습니다 — 창을 좁혀 다시 돌려 보세요.`);
  return { items: all, total: all.length };
}

/**
 * 후보 한 건의 **주최 페이지 주소**를 찾는다.
 *
 * `searchFestival2` 응답에는 홈페이지 칸이 없어 `detailCommon2` 를 한 번 더 부른다.
 * 여기서 함께 오는 `overview`(소개문)는 **거르기에만** 쓰고 저장하지 않는다 — 제목만으로는
 * 「○○ 문화제」처럼 이름에 꽃이 없는 꽃 축제를 놓치고, 반대로 소개문에 꽃 이야기가
 * 스치기만 한 축제를 주울 수도 있어서, 제목이 이미 통과한 건의 **부정 어휘만** 다시 본다.
 */
async function fetchDetail(key, contentId) {
  const payload = await callWithRetry(
    buildUrl('detailCommon2', key, {
      contentId: String(contentId),
      numOfRows: '1',
      pageNo: '1',
    }),
  );
  const item = itemsOf(payload)[0];
  if (!item) return null;
  return {
    url: firstHttpsUrl(item.homepage),
    overview: typeof item.overview === 'string' ? item.overview : '',
  };
}

/* ------------------------------------------------------------------ *
 * 파일
 * ------------------------------------------------------------------ */

function emptyFile(from, to) {
  return {
    fetchedAt: new Date().toISOString(),
    source: { provider: FESTIVAL_PROVIDER, service: SERVICE_LABEL, license: LICENSE_LABEL },
    window: { from, to },
    festivals: [],
  };
}

/** 파일이 이미 있는가. 실패했을 때 **덮어쓰지 않기 위해** 먼저 묻는다. */
async function fileExists() {
  try {
    await readFile(OUT_FILE, 'utf8');
    return true;
  } catch {
    return false;
  }
}

async function writeOut(payload) {
  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

/**
 * 실패로 끝낸다 — **exit 0 이다.**
 *
 * 기존 파일이 있으면 손대지 않는다(마지막으로 성공한 목록이 그대로 남는다).
 * 없으면 빈 목록을 하나 써 둔다 — 그래야 로더가 「아직 안 돌렸다」와 「받았는데 0건」을
 * 같은 모양으로 다루고, 빌드가 이 스크립트의 성공 여부와 무관해진다.
 *
 * ⚠ **`process.exit()` 를 부르지 마라.** 부르는 쪽에서 `return` 으로 끝내야 한다.
 *   tsx 아래 Windows 에서 `process.exit()` 를 밟으면 libuv 가 열려 있는 핸들을 두고
 *   내려가며 `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` 로 **abort** 하고,
 *   그 순간 종료 코드가 0 이 아니게 된다(실측 127). 「어떤 실패에서도 exit 0」이 이
 *   스크립트의 요점인데 그 요점이 종료 방식 하나로 무너지는 자리다.
 */
async function giveUp(from, to, lines) {
  for (const line of lines) console.log(line);
  if (await fileExists()) {
    console.log(`  · 기존 ${path.relative(ROOT, OUT_FILE)} 를 그대로 둡니다.`);
  } else {
    await writeOut(emptyFile(from, to));
    console.log(`  · 빈 목록을 써 두었습니다 — ${path.relative(ROOT, OUT_FILE)}`);
  }
  console.log('  · 화면은 축제 구획 없이 그대로 돕니다(빌드는 깨지지 않습니다).');
}

/** 키 문제를 **콕 집어** 안내한다. 여기서 두루뭉술하면 다음 사람이 키를 의심하며 헤맨다. */
function adviceFor(code) {
  if (code === 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR' || code === '30') {
    return [
      '  · 키 자체는 살아 있지만 **이 서비스에 활용신청이 안 돼 있습니다.**',
      '    data.go.kr → "한국관광공사_국문 관광정보 서비스_GW"(15101578) → 활용신청.',
      '    개발단계는 자동승인이라 신청 직후 열리고, 반영까지 몇 분에서 한 시간쯤 걸립니다.',
    ];
  }
  if (code === 'NO_OPENAPI_SERVICE_ERROR' || code === '12') {
    return [
      '  · 그 경로의 오픈API 가 없거나 폐기됐습니다. TourAPI 판이 올라갔을 수 있으니',
      '    data.go.kr 공지에서 현재 서비스 이름(KorService*)을 확인하고 BASE 를 고쳐 주세요.',
    ];
  }
  if (code === 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR' || code === '22') {
    return ['  · 일일 트래픽 상한을 넘겼습니다. 내일 다시 돌리거나 운영단계 신청으로 상한을 올리세요.'];
  }
  return ['  · 잠시 뒤 다시 시도해 보고, 계속 같으면 data.go.kr 서비스 상태를 확인해 주세요.'];
}

/* ------------------------------------------------------------------ *
 * 본체
 * ------------------------------------------------------------------ */

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const from = todayInKst(new Date());
  const to = addMonths(from, args.months);
  console.log(`[festivals] ${from} ~ ${to} (${args.months}개월) 안에 걸치는 꽃 축제`);

  // `.env.example` 은 `DATA_GO_KR_API_KEY`, 실제 `.env` 는 `DATA_GO_API_KEY` 로 적혀 있다.
  // 둘 다 받는다 — 이름 하나 때문에 "키가 없다" 고 말하는 것이 가장 나쁜 안내다.
  const key = process.env.DATA_GO_API_KEY ?? process.env.DATA_GO_KR_API_KEY ?? '';
  if (key.length === 0) {
    return giveUp(from, to, [
      '  ✗ 공공데이터포털 인증키가 없습니다.',
      '  · .env 에 DATA_GO_API_KEY(또는 DATA_GO_KR_API_KEY)를 넣어 주세요.',
      '    마이페이지의 **인코딩된** 키를 그대로 붙입니다(다시 인코딩하면 깨집니다).',
    ]);
  }

  let raw;
  try {
    raw = await collectFestivals(key, from, to);
  } catch (error) {
    const code = error instanceof ApiError ? error.code : 'NETWORK';
    const message = error instanceof Error ? error.message : String(error);
    return giveUp(from, to, [`  ✗ 축제 목록을 받지 못했습니다 — ${message}`, ...adviceFor(code)]);
  }

  console.log(`  · 창에 걸치는 축제 ${raw.items.length}건 (게이트웨이가 말한 전체 ${raw.total}건)`);

  /* 1차 — 제목으로 거른다. 여기서 대부분이 빠지므로 상세 호출이 몇 십 건으로 줄어든다. */
  const candidates = args.keepAll
    ? raw.items
    : raw.items.filter((item) => isFlowerFestival(item.title));
  console.log(`  · 꽃 어휘 통과 ${candidates.length}건${args.keepAll ? ' (--keep-all: 필터 끔)' : ''}`);

  /* 2차 — 상세를 열어 주최 페이지 주소를 찾고, 소개문으로 오탐을 한 번 더 턴다. */
  const festivals = [];
  const dropped = { noDate: 0, noUrl: 0, negative: 0, failed: 0 };

  for (const item of candidates) {
    const startsAt = toYmd(item.eventstartdate);
    const endsAt = toYmd(item.eventenddate);
    // 날짜가 없거나 거꾸로면 만료를 판정할 수 없다 — 영영 안 사라지는 행을 만들지 않는다(§6-2).
    if (!startsAt || !endsAt || endsAt < startsAt) {
      dropped.noDate += 1;
      continue;
    }

    let detail;
    try {
      detail = await fetchDetail(key, item.contentid);
    } catch {
      dropped.failed += 1;
      continue;
    }

    if (!detail?.url) {
      // 갈 곳이 없으면 카드를 세우지 않는다 — 제목이 곧 링크인 화면이다.
      dropped.noUrl += 1;
      continue;
    }
    if (!args.keepAll && !isFlowerFestival(item.title, detail.overview)) {
      dropped.negative += 1;
      continue;
    }

    const region = shortRegion(item.addr1);
    const record = {
      id: `festival-${item.contentid}`,
      title: String(item.title ?? '').trim(),
      startsAt,
      endsAt,
      url: detail.url,
      summary: composeSummary(region),
    };
    if (region) record.region = region;
    festivals.push(record);
  }

  // 같은 입력이 같은 파일을 내야 한다 — 종료일·id 순으로 굳힌다(화면 정렬과 같은 자다).
  festivals.sort((a, b) => a.endsAt.localeCompare(b.endsAt) || a.id.localeCompare(b.id));

  await writeOut({
    fetchedAt: new Date().toISOString(),
    source: { provider: FESTIVAL_PROVIDER, service: SERVICE_LABEL, license: LICENSE_LABEL },
    window: { from, to },
    festivals,
  });

  console.log(`  · 담은 축제 ${festivals.length}건 → ${path.relative(ROOT, OUT_FILE)}`);
  console.log(
    `    (뺀 것 — 날짜 결손 ${dropped.noDate} · 주최 페이지 없음 ${dropped.noUrl} · 소개문 재검 탈락 ${dropped.negative} · 상세 실패 ${dropped.failed})`,
  );
  console.log('  ※ 화면 표기 의무: 카드 라벨과 푸터 각주가 출처(한국관광공사)를 답니다.');
}

await main();
