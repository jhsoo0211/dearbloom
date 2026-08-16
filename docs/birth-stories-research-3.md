# 탄생화 사전 이야기 리서치 3부 — 9~12월 (birth-stories-3)

## 1. 조사 개요

- **조사일**: 2026-08-16
- **담당 범위**: `content/birth_flowers.csv` 의 **9~12월 중 `flower_id` 가 빈 날**
- **대상**: 9~12월 122일 중 `flower_id` 미연결 **105일**, 이름 단위로 묶어 **97개 이름**
- **산출**: `content/birth_stories.part3.csv` **200행 / 97개 이름 전수 커버**
- **미확보**: **0개 이름**. 다만 `낙엽 마른 풀` 한 자리는 1편이다(§7-1).
- **모든 `source_url` 은 200건 전수 HTTP 검증을 마쳤다**(§6).
- 기존 `content/stories.csv` 377행과 **`story_id` 충돌 0건**.

### 1-1. 이 배치가 어려웠던 이유

앞선 도감 이야기 라운드(story-research 1~5차)는 **카탈로그에 실린 유명한 꽃**을 다뤘다.
이번은 정반대다. **도감에 없어서 `flower_id` 가 비어 있는 자리**만 모은 목록이라,
사초·퀘이킹 그라스·바카리스·메귀리처럼 **한국어 자료가 사실상 없는 이름**이 대거 섞여 있다.
게다가 이 표 자체가 영문명과 국명이 어긋나는 자리를 여럿 안고 있어(§5),
**"무엇에 대한 이야기를 쓸 것인가" 를 먼저 판정해야 하는 이름이 12개**였다.

### 1-2. 두 번 조사했다

8개 배치를 비동기로 띄운 1차 조사가 결과를 돌려주지 못한 채 유실됐고,
같은 브리프로 8개 배치를 동기 재실행했다. 그런데 유실된 줄 알았던 1차 조사가
뒤늦게 전부 복구되어, 결과적으로 **97개 이름을 서로 독립된 두 조사자가 각각 조사**한 셈이 됐다.

이 우연이 품질에 그대로 반영됐다. 두 조사가 **엇갈린 자리**는 전부 신뢰도를 낮추거나 버렸다.

- **갯개미취 / 미카엘 축일** — 한쪽은 축일 민담을 찾았지만, 다른 쪽이 "그 민담이 붙는
  Michaelmas daisy 는 내륙의 정원 아스터이고 *Aster tripolium* 과 동일시할 근거가 없다"고
  반박했다. **버렸다.**
- **엉겅퀴 / 바이킹 야습** — 한쪽은 `scotclans.com` 에서 1263년 라그스 전투 판본을 찾았고,
  다른 쪽은 기관 출처(National Trust for Scotland·Historic UK·Britannica)가 전부 막혀
  확인에 실패했다. 가장 유명한 소재였지만 **버렸다.** 대신 왕실 공식 문서와 1503년 던바 시로 갔다.
- **알로에 / 소코트라·알렉산더 대왕** — 두 조사자 모두 1차 사료에 닿지 못했다. **버렸다.**
- **박하 / 켄터키 더비 민트 줄렙** — 한쪽은 공식 페이지를 열었고 다른 쪽은 같은 URL이 404였다.
  URL 안정성을 이유로 **채택하지 않고** 1750년 미첨 재배로 대체했다.
- **월귤 / RAF 빌베리 잼** — 한쪽은 검증 기사를 찾았고, 다른 쪽은 "빌베리 판본을 명시한
  페이지를 열지 못했다"고 보고했다. 검증 기사 쪽을 채택하되 **"문서 증거가 없다"는 반증 자체를
  이야기의 몸통으로 삼았다.**

### 1-3. 저작권 처리 (1~5차와 동일)

- **타 사이트 문장을 옮긴 곳은 없다.** `story_ko` 는 전부 사실관계만 참고해 새로 쓴 한국어
  해요체 문장이다(평균 322자, 최소 242자, 최대 400자).
- 원문 인용이 필요한 대목은 **퍼블릭 도메인 자료**에 한해, 직접 인용부호 없이 우리말로 옮겨
  실었다 — 밀턴 『실낙원』(1667), 셰익스피어 『햄릿』·『헨리 4세』, 이블린 『Acetaria』(1699),
  다윈(1877), 킹즐리 『Glaucus』(1855), 그리브 『A Modern Herbal』(1931),
  플루타르코스·스트라본·오비디우스·헤로도토스·플리니우스.

