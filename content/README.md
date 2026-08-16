# content/ — 콘텐츠 CSV 원본

DearBloom의 꽃 데이터는 사람이 검토·편집하는 CSV를 단일 원본으로 삼는다.
DB는 이 CSV에서 시드(upsert)될 뿐, 반대로 DB를 직접 고치지 않는다.

## 파일 목록

| 파일 | 내용 | 현재 행 수 |
|---|---|---|
| `flowers.csv` | 꽃 기본 정보 | 47 |
| `meanings.csv` | 꽃말(출처 필수) | 246 |
| `stories.csv` | 꽃에 얽힌 일화(창작 외 출처 필수) | 377 |
| `rules.csv` | 상황 → 꽃 추천/회피 규칙 | 7 |
| `templates.csv` | 메시지 템플릿 | 31 |
| `quotes.csv` | 인용문(범용 3 + 문학 발췌 74) | 77 |
| `pet_safety.csv` | 반려동물 안전성(꽃 × cat/dog 전수) | 94 |
| `birth_flowers.csv` | 날짜별 탄생화(윤년 366일 달력) | 366 |
| `birth_photos.csv` | 탄생화의 실사 한 장(확보 274 · 미확보 6) | 280 |
| `birth_stories.csv` | 탄생화 **이름**에 붙는 이야기 | 407 |

**열 파일 모두 `db/seed/schemas.ts` 의 `SEED_FILE_KEYS` 에 등록돼 있고**, 시드 CLI와 앱
로더(`src/lib/data/catalog.ts`)가 같은 목록을 읽는다. 파일을 늘릴 때는 그 상수부터 고친다.

`rules.csv` 는 5종(`rose-red` `tulip-white` `freesia` `lily-asiatic` `gerbera`)만 다룬다.
2026-08-14에 들어온 4종(`anemone` `hellebore` `hyacinth` `peony`), 2026-08-15에 들어온 8종
(`hydrangea` `lavender` `sunflower` `carnation` `lisianthus` `ranunculus` `lily-of-the-valley`
`chrysanthemum`), 같은 날 seed-v4로 들어온 14종(`narcissus` `forget-me-not` `cherry-blossom`
`camellia` `violet` `iris` `marigold` `corn-poppy` `jasmine` `babys-breath` `cosmos` `magnolia`
`pansy` `poinsettia`), seed-v5의 `daisy`, 2026-08-16에 seed-v6로 들어온 15종(`sweet-pea`
`gladiolus` `dahlia` `zinnia` `aster` `calendula` `cyclamen` `geranium` `primula` `stock`
`delphinium` `amaryllis` `cornflower` `crocus` `water-lily`) 은 **이야기·도감용으로 먼저 존재**하며,
추천 규칙은 편집 판단이 끝난 뒤에 붙인다. 규칙이 없는 꽃은 추천 결과에 오르지 않을 뿐 교차 검증에는
걸리지 않는다(반려동물 판정만 전수로 필요하다). **47종 중 5종만 추천 결과에 오른다** — 카탈로그가
커질수록 이 불균형이 커진다.

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
  - `seed-v4:` — 신규 꽃 14종 + 이야기 107편 (2026-08-15).
    `flowers.csv` 14행, `meanings.csv` 52행, `pet_safety.csv` 28행(메모 컬럼 없음),
    `stories.csv` 107행이 여기 해당한다. 이야기 107편은 출처가 둘로 나뉜다 —
    **신규 14종 60편**(`docs/catalog-expansion-2-research.md`)과
    **기존 17종 심화 47편**(`docs/story-research-2.md`). 후자는 메모에 문서 안 번호를
    `#47` 처럼 함께 남겨 두었다.
  - `seed-v5:` — 한국 인기 절화 11종 심화 (2026-08-15, `docs/story-research-3.md`).
    `stories.csv` 54행 + `meanings.csv` 35행. 메모에 문서 안 번호(`#7`)를 남겼고,
    문서 §9(명예·정확성 프레이밍)가 걸린 행은 메모에 `/ §9: …` 로 **권장 프레이밍을 그대로
    옮겨 두었다** — 본문을 고칠 때 그 제약을 먼저 읽으라는 뜻이다.
    같은 회차에 `stories.csv` 에 `source_kind` 컬럼이 생겼고, **기존 196행은 `source_url`
    도메인으로 일괄 소급 분류**했다(아래 참조).
    문서가 넘긴 55편 중 **1편은 싣지 않았다** — `story-carnation-korea-paper-flower`
    (스승의 날 카네이션에 대한 청탁금지법 유권해석). 권익위 지침이 이후 바뀌었을 수 있어
    **재확인 전까지 보류**다(문서 §9-1·§10-1). 지침을 다시 확인하면 문서 표 그대로 넣으면 된다.
    같은 회차에 `flowers.csv` 에 `daisy` 1행이 들어왔고, 학명 감사 메모가 기존 6행
    (`lisianthus` `chrysanthemum` `iris` `marigold` `jasmine` `magnolia`)에 덧붙었다.
  - `seed-v6:` — **접두사 하나가 두 회차를 가리킨다.** 파일을 보고 갈라 읽어야 한다.
    - `stories.csv` 67행(250 → 317) — 해외 이야기 대폭 확장 (2026-08-15,
      `docs/story-research-4.md`). 켈트·북유럽·발트·슬라브·페르시아·중남미 등
      **신규 문화권 값 22종**이 이 회차에 들어왔고, 위키 출처는 67편 중 1편(1.5%)이다.
    - `flowers.csv` 15행 · `meanings.csv` 73행 · `pet_safety.csv` 30행(메모 컬럼 없음)
      — **정식 도감 확장 배치 1**, 신규 꽃 15종 (2026-08-16). 카탈로그가 32 → 47종이 됐다.
      이 15종은 **한국어 이름이 다른 식물과 겹치는 무리**라(백일홍↔배롱나무, 금잔화↔마리골드,
      과꽃↔개미취, 아마릴리스↔히페아스트룸, 제라늄↔펠라고늄, 수련↔연꽃, 크로커스↔사프란,
      스토크↔비단향꽃무) 기준 종을 어떻게 잡았는지가 전부 `flowers.editorial_note` 에 있다.
      **그 함정은 코드에도 옮겨져 있다** — `src/lib/engine/infer.ts` 의 `FLOWER_KEYWORDS` 가
      겹치는 쪽 이름을 일부러 빼 둔다.
  - `seed-v7:` — 신규 15종 이야기 60편 (2026-08-16, `docs/story-research-5.md`).
    `stories.csv` 60행(317 → 377). **15종 × 정확히 4편**으로 편차가 없고, 위키 출처는
    60편 중 1편(1.7%)이다. 접두사를 `seed-v6` 에서 한 칸 올린 이유가 바로 위 항목이다 —
    꽃·꽃말과 이야기가 같은 배치의 다른 조사라, 같은 번호를 나눠 쓰면 어느 조사에서 온
    행인지 파일 없이는 알 수 없게 된다.
  - `birth-v1:` — 날짜별 탄생화 366일 (2026-08-16, `docs/birth-flowers-research.md`).
    `birth_flowers.csv` 전 행. 다른 회차와 달리 **파일 하나가 통째로 이 회차**라, 메모는
    두 표가 갈리는 지점(표기 차이·꽃말 차이·철자 교정)에만 158행 붙어 있다.

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
  **`docs/catalog-expansion-research.md`**(seed-v3, 신규 8종 + 색상 정합 + 독성 등급 근거) ·
  **`docs/catalog-expansion-2-research.md`**(seed-v4, 신규 14종 + 독성 등급 근거).
