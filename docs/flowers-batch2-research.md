# 정식 도감 확장 배치 2 조사 기록 — 기본 데이터·꽃말·반려동물 안전성 (seed-v7, 2026-08-17)

꽃 47종 → **59종**으로 늘리는 배치 2 중에서 `flowers.csv` · `meanings.csv` · `pet_safety.csv` 세 파일의
조사·판단 기록이다. 같은 배치의 **이야기(`stories.csv`)와 사진(`docs/image-assets.md`)은 다른 작업자 담당**이라
이 문서는 다루지 않는다.

`docs/catalog-expansion-research.md`(seed-v3) · `docs/catalog-expansion-2-research.md`(seed-v4)의 후속이며,
**이번 12종 기본 데이터의 단일 원본**이다. 판정 규칙은 앞선 두 문서의 선례를 그대로 따랐다 — 종이 어긋나면
가장 가까운 출처를 쓰고 차이를 `editorial_note` 에 남긴다(sunflower·marigold·daisy 선례), 성분이 1차 자료로
확인되면 체중이 작은 개·고양이 기준으로 보수 판정한다(corn-poppy·water-lily 선례).

> **적재까지 마쳤다.** 아래 판단은 전부 CSV 에 반영돼 있고 `npm run seed`(dry-run) 교차 검증 7종을 통과했다.

---

## 0. 결과 요약

| 파일 | 이전 | 이번 배치 후 | 증가 |
|---|---|---|---|
| `flowers.csv` | 47 | **59** | +12 |
| `meanings.csv` | 246 | **305** | +59 |
| `pet_safety.csv` | 94 | **118** | +24 (12종 × cat·dog) |

**신규 12종**

| id | 국문명 | 확정 학명 | 후보 학명에서 바뀐 것 | 독성 판정 |
|---|---|---|---|---|
| `phalaenopsis` | 호접란 | *Phalaenopsis* | — (속명 유지) | 무독 |
| `alstroemeria` | 알스트로메리아 | *Alstroemeria* | ⚠ `× hybrida` → **속명** | 무독 |
| `anthurium` | 안스리움 | *Anthurium andraeanum* | — | mild_gi |
| `gardenia` | 치자 | *Gardenia jasminoides* | — | mild_gi |
| `eucalyptus` | 유칼립투스 | *Eucalyptus cinerea* | — | **serious** |
| `statice` | 스타티스 | *Limonium sinuatum* | — | 무독 |
| `mimosa` | 미모사(은엽아카시아) | *Acacia dealbata* | — | 무독(근거 얇음) |
| `bouvardia` | 부바르디아 | *Bouvardia × domestica* | — (RHS 로 확인) | 무독(근거 얇음) |
| `scabiosa` | 스카비오사 | *Scabiosa atropurpurea* | — | 무독 |
| `plum-blossom` | 매화 | *Prunus mume* | — (단 `name_en` → Japanese Apricot) | **serious** |
| `azalea` | 진달래 | *Rhododendron mucronulatum* | — | **serious** |
| `cotton` | 목화 | *Gossypium hirsutum* | — | mild_gi |

**꽃말 수집 결과 (종당 3~6행 목표)**

| 종 | 행수 | | 종 | 행수 |
|---|---|---|---|---|
| anthurium · gardenia · statice · plum-blossom · azalea | 6 | | scabiosa · phalaenopsis · alstroemeria | 5 |
| mimosa · cotton | 4 | | **eucalyptus · bouvardia** | **3 (최소치)** |

- `eucalyptus` 가 가장 얇다. 부재료 잎이라 옛 꽃말 사전 어디에도 없고(그리너웨이·뒤몽 모두 미수록)
  하나코토바 한 곳에서만 나온다 → §6-7.
- **출처 없는 꽃말은 한 줄도 넣지 않았다.** 채우지 못한 자리는 비운 채로 두었다.

---

## 1. 저작권 처리

- **타 사이트 문장을 옮긴 곳은 없다.** `meaning_ko` · `caution_note` · `care_summary` · `editorial_note`
  는 전부 사실관계만 참고해 새로 쓴 우리 문장이다.
- 원문 인용은 **퍼블릭 도메인 원전**과 **출전 표시용 짧은 인용**으로만 남겼다.
  - Greenaway(1884, PD): `Azalea — Temperance.` / `Cape Jasmine — I'm too happy.` /
    `Scabious — Unfortunate love.` / `Sweet Scabious — Widowhood.` / `Plum Tree — Fidelity.` /
    `Mimosa (Sensitive Plant) — Sensitiveness.`
  - Dumont(1851, PD): `Sensitive Plant, (Chastity)`
- 일본어 꽃말은 **원어 표기(「」 안)만 옮기고 풀이는 우리 문장으로 새로 썼다.**
- NC State·ASPCA·Merck 의 영문 임상 서술은 **번역하지 않고 판정 근거로만 썼다** —
  `care_summary` 는 증상 나열이 아니라 보호자 행동 지침으로 다시 썼다.

---

## 2. 학명 판정 — 무엇을 검증했고 무엇을 바꿨나

브리프가 준 후보 학명을 **유통 실물 기준**으로 전수 검증했다. 결과는 §0 표와 같고, 판단이 필요했던 것만 아래에 적는다.

### 2-1. `alstroemeria` — 후보 `Alstroemeria × hybrida` 를 **속명으로 내렸다**

열어 본 세 출처가 **모두 속 단위**로 다룬다.

| 출처 | 표기 |
|---|---|
| ASPCA (Peruvian Lily) | `Alstroemeria` |
| NC State | `Alstroemeria` |
| 하나코토바 | `Alstroemeria spp.` |

`Alstroemeria × hybrida` 를 정명으로 싣는 1차 자료를 찾지 못했다. **water-lily 의 `Nymphaea` 선례**
(자료가 모두 속 단위여서 속명으로 둔 경우)를 따라 속명으로 적었다. 카탈로그에서 속명 표기는 이제
`Nymphaea` · `Alstroemeria` · `Phalaenopsis` 셋이다.