---

## 2. 이번 배치 지표

### 2-1. `source_kind` 분포 — 위키 1.0%

| source_kind | 뜻 | 편수 | 비중 |
|---|---|---|---|
| `other` | 위 어디에도 넣기 어려운 것 | 74 | 37.0% |
| `book-pd` | 퍼블릭 도메인 고서 원문 | 30 | 15.0% |
| `garden` | 식물원·수목원·대학 익스텐션 | 30 | 15.0% |
| `museum` | 박물관·기록원·공공기관·대학아카이브 | 21 | 10.5% |
| `paper` | 학술 논문 | 19 | 9.5% |
| `magazine` | 잡지·칼럼·전문 매체 | 16 | 8.0% |
| `newspaper` | 신문 | 8 | 4.0% |
| `wiki` | 위키·백과사전·정리 사이트 | **2** | **1.0%** |
| **합계** | | **200** | **100%** |

> **`wiki` 2편의 정체.** ① 갓 — 우장춘의 '우의 삼각형'(1935). ② 멜론 — 참외.
> 둘 다 **한국 독자에게 닿는 소재**라 예외로 채택했다. 나머지 위키 후보는 전부 비-위키
> 출처로 갈아 끼웠다(예: 벚꽃난 → 위키 대신 IPNI 원기재 서지, 골고사리 → 위키
> pteridomania 대신 북미 변종 보전 자료).
>
> **`other` 37%가 높은 이유**는 이 배치의 성격 때문이다. 어원 사전(etymonline·treccani),
> 국가기관 DB(국사편찬위·행정안전부·USDA·일본 관광청), 학회 블로그(스코틀랜드식물학회·BSBI),
> 민속 아카이브가 여기로 몰렸다. 이들을 `wiki` 로 뭉뚱그리지 않은 것은 3차 라운드의
> 분류 선례를 따른 것이다.

### 2-2. 출처 분산

- **고유 도메인 139개 / 200편.** 한 도메인에 몰린 상위는
  `pmc.ncbi.nlm.nih.gov`(14) · `botanical.com`(11) · `plants.ces.ncsu.edu`(9) ·
  `encykorea.aks.ac.kr`(8) · `gutenberg.org`(5) · `etymonline.com`(4).
- 한 편도 같은 URL을 두 번 쓰지 않도록, 같은 문서에서 두 이야기를 뽑을 수 있는 자리도
  가급적 다른 출처로 갈랐다.

### 2-3. `story_type` · `confidence`

| story_type | 편수 | | confidence | 편수 |
|---|---|---|---|---|
| `history` | 148 | | `repeated` | 129 |
| `folklore` | 31 | | `single_source` | 50 |
| `literary` | 21 | | `varies` | 21 |

`single_source` 50편이 많아 보이지만, 이 배치는 애초에 **자료가 한 곳밖에 없는 이름**을
다룬다. 억지로 `repeated` 로 올리지 않고 정직하게 표기했다.

### 2-4. 문화권 — 60종

`england`(30) `usa`(17) `europe`(13) `korea`(13) `japan`(12) `china`(9) `britain`(9)
`greece`(8) `france`(7) `north-america`(7) `scotland`(5) 순이고, 나머지 49종은 1~4편이다.

**신규 `culture_region` 값**: `arabia` `ainu` `alps` `andes` `sapmi-norway` `byzantium`
`gaul` `st-helena` `anatolia` `eurasia` `brazil` `poland` `ukraine` `chile` `south-africa`
`central-asia` 등. 특히 `ainu`(머위 코로폭쿠루)와 `sapmi-norway`(사초 신발 풀)는
**국가명으로 뭉개지 않기 위해** 3·4차의 `navajo`·`aztec` 선례를 따라 민족 이름을 그대로 썼다.

---

## 3. 담당 97개 이름 전수 탐색 표

날짜는 `birth_flowers.csv` 기준이고, 한 이름이 여러 날에 걸리면 함께 적었다.
**편수 0인 이름은 없다.**

