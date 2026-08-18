# 색별 꽃말 확충 조사 기록 (seed-v8, 2026-08-18)

`content/meanings.csv` 를 305행 → **369행**(신규 64행)으로 늘리면서 실제로 열어 본 자료,
채택·제외 판단, 그리고 **끝내 못 채운 칸과 그 사유**를 남긴다.
같은 회차에 기존 13행의 **출처 표기 오류를 정정**했다(§9).

조사는 두 라운드로 나뉜다. **1라운드**(54행)는 하나코토바·퍼블릭 도메인 원전 중심,
**2라운드**(10행)는 Advisor 지시로 19세기 꽃말집을 그리너웨이·뒤몽 **밖으로** 넓히고
서양 문화 항목을 보탠 것이다. 2라운드의 목적 절반은 **출처 쏠림을 푸는 것**이었다 —
하나코토바 비중이 83%(45/54) → **72%(46/64)** 로 내려갔다.

이번 회차는 앞선 회차들과 목표가 다르다. 지금까지는 "이 꽃에 어떤 꽃말이 있나"를 모았다면,
이번에는 **결과 화면 색 칩이 그 색의 꽃말을 못 찾아 폴백으로 내려가는 칸**을 메우는 것이 전부다.
그래서 조사 단위가 꽃이 아니라 **(꽃, 색) 조합**이다.

기준은 `docs/meanings-research.md`(seed-v2) §1·§2 를 그대로 잇는다 — 출처 URL 필수,
설명 문장은 전부 자체 작성, 라이선스가 불확실한 공공 자료는 단어만 참조.

---

## 1. 먼저 실측한 것 — 어느 칸이 비어 있었나

`flowers.csv` 59종의 `colors`(파이프 목록)와 `meanings.csv` 의 `color` 가 채워진 행을 대조했다.

| | 조합 수 |
|---|---|
| 도감 59종이 파는 색 전수 (`flowers.colors` 원소 합) | **279** |
| 그중 그 색의 꽃말 행이 **있던** 칸 (조사 전) | 86 |
| 그중 그 색의 꽃말 행이 **없던** 칸 = 폴백이 뜨던 칸 (조사 전) | **193** |
| 이번 회차가 새로 채운 칸 | **45** |
| **남은 빈 칸** | **148** |

신규 64행 중 **45행이 빈 칸을 메우고**, 11행은 이미 채운 칸에 **다른 문화권의 상반된 읽기**를
나란히 세우며(§5-6), 4행은 도감 색 목록 **밖**의 색이다(§7).

색이 전부 채워진 꽃은 조사 전 2종(`rose-red`·`mimosa`)뿐이었고, 지금은 **9종**이다 —
`rose-red` `mimosa` `freesia` `lily-asiatic` `gerbera` `hyacinth` `camellia` `hydrangea` `carnation`.
`tulip-white` 은 크림 한 칸만 남겨 두고 채워졌다. 정확한 잔여 목록은 §6.

우선순위는 브리프대로 ⑴ `rules.csv` 가점이 많아 결과 3안에 자주 서는 꽃
(freesia·gerbera·tulip-white·peony 가 각 4행으로 최다, rose-red 는 3행 전부 85점 이상)
⑵ 색 수가 많은 꽃 순으로 잡았다. 실제로는 **자료가 있는 곳**이 우선순위를 다시 뒤집었다 —
아래 §5 가 그 기록이다.

### 재현용 실측 스크립트

```js
// flowers.csv 의 colors × meanings.csv 의 color 가 채워진 행을 대조한다.
const have = {};                       // flower_id → Set(color)
for (const r of meanings) (have[r.flower_id] ??= new Set()).add((r.color ?? '').trim());
for (const f of flowers)
  for (const c of f.colors.split('|').filter(Boolean))
    if (!have[f.id]?.has(c)) gaps.push([f.id, c]);
```

---

## 2. 출처 기준 — 무엇을 받아들이고 무엇을 물렸나

색별 꽃말은 근거 없는 통설이 유난히 많다. 이번 회차가 통과시킨 자료는 네 갈래뿐이다.

| 갈래 | 이번 회차의 자료 | 판단 |
|---|---|---|
| 퍼블릭 도메인 원전 | Kate Greenaway *Language of Flowers*(1884), Henrietta Dumont(1851) | **색별 항목이 실재하는 유일한 서양 1차 자료.** 그리너웨이는 색·품종을 가른 표제어가 59개다 |
| 하나코토바 자료 | `hananokotoba.com`(花言葉-由来) | 이 저장소가 seed-v6·v7 에서 이미 46행의 근거로 쓴 곳. **색별의 花言葉 표를 갖춘 거의 유일한 자료**다 |
| 잡지 기획 | 쇼가쿠칸 Domani 수국 기사 | seed-v6 이 이미 흰색·파랑·초록 행의 근거로 쓴 곳. 보라·빨강 묶음이 남아 있었다 |
| 박물관 | 고궁박물원(故宮博物院) 어휘 항목 `魏紫` | 모란 색 품종의 내력을 기관이 직접 적은 자료 |

**물린 것**

- 꽃집·쇼핑몰 블로그의 "색깔별 꽃말 총정리" 류 — 서로 베낀 흔적만 있고 1차 자료가 없다.
  이번 회차 신규 행 54개 중 이 갈래에서 온 것은 **0**이다.
- ⚠ **기존 `suncheonbay-birth-flowers` 13행의 출처 표기가 틀려 있었다.**
  이 `source_id` 의 `source_url` 은 punycode 를 풀면 `www.로얄플라워.kr` 이고,
  페이지 제목은 「365일 탄생화 이야기 | 한국화훼유통협회 로얄플라워」 — **꽃 쇼핑몰**이다.
  `source_id` 가 가리키는 "순천만"과 실제 도메인이 어긋났다.
  이번 회차 기준으로는 단독 근거로 못 쓸 자료라 **신규 행에는 한 번도 쓰지 않았고**,
  기존 13행은 Advisor 승인 아래 **출처 표기만** 정정했다. → **§9**

---

## 3. 공공데이터포털 API — 시도했고, 막혔다

브리프가 짚은 `DATA_GO_API_KEY`(공공데이터포털)로 농촌진흥청 계열
**「오늘의 꽃 조회 서비스」**(`apis.data.go.kr/1390804/NihhsTodayFlowerInfo01`)를 두 번 호출했다.
인코딩 키·디코딩 키 양쪽 모두 같은 응답이었다.

```xml
<errMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</errMsg>
<returnAuthMsg>등록되지 않은 서비스키</returnAuthMsg>
<returnReasonCode>30</returnReasonCode>
```

- 이 키는 저장소 안 어디에서도 참조되지 않는다(`grep -r DATA_GO_API_KEY` 결과 `.env` 뿐).
  포털에서 이 서비스에 **활용신청을 따로 해야** 열린다.
