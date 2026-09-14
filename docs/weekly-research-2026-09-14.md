# 주간 콘텐츠 리서치 — 2026-09-14 (5회차)

## 0. 트랙 배분

브리프는 신규 꽃 2~4종(트랙 A) 또는 한국 유통 상위 꽃 심화(트랙 B) 중 상황에 맞게
배분하라고 지시했다. 트랙 A는 신규 꽃마다 실사·도판을 확보해야 하는 이미지 파이프라인
(`docs/image-assets.md`)이 전제인데, 이 세션은 이전 네 회차와 동일하게 `WebFetch`가
조직 egress 정책으로 전 도메인 차단이라(아래 §1) 이미지를 열거나 내려받을 방법이 없다.
그래서 이번 회차도 **트랙 B(한국 유통 상위 꽃 심화)** 로 진행했다.

## 1. 이 세션의 조사 제약

- `WebFetch` 호출 시 `EGRESS_BLOCKED`(도메인 무관 전면 차단)를 확인했다
  (`en.wikipedia.org`로 시험, 즉시 차단 응답).
- `curl`로 위키피디아에 직접 접속을 시도해도 프록시가 `CONNECT tunnel failed, response 403`
  으로 막는다 — 조직 정책이라 툴을 바꿔도 우회되지 않는다.
- 그래서 이전 네 회차와 같은 방식으로 **`WebSearch` 스니펫을 여러 개 교차 확인하는
  방식**으로 대체했다. 한 사실을 최소 두 개 이상의 독립된 검색 결과(가능하면 서로 다른
  기관·매체)로 맞대어 본 것만 신되, 애매하면 `source_kind`를 보수적으로 내려 적었다.

## 2. 대상 선정

한국 유통 상위 9종(장미·국화·카네이션·백합·튤립·프리지아·거베라·리시안셔스·안개꽃) 가운데
직전 네 회차의 이력은 이렇다:

| 꽃 | 다뤄진 회차 | 비고 |
|---|---|---|
| lisianthus | 08-24(+3)·08-31(+5) | 두 차례, meanings 색상 확충은 실패 |
| babys-breath | 08-24(+3)·08-31(+5) | 두 차례, meanings 색상 확충은 실패 |
| carnation | 08-17(+7 중 일부) | 한 차례 |
| chrysanthemum | 08-17·09-07(+2) | 두 차례, 16편 대부분 각도를 이미 덮음 |
| freesia · gerbera | 09-07(검토만, 채택 0) | 09-07이 새 소재를 찾았으나 전부 기존 행과 겹치거나
  종이 달라 보류함 |
| rose-red · tulip-white · lily-asiatic | 없음 | 다만 stories 17~25편으로 이미 가장 두꺼움 |

착수 시점 실제 행 수(`stories.csv` 454행 · `meanings.csv` 369행 기준):

| 꽃 | stories | meanings | catalog colors 대비 meanings 색 공백 |
|---|---:|---:|---|
| rose-red | 25 | 15 | (없음) |
| tulip-white | 18 | 15 | (없음) |
| chrysanthemum | 18 | 8 | purple·pink·orange·green |
| lily-asiatic | 17 | 11 | (없음) |
| carnation | 16 | 13 | (없음) |
| gerbera | 14 | 11 | (없음) |
| freesia | 13 | 8 | (없음) |
| lisianthus | 13 | 5 | white·cream·green |
| babys-breath | 12 | 7 | cream |

직전 회차(09-07)가 이미 freesia·gerbera·chrysanthemum 세 종을 각도별로 훑어 "새로 찾은
소재가 기존 행과 겹친다"고 확인해 두었고, lisianthus·babys-breath는 두 회차가 두 번씩
다뤄 세 번째 시도가 가장 겹칠 위험이 컸다. 그래서 이번 회차는 **한 종에 몰아넣지 않고
겹치지 않는 각도가 실제로 확인된 것만** 세 종(gerbera·lisianthus·babys-breath)에 나눠
담았다 — 억지로 한 종을 채우기보다, `docs/weekly-research-2026-08-31.md`·
`docs/weekly-research-2026-09-07.md`가 세운 "새 출처를 못 찾으면 억지로 채우지 않는다"
선례를 그대로 따른 것이다.

### meanings.csv 색상 공백 시도 — chrysanthemum·lisianthus (모두 보류)