- 조사 문서는 Greenaway(1884)·Dumont(1851) 행의 문화권을 `victorian` 이라 적지만, CSV 는
  그 값을 **시대(`era`)** 로 쓰고 `culture_region` 은 `uk` 로 둔다. seed-v4 적재 때 이 어휘로 맞췄다.
- `colors` 는 `labels.ts` 의 색 어휘 안에서만 쓴다. seed-v4 조사 문서의 `rose`·`lilac`·`bronze`·
  `mahogany` 는 어휘 밖이라 가장 가까운 값(`pink`·`purple`·`brown`)으로 옮기고 그 사실을
  해당 꽃의 `editorial_note` 에 남겼다. 어휘 밖 색을 넣으면 화면에 영문 slug 가 그대로 샌다.

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
조사 경위·열람 URL·제외 판단은 **`docs/story-research.md`**(기존 9종),
**`docs/catalog-expansion-research.md`**(seed-v3, 신규 8종 + 농사로 작약 설화 2편),
**`docs/catalog-expansion-2-research.md`**(seed-v4, 신규 14종 60편),
**`docs/story-research-2.md`**(seed-v4, 기존 17종 심화 47편),
**`docs/story-research-3.md`**(seed-v5, 한국 인기 절화 11종 심화 54편),
**`docs/story-research-4.md`**(seed-v6, 해외 이야기 확장 67편),
**`docs/story-research-5.md`**(seed-v7, 신규 15종 60편)에 남긴다.

`culture_region` · `era` 는 **`src/components/flow/labels.ts` 가 한국어 라벨을 갖고 있는 값만**
쓴다. 라벨이 없으면 문화권은 화면에 영문 slug 가 그대로 나오고, 시대는 통째로 감춰진다.
세기 구간은 양쪽 모두에 `c` 를 붙여 `19c-20c` 로 적는다(`19-20c` 로 적으면 라벨이 사라진다).
기원전은 `26c-bc` 형식이다.