- **설령 열렸어도 이번 조사에는 쓸모가 얕다.** 이 API 는 `fmonth`·`fday` 로 조회하는
  **날짜별** 오늘의 꽃이라 색 축이 아예 없다. 색별 꽃말은 나오지 않는다.
- **라이선스(문서에 남기라는 항목).** 공공데이터포털 「오늘의 꽃 조회 서비스(2.0)」의
  이용허락범위는 **저작자표시-비영리-동일조건변경허락(CC BY-NC-SA)** 이다
  (`docs/meanings-research.md` §2 에서 이미 확인한 값). 상업 서비스에는 그대로 실을 수 없다.
- 국립원예특작과학원 꽃말사전 페이지는 여전히 **공공누리 유형 배지가 없다**(유형 미확정).
  seed-v2 가 세운 선례 — `nihhs-*` 로 묶고 **단어만 참조, 문장은 자체 작성** — 를 그대로 둔다.
  이번 회차는 `nihhs-*` 행을 새로 만들지 않았다.
- 키 값은 이 문서·커밋·로그 어디에도 싣지 않았다. 위 호출은 `.env` 에서 읽어 셸 변수로만 넘겼다.

---

## 4. 열람한 자료 목록

| source_id | 자료 | URL | 이번 회차 쓰임 |
|---|---|---|---|
| `greenaway-1884` | Kate Greenaway, *Language of Flowers*(1884) | https://www.gutenberg.org/ebooks/31591 | 색별 표제어 6행 |
| `dumont-1851` | Henrietta Dumont, *The Language of Flowers*(1851) | https://www.gutenberg.org/ebooks/71779 | 대조용(채택 0 — §5-2) |
| `hanakotoba-yurai-*` | 花言葉-由来 각 꽃 페이지 | `https://hananokotoba.com/<slug>/` | 색별 45행 |
| `domani-ajisai` | 쇼가쿠칸 Domani 「紫陽花の花言葉」 | https://domani.shogakukan.co.jp/651207 | 수국 보라·빨강 2행 |
| `dpm-weizi` | 고궁박물원 어휘 항목 「魏紫」 | https://www.dpm.org.cn/lemmas/243389.html | 모란 보라 1행 |
| `nongmin-2022` | 농민신문 「노랑 프리지어 '열정' '성공'…분홍 튤립 '애정' '배려'」(박준하, 2022-02-14) | https://www.nongmin.com/article/20220214351093 | 장미 주황 1행(§7) |

**2라운드에서 더한 자료** — 19세기 꽃말집을 그리너웨이·뒤몽 밖으로 넓히고, 서양 문화 항목을 보탰다.

| source_id | 자료 | URL | 이번 회차 쓰임 |
|---|---|---|---|
| `wirt-1832` | Elizabeth Wirt, *Flora's Dictionary*(1832) | https://archive.org/details/florasdictionary00wirtrich | 데이지 빨강 1행 + 프리뮬러 보라 보강 |
| `ildrewe-1865` | Miss Ildrewe, *The Language of Flowers*(1865) | https://archive.org/details/languageflowers00ildr | 스카비오사 보라 · 흰 장미 · 흰 제비꽃 3행 |
| `cambridge-green-carnation` | 케임브리지대 도서관 특별컬렉션 블로그(Liam Sims, 2014-10-16) | https://specialcollections-blog.lib.cam.ac.uk/?p=8848 | 카네이션 초록 1행 |
| `ppu-white-poppy` | 평화서약연맹(Peace Pledge Union) 흰 양귀비 공식 안내 | https://www.ppu.org.uk/remembrance/white-poppies-frequently-asked-questions | 개양귀비 흰색 1행 |
| `hankookilbo-kimsideok` | 한국일보 — 김시덕(을지대 장례지도학과) | https://www.hankookilbo.com/news/article/A2026032409580004302 | 국화 흰색 1행 |
| `kipling-blue-roses` | 키플링협회 독자 안내 「Blue Roses」 | https://www.kiplingsociety.co.uk/readers-guide/rg_blueroses1.htm | 장미 파랑 1행(§7) |

`hananokotoba.com` 슬러그는 함정이 있다. 확인한 것만 적어 둔다:
`hinageshi` → **404**, 개양귀비는 `poppy`. `torukokikyou` → **404**, 리시안셔스는 `lisianthus`.
아이리스는 `iris` 한 장이 アヤメ·カキツバタ·ハナショウブ 를 함께 다룬다.
프리뮬러(`primula`)와 サクラソウ(`sakurasou`)는 별개 페이지다.

**URL 전수 생존 확인**: 신규 54행이 가리키는 **고유 URL 25개**를 `curl` 로 전부 조회해 **모두 200**
(조사 중 열어 본 27개 전수 확인 — 그중 2개는 최종적으로 채택하지 않았다). `source_url` 빈칸 0.

---

## 5. 채운 표 — 신규 64행 (1라운드 54 + 2라운드 10)

`C` = confidence_level (`R` repeated / `V` varies / `S` single_source) · `경고` = `caution_note` 채운 행

### 5-1. 퍼블릭 도메인 원전에서 온 6행

빅토리아 원전에는 **아직 안 캔 색 표제어가 남아 있었다.** seed-v2·v6 이 장미·튤립·백합·
히아신스 쪽만 훑고 지나간 자리다.

| 그리너웨이 1884 표제어 | 옮긴 자리 | 종(種) 주의 |
|---|---|---|
| `Pink, Carnation — Woman's love` | 카네이션 **분홍** | Greenaway 의 `Pink` 는 패랭이꽃(Dianthus) 총칭, 그중 카네이션형 |
| `Larkspur, Purple — Haughtiness` | 델피니움 **보라** | 같은 책이 분홍에 Fickleness — 우리 표에 이미 있는 행 |
| `Jasmine, Yellow — Grace and elegance` | 재스민 **노랑** | 옛 사전의 노란 재스민은 *Jasminum humile* 계열, 도감은 *J. sambac* |
| `Cowslip — Pensiveness. Winning grace.` | 프리뮬러 **노랑** | 카우슬립은 *Primula veris*, 도감은 *P. vulgaris* |
| `Polyanthus, Lilac — Confidence` | 프리뮬러 **보라** | 폴리안투스는 *Primula × polyantha* — 도감 프리뮬러의 재배 계통 |
| `Geranium, Silver-leaved — Recall` | 제라늄 **복색** | **잎** 무늬 품종이다. 꽃 무늬가 아니라는 사실을 `caution_note` 에 밝혔다 |

`lilac` 은 색 어휘 밖이라 가장 가까운 `purple` 로 옮겼다(seed-v4 선례 그대로).