### 2-2. `phalaenopsis` — 속명 유지 (브리프와 같은 결론)

ASPCA `Phalaenopsis sp.` · NC State `Phalaenopsis` 로 속 단위이고, 하나코토바만 원종 *P. aphrodite* 를 적는다.
국내 유통품은 원종이 아니라 교배종이라 원종명을 쓰면 실물과 어긋난다 → 속명.

### 2-3. `bouvardia` — 후보 `Bouvardia × domestica` **확인됨**

RHS 가 `Bouvardia × domestica`(house bouvardia)를 표제명으로 싣는다.
다만 **그 문서 스스로 name status 를 unresolved 로 적어 두고**, 하나코토바는 같은 꽃을 `Bouvardia hybrida`
로 적어 표기가 갈린다. 원예 정명 쪽을 택했다 — `Gladiolus × hortulanus` · `Dahlia × hortensis` 와 같은 규칙.

### 2-4. `plum-blossom` — 학명은 맞고 **영문명이 틀렸다**

매화는 자두가 아니다. NC State 는 *P. mume* 의 통칭 첫머리에 **Japanese Apricot** 을 두고
(Japanese Flowering Apricot · Japanese Flowering Plum · Mei · Mume 가 뒤따른다),
ASPCA 는 Plum(*P. domestica*)과 Apricot(*P. armeniaca*)을 **따로** 등재하면서 *P. mume* 는 싣지 않는다.

`name_en` 을 `Japanese Apricot` 으로 적었다 — iris(Dutch Iris) · marigold(African Marigold) ·
magnolia(Kobus Magnolia) · jasmine(Arabian Jasmine) 선례와 같은 처리다. `plum-blossom` 이라는 slug 는
한국어 매화의 관용 영문 표기라 그대로 두었다.

### 2-5. `azalea` — 한국 진달래를 서양 azalea 와 갈라 두었다

기준 종은 **한국 자생 진달래 *Rhododendron mucronulatum***(한국어 위키백과는 var. *mucronulatum* 으로 적는다).
NC State 의 통칭이 **Korean Rhododendron** 이라 `name_en` 에 그대로 썼다 — 서양 원예의 azalea(주로 상록성
*R. indicum* 계열 등)와 이름 단계에서 갈린다.

---

## 3. 반려동물 독성 — 열람 결과와 등급 판단

### 3-1. ASPCA 에 종·속이 등재된 5종

| id | ASPCA 항목 | 학명 | 판정 | 근거 문구 |
|---|---|---|---|---|
| `phalaenopsis` | Phalaenopsis Orchid | *Phalaenopsis sp.* | **무독** | Non-Toxic to Dogs / Cats / Horses |
| `alstroemeria` | Peruvian Lily | *Alstroemeria* | **무독** | Non-Toxic to Dogs / Cats / Horses |
| `gardenia` | Cape Jasmine | *Gardenia jasminoides* | mild_gi | Genioposide, Gardenoside / `Mild vomiting and/or diarrhea, hives.` |
| `eucalyptus` | Eucalyptus | *Eucalyptus species* | **serious** | 정유(eucalyptol) / `salivation, vomiting, diarrhea, depression, weakness` |
| `azalea` | Azalea | *Rhododendron spp* | **serious** | Grayantoxin / `vomiting, diarrhea, weakness, cardiac failure` |

`gardenia` 는 **ASPCA·NC State 가 학명까지 정확히 일치**하는 드문 경우다(둘 다 *Gardenia jasminoides*,
독성 성분도 genioposide·gardenoside 로 같다).

### 3-2. 종 불일치 1건 — `anthurium`

ASPCA 의 Flamingo Flower 는 ***Anthurium scherzeranum***, 국내 화분 유통 주력은 ***A. andraeanum*** 이다.
**같은 속 다른 종**이라 magnolia(*M. stellata* ↔ *M. kobus*) 와 같은 상황이고,
종이 정확히 일치하는 **NC State 의 *A. andraeanum*** 항목을 `source_url` 로 삼았다(daisy·marigold 선례).

두 출처가 원인 물질에서 일치한다 — ASPCA `Insoluble calcium oxalates`, NC State `Calcium oxalate crystals`,
Merck `raphides (water-insoluble calcium oxalate and proteinaceous toxins)`.
증상이 구강 자극·부종·연하 곤란으로 **전신 독성이 아니어서 mild_gi** 로 두었다.

`toxic_parts` 는 NC State 의 `Flowers, Fruits, Leaves, Roots, Sap/Juice, Seeds, Stems` 를 옮긴 것이고,
어휘에 `fruit` 가 없어 열매(장과)는 `berry` 로 적었다.

### 3-3. ASPCA 미등재 5종 — 부재를 어떻게 확인했나

목록 페이지를 **알파벳 문자별로 전수 열람**했다(15건씩 페이지네이션). 빠진 자리를 앞뒤 항목으로 특정했다.

| 찾은 이름 | 목록 | 총건수 | 들어갈 자리 (앞 항목 ↔ 뒤 항목) | 결과 |
|---|---|---|---|---|
| Acacia | A | 43 | 목록 맨 앞 ↔ `Acorn Squash` | **없음** |
| Bouvardia | B | 92 | `Bottlebrush` ↔ `Boxwood` | **없음** |
| Cotton | C | 137 | `Cornstalk Plant` ↔ `Cow parsnip` | **없음** |
| Limonium | L | 46 | `Lime` ↔ `Linden` | **없음** |
| Statice / Sea Lavender | S | 94 | `Starleaf` ↔ `Stevia` / `Scouring Rush` ↔ `Seaside Daisy` | **없음** |
| Mimosa | M | 72 | `Mulberry Tree` ↔ `Mum` 구간 확인 | **없음** |

