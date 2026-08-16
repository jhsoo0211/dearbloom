# dearbloom 배포 가이드

> **이 문서는 배포가 끝날 때까지 계속 갱신한다.** 방식이 바뀌거나 환경변수가 늘면
> 여기부터 고친다 — 배포 절차의 단일 원본은 이 파일이다.
> 마지막 갱신: 2026-08-16 (Supabase 연결 준비 · GitHub 배포 선택지 추가)

이 폴더는 배포 전용이다. 소스 zip 스냅샷이 여기 만들어지고(`dearbloom-source-*.zip`),
zip 파일 자체는 git에 커밋되지 않는다(.gitignore).

## 먼저 알아둘 것 — 정적 배포로는 안 된다

dearbloom은 정적 사이트가 아니다. 추천 엔진 호출·LLM 멘트 생성·그룹 추천이 전부
**서버 액션**으로 돌아서, "폴더/zip 드래그 앤 드롭"(정적 전용)이나 GitHub Pages로는 그
기능이 전부 죽는다. 배포는 아래 **GitHub 리포 연결 방식**으로 한다. zip은 백업·이관용
스냅샷이다.

## GitHub로 배포하기 — 선택지 비교

| 방식 | 서버 액션 | 비공개 리포 | 준비된 설정 | 판단 |
|---|---|---|---|---|
| **① GitHub 연결 → Vercel** | ○ 완전 지원 | ○ 무료 연결 | 별도 파일 불필요 | **권장 1순위** |
| ② GitHub 연결 → Netlify | ○ (런타임 플러그인) | ○ | `netlify.toml` 있음 | 대안 |
| ③ GitHub Pages | ✗ **불가** | — | — | 쓰지 않는다 |
| ④ GitHub Actions 자체 빌드 + 타 호스팅 | 호스팅 나름 | ○ | 없음 | 과잉 |

### ① GitHub 리포 연결 → Vercel (권장)

Next.js를 만든 회사의 호스팅이라 서버 액션·이미지·헤더 설정이 손댈 것 없이 그대로 돈다.
비공개 리포도 무료로 붙는다.

