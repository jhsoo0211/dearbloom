/**
 * 콘텐츠 시드 CLI.
 *
 *   npm run seed          기본값 = dry-run. 파싱 → 행 스키마 → 교차 검증 → 리포트. DB를 건드리지 않는다.
 *   npm run seed:apply    검증을 모두 통과했을 때만 upsert 단계로 넘어간다.
 *
 * 옵션
 *   --content=<dir>       CSV 디렉터리 (기본: <cwd>/content, 환경변수 DEARBLOOM_CONTENT_DIR 도 가능)
 *
 * 종료 코드
 *   0 — 검증 통과 (dry-run)
 *   1 — 검증 오류 있음 / Supabase 미설정
 *   2 — 예상치 못한 실패(파싱 예외 등)
 *   3 — upsert 미구현 (환경은 정상)
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

function resolveContentDir(argv: string[]): string {
  const flag = argv.find((arg) => arg.startsWith('--content='));
  if (flag) return path.resolve(flag.slice('--content='.length));
  if (process.env.DEARBLOOM_CONTENT_DIR) return path.resolve(process.env.DEARBLOOM_CONTENT_DIR);
  return path.resolve(process.cwd(), 'content');
}

function main(): void {
  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
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
    runUpsert(dataset as SeedDataset);
  }
}

try {
  main();
} catch (error) {
  console.error('시드 실행 중 예상치 못한 오류가 발생했습니다.');
  console.error(error);
  process.exit(2);
}
