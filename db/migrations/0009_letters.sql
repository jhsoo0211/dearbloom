-- 0009_letters.sql
-- dearbloom : 비밀 편지 (secret letters) — a letter the sender stores on purpose,
--             opened by whoever knows its code ("편지 번호" on screen).
-- Target: Supabase Postgres 15+.  Run after 0008_quotes_literature.sql.
--
-- NOT APPLIED YET. The feature currently ships with the localStorage adapter in
-- `src/lib/letters/store.ts`; this file is the shape the server side will take.
-- Read that file's header first — it explains why `code_hash` is a plaintext
-- code locally and a real hash here.
-- ⚠ `0014_letters_server.sql` makes `owner_uid` NULLABLE (null = an operator-seeded
--   letter, reachable by its code only) and adds the write doors this file lacks
--   (`save_letter` / `seed_letter`). Apply it right after this one.
--
-- Why this table looks like 0002's results table:
--   payload   = the letter itself (recipient, title, body, flower, theme,
--               signature). One jsonb column, not six text columns, because the
--               app already owns the shape (zod: letterContentSchema) and the DB
--               has no business re-deciding what a letter contains.
--   code_hash = the only thing a reader proves. Never the code itself.
-- Unlike 0002 there is no public/private split: a letter has exactly one
-- audience (the person holding the code), and that audience gets all of it.


-- ---------------------------------------------------------------------------
-- pgcrypto : crypt() / gen_salt() for the code hash.
-- Supabase ships this extension in the `extensions` schema.
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;


-- ---------------------------------------------------------------------------
-- letters
-- ---------------------------------------------------------------------------
create table letters (
  id         uuid primary key default gen_random_uuid(),
  -- auth.uid() of whoever wrote it, anonymous sign-ins included. Needed for the
  -- owner policies below: "소유자 전권" has to be anchored to a subject, and the
  -- reader (who only knows the code) is deliberately NOT that subject.
  owner_uid  uuid not null,
  -- bcrypt digest of the normalized (trimmed, uppercased) code.
  --   insert :  crypt(p_code, gen_salt('bf'))
  --   compare:  code_hash = crypt(p_code, code_hash)
  -- Never store, log, or return the code — the writer keeps it.
  code_hash  text not null,
  -- 편지 본문 그대로. See `letterContentSchema` for the shape and the length caps
  -- (recipient 20 / title 30 / body 1000 / signature 20). The caps are enforced
  -- by the app; the check below only refuses payloads that are not letters.
  payload    jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- First time anyone opened it. Written by open_letter(); the writer's own
  -- preview never touches it (that read goes through the owner policy).
  opened_at  timestamptz,
  -- null = 보관 기한 없음. The purge job below clears expired letters.
  expires_at timestamptz,

  constraint letters_payload_is_letter check (
    payload ? 'recipientName'
    and payload ? 'body'
    and payload ? 'flowerId'
    and payload ? 'theme'
    and payload ? 'signature'
  )
);

create index on letters (owner_uid);
create index on letters (expires_at);

-- Codes are 4~8 chars, so two live letters must not share one — otherwise
-- open_letter() would have to pick a winner and the loser's letter becomes
-- unreachable without ever saying so. A plain unique index is the honest
-- version: reuse of a retired code becomes possible only after the purge job
-- deletes the row, and the app surfaces the clash as
-- `LetterCodeTakenError` ("이 번호는 다른 편지가 쓰고 있어요").
-- ⚠ bcrypt salts differ per row, so equal codes do NOT produce equal hashes.
--    This index therefore does NOT catch duplicates — the uniqueness check has
--    to run in open_letter()/the insert path (see the note in section 3).
create index on letters (created_at desc);


-- ---------------------------------------------------------------------------
-- updated_at : keep it honest without trusting the client.
-- ---------------------------------------------------------------------------
create or replace function letters_touch_updated_at()
  returns trigger
  language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists letters_touch on letters;
create trigger letters_touch
  before update on letters
  for each row execute function letters_touch_updated_at();


-- ===========================================================================
-- 1. RLS : owner has everything, the reader has nothing.
--
--    There is deliberately NO select policy for anon/authenticated-non-owner.
--    Reading by code goes through open_letter() (section 3), a security definer
--    function — that is the only door, and it is a door we can count, throttle
--    and log. A "select where code_hash = crypt(...)" policy would look
--    equivalent and would not be: it lets a client run one comparison per row
--    per request, i.e. an offline-speed brute force with our CPU.
-- ===========================================================================
alter table letters enable row level security;

drop policy if exists letters_owner_select on letters;
create policy letters_owner_select
  on letters for select
  to authenticated
  using (owner_uid = auth.uid());

drop policy if exists letters_owner_insert on letters;
create policy letters_owner_insert
  on letters for insert
  to authenticated
  with check (owner_uid = auth.uid());

drop policy if exists letters_owner_update on letters;
create policy letters_owner_update
  on letters for update
  to authenticated
  using (owner_uid = auth.uid())
  with check (owner_uid = auth.uid());

