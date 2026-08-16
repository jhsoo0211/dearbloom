/**
 * 탄생화 실사 248장을 `public/birth/` 에 **JPEG 두 규격으로** 놓는다 — 자체 호스팅 자산 관리.
 *
 * 도판(`scripts/fetch-plates.mjs`)의 선례를 그대로 따르되 세 가지가 다르다.
 *   ① **표가 코드가 아니라 CSV 다.** 목록은 `content/birth_photos.csv` 이고, 이 스크립트는
 *      `loadCatalog()` 를 통과시켜 읽는다 — 화면이 읽는 것과 **글자 하나까지 같은 값**이고
 *      시드 교차 검증(날짜·이름 대조, slug 유일성, 라이선스 허용 목록)도 함께 돈다.
 *   ② **폭이 다르다.** 사전 시트가 960px 을, 목록 줄과 생일 찾기 카드가 320px 을 쓴다
 *      (규격의 원본은 `src/lib/birth-photos/index.ts` — 여기 숫자를 다시 적지 않는다).
 *   ③ **동시 2연결 + 요청 간격 250ms.** 도판은 1연결·500ms 였는데, 248장이면 그 속도로
 *      2분이 넘는다. 실측(2026-08-16 전량 1회차)으로는 이 조합이 238장까지 무사히 가고
 *      **막바지 10장에서 429 를 물었다** — 커먼즈의 스로틀은 순간 속도만이 아니라 누적
 *      요청량도 본다. 그래서 재시도 간격을 5초·15초로 크게 벌려 두었고, 그래도 남으면
 *      **한 번 더 실행하는 것이 정답**이다(받아 둔 파일은 건너뛰므로 남은 것만 받는다 —
 *      2회차에서 10장 전부 성공, 최종 248/248).
 *
 * 사용(**tsx 로 돈다** — 아래 ⚠ 참조):
 *   npm run birth:photos                  # 없는 것만 채운다
 *   npm run birth:photos -- --reencode    # 있는 파일을 다시 정규화한다(네트워크 안 씀)
 *   npm run birth:photos -- --force       # 전부 다시 받아 다시 정규화한다
 *
 * ⚠ **원본 바이트는 보관하지 않는다.** 리포에는 정규화 산출물 두 벌만 남는다 —
 *   재현성은 CSV 의 `direct_url` 이 담보한다(`--force` 로 언제든 원본에서 다시 만든다).
 *
 * ⚠ **사진 위에 글자를 합성하지 않는다.** 274장 중 218장이 CC BY / CC BY-SA 이고,
 *   폭만 줄인 사본은 이미 파생물이다 — 거기에 글자까지 얹으면 또 다른 파생물이 된다.
 *   크레딧은 화면(사전 시트의 `출처 ›` 디스클로저)이 저작자·라이선스 라벨·원본 링크로 단다.
 *
 * ── 왜 받아 두는가 ───────────────────────────────────────────────────
 * 라이선스가 허용하는 것(PD·CC0·CC BY·CC BY-SA — 시드가 강제한다)과 위키미디어의 배달
 * 정책은 다른 문제다. 커먼즈는 핫링크를 만류하고 연속 요청에 `HTTP 429` 를 돌려주는데,
 * 사전 목록 한 달은 썸네일을 서른한 장 동시에 부른다 — 그 상태가 그대로 재현된다.
 * (도판이 겪은 것과 같은 자리라 같은 답을 쓴다.)
 *
 * ⚠ **`node` 로 직접 부르지 마라 — `tsx` 가 필요하다.** 도판 스크립트는 확장자까지 적힌
 *   모듈 하나만 읽어서 node 24 의 타입 스트리핑으로 충분했지만, 여기는 `loadCatalog()` 를
 *   타고 `db/seed/*` 로 내려간다. 그쪽 import 는 확장자가 없어(`'./parse'`) 순수 ESM 해석기가
 *   찾지 못한다 — `npm run build:static` 이 데모 생성기를 tsx 로 부르는 것과 같은 이유다.
 * ⚠ `sharp` 의존은 **스크립트에만** 둔다. `src/lib/birth-photos/index.ts` 는 서버가
 *   import 하는 순수 모듈이라 네이티브 바이너리를 끌어들이면 안 된다.
 */

import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { loadCatalog } from '../src/lib/data/catalog.ts';
import {
  BIRTH_PHOTO_WIDTH,
  BIRTH_THUMB_WIDTH,
  birthPhotoSrc,
  birthThumbSrc,
} from '../src/lib/birth-photos/index.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 위키미디어 정책이 요구하는 형태 — 무엇이 부르는지와 연락처가 함께 있어야 한다. */
const USER_AGENT =
  'dearbloomBot/1.0 (flower-gift service asset fetch; contact: regrip.gy@gmail.com)';

