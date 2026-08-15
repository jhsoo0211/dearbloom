# 카탈로그 2차 확장 조사 기록 (seed-v4 후보, 2026-08-15)

꽃 17종 → **31종**으로 늘리기 위해 실제로 열어 본 자료, 독성 등급 판단 근거, 채택·제외 판단을 남긴다.
`docs/story-research.md`(설화) · `docs/meanings-research.md`(꽃말) · `docs/catalog-expansion-research.md`(seed-v3)의
후속 문서이며, **이번 확장분(신규 14종)의 단일 원본**이다.

사용자 요청: "꽃 종류가 훨씬 많을 텐데 왜 그것밖에 없어? 더 모아줘. 설화든 이야기든 재밌어 보이는 건 다."
→ **이야기·설화가 풍부한 꽃을 우선**으로 골랐다. 수집 방향은 design-spec §1.5f(문화권 무제한 · 재미 우선)와
§1.5d(이야기 톤)를 따랐다.

> **이 문서는 조사 기록이다. CSV 는 건드리지 않았다.** 적재는 별도 작업이며,
> 아래 §4 의 표를 그대로 옮기면 되도록 컬럼 순서를 `db/seed/schemas.ts` 에 맞춰 두었다.

---

## 0. 결과 요약

| 파일 | 현재 | 이번 확장 후(예정) | 증가 |
|---|---|---|---|
| `flowers.csv` | 17 | **31** | +14 |
| `meanings.csv` | 86 | **138** | +52 |
| `stories.csv` | 89 | **149** | +60 |
| `pet_safety.csv` | 34 | **62** | +28 |

**신규 14종**

| id | 이름 | 뽑은 이유(이야기 축) |
|---|---|---|
| `narcissus` | 수선화 | 나르키소스 신화 + **이름이 신화에서 온 게 아니라는 반전** + 추사 김정희의 제주 수선화 |
| `forget-me-not` | 물망초 | 도나우 강 기사 전설 + **나치 배지와 우연히 같은 도안이 된 프리메이슨 이야기** |
| `cherry-blossom` | 벚꽃 | 하나미가 원래 매화 구경이었다는 반전 + **제주 왕벚나무 기원 논쟁의 결말** |
| `camellia` | 동백 | 뒤마 『춘희』 → 베르디 → 샤넬로 이어지는 계보 + **제주 4·3 의 동백** |
| `violet` | 제비꽃 | **향을 맡으면 향이 사라지는 꽃**(이오논) + 사포 + 한국 이름 여섯 개 |
| `iris` | 아이리스 | 무지개 여신 전령 + 프랑스 백합 문장이 사실 붓꽃이라는 설 + 반 고흐 |
| `marigold` | 마리골드 | 멕시코 죽은 자의 날 vs 빅토리아 꽃말 '슬픔' — **정반대 해석의 교과서** |
| `corn-poppy` | 개양귀비 | **왜 하필 그 들판에 폈나**(흙 속 씨앗) + 추모 양귀비의 탄생 + 우미인초 |
| `jasmine` | 재스민 | 밤에만 피는 꽃 + 필리핀·인도네시아 국화 + 재스민 혁명 |
| `babys-breath` | 안개꽃 | **가장 여려 보이는 꽃이 북미에서는 유해잡초** + 석고를 사랑하는 이름 |
| `cosmos` | 코스모스 | 어원은 우주가 아니라 '질서' + **멸종했다던 초콜릿 코스모스가 살아 있었다** |
| `magnolia` | 목련 | **벌보다 오래된 꽃** — 딱정벌레가 꽃가루를 옮긴다 + 한국 북향화 설화 |
| `pansy` | 팬지 | 이름 자체가 '생각' + **『한여름 밤의 꿈』의 사랑 묘약이 이 꽃** |
| `poinsettia` | 포인세티아 | **"맹독" 오해 바로잡기** + 페피타 전설 + 접목 비법 독점의 최후 |

**선별 태그 분포 (신규 60편 실집계, 확장 전 → 후)**

| mood | 전 → 후 (신규) | | intent | 전 → 후 (신규) |
|---|---|---|---|---|
| healing | 46 → **81** (+35) | | just_because | 26 → **60** (+34) |
| dramatic | 48 → **78** (+30) | | comfort | 23 → **41** (+18) |
| funny | 28 → **49** (+21) | | confession | 11 → 17 (+6) |
| mythic | 44 → 59 (+15) | | gratitude | 9 → 14 (+5) |
| tragic | 24 → 38 (+14) | | **anniversary** | 3 → **8** (+5) |
| romantic | 19 → 30 (+11) | | celebration | 9 → 13 (+4) |
| | | | **apology** | 5 → 6 (+1) |

- seed-v3 가 "가장 얇다"고 지목한 **`anniversary`(3건)** 를 5편 보강했다
  (동백 기다림 · 아이리스 '소식' · 마리골드 죽은 자의 날 · 재스민 삼파기타 화환 · 팬지 '생각').
- **`apology` 는 1편밖에 못 늘렸다**(포인세티아 페피타 — "드릴 게 없어 미안한 마음"이 이야기의 중심).
  이번 14종은 사과와 자연스럽게 붙는 소재가 거의 없었다. **여전히 가장 얇은 축**이다(§6-9).
- `healing` 과 `funny` 가 크게 늘어난 것이 이번 확장의 성격이다 — 사용자가 요청한 "재밌어 보이는 것"에
  맞춰 반전·도파민 소재를 우선했다.

---

## 1. 저작권 처리 — 무엇을 가져왔고 무엇을 가져오지 않았나

- **타 사이트 문장을 옮긴 곳은 한 군데도 없다.** 아래 `story_ko` · `meaning_ko` · `caution_note` · `editorial_note`
  초안은 전부 사실관계만 참고해 새로 쓴 우리 문장이다.
- 원문 인용은 **퍼블릭 도메인 원전만**, 그것도 `editorial_note` 안에 출전 표시용 짧은 인용으로만 남겼다.
  이번에 쓴 PD 원문은 셋이다.
  - Greenaway(1884) 꽃말 항목: `'Iris — Message'`, `'Pansy — Thoughts'`, `'Poppy, Red — Consolation'` 등
  - Dumont(1851) 목차 항목: `'Pansy, (Think of me)'`, `'Camellia Japonica, (Modest merit)'` 등
  - 셰익스피어 『한여름 밤의 꿈』(1600 초판, PD): `'Before, milk-white, now purple with love's wound'`,
    『햄릿』: `'There's pansies, that's for thoughts'`
- **한국어 번역문은 전부 우리 번역이다.** 기존 번역본을 참조하지 않았다.
- **실존 인물의 발언은 인용하지 않고 뜻만 옮겼다.** 반 고흐가 테오에게 보낸 편지가 여기 해당한다
  (원문 인용 대신 "일할 힘이 곧 돌아오리라 믿는다고 적었다"로 서술).
- **국립원예특작과학원(`nihhs-*`)은 이번에도 쓰지 못했다.** seed-v3 §7-1 이 남긴 문제(꽃말사전 검색 폼이 POST,
  `dataNo` 가 날짜 1~366 기반)가 그대로다. 14종의 항목 번호를 찾으려면 366일 전수 재확인이 필요하다.
  → **후속 과제**(§6-1). 이번 14종은 해외 1차 자료 + 한국어 위키백과 + 언론 기사로 채웠다.
- **언론 기사 2건**(경향신문 · 국제신문)은 사실만 참고하고 문장을 한 줄도 옮기지 않았다.
  두 이야기(`story-narcissus-jeju-chusa`, `story-camellia-jeju-43`) 모두 `editorial_note` 에
  "언론 기사 근거 — 상업화 시점에 재확인 권장"을 남겼다.
- **명예 프레이밍이 필요한 이야기 3건**은 §4 해당 항목에 처리 방침을 따로 적었다
  (벚꽃 전시 상징 · 제주 4·3 · 포인세티아 명명 논란).

---

## 2. 반려동물 독성 — 열람 결과와 등급 판단

**ASPCA 상세 페이지를 직접 열어 `Toxic Principles` · `Clinical Signs` 를 확인한 것만 근거로 삼았다.**
등재를 못 찾은 6종은 **알파벳 목록 페이지를 페이지 단위로 넘겨 부재를 확인**한 뒤 대체 출처로 갔다(§2-6).

### 2-1. ASPCA 등재 8종

| 꽃 | ASPCA 등재 | 페이지의 학명 | Toxic Principles | Clinical Signs (원문) | 채택 severity |
|---|---|---|---|---|---|
| narcissus | O (`Daffodil`) | *Narcissus spp* | Lycorine and other alkaloids | "Vomiting, salvation, diarrhea; large ingestions cause convulsions, low blood pressure, tremors and cardiac arrhythmias. Bulbs are the most poisonous part." | **`serious`** |
| cherry-blossom | O (`Cherry`) | *Prunus spp.* | Cyanogenic glycosides | "Stems, leaves, seeds contain cyanide, particularly toxic in the process of wilting: brick red mucous membranes, dilated pupils, difficulty breathing, panting, shock." | **`serious`** |
| iris | O | *Iris species* | Pentacyclic terpenoids (zeorin, missourin and missouriensin) | "Salivation, vomiting, drooling, lethargy, diarrhea. Highest concentration in rhizomes." | `mild_gi` |
| poinsettia | O | *Euphorbia pulcherrima* | Irritant sap | "Irritating to the mouth and stomach, sometimes causing vomiting, but generally over-rated in toxicity." | `mild_gi` |
| camellia | O (비독성) | *Camellia japonica* | — | "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses" | `none` |
| jasmine | O (비독성) | *Jasminum species* | Non-toxic | "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses" | `none` |
| babys-breath | O (비독성) | *Gypsophila elegans* | Non-toxic | "Mild GI upset such as vomiting, and diarrhea may be seen if ingested." | `none` (단서 있음 → §2-4) |
| magnolia | O (비독성, `Magnolia Bush`) | *Magnolia stellata* | — | "Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses" | `none` |

### 2-2. 수선화 — 왜 `serious` 인가

- ASPCA 증상에 **경련 · 저혈압 · 떨림 · 심장 부정맥**이 들어 있다. GI 자극만이 아니다.
- 다만 원문이 이 증상들을 **"large ingestions"(다량 섭취) 조건**에 걸어 두었고, 독성 성분이
  심장 배당체가 아니라 알칼로이드(리코린)다. 그래서 은방울꽃·백합의 `life_threatening` 보다는 한 단계 아래로 본다.
- 같은 카탈로그의 `hyacinth`(`serious` — "intense vomiting, diarrhea, occasionally with blood, depression and tremors")와
  견주면 수선화 쪽이 심장 증상까지 있어 확실히 무겁거나 최소 같다. → `serious` 확정.
- **"Bulbs are the most poisonous part"** 는 절화 서비스에서 특히 중요하다. 절화에는 알뿌리가 없다.
  그래서 `toxic_parts` 를 `bulb|flower|leaf|stem` 으로 적되 **`bulb` 를 맨 앞에 두고**,
  `care_summary` 에 "알뿌리가 가장 위험합니다 — 화분으로 두실 땐 흙 위로 나온 알뿌리를 덮어 주세요"를 넣는다.
- 위키피디아 *Narcissus (plant)* 는 알뿌리를 **양파로 착각해 먹는 사고**와 접촉성 피부염
  (**"daffodil picker's rash"**)을 함께 싣는다. 후자는 `care_summary` 에 손 씻기로 반영한다.

### 2-3. 벚꽃 — 시드는 동안 더 위험하다

- ASPCA 원문이 **"particularly toxic in the process of wilting"**(시드는 과정에서 특히 독성이 강하다)이라고
  적어 둔 것은 이 카탈로그에서 벚꽃이 유일하다. **절화 서비스에 직결되는 문구다.**
  화병에 꽂아 둔 벚꽃 가지가 시들어 갈수록 위험해진다는 뜻이므로, `care_summary` 에
  "떨어진 잎과 가지는 그날그날 치워 주세요. 시들면서 더 위험해집니다"를 반드시 넣는다.
- 증상 목록의 **호흡곤란 · 쇼크**는 GI 범주가 아니다. 그렇다고 은방울꽃처럼 미량으로 심장을 치는 계열도 아니다
  (문제 부위가 잎 · 줄기 · 씨이고 꽃잎이 아니다). → `serious`.
- `toxic_parts = leaf|stem|seed`. 꽃잎은 원문 목록에 없어 넣지 않았다.

### 2-4. 안개꽃 — "비독성"인데 GI 문구가 붙은 유일한 항목

ASPCA 는 `Toxic Principles: Non-toxic` / `Non-Toxic to Dogs, Non-Toxic to Cats` 로 적어 놓고
**Clinical Signs 에 "Mild GI upset such as vomiting, and diarrhea may be seen if ingested."** 를 함께 싣는다.

- 스키마상 `toxic=false` 면 `severity` 는 `none` 이어야 하므로 데이터는 `none` 으로 간다.
- 그러나 **화면에서 "안전"으로만 말하면 원문의 절반을 버리는 것**이다.
  `care_summary` 에 "많이 삼키면 토하거나 설사할 수 있어요"를 넣어 원문의 단서를 살린다.
- **종 불일치 주의**: ASPCA 항목은 ***Gypsophila elegans*** 이고, 절화로 도는 안개꽃은 대개
  ***G. paniculata*** 다. 해바라기(`sunflower`)와 정확히 같은 상황이라 **같은 방식으로 처리**했다 —
  `flowers.editorial_note` 에 종이 다르다는 사실을 남긴다.
  (위키피디아 *Gypsophila* 는 "baby's-breath" 가 속 전체의 이름이면서 특히 *G. paniculata* 를 가리킨다고 적는다.)

### 2-5. 목련 — 같은 속이되 종이 다르다

ASPCA `Magnolia Bush` 는 ***Magnolia stellata***(별목련)다. 우리가 실을 것은 한국 자생 ***M. kobus***(목련)이고,
국내 가로수·정원의 흰 목련은 대개 중국 원산 ***M. denudata***(백목련)다.
- 셋 다 같은 *Magnolia* 속이라 **해바라기 때보다 근거가 가깝다**(그쪽은 종만 다른 게 아니라 자생 습성도 달랐다).
- `toxic=false / severity=none` 으로 두되, `flowers.editorial_note` 에 종 차이를 남긴다.

### 2-6. ASPCA 미등재 6종 — 부재를 어떻게 확인했나

**직접 슬러그 접근(404) + 알파벳 목록 페이지 전수 확인**을 둘 다 했다.
목록은 페이지당 15건이라, 해당 이름이 들어갈 알파벳 자리를 앞뒤로 감싸는 페이지를 열어 확인했다.

| 꽃 | 슬러그 직접 접근 | 목록 확인 | 결론 |
|---|---|---|---|
| forget-me-not | `/forget-me-not` → **404** | `F`(총 41건) page 1·2 — `Fluffy Ruffles` 다음이 곧바로 `Forster Sentry Palm` | 없음 |
| violet | `/violet` → **404** | `V` — `Vinca` · `Vining Peperomia` · **`Violet Slipper Gloxinia`** · `Viper's Bugloss` 순서에 단독 `Violet` 자리 없음 | 없음 |
| pansy | `/pansy` → **404** | `P`(총 91건) page 1 — `Panda Plant` 다음이 **`Pansy Orchid`**(난과 *Miltonia*), 단독 `Pansy` 없음 | 없음 |
| corn-poppy | `/poppy` → **404** | `P` page 6(76–90) — `Pony Tail` 다음이 곧바로 `Porcelain Flower` | 없음 |
| marigold | `/marigold` → **404** | `M`(총 72건) page 1(1–15, `…Marbled Fingernail`) · page 2(16–30, `Marijuana…`) — 그 사이에 없음 | 없음 (§2-7) |
| cosmos | `/cosmos` → **404** | `C`(총 137건) page 7(91–105, `…Confederate Jasmine`) · page 8(106–120, `Coolwort…Creeping Gloxinia`) — 그 사이에 없음 | 없음 |

대체 출처는 seed-v3 의 `lisianthus` 선례대로 **NC State Extension** 을 썼다.
이 DB 는 독성 식물에 `Poison Severity` 섹션을 붙이는데, 아래 다섯은 그 섹션이 아예 없다.

| 꽃 | NC State 페이지 | Poison 섹션 | 채택 |
|---|---|---|---|
| forget-me-not | *Myosotis sylvatica* | **없음** | `none` |
| violet | *Viola odorata* | **없음** (오히려 잎·꽃이 식용, 설탕절임 제비꽃) | `none` |
| pansy | *Viola × wittrockiana* | **없음** (꽃 식용 — 단, 농원 구입품은 살충제 처리 가능성 경고) | `none` |
| cosmos | *Cosmos bipinnatus* | **없음** | `none` |
| corn-poppy | *Papaver rhoeas* | **없음** | **§2-8 — Advisor 판단 필요** |
| marigold | *Tagetes erecta* | **있음** — `Poison Severity: Low` | **§2-7 — Advisor 판단 필요** |

### 2-7. 마리골드 — 해바라기와 정확히 반대인 종 불일치

**ASPCA 에 `Tagetes` 는 없다.** 마리골드라는 이름이 붙은 ASPCA 항목은 전부 다른 식물이다.

| ASPCA 항목 | 실제 학명 | 판정 |
|---|---|---|
| `Garden Marigold` / `Pot Marigold` / `Mary-Bud` / `Gold Bloom` / `Holligold` | ***Calendula officinalis*** (금잔화) | Non-Toxic |
| `Cape Marigold` | *Dimorphotheca* (아프리칸 데이지) | — |

죽은 자의 날에 쓰는 그 꽃, 국내에 절화·화분으로 도는 그 꽃은 ***Tagetes erecta*** 다. **서로 다른 속이다.**

NC State 의 *Tagetes erecta* 는 poison 섹션이 있다:
- `Poison Severity: Low`
- 증상: "Skin redness, burning pain, and blisters when broken skin is in contact with cell sap plus sunlight"
- 부위: flowers, roots, sap/juice

