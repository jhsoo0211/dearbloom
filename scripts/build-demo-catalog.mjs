/**
 * 정적 드롭 데모용 콘텐츠 번들 생성기 — `content/*.csv` → `src/lib/demo/data/*.ts`.
 *
 * ── 왜 필요한가 ──────────────────────────────────────────────────────
 * 본배포에서 추천은 서버 액션이 돌린다. `loadCatalog()` 가 `node:fs` 로 CSV 를 읽고,
 * 엔진(`recommend`)은 그 위에서 순수 함수로 계산한다. **엔진이 순수 함수라는 사실**이
 * 정적 데모의 전제다 — 서버가 없어도 같은 계산을 브라우저에서 그대로 할 수 있다.
 * 없는 것은 계산이 아니라 **데이터**뿐이라, 그 데이터를 빌드 타임에 한 번 굳혀 둔다.
 *
 * ── 검증 규칙을 두 번 쓰지 않는다 ────────────────────────────────────
 * 이 스크립트는 CSV 를 직접 파싱하지 않고 `loadCatalog()` 를 그대로 부른다
 * (그 안에서 `db/seed/schemas.ts` 의 행 스키마 + 교차 검증까지 돈다).
 * 즉 **서버가 읽는 것과 글자 하나까지 같은 값**이 데모로 넘어간다. 검증에 실패하면
 * 여기서 멈춘다 — 반쪽 데이터가 담긴 zip 이 나가는 것보다 빌드 실패가 낫다.
 *
 * ── 왜 `.ts` 문자열 상수인가 (JSON 파일이 아니라) ────────────────────
 * `import data from './catalog.json'` 은 TypeScript 가 그 JSON 전체를 **리터럴 타입**으로
 * 추론한다. 수십만 자짜리 리터럴 타입은 `next build` 의 타입 검사를 눈에 띄게 늦추고,
 * 그 비용을 **기본 빌드까지** 함께 문다(tsconfig 가 src 전부를 본다). 문자열 한 개면
 * 타입은 `string` 한 줄이라 그 비용이 0 이고, 런타임에도 `JSON.parse` 가 같은 크기의
 * 객체 리터럴을 파싱하는 것보다 빠르다.
 *
 * ── 실행 ─────────────────────────────────────────────────────────────
 *   npx tsx scripts/build-demo-catalog.mjs            (꽃당 이야기 기본값)
 *   npx tsx scripts/build-demo-catalog.mjs --stories 6
 *   npx tsx scripts/build-demo-catalog.mjs --stories all
 *
 * `npm run build:static` 이 빌드 앞에서 자동으로 부른다.
 */

import { gzipSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadCatalog } from '../src/lib/data/catalog.ts';
import { loadFestivals } from '../src/lib/data/reads-festivals.ts';
import {
  buildBirthDictDetail,
  buildBirthFlower,
  buildBirthMonth,
} from '../src/components/flowers/birth-dict.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'src', 'lib', 'demo', 'data');

/**
 * 꽃 한 종당 실어 보내는 이야기 편수의 기본값.
 *
 * 317편 전부면 JSON 이 400KB 를 넘는다. 결과 화면은 그 꽃의 이야기를 전부 목록으로
 * 내려보내지만(§1.5i), 데모에서 한 사람이 실제로 펼쳐 보는 것은 첫 몇 편이다.
 * `/stories` 아카이브는 이 값과 무관하다 — 그쪽은 빌드 타임에 굳은 페이지이고,
 * 시트 본문만 아래 `story-details` 번들이 **317편 전부** 들고 간다.
 */
const DEFAULT_STORIES_PER_FLOWER = 3;

function parseArgs(argv) {
  const args = { storiesPerFlower: DEFAULT_STORIES_PER_FLOWER };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] !== '--stories') continue;
    const raw = argv[i + 1];
    args.storiesPerFlower = raw === 'all' ? Number.POSITIVE_INFINITY : Number(raw);
    i += 1;
  }
  if (!(args.storiesPerFlower > 0)) {
    throw new Error('--stories 는 양의 정수이거나 all 이어야 합니다.');
  }
  return args;
}

/**
 * 꽃마다 앞에서 n 편씩.
 *
 * 난수를 쓰지 않는다 — 같은 CSV 로 두 번 돌리면 같은 번들이 나와야 드롭 zip 을
 * 비교할 수 있고, "이번 빌드에만 빠진 이야기" 같은 것이 생기지 않는다.
 * CSV 순서는 편집자가 정한 순서라 앞쪽이 그 꽃의 대표 이야기다.
 */
