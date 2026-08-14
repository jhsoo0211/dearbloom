-- 0004_stories.sql
-- dearbloom : flower_stories — the anecdotes and origin tales shown next to a
--             recommendation ("왜 이 꽃이 이런 뜻을 갖게 됐나").
-- Target: Supabase Postgres 15+.  Run after 0003_rls.sql.
--
-- Same editorial contract as flower_meanings (0001): every row cites a source
-- and states how well attested it is, so the UI can hedge its wording.
--   confidence_level : repeated | varies | single_source
--
-- Column names are 1:1 snake_case with content/stories.csv.


-- ---------------------------------------------------------------------------
-- flower_stories : several stories per flower (per culture / era). Public,
--                  read-only content — same access class as flowers/meanings.
-- ---------------------------------------------------------------------------
create table flower_stories (
  id                uuid primary key default gen_random_uuid(),
  story_id          text        not null unique,   -- stable id shared with the CSV
  flower_id         text        not null references flowers (id) on delete cascade,
  title             text        not null,
  story_ko          text        not null,
  culture_region    text,                          -- e.g. 'turkey', 'netherlands', 'korea'
  era               text,                          -- e.g. 'ottoman', '17c', 'victorian'
  source_title      text,
  source_url        text        not null,          -- 출처 없는 이야기는 싣지 않는다
  confidence_level  text        not null
    check (confidence_level in ('repeated', 'varies', 'single_source')),
  reviewed_at       date        not null,
  editorial_note    text,
  created_at        timestamptz default now()
);

create index flower_stories_flower_id_idx on flower_stories (flower_id);


-- ---------------------------------------------------------------------------
-- RLS : public catalog content, so world-readable like flowers / meanings.
--       Writes have no policy at all -> service_role / migrations only.
--       Drop-before-create keeps this file re-runnable (same style as 0003).
-- ---------------------------------------------------------------------------
alter table flower_stories enable row level security;

drop policy if exists flower_stories_public_read on flower_stories;
create policy flower_stories_public_read
  on flower_stories for select
  to anon, authenticated
  using (true);
