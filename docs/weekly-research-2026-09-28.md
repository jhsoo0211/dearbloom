# 주간 콘텐츠 리서치 — 2026-09-28 (5회차)

## 0. 트랙 배분

브리프는 신규 꽃 2~4종(트랙 A) 또는 한국 유통 상위 꽃 심화(트랙 B) 중 상황에 맞게 배분하라고
지시했다. 트랙 A는 §1.5g/photos 파이프라인이 요구하는 실사 확보가 전제인데, 이 세션도 지난
네 회차와 동일하게 **`WebFetch`가 조직 egress 정책으로 전 도메인 차단**이라(아래 §1 참고)
이미지 파일을 열거나 내려받을 방법이 없다. 그래서 이번 회차도 **트랙 B(한국 유통 상위 꽃
심화)** 로 진행했다.

## 1. 이 세션의 조사 제약

- `WebFetch`로 `en.wikipedia.org`·`www.gutenberg.org`·`archive.org`·
  `www.biodiversitylibrary.org` 를 시도했고 전부 `EGRESS_BLOCKED`(도메인 무관 전면 차단)를
  확인했다 — 지난 회차들과 같은 제약이다.
- `WebSearch`는 정상 동작한다. 그래서 이번에도 **`WebSearch` 스니펫을 독립된 여러 출처로
  교차 확인하는 방식**으로 대체했다. 한 사실을 최소 두 개 이상의 독립 출처(기관·매체가 다른
  자료)로 맞대어 본 것만 신되, 애매하면 `source_kind`를 보수적으로(`magazine`/`other`) 내려
  적었다.

## 2. 대상 선정 — 왜 다시 국화(chrysanthemum)인가

한국 유통 상위 9종(장미·국화·카네이션·백합·튤립·프리지아·거베라·리시안셔스·안개꽃) 가운데
`lisianthus`·`babys-breath`는 2·3회차가, `freesia`·`gerbera`는 4회차가 이미 심화했다.
착수 시점 실제 행 수(`stories.csv` 454행 기준):

| 꽃 | stories 행 수 | meanings 행 수 |
|---|---:|---:|
| rose-red | 25 | 15 |
| tulip-white | 18 | 15 |
| chrysanthemum | 18 | 8 |
| lily-asiatic | 17 | 11 |
| carnation | 16 | 13 |
| gerbera | 14 | 11 |
| freesia | 13 | 8 |
| lisianthus | 13 | 5 |
| babys-breath | 12 | 7 |

`stories.csv` 행 수만 보면 `babys-breath`·`lisianthus`가 가장 얇지만 둘 다 직전 세 회차가
이미 두 번씩 건드려 소재 고갈 위험이 가장 크다. 반면 `chrysanthemum`은 이야기 18편이 이미
일본 황실·중국 은일·유럽 장례·미국 열풍·베트남 제단·프랑스 만성절·한국 상례/화훼 시장·
과학사·조선 시조까지 문화권을 넓게 덮고 있지만, **`meanings.csv`는 8행뿐이고 그마저
`culture_region`이 uk·japan·korea·france에만 있다 — 중국 문화권 꽃말이 단 한 행도 없다**
(이야기 쪽에는 도연명·사군자·중양절 이야기가 3편이나 있는데도). 그리고 이야기 쪽에도 서양
미술사 소재가 아직 없었다. 그래서 이번 회차도 국화 1종을 골랐다.

## 3. 신규 이야기 2편

### `story-chrysanthemum-monet-hokusai`

1897년 클로드 모네가 지베르니 자택 정원의 국화만으로 그린 정물화 네 점을, 미니애폴리스
미술관은 1830년대 가쓰시카 호쿠사이의 꽃 목판화 연작이 준 영향으로 설명한다 — 꽃이 화면
전체를 뒤덮어 배경이 남지 않는 구도가 그 연작에서 왔다는 것이다. 모네는 1870년대부터 일본
판화를 모은 수집가였다.

- 확인 경위: `WebSearch` 두 차례 교차 검색 모두 "1897년 국화 연작 네 점·호쿠사이 꽃 판화의
  영향·1870년대부터의 일본 판화 수집"이라는 동일한 서술로 일치했다(미니애폴리스 미술관
  전시 페이지 서술 + 별도 검색에서 노출된 미술사가 존 하우스의 평).
- `source_url`: https://new.artsmia.org/hub/collection-exhibitions/notes-on-a-flower-chrysanthemums-in-japan-and-france
  (Minneapolis Institute of Art, "Notes on a Flower: Chrysanthemums in Japan and France").
  `source_kind = museum`, `confidence_level = repeated`, `story_type = history`.
- 기존 16~18편 중 서양 미술사 소재가 없었다. 문화권을 `france-japan`으로 적어 두 나라가
  교차하는 이야기임을 밝혔다.

### `story-chrysanthemum-pyrethrum-persian-powder`

우리 카탈로그의 원예종 국화(`Chrysanthemum × morifolium`)와는 다른 종인 국화속 근연종
— 코카서스·페르시아의 `Chrysanthemum coccineum`과 발칸 반도 달마티아의
`Chrysanthemum cinerariifolium` — 이 꽃잎의 피레트린 성분으로 만든 천연 살충제(피레트럼)의
역사. 19세기 초 페르시아 상인들이 유럽에 들여오며 한동안 "페르시아 가루"라 불렸고, 1840년대
달마티아에서 본격 재배가 시작된 뒤 두 차례 세계대전으로 유럽 공급이 흔들리자 케냐가 새 주산지로
떠올랐다.