function slimStories(stories, perFlower) {
  if (perFlower === Number.POSITIVE_INFINITY) return stories;
  const seen = new Map();
  const kept = [];
  for (const story of stories) {
    const count = seen.get(story.flowerId) ?? 0;
    if (count >= perFlower) continue;
    seen.set(story.flowerId, count + 1);
    kept.push(story);
  }
  return kept;
}

/**
 * `/stories` 시트가 여는 이야기 한 편의 전문 — 원본은 `app/stories/actions.ts` 다.
 * 출처 규칙(창작만 면제)을 그쪽과 **같은 모양**으로 굳혀 둔다.
 */
function toStoryDetail(story) {
  const detail = { id: story.storyId, body: story.storyKo };
  if (story.storyType !== 'original' && story.sourceTitle) {
    detail.sourceTitle = story.sourceTitle;
    if (story.sourceUrl) detail.sourceUrl = story.sourceUrl;
  }
  return detail;
}

/**
 * `/flowers` 생일 찾기의 **답을 미리 다 내 둔 표** — `"8-16"` → 화면이 그대로 그리는 값.
 *
 * 조립을 손으로 베끼지 않고 `buildBirthFlower` 를 **그대로 부른다.** 예전에는 여기에
 * 같은 조립을 한 벌 더 적어 두었는데, 그 방식은 서버가 문장을 한 줄 고칠 때마다 데모가
 * 조용히 뒤처진다(받침 조사·도감 이름 대조·사진 크레딧이 전부 그 대상이다).
 * 모양의 원본은 `components/flowers/types.ts` 의 `BirthFlowerView` 다.
 */
function toBirthFlowerTable(catalog) {
  const table = {};
  for (const row of catalog.birthFlowers) {
    const view = buildBirthFlower(catalog, row.month, row.day);
    if (view) table[`${row.month}-${row.day}`] = view;
  }
  return table;
}

/**
 * `/flowers` **사전 시트**가 여는 하루치 — `"9-30"` → 사진 한 장과 그 이름의 이야기들.
 *
 * 셋 중 가장 무거운 번들이다(이야기 407편의 전문 + 사진 크레딧 274벌). 그래도 통째로
 * 굳히는 이유는 본배포와 **같은 지연 경계**를 지킬 수 있기 때문이다 — 이 파일은 시트를
 * 한 번이라도 연 사람만 받는다(`src/lib/demo/flowers-actions.ts` 의 `loadDetails`).
 *
 * 빈손인 날(`{ stories: [] }`)도 키를 만든다. `null`(그런 날짜가 없다)과 "그날은 사진도
 * 이야기도 없다"는 화면에서 다르게 그려지므로, 키를 빼면 정적 데모에서만 폴백 문구가 뜬다.
 */
function toBirthDetailTable(catalog) {
  const table = {};
  for (const row of catalog.birthFlowers) {
    const detail = buildBirthDictDetail(catalog, row.month, row.day);
    if (detail) table[`${row.month}-${row.day}`] = detail;
  }
  return table;
}

/**
 * `/flowers` **탄생화 사전**이 여는 한 달치 — `"3"` → 그달의 `BirthMonthView`.
 *
 * 위 `toBirthFlowerTable` 과 나란히 두는 이유는 같은 표에서 나오지만 **자르는 단위가
 * 다르기** 때문이다(하루 / 한 달). 그리고 여기서는 조립을 손으로 베끼지 않고
 * `buildBirthMonth` 를 **그대로 부른다** — 서버가 만드는 값과 글자 하나까지 같아야
 * 정적 데모에서만 다른 문장이 나오는 일이 없다(모양의 원본은 `components/flowers/types.ts`).
 */
function toBirthMonthTable(catalog) {
  const table = {};
  for (let month = 1; month <= 12; month += 1) {
    const view = buildBirthMonth(catalog, month);
    if (view) table[String(month)] = view;
  }
  return table;
}

