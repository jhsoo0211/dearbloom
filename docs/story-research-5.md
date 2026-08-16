# 꽃 이야기 리서치 5차 — 정식 도감 확장 15종 채우기 (story-research-5)

## 1. 조사 개요

- **조사일**: 2026-08-16
- **주문**: 정식 도감 확장 배치 1 — 신설 15종에 **꽃당 4편 이상**의 이야기를 붙인다.
- **수집 이야기**: **60편** (15종 × 4편, 편차 없음)
- **적재 결과**: `content/stories.csv` **317행 → 377행**
- **대상 15종**: `sweet-pea` `gladiolus` `dahlia` `zinnia` `aster` `calendula` `cyclamen` `geranium` `primula` `stock` `delphinium` `amaryllis` `cornflower` `crocus` `water-lily`
- **기존 317편과의 중복**: **0건**. 신설 15종은 이야기가 0편이던 자리라 소재 충돌이 원천적으로 적었고, 인접 위험이 실재한 한 곳(기존 `marigold` 9편 ↔ 신규 `calendula`)은 조사 착수 전에 기존 9편의 소재 목록을 조사자에게 배포해 차단했다. 적재 후 `story_id` 중복 0건을 기계 대조로 확인했다.
- **모든 `source_url`은 실제로 열어 본문을 확인**했다. 열람 실패(403·429·쿠키월·본문 미로딩)한 후보는 전부 빼고 §6에 사유와 함께 남겼다.

### 1-1. 이번 라운드가 노린 것

1. **편차 없이 4편씩.** 15종 전부를 정확히 4편으로 맞췄다. 한 종이라도 3편이면 그 꽃의 상세 화면은 "다른 이야기도 보기"가 빈약해지고, 랜딩 리드(§1.5n)가 날짜를 바꿔도 같은 훅을 반복하게 된다. 편수의 균질함 자체가 이번 라운드의 첫 번째 목표였다.
2. **이름 함정을 정면으로 다뤘다.** 이번 15종은 **이름 혼동이 유난히 심한 무리**다 — 백일홍 대 목백일홍, 금잔화 대 마리골드, 아마릴리스 대 히페아스트룸, 제라늄 대 펠라고늄, 과꽃 대 아스터속, 수련 대 연꽃, 크로커스 대 콜키쿰, 질리플라워 대 카네이션. 이걸 각주로 숨기는 대신 **함정 자체를 이야기의 몸통으로 쓴 행을 8편** 세웠다(§5).
3. **도파민 우선.** 우주에서 처음 핀 꽃, 파스타를 삶다 떠오른 발아법, 백팔십 년째 미지급 상금, 십오 분 만의 평결, 서른아홉 해를 잔 씨앗. 신뢰도 최상급보다 이야기로서의 매력을 먼저 봤고, 그 대가로 사실을 부풀리지는 않았다.
4. **위키 1.7%.** 신규 60편 중 위키 계열은 1편이다(§2-1).

### 1-2. 저작권 처리 원칙 (1~4차와 동일)

- **타 사이트 문장을 옮긴 곳은 한 군데도 없다.** `story_ko`는 전부 사실관계만 참고해 새로 쓴 우리 문장이다(한국어 해요체, 평균 351자).
- 설화·역사적 사실 자체는 아이디어라 저작권 대상이 아니다. 표현만 새로 쓰면 자유롭게 쓸 수 있다.
- 원문 인용이 필요한 대목은 **퍼블릭 도메인 자료**에 한해, **직접 인용부호 없이 우리말로 옮겨** 실었다 — 테오크리토스 「세레나데」(BC 3c), 오비디우스 『변신 이야기』(1c), 제라드 『Herball』(1597), 피에스 『The Art of Perfumery』(19c), 하워드 카터의 발굴 기록(1920s).
- **confidence 라벨** (1~4차와 동일 기준)
  - `repeated` — 여러 독립 출처에서 반복 확인되는 정설/사실
  - `varies` — 전승은 널리 알려졌으나 버전이 갈리거나 출처가 한 계열에 몰림
  - `single_source` — 출처가 하나뿐

---

## 2. 이번 라운드 지표

### 2-1. source_kind 분포 — 위키 1.7%

| source_kind | 뜻 | 편수 | 비중 |
|---|---|---|---|
| `museum` | 박물관·기록원·공공기관·대학 아카이브 | 17 | 28.3% |
| `garden` | 식물원·대학 익스텐션·농업/독성 기관 | 13 | 21.7% |
| `magazine` | 잡지·칼럼·전문 매체 | 9 | 15.0% |
| `other` | 위 어디에도 넣기 어려운 것 | 6 | 10.0% |
| `paper` | 학술 논문 | 5 | 8.3% |
| `book-pd` | 퍼블릭 도메인 고서 원문 | 5 | 8.3% |
| `newspaper` | 신문 | 4 | 6.7% |
| `wiki` | 위키·백과사전·정리 사이트 | 1 | 1.7% |
| **합계** | | **60** | **100%** |

> **`wiki` 1편의 정체.** #7 `story-zinnia-baegilhong-legend-tree`의 출처인 한국민족문화대백과사전(한국학중앙연구원)이다. 3차 라운드가 같은 사전을 `wiki`로 분류한 선례를 그대로 따랐다. **영문 위키피디아 직접 인용은 이번 라운드에도 0편이다.**
>
> 전체 377편 기준 `wiki`는 166편(44.0%)으로, 4차 시점의 52.1%에서 더 내려갔다. 여전히 높은 것은 1·2차 유산이다.

### 2-2. 문화권 분포 (26종 값)

| 문화권 묶음 | 편수 | culture_region 값 |
|---|---|---|
| 영국·아일랜드 제도 | 15 | `england`(9) `uk`(5) `scotland` |
| 동아시아 | 9 | `japan`(6) `korea`(2) `china` |
| 서유럽·남유럽 | 11 | `france`(4) `germany`(3) `italy`(2) `netherlands`(2) |
| 북유럽·알프스·발트 | 3 | `sweden` `switzerland` `estonia` |
| 아프리카 | 7 | `south-africa`(4) `egypt`(2) `rwanda` |
| 아메리카 | 7 | `usa`(4) `mexico`(2) `navajo` |
| 지중해 고전·중동 | 5 | `greece`(2) `greece-rome` `israel` `turkey` |
| 그 밖 | 3 | `australia` `hungary` `uk-south-africa` |
| **합계** | **60** | **26종** |

**신규 문화권 값 8종**: `australia` `egypt` `estonia` `hungary` `navajo` `rwanda` `sweden` `switzerland`. 전체 데이터셋의 `culture_region` 값은 이로써 **106종**이 됐다.

> **`navajo`에 대해.** 아메리카 원주민 문화를 국가명으로 뭉개지 않기 위해 3·4차의 `aztec` 선례를 따라 민족 이름을 그대로 값으로 썼다. `uk-south-africa`는 영국 법정과 남아공 약초가 한 이야기 안에서 갈리지 않아 4차의 `russia-usa` 선례를 따랐다.

### 2-3. 꽃별 편수 — 15종 × 4편

| 꽃 | 편수 | 문화권 |
|---|---|---|
| `water-lily` | 4 | france · egypt · rwanda · uk |
| `zinnia` | 4 | usa · mexico · korea · japan |
| `dahlia` | 4 | mexico · sweden · uk · netherlands |
| `gladiolus` | 4 | netherlands · australia · south-africa ×2 |
| `crocus` | 4 | greece · germany · switzerland · uk |
| `cornflower` | 4 | egypt · france · estonia · hungary |
| `sweet-pea` | 4 | italy · england · scotland · japan |
| `primula` | 4 | japan · england ×2 · germany |
| `aster` | 4 | korea · japan · china · usa |
| `amaryllis` | 4 | usa · uk · greece · south-africa |
| `cyclamen` | 4 | england · israel · japan · turkey |
| `geranium` | 4 | uk-south-africa · france · south-africa · uk |
| `calendula` | 4 | england ×2 · germany · france |
| `stock` | 4 | italy · england ×2 · japan |
| `delphinium` | 4 | greece-rome · england · usa · navajo |

