# 꽃 이야기 리서치 4차 — 해외 이야기 대폭 확장, 문화권 다변화 (story-research-4)

## 1. 조사 개요

- **조사일**: 2026-08-15
- **주문**: "해외 이야기를 더 많이 가져왔으면 좋겠어 — 꽃과 관련된 설화, 에피소드 등등"
- **수집 이야기**: **67편** (목표 60편 초과 달성)
- **적재 결과**: `content/stories.csv` **250행 → 317행**
- **데이지(daisy) 커버**: **8편** (요구 4편 이상 충족). 이번 라운드에 신설된 꽃이라 이야기가 0편이었던 자리를 한 번에 채웠습니다.
- **기존 250편과의 중복**: **0건**. 조사 착수 전에 꽃별 `story_id` 목록 전체를 조사자에게 배포해 같은 소재를 원천 차단했고, 적재 후 기계 대조로 `story_id` 중복 0건을 확인했습니다.
- **모든 `source_url`은 실제로 열어 본문을 확인**했습니다. 열람 실패(403·429·SSL 오류·본문 미로딩)한 후보는 본문에서 전부 빼고 §6에 사유와 함께 남겼습니다.

### 1-1. 이번 라운드가 노린 것

1·2차는 영문 위키피디아 의존이 컸고, 3차는 **한국 소비 장면**을 깊게 팠습니다. 그 결과 250편 중 `korea` 계열이 37편으로 최대 문화권이 되었고, 나머지 해외분은 그리스·로마 신화와 네덜란드 튤립에 몰려 있었습니다. 4차는 그 반대편을 팠습니다.

1. **그리스·로마 바깥으로.** 켈트·북유럽·발트·슬라브·발칸·코카서스·페르시아·오스만·아랍·인도·동남아·아프리카·중남미·아메리카 원주민까지 **41개 문화권 값**을 새로 채웠습니다. 이 중 **신규 문화권 값이 22종**입니다 (`norse` `latvia` `wales` `finland` `northern-ireland` `serbia` `croatia` `bulgaria` `georgia` `saudi-arabia` `iran` `levant` `arab` `mughal-india` `indonesia` `vietnam` `philippines` `ethiopia` `mexico` `ecuador` `tanzania` `aztec` — `russia-usa` 포함하면 23종).
2. **도파민 우선.** 신뢰성 최상급보다 **이야기로서 매력**을 먼저 봤습니다. 반전이 있거나(웨일스의 상징은 원래 부추였다), 숫자가 이상하거나(밀리리터까지 정해진 장미수), 뭉클하거나(무너진 성당에서 여덟 주 뒤 스물다섯 개의 순). 대신 그 매력의 대가로 사실을 부풀리지는 않았고, 갈리는 대목은 `varies`·`single_source`로 정직하게 내렸습니다.
3. **소스 갈아엎기 재확인.** 신규 67편 중 **위키 1편(1.5%)**. 3차의 7.3%보다 더 내려갔습니다.

### 1-2. 저작권 처리 원칙 (1~3차와 동일)

- **타 사이트 문장을 옮긴 곳은 한 군데도 없습니다.** `story_ko` 는 전부 사실관계만 참고해 새로 쓴 우리 문장입니다(한국어, 다정한 존댓말 이야기 톤, 평균 357자).
- 설화·역사적 사실 자체는 아이디어라 저작권 대상이 아닙니다. 표현만 새로 쓰면 자유롭게 쓸 수 있습니다.
- 원문 인용이 필요한 대목은 **퍼블릭 도메인 자료**(1929년 이전 출판물·Project Gutenberg·Internet Archive)에 한해서만, 그리고 **직접 인용부호 없이 우리말로 옮겨** 실었습니다 — 초서 『선녀 열전』(14c), 스노리 『산문 에다』(13c), 도러시 워즈워스 『그래스미어 일기』(1802), 디킨슨 마스터 레터(1861), 구양수 『낙양모란기』(11c).
- **confidence 라벨** (1~3차와 동일 기준)
  - `repeated` — 여러 독립 출처에서 반복 확인되는 정설/사실
  - `varies` — 전승은 널리 알려졌으나 버전이 갈리거나 출처가 한 계열에 몰림
  - `single_source` — 출처가 하나뿐

---

## 2. 이번 라운드 지표

### 2-1. source_kind 분포 — 위키 1.5%

| source_kind | 뜻 | 편수 | 비중 |
|---|---|---|---|
| `magazine` | 잡지·칼럼·전문 매체 | 16 | 23.9% |
| `museum` | 박물관·국가기록원·공공기관 자료 | 14 | 20.9% |
| `newspaper` | 신문 | 14 | 20.9% |
| `garden` | 식물원·대학 익스텐션·농업/원예 기관 | 9 | 13.4% |
| `book-pd` | 퍼블릭 도메인 고서 원문 | 5 | 7.5% |
| `other` | 위 어디에도 넣기 어려운 것 | 4 | 6.0% |
| `paper` | 학술 논문 | 4 | 6.0% |
| `wiki` | 위키·백과사전·사전 | 1 | 1.5% |
| **합계** | | **67** | **100%** |

> **`wiki` 1편의 정체를 밝혀 둡니다.** #54 `story-iris-oceloxochitl-jaguar` 의 출처인 Nahuatl Dictionary(오리건대 Wired Humanities Projects)는 학술 나우아어 사전입니다. 위키피디아가 아니라 대학이 운영하는 편찬 사전이지만, SOURCE_KINDS 주석이 `wiki` 를 "위키·백과사전·**정리 사이트**"로 정의하고 3차 라운드가 한국민족문화대백과사전을 `wiki` 로 분류한 선례가 있어 같은 기준을 적용했습니다. **영문 위키피디아 직접 인용은 이번 라운드에 0편입니다.**
>
> 전체 317편 기준 `wiki` 는 165편(52.1%)으로 여전히 높지만, 이는 1·2차 유산입니다. 3차 이후 신규분(55+67=122편) 중 위키는 5편(4.1%)입니다.

### 2-2. 문화권 분포 (41종)

| 문화권 묶음 | 편수 | culture_region 값 |
|---|---|---|
| 켈트·북유럽·발트 | 12 | `scotland`(4) `ireland`(3) `norse` `latvia` `wales` `finland` `northern-ireland` |
| 슬라브·발칸·코카서스 | 9 | `poland`(2) `russia`(2) `serbia` `ukraine` `croatia` `bulgaria` `georgia` `russia-usa` |
| 페르시아·오스만·아랍·인도 | 12 | `india`(3) `mughal-india`(2) `turkey`(2) `arab`(2) `saudi-arabia` `iran` `levant` |
| 동아시아·동남아 | 12 | `japan`(4) `china`(3) `thailand`(2) `indonesia` `vietnam` `philippines` |
| 아프리카·중남미·아메리카 원주민 | 10 | `colombia`(2) `aztec`(2) `ethiopia` `north-america` `mexico` `ecuador` `south-africa` `tanzania` |
| 빅토리아·서구 인물 실화 | 12 | `england`(4) `usa`(3) `germany`(2) `uk` `france` |
| **합계** | **67** | **41종** |

