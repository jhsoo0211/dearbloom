# 주간 콘텐츠 리서치 — 2026-09-21 (5회차)

## 0. 트랙 배분

브리프는 신규 꽃 2~4종(트랙 A) 또는 한국 유통 상위 꽃 심화(트랙 B) 중 실제 커버리지 공백을
보고 고르라고 지시했다. 결론은 **트랙 B(한국 유통 상위 꽃 심화)** 이고, 대상은
`lily-asiatic`·`tulip-white` 두 종이다.

트랙 A를 접은 이유는 2026-08-24 회차와 같다 — 카탈로그 전종 불변식이 **이미지 자산**을 요구한다:

- `tests/components/photos.test.ts` — `FLOWER_PHOTOS` 의 키 집합이 카탈로그 id 집합과
  **정확히 같아야** 하고, `src` 는 Unsplash/Pexels 의 실주소 형식이어야 한다.
- `tests/components/plates.test.ts` — `FLOWER_PLATES` 도 전종이어야 하고, 상수에 적은 도판이
  **`public/plates/` 에 파일로 실재**해야 한다(`node scripts/fetch-plates.mjs` 로 내려받는다).

이 세션은 아래 §1 대로 이미지는커녕 아무 URL도 직접 열 수 없어, 신규 종을 넣는 순간 두 테스트가
깨진다. "테스트가 깨진 상태로 커밋하지 않는다"는 완료 조건과 정면으로 부딪히므로 트랙 A는
착수하지 않았다(08-24 회차는 4개 CSV를 만들었다가 같은 이유로 되돌렸다 — 그 낭비를 반복하지 않음).

## 1. 이 세션의 조사 제약

- `WebFetch` 는 `EGRESS_BLOCKED`(도메인 무관 전면 차단). `aspca.org`·`biodiversitylibrary.org`
  두 도메인으로 확인했다.
- `curl` 직접 호출도 `CONNECT tunnel failed, response 403` 으로 막힌다
  (`biodiversitylibrary.org`·`en.wikipedia.org`·`gutenberg.org`·`aspca.org`·`pmc.ncbi.nlm.nih.gov`
  다섯 도메인으로 확인). `$HTTPS_PROXY/__agentproxy/status` 는 정상(`enabled: true`,
  `recentRelayFailures: []`)이라 프록시 장애가 아니라 **조직 egress 정책**이다.
- `WebSearch` 는 정상 동작한다. 그래서 2026-08-17·08-24·09-07 회차와 같은 방식 —
  **한 사실을 최소 두 개 이상의 독립된 검색 결과로 맞대어 본 것만 싣고, 애매하면
  `source_kind` 를 보수적으로 내려 적는다** — 을 그대로 따랐다.
- 숫자는 특히 보수적으로 다뤘다. 자료 간에 값이 갈리는 항목(인챈트먼트 육성 연도, 절화 튤립의
  하루 신장량, 호르투스 불보룸 수집 규모)은 **본문에서 수치를 빼거나 낮은 쪽을 썼고**, 그
  판단을 행마다 `editorial_note` 에 남겼다.

## 2. 대상 선정 — 왜 백합·튤립인가

착수 시점 실측(`content/stories.csv` 454행 · `content/meanings.csv` 369행, `flower_id` 열 집계):

| 꽃 | stories | meanings | 주간 리서치 이력 |
|---|---:|---:|---|
| rose-red | 25 | 15 | 08-17 심화 |
| tulip-white | 18 | 15 | **없음** |
| chrysanthemum | 18 | 8 | 08-17 · 09-07 심화 |
| lily-asiatic | 17 | 11 | **없음** |
| carnation | 16 | 13 | 08-17 심화 |
| gerbera | 14 | 11 | 09-07 검토 → 채택 0 |
| freesia | 13 | 8 | 09-07 검토 → 채택 0 |
| lisianthus | 13 | 5 | 08-24 · 08-31 심화 |
| babys-breath | 12 | 7 | 08-24 · 08-31 심화 |

