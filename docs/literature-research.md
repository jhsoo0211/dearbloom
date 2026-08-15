# 문학 연계 리서치 — 꽃별 시·소설·희곡 발췌 (§1.5k)

> 작성 2026-08-15 · 리서치 worker · **이 문서는 적재 대상이 아니라 적재 지시서다.** quotes.csv 적재는 별도 worker가 §3 항목 블록의 필드를 그대로 옮겨 수행한다.
> 근거 스펙: `docs/design-spec.md` §1.5k(문학 연계) · §1.5e(절제 — 화면당 1개, 검증된 인용만) · §1.5d(이야기 톤) · §1.5f(문화권 무제한)

---

## 1. 요약

| 항목 | 결과 |
|---|---|
| 확정 적재 행 | **43행** (§3 본표) — 원문 발췌 42편 + 소개문 1편(㊴ 소세키) |
| 원전 기준 | 42종 (㊵·㊶이 밀턴 「리시다스」 같은 문단의 인접 두 행) |
| 보류·확인필요 | 3편 (§4) |
| 꽃 커버 | **26종 / 31종** (미커버 5종: freesia · gerbera · babys-breath · poinsettia · ranunculus) |
| 유형 분포 | poem 27 · classic 7 · play 5 · essay 2 · novel 2 |
| 언어권 분포 | 영어 18 · 한국(한글 5 + 한시·시조 2) 7 · 한문(중국) 6 · 일본어 4 · 라틴어 3 · 영역 경유(히브리·그리스어 2, 페르시아어 1) 3 · 독일어 1 · 스코트어 1 |
| 라이선스 | pd 43 / original 0 (자체 번역·자체 현대어 표기는 dearbloom 저작이므로 `translator` 필드로 표시하고, license 자체는 원전 기준 pd) |
| 제외 처리 | 12건 (§5) |

### 하이라이트 3편

1. **`q-lit-peony-shijing`** — 『시경』 정풍 「진유」의 마지막 구 **"贈之以勺藥"(그에게 작약을 건넨다)**. 기원전 봄날 강가에서 남녀가 서로 놀리다가 작약을 꺾어 건네는 장면. **기록으로 남은 가장 오래된 '꽃 선물' 장면 중 하나**로, 서비스의 존재 이유 자체와 정확히 겹친다. 랜딩 인용 밴드 1순위 후보.
2. **`q-lit-camellia-kimyujeong`** — 김유정 「동백꽃」(1936)의 **"알싸한, 그리고 향긋한 그 냄새에 나는 땅이 꺼지는 듯이 온 정신이 고만 아찔하였다."** 발췌문 안의 **"노란 동백꽃"** 이 곧 각주가 된다 — 강원 방언에서 동백나무는 생강나무(*Lindera obtusiloba*)를 가리켜, 이 소설의 동백꽃은 카탈로그의 *Camellia japonica* 가 아니다. §1.5d 이야기 톤 각주로 그대로 옮길 수 있는 재료.
3. **`q-lit-hyacinth-ovid`** — 오비디우스 『변신 이야기』 10권, 아폴론이 죽은 히아킨토스를 꽃으로 바꾸며 **꽃잎에 제 탄식 "AI AI"를 새겨 넣는** 장면. 기존 `story-hyacinth-apollo`(원반 설화)의 결말이 실제 2천 년 전 원문으로 확인되는 구조 — 이야기와 발췌가 같은 화면에서 이어진다.

---

## 2. 저작권 판정 기준 (전 항목 공통)

### 2-1. PD 판정 규칙

