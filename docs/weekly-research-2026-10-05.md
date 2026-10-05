# 주간 콘텐츠 리서치 — 2026-10-05 (5회차)

## 0. 트랙 배분

브리프는 신규 꽃 확장(트랙 A) 또는 한국 유통 상위 꽃 심화(트랙 B) 중 상황에 맞게 배분하라고
지시한다. 트랙 A는 §1.5g/`tests/components/photos.test.ts`가 요구하는 실사 확보가 전제인데,
이 세션도 직전 세 회차(2026-08-24·08-31·09-07)와 동일하게 **`WebFetch`가 조직 egress
정책으로 전 도메인 차단**이다(아래 §1 참고). Unsplash·Pexels에서 실제 사진 URL을 가져와
크레딧 규칙까지 맞추는 일이 불가능해, 2026-08-24 회차가 겪은 것과 같은 실패를 피하려
이번 회차도 **트랙 B(한국 유통 상위 꽃 심화)** 로 진행했다.

## 1. 이 세션의 조사 제약

- `en.wikipedia.org`에 대한 `WebFetch` 호출이 `EGRESS_BLOCKED`로 막히는 것을 직접
  확인했다(도메인 무관 전면 차단으로 판단).
- 그래서 **`WebSearch` 스니펫을 여러 개 교차 확인하는 방식**으로 대체했다(2026-08-17부터
  이어진 선례). 한 사실은 최소 두 개 이상의 독립된 검색 결과 스니펫·도메인으로 맞대어
  확인한 것만 싣고, 애매하면 `source_kind`를 보수적으로(`other`/`magazine`) 내려 적었다.
  WebSearch가 가끔 섞어 주는 미러·프록시 도메인(예: 이상하게 대문자가 섞인 호스트, 2차
  인용 포털)은 실제 1차 출처(박물관·대학·정부기관·신문사 원 도메인)로 바꿔 인용했다.

## 2. 대상 선정 — 왜 carnation·lily-asiatic인가

브리프가 꼽은 한국 유통 상위 9종(`rose-red` `chrysanthemum` `carnation` `lily-asiatic`
`tulip-white` `freesia` `gerbera` `lisianthus` `babys-breath`) 중 지금까지 주간 리서치가
**전용 심화 대상으로 고른 적이 없는** 두 종이 `carnation`과 `lily-asiatic`이었다.
`carnation`은 2회차(2026-08-17)에 이야기 3편을 받은 적이 있지만 그때도 `rose-red`·
`chrysanthemum`과 함께 묻어간 것이었고, `lily-asiatic`은 한 번도 단독 타깃이 된 적이
없다. `lisianthus`·`babys-breath`는 2회차·3회차 1·2차 시도가 이미 심화했고(색상별
꽃말은 두 세션 모두 실패), `freesia`·`gerbera`·`chrysanthemum`은 4회차(09-07)가 검토해
거베라·프리지아는 소재가 다 겹치거나 종이 달라 보류했다 — 그래서 아직 손대지 않은
`carnation`·`lily-asiatic`을 골랐다.

착수 시점 실제 행 수(`stories.csv` 454행 기준, `flower_id` 컬럼으로 셈):

| 꽃 | stories 행 수 | meanings 행 수 | 비고 |
|---|---:|---:|---|
| rose-red | 25 | 15 | seed-v5 + weekly(08-17) |
| tulip-white | 18 | 15 | seed-v3/v5 |
| chrysanthemum | 18 | 8 | seed-v3/v5/v8 + weekly(08-17·09-07) |
| lily-asiatic | 17 | 11 | seed-v5 |
| carnation | 16 | 13 | seed-v5 + weekly(08-17) |
| gerbera | 14 | 11 | seed-v2/v5/v8 |
| freesia | 13 | 8 | seed-v2/v5/v8 |
| lisianthus | 13 | 5 | seed-v5 + weekly(08-24·08-31) |
| babys-breath | 12 | 7 | seed-v5 + weekly(08-24·08-31) |

두 종 다 기존 행을 먼저 전수로 읽었다(`awk -F',' '$2=="carnation"'` / `$2=="lily-asiatic"'
content/stories.csv`, `awk -F',' '$1=="carnation"'` 등으로 `meanings.csv`도 동일하게
대조). 기존 커버:

