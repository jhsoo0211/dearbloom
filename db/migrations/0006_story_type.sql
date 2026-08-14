-- 0006_story_type.sql
-- dearbloom : flower_stories.story_type — 이야기가 어느 갈래인지(design-spec §1.5f).
-- Target: Supabase Postgres 15+.  Run after 0005_story_tags.sql.
--
--   folklore  설화·전승·신화
--   history   기록으로 확인되는 역사·사실
--   literary  특정 문학 작품에서 온 이야기
--   original  dearbloom 창작
--
-- Column name is 1:1 snake_case with content/stories.csv.


-- ---------------------------------------------------------------------------
-- Column.
-- Defaults to 'folklore' so the ALTER succeeds on rows that already exist; the
-- seed immediately overwrites it (story_type is required in the CSV).
-- Keep the list in sync with STORY_TYPES in db/seed/schemas.ts and StoryType in
-- src/lib/engine/types.ts.
-- ---------------------------------------------------------------------------
alter table flower_stories
  add column story_type text not null default 'folklore'
    check (story_type in ('folklore', 'history', 'literary', 'original'));

comment on column flower_stories.story_type is
  '이야기의 갈래. folklore | history | literary | original. original 은 dearbloom 창작이며 화면에 창작 라벨 필수';


-- ---------------------------------------------------------------------------
-- Sources: 'original' is the one exemption.
--
-- 0004 made source_url NOT NULL on the rule "출처 없는 이야기는 싣지 않는다".  §1.5f
-- keeps that rule for the three sourced kinds and carves out exactly one hole:
-- a story dearbloom made up has no source to cite.  The single prohibition is
-- that fiction must not read as fact, and the UI enforces that with the
-- "dearbloom이 지어 본 이야기예요" label.
--
-- So the constraint moves from the column to the pair.  Dropping NOT NULL alone
-- would let a *folklore* row slip in with no source, which is the thing we
-- actually care about — the CHECK below is what keeps that impossible.  The two
-- statements belong together; never run the first without the second.
--
-- Same rule on the editorial side: db/seed/schemas.ts (StoryRowSchema) refuses a
-- non-original row with an empty source_url and fails `npm run seed` with the
-- exact CSV line, long before anything reaches the database.
-- ---------------------------------------------------------------------------
alter table flower_stories alter column source_url drop not null;

alter table flower_stories
  add constraint flower_stories_source_required check (
    story_type = 'original' or source_url is not null
  );