- **한국 기준**: 저작재산권은 저작자 사후 70년. 단 2013-07-01 개정 이전에 이미 만료된 저작물은 되살아나지 않으므로, **1962년 이전(1963년 미만) 사망한 저작자의 저작물은 만료 = PD**다. 1963년 이후 사망자는 사망 다음 해 1월 1일부터 70년.
  - 근거: [한국저작권위원회 — 저작재산권의 보호기간](https://www.copyright.or.kr/information-materials/common-sense/basic-knowledge/index.do?jspName=08) · [퍼블릭 도메인 (한국어 위키백과)](https://ko.wikipedia.org/wiki/%ED%8D%BC%EB%B8%94%EB%A6%AD_%EB%8F%84%EB%A9%94%EC%9D%B8)
- 각 항목의 `pd_basis` 필드에 **저작자 몰년과 판정 근거**를 개별로 적었다. 몰년이 불확실하거나 판본 저작권이 걸리는 건은 §4·§5로 뺐다.

### 2-2. 번역 금지선 (가장 중요)

> **원문이 PD여도 기존 한국어 번역문은 별도 저작물이다. 어떤 경우에도 복사하지 않는다.**

- 본 문서의 모든 한국어 번역·현대어 표기는 **리서치 worker가 이 문서에서 직접 작성한 것**이며, 어떤 출판 번역서·웹 번역도 참조·전사하지 않았다.
- 적재 시 `translator` 필드에 `dearbloom` 을 남긴다. 화면 표기는 §1.5d 톤 각주로 "옮김: dearbloom" 수준이면 충분하다.
- 특히 위험한 3종:
  - **성경 한국어 번역본**(개역한글·개역개정·새번역 등) — 대한성서공회 저작권. **인용 절대 금지.** 본 문서는 KJV 영문에서 자체 번역했다.
  - **셰익스피어 한국어 번역본**(최재서·신정옥·이상섭 등) — 역자 저작권 생존. 자체 번역 필수.
  - **한시 번역** — 국립중앙박물관·학술서 번역문이 웹에 널리 떠 있다. 김정희 「수선화」의 경우 검색으로 노출되는 한국어 풀이가 국립중앙박물관 2006년 간행물 번역이라 **그 문장은 쓰지 않고 원문 한자에서 새로 옮겼다.**

### 2-3. 발췌 길이 제한

- 시: 2~6행 · 산문: 2~3문장 · 하이쿠·시조·와카: 1수 전체(형식상 분할 불가, 분량 자체가 2~3행)
- 전문 게재 금지. 본표의 발췌는 모두 이 한도 안에 있다.

### 2-4. 판본 저작권 함정 (원문 PD ≠ 그 판본 PD)

| 사례 | 처리 |
|---|---|
| 에밀리 디킨슨 | 1890/1891 초판(Todd·Higginson 편)만 사용. **Johnson(1955)·Franklin(1998) 판본은 편집 저작권 존속** — 대시·대문자 표기가 다르므로 초판 표기를 그대로 옮긴다 |
| KJV 성경 | 영국 내에서는 Crown copyright(영구, Letters Patent). **영국 밖에서는 PD**이며 베른협약이 Crown copyright를 인정하지 않는다. 한국 서비스이므로 사용 가능하되 `editorial_note`에 사실을 남긴다 |
| 「茉莉花」 민요 | 전승 가락은 PD지만 **현행 가사는 1957년 何仿(허팡, 2013년 사망) 정리본** — 보류(§4-3) |
| 김영랑·한용운 | 위키문헌 원문은 1930년대 표기. 발췌문은 **원문 표기**를 `text_original`에, **자체 현대어 표기**를 `text_ko`에 넣는다(맞춤법 현대화는 새 번역이 아니라 표기 정리이므로 문제없음) |

### 2-5. 출처 확인 방식 표기

각 항목의 `확인` 필드:

- **`직접열람`** — WebFetch로 해당 URL을 실제로 열어 본문을 확인
- **`검색확인`** — 검색 결과에서 원문 문자열과 출처를 확인(URL 본문 직접 열람은 미실시)
- 적재 worker는 **`검색확인` 항목의 URL을 한 번 더 열어 대조**한 뒤 적재할 것. `직접열람` 항목은 그대로 옮겨도 된다.

---

## 3. 본표 — 확정 43행

### 3-0. 인덱스

| # | quote_id | flower_id | type | author | era | license | 확인 |
|---|---|---|---|---|---|---|---|
| 1 | q-lit-rose-burns | rose-red | poem | 로버트 번스 | 1794 | pd | 검색확인 |
| 2 | q-lit-rose-rilke | rose-red | poem | 라이너 마리아 릴케 | 1925 | pd | 검색확인 |
| 3 | q-lit-rose-romeo | rose-red | play | 윌리엄 셰익스피어 | 1597 | pd | 검색확인 |
| 4 | q-lit-rose-hanyongun | rose-red | poem | 한용운 | 1926 | pd | 직접열람 |
| 5 | q-lit-tulip-rubaiyat | tulip-white | poem | 오마르 하이얌 / 에드워드 피츠제럴드 | 1859 | pd | 검색확인 |
| 6 | q-lit-lily-matthew | lily-asiatic | classic | 마태복음(KJV) | 1611 | pd | 검색확인 |
| 7 | q-lit-lily-blake | lily-asiatic | poem | 윌리엄 블레이크 | 1794 | pd | 출처열람 |
| 8 | q-lit-lily-tennyson | lily-asiatic | poem | 알프레드 테니슨 | 1855 | pd | 검색확인 |
| 9 | q-lit-anemone-ovid | anemone | classic | 오비디우스 | 8년경 | pd | 직접열람 |
| 10 | q-lit-hellebore-burton | hellebore | essay | 로버트 버튼 | 1621 | pd | 검색확인 |
| 11 | q-lit-hyacinth-ovid | hyacinth | classic | 오비디우스 | 8년경 | pd | 직접열람 |
| 12 | q-lit-peony-shijing | peony | classic | 『시경』 정풍 「진유」 | BC 11~6c | pd | 검색확인 |
| 13 | q-lit-peony-kimyeongrang | peony | poem | 김영랑 | 1934 | pd | 검색확인 |
| 14 | q-lit-peony-libai | peony | poem | 이백 | 743년경 | pd | 검색확인 |
| 15 | q-lit-hydrangea-baijuyi | hydrangea | poem | 백거이 | 822~824 | pd | 검색확인 |
| 16 | q-lit-lavender-walton | lavender | essay | 아이작 월턴 | 1653 | pd | 검색확인 |
| 17 | q-lit-lavender-dillydilly | lavender | poem | 전승 동요(영국) | 1672~1679 | pd | 검색확인 |
| 18 | q-lit-sunflower-blake | sunflower | poem | 윌리엄 블레이크 | 1794 | pd | 출처열람 |
| 19 | q-lit-sunflower-yundongju | sunflower | poem | 윤동주 | 1938 | pd | 직접열람 |
| 20 | q-lit-carnation-winterstale | carnation | play | 윌리엄 셰익스피어 | 1611 | pd | 직접열람 |
| 21 | q-lit-lisianthus-dickinson | lisianthus | poem | 에밀리 디킨슨 | 1890 | pd | 검색확인 |
| 22 | q-lit-lotv-songofsongs | lily-of-the-valley | classic | 아가(KJV) | 1611 | pd | 검색확인 |
| 23 | q-lit-chrysanthemum-leejeongbo | chrysanthemum | poem | 이정보 | 18c | pd | 검색확인 |
| 24 | q-lit-chrysanthemum-taoyuanming | chrysanthemum | poem | 도연명 | 5c초 | pd | 검색확인 |
| 25 | q-lit-narcissus-ovid | narcissus | classic | 오비디우스 | 8년경 | pd | 직접열람 |
| 26 | q-lit-narcissus-wordsworth | narcissus | poem | 윌리엄 워즈워스 | 1815 | pd | 검색확인 |
| 27 | q-lit-narcissus-kimjeonghui | narcissus | poem | 김정희 | 1840년대 | pd | 직접열람 |
| 28 | q-lit-forgetmenot-coleridge | forget-me-not | poem | 새뮤얼 테일러 콜리지 | 1802 | pd | 검색확인 |
| 29 | q-lit-cherry-narihira | cherry-blossom | poem | 아리와라노 나리히라 | 905년경 | pd | 검색확인 |
| 30 | q-lit-cherry-basho | cherry-blossom | poem | 마쓰오 바쇼 | 1688 | pd | 검색확인 |
| 31 | q-lit-camellia-sushi | camellia | poem | 소식 | 11c | pd | 검색확인 |
| 32 | q-lit-camellia-kimyujeong | camellia | novel | 김유정 | 1936 | pd | 직접열람 |
| 33 | q-lit-violet-hamlet | violet | play | 윌리엄 셰익스피어 | 1601 | pd | 검색확인 |
| 34 | q-lit-violet-wordsworth | violet | poem | 윌리엄 워즈워스 | 1800 | pd | 검색확인 |
| 35 | q-lit-iris-isemonogatari | iris | classic | 『이세 이야기』 9단 | 10c | pd | 검색확인 |
| 36 | q-lit-iris-winterstale | iris | play | 윌리엄 셰익스피어 | 1611 | pd | 직접열람 |
| 37 | q-lit-marigold-winterstale | marigold | play | 윌리엄 셰익스피어 | 1611 | pd | 직접열람 |
| 38 | q-lit-poppy-mccrae | corn-poppy | poem | 존 매크레이 | 1915 | pd | 검색확인 |
| 39 | q-lit-poppy-soseki | corn-poppy | novel | 나쓰메 소세키 | 1907 | pd | 검색확인 |
| 40 | q-lit-jasmine-lycidas | jasmine | poem | 존 밀턴 | 1638 | pd | 검색확인 |
| 41 | q-lit-pansy-lycidas | pansy | poem | 존 밀턴 | 1638 | pd | 검색확인 |
| 42 | q-lit-cosmos-yundongju | cosmos | poem | 윤동주 | 1938 | pd | 직접열람 |
| 43 | q-lit-magnolia-wangwei | magnolia | poem | 왕유 | 8c | pd | 검색확인 |

> **적재는 43행 그대로 한다.** 원전 기준으로 42종인 것은 40·41번(밀턴 「리시다스」)이 **같은 문단의 인접 행을 재스민·팬지로 나눠 쓴 것**이기 때문이며, 그 사실은 두 항목의 `editorial_note`에 남겼다. 39번(소세키)만 발췌가 아니라 소개문이다.

---

### 3-1. 필드 규격 (적재 worker가 그대로 옮길 것)

기존 `content/quotes.csv` 컬럼:

```
quote_id,text_ko,author,source_title,source_url,license,era,tags,reviewed_at
```

**§1.5k 확장으로 추가할 컬럼 (권장 순서)**:

| 컬럼 | 값 | 비고 |
|---|---|---|
| `flower_id` | flowers.csv id 또는 공란 | §1.5k 명시. 공란이면 기존 3행처럼 꽃 비연동 인용 |
| `excerpt_type` | `poem` \| `novel` \| `play` \| `essay` \| `classic` | §1.5k는 poem/novel/play/essay 4종만 적었으나, 『시경』·오비디우스·성경처럼 어느 갈래로도 안 떨어지는 원전이 6건 있어 **`classic` 추가를 제안**한다. Advisor 승인 필요 — 반려 시 오비디우스·『시경』은 `poem`, 성경·『이세 이야기』는 `essay`로 접는다 |
| `text_original` | 원어 원문 | §1.5e 목 데이터가 이미 "원문 소형 병기: Earth laughs in flowers" 형태를 확정했으므로 컬럼으로 승격. 한국어 원전은 옛 표기 원문을 넣는다 |
| `translator` | `dearbloom` 또는 공란 | 자체 번역·자체 현대어 표기 표시. 한국어 원전 그대로면 공란 |
| `pd_basis` | 판정 근거 1줄 | 데이터 레이어 전용(화면 비노출). §1.5d 원칙대로 화면에는 안 나간다 |

`tags`는 기존 3행 관례(`apology|comfort` 등)를 따르되, 엔진 intent 어휘와 맞춘다:
`just_because · confession · anniversary · gratitude · comfort · celebration · apology` (stories.csv 실사용 어휘) + 기존 quotes.csv가 쓰던 `remembrance · sincere`.

`era` 표기는 **발표·성립 연도(숫자) 또는 세기**로 통일한다(기존 `1600s`·`modern`과 호환되게 `1794`·`8c` 형식).

`reviewed_at` 은 전 항목 `2026-08-15`, 리뷰어는 `content-team`.

---

### 3-2. 항목 블록 (43행 전문)

각 블록의 필드를 CSV 한 행으로 옮긴다. `text_ko`가 화면 본문, `text_original`이 소형 병기다.

---

#### ① q-lit-rose-burns

- **flower_id**: `rose-red`
- **excerpt_type**: `poem`
- **text_ko**: 오, 내 사랑은 붉디붉은 장미 같아라, / 유월에 갓 피어난. / 오, 내 사랑은 가락 같아라, / 곡조에 맞춰 달콤히 울리는.
- **text_original**: O, my Luve's like a red, red rose, / That's newly sprung in June; / O, my Luve's like the melodie / That's sweetly play'd in tune.
- **author**: 로버트 번스
- **source_title**: 〈A Red, Red Rose〉(1794)
- **source_url**: https://www.gutenberg.org/ebooks/1279
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1794` · **tags**: `confession|anniversary`
- **pd_basis**: 번스 1759–1796 사망. 한국 기준 1963년 이전 사망 → 만료. 초판 1794년 Urbani 『A Selection of Scots Songs』.
- **editorial_note**: 구텐베르크 #1279 『Poems and Songs of Robert Burns』가 전문 수록(직접 열람으로 서지 확인). 1794년 초판은 첫 행이 `My luve's like…`이고 오늘날 통용본은 `O, my Luve's like…`로 감탄사가 붙는다 — 통용본 표기를 채택했고 이 차이를 여기 남긴다. 스코트어 `Luve`·`melodie` 철자는 그대로 둘 것(현대 영어로 고치지 말 것).
- **확인**: 검색확인

---

#### ② q-lit-rose-rilke

- **flower_id**: `rose-red`
- **excerpt_type**: `poem`
- **text_ko**: 장미여, 오 순수한 모순이여, / 이토록 많은 눈꺼풀 아래 / 그 누구의 잠도 아니라는 기쁨이여.
- **text_original**: Rose, oh reiner Widerspruch, Lust, / Niemandes Schlaf zu sein unter soviel / Lidern.
- **author**: 라이너 마리아 릴케
- **source_title**: 〈Grabspruch〉(묘비명, 1925)
- **source_url**: https://www.gedichte-lyrik-poesie.de/grabspruch-rilke.html
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1925` · **tags**: `comfort|remembrance`
- **pd_basis**: 릴케 1875–1926 사망. 한국 기준 1963년 이전 사망 → 만료(독일은 2026년 말까지 보호였고 이미 만료).
- **editorial_note**: 릴케가 1925년 늦가을 유언을 준비하며 직접 써 둔 묘비명. 스위스 라론 교회 묘지 비석에 새겨져 있다. 열두 단어짜리 한 문장을 세 줄로 나눈 형태라 행갈이를 지켜야 뜻이 산다. "Lidern"은 눈꺼풀이자 장미 꽃잎을 겹쳐 부르는 말 — 번역에서 한 단어로 눌러 두었으니 각주로 풀어 줄 여지가 있다. **source_url이 개인 시가 아카이브라 신뢰도가 낮다. 적재 전 독일어 위키문헌(de.wikisource) 또는 라론 묘비 사진 자료로 대조할 것.**
- **확인**: 검색확인

---

#### ③ q-lit-rose-romeo

- **flower_id**: `rose-red`
- **excerpt_type**: `play`
- **text_ko**: 이름이 무엇이기에? 우리가 장미라 부르는 저것은 / 다른 어떤 이름으로 불러도 그만큼 향기로울 텐데.
- **text_original**: What's in a name? That which we call a rose / By any other name would smell as sweet.
- **author**: 윌리엄 셰익스피어
- **source_title**: 『로미오와 줄리엣』 2막 2장
- **source_url**: http://shakespeare.mit.edu/romeo_juliet/romeo_juliet.2.2.html
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1597` · **tags**: `confession|just_because`
- **pd_basis**: 셰익스피어 1564–1616 사망 → 만료. 원문 텍스트(Globe/Moby 판)는 편집 저작권 없음.
- **editorial_note**: 한국어 출판 번역(최재서·신정옥·이상섭 등)은 역자 저작권이 살아 있다 — 위 번역은 자체 번역이며 기존 번역서를 대조하지 않았다. 기존 quotes.csv `q-003`(햄릿 로즈메리)과 같은 작가라 §1.5e 절제 원칙상 **한 화면에 둘을 같이 띄우지 말 것**. `shakespeare.mit.edu` 는 같은 사이트의 『겨울 이야기』 페이지를 직접 열람해 구조를 확인했으나 이 URL 자체는 미열람.
- **확인**: 검색확인

---

#### ④ q-lit-rose-hanyongun

- **flower_id**: `rose-red`
- **excerpt_type**: `poem`
- **text_ko**: 당신은 해당화 피기 전에 오신다고 하였습니다 / 봄은 벌써 늦었습니다 / 봄이 오기 전에는 어서 오기를 바랐더니 / 봄이 오고 보니 너무 일찍 왔나 두려합니다
- **text_original**: 당신은 해당화픠기전에 오신다고하얏슴니다 봄은벌써 느젓슴니다 / 봄이오기전에는 어서오기를 바랏더니 봄이오고보니 너머일즉왓나 두려함니다
- **author**: 한용운
- **source_title**: 『님의 침묵』(1926) 〈해당화〉
- **source_url**: https://ko.wikisource.org/wiki/님의_침묵/해당화
- **license**: `pd` · **translator**: `dearbloom`(현대어 표기)
- **era**: `1926` · **tags**: `comfort|anniversary`
- **pd_basis**: 한용운 1879–1944 사망. 한국 기준 1963년 이전 사망 → 만료. 한국어 위키문헌도 PD로 게시.
- **editorial_note**: **종 주의** — 해당화는 *Rosa rugosa*(생울타리·바닷가 장미)로, 카탈로그 `rose-red`의 *Rosa hybrida*(절화 장미)와 다른 종이다. 같은 장미속이므로 sunflower·marigold 선례(가장 가까운 근거를 쓰되 종 차이를 남긴다)를 따라 `rose-red`에 붙이고 각주로 밝힌다. `text_ko`의 현대어 표기는 자체 정리이고, 원문 표기는 위키문헌 그대로다. **한국 시인 중 이 카탈로그와 맞는 장미 시를 찾은 유일한 건**이라 한국어 커버 관점에서 값이 크다.
- **확인**: 직접열람

---

#### ⑤ q-lit-tulip-rubaiyat

- **flower_id**: `tulip-white`
- **excerpt_type**: `poem`
- **text_ko**: 튤립이 아침 한 모금 / 하늘의 술을 받으려 흙에서 고개를 들듯, / 그대도 경건히 그리하라, 하늘이 그대를 / 빈 잔처럼 땅에 엎어 놓을 그날까지.
- **text_original**: As then the Tulip for her morning sup / Of Heav'nly Vintage from the soil looks up, / Do you devoutly do the like, till Heav'n / To Earth invert you—like an empty Cup.
- **author**: 오마르 하이얌 / 에드워드 피츠제럴드 옮김
- **source_title**: 『루바이야트』 40수(피츠제럴드 4·5판)
- **source_url**: https://en.wikisource.org/wiki/The_Rubaiyat_of_Omar_Khayyam_(tr._Fitzgerald,_5th_edition)
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1859` · **tags**: `just_because|comfort`
- **pd_basis**: 오마르 하이얌 1048–1131 사망 → 만료. 피츠제럴드 1809–1883 사망 → 만료. **영역본까지 PD라 영문을 그대로 병기할 수 있는 드문 경우.**
- **editorial_note**: 기존 `story-tulip-*` 계열이 "고대 그리스·로마 문헌에 튤립은 한 번도 안 나옵니다"를 다루는데, 이 항목은 그 공백을 페르시아 쪽에서 메운다 — 카탈로그 튤립 문학의 사실상 유일한 PD 후보. 다만 피츠제럴드는 축자 번역이 아니라 **자유로운 번안**이라 하이얌 원 4행시와 1:1로 대응하지 않는다. 각주에 "피츠제럴드가 옮기며 새로 지은 부분이 많다"는 사실을 남기면 §1.5d 톤과도 맞는다.
- **확인**: 검색확인

---

#### ⑥ q-lit-lily-matthew

- **flower_id**: `lily-asiatic`
- **excerpt_type**: `classic`
- **text_ko**: 들의 백합이 어떻게 자라는지 보라. 수고하지도 않고, 실을 잣지도 않는다.
- **text_original**: Consider the lilies of the field, how they grow; they toil not, neither do they spin.
- **author**: 마태복음 6장 28절
- **source_title**: King James Bible(1611) Matthew 6:28
- **source_url**: https://en.wikisource.org/wiki/Bible_(King_James)/Matthew#6:28
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1611` · **tags**: `comfort|just_because`
- **pd_basis**: KJV 1611년. 영국 내에서는 Letters Patent에 근거한 Crown copyright가 영구 존속하나, **베른협약이 Crown copyright를 인정하지 않아 영국 밖에서는 PD.** 한국 서비스이므로 사용 가능.
- **editorial_note**: 🚨 **한국어 성경 번역본(개역한글·개역개정·새번역 등)은 대한성서공회 저작권이다. 단 한 구절도 옮겨 붙이지 말 것.** 위 한국어는 KJV 영문에서 자체 번역했다. / **식물 주의**: '들의 백합'의 실제 식물은 백합이 아니라 아네모네나 들꽃 무리라는 견해가 유력하다 — 기존 `story-anemone`의 「들의 백합은 사실 이 꽃이었을지도」와 정확히 맞물리므로, 그 이야기와 이 발췌를 같은 화면에 배치하면 §1.5i의 "이야기가 먼저" 위계가 살아난다.
- **확인**: 검색확인

---

#### ⑦ q-lit-lily-blake

- **flower_id**: `lily-asiatic`
- **excerpt_type**: `poem`
- **text_ko**: 얌전한 장미는 가시를 내밀고 / 순한 양은 으르는 뿔을 세우지만, / 흰 백합은 사랑 안에서 기뻐할 뿐, / 가시도 으름장도 그 밝은 아름다움을 더럽히지 못한다.
- **text_original**: The modest Rose puts forth a thorn, / The humble Sheep a threatning horn: / While the Lilly white shall in Love delight, / Nor a thorn nor a threat stain her beauty bright.
- **author**: 윌리엄 블레이크
- **source_title**: 『경험의 노래』 〈The Lilly〉(1794)
- **source_url**: https://www.gutenberg.org/cache/epub/1934/pg1934.txt
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1794` · **tags**: `just_because|confession`
- **pd_basis**: 블레이크 1757–1827 사망 → 만료.
- **editorial_note**: 블레이크 특유의 대문자·철자(`Lilly`, `threatning`)를 그대로 둘 것 — 현대 철자로 고치면 원문 병기의 뜻이 없어진다. 같은 시집의 「Ah! Sun-flower」(⑱)와 한 시집이므로 **한 화면에 둘을 같이 띄우지 말 것**(§1.5e). 구텐베르크 #1934 원문 파일 열람은 성공했으나 전문 인용은 도구가 거부해, 표기는 통용본 기준으로 적었다 — **적재 전 pg1934.txt 를 직접 열어 대소문자·구두점 대조 필수.**
- **확인**: 출처열람(파일 접근 성공 / 전문 인용 미확보)

---

#### ⑧ q-lit-lily-tennyson

- **flower_id**: `lily-asiatic`
- **excerpt_type**: `poem`
- **text_ko**: 붉은 장미가 외친다, "그녀가 가까이 왔어, 가까이 왔어." / 흰 장미가 운다, "늦는구나." / 참제비고깔이 귀 기울인다, "들려, 들려." / 그리고 백합이 속삭인다, "나는 기다린다."
- **text_original**: The red rose cries, "She is near, she is near;" / And the white rose weeps, "She is late;" / The larkspur listens, "I hear, I hear;" / And the lily whispers, "I wait."
- **author**: 알프레드 테니슨
- **source_title**: 『Maud』 1부 22절(1855)
- **source_url**: https://www.poetryfoundation.org/poems/45367/maud-part-i
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1855` · **tags**: `confession|anniversary`
- **pd_basis**: 테니슨 1809–1892 사망 → 만료. 초판 『Maud, and Other Poems』(1855).
- **editorial_note**: 한 발췌에 붉은 장미·흰 장미·백합이 함께 나온다 — `flower_id`는 백합으로 두되, **결과 화면이 rose-red일 때도 재사용 가능**하다는 사실을 남긴다(조회 시 flower_id 단일 매칭이면 rose-red 화면에는 안 뜬다는 점을 알고 쓸 것). 꽃마다 다른 말을 하는 구조라 §1.5i의 꽃말 조합기 로드맵과 결이 맞는 재료. larkspur(참제비고깔)는 카탈로그에 없다.
- **확인**: 검색확인

---

#### ⑨ q-lit-anemone-ovid

- **flower_id**: `anemone`
- **excerpt_type**: `classic`
- **text_ko**: 그러나 그 꽃을 누릴 시간은 짧다. / 잘 붙어 있지 못하고 너무 가벼워 쉬이 지는 그 꽃을, / 그 꽃에 이름을 준 바로 그 바람이 떨어뜨리기 때문이다.
- **text_original**: brevis est tamen usus in illo; / namque male haerentem et nimia levitate caducum / excutiunt idem, qui praestant nomina, venti.
- **author**: 오비디우스
- **source_title**: 『변신 이야기』 10권 737~739행
- **source_url**: https://www.thelatinlibrary.com/ovid/ovid.met10.shtml
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `8년경` · **tags**: `comfort|remembrance`
- **pd_basis**: 오비디우스 BC 43–AD 17/18 사망 → 만료. The Latin Library 판본은 편집 주기 없는 원문.
- **editorial_note**: 아도니스의 피에서 핀 꽃이 곧 아네모네다. 라틴어 원문에 `anemone`라는 단어는 안 나오고 **"이름을 준 바람(qui praestant nomina, venti)"** 이라는 말장난으로만 지시된다 — 그리스어 ἄνεμος(바람)에서 온 이름이라는 사실이 2천 년 전 원문 안에 이미 각주처럼 박혀 있는 셈. 기존 `story-anemone`의 「바람의 딸」·「눈물과 피가 섞인 자리」와 같은 화면에 놓기 좋다. 이 발췌 자체가 꽃이 금방 지는 이유를 말하므로, 아네모네의 짧은 화병 수명 안내와도 자연스럽게 이어진다.
- **확인**: 직접열람

---

#### ⑩ q-lit-hellebore-burton

- **flower_id**: `hellebore`
- **excerpt_type**: `essay`
- **text_ko**: 보리지와 헬레보어가 두 장면을 채운다, / 우울을 핏줄에서 씻어 내고 / 마음을 북돋우는 으뜸가는 풀들.
- **text_original**: Borage and Hellebor fill two scenes, / Sovereign plants to purge the veins / Of melancholy, and cheer the heart
- **author**: 로버트 버튼
- **source_title**: 『우울의 해부』(1621) 권두시 〈The Author's Abstract of Melancholy〉
- **source_url**: https://www.exclassics.com/anatomy/anatomy1.pdf
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1621` · **tags**: `comfort`
- **pd_basis**: 버튼 1577–1640 사망 → 만료. 1621년 초판, 데모크리투스 주니어라는 필명으로 발표.
- **editorial_note**: 기존 `story-hellebore`의 「광기를 고친 대가」·「안티키라로 가라」와 같은 계보 — 17세기 영국에서도 헬레보어가 여전히 우울증 약초로 통했다는 증거다. 다만 **헬레보어는 실제로 독성이 강하다** — care_summary의 경고와 충돌하지 않게, 각주는 "그때는 그렇게 믿었다"는 과거형으로 쓸 것(§1.5h: 안전은 직설 유지). exclassics PDF는 전문 스캔 텍스트라 URL 안정성이 낮다 — 구텐베르크 #10800(vol.1) 대체 검토 권장.
- **확인**: 검색확인

---

#### ⑪ q-lit-hyacinth-ovid

- **flower_id**: `hyacinth`
- **excerpt_type**: `classic`
- **text_ko**: 그는 제 탄식을 꽃잎에 새겨 넣었다. 그리하여 꽃에는 / '아이 아이'라 적혔으니, 슬픔의 글자가 거기 그어졌다.
- **text_original**: ipse suos gemitus foliis inscribit, et AI AI / flos habet inscriptum, funestaque littera ducta est.
- **author**: 오비디우스
- **source_title**: 『변신 이야기』 10권 215~216행
- **source_url**: https://www.thelatinlibrary.com/ovid/ovid.met10.shtml
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `8년경` · **tags**: `apology|comfort|remembrance`
- **pd_basis**: 오비디우스 BC 43–AD 17/18 사망 → 만료.
- **editorial_note**: 아폴론이 제가 던진 원반에 죽은 히아킨토스를 꽃으로 바꾸고, 그 꽃잎에 자기 탄식 소리 "AI AI"(그리스어 비탄의 감탄사, αἰαῖ)를 글자로 새겨 넣는 장면. **rules.csv `rule-007`이 히아신스를 apology 규칙에 넣은 근거 설화의 원문**이므로, 사과 결과 화면에 이 발췌를 붙이면 데이터 계보가 화면에서 닫힌다. 'AI AI'는 라틴어 대문자 그대로 두고 번역에서만 '아이 아이'로 옮겼다 — 원문 병기가 반드시 필요한 항목. 참고로 오비디우스가 말한 꽃은 오늘날의 히아신스가 아니라 제비고깔·붓꽃류라는 설이 유력하다(기존 story 「성경에 나오는 히아신스는 꽃이 아니라 돌입니다」와 같은 결의 사실).
- **확인**: 직접열람

---

#### ⑫ q-lit-peony-shijing

- **flower_id**: `peony`
- **excerpt_type**: `classic`
- **text_ko**: 사내와 아가씨가 / 서로 웃고 놀리다가 / 작약을 꺾어 건넨다.
- **text_original**: 維士與女，伊其相謔，贈之以勺藥。
- **author**: 『시경』 정풍 「진유」(작자 미상)
- **source_title**: 詩經 國風 鄭風 溱洧
- **source_url**: https://ctext.org/book-of-poetry/zhen-wei/zh
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `BC 11~6c` · **tags**: `confession|just_because|celebration`
- **pd_basis**: 기원전 11~6세기 편집, 작자 미상 → 만료. ctext.org는 원문 텍스트 제공(번역 아님).
- **editorial_note**: **서비스 정체성과 가장 가까운 발췌.** 봄날 진수·유수 강가에서 남녀가 어울려 놀다가 헤어질 때 작약을 꺾어 건네는 장면으로, **기록으로 남은 가장 오래된 '꽃 선물' 장면 중 하나**다. 랜딩 인용 밴드(§1.5e, 현재 에머슨 자리)의 교체 후보 1순위. / **종 주의**: 여기 '勺藥(작약)'은 초본 작약과 목본 모란을 아직 구분하기 전의 통칭이라는 견해가 있다 — flowers.csv `peony` 행이 이미 "초본 작약 기준, 모란 이야기도 같은 id에 싣되 종 차이를 밝힌다"고 정해 두었으므로 그 방침 그대로 적용. 원문 `勺藥`은 후대 `芍藥` 표기와 다르니 **원문 글자를 고치지 말 것.**
- **확인**: 검색확인

---

#### ⑬ q-lit-peony-kimyeongrang

- **flower_id**: `peony`
- **excerpt_type**: `poem`
- **text_ko**: 모란이 피기까지는 / 나는 아직 기다리고 있을 테요 / 찬란한 슬픔의 봄을
- **text_original**: 모란이 피기까지는 / 나는 아즉 기둘리고잇슬테요 / 찰란한슬픔의 봄을
- **author**: 김영랑
- **source_title**: 『영랑시집』(1935) 〈모란이 피기까지는〉
- **source_url**: https://ko.wikisource.org/wiki/영랑시집/모란이_피기까지는
- **license**: `pd` · **translator**: `dearbloom`(현대어 표기)
- **era**: `1934` · **tags**: `comfort|anniversary|just_because`
- **pd_basis**: 김영랑(김윤식) 1903–1950 사망(한국전쟁 중 서울에서 파편에 맞아 사망). 한국 기준 1963년 이전 사망 → 만료. 한국어 위키문헌도 PD로 게시.
- **editorial_note**: 1934년 4월 《문학》 3호 발표 → 1935년 『영랑시집』 재수록. 발췌는 **마지막 3행**(수미상관의 뒷부분)으로, 이 시 전체에서 가장 널리 알려진 대목이자 발췌 길이 규정 안에 든다. / **종 주의**: '모란'은 목본 모란(*Paeonia suffruticosa*)으로, 카탈로그 `peony`의 초본 작약(*P. lactiflora*)과 다른 종 — flowers.csv 방침대로 같은 id에 싣고 각주에 밝힌다. 원문 표기(`아즉`·`기둘리고`·`찰란한`)를 `text_original`에 살려야 1930년대 시집의 결이 남는다. 위키문헌에 `영랑시집/`과 `영랑시선/` 두 판본이 있고 표기가 다르다 — **적재 시 `영랑시집`(1935 초판) 쪽으로 통일할 것.**
- **확인**: 검색확인

---

#### ⑭ q-lit-peony-libai

- **flower_id**: `peony`
- **excerpt_type**: `poem`
- **text_ko**: 구름을 보면 그이의 옷이 떠오르고, 꽃을 보면 그이의 얼굴이 떠오른다 / 봄바람이 난간을 스치니, 이슬 머금은 꽃빛이 짙다
- **text_original**: 雲想衣裳花想容，春風拂檻露華濃。
- **author**: 이백
- **source_title**: 〈清平調〉 3수 중 제1수
- **source_url**: https://ctext.org/wiki.pl?if=gb&chapter=479963
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `743년경` · **tags**: `confession|celebration`
- **pd_basis**: 이백 701–762 사망 → 만료.
- **editorial_note**: 천보 2~3년(743~744) 봄, 현종과 양귀비가 침향정에서 **모란**을 보던 자리에서 급히 불려 온 이백이 금화전지에 써낸 세 수 중 첫 수. 꽃과 사람을 겹쳐 보는 첫 구가 이 서비스의 "꽃으로 사람을 말한다"는 전제 그 자체다. 여기 꽃도 목본 모란이라 ⑬과 같은 종 주의가 붙는다. **source_url은 미열람 — ctext 페이지 번호가 바뀔 수 있으니 적재 전 반드시 대조하고, 안 되면 중국어 위키문헌(zh.wikisource) 『李太白集』으로 대체할 것.**
- **확인**: 검색확인(본문 문자열만 확인, URL 미대조)

---

#### ⑮ q-lit-hydrangea-baijuyi

- **flower_id**: `hydrangea`
- **excerpt_type**: `poem`
- **text_ko**: 사람 사는 곳에 있으면서도 아무도 알아보지 못하니 / 내 그대에게 '자양화'라는 이름을 지어 주노라
- **text_original**: 雖在人間人不識，與君名作紫陽花。
- **author**: 백거이
- **source_title**: 〈紫陽花〉
- **source_url**: https://www.gushiwen.cn/gushiwen_276e4924f3.aspx
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `822~824` · **tags**: `just_because|comfort`
- **pd_basis**: 백거이 772–846 사망 → 만료.
- **editorial_note**: 항주자사 시절 서호 招賢寺에서 이름 모를 산꽃을 보고 **직접 이름을 지어 준** 시. "이름을 붙여 주는 행위"가 시의 사건 전부라, 꽃말이 곧 이름 붙이기인 이 서비스와 결이 맞는다. / **함정**: 백거이가 이름 붙인 그 꽃은 실제로는 수국이 아니라 라일락(紫丁香)이라는 견해가 유력하다. 일본에서 헤이안 시대 미나모토노 시타고(源順)가 이 이름을 아지사이(수국)에 갖다 붙이면서 오늘의 '자양화=수국'이 굳어졌다. **틀린 이름이 천 년을 건너와 정착한 이야기** 자체가 §1.5d 톤에 맞는 각주 재료 — 기존 `story-hydrangea-manyoshu`(만엽집)와 나란히 놓으면 중일 대비가 선다.
- **확인**: 검색확인

---

#### ⑯ q-lit-lavender-walton

- **flower_id**: `lavender`
- **excerpt_type**: `essay`
- **text_ko**: 이제 정직한 선술집으로 모시겠습니다. 거기엔 말끔한 방이 있고, 창가엔 라벤더가 놓여 있고, 벽에는 노래 스무 편이 붙어 있지요.
- **text_original**: I'll now lead you to an honest Alehouse, where we shall find a cleanly room, Lavender in the windowes, and twenty Ballads stuck about the wall.
- **author**: 아이작 월턴
- **source_title**: 『조어대전』(The Compleat Angler, 1653)
- **source_url**: https://www.gutenberg.org/files/9198/9198-h/9198-h.htm
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1653` · **tags**: `just_because|comfort|gratitude`
- **pd_basis**: 월턴 1593–1683 사망 → 만료.
- **editorial_note**: 라벤더가 향수·약초가 아니라 **그냥 창가에 놓여 방을 기분 좋게 만드는 것**으로 나오는 대목. flowers.csv의 "거꾸로 매달아 말리면 향이 오래 남아요"와 톤이 정확히 겹친다. 1653년 철자(`windowes`, `Alehouse` 대문자)를 그대로 둘 것. 기존 `story-lavender`가 어원("씻다")·네 도둑의 식초 같은 기능 이야기 위주라, 이 발췌는 그 반대편(생활의 정취)을 채운다.
- **확인**: 검색확인

---

#### ⑰ q-lit-lavender-dillydilly

- **flower_id**: `lavender`
- **excerpt_type**: `poem`
- **text_ko**: 라벤더는 푸르고, 딜리 딜리, 라벤더는 초록빛 / 내가 임금이 되면, 딜리 딜리, 그대는 왕비가 되리
- **text_original**: Lavender's blue, dilly dilly, lavender's green, / When I am king, dilly dilly, you shall be queen.
- **author**: 전승 동요(영국)
- **source_title**: 〈Lavender's Blue〉(원제 Diddle Diddle, or The Kind Country Lovers)
- **source_url**: https://en.wikipedia.org/wiki/Lavender%27s_Blue
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1672~1679` · **tags**: `confession|just_because`
- **pd_basis**: 1672~1679년 사이 영국에서 인쇄된 브로드사이드가 최초 기록, 작자 미상 → 만료. 1805년 『Songs for the Nursery』에 동요로 재수록된 판본도 PD.
- **editorial_note**: 지금은 자장가로 알려졌지만 **17세기 원판 가사는 술과 성을 노래한 상당히 노골적인 것**이었고, 19세기에 아이들 노래로 순화됐다. 발췌한 두 줄은 순화판·원판 공통 부분이라 안전하다. §1.5f "재미 우선"에 딱 맞는 각주 재료지만, 원판이 야하다는 사실은 **가볍게 한 줄로만** 언급할 것(선물 서비스 톤). 출처가 위키백과라 신뢰도 라벨은 `wiki` 계열.
- **확인**: 검색확인

---

#### ⑱ q-lit-sunflower-blake

- **flower_id**: `sunflower`
- **excerpt_type**: `poem`
- **text_ko**: 아, 해바라기여! 시간에 지쳐 / 해의 걸음을 세는 이여, / 나그네의 여정이 끝나는 / 그 달콤한 황금의 땅을 찾아 헤매는 이여.
- **text_original**: Ah Sun-flower! weary of time, / Who countest the steps of the Sun: / Seeking after that sweet golden clime / Where the travellers journey is done.
- **author**: 윌리엄 블레이크
- **source_title**: 『경험의 노래』 〈Ah! Sun-flower〉(1794)
- **source_url**: https://www.gutenberg.org/cache/epub/1934/pg1934.txt
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1794` · **tags**: `comfort|remembrance`
- **pd_basis**: 블레이크 1757–1827 사망 → 만료.
- **editorial_note**: 8행 중 앞 4행. 기존 `story-sunflower`의 「해를 따라 돌던 사랑」(클리티에 설화)·「다 자란 해바라기는 돌지 않는다」와 같은 화면에 놓으면, **설화 → 문학 → 식물학적 사실**의 3단이 완성된다. ⑦과 같은 시집이라 한 화면 동시 노출 금지. ⑦과 마찬가지로 **적재 전 pg1934.txt 대조 필수**(대소문자·`travellers` 아포스트로피 유무).
- **확인**: 출처열람(파일 접근 성공 / 전문 인용 미확보)

---

#### ⑲ q-lit-sunflower-yundongju

- **flower_id**: `sunflower`
- **excerpt_type**: `poem`
- **text_ko**: 누나의 얼굴은 / 해바라기 얼굴 / 해가 금방 뜨자 / 일터에 간다.
- **text_original**: (동일 — 한국어 원전)
- **author**: 윤동주
- **source_title**: 『하늘과 바람과 별과 시』 〈해바라기 얼굴〉
- **source_url**: https://ko.wikisource.org/wiki/하늘과_바람과_별과_시_(1955년)/해바라기_얼굴
- **license**: `pd` · **translator**: (공란 — 한국어 원전)
- **era**: `1938` · **tags**: `gratitude|comfort`
- **pd_basis**: 윤동주 1917–1945 사망(후쿠오카 형무소). 한국 기준 1963년 이전 사망 → 만료. 한국어 위키문헌도 PD로 게시.
- **editorial_note**: 8행 중 앞 4행. 뒤 4행("해바라기 얼굴은 / 누나의 얼굴 / 얼굴이 숙어들어 / 집으로 온다")이 앞과 정확히 대칭이라, 앞 4행만 쓰면 **아침에 나가는 장면**만 남아 밝게 읽힌다 — 선물 카드 문맥에 앞 4행이 맞다. 해바라기의 화려한 이미지가 아니라 **일하러 가는 사람의 얼굴**로 쓰였다는 점이 §1.5h "이런 날 건네보세요"의 '첫 출근을 축하할 때' 계열과 잘 붙는다. 위키문헌 URL은 1955년판 수록 페이지다(초판 1948).
- **확인**: 직접열람

---

#### ⑳ q-lit-carnation-winterstale

- **flower_id**: `carnation`
- **excerpt_type**: `play`
- **text_ko**: 이맘때 가장 어여쁜 꽃은 / 우리 카네이션과 줄무늬 든 패랭이랍니다, / 누군가는 자연이 낳은 사생아라 부르지만요.
- **text_original**: the fairest flowers o' the season / Are our carnations and streak'd gillyvors, / Which some call nature's bastards
- **author**: 윌리엄 셰익스피어
- **source_title**: 『겨울 이야기』 4막 4장 (페르디타)
- **source_url**: http://shakespeare.mit.edu/winters_tale/winters_tale.4.4.html
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1611` · **tags**: `gratitude|just_because`
- **pd_basis**: 셰익스피어 1564–1616 사망 → 만료.
- **editorial_note**: `gillyvors`(길리플라워)는 패랭이·카네이션류를 두루 부르던 옛 이름. 페르디타는 이 꽃들이 **사람 손으로 교배해 만든 것**이라 자연스럽지 않다며 심지 않겠다고 말한다 — flowers.csv `carnation` 행의 복색(variegated) 꽃말 '거절'과 묘하게 겹치는 대목이라, 각주에서 이 우연을 짚으면 재미가 산다. 셰익스피어 계열 인용이 카탈로그에 6건이라 **한 화면에 하나 원칙(§1.5e)을 조회 단계에서 강제할 것.** 한국어 출판 번역 미참조, 자체 번역.
- **확인**: 직접열람

---

#### ㉑ q-lit-lisianthus-dickinson

- **flower_id**: `lisianthus`
- **excerpt_type**: `poem`
- **text_ko**: 신이 작은 용담꽃 하나를 지으셨다 — / 그것은 장미가 되려 했고 — / 실패했고 — 온 여름이 웃었다 —
- **text_original**: God made a little Gentian— / It tried—to be a Rose— / And failed—and all the Summer laughed—
- **author**: 에밀리 디킨슨
- **source_title**: 『Poems by Emily Dickinson』 2집(1891) 〈Fringed Gentian〉
- **source_url**: https://etc.usf.edu/lit2go/115/the-poems-of-emily-dickinson-series-two/4497/nature-poem-48-fringed-gentian/
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1891` · **tags**: `comfort|celebration`
- **pd_basis**: 디킨슨 1830–1886 사망 → 만료. **단, 판본 주의** — 1890/1891 초판(Todd·Higginson 편)만 PD로 쓰고, Johnson(1955)·Franklin(1998) 판본은 편집 저작권이 살아 있어 그 대시·대문자 표기를 그대로 옮기면 안 된다.
- **editorial_note**: **식물 연결 주의(중요)** — 리시안셔스(*Eustoma grandiflorum*)는 용담과(Gentianaceae)라 영어 통칭이 prairie gentian(초원 용담)이다. 디킨슨이 노래한 것은 fringed gentian(*Gentiana crinita*)으로 **속이 다르다**. 같은 과 + 통칭 공유라는 근거로 연결하되, 각주에 반드시 밝힐 것 — sunflower·marigold의 종 불일치 처리 선례와 같은 방식. / 내용도 맞아떨어진다: 카탈로그에서 리시안셔스는 "장미를 닮았지만 장미가 아닌 꽃"으로 팔리고, 이 시는 정확히 그 이야기(장미가 되려다 실패한 뒤 서리 내릴 무렵에야 제 색으로 핀다)다. **기존 `story-lisianthus` 9건이 전부 history 유형이라, 이 카탈로그에서 문학이 가장 절실했던 꽃 중 하나를 채웠다.**
- **확인**: 검색확인

---

#### ㉒ q-lit-lotv-songofsongs

- **flower_id**: `lily-of-the-valley`
- **excerpt_type**: `classic`
- **text_ko**: 나는 샤론의 장미요, 골짜기의 백합이다.
- **text_original**: I am the rose of Sharon, and the lily of the valleys.
- **author**: 아가 2장 1절
- **source_title**: King James Bible(1611) Song of Solomon 2:1
- **source_url**: https://en.wikisource.org/wiki/Bible_(King_James)/Song_of_Solomon#2:1
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1611` · **tags**: `confession|anniversary`
- **pd_basis**: KJV 1611년, 영국 밖 PD(⑥과 동일 근거).
- **editorial_note**: 🚨 한국어 성경 번역본 인용 금지(⑥과 동일). / **이름 이전 주의(이 항목의 핵심)** — 여기 'lily of the valleys'는 **은방울꽃(*Convallaria majalis*)이 아니다.** 히브리어 원어(שׁוֹשַׁנַּת הָעֲמָקִים)는 골짜기에 피는 백합·수련류를 가리키고, 은방울꽃은 훨씬 뒤에 이 성경 구절의 이름을 넘겨받아 영어 통칭 lily of the valley가 됐다. **"성경 구절에서 이름만 건너온 꽃"이라는 사실 자체가 이 발췌의 값**이며, 이걸 밝히지 않고 쓰면 서비스가 틀린 정보를 주는 셈이 된다. §1.5d 톤으로 "이 이름은 성경에서 옮겨 왔지만, 성경 속 그 꽃은 이 꽃이 아니었어요" 한 줄이 각주로 붙어야 적재 승인 가능. 'rose of Sharon' 역시 무궁화가 아니다(영어 통칭만 그렇게 굳었다).
- **확인**: 검색확인

---

#### ㉓ q-lit-chrysanthemum-leejeongbo

- **flower_id**: `chrysanthemum`
- **excerpt_type**: `poem`
- **text_ko**: 국화야 너는 어이 삼월동풍 다 보내고 / 낙목한천에 네 홀로 피었는다 / 아마도 오상고절은 너뿐인가 하노라
- **text_original**: 菊花야 너는 어이 三月東風 다 보내고 / 落木寒天에 네 홀로 피엿는다 / 아마도 傲霜孤節은 너뿐인가 하노라
- **author**: 이정보
- **source_title**: 시조(『해동가요』 등 수록)
- **source_url**: https://www.ksilbo.co.kr/news/articleView.html?idxno=1011091
- **license**: `pd` · **translator**: `dearbloom`(현대어 표기)
- **era**: `18c` · **tags**: `gratitude|comfort|remembrance`
- **pd_basis**: 이정보 1693–1766 사망 → 만료.
- **editorial_note**: **국화 발췌의 1순위** — 카탈로그에서 국화는 "장례식 꽃"이라는 한국적 무게가 가장 큰 꽃인데, 이 시조는 장례가 아니라 **혼자 늦게 피는 절개**를 말한다. 기존 `story-chrysanthemum` 13건이 장례·황실·약초 쪽에 몰려 있어, 존경·감사 결과 화면(스승·어른)에 쓸 수 있는 카드가 이걸로 생긴다. / **표기 주의**: 초장이 "다 보내고"인 판본과 "다 지나고"인 판본이 함께 돈다. 검색 확인된 신문 기사 판본이 "다 보내고"라 그쪽을 채택했고, **적재 전 한국고전종합DB(db.itkc.or.kr) 또는 『해동가요』 영인으로 대조할 것.** source_url이 신문 칼럼이라 신뢰도 라벨은 `newspaper` — §1.5d 개정표에 따르면 newspaper는 "기록으로 남아 있는 이야기예요" 라벨 대상이다.
- **확인**: 검색확인

---

#### ㉔ q-lit-chrysanthemum-taoyuanming

- **flower_id**: `chrysanthemum`
- **excerpt_type**: `poem`
- **text_ko**: 동쪽 울타리 아래에서 국화를 꺾다가 / 무심히 남산을 바라본다
- **text_original**: 採菊東籬下，悠然見南山。
- **author**: 도연명
- **source_title**: 〈飲酒〉 20수 중 제5수
- **source_url**: https://ctext.org/wiki.pl?if=gb&res=250535
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `5c초` · **tags**: `just_because|comfort`
- **pd_basis**: 도연명 365?–427 사망 → 만료.
- **editorial_note**: ⚠️ **중복 주의** — 기존 `story-chrysanthemum-tao-yuanming`(제목 「동쪽 울타리 아래」)이 **이미 이 구절을 서사로 다루고 있다.** 다만 그 story는 도연명이 어떤 사람이었는지를 이야기로 풀고, 이 항목은 **원문 두 구 자체**를 보여 준다 — §1.5k가 요구하는 "원문 발췌"는 story가 대신할 수 없으므로 둘은 역할이 다르다. **적재 조건: 같은 상세 시트에서 story와 이 발췌를 동시 노출하지 말 것**(하나가 뜨면 다른 하나는 접는다). 국화 발췌를 하나만 쓸 거면 ㉓(이정보)을 우선한다. / 검색 결과 일부 사이트가 `東籬`를 `東籐`으로 잘못 표기한다 — **`籬`(울타리 리)가 맞다.** source_url 미대조, 적재 전 확인 필수.
- **확인**: 검색확인(본문 문자열만 확인, URL 미대조)

---

#### ㉕ q-lit-narcissus-ovid

- **flower_id**: `narcissus`
- **excerpt_type**: `classic`
- **text_ko**: 몸은 어디에도 없었다. 몸이 있던 자리에서 사람들은 꽃 한 송이를 찾아냈다 — / 한가운데는 샛노랗고, 그 둘레를 흰 잎이 감싼 꽃을.
- **text_original**: nusquam corpus erat; croceum pro corpore florem / inveniunt foliis medium cingentibus albis.
- **author**: 오비디우스
- **source_title**: 『변신 이야기』 3권 509~510행
- **source_url**: https://www.thelatinlibrary.com/ovid/ovid.met3.shtml
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `8년경` · **tags**: `remembrance|comfort`
- **pd_basis**: 오비디우스 BC 43–AD 17/18 사망 → 만료.
- **editorial_note**: 나르키소스 설화의 **마지막 두 행**. 화장할 장작과 관을 준비해 놓고 보니 시신이 사라지고 꽃만 있었다는 장면이라, 기존 `story-narcissus`의 「자기 얼굴에 빠진 사람」이 끝나는 바로 그 지점을 원문으로 잇는다. 묘사된 꽃(노란 속 + 흰 겉잎)이 flowers.csv `narcissus` colors의 `yellow|white|cream` 과 정확히 맞아떨어져, "2천 년 전 묘사가 지금 파는 꽃과 같다"는 각주를 쓸 수 있다. `croceum`은 사프란빛(진노랑)이라 '샛노랗고'로 옮겼다.
- **확인**: 직접열람

---

#### ㉖ q-lit-narcissus-wordsworth

- **flower_id**: `narcissus`
- **excerpt_type**: `poem`
- **text_ko**: 나는 골짜기와 언덕 위를 높이 떠가는 / 구름처럼 외로이 거닐었다, / 그러다 문득 보았다, 한 무리를, / 황금빛 수선화의 무리를.
- **text_original**: I wandered lonely as a Cloud / That floats on high o'er Vales and Hills, / When all at once I saw a crowd, / A host, of golden Daffodils;
- **author**: 윌리엄 워즈워스
- **source_title**: 『Poems』(1815) 〈I wandered lonely as a Cloud〉
- **source_url**: https://en.wikisource.org/wiki/Poems_(Wordsworth,_1815)/Volume_1/I_wandered_lonely
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1815` · **tags**: `comfort|just_because|celebration`
- **pd_basis**: 워즈워스 1770–1850 사망 → 만료.
- **editorial_note**: 영어권에서 수선화 하면 자동으로 떠오르는 시. **판본 주의** — 1807년 초판과 1815년 개정판이 다르고(개정판에서 `golden Daffodils`가 확정, 2연이 추가됨), 위 발췌는 **1815년판** 기준이다. 대문자(`Cloud`·`Vales`·`Daffodils`)는 1815년판 표기라 그대로 둘 것. / 기존 `story-ranunculus-wordsworth-celandine`이 같은 시인의 다른 시를 다루므로 **작가 중복** — 같은 결과 화면에 워즈워스가 두 번 나오지 않게 조회에서 배제할 것.
- **확인**: 검색확인

---

#### ㉗ q-lit-narcissus-kimjeonghui

- **flower_id**: `narcissus`
- **excerpt_type**: `poem`
- **text_ko**: 매화가 아무리 높다 해도 뜰의 섬돌을 벗어나지 못하는데 / 맑은 물에 핀 너야말로 얽매임을 벗은 신선이로구나
- **text_original**: 梅高猶未離庭砌，淸水眞看解脫仙。
- **author**: 김정희
- **source_title**: 〈水仙花〉(제주 유배기)
- **source_url**: https://www.hankookilbo.com/News/Read/201801180749181241
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1840년대` · **tags**: `comfort|gratitude`
- **pd_basis**: 김정희 1786–1856 사망 → 만료.
- **editorial_note**: **flowers.csv `narcissus` 행이 이미 예고한 항목** — "김정희 이야기의 주인공은 *N. tazetta* 쪽"이라는 편집 노트가 있으나, 정작 stories.csv 수선화 5건에는 김정희 이야기가 없다. 이 발췌가 그 빈자리를 원문으로 메운다. / **종 주의**: 김정희가 제주에서 본 것은 제주 자생 *Narcissus tazetta* 계열이고, 절화 주력인 나팔수선화(*N. pseudonarcissus*)와 종이 다르다 — flowers.csv 방침대로 같은 id에 싣고 각주로 밝힌다. / 🚨 **번역 함정**: 이 시의 한국어 풀이로 검색에 널리 노출되는 문장은 **국립중앙박물관 2006년 간행물의 번역문**이다(해당 신문 기사가 출처를 밝히고 있다). 그 문장을 절대 복사하지 말 것 — 위 한국어는 한자 원문에서 새로 옮긴 것이다. / **판본 주의**: 2구를 `品於幽澹冷雋邊`으로 적는 판본과 `品格幽澹冷雋娟`으로 적는 판본이 갈린다. 발췌를 3·4구로 잡은 이유가 이것이다(1·2구는 판본 차이가 있어 피했다). 1구 `一點冬心朶朶圓`은 표기가 일치하므로 필요하면 함께 쓸 수 있다.
- **확인**: 직접열람

---

#### ㉘ q-lit-forgetmenot-coleridge

- **flower_id**: `forget-me-not`
- **excerpt_type**: `poem`
- **text_ko**: 실개천이든 샘가든 젖은 길가든, / 홀로 걷는 길 어디에서도 나는 찾지 못한다, / 시내의 그 푸르고 맑은 눈을 한 작은 꽃을, / 희망의 다정한 보석, 사랑스러운 물망초를.
- **text_original**: Nor can I find, amid my lonely walk / By rivulet, or spring, or wet road-side, / That blue and bright-eyed floweret of the brook, / Hope's gentle gem, the sweet Forget-me-not!
- **author**: 새뮤얼 테일러 콜리지
- **source_title**: 〈The Keepsake〉(1802)
- **source_url**: https://www.poeticous.com/samuel-taylor-coleridge/the-keepsake
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1802` · **tags**: `remembrance|comfort|anniversary`
- **pd_basis**: 콜리지 1772–1834 사망 → 만료.
- **editorial_note**: 영어 이름 forget-me-not을 **문학이 널리 굳힌 초기 사례** 중 하나로 자주 인용되는 대목. 시 전체는 연인이 자기 이름을 수놓은 비단을 두고 간 이야기이고, 그 자수의 무늬가 이끼장미와 물망초다 — 발췌한 4행은 화자가 그 꽃을 현실에서는 못 찾는다고 말하는 부분이라 그리움의 톤이 정확하다. 기존 `story-forget-me-not`의 「강물에 휩쓸리며 던진 꽃」(독일 기사 설화)과 나란히 두면 설화 → 문학 계보가 선다. **source_url이 시 아카이브 사이트라 안정성이 낮다 — 적재 전 구텐베르크 콜리지 시집으로 대체 검토.**
- **확인**: 검색확인

---

#### ㉙ q-lit-cherry-narihira

- **flower_id**: `cherry-blossom`
- **excerpt_type**: `poem`
- **text_ko**: 이 세상에 / 벚꽃이라는 것이 / 아예 없었더라면 / 봄날의 마음은 / 얼마나 고요했을까
- **text_original**: 世の中に たえて桜の なかりせば 春の心は のどけからまし
- **author**: 아리와라노 나리히라
- **source_title**: 『고금와카집』 권1 봄노래상 53번
- **source_url**: https://ja.wikisource.org/wiki/古今和歌集
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `905년경` · **tags**: `just_because|comfort`
- **pd_basis**: 나리히라 825–880 사망 → 만료. 『고금와카집』 905년경 편찬.
- **editorial_note**: 벚꽃 와카의 원점으로 꼽히는 노래. 벚꽃을 찬미하는 대신 **"없었으면 마음이 편했을 텐데"** 라고 뒤집어 말해, 아름다운 것이 사람 마음을 흔든다는 사실 자체를 짚는다 — 지는 꽃을 선물로 권하는 화면에 이보다 정직한 문장을 찾기 어렵다. 5·7·5·7·7 음수율이 있으므로 **번역도 5행으로 끊어 두었다**(한 줄로 붙이지 말 것). 기존 `story-cherry-blossom` 5건이 전부 history(하나미·왕벚나무 원산지·개화 예보)라 문학 축이 비어 있었다. **source_url이 문집 목차라 53번 개별 페이지로 좁힐 것.**
- **확인**: 검색확인

---

#### ㉚ q-lit-cherry-basho

- **flower_id**: `cherry-blossom`
- **excerpt_type**: `poem`
- **text_ko**: 이런저런 일들이 / 자꾸 떠오르는구나 / 벚꽃이여
- **text_original**: さまざまの事おもひ出す桜かな
- **author**: 마쓰오 바쇼
- **source_title**: 『오이노코부미』(笈の小文, 1688년 작)
- **source_url**: https://www.basho-bp.jp/?page_id=24
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1688` · **tags**: `remembrance|anniversary|comfort`
- **pd_basis**: 바쇼 1644–1694 사망 → 만료.
- **editorial_note**: 여행에서 돌아와 고향 이가에서 옛 주군 집안의 꽃놀이에 불려 갔을 때 지은 구. 진적회지에는 긴 머리말이 붙어 있는데 **바쇼가 『오이노코부미』에 실을 때는 머리말을 전부 뺐다** — 특정한 사연이 아니라 누구의 벚꽃으로도 읽히게 하려던 뜻으로 풀이된다. 이 편집 판단 자체가 §1.5d 이야기 톤 각주 재료이자, **선물 카드에 이 구를 얹어도 되는 이유**다. 하이쿠라 5·7·5를 3행으로 끊어 옮겼다. ㉙과 같은 꽃이므로 한 화면 동시 노출 금지.
- **확인**: 검색확인

---

#### ㉛ q-lit-camellia-sushi

- **flower_id**: `camellia`
- **excerpt_type**: `poem`
- **text_ko**: 그대에게 말해 준들 그대는 모르리라 — / 눈 속에서 불처럼 붉게 피어난다는 것을
- **text_original**: 說似與君君不會，爛紅如火雪中開。
- **author**: 소식(소동파)
- **source_title**: 〈邵伯梵行寺山茶〉
- **source_url**: https://zh.wikisource.org/wiki/廣羣芳譜/卷041
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `11c` · **tags**: `comfort|confession`
- **pd_basis**: 소식 1037–1101 사망 → 만료. 수록 문헌 『광군방보』(1708) 역시 만료.
- **editorial_note**: 가랑비 내리는 절에 홀로 찾아가 동백을 마주 본 4구시의 뒤 두 구. flowers.csv `camellia`의 bloom_months가 10~4월(겨울 개화)이고 "겨울에 쓸 수 있는 첫 안전종"이라는 편집 노트가 붙어 있는데, **이 시가 정확히 그 겨울 개화를 노래한다.** 기존 `story-camellia`의 「겨울엔 벌이 없어서」와 붙여 놓으면 문학과 생태가 한 화면에서 만난다. 山茶(산다)는 동백의 한자 이름.
- **확인**: 검색확인

---

#### ㉜ q-lit-camellia-kimyujeong

- **flower_id**: `camellia`
- **excerpt_type**: `novel`
- **text_ko**: 산기슭에 널려 있는 굵은 바윗돌 틈에 노란 동백꽃이 소보록하니 깔리었다. … 알싸한, 그리고 향긋한 그 냄새에 나는 땅이 꺼지는 듯이 온 정신이 고만 아찔하였다.
- **text_original**: (동일 — 한국어 원전)
- **author**: 김유정
- **source_title**: 「동백꽃」(1936, 《조광》)
- **source_url**: https://ko.wikisource.org/wiki/동백꽃
- **license**: `pd` · **translator**: (공란 — 한국어 원전)
- **era**: `1936` · **tags**: `confession|just_because`
- **pd_basis**: 김유정 1908–1937 사망. 한국 기준 1963년 이전 사망 → 만료. 한국어 위키문헌도 PD로 게시.
- **editorial_note**: 🌟 **하이라이트.** 두 문장을 `…`로 이어 붙였다(원문에서 떨어진 위치임을 표시). 발췌문 안의 **"노란 동백꽃"** 이 그대로 각주가 된다 — **강원도 방언에서 '동백나무'는 생강나무(*Lindera obtusiloba*)를 가리키며, 이 소설의 동백꽃은 카탈로그의 *Camellia japonica*(붉은 동백)가 아니다.** 알싸한 냄새라는 묘사가 그 증거(동백은 향이 거의 없고, flowers.csv도 fragrance_level 0으로 적어 두었다). 이 불일치를 숨기지 않고 **"같은 이름의 다른 꽃"** 이야기로 전면에 내세우는 것이 §1.5d 톤에 맞고, jasmine 행의 "재스민이라는 이름의 다른 꽃들" 처리와 같은 방식이다. / 이 각주 없이 적재하면 서비스가 틀린 정보를 주게 되므로 **각주 필수 항목**으로 표시한다.
- **확인**: 직접열람

---

#### ㉝ q-lit-violet-hamlet

- **flower_id**: `violet`
- **excerpt_type**: `play`
- **text_ko**: 제비꽃도 좀 드리고 싶었지만, 아버지가 돌아가시던 날 모두 시들어 버렸어요.
- **text_original**: I would give you some violets, but they wither'd all when my father died.
- **author**: 윌리엄 셰익스피어
- **source_title**: 『햄릿』 4막 5장 (오필리아)
- **source_url**: https://www.folger.edu/explore/shakespeares-works/hamlet/read/4/5/
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1601` · **tags**: `remembrance|comfort|apology`
- **pd_basis**: 셰익스피어 1564–1616 사망 → 만료.
- **editorial_note**: ⚠️ **기존 `q-003`과 같은 장면** — q-003이 같은 대사의 앞부분(로즈메리)을 이미 쓰고 있다. 다만 q-003은 `flower_id`가 없는 범용 인용이고 이 항목은 violet 전용이므로, **조회에서 q-003과 이 항목이 동시에 뽑히지 않게 막을 것**(같은 대사가 두 번 뜨면 인용의 무게가 죽는다). / 기존 `story-pansy-ophelia`(오필리아가 건넨 꽃)와도 같은 장면이라 팬지·제비꽃 화면 양쪽에 오필리아가 흩어져 있다 — 문제는 아니지만 한 화면에 몰리지 않게 할 것. 오필리아가 제비꽃만은 **줄 수 없다**고 말하는 대목이라, 반어적으로 remembrance 태그가 가장 강하다.
- **확인**: 검색확인

---

#### ㉞ q-lit-violet-wordsworth

- **flower_id**: `violet`
- **excerpt_type**: `poem`
- **text_ko**: 이끼 낀 돌 곁의 제비꽃 하나, / 눈에 반쯤 가려진!
- **text_original**: A violet by a mossy stone / Half hidden from the eye!
- **author**: 윌리엄 워즈워스
- **source_title**: 〈She dwelt among the untrodden ways〉(1800)
- **source_url**: https://en.wikisource.org/wiki/Lyrical_Ballads_(1800)
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1800` · **tags**: `remembrance|comfort`
- **pd_basis**: 워즈워스 1770–1850 사망 → 만료. 『Lyrical Ballads』 1800년판 수록.
- **editorial_note**: ⚠️ **미검증 항목 중 유일하게 본표에 넣은 건** — 널리 통용되는 두 행이라 문자열 신뢰도는 높지만, **이 항목만은 검색으로도 원문 페이지를 대조하지 않았다.** 적재 worker가 위키문헌 『Lyrical Ballads』(1800) 안의 해당 시 페이지를 반드시 열어 대조하고, 불일치 시 폐기할 것. / ㉖과 같은 시인이므로 작가 중복 배제 대상. 제비꽃의 '겸손·숨은 사랑' 꽃말이 나온 근거처럼 자주 인용되는 두 행이라, meanings.csv 제비꽃 행과 함께 놓으면 꽃말의 출처가 화면에서 닫힌다.
- **확인**: 미검증(적재 전 대조 필수)

---

#### ㉟ q-lit-iris-isemonogatari

- **flower_id**: `iris`
- **excerpt_type**: `classic`
- **text_ko**: 입어 길든 당의처럼 / 정든 아내를 두고 왔기에 / 이토록 멀리까지 온 / 이 여행이 사무친다
- **text_original**: から衣 きつつなれにし つましあれば はるばる来ぬる 旅をしぞ思ふ
- **author**: 『이세 이야기』 9단(아리와라노 나리히라로 전해짐)
- **source_title**: 『伊勢物語』 9단 「東下り」
- **source_url**: https://ja.wikisource.org/wiki/伊勢物語
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `10c` · **tags**: `remembrance|comfort|anniversary`
- **pd_basis**: 10세기 성립, 작자 미상 → 만료.
- **editorial_note**: 🌟 미카와의 야쓰하시(여덟 다리)에 붓꽃이 흐드러진 것을 보고, 일행이 **"かきつばた 다섯 글자를 각 구 첫머리에 넣어 나그네의 마음을 읊어 보라"** 고 청해 지은 노래. か·き·つ·は·た가 각 구 첫 소리로 숨어 있는 아크로스틱이라, **번역으로는 그 장치가 절대 살지 않는다 — 원문 병기가 필수인 항목.** 노래를 듣고 다들 말린 밥 위에 눈물을 떨궈 밥이 불었다는 대목이 이어진다. / **종 주의**: かきつばた는 제비붓꽃(*Iris laevigata*)으로, flowers.csv `iris`의 더치 아이리스(*I. × hollandica*)와 다르다 — 같은 붓꽃속이므로 종 차이를 각주에 밝히고 싣는다(iris 행이 이미 오리스 뿌리·백합 문장 설에서 같은 처리를 하고 있다). **source_url이 작품 목차라 9단 개별 페이지로 좁힐 것.**
- **확인**: 검색확인

---

#### ㊱ q-lit-iris-winterstale

- **flower_id**: `iris`
- **excerpt_type**: `play`
- **text_ko**: 온갖 백합들, 붓꽃도 그중 하나지요.
- **text_original**: lilies of all kinds, / The flower-de-luce being one!
- **author**: 윌리엄 셰익스피어
- **source_title**: 『겨울 이야기』 4막 4장 (페르디타)
- **source_url**: http://shakespeare.mit.edu/winters_tale/winters_tale.4.4.html
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1611` · **tags**: `celebration|gratitude`
- **pd_basis**: 셰익스피어 1564–1616 사망 → 만료.
- **editorial_note**: `flower-de-luce`는 fleur-de-lis, 곧 붓꽃이다. **셰익스피어가 붓꽃을 백합의 한 갈래로 세고 있다**는 것이 이 한 줄의 값 — 기존 `story-iris`의 「프랑스 왕가의 백합은 백합이 아니었다」가 주장하는 바로 그 혼동이 1611년 희곡에 실물로 남아 있는 셈이다. 그 story와 이 발췌를 붙이면 §1.5i의 "이야기가 먼저, 근거는 각주로" 위계가 그대로 산다. ⑳·㊲과 같은 장면(페르디타의 꽃 목록)이므로 **셋 중 하나만 노출**할 것.
- **확인**: 직접열람

---

#### ㊲ q-lit-marigold-winterstale

- **flower_id**: `marigold`
- **excerpt_type**: `play`
- **text_ko**: 해와 함께 잠자리에 들고 / 해와 함께 울며 일어나는 금잔화.
- **text_original**: The marigold, that goes to bed wi' the sun / And with him rises weeping
- **author**: 윌리엄 셰익스피어
- **source_title**: 『겨울 이야기』 4막 4장 (페르디타)
- **source_url**: http://shakespeare.mit.edu/winters_tale/winters_tale.4.4.html
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1611` · **tags**: `comfort|just_because`
- **pd_basis**: 셰익스피어 1564–1616 사망 → 만료.
- **editorial_note**: **종 주의(중요)** — 영어 `marigold`는 셰익스피어 당시 금잔화(*Calendula officinalis*)를 가리켰고, 카탈로그 `marigold`의 만수국(*Tagetes erecta*)은 아메리카 원산이라 유럽에 막 들어오던 참이었다. **flowers.csv `marigold` 행이 이미 "ASPCA의 마리골드 항목은 전부 금잔화이고 Tagetes는 등재돼 있지 않다"는 같은 불일치를 기록해 두었다** — 안전 데이터에서 이미 다룬 종 혼동이 문학에서도 똑같이 반복된다는 사실을 각주로 이으면, 서비스가 같은 함정을 두 번 정직하게 처리한 셈이 된다. 번역에서 일부러 '금잔화'로 옮긴 이유가 이것이니, **'마리골드'로 고치지 말 것.** ⑳·㊱과 같은 장면이므로 셋 중 하나만 노출.
- **확인**: 직접열람

---

#### ㊳ q-lit-poppy-mccrae

- **flower_id**: `corn-poppy`
- **excerpt_type**: `poem`
- **text_ko**: 플랑드르 들판에 개양귀비가 흔들린다 / 십자가와 십자가 사이, 줄줄이 늘어선 그 사이로
- **text_original**: In Flanders fields the poppies blow / Between the crosses, row on row,
- **author**: 존 매크레이
- **source_title**: 〈In Flanders Fields〉(1915, 《Punch》 12월 8일자)
- **source_url**: https://en.wikisource.org/wiki/In_Flanders_Fields_and_Other_Poems/John_McCrae
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1915` · **tags**: `remembrance|comfort`
- **pd_basis**: 매크레이 1872–1918 사망 → 만료.
- **editorial_note**: ⚠️ **중복 주의** — 기존 `story-poppy-in-flanders-fields`(「1915년 5월의 시 한 편」)가 이 시의 성립 경위를 이미 서사로 다룬다. ㉔(도연명)과 같은 처리: story는 사연을, 이 항목은 원문 두 행을 담당하되 **같은 화면에 동시 노출 금지.** / 1915년 5월 3일 이프르에서 전사한 동료 헬머 중위의 장례를 치른 뒤 쓴 시. 서양에서 개양귀비가 추모의 꽃이 된 출발점이며, flowers.csv `corn-poppy`가 아편 양귀비와 다른 종임을 밝혀 둔 것과 함께 쓰면 오해도 함께 풀린다.
- **확인**: 검색확인

---

#### ㊴ q-lit-poppy-soseki

- **flower_id**: `corn-poppy`
- **excerpt_type**: `novel`
- **text_ko**: (소개문) 나쓰메 소세키가 1907년 아사히신문에 연재한 장편 소설의 제목이 『우미인초(虞美人草)』입니다. 우미인초는 개양귀비를 부르는 한자 이름이에요.
- **text_original**: (없음 — 소개문)
- **author**: 나쓰메 소세키
- **source_title**: 『虞美人草』(1907)
- **source_url**: https://ja.wikisource.org/wiki/虞美人草
- **license**: `pd`(원전) · **translator**: (공란) · **소개문 작성**: `dearbloom`
- **era**: `1907` · **tags**: `just_because`
- **pd_basis**: 소세키 1867–1916 사망 → 만료. **원문 발췌도 법적으로 가능하나, 이번 리서치에서 본문을 직접 열람하지 못해 소개문으로만 처리했다.**
- **editorial_note**: 기존 `story-corn-poppy-yumeijin`(「우미인의 무덤에 핀 꽃」)이 항우와 우미인 설화를 다루므로, 그 이름이 20세기 소설 제목으로 이어졌다는 사실만 한 줄로 잇는다. **후속**: ja.wikisource 본문을 열어 개양귀비가 실제로 묘사되는 대목이 있으면 2~3문장 발췌로 승격 가능(PD라 발췌 제약 없음). 지금 상태로는 §1.5k의 "현대 작품은 제목·작가 소개만" 취급과 같은 형태지만, **소세키는 PD이므로 '현대 작품이라 발췌 못 한다'고 적으면 안 된다** — 각주는 "아직 원문을 확인하지 못했다"가 아니라 그냥 소개로 두면 된다.
- **확인**: 검색확인(제목·연도·연재처만)

---

#### ㊵ q-lit-jasmine-lycidas

- **flower_id**: `jasmine`
- **excerpt_type**: `poem`
- **text_ko**: 일찍 피어 홀로 지는 앵초를 가져오라, / 송이진 크로토와 창백한 재스민을,
- **text_original**: Bring the rathe primrose that forsaken dies, / The tufted crow-toe, and pale jessamine,
- **author**: 존 밀턴
- **source_title**: 〈Lycidas〉(1638)
- **source_url**: https://en.wikisource.org/wiki/Lycidas
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1638` · **tags**: `remembrance|comfort`
- **pd_basis**: 밀턴 1608–1674 사망 → 만료.
- **editorial_note**: 바다에서 죽은 친구의 관에 꽃을 뿌리라는 만가(輓歌)의 꽃 목록. 재스민이 **애도의 꽃**으로 놓인 드문 자리라, 기존 `story-jasmine` 4건(저녁 여섯 시·나라꽃·페르시아 어원·이름만 같은 다른 꽃)이 전부 밝은 쪽인 것을 보완한다. / ㊶과 **같은 문단의 인접 두 행**을 나눠 쓴 것이므로, 두 항목이 한 화면에 같이 뜨면 문장이 잘린 티가 난다 — **조회에서 상호 배제 필수.** `jessamine`은 jasmine의 옛 철자. `crow-toe`는 오늘날 무슨 꽃인지 학설이 갈린다(히아신스류·미나리아재비류 등) — 그래서 음차로 두었다. **source_url 본문 열람 실패(위키문헌 페이지에 본문이 안 실려 있었다) — 적재 전 구텐베르크 밀턴 시집으로 대조 필수.**
- **확인**: 검색확인

---

#### ㊶ q-lit-pansy-lycidas

- **flower_id**: `pansy`
- **excerpt_type**: `poem`
- **text_ko**: 흰 패랭이와, 검은 얼룩이 든 팬지를.
- **text_original**: The white pink, and the pansy freak'd with jet.
- **author**: 존 밀턴
- **source_title**: 〈Lycidas〉(1638)
- **source_url**: https://en.wikisource.org/wiki/Lycidas
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `1638` · **tags**: `remembrance|comfort`
- **pd_basis**: 밀턴 1608–1674 사망 → 만료.
- **editorial_note**: **팬지 발췌를 밀턴으로 잡은 이유는 중복 회피다** — 셰익스피어 쪽 팬지 대목 두 개(『한여름 밤의 꿈』 사랑 묘약, 『햄릿』 오필리아의 "there's pansies, that's for thoughts")는 **기존 `story-pansy-midsummer`·`story-pansy-ophelia`가 이미 서사로 다루고 있어**, 발췌까지 같은 작품으로 잡으면 팬지 화면이 셰익스피어로만 채워진다. / `freak'd with jet`는 흑옥(jet) 빛 얼룩이 튀어 있다는 뜻으로, 팬지 특유의 검은 무늬를 정확히 묘사한 표현이다. `pink`는 분홍색이 아니라 **패랭이꽃(Dianthus)** — 오역 주의(그래서 번역에 '흰 패랭이'로 못 박았다). ㊵과 상호 배제. ㊵과 같은 source_url 대조 필요.
- **확인**: 검색확인

---

#### ㊷ q-lit-cosmos-yundongju

- **flower_id**: `cosmos`
- **excerpt_type**: `poem`
- **text_ko**: 청초(淸楚)한 코스모스는 / 오직 하나인 나의 아가씨, // 코스모스는 / 귀또리 울음에도 수줍어지고,
- **text_original**: (동일 — 한국어 원전)
- **author**: 윤동주
- **source_title**: 〈코스모스〉(1938)
- **source_url**: https://ko.wikisource.org/wiki/코스모스_(윤동주)
- **license**: `pd` · **translator**: (공란 — 한국어 원전)
- **era**: `1938` · **tags**: `confession|just_because`
- **pd_basis**: 윤동주 1917–1945 사망 → 만료. 한국어 위키문헌도 PD로 게시.
- **editorial_note**: 🌟 **코스모스 문학의 유일한 PD 후보이자 최적해.** 기존 `story-cosmos` 3건(이름 어원·초콜릿 코스모스·말 사료에 섞여 건너온 경위)이 전부 history이고, flowers.csv `cosmos` 편집 노트가 "한국 도입 시기·경위는 1차 자료를 찾지 못해 이야기로 만들지 않음"이라고 적어 둔 바로 그 빈자리를 시가 메운다 — **1938년에 이미 한국 시인이 코스모스를 노래하고 있었다는 것 자체가 도입 시기의 하한선 증거**이므로, 각주에 그 사실을 얹으면 §7 후속 과제에도 한 걸음 답이 된다. / 발췌는 1·3연(비연속)이라 `//`로 연 건너뜀을 표시했다. 한자 병기 `淸楚`는 원문 그대로 두되 화면에서는 소형 처리 권장. ⑲와 같은 시인이므로 한 화면 동시 노출 금지.
- **확인**: 직접열람

---

#### ㊸ q-lit-magnolia-wangwei

- **flower_id**: `magnolia`
- **excerpt_type**: `poem`
- **text_ko**: 가지 끝의 부용 같은 꽃이 / 산속에서 붉은 봉오리를 연다 / 골짜기 집에는 인기척 하나 없고 / 꽃은 하염없이 피었다가 진다
- **text_original**: 木末芙蓉花，山中發紅萼。澗戶寂無人，紛紛開且落。
- **author**: 왕유
- **source_title**: 『망천집』 〈辛夷塢〉(신이오)
- **source_url**: https://www.gushiwen.cn/gushiwen_fcde3c8887.aspx
- **license**: `pd` · **translator**: `dearbloom`
- **era**: `8c` · **tags**: `comfort|just_because`
- **pd_basis**: 왕유 699–761 사망 → 만료.
- **editorial_note**: 辛夷(신이)가 곧 목련이다. 5언 절구 전체가 20자뿐이라 4구를 다 실어도 발췌 한도 안에 든다. **보는 사람 하나 없는 골짜기에서 꽃이 저 혼자 피었다 지는** 장면으로, flowers.csv `magnolia`의 "잎보다 꽃이 먼저 나오는 꽃"·"꽃잎이 잘 멍드니 손으로 만지지 않는 게 좋아요"와 결이 그대로 이어진다. 기존 `story-magnolia` 4건 중 문학이 없어 비어 있던 자리. / **종 주의**: 왕유의 辛夷는 자주색 목련(*Magnolia liliiflora*) 계열로 보는 견해가 유력해, 카탈로그의 한국 자생 목련(*M. kobus*)과 종이 다르다 — 원문이 `紅萼`(붉은 꽃받침)이라 적은 것이 그 근거다. 같은 목련속이므로 종 차이를 각주로 밝히고 싣는다.
- **확인**: 검색확인

---

## 4. 보류 — 확인 필요 3건 (적재 금지, Advisor 판단 대상)

| 후보 | flower_id | 보류 사유 | 필요한 조치 |
|---|---|---|---|
| 워즈워스 〈To the Small Celandine〉(1807) | `ranunculus` | ① 기존 `story-ranunculus-wordsworth-celandine`과 **작품 자체가 겹친다**(㉔·㊳ 같은 story/발췌 분업으로 풀 수는 있음) ② 소애기똥풀(*Ficaria verna*, 옛 학명 *Ranunculus ficaria*)은 **현재 라넌큘러스속에서 분리된 별속**이라 종 근거가 다른 항목들보다 약하다 ③ 원문 미대조 | 위키문헌 『Poems』(1815) Vol.2에서 원문 확보 후, 속 분리 사실을 각주로 감당할지 Advisor가 결정 |
| 셰익스피어 『사랑의 헛수고』 5막 2장 "cuckoo-buds of yellow hue" | `ranunculus` | cuckoo-buds가 미나리아재비(buttercup)인지 황새냉이인지 **식물 동정이 학계에서 갈린다.** 카탈로그가 종 불일치를 매번 밝혀 온 문화상, 동정 자체가 불확실한 인용은 기준 미달 | 확정 근거를 못 찾으면 폐기 권고 |
| 중국 민요 〈茉莉花(鮮花調)〉 | `jasmine` | 전승 가락·18세기 유통은 PD가 맞고 1804년 존 배로 『Travels in China』·1821년 『小蕙集』 공척보 기록도 확인됐으나, **오늘날 부르는 가사·선율은 1957년 何仿(허팡, 2013년 사망) 정리본**이라 그 형태를 인용하면 저작권이 걸린다 | 1821년 『小蕙集』 또는 1804년 배로 기록의 **원 가사**를 확보해야만 사용 가능. 못 구하면 §2-1 "불확실하면 제외" 원칙대로 폐기 |

**현재 본표에 라넌큘러스는 없다** — 두 후보 중 하나가 살아나야 커버가 26/31에서 27/31이 된다.

---

## 5. 제외 목록 — 12건

### 5-1. 저작권 보호 중 (발췌 절대 금지)

| 작품 | 작가 | 몰년 | 보호 만료 | 비고 |
|---|---|---|---|---|
| 〈국화 옆에서〉 | 서정주 | 2000 | **2070** | 한국에서 국화 하면 가장 먼저 떠오르는 시. 인지도가 높을수록 무단 인용 유혹이 크니 **제외 목록 최상단에 박아 둔다** |
| 〈꽃〉("내가 그의 이름을 불러 주었을 때") | 김춘수 | 2004 | **2074** | 꽃을 소재로 한 한국 현대시의 대표. 절대 금지 |
| 〈4월의 노래〉(목련) | 박목월 | 1978 | **2048** | magnolia 후보였으나 보호 중 |
| 〈풀〉 | 김수영 | 1968 | **2038** | |
| 〈승무〉 | 조지훈 | 1968 | **2038** | |
| 〈행복〉 등 | 유치환 | 1967 | **2037** | |
| 〈풀꽃〉 | 나태주 | 생존 | — | |
| 『민들레의 영토』 등 꽃 시편 | 이해인 | 생존 | — | freesia 후보로 검토했으나 금지 |

→ **위 작가들은 §1.5k의 "현대 작품은 제목·작가 소개만" 규정에 따라 소개문(license=`original`)으로는 언급 가능하다.** 다만 절제 원칙(§1.5e) 때문에 이번 적재분에는 넣지 않았다 — 확정 43행으로 26종이 채워지고, 나머지 5종은 §6 권고대로 블록 생략이 맞다고 보기 때문이다.

### 5-2. 번역 저작권 때문에 제외 (원문은 PD)

| 대상 | 사유 |
|---|---|
| 성경 개역한글·개역개정·새번역·공동번역 | 대한성서공회 저작권. ⑥·㉒는 **KJV 영문에서 자체 번역**했다 |
| 셰익스피어 한국어 번역본(최재서·신정옥·이상섭 등) | 역자 저작권 존속. ③·⑳·㉝·㊱·㊲ 전부 자체 번역 |
| 김정희 〈수선화〉 국립중앙박물관 2006년 간행 번역문 | 검색 상위에 그대로 노출되는 문장이라 실수 위험이 가장 크다. ㉗은 한자 원문에서 새로 옮겼다 |
| 한시·와카·라틴어 기존 번역서 전반 | 원전 PD ≠ 번역 PD. 본 문서의 모든 외국어 항목은 자체 번역 |

### 5-3. PD이지만 카탈로그 31종과 매칭 실패

| 대상 | 사유 |
|---|---|
| 헌화가(『삼국유사』) | 절벽의 꽃은 **철쭉**(*Rhododendron schlippenbachii* 계열)으로 카탈로그에 없다. 브리프가 후보로 지목했으나 flower_id를 붙일 수 없어 제외 |
| 이매창 〈이화우 흩뿌릴 제〉 | **배꽃**. 카탈로그 없음 |
| 황진이 시조 | 꽃을 소재로 한 확실한 시조를 특정하지 못함 |
| 정지용 | ko.wikisource가 PD로 게시(1902–1950 사망, 사후 70년 경과). **저작권상 사용 가능**하나 카탈로그 31종과 맞는 꽃 시를 찾지 못해 이번 회차 제외 — 브리프의 "불확실하면 제외" 대상이 아니라 **매칭 실패**임을 분명히 해 둔다 |
| 헤르만 헤세 | 1877–1962 사망 → **한국 기준 1963년 이전 사망이므로 PD**(독일에서는 2032년까지 보호). 한국 서비스라 사용 가능하나 31종과 맞는 꽃 작품을 특정하지 못함 |
| 이육사 〈광야〉 | PD이나 꽃은 **매화**. 카탈로그 없음 |
| 김소월 〈진달래꽃〉 | PD이나 **진달래**. 카탈로그 없음. 〈산유화〉는 §1.5e 목 데이터가 이미 쓰고 있고 특정 꽃이 아니라 flower_id 공란 유지 |

---

## 6. 문학 미커버 5종 — 처리 권고

| flower_id | 상황 | 권고 |
|---|---|---|
| `freesia` | 1866년 명명. 고전 문학에 등장하지 않는다. PD 후보 0건 | **UI 블록 생략.** §1.5k가 "있을 때만"이라고 이미 정해 두었으므로 억지로 채우지 말 것 |
| `gerbera` | 1889년 명명. 동일 | 동일 |
| `babys-breath` | 18세기 명명이나 문학 등장 사실상 없음. 기존 `story-krbouquet-babysbreath-half`(서울신문 칼럼)가 문학 자리를 대신하고 있다 | 동일 |
| `poinsettia` | 1825년 서구 도입. 멕시코 노체부에나 전설은 **설화**라 stories.csv 관할(`story-poinsettia-*` 2건이 이미 다룬다) | 동일 |
| `ranunculus` | 후보 2건이 모두 §4 보류(작품 중복 + 속 분리 / 식물 동정 불확실) | Advisor가 §4를 판정할 때까지 미커버. 보류 건이 살아나면 커버는 27/31이 된다 |

> 편집팀이 쓴 채움 문장(license=`original`)을 넣는 방안도 있으나 **권고하지 않는다.** §1.5e의 "검증된 인용만" 원칙과, 문학 블록에 문학이 아닌 걸 넣는 위화감 때문이다.

---

## 7. 기존 stories.csv literary 17행과의 관계

`story_type=literary` 17행은 **문학을 소재로 한 이야기**이고, 이번 43행은 **문학 원문 발췌**다. 역할이 다르므로 병존하지만, 아래 3쌍은 **같은 작품**이라 동시 노출을 막아야 한다.

| 발췌 | 겹치는 story | 처리 |
|---|---|---|
| ㉔ 도연명 〈飲酒〉 5수 | `story-chrysanthemum-tao-yuanming` | 상세 시트에서 택1. 국화 발췌는 ㉓(이정보) 우선 |
| ㊳ 매크레이 〈In Flanders Fields〉 | `story-poppy-in-flanders-fields` | 상세 시트에서 택1 |
| ㉝ 햄릿 오필리아 | `story-pansy-ophelia` + 기존 `q-003` | 3자 동시 노출 금지. 특히 q-003과는 **같은 대사** |

작가 중복(같은 작가가 한 화면에 두 번)을 막아야 하는 조합:

- 셰익스피어 6건(③⑳㉝㊱㊲ + q-003) — 조회에서 작가 단위 dedupe 필요
- 블레이크 2건(⑦⑱) · 워즈워스 2건(㉖㉞) + `story-ranunculus-wordsworth-celandine`
- 오비디우스 3건(⑨⑪㉕) · 윤동주 2건(⑲㊷) · 밀턴 2건(㊵㊶, 인접 행이라 특히 중요)

**적재 worker 권고**: `pickQuote` 계열 조회에 **author 단위 dedupe + story_id 상호배제 목록**을 함께 넣을 것. 데이터만 넣고 조회를 손보지 않으면 같은 화면에 셰익스피어가 두 번 뜬다.

---

## 8. 적재 worker 체크리스트

1. `content/quotes.csv` 헤더에 `flower_id,excerpt_type,text_original,translator,pd_basis` 5개 컬럼 추가 (§3-1). `excerpt_type`에 `classic` 을 허용할지 **Advisor 승인 먼저 받을 것**
2. 기존 3행(q-001~q-003)은 새 컬럼을 공란으로 채워 유지
3. §3-2의 43개 블록을 그대로 전사. `reviewed_at`=`2026-08-15`, 리뷰어=`content-team`
4. **`확인: 검색확인` / `미검증` 항목의 source_url을 열어 원문 대조** — 특히 ㉞(미검증), ⑦⑱(구텐베르크 대조), ⑭㉔(ctext URL 미대조), ㊵㊶(위키문헌 본문 미확보), ②⑩㉘(URL 안정성 낮음)
5. 각주 필수 항목이 §1.5d 톤으로 화면에 나가는지 확인: ㉜(생강나무) · ㉒(성경 이름 이전) · ㊲(금잔화≠마리골드) · ㉑(용담속 차이) · ④⑬⑭㉗㉟㊸(종 차이)
6. 조회 로직에 author dedupe + §7 상호배제 반영
7. **한국어 번역문은 전부 이 문서의 것을 그대로 쓸 것.** 더 매끄럽게 다듬고 싶으면 새로 쓰되, 어떤 기존 번역서·웹 번역도 참조하지 말 것

---

## 9. 출처 목록

**한국 원전**
[윤동주 〈코스모스〉(위키문헌)](https://ko.wikisource.org/wiki/%EC%BD%94%EC%8A%A4%EB%AA%A8%EC%8A%A4_(%EC%9C%A4%EB%8F%99%EC%A3%BC)) · [윤동주 〈해바라기 얼굴〉(위키문헌)](https://ko.wikisource.org/wiki/%ED%95%98%EB%8A%98%EA%B3%BC_%EB%B0%94%EB%9E%8C%EA%B3%BC_%EB%B3%84%EA%B3%BC_%EC%8B%9C_(1955%EB%85%84)/%ED%95%B4%EB%B0%94%EB%9D%BC%EA%B8%B0_%EC%96%BC%EA%B5%B4) · [김유정 「동백꽃」(위키문헌)](https://ko.wikisource.org/wiki/%EB%8F%99%EB%B0%B1%EA%BD%83) · [한용운 〈해당화〉(위키문헌)](https://ko.wikisource.org/wiki/%EB%8B%98%EC%9D%98_%EC%B9%A8%EB%AC%B5/%ED%95%B4%EB%8B%B9%ED%99%94) · [김영랑 〈모란이 피기까지는〉(위키문헌)](https://ko.wikisource.org/wiki/%EC%98%81%EB%9E%91%EC%8B%9C%EC%A7%91/%EB%AA%A8%EB%9E%80%EC%9D%B4_%ED%94%BC%EA%B8%B0%EA%B9%8C%EC%A7%80%EB%8A%94) · [저자:정지용(위키문헌)](https://ko.wikisource.org/wiki/%EC%A0%80%EC%9E%90:%EC%A0%95%EC%A7%80%EC%9A%A9) · [이정보 시조(경상일보 한분옥 칼럼)](https://www.ksilbo.co.kr/news/articleView.html?idxno=1011091) · [김정희 수선화(한국일보)](https://www.hankookilbo.com/News/Read/201801180749181241)

**한문·일본 원전**
[詩經 鄭風 溱洧(中國哲學書電子化計劃)](https://ctext.org/book-of-poetry/zhen-wei/zh) · [王維 辛夷塢(古詩文網)](https://www.gushiwen.cn/gushiwen_fcde3c8887.aspx) · [白居易 紫陽花(古詩文網)](https://www.gushiwen.cn/gushiwen_276e4924f3.aspx) · [黃庭堅 水仙花(古詩文網)](https://m.gushiwen.cn/shiwenv_9d81716ac50d.aspx) · [蘇軾 山茶(廣羣芳譜 卷041, 中文維基文庫)](https://zh.wikisource.org/wiki/%E5%BB%A3%E7%BE%A3%E8%8A%B3%E8%AD%9C/%E5%8D%B7041) · [李白 清平調(古詩文網)](https://m.gushiwen.cn/shiwenv_5f5bb7012052.aspx) · [飲酒·其五(中文維基百科)](https://zh.wikipedia.org/zh-hant/%E9%A3%B2%E9%85%92%C2%B7%E5%85%B6%E4%BA%94) · [伊勢物語 東下り(伊勢物語 全章徹底解読)](https://ise.kaisetsuvoice.com/009.html) · [古今和歌集 53番](https://scrapbox.io/kokin/%E4%B8%96%E3%81%AE%E4%B8%AD%E3%81%AB%E3%81%9F%E3%81%88%E3%81%A6%E6%A1%9C%E3%81%AE%E3%81%AA%E3%81%8B%E3%82%8A%E3%81%9B%E3%81%B0%E6%98%A5%E3%81%AE%E5%BF%83%E3%81%AF%E3%81%AE%E3%81%A9%E3%81%91%E3%81%8B%E3%82%89%E3%81%BE%E3%81%97) · [笈の小文 53句(芭蕉翁顕彰会)](https://www.basho-bp.jp/?page_id=24) · [茉莉花 (民歌)(中文維基百科)](https://zh.wikipedia.org/zh-hant/%E8%8C%89%E8%8E%89%E8%8A%B1_(%E6%B0%91%E6%AD%8C))

**서양 원전**
[Ovid Metamorphoses III(The Latin Library)](https://www.thelatinlibrary.com/ovid/ovid.met3.shtml) · [Ovid Metamorphoses X(The Latin Library)](https://www.thelatinlibrary.com/ovid/ovid.met10.shtml) · [The Winter's Tale 4.4(MIT Shakespeare)](http://shakespeare.mit.edu/winters_tale/winters_tale.4.4.html) · [Hamlet 4.5(Folger)](https://www.folger.edu/explore/shakespeares-works/hamlet/read/4/5/) · [Poems and Songs of Robert Burns(Gutenberg #1279)](https://www.gutenberg.org/ebooks/1279) · [Poems of William Blake(Gutenberg #1934)](https://www.gutenberg.org/cache/epub/1934/pg1934.txt) · [The Complete Angler(Gutenberg #9198)](https://www.gutenberg.org/files/9198/9198-h/9198-h.htm) · [The Anatomy of Melancholy(exclassics)](https://www.exclassics.com/anatomy/anatomy1.pdf) · [Rubaiyat 5th ed.(Wikisource)](https://en.wikisource.org/wiki/The_Rubaiyat_of_Omar_Khayyam_(tr._Fitzgerald,_5th_edition)) · [Poems (Wordsworth, 1815) — I wandered lonely(Wikisource)](https://en.wikisource.org/wiki/Poems_(Wordsworth,_1815)/Volume_1/I_wandered_lonely) · [Maud, Part I(Poetry Foundation)](https://www.poetryfoundation.org/poems/45367/maud-part-i) · [Fringed Gentian(Lit2Go, 1891 2집)](https://etc.usf.edu/lit2go/115/the-poems-of-emily-dickinson-series-two/4497/nature-poem-48-fringed-gentian/) · [The Keepsake(Poeticous)](https://www.poeticous.com/samuel-taylor-coleridge/the-keepsake) · [Ah! Sun-flower(americanliterature.com)](https://americanliterature.com/author/william-blake/book/songs-of-experience/ah-sun-flower) · [In Flanders Fields and Other Poems(Wikisource)](https://en.wikisource.org/wiki/In_Flanders_Fields_and_Other_Poems/John_McCrae) · [Lavender's Blue(Wikipedia)](https://en.wikipedia.org/wiki/Lavender%27s_Blue) · [Rilke Grabspruch](https://www.gedichte-lyrik-poesie.de/grabspruch-rilke.html)

**저작권 근거**
[한국저작권위원회 — 저작재산권의 보호기간](https://www.copyright.or.kr/information-materials/common-sense/basic-knowledge/index.do?jspName=08) · [공유마당 — 만료저작물](https://gongu.copyright.or.kr/gongu/main/contents.do?menuNo=200091) · [퍼블릭 도메인(한국어 위키백과)](https://ko.wikipedia.org/wiki/%ED%8D%BC%EB%B8%94%EB%A6%AD_%EB%8F%84%EB%A9%94%EC%9D%B8) · [KJV 저작권 상태](https://workingfortheword.com/episodes-chirho/166-the-kjv-is-still-restricted-by-copyright)
