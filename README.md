# dearbloom

꽃말과 그 꽃에 얽힌 이야기로, 지금 이 상황에 건넬 한 송이를 골라 주는 서비스.
상황에 맞는 이야기를 먼저 보여주고, 원하면 같은 꽃의 다른 갈래까지 계속 들려준다.
추천·멘트·편지는 그 이야기를 실제로 쓸 수 있게 만드는 수단이다.

## 바로 실행·종료

```powershell
# 실행 (포트 정리 후 dev 서버 — http://localhost:3000)
.\scripts\dev.ps1

# 또는 그냥
npm run dev          # 종료는 터미널에서 Ctrl+C

# 종료·포트 정리 (터미널을 잃어버렸거나 포트가 남아 있을 때)
npm run stop                          # = .\scripts\stop.ps1 — 3000·3001 의 node 프로세스 트리 종료
.\scripts\stop.ps1 -Ports 3000,3400   # 특정 포트 지정
.\scripts\stop.ps1 -Any               # node 가 아닌 점유 프로세스도 강제 종료
```

`stop.ps1`은 기본적으로 **node 프로세스만** 종료 대상으로 삼는다. 다른 앱이 포트를 쓰고
있으면 건너뛰고 알려주며, 정말 비워야 할 때만 `-Any`를 쓴다.

## 화면 지도

| 주소 | 무엇 | 비고 |
|---|---|---|
| `/` | 오늘의 꽃(제철 우선 결정 로직) + 이야기 기반 소개 멘트 + 오늘의 탄생화 + 화면의 빛깔 선택 | 들어가기 게이트는 세션당 1회 |
| `/recommend` | 다섯 걸음 추천 — 시작 프리셋 8종 · 관계/마음/상황/예산 전부 "직접 쓸게요" 지원 → 3안 + 멘트 3톤 | 멘트는 LLM(키 연결 시)·예문 폴백 |
| `/groups` | 여러 명에게 — 한 사람씩 따로 / 한 다발(전원 안전 교차 확인) | 추천 1번 질문에서도 진입 |
| `/flowers` | 꽃 도감 47종 — 이름 검색·생일 꽃 찾기(탄생화 366일)·상세(사진 갤러리 2~4컷 + 세밀화 + 문학) | |
| `/stories` | 이야기 아카이브 377편 — 검색·꽃말 테마 8칩·계열 5칩·결 필터 | |
| `/letter` | 비밀 편지 — 번호(기본 10자리)로 여는 그 사람만의 페이지, 봉투 3D 연출 | 예시 편지 열어보기 제공 |
| `/partners` | 함께하는 꽃집 — 공공·좋은 취지 실존 큐레이션 + 고속터미널 꽃시장 | |

## 콘텐츠 규모 (전부 출처 검증)

꽃 47종(전종 실사 128컷·PD 세밀화 47판·반려동물 안전성 cat/dog 전수) · 꽃말 246행 ·
이야기 377편(문화권 106종) · 문학 인용 77행(11개 언어권, PD 원문+자체 번역) ·
탄생화 366일(소스 2곳 대조 · 86일이 도감으로 이어진다) — 그 위에 **탄생화 실사 274일분
(자체 호스팅 248장, 전량 PD/CC0/CC BY/CC BY-SA)** 과 **탄생화 이야기 407편(205가지 이름)** 이
붙어 있다. 원장은 `content/*.csv`, 조사 기록은 `docs/*-research*.md`.

## 검증·시드

```powershell
npm run test        # vitest — 엔진·콘텐츠 교차검증·화면 계약 (680+)
npm run seed        # CSV 전수 검증 dry-run (DB 없이)
npm run birth:photos  # 탄생화 실사 248장을 public/birth/ 로 (없는 것만 채운다)
npm run build       # 본배포 빌드 (서버 액션 포함)
npm run build:static  # 정적 드롭 데모 빌드 → out/ (추천·그룹이 브라우저 엔진으로 동작, 멘트는 예문)
```

## 배포

**단일 원본: [`deploy/README.md`](deploy/README.md).** GitHub 리포 연결 → Vercel(권장)
/ Netlify(`netlify.toml` 준비됨). 정적 드롭은 데모용(`scripts/package-deploy.ps1 -Static`).
API 키는 리포·zip 에 절대 들어가지 않는다 — 호스팅 환경변수로만.

- **LLM 멘트**: `.env`에 `GEMINI_API_KEY`(1차) — CLOVA·NVIDIA 폴백 체인, 키가 없으면 예문.
- **Supabase**: 마이그레이션 `db/migrations/0001~0011` + `npm run seed -- --apply` 로 즉시 적재
  가능(코드 준비 완료 — [`db/README.md`](db/README.md)).

## 문서 지도

- `docs/design-spec.md` — 디자인·워딩·플로우의 **단일 스펙**(§1.4 팔레트 / §1.5 기능 / §1.6b 컨트롤)
- `docs/기획안_v2.md` — 본질 정의(꽃말+이야기)와 제품 원칙
- `docs/image-assets.md` · `docs/illustration-assets.md` — 실사·도판 승인 목록과 라이선스 규정
- `docs/*-research*.md` — 이야기·문학·탄생화·파트너 조사 원장
- `design/index.html` — 초기 시안 이력(확정: v3 나이트 보태니컬 아카이브)