| 이름 | 날짜 | 표의 동정 | 편수 |
|---|---|---|---|
| 호랑이꽃 | 9/1 | Tiger Flower | 2 |
| 멕시칸 아이비 | 9/2 | Cobaea | 2 |
| 마거리트 | 9/3 | Marguerite | 2 |
| 뱀무 | 9/4 | Geum | 2 |
| 느릅나무 | 9/5 | Elm | 2 |
| 한련 | 9/6 | Nasturtium | 2 |
| 오렌지 | 9/7 · 9/24 | Orange | 2 |
| 갓 | 9/8 | Mustard | 2 |
| 갯개미취 | 9/9 | Michaelmas Daisy | 2 |
| 알로에 | 9/11 | Aloe | 2 |
| 클레마티스 | 9/12 | Clematis | 2 |
| 버드나무 | 9/13 | Weeping Willow | 2 |
| 마르멜로 | 9/14 | Quince | 2 |
| 용담 | 9/16 | Gentiana | 2 |
| 에리카 | 9/17 | Heath | 2 |
| 엉겅퀴 | 9/18 · 10/21 | Thistle | 2 |
| 사초 | 9/19 | Carex | 2 |
| 로즈메리 | 9/20 | Rosemary | 2 |
| 사프란 | 9/21 | Autumn Crocus | 2 |
| 퀘이킹 그라스 | 9/22 | Quaking Grass | 2 |
| 주목 | 9/23 | Yew Tree | **3** |
| 메귀리 | 9/25 | Animated Oat | 2 |
| 감 | 9/26 | Date Plum | 2 |
| 떡갈나무 | 9/27 | Oak | **3** |
| 색비름 | 9/28 | Love-Lies-Bleeding | 2 |
| 사과 | 9/29 | Apple | **3** |
| 삼나무 | 9/30 | Cedar | **3** |
| 살구 | 10/2 | Apricot | 2 |
| 단풍나무 | 10/3 · 10/25 | Maple | 2 |
| 홉 | 10/4 | Common Hop | 2 |
| 종려나무 | 10/5 | Windmill Palm | 2 |
| 개암나무 | 10/6 | Hazel | 2 |
| 전나무 | 10/7 | Fir | 2 |
| 파슬리 | 10/8 | Parsley | 2 |
| 회향 | 10/9 | Fennel | 2 |
| 멜론 | 10/10 | Melon | 2 |
| 부처꽃 | 10/11 | Lythrum | 2 |
| 월귤 | 10/12 | Bilberry | 2 |
| 조팝나무 | 10/13 | Spiraea | 2 |
| 스위트 바즐 | 10/15 | Sweet Basil | 2 |
| 포도 | 10/17 | Grape | 2 |
| 넌출월귤 | 10/18 | Cranberry | 2 |
| 빨강 봉선화 | 10/19 | Balsam | 2 |
| 마 | 10/20 | Indian Hemp | 2 |
| 벗풀 | 10/22 | Arrow-Head | 2 |
| 흰독말풀 | 10/23 | Thorn Apple | 2 |
| 매화 | 10/24 · 12/27 | Prunus mume | 2 |
| 수영 | 10/26 · 12/4 | Rumex | 2 |
| 무궁화 | 10/28 | Rose of Sharon | **3** |
| 해당화 | 10/29 | Crab Apple | 2 |
| 로벨리아 | 10/30 | Lobelia | 2 |
| 칼라 | 10/31 | Calla | 2 |
| 서양모과 | 11/1 | Medlar | 2 |
| 루피너스 | 11/2 | Lupinus | 2 |
| 브리오니아 | 11/3 | Bryonia | 2 |
| 골고사리 | 11/4 | Hart's-Tongue Fern | 2 |
| 단양쑥부쟁이 | 11/5 · 12/11 | Fig Marigold | 2 |
| 등골나물 | 11/6 | Agrimony Eupatoire | 2 |
| 가는동자꽃 | 11/8 | Lychnis flos-cuculi | 2 |
| 몰약의 꽃 | 11/9 | Myrrh | 2 |
| 부용 | 11/10 | Hibiscus mutabilis | 2 |
| 레몬 | 11/12 | Lemon | 2 |
| 레몬 버베나 | 11/13 | Lemon Verbena | 2 |
| 소나무 | 11/14 · 12/14 | Pine | **3** |
| 황금싸리 | 11/15 | Crown Vetch | 2 |
| 머위 | 11/17 | Sweet-Scented Tussilago | 2 |
| 범의귀 | 11/19 | Aaron's Beard | 2 |
| 뷰글라스 | 11/20 | Bugloss | 2 |
| 초롱꽃 | 11/21 | Campanula | 2 |
| 매자나무 | 11/22 | Berberis | 2 |
| 양치 | 11/23 · 12/7 | Fern | 2 |
| 가막살나무 | 11/24 | Viburnum | 2 |
| 개옻나무 | 11/25 | Rhus cotinus | 2 |
| 서양톱풀 | 11/26 | Yarrow | 2 |
| 붉나무 | 11/27 | Rhus | 2 |
| 바카리스 | 11/29 | Baccharis | 2 |
| **낙엽 마른 풀** | 11/30 | Dry Grasses | **1** |
| 쑥국화 | 12/1 | Tansy | 2 |
| 이끼 | 12/2 | Moss | 2 |
| 앰브로시아 | 12/5 | Ambrosia | 2 |
| 바위취 | 12/6 | Saxifraga | 2 |
| 갈대 | 12/8 | Reed | 2 |
| 목화 | 12/12 | Cotton Plant | **3** |
| 서향 | 12/15 | Winter Daphne | 2 |
| 오리나무 | 12/16 | Alder | 2 |
| 벚꽃난 | 12/17 | Honey-Plant | 2 |
| 세이지 | 12/18 | Sage | 2 |
| 스노 플레이크 | 12/19 | Snow Flake | 2 |
| 파인애플 | 12/20 | Pineapple | 2 |
| 박하 | 12/21 | Mint | 2 |
| 플라타너스 | 12/23 | Platanus | 2 |
| 겨우살이 | 12/24 | Loranthaceae | 2 |
| 서양호랑가시나무 | 12/25 | Holly | 2 |
| 석류 | 12/28 | Pomegranate | 2 |
| 꽈리 | 12/29 | Winter Cherry | 2 |
| 납매 | 12/30 | Carolina Allspice | 2 |
| 노송나무 | 12/31 | Chamaecyparis | 2 |

