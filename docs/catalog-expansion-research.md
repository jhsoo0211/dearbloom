# 카탈로그 확장 조사 기록 (seed-v3, 2026-08-15)

꽃 9종 → **17종**으로 늘리면서 실제로 열어 본 자료, 독성 등급 판단 근거, 채택·제외 판단을 남긴다.
`docs/story-research.md`(설화)·`docs/meanings-research.md`(꽃말)의 후속 문서이며, **이번 확장분(seed-v3)의 단일 원본**이다.

수집 방향은 design-spec §1.5f(문화권 무제한·재미 우선)와 §1.5d(이야기 톤)를 따랐다.

---

## 0. 결과 요약

| 파일 | 이전 | 이후 | 증가 |
|---|---|---|---|
| `flowers.csv` | 9 | **17** | +8 |
| `meanings.csv` | 59 | **86** | +27 |
| `stories.csv` | 61 | **89** | +28 |
| `pet_safety.csv` | 18 | **34** | +16 |

신규 8종: `hydrangea`(수국) `lavender`(라벤더) `sunflower`(해바라기) `carnation`(카네이션)
`lisianthus`(리시안셔스) `ranunculus`(라넌큘러스) `lily-of-the-valley`(은방울꽃) `chrysanthemum`(국화)

`stories.csv` 는 신규 8종 26편 + **기존 `peony` 2편**(농사로 작약 설화 — `docs/meanings-research.md` §6 에서
"stories 후보로 남길 만하다"고 미뤄 둔 항목)을 함께 실었다.

**선별 태그 분포 (전체 89편, 확장 전 → 후)**

| mood | 전 → 후 | | intent | 전 → 후 |
|---|---|---|---|---|
| dramatic | 33 → **48** | | just_because | 20 → 26 |
| healing | 29 → **46** | | comfort | 16 → 23 |
| mythic | 34 → **44** | | confession | 7 → **11** |
| funny | 22 → 28 | | gratitude | 4 → **9** |
| tragic | 15 → 24 | | celebration | 7 → 9 |
| romantic | 12 → **19** | | **apology** | 3 → **5** |
| | | | anniversary | 3 → 3 |

`story-research.md` §5 가 지적한 두 약점(romantic 얕음 · apology 1~3건)을 함께 손봤다.
`anniversary` 는 여전히 3건으로 가장 얇다 — 다음 확장 대상.

---

## 1. 저작권 처리 — 무엇을 가져왔고 무엇을 가져오지 않았나

- **타 사이트 문장을 옮긴 곳은 한 군데도 없다.** `story_ko` · `meaning_ko` · `caution_note` · `editorial_note` 는
  전부 사실관계만 참고해 새로 쓴 우리 문장이다.
- 원문 인용은 **퍼블릭 도메인 원전만**, 그것도 `editorial_note` 안에 출전 표시용 짧은 인용으로만 남겼다
  (예: `'Ranunculus — You are radiant with charms'`).
- **실존 인물의 발언은 인용하지 않고 뜻만 옮겼다.** 안나 자비스의 1920년대 발언(인쇄된 카드 비판)이 여기 해당한다.
- **국립원예특작과학원(`nihhs-*`)은 이번 확장에서 쓰지 않았다.** 꽃말사전은 검색 폼이 POST 이고
  `dataNo` 가 날짜(1~366) 기반이라, 신규 8종의 항목 번호를 찾으려면 366일 전수 재확인이 필요하다.
  이번 8종은 전부 해외 1차 자료로 채웠다 → **후속 과제**(§7-1).
- **농사로(공공누리 제2유형 = 상업적 이용금지)**: 작약 설화 2편은 페이지 문장을 한 줄도 옮기지 않고
  줄거리만 참고해 전부 다시 썼다. 두 행 모두 `editorial_note` 에 제2유형이라는 사실과
  상업화 시점의 재판단 필요를 적어 두었다. `story_id` 는 `story-peony-spirit-sichuan` ·
  `story-peony-hua-tuo` 이므로 빼야 할 경우 이 둘만 걸러 내면 된다.

---

## 2. 반려동물 독성 — 열람 결과와 등급 판단

**ASPCA 상세 페이지를 직접 열어 `Toxic Principles` · `Clinical Signs` 를 확인한 것만 근거로 삼았다.**