/**
 * 동시에 여는 연결 수와 **요청 시작 간격**(ms).
 *
 * 둘을 함께 봐야 뜻이 있다: 연결이 둘이어도 시작 시각을 250ms 씩 벌리므로 초당 요청은
 * 4건을 넘지 않는다. 커먼즈가 429 없이 받아 주는 자리를 실측으로 찾은 값이다.
 */
const CONCURRENCY = 2;
const REQUEST_GAP = 250;
/**
 * 재시도 간격(ms) — 1차 5초, 2차 15초.
 *
 * 도판 스크립트의 2초로는 모자랐다. 429 는 그 요청 하나가 빨라서가 아니라 **봇 전체가
 * 잠시 막혀서** 나오는 응답이라, 몇 초로는 같은 벽을 다시 친다(실측 1회차에서 10장이
 * 세 번 다 429 를 물었다). 대신 이 값이 커도 전체 시간에는 거의 영향이 없다 —
 * 성공하는 경로는 이 지연을 한 번도 지나가지 않는다.
 */
const RETRY_DELAYS = [5000, 15000];
/** 한 장당 시도 횟수(첫 시도 + 재시도 2회). */
const ATTEMPTS = RETRY_DELAYS.length + 1;

/** JPEG 품질. 80 은 실사에서 눈에 띄는 손실 없이 크기가 확 떨어지는 자리다. */
const JPEG_QUALITY = 80;
/** 알파를 걷어낼 때 깔 색. 실사에 알파가 있는 경우는 드물지만 PNG 판본이 섞여 온다. */
const FLATTEN_BG = '#ffffff';