- 확인 경위: 학술 리뷰 논문(Wiley, *Advances in Agriculture*, 2026, open access) +
  ChemistryViews(과학 매거진) + Business Daily Africa(케냐 경제지) + Wikipedia
  `Pyrethrin`/`Persian powder` 항목 — 서로 다른 성격의 네 자료가 "페르시아 가루" 유래·
  1840년대 달마티아 재배·세계대전기 케냐 부상이라는 핵심 사실에서 일치했다.
- `source_url`: https://onlinelibrary.wiley.com/doi/full/10.1155/aia/3981617
  ("Unlocking Kenya's Pyrethrum Potential: A Breeding Review for a Competitive Future").
  `source_kind = paper`, `confidence_level = repeated`, `story_type = history`.
- **종 차이를 본문 첫 문장과 `editorial_note`에 함께 밝혔다** — 카탈로그의 절화 품종과는
  다른 종이라는 사실을 감추지 않는다(§`meanings-research-2.md` 선례와 같은 원칙).

## 4. 신규 꽃말 2행 (모두 `china` 문화권)

`meanings.csv`에 중국 문화권 행이 전혀 없었다는 사실을 §2에서 확인하고, 스미스소니언 국립아시아
미술관(Smithsonian's National Museum of Asian Art) 자료 두 건으로 채웠다:

| 색 | 꽃말 | 출처 |
|---|---|---|
| `yellow` | 장수를 부르는 술 — 노란 국화로 빚은 불로장생주 | Lucky Symbols 교육자료(`asia-archive.si.edu`) |
| (무관) | 서리에도 지지 않는 기운 | Unseen Art History: September(`asia.si.edu`) |

두 행 모두 `confidence_level = single_source`로 보수적으로 적었다 — 같은 기관(스미스소니언)의
서로 다른 두 페이지가 각각 다른 구체적 사실(노란 국화 술의 장수 효험 / 서리를 이기는 활력)을
말하고 있어, 사실 자체를 여러 독립 기관으로 교차 확인하지는 못했기 때문이다. 기존
`story-chrysanthemum-tao-yuanming`(도연명 은일)·`story-chrysanthemum-double-ninth`(중양절
국화주)와 소재가 겹치지 않는지 대조했다 — 저 두 이야기는 은일·장수 설화의 서사를 다루고,
이번 꽃말 2행은 화훼 그 자체의 상징 의미(장수·활력)를 짧게 적은 것이라 결이 다르다.

## 5. 제외 목록

| 소재 | 이유 |
|---|---|
| Illinois Extension·West Virginia Extension 등 미국 대학 익스텐션의 "chrysanthemum = friendship/truth" 꽃말 | 검색으로 확인한 값이 이미 CSV에 있는 Greenaway(1884) 행(`white=진실`, `yellow=푸대접받은 사랑`)과 사실상 같은 빅토리아 시대 꽃말을 다른 기관이 반복한 것 — 새 해석이 아니라 같은 해석의 재인용이라 판단해 신규 행으로 세우지 않았다 |
| 국화 색깔별 서양 현대 꽃말(기쁨·낙관 등) | 검색 결과가 전부 화훼 쇼핑몰·블로그 집계이고, 4회차가 이미 같은 이유로 보류한 소재와 동일 |
| Met(뉴욕) 소장 모네 〈국화〉(1882, Havemeyer Collection) | 미술관 자체 설명에 일본 판화 영향이 명시돼 있지 않아(1878~1883년 화훼 정물 20여 점 중 하나라는 사실만 확인됨), 위 §3 이야기의 핵심 주장(호쿠사이 영향)과 다른 그림이라 섞어 쓰지 않고 미니애폴리스 미술관이 다루는 1897년 연작 쪽을 채택했다 |
| 국화 동의보감 약재 효능 | 4회차와 같은 이유 — 검색 스니펫이 모두 2차 인용(칼럼·블로그)이라 한국고전종합DB 원문을 직접 열람하지 못함(WebFetch 차단) |

## 6. 최종 수치

- `stories.csv`: 454 → **456행**(+2, 둘 다 `chrysanthemum` / `story_type=history`).
  `story_type` 분포(전수 계산): `history` 364 · `folklore` 62 · `literary` 30 · `original` 0.
  `source_kind` 분포(전수 계산): `museum` 44 · `paper` 36(그 외 기존 값 불변,
  `content/README.md` §`source_kind` 절 참고).
- `meanings.csv`: 369 → **371행**(+2, 둘 다 `chrysanthemum` / `culture_region=china`).
- `flowers.csv`: 59행 그대로(변경 없음, 트랙 B라 신규 종 없음).

## 7. 검증

`npm ci && npm run seed && npm run test && npm run typecheck` 전부 통과를 커밋 조건으로
삼았다(§완료 조건). `tests/data/catalog.test.ts`의 `EXPECTED_STORIES` 행 수 상수를
454 → 456으로 갱신했다(취지 보존, 숫자만 갱신). 결과는 PR 설명에 남긴다.

이번 회차에 `content/README.md`의 `story_type`/`source_kind` 분포 문단 두 곳이 4·5회차
동안 갱신되지 않아 실제 병합 이력과 어긋나 있던 것을 함께 발견해 바로잡았다(전수 계산값으로
교체) — 새 소재 리서치와는 별개인 문서 정합성 수정이다.
