# 꽃 이야기 리서치 3차 — 한국 인기 절화 심화 + 소스 다변화 (story-research-3)

## 1. 조사 개요

- **조사일**: 2026-08-15
- **대상**: aT 화훼공판장 유통 상위권 절화 **11종** — 장미 · 국화 · 카네이션 · 백합 · 튤립 · 프리지아 · 거베라 · 리시안셔스 · 안개꽃 · 수국 · 라넌큘러스
- **수집 이야기**: **55편** · **수집 꽃말**: **30행**
- **기존 데이터와의 관계**: `content/stories.csv` 196행 · `content/meanings.csv` 138행(31종)을 전수 대조했습니다. 이번 11종에 이미 걸려 있던 이야기 82편·꽃말 53행과 **소재가 겹치는 항목은 없습니다.** `story_id` 중복 0건, 꽃말 문구 중복 0건을 기계 대조로 확인했습니다.
- **표의 모든 `source_url` 은 실제로 열어 본문을 확인한 것**입니다. 열람에 실패한 URL은 본문에서 전부 빼고 §6에 사유와 함께 남겼습니다.

### 1-1. 이번 조사가 노린 것 (사용자 지시 반영)

> "조사 문서 더 늘리자. 한국에서 많이 사는 꽃은 더 많이 조사하고, 해외 사례도 많이. 논문·칼럼·잡지 등 다양하게."

1·2차 조사는 **영문 위키피디아 의존도가 높았습니다.** 3차는 두 가지를 바꿨습니다.

1. **소스를 갈아엎었습니다.** 각 이야기에 `source_kind` 컬럼을 새로 달아 출처의 성격을 드러냈고, **wiki 비중 30% 이하**를 목표로 학술 논문·잡지 칼럼·박물관·식물원·신문 아카이브·퍼블릭 도메인 고서로 무게를 옮겼습니다. 결과는 **7.3%**입니다.
2. **한국 소비 장면에 붙였습니다.** 졸업식·어버이날·스승의날·조문·프러포즈·개업처럼 **한국 사람이 실제로 꽃을 사는 자리**와 이어지는 이야기를 우선 수집했고, **한국 화훼시장·근현대 꽃 문화**라는 새 갈래를 열었습니다(양재동 경매·남대문 대도상가·3단 화환·조선 화훼).

### 1-2. 저작권 처리 원칙 (1·2차와 동일)

- **타 사이트 문장을 옮긴 곳은 한 군데도 없습니다.** 표의 "리텔링 초안"은 전부 사실관계만 참고해 새로 쓴 우리 문장(한국어, 다정한 존댓말 이야기 톤)입니다.
- 설화·역사적 사실 자체는 아이디어라 저작권 대상이 아닙니다. 표현만 새로 쓰면 자유롭게 쓸 수 있습니다.
- 원문 직접 인용은 **퍼블릭 도메인 자료**(1929년 이전 출판물 · Project Gutenberg · Internet Archive 스캔본)에 한해서만 했습니다. 인용한 원문은 §3 꽃말 표의 비고 칸과 해당 이야기 본문에 그대로 밝혀 두었습니다 — 1884년 Greenaway 『Language of Flowers』, 1839년 커티스 『Botanical Magazine』, 1891년 Morton 『Chrysanthemum Culture for America』, 1815년 워즈워스 시집, 8세기 『만엽집』.
- 국립원예특작과학원(NIHHS) 꽃말은 **꽃말 단어만** 가져왔고 설명문은 옮기지 않았습니다.
- **confidence 라벨** (1·2차와 동일 기준)
  - `repeated` — 여러 독립 출처에서 반복 확인되는 정설/사실
  - `varies` — 전승은 널리 알려졌으나 버전이 갈리거나 출처가 한 계열에 몰림
  - `single_source` — 출처가 하나뿐. 화면에서 "드물게 전해지는 이야기예요" 라벨 필수(§1.5d)

### 1-3. 소스 유형 분포 — 이번 라운드의 핵심 지표

| source_kind | 뜻 | 이야기 편수 | 비중 |
|---|---|---|---|
| `newspaper` | 신문 | 15 | 27.3% |
| `garden` | 식물원·대학 익스텐션 | 11 | 20.0% |
| `paper` | 학술 논문 | 10 | 18.2% |
| `magazine` | 잡지·칼럼 | 6 | 10.9% |
| `book-pd` | 퍼블릭 도메인 고서 | 5 | 9.1% |
| `museum` | 박물관·기관 | 4 | 7.3% |
| `wiki` | 위키·백과사전 | 4 | 7.3% |
| **합계** | | **55** | **100%** |

**wiki 4편 / 55편 = 7.3%** — 목표(30% 이하) 충족.

> **`wiki` 4편의 실제 정체를 밝혀 둡니다.** 이 라운드에서 `wiki` 는 "위키·백과사전·정리 사이트 전반"을 보수적으로 묶은 값입니다. 실제 내역은 **한국민족문화대백과사전 2편**(한국학중앙연구원 편찬 학술사전), **Pacific Bulb Society 1편**(구근 전문 단체 위키), **영문 위키피디아 1편**(`Ranunculus adoneus`)입니다.
> 즉 **영문 위키피디아 직접 인용은 55편 중 1편(1.8%)** 뿐입니다. 1·2차 조사가 사실상 위키피디아 단일 소스였던 것과 비교하면 이번 라운드의 실질 변화는 지표보다 큽니다.
> 그 1편도 원 논문(Stanton & Galen 1989, *Oecologia*)을 Wiley·Springer·PubMed·ADS·Semantic Scholar 다섯 경로로 시도해 전부 실패한 끝에 남은 것입니다. 오픈액세스 판본을 찾으면 `paper` 로 교체하는 것이 좋습니다.

### 1-4. mood 분포 (복수 부여 — 중복 카운트)

| mood | 개수 |
|---|---|
| healing | 43 |
| dramatic | 16 |
| mythic | 11 |
| tragic | 6 |
| romantic | 5 |
| funny | 2 |

**6종 전부 커버 확인.** 다만 이번 묶음은 `healing` 에 크게 쏠렸고(43), `funny` 가 2편으로 가장 얇습니다 — 한국 유통사·논문·조문 소재를 깊게 판 결과라 정서가 차분한 쪽으로 모였습니다. 2차 조사가 `funny` 23편을 채워 둔 만큼 전체 균형은 유지되지만, 다음 라운드는 의도적으로 유쾌한 소재를 노리는 것이 좋겠습니다.

### 1-5. 꽃별 수집 수

| 꽃 | 이번 이야기 | 이번 꽃말 | 기존 이야기 | 합계(이야기) |
|---|---|---|---|---|
| 장미 | 6 | 3 | 11 | 17 |
| 국화 | 6 | 3 | 7 | 13 |
| 카네이션 | 4 | 4 | 6 | 10 |
| 백합 | 5 | 3 | 10 | 15 |
| 튤립 | 4 | 3 | 13 | 17 |
| 프리지아 | 6 | 3 | 7 | 13 |
| 거베라 | 5 | 1 | 8 | 13 |
| 리시안셔스 | 3 | 3 | 6 | 9 |
| 안개꽃 | 5 | 3 | 3 | 8 |
| 수국 | 7 | 3 | 6 | 13 |
| 라넌큘러스 | 4 | 1 | 5 | 9 |
| **합계** | **55** | **30** | **82** | **137** |

---

## 2. 이야기 표

> 컬럼: `# | story_id | flower_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | story_type | source_title | source_url | source_kind | confidence`
> `story_id` 는 현행 `content/stories.csv` 규칙(`story-` 접두사)에 맞췄습니다. 그대로 넣으면 됩니다.
> `intents` 가 `—` 이면 전천후로 붙일 수 있다는 뜻입니다.
> `source_kind` 는 이번 라운드에 새로 추가한 컬럼입니다 — `content/stories.csv` 에 컬럼을 늘릴지는 Advisor 판단(§9-1).

### 2-1. rose-red (장미) — 6편 · 기존 11편과 무중복

| # | story_id | flower_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | story_type | source_title | source_url | source_kind | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | story-rose-first-plant-patent-1931 | rose-red | 세상에서 처음 번호를 받은 생명은 장미였습니다 | 1930년 미국은 이상한 법을 하나 만들었습니다. 살아 있는 식물에도 특허를 준다는 법이었어요. 그리고 이듬해 8월 18일, 특허번호 1번이 나왔습니다. 받은 사람은 뉴저지 뉴브런즈윅에 살던 헨리 보센버그였습니다. 그는 담장을 타고 오르는 덩굴장미가 초여름에 딱 한 번 피고 마는 게 늘 아쉬웠어요. 그러다 'Dr. W. Van Fleet'이라는 품종에서 가지 하나가 다르게 굴었습니다. 5월 말부터 서리가 내릴 때까지 계속 꽃을 다는 가지였지요. 그는 그 가지를 붙잡아 이름을 붙였습니다. New Dawn, 새벽이라는 뜻이에요. 심사관들은 정말 사철 피는지 증명하라고 했고, 그는 증명해 냈습니다. 인류가 생명에 매긴 첫 번째 번호가 하필 장미였다는 것, 그것도 '새벽'이라는 이름이었다는 것이 오래 마음에 남습니다. | 인류가 살아 있는 생명에 처음으로 특허번호를 매긴 날, 그 1번은 장미였습니다. | dramatic | just_because | usa | 1930s | history | The Patents Behind the Roses You Receive on Valentine's Day (Smithsonian Magazine) | https://www.smithsonianmag.com/sponsored/patents-behind-roses-you-receive-valentines-day-180962096/ | magazine | repeated |
| 2 | story-rose-hip-syrup-wartime | rose-red | 아이들이 울타리에서 딴 붉은 열매 | 1941년 영국. 뱃길이 막혀 오렌지가 들어오지 않던 해였습니다. 식량부 과학자들이 들장미 열매를 재보니, 같은 무게 오렌지보다 비타민C가 스무 배 넘게 들어 있었어요. 그해 9월 말이 전국 로즈힙 수집 주간으로 정해졌고, 스카우트와 걸가이드 아이들이 바구니를 들고 들판 울타리로 나갔습니다. 그렇게 모인 게 200톤. 시럽 60만 병이 만들어졌습니다. 전쟁이 끝난 뒤에도 영국 아이들은 한동안 매일 한 숟갈씩 그 붉은 시럽을 먹고 자랐어요. 우리는 꽃이 진 자리를 잘 들여다보지 않습니다. 그런데 한 세대를 먹인 건 꽃이 아니라, 꽃이 지고 난 뒤였습니다. | 장미가 한 세대의 아이들을 먹여 살린 적이 있습니다. 꽃이 아니라, 꽃이 진 자리로요. | healing, dramatic | comfort | uk | 1940s | history | Raw Rosehip Syrup: How to Make and Use (Woodland Trust) | https://www.woodlandtrust.org.uk/blog/2019/07/raw-rosehip-syrup/ | garden | varies |
| 3 | story-rose-monteagudo-prickles | rose-red | 800년 뒤 그 정원에는 가시만 남았습니다 | 스페인 무르시아의 몬테아구도. 12세기 이슬람 군주가 지은 궁전 정원 자리입니다. 2025년 발표된 연구에서 고고학자들이 흙에서 골라낸 건 아주 작은 것들이었어요. 장미 가시 다섯 개. 꽃잎도 향도 남지 않았는데 가시는 남았습니다. 연구진은 그 모양을 재고 통계로 견주어, 갈고리처럼 굽은 것은 흰 사향장미 계열, 곧게 선 것은 노란 페르시아 장미 계열일 가능성이 높다고 보았습니다. 방사성탄소 연대는 뜻밖에도 18~19세기를 가리켰어요. 중세 이슬람 정원에 심긴 장미가, 주인이 여러 번 바뀐 뒤에도 같은 자리에서 계속 피고 있었다는 뜻이었습니다. 사라진 건 사람이었고, 남은 건 장미였습니다. | 궁전도 주인도 사라진 자리에서 고고학자들이 찾아낸 건, 장미 가시 다섯 개였습니다. | mythic, dramatic | — | spain | 12c | history | Advancing Archaeobotanical Methods: Morphometry, Bayesian Analysis and AMS Dating of Rose Prickles from Monteagudo Almunia (Plants, 2025) | https://pmc.ncbi.nlm.nih.gov/articles/PMC12736896/ | paper | single_source |
| 4 | story-rose-thornless-korea | rose-red | 가시를 지운 장미 | 프러포즈를 준비해 본 사람은 압니다. 장미 한 다발을 안으면 제일 먼저 만나는 건 향이 아니라 가시라는 걸요. 그래서 꽃집에서는 가위로 가시를 하나하나 훑어냅니다. 2010년 국내에서 개발된 장미 '딥퍼플'에는 그 손질이 필요 없었습니다. 줄기가 매끈했거든요. 농가에서는 맨손으로 수확해도 손을 다치지 않고, 꽃도 덜 상했습니다. 이 보랏빛 장미는 열세 나라로 팔려 나가 로열티만 13억 원을 벌었어요. 10년 전 1%였던 국산 장미 품종 보급률은 30%까지 올라왔습니다. 사랑을 건네려면 먼저 가시부터 다뤄야 했던 오랜 순서를, 누군가는 아예 없애 버린 겁니다. | 프러포즈 장미에서 가시 자체를 없애 버린 사람들이 있습니다. | romantic, healing | confession, anniversary | korea | 2010s | history | 로열티 받고 수출…'가시 없는 장미'의 화려한 외출 (SBS 뉴스) | https://news.sbs.co.kr/news/endPage.do?news_id=N1004062845 | newspaper | single_source |
| 5 | story-krmarket-yangjae-midnight-auction | rose-red | 자정에 문을 여는 꽃시장 | 양재동 화훼공판장의 하루는 자정에 시작됩니다. 밤 아홉 시에 출근해 아침 여덟 시에 퇴근하는 경매사가 전광판 앞에 서면, 이백 개의 응찰석에 앉은 중도매인들이 기계를 쥐어요. 이곳 경매는 값을 올려 부르지 않습니다. 미리 정해 둔 값을 위에서부터 떨어뜨리고, 사겠다 싶은 순간에 단추를 누르는 방식이에요. 망설이면 남이 가져가고, 서두르면 비싸게 삽니다. 1991년 6월 이곳이 우리나라 첫 공영 화훼도매시장으로 문을 열면서 꽃값은 처음으로 공개된 숫자가 되었어요. 전국에서 트레일러에 실려 온 붉은 장미와 분홍 카네이션과 흰 국화가 밤새 주인을 찾습니다. 아침에 꽃집 문이 열릴 때, 그 꽃들은 이미 하루를 산 뒤입니다. | 우리가 잠든 자정에, 전국의 꽃이 값을 정하러 한자리에 모입니다. | healing, dramatic | — | korea | 1991 | history | [이종원 선임기자 카메라 산책] 양재 화훼공판장 '꽃 경매장'을 가다 (서울신문) | https://www.seoul.co.kr/news/newsView.php?id=20140224028007 | newspaper | repeated |
| 6 | story-krcutflower-wet-transport | rose-red | 물에 담가 오면 두 배를 삽니다 | 꽃집에서 사 온 장미가 사흘 만에 고개를 떨구면 대개 우리 탓을 합니다. 그런데 그 꽃이 어떻게 실려 왔는지가 훨씬 크게 작용해요. 2024년 한국화예디자인학 연구에 실린 논문에 따르면, 물통에 담아 세워서 오는 습식 유통은 눕혀서 마른 채로 오는 건식 유통에 비해 절화의 관상 수명을 두 배 가까이 늘립니다. 꽃이 우리 손에 오기 전에 이미 목이 말랐던 겁니다. 같은 연구는 요즘 꽃 소비의 결이 달라졌다고도 말해요. 예의를 갖추려 보내던 선물에서, 나를 위해 사는 취미와 살림 쪽으로요. 선물용, 장식용, 화환, 그리고 그냥 좋아서. 꽃을 사는 이유가 늘어난 만큼 꽃이 오는 길도 달라져야 한다는 이야기입니다. | 꽃이 빨리 시드는 건 당신 탓이 아니라, 대개 오는 길이 말랐기 때문입니다. | healing | just_because | korea | 2024 | history | 절화 장미 유통 다각화를 위한 소비자 여정 분석에 관한 연구 (한국화예디자인학 연구, 2024) | https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003111917 | paper | single_source |

### 2-2. chrysanthemum (국화) — 6편 · 기존 7편과 무중복