**함께 판단해야 하는 짝**은 아직 컬럼이 없어 `editorial_note` 에 `pair:<상대 story_id>` 로만
적어 둔다(seed-v4 6쌍). 같은 반전이 두 번 나오거나 정서가 충돌하는 조합이라, 노출 로직이
생기면 이 메모를 옮겨 담는다. **2026-08-15 검수에서 양쪽 행에 모두 메모를 넣어 양방향으로
만들었다** — `pair:` 로 검색하면 12행(6쌍 × 2)이 나오고, 어느 쪽을 먼저 집어도 짝을 찾을 수
있다. 다만 **판단 문장은 신규 행 쪽 메모에만 있다**(기존 행에는 `; pair:<id>` 만 붙였다).
6쌍이 모두 "동시 노출 금지"는 아니다 — `story-hyacinth-2000-from-one`↔`story-hyacinth-bubble-1737`
과 `story-ranunculus-mirror-petals`↔`story-ranunculus-butter-chin` 두 쌍은 **충돌 없음**,
오히려 이어서 보여 주면 좋은 짝이라고 적혀 있다. 나머지 4쌍이 동시 노출 금지다.

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

##### 경계 판단 규칙 (2026-08-15 전수 검수)

196행을 전수 재검토하며 세운 기준이다. 갈래를 가르는 것은 소재의 종류가 아니라
**그 행이 말하는 핵심 주장을 기록으로 확인할 수 있는가** 다.

- 핵심 주장이 기록으로 확인되면 `history`. 명명·어원·도상·과학·산업 이야기가 다 여기 들어오고,
  "유럽에서는 국화를 무덤에만 놓는다" "5월 1일에 은방울꽃을 판다" 처럼 **확인되는 관습**도
  `history` 다. 관습이라는 이유만으로 `folklore` 로 보내지 않는다.
- 핵심 주장이 "전해져요 / 그렇게 믿는다 / 학자들은 지어낸 이야기로 본다" 처럼 **확인 불가한
  전승**이면 `folklore`. 실존 인물이 나와도 마찬가지다 — `story-hydrangea-otaksa`(오타쿠사가
  연인의 애칭이라는 마키노의 추정), `story-rose-heliogabalus`(후대 창작이 많은 『아우구스투스
  역사』의 일화)가 그래서 `folklore` 다.
- 관습 행이 **그 관습을 낳은 믿음을 본문의 중심으로 삼으면** `folklore` 로 남긴다.
  `story-marigold-cempasuchil`(향을 따라 죽은 이가 돌아온다는 믿음)이 그 예다.
- 핵심 주장이 **특정 문학 작품 안에 있으면** `literary`. 신화를 오비디우스가 적었다는 이유만으로
  `literary` 로 올리지 않는다 — 본문 중심이 작품이 아니라 전승이면 `folklore` 다.
  꽃말 사전(그리너웨이 1884 · 뒤몽 1851)은 문학 작품이 아니라 간행 기록이므로 `history` 다.
- 자료가 얼마나 단단한가는 `story_type` 이 아니라 `confidence_level` 이 말한다.
  출처가 약하다고 `folklore` 로 내리지 않는다.

이 기준으로 12행을 재배정했다 — `folklore`→`history` 8행, `history`→`folklore` 2행,
`literary`→`history` 2행. seed-v5 54행(`history` 50 · `literary` 3 · `folklore` 1)까지
더한 당시 분포는 `history` 191 · `folklore` 42 · `literary` 17 · `original` 0 이었고,
seed-v6·seed-v7 127행을 더한 **현재 377행 분포는 `history` 290 · `folklore` 58 ·
`literary` 29 · `original` 0** 이다.

#### `source_kind` — 그 출처가 무엇인가 (2026-08-15 신설)

`confidence_level` 이 **"출처가 몇 개인가"** 라면 이 컬럼은 **"그 하나가 무엇인가"** 다.
둘을 같이 봐야 화면 문구가 정직해진다.

| 값 | 뜻 | 단일 출처일 때 화면 문구 |
|---|---|---|
| `paper` | 학술 논문 | **기록으로 남아 있는 이야기예요** |
| `museum` | 박물관·국가기록원 등 기관 자료 | **기록으로 남아 있는 이야기예요** |
| `book-pd` | 퍼블릭 도메인 고서 원문(Gutenberg·Internet Archive·위키문헌) | **기록으로 남아 있는 이야기예요** |
| `newspaper` | 신문 | **기록으로 남아 있는 이야기예요** |
| `garden` | 식물원·대학 익스텐션·농업/독성 기관 자료 | **기록으로 남아 있는 이야기예요** |
| `magazine` | 잡지·칼럼·블로그 기고 | 드물게 전해지는 이야기예요 |
| `wiki` | 위키·백과사전·정리 사이트 | 드물게 전해지는 이야기예요 |
| `other` | 위 어디에도 넣기 어려운 것 | 드물게 전해지는 이야기예요 |

