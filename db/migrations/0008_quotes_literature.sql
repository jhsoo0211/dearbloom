-- 0008_quotes_literature.sql
-- dearbloom : quotes 의 문학 연계 6컬럼 — design-spec §1.5k(문학 연계).
-- Target: Supabase Postgres 15+.  Run after 0007_source_kind.sql.
--
--   flower_id     이 발췌가 붙는 꽃 (nullable — 꽃 비연동 인용이 정상 값)
--   excerpt_type  poem | novel | play | essay | classic
--   text_original 원어 원문 (화면에 소형 병기)
--   translator    자체 번역·자체 현대어 표기이면 'dearbloom'
--   caveat        화면에 나가는 한 줄 각주
--   pd_basis      퍼블릭 도메인 판정 근거 (데이터 레이어 전용, 화면 비노출)
--
-- Column names are 1:1 snake_case with content/quotes.csv.


-- ---------------------------------------------------------------------------
-- Columns.
--
-- All six are nullable and none carries a default.  quotes predates this
-- migration with three rows written by the editorial team — short lines that
-- belong to no particular flower — and those stay valid untouched.  That is
-- the point: a quote without a flower is not an incomplete row, it is the
-- general-purpose kind, and the result screen's literature block simply never
-- selects it.
--
-- flower_id is `on delete set null`, not `cascade` (which is what
-- flower_stories uses).  A story about a flower has no meaning once the flower
-- is gone, but a line of Ovid does — deleting the catalog entry should demote
-- the quote to a general one, not destroy a public-domain excerpt we verified
-- by hand.
-- ---------------------------------------------------------------------------
alter table quotes
  add column flower_id     text references flowers (id) on delete set null,
  add column excerpt_type  text check (excerpt_type in
                             ('poem', 'novel', 'play', 'essay', 'classic')),
  add column text_original text,
  add column translator    text,
  add column caveat        text,
  add column pd_basis      text;

create index quotes_flower_id_idx on quotes (flower_id);


-- ---------------------------------------------------------------------------
-- excerpt_type implies flower_id.
--
-- The reverse is not required: a row may carry a flower without a genre.  But
-- a genre without a flower describes a literary excerpt that the query in
-- src/app/recommend/actions.ts (pickLiterature) can never reach, because it
-- matches on flower_id alone.  Without this CHECK such a row loads clean,
-- seeds clean, and is silently invisible forever — the failure mode that is
-- hardest to notice, so it is made loud here.  Same rule in the CSV gate:
-- QuoteRowSchema's superRefine (db/seed/schemas.ts).
-- ---------------------------------------------------------------------------
alter table quotes
  add constraint quotes_excerpt_needs_flower
    check (excerpt_type is null or flower_id is not null);


comment on column quotes.flower_id is
  '이 발췌가 붙는 꽃. NULL 이면 꽃을 가리지 않는 범용 인용이며 결과 화면의 문학 블록에는 뜨지 않는다';
comment on column quotes.excerpt_type is
  '인용의 갈래. poem | novel | play | essay | classic. classic 은 『시경』·오비디우스·KJV 성경처럼 네 갈래 이전에 성립한 원전 자리다';
comment on column quotes.text_original is
  '원어 원문. 화면에 번역과 나란히 소형으로 병기한다 — 아크로스틱(이세 이야기)이나 라틴어 대문자(AI AI)처럼 번역으로는 살지 않는 장치가 있어 컬럼으로 분리했다';
comment on column quotes.translator is
  '자체 번역·자체 현대어 표기이면 dearbloom. 한국어 원전을 그대로 실었으면 NULL. 원전이 퍼블릭 도메인이어도 기존 출판 번역은 별도 저작물이라 옮기지 않는다';
comment on column quotes.caveat is
  '화면에 나가는 한 줄 각주. 적지 않으면 서비스가 틀린 정보를 주게 되는 사실을 담는다 (예: 김유정 「동백꽃」의 동백은 강원 방언의 생강나무이지 Camellia japonica 가 아니다)';
comment on column quotes.pd_basis is
  '퍼블릭 도메인 판정 근거(저작자 몰년·판본). 데이터 레이어 전용이며 화면에 나가지 않는다 — 로더가 Catalog 로 옮기지 않는다';
