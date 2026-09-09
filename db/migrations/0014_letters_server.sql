-- 0014_letters_server.sql
-- dearbloom : 비밀 편지 서버 저장 — 익명 로그인으로 쓰고, 번호로 어디서든 연다.
-- Target: Supabase Postgres 15+.  Run after 0013_flower_occasions.sql.  Requires 0009_letters.sql.
--
-- 0009 가 표와 읽기 문(open_letter)을 세웠지만 쓰기 문이 없었다. PostgREST 로는 insert
-- 값에 SQL 함수를 실을 수 없어서(`crypt(p_code, gen_salt('bf'))`) 번호 해시를 서버가
-- 만들 자리가 없었기 때문이다. 이 파일이 그 자리를 만든다 — 두 개의 security definer
-- 함수이고, 둘 다 **평문 번호를 받아 서버에서만 해시한다.**
--
--   save_letter  — 편지를 쓴 사람(익명 로그인 포함)이 부른다. authenticated 전용.
--   seed_letter  — 운영자가 미리 쓴 편지를 시드 CLI 로 넣는다. service_role 전용.
--
-- ⚠ 번호는 어디에도 평문으로 남지 않는다(해시만 든다). 시드 CLI 도 화면도 번호를
--   되돌려 받지 못한다 — 적어 두는 것은 사람의 몫이고, 화면이 그렇게 안내한다.
--
-- 0009 의 RLS 정책과 open_letter 는 **손대지 않는다.** owner_uid 가 null 인 행(운영자
-- 시드 편지)은 네 정책 어디에도 걸리지 않으므로 소유자 경로로는 아예 보이지 않고,
-- 번호로 여는 문(open_letter)만 그 편지에 닿는다 — 그것이 시드 편지의 정확한 성격이다.


-- ---------------------------------------------------------------------------
-- 1. owner_uid : 주인이 없는 편지가 생긴다.
--
--    0009 는 "소유자 전권" 정책을 세우려고 이 칸을 not null 로 두었다. 운영자가 미리
--    써 두는 편지에는 그 주체가 없다 — 아무의 목록에도 뜨지 않고 아무도 고쳐 쓰지
--    못하며, 오직 번호를 아는 사람만 연다. 그 사실을 null 로 적는다.
-- ---------------------------------------------------------------------------
alter table letters alter column owner_uid drop not null;

comment on column letters.owner_uid is
  '편지를 쓴 사람(익명 로그인 포함). null = 운영자 시드 편지 — 소유자 정책에 걸리지 않고 번호로만 열린다';


-- ===========================================================================
-- 2. save_letter(p_id, p_code, p_payload) : 쓰는 사람의 유일한 문.
--
--    security definer + 고정 search_path 는 open_letter 와 같은 이유다 — 번호 선점
--    검사가 **남의 편지까지** 훑어야 하고(그 행들은 호출자가 select 할 수 없다),
--    `crypt` 가 호출자가 심은 스키마에서 풀리면 안 된다.
--
--    돌려주는 0행의 뜻은 하나다: **고쳐 쓰려던 편지가 없거나 내 것이 아니다.**
--    어느 쪽인지는 말하지 않는다(남의 편지의 존재 여부가 새어 나가지 않게).
-- ===========================================================================
create or replace function save_letter(
    p_id      uuid,
    p_code    text,
    p_payload jsonb
  )
  returns table (
    id         uuid,
    payload    jsonb,
    created_at timestamptz,
    updated_at timestamptz
  )
  language plpgsql
  security definer
  set search_path = public, extensions
as $$
declare
  v_uid  uuid := auth.uid();
  v_code text := nullif(upper(btrim(p_code)), '');
  v_id   uuid;