/** `export const X = "…";` 한 줄짜리 모듈. 값은 JSON 문자열 그대로다. */
function toModule(name, value, headline) {
  const json = JSON.stringify(value);
  return [
    '/*',
    ` * ${headline}`,
    ' *',
    ' * ⚠ 생성 파일이다 — 손으로 고치지 마라.',
    ' *   원본은 `content/*.csv` 이고, 만드는 곳은 `scripts/build-demo-catalog.mjs` 다.',
    ' *   `npm run build:static` 이 빌드 앞에서 이 파일을 다시 쓴다.',
    ' *',
    ' * 문자열 한 개로 두는 이유는 생성기 머리말 참조(타입 검사 비용 · 파싱 속도).',
    ' */',
    '',
    `export const ${name} = ${JSON.stringify(json)};`,
    '',
  ].join('\n');
}

function sizeNote(text) {
  const raw = Buffer.byteLength(text, 'utf8');
  const gzip = gzipSync(Buffer.from(text, 'utf8')).length;
  return { raw, gzip };
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const catalog = await loadCatalog();
  /* API 축제는 카탈로그 밖의 **생성 산출물**이라 따로 읽는다(`content/generated/festivals.json`).
     없으면 빈 배열이다 — 키를 신청하지 않은 저장소에서도 이 스크립트가 그대로 돈다. */
  const festivals = await loadFestivals();

  /*
   * 추천·그룹이 쓰는 카탈로그.
   *
   * 담는 것: flowers · rules · meanings · templates · petSafety · quotes 는 **전부**.
   *   · flowers/rules  — 엔진 계산의 본체다. 한 줄이라도 빠지면 다른 꽃이 나온다.
   *   · meanings       — 색 칩의 꽃말 + 나라별 꽃말 표(§1.5d).
   *   · petSafety      — 반려동물 제외 규칙(EX_PET_TOXIC)과 대체 꽃 목록.
   *   · templates      — 데모의 멘트는 전부 이 예문이다(LLM 없음). 745B 밖에 안 된다.
   *   · quotes         — 함께 담을 한 줄(§1.5e) + 문학 속의 이 꽃(§1.5k).
   * 빼는 것: 탄생화 세 표(birthFlowers · birthPhotos · birthStories)는 여기 없다 —
   *   추천 경로가 한 번도 읽지 않는다. `/flowers` 가 쓰는 값이라 **따로** 번들한다
   *   (그 화면을, 그중에서도 그 기능을 쓴 사람만 받는다).
   *   `reads` 도 같은 이유로 비운다 — 아래 `reads.ts` 가 따로 든다.
   */
  const slim = {
    flowers: catalog.flowers,
    rules: catalog.rules,
    meanings: catalog.meanings,
    templates: catalog.templates,
    quotes: catalog.quotes,
    petSafety: catalog.petSafety,
    stories: slimStories(catalog.stories, args.storiesPerFlower),
    birthFlowers: [],
    birthPhotos: [],
    birthStories: [],
    reads: [],
  };

  const storyDetails = catalog.stories.map(toStoryDetail);
  const birthTable = toBirthFlowerTable(catalog);
  const birthMonths = toBirthMonthTable(catalog);
  const birthDetails = toBirthDetailTable(catalog);

  const files = [
    {
      name: 'catalog.ts',
      text: toModule(
        'DEMO_CATALOG_JSON',
        slim,
        '정적 데모용 슬림 카탈로그 — 추천(/recommend)·그룹(/groups) 계산의 재료.',
      ),
      label: `카탈로그 (이야기 ${slim.stories.length}편 / 전체 ${catalog.stories.length}편)`,
    },
    {
      name: 'story-details.ts',
      text: toModule(
        'DEMO_STORY_DETAILS_JSON',
        storyDetails,
        '정적 데모용 이야기 전문 — `/stories` 시트가 여는 한 편의 본문과 출처.',
      ),
      label: `이야기 전문 (${storyDetails.length}편)`,
    },
    {
      name: 'birth-flowers.ts',
      text: toModule(
        'DEMO_BIRTH_FLOWERS_JSON',
        birthTable,
        '정적 데모용 탄생화 표 — `/flowers` 생일 찾기가 여는 하루치 화면 값.',
      ),
      label: `탄생화 (${Object.keys(birthTable).length}일)`,
    },
    {
      name: 'birth-months.ts',
      text: toModule(
        'DEMO_BIRTH_MONTHS_JSON',
        birthMonths,
        '정적 데모용 탄생화 사전 — `/flowers` 사전 구획이 펼치는 한 달치 목록.',
      ),
      label: `탄생화 사전 (${Object.keys(birthMonths).length}달)`,
    },
    {
      name: 'birth-details.ts',
      text: toModule(
        'DEMO_BIRTH_DETAILS_JSON',
        birthDetails,
        '정적 데모용 탄생화 사전 상세 — 시트가 여는 하루치 사진과 이야기.',
      ),
      label: `탄생화 상세 (${Object.keys(birthDetails).length}일 · 이야기 ${catalog.birthStories.length}편 · 사진 ${catalog.birthPhotos.filter((photo) => photo.slug).length}장)`,
    },
    /*
     * 「읽을거리」 원장 그대로 한 벌.
     *
     * ⚠ **정적 데모의 `/reads` 는 이 파일을 읽지 않는다.** 그 화면은 서버 컴포넌트라
     *   빌드 타임에 HTML 로 굳고, 카드 54장이 이미 그 안에 들어 있다(서버 액션도, 지연
     *   로드도 없다 — 만료 거르기만 브라우저가 한다). 위 넷과 성질이 다른 자리다.
     *
     * 그런데도 굳혀 두는 이유는 **원장이 데모 zip 안에 있어야 하기 때문**이다: 드롭 데모를
     *   받은 사람이 목록의 근거를 열어 볼 수 있고, Supabase 로 옮긴 뒤에도 이 파일이
     *   "그때 그 배포가 실제로 들고 있던 54건" 을 그대로 증언한다. 그리고 색인·요약을
     *   쓰는 화면이 나중에 붙으면 그쪽이 이 번들을 그대로 집으면 된다.
     *   ⚠ 아무도 import 하지 않으므로 **번들에 실리지 않는다**(용량 0 기여).
     */
    {
      name: 'reads.ts',
      text: toModule(
        'DEMO_READS_JSON',
        catalog.reads,
        '정적 데모용 읽을거리 원장 — `/reads` 목록의 근거 54건(화면은 서버가 이미 굳혔다).',
      ),
      label: `읽을거리 (${catalog.reads.length}건 · 행사 ${catalog.reads.filter((read) => read.kind === 'event').length})`,
    },
    /*
     * API 축제 한 벌 — 위 `reads.ts` 와 **같은 성격**의 사이드카다.
     *
     * ⚠ 정적 데모의 `/reads` 는 이 파일도 읽지 않는다. 축제 카드는 빌드 타임에 이미
     *   HTML 로 굳었다(원장 카드와 같은 길을 탄다). 그런데도 굳혀 두는 이유가 원장과
     *   다르다: 이쪽은 **언제 받아 온 목록인지가 곧 근거**라, 드롭 zip 을 열어 본 사람이
     *   `fetchedAt` 과 창(`window`)을 확인할 수 있어야 한다. API 가 준 값과 화면에 실린
     *   값이 어긋났다는 신고가 들어오는 날, 대조할 원본이 zip 안에 있어야 한다.
     * ⚠ 아무도 import 하지 않으므로 **번들에 실리지 않는다**(용량 0 기여).
     * 목록이 비면 `[]` 한 줄이다 — 파일 자체는 늘 만든다(없는 파일과 빈 목록이 데모에서
     * 같은 모양이어야 한다).
     */
    {
      name: 'festivals.ts',
      text: toModule(
        'DEMO_FESTIVALS_JSON',
        festivals,
        '정적 데모용 API 축제 — 한국관광공사 TourAPI 에서 받아 굳힌 목록(화면은 서버가 이미 굳혔다).',
      ),
      label: `API 축제 (${festivals.length}건 · 한국관광공사)`,
    },
  ];

  await mkdir(OUT_DIR, { recursive: true });
  for (const file of files) {
    await writeFile(path.join(OUT_DIR, file.name), file.text, 'utf8');
  }

  console.log('[demo] src/lib/demo/data/ 갱신');
  let totalRaw = 0;
  let totalGzip = 0;
  for (const file of files) {
    const { raw, gzip } = sizeNote(file.text);
    totalRaw += raw;
    totalGzip += gzip;
    console.log(`  · ${file.name.padEnd(18)} ${kb(raw).padStart(8)}  (gzip ${kb(gzip)})  — ${file.label}`);
  }
  console.log(`  합계 ${kb(totalRaw)} (gzip ${kb(totalGzip)})`);
  console.log('  ※ 앞의 다섯은 지연 로드다 — 첫 화면이 아니라 그 기능을 처음 쓸 때 받는다.');
  console.log('  ※ reads.ts · festivals.ts 는 아무도 import 하지 않는다 — zip 안에 남는 근거지 번들이 아니다.');
}

await main();
