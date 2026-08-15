# db

Supabase Postgres schema for dearbloom. Target: **Postgres 15+** (`gen_random_uuid()` is built in, `auth.uid()` available, `security_invoker` view option available).

## Files

| File | Contents |
| --- | --- |
| `migrations/0001_catalog.sql` | Public catalog (`flowers`, `flower_meanings`, `pet_safety`), editorial data (`recommendation_rules`, `message_templates`, `quotes`), runtime `config` + `config_history` trigger, `engine_weights` seed row |
| `migrations/0002_results_share.sql` | `recommendation_results` (public/private two-layer payload) and `share_cards` |
| `migrations/0003_rls.sql` | RLS on all 10 tables, policies, and the `share_results` view |
| `migrations/0004_stories.sql` | `flower_stories` (per-flower anecdotes, source required) with its index and public-read policy |
| `migrations/0005_story_tags.sql` | `flower_stories.moods` / `.intents` / `.hook` — the selection tags `pickStories()` reads, plus their vocabulary CHECKs |
| `migrations/0006_story_type.sql` | `flower_stories.story_type` (`folklore` / `history` / `literary` / `original`) and the source rule that hangs off it |
| `migrations/0007_source_kind.sql` | `flower_stories.source_kind` — what *kind* of source backs the story, which is what splits the on-screen confidence wording |
| `seed/` | CSV → SQL seed data (loaded after the migrations) |

## How to apply

No Supabase CLI wiring yet — apply by hand:

1. Supabase Dashboard → **SQL Editor** → New query.
2. Paste and run **`0001_catalog.sql`**, then **`0002_results_share.sql`**, then **`0003_rls.sql`**, then **`0004_stories.sql`**, then **`0005_story_tags.sql`**, then **`0006_story_type.sql`**, then **`0007_source_kind.sql`**. The order matters: 0002 has no FK into 0001, but 0003 references tables from both, 0004 has an FK into `flowers` (0001) and carries its own RLS policy, and 0005, 0006, and 0007 all alter the table 0004 creates.
3. Load `seed/` afterwards. Seeding runs as `service_role`/owner, which bypasses RLS, so it is unaffected by 0003.
4. Once the seed has filled `flower_stories.moods` on every row, run the one line left at the bottom of 0005: `alter table flower_stories validate constraint flower_stories_moods_not_empty;`. It is added `not valid` because rows that predate the migration carry the `'{}'` default and would fail validation on the spot.

`0001`, `0002`, and `0004` use plain `create table` and will error on a second run — that is intentional, so an accidental re-run cannot clobber live data. `0005`, `0006`, and `0007` are `alter table … add column` and error the same way, for the same reason. `0003` drops each policy before creating it and uses `create or replace view`, so it is safe to re-run on its own whenever policies change; `0004`'s policy block follows the same drop-before-create style.

### `source_url` is required by `story_type`, not by the column

0004 declared `source_url NOT NULL` on the rule "출처 없는 이야기는 싣지 않는다". 0006 keeps that rule but moves where it lives: `story_type = 'original'` marks a story dearbloom wrote itself, which has no source to cite, so 0006 drops the column's NOT NULL and immediately replaces it with `flower_stories_source_required` — `story_type = 'original' or source_url is not null`. Dropping the NOT NULL without that CHECK would quietly let a *folklore* row in with no source, which is the case we actually care about, so the two statements in 0006 must never be split. The UI side of the same bargain is the mandatory "dearbloom이 지어 본 이야기예요" label on `original` rows (design-spec §1.5f).

### `flower_stories` vocabulary is enforced twice, on purpose

Postgres cannot CHECK array elements one by one, so 0005 uses the containment operator (`moods <@ array[…]`) — correct, but its error message names the constraint, not the offending element. That is acceptable because the CHECKs are a backstop, not the primary gate: `db/seed/schemas.ts` validates every CSV row first and fails `npm run seed` with the exact file, line, and column. Whenever `STORY_MOODS` or `INTENTS` changes there, the array literals in 0005 have to move with it — and likewise `STORY_TYPES` with the `story_type` CHECK in 0006, and `SOURCE_KINDS` with the `source_kind` CHECK in 0007.

### `confidence_level` counts sources; `source_kind` says what they are

0007 exists because those two questions were collapsed into one column and the screen paid for it. 40 rows are `single_source`, and 29 of them are a peer-reviewed paper, a national archive page, or an 1839 first edition — sources that are singular, not shaky. Labelling all 40 "드물게 전해지는 이야기예요" (a phrase meant for hearsay with no primary record) had the app understating its own data. `source_kind` splits the label: `paper` / `museum` / `book-pd` / `newspaper` / `garden` read as "기록으로 남아 있는 이야기예요", while `magazine` / `wiki` / `other` keep the original wording. The split itself lives in exactly one function, `storyConfidenceLabel()` in `src/components/flow/labels.ts`, and both the result screen and `/stories` call it — never re-derive the label at a call site.

The column defaults to `'other'` on purpose: `other` falls on the cautious side of that split, so a row nobody classified can only under-claim. Grading a row *up* to `paper` or `museum` is the move that can make the UI assert trust it does not have, so when in doubt, write it down, not up.

## File naming — migration to the Supabase CLI

Files are numbered sequentially (`0001_` … `0007_`) while we apply them manually. When the project moves to the Supabase CLI, rename each file into `supabase/migrations/<timestamp>_*.sql` (e.g. `20260814090000_catalog.sql`), keeping the same relative order — the CLI orders migrations by that leading UTC timestamp, not by sequence number. Rename rather than re-author, so the applied SQL stays byte-identical to what production already ran, and record the already-applied files in `supabase_migrations.schema_migrations` (`supabase migration repair --status applied <version>`) so the CLI does not try to run them again.

## TODO — enable pg_cron

`private_payload` (the memory-derived personal message) is meant to be wiped once `expires_at` passes. The purge job is written but **commented out** at the bottom of `0002_results_share.sql` because pg_cron is not enabled on this project yet.

Week 2, after the Supabase project is connected: Dashboard → Database → Extensions → enable `pg_cron`, then uncomment and run the `cron.schedule('purge-expired-private', ...)` statement. Until that job is live, the app must treat `private_payload` as gone whenever `expires_at < now()` and never render it.

## Why the `share_results` view exists

- RLS is **row**-level. One policy cannot show `public_payload` while hiding `private_payload` on the same row, so `recommendation_results` gets owner-only policies and no public policy at all.
- `share_results` selects only `id`, `public_payload`, `created_at`. With `security_invoker = false` (the default, stated explicitly) it runs with the view owner's privileges and so bypasses the base table's RLS — the select list becomes the column filter.
- Result ids are uuidv4 and unguessable, so "knows the link ⇒ can read the public half" is the intended sharing rule. If share links ever need rate limiting, expiry checks, or view counts, swap the view for the `security definer` RPC sketched in the comments of `0003_rls.sql`.
