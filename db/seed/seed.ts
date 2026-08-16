/**
 * 콘텐츠 시드 CLI.
 *
 *   npm run seed          기본값 = dry-run. 파싱 → 행 스키마 → 교차 검증 → 리포트. DB를 건드리지 않는다.
 *   npm run seed:apply    검증을 모두 통과했을 때만 upsert 단계로 넘어간다.
 *   npm run seed -- --apply   같은 것(PowerShell 에서는 `--` 가 필수다).
 *
 * 옵션
 *   --content=<dir>       CSV 디렉터리 (기본: <cwd>/content, 환경변수 DEARBLOOM_CONTENT_DIR 도 가능)
 *
 * 종료 코드
 *   0 — 검증 통과 (dry-run) / 반영 완료 (apply)
 *   1 — 검증 오류 있음 / Supabase 미설정
 *   2 — 예상치 못한 실패(파싱 예외 등)
 *   3 — DB 반영 실패 (환경은 정상)
 */

import path from 'node:path';
import { existsSync } from 'node:fs';

import { readCsv, type CsvRecord } from './parse';
import {
  SEED_FILE_KEYS,
  SEED_FILE_NAMES,
  crossValidate,
  validateFile,
  type SeedDataset,
  type SeedFileKey,
} from './schemas';
import { printReport, type CrossCheckResult, type FileSummary, type SeedIssue } from './report';
import { runUpsert } from './upsert';

/**
 * `.env` 를 읽어 `process.env` 에 얹는다.
 *
 * 이 CLI 는 Next 밖에서 도는 tsx 스크립트라 `.env` 가 저절로 읽히지 않는다. 그런데
 * upsert 의 안내문은 ".env 를 채우세요" 라고 말한다 — 채워도 안 읽히면 그 안내가
 * 거짓말이 된다. Node 내장 로더를 쓰고, 파일이 없으면 조용히 넘어간다.
 * (셸에 이미 있는 값이 우선한다 — CI 가 넣어 준 값을 파일이 덮지 않는다.)
 */
function loadDotEnv(): void {
  try {
    process.loadEnvFile(path.resolve(process.cwd(), '.env'));
  } catch {
    // .env 가 없는 실행(예: CI)에서는 아무 일도 일어나지 않는다.
  }
}

function resolveContentDir(argv: string[]): string {
  const flag = argv.find((arg) => arg.startsWith('--content='));
  if (flag) return path.resolve(flag.slice('--content='.length));
  if (process.env.DEARBLOOM_CONTENT_DIR) return path.resolve(process.env.DEARBLOOM_CONTENT_DIR);
  return path.resolve(process.cwd(), 'content');
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
  loadDotEnv();
  const contentDir = resolveContentDir(argv);

  const files: FileSummary[] = [];
  const issues: SeedIssue[] = [];
  let crossChecks: CrossCheckResult[] = [];

  // 1) 파싱
  const records: Partial<Record<SeedFileKey, CsvRecord[]>> = {};
  for (const key of SEED_FILE_KEYS) {
    const fileName = SEED_FILE_NAMES[key];
    const filePath = path.join(contentDir, fileName);

    if (!existsSync(filePath)) {
      files.push({ file: fileName, rows: null });
      issues.push({ file: fileName, line: null, column: '-', message: `파일을 찾을 수 없습니다: ${filePath}` });
      continue;
    }

    try {
      const parsed = readCsv(filePath);
      records[key] = parsed;
      files.push({ file: fileName, rows: parsed.length });
    } catch (error) {
      files.push({ file: fileName, rows: null });
      issues.push({
        file: fileName,
        line: null,
        column: '-',
        message: `CSV 파싱 실패: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  // 2) 행 스키마 검증
  const dataset: Partial<SeedDataset> = {};
  for (const key of SEED_FILE_KEYS) {
    const parsed = records[key];
    if (!parsed) continue;
    const result = validateFile(key, parsed);
    // 키별 스키마가 서로 다른 행 타입을 내므로 여기서만 좁혀 준다.
    (dataset as Record<string, unknown>)[key] = result.rows;
    issues.push(...result.issues);
  }

  // 3) 교차 검증 — 모든 파일이 읽히고 행 오류가 없을 때만 의미가 있다.
  const allFilesRead = SEED_FILE_KEYS.every((key) => records[key] !== undefined);
  if (allFilesRead && issues.length === 0) {
    const cross = crossValidate(dataset as SeedDataset);
    crossChecks = cross.checks;
    issues.push(...cross.issues);
  }

  // 4) 리포트
  const exitCode = printReport({
    mode: apply ? 'apply' : 'dry-run',
    contentDir,
    files,
    crossChecks,
    issues,
  });

  if (exitCode !== 0) {
    process.exit(exitCode);
  }

  if (apply) {
    console.log('');
    await runUpsert(dataset as SeedDataset);
  }
}

main().catch((error: unknown) => {
  console.error('시드 실행 중 예상치 못한 오류가 발생했습니다.');
  console.error(error);
  process.exit(2);
});