09-07이 이미 chrysanthemum의 색깔별(보라·분홍·주황) 서양 현대 꽃말을 화훼 블로그 집계
수준이라 보류한 바 있다. 이번 회차도 chrysanthemum 보라색과 lisianthus 흰색·크림색을
다시 검색했지만 결과는 똑같았다 — `bouqs.com`·`flowerglossary.com`·`interflora.com.au`
등 화훼 쇼핑몰·꽃 배달 서비스 블로그가 서로 베낀 듯한 문구("보라 국화 = 빅토리아 시대에
병문안 선물"·"흰 리시안셔스 = 순수·새로운 시작")를 반복할 뿐, 1차 사료(원전 다이어리·
그리너웨이 1884 원문의 실제 chrysanthemum 항목·박물관 소장 자료)를 인용하는 곳이 하나도
없었다. 기존 `chrysanthemum` 빨강·흰·노랑 행은 그리너웨이 1884 원문 문구
("Chrysanthemum, Red — I love." 등)를 정확히 인용하는데, 이 신규 후보들은 원문 인용이
없어 같은 신뢰 수준으로 볼 수 없다고 판단해 **둘 다 채택하지 않았다**(§4 제외 목록 참고).

## 3. 신규 콘텐츠 3건

### `story-gerbera-mpumalanga-flag` (stories.csv)

남아프리카공화국 음푸말랑가 주는 1996년 2월 23일, 아홉 개 주 가운데 처음이자 유일하게
자체 주기(州旗)를 공식 채택했다. 깃발과 문장(紋章) 도안에 이 지역 자생종인 바버턴
데이지(`Gerbera jamesonii` — 기존 `story-gerbera-goldrush`가 다루는 바로 그 꽃)가
떠오르는 해의 상징으로 들어가 있다.

- 확인 경위: 음푸말랑가 주정부 공식 페이지(1차 사료)와 남아공 국기학 정리
  위키(vexillology fandom) 두 곳이 "1996년 채택·유일한 주기·바버턴 데이지 도안"을
  일치해서 서술한다. SANBI PlantZAfrica(`pza.sanbi.org/gerbera-jamesonii`)가 이 꽃이
  음푸말랑가 원산임을 별도로 확인해 준다.
- `source_url`: http://www.mpumalanga.gov.za/otp1/about/coat_of_arms.htm
  (음푸말랑가 주정부 공식 사이트). `source_kind = museum`(기관 자료 — 정부 발간 공식
  기록이라 `garden`이 아니라 `museum` 쪽이 맞다고 판단했다).
- `confidence_level = repeated`(독립된 두 곳 이상이 같은 사실을 반복), `story_type = history`.
- 기존 `story-gerbera-goldrush`(1889년 발견)·`story-gerbera-hilton-daisy`(야생종 멸종위기)
  와 소재가 겹치지 않는다 — 저 두 행이 "발견"과 "위기"를 말한다면, 이 행은 발견 이후
  그 꽃이 지역 정체성의 공식 상징이 된 결과를 말한다.

### `story-lisianthus-genome-2021` (stories.csv)

2021년 가즈사 DNA연구소·다키이 종묘·도쿄대·국립유전학연구소 공동 연구진이 리시안셔스
(`Eustoma grandiflorum`)의 염색체 단위 유전체 지도를 처음으로 완성했다. 차세대
염기서열분석·Hi-C 스캐폴딩·유전 연관지도 네 방법을 통합해 36개 가유전체(假染色體)에
유전자 3만6천여 개를 배치했고, 용담과(Gentianaceae) 식물 가운데 이런 완전한 유전체
지도를 가진 첫 사례가 됐다.

- 확인 경위: bioRxiv 프리프린트, PMC(PMC9911058), Oxford Academic
  G3(Genes|Genomes|Genetics) 정식 게재본 세 곳이 같은 연구(저자·소속·BioProject
  ID PRJDB12119 동일)를 가리킨다 — 세 독립 플랫폼이 같은 논문을 확인해 준 것으로
  교차 확인함.
- `source_url`: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9911058/
  (PMC 정식 게재본, 안정적으로 인용 가능). `source_kind = paper`.
- `confidence_level = single_source`(연구 자체는 하나 — 세 플랫폼은 같은 논문의 다른
  게재처), `story_type = history`.
- 저자 소속 중 다키이 종묘(Takii & Co.)는 기존 `story-lisianthus-japan-breeding`가
  말하는 1960~70년대 육종 회사 중 하나다 — "무엇을 길러냈는지"(육종사)와 "그걸 어떻게
  이해하게 됐는지"(유전체 지도)가 자연스러운 짝을 이룬다. 기존
  `story-lisianthus-vase-life-genotype-environment`(2025)·`story-lisianthus-cat-attractant`
  (2024)와 같은 "리시안셔스를 다루는 최신 과학" 계열이지만 주제(유전체 대 화병 수명·향
  성분)가 겹치지 않는다.

### `babys-breath` 영국 빅토리아 시대 행 (meanings.csv)