> ASPCA 사이트의 검색 엔드포인트(`/toxic-and-non-toxic-plants/search?combine=…`)는 결과를 렌더하지 않아
> 쓸 수 없었다. 목록 전수 열람이 유일한 확인 방법이다 — 다음 배치도 같은 방식을 써야 한다.

### 3-4. ⚠ 이름 함정 6건 — 이번 배치의 가장 큰 수확

**같은 통칭을 쓰는 다른 식물의 데이터를 그대로 옮겼다면 전부 틀린 정보가 될 뻔한 자리다.**

| # | 함정 | 진짜 정체 | 우리 꽃 | 처리 |
|---|---|---|---|---|
| 1 | ASPCA **Scabious** | *Leucospermum incisum* (프로테아과) | *Scabiosa atropurpurea* (인동과) | ASPCA 버리고 NC State 사용 |
| 2 | ASPCA **Silver Dollar** | *Crassula arborescens* (돌나물과 다육) | *Eucalyptus cinerea* (Silver Dollar Tree) | ASPCA Eucalyptus 속 항목 + NC State 종 항목 사용 |
| 3 | 그리너웨이·뒤몽·순천만 **Mimosa** | *Mimosa pudica* (신경초) | *Acacia dealbata* | `caution_note` 단 한 행으로만 수록 |
| 4 | 그리너웨이 **Thrift** | *Armeria* (갯질경이과 아르메리아) | *Limonium sinuatum* | 꽃말로 **옮기지 않음** |
| 5 | 하나코토바 `/cotton/` | *Santolina chamaecyparissus* (Cotton Lavender) | *Gossypium hirsutum* | 인용하지 않음 |
| 6 | 그리너웨이 **Plum Tree** | *Prunus domestica* (유럽 자두) | *Prunus mume* (매화) | `caution_note` 달아 수록 |

여기에 카탈로그가 이미 알고 있던 두 짝이 더해진다 —
**Cape Jasmine(치자) ↔ Jasmine(재스민)** 은 `jasmine` 행이 경고해 둔 혼동의 반대쪽이 이번에 실렸고,
**Peruvian Lily(알스트로메리아) ↔ Lily(백합)** 는 무독과 고양이 치명이 이름 하나로 갈리는 자리다.

1번과 5번은 **검색으로 먼저 나온 페이지를 그대로 믿었으면 바로 오염됐을** 경로였다.

### 3-5. 등급이 갈린 3건

#### (가) `azalea` — NC State 는 Low, 수의 자료 셋은 중증

| 출처 | 대상 | 서술 |
|---|---|---|
| NC State (*R. mucronulatum*) | 사람 | Poison Severity: **Low** / `ingestion of moderate amounts of azalea (nectar or leaves) poses little toxic hazard` |
| ASPCA (*Rhododendron spp*) | 개·고양이 | Grayantoxin / `vomiting, diarrhea, weakness, **cardiac failure**` |
| Pet Poison Helpline | 개·고양이 | 심박 이상·저혈압·경련 / `may occur in cats or dogs that consume only **a few leaves or flowers**` |
| Merck | 동물 | `salivation, lacrimation, vomiting, diarrhea, dyspnea, muscle weakness, **convulsions, coma, and death**` |

한국어 위키백과가 **먹을 수 있어 참꽃이라 부른다**(화전)고 적는 것과 정면으로 부딪히는데,
NC State 의 `Low` 가 **사람이 적당량 먹었을 때** 기준이라는 점이 두 서술을 화해시킨다.
**체중이 작은 개·고양이 기준으로는 수의 출처 셋을 따라 `serious`** 로 판정했다.

`life_threatening` 으로 올리지 않은 것은 delphinium 판정 때 세운 경계를 지킨 것이다 —
그 자리는 **적은 양으로도 치명적인 백합·은방울꽃**에 남겨 두었다. → §6-4 에 재검토 항목으로 올린다.

#### (나) `eucalyptus` — 카탈로그 최초의 **부재료 serious**

- NC State (*E. cinerea*): Poison Severity **High** / Poison Part `Bark, Leaves, Sap/Juice` /
  증상에 **혼수(coma)** 포함 / Toxic Principle `Eucalyptus oil, eucalyptol`
- ASPCA (*Eucalyptus species*): 개·고양이 독성 / `salivation, vomiting, diarrhea, depression, weakness`

NC State 의 High + 혼수 서술이 delphinium(High + 호흡 마비 → serious)과 같은 무게라 **`serious`** 로 두었다.

**이 판정이 이번 배치에서 서비스에 가장 큰 영향을 준다.** 유칼립투스는 다발 부재료로 가장 많이 쓰여
"주인공 꽃은 안전한데 곁들인 잎이 위험한" 상황을 만든다. `mild_gi` 로 두면 부재료라는 이유로 위험이 묻힌다.

#### (다) `cotton` — 성분은 확실한데 노출 방식이 다르다

ASPCA 미등재 · NC State 독성 기재 없음. 그런데 **Merck 수의매뉴얼**이 명확하다.

- `Dogs and cats appear to have **intermediate sensitivity**.`
- 고시폴은 `pigment glands found in various parts of the cotton plant` 에 있다.
- 독성은 `usually occur only after **longterm exposure** to gossypol, often weeks to months.`
- 개에서 `primarily **cardiotoxic** effects` / 보고된 사례는 면실·면실박·**면실 깔개** 섭취.
- 영어 위키백과도 `Cotton has gossypol, a toxin that makes it inedible.`

corn-poppy·water-lily 선례대로 **`toxic=true`** 로 두되, **등급은 `mild_gi` 로 묶었다** —
Merck 스스로 심부전·사망을 **몇 주~몇 달의 지속 섭취**에 묶어 두었고, 화병의 다래 하나를 문 상황과는
노출 방식이 다르기 때문이다. `toxic_parts` 를 `seed` 로 좁힌 것도 보고된 개 중독이 전부 면실 계열이어서다.

#### ⚠ 일반 규칙 — 만성 노출 근거를 급성 등급에서 언제 제외할 수 있나