drop policy if exists letters_owner_delete on letters;
create policy letters_owner_delete
  on letters for delete
  to authenticated
  using (owner_uid = auth.uid());


-- ===========================================================================
-- 2. Brute force : what a 4~8 char code is actually worth.
--
--    The alphabet is 31 chars (LETTER_CODE_ALPHABET — I/L/O/0/1 removed so the
--    code can be read aloud). Generated codes are 6 chars = 31^6 ≈ 8.9e8, but a
--    user may set their own 4-char code = 31^4 ≈ 9.2e5. At 10 guesses/second
--    that is a day and a half; unthrottled over HTTP it is minutes.
--
--    So the code alone is NOT the security boundary. Three things are:
--      a) bcrypt (gen_salt('bf')) makes each comparison cost ~100ms of server
--         CPU. That is the point — it is a rate limiter baked into the hash.
--      b) letter_open_attempts (below) counts misses per IP/session and stops
--         answering after a handful, which is the same habit the client already
--         practices (5 misses -> short wait in `LetterGate`).
--      c) open_letter() answers "not found" identically for a wrong code, an
--         expired letter, and a letter that never existed. No oracle.
--
--    TODO(Supabase 연결 시): 아래 표와 검사를 함께 켠다. 지금 켜 두면 적용도 안 한
--    마이그레이션이 트래픽 없는 표를 하나 더 들고 있게 된다(0002 의 pg_cron 과 같은 판단).
--
-- create table letter_open_attempts (
--   id         bigserial primary key,
--   -- who tried: auth.uid() when signed in, else a caller-supplied opaque key
--   -- (edge function fills it from a hashed IP — never store a raw IP here).
--   actor_key  text not null,
--   tried_at   timestamptz not null default now(),
--   hit        boolean not null
-- );
-- create index on letter_open_attempts (actor_key, tried_at desc);
--
-- and inside open_letter(), before the crypt() comparison:
--   if (select count(*) from letter_open_attempts
--        where actor_key = p_actor and hit = false
--          and tried_at > now() - interval '10 minutes') >= 10 then
--     raise exception 'too many attempts' using errcode = '42901';
--   end if;
-- ===========================================================================


-- ===========================================================================
-- 3. open_letter(code) : the reader's only door.
--
--    security definer + a pinned search_path so it runs with the owner's rights
--    (it must see rows the caller cannot select) and cannot be tricked into
--    resolving `crypt` from a caller-controlled schema.
--
--    Returns 0 rows for: unknown code, expired letter, malformed code. The
--    caller cannot tell which — see (c) above.
--
--    ⚠ Uniqueness: bcrypt salts differ per row, so `code_hash` cannot be
--      indexed for equality. The insert path must therefore call this function
--      (or the same comparison) BEFORE writing, and refuse a code that already
--      opens a live letter. That scan is O(rows) bcrypt comparisons, which is
--      exactly why codes should stay server-generated (6 chars) by default and
--      why letters should carry an `expires_at` — the table has to stay small.
-- ===========================================================================
create or replace function open_letter(p_code text)
  returns table (
    id         uuid,
    payload    jsonb,
    created_at timestamptz
  )
  language plpgsql
  security definer
  set search_path = public, extensions
as $$
declare
  v_code text := upper(btrim(p_code));
  v_row  letters%rowtype;
begin
  -- Shape check first: a malformed code never reaches crypt(), so garbage costs
  -- us nothing. The pattern mirrors LETTER_CODE_PATTERN in the app.
  -- {4,12}: 2026-08-16 생성 기본이 10자리로 늘며 앱 상한이 12가 됐다(LETTER_LIMITS.codeMax).
  if v_code !~ '^[A-Z0-9]{4,12}$' then
    return;
  end if;

  select * into v_row
    from letters l
   where (l.expires_at is null or l.expires_at > now())
     and l.code_hash = crypt(v_code, l.code_hash)
   limit 1;

  if not found then
    return;
  end if;

  -- First open is worth recording; later opens leave it alone (the "언제 처음
  -- 열렸나" is the writer's question, and overwriting it would erase the answer).
  if v_row.opened_at is null then
    update letters set opened_at = now() where letters.id = v_row.id;
  end if;

  id         := v_row.id;
  payload    := v_row.payload;
  created_at := v_row.created_at;
  return next;
end;
$$;

revoke all on function open_letter(text) from public;
grant execute on function open_letter(text) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- Scheduled purge of expired letters.
-- pg_cron is NOT enabled on this project yet (same situation as 0002).
-- TODO(Supabase 연결 후 pg_cron 활성화):
--   select cron.schedule('purge-expired-letters', '20 4 * * *',
--     $$delete from letters where expires_at is not null and expires_at < now()$$);
--
-- Until then open_letter() already refuses expired rows, so an unpurged row is
-- storage, not exposure.
-- ---------------------------------------------------------------------------