| 꽃 | ASPCA 등재 | 페이지의 학명 | Toxic Principles | Clinical Signs (원문) | 채택 severity |
|---|---|---|---|---|---|
| hydrangea | O | *Hydrangea arborescens* | Cyanogenic glycoside | "Vomiting, depression, diarrhea. Cyanide intoxication is rare - usually produces more of a gastrointestinal disturbance." | `mild_gi` |
| lavender | O | *Lavendula angustifolia* | Linlool, linalyl acetate | "Nausea, vomiting (not in horses), inappetant" | `mild_gi` |
| sunflower | O (비독성) | *Helianthus angustifolius* | — | "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses" | `none` |
| carnation | O | *Dianthus caryophyllus* | Unknown irritant | "Mild gastrointestinal signs, mild dermatitis" | `mild_gi` |
| lisianthus | **X (미등재)** | — | — | — | `none` (NC State 근거) |
| ranunculus | O (`Buttercup`) | *Ranunculus spp.* | Protoanemonin (an irritant) | "Vomiting, diarrhea, depression, anorexia, hypersalivation, oral ulcers and wobbly gait." | `mild_gi` |
| lily-of-the-valley | O | *Convallaria majalis* | Cardenolides (convallarin, and others) | "Vomiting, irregular heart beat, low blood pressure, disorientation, coma, seizures" | **`life_threatening`** |
| chrysanthemum | O | *Chrysanthemum spp.* | Sesquiterpene, lactones, pyrethrins and other potential irritants | "Vomiting, diarrhea, hypersalivation, incoordination, dermatitis" | `mild_gi` |

### 2-1. 은방울꽃 — 왜 `life_threatening` 인가

- ASPCA 의 독성 성분이 **심장 배당체(cardenolides)** 이고, 증상 목록에 **불규칙한 심장 박동 · 저혈압 ·
  방향감각 상실 · 혼수 · 발작**이 들어 있다. GI 자극이 아니라 심장에 직접 작용하는 계열이다.
- 위키피디아 *Lily of the valley* 는 약 38종의 강심 배당체(대표: 콘발라톡신)를 싣고 **모든 부위**(붉은 열매 포함)가
  위험하다고 적는다.
- **NC State Extension 은 `Poison Severity: Low`** 로 적고 "많은 양을 먹었을 때만 독성"이라는 단서를 단다.
  **이 등급은 채택하지 않았다.** NC State 의 severity 척도는 사람 기준이고, 우리 컬럼은 개·고양이 기준이다.
  체중이 작은 동물 + 심장 배당체 + ASPCA 의 혼수·발작 서술을 합치면 카탈로그에서 가장 높은 등급이 맞다.
  기존 `lily-asiatic`(고양이 `life_threatening`)과 같은 판단 기준이다.
- 이 판단은 `stories.csv` 의 `story-lily-valley-heart` 행과 `flowers.care_summary` 에도 같은 문장으로 반영했다.
  (§1.5d 는 안전 문구만은 직설을 유지하라고 못 박고 있다.)

### 2-2. 국화 — 왜 `serious` 가 아니라 `mild_gi` 인가

ASPCA 증상에 `incoordination`(운동실조)이 있어 한 단계 올릴지 검토했으나,
같은 카탈로그의 `hyacinth`(`serious`)가 "intense vomiting, diarrhea, occasionally with blood, depression and tremors"
인 것과 견주면 국화 쪽이 확실히 가볍다. 자극성 GI + 접촉성 피부염이 본체라 `mild_gi` 로 두었다.

### 2-3. 라넌큘러스 — 기존 `anemone` 와 같은 기준

둘 다 프로토아네모닌 계열이다. `anemone` 은 NC State `Medium` 인데 카탈로그에서 `mild_gi` 이고,
`ranunculus asiaticus` 는 NC State `Poison Severity: Low` 다. 더 낮은 쪽을 더 높게 매길 이유가 없어 `mild_gi`.
NC State 의 `Poison Part`(Bark, Flowers, Fruits, Leaves, Roots, Sap/Juice, Stems)를 참고해
`toxic_parts = flower|leaf|stem|root|sap` 으로 적었다. **접촉성 피부염이 확인**되어 `care_summary` 에 손 씻기를 넣었다.

### 2-4. 해바라기 — 종이 다르다는 사실을 숨기지 않았다

