# 주간 콘텐츠 리서치 기록 (weekly-research, 2026-08-17 — 2회차)

`docs/weekly-research-2026-08-15.md`(1회차, 신규 꽃 4종)의 후속이며, **이번 회차(stories.csv
377 → 384행)의 단일 원본**이다.

이번 회차는 두 트랙(design-spec §「이번 주 작업」) 중 **트랙 B — 기존 카탈로그 중 한국 유통
상위 꽃 심화**를 택했다. 신규 꽃을 늘리기보다, 이미 카탈로그에 있지만 이야기가 전혀 없던
꽃을 먼저 채우는 쪽이 값이 크다고 판단했다(§2 참고).

수집 방향은 design-spec §1.5f(문화권 무제한·재미 우선·창작 금지선)와 §1.5d(이야기 톤)를 따랐다.

---

## 0. 결과 요약

수치는 **조사 착수 시점**(main 병합 전) 기준이다. 병합 후 정정 사항은 아래 "0-1. 2026-08-18
정정"을 함께 보라 — `content/README.md` 의 최종 행 수 표가 항상 우선한다.

| 파일 | 이전 | 이후 | 증가 |
|---|---|---|---|
| `stories.csv` | 377 | **384** | +7 |
| `meanings.csv` | 246 | 246 | 0 (이번 회차는 stories 만 추가) |

대상 3종: `rose-red`(빨간 장미, +2) · `chrysanthemum`(국화, +2) · `carnation`(카네이션, +3).
셋 다 세 개 국가 이상의 문화권을 아우르도록 골랐다(프랑스·중국·미국·그리스-로마).

`source_kind` 분포: `museum` 3 · `magazine` 1 · `newspaper` 1 · `garden` 1 · `book-pd` 1 —
**위키 출처 0편**(7편 중 0%). `story_type` 분포: `history` 6 · `folklore` 1.

### 0-1. 2026-08-18 정정 — 국화 이야기 1편 소재 중복으로 제외

