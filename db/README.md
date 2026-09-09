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
| `migrations/0008_quotes_literature.sql` | `quotes.flower_id` / `.excerpt_type` / `.text_original` / `.translator` / `.caveat` / `.pd_basis` — the literature-excerpt columns behind the result screen's "문학 속의 이 꽃" block |
| `migrations/0009_letters.sql` | `letters` (code-locked private letters) — `code_hash`, owner-only RLS, and the `open_letter(code)` security-definer read path |
| `migrations/0010_birth_flowers.sql` | `birth_flowers` (366-day birth-flower table) with public-read RLS and an optional FK into `flowers` |
| `migrations/0011_birth_photos_stories.sql` | `birth_photos` (one photo per calendar day, FK on `(month, day)`, license allow-list CHECK) and `birth_stories` (stories owned by `name_ko`, not a flower id) — both public-read |
| `migrations/0012_reads.sql` | `reads` (the 「읽을거리」 link ledger — external articles, guides, trends, and dated events) with public-read RLS, a `tags` GIN index, and the dates-belong-to-events-only CHECK |
| `migrations/0013_flower_occasions.sql` | `flower_occasions` (§1.5h 「이런 날 건네보세요」 lines, one row per flower/surface) with public-read RLS and a per-surface uniqueness constraint |
| `migrations/0014_letters_server.sql` | Makes `letters.owner_uid` nullable (null = an operator-seeded letter) and adds the two write doors 0009 lacked: `save_letter` (authenticated) and `seed_letter` (service_role) |
| `seed/` | CSV → SQL seed data (loaded after the migrations; `npm run seed -- --apply` upserts every table, `npm run letters:seed -- --file <path> --apply` plants operator letters) |

## How to apply

No Supabase CLI wiring yet — apply by hand:

1. Supabase Dashboard → **SQL Editor** → New query.
2. Paste and run **`0001_catalog.sql`** through **`0014_letters_server.sql`** in file-number order. The order matters: 0002 has no FK into 0001, but 0003 references tables from both, 0004 has an FK into `flowers` (0001) and carries its own RLS policy, 0005, 0006, and 0007 all alter the table 0004 creates, 0008 alters `quotes` (0001) with an FK back into `flowers` (0001), 0010 has an optional FK into `flowers` (0001), 0011 has a **composite FK into `birth_flowers (month, day)`** so it must follow 0010, 0013 has an FK into `flowers` (0001), and 0014 alters the table 0009 creates. `0012_reads.sql` stands alone — `reads` has no FK into any other table (its `links_to` references are plain text the CSV gate cross-checks against `flowers.csv`), so it can be applied at any point after 0001.

   **Only enabling the letters (`/letter`)?** Then `0009_letters.sql` → `0014_letters_server.sql` is the whole list. Letters do not touch the catalog: `letters` has no FK into any other table, so neither file needs 0001–0008. Everything else in the app keeps reading `content/*.csv`.
3. Load `seed/` afterwards. Seeding runs as `service_role`/owner, which bypasses RLS, so it is unaffected by 0003.
4. Once the seed has filled `flower_stories.moods` on every row, run the one line left at the bottom of 0005: `alter table flower_stories validate constraint flower_stories_moods_not_empty;`. It is added `not valid` because rows that predate the migration carry the `'{}'` default and would fail validation on the spot.

`0001`, `0002`, and `0004` use plain `create table` and will error on a second run — that is intentional, so an accidental re-run cannot clobber live data. `0005`, `0006`, `0007`, and `0008` are `alter table … add column` and error the same way, for the same reason. `0003` drops each policy before creating it and uses `create or replace view`, so it is safe to re-run on its own whenever policies change; `0004`'s policy block follows the same drop-before-create style. `0014` is `alter column … drop not null` plus `create or replace function`, so it is safe to re-run.

### 0014 leaves 0009's policies alone, and that is the design

`letters` gets four owner policies in 0009, all `owner_uid = auth.uid()`. 0014 makes that column nullable so an operator-seeded letter can have **no owner at all** — and a null owner matches none of those four policies, which is exactly right: such a letter never appears in anyone's list, nobody can edit or delete it, and the only door to it is `open_letter(code)`. The write path for those rows is `seed_letter`, a security-definer function granted to `service_role` only, so the browser cannot create ownerless rows. `save_letter` is the mirror image — granted to `authenticated`, it always stamps `owner_uid = auth.uid()` and refuses to touch a row it does not own.

Both functions take the **plaintext** code and hash it themselves (`crypt(code, gen_salt('bf'))`). No caller ever computes a hash, and no caller ever gets one back: bcrypt salts differ per row, so the "is this code taken?" check has to be a scan inside these functions (0009 §3 explains why a unique index cannot do it). That scan is the reason letters should carry an `expires_at` — the table has to stay small.

### `source_url` is required by `story_type`, not by the column

0004 declared `source_url NOT NULL` on the rule "출처 없는 이야기는 싣지 않는다". 0006 keeps that rule but moves where it lives: `story_type = 'original'` marks a story dearbloom wrote itself, which has no source to cite, so 0006 drops the column's NOT NULL and immediately replaces it with `flower_stories_source_required` — `story_type = 'original' or source_url is not null`. Dropping the NOT NULL without that CHECK would quietly let a *folklore* row in with no source, which is the case we actually care about, so the two statements in 0006 must never be split. The UI side of the same bargain is the mandatory "dearbloom이 지어 본 이야기예요" label on `original` rows (design-spec §1.5f).

