# DearBloom

[English](README.md) · [한국어](README.ko.md)

**받는 사람과 상황, 전하고 싶은 마음에 맞는 꽃을 고릅니다.**

DearBloom은 검토된 꽃 도감에서 최대 세 가지 꽃을 추천하고, 선택 이유·꽃말·관련 이야기·카드 문구를 함께 보여주는 서비스입니다. 관계와 취향, 예산, 계절, 반려동물 관련 주의사항을 하나의 흐름에서 살펴볼 수 있습니다.

앱 화면과 편집 콘텐츠는 현재 한국어로 제공하며, README는 영어와 한국어로 제공합니다.

## 주요 기능

| 기능 | 할 수 있는 일 | 경로 |
|---|---|---|
| 개인 추천 | 관계·마음·받는 사람·현실 조건·확인의 다섯 단계를 거쳐 꽃과 선택 이유, 카드 문구 제안 | `/recommend` |
| 그룹 추천 | 사람마다 각각 꽃을 고르거나 구성원의 조건을 함께 고려한 한 다발 추천 | `/groups` |
| 다발 짜기 | 주 꽃 하나·곁들이 최대 두 가지·색 하나를 골라 반려동물 주의사항, 색·향·꽃말 확인 | `/bouquet` |
| 꽃 도감 | 꽃 59종 탐색, 이름 검색, 탄생화 찾기, 사진·세밀화·문학 상세 열람 | `/flowers`, `/flowers/[slug]` |
| 계절 달력 | 개화 월별로 꽃을 살펴보고 도감 상세로 이동 | `/calendar` |
| 이야기 아카이브 | 꽃 이야기 452편 검색, 테마·계열·분위기 필터 | `/stories` |
| 읽을거리 | 직접 고른 축제·글·관리법·색 트렌드와 별도로 수집한 축제 목록 탐색 | `/reads` |
| 추천 결과 공유 | 꽃 ID·관계·마음·날짜를 담은 링크 열기. 자유 서술과 생성 문구는 링크에서 제외 | `/r?c=…` |
| 비밀 편지 | 같은 브라우저에서 편지를 작성·수정하고 번호로 다시 열기 | `/letter`, `/letter/studio` |
| 꽃집·꽃시장 안내 | 꽃집과 시장 정보를 살펴보고 외부 사이트로 이동 | `/partners` |

홈에서는 오늘의 꽃과 이야기, 오늘의 탄생화를 소개합니다.

## 추천이 만들어지는 방식

1. **입력 해석:** 선택형 답변은 엔진에 바로 전달합니다. 선택적으로 사용하는 AI가 받는 사람에 관한 메모와 에피소드를 엔진의 어휘로 해석하며, 키가 없거나 호출에 실패·시간 초과가 발생하면 로컬 키워드 사전으로 처리합니다.
2. **조건 적용:** 심각한 반려동물 독성, 예산 구간, 사용자가 제외한 꽃, 향 민감 조건에 맞지 않는 강한 향의 꽃을 후보에서 뺍니다. 가벼운 반려동물 관련 영향은 주의 문구로 표시합니다.
3. **점수·설명 구성:** 순수 TypeScript 함수가 후보의 적합도를 계산하고, 선택의 다양성을 반영한 뒤 추천 이유와 관련 콘텐츠를 붙입니다.
4. **카드 문구 생성:** 별도 AI 호출로 톤과 길이에 따른 문구를 만듭니다. 서버는 꽃 추천 결과를 먼저 보내고 문구 초안을 점진적으로 표시할 수 있으며, 스키마 검증을 통과한 값만 최종 문구로 확정합니다. 생성에 실패하면 준비된 템플릿 예문을 유지합니다.

AI는 설정된 키에 한해 **Gemini → Anthropic → CLOVA → NVIDIA** 순서로 호출합니다. 입력 해석은 전체 4초, 문구 생성은 별도로 전체 10초의 제한을 둡니다.