PR 병합 과정에서 `main` 이 `stories.csv` 의 `story_id` 유일성 교차 검증을 새로 추가했고,
이 검증에서 **`story-chrysanthemum-double-ninth`(§3, "국화주를 마시고 살아남은 사람들")가
seed-v4(`docs/story-research-2.md` #45, 2026-08-15)가 이미 실어 둔 같은 story_id·같은
소재(비장방·환경의 중양절 국화주 설화)와 겹치는 것으로 드러났다.** §3을 쓸 때 참고한
`docs/catalog-expansion-research.md` §8("다음 확장 1순위")은 2026-08-15 시점 기록이었는데,
바로 그날 늦게 들어온 seed-v4 가 그 항목을 이미 구현했다는 사실을 반영하지 못한 문서였다 —
조사 당시 `stories.csv` 를 story_id 로 직접 검색하지 않고 문서(§8)만 신뢰한 것이 원인이다.

**조치**: 이번 회차 쪽 행(§3, book-pd 출처)을 뺐다. 이번 회차의 최종 기여는 **7편이 아니라
6편**이고, `stories.csv` 최종 행 수는 (배치 2 병합 포함) 438 → **444** 다. §3의 해당 절은
그대로 남기되(조사 기록으로서의 가치), 이 정정으로 채택되지 않았음을 표시했다.

---

## 1. ⚠️ 이번 조사의 방법론적 제약 — WebFetch 재차단

**1회차(2026-08-15)와 동일하게, 이번 세션에서도 `WebFetch` 가 조직 egress 정책으로
전면 차단돼 있었다(`EGRESS_BLOCKED`, 프록시 403).** 메인 세션에서 직접 시도한 것은 물론,
독립 리서치를 맡긴 서브에이전트 3개(장미·국화·카네이션 담당) 모두 동일하게 보고했다 —
`en.wikipedia.org`·`missouribotanicalgarden.org`·`ctext.org`·`paris-conciergerie.fr`·
`perseus.tufts.edu`·`nps.gov` 등 시도한 모든 외부 도메인이 막혔고, `example.com` 같은
무관한 도메인도 동일했다. `/root/.ccr/README.md` 의 안내대로 403/407 류 정책 차단은
재시도하지 않고 이 사실 자체를 보고한다.

1회차와 같은 대체 방식을 그대로 이어 썼다: **`WebSearch`(별도 백엔드, 이번 세션에서는
정상 동작)가 돌려주는 페이지 스니펫을 근거로 삼되, 같은 사실을 최소 2개의 독립 출처로
교차 확인한 것만 채택**했다. 서브에이전트 3개의 1차 조사 결과를 메인 세션이 다시 한번
독립적으로 WebSearch 로 재확인하는 이중 교차 검증을 거쳤다(§3~§5의 "메인 세션 재확인"
참고). 그럼에도 이 방식으로 얻은 사실은 실제 페이지를 열어 눈으로 읽은 것과는 신뢰
수준이 다르다 — 특히 **정확한 날짜·수치가 자료마다 갈리는 항목은 본문에 그 갈림을
그대로 밝히고 `confidence_level=varies` 로 낮춰 표시**했다.

---

## 2. 왜 신규 꽃 대신 심화인가

`content/README.md` 기준 카탈로그 47종 중, 한국 화훼 시장 유통 상위 9종
(`rose-red` `tulip-white` `freesia` `lily-asiatic` `gerbera` `carnation` `lisianthus`
`chrysanthemum` `babys-breath`)의 `stories.csv` 보유 현황을 조사 착수 시점에 확인했다.

| 꽃 | meanings 행 수 | stories 행 수(조사 전) |
|---|---|---|
| `rose-red` | 12 | **0** |
| `tulip-white` | 13 | 2 (`story-tulip-*`, 기존) |
| `freesia` | 7 | **0** |
| `lily-asiatic` | 9 | **0** |
| `gerbera` | 5 | **0** |
| `carnation` | 8 | **0** |
| `lisianthus` | 5 | **0** |
| `chrysanthemum` | 7 | **0** |
| `babys-breath` | 6 | **0** |

`tulip-white` 한 종을 빼면 **9종 전부가 이야기 0편**이었다 — 정작 사용자가 가장 자주
마주칠 꽃일수록 `/stories`·결과 화면의 "꽃에 얽힌 설화" 블록이 텅 비어 있는 셈이다.
이번 회차는 그중 세 종(`rose-red` `chrysanthemum` `carnation`)에 착수했다. 나머지
여섯 종(`freesia` `lily-asiatic` `gerbera` `lisianthus` `babys-breath` 및 `tulip-white`
추가 심화)은 다음 회차로 넘긴다(§7).

---

## 3. `rose-red` (빨간 장미) — 이야기 2편

### story-rose-red-peace-1945 — 베를린이 무너지던 날, 이름을 얻은 장미

- **핵심 사실**: 프랑스 리옹 근교의 육종가 프랑시스 메이앙이 1930년대에 기른 장미.
  프랑스가 나치 독일에 점령되기 전 꺾꽂이 가지가 여러 나라(독일·이탈리아·미국 등)로
  보내졌다. 미국으로 간 가지는 1945년 4월 29일(베를린 함락일) '피스(Peace)'라는
  이름을 얻었고, 그해 봄 샌프란시스코에서 열린 국제연합 창설 회의 대표들의 자리마다
  이 장미가 한 송이씩 놓였다.
- **출처(서브에이전트 1차 + 메인 세션 재확인 WebSearch 교차)**:
  - America in WWII 매거진 — `http://www.americainwwii.com/articles/victorys-flower-the-peace-rose/`
    (source_kind: `magazine`, 채택)
  - storytellergarden.co.uk "The 'Peace' rose – celebrating 90 years" — 원예 칼럼, 같은
    타임라인 corroborate
  - meilland.com(육종사 메이앙 인터내셔널 공식 사이트) — 육종가 본인 계열의 공식 서사
  - 영어 위키백과 `Rosa 'Peace'` — 교차 확인용으로만 사용, 단독 출처로 쓰지 않음
- **불확실성**: 프랑스 밖으로 가지가 나간 정확한 경로는 자료마다 갈린다 — "1939년 여름
  우편으로 부쳤다"(America in WWII)와 "프랑스를 빠져나간 마지막 비행기 편"(여러 대중
  기사)이 함께 전해진다. 본문에 그 갈림을 밝히고 `confidence_level=varies` 로 표시했다.

### story-rose-red-china-four-studs — 유럽 장미를 다시 피운 중국 장미 네 그루

