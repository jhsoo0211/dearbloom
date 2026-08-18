-- 0013_flower_occasions.sql
-- dearbloom : flower_occasions — §1.5h 「이런 날 건네보세요」 상황 예시.
-- Target: Supabase Postgres 15+.  Run after 0012_reads.sql.
--
-- Column names are 1:1 snake_case with content/occasions.csv (0001 머리말과 같은 계약).
-- 이 표는 2026-08-18 에 화면 두 곳의 하드코딩 두 벌(labels.ts · landing-build.ts)을
-- 걷어 와 만든 원장이다 — 문구의 단일 원본은 이제 CSV 다.
--
-- ⚠ surface: 같은 꽃이 화면(맥락)마다 다른 말을 할 수 있다는 **의도된 분화**다
--   (detail = 결과·도감 상세 / landing = 랜딩 / 빈 값 = 모든 화면 공용).
--   공용 행과 화면별 행이 한 꽃에 섞이는 것은 시드 교차 검증 10 이 막는다 —
--   여기서는 어휘만 지킨다(CHECK). 두 문구를 합치기로 정해지는 날 surface 를
--   비우면 이 칸은 저절로 죽는다(db/seed/schemas.ts 의 같은 자리 주석 참조).

create table flower_occasions (
  id           uuid primary key default gen_random_uuid(),
  flower_id    text not null references flowers (id) on delete cascade,
  -- 비어 있으면 모든 화면 공용.
  surface      text check (surface in ('detail', 'landing')),
  occasion_ko  text not null,
  -- 어느 근거(꽃말·이야기·스펙 표)에서 온 문구인지. 화면에 나가지 않는다.
  source_note  text,
  created_at   timestamptz default now(),

  -- replace 전략(시드가 전체 삭제 후 재적재 — db/seed/upsert.ts)이라 자연키 유니크는
  -- 완화해도 되지만, 같은 꽃·같은 화면에 같은 문구가 두 번 서는 것은 데이터 오류다.
  constraint flower_occasions_line_unique unique (flower_id, surface, occasion_ko)
);

create index flower_occasions_flower_idx on flower_occasions (flower_id);

comment on table flower_occasions is
  '§1.5h 「이런 날 건네보세요」 상황 예시 — 원본은 content/occasions.csv';
comment on column flower_occasions.surface is
  '화면 갈래(detail/landing). 비면 공용 — 같은 꽃이 화면마다 다른 말을 하는 것은 의도다';

-- ---------------------------------------------------------------------------
-- RLS : 공개 카탈로그 콘텐츠 — reads(0012)와 같은 등급.
--       쓰기 정책 없음 -> service_role(시드)·마이그레이션 전용.
-- ---------------------------------------------------------------------------
alter table flower_occasions enable row level security;

drop policy if exists flower_occasions_public_read on flower_occasions;
create policy flower_occasions_public_read
  on flower_occasions for select
  to anon, authenticated
  using (true);