- **이 컬럼을 만든 이유.** `single_source` 40편 중 **29편(72.5%)** 은 국립원예특작과학원
  연구보고서나 1839년 『보태니컬 매거진』 원문처럼 **출처가 하나일 뿐 단단한** 자료다.
  `confidence_level` 만 보고 라벨을 붙이면 그 29편까지 "드물게 전해지는 이야기예요"(원래
  1차 사료 없는 카더라를 위한 문구)를 달아 우리가 우리 데이터를 깎아내리게 된다.
  화면 분화는 `storyConfidenceLabel()`(`src/components/flow/labels.ts`) 한 곳에서만 한다.
- **필수 컬럼이다.** 비거나 여덟 값 밖이면 시드 실패. `story_type = original`(창작)이라
  출처가 없는 행도 값은 적어야 하며, 그 자리에는 `other` 를 쓴다.
- **애매하면 `other`.** 여덟 값 중 `other`·`wiki`·`magazine` 은 보수적인 쪽(기존 문구)으로
  떨어지므로, 확신이 없을 때 `other` 를 고르면 과장은 절대 일어나지 않는다. 반대로 `paper`·
  `museum` 을 잘못 붙이면 화면이 없는 신뢰를 주장하게 된다 — **의심스러우면 내려 적는다.**
- **기존 196행은 `source_url` 도메인으로 일괄 소급 분류했다**(2026-08-15). 결과는
  `wiki` 160 · `garden` 9 · `magazine` 8 · `other` 8 · `book-pd` 7 · `newspaper` 3 · `paper` 1.
  1·2차 조사가 사실상 위키피디아 단일 소스였다는 사실이 이 숫자로 드러난다.
  seed-v5 54행까지 더한 분포는 `wiki` 164 · `garden` 20 · `newspaper` 17 ·
  `magazine` 14 · `book-pd` 12 · `paper` 11 · `other` 8 · `museum` 4 였고,
  **현재 377행 분포는 `wiki` 166 · `garden` 42 · `magazine` 39 · `newspaper` 35 ·
  `museum` 35 · `book-pd` 22 · `paper` 20 · `other` 18** 이다 — seed-v6·seed-v7 127행에서
  위키가 2편뿐이라 `wiki` 비중이 82% → 44% 로 내려왔다.
- 소급 분류의 판단 근거: 위키피디아·위키낱말사전·상징 정리 사이트 → `wiki` / Gutenberg·
  Internet Archive·위키문헌·PD 고서 전문 사이트 → `book-pd` / ASPCA·NC State Extension·
  SANBI·농사로·홍콩 병원관리국 독성식물도감 → `garden` / PMC·KCI·KoreaScience·ScienceON →
  `paper` / 신문사 도메인 → `newspaper` / 개인·기관 칼럼 블로그 → `magazine` / 나머지 →
  `other`. **도메인 규칙이라 개별 행의 성격과 어긋날 수 있다** — 새 행을 넣을 때는 도메인이
  아니라 그 자료가 실제로 무엇인지를 보고 적는다.

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

### `quotes.csv` — 인용문, 그리고 문학 발췌 (2026-08-15 확장)

한 파일에 성격이 다른 두 종류가 산다. **가르는 것은 `flower_id` 하나뿐이다.**

| 종류 | `flower_id` | 화면 자리 | 현재 |
|---|---|---|---|
| 범용 인용 | 비어 있음 | 결과 화면 `함께 담을 한 줄`(§1.5e) | 3행(`q-001`~`q-003`) |
| 문학 발췌 | 꽃 id | 결과 화면 `문학 속의 이 꽃`(§1.5k) | 74행(`q-lit-*`) |

`flower_id` 가 빈 것은 미완성이 아니라 **꽃을 가리지 않는 인용**이라는 정상 값이다.

문학 발췌 6컬럼 (전부 선택):

| 컬럼 | 뜻 |
|---|---|
| `flower_id` | 이 발췌가 붙는 꽃 |
| `excerpt_type` | `poem` `novel` `play` `essay` `classic` |
| `text_original` | 원어 원문. 화면에 번역과 나란히 소형 병기 |
| `translator` | 자체 번역·자체 현대어 표기이면 `dearbloom`, 한국어 원전 그대로면 공란 |
| `caveat` | **화면에 나가는** 한 줄 각주 |
| `pd_basis` | 퍼블릭 도메인 판정 근거. **데이터 레이어 전용, 화면 비노출** |

`classic` 이 있는 이유: 『시경』·오비디우스 『변신 이야기』·KJV 성경·『이세 이야기』처럼
시·소설·희곡 어느 갈래로도 안 떨어지는 원전이 6건 있다. 억지로 `poem` 이나 `essay` 로
접으면 화면 각주가 거짓이 된다.