### 5-2. 뒤몽 1851 — 열었으나 채택 0

뒤몽의 꽃 사전에는 색 표제어가 **`Day-Lily, Yellow` · `Pink, Yellow` · `Rose, White` ·
`Rose, Yellow` · `Poppy, White` · `Lilac, White` 여섯 개뿐**이고, 그중 우리 도감에 걸리는
칸은 전부 이미 채워져 있었다. 유일하게 새로울 뻔한 `Rose, White — Silence`
(그리너웨이의 `I am worthy of you` 와 정반대)는 **빈 칸이 아니라** 이번 회차 목표 밖이라 물렸다.
→ 다음 회차가 "대비쌍 보강"을 하겠다면 첫 후보다.

### 5-3. 농민신문 2022 — 열었으나 채택 0

색별 꽃말을 한국어 신문 기획으로 확인할 수 있는 드문 자료라 다시 열었다.
장미 빨강·주황·노랑, 튤립 빨강·분홍·노랑, 프리지어 노랑을 적는데 —

- 튤립 노랑(희망)·프리지어 노랑·튤립 분홍은 **이미 이 기사로 채워진 행**이다(seed-v6).
- 장미 **주황**(수줍은 고백)은 `rose-red` 의 `colors`(`red|pink|yellow|white`)에 없는 색이다 → §7.
- 장미 노랑(완벽한 성취)은 빈 칸이 아니다.

### 5-4. 1라운드 표 (54행)

<!-- 이 표는 meanings.csv 의 seed-v8 행 중 1라운드분을 뽑아 생성했다.
     2라운드 10행은 §5-7·§5-8·§7 에 따로 적었다. -->

**카네이션** `carnation`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 분홍 | 여자의 사랑 | uk / victorian | `greenaway-1884` | R |  |
| 분홍 | 당신을 잊지 않을게요 | western / modern | `hanakotoba-yurai-carnation` | S |  |
| 보라 | 자부심과 기품 | japan / modern | `hanakotoba-yurai-carnation` | S |  |
| 보라 | 변덕 — 마음이 자주 바뀌는 사람 | western / modern | `hanakotoba-yurai-carnation` | V | ○ |

**델피니움** `delphinium`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 보라 | 거만함 — 고개를 빳빳이 든 마음 | uk / victorian | `greenaway-1884` | S | ○ |

**재스민** `jasmine`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 노랑 | 우아함과 품위 | uk / victorian | `greenaway-1884` | R |  |

**프리뮬러** `primula`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 노랑 | 생각에 잠긴 마음 | uk / victorian | `greenaway-1884` | S |  |
| 보라 | 믿음 — 마음을 놓아도 되는 사람 | uk / victorian | `greenaway-1884` | R |  |

**제라늄** `geranium`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 흰색 | 나는 당신의 사랑을 믿지 않아요 | japan / modern | `hanakotoba-yurai-geranium` | V | ○ |
| 복색 | 다시 불러 주세요 | uk / victorian | `greenaway-1884` | S | ○ |

**아시아틱 백합** `lily-asiatic`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 분홍 | 허영심 | japan / modern | `hanakotoba-yurai-lily` | S | ○ |
| 분홍 | 부와 번영 | western / modern | `hanakotoba-yurai-lily` | V | ○ |

**흰 튤립** `tulip-white`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 보라 | 변치 않는 사랑 | japan / modern | `hanakotoba-yurai-tulip` | S |  |
| 보라 | 왕의 색 | western / modern | `hanakotoba-yurai-tulip` | S |  |

**프리지아** `freesia`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 빨강 | 순결 | japan / modern | `hanakotoba-yurai-freesia` | S |  |

**거베라** `gerbera`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 빨강 | 신비 | japan / modern | `hanakotoba-yurai-gerbera` | S |  |
| 빨강 | 정열과 사랑 | western / modern | `hanakotoba-yurai-gerbera` | S |  |
| 노랑 | 더없는 아름다움, 그리고 쉽게 다가갈 수 있는 사람 | japan / modern | `hanakotoba-yurai-gerbera` | S |  |
| 노랑 | 햇살 같은 다정함 | western / modern | `hanakotoba-yurai-gerbera` | S |  |
| 주황 | 참을성 — 견디는 마음 | japan / modern | `hanakotoba-yurai-gerbera` | S |  |
| 주황 | 당신은 나의 햇살입니다 | western / modern | `hanakotoba-yurai-gerbera` | S |  |

**글라디올러스** `gladiolus`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 빨강 | 굳건함, 그리고 조심스러움 | japan / modern | `hanakotoba-yurai-gladiolus` | S |  |
| 분홍 | 쉬지 않는 노력, 한결같은 사랑 | japan / modern | `hanakotoba-yurai-gladiolus` | S |  |

**팬지** `pansy`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 보라 | 생각이 깊은 사람 | japan / modern | `hanakotoba-yurai-pansy` | S |  |
| 보라 | 당신 생각으로 머리가 가득해요 | western / modern | `hanakotoba-yurai-pansy` | S |  |
| 노랑 | 조촐한 행복 — 들판에서 얻는 기쁨 | japan / modern | `hanakotoba-yurai-pansy` | S |  |
| 흰색 | 온순함 | japan / modern | `hanakotoba-yurai-pansy` | S |  |
| 흰색 | 사랑을 떠올리는 마음 | western / modern | `hanakotoba-yurai-pansy` | S |  |

**과꽃** `aster`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 빨강 | 변화를 반기는 마음 | japan / modern | `hanakotoba-yurai-ezogiku` | S |  |
| 분홍 | 달콤한 꿈 | japan / modern | `hanakotoba-yurai-ezogiku` | S |  |
| 파랑 | 믿어요, 다만 조금 걱정도 돼요 | japan / modern | `hanakotoba-yurai-ezogiku` | S |  |
| 보라 | 사랑의 승리 — 내 사랑이 더 깊어요 | japan / modern | `hanakotoba-yurai-ezogiku` | S |  |

**알스트로메리아** `alstroemeria`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 빨강 | 찾아온 행복 | japan / modern | `hanakotoba-yurai-alstroemeria` | S |  |
| 흰색 | 늠름함 | japan / modern | `hanakotoba-yurai-alstroemeria` | S |  |

**코스모스** `cosmos`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 흰색 | 우아함 | japan / modern | `hanakotoba-yurai-cosmos` | S |  |

**스토크** `stock`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 빨강 | 나를 믿어 주세요 | japan / modern | `hanakotoba-yurai-stock` | S |  |
| 분홍 | 품이 넉넉한 사랑 | japan / modern | `hanakotoba-yurai-stock` | S |  |
| 보라 | 너그러운 사랑 | japan / modern | `hanakotoba-yurai-stock` | S |  |

