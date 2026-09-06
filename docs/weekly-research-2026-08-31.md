# 주간 콘텐츠 리서치 기록 (weekly-research, 2026-08-31 — 3회차)

`docs/weekly-research-2026-08-17.md`(2회차, 기존 3종 심화)의 후속이며, **이번 회차
(`stories.csv` 444 → 449행)의 단일 원본**이다. 2회차 §7의 후속 권고가 남긴 여섯 후보
(`freesia` `lily-asiatic` `gerbera` `lisianthus` `babys-breath` `tulip-white`) 중
`lisianthus`·`babys-breath` 두 종을 이번에 착수한다.

수집 방향은 design-spec §1.5f(문화권 무제한·재미 우선·창작 금지선)와 §1.5d(이야기 톤)를
따랐다. 이번 회차는 사용자가 소스 다변화를 명시적으로 요구했다 — 위키 의존을 낮추고
학술 논문·원예 저널·박물관/식물원/대학·잡지·신문·PD 고서를 두루 쓰라는 지시다.

---

## 0. 결과 요약

| 파일 | 이전 | 이후 | 증가 |
|---|---|---|---|
| `stories.csv` | 444 | **449** | +5 |
| `meanings.csv` | 369 | 369 | 0 (아래 §2 참고 — 이번 회차는 stories만 추가) |

대상 2종: `lisianthus`(리시안셔스, +2) · `babys-breath`(안개꽃, +3). 둘 다 2회차 시점에
한국 유통 상위 9종 중 `stories.csv` 보유량이 가장 적은 두 종이었다(§1 참고).

`source_kind` 분포(신규 5편): `paper` 2 · `book-pd` 1 · `garden` 1 · `other` 1 —
**위키 출처 0편**(5편 중 0%). `story_type` 분포: `history` 5(전부). 카탈로그 전체
`stories.csv` 449행 기준 `source_kind` 분포는 `wiki` 168 · `garden` 56 · `magazine` 46 ·
`newspaper` 44 · `museum` 43 · `paper` 33 · `other` 32 · `book-pd` 27이다.

---

## 1. 왜 이 두 종인가

`content/README.md` 기준 한국 유통 상위 9종의 `stories.csv`/`meanings.csv` 보유 현황을
조사 착수 시점에 다시 확인했다(2회차 이후 `tulip-white` 등 다른 배치로도 행이 늘어
있었다):

| 꽃 | meanings 행 수 | stories 행 수 |
|---|---|---|
| `rose-red` | 15 | 25 |
| `tulip-white` | 15 | 18 |
| `chrysanthemum` | 8 | 16 |
| `carnation` | 13 | 16 |
| `lily-asiatic` | 11 | 17 |
| `freesia` | 8 | 13 |
| `gerbera` | 11 | 14 |
| `lisianthus` | 5 | **9** |
| `babys-breath` | 7 | **8** |

9종 전부가 2회차 때와 달리 이미 이야기를 갖고 있었다 — 그중 `lisianthus`와
`babys-breath`가 상대적으로 가장 얇았다. 이 두 종을 골라 심화하기로 했다.

---

## 2. 방법론 — WebFetch 재차단, 이번에도 WebSearch 교차 확인으로 대체

**1·2회차와 동일하게 이번 세션에서도 `WebFetch`가 조직 egress 정책으로 전면 차단돼
있었다**(`EGRESS_BLOCKED`). `www.ishs.org`·`www.wildflower.org`·`www.gutenberg.org` 등
시도한 모든 외부 도메인이 막혔다. 2회차와 같은 대체 방식을 그대로 이어 썼다 —
`WebSearch`가 돌려주는 페이지 스니펫을 근거로 삼되, 핵심 사실은 최소 2개의 독립 출처로
교차 확인한 뒤에만 `confidence_level=repeated`를 붙였고, 한 출처만 확인된 사실은
`single_source`로 정직하게 낮춰 표시했다.