ASPCA 의 `Sunflower` 항목은 **학명이 *Helianthus angustifolius*(스웜프 선플라워)** 이고,
같은 목록에 `Swamp Sunflower` 가 같은 학명으로 한 번 더 있다. 절화로 도는 것은 *H. annuus* 다.
- ASPCA 에 *H. annuus* 단독 항목은 없다(비독성 S 목록 전수 확인).
- NC State 의 *Helianthus annuus* 페이지에는 **poison 섹션 자체가 없고**, 오히려 "씨앗은 식용, 꽃잎도 먹을 수 있고
  어린 봉오리는 아티초크처럼 쪄 먹는다"고 적혀 있다.
- 두 근거를 합쳐 `toxic=false / severity=none` 으로 두되, **`flowers.editorial_note` 에 종이 다르다는 사실을 남겼다.**

### 2-5. 리시안셔스 — ASPCA 미등재 (anemone 와 같은 상황)

ASPCA 의 L 항목을 **독성 목록·비독성 목록 양쪽 전 페이지**(비독성 L = 총 22건) 확인했으나
`Lisianthus` · `Eustoma` · `Prairie Gentian` 어느 이름으로도 없다.
- 확인 URL: `.../toxic-and-non-toxic-plants/l?field_toxicity_value[]=01` , `.../l?field_non_toxicity_value[02]=02`(page 1·2)
- **"ASPCA 가 비독성으로 등재했다"고 쓰는 블로그가 다수 있으나 전부 사실이 아니다.** 인용하지 않았다.
- 대체 출처로 NC State Extension *Eustoma grandiflorum* 페이지를 채택했다. 이 DB 는 독성 식물에
  `Poison Severity` 섹션을 붙이는데 이 종에는 없다. 근거로는 약한 편이라 **§7-2 후속 확인 대상**이다.

---

## 3. 열람 확인한 자료 목록 (신규)

| source_id / 성격 | 자료 | URL |
|---|---|---|
| ASPCA | Hydrangea | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/hydrangea |
| ASPCA | Lavender | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/lavender |
| ASPCA | Sunflower (*H. angustifolius*) | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/sunflower |
| ASPCA | Carnation | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/carnation |
| ASPCA | Buttercup (*Ranunculus* spp.) | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/buttercup |
| ASPCA | Lily of the Valley | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/lily-valley |
| ASPCA | Chrysanthemum | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/chrysanthemum |
| NC State | *Eustoma grandiflorum* | https://plants.ces.ncsu.edu/plants/eustoma-grandiflorum/ |
| NC State | *Ranunculus asiaticus* | https://plants.ces.ncsu.edu/plants/ranunculus-asiaticus/ |
| NC State | *Convallaria majalis* | https://plants.ces.ncsu.edu/plants/convallaria-majalis/ |
| NC State | *Helianthus annuus* | https://plants.ces.ncsu.edu/plants/helianthus-annuus/ |
| `greenaway-1884` | Kate Greenaway, *Language of Flowers* (1884) — PD | https://www.gutenberg.org/ebooks/31591 |
| `dumont-1851` | Henrietta Dumont, *The Language of Flowers* (1851) — PD | https://www.gutenberg.org/ebooks/71779 |
| `wikipedia-plant-symbolism` | List of plants with symbolism | https://en.wikipedia.org/wiki/List_of_plants_with_symbolism |
| `wikipedia-hanakotoba` | Hanakotoba | https://en.wikipedia.org/wiki/Hanakotoba |
| `wikipedia-ja-ajisai` | アジサイ (일본어 위키백과) | https://ja.wikipedia.org/wiki/アジサイ |
| `wikipedia-ja-torukogikyou` | トルコギキョウ (일본어 위키백과) | https://ja.wikipedia.org/wiki/トルコギキョウ |
| — | Hydrangea / Hydrangea macrophylla / Hydrangea serrata / Amacha | https://en.wikipedia.org/wiki/Hydrangea |
| — | Philipp Franz von Siebold | https://en.wikipedia.org/wiki/Philipp_Franz_von_Siebold |
| `wikipedia-lavandula` | Lavandula | https://en.wikipedia.org/wiki/Lavandula |
| — | Four thieves vinegar | https://en.wikipedia.org/wiki/Four_thieves_vinegar |
| — | Clytie (Oceanid) | https://en.wikipedia.org/wiki/Clytie_(Oceanid) |
| `wikipedia-helianthus-annuus` | Helianthus annuus | https://en.wikipedia.org/wiki/Helianthus_annuus |
| — | Sunflowers (Van Gogh series) | https://en.wikipedia.org/wiki/Sunflowers_(Van_Gogh_series) |
| `wikipedia-anna-jarvis` | Anna Jarvis | https://en.wikipedia.org/wiki/Anna_Jarvis |
| `wikipedia-carnation-revolution` | Carnation Revolution | https://en.wikipedia.org/wiki/Carnation_Revolution |
| — | Dianthus caryophyllus | https://en.wikipedia.org/wiki/Dianthus_caryophyllus |
| `wikipedia-parents-day` | Parents' Day (한국 어버이날) | https://en.wikipedia.org/wiki/Parents%27_Day |
| `wikipedia-eustoma` | Eustoma | https://en.wikipedia.org/wiki/Eustoma |
| `wikipedia-ranunculus` | Ranunculus | https://en.wikipedia.org/wiki/Ranunculus |
| `wikipedia-lily-of-the-valley` | Lily of the valley / Convallaria majalis | https://en.wikipedia.org/wiki/Lily_of_the_valley |
| `wikipedia-chrysanthemum` | Chrysanthemum | https://en.wikipedia.org/wiki/Chrysanthemum |
| — | Imperial Seal of Japan | https://en.wikipedia.org/wiki/Imperial_Seal_of_Japan |
| — | Tao Yuanming | https://en.wikipedia.org/wiki/Tao_Yuanming |
| — | Double Ninth Festival (보류분 근거) | https://en.wikipedia.org/wiki/Double_Ninth_Festival |
| 농사로 (공공누리 **제2유형**) | 애절한 사랑의 약속, 작약 | https://www.nongsaro.go.kr/portal/ps/psz/psza/contentSub.ps?menuId=PS04104&cntntsNo=205071 |