**스타티스** `statice`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 분홍 | 영원불변 — 처음 그대로 | japan / modern | `hanakotoba-yurai-statice` | S |  |

**아네모네** `anemone`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 보라 | 당신을 믿고 기다립니다 | japan / modern | `hanakotoba-yurai-anemone` | S |  |

**히아신스** `hyacinth`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 빨강 | 시샘 | japan / modern | `hanakotoba-yurai-hyacinth` | V | ○ |

**동백** `camellia`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 분홍 | 드러내지 않는 아름다움 | japan / modern | `hanakotoba-yurai-tsubaki` | S |  |
| 분홍 | 그리움 | western / modern | `hanakotoba-yurai-tsubaki` | S |  |

**제비꽃** `violet`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 흰색 | 천진한 사랑 | japan / modern | `hanakotoba-yurai-sumire` | S |  |
| 흰색 | 솔직함, 그리고 티 없음 | western / modern | `hanakotoba-yurai-sumire` | S |  |

**안개꽃** `babys-breath`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 분홍 | 간절한 바람, 그리고 벅찬 마음 | japan / modern | `hanakotoba-yurai-kasumisou` | S |  |

**데이지** `daisy`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 빨강 | 무의식 — 나도 모르게 드러나는 마음 | japan / modern | `hanakotoba-yurai-daisy` | S |  |

**수선화** `narcissus`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 흰색 | 멋지게 차려입은 모습 | japan / modern | `hanakotoba-yurai-suisen` | S |  |

**시클라멘** `cyclamen`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 분홍 | 동경 — 멀리서 바라보는 마음 | japan / modern | `hanakotoba-yurai-cyclamen` | S |  |

**크로커스** `crocus`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 보라 | 사랑의 후회 | japan / modern | `hanakotoba-yurai-crocus` | S | ○ |
| 노랑 | 나를 믿어 주세요 | japan / modern | `hanakotoba-yurai-crocus` | S |  |

**수국** `hydrangea`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 보라 | 지적이고 신비로운 사람 | japan / modern | `domani-ajisai` | S |  |
| 빨강 | 씩씩한 사람, 그리고 강한 애정 | japan / modern | `domani-ajisai` | S |  |

**작약** `peony`

| 색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 보라 | 위씨 집안의 자주 모란 — 네 명품 중 하나 | china / 11c | `dpm-weizi` | S |  |

### 5-5. 경고 꽃말 — 1라운드 8행 (회차 전체는 12행)

브리프가 짚은 대로 "선물할 때 조심할 색"을 피하지 않았다.
2라운드가 4행을 더 보탰다 — 초록 카네이션(염색) · 보라 스카비오사(애도) ·
흰 양귀비(붉은 양귀비와 경쟁하는 상징) · 파란 장미(염색).

| 꽃·색 | 꽃말 | 왜 경고인가 |
|---|---|---|
| 카네이션 **보라** | 변덕 | 일본은 기품, 영어권은 변덕 — 같은 색이 정반대로 갈린다 |
| 델피니움 **보라** | 거만함 | 윗사람·감사 자리에 어긋난다 |
| 제라늄 **흰색** | 나는 당신의 사랑을 믿지 않아요 | 고백·화해 자리에 정면으로 어긋난다 |
| 제라늄 **복색** | 다시 불러 주세요 | 뜻이 아니라 **색의 근거**가 경고다 — 꽃이 아니라 잎 무늬 품종 |
| 백합 **분홍** ×2 | 허영심 ↔ 부와 번영 | 문화권별 정반대 |
| 히아신스 **빨강** | 시샘 | 마음을 전하는 자리에 어긋난다 |
| 크로커스 **보라** | 사랑의 후회 | 고백 자리에 어긋난다 |

기존 표의 노란 카네이션(경멸)·노란 장미(질투↔우정)·보라 히아신스(애도)는 이미 채워져 있어
이번 회차 대상이 아니었다.

### 5-6. 이번 회차가 만든 대비쌍

| 대비 | 한쪽 | 다른 쪽 |
|---|---|---|
| **분홍 백합** | 일본 — 허영심 | 영어권 — 부와 번영 |
| **보라 카네이션** | 일본 — 자부심과 기품 | 영어권 — 변덕 |
| **붉은 거베라** | 일본 — 신비 | 영어권 — 정열과 사랑 |
| **노란 거베라** | 영어권 — 햇살 같은 다정함 | (기존 계보) 빅토리아의 노랑 = 질투 |
| **질투가 얹히는 색** | 일본 — **붉은** 히아신스 | 영어권 — **노란** 히아신스(기존 행) |
| **보라 튤립** | 일본 — 변치 않는 사랑 | 영어권 — 왕의 색 |
| **흰 제비꽃** | 일본 — 천진한 사랑 | 영어권 — 솔직함·티 없음 |

특히 **히아신스**는 같은 뜻(질투)이 문화권마다 **다른 색에 얹힌** 사례라, 색 칩이
"이 색의 말"을 보여 준다는 화면 약속을 시험하는 좋은 표본이다.

### 5-7. 2라운드 — 19세기 꽃말집 전수 훑기와 서양 문화 항목 (10행)

퍼블릭 도메인 꽃말집 **6권을 내려받아 색 표제어를 전수 세었다.** 그리너웨이·뒤몽만으로는
서양 색별 꽃말이 바닥났기 때문이다.

| 책 | 내려받은 텍스트 | 크기 | 색 표제어 |
|---|---|---|---|
| Greenaway 1884 (기존) | Gutenberg #31591 | 134 KB | 59 |
| **Wirt, *Flora's Dictionary*(1832)** | `florasdictionary00wirtrich_djvu.txt` | 756 KB | 46 |
| **Hale, *Flora's Interpreter*** | `florasinterprete00hale_djvu.txt` | 353 KB | 16 |
| **Ingram, *Flora Symbolica*(1869)** | `florasymbolica00ingr_djvu.txt` | 740 KB | 19 |
| **Burke, *The Illustrated Language of Flowers*(1856)** | `illustratedlang00burkgoog_djvu.txt` | 73 KB | 17 |
| **Shoberl(1836)** | `languageflowers00shob_djvu.txt` | 330 KB | 뜻→꽃 색인만 |
| **Miss Ildrewe(1865)** | `languageflowers00ildr_djvu.txt` | 227 KB | 뜻→꽃 색인 |

**결론: 다섯 권이 거의 같은 목록을 돌려 쓴다.** Wirt·Hale·Ingram·Burke 의 색 표제어는
그리너웨이와 꽃 종류가 겹친다(Acacia · Auricula · Catchfly · Chrysanthemum · Clover ·
Columbine · Daisy · Hyacinth · Jasmine · Larkspur · Lilac · Lily · Periwinkle · Pink ·
Polyanthus · Poppy · Primrose · Rose · Tulip · Violet). **새로 건진 것은 셋뿐이다.**

