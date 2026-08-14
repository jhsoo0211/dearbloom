# content/ — 콘텐츠 CSV 원본

DearBloom의 꽃 데이터는 사람이 검토·편집하는 CSV를 단일 원본으로 삼는다.
DB는 이 CSV에서 시드(upsert)될 뿐, 반대로 DB를 직접 고치지 않는다.

## 파일 목록

| 파일 | 내용 | 현재 행 수 |
|---|---|---|
| `flowers.csv` | 꽃 기본 정보 | 17 |
| `meanings.csv` | 꽃말(출처 필수) | 86 |
| `stories.csv` | 꽃에 얽힌 일화(창작 외 출처 필수) | 89 |
| `rules.csv` | 상황 → 꽃 추천/회피 규칙 | 7 |
| `templates.csv` | 메시지 템플릿 | 3 |
| `quotes.csv` | 인용문 | 3 |
| `pet_safety.csv` | 반려동물 안전성(꽃 × cat/dog 전수) | 34 |

`rules.csv` 는 5종(`rose-red` `tulip-white` `freesia` `lily-asiatic` `gerbera`)만 다룬다.
2026-08-14에 들어온 4종(`anemone` `hellebore` `hyacinth` `peony`)과 2026-08-15에 들어온 8종
(`hydrangea` `lavender` `sunflower` `carnation` `lisianthus` `ranunculus` `lily-of-the-valley`
`chrysanthemum`)은 **이야기·도감용으로 먼저 존재**하며, 추천 규칙은 편집 판단이 끝난 뒤에 붙인다.
규칙이 없는 꽃은 추천 결과에 오르지 않을 뿐 교차 검증에는 걸리지 않는다(반려동물 판정만 전수로
필요하다).

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
- **실자료 조사로 들어온 행은 조사 회차별 접두사를 쓴다.** 접두사로 "검토 전 샘플"과 "출처를 직접
  열어 본 행"을 구분하고, 어느 조사에서 들어온 행인지도 함께 남긴다.
  - `seed-v2:` — `meanings.csv` 39행 (2026-08-15 꽃말 조사, `docs/meanings-research.md`)
  - `seed-v3:` — 신규 꽃 8종 확장 (2026-08-15, `docs/catalog-expansion-research.md`).
    `flowers.csv` 8행 + 색상 정합으로 갱신한 `rose-red`·`tulip-white` 2행,
    `meanings.csv` 27행, `stories.csv` 28행이 여기 해당한다.
    (`pet_safety.csv` 는 메모 컬럼이 없어 16행이 접두사 없이 들어가 있다.)

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

### `meanings.csv` — 꽃말

한 꽃에 여러 꽃말을 붙인다. **색(`color`) × 문화권(`culture_region`) × 시대(`era`)** 로 한 행씩
쌓는 것이 기본이고, 같은 꽃의 상반된 해석은 지우지 말고 나란히 싣는다(design-spec §1.5f).
어디까지 확인된 해석인지는 `confidence_level` 로 말한다. `caution_note` 는 "이 색·이 뜻은
오해될 수 있어요" 를 알리는 자리다.

- `color` 는 `flowers.csv` 의 `colors` 와 같은 영문 slug 를 쓰되, **비워 두면 "색과 무관한 꽃말"**
  이라는 뜻이다(문화권 해석·유래 등). 자리표시자를 넣지 않는다.
- `flowers.colors` 에 없는 색의 꽃말도 실을 수 있다(자료가 먼저 앞서갈 수 있다).
  다만 색 선택 UI 는 `flowers.colors` 를 기준으로 그리므로, 그런 행은 `editorial_note` 에
  그 사실을 남긴다. **2026-08-15 (seed-v3) 에 어긋난 행 4건을 해소했다** — `tulip-white` 의
  `colors` 에 `cream|yellow|red|variegated|pink|purple` 을, `rose-red` 에 `yellow|white` 를 더했다.
  현재 어긋나는 행은 없다.
- **출처가 확실치 않은 공공 자료는 단어만 참조하고 문장은 직접 쓴다.** 국립원예특작과학원
  꽃말사전 유래 행은 `source_id` 를 `nihhs-*` 로 통일해 두었다(공공누리 유형 미확정 —
  근거와 판단은 `docs/meanings-research.md` §2).
- 조사 경위·열람 URL·제외 판단의 단일 원본은 회차별로 나뉜다:
  **`docs/meanings-research.md`**(seed-v2, 기존 9종) ·
  **`docs/catalog-expansion-research.md`**(seed-v3, 신규 8종 + 색상 정합 + 독성 등급 근거).

