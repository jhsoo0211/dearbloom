# DearBloom

꽃말과 꽃에 얽힌 이야기를 바탕으로, 지금의 관계와 상황에 건넬 꽃을 골라 주는 Next.js 서비스입니다. 추천 결과에는 선택 이유, 반려동물 안전 정보, 관련 이야기와 문학 발췌, 카드 멘트를 함께 담습니다.

## 현재 구현 상태

- 기본 실행에는 API 키나 외부 DB가 필요하지 않습니다. 생성형 AI 키가 없으면 카드 멘트는 검증된 템플릿 예문으로 대체됩니다.
- 앱의 콘텐츠 런타임 원본은 현재 `content/*.csv`입니다. Supabase 마이그레이션과 시드 경로는 준비돼 있지만, DB에 적재한다고 앱의 조회 경로가 자동으로 Supabase로 바뀌지는 않습니다.
- 비밀 편지는 현재 브라우저의 `localStorage`에만 저장됩니다. 같은 브라우저·같은 프로필에서만 다시 열 수 있고, 저장소를 지우거나 다른 기기를 사용하면 열 수 없습니다.
- 정적 데모는 서버와 API 키 없이 동작하지만 꽃 실사 일부를 Unsplash·Pexels에서 불러오므로 완전한 오프라인 패키지는 아닙니다.

## 요구사항

- Node.js 24 이상
- npm

버전은 다음 명령으로 확인할 수 있습니다.

```text
node --version
npm --version
```

## 빠른 시작

### Windows PowerShell

PowerShell에서는 실행 정책에 따라 `npm.ps1`이 차단될 수 있으므로 `npm.cmd`를 사용합니다.

```powershell
cd E:\projects\dearbloom
npm.cmd ci
npm.cmd run dev
```

브라우저에서 <http://localhost:3000>을 열고, 종료할 때는 실행 중인 터미널에서 `Ctrl+C`를 누릅니다.

실행 정책 우회와 포트 충돌 진단을 한 번에 처리하려면 보조 실행기를 사용할 수 있습니다. 기본 실행은 3000 포트가 비어 있을 때만 서버를 시작하며, 점유 중인 다른 프로세스를 임의로 종료하지 않습니다.

```powershell
.\scripts\dev.cmd              # 3000 포트
.\scripts\dev.cmd -Port 3400   # 다른 포트 지정
.\scripts\dev.cmd -Clean       # 선택한 포트의 기존 Node 서버를 정리한 뒤 실행
```

`-Clean`은 선택한 포트의 Node 프로세스를 종료할 수 있으므로 그 프로세스가 이 프로젝트의 것인지 확인한 뒤 사용하세요. Node가 아닌 프로세스가 점유 중이면 종료하지 않고 실패합니다.

### macOS, Linux, Windows CMD

```bash
cd /path/to/dearbloom
npm ci
npm run dev
```

## 환경변수

환경변수 없이도 추천·도감·이야기·편지 화면을 로컬에서 확인할 수 있습니다. 외부 연동이 필요할 때만 예시 파일을 복사합니다.

```powershell
Copy-Item .env.example .env
```

주요 선택 변수는 다음과 같습니다.

| 변수 | 용도 |
|---|---|
| `GEMINI_API_KEY` | 카드 멘트 생성의 첫 번째 프로바이더 |
| `ANTHROPIC_API_KEY`, `CLOVA_API_KEY`, `NVIDIA_API_KEY` | 앞 프로바이더 실패 시 순서대로 사용하는 선택 폴백 |
| `LLM_MODEL`, `CLOVA_MODEL`, `NVIDIA_MODEL` | 프로바이더별 기본 모델 덮어쓰기 |
| `NEXT_PUBLIC_SITE_URL` | 배포 환경의 canonical·Open Graph·sitemap 기준 URL |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | 로컬 `seed:apply`로 Supabase에 콘텐츠를 적재할 때 사용 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 향후 Supabase 런타임 연결용 공개 키; 현재 콘텐츠 조회와 편지 저장소를 전환하지 않음 |
| `DEARBLOOM_CONTENT_DIR` | 기본 `content/` 대신 다른 CSV 디렉터리를 읽을 때 사용 |

`SUPABASE_SERVICE_ROLE_KEY`와 LLM 키는 서버·로컬 전용 비밀값입니다. 저장소에 커밋하거나 브라우저용 변수로 노출하지 마세요.

## 주요 명령

Windows PowerShell에서는 아래 `npm`을 `npm.cmd`로 실행하면 됩니다.

| 명령 | 역할과 부작용 |
|---|---|
| `npm run dev` | 개발 서버 시작 |
| `npm run stop` | 3000·3001 포트를 점유한 **Node 프로세스 트리** 종료. 다른 프로젝트의 Node 서버도 대상이 될 수 있음 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | TypeScript 검사 (`tsc --noEmit`) |
| `npm run test` | Vitest 전체 테스트 1회 실행 |
| `npm run test:watch` | Vitest 감시 모드 |
| `npm run seed` | CSV 파싱·스키마·교차 참조를 검증하는 읽기 전용 dry-run |
| `npm run seed:apply` | 검증 후 Supabase 테이블을 upsert. `.env`와 적용 완료된 마이그레이션 필요 |
| `npm run build` | 본배포 빌드 생성 (`.next/`) |
| `npm run start` | `npm run build` 결과를 프로덕션 모드로 실행 |
| `npm run demo:data` | `content/*.csv`에서 `src/lib/demo/data/` 생성 파일을 다시 씀 |
| `npm run build:static` | 데모 데이터를 다시 만들고 정적 사이트를 `out/`에 생성한 뒤 데모용 `.next/`를 삭제 |
| `npm run birth:photos` | 누락된 탄생화 사진을 `public/birth/`에 다운로드. `-- --force`는 기존 파일도 다시 받음 |

