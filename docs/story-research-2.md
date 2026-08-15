# 꽃 설화·이야기 리서치 2차 — 기존 17종 해외 심화 (story-research-2)

## 1. 조사 개요

- **조사일**: 2026-08-15
- **대상**: `content/flowers.csv` 의 **기존 17종 전부**. 신규 꽃은 이 문서 범위 밖(별도 담당)
- **수집 이야기 수**: **47개** — 기존 `content/stories.csv` 89행과 **소재 중복 없음**(89행 전수 대조)
- **꽃별 수집 수**: 장미 3 · 튤립 3 · 프리지아 2 · 백합 3 · 거베라 3 · 아네모네 3 · 헬레보어 2 · 히아신스 3 · 작약 2 · 수국 3 · 라벤더 3 · 해바라기 3 · 카네이션 3 · 리시안셔스 3 · 라넌큘러스 2 · 은방울꽃 3 · 국화 3
- **열람 확인한 URL**: **50개**(표에 쓴 source_url 43개 + 부재 확인·대조용 7개). 표의 모든 URL 은 실제로 본문을 열어 확인했습니다. 열람 실패 13건은 4장에 사유와 함께 남겼고 본문에서 전부 뺐습니다.
- **방법**: 영문 위키피디아, 위키낱말사전(영문·일본어 표제어), 미국 국립보건원 PMC 논문, 일리노이대 Extension, NC State Extension, 노(能) 공식 데이터베이스(the-noh.com), 네덜란드 히아신스 유리병 아카이브(kennemerend.nl), Gerbera.org 육종 아카이브, The Perfume Society, 로버트 티서랜드(아로마테라피 사료 검증), 농촌진흥청 농사로

### 1-1. 이번 조사가 노린 것 (사용자 지시 반영)

> "외국에 이런 게 많을 텐데 다시 조사해서 최대한 많은 데이터. 재밌어 보이는 건 다 가져와."

1차 조사(`story-research.md`)가 **그리스·로마 신화 + 네덜란드 튤립**에 몰려 있어서, 이번에는 **의도적으로 다른 문화권과 다른 장르**를 팠습니다.

**새로 열린 문화권** — 캐나다, 이란(현대), 중앙아시아(톈산·파미르알라이), 러시아(정교회 금식 규정), 이탈리아(피렌체 겔프·기벨린), 미국 개척지(일리노이·텍사스·오리건), 남아프리카×케임브리지, 대만, 인도-유럽 어원학, 그리고 **한국 절화 유통 현장**(농사로).

**새로 연 장르** — 전쟁과 꽃(평화 장미·오타와 튤립·불탄 해바라기), 과학사(케임브리지 교배·국화과 두상화 논문·향료 화학), 미술사(고흐 연작의 소실분), 경제사(러시아 사순절 금식 규정의 허점), 왕실·정치 스캔들(초록 카네이션·피렌체 색 반전), 어원 반전(수국·리시안셔스·헬레보어), 학명 정치(리시안셔스·아네모네속 해체), 괴담(모란 등롱).

### 1-2. 저작권 처리 원칙 (1차와 동일)

- **타 사이트 문장을 옮긴 곳은 한 군데도 없습니다.** 표의 "리텔링 초안"은 전부 사실관계만 참고해 새로 쓴 우리 문장(한국어, 다정한 존댓말 이야기 톤)입니다.
- 설화·역사적 사실 자체는 아이디어라 저작권 대상이 아닙니다. 표현만 새로 쓰면 자유롭게 쓸 수 있습니다.
- 원문 인용은 하지 않았습니다. 이번 47개 중 직접 인용은 0건입니다.
- **confidence 라벨** (1차와 동일 기준)
  - `repeated` — 여러 독립 출처에서 반복 확인되는 정설/사실
  - `varies` — 전승은 널리 알려졌으나 버전이 갈리거나 출처가 한 계열에 몰림
  - `single_source` — 드물게 전해지거나 1차 사료가 없는 "카더라". 화면에서 "이렇게 전해집니다" 톤 필수

### 1-3. mood 분포 (전체 47개, 복수 부여 — 중복 카운트)

| mood | 개수 | 비고 |
|---|---|---|
| healing | 34 | 최다 |
| mythic | 28 | |
| dramatic | 25 | |
| funny | 23 | 1차(22)보다 비중이 크게 올랐습니다 — 어원 반전·학명 정치·러시아 금식 허점 계열 |
| romantic | 11 | |
| tragic | 8 | 최소 |

**6종 전부 커버 확인 완료.** 1차에서 가장 얇았던 `romantic`(13)을 11개 더 얹어 **합계 24개**가 됐고, `funny` 는 이번 47개 안에서만 23개라 confession/anniversary·just_because 양쪽 풀이 함께 두꺼워집니다. 다만 이번 묶음 안에서는 `tragic` 이 8개로 가장 얇습니다(1차 16개와 합쳐 24개).

---

## 2. 이야기 표

> 컬럼: `# | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence`
> `story_id` 는 **현행 `content/stories.csv` 규칙(`story-` 접두사)** 에 맞췄습니다. 1차 문서 표는 접두사가 없어 적재 때 손을 봐야 했는데, 이번엔 그대로 넣으면 됩니다.
> intents 가 `—` 이면 전천후로 붙일 수 있다는 뜻입니다.

### 2-1. rose-red (장미) — 3개 · 기존 8개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | story-rose-peace-1945 | 이름을 정한 날, 베를린이 무너졌습니다 | 프랑스의 육종가 프랑시스 메이앙은 1935년에 장미 하나를 만들어 두고 '3-35-40'이라는 번호만 붙여 뒀습니다. 독일군이 밀려온다는 걸 직감한 그는 삽수를 나눠 이탈리아·튀르키예·독일·미국의 동료들에게 흩어 보냈어요. 전쟁 통에 연락이 끊겨 이 장미는 나라마다 다른 이름으로 불렸습니다. 1945년 초, 메이앙은 영국의 앨런 브룩 원수에게 편지를 써서 장미에 당신 이름을 붙이게 해 달라고 청했습니다. 브룩은 사양하면서 다른 이름을 권했어요. '평화'. 미국에서 이 이름이 공식 발표된 날이 1945년 4월 29일, 베를린이 함락되던 무렵이었습니다. 그해 샌프란시스코 유엔 창립총회에서는 각국 대표에게 이 장미가 한 송이씩 돌아갔고, 꽃마다 쪽지가 붙어 있었습니다. 이 꽃이 사람들의 생각을 영원한 평화 쪽으로 밀어 주기를 바란다고요. | 이 장미의 이름이 정해진 날, 베를린이 무너졌습니다 | dramatic, healing, mythic | comfort, celebration | 프랑스·미국 | 1935~1945 | Peace (rose) (Wikipedia) | https://en.wikipedia.org/wiki/Peace_(rose) | repeated |
| 2 | story-rose-wars-name | 30년을 싸운 사람들은 그게 장미전쟁인 줄 몰랐습니다 | 영국의 장미전쟁은 사실 당대에 그렇게 불린 적이 없습니다. 그 시절 사람들은 그냥 '내전'이라고 했어요. 지금 쓰는 이름은 1829년 월터 스콧이 소설 『가이어슈타인의 앤』을 내면서 퍼진 것입니다. 스콧은 셰익스피어 『헨리 6세』 1부에서 귀족들이 템플 정원에 서서 붉은 장미와 흰 장미를 골라 편을 가르는 장면을 빌려 왔죠. 그런데 그 장면조차 셰익스피어가 지어낸 것이었습니다. 요크가 흰 장미를 쓴 건 사실이지만, 랭커스터의 붉은 장미는 1485년 보즈워스에서 헨리 튜더가 이기고 난 다음에야 등장합니다. 이긴 쪽이 나중에 만들어 붙인 상징으로, 우리는 지금도 그 전쟁을 부르고 있습니다. | 30년을 싸운 사람들은 자기들이 '장미전쟁' 중인 줄 몰랐습니다 | funny, dramatic, mythic | — | 영국 | 15세기 / 1829 | Wars of the Roses (Wikipedia) | https://en.wikipedia.org/wiki/Wars_of_the_Roses | repeated |
| 3 | story-rose-china-repeat | 200년 전 장미는 1년에 한 번만 폈습니다 | 유럽의 옛 장미는 봄에 한 번 피고 그걸로 끝이었습니다. 여름 내내, 가을까지 계속 피는 장미는 유럽에 없었어요. 그걸 바꾼 건 중국에서 건너온 네 그루입니다. 1792년 슬레이터의 진홍 차이나, 1793년 파슨스의 분홍 차이나, 1809년 흄의 연분홍 티, 1824년 파크스의 노랑 티. 이 넷을 흔히 '네 그루의 씨장미'라고 부릅니다. 이들이 가져온 건 색이 아니라 '계속 피는 성질'이었어요. 그 성질이 유럽 장미와 섞이면서 반복 개화하는 계통이 줄줄이 태어났고, 1867년 '라 프랑스'가 나오면서 오늘날 우리가 꽃집에서 사는 하이브리드 티 장미가 시작됩니다. 지금 화병에 꽂힌 장미가 여름에도 피는 건, 200년 전 배를 타고 온 네 그루 덕입니다. | 200년 전 유럽 장미는 1년에 딱 한 번 피고 끝이었습니다 | dramatic, healing | just_because, anniversary | 중국·유럽 | 1792~1867 | Garden roses (Wikipedia) | https://en.wikipedia.org/wiki/Garden_roses | repeated |