- **carnation 16편** — 안나 자비스/어머니날(2편), 포르투갈 카네이션 혁명, 디안투스
  (제우스의 꽃) 어원, 옥스퍼드 시험 전통, 오스카 와일드의 초록 카네이션, 노동절의 붉은
  카네이션, 한국 어버이날·스승의 날 제도사(2편), 에틸렌 화병 수명 육종사, 오스만 네
  가지 꽃 양식, 모리나가제과의 일본 어머니날 전파, 보고타 수출 산업사, 매킨리 대통령
  암살, 마리 앙투아네트 탈출 모의(카네이션에 숨긴 쪽지) — 미국·포르투갈·그리스·영국·
  일본·한국·튀르키예·콜롬비아·프랑스를 이미 넓게 덮고 있었다.
- **lily-asiatic 17편** — 수태고지 마돈나 백합, 헤라의 젖 신화, 클로비스 왕관 백합
  문양, 크레타 청동기 벽화, 진주만이 바꾼 부활절 백합 산업, 부활·장례 양쪽에 쓰이는
  역설, 고양이 독성 경고, 우드리프의 스타게이저(오리엔탈 하이브리드), 피렌체 깃발
  색 반전, 중국 결혼 축사 어원(百年好合), 옛 문헌 속 백합 뿌리 식용, 울릉도 나리분지
  지명 유래, 이사벨라 프레스턴의 캐나다 육종사, 한국 산나리 족보, 한국 화훼 수출
  통계사, 무굴 세밀화의 유럽 판화 모사, 일본 구근 수출의 역전 — 신화·역사·한국
  지명·현대 산업사까지 이미 상당히 넓었다.

## 3. 신규 이야기 4편

### `story-carnation-cordoba-patios`

스페인 코르도바의 안뜰(파티오) 문화 — 로마 시대부터 더위를 식히려 만든 중정을 주민들이
카네이션·제라늄·재스민 화분으로 채우는 전통. 1921년 시청이 파티오 경연을 처음 열었고,
지금도 5월 초 열이틀 동안 주민들이 자기 집 안뜰을 공개한다. 2012년 유네스코 인류무형문화
유산으로 등재됐다.

- 확인 경위: 영문 위키백과(Courtyards Festival of Córdoba) · 코르도바 관광청
  (turismodecordoba.org) · 안달루시아 관광 블로그(andalucia.com) 세 독립 출처가 모두
  "1921년 첫 경연·5월 초 개최·2012년 UNESCO 등재"를 일치해서 전한다. 카네이션이 실제
  장식 꽃이라는 사실은 andalucia.com과 "Geraniums & Carnations in Andalusia"
  (flowersandtheirmeanings.substack.com) 두 곳이 공통으로 적는다.
- `source_url`: https://ich.unesco.org/en/RL/patios-festival-in-cordoba-00846
  (유네스코 공식 등재 페이지). `source_kind = museum`(국제기구의 공식 문화유산 등재
  기록이라 박물관·국가기록원과 같은 격으로 분류).
- `confidence_level = repeated`, `story_type = history`(확인되는 관습).
- 기존 카네이션 16편 중 유럽 쪽은 영국(옥스퍼드·와일드)·포르투갈·프랑스 중심이었고
  스페인·지중해 문화권은 비어 있었다 — 브리프가 짚은 "스페인/지중해 카네이션 문화"
  각도를 처음 메운다.

### `story-carnation-name-etymology`

"carnation"이라는 영단어 자체의 어원 논쟁 — 꽃잎 끝의 톱니 모양이 작은 왕관을 닮았다는
"coronation(대관식)"설과, 라틴어 caro(살)·이탈리아어 carnagione(살빛)에서 왔다는
"살빛"설이 나란히 전해지며, 오늘날 어원 사전들은 살빛 쪽에 더 무게를 둔다.

- 확인 경위: 보즈먼 데일리 크로니클(지역 신문의 어원 칼럼 "Chrysti the Wordsmith")·
  etymonline.com·dictionary.com 세 독립 출처가 모두 두 가설을 함께 소개하고, "flesh
  color" 쪽이 더 정설로 받아들여진다고 적는다.
- `source_url`: https://www.bozemandailychronicle.com/bozeman/chrysti-the-wordsmith-carnation/article_f5fb8e03-bf56-516e-a655-2632423cd0e9.html
  `source_kind = newspaper`(지역 신문 칼럼), `confidence_level = repeated`.
