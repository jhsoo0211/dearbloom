# dearbloom 배포 가이드 (Netlify)

이 폴더는 배포 전용이다. 소스 zip 스냅샷이 여기 만들어지고(`dearbloom-source-*.zip`),
zip 파일 자체는 git에 커밋되지 않는다(.gitignore).

## 먼저 알아둘 것 — zip 드래그 배포가 안 되는 이유

dearbloom은 정적 사이트가 아니다. 추천 엔진 호출·LLM 멘트 생성·그룹 추천이 전부
**서버 액션**으로 돌아서, Netlify의 "폴더/zip 드래그 앤 드롭"(정적 전용)으로는 그 기능이
전부 죽는다. 배포는 아래 **git 연결 방식**으로 한다. zip은 백업·이관용 스냅샷이다.

## 배포 순서 (git 연결 — 권장)

1. [netlify.com](https://netlify.com) 로그인 → **Add new site → Import an existing project**
2. GitHub 연결 → `jhsoo0211/dearbloom` 선택 (비공개 리포 접근 허용)
3. 빌드 설정은 리포의 `netlify.toml`이 이미 들고 있다 — 그대로 진행
4. **Environment variables** 에 아래 표의 값을 넣는다 (이 단계가 핵심이다)
5. Deploy → 끝나면 발급된 주소를 `NEXT_PUBLIC_SITE_URL` 에 다시 넣고 한 번 재배포
   (OG·sitemap 의 절대 URL 기준이 이 값이다)

## 환경변수 표 — 키는 여기(Netlify)에만 넣는다

| 변수 | 값 | 필수 여부 |
|---|---|---|
| `GEMINI_API_KEY` | AI Studio 키 (`AQ.…`) | 멘트 생성 1차 — 없으면 템플릿 예문으로 동작 |
| `CLOVA_API_KEY` | CLOVA Studio 키 (`nv-…`) | 한국어 특화 폴백 — 선택 |
| `NVIDIA_API_KEY` | NIM 키 (`nvapi-…`) | 비상 폴백 — 선택 |
| `ANTHROPIC_API_KEY` | (있으면) | 선택 |
| `NEXT_PUBLIC_SITE_URL` | 배포 주소 (`https://….netlify.app`) | 권장 — OG·sitemap 기준 |
| `RESULT_TTL_HOURS` / `DAILY_GEN_LIMIT_PER_UID` | 72 / 20 | 선택 (기본값 동작) |

로컬 `.env` 값을 그대로 옮겨 적으면 된다. **`.env` 파일 자체를 업로드하거나 커밋하지
않는다** — 리포는 `.gitignore` 3중 규칙으로 이미 막혀 있고, 아래 zip 도 git 추적 파일만
담아서 키가 들어갈 방법이 없다.

## 소스 zip 스냅샷 만들기

```powershell
powershell -File scripts/package-deploy.ps1
```

`deploy/dearbloom-source-<날짜>.zip` 이 생긴다. `git archive` 기반이라
`.env`·`node_modules`·`.next` 는 **구조적으로 포함될 수 없다**(git 미추적).
빈 키 템플릿은 `.env.example` 로 들어 있으니 받은 쪽은 그걸 채우면 된다.

## 배포 전 체크리스트

- [ ] `npm run test` · `npm run build` 초록 (마지막 커밋 기준 확인됨)
- [ ] Netlify 환경변수 입력 (위 표)
- [ ] 배포 후 `/recommend` 한 번 완주 — 멘트가 예문이 아니라 생성문인지 (키 연결 확인)
- [ ] `/letter` 는 현재 기기 저장 단계 — 기기 간 열람은 Supabase 연결 후 (0009 마이그레이션 준비됨)
- [ ] Supabase 를 붙이는 날: `db/migrations/0001~0009` 적용 + `NEXT_PUBLIC_SUPABASE_*` 3종 추가
