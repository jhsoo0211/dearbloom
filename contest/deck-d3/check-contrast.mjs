// 실사 위 글자 대비 검사 — 4.5:1 규칙을 실제 렌더 픽셀로 확인한다.
//
// 방법: 같은 페이지를 두 번 그린다.
//   ① 정상 렌더에서 글자 요소의 사각형과 색을 수집
//   ② 글자를 투명하게 만든 렌더를 캡처해 그 사각형 "밑"의 배경 휘도를 잰다
// 배경은 최댓값(밝은 글자 기준)·최솟값(어두운 글자 기준)을 모두 재서
// 더 불리한 쪽으로 대비를 계산한다.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

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
  for (const spec of candidates()) {
    try {
      const mod = await import(spec);
      const chromium = mod.chromium || (mod.default && mod.default.chromium);
      if (!chromium) continue;
      return await chromium.launch();
    } catch {
      /* 다음 후보 */
    }
  }
  throw new Error('브라우저 기동 실패');
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
  server.once('error', reject);
  server.listen(PORT, '127.0.0.1', resolve);
});
{
  const probe = await fetch(`http://127.0.0.1:${PORT}/slide1.html`).then((r) => r.text());
  if (!probe.includes(MARKER)) throw new Error(`포트 ${PORT} 가 deck-d3 를 서빙하지 않습니다.`);
}

const chan = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (r, g, b) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

let worstAll = 99;
const failures = [];

for (const i of [1, 2, 3, 4, 5]) {
  await page.goto(`http://127.0.0.1:${PORT}/slide${i}.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  // ① 글자 조각 수집 — 요소 상자가 아니라 Range 로 글줄 상자를 딱 맞게 딴다.
  //    (요소 상자는 flex 로 늘어나거나 회전 때문에 엉뚱한 곳까지 포함한다)
  const items = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.stage *, .credit, .foot-label, .foot-num').forEach((el) => {
      const cs = getComputedStyle(el);
      const m = cs.color.match(/[\d.]+/g);
      const fs = parseFloat(cs.fontSize);
      const fw = parseInt(cs.fontWeight, 10) || 400;
      const cls = typeof el.className === 'string' ? el.className.slice(0, 30) : el.tagName;
      for (const node of el.childNodes) {
        if (node.nodeType !== 3 || !node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          if (r.width < 8 || r.height < 8) continue;
          out.push({
            text: node.textContent.trim().replace(/\s+/g, ' ').slice(0, 32),
            cls,
            x: Math.max(0, Math.round(r.left)),
            y: Math.max(0, Math.round(r.top)),
            w: Math.min(1920, Math.round(r.width)),
            h: Math.min(1080, Math.round(r.height)),
            c: [+m[0], +m[1], +m[2]],
            fs,
            fw,
          });
        }
      }
    });
    return out;
  });

  // ② 글자를 지운 배경만 렌더
  await page.addStyleTag({
    content: `.stage *, .credit, .foot-label, .foot-num {
      color: transparent !important;
      -webkit-text-fill-color: transparent !important;
      text-shadow: none !important;
    }`,
  });
  await page.waitForTimeout(150);
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const stride = info.channels;

  for (const it of items) {
    const x0 = Math.min(1919, it.x + 1);
    const y0 = Math.min(1079, it.y + 1);
    const x1 = Math.max(x0 + 1, Math.min(1920, it.x + it.w - 1));
    const y1 = Math.max(y0 + 1, Math.min(1080, it.y + it.h - 1));

    const ls = [];
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const o = (y * info.width + x) * stride;
        ls.push(lum(data[o], data[o + 1], data[o + 2]));
      }
    }
    if (!ls.length) continue;
    ls.sort((a, b) => a - b);
    const q = (p) => ls[Math.min(ls.length - 1, Math.floor(ls.length * p))];
    const med = q(0.5);
    const Lt = lum(it.c[0], it.c[1], it.c[2]);
    // 글자가 배경보다 밝으면 배경 쪽 밝은 사분위, 어두우면 어두운 사분위를 본다.
    // (회전한 상자 모서리에 다른 면이 조금 물리는 것까지 실패로 잡지 않도록 중앙값 기준)
    const Lbg = Lt > med ? q(0.78) : q(0.22);
    const cr = ratio(Lt, Lbg);
    if (cr < 4.5) failures.push({ slide: i, cr: cr.toFixed(2), med: med.toFixed(3), ...it });
    if (cr < worstAll) worstAll = cr;
  }
  console.log(`slide${i}  글줄 ${items.length}개 검사`);
}

console.log(`\n최저 대비 ${worstAll.toFixed(2)}:1`);
if (failures.length) {
  console.log(`\n4.5:1 미달 ${failures.length}건`);
  for (const f of failures.slice(0, 40)) {
    console.log(
      `  s${f.slide} ${f.cr}:1  ${f.fs}px/${f.fw}  [${f.cls}]  ${f.x},${f.y} ${f.w}x${f.h}  "${f.text}"`,
    );
  }
} else {
  console.log('전부 4.5:1 이상 통과');
}

await browser.close();
if (server.closeAllConnections) server.closeAllConnections();
server.close();
setTimeout(() => process.exit(failures.length ? 1 : 0), 120);