**이건 섭취 독성이 아니라 광독성 접촉 피부염이다.** 상처 난 피부에 수액이 닿고 거기에 햇빛이 더해질 때 생긴다.
개·고양이가 **먹었을 때**의 근거는 어느 자료에도 없었다.

- **권고: `toxic=false / severity=none`.** 근거 없이 등급을 만들지 않는다는 원칙(§1)을 따른다.
- 대신 `care_summary` 에 직설로 적는다 — "수액이 상처 난 피부에 닿은 채 햇빛을 보면 붉어지거나 물집이 생길 수
  있어요. 다룬 뒤에는 손을 씻어 주세요." (§1.5d: 안전 문구만은 직설 유지)
- `flowers.editorial_note` 에 **ASPCA 의 '마리골드'는 전부 금잔화라는 사실**을 남긴다.
  해바라기 때 남긴 문장과 같은 목적이다.
- Pet Poison Helpline 로 한 번 더 받치려 했으나 **두 번 다 접속 실패**(ECONNREFUSED)했다. → §6-2.

### 2-8. 개양귀비 — 이번 확장에서 가장 애매한 한 건

- ASPCA 에 `Papaver` 는 어느 이름으로도 없다(§2-6).
- NC State *Papaver rhoeas* 에도 poison 섹션이 없다.
- **그런데** 위키피디아 *Papaver rhoeas* 는 **로에아딘(rhoeadine, 약한 진정 성분)** 을 비롯해
  로에아드산 · 로에아게닌 같은 알칼로이드를 함유한다고 적는다. "성분이 확인된다"와 "독성 근거가 없다"가
  동시에 성립하는 상태다.
- 한국어 위키백과 *개양귀비* 는 **"개양귀비로는 마약을 만들 수 없어 양귀비와 달리 재배를 규제받지 않는다"**
  고 적는다. 마약 성분은 아니라는 뜻이지 무해하다는 뜻은 아니다.

**두 선택지와 근거를 그대로 올린다 — Advisor 판단(§6-3).**

| 안 | 근거 | 위험 |
|---|---|---|
| **A. `toxic=false / severity=none`** (권고) | ASPCA·NC State 어느 쪽도 독성으로 적지 않았다. 리시안셔스 선례와 같은 처리 | 알칼로이드 함유가 1차 자료로 확인된 것을 데이터에서 지우게 된다 |
| B. `toxic=true / severity=mild_gi` | 알칼로이드 함유 확인 + 개·고양이는 체중이 작다. 은방울꽃 때 "사람 기준 등급을 그대로 쓰지 않는다"고 판단한 것과 같은 논리 | 어느 자료도 개·고양이 증상을 적지 않았는데 우리가 등급을 만들어 내는 셈 |

**작성자 권고는 A 다.** 다만 어느 쪽을 고르든 `care_summary` 에는
"약한 진정 성분이 들어 있어요. 반려동물이 뜯어 먹지 않게 손 닿지 않는 곳에 두세요"를 넣기를 권한다.
성분 서술은 1차 자료로 확인된 사실이라 이 문장은 어느 안에서도 정직하다.

### 2-9. 재스민 — 이름만 같은 다른 식물이 여럿이다

ASPCA 의 `Jasmine`(*Jasminum species*)은 비독성이다. 그런데 같은 목록에
**이름에 '재스민'이 들어가되 전혀 다른 식물**이 여럿 있고, 그중에는 독성인 것도 있다.

| ASPCA 항목 | 실제 정체 |
|---|---|
| `Cape Jasmine` | *Gardenia jasminoides* (치자) — **독성으로 등재** |
| `Madagascar Jasmine` · `Paraguayan Jasmine` · `Confederate Jasmine` | 각각 다른 과의 식물 |

→ `care_summary` 와 `story-jasmine-not-jasmine` 양쪽에 "재스민이라는 이름이 붙은 다른 꽃도 많아요"를 남긴다.
이 카탈로그에서 **안전 정보가 이야기 소재가 되는 첫 사례**다.

### 2-10. 신규 14종 `pet_safety.csv` 행 (28행)

`safe_alternative_flower_ids` 는 **계절이 겹치는 안전한 꽃**을 우선으로 골랐다
(기존 관행인 `freesia|gerbera|sunflower|lisianthus` 에 신규 안전종을 섞음).

| flower_id | species | toxic | severity | toxic_parts | safe_alternative_flower_ids | source_url |
|---|---|---|---|---|---|---|
| narcissus | cat | true | serious | `bulb\|flower\|leaf\|stem` | `freesia\|camellia\|violet\|pansy` | ASPCA Daffodil |
| narcissus | dog | true | serious | `bulb\|flower\|leaf\|stem` | `freesia\|camellia\|violet\|pansy` | ASPCA Daffodil |
| forget-me-not | cat | false | none | | | NC State *Myosotis sylvatica* |
| forget-me-not | dog | false | none | | | NC State *Myosotis sylvatica* |
| cherry-blossom | cat | true | serious | `leaf\|stem\|seed` | `camellia\|magnolia\|violet\|freesia` | ASPCA Cherry |
| cherry-blossom | dog | true | serious | `leaf\|stem\|seed` | `camellia\|magnolia\|violet\|freesia` | ASPCA Cherry |
| camellia | cat | false | none | | | ASPCA Camellia |
| camellia | dog | false | none | | | ASPCA Camellia |
| violet | cat | false | none | | | NC State *Viola odorata* |
| violet | dog | false | none | | | NC State *Viola odorata* |
| iris | cat | true | mild_gi | `rhizome\|root\|flower\|leaf\|stem` | `freesia\|gerbera\|camellia\|babys-breath` | ASPCA Iris |
| iris | dog | true | mild_gi | `rhizome\|root\|flower\|leaf\|stem` | `freesia\|gerbera\|camellia\|babys-breath` | ASPCA Iris |
| marigold | cat | false | none | | | NC State *Tagetes erecta* (§2-7) |
| marigold | dog | false | none | | | NC State *Tagetes erecta* (§2-7) |
| corn-poppy | cat | false | none | | | NC State *Papaver rhoeas* (§2-8 — 판단 필요) |
| corn-poppy | dog | false | none | | | NC State *Papaver rhoeas* (§2-8 — 판단 필요) |
| jasmine | cat | false | none | | | ASPCA Jasmine |
| jasmine | dog | false | none | | | ASPCA Jasmine |
| babys-breath | cat | false | none | | | ASPCA Baby's Breath |
| babys-breath | dog | false | none | | | ASPCA Baby's Breath |
| cosmos | cat | false | none | | | NC State *Cosmos bipinnatus* |
| cosmos | dog | false | none | | | NC State *Cosmos bipinnatus* |
| magnolia | cat | false | none | | | ASPCA Magnolia Bush |
| magnolia | dog | false | none | | | ASPCA Magnolia Bush |
| pansy | cat | false | none | | | NC State *Viola × wittrockiana* |
| pansy | dog | false | none | | | NC State *Viola × wittrockiana* |
| poinsettia | cat | true | mild_gi | `sap\|leaf\|stem\|flower` | `camellia\|babys-breath\|gerbera\|freesia` | ASPCA Poinsettia |
| poinsettia | dog | true | mild_gi | `sap\|leaf\|stem\|flower` | `camellia\|babys-breath\|gerbera\|freesia` | ASPCA Poinsettia |

**이번 확장의 안전 지형 변화**: 신규 14종 중 **10종이 비독성**이다.
현재 카탈로그는 17종 중 비독성이 4종(`rose-red` `freesia` `gerbera` `sunflower` `lisianthus`)뿐이라
"반려동물 있는 집" 필터를 걸면 선택지가 급격히 줄었다. 특히 **겨울(동백) · 봄(제비꽃 · 목련) · 가을(코스모스)**
안전종이 새로 생기는 것이 크다.

---

## 3. 열람 확인한 자료 목록 (신규)

**아래는 전부 실제로 열어서 내용을 확인한 URL 이다.** 열지 못한 것은 §7 하단에 따로 적었다.

### 3-1. ASPCA — 개별 항목

| source_id | 자료 | URL |
|---|---|---|
| `aspca-daffodil` | Daffodil (*Narcissus spp*) | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/daffodil |
| `aspca-cherry` | Cherry (*Prunus spp.*) | https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/cherry |
| `aspca-iris` | Iris (*Iris species*) | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/iris |
| `aspca-poinsettia` | Poinsettia (*Euphorbia pulcherrima*) | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/poinsettia |
| `aspca-camellia` | Camellia (*Camellia japonica*) — 비독성 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/camellia |
| `aspca-jasmine` | Jasmine (*Jasminum species*) — 비독성 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/jasmine |
| `aspca-babys-breath` | Baby's Breath (*Gypsophila elegans*) — 비독성 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/babys-breath |
| `aspca-magnolia-bush` | Magnolia Bush (*Magnolia stellata*) — 비독성 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/magnolia-bush |
| `aspca-garden-marigold` | Garden Marigold (*Calendula officinalis*) — **Tagetes 아님** | https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/garden-marigold |

### 3-2. ASPCA — 부재 확인용 목록 페이지 (§2-6 근거)

| 확인한 것 | URL |
|---|---|
| `F` 목록 page 1 (1–15 of 41) | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/f |
| `F` 목록 마지막 페이지 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/f?page=2 |
| `V` 목록 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/v |
| `C` 목록 page 1 (1–15 of 137) | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/c |
| `C` 목록 91–105 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/c?page=6 |
| `C` 목록 106–120 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/c?page=7 |
| `M` 목록 1–15 (of 72) | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/m?page=0 |
| `M` 목록 16–30 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/m?page=1 |
| `M` 목록 46–60 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/m?page=3 |
| `P` 목록 1–15 (of 91) | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/p?page=0 |
| `P` 목록 16–30 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/p?page=1 |
| `P` 목록 61–75 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/p?page=4 |
| `P` 목록 76–90 | https://www.aspca.org/pet-care/animal-poison-control/toxic-and-non-toxic-plants/p?page=5 |
| 고양이 전체 목록 (내용 잘림 확인) | https://www.aspca.org/pet-care/animal-poison-control/cats-plant-list |

### 3-3. NC State Extension

| source_id | 자료 | URL |
|---|---|---|
| `ncstate-myosotis-sylvatica` | *Myosotis sylvatica* | https://plants.ces.ncsu.edu/plants/myosotis-sylvatica/ |
| `ncstate-viola-odorata` | *Viola odorata* | https://plants.ces.ncsu.edu/plants/viola-odorata/ |
| `ncstate-viola-wittrockiana` | *Viola × wittrockiana* | https://plants.ces.ncsu.edu/plants/viola-x-wittrockiana/ |
| `ncstate-tagetes-erecta` | *Tagetes erecta* | https://plants.ces.ncsu.edu/plants/tagetes-erecta/ |
| `ncstate-papaver-rhoeas` | *Papaver rhoeas* | https://plants.ces.ncsu.edu/plants/papaver-rhoeas/ |
| `ncstate-cosmos-bipinnatus` | *Cosmos bipinnatus* | https://plants.ces.ncsu.edu/plants/cosmos-bipinnatus/ |

### 3-4. 퍼블릭 도메인 꽃말 원전

| source_id | 자료 | URL |
|---|---|---|
| `greenaway-1884` | Kate Greenaway, *Language of Flowers* (1884) — PD | https://www.gutenberg.org/ebooks/31591 |
| `dumont-1851` | Henrietta Dumont, *The Language of Flowers* (1851) — PD | https://www.gutenberg.org/ebooks/71779 |

> Greenaway 는 이번 14종 중 **9종**을 담고 있어 이번 확장의 주력 꽃말 출처가 됐다.
> Dumont 는 열람한 발췌본이 목차 중심이라 확인된 항목이 7건뿐이다 — 뒷받침용으로만 썼다.
> **안개꽃 · 코스모스 · 포인세티아 세 꽃은 두 원전 어디에도 없다**(19세기 서양 꽃말 사전에 아직 없던 꽃).
> 이 세 꽃의 꽃말이 얇은 이유이며, `lisianthus` 와 같은 상황이다.

### 3-5. 위키피디아 (영어)

| source_id | 자료 | URL |
|---|---|---|
| `wikipedia-narcissus-myth` | Narcissus (mythology) | https://en.wikipedia.org/wiki/Narcissus_(mythology) |
| `wikipedia-narcissus-plant` | Narcissus (plant) | https://en.wikipedia.org/wiki/Narcissus_(plant) |
| `wikipedia-myosotis` | Myosotis | https://en.wikipedia.org/wiki/Myosotis |
| `wikipedia-cherry-blossom` | Cherry blossom | https://en.wikipedia.org/wiki/Cherry_blossom |
| `wikipedia-hanami` | Hanami | https://en.wikipedia.org/wiki/Hanami |
| `wikipedia-prunus-yedoensis` | Prunus × yedoensis | https://en.wikipedia.org/wiki/Prunus_%C3%97_yedoensis |
| `wikipedia-camellia-japonica` | Camellia japonica | https://en.wikipedia.org/wiki/Camellia_japonica |
| `wikipedia-camellia` | Camellia | https://en.wikipedia.org/wiki/Camellia |
| `wikipedia-dame-aux-camelias` | The Lady of the Camellias | https://en.wikipedia.org/wiki/The_Lady_of_the_Camellias |
| `wikipedia-viola-odorata` | Viola odorata | https://en.wikipedia.org/wiki/Viola_odorata |
| `wikipedia-viola` | Viola (plant) | https://en.wikipedia.org/wiki/Viola_(plant) |
| `wikipedia-iris-myth` | Iris (mythology) | https://en.wikipedia.org/wiki/Iris_(mythology) |
| `wikipedia-iris-plant` | Iris (plant) | https://en.wikipedia.org/wiki/Iris_(plant) |
| `wikipedia-fleur-de-lis` | Fleur-de-lis | https://en.wikipedia.org/wiki/Fleur-de-lis |
| `wikipedia-irises-painting` | Irises (painting) | https://en.wikipedia.org/wiki/Irises_(painting) |
| `wikipedia-tagetes-erecta` | Tagetes erecta | https://en.wikipedia.org/wiki/Tagetes_erecta |
| `wikipedia-papaver-rhoeas` | Papaver rhoeas | https://en.wikipedia.org/wiki/Papaver_rhoeas |
| `wikipedia-remembrance-poppy` | Remembrance poppy | https://en.wikipedia.org/wiki/Remembrance_poppy |
| `wikipedia-jasmine` | Jasmine | https://en.wikipedia.org/wiki/Jasmine |
| `wikipedia-jasminum-sambac` | Jasminum sambac | https://en.wikipedia.org/wiki/Jasminum_sambac |
| `wikipedia-gypsophila` | Gypsophila | https://en.wikipedia.org/wiki/Gypsophila |
| `wikipedia-gypsophila-paniculata` | Gypsophila paniculata | https://en.wikipedia.org/wiki/Gypsophila_paniculata |
| `wikipedia-cosmos-plant` | Cosmos (plant) | https://en.wikipedia.org/wiki/Cosmos_(plant) |
| `wikipedia-cosmos-atrosanguineus` | Cosmos atrosanguineus | https://en.wikipedia.org/wiki/Cosmos_atrosanguineus |
| `wikipedia-magnolia` | Magnolia | https://en.wikipedia.org/wiki/Magnolia |
| `wikipedia-pansy` | Pansy | https://en.wikipedia.org/wiki/Pansy |
| `wikipedia-viola-tricolor` | Viola tricolor | https://en.wikipedia.org/wiki/Viola_tricolor |
| `wikipedia-poinsettia` | Poinsettia | https://en.wikipedia.org/wiki/Poinsettia |
| `wikipedia-hanakotoba` | Hanakotoba | https://en.wikipedia.org/wiki/Hanakotoba |

### 3-6. 위키백과 (한국어)

| source_id | 자료 | URL |
|---|---|---|
| `wikipedia-ko-dongbaek` | 동백나무 | https://ko.wikipedia.org/wiki/동백나무 |
| `wikipedia-ko-mokryeon` | 목련 | https://ko.wikipedia.org/wiki/목련 |
| `wikipedia-ko-suseonhwa` | 수선화 | https://ko.wikipedia.org/wiki/수선화 |
| `wikipedia-ko-gaeyanggwibi` | 개양귀비 | https://ko.wikipedia.org/wiki/개양귀비 |
| `wikipedia-ko-jebikkot` | 제비꽃 | https://ko.wikipedia.org/wiki/제비꽃 |
| `wikipedia-ko-jeju-beotnamu` | 제주벚나무 | https://ko.wikipedia.org/wiki/제주벚나무 |
| `wikipedia-ko-angaekkot` | 안개꽃 | https://ko.wikipedia.org/wiki/안개꽃 |

### 3-7. 언론·기타 (§1 저작권 처리 적용)

| source_id | 자료 | URL |
|---|---|---|
| `khan-chusa-narcissus` | 경향신문 「이선의 인물과 식물」 — 추사 김정희와 수선화 | https://www.khan.co.kr/article/202602232009005/ |
| `kookje-jeju43-camellia` | 국제신문 — 제주 4·3 의 상징이 동백꽃인 이유 | https://www.kookje.co.kr/news2011/asp/newsbody.asp?code=0300&key=20190403.99099001355 |
| `mexiconewsdaily-poinsettia` | Mexico News Daily — Poinsettia, from obscure Mexican weed to the 'Christmas flower' | https://mexiconewsdaily.com/culture/poinsettia-from-obscure-mexican-weed-to-the-christmas-flower/ |

---

## 4. 꽃별 수집 데이터

각 꽃마다 **① 카탈로그 행 ② 꽃말 ③ 이야기(리텔링 초안 포함)** 순으로 적는다.
`reviewed_at` 은 전부 `2026-08-15`, `reviewer` 는 `content-team`.
`aesthetic_tags` 는 기존 어휘 5종(`vivid` `elegant` `minimal` `calm` `cute`)에서만 골랐다.