#### 금지선 — 원전이 PD여도 남의 번역은 PD가 아니다

> **기존 출판 번역·웹 번역을 어떤 경우에도 옮기지 않는다.**

- 성경 한국어 번역본(개역한글·개역개정·새번역) — 대한성서공회 저작권. ⑥·㉒는 KJV **영문에서 자체 번역**했다.
- 셰익스피어 한국어 번역본 — 역자 저작권 존속. 해당 5행 전부 자체 번역.
- 김정희 〈水仙花〉 — 검색 상위에 뜨는 한국어 풀이는 국립중앙박물관 2006년 간행 번역문이다. 한자 원문에서 새로 옮겼다.

그래서 `translator` 가 사실상 감사 컬럼이다 — **원문이 한국어가 아닌데 옮긴이가 비어
있으면** 남의 번역인지 우리 번역인지 데이터만 보고는 알 수 없다. 그 상태를 만들지
않도록 테스트가 막는다(`tests/seed/schemas.test.ts`).

#### `caveat` — 안 적으면 서비스가 거짓말을 하게 되는 한 줄

각주가 있으면 좋은 정도가 아니라, **없으면 틀린 정보를 주게 되는** 사실만 넣는다.

- `q-lit-camellia-kimyujeong` — 강원 방언의 '동백나무'는 생강나무다. 김유정의 노란 동백꽃은 `Camellia japonica` 가 아니다.
- `q-lit-lotv-songofsongs` — 은방울꽃은 성경 구절에서 **이름만** 건너왔다. 성경 속 그 꽃이 아니다.
- `q-lit-marigold-winterstale` — 셰익스피어의 marigold 는 금잔화(Calendula)이고 카탈로그의 만수국(Tagetes)이 아니다. (`flowers.csv` 가 ASPCA 독성 자료에서 이미 같은 혼동을 기록해 두었다.)
- 그 밖에 종 차이 6건(④⑬⑭㉑㉗㉟㊸)·판본 차이·이름 이전.

#### 원문 표기 규칙 — 출처가 인쇄한 그대로

`text_original` 은 **`source_url` 이 실제로 인쇄한 문자열**이다. 현대 철자로 고치지 않고,
반대로 옛 철자를 지어내지도 않는다. 2026-08-15 전수 재대조에서 이것 때문에 9행을 고쳤다.

