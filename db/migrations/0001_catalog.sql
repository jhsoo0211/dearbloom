-- 0001_catalog.sql
-- dearbloom : public catalog (flowers / meanings / pet safety / rules / templates / quotes)
--             + runtime config with history.
-- Target: Supabase Postgres 15+ (gen_random_uuid() is built in, no pgcrypto needed).
-- Run order: 0001 -> 0002 -> 0003.
--
-- Column names are 1:1 snake_case with the content CSVs under content/.
-- Shared vocabulary (kept identical everywhere, enforced by CHECK constraints):
--   relationship      : lover | spouse | crush | friend | family | colleague
--   intent            : apology | confession | gratitude | celebration | comfort | anniversary | just_because
--   tone              : plain | sincere | romantic | playful
--   species           : cat | dog
--   severity          : none | mild_gi | serious | life_threatening
--   confidence_level  : repeated | varies | single_source
--   license           : pd | original


-- ---------------------------------------------------------------------------
-- flowers : one row per flower in the catalog. id is a stable human-readable
--           slug shared with the CSV (e.g. 'rose_red'), not a uuid.
-- ---------------------------------------------------------------------------
create table flowers (
  id                text primary key,
  name_ko           text        not null,
  name_en           text,
  scientific_name   text        not null,
  colors            text[]      not null,
  bloom_months      int[]       not null,          -- 1..12
  fragrance_level   int         not null check (fragrance_level between 0 and 3),
  price_band        int         not null check (price_band between 1 and 3),
  aesthetic_tags    text[],
  care_summary      text,
  image_url         text,
  image_license     text,
  image_source_url  text,
  reviewed_at       date        not null,          -- editorial review date
  reviewer          text,
  editorial_note    text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);


-- ---------------------------------------------------------------------------
-- flower_meanings : a flower can carry several meanings (per color / region /
--                   era). Every row must cite a source; confidence_level tells
--                   the UI how strongly to phrase it.
-- ---------------------------------------------------------------------------
create table flower_meanings (
  id                uuid primary key default gen_random_uuid(),
  flower_id         text        not null references flowers (id) on delete cascade,
  color             text,                          -- null = applies to the flower as a whole
  meaning_ko        text        not null,
  culture_region    text,
  era               text,
  source_id         text        not null,
  source_url        text        not null,
  confidence_level  text        not null
    check (confidence_level in ('repeated', 'varies', 'single_source')),
  caution_note      text,                          -- e.g. "장례식 연상" 같은 역효과 경고
  editorial_note    text,
  reviewed_at       date        not null
);

create index flower_meanings_flower_id_idx on flower_meanings (flower_id);


-- ---------------------------------------------------------------------------
-- pet_safety : toxicity per (flower, species). One row per species so cat/dog
--              can disagree; unique(flower_id, species) keeps it single-valued.
-- ---------------------------------------------------------------------------
create table pet_safety (
  id                         uuid primary key default gen_random_uuid(),
  flower_id                  text     not null references flowers (id) on delete cascade,
  species                    text     not null check (species in ('cat', 'dog')),
  toxic                      boolean  not null,
  severity                   text     not null
    check (severity in ('none', 'mild_gi', 'serious', 'life_threatening')),
  toxic_parts                text[],
  safe_alternative_flower_ids text[],              -- soft refs to flowers.id (arrays cannot carry a FK)
  source_url                 text     not null,
  reviewed_at                date     not null,
  unique (flower_id, species)
);