---

### 4-1. `narcissus` — 수선화

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `narcissus` |
| `name_ko` | 수선화 |
| `name_en` | Daffodil |
| `scientific_name` | *Narcissus pseudonarcissus* |
| `colors` | `yellow\|white\|cream\|orange\|pink` |
| `bloom_months` | `12\|1\|2\|3\|4` |
| `fragrance_level` | `2` — 위키피디아 *Narcissus (plant)*: 모든 수선화가 향이 있는 건 아니고 종차가 크다. *N. poeticus* 는 "취할 듯한" 향. 제주 자생 *N. tazetta* 계열은 향이 진하다 |
| `price_band` | `1` — 구근 절화, 국내 유통가 낮음 |
| `aesthetic_tags` | `minimal\|elegant` |
| `care_summary` | "알뿌리가 가장 위험해요. 화분이라면 흙 위로 드러난 알뿌리를 덮어 주시고, 아이·반려동물 손이 닿지 않게 해주세요. 줄기를 자르면 나오는 진액이 다른 꽃을 상하게 하니, 따로 물에 하루 담갔다가 합쳐 주세요." |
| `editorial_note` | "제주 자생 수선화(*N. tazetta* 계열)와 절화 주력인 나팔수선화(*N. pseudonarcissus*)를 한 id 로 묶음 — `peony`(작약·모란) 선례와 같은 처리. 김정희 이야기의 주인공은 *N. tazetta* 쪽이라 해당 행 `editorial_note` 에 명시. `bloom_months` 에 12~2월을 넣은 것은 제주 자생종과 촉성재배 유통 기준" |

**꽃말 4행**

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| | 눈여겨보는 마음 — 곁에 두고 계속 바라보게 되는 사람에게 | victorian | 19c | `greenaway-1884` | repeated |
| | 자기 자신에게 빠진 마음 | victorian | 19c | `greenaway-1884` | repeated |
| yellow | 답장을 기다리는 마음 — 건넨 마음이 돌아오길 바랄 때 | victorian | 19c | `greenaway-1884` | single_source |
| | 스스로를 귀하게 여기는 일 | japan | modern | `wikipedia-hanakotoba` | repeated |

- PD 원문(`editorial_note` 용): `'Daffodil — Regard'` · `'Narcissus — Egotism'` · `'Jonquil — I desire a return of affection'` (Greenaway 1884),
  `'Narcissus and Daffodil, (Self-love)'` (Dumont 1851), 하나코토바 `水仙 — Self-esteem`
- **한 꽃 안에서 '바라봄'과 '자기애'가 갈라진다.** 같은 사전이 Daffodil 은 `Regard`, Narcissus 는 `Egotism` 으로
  다르게 적어 둔 것 — 색이 아니라 **이름에 따라 뜻이 갈리는** 첫 사례다. UI 에서 흥미로운 카드가 된다.

**이야기 5편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-narcissus-echo` | 자기 얼굴에 빠진 사람 | `mythic\|tragic` | `just_because` | folklore | repeated | `wikipedia-narcissus-myth` |
| `story-narcissus-twin-sister` | 그가 본 것이 누이였다는 이야기 | `tragic\|healing\|mythic` | `comfort` | folklore | single_source | `wikipedia-narcissus-myth` |
| `story-narcissus-not-named-after` | 이 꽃은 그의 이름에서 오지 않았다 | `funny\|dramatic` | `just_because` | history | repeated | `wikipedia-narcissus-plant` |
| `story-narcissus-jeju-chusa` | 말이 먹던 꽃 | `tragic\|healing\|dramatic` | `comfort` | history | single_source | `khan-chusa-narcissus` |
| `story-narcissus-daffodil-day` | 3월 1일의 노란 꽃 | `healing` | `comfort\|gratitude` | history | repeated | `wikipedia-narcissus-plant` |

**리텔링 초안**

- **`story-narcissus-echo`**
  `hook`: "예언은 이랬어요 — 자기 자신을 알지 못해야 오래 산다."
  `story_ko`: "테이레시아스는 나르키소스가 오래 살려면 자기 자신을 알지 못해야 한다고 했어요. 그 말을 아무도
  이해하지 못했지요. 숲의 요정 에코는 헤라의 벌로 남의 말끝만 되풀이할 수 있었는데, 그런 채로 나르키소스를
  따라다니다 거절당하고 목소리만 남을 때까지 여위었습니다. 복수의 여신 네메시스가 나선 뒤, 나르키소스는
  맑은 샘가에서 물에 비친 얼굴을 보고 그것이 자기인 줄 모른 채 사랑에 빠졌어요. 오비디우스는 그가 그 불길에
  녹아 사라지고, 그 자리에 금빛과 흰빛의 꽃 한 송이가 남았다고 적었습니다."
  `era`: `ancient` · `culture_region`: `greece-rome`

- **`story-narcissus-twin-sister`** ← **반전 카드**
  `hook`: "2세기의 한 여행가는 전혀 다른 이야기를 적어 두었어요."
  `story_ko`: "우리가 아는 이야기는 오비디우스의 것이에요. 그런데 2세기의 여행 기록가 파우사니아스는 같은
  이야기를 다르게 적었습니다. 나르키소스가 물에서 본 것은 자기 얼굴이 아니라 먼저 세상을 떠난 쌍둥이 누이의
  얼굴이었다고요. 그 판본에서 이 이야기는 자기애가 아니라 그리움의 이야기가 됩니다. 닮은 얼굴을 물에서 찾다가
  거기 머물러 버린 사람의 이야기요. 어느 쪽이 먼저인지는 알 수 없지만, 같은 꽃을 두고 두 갈래가 함께
  전해져 왔어요."
  `era`: `2c` · `editorial_note`: "위키피디아가 '새로운 변형(novel variant)'이라 표기 — confidence single_source"

- **`story-narcissus-not-named-after`** ← **도파민 반전**
  `hook`: "수선화라는 이름은, 사실 나르키소스에게서 오지 않았습니다."
  `story_ko`: "누구나 이 꽃 이름이 나르키소스에게서 왔다고 알고 있어요. 그런데 그 근거는 어디에도 없습니다.
  플루타르코스는 '마비'를 뜻하는 나르케에서 왔다고 적었고, 플리니우스도 향이 사람을 멍하게 만든다는 뜻의
  나르카오에서 왔다고 했어요. 이 꽃은 신화가 만들어지기 훨씬 전부터 자라고 있었고, 어원학자들은 아예
  그리스어보다 오래된 말이라고 봅니다. 이름이 먼저였고, 이야기가 나중에 그 이름에 들러붙은 셈이에요."
  `era`: `ancient` · `culture_region`: `greece-rome`

- **`story-narcissus-jeju-chusa`** ← **한국 소재**
  `hook`: "제주에서는 말이 뜯어 먹고, 밭 갈 때 뽑아 버리던 꽃이었어요."
  `story_ko`: "추사 김정희는 쉰다섯에 제주 대정으로 유배되어 여덟 해를 보냈어요. 그는 수선화를 두고 천하의
  구경거리라 했습니다. 정월 그믐에 피기 시작해 이월 삼월이면 산과 들과 밭두둑이 흰 구름이나 흰 눈을 덮어 놓은
  것 같다고 적었지요. 그런데 정작 제주 사람들에게 그건 잡초였어요. 소와 말에게 먹이고, 밭을 갈 때는 호미로
  파내 버렸습니다. 귀한 것도 제자리가 아니면 알아보는 이가 없다는 걸, 유배지의 그가 꽃에서 읽은 거예요."
  `era`: `19c` · `culture_region`: `korea`
  `editorial_note`: "경향신문 「이선의 인물과 식물」 기사 근거. 기사 문장은 옮기지 않고 사실만 참고해 새로 씀.
  주인공은 제주 자생 *Narcissus tazetta* 계열로, 절화 주력인 나팔수선화와는 종이 다름. 상업화 시점에 1차 사료
  (완당집 등)로 재확인 권장"

- **`story-narcissus-daffodil-day`**
  `hook`: "많은 나라에서 이 꽃은 암 환우를 위한 꽃이에요."
  `story_ko`: "수선화는 웨일스의 나라꽃이고, 3월 1일 성 다윗의 날이면 사람들이 옷깃에 답니다. 그리고 여러
  나라에서 암 환우를 돕는 단체의 상징이 되었어요. 영국의 마리 퀴리, 미국암학회의 대포딜 데이가 그렇습니다.
  겨울 끝에 가장 먼저 올라오는 꽃이라 그런 자리를 맡게 된 게 아닐까요. 흥미롭게도 이 꽃에서 뽑은 갈란타민은
  실제로 알츠하이머 치료제로 쓰이고 있습니다."
  `era`: `modern` · `culture_region`: `western`

---

### 4-2. `forget-me-not` — 물망초

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `forget-me-not` |
| `name_ko` | 물망초 |
| `name_en` | Forget-Me-Not |
| `scientific_name` | *Myosotis sylvatica* |
| `colors` | `blue\|pink\|white` |
| `bloom_months` | `4\|5\|6` |
| `fragrance_level` | `0` — NC State·위키피디아 모두 향 서술 없음 |
| `price_band` | `1` |
| `aesthetic_tags` | `cute\|calm\|minimal` |
| `care_summary` | "작은 꽃이 줄줄이 달려 있어요. 시든 꽃만 떼어 내면 뒷꽃이 이어서 핍니다. 물에 잠기는 잎은 떼고 꽂아 주세요." |
| `editorial_note` | "ASPCA 미등재(F 목록 41건 전수 확인) — pet_safety 근거는 NC State. NC State 는 4~5월 개화에 한여름 산발 개화를 덧붙임" |

**꽃말 4행**

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| | 진실한 사랑 — 나를 잊지 말아요 | victorian | 19c | `greenaway-1884` | repeated |
| | 진실한 사랑 | japan | modern | `wikipedia-hanakotoba` | repeated |
| blue | 잊지 않겠다는 약속 — 기억을 잃어 가는 이를 곁에서 지키는 마음 | western | modern | `wikipedia-myosotis` | repeated |
| blue | 먼저 간 이들을 기억하는 일 | armenia | modern | `wikipedia-myosotis` | single_source |

- **동서가 정확히 일치하는 드문 꽃**이다. Greenaway 1884 는 `'Forget Me Not — True love. Forget me not.'`,
  일본 하나코토바 `勿忘草` 도 `True love`. 국화(문화권마다 정반대)와 정확히 반대 사례라 대비 카드로 좋다.

**이야기 4편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-forget-me-not-danube` | 강물에 휩쓸리며 던진 꽃 | `romantic\|tragic\|dramatic` | `confession\|comfort` | folklore | repeated | `wikipedia-myosotis` |
| `story-forget-me-not-freemason` | 나치의 배지와 똑같이 생긴 꽃 | `dramatic\|healing` | `just_because` | history | repeated | `wikipedia-myosotis` |
| `story-forget-me-not-remembrance` | 잊지 않기 위해 다는 꽃 | `healing\|tragic` | `comfort\|gratitude` | history | repeated | `wikipedia-myosotis` |
| `story-forget-me-not-mouse-ear` | 세상에서 가장 로맨틱한 이름의 학명 | `funny` | `just_because` | history | repeated | `wikipedia-myosotis` |

**리텔링 초안**

- **`story-forget-me-not-danube`**
  `hook`: "물에 휩쓸리면서 그가 던진 건 꽃이었어요."
  `story_ko`: "중세 독일에서 전해지는 이야기예요. 한 기사가 연인과 도나우 강가를 걷다가, 물가에 핀 파란 꽃을
  꺾어 주려고 손을 뻗었어요. 그러다 발을 헛디뎌 강물에 빠졌고, 물살에 쓸려 가면서 손에 쥔 꽃다발을 강가로
  던졌습니다. 마지막으로 남긴 말이 '나를 잊지 말아요'였어요. 이 이야기 하나 때문에 이 꽃은 유럽 전역에서
  변치 않는 사랑을 뜻하게 됐습니다. 이름도 여러 나라 말에서 똑같이 '나를 잊지 마'예요."
  `era`: `medieval` · `culture_region`: `germany`

- **`story-forget-me-not-freemason`** ← **최고 반전 카드**
  `hook`: "1938년, 프리메이슨은 나치의 배지를 달고 서로를 알아봤어요."
  `story_ko`: "1926년 브레멘의 한 프리메이슨 지부가 물망초를 상징으로 삼았습니다. 그런데 1938년, 나치 독일이
  자선 모금 운동의 배지로 우연히 똑같은 도안을 만들어 뿌렸어요. 결사가 금지되어 있던 프리메이슨 회원들은
  그 배지를 아무렇지 않게 옷깃에 달 수 있게 됐습니다. 나라가 나눠 준 배지를 달고, 서로를 알아본 거예요.
  전쟁이 끝난 1948년, 그 꽃은 그 시절을 견딘 사람들을 기리는 정식 상징이 되었습니다."
  `era`: `20c` · `culture_region`: `germany`

- **`story-forget-me-not-remembrance`**
  `hook`: "이 꽃을 다는 날이 나라마다 있어요."
  `story_ko`: "뉴펀들랜드 사람들은 7월 1일과 11월 11일이면 물망초를 답니다. 1차 대전 보몽아멜에서 돌아오지
  못한 이들을 위해서예요. 리투아니아에서는 1991년 1월의 일을 기억하려고 이 꽃을 씁니다. 2015년 아르메니아
  집단학살 100주기의 추모 엠블럼도 물망초였어요. 도안 안에 지난 고통과 지금의 하나 됨, 앞으로의 희망,
  그리고 잃어버린 열두 지역이 함께 들어가 있습니다. 이름 그대로 쓰이고 있는 꽃이에요."
  `era`: `modern` · `culture_region`: `western`

- **`story-forget-me-not-mouse-ear`** ← **유쾌**
  `hook`: "학명을 우리말로 옮기면 '쥐의 귀'예요."
  `story_ko`: "세상에서 가장 로맨틱한 이름을 가진 꽃인데, 학명은 미오소티스(Myosotis)입니다. 고대 그리스어로
  '쥐의 귀'라는 뜻이에요. 잎이 작고 도톰하고 털이 보송해서 그렇게 보였다는 거지요. 그러니까 이 꽃은
  일상 이름으로는 '나를 잊지 말아요'이고, 학술 이름으로는 '쥐 귀'입니다. 어느 쪽으로 부를지는 그날 기분에
  맡기셔도 좋겠어요."
  `era`: `ancient`

---

### 4-3. `cherry-blossom` — 벚꽃

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `cherry-blossom` |
| `name_ko` | 벚꽃 |
| `name_en` | Cherry Blossom |
| `scientific_name` | *Prunus serrulata* |
| `colors` | `pink\|white\|cream\|magenta` |
| `bloom_months` | `3\|4` |
| `fragrance_level` | `1` — 생화 향은 약하다. 위키피디아·ASPCA 어느 쪽에도 향 서술이 없어 낮게 잡음 |
| `price_band` | `2` — 개화지(꽃가지) 유통 |
| `aesthetic_tags` | `elegant\|calm\|minimal` |
| `care_summary` | "떨어진 잎과 잔가지는 그날그날 치워 주세요. 시들면서 오히려 더 위험해집니다. 가지 끝을 세로로 갈라 주면 물올림이 좋아요." |
| `editorial_note` | "절화·개화지 유통 기준 *Prunus serrulata*. 이야기 속 종은 소메이요시노(*P.* × *yedoensis*)와 제주 왕벚나무(*P.* × *nudiflora*)로 각각 다르며, 해당 행 `editorial_note` 에 명시. ASPCA `Cherry` 항목은 *Prunus* spp. 로 속 전체를 다뤄 그대로 적용" |

**꽃말 4행**

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| pink | 다정함, 그리고 지나가는 것들의 아름다움 | japan | modern | `wikipedia-hanakotoba` | repeated |
| white | 속임 — 겉과 속이 다를 때 | victorian | 19c | `greenaway-1884` | single_source |
| | 곧 스러질 것을 알고도 마음을 다하는 일 | japan | 18c | `wikipedia-cherry-blossom` | repeated |
| | 봄이 왔다는 소식 | japan | ancient | `wikipedia-hanami` | repeated |

- **문화권 대비가 극단적이다.** 일본은 `다정함·덧없음`, 빅토리아 사전은 `'Cherry Tree, White — Deception'`(속임).
  국화(國花) 다음으로 대비가 큰 사례.
- `mono no aware`(모노노아와레)는 18세기 학자 모토오리 노리나가의 개념이라는 사실을 `editorial_note` 에 남긴다.