- 구텐베르크 블레이크(#1934)는 **현대 철자판**이다 — `Lilly`·`threatning` 이 아니라 `Lily`·`threat'ning`. 원본이 옛 철자라는 사실은 `caveat` 로 옮겼다.
- 밀턴 〈Lycidas〉는 1645년 시집 표기 — `Gessamine`·`Pansie freakt with jeat`.
- 고시문망(gushiwen)은 **간체자** 판본이라 백거이·왕유 두 행은 간체자로 실려 있다.
- 위키문헌 『고금와카집』·『이세 이야기』는 옛 가나 표기(`さくら`·`きつゝ`) 그대로다.
- 다만 **활자 관습**(곡선 어포스트로피 `’` → `'`, 두 하이픈 `--` → `—`)은 정규화한다. 같은 낱말의 다른 글자가 아니라 조판 차이이기 때문이다.

#### 적재 회차

- **1회차 43행** — 2026-08-15, `docs/literature-research.md` §1~§9. 꽃 26/31종 커버.
- **2회차 31행** — 2026-08-15, 같은 문서 §10~§11(외국 문학 확장). 전 행 원문 발췌·자체 번역
  (`translator=dearbloom`)이고 **비영어가 23행(74%)** 이다. `daisy` 3행·`ranunculus` 1행이
  붙어 커버가 **28/32종**으로 올라갔다(1회차의 라넌큘러스 보류 2건과는 다른 후보다).
- 당시 남은 미커버 4종(`freesia` `gerbera` `babys-breath` `poinsettia`)은 근대에 명명돼 고전
  문학에 등장하지 않는다. **편집팀 문장으로 메우지 않는다** — §1.5k 가 "있을 때만"이라고
  이미 정해 두었고, 문학 블록에 문학이 아닌 걸 넣으면 위화감만 남는다.
- **확장 배치 1(seed-v6) 15종에는 문학 발췌가 아직 없다.** 커버는 `28/47종` 이고, 이 파일은
  이번 배치에서 한 행도 늘지 않았다. 같은 원칙이 그대로 적용된다 — 있을 때만 싣는다.

### `birth_flowers.csv` — 날짜별 탄생화 (2026-08-16 신설)

**행의 주인은 꽃이 아니라 날짜다.** 자연키는 `(month, day)` 이고, 366일이 카탈로그 47종보다
훨씬 많은 종을 부른다(반대로 한 종이 여러 날에 걸리기도 한다 — 장미 10일·국화 4일).

| 컬럼 | 필수 | 뜻 |
|---|---|---|
| `month` / `day` | **필수** | 1~12 / 1~31. 자연키. |
| `name_ko` | **필수** | 그 날 표가 부르는 이름. 카탈로그 이름과 달라도 된다(`노랑수선화` ↔ `수선화`). |
| `name_en` | 선택 | 표가 영문명을 적어 둔 날만. |
| `scientific_name` | 선택 | 표가 학명을 적어 둔 날만. `name_en` 과 **둘 중 하나만** 있는 날이 많다. |
| `flower_id` | 선택 | 도감으로 건너가는 **다리**. 비어 있는 것이 정상 값이다. |
| `meaning_ko` | **필수** | 꽃말. DB(`0010_birth_flowers.sql`)는 null 을 허용하지만 CSV 는 막는다. |
| `source_url` | **필수** | 꽃말·일화와 같은 원칙 — 출처 없는 표는 싣지 않는다. |
| `editorial_note` | 선택 | **화면 비노출.** 편집·감사 전용(아래 참조). |

- **366행이다(365가 아니다).** 2월 29일도 실재하는 생일이므로 윤년 달력으로 채운다.
  교차 검증이 **366일 전수 · 중복 0 · 2월 30일 같은 불가능한 조합**을 막는다.
- **`flower_id` 가 빈 것은 미완성이 아니다.** "카탈로그에 그 꽃이 없다"는 뜻이고, 현재
  **86일만 도감으로 이어진다**(카탈로그 47종 중 38종 — 확장 배치 1이 57일·24종에서 늘렸다).
  적혀 있으면 반드시 `flowers.csv`
  안에 있어야 한다(교차 검증이 막는다).
- **`editorial_note` 는 화면에 나가지 않는다.** `quotes.pd_basis` 와 같은 취급이라
  로더(`src/lib/data/catalog.ts`)가 아예 옮기지 않고 타입에도 없다. 현재 158행에 붙어 있는
  메모는 전부 두 표의 대조 기록이다. 사용자에게 알려야 하는 사실(종 차이 등)을 화면에
  내보내려면 `quotes.caveat` 같은 별도 컬럼이 필요하다 — 지금은 없다.
- **`rules.csv` 와 연계하지 않는다.** 탄생화는 추천 엔진과 무관한 별도 축이다.

#### 소스 대조 원칙 — 두 표를 맞대고 고른 대표값

날짜별 탄생화 표는 **출전이 하나로 정해져 있지 않다.** 그래서 널리 도는 두 표(순천만국가정원
365일 · 로얄플라워 366일)를 전 행 맞대어 갈리는 102일을 유형별로 정리하고, 회차 메모에
그 사실을 남긴 뒤 대표값 하나를 골랐다. 채택 기준·불일치 유형·철자 교정 내역·연결 판단의
단일 원본은 **`docs/birth-flowers-research.md`** 다.

> ⚠ **화면 문구 대전제(조사 문서 §2·§8).** 이 표는 **전통적으로 정해진 탄생화가 아니다.**
> 순천만 쪽은 본래 "탄생화를 정한 것이 아닌, 하루에 한 종류씩 꽃을 소개하는 페이지"였고,
> 날짜별 목록의 출전은 어느 백과사전에도 없다. **화면 어디에도 "전통"·"공식"·"예로부터
> 정해진" 류 단정을 쓰지 마라** — "널리 통하는 탄생화 표에서 가져왔어요" 가 정직한 선이다.
> 이 선은 뷰모델 테스트(`tests/components/birth-flowers-ui.test.ts`)가 지키고 있다.

### `birth_photos.csv` — 탄생화의 실사 (2026-08-16 신설)

**주인은 날짜다**(`birth_flowers.csv` 와 같은 자연키 `(month, day)`). 이름이 아닌 이유는
같은 이름이 여러 날에 걸리고 그 날들이 **서로 다른 사진**을 들기도 하기 때문이다
(`삼나무` 2/15 는 숲, 9/30 은 열매 — 35개 이름 중 17개가 그렇다).

| 컬럼 | 필수 | 뜻 |
|---|---|---|
| `month` / `day` | **필수** | 자연키. `birth_flowers.csv` 에 실재하는 날이어야 한다. |
| `name_ko` | **필수** | 그날 표가 부르는 이름. **표와 글자까지 같아야 한다**(교차 검증 6). |
| `slug` | 짝 | 저장 파일 이름(`public/birth/{slug}.jpg`). 규칙은 `src/lib/birth-photos/index.ts`. |
| `commons_page_url` | 짝 | 위키미디어 파일 페이지 — 라이선스 증빙이자 화면 크레딧의 링크. |
| `direct_url` | 선택 | 취득 주소(1280px 썸네일). **이 칸의 유무가 확보/미확보를 가른다.** |
| `author` | 짝 | 저작자. 크레딧 첫 칸이라 사진이 있으면 필수. |
| `license` | 짝 | 파일 페이지 표기 그대로(`CC BY-SA 4.0`). PD·CC0·CC BY·CC BY-SA 만 허용. |
| `width` | 짝 | 원본 가로 픽셀. 더 큰 사본이 필요할 때의 판단 근거. |
| `species_note` | **필수** | 종 동정 판정 근거. **화면 비노출**(로더가 옮기지 않는다). |
| `family_line` | 짝 | 그 식물을 소개하는 한 줄. 사진 **아래** 캡션으로 나간다. |

- **"짝" 은 전부 있거나 전부 없거나다.** `direct_url` 이 있으면 여섯 칸이 함께 있어야 하고,
  없으면 여섯 칸이 모두 비어 있어야 한다(행 스키마의 `superRefine` 이 막는다).
  **크레딧을 못 다는 사진은 싣지 않는다** — 274장 중 218장이 CC BY / CC BY-SA 이고,
  화면에 거는 것은 폭을 줄여 다시 인코딩한 **파생물**이라 저작자·라이선스 라벨·원본 링크를
  이미지 단위로 밝혀야 의무가 이행된다.
- **미확보 6행을 지우지 마라.** 커먼즈에 검증 가능한 실사가 없거나(단양쑥부쟁이 11/5·12/11),
  표의 국명과 영문명이 다른 식물을 가리켜 무엇을 실을지 정하지 못한 날이다(마 10/20).
  **그 사실 자체가 조사 결과**이고, 지우면 "아직 안 찾아봤다"와 구별되지 않는다.
- **사진 위에 글자를 합성하지 않는다.** 파생물에 파생물을 더하는 일이고, 밝은 실사 위
  아이보리 타이포는 어차피 죽는다(도판 사용 규칙 3 과 같은 자리).
- 파일을 받는 법: `npm run birth:photos`(`-- --force` 로 전부 다시). 248장이 본판·썸네일
  두 벌로 `public/birth/` 에 놓인다. 판정 원장은 `docs/birth-photos-research-{1,2,3}.md`.

### `birth_stories.csv` — 탄생화 이야기 (2026-08-16 신설)

**주인은 이름이다**(`name_ko`). `stories.csv` 가 카탈로그의 꽃(`flower_id`)에 붙는 것과
갈리는 지점이고, 이유는 366일 중 도감으로 이어지는 날이 86일뿐이라서다 — 나머지 280일에는
걸어 둘 `flower_id` 가 없고, 없는 id 를 지어내면 도감이 검증하지 않은 종이 카탈로그에 섞인다.

| 컬럼 | 필수 | 뜻 |
|---|---|---|
| `name_ko` | **필수** | `birth_flowers.csv` 에 있는 이름이어야 한다(교차 검증 7). |
| `story_id` | **필수** | 파일 안에서 유일하고, **`stories.csv` 와도 겹치면 안 된다.** |
| `title` / `hook` / `story_ko` | 제목·본문 필수 | 시트가 제목·hook 으로 훑고 본문은 접어서 편다. |
| `culture_region` / `era` | 선택 | 각주 줄. 한국어 라벨은 `src/components/flow/labels.ts` 가 붙인다. |
| `story_type` / `source_kind` / `confidence` | **필수** | 어휘는 `stories.csv` 와 **같은 것**을 쓴다. |
| `source_url` | 조건부 | `story_type = original` 이 아니면 필수(창작만 면제). |
| `editorial_note` | 선택 | **화면 비노출.** 편집·감사 전용. |

- **`moods`·`intents` 가 없다.** 그 두 축은 추천 선별기(`pickStories`)가 쓰는 것이고,
  사전 시트는 그 이름의 이야기를 **전부 순서대로** 펼칠 뿐 고르지 않는다.
- **컬럼 이름이 하나 다르다** — `confidence`(`stories.csv` 는 `confidence_level`).
  CSV 는 조사자가 쓴 그대로 두고, 로더가 `confidenceLevel` 로 합류시킨다.
- 한 이름에 1~5편이 붙고(중앙값 2), 205가지 이름이 407편을 나눠 갖는다.
- 2026-08-17 소재 중복 정리: 파트별 조사가 같은 소재를 두 번 쓴 9행을 제거했다(도도나 신탁·로열 오크·민테 신화×2·정이품송·스패그넘 붕대·사이호지·삼나무 조림 꽃가루·페르세포네 석류). 같은 이름 시트에 같은 소재가 두 번 서지 않는 것이 기준이고, 남긴 쪽은 더 검증된(원전 행수·실측치·1차 사료) 판이다.
  같은 이름의 여러 날은 **같은 이야기**를 펼친다(이야기는 식물에 붙지 날짜에 붙지 않는다).
- 판정 원장은 `docs/birth-stories-research-{1,2,3}.md`.

### 특히 자주 걸리는 규칙

- `meanings.source_url` 이 비면 **시드 실패**. 출처 없는 꽃말은 싣지 않는다.
- `stories.source_url` 도 마찬가지로 필수다. 출처 없는 일화는 싣지 않는다.
  **유일한 예외가 `story_type = original`**(dearbloom 창작)이고, 그 대신 화면 창작 라벨이 붙는다.
- `stories.story_type` 은 필수다. 비어 있거나 네 값 밖이면 시드 실패.
- `stories.source_kind` 도 필수다. 비어 있거나 여덟 값 밖이면 시드 실패.
  창작(`original`) 행처럼 출처가 없어도 값은 적는다 — 그 자리는 `other` 다.
- `stories.moods` 는 최소 1개 필수다. 빈 값이면 시드 실패.
  (`stories.intents` 는 반대로 비워 두는 것이 "모든 상황"이라는 정상 값이다.)
- `rules` 의 `fit_score`(0~100) 와 `avoid_reason` 은 **정확히 하나만** 채운다.
  추천 규칙이면 점수를, 회피 규칙이면 이유를 쓴다.
- `quotes.license = pd` 이면 `source_url` 필수(퍼블릭 도메인 근거).
- `quotes.excerpt_type` 을 적었으면 `flower_id` 도 필수다. 꽃이 없는 발췌는 결과 화면의
  문학 블록이 영영 못 찾아 조용히 사장되므로, 시드에서 미리 막는다.
- `pet_safety` 는 **모든 꽃 × `cat`/`dog` 두 행이 전부** 있어야 한다. 하나라도 빠지면 실패한다.
- `pet_safety.toxic = true` 이면 `toxic_parts` 와 `safe_alternative_flower_ids` 가 필수다.
- `birth_flowers` 는 **윤년 366일을 빠짐없이 한 번씩** 채워야 한다. 빠진 날·중복된 날·
  2월 30일 같은 불가능한 조합은 전부 시드 실패다.
- `birth_flowers.meaning_ko` 와 `source_url` 은 필수다(꽃말 없는 탄생화는 싣지 않는다).
  반대로 `birth_flowers.flower_id` 는 **비워 두는 것이 정상 값**이다 — 309일이 그렇다.

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
| `quotes.excerpt_type` | `poem` `novel` `play` `essay` `classic` |
| `stories.moods` | `romantic` `tragic` `funny` `mythic` `dramatic` `healing` |
| `stories.story_type` | `folklore` `history` `literary` `original` |
| `stories.source_kind` | `paper` `magazine` `museum` `newspaper` `book-pd` `garden` `wiki` `other` |

`stories.intents` 는 위 `intent` 어휘를 그대로 쓰되 파이프로 여러 개를 적을 수 있다.

`flowers.aesthetic_tags` 는 페르소나(받는 사람의 분위기) 태그와 같은 어휘를 쓴다:
`calm`(차분한) `vivid`(화려한) `cute`(귀여운) `elegant`(우아한) `minimal`(미니멀).
스키마 enum 이 아니라 편집 규칙이지만, 추천 엔진이 이 태그와 사용자가 고른 분위기를 맞대 보므로
어휘를 벗어나면 그 꽃은 페르소나 점수를 영영 못 받는다. 한국어 라벨 ↔ slug 대응은
`src/lib/engine/normalize.ts` 의 `TRAIT_LABELS` 가 단일 원본이다.

`flower_id` 는 `flowers.csv` 의 `id` 를 그대로 참조한다. 현재 47종: `rose-red`, `tulip-white`,
`freesia`, `lily-asiatic`, `gerbera`, `anemone`, `hellebore`, `hyacinth`, `peony`,
`hydrangea`, `lavender`, `sunflower`, `carnation`, `lisianthus`, `ranunculus`,
`lily-of-the-valley`, `chrysanthemum`, `narcissus`, `forget-me-not`, `cherry-blossom`,
`camellia`, `violet`, `iris`, `marigold`, `corn-poppy`, `jasmine`, `babys-breath`,
`cosmos`, `magnolia`, `pansy`, `poinsettia`, `daisy`, `sweet-pea`, `gladiolus`, `dahlia`,
`zinnia`, `aster`, `calendula`, `cyclamen`, `geranium`, `primula`, `stock`, `delphinium`,
`amaryllis`, `cornflower`, `crocus`, `water-lily`.

`birth_flowers.flower_id` 도 같은 목록을 참조하되 **비어 있어도 된다**(위 §birth_flowers).
