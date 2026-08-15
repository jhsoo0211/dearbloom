/**
 * 세밀화 도판 31종을 `public/plates/` 에 **JPEG 한 규격으로** 놓는다 — 자체 호스팅 자산 관리.
 *
 * 파이프라인은 세 칸이다: **입력 바이트 확보 → sharp 정규화 → `.jpg` 저장.**
 *   ① 입력   원격(`remoteSrc`) 또는 이미 있는 로컬 파일(옛 확장자 포함) 중 하나.
 *   ② 정규화 폭 최대 1280px(업스케일 금지) · 알파는 흰 배경으로 flatten · JPEG q82(mozjpeg).
 *   ③ 저장   `src` 가 가리키는 자리에 `.jpg` 로 쓴다. 같은 이름의 옛 확장자 파일은 지운다.
 *
 * 사용:
 *   node scripts/fetch-plates.mjs              # 없는 것만 채운다(로컬에 원본이 있으면 그걸 정규화)
 *   node scripts/fetch-plates.mjs --reencode   # 있는 파일을 다시 정규화한다(네트워크 거의 안 씀)
 *   node scripts/fetch-plates.mjs --force      # 전부 다시 받아 다시 정규화한다
 *
 * ⚠ **원본 바이트는 보관하지 않는다.** 리포에는 정규화 산출물 한 벌만 남는다 —
 *   재현성은 `remoteSrc` 가 담보한다(`--force` 로 언제든 원본에서 다시 만든다).
 *
 * 왜 받아 두는가(`docs/illustration-assets.md` 배포 규칙 1):
 *   31종은 전부 퍼블릭 도메인·CC0 라 재배포에 제약이 없다. 반면 위키미디어는 핫링크를
 *   명시적으로 만류하고 연속 요청에 `HTTP 429` 를 돌려준다 — 레인 31줄이 한 화면에서
 *   동시에 도판을 부르면 그 상태가 그대로 재현된다. 한 번 받아 우리 `public/` 에 두면
 *   위키미디어가 런타임 의존성에서 빠진다.
 *
 * 왜 정규화하는가:
 *   위키미디어 PNG 판본은 장당 2.5~4.3MB 다. 레인 헤더의 44px 썸네일이 그 파일을 통째로
 *   물고, 리포에는 바이너리가 그대로 쌓인다. 화면이 쓰는 최대 폭은 1280px 한 벌뿐이므로
 *   무손실 PNG 를 들고 있을 이유가 없다 — 종이 질감 스캔은 JPEG 가 훨씬 싸다.
 *
 * 목록의 원본은 `src/lib/plates/index.ts` 한 곳이다(도판 상수는 두 벌을 만들지 않는다).
 *   · 받을 주소 = `remoteSrc`
 *   · 저장 경로 = `src`(`/plates/…` → `public/plates/…`)
 *   즉 이 스크립트는 **모듈이 가리키는 자리에 그대로 파일을 놓는다** — 경로를 두 번 적지 않는다.
 *   `src` 가 아직 원격 주소인 꽃(다운로드 실패 폴백)은 건너뛰고 그 사실을 알린다.
 *
 * 위키미디어 예의 두 가지를 지킨다:
 *   · **설명적 User-Agent + 연락처.** 기본 UA(node/undici)로 부르면 403 을 받는다.
 *   · **요청 간격 500ms.** 31장을 한꺼번에 밀어 넣지 않는다(그게 429 를 부른다).
 *   실패한 건은 2초 뒤 한 번만 더 시도하고, 그래도 안 되면 목록으로 모아 마지막에 보고한다.
 *   로컬 파일을 입력으로 쓴 종은 요청이 없으므로 간격도 두지 않는다.
 *
 * ⚠ node 24 의 타입 스트리핑으로 `.ts` 를 그대로 import 한다(빌드 단계 없음).
 *   `package.json` 에 `"type"` 이 없어 `MODULE_TYPELESS_PACKAGE_JSON` 경고가 한 줄 뜨는데,
 *   기능에는 영향이 없다(경고를 없애려고 패키지 전체를 ESM 으로 바꾸지는 않는다).
 *
 * ⚠ `sharp` 의존은 **이 스크립트에만** 둔다. `src/lib/plates/index.ts` 는 서버·클라이언트가
 *   함께 import 하는 순수 데이터 모듈이라 네이티브 바이너리를 끌어들이면 안 된다.
 */

