-- 0002_results_share.sql
-- dearbloom : two-layer recommendation results + share cards.
-- Target: Supabase Postgres 15+.  Run after 0001_catalog.sql.
--
-- Why two layers on one row:
--   public_payload  = everything a share URL is allowed to render
--                     (3 flower picks, meanings + sources, reasons, alternatives).
--   private_payload = the personal layer (멘트 that reflects the user's memories).
--                     Owner-only, and wiped once expires_at passes.
-- RLS is row-level, not column-level, so the split lives in the data model:
--   the owner reads the row, the public reads the share_results view (0003)
--   which only ever projects public_payload.


-- ---------------------------------------------------------------------------
-- recommendation_results
-- ---------------------------------------------------------------------------
create table recommendation_results (
  id              uuid primary key default gen_random_uuid(),
  owner_uid       uuid not null,                 -- auth.uid(), anonymous sign-ins included
  public_payload  jsonb not null,                -- 꽃 3안 · 꽃말+출처 · 이유 · 대체 꽃  -> read by the share URL
  private_payload jsonb,                         -- 추억 반영 멘트 -> owner only, cleared at expires_at
  expires_at      timestamptz,                   -- null = no scheduled purge
  created_at      timestamptz not null default now()
);

create index on recommendation_results (expires_at);
create index on recommendation_results (owner_uid);


-- ---------------------------------------------------------------------------
-- share_cards : an immutable snapshot of exactly the text the user confirmed
--               via '카드에 담기'. Never derived automatically from the result.
-- ---------------------------------------------------------------------------
create table share_cards (
  id         uuid primary key default gen_random_uuid(),
  result_id  uuid not null references recommendation_results (id) on delete cascade,
  snapshot   jsonb not null,                     -- only what the user put on the card
  created_at timestamptz not null default now()
);

create index on share_cards (result_id);


-- ---------------------------------------------------------------------------
-- Scheduled purge of the private layer.
-- pg_cron is NOT enabled yet on this project, so this stays commented out.
-- TODO(week-2, Supabase 연결 후 pg_cron 활성화):
--   1) Dashboard > Database > Extensions 에서 pg_cron 활성화
--   2) 아래 주석 해제 후 실행
--
-- select cron.schedule('purge-expired-private', '0 4 * * *',
--   $$update recommendation_results set private_payload = null where expires_at < now()$$);
--
-- Until then the app must treat private_payload as expired client-side whenever
-- expires_at < now(), and never render it.
-- ---------------------------------------------------------------------------