| # | story_id | flower_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | story_type | source_title | source_url | source_kind | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7 | story-chrysanthemum-korea-white-funeral | chrysanthemum | 영정 앞의 흰 국화는 우리 전통이 아니었습니다 | 장례식장에 들어서면 우리는 자연스럽게 흰 국화 한 송이를 집어 듭니다. 그런데 조선의 상례에는 그런 절차가 없었어요. 고인 앞에서 하던 일은 향을 피우고, 술을 올리고, 절을 하는 것이었습니다. 생화는 오히려 생명과 번영을 뜻해서 죽음의 자리에 들이지 않았지요. 흰 국화는 19세기 말 서양의 헌화 문화가 일본으로 건너가면서 자리를 잡았습니다. 메이지 정부가 황실 문장인 국화와 서양식 조화(弔花)를 겹쳐 놓았고, 그 형식이 식민지 조선으로 들어왔어요. 지금의 꽃 제단은 더 최근입니다. 1980년대 일본에서 만들어진 상품이 장례박람회를 통해 우리 업계로 들어왔습니다. 을지대 김시덕 교수는 이렇게 짚습니다. 일본에서도 꽃은 고인의 취향대로 고르는데, 유독 우리만 흰 국화 하나로 통일한다고요. | 조선의 상례에는 영정 앞에 꽃을 놓는 절차가 아예 없었습니다. | dramatic, tragic | comfort | korea-japan | modern | history | 한국은 왜 유독 '흰 국화' 고집할까…장례문화의 불편한 진실 (한국일보, 김시덕) | https://www.hankookilbo.com/news/article/A2026032409580004302 | newspaper | repeated |
| 8 | story-chrysanthemum-toussaint-1919 | chrysanthemum | 촛불 대신 국화를 놓기로 한 해 | 프랑스에서는 11월 1일 만성절이 되면 온 나라의 무덤이 국화로 덮입니다. 아주 오래된 풍습 같지만 백 년이 조금 넘었어요. 19세기까지 프랑스 사람들은 무덤에 초를 켜 두었습니다. 죽은 이를 밤새 지킨다는 뜻이었지요. 그러다 1919년 11월 11일, 첫 번째 종전 기념일에 레몽 푸앵카레 대통령이 전사자들의 무덤마다 꽃을 놓아 달라고 청했습니다. 그런데 그 계절에 살아 있는 꽃이 몇 없었어요. 늦가을에 피고 어지간한 서리쯤은 견디는 꽃, 국화가 남아 있었습니다. 처음엔 흰 국화였습니다. 흰색이 슬픔과 애도를 뜻했으니까요. 그 뒤로 날짜가 11월 2일로, 다시 11월 1일로 조금씩 앞당겨지며 오늘의 풍경이 되었습니다. 마침 그때까지 피어 있었다는 이유 하나로, 국화는 한 나라의 애도를 떠맡게 되었습니다. | 프랑스가 국화를 죽은 이의 꽃으로 삼은 이유는, 11월까지 남아 있는 꽃이 그것뿐이어서였습니다. | tragic, healing | comfort | france | 1910s | history | Why are chrysanthemums the flower of Toussaint in France? (The Connexion) | https://www.connexionfrance.com/practical/why-are-chrysanthemums-the-flower-of-toussaint-in-france/284168 | newspaper | single_source |
| 9 | story-chrysanthemum-korea-night-lighting | chrysanthemum | 국화를 재우지 않는 밤 | 가을밤 시골길을 지나다 비닐하우스 안이 환한 걸 본 적 있나요. 그 안에는 대개 국화가 있습니다. 국화는 낮이 짧아져서 피는 꽃이 아니라, 밤이 길어져야 피는 꽃이에요. 그래서 농가는 한밤중에 전등을 켭니다. 10제곱미터에 100와트 전구 하나, 70~80럭스면 충분합니다. 8~9월엔 두 시간, 10월엔 서너 시간, 11월부터는 네 시간 넘게 켜 두어요. 긴 밤을 토막 내면 꽃눈이 생기지 않습니다. 그러다 필요한 날짜를 역산해 불을 끄면, 그때부터 국화는 비로소 꽃을 준비합니다. 장례식장에도, 명절에도, 필요한 날에 흰 국화가 늘 준비되어 있는 건 우연이 아니었어요. 누군가 밤새 불을 켜 두고, 이 꽃이 잠들 시간을 대신 정해 주고 있었던 겁니다. | 국화가 필요한 날마다 늘 준비되어 있는 건, 누군가 밤새 불을 켜 두기 때문입니다. | healing | — | korea | modern | history | 주요작물별 영농기술 > 화훼 > 국화 (충청북도 농업기술원) | https://ares.chungbuk.go.kr/home/sub.php?menukey=1165 | garden | single_source |
| 10 | story-chrysanthemum-korea-baekma-export | chrysanthemum | 국화의 나라로 국화를 보냈습니다 | 오랫동안 우리 국화 농가는 일본과 네덜란드 품종을 심었습니다. 한 주마다 로열티를 물면서요. 2004년 국립원예특작과학원이 흰 대국 하나를 내놓았습니다. 이름은 '백마'. 순백색에 볼륨이 크고, 무엇보다 꽃이 한 달쯤 갔습니다. 일본의 수입업체와 장례업체 사람들은 절화 수명이 기존 품종의 두 배쯤 된다고 평했어요. 2019년 2월에 1만 송이로 시작한 수출은 4월까지 14만 송이가 되었고, 중국 하이난과 쿤밍에 생산 기지를 붙여 사계절 공급 체계까지 만들었습니다. 국화의 종주국이라 불리던 나라의 장례식장에, 이제 한국이 이름 붙인 흰 국화가 놓입니다. 한 송이당 로열티는 15원. 작아 보이는 숫자지만, 방향이 바뀌었다는 뜻이지요. | 국화 종주국 일본의 장례식장에, 한국이 이름 붙인 흰 국화가 놓이기 시작했습니다. | dramatic, healing | — | korea-japan | 2000s | history | 우리 국화 '백마' 사계절 일본에 선보인다 (대한민국 정책브리핑) | https://www.korea.kr/news/policyNewsView.do?newsId=156329336 | newspaper | single_source |
| 11 | story-chrysanthemum-america-1891-craze | chrysanthemum | 1891년, 미국에서 국화가 왕이 되었습니다 | 1891년 뉴욕에서 미국 최초의 본격적인 국화 책이 나왔습니다. 제임스 모튼이 쓴 『Chrysanthemum Culture for America』예요. 저자는 서문에서, 미국 땅에서 국화가 놀랍도록 빠르게 자라났고 재배법을 알려 달라는 요구가 너무 커져서 이 책을 낸다고 적었습니다. 본문에는 이런 문장이 있어요. "Within the past twenty years, however, the popularity of the flower has advanced at a steady rate until it is now supreme in the home garden, the exhibition hall and the conservatory." 지난 20년 사이에 이 꽃이 가정의 정원에서도, 전시장에서도, 온실에서도 최고가 되었다는 뜻입니다. 동양에서 건너간 가을 꽃 하나가 대서양 너머에서 유행이 된 순간이었지요. 지금 우리가 꽃집에서 무심히 집어 드는 국화에도, 그때의 열기가 조금은 남아 있습니다. | 백삼십 년 전 미국에는 국화 붐이 있었고, 그걸 기록한 책이 통째로 남아 있습니다. | healing | just_because | usa | 19c | history | Chrysanthemum Culture for America (James Morton, 1891, Internet Archive) | https://archive.org/stream/chrysanthemumcul00mort/chrysanthemumcul00mort_djvu.txt | book-pd | single_source |
| 12 | story-krjoseon-potted-flowers | chrysanthemum | 조선 사람도 화분에 꽃을 길렀습니다 | 조선 사람들도 화분에 꽃을 길렀습니다. 2014년 한 연구자가 옛 그림 766점과 문헌 여덟 종을 뒤져 어떤 꽃이 몇 번이나 나오는지 세어 보았어요. 열 번 넘게 나온 것은 매화, 연꽃, 모란, 국화, 파초, 영산홍, 장미, 진달래, 작약이었습니다. 그림 속 꽃들은 대개 화분에 담겨 있었어요. 가까이 두고 들여다보려고 그랬던 겁니다. 화단에도 심고, 연못가와 담장 곁에도 두었고요. 꽃마다 붙은 뜻에도 갈래가 있었습니다. 지조와 덕과 효를 읽는 유교의 눈, 오래 살기를 바라는 도교의 눈, 복과 부를 비는 민간의 눈. 같은 국화 한 송이를 두고도 사람마다 다른 것을 본 셈이에요. 꽃을 곁에 두고 싶은 마음은 그때도 지금과 같았습니다. | 조선의 옛 그림 766점을 세어 보니, 꽃들은 대부분 화분에 담겨 있었습니다. | healing, mythic | just_because | korea | joseon | history | 조선시대 화훼식물의 이용과 상징성에 관한 연구 (한국전통조경학회지 32-2, 2014) | https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001889225 | paper | single_source |

### 2-3. carnation (카네이션) — 4편 · 기존 6편과 무중복

| # | story_id | flower_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | story_type | source_title | source_url | source_kind | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 13 | story-carnation-korea-1956-mothers-day | carnation | 처음 열일곱 해는 '어머니날'이었습니다 | 전쟁이 끝난 지 얼마 되지 않은 1956년, 우리나라는 5월 8일을 '어머니날'로 정했습니다. 아버지의 날도, 어른의 날도 아니고 어머니만의 날이었어요. 그날부터 아이들은 어머니 가슴에 카네이션을 달아 드렸습니다. 그렇게 열일곱 해가 흘렀습니다. 1973년 3월, 「각종 기념일 등에 관한 규정」이 만들어지면서 이 날은 '어버이날'로 넓어졌어요. 어머니 옆에 아버지가 들어오고, 집안 어른과 동네 노인이 함께 들어왔습니다. 이름이 한 번 바뀌는 동안에도 꽃은 바뀌지 않았습니다. 매년 5월이면 꽃집 앞에 카네이션이 쌓이는 이 풍경은, 그러니까 일흔 해 가까이 이어져 온 우리 손의 습관입니다. | 어버이날은 처음 열일곱 해 동안 '어머니날'이었습니다. | healing | gratitude | korea | 1950s | history | 법정기념일 > 어버이 날 (국가기록원) | https://theme.archives.go.kr/next/anniversary/anniversary.do?anniversaryId=9825000000 | museum | repeated |
| 14 | story-carnation-korea-teachers-day-gap | carnation | 스승의 날이 사라졌던 9년 | 1963년, 충남의 청소년적십자 단원들이 '은사의 날'을 만들었습니다. 이듬해 중앙협의회가 5월 26일을 스승의 날로 정했고, 1965년에는 날짜를 세종대왕 탄신일인 5월 15일로 옮겼어요. 아이들은 그날 선생님 가슴에 카네이션을 달아 드렸습니다. 그런데 1973년, 정부가 사은 행사를 규제하면서 스승의 날은 아예 없어졌습니다. 이 나라에 스승의 날이 없던 9년이 있었던 거예요. 1982년에야 법정기념일로 되살아났고, 날짜도 5월 15일로 돌아왔습니다. 국가기록원에는 그 시절 사진 한 장이 남아 있습니다. 머리가 희끗해진 중년 남자가, 자기보다 더 나이 든 은사의 가슴에 카네이션을 달아 드리는 장면이요. | 이 나라에 스승의 날이 없던 9년이 있었습니다. | healing | gratitude | korea | 1960s | history | 기념일과 기록 > 5월 15일 스승의 날 (국가기록원) | https://theme.archives.go.kr/next/specialDay/subInfo.do?specialDayId=00000039 | museum | repeated |
| 15 | story-carnation-ethylene-vase-life | carnation | 카네이션은 스스로 시들라는 신호를 만듭니다 | 어버이날에 산 카네이션이 유난히 빨리 고개를 숙인 적 있지요. 물을 갈아 주지 않아서가 아닙니다. 카네이션은 에틸렌이라는 기체에 세상에서 가장 예민한 꽃 가운데 하나예요. 꽃이 다 피고 나면 스스로 에틸렌을 뿜기 시작하는데, 그 기체가 다시 더 많은 에틸렌을 부르는 연쇄가 일어납니다. 그러면 꽃잎이 안쪽으로 도르르 말리고, 곧 주저앉아요. 일본의 육종가 오노자키 다카시는 1992년부터 이 성질과 씨름했습니다. 에틸렌을 적게 만드는 개체만 골라 일곱 세대를 이어 붙였더니, 평균 7.4일이던 꽃 수명이 15.9일이 되었고, 2010년에는 27일을 견디는 계통까지 나왔습니다. 카네이션이 짧은 게 아니었어요. 우리가 아직 오래 붙잡는 법을 배우는 중이었을 뿐입니다. | 어버이날 카네이션이 사흘 만에 고개를 숙이는 건, 꽃이 스스로 보낸 신호 때문입니다. | healing | gratitude | japan | modern | history | Breeding of carnations (Dianthus caryophyllus L.) for long vase life (Breeding Science, 2018) | https://pmc.ncbi.nlm.nih.gov/articles/PMC5903979/ | paper | single_source |
| 16 | story-carnation-korea-paper-flower | carnation | 종이로 접은 카네이션도 안 됩니다 | 청탁금지법이 시행된 뒤로 5월 15일 교실 풍경이 달라졌습니다. 국민권익위원회는 학생이 개인적으로 선생님께 카네이션을 드리는 건 허용되지 않는다고 정리했어요. 한 중학교 3학년 학생이 "직접 만든 종이 카네이션은 괜찮나요"라고 물었을 때도 답은 같았습니다. 평가와 지도를 맡은 사이에서는 사교·의례의 목적이 인정되지 않는다는 이유였지요. 대신 길이 하나 남았습니다. 학생 대표 한 명이 공개된 자리에서 반 전체를 대신해 건네는 꽃은 사회상규에 따라 허용됩니다. 손편지와 감사 카드는 금액과 상관없이 됩니다. 꽃 한 송이 건네는 일이 이렇게 복잡해진 시대에도, 아이들은 여전히 무언가를 접어서 들고 옵니다. | "직접 만든 종이 카네이션도 안 되나요?" 중3 학생의 질문에 권익위가 답했습니다. | dramatic | gratitude | korea | modern | history | '스승의날' 카네이션 전달, 청탁금지법 위반? 권익위 지침 논란 (오마이뉴스) | https://www.ohmynews.com/NWS_Web/View/at_pg.aspx?CNTN_CD=A0003234545 | newspaper | single_source |

### 2-4. lily-asiatic (백합) — 5편 · 기존 10편과 무중복

| # | story_id | flower_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | story_type | source_title | source_url | source_kind | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 17 | story-lily-baekhap-was-a-root | lily-asiatic | 옛 책에서 백합은 꽃이 아니었습니다 | 우리 옛 책에서 '백합(百合)'을 찾으면 꽃 이야기가 아니라 뿌리 이야기가 나옵니다. 산에 흔한 참나리, 그 땅속 비늘줄기를 백합이라 부르며 약으로 썼거든요. 폐가 약한 사람, 기침이 오래 가는 사람, 잠을 못 이루고 신경이 곤두선 사람에게 달여 주었다고 합니다. 어린 순은 봄에 나물로도 먹었고요. 이름도 재미있습니다. 고려 때 이두로는 견내리화, 대각나리라 적었고, 『동의보감』에는 '개나리불휘'라는 우리말 이름이 남아 있어요. 나리라는 말이 그렇게나 오래된 겁니다. 그러니 백합을 건넬 때, 이 꽃이 우리 땅에서는 오래도록 약이고 또 밥이었다는 걸 함께 떠올려 보셔도 좋겠습니다. | 조선 사람들에게 '백합'은 꽃 이름이 아니라 뿌리 이름이었습니다. | healing | gratitude | korea | joseon | history | 참나리 — 한국민족문화대백과사전 | https://encykorea.aks.ac.kr/Article/E0055255 | wiki | repeated |
| 18 | story-lily-nari-basin-ulleung | lily-asiatic | 섬 하나의 지명이 된 백합 | 울릉도 북쪽, 산봉우리가 내려앉아 생긴 넓은 분지가 있습니다. 이름이 나리예요. 한자로는 비단 같은 마을이라 풀지만, 실제 유래는 그보다 훨씬 배고픈 이야기입니다. 섬에 처음 들어온 개척민들에게는 먹을 것이 없었습니다. 그때 이 분지에 지천으로 자라던 섬말나리의 뿌리를 캐 먹으며 겨울을 났다고 해요. 그래서 마을 이름이 나리가 되었습니다. 지금 그곳에 가면 억새로 지붕을 인 투막집 두 채가 남아 있고, 전망대와 카페가 생겼습니다. 사람들은 사진을 찍고 돌아가요. 발밑의 그 땅이, 한때 누군가의 겨울을 이어 준 백합 밭이었다는 걸 모르는 채로요. | 굶주린 사람들이 캐 먹은 백합 뿌리가, 마을의 이름이 되었습니다. | tragic,healing | comfort | korea | 19c | folklore | 나리 분지 — 한국민족문화대백과사전 | https://encykorea.aks.ac.kr/Article/E0011334 | wiki | repeated |
| 19 | story-lily-isabella-preston-winter | lily-asiatic | 겨울 하나에 다 잃고, 다시 심었습니다 | 1912년, 서른한 살의 이사벨라 프레스턴이 영국을 떠나 캐나다 게일프에 도착했습니다. 원예 강의를 듣다가 이듬해 그만두고, 대학 원예학과의 조수로 일하기 시작했어요. 연구자가 아니라 조수였습니다. 그는 틈틈이 백합을 교배했습니다. 그러다 1917년에서 1918년으로 넘어가는 겨울, 애써 키운 백합 실생 묘가 추위에 전멸했어요. 몇 해치의 시간이 하룻밤에 사라진 겁니다. 그는 다시 심었습니다. 그리고 1919년, 마침내 자기 손으로 만든 백합을 세상에 내놓습니다. 이듬해 서른아홉의 나이로 오타와 중앙실험농장에 자리를 얻었고, 스물여섯 해 동안 200가지가 넘는 새 품종을 남겼어요. 전문 원예가 남자들의 세계였던 시절의 일입니다. | 백합 씨앗을 하룻밤 추위에 전부 잃은 사람이 있었습니다. | dramatic,healing | celebration,comfort | canada | 20c | history | Isabella Preston — Ontario Agricultural College 140 Faces, University of Guelph | https://www.uoguelph.ca/oac/140faces/isabella-preston | garden | repeated |
| 20 | story-lily-asiatic-korean-ancestors | lily-asiatic | 이 꽃의 족보에 우리 산나리가 있습니다 | 꽃집에서 '아시아틱 백합'이라 부르는 그 꽃들은 사실 어느 한 종이 아닙니다. 여러 야생 나리를 몇 대에 걸쳐 섞어 만든 무리예요. 국제 구근 자료에 실린 부모 종 목록을 읽다 보면 익숙한 이름들이 나옵니다. 참나리, 솔나리, 털중나리 같은 동아시아의 산나리들이요. 그중 참나리는 고려 때 이두로 이름을 적어 둘 만큼 우리 곁에 오래 있던 꽃입니다. 그러니까 당신이 받은 그 주황빛 아시아틱 백합의 족보를 거슬러 오르면, 어느 지점에선가 여름마다 우리 산비탈에서 고개를 드는 그 꽃이 나온다는 뜻이에요. 아주 먼 데서 온 것처럼 보이는 꽃이, 알고 보면 돌아온 꽃이기도 합니다. | 수입 꽃인 줄 알았던 그 백합의 조상 중에, 우리 산의 참나리가 있습니다. | healing,mythic | just_because | korea | modern | history | Lilium — Pacific Bulb Society | https://www.pacificbulbsociety.org/pbswiki/index.php/Lilium | wiki | repeated |
| 21 | story-krlily-export-boom | lily-asiatic | 1975년의 꽃밭을 1이라 치면 | 1975년의 우리 꽃밭을 1이라고 놓으면 1990년의 꽃밭은 36이었습니다. 1995년에는 76, 1998년에는 87. 농촌진흥청이 정리한 숫자예요. 1990년대에 화훼농가는 8945호까지 늘었고, 꽃은 논밭을 대신할 작목이라 불렸습니다. 절화 가운데 장미와 국화와 백합, 이 셋이 칠 할 가까이를 차지했지요. 수출도 따라 커졌습니다. 1998년 1000만 달러였던 것이 2010년에는 1억 달러를 넘었어요. 새벽마다 백합 상자를 트럭에 싣던 사람들의 십이 년입니다. 그 뒤로는 다시 줄었어요. 2005년 1조 원이던 생산액이 2018년엔 5000억 원대가 되었고, 한 사람이 일 년에 쓰는 꽃값도 2만 원에서 1만 1800원으로 내려앉았습니다. 꽃밭은 늘 사람의 형편을 따라 움직입니다. | 1975년의 꽃밭을 1이라 치면, 1990년의 꽃밭은 36이었습니다. | healing, dramatic | — | korea | 1990s | history | 우리 화훼의 고진감래, 화훼산업의 짜릿한 역전 (농촌진흥청 웹진) | https://www.rda.go.kr/webzine/2020/03/sub1-2.html | magazine | repeated |

### 2-5. tulip-white (튤립) — 4편 · 기존 13편과 무중복

