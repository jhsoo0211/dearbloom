/**
 * `/partners` 실존 큐레이션 — 외부 링크 전수 HTTP 검증.
 *
 *   node tests/partners/check-links.mjs
 *
 * 이 페이지의 값어치는 "여기 적힌 곳은 진짜 있고, 눌러서 갈 수 있다" 하나다.
 * 링크가 하나라도 죽으면 그 약속이 깨지므로, 목록을 고칠 때마다 이걸 돌린다.
 *
 * ── 왜 URL을 여기에 또 적지 않는가 ────────────────────────────────────
 * `page.tsx` 를 **직접 읽어서** URL을 뽑는다. 목록을 두 벌 관리하면 반드시 어긋나고,
 * 그때 검증은 "지난 목록"을 통과시키며 초록불을 켠다 — 없느니만 못한 검증이 된다.
 *
 * ⚠ 네트워크를 타므로 vitest 로 돌리지 않는다(파일명이 `.test.ts` 가 아닌 이유).
 *   남의 서버 사정으로 CI가 빨개지면 안 된다. 이건 **사람이 돌리는 점검**이다.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.resolve(HERE, '../../src/app/partners/page.tsx');

/** 사람이 아니라고 문전박대하는 공공 사이트가 있어 평범한 브라우저처럼 굴어야 한다. */
const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0 Safari/537.36',
  'accept-language': 'ko-KR,ko;q=0.9',
};

const TIMEOUT_MS = 20_000;

/**
 * 인증서 **체인**만 불완전한 곳 — 실패가 아니라 경고로 다룬다.
 *
 * 두 가지를 갈라 봐야 한다. 둘 다 "인증서 문제" 지만 사용자가 겪는 일이 다르다.
 *
 *   ① 도메인 불일치 — 인증서에 적힌 이름이 아예 다른 도메인이다. **모든** 브라우저가
 *      경고를 띄운다. 이건 죽은 링크와 같다(영남화훼원예농협을 뺀 이유).
 *   ② 체인 불완전 — 인증서는 그 도메인 것이 맞는데 서버가 중간 인증서를 빼먹고 보낸다.
 *      크롬·사파리는 AIA 로 알아서 받아와 정상으로 열리고, 파이어폭스는 캐시에 없으면
 *      경고를 띄운다. 엄격한 클라이언트(Node fetch 포함)는 거부한다.
 *
 * ②를 빨간불로 두면 "남의 서버 설정" 때문에 우리 점검이 늘 빨갛고, 그러면 아무도 안 본다.
 * 그렇다고 조용히 통과시키면 점검의 뜻이 없다. 그래서 **아는 것만 노랑으로** 통과시킨다.
 * ⚠ 여기 새 도메인을 넣기 전에 `openssl s_client` 로 ①이 아닌 ②임을 반드시 확인하라.
 */
const KNOWN_CHAIN_GAPS = new Map([
  ['www.bearbetter.net', '서버가 Sectigo 중간 인증서를 빼고 보낸다(잎 인증서는 정상)'],
]);

/** `name: '…'` 와 `url: '…'` 이 이웃해 있는 블록에서 짝을 뽑는다. */
function collectTargets(source) {
  const targets = [];
  const pattern = /name:\s*'([^']+)',\s*\n\s*url:\s*'([^']+)'/g;

  for (const match of source.matchAll(pattern)) {
    targets.push({ name: match[1], url: match[2] });
  }

  return targets;
}

/**
 * 체인이 끊긴 곳이 **살아는 있는지** 확인하는 두 번째 노크.
 *
 * 검증을 끄고 여는 것이라 여기서 200 이 나왔다고 "안전" 한 게 아니다. 확인하려는 건 하나 —
 * "서버가 죽은 것인가, 인증서만 덜 보낸 것인가". 그 둘을 갈라야 목록에서 뺄지 말지를 정한다.
 */
function probeIgnoringChain(url) {
  return new Promise((resolve) => {
    const request = https.get(
      url,
      { headers: HEADERS, rejectUnauthorized: false, timeout: TIMEOUT_MS },
      (response) => {
        response.resume(); // 본문은 버린다 — 상태 줄만 필요하다.
        resolve(response.statusCode);
      },
    );

    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve(null));
  });
}

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // HEAD 를 막아 둔 곳이 흔해서 GET 으로 간다(본문은 읽지 않고 버린다).
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: HEADERS,
      signal: controller.signal,
    });

    return { ok: response.ok, status: String(response.status) };
  } catch (error) {
    const code = error.cause?.code ?? error.message;
    const host = new URL(url).hostname;
    const gap = KNOWN_CHAIN_GAPS.get(host);

    if (code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' && gap) {
      const status = await probeIgnoringChain(url);

      if (status && status < 400) {
        return { ok: true, warn: true, status: String(status), detail: gap };
      }
    }

    return { ok: false, status: 'ERR', detail: code };
  } finally {
    clearTimeout(timer);
  }
}

const source = await readFile(PAGE, 'utf8');
const targets = collectTargets(source);

if (targets.length === 0) {
  console.error('✖ page.tsx 에서 링크를 하나도 찾지 못했다 — 추출 패턴이 낡았는지 보라.');
  process.exit(1);
}

console.log(`\n/partners 외부 링크 ${targets.length}건 검증\n`);

const results = await Promise.all(
  targets.map(async (target) => ({ ...target, ...(await probe(target.url)) })),
);

let failed = 0;
let warned = 0;

for (const result of results) {
  const mark = result.ok ? (result.warn ? '⚠' : '✔') : '✖';
  const tail = result.detail ? `  ← ${result.detail}` : '';

  if (!result.ok) failed += 1;
  else if (result.warn) warned += 1;

  console.log(`${mark} ${result.status.padEnd(3)}  ${result.name.padEnd(26)} ${result.url}${tail}`);
}

console.log(`\n${results.length - failed}/${results.length} 통과${warned > 0 ? ` (경고 ${warned})` : ''}\n`);

if (failed > 0) {
  console.error(
    '죽은 링크는 문구를 고쳐 살리지 말고 항목을 빼라 — docs/partners-research.md 의 선정 기준 #2.',
  );
  process.exit(1);
}