행 수만 보면 `babys-breath`(12)·`freesia`/`lisianthus`(13)가 가장 얇다. 그런데 이 세 종은
직전 세 회차가 이미 훑었고, 특히 프리지아·거베라는 09-07 회차가 "알려진 주요 각도를 다 덮고
있어 새 소재가 전부 겹친다"고 판정해 채택 0으로 끝냈다. 같은 종을 네 번째로 건드리는 것은
소재 중복 위험이 가장 큰 선택이다.

반대로 **`lily-asiatic`·`tulip-white` 두 종은 브리프의 9종 중 주간 리서치가 한 번도 손대지
않은 유일한 후보**다. 두 종 모두 시드 배치(seed-v3/v5) 때 한꺼번에 실린 뒤로 손이 닿지
않았고, 실제로 기존 행을 전수 읽어 보니 계열별로 빈 칸이 뚜렷했다:

- **lily-asiatic 17편** — 기독교 도상(수태고지)·헤라 신화·플뢰르드리스·미노아 벽화·부활절
  백합과 진주만·장례 관습·고양이 독성·'스타게이저'와 우드리프·피렌체 기치·중국 百合
  ·조선의 약재 백합·울릉도 나리분지·이사벨라 프레스턴·아시아틱 계열의 부모 야생종·국내
  화훼 수출 성장·무굴 만수르의 꽃 그림·1930년대 일본 구근 수출. → **고대 지중해의 실용
  (향료·약재) 갈래와 '아시아틱'이라는 이름 자체의 내력**이 비어 있었다.
- **tulip-white 18편** — 오스만 궁정·튤립 마니아 4편·브로큰 바이러스·클루시위스 도난·튤립
  시대·뒤마 소설·기근의 겨울·파르하드·오타와 축제·이란 순교·톈산 야생종·볼롱히르 정물
  ·식스 튤립 화첩·야생 탈출(T. sylvestris)·이름의 어원·랄레 메주무아스. →
  **네덜란드·튀르키예 밖의 재배사(특히 일본)와, 꽃을 실제로 다루는 사람에게 쓸모 있는
  후수확 갈래**가 통째로 비어 있었다.

그래서 이번 회차는 백합 2편 + 튤립 3편, 모두 5편을 실었다.

## 3. 신규 이야기 5편

소스 다변화 요구(위키 의존 금지)에 맞춰 **위키피디아 출처는 0편**이다. 학술지 2 · 기관(농정·
식물원) 2 · 퍼블릭 도메인 고서 1 로 나뉜다.

### ① `story-lily-enchantment-midcentury` — lily-asiatic

'아시아틱 백합'이라는 이름의 내력. 네덜란드 구근 상인 집안 출신으로 미국 오리건에 정착한
육종가 얀 더 흐라프(Jan de Graaff, Oregon Bulb Farms)가 1940년대에 여러 야생 나리를 섞어
낸 무리가 처음에는 **'미드센추리 하이브리드'** 로 불렸고, 그 대표 품종 '인챈트먼트'가
**꽃이 위를 보고 피는 최초의 백합**이라 절화 산업의 판을 바꿨다. 1977년 네덜란드에서만
700헥타르가 이 한 품종이었고, 무리가 커지자 1980년대에 이름이 **'아시아틱'** 으로 바뀌었다.

- `source_url`: <https://www.ishs.org/ishs-article/900_27>
  (van Tuyl, J.M. & Arens, P. (2011). *Lilium: Breeding History of the Modern Cultivar
  Assortment*. Acta Hortic. 900, 223–230. DOI 10.17660/ActaHortic.2011.900.27 — ISHS)
- `source_kind = paper` · `confidence_level = repeated` · `story_type = history`
- 교차 확인: ISHS 서지 페이지, 같은 논문의 공개 PDF 스니펫(haifa-group), Wageningen
  연구 리포지터리 서지가 모두 일치. '인챈트먼트' 육성 연도만 1941/1944/1947로 갈려
  **본문에서 연도를 뺐다**(선발과 발표 시점 차이로 보인다).
