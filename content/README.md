# content/ — 콘텐츠 CSV 원본

DearBloom의 꽃 데이터는 사람이 검토·편집하는 CSV를 단일 원본으로 삼는다.
DB는 이 CSV에서 시드(upsert)될 뿐, 반대로 DB를 직접 고치지 않는다.

## 파일 목록

| 파일 | 내용 | 현재 행 수 |
|---|---|---|
| `flowers.csv` | 꽃 기본 정보 | 5 |
| `meanings.csv` | 꽃말(출처 필수) | 7 |
| `rules.csv` | 상황 → 꽃 추천/회피 규칙 | 6 |
| `templates.csv` | 메시지 템플릿 | 3 |
| `quotes.csv` | 인용문 | 3 |
| `pet_safety.csv` | 반려동물 안전성(꽃 × cat/dog 전수) | 10 |

## 편집 규칙

- **인코딩: UTF-8 (BOM 없음).** 파서는 BOM이 붙어 있어도 읽지만, 새로 쓸 때는 BOM 없이 저장한다.
- **줄바꿈: LF.** (`.gitattributes`가 `*.csv text eol=lf`로 강제한다.)
- **배열 값은 파이프 `|` 로 구분한다.** 예: `red|pink`, `5|6|7|8`. 공백은 자동으로 잘린다.
- **날짜는 `YYYY-MM-DD`.** 예: `2026-08-14`.
- **불리언은 `true` / `false`** 소문자 문자열.
- **빈 값은 그냥 비워 둔다.** `-`, `N/A`, `null` 같은 자리표시자를 쓰지 않는다.
- 쉼표(`,`)가 들어가는 값은 큰따옴표로 감싼다. 값 안의 큰따옴표는 `""`로 이스케이프한다.
- **모든 샘플 행은 `seed-sample` 이라고 표시한다.** `flowers.editorial_note`,
  `meanings.editorial_note`, `rules.note` 에 `seed-sample:` 접두사를 붙인다.
  `templates.csv` / `quotes.csv` / `pet_safety.csv` 에는 메모 컬럼이 없으므로,
  **현재 저장된 전 행이 샘플**이라는 사실을 이 문서로 대신 기록한다.

## 절대 하지 말 것

- **Excel로 열어서 저장하지 말 것.** 한글이 깨지고(cp949) 날짜 컬럼이 임의 포맷으로 바뀐다.
- **PowerShell `Set-Content` / `Out-File` 로 쓰지 말 것.** 기본 인코딩이 ANSI/UTF-16이라 한글이 오염된다.
- 편집은 에디터(UTF-8 지정), 코딩 에이전트의 파일 쓰기 도구, 또는 Node 스크립트로만 한다.

## 검증

```bash
npm run seed          # dry-run: 파싱 → 스키마 검증 → 교차 검증 → 리포트 (쓰기 없음)
npm run seed:apply    # 실제 upsert (Supabase 환경변수 필요)
```

`npm run seed` 는 오류가 하나라도 있으면 exit 1 로 끝난다. CI와 동일한 기준이다.

검증 규칙의 단일 원본은 `db/seed/schemas.ts` 다. 컬럼을 추가·변경하면 스키마를 먼저 고친다.

### 특히 자주 걸리는 규칙

- `meanings.source_url` 이 비면 **시드 실패**. 출처 없는 꽃말은 싣지 않는다.
- `rules` 의 `fit_score`(0~100) 와 `avoid_reason` 은 **정확히 하나만** 채운다.
  추천 규칙이면 점수를, 회피 규칙이면 이유를 쓴다.
- `quotes.license = pd` 이면 `source_url` 필수(퍼블릭 도메인 근거).
- `pet_safety` 는 **모든 꽃 × `cat`/`dog` 두 행이 전부** 있어야 한다. 하나라도 빠지면 실패한다.
- `pet_safety.toxic = true` 이면 `toxic_parts` 와 `safe_alternative_flower_ids` 가 필수다.

## 공유 어휘

아래 값 외에는 쓰지 않는다. (`db/seed/schemas.ts` 의 enum과 동일)

| 항목 | 허용 값 |
|---|---|
| `relationship_type` | `lover` `spouse` `crush` `friend` `family` `colleague` |
| `intent` | `apology` `confession` `gratitude` `celebration` `comfort` `anniversary` `just_because` |
| `tone` | `plain` `sincere` `romantic` `playful` |
| `length` | `short` `medium` |
| `species` | `cat` `dog` |
| `severity` | `none` `mild_gi` `serious` `life_threatening` |
| `confidence_level` | `repeated` `varies` `single_source` |
| `quotes.license` | `pd` `original` |

`flower_id` 는 `flowers.csv` 의 `id` 를 그대로 참조한다. 현재: `rose-red`, `tulip-white`,
`freesia`, `lily-asiatic`, `gerbera`.