### 2-2. tulip-white (튤립) — 3개 · 기존 10개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 4 | story-tulip-ottawa-margriet | 병실 하나가 잠깐 다른 나라가 됐습니다 | 2차 대전 중 네덜란드 왕실은 나치를 피해 캐나다 오타와에 3년을 머물렀습니다. 1943년, 그곳에서 마르흐리트 공주가 태어나게 되는데 문제가 하나 있었어요. 캐나다에서 태어나면 캐나다 국적이 섞여 왕위 계승에 문제가 생길 수 있었거든요. 캐나다 정부는 별난 결정을 합니다. 오타와 시빅 병원의 분만실을 잠시 '캐나다 영토가 아닌 곳'으로 선포한 거예요. 아기는 어머니의 나라만 물려받고 태어났습니다. 해방된 이듬해, 네덜란드 왕실은 오타와로 튤립 구근 10만 개를 보냈습니다. 1946년에는 2만 500개를 더 보내면서 그 병원에 꽃밭을 만들어 달라고 했고, 앞으로 해마다 1만 개씩 보내겠다고 약속했어요. 그 약속은 지금도 지켜지고 있습니다. 해마다 2만 개씩, 왕실이 1만 개 구근재배자협회가 1만 개. | 아기 한 명 때문에 병실이 잠깐 외국이 된 적이 있습니다 | healing, dramatic, romantic | gratitude, celebration | 캐나다·네덜란드 | 1943~현재 | Canadian Tulip Festival (Wikipedia) | https://en.wikipedia.org/wiki/Canadian_Tulip_Festival | repeated |
| 5 | story-tulip-iran-martyr | 무덤에서 피는 붉은 튤립 | 이란에는 아주 오래된 믿음이 하나 있습니다. 나라를 위해 죽은 젊은이의 무덤에서는 붉은 튤립이 핀다는 이야기예요. 신화 시대까지 거슬러 올라가는 전승이라고 합니다. 그래서 이란에서 붉은 튤립은 예쁜 꽃이기 이전에 '먼저 간 사람'을 뜻합니다. 1980년 5월 9일 채택된 이란의 국장도 이 꽃 모양으로 읽힙니다. 하미드 나디미가 도안한 이 문양은 붉은 튤립의 실루엣으로 먼저 간 사람들을 가리킵니다. 우리에게 튤립은 봄에 피는 구근 꽃인데, 어떤 나라에서는 국가의 문장에 새겨진 추모의 꽃입니다. | 어떤 나라는 국장에 튤립을 새겨 두었습니다 | tragic, mythic, dramatic | comfort | 이란 | 전승~1980 | Emblem of Iran (Wikipedia) | https://en.wikipedia.org/wiki/Emblem_of_Iran | repeated |
| 6 | story-tulip-tianshan-wild | 고대 그리스·로마 문헌에 튤립은 한 번도 안 나옵니다 | 튤립을 네덜란드 꽃이라고 생각하기 쉽지만, 야생 튤립이 가장 다양하게 자라는 곳은 중앙아시아의 톈산산맥과 파미르알라이산맥입니다. 북위 40도 언저리, 우즈베키스탄과 투르크메니스탄 쪽 산자락이 이 꽃의 진짜 고향이에요. 재미있는 건, 고대 문헌 어디에도 튤립이 등장하지 않는다는 점입니다. 그리스도 로마도 이 꽃을 몰랐어요. 재배 기록이 처음 보이는 건 10세기 페르시아이고, 셀주크가 서쪽으로 밀고 들어가면서 아나톨리아에 닿은 것으로 봅니다. 유럽이 이 꽃에 미쳐 돌아가기까지는 거기서 600년이 더 걸렸습니다. | 그리스도 로마도 이 꽃을 몰랐습니다 | mythic, healing, funny | just_because | 중앙아시아·페르시아 | 10세기~ | Tulip (Wikipedia) | https://en.wikipedia.org/wiki/Tulip | repeated |

### 2-3. freesia (프리지아) — 2개 · 자료 희소 꽃 보강 · 기존 5개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 7 | story-freesia-impossible-scent | 아직 아무도 이 향을 병에 담지 못했습니다 | 프리지아는 향으로 사는 꽃인데, 정작 그 향을 뽑아내는 데는 아무도 성공하지 못했습니다. 증류를 해도 용매에 녹여도 살아 있는 꽃의 냄새가 안 나와요. 향수업계에서는 이걸 두고 "온갖 방법을 다 써 봤지만 프리지아의 향은 끝내 잡히지 않았다"고 말합니다. 그래서 지금 시중의 모든 프리지아 향은 합성으로 다시 지어낸 것입니다. 조향사들이 기억과 분석을 더듬어 새로 상상해 만든 냄새죠. 향수병에 담긴 프리지아는 프리지아가 아닙니다. 진짜를 맡으려면 꽃을 사는 수밖에 없어요. | 이 향을 병에 담는 데 성공한 사람은 아직 없습니다 | healing, mythic, tragic | just_because, confession | 세계 | 현대 | Freesia — The Perfume Society | https://perfumesociety.org/ingredients-post/freesia/ | repeated |
| 8 | story-freesia-graduation-korea | 졸업식에 이 꽃이 있는 건 꽃말 때문만은 아닙니다 | 한국에서 프리지아는 졸업식 꽃입니다. 새 출발이라는 꽃말 덕이라고들 하는데, 사실 이유가 하나 더 있어요. 농촌진흥청 자료를 보면 프리지아 촉성재배는 7월에 저온처리를 시작해 12월 중순부터 2월 중순까지 꽃을 냅니다. 가장 많이 나오는 때가 1월 중순에서 2월 초예요. 졸업 시즌과 정확히 겹칩니다. 자료에도 적혀 있습니다. 출하 물량이 졸업식 시즌 앞뒤로 몰리고, 그때 값도 가장 높게 선다고요. 경기·전북·충남의 하우스에서 한겨울에 저온처리를 받고 올라온 꽃이, 2월 어느 날 누군가의 품에 안깁니다. 꽃말보다 먼저, 농부의 달력이 이 꽃을 졸업식에 데려다 놓은 셈입니다. | 이 꽃이 졸업식 꽃이 된 건 꽃말 때문만이 아닙니다 | healing, funny | celebration, gratitude | 한국 | 현대 | 프리지아 재배 작형 (농촌진흥청 농사로) | https://www.nongsaro.go.kr/portal/ps/psb/psbl/workScheduleDtl.ps?menuId=PS00087&cntntsNo=30696&sKidofcomdtySeCode=FL | repeated |

### 2-4. lily-asiatic (백합) — 3개 · 기존 7개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 9 | story-lily-stargazer-woodriff | 세상에서 제일 많이 팔리는 백합을 만들고, 한 푼도 못 받았습니다 | 오리건주 브루킹스에 레슬리 우드리프라는 백합 육종가가 살았습니다. 정리라고는 안 된 온실에서 남들이 안 하는 교배만 골라 하는 별난 사람이었어요. 오리엔탈 백합은 원래 고개를 옆으로나 아래로 숙이고 핍니다. 그런데 1974년, 그의 손에서 하늘을 똑바로 올려다보는 백합이 나왔습니다. 이름은 '스타게이저', 별을 보는 자. 지금 전 세계 꽃집에서 백합 하면 떠올리는 그 진분홍 꽃이 바로 이겁니다. 그런데 우드리프는 이 꽃으로 돈을 벌지 못했습니다. 스타게이저를 발견하기 직전, 그 모주의 소유권을 이미 팔아넘긴 뒤였거든요. 함께 일하던 파트너도 특허 판단을 잘못해 결국 크게 손해를 봤습니다. 세상에서 가장 많이 재배되는 백합이면서, 만든 사람에게는 가장 적게 돌아간 꽃입니다. | 꽃집에서 제일 흔한 백합을 만든 사람은 한 푼도 못 벌었습니다 | tragic, dramatic, healing | comfort | 미국 | 1974 | Lilium 'Stargazer' (Wikipedia) / Leslie Woodriff (The Fat of the Land) | https://thefatofthelandblog.wordpress.com/tag/leslie-woodriff/ | varies |
| 10 | story-lily-florence-color-flip | 상대가 우리 깃발을 계속 쓰길래, 색을 뒤집었습니다 | 피렌체의 상징은 백합, 이탈리아어로 질리오입니다. 원래는 붉은 바탕에 흰 백합이었어요. 그런데 1250년, 도시를 놓고 싸우던 두 파 중 기벨린이 지고 쫓겨납니다. 문제는 쫓겨난 쪽이 밖에서 그 흰 질리오를 계속 쓴다는 거였어요. 남은 겔프는 어떻게 했을까요. 색을 통째로 뒤집었습니다. 흰 바탕에 붉은 질리오로요. 그 뒤집힌 색이 지금까지 그대로 피렌체의 깃발입니다. 도시 하나가 정적과 겹치기 싫어서 자기 상징의 색을 갈아엎은 셈입니다. 참고로 그 질리오는 사실 백합이 아니라 도시 언덕에 흔하던 붓꽃을 본뜬 것이라고 합니다. | 상대가 우리 깃발을 계속 쓰길래, 우리가 색을 뒤집었습니다 | dramatic, funny, mythic | — | 이탈리아 | 13세기 | Flag of Florence (Wikipedia) | https://en.wikipedia.org/wiki/Flag_of_Florence | repeated |
| 11 | story-lily-baihe-wedding | 이 꽃의 이름이 곧 결혼 축사입니다 | 중국어로 백합은 百合, 바이허입니다. 글자 그대로 옮기면 '백 개가 합쳐진 것'이에요. 비늘줄기를 쪼개 보면 얇은 조각이 겹겹이 포개져 한 덩이를 이루고 있는데, 그 모습에서 온 이름입니다. 그런데 이 발음이 결혼식에서 가장 많이 하는 축사와 겹칩니다. 百年好合, 바이녠하오허 — 백 년을 사이좋게, 라는 뜻이에요. 그래서 중국에서 백합은 오래 가는 결혼의 표시가 됐습니다. 꽃 이름을 부르는 것만으로 이미 축복이 되는 셈이죠. 겹겹이 포개져야 한 덩이가 된다는 것도, 하필 결혼에 어울리는 생김새입니다. | 이 꽃은 이름을 부르는 것만으로 결혼 축사가 됩니다 | romantic, healing, mythic | celebration, anniversary | 중국 | 전승~현대 | 百合 (Wiktionary) / 百年好合 (Wiktionary) | https://en.wiktionary.org/wiki/%E7%99%BE%E5%90%88 | repeated |