---

## 4. 꽃별 수집 요약

### hydrangea (수국) — 꽃말 4 · 이야기 3
- 꽃말: 진심·감사(분홍, 식물 상징 목록) / 변덕(일본) / 가족·화목(일본) / 허풍·냉담(빅토리아)
- 이야기: **지볼트가 학명에 연인 이름을 숨긴 이야기**(`otaksa` ← 오타키상, 마키노 도미타로의 추정) /
  흙의 산도와 알루미늄이 꽃빛을 정한다 / 부처님 오신 날 아마차
- 함정: 아마차 원료는 **산수국(*H. serrata*)** 이라 절화 *H. macrophylla* 와 종이 다르다 → 본문·`editorial_note` 명시

### lavender (라벤더) — 꽃말 3 · 이야기 3
- 꽃말: 의심(그리너웨이+뒤몽 일치) / 변함없음(하나코토바 — 정반대) / 씻어 내는 일(어원 lavare)
- 이야기: 이름 어원 + **로마 시대 한 파운드 100데나리우스 = 농장 일꾼 한 달 품삯** / 네 도둑의 식초 /
  의심 ↔ 성실 대비

### sunflower (해바라기) — 꽃말 3 · 이야기 4
- 꽃말: 숭배(작은 것) ↔ 거만(큰 것) / 존경·눈부심(하나코토바) / 평화(우크라이나)
- 이야기: **클리티에 — 오비디우스의 꽃은 해바라기가 아니라 헬리오트로프였다** /
  다 자란 해바라기는 해를 따라 돌지 않고 동쪽에 고정된다 / 1996년 페르보마이스크 / 반 고흐의 노란 집

### carnation (카네이션) — 꽃말 4 · 이야기 3
- 꽃말: 흰 카네이션과 어머니날(안나 자비스) / 붉은 카네이션의 사랑 / 한국 어버이날 5월 8일 / 포르투갈 혁명
- 이야기: **어머니날을 만든 사람이 나중에 그 날과 싸웠다** / 총구에 꽂힌 카네이션(사망자 4명을 숨기지 않음) /
  디안투스 = 신의 꽃

### lisianthus (리시안셔스) — 꽃말 2 · 이야기 3
- 꽃말: 초원의 용담(자생지) / 이름을 잘못 얻은 꽃(일본명 터키 도라지)
- 이야기: 터키에서 오지 않은 터키 도라지 / 길가 들꽃이 절화가 되기까지 / 일본 육종 반세기
- 함정: 이 꽃만 1차 자료가 얇다. 꽃말 전승 자체가 거의 없어 유래·자생지 계열로 채웠다

### ranunculus (라넌큘러스) — 꽃말 3 · 이야기 3
- 꽃말: 당신은 매력으로 빛나요(빅토리아) / 배은망덕·어린 마음(현대 목록) / 작은 개구리라는 이름
- 이야기: 어원 rana / **턱 밑에 대 보는 버터 놀이 + 코요테의 눈** / 정원의 것과 들판의 것
- 함정: 턱 놀이·코요테는 들 미나리아재비 전승이라 꽃집 *R. asiaticus* 와 종이 다르다 → 본문에 드러나게 서술