import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { FLOWER_PLATES } from '../src/lib/plates/index.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** 위키미디어 정책이 요구하는 형태 — 무엇이 부르는지와 연락처가 함께 있어야 한다. */
const USER_AGENT = 'dearbloomBot/1.0 (flower-gift service asset fetch; contact: regrip.gy@gmail.com)';

/** 요청 사이 간격(ms). 31장 × 500ms ≈ 16초 — 서두를 이유가 없는 1회성 작업이다. */
const DELAY = 500;
/** 실패 후 재시도까지 기다리는 시간(ms). 429 라면 조금 더 쉬어야 의미가 있다. */
const RETRY_DELAY = 2000;

/**
 * 화면이 쓰는 최대 폭. 이보다 작은 원본은 **늘리지 않는다**(없는 해상도를 지어내지 않는다).
 * 1100px 인 근거: 도판이 가장 크게 서는 자리(도감 상세 히어로 액자)의 실표시 폭이 ~550px
 * 이하라, 레티나 2배(=1100px)면 충분하다. 품질(q82)을 깎는 대신 폭을 줄이는 쪽을 택했다.
 */
const MAX_WIDTH = 1100;
/** JPEG 품질. 82 는 종이 질감 스캔에서 눈에 띄는 손실 없이 크기가 확 떨어지는 자리다. */
const JPEG_QUALITY = 82;
/** 알파를 걷어낼 때 깔 색 — 도판 판면은 전부 흰 종이다. */
const FLATTEN_BG = '#ffffff';

const force = process.argv.includes('--force');
const reencode = process.argv.includes('--reencode');

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** `1.2 MB` 처럼 읽히는 크기. */
function human(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** 이미 받아 둔 파일인지. 0바이트로 남은 잔해는 없는 것으로 친다. */
async function existingSize(path) {
  try {
    const info = await stat(path);
    return info.isFile() && info.size > 0 ? info.size : 0;
  } catch {
    return 0;
  }
}

/**
 * 같은 이름의 **옛 확장자 파일**(정규화 전에 받아 둔 `.png` 등).
 * 있으면 재다운로드 없이 입력으로 쓰고, 정규화가 끝나면 지운다 —
 * `.png` 와 `.jpg` 가 나란히 남으면 어느 쪽이 진짜인지 알 수 없게 된다.
 */
async function legacySibling(target) {
  const dir = dirname(target);
  const stem = basename(target, extname(target));
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return null;
  }
  for (const name of entries) {
    if (name === basename(target)) continue;
    if (basename(name, extname(name)) === stem) return join(dir, name);
  }
  return null;
}

async function download(url) {
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
  if (!type.startsWith('image/')) throw new Error(`이미지가 아니다 — content-type: ${type || '없음'}`);

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0) throw new Error('본문이 비었다(0바이트)');
  return bytes;
}

/**
 * 어떤 입력이 오든 **같은 규격의 JPEG** 한 장으로 만든다.
 * `.rotate()` 는 EXIF 방향을 픽셀에 굽는다 — 재인코딩하면 EXIF 가 사라지므로,
 * 굽지 않으면 원본이 세워 두던 그림이 눕는다.
 */
async function normalize(bytes) {
  const before = await sharp(bytes).metadata();

  let pipeline = sharp(bytes).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
  if (before.hasAlpha) pipeline = pipeline.flatten({ background: FLATTEN_BG });

  const { data, info } = await pipeline
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  return { data, before, after: info };
}