| # | story_id | flower_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | story_type | source_title | source_url | source_kind | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 22 | story-tulip-bollongier-impossible-bouquet | tulip-white | 이 꽃다발은 존재한 적이 없습니다 | 1639년, 하를럼의 화가 한스 볼롱히르가 꽃병 하나를 그렸습니다. 한가운데엔 셈페르 아우구스투스, 왼쪽엔 바이스로이. 둘 다 그 시절 가장 비쌌던 줄무늬 튤립이었어요. 그런데 이 그림에는 작은 비밀이 있습니다. 함께 꽂힌 꽃들은 피는 계절이 저마다 달라서, 이 다발은 세상 어디에서도 한꺼번에 존재할 수 없었다는 거예요. 화가는 눈앞의 꽃병을 옮겨 그린 게 아니라, 일 년치의 가장 아름다운 순간만 골라 한 병에 담은 셈입니다. 게다가 이 그림이 그려진 건 튤립 값이 무너진 1637년으로부터 겨우 두 해 뒤였습니다. 미술관은 이 그림이 그 붕괴를 빗댄 것인지에 대해서는 아직 결론을 내리지 않았다고 말합니다. 다만 확실한 건 하나예요. 사람은 가질 수 없는 것을 그림으로라도 곁에 두고 싶어 한다는 것. | 세상에서 가장 유명한 튤립 꽃다발은, 실제로는 단 하루도 존재한 적이 없습니다. | mythic,dramatic | just_because | netherlands | 17c | history | Floral Still Life, Hans Bollongier, 1639 (SK-A-799) — Rijksmuseum | https://www.rijksmuseum.nl/en/collection/object/Floral-Still-Life--c3c05d8cfd0da3b92a72445596e8a914 | museum | repeated |
| 23 | story-tulip-six-book-doctor-tulp | tulip-white | 350년을 버틴 튤립 그림책 | 암스테르담의 한 가문이 350년 가까이 지켜 온 책이 있습니다. 튤립과 카네이션 그림 104장이 붙어 있고, 꽃마다 이름 옆에 값이 적혀 있어요. 따로 접어 넣은 가격표도 두 장 남아 있습니다. 그러니까 이건 감상용 화집이 아니라, 구근을 파는 사람이 손님 앞에 펼쳐 놓던 상품 목록이었던 셈입니다. 꽃이 피지 않은 철에도 손님은 그림을 보고 고를 수 있었겠지요. 이 책은 렘브란트의 「해부학 강의」에 나오는 그 의사, 니콜라스 튈프의 손에 있었으리라 여겨집니다. 이름부터가 튤립을 닮은 사람이었어요. 책은 그 뒤 세이스 가문으로 넘어가 2019년까지 집안에 머물렀습니다. 꽃은 다 졌는데, 꽃값이 적힌 종이가 남아 그 시절을 우리에게 일러 줍니다. | 렘브란트 그림 속 그 의사의 이름이 하필 '튈프'였습니다. | dramatic | just_because | netherlands | 17c | history | Rijksmuseum displays tulip book from the Six Collection (press release) | https://www.rijksmuseum.nl/en/press/press-releases/rijksmuseum-displays-tulip-book-from-the-six-collection | museum | single_source |
| 24 | story-tulip-sylvestris-escaped-garden | tulip-white | 정원 밖으로 도망친 튤립 | 1577년, 식물학자 카롤루스 클루시우스가 편지에 이런 당부를 적었습니다. 이 튤립은 다른 것과 섞어 심지 마시라고요. 몇 해면 정원을 통째로 차지해 버릴 거라고요. 그가 걱정한 건 야생 튤립이었습니다. 오스만에서 건너온 화려한 원예 튤립과 달리, 이 꽃은 이탈리아 볼로냐와 프랑스 몽펠리에의 산기슭에서 북쪽으로 올라온 종이었어요. 볼로냐의 박물학자 알드로반디가 눌러 말린 표본은 1552년 것으로 남아 있습니다. 클루시우스의 걱정은 정확했습니다. 이 튤립은 땅속으로 가지를 뻗어 번졌고, 정원 담을 넘어 유럽의 들판으로 퍼졌습니다. 200년 뒤 린네는 이 꽃에 '숲의'라는 뜻의 이름을 붙였어요. 정원에서 도망친 꽃이, 끝내 야생의 이름을 얻은 겁니다. | 400년 전 어느 식물학자가 편지에 썼습니다. "이 튤립은 절대 섞어 심지 마세요." | funny,healing | just_because | europe | 16c | history | Tracing the introduction history of the tulip that went wild (Tulipa sylvestris) in sixteenth-century Europe, Scientific Reports | https://pmc.ncbi.nlm.nih.gov/articles/PMC9192774/ | paper | repeated |
| 25 | story-tulip-name-not-turban | tulip-white | 튤립이라는 이름의 미아 | 1555년 콘스탄티노플에 닿은 합스부르크 대사 오히어 기슬랭 드 부스베크는, 처음 보는 꽃을 두고 사람들이 '툴리판'이라 부르더라고 편지에 적었습니다. 향은 거의 없지만 색이 놀랍도록 다양하다고요. 그 편지 속 단어가 유럽 여러 나라 말에 그대로 남아 '튤립'이 되었습니다. 흔히들 그가 터번이라는 말을 꽃 이름으로 잘못 알아들었다고 이야기하지요. 그런데 정작 터키어로 이 꽃은 '랄레'입니다. 그리고 연구자들이 16세기 문헌을 다시 뒤졌지만, 그가 오해했다는 직접적인 기록은 끝내 찾지 못했습니다. 같은 무렵 어떤 학자는 꽃 모양이 달마티아 지방 모자를 닮아 그렇게 부른다고 적어 두기도 했고요. 이름의 유래가 흐릿하다는 건, 그만큼 많은 사람의 입을 거쳤다는 뜻이기도 합니다. | 튤립이 터번에서 온 이름이라는 이야기, 정작 16세기 기록에는 없습니다. | funny | just_because | turkey | 16c | history | Tulips or Turbans — Cambridge Library Collection Blog | https://cambridgelibrarycollection.wordpress.com/2013/03/19/tulips-or-turbans/ | magazine | varies |

### 2-6. freesia (프리지아) — 6편 · 기존 7편과 무중복

| # | story_id | flower_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | story_type | source_title | source_url | source_kind | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 26 | story-freesia-scent-measured-korea | freesia | 향을 숫자로 잰 사람들 | 졸업식 아침에 받은 프리지아가 왜 아직도 향이 날까요. 국립원예특작과학원 연구진은 그게 궁금해서 꽃향기를 숫자로 재 보기로 했습니다. 사람 코 대신 전자코를 썼어요. 결과는 이랬습니다. 봉오리보다 활짝 핀 꽃이 16%쯤 더 진했고, 향은 꽃잎에서 가장 강하게 났습니다. 향의 정체는 리날로올과 오시멘, 이 둘이 전체의 3분의 2를 넘었고요. 무엇보다 반가운 건 마지막 실험이었습니다. 7일 동안 저온 저장한 뒤에도 '샤이니골드'는 향의 상당 부분을 지키고 있었어요. 농장에서 도매시장을 지나 꽃집 냉장고까지, 그 며칠을 견디고도 남는 향이라는 뜻이지요. 당신이 맡은 그 냄새는 우연이 아니라, 견뎌 낸 것입니다. | 졸업식장까지 향이 남아 있을까. 누군가는 그걸 진짜로 재 봤습니다. | healing | celebration,gratitude | korea | 2020s | history | Analysis of Relative Scent Intensity, Volatile Compounds and Gene Expression in Freesia "Shiny Gold" (PMC) | https://pmc.ncbi.nlm.nih.gov/articles/PMC7698779/ | paper | single_source |
| 27 | story-freesia-korea-cultivar-share | freesia | 졸업식 꽃의 국적이 바뀌었습니다 | 1999년, 우리 연구자들이 프리지아 씨를 받기 시작했습니다. 그때 꽃집의 프리지아는 거의 다 남의 나라 품종이었어요. 4년을 매달려 2003년에야 첫 국산 품종 '샤이니골드'가 나옵니다. 그리고 조용한 역전이 시작돼요. 2008년 국산 품종 보급률은 겨우 8.5%였는데, 2017년에는 60.4%가 되었습니다. 우리나라 절화 가운데 국산 품종이 60%를 넘긴 건 프리지아가 처음이었어요. 대표 품종 '골드리치'는 두 해 만에 시장 점유율을 16.9%에서 36.4%로 끌어올렸고요. 프리지아는 국내 절화 시장에서 일곱 번째로 많이 팔리는 꽃입니다. 매년 2월, 수많은 졸업 사진 속에 들어가던 그 노란 다발이, 그 사이 조용히 국적을 바꿔 온 셈입니다. | 졸업식 프리지아의 국적이 바뀌는 데 18년이 걸렸습니다. | healing | celebration | korea | 2010s | history | 농진청, 국산 프리지아 품종 합동평가회 개최 — 투데이코리아 | https://www.todaykorea.co.kr/news/articleView.html?idxno=251131 | newspaper | repeated |
| 28 | story-freesia-jeonbuk-heartland | freesia | 그 꽃은 전북에서 옵니다 | 프리지아는 겨울 끝자락에 피는 꽃이라, 졸업 시즌이 곧 수확철입니다. 그런데 그 꽃이 어디서 오는지 아는 사람은 많지 않아요. 2011년 자료를 보면, 전국 프리지아 재배 면적 61.1헥타르 가운데 22.8헥타르가 전라북도였습니다. 열 뼘 중 거의 네 뼘이 전북 땅이었던 거예요. 그래서 전북도농업기술원은 일찍부터 '우리 품종'을 만드는 일에 매달렸습니다. 가장 많이 기르는 곳이 가장 아쉬웠던 겁니다. 남의 품종을 남의 이름으로 기르는 일 말이에요. 2월 어느 새벽, 아직 어두운 비닐하우스 안에서 누군가 프리지아를 자르고 있었을 겁니다. 그 꽃이 그날 오후 누군가의 졸업식장에 도착합니다. | 졸업식 꽃다발이 그날 새벽 어디에 있었는지 아세요? | healing | celebration | korea | 2010s | history | 프리지아 국내 신품종 육성 — KATI 농식품수출정보 | https://www.kati.net/board/exportNewsView.do?board_seq=35973&menu_dept2=35&menu_dept3=71 | newspaper | single_source |
| 29 | story-freesia-beyond-yellow | freesia | 아직 이름이 없는 서른 개 | 프리지아 하면 노란색을 떠올리시죠. 오래 그랬습니다. 시장에 나오는 품종이 노란 계열에 몰려 있었으니까요. 그런데 사람들이 흰 프리지아를, 분홍을, 보라를 찾기 시작했습니다. 전북농업기술원은 2010년부터 프리지아 품종을 만들어 왔고, 지금까지 19품종을 세상에 내놓았어요. 2026년 3월에는 아직 이름도 받지 못한 우수 계통 서른 가지를 늘어놓고 육종가와 농민들을 불러 모았습니다. 꽃색이 선명한지, 꽃대가 휘지 않는지, 꽃병에 꽂았을 때 오래 버티는지. 하나하나 손으로 만져 보며 골랐다고 해요. 이름 없는 서른 개 가운데 몇은, 몇 해 뒤 누군가의 졸업식 꽃다발이 될 겁니다. 아직은 아무도 그게 어느 것인지 모릅니다. | 이름도 없는 프리지아 서른 종이 심사대에 올랐습니다. | healing,dramatic | celebration | korea | 2020s | history | 전북농기원, 프리지아 우수계통 평가회 개최로 국산 품종 경쟁력 강화 — 국제뉴스 | https://www.gukjenews.com/news/articleView.html?idxno=3518403 | newspaper | single_source |
| 30 | story-freesia-vienna-greenhouse | freesia | 야생 프리지아는 한겨울에 핍니다 | 프리지아의 고향은 남아프리카 서케이프입니다. 헥스 강 골짜기에서 리틀카루를 지나 아우초른까지, 사암과 석회암이 부서진 마른 땅에 살아요. 그곳에서 이 꽃이 피는 때는 7월 중순부터 9월 초, 남반구의 한겨울과 이른 봄입니다. 혀가 긴 야생벌들이 꿀을 찾아 그때 찾아와요. 야생 프리지아는 우리가 아는 모습과 좀 다릅니다. 꽃빛은 옅은 흰빛이나 연둣빛이고, 아랫입술에만 주황 무늬가 있어요. 대신 향은 그때도 강했습니다. 장미 같기도, 제비꽃 같기도, 향신료 같기도 한 냄새요. 이 야생종을 옮겨 심어 본격적으로 기르기 시작한 곳은 19세기 후반의 빈이었습니다. 오늘 꽃집에 놓인 화려한 프리지아는 모두 그 온실에서 갈라져 나온 자손이에요. | 원래 이 꽃은 한겨울에, 그것도 거의 흰색으로 폈습니다. | mythic,healing | just_because | south-africa | 19c | history | Freesia refracta — PlantZAfrica, SANBI | https://pza.sanbi.org/freesia-refracta | garden | repeated |
| 31 | story-krmarket-namdaemun-1960 | freesia | 삼층으로 올라가면 봄이 있습니다 | 남대문시장 4길, 대도상가 삼층으로 올라가면 우리나라에서 가장 오래된 꽃 도매시장이 있습니다. 1960년부터 상인들이 모이기 시작했으니 양재동이나 고속터미널보다 한참 먼저예요. 서울 사람들이 '꽃시장' 하면 강남을 떠올리게 된 건 훨씬 나중 일입니다. 이곳의 하루는 새벽 다섯 시 반에 열려요. 계단을 올라가면 층 전체가 통째로 꽃이라, 문이 열리는 순간 계절이 먼저 인사를 합니다. 이월이면 프리지아 향이 층을 다 채우지요. 아직 바깥은 겨울인데 삼층에만 봄이 와 있는 겁니다. 값이 눅고, 종류가 많고, 지하철에서 내려 걸어갈 수 있다는 것. 육십 년 넘게 사람들이 이 계단을 오른 이유입니다. | 바깥은 아직 이월인데, 그 건물 삼층에는 이미 봄이 와 있습니다. | healing | just_because | korea | 1960 | history | 남대문 꽃시장, 봄의 시작을 만나는 곳 — 내 손안에 서울 (서울시) | https://mediahub.seoul.go.kr/archives/2003862 | magazine | varies |

### 2-7. gerbera (거베라) — 5편 · 기존 8편과 무중복

| # | story_id | flower_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | story_type | source_title | source_url | source_kind | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 32 | story-gerbera-adlam-authorship | gerbera | 이름은 남았고, 이름을 붙인 사람은 지워질 뻔했습니다 | 1884년 남아프리카 바버턴, 광맥을 찾아 돌아다니던 로버트 제임슨이 풀밭에서 붉은 데이지를 발견합니다. 그의 이름을 따 '제임소니'가 되었지요. 그런데 이 꽃을 학계에 처음 올린 사람이 누구인지는 오래 헷갈렸습니다. 1888년 피터마리츠버그의 R.W. 애들람이 원예 주간지 『가드너스 크로니클』에 유효한 기재문을 먼저 실었고, 이듬해 큐의 후커가 『보태니컬 매거진』에 실었어요. 세상은 오랫동안 후커의 이름을 적었습니다. 남아프리카국립생물다양성연구원은 지금 이렇게 정리합니다. 정당한 저자는 애들람이라고요. 꽃집 진열대의 거베라 한 송이에는, 먼저 알아보고도 늦게 인정받은 사람의 이름이 함께 붙어 있습니다. | 이 꽃을 세상에 알린 논문은 유명한 사람의 것이었지만, 이름의 주인은 따로 있었습니다. | dramatic | — | south-africa | 19c | history | Gerbera jamesonii \| PlantZAfrica (SANBI) | https://pza.sanbi.org/gerbera-jamesonii | garden | single_source |
| 33 | story-gerbera-neck-bend | gerbera | 꽃이 무거워서 목이 꺾입니다 | 거베라를 사 오면 유난히 잘 고개를 숙입니다. 꽃송이 바로 아래 7~12센티미터쯤, 늘 같은 자리가 접히지요. 2019년 중국 저장농림대 연구진이 그 지점을 유전자 수준까지 들여다봤습니다. 답은 '시들어서'가 아니었어요. 물길이 막히고, 잎 하나 없는 긴 줄기가 제 힘으로 물을 붙들지 못하면 세포가 팽팽함을 잃습니다. 그 순간 무거운 꽃머리를 중력이 잡아당기고, 스트레스 호르몬인 아브시스산이 치솟았어요. 거베라는 시든 게 아니라 목이 말랐던 겁니다. 화병에 꽂기 전 줄기를 물속에서 다시 자르라는 오래된 말이, 알고 보니 아주 정확한 처방이었습니다. | 하루 만에 고개를 숙인 거베라는 시든 게 아니라, 목이 마른 겁니다. | healing | comfort | china | modern | history | Transcriptome profiling of Gerbera hybrida reveals that stem bending is caused by water stress and regulation of abscisic acid | https://pmc.ncbi.nlm.nih.gov/articles/PMC6647082/ | paper | repeated |
| 34 | story-gerbera-korea-cultivar | gerbera | 하모니라는 이름의 거베라 | 오랫동안 우리 꽃시장의 거베라는 로열티를 내고 들여온 외국 품종이 채웠습니다. 국립원예특작과학원은 '하모니', '퍼플퀸', '메이퀸', '핑크멜로디' 같은 국산 품종 일곱 가지와 계통 둘을 골라, 종묘 5만 5,900주를 길러 냈어요. 그리고 부안과 영주를 비롯한 주산지 일곱 곳, 열두 농가에 나눠 심었습니다. 잘 자라는지, 팔리는지, 농가가 이듬해에도 다시 심고 싶어 하는지를 밭에서 확인한 겁니다. 그렇게 국산 거베라 보급률 18.0%가 기록됐습니다. 열 송이 중 두 송이가 채 못 되는 숫자지만, 그 두 송이에는 한국말로 이름을 지어 준 사람들이 있습니다. | 국산 거베라 보급률 18%라는 숫자 뒤에는, 열두 농가의 한 해가 있었습니다. | healing | celebration | korea | 2010s | history | [보고서] 국산 거베라, 카네이션 보급 확대를 위한 종묘생산 및 현장실증재배 (국립원예특작과학원) | https://scienceon.kisti.re.kr/srch/selectPORSrchReport.do?cn=TRKO201500010773 | paper | single_source |
| 35 | story-gerbera-korea-wreath | gerbera | 축하의 자리에 가장 자주 놓이는 꽃 | 새로 문을 연 가게 앞, 리본을 두른 화환이 서 있습니다. 거기에 가장 자주 꽂히는 꽃이 거베라예요. 농촌진흥청 자료에 따르면 거베라는 장미와 프리지어, 국화 다음으로 국내 절화 시장에서 거래량이 많습니다. 향이 거의 없고 색이 또렷하고 꽃 모양이 크고 단순해서, 멀리서도 한눈에 읽히거든요. 화환은 원래 멀리서 보라고 만든 물건이니까요. 이 꽃의 꽃말은 '신비'와 '수수께끼'인데, 정작 이 꽃이 놓이는 자리는 가장 분명한 마음이 필요한 자리입니다. 축하한다고, 잘되라고, 말없이 크게 말해 주는 꽃입니다. | 개업식 화환 앞을 무심코 지나쳤던 그 꽃이, 한국 절화 시장 4위입니다. | healing | celebration | korea | modern | history | 농업새소식 — 거베라(농촌진흥청 배포자료, 세종특별자치시 게시) | https://www.sejong.go.kr/bbs/R3168/view.do?nttId=B000000052624Yp5qV7q&mno=sub03_04&pageIndex=1 | garden | single_source |
| 36 | story-krwreath-three-tier | gerbera | 세 단짜리 화환이 서 있는 자리 | 결혼식장에 가도, 장례식장에 가도 입구에는 세 단짜리 화환이 줄지어 서 있습니다. 언제부터 이 모양이었는지 딱 잘라 말하는 사람이 없을 만큼 익숙한 풍경이에요. 2012년 한 신문 칼럼은 여기에 숫자 하나를 붙였습니다. 화훼농가가 기른 꽃의 육십 퍼센트가 경조사 화환으로 간다는 이야기였어요. 우리가 꽃집에서 사는 꽃보다, 이름을 적은 리본을 달고 남의 자리에 서 있는 꽃이 훨씬 많았던 겁니다. 2011년부터는 한 단짜리 새 화환을 만들어 보려는 시도도 있었어요. 세 단짜리보다 삼만 원쯤 눅었고요. 축하도 위로도 결국 사람에게 가 닿아야 하는데, 그 사이에 늘 꽃이 놓여 있습니다. | 우리 화훼농가가 기른 꽃의 육십 퍼센트는, 사람이 아니라 화환으로 갑니다. | healing | celebration | korea | 2012 | history | [여적] 경조사 화환 (경향신문) | https://www.khan.co.kr/article/201203092200015 | newspaper | single_source |