### lily-of-the-valley (은방울꽃) — 꽃말 4 · 이야기 3
- 꽃말: 돌아오는 행복 / 5월 1일의 행운(프랑스 뮈게) / 성모의 눈물 / 달콤함(하나코토바, 독성 경고 동반)
- 이야기: 뮈게 / 성모의 눈물 / **ASPCA 근거 독성 경고**
- 함정: 카탈로그에서 가장 위험한 꽃이므로 꽃말·이야기 어디에도 안전 문구를 빼지 않았다

### chrysanthemum (국화) — 꽃말 4 · 이야기 4
- 꽃말: 애도(한국 흰 국화) / 황실(일본 노란 국화) / 사랑합니다(빅토리아 붉은 국화) / 사군자의 은일(중국)
- 이야기: **한국 흰 국화 조문 관습은 20세기 초부터** / 일본 열여섯 잎 국화문(1926-10-21 규정) /
  도연명의 동쪽 울타리(405년) / 유럽은 무덤의 꽃, 미국은 명랑한 꽃
- 이 꽃 하나로 **한국·일본·중국·유럽·미국 5개 문화권 대비**가 완성된다 — 카탈로그에서 가장 강한 사례

### peony (작약) — 이야기 2 (기존 꽃 보강)
- `docs/meanings-research.md` §6 에서 미뤄 둔 농사로 설화 2편. §1 의 제2유형 처리 원칙 적용

---

## 5. 색상 정합 (`flowers.colors` 보강)

`docs/meanings-research.md` §7-1 이 지적한 "꽃말에 있는데 `flowers.colors` 에 없는 색" 문제를 해소했다.

| 꽃 | 이전 | 이후 | 이유 |
|---|---|---|---|
| `tulip-white` | `white` | `white\|cream\|yellow\|red\|variegated\|pink\|purple` | 꽃말 행의 red·yellow·variegated + design-spec §1.5b 색 칩(흰·크림·분홍·보라) |
| `rose-red` | `red\|pink` | `red\|pink\|yellow\|white` | 노란 장미(질투 ↔ 우정) 2행, 흰·붉은 장미 조합(하나 됨) 1행 |

- 두 행 모두 `editorial_note` 를 `seed-v3` 로 갱신하고 `reviewed_at` 을 2026-08-15 로 올렸다.
- **`name_ko` 는 그대로 뒀다.** "흰 튤립"인데 색이 7종, "빨간 장미"인데 색이 4종이라 이름과 데이터가 어긋난다.
  리네이밍(예: 튤립 / 장미)은 UI·테마·이미지에 함께 걸리는 편집 판단이라 **§7-3 후속**으로 남긴다.
- `content/README.md` 의 "flowers.colors 에 없는 색" 문단도 이 사실에 맞춰 고쳤다.

---

## 6. 테마 카테고리 배정 (design-spec §1.4c v3.2)

신규 8종은 명시 맵(`src/lib/theme/`)에 없으므로 **대표색(`colors[0]`) 폴백 규칙**이 적용된다.
이번 확장의 `colors` 순서는 그 규칙을 의식해 "가장 대표적인 색이 맨 앞"이 되게 적었다.

| 꽃 | `colors[0]` | 폴백 카테고리 |
|---|---|---|
| hydrangea | blue | `dusk` |
| lavender | purple | `dusk` |
| lisianthus | purple | `dusk` |
| sunflower | yellow | `gold` |
| carnation | red | `wine` |
| ranunculus | white | `forest` |
| lily-of-the-valley | white | `forest` |
| chrysanthemum | white | `forest` |

합산: `forest` 4 · `dusk` 5 · `gold` 3 · `wine` 3 · **`ivory` 2 (신규 배정 없음)**.
`ivory`(Warm Ivory 라이트) 쪽이 얇으므로, 크림·화이트 스튜디오 무드에 맞는 꽃
(`lisianthus` 크림 계열, `ranunculus` 크림 계열)을 명시 맵에서 `ivory` 로 옮길지는 **UI 판단**이다(§7-4).

---

## 7. Advisor 판단이 필요한 후속 항목