**이야기 5편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-cherry-was-plum` | 원래는 매화를 보던 자리였어요 | `dramatic\|healing` | `just_because` | history | repeated | `wikipedia-hanami` |
| `story-cherry-hana-yori-dango` | 꽃보다 경단 | `funny` | `just_because\|celebration` | history | repeated | `wikipedia-hanami` |
| `story-cherry-jeju-king-cherry` | 제주 왕벚나무는 남의 것이 아니었다 | `dramatic\|healing` | `just_because` | history | repeated | `wikipedia-prunus-yedoensis` |
| `story-cherry-zensen` | 꽃 피는 날을 예보하는 나라 | `funny\|healing` | `just_because` | history | repeated | `wikipedia-cherry-blossom` |
| `story-cherry-wartime` | 아름다운 상징이 쓰인 자리 | `tragic\|dramatic` | `comfort` | history | repeated | `wikipedia-cherry-blossom` |

**리텔링 초안**

- **`story-cherry-was-plum`** ← **반전**
  `hook`: "천 년 전 사람들이 꽃 보러 나간 건 벚꽃이 아니었어요."
  `story_ko`: "나라 시대의 하나미는 매화를 보는 자리였습니다. 매화 아래에서 시를 읊고 술을 마시던 중국 풍습을
  들여온 것이었어요. 벚꽃으로 자리가 넘어간 건 헤이안 시대입니다. 그때부터 와카에서도 하이쿠에서도 그냥
  '꽃'이라고만 쓰면 벚꽃을 뜻하게 됐어요. 기록으로 남은 첫 벚꽃 관람은 812년, 니혼코키에 적혀 있습니다.
  그 뒤로 천이백 년이 이어졌지요."
  `era`: `8-9c` · `culture_region`: `japan`

- **`story-cherry-hana-yori-dango`** ← **유쾌**
  `hook`: "일본에는 '꽃보다 경단'이라는 말이 있어요."
  `story_ko`: "하나요리 당고, 꽃보다 경단이라는 말이 있습니다. 벚꽃 아래 자리를 깔고 앉은 사람들이 정작 꽃은
  몇 번 올려다보지도 않고 먹고 마시는 데 열중하더라는 뜻이에요. 처음엔 귀족들만의 자리였던 하나미가 에도
  시대에 이르러 누구나 나가 앉는 자리가 되면서 생긴 말입니다. 도쿠가와 요시무네가 사람들 다니는 곳에
  벚나무를 심게 한 덕이 컸어요. 꽃이 만인의 것이 되자 곧바로 안주 얘기가 나왔다는 게, 어쩐지 정겹지요."
  `era`: `edo` · `culture_region`: `japan`

- **`story-cherry-jeju-king-cherry`** ← **한국 소재 · 명예 프레이밍**
  `hook`: "백 년 논쟁의 결말은, 제주 벚나무가 별개의 종이었다는 것이었어요."
  `story_ko`: "1908년 프랑스 신부가 제주에서 야생 벚나무를 발견하면서 긴 논쟁이 시작됐어요. 1912년 독일
  식물학자가 이 나무에 학명을 붙였고, 1933년에는 일본 식물학자가 소메이요시노의 고향이 제주라고 발표했지요.
  '가져간 것'이라는 이야기가 오래 돌았습니다. 그런데 여러 차례의 유전자 연구가 답을 내놨어요. 소메이요시노는
  일본에서 두 종을 교배해 만든 잡종이고, 세계의 소메이요시노는 전부 그 한 그루에서 갈라진 복제나무입니다.
  그리고 제주에서 자라는 나무는 그것과 계통이 다른 별개의 자생종이었어요. 2016년 왕벚나무는 자기 학명을
  따로 받았습니다. 빼앗긴 것이 아니라, 처음부터 다른 나무였던 거예요."
  `era`: `20-21c` · `culture_region`: `korea-japan`
  `editorial_note`: "영어 위키피디아 *Prunus × yedoensis* 와 한국어 위키백과 *제주벚나무* 를 함께 확인.
  두 문서 모두 '소메이요시노 = 일본 인공 잡종, 제주 왕벚나무 = 별개 자생종'으로 정리한다.
  어느 쪽을 깎는 서술이 되지 않도록 '누가 가져갔나'가 아니라 '무엇이 밝혀졌나'로 서술함"

- **`story-cherry-zensen`**
  `hook`: "기상청이 꽃 피는 날을 예보하는 나라가 있어요."
  `story_ko`: "일본에는 사쿠라 젠센, 벚꽃 전선이라는 말이 있습니다. 남쪽에서 시작해 북쪽으로 올라가는 개화
  시기를 지도 위에 선으로 그린 거예요. 오래도록 기상청이 이 예보를 냈고, 2009년부터는 민간 예보 회사들이
  그 자리를 이어받았습니다. 기상청은 대신 관측 자료를 쌓는 쪽으로 옮겨 갔어요. 비가 언제 오는지를 알려 주는
  기관이 꽃이 언제 피는지도 알려 준다는 게, 생각해 보면 다정한 일입니다."
  `era`: `modern` · `culture_region`: `japan`

- **`story-cherry-wartime`** ← **명예 프레이밍 필요**
  `hook`: "같은 꽃이 정반대의 자리에 쓰인 적이 있어요."
  `story_ko`: "벚꽃은 오래 덧없음의 상징이었어요. 지는 것을 슬퍼하는 대신 그 짧음을 아름답게 여기는 마음이요.
  그런데 2차 대전 무렵, 이 상징은 다른 자리에 놓입니다. '꽃 중에는 벚꽃, 사람 중에는 무사'라는 옛말이
  구호처럼 쓰였고, 떨어지는 꽃잎이 젊은 병사들의 죽음에 겹쳐졌어요. 꽃은 아무 말도 하지 않았지만, 사람들은
  꽃에 말을 얹었습니다. 상징이 어떻게 쓰이는지를 보는 일이, 상징 자체를 보는 일만큼 중요하다는 걸
  이 꽃이 알려 줍니다."
  `era`: `20c` · `culture_region`: `japan`
  `editorial_note`: "전쟁 미화로 읽히지 않도록 '상징이 이용된 사실'을 서술 대상으로 삼음. 특정 부대·작전명은
  쓰지 않음"

---

### 4-4. `camellia` — 동백

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `camellia` |
| `name_ko` | 동백 |
| `name_en` | Camellia |
| `scientific_name` | *Camellia japonica* |
| `colors` | `red\|white\|pink\|rose` |
| `bloom_months` | `10\|11\|12\|1\|2\|3\|4` |
| `fragrance_level` | `0` — 위키피디아 *Camellia japonica*: 꽃 자체는 향이 없다 |
| `price_band` | `2` |
| `aesthetic_tags` | `elegant\|vivid` |
| `care_summary` | "꽃잎이 한 장씩 지지 않고 송이째 떨어져요. 바닥에 떨어진 꽃은 그대로 두어도 예쁩니다. 서늘한 곳에 두면 오래가요." |
| `editorial_note` | "한국 남부 자생(울릉도~대청도, 육지 최북단 충남 서천). ASPCA 에 *C. japonica* 로 정확히 등재된 비독성 꽃 — **카탈로그에서 겨울에 쓸 수 있는 첫 안전종**. 기존 겨울 꽃 `hellebore`(serious)·`hyacinth`(serious)의 대안" |

**꽃말 4행**

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| red | 사랑에 빠진 마음, 그리고 기품 있게 지는 일 | japan | modern | `wikipedia-hanakotoba` | repeated |
| white | 기다림 | japan | modern | `wikipedia-hanakotoba` | repeated |
| red | 내세우지 않는 뛰어남 | victorian | 19c | `greenaway-1884` | repeated |
| white | 흠 없는 아름다움 | victorian | 19c | `greenaway-1884` | repeated |

- PD 원문: `'Camellia Japonica, Red — Unpretending excellence'` · `'White — Perfected loveliness'` (Greenaway 1884),
  `'Camellia Japonica, (Modest merit)'` (Dumont 1851)
- **흰 동백의 `기다림`(일본)은 `anniversary` 보강용으로 특히 좋다.**

**이야기 5편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-camellia-dumas` | 붉은 동백과 흰 동백으로 보낸 신호 | `romantic\|tragic\|dramatic` | `confession\|anniversary` | literary | repeated | `wikipedia-dame-aux-camelias` |
| `story-camellia-whole-head` | 송이째 떨어지는 꽃 | `dramatic\|tragic` | `just_because` | folklore | repeated | `wikipedia-camellia-japonica` |
| `story-camellia-chanel` | 샤넬이 이 꽃을 고른 이유 | `elegant`→`romantic\|dramatic` | `celebration` | history | repeated | `wikipedia-camellia` |
| `story-camellia-jeju-43` | 제주의 동백 | `tragic\|healing` | `comfort` | history | repeated | `kookje-jeju43-camellia` |
| `story-camellia-dongbaeksae` | 겨울엔 벌이 없어서 | `healing\|funny` | `just_because` | history | repeated | `wikipedia-ko-dongbaek` |

**리텔링 초안**

- **`story-camellia-dumas`** ← **하이라이트**
  `hook`: "한 달 중 스물닷새는 흰 동백, 닷새는 붉은 동백이었어요."
  `story_ko`: "1848년, 스물세 살의 알렉상드르 뒤마 피스가 『동백꽃 여인』을 썼어요. 주인공 마르그리트 고티에는
  늘 동백을 달고 다녔는데, 그 색이 곧 신호였습니다. 흰 동백일 때와 붉은 동백일 때가 달랐어요. 꽃 한 송이로
  말없이 전하는 말이 있었던 거지요. 이 소설은 뒤마가 실제로 사랑했던 마리 뒤플레시를 모델로 했고,
  1852년 연극으로 올라 크게 성공했습니다. 그 무대를 본 베르디가 이듬해 『라 트라비아타』를 썼어요.
  주인공 이름은 비올레타로 바뀌었지만, 시작은 동백 한 송이였습니다."
  `era`: `19c` · `culture_region`: `france`

- **`story-camellia-whole-head`**
  `hook`: "동백은 꽃잎을 한 장씩 떨어뜨리지 않아요."
  `story_ko`: "대부분의 꽃은 시들면 꽃잎이 한 장씩 떨어집니다. 동백은 다릅니다. 아직 붉을 때 송이째 툭
  떨어져요. 일본에서는 이걸 오치쓰바키, 떨어진 동백이라 부르는데, 그 모습을 두고 무사의 목이 떨어지는 것
  같다며 꺼렸다는 이야기가 전해집니다. 그런데 뒤집어 보면, 이 꽃은 시들어 가는 모습을 보이지 않기로
  한 거예요. 가장 붉을 때 그대로 내려앉습니다."
  `era`: `edo` · `culture_region`: `japan`

- **`story-camellia-chanel`**
  `hook`: "샤넬의 흰 동백은 소설 한 권에서 시작됐어요."
  `story_ko`: "샤넬 하면 떠오르는 흰 동백은 코코 샤넬이 직접 고른 상징이에요. 그가 뒤마의 『동백꽃 여인』
  주인공에게 자신을 겹쳐 보았기 때문이라고 전해집니다. 사실 동백은 19세기 유럽에서 한바탕 유행한 꽃이었어요.
  1739년 영국에 처음 살아 있는 나무가 들어왔고, 1819년까지 스물다섯 그루가 꽃을 피웠다는 기록이 있습니다.
  그해에 이 꽃만 다룬 첫 단행본이 나왔고, 유행은 1840년대에 정점을 찍었지요. 그 정점을 만든 것이
  바로 뒤마의 소설이었습니다."
  `era`: `19-20c` · `culture_region`: `france`

- **`story-camellia-jeju-43`** ← **한국 소재 · 명예 프레이밍**
  `hook`: "제주에서 동백은 기억의 꽃이에요."
  `story_ko`: "제주에서 동백은 그냥 겨울 꽃이 아니에요. 1992년 화가 강요배가 4·3을 그린 연작에 「동백꽃 지다」
  라는 제목을 붙였고, 그 뒤로 동백은 4·3을 기억하는 꽃이 되었습니다. 봄이면 사람들이 옷깃에 동백 배지를
  답니다. 송이째 떨어지는 꽃이라 그 자리에 놓였다고들 해요. 슬픔을 말하려고 꺾은 꽃이 아니라, 잊지 않겠다는
  약속으로 다는 꽃입니다."
  `era`: `20-21c` · `culture_region`: `korea`
  `editorial_note`: "국제신문 기사 근거(강요배 「동백꽃 지다」 1992). 기사 문장은 옮기지 않음.
  희생·가해 서술은 넣지 않고 '기억의 상징이 된 경위'만 다룸. 상업화 시점에 제주4·3평화재단 등 1차 기관
  자료로 재확인 권장"

- **`story-camellia-dongbaeksae`**
  `hook`: "겨울에 피면 벌이 없어요. 그래서 새를 부릅니다."
  `story_ko`: "동백은 한겨울에 핍니다. 그때는 벌도 나비도 없어요. 그래서 동백은 새를 부릅니다. 동박새가
  꿀을 먹으러 오면서 꽃가루를 옮겨 주는 거예요. 새가 찾아오게 하려니 꿀을 넉넉히 만들어야 했고, 새 부리가
  닿을 만큼 꽃이 커야 했습니다. 향기가 없는 것도 그래서예요 — 향으로 벌레를 부를 필요가 없었으니까요.
  기온이 오르는 2월부터는 꿀벌도 슬슬 거들기 시작합니다."
  `era`: `modern` · `culture_region`: `korea`

---

### 4-5. `violet` — 제비꽃

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `violet` |
| `name_ko` | 제비꽃 |
| `name_en` | Sweet Violet |
| `scientific_name` | *Viola odorata* |
| `colors` | `purple\|blue\|white\|pink\|lilac` |
| `bloom_months` | `3\|4\|5` |
| `fragrance_level` | `3` — NC State: 종소명 odorata 가 라틴어로 '향기 나는'. 향수·사탕·리큐어에 쓰임 |
| `price_band` | `2` |
| `aesthetic_tags` | `minimal\|cute\|calm` |
| `care_summary` | "꽃이 작아 금세 마릅니다. 물을 얕게 자주 갈아 주세요. 잎과 꽃은 먹을 수 있지만, 꽃집에서 산 것은 농약이 남아 있을 수 있어 드시지 않는 게 좋아요." |
| `editorial_note` | "향제비꽃(*V. odorata*) 기준. 한국 들에 흔한 제비꽃은 *V. mandshurica* 로 종이 다르며, 한국 이름 이야기 행에 명시. ASPCA 미등재(V 목록 확인) — pet_safety 근거는 NC State" |

**꽃말 4행**

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| blue | 변하지 않음 | victorian | 19c | `greenaway-1884` | repeated |
| purple | 겸손 — 앞에 나서지 않는 마음 | victorian | 19c | `greenaway-1884` | repeated |
| yellow | 소박한 행복 | victorian | 19c | `greenaway-1884` | single_source |
| | 아테네의 꽃 | greece | ancient | `wikipedia-viola-odorata` | repeated |

- PD 원문: `'Violet, Blue — Faithfulness'` · `'Violet, Sweet — Modesty'` · `'Violet, Yellow — Rural happiness'`
  (Greenaway 1884), `'Violet, (Modest worth)'` (Dumont 1851)

**이야기 4편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-violet-ionone` | 향을 맡으면 향이 사라지는 꽃 | `funny\|healing\|dramatic` | `just_because` | history | repeated | `wikipedia-viola` |
| `story-violet-athens` | 아테네를 상징한 꽃 | `mythic\|healing` | `just_because` | history | repeated | `wikipedia-viola-odorata` |
| `story-violet-sappho` | 사포가 적어 둔 제비꽃 관 | `romantic\|mythic` | `confession` | literary | repeated | `wikipedia-viola` |
| `story-violet-korean-names` | 이름이 여섯 개인 꽃 | `funny\|healing` | `just_because` | folklore | varies | `wikipedia-ko-jebikkot` |

**리텔링 초안**

- **`story-violet-ionone`** ← **하이라이트 · 도파민**
  `hook`: "한 번 맡으면 향이 사라져요. 그리고 잠시 뒤 다시 돌아옵니다."
  `story_ko`: "제비꽃 향을 맡아 보면 이상한 일이 일어납니다. 처음엔 분명히 향이 나는데, 조금 있으면 아무
  냄새도 안 나요. 코가 이상해진 게 아닙니다. 이 꽃 향의 주성분인 이오논이라는 물질이 코의 수용체를 잠깐
  마비시키기 때문이에요. 신경이 회복될 때까지는 아무리 코를 대도 향이 잡히지 않습니다. 그리고 잠시 뒤,
  향은 아무 일 없었다는 듯 다시 돌아와요. 세상에서 유일하게 숨바꼭질을 하는 향입니다."
  `era`: `modern`

- **`story-violet-athens`**
  `hook`: "고대 아테네를 대표한 꽃이 이 작은 제비꽃이었어요."
  `story_ko`: "고대 그리스에서 제비꽃은 아테네를 상징하는 꽃이었습니다. 도시를 대표하는 꽃이 장미도 백합도
  아니고, 땅에 바짝 붙어 피는 이 작은 꽃이었다는 게 재미있어요. 플리니우스도 호라티우스도 제비꽃을 적어
  두었고, 향은 특히 빅토리아 시대 후반에 크게 유행해 향수와 사탕과 시럽으로 만들어졌습니다. 다만 진짜
  제비꽃 향유는 1950~60년대에 이르러 거의 생산이 끊겼어요. 지금 향수에 쓰이는 건 대개 잎에서 뽑은 것입니다."
  `era`: `ancient` · `culture_region`: `greece`

- **`story-violet-sappho`**
  `hook`: "이천육백 년 전의 시 한 조각에서 시작된 상징이 있어요."
  `story_ko`: "시인 사포가 남긴 시 조각에 제비꽃이 나옵니다. 떠나간 사람을 떠올리며, 그가 제비꽃과 장미로
  엮은 화관을 두르던 모습을 적어 두었어요. 제비꽃 관을 쓰고 목에는 장미 봉오리와 크로커스를 두르던 사람이요.
  그 몇 줄 때문에 제비꽃은 오래도록 여자들 사이의 사랑을 뜻하는 꽃이 되었습니다. 1926년 파리에서 올라간
  연극 『갇힌 여자』에서도 제비꽃 다발이 꼭 그 뜻으로 쓰였어요. 시 한 조각이 이천 년을 건너간 셈입니다."
  `era`: `ancient` · `culture_region`: `greece`

- **`story-violet-korean-names`** ← **한국 소재 · 유쾌**
  `hook`: "제비꽃, 오랑캐꽃, 앉은뱅이꽃, 씨름꽃, 반지꽃, 장수꽃."
  `story_ko`: "이 꽃은 우리말 이름이 유난히 많아요. 제비꽃, 오랑캐꽃, 앉은뱅이꽃, 씨름꽃, 반지꽃, 장수꽃,
  병아리꽃까지 있습니다. 제비꽃이라는 이름의 유래도 두 갈래로 전해져요. 제비가 돌아올 무렵에 핀다고 해서라는
  이야기가 있고, 꽃 생김이 제비를 닮아서라는 이야기도 있습니다. 이름이 이렇게 많다는 건, 그만큼 여기저기서
  사람들 눈에 자주 띄었다는 뜻이겠지요. 아이들이 꽃대를 걸고 잡아당기며 놀았대서 씨름꽃, 꽃으로 반지를
  만들었대서 반지꽃입니다."
  `era`: `modern` · `culture_region`: `korea`
  `editorial_note`: "한국어 위키백과가 이름 유래를 두 설로 병기해 confidence varies. 한국 제비꽃은
  *Viola mandshurica* 로 카탈로그의 *V. odorata* 와 종이 다름"

---

### 4-6. `iris` — 아이리스

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `iris` |
| `name_ko` | 아이리스 |
| `name_en` | Iris |
| `scientific_name` | *Iris* × *hollandica* |
| `colors` | `purple\|blue\|white\|yellow\|bronze` |
| `bloom_months` | `2\|3\|4\|5\|6` |
| `fragrance_level` | `1` — 위키피디아 *Iris (plant)*: 재배 품종 상당수는 향이 없고, 향이 있는 건 *I. reticulata*·*I. persica* 등 일부 |
| `price_band` | `2` |
| `aesthetic_tags` | `elegant\|vivid\|minimal` |
| `care_summary` | "봉오리가 살짝 벌어졌을 때 사면 오래 갑니다. 뿌리줄기에 독성이 몰려 있는데 절화에는 그 부분이 없어요. 그래도 반려동물이 잎이나 줄기를 씹지 않게 해주세요." |
| `editorial_note` | "국내 절화 주력인 더치 아이리스(*I.* × *hollandica*) 기준. 이야기 속 종은 오리스 뿌리의 *I. germanica*·*I. pallida*, 백합 문장 설의 *I. pseudacorus* 로 각각 다르며 해당 행에 명시. ASPCA `Iris` 항목은 *Iris species* 로 속 전체를 다뤄 그대로 적용. 독성이 뿌리줄기에 몰려 있어 절화 위험도는 낮다는 점을 care_summary 에 반영" |

**꽃말 4행**

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| | 전하고 싶은 말, 소식 | victorian | 19c | `greenaway-1884` | repeated |
| | 좋은 소식, 그리고 변치 않음 | japan | modern | `wikipedia-hanakotoba` | repeated |
| purple | 타오르는 마음 | victorian | 19c | `greenaway-1884` | single_source |
| | 무지개 — 하늘과 땅을 잇는 다리 | greece | ancient | `wikipedia-iris-myth` | repeated |

- **동서가 똑같이 '소식'이라 적은 꽃이다.** Greenaway 1884 `'Iris — Message'`, 하나코토바 `菖蒲 — Good news, glad tidings`.
  신화 속 이리스가 신들의 전령이었다는 사실과 정확히 맞물린다 — **꽃말·신화·기능이 한 줄로 꿰이는 유일한 사례.**
- PD 원문: `'Iris — Message'` · `'Iris, German — Flame'` (Greenaway 1884)

**이야기 5편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-iris-rainbow-messenger` | 무지개를 타고 다닌 전령 | `mythic\|dramatic` | `just_because` | folklore | repeated | `wikipedia-iris-myth` |
| `story-iris-message-across` | 나라가 달라도 '소식'이라 적은 꽃 | `healing` | `just_because\|anniversary` | history | repeated | `greenaway-1884` |
| `story-iris-fleur-de-lis` | 프랑스 왕가의 백합은 백합이 아니었다 | `dramatic\|mythic` | `just_because` | history | varies | `wikipedia-fleur-de-lis` |
| `story-iris-orris-five-years` | 오 년을 재워야 향이 나는 뿌리 | `funny\|healing` | `just_because` | history | repeated | `wikipedia-iris-plant` |
| `story-iris-van-gogh` | 요양원 정원에서 그린 붓꽃 | `healing\|dramatic` | `comfort` | history | repeated | `wikipedia-irises-painting` |