포트를 직접 정리할 때는 다음처럼 범위를 지정할 수 있습니다. `-Any`는 Node가 아닌 점유 프로세스까지 종료하므로 마지막 수단으로만 사용합니다.

```powershell
npm.cmd run stop
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop.ps1 -Ports 3000,3400
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\stop.ps1 -Any
```

## 화면 경로

| 주소 | 기능 |
|---|---|
| `/` | 오늘의 꽃, 이야기 기반 소개, 오늘의 탄생화, 화면 빛깔 선택 |
| `/recommend` | 다섯 단계 입력을 바탕으로 꽃 3안과 선택 이유·멘트 제안 |
| `/groups` | 여러 사람에게 각각 추천하거나 모두에게 안전한 한 다발 추천 |
| `/flowers` | 꽃 59종 도감, 이름 검색, 366일 탄생화 찾기, 사진·세밀화·문학 상세 |
| `/flowers/[slug]` | 꽃 한 종의 상세 페이지 |
| `/stories` | 꽃 이야기 438편 검색 및 테마·계열·분위기 필터 |
| `/letter` | 같은 브라우저에 저장된 비밀 편지를 번호로 열기 |
| `/letter/studio` | 비밀 편지 작성·수정 |
| `/partners` | 함께하는 꽃집과 꽃시장 정보 |

## 콘텐츠와 검증

사람이 검토하는 `content/*.csv`가 콘텐츠의 단일 원본입니다. 현재 기준으로 꽃 59종, 꽃말 305행, 이야기 438편, 문학·범용 인용 77행, 탄생화 366일, 탄생화 이야기 407편을 담고 있습니다. 반려동물 안전성은 꽃 59종의 고양이·강아지 조합을 모두 검증합니다.

숫자와 참조 무결성의 최종 확인은 문서에 적힌 고정값보다 시드 검증 결과를 우선합니다.

```powershell
npm.cmd run seed
```

DB에 실제로 반영하려면 `db/migrations/0001`부터 `0011`까지 순서대로 적용한 뒤 실행합니다.

```powershell
npm.cmd run seed:apply
```

상세한 CSV 편집 규칙과 스키마는 [콘텐츠 가이드](content/README.md)와 [DB 가이드](db/README.md)를 참고하세요.

## 검증 순서

커밋 전에는 CI와 같은 검사를 실행하고, 배포 변경이라면 빌드까지 확인합니다.

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run seed
npm.cmd run build
```

GitHub Actions의 기준은 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)에 있습니다.

## 프로젝트 구조

| 경로 | 내용 |
|---|---|
| `src/app/` | Next.js App Router 페이지와 서버 액션 |
| `src/components/` | 화면별 React 컴포넌트 |
| `src/lib/engine/` | 추천·제외·점수·다양성 로직 |
| `src/lib/data/` | CSV 로더와 앱용 데이터 매핑 |
| `content/` | 콘텐츠 CSV 단일 원본 |
| `db/migrations/` | Supabase/Postgres 마이그레이션 `0001~0011` |
| `db/seed/` | CSV 검증과 Supabase 적재 CLI |
| `public/` | 세밀화와 자체 호스팅 탄생화 사진 |
| `scripts/` | 개발 서버, 정적 데모, 사진 취득, 배포 패키징 도구 |
| `tests/` | 엔진·데이터·컴포넌트 계약 테스트 |
| `docs/` | 제품 스펙, 조사 원장, 감사 기록 |
| `deploy/` | 배포 가이드와 생성된 배포 패키지 위치 |

## 배포

본배포는 GitHub 저장소를 Vercel 또는 Netlify에 연결하는 방식이고, 정적 드롭은 시연용입니다. API 키는 저장소나 zip에 넣지 말고 호스팅 대시보드의 환경변수로 설정하세요.

배포 방식, Supabase 적용 순서, 정적 데모의 차이는 [배포 가이드](deploy/README.md)를 따릅니다.

## 문서

- [디자인·워딩·플로우 스펙](docs/design-spec.md)
- [제품 기획안](docs/기획안_v2.md)
- [실사 이미지 승인·라이선스](docs/image-assets.md)
- [세밀화 승인·라이선스](docs/illustration-assets.md)
- [콘텐츠 CSV 편집 가이드](content/README.md)
- [DB 스키마·마이그레이션 가이드](db/README.md)
- [배포 가이드](deploy/README.md)

## PowerShell 문제 해결

다음 오류는 프로젝트 코드가 아니라 PowerShell이 `npm.cmd` 대신 `npm.ps1`을 선택하면서 발생합니다.

```text
npm.ps1 파일을 로드할 수 없습니다. 이 시스템에서 스크립트를 실행할 수 없습니다.
```

전역 실행 정책을 바꾸지 않아도 됩니다. 같은 명령을 `npm.cmd`로 실행하세요.

```powershell
npm.cmd ci
npm.cmd run dev
```

의존성 실행 파일을 찾지 못한다는 오류가 이어지면 저장소 루트에서 `npm.cmd ci`를 다시 실행해 `node_modules/.bin`을 복구합니다.
