// deck-d3 미리보기 촬영 — 정적 서버(3423 전용) + Playwright 1920x1080
// 다른 덱 작업자와 절대 겹치지 않도록 포트는 3423 하나만 쓴다(3000·3400 금지).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3423;
const MARKER = 'deck-d3:dearbloom';

function candidates() {
  const out = ['playwright'];
  const cache = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  if (fs.existsSync(cache)) {
    for (const d of fs.readdirSync(cache)) {
      const p = path.join(cache, d, 'node_modules', 'playwright', 'index.js');
      if (fs.existsSync(p)) out.push('file://' + p.replace(/\\/g, '/'));
    }
  }
  return out;
}

async function launchBrowser() {
  const errs = [];
  for (const spec of candidates()) {
    try {
      const mod = await import(spec);
      const chromium = mod.chromium || (mod.default && mod.default.chromium);
      if (!chromium) continue;
      const b = await chromium.launch();
      console.log('playwright:', spec);
      return b;
    } catch (e) {
      errs.push(spec + ' :: ' + String(e).split('\n')[0]);
    }
  }
  throw new Error('브라우저 기동 실패\n' + errs.join('\n'));
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'slide1.html';
  const file = path.join(DIR, rel);
  if (!file.startsWith(DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
  });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve, reject) => {
  server.once('error', (e) =>
    reject(new Error(`포트 ${PORT} 를 잡지 못했습니다 (${e.code}). deck-d3 전용 포트이므로 다른 포트로 넘어가지 않는다.`)),
  );
  server.listen(PORT, '127.0.0.1', resolve);
});
console.log('serving deck-d3 on http://127.0.0.1:' + PORT);

{
  const probe = await fetch(`http://127.0.0.1:${PORT}/slide1.html`).then((r) => r.text());
  if (!probe.includes(MARKER)) {
    throw new Error(`포트 ${PORT} 가 deck-d3 를 서빙하지 않습니다. 다른 서버와 충돌.`);
  }
  console.log('서빙 검증 OK — deck-d3 마커 확인');
}

const only = process.argv.slice(2).map(Number).filter(Boolean);
const pages = only.length ? only : [1, 2, 3, 4, 5];

let browser;
try {
  browser = await launchBrowser();
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  for (const i of pages) {
    await page.goto(`http://127.0.0.1:${PORT}/slide${i}.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);

    const box = await page.evaluate(() => {
      const s = document.querySelector('.slide');
      const mk = document.querySelector('meta[name="deck"]');
      const r = s.getBoundingClientRect();
      const over = [];
      document.querySelectorAll('.stage *').forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.width && b.height && (b.bottom > 1044 || b.right > 1912 || b.left < 8 || b.top < 0)) {
          over.push(
            (typeof el.className === 'string' ? el.className : el.tagName) +
              ' ' +
              Math.round(b.left) + ',' + Math.round(b.top) +
              ' ' + Math.round(b.right) + ',' + Math.round(b.bottom),
          );
        }
      });
      return {
        w: Math.round(r.width),
        h: Math.round(r.height),
        scrollW: document.documentElement.scrollWidth,
        scrollH: document.documentElement.scrollHeight,
        marubu: document.fonts.check('700 68px MaruBuri'),
        pretendard: document.fonts.check('700 20px Pretendard'),
        over: over.slice(0, 8),
        deck: mk ? mk.content : '(없음)',
      };
    });

    if (box.deck !== MARKER) throw new Error(`slide${i}: 다른 덱이 렌더됨 (${box.deck})`);

    await page.screenshot({
      path: path.join(DIR, `preview-${i}.png`),
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
    });
    console.log(
      `slide${i}  slide=${box.w}x${box.h}  doc=${box.scrollW}x${box.scrollH}` +
        `  MaruBuri=${box.marubu} Pretendard=${box.pretendard}` +
        (box.over.length ? '\n   넘침: ' + box.over.join('\n         ') : ''),
    );
  }
} finally {
  if (browser) await browser.close();
  if (server.closeAllConnections) server.closeAllConnections();
  server.close();
  setTimeout(() => process.exit(0), 120);
}