### 2-5. gerbera (거베라) — 3개 · 자료 희소 꽃 보강 · 기존 5개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 12 | story-gerbera-cambridge-cross | 지금 파는 거베라는 거의 다 한 온실의 후손입니다 | 남아프리카에서 온 야생 거베라는 지금 꽃집 거베라와 많이 달랐습니다. 1879년부터 케임브리지대 식물원을 맡았던 리처드 어윈 린치가 그걸 바꿔 놓았어요. 그는 야생종 두 가지, 거베라 제임소니와 거베라 비리디폴리아를 교배해 첫 '꽃집용 거베라'를 만들어 냅니다. 이름은 게르베라 칸타브리기엔시스, 그러니까 '케임브리지의 거베라'라고 붙였어요. 태어난 곳을 이름에 새긴 겁니다. 1891년 왕립원예협회에서 1급 증서를 받았고, 1904년에는 런던 템플 전시회에도 올랐습니다. 오늘날 상업 거베라 품종의 거의 전부가 그 온실에서 시작된 한 번의 교배에서 갈라져 나왔습니다. | 지금 파는 거베라는 거의 다 한 온실에서 시작됐습니다 | healing, mythic, dramatic | gratitude | 영국·남아프리카 | 1890년대 | Gerbera hybridization history (Gerbera.org) / Richard Irwin Lynch (Gerbera.org) | https://www.gerbera.org/species/jamesonii-barberton-daisy/hybridization-history/ | repeated |
| 13 | story-gerbera-25000-tries | 이 꽃 하나를 고정하는 데 2만 5천 번 | 린치가 만든 거베라는 프랑스 리비에라의 한 종묘장으로 건너갑니다. 거기서 벌어진 일이 좀 무섭습니다. 1909년까지 3천 번이 넘게 인공수분을 했고, 그렇게 나온 개체 2만 5천 그루를 하나하나 키워 보고 골라냈어요. 그 결과 지름 13센티미터짜리 꽃이, 그것도 온갖 색으로 나오기 시작합니다. 그런데도 끝내 안 된 게 하나 있었습니다. 씨앗을 받아 심으면 부모와 같은 꽃이 나오게 만드는 일, 그건 그때 실패했어요. 모양도 색도 수량도 계속 제멋대로였습니다. 지금 꽃집에서 아무렇지 않게 고르는 거베라 한 송이 뒤에는, 붓으로 3천 번을 찍고 2만 5천 번을 지켜본 사람들이 있습니다. | 이 꽃 색을 고르는 데 2만 5천 그루를 키워 봤습니다 | dramatic, healing, funny | gratitude, comfort | 프랑스 | 1900년대 | Gerbera hybridization history (Gerbera.org) | https://www.gerbera.org/species/jamesonii-barberton-daisy/hybridization-history/ | varies |
| 14 | story-gerbera-hundreds-in-one | 한 송이를 건네면 사실 수백 송이를 건네는 겁니다 | 거베라의 그 동그란 얼굴은 꽃 한 송이가 아닙니다. 국화과 식물의 '두상화'라고 해서, 수백 개의 낱꽃을 아주 촘촘히 눌러 담아 한 송이처럼 보이게 만든 구조예요. 식물학에서는 아예 '가짜 꽃'이라는 이름으로 부릅니다. 안을 들여다보면 낱꽃들이 왼쪽으로 도는 나선과 오른쪽으로 도는 나선을 이루며 박혀 있고, 그 나선의 개수는 피보나치 수열을 따라갑니다. 이 구조가 국화과를 지구에서 가장 종이 많은 식물 무리로 만든 결정적 발명이라고 봅니다. 거베라는 이 구조를 연구할 때 쓰는 대표 종이기도 하고요. 그러니까 거베라 한 송이를 건네는 건, 수백 송이를 나선으로 묶어 건네는 일입니다. | 거베라 한 송이는 사실 꽃 한 송이가 아닙니다 | healing, mythic, funny | confession, gratitude | 세계 | 현대 | My favourite flowering image: a capitulum of Asteraceae (PMC) | https://pmc.ncbi.nlm.nih.gov/articles/PMC6859721/ | repeated |

### 2-6. anemone (아네모네) — 3개 · 기존 5개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 15 | story-anemone-ancient-woodland | 이 꽃이 깔린 숲은 아주 오래된 숲입니다 | 유럽 숲 바닥에 봄마다 흰 별처럼 깔리는 아네모네가 있습니다. 이 꽃은 씨앗보다 땅속줄기로 아주 천천히 퍼져요. 얼마나 느리냐면, 새로 생긴 숲에는 좀처럼 나타나지 않을 정도입니다. 그래서 영국에서는 이 꽃을 '오래된 숲'의 표시로 씁니다. 이 꽃이 넓게 깔려 있으면 그 숲은 수백 년 동안 베이지 않고 이어져 온 숲일 가능성이 높다는 뜻이에요. 물론 절대적인 건 아닙니다. 사람이 새 숲에 심어 놓은 경우도 있으니까요. 그래도 이 작은 꽃 하나가 시간의 눈금 노릇을 한다는 건 근사합니다. 오래 있었다는 걸 증명하는 방법이, 이 꽃에게는 그냥 거기 있는 것입니다. | 이 꽃이 깔린 숲은 수백 년 된 숲일 가능성이 높습니다 | healing, mythic | comfort, just_because | 유럽·영국 | 현대 | Anemonoides nemorosa (Wikipedia) | https://en.wikipedia.org/wiki/Anemone_nemorosa | varies |
| 16 | story-anemone-broken-bowl | 중국에서 이 꽃 이름은 "밥그릇 깨는 꽃"입니다 | 서양 꽃집에서 '재패니즈 아네모네'라고 부르는 가을 아네모네가 있습니다. 그런데 이 꽃은 일본 것이 아닙니다. 학명의 종소명이 후페헨시스, 중국 후베이성에서 왔다는 뜻이에요. 수백 년 전 재배지에서 빠져나와 중국 전역으로 퍼졌고 일본과 한국까지 건너간 뒤, 서양에 소개될 때 일본 이름을 달고 갔습니다. 중국에서 이 꽃을 부르는 이름은 더 인상적입니다. 打破碗花花, 밥그릇 깨는 꽃. 아이들이 함부로 꺾지 못하게 어른들이 붙여 준 이름처럼 들리는데, 실제로 이 무리는 즙에 자극 성분이 있어 맨손으로 오래 만지면 좋지 않습니다. 겁주는 이름이 안전 안내였던 셈입니다. | 중국에서 이 꽃 이름은 "밥그릇 깨는 꽃"입니다 | funny, mythic, dramatic | just_because | 중국·일본 | 전승~현대 | Eriocapitella hupehensis (Wikipedia) | https://en.wikipedia.org/wiki/Eriocapitella_hupehensis | varies |
| 17 | story-anemone-exiled-genus | 이름은 아네모네인데 아네모네가 아닌 꽃들 | 식물 이름은 생각보다 자주 바뀝니다. 유전자를 들여다보는 연구가 늘면서, 오랫동안 아네모네속으로 묶여 있던 무리가 여럿으로 쪼개졌어요. 유럽 숲의 아네모네는 아네모노이데스속으로, 가을에 피는 이른바 재패니즈 아네모네는 에리오카피텔라속으로 옮겨졌습니다. 그러니까 지금은 이런 상황입니다. 사람들은 여전히 아네모네라고 부르는데, 학명상 아네모네속이 아닌 아네모네들이 잔뜩 생긴 거예요. 이름은 사람들 입에 남고, 분류는 조용히 바뀝니다. 부르는 이름과 진짜 이름이 어긋나는 일은, 꽃에게도 자주 있는 일입니다. | 이름은 아네모네인데 아네모네속이 아닌 아네모네들이 있습니다 | funny, dramatic | just_because | 세계 | 현대 | Anemonoides nemorosa (Wikipedia) / Eriocapitella hupehensis (Wikipedia) | https://en.wikipedia.org/wiki/Eriocapitella_hupehensis | repeated |

### 2-7. hellebore (헬레보어) — 2개 · 기존 6개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 18 | story-hellebore-sepals | 지지 않는 이유는 꽃잎이 아니어서입니다 | 헬레보어는 유난히 오래 갑니다. 다른 꽃들이 다 지고 나서도 몇 달씩 그 자리에 그대로 있어요. 이유는 조금 반칙 같습니다. 우리가 꽃잎이라고 보는 그 부분이 꽃잎이 아니거든요. 꽃받침입니다. 꽃잎은 제 할 일이 끝나면 떨어지게 되어 있지만, 꽃받침은 떨어지지 않고 남습니다. 그렇게 남아서 씨앗이 여무는 걸 돕는다는 해석도 있어요. 겨울에 피어서 오래 버티는 꽃이라기보다는, 처음부터 떨어질 생각이 없는 부위로 피어난 꽃인 셈입니다. 오래 남는 데에도 구조가 있습니다. | 이 꽃이 몇 달을 가는 건 그게 꽃잎이 아니기 때문입니다 | healing, mythic | comfort, anniversary | 세계 | 현대 | Helleborus (Wikipedia) | https://en.wikipedia.org/wiki/Helleborus | repeated |
| 19 | story-hellebore-white-is-not | 2천 년 동안 다른 식물을 이 이름으로 불렀습니다 | 고대 의학서에는 헬레보어가 두 가지로 나옵니다. 검은 헬레보어와 흰 헬레보어. 그런데 흰 헬레보어는 헬레보어가 아닙니다. 베라트룸 알붐이라는 전혀 다른 식물이에요. 진짜 헬레보어는 미나리아재비과인데 이쪽은 여로과라, 사촌도 아니고 남남입니다. 이름 하나가 2천 년 동안 두 식물을 같은 서랍에 넣어 둔 셈이죠. 헬레보어라는 이름 자체도 무섭습니다. 그리스어로 '해치다'와 '먹을 것'을 붙여 만든 말이니까요. 2013년에는 알렉산더 대왕의 죽음이 이 흰 헬레보어 때문이었을 수 있다는 가설이 나왔습니다. 열이틀에 걸쳐 나타난 증상이 이 식물의 중독 경과와 맞아떨어진다는 이유였어요. 겨울에 조용히 피는 꽃 뒤에는 이런 계보가 있습니다. | 2천 년 동안 사람들은 다른 식물을 헬레보어라고 불렀습니다 | dramatic, funny, mythic | — | 그리스·유럽 | 고대~2013 | Veratrum album (Wikipedia) / Helleborus (Wikipedia) | https://en.wikipedia.org/wiki/Veratrum_album | varies |