### `stories.csv` — 꽃에 얽힌 일화

한 꽃에 여러 이야기를 붙일 수 있다(문화권·시대별로 한 행씩). 꽃말과 같은 원칙을 따른다:
`source_url` 이 없으면 **시드 실패**이고(단 `story_type = original` 만 면제 — 아래 참조),
어디까지 확인된 이야기인지는 `confidence_level`
(`repeated` / `varies` / `single_source`)로 말한다. 본문(`story_ko`)은 3~4문장 한국어로 쓰되
단정하지 말고 "~라는 설이 유력해요 / 전해져요" 처럼 확인된 만큼만 말한다. 출처가 다루는 대상이
그 꽃과 미묘하게 다르면(예: 마돈나 백합 이야기를 아시아틱 백합에 붙일 때) 본문에서 그 사실을
밝히고 `editorial_note` 에도 남긴다. `culture_region` 은 `turkey`, `netherlands`, `korea`,
`uk`, `western`, `greece-rome` 처럼 소문자 slug 로 적고, `flower_id` 는 반드시
`flowers.csv` 의 `id` 중 하나여야 한다(교차 검증이 막는다).
조사 경위·열람 URL·제외 판단은 **`docs/story-research.md`**(기존 9종)와
**`docs/catalog-expansion-research.md`**(seed-v3, 신규 8종 + 농사로 작약 설화 2편)에 남긴다.

#### `story_type` — 이야기의 갈래, 그리고 출처 면제

design-spec §1.5f. 네 값만 쓴다.

| 값 | 뜻 | 출처 |
|---|---|---|
| `folklore` | 설화·전승·신화 | 필수 |
| `history` | 기록으로 확인되는 역사·사실 | 필수 |
| `literary` | 특정 문학 작품에서 온 이야기 | 필수 |
| `original` | **dearbloom 창작** | **면제** |

- **`original` 은 화면에 "dearbloom이 지어 본 이야기예요" 라벨이 필수다.** 창작을 사실처럼
  보이게 하지 않는 것이 유일한 금지선이라, 출처 면제와 라벨은 한 세트로 움직인다.
- 그래서 `original` 이 아닌 행에 `source_url` 이 비면 시드가 실패한다(`db/seed/schemas.ts`).
  DB에도 같은 규칙이 있다: `0006_story_type.sql` 의 `flower_stories_source_required` CHECK.
- 실존 인물·실존 브랜드를 소재로 한 `original` 은 쓰지 않는다(명예·권리). 신화 인물,
  역사 인물의 기록된 일화는 `folklore` / `history` 로 실으면 된다.
- 사실이되 신화도 문학도 아닌 이야기(현대의 재배·유통·과학 이야기 등)는 `history` 로 넣는다.
  네 갈래에서 "출처가 있는 논픽션" 자리는 `history` 하나뿐이다.

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
  **유일한 예외가 `story_type = original`**(dearbloom 창작)이고, 그 대신 화면 창작 라벨이 붙는다.
- `stories.story_type` 은 필수다. 비어 있거나 네 값 밖이면 시드 실패.
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
| `stories.story_type` | `folklore` `history` `literary` `original` |

`stories.intents` 는 위 `intent` 어휘를 그대로 쓰되 파이프로 여러 개를 적을 수 있다.

`flowers.aesthetic_tags` 는 페르소나(받는 사람의 분위기) 태그와 같은 어휘를 쓴다:
`calm`(차분한) `vivid`(화려한) `cute`(귀여운) `elegant`(우아한) `minimal`(미니멀).
스키마 enum 이 아니라 편집 규칙이지만, 추천 엔진이 이 태그와 사용자가 고른 분위기를 맞대 보므로
어휘를 벗어나면 그 꽃은 페르소나 점수를 영영 못 받는다. 한국어 라벨 ↔ slug 대응은
`src/lib/engine/normalize.ts` 의 `TRAIT_LABELS` 가 단일 원본이다.

`flower_id` 는 `flowers.csv` 의 `id` 를 그대로 참조한다. 현재 17종: `rose-red`, `tulip-white`,
`freesia`, `lily-asiatic`, `gerbera`, `anemone`, `hellebore`, `hyacinth`, `peony`,
`hydrangea`, `lavender`, `sunflower`, `carnation`, `lisianthus`, `ranunculus`,
`lily-of-the-valley`, `chrysanthemum`.