**노출 방식을 근거로 등급을 낮춘 것은 카탈로그에서 `cotton` 이 처음이다.**
다음 배치가 이 선례를 근거 없이 넓히지 않도록 조건을 못 박아 둔다.

**세 조건을 모두 충족할 때만** 만성 노출 근거를 급성 등급에서 빼고 `mild_gi` 로 묶는다 (AND 조건이다).

1. **출처가 중증 결과를 노출 기간에 명시적으로 묶어 두었을 것.**
   추정이 아니라 문장으로 적혀 있어야 한다 — cotton 의 경우
   `usually occur only after longterm exposure to gossypol, often weeks to months`.
2. **보고된 중독 사례의 노출 경로가 화병·다발과 구조적으로 다를 것.**
   cotton 의 경우 보고된 개 사례가 전부 면실·면실박·**면실 깔개**였다 — 사료·깔개로 몇 달간 계속
   먹거나 깔고 자는 상황이지, 꽂혀 있는 가지를 한 번 문 상황이 아니다.
3. **같은 성분에 소량 급성 중독 보고가 없을 것.**

**아래 중 하나라도 걸리면 이 규칙을 쓰지 않고 급성 등급을 그대로 매긴다.**

- **성분이 소량 급성 독성으로 따로 보고된 경우.** 한 번의 섭취로 중증이 오므로 노출 기간 논거가
  아예 성립하지 않는다. 카탈로그에서 여기 해당하는 성분은
  **시안 배당체**(cherry-blossom · plum-blossom) · **강심 배당체**(lily-of-the-valley) ·
  **그레이아노톡신**(azalea) · **lycorine**(narcissus · amaryllis) ·
  **백합의 고양이 신독성**(lily-asiatic) 이다.
- **출처가 기간을 밝히지 않고 중증 증상만 나열한 경우.**
  **`eucalyptus` 가 정확히 이 경우다** — NC State 가 Poison Severity High 와 혼수를 적으면서
  노출 기간을 달지 않았다. 그래서 부재료라는 쓰임에도 불구하고 `serious` 를 그대로 매겼다.
  "많이 오래 먹어야 위험하겠지"라는 **우리 쪽 추정으로 등급을 낮추지 않는다.**
- **위험 부위가 유통 실물에 실제로 들어 있고 그 부위의 급성 독성이 따로 보고된 경우.**
  cotton 은 씨가 실물(다래)에 들어 있지만 **씨의 급성 중독 보고가 없어** 조건 3을 통과했다.
  급성 보고가 하나라도 나오면 이 판정은 뒤집힌다.

**적용 이력: `cotton` 1건.** 여기에 새 건을 더할 때는 위 세 조건을 각각 어떤 문장으로 충족했는지
이 문서에 함께 적는다. → §6-3.

### 3-6. ⚠ 권위 기관 미등재 2건 — `mimosa` · `bouvardia` : **무독 확인이 아니라 자료 부재**

**이 두 종은 "안전하다고 확인된" 것이 아니라 "어느 권위 기관도 다루지 않은" 것이다.**
`severity=none` 46행 중 **위키백과를 근거로 삼은 것은 이 4행(2종 × cat·dog)뿐**이고,
나머지 42행은 ASPCA 28 · NC State 14 이다. **이번이 기준을 처음 낮춘 자리다.**

`pet_safety.csv` 에는 이 사정을 적을 note 칸이 없어 **행만 봐서는 두 경우가 구분되지 않는다.**
화면 문구가 "알려진 독성이 없어요"라 문자 그대로는 참이지만, 배지는 ASPCA 무독 확인과 똑같이 그려진다 → §6-2.

#### 어떤 기관을 어떤 검색어로 뒤졌나 (재조사 전수 기록 — 다음 사람이 반복하지 않도록)

| 기관 · 자료 | `mimosa` (*Acacia dealbata*) 검색어 | `bouvardia` (*Bouvardia × domestica*) 검색어 | 결과 |
|---|---|---|---|
| ASPCA 통칭 목록 | `Acacia`(A 43건) · `Mimosa`(M 72건) · `Silver Wattle`(S 94건) · `Blue Wattle`(B 92건) · `Wattle`(W 52건) | `Bouvardia`(B 92건) | **전부 미등재** |
| ASPCA 무독(Non-Toxic) 목록 | 같은 이름들 | 같은 이름 | 목록 페이지가 항목을 렌더하지 않음 — **문자별 목록이 유일한 경로**(§3-3) |
| NC State Extension | `acacia-dealbata` 직접 · `find_a_plant?q=Acacia dealbata` · `?q=acacia` | `bouvardia` 직접 · `find_a_plant?q=Bouvardia` | 404 / *Albizia julibrissin*·*Robinia pseudoacacia* 만 / **0 plants found** |
| Merck 수의매뉴얼 관상식물 표 | Acacia | Bouvardia | 둘 다 없음 |
| Pet Poison Helpline 식물 목록 | Acacia · Wattle · Mimosa | Bouvardia · Firecracker Bush | 둘 다 없음 |
| 영어 위키백과 | *Acacia dealbata* | *Bouvardia* | 독성·화학 기재 **없음** |

**ASPCA 통칭 목록에서 빠진 자리를 앞뒤 항목으로 특정한 결과**(§3-3 방식):
`Silver Wattle` 은 `Silver Tree Anamiga` ↔ `Skunk Cabbage` 사이, `Wattle` 은 `Watermelon Pilea` ↔ `Wax Plant`
사이, `Blue Wattle` 은 `Blue Eyed Daisy` ↔ `Blue-dicks` 사이가 모두 비어 있다.

#### ⚠ 미해결 쟁점 — *Acacia dealbata* 의 시안 배당체 여부 (`mimosa` 판정이 뒤집힐 수 있는 자리)