**3편을 준 7개 이름**: 주목 · 떡갈나무 · 사과 · 삼나무 · 무궁화 · 소나무 · 목화.
유명세와 자료량이 함께 충분한 자리에만 얹었다.

---

## 4. 왜 이 이야기를 골랐나 — 대표 3편

1. **목화 `bstory-cotton-munikjeom` — "붓 뚜껑이 아니라 주머니"**
   문익점이 붓두껍에 목화씨를 숨겨 왔다는 이야기는 **사료에 없다.** 국사편찬위원회가
   정리한 원 기록은 "씨 열 개 남짓을 따서 주머니에 넣어 왔다"이고, 위원회는 붓 뚜껑
   판본을 "허구 섞인 이야기가 만들어지기도 하였다"고 못 박는다. 한국인이라면 거의 다
   아는 이야기를 **1차 사료로 뒤집는** 자리라 이 배치의 대표로 꼽는다.

2. **마 `bstory-indian-hemp-itatamat` — "매듭으로 쓴 여자의 일기"**
   미국 농무부 식물 안내서가 아포시넘의 여러 쓰임 중 **가장 중요한 것**으로 꼽은 것이
   '이타타마트', 곧 '날을 세는 공'이다. 여자가 결혼한 날부터 이 섬유로 꼰 실에 매듭을
   지어 삶의 사건을 기록했고, 실타래가 손에 쥐기 어려울 만큼 굵어지면 새 공을 감았다.
   **표의 '마'와 Indian Hemp 가 어긋난 자리**를 파고들다 나온 소재다.

3. **사프란 `bstory-autumn-crocus-wild-garlic-poisoning` — "뿌리 하나와 잎 셋으로 끓인 차"**
   이 날의 'Autumn Crocus'는 사프란이 아니라 **콜키쿰이라는 독초**다. 2026년 증례 보고는
   산마늘로 착각해 차를 끓여 마신 환자의 7일을 시간대별로 기록했고, 같은 논문이 인용한
   이전 사례 19건 중 10건이 사망이었다. **동정 함정이 곧 안전 경고가 되는** 드문 자리다.

---

## 5. 종 동정 함정 — 이 배치의 핵심

`birth_flowers.csv` 는 원본 표의 영문명·학명을 그대로 옮겼고, 그 표 자체가 어긋난 자리가
많다(birth-v1 §6-5 참조). 이야기를 붙이려면 **먼저 어느 식물을 쓸지 판정**해야 했다.
아래 12건이 그 판정 기록이다. 전부 해당 행의 `editorial_note` 에도 남겼다.

