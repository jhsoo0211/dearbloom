-- 0011_birth_photos_stories.sql
-- dearbloom : birth_photos · birth_stories — 탄생화 사전을 도감 수준으로 올리는 두 표.
-- Target: Supabase Postgres 15+.  Run after 0010_birth_flowers.sql.
--
-- Column names are 1:1 snake_case with content/birth_photos.csv and
-- content/birth_stories.csv, same contract as every other catalog table (0001 머리말).
--
-- Why two tables and not columns on `birth_flowers`:
--   a photo is one per *date* (the same species can carry different photos on
--   different days), but a story is one of *many* per *name*. Neither shape fits
--   as a column, and folding them together would force the 416 stories to be
--   repeated once per date the name occupies.


-- ---------------------------------------------------------------------------
-- birth_photos
--
-- (month, day) is the natural key and the seed's conflict target (SEED_TARGETS
-- in db/seed/upsert.ts), matching birth_flowers. The FK is on that pair, so a
-- photo can never outlive the calendar row it illustrates — and `on delete
-- cascade` is right here (unlike birth_flowers.flower_id) because a photo of a
-- date that no longer exists is not a fact worth keeping.
--
-- Rows with a NULL direct_url are the six days research could not settle
-- (no verifiable photo on Commons, or the table's Korean and English names
-- point at different plants). They stay as rows: `species_note` records *why*,
-- and deleting them would erase the difference between "not looked at yet" and
-- "looked at, found nothing". The CHECK below is the same all-or-nothing rule
-- the CSV gate enforces (BirthPhotoRowSchema.superRefine).
--
-- ⚠ license: only PD / CC0 / CC BY / CC BY-SA are allowed. What we serve is a
--   resized re-encode, i.e. a derivative, so we need both redistribution and
--   adaptation rights; NC and ND grant neither. The CSV gate holds the
--   allow-list (PHOTO_LICENSE_PATTERN) — here we keep the cheap half of it as a
--   CHECK so a hand-written INSERT cannot walk past the rule.
-- ---------------------------------------------------------------------------
create table birth_photos (
  id               uuid primary key default gen_random_uuid(),
  month            int  not null check (month between 1 and 12),
  day              int  not null check (day between 1 and 31),
  name_ko          text not null,
  -- 저장 파일 이름(`public/birth/{slug}.jpg` · `…/thumbs/{slug}.jpg`).
  -- 같은 이름의 여러 날이 같은 사진을 들면 slug 도 같다 — 그래서 unique 가 아니다.
  slug             text,
  commons_page_url text,
  direct_url       text,
  author           text,
  license          text,
  width            int,
  -- 종 동정 판정 근거. **화면에 나가지 않는다**(로더가 Catalog 로 옮기지 않는다).
  species_note     text,
  -- 그 식물을 한 줄로 소개하는 문장. 사진 아래 캡션으로 나간다.
  family_line      text,
  created_at       timestamptz default now(),

  unique (month, day),
  foreign key (month, day) references birth_flowers (month, day) on delete cascade,

  constraint birth_photos_credit_complete check (
    (direct_url is null
      and slug is null and commons_page_url is null and author is null
      and license is null and width is null and family_line is null
      and species_note is not null)
    or
    (direct_url is not null
      and slug is not null and commons_page_url is not null and author is not null
      and license is not null and width is not null and family_line is not null)
  ),

  constraint birth_photos_license_open check (
    license is null
    or license in ('Public domain', 'CC0')
    or (license like 'CC BY %' or license like 'CC BY-SA %')
  ),
  constraint birth_photos_license_not_nc_nd check (
    license is null or (license not like 'CC BY-NC%' and license not like 'CC BY-ND%')
  )
);

create index birth_photos_slug_idx on birth_photos (slug);

comment on table birth_photos is
  '날짜별 탄생화의 실사 한 장(위키미디어 커먼즈). (month, day) 가 자연키이며 시드의 onConflict 대상이다';
comment on column birth_photos.slug is
  '자체 호스팅 파일 이름. 같은 이름의 여러 날이 같은 사진을 들면 값도 같다';
comment on column birth_photos.species_note is
  '종 동정 판정 근거. 편집·감사용이라 화면에 나가지 않는다';
comment on column birth_photos.license is
  '파일 페이지 표기 그대로. PD/CC0/CC BY/CC BY-SA 만 허용한다 — 화면에 거는 것은 리사이즈한 파생물이다';


-- ---------------------------------------------------------------------------
-- birth_stories
--
-- story_id is the natural key (same as flower_stories), but the two id spaces
-- must not overlap: the archive and the dictionary sheet would otherwise fetch
-- different stories under one id. The seed's cross-check refuses a collision
-- before it reaches here (crossValidate 7).
--
-- The owner is `name_ko`, not a flower id. Only 86 of the 366 days reach the
-- catalog; the rest have no flower row to hang a story on, and inventing one
-- would smuggle unverified species into the catalog. There is no FK to
-- birth_flowers because the reference is a *name*, not the calendar key — one
-- name covers up to four dates. The CSV gate checks the name exists.
-- ---------------------------------------------------------------------------
create table birth_stories (
  id             uuid primary key default gen_random_uuid(),
  name_ko        text not null,
  story_id       text not null unique,
  title          text not null,
  hook           text,
  story_ko       text not null,
  culture_region text,
  era            text,
  -- 어휘는 flower_stories 와 같은 것을 쓴다(0006 · 0007 과 같은 목록).
  story_type     text not null check (story_type in ('folklore', 'history', 'literary', 'original')),
  source_kind    text not null check (
    source_kind in ('paper', 'magazine', 'museum', 'newspaper', 'book-pd', 'garden', 'wiki', 'other')
  ),
  source_url     text,
  confidence     text not null check (confidence in ('repeated', 'varies', 'single_source')),
  -- 편집·감사 기록. **화면에 나가지 않는다**(로더가 Catalog 로 옮기지 않는다).
  editorial_note text,
  created_at     timestamptz default now(),

  -- flower_stories_source_required(0006) 와 같은 금지선: 창작만 출처가 면제된다.
  constraint birth_stories_source_required check (
    story_type = 'original' or source_url is not null
  )
);

create index birth_stories_name_ko_idx on birth_stories (name_ko);

comment on table birth_stories is
  '탄생화 이름에 붙는 이야기. 주인이 flower_id 가 아니라 name_ko 다 — 366일 중 도감으로 이어지는 날은 86일뿐이다';
comment on column birth_stories.story_id is
  'flower_stories.story_id 와 같은 규칙이되 id 공간이 겹치면 안 된다(시드 교차 검증이 막는다)';
comment on column birth_stories.editorial_note is
  '편집·감사 기록. 화면에 나가지 않는다';


-- ---------------------------------------------------------------------------
-- RLS : 공개 카탈로그 콘텐츠라 birth_flowers 와 같은 등급이다.
--       쓰기 정책은 하나도 두지 않는다 -> service_role(시드)·마이그레이션 전용.
--       Drop-before-create 로 이 블록만 다시 돌릴 수 있게 둔다(0010 과 같은 방식).
-- ---------------------------------------------------------------------------
alter table birth_photos enable row level security;
alter table birth_stories enable row level security;

drop policy if exists birth_photos_public_read on birth_photos;
create policy birth_photos_public_read
  on birth_photos for select
  to anon, authenticated
  using (true);

drop policy if exists birth_stories_public_read on birth_stories;
create policy birth_stories_public_read
  on birth_stories for select
  to anon, authenticated
  using (true);