재조사 중에 **`horsedvm.com` 이 "Silver Wattle Poisoning"** 항목에서
`All parts of Acacia spp are considered toxic to horses. It contains cyanogenic glycosides prunasin and
sambunigrin` 라고 적는 것을 발견했다. 시안 배당체는 **cherry-blossom·plum-blossom 을 `serious` 로 만든
바로 그 성분**이라, 사실이면 `mimosa` 가 무독에서 serious 로 뒤집힌다. **그래서 근거를 끝까지 따라갔다.**

**결론: 지금 근거로는 뒤집을 수 없다. `false / none` 을 유지한다.** 이유 셋.

1. **그 문장은 종이 아니라 속(*Acacia spp*) 단위 일반화다.** 그런데 그 페이지가 인용한 원논문
   (Maslin · Conn · Dunn, *Cyanogenesis in Australian species of Acacia*)의 결론은 정반대에 가깝다 —
   **호주 Acacia 의 약 96%를 조사해 시안 생성이 확인된 것은 45종**이고(43종이 subgenus Phyllodineae,
   그중 section Juliflorae 37 · **Botrycephalae 5** · Pulchellae 1), 호주 Acacia 는 1,000종 안팎이다.
   **시안 생성은 이 속의 예외이지 속성이 아니다.** *A. dealbata* 는 section Botrycephalae 소속이고,
   그 절에서 확인된 시안 생성 종은 5종뿐이다 — 여기 드는지 여부를 확인하지 못했다.
2. **속 단위 서술을 종에 그대로 씌우는 것이 바로 이번 배치에서 우리가 잡아낸 오류 유형이다**(§3-4).
   ASPCA `Scabious`(속·과가 다른 프로테아) 를 버린 판단과 같은 기준을 여기에도 적용해야 한다.
3. **대상 동물이 다르다.** 그 페이지는 **말 전용**이고 개·고양이를 아예 다루지 않는다. 심각도도 5/10 이다.

#### 2차 확인 라운드 — 시도한 경로 전부와 결과 (2026-08-17)

Advisor 지시로 **다른 경로를 한 번 더** 뒤졌다. 결론은 바뀌지 않았다.

| 경로 | 결과 |
|---|---|
| ScienceDirect 원논문 (*Cyanogenesis in Australian species of Acacia*) | **403 Forbidden** — 두 번 다 열리지 않음 |
| Academia.edu 대체본 (*Cyanogenesis in Acacia subgenus Aculeiferum*) | **403 Forbidden** |
| WorldWideWattle (CSIRO 계열) AcaciaSearch *A. dealbata* 프로파일 PDF | 독성·시안 생성·기호성·사료 이용 **항목 자체가 없음** |
| 리뷰 논문·인용 표에서 section Botrycephalae 시안 생성 **5종의 이름** | **찾지 못함**. 그 절에 *A. baileyana* · *A. dealbata* · *A. decurrens* · *A. filicifolia* · *A. leucoclada* · *A. mearnsii* · *A. parramattensis* 등이 들어간다는 것까지만 확인 — **5종이 누구인지는 어디에도 안 나온다** |
| 유럽 쪽 문헌(프랑스·이탈리아 관상수) | 독성 보고 **없음** |

**추가 수확 — 이 종만 다룬 동료심사 논문 1편.**
*Characterization and Cytotoxicity Assessment of the Lipophilic Fractions of Different Morphological Parts
of Acacia dealbata* (IJMS 2020, PMC7084485)가 **바로 이 종의** 껍질·목부·잎을 분석했다.
주성분은 테르펜류·스테롤 등 6개 지용성 계열이고, **prunasin·sambunigrin·시안 배당체·시안화수소는
논문 어디에도 나오지 않는다.** 결론은
`All lipophilic extracts of A. dealbata exhibited none or low cytotoxicity at the tested doses in
different mammalian cell lines representing brain, immune system, skin, lung, and liver cells`.

> ⚠ **이 논문을 '시안 배당체 없음'의 증거로 쓰면 안 된다.** 분석 대상이 **지용성(lipophilic) 분획**인데
> 시안 배당체는 **수용성**이라, 설계상 애초에 검출될 수 없는 분획이다. 부재 증명이 아니라
> **이 종을 직접 본 유일한 화학 자료에서도 시안 언급이 없었다**는 관찰로만 쓴다.

#### ✅ 결론 — 이 쟁점은 **2026-08-17 에 닫았다**

**`mimosa` 는 `toxic=false / severity=none` 을 유지한다.** Advisor 가 미리 정한 판정 규칙의
"속 단위 서술뿐이거나 · 말 전용 자료뿐이거나 · 확인 불가" 에 해당하기 때문이다.

닫는 근거를 한 줄로: **어떤 자료도 *Acacia dealbata* 를 콕 집어 시안 생성 종이라고 적지 않았다.**
그렇게 말한 유일한 페이지(`horsedvm.com`)는 속 단위 일반화이고 말 전용이며, 그 페이지가 인용한
원논문의 결론은 시안 생성이 이 속의 **예외(약 1,000종 중 45종)**라는 것이다.

**추정으로 등급을 올리지 않는다** — 지어낸 위험 경고는 진짜 경고의 신뢰를 갉아먹는다.
`azalea`·`plum-blossom`·`eucalyptus` 처럼 근거가 분명한 경고가 같은 화면에 서 있기 때문에 더욱 그렇다.

**다시 열어야 하는 유일한 조건:** Maslin/Conn/Dunn 의 **section Botrycephalae 시안 생성 5종 목록**에
*A. dealbata* 가 들어 있다는 것이 확인될 때. 그때는 `serious`(cherry-blossom·plum-blossom 과 같은
시안 배당체 근거)로 올리고 `safe_alternative_flower_ids` 를 채우며, §3-5 "적용 제외" 목록과도 맞춘다.
**그 목록을 못 구했다면 이 문단을 다시 읽고 같은 길을 반복하지 마라** — 위 6개 경로는 이미 막혀 있다.