### 2-3. 꽃별 증가 (25종)

| 꽃 | 이번 | 기존 | 합계 |
|---|---|---|---|
| daisy | **8** | 0 | 8 |
| rose-red | 6 | 17 | 23 |
| marigold | 5 | 4 | 9 |
| iris | 4 | 5 | 9 |
| carnation | 4 | 9 | 13 |
| narcissus | 3 | 5 | 8 |
| corn-poppy | 3 | 5 | 8 |
| peony | 3 | 12 | 15 |
| jasmine | 3 | 4 | 7 |
| violet | 3 | 4 | 7 |
| magnolia | 3 | 4 | 7 |
| lily-of-the-valley / forget-me-not / lavender / sunflower / lily-asiatic / chrysanthemum / camellia / hydrangea | 각 2 | — | — |
| pansy / hellebore / tulip-white / cherry-blossom / poinsettia / gerbera | 각 1 | — | — |

**얇았던 꽃이 두꺼워졌습니다.** 250편 시점에 4편뿐이던 `marigold`·`violet`·`magnolia`·`jasmine`·`forget-me-not`·`pansy` 가 이번 라운드의 주요 수혜자입니다.

### 2-4. story_type / confidence / mood / intent

| story_type | 편수 | | confidence | 편수 |
|---|---|---|---|---|
| `history` | 49 | | `repeated` | 53 |
| `folklore` | 11 | | `varies` | 9 |
| `literary` | 7 | | `single_source` | 5 |
| `original` | 0 | | | |

`original`(창작)은 0편입니다. **이번 라운드에 지어낸 이야기는 없습니다.**

| mood | 편수 | | intent | 편수 |
|---|---|---|---|---|
| healing | 41 | | just_because | 40 |
| dramatic | 28 | | comfort | 12 |
| funny | **18** | | gratitude | 8 |
| tragic | 16 | | celebration | 7 |
| mythic | 16 | | confession | 6 |
| romantic | 14 | | anniversary | 4 |
| | | | apology | 1 |

3차 라운드 회고에서 "다음 라운드는 의도적으로 유쾌한 소재를 노리자"고 적어 둔 것을 반영해 `funny` 를 18편까지 끌어올렸습니다(3차는 2편). 6종 mood, 7종 intent 전부 커버.

---

## 3. 이야기 표