const force = process.argv.includes('--force');
const reencode = process.argv.includes('--reencode');

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function human(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** 이미 받아 둔 파일인지. 0바이트로 남은 잔해는 없는 것으로 친다. */
async function existingSize(target) {
  try {
    const info = await stat(target);
    return info.isFile() && info.size > 0 ? info.size : 0;
  } catch {
    return 0;
  }
}

/**
 * 요청 시작 시각을 줄 세우는 문지기.
 *
 * 연결이 둘이라 두 작업자가 동시에 `fetch` 를 부를 수 있는데, 그러면 실측으로 잡은
 * 250ms 간격이 무너진다. 마지막 요청 시각을 공유 변수로 들고 **다음 슬롯까지 기다린 뒤**
 * 도장을 찍어 주는 함수 하나로 그 간격을 지킨다.
 */
let nextSlot = 0;
async function waitForSlot() {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + REQUEST_GAP;
  if (at > now) await sleep(at - now);
}

async function download(url) {
  await waitForSlot();
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'image/jpeg,image/png,image/*;q=0.8',
      'Accept-Language': 'en',
    },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) {
    throw new Error(`이미지가 아니다 — content-type: ${type || '없음'}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0) throw new Error('본문이 비었다(0바이트)');
  return bytes;
}

/**
 * 어떤 입력이 오든 **같은 규격의 JPEG** 한 장으로.
 * `.rotate()` 는 EXIF 방향을 픽셀에 굽는다 — 재인코딩하면 EXIF 가 사라지므로,
 * 굽지 않으면 원본이 세워 두던 사진이 눕는다(도판 스크립트와 같은 이유).
 */
async function normalize(bytes, width) {
  const before = await sharp(bytes).metadata();

  let pipeline = sharp(bytes).rotate().resize({ width, withoutEnlargement: true });
  if (before.hasAlpha) pipeline = pipeline.flatten({ background: FLATTEN_BG });

  const { data, info } = await pipeline
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  return { data, before, after: info };
}

/** `/birth/x.jpg` → `<root>/public/birth/x.jpg`. 경로는 모듈이 정한다(여기서 다시 적지 않는다). */
function publicPath(webPath) {
  return path.join(ROOT, 'public', webPath.replace(/^\//, ''));
}

async function writeImage(target, data) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

/**
 * 한 장을 끝까지 책임진다 — 내려받기 → 본판 → 썸네일.
 * 실패는 던지지 않고 결과 객체로 돌려준다(한 장이 죽어도 나머지 247장은 받는다).
 */
async function fetchOne(job) {
  const target = publicPath(birthPhotoSrc(job.slug));
  const thumbTarget = publicPath(birthThumbSrc(job.slug));

  const already = await existingSize(target);
  const thumbAlready = await existingSize(thumbTarget);

  if (already > 0 && thumbAlready > 0 && !force && !reencode) {
    return { kind: 'skipped', job, bytes: already, thumbBytes: thumbAlready };
  }

  let raw = null;
  let lastError = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      raw = await download(job.directUrl);
      break;
    } catch (error) {
      lastError = error;
      if (attempt < ATTEMPTS) await sleep(RETRY_DELAYS[attempt - 1]);
    }
  }
  if (!raw) return { kind: 'failed', job, message: lastError?.message ?? '알 수 없는 실패' };

  try {
    const main = await normalize(raw, BIRTH_PHOTO_WIDTH);
    await writeImage(target, main.data);
    // 썸네일은 **본판을 다시 줄여** 만든다 — 회전·flatten 이 이미 픽셀에 구워져 있어
    // 두 파일이 다른 그림이 될 틈이 없다(도판 스크립트와 같은 수법).
    const thumb = await normalize(main.data, BIRTH_THUMB_WIDTH);
    await writeImage(thumbTarget, thumb.data);

    return {
      kind: 'written',
      job,
      bytes: main.data.byteLength,
      thumbBytes: thumb.data.byteLength,
      from: `${main.before.format} ${main.before.width}×${main.before.height} ${human(raw.byteLength)}`,
      to: `${main.after.width}×${main.after.height}`,
      thumbTo: `${thumb.after.width}×${thumb.after.height}`,
    };
  } catch (error) {
    return { kind: 'failed', job, message: `정규화 실패: ${error.message}` };
  }
}

async function main() {
  const catalog = await loadCatalog();

  /**
   * slug 하나가 파일 한 장이다 — 같은 이름의 여러 날이 같은 사진을 들면 **한 번만** 받는다
   * (280행 → 274일 확보 → 248장). 미확보 6일은 slug 자체가 없어 여기서 자연히 빠진다.
   */
  const jobs = new Map();
  for (const photo of catalog.birthPhotos) {
    if (!photo.slug || !photo.directUrl) continue;
    if (!jobs.has(photo.slug)) {
      jobs.set(photo.slug, { slug: photo.slug, nameKo: photo.nameKo, directUrl: photo.directUrl });
    }
  }
  const queue = [...jobs.values()];

  const mode = force
    ? ' (--force: 전부 다시 받음)'
    : reencode
      ? ' (--reencode: 전부 다시 정규화)'
      : '';
  console.log(
    `[birth] ${queue.length}장 — 저장 위치 public/birth · 본판 ${BIRTH_PHOTO_WIDTH}px · 썸네일 ${BIRTH_THUMB_WIDTH}px · JPEG q${JPEG_QUALITY}` +
      ` · 동시 ${CONCURRENCY}연결 · 요청 간격 ${REQUEST_GAP}ms${mode}`,
  );

  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < queue.length) {
      const index = cursor;
      cursor += 1;
      const result = await fetchOne(queue[index]);
      results.push(result);

      const mark = `${String(results.length).padStart(3, ' ')}/${queue.length}`;
      if (result.kind === 'written') {
        console.log(
          `${mark} [정규화] ${result.job.slug} — ${result.from} → jpg ${result.to} ${human(result.bytes)}` +
            ` · 썸 ${result.thumbTo} ${human(result.thumbBytes)}`,
        );
      } else if (result.kind === 'skipped') {
        console.log(
          `${mark} [있음]   ${result.job.slug} — ${human(result.bytes)} + 썸 ${human(result.thumbBytes)}`,
        );
      } else {
        console.log(`${mark} [실패]   ${result.job.slug} — ${result.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const written = results.filter((r) => r.kind === 'written');
  const skipped = results.filter((r) => r.kind === 'skipped');
  const failed = results.filter((r) => r.kind === 'failed');
  const total = [...written, ...skipped].reduce((sum, r) => sum + r.bytes, 0);
  const thumbTotal = [...written, ...skipped].reduce((sum, r) => sum + r.thumbBytes, 0);

  console.log('');
  console.log(
    `[birth] 정규화 ${written.length} · 그대로 둠 ${skipped.length} · 실패 ${failed.length}` +
      ` — 합계 ${written.length + skipped.length}/${queue.length}`,
  );
  console.log(
    `[birth] 본판 ${human(total)} · 썸네일 ${human(thumbTotal)} — 목록 한 달(≤31줄)이 무는 무게는 썸네일 쪽이다`,
  );

  if (failed.length > 0) {
    console.log('[실패 목록] 아래 slug 는 파일이 없다 — 화면은 그 날짜에 빈 액자를 세운다.');
    for (const item of failed) console.log(`  · ${item.job.slug} (${item.job.nameKo}) — ${item.message}`);
    process.exitCode = 1;
  }
}

await main();
