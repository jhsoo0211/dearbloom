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
| `seed/` | CSV → SQL seed data (loaded after the migrations) |

## How to apply

No Supabase CLI wiring yet — apply by hand:

1. Supabase Dashboard → **SQL Editor** → New query.
2. Paste and run **`0001_catalog.sql`**, then **`0002_results_share.sql`**, then **`0003_rls.sql`**, then **`0004_stories.sql`**, then **`0005_story_tags.sql`**. The order matters: 0002 has no FK into 0001, but 0003 references tables from both, 0004 has an FK into `flowers` (0001) and carries its own RLS policy, and 0005 alters the table 0004 creates.
3. Load `seed/` afterwards. Seeding runs as `service_role`/owner, which bypasses RLS, so it is unaffected by 0003.
4. Once the seed has filled `flower_stories.moods` on every row, run the one line left at the bottom of 0005: `alter table flower_stories validate constraint flower_stories_moods_not_empty;`. It is added `not valid` because rows that predate the migration carry the `'{}'` default and would fail validation on the spot.

`0001`, `0002`, and `0004` use plain `create table` and will error on a second run — that is intentional, so an accidental re-run cannot clobber live data. `0005` is `alter table … add column` and errors the same way, for the same reason. `0003` drops each policy before creating it and uses `create or replace view`, so it is safe to re-run on its own whenever policies change; `0004`'s policy block follows the same drop-before-create style.

### `flower_stories` vocabulary is enforced twice, on purpose

Postgres cannot CHECK array elements one by one, so 0005 uses the containment operator (`moods <@ array[…]`) — correct, but its error message names the constraint, not the offending element. That is acceptable because the CHECKs are a backstop, not the primary gate: `db/seed/schemas.ts` validates every CSV row first and fails `npm run seed` with the exact file, line, and column. Whenever `STORY_MOODS` or `INTENTS` changes there, the array literals in 0005 have to move with it.

## File naming — migration to the Supabase CLI

Files are numbered sequentially (`0001_` … `0005_`) while we apply them manually. When the project moves to the Supabase CLI, rename each file into `supabase/migrations/<timestamp>_*.sql` (e.g. `20260814090000_catalog.sql`), keeping the same relative order — the CLI orders migrations by that leading UTC timestamp, not by sequence number. Rename rather than re-author, so the applied SQL stays byte-identical to what production already ran, and record the already-applied files in `supabase_migrations.schema_migrations` (`supabase migration repair --status applied <version>`) so the CLI does not try to run them again.

## TODO — enable pg_cron

`private_payload` (the memory-derived personal message) is meant to be wiped once `expires_at` passes. The purge job is written but **commented out** at the bottom of `0002_results_share.sql` because pg_cron is not enabled on this project yet.

Week 2, after the Supabase project is connected: Dashboard → Database → Extensions → enable `pg_cron`, then uncomment and run the `cron.schedule('purge-expired-private', ...)` statement. Until that job is live, the app must treat `private_payload` as gone whenever `expires_at < now()` and never render it.

## Why the `share_results` view exists

- RLS is **row**-level. One policy cannot show `public_payload` while hiding `private_payload` on the same row, so `recommendation_results` gets owner-only policies and no public policy at all.
- `share_results` selects only `id`, `public_payload`, `created_at`. With `security_invoker = false` (the default, stated explicitly) it runs with the view owner's privileges and so bypasses the base table's RLS — the select list becomes the column filter.
- Result ids are uuidv4 and unguessable, so "knows the link ⇒ can read the public half" is the intended sharing rule. If share links ever need rate limiting, expiry checks, or view counts, swap the view for the `security definer` RPC sketched in the comments of `0003_rls.sql`.