- `story_type = history`.
- 기존 `story-carnation-dianthus`("제우스의 꽃" — 학명 Dianthus의 그리스어 어원)와는
  다른 낱말이다. 저 행은 테오프라스토스가 붙인 **학명**의 유래를, 이번 행은 영어 common
  name "carnation" **자체**의 유래를 다뤄 소재가 겹치지 않는다.

### `story-lily-degraaff-enchantment`

오리건의 백합 육종가 얀 더 그라프(Jan de Graaff, Oregon Bulb Farms)가 1942년에 심은
씨앗에서 'Enchantment'(1949년 특허)를 얻었다 — 당시 아시아 원종 백합이 대부분 고개를
숙이거나 옆으로 피던 것과 달리 하늘을 보고 피는 꽃이었다. 그가 평생 아시아 원종 12종을
교배해 쌓은 이 계열은 처음엔 "미드센추리 교배종"으로 불렸고, 1980년대에야 지금 이름인
"아시아틱 하이브리드(Division I)"로 불리게 됐다.

- 확인 경위: 영문 위키백과(De Graaff Brothers) · Pacific Bulb Society 메일링 리스트
  아카이브(더 그라프 본인이 1953년 RHS Lily Year Book에 쓴 글을 인용) · 덤바턴 오크스
  정원·경관 연구소(Dumbarton Oaks Garden & Landscape Studies)의 공식 전기 페이지 세
  독립 출처를 교차 확인했다. 특허 번호(PP862)와 1949년 8월 9일 등록일은 메릴랜드대
  디지털 식물특허 아카이브(digital.lib.umd.edu)로 추가 대조했다.
- `source_url`: https://doaks.org/library-archives/garden-archives/biographies/jan-de-graaff
  `source_kind = garden`(연구기관 가든 아카이브의 공식 인물 전기), `confidence_level =
  repeated`.
- `story_type = history`.
- **종 일치 확인**: 이 꽃은 실제로 더 그라프가 만든 아시아틱 하이브리드(Division I)
  계열이다 — 기존 `story-lily-stargazer-woodriff`(레슬리 우드리프의 '스타게이저')는
  본문에도 적혀 있듯 **오리엔탈 하이브리드**라 `lily-asiatic` 꽃과 종이 다른데, 이번
  행은 design-spec이 요구하는 "마돈나 백합 vs 아시아틱 백합" 같은 종 차이 disclosure가
  **필요 없는**, 정확히 맞는 소재라는 점을 editorial_note에 남겼다.

### `story-lily-asiatic-scentless-breeding`

오리엔탈 백합이 짙고 달큼한 향을 뿜는 것과 달리 아시아틱 백합은 향이 거의 없는 쪽으로
자리를 잡았다. 미국 대학 원예학 익스텐션 자료들은 이 차이를 계통별 교배 방향의 특징으로
설명한다 — 아시아틱은 색·개화 속도·강인함 쪽에 교배가 몰렸고, 오리엔탈은 향과 큰 꽃송이
쪽에 무게가 실렸다는 것.

- 확인 경위: 오하이오주립대 익스텐션(BYGL, bygl.osu.edu) · 아이오와주립대 익스텐션
  자료(store.extension.iastate.edu) · Fairfax Gardening(버지니아 페어팩스 카운티
  마스터가드너 블로그) 세 독립 출처가 모두 "아시아틱=무향, 오리엔탈=강한 향"을
  일치해서 설명한다.
- `source_url`: https://bygl.osu.edu/node/1096 `source_kind = garden`(대학 익스텐션),
  `confidence_level = repeated`.
- `story_type = history`. 향이 "의도적으로 빠졌다"는 인과까지는 자료마다 서술이 없어
  본문에서 단정하지 않고 계통 특징으로만 적었다.