**`meanings.csv`를 늘리지 않은 이유.** 두 꽃 모두 색상별 서양 "꽃말(floriography)"을
추가로 찾아봤으나, 검색에 걸리는 자료 대부분이 출처를 밝히지 않는 상업적 플로리스트
블로그(flowermeaning.com·symbolsage.com류)였다 — 이번 회차가 요구하는 "다양한 원천"
기준(학술지·박물관·식물원·잡지·신문·PD 고서)에 못 미친다. 국립원예특작과학원
꽃말사전도 두 종 모두 검색으로 항목을 찾지 못했다. 신뢰할 수 있는 새 출처를 찾지
못한 채로 행을 늘리면 데이터 품질을 스스로 깎는 일이라, 이번 회차는 **stories만
추가하고 meanings는 손대지 않았다**(기존 5행·7행 유지). 두 꽃의 색상별 꽃말 보강은
다음 회차 후보로 남긴다.

---

## 3. `lisianthus` (리시안셔스) — 이야기 2편

기존 9편이 이름의 유래(터키에서 오지 않은 "터키 도라지")·텍사스 원산·일본 육종·
씨앗의 발아 기간·로제트 휴면·과잉 채집으로 인한 자생지 감소를 이미 다루고 있어,
겹치지 않는 두 각도(과학적 발견·산업 혁신)를 새로 골랐다.

### story-lisianthus-cat-attractant — 향이 없는 줄 알았는데, 고양이는 알고 있었어요

- **핵심 사실**: 리시안셔스는 오랫동안 향이 거의 없는 꽃으로 알려졌으나, 일본
  농업·식품산업기술종합연구기구(NARO)가 2024년 발표한 연구에서 36종의 휘발성 화합물이
  검출됐다. 그중 이리도이드 화합물 4종과 액티니딘은 개다래나무(마타타비)처럼 고양이를
  끌어당기는 성분으로 알려진 것들이다. 이 성분은 잎·줄기가 아니라 꽃에서만 검출됐고,
  조사한 12개 품종 전부에서 같은 결과가 나왔다.
- **출처**: The Horticulture Journal 93(3) 게재 논문 "Lisianthus Flowers Emitted Volatile
  Components Including Iridoids and Actinidine Which Attract Cats" —
  `https://www.jstage.jst.go.jp/article/hortj/93/3/93_QH-112/_html/-char/en`
  (source_kind: `paper`, 채택). NARO 자체 보도자료(naro.go.jp)와 Japan Agri News 보도가
  같은 수치(36종·이리도이드 4종·품종 12개)를 반복해 confidence는 그대로
  `single_source`로 뒀다(원 연구가 하나이므로) — 다만 화면 문구는 이 값도 "기록으로
  남아 있는 이야기"로 뜬다(§`content/README.md` source_kind 표, paper=기관 자료 등급).
- **주의**: 이 발견은 향 성분의 유인 효과에 관한 것이지 독성 여부와 무관하다.
  `pet_safety.csv`는 이번 회차에서 변경하지 않았다.

### story-lisianthus-pollen-free-solo — 꽃가루를 지운 꽃

- **핵심 사실**: 결혼식 부케에 자주 쓰이는 리시안셔스는 꽃가루가 옷·식탁보에 얼룩을
  남기는 문제가 있었다. 일본 종묘회사 사카타는 2016년 7월 세계 최초로 꽃가루가 거의
  나오지 않는 리시안셔스(흰색·분홍 피코티·파랑 피코티 3품종)를 개발했다고 발표했고,
  지금은 '솔로(Solo)'라는 상표로 팔린다. 화병 수명 약 21일, 꽃가루 얼룩 걱정이 없어
  식당·병원 등에도 쓸 수 있다고 소개된다.
- **출처**: 사카타 그룹 공식 보도자료(`https://global-sakata.com/news/20160707.html`,
  2016-07-07)와 Sakata Ornamentals 자사 제품 페이지
  `https://sakataornamentals.com/plantname/solo/`(source_kind: `other`, 채택 — 자사 페이지
  하나로 특정). The Produce News·Greenhouse Grower·Greenhouse Management 세 독립 매체가
  같은 개발 사실을 보도해 `confidence_level=repeated`로 표시했다.

---

## 4. `babys-breath` (안개꽃) — 이야기 3편

