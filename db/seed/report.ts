/**
 * 시드 검증 리포트 렌더링.
 *
 * 출력 형식은 사람이 바로 고칠 수 있게 맞춘다:
 *   [파일명:행번호] 컬럼 — 메시지
 * 행번호는 CSV 파일의 실제 줄 번호(헤더가 1번 줄)라서 에디터에서 그대로 찾아갈 수 있다.
 */

export interface SeedIssue {
  /** CSV 파일명. 예: `meanings.csv` */
  file: string;
  /** CSV 파일의 실제 줄 번호. 특정 행을 짚을 수 없으면 null. */
  line: number | null;
  /** 문제가 있는 컬럼명. 행 전체 문제면 `-`. */
  column: string;
  message: string;
}

export interface FileSummary {
  file: string;
  /** 파싱된 데이터 행 수(헤더 제외). 읽지 못했으면 null. */
  rows: number | null;
}

export interface CrossCheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

export interface SeedReport {
  mode: 'dry-run' | 'apply';
  contentDir: string;
  files: FileSummary[];
  crossChecks: CrossCheckResult[];
  issues: SeedIssue[];
}

export function formatIssue(issue: SeedIssue): string {
  const line = issue.line === null ? '-' : String(issue.line);
  return `[${issue.file}:${line}] ${issue.column} — ${issue.message}`;
}

/** 터미널 표시 폭. 한글·CJK 는 두 칸을 차지하므로 2로 센다. */
function displayWidth(value: string): number {
  let width = 0;
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    const isWide =
      (code >= 0x1100 && code <= 0x115f) || // 한글 자모
      (code >= 0x2e80 && code <= 0xa4cf) || // CJK 부수 ~ 이(Yi)
      (code >= 0xac00 && code <= 0xd7a3) || // 한글 음절
      (code >= 0xf900 && code <= 0xfaff) || // CJK 호환 한자
      (code >= 0xff00 && code <= 0xff60); // 전각 기호
    width += isWide ? 2 : 1;
  }
  return width;
}

function padEnd(value: string, width: number): string {
  const current = displayWidth(value);
  return current >= width ? value : value + ' '.repeat(width - current);
}

export function renderReport(report: SeedReport): string {
  const lines: string[] = [];

  lines.push('DearBloom 콘텐츠 시드 검증');
  lines.push('='.repeat(34));
  lines.push(`모드: ${report.mode === 'apply' ? 'apply (DB 반영)' : 'dry-run (읽기 전용)'}`);
  lines.push(`대상: ${report.contentDir}`);
  lines.push('');

  lines.push('파일');
  const nameWidth = Math.max(...report.files.map((f) => displayWidth(f.file)), 6) + 2;
  for (const file of report.files) {
    const count = file.rows === null ? '읽기 실패' : `${file.rows}행`;
    lines.push(`  ${padEnd(file.file, nameWidth)}${count}`);
  }
  const total = report.files.reduce((sum, f) => sum + (f.rows ?? 0), 0);
  lines.push(`  ${padEnd('합계', nameWidth)}${total}행`);
  lines.push('');

  lines.push('교차 검증');
  if (report.crossChecks.length === 0) {
    lines.push('  (파일 검증 실패로 건너뜀)');
  } else {
    for (const check of report.crossChecks) {
      lines.push(`  [${check.ok ? 'OK' : 'FAIL'}] ${check.name} — ${check.detail}`);
    }
  }
  lines.push('');

  if (report.issues.length > 0) {
    lines.push(`오류 ${report.issues.length}건`);
    for (const issue of report.issues) {
      lines.push(`  ${formatIssue(issue)}`);
    }
    lines.push('');
    lines.push(`결과: 실패 (오류 ${report.issues.length}건)`);
  } else {
    lines.push('결과: 통과 (오류 0건)');
  }

  return lines.join('\n');
}

/**
 * 리포트를 출력하고 종료 코드를 정한다.
 * 오류가 하나라도 있으면 `process.exitCode = 1`.
 */
export function printReport(report: SeedReport): number {
  const text = renderReport(report);
  if (report.issues.length > 0) {
    console.error(text);
    process.exitCode = 1;
    return 1;
  }
  console.log(text);
  process.exitCode = 0;
  return 0;
}
