-- 0003_rls.sql
-- dearbloom : row level security for every table created in 0001 and 0002.
-- Target: Supabase Postgres 15+.  Run after 0002_results_share.sql.
--
-- Access model in one paragraph:
--   * Catalog content that the app renders to anyone (flowers, meanings, pet
--     safety, quotes) is world-readable.
--   * Editorial machinery (rules, templates, config, config history) is
--     service_role only: RLS is on and NO select policy exists, so anon and
--     authenticated see zero rows. service_role bypasses RLS entirely, which is
--     exactly the intended door.
--   * Personal results are owner-only. The public half of a result is exposed
--     through the share_results view, never through a policy.
--
-- All policies are dropped first so this file can be re-run in the SQL Editor.


-- ===========================================================================
-- 1. Enable RLS everywhere (10 tables: 8 from 0001, 2 from 0002).
--    config_history IS one of the 8 — it holds the same secrets as config.
-- ===========================================================================
alter table flowers              enable row level security;
alter table flower_meanings      enable row level security;
alter table pet_safety           enable row level security;
alter table recommendation_rules enable row level security;
alter table message_templates    enable row level security;
alter table quotes               enable row level security;
alter table config               enable row level security;
alter table config_history       enable row level security;

alter table recommendation_results enable row level security;
alter table share_cards            enable row level security;


-- ===========================================================================
-- 2. Public catalog : read-only for everyone.
--    Writes have no policy at all -> service_role / migrations only.
-- ===========================================================================
drop policy if exists flowers_public_read on flowers;
create policy flowers_public_read
  on flowers for select
  to anon, authenticated
  using (true);

drop policy if exists flower_meanings_public_read on flower_meanings;
create policy flower_meanings_public_read
  on flower_meanings for select
  to anon, authenticated
  using (true);

drop policy if exists pet_safety_public_read on pet_safety;
create policy pet_safety_public_read
  on pet_safety for select
  to anon, authenticated
  using (true);

drop policy if exists quotes_public_read on quotes;
create policy quotes_public_read
  on quotes for select
  to anon, authenticated
  using (true);


-- ===========================================================================
-- 3. Service-role-only tables : intentionally NO policy.
--
--    recommendation_rules / message_templates : these ARE the product's
--      editorial IP (scoring logic and message skeletons). Shipping them to the
--      browser would hand over the recommendation engine verbatim, so the
--      client never reads them directly — server-side code holding the
--      service_role key resolves rules and returns only the result.
--    config / config_history : engine weights and their audit trail. Readable
--      weights let anyone reverse-engineer or game the ranking; the history
--      additionally reveals every past tuning decision.
--
--    RLS enabled + zero policies = deny-all for anon and authenticated, while
--    service_role (which bypasses RLS) keeps full access. Nothing to create
--    here; the absence of policies IS the policy.
--
--    Optional hardening once the app is wired up, if we want the failure mode
--    to be a hard permission error instead of an empty result set:
--      revoke all on recommendation_rules, message_templates, config,
--        config_history from anon, authenticated;
-- ===========================================================================


-- ===========================================================================
-- 4. recommendation_results : owner-only, no public policy.
--
--    RLS is a ROW-level mechanism: a policy decides whether a row is visible,
--    it cannot hide a single column. So there is deliberately no "public read"
--    policy here — adding one would expose private_payload along with
--    public_payload on the same row. Column separation is done one layer up,
--    by the share_results view in section 6.
--
--    'authenticated' covers anonymous sign-ins: Supabase anonymous users get a
--    real JWT with the authenticated role, so auth.uid() is populated.
-- ===========================================================================
drop policy if exists recommendation_results_owner_select on recommendation_results;
create policy recommendation_results_owner_select
  on recommendation_results for select
  to authenticated
  using (owner_uid = auth.uid());

drop policy if exists recommendation_results_owner_insert on recommendation_results;
create policy recommendation_results_owner_insert
  on recommendation_results for insert
  to authenticated
  with check (owner_uid = auth.uid());

drop policy if exists recommendation_results_owner_update on recommendation_results;
create policy recommendation_results_owner_update
  on recommendation_results for update
  to authenticated
  using (owner_uid = auth.uid());

drop policy if exists recommendation_results_owner_delete on recommendation_results;
create policy recommendation_results_owner_delete
  on recommendation_results for delete
  to authenticated
  using (owner_uid = auth.uid());


-- ===========================================================================
-- 5. share_cards : anyone holding the link can read a card; only the owner of
--    the underlying result can create one.
--
--    The EXISTS subquery is evaluated as the calling user, so RLS on
--    recommendation_results still applies to it — the owner's own select policy
--    (section 4) is what makes the row visible, and the explicit
--    owner_uid = auth.uid() keeps the intent readable at a glance.
-- ===========================================================================
drop policy if exists share_cards_public_read on share_cards;
create policy share_cards_public_read
  on share_cards for select
  to anon, authenticated
  using (true);

drop policy if exists share_cards_owner_insert on share_cards;
create policy share_cards_owner_insert
  on share_cards for insert
  to authenticated
  with check (
    exists (
      select 1
      from recommendation_results r
      where r.id = result_id
        and r.owner_uid = auth.uid()
    )
  );


-- ===========================================================================
-- 6. share_results : the public projection of a result.
--
--    security_invoker = false (the Postgres default, stated explicitly here so
--    the intent survives future edits) means the view executes with its
--    OWNER's privileges, so the base table's owner-only RLS does not apply to
--    reads through it. The view's select list is therefore the column filter:
--    private_payload is simply not projected and cannot leak.
--
--    Whoever knows a result id can read its public half — that is the share
--    URL's whole purpose. Ids are uuidv4, so they are unguessable.
--
--    Alternative considered: a security definer RPC, e.g.
--      create function get_share_result(p_id uuid)
--      returns table (id uuid, public_payload jsonb, created_at timestamptz)
--      language sql security definer set search_path = public
--      as $$ select id, public_payload, created_at
--             from recommendation_results where id = p_id $$;
--    An RPC buys rate limiting, hit logging, and an expiry check in one place,
--    but costs a round-trip shape the client cannot filter or paginate. Start
--    with the view; switch to the RPC the moment share links need throttling or
--    view counts.
-- ===========================================================================
create or replace view share_results
  with (security_invoker = false)
  as select
       id,
       public_payload,
       created_at
     from recommendation_results;

grant select on share_results to anon, authenticated;