### 2-8. lisianthus (리시안셔스) — 3편 · 기존 6편과 무중복

| # | story_id | flower_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | story_type | source_title | source_url | source_kind | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 37 | story-lisianthus-drummond-bedford | lisianthus | 씨앗은 도착했고, 보낸 사람은 돌아오지 못했습니다 | 1835년, 스코틀랜드 사람 토머스 드러먼드는 텍사스 산펠리페데오스틴에서 영국으로 씨앗을 부칩니다. 상자에는 짧은 말이 함께 있었어요. 아름다움에서 어떤 식물에도 뒤지지 않는다고요. 그해 그는 쿠바 아바나에서 세상을 떠납니다. 그를 후원하기로 한 베드퍼드 공작의 도움이 온전히 닿기 전이었습니다. 씨앗은 살아남아 1837년 8월, 보스웰 캐슬의 온실에서 턴불이라는 정원사의 손 아래 처음 꽃을 피웠어요. 후커는 도판 3626번에 이렇게 적었습니다. 한 송이가 3주 동안 아름다움을 잃지 않았다고요. 꽃 이름은 공작의 성을 따 '러셀리아눔'이 되었습니다. 부고보다 먼저 도착한 씨앗이, 3주를 피어 있었습니다. | "어떤 식물도 이 꽃보다 아름답지 않다" — 이 메모를 쓴 사람은 꽃이 피는 걸 보지 못했습니다. | tragic, romantic | — | usa | 19c | history | Curtis's Botanical Magazine v.65, Tab. 3626 "Lisianthus Russellianus" (1839) — Internet Archive 스캔 전문 | https://archive.org/download/mobot31753002721386/mobot31753002721386_djvu.txt | book-pd | repeated |
| 38 | story-lisianthus-rosette | lisianthus | 더우면 이 꽃은 피지 않고 웅크립니다 | 리시안셔스는 참을성이 유별납니다. 모종을 기를 때 밤 온도가 20도를 넘으면 줄기를 올리지 않고, 잎만 방석처럼 낮게 깔아 버려요. 농사로에서는 이걸 '로제트'라고 부릅니다. 여름의 고온과 건조, 가을의 짧은 해와 약한 빛이 겹치면 식물이 스스로 멈춰 서는 겁니다. 이 잠을 깨우는 방법은 하나, 추위예요. 15도 아래 저온을 겪어야 다시 자랍니다. 다만 10도에서 4~5주를 둘 땐 반드시 약한 빛을 함께 줘야 해요. 캄캄한 데 두면 그대로 말라 죽습니다. 웅크린 것을 깨우려면 추위가 필요하지만 빛까지 빼앗으면 안 된다는 것. 이 꽃이 오래 알려 준 사실입니다. | 리시안셔스가 안 핀다면 게을러서가 아니라, 여름을 견디는 중입니다. | healing | comfort | korea | modern | history | 꽃도라지 재배 — 농사로(농촌진흥청 농업기술포털) | https://www.nongsaro.go.kr/portal/ps/psb/psbl/workScheduleDtl.ps?menuId=PS00087&cntntsNo=30675&sKidofcomdtySeCode=210003&totalSearchYn=Y | garden | single_source |
| 39 | story-lisianthus-texas-picked | lisianthus | 너무 예뻐서 사라진 들꽃 | 텍사스에서는 리시안셔스를 '텍사스 블루벨'이라고 부릅니다. 한때 초원 어디에나 피던 꽃이었어요. 지금은 훨씬 보기 어렵습니다. 텍사스자생식물협회는 이유를 이렇게 적습니다. 너무 아름다워서 사람들이 참지 못하고 꺾었기 때문이라고요. 꺾인 꽃은 수분되지 못하고, 씨앗을 남기지 못합니다. 그렇게 몇십 년 동안 조금씩, 초원은 다음 세대를 잃었습니다. 다행히 이 꽃의 씨앗은 아주 작아서 흙 위에 흩뿌리고 빛만 닿게 해 주면 잘 싹터요. 그래서 그들은 이렇게 권합니다. 들에서 꺾지 말고 씨앗을 받아 심으라고요. 사랑하는 방법을 바꾸면 꽃은 돌아옵니다. | 텍사스 초원에서 이 꽃이 줄어든 이유는 개발도 가뭄도 아니었습니다. | tragic, healing | — | usa | 20c | history | Plant of the Month: Texas Bluebells — Native Plant Society of Texas | https://www.npsot.org/posts/plant-of-the-month-texas-bluebells/ | garden | single_source |

### 2-9. babys-breath (안개꽃) — 5편 · 기존 3편과 무중복

| # | story_id | flower_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | story_type | source_title | source_url | source_kind | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 40 | story-babysbreath-never-drops-petals | babys-breath | 지는 대신 마르기로 한 꽃 | 대부분의 꽃은 에틸렌이라는 기체 신호를 받고 꽃잎을 떨굽니다. 이제 끝났다고 알려 주는 신호지요. 2022년 연구진이 안개꽃의 염색체 수준 유전체를 처음 읽어 냈는데, 이 꽃에는 그 신호를 받는 수용체가 거의 켜지지 않았습니다. 신호를 이어받는 유전자도 34개뿐이었어요. 애기장대가 118개, 바나나가 205개인 걸 생각하면 아주 적습니다. 그래서 안개꽃은 꽃잎을 떨어뜨리는 대신 반투명해지고, 안으로 말리고, 그대로 마릅니다. 우리가 아는 그 드라이플라워가 되는 이유가 여기 있었어요. 이 꽃은 지는 법을 배우지 않고, 남는 법을 배운 셈입니다. | 안개꽃은 시들어도 꽃잎을 떨어뜨리지 않습니다. 그 이유가 유전자에 적혀 있었어요. | healing, mythic | comfort, anniversary | china | modern | history | The chromosome-level genome of Gypsophila paniculata reveals the molecular mechanism of floral development and ethylene insensitivity (Horticulture Research, 2022) | https://pmc.ncbi.nlm.nih.gov/articles/PMC9533222/ | paper | single_source |
| 41 | story-babysbreath-kenya-color | babys-breath | 물들이는 대신, 색을 심으려 한 사람들 | 안개꽃은 대개 흽니다. 분홍과 연녹색이 조금 섞여 나올 뿐이지요. 2017년 케냐의 이매지네이처라는 회사가 국가바이오안전청에 노지 시험 신청서를 냈습니다. 애기장대에서 가져온 유전 요소를 넣어, 진보라부터 붉은색, 연분홍까지 스스로 색을 내는 안개꽃을 만들어 보겠다는 것이었어요. 케냐는 꽃을 수출해 외화를 버는 나라이고, 안개꽃은 그중 큰 품목입니다. 나중에 색을 입히는 대신, 색을 갖고 태어나게 하겠다는 이야기. 아기의 숨결이라는 이름을 가진 이 작고 흰 꽃 앞에서, 사람들은 여전히 다른 색을 상상합니다. | 흰 안개꽃에 색을 '칠하는' 대신 '심으려는' 사람들이 있었습니다. | dramatic | — | kenya | 2010s | history | Kenya's Imaginature Seeks Approval for Field Trial of GE Baby's Breath Flowers (Crop Biotech Update, ISAAA, 2017) | https://www.isaaa.org/kc/cropbiotechupdate/article/default.asp?ID=15530 | magazine | single_source |
| 42 | story-babysbreath-korea-graduation-price | babys-breath | 졸업식 꽃다발에서 가장 많이 오른 것 | 2025년 2월, 서울신문이 졸업 시즌 꽃값을 들여다봤습니다. 한국농수산식품유통공사 경매 자료에서 안개꽃은 1만 2,234원에서 1만 7,957원으로 올랐어요. 장미도 프리지어도 올랐지만 안개꽃의 상승 폭이 유난했습니다. 시설하우스 등유가 1리터에 1,150원, 한 해 새 200~300원이 뛴 탓이 컸지요. 한때 1~2만 원이면 되던 졸업식 꽃다발은 이제 최소 3만 원, 풍성하게 하면 7만 원입니다. 한 꽃집 주인은 이렇게 말했습니다. 꽃은 생물이라 길어야 2주를 보관한다고요. 오래 '곁들이는 꽃'이라 불렸던 안개꽃이, 이제 꽃다발 값을 좌우합니다. | 3만 원짜리 졸업식 꽃다발에서 값이 가장 크게 뛴 건 주인공이 아니라 곁의 꽃이었습니다. | dramatic | celebration | korea | 2020s | history | "꽃 너무 비싸요"·"생산비 부담 커"…졸업 시즌 소비자·화훼업계 동시 한숨 (서울신문, 2025-02-13) | https://www.seoul.co.kr/news/economy/distribution/2025/02/13/20250213500185 | newspaper | single_source |
| 43 | story-babysbreath-cold-lover | babys-breath | 여름을 싫어하는 꽃이, 가장 더운 날의 예식장에 놓입니다 | 안개초의 영어 이름은 'Baby's breath', 아기의 숨결입니다. 요정처럼 작은 꽃들이 몽글몽글 뭉쳐 송이를 이루니 그런 이름이 붙었지요. 그런데 이 다정한 이름의 꽃은 더위를 아주 싫어합니다. 시베리아처럼 추운 곳이 고향이라, 30도가 넘으면 고온 장해를 입어요. 그래서 한국에서는 여름이면 중산간 고랭지에서 전문적으로 기릅니다. 서늘한 자리를 찾아 산으로 올라가는 셈이지요. 농사로는 이 꽃의 성질을 이렇게 적습니다. 추위에 한 번 멈췄다가, 다시 저온과 긴 해와 강한 빛을 만나면 왕성하게 자라 꽃을 피운다고요. 한 번 웅크렸다 피는 꽃이 가장 기쁜 날 곁에 놓입니다. | 아기의 숨결이라는 이름을 가진 이 꽃의 고향은, 시베리아처럼 추운 곳입니다. | healing | celebration, just_because | korea | modern | history | 간절한 기쁨을 전하는 꽃, '안개초' (송정섭, 농촌여성신문, 2024-11-11) | https://www.rwn.co.kr/news/articleView.html?idxno=74972 | newspaper | repeated |
| 44 | story-krbouquet-babysbreath-half | babys-breath | 그 꽃다발의 절반은 안개꽃이었어요 | 졸업식에서 받아 든 꽃다발을 떠올려 보세요. 아마 '장미 꽃다발'로 기억하실 겁니다. 그런데 그 다발에서 부피의 대부분을 차지한 건 대개 안개꽃이었어요. 식물세밀화를 그리는 이소영 작가는 이 사실을 짚습니다. 안개꽃은 부피에 비해 값이 눅어서 빈자리를 넉넉히 채워 주고, 무엇보다 곁에 선 장미를 더 붉어 보이게 만든다고요. 장미만으로 그만한 다발을 묶으려면 값이 몇 배가 됩니다. 그러니까 우리는 안개꽃 덕분에 그 꽃다발을 받은 셈인데, 정작 기억 속에는 남지 않았어요. 작가는 눈에 잘 띄지 않는 작고 평범한 꽃을 조금 더 귀히 보자고 씁니다. 사람도 그렇지 않으냐고요. | 당신이 받은 그 장미 꽃다발, 사실 절반 넘게 안개꽃이었습니다. | healing | gratitude, just_because | korea | modern | literary | [이소영의 도시식물 탐색] 꽃다발 속 안개꽃의 의미 (서울신문) | https://www.seoul.co.kr/news/editOpinion/opinion/plants-story-lsy/2021/02/04/20210204029011 | newspaper | single_source |

### 2-10. hydrangea (수국) — 7편 · 기존 6편과 무중복

| # | story_id | flower_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | story_type | source_title | source_url | source_kind | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 45 | story-hydrangea-hortensia-name | hydrangea | 오르탕스가 누구인지는 아무도 모릅니다 | 1771년, 프랑스 식물학자 필리베르 코메르송은 모리셔스 섬의 어느 정원에서 처음 보는 꽃을 만납니다. 그리고 그 꽃에 '오르탕지아'라는 이름을 붙였어요. 그런데 오르탕스가 누구였는지는 지금도 아무도 모릅니다. 함께 탐험을 다녀온 나사우 공의 딸 오르탕스였다는 이야기가 있고, 그가 마음에 두었던 사람이었다는 이야기도 있어요. 라틴어로 정원을 뜻하는 '호르투스'에서 왔을 뿐 사람 이름이 아니라는 설명도 있고요. 학명 히드란게아는 1739년에 이미 붙어 있었으니, 오르탕지아는 순전히 사람들이 그렇게 부르고 싶어서 남은 이름입니다. 이름의 주인을 잃어버린 채 250년을 불려 온 꽃. 어쩌면 그 빈칸이 이 꽃을 더 오래 기억하게 했는지도 모릅니다. | 이 꽃의 별명은 어느 여인의 이름이라는데, 그 여인이 누구인지는 아무도 모릅니다. | mythic, romantic | just_because | france-mauritius | 1771 | history | How the hydrangea got its name | https://www.plantsandflowersfoundationholland.org/en/how-hydrangea-got-its-name/ | garden | varies |
| 46 | story-hydrangea-bartram-travels | hydrangea | 보는 사람을 기쁘게 하려고만 만들어진 것 같다 | 1770년대, 윌리엄 바트람은 미국 남부의 숲을 몇 해나 걸어 다녔습니다. 그리고 1791년 필라델피아에서 『여행기』를 펴내며 그 책 서문에 자기가 만난 놀라운 식물들의 이름을 줄줄이 적었어요. 그중 하나가 떡갈잎 수국입니다. 그는 이런 식물들을 두고 "보는 사람을 꾸미고 기쁘게 하려고만 만들어진 것 같다"고 썼습니다. 오래 걸은 사람이 할 법한 말이지요. 책 앞의 동판화 목록에도 이 꽃의 이름이 올라 있습니다. 참나무 잎을 닮은 잎에, 원뿔로 솟는 흰 꽃. 지금은 정원에서 흔히 보지만 그때는 누군가 몇 달을 걸어야 겨우 닿는 꽃이었습니다. | "보는 사람을 기쁘게 하려고만 만들어진 것 같다." 1791년, 어느 여행자가 이 꽃을 두고 쓴 말입니다. | healing, mythic | just_because | north-america | 1791 | history | The Travels of William Bartram (1791) | https://www.gutenberg.org/files/63678/63678-h/63678-h.htm | book-pd | repeated |
| 47 | story-hydrangea-sevenbark | hydrangea | 껍질이 일곱 겹인 나무 | 미국 동부 사람들은 이 수국을 '세븐바크', 껍질이 일곱 겹인 나무라고 부릅니다. 실제로 줄기 껍질이 아주 얇은 층으로 벗겨지는데, 벗겨낼 때마다 안쪽 색이 달라서 그런 이름이 붙었어요. 일곱은 셀 수 없이 많다는 뜻이겠지요. 체로키 사람들은 이 나무를 가까이 두고 살았습니다. 속껍질과 잎을 씹었고, 껍질을 긁어 화상이나 부은 자리에 붙였어요. 봄에 갓 자란 어린 가지는 껍질을 벗겨 삶거나 구워 먹기도 했고요. 뉴욕에서 플로리다까지, 서쪽으로 아이오와와 루이지애나까지 개울가와 바위 비탈에 저 혼자 자라는 나무입니다. 흰 꽃 뭉치보다 먼저, 사람들은 이 나무의 껍질을 알았습니다. | 껍질을 벗길 때마다 색이 달라서, 사람들은 이 나무를 '일곱 겹 껍질'이라 불렀습니다. | healing, mythic | just_because | north-america | pre-modern | history | Hydrangea arborescens (Sevenbark) — NC State Extension Gardener Plant Toolbox | https://plants.ces.ncsu.edu/plants/hydrangea-arborescens/ | garden | repeated |
| 48 | story-hydrangea-korea-native-clades | hydrangea | 우리 산에도 수국 식구가 삽니다 | 수국은 화원에서 사 오는 꽃 같지만, 우리 산에도 수국 식구가 삽니다. 2016년 영남대 연구진이 한국에 사는 수국속 일곱 무리의 DNA를 읽어 계보를 그렸어요. 핵과 엽록체의 유전자를 나란히 놓고 보니 한국의 수국속은 하나의 뿌리에서 갈라진 한 가족이었습니다. 그리고 산수국과 수국은 서로 다른 가지에 앉아 있었어요. 둘을 같은 종의 변이로 보던 오랜 습관을 다시 생각하게 하는 결과였습니다. 재미있는 건 등수국입니다. 제주도에서 자라는 무리와 울릉도에서 자라는 무리가 서로 다른 편에 놓였거든요. 바다가 갈라놓은 시간이 잎맥 대신 유전자에 남은 셈입니다. | 제주도의 등수국과 울릉도의 등수국은, 유전자로 보면 서로 다른 자리에 앉아 있었습니다. | healing, mythic | just_because | korea | 2016 | history | Molecular Phylogenetic Study of Korean Hydrangea L. (한국자원식물학회지 29-4) | https://koreascience.or.kr/article/JAKO201627939281385.page | paper | single_source |
| 49 | story-hydrangea-manyoshu-eight-fold | hydrangea | 여덟 겹으로 피니 여덟 대까지 | 8세기 일본의 노래 모음 『만엽집』 스무 번째 권에 수국이 등장합니다. 좌대신 다치바나노 모로에가 어느 집 잔치에서 지은 노래예요. 수국이 여덟 겹으로 피듯 여덟 대에 이르도록 계십시오, 그대를 보며 그리워하겠습니다. 노래 끝에는 좌대신이 '아지사이 꽃에 부쳐 읊었다'는 주가 붙어 있습니다. 그때 아지사이는 지금과 전혀 다른 한자로 적혔어요. 소리만 빌려 온 글자들이라 읽는 사람이 소리 내어 불러야 비로소 꽃 이름이 되었습니다. 겹겹이 포개진 꽃송이를 보고 여러 대의 세월을 떠올린 사람. 잔칫상 앞에서 그가 바란 건 오래오래 함께 있자는 말이었습니다. | 여덟 겹으로 피는 꽃을 보고, 여덟 대까지 계시라고 노래한 사람이 있었습니다. | healing, romantic | celebration, gratitude | japan | 8c | literary | 万葉集 第二十巻 (4448번, 橘諸兄) — 일본어 위키문헌 | https://ja.wikisource.org/wiki/%E4%B8%87%E8%91%89%E9%9B%86/%E7%AC%AC%E4%BA%8C%E5%8D%81%E5%B7%BB | book-pd | repeated |
| 50 | story-krhydrangea-domestic-cultivars | hydrangea | 우리말 이름표를 단 수국 | 서울식물원 지중해온실에서는 해마다 오월이면 수국을 펼쳐 놓습니다. 전라남도농업기술원과 손잡고 여덟 해째 이어 온 자리예요. 오백 점 남짓한 수국이 들어서는데, 그중에는 '핑크아리' '모닝스타' '섬머스타' 같은 이름표가 섞여 있습니다. 우리말 이름이 붙은 국산 품종들이에요. 2024년에 나온 '핑크유'는 꽃잎 가장자리가 톱니처럼 갈라진 진분홍 꽃을 답니다. 수국은 흙의 산도에 따라 분홍에서 하늘색까지 색이 옮겨 가는 꽃이라, 같은 품종도 심는 자리에 따라 다른 얼굴이 되지요. 어디서도 보기 힘든 새 품종을 만나는 자리라고 식물원 쪽은 말합니다. 누군가 이름을 지어 준 수국이 해마다 늘고 있습니다. | '핑크유', '모닝스타'. 우리말 이름표를 단 수국이 해마다 늘고 있습니다. | healing | just_because | korea | 2026 | history | 도심서 수국 잔치…서울식물원, '낭만수국전' 2일 개최 (서울신문) | https://www.seoul.co.kr/news/society/2026/05/01/20260501500105 | newspaper | single_source |
| 51 | story-krjeju-jongdal-hydrangea-road | hydrangea | 마을 하나가 통째로 수국길이 되기까지 | 제주시 구좌읍 종달리, 바다를 끼고 도는 해안도로 양옆이 여름이면 통째로 파랗습니다. 이 길은 저절로 생긴 게 아니에요. 1990년대 중반 제주도가 '수국 로드'를 만들겠다며 길가에 수국을 심은 것이 시작이었습니다. 지금은 제주 곳곳에 노지 수국 길이 있지만, 종달리가 그 첫 자리이자 가장 무성한 자리로 꼽혀요. 제주 수국이 유난히 파란 데는 이유가 있습니다. 화산이 남긴 흙이 강한 산성이라, 아무도 손대지 않아도 꽃이 저 혼자 짙푸르게 핍니다. 유월 초순에 하나둘 열리기 시작해 중순이면 길 전체가 물들어요. 그 무렵이면 조용하던 마을에 사람이 평소보다 삼 할 넘게 들어옵니다. 삼십 년 전 누군가 심어 둔 묘목이 지금 마을의 여름이 되었습니다. | 삼십 년 전 길가에 심어 둔 묘목 몇 그루가, 지금은 마을의 여름 전체가 되었습니다. | healing | just_because | korea | 1990s | history | 지금 준비해야 갈 수 있다…수국 명소 제주 구좌읍 '종달리' (뉴시스) | https://v.daum.net/v/20260506060421960 | newspaper | single_source |

