# 꽃 이야기 리서치 배치 2 — 정식 도감 확장 12종 채우기 (story-research-batch2)

## 1. 조사 개요

- **조사일**: 2026-08-17
- **주문**: 정식 도감 확장 배치 2 — 신설 12종에 **꽃당 4편 이상**(가능하면 6편)의 이야기를 붙인다.
- **수집 이야기**: **61편** (12종 × 평균 5.1편, 최소 4편 · 최대 6편)
- **적재 결과**: `content/stories.csv` **377행 → 438행**
- **대상 12종**: `phalaenopsis` `alstroemeria` `anthurium` `gardenia` `eucalyptus` `statice` `mimosa` `bouvardia` `scabiosa` `plum-blossom` `azalea` `cotton`
- **기존 377편과의 중복**: **0건**. `story_id` 중복 0건, `birth_stories.csv` 407편과의 id 충돌 0건을 기계 대조로 확인했다(§7).
- **`birth_stories.csv` 와의 소재 중복**: **0건**. 이름이 겹치는 5종(미모사·치자나무·진달래·매화·목화)의 기존 9편을 착수 전에 전수 열람하고 그 소재를 금지 목록으로 배포했다(§4).
- **모든 `source_url` 은 실제로 열어 본문을 확인**했고, 적재 후 61건을 다시 기계로 재검했다(§7-2). 열람 실패한 후보는 전부 뺐고 §6에 사유와 함께 남겼다.

### 1-1. 이번 라운드가 노린 것

1. **최소 4편, 실제로는 5.1편.** 12종 중 10종이 5편 이상이고 2종(mimosa·scabiosa)은 6편이다. 4편에 그친 것은 `alstroemeria` 한 종뿐이다(§5-2에 사유).
2. **종 동정 함정을 이야기의 몸통으로 썼다.** 이번 12종은 배치 1보다도 이름 사고가 심했다 — 미모사, 진달래/철쭉, 매화/자두, 스타티스/리모니움, 스카비오사/수키사, 안스리움의 불염포. **함정 자체가 주인공인 행을 9편** 세웠다(§4-1).
3. **한국을 축으로 두되 한쪽으로 몰지 않았다.** 한국 소재 7편, 동아시아(일본·중국·대만) 12편, 서구 24편, 그 밖(중남미·아프리카·중앙아시아·오세아니아·튀르키예) 18편이다. **문화권 값이 32가지**로 배치 1(26가지)보다 늘었다.
4. **위키 3.3%.** 신규 61편 중 위키 계열은 2편이다(§2-1). 영문 위키피디아 직접 인용은 **0편**이다.

### 1-2. 저작권 처리 원칙 (1~5차와 동일)

- **타 사이트 문장을 옮긴 곳은 한 군데도 없다.** `story_ko` 는 전부 사실관계만 참고해 새로 쓴 우리 문장이다(한국어 해요체, 평균 297자).
- 설화·역사적 사실 자체는 아이디어라 저작권 대상이 아니다. 표현만 새로 쓰면 자유롭게 쓸 수 있다.
- 원문 인용이 필요한 대목은 **퍼블릭 도메인 자료**에 한해, 직접 인용부호 없이 우리말로 옮겨 실었다 — 맨더빌 『동방여행기』(14c), 헨리 리 『The Vegetable Lamb of Tartary』(1887), 『King's American Dispensatory』(1898), 케이트 그리너웨이 『Language of Flowers』, 『The Gardener's Monthly』 25권, 『만엽집』 권5 서문, 두목·온정균·나업의 한시.
- **`story_type=original`(자작)은 이번 배치에서 0편이다.** 출처 없는 행도 0편이다.
- **confidence 라벨** (1~5차와 동일 기준)
  - `repeated` — 여러 독립 출처에서 반복 확인되는 정설/사실
  - `varies` — 전승은 널리 알려졌으나 버전이 갈리거나 출처가 한 계열에 몰림
  - `single_source` — 출처가 하나뿐

---

## 2. 이번 라운드 지표

### 2-1. source_kind 분포 — 위키 3.3%

| source_kind | 뜻 | 편수 | 비중 |
|---|---|---|---|
| `other` | 정부기관·공공방송·학회·특허·전고 DB 등 | 13 | 21.3% |
| `garden` | 식물원·대학 익스텐션·농업/보전 기관 | 12 | 19.7% |
| `paper` | 학술 논문 | 11 | 18.0% |
| `newspaper` | 신문·통신사 | 8 | 13.1% |
| `magazine` | 잡지·학회지·전문 매체 | 6 | 9.8% |
| `museum` | 박물관·도서관·기록원 | 5 | 8.2% |
| `book-pd` | 퍼블릭 도메인 고서 원문 | 4 | 6.6% |
| `wiki` | 위키·백과사전·정리 사이트 | 2 | 3.3% |
| **합계** | | **61** | **100%** |

> **`wiki` 2편의 정체.** #34 `story-gardenia-joseon-yellow` 의 한국민족문화대백과사전(한국학중앙연구원)과 #61 `story-bouvardia-kanchoji` 의 코토뱅크 게재 『일본대백과전서』(쇼가쿠칸)다. 둘 다 기관이 편찬한 학술사전이며, 3·5차 라운드가 한국민족문화대백과사전을 `wiki` 로 분류한 선례를 그대로 따랐다.
> **영문 위키피디아 직접 인용은 이번 라운드에도 0편이다.** 전체 438편 기준 `wiki` 는 168편(38.4%)으로 5차 시점의 44.0%에서 더 내려갔다. 남은 것은 1·2차 유산이다.

### 2-2. 문화권 분포 — 32가지 값

| 문화권 묶음 | 편수 | culture_region 값 |
|---|---|---|
| 한국 | 7 | `korea`(7) |
| 동아시아(한국 제외) | 12 | `japan`(5) `china`(2) `taiwan`(2) `japan-usa` `uk-china` `china-korea` |
| 북미 | 9 | `usa`(6) `hawaii` `ecuador-usa` `usa-australia` |
| 서유럽·남유럽 | 8 | `italy`(3) `france`(2) `portugal` `greece-rome`(2) |
| 영국·아일랜드 제도 | 4 | `england`(2) `uk` `uk-usa` |
| 오세아니아 | 3 | `australia`(2) `australia-uk` |
| 중남미 | 4 | `mexico`(2) `chile` `colombia-belgium` |
| 아프리카 | 2 | `ethiopia` `south-africa` |
| 중앙아시아·서아시아 | 3 | `uzbekistan-kazakhstan` `turkey` `europe-central-asia` |
| 기타·범지구 | 9 | `global`(6) `western` `indonesia-europe` `chile-sweden` |

### 2-3. 꽃별 편수 — 12종 · 61편

| 꽃 | 편수 | 문화권 |
|---|---|---|
| `phalaenopsis` 호접란 | 5 | 인도네시아·유럽 / 범지구 / 서구 / 대만 / **한국** |
| `alstroemeria` 알스트로메리아 | 4 | 칠레·스웨덴 / 범지구 / 범지구 / 칠레 |
| `anthurium` 안스리움 | 5 | 범지구 / 콜롬비아·벨기에 / 하와이 / 에콰도르·미국 / 미국 |
| `gardenia` 치자 | 5 | **한국** / 중국 / 일본 / **한국** / 미국 |
| `eucalyptus` 유칼립투스 | 5 | 에티오피아 / 오스트레일리아 / 오스트레일리아·영국 / 미국·오스트레일리아 / 미국 |
| `statice` 스타티스 | 5 | 범지구 / 그리스·로마 / 미국 / 이탈리아 / 일본 |
| `mimosa` 미모사 | 6 | 이탈리아 ×2 / 프랑스 / 일본·미국 / 포르투갈 / 오스트레일리아 |
| `bouvardia` 부바르디아 | 5 | 프랑스 / 멕시코 ×2 / 미국 / 일본 |
| `scabiosa` 스카비오사 | 6 | 그리스·로마 / 잉글랜드 ×2 / 영국 / 남아프리카 / 일본 |
| `plum-blossom` 매화 | 5 | **한국** / 일본 / 중국 / 대만 / 영국·중국 |
| `azalea` 진달래 | 5 | 중국·한국 / **한국** ×2 / 미국 / 튀르키예 |
| `cotton` 목화 | 5 | 유럽·중앙아시아 / 영국·미국 / 우즈베키스탄·카자흐스탄 / **한국** / 범지구 |
| **합계** | **61** | |

