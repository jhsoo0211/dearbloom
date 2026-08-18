# dearbloom 배포 가이드

> **이 문서는 배포가 끝날 때까지 계속 갱신한다.** 방식이 바뀌거나 환경변수가 늘면
> 여기부터 고친다 — 배포 절차의 단일 원본은 이 파일이다.
> 마지막 갱신: 2026-08-16 (정적 드롭 데모 추가 · Supabase 연결 준비 · GitHub 배포 선택지)

이 폴더는 배포 전용이다. zip 스냅샷이 여기 만들어지고(`dearbloom-source-*.zip` ·
`dearbloom-static-demo-*.zip`), zip 파일 자체는 git에 커밋되지 않는다(.gitignore).

## 먼저 알아둘 것 — 길이 두 갈래다

| | **본배포** | **정적 드롭 데모** |
|---|---|---|
| 무엇인가 | 서비스 그 자체 | 서버 없이 보여 주는 한 벌 |
| 어떻게 | GitHub 리포 연결 (Vercel·Netlify) | `out/` 폴더나 zip을 드롭 |
| 명령 | `npm run build` | `npm run build:static` |
| 멘트 | LLM이 그 자리에서 쓴다 | 미리 적어 둔 예문 |
| 쓰는 때 | 실제 서비스 | 심사·시연·키 없이 정적 화면을 검토할 때 |

**두 갈래를 섞지 마라.** 본배포에서 추천·그룹·멘트 생성은 **서버 액션**으로 돌고,
그 코드는 정적 호스팅에 올릴 수 없다. 반대로 드롭 데모는 서버가 없으니 LLM을 부를
방법이 없다(키를 브라우저에 심는 길은 열지 않는다 — 그 순간 키는 공개된 것이다).