| 이름 | 표의 표기 | 실제 | 이 배치의 판정 |
|---|---|---|---|
| **사프란** | Autumn Crocus | 콜키쿰 *Colchicum autumnale*(독초) | **콜키쿰**으로 씀. 사프란(*Crocus sativus*)이 아니다 |
| **감** | Date Plum | 고욤나무 *Diospyros lotus* | **고욤나무**로 씀. 감(*D. kaki*)이 아니다 |
| **월귤** | Bilberry | 국명 월귤=링곤베리 *V. vitis-idaea* / 영문 Bilberry=*V. myrtillus* | **양쪽 각 1편**. 어느 종인지 각 행에 명시 |
| **마** | Indian Hemp | *Apocynum cannabinum*(북미) | **아포시넘**으로 씀. 한국 '마'(*Dioscorea*)와 무관 |
| **단양쑥부쟁이** | Fig Marigold | 국명=한국 고유종 *Aster altaicus* var. *uchiyamae* / 영문=*Mesembryanthemum* | **한국 고유종**으로 씀. **화면에 영문명 병기 금지** |
| **머위** | Sweet-Scented Tussilago | 국명 머위=*Petasites japonicus* / Tussilago=관동 | ***Petasites*** 기준 |
| **범의귀** | Aaron's Beard | 국명 범의귀=*Saxifraga* / Aaron's Beard=*Hypericum calycinum* | **양쪽 각 1편** |
| **개옻나무** | Rhus cotinus | 안개나무 *Cotinus coggygria* | **안개나무**로 씀. 개옻나무(*Toxicodendron*)가 아니다 |
| **납매** | Carolina Allspice | 납매=*Chimonanthus praecox* / Carolina Allspice=*Calycanthus floridus* | **납매**로 씀 |
| **삼나무** | Cedar | 국명 삼나무=*Cryptomeria japonica* / Cedar=*Cedrus* | ***Cryptomeria*** 기준. 백향목 소재는 전부 보류 |
| **해당화** | Crab Apple | *Rosa rugosa* | **해당화**로 씀. Crab Apple(*Malus*)은 표의 오기 |
| **갯개미취** | Michaelmas Daisy | *Aster tripolium* | 통칭이 가리키는 정원 아스터와 구분. 미카엘 축일 소재 **기각** |

추가로 **가막살나무**(칼리나는 *V. opulus*, 국명은 *V. dilatatum*)와
**노송나무**(한국에서 소나무를 가리키는 용례가 있음)는 같은 속·이명 수준의 어긋남이라
표에는 넣지 않고 `editorial_note` 로만 처리했다.

### 5-1. 중복 회피

같은 소재가 두 이름에 걸리는 자리를 미리 갈랐다.

- **pteridomania(빅토리아 양치식물 광풍)** → **양치**에만. 골고사리는 북미 변종 보전 이야기로.
- **아스피린 명명** → **조팝나무**에만. 버드나무는 나폴레옹·학명 오류로.
- **'돌을 깨는' 어원** → **바위취**에만. 범의귀는 *Hypericum*·런던 프라이드로.
- **참나무 혹 잉크 ↔ 붉나무 오배자** — 둘 다 타닌 잉크라 인접하다. 각각 남기되
  `editorial_note` 에 "화면에서 나란히 붙이지 말 것"을 적었다.
- **카탈로그 `crocus` 기존 4편**(단일 클론·뉘른베르크 Safranschau·문트 마을·콜키쿰 동정)과
  사프란 신규 2편은 **소재 충돌 0건**.
- **카탈로그 `aster` 기존 4편**과 갯개미취 신규 2편도 **충돌 0건**.

---

## 6. URL 전수 검증

`content/birth_stories.part3.csv` 의 **`source_url` 200개(전부 고유)** 를 HEAD→GET 순으로
전수 조회했다.

| 결과 | 건수 |
|---|---|
| HTTP 200 | **195** |
| HTTP 403 | 4 |
| 연결 예외 | 1 |

403·예외 5건은 **죽은 링크가 아니라 봇 차단**이다. 브라우저 헤더를 붙여 재시도해도
스크립트로는 동일하게 막혔고, 렌더링 페치로 5건 전부를 다시 열어 **본문이 살아 있고
우리가 인용한 사실을 그대로 담고 있음**을 확인했다.

