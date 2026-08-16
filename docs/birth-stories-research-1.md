# 탄생화 사전 이야기 리서치 1 — 1~4월 (birth-stories-research-1)

## 1. 조사 개요

- **조사일**: 2026-08-16
- **담당 범위**: `content/birth_flowers.csv` 의 **1~4월** 중 `flower_id` 가 비어 있는 날의 꽃
- **대상**: 해당 조건의 행 **89개**, 이름 단위로 중복을 지우면 **79개 이름**
- **산출물**: `content/birth_stories.part1.csv` (헤더 포함 84줄, UTF-8 no BOM, LF, 파이프 배열 없음)
- **수집 결과**: **83편 / 57개 이름**. 2편 이상 확보한 이름 **25개**, 1편만 확보한 이름 **32개**
- **미확보**: 22개 이름. 전 이름을 최소 한 번씩 탐색했고, 미확보 사유를 §4 에 이름별로 남겼다.
- **검증**: 모든 `source_url` 을 스크립트로 실제 요청해 **79개 전부 HTTP 200 + 본문 반환**을 확인했다.

### 1-1. 이번 라운드가 지킨 것

1. **지어낸 이야기 0편.** `story_type` 에 `original` 은 없다. 소재가 없는 이름은 억지로 채우지 않고 0편으로 두고, 무엇을 어떻게 찾다가 실패했는지 §4 에 적었다.
2. **타 사이트 문장을 옮긴 곳은 없다.** `story_ko` 는 전부 사실관계만 참고해 새로 쓴 우리 문장이다(한국어 해요체, 평균 287자).
3. **원문 인용은 퍼블릭 도메인에 한해, 직접 인용부호 없이 우리말로.** 오비디우스·플리니우스·셰익스피어·사기·산해경·삼국지연의·디오게네스 라에르티오스·루소 『고백록』·오 헨리·베아트릭스 포터가 여기 해당한다.
4. **이름 함정을 각주로 숨기지 않았다.** 매쉬 메리골드, 서향, 산옥잠화, 벚꽃난, 치자나무, 페르시아 국화, 향기 알리섬처럼 **함정 자체를 이야기의 몸통으로 쓴 행이 9편**이다(§5).
5. **위키 비중 6.0%.** 83편 중 `wiki` 는 5편이고, 그중 2편은 한국민족문화대백과사전이다(3차 라운드의 분류 선례를 따랐다).

### 1-2. confidence 라벨 (기존 5개 라운드와 동일 기준)

- `repeated` — 여러 독립 출처에서 반복 확인되는 정설/사실
- `varies` — 전승은 널리 알려졌으나 버전이 갈리거나 출처가 한 계열에 몰림
- `single_source` — 출처가 하나뿐

---

## 2. 지표

### 2-1. 커버리지

| 항목 | 값 |
|---|---|
| 담당 고유 이름 | **79** |
| 이야기를 확보한 이름 | **57** (72.2%) |
| 2편 이상 확보 | **25** |
| 1편만 확보 | **32** |
| 0편 (미확보) | **22** |
| 총 이야기 | **83편** |

> **1편짜리가 32개인 이유.** 주문은 "찾을 수 있으면 2편 이상"이었다. 두 번째 편을 세우려면 첫 번째와 **다른 소재·다른 출처**가 필요한데, 이번 79개 이름의 상당수가 원예 문헌에도 한두 줄밖에 없는 풀과 나무였다. 억지로 같은 사실을 둘로 쪼개는 대신 1편으로 두었다. 다만 같은 페이지에서 **다른 대목**을 다룬 경우는 2편으로 세웠고(마가목·아르메리아·독당근·우엉·흰나팔꽃), 해당 `editorial_note` 에 그 사실을 밝혀 두었다.

### 2-2. source_kind 분포 — 위키 6.0%

| 값 | 편수 | 비중 |
|---|---|---|
| `garden` | 26 | 31.3% |
| `book-pd` | 14 | 16.9% |
| `magazine` | 12 | 14.5% |
| `museum` | 12 | 14.5% |
| `paper` | 7 | 8.4% |
| `other` | 6 | 7.2% |
| `wiki` | 5 | 6.0% |
| `newspaper` | 1 | 1.2% |
| **합계** | **83** | 100% |

> `garden` 이 26편으로 가장 많은 건 이번 대상의 성격 때문이다. 79개 이름 중 절반 이상이 신화도 역사도 붙지 않은 풀·나무라, **도감이 유일하게 열람 가능한 공신력 출처**였다. 대신 도감 출처 26편 중 이름 함정·어원·구조를 정면으로 다룬 것이 대부분이라 "재배법 요약"으로 흐르지는 않았다.
>
> `wiki` 5편의 정체는 한국민족문화대백과사전 2편(정이품송·무궁화사건), 영문 위키백과 1편(아이비리그), World History Encyclopedia 1편(도도나), Encyclopedia.com 1편(플랜태저넷)이다.

### 2-3. story_type

| 값 | 편수 | 비중 |
|---|---|---|
| `history` | 64 | 77.1% |
| `folklore` | 11 | 13.3% |
| `literary` | 8 | 9.6% |
| **합계** | **83** | 100% |

`original`(창작) **0편**. 이번 라운드에 지어낸 이야기는 없다.

### 2-4. confidence

| 값 | 편수 | 비중 |
|---|---|---|
| `repeated` | 63 | 75.9% |
| `varies` | 18 | 21.7% |
| `single_source` | 2 | 2.4% |
| **합계** | **83** | 100% |

### 2-5. culture_region (29종)

`england`(11) · `greece`(9) · `global`(9) · `japan`(7) · `usa`(6) · `north-america`(6) · `korea`(4) · `france`(3) · `china`(3) · `uk`(2) · `scotland`(2) · `greece-rome`(2) · `rome`(2) · `europe`(2) · `bulgaria` · `canada-france` · `australia` · `norse` · `china-korea` · `france-switzerland` · `netherlands` · `saint-helena` · `france-netherlands` · `usa-china` · `egypt-france` · `usa-germany` · `switzerland` · `england-france` · `wales`

**기존 `stories.csv` 에 없던 신규 값 9종**: `canada-france` `china-korea` `egypt-france` `england-france` `france-netherlands` `france-switzerland` `saint-helena` `usa-china` `usa-germany`. 전부 이야기 하나가 두 문화권에 걸쳐 있어 한쪽으로 자를 수 없는 경우이며, 4차의 `russia-usa`·5차의 `uk-south-africa` 선례를 따랐다. 다만 `saint-helena` 만은 성격이 다르다 — 세인트헬레나섬을 영국이나 프랑스로 뭉개지 않으려고 섬 이름을 그대로 값으로 썼다(3·4차의 `aztec` `navajo` 선례).

`global` 9편은 특정 문화권의 이야기가 아니라 **식물 자체의 구조·어원**을 다룬 행이다.

### 2-6. era