- 중복 대조: `story-lily-asiatic-korean-ancestors`(부모 야생종 목록) ·
  `story-lily-stargazer-woodriff`(오리엔탈 계열·다른 인물) ·
  `story-lily-isabella-preston`(캐나다 프레스턴 교배계)과 인물·계열·주제가 모두 다르다.

### ② `story-lily-susinum-pliny` — lily-asiatic

플리니우스 『박물지』 13권이 "모든 향유 가운데 가장 묽다"고 적은 **수시눔(susinum)** — 백합꽃에
벤나무 열매 기름·창포·꿀·계피·사프란·몰약을 섞은 고대의 백합 향유. 시돈과 이집트가 산지였다.

- `source_url`: <https://www.attalus.org/pliny/hn13a.html>
  (Pliny the Elder, *Natural History* Book XIII — Bostock & Riley 1855 영역본, 퍼블릭 도메인)
- `source_kind = book-pd` · `confidence_level = repeated` · `story_type = history`
- 교차 확인: attalus.org 본문의 해당 문장(재료 목록)과, 수시눔이 시돈·이집트에서 만들어졌다는
  기술(N.H. XIII.11–12)을 별개 자료로 맞댔다. **문장은 옮기지 않고 재료 목록만 참고해 새로
  썼다**(퍼블릭 도메인이라 직접 인용도 가능하지만 §1.5d 해요체 본문에 맞춰 재서술).
- **종 차이 명시** — 고대 지중해의 백합은 *Lilium candidum*(마돈나 백합)이고 카탈로그의
  아시아틱 백합과 다르다. `content/README.md` 가 요구하는 대로 **본문 마지막 문장과
  `editorial_note` 양쪽에** 그 사실을 적었다(`story-lily-annunciation`·
  `story-lily-minoan-fresco` 와 같은 처리).
- **주의해서 뺀 것**: 2차 자료 일부가 "이집트 부조에서 여인들이 수련 꽃을 짜 수시눔을 만든다"
  고 쓰는데, 수련(*Nymphaea*)은 우리 카탈로그의 **별개 종 `water-lily`** 라 본문에 넣지 않았다.

### ③ `story-tulip-toyama-rice-paddy` — tulip-white

1918년 일본 도야마현 히가시토나미군 쇼게촌(현 도나미시)의 **미즈노 도요조(水野豊造)** 가 겨울에
놀리는 논을 쓰려고 구근 열 개 남짓을 심어 본 것이 일본 튤립 구근 산업의 시작이다. 절화도
구근도 비싸게 팔리자 마을을 설득해 1924년 열세 사람과 조합을 세웠고, 그 고장이 지금 일본
튤립 구근 생산 1위다.

- `source_url`: <https://www.pref.toyama.jp/1613/sangyou/nourinsuisan/nougyou/kj00014132/kj00014132-002-01.html>
  (「とやまのチューリップ球根生産の歴史」 — 도야마현 농림수산 공식 페이지)
- `source_kind = garden`(농업 행정기관 자료 — README 의 소급 분류 기준에서 농사로·익스텐션과
  같은 자리) · `confidence_level = repeated` · `story_type = history`
- 교차 확인: 도야마현 공식 페이지, 도나미시 공식 PDF(`city.tonami.lg.jp`), 도야마현 관광
  공식 사이트가 1918년·10구·1924년 13인 조합까지 같은 내용을 반복한다.
- 인명 표기: 영문 자료는 'Bunzo Mizuno'로도 옮기지만 한자 표기 水野豊造 는 일치한다.
  한국어는 일본어 읽기(도요조)를 따랐고 그 판단을 메모에 남겼다.

### ④ `story-tulip-hortus-bulborum` — tulip-white

네덜란드 림먼의 **호르투스 불보룸** — 1924년 마을 학교 교장이자 원예 교사였던 피터르 보스만이
사라져 가는 옛 튤립 품종의 구근을 모아 사택 마당에 심기 시작했고, 1928년 더 몰 박사와 재단을
세웠다. 지금도 튤립 약 2000품종을 포함해 2500품종 남짓이 해마다 다시 핀다. 최고령은 1595년의
'Duc van Tol Red and Yellow' — 튤립 광풍보다 사십 년 앞선 이름이다.