**한 꽃 안에서도 문화권을 흩었다.** 같은 꽃의 4편이 전부 같은 나라인 경우는 없다.

### 2-4. story_type / confidence / mood / intent

| story_type | 편수 | | confidence | 편수 |
|---|---|---|---|---|
| `history` | 50 | | `repeated` | 43 |
| `folklore` | 5 | | `varies` | 10 |
| `literary` | 5 | | `single_source` | 7 |
| `original` | 0 | | | |

`original`(창작)은 0편이다. **이번 라운드에 지어낸 이야기는 없다.**

`single_source` 7편 중 **5편이 공신력 원천**(garden 2 · museum 2 · book-pd 1 · paper 1 중복 계산 없이 5)이라 화면 문구는 "기록으로 남아 있는 이야기예요"로 갈린다. 전체 377편 기준으로는 single_source 52편 중 37편(71.2%)이 공신력 원천이다 — `tests/seed/schemas.test.ts`가 지키는 50% 선을 여유 있게 넘는다.

| mood | 편수 | | intent | 편수 |
|---|---|---|---|---|
| healing | 30 | | just_because | 46 |
| dramatic | 28 | | comfort | 15 |
| funny | **26** | | gratitude | 12 |
| mythic | 16 | | celebration | 11 |
| tragic | 11 | | confession | 4 |
| romantic | 9 | | anniversary | 1 |

6종 mood 전부 커버. intent는 6종을 채웠고 **`apology`가 0편**이다 — 사과 자리에 놓을 만한 소재가 이번 15종에서는 나오지 않았다(§7 후속 과제).

---

## 3. 이야기 표