### 2-8. hyacinth (히아신스) — 3개 · 기존 7개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 20 | story-hyacinth-forcing-glass | 뿌리까지 들여다보려고 유리병을 만들었습니다 | 겨울에 꽃을 보고 싶었던 사람들이 있습니다. 1700년 무렵, 어쩌면 그보다 전부터 네덜란드에서는 구근을 물 위에 얹어 방 안에서 꽃을 피우기 시작했어요. 그런데 왜 화분이 아니라 유리병이었을까요. 뿌리가 자라는 걸 보고 싶었기 때문입니다. 목이 잘록하고 위가 벌어진 그 특이한 유리병은 구근이 물에 잠기지 않게 받쳐 주면서, 아래로 뻗어 나가는 하얀 뿌리를 하루하루 지켜볼 수 있게 해 줬습니다. 하를럼의 구근 재배가 조지 보르헬름은 1752년에 낸 히아신스 책에 유리병에 올린 겹히아신스 그림을 실었어요. 1731년 독일의 한 기록에는 이런 문장이 남아 있습니다. 이건 네덜란드 사람들에겐 흔한 재주인데 독일에는 이제야 알려졌다고요. 꽃이 안 피는 계절을 견디는 방법으로 사람들이 고른 게, 뿌리를 구경하는 일이었습니다. | 겨울에 꽃을 보려고 뿌리까지 들여다보는 병을 만들었습니다 | healing, funny, romantic | just_because, comfort | 네덜란드 | 18세기 | History of Hyacinth Vases (Kennemerend) | https://kennemerend.nl/history/ | varies |
| 21 | story-hyacinth-2000-from-one | 야생에는 세 종뿐인데, 사람 손에서 2천 갈래가 됐습니다 | 히아신스속에 속하는 야생종은 놀랍게도 세 종밖에 없습니다. 학자에 따라서는 사실상 한 종이라고 보기도 해요. 고향은 남부 튀르키예에서 레바논·시리아를 지나 이라크와 이란, 투르크메니스탄까지 이어지는 건조한 땅입니다. 그런데 그중 딱 한 종, 히아킨투스 오리엔탈리스가 유럽으로 건너간 뒤 벌어진 일이 대단합니다. 18세기 네덜란드에서 이 한 종에서 갈라져 나온 품종이 2천 가지를 넘었어요. 야생에서는 세 갈래뿐이던 것이 사람 손에서 2천 갈래가 된 겁니다. 향이 진한 꽃 하나에 사람들이 얼마나 오래 매달렸는지를, 그 숫자가 말해 줍니다. | 야생에는 세 종뿐인데, 사람 손에서 2천 갈래가 됐습니다 | dramatic, mythic, funny | just_because | 네덜란드·근동 | 18세기 | Hyacinthus (Wikipedia) | https://en.wikipedia.org/wiki/Hyacinthus | repeated |
| 22 | story-hyacinth-jacinth-stone | 성경에 나오는 히아신스는 꽃이 아니라 돌입니다 | 히아신스라는 말에는 보석이라는 뜻도 있습니다. 야신스라고도 부르는데, 지르콘 계열의 노란빛 도는 붉은 보석이에요. 요한계시록에서 새 예루살렘의 기초석을 늘어놓는 대목에 히아킨토스가 나옵니다. 그런데 여기서 반전이 있어요. 고전 그리스어 사전들은 이 돌을 '히아신스 꽃 빛깔의 돌', 그러니까 짙은 파랑으로 봅니다. 오늘날의 붉은 야신스가 아니라 사파이어에 가까웠을 거라는 뜻이죠. 돌 이름이 꽃 색에서 왔는데, 세월이 지나며 돌 쪽 색이 먼저 바뀌어 버린 겁니다. 이름은 남고 색은 옮겨 갔습니다. | 성경에 나오는 히아신스는 꽃이 아니라 돌 이름입니다 | mythic, funny | — | 근동·유럽 | 고대 | Jacinth (Wikipedia) | https://en.wikipedia.org/wiki/Jacinth | varies |

### 2-9. peony (작약·모란) — 2개 · 기존 10개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 23 | story-peony-three-postures | 서면 작약, 앉으면 모란, 걸으면 백합 | 일본에는 사람의 아름다움을 꽃 세 가지로 나눠 말하는 오래된 표현이 있습니다. 서 있으면 작약, 앉아 있으면 모란, 걷는 모습은 백합. 서 있을 때는 줄기가 곧게 올라오는 초본 작약을, 앉아 있을 때는 옆으로 넓게 퍼지는 목본 모란을, 걸을 때는 흔들리며 따라오는 백합을 떠올린 거예요. 한 사람을 세 가지 꽃으로 나눠 본다는 발상이 재미있습니다. 어느 순간의 그 사람이 가장 그 사람다운지를, 자세마다 다른 꽃으로 적어 둔 셈이니까요. | 일본에는 사람의 자세를 꽃 세 가지로 나눠 부르는 말이 있습니다 | romantic, healing, mythic | confession, just_because | 일본 | 전승 | 立てば芍薬座れば牡丹歩く姿は百合の花 (Wiktionary) | https://en.wiktionary.org/wiki/%E7%AB%8B%E3%81%A6%E3%81%B0%E8%8A%8D%E8%96%AC%E5%BA%A7%E3%82%8C%E3%81%B0%E7%89%A1%E4%B8%B9%E6%AD%A9%E3%81%8F%E5%A7%BF%E3%81%AF%E7%99%BE%E5%90%88%E3%81%AE%E8%8A%B1 | repeated |
| 24 | story-peony-botan-doro | 모란 등롱을 든 여자가 밤마다 찾아왔습니다 | 중국 구우의 괴담집에 있던 이야기가 1666년 아사이 료이의 손을 거쳐 일본으로 건너옵니다. 불교식 훈계는 걷어내고 무대를 에도의 네즈로 옮겼어요. 아내를 잃은 사무라이 오기와라 신노조에게, 오본 무렵 아름다운 여자 오쓰유와 모란 등롱을 든 어린 하녀가 밤마다 찾아옵니다. 그는 금세 빠져듭니다. 그런데 이웃 노인이 창 너머로 훔쳐본 광경이 달랐어요. 그가 안고 있는 건 여자가 아니라 해골이었습니다. 승려가 집에 부적을 붙여 주자 오쓰유는 안으로 들어오지 못하고 밖에서 그를 불렀습니다. 그 목소리를 며칠이나 버텼을까요. 이튿날 아침, 오기와라는 오쓰유의 해골과 뒤엉킨 채 발견됐습니다. 이 이야기는 1884년 라쿠고로, 1892년 7월 가부키자 무대로 올라가며 일본에서 가장 유명한 괴담 중 하나가 됩니다. | 모란 등롱을 든 여자가 밤마다 찾아왔습니다 | tragic, romantic, dramatic | — | 중국·일본 | 14세기~1666 | Botan Dōrō (Wikipedia) | https://en.wikipedia.org/wiki/Botan_D%C5%8Dr%C5%8D | repeated |

### 2-10. hydrangea (수국) — 3개 · 기존 3개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 25 | story-hydrangea-water-vessel | 물을 많이 먹어서 붙은 이름이 아닙니다 | 수국의 학명 히드란게아는 그리스어로 '물'과 '그릇'을 붙여 만든 말입니다. 그대로 옮기면 물 항아리예요. 그래서 다들 이렇게 생각합니다. 물을 워낙 많이 먹는 꽃이라 그런 이름이 붙었구나. 그런데 아닙니다. 이 이름은 물 소비량이 아니라 씨앗 꼬투리의 생김새에서 왔어요. 꽃이 지고 나서 생기는 그 작은 열매가 주둥이가 벌어진 물항아리를 닮았다고 본 겁니다. 정작 이 꽃이 물을 어마어마하게 먹는다는 건 이름과 아무 상관이 없었습니다. 우연히 맞아떨어진 이름이라, 오히려 200년 넘게 아무도 의심하지 않았습니다. | 물을 많이 먹어서 붙은 이름이 아니었습니다 | funny, healing | just_because | 유럽 | 명명~현대 | Hydrangea (Wikipedia) | https://en.wikipedia.org/wiki/Hydrangea | repeated |
| 26 | story-hydrangea-fake-flowers | 예쁜 쪽은 씨를 못 맺는 가짜 꽃입니다 | 수국 꽃송이를 들여다보면 두 종류가 섞여 있습니다. 가장자리의 크고 화려한 것들, 그리고 가운데의 작고 볼품없는 것들. 우리가 수국이라고 부르는 그 크고 예쁜 쪽은 사실 씨를 맺지 못하는 무성화입니다. 꽃잎처럼 보이는 것도 꽃받침이고요. 씨앗을 만드는 진짜 꽃은 가운데에 있는 작은 쪽입니다. 야생 수국은 가장자리에 이 장식용 가짜 꽃이 몇 개만 달려 있어요. 벌을 부르는 간판 정도였던 겁니다. 그걸 사람이 몇백 년에 걸쳐 골라 키운 결과가 지금의 공처럼 둥근 수국입니다. 우리가 사랑한 건 간판 쪽이었고, 그래서 이 꽃은 점점 간판만 남은 모습이 되었습니다. | 우리가 예쁘다고 보는 부분은 씨를 못 맺는 가짜 꽃입니다 | dramatic, mythic, healing | — | 세계 | 현대 | Hydrangea (Wikipedia) | https://en.wikipedia.org/wiki/Hydrangea | repeated |
| 27 | story-hydrangea-annabelle | 말 타고 가다 주운 꽃이 세계로 퍼졌습니다 | 1910년 미국 일리노이주 애나라는 작은 마을 근처, 해리엇 커크패트릭이 말을 타고 숲길을 지나다 걸음을 멈춥니다. 야생 수국 한 그루가 이상할 만큼 크고 둥근 흰 꽃을 달고 있었어요. 그는 나중에 다시 와서 그 그루를 캐다 집 마당에 심었습니다. 이웃들이 보고 탐내자 하나둘 나눠 줬고, 그렇게 이 꽃은 마을을 넘어 다른 마을까지 퍼졌습니다. 50년쯤 지난 1960년 무렵, 일리노이대 J.C. 맥대니얼 교수가 어배너에서 이 꽃을 보고 놀랍니다. 출처를 거슬러 올라가 애나까지 찾아갔고, 1962년 정식으로 세상에 내놓으면서 이름을 붙였어요. '애나벨'. 애나라는 마을 이름에, 그 꽃을 발견한 여자들을 뜻하는 말을 붙인 이름입니다. 지금 세계에서 가장 많이 심는 흰 수국이 이 꽃입니다. | 세계에서 제일 많이 심는 흰 수국은 말 타고 가다 주운 꽃입니다 | healing, romantic, funny | gratitude, just_because | 미국 | 1910~1962 | The 'Annabelle' Hydrangea (Illinois Extension) | https://extension.illinois.edu/blogs/garden-scoop/2019-07-04-annabelle-hydrangea | repeated |