34종을 썼고, 그중 기존 `stories.csv` 에 없던 값은 10종이다 — `1c` `10c` `14c-modern` `17c-modern` `1930s-1940s` `1930s-1950s` `1940s-1950s` `1950s-modern` `1990s-modern` `medieval-modern`. 모두 기존 표기 규칙(세기·연대·범위를 하이픈으로 잇는 방식)을 그대로 따른 조합이다.

---

## 3. 이야기 표 (#1~#83)

> 컬럼: `# | name_ko | story_id | 제목 | region | era | type | conf | kind | source`
> `hook` 과 `story_ko` 본문은 `content/birth_stories.part1.csv` 에 그대로 실려 있어 여기서는 생략한다.
> 번호(#1~#83)는 각 행의 `editorial_note` 에 그대로 적혀 있다.

| # | name_ko | story_id | 제목 | region | era | type | conf | kind | source |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 스노드롭 | `bstory-snowdrop-paskov-nivalin` | 발칸 농민의 민간요법이 치매약이 됐습니다 | bulgaria | 1950s-modern | history | repeated | paper | [ncbi.nlm.nih.gov](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7933568/) |
| 2 | 스노드롭 | `bstory-snowdrop-moly-odysseus` | 오디세우스가 받은 약초라는 설 | greece | ancient-modern | literary | varies | magazine | [mcgill.ca](https://www.mcgill.ca/oss/article/medical-history/odysseus-snowdrop-odyssey) |
| 3 | 스노드롭 | `bstory-snowdrop-golden-tears-ebay` | 알뿌리 하나가 1,850파운드에 팔렸습니다 | england | modern | history | repeated | magazine | [gardensillustrated.com](https://www.gardensillustrated.com/news/snowdrop-bulb-sells-for-a-record-busting-1850) |
| 4 | 노루귀 | `bstory-hepatica-liverwort-1883` | 간을 닮았다는 이유로 45만 파운드가 팔렸습니다 | usa | 19c | history | repeated | magazine | [northernwoodlands.org](https://northernwoodlands.org/articles/article/doctrine-signatures) |
| 5 | 측백나무 | `bstory-thuja-cartier-tree-of-life` | 괴혈병을 멈춘 나무가 생명의 나무가 됐습니다 | canada-france | 16c | history | repeated | paper | [ncbi.nlm.nih.gov](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2647905/) |
| 6 | 측백나무 | `bstory-thuja-daegu-dodong-grove` | 천연기념물 목록의 맨 앞자리 | korea | modern | history | repeated | museum | [heritage.go.kr](https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1362200010000) |
| 7 | 향기 알리섬 | `bstory-sweet-alyssum-name-moved` | 알리섬이라 부르지만 알리섬이 아닙니다 | global | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/lobularia-maritima/) |
| 8 | 가시 | `bstory-thorn-glastonbury-christmas` | 크리스마스에 꽃을 피우는 가시나무 | england | medieval-modern | folklore | varies | other | [blogs.reading.ac.uk](https://blogs.reading.ac.uk/crg/glastonbury-thorn/) |
| 9 | 소나무 | `bstory-pine-jeongipumsong-rank` | 가지를 들어 올려 벼슬을 받은 나무 | korea | 15c | folklore | varies | wiki | [encykorea.aks.ac.kr](https://encykorea.aks.ac.kr/Article/E0030407) |
| 10 | 담쟁이덩굴 | `bstory-ivy-last-leaf-behrman` | 벽에 그려진 잎 하나 | usa | 1900s | literary | repeated | book-pd | [gutenberg.org](https://www.gutenberg.org/cache/epub/3707/pg3707-images.html) |
| 11 | 담쟁이덩굴 | `bstory-ivy-league-1935-newspaper` | 아이비리그라는 말은 기자들이 만들었습니다 | usa | 1930s | history | repeated | wiki | [en.wikipedia.org](https://en.wikipedia.org/wiki/Ivy_League) |
| 12 | 이끼 | `bstory-moss-sphagnum-field-dressing` | 늪에서 걷어 온 붕대 | uk | 1910s | history | repeated | magazine | [theconversation.com](https://theconversation.com/war-and-peat-how-bog-moss-helped-save-thousands-of-lives-in-world-war-i-106630) |
| 13 | 이끼 | `bstory-moss-saihoji-after-flood` | 이끼는 절이 망가진 뒤에 자랐습니다 | japan | medieval-modern | history | single_source | other | [saihoji-kokedera.com](https://saihoji-kokedera.com/en/) |
| 14 | 미모사 | `bstory-mimosa-de-mairan-cupboard` | 찬장 속에서도 잎을 여닫았습니다 | france | 18c | history | repeated | magazine | [srbr.org](https://srbr.org/the-birth-of-chronobiology-a-botanical-observation/) |
| 15 | 미모사 | `bstory-mimosa-gagliano-drop-training` | 떨어뜨려도 더는 잎을 접지 않았습니다 | australia | 2010s | history | varies | magazine | [sci.news](https://www.sci.news/biology/science-mimosa-plants-memory-01695.html) |
| 16 | 마가목 | `bstory-rowan-red-thread-rhyme` | 마가목과 붉은 실 | scotland | traditional | folklore | repeated | garden | [treesforlife.org.uk](https://treesforlife.org.uk/into-the-forest/trees-plants-animals/trees/rowan/rowan-mythology-and-folklore/) |
| 17 | 마가목 | `bstory-rowan-thor-river-grip` | 토르를 건져 올린 나무 | norse | traditional | folklore | varies | garden | [treesforlife.org.uk](https://treesforlife.org.uk/into-the-forest/trees-plants-animals/trees/rowan/rowan-mythology-and-folklore/) |
| 18 | 검은 포플라 | `bstory-black-poplar-heliades-amber` | 울다가 나무가 된 자매들 | greece-rome | ancient | folklore | repeated | book-pd | [theoi.com](https://www.theoi.com/Nymphe/NymphaiHeliades.html) |
| 19 | 검은 포플라 | `bstory-black-poplar-600-females` | 영국에 남은 암나무는 육백 그루입니다 | england | modern | history | repeated | garden | [woodlandtrust.org.uk](https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/british-trees/a-z-of-british-trees/black-poplar/) |
| 20 | 매쉬 메리골드 | `bstory-marsh-marigold-not-a-marigold` | 메리골드가 아닌 메리골드 | north-america | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/caltha-palustris/) |
| 21 | 양치 | `bstory-fern-seed-walk-invisible` | 고사리 씨앗을 쥐면 투명해집니다 | england | 16c-19c | folklore | varies | other | [britishfairies.wordpress.com](https://britishfairies.wordpress.com/2018/02/18/fern-seed-and-invisibility/) |
| 22 | 양치 | `bstory-fern-boyi-shuqi-wei` | 주나라 곡식을 안 먹겠다며 캐 먹은 것 | china | ancient | history | varies | book-pd | [ctext.org](https://ctext.org/shiji/bo-yi-lie-zhuan) |
| 23 | 범의귀 | `bstory-saxifraga-rock-breaker` | 바위를 깨는 풀이라는 이름 | global | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/saxifraga-stolonifera/) |
| 24 | 은매화 | `bstory-myrtle-gotha-nosegay-1845` | 1845년 꽃다발에서 잘라 낸 가지 하나 | england | 19c-modern | history | repeated | museum | [english-heritage.org.uk](https://www.english-heritage.org.uk/visit/inspire-me/blog/blog-posts/osborne-myrtle-and-royal-weddings/) |
| 25 | 은매화 | `bstory-myrtle-aphrodite-sacred` | 사랑의 여신에게 바쳐진 나무 | greece | ancient | folklore | varies | book-pd | [theoi.com](https://www.theoi.com/Olympios/Aphrodite.html) |
| 26 | 서향 | `bstory-daphne-odora-not-a-laurel` | 월계수의 이름을 쓰는 월계수 아닌 나무 | global | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/daphne-odora/) |
| 27 | 멜리사 | `bstory-melissa-carmelite-water-1611` | 1611년 파리 수도원이 만든 물 | france | 17c-modern | history | single_source | other | [eaudemelisse.com](https://eaudemelisse.com/en/our-history/origins/) |
| 28 | 멜리사 | `bstory-melissa-pliny-keep-the-swarm` | 벌을 붙잡아 두는 풀 | rome | 1c | history | repeated | book-pd | [perseus.tufts.edu](https://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Atext%3A1999.02.0137%3Abook%3D21%3Achapter%3D41) |
| 29 | 갈풀 | `bstory-canary-grass-invader` | 정원에서 나가 늪을 덮었습니다 | north-america | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/phalaris-arundinacea/) |
| 30 | 카모밀레 | `bstory-chamomile-peter-rabbit-tea` | 말썽 부린 밤에 먹인 차 | england | 1900s | literary | repeated | book-pd | [gutenberg.org](https://www.gutenberg.org/cache/epub/14838/pg14838-images.html) |
| 31 | 카모밀레 | `bstory-chamomile-falstaff-trodden` | 밟힐수록 잘 자란다는 말 | england | 16c | literary | repeated | book-pd | [opensourceshakespeare.org](https://www.opensourceshakespeare.org/views/plays/play_view.php?WorkID=henry4p1&Act=2&Scene=4&Scope=scene) |
| 32 | 삼나무 | `bstory-sugi-postwar-planting-hayfever` | 나라 하나를 재채기하게 만든 조림 사업 | japan | 1950s-modern | history | repeated | magazine | [nippon.com](https://www.nippon.com/en/nipponblog/m00081/) |
| 33 | 삼나무 | `bstory-sugi-yakushima-thousand-years` | 천 년이 기준선인 숲 | japan | ancient-modern | history | repeated | museum | [whc.unesco.org](https://whc.unesco.org/en/list/662) |
| 34 | 월계수 | `bstory-laurel-daphne-transformed` | 붙잡히기 직전에 나무가 됐습니다 | greece | ancient | folklore | repeated | book-pd | [theoi.com](https://www.theoi.com/Nymphe/NympheDaphne.html) |
| 35 | 월계수 | `bstory-laurel-laureate-word` | 노벨상 수상자라는 말에 들어 있는 잎 | greece-rome | ancient-modern | history | repeated | magazine | [theconversation.com](https://theconversation.com/whats-a-laureate-a-classicist-explains-the-words-roots-in-ancient-greek-victors-winning-crowns-of-laurel-leaves-191407) |
| 36 | 떡갈나무 | `bstory-oak-boscobel-all-day` | 왕이 하루를 보낸 나무 | england | 17c | history | repeated | museum | [english-heritage.org.uk](https://www.english-heritage.org.uk/visit/places/boscobel-house-and-the-royal-oak/history/charles-ii-and-the-royal-oak/) |
| 37 | 떡갈나무 | `bstory-oak-dodona-oracle` | 잎 소리를 듣고 신탁을 읽었습니다 | greece | ancient | history | repeated | wiki | [worldhistory.org](https://www.worldhistory.org/Dodona/) |
| 38 | 칼미아 | `bstory-kalmia-anther-catapult` | 벌이 방아쇠를 당기면 꽃가루가 튑니다 | north-america | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/kalmia-latifolia/) |
| 39 | 네모필라 | `bstory-nemophila-hitachi-53-million` | 언덕 하나가 통째로 파랗습니다 | japan | modern | history | repeated | magazine | [timeout.com](https://www.timeout.com/tokyo/things-to-do/nemophila-harmony) |
| 40 | 무궁화 | `bstory-mugunghwa-80000-seedlings-burned` | 묘목 팔만 주를 불태운 사건 | korea | 1930s | history | repeated | wiki | [encykorea.aks.ac.kr](https://encykorea.aks.ac.kr/Article/E0018951) |
| 41 | 무궁화 | `bstory-mugunghwa-shanhaijing-junzi` | 아침에 피고 저녁에 지는 풀 | china-korea | ancient | literary | varies | book-pd | [ctext.org](https://ctext.org/shan-hai-jing/hai-wai-dong-jing) |
| 42 | 살구꽃 | `bstory-apricot-dong-feng-xinglin` | 진료비 대신 살구나무를 심게 했습니다 | china | 3c | folklore | varies | museum | [fuzhou.gov.cn](https://www.fuzhou.gov.cn/zgfzzt/zjrc/mdfc/mdrj/202111/t20211115_4242647.htm) |
| 43 | 빙카 | `bstory-periwinkle-rousseau-thirty-years` | 삼십 년 만에 알아본 꽃 | france-switzerland | 18c | literary | repeated | book-pd | [gutenberg.org](https://www.gutenberg.org/files/3913/3913-h/3913-h.htm) |
| 44 | 사향장미 | `bstory-musk-rose-rediscovered-1963` | 사라진 줄 알았던 장미를 남의 정원에서 찾았습니다 | england | 16c-modern | history | repeated | garden | [botanic.cam.ac.uk](https://www.botanic.cam.ac.uk/the-garden/plant-list/rosa-moschata/) |
| 45 | 보리 | `bstory-barley-shoe-size-barleycorn` | 신발 치수는 보리 낟알에서 왔습니다 | england | 14c-modern | history | repeated | other | [satra.com](https://www.satra.com/bulletin/article.php?id=3230) |
| 46 | 아르메리아 | `bstory-armeria-thrift-threepence` | 동전에 새겨진 말장난 | uk | 1930s-1950s | history | repeated | garden | [botsocscot.wordpress.com](https://botsocscot.wordpress.com/2022/07/10/plant-of-the-week-11th-july-2022-thrift-armeria-maritima-mill-willd/) |
| 47 | 아르메리아 | `bstory-armeria-mine-spoil-metal` | 광산 폐석 더미에 피는 꽃 | scotland | modern | history | repeated | garden | [botsocscot.wordpress.com](https://botsocscot.wordpress.com/2022/07/10/plant-of-the-week-11th-july-2022-thrift-armeria-maritima-mill-willd/) |
| 48 | 밤꽃 | `bstory-chestnut-town-name-castania` | 마을 이름이 그대로 나무 이름이 됐습니다 | greece | ancient-modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/castanea-sativa/) |
| 49 | 낙엽송 | `bstory-larch-conifer-that-undresses` | 겨울마다 옷을 다 벗는 침엽수 | europe | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/larix-decidua/) |
| 50 | 느릅나무 | `bstory-elm-dutch-disease-women` | 네덜란드 병이라는 이름의 진짜 주인 | netherlands | 1920s | history | repeated | paper | [auf.isa-arbor.com](https://auf.isa-arbor.com/content/1/6/107) |
| 51 | 느릅나무 | `bstory-elm-okc-survivor-tree` | 주차장에 그늘을 드리우던 나무 | usa | 1990s-modern | history | repeated | museum | [memorialmuseum.com](https://memorialmuseum.com/experience/the-survivor-tree/) |
| 52 | 수양버들 | `bstory-willow-wanggeon-leaf-in-water` | 물 위에 띄운 버들잎 한 장 | korea | 10c | folklore | varies | newspaper | [atlasnews.co.kr](http://www.atlasnews.co.kr/news/articleView.html?idxno=10738) |
| 53 | 수양버들 | `bstory-willow-napoleon-cuttings` | 무덤 곁 버드나무의 후손들 | saint-helena | 19c-modern | history | varies | garden | [babylonstoren.com](https://babylonstoren.com/blog/post/napoleons-willow) |
| 54 | 산옥잠화 | `bstory-hosta-host-not-a-lily` | 백합도 원추리도 아닌 이름 | global | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/hosta-plantaginea/) |
| 55 | 아몬드 | `bstory-almond-van-gogh-nephew` | 조카가 태어난 소식을 듣고 그린 가지 | france-netherlands | 19c | history | repeated | museum | [vangoghmuseum.nl](https://www.vangoghmuseum.nl/en/collection/s0176v1962) |
| 56 | 독당근 | `bstory-hemlock-coniine-killer` | 소크라테스를 죽인 분자 | greece | ancient-modern | history | repeated | paper | [ncbi.nlm.nih.gov](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6150177/) |
| 57 | 독당근 | `bstory-hemlock-poison-parsley-names` | 이름부터가 경고문입니다 | europe | modern | history | repeated | paper | [ncbi.nlm.nih.gov](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6150177/) |
| 58 | 박하 | `bstory-mint-minthe-trampled` | 밟혀서 향이 된 님프 | greece | ancient | folklore | varies | book-pd | [theoi.com](https://www.theoi.com/Nymphe/NympheMinthe.html) |
| 59 | 콩꽃 | `bstory-bean-pythagoras-forbade` | 콩을 금지한 철학자 | greece | 6c-bc | history | repeated | paper | [plato.stanford.edu](https://plato.stanford.edu/entries/pythagoras/) |
| 60 | 콩꽃 | `bstory-bean-diogenes-forbidden-list` | 금지 목록에 함께 오른 것들 | greece | 3c | literary | repeated | book-pd | [en.wikisource.org](https://en.wikisource.org/wiki/Lives_of_the_Eminent_Philosophers/Book_VIII) |
| 61 | 아스파라거스 | `bstory-asparagus-pee-anosmia` | 냄새를 못 맡는 사람이 더 많았습니다 | usa | 2010s | history | repeated | paper | [bmj.com](https://www.bmj.com/content/355/bmj.i6071) |
| 62 | 치자나무 | `bstory-gardenia-billie-holiday-burn` | 머리를 태운 밤에 꽂은 꽃 | usa | 1930s-1940s | history | varies | magazine | [graziamagazine.com](https://graziamagazine.com/articles/billie-holiday-hair/) |
| 63 | 치자나무 | `bstory-gardenia-alexander-garden-name` | 재스민이 아닌데 재스민이라 불립니다 | usa-china | 18c-modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/gardenia-jasminoides/) |
| 64 | 벚꽃난 | `bstory-hoya-not-cherry-not-orchid` | 벚꽃도 아니고 난초도 아닙니다 | global | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/hoya-carnosa/) |
| 65 | 당아욱 | `bstory-mallow-marshmallow-root` | 마시멜로는 원래 뿌리였습니다 | egypt-france | ancient-19c | history | repeated | magazine | [mentalfloss.com](https://www.mentalfloss.com/food/candy/long-sweet-history-marshmallows) |
| 66 | 금영화 | `bstory-california-poppy-two-friends` | 서로의 이름을 꽃에 붙인 두 사람 | usa-germany | 19c | history | repeated | museum | [nps.gov](https://www.nps.gov/articles/adelbert-von-chamisso.htm) |
| 67 | 꽃아카시아나무 | `bstory-robinia-oldest-tree-in-paris` | 파리에서 가장 늙은 나무 | france | 17c-modern | history | repeated | other | [thetreeographer.com](https://thetreeographer.com/2018/04/06/oldest-tree-in-paris-robinia-of-square-rene-viviani/) |
| 68 | 우엉 | `bstory-burdock-velcro-dog-walk` | 개털에 붙은 씨앗을 현미경으로 봤습니다 | switzerland | 1940s-1950s | history | repeated | museum | [invent.org](https://www.invent.org/blog/inventors/walk-in-the-woods-velcro) |
| 69 | 우엉 | `bstory-burdock-weed-and-vegetable` | 누구에겐 잡초, 누구에겐 반찬 | north-america | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/arctium-lappa/) |
| 70 | 금작화 | `bstory-broom-plantagenet-sprig` | 왕조 이름이 된 나뭇가지 | england-france | 12c | history | varies | wiki | [encyclopedia.com](https://www.encyclopedia.com/people/history/british-and-irish-history-biographies/plantagenet) |
| 71 | 흑종초 | `bstory-nigella-love-and-devil` | 안개 속의 사랑, 덤불 속의 악마 | england | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/nigella-damascena/) |
| 72 | 무화과 | `bstory-fig-ficus-ruminalis-she-wolf` | 늑대가 젖을 먹인 자리의 무화과 | rome | ancient | history | repeated | book-pd | [penelope.uchicago.edu](https://penelope.uchicago.edu/Thayer/E/Gazetteer/Places/Europe/Italy/Lazio/Roma/Rome/_Texts/PLATOP*/Ficus_Ruminalis.html) |
| 73 | 무화과 | `bstory-fig-flowers-inside` | 꽃은 열매 안쪽에 핍니다 | global | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/ficus-carica/) |
| 74 | 공작고사리 | `bstory-adiantum-unwetted` | 젖지 않는다는 뜻의 이름 | global | ancient-modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/adiantum-pedatum/) |
| 75 | 꽃고비 | `bstory-polemonium-two-names` | 야곱의 사다리라 불리는 풀 | north-america | modern | history | varies | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/polemonium-reptans/) |
| 76 | 복사꽃 | `bstory-peach-taoyuan-oath` | 복숭아밭에서 맺은 의형제 | china | 14c | literary | repeated | book-pd | [ctext.org](https://ctext.org/sanguo-yanyi/ch1) |
| 77 | 페르시아 국화 | `bstory-coreopsis-not-persian` | 페르시아에서 오지 않았습니다 | north-america | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/coreopsis-tinctoria/) |
| 78 | 흰나팔꽃 | `bstory-morning-glory-edo-henka-asagao` | 에도를 뒤흔든 변화 나팔꽃 | japan | 19c | history | repeated | museum | [mg.biology.kyushu-u.ac.jp](http://mg.biology.kyushu-u.ac.jp/hort-history.php) |
| 79 | 흰나팔꽃 | `bstory-morning-glory-kengoshi-seed` | 소를 끌고 와 바꾸던 씨앗 | japan | 8c | history | varies | museum | [mg.biology.kyushu-u.ac.jp](http://mg.biology.kyushu-u.ac.jp/hort-history.php) |
| 80 | 도라지 | `bstory-balloon-flower-akechi-kikyo` | 배신자의 문장이 된 꽃 | japan | 16c | history | varies | magazine | [touken-world.jp](https://www.touken-world.jp/tips/91006/) |
| 81 | 도라지 | `bstory-balloon-flower-balloon-bud` | 터지기 직전의 풍선 | global | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/platycodon-grandiflorus/) |
| 82 | 금사슬나무 | `bstory-laburnum-bodnant-55m` | 오십오 미터짜리 금빛 터널 | wales | 19c-modern | history | repeated | museum | [nationaltrust.org.uk](https://www.nationaltrust.org.uk/visit/wales/bodnant-garden/laburnum-arch-at-bodnant-garden) |
| 83 | 점나도나물 | `bstory-cerastium-cow-horn-capsule` | 이름은 소뿔에서 왔습니다 | global | modern | history | repeated | garden | [plants.ces.ncsu.edu](https://plants.ces.ncsu.edu/plants/cerastium-tomentosum/) |

---

## 4. 이름별 전수 탐색 결과 (79개 전부)

| # | name_ko | 날짜 | 확보 | 결과 / 미확보 사유 |
|---|---|---|---|---|
| 1 | **스노드롭** | 1/1 | **3편** | #1 발칸 농민의 민간요법이 치매약이 됐습니다 · #2 오디세우스가 받은 약초라는 설 · #3 알뿌리 하나가 1,850파운드에 팔렸습니다 |
| 2 | **노루귀** | 1/5 | **1편** | #4 간을 닮았다는 이유로 45만 파운드가 팔렸습니다 |
| 3 | 회양목 | 1/10 | 0편 | 탐색했으나 미확보 — 도장 재료·목판화 판목·베르사유 파르테르 쪽으로 파고들었으나, 회양목을 주어로 삼은 서사를 실은 열람 가능한 출처를 찾지 못했다. NC State 도감 페이지는 열렸지만 어원·일화 서술이 없었다. |
| 4 | **측백나무** | 1/11 | **2편** | #5 괴혈병을 멈춘 나무가 생명의 나무가 됐습니다 · #6 천연기념물 목록의 맨 앞자리 |
| 5 | **향기 알리섬** | 1/12 | **1편** | #7 알리섬이라 부르지만 알리섬이 아닙니다 |
| 6 | **가시** | 1/15 | **1편** | #8 크리스마스에 꽃을 피우는 가시나무 |
| 7 | 수영 | 1/17 | 0편 | 탐색했으나 미확보 — Rumex acetosa 의 신맛(옥살산)과 유럽 수프 전통을 노렸으나 도감 URL 404, 대체 출처 확보 실패. |
| 8 | 어저귀 | 1/18 | 0편 | 탐색했으나 미확보 — Abutilon theophrasti 의 청마(靑麻) 섬유 이용과 북미 밭 잡초로서의 종자 수명을 노렸으나 도감 URL 404. |
| 9 | **소나무** | 1/19 | **1편** | #9 가지를 들어 올려 벼슬을 받은 나무 |
| 10 | 미나리아재비 | 1/20,2/18,3/2 | 0편 | 탐색했으나 미확보 — 턱 밑에 대 보기·꽃잎 거울·라넌쿨루스 어원·정원종 대 야생종은 기존 ranunculus 9편이 이미 전부 쓰고 있다. 남은 각도(방목지 기피·거지의 물집·한국어 이름 유래)를 노렸으나 열람 가능한 출처를 확보하지 못했다. |
| 11 | **담쟁이덩굴** | 1/21 | **2편** | #10 벽에 그려진 잎 하나 · #11 아이비리그라는 말은 기자들이 만들었습니다 |
| 12 | **이끼** | 1/22,1/29 | **2편** | #12 늪에서 걷어 온 붕대 · #13 이끼는 절이 망가진 뒤에 자랐습니다 |
| 13 | 부들 | 1/23 | 0편 | 탐색했으나 미확보 — 모세의 갈대상자(Bulrush) 쪽은 성경의 bulrush 가 파피루스라 부들(Typha)과 다른 식물이고, 2차대전 구명조끼 충전재 이야기는 열람 가능한 1차 출처를 못 찾았다. 도감 페이지는 열렸으나 통용명 나열뿐이었다. |
| 14 | 가을에 피는 사프란 | 1/24 | 0편 | 탐색했으나 미확보 — 사프란 소재는 기존 stories.csv 의 crocus 4편(단일 클론·뉘른베르크 사프란 검사·문트 도로·콜키쿰 함정)과 정면으로 겹친다. 겹치지 않는 각도(1374년 바젤 사프란 전쟁, 새프런월든 지명)를 노렸으나 스위스 역사사전이 403, 나머지는 검색 수단이 끊겨 URL 을 특정하지 못했다. |
| 15 | **점나도나물** | 1/25 | **1편** | #83 이름은 소뿔에서 왔습니다 |
| 16 | **미모사** | 1/26 | **2편** | #14 찬장 속에서도 잎을 여닫았습니다 · #15 떨어뜨려도 더는 잎을 접지 않았습니다 |
| 17 | **마가목** | 1/27 | **2편** | #16 마가목과 붉은 실 · #17 토르를 건져 올린 나무 |
| 18 | **검은 포플라** | 1/28 | **2편** | #18 울다가 나무가 된 자매들 · #19 영국에 남은 암나무는 육백 그루입니다 |
| 19 | **매쉬 메리골드** | 1/30 | **1편** | #20 메리골드가 아닌 메리골드 |
| 20 | 모과 | 2/2 | 0편 | 탐색했으나 미확보 — '과일전 망신은 모과가 시킨다', '모과는 세 번 놀란다' 속담의 출전을 국립국어원·민속대백과 쪽에서 찾으려 했으나 검색 수단이 끊긴 뒤로는 항목 ID 를 특정할 방법이 없었다. |
| 21 | 황새냉이 | 2/3,3/7 | 0편 | 탐색했으나 미확보 — Cardamine pratensis 의 뻐꾹꽃·레이디스목 전승과 셰익스피어 대목을 노렸으나 도감·보전단체 페이지가 모두 404 였다. |
| 22 | **양치** | 2/5 | **2편** | #21 고사리 씨앗을 쥐면 투명해집니다 · #22 주나라 곡식을 안 먹겠다며 캐 먹은 것 |
| 23 | 바위솔 | 2/6 | 0편 | 탐색했으나 미확보 — 와송(瓦松)이 기와지붕에 자란다는 전승과 한 번 꽃 피고 죽는 생활사를 노렸다. 도감 URL 이 404 였고 한국 쪽 공신력 출처는 검색 없이 URL 을 특정하지 못했다. |
| 24 | **범의귀** | 2/8 | **1편** | #23 바위를 깨는 풀이라는 이름 |
| 25 | **은매화** | 2/9 | **2편** | #24 1845년 꽃다발에서 잘라 낸 가지 하나 · #25 사랑의 여신에게 바쳐진 나무 |
| 26 | **서향** | 2/10 | **1편** | #26 월계수의 이름을 쓰는 월계수 아닌 나무 |
| 27 | **멜리사** | 2/11 | **2편** | #27 1611년 파리 수도원이 만든 물 · #28 벌을 붙잡아 두는 풀 |
| 28 | 쥐꼬리망초 | 2/12 | 0편 | 탐색했으나 미확보 — 속명 Justicia 의 유래(스코틀랜드 원예가 제임스 저스티스)를 노렸으나 열람 가능한 출처를 확보하지 못했다. |
| 29 | **갈풀** | 2/13 | **1편** | #29 정원에서 나가 늪을 덮었습니다 |
| 30 | **카모밀레** | 2/14 | **2편** | #30 말썽 부린 밤에 먹인 차 · #31 밟힐수록 잘 자란다는 말 |
| 31 | **삼나무** | 2/15 | **2편** | #32 나라 하나를 재채기하게 만든 조림 사업 · #33 천 년이 기준선인 숲 |
| 32 | **월계수** | 2/16 | **2편** | #34 붙잡히기 직전에 나무가 됐습니다 · #35 노벨상 수상자라는 말에 들어 있는 잎 |
| 33 | 야생화 | 2/17 | 0편 | 탐색했으나 미확보 — 특정 종이 아니라 총칭이라 '이 꽃의 이야기'로 성립하는 소재를 세우기 어려웠다. 밀레니엄 시드뱅크·영국 초지 소실 같은 후보는 총칭 항목에 붙이기에 억지라 접었다. |
| 34 | **떡갈나무** | 2/19 | **2편** | #36 왕이 하루를 보낸 나무 · #37 잎 소리를 듣고 신탁을 읽었습니다 |
| 35 | **칼미아** | 2/20 | **1편** | #38 벌이 방아쇠를 당기면 꽃가루가 튑니다 |
| 36 | **네모필라** | 2/21 | **1편** | #39 언덕 하나가 통째로 파랗습니다 |
| 37 | **무궁화** | 2/22 | **2편** | #40 묘목 팔만 주를 불태운 사건 · #41 아침에 피고 저녁에 지는 풀 |
| 38 | **살구꽃** | 2/23 | **1편** | #42 진료비 대신 살구나무를 심게 했습니다 |
| 39 | **빙카** | 2/24,4/10 | **1편** | #43 삼십 년 만에 알아본 꽃 |
| 40 | **사향장미** | 2/25 | **1편** | #44 사라진 줄 알았던 장미를 남의 정원에서 찾았습니다 |
| 41 | 아도니스 | 2/26,4/6 | 0편 | 탐색했으나 미확보 — 신화의 아도니스 꽃은 아네모네이고 기존 anemone 8편이 이미 그 피 이야기를 쓰고 있다. 겹치지 않는 각도(복수초 Adonis amurensis 의 발열, 영국 밭 잡초 Adonis annua)를 노렸으나 도감 URL 404, 보전단체 페이지도 404. |
| 42 | 아라비아의 별 | 2/27 | 0편 | 탐색했으나 미확보 — Ornithogalum arabicum 도감 URL 이 404 였고, 열왕기하의 '비둘기 똥' 해석 같은 후보는 다른 종(O. umbellatum)에 붙는 이야기라 접었다. |
| 43 | **보리** | 2/28 | **1편** | #45 신발 치수는 보리 낟알에서 왔습니다 |
| 44 | **아르메리아** | 2/29 | **2편** | #46 동전에 새겨진 말장난 · #47 광산 폐석 더미에 피는 꽃 |
| 45 | 자운영 | 3/3,4/18 | 0편 | 탐색했으나 미확보 — 녹비 작물로서의 역사와 일본 렌게 문화를 노렸으나 열람 가능한 출처를 확보하지 못했다. |
| 46 | 나무딸기 | 3/4 | 0편 | 탐색했으나 미확보 — Rubus idaeus 의 종소명이 이다산 님프에서 왔다는 전승을 확인하려고 도감을 열었으나 해당 서술이 없었다. 대체 출처(위스콘신 익스텐션)는 404, 브리태니커는 403. |
| 47 | **밤꽃** | 3/8 | **1편** | #48 마을 이름이 그대로 나무 이름이 됐습니다 |
| 48 | **낙엽송** | 3/9 | **1편** | #49 겨울마다 옷을 다 벗는 침엽수 |
| 49 | **느릅나무** | 3/10 | **2편** | #50 네덜란드 병이라는 이름의 진짜 주인 · #51 주차장에 그늘을 드리우던 나무 |
| 50 | 씀바귀 | 3/11 | 0편 | 탐색했으나 미확보 — 정월대보름 나물 전승을 노렸다. 한국 쪽 공신력 출처의 항목 ID 를 특정하지 못했다. |
| 51 | **수양버들** | 3/12,4/21 | **2편** | #52 물 위에 띄운 버들잎 한 장 · #53 무덤 곁 버드나무의 후손들 |
| 52 | **산옥잠화** | 3/13 | **1편** | #54 백합도 원추리도 아닌 이름 |
| 53 | **아몬드** | 3/14,4/1 | **1편** | #55 조카가 태어난 소식을 듣고 그린 가지 |
| 54 | **독당근** | 3/15 | **2편** | #56 소크라테스를 죽인 분자 · #57 이름부터가 경고문입니다 |
| 55 | **박하** | 3/16 | **1편** | #58 밟혀서 향이 된 님프 |
| 56 | **콩꽃** | 3/17 | **2편** | #59 콩을 금지한 철학자 · #60 금지 목록에 함께 오른 것들 |
| 57 | **아스파라거스** | 3/18 | **1편** | #61 냄새를 못 맡는 사람이 더 많았습니다 |
| 58 | **치자나무** | 3/19 | **2편** | #62 머리를 태운 밤에 꽂은 꽃 · #63 재스민이 아닌데 재스민이라 불립니다 |
| 59 | **벚꽃난** | 3/21 | **1편** | #64 벚꽃도 아니고 난초도 아닙니다 |
| 60 | **당아욱** | 3/22 | **1편** | #65 마시멜로는 원래 뿌리였습니다 |
| 61 | **금영화** | 3/24 | **1편** | #66 서로의 이름을 꽃에 붙인 두 사람 |
| 62 | 덩굴성 식물 | 3/25 | 0편 | 탐색했으나 미확보 — 다윈의 『덩굴식물의 운동과 습성』(1875)을 정면 소재로 삼으려 했으나 Darwin Online 은 SSL 핸드셰이크 타임아웃, 다윈 서신 프로젝트 페이지는 404 였다. 총칭 항목이라는 한계도 겹친다. |
| 63 | 칼세올라리아 | 3/27 | 0편 | 탐색했으나 미확보 — 티에라델푸에고의 Calceolaria uniflora(다윈의 슬리퍼)와 새가 흰 부분을 쪼아 먹으며 수분하는 이야기를 노렸으나 도감 URL 404, 대체 출처 확보 실패. |
| 64 | **꽃아카시아나무** | 3/28 | **1편** | #67 파리에서 가장 늙은 나무 |
| 65 | **우엉** | 3/29 | **2편** | #68 개털에 붙은 씨앗을 현미경으로 봤습니다 · #69 누구에겐 잡초, 누구에겐 반찬 |
| 66 | **금작화** | 3/30,4/8 | **1편** | #70 왕조 이름이 된 나뭇가지 |
| 67 | **흑종초** | 3/31 | **1편** | #71 안개 속의 사랑, 덤불 속의 악마 |
| 68 | **무화과** | 4/5 | **2편** | #72 늑대가 젖을 먹인 자리의 무화과 · #73 꽃은 열매 안쪽에 핍니다 |
| 69 | **공작고사리** | 4/7 | **1편** | #74 젖지 않는다는 뜻의 이름 |
| 70 | **꽃고비** | 4/11 | **1편** | #75 야곱의 사다리라 불리는 풀 |
| 71 | **복사꽃** | 4/12 | **1편** | #76 복숭아밭에서 맺은 의형제 |
| 72 | **페르시아 국화** | 4/13 | **1편** | #77 페르시아에서 오지 않았습니다 |
| 73 | **흰나팔꽃** | 4/14 | **2편** | #78 에도를 뒤흔든 변화 나팔꽃 · #79 소를 끌고 와 바꾸던 씨앗 |
| 74 | 펜 오키드 | 4/15 | 0편 | 탐색했으나 미확보 — Liparis loeselii 의 영국 사구 개체군 급감과 빗방울 자가수분을 노렸으나 열람 가능한 출처를 확보하지 못했다. |
| 75 | 배나무 | 4/20 | 0편 | 탐색했으나 미확보 — 이조년의 시조 「이화에 월백하고」와 베르사유 왕실 텃밭의 배 육종을 노렸다. 한국 고전 DB 항목 ID 를 특정하지 못했고, 도감 페이지에는 일화가 없었다. |
| 76 | **도라지** | 4/23 | **2편** | #80 배신자의 문장이 된 꽃 · #81 터지기 직전의 풍선 |
| 77 | 중국 패모 | 4/25 | 0편 | 탐색했으나 미확보 — 칼 페테르 툰베리와 데지마 채집 이야기를 노렸다. 린네 학회·웁살라대 페이지가 모두 404 였고 도감에도 해당 종 항목이 없었다. |
| 78 | 논냉이 | 4/26 | 0편 | 탐색했으나 미확보 — Cardamine lyrata 는 수초 시장에서 유통되는 종이라 원예 정보는 많지만, 이야기로 세울 만한 전승·역사 기록을 찾지 못했다. |
| 79 | **금사슬나무** | 4/30 | **1편** | #82 오십오 미터짜리 금빛 터널 |

### 4-1. 미확보 22개 이름에 공통으로 걸린 것

조사 도중 **웹 검색 도구의 세션 예산이 소진**됐다(200/200). 그 뒤로는 검색 없이,
① 이미 확보한 검색 결과, ② URL 규칙을 아는 사이트(theoi·Perseus·ctext·Project Gutenberg·Wikisource·NC State 도감·국가유산포털·한국민족문화대백과사전),
③ 직접 요청으로 존재를 확인할 수 있는 주소만으로 조사를 이어 갔다.
미확보 22개 중 **대략 절반은 소재 자체가 없어서**이고, **나머지 절반은 소재는 아는데 그 소재를 실은 페이지의 주소를 특정하지 못해서**다.
후자는 검색이 복구되면 그대로 다시 집어 올 수 있는 것들이라 §7 에 목록으로 남겼다.

---

## 5. 이름 함정을 몸통으로 쓴 9편

`birth_flowers.csv` 의 `editorial_note` 는 이미 여러 날에 대해 "도감 비연결" 경고를 달아 두었다.
그 경고를 각주로 숨기는 대신 **이야기의 주제로 끌어올린 행**이 아래 9편이다.

| # | name_ko | 함정 |
|---|---|---|
| 20 | 매쉬 메리골드 | 이름에 메리골드가 들어 있지만 국화과가 아니라 미나리아재비과다. 출처 자체가 "이 이름은 오해를 부른다"고 적어 놓았다 |
| 26 | 서향 | 학명 Daphne 는 월계수가 된 님프의 이름이고 별명도 Spurge Laurel 인데, 팥꽃나무과의 독초다 |
| 54 | 산옥잠화 | 표에 붙은 영문명 Day Lily 가 어긋난다. 옥잠화속은 백합속도 원추리속도 아니고 비짜루과다 |
| 64 | 벚꽃난 | 벚나무도 난초도 아니다. 협죽도과의 상록 착생 덩굴이다. 표의 영문명 Honey-Plant 만 정확하다 |
| 63 | 치자나무 | Cape Jasmine 이라 불리지만 재스민(물푸레나무과)이 아니라 꼭두서니과, 커피와 한집안이다 |
| 77 | 페르시아 국화 | 페르시아와 무관한 북아메리카 대평원 원산이다 |
| 7 | 향기 알리섬 | 부르는 이름(알리섬)과 적히는 이름(Lobularia)이 다르다 |
| 71 | 흑종초 | 같은 꽃에 "안개 속의 사랑"과 "덤불 속의 악마"라는 정반대 별명이 붙어 있다 |
| 22 | 양치 | 사기의 采薇 를 우리말로 오래 "고사리"라 옮겨 왔지만, 그 풀의 비정은 고사리와 살갈퀴로 갈린다 |

**본문에는 못 넣고 `editorial_note` 에만 적어 둔 함정**도 여러 개다 — 느릅나무에 붙은 Hackberry(팽나무) 어긋남(#50),
빙카(Vinca)와 마다가스카르 일일초(Catharanthus)의 구분(#43), 담쟁이덩굴(Parthenocissus)과 아이비(Hedera)의 구분(#11),
삼나무(Cryptomeria)와 개잎갈나무속(Cedrus)의 구분(#32), 당아욱(Malva)과 마시멜로 원료(Althaea)의 구분(#65),
꽃아카시아나무(Robinia)와 아카시아(Acacia)의 구분(#67), 낙엽송(한국은 대개 Larix kaempferi)의 구분(#49),
꽃고비의 북미종(P. reptans)과 한국종(P. caeruleum) 구분(#75), 흑종초와 블랙 커민(N. sativa)의 구분(#71).

---

## 6. 검증 기록

### 6-1. source_url 전수 HTTP 검증

`content/birth_stories.part1.csv` 의 고유 `source_url` **79개**를 스크립트로 실제 요청했다
(브라우저 User-Agent, 리다이렉트 추종, 실패 시 5초 간격 4회 재시도, 동시 2요청).

**결과: 79/79 가 HTTP 200 이며 본문 500바이트 이상을 반환.**

검증 중 드러난 것 두 가지를 남겨 둔다.

- `bmj.com` 과 `heritage.go.kr` 는 **동시 요청 8개로 돌리면 403 / 연결 리셋**을 낸다. 동시 2요청 + 재시도로 낮추면 정상 200 이다. 나중에 이 CSV 를 다시 검증할 때 동시성을 올리면 오탐이 난다.
- `americanliterature.com` 은 조사 초반에는 200 을 주다가 이후 **계속 403** 으로 바뀌었다. 「마지막 잎새」(#10)의 출처를 프로젝트 구텐베르크의 1907년 단편집 *The Trimmed Lamp*(ebook 3707)으로 **교체**했다. 본문 대조도 구텐베르크 원문으로 다시 했다.

### 6-2. 파일 규격 검증

| 항목 | 결과 |
|---|---|
| 헤더 | `name_ko,story_id,title,hook,story_ko,culture_region,era,story_type,source_kind,source_url,confidence,editorial_note` — 지정과 일치 |
| 인코딩 | UTF-8, **BOM 없음** |
| 줄바꿈 | LF (CRLF 0건) |
| 행 수 | 헤더 1 + 데이터 83 |
| `story_id` 중복 | 0건 |
| `story_id` 접두 | 83개 전부 `bstory-` |
| 파이프(`|`) 포함 필드 | 0건 |
| `name_ko` 대조 | 83행 전부가 `birth_flowers.csv` 의 1~4월 · `flower_id` 공란 이름 집합에 **글자 단위로 일치** |
| `story_ko` 길이 | 최소 256자 · 최대 355자 · 평균 287자 |
| `hook` 길이 | 최소 30자 · 최대 61자 · 평균 47자 |

### 6-3. 기존 `stories.csv` 377편과의 중복 점검

담당 이름 중 기존 도감 종과 소재가 충돌할 위험이 실재한 곳은 세 군데였고, 조사 착수 전에 기존 소재 목록을 확인해 차단했다.

| 위험 지점 | 기존 편수 | 처리 |
|---|---|---|
| 가을에 피는 사프란 ↔ 기존 `crocus` | 4편 (단일 클론 · 뉘른베르크 검사 · 문트 도로 · 콜키쿰 함정) | 겹치지 않는 각도를 못 찾아 **0편으로 두었다** |
| 미나리아재비 ↔ 기존 `ranunculus` | 9편 (턱 밑 버터 · 꽃잎 거울 · 작은 개구리 어원 · 정원종 대 야생종 등) | 남은 각도의 출처를 확보하지 못해 **0편으로 두었다** |
| 아도니스 ↔ 기존 `anemone` | 8편 (아도니스의 피 포함) | 겹치지 않는 각도(복수초·밭 잡초)의 출처를 확보하지 못해 **0편으로 두었다** |

`story_id` 는 전부 `bstory-` 접두를 쓰므로 기존 `story-` 접두와 **구조적으로 충돌하지 않는다**.

---

## 7. 남긴 것 (후속 라운드용)

검색이 복구되면 바로 집어 올 수 있는, **소재는 확정됐는데 주소를 못 잡은** 후보들이다.

| name_ko | 노렸던 소재 | 걸린 곳 |
|---|---|---|
| 나무딸기 | 이다산 님프와 종소명 `idaeus` | 도감에 서술 없음 · 익스텐션 404 · 브리태니커 403 |
| 배나무 | 이조년 「이화에 월백하고」 / 베르사유 왕실 텃밭의 배 육종 | 한국 고전 DB 항목 ID 미특정 |
| 중국 패모 | 칼 페테르 툰베리와 데지마 | 린네 학회·웁살라대 페이지 404 |
| 덩굴성 식물 | 다윈 『덩굴식물의 운동과 습성』(1875) | Darwin Online SSL 타임아웃 · 서신 프로젝트 404 |
| 칼세올라리아 | 다윈의 슬리퍼(*C. uniflora*)와 새 수분 | 도감 404 |
| 아도니스 | 복수초(*A. amurensis*)의 발열 / 영국 밭 잡초 *A. annua* | 도감 404 · 보전단체 404 |
| 우엉(3편째) | 사우스퀸즈페리의 Burry Man 축제 | 스코츠맨·Historic UK 404 |
| 밤꽃(2편째) | 시칠리아 백마(百馬) 밤나무 | 두 후보 사이트 모두 SSL 인증서 실패 · 403 |
| 소나무(2편째) | 그레이트베이슨의 브리슬콘 '프로메테우스' 벌목(1964) | NPS 페이지 404 |
| 범의귀(2편째) | 윌리엄 카를로스 윌리엄스 「A Sort of a Song」 | Poetry Foundation·poets.org 404 |
| 무화과(3편째) | 서기 58년 루미날리스가 시들었다는 타키투스 기록 | 지형사전 항목에 해당 서술 없음 |
| 아스파라거스(2편째) | 아우구스투스의 "아스파라거스 삶는 것보다 빨리" | 페르세우스 수에토니우스 87장 영역본에 해당 어휘 없음 |

그리고 **1편짜리 32개 이름**은 두 번째 편을 붙일 자리가 그대로 남아 있다. 상세 화면의 "다른 이야기도 보기"가 빈약해지는 자리라, 다음 라운드의 첫 번째 과제다.
