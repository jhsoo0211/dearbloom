# dearbloom

관계와 상황을 입력하면 꽃·꽃말·함께 줄 선물·메시지까지 한 번에 추천하는 관계형 선물 컨시어지.

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