실제 서비스를 올리는 것이면 아래 **GitHub 리포 연결 방식**으로 간다.
누군가에게 "이런 서비스입니다" 하고 폴더 하나로 건네는 것이면
[정적 드롭 데모](#정적-드롭-데모--서버-없이-도는-한-벌) 절로 간다.

## GitHub로 배포하기 — 선택지 비교

| 방식 | 서버 액션 | 비공개 리포 | 준비된 설정 | 판단 |
|---|---|---|---|---|
| **① GitHub 연결 → Vercel** | ○ 완전 지원 | ○ 무료 연결 | 별도 파일 불필요 | **권장 1순위** |
| ② GitHub 연결 → Netlify | ○ (런타임 플러그인) | ○ | `netlify.toml` 있음 | 대안 |
| ③ GitHub Pages | △ 데모 빌드만 | — | `npm run build:static` | 데모 한정 |
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

### ③ GitHub Pages는 **본배포로는 쓸 수 없다**

GitHub Pages는 정적 파일만 서빙한다. `npm run build`가 만드는 산출물에는 서버 액션이
들어 있어 그대로는 올라가지 않는다. 다만 `npm run build:static`이 만든 `out/`은
Pages에도 그대로 올라간다 — 그건 **본배포가 아니라 데모**이며, 무엇이 같고 무엇이
다른지는 아래 절의 표가 전부다.

### ④ GitHub Actions로 직접 빌드해서 다른 곳에 올리기 — 비권장

①·②가 커밋마다 알아서 하는 일(빌드·함수 분리·환경변수 주입)을 워크플로 YAML로 다시
쓰는 일이라, 얻는 것 없이 유지보수만 늘어난다.

## Netlify 배포 순서

1. [netlify.com](https://netlify.com) 로그인 → **Add new site → Import an existing project**
2. GitHub 연결 → `jhsoo0211/dearbloom` 선택 (비공개 리포 접근 허용)
3. 빌드 설정은 리포의 `netlify.toml`이 이미 들고 있다 — 그대로 진행
4. **Environment variables** 에 아래 표의 값을 넣는다 (이 단계가 핵심이다)
5. Deploy → 끝나면 발급된 주소를 `NEXT_PUBLIC_SITE_URL` 에 다시 넣고 한 번 재배포

## 정적 드롭 데모 — 서버 없이 도는 한 벌

리포도 계정도 키도 없이, 폴더 하나로 건네는 배포다. Netlify 드롭 존·GitHub Pages·
사내 정적 서버·`npx serve out` 어디에나 그대로 올라간다.

```powershell
npm run build:static                                  # → out/
npx serve out                                         # 로컬에서 열어 보기
powershell -File scripts/package-deploy.ps1 -Static   # → deploy/dearbloom-static-demo-<날짜>.zip
```

Netlify에 드롭할 때는 [app.netlify.com](https://app.netlify.com) → **Sites** 화면의
드롭 존에 그 zip(또는 `out/` 폴더째)을 끌어다 놓으면 끝이다. 계정 하나면 되고
빌드 설정도 환경변수도 없다.

### 되는 것과 다른 것

**추천 알고리즘이 진짜로 돈다.** 엔진(`src/lib/engine`)이 순수 함수라, 서버가 하던
계산을 브라우저가 그대로 한다 — 3안 선정·적합도·색 제안·반려동물 제외·제철 판정까지
같은 코드다. 카탈로그(꽃 59종·꽃말·규칙·이야기·문학)는 빌드할 때 CSV에서 굳혀 함께
싣는다(`scripts/build-demo-catalog.mjs`). **다른 꽃이 나오지 않는다.**

| 기능 | 본배포 | 정적 드롭 데모 |
|---|---|---|
| 추천 3안 `/recommend` | ○ | **○ 같은 엔진, 같은 결과** |
| 꽃말·나라별 갈래·출처 각주 | ○ | ○ |
| 이야기·문학 발췌 | ○ | ○ (꽃당 대표 3편까지 실었다) |
| 반려동물 안전·대체 꽃 | ○ | ○ |
| 그룹 추천 `/groups` (각각·단체 부케) | ○ | **○ 같은 엔진, 같은 결과** |
| 도감 `/flowers` · 생일 꽃 찾기 | ○ | ○ |
| 이야기 아카이브 `/stories` · 전문 시트 | ○ | ○ (438편 전부) |
| 비밀 편지 `/letter` | ○ (브라우저 저장) | ○ (같다 — 원래 서버를 안 쓴다) |
| **멘트(카드 문구)** | LLM이 들려준 이야기를 담아 그 자리에서 쓴다 | **미리 적어 둔 예문**(`templates.csv`) |
| 이미지 최적화 `/_next/image` | ○ | 원본 그대로 (서버가 없다) |
| 전하는 날 기본값 | 접속한 날의 "내일" | **빌드한 날의 "내일"** (직접 고를 수 있다) |

멘트가 예문이라는 사실은 화면이 스스로 말한다 —
*"지금 보이는 멘트는 미리 적어 둔 예문이에요."* 숨기지 않는다.

### 왜 LLM은 못 싣는가

부르려면 API 키가 필요하고, 서버가 없는 배포에서 키를 두는 자리는 브라우저뿐이다.
브라우저에 심은 키는 개발자 도구를 여는 누구에게나 공개된 키다. 그래서 데모는
**키가 없는 쪽**을 택했다. 생성 멘트를 보여 줘야 하는 자리라면 본배포로 간다.

### 알아 둘 것

- **`.next`가 지워진다.** 정적 빌드도 중간 산물은 `.next`에 쓰는데(Next가 `distDir`을
  "내보낼 곳"으로 해석한다) 그대로 두면 서버 액션이 빠진 산출물이 남아, 뒤이어
  `npm run start`를 누른 사람이 추천이 조용히 죽는 사이트를 보게 된다. 빌드 스크립트가
  끝에 지운다 — 본배포로 돌아가려면 `npm run build`를 다시 돌린다.
- **드롭 zip은 `out/` 안쪽을 담는다**(폴더째가 아니라). Netlify 드롭은 zip 루트를 사이트
  루트로 읽어서, 한 겹 감싸면 `index.html`을 못 찾는다.
- **키는 어느 zip에도 없다.** 소스 zip은 git 미추적이라, 정적 zip은 브라우저로 나가는
  코드만 담아서 그렇다.
- 콘텐츠 번들은 **첫 화면에 얹히지 않는다.** 추천을 누른 사람, 이야기 시트를 연 사람,
  생일을 물은 사람만 그때 받는다(각각 gzip 65KB · 100KB · 11KB).

## 환경변수 표 — 키는 호스팅 대시보드에만 넣는다

| 변수 | 값 | 필수 여부 |
|---|---|---|
| `GEMINI_API_KEY` | AI Studio 키 (`AQ.…`) | 멘트 생성 1차 — 없으면 템플릿 예문으로 동작 |
| `CLOVA_API_KEY` | CLOVA Studio 키 (`nv-…`) | 한국어 특화 폴백 — 선택 |
| `NVIDIA_API_KEY` | NIM 키 (`nvapi-…`) | 비상 폴백 — 선택 |
| `ANTHROPIC_API_KEY` | (있으면) | 선택 |
| `ELEVENST_API_KEY` | 11번가 오픈API 키 (openapi.11st.co.kr, 유효 180일) | 「사러 가기」 실상품 목록 — 없으면 사이트 목록으로 동작 |
| `NEXT_PUBLIC_SITE_URL` | 배포 주소 (`https://….vercel.app`) | 권장 — OG·sitemap 기준 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<프로젝트>.supabase.co` | Supabase를 붙인 뒤 — 아래 절 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개(anon) 키 | 위와 한 벌 (브라우저에 나가는 값이 맞다) |
| `SUPABASE_SERVICE_ROLE_KEY` | 비밀 키 | **호스팅에 넣지 않는다** — 아래 절 참고 |

로컬 `.env` 값을 그대로 옮겨 적으면 된다. **`.env` 파일 자체를 업로드하거나 커밋하지
않는다** — 리포는 `.gitignore` 3중 규칙으로 이미 막혀 있고, 아래 zip 도 git 추적 파일만
담아서 키가 들어갈 방법이 없다.

`SUPABASE_SERVICE_ROLE_KEY`는 RLS를 통째로 우회하는 키다. 지금 앱 코드는 이 키를 한
줄도 읽지 않는다(쓰는 곳은 로컬 시드 CLI 하나뿐이라 로컬 `.env`에만 둔다). 서버에서 이
키가 필요해지는 날 이 표를 함께 고친다.

## Supabase 준비하기 (콘텐츠 DB)

지금 앱은 `content/*.csv`를 런타임에 읽어 돌아간다. Supabase는 **그 CSV를 DB로 옮기는
적재 경로와 스키마를 준비한 단계**다. 아래 절차는 DB를 만들고 데이터를 검증·적재하지만,
앱의 런타임 데이터 소스를 자동으로 바꾸지는 않는다. 실제 전환에는 `src/lib/data/catalog.ts`의
CSV 로더를 대체할 Supabase 어댑터와 전환 테스트가 추가로 필요하다.

1. [supabase.com](https://supabase.com) → **New project**.
   리전은 `Northeast Asia (Seoul)`, DB 비밀번호는 따로 보관한다(다시 안 보여 준다).
2. **SQL Editor → New query** 에서 `db/migrations/` 를 **파일 번호 순서대로** 붙여 실행한다:
   `0001_catalog` → `0002_results_share` → `0003_rls` → `0004_stories` → `0005_story_tags`
   → `0006_story_type` → `0007_source_kind` → `0008_quotes_literature` → `0009_letters`
   → `0010_birth_flowers` → `0011_birth_photos_stories`.
   **순서가 곧 의존성이다**(0003은 0001·0002의 표를, 0005~0007은 0004의 표를, 0008은
   `quotes`를, 0010은 `flowers`를, 0011은 `birth_flowers`를 참조한다). `create table` 파일은 두 번 돌리면 에러가
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

## zip 두 가지 만들기

```powershell
powershell -File scripts/package-deploy.ps1            # 소스 스냅샷
powershell -File scripts/package-deploy.ps1 -Static    # 정적 드롭 데모
```

| zip | 무엇이 들었나 | 쓰임 |
|---|---|---|
| `dearbloom-source-<날짜>.zip` | git이 추적하는 소스 전부 | 백업·이관 |
| `dearbloom-static-demo-<날짜>.zip` | 빌드된 사이트(`out/`) | 드롭 배포·시연 |

소스 zip은 `git archive` 기반이라 `.env`·`node_modules`·`.next` 는 **구조적으로 포함될
수 없다**(git 미추적). 또한 아직 커밋하지 않은 변경도 포함되지 않으므로 패키징 전
`git status`로 포함 범위를 확인한다. 빈 키 템플릿은 `.env.example` 로 들어 있으니 받은 쪽은 그걸
채우면 된다. 정적 zip은 브라우저로 나가는 코드만 담겨서 역시 키가 들어갈 자리가 없다.

## 배포 전 체크리스트

### 본배포

- [ ] `npm run test` · `npm run build` 초록 (마지막 커밋 기준 확인됨)
- [ ] 호스팅 환경변수 입력 (위 표) — 키는 리포가 아니라 대시보드에
- [ ] 배포 후 `/recommend` 한 번 완주 — 멘트가 예문이 아니라 생성문인지 (키 연결 확인)
- [ ] `NEXT_PUBLIC_SITE_URL` 을 발급 주소로 채우고 재배포 (OG·sitemap)
- [ ] Supabase 를 준비하는 날: 마이그레이션 `0001~0011` 적용 → env 3종 → `npm run seed -- --apply`
- [ ] 콘텐츠 조회를 DB로 전환하는 날: Supabase 어댑터 연결·회귀 테스트 후 CSV 로더 교체
- [ ] `/letter` 는 현재 기기 저장 단계 — 기기 간 열람은 익명 로그인까지 붙는 날

### 정적 드롭 데모

- [ ] `npm run build:static` 초록 → `npx serve out` 으로 한 번 열어 보기
- [ ] `/recommend` 완주 — 3안이 나오고, 멘트 각주가 "미리 적어 둔 예문"인지
- [ ] `/groups` 에서 **예시로 먼저 보기** → **꽃 고르기** — 각각·단체 부케 둘 다
- [ ] `/flowers` 생일 찾기, `/stories` 시트 열기, `/letter` 편지 쓰고 열기
- [ ] 콘솔 에러 0 (서버 액션을 부르려다 실패한 흔적이 없는지)
- [ ] 넘긴 뒤 `npm run build` 를 다시 돌려 `.next` 복구