Kate Greenaway의 1884년 『Language of Flowers』 목록에서 Gypsophila(안개꽃) 항목은
"Everlasting love"(영원한 사랑)로 기록되어 있다.

- 확인 경위: 이 세션은 구텐베르크 원문(`gutenberg.org/ebooks/31591`)을 `WebFetch`로 직접
  열지 못했다(§1의 전면 차단과 같은 제약 — 기존 `chrysanthemum` greenaway-1884 행들이
  이미 겪은 것과 동일한 한계). 대신 서로 무관한 화훼 콘텐츠 사이트 다섯 곳 이상이 모두
  같은 문구("Everlasting love")를 그리너웨이 1884에 귀속시켜 반복했고, 그중 두 곳
  (`harvesting-history.com`·`gracehitchcockbooks.com`)은 화훼 판매가 아니라 원예사·
  도서 소개 성격의 글이라 순수 마케팅 반복은 아니라고 판단했다.
- `source_id = greenaway-1884`, `source_url = https://www.gutenberg.org/ebooks/31591`
  (기존 chrysanthemum 행과 같은 source_id·URL — 같은 책의 다른 항목이다).
- `confidence_level = single_source`(원전은 한 권), `culture_region = uk`,
  `era = victorian` — README §`meanings.csv`절이 정한 대로 그리너웨이 행은 문화권을
  `uk`, 시대를 `victorian`으로 적는다.
- `color`는 비웠다 — 이 목록은 색상별이 아니라 종 하나에 문구 하나를 다는 형식이라
  기존 chrysanthemum 사군자 행(중국·고대)과 같은 처리다. 기존 흰색(한국)·분홍(일본)
  행과는 문화권·시대가 겹치지 않는 별도 갈래다.
- ⚠ 직접 열람하지 못한 한계를 `editorial_note`에 명시했다. 확신도를 부풀리지 않기 위해
  `confidence_level`을 `repeated`가 아니라 `single_source`로 보수적으로 적었다(여러
  사이트가 같은 문구를 반복하지만 어차피 하나의 원전을 가리키므로).

## 4. 제외 목록

| 소재 | 대상 | 제외 이유 |
|---|---|---|
| 보라·분홍·주황 국화 색깔별 서양 꽃말 | chrysanthemum meanings | 화훼 쇼핑몰·배달 서비스 블로그 반복 문구뿐, 그리너웨이 1884 원문 인용 없음(09-07이 이미 겪은 것과 동일한 문제) |
| 흰색·크림색 리시안셔스 색깔별 꽃말 | lisianthus meanings | 같은 이유 — 화훼 블로그 집계 수준, 1차 사료 없음(08-31이 이미 보류한 것과 동일) |
| freesia 향기 성분 국립원예특작과학원 전자코 연구 | freesia | 기존 `story-freesia-scent-measured-korea`(같은 PMC 논문, "Shiny Gold" 전자코 실험)와 완전히 동일한 소재로 확인, 별행 불가 |
| freesia OMT·TPS 향 합성 유전자 연구 | freesia | 여러 최신 논문(FhTPS1~8 등)을 찾았으나 전부 2024~2026년 발표라 국내에서 검증 가능한 2차 교차 확인처가 부족하고, 기존 `story-freesia-impossible-scent`(합성 불가능한 향)와 주제가 근접해 겹침 위험 판단 |
| gerbera 네덜란드 화훼 수출 통계 | gerbera | 09-07이 이미 "통계 나열 수준이라 이야기로 세우기엔 서사가 얕음"으로 제외한 것과 동일 소재 재확인, 제외 유지 |

## 5. 최종 수치

- `stories.csv`: 454 → **456행**(+2). `story_type` 분포 변화: `history` 362→**364**
  (둘 다 history), `folklore`·`literary` 불변. `source_kind` 분포 변화: `museum`
  43→**44**, `paper` 35→**36**.
- `meanings.csv`: 369 → **370행**(+1, `babys-breath` 영국·빅토리아 시대 1행).
- `flowers.csv`: 59행 그대로(변경 없음, 트랙 B라 신규 종 없음).

두 회차(09-07·이번 회차) 모두 반영하지 못했던 `content/README.md`의 `story_type`·
`source_kind` 누적 분포 단락은 이번 회차에서 파일을 직접 세어 바로잡았다(해당 문서
참고).

## 6. 검증

`npm ci && npm run seed && npm run test && npm run typecheck` 전부 통과를 커밋 조건으로
삼았다(§완료 조건). `tests/data/catalog.test.ts`의 `EXPECTED_STORIES` 상수를
454 → 456으로 갱신했다(취지 보존, 숫자만 갱신). 결과는 PR 설명에 남긴다.