**리텔링 초안**

- **`story-iris-rainbow-messenger`**
  `hook`: "신들의 말을 옮기던 전령의 이름이 이 꽃이 됐어요."
  `story_ko`: "그리스 신화의 이리스는 무지개의 여신이자 신들의 전령이었어요. 타우마스와 엘렉트라의 딸이고,
  주로 헤라의 말을 옮겼습니다. 날개가 어찌나 밝게 빛났는지 어두운 동굴도 환해졌다고 해요. 무지개를 길 삼아
  하늘과 땅을 오갔고, 제우스의 명으로 저승의 강 스틱스에서 물을 길어 오는 일도 맡았습니다. 거짓 맹세를 한
  자에게 그 물을 부으면 잠들어 버렸다지요. 꽃 이름이 이리스가 된 건 색이 그만큼 다양해서였습니다."
  `era`: `ancient` · `culture_region`: `greece`

- **`story-iris-message-across`** ← **서비스 콘셉트 직결**
  `hook`: "빅토리아 사전도, 일본 하나코토바도 이 꽃을 '소식'이라 적었어요."
  `story_ko`: "1884년 영국에서 나온 꽃말 사전은 아이리스를 한 단어로 적어 두었어요 — 소식. 그리고 바다 건너
  일본의 하나코토바도 이 꽃을 좋은 소식이라 적습니다. 서로 참고하지 않았을 두 목록이 같은 말을 골랐어요.
  그리스 신화에서 이 꽃의 이름을 준 이리스가 신들의 전령이었다는 걸 떠올리면, 세 갈래가 한 줄로 이어집니다.
  전할 말이 있을 때 건네기에 이만한 꽃이 없어요."
  `era`: `19c` · `culture_region`: `western-japan`

- **`story-iris-fleur-de-lis`** ← **반전**
  `hook`: "프랑스 왕가의 백합 문장이 백합이 아니라는 이야기가 있어요."
  `story_ko`: "플뢰르 드 리스, 프랑스 왕가의 문장은 이름부터 '백합의 꽃'입니다. 그런데 18세기의 한 박물학자가
  다른 말을 했어요. 저건 백합이 아니라 노랑붓꽃이라는 겁니다. 프랑크족이 살던 플랑드르의 리스 강가에 붓꽃이
  유난히 많았고, 위로 선 꽃잎 셋과 아래로 처진 꽃잎 셋이 그 문장 모양과 정확히 맞아떨어진다는 거예요.
  클로비스 왕이 세례받을 때 천사가 백합을 내려 주었다는 이야기는 후대에 덧붙은 각색이고, 문장으로 확실히
  확인되는 건 1211년의 인장부터입니다. 왕가의 상징이 실은 강가의 들꽃이었을지도 모른다는 이야기예요."
  `era`: `medieval` · `culture_region`: `france`

- **`story-iris-orris-five-years`** ← **유쾌·도파민**
  `hook`: "향이 나기까지 오 년을 기다려야 하는 뿌리가 있어요."
  `story_ko`: "아이리스 뿌리줄기는 오리스 루트라는 이름으로 향수에 쓰입니다. 그런데 캐낸 뿌리에서 곧바로
  향이 나는 게 아니에요. 말려서 최대 오 년을 재워 둬야 합니다. 그동안 뿌리 속 기름이 천천히 산화하면서
  비로소 향기 성분이 만들어져요. 그렇게 오 년을 기다린 뿌리에서 나는 향이, 놀랍게도 제비꽃 향입니다.
  값이 비싼 이유가 여기 있어요. 참고로 이 뿌리는 봄베이 사파이어 같은 진에도 들어갑니다."
  `era`: `modern`

- **`story-iris-van-gogh`** ← **위로**
  `hook`: "그는 요양원에 들어간 첫 달에 이 꽃을 그렸어요."
  `story_ko`: "1889년 5월, 반 고흐는 생레미의 요양원에 스스로 들어갔습니다. 그리고 한 달이 지나기 전에
  담장 안 정원의 붓꽃을 그렸어요. 동생 테오에게 보낸 편지에서, 일할 수 있는 힘이 곧 돌아올 거라고 믿는다고
  적었습니다. 그림 물감 속에는 그 정원의 솔방울 화분 부스러기가 그대로 굳어 있어요. 1987년 이 그림은
  당시 세계 최고가로 팔렸고, 지금은 로스앤젤레스의 게티 미술관에 있습니다. 가장 힘들었던 해에 그린 꽃이요."
  `era`: `19c` · `culture_region`: `france`
  `editorial_note`: "반 고흐의 편지는 원문 인용 대신 뜻만 옮김(§1)"

---

### 4-7. `marigold` — 마리골드

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `marigold` |
| `name_ko` | 마리골드 |
| `name_en` | Marigold |
| `scientific_name` | *Tagetes erecta* |
| `colors` | `yellow\|orange\|bronze\|mahogany\|cream` |
| `bloom_months` | `6\|7\|8\|9\|10` |
| `fragrance_level` | `2` — NC State: 꽃도 향이 있고 잎은 스치기만 해도 향이 난다 |
| `price_band` | `1` |
| `aesthetic_tags` | `vivid\|cute` |
| `care_summary` | "수액이 상처 난 피부에 닿은 채로 햇빛을 보면 붉어지거나 물집이 생길 수 있어요. 다룬 뒤에는 손을 씻어 주세요. 잎에서 나는 특유의 향이 진하니 좁은 방은 피해 주세요." |
| `editorial_note` | "**ASPCA 의 '마리골드' 항목은 전부 금잔화(*Calendula officinalis*)이고 *Tagetes* 는 등재되어 있지 않다**(M 목록 72건 전수 확인). 해바라기와 같은 종 불일치 상황이라 같은 방식으로 처리 — 판단 근거는 `docs/catalog-expansion-2-research.md` §2-7. NC State 의 *Tagetes erecta* 접촉 광독성은 섭취 독성이 아니어서 care_summary 로만 반영" |

**꽃말 4행**

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| | 슬픔 | victorian | 19c | `greenaway-1884` | repeated |
| yellow | 질투 | victorian | 19c | `greenaway-1884` | repeated |
| orange | 떠난 이를 집으로 데려오는 꽃 | mexico | modern | `wikipedia-tagetes-erecta` | repeated |
| | 신에게 바치는 꽃 | india | modern | `wikipedia-tagetes-erecta` | repeated |

- **이번 확장에서 문화권 대비가 가장 극단적인 꽃.** 빅토리아 사전은 이 꽃에 온통 부정적인 말만 붙여 놨다
  (`Grief` `Vulgar minds` `Jealousy` `Despair`). 멕시코에서는 정반대로 **재회의 꽃**이다.
- PD 원문: `'Marigold — Grief'` · `'Marigold, African — Vulgar minds'` · `'Marigold, French — Jealousy'` ·
  `'Marigold and Cypress — Despair'` · `'Prophetic Marigold — Prediction'` (Greenaway 1884),
  `'Marigold, (Grief)'` (Dumont 1851)

**이야기 4편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-marigold-cempasuchil` | 꽃잎으로 길을 내는 밤 | `mythic\|healing\|dramatic` | `comfort\|anniversary` | folklore | repeated | `wikipedia-tagetes-erecta` |
| `story-marigold-opposite-meanings` | 슬픔의 꽃이자 재회의 꽃 | `dramatic\|healing` | `comfort` | history | repeated | `greenaway-1884` |
| `story-marigold-african-name` | 멕시코 꽃인데 이름은 아프리칸 | `funny` | `just_because` | history | repeated | `wikipedia-tagetes-erecta` |
| `story-marigold-india` | 사원 앞에 걸린 화환 | `healing\|mythic` | `gratitude\|celebration` | history | repeated | `wikipedia-tagetes-erecta` |

**리텔링 초안**

- **`story-marigold-cempasuchil`** ← **하이라이트**
  `hook`: "꽃잎을 뿌려 길을 냅니다. 그 길로 돌아오시라고요."
  `story_ko`: "멕시코에서 이 꽃의 이름은 셈파수칠이에요. 나우아틀어 셈포알쇼치틀에서 왔는데, '스무 송이 꽃'이라는
  뜻입니다. 아스텍에서 스물은 '온전함'을 뜻하는 수였어요. 죽은 자의 날이 되면 사람들은 이 꽃을 산더미처럼
  사다가 제단을 쌓고, 대문에서 제단까지 꽃잎을 뿌려 길을 냅니다. 짙은 향을 따라 세상을 떠난 가족이 집을
  찾아온다고 믿기 때문이에요. 그래서 이 꽃의 다른 이름은 '죽은 이의 꽃'입니다. 슬픔의 꽃이 아니라,
  일 년에 하루 다시 만나는 꽃이에요."
  `era`: `modern` · `culture_region`: `mexico`

- **`story-marigold-opposite-meanings`** ← **대비**
  `hook`: "빅토리아 사람들은 이 꽃에 좋은 말을 하나도 안 붙였어요."
  `story_ko`: "1884년 영국의 꽃말 사전을 펼치면 마리골드 항목이 좀 심합니다. 슬픔, 질투, 천박한 마음,
  절망까지 있어요. 좋은 말이 한 줄도 없습니다. 그런데 같은 꽃이 멕시코에서는 일 년에 하루 세상을 떠난
  가족이 집으로 돌아오는 길을 밝히는 꽃이에요. 인도에서는 신에게 바치는 화환이 됩니다. 같은 꽃을 놓고
  한쪽은 절망을 읽고 한쪽은 재회를 읽어요. 꽃말이라는 게 꽃에 있는 게 아니라 사람에게 있다는 걸,
  이 꽃만큼 잘 보여 주는 경우가 없습니다."
  `era`: `19-20c` · `culture_region`: `victorian-mexico`

- **`story-marigold-african-name`** ← **유쾌**
  `hook`: "멕시코가 고향인데 이름은 '아프리칸 마리골드'예요."
  `story_ko`: "이 꽃은 멕시코와 중앙아메리카가 고향입니다. 그런데 영어 이름 중 가장 널리 쓰이는 게
  아프리칸 마리골드예요. 아프리카와는 아무 상관이 없습니다. 식민지 시대 무역로를 따라 이리저리 옮겨 다니는
  동안 어디서 왔는지가 뒤섞여 버린 거예요. 그래서 이 꽃은 이름이 세 개입니다. 아스텍 마리골드, 멕시칸
  마리골드, 그리고 아프리칸 마리골드. 앞의 둘은 맞고 마지막 하나만 틀렸는데, 하필 그게 제일 유명해요."
  `era`: `modern`

- **`story-marigold-india`**
  `hook`: "멕시코 꽃이 힌두 의례의 꽃이 되기까지."
  `story_ko`: "인도의 사원 앞에는 늘 주황색 화환이 걸려 있어요. 결혼식에도 축제에도 이 꽃이 빠지지 않습니다.
  그런데 이 꽃은 인도 토종이 아니에요. 대륙 반대편 멕시코에서 왔습니다. 언제 어떻게 건너왔는지보다 놀라운 건,
  건너온 꽃이 그 나라 의례의 한복판에 자리를 잡아 버렸다는 거예요. 지금은 인도가 이 꽃의 최대 재배지 중
  하나입니다. 꽃도 이민을 가고, 가서 그 나라 사람이 되기도 하는 모양이에요."
  `era`: `modern` · `culture_region`: `india`

---

### 4-8. `corn-poppy` — 개양귀비

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `corn-poppy` |
| `name_ko` | 개양귀비 |
| `name_en` | Corn Poppy |
| `scientific_name` | *Papaver rhoeas* |
| `colors` | `red\|orange\|white\|pink\|purple` |
| `bloom_months` | `5\|6\|7` |
| `fragrance_level` | `0` |
| `price_band` | `1` |
| `aesthetic_tags` | `vivid\|cute` |
| `care_summary` | "줄기를 자르면 하얀 진액이 나와요. 자른 끝을 잠깐 지지거나 뜨거운 물에 담갔다 꽂으면 훨씬 오래 갑니다. 약한 진정 성분이 있어 반려동물이 뜯어 먹지 않게 해주세요." |
| `editorial_note` | "**개양귀비(*Papaver rhoeas*)는 아편 양귀비(*P. somniferum*)와 다른 종이고, 마약을 만들 수 없어 재배가 규제되지 않는다**(한국어 위키백과). ASPCA·NC State 어느 쪽에도 독성 기재가 없으나 위키피디아가 로에아딘 등 알칼로이드 함유를 적어 등급 판단이 갈림 — `docs/catalog-expansion-2-research.md` §2-8 참조" |

**꽃말 4행**

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| red | 위로 | victorian | 19c | `greenaway-1884` | repeated |
| white | 잠 — 나를 아프게 하는 것이자 낫게 하는 것 | victorian | 19c | `greenaway-1884` | single_source |
| red | 즐거움을 좋아하는 마음 | japan | modern | `wikipedia-hanakotoba` | repeated |
| red | 돌아오지 못한 이들을 기억하는 일 | commonwealth | modern | `wikipedia-remembrance-poppy` | repeated |

- **붉은 양귀비 = `Consolation`(위로)라는 1884년의 기록이, 30년 뒤 플랑드르 추모와 정확히 이어진다.**
  꽃말이 먼저 있었고 역사가 나중에 그 자리를 채운 드문 사례 — UI 에서 강한 카드가 된다.
- PD 원문: `'Poppy, Red — Consolation'` · `'Poppy, White — Sleep. My bane. My antidote.'` ·
  `'Poppy, Scarlet — Fantastic extravagance.'` (Greenaway 1884)

**이야기 5편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-poppy-why-flanders` | 왜 하필 그 들판에 폈을까 | `tragic\|healing\|dramatic` | `comfort` | history | repeated | `wikipedia-papaver-rhoeas` |
| `story-poppy-in-flanders-fields` | 1915년 5월의 시 한 편 | `tragic\|healing` | `comfort\|gratitude` | literary | repeated | `wikipedia-remembrance-poppy` |
| `story-poppy-moina-anna` | 두 여자가 만든 관습 | `dramatic\|healing` | `gratitude` | history | repeated | `wikipedia-remembrance-poppy` |
| `story-poppy-yu-meiren` | 우미인의 무덤에 핀 꽃 | `tragic\|romantic\|mythic` | `comfort` | folklore | varies | `wikipedia-ko-gaeyanggwibi` |
| `story-poppy-police` | 경찰이 찾아온 화단 | `funny` | `just_because` | history | repeated | `wikipedia-ko-gaeyanggwibi` |

