/**
 * 시드 CLI 가 밖에서 읽는 것 — `.env` 와 콘텐츠 경로.
 *
 * 두 시드 CLI(`seed.ts` · `letters.ts`)가 같은 규칙으로 환경을 읽어야 해서 여기 모았다.
 * 한쪽만 `.env` 를 읽으면 "값을 채우세요" 안내가 어느 명령에서는 거짓이 된다.
 *
 * ⚠ 키 값을 여기서 출력하지 않는다(있다/없다만 말한다). 실제 값을 보는 자리는
 *   `upsert.ts` 의 `readSupabaseConfig()` 하나뿐이다.
 */

import path from 'node:path';

/**
 * `.env` 를 읽어 `process.env` 에 얹는다.
 *
 * 이 CLI 들은 Next 밖에서 도는 tsx 스크립트라 `.env` 가 저절로 읽히지 않는다. 그런데
 * upsert 의 안내문은 ".env 를 채우세요" 라고 말한다 — 채워도 안 읽히면 그 안내가
 * 거짓말이 된다. Node 내장 로더를 쓰고, 파일이 없으면 조용히 넘어간다.
 * (셸에 이미 있는 값이 우선한다 — CI 가 넣어 준 값을 파일이 덮지 않는다.)
 */
export function loadDotEnv(): void {
  try {
    process.loadEnvFile(path.resolve(process.cwd(), '.env'));
  } catch {
    // .env 가 없는 실행(예: CI)에서는 아무 일도 일어나지 않는다.
  }
}

/**
 * 콘텐츠 CSV 디렉터리.
 *
 * `--content=<dir>` → 환경변수 `DEARBLOOM_CONTENT_DIR` → `<cwd>/content` 순서다.
 * (편지 시드도 꽃 id 를 대조하느라 같은 폴더를 읽는다 — 두 CLI 가 다른 폴더를 보면
 *  한쪽에서 통과한 꽃 id 가 다른 쪽에서 없는 값이 된다.)
 */
export function resolveContentDir(argv: string[]): string {
  const flag = argv.find((arg) => arg.startsWith('--content='));
  if (flag) return path.resolve(flag.slice('--content='.length));
  if (process.env.DEARBLOOM_CONTENT_DIR) return path.resolve(process.env.DEARBLOOM_CONTENT_DIR);
  return path.resolve(process.cwd(), 'content');
}
