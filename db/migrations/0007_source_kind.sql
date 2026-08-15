-- 0007_source_kind.sql
-- dearbloom : flower_stories.source_kind — 출처가 어떤 성격의 자료인지(design-spec §1.5d 개정).
-- Target: Supabase Postgres 15+.  Run after 0006_story_type.sql.
--
--   paper      학술 논문
--   magazine   잡지·칼럼·블로그 기고
--   museum     박물관·국가기록원 등 기관 자료
--   newspaper  신문
--   book-pd    퍼블릭 도메인 고서 원문
--   garden     식물원·대학 익스텐션·농업/독성 기관 자료
--   wiki       위키·백과사전·정리 사이트
--   other      위 어디에도 넣기 어려운 것
--
-- Column name is 1:1 snake_case with content/stories.csv.


-- ---------------------------------------------------------------------------
-- Column.
--
-- confidence_level already says *how many* sources back a story.  This column
-- says *what kind* the source is, and the two are read together on screen: a
-- single_source story whose source is an 1839 first edition or a government
-- research report is labelled "기록으로 남아 있는 이야기예요", while a lone wiki
-- page keeps "드물게 전해지는 이야기예요".  Without this column every one of the
-- 100+ single_source rows would wear the hearsay label, which reads as a lie
-- about the good ones.  The split lives in storyConfidenceLabel()
-- (src/components/flow/labels.ts) and the vocabulary in SOURCE_KINDS
-- (db/seed/schemas.ts) — keep all three in sync.
--
-- Defaults to 'other' so the ALTER succeeds on rows that already exist; the
-- seed immediately overwrites it (source_kind is required in the CSV).  'other'
-- is deliberately the *conservative* default — it falls on the "드물게
-- 전해지는" side of the label split, so a row that never gets classified can
-- only under-claim, never over-claim.
-- ---------------------------------------------------------------------------
alter table flower_stories
  add column source_kind text not null default 'other'
    check (source_kind in (
      'paper', 'magazine', 'museum', 'newspaper', 'book-pd', 'garden', 'wiki', 'other'
    ));

comment on column flower_stories.source_kind is
  '출처 자료의 성격. paper | magazine | museum | newspaper | book-pd | garden | wiki | other. paper·museum·book-pd·newspaper·garden 은 단일 출처여도 화면에 "기록으로 남아 있는 이야기예요" 라벨이 붙는다';