**리텔링 초안**

- **`story-poppy-why-flanders`** ← **최고 하이라이트**
  `hook`: "폐허가 된 들판에 꽃밭이 생긴 데는 이유가 있었어요."
  `story_ko`: "1차 대전이 끝나 갈 무렵 플랑드르의 들판은 온통 붉은 양귀비였습니다. 사람들은 그걸 기적처럼
  이야기했지만, 사실 이 꽃에는 오래된 습성이 있어요. 씨앗이 흙 속에서 몇 해고 잠들어 있다가, 땅이 뒤집히면
  그제야 깨어나 싹을 틔웁니다. 원래는 밭을 가는 농부의 쟁기가 그 일을 했어요. 그런데 그 들판을 뒤집은 건
  포탄이었습니다. 가장 참혹하게 갈아엎힌 땅이, 그래서 가장 붉게 뒤덮였어요. 위로처럼 보이는 광경이
  사실은 그 반대의 증거였던 거예요."
  `era`: `20c` · `culture_region`: `belgium-france`

- **`story-poppy-in-flanders-fields`**
  `hook`: "1915년 5월 3일, 친구를 묻은 다음 날 쓴 시예요."
  `story_ko`: "캐나다 군의관 존 매크레이는 1915년 5월 3일, 친구를 잃은 직후에 시 한 편을 썼습니다.
  플랑드르 들판에 줄지어 선 십자가들 사이로 양귀비가 불어 간다는 시였어요. 그해 12월 8일 런던의 잡지
  『펀치』에 실렸고, 그 뒤 이 꽃은 전쟁에서 돌아오지 못한 사람들의 꽃이 되었습니다. 시를 쓴 매크레이 본인은
  전쟁이 끝나는 걸 보지 못했어요."
  `era`: `20c` · `culture_region`: `canada-belgium`

- **`story-poppy-moina-anna`**
  `hook`: "이 관습을 만든 건 두 사람의 여자였어요."
  `story_ko`: "매크레이의 시를 읽은 미국의 교수 모이나 마이클은 1918년, 평생 붉은 양귀비를 달겠다고 다짐했어요.
  그해 11월 회의장에서 사람들에게 양귀비를 나눠 주었고, 1920년 9월 27일 미국 재향군인회가 이 꽃을 공식
  상징으로 삼았습니다. 프랑스의 안나 게랭은 여기서 한 걸음 더 나아갔어요. 전쟁으로 폐허가 된 지역의
  미망인과 아이들이 손으로 만든 실크 양귀비를 팔아, 그 수익이 그들에게 돌아가게 했습니다. 1921년 5월
  미국에서 첫 포피 데이가 열렸고, 그해 11월 11일 영국에서도 첫 모금이 시작됐어요. 1933년에는 평화를 뜻하는
  흰 양귀비도 생겼습니다."
  `era`: `20c` · `culture_region`: `western`

- **`story-poppy-yu-meiren`** ← **한중 소재**
  `hook`: "중국에서는 이 꽃을 우미인초라 불러요."
  `story_ko`: "우리말로는 개양귀비지만, 중국에서는 우미인초라고 부릅니다. 항우의 연인 우미인의 무덤에서
  이 꽃이 피었다는 이야기에서 왔어요. 마지막 싸움에서 진 항우 곁에서 스스로 목숨을 끊은 사람이었지요.
  이름에 '양귀비'가 들어가 있어 당나라 양귀비와 관련이 있나 싶지만, 그쪽과는 상관이 없습니다.
  같은 붉은 꽃을 두고 유럽에서는 전장에서 스러진 병사들을, 중국에서는 전장에서 스러진 한 사람을 떠올린
  셈이에요."
  `era`: `ancient` · `culture_region`: `china`

- **`story-poppy-police`** ← **유쾌**
  `hook`: "화단에 심었다가 경찰 조사를 받는 일이 종종 있어요."
  `story_ko`: "개양귀비는 관상용으로 흔히 심습니다. 그런데 아편 양귀비와 생김이 비슷해서, 마당에 곱게
  심어 놓았다가 신고가 들어가 경찰이 찾아오는 일이 심심찮게 있어요. 개양귀비로는 마약을 만들 수 없어서
  재배가 규제되지 않는데도 그렇습니다. 꽃 입장에서는 조금 억울한 일이지요. 붉게 피어 있다가 이름 때문에
  조사를 받는 꽃이라니요."
  `era`: `modern` · `culture_region`: `korea`

---

### 4-9. `jasmine` — 재스민

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `jasmine` |
| `name_ko` | 재스민 |
| `name_en` | Jasmine |
| `scientific_name` | *Jasminum sambac* |
| `colors` | `white\|cream\|yellow` |
| `bloom_months` | `5\|6\|7\|8\|9` |
| `fragrance_level` | `3` |
| `price_band` | `2` — 화분 유통 중심 |
| `aesthetic_tags` | `elegant\|calm` |
| `care_summary` | "꽃이 저녁에 열려 아침에 닫혀요. 향은 밤에 가장 짙으니 저녁에 곁에 두시면 좋습니다. 향이 매우 진하니 좁은 방은 피해 주세요. 재스민이라는 이름이 붙은 다른 식물 중에는 독성이 있는 것도 있으니, 다른 꽃과 헷갈리지 않게 해주세요." |
| `editorial_note` | "ASPCA 의 `Jasmine`(*Jasminum species*)은 비독성이지만, 같은 목록의 `Cape Jasmine`(*Gardenia jasminoides*)은 독성으로 등재돼 있다. 이름만 같은 다른 식물이 여럿이라는 사실을 care_summary·이야기 양쪽에 남김 — §2-9" |

**꽃말 4행**

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| white | 다정함 | victorian | 19c | `greenaway-1884` | repeated |
| white | 당신에게 마음을 맡깁니다 | victorian | 19c | `greenaway-1884` | single_source |
| | 다정하고 우아함 | japan | modern | `wikipedia-hanakotoba` | repeated |
| white | 순결 — 신부의 꽃 | philippines-indonesia | modern | `wikipedia-jasminum-sambac` | repeated |

- PD 원문: `'Jasmine — Amiability'` · `'Jasmine, Indian — I attach myself to you.'` ·
  `'Jasmine, Spanish — Sensuality.'` · `'Jasmine, Yellow — Grace and elegance.'` (Greenaway 1884),
  `'Jasmine, (Amiability)'` (Dumont 1851)

**이야기 4편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-jasmine-night-bloom` | 저녁 여섯 시에 피는 꽃 | `romantic\|healing` | `confession` | history | repeated | `wikipedia-jasminum-sambac` |
| `story-jasmine-sampaguita` | 두 나라가 나라꽃으로 삼은 꽃 | `romantic\|mythic` | `celebration\|anniversary` | history | repeated | `wikipedia-jasminum-sambac` |
| `story-jasmine-name-travel` | 페르시아에서 온 이름 | `healing\|mythic` | `just_because` | history | repeated | `wikipedia-jasmine` |
| `story-jasmine-not-jasmine` | 재스민이라는 이름의 다른 꽃들 | `dramatic\|funny` | `just_because` | history | repeated | `aspca-jasmine` |

**리텔링 초안**

- **`story-jasmine-night-bloom`**
  `hook`: "이 꽃은 해가 진 뒤에 열려요."
  `story_ko`: "재스민은 낮에 피지 않습니다. 저녁 여섯 시에서 여덟 시 사이에 열려서, 열두 시간에서 스무 시간쯤
  피어 있다가 아침이면 닫혀요. 향도 밤에 가장 짙습니다. 그래서 화환을 엮는 사람들은 해가 기울 무렵에 꽃을
  땁니다. 낮에 지나가면 아무 향도 안 나던 골목이 저녁이 되면 향으로 가득 차는 이유예요. 이 꽃은 어두워진
  다음에야 자기 얘기를 시작합니다."
  `era`: `modern` · `culture_region`: `southeast-asia`

- **`story-jasmine-sampaguita`** ← **`anniversary` 보강**
  `hook`: "필리핀은 1934년에, 인도네시아는 1990년에 이 꽃을 나라꽃으로 정했어요."
  `story_ko`: "필리핀에서는 이 꽃을 삼파기타라고 부르고, 1934년 2월 1일 포고 652호로 나라꽃이 되었습니다.
  인도네시아에서는 믈라티 푸티라 부르는데, 오래전부터 사랑받다가 1990년에 공식 지정되고 1993년 대통령령으로
  확정됐어요. 특히 결혼식에서 자리가 큽니다. 자바와 순다의 신부는 이 꽃을 촘촘히 엮은 로첸 믈라티를 머리에
  쓰고, 신랑이 차는 단검에는 다섯 줄의 꽃 장식을 겁니다. 향 하나로 그날을 기억하게 만드는 셈이에요."
  `era`: `20c` · `culture_region`: `philippines-indonesia`

- **`story-jasmine-name-travel`**
  `hook`: "이름 하나가 페르시아에서 프랑스를 거쳐 여기까지 왔어요."
  `story_ko`: "재스민이라는 이름은 페르시아어 야사민에서 시작됐어요. 그 말이 아랍어를 거쳐 프랑스어 제스맹이
  되었고, 16세기에 영어로 넘어왔습니다. 시리아의 다마스쿠스는 아예 '재스민의 도시'라 불려요. 향 하나로
  대륙을 건너간 셈인데, 재미있는 건 세계 향수 산업이 쓰는 재스민 대부분이 이집트의 작은 마을 한 곳에서
  나온다는 사실입니다. 그 향이 지구를 한 바퀴 돌고 있어요."
  `era`: `16c-modern` · `culture_region`: `persia-europe`

- **`story-jasmine-not-jasmine`** ← **안전이 곧 이야기**
  `hook`: "재스민이라는 이름이 붙은 꽃이 여럿이고, 그중엔 독이 있는 것도 있어요."
  `story_ko`: "재스민은 반려동물에게 안전한 꽃입니다. 그런데 이름에 '재스민'이 들어간 다른 식물이 꽤 많아요.
  케이프 재스민은 사실 치자나무이고 독성 목록에 올라 있습니다. 마다가스카르 재스민, 파라과이 재스민,
  콘페더리트 재스민도 전부 다른 과의 식물이에요. 향이 비슷하다는 이유로 같은 이름을 나눠 가진 겁니다.
  그래서 '재스민이니까 괜찮다'가 아니라, 어떤 재스민인지를 봐야 해요. 이름이 같다고 같은 꽃이 아닙니다."
  `era`: `modern`

---

### 4-10. `babys-breath` — 안개꽃

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `babys-breath` |
| `name_ko` | 안개꽃 |
| `name_en` | Baby's Breath |
| `scientific_name` | *Gypsophila paniculata* |
| `colors` | `white\|pink\|cream` |
| `bloom_months` | `5\|6\|7\|8\|9\|10` |
| `fragrance_level` | `0` — 위키피디아·ASPCA 어느 쪽에도 향 서술이 없어 0. 실제로는 특유의 냄새가 난다는 말이 돌지만 1차 근거를 못 찾음 |
| `price_band` | `1` |
| `aesthetic_tags` | `minimal\|cute\|calm` |
| `care_summary` | "잔가지가 물을 잘 못 먹어요. 줄기를 길게 사선으로 자르고 깊은 물에 꽂아 주세요. 많이 삼키면 토하거나 설사할 수 있으니 반려동물 손이 닿지 않는 곳에 두세요." |
| `editorial_note` | "**ASPCA 의 `Baby's Breath` 항목은 *Gypsophila elegans* 이고, 절화로 도는 것은 대개 *G. paniculata* 다** — 해바라기와 같은 종 불일치. ASPCA 는 비독성으로 적으면서도 Clinical Signs 에 경미한 위장 증상을 함께 실어 두어, 그 단서를 care_summary 에 살림(§2-4)" |

**꽃말 3행** — 이 꽃은 서양 꽃말 전승 자체가 거의 없다(`lisianthus` 와 같은 상황)

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| white | 맑은 마음 | korea | modern | `wikipedia-ko-angaekkot` | single_source |
| white | 변치 않는 사랑 | korea | modern | `wikipedia-ko-angaekkot` | single_source |
| | 석고를 사랑하는 꽃 — 메마른 땅에서 자라는 마음 | etymology | modern | `wikipedia-gypsophila` | repeated |

- **Greenaway(1884)·Dumont(1851) 어디에도 Gypsophila 항목이 없다.** 19세기 서양 꽃말 사전이 만들어질 때
  이 꽃은 아직 관상용으로 널리 쓰이지 않았다. → 꽃말이 얇은 것은 자료 부족이 아니라 **역사적 사실**이며,
  `editorial_note` 에 그 사실을 적어 두면 오히려 이야깃거리가 된다.

**이야기 3편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-babys-breath-gypsum` | 석고를 사랑하는 꽃 | `healing\|dramatic` | `comfort` | history | repeated | `wikipedia-gypsophila` |
| `story-babys-breath-invasive` | 북미에서는 뽑아내는 꽃 | `funny\|dramatic` | `just_because` | history | repeated | `wikipedia-gypsophila-paniculata` |
| `story-babys-breath-filler-to-star` | 곁들이던 꽃이 주인공이 되기까지 | `healing\|funny` | `just_because` | history | repeated | `wikipedia-gypsophila-paniculata` |

**리텔링 초안**

- **`story-babys-breath-gypsum`** ← **반전 · 위로**
  `hook`: "가장 여려 보이는 꽃이 가장 척박한 땅의 꽃이에요."
  `story_ko`: "안개꽃의 속명 깁소필라는 그리스어 두 단어를 붙인 말입니다. 깁소스는 석고, 필리오스는 사랑한다는
  뜻이에요. 그러니까 이름 자체가 '석고를 사랑하는'입니다. 실제로 이 꽃의 여러 종은 석회질이 많은 마른 땅,
  모래와 돌이 섞인 스텝 지대에서 자랍니다. 다른 꽃들이 못 버티는 자리예요. 다발에서 가장 여려 보이고
  가장 조연처럼 보이는 꽃이, 알고 보면 가장 험한 데서 온 꽃이었습니다."
  `era`: `modern`

- **`story-babys-breath-invasive`** ← **최고 반전**
  `hook`: "북미에서는 이 꽃을 뽑아내는 게 일이에요."
  `story_ko`: "안개꽃은 꽃다발에서 가장 순한 얼굴을 하고 있습니다. 그런데 북미에서는 사정이 다릅니다.
  캘리포니아는 이 꽃을 주 지정 유해잡초로 올려 두었고, 태평양 연안 북서부에서도 마찬가지예요. 미시간의
  슬리핑베어 듄스 국립호안과 시카고 일대에서는 침입종으로 분류됩니다. 모래언덕을 통째로 뒤덮어 토종 식물이
  들어설 자리를 없애 버리기 때문이에요. 그래서 그곳에서는 안개꽃을 걷어 내면 원래 식물이 돌아오는지를
  연구까지 합니다. 다발 속에서는 조연이지만, 들판에서는 아주 다른 얼굴이에요."
  `era`: `modern` · `culture_region`: `north-america`

- **`story-babys-breath-filler-to-star`**
  `hook`: "업계에서는 이 꽃을 '집'이라고 줄여 불러요."
  `story_ko`: "꽃 시장에서 안개꽃은 그냥 '집'이라고 불립니다. 깁소필라를 줄인 말이에요. 오래도록 큰 꽃 뒤에
  깔아 주는 배경 역할이었습니다. 장미 다발이든 무슨 다발이든 뒤를 받쳐 주는 자리요. 그런데 언제부턴가
  안개꽃만으로 다발을 만드는 사람들이 생겼어요. 배경만 남기고 주인공을 빼 버린 셈인데, 그게 오히려
  예뻤습니다. 참고로 이 꽃의 큰 산지 중 하나가 페루예요. 조연 노릇을 하려고 지구 반대편에서 옵니다."
  `era`: `modern`

---

### 4-11. `cosmos` — 코스모스

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `cosmos` |
| `name_ko` | 코스모스 |
| `name_en` | Cosmos |
| `scientific_name` | *Cosmos bipinnatus* |
| `colors` | `pink\|white\|magenta\|purple\|yellow` |
| `bloom_months` | `7\|8\|9\|10` |
| `fragrance_level` | `0` |
| `price_band` | `1` |
| `aesthetic_tags` | `cute\|calm\|minimal` |
| `care_summary` | "줄기가 가늘어 잘 휘어요. 짧게 잘라 낮은 화병에 꽂으면 훨씬 오래 갑니다. 시든 꽃만 떼어 내면 곁봉오리가 이어 피어요." |
| `editorial_note` | "ASPCA 미등재(C 목록 137건 전수 확인) — pet_safety 근거는 NC State. 한국 도입 시기·경위는 1차 자료를 찾지 못해 이야기로 만들지 않음(§7 후속)" |

**꽃말 3행** — 이 꽃도 19세기 서양 꽃말 사전에 없다

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| | 가지런함 — 흐트러지지 않은 마음 | etymology | 18c | `wikipedia-cosmos-plant` | repeated |
| | 보석처럼 빛나는 것 | etymology | 18c | `wikipedia-cosmos-plant` | varies |
| pink | 가을이 왔다는 소식 | korea | modern | `wikipedia-cosmos-plant` | single_source |

- Greenaway(1884)·Dumont(1851)·하나코토바 **셋 다 코스모스 항목이 없다.** 19세기 유럽에 막 들어온
  신참 꽃이었기 때문. `editorial_note` 에 이 사실을 남긴다.

**이야기 3편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-cosmos-order-not-universe` | 우주가 아니라 '질서'였어요 | `mythic\|healing\|dramatic` | `just_because` | history | repeated | `wikipedia-cosmos-plant` |
| `story-cosmos-chocolate` | 멸종했다던 초콜릿 코스모스 | `funny\|dramatic\|healing` | `just_because` | history | repeated | `wikipedia-cosmos-atrosanguineus` |
| `story-cosmos-horsefeed` | 말 사료에 섞여 대륙을 건넌 꽃 | `funny\|dramatic` | `just_because` | history | repeated | `wikipedia-cosmos-plant` |