구현은 [추천 엔진](src/lib/engine/index.ts), [프로바이더 체인](src/lib/llm/chain.ts), [스트리밍 경로](src/app/recommend/stream/route.ts)에서 확인할 수 있습니다.

## 현재 구현 범위

- **로컬 실행에는 API 키와 외부 DB가 필요하지 않습니다.** 추천·콘텐츠 탐색·로컬 편지는 키 없이도 동작합니다.
- **콘텐츠 조회 원본은 CSV입니다.** Supabase 스키마와 시드 CLI는 준비되어 있지만, DB에 적재한다고 앱의 조회 경로가 Supabase로 전환되지는 않습니다.
- **편지는 localStorage에 저장합니다.** 같은 브라우저 프로필·같은 사이트 주소에서 다시 열 수 있고, 저장소를 지우면 편지도 사라집니다. 기기 간 편지 전달은 아직 구현하지 않았습니다.
- **추천 링크와 편지는 별개입니다.** 추천 링크는 제한된 결과 값을 URL에 담으며, 서버에 공유 레코드를 만들지 않습니다.
- **구매는 외부 사이트로 연결합니다.** 선택적으로 사용할 11번가 상품 검색 어댑터가 있으며, 키나 유효한 결과가 없으면 사이트 목록으로 전환합니다. 실제 키로 받은 응답은 추가 검증이 필요한 상태로 기록되어 있습니다.
- **정적 데모는 로컬 입력 해석과 템플릿 문구를 사용합니다.** 추천 엔진은 공유하지만, 서버 배포에서 AI가 자유 서술을 다르게 해석하면 엔진 입력과 추천 결과도 달라질 수 있습니다. 일부 이미지는 외부 호스트에서 불러옵니다.

## 기술 구성

| 영역 | 구현 |
|---|---|
| 애플리케이션 | Next.js 16.3.1 App Router, React 19.2.8, TypeScript |
| 스타일·모션 | Tailwind CSS 4, CSS Modules, GSAP, Lenis, Three.js |
| 콘텐츠·검증 | CSV, csv-parse, Zod 4; 행 스키마와 교차 참조 검증 공유 |
| 선택 연동 | LLM REST API, 11번가 상품 검색, 한국관광공사 TourAPI |
| DB 준비 | Supabase/Postgres 마이그레이션, 콘텐츠 upsert CLI |
| 품질 검사 | ESLint, Next.js 라우트 타입 생성, TypeScript, Vitest, GitHub Actions |

의존성 범위와 실행 명령의 기준은 [package.json](package.json)입니다.

## 빠른 시작

**Node.js 24 이상**과 npm이 필요합니다.

```bash
git clone https://github.com/jhsoo0211/dearbloom.git
cd dearbloom
npm ci
npm run dev
```

