# content/ — 콘텐츠 CSV 원본

DearBloom의 꽃 데이터는 사람이 검토·편집하는 CSV를 단일 원본으로 삼는다.
DB는 이 CSV에서 시드(upsert)될 뿐, 반대로 DB를 직접 고치지 않는다.

## 파일 목록

| 파일 | 내용 | 현재 행 수 |
|---|---|---|
| `flowers.csv` | 꽃 기본 정보 | 5 |
| `meanings.csv` | 꽃말(출처 필수) | 11 |
| `stories.csv` | 꽃에 얽힌 일화(출처 필수) | 5 |
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
  `meanings.editorial_note`, `stories.editorial_note`, `rules.note` 에 `seed-sample:` 접두사를 붙인다.
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

### `stories.csv` — 꽃에 얽힌 일화

한 꽃에 여러 이야기를 붙일 수 있다(문화권·시대별로 한 행씩). 꽃말과 같은 원칙을 따른다:
`source_url` 이 없으면 **시드 실패**이고, 어디까지 확인된 이야기인지는 `confidence_level`
(`repeated` / `varies` / `single_source`)로 말한다. 본문(`story_ko`)은 3~4문장 한국어로 쓰되
단정하지 말고 "~라는 설이 유력해요 / 전해져요" 처럼 확인된 만큼만 말한다. 출처가 다루는 대상이
그 꽃과 미묘하게 다르면(예: 마돈나 백합 이야기를 아시아틱 백합에 붙일 때) 본문에서 그 사실을
밝히고 `editorial_note` 에도 남긴다. `culture_region` 은 `turkey`, `netherlands`, `korea`,
`uk`, `western`, `greece-rome` 처럼 소문자 slug 로 적고, `flower_id` 는 반드시
`flowers.csv` 의 `id` 중 하나여야 한다(교차 검증이 막는다).

#### 선별 태그 — `moods` / `intents` / `hook`

한 꽃에 이야기가 여러 편 쌓이면 "무엇을 먼저 보여 줄까"가 문제가 된다.
그 순서를 정하는 것이 이 세 컬럼이고, 실제로 고르는 쪽은
`src/lib/engine/stories.ts` 의 `pickStories()` 다.

| 컬럼 | 필수 | 뜻 |
|---|---|---|
| `moods` | **필수(최소 1개)** | 이야기의 결. 파이프 구분. **첫 값이 대표 분위기**이며 목록의 다양성 기준이 된다. |
| `intents` | 선택 | 이 이야기가 특히 어울리는 상황. **비워 두면 "모든 상황"** 이라는 뜻이다. |
| `hook` | 선택 | 목록에서 본문보다 먼저 보여 줄 한 줄. 예: `알뿌리 하나가 집 한 채 값이던 시절이 있었어요.` |

- `intents` 를 비우는 것과 채우는 것은 뜻이 다르다. 비우면 어떤 상황에서든 후보로 남고,
  채우면 그 상황에서 **1순위로 올라가는 대신** 다른 상황에서는 대표 자리를 양보한다.
  "아직 안 정했다"는 뜻으로 아무 값이나 넣지 말고 그냥 비워 둔다.
- `moods` 를 여러 개 적을 때는 **가장 대표적인 결을 맨 앞에** 둔다. 목록이 같은 결로
  줄줄이 이어지지 않게 하는 판단이 첫 값만 본다.
- 상황 태그가 없을 때 대신 쓰는 상황↔결 대응은 `MOOD_AFFINITY`(같은 파일)가 단일 원본이다.
  현재: `apology`→healing·tragic / `confession`→romantic / `gratitude`→healing·mythic /
  `celebration`→funny·dramatic / `comfort`→healing / `anniversary`→romantic·mythic /
  `just_because`→funny·mythic.

### 특히 자주 걸리는 규칙

- `meanings.source_url` 이 비면 **시드 실패**. 출처 없는 꽃말은 싣지 않는다.
- `stories.source_url` 도 마찬가지로 필수다. 출처 없는 일화는 싣지 않는다.
- `stories.moods` 는 최소 1개 필수다. 빈 값이면 시드 실패.
  (`stories.intents` 는 반대로 비워 두는 것이 "모든 상황"이라는 정상 값이다.)
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
| `stories.moods` | `romantic` `tragic` `funny` `mythic` `dramatic` `healing` |

`stories.intents` 는 위 `intent` 어휘를 그대로 쓰되 파이프로 여러 개를 적을 수 있다.

`flowers.aesthetic_tags` 는 페르소나(받는 사람의 분위기) 태그와 같은 어휘를 쓴다:
`calm`(차분한) `vivid`(화려한) `cute`(귀여운) `elegant`(우아한) `minimal`(미니멀).
스키마 enum 이 아니라 편집 규칙이지만, 추천 엔진이 이 태그와 사용자가 고른 분위기를 맞대 보므로
어휘를 벗어나면 그 꽃은 페르소나 점수를 영영 못 받는다. 한국어 라벨 ↔ slug 대응은
`src/lib/engine/normalize.ts` 의 `TRAIT_LABELS` 가 단일 원본이다.

`flower_id` 는 `flowers.csv` 의 `id` 를 그대로 참조한다. 현재: `rose-red`, `tulip-white`,
`freesia`, `lily-asiatic`, `gerbera`.
