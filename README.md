# dearbloom

관계와 상황을 입력하면 꽃·꽃말·함께 줄 선물·메시지까지 한 번에 추천하는 관계형 선물 컨시어지.

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

디자인 시안은 서버 없이 본다: `design\index.html`을 브라우저로 열면 전체 시안 비교, 각 폴더의 `home.html`부터 화면 이동.

## 개발

- `npm run dev` — 개발 서버
- `npm run test` — Vitest (tests/)
- `npm run typecheck` — tsc --noEmit
- `npm run seed` — content/*.csv 검증 (dry-run, DB 미연결)
- `npm run seed:apply` — DB upsert (Supabase env 필요)

## 컨벤션

- `content/*.csv`는 UTF-8, 배열 값은 `|` 구분. 파일 생성은 에이전트 Write 도구 또는 Node로만 (Excel/PowerShell 저장 금지 — 인코딩 오염)
- 규칙 엔진(`src/lib/engine`)은 순수 함수 — Next/DB/fetch import 금지
- 문서: `docs/` (구현계획 v1, 딥리서치)