### 2-11. lavender (라벤더) — 3개 · 기존 3개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 28 | story-lavender-gattefosse-truth | 그 유명한 이야기는 본인이 쓴 것과 다릅니다 | 널리 도는 이야기는 이렇습니다. 1910년, 프랑스 화학자 가트포세가 실험실 폭발로 손을 데었는데 마침 옆에 있던 라벤더 오일 통에 손을 푹 담갔더니 씻은 듯이 나았다고요. 우연이 만든 기적처럼 들리죠. 그런데 본인이 남긴 기록은 다릅니다. 폭발로 불붙은 물질을 뒤집어쓴 그는 잔디밭을 구르며 불을 껐고, 그 뒤 두 손에 가스괴저가 빠르게 번졌습니다. 상처는 잘 아물지 않았어요. 그래서 그는 작정하고 라벤더 에센스를 썼습니다. 딱 한 번 헹궜을 뿐인데 조직이 썩어 들어가던 게 멈췄고, 이튿날부터 아물기 시작했다고 적었습니다. 우연히 손을 담근 게 아니라, 판단해서 쓴 겁니다. 그는 이 일을 계기로 정향과 라벤더 같은 정유를 파고들었고, 끝내 '아로마테라피'라는 말을 만들어 1937년 같은 제목의 책을 냈습니다. | 유명한 그 이야기는 본인이 쓴 것과 다릅니다 | dramatic, healing, funny | comfort | 프랑스 | 1910~1937 | Gattefossé's burn (Robert Tisserand) | https://roberttisserand.com/2011/04/gattefosses-burn/ | repeated |
| 29 | story-lavender-lavandin | 사진 속 그 보라색 밭은 대개 다른 꽃입니다 | 프로방스 하면 떠오르는 끝없는 보라색 밭. 그런데 그 밭에 심긴 것은 대개 우리가 '라벤더'라고 부르는 그 종이 아닙니다. 라반딘이라는 잡종이에요. 잉글리시 라벤더와 스파이크 라벤더를 교배해 만든 것으로, 네덜란드 라벤더라고도 부릅니다. 이쪽을 심는 이유는 단순합니다. 수확이 훨씬 쉽거든요. 대신 향이 다릅니다. 캄포를 비롯한 성분이 많아 코를 좀 찌르는 날카로움이 있고, 향의 격으로 치면 잉글리시 라벤더보다 아래로 봅니다. 우리가 사진으로 사랑한 풍경과, 향으로 사랑한 라벤더가 사실은 다른 꽃이었던 셈입니다. | 사진 속 그 보라색 밭은 대개 다른 꽃입니다 | funny, dramatic | just_because | 프랑스·유럽 | 현대 | Lavandula (Wikipedia) | https://en.wikipedia.org/wiki/Lavandula | varies |
| 30 | story-lavender-eat-it | 이 꽃은 민트와 한집안입니다. 그래서 먹습니다 | 라벤더는 꿀풀과 식물입니다. 세이지, 민트, 로즈메리와 같은 집안이에요. 47종이 있고, 향이 강한 건 이 집안 내력입니다. 그래서 이 꽃은 먹기도 합니다. 1970년대에 향신료 도매상들이 만들어 낸 '에르브 드 프로방스' 혼합 허브의 북미판에는 식용 라벤더가 들어갑니다. 꽃봉오리를 설탕에 2주쯤 묻어 두면 정유가 설탕으로 옮겨 붙어 라벤더 설탕이 되고, 그걸로 구운 과자에서는 밭 냄새가 납니다. 꿀도 그렇습니다. 이 꽃은 꿀을 아주 넉넉하게 내서, 벌이 만든 라벤더 꿀은 품질이 높기로 유명해요. 보기만 하는 꽃이 아니라, 부엌으로 들어오는 꽃입니다. | 이 꽃은 민트·세이지와 한집안입니다. 그래서 먹습니다 | funny, healing | just_because | 프랑스·유럽 | 현대 | Lavandula (Wikipedia) | https://en.wikipedia.org/wiki/Lavandula | repeated |

### 2-12. sunflower (해바라기) — 3개 · 기존 4개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 31 | story-sunflower-lent-loophole | 금지 목록에서 빠진 기름 하나 | 해바라기는 아메리카 꽃인데, 어쩌다 러시아가 세계 최대 산지가 됐을까요. 표트르 대제가 네덜란드에서 이 꽃을 보고 러시아로 들여온 게 시작이었습니다. 그다음이 핵심이에요. 러시아 정교회는 사순절 동안 여러 기름과 기름진 음식을 금했고, 신자들이 헷갈리지 않도록 금지 품목 목록까지 만들어 돌렸습니다. 그런데 그 목록에 해바라기 기름이 없었습니다. 새로 들어온 작물이라 아무도 적어 넣지 않은 거예요. 금식 기간에도 마음 놓고 쓸 수 있는 기름이 딱 하나 생긴 셈이었고, 사람들은 거기로 몰렸습니다. 1830년대에는 러시아 스텝에서 상업 규모로 기름을 짜기 시작했고, 19세기 말에는 '매머드 러시안'이라는 이름을 달고 미국 종자 카탈로그에 역수출됐습니다. 오늘날 세계 해바라기유의 30퍼센트가 러시아, 23퍼센트가 우크라이나에서 나옵니다. 목록에서 한 줄이 빠진 결과입니다. | 금지 목록에서 실수로 빠진 기름 하나가 한 나라의 농업을 바꿨습니다 | funny, dramatic, healing | just_because | 러시아 | 18~19세기 | East Meets West in the Sunflower's Golden History (Suttons) / Sunflower oil (Wikipedia) | https://hub.suttons.co.uk/blog/flower-seeds/east-meets-west-in-the-sunflowers-golden-history-by-susie-hall | varies |
| 32 | story-sunflower-burned-five | 고흐의 해바라기 한 점은 사진으로만 남았습니다 | 고흐가 아를에서 그린 해바라기 연작은 처음에 넉 점이었습니다. 청록 배경의 세 송이, 로열블루 배경의 다섯 송이, 푸른 초록 배경의 열두 송이, 노란 배경의 열다섯 송이. 지금 뮌헨과 런던에서 볼 수 있는 것들이 그중 둘입니다. 그런데 로열블루 배경의 다섯 송이는 어디에도 없습니다. 일본 아시야의 한 개인 소장품이었다가, 1945년 8월 6일 공습으로 불타 없어졌거든요. 고흐가 이 그림들을 그린 이유를 생각하면 더 그렇습니다. 그는 곧 함께 살게 될 고갱의 방을 꾸며 주려고 해바라기만 잔뜩 그리겠다고 했어요. 친구를 맞으려고 그린 그림 중 한 점은, 남의 나라 전쟁 속에서 사라졌습니다. | 고흐의 해바라기 한 점은 흑백 사진으로만 남아 있습니다 | tragic, dramatic, healing | comfort | 프랑스·일본 | 1888~1945 | Sunflowers (Van Gogh series) (Wikipedia) | https://en.wikipedia.org/wiki/Sunflowers_(Van_Gogh_series) | repeated |
| 33 | story-sunflower-first-farmers | 4600년 전에 이미 누군가의 밭이었습니다 | 해바라기가 언제부터 사람의 작물이었는지 따져 보면 숫자가 놀랍습니다. 멕시코 타바스코의 산안드레스 유적에서는 기원전 2600년경의 흔적이 나왔고, 미국에서 확인된 가장 이른 완전 재배형은 테네시에서 나온 기원전 2300년경의 것입니다. 켄터키 동부의 바위그늘 유적에도 이른 사례가 있어요. 북아메리카 원주민들에게 이 꽃은 관상용이 아니었습니다. 씨를 갈아 빵을 만들었고, 연고를 만들었고, 염료와 몸에 칠하는 물감을 얻었습니다. 어떤 부족은 이 꽃을 태양신의 표시로 삼았고요. 유럽이 이 꽃을 처음 본 건 훨씬 뒤인 1510년, 스페인 탐험가들이 씨앗을 가져가면서였습니다. 우리가 여름 꽃이라고 부르는 이 꽃은, 4600년 전부터 누군가의 저녁이었습니다. | 이 꽃은 4600년 전에 이미 누군가의 밭이었습니다 | mythic, healing, dramatic | — | 아메리카 | 기원전 2600년~16세기 | Helianthus annuus (Wikipedia) | https://en.wikipedia.org/wiki/Helianthus_annuus | repeated |

### 2-13. carnation (카네이션) — 3개 · 기존 3개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 34 | story-carnation-oxford-exams | 흰색으로 시작해 빨강으로 끝납니다 | 옥스퍼드 학생들은 시험을 보러 갈 때 가운에 카네이션을 답니다. 규칙이 있어요. 첫 시험에는 흰 카네이션, 중간 시험들에는 분홍, 그리고 마지막 시험 날에는 빨강. 의무는 아니고 전통일 뿐인데, 학생들은 대체로 지킵니다. 시험 기간이 며칠씩 이어지는 동안 가슴에 달린 꽃 색만 봐도 저 사람이 어디쯤 왔는지 알 수 있는 셈이에요. 예외도 있습니다. 모들린 칼리지 법학생들은 법학 예비시험 내내 초록 카네이션을 답니다. 끝나가는 걸 색으로 표시하는 방식이, 꽤 다정합니다. | 마지막 시험 날에만 빨간 카네이션을 답니다 | healing, funny, dramatic | celebration, gratitude | 영국 | 현대 | Academic dress of the University of Oxford (Wikipedia) | https://en.wikipedia.org/wiki/Academic_dress_of_the_University_of_Oxford | repeated |
| 35 | story-carnation-green-wilde | "이게 무슨 뜻이죠?" "아무 뜻도 없습니다" | 1892년 2월, 오스카 와일드의 희곡 초연 날이었습니다. 그는 주변 사람들에게 초록 카네이션을 옷깃에 꽂고 오라고 했어요. 초록 카네이션은 자연에 없는 꽃입니다. 흰 카네이션 줄기를 염료에 담가 두면 꽃잎이 초록으로 물드는데, 오래 담글수록 짙어지죠. 누군가 이게 무슨 뜻이냐고 묻자 와일드는 이렇게 답했다고 전해집니다. 아무 뜻도 없다고요. 객석에서 여러 남자가 같은 이상한 꽃을 달고 있고, 사람들이 그게 뭘까 궁금해하는 것. 그 자체가 목적이었던 겁니다. 2년 뒤 익명으로 나온 소설 『초록 카네이션』이 와일드와 그의 친구를 그대로 본떠 쓴 것이라 소동이 났고, 자기가 썼다는 소문이 돌자 와일드는 이렇게 잘랐습니다. 그 꽃은 예술품이지만 그 책은 아니라고요. 이 꽃이 특정한 신호였다는 해석은 후대에 덧붙은 이야기라는 지적이 있습니다. | "이게 무슨 뜻이죠?" "아무 뜻도 없습니다" | funny, dramatic, mythic | just_because | 영국 | 1892~1895 | The Green Carnation (Wikipedia) | https://en.wikipedia.org/wiki/The_Green_Carnation | varies |
| 36 | story-carnation-red-mayday | 5월 1일에 다는 붉은 꽃 | 붉은 카네이션은 오랫동안 노동운동의 꽃이었습니다. 붉은 장미와 나란히 사회주의·사회민주주의·노동운동의 상징으로 쓰였고, 노동절 집회에 늘 등장했어요. 오스트리아와 이탈리아, 옛 유고슬라비아 지역에서는 지금도 5월 1일에 이 꽃을 답니다. 그리고 1974년 포르투갈에서는 이 꽃이 아예 사건의 이름이 됐습니다. 카네이션 혁명. 어버이날에 다는 그 꽃이, 다른 대륙에서는 백 년 넘게 광장의 꽃이었습니다. 같은 꽃 한 송이가 가슴에 달리는 이유는 나라마다 이렇게 다릅니다. | 이 꽃은 백 년 넘게 광장의 꽃이기도 했습니다 | dramatic, mythic, tragic | — | 유럽 | 19~20세기 | Dianthus caryophyllus (Wikipedia) | https://en.wikipedia.org/wiki/Dianthus_caryophyllus | repeated |