| 발견 | 책 | 원문 | 값어치 |
|---|---|---|---|
| **스카비오사 보라** | Ildrewe 1865 | `Mourning, Purple Scabious, or Mourning Bride` | **빈 칸을 메웠다.** Mourning Bride 는 우리 도감과 같은 종(*Scabiosa atropurpurea*)의 옛 이름이고 종소명이 곧 짙은 자주다 |
| **데이지 빨강** | Wirt 1832 | `DAISY, Red — Beauty unknown to the possessor` | 하나코토바의 赤いデイジー「無意識」에 **빅토리아 조상**이 있었다. 두 계보가 겹쳐 `repeated` 로 올렸다 |
| **흰 장미 = 침묵** | Ildrewe 1865 | `WHITE ROSE (Rosa alba). Silence.` | 그리너웨이의 `I am worthy of you` 와 정면으로 갈린다(§5-2 에서 다음 회차 첫 후보로 적어 둔 항목) |

**부수 소득 — 1라운드의 서술 하나를 스스로 뒤집었다.** 흰 제비꽃 행에 "빅토리아 원전으로는
뒷받침되지 않는다"고 적었는데, Ildrewe 가 `Candor, White Violet` 을, Hale 이 표제어
`Violet, White`(*Viola blanda*) = MODESTY 를 갖고 있었다. 그 행의 출처를 하나코토바에서
**Ildrewe 1865 로 옮기고** `single_source` → `repeated` 로 고쳤다.
프리뮬러 보라 행도 Wirt 의 `POLYANTHOS, Lilac Coloured. Confidence.` 로 근거를 하나 더 얻었다
(같은 쪽이 *"The Cowslip, Polyanthus, Primrose, Auricula, etc., are all of this family"* 라
적어 프리뮬러 무리임을 자료 스스로 밝힌다 — 우리가 카우슬립을 노랑 자리에 둔 판단도 함께 받친다).

**⚠ 함정 — 성인력(聖人曆)을 꽃말로 착각하지 말 것.** Wirt·Shoberl·Ingram 에는
`21. Crocus, white, Crocus albus, St. Servianus, Bishop` `5. Hellebore, green, Helleborus
viridis, St. Adrian` 같은 줄이 무더기로 있다. 색 표제어처럼 보이지만 **날짜마다 꽃과 성인을
짝지은 달력**이지 꽃말이 아니다. 크로커스 흰색·헬레보어 초록은 이 줄들 때문에 채워질 뻔했고,
확인 끝에 **빈 칸으로 남겼다.**

### 5-8. 2라운드 서양 문화 항목 (표)

| 꽃·색 | 꽃말 | 문화권·시대 | 출처 | C | 경고 |
|---|---|---|---|---|---|
| 카네이션 **초록** | 아는 사람끼리 알아보는 표식 | uk / 19c | `cambridge-green-carnation` | V | ○ |
| 스카비오사 **보라** | 애도 — 떠나보낸 이를 생각하며 | uk / 19c | `ildrewe-1865` | S | ○ |
| 데이지 **빨강** | 본인은 모르는 아름다움 | uk / 19c | `wirt-1832` | R | |
| 장미 **흰색** | 침묵 — 말하지 않기로 한 것 | uk / 19c | `ildrewe-1865` | V | |
| 개양귀비 **흰색** | 모든 전쟁의 희생자를 함께 기억하는 흰 양귀비 | uk / modern | `ppu-white-poppy` | V | ○ |
| 국화 **흰색** | 장례식장의 흰 국화 — 생각보다 짧은 관습 | korea / modern | `hankookilbo-kimsideok` | V | |

**초록 카네이션**은 1892년 「윈더미어 부인의 부채」 개막 밤이 출전이다. 케임브리지대 도서관은
뜻이 *"still debated"* 라고 못 박고 두 읽기를 나란히 둔다 — 그래서 `varies` 다. 같은 글의
*"had to be dyed green by the florist"* 를 `caution_note` 로 옮겼다(자연에 없는 색이다).

**흰 양귀비**는 붉은 양귀비와 **경쟁하는 상징**이다. 두 색이 같은 꽃에서 서로 다른 추모를
말하는, 이 서비스가 보여 줄 값어치가 가장 큰 색 대비다. 그리너웨이의 `White Poppy — Sleep`
은 이 20세기 상징과 무관한 별개 계보라 기존 행을 건드리지 않고 나란히 세웠다.

**흰 국화**는 기존 행(조문의 꽃)이 오래된 전통처럼 읽히는 것을 바로잡는 행이다. 을지대
장례지도학과 김시덕 교수는 *"한국의 장례식장에 꽃장식이 본격 등장한 건 20년쯤 전부터"* 이고
*"꽃이 국화여야 한다는 규정이나 관습, 문화는 어디에도 없다"* 고 적는다. 관습은 실재하되
뿌리가 얕다는 사실을 데이터가 말하게 했다.

**2라운드에서 근거가 서지 않아 버린 것** — 보라 카네이션 = 변덕(19세기 꽃말집 10권 전수
검색 결과 **0건**. 우리 표의 보라 카네이션 행은 하나코토바의 영어 꽃말이 근거이지
빅토리아 원전이 아니다) · 파란 카네이션의 꽃말(1996년에야 생긴 꽃이라 전승이 없다) ·
물망초의 흰색·분홍 꽃말(원전 0건, 유통 마케팅) · 파란 장미의 "중국·페르시아 관용구"(1차 자료 없음).

---

## 6. 못 채운 칸 — 148개와 그 사유

**찾아도 없는 것은 비워 두었다. 그 색의 꽃말이 확인되지 않는다는 것도 조사 결과다.**

### 6-1. 색 자체가 어느 전통에도 꽃말을 갖지 않는 경우 (구조적)

| 색 | 남은 칸 | 확인한 사실 |
|---|---|---|
| **크림** | 18 | 그리너웨이 1884 본문에 `cream` **0회**. 뒤몽 1851 은 1회지만 시 구절(`The cream of love`)이고 표제어가 아니다. `hananokotoba.com` 에도 クリーム 색 항목이 없다. → **크림은 유통 색이지 꽃말 색이 아니다** |
| **자주(magenta)** | 5 | 두 원전에 `magenta` **0회**. 하나코토바에도 없다 |
| **코랄** | 1 | 그리너웨이의 `coral` 3회는 전부 `Coral Honeysuckle`(종 이름)이라 색이 아니다 |
| **갈색** | 3 | 색 표제어 없음 |
| **복색(variegated)** | 4 | 그리너웨이에 `Tulip, Variegated`·`Pink, Variegated`·`Carnation, Striped` 세 개뿐이고 전부 이미 채워져 있다 |