> 컬럼: `# | story_id | flower_id | 제목 | hook | culture_region | era | story_type | confidence | source_title | source_url | source_kind`
> `story_ko` 본문은 `content/stories.csv` 에 그대로 실려 있어 여기서는 생략하고, 대신 **판정 근거**를 각 절 끝에 모았습니다.
> `intents` 가 비어 있으면 전천후로 붙일 수 있다는 뜻입니다(#3 한 건).

### 3-1. 켈트·북유럽·발트 — 12편

| # | story_id | flower_id | 제목 | hook | culture_region | era | type | conf | source | source_kind |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | story-daisy-burns-plough-1786 | daisy | 밭을 갈다 꽃 한 송이를 뭉갠 날 | 밭을 갈다 데이지 한 송이를 뭉갠 미안함이, 시 한 편이 되었습니다. | scotland | 1780s | literary | repeated | [To a Mountain Daisy — Robert Burns (Scottish Poetry Library)](https://www.scottishpoetrylibrary.org.uk/poem/to-a-mountain-daisy/) | museum |
| 2 | story-daisy-auld-lang-syne-gowan | daisy | 세상에서 가장 많이 불리는 노래에 데이지가 있습니다 | 지구에서 가장 많이 불리는 노래가 우정의 증거로 내미는 건, 함께 꺾은 데이지 한 줌입니다. | scotland | 1780s | literary | repeated | [The History and Words of Auld Lang Syne (Scotland.org)](https://www.scotland.org/inspiration/the-history-and-words-of-auld-lang-syne) | other |
| 3 | story-daisy-baldursbra | daisy | 신의 얼굴이 얼마나 흰지 설명하려고 | 신의 흰 얼굴을 설명할 말이 없어서, 사람들은 꽃 이름을 지어냈습니다. | norse | 13c | folklore | varies | [The Prose Edda — Gylfaginning (Project Gutenberg)](https://www.gutenberg.org/files/18947/18947-h/18947-h.htm) | book-pd |
| 4 | story-daisy-latvia-jani-wreath | daisy | 화관을 쓰고 자면 꿈에 나오는 사람 | 화관을 쓰고 자면 앞으로 만날 사람이 꿈에 나온다고 믿었습니다. | latvia | traditional | folklore | repeated | [Traditions (Latvian Institute)](https://www.latvia.eu/arts-culture/traditions/) | museum |
| 5 | story-narcissus-wales-leek-to-daffodil | narcissus | 웨일스의 상징은 원래 부추였습니다 | 나라의 상징이 채소에서 꽃으로 갈아치워진 사건이 있습니다. | wales | 1910s | history | varies | [National emblems FAQ (Amgueddfa Cymru — Museum Wales)](https://museum.wales/blog/1182/National-emblems-FAQ/) | museum |
| 6 | story-lotv-finland-vote | lily-of-the-valley | 국민 투표로 뽑은 꽃 | 나라꽃을 고르는 기준이 다들 아는 꽃이라서였습니다. | finland | modern | history | varies | [Iconic Finnish nature symbols stand out (thisisFINLAND)](https://finland.fi/life-society/iconic-finnish-nature-symbols-stand-out/) | magazine |
| 7 | story-poppy-scotland-four-petals | corn-poppy | 스코틀랜드 양귀비에는 잎이 없습니다 | 잉글랜드 양귀비에는 잎이 있고 스코틀랜드 양귀비에는 없습니다. 백 년째요. | scotland | 1920s | history | repeated | [The history of the Poppy (Lady Haig's Poppy Factory)](https://www.poppyscotland.org.uk/lady-haigs-poppy-factory/about-us/the-history-of-the-poppy) | museum |
| 8 | story-rose-roisin-dubh | rose-red | 연애시로 위장한 나라 | 검열을 피하려고 나라를 여자 이름으로 바꿔 부른 연애시가 있습니다. | ireland | 17c | literary | varies | [Róisín Dubh (Pádraig Pearse, Songs of the Irish Rebels)](https://cartlann.org/authors/padraig-pearse/songs-of-the-irish-rebels/roisin-dubh/) | book-pd |
| 9 | story-iris-ireland-flaggers | iris | 어부의 배에 실린 노란 붓꽃 | 아일랜드 신화에서 미녀의 머리색을 재는 기준은 늪가의 노란 붓꽃이었습니다. | ireland | traditional | folklore | varies | [Take on Nature: Yellow Iris (The Irish News)](https://www.irishnews.com/lifestyle/environment/2021/07/03/news/stephen-colton-s-take-on-nature-yellow-iris-a-symbol-of-grace-and-nobility-2369938/) | newspaper |
| 10 | story-marigold-beltane-threshold | marigold | 오월 전야에 문턱으로 뿌리던 노란 꽃 | 우유를 훔쳐 가는 존재로부터 소를 지키는 법: 젖에 노란 꽃을 문지릅니다. | ireland | traditional | folklore | repeated | [Take on Nature: Winking Marybuds (The Irish News)](https://www.irishnews.com/lifestyle/2016/05/07/news/take-on-nature-winking-marybuds-stir-old-rituals-506023/) | newspaper |
| 11 | story-pansy-scotland-slow-bloom | pansy | 팬지가 커지려고 북쪽으로 갔습니다 | 팬지는 천천히 피우는 추운 나라에서 가장 예뻐졌습니다. | scotland | 19c | history | single_source | [The Rise Of The Fancy Pansy (Pansies, Violas and Violets)](https://chestofbooks.com/gardening-horticulture/pansies-violas-violets/The-Rise-Of-The-Fancy-Pansy.html) | book-pd |
| 12 | story-hellebore-setterwort-cattle | hellebore | 겨울에 홀로 피는 꽃의 전직 | 겨울에 홀로 피는 우아한 이 꽃에게는 소를 다루던 전직이 있습니다. | northern-ireland | traditional | folklore | repeated | [Helleborus viridis, Flora of County Fermanagh (BSBI)](https://fermanagh.bsbi.org/helleborus-viridis-l) | garden |

**판정 근거**
- **#1·#2 `repeated`** — 번스의 두 작품 모두 원문·집필 정황이 학계 정설이고 여러 기관 자료에서 반복 확인됩니다. `literary` 판정: 이야기의 몸통이 특정 작품(시·노래)에 있습니다.
- **#3 `varies`** — 『산문 에다』의 발두르스브라 구절 자체는 원전에 명확히 있으나, **그 이름이 가리키는 식물이 정확히 무엇인지가 갈립니다**(Tripleurospermum·Matricaria·Leucanthemum 등 국화과 흰 들꽃 계열). CSV 본문에 "우리가 데이지라 부르는 무리의 친척들"로 명시했습니다.
- **#5 `varies`** — 부추 전설(성 다비드·크레시)은 전설이고, 수선화로의 교체 시점도 자료마다 폭이 있습니다. 다만 **로이드 조지의 1911년 서임식 동원은 박물관이 직접 서술**하므로 이야기의 뼈대는 안전합니다.
- **#6 `varies`** — 은방울꽃 선정 연도를 1967년으로 적는 자료가 다수 있어 연도를 본문에서 빼고 "1980~90년대 국민 투표로 정해진 상징들" 흐름 속에 넣었습니다.
- **#8 `varies`** — 1602년경이라는 연대와 붉은 휴 오도널 화자 설정은 피어스의 해설에 근거합니다. 원시 성립 연대는 학설이 갈립니다.
- **#9 `varies`** — 코크·케리 지방 관습은 채록 기반이라 지역별 편차가 있습니다. 미디르와 에딘 대목은 초기 아일랜드 문학의 정본 묘사입니다.
- **#11 `single_source`** — 퍼블릭 도메인 원예서 한 권에만 근거합니다. 다만 `source_kind=book-pd` 라 화면 문구는 "기록으로 남아 있는 이야기예요" 로 갈립니다(§1.5d 개정 규칙).

### 3-2. 슬라브·발칸·코카서스 — 9편

| # | story_id | flower_id | 제목 | hook | culture_region | era | type | conf | source | source_kind |
|---|---|---|---|---|---|---|---|---|---|---|
| 13 | story-peony-kosovo-1389 | peony | 이 꽃이 붉어진 날짜가 전해집니다 | 꽃이 붉어진 날짜가 전해지는 이야기는 흔치 않습니다. 1389년 6월 28일이에요. | serbia | 14c | folklore | repeated | [Priča o Kosovskim božurima (Koreni)](https://www.koreni.rs/prica-o-kosovskim-bozurima-povodom-632-godine-od-kosovskog-boja/) | magazine |
| 14 | story-poppy-monte-cassino-song | corn-poppy | 전투가 끝나기 전에 태어난 노래 | 노래가 완성된 시각과 전투가 끝난 시각이 거의 같았습니다. | poland | 1940s | history | repeated | [Czerwone maki – od Lwowa do Monte Cassino (Muzeum Warszawy)](https://muzeumwarszawy.pl/czerwone-maki-od-lwowa-do-wzgorza-monte-cassino/) | museum |
| 15 | story-marigold-chornobryvtsi | marigold | 파리의 화단에서 어머니를 보았습니다 | 파리 한복판의 메리골드 화단이 시골의 어머니를 불러왔습니다. | ukraine | modern | history | repeated | [Чорнобривців насіяла мати (Ukrainky)](https://ukrainky.com.ua/chornobryvcziv-nasiyala-maty-czikavi-fakty-pro-znamenytu-pisnyu/) | magazine |
| 16 | story-daisy-russia-family-day | daisy | 국가 기념일 자리에 들국화를 앉힌 나라 | 가장 귀한 꽃이 아니라 가장 흔한 들꽃을 국가 기념일의 상징으로 골랐습니다. | russia | modern | history | repeated | [О празднике (День семьи, любви и верности)](https://densemyi.ru/o-proekte/o-prazdnike/) | other |
| 17 | story-forget-me-not-poland-day | forget-me-not | 발렌타인데이에 맞서 만든 날 | 발렌타인데이의 대항마로 라디오 진행자 한 사람이 만든 날이 있습니다. | poland | modern | history | repeated | [Nie zapomnij o niezapominajce (Lasy Państwowe)](https://www.lasy.gov.pl/pl/edukacja/blogi/blog-lesniczego/nie-zapomnij-o-niezapominajce) | garden |
| 18 | story-lavender-hvar-island | lavender | 묘목 몇 포기가 만든 부자 마을 | 묘목 몇 포기가 섬을 부자로 만들었고, 불 하나가 되돌려 놓았습니다. | croatia | 20c | history | repeated | [The Lavender Fields of Croatia (3 Seas Europe)](https://3seaseurope.com/lavender-fields-hvar-croatia/) | magazine |
| 19 | story-rose-kazanlak-purity-lab | rose-red | 가짜 장미유를 잡아낸 화학 선생님 | 가짜 장미유가 나라의 평판을 무너뜨리기 직전, 시골 화학 교사가 막아 냈습니다. | bulgaria | 20c | history | repeated | [Лаборатория спасява реномето (България Днес)](https://www.bgdnes.bg/bulgaria/article/15775092) | newspaper |
| 20 | story-peony-molly-the-witch | peony | 유배당한 사람이 찾아낸 노란 작약 | 발음이 어렵다는 이유로 학명이 마녀 몰리가 되어 버린 작약이 있습니다. | georgia | 19c | history | repeated | [Ludwik Młokosiewicz (Kuryer Polski)](https://kuryerpolski.us/en/Page/View/ludwik-mlokosiewicz-pokochal-kaukaz) | newspaper |
| 21 | story-sunflower-mammoth-russian-return | sunflower | 사백 년 만에 고향으로 돌아왔습니다 | 미국 밭에 선 기름 해바라기의 조상은 러시아 품종입니다. | russia-usa | modern | history | repeated | [Sunflowers – A Native Plant with an Amazing History (Clemson Extension)](https://blogs.clemson.edu/savannahvalley/around-the-countryside-sunflowers-a-native-plant-with-an-amazing-history/) | garden |

**판정 근거**
- **#13 `folklore` + `repeated`** — 코소보 작약의 붉은 유래는 전승이므로 `folklore`. 다만 **Paeonia peregrina 의 자생지·개체수·법적 보호·2016년 기념비 식재는 사실**이라 `repeated`. 본문은 전승 부분을 "전승은 …고 말합니다"로 명시적으로 분리했습니다.
- **#14** 작사 정황(코나르스키 회고)·초연 일시·연주 규모가 박물관 서술에 그대로 있습니다. `museum`.
- **#20 `repeated`** — 므워코시에비치의 생애·업적은 전기 자료에서, "Molly the Witch" 별명과 개화 특성은 별도 원예 자료(digdelve.com)에서 각각 교차 확인했습니다.
- **#21** Clemson 대학 익스텐션이라 `garden`. "매머드 러시안" 역수입 경로와 1964년 페레도비크 도입은 익스텐션 본문에 있습니다.
- **탈락 1건** — 루마니아 헬레보어 경피 이식 요법(Bogdan et al. 1990)은 페이지가 열리고 논문도 실재하나, **#12 아일랜드 setterwort 와 사실상 같은 관습**(소에게 헬레보어 뿌리를 삽입)이라 중복으로 판단해 제외했습니다.

### 3-3. 페르시아·오스만·아랍·인도 — 12편

| # | story_id | flower_id | 제목 | hook | culture_region | era | type | conf | source | source_kind |
|---|---|---|---|---|---|---|---|---|---|---|
| 22 | story-rose-itr-jahangiri | rose-red | 장미수 위에 뜬 기름 한 겹 | 제국의 향수는 장미수 표면에 뜬 기름막 한 겹에서 시작됐습니다. | mughal-india | 17c | history | varies | [Technologies of Perfumery in India (Sahapedia)](http://www.sahapedia.org/technologies-of-perfumery-india-overview-and-the-case-of-kannauj) | magazine |
| 23 | story-rose-kaaba-washing | rose-red | 밀리리터까지 정해진 장미수 | 세상에서 가장 정확하게 계량되는 장미수가 있습니다. 오백사십 밀리리터요. | saudi-arabia | modern | history | repeated | [Holy Kaaba washed with oud oil, Zamzam, rose water (Khaleej Times)](https://www.khaleejtimes.com/world/gulf/holy-kaaba-washing-saudi-arabia) | newspaper |
| 24 | story-narcissus-behbahan-winter | narcissus | 한겨울에 피는 수선화 | 다들 봄꽃이라 부르지만, 페르시아의 수선화는 한겨울에 핍니다. | iran | modern | history | single_source | [Behbahan blossoms (Tehran Times)](https://www.tehrantimes.com/news/493564/Behbahan-blossoms-daffodil-season-opens-doors-to-nature-s-splendor) | newspaper |
| 25 | story-jasmine-madurai-night-picking | jasmine | 어둠 속에서만 딸 수 있는 꽃 | 향수병에 담기기까지, 이 재스민은 한밤중에 사천 송이씩 손으로 따입니다. | india | modern | history | repeated | [Scent of luxury: India's jasmine infuses global perfume (AFP/Gulf News)](https://gulfnews.com/amp/story/lifestyle%2Fscent-of-luxury-indias-jasmine-infuses-global-perfume-1.1692094253473) | newspaper |
| 26 | story-marigold-phool-ganges | marigold | 신에게 바친 꽃이 강을 아프게 했습니다 | 신에게 바친 꽃이 강을 아프게 하고 있었습니다. 그걸 다시 향으로 되돌린 사람들이 있어요. | india | modern | history | repeated | [The Sacred Cycle (The Conversationalist)](https://conversationalist.org/2025/05/13/phool-kanpur-india-flower-floral-waste-temples-sustainability-water-pollution/) | magazine |
| 27 | story-tulip-lale-mecmuasi | tulip-white | 이름만 이천 개, 남은 건 하나도 없습니다 | 이천 개의 이름을 가졌던 튤립들은 그림으로만 남았습니다. | turkey | 18c | history | repeated | [The Painted Garden (Cornucopia Magazine)](https://www.cornucopia.net/magazine/articles/the-painted-garden/) | magazine |
| 28 | story-iris-muslim-graveyards | iris | 스페인부터 카슈미르까지, 같은 흰 붓꽃 | 스페인에서 카슈미르까지, 무슬림 묘지에는 같은 흰 붓꽃이 심겨 있습니다. | levant | modern | folklore | repeated | [Ritual plants of Muslim graveyards in northern Israel (J. Ethnobiol. Ethnomed.)](https://pmc.ncbi.nlm.nih.gov/articles/PMC1584233/) | paper |
| 29 | story-violet-banafsaj-syrup | violet | 바그다드의 감기약은 제비꽃 잼이었습니다 | 바그다드의 감기약 목록에는 제비꽃 잼이 있었습니다. | arab | 12c | history | varies | [Spotlight on: Violets (Eat Like A Sultan)](https://eatlikeasultan.com/spotlight-on-violets/) | magazine |
| 30 | story-lavender-broom-of-the-brain | lavender | 뇌를 쓸어 내는 빗자루 | 이슬람 의사들은 라벤더를 약이 아니라 빗자루라고 불렀습니다. | arab | medieval | history | repeated | [Therapeutic Potential of Ustukhuddus (J. Drug Delivery & Therapeutics)](https://www.jddtonline.info/index.php/jddt/article/download/7412/7113/22816?inline=1) | paper |
| 31 | story-carnation-ottoman-four-flowers | carnation | 제국이 고른 네 가지 꽃 | 한 제국이 공식 대표 꽃 넷을 골랐고, 카네이션이 그 안에 있었습니다. | turkey | 16c | history | repeated | [Interpreting Iznik floral motifs (The Courtauld Institute of Art)](https://sites.courtauld.ac.uk/illuminating-objects/illuminating-objects-home/iznik-dish/interpreting-iznik-floral-motifs/) | museum |
| 32 | story-magnolia-champaka-kamadeva | magnolia | 사랑의 신이 쏘는 다섯 화살 | 사랑의 신이 쏘는 화살 다섯 개 가운데 하나는 목련이었습니다. | india | ancient | folklore | repeated | [Magnolia champaca (Pha Tad Ke Botanical Garden)](https://www.pha-tad-ke.com/plant/magnolia-champaca/) | garden |
| 33 | story-lily-mansur-mughal-copy | lily-asiatic | 베끼기에서 시작된 꽃 그림 | 무굴 세밀화의 꽃 사랑은 유럽 판화 속 백합 한 송이를 베끼며 시작됐습니다. | mughal-india | 17c | history | varies | [Adorned like a Meadow (Bagh-e Hind)](https://www.baghehind.com/post/adorned-like-a-meadow-flowers-in-17th-century-mughal-albums) | magazine |
| | | | | | | | | | | |

**판정 근거**
- **#22 `varies`** — 이트르이 자한기리의 발견자를 누르자한 본인으로 적는 자료와 그 어머니로 적는 자료가 갈립니다. 본문은 출처를 따라 "어머니에게 돌려집니다"로 썼습니다. 칸나우지 데그-바프카 증류법과 증류소 감소는 사실.
- **#23 `repeated`** — 세정식은 매년 국영 보도로 다뤄지며 배합량까지 공표됩니다. **밀리리터 단위 숫자가 이 이야기의 전부**라 숫자를 그대로 옮겼습니다.
- **#24 `single_source`** — 국영 매체 한 곳뿐이라 `single_source`. 다만 `source_kind=newspaper` 라 화면 문구는 "기록으로 남아 있는 이야기예요" 로 갑니다.
- **#28 `folklore` + `paper`** — 관습 자체는 민속이지만 근거가 **정량 조사 논문**(묘지 40곳 전수 조사, 붓꽃 24.1%)입니다. `confidence=repeated`.
- **#29 `varies`** — 출처가 전문 블로그 한 곳이라 신중히 내렸습니다. 다만 인용된 1차 사료(맘루크 요리서, 알바그다디)가 명시되어 있어 이야기 뼈대는 확인 가능합니다. **처방 목록은 중세 문헌의 주장이지 효능 주장이 아니라는 톤**으로 썼습니다.
- **#32** 참파(Magnolia champaca)는 우리가 아는 백목련과 다른 종입니다 — **본문 두 번째 문장에 명시**했습니다(§5 참조).

### 3-4. 동아시아·동남아 — 12편

| # | story_id | flower_id | 제목 | hook | culture_region | era | type | conf | source | source_kind |
|---|---|---|---|---|---|---|---|---|---|---|
| 34 | story-jasmine-thailand-mothers-day | jasmine | 세 번 자리를 옮긴 어머니날 | 어머니날이 세 번 자리를 옮기는 동안에도 꽃은 바뀌지 않았습니다. | thailand | modern | history | repeated | [History of National Mother's Day on August 12 (Thairath)](https://en.thairath.co.th/lifestyle/calendar/2951818) | newspaper |
| 35 | story-jasmine-melati-puspa-bangsa | jasmine | 라플레시아를 이긴 손톱만 한 꽃 | 세계에서 가장 큰 꽃을 제치고 민족의 꽃이 된 건, 손톱만 한 흰 재스민이었습니다. | indonesia | modern | history | repeated | [Tiga jenis bunga simbol Puspa Nasional (Antara News)](https://www.antaranews.com/berita/5225561/ini-tiga-jenis-bunga-yang-menjadi-simbol-puspa-nasional-indonesia) | newspaper |
| 36 | story-marigold-thailand-monday-yellow | marigold | 국왕이 태어난 요일의 색 | 국왕이 월요일에 태어났다는 이유로 나라 전체가 노란 꽃을 심었습니다. | thailand | modern | history | repeated | [Planting a sea of yellow (The Nation Thailand)](https://www.nationthailand.com/lifestyle/30329091) | newspaper |
| 37 | story-chrysanthemum-vietnam-altar | chrysanthemum | 밤에 피는 꽃은 제단에 오르지 못합니다 | 국화가 제단에 오를 수 있는 이유는 밤에 피지 않기 때문입니다. | vietnam | traditional | folklore | single_source | [Flowers, their visual and immaterial beauty (Vietnam Law & Legal Forum)](https://vietnamlawmagazine.vn/flowers-their-visual-and-immaterial-beauty-48247.html) | magazine |
| 38 | story-camellia-kamel-manila | camellia | 동백에 이름을 남긴 사람은 동백을 본 적이 없습니다 | 동백에 이름을 남긴 사람은 평생 동백을 본 적이 없습니다. | philippines | 17c | history | repeated | [Georg Joseph Kamel SJ (The Philippine Star)](https://www.philstar.com/business/science-and-environment/2007/01/04/378180/georg-joseph-kamel-sj-1661-1706-first-biodiversity-scientist-rp) | newspaper |
| 39 | story-magnolia-shanghai-first-to-bloom | magnolia | 가장 먼저 피는 꽃을 고른 도시 | 상하이가 시화로 고른 건 가장 예쁜 꽃이 아니라 가장 먼저 피는 꽃이었습니다. | china | modern | history | repeated | [China's Flora Tour (CGTN)](https://news.cgtn.com/news/2019-08-25/China-s-Flora-Tour-Sprung-in-spring-elegant-and-brilliant-JrxSHaKnBu/index.html) | newspaper |
| 40 | story-peony-yaohuang-weizi | peony | 천 년째 왕과 왕비인 모란 | 천 년간 꽃의 왕이라 불린 모란을, 정작 심어 보면 실망한다고 합니다. | china | medieval | history | repeated | [Heirloom Chinese Tree Peonies (Cricket Hill Garden)](https://www.treepeony.com/pages/heirloom-chinese-tree-peonies) | garden |
| 41 | story-cherry-wuhan-university | cherry-blossom | 적군이 심은 나무를 남겨 두기로 했습니다 | 적군이 심은 벚나무를, 잊지 않기 위해 베지 않았습니다. | china | 1930s | history | repeated | [How Wuhan becomes famous for Japan's iconic flower (CGTN)](https://news.cgtn.com/news/2020-08-15/How-Wuhan-becomes-famous-for-Japan-s-iconic-flower-SYzYoNTdks/index.html) | newspaper |
| 42 | story-chrysanthemum-dangozaka-dolls | chrysanthemum | 국화로 지은 옷을 입은 인형들 | 소세키의 그 유명한 한마디는, 국화 인형 구경을 빠져나온 자리에서 나왔습니다. | japan | 19c | history | repeated | [千駄木団子坂花屋敷 (nippon.com)](https://www.nippon.com/ja/guide-to-japan/gu004112/) | magazine |
| 43 | story-hydrangea-shiyoka-misreading | hydrangea | 천 년째 굳어 버린 오독 | 천 년 전 학자가 한 번 잘못 짚은 한자가, 지금도 이 꽃의 이름입니다. | japan | medieval | literary | repeated | [紫陽花の名付け親 (漢字探検隊)](https://www.chokanji.com/magazine/exploration/ex14/) | magazine |
| 44 | story-lily-japan-bulb-export-flip | lily-asiatic | 사천만 개에서 백만 개로 | 백합 수출 대국이 육십 년 만에 세계 최대 수입국이 되었습니다. | japan | 1930s | history | repeated | [Production of Flower Bulbs in Japan (ISHS Acta Horticulturae)](https://ishs.org/ishs-article/673_2/) | paper |
| 45 | story-carnation-morinaga-mothers-day | carnation | 어머니 이십만 명을 공짜로 부른 회사 | 어머니 이십만 명을 놀이공원에 공짜로 부른 과자 회사가 카네이션 관습을 만들었습니다. | japan | 1930s | history | repeated | [「母の日」日本定着のきっかけは森永製菓 (KSB)](https://news.ksb.co.jp/article/14904374) | newspaper |

**판정 근거**
- **#37 `single_source`** — 출처가 한 곳뿐입니다. 밤에 피는 꽃의 제단 금기는 지역차가 클 수 있어 본문에서 "베트남에는 …이 있습니다" 정도로 폭을 잡았습니다.
- **#39** 보조 확인으로 상하이 시화 선정 전사(1983년 후보 6종, 11개 공원 10만여 표, 백목련 1위·복숭아꽃 2위)를 별도 자료에서 교차 확인했습니다. 본문에는 확실한 부분만 실었습니다.
- **#41** 1939년 식재→1947년 존치 결정→1972년 우호 식수의 3단 구조가 출처에 그대로 있습니다. **원목이 1960년대에 대부분 죽었다는 사실도 함께 실어** 지금 나무를 1939년 것으로 오해하지 않게 했습니다.
- **#42** 소세키 『산시로』 5장 국화인형 장면과 'stray sheep' 대사는 별도 텍스트 아카이브(sosekiproject.org)에서 교차 확인했습니다.
- **#43 `literary`** — 이야기의 몸통이 『와묘루이주쇼』라는 특정 문헌의 오독에 있습니다.
- **#44 `paper`** — ISHS Acta Horticulturae 논문. 1937년 4,000만 개 → 2001년 100만 개, 같은 해 수입 1억 7,370만 개라는 숫자가 이야기의 전부입니다.

### 3-5. 아프리카·중남미·아메리카 원주민 — 10편

| # | story_id | flower_id | 제목 | hook | culture_region | era | type | conf | source | source_kind |
|---|---|---|---|---|---|---|---|---|---|---|
| 46 | story-daisy-meskel-ethiopia | daisy | 우기가 끝나면 언덕이 노래집니다 | 비가 그치는 것과 축제가 오는 것과 언덕이 노래지는 것이 한꺼번에 옵니다. | ethiopia | traditional | folklore | repeated | [Meskel (Catholics and Cultures, College of the Holy Cross)](https://www.catholicsandcultures.org/ethiopia/meskel) | other |
| 47 | story-sunflower-hopi-black-dye | sunflower | 노란 꽃에서 검정을 뽑습니다 | 노란 꽃에서 검정을 뽑아, 소녀가 어른이 되는 날의 물감으로 씁니다. | north-america | traditional | folklore | repeated | [Hopi Black Dye Sunflower (Native Seeds/SEARCH)](https://www.nativeseeds.org/pages/hopi-black-dye-sunflower) | garden |
| 48 | story-poinsettia-poinsett-name | poinsettia | 이 꽃 이름에 붙은 그 사람 | 세상에서 가장 다정해 보이는 꽃 이름이, 가장 불편한 이력에서 왔습니다. | mexico | 19c | history | repeated | [Joel Roberts Poinsett (The Conversation)](https://theconversation.com/joel-roberts-poinsett-namesake-of-the-poinsettia-enslaver-secret-agent-and-perpetrator-of-the-trail-of-tears-219781) | magazine |
| 49 | story-carnation-bogota-term-paper | carnation | 리포트 한 편이 바꾼 수출 지도 | 대학원생의 학기 리포트 한 편이 한 나라의 수출 지도를 바꿨습니다. | colombia | 1960s | history | repeated | [The Secrets Behind Your Flowers (Smithsonian Magazine)](https://www.smithsonianmag.com/travel/the-secrets-behind-your-flowers-53128/) | magazine |
| 50 | story-hydrangea-silleteros-medellin | hydrangea | 꽃을 등에 지고 산을 내려오던 사람들 | 꽃을 등에 지고 산을 내려오던 길이, 지금은 도시의 축제가 되었습니다. | colombia | 1950s | history | repeated | [La historia de las flores para los silleteros (Semana)](https://www.semana.com/cultura/articulo/la-historia-de-las-flores-mas-tradicionales-para-los-silleteros/535474/) | magazine |
| 51 | story-rose-cayambe-valley | rose-red | 우주에서도 보이는 장미 계곡 | 밸런타인데이 장미 세 송이 가운데 한 송이는 이 계곡에서 옵니다. | ecuador | modern | history | repeated | [Greenhouses of Cayambe Valley (NASA Earth Observatory)](https://science.nasa.gov/earth/earth-observatory/greenhouses-of-cayambe-valley-91720) | museum |
| 52 | story-marigold-aztec-double-flower | marigold | 겹꽃 메리골드는 아즈텍의 작품입니다 | 겹꽃 메리골드는 유럽 품종개량의 산물이 아니라 아즈텍의 작품입니다. | aztec | 15c | history | repeated | [Aztec pleasure gardens (Mexicolore)](https://www.mexicolore.co.uk/aztecs/aztefacts/aztec-pleasure-gardens) | other |
| 53 | story-gerbera-hilton-daisy | gerbera | 캐 가면 죽는 야생 거베라 | 세계에서 가장 흔한 절화의 야생 사촌은, 정원으로 옮기면 죽습니다. | south-africa | modern | history | single_source | [Gerbera aurantiaca (PlantZAfrica, SANBI)](https://pza.sanbi.org/gerbera-aurantiaca) | garden |
| 54 | story-iris-oceloxochitl-jaguar | iris | 재규어 꽃이라 불린 붓꽃 | 아즈텍은 이 얼룩무늬 꽃을 재규어 꽃이라 부르고, 그 알뿌리를 먹었습니다. | aztec | 16c | history | single_source | [oceloxochitl (Nahuatl Dictionary, Wired Humanities Projects)](https://nahuatl.wired-humanities.org/content/oceloxochitl) | wiki |
| 55 | story-violet-saintpaulia-father-son | violet | 아버지에게 보낸 씨앗 한 봉지 | 아버지에게 보낸 씨앗 한 봉지가, 두 사람의 성을 나란히 식물 이름에 남겼습니다. | tanzania | 19c | history | repeated | [Early Discovery and Naming (Gesneriad Reference Web)](https://gesneriads.info/articles/saintpaulia/saintpaulia/taxonomy/early-discovery-naming/) | garden |

**판정 근거**
- **#47** 부족을 뭉뚱그리지 않고 **호피족**으로 특정했고, 종자 수집 지역(1978년 숭고파비)도 출처에 명시된 대로 두었습니다. 의례 서술은 출처가 공개한 범위 안에서만 썼습니다.
- **#48** 이 라운드에서 가장 무거운 이야기입니다. 기존 `camellia-jeju-43` 선례에 따라 **선물 추천 화면에 무거운 역사가 실릴 수 있다는 전제**를 유지하되, `moods=dramatic|tragic`·`intents=just_because` 로 두어 위로·감사 같은 감정 자리에는 뽑히지 않게 했습니다.
- **#53 `single_source`** — SANBI 한 곳뿐이지만 `source_kind=garden`(국가 식물 기관)이라 화면 문구는 기록 계열로 갑니다.
- **#54 `single_source` + `wiki`** — 학술 사전 한 곳. `source_kind` 판정 근거는 §2-1 각주 참조.
- **#55** 아프리칸 바이올렛은 제비꽃속이 **아닙니다**(§5 참조).

### 3-6. 빅토리아 꽃말 문화 · 서구 인물 실화 — 12편

| # | story_id | flower_id | 제목 | hook | culture_region | era | type | conf | source | source_kind |
|---|---|---|---|---|---|---|---|---|---|---|
| 56 | story-daisy-chaucer-days-eye | daisy | 낮의 눈 | 데이지는 이름이 아니라 별명이었습니다. 낮의 눈이라는 뜻이에요. | england | 14c | literary | repeated | [The Legend of Good Women (Chaucer, trans. A. S. Kline)](https://www.poetryintranslation.com/PITBR/English/GoodWomen.php) | book-pd |
| 57 | story-daisy-dickinson-master-letters | daisy | 사랑 편지에 데이지라고 서명한 시인 | 그녀는 사랑 편지에서 자기 이름을 지우고 데이지라고 썼습니다. | usa | 19c | literary | repeated | [Letter 233 (Emily Dickinson Archive, Amherst College)](https://archive.emilydickinson.org/correspondence/anon/l233.html) | museum |
| 58 | story-narcissus-dorothy-journal | narcissus | 수선화를 먼저 본 사람은 시인이 아니었습니다 | 세상에서 가장 유명한 수선화 시의 초고는 여동생의 일기였습니다. | england | 19c | literary | repeated | [Dorothy Wordsworth, Grasmere Journal (Romantic Circles)](https://romantic-circles.org/sites/default/files/RCOldSite/www/rchs/reader/dwdaff.html) | book-pd |
| 59 | story-carnation-mckinley-lucky | carnation | 부적을 남에게 준 그날 | 행운의 부적을 남에게 건네준 바로 그 자리에서 일어난 일입니다. | usa | 20c | history | repeated | [The McKinley Assassination (Ohio Memory, Ohio History Connection)](https://ohiomemory.ohiohistory.org/archives/821) | museum |
| 60 | story-rose-hildesheim-thousand-year | rose-red | 성당이 무너진 자리에서 여덟 주 뒤 | 성당이 사라진 자리에서 여덟 주 뒤, 장미가 스물다섯 개의 순을 올렸습니다. | germany | 20c | history | repeated | [1000 years of age rosetree (Hildesheimer Dom)](https://www.dom-hildesheim.de/en/cathedral/1000-years-of-age-rosetree/) | museum |
| 61 | story-lotv-faberge-egg | lily-of-the-valley | 진주 단추를 돌리면 얼굴이 펼쳐집니다 | 진주 단추를 돌리면 은방울꽃 속에서 세 사람의 얼굴이 펼쳐집니다. | russia | 19c | history | repeated | [Lilies-of-the-Valley Easter Egg (Fabergé Museum)](https://fabergemuseum.ru/en/collections/collection-highlights/lilies-of-the-valley-easter-egg) | museum |
| 62 | story-magnolia-jackson-white-house | magnolia | 나이테가 다른 말을 하는 나무 | 이백 년 된 사랑 이야기와 나이테가 서로 다른 말을 하는 나무가 있었습니다. | usa | 19c | history | varies | [Jackson Magnolia (National Park Service)](https://www.nps.gov/whho/learn/historyculture/jackson-magnolia.htm) | museum |
| 63 | story-camellia-pillnitz-glass-house | camellia | 나무를 옮길 수 없어서 집이 걸어옵니다 | 나무를 옮길 수 없으니, 오십사 톤짜리 유리집이 해마다 나무에게 걸어옵니다. | germany | 19c | history | repeated | [The Camellia (Pillnitz Palace and Park)](https://www.schlosspillnitz.de/en/pillnitz-palace-and-park/the-camellia/) | garden |
| 64 | story-poppy-tower-888246 | corn-poppy | 도자기 꽃 한 송이가 사람 한 명입니다 | 팔십팔만 팔천이백사십육 송이. 도자기 꽃 한 송이가 사람 한 명입니다. | uk | modern | history | repeated | [Sixteen ceramic poppies from Blood Swept Lands (V&A)](https://www.vam.ac.uk/blog/news/sixteen-ceramic-poppies-from-blood-swept-lands-and-seas-of-red) | museum |
| 65 | story-violet-napoleon-hidden-faces | violet | 꽃다발 여백에 숨은 얼굴 | 제비꽃 그림의 빈자리를 들여다보면 황제 가족의 얼굴이 나타납니다. | france | 19c | history | repeated | [Violettes du 20 Mars 1815 (Yale Center for British Art)](https://collections.britishart.yale.edu/catalog/orbis:12737516) | museum |
| 66 | story-forget-me-not-annual-1823 | forget-me-not | 나를 잊지 마세요라는 제목의 선물책 | 꽃 이름을 제목으로 단 선물책 한 권이 꽃말 문화를 상품으로 만들었습니다. | england | 19c | history | repeated | [The Legacy of Rudolph Ackermann and British Literary Annuals (BRANCH)](https://branchcollective.org/?ps_articles=katherine-d-harris-the-legacy-of-rudolph-ackermann-and-nineteenth-century-british-literary-annuals) | paper |
| 67 | story-iris-michael-foster-breeding | iris | 생리학의 대가가 퇴근 후에 한 일 | 실험실의 대가가 퇴근 후 정원에서 만든 것이, 지금 우리가 보는 붓꽃입니다. | england | victorian | history | repeated | [Foster irises (Gardens Illustrated)](https://www.gardensillustrated.com/features/skellorn-irises-iris-breeding) | magazine |

**판정 근거**
- **#56·#58** 원문이 퍼블릭 도메인이라 `book-pd`. 초서 대목의 인용은 우리말로 옮겼고, 도러시 일기의 유명한 세 구절(춤추듯 흔들림, 시골 유료도로 폭의 띠, 돌을 베개 삼아 쉬는 모습)도 우리말로 재화했습니다.
- **#57** 아머스트 칼리지 소장 원고 아카이브라 `museum`. **수신인이 지금도 미확정**이라는 사실을 본문에 명시해, 이 편지를 특정 인물과의 연애담으로 읽지 않게 했습니다.
- **#62 `varies`** — 이야기가 유명한 만큼 위험합니다. **잭슨이 1829년에 심었다는 전승이 NPS 기록(1860년대 첫 등장)과 어긋난다는 사실 자체를 이야기의 축**으로 삼았습니다. 제거(2025-04-07)와 후손 묘목 식재(4-08)까지 실었습니다.
- **#66 `paper`** — BRANCH(Britain, Representation and Nineteenth-Century History)는 동료심사 학술 플랫폼입니다. 이 이야기는 **플로리오그라피 문화가 어떻게 상품이 되었는지**를 다루므로 dearbloom 서비스의 자기 소개에 가장 가까운 편이기도 합니다.

---

## 4. 자랑할 만한 이야기 3편

1. **#7 스코틀랜드 양귀비에는 잎이 없습니다** (`story-poppy-scotland-four-petals`) — 잉글랜드 포피는 꽃잎 2장 + 초록 잎 1장, 스코틀랜드 포피는 식물학적으로 정확한 꽃잎 4장 + 잎 없음. **백 년째 갈라져 있는 추모의 꽃잎**이라는 사실이 그 자체로 이야기입니다. 시작이 상이군인 두 명, 가위 한 자루, 종이 한 장이었다는 대목까지 붙습니다.
2. **#5 웨일스의 상징은 원래 부추였습니다** (`story-narcissus-wales-leek-to-daffodil`) — 국가 상징이 **채소에서 꽃으로 교체된 사건**. 웨일스어로 부추가 cennin, 수선화가 cennin Pedr(베드로의 부추)라 이름부터 같은 집안이었다는 마무리가 좋습니다. 국립박물관이 직접 "수선화는 늦게 온 신참"이라고 말한다는 점도 힘이 됩니다.
3. **#60 성당이 무너진 자리에서 여덟 주 뒤** (`story-rose-hildesheim-thousand-year`) — 1945년 공습으로 대성당이 사라지고 장미도 탔는데, **여덟 주 뒤 잔해 밑 뿌리에서 순 25개**가 올라왔습니다. 위로(comfort) 자리에 놓을 수 있는 이야기 중 이번 라운드 최고입니다. 화려한 품종이 아니라 흔한 개장미(Rosa canina)라는 점이 오히려 이야기를 살립니다.

**아깝게 3위 밖:** #23 카바 세정식 장미수 540mL(숫자가 전부인 이야기), #62 백악관 잭슨 목련(전승과 나이테가 다른 말을 함), #38 동백을 본 적 없는 사람의 이름이 동백에 붙은 사연.

---

## 5. 이름은 같지만 다른 식물 — 4건 (전부 본문에 명시)

기존 데이터셋에는 `jasmine-not-jasmine` 같은 "이름만 같은 다른 꽃" 계열 선례가 있습니다. 이번에도 4건을 그 규칙대로 처리했습니다. **전부 `story_ko` 본문 안에서 직접 밝혔고**, `editorial_note` 에도 남겼습니다.

| # | flower_id | 실제 식물 | 본문 처리 |
|---|---|---|---|
| 3 | daisy | 발두르스브라 = Bellis 가 아닌 국화과 흰 들꽃(개꽃 계열) | "우리가 데이지라 부르는 무리의 친척들" |
| 10 | marigold | 마시 메리골드(Caltha palustris) — 만수국·금잔화와 무관 | "사실은 우리가 꽃집에서 만나는 메리골드와 전혀 다른 식물이에요" |
| 32 | magnolia | 참파(Magnolia champaca) — 목련속이 맞으나 백목련과 다른 종 | "우리가 아는 백목련과는 다른 종이지만 같은 집안입니다" |
| 54 | iris | 티그리디아 파보니아 — 붓꽃과이나 속이 다름 | "우리가 아는 붓꽃과는 속이 다르지만 같은 집안이에요" |
| 55 | violet | 아프리칸 바이올렛(Saintpaulia) — 제비꽃속이 아닌 게스네리아과 | "이 꽃은 제비꽃속이 아니라 전혀 다른 집안이에요" |

---

## 6. 버린 후보와 사유

**열람 실패로 제외** — Encyclopaedia Iranica, The Hindu, ResearchGate, PIB, Springer, Taylor & Francis(403), Bangkok Post(tollbit 리다이렉트), CNN(451), Smithsonian NMAA·Khaosod English·NBC News·Texas Monthly(403), Met·napoleon.org·British Museum·HRP(403/429), 상하이 지방지 shtong.gov.cn(본문 미로딩), chinaknowledge.de(SSL), 애리조나대 PDF·세계농림센터 PDF(본문 추출 불가). **URL을 못 연 후보는 한 건도 싣지 않았습니다.**

**내용 미확증으로 제외** — 오스만 사즈 양식의 모란 모티프(샤흐쿨루), 이스파르타 장미 지팡이 밀반출(연도가 1870년대/1888년으로 갈림), 페루 우아카타이(1차 사료 근거 빈약).

**중복으로 제외** — 루마니아 헬레보어 경피 이식(#12과 같은 관습), 남아공 코스모스·나마콸란드 데이지(기존 `cosmos-horsefeed` 와 겹침), 피렌체 문장의 붓꽃(기존 `iris-fleur-de-lis` 와 겹침), 1839년 'Medora' 팬지 얼굴 무늬(기존 `pansy-weed-to-400` 과 겹칠 위험).

**다음 라운드용 재고(검증 완료, 미적재)**
- `daisy` — 스코트어 gowan 복합어 사전([DSL](https://dsl.ac.uk/entry/snd/gowan)): witch-gowan·lucken-gowan 등 14종 이상, 버윅셔 속담 "5월 첫 데이지를 밟았다면 병이 낫는다"
- `daisy` — 1961년 벨연구소 IBM 7094가 부른 'Daisy Bell'(컴퓨터가 부른 첫 노래 → HAL 9000 장면의 기원)
- `narcissus` — 우크라이나 후스트 수선화 계곡(257ha, 유럽 유일의 저지대 군락, 알프스 자생지보다 1,800m 낮음)
- `cherry-blossom` — 소메이요시노 단일 클론 기원(국립국회도서관)
- `cosmos` — 일본 도래 두 설과 '秋桜' 표기 유래(레퍼런스협동DB)
- `tulip-white` — 1836년 창립해 지금도 남은 마지막 영국 플로리스트 튤립 협회(웨이크필드)
- `freesia` — 붓꽃과 약 1,800종 중 절반 이상이 남부 아프리카, 케이프 식물구계에만 707종([SANBI](https://pza.sanbi.org/iridaceae))

---

## 7. 게이트 결과

```
npm run seed
  stories.csv 317행
  [OK] flower_id 참조 무결성 — 참조 755건 모두 flowers.csv 안에 있음 — 32종
  [OK] 반려동물 안전성 커버리지 (cat·dog 전수)
  [OK] 공유 어휘 일치 — stories 317행 모두 어휘 안에 있음
  결과: 통과 (오류 0건)          exit 0

npm run test
  Test Files  16 passed (16)
  Tests      260 passed (260)
```

`tests/data/catalog.test.ts` 의 `EXPECTED_STORIES` 를 250 → 317 로 갱신했습니다(이야기 수를 단언하는 유일한 테스트).