### `flower_stories` vocabulary is enforced twice, on purpose

Postgres cannot CHECK array elements one by one, so 0005 uses the containment operator (`moods <@ array[…]`) — correct, but its error message names the constraint, not the offending element. That is acceptable because the CHECKs are a backstop, not the primary gate: `db/seed/schemas.ts` validates every CSV row first and fails `npm run seed` with the exact file, line, and column. Whenever `STORY_MOODS` or `INTENTS` changes there, the array literals in 0005 have to move with it — and likewise `STORY_TYPES` with the `story_type` CHECK in 0006, and `SOURCE_KINDS` with the `source_kind` CHECK in 0007.

### `confidence_level` counts sources; `source_kind` says what they are

0007 exists because those two questions were collapsed into one column and the screen paid for it. 68 rows are `single_source`, and 50 of them use `paper`, `museum`, `book-pd`, `newspaper`, or `garden` sources — sources that are singular, not necessarily shaky. Labelling all 68 "드물게 전해지는 이야기예요" (a phrase meant for hearsay with no primary record) would understate the data. `source_kind` splits the label: `paper` / `museum` / `book-pd` / `newspaper` / `garden` read as "기록으로 남아 있는 이야기예요", while `magazine` / `wiki` / `other` keep the original wording. The split itself lives in exactly one function, `storyConfidenceLabel()` in `src/components/flow/labels.ts`, and both the result screen and `/stories` call it — never re-derive the label at a call site.

The column defaults to `'other'` on purpose: `other` falls on the cautious side of that split, so a row nobody classified can only under-claim. Grading a row *up* to `paper` or `museum` is the move that can make the UI assert trust it does not have, so when in doubt, write it down, not up.

### `quotes.flower_id` is nullable, and that is the whole design

0008 adds six columns to `quotes` and every one of them is nullable. The three rows that
predate the migration are short editorial lines belonging to no particular flower, and they
stay valid untouched — a quote without a flower is not an incomplete row, it is the
*general-purpose* kind, and the result screen's literature block simply never selects it.
That single column is what splits the table's two uses: `flower_id IS NULL` feeds "함께 담을
한 줄" (§1.5e), `flower_id IS NOT NULL` feeds "문학 속의 이 꽃" (§1.5k).

The FK is `on delete set null`, unlike `flower_stories.flower_id` which cascades. A story
about a flower means nothing once the flower leaves the catalog, but a line of Ovid still
does — dropping a catalog entry should demote the quote to a general one, not destroy a
public-domain excerpt that someone verified against the source by hand.

`quotes_excerpt_needs_flower` covers the opposite mistake: a genre with no flower describes
a literary excerpt that `pickLiterature()` (`src/app/recommend/build-result.ts`) can never reach,
because it matches on `flower_id` alone. Such a row loads clean, seeds clean, and stays
invisible forever, which is the failure mode hardest to notice — so it is made loud in both
gates, the CHECK here and `QuoteRowSchema`'s `superRefine` in `db/seed/schemas.ts`.

`pd_basis` is the one column that must never reach a user. It records *why* we believe a text
is public domain (author's death year, which edition), which is an editor's note, not a
reader's. The loader enforces this by omission: `mapQuote()` does not copy it, and the `Quote`
type has no field for it, so there is no path from the CSV to the screen.

## File naming — migration to the Supabase CLI

Files are numbered sequentially (`0001_` … `0014_`) while we apply them manually. When the project moves to the Supabase CLI, rename each file into `supabase/migrations/<timestamp>_*.sql` (e.g. `20260814090000_catalog.sql`), keeping the same relative order — the CLI orders migrations by that leading UTC timestamp, not by sequence number. Rename rather than re-author, so the applied SQL stays byte-identical to what production already ran, and record the already-applied files in `supabase_migrations.schema_migrations` (`supabase migration repair --status applied <version>`) so the CLI does not try to run them again.

## TODO — enable pg_cron

`private_payload` (the memory-derived personal message) is meant to be wiped once `expires_at` passes. The purge job is written but **commented out** at the bottom of `0002_results_share.sql` because pg_cron is not enabled on this project yet.

Week 2, after the Supabase project is connected: Dashboard → Database → Extensions → enable `pg_cron`, then uncomment and run the `cron.schedule('purge-expired-private', ...)` statement. Until that job is live, the app must treat `private_payload` as gone whenever `expires_at < now()` and never render it.

## Why the `share_results` view exists

- RLS is **row**-level. One policy cannot show `public_payload` while hiding `private_payload` on the same row, so `recommendation_results` gets owner-only policies and no public policy at all.
- `share_results` selects only `id`, `public_payload`, `created_at`. With `security_invoker = false` (the default, stated explicitly) it runs with the view owner's privileges and so bypasses the base table's RLS — the select list becomes the column filter.
- Result ids are uuidv4 and unguessable, so "knows the link ⇒ can read the public half" is the intended sharing rule. If share links ever need rate limiting, expiry checks, or view counts, swap the view for the `security definer` RPC sketched in the comments of `0003_rls.sql`.