### 2-11. ranunculus (라넌큘러스) — 4편 · 기존 5편과 무중복

| # | story_id | flower_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | story_type | source_title | source_url | source_kind | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 52 | story-ranunculus-snow-suntracking | ranunculus | 눈이 녹는 자리마다 해를 따라 돕니다 | 로키산맥 해발 삼천 미터 언저리, 눈이 녹기 시작하는 자리에 이 미나리아재비가 있습니다. 눈 가장자리에서 싹이 올라와 며칠 만에 꽃을 피워요. 그래서 가파른 비탈에서는 아래쪽부터 꽃이 피고, 눈이 물러난 만큼 며칠 간격으로 꽃자리가 위로 올라갑니다. 눈이 걷히는 속도가 곧 개화의 속도인 셈이지요. 이 꽃에는 습관이 하나 있습니다. 아침부터 오후까지 해를 따라 고개를 돌려요. 오목한 꽃 안쪽에 볕을 모아 스스로를 데우고, 그 온기로 곤충을 부릅니다. 1989년 연구에 따르면 해와 45도 안쪽으로 정렬하지 못한 꽃은 찾아오는 벌레가 줄고 맺는 씨앗도 크게 줄었습니다. 열흘 남짓 피는 꽃이 하루를 통째로 해에 쓰는 이유입니다. | 눈이 녹는 만큼만 피고, 피어 있는 동안은 온종일 해를 따라 도는 꽃입니다. | healing, mythic | just_because | north-america | 1989 | history | Ranunculus adoneus — Wikipedia (Stanton & Galen 1989 인용) | https://en.wikipedia.org/wiki/Ranunculus_adoneus | wiki | repeated |
| 53 | story-ranunculus-weaver-florists | ranunculus | 베틀 옆에 화분을 두던 사람들 | 18세기와 19세기 영국에서 '플로리스트'는 꽃집 주인이 아니라 꽃을 길러 전시회에 내놓는 사람이었습니다. 라넌큘러스는 그들이 겨루던 대표 종목 가운데 하나였어요. 스코틀랜드에서는 클라이드 만의 따뜻한 바람 덕에 이 꽃이 잘 자라서, 1800년 무렵이면 꽃잎에 점이 박힌 것, 가장자리에만 색이 도는 것까지 갈래가 무척 넓어졌습니다. 한 기록가는 튤립 한 품종이 이름을 얻을 때 라넌큘러스는 열 품종이 이름을 얻었다고 어림했지요. 꽃을 기른 사람들은 대개 장인이었습니다. 페이즐리에서 모슬린을 짜던 직조공 존 매크리는 자기가 길러 낸 패랭이 품종을 조지 3세에게 바쳤어요. 베틀 옆에 화분을 두던 손끝에서 이 꽃의 겹은 그렇게 늘어났습니다. | 튤립 한 품종이 이름을 얻을 때, 라넌큘러스는 열 품종이 이름을 얻었습니다. | healing, dramatic | just_because | scotland-england | 18-19c | history | The Scots' Ranunculus — Netherhall Manor | https://www.netherhallmanor.com/articles/the-scotsranunculus | garden | single_source |
| 54 | story-ranunculus-doubling-france-italy | ranunculus | 겹을 한 겹씩 얹어 백 년 | 우리가 아는 라넌큘러스, 종이를 겹겹이 오려 붙인 것 같은 그 꽃은 야생의 모습이 아닙니다. 라넌큘러스 아시아티쿠스는 남서유럽에서 중동에 걸쳐 자라는 들꽃이었고, 아주 오래전부터 사람 손에서 길러졌어요. 19세기 중반 프랑스의 재배자들이 터키에서 건너온 겹꽃 계통을 다시 골라 붙여 반겹의 '프렌치' 계통을 만듭니다. 꽃송이마다 얼룩 하나가 박히는 것이 그 계통의 표시였어요. 그로부터 오십 년쯤 뒤, 이탈리아에서 마침내 작약처럼 완전히 겹으로 차오르는 계통이 나옵니다. 한 세대가 겹을 하나 더 얹고, 다음 세대가 또 하나를 얹었습니다. 지금 손에 든 꽃 한 송이에는 그 백 년이 접혀 있습니다. | 이 꽃의 겹은 한 사람이 만든 게 아닙니다. 백 년에 걸쳐 한 겹씩 늘었어요. | healing, romantic | anniversary, just_because | france-italy | 19c | history | Persian Buttercups — Bob Flowerdew, Hartley Botanic Magazine | https://hartley-botanic.com/magazine/persian-buttercups/ | magazine | single_source |
| 55 | story-ranunculus-wordsworth-celandine | ranunculus | 시인이 세 번이나 노래한 작은 꽃 | 워즈워스는 작은 꽃 하나에 시를 세 편이나 바쳤습니다. 애기미나리아재비, 오래도록 라넌큘러스 피카리아라는 학명으로 불린 그 꽃이에요. 지금은 다른 속으로 옮겨 갔지만 그가 노래하던 시절엔 분명 라넌큘러스였습니다. 1815년 시집에 실린 마지막 편은 이렇게 시작해요. "한 송이 꽃이 있다, 작은 애기미나리아재비. 다른 많은 것들처럼 추위와 비를 피해 움츠린다. 그러다 해가 비칠 그 첫 순간, 해 그 자신처럼 환하게 다시 나온다." 그런데 시의 뒷부분에서 시인은 늙고 쪼그라든 꽃 한 송이를 봅니다. 젊은 날 예찬하던 바로 그 꽃을요. 오래 들여다본 사람만 쓸 수 있는 시입니다. | 같은 꽃에 시를 세 편 바친 시인이, 마지막 편에서는 늙어 버린 그 꽃을 봅니다. | healing, tragic | comfort, just_because | england | 1815 | literary | Poems (Wordsworth, 1815) Vol.2 — "The small Celandine" (위키문헌) | https://en.wikisource.org/wiki/Poems_(Wordsworth,_1815)/Volume_2/The_small_Celandine | book-pd | repeated |

---

## 3. 꽃말 표

> `color` 는 `content/meanings.csv` 의 영문 색 어휘로 정규화했습니다(`흰색`→`white` 등). 빈 값은 색 구분이 없는 총칭 항목입니다.