| URL | 스크립트 | 렌더링 페치 확인 결과 |
|---|---|---|
| `academic.oup.com/g3journal/…/jkad158` | 403 | 살아 있음. 발현차이 오소그룹 **2,786** 수치까지 일치 |
| `arboretum.harvard.edu/…/christine-buisman/` | 403 | 살아 있음. 베스테르데이크·연구자 **56명**·슈바르츠·바위스만 확인 |
| `phys.org/news/2011-05-4505m-swiss-alps.html` | 403 | 살아 있음. **4,505m**·돔 봉우리·쾨르너·영하 20.9도 확인 |
| `royal.uk/the-order-of-the-thistle` | 403 | 살아 있음. 좌우명·**16인**·1687년 제임스 7세·시슬 채플 확인 |
| `pilebuck.com/building-venice-timber-piles-…` | 예외 | 살아 있음. 말뚝 **790만~1,580만** 개·오리나무 기본 말뚝 확인 |

> **검증 중 잡은 오류 1건.** pilebuck 원문은 "7.9~15.8 million"인데 초안이 이를
> "780만~1,580만"으로 적고 있었다. **790만~1,580만**으로 고쳤다.

검증 스크립트와 블록→CSV 변환기는
`(scratchpad)/verify-urls.ps1`, `(scratchpad)/blocks-to-csv.ps1` 에 남아 있다.
후자는 스키마·어휘(`story_type`/`source_kind`/`confidence`)·`story_id` 중복·URL 형식·
이름당 편수를 함께 검사하고, 저장소 규약대로 **UTF-8 BOM 없음 / LF / 최소 인용**으로 쓴다.

---

## 7. 못 찾은 자리와 버린 소재

### 7-1. `낙엽 마른 풀` (11/30) — 유일한 1편

이 날의 이름은 **식물이 아니라 상태**다. 표에는 `낙엽 마른 풀 / Dry Grasses` 라고만 적혀 있어
이야기를 붙일 대상 자체가 없다. 두 조사자 모두 독립적으로 **'없음'** 으로 보고했다.

확인한 것은 케이트 그리너웨이 『Language of Flowers』(1884) 전문뿐이고,
`Dried Flax — Utility` / `Dead Leaves — Sadness` / `Grass — Submission. Utility.` /
`Straw, whole — Union` / `Straw, broken — Rupture of a contract` 가 실려 있으며
**`Dry Grasses` 라는 표제어 자체가 없다.**

Advisor의 완화된 정책("검증된 이야기가 1편뿐이어도 싣는다")에 따라,
**이야기를 지어내는 대신 "이야기가 없다"는 사실 자체를 1편으로 세웠다**
(`bstory-dry-grasses-greenaway-1884`). 이 자리는 화면에서 다른 꽃과 같은 무게로
노출하지 않는 편이 낫다.

### 7-2. 매력적이었지만 버린 소재

| 이름 | 버린 소재 | 사유 |
|---|---|---|
| 엉겅퀴 | 바이킹 야습 전설(1263 라그스) | 기관 출처 전부 차단(403/404). 두 조사자 판단 불일치 |
| 알로에 | 소코트라 섬·알렉산더 대왕 | 인용은 무성한데 1차 사료로 이어지는 페이지 없음 |
| 갯개미취 | 미카엘 축일(9/29) 민담 | 통칭이 가리키는 종이 다름(§5) |
| 박하 | 켄터키 더비 민트 줄렙 | 공식 URL이 조사자에 따라 404. 안정성 미달 |
| 멜론 | 유바리 멜론 경매 최고가 | 관련 페이지 전부 403/404 |
| 플라타너스 | 크세르크세스의 황금 장식 | 헤로도토스 7권 원문 페이지 접근 전부 실패 |
| 겨우살이 | 대플리니우스 원문(황금 낫) | 원전 페이지 접근 실패. 그리브(1931) 2차 서술로 대체 |
| 메귀리 | 까끄라기 점프 기제 원논문 | Acta Biomaterialia 2021 유료 벽 |
| 석류 | 613개 씨앗 실측 원논문 | Crossref·Europe PMC 어디에도 없음(잡지 기사로 대체) |
| 노송나무 | 기소 히노키 조달·호류지 목재 | 이세 신궁 하위 페이지 404, UNESCO·호류지 공식 403 |
| 파인애플 | 1675년 존 로즈 헌정 그림 | 왕실컬렉션 403. 스미스소니언 소재로 대체 |
| 로즈메리 | 헝가리 워터(1370년 엘리자베트) | 출처가 향수 블로그·상업 사이트뿐 |
| 색비름 | 아즈텍 공물 2만 톤·처벌 세부 | 학술 출처에서 확인 불가(과장 논란) |