기존 8편이 어원(석고를 사랑하는 이름)·북미 침입종 지정·"필러에서 스타로"의 위상
변화·꽃잎이 지지 않고 마르는 유전학·케냐의 색소 육종·한국의 졸업 시즌 시세·서늘한
기후 선호를 다루고 있다. 이번엔 뿌리의 산업적 쓰임(할바·소화기·비누)이라는, 지금까지
꽃과 유통에만 집중했던 시각에서 벗어난 각도를 골랐다.

### story-babysbreath-turkish-soaproot — 그 뿌리로 할바를 굳혀요

- **핵심 사실**: 튀르키예에서는 안개꽃을 비롯한 근연종의 뿌리를 '코벤'이라 부르며
  캐 왔다. 뿌리 속 사포닌이 물에서 거품을 내는 성질을 이용해 튀르키예 과자 할바를
  부풀리고 굳히는 데 쓰고, 세제·소화기 약제·금속 광택제·직물 유연제로도 쓰인다.
  튀르키예는 이 뿌리를 내는 속 전체(2속 7종)의 유전자원 중심지로 꼽힌다.
- **출처**: 학술지 논문 "Economic importance of Gypsophila L., Ankyropetalum Fenzl and
  Saponaria L. (Caryophyllaceae) taxa of Turkey"(ResearchGate 게재본) —
  `https://www.researchgate.net/publication/286984658_Economic_importance_of_Gypsophila_L_Ankyropetalum_Fenzl_and_Saponaria_L_Caryophyllaceae_taxa_of_Turkey`
  (source_kind: `paper`, 채택).
- **주의**: 이 논문은 튀르키예 자생 근연종 여러 종을 함께 다루므로, 모든 용도가
  `Gypsophila paniculata` 단독으로 확인된 사실은 아닐 수 있다 — 본문은 "이 뿌리가 나는
  여러 근연종"이라는 표현으로 속 전체의 관행임을 밝혔다. `G. paniculata` 뿌리의
  트리테르페노이드 사포닌 함량(4년생 기준 건조중량 약 4%)은 별도 논문
  (`https://doi.org/10.3390/ijms23063397`, MDPI)으로 교차 확인했다.

### story-babysbreath-saponin-cousin — 성분 이름은 사촌에게서 왔어요

- **핵심 사실**: 안개꽃 뿌리를 물에 풀면 거품이 나는 성분 '사포닌'이라는 이름은 안개꽃이
  아니라 가까운 친척 식물 사포나리아(비누풀, *Saponaria officinalis*)에서 먼저
  나왔다. 1808년 학자 J. C. C. 슈라더가 비누풀 뿌리를 알코올로 끓여 결정을 얻어내고
  이 이름을 붙였다. 안개꽃도 같은 석죽과 집안이라 뿌리에 사포닌을 넉넉히 품고 있어,
  거래명도 나란히 '흰 비누풀 뿌리(Saponariae albae radix)'로 불렸다.
- **출처**: 『킹스 아메리칸 디스펜서토리』(King's American Dispensatory, 1898 — 미국
  절충의학 약전, 퍼블릭 도메인) "Saponaria.—Soapwort." 항목, Henriette's Herbal
  Homepage 소재 —
  `https://www.henriettes-herb.com/eclectic/kings/saponaria.html`
  (source_kind: `book-pd`, 채택).
- **종 불일치 처리**: 1808년 슈라더의 명명 서술은 **사포나리아** 항목에서 확인된
  사실이지 안개꽃(*Gypsophila paniculata*) 항목이 아니다 — 본문에 "이름은 사촌에게서
  왔다"는 표현으로 이 사실을 명시했다(design-spec의 종 불일치 처리 원칙, 마돈나
  백합↔아시아틱 백합 선례와 같은 방식). 두 식물이 같은 거래명·같은 성분 계열을
  공유한다는 사실은 §3의 "Economic importance..." 논문으로 교차 확인했다.

### story-babysbreath-tumbleweed — 다 자라면 뿌리째 걸어서 떠나요

- **핵심 사실**: 안개꽃 한 그루는 씨앗을 만 개 넘게 맺는다. 꽃이 진 뒤 줄기 밑동이
  마르고 부러지기 쉬워지면, 강한 바람에 줄기 뭉치 전체가 밑동에서 꺾여 나가 회전초
  (tumbleweed)처럼 굴러다니며 씨앗을 흩뿌린다 — 한 번에 최대 약 1km까지 이동한다.
  미국·캐나다 초원 지대에서는 이 습성 때문에 도로변·목초지를 뒤덮는 잡초로 다룬다.
