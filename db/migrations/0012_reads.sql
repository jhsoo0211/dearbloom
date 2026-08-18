-- 0012_reads.sql
-- dearbloom : reads — 「읽을거리」 섹션의 외부 링크 원장(축제·글·실용·트렌드).
-- Target: Supabase Postgres 15+.  Run after 0011_birth_photos_stories.sql.
--
-- Column names are 1:1 snake_case with content/reads.csv, same contract as every
-- other catalog table (0001 머리말).
--
-- Why this table holds no article body:
--   we do not crawl. A row carries the title, the source, one sentence we wrote
--   ourselves, and the link — nothing of the article itself. Copying the body
--   would be reproduction, not citation, and an auto-summary of someone else's
--   text stands on the same contested ground (docs/reads-research.md §1).
--   There is deliberately no image column either: no hotlinked thumbnails.


-- ---------------------------------------------------------------------------
-- reads
--
-- read_id is the natural key and the seed's conflict target (SEED_TARGETS in
-- db/seed/upsert.ts). A surrogate uuid stays as the PK so the table matches the
-- rest of the schema.
--
-- ⚠ Dates belong to events and to nothing else. An `event` row without an end
--   date can never be judged expired, so it would sit in the list forever — the
--   single largest risk of this section (§6-2). Conversely a date leaking onto
--   an article makes that article vanish on a day nobody chose. Both directions
--   are refused by the CHECK below, which mirrors ReadRowSchema.superRefine.
--
-- ⚠ The expiry filter itself is NOT here and not in the server render: it runs
--   in the browser against the reader's today (§7-2). A static build bakes its
--   build-day "today" into the HTML, so a site deployed in October would still
--   be judging festivals by October in December. The rows stay; the screen hides.
--
-- `tags` is the controlled 13-value vocabulary that becomes the filter chips
-- (§3-2). It is a text[] rather than a join table because the vocabulary is
-- closed, hand-edited, and read as a whole — and the CSV gate is the thing that
-- actually holds the three-axis rule (exactly one place tag, at least one
-- strand, a season on every event) that no cheap CHECK can express.
-- ---------------------------------------------------------------------------
create table reads (
  id             uuid primary key default gen_random_uuid(),
  read_id        text not null unique,
  kind           text not null check (kind in ('article', 'event', 'guide', 'trend')),
  title          text not null,
  source_title   text not null,
  author         text,
  source_url     text not null,
  published_at   date,
  starts_at      date,
  ends_at        date,
  region         text,
  -- 우리가 직접 쓴 한 줄(60~90자 목표). 기사 본문·요약문 전재가 아니다.
  -- 입장료·예약 필수·`(예정)` 표기처럼 **사용자의 결정을 바꾸는 사실**이 여기 올라온다(§3-4).
  summary_ko     text not null,
  -- 그 링크를 눌렀을 때 글을 읽을 수 있는가. 행사 입장료는 여기가 아니라 summary_ko 다.
  access         text not null check (access in ('open', 'paywall', 'registration')),
  confidence     text not null check (confidence in ('repeated', 'varies', 'single_source')),
  reviewed_at    date not null,
  -- 화면 칩이 되는 통제 어휘 13종. 세 축의 규칙은 CSV 게이트가 든다(위 머리말).
  tags           text[] not null,
  -- 우리 데이터와 잇는 칸: `flower:<id>` · `color:<색>` · `theme:<계열>`.
  -- **비는 것이 정상 값이다**(54건 중 20건). 억지로 잇지 않는다.
  links_to       text[],
  -- 채택 근거·주의점·대조 기록. **화면에 나가지 않는다**(로더가 Catalog 로 옮기지 않는다).
  editorial_note text,
  created_at     timestamptz default now(),

  -- 날짜는 행사만, 행사는 반드시 (ReadRowSchema.superRefine 과 같은 금지선).
  constraint reads_event_dates check (
    (kind = 'event' and starts_at is not null and ends_at is not null and ends_at >= starts_at)
    or
    (kind <> 'event' and starts_at is null and ends_at is null)
  ),

  -- 남의 사이트를 우리 서버가 대신 부르지 않는다 — 이 칸은 사용자의 브라우저가 갈 주소다.
  constraint reads_source_https check (source_url like 'https://%'),

  constraint reads_tags_not_empty check (cardinality(tags) > 0)
);

-- 화면은 갈래로 나눠 세우고(행사 먼저) 종료일 순으로 만료된다 — 두 컬럼이 같이 쓰인다.
create index reads_kind_ends_at_idx on reads (kind, ends_at);
-- 칩 필터가 태그로 훑는다. GIN 이라야 `tags @> array['가을']` 이 색인을 탄다.
create index reads_tags_idx on reads using gin (tags);

comment on table reads is
  '「읽을거리」의 외부 링크 원장. 본문을 담지 않는다 — 제목·출처·우리가 쓴 한 줄·링크가 전부다';
comment on column reads.kind is
  '데이터의 종류. 사람이 고르는 축은 tags 다 — 화면 칩은 tags 로 만든다';
comment on column reads.ends_at is
  '행사 종료일. 이 값이 없으면 만료를 판정할 수 없어 목록에서 영영 사라지지 않는다';
comment on column reads.access is
  '그 링크를 눌렀을 때 글을 읽을 수 있는가. 행사 입장료는 여기가 아니라 summary_ko 다';
comment on column reads.links_to is
  '우리 데이터와 잇는 칸(flower:/color:/theme:). 비는 것이 정상 값이다';
comment on column reads.editorial_note is
  '편집·감사 기록. 화면에 나가지 않는다';


-- ---------------------------------------------------------------------------
-- RLS : 공개 카탈로그 콘텐츠라 birth_flowers / birth_stories 와 같은 등급이다.
--       쓰기 정책은 하나도 두지 않는다 -> service_role(시드)·마이그레이션 전용.
--       Drop-before-create 로 이 블록만 다시 돌릴 수 있게 둔다(0010·0011 과 같은 방식).
-- ---------------------------------------------------------------------------
alter table reads enable row level security;

drop policy if exists reads_public_read on reads;
create policy reads_public_read
  on reads for select
  to anon, authenticated
  using (true);