### 7-3. 조사 환경 제약

세션 `WebSearch` 예산(200회)이 조사 중반에 소진되어, 이후 배치는 전부 `WebFetch` 로
URL을 직접 추정·열람하는 방식으로 진행했다. 대체 검색엔진은 대부분 차단됐고
(DuckDuckGo CAPTCHA, Brave 429, Ecosia·Mojeek·Startpage 403),
**Europe PMC REST API** 가 학술 검색기 대용으로 가장 잘 작동했다.

**잘 열리는 도메인**(다음 라운드 재사용 권장): `plants.ces.ncsu.edu` ·
`penelope.uchicago.edu` · `gutenberg.org` · `pmc.ncbi.nlm.nih.gov` · `botanical.com` ·
`pfaf.org` · `treesforlife.org.uk` · `woodlandtrust.org.uk` · `etymonline.com` ·
`encykorea.aks.ac.kr` · `shakespeare.mit.edu`.

**반복 차단**: `kew.org` · `britannica.com` · `rhs.org.uk`(일부) · `atlasobscura.com` ·
`theoi.com` · `perseus.tufts.edu`(카드 형식이 아니면 본문 미로딩) ·
`royal.uk`·`arboretum.harvard.edu`·`phys.org`·`academic.oup.com`(스크립트 한정).

---

## 8. Advisor 판단이 필요한 지점

1. **`낙엽 마른 풀` 1편을 실을 것인가.** §7-1 대로 "이야기가 없다"를 이야기로 세웠다.
   빼는 쪽이 깔끔하다고 보면 그 한 행만 지우면 되고, 그러면 96개 이름 / 199행이 된다.

2. **동정이 어긋난 이름의 화면 표기.** §5의 12건은 `birth_flowers.csv` 의 `name_en` /
   `scientific_name` 을 그대로 화면에 내보내면 **이야기와 어긋난다.** 특히
   **단양쑥부쟁이에 `Fig Marigold` 를 병기하면 안 되고**, 해당화에 `Crab Apple` 을
   병기하면 안 된다. `editorial_note` 는 화면에 나가지 않는 칸이므로(birth-v1 §8-4),
   **표기용 별도 컬럼이나 예외 목록이 필요**하다.

3. **`culture_region` 신규 값 16종의 승인.** `arabia` `ainu` `sapmi-norway` `byzantium`
   `gaul` `alps` `andes` `st-helena` 등은 국가명이 아니다. 3·4차의 `navajo`·`aztec`
   선례를 따랐지만, 화면에서 문화권 라벨을 노출한다면 표기 규칙이 필요하다.

4. **독초 3종의 노출 방식.** 사프란(콜키쿰) · 흰독말풀 · 서향은 본문에 약용 서술이
   들어 있다. 전부 독성 경고를 같은 문단에 붙였지만, `pet_safety.csv` 와 연동할지
   판단이 필요하다.

5. **part1·part2와의 `story_id` 충돌.** 이 배치는 기존 `stories.csv` 377행과 충돌 0건을
   확인했으나, **1~4월·5~8월 worker의 산출물과는 대조하지 못했다.** 병합 전 3자 대조가 필요하다.
   (이 배치의 slug는 전부 `bstory-<영문 식물 slug>-<주제>` 형식이라 담당 월이 다르면
   충돌 가능성은 낮지만, `bstory-fern-…` 처럼 일반명 slug는 겹칠 여지가 있다.)

---

## 9. 검증

- `content/birth_stories.part3.csv` — 200행 / 97개 이름 / 12컬럼
- 스키마·어휘 검사 통과: `story_type` ∈ {history, folklore, literary},
  `source_kind` ∈ 8값, `confidence` ∈ 3값, 빈 칸 0, `story_id` 중복 0,
  `story_id` 형식 `^bstory-[a-z0-9-]+$` 전수 일치
- `name_ko` 는 `birth_flowers.csv` 9~12월 미연결 이름 97개와 **정확히 일치**(누락 0 / 초과 0)
- `source_url` 200개 전수 HTTP 검증 (200: 195 / 봇 차단 5건은 렌더링 페치로 본문 확인)
- 파일 규약: UTF-8 BOM 없음 · LF 개행 · 필요할 때만 인용(`,` `"` 포함 시)
- 기존 `stories.csv` 와 `story_id` 충돌 0건