> 컬럼: `# | story_id | 제목 | hook | culture_region | era | type | conf | source | source_kind`
> `story_ko` 본문은 `content/stories.csv`에 그대로 실려 있어 여기서는 생략하고, **판정 근거**를 각 절 끝에 모았다.
> 번호(#1~#60)는 각 행의 `editorial_note`에 그대로 적혀 있다.

### 3-1. water-lily · zinnia · dahlia — 12편

| # | story_id | 제목 | hook | region | era | type | conf | source | kind |
|---|---|---|---|---|---|---|---|---|---|
| 1 | story-water-lily-monet-armistice | 휴전 이튿날 총리에게 보낸 편지 | 전쟁이 끝난 다음 날, 화가는 총리에게 그림을 나라에 바치겠다고 편지를 썼습니다. | france | 1910s-1920s | history | repeated | [Georges Clemenceau and Claude Monet (Maison de Clemenceau)](https://www.maison-de-clemenceau.fr/en/discover/the-many-facets-of-georges-clemenceau/georges-clemenceau-and-claude-monet) | museum |
| 2 | story-water-lily-blue-lotus-not-lotus | 파라오의 로터스는 연꽃이 아니었습니다 | 투탕카멘의 몸을 덮은 푸른 로터스는 연꽃이 아니라 수련입니다. | egypt | ancient-modern | history | repeated | [Investigating the psychedelic blue lotus of Egypt (UC Berkeley News)](https://news.berkeley.edu/2025/03/11/investigating-the-psychedelic-blue-lotus-of-egypt-where-ancient-magic-meets-modern-science/) | museum |
| 3 | story-water-lily-thermarum-tortellini | 파스타를 삶다가 떠올린 방법 | 세상에서 가장 작은 수련은 파스타를 삶던 원예가의 생각 하나로 살아남았습니다. | rwanda | modern | history | repeated | [How 'plant messiah' Carlos Magdalena rescues plants (National Geographic)](https://www.nationalgeographic.com/culture/article/carlos-magdalena-nat-geo-33-2025) | magazine |
| 4 | story-water-lily-paxton-annie-leaf | 일곱 살 딸을 수련 잎 위에 세웠습니다 | 만국박람회장의 뼈대는 수련 잎 뒷면에서 왔습니다. | uk | 19c | history | repeated | [To Miss Annie Paxton… Chatsworth, 1849 (Romantic Circles Gallery)](https://romantic-circles.org/gallery/image/miss-annie-paxton-who-drest-fairy-stood-upon-leaf-victoria-regina-chatsworth-1849) | other |
| 5 | story-zinnia-iss-first-bloom | 우주에서 처음 핀 꽃 | 크리스마스이브에 나사는 우주비행사에게 절차서 대신 한 장짜리 안내문을 보냈습니다. | usa | 2010s | history | repeated | [Zinnias From Space! (NASA)](https://www.nasa.gov/humans-in-space/zinnias-from-space-nasa-studies-the-multiple-benefits-of-gardening/) | museum |
| 6 | story-zinnia-mal-de-ojos | 고향에서는 눈엣가시라 불렸습니다 | 지금 여름 화단의 주인공은 고향에서 눈에 거슬리는 것이라 불리던 꽃입니다. | mexico | 16c-19c | history | varies | [Journey of the Zinnia (High Plains Gardening)](http://www.highplainsgardening.com/journey-zinnia) | garden |
| 7 | story-zinnia-baegilhong-legend-tree | 전설 속 백일홍은 이 꽃이 아닙니다 | 백 일을 기다리다 죽은 처녀의 이야기에 나오는 백일홍은, 화단의 백일홍이 아닙니다. | korea | traditional | folklore | varies | [백일홍 설화 (한국민족문화대백과사전)](https://encykorea.aks.ac.kr/Article/E0022302) | wiki |
| 8 | story-zinnia-japan-bon-flower | 오래 간다는 이유로 영전에 올랐습니다 | 일본에서 이 꽃은 화단이 아니라 영전으로 갔습니다. 가장 오래 버티는 꽃이라서요. | japan | 19c-modern | history | repeated | [ヒャクニチソウ｜旬のもの (暦生活)](https://www.543life.com/content/shun/post20240913.html) | magazine |
| 9 | story-dahlia-acocoxochitl-mexico | 물이 든 빈 줄기라 불린 꽃 | 아즈텍이 이 꽃에 붙인 이름은 물이 든 빈 줄기라는 뜻이었습니다. | mexico | ancient-modern | history | repeated | [Dalia, la flor nacional de México (SNICS, Gobierno de México)](https://www.gob.mx/snics/articulos/dalia-la-flor-nacional-de-mexico?idiom=es) | museum |
| 10 | story-dahlia-anders-dahl-never-saw | 자기 이름이 붙은 꽃을 끝내 못 봤습니다 | 달리아라는 이름의 주인은 그 꽃이 이름을 얻기 두 해 전에 죽었습니다. | sweden | 18c | history | repeated | [Anders Dahl (Svenskt biografiskt lexikon, Riksarkivet)](https://sok.riksarkivet.se/sbl/Mobil/Artikel/15769) | museum |
| 11 | story-dahlia-blue-prize-unclaimed | 백팔십 년째 아무도 못 받은 상금 | 파란 달리아를 만들면 이천 파운드를 준다고 했습니다. 상금은 아직 그대로 남아 있습니다. | uk | 19c-modern | history | repeated | [Of Dahlias, Devoted Growers… (Craftsmanship Magazine)](https://craftsmanship.net/of-dahlias-obsessive-growers-and-their-high-stakes-beauty-contests/) | magazine |
| 12 | story-dahlia-one-root-cactus | 상자에서 살아 있던 건 뿌리 한 조각뿐이었습니다 | 캑터스 달리아는 전부 썩은 화물 속에서 살아남은 뿌리 한 조각의 후손입니다. | netherlands | 19c | history | repeated | [The Cactus Dahlia (New Mexico Dahlia Society)](https://nmdahliasociety.org/the-cactus-dahlia/) | garden |

**판정 근거**
- **#1 `repeated`** — 11월 12일 편지·패널 22점·80㎡·오랑주리의 부상병 급식소 이력을 호주 전쟁기념관 자료가 독립 기술. 클레망소의 "모네에게 검정은 안 된다"는 두 곳 모두에 있다.
- **#2 `repeated`** — 버클리 뉴스룸과 예루살렘 포스트가 같은 연구를 각각 보도. **본문에 이름 함정을 두 겹으로 명시**했다(로터스≠연꽃, 시판 블루 로터스≠*N. caerulea*).
- **#3 `repeated`** — 발아법은 내셔널 지오그래픽, 2014-01-09 도난은 AFP·AP가 날짜·개체 수·경찰 발언까지 일치되게 보도.
- **#6 `varies`** — "아즈텍이 눈엣가시로 여겼다"는 영어권 원예 문헌 계열에서 반복되지만 어느 출처도 1차 사료를 대지 않는다. 본문도 "전해져요"로 처리. 학명 연도(자캥 1792)는 별도 확인.
- **#7 `varies` + `folklore`** — 사전 본문이 **전승 계열이 둘로 갈린다고 스스로 밝힌다**. 또 사전 원문은 어느 식물인지 특정하지 않아, 배롱나무와의 결부는 산림청 국립수목원 자료와 통설에 기댄 해석임을 감안해 varies로 내렸다.
- **#9 `repeated`** — 1963년 국화 지정과 acocoxóchitl의 뜻을 멕시코 정부 부처와 현지 방송사가 각각 확인. **"빈 줄기를 물관으로 썼다"는 통설은 미국달리아협회가 나무달리아 쪽 이름으로 본다** — 본문 마지막 문장에 단서를 달았다.
- **#11 `repeated`** — 1846년·2,000파운드는 Dahlia Almanac이 독립 확인. 다만 **주최 단체(칼레도니아 원예협회)는 Craftsmanship 단독**이라 본문은 "에든버러의 한 원예협회"로 적었다.
- **#12 `repeated`** — "덩이줄기 하나만 살아남았다"를 미국달리아협회와 Dahlia Almanac이 각각 기술.

### 3-2. gladiolus · crocus · cornflower — 12편

| # | story_id | 제목 | hook | region | era | type | conf | source | kind |
|---|---|---|---|---|---|---|---|---|---|
| 13 | story-gladiolus-via-gladiola | 일 년에 하루만 생기는 길 | 네덜란드에는 이백 킬로미터를 걸어온 사람들을 위해 일 년에 하루만 이름이 바뀌는 길이 있습니다. | netherlands | modern | history | repeated | [Nijmeegse Vierdaagse (Nederlands Instituut voor Beeld & Geluid)](https://schatkamer.beeldengeluid.nl/verhaal/Nijmeegse-Vierdaagse-geschiedenis-door-de-jaren-heen) | museum |
| 14 | story-gladiolus-dame-edna-throw | 무대의 꽃을 객석으로 던진 날 | 그가 이 꽃을 고른 이유는 예뻐서가 아니라 무신경해 보여서였습니다. | australia | modern | history | repeated | [The man behind the dame (Harvard Gazette)](https://news.harvard.edu/gazette/story/2001/03/the-man-behind-the-dame) | newspaper |
| 15 | story-gladiolus-liliaceus-dusk | 해가 지면 다른 꽃이 됩니다 | 이 글라디올러스는 낮과 밤에 서로 다른 꽃처럼 보입니다. 그것도 날마다요. | south-africa | 18c-modern | history | single_source | [Gladiolus liliaceus (PlantZAfrica, SANBI)](https://pza.sanbi.org/gladiolus-liliaceus) | garden |
| 16 | story-gladiolus-aureus-seed-bank | 냉동고에서 서른아홉 해를 잔 씨앗 | 야생에 열 포기도 남지 않은 꽃의 앞날이, 1976년에 거둔 씨앗 천백 알에 걸려 있었습니다. | south-africa | 19c-modern | history | repeated | [Gladiolus aureus (PlantZAfrica, SANBI)](https://pza.sanbi.org/gladiolus-aureus) | garden |
| 17 | story-crocus-saffron-one-clone | 지구의 사프란은 전부 한 포기의 복제본입니다 | 사프란은 씨를 맺지 못합니다. 삼천오백 년 동안 알뿌리를 쪼개는 방식으로만 이어져 왔습니다. | greece | ancient-modern | history | repeated | [Ancient Artworks and Crocus Genetics… (Frontiers in Plant Science)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8913524/) | paper |
| 18 | story-crocus-nuremberg-safranschau | 사프란을 섞어 판 값 | 중세 뉘른베르크에는 사프란 검사관이 있었고, 위조범에게 내려진 벌은 화형이었습니다. | germany | 15c | history | varies | [Safran: Luxusgewürz und Farbstoff (PTA-Forum)](https://www.pta-forum.de/ausgabe-092012/luxusgewuerz-und-farbstoff/) | magazine |
| 19 | story-crocus-mund-road-revival | 마을을 가른 도로가 살린 사프란 | 스위스에서 사프란이 나는 마을은 딱 하나입니다. 좋은 해에 거두는 양이 이 킬로그램입니다. | switzerland | 19c-modern | history | single_source | [Munder Safran AOP (Patrimoine culinaire suisse)](https://www.patrimoineculinaire.ch/Produkt/Munder-Safran-Safran-de-Mund-AOP/91) | museum |
| 20 | story-crocus-colchicum-not-crocus | 가을 크로커스는 크로커스가 아닙니다 | 진짜 크로커스는 수술이 셋, 사람을 해치는 쪽은 여섯입니다. | uk | ancient-modern | history | repeated | [Colchicum autumnale (Oxford University Herbaria, Plants 400)](https://herbaria.plants.ox.ac.uk/bol/plants400/Profiles/CD/Colchicum) | garden |
| 21 | story-cornflower-tutankhamun-wreath | 황금 앞에서 그를 울린 것 | 무덤을 연 사람의 마음을 움직인 것은 금이 아니라 시든 꽃 몇 송이였습니다. | egypt | ancient-1920s | history | repeated | [Preserving a Fragile Memory (Griffith Institute, Oxford)](https://tutankhamun.griffith.ox.ac.uk/stories/preserving-fragile-memory-funeral-wreath-tutankhamun) | museum |
| 22 | story-cornflower-bleuet-de-france | 놀림말이 추모의 이름이 됐습니다 | 새 군복 때문에 애송이라 불리던 말이, 백 년 넘게 이어진 추모 배지의 이름이 됐습니다. | france | 1910s-modern | history | repeated | [Aux bleuets, citoyens ! (Chemins de mémoire)](https://www.cheminsdememoire.gouv.fr/fr/revue/aux-bleuets-citoyens) | museum |
| 23 | story-cornflower-estonia-tv-vote | 텔레비전 퀴즈로 나라꽃을 골랐습니다 | 후보로 오른 꽃이 서른여덟 종이었고, 뽑힌 꽃의 파랑은 하필 금지된 국기의 파랑이었습니다. | estonia | 1960s-modern | history | repeated | [Estonian national species (Loodusveeb)](https://loodusveeb.ee/en/themes/species-diversity/national-species) | museum |
| 24 | story-cornflower-hungary-seed-saving | 밭에서 사라지자 뜰에 심었습니다 | 밀밭에서 수레국화가 사라지자, 여자들이 씨를 모아 집 앞 뜰에 뿌렸습니다. | hungary | 18c-modern | folklore | repeated | [Iconic Arable Weeds… Hungarian Ethnobotanical Heritage (Plants)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9824376/) | paper |

**판정 근거**
- **#13 `repeated`** — 공영 미디어 아카이브(Beeld & Geluid)와 도보 전문 매체가 각각 확인. **검투사 기원설은 어원에서 역산된 민간전승일 가능성이 커, 본문에 "고대 기록으로 확인되지는 않아요"를 넣었다.**
- **#14 `repeated`** — 하버드 가제트의 본인 직접 인용과 The Art Newspaper 부고 두 건.
- **#15 `single_source`** — SANBI 한 곳. 다만 남아공 국가 생물다양성 기관이고 아프리칸스 통칭(저녁 관·계피 저녁꽃)이 현상과 일치해 신뢰도가 높다. `source_kind=garden`이라 화면 문구는 "기록으로 남아 있는 이야기예요"로 간다.
- **#16 `repeated`** — PlantZAfrica 종 해설과 SANBI 적색목록 평가서에서 수치가 일치(1980~2005년 개체군 85% 감소, 야생 10포기 미만, 1976년 종자 1,100알).
- **#17 `repeated`** — 논문 자체가 2019년 독립 연구 두 편(게놈 시퀀싱·염색체 동정)을 종합한다. **아크로티리 벽화의 종을 재배종으로 볼지 야생종으로 볼지는 자료가 갈려**, 본문은 "사프란을 따는 장면"까지만 적고 종 비정은 하지 않았다.
- **#18 `varies`** — 제도(1357/1441/1852)와 처벌 강도는 확인되지만 **개별 처형 사건의 이름·연도가 연대기 인용마다 다르다**(1444년 Jobst Findeker / 1449년 Jobst Friedenkern). 본문은 "옛 연대기에는 …고 적혀 있어요 / 이름과 연도는 기록마다 조금씩 다르게 전해져요"로 감쌌다.
- **#19 `single_source`** — 스위스 연방 주도 문화유산 인벤토리 한 곳. 관광 매체들이 쓰는 "14세기부터 무중단" 같은 화려한 서술은 **이 공식 인벤토리가 직접 전설이라고 못 박아** 본문에서 그 격차를 그대로 살렸다. 기관 자료라 `source_kind=museum`.
- **#20 `repeated`** — 옥스퍼드대 표본관과 위스콘신대 익스텐션. 두 곳의 **과 분류가 다르지만**(Colchicaceae vs 옛 Liliaceae) 본문은 최신 분류를 따라 "아예 다른 과"로만 적었다.
- **#21 `repeated`** — 그리피스 연구소 아카이브와 학술지 식물 상징 연재. **감정서의 종은 *Centaurea depressa*이지 유럽 수레국화 *C. cyanus*가 아니다** — 본문 마지막 줄에 명시(§5).
- **#22 `repeated`** — 프랑스 정부 두 공식 포털과 교육청 자료. **창설 연도가 1916/1918/1925로 갈려** 본문은 연도를 못 박지 않고 "1차 세계대전 무렵"으로 열어 뒀다.
- **#23 `repeated`** — 에스토니아 정부 자연 포털과 EU 집행위 화폐 페이지(2024년 2유로 기념주화 100만 개). 공식 확정 연도가 1968/1969/1988로 갈려 본문은 국민 선정 시점만 적었다.
- **#24 `repeated` + `folklore`** — 헝가리 민족식물학 논문과 영국 BSBI 종 페이지가 "제초제로 사라졌다가 씨앗 봉지로 돌아왔다"는 같은 궤적을 독립 기술. 옛 약용은 **효능 주장이 아니라 그 시대의 기록**으로만 썼다.

> **의도적으로 뺀 소재 1건.** 1911년 자르브뤼켄 '수레국화의 날' 자선 모금은 사실 관계가 확인됐지만(조화 1송이 10페니히, 하루 22,000마르크), 19세기 프로이센 국가 상징 맥락과 인접하고 **수레국화가 후대 극우 상징으로 전용된 이력**이 있어 이번 라운드에서 제외했다.

### 3-3. sweet-pea · primula · aster — 12편

| # | story_id | 제목 | hook | region | era | type | conf | source | kind |
|---|---|---|---|---|---|---|---|---|---|
| 25 | story-sweet-pea-cupani-1699 | 수도사가 부친 씨앗 한 봉지 | 지금 세상의 모든 스위트피는 1699년 시칠리아에서 부친 씨앗 한 봉지에서 시작됐습니다. | italy | 17c | history | repeated | [Francesco Cupani (Professor Hedgehog's Journal)](https://professorhedgehogsjournal.uk/2019/10/23/francesco-cupani/) | other |
| 26 | story-sweet-pea-countess-spencer-sport | 같은 돌연변이가 세 곳에서 나왔습니다 | 물결치는 꽃잎은 영국 세 곳에서 거의 동시에 나타났고, 이름이 남은 건 백작 저택의 것 하나입니다. | england | 1900s | history | repeated | [The History Of Growing Sweet Peas (PD reprint)](https://chestofbooks.com/gardening-horticulture/Sweet-Peas-Antirrhinums/Part-1-Chapter-1-The-History-Of-Growing-Sweet-Peas.html) | book-pd |
| 27 | story-sweet-pea-kirk-chancel | 상금으로 성단소를 올렸습니다 | 신문사가 내건 상금을 시골 목사 부부가 받아 교회를 늘렸습니다. | scotland | 1910s | history | varies | [Sprouston Kirk (Scotland's Churches Trust)](https://www.scotlandschurchestrust.org.uk/church/sprouston-kirk/) | museum |
| 28 | story-sweet-pea-red-sweet-pea-song | 없는 색의 꽃을 노래한 사람 | 작사가는 나중에야 알았습니다. 자기가 그때 없는 색의 꽃을 노래했다는 것을요. | japan | modern | literary | varies | [「赤いスイートピー」の誕生秘話 (TAP the POP)](https://www.tapthepop.net/imanouta/91737) | magazine |
| 29 | story-primula-sakurasou-edo-stage | 다섯 단에 서른세 화분 | 이백 년 전 에도에서 정해진 앵초 감상법이 지금도 그대로 쓰입니다. | japan | edo-modern | history | repeated | [伝統の桜草 (国立歴史民俗博物館)](https://www.rekihaku.ac.jp/event/2023_plant_kikaku_sakurasou.html) | museum |
| 30 | story-primula-primrose-day-favourite | 그가 가장 좋아하던 꽃 | 여왕은 앵초 화환에 그가 가장 좋아하던 꽃이라 적었습니다. 정작 그는 장미를 그렇게 불렀습니다. | england | victorian | history | repeated | [Disraeli's flowery history (The National Archives)](https://history.blog.gov.uk/2013/04/29/disraelis-flowery-history/) | museum |
| 31 | story-primula-weavers-copper-kettle | 상품은 구리 주전자였습니다 | 십팔 세기 영국 꽃 대회의 상품은 여관 문 앞에 걸어 둔 구리 주전자였습니다. | england | 18c-19c | history | repeated | [The Auriculas of Spitalfields (Spitalfields Life)](https://spitalfieldslife.com/2012/05/13/the-auriculas-of-spitalfields/) | other |
| 32 | story-primula-schluesselblume-peter | 베드로가 떨어뜨린 열쇠 | 독일에서 앵초의 이름은 열쇠꽃입니다. 천국 문 열쇠가 떨어진 자리에 피었다고 전해집니다. | germany | medieval-traditional | folklore | repeated | [Warum Petrus uns die Schlüsselblume schenkte (Servus)](https://www.servus.com/a/g/schluesselblume-pflanzen-standort) | magazine |
| 33 | story-aster-gwakkot-song-1953 | 누나는 과꽃을 좋아했지요 | 과꽃을 노래한 그 동요는 피란지에서 태어났습니다. | korea | 1950s | literary | repeated | [아동문학가 어효선씨 (서울신문)](https://www.seoul.co.kr/news/1993/03/09/19930309017001) | newspaper |
| 34 | story-aster-ezogiku-five-placenames | 지명이 다섯 개나 붙었는데 다 틀렸습니다 | 중국에서 온 꽃에 일본이 붙인 표준 이름은 홋카이도 국화였습니다. | japan | edo-modern | history | varies | [蝦夷菊 (デジタル大辞泉, コトバンク)](https://kotobank.jp/word/%E8%9D%A6%E5%A4%B7%E8%8F%8A-445018) | other |
| 35 | story-aster-callistephus-only-one | 형제가 하나도 없는 속 | 우리가 아스터라고 부르는 과꽃은, 세상에 단 한 종뿐인 속의 유일한 식구입니다. | china | 18c-modern | history | repeated | [Callistephus chinensis (NC State Extension)](https://plants.ces.ncsu.edu/plants/callistephus-chinensis/) | garden |
| 36 | story-aster-yellows-phyllody | 꽃잎이 잎으로 돌아가는 병 | 꽃이 잎으로 되돌아가는 병이 있습니다. 그 병 덕분에 사람은 곤충이 병을 옮긴다는 걸 알게 됐습니다. | usa | 1900s-modern | history | repeated | [Aster Yellows (UW-Madison Extension)](https://hort.extension.wisc.edu/articles/aster-yellows/) | garden |

**판정 근거**
- **#25 `repeated`** — 쿠파니의 생애·미실메리 식물원(1692)·『Hortus Catholicus』(1696)와 유브데일 발송을 두 계열이 확인. **발송 연도가 1699/1700으로 갈려** 본문은 "1699년에 보냈고 이듬해 길렀다"로 나눠 적었다.
- **#26 `repeated`** — 퍼블릭 도메인 원예서가 "같은 계통에서 잉글랜드 여러 지역에 비슷한 시기에 나타났다"고 적는다. 이 옛 책에는 언윈·바이너의 이름이 없어 **본문도 지명만 적고 인명은 넣지 않았다.**
- **#27 `varies`** — 응모 수(36,000 vs 38,000), 상금(£1,000 vs £1,500), 수상자 명의(부인 명의 vs 목사)가 자료마다 어긋난다. **불일치를 감추지 않고 본문 안에서 밝히는 쪽**을 택했다.
- **#28 `varies` + `literary`** — 대중 매체 계열의 통설("1982년엔 붉은 스위트피가 없었다")과 화훼 경매사 연구소의 반박("이미 붉은 계열이 있었다")이 정면으로 갈린다. **그 어긋남 자체가 이 이야기의 재미**라 둘을 나란히 실었다.
- **#29 `repeated`** — 국립역사민속박물관과 도쿄도공원협회가 렌·화투의 낙·5단 33화분·1830년대 사본을 각각 기술.
- **#30 `repeated`** — 화환 전문과 1860년 장미 편지를 국립기록보관소 블로그와 보수당 사가의 글이 각각 확인. **"가장 좋아하던 꽃"의 진위가 당대에도 논쟁거리였다는 점**이 이야기의 축이다.
- **#31 `repeated`** — Spitalfields Life와 남부오리큘라앵초협회가 구리 주전자 상품과 'Florists' Feasts' 형식을 각각 확인. 1795년 셀월·1840년 처치의 인용은 전자에 원문이 있다.
- **#32 `repeated` + `folklore`** — 전승 판본이 여럿이라(열쇠를 놓친 이유가 다름) 두 갈래를 본문에 함께 실었다. 독일어 Schlüsselblume는 보통 *Primula veris*를 가리킨다.
- **#33 `repeated` + `literary`** — 1953년 발표·권길상 작곡·연작 동요는 신문 인물기사와 학술 논문 양쪽에서 확인. **어효선에게 실제 누나가 있었는지는 확인되지 않아 본문에 넣지 않았다.**
- **#34 `varies`** — 원산지와 별명 목록은 사전에서 확정적이지만 **'에조'라는 이름이 붙은 이유가 두 학설로 갈리고** 어느 쪽도 사전에 확정 기술되어 있지 않다.
- **#35 `repeated`** — 단형속·자생지·해발 범위를 중국 과학보급 자료가, 유럽 품종 수를 별도 중국 자료가 확인. **아스트라이아 눈물 전승은 다년생 아스터속의 것**이라 본문에 그 사실을 적었다.
- **#36 `repeated`** — 위스콘신대 익스텐션과 학술 리뷰. **1926년 원논문 PDF는 열지 못해** 본문은 "1920년대에"까지만 적었다.

### 3-4. amaryllis · cyclamen · geranium — 12편

| # | story_id | 제목 | hook | region | era | type | conf | source | kind |
|---|---|---|---|---|---|---|---|---|---|
| 37 | story-amaryllis-name-verdict-1987 | 이백 년을 끈 이름 다툼 | 크리스마스에 파는 그 구근은, 이백 년을 끈 이름 다툼에서 진 쪽입니다. | usa | 18c-modern | history | repeated | [The Case of The Beautiful Imposter (Juniper Level Botanic Garden)](https://www.juniperlevelbotanicgarden.org/the-case-of-the-beautiful-imposter/) | garden |
| 38 | story-amaryllis-watchmaker-fire | 온실이 다 탔는데 꽃은 남았습니다 | 세계 최초의 아마릴리스 교배종을 만든 사람은 랭커셔의 시계공이었습니다. | uk | 19c | history | repeated | [Hippeastrum x johnsonii (University of Arkansas Extension)](https://www.uaex.uada.edu/yard-garden/resource-library/plant-week/Hippeastrum-x-johnsonii-Hardy-Amaryllis-05-19-2017.aspx) | garden |
| 39 | story-amaryllis-theocritus-ten-apples | 사과 열 개를 들고 동굴 앞에서 | 이 이름은 원래 꽃이 아니라, 동굴 밖으로 나오지 않는 여자의 이름이었습니다. | greece | ancient | literary | repeated | [Theocritus, Idyll III. The Serenade (Project Gutenberg)](https://www.gutenberg.org/files/4775/old/thbm10h.htm) | book-pd |
| 40 | story-amaryllis-belladonna-after-fire | 불이 지나간 자리에 잎 없이 올라옵니다 | 진짜 아마릴리스는 산불이 지나간 자리에서 잎 한 장 없이 꽃대만 솟습니다. | south-africa | traditional-modern | history | repeated | [Amaryllis belladonna (PlantZAfrica, SANBI)](https://pza.sanbi.org/amaryllis-belladonna) | garden |
| 41 | story-cyclamen-gerard-fence-1597 | 정원의 꽃 둘레에 울타리를 세웠습니다 | 그는 임신한 사람이 넘어갈까 봐, 정원의 시클라멘 둘레에 울타리를 세웠습니다. | england | 16c | folklore | repeated | [Gerard's Herbal, Chap. 311. Of Sow-Bread (ExClassics)](https://www.exclassics.com/herbal/herbalv30137.htm) | book-pd |
| 42 | story-cyclamen-israel-five-points | 오 퍼센트포인트 차로 진 꽃 | 이스라엘이 나라꽃을 국민투표로 뽑던 날, 이 꽃은 오 퍼센트포인트 차로 졌습니다. | israel | modern | history | varies | [הכלנית: הזוכה בתחרות הפרח של ישראל (ynet)](https://www.ynet.co.il/articles/0,7340,L-4457684,00.html) | newspaper |
| 43 | story-cyclamen-pig-bun-bonfire | 돼지 만주와 화톳불 꽃 | 이 꽃에는 일본 이름이 둘 있습니다. 하나는 돼지 만주, 하나는 화톳불 꽃입니다. | japan | meiji-modern | history | repeated | [シクラメンのひどすぎる和名 (山と溪谷オンライン)](https://www.yamakei-online.com/yama-ya/detail.php?id=1294) | magazine |
| 44 | story-cyclamen-turkey-bulb-gazette | 해마다 관보에 실리는 알뿌리 목록 | 튀르키예는 해마다 관보에 올해 캐도 되는 알뿌리 목록을 다시 싣습니다. | turkey | modern | history | repeated | [İhracatı yasak doğal çiçek soğanları (Anadolu Ajansı)](https://www.aa.com.tr/tr/ekonomi/ihracati-yasak-ve-kotaya-tabi-dogal-cicek-soganlari-belirlendi/3092619) | newspaper |
| 45 | story-geranium-stevens-15-minutes | 배심원단은 십오 분 만에 결론을 냈습니다 | 1914년 배심원단은 십오 분 만에 그를 사기꾼으로 판정했습니다. 백구 년 뒤 약병이 다시 열렸습니다. | uk-south-africa | 19c-modern | history | repeated | [Stevens' cure: a secret remedy (J. R. Soc. Med.)](https://pmc.ncbi.nlm.nih.gov/articles/PMC1279998/) | paper |
| 46 | story-geranium-perfume-double-fake | 가짜를 만들던 것이 다시 가짜가 됐습니다 | 장미유를 위조하던 제라늄 오일은, 그 자신이 다시 싸구려 풀기름으로 위조됐습니다. | france | 19c | history | single_source | [The Art of Perfumery — G. W. S. Piesse (Project Gutenberg)](https://www.gutenberg.org/files/16378/16378-h/16378-h.htm) | book-pd |
| 47 | story-geranium-1631-from-india | 인도에서 온 꽃인 줄 알았습니다 | 유럽 최초의 펠라고늄은 인도에서 오는 배에 실려 왔다는 이유로 인도 식물로 기록됐습니다. | south-africa | 17c | history | varies | [Pelargonium triste (PlantZAfrica, SANBI)](https://pza.sanbi.org/pelargonium-triste) | garden |
| 48 | story-geranium-rozanne-centenary | 진짜 제라늄이 백 년의 식물이 됐습니다 | 화단의 제라늄은 대개 제라늄이 아닙니다. 진짜 제라늄은 따로 있습니다. | uk | modern | history | single_source | [Hardy geranium: 21 of the best (Gardens Illustrated)](https://www.gardensillustrated.com/plants/best-hardy-geraniums) | magazine |

**판정 근거**
- **#37 `repeated`** — 1987년 국제식물학회 결론을 허브소사이어티가, 린네의 혼합 자체를 스미스소니언 도서관이 각각 확인.
- **#38 `repeated`** — 아칸소대 익스텐션과 허브소사이어티가 1799~1810년 교배·온실 화재·리버풀 식물원 분양을 각각 기술.
- **#39 `repeated` + `literary`** — 원전은 퍼블릭 도메인 번역본을 직접 읽고 우리말로 새로 옮겼다(직접 인용부호 없이). 린네의 이름 채택 경로는 스미스소니언 자료로 별도 확인.
- **#40 `repeated`** — SANBI가 산불 뒤 개화·3월 개화·아프리칸스 통칭을, NC State가 통칭 7종과 어원을 확인. 릴리 랭트리와 '저지 백합'의 연결은 별도 자료.
- **#41 `repeated` + `folklore`** — 퍼블릭 도메인 원문을 직접 읽었고 두 번째 출처가 같은 장의 다른 구절을 인용한다. **약효·낙태 관련 서술은 옮기지 않았고**, 당대의 믿음이라는 것과 근거 없는 믿음이라는 점을 본문에 함께 적었다. 제라드의 "웨일스 자생" 서술은 400년째 인용되는 오식별이라 본문에서 바로잡았다.
- **#42 `varies`** — 우승 꽃과 주최는 자연보호협회 페이지로도 확인되지만 **득표율 수치는 ynet 기사 한 곳**에서만 확인했다.
- **#43 `repeated`** — 야마케이와 도호대학 이학부가 오쿠보의 명명·마키노의 재명명·sow bread 번역 관계를 각각 확인. **모든 품종에서 꽃자루가 감기는 것은 아니라** 본문도 단정하지 않았다.
- **#44 `repeated`** — 아나돌루 통신 보도와 2026년분 고시 원문(시클라멘 2종 명시).
- **#45 `repeated`** — 왕립의학회지 논문(1912년 1시간 45분, 1914년 15분, 1953년까지 판매)과 2023년 *Frontiers in Pharmacology*의 큐 시료 재분석. **효능 주장은 하지 않고 성분 동정까지만 적었다.** 치료사의 이름·출신이 자료마다 갈려 본문에서는 "현지 치료사"로만 적었다.
- **#46 `single_source`** — 2차 서술이 아니라 **당대 향료업자가 쓴 1차 사료**다. `source_kind=book-pd`라 화면 문구는 "기록으로 남아 있는 이야기예요"로 간다.
- **#47 `varies`** — 도래 연도가 1631(호주제라늄협회·허브소사이어티) vs 1632(SANBI)로 갈린다. 본문은 1631년을 쓰되 배편 오해라는 이야기의 몸통은 두 계열 모두가 지지한다.
- **#48 `single_source`** — Gardens Illustrated 한 곳. 다른 후보 출처는 429·403으로 열지 못했다.

### 3-5. calendula · stock · delphinium — 12편

| # | story_id | 제목 | hook | region | era | type | conf | source | kind |
|---|---|---|---|---|---|---|---|---|---|
| 49 | story-calendula-shakespeare-deathbeds | 임종의 침상에서 피는 꽃 | 지금은 밝음의 꽃이지만, 셰익스피어는 이 꽃을 주로 무덤과 임종 곁에 두었습니다. | england | 17c-19c | literary | varies | [Shakespeare's Favourite Flowers: The Marigold (Shakespeare Birthplace Trust)](https://www.shakespeare.org.uk/explore-shakespeare/blogs/marigold-on-death-beds-blowing-the-marigold-in-shakespeare-and-victorian-england/) | museum |
| 50 | story-calendula-little-calendar | 이름이 달력에서 왔습니다 | 속명 칼렌둘라는 로마 달력의 초하루에서 왔습니다. 매달 다시 핀다는 뜻입니다. | germany | medieval | history | repeated | [Laacher Kräuterblätter: Ringelblume (Abtei Maria Laach)](https://www.maria-laach.de/klosterbetriebe/klostergaertnerei/service/ringelblume.html) | garden |
| 51 | story-calendula-name-stolen | 이름을 빼앗긴 쪽이 원조입니다 | 지금 우리가 메리골드라 부르는 꽃은, 남의 이름을 가져간 쪽입니다. | england | 16c | history | repeated | [Plant Confusion — Marigolds and Calendulas (A Wandering Botanist)](http://khkeeler.blogspot.com/2016/10/plant-confusion-marigolds-and-calendulas.html) | other |
| 52 | story-calendula-2004-trial | 정원의 꽃이 시험대에 올랐습니다 | 정원 꽃으로 만든 연고 사십일 퍼센트, 병원 표준 연고 육십삼 퍼센트. 낮을수록 좋은 숫자였습니다. | france | modern | history | single_source | [Phase III randomized trial of Calendula officinalis (J. Clin. Oncol., Europe PMC)](https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID%3A15084618&resultType=core&format=json) | paper |
| 53 | story-stock-mattioli-bestseller | 삼만 이천 부가 팔린 약초책 | 오백 부만 팔려도 성공이던 시대에, 약초책 한 권이 삼십사 년 동안 삼만 이천 부 팔렸습니다. | italy | 16c | history | repeated | [I discorsi di M. Pietro Andrea Matthioli (Università di Padova)](https://mostre.cab.unipd.it/illustrazione-botanica/it/34/i-discorsi-di-m-pietro-andrea-matthioli-nelli-sei-libri-di-pedacio-discoride) | museum |
| 54 | story-stock-gillyflower-1663-print | 질리플라워는 카네이션이면서 스토크였습니다 | 1663년 판화에 겹 질리플라워라 적힌 꽃은, 스토크가 아니라 카네이션입니다. | england | 17c | history | repeated | [A camel surrounded by various named animals… 1663 (Wellcome Collection)](https://wellcomecollection.org/works/bfcfnsw3) | museum |
| 55 | story-stock-saunders-genetics | 유전학이라는 말이 태어난 자리 | 유전학이라는 낱말을 만든 사람이 맨 먼저 공을 돌린 상대는, 스토크를 붙들고 있던 사람이었습니다. | england | 1900s-1940s | history | repeated | [When 'Becky' met Bateson (Genetics Unzipped, The Genetics Society)](https://geneticsunzipped.com/blog/2019/10/24/025-when-becky-met-bateson) | magazine |
| 56 | story-stock-double-flower-marker | 겹꽃은 씨를 남기지 못합니다 | 겹꽃 스토크는 씨를 맺지 못합니다. 씨는 언제나 홑꽃 쪽에서 받아야 합니다. | japan | modern | history | repeated | [Establishment of an efficient transformation method of garden stock (Plant Biotechnology)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9592952/) | paper |
| 57 | story-delphinium-ajax-double-freight | 꽃잎이 두 몫의 짐을 졌습니다 | 오비디우스는 이 꽃잎이 두 몫의 짐을 진다고 적었습니다. 신의 비명과 전사의 이름입니다. | greece-rome | ancient | literary | varies | [Ovid, Metamorphoses Book 13 (Perseus Digital Library)](https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0028:book=13:card=382) | book-pd |
| 58 | story-delphinium-chelsea-every-year | 백 년 넘게 한 번도 빠지지 않았습니다 | 두 사람은 서로의 베고니아를 보다가 만났고, 그 회사는 첼시 플라워쇼에 백 년 넘게 개근했습니다. | england | modern | history | single_source | [History (Blackmore & Langdon Ltd.)](https://www.blackmore-langdon.com/history/) | other |
| 59 | story-delphinium-larkspur-cattle-loss | 정원의 파란 꽃이 목장에서는 골칫거리입니다 | 정원의 파란 꽃이 미국 서부에서는 목장주의 파산 사유입니다. | usa | modern | history | repeated | [Larkspur (Delphinium spp.) (USDA Agricultural Research Service)](https://www.ars.usda.gov/pacific-west-area/logan-ut/poisonous-plant-research/docs/larkspur-delphinium-spp/) | garden |
| 60 | story-delphinium-navajo-dye-refused | 색을 낼 줄 알면서 내지 않습니다 | 파란 꽃인데 파란색이 나오지 않습니다. 그리고 색을 낼 줄 알면서도 내지 않습니다. | navajo | traditional-modern | folklore | single_source | [Navajo Dye Chart (Shaped by the Loom, Bard Graduate Center)](https://exhibitions.bgc.bard.edu/shapedbytheloom/interactive/navajo-dye-chart/) | museum |

**판정 근거**
- **#49 `varies` + `literary`** — 희곡 원문 인용 4건은 확실하나 **"빅토리아 시대 애도의 꽃"이라는 수용사 해석은 이 출처 한 계열**이다. 셰익스피어의 marigold가 Tagetes가 아니라는 점은 재단 글이 직접 못 박는다.
- **#50 `repeated`** — calendae 어원을 수도원 원예부·National Garden Bureau·웰컴 컬렉션 세 곳이 일치되게 적는다. **출처가 힐데가르트를 11세기로 적은 것은 오기**라 본문은 12세기로 바로잡았다.
- **#51 `repeated`** — 이름이 넘어간 경위는 식물학 블로그가, Calendula≠Tagetes 구분은 위스콘신대 익스텐션이 확인. **기존 `marigold` 9편(죽은 자의 날·사원 화환·아즈텍 겹꽃·벨테인·초르노브리우치 등)과 소재가 겹치지 않는다** — 이 행의 초점은 "영어 단어가 어느 식물에서 어느 식물로 넘어갔는가"다.
- **#52 `single_source`** — 단일 무작위배정 임상시험이다. **효능 주장이 아니라 2004년에 이런 시험이 있었다는 사건으로만** 다뤘고, 후속 종합 분석에서 늘 재현되지는 않았다는 사실을 본문 안에 함께 적었다. 원문 접근이 쿠키월·403으로 막혀 Europe PMC 서지·초록 API를 출처 URL로 썼다.
- **#53 `repeated`** — 3만 2천 부·60판 이상을 파도바대 도서관 전시와 고서 전문 서점이 각각 확인. **마티올리와 스토크 사이에 식물학적 인연이 없다는 사실**을 본문 마지막에 적었다.
- **#54 `repeated`** — 판화 명문(웰컴), 어원(셰익스피어 용어사전), 통용명 잔존(RHS·NC State) 세 계열 교차 확인.
- **#55 `repeated`** — 영국 유전학회 자료와 케임브리지대 유전학과 공식 연혁.
- **#56 `repeated`** — 2022년 논문 본문과 2018년 *Plant Science* 논문. **"겹꽃은 불임"이 개체 이야기이지 품종 이야기가 아니라는 점**을 본문에서 갈라 적었다.
- **#57 `varies` + `literary`** — **오비디우스 원문의 꽃은 히아신스다.** 라크스퍼 비정은 후대 식물학자들의 해석이고 붓꽃이라는 설도 있어, 본문 마지막 두 문장에서 그 갈림을 그대로 밝혔다.
- **#58 `single_source`** — 기업 공식 연혁이다. 전 회차 참가와 금메달 수는 RHS 기록으로 교차 검증하지 못해 **본문에 "회사 기록에 따르면"을 넣었다.**
- **#59 `repeated`** — USDA-ARS 두 페이지와 USDA-SARE 과제 페이지. 손실률 서술이 2~5%/최대 15%와 최대 10%로 갈려 **본문에서 폭을 밝혔다.**
- **#60 `single_source` + `folklore`** — 전시 자료 한 곳이지만 **차트 원문의 서술을 그대로만 옮겼다.** 의례 관련 대목을 확대 해석하지 않았다.

---

## 4. 자랑할 만한 이야기 3편

1. **#5 우주에서 처음 핀 꽃** (`story-zinnia-iss-first-bloom`) — 곰팡이로 죽어 가던 백일홍 앞에서 나사가 내린 결정이 이 이야기의 전부다. **크리스마스이브에 두꺼운 절차서 대신 한 장짜리 안내문을 올려 보내고 "이제 당신이 정원가"라고 한 것.** 우주비행사가 마션 농담을 하고, 삼 주 뒤 "더 이상 슬퍼 보이지 않는다"고 보고하고, 마침내 우주에도 다른 생명이 있다고 적는 흐름이 그대로 서사다. 위로(comfort) 자리에 놓을 수 있는 이야기 중 이번 라운드 최고다.
2. **#45 배심원단은 십오 분 만에 결론을 냈습니다** (`story-geranium-stevens-15-minutes`) — 1914년에 사기꾼으로 판정된 남자의 약병이 **109년 뒤 큐 왕립식물원 수장고에서 나와 질량분석기에 올랐고, 그 남아프리카 뿌리에만 있는 성분이 세 병 모두에서 검출됐다.** 판결과 성분이 서로 다른 말을 한다는 구조가 좋고, 효능 주장 없이도 이야기가 성립한다는 점이 특히 좋다.
3. **#60 색을 낼 줄 알면서 내지 않습니다** (`story-delphinium-navajo-dye-refused`) — 파란 꽃인데 파란색이 안 나온다는 반전으로 시작해, **"신성한 식물이라 많은 나바호가 염료로 쓰지 않는다"**는 한 줄로 끝난다. 만드는 법이 적힌 차트에 안 만드는 이유가 함께 적혀 있다는 것 자체가 이야기다.

**아깝게 3위 밖:** #3 파스타를 삶다 떠올린 발아법(그리고 2014년 도난), #11 백팔십 년째 미지급인 파란 달리아 상금, #16 냉동고에서 서른아홉 해를 잔 씨앗 1,100알, #21 황금 더미 앞에서 카터를 울린 시든 꽃.

---

## 5. 이름은 같지만 다른 식물 — 8건 (전부 본문에 명시)

이번 15종은 **이름 혼동이 데이터셋 역대 최대**였다. 각주로 숨기지 않고 본문 안에서 직접 밝혔고, `editorial_note`에도 남겼다.

| # | flower_id | 헷갈리는 짝 | 본문 처리 |
|---|---|---|---|
| 7 | zinnia | **백일홍(Zinnia, 국화과 한해살이) ↔ 목백일홍·배롱나무(Lagerstroemia, 부처꽃과 나무)** | "이 전설의 백일홍은 여름 화단의 한해살이 백일홍이 아니라 배롱나무예요" — 전설의 주인공을 바꿔 주는 행 |
| 2·4 | water-lily | **수련(Nymphaea) ↔ 연꽃(Nelumbo)**, 그리고 **빅토리아연(Victoria) ↔ 연꽃·가시연꽃** | "이집트 벽화의 푸른 로터스는 연꽃이 아니라 수련" / "빅토리아연은 수련과지만 우리가 아는 연꽃과는 다른 집안이에요" |
| 20 | crocus | **크로커스(붓꽃과) ↔ 콜키쿰(콜키쿰과, 독초)** | 수술 3개 대 6개라는 구별법을 본문 한가운데 두었다. 사프란인 줄 알고 따는 사고가 되풀이돼 온 소재 |
| 21 | cornflower | **유럽 수레국화(*C. cyanus*) ↔ 투탕카멘 화환의 *C. depressa*** | "그 꽃은 우리가 아는 수레국화와 같은 속의 다른 종이에요" |
| 37·40 | amaryllis | **꽃집 아마릴리스(Hippeastrum) ↔ 진짜 아마릴리스(*A. belladonna*)** | 이름 다툼 자체를 한 편으로 세우고(#37), 진짜 쪽을 다른 한 편으로 세웠다(#40) |
| 47·48 | geranium | **화단의 제라늄(Pelargonium) ↔ 진짜 제라늄(Geranium)** | 혼동의 기원(#47, 1631년 배편 오해)과 그 결말(#48, 진짜 제라늄이 백 년의 식물이 됨)을 짝으로 배치 |
| 51 | calendula | **금잔화(Calendula) ↔ 마리골드·만수국(Tagetes)** | "이름을 빼앗긴 쪽이 원조인 셈이에요" — African/French marigold라는 이름의 유래까지 |
| 54 | stock | **질리플라워 = 스토크이자 카네이션이자 계란풀** | 1663년 판화의 명문이 물증. RHS 통용명에 지금도 gilliflower가 남아 있다는 대목까지 |

추가로 본문 안에 한 줄씩 넣은 소소한 함정: 스위트피 ↔ 식용 완두(#25), *Gladiolus liliaceus*의 종소명 ↔ 백합속(#15), 과꽃(Callistephus) ↔ 가을 들국화 아스터속(#35), *Delphinium ajacis* ↔ 현 *Consolida ajacis*(#57), 야생 라크스퍼 ↔ 화훼용 델피니움(#59·#60), 화분 시클라멘(*C. persicum*) ↔ 규제 대상 야생 원종(#44).

---

## 6. 버린 후보와 사유

**열람 실패로 제외** — kew.org, theguardian.com, bbc.com, musee-orangerie.fr, nature.com(인증 리다이렉트), PubMed(쿠키월), ascopubs.org(403), MDPI(403), ResearchGate, Art UK·Jersey Heritage(403), African Centre for Biosafety(403), tela-botanica.org(연결 거부), erfurt.de(연결 거부), bleuetdefrance.fr(403), scroll.in·dialogue.earth(403), 애리조나대 리포지터리 PDF·BioOne(403). **URL을 못 연 후보는 한 건도 싣지 않았다.**

**내용 미확증으로 제외** — 바젤 1444년 '사프란 전쟁'(영어권 2차 자료에만 있고 바젤 길드 공식 사료에서 확인 실패), 밀레이 「A Jersey Lily」의 꽃이 실은 건지 릴리라는 이야기(출처가 위키 계열로 보임), 2010년 유럽특허청의 펠라고늄 특허 취소 결말, 콜히친을 사프란으로 오인한 이탈리아 부부 사망 사례(유료벽).

**정책 판단으로 제외** — 1911년 자르브뤼켄 수레국화의 날(§3-2 각주), 카를 푀르스터의 델피니움 육종(사실 관계는 확인됐으나 **인물의 1940년 나치당 입당 이력**이 있어 인물 상찬형 서술을 피했다).

**중복으로 제외** — 금잔화의 사프란 위조 소재(#18 크로커스 행이 이미 잇꽃·금잔화 혼입을 다룬다), 헝가리 라크스퍼 민속(#24 수레국화 행과 **같은 논문**이라 출처가 겹친다).

**다음 라운드용 재고 (전부 본문 확인 완료, 미적재)**
- `water-lily` — 스리랑카가 37년 동안 국화 자리에 **엉뚱한 꽃 사진**을 인쇄해 온 사건(Mongabay). 우표·교과서·대통령 축하카드까지 번졌고 1988년 국가지도만 예외였다
- `water-lily` — *Victoria boliviana*: 큐 표본관에서 177년, 볼리비아 표본관에서 34년간 오동정되다 2022년 신종 발표. 잎 3.2m 세계 최대
- `zinnia` — 인디애나주가 주화(州花)를 **1913→1923→1931→1957 네 번 갈아치운** 이야기. 백일홍은 26년을 버텼고, 1957년 교체안을 낸 하원의원은 대규모 작약 재배업자였다
- `dahlia` — 감자를 대신할 **식량작물**로 유럽에 들어왔는데 시식 평이 처참해 계획이 조용히 접힌 이야기(1789년 마드리드)
- `dahlia` — 일본 도래(1841년 나가사키)와 화명 天竺牡丹의 이중 함정: 天竺은 인도가 아니고 모란과도 무관하다
- `gladiolus` — 아직도 네 개의 이름으로 팔리는 *G. murielae*와 에티오피아 주재 영사의 아내 이름
- `crocus` — 잉글랜드 Saffron Walden의 문장(紋章) 말장난, 빈이 사프란 도시였던 시절(굼펜도르프·마리아힐프가 사프란 밭)
- `sweet-pea` — 헨리 에크퍼드가 **예순다섯에 "아무도 나를 안 건드리는 곳"**으로 옮겨 1901년 시판 264품종 중 115품종을 만든 이야기
- `sweet-pea` — 스위트피 씨앗의 BAPN이 **콜라겐 연구의 표준 시약**이 된 경위
- `primula` — 조지 포레스트의 윈난 채집(프리뮬러만 103종)과 현지 수석 채집인 자오청장의 자리
- `primula` — *Primula × kewensis*: **자발적 체세포 배가의 최초 보고**(임성 회복 연도의 1차 출처만 확보되면 최상급 후보)
- `aster` — 1728년 파리 도착설과 당카르빌의 연대 모순(그는 1740년에야 중국에 갔다)
- `stock` — 19세기 크베들린부르크 디페 형제의 "화분 12개 중 11개에서 겹꽃" 육종
- `amaryllis` — 구독자 79명뿐이던 『Hexandrian Plants』와 오듀본의 판각공
- `cyclamen` — 1989년 소말리아 절벽에서 발표된 *C. somalense*, 지구상 재배 개체 4포기가 전부 한 클론

---

## 7. 게이트 결과

```
npm run seed
  flowers.csv 47행 · stories.csv 377행 (합계 1245행)
  [OK] flower_id 참조 무결성 — 참조 998건 모두 flowers.csv 안에 있음 — 47종
  [OK] 반려동물 안전성 커버리지 (cat·dog 전수)
  [OK] 공유 어휘 일치 — stories 377행 모두 어휘 안에 있음
  결과: 통과 (오류 0건)          exit 0
```

- `tests/data/catalog.test.ts`의 `EXPECTED_STORIES`를 **317 → 377**로 갱신했다(이야기 수를 단언하는 유일한 상수).
- `tests/components/landing-today-reason.test.ts`의 편수 표기 3곳(주석 2·테스트 이름 1)을 377 기준으로 갱신했다. 실제 수치는 그대로다 — `기준`이 든 훅 **2편**, 따옴표가 섞인 훅 **26편**, 마침표로 끝나는 훅 **272편**(신규 60편이 전부 마침표로 끝난다).
- 이야기 데이터가 원인인 테스트 실패는 없다.

### 7-1. 후속 과제

- **`apology` 이야기가 0편.** 이번 15종에서는 사과 자리에 놓을 소재가 나오지 않았다. 배치 2에서 의도적으로 노릴 축이다(현재 전체 데이터셋의 apology 태그도 얇다).
- **`romantic` 9편**으로 6종 mood 중 가장 얇다. 신설 15종에 로맨틱한 전승이 드물었던 탓이 크다 — #15(해 지면 색이 바뀌는 글라디올러스), #24(성령강림절 수레국화 다발), #28(붉은 스위트피)이 그 자리를 지탱한다.
- **전체 `wiki` 44.0%**는 여전히 1·2차 유산이다. 3차 이후 신규분(55+67+60=182편) 기준으로는 위키가 7편(3.8%)이다.