### 2-14. lisianthus (리시안셔스) — 3개 · 자료 희소 꽃 보강 · 기존 3개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 37 | story-lisianthus-good-mouth | 이 꽃은 이름을 두 번 얻었고, 두 번 다 생김새였습니다 | 리시안셔스는 이름이 두 개인 꽃입니다. 지금 쓰는 학명 유스토마는 그리스어로 '좋은'과 '입'을 붙인 말이에요. 보기 좋은 입을 가졌다는 뜻입니다. 꽃부리가 벌어진 모양을 입으로 본 거죠. 그런데 지금은 폐기된 옛 속명 리시안투스도 뜻이 있습니다. '매끄러운'과 '꽃'을 붙인 말, 그러니까 매끈한 꽃이라는 뜻이에요. 이 꽃에 이름을 붙인 사람들은 두 번 다 향이나 전설이 아니라 생김새를 말했습니다. 이 꽃에는 붙어 있는 신화가 거의 없는데, 어쩌면 그래서일지도 모릅니다. 다들 보자마자 예쁘다는 말부터 했거든요. | 이 꽃은 이름을 두 번 얻었고, 두 번 다 "예쁘다"는 뜻이었습니다 | healing, mythic, romantic | confession | 세계 | 1806~현재 | Eustoma (Wikipedia) | https://en.wikipedia.org/wiki/Eustoma | repeated |
| 38 | story-lisianthus-five-months | 이 꽃 한 송이는 다섯 달을 기다려 핍니다 | 리시안셔스 씨앗은 먼지처럼 작습니다. 너무 작아서 흙에 묻으면 안 되고 표면에 그냥 뿌려야 해요. 그리고 오래 걸립니다. 씨를 뿌려서 첫 꽃을 보기까지 다섯 달쯤 걸리거든요. 서리가 끝나기 열두 주 전에 실내에서 시작해야 하는 꽃입니다. 그래서 대부분의 사람은 씨앗이 아니라 모종을 삽니다. 기다림을 남에게 맡기는 거죠. 대신 이 꽃은 화병에서 2주에서 3주를 갑니다. 시든 꽃만 떼어 주면 곁봉오리가 이어서 피고요. 다섯 달을 준비해서 3주를 버티는 꽃. 시간의 셈이 조금 짠하지만, 그래서 오래 가는 걸지도 모릅니다. | 이 꽃 한 송이는 다섯 달을 기다려 핍니다 | healing, mythic | anniversary, gratitude | 미국 | 현대 | Eustoma grandiflorum (NC State Extension) | https://plants.ces.ncsu.edu/plants/eustoma-grandiflorum/ | repeated |
| 39 | story-lisianthus-texas-1838 | 텍사스 초원에서 시작해 이름이 두 번 바뀌었습니다 | 이 꽃의 고향은 미국 네브래스카에서 텍사스로 이어지는 대초원입니다. 텍사스 블루벨, 프레리 젠션 같은 이름으로 불렸어요. 식물학자 토머스 드러먼드가 텍사스 산펠리페데오스틴 근처에서 이 들꽃을 기록했고, 1838년 '리시안투스 루셀리아누스'라는 이름으로 발표됩니다. 나중에 속이 정리되면서 지금 학명인 유스토마 루셀리아눔이 됐죠. 그런데 초원의 들꽃이 화병까지 오는 데는 백 년이 더 걸렸습니다. 상업 절화로의 전환은 1930년대 일본에서 시작됐고, 1980년대에 사카타가 F1 계통을 내놓으면서 지금 우리가 아는 리시안셔스가 완성됐어요. 미국 초원에서 나서, 영국 도감에 실리고, 일본 온실에서 다듬어진 꽃입니다. | 미국 초원에서 나서 영국 도감에 실리고 일본 온실에서 완성된 꽃 | dramatic, funny, healing | — | 미국·영국·일본 | 1830년대~1980년대 | The Origin of Lisianthus (Eustoma) (Lisianthus.nl) / Eustoma (Wikipedia) | https://www.lisianthus.nl/news/lisianthus-eustoma-origin | varies |

### 2-15. ranunculus (라넌큘러스) — 2개 · 자료 희소 꽃 보강 · 기존 3개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 40 | story-ranunculus-mirror-petals | 이 꽃잎은 사실 거울입니다 | 미나리아재비 무리의 꽃잎은 유난히 반질거립니다. 특히 노란 것들이 그래요. 이유가 재미있습니다. 꽃잎 윗면이 아주 매끄러워서 거울처럼 빛을 되쏘기 때문이에요. 색소가 진해서가 아니라, 표면이 거울이라서 번쩍이는 겁니다. 이 번쩍임에는 쓸모가 둘 있습니다. 지나가는 곤충의 눈에 확 띄게 만드는 일, 그리고 꽃 한가운데의 생식기관 온도를 올려 주는 일. 어릴 때 이 꽃을 턱 밑에 대 보던 놀이 기억하세요? 노랗게 비치면 버터를 좋아하는 거라고 했던. 그건 버터랑 아무 상관이 없었습니다. 꽃잎이라는 거울이 햇빛을 그대로 턱에 되쏜 것뿐이었어요. | 이 꽃잎은 색이 진한 게 아니라 거울이라서 반짝입니다 | healing, funny, mythic | just_because | 세계 | 현대 | Ranunculus (Wikipedia) | https://en.wikipedia.org/wiki/Ranunculus | repeated |
| 41 | story-ranunculus-persian-prince | 노래를 너무 오래 불러서 꽃이 됐습니다 | 페르시아에 전해지는 이야기가 하나 있습니다. 초록과 금빛 옷을 입은 젊은 왕자가 숲의 님프에게 반했어요. 마음을 말로는 못 하고, 대신 밤낮으로 노래를 불렀습니다. 결말은 두 갈래로 전합니다. 하나는 님프가 끝내 그 마음을 받아 주지 않았고, 왕자는 상심으로 죽었으며 그 자리에 이 꽃이 피어났다는 이야기. 다른 하나는 좀 더 짓궂습니다. 그 노랫소리를 계속 들어야 했던 다른 님프들이 지쳐서, 왕자를 꽃으로 바꿔 버렸다는 거예요. 어느 쪽이든 이 꽃은 대답을 받지 못한 노래에서 왔습니다. 다만 이 이야기는 학술 자료에서는 확인되지 않고 화훼 쪽 자료에서만 반복되니, 오래된 전설로 즐겨 주시면 좋겠습니다. | 노래를 너무 오래 불렀더니 꽃이 되어 버렸다는 왕자 | romantic, tragic, funny | confession | 페르시아 | 전승 | Ranunculus – Symbolism and Meaning (Symbol Sage) | https://symbolsage.com/ranunculus-meaning-and-symbolism/ | single_source |

### 2-16. lily-of-the-valley (은방울꽃) — 3개 · 기존 3개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 42 | story-lotv-impossible-scent | 세상 모든 은방울꽃 향수는 진짜가 아닙니다 | 은방울꽃 향수는 많습니다. 그런데 그중 진짜 은방울꽃에서 뽑아낸 향은 하나도 없어요. 이 꽃에서는 천연 향 추출물을 만들 수 없기 때문입니다. 그래서 이 향은 전부 합성으로 다시 지어낸 것입니다. 1956년 디올이 낸 향수는 하이드록시시트로넬랄이라는 물질로 그 냄새를 재현했는데, 지금은 유럽화학물질청이 피부를 예민하게 만드는 물질로 보아 사용을 제한하고 있습니다. 그러니까 우리가 은방울꽃 향이라고 알고 있는 그 냄새는, 사람이 이 꽃을 흉내 내려고 만들어 낸 냄새입니다. 진짜를 맡으려면 5월에 이 꽃 앞에 서는 수밖에 없어요. | 세상 모든 은방울꽃 향수는 진짜 은방울꽃 향이 아닙니다 | mythic, healing, tragic | — | 프랑스·세계 | 1956~현재 | Lily of the valley (Wikipedia) | https://en.wikipedia.org/wiki/Lily_of_the_valley | repeated |
| 43 | story-lotv-dior | 디자이너가 제일 좋아한 꽃 | 크리스티앙 디올이 가장 좋아한 꽃은 은방울꽃이었습니다. 1956년, 그의 이름을 단 회사는 이 꽃을 흉내 낸 향수를 내놓습니다. 조향은 에드몽 루드니츠카가 맡았어요. 앞에서 말했듯 이 꽃은 향을 뽑아낼 수 없으니, 루드니츠카가 한 일은 사실 '없는 향을 있는 것처럼 짓는 일'이었습니다. 좋아하는 꽃 하나 때문에 향료 화학자가 몇 년을 매달리는 일이 실제로 벌어진 겁니다. 5월 1일이면 프랑스 길에서 한 다발에 몇 유로에 팔리는 이 소박한 꽃이, 파리에서 가장 값비싼 병 안에 들어가 있습니다. | 좋아하는 꽃 하나 때문에 향을 통째로 지어냈습니다 | healing, romantic | gratitude, celebration | 프랑스 | 1956 | Lily of the valley (Wikipedia) | https://en.wikipedia.org/wiki/Lily_of_the_valley | repeated |
| 44 | story-lotv-tchaikovsky | 작곡가가 악보 대신 시를 남긴 꽃 | 차이콥스키는 음악으로 말하는 사람이었습니다. 그런데 이 꽃에는 시를 남겼어요. 1878년 12월, 그는 이탈리아 피렌체에 머물면서 「은방울꽃」이라는 제목의 시를 썼습니다. 러시아어로 란디시. 러시아에서 이 꽃은 짧은 봄에 잠깐 숲 그늘에 나타났다 사라지는 꽃입니다. 고향에서 멀리 떨어진 겨울의 피렌체에서 그가 떠올린 게 하필 그 꽃이었다는 게, 이 이야기에서 제일 좋은 부분입니다. 음악가가 음표로 안 되겠다 싶어 단어를 꺼내 드는 순간이, 인생에 몇 번쯤은 있는 모양입니다. | 음표로는 안 되겠다 싶었던 모양입니다 | healing, romantic, mythic | confession, comfort | 러시아·이탈리아 | 1878 | Lily of the valley (Wikipedia) | https://en.wikipedia.org/wiki/Lily_of_the_valley | repeated |