> 이번 재조사에서 나온 `plantiary.com` · `earthone.io` · `greg.app` · `justanswer.com` ·
> `forwardplant.com` · `monsteraholic.com` · `picturethisai.com` · BBC Gardeners' World 는
> 모두 **출처로 쓰지 않았다**(§7). `horsedvm.com` · `cowdvm.com` 도 근거로 채택하지 않았고,
> 위와 같이 **판단 기록으로만** 남긴다.

### 3-7. 부위를 좁히지 못한 1건 — `gardenia`

ASPCA·NC State 모두 Poison Part 를 적지 않는다(NC State 는 Severity·Symptoms·Toxic Principle 만 둔다).
**primula 선례**(`부위를 좁히지 않아 전초로 적었다`)를 따라 `flower|leaf|stem|root` 로 두었다.

### 3-8. 접촉 독성은 `pet_safety` 가 아니라 `care_summary` 로 — `alstroemeria`

ASPCA 는 알스트로메리아를 **개·고양이 무독**으로 등재하는데, NC State 는 같은 꽃에
`SKIN IRRITATION SEVERE! (All parts are poisonous). Poisonous through dermatitis or eye irritation.` 를 적는다.

**섭취 독성이 아니라 접촉 피부염**이라, marigold(NC State 광독성을 `care_summary` 로만 반영) 선례대로
`pet_safety` 는 ASPCA 를 따르고 손 씻기 안내만 `care_summary` 에 넣었다.
절화 작업자에게 알려진 '튤립 손가락' 계열 자극이며, 꽃집 종사자에게는 실재하는 문제다.

### 3-9. `safe_alternative_flower_ids` 배정

독성 6종 모두에 **쓰임이 겹치는 무독 대안**을 골랐다 — 경고만 하고 대안을 못 주는 상태를 막는 것이 이 컬럼의 목적이다.

| 독성 꽃 | 대안 | 고른 이유 |
|---|---|---|
| `anthurium` | phalaenopsis · gerbera · camellia · zinnia | **phalaenopsis 가 정답에 가깝다** — 같은 열대 화분 선물이면서 ASPCA 무독 |
| `gardenia` | jasmine · freesia · lisianthus · babys-breath | 향 있는 흰 꽃을 원한 사람에게 jasmine 이 대체가 된다 |
| `eucalyptus` | babys-breath · statice · scabiosa · lisianthus | 부재료 자리를 그대로 메우는 무독 3종 |
| `plum-blossom` | camellia · magnolia · violet · freesia | cherry-blossom 과 같은 봄 가지꽃 세트 |
| `azalea` | camellia · violet · pansy · scabiosa | 봄 화단·화분 자리 |
| `cotton` | statice · babys-breath · cornflower · lisianthus | **statice 가 정답** — 같은 드라이 소재이면서 무독 |

---

## 4. 꽃말 출처 — 무엇을 어디서 가져왔나

| 출처 id | 자료 | 쓴 종 |
|---|---|---|
| `greenaway-1884` | Kate Greenaway, *Language of Flowers* (1884, PD) | gardenia · scabiosa(2행) · azalea · mimosa · plum-blossom |
| `wikipedia-hanakotoba` | 영어 위키백과 Hanakotoba 표 | alstroemeria · gardenia · azalea |
| `hanakotoba-yurai-*` | hananokotoba.com (하나코토바 사전) | 11종 (cotton 제외 전부) |
| `suncheonbay-birth-flowers` | 순천만 탄생화 표 | gardenia(3/19) · azalea(8/8) · cotton(12/12) |
| `wikipedia-ko-maesil` | 한국어 위키백과 매실나무 | plum-blossom (사군자·절개) |
| `wikipedia-ko-jindallae` | 한국어 위키백과 진달래 | azalea (두견화·참꽃) |
| `wikipedia-acacia-dealbata` | 영어 위키백과 | mimosa (국제 여성의 날) |
| `wikipedia-bouvardia` · `wikipedia-cotton` | 영어 위키백과 | bouvardia(어원) · cotton(어원) |
| `ncstate-scabiosa-atropurpurea` | NC State | scabiosa (Pincushion 이름 유래) |
| `lovegreen-cotton` | LOVEGREEN 원예 미디어 | cotton (2행) — **품질 유의, §6-6** |

**위키백과 단독 근거를 최소화하라**는 지침대로, 영어 위키백과 단독 행은 **4행**(mimosa 여성의 날 ·
bouvardia 어원 · cotton 어원 · azalea 두견화는 한국어판)으로 묶었고 전부 **어원·역사 사실** 이라
꽃말 해석이 아니다. 나머지는 하나코토바·그리너웨이·순천만이 받친다.

### 4-1. 문화권이 겹친 자리 (`confidence_level = repeated`)

- **gardenia** — 그리너웨이 `I'm too happy` ↔ 하나코토바 「とても幸せです」 ↔ 순천만 `한없는 즐거움`. **3계보**
- **azalea** — 그리너웨이 `Temperance` ↔ 하나코토바 「節度」「慎み」 + 서양 꽃말 temperance. **3계보**
  / 순천만 `사랑의 기쁨` ↔ 하나코토바 赤いツツジ「恋の喜び」. **한·일 동일**
- **scabiosa** — 그리너웨이 `Unfortunate love` ↔ 하나코토바 「不幸な愛」 + 서양 꽃말 unfortunate love. **3계보**
- **plum-blossom** — 하나코토바 「高潔」 ↔ 순천만 `고결한 마음` / 하나코토바 「忍耐」 ↔ 한국어 위키백과 `절개`

### 4-2. `caution_note` 를 단 5행

출처가 있어도 **그대로 건네면 오해가 되는** 자리다.

1. `mimosa` 예민한 마음 — 옛 사전의 미모사는 신경초(*M. pudica*)
2. `plum-blossom` 성실 — 그리너웨이의 Plum Tree 는 유럽 자두
3. `azalea` 사랑의 기쁨(red) — 일본 ツツジ 는 진달래가 아닌 철쭉류까지 포함
4. `statice` 위로 — sympathy 는 애도 자리의 말이라 축하 자리에서 어긋난다
5. `cotton` 우수 — 순천만 표에 한자가 없어 **優秀(뛰어남)인지 憂愁(시름)인지 갈린다**
6. `scabiosa` 바늘꽂이 — 같은 별명을 프로테아과 다른 꽃도 쓴다