### 2-4. story_type / confidence / mood / intent

| story_type | 편수 | | confidence | 편수 |
|---|---|---|---|---|
| `history` | 57 (93.4%) | | `repeated` | 36 (59.0%) |
| `folklore` | 4 (6.6%) | | `single_source` | 16 (26.2%) |
| `literary` | 0 | | `varies` | 9 (14.8%) |
| `original` | **0** | | | |

| mood | 편수 | | intent | 편수 |
|---|---|---|---|---|
| `healing` | 32 | | `just_because` | 47 |
| `mythic` | 30 | | `comfort` | 7 |
| `dramatic` | 26 | | (비움 = 전천후) | 6 |
| `funny` | 24 | | `gratitude` | 4 |
| `tragic` | 10 | | `celebration` | 3 |
| `romantic` | 3 | | `apology` | 1 |

**6종 mood 전부 커버.** `funny` 24편은 배치 1(2편)의 최대 약점을 뒤집은 값이다 — 이름 사고를 정면으로 다룬 결과 웃긴 이야기가 자연스럽게 늘었다.
**`romantic` 3편**은 여전히 얇다. 이번 12종은 관엽·건조화·수목이 절반이라 연애 전승 자체가 드물었다(§7-1).
**`apology` 1편**(#41 두견새 전설)이 이 데이터셋의 첫 apology 태그다. 배치 1의 후속 과제였는데, **억지로 늘리지 않았다** — 사과 자리에 놓을 근거 있는 소재가 이번 12종에도 사실상 없었다는 것이 조사 결과다(§7-1).

---

## 3. 이야기 표

> 컬럼: `# | story_id | 제목 | hook | region | era | type | conf | source | kind`
> `story_ko` 본문은 `content/stories.csv` 에 그대로 실려 있어 여기서는 생략하고, **판정 근거는 각 행의 `editorial_note`** 에 남겼다.
> 번호(#1~#61)는 각 행의 `editorial_note` 에 그대로 적혀 있다.

### 3-1. phalaenopsis · alstroemeria · anthurium — 14편

| # | story_id | 제목 | hook | region | era | type | conf | source | kind |
|---|---|---|---|---|---|---|---|---|---|
| 1 | story-phalaenopsis-moth-or-butterfly | 서양은 나방이라 불렀습니다 | 서양은 이 꽃에서 나방을 보았고, 동아시아는 나비를 보았습니다. | indonesia-europe | 18c-19c | history | repeated | [Phalaenopsis The Genus (American Orchid Society)](https://www.aos.org/orchid-care/orchid-care-and-culture-sheets/phalaenopsis-culture-sheet/phalaenopsis-the-genus) | other |
| 2 | story-phalaenopsis-seed-without-lunch | 도시락 없이 태어나는 씨앗 | 이 꽃의 씨앗에는 도시락이 없습니다. | global | modern | history | repeated | [A novel method to produce massive seedlings via symbiotic seed germination in orchids (Front. Plant Sci. 2023)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10034380/) | paper |
| 3 | story-phalaenopsis-eleven-year-wait | 씨를 뿌리고 열한 해를 기다렸습니다 | 씨를 뿌린 사람이 그 꽃을 보기까지 열한 해가 걸렸습니다. | western | 19c-20c | history | single_source | [Development of Phalaenopsis Orchids for the Mass-Market (ASHS Press 2002)](https://www.hort.purdue.edu/newcrop/ncnu02/v5-458.html) | paper |
| 4 | story-phalaenopsis-equestris-genome | 유전자 지도가 가장 먼저 그려진 난초 | 난초과에서 유전자 지도가 가장 먼저 그려진 것은 호접란이었습니다. | taiwan | 2010s | history | repeated | [Taiwan's Moth Orchids — Their Past and Future (Taiwan Panorama)](https://www.taiwan-panorama.com/en/Articles/Details?Guid=51501450-70cd-4328-8c25-aad9cf7c31ca&CatId=9) | magazine |
| 5 | story-phalaenopsis-korea-auction-halved | 경매장이 여는 날이 절반으로 줄었습니다 | 법 조문 한 줄이 바뀌자 난 경매장이 여는 날이 절반이 됐습니다. | korea | 2010s | history | single_source | [청탁금지법 직격탄 벼랑끝으로 몰리는 화훼시장 (KTV 국민방송)](https://m.ktv.go.kr/content/view?content_id=534380) | newspaper |
| 6 | story-alstroemeria-not-from-peru | 페루 백합인데 페루 꽃이 아닙니다 | 페루 백합이라 불리는데, 이 꽃이 가장 많은 나라는 칠레입니다. | chile-sweden | 18c | history | repeated | [Towards an Integrative Taxonomy of Alstroemeria in Chile (IntechOpen 2017)](https://www.intechopen.com/chapters/57889) | paper |
| 7 | story-alstroemeria-upside-down-leaves | 잎이 전부 뒤집혀 있습니다 | 이 꽃의 잎은 전부 뒤집혀 있습니다. 그것도 늘 같은 방향으로요. | global | modern | history | repeated | [Conflict between Intrinsic Leaf Asymmetry and Phyllotaxis (Front. Plant Sci. 2012)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3415700/) | paper |
| 8 | story-alstroemeria-florist-fingertips | 잎을 훑는 손끝 | 꽃다발이 예쁘게 다듬어져 오는 동안, 누군가의 손끝이 갈라집니다. | global | modern | history | repeated | [Allergic Contact Dermatitis to Plants (Actas Dermo-Sifiliográficas 2012)](https://www.actasdermo.org/en-allergic-contact-dermatitis-plants-understanding-articulo-S1578219012001989) | paper |
| 9 | story-alstroemeria-liuto-chuno | 아픈 사람에게 먹이던 뿌리 | 칠레에서는 이 꽃의 뿌리를 쑤어 아픈 사람에게 먹였습니다. | chile | traditional | history | single_source | [chuño de liuto (Tesauro Regional Patrimonial de Chile)](https://www.tesauroregional.cl/terminos/1983) | museum |
| 10 | story-anthurium-spathe-is-a-leaf | 빨간 건 꽃잎이 아닙니다 | 안스리움에서 꽃잎처럼 보이는 그 빨간 판은 잎입니다. | global | modern | history | repeated | [Anthurium andraeanum (NC Extension Gardener Plant Toolbox)](https://plants.ces.ncsu.edu/plants/anthurium-andraeanum/) | garden |
| 11 | story-anthurium-andre-1876 | 정원 설계자가 숲에서 만난 꽃 | 이 꽃을 숲에서 처음 집어 든 사람은 식물학자가 아니라 정원 설계자였습니다. | colombia-belgium | 19c | history | repeated | [The origin, germplasm resources, and breeding of Anthurium andraeanum (Ornamental Plant Research 2025)](https://www.maxapress.com/article/doi/10.48130/opr-0025-0002) | paper |
| 12 | story-anthurium-hawaii-blight | 섬 하나를 반으로 줄인 병 | 화분 하나로 건너간 꽃이 한 섬의 산업이 되었다가, 병 하나에 절반으로 줄었습니다. | hawaii | 19c-20c | history | repeated | [Hawaii's Anthurium Growers Cope With Plant Disease (ScienceDaily · Univ. of Hawaii)](https://www.sciencedaily.com/releases/2006/03/060306112128.htm) | magazine |
| 13 | story-anthurium-hundred-thousandth-specimen | 종이 일곱 장에 나눠 붙인 표본 | 잎 한 장이 표본 종이에 안 들어가서, 일곱 장에 나눠 붙였습니다. | ecuador-usa | 2000s | history | single_source | [Missouri Botanical Garden mounts milestone 6 millionth herbarium specimen (EurekAlert · MoBOT)](https://www.eurekalert.org/news-releases/798612) | museum |
| 14 | story-anthurium-sixty-three-in-one-year | 한 해에 예순세 종 | 어떤 무리는 이름의 절반 넘는 수가 한 해에 한꺼번에 생겼습니다. | usa | 2020s | history | single_source | [MoBOT shows off pictures of new plant species (Spectrum News St. Louis)](https://spectrumlocalnews.com/mo/st-louis/news/2026/01/01/missouri-botanical-garden-plant-species-described-discoveries) | newspaper |

### 3-2. eucalyptus · mimosa — 11편

| # | story_id | 제목 | hook | region | era | type | conf | source | kind |
|---|---|---|---|---|---|---|---|---|---|
| 15 | story-eucalyptus-menelik-capital | 수도를 옮기려던 계획을 접게 만든 나무 | 한 나라의 수도를 옮기려던 계획이, 나무가 너무 빨리 자란다는 이유로 취소됐습니다. | ethiopia | 19c-20c | history | repeated | [The Eucalyptus Tree, and Ethiopia's First Modern Schools and Hospitals (Richard Pankhurst)](https://twlethiopia.org/article/2-the-eucalyptus-tree-and-ethiopias-first-modern-schools-and-hospitals/) | other |
| 16 | story-eucalyptus-centurion | 백 미터를 넘긴 나무 | 지금까지 알려진 활엽수 가운데 가장 큰 나무는 유칼립투스입니다. 100.5미터예요. | australia | modern | history | single_source | [Giant Trees and Very Tall Forest (NRE Tasmania)](https://nre.tas.gov.au/about-the-department/emergency-response-information/bushfire-information/how-our-iconic-natural-values-respond-to-fire/giant-trees-and-very-tall-forest) | garden |
| 17 | story-eucalyptus-well-covered | 뚜껑이 이름이 됐습니다 | 팔백 종이 넘는 무리의 이름이, 꽃봉오리에 씌워진 뚜껑 하나에서 나왔습니다. | australia-uk | 18c | history | **varies** | [Stringybark is tough as boots (The Conversation)](https://theconversation.com/stringybark-is-tough-as-boots-and-gave-us-the-word-eucalyptus-100528) | magazine |
| 18 | story-eucalyptus-silver-dollar-juvenile | 꽃다발 속 유칼립투스는 아직 어린 잎입니다 | 꽃다발 속 그 동그란 유칼립투스 잎은 아직 다 자라지 않은 잎입니다. | usa-australia | modern | history | repeated | [Eucalyptus cinerea (NC Extension Gardener Plant Toolbox)](https://plants.ces.ncsu.edu/plants/eucalyptus-cinerea/) | garden |
| 19 | story-eucalyptus-oakland-firestorm | 철도 침목을 만들려고 심은 나무 | 철도 침목으로 쓰려고 심었다가 실패한 나무가, 백사십 년 뒤 언덕을 태웠습니다. | usa | 19c-20c | history | repeated | [Eucalyptus: Fuel for Fire (KQED QUEST)](https://www.kqed.org/quest/25998/eucalyptus-fuel-for-fire) | newspaper |
| 20 | story-mimosa-1946-free-flower | 값이 들지 않아서 골랐습니다 | 이 꽃이 여성의 날의 상징이 된 첫 번째 이유는, 돈이 들지 않아서였습니다. | italy | 1940s | history | **varies** | [Da dove arriva la tradizione della mimosa per l'8 marzo (Il Post)](https://www.ilpost.it/2025/03/08/tradizione-mimosa-8-marzo-giornata-donna/) | newspaper |
| 21 | story-mimosa-wax-stencil | 등사기로 밀어 만든 꽃 | 처음 그 꽃다발이 거리로 나갔을 때, 다발은 압수당하고 여성들은 붙들렸습니다. | italy | 1940s | history | single_source | [Perché la mimosa l'8 marzo? (ANSA)](https://www.ansa.it/canale_lifestyle/notizie/societa_diritti/2025/03/06/perche-la-mimosa-l8-marzo-il-fiore-simbolo-fu-scelto-nel-1946-da-marisa-rodano_a1a352d7-973a-473b-8117-c43fee8e98eb.html) | newspaper |
| 22 | story-mimosa-route-du-mimosa | 겨울을 억지로 봄으로 만드는 방 | 한겨울에 노란 미모사를 파는 방법은, 23도로 데운 방에 봉오리를 들여놓는 것입니다. | france | modern | history | repeated | [Un peu d'histoire — Mimosa (OT de Mandelieu-La Napoule)](https://www.mandelieu-tourisme.com/evenementiel/mimosa/un-peu-dhistoire/) | other |
| 23 | story-mimosa-three-plants-one-name | 미모사라는 이름을 쓰는 식물이 셋입니다 | 꽃집에서 파는 미모사는 식물학적으로 미모사가 아닙니다. | japan-usa | modern | history | repeated | [3月8日「ミモザの日」って何をする日？ (GardenStory)](https://gardenstory.jp/events-news/125888) | magazine |
| 24 | story-mimosa-portugal-invasive | 같은 노란색이 어디서는 재난입니다 | 프랑스 언덕을 노랗게 물들이는 그 성질이, 국경 하나 너머에서는 규제 사유입니다. | portugal | modern | history | single_source | [Acacia dealbata — Invasive plant species in Portugal (invasoras.pt)](https://invasoras.pt/en/invasive-plant/acacia-dealbata) | garden |
| 25 | story-mimosa-golden-wattle-is-another | 고향의 노란 꽃은 다른 나무입니다 | 미모사의 고향이 나라꽃으로 삼은 노란 꽃은, 미모사가 아닙니다. | australia | modern | history | single_source | [Australia's Floral Emblem: Golden Wattle (ANBG)](https://www.anbg.gov.au/emblems/aust.emblem.html) | garden |

### 3-3. cotton · gardenia — 10편

| # | story_id | 제목 | hook | region | era | type | conf | source | kind |
|---|---|---|---|---|---|---|---|---|---|
| 26 | story-cotton-vegetable-lamb | 나무에서 양이 자란다고 믿었습니다 | 중세 유럽은 목화를 설명하려고 나무에서 양이 자란다고 했습니다. | europe-central-asia | 14c-18c | **folklore** | repeated | [Animal, Vegetable, Lamb: The Zoophyte from Tartary (The Public Domain Review)](https://publicdomainreview.org/essay/animal-vegetable-lamb/) | magazine |
| 27 | story-cotton-manchester-1862 | 굶으면서 봉쇄를 지지한 사람들 | 자기를 굶기고 있는 봉쇄를 지지한다고 결의한 사람들이 있습니다. | uk-usa | 19c | history | repeated | [Manchester, cotton and slavery (Science and Industry Museum)](https://www.scienceandindustrymuseum.org.uk/objects-and-stories/manchester-cotton-and-slavery) | museum |
| 28 | story-cotton-aral-sea | 목화밭을 얻고 바다를 잃었습니다 | 사막을 밭으로 바꾸려다 바다 하나가 사라졌습니다. | uzbekistan-kazakhstan | modern | history | repeated | [World of Change: Shrinking Aral Sea (NASA Earth Observatory)](https://science.nasa.gov/earth/earth-observatory/world-of-change/aral-sea) | other |
| 29 | story-cotton-korea-cloth-money | 무명 한 필이 곧 돈이던 시절 | 화폐의 올 수를 나라가 직접 단속하던 시절이 있습니다. | korea | joseon | history | repeated | [쌀과 면포 중심의 화폐 유통 (우리역사넷 · 국사편찬위원회)](http://contents.history.go.kr/front/km/view.do?levelId=km_027_0050_0050_0040) | other |
| 30 | story-cotton-one-cell | 솜 한 올은 세포 하나입니다 | 목화솜 한 올은 실이 아니라 세포 하나입니다. | global | modern | history | single_source | [Cotton fiber: a powerful single-cell model (Front. Plant Sci. 2012)](https://www.frontiersin.org/articles/10.3389/fpls.2012.00104/full) | paper |
| 31 | story-gardenia-yanghwasorok-four | 조선 원예서가 꼽은 네 가지 | 조선의 첫 원예서는 이 꽃이 왜 좋은지를 네 가지로 쪼개어 적어 두었습니다. | korea | joseon | history | **varies** | [꽃향기도 치명적인데 약효까지? 대단한 치자 (오마이뉴스)](https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0002859530) | newspaper |
| 32 | story-gardenia-cup-shaped-fruit | 이름이 술잔에서 왔습니다 | 치자의 치는 술잔이라는 뜻입니다. 열매가 그 잔을 닮았거든요. | china | ancient | history | repeated | [梔子花 (行政院農業部 農業知識入口網)](https://kmweb.moa.gov.tw/theme_data.php?theme=plant_illustration&id=77) | other |
| 33 | story-gardenia-kuchinashi | 입이 없는 열매 | 이 열매는 다 익어도 입을 벌리지 않습니다. 그래서 일본 이름이 입 없음이에요. | japan | modern | history | **varies** | [クチナシ｜薬用植物図鑑 (神戸薬科大学 薬用植物園)](https://www.kobepharma-u.ac.jp/botanical-gardens/gallery/winter/post-25.html) | garden |
| 34 | story-gardenia-joseon-yellow | 육백 년 동안 노란색이었습니다 | 단무지의 노란색과 조선 궁중의 노란색은 같은 열매에서 나왔습니다. | korea | joseon | history | repeated | [염료 (한국민족문화대백과사전)](https://encykorea.aks.ac.kr/Article/E0037087) | wiki |
| 35 | story-gardenia-fda-blue | 노란 열매가 미국의 새 파란색이 됐습니다 | 오랫동안 노란 물감이던 열매가 2025년 미국에서 파란 색소로 승인됐습니다. | usa | modern | history | repeated | [FDA Approves Gardenia (Genipin) Blue Color Additive (U.S. FDA)](https://content.govdelivery.com/accounts/USFDA/bulletins/3e96521) | other |

### 3-4. plum-blossom · azalea — 10편

| # | story_id | 제목 | hook | region | era | type | conf | source | kind |
|---|---|---|---|---|---|---|---|---|---|
| 36 | story-plum-toegye-water-the-plum | 천원짜리에 매화가 있는 이유 | 천원짜리 지폐 속 퇴계 옆에 선 나무는 매화입니다. | korea | joseon | history | **varies** | [은행권 (한국조폐공사)](https://www.komsco.com/kor/contents/49) | other |
| 37 | story-plum-reiwa | 연호가 매화 잔치에서 나왔습니다 | 일본의 연호 레이와는 730년 매화 잔치의 서문에서 두 글자를 떼어 온 것입니다. | japan | ancient | history | repeated | [新元号「令和」の出典となった万葉集の部分を見たい (国立国会図書館)](https://crd.ndl.go.jp/reference/entry/index.php?id=1000254511&page=ref_view) | museum |
| 38 | story-plum-shouyang-makeup | 이마에 떨어진 꽃잎이 유행이 됐습니다 | 이마에 떨어진 매화 꽃잎 하나가 궁중 화장법이 됐습니다. | china | ancient | **folklore** | **varies** | [典故 壽陽公主 (搜韻)](https://sou-yun.cn/Query.aspx?type=allusion&id=2643&lang=t) | other |
| 39 | story-plum-taiwan-national-flower | 꽃잎 다섯과 수술 세 갈래 | 어느 나라는 꽃잎 다섯 장을 헌법으로 읽습니다. | taiwan | modern | history | repeated | [國花－國家象徵 (中華民國總統府)](https://www.president.gov.tw/Page/98) | other |
| 40 | story-plum-not-a-plum | 매화는 자두가 아닙니다 | 영어로는 자두꽃이라 부르지만, 매화는 자두보다 살구에 가깝습니다. | uk-china | 19c | history | repeated | [Prunus mume (Trees and Shrubs Online)](https://www.treesandshrubsonline.org/articles/prunus/prunus-mume/) | book-pd |
| 41 | story-azalea-dugyeon-bird | 새가 토한 피가 꽃을 물들였다고 합니다 | 진달래가 왜 붉은지에 대해, 천 년 전 시인들은 새가 토한 피라고 답했습니다. | china-korea | ancient | **folklore** | repeated | [가지 위의 진달래꽃은 두견새의 피 (오마이뉴스)](https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0000403370) | newspaper |
| 42 | story-azalea-chamkkot-gaekkot | 참꽃과 개꽃 | 참과 개를 가르는 잣대는 예쁨이 아니라 먹을 수 있느냐였습니다. | korea | modern | history | repeated | [이달의 나무 — 철쭉 (국립수목원 웹진 2011년 5월)](https://www.forest.go.kr/kna/webzine/2011/5/sub_07.html) | garden |
| 43 | story-azalea-sowol-first-edition | 시집 한 권이 1억 3500만 원 | 시집 한 권이 경매에서 1억 3500만 원에 팔렸습니다. | korea | 1920s | history | repeated | [김소월 시집 '진달래꽃' 초판, 1억3500만원…경매신기록 (뉴시스)](https://www.newsis.com/view/NISX20151220_0010488838) | newspaper |
| 44 | story-azalea-cornell-pink | 진달래에 붙은 미국 이름 | 미국 정원의 진달래 대표 품종 이름은 코넬 핑크입니다. | usa | modern | history | single_source | [In Memoriam: Dr. Henry T. Skinner, 1907-1984 (JARS v39n1)](https://scholar.lib.vt.edu/ejournals/JARS/v39n1/v39n1-kehr1.html) | magazine |
| 45 | story-azalea-mad-honey | 기원전 401년의 미친 꿀 | 기원전 401년, 그리스 병사들이 꿀을 먹고 무더기로 쓰러졌습니다. | turkey | ancient | history | repeated | [Mad honey poisoning-related asystole (Emergency Medicine Journal 2007)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2660097) | paper |

### 3-5. statice · scabiosa · bouvardia — 16편

| # | story_id | 제목 | hook | region | era | type | conf | source | kind |
|---|---|---|---|---|---|---|---|---|---|
| 46 | story-statice-salt-glands | 잎으로 소금을 내보냅니다 | 이 꽃이 속한 무리는 잎으로 소금을 내뿜습니다. | global | modern | history | repeated | [Progress in Studying Salt Secretion from the Salt Glands in Recretohalophytes (Front. Plant Sci. 2016)](https://www.frontiersin.org/journals/plant-science/articles/10.3389/fpls.2016.00977/full) | paper |
| 47 | story-statice-two-false-names | 이름 둘이 다 어긋났습니다 | 마른 뒤에도 색이 남는 그 부분은 꽃잎이 아니라 꽃받침입니다. | greece-rome | 18c | history | repeated | [Limonium sinuatum (Missouri Botanical Garden Plant Finder)](https://plantfinder.mobot.org/PlantFinderDetails.aspx?taxonid=285148) | garden |
| 48 | story-statice-marsh-rosemary-1898 | 1898년 약전에 실린 이름 | 이름이 떫다는 뜻이었는데, 1898년 약전은 정말로 떫다고 적어 두었습니다. | usa | 19c | history | single_source | [Statice.—Marsh Rosemary. King's American Dispensatory, 1898](https://www.henriettes-herb.com/eclectic/kings/statice-caro.html) | book-pd |
| 49 | story-statice-taxonomic-nightmare | 종을 세는 사람마다 답이 달라집니다 | 이 무리는 종을 세는 사람마다 답이 달라집니다. | italy | modern | history | repeated | [An expanded molecular phylogeny of Plumbaginaceae (Ecology and Evolution 2018)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6308857/) | paper |
| 50 | story-statice-wakayama | 겨울 내내 나오는 꽃 | 다른 꽃이 드문 겨울 내내 출하되는 꽃이 있습니다. | japan | modern | history | repeated | [スターチス (和歌山県)](https://www.pref.wakayama.lg.jp/prefg/130600/130651/sanchi/sutatisu/sutatisu.html) | other |
| 51 | story-scabiosa-named-for-scabies | 피부병 이름을 단 꽃 | 이 꽃의 학명은 피부병 이름에서 왔습니다. | greece-rome | 18c | history | repeated | [Scabiosa genus (PlantZAfrica · SANBI)](https://pza.sanbi.org/scabiosa-genus) | garden |
| 52 | story-scabiosa-devils-bit | 악마가 물어뜯은 뿌리 | 뿌리가 끊긴 것처럼 생긴 풀이 있습니다. 악마가 물어뜯었다고 했어요. | england | 16c | **folklore** | **varies** | [Plant of the Week – Devil's-bit Scabious (Botanical Society of Scotland)](https://botsocscot.wordpress.com/2025/07/27/plant-of-the-week-july-28th-2025-devils-bit-scabious-succisa-pratensis/) | garden |
| 53 | story-scabiosa-sheep-eat-it-first | 양이 먼저 먹어 치웁니다 | 어떤 나비를 지키려면 초지에 양을 들이면 안 됩니다. | uk | modern | history | single_source | [Marsh fritillary Euphydryas aurinia (JNCC)](https://sac.jncc.gov.uk/species/S1065) | other |
| 54 | story-scabiosa-mourning-bride | 나는 다 잃었습니다 | 빅토리아 시대 꽃말 사전에서 이 꽃의 뜻 하나는 나는 다 잃었습니다였어요. | england | 19c | history | single_source | [Language of Flowers (Kate Greenaway · Project Gutenberg)](https://www.gutenberg.org/files/31591/31591-h/31591-h.htm) | book-pd |
| 55 | story-scabiosa-ibheka | 줄루말로 눈의 약 | 줄루말로 이 꽃의 이름 하나는 눈의 약이라는 뜻입니다. | south-africa | traditional | history | repeated | [Scabiosa columbaria (PlantZAfrica · SANBI)](https://pza.sanbi.org/scabiosa-columbaria) | garden |
| 56 | story-scabiosa-matsumushiso | 벌레 이름을 단 꽃 | 이 꽃의 일본 이름은 벌레 이름에서 왔습니다. 그런데 그 벌레 이름도 그 사이 바뀌었어요. | japan | traditional | history | **varies** | [マツムシソウ (国立科学博物館)](https://www.kahaku.go.jp/research/db/botany/wild_p100/autumn/06_matukusisou.html) | museum |
| 57 | story-bouvardia-kings-physician | 왕의 주치의 이름을 단 꽃 | 이 꽃 이름의 주인은 루이 13세의 주치의이자 왕립정원 책임자였습니다. | france | 17c | history | **varies** | [About Bouvardia (House of Bouvardia)](https://houseofbouvardia.com/about-bouvardia/) | other |
| 58 | story-bouvardia-ezpathli | 1552년 사본이 전거로 걸린 꽃 | 1552년 아스테카 약초 사본이 지금도 이 꽃의 전거로 걸려 있습니다. | mexico | 16c | history | repeated | [Trompetilla (FES Zaragoza · UNAM)](https://www.zaragoza.unam.mx/plantas-medicinales-fesz/trompetilla/) | garden |
| 59 | story-bouvardia-root-cuttings | 꽃이 한 송이도 피지 않았습니다 | 백오십 포기가 넘는 그 밭에는 겹꽃이 한 송이도 없었습니다. | usa | 19c | history | repeated | [The Double Bouvardia — The Gardener's Monthly V25](https://chestofbooks.com/gardening-horticulture/Gardener-Monthly-V25/The-Double-Bouvardia.html) | book-pd |
| 60 | story-bouvardia-hummingbird-beaks | 부리가 짧은 쪽이 이겼습니다 | 벌새 다섯 종이 찾아왔는데, 씨를 더 많이 맺게 한 쪽은 부리가 짧은 벌새였습니다. | mexico | modern | history | single_source | [Transporte diferencial de polen por colibríes en una planta distílica (Huitzil 2012)](https://classic.scielo.org.mx/scieloOrg/php/articleXML.php?pid=S1870-74592012000100012&lang=en) | paper |
| 61 | story-bouvardia-kanchoji | 일본에서 부르는 다른 이름 | 절화로 팔리던 이 꽃이 요즘 일본에서는 작은 화분으로도 나옵니다. | japan | modern | history | single_source | [ブバルディア｜日本大百科全書 (コトバンク)](https://kotobank.jp/word/%E3%81%B6%E3%81%B0%E3%82%8B%E3%81%A7%E3%81%84%E3%81%82-3167824) | wiki |

---

## 4. 종 동정 함정 — 이 배치의 최대 위험

### 4-1. 함정 자체를 이야기의 몸통으로 쓴 행 — 9편

| # | flower_id | 헷갈리는 짝 | 본문 처리 |
|---|---|---|---|
| 23 | mimosa | **꽃집의 미모사(*Acacia dealbata*) ↔ 신경초(*Mimosa pudica*) ↔ 미국의 mimosa tree(자귀나무 *Albizia julibrissin*)** | 세 식물이 한 이름을 쓰게 된 경위를 통째로 한 편으로 세웠다. 아카시아가 유럽에 갔을 때 잎이 신경초와 닮아 미모사로 불리게 됐다는 설명이 일본 자료에 있고, 미국 쪽 오용은 NC State 로 교차 확인 |
| 25 | mimosa | **꽃집의 미모사(*A. dealbata*) ↔ 오스트레일리아 국화 골든와틀(*A. pycnantha*)** | 같은 속의 다른 종이고 기념일도 3월이 아니라 9월 1일이라는 점까지 본문에 적었다 |
| 42 | azalea | **진달래(*R. mucronulatum*, 참꽃) ↔ 철쭉(개꽃)** | 참·개 접두사의 기준이 먹을 수 있느냐였다는 것과, 꽃이 잎보다 먼저 피느냐로 갈라 보는 법을 본문 한가운데 두었다 |
| 45 | azalea | **우리 진달래 ↔ 미친 꿀의 원인 종(*R. luteum*·*R. ponticum*)** | "우리 산의 진달래가 아니라 같은 속의 다른 종"이라고 본문에서 못 박았다 |
| 40 | plum-blossom | **매화(*Prunus mume*) ↔ plum(자두)** | 영어 통용명이 자두꽃인데 실제로는 살구에 가깝다는 Bean 사전의 서술을 이야기의 몸통으로 썼다 |
| 47 | statice | **폐기 속명 Statice ↔ 현 속명 Limonium (한때 Armeria 도 포함)**, 그리고 **꽃잎 ↔ 꽃받침** | 이름 둘이 다 어긋났다는 구조로 짰다. "씨레벤더"가 라벤더가 아니라는 점도 함께 |
| 52 | scabiosa | **스카비오사속 ↔ *Succisa pratensis*(옛 *Scabiosa succisa*)** | 악마의 이빨 전설의 주인공이 지금은 다른 속이라는 것을 본문 끝에서 밝혔다 |
| 53 | scabiosa | 같은 짝(*Succisa*) | `editorial_note` 에 다시 명시. 나비의 먹이도 "유일한"이 아니라 "주된"으로 적었다 |
| 10 | anthurium | **불염포(변형된 잎) ↔ 꽃잎** | 빨간 판이 잎이고 진짜 꽃은 육수꽃차례에 붙어 있다는 사실 자체가 이야기 |

추가로 본문 안에 한 줄씩 넣은 소소한 함정: 알스트로메리아 ↔ 백합(#6), 리모니움 비콜로르 ↔ 꽃집의 *L. sinuatum*(#46), *L. carolinianum* ↔ *L. sinuatum*(#48), *Scabiosa japonica* ↔ 원예종(#56), 야생 *Bouvardia ternifolia* ↔ 교배 품종군(#60), 치자의 노란 크로신 ↔ 파란 제니핀 계열(#35), 남조 유송 ↔ 960년 이후의 송(#38), 두견새 ↔ 두견화(#41).

### 4-2. `birth_stories.csv` 와의 소재 대조

이름이 겹치는 5종의 기존 항목을 착수 전에 전수 열람하고 **금지 목록**으로 배포했다.

| birth_stories 이름 | 이미 쓰인 소재 | 이번 배치의 처리 |
|---|---|---|
| 미모사 | `bstory-mimosa-de-mairan-cupboard`(1729년 찬장 속 생체시계) · `bstory-mimosa-gagliano-drop-training`(낙하 습관화 실험) | **둘 다 *Mimosa pudica*(신경초) 이야기다.** 우리 `mimosa` 는 *Acacia dealbata* 라 소재가 원천적으로 겹치지 않는다. 오히려 이 어긋남 자체를 #23 으로 세웠다 |
| 치자나무 | `bstory-gardenia-billie-holiday-burn` · `bstory-gardenia-alexander-garden-name`(케이프 재스민·속명 유래) | 명명 계열을 통째로 피하고 **한자 어원(#32)·일본 이름(#33)·조선 염료(#34)·FDA 2025(#35)** 로 갔다 |
| 진달래 | `bstory-azalea-dugyeonju`(면천 두견주) · `bstory-azalea-hwajeon`(화전놀이) | 두 항목 모두 술·음식 계열이다. 이번엔 **전설(#41)·이름 구분(#42)·서지(#43)·원예(#44)·독성(#45)** 으로 갈랐다. #41 은 기존 두견주 항목이 "두견화라 부른 데서 온 이름"이라고만 스쳤을 뿐 전설 자체를 다루지 않아 중복이 아니다 |
| 매화 | `bstory-mume-lin-bu-plum-wife`(임포 매처학자) · `bstory-mume-tobiume-dazaifu`(도비우메) | 중국 은일 계열과 일본 전설 계열을 피했다. **#37 은 무대가 같은 다자이후**지만 소재는 730년 매화 잔치와 2019년 연호라 전혀 다르다 — 본문에서 미치자네·비매를 일절 끌어오지 않았다 |
| 목화 | `bstory-cotton-munikjeom`(문익점·붓 뚜껑 허구 지적) · `bstory-cotton-herodotus`(역사 3권 106절) · `bstory-cotton-gin-1794`(조면기 특허) | 세 소재 전부 회피. **#26 은 헨리 리가 전설의 뿌리를 헤로도토스까지 끌어올리지만, 우리 본문은 맨더빌과 슬론에서 시작해 헤로도토스를 아예 언급하지 않는다.** #29 는 문익점이 아니라 조선 전기 화폐사로 갔다 |

---

## 5. 판단이 갈린 지점

### 5-1. 자랑할 만한 이야기 3편

1. **#21 등사기로 밀어 만든 꽃** (`story-mimosa-wax-stencil`) — 1946년 3월 8일 팔라초 주스티니아니. 카네이션은 노동절 것이라 빼고 아네모네는 비싸서 빼고 남은 꽃이 미모사였다는 회의록 같은 서술로 시작해, **마리사 로다노가 철필로 밀랍 원지를 긁어 꽃가지를 직접 그리고 그 원지로 회람을 등사했다**는 물성 있는 장면을 지나, **"미모사 다발은 압수당했고 여성들은 길에서 붙들렸다"**로 끝난다. 지금은 아무 데서나 파는 꽃 한 다발이 처음 거리로 나갔을 때의 온도가 그대로 남아 있다.
2. **#59 꽃이 한 송이도 피지 않았습니다** (`story-bouvardia-root-cuttings`) — 19세기 원예 잡지 독자 편지 한 통이 전부인데 구조가 완벽하다. 150~200 포기짜리 겹부바르디아 밭을 봤는데 **겹꽃이 한 송이도 없었다**는 관찰, 그리고 "내가 처음 이 품종을 살 때 파는 쪽에서 **뿌리꺾꽂이로는 기르지 마시오, 홑꽃이 나옵니다**라고 적은 카드를 끼워 보냈다"는 마무리. 백사십 년 전 사람이 남긴 "그러게 내가 뭐랬어"다.
3. **#15 수도를 옮기려던 계획을 접게 만든 나무** (`story-eucalyptus-menelik-capital`) — 1900년 메넬리크 2세가 땔감이 없어 수도를 55km 서쪽으로 옮기려 했고 황후 타이투가 그곳에 **아디스알렘(새 세상)**이라는 이름까지 붙였는데, **나무가 너무 빨리 자라서 이듬해 계획을 접었다.** 한 나라의 도시 계획이 식물의 생장 속도에 졌다는 이야기이고, 같은 글이 곧바로 "다만 이 나무는 강과 우물을 마르게 했다"고 덧붙이는 균형까지 있다.

**아깝게 3위 밖:** #13 표본 대지 일곱 장에 나눠 붙인 10만 번째 채집, #26 줄에 매인 채 풀을 다 뜯으면 죽는다는 식물양, #35 노란 물감이던 열매가 2025년 미국의 파란 색소가 된 일, #29 화폐의 올 수를 곤장 백 대로 단속한 조선.

### 5-2. `alstroemeria` 가 4편에 그친 이유

목표는 5편이었고 다섯 번째 후보를 세 갈래로 팠지만 전부 접었다.

- **린네가 씨앗을 침실 창가에서 겨울을 나게 했다**는 널리 도는 일화 — 어느 1차 자료에서도 확인하지 못했다. Linnean Correspondence·Uppsala 계열은 전부 열지 못했다.
- **네덜란드 육종사**(van Staaveren 1963 시작, 1980년대까지 190품종, "Butterfly type") — 근거로 쓸 수 있는 것이 바헤닝언대 학위논문 PDF뿐인데 **본문이 파싱되지 않았다.** 검색 스니펫만으로는 싣지 않았다.
- **칠레 원산 종에서 만든 외국 품종이 수입품으로 칠레에 되돌아온다**는 아이러니 — 문장 자체를 실제 페이지에서 확인하지 못했다(IntechOpen 챕터는 네덜란드·영국·미국·일본에서 품종이 개발됐다는 사실까지만 적는다).

4편은 최소 기준을 채우므로 **근거 약한 다섯 번째를 넣는 대신 4편으로 뒀다.** 다음 라운드 재고는 §6-4에 남겼다.

### 5-3. 라벨 판정이 갈린 곳

- **#17 유칼립투스 명명 연도** — The Conversation 은 **1788년**, 통설은 **1789년**이다. EUCLID(CSIRO) 가 403 이라 확정하지 못해 **본문에는 "1780년대 말"로만 적고 `varies`** 로 뒀다. 널리 인용되는 채집자 **데이비드 넬슨**도 출처에 없어 뺐다.
- **#20 미모사를 누가 골랐나** — 네 개의 이탈리아 자료가 서로 다른 답을 낸다. Il Post 는 마테이·노체·몬타냐나, ANSA 2016 은 마테이와 로다노, ANSA 2025 는 로다노, ANPI 는 롱고·넨니를 포함한 세 판본을 병렬한다. 밀려난 꽃도 제비꽃/카네이션/아네모네로 갈린다. **본문에서 제안자를 특정하지 않고 `varies`.**
- **#39 대만 국화 연도** — 원문 표기는 `民國53年7月21日`이다. **자동 요약이 이것을 1953년으로 잘못 옮긴 것을 잡아냈다**(민국 53년 = 서기 1964년). 본문에는 민국 연호와 서기를 나란히 적었다.
- **#29 조선 악포 처벌** — 조사 초안은 "초범부터 전 가족 변방 이주"였는데, **우리역사넷 원문을 직접 열어 보니 "초범이면 장 100·도 3년, 재범이면 전가를 변방으로"였다.** 본문을 원문대로 고쳤다.
- **#16 켄추리온 높이** — 널리 도는 2008년 99.6m 실측, 2018년 레이저 재측, 수관 고사 후 96m 는 **전부 1차 출처를 못 찾았다.** 태즈메이니아주 정부가 적은 **100.5m** 한 값만 쓰고 `single_source`.
- **#36 퇴계 유언** — 국가유산청·조폐공사 어느 쪽도 1차 사료를 인용하지 않는다. 김성일 「선생연보」라는 전거 주장은 스니펫뿐이었다. **"전해져요"로 적고 `varies`.** 단양 관기 두향 이야기는 사료를 못 찾아 통째로 뺐다.
- **#57 부바르 생애** — 프랑스 의학사 자료가 파리 학위 연도를 **1696년**으로 적는데 사망 연도(1658)와 모순된다(1596의 오식으로 보인다). **그 연도만 빼고** 나머지를 썼다. 속명 발표자와 연도(솔즈베리 1805/1806/1807 설이 갈림)는 POWO 가 403 이라 적지 않았다.

---

## 6. 버린 후보와 사유

### 6-1. 열람 실패로 제외 (봇 차단과 죽은 링크를 구분해 기록)

**403 봇 차단** — apsnet.org, kew.org(난 씨앗 페이지), EUCLID/lucidcentral(CSIRO), 미시간대 *Collected Works of Lincoln*, 미 의회도서관 Lincoln Papers, UC Davis Postharvest(eucalyptus·bouvardia 두 건), CIFOR-ICRAF PDF, Butterfly Conservation, UK Butterflies, POWO(Kew, 세 건), MDPI, wildflower.org, Oregon State Landscape Plants, Merriam-Webster·Collins·FreeDictionary, floraldaily.com. **사람 브라우저로는 열리는 페이지들이라 죽은 링크와 구분해 적어 둔다.**

**402 유료벽** — Wiley *The Scientific World Journal* 에티오피아 유칼립투스 논문 2편.

**404·연결 실패** — fda.gov 보도자료 원문(FDA 자체 배포본으로 우회 성공), abrahamlincolnonline.org, teachingamericanhistory.org, alcotexa.org, housedivided.dickinson.edu(호스트 자체가 응답 없음), zdic.net 梔子, 국립민속박물관 소장품 페이지, naturaldyeing.or.kr(세션 가드), NC State 의 *Bouvardia ternifolia* 경로.

**200 이지만 본문을 못 얻음** — CTAHR 하와이 안스리움 사이트(로그인 벽), 바헤닝언대 알스트로메리아 학위논문 PDF, humboldtorchids 난 종자 챕터 PDF, MDedge 튤리팔린 A PDF, ActaScientific 에티오피아 PDF, 일본 MAFF 스타티스 PDF, 우드리플랜츠(코넬) PDF, 국립역사민속박물관 PDF — **PDF 8건이 전부 바이너리로만 내려왔다.** 그 밖에 etymonline·pmc.gov.au(JS 셸), ctext.org 태평어람(목차만), indonesia.go.id(본문 미로딩), 메트로폴리탄 미술관(429 두 번), archive.org(도구 차단).

**URL 을 못 연 후보는 한 건도 싣지 않았다.**

### 6-2. 내용 미확증으로 제외

- **블루메가 쌍안경으로 나비 떼를 보고 착각해 호접란을 명명했다** — 가장 널리 도는 일화인데 1차 자료가 없다. AOS 는 "열대 밀림의 흰 나방을 닮았다고 여겨"까지만 적는다. #1 에서 뺐다.
- **천연 치자 앱솔뤼트는 세상에 존재하지 않는다** — 이 문장을 실은 유일한 페이지가 향수 브랜드 블로그였다. 콜롬비아 앙플뢰라주, 스티랄릴아세테이트/Gardenol 이야기도 스니펫뿐. 치자 향수 이야기 자체를 접었다.
- **『본초강목』이 梔←卮 를 풀이했다** — 통설인데, 실제로 연 대만 농업부 페이지가 드는 책은 『신농본초경』이다. 본문도 그렇게 적었다.
- **치자 전래 1,500년설** — 『삼국유사』 담복 기록을 근거로 드는 칼럼이 있으나 원문을 확인하지 못했다. 백과사전의 "약 500년 전"과 충돌해 **전래 시기를 아예 적지 않았다.**
- **『만엽집』 매화 118수 대 벚꽃 42수** — 기관 자료를 하나도 못 찾았다. 실제로 연 유일한 페이지는 취미 사이트다. **수치를 통째로 뺐다.**
- **R. mucronulatum 의 명명자(Turczaninow 1837)와 브레치나이더의 1882년 아널드수목원 도입** — POWO 403, Trees and Shrubs Online 본문 절단. 'Cornell Pink' 의 선발 연도와 한국산 종자 여부도 확인 못 했다.
- **철쭉 그레이아노톡신 중독 사고를 다룬 한국 정부 자료** — 식약처 문서는 꿀 오염 맥락의 속 단위 언급뿐이고, **국립수목원 웹진은 오히려 철쭉을 약용으로 소개하며 독성 경고가 없다.** #42 는 "먹지 않는다"는 민속적 구분까지만 쓰고 독소 이름을 넣지 않았다. (독소는 튀르키예 사례인 #45 에서 학술 논문 근거로만 다뤘다.)
- **그라스의 미모사 앱솔뤼**, 망들리외 축제의 12톤, 1929년 2월 한파, 원예가 **질베르 나보낭** — 관광청 페이지는 다른 사람(**클레망 나르보노**)을 적는다. 전부 뺐다.
- **이집트 목화의 카이로 정원 발견 일화**(마호 베이 엘 오르팔리) — 그 대목을 실은 페이지가 404. 이집트 이야기 자체를 이번엔 넣지 않았다.
- **스카비오사 아트로푸르푸레아의 이베리아 무덤 헌화 관습**, **Scabiosa stellata 마른 씨방** — 상업 사이트와 취미 블로그뿐.
- **부바르디아의 메이지 도래설과 한자 寒丁字**, **품종 'Bridal Bouquet'**, **"에틸렌에 극도로 민감해 STS 필수"** — 셋 다 확인 실패. #61·#57 에서 각각 뺐거나 약하게 적었다.
- **에티오피아 유칼립투스 식재 면적**(506,000ha 등) — 출처가 전부 유료벽 논문으로 소급된다.

### 6-3. 정책 판단으로 제외

- **청탁금지법 가액 기준(경조사비 5만 원·화환 10만 원 등)** — 사실이지만 **화면에 법률 조언처럼 읽힐 위험**이 있어 #5 에서는 시장 통계만 쓰고 금액 기준을 넣지 않았다.
- **1898년 약전의 적응증**(#48)과 **SANBI 의 전통 용례**(#55), **UNAM 의 민간 용법**(#58) — 전부 "이렇게 썼다는 기록"으로만 적고 효능을 주장하지 않았다. 부바르딘은 연구용 화합물이라는 단서를 `editorial_note` 에 남겼다.
- **WSJ 2013년 대만 난초 기사**(1978년 10만 달러 난초 → 로우스 5.48달러) — 이야기로는 이번 배치 최고 수준인데, 열 수 있는 것이 **원문을 통째로 전재한 블로그**뿐이었다. 저작권 위험을 피해 대만 정부 발행 매체(#4)로 갈아탔다.

### 6-4. 다음 라운드용 재고 (전부 본문 확인 완료, 미적재)

- `eucalyptus` — 중국 남부 유칼립투스 조림 **547만 ha(2019년, 2010년 368만 → 2015년 454만)**와 "생태적 황무지" 논쟁, 물이 검어졌다는 현지 증언 (Mongabay)
- `eucalyptus` — 켄추리온을 2019년 리보 로드 산불에서 지키려 **밑동 둘레 20m 의 가연물을 걷어낸** 소방 작업, "저만한 생명체는 이상 징후가 늦게 나타난다"는 트리 프로젝트 대표의 말 (The Examiner)
- `eucalyptus` — 1867년 폰 뮐러가 인용한 **480피트(146.3m)** 측정 기록과 반 펠트의 회의론, 1880년 벌채된 **소프데일 나무 114.3m** (Guinness World Records)
- `eucalyptus` — 코알라의 하루 잎 200~500g, 맹장 200cm, 수면 18~22시간; 새끼가 먹는 **팹(pap)** 의 타닌 분해 장내세균이 어미 똥보다 23~41배 (Australian Koala Foundation / Aust. J. Zoology 1993)
- `cotton` — 우즈베키스탄 목화 수확에 해마다 **약 200만 명**이 동원되고, 2020년 수확에서 **96% 이상이 자유의사로** 일했으며 강제 비율이 전년보다 33% 낮아졌다는 ILO 모니터링
- `cotton` — 목화가 **서로 만난 적 없는 네 문명에서 각각 따로 작물화**됐고, 신대륙 4배체는 100만~200만 년 전 구대륙 A 게놈과 신대륙 D 게놈이 만나 생겼다는 것 (PMC8132148)
- `statice` — 이스라엘 단치거의 리모니움 식물특허 **USPP16517P3**: 개방 수분에서 나왔고 **부계가 미상**이라고 특허 문서가 적어 둔 품종. 벌이 육종한 셈
- `statice` — 영국 매트 씨레벤더(*L. bellidifolium*)가 **19세기에 케임브리지셔에서, 1975년경 링컨셔 지브롤터포인트에서 사라지고** 지금은 노퍽에만 남았다는 BSBI 기록
- `bouvardia` — 네덜란드 로엘로파렌츠베인의 부바르디아 특허 **USPP12848P2**(1990년 교배 → 1999년 출원 → 2002년 등록)와 4배체 육종
- `alstroemeria` — §5-2 의 세 후보. 특히 네덜란드 육종사는 **바헤닝언 학위논문 텍스트만 확보되면** 바로 쓸 수 있다
- `plum-blossom` — 안민영 「매화사」: 1870년 겨울 박효관의 운애산방에서 지은 **8수 연시조**, 『금옥총부』 수록 (한국민족문화대백과사전)
- `plum-blossom` — V&A 소장 강희 연간 청화백자 항아리(C.819&A-1910): 깨진 얼음 바탕 위의 매화 문양인데 유럽 수집계가 이를 **산사나무로 오인해 'hawthorn jar'** 라 불렀다
- `azalea` — 강화 고려산 진달래 군락(북쪽 능선 400m 이상)과 연개소문·오련지 전설 ⚠ 같은 페이지가 화전을 언급하므로 그쪽으로 새면 birth_stories 와 중복
- `gardenia` — 치자 향의 휘발 성분 40종과 β-오시멘·리날로올 조성, 향을 맡은 집단의 수축기혈압 3.8~4.6mmHg 하락 (*Scientific Reports* 15:4194, 2025)

---

## 7. 게이트 결과

### 7-1. `npm run seed`

```
npm run seed
  flowers.csv 59행 · stories.csv 438행 (합계 2088행)
  [OK] flower_id 참조 무결성 — 참조 1190건 모두 flowers.csv 안에 있음 — 59종
  [OK] 반려동물 안전성 커버리지 (cat·dog 전수)
  [OK] 공유 어휘 일치 — stories 438행 모두 어휘 안에 있음
  [OK] 탄생화 이야기 → 표의 이름 · story_id 공간 — stories.csv 438편과 id 충돌 0
  결과: 통과 (오류 0건)          exit 0
```

`flowers.csv` 를 맡은 워커가 12종을 먼저 채워 둔 덕에 **참조 오류 없이 통과**했다.

### 7-2. 자체 검증 (스크립트 대조)

| 검사 | 결과 |
|---|---|
| `story_id` 중복 (stories.csv 내부) | **0건** |
| `story_id` 충돌 (birth_stories.csv 407편과) | **0건** |
| `source_url` 누락 | **0건** (`story_type=original` 도 0편) |
| `hook` 누락 | **0건** |
| 신규 61건 URL 재검 | **61/61 생존.** 2건이 자동 점검에서 걸렸으나 죽은 링크가 아니었다 — 과학산업박물관(#27)은 **403 봇 차단**, 미주리 식물원 Plant Finder(#47)는 **Node 기본 CA 의 TLS 검증 실패**. 둘 다 렌더링 페치로 본문을 다시 읽어 확인했다 |
| 화면 문자열의 스펙·개발 어휘 | `hook` **0건**(§1.5n `OFFICE_WORDS` 대조). `story_ko` 에 남은 `기준`·`항목` 6건은 "속의 기준이 되는 종", "기준인 35척", "표제 항목"처럼 전부 일상어 용법이다 |
| 본문 문체 | `story_ko` 61편 전부 해요체. 유일한 예외 #59 의 마지막 문장("뿌리꺾꽂이로는 기르지 마시오, 홑꽃이 나옵니다")은 **1880년대 카드 문구를 옮긴 인용**이라 일부러 남겼다 |
| 평균 길이 | `story_ko` 297자 (배치 1은 351자) |

### 7-3. 테스트 — 이야기 트랙이 원인인 실패 0건

`npm test` 는 **12건이 실패하지만 전부 다른 워커의 파일(flowers 47→59, pet_safety 94→118, 사진 자산)이 원인**이다. 이야기 데이터가 원인인 실패는 없다.

⚠ **`tests/` 는 이 워커의 소유가 아니라 손대지 않았다.** 아래 두 파일을 누군가 갱신해야 한다 — `tests/data/catalog.test.ts` 는 꽃 수와 이야기 수를 **한 파일에서 둘 다 단언**하므로 동시 편집 충돌을 피하려면 한 사람이 몰아서 고치는 편이 좋다.

| 파일 | 줄 | 지금 | 바꿀 값 | 소유 |
|---|---|---|---|---|
| `tests/data/catalog.test.ts` | 20 | `const EXPECTED_STORIES = 377;` | **438** | 이야기 트랙 |
| `tests/data/catalog.test.ts` | 19 부근 | 꽃 47 단언 | 59 | 기본 데이터 트랙 |
| `tests/seed/schemas.test.ts` | — | `flowers 47, pet_safety 94` | 59 / 118 | 기본 데이터 트랙 |
| `tests/components/landing-today-reason.test.ts` | 95 · 249 · 258 | 주석·테스트 이름의 `377편` 표기 3곳 | **438편** (실제 수치는 그대로: `기준` 든 훅 **2편**, 따옴표 섞인 훅 **26편**, 마침표로 끝나는 훅 **333편**) | 이야기 트랙 |

> 훅 통계가 바뀐 이유: 신규 61편 중 마침표로 끝나는 것이 61편이라 272 → 333 이 된다. `기준` 든 훅은 조사 중 신규 1편이 걸려 **`잣대` 로 고쳐** 기존 2편을 유지했다.

### 7-4. 후속 과제

- **`romantic` 3편** — 6종 mood 중 가장 얇다. 이번 12종은 관엽(호접란·안스리움)·건조화(스타티스)·수목(유칼립투스·미모사)이 절반이라 연애 전승 자체가 드물었다. #22(겨울을 데워 꽃을 피우는 방), #38(이마의 매화 화장), #54(모닝 브라이드)가 그 자리를 지탱한다.
- **`apology` 1편** — 배치 1의 후속 과제였고 이번에 처음 붙였지만(#41), 여전히 데이터셋 전체에서 가장 얇다. **억지로 태그를 늘리지 않았다.** 사과 자리에 놓을 이야기는 소재를 노려서 따로 조사하는 편이 낫다.
- **`just_because` 47편(77%)** — 폴백 태그가 과반을 훌쩍 넘는다. 선별기가 상황별로 다른 이야기를 꺼내려면 다음 라운드에서 intent 배분을 의도적으로 설계할 필요가 있다.
- **`alstroemeria` 4편** — 다섯 번째 후보 세 갈래를 §5-2·§6-4 에 남겼다. 바헤닝언 학위논문 텍스트만 확보되면 바로 채울 수 있다.
- **PDF 8건이 파싱되지 않았다** — 이번 라운드에서 놓친 근거의 상당수가 여기서 나왔다(에티오피아 면적, 알스트로메리아 육종사, 튤리팔린 A 원문, 일본 스타티스 통계). PDF 텍스트 추출 수단이 있으면 다음 라운드의 수율이 눈에 띄게 올라간다.
