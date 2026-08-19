// preview-N.png → final-N.jpg (1920x1080, 제출용 JPEG)
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DIR = path.dirname(fileURLToPath(import.meta.url));

for (const i of [1, 2, 3, 4, 5]) {
  const src = path.join(DIR, `preview-${i}.png`);
  const out = path.join(DIR, `final-${i}.jpg`);
  const meta = await sharp(src).metadata();
  if (meta.width !== 1920 || meta.height !== 1080) {
    throw new Error(`preview-${i}.png 이 ${meta.width}x${meta.height} 입니다 — 1920x1080 이어야 합니다.`);
  }
  await sharp(src)
    .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(out);
  console.log(`final-${i}.jpg  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}