5번은 이번에 새로 발견한 애매함이다. 일본 꽃말에 「優秀」가 있어 뛰어남 쪽으로 읽을 여지가 있으나
**단정하지 않고 두 갈래를 그대로 남겼다.**

### 4-3. 새로 쓴 어휘 토큰

- `culture_region = italy` — mimosa 의 국제 여성의 날 행. (water-lily 가 `egypt` 를 새로 쓴 선례)
- `culture_region = western` — 하나코토바가 **서양 꽃말(西洋の花言葉)로 묶어 소개한 것**을 옮긴 행
  (phalaenopsis · alstroemeria · anthurium · statice · plum-blossom). 자료의 분류를 그대로 따랐고,
  `editorial_note` 에 출처가 일본 사이트임을 밝혀 두었다.

---

## 5. 열람 확인한 자료 목록

### 5-1. ASPCA — 개별 항목 (7건)

- `…/phalaenopsis-orchid` · `…/peruvian-lily` · `…/flamingo-flower` · `…/cape-jasmine`
- `…/eucalyptus` · `…/azalea` · `…/plum` · `…/apricot`
- **함정 확인용**: `…/scabious`(= *Leucospermum incisum*) · `…/silver-dollar`(= *Crassula arborescens*)

### 5-2. ASPCA — 부재 확인용 목록 (§3-3 근거)

`…/toxic-and-non-toxic-plants/{a, b, c, l, m, s}` 와 각 `?page=N` — A 43 · B 92 · C 137 · L 46 · M 72 · S 94건.

### 5-3. NC State Extension

`limonium-sinuatum` · `scabiosa-atropurpurea` · `gossypium-hirsutum` · `prunus-mume` ·
`rhododendron-mucronulatum` · `anthurium-andraeanum` · `eucalyptus-cinerea` · `gardenia-jasminoides` ·
`alstroemeria` · `phalaenopsis`
**404 / 0건**: `acacia-dealbata` · `bouvardia` (`find_a_plant` 검색으로 재확인)

### 5-4. 수의 전문 자료

- Merck Veterinary Manual — Gossypol Poisoning in Animals (cotton 판정의 유일한 근거)
- Merck Veterinary Manual — Houseplants and Ornamentals Toxic to Animals (anthurium · rhododendron)
- Pet Poison Helpline — Rhododendron (azalea 등급 판단)

### 5-5. 퍼블릭 도메인 꽃말 원전

- Greenaway 1884 — `https://www.gutenberg.org/cache/epub/31591/pg31591.txt` (전문 대조)
- Dumont 1851 — `https://www.gutenberg.org/cache/epub/71779/pg71779.txt` (전문 대조, 수확 2건뿐)

### 5-6. 하나코토바 · 기타

hananokotoba.com: `/kochouran/` `/alstroemeria/` `/anthurium/` `/kuchinashi/` `/eucalyptus/` `/statice/`
`/mimosa/` `/bouvardia/` `/scabiosa/` `/ume/` `/tsutsuji/`
— `/kochoran/` `/wata/` 는 404, **`/cotton/` 은 산톨리나로 연결**(§3-4).
RHS: `Bouvardia × domestica`. LOVEGREEN: 코튼플라워.

---

## 6. Advisor 판단이 필요한 후속 항목

**6-1. `image_*` 3칸을 비워도 시드는 통과한다 — 확인됨.**
`FlowerRowSchema` 의 `image_url` · `image_license` · `image_source_url` 이 전부 `optional` 이고,
59종 전수로 `npm run seed` 가 통과했다. **임시값을 지어내지 않았다.** 사진 작업자가 채우면 된다.

**6-2. `mimosa` · `bouvardia` — 재조사 완료, 여전히 권위 기관 미등재.** 6개 기관을 §3-6 표의 검색어로
전수 재확인했으나 어느 곳도 이 두 종을 다루지 않는다. 행은 `false / none` 그대로 두었다(화면 문구
"알려진 독성이 없어요"는 문자 그대로 참이다). **남은 문제는 데이터가 아니라 표현이다** —
`pet_safety.csv` 에 "자료 부재"와 "무독 확인"을 구분할 칸이 없어 배지가 두 경우를 똑같이 그린다.
컬럼(예: `evidence_basis`)을 늘릴지, 화면에서만 갈라 보일지는 Advisor 판단이다.
`mimosa` 의 시안 배당체 쟁점은 **2026-08-17 에 `false/none` 유지로 닫았다**(§3-6) — 재개 조건도 거기 적혀 있다.

**6-3. `cotton` 을 `mild_gi` 로 묶은 것이 맞는가.** Merck 는 개에게 **심장 독성**을 적지만 그 결과는
몇 주~몇 달의 지속 섭취에서 온다. 노출 방식을 근거로 등급을 낮춘 것은 카탈로그에서 이번이 처음이라,
§3-5 에 **3조건 AND + 제외 사유**를 일반 규칙으로 명문화해 두었다. 규칙 자체의 승인이 필요하다.

**6-4. `azalea` 를 `serious` 로 둔 것이 맞는가.** Pet Poison Helpline 의
`consume only a few leaves or flowers` 는 `life_threatening` 의 기준("적은 양으로도 치명적")에 근접한다.
delphinium 때 세운 경계를 지켜 `serious` 로 두었으나, 그레이아노톡신은 심정지를 부를 수 있다.

**6-5. `eucalyptus` 의 `bloom_months` 12개월은 개화기가 아니다.** NC State 가 "재배지에서 꽃이 거의 보이지
않는다"고 적는 잎 상품이라, 12개월은 **연중 구입 가능**이라는 뜻으로 넣었다(스키마가 최소 1개월을 요구한다).
`colors = green|blue` 도 꽃이 아니라 은청빛 잎 기준이다. 잎 상품을 위한 컬럼이 필요할 수 있다.