이 다섯 색이 남은 150칸 중 **31칸**을 차지한다. 자료가 늘어난다고 채워질 종류가 아니다.

### 6-2. 그 꽃에 색별 꽃말 전통이 없는 경우

`hananokotoba.com` 을 42종 전수로 열어 **색별の花言葉 표가 있는지 없는지를 직접 확인**했다.
아래는 **표 자체가 없던 꽃**이다(추측이 아니라 확인된 부재).

| 꽃 | 남은 칸 | 확인 |
|---|---|---|
| 달리아 | 8 | 색별 표 없음. 그리너웨이도 `Dahlia — Instability` 한 줄뿐 |
| 라넌큘러스 | 7 | 색별 표 없음. 그리너웨이는 `Garden`·`Wild` 로 **색이 아니라 계통**을 가른다 |
| 백일홍 | 6 | 색별 표 없음 |
| 스카비오사 | ~~6~~ **5** | 하나코토바에는 색별 표가 없다. **보라만 2라운드에서 메웠다** — Ildrewe 1865 의 `Mourning, Purple Scabious`(§5-7) |
| 스위트피 | 5 | 색별 표 없음 |
| 아마릴리스 | 5 | 색별 표 없음 |
| 수련 | 5 | 색별 표 없음. "흰 꽃이 많아 청순"이라는 총론뿐 |
| 헬레보어 | 4 | 색별 표 없음 |
| 리시안셔스 | 4 | 색별 표 없음 |
| 부바르디아 | 4 | 색별 표 없음 |
| 해바라기 | 3 | 색별 표 없음 |
| 금잔화 | 3 | 색별 표 없음 |
| 수레국화 | 3 | 색별 표 없음("섬세함이 **파란** 꽃빛에서 왔다"는 총론만) |
| 목련 | 3 | 페이지가 白木蓮·紫木蓮 을 **소개만** 하고 꽃말은 가르지 않는다 |
| 벚꽃 · 물망초 · 라벤더 · 은방울꽃 · 치자 | 각 1~2 | 색별 표 없음 |
| 아이리스 | 4 | 색이 아니라 **종별**(ジャーマンアイリス·カキツバタ·ハナショウブ)로 가른다 |

### 6-3. 색별 표는 있으나 그 색만 빠진 경우

| 꽃 | 빈 색 | 확인 |
|---|---|---|
| 수국 | — | 채웠다. 다만 `hananokotoba.com` 쪽은 **흰색 한 줄뿐**이고, 나머지는 Domani 기사에서 왔다 |
| 안개꽃 | 크림 | 분홍만 있다 |
| 개양귀비 | 주황·분홍·보라 | 赤·白 만 있고, 黄 은 **영어 꽃말만** 있는데 개양귀비 `colors` 에 노랑이 없다 |
| 진달래 | 분홍·보라·자주 | 赤·白 만 있다 |
| 안스리움 | 주황·초록·복색 | 赤·白·ピンク 만 있다(전부 기존 행) |
| 크로커스 | 흰색 | 紫·黄 만 있다 |
| 시클라멘 | 보라 | 赤·白·ピンク 만 있다 |
| 매화 | 분홍·빨강 | 白梅 만 있다(기존 행). 紅梅 항목이 없다 |
| 국화 | 보라·분홍·주황·초록 | 赤·白·黄 만 있고 셋 다 이미 채워져 있다 |
| 스타티스 | 파랑·빨강·흰색 | 紫·ピンク·黄 만 있다 |
| 과꽃 | 노랑 | 赤·ピンク·白·青·紫 5색이 전부다 |
| 팬지 | 파랑·빨강·주황 | 紫·黄·白 3색이 전부다 |
| 제라늄 | 주황 | 赤·ピンク·白·黄·緋色 5색이 전부다 |
| 제비꽃 | 분홍 | 紫·白·黄(+영어 青) 이 전부다 |
| 데이지 | 분홍 | 赤·白 만 있다 |
| 스토크 | 크림 | 5색이 있으나 크림은 없다 |
| 마리골드 | 갈색·크림 | 黄(건강)·オレンジ(예언)가 있으나 **둘 다 이미 채워진 칸**이다 |

### 6-4. 근거가 얕아 **일부러 물린 것**

| 후보 | 사유 |
|---|---|
| 스카비오사 **보라** = 불행한 사랑 | 하나코토바 본문은 "서양에서 보라 꽃에 슬픈 꽃말이 많다"고 **총론**으로만 적고, 스카비오사 자체의 색별 표는 없다. 총론을 색별 행으로 승격하면 지어내는 것이 된다 |
| 수련 **흰색** = 청순 | "야생 수련이 대개 흰 꽃이라 청순이라는 총론이 붙었다"는 서술이라, 흰색 **한정**의 꽃말이 아니다. 게다가 수련 흰색은 이미 채워져 있다 |
| 마리골드 **노랑** = 건강(하나코토바) | 빈 칸이 아니다. 다만 기존 노랑 행(빅토리아 = 질투)과 정면으로 갈리는 대비쌍이라 **다음 회차 1순위** |
| 수선화 **노랑** = 한 번 더 사랑해 주세요 | 빈 칸이 아니다(그리너웨이 Jonquil 행이 이미 있다) |
| 포인세티아 색별 | 색별 표가 없다. "주홍빛 선명함에서 왔다"는 **유래**는 있으나 이미 빨강 행이 있다 |
| 목련 **보라**(자목련) | 페이지가 품종만 소개하고 꽃말을 가르지 않는다 |
| 매화 **빨강**(紅梅) | 별도로 일본어 자료를 뒤졌으나 紅梅/白梅 의 꽃말을 가르는 글은 전부 수공예·원예 블로그(minne·creema·GreenSnap)였다. 기관 자료로 걸린 것은 ⑴ 도시샤여자대학 칼럼 「紅梅の基礎知識」 — **꽃말이 아니라 헤이안 시대 색 이름(紅梅色·襲の色目)** 이야기 ⑵ 오가타 고린 「紅白梅図屛風」(국보) — 미술품이라 꽃말이 아니다. → 미수록 |
| 국화 **초록**·달리아 각색 등 꽃집 "색깔별 총정리" 글 | 1차 자료 없이 서로 베낀 글만 나온다 → 전부 미수록 |

---

## 7. 색 어휘 밖 4행 — 선례 방식으로 실었다 (`flowers.colors` 는 늘리지 않았다)

1라운드는 `flowers.colors` 안의 색만 썼다. 2라운드에서 Advisor 판단에 따라
**`content/README.md` 가 이미 정한 선례** — *"`flowers.colors` 에 없는 색의 꽃말도 실을 수
있다(자료가 먼저 앞서갈 수 있다). 다만 색 선택 UI 는 `flowers.colors` 를 기준으로 그리므로,
그런 행은 `editorial_note` 에 그 사실을 남긴다"* — 로 4행을 실었다.