### 2-17. chrysanthemum (국화) — 3개 · 기존 4개와 무중복

| # | story_id | 제목 | 리텔링 초안 | hook | moods | intents | culture_region | era | source_title | source_url | confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 45 | story-chrysanthemum-double-ninth | 산에 올라간 사람만 살아남았습니다 | 중양절 이야기입니다. 환경이라는 사람이 스승 비장방에게 배우던 중, 스승이 이렇게 일렀습니다. 음력 9월 9일에 국화주와 먹을 것을 챙겨 가족을 데리고 산에 오르라고요. 그는 시킨 대로 했습니다. 저녁에 내려와 보니 집짐승이 전부 죽어 있었어요. 산에 오르지 않았다면 그 자리에 사람이 있었을 겁니다. 『역경』에서 9는 양의 수라, 9가 겹치는 이날은 예로부터 기운이 가장 센 날이자 장수의 날로 여겨졌습니다. 한나라 사람들은 이날 국화주를 마시며 오래 살기를 빌었어요. 그 습관이 이천 년을 이어져, 대만은 1966년 이날을 어르신의 날로 정했습니다. 오래 사시라는 말을 국화에 담아 전하는 날이, 아직 달력에 남아 있습니다. | 산에 올라간 사람만 살아남았다는 날이 아직 달력에 있습니다 | dramatic, mythic, healing | comfort, gratitude | 중국·대만 | 한대~1966 | Double Ninth Festival (Wikipedia) | https://en.wikipedia.org/wiki/Double_Ninth_Festival | repeated |
| 46 | story-chrysanthemum-kikujido | 임금의 베개를 넘은 죄로 800년을 살았습니다 | 일본 노(能)의 〈마쿠라지도〉, 베개의 지도라는 작품입니다. 지도는 주나라 목왕을 모시던 어린 시동이었어요. 어느 날 임금의 베개를 넘는 큰 실수를 저질러 죽을 뻔하다, 간신히 목숨만 건져 깊은 산으로 유배됩니다. 그런데 임금은 그 베개에 법화경 구절을 새겨 몰래 들려 보냈어요. 매일 외우라고요. 지도는 그 구절을 국화 잎에 옮겨 적었습니다. 그러자 그 잎에 맺힌 이슬이 불로장생의 약이 되었습니다. 그는 늙지 않은 채로 800년을 살았습니다. 그동안 왕조가 몇 번이나 바뀌었고, 지도는 그저 산에서 국화 이슬을 받아 마시고 있었죠. 벌로 보낸 곳에서 벌보다 오래 살아남은 아이의 이야기입니다. | 임금의 베개를 넘은 죄로 유배된 아이가 800년을 살았습니다 | mythic, healing, romantic | comfort | 중국·일본 | 전승 | Makura-Jidō (the-noh.com) | https://www.the-noh.com/en/plays/data/program_085.html | varies |
| 47 | story-chrysanthemum-oldest-herb | 3500년 전에는 꽃이 아니라 약초였습니다 | 국화가 사람 곁으로 온 건 아주 오래전입니다. 기원전 15세기 중국에서 '꽃 피는 약초'로 재배되기 시작했다고 하니, 3500년쯤 됐어요. 감상용이 아니라 몸에 쓰는 풀이었던 겁니다. 한나라 때는 중양절에 오래 살라고 국화주를 마셨고, 도시 이름에까지 들어갔습니다. 중산 샤오란에는 '국화의 도시'라는 뜻의 옛 이름이 남아 있어요. 지금도 이 꽃은 먹는 쪽으로 살아 있습니다. 흰 국화나 노란 국화를 끓여 차로 마시고, 잎은 데쳐서 나물로 먹습니다. 우리가 화병에 꽂는 이 꽃은, 원래 약장과 밥상 쪽에 먼저 있던 식물이었습니다. | 이 꽃은 감상용이기 전에 3500년 된 약초였습니다 | healing, mythic | comfort | 중국 | 기원전 15세기~현재 | Chrysanthemum (Wikipedia) | https://en.wikipedia.org/wiki/Chrysanthemum | repeated |

---

## 3. 기존 데이터와의 관계 — 중복 점검과 정정

### 3-1. 기존 89행과의 중복 점검 결과

`content/stories.csv` 89행의 `story_id`·`title`·`culture_region` 을 전수 대조했습니다. **소재가 겹치는 건 0건**입니다. 다만 **인접해서 적재 시 판단이 필요한 6쌍**이 있습니다.

| 신규 | 기존 인접 행 | 무엇이 다른가 | 권고 |
|---|---|---|---|
| `story-lily-florence-color-flip` | `story-lily-clovis-fleurdelis` | 기존은 "프랑스 왕가의 백합이 사실 붓꽃"이 결정타. 신규는 **정치적 색 반전**이 주인공이고 붓꽃은 마지막 한 줄 | 둘 다 적재 가능. 다만 같은 결과 화면에 동시 노출되지 않게 할 것(반전이 반복되면 김이 샘) |
| `story-gerbera-hundreds-in-one` | `story-gerbera-model-organism` | 기존은 "거베라가 실험실 모델 생물이다". 신규는 **두상화 구조 자체**(수백 낱꽃·피보나치 나선) | 소재는 인접하나 훅이 다름. **둘 중 하나만 실을 거라면 신규 쪽 권장**(hook 이 선물 맥락에 바로 붙음) |
| `story-sunflower-burned-five` | `story-sunflower-van-gogh` | 같은 연작이지만 기존은 "고갱 방 꾸미기", 신규는 **1945년 소실** | 동시 노출 금지. 정서가 정반대(따뜻함 ↔ 상실) |
| `story-carnation-red-mayday` | `story-carnation-revolution` | 기존은 1974년 포르투갈 사건 하나. 신규는 **노동절 상징의 백 년 계보** | 신규 본문에 포르투갈이 한 줄 들어가므로, 동시 노출 금지 |
| `story-ranunculus-mirror-petals` | `story-ranunculus-butter-chin` | 기존은 턱밑 놀이 전승. 신규는 **그 놀이의 물리적 정답** | **오히려 세트로 붙이면 좋음**(전승 → 해답 순서). 다만 신규 본문 마지막 문장이 기존과 겹치므로 적재 시 한 줄 다듬을 것 |
| `story-hyacinth-2000-from-one` | `story-hyacinth-bubble-1737` | 기존은 1737년 히아신스 거품. 신규는 **품종 수 2천**이라는 사실 | 인접하지만 충돌 없음. 오히려 거품 이야기의 배경 설명이 됨 |

### 3-2. 이전 조사의 판단을 **정정**해야 하는 항목 2건

| 항목 | 이전 판단 | 이번 확인 | 조치 |
|---|---|---|---|
| 리시안셔스 속명 어원(Eustoma = '아름다운 입') | `docs/catalog-expansion-research.md` §8 이 "상업 블로그에서만 반복되고 위키피디아·NC State 본문에 없다"며 **제외** | **영문 위키피디아 Eustoma 본문에 어원이 실려 있습니다.** eu(좋은)+stoma(입), 그리고 폐기된 옛 속명 Lisianthus 는 lissós(매끄러운)+ánthos(꽃) | 제외 해제. `story-lisianthus-good-mouth`(37번)로 채택, confidence `repeated` |
| 알렉산더 대왕 헬레보어 중독설 | `docs/story-research.md` §4-4 가 "Helleborus 위키 본문에서 확인되지 않는다"며 **제외** | **Helleborus 문서가 아니라 Veratrum album(흰 헬레보어) 문서에 있습니다.** 2013년 가설로, 12일에 걸친 증상 경과가 이 식물의 중독 양상과 맞는다는 내용 | 제외 해제. 단 "진짜 헬레보어가 아니었다"는 반전과 묶어 `story-hellebore-white-is-not`(19번)으로 채택, confidence `varies` |

### 3-3. `docs/catalog-expansion-research.md` §8 의 "다음 확장 1순위" 해소

> 국화 **중양절**(비장방·환경 설화, 국화주와 등고) — 자료는 확인됐고 이야기도 좋지만, 국화가 이미 4편이라 보류. **다음 확장 1순위**

→ `story-chrysanthemum-double-ninth`(45번)로 이번에 채웠습니다. 대만의 1966년 경로의 날 지정까지 붙여, 어버이날·어르신 선물 맥락(`gratitude`)에 바로 쓸 수 있게 했습니다.

---

## 4. 열람 실패로 인용하지 않은 URL (13건)

| URL | 결과 | 처리 |
|---|---|---|
| https://en.wikipedia.org/wiki/Ren%C3%A9-Maurice_Gattefoss%C3%A9 | 404 (해당 표제어 없음) | 로버트 티서랜드의 검증 글로 대체. **오히려 더 나은 결과** — 통설과 본인 기록의 차이를 짚은 글이라 28번의 반전이 여기서 나왔습니다 |
| https://en.wikipedia.org/wiki/Green_carnation | 404 | `The Green Carnation`(소설) 문서로 대체 |
| https://lgbthistoryuk.org/wiki/Green_carnation | 403 Forbidden | 위와 동일하게 대체 |
| https://en.wikipedia.org/wiki/Florists%27_flower | 404 | 라넌큘러스의 "18~19세기 영국 플로리스트 협회 경연 꽃" 계열을 **본문에서 통째로 뺐습니다**(라넌큘러스가 2편에 그친 직접 원인) |
| https://en.wikipedia.org/wiki/Coat_of_arms_of_Florence | 404 | `Flag of Florence` 문서로 대체 |
| https://iranprimer.usip.org/blog/2013/apr/23/... | SSL 인증서 만료 | 이란 튤립은 `Emblem of Iran` 위키 문서로 대체. 카르발라 전승은 이 문서에 없어 **본문에서 뺐고**, 위키가 실제로 적은 "나라를 위해 죽은 젊은이의 무덤에 붉은 튤립이 핀다"는 전승까지만 썼습니다 |
| https://www.fragrantica.com/news/Freesia-... | 403 Forbidden | The Perfume Society 로 대체. 다만 '뮤트 플라워(mute flower)'라는 용어와 헤드스페이스 기술 설명은 확인 실패라 **본문에서 뺐습니다** |
| https://hortuscamden.com/plants/view/eustoma-russellianum-hook-gdon | 403 Forbidden | 리시안셔스의 '베드퍼드 공작 헌정' 대목을 **본문에서 뺐습니다**(§6-1 후속 항목) |
| https://en.wikipedia.org/wiki/Lavandula_%C3%97_intermedia | 404 | `Lavandula` 본문의 라반딘 서술로 대체. "프로방스 밭 대부분이 라반딘"이라는 비율 수치는 확인 실패라 **수치 없이** 썼고 confidence `varies` |
| https://www.npr.org/sections/thesalt/2012/01/05/144695733/... | 타임아웃(60초) | 러시아 해바라기는 Suttons 원예 아카이브 + `Sunflower oil` 위키(생산 통계)로 대체 |
| https://contextualchinese.com/百合 | 403 Forbidden | 위키낱말사전 `百合`·`百年好合` 두 표제어로 대체. **더 나은 대체** — 어원과 혼례 상징이 사전 표제어에 함께 실려 있었습니다 |
| https://asia-archive.si.edu/.../LP23WS1-Symbolism-in-Cloisonne-FA3.pdf | PDF 본문 추출 실패(2.1MB, 텍스트 레이어 없음) | 위와 동일하게 대체 |
| https://en.wikipedia.org/wiki/Kaidan_botan_d%C5%8Dr%C5%8D | 200이지만 줄거리 서술이 없음 | 원전 문서 `Botan Dōrō` 로 대체 |