| flower_id | color | meaning_ko | culture_region | era | source_title | source_url | source_kind | confidence | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| rose-red | white | 나는 당신에게 어울리는 사람입니다 | uk | 19c | Language of Flowers (Kate Greenaway, 1884) | https://www.gutenberg.org/files/31591/31591-h/31591-h.htm | book-pd | single_source | 원문 "Rose, White — I am worthy of you." 1884년 간행 PD, 직접 인용 가능 |
| rose-red | red | 그리스도의 피를 기억하는 꽃 | europe | 16c | 7 Favorite Flowers from Renaissance Manuscripts and Their Christian Symbolism (Getty Iris, Tristan Bravinder, 2016, CC BY 4.0 재게시본) | https://brewminate.com/flowers-in-renaissance-manuscripts-and-their-symbolism/ | museum | single_source | Getty 원문 URL은 본문 잘림으로 미열람. 스피놀라 시간서(Getty Ms. Ludwig IX 18, 약 1510~20) 근거 |
| rose-red |  | 기쁨과 아픔이 함께 옵니다 (개장미) | uk | 19c | Language of Flowers (Kate Greenaway, 1884) | https://www.gutenberg.org/files/31591/31591-h/31591-h.htm | book-pd | single_source | 원문 "Rose, Dog — Pleasure and pain." |
| chrysanthemum | white | 진실 | uk | 19c | Language of Flowers (Kate Greenaway, 1884) | https://www.gutenberg.org/files/31591/31591-h/31591-h.htm | book-pd | single_source | 원문 "Chrysanthemum, White — Truth." 기존 '흰 국화 애도'와 대비되는 반전 카피로 유용 |
| chrysanthemum | yellow | 푸대접받은 사랑 | uk | 19c | Language of Flowers (Kate Greenaway, 1884) | https://www.gutenberg.org/files/31591/31591-h/31591-h.htm | book-pd | single_source | 원문 "Chrysanthemum, Yellow — Slighted love." |
| chrysanthemum | white | 슬픔과 애도 (프랑스 만성절) | france | 20c | Why are chrysanthemums the flower of Toussaint in France? (The Connexion) | https://www.connexionfrance.com/practical/why-are-chrysanthemums-the-flower-of-toussaint-in-france/284168 | newspaper | single_source | 기존 '흰 국화 한 송이 애도'와 의미가 가까움. 문화권(프랑스)·맥락(만성절)이 달라 별행으로 뒀으나, 중복 판정 시 삭제 가능 |
| carnation | red | 아, 가여운 내 마음 | uk | 19c | Language of Flowers (Kate Greenaway, 1884) | https://www.gutenberg.org/files/31591/31591-h/31591-h.htm | book-pd | single_source | 원문 "Carnation, Deep Red — Alas! for my poor heart." |
| carnation | variegated | 거절합니다 | uk | 19c | Language of Flowers (Kate Greenaway, 1884) | https://www.gutenberg.org/files/31591/31591-h/31591-h.htm | book-pd | single_source | 원문 "Carnation, Striped — Refusal." |
| carnation | yellow | 경멸 | uk | 19c | Language of Flowers (Kate Greenaway, 1884) | https://www.gutenberg.org/files/31591/31591-h/31591-h.htm | book-pd | single_source | 원문 "Carnation, Yellow — Disdain." 선물용으로는 부적합, 카피 경고용 |
| carnation |  | 십자가의 못을 기억하는 꽃 | europe | 16c | 7 Favorite Flowers from Renaissance Manuscripts and Their Christian Symbolism (Getty Iris, CC BY 4.0 재게시본) | https://brewminate.com/flowers-in-renaissance-manuscripts-and-their-symbolism/ | museum | single_source | 기존 "신의 꽃(dianthus 어원)"과는 다른 갈래. 못·대관(冠) 상징 |
| lily-asiatic |  | 주목받다 | japan | modern | 花言葉-由来「ユリ」 | https://hananokotoba.com/lily/ | wiki | single_source | 스카시유리(透百合)에 붙는 꽃말. 스카시유리는 위를 보고 피는 아시아틱 계열이라 이 flower_id에 정확히 대응 |
| lily-asiatic |  | 꾸미지 않은 아름다움 | japan | modern | 花言葉-由来「ユリ」 | https://hananokotoba.com/lily/ | wiki | single_source | 원어 「飾らぬ美」. 향이 없고 형태가 단정한 아시아틱 백합의 성격과 잘 맞음 |
| lily-asiatic | white | 다정함 | uk | 19c | Kate Greenaway, Language of Flowers (Project Gutenberg #31591) | https://www.gutenberg.org/files/31591/31591-h/31591-h.htm | book-pd | repeated | 원문 "Lily, White — Purity. Sweetness." 중 Sweetness. '순결'은 기수록이라 제외 |
| tulip-white |  | 명성 | uk | 19c | Kate Greenaway, Language of Flowers (Project Gutenberg #31591) | https://www.gutenberg.org/files/31591/31591-h/31591-h.htm | book-pd | repeated | 원문 표기 "Tulip — Fame." 색 구분 없는 총칭 항목. 일본 화훼사전에서도 서양 꽃말로 fame 확인됨 |
| tulip-white | white | 잃어버린 사랑 | japan | modern | 花言葉-由来「チューリップの花言葉」 | https://hananokotoba.com/tulip/ | wiki | varies | 같은 흰 튤립에 서양에서는 '용서를 구함·순수'가 붙음(기수록). 한 꽃에 상반된 뜻이 붙은 사례로 활용 가능 |
| tulip-white | pink | 애정·배려 | korea | modern | 꽃말 정보 — 농민신문 (2022-02-14) | https://www.nongmin.com/article/20220214351093 | newspaper | single_source | 기사에 공식 출처 표기가 없음(농민신문 자체 정보 기사). 국내 유통 현장 어휘로만 쓰는 게 안전 |
| freesia |  | 조건 없는 사랑 | netherlands | modern | Freesia — Plants & Flowers Foundation Holland | https://www.plantsandflowersfoundationholland.org/en/flowerguide/freesia/ | garden | single_source | 원문 "honour, innocence and unconditional love" 중 unconditional love |
| freesia | yellow | 열정·성공 | korea | modern | 꽃말 정보 — 농민신문 (2022-02-14) | https://www.nongmin.com/article/20220214351093 | newspaper | single_source | 졸업·입학 카피에 바로 쓰기 좋은 국내식 표현. 출처 표기 없음은 위와 동일 |
| freesia | purple | 동경 | japan | modern | 花言葉-由来「フリージア」 | https://hananokotoba.com/freesia/ | wiki | single_source | 원어 「憧れ」. 보라가 귀한 색이었던 데서 왔다는 설명이 붙음 |
| gerbera |  | 바버턴의 데이지 | south-africa | 19c | Gerbera jamesonii \| PlantZAfrica (SANBI) | https://pza.sanbi.org/gerbera-jamesonii | garden | single_source | 남아공 바버턴 지역명에서 온 통용명(Barberton daisy). 기존 '친구를 기억하려고 붙인 이름'(속명 Gerber)과 다른 층위 |
| lisianthus | blue | 텍사스의 푸른 종 | usa | 20c | Plant of the Month: Texas Bluebells — Native Plant Society of Texas | https://www.npsot.org/posts/plant-of-the-month-texas-bluebells/ | garden | repeated | 자생지 통용명 Texas bluebell. NC State Extension도 같은 통용명 기재 |
| lisianthus |  | 어떤 식물에도 뒤지지 않는 아름다움 | usa | 19c | Curtis's Botanical Magazine v.65, Tab. 3626 (1839) — Internet Archive 스캔 전문 | https://archive.org/download/mobot31753002721386/mobot31753002721386_djvu.txt | book-pd | single_source | 드러먼드가 씨앗과 함께 보낸 평("not excelled in beauty by any plant", 퍼블릭 도메인)에서 유래. 종소명 russellianum은 베드퍼드 공작 러셀가 헌정 |
| lisianthus |  | 변치 않는 사랑 | korea | modern | [김민철의 꽃과 문학] 리시안셔스와 라넌큘러스 (한국교육신문) | https://www.hangyo.com/news/article.html?no=104614 | newspaper | repeated | 절화 수명이 길어 웨딩 부케에 많이 쓰인다는 맥락과 함께 |
| babys-breath |  | 간절한 기쁨 | korea | modern | 간절한 기쁨을 전하는 꽃, '안개초' (농촌여성신문) — 국립원예특작과학원 '오늘의 꽃'(11월 16일) 인용 | https://www.rwn.co.kr/news/articleView.html?idxno=74972 | newspaper | repeated | NIHHS 출처는 꽃말 단어만 사용. 기존 '맑은 마음'과 별개 항목 |
| babys-breath | white | 아기의 숨결 | usa | modern | 간절한 기쁨을 전하는 꽃, '안개초' (농촌여성신문) | https://www.rwn.co.kr/news/articleView.html?idxno=74972 | newspaper | repeated | 영문 통용명 Baby's breath의 뜻. 한국명 '안개꽃' 유래설과는 무관하게 표기 |
| babys-breath |  | 시베리아에서 온 서늘한 꽃 | korea | modern | 안개초 재배 — 농사로(농촌진흥청) | https://www.nongsaro.go.kr/portal/ps/psb/psbl/workScheduleDtl.ps?menuId=PS00087&cntntsNo=30685&sKidofcomdtySeCode=FL | garden | single_source | 30℃ 이상 고온 장해·저온성 화훼라는 생리 근거에서 나온 성격 표현 |
| hydrangea | white | 관용 | japan | modern | 「紫陽花」の花言葉は？ 花の色別の意味や由来 (Domani, 小学館) | https://domani.shogakukan.co.jp/651207 | magazine | varies | 어떤 색에도 물들지 않는 흰빛에서 왔다는 설명. 기존 수집분(변덕·진심·화목·허풍)과 중복 없음 |
| hydrangea | blue | 인내심 있는 사랑 | japan | modern | 「紫陽花」の花言葉は？ 花の色別の意味や由来 (Domani, 小学館) | https://domani.shogakukan.co.jp/651207 | magazine | varies | 비 오는 날에도 꼿꼿이 피는 모습에서 왔다는 설명. 같은 색의 '냉담·무정'은 기존 '허풍과 차가운 마음'과 겹쳐 제외 |
| hydrangea | green | 한결같은 사랑 | japan | modern | 「紫陽花」の花言葉は？ 花の色別の意味や由来 (Domani, 小学館) | https://domani.shogakukan.co.jp/651207 | magazine | single_source | 초록빛 품종('아나벨' 계열)에 붙는 꽃말 |
| ranunculus |  | 비난 | korea | modern | [오늘의 꽃] '라넌큘러스', 꽃말은 '비난, 화사한 매력' (가평문화관광신문) | http://www.gctnews.kr/1328 | newspaper | varies | 국립원예특작과학원 '오늘의 꽃' 4월 3일자 인용. 같이 실린 '화사한 매력'은 기존 수집분과 겹쳐 제외하고 '비난'만 채택 |

---

## 4. 한국 소비 장면 연결

`culture_region` 에 `korea` 가 들어간 이야기가 **29편 / 55편 (53%)** 입니다.

| story_id | 꽃 | 연결되는 소비 장면 |
|---|---|---|
| `story-rose-thornless-korea` | 장미 | 프러포즈·기념일 — 꽃집이 가시를 훑어내는 그 장면 |
| `story-carnation-korea-1956-mothers-day` | 카네이션 | 어버이날(5/8) — 관습 자체의 성립사 |
| `story-carnation-korea-teachers-day-gap` | 카네이션 | 스승의 날(5/15) — 성립·폐지·부활 |
| `story-carnation-korea-paper-flower` | 카네이션 | 스승의 날(5/15) — 지금 교실에서 실제로 벌어지는 일 |
| `story-chrysanthemum-korea-white-funeral` | 국화 | 조문 — 영정 앞 흰 국화의 유래 |
| `story-chrysanthemum-korea-night-lighting` | 국화 | 조문·명절 — 필요한 날에 늘 국화가 있는 이유 |
| `story-chrysanthemum-korea-baekma-export` | 국화 | 조문 — 장례식장에 놓이는 국산 품종 |
| `story-freesia-scent-measured-korea` | 프리지아 | 졸업식 — 졸업식장까지 향이 남는 이유 |
| `story-freesia-korea-cultivar-share` | 프리지아 | 졸업식·입학 — 졸업 사진 속 노란 다발의 국적 |
| `story-freesia-jeonbuk-heartland` | 프리지아 | 졸업식 — 그날 새벽 그 꽃이 있던 자리 |
| `story-freesia-beyond-yellow` | 프리지아 | 졸업식 — 노랑 아닌 프리지아를 찾는 변화 |
| `story-lily-baekhap-was-a-root` | 백합 | 어버이날·병문안 — 옛 우리 문헌 속 백합 |
| `story-lily-nari-basin-ulleung` | 백합 | 상시 — 울릉도 마을 이름이 된 백합 뿌리 |
| `story-lily-asiatic-korean-ancestors` | 백합 | 상시 — 수입 꽃 같지만 조상이 우리 산나리 |
| `story-gerbera-korea-cultivar` | 거베라 | 졸업식·개업 화환 — 국산 품종 보급률 18% |
| `story-gerbera-korea-wreath` | 거베라 | 개업·승진 축하 화환 — 절화 거래량 4위 |
| `story-lisianthus-rosette` | 리시안셔스 | 여름 프러포즈·웨딩 부케 — 여름 리시안셔스가 귀한 이유 |
| `story-babysbreath-korea-graduation-price` | 안개꽃 | 졸업식·입학식 — 꽃다발 값을 좌우하게 된 꽃 |
| `story-babysbreath-cold-lover` | 안개꽃 | 여름 결혼식·드라이플라워 |
| `story-hydrangea-korea-native-clades` | 수국 | 상시 — 우리 산에도 수국 식구가 산다 |
| `story-krmarket-yangjae-midnight-auction` | 장미 | 새벽 경매장 → 아침 꽃집 — 꽃값이 날마다 다른 이유 |
| `story-krmarket-namdaemun-1960` | 프리지아 | 2월 남대문 대도상가 3층 — 첫 봄꽃을 사러 가는 자리 |
| `story-krbouquet-babysbreath-half` | 안개꽃 | 졸업식·입학식 — 그 다발의 절반은 안개꽃이었다 |
| `story-krwreath-three-tier` | 거베라 | 결혼식·개업식 3단 화환 |
| `story-krlily-export-boom` | 백합 | 국산 꽃 응원 — 1990년대 새벽 백합 출하 |
| `story-krhydrangea-domestic-cultivars` | 수국 | 5월 서울식물원 — 우리말 이름표를 단 수국 |
| `story-krjeju-jongdal-hydrangea-road` | 수국 | 6월 제주 수국길 — 여행·계절 콘텐츠 |
| `story-krjoseon-potted-flowers` | 국화 | 화분 선물 — 옛사람도 그랬다 |
| `story-krcutflower-wet-transport` | 장미 | 꽃이 시드는 순간 — 습식 유통과 케어 안내 |

---
## 5. 3차 조사에서 통합·정정한 것

이번 라운드는 담당 꽃을 나눠 네 갈래로 동시에 파고들었습니다. 그 결과 **서로 다른 갈래가 같은 자료에 도달한 경우**가 나왔습니다. 아래 4건은 검토 단계에서 통합·삭제한 것으로, **이 문서의 표에는 이미 반영되어 있습니다.** 기록으로만 남깁니다.

| 통합·삭제한 항목 | 무슨 일이 있었나 | 처리 |
|---|---|---|
| `story-lily-white-chrysanthemum-myth` (백합) · `story-krfuneral-white-chrysanthemum` (국화) | **세 갈래가 각자 같은 한국일보 기사(김시덕 교수)에 도달**해 "영정 앞 흰 국화는 전통이 아니다"라는 같은 이야기를 세 번 써 왔습니다 | `story-chrysanthemum-korea-white-funeral` **한 편만 채택**하고 둘을 삭제. 채택본이 조선 상례 → 메이지 일본 → 식민지 조선으로 이어지는 유입 경로를 가장 온전히 담고 있었습니다. 삭제한 두 편에만 있던 사실(상복의 흰빛은 표백하지 않은 **소색** 삼베였다 · 2024년 국화 수입 **1억 8천만 본**)은 채택본의 `editorial_note` 로 옮겨 살리기를 권합니다 |
| `story-krcarnation-parents-day-1956` (카네이션) | 두 갈래가 "1956년 어머니날 → 1973년 어버이날"이라는 같은 소재를 각각 국가기록원·한국민족문화대백과사전으로 가져왔습니다 | `story-carnation-korea-1956-mothers-day` **한 편만 채택**. 삭제한 쪽은 안나 자비스(1907·1914) 대목을 함께 담고 있었는데, 이는 **기존 `content/stories.csv` 의 "어머니날을 만들고 없애려 한 사람"과 중복**이라 채택하지 않는 것이 맞습니다 |
| 꽃말 `carnation / 사랑과 존경` · `carnation / 세상을 떠난 어머니를 기리는 마음` | 각각 기존 `meanings.csv` 의 "깊은 사랑과 감탄(red)" · "어머니를 기억하는 흰 꽃"과 사실상 같은 뜻 | **삭제** |
| 꽃말 `gerbera / 신비, 풀 수 없는 수수께끼` | 기존 `meanings.csv` 에 **이미 있는 행**(NIHHS 출처)을 다른 경로로 재수집한 것 | **삭제** |
| 꽃말 `gerbera / 축하의 자리에 놓이는 꽃` | 꽃말이 아니라 **한국에서의 관용적 쓰임**(화환 주력·거래량 4위)에 근거한 서술이었습니다 | **삭제.** 같은 사실은 이야기 `story-gerbera-korea-wreath` 로 이미 실려 있어 손실이 없습니다 |

### 5-1. 동시 노출을 피하는 게 좋은 쌍

| 쌍 | 이유 |
|---|---|
| `story-babysbreath-korea-graduation-price` ↔ `story-krbouquet-babysbreath-half` | 둘 다 졸업식 꽃다발 속 안개꽃 이야기입니다. 하나는 **값**, 하나는 **역할**이라 소재는 다르지만 한 화면에 같이 놓이면 반복으로 읽힙니다 |
| `story-chrysanthemum-korea-white-funeral` ↔ `story-chrysanthemum-korea-baekma-export` | 둘 다 조문 맥락입니다. 앞은 "이 관습은 최근의 것", 뒤는 "국산 품종이 일본에 나간다"로 정서가 다릅니다 |
| `story-freesia-korea-cultivar-share` ↔ `story-freesia-beyond-yellow` | 둘 다 전북·국산 품종 육성 이야기라 이어 붙이면 같은 이야기의 앞뒤로 보입니다 |

---

## 6. 열람 실패로 인용하지 않은 URL

총 **70건**입니다. 이 URL들은 본문 근거로 **한 건도 쓰지 않았습니다.** 상업 사이트·유료 저널·미국 의회도서관 계열이 봇 차단으로 막힌 경우가 대부분입니다.

**다음 라운드를 위한 교훈 세 가지**

- **BHL(biodiversitylibrary.org)은 WebFetch 전면 차단**입니다. 대신 `archive.org` 의 `mobot*` 식별자로 우회하면 같은 스캔본 전문을 얻을 수 있습니다. 이번에 커티스 『보태니컬 매거진』 3626번 도판을 이 방법으로 확보했습니다(§7 참조).
- **Chronicling America / loc.gov 는 모든 경로가 403**입니다(네 갈래가 각각 시도해 전부 실패). 미국 PD 신문 아카이브 축은 이번 라운드에서 통째로 포기했고, 신문 소스는 국내 매체로 채웠습니다. Trove(호주)는 아직 미시도라 다음 라운드 여지가 있습니다.
- **농사로(nongsaro)는 URL 형식을 탑니다.** `kidofcomdtyDtl.mo?...` 는 빈 응답이지만 `workScheduleDtl.ps?menuId=PS00087&cntntsNo=...` 형식은 정상 열립니다.
- **PMC 는 신 도메인(`pmc.ncbi.nlm.nih.gov`)으로 요청**해야 합니다. 구 도메인(`www.ncbi.nlm.nih.gov/pmc/...`)은 301 이 걸립니다. Springer·Wiley 유료 논문도 PMC 미러가 있으면 우회됩니다.

| 담당 | URL | 결과 | 처리 |
|---|---|---|---|
| A(장미·카네이션·국화) | https://pacifichorticulture.org/articles/why-plant-names-change-2/ | 403 | 국화 속명(Chrysanthemum↔Dendranthema) 논쟁 이야기 자체를 제외 |
| A(장미·카네이션·국화) | https://www.metmuseum.org/essays/botanical-imagery-in-european-painting | 429 → DNS 타임아웃(총 3회 시도) | Getty 재게시본(brewminate)으로 카네이션 상징만 대체 |
| A(장미·카네이션·국화) | https://blog.metmuseum.org/cloistersgardens/2013/09/06/the-pink-reincarnate/ | 타임아웃 / 본문 빈 응답 | 대체 실패 → '약혼의 꽃 카네이션' 이야기 보류 |
| A(장미·카네이션·국화) | https://www.metmuseum.org/art/collection/search/437402 (Rembrandt, Woman with a Pink) | DNS 타임아웃 | 동일, 보류 |
| A(장미·카네이션·국화) | http://web.archive.org/web/2023/…/the-pink-reincarnate/ | 도구가 web.archive.org 접근 차단 | — |
| A(장미·카네이션·국화) | https://www.nationalgallery.org.uk/paintings/andrea-solario-a-man-with-a-pink | 403 | — |
| A(장미·카네이션·국화) | https://www.nationalgallery.org.uk/paintings/raphael-the-madonna-of-the-pinks-la-madonna-dei-garofani | 403 | — |
| A(장미·카네이션·국화) | https://art.nelson-atkins.org/objects/8000/betrothal-portrait-of-a-woman | ECONNREFUSED (2회) | — |
| A(장미·카네이션·국화) | https://gardens.si.edu/exhibitions/current-exhibitions/floral-fashions-from-bouquets-to-buttonholes/ | 403 | 빅토리아 꽃말은 Greenaway PD 원전으로 대체 |
| A(장미·카네이션·국화) | https://www.kew.org/read-and-watch/chinese-zodiac-flowers | 403 | 국화 사군자 소재 자체가 기존 중복이라 폐기 |
| A(장미·카네이션·국화) | https://www.loc.gov/item/agr11001302/ | 403 | Internet Archive의 동일 서지 전문(djvu.txt)으로 대체 → 성공 |
| A(장미·카네이션·국화) | https://chroniclingamerica.loc.gov/search/pages/results/?andtext=… | 308 리다이렉트 → loc.gov에서 403 | Chronicling America 신문 원문 인용 포기, PD 고서(1891)로 대체 |
| A(장미·카네이션·국화) | https://www.getty.edu/news/7-favorite-flowers-from-renaissance-manuscripts-and-their-christian-symbolism/ | HTTP 200이나 본문 truncated(2회, 실질 미열람) | Getty Iris 원문의 CC BY 4.0 재게시본(brewminate)으로 대체 |
| A(장미·카네이션·국화) | http://www.ijfs.org/journal/article.php?code=89226 | SSL 인증서 호스트 불일치 | 한국 절화 유통 논문 사용 포기 |
| A(장미·카네이션·국화) | https://folkency.nfm.go.kr/kr/topic/detail/350 (의례준칙) | 200이나 JS 렌더링으로 본문 없음 | 한국일보(김시덕) 칼럼으로 대체 |
| A(장미·카네이션·국화) | https://agri.jeju.go.kr/files/board/화훼류(국화)_1.pdf | PDF 6.2MB, 스캔 이미지라 텍스트 추출 실패 | 충청북도 농업기술원 국화 페이지로 대체 → 성공 |
| A(장미·카네이션·국화) | https://agro.seoul.go.kr/archives/387 | 302 → seoul.go.kr errorAccess | 동일, 충북 농업기술원으로 대체 |
| A(장미·카네이션·국화) | http://www.theoldfoodie.com/2014/05/the-rose-hip-collection-campaign-ww-ii.html | Socket closed | Woodland Trust 로즈힙 글로 대체 → 성공 |
| A(장미·카네이션·국화) | https://www.nihhs.go.kr/usr/persnal/Flower_library.do (꽃말사전) | 페이지는 열리나 검색 파라미터가 먹지 않아 12월 목록만 반환. 장미·카네이션·국화 항목 도달 실패 | NIHHS 꽃말 신규 수집 포기(기존 수집분 유지). 다음 라운드에 날짜 기반 URL로 재시도 필요 |
| B(튤립·프리지아·백합) | http://ijfs.org/journal/article.php?code=56183 | SSL 인증서 호스트 불일치 (dothome.co.kr 인증서) | Flower Research Journal(화훼연구) 논문은 PMC 경유로 대체. 프리지아 향기 논문은 PMC7698779 로 확보 |
| B(튤립·프리지아·백합) | https://www.kew.org/read-and-watch/tulips-history | 403 Forbidden | Kew 전면 차단. 식물원 소스는 SANBI PlantZAfrica 로 대체 |
| B(튤립·프리지아·백합) | https://chroniclingamerica.loc.gov/search/pages/results/?andtext=freesia | 308 → 리다이렉트 후 403 | LOC 계열 전부 봇 차단. 신문 아카이브 축은 국내 신문(투데이코리아·국제뉴스·한국일보)으로 대체 |
| B(튤립·프리지아·백합) | https://www.loc.gov/chroniclingamerica/search/pages/results/?andtext=freesia | 403 Forbidden | 동일 |
| B(튤립·프리지아·백합) | https://www.loc.gov/collections/chronicling-america/?q=freesia&fo=json | 403 Forbidden | 동일. Trove(호주)도 유사 위험이라 미시도 |
| B(튤립·프리지아·백합) | https://ingeniumcanada.org/channel/innovation/isabella-preston-queen-ornamental-horticulture | 403 Forbidden | Isabella Preston 은 University of Guelph OAC 페이지로 대체 확보 |
| B(튤립·프리지아·백합) | https://www.thecanadianencyclopedia.ca/en/article/isabella-preston | 403 Forbidden | 동일 |
| B(튤립·프리지아·백합) | https://www.atlasobscura.com/articles/creelman-lily-isabella-preston-mystery | 403 Forbidden | 동일. Atlas Obscura 전체가 차단으로 보임 |
| B(튤립·프리지아·백합) | https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderDetails.aspx?taxonid=244741 | 301 → plantfinder.mobot.org 인증서 체인 검증 실패 | Lilium 'Enchantment' 소재 자체를 보류(아래 제외 항목 참조) |
| B(튤립·프리지아·백합) | https://rhslilygroup.org/hybrid-lilies/ | HTTP 425 Too Early | 아시아틱 교잡 계보는 Pacific Bulb Society Lilium 페이지로 대체 |
| B(튤립·프리지아·백합) | http://www.nongup.net/news/articleView.html?idxno=21268 | 인증서 만료 | 백합 구근 국산화 소재 보류 |
| B(튤립·프리지아·백합) | https://m.nongmin.com/321287 | 404 Not Found | 동일 |
| B(튤립·프리지아·백합) | https://korean.visitkorea.or.kr/kfes/detail/fstvlDetail.do?fstvlCntntsId=e8901e50-… | 404 Not Found | 태안 튤립축제 소재 보류 |
| B(튤립·프리지아·백합) | https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7698779/ | 301 (구 도메인) | pmc.ncbi.nlm.nih.gov 로 재요청해 정상 열람 → 인용은 신 URL 사용 |
| C(거베라·리시안셔스·안개꽃) | https://www.biodiversitylibrary.org/page/432985 | 403 Forbidden | **우회 성공.** Internet Archive 스캔본 `mobot31753002721386` 전문 텍스트(`/download/.../_djvu.txt`)로 3626번 도판 원문 확보 |
| C(거베라·리시안셔스·안개꽃) | https://www.biodiversitylibrary.org/pageocr/432985 | 403 Forbidden | 위와 동일. BHL은 WebFetch 전면 차단으로 보임 → 항상 archive.org `mobot*` 식별자로 우회할 것 |
| C(거베라·리시안셔스·안개꽃) | https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:208893-1 | 403 Forbidden | SANBI PlantZAfrica로 대체(Adlam 저자 문제 확인) |
| C(거베라·리시안셔스·안개꽃) | https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:190289-1 | 403 Forbidden | 상동. Kew POWO는 WebFetch 차단 |
| C(거베라·리시안셔스·안개꽃) | https://www.wildflower.org/plants/result.php?id_plant=euexr | 403 Forbidden | Native Plant Society of Texas 페이지로 대체 |
| C(거베라·리시안셔스·안개꽃) | https://www.wildflower.org/magazine/feature/big-in-japan | 403 Forbidden | magazine 소스 후보였으나 확보 실패. ISAAA Crop Biotech Update로 대체 |
| C(거베라·리시안셔스·안개꽃) | https://chroniclingamerica.loc.gov/search/pages/results/?...&format=json | 308 → loc.gov | 리다이렉트 후 403 |
| C(거베라·리시안셔스·안개꽃) | https://www.loc.gov/chroniclingamerica/search/pages/results/?...&format=json | 403 Forbidden | **미국 신문 아카이브 확보 실패.** 신문 소스는 한국 매체(서울신문·농촌여성신문)로 대체. Trove 미시도 |
| C(거베라·리시안셔스·안개꽃) | https://www.mdpi.com/2311-7524/8/10/921 | 403 Forbidden | 안개꽃 InDel 마커(품종 식별) 이야기 포기 |
| C(거베라·리시안셔스·안개꽃) | https://www.krei.re.kr/attach/pdf/C2019_72.pdf | 404 Not Found | 「한국의 미래 화훼 소비 및 생산 예측」 본문 확보 실패 |
| C(거베라·리시안셔스·안개꽃) | https://www.nihhs.go.kr/farmer/statistics/statistics.do?t_cd=0303 | 200이나 본문 미노출(내비게이션만) | 국립원예특작과학원 품종육성 목록 원표 확보 실패. KISTI 연구보고서로 대체 |
| C(거베라·리시안셔스·안개꽃) | https://www.rda.go.kr/middlePopOpenPopViewApi.do?no=1005&... | 200이나 본문 미노출 | 「로열티 대응 원예특용작물 품종개발 현황」 확보 실패 |
| C(거베라·리시안셔스·안개꽃) | http://jresearchbiology.com/documents/RA0421.pdf | PDF 바이너리 파싱 실패 | 터키 Gypsophila 사포닌·할바 이야기 포기 |
| C(거베라·리시안셔스·안개꽃) | https://bmcgenomics.biomedcentral.com/... → link.springer.com → idp.springer.com | 301 → 303 인증 리다이렉트 | PMC 미러(PMC6647082)로 우회 성공 |
| C(거베라·리시안셔스·안개꽃) | https://doi.org/10.3390/horticulturae8100921 | 302 → mdpi.com 403 | 상동 |
| C(거베라·리시안셔스·안개꽃) | https://www.missouribotanicalgarden.org/PlantFinder/...taxonid=277229 | 301 → plantfinder.mobot.org 인증서 오류 | Missouri Botanical Garden 확보 실패 |
| C(거베라·리시안셔스·안개꽃) | nongsaro `kidofcomdtyDtl.mo?...` 형식 2건 | 200이나 빈 응답 | **우회 성공.** `workScheduleDtl.ps?menuId=PS00087&cntntsNo=...` 형식은 정상 열람됨 |
| C(거베라·리시안셔스·안개꽃) | https://archive.org/advancedsearch.php (date 범위 질의) | numFound 0 | `volume:"v.65"` 필드 질의로 바꿔 식별자 확보 성공 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://www.krei.re.kr/attach/pdf/605ba745-a58a-2a94-e054-b09928988b3c.pdf | PDF 바이너리 미해독 | aT 공식 연혁 페이지 + 서울신문 르포로 대체 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://www.krei.re.kr/attach/pdf/C2019_72.pdf | HTTP 404 | 농촌진흥청 웹진(rda.go.kr)으로 대체 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://www.krei.re.kr/attach/pdf/60eab6e3-d7da-4cab-b65b-a36c7355b8d8.pdf | PDF 바이너리 미해독 | KCI 논문(절화 장미 소비자 여정)으로 대체 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://repository.krei.re.kr/bitstream/2018.oak/21920/1/PRN142.pdf | PDF 바이너리 미해독 | 대체 못 찾음 → 청탁금지법 관련 수치 전면 미사용 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://onlinelibrary.wiley.com/doi/full/10.1046/j.1365-3040.1998.00336.x | HTTP 402 | 위키백과 Ranunculus adoneus 로 우회 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://bsapubs.onlinelibrary.wiley.com/doi/10.3732/ajb.90.5.724 | HTTP 402 | 동일 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://pubmed.ncbi.nlm.nih.gov/28312176/ | 쿠키 요구, 본문 미노출 | 동일 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://link.springer.com/article/10.1007/BF00378737 | 로그인 리다이렉트(303) | 동일 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://ui.adsabs.harvard.edu/abs/2006Oecol.148..195G/abstract | 본문 비어 있음 | 동일 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://www.semanticscholar.org/paper/3cf29f0fb79ccc154c2e62ecdde436e9328cf029 | 본문 비어 있음 | 동일 |
| D(수국·라넌큘러스·한국 꽃 문화) | http://www.beanstreesandshrubs.org/browse/hydrangea/hydrangea-macrophylla-thunb-ser/ | 인증서 만료 | 네덜란드 화훼재단 페이지로 대체 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://plantfinder.mobot.org/PlantFinderDetails.aspx?kempercode=h930 | 인증서 검증 실패 | 안개꽃 꽃말 행 자체를 포기 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://www.missouribotanicalgarden.org/PlantFinder/... | 리다이렉트 후 인증서 실패 | 동일 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://www.sciencedirect.com/topics/agricultural-and-biological-sciences/ranunculus-adoneus | HTTP 403 | 위키백과로 우회 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://wordsworth.org.uk/blog/2017/03/03/a-month-in-grasmere-with-wordsworths-flowers/ | HTTP 401 | 위키문헌 1815년 시집 원문으로 대체 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://ncms.nculture.org/market/story/7915 | 내비게이션만 반환, 본문 미노출 | 서울시 '내 손안에 서울'로 대체 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://www.asahi-net.or.jp/~sg2h-ymst/yamatouta/saijiki/ajisai.html | 본문에 원문·가번호 없음 | 일본어 위키문헌 『만엽집』 제20권 원문으로 대체 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://www.nihhs.go.kr/usr/persnal/Flower_library.do (수국·안개꽃 검색) | 날짜 페이지네이션만 지원, 해당 항목 도달 실패 | 라넌큘러스만 인용 기사 경유로 확보, 나머지는 포기 |
| D(수국·라넌큘러스·한국 꽃 문화) | https://www.nl.go.kr/newspaper/ (졸업식 꽃다발 검색) | JS 기반 검색으로 직접 질의 불가 | 국가기록원·서울신문 칼럼으로 우회 |

---

## 7. 이전 라운드의 미해결 과제를 해소한 것

| 과제 | 어느 문서에 남아 있었나 | 이번 결과 |
|---|---|---|
| 리시안셔스 **'루셀리아눔'이 베드퍼드 공작 헌정** — 커티스 『보태니컬 매거진』 3626번 도판 | `story-research-2.md` §6 "확인 가능한 페이지가 전부 403" · §6-1 후속 1순위 | **해소.** BHL은 여전히 403이었지만 `archive.org` 의 `mobot31753002721386` 전문 텍스트로 우회해 **1839년 원문을 확보**했습니다. 드러먼드가 1835년 텍사스에서 씨앗을 부치며 남긴 평, 그해 아바나에서의 죽음, 1837년 8월 보스웰 캐슬 온실에서의 첫 개화, 종소명이 후원자 러셀가 헌정이라는 사실이 모두 원문에 있습니다 → `story-lisianthus-drummond-bedford` |
| 라넌큘러스 **18~19세기 영국 플로리스트 협회 경연 꽃** | `story-research-2.md` §6 "위키 `Florists' flower` 404" · §6-1 후속 항목 6 (라넌큘러스가 2편에 그친 직접 원인) | **해소.** Netherhall Manor 의 원예사 글로 확보했습니다. "튤립 한 품종이 이름을 얻을 때 라넌큘러스는 열 품종이 이름을 얻었다"는 어림값과, 페이즐리 직조공들이 베틀 옆에서 꽃을 기르던 정황까지 나왔습니다 → `story-ranunculus-weaver-florists` |
| 안개꽃이 `flowers.csv` 에 없어 한 편도 못 실었던 문제 | `story-research-2.md` §6-1 후속 항목 1 | **해소.** 안개꽃은 그 뒤 카탈로그에 올랐고, 이번에 이야기 5편·꽃말 3행을 채웠습니다 |
| 한국 절화 유통·소비자 여정 논문 | 이번 라운드에서 A 갈래가 `ijfs.org` SSL 오류로 실패 | **다른 갈래가 해소.** KCI 경유로 2024년 논문 본문을 확보했습니다 → `story-krcutflower-wet-transport` |

---

## 8. 수집했으나 제외한 것

총 **40건**. 다음 라운드의 출발점이 되도록 사유를 그대로 남깁니다.

| 담당 | 후보 | 제외 사유 |
|---|---|---|
| A(장미·카네이션·국화) | 국화 속명 논쟁 (1999 세인트루이스 식물학회에서 Dendranthema → Chrysanthemum 복원) | 소재는 좋으나 1차 출처(Pacific Horticulture) 403, NYBG 페이지에는 해당 서술 없음. 검색 스니펫만으로는 인용 불가 |
| A(장미·카네이션·국화) | 카네이션 = 약혼의 꽃 (르네상스 초상화, 신부가 카네이션을 숨기는 풍습) | 박물관 페이지 5곳이 전부 403·타임아웃·빈 응답. 다음 라운드에 재시도 권장(가치 높음) |
| A(장미·카네이션·국화) | 일본 어머니날과 1937년 모리나가 어머니날 대회 | 확인 가능한 출처가 기업 자체 연혁 페이지뿐. source_kind 분류가 안 되고 기업 홍보사 인용 위험 |
| A(장미·카네이션·국화) | 성년의 날 장미·향수·키스 | 전자신문 기사를 열람했으나 장미 송이 수, 풍습 정착 시기 근거가 없고, 제시된 꽃말("열정·사랑")이 기존 수집분과 중복 |
| A(장미·카네이션·국화) | carnation 어원 (coronation 說 vs carnis 說) | 기존 "신의 꽃이라는 이름(dianthus 어원)" 이야기와 소재가 겹침 |
| A(장미·카네이션·국화) | Anna Jarvis가 교회에 보낸 흰 카네이션 500송이 | 이미 사용된 이야기(어머니날을 만들고 없애려 한 사람) |
| A(장미·카네이션·국화) | Ohio 주화(州花) 스칼릿 카네이션 / 매킨리 | 이전 라운드에서 이미 "맥락 멀다"로 제외된 항목 |
| A(장미·카네이션·국화) | 국화 = pyrethrum(제충국) 살충제 | 이전 라운드 제외 유지(종이 다름) |
| A(장미·카네이션·국화) | 한국 절화 유통 소비자 여정 논문 (Flower Research Journal) | 저널 사이트 SSL 오류로 미열람 |
| A(장미·카네이션·국화) | 프랑스 만성절 국화 판매량 통계 | 열람한 기사에 "매년 수백만 송이" 수준의 서술만 있고 수치 없음. 숫자 인용 포기 |
| B(튤립·프리지아·백합) | Lilium 'Enchantment' / Jan de Graaff, Oregon Bulb Farms (1947) | ① Missouri Botanical Garden·RHS 원문 열람 전부 실패해 1차 확인 불가 ② 기수록 "Stargazer 우드리프" 이야기와 오리건 벌브 팜스라는 무대가 겹쳐 중복 위험 |
| B(튤립·프리지아·백합) | Isabella Preston의 'Stenographer 시리즈'(비서들 이름을 붙인 백합) | 가장 매력적인 대목이지만 이 사실을 담은 페이지(Ingenium·Canadian Encyclopedia·Atlas Obscura)가 전부 403. 열람에 성공한 Guelph 페이지에는 없어 리텔링에서 통째로 뺌 |
| B(튤립·프리지아·백합) | 태안 세계튤립꽃박람회 ('세계 5대 튤립축제') | 열람 성공한 두 페이지(오마이뉴스·대한민국 구석구석) 어디에도 첫 회 연도·회차·구근 수량·'세계 5대' 선정 주체가 없음. 축제 자체가 folklore/history/literary 중 어디에도 잘 맞지 않는 점도 고려 |
| B(튤립·프리지아·백합) | 백합 구근 국산화율 9%·네덜란드산 90% 점유 | 소재로는 훌륭하나 원문(농민신문·농업정보신문) 열람 실패로 인용 불가. 다음 라운드 재시도 권장 |
| B(튤립·프리지아·백합) | 프리지아 알뿌리 탄수화물 대사·안토시아닌 MYB 조절 논문(PMC 다수) | 오픈액세스로 열람은 가능하나 서사가 서지 않음. story_type(folklore/history/literary) 어느 쪽으로도 무리 |
| B(튤립·프리지아·백합) | 농사로 튤립·프리지아 재배 페이지 | 재배 매뉴얼이라 이야기 소재 없음. 다만 "프리지아 주산지 경기·전북·충남" 사실은 참고용으로 확인해 둠 |
| B(튤립·프리지아·백합) | 튤립 이름 = 터번 오해설을 단정하는 서술 | 열람한 논문이 "16세기 문헌에서 확인되지 않는다"고 명시. 단정 대신 '흐릿하다'로 프레이밍해 story 4에 반영 |
| B(튤립·프리지아·백합) | Chronicling America / Trove 신문 아카이브 축 | LOC 전 경로 403. 이번 라운드 신문 소스는 국내 매체로 전량 대체 |
| B(튤립·프리지아·백합) | 프리지아 "당신의 시작을 응원합니다"(농민신문) | 기수록 꽃말 "새로운 시작과 변함없는 우정"과 사실상 동어반복이라 꽃말 표에서 제외 |
| C(거베라·리시안셔스·안개꽃) | 안개꽃 뿌리 사포닌 → 터키 할바·비누·소화기 원료 | 소재는 훌륭하나 **원문 열람 실패**. ScienceDirect/Wiley는 초록 유료, jresearchbiology PDF는 파싱 실패, MDPI 아프리카 사포닌 리뷰(PMC8143558)는 열었으나 **Gypsophila를 전혀 언급하지 않음**을 확인. 검색 스니펫만으로는 인용 불가 → 다음 라운드 1순위 재도전 후보 |
| C(거베라·리시안셔스·안개꽃) | 안개꽃 미시간 사구 침입종 자원봉사 제거(Sleeping Bear Dunes, 1주당 씨앗 1만 4천 개) | 기존 "북미에서는 뽑아내는 꽃(침입종)"과 **소재 중복** |
| C(거베라·리시안셔스·안개꽃) | 안개꽃 InDel 마커로 품종 구별(MDPI Horticulturae 8:921) | MDPI 403으로 원문 미열람 |
| C(거베라·리시안셔스·안개꽃) | 파란 거베라가 없는 이유(F3′5′H 결여로 델피니딘 미합성) | 근거가 상업 블로그·판매 사이트 위주. 학술 원문 미확보. 기존 "파란 거베라는 전부 염색" 제외 판정과 같은 계열 |
| C(거베라·리시안셔스·안개꽃) | 리시안셔스 1933년 일본 상업 종자 유통 시작(ISHS Acta Hort. 482_61 초록) | 초록은 열었으나 기존 "들꽃을 다듬은 반세기(일본 육종)"와 **소재 중복**. 이전 라운드 '1930년대 나가노 육종설' 제외 판정과도 겹침 |
| C(거베라·리시안셔스·안개꽃) | 리시안셔스 한 송이가 3주간 아름다움 유지(커티스 1839) | 5번 이야기 안에 문장으로 흡수. 별도 편으로 분리하면 소스가 중복됨 |
| C(거베라·리시안셔스·안개꽃) | 안개꽃 빅토리아 시대 꽃말 '영원한 사랑·정절' | 꽃집 블로그·상업 사이트만 근거. 퍼블릭 도메인 화훼사전 원문 미확보 |
| C(거베라·리시안셔스·안개꽃) | 텍사스 블루벨 씨앗 꼬투리당 1,200개 | 검색 스니펫에만 등장, NPSOT 본문에서 확인되지 않음 |
| C(거베라·리시안셔스·안개꽃) | 토머스 드러먼드 생애(750종 채집, 콜레라·홍수, 아바나 사망) — Handbook of Texas | 본문 열람 완료했으나 5번 이야기와 **주제 중복**이라 별도 편으로 쓰지 않고 교차검증 근거로만 사용 |
| C(거베라·리시안셔스·안개꽃) | aT화훼공판장 절화 경매 물량 감소(1,915만 단 → 1,721만 단) | 본문 열람 완료(한국농어민신문)했으나 **거베라·리시안셔스·안개꽃 언급이 전혀 없음**을 확인. 세 꽃에 귀속시킬 수 없어 제외 |
| D(수국·라넌큘러스·한국 꽃 문화) | 나무수국 꽃말 '냉정·무정·거만' (서울숲, 열람 성공) | 기존 수집분 '허풍과 차가운 마음(빅토리아)'과 의미가 사실상 중복 |
| D(수국·라넌큘러스·한국 꽃 문화) | 워즈워스 기념 명판에 큰애기똥풀(Chelidonium majus)을 잘못 새겼다는 일화 | 검색 스니펫에만 있고 1차 출처(그래스미어 세인트오스왈드 교회·워즈워스 그래스미어) 열람 실패(401) |
| D(수국·라넌큘러스·한국 꽃 문화) | 『만엽집』 오토모노 야카모치의 아지사이 노래(권4, 773) | 위키문헌 제20권만 열람 확인, 제4권 원문 미확인 → 이야기를 4448번 한 수로만 구성 |
| D(수국·라넌큘러스·한국 꽃 문화) | 라넌큘러스 오스만 궁정 '터번 꽃', 터키어 '결혼식 꽃(düğün çiçeği)' | 화훼 판매·블로그 계열만 확인, 학술·기관 출처 없음 |
| D(수국·라넌큘러스·한국 꽃 문화) | 라넌큘러스 18세기 800품종 → 1820년 400품종 감소 | 출처가 화훼 판매 사이트뿐. 대신 Netherhall Manor의 '튤립 1 대 라넌큘러스 10' 어림값을 채택 |
| D(수국·라넌큘러스·한국 꽃 문화) | 수국 로열티 연 10억 원, 전남이 국내 수국 재배면적의 40% | 검색 스니펫만 확보, 원문(농수축산신문) 미열람 → 서울신문 기사 범위로만 서술 |
| D(수국·라넌큘러스·한국 꽃 문화) | 청탁금지법 시행 후 화훼 소매거래액 26.5% 감소(2016.10~11) | KREI PDF 4건 모두 열람 실패 |
| D(수국·라넌큘러스·한국 꽃 문화) | 남대문 꽃시장 영업시간 03:00~15:00 (서울시 정보소통광장) | '내 손안에 서울'의 05:30~17:00 과 불일치 → 후자만 사용, 이야기 본문에서는 '새벽 다섯 시 반'만 명시 |
| D(수국·라넌큘러스·한국 꽃 문화) | 국가기록원 '졸업식' 기록 (학기제 1950년 4월→1961년 3월 변경, 졸업식이 2월로 정착) | 열람은 성공했으나 본문에 꽃·꽃다발 언급이 전혀 없어 꽃 이야기로 붙이기 부적절. 배경 지식으로만 보관 |
| D(수국·라넌큘러스·한국 꽃 문화) | 수국 학명 Hydrangea 의 그리스어 어원(hydro+angeion, 1739 Gronovius) | 기존 수집분 '물을 많이 먹어서 붙은 이름이 아닙니다'와 중복 → 오르탕지아 이야기에서 배경 한 줄로만 언급 |
| D(수국·라넌큘러스·한국 꽃 문화) | 안개꽃 꽃말('맑은 마음' 등) | 기관·식물원 출처 열람 실패, 확보된 것은 블로그·꽃집 사이트뿐 |

---

## 9. 명예·정확성 프레이밍이 필요한 이야기 (적재 전 필독)

총 **32건**. 실존 인물·기업·기관·제도가 소재인 이야기는 프레이밍이 곧 리스크입니다. **아래 권고를 지우고 적재하지 마세요.**

**특히 주의할 4건**

1. `story-babysbreath-kenya-color` — 실존 기업의 **GMO 시험 "신청" 단계**까지만 서술해야 합니다. 승인·출시·시판을 암시하면 사실 오류이자 기업에 불리합니다. GMO 자체에 대한 가치판단도 금지입니다.
2. `story-babysbreath-korea-graduation-price` — 꽃값 상승이 **꽃집·농가의 폭리로 읽히면 안 됩니다.** 기사에 함께 실린 원가 요인(등유 1리터 1,150원, 전년 대비 200~300원 상승, 2주 보관 한계)을 반드시 병기하세요.
3. `story-chrysanthemum-korea-white-funeral` — **조문 상황에서 노출되는 콘텐츠**입니다. "잘못된 관행"이 아니라 "비교적 최근에 만들어진 형식"으로 쓰고, 애도하는 사람의 마음을 부정하는 톤이 되지 않게 하세요. 특정 장례업체·상조회사 지목 금지.
4. `story-carnation-korea-paper-flower` — 청탁금지법 유권해석이 소재입니다. **지침이 이후 바뀌었을 수 있으므로 서비스 노출 전 재확인이 필요합니다.**

| 담당 | 이야기 / 항목 | 위험 요소 | 권장 프레이밍 |
|---|---|---|---|
| A(장미·카네이션·국화) | story-carnation-korea-paper-flower | 국민권익위원회(실존 기관)의 유권해석을 다룸. 기사 제목에 "논란"이 들어감 | 권익위 해석 내용은 **사실만** 옮기고, 비판·항의는 "일부 교사들의 반응이 보도되었다" 식으로 귀속. 특정 공무원·개인을 지목하지 말 것. 최신 지침이 바뀌었을 수 있으므로 서비스 노출 전 재확인 필요 |
| A(장미·카네이션·국화) | story-chrysanthemum-korea-white-funeral | 일제강점기·일본 유입 서술. 국내 장례업계에 대한 비판적 함의 | 특정 장례업체·상조회사를 지목하지 말 것. 김시덕 교수의 판단은 반드시 "을지대 김시덕 교수는 ~라고 본다"로 귀속. "잘못된 관행"이 아니라 "비교적 최근에 만들어진 형식"으로 중립 서술. 조문 상황에서 노출되는 콘텐츠이므로 애도하는 사람의 마음을 부정하지 않는 톤 유지 |
| A(장미·카네이션·국화) | story-chrysanthemum-korea-baekma-export | 일본·네덜란드 품종 및 해당 육종사에 대한 상대 평가 | "기존 품종보다 두 배"는 **일본 수입·장례업체 관계자 평가 인용**임을 명시. 외국 품종을 폄하하는 표현 금지. 로열티 서술은 국가 간 대립 구도가 아니라 국산 육종 성과로 서술 |
| A(장미·카네이션·국화) | story-rose-thornless-korea | 개발 주체가 매체마다 다름(SBS는 농촌진흥청, 일부 매체는 경기도농업기술원) | 열람 확인된 SBS 기준으로 "국내 개발" 또는 "농촌진흥청 개발"까지만 쓰고, 기관 단정이 필요하면 1차 자료(품종보호출원 정보) 재확인 후 확정 |
| A(장미·카네이션·국화) | story-rose-first-plant-patent-1931 | 실존 인물 Henry F. Bosenberg | 부정적 서술 없음. 다만 출처가 Smithsonian의 sponsored(협찬) 지면이므로, 특허 번호·날짜·발명자는 Google Patents 원문(USPP1P, 출원 1930-08-06 / 등록 1931-08-18)으로 교차 확인해 둠 |
| B(튤립·프리지아·백합) | story-lily-white-chrysanthemum-myth | 실명 전문가(을지대 장례지도학과 김시덕 교수)의 업계 비판 인용. 상조·장례업계 전반을 비난하는 톤으로 읽히면 명예 문제 | ① 특정 업체·브랜드는 절대 지목 금지 ② "업계가 폭리를 취한다" 류 단정 금지 ③ "관행의 유래가 생각보다 짧다 → 선택의 폭이 넓다"는 위로 쪽으로만 착지 ④ 원가·수입량 수치는 기사 인용임을 명시 |
| B(튤립·프리지아·백합) | story-tulip-bollongier-impossible-bouquet | "1637년 폭락에 대한 풍자"라는 해석은 학계 논쟁 중. Rijksmuseum 도 결론 유보를 명시 | 반드시 "미술관도 결론을 내리지 않았다"를 문장 안에 남길 것. 풍자로 단정 금지 |
| B(튤립·프리지아·백합) | story-tulip-name-not-turban | 부스베크(실존 인물)를 "오해한 사람"으로 낙인찍는 서술 | "그가 오해했다는 기록은 찾지 못했다"까지만. 그를 무지한 인물로 묘사하지 말 것 |
| B(튤립·프리지아·백합) | story-tulip-six-book-doctor-tulp | 니콜라스 튈프 소유는 미술관도 "possibly"로만 표기 | "여겨집니다 / 추정됩니다"로 유지. 확정 서술 금지 |
| B(튤립·프리지아·백합) | story-lily-asiatic-korean-ancestors | 부모 종 목록은 아시아틱 계열 '전체'의 조상 목록이지, 특정 상품 품종의 계보가 아님 | "이 무리의 부모 종 목록에" 수준으로 유지. "당신이 받은 이 품종의 어머니는 참나리"처럼 개별 품종에 확정 귀속 금지 |
| B(튤립·프리지아·백합) | story-lily-baekhap-was-a-root | 약용 서술이 효능 광고로 읽힐 위험 (건강기능식품·의료 표시광고 이슈) | 반드시 "옛 문헌에 그렇게 기록되어 있다"는 과거형·전언형으로. 현재 효능 주장·복용 권유 절대 금지 |
| B(튤립·프리지아·백합) | story-lily-nari-basin-ulleung | 사전이 섬말나리 학명을 *Lilium amabile var. davuricum* 으로 적었는데 통용 분류와 다를 수 있음 | 학명을 본문에 넣지 말고 '섬말나리'라는 우리말 이름만 사용 (초안에 이미 반영) |
| B(튤립·프리지아·백합) | story-freesia-jeonbuk-heartland | 61.1ha 중 22.8ha 는 2011년 시점 수치. 현재 비중으로 오독될 수 있음 | 본문·메타 어디든 "2011년 자료"를 반드시 병기 (초안에 반영) |
| B(튤립·프리지아·백합) | story-freesia-scent-measured-korea | 논문의 품종 간 향기 수치 비교를 상품 우열로 확대 해석할 위험 | 'Shiny Gold'가 다른 품종보다 낫다는 마케팅 문구로 전용 금지. "저온 저장 후에도 향이 남았다"는 사실까지만 |
| B(튤립·프리지아·백합) | story-freesia-beyond-yellow (실명) | 서상영 전북농업기술원 원예과장 실명 등장 | 초안에서는 실명을 뺐음. 유지 권장. 로열티 언급도 특정 해외 육종사 지목 없이 일반론으로만 |
| B(튤립·프리지아·백합) | 꽃말 표 — 농민신문 출처 2행 | 기사에 공식 출처(NIHHS 등) 표기가 없음 | 서비스 노출 시 "국내 화훼 유통에서 통용되는 표현" 정도로 완충. 국가기관 공인 꽃말로 표기하지 말 것 |
| B(튤립·프리지아·백합) | 꽃말 표 — hananokotoba.com 출처 4행 | 일본 민간 꽃말 정리 사이트. 1차 출처 아님 | 'japan / 하나코토바' 라벨을 반드시 병기. 한국·서양 꽃말과 섞어 한 문장으로 합치지 말 것 |
| C(거베라·리시안셔스·안개꽃) | story-gerbera-adlam-authorship | J.D. 후커(큐 왕립식물원)를 "남의 공을 가로챈 사람"으로 읽히게 할 위험. 실제로는 19세기 명명법 관행과 기재 시점 문제 | "누가 먼저 유효하게 기재했는가"의 문제로만 서술. 후커의 고의·부당함을 암시하는 표현 금지. **SANBI 한 곳의 정리**임을 밝히고(`single_source`), 여전히 `Bolus ex Hook.f.`로 표기하는 문헌이 있다는 점을 비고로 남길 것 |
| C(거베라·리시안셔스·안개꽃) | story-babysbreath-kenya-color | 실존 기업(Imaginature Ltd.)과 GMO 소재. 승인·상용화 여부를 단정하면 사실 오류이자 기업에 불리 | **2017년 노지 시험 "신청" 단계**라는 사실만 기술. 승인·출시·시판 여부는 서술하지 말 것. GMO에 대한 가치판단(위험하다/안전하다) 금지 |
| C(거베라·리시안셔스·안개꽃) | story-babysbreath-korea-graduation-price | 꽃값 상승을 꽃집·농가의 '바가지'로 읽히게 할 위험 | 기사에 함께 실린 원가 요인(등유 1리터 1,150원, 전년 대비 200~300원 상승, 전기료 인상, 2주 보관 한계)을 **반드시 병기**. 판매자를 가격 인상 주체로 지목하지 말 것 |
| C(거베라·리시안셔스·안개꽃) | story-gerbera-korea-cultivar | 외국 품종·로열티 지불을 부정적·국수주의적으로 프레이밍할 위험 | 국산 품종 육성을 "외국 품종 배격"이 아니라 "선택지가 늘어난 일"로 서술. 로열티 금액은 원문에 없으므로 **수치 언급 금지**(해당 보고서에 로열티 관련 구체 언급 없음을 확인함) |
| C(거베라·리시안셔스·안개꽃) | story-lisianthus-texas-picked | "꽃 꺾는 사람"을 도덕적으로 비난하는 톤이 될 위험 | 개인을 탓하지 않고 "사랑하는 방법을 바꾸면 된다"는 해법 중심으로 닫을 것. 현재 초안은 이 방향으로 작성됨 |
| C(거베라·리시안셔스·안개꽃) | story-lisianthus-drummond-bedford | 드러먼드 사인(死因)·베드퍼드 공작 후원의 세부는 1839년 기재문 서술에 의존 | 직접 인용은 퍼블릭 도메인 원문에 한정("not excelled in beauty by any plant" 등). 사인은 원문에 없으므로 **"쿠바 아바나에서 세상을 떠났다"까지만** 쓰고 병명·경위 추정 금지 |
| D(수국·라넌큘러스·한국 꽃 문화) | story-krwreath-three-tier | 원 칼럼에 화환 재사용 관행 지적이 있음. 특정 업체·업종 비하로 읽힐 수 있음 | 재사용 서술은 의도적으로 **전면 제외**. '경조사 화환 60%'라는 통계와 2011년 정부의 1단 화환 개발 사실만 서술. 업계 평가·비판 표현 없음 |
| D(수국·라넌큘러스·한국 꽃 문화) | story-krfuneral-white-chrysanthemum | 장례업계·특정 상품(꽃 제단) 비평으로 읽힐 소지. 원 기사에 원가 추정치와 수입 비중 비판이 포함됨 | 원가 추정치(60~70만 원)와 '수입 90% 이상' 대목은 **제외**. 도입 경로·전통 상례·수입 국화 총량(1억 8000만 본)이라는 중립 사실만 사용. 연구자는 실명·소속을 원문 그대로 인용하고 평가 표현은 붙이지 않음 |
| D(수국·라넌큘러스·한국 꽃 문화) | story-krlily-export-boom | 2005년 이후 감소 구간의 원인을 특정 제도(청탁금지법 등)에 돌리면 정책 비평이 됨 | 원인 언급 **없이** 연도별 수치만 제시하고 "사람의 형편을 따라 움직인다"는 일반적 표현으로 닫음 |
| D(수국·라넌큘러스·한국 꽃 문화) | story-krmarket-yangjae-midnight-auction | '경조사용 85%'는 2013년 시점 수치. 현재값으로 오독되면 부정확 | 본문에는 인물·경매 방식 장면만 담고 85% 수치는 **사용하지 않음**. 필요 시 "2013년 기준" 표기 필수 |
| D(수국·라넌큘러스·한국 꽃 문화) | story-krhydrangea-domestic-cultivars / story-krjeju-jongdal-hydrangea-road | 특정 기관·지자체 홍보문처럼 읽힐 수 있음 | 품종명·전시 사실·토양과 개화 시기 등 검증된 사실만 서술. 우열 평가 표현 배제 |
| D(수국·라넌큘러스·한국 꽃 문화) | story-ranunculus-weaver-florists | 존 매크리가 육성한 것은 **패랭이(pink)** 품종이지 라넌큘러스가 아님. 혼동하면 사실 오류 | 본문에서 "패랭이 품종을 조지 3세에게 바쳤다"로 명확히 구분. 라넌큘러스는 같은 시기 스코틀랜드 플로리스트 문화의 종목으로만 서술 |
| D(수국·라넌큘러스·한국 꽃 문화) | story-ranunculus-wordsworth-celandine | 애기미나리아재비는 현재 Ficaria verna 로 재분류되어 Ranunculus 속이 아님 | 본문에서 "오래도록 라넌큘러스 피카리아라는 학명으로 불린", "지금은 다른 속으로 옮겨 갔지만"으로 명시 |
| D(수국·라넌큘러스·한국 꽃 문화) | story-hydrangea-hortensia-name | '오르탕스' 유래설이 여럿이고 확정된 바 없음 | 단정하지 않고 세 가지 설을 나란히 놓은 뒤 "아무도 모른다"로 닫음. confidence: varies |
| D(수국·라넌큘러스·한국 꽃 문화) | story-hydrangea-manyoshu-eight-fold | 만엽집 원문은 만요가나 표기라 현대 표기와 다름 | 원문 직역 인용 대신 뜻만 우리말로 옮기고, 옛 표기가 소리를 빌린 글자였다는 사실을 이야기 안에 넣음 |

---

## 10. Advisor 판단이 필요한 후속 항목

1. **`source_kind` 컬럼을 `content/stories.csv` 에 실제로 추가할지.** 이 문서는 컬럼을 달아 뒀지만 현행 CSV 스키마에는 없습니다. 추가한다면 기존 196행에도 소급해서 값을 채워야 하고(대부분 `wiki`), 그러면 카탈로그 전체의 소스 편중이 데이터로 드러납니다 — 유용하지만 작업량이 있습니다.
2. **꽃별 편차가 더 커집니다.** 이번 55편을 다 실으면 튤립 17 · 장미 17 · 수국 13 · 국화 13 이 되고 리시안셔스는 9입니다. 도감이 꽃당 전량을 노출한다면 상위 꽃의 스크롤이 매우 길어집니다(2차 조사 §6-1 후속 항목 4의 연장선이며, 이번에 더 심해졌습니다).
3. **`story_type = original` 은 이번에도 0건**입니다. 55편이 `history` 51 · `literary` 3 · `folklore` 1 로, **역사 쪽으로 크게 쏠렸습니다.** 소스를 논문·신문·기관 자료로 옮긴 결과이며, 설화(`folklore`)가 1편뿐인 것은 1·2차와 뚜렷이 다른 지점입니다. §1.5f 가 허용한 dearbloom 창작 이야기를 실을지는 편집 판단이라 손대지 않았습니다.
4. **한국 꽃 문화 이야기 9편의 `flower_id` 귀속은 재배치 가능합니다.** 양재동 경매(장미)·3단 화환(거베라)·남대문 시장(프리지아) 같은 이야기는 특정 꽃의 이야기가 아니라 **장면의 이야기**입니다. 지금은 가장 어울리는 꽃에 붙여 뒀지만, 꽃과 무관한 "꽃 문화" 섹션을 따로 둘지 판단이 필요합니다.
5. **`funny` 가 2편뿐입니다**(§1-4). 이번 라운드가 유통사·논문·조문으로 기울어진 결과입니다. just_because·confession 풀의 경쾌한 쪽이 얇아지지 않는지 확인이 필요합니다.
6. **거베라·라넌큘러스 꽃말이 각 1행**에 그쳤습니다. NIHHS 꽃말사전(`Flower_library.do`)이 **날짜 페이지네이션만 지원하고 검색 파라미터를 받지 않아** 두 갈래가 모두 항목 도달에 실패한 것이 직접 원인입니다. 날짜 기반 URL 규칙을 찾아내면 한 번에 해소됩니다 — 다음 라운드 1순위.
7. **`story-rose-thornless-korea` 의 개발 주체가 매체마다 다릅니다**(SBS는 농촌진흥청, 일부 매체는 경기도농업기술원). 품종보호출원 정보로 확정한 뒤 적재하는 것이 안전합니다.
8. **재도전 가치가 높은 미해결 소재 3건** — ① 카네이션 **약혼의 꽃**(르네상스 초상화에서 신부가 카네이션을 숨기는 풍습, 박물관 5곳 전부 403) ② 안개꽃 **뿌리 사포닌 → 터키 할바·비누**(원문 열람 전부 실패) ③ 이사벨라 프레스턴의 **'Stenographer 시리즈'**(비서들 이름을 붙인 백합, 근거 페이지 전부 403). 셋 다 자료만 열리면 바로 이야기가 됩니다.
9. **`single_source` 가 29편(53%)으로 절반을 넘습니다.** 위키피디아에서 벗어난 대가입니다 — 논문·지역 신문·기관 보고서는 성격상 교차 출처를 찾기 어렵습니다. 데이터로서는 정직하지만, §1.5d 규칙대로라면 **이 29편은 화면에서 "드물게 전해지는 이야기예요" 라벨을 달게 됩니다.** 그런데 이 라벨은 원래 "1차 사료가 없는 카더라"를 위한 문구여서, 국립원예특작과학원 연구보고서나 『보태니컬 매거진』 1839년 원문에 붙으면 오히려 신뢰를 깎습니다. **`single_source` 를 "출처가 하나"와 "전승이라 근거가 약함"으로 쪼개거나, 라벨 문구를 출처 성격에 따라 갈라야 합니다.** 이번 라운드가 만든 가장 큰 구조적 숙제입니다.