**리텔링 초안**

- **`story-cosmos-order-not-universe`** ← **반전**
  `hook`: "이름이 우주라서 코스모스인 게 아니에요."
  `story_ko`: "코스모스라는 이름을 들으면 누구나 우주를 떠올립니다. 실제로 같은 말이 맞아요. 그런데 이 꽃에
  그 이름을 붙인 이유는 우주가 아니었습니다. 1791년 이 속의 이름을 정한 사람은 꽃잎이 하나도 겹치지 않고
  고르게 둘러선 모양을 보고 그리스어 코스모스, 곧 '질서 잡힌 것'을 떠올렸어요. 또 다른 설명은 코스미마,
  '보석'에서 왔다는 것입니다. 어느 쪽이든 뜻은 하나예요 — 가지런하고 반듯한 것. 우주가 코스모스라 불리는
  이유도 사실 같습니다. 무질서의 반대말이라서요."
  `era`: `18c`

- **`story-cosmos-chocolate`** ← **최고 하이라이트**
  `hook`: "초콜릿 향이 나는 코스모스가 있어요. 멸종했다더니, 살아 있었습니다."
  `story_ko`: "초콜릿 코스모스라는 꽃이 있습니다. 검붉은 꽃에서 바닐린 향이 나는데, 해가 기울수록 향이 짙어져요.
  1885년 영국의 한 종자 회사 목록에 처음 오르면서 알려졌습니다. 오래도록 '야생에서는 멸종했고 지금 남은
  것은 사람이 기른 것뿐'이라고 알려져 있었어요. 그런데 2007년, 멕시코의 식물학자가 조사에 나섰습니다.
  결과는 뜻밖이었어요. 이 꽃은 멕시코 여러 주에 여전히 넉넉하게 자라고 있었습니다. 멸종했다던 이야기가
  수십 년 동안 돌고 있었을 뿐이었어요. 사라진 줄 알았던 것이 그냥 거기 있었던 겁니다."
  `era`: `19-21c` · `culture_region`: `mexico`

- **`story-cosmos-horsefeed`** ← **유쾌**
  `hook`: "남아프리카의 코스모스 들판은 전쟁 때 실려 온 말 사료에서 시작됐어요."
  `story_ko`: "남아프리카 동부 고원에 가면 가을마다 코스모스가 지평선까지 깔립니다. 그런데 이 꽃은 원래
  아메리카 대륙 꽃이에요. 어떻게 건너갔을까요. 보어 전쟁 무렵 들여온 말 사료에 씨앗이 섞여 있었습니다.
  전쟁 물자를 따라 온 대륙을 건너간 셈이에요. 지금은 그 나라 가을 풍경의 일부가 되었습니다.
  누구도 심을 생각이 없었는데 자리를 잡아 버린 꽃이에요."
  `era`: `20c` · `culture_region`: `south-africa`

---

### 4-12. `magnolia` — 목련

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `magnolia` |
| `name_ko` | 목련 |
| `name_en` | Magnolia |
| `scientific_name` | *Magnolia kobus* |
| `colors` | `white\|cream\|pink\|purple` |
| `bloom_months` | `3\|4` |
| `fragrance_level` | `2` — 한국어 위키백과: 향기가 있다 |
| `price_band` | `2` — 개화지(꽃가지) 유통 |
| `aesthetic_tags` | `elegant\|minimal\|calm` |
| `care_summary` | "잎보다 꽃이 먼저 나오는 꽃이에요. 가지 끝을 세로로 갈라 깊은 물에 꽂아 주세요. 꽃잎이 잘 멍드니 손으로 만지지 않는 게 좋아요." |
| `editorial_note` | "한국 자생 목련(*M. kobus*, 한라산 자생) 기준. 국내 가로수·정원의 흰 목련은 대개 중국 원산 백목련(*M. denudata*)으로 종이 다르다. ASPCA 항목은 별목련(*M. stellata*)이라 종은 다르되 같은 *Magnolia* 속" |

**꽃말 3행**

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| white | 자연을 사랑하는 마음 | victorian | 19c | `greenaway-1884` | repeated |
| | 꾸미지 않은 것 | japan | modern | `wikipedia-hanakotoba` | repeated |
| white | 북쪽을 향해 피는 꽃 | korea | modern | `wikipedia-ko-mokryeon` | varies |

- PD 원문: `'Magnolia — Love of Nature'` (Greenaway 1884)
- **동서가 같은 방향을 가리키는 드문 꽃.** 빅토리아는 `자연을 사랑함`, 하나코토바는 `자연스러움`.

**이야기 4편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-magnolia-older-than-bees` | 벌보다 오래된 꽃 | `mythic\|healing\|dramatic` | `just_because` | history | repeated | `wikipedia-magnolia` |
| `story-magnolia-north-facing` | 북쪽을 향해 피는 꽃 | `romantic\|tragic` | `confession` | folklore | varies | `wikipedia-ko-mokryeon` |
| `story-magnolia-magnol` | 이름에 남은 식물학자 | `healing` | `just_because` | history | repeated | `wikipedia-magnolia` |
| `story-magnolia-sinyi` | 봉오리를 말리면 약이 돼요 | `funny\|healing` | `comfort` | history | repeated | `wikipedia-ko-mokryeon` |

**리텔링 초안**

- **`story-magnolia-older-than-bees`** ← **최고 하이라이트**
  `hook`: "이 꽃이 필 때, 세상에는 아직 벌이 없었어요."
  `story_ko`: "목련과 식물의 화석은 구천오백만 년 전까지 거슬러 올라갑니다. 공룡이 아직 걸어 다니던 시절이고,
  더 중요한 건 그때 아직 벌이 없었다는 거예요. 그래서 목련은 벌이 아니라 딱정벌레에게 꽃가루를 맡기도록
  생겼습니다. 딱정벌레는 벌처럼 얌전하지 않아서 꽃 위를 기어 다니며 씨방을 갉아 놓는데, 목련의 씨방이
  유난히 단단한 게 그 때문이에요. 꽃잎과 꽃받침이 나뉘지 않고 한 종류로만 되어 있는 것도 그 시절 그대로입니다.
  봄마다 창밖에 피는 저 꽃이, 사실은 아주 오래된 설계도예요."
  `era`: `ancient`

- **`story-magnolia-north-facing`** ← **한국 설화**
  `hook`: "봉오리 끝이 북쪽을 향해요. 그래서 북향화라 불립니다."
  `story_ko`: "목련은 피기 직전 봉오리 끝이 북쪽으로 살짝 기웁니다. 그래서 북향화, 북쪽을 향한 꽃이라
  불려요. 여기에 옛이야기가 하나 붙어 있습니다. 북쪽에 사는 사내를 마음에 둔 공주가 있었다는 이야기예요.
  꽃이 늘 그쪽을 보고 있는 건 그 마음이 남아서라고요. 사실 봉오리가 기우는 건 남쪽 면이 햇볕을 더 받아
  빨리 자라기 때문이지만, 그 설명을 알고 봐도 이야기 쪽이 더 오래 남습니다."
  `era`: `modern` · `culture_region`: `korea`
  `editorial_note`: "한국어 위키백과가 '전설에 따르면'으로 소개 — confidence varies"

- **`story-magnolia-magnol`**
  `hook`: "1703년에 붙은 이름이 지금까지 그대로예요."
  `story_ko`: "목련의 학명 마그놀리아는 프랑스 식물학자 피에르 마뇰의 이름에서 왔습니다. 1703년, 플뤼미에라는
  사람이 자기 책에 그 이름을 처음 실었어요. 린네가 학명 체계를 정리하기도 전의 일입니다. 삼백 년 넘게
  한 사람의 이름이 봄마다 불리고 있는 셈이에요. 정작 마뇰 본인은 자기 이름이 이렇게 오래 갈 줄 몰랐겠지요."
  `era`: `18c` · `culture_region`: `france`

- **`story-magnolia-sinyi`**
  `hook`: "코가 막힐 때 쓰는 약재가 이 꽃봉오리예요."
  `story_ko`: "이른 봄, 아직 벌어지지 않은 목련 꽃봉오리를 따서 말리면 신이라는 약재가 됩니다. 한방에서는
  코막힘이나 축농증, 두통에 써 왔어요. 그러니까 봄마다 우리가 올려다보는 그 봉오리는, 벌어지기 전까지는
  약이고 벌어진 다음에는 꽃입니다. 며칠 차이로 신분이 바뀌는 셈이에요."
  `era`: `modern` · `culture_region`: `korea`

---

### 4-13. `pansy` — 팬지

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `pansy` |
| `name_ko` | 팬지 |
| `name_en` | Pansy |
| `scientific_name` | *Viola* × *wittrockiana* |
| `colors` | `purple\|yellow\|white\|blue\|red\|orange` |
| `bloom_months` | `10\|11\|12\|1\|2\|3\|4\|5` |
| `fragrance_level` | `1` — 일부 품종만 향이 있다 |
| `price_band` | `1` |
| `aesthetic_tags` | `cute\|vivid` |
| `care_summary` | "화분으로 두면 서리가 내려도 견딥니다. 시든 꽃을 부지런히 떼어 내면 훨씬 오래 피어요. 꽃은 먹을 수 있지만, 화원에서 산 것은 농약이 남아 있을 수 있어 드시지 마세요." |
| `editorial_note` | "ASPCA 미등재(P 목록 91건 확인 — `Pansy Orchid`(*Miltonia*, 난과)만 있고 단독 `Pansy` 없음) — pet_safety 근거는 NC State. NC State 가 꽃 식용을 적으면서 농원 구입품의 살충제 처리 가능성을 함께 경고해 care_summary 에 반영" |

**꽃말 4행**

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| | 생각 — 당신을 떠올리고 있어요 | victorian | 19c | `greenaway-1884` | repeated |
| | 나를 생각해 주세요 | victorian | 19c | `dumont-1851` | repeated |
| | 사려 깊음, 마음 씀 | japan | modern | `wikipedia-hanakotoba` | repeated |
| | 기억 — 잊지 않겠다는 마음 | western | 15c | `wikipedia-pansy` | repeated |

- **세 문화권이 전부 '생각'이라 적은 유일한 꽃.** 어원부터가 프랑스어 팡세('생각')다.
  물망초·아이리스와 함께 **"전하고 싶은 말이 있을 때"** 카드 3종을 이룬다.
- PD 원문: `'Pansy — Thoughts'` (Greenaway 1884), `'Pansy, (Think of me)'` (Dumont 1851)

**이야기 4편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-pansy-pensee` | 이름 자체가 '생각'이에요 | `healing\|romantic` | `just_because\|comfort\|anniversary` | history | repeated | `wikipedia-pansy` |
| `story-pansy-midsummer` | 한여름 밤의 사랑 묘약 | `romantic\|funny\|mythic` | `confession` | literary | repeated | `wikipedia-viola-tricolor` |
| `story-pansy-ophelia` | 오필리아가 건넨 꽃 | `tragic\|dramatic` | `comfort` | literary | repeated | `wikipedia-pansy` |
| `story-pansy-weed-to-400` | 잡초에서 사백 품종까지, 이십 년 | `dramatic\|funny` | `just_because` | history | repeated | `wikipedia-pansy` |

**리텔링 초안**

- **`story-pansy-pensee`** ← **서비스 콘셉트 직결**
  `hook`: "팬지라는 이름은 프랑스어 '생각'에서 왔어요."
  `story_ko`: "팬지는 프랑스어 팡세에서 온 이름입니다. 뜻은 그대로 '생각'이에요. 15세기 중엽 영어로 넘어올 때,
  이 꽃이 누군가를 기억한다는 뜻으로 쓰이고 있었기 때문에 그 이름이 붙었습니다. 그래서 1884년 영국 꽃말
  사전은 팬지를 한 단어로 적어요 — 생각. 1851년 미국 사전은 '나를 생각해 주세요'라고 적고요. 일본
  하나코토바도 사려 깊음이라 적습니다. 세 나라가 서로 다른 시기에, 같은 말을 골랐어요. 무슨 말을 해야
  할지 모르겠을 때 건네기에 이만한 꽃이 없습니다."
  `era`: `15-19c` · `culture_region`: `western-japan`

- **`story-pansy-midsummer`** ← **최고 재미**
  `hook`: "『한여름 밤의 꿈』의 사랑 묘약이 이 꽃이에요."
  `story_ko`: "셰익스피어의 『한여름 밤의 꿈』에서 요정 왕 오베론은 퍽에게 꽃 한 송이를 구해 오라고 시킵니다.
  처녀들이 '사랑에 빠져 아무 일도 못 하게 하는 꽃'이라 부르는 서쪽의 작은 꽃이요. 그게 야생 팬지입니다.
  오베론의 설명에 따르면 큐피드의 화살이 겨눈 데를 빗나가 이 꽃에 꽂혔고, 그래서 원래 젖빛이던 꽃이
  사랑의 상처로 보랏빛이 되었다고 해요. 잠든 눈꺼풀에 즙을 바르면 눈을 떠서 처음 본 상대에게 반해 버립니다.
  그날 밤 숲에서 벌어진 온갖 소동이 전부 이 작은 꽃 하나 때문이었어요."
  `era`: `16c` · `culture_region`: `england`
  `editorial_note`: "PD 원문(참고): `'Before, milk-white, now purple with love's wound, / And maidens call it
  love-in-idleness.'` — 야생 팬지(*Viola tricolor*)로, 원예종 팬지(*V.* × *wittrockiana*)의 조상"

- **`story-pansy-ophelia`**
  `hook`: "오필리아가 마지막으로 나눠 준 꽃 중 하나였어요."
  `story_ko`: "『햄릿』 4막에서 오필리아는 사람들에게 꽃을 하나씩 나눠 줍니다. 로즈메리는 기억을 위해,
  팬지는 생각을 위해서요. 무너져 가는 사람이 마지막으로 한 일이 꽃 이름과 그 뜻을 또박또박 말하는 것이었어요.
  그 장면 덕분에 팬지가 '생각'을 뜻한다는 사실이 사백 년 동안 잊히지 않았습니다. 꽃말 사전보다 연극 한 편이
  더 오래 갔던 셈이에요."
  `era`: `16c` · `culture_region`: `england`
  `editorial_note`: "PD 원문(참고): `'There's pansies, that's for thoughts.'` (Hamlet IV.5)"

- **`story-pansy-weed-to-400`**
  `hook`: "잡초 취급받던 꽃이 이십 년 만에 사백 품종이 됐어요."
  `story_ko`: "1812년, 메리 엘리자베스 베넷이라는 사람이 아버지의 정원에서 야생 팬지를 모아 기르기 시작했습니다.
  비슷한 시기에 갬비어 경의 정원사 윌리엄 톰슨도 서로 다른 제비꽃 종을 교배하고 있었어요. 그때까지 팬지는
  들에 흔한 잡초에 가까웠습니다. 그런데 1833년, 이름 붙은 품종이 사백 가지를 넘었어요. 이십 년 만의 일입니다.
  1830년대에는 꽃 한가운데 검은 얼룩이 우연히 나타났는데, 사람 얼굴처럼 보인다며 크게 유행했어요.
  지금 우리가 아는 그 '팬지 얼굴'이 그때 생긴 겁니다."
  `era`: `19c` · `culture_region`: `england`

---

### 4-14. `poinsettia` — 포인세티아

**카탈로그 행**

| 컬럼 | 값 |
|---|---|
| `id` | `poinsettia` |
| `name_ko` | 포인세티아 |
| `name_en` | Poinsettia |
| `scientific_name` | *Euphorbia pulcherrima* |
| `colors` | `red\|white\|pink\|cream\|magenta` |
| `bloom_months` | `11\|12\|1` |
| `fragrance_level` | `0` |
| `price_band` | `1` |
| `aesthetic_tags` | `vivid\|cute` |
| `care_summary` | "줄기를 자르면 나오는 하얀 진액이 입과 위를 자극할 수 있어요. 반려동물이 씹지 않게 해주시고, 진액이 피부에 닿으면 씻어 주세요. '맹독'이라는 말이 오래 돌았지만 사실이 아닙니다. 서늘한 바람이 직접 닿지 않는 곳에 두세요." |
| `editorial_note` | "붉은 부분은 꽃잎이 아니라 포엽(잎)이다. ASPCA 가 스스로 'generally over-rated in toxicity'(독성이 대체로 과장돼 있다)라고 적어 둔 카탈로그 내 유일한 항목 — 위험 표시는 하되 과장하지 않는 서술의 기준 사례" |

**꽃말 3행** — 19세기 서양 꽃말 사전에 없는 꽃

| color | meaning_ko(초안) | culture_region | era | source_id | confidence |
|---|---|---|---|---|---|
| red | 거룩한 밤의 꽃 | mexico | 17c | `wikipedia-poinsettia` | repeated |
| red | 스러지는 것 — 맑은 것은 다 그렇게 진다 | aztec | ancient | `wikipedia-poinsettia` | repeated |
| red | 축하 — 한 해의 끝에 건네는 마음 | western | modern | `wikipedia-poinsettia` | varies |

- 아스텍 이름 **쿠에틀라쇼치틀**의 뜻이 위키피디아에 그대로 적혀 있다:
  "mortal flower that perishes and withers like all that is pure". 이 한 줄이 꽃말이 된다.

**이야기 5편**

