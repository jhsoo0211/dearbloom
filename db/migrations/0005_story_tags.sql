-- 0005_story_tags.sql
-- dearbloom : selection tags for flower_stories — the columns the story picker
--             (src/lib/engine/stories.ts, pickStories) reads to answer
--             "which of this flower's stories fits *this* situation?".
-- Target: Supabase Postgres 15+.  Run after 0004_stories.sql.
--
--   moods    text[]  not null  -- 'romantic' | 'tragic' | 'funny' | 'mythic' | 'dramatic' | 'healing'
--                              -- at least one; moods[1] is the story's primary mood
--   intents  text[]  nullable  -- shares the app's intent vocabulary
--                              -- EMPTY / NULL MEANS "fits every situation", not "unknown"
--   hook     text    nullable  -- one-line teaser shown before the story body
--
-- Column names are 1:1 snake_case with content/stories.csv.


-- ---------------------------------------------------------------------------
-- Columns.
-- moods defaults to '{}' so the ALTER succeeds on rows that already exist; the
-- seed immediately overwrites it with real values (moods is required in the CSV).
-- ---------------------------------------------------------------------------
alter table flower_stories
  add column moods    text[] not null default '{}',
  add column intents  text[],
  add column hook     text;

comment on column flower_stories.moods is
  '이야기의 결. 최소 1개. 첫 원소가 대표 분위기 (목록 다양성 기준)';
comment on column flower_stories.intents is
  '이 이야기가 특히 어울리는 상황. 비어 있으면 "모든 상황"이라는 뜻';
comment on column flower_stories.hook is
  '목록에서 먼저 보여 주는 한 줄 후킹 문장';


-- ---------------------------------------------------------------------------
-- Vocabulary constraints.
--
-- Postgres has no per-element CHECK on an array column: a CHECK sees the whole
-- value at once, so there is no way to write "each element must be one of ..."
-- element-wise.  The closest thing is the containment operator `<@`, used below —
-- `moods <@ array[...]` is true only when *every* element of moods appears in the
-- allowed list.  Two limitations worth knowing:
--
--   1. The error message names the constraint, not the offending element.  A
--      per-element message would need a BEFORE INSERT OR UPDATE trigger looping
--      over unnest(moods); we deliberately do not add one, because the real
--      editorial gate runs earlier and reports better: db/seed/schemas.ts
--      (STORY_MOODS / INTENTS) fails `npm run seed` with the exact CSV line and
--      column before anything reaches the database.
--   2. `<@` compares with equality, and NULL equals nothing, so an array holding
--      a NULL element (`{romantic,NULL}`) is rejected as well.  That is what we
--      want here.
--
-- Keep these lists in sync with STORY_MOODS / INTENTS in db/seed/schemas.ts.
-- ---------------------------------------------------------------------------
alter table flower_stories
  add constraint flower_stories_moods_vocab check (
    moods <@ array['romantic', 'tragic', 'funny', 'mythic', 'dramatic', 'healing']::text[]
  ),
  add constraint flower_stories_intents_vocab check (
    intents is null or intents <@ array[
      'apology', 'confession', 'gratitude', 'celebration',
      'comfort', 'anniversary', 'just_because', 'other'
    ]::text[]
  );

-- "at least one mood" cannot be validated immediately: rows created before this
-- migration carry the '{}' default and would fail the check on the spot.  Add it
-- NOT VALID (enforced on every future insert/update, existing rows untouched),
-- then run the seed and validate.
--
-- Use cardinality(), not array_length(): array_length('{}', 1) is NULL, and a
-- CHECK that evaluates to NULL passes — the constraint would silently allow the
-- empty array it is meant to forbid.  cardinality('{}') is 0.
alter table flower_stories
  add constraint flower_stories_moods_not_empty check (cardinality(moods) >= 1) not valid;

-- After `npm run seed:apply` has filled moods on every row:
--   alter table flower_stories validate constraint flower_stories_moods_not_empty;


-- ---------------------------------------------------------------------------
-- No GIN index on moods/intents on purpose.  Selection does not happen in SQL:
-- the app loads a flower's handful of stories (already covered by
-- flower_stories_flower_id_idx from 0004) and pickStories() ranks them in
-- memory.  Add `using gin (moods)` only once something actually filters by mood
-- across the whole table.
-- ---------------------------------------------------------------------------
