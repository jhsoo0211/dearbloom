-- 0010_birth_flowers.sql
-- dearbloom : birth_flowers — 날짜별 탄생화(생일에 매달린 꽃 한 종과 그 꽃말).
-- Target: Supabase Postgres 15+.  Run after 0009_letters.sql.
--
-- Column names are 1:1 snake_case with content/birth_flowers.csv, same contract
-- as every other catalog table (0001 머리말).
--
-- Why this table is not just a column on `flowers`:
--   a birth flower is a *calendar entry*, not a property of a flower. 366 days
--   map onto far more species than the catalog carries, and the same species
--   can hold several days. So the calendar owns the row and `flower_id` is the
--   optional bridge back into the catalog.


-- ---------------------------------------------------------------------------
-- birth_flowers
--
-- (month, day) is the natural key and the seed's conflict target
-- (SEED_TARGETS in db/seed/upsert.ts). A surrogate uuid stays as the PK so the
-- table matches the rest of the schema and so a future FK has something stable
-- to point at.
--
-- 2/29 is a real birthday, so `day` allows 1..31 with only a range check; the
-- pairing (e.g. 2/30) is refused by the CSV gate, not here — a CHECK that has
-- to know every month's length buys little and breaks when the editors want a
-- deliberate placeholder row.
-- ---------------------------------------------------------------------------
create table birth_flowers (
  id              uuid primary key default gen_random_uuid(),
  month           int  not null check (month between 1 and 12),
  day             int  not null check (day between 1 and 31),
  name_ko         text not null,
  name_en         text,
  scientific_name text,
  -- 카탈로그에 같은 꽃이 있으면 이어 준다. NULL 이면 "탄생화 목록에만 있는 꽃" —
  -- 도감으로 넘어가는 링크가 서지 않을 뿐, 날짜 자리는 그대로 유효하다.
  -- on delete set null: 카탈로그에서 꽃이 빠져도 그 날짜의 탄생화라는 사실은 남는다
  -- (quotes.flower_id 와 같은 판단, flower_stories 의 cascade 와 반대).
  flower_id       text references flowers (id) on delete set null,
  meaning_ko      text,
  source_url      text,
  editorial_note  text,
  created_at      timestamptz default now(),

  unique (month, day)
);

create index birth_flowers_flower_id_idx on birth_flowers (flower_id);

comment on table birth_flowers is
  '날짜별 탄생화. (month, day) 가 자연키이며 시드의 onConflict 대상이다';
comment on column birth_flowers.flower_id is
  '카탈로그의 같은 꽃. NULL 이면 도감에 없는 꽃이라는 뜻이며 날짜 자리는 그대로 유효하다';
comment on column birth_flowers.meaning_ko is
  '그 날짜에 붙는 꽃말. flowers/flower_meanings 의 꽃말과 다를 수 있어 여기 따로 든다';


-- ---------------------------------------------------------------------------
-- RLS : 공개 카탈로그 콘텐츠라 flowers / flower_stories 와 같은 등급이다.
--       쓰기 정책은 하나도 두지 않는다 -> service_role(시드)·마이그레이션 전용.
--       Drop-before-create 로 이 블록만 다시 돌릴 수 있게 둔다(0003·0004 와 같은 방식).
-- ---------------------------------------------------------------------------
alter table birth_flowers enable row level security;

drop policy if exists birth_flowers_public_read on birth_flowers;
create policy birth_flowers_public_read
  on birth_flowers for select
  to anon, authenticated
  using (true);