**6-6. `lovegreen-cotton` 출처 품질 — 확인 완료.** 실사 결과 LOVEGREEN(lovegreen.net)은 **상업 블로그가
아니라 편집부(LOVEGREEN編集部)를 둔 일본 원예 미디어**이고, 해당 페이지는 상품 판매 페이지가 아니다 —
카탈로그가 이미 쓰는 `domani-ajisai`(잡지)와 같은 급이다. **다만 이 꽃말들에 出典도 由来도 달지 않는다**
(하나코토바가 종마다 由来 를 붙이는 것과 다른 점이다).

`confidence_level` 은 이미 **`single_source` 로 스키마상 최저값이라 더 내릴 수 없어**, 대신 두 행의
`editorial_note` 에 품질 한계를 명시했다. 행을 빼는 선택지도 검토했으나 그러면 cotton 꽃말이 2행
(순천만 1 + 어원 1)으로 하한 미달이 된다. 대체 후보(`hanaprime.jp` · `eccent.co.jp` · `ameblo.jp` ·
`chills-lab.com` · `language-of-flowers.com` · `tohokuseed.co.jp`)는 전부 같은 급이거나 더 낮았고,
하나코토바에는 목화 항목 자체가 없다(`/cotton/` 은 산톨리나로 연결). **행 유지 여부는 Advisor 판단이다.**

**6-7. `eucalyptus` · `bouvardia` 꽃말이 3행뿐이다.** 목표 하한이다. 옛 꽃말 사전에 둘 다 없어
(부재료 잎 / 19세기 이후 도입 원예종) 더 늘리려면 다른 계열 자료가 필요하다.

**6-8. `phalaenopsis` 의 `price_band = 3` · `bloom_months` 12개월.** 개업 화분 시장 기준으로 정했고
1차 가격 자료를 인용하지 않았다 — 국내 유통 관행에 기댄 값이라 이의가 있으면 이 줄을 보라.

**6-9. `azalea` 의 화전 문화를 화면에 어떻게 다룰 것인가.** 한국어 위키백과는 "먹을 수 있어 참꽃"이라 적고
수의 자료는 개·고양이에게 중증이라 적는다. `care_summary` 에서는 **식용을 아예 언급하지 않고** 반려동물
경고만 남겼다. 이야기 작업자가 화전을 다루면 이 긴장이 화면에서 부딪힐 수 있다.

---

## 7. 수집했으나 버린 것

| 버린 것 | 사유 |
|---|---|
| ASPCA `Scabious` (*Leucospermum incisum*) | 프로테아과의 다른 꽃 — 통칭 Pincushion Flower 만 겹친다 |
| ASPCA `Silver Dollar` (*Crassula arborescens*) | 다육식물 — 유칼립투스의 Silver Dollar Tree 와 무관 |
| ASPCA `Mimosa Tree` 계열 (*Albizia julibrissin*) | 자귀나무 — *Acacia dealbata* 와 다른 속 |
| 그리너웨이 `Thrift — Sympathy` | *Armeria* 속 — 같은 과지만 *Limonium* 이 아니다 |
| 그리너웨이 `Plum, Wild — Independence` / `Plum, Indian — Privation` | 유럽·인도 자두 — 매화와 무관 (Plum Tree 1행만 caution 달아 수록) |
| 뒤몽 1851 `Almond Blossom, (Indiscretion)` | 매화가 아니라 아몬드 |
| 순천만 1/26 미모사 `예민한 마음` | 영문명이 **Humble Plant** — 신경초(*M. pudica*) 쪽이다 |
| 하나코토바 `/cotton/` | 산톨리나(Cotton Lavender) 페이지 |
| `plantiary.com` · `earthone.io` · `greg.app` · `justanswer.com` · `forwardplant.com` · `monsteraholic.com` · `picturethisai.com` | 콘텐츠 팜·Q&A — 1차 근거로 부적격 |
| BBC Gardeners' World (Acacia 무독 서술) | 원예 매체이나 독성 판정 근거로는 얕고 출처를 밝히지 않는다 |
| **`horsedvm.com` · `cowdvm.com` (Silver Wattle 시안 배당체)** | **속 단위 일반화 + 말·소 전용**. 인용 원논문(Maslin/Conn/Dunn)의 결론은 시안 생성이 Acacia 의 예외(45/약1,000종)라는 것이라 종 단위 근거가 되지 못한다 — §3-6 에 미해결 쟁점으로 남겼다 |
| Acacia 속 다른 종·Bouvardia 속 다른 종(*B. ternifolia* 등)의 자료 | **종이 다르면 돌려쓰지 않는다** — §3-4 이름 함정과 같은 오류가 된다 |
| `hanaprime.jp` · `eccent.co.jp` · `ameblo.jp` · `chills-lab.com` · `tohokuseed.co.jp` | cotton 꽃말 대체 후보로 검토했으나 LOVEGREEN 과 같은 급이거나 더 낮다 (§6-6) |
| UC ANR 유독식물 목록 | URL 404 — 열지 못했다 |
| Colorado State 유독식물 DB | 목차 페이지가 항목을 렌더하지 않아 Acacia·Bouvardia 조회 실패 |
| ASPCA 검색 엔드포인트 · 무독 목록 페이지 | 결과를 렌더하지 않는다 — 문자별 목록 전수 열람이 유일한 경로 (§3-3) |

### 열지 못한 URL (인용하지 않음)

- `https://plants.ces.ncsu.edu/plants/acacia-dealbata/` — 404
- `https://plants.ces.ncsu.edu/plants/bouvardia/` — 404
- `https://ucanr.edu/sites/poisonous_safe_plants/Toxic_Plants_by_Scientific_Name_685/` — 404
- `https://hananokotoba.com/kochoran/` · `/wata/` — 404 (각각 `/kochouran/`, 대체 없음)