- `source_url`: <https://hortus-bulborum.nl/en/history/> (재단 자체 연혁)
- `source_kind = garden` · `confidence_level = repeated` · `story_type = history`
- 교차 확인: 재단 연혁 페이지 + 암스테르담 튤립박물관 소개 페이지가 창립 경위·최고령 품종을
  같은 내용으로 전한다. 수집 규모만 자료에 따라 2500~4000으로 폭이 있어 **낮은 쪽을 썼다.**
- 중복 대조: `story-tulip-broken-virus`(줄무늬의 정체=바이러스, 과학사) ·
  `story-tulip-six-book-doctor-tulp`(17세기 튤립 화첩, 종이 위의 기록)와 달리 이 행은
  **살아 있는 구근을 지키는 유전자원 정원**이라는 다른 축이다.

### ⑤ `story-tulip-still-growing-in-vase` — tulip-white

절화 튤립은 화병에서도 계속 길어진다. 줄기가 다 자라지 않은 채 잘려 나오기 때문이고, 빛 쪽으로
휘기도 한다. 옥신·지베렐린이 신장을 밀고 에틸렌이 붙잡는 줄다리기로 설명된다. 혼합 다발에서
며칠 뒤 튤립만 솟아 있는 이유다.

- `source_url`: <https://www.sciencedirect.com/science/article/abs/pii/0304423881900911>
  (*Hormonal control of shoot elongation in tulips*, Scientia Horticulturae)
- `source_kind = paper` · `confidence_level = repeated` · `story_type = history`
  (사실이되 신화도 문학도 아닌 현대 과학·유통 이야기 → README 경계 판단 규칙에 따라 `history`)
- 교차 확인: 위 논문의 기제 서술 + 화훼 후수확 업계 자료·원예 보급 자료가 "절화 튤립이 계속
  길어진다"는 현상을 반복해 전한다. 다만 **하루 신장량 수치(1.3~2.5cm)는 출처가 업계 블로그
  수준이라 본문에서 뺐다** — "며칠에 걸쳐 몇 센티미터"로만 적었다.