**`flowers.csv` 는 건드리지 않았다.** 색 칩 UI 가 그 목록으로 서기 때문에, 도감에 `blue` 를
더하는 순간 **유통 실물에 없는 파란 장미 칩**이 생긴다.

| 꽃 | 색 | 꽃말 | 출처 | C |
|---|---|---|---|---|
| `rose-red` | **blue** | 이룰 수 없는 것 — 그래서 더 오래 남는 바람 | `kipling-blue-roses` | V |
| `rose-red` | **orange** | 수줍은 고백 | `nongmin-2022` | S |
| `cosmos` | **red** | 애정, 그리고 어울림 | `hanakotoba-yurai-cosmos` | S |
| `corn-poppy` | **yellow** | 풍요, 그리고 이룸 | `hanakotoba-yurai-poppy` | S |

네 행 모두 `editorial_note` 가 `⚠ flowers.csv 의 … colors 에 … 가 없다 — README 가 허용한
'자료가 앞서간 행'이라 색 칩에는 오르지 않는다` 로 시작해 스스로를 밝힌다.

### 파란 장미 — 이 행의 값어치 절반은 `caution_note` 다

`caution_note` = **"파란 장미는 자연에 없어요 — 꽃집에서 파는 파란 장미는 흰 장미를 물들이거나
착색한 것입니다"**. 근거는 셋을 겹쳐 확인했다.

- 장미는 델피니딘을 만드는 **flavonoid 3′,5′-hydroxylase 가 없어** 파란 계열이 나오지 않는다
  (Katsumoto et al. 2007, *Plant and Cell Physiology* 48(11):1589–1600).
- 2004년 산토리·플로리진이 그 유전자를 넣은 **Applause** 를 내놓았지만, 미국화학회 매체가
  *"many people have pointed out that Applause is actually mauve"* 라고 짚는다 — 실제 빛깔은 연보라다.
- 꽃말 자체는 **키플링**에서 왔다. 「Blue Roses」(1887, 뒤에 *The Light That Failed* 의 제사)를
  키플링협회 독자 안내가 *"There were no blue roses. It was an impossible quest."* 라고 푼다.

흔히 도는 **"중국·페르시아에서 파란 장미는 이룰 수 없는 사랑을 뜻한다"는 말은 싣지 않았다** —
꽃집 블로그 밖에서 1차 자료를 찾지 못했다. 19세기 꽃말집 10권에도 파란 장미 표제어가 아예
없는데, 없는 꽃에 뜻을 붙일 수는 없었기 때문이다.

**⚠ README 정정이 필요하다(내가 고치지 않았다).** `content/README.md` 의
"현재 어긋나는 행은 없다"는 문장은 이제 **사실이 아니다**. 어긋나는 행이 4개 생겼다.

---

## 8. Advisor 판단이 필요한 항목

1. **`content/README.md` 두 곳이 낡았다(내가 고치지 않았다).**
   ⑴ "현재 `flowers.colors` 와 어긋나는 행은 없다" → 이제 **4행 있다**(§7).
   ⑵ 회차 접두사 목록에 **`seed-v8:` 항목이 없다** — `meanings.csv` 64행이라고 더해야 한다.
   또 `meanings.csv` 행 수 표기가 305 → **369** 로 바뀐다.

2. **출처 쏠림은 줄었으나 여전히 하나코토바가 최다다.**
   64행 중 **46행(72%)** 이 `hananokotoba.com` 이다(1라운드 83% → 2라운드 뒤 72%).
   19세기 꽃말집 6권을 전수로 훑은 결과가 §5-7 인데, **다섯 권이 거의 같은 목록을 돌려 써서**
   새로 건진 색 표제어가 셋뿐이었다. 서양 색별 꽃말은 사실상 이 정도가 천장이라고 본다 —
   더 늘리려면 색 표제어가 아니라 **문화 항목**(초록 카네이션·흰 양귀비 같은)을 캐야 한다.

3. **한 (꽃,색) 에 두 행이 선 11칸.**
   `carnation/pink` `carnation/purple` `lily-asiatic/pink` `tulip-white/purple`
   `gerbera/red` `gerbera/yellow` `gerbera/orange` `pansy/purple` `pansy/white`
   `camellia/pink` `violet/white` 이 문화권이 갈려 각 2행이다.
   브리프의 "같은 색이라도 문화권 다르면 별행"을 따른 결과지만,
   **색 칩은 그중 하나만 보여 준다**(`explain.ts` 의 `findMeaning` 이 첫 일치 행을 잡는다).
   나머지 한 행은 결과 화면의 **나라별 꽃말 표**에서만 보인다.
   색 칩이 대비쌍을 함께 보여 줄지는 UI 판단이라 데이터만 갖춰 두었다.

4. **`dpm-weizi` 의 種 불일치.** 고궁박물원 `魏紫` 는 모란(*Paeonia × suffruticosa*)이고
   도감의 `peony` 는 작약(*P. lactiflora*)이다. 표에 이미 모란 행이 셋 있어 같은 자리에 두었지만,
   모란을 별도 `flower_id` 로 가르는 날이 오면 이 행도 함께 옮겨야 한다.
   흔히 따라붙는 **花后(꽃 중의 왕비)** 별칭은 고궁박물원 자료에 **없어서 싣지 않았다** —
   중국어권 대중 글에는 널리 도는 말이지만 기관 자료로 확인되지 않는다.

5. **공공데이터포털 키.** 「오늘의 꽃 조회 서비스」 활용신청이 안 돼 있다(§3).
   신청해도 CC BY-NC-SA 이고 날짜 축이라 색별 꽃말에는 쓸모가 얕다 — **신청 우선순위 낮음**.

---

## 9. 기존 13행 출처 표기 정정 (seed-v8)

Advisor 승인 아래 **출처 표기만** 고쳤다. `meaning_ko` · `color` · `culture_region` ·
`era` 는 한 글자도 건드리지 않았다.

### 무엇이 틀려 있었나

`docs/birth-flowers-research.md` §3 이 탄생화 표를 둘로 나눠 적어 두었다.

| 부호 | 자료 | 성격 |
|---|---|---|
| **A** | 순천만국가정원 「탄생화·탄생목」 PDF | 지자체(순천시) 간행물 · 365일 |
| **B** | 한국화훼유통협회 **로얄플라워** 「365일 탄생화 이야기」 | 쇼핑몰 · 366일 |

그리고 §5 가 **"기본값은 B(로얄플라워)다"** 라고 못 박는다.
그런데 `meanings.csv` 13행은 `source_id` 를 `suncheonbay-birth-flowers` 로,
`editorial_note` 를 "순천만 탄생화 표 …" 로 적으면서 **`source_url` 은 B 를 가리키고 있었다.**

