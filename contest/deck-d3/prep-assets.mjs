// deck-d3 자산 준비 — 실사 풀블리드 배경 · 액자용 크롭 · 화면 캡처 축소
//
// 외부 핫링크 금지 규칙에 따라 슬라이드가 쓰는 이미지는 전부 이 폴더 안 사본이다.
// 원본 위치
//   · 실사   : public/birth/*.jpg   (라이선스는 content/birth_photos.csv 에서 확인 — 슬라이드 하단 크레딧 참조)
//   · 캡처   : contest/shots/*.png
//
// 사용 라이선스 (2026-08-19 확인)
//   bg-1 digitalriseu     디기탈리스   Godot13                       CC BY-SA 4.0   → 크레딧 표기
//   bg-2 boratbit-railrak 보랏빛 라일락 Kor!An (Андрей Корзун)        CC BY-SA 3.0   → 크레딧 표기
//   bg-3 boksakkot        복사꽃       lumoplank                     CC0
//   bg-4 kalra            칼라         Bernard Spragg. NZ            Public domain
//   bg-5 yasaenghwa       야생화 초원   Mount Rainier National Park   Public domain
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(HERE, 'assets');
const BIRTH = path.join(ROOT, 'public', 'birth');
const SHOTS = path.join(ROOT, 'contest', 'shots');

fs.mkdirSync(OUT, { recursive: true });

// ── 1. 풀블리드 실사 배경 ──────────────────────────────────────────
// 원본이 960px 이므로 브라우저 업스케일에 맡기지 않고 lanczos3 로 미리 키운 뒤
// 언샵을 먹여 확대 자국을 지운다. 어둡게 그레이딩은 CSS(.grade/.veil)가 맡는다.
const BGS = [
  ['bg-1.jpg', 'digitalriseu.jpg'],
  ['bg-2.jpg', 'boratbit-railrak.jpg'],
  ['bg-3.jpg', 'boksakkot.jpg'],
  ['bg-4.jpg', 'kalra.jpg'],
  ['bg-5.jpg', 'yasaenghwa.jpg'],
];
for (const [out, src] of BGS) {
  await sharp(path.join(BIRTH, src))
    .resize(1920, 1080, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .sharpen({ sigma: 1.1, m1: 0.4, m2: 2.2 })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(path.join(OUT, out));
  console.log('bg  ', out, '←', src);
}

// ── 2. 액자용 실사 크롭 (표시 크기의 2배 이상 = 확대 없음) ───────────
// 2장 인용문 액자 = 배경과 같은 라일락의 선명한 디테일 컷.
await sharp(path.join(BIRTH, 'boratbit-railrak.jpg'))
  .resize(560, 700, { fit: 'cover', position: 'attention', kernel: 'lanczos3' })
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(path.join(OUT, 'ph-lilac.jpg'));
console.log('ph   ph-lilac.jpg');

// ── 3. 3장 주인공 : 추천 결과 화면 (오른쪽 빈 여백을 잘라 크게 세운다) ──
await sharp(path.join(SHOTS, 'shot-results.png'))
  .extract({ left: 0, top: 0, width: 2830, height: 1727 })
  .resize({ width: 1900, kernel: 'lanczos3' })
  .jpeg({ quality: 93, mozjpeg: true, chromaSubsampling: '4:4:4' })
  .toFile(path.join(OUT, 's-results-crop.jpg'));
console.log('scr  s-results-crop.jpg');

// ── 4. 4장 화면 : 모바일 2장 + 크롭 3장 ────────────────────────────
const SCREENS = [
  ['m-heart.jpg', 'm-question-heart.png', 780],
  ['m-results.jpg', 'm-results.png', 780],
  ['c-cues.jpg', 'crop-cues.png', 848],
  ['c-safety.jpg', 'crop-safety.png', 860],
  ['c-ment.jpg', 'crop-ment.png', 1254],
];
for (const [out, src, w] of SCREENS) {
  await sharp(path.join(SHOTS, src))
    .resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' })
    .jpeg({ quality: 93, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(path.join(OUT, out));
  console.log('scr ', out);
}

const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.jpg'));
const total = files.reduce((a, f) => a + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`\nassets/*.jpg ${files.length}개 · ${(total / 1024 / 1024).toFixed(2)} MB`);