- **출처**: 알래스카대 앵커리지 보전과학센터(Alaska Center for Conservation Science,
  University of Alaska Anchorage) 자료 —
  `https://accs.uaa.alaska.edu/wp-content/uploads/Gypsophila_paniculata_BIO_GYPA.pdf`
  (source_kind: `garden`, 채택). 워싱턴주 잡초방제국(nwcb.wa.gov)·몬태나주립대
  익스텐션(montana.edu/extension)·캘리포니아 침입식물협의회(cal-ipc.org) 세 기관
  자료가 같은 확산 메커니즘(회전초·씨앗 수·이동 거리)을 반복해
  `confidence_level=repeated`로 표시했다.
- **기존 행과의 구분**: 기존 `story-babys-breath-invasive`가 캘리포니아·태평양 연안·
  미시간 사구의 침입종 **지정 사실**(법적·생태적 분류)을 다루는 것과 겹치지 않도록,
  이 행은 회전초 확산의 **물리적 메커니즘**만 다뤘다 — "같은 소재는 두 번 싣지
  않는다" 원칙에 따른 각도 분리다.

---

## 5. 제외 목록

| 후보 | 제외 사유 |
|---|---|
| 리시안셔스 색상별 서양 꽃말(백색="순수한 감사", 분홍="낭만적 애정" 등) | 검색에 걸리는 자료가 전부 출처 미상의 상업 플로리스트 블로그였다. 그리너웨이(1884)·뒤몽(1851) 등 기존에 쓴 PD 고서에 리시안셔스/유스토마 항목이 있는지 확인하려 했으나 WebFetch 차단으로 원문을 직접 열지 못해 검증 불가 — 확신 없이 넣지 않았다. |
| 리시안셔스 일본 하나코토바(花言葉: 우아·감사·상쾌한 아름다움 등) | 위와 같은 이유로 전부 출처 미상 일본어 꽃말 블로그였다 — 1차 자료(NIHHS급 공공 사전)를 찾지 못해 보류. |
| 안개꽃 서양 웨딩 부케 상징("영원한 사랑·순수") | JSTOR Daily·스미소니언 등 학술/잡지성 매체에서 직접 다룬 글을 찾지 못했고, 검색되는 자료는 대부분 화훼 쇼핑몰 블로그였다. 기존 `story-babys-breath-filler-to-star`가 이미 "필러에서 웨딩의 주인공으로"라는 변화를 다뤄 소재도 일부 겹친다. |
| 안개꽃 백신 보조제(GPI-0100) 활용 | 검색 결과 GPI-0100은 안개꽃(Gypsophila)이 아니라 다른 사포닌원 식물(Quillaja saponaria, 퀼라야)에서 유래한 반합성 물질로 확인돼, 안개꽃 이야기로 쓰면 사실과 다르다 — 폐기. |
| 리시안셔스 Sakata/Fukukaen 최초 품종 연혁(1933년 일본 도입·1963년 'Shihai'·1981년 첫 F1) | 구체적 연도가 확인됐으나, 기존 `story-lisianthus-japan-breeding`("들꽃을 다듬은 반세기")이 이미 같은 일본 육종사를 다루고 있어 소재 중복으로 판단해 넣지 않았다. |

---

## 6. 검증

- `npm run seed` — 통과 (교차 검증 10종 전부 OK, `stories.csv` 449행)
- `npm run test` — 1229개 전부 통과 (`tests/data/catalog.test.ts`의 `EXPECTED_STORIES`를
  444 → 449로 갱신)
- `npm run typecheck` — 통과

**다음 회차 후보**: `freesia` `lily-asiatic` `gerbera` `tulip-white`(추가 심화) — 한국
유통 상위 9종 중 아직 다루지 못한 나머지. 두 꽃(`lisianthus` `babys-breath`)의 색상별
꽃말 보강은 §5에서 밝힌 대로 신뢰할 만한 새 출처를 확보하면 재시도한다.