async function main() {
  const plates = Object.values(FLOWER_PLATES);
  const failures = [];
  const warnings = [];
  let written = 0;
  let skipped = 0;
  let total = 0;

  const mode = force ? ' (--force: 전부 다시 받음)' : reencode ? ' (--reencode: 전부 다시 정규화)' : '';
  console.log(
    `[plates] ${plates.length}종 — 저장 위치 public/plates · 정규화 ≤${MAX_WIDTH}px JPEG q${JPEG_QUALITY}${mode}`,
  );

  for (const [index, plate] of plates.entries()) {
    const mark = `${String(index + 1).padStart(2, ' ')}/${plates.length}`;

    if (!plate.src.startsWith('/plates/')) {
      warnings.push(`${plate.flowerId} — src 가 로컬 경로가 아니다(원격 폴백 유지 중): ${plate.src}`);
      console.log(`${mark} [건너뜀] ${plate.flowerId} — 원격 폴백 상태`);
      continue;
    }

    const target = join(ROOT, 'public', plate.src.replace(/^\//, ''));
    if (extname(target).toLowerCase() !== '.jpg') {
      // 산출물은 언제나 JPEG 다. 모듈의 `src` 가 다른 확장자를 가리키면 이름과 바이트가 어긋난다.
      warnings.push(`${plate.flowerId} — src 확장자가 .jpg 가 아니다: ${plate.src}`);
    }

    const already = await existingSize(target);
    const legacy = await legacySibling(target);

    if (already > 0 && !force && !reencode) {
      skipped++;
      total += already;
      console.log(`${mark} [있음]   ${plate.flowerId} — ${human(already)}`);
      continue;
    }

    // 입력 고르기 — `--force` 만 무조건 원격이고, 나머지는 로컬에 쓸 바이트가 있으면 그걸 쓴다.
    let source = null;
    if (!force) {
      if (already > 0) source = { path: target, label: '로컬' };
      else if (legacy) source = { path: legacy, label: `로컬 ${basename(legacy)}` };
    }

    let raw = null;
    let origin = '';
    if (source) {
      raw = await readFile(source.path);
      origin = source.label;
    } else {
      for (const attempt of [1, 2]) {
        try {
          raw = await download(plate.remoteSrc);
          origin = '원격';
          break;
        } catch (error) {
          if (attempt === 2) {
            failures.push(`${plate.flowerId} — ${error.message}`);
            console.log(`${mark} [실패]   ${plate.flowerId} — ${error.message}`);
          } else {
            console.log(`${mark} [재시도] ${plate.flowerId} — ${error.message}`);
            await sleep(RETRY_DELAY);
          }
        }
      }
    }

    if (raw) {
      let result = null;
      try {
        result = await normalize(raw);
      } catch (error) {
        failures.push(`${plate.flowerId} — 정규화 실패: ${error.message}`);
        console.log(`${mark} [실패]   ${plate.flowerId} — 정규화 실패: ${error.message}`);
      }

      if (result) {
        const { data, before, after } = result;
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, data);
        // 옛 확장자 잔해를 남기지 않는다 — 두 벌이 남으면 어느 쪽이 진짜인지 알 수 없다.
        if (legacy) await rm(legacy, { force: true });

        written++;
        total += data.byteLength;
        console.log(
          `${mark} [정규화] ${plate.flowerId} — ${before.format} ${before.width}×${before.height} ${human(raw.byteLength)}` +
            ` → jpg ${after.width}×${after.height} ${human(data.byteLength)} (${origin})`,
        );
      }
    }

    if (origin === '원격') await sleep(DELAY);
  }

  console.log('');
  console.log(
    `[plates] 정규화 ${written} · 그대로 둠 ${skipped} · 실패 ${failures.length} — 합계 ${written + skipped}/${plates.length}, ${human(total)}`,
  );
  for (const line of warnings) console.log(`[주의] ${line}`);
  if (failures.length > 0) {
    console.log('[실패 목록] 아래 꽃은 plates 모듈의 src 를 remoteSrc 로 되돌려 원격 폴백으로 둔다.');
    for (const line of failures) console.log(`  · ${line}`);
    process.exitCode = 1;
  }
}

await main();