1. **`nihhs-*` 한국 꽃말이 신규 8종에 하나도 없다.** 꽃말사전은 `dataNo` 가 날짜(1~366) 기반이고
   목록 검색이 POST 라, 8종의 항목 번호를 찾으려면 366일 전수 재확인이 필요하다.
   한국 해석은 이번엔 위키피디아 경유(국화 조문, 어버이날 카네이션)로만 채웠다.
   국내 서비스라면 `nihhs` 보강은 값어치가 크다 — 다만 공공누리 유형 미확정 문제는 그대로다.
2. **`lisianthus` 비독성 근거 보강.** NC State 에 poison 섹션이 없다는 "부재"가 유일한 근거다.
   `anemone` 의 반대 상황(ASPCA 부재 → NC State 로 대체)이라 같은 취급을 했지만,
   수의 문헌으로 한 번 더 받쳐 두면 좋다.
3. **`tulip-white` · `rose-red` 리네이밍.** 색이 늘어 이름과 데이터가 어긋난다(§5).
4. **`ivory` 테마 카테고리 배정**(§6) — 명시 맵은 `src/lib/theme/` 소관이라 이번 작업 범위 밖.
5. **`story_type = original` 이 여전히 0건이다.** 갈래는 `folklore` 31 · `history` 50 · `literary` 8 로
   셋만 쓰이고 있다. §1.5f 가 허용한 창작 이야기를 실제로 실을지는 편집 판단이라 손대지 않았다.
6. **`rules.csv` 는 여전히 5종만 다룬다.** 신규 8종은 도감·이야기용으로만 존재하며 추천 결과에 오르지 않는다.
7. **이미지가 전부 비어 있다.** 신규 8종의 `image_url` 은 `docs/image-assets.md` 승인 절차를 거쳐야 한다.

---

## 8. 수집했으나 제외한 것

| 후보 | 제외 사유 |
|---|---|
| 국화 **중양절**(비장방·환경 설화, 국화주와 등고) | 자료는 확인됐고(`Double Ninth Festival`) 이야기도 좋지만, 국화가 이미 4편이라 보류. **다음 확장 1순위** |
| 은방울꽃 **샤를 9세 1561년 5월 1일 기원설** | 위키피디아 본문에서 확인되지 않는다. 노동절 관습은 "20세기 초부터"라고만 적혀 있어 그 선까지만 썼다 |
| 은방울꽃 **성 레오나르와 용** 전승 | 위키피디아 본문에 없다. 꽃집 블로그에서만 반복돼 제외 |
| 은방울꽃 **엘리자베스 2세 대관식 부케 / 케이트 미들턴 부케 / 핀란드 국화** | 사실은 확인되나 이야기로서 얇다. 소재로 남겨 둠 |
| 라벤더 **이집트 미라 방부 사용** | *Lavandula* 문서에서 확인되지 않는다. 널리 도는 이야기지만 1차 근거를 못 찾아 제외 |
| 수국 **일본 아지사이데라(수국 절)** | 일본어 위키백과에 서술이 있으나 개별 절 이름·연혁까지는 확인하지 못해 이야기로 만들지 않았다 |
| 리시안셔스 **속명 Eustoma = '아름다운 입'(eu + stoma)** | 어원 설명이 상업 블로그에서만 반복되고 위키피디아·NC State 본문에 없다 |
| 리시안셔스 **1930년대 나가노 육종 시작** | 상업 블로그의 연대. 일본어 위키백과는 "1960~70년대 본격화"라고 적어 그쪽을 채택 |
| 카네이션 **성모의 눈물에서 피었다는 기독교 전승** | *Dianthus caryophyllus* 문서에 없다. 은방울꽃 쪽에는 별칭 근거가 있어 그쪽만 실었다 |
| 카네이션 **오하이오 주화(매킨리 암살)** | 사실 확인됨. 한국 사용자에게 맥락이 멀어 보류 |
| 해바라기 **잉카 태양 신전의 금 해바라기** | 확인 가능한 출처를 못 찾았다 |
| 해바라기 **씨앗 배열의 피보나치 나선(황금각 137.5°)** | 사실 확인됨(*H. annuus*). 이야기 톤(§1.5d)에 얹기 어려워 보류 — 도감 팁 후보 |
| "ASPCA 가 리시안셔스를 비독성으로 등재" 주장 | **사실이 아니다**(§2-5). 여러 블로그가 반복하지만 원목록에 없다 |
| 국화 서정주 「국화 옆에서」(1947) | 저작권 보호 기간 중. 인용도 언급도 하지 않았다 |
