/**
 * 정적 드롭 데모 빌드 — `npm run build:static`.
 *
 * 하는 일은 두 단계다.
 *   ① `build-demo-catalog.mjs` — `content/*.csv` 를 브라우저가 읽을 번들로 굳힌다.
 *   ② `next build` — `NEXT_PUBLIC_STATIC_DEMO=1` 로 돌려 `out/` 한 폴더를 뽑는다.
 *
 * ── 왜 node 스크립트인가 (npm script 한 줄이 아니라) ─────────────────
 * `NEXT_PUBLIC_STATIC_DEMO=1 next build` 는 cmd.exe 에서 돌지 않는다. `cross-env` 를
 * 새로 붙일 수도 있었지만, 어차피 앞뒤로 할 일(번들 생성 · 결과 안내)이 있어서
 * 의존성을 늘리는 대신 스크립트 하나로 모았다 — Windows·리눅스에서 같은 명령이 돈다.
 *
 * ── `.next` 를 왜 지우고 끝내는가 ────────────────────────────────────
 * `output: 'export'` 빌드도 중간 산물은 `.next` 에 쓴다(Next 가 `distDir` 을
 * "내보낼 곳"으로 해석하고 빌드 폴더는 `.next` 로 되돌린다 — next.config.ts 주석 참조).
 * 그대로 두면 `.next` 안에 **서버 액션이 빠진 산출물**이 남고, 뒤이어 `npm run start`
 * 를 누른 사람은 추천이 조용히 죽는 사이트를 보게 된다. 폴더를 나눌 수 없으니
 * 지워서 다음 사람이 반드시 다시 빌드하게 만든다.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 로컬에 설치된 CLI 를 **node 로 직접** 부른다.
 *
 * `npx` 를 쓰지 않는 이유: Windows 에서 `npx` 를 spawn 하려면 `shell: true` 가 필요하고,
 * 그 조합은 인자를 그대로 이어 붙여 셸에 넘긴다(Node 가 DEP0190 으로 경고하는 자리다).
 * 진입 스크립트를 직접 부르면 셸이 끼지 않아 경고도, 인용부호 문제도 없다.
 */
function run(entry, args, env) {
  const result = spawnSync(process.execPath, [path.join(ROOT, entry), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    // 실패하면 그 자리에서 멈춘다 — 반쪽짜리 `out/` 이 zip 으로 나가는 것보다 낫다.
    console.error(`\n[build:static] 실패 — ${entry} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

/*
 * 지난 `out/` 을 지우고 시작한다. Next 는 export 를 덮어쓰지만 **지우지는 않아서**,
 * 라우트를 뺀 뒤에도 옛 HTML 이 남아 드롭 zip 에 유령 페이지가 실린다.
 */
const outDir = path.join(ROOT, 'out');
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });

/**
 * 세그먼트 프리페치 파일 이름을 바로잡는다 — **Windows 에서만 어긋나는 Next 16 버그.**
 *
 * 클라이언트 라우터는 링크를 미리 받아 둘 때 `__next.<세그먼트.경로>.__PAGE__.txt` 를
 * 부른다(점으로 이어 붙인 **파일 하나**). Next 도 그렇게 쓰려고 하는데,
 * `next/dist/export/index.js` 가 파일 목록을 `path.relative` 로 만들고
 * `convertSegmentPathToStaticExportFilename` 이 `replace(/\//g, '.')` 로 점을 만든다 —
 * 정규식이 **슬래시만** 본다. Windows 의 `path.relative` 는 `recommend\__PAGE__.rsc`
 * 를 돌려주므로 역슬래시가 그대로 남고, 뒤이은 `path.join` 이 그걸 폴더 구분자로 읽어
 * `out/recommend/__next.recommend/__PAGE__.txt` 라는 **폴더 구조**를 만들어 버린다.
 *
 * 결과: 브라우저는 있지도 않은 주소를 부르고 콘솔에 404 가 쌓인다(화면은 전체 로드로
 * 떨어져 돌기는 한다). 리눅스 빌드에서는 나지 않는 문제라 CI 에서는 안 보이는데,
 * 드롭 zip 은 이 Windows 기계에서 나가므로 여기서 고쳐야 한다.
 *
 * 고치는 법은 이름을 되돌리는 것뿐이다: `__next.*` 폴더 아래의 파일을 점으로 이어 붙인
 * 이름으로 폴더 옆에 옮기고 빈 폴더를 지운다. 이미 올바른 산출물(리눅스)이면
 * `__next.*` **폴더**가 없어 이 함수는 아무 일도 하지 않는다.
 */
function flattenSegmentFiles(dir) {
  let moved = 0;

  const collect = (from, parts, out) => {
    for (const entry of readdirSync(from, { withFileTypes: true })) {
      const next = path.join(from, entry.name);
      if (entry.isDirectory()) collect(next, [...parts, entry.name], out);
      else out.push({ file: next, name: [...parts, entry.name].join('.') });
    }
  };

  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const child = path.join(current, entry.name);
      if (entry.name.startsWith('__next.')) {
        const files = [];
        collect(child, [entry.name], files);
        for (const { file, name } of files) {
          renameSync(file, path.join(current, name));
          moved += 1;
        }
        rmSync(child, { recursive: true, force: true });
        continue;
      }
      walk(child);
    }
  };

  walk(dir);
  return moved;
}

console.log('[build:static] 1/2 — 데모 콘텐츠 번들 생성');
run('node_modules/tsx/dist/cli.mjs', ['scripts/build-demo-catalog.mjs']);

console.log('\n[build:static] 2/2 — 정적 export 빌드 (NEXT_PUBLIC_STATIC_DEMO=1)');
run('node_modules/next/dist/bin/next', ['build'], { NEXT_PUBLIC_STATIC_DEMO: '1' });

const fixed = flattenSegmentFiles(outDir);
if (fixed > 0) {
  console.log(`\n[build:static] 세그먼트 프리페치 파일 ${fixed}개 이름 교정 (Windows 경로 버그)`);
}

// 위 머리말 참조 — 데모 산물이 남은 `.next` 로 `npm run start` 를 누르지 못하게 한다.
const nextDir = path.join(ROOT, '.next');
if (existsSync(nextDir)) rmSync(nextDir, { recursive: true, force: true });

console.log('\n[build:static] 완료 — out/');
console.log('  · 로컬 확인:  npx serve out');
console.log('  · zip 만들기: powershell -File scripts/package-deploy.ps1 -Static');
console.log('  · ⚠ .next 를 지웠다 — 본배포용으로 돌아가려면 `npm run build` 를 다시 돌려라.');