- **핵심 사실**: 18세기 말까지 유럽 장미는 봄 한 철만 피었다. 1791년 영국 레이턴스톤의
  길버트 슬레이터가 기른 진홍빛 중국 장미('Slater's Crimson China')와 파슨스 핑크
  ('Old Blush')를 비롯한 이른바 "네 그루의 종모 중국 장미(Four Stud Chinas)"가 도입되며
  반복해서 피는 성질이 서양 육종에 들어왔고, 오늘날 사철 피는 장미의 조상이 됐다.
- **출처**:
  - 몬티첼로(토머스 제퍼슨 사저·박물관) 백과 "Old Blush China Rose" —
    `https://www.monticello.org/encyclopedia/old-blush-china-rose` (source_kind: `museum`, 채택)
  - Jackson & Perkins(원예 회사) 블로그 "Post China Roses: Four Stud Chinas" — corroborate
  - Historic Roses Group(영국 원예 학회) "Repeat flowering old roses" — corroborate
- **불확실성**: 도입 연도가 자료마다 1791~1793년으로 갈린다(슬레이터스 크림슨은
  1791년 또는 1792년, 올드 블러시는 상선 화물로 1752년 유입설과 1793년 잉글랜드
  정착설이 혼재). `confidence_level=varies`.

---

## 4. `chrysanthemum` (국화) — 이야기 2편

`docs/catalog-expansion-research.md`(seed-v3, 2026-08-15) §8이 이미 "중양절(비장방·환경
설화, 국화주와 등고)"을 **다음 확장 1순위**로 남겨 뒀다. 이번 회차가 그 후속이다.

### story-chrysanthemum-double-ninth — 국화주를 마시고 살아남은 사람들 — ⚠️ **최종 미채택(§0-1)**

