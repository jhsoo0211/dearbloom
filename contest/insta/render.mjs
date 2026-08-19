/**
 * card1~7.html → card-1~7.jpg (1080x1350, q88) + preview-N.png
 *
 * 파이프라인: 정적 서버(3424) → Chrome 헤드리스 스크린샷(PNG) → sharp JPEG q88.
 * file:// 대신 http 를 쓰는 이유는 웹폰트다 — Chrome 이 file:// 에서 @font-face 를
 * 막으면 마루부리·프리텐다드가 통째로 시스템 폰트로 떨어진다.
 *
 * 사용: node contest/insta/render.mjs [카드번호...]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3424;
const W = 1080, H = 1350;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
if (!CHROME) throw new Error('Chrome/Edge 실행 파일을 찾지 못했다');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  const file = path.join(DIR, rel);
  if (!file.startsWith(DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end('nope');
    return;
  }
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(file).pipe(res);
});

function shoot(n, pngPath) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'insta-chrome-'));
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--force-device-scale-factor=1',
      '--force-color-profile=srgb',
      '--disable-lcd-text',
      `--user-data-dir=${profile}`,
      `--window-size=${W},${H}`,
      '--virtual-time-budget=10000',
      `--screenshot=${pngPath}`,
      `http://127.0.0.1:${PORT}/card${n}.html`,
    ];
    const p = spawn(CHROME, args, { stdio: 'ignore' });
    p.on('error', reject);
    p.on('exit', () => {
      fs.rmSync(profile, { recursive: true, force: true });
      fs.existsSync(pngPath) ? resolve() : reject(new Error(`card${n}: 스크린샷 없음`));
    });
  });
}

const wanted = process.argv.slice(2).map(Number).filter(Boolean);
const cards = wanted.length ? wanted : [1, 2, 3, 4, 5, 6, 7];

await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
try {
  for (const n of cards) {
    const png = path.join(DIR, `preview-${n}.png`);
    const jpg = path.join(DIR, `card-${n}.jpg`);
    await shoot(n, png);
    const meta = await sharp(png).metadata();
    if (meta.width !== W || meta.height !== H) {
      throw new Error(`card${n}: 캔버스가 ${meta.width}x${meta.height} — ${W}x${H} 이어야 한다`);
    }
    await sharp(png)
      .jpeg({ quality: 88, chromaSubsampling: '4:4:4', mozjpeg: true })
      .toFile(jpg);
    const kb = (fs.statSync(jpg).size / 1024).toFixed(0);
    console.log(`card-${n}.jpg  ${meta.width}x${meta.height}  ${kb}KB`);
  }
} finally {
  server.close();
}
