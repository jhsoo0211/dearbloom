# dearbloom

꽃말과 그 꽃에 얽힌 이야기로, 지금 이 상황에 건넬 한 송이를 골라 주는 서비스.
상황에 맞는 이야기를 먼저 보여주고, 원하면 같은 꽃의 다른 갈래까지 계속 들려준다. 추천·멘트·선물은 그 이야기를 실제로 쓸 수 있게 만드는 수단이다.

## 바로 실행·종료

```powershell
# 실행 (포트 정리 후 dev 서버 — http://localhost:3000)
.\scripts\dev.ps1

# 또는 그냥
npm run dev          # 종료는 터미널에서 Ctrl+C

# 종료·포트 정리 (터미널을 잃어버렸거나 포트가 남아 있을 때)
npm run stop         # = .\scripts\stop.ps1  — 3000·3001 LISTEN 중인 node 프로세스 트리 종료
.\scripts\stop.ps1 -Ports 3000,3005   # 특정 포트 지정
.\scripts\stop.ps1 -Any               # node 가 아닌 점유 프로세스도 강제 종료
```

`stop.ps1`은 기본적으로 **node 프로세스만** 종료 대상으로 삼는다. 다른 앱이 포트를 쓰고 있으면 건너뛰고 알려주며, 정말 비워야 할 때만 `-Any`를 쓴다.

## 시안 보기

서버 없이 본다 — `design\index.html`을 브라우저로 열면 전체 시안 비교 관문, 각 폴더의 `home.html`부터 화면 이동.

**확정 방향은 v3**(나이트 보태니컬 아카이브 — 실사 + 꽃-테마 5종 + 스크롤 룸)이다. 이전 시안(A/B/C → v2 로즈 → v2-green)은 이력으로만 남긴다.

| 확정본 | 경로 |
|---|---|
| 웹 랜딩 v3 | `design\landing-v3\home.html` |
| 파트너 페이지 | `design\landing-v3\partners.html` |
| 앱 v3 (모바일) | `design\app-v3\home.html` · `question.html` · `result.html` · `group.html` |

## 문서

| 문서 | 내용 |
|---|---|
| **`docs\기획안_v2.md`** | **먼저 읽을 것.** 본질 정의·UX·콘텐츠 전략·디자인·아키텍처 현황·로드맵·KPI 통합 |
| `docs\design-spec.md` | 화면 단위 스펙 단일 소스. 무드 피벗(§1.4b), 꽃-테마(§1.4c), 모드 4종(§1.5c), **이야기 톤 워딩(§1.5d)**, 명언 절제(§1.5e), **이야기 수집 원칙(§1.5f)** |
| `docs\image-assets.md` | 실사 이미지 **승인 목록** — 여기 없는 이미지는 쓰지 않는다 |
| `docs\awwwards-refs.md` | 레퍼런스 16선과 적용 우선순위 |
| `docs\story-research.md` | 꽃별 설화·이야기 리서치 결과 |
| `docs\꽃선물서비스_구현계획_v1.md` | 원 기획 — 8주 로드맵·스택·구현 주의사항 12 (여전히 유효한 기반) |
| `docs\flower_gift_platform_deep_research_2026-08-14.md` | 원 딥리서치 |
| `design-system\dearbloom\MASTER.md` | 팔레트·모션 다이얼 |

## 개발

- `npm run dev` — 개발 서버
- `npm run test` — Vitest (tests/, 현재 6파일 88케이스 통과)
- `npm run typecheck` — tsc --noEmit
- `npm run seed` — content/*.csv 검증 (dry-run, DB 미연결). zod 스키마 + 교차 검증 3종
- `npm run seed:apply` — DB upsert (Supabase env 필요)

## 컨벤션

- `content/*.csv`는 UTF-8(BOM 없음)·LF, 배열 값은 `|` 구분. 파일 생성은 에이전트 Write 도구 또는 Node로만 (Excel/PowerShell 저장 금지 — 인코딩 오염). 상세는 `content\README.md`
- 규칙 엔진(`src/lib/engine`)은 순수 함수 — Next/DB/fetch import 금지
- DB 마이그레이션은 순번대로 수동 적용(`db\README.md`). CSV 컬럼명 ↔ DB 컬럼명은 1:1 snake_case
- **사실은 DB, LLM은 화법만.** 꽃말·안전·명언을 모델이 지어내게 하지 않는다
- **이야기·워딩 원칙**: 화면 어휘는 "출처·검수"가 아니라 이야기 톤 — `docs\design-spec.md` §1.5d. 창작 이야기(`story_type=original`)는 라벨 필수 — §1.5f. 데이터 레이어(`source_url`·`confidence_level`)는 그대로 둔다
- 안전 문구(반려동물·향)만은 직설을 유지한다