> 2026-08-18 정정: seed-v4(`docs/story-research-2.md` #45)가 같은 story_id·같은 소재로
> 2026-08-15에 이미 실어 둔 것을 병합 검증에서 발견해 이번 회차 쪽 행은 뺐다. 조사 기록으로만
> 남긴다 — 실제 `stories.csv` 에는 없다.

- **핵심 사실**: 중국 남조 시대(6세기) 오균이 쓴 『속제해기』에 실린 설화. 동한 시대
  여남 땅의 환경이 스승 비장방에게서 "구월 구일에 집에 재앙이 닥치니 산수유 주머니를
  차고 산에 올라 국화주를 마시라"는 말을 듣고 따랐고, 집에 남겨 뒀던 가축이 대신
  죽었다는 이야기. 오늘날 중양절의 등고·국화주 풍습의 유래로 전해진다.
- **출처**: WebSearch 가 돌려준 스니펫에 원문("汝南桓景隨費長房遊學累年，長房謂曰…")이
  그대로 인용돼 있었고, 이 인용을 **서브에이전트 1차 조사와 메인 세션 재확인 두 차례
  독립적으로 검색해 동일한 문면을 확인**했다. 출처 텍스트가 실제로 실려 있는 자리는
  중국어 위키문헌 `https://zh.wikisource.org/wiki/續齊諧記`(source_kind: `book-pd`, 채택).
  ctext.org(중국 고전 디지털 라이브러리)도 같은 텍스트를 보유한다고 검색됐으나, 이전 회차
  (`docs/catalog-expansion-research.md`)에서 ctext 링크가 나중에 삭제된 전례가 있어
  위키문헌 쪽을 안정적인 출처로 채택했다.
- **불확실성**: 스승 이름이 다르게 전해지는 이설(예: 다른 도인 이름)이 있는지 별도로
  검색했으나 찾지 못했다 — 모든 자료가 일관되게 비장방/환경을 지목해
  `confidence_level=repeated` 로 표시했다.

### story-chrysanthemum-france-graves — 무덤으로 간 가을꽃

- **핵심 사실**: 프랑스에서 국화는 거의 무덤에만 놓는 꽃이다. 매년 만성절(11월 1일)에
  성묘하며 국화 화분을 놓는 관습이 있어, 다른 자리에 국화를 선물하면 결례로 여겨진다.
- **출처**: The Connexion(프랑스 거주 영어권 대상 신문) "Why chrysanthemums are the French
  'flower of the dead'" — `https://www.connexionfrance.com/news/why-chrysanthemums-are-the-french-flower-of-the-dead/101947`
  (source_kind: `newspaper`, 채택)
- **불확실성**: 이 관습이 **1919년 레몽 푸앵카레 대통령의 전사자 묘 장식 호소**에서
  비롯됐다는 이야기가 흔히 전해지지만, 다른 자료(loumessugo.com 등 여행·문화 블로그)는
  **19세기 중반부터 이미 그런 관습이 있었다**고 전해 두 기원설이 정면으로 갈린다.
  본문에 두 설을 모두 밝히고 어느 한쪽으로 단정하지 않았다. `confidence_level=varies`.
  (박물관·학술 등급 출처는 이 항목에서 찾지 못했다 — §7 재검증 권고 참고.)

---

## 5. `carnation` (카네이션) — 이야기 3편

### story-carnation-mothers-day-1908 — 흰 카네이션 오백 송이로 시작된 날

- **핵심 사실**: 1908년 5월 10일, 미국 웨스트버지니아주 그래프턴의 앤드루스 감리교회에서
  애나 자비스가 연 첫 공식 어머니날 예배에 어머니가 생전에 좋아하던 흰 카네이션 오백
  송이가 보내졌다. 1914년 미국 공식 기념일이 됐지만, 정작 자비스는 상업화에 반대해
  1925년 카네이션 판매 기금 행사에 항의하다 붙잡히기도 했다.
- **출처**: 미국 국립공원관리청(NPS) "Anna Maria Jarvis" —
  `https://www.nps.gov/people/anna-maria-jarvis.htm`(source_kind: `museum`, 채택).
  스미스소니언매거진 "The Tenacious Woman Who Helped Keep Mother's Day Alive",
  History.com "Mother's Day Carnations", Mental Floss 세 곳이 같은 핵심 사실을
  corroborate.
- **불확실성**: "흰색을 고른 이유가 순수함의 상징"이라는 서술은 대중적으로 널리
  반복되지만 자비스 본인의 1차 문헌으로는 확인하지 못해 본문에서 단정하지 않았다.
  핵심 연대·장소·인물은 네 독립 출처가 일치해 `confidence_level=repeated`.

### story-carnation-flower-of-zeus — 제우스의 꽃이라는 이름

- **핵심 사실**: 카네이션 속명 디안투스는 그리스어 디오스(제우스)+안토스(꽃)의 합성어.
  기원전 4~3세기 그리스 학자 테오프라스토스가 이 이름을 처음 썼다고 전해진다. 다만
  오늘날 쓰는 정식 속명 Dianthus 는 1753년 칼 폰 린네가 『식물의 종』에서 확정한
  것이다 — **이름을 지은 사람과 학명으로 굳힌 사람이 서로 다른 시대 사람**이라는 점을
  본문에서 분리해 적었다(대중 서술 다수가 이 둘을 뭉뚱그린다).
- **출처**: UC ANR(캘리포니아 대학 농업·자연자원국, 소노마 카운티 마스터가드너)
  "Dianthus, the 'Divine Flower'" — `https://ucanr.edu/blog/real-dirt/article/dianthus-divine-flower`
  (source_kind: `garden`, 채택). etymonline·영어 위키백과로 교차 확인.
- **불확실성**: `confidence_level=varies` — 위 뭉뚱그림 문제 때문. 페르세우스 디지털
  라이브러리가 소장한 테오프라스토스 『식물지』의 실제 원문(호트 1916년 PD 번역)까지는
  이번 회차에서 열람하지 못했다(WebFetch 차단) — book-pd 등급으로 올리려면 재확인이 필요.

### story-carnation-oeillet-plot-1793 — 카네이션 두 송이에 숨긴 탈출 계획

- **핵심 사실**: 1793년 8월 28일, 파리 콩시에르주리 감옥에 갇힌 마리 앙투아네트를
  루즈빌 기사가 찾아와 옷깃의 카네이션 두 송이 속에 숨긴 쪽지로 탈출 계획을 전했다.
  왕비는 바늘로 답장을 남겼고 9월 2일 밤 탈출이 계획됐으나 간수가 막판에 망설이며
  실패했다. 이 사건 뒤 감시가 훨씬 엄해졌다.
- **출처**: 콩시에르주리(파리, Centre des monuments nationaux 관리) 공식 사이트
  `https://www.paris-conciergerie.fr/en/discover/marie-antoinette-at-the-conciergerie`
  (source_kind: `museum`, 채택 — 단, WebFetch 차단으로 직접 열람은 못 하고 WebSearch 로
  URL·개요만 확인). 프랑스어 위키백과 `Complot de l'œillet`, 역사 포럼 다수가 날짜·
  인물·경위를 동일하게 서술.
- **불확실성**: 역사학자 윌 배셔(마리 앙투아네트 연구자)가 이 사건을 "사실과 낭만적
  각색이 섞인" 일화로 논평한 것이 검색으로 확인됐다 — 카네이션 속에 쪽지를 숨겼다는
  세부가 후대에 극적으로 다듬어졌을 가능성이 있다. `confidence_level=varies` 로 표시하고,
  실존 인물(마리 앙투아네트·루즈빌)을 다루되 대사·세부는 "전해지는 대로"임을
  `editorial_note` 에 남겼다(명예 프레이밍 원칙 §1.5f 준수 — 조롱·모욕 없이 기록된
  역사적 사건만 다뤘다).

---

## 6. 제외 목록

| 후보 | 제외 사유 |
|---|---|
| 장미 "sub rosa"(비밀의 방 천장 장미 문양) 관행 | 서브에이전트가 스타 체임버(웨스트민스터궁) 등 구체적 사례를 검색으로 찾았으나 박물관·사적지 1차 자료를 열람하지 못해(WebFetch 차단) 확신도가 낮아 보류. |
| 카네이션 청탁금지법 유권해석(스승의 날) | 이미 seed-v5(`docs/story-README` §"1편은 싣지 않았다")에서 같은 사유로 보류 중인 항목과 중복. 재확인 전까지 이번에도 보류. |
| 국화 "일본 황실 문장(십육팔중표국)" | 1회차(`docs/catalog-expansion-research.md` §"chrysanthemum")에서 "일본 열여섯 잎 국화문(1926-10-21 규정)"으로 이미 채택된 소재라 중복 회피. |
| 프랑스 국화 관습의 정확한 기원(1919년 푸앵카레 단정) | 채택은 했으나 **단정하지 않고** 두 기원설을 병기(§4). 학술·박물관 등급 단일 출처를 못 찾아 다음 회차 재검증 후보로 남긴다. |
| 국화 "중양절"(§3, `story-chrysanthemum-double-ninth`) | **최초엔 채택했으나 병합 뒤 정정(§0-1)** — seed-v4(`docs/story-research-2.md` #45, 2026-08-15)가 같은 story_id·같은 설화(비장방·환경)를 이미 싣고 있어 소재 중복으로 뺐다. 원인: 참고 문서(`catalog-expansion-research.md` §8)가 같은 날 늦게 들어온 seed-v4 반영 전 스냅숏이었다 — 다음 회차부터는 문서 대신 `stories.csv` 를 story_id·소재로 직접 검색해 착수한다. |

---

## 7. 검증 및 후속 권고

- `npm run seed` — 통과 (교차 검증 7종 전부 OK, `stories.csv` 384행)
- `npm run test` — 682개 전부 통과 (`tests/data/catalog.test.ts` 의 `EXPECTED_STORIES` 를
  377 → 384로 갱신)
- `npm run typecheck` — 통과 (`.next/types` 미생성으로 처음엔 실패했으나 `npx next typegen`
  실행 후 통과 — 콘텐츠 변경과 무관한 환경 준비 단계였다)

**후속 재검증 권고**:
1. WebFetch 가 복구되면 이번 회차 7편의 URL을 실제로 열어 재확인한다 — 특히
   `story-carnation-flower-of-zeus`(테오프라스토스 원문 직접 대조)와
   `story-chrysanthemum-france-graves`(기원 연도 정리)의 `confidence_level` 을 올릴 수
   있는지 본다.
2. 다음 회차 후보: `freesia` `lily-asiatic` `gerbera` `lisianthus` `babys-breath`
   `tulip-white`(추가 심화) — 한국 유통 상위 9종 중 이번에 다루지 못한 나머지.
3. `rules.csv` 는 여전히 `rose-red` `tulip-white` `freesia` `lily-asiatic` `gerbera`
   5종만 다룬다. `chrysanthemum`·`carnation`은 이야기가 생겼지만 추천 규칙은 아직
   없다 — 편집 판단이 끝난 뒤 별도로 붙인다(README 원칙 그대로).