begin
  -- 로그인 없이는 한 줄도 쓰지 않는다. anon 키만 든 호출은 여기서 끝난다.
  if v_uid is null then
    raise exception 'save_letter: sign in required' using errcode = '42501';
  end if;

  -- 빈 번호는 **고쳐 쓸 때만** 뜻이 있다("번호는 그대로 두세요"). 새 편지에는 없다.
  if p_id is null and v_code is null then
    raise exception 'save_letter: code required' using errcode = '22023';
  end if;

  -- 모양 검사는 crypt() 앞에 둔다 — 어긋난 번호에 bcrypt 비용을 쓰지 않는다.
  -- {4,12} 는 앱의 LETTER_CODE_PATTERN 과 같은 값이다(open_letter 와도 같다).
  if v_code is not null and v_code !~ '^[A-Z0-9]{4,12}$' then
    raise exception 'save_letter: bad code' using errcode = '22023';
  end if;

  -- 번호 선점 — bcrypt 는 행마다 salt 가 달라 unique 인덱스로 막을 수 없다(0009 §3).
  -- 살아 있는 편지만 본다: 기한이 지난 편지의 번호는 다시 쓸 수 있다.
  -- errcode 23505 가 계약의 핵심이다 — 어댑터가 이 코드만 보고
  -- LetterCodeTakenError("이 번호는 다른 편지가 쓰고 있어요")로 옮긴다.
  if v_code is not null and exists (
    select 1
      from letters l
     where (l.expires_at is null or l.expires_at > now())
       and (p_id is null or l.id <> p_id)
       and l.code_hash = crypt(v_code, l.code_hash)
  ) then
    raise exception 'save_letter: code taken' using errcode = '23505';
  end if;

  if p_id is null then
    insert into letters (owner_uid, code_hash, payload)
    values (v_uid, crypt(v_code, gen_salt('bf')), p_payload)
    returning letters.id into v_id;
  else
    -- owner_uid 조건이 곧 권한 검사다(security definer 라 RLS 가 서지 않는다).
    -- coalesce: 번호를 비워 보냈으면(v_code null) 있던 해시를 그대로 둔다.
    update letters l
       set payload   = p_payload,
           code_hash = coalesce(crypt(v_code, gen_salt('bf')), l.code_hash)
     where l.id = p_id
       and l.owner_uid = v_uid
    returning l.id into v_id;

    -- 0행 — 없는 편지이거나 남의 편지다. 어느 쪽인지 말하지 않고 빈 손으로 답한다.
    if v_id is null then
      return;
    end if;
  end if;

  return query
    select l.id, l.payload, l.created_at, l.updated_at
      from letters l
     where l.id = v_id;
end;
$$;

revoke all on function save_letter(uuid, text, jsonb) from public;
grant execute on function save_letter(uuid, text, jsonb) to authenticated;


-- ===========================================================================
-- 3. seed_letter(p_code, p_payload, p_expires_at) : 운영자가 미리 쓴 편지.
--
--    받는 사람은 번호만 받고, 그 번호로 어느 기기에서든 연다. 소유자는 두지 않는다
--    (null) — 아무의 목록에도 뜨지 않고 아무도 고쳐 쓰지 못한다.
--
--    같은 번호로 다시 부르면 **갱신**이다(시드 파일을 고쳐 다시 돌리는 것이 정상 경로).
--    다만 그 번호를 이미 **사용자**가 쓰고 있으면 23505 로 거절한다 — 운영자가 남의
--    편지를 덮어쓰는 길은 열지 않는다.
-- ===========================================================================
create or replace function seed_letter(
    p_code       text,
    p_payload    jsonb,
    p_expires_at timestamptz default null
  )
  returns table (
    id     uuid,
    action text
  )
  language plpgsql
  security definer
  set search_path = public, extensions
as $$
declare
  v_code text := nullif(upper(btrim(p_code)), '');
  v_row  letters%rowtype;
  v_id   uuid;
begin
  if v_code is null or v_code !~ '^[A-Z0-9]{4,12}$' then
    raise exception 'seed_letter: bad code' using errcode = '22023';
  end if;

  select * into v_row
    from letters l
   where (l.expires_at is null or l.expires_at > now())
     and l.code_hash = crypt(v_code, l.code_hash)
   limit 1;

  if found then
    if v_row.owner_uid is not null then
      raise exception 'seed_letter: code taken' using errcode = '23505';
    end if;

    update letters l
       set payload    = p_payload,
           expires_at = p_expires_at
     where l.id = v_row.id;

    id     := v_row.id;
    action := 'updated';
    return next;
    return;
  end if;

  insert into letters (owner_uid, code_hash, payload, expires_at)
  values (null, crypt(v_code, gen_salt('bf')), p_payload, p_expires_at)
  returning letters.id into v_id;

  id     := v_id;
  action := 'inserted';
  return next;
end;
$$;

-- 브라우저로 나가는 두 역할(anon·authenticated)에게는 **주지 않는다.**
-- 이 함수는 owner 없는 편지를 만들 수 있어서, 열리면 누구나 남의 목록 밖에
-- 지워지지 않는 편지를 쌓을 수 있다.
revoke all on function seed_letter(text, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function seed_letter(text, jsonb, timestamptz) to service_role;