| story_id | title | moods | intents | story_type | confidence | source |
|---|---|---|---|---|---|---|
| `story-poinsettia-not-poison` | 백 년 동안 억울했던 꽃 | `funny\|dramatic\|healing` | `just_because` | history | repeated | `wikipedia-poinsettia` |
| `story-poinsettia-pepita` | 드릴 게 잡초뿐이었던 밤 | `healing\|mythic\|romantic` | `apology\|comfort` | folklore | repeated | `mexiconewsdaily-poinsettia` |
| `story-poinsettia-bracts` | 붉은 건 꽃잎이 아니에요 | `funny` | `just_because` | history | repeated | `wikipedia-poinsettia` |
| `story-poinsettia-ecke-secret` | 한 집안이 지킨 접목 비법 | `dramatic\|funny` | `just_because` | history | repeated | `wikipedia-poinsettia` |
| `story-poinsettia-cuetlaxochitl` | 이름을 되찾으려는 움직임 | `dramatic\|healing` | `just_because` | history | repeated | `wikipedia-poinsettia` |

**리텔링 초안**

- **`story-poinsettia-not-poison`** ← **최고 하이라이트 · 사용자 요청 소재**
  `hook`: "'한 잎만 먹어도 죽는다'는 말, 백 년 된 헛소문이에요."
  `story_ko`: "1919년, 아이가 포인세티아 잎을 먹고 죽었다는 이야기가 돌기 시작했습니다. 그 뒤로 백 년 동안
  이 꽃은 맹독 식물 취급을 받았어요. 그런데 확인해 보니 근거가 없었습니다. 쥐에게 사람 기준으로 잎 오백 장에
  해당하는 양을 먹여 봐도 치사량이 나오지 않았어요. 1985년부터 1992년까지 중독관리센터에 들어온 신고를
  전부 훑어본 연구에서도 사망은 한 건도 없었고, 92.4퍼센트는 아무 증상이 없었습니다. 미국동물학대방지협회조차
  이 꽃 항목에 '독성이 대체로 과장돼 있다'고 적어 두었어요. 물론 진액이 입과 위를 자극해 토할 수는 있습니다.
  주의는 필요하지만, 겁낼 일은 아니었던 거예요."
  `era`: `20c` · `culture_region`: `western`

- **`story-poinsettia-pepita`** ← **`apology` 보강**
  `hook`: "드릴 게 없어서, 길가의 잡초를 꺾어 갔어요."
  `story_ko`: "멕시코에 전해지는 이야기예요. 크리스마스 이브 미사에 가던 페피타라는 소녀에게는 아기 예수 앞에
  놓을 것이 아무것도 없었습니다. 부끄러워서 발이 안 떨어졌지요. 그러다 길가에 아무렇게나 자란 풀을 한 아름
  꺾어 안고 들어갔어요. 제단 앞에 그 볼품없는 다발을 내려놓는데, 부끄러움에 흘린 눈물이 잎에 떨어졌습니다.
  그러자 잎이 붉게 타올랐다고 해요. 사람들은 그날 밤의 일을 기적이라 불렀고, 그때부터 이 꽃을 '거룩한 밤의
  꽃'이라 부릅니다. 게레로주 탁스코의 수사들이 이 이야기를 성탄 행사에 넣으면서 널리 퍼졌어요.
  가진 게 없어 미안했던 마음이, 가장 붉은 꽃이 된 이야기입니다."
  `era`: `17c` · `culture_region`: `mexico`
  `editorial_note`: "Mexico News Daily 기사 근거. 위키피디아 본문에는 페피타 전설이 없고 '17세기부터
  프란치스코회 수사들이 성탄 행사에 이 꽃을 썼다'는 사실만 있음 — 전설 부분은 언론 근거이므로
  상업화 시점 재확인 권장"

- **`story-poinsettia-bracts`** ← **유쾌**
  `hook`: "붉은 건 꽃잎이 아니라 잎이에요. 진짜 꽃은 가운데 알갱이."
  `story_ko`: "포인세티아에서 가장 눈에 띄는 그 붉은 부분은 꽃잎이 아닙니다. 포엽이라고 부르는 잎이에요.
  진짜 꽃은 그 한가운데 오종종하게 모여 있는 노란 알갱이들입니다. 그러니까 이 식물은 꽃이 너무 작아서
  눈에 안 띄니까, 아예 주변 잎을 붉게 물들여 표지판으로 쓰는 쪽을 택한 거예요. 크리스마스마다 우리가
  감탄하며 보는 것은, 정확히 말하면 잎입니다."
  `era`: `modern`

- **`story-poinsettia-ecke-secret`** ← **반전**
  `hook`: "한 집안이 1990년대까지 이 꽃 시장을 거의 독점했어요."
  `story_ko`: "미국의 에케 집안은 오랫동안 포인세티아 시장을 사실상 독점했습니다. 비결은 접목 기술이었어요.
  그냥 기르면 줄기 하나가 밋밋하게 올라오는데, 이 집안의 방법을 쓰면 한 그루에서 가지가 여러 개 나와
  훨씬 풍성해졌습니다. 그 방법을 아무에게도 알려 주지 않았어요. 그러다 1980년대 말, 한 대학 연구자가
  그 원리를 알아냈고 논문으로 공개해 버렸습니다. 비밀이 공개된 순간 독점은 끝났어요. 지금 우리가 겨울마다
  싸게 살 수 있는 건, 누군가 비법을 알아내 그냥 나눠 줬기 때문입니다."
  `era`: `20c` · `culture_region`: `usa`

- **`story-poinsettia-cuetlaxochitl`** ← **명예 프레이밍 필요**
  `hook`: "이 꽃에는 오백 년 더 오래된 이름이 있어요."
  `story_ko`: "포인세티아라는 이름은 1820년대 멕시코에 파견됐던 미국 외교관의 성에서 왔습니다. 그가 이 꽃을
  미국으로 보냈고, 1836년경부터 그 이름으로 불렸어요. 그런데 이 꽃에는 훨씬 오래된 이름이 있습니다.
  아스텍 사람들은 쿠에틀라쇼치틀이라 불렀어요. 맑은 것이 다 그렇듯 스러지는 꽃이라는 뜻입니다.
  그들은 이 꽃의 흰 진액으로 열을 내리고, 붉은 포엽을 삶아 물감을 만들었어요. 요즘은 원래 이름으로
  돌려 부르자는 목소리가 있습니다. 이름을 어떻게 부를지가 그 꽃을 어떻게 기억할지를 정하니까요."
  `era`: `ancient-modern` · `culture_region`: `mexico`
  `editorial_note`: "명명 인물에 대한 역사적 평가는 서술하지 않고, '원래 이름으로 부르자는 움직임이 있다'는
  사실만 담음"

---

## 5. 테마 카테고리 배정 (design-spec §1.4c v3.2)

신규 14종은 명시 맵(`src/lib/theme/`)에 없으므로 **대표색(`colors[0]`) 폴백 규칙**이 적용된다.
이번에도 `colors` 순서를 그 규칙을 의식해 "가장 대표적인 색이 맨 앞"이 되게 적었다.

| 꽃 | `colors[0]` | 폴백 카테고리 |
|---|---|---|
| narcissus | yellow | `gold` |
| marigold | yellow | `gold` |
| forget-me-not | blue | `dusk` |
| iris | purple | `dusk` |
| violet | purple | `dusk` |
| cherry-blossom | pink | `?` — **분홍 폴백 규칙 확인 필요**(§6-4) |
| cosmos | pink | `?` |
| camellia | red | `wine` |
| corn-poppy | red | `wine` |
| poinsettia | red | `wine` |
| jasmine | white | `forest` |
| babys-breath | white | `forest` |
| magnolia | white | `forest` |
| pansy | purple | `dusk` |

합산(기존 17종 + 신규 14종): `forest` 7 · `dusk` 9 · `gold` 5 · `wine` 6 · **`ivory` 2 (이번에도 신규 배정 없음)**
· 분홍 2종 미정.

- seed-v3 §7-4 가 남긴 **`ivory` 편중 문제가 해소되지 않았다.** 오히려 `dusk` 가 더 두꺼워졌다.
- **크림·화이트 계열이 잘 어울리는 신규 꽃**(`babys-breath` `magnolia` `jasmine`)을 명시 맵에서
  `ivory` 로 옮기는 것이 자연스러워 보이나, 이는 UI 판단이라 손대지 않았다(§6-4).

---

## 6. Advisor 판단이 필요한 후속 항목

1. **`nihhs-*` 한국 꽃말이 신규 14종에도 하나도 없다.** seed-v3 §7-1 의 문제(POST 검색 폼 + 날짜 기반 `dataNo`)가
   그대로다. 이번엔 한국어 위키백과와 언론 기사로 한국 해석을 5건 채웠으나(수선화 · 동백 · 제비꽃 · 목련 · 개양귀비),
   공신력 있는 국내 꽃말 출처는 여전히 없다. **국내 서비스라면 이 구멍이 제일 크다.**
2. **`marigold` 독성 등급**(§2-7). ASPCA 에 *Tagetes* 가 없고, NC State 는 `Poison Severity: Low` 지만
   그 내용이 **광독성 접촉 피부염**이라 개·고양이 섭취 기준으로 쓸 수 없다. 작성자 권고는 `none` + care_summary 경고.
   Pet Poison Helpline 로 받치려 했으나 두 번 모두 접속 실패(ECONNREFUSED) — 재시도 필요.
3. **`corn-poppy` 독성 등급**(§2-8). 이번 확장에서 **가장 애매한 한 건**. A안(`none`, 권고) / B안(`mild_gi`)의
   근거를 §2-8 에 정리해 두었다. **적재 전에 반드시 결정이 필요하다.**
4. **분홍 대표색의 테마 폴백이 정의돼 있는지**(§5). `cherry-blossom` · `cosmos` 두 종이 `colors[0] = pink` 인데
   기존 17종에는 분홍이 대표색인 꽃이 없었다. 폴백 규칙에 분홍 항목이 없다면 이 둘은 배정이 비게 된다.
   함께 **`ivory` 편중 해소**(babys-breath · magnolia · jasmine 이동 검토)도 판단 대상.
5. **`rules.csv` 는 여전히 5종만 다룬다.** seed-v3 때 8종이 도감·이야기용으로만 들어갔고, 이번 14종도 같다.
   **31종 중 5종만 추천 결과에 오른다** — 카탈로그가 커질수록 이 불균형이 눈에 띈다. 규칙 확장 판단이 필요하다.
6. **`story_type = original` 이 여전히 0건이다.** 이번 60편도 `history` 45 · `folklore` 10 · `literary` 5 로
   셋만 쓴다. §1.5f 가 허용한 창작 이야기를 실제로 실을지는 편집 판단이라 이번에도 손대지 않았다.
   **`history` 쏠림이 심해졌다**(전체의 75%) — 검증 가능한 사실 위주로 모은 결과다.
7. **이미지가 전부 비어 있다.** 신규 14종의 `image_url` 은 `docs/image-assets.md` 승인 절차를 거쳐야 한다.
   특히 **벚꽃 · 동백 · 코스모스**는 §1.5g(사진 위 텍스트 가독성) 기준을 맞추기 어려운 밝은 사진이 많다.
8. **`name_ko` 리네이밍**(seed-v3 §7-3 미해결). `tulip-white`(색 7종) · `rose-red`(색 4종)에 더해
   이번에 `cherry-blossom`(벚꽃 — 종 3개를 묶음) · `iris`(더치/저먼/노랑붓꽃) · `narcissus`(나팔/제주)가
   같은 상태로 추가된다.
9. **`apology` 가 여전히 가장 얇다**(5 → 6건). 이번 14종에서 사과와 자연스럽게 붙는 이야기는
   포인세티아 페피타 하나뿐이었다. 사과 상황은 서비스의 핵심 진입점 중 하나인데(§1.5d `먼저 손 내밀고 싶을 때`)
   이야기 재고가 6건이면 같은 이야기가 반복 노출된다. **다음 확장의 1순위 목표로 삼을 만하다** —
   "화해"·"용서"·"다시 시작"에 걸리는 꽃(예: 히아신스 아폴론과 히아킨토스, 수레국화, 물망초 계열)을
   의도적으로 겨냥해 모으는 편이 낫다.

---

## 7. 수집했으나 제외한 것

| 후보 | 제외 사유 |
|---|---|
| 제비꽃 **나폴레옹의 '카포랄 비올레트'** (1814년 엘바 유배 → "제비꽃 필 때 돌아오겠다" → 지지자들이 제비꽃을 달고 다님 → "제비꽃을 좋아하십니까?"라는 암호) | **1차 자료를 못 찾았다.** 영어 위키피디아 *Viola odorata* · *Viola (plant)* 어디에도 나폴레옹 언급이 없다. 프랑스 나폴레옹 재단 페이지는 403 으로 열리지 않았다. 블로그·2차 자료에서만 반복돼 제외. **다시 시도할 가치가 큰 1순위** — 열 수 있는 기관 자료를 찾으면 이번 확장 최고의 이야기가 된다 |
| 벚꽃 **1910년 첫 선적분이 병해충으로 소각된 뒤 1912년에 다시 보냈다는 이야기** | 위키피디아 *Cherry blossom* 본문에서 확인되지 않는다. 1912년 기증만 확인돼 그 선까지만 썼다 |
| 벚꽃 **고노하나사쿠야히메**(벚꽃의 여신) | 위키피디아 *Cherry blossom* 본문에 없다. 널리 도는 이야기지만 1차 근거를 못 찾아 제외 |
| 초콜릿 코스모스 **"1902년의 단일 개체에서 갈라진 복제품"** | **사실이 아닐 가능성이 높다.** 위키피디아 *Cosmos atrosanguineus* 는 1885년 종자 목록 등재만 적고, 단일 클론 주장이 없다. 오히려 "야생 멸종" 주장 자체를 반박한다. 이 반박을 이야기로 실었다(`story-cosmos-chocolate`) |
| 코스모스 **한국 도입 시기(1910년 전후 선교사 유입) · '살살이꽃'** | 검색으로는 나무위키·블로그만 나온다. 한국어 위키백과 `코스모스` 는 동음이의 문서이고 `코스모스_(식물)` 은 404. **국립수목원·농사로 등 공공 자료로 재시도 필요** — 한국 소재가 하나 비어 있다 |
| 안개꽃 **'안개가 내려앉은 듯해서 안개꽃'이라는 이름 유래** | 언론·상업 블로그에서만 반복된다. 한국어 위키백과 `안개꽃` 은 stub 이라 이름 유래를 적지 않았다. 대신 학명 어원(석고를 사랑함)으로 이야기를 만들었다 |
| 수선화 **김정희 「수선화부」 · '금잔옥대'** | 경향신문 기사에 해당 표현이 나오지 않았다. 검색 결과에는 있으나 원문을 확인하지 못해 이야기에서 뺐다. 완당집 원문으로 재확인 필요 |
| 마리골드 **ASPCA 가 마리골드를 비독성으로 등재했다는 주장** | **사실이 아니다**(§2-7). ASPCA 의 '마리골드'는 전부 금잔화(*Calendula*)이고 *Tagetes* 는 아예 없다. 여러 반려동물 블로그가 이 둘을 섞어 쓴다 |
| 물망초 **ASPCA 가 물망초를 비독성으로 등재했다는 주장** | **사실이 아니다**(§2-6). ASPCA 의 `F` 목록 41건 전수 확인 결과 없다. 리시안셔스 때와 같은 상황 |
| 아이리스 **클로비스가 개구리를 붓꽃으로 바꿨다는 문장 방패 이야기** | 위키피디아 *Iris (plant)* 에는 있으나 *Fleur-de-lis* 는 이를 후대의 각색으로 정리한다. 두 문서가 어긋나 이야기로 만들지 않고, 확인되는 선(1211년 인장)까지만 썼다 |
| 동백 **제주에서 동백을 불길하게 여긴다는 전승** | 한국어 위키백과에 한 줄 있으나 근거가 얇고, 4·3 이야기와 나란히 놓으면 오해를 부를 수 있어 제외 |
| 재스민 **그라스에서 새벽 전에 꽃을 딴다는 이야기** | 위키피디아 *Jasmine* 에서 확인되지 않는다. 대신 *Jasminum sambac* 의 개화 시각(저녁 6~8시)으로 이야기를 만들었다 |
| 개양귀비 **양귀비(楊貴妃) 이름 유래** | 한국어 위키백과가 "중국의 역사적 인물과 무관"이라고 명시한다. 우미인초(虞美人草) 쪽만 실었다 |
| 팬지 **'하트시즈'와 성 에우프라시아** | 위키피디아 *Pansy* 에 한 줄 있으나 어원 설명이 짧아 이야기로 세우기 어렵다. 소재로 남겨 둠 |
| 목련 **목련이 공룡보다 오래됐다는 표현** | 목련과 화석은 9,500만 년 전 = 백악기 후기로 **공룡과 같은 시대**다. "공룡보다 오래된"은 과장이라 쓰지 않고, 확인되는 사실(**벌보다 오래됐다**)로 바꿔 썼다 |
| 해바라기 **피보나치 나선** (seed-v3 §8 보류분) | 이번에도 보류. 도감 팁 후보 |
| 국화 **중양절** (seed-v3 §8 "다음 확장 1순위") | **이번에도 못 실었다.** 신규 14종에 집중하느라 기존 꽃 보강을 하지 않았다. 다음 확장으로 다시 넘김 |

### 열지 못한 URL (인용하지 않음)

| URL | 결과 |
|---|---|
| https://www.napoleon.org/en/history-of-the-two-empires/articles/the-violet-a-napoleonic-symbol/ | HTTP 403 |
| https://www.almanac.com/poinsettia-christmas-story | HTTP 403 |
| https://www.plant-lore.com/plantofthemonth/poinsettia-flores-de-noche-buena/ | HTTP 401 |
| https://www.petpoisonhelpline.org/poison/marigold/ | 연결 실패 (2회) |
| https://ko.wikipedia.org/wiki/코스모스_(식물) | HTTP 404 |
| https://www.aspca.org/.../{poppy, marigold, violet, cosmos, pansy, forget-me-not} | HTTP 404 — **부재 확인 근거로만 사용**(§2-6) |