브라우저에서 [localhost:3000](http://localhost:3000)을 엽니다. 종료할 때는 실행 중인 터미널에서 `Ctrl+C`를 누릅니다.

### Windows PowerShell

PowerShell이 `npm.ps1` 실행을 차단하면 `npm.cmd`를 사용합니다. 전역 실행 정책을 바꿀 필요는 없습니다.

```powershell
npm.cmd ci
npm.cmd run dev
```

보조 실행기는 기본적으로 기존 프로세스를 종료하지 않고 포트 사용 여부를 확인합니다.

```powershell
.\scripts\dev.cmd
.\scripts\dev.cmd -Port 3400
```

`-Clean` 옵션은 선택한 포트의 Node 프로세스를 종료할 수 있습니다. `npm run stop`도 3000·3001 포트의 Node 프로세스 트리를 종료하므로, 해당 포트를 쓰는 다른 프로젝트의 서버가 대상이 될 수 있습니다.

## 선택 환경변수

외부 연동이 필요할 때만 [.env.example](.env.example)을 `.env`로 복사합니다.

```bash
cp .env.example .env
```

PowerShell에서는 `Copy-Item .env.example .env`를 사용합니다.

| 변수 | 용도 |
|---|---|
| `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `CLOVA_API_KEY`, `NVIDIA_API_KEY` | 서버에서 자유 서술 해석과 카드 문구 생성 |
| `LLM_MODEL` | Gemini·Anthropic이 함께 참조하는 모델명 덮어쓰기 값. 활성화한 프로바이더에 맞는 모델 사용 |
| `CLOVA_MODEL`, `NVIDIA_MODEL` | 프로바이더별 모델명 덮어쓰기 |
| `ELEVENST_API_KEY` | 선택적 상품 검색 연동 |
| `DATA_GO_API_KEY` | TourAPI 축제 수집. 스크립트는 이전 이름 `DATA_GO_KR_API_KEY`도 허용 |
| `NEXT_PUBLIC_SITE_URL` | canonical·Open Graph·sitemap의 기준 URL |
| `DEARBLOOM_CONTENT_DIR` | 기본 `content/` 대신 읽을 디렉터리 |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | 로컬에서 Supabase로 콘텐츠 시드 적재 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 준비된 Supabase 어댑터 설정. DB 조회나 기기 간 편지를 활성화하지 않음 |

API 키는 서버에서만 사용하고 Git에 커밋하지 않습니다. service-role 키는 로컬 시드 CLI용이며 브라우저 설정으로 노출하지 않습니다.

## 콘텐츠

[content/](content/) 아래 열두 CSV가 사람이 검토·편집하는 단일 원본입니다. 아래 수량은 **2026-09-07 저장소 기준**으로 확인했습니다.

| 파일 | 내용 | 행 수 |
|---|---|---:|
| `flowers.csv` | 꽃 도감 항목 | 59 |
| `meanings.csv` | 꽃말 | 369 |
| `stories.csv` | 꽃 이야기 | 452 |
| `rules.csv` | 추천·회피 규칙 기록 | 151 |
| `templates.csv` | 카드 문구 템플릿 | 62 |
| `quotes.csv` | 문학 발췌·범용 인용 | 89 |
| `pet_safety.csv` | 꽃 59종의 고양이·강아지 조합 | 118 |
| `birth_flowers.csv` | 윤년 기준 날짜별 탄생화 | 366 |
| `birth_photos.csv` | 미확보 항목을 포함한 탄생화 사진 기록 | 280 |
| `birth_stories.csv` | 탄생화 이야기 | 407 |
| `reads.csv` | 직접 고른 외부 읽을거리 링크 | 54 |
| `occasions.csv` | 꽃을 건네는 상황 예시 | 91 |

규칙 151행은 가점 132행과 회피 기록 19행입니다. 회피 기록은 아직 조건별 제외·감점에 연결하지 않았으며, 현재 동작하는 제외 로직은 [exclude.ts](src/lib/engine/exclude.ts)에 별도로 구현되어 있습니다.

`npm run seed`로 CSV 스키마와 참조 무결성을 검증합니다. DB에 적재하려면 [마이그레이션](db/migrations/) **0001부터 0013까지** 번호순으로 적용하고 로컬 Supabase 환경변수를 설정한 뒤 `npm run seed:apply`를 실행합니다. DB·배포 가이드와 환경변수 예시의 이전 안내는 0011에서 끝나므로, 0012(읽을거리)와 0013(상황 예시)도 포함해야 합니다.

TourAPI 수집 결과는 `content/generated/festivals.json`에 별도로 둡니다. `npm run reads:festivals`는 직접 편집한 CSV를 바꾸지 않고 이 목록을 갱신합니다. 키가 없거나 수집에 실패하면 기존 목록을 유지하므로, 종료 코드 0만으로 새 데이터 수집 성공을 판단하지 않습니다.

## 명령과 검증

PowerShell에서 필요하면 아래 `npm`을 `npm.cmd`로 실행합니다.

| 명령 | 용도 |
|---|---|
| `npm run dev` | 개발 서버 시작 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | Next.js 라우트 타입 생성 후 `tsc --noEmit` 실행 |
| `npm run test` / `npm run test:watch` | Vitest 1회 실행 / 감시 모드 |
| `npm run seed` / `npm run seed:apply` | 콘텐츠 검증 / 검증 후 Supabase upsert |
| `npm run build` / `npm run start` | 서버 앱 빌드 / 빌드 결과 실행 |
| `npm run demo:data` | 콘텐츠에서 브라우저용 데모 데이터 재생성 |
| `npm run build:static` | 데모 데이터 재생성 후 `out/`으로 정적 내보내기 |
| `npm run reads:festivals` | 축제 목록 갱신. 기본 수집 범위는 앞으로 6개월 |
| `npm run birth:photos` | 누락된 탄생화 사진 다운로드. `-- --force`는 기존 파일도 다시 다운로드 |
| `npm run stop` | 3000·3001 포트의 Node 프로세스를 종료하는 Windows 보조 명령 |

[CI](.github/workflows/ci.yml)는 Node.js 24에서 다음 검사를 실행합니다.

```bash
npm run lint
npm run typecheck
npm run test
npm run seed
npm run build
```

## 배포

| 방식 | 빌드·산출물 | 동작 |
|---|---|---|
| 서버 앱 | `npm run build` → `.next/` | Next.js 서버 액션·스트리밍, 선택적 AI 연동 |
| 정적 데모 | `npm run build:static` → `out/` | 브라우저에서 추천 계산, 번들 콘텐츠, 로컬 입력 해석, 템플릿 문구 |

저장소에는 [Netlify 설정](netlify.toml)과 GitHub 연결 배포를 위한 [배포 가이드](deploy/README.md)가 있습니다. 배포 주소와 연동 키는 호스팅 환경변수로 설정합니다.

정적 빌드는 `src/lib/demo/data/`의 생성 파일을 다시 쓰고 데모용 `.next/`를 삭제합니다. 이후 `npm run start`로 돌아가려면 `npm run build`를 다시 실행해야 합니다. 정적 산출물도 외부 호스팅 이미지를 불러올 때는 네트워크가 필요합니다.

## 저장소 구조와 문서

| 경로 | 내용 |
|---|---|
| `src/app/` | 페이지·서버 액션·스트리밍 경로 |
| `src/components/` | 추천 흐름·도감·다발·편지 등 화면 |
| `src/lib/engine/` | 개인·그룹 추천, 다발 검사, 설명 구성 |
| `src/lib/llm/` | 입력 해석·문구 계약·프롬프트·프로바이더 폴백 |
| `src/lib/data/`, `content/`, `db/seed/` | CSV 로딩·편집 원본·공유 검증·DB 적재 |
| `src/lib/demo/` | 정적 데모 어댑터·생성된 브라우저 데이터 |
| `src/lib/letters/` | 현재 로컬 저장소·준비된 Supabase 어댑터 |
| `public/`, `design/` | 이미지 자산·확정 HTML 시안 |
| `tests/`, `scripts/`, `db/migrations/` | 테스트·운영 스크립트·DB 스키마 이력 |
| `docs/`, `contest/`, `deploy/` | 기획·조사 기록, 공모전 자료, 배포 안내 |

상세 문서는 대부분 한국어로 작성되어 있습니다.

- [디자인·워딩·플로우 스펙](docs/design-spec.md)
- [제품 기획안 v2](docs/기획안_v2.md) · [통합 기획안 v3](docs/기획안_v3.md)
- [콘텐츠 편집 가이드](content/README.md) · [DB 가이드](db/README.md)
- [실사 이미지 출처·라이선스](docs/image-assets.md) · [세밀화 출처·라이선스](docs/illustration-assets.md)
- [읽을거리 조사 원장](docs/reads-research.md)
- 주간 리서치: [8월 17일](docs/weekly-research-2026-08-17.md), [8월 24일](docs/weekly-research-2026-08-24.md), [8월 31일](docs/weekly-research-2026-08-31.md)

기획 문서에는 향후 계획도 포함되어 있습니다. 구현 완료 여부는 현재 코드와 위 구현 범위를 함께 확인합니다.