### 4-1. 내용 부재를 확인한 URL (본문 근거로 쓰지 않았고, 대체 판단의 근거가 된 것들)

| URL | 확인한 부재 |
|---|---|
| https://en.wikipedia.org/wiki/Sunflower_oil | 러시아 정교회 사순절 관련 서술 **없음**. 생산 통계(러시아 30%·우크라이나 23%, 2022)만 인용 |
| https://en.wikipedia.org/wiki/Rosa_chinensis | 네 그루 씨장미의 연도·이름 **없음** → `Garden roses` 문서로 이동 |
| https://en.wikipedia.org/wiki/Ranunculus_asiaticus | 오스만 유입사·플로리스트 경연 서술 **없음** |
| https://en.wikipedia.org/wiki/Hydrangea_arborescens | 'Annabelle' 발견 경위 **없음**(RHS 상 언급뿐) → 일리노이대 Extension 으로 이동 |
| https://en.wikipedia.org/wiki/Gerbera | 린치·케임브리지 교배 서술 **없음**. 절화 세계 5위 순위만 확인 |
| https://en.wikipedia.org/wiki/Freesia | 향 추출 불가·화학 성분 서술 **없음**. 명명(1866 에클론, 프리드리히 프레제 1795~1876)은 기존 이야기가 이미 사용 중 |
| https://en.wikipedia.org/wiki/Lilium_'Stargazer' | 우드리프의 재정 문제 서술 **없음** → 블로그 출처로 보완하고 confidence `varies` |

---

## 5. 명예·정확성 프레이밍이 필요한 이야기 (적재 전 필독)

| 이야기 | 이슈 | 권고 |
|---|---|---|
| 35번 `story-carnation-green-wilde` | 위키 본문이 **"초록 카네이션이 동성애자를 알아보는 표식이었다는 설은 근거 없는 후대의 창작"** 이라고 명시합니다. 실존 인물이 소재이고, 사후 명예와 직결됩니다 | confidence `varies`. **리텔링 마지막 문장의 "후대에 덧붙은 이야기라는 지적이 있습니다"를 절대 빼지 말 것.** 어떤 화면에서도 이 꽃을 특정 정체성의 기호로 단정하지 말 것 |
| 9번 `story-lily-stargazer-woodriff` | 우드리프의 재정 손실·파트너의 특허 판단 실수는 위키가 아니라 블로그 서술입니다. 실존 인물(1910~1997)과 실존 회사가 소재 | confidence `varies`. **파트너 개인·회사명은 본문에서 뺐습니다**(현재 "함께 일하던 파트너"로만 표기). 이 익명 처리를 유지할 것 |
| 5번 `story-tulip-iran-martyr` | 현대 국가의 정치 상징이 소재입니다. 특정 정권·전쟁에 대한 평가로 읽히면 안 됩니다 | 위키가 적은 **전승과 국장 도안 사실까지만** 서술했고 1980~88년 전쟁 서술은 넣지 않았습니다. 이 선을 유지할 것 |
| 41번 `story-ranunculus-persian-prince` | 학술 출처가 없고 화훼 사이트 계열에서만 반복됩니다 | confidence `single_source`. **본문 마지막의 "화훼 쪽 자료에서만 반복되니 오래된 전설로 즐겨 주세요"를 유지할 것.** §1.5d 라벨은 "드물게 전해지는 이야기예요" |
| 46번 `story-chrysanthemum-kikujido` | 노(能) 공식 DB 한 곳에서 확인. 800년/700년 등 판본마다 숫자가 갈립니다 | confidence `varies`. 본문은 the-noh.com 이 적은 800년을 씀 |
| 31번 `story-sunflower-lent-loophole` | 종교 규범이 소재입니다. 조롱조로 읽히면 안 됩니다 | "실수로 빠졌다"가 아니라 **"새로 들어온 작물이라 아무도 적어 넣지 않았다"**로 서술했습니다. 이 표현을 유지할 것 |
| 13번 `story-gerbera-25000-tries` | 업계 아카이브 한 곳에서만 확인(3,000회·25,000그루) | confidence `varies`. 회사명은 본문에서 뺐습니다 |
| 19번 `story-hellebore-white-is-not` | 알렉산더 대왕 사인은 2013년 **가설**입니다 | 본문에 "가설이 나왔습니다"로 명시했습니다. 단정형으로 고치지 말 것 |

---

## 6. 수집했으나 제외한 것

| 후보 | 제외 사유 |
|---|---|
| 라넌큘러스 **18~19세기 영국 플로리스트 협회 경연 꽃** | 위키 `Florists' flower` 404, `Ranunculus asiaticus` 본문에도 서술 없음. 소재는 아주 좋으니 후속 조사 1순위 |
| 리시안셔스 **'루셀리아눔'이 베드퍼드 공작 헌정** | 커티스 『보태니컬 매거진』 3626번 도판 제목이 근거인데, 확인 가능한 페이지가 전부 403이었습니다. 39번 본문에서 뺐습니다 |
| 프리지아 **'뮤트 플라워' 용어와 헤드스페이스 기술** | 용어 출처(Fragrantica) 403. 7번은 "아무도 성공하지 못했다"까지만 씀 |
| 튤립 **카르발라·후세인의 피에서 튤립이 피었다는 전승** | `Emblem of Iran` 본문에 없음. 5번에서 뺐습니다 |
| 라벤더 **프로방스 재배 면적 중 라반딘 비율** | 수치 확인 실패. 29번은 수치 없이 서술 |
| 해바라기 **체르노빌·후쿠시마 제염 실험** | 효과가 미미했다는 후속 연구까지 포함해야 정직한데, 그러면 이야기 톤(§1.5d)에 얹기 어려움. 도감 팁 후보 |
| 수국 **조지프 뱅크스의 큐 가든 도입(1789)** | `Hydrangea` 본문에 유럽 도입사 서술 자체가 없음 |
| 히아신스 **오스만 정원 4대 꽃(장미·튤립·히아신스·카네이션)** | 확인 가능한 출처를 못 찾음. 오스만 후기는 이번에도 못 열었습니다 |
| 거베라 **파란 거베라는 전부 염색** | 사실로 널리 통하나 위키·SANBI·NC State 어디에도 없음. 상업 블로그만 반복 |
| 아네모네 **르네상스 십자가 그림의 아네모네** | 1차 조사에서 미해결로 남긴 항목. 이번에도 미술관·학술 출처를 못 열었습니다 |
| 은방울꽃 **핀란드 국화 / 케이트 미들턴 부케** | 후자는 위키에 있으나 이야기로서 얇음(1차 판단 유지) |
| 국화 **제충국(피레트럼) 살충제** | *Chrysanthemum cinerariifolium* 으로 절화 *C. morifolium* 과 종이 다름. 종 차이를 설명하느라 이야기가 무거워져 보류 |
| 장미 **로자리오(rosary) 어원이 장미 화관** | 어원 자료 열람 실패 |
| 튤립 **야생 튤립 멸종 위기** | `Tulip` 본문에 보전 등급 서술 없음 |

### 6-1. Advisor 판단이 필요한 후속 항목

1. **`안개꽃류`(Gypsophila, 안개꽃)는 `content/flowers.csv` 17종에 없습니다.** 브리프의 "자료 희소 꽃 각 2개+" 목록에 들어 있었지만, 카탈로그에 없는 꽃이라 이번 문서에서는 한 편도 수집하지 않았습니다. 신규 꽃 담당 worker 의 범위인지 확인이 필요합니다.
2. **`story_type = original` 은 이번에도 0건입니다.** 47편 전부 `folklore`(6) · `history`(38) · `literary`(3) 입니다. §1.5f 가 허용한 dearbloom 창작 이야기를 실을지는 편집 판단이라 손대지 않았습니다.
3. **`intents` 가 빈 값(`—`)인 이야기가 8편**입니다(2·6·17·19·22·24·26·33·36번 중 일부). 전천후로 붙일 수 있다는 뜻이지만, 추천 엔진이 intent 기반으로 필터링한다면 실제로 어떻게 동작하는지 확인이 필요합니다.
4. **꽃별 편차가 커졌습니다.** 이번 47편을 다 실으면 작약 12 · 튤립 13 · 장미 11 이 되고 라넌큘러스 5 · 프리지아 7 입니다. 결과 화면이 꽃당 1~2편만 노출한다면 문제없지만, 도감이 전량 노출한다면 상위 꽃의 스크롤이 매우 길어집니다.
5. **3-1 표의 6쌍은 "동시 노출 금지" 규칙이 필요합니다.** 특히 해바라기(고갱 방 ↔ 소실)와 카네이션(포르투갈 ↔ 노동절)은 정서가 충돌합니다. 데이터 레이어에 `exclusive_group` 같은 컬럼을 둘지, 아니면 노출 로직에서 처리할지 판단이 필요합니다.
6. **라넌큘러스만 2편에 그쳤습니다.** 브리프의 최소치(2)는 채웠지만 다른 희소 꽃(거베라 3·리시안셔스 3)보다 얕습니다. §6 의 "플로리스트 협회 경연" 자료를 열 수 있으면 한 편 더 나옵니다.
7. **`story-lisianthus-good-mouth` 채택은 `docs/catalog-expansion-research.md` §8 의 제외 판단을 뒤집는 것**입니다(§3-2). 그 문서를 고칠지, 이 문서의 정정 기록으로 갈음할지 판단이 필요합니다.