- 이 행은 `flowers.csv` 의 `tulip-white.care_summary`("서늘한 곳에 두고, 물은 얕게 채워
  주세요")와 결이 이어지는 **실용 갈래**로, 기존 18편(설화·투기사·미술사)에 없던 축이다.

## 4. 소스 유형 분포 (신규 5편)

| `source_kind` | 편수 | 해당 행 |
|---|---:|---|
| `paper` | 2 | ① Acta Horticulturae · ⑤ Scientia Horticulturae |
| `garden` | 2 | ③ 도야마현 농림수산 · ④ 호르투스 불보룸 |
| `book-pd` | 1 | ② 플리니우스 『박물지』(Bostock & Riley 1855) |
| `wiki` | **0** | — |

`story_type` 은 5편 모두 `history`. `moods` 는 `dramatic` 2 · `mythic` 1 · `healing` 1 ·
`funny` 1 로 갈라 두어, 한 꽃의 목록이 같은 결로 줄줄이 이어지지 않게 했다(`pickStories`
의 대표 분위기 기준). `intents` 는 5편 모두 비웠다 — 특정 상황에 매어 둘 근거가 없어서이고,
비우면 모든 상황에서 후보로 남는다(README §선별 태그).

## 5. 제외 목록

| 소재 | 대상 | 제외 이유 |
|---|---|---|
| 신규 꽃 2~4종(트랙 A) 전체 | flowers | `photos.test.ts`·`plates.test.ts` 의 전종 불변식이 이미지 자산을 요구하는데 egress 전면 차단으로 이미지를 열 수도 내려받을 수도 없다(§0). 08-24 회차의 되돌림 선례를 반복하지 않으려 착수 자체를 접었다 |
| 버뮤다 부활절 백합 산업의 1898년 모자이크병 붕괴 | lily-asiatic | 기존 `story-lily-easter-pearl-harbor` 가 이미 "류큐 → 버뮤다 주력 수출품 → 미국의 일본 의존"이라는 같은 줄거리를 담고 있어 소재 중복 |
| 이집트 부조의 '수련에서 짠 향유' | lily-asiatic | 수련(*Nymphaea*)은 카탈로그의 별개 종 `water-lily` 라 백합 행에 붙이면 종을 섞게 된다 |
| 카자흐스탄 야생 튤립 보전 | tulip-white | 기존 `story-tulip-tianshan-wild` 가 톈산·파미르알라이 야생 튤립을 이미 다뤄 각도가 겹침 |
| 절화 튤립 하루 신장량 수치(1.3~2.5cm / 채화 후 약 10cm) | tulip-white | 현상 자체는 실었으나 **수치의 출처가 업계 블로그·제품 페이지 수준**이라 본문에서 숫자만 뺐다 |
| Charlotte de Latour 『Le langage des fleurs』(1819)의 튤립·백합 항목 | meanings | 1819년 초판 본문의 해당 항목을 **직접 확인하지 못했다.** 검색에 걸리는 "Tulipe = déclaration d'amour / Lis = majesté" 는 전부 현대 프랑스 화훼 블로그의 재인용이라, 원전에 그렇게 적혀 있다고 단정할 근거가 없다(Gallica·Internet Archive 스캔본은 egress 차단으로 열람 불가) |
| Sarah J. Hale 『Flora's Interpreter』(1832)의 항목 | meanings | 같은 이유 — 스캔본 URL 은 확인했으나 본문을 열 수 없어 개별 항목을 인용할 수 없다 |
| 국립원예특작과학원 꽃말사전의 튤립 항목 | meanings | 꽃말사전 목록 페이지는 검색에 잡히지만 튤립 개별 항목의 `dataNo` 를 특정하지 못했다. 기존 `nihhs-*` 행들처럼 **정확한 항목 URL 없이는 싣지 않는다** |

`meanings.csv` 를 한 행도 늘리지 않은 것은 위 세 건의 귀결이다. 08-31·09-07 회차가 남긴
"새 출처를 못 찾으면 억지로 채우지 않는다"는 선례를 그대로 따랐다.

## 6. 최종 수치

| 파일 | 조사 전 | 조사 후 | 비고 |
|---|---:|---:|---|
| `content/stories.csv` | 454 | **459** | +5 (`lily-asiatic` +2 · `tulip-white` +3) |
| `content/meanings.csv` | 369 | 369 | 변경 없음 (§5) |
| `content/flowers.csv` | 59 | 59 | 변경 없음 (트랙 B) |
| `content/pet_safety.csv` | 118 | 118 | 변경 없음 (트랙 B) |

꽃별: `lily-asiatic` 17 → **19** · `tulip-white` 18 → **21**.

`story_type` 분포: `history` 362 → **367** · `folklore` 62 · `literary` 30 · `original` 0.

`source_kind` 분포: `wiki` 168 · `garden` 57 → **59** · `magazine` 46 · `newspaper` 45 ·
`museum` 43 · `paper` 35 → **37** · `other` 32 · `book-pd` 28 → **29**.
(위키 비중 37.0% → **36.6%** — 신규 5편에 위키가 0편이라 절대 수 168이 그대로다.)

`tests/data/catalog.test.ts` 의 `EXPECTED_STORIES` 를 454 → 459 로 고쳤다. **숫자만 고쳤고
검사의 취지(실데이터를 그대로 읽어 엔진까지 도는지)는 건드리지 않았다.**

## 7. 검증

`npm ci && npm run seed && npm run test && npm run typecheck` 전부 통과를 커밋 조건으로
삼았고, 커밋 시점에 실제로 전부 통과했다.

- `npm run seed` — 12개 파일 2505행, 교차 검증 10종 전부 `[OK]`, 오류 0건.
  (`stories.csv story_id 유일성 — 459편 중복 0` · `birth_stories.csv 407편과 id 충돌 0` 포함)
- `npm run test` — 70개 파일 1229개 테스트 전부 통과.
- `npm run typecheck` — `next typegen` 후 `tsc --noEmit` 통과.
