/**
 * DB 반영 단계 — 아직 구현 전(week-2).
 *
 * 지금은 "환경이 준비됐는지"만 확인하고 명확히 멈춘다.
 * 조용히 성공한 척해서 반영된 줄 알게 만드는 쪽이 훨씬 위험하다.
 *
 * 종료 코드
 *   1 — Supabase 환경변수 없음(.env 필요)
 *   3 — 환경은 준비됐지만 upsert 미구현
 */

import type { SeedDataset } from './schemas';

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

/** 환경변수에서 Supabase 설정을 읽는다. 하나라도 비면 null. */
export function readSupabaseConfig(env: NodeJS.ProcessEnv = process.env): SupabaseConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

/**
 * 검증을 통과한 데이터셋을 DB에 반영한다(예정).
 * 현재는 어떤 경우에도 프로세스를 종료시킨다.
 */
export function runUpsert(dataset: SeedDataset): never {
  const config = readSupabaseConfig();

  if (config === null) {
    console.error('Supabase 미설정 — .env 필요');
    console.error('  NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 를 설정하세요.');
    console.error('  .env.example 을 복사해 .env 로 만든 뒤 값을 채우면 됩니다.');
    process.exit(1);
  }

  const total = Object.values(dataset).reduce((sum, rows) => sum + rows.length, 0);
  console.error(`upsert not implemented (week-2) — 검증 통과한 ${total}행을 반영하지 않고 종료합니다.`);
  console.error(`  대상: ${config.url}`);
  process.exit(3);
}
