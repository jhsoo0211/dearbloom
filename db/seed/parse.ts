import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';

/** CSV 한 행. csv-parse 의 `columns: true` 출력이라 값은 항상 문자열이다. */
export type CsvRecord = Record<string, string>;

/**
 * CSV 텍스트를 레코드 배열로 파싱한다.
 *
 * - `bom: true` — UTF-8 BOM 이 붙어 있어도(에디터가 붙이는 경우) 첫 컬럼명이 깨지지 않는다.
 * - `trim: true` — 값 앞뒤 공백 제거.
 * - `skip_empty_lines: true` — 파일 끝 빈 줄 무시.
 * - `columns: true` — 첫 줄을 헤더로 사용.
 *
 * 컬럼 수가 헤더와 다르면 csv-parse 가 예외를 던진다(느슨하게 넘기지 않는다).
 */
export function parseCsv(text: string): CsvRecord[] {
  return parse(text, {
    bom: true,
    trim: true,
    skip_empty_lines: true,
    columns: true,
  }) as CsvRecord[];
}

/** CSV 파일을 UTF-8 로 읽어 파싱한다. */
export function readCsv(filePath: string): CsvRecord[] {
  return parseCsv(readFileSync(filePath, 'utf8'));
}

/**
 * CSV 데이터 행 인덱스(0-based) → 파일의 실제 줄 번호.
 * 1번 줄이 헤더이므로 +2 한다. 오류 리포트의 행 번호가 에디터와 일치하도록.
 */
export function csvLineNumber(rowIndex: number): number {
  return rowIndex + 2;
}