- 기존 `meanings.csv`의 `lily-asiatic` 하나코토바 행(editorial_note에 "향이 없고
  형태가 단정한 아시아틱 계열의 성격과 맞음"이라는 메모만 있던 부분)을 본문 이야기로
  풀어낸 셈이라, 데이터 안에서도 서로 보강된다.

## 4. 검토했다 제외한 소재

| 소재 | 대상 | 제외 이유 |
|---|---|---|
| 프랑스 왕당파(Legitimist)의 흰 카네이션 상징 | carnation | 검색된 "Carnation Plot" 관련 서술이 사실상 기존 `story-carnation-oeillet-plot-1793`(루즈빌 기사·마리 앙투아네트 탈출 모의)과 같은 1793년 사건을 가리킴 — 매년 1월 21일(루이 16세 처형 기념일)에 흰 카네이션을 다는 별도의 지속적 관습을 뒷받침하는 독립 출처를 찾지 못해, 중복 소재로 보고 제외 |
| Dianthus caryophyllus의 종소명(정향 향) 어원 | carnation | caryophyllus(그리스어 카리오필론=정향나무)는 흥미롭지만, 이미 실린 `story-carnation-dianthus`(속명 Dianthus 어원)와 `flowers.csv` 의 fragrance_level 편집 메모가 같은 "정향 향" 사실을 이미 짚고 있어 새 이야기로 세우기엔 소재가 얕음 |
| 국립원예특작과학원(NIHHS) 카네이션·나리 꽃말사전 페이지 | carnation·lily-asiatic meanings | WebSearch로 `nihhs.go.kr` 카네이션 항목을 찾지 못했다(검색 결과가 전부 농촌진흥청 웹진·일반 언론 기사). 기존 `lily-asiatic` 행(`nihhs-lily`, `nihhs-tiger-lily`)과 달리 이번엔 스니펫으로 항목 자체를 확인할 수 없어 새 `meanings.csv` 행을 만들지 않았다 |
| Dumont(1851) 『The Language of Flowers』 전문의 카네이션/백합 항목 | carnation·lily-asiatic meanings | Gutenberg #71779 전자책 존재는 확인했으나 WebFetch가 막혀 전문을 열어 Dianthus/Lily 항목 문구를 직접 대조할 수 없었다. 스니펫만으로 원문을 옮기면 오기 위험이 있어 보류 — 열람 가능해지면 다음 회차에서 확인 |
| 스페인 국화(national flower)로서의 카네이션 | carnation | "카네이션이 스페인의 국화"라는 서술이 여러 검색 결과에 나오지만, 전부 SEO형 꽃 소개 블로그(jardineriaon.com·sensationalspain.com 등)뿐이고 스페인 정부·공신력 있는 백과사전 출처를 찾지 못했다. 공식 지정 여부를 확인할 1차 자료가 없어 "국화"라는 단정적 표현으로는 싣지 않았다(코르도바 파티오 축제처럼 출처가 분명한 문화적 쓰임만 실었다) |
| RHS 백합 9개 디비전 분류체계 자체를 별도 이야기로 | lily-asiatic | 분류체계 설명은 `story-lily-degraaff-enchantment` 본문에 "아시아틱 하이브리드(Division I)"로 녹여 넣는 것으로 충분하다고 판단 — 별행으로 분리하면 편집 규칙이 싫어하는 "분류 정보 나열"에 가까워져 서사가 얕아짐 |

## 5. 최종 수치

- `stories.csv`: 454 → **458행**(+4, `carnation` 2 · `lily-asiatic` 2).
  `story_type` 분포 변화: `history` 362 → **366**(그 외 `folklore` 62 · `literary` 30 ·
  `original` 0 불변).
  `source_kind` 분포 변화: `museum` 43 → **44**, `newspaper` 45 → **46**, `garden` 57 →
  **59**(그 외 불변).
- `meanings.csv`: 369행 그대로(변경 없음) — §4 참고. 색상·문화권별 새 출처를 찾지
  못했다.
- `flowers.csv`: 59행 그대로(변경 없음, 트랙 B라 신규 종 없음).

신규 4행의 `source_kind` 분포: `museum` 1 · `newspaper` 1 · `garden` 2. 위키 출처 0편.

## 6. 검증

`npm ci && npm run seed && npm run test && npm run typecheck` 전부 통과를 커밋 조건으로
삼았다(§완료 조건). 네 명령 모두 로컬에서 그린으로 확인했다 — `npm run seed`는 오류 0건,
`npm run test`는 70개 테스트 파일 1229개 테스트 전부 통과, `npm run typecheck`는 라우트
타입 생성 후 `tsc --noEmit` 통과. 결과는 PR 설명에도 남긴다.