-- ---------------------------------------------------------------------------
-- recommendation_rules : hand-authored scoring rules. A rule either RECOMMENDS
--   (fit_score set) or WARNS OFF (avoid_reason set) — never both, never
--   neither. version/active let us supersede a rule without deleting it.
-- ---------------------------------------------------------------------------
create table recommendation_rules (
  id                 uuid primary key default gen_random_uuid(),
  rule_id            text    not null unique,      -- stable id shared with the CSV
  relationship_type  text    check (relationship_type in
                       ('lover', 'spouse', 'crush', 'friend', 'family', 'colleague')),
  intent             text    check (intent in
                       ('apology', 'confession', 'gratitude', 'celebration',
                        'comfort', 'anniversary', 'just_because')),
  occasion           text,
  apology_level      int,
  aesthetic_tags     text[],
  budget_range       text,
  urgency            text,
  flower_id          text    references flowers (id) on delete cascade,
  fit_score          int     check (fit_score between 0 and 100),
  avoid_reason       text,
  note               text,
  version            int     not null default 1,
  active             boolean not null default true,
  -- XOR: exactly one of fit_score / avoid_reason must be present.
  constraint recommendation_rules_score_xor
    check ((fit_score is not null) <> (avoid_reason is not null))
);

create index recommendation_rules_lookup_idx
  on recommendation_rules (relationship_type, intent)
  where active;


-- ---------------------------------------------------------------------------
-- message_templates : message skeletons keyed by relationship / intent / tone.
--   required_apology_elements lists the beats an apology text must contain
--   (e.g. 인정, 사과, 재발방지) so the generator can self-check.
-- ---------------------------------------------------------------------------
create table message_templates (
  id                        uuid primary key default gen_random_uuid(),
  template_id               text not null unique,
  relationship_type         text check (relationship_type in
                              ('lover', 'spouse', 'crush', 'friend', 'family', 'colleague')),
  intent                    text not null check (intent in
                              ('apology', 'confession', 'gratitude', 'celebration',
                               'comfort', 'anniversary', 'just_because')),
  tone                      text not null
    check (tone in ('plain', 'sincere', 'romantic', 'playful')),
  length                    text check (length in ('short', 'medium')),
  required_apology_elements text[],
  template_text             text not null,
  reviewed_at               date not null
);


-- ---------------------------------------------------------------------------
-- quotes : short quotable lines. Public-domain text must always carry a
--          source_url so attribution can be rendered; 'original' (written by
--          us) may stand alone.
-- ---------------------------------------------------------------------------
create table quotes (
  id            uuid primary key default gen_random_uuid(),
  quote_id      text not null unique,
  text_ko       text not null,
  author        text,
  source_title  text,
  source_url    text,
  license       text not null check (license in ('pd', 'original')),
  era           text,
  tags          text[],
  reviewed_at   date,
  constraint quotes_pd_needs_source
    check (license <> 'pd' or source_url is not null)
);


-- ---------------------------------------------------------------------------
-- config : runtime knobs (engine weights, feature flags...) as jsonb.
-- config_history : append-only audit trail written by a trigger on config.
-- ---------------------------------------------------------------------------
create table config (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz default now(),
  updated_by  text
);

create table config_history (
  id          uuid primary key default gen_random_uuid(),
  key         text  not null,
  value       jsonb not null,
  changed_at  timestamptz default now()
);

create index config_history_key_changed_at_idx on config_history (key, changed_at desc);

-- security definer + pinned search_path: config_history has RLS enabled and no
-- policies (0003), so the insert must not depend on the caller's row access.
create or replace function log_config_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Skip no-op updates so the history only records real changes.
  if tg_op = 'UPDATE' and old.value is not distinct from new.value then
    return new;
  end if;

  insert into config_history (key, value)
  values (new.key, new.value);

  return new;
end;
$$;

create trigger config_log_change
  after insert or update on config
  for each row
  execute function log_config_change();


-- ---------------------------------------------------------------------------
-- Seed: default engine weights (I=intent, R=relationship, S=season,
--       A=aesthetic, P=price, D=diversity). Sums to 1.00.
-- ---------------------------------------------------------------------------
insert into config (key, value) values
  ('engine_weights', '{"I":0.30,"R":0.25,"S":0.15,"A":0.15,"P":0.10,"D":0.05}'::jsonb)
on conflict (key) do nothing;