### 실근거가 B(로얄플라워)라고 판정한 근거

1. `source_url` 이 처음부터 B 다(`www.로얄플라워.kr`, punycode `xn--oi2bpqy92ashbd12b.kr`).
2. **13행 중 4행의 메모가 영문명·학명을 인용한다** — 치자나무(**Cape Jasmine**) ·
   목화(**Cotton Plant**) · 진달래(**Azalea**) · 백일홍(**학명 Zinnia** 를 함께 적어 배롱나무와 갈랐다).
   §5 는 B 를 **"각 날에 영문·학명이 함께 붙어 있는 유일한 표"** 라고 적는다. A 에는 그 칸이 없다.
   → 조사자가 실제로 읽은 것은 B 다. 이름만 통칭으로 "순천만"이라 적은 것이다(§2 가 적어 두었듯
   날짜별 탄생화 목록 자체가 순천만 홈페이지에서 퍼진 계보라 그렇게 불리기 쉽다).

### 고친 내용

| 항목 | 전 | 후 |
|---|---|---|
| `source_id` (13행) | `suncheonbay-birth-flowers` | **`royalflower-birth-flowers`** |
| `editorial_note` (13행) | `순천만 탄생화 표 …` | **`로얄플라워(한국화훼유통협회 계열 쇼핑몰 · seed-v8 출처 정정) 탄생화 표 …`** |
| `source_url` | (B — 이미 옳았다) | 그대로 |
| `meaning_ko`·`color`·`culture_region`·`era`·`confidence_level` | — | **전부 그대로** |

대상 13행: `sweet-pea` · `gladiolus`(보라) · `zinnia` · `aster`(흰색) · `cyclamen` ·
`geranium`(빨강·분홍 2행) · `primula`(흰색) · `cornflower` · `crocus` · `gardenia` ·
`azalea` · `cotton`.

### `confidence_level` 점검 — 고칠 것이 없었다

로얄플라워가 **단독 근거인 행은 3행**뿐이고 셋 다 이미 `single_source` 로 정직하게 적혀 있었다.

| 행 | C | 근거 |
|---|---|---|
| `zinnia` 행복 | `single_source` | 로얄플라워 단독 ✓ |
| `primula`(흰색) 첫사랑 | `single_source` | 로얄플라워 단독(하나코토바 「青春の恋」은 "결이 이어진다"고만 적음) ✓ |
| `cotton` 우수 | `single_source` | 로얄플라워 단독 + 한자 미표기 유보 ✓ |
| 나머지 10행 | `repeated` | 전부 메모에 하나코토바·그리너웨이 등 **제2 근거가 적혀 있다** ✓ |

→ 쇼핑몰이 단독 근거인 자리는 이미 `single_source` 로 표시돼 있었다. **등급 조정 없음.**

### 표기 불일치 9행 — 행별 A/B 판정 후 정정 (3차)

`meanings.csv` 에는 **다른 `source_id` 를 쓰면서 메모에서 이 표를 "순천만 탄생화 표"라고
부르는 행이 9개 더** 있었다. 주 근거가 아니라 **대조·보강 근거**로 인용한 자리다.
일괄 치환하지 않고 **행마다 A(순천만 PDF)인지 B(로얄플라워)인지 판정**했다.

**판정 방법.** `birth-flowers-research.md` §3 이 두 표를 가르는 결정적 차이를 적어 두었다 —
**B 에만 `name_en`·`scientific_name` 칸이 있다**(§5: *"각 날에 영문·학명이 함께 붙어 있는
유일한 표"*). `birth_flowers.csv` 는 B 를 기본값으로 싣고 A 가 다를 때만 메모에 A 표기를
남겼으므로, 메모가 인용한 **날짜를 `birth_flowers.csv` 에서 찾아** 그 행이 영문·학명을
갖는지, A 표기가 따로 적혀 있는지를 보면 갈린다.

| # | 행 | 인용 날짜 | `birth_flowers.csv` 가 그 날에 가진 것 | 판정 |
|---|---|---|---|---|
| 1 | `dahlia` | 9/15 다알리아 · 화려함 | `scientific_name=Dahlia`. 메모: *"표가 학명 Dahlia 를 적어 두었다"* | **B** |
| 2 | `aster` | 4/22 과꽃 · 믿음직한 사랑 | `name_en=China Aster` | **B** |
| 3 | `calendula` | 8/24 금잔화 | `scientific_name=Calendula` — 이 행의 논지(금잔화 ↔ 만수국 가르기) 자체가 학명 칸에 기댄다 | **B** |
| 4 | `stock` | 5/6 **비단향나무꽃** | `name_en=Stock`. 메모가 **A 표기를 따로 적어 둔 자리다** — *"순천만 표 표기 — 이름 '비단향꽃무'"*. 즉 A 는 `비단향꽃무`, 채택(B)은 `비단향나무꽃` | **B (결정적)** |
| 5 | `delphinium` | 4/19 참제비고깔 · 청명 | `name_en=Larkspur` | **B** |
| 6 | `water-lily` | 4/27 · 5/8 수련 | `name_en=Water Lily` (두 날 모두) | **B** |
| 7 | `mimosa` | 1/26 미모사(**Humble Plant**) | `name_en=Humble Plant` — **메모가 영문명을 직접 인용한다.** A 에는 그 칸이 없다 | **B (결정적)** |
| 8 | `plum-blossom` | 10/24 매화 · 고결한 마음 | `scientific_name=Prunus mume` (메모: 원문 `Prunus Mume` 철자 교정) | **B** |
| 9 | `plum-blossom` | 12/27 매화 · 맑은 마음 | `scientific_name=Prunus mume` (같은 교정) | **B** |

**교차 검증 — A 가 채택된 날은 하나도 인용되지 않았다.** §5 는 B 를 물리고 A 를 채택한
예외가 **9/9 · 10/9 · 6/13 셋뿐**이라고 적는다. 위 10개 인용 날짜와 **교집합 0**이다.
9행 중 A 를 가리키는 메모는 **없다.**

→ 9행 전부 `editorial_note` 의 `순천만 탄생화 표` 를 13행과 **같은 문구**
(`로얄플라워(한국화훼유통협회 계열 쇼핑몰 · seed-v8 출처 정정) 탄생화 표`)로 고쳤다.
`source_id`(각 행의 주 출처)·꽃말·색·그 밖의 문구는 **불변**.

정정 후 `meanings.csv` 안에 "순천만" 이라는 낱말은 **0건**이고,
로얄플라워 표기는 **22건**(주 출처 13 + 보강 인용 9)으로 일치한다.