1. [vercel.com](https://vercel.com) → GitHub 계정으로 로그인 → **Add New → Project**
2. `jhsoo0211/dearbloom` **Import** (비공개 리포 접근 허용)
3. Framework Preset이 **Next.js**로 자동 인식되면 빌드 설정은 손대지 않는다
   (`netlify.toml`은 Vercel이 읽지 않으니 남아 있어도 무해하다)
4. **Environment Variables**에 아래 표의 값을 넣는다 (Production·Preview 모두 체크) — 이 단계가 핵심이다
5. **Deploy** → 발급된 주소를 `NEXT_PUBLIC_SITE_URL`에 다시 넣고 한 번 재배포
   (OG·canonical·sitemap의 절대 URL 기준이 이 값이다)

### ② GitHub 리포 연결 → Netlify

빌드 설정을 리포의 `netlify.toml`이 이미 들고 있다(빌드 명령·Node 24·`@netlify/plugin-nextjs`).
순서는 아래 [Netlify 배포 순서](#netlify-배포-순서) 절 그대로다.

### ③ GitHub Pages는 **쓸 수 없다**

GitHub Pages는 정적 파일만 서빙한다. Next 서버가 없으므로 서버 액션이 도는 화면이
전부 죽는다 — "일단 Pages에 올려 보고 안 되면 옮기자"가 성립하지 않는다는 뜻이라
무엇이 죽는지 적어 둔다.

| 기능 | 어디서 도는가 | GitHub Pages |
|---|---|---|
| 추천 결과 `/recommend` | 서버 액션 | ✗ 버튼을 눌러도 아무 일도 안 일어난다 |
| LLM 멘트 생성 | 서버 액션 + 서버 전용 키 | ✗ (키를 브라우저에 심는 방법뿐 — 하지 않는다) |
| 그룹 추천 | 서버 액션 | ✗ |
| 결과 공유 카드 | 서버 액션 | ✗ |
| 도감·이야기·문학 | 빌드 시점 정적 | ○ |
| 비밀 편지 `/letter` | 브라우저 localStorage | ○ (지금 단계 한정 — 서버를 안 쓰기 때문) |

정적으로 뽑으려면 `output: 'export'`가 필요한데, 서버 액션이 하나라도 있으면 그 빌드는
아예 실패한다. 기능을 덜어내지 않는 한 선택지가 아니다.

### ④ GitHub Actions로 직접 빌드해서 다른 곳에 올리기 — 비권장

①·②가 커밋마다 알아서 하는 일(빌드·함수 분리·환경변수 주입)을 워크플로 YAML로 다시
쓰는 일이라, 얻는 것 없이 유지보수만 늘어난다.

## Netlify 배포 순서

1. [netlify.com](https://netlify.com) 로그인 → **Add new site → Import an existing project**
2. GitHub 연결 → `jhsoo0211/dearbloom` 선택 (비공개 리포 접근 허용)
3. 빌드 설정은 리포의 `netlify.toml`이 이미 들고 있다 — 그대로 진행
4. **Environment variables** 에 아래 표의 값을 넣는다 (이 단계가 핵심이다)
5. Deploy → 끝나면 발급된 주소를 `NEXT_PUBLIC_SITE_URL` 에 다시 넣고 한 번 재배포

## 환경변수 표 — 키는 호스팅 대시보드에만 넣는다

| 변수 | 값 | 필수 여부 |
|---|---|---|
| `GEMINI_API_KEY` | AI Studio 키 (`AQ.…`) | 멘트 생성 1차 — 없으면 템플릿 예문으로 동작 |
| `CLOVA_API_KEY` | CLOVA Studio 키 (`nv-…`) | 한국어 특화 폴백 — 선택 |
| `NVIDIA_API_KEY` | NIM 키 (`nvapi-…`) | 비상 폴백 — 선택 |
| `ANTHROPIC_API_KEY` | (있으면) | 선택 |
| `NEXT_PUBLIC_SITE_URL` | 배포 주소 (`https://….vercel.app`) | 권장 — OG·sitemap 기준 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<프로젝트>.supabase.co` | Supabase를 붙인 뒤 — 아래 절 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개(anon) 키 | 위와 한 벌 (브라우저에 나가는 값이 맞다) |
| `SUPABASE_SERVICE_ROLE_KEY` | 비밀 키 | **호스팅에 넣지 않는다** — 아래 절 참고 |
| `RESULT_TTL_HOURS` / `DAILY_GEN_LIMIT_PER_UID` | 72 / 20 | 선택 (기본값 동작) |

로컬 `.env` 값을 그대로 옮겨 적으면 된다. **`.env` 파일 자체를 업로드하거나 커밋하지
않는다** — 리포는 `.gitignore` 3중 규칙으로 이미 막혀 있고, 아래 zip 도 git 추적 파일만
담아서 키가 들어갈 방법이 없다.

`SUPABASE_SERVICE_ROLE_KEY`는 RLS를 통째로 우회하는 키다. 지금 앱 코드는 이 키를 한
줄도 읽지 않는다(쓰는 곳은 로컬 시드 CLI 하나뿐이라 로컬 `.env`에만 둔다). 서버에서 이
키가 필요해지는 날 이 표를 함께 고친다.

## Supabase 붙이기 (콘텐츠 DB)

지금 앱은 `content/*.csv`를 런타임에 읽어 돌아간다. Supabase는 **그 CSV를 DB로 옮기는
단계**이며, 아래 4단계를 마치면 켜진다.

1. [supabase.com](https://supabase.com) → **New project**.
   리전은 `Northeast Asia (Seoul)`, DB 비밀번호는 따로 보관한다(다시 안 보여 준다).
2. **SQL Editor → New query** 에서 `db/migrations/` 를 **파일 번호 순서대로** 붙여 실행한다:
   `0001_catalog` → `0002_results_share` → `0003_rls` → `0004_stories` → `0005_story_tags`
   → `0006_story_type` → `0007_source_kind` → `0008_quotes_literature` → `0009_letters`
   → `0010_birth_flowers`.
   **순서가 곧 의존성이다**(0003은 0001·0002의 표를, 0005~0007은 0004의 표를, 0008은
   `quotes`를, 0010은 `flowers`를 참조한다). `create table` 파일은 두 번 돌리면 에러가
   나는데, 그것이 의도다 — 재실행이 살아 있는 데이터를 덮지 못하게 한다(`db/README.md`).
3. **Project Settings → API** 의 세 값을 로컬 `.env`에 채운다.
   `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY`.
   앞의 둘은 호스팅 환경변수에도 같이 넣는다(위 표). service_role 키는 로컬에만 둔다.
4. 콘텐츠를 밀어 넣는다. PowerShell에서는 `--` 가 필수다:

   ```powershell
   npm run seed              # dry-run — CSV 검증만, DB를 건드리지 않는다
   npm run seed -- --apply   # 검증을 통과하면 그대로 반영
   ```

   `--apply`는 `.env`를 읽어 붙는다. 키가 비어 있으면 **DB를 부르기 전에** "Supabase 미설정"
   으로 멈추고, 반영 중 실패하면 어느 테이블에서 멈췄는지 말한다.
5. 시드가 끝난 뒤 `0005_story_tags.sql` 맨 아래에 남겨 둔 한 줄을 실행한다:

   ```sql
   alter table flower_stories validate constraint flower_stories_moods_not_empty;
   ```

### 편지(`/letter`)는 아직 넘어가지 않는다

키를 다 채워도 편지는 **브라우저 저장소에 그대로 있다.** 0009의 소유자 정책은 로그인
(`auth.uid()`)을 전제하는데 지금 앱에는 로그인이 없어, 서버 어댑터를 켜면 "읽기는 서버,
쓰기는 이 기기"라는 반쪽 상태가 되고 사용자의 편지가 두 곳으로 갈라진다. 그래서 전환은
**익명 로그인을 붙이는 날 한 번에** 한다 — 코드는 `src/lib/letters/supabase-store.ts`에
이미 있고, 그 머리말이 남은 일(쓰기 RPC `save_letter`, 번호 길이 4~12자 반영)을 적어 두었다.

## 소스 zip 스냅샷 만들기

```powershell
powershell -File scripts/package-deploy.ps1
```

`deploy/dearbloom-source-<날짜>.zip` 이 생긴다. `git archive` 기반이라
`.env`·`node_modules`·`.next` 는 **구조적으로 포함될 수 없다**(git 미추적).
빈 키 템플릿은 `.env.example` 로 들어 있으니 받은 쪽은 그걸 채우면 된다.

## 배포 전 체크리스트

- [ ] `npm run test` · `npm run build` 초록 (마지막 커밋 기준 확인됨)
- [ ] 호스팅 환경변수 입력 (위 표) — 키는 리포가 아니라 대시보드에
- [ ] 배포 후 `/recommend` 한 번 완주 — 멘트가 예문이 아니라 생성문인지 (키 연결 확인)
- [ ] `NEXT_PUBLIC_SITE_URL` 을 발급 주소로 채우고 재배포 (OG·sitemap)
- [ ] Supabase 를 붙이는 날: 마이그레이션 `0001~0010` 적용 → env 3종 → `npm run seed -- --apply`
- [ ] `/letter` 는 현재 기기 저장 단계 — 기기 간 열람은 익명 로그인까지 붙는 날
