# 주간 콘텐츠 리서치 — 3회차 (2026-08-24)

세 번째 주간 콘텐츠 리서치 회차. 결과부터 요약하면 **트랙 A(신규 종)를 시도했다가 이미지 자산
파이프라인의 환경 제약으로 되돌리고, 트랙 B(기존 종 심화)로 전환해 완결했다.** 아래 §1이 그
경위이고, §2 이후가 실제로 적재된 트랙 B 3편의 조사 기록이다.

## 0. 이 회차의 환경 제약 — `WebFetch` 완전 차단

`content/README.md`의 `weekly-research(2026-08-17)` 항목이 남긴 것과 같은 계열의 제약이다.
이번 세션은 `WebFetch`가 어느 도메인이든(위키백과·Gutenberg·archive.org·학술지·Bash `curl`
포함) 조직 egress 프록시에 전부 막혀 있었다. 실제로 시도한 예:

- `https://en.wikipedia.org/wiki/Antirrhinum` → `EGRESS_BLOCKED`
- `https://www.gutenberg.org/files/57493/57493-h/57493-h.htm` → `EGRESS_BLOCKED`
- `https://archive.org/stream/naturalhistoryof05plinrich/...djvu.txt` → `EGRESS_BLOCKED`
- `https://bsapubs.onlinelibrary.wiley.com/doi/10.3732/ajb.89.2.236` → `EGRESS_BLOCKED`
- `https://iep.utm.edu/zhou-dun/` → `EGRESS_BLOCKED`
- Bash `curl`로 `images.unsplash.com` 직접 요청 → `CONNECT tunnel failed, response 403`

그래서 이번 회차도 **`WebSearch` 스니펫 교차 확인**으로 대체했다. 아래 "열람 URL"은 전부
`WebSearch` 결과가 실제로 인용·요약한 페이지이고, 같은 사실을 두 곳 이상의 검색 결과가
말할 때만 `confidence_level = repeated`를 붙였다.

## 1. 트랙 A 시도와 되돌린 경위

작업 지시는 신규 종 2~4종(연꽃·금어초 등)을 우선 검토하라고 안내했다. 실제로 진행한 순서:

1. **연꽃(Nelumbo nucifera)을 조사하다 반려동물 안전성 출처를 찾지 못해 제외했다.**
   ASPCA 독성식물 데이터베이스에 `Nelumbo nucifera`/`Lotus` 항목이 **아예 없다**(검색으로
   페이지 부재를 재확인). 대체로 나온 2차 자료(picturethisai.com·growli.app·toxipets.com)는
   서로 결론이 어긋났다 — 한쪽은 "무독성", 다른 쪽은 "ASPCA가 개에게 경도 독성으로 분류"라고
   주장했는데 후자는 확인 결과 ASPCA에 그런 등재 자체가 없어 **AI 생성 콘텐츠 특유의 오인용으로
   판단**했다. `content/README.md`가 명시한 원칙("안전성을 확인하지 못한 꽃은 도감에 올리지
   않는다", §pet_safety 섹션)에 따라 후보에서 뺐다.
2. **금어초(Antirrhinum majus)·디기탈리스(Digitalis purpurea)로 좁혀 `flowers.csv`·
   `meanings.csv`·`stories.csv`·`pet_safety.csv`를 전부 작성하고 `npm run seed`까지 통과시켰다.**
   (디기탈리스는 브리프가 제시한 후보 목록에는 없었지만, 연꽃의 안전성 출처 문제 때문에 브리프의
   "다른 종으로 바꿔도 좋다" 허용 조항에 따라 대체한 종이다. ASPCA에 정확히 종이 일치하는
   `Foxglove` 페이지가 있어 안전성 근거가 단단했다.)
3. **`npm run test`에서 막혔다.** `tests/components/photos.test.ts` ·
   `tests/components/plates.test.ts` · `tests/components/card-previews.test.ts` ·
   `tests/letters/data.test.ts`가 "카탈로그 꽃 전종은 대표 실사(`FLOWER_PHOTOS`)와 도판
   (`FLOWER_PLATES`)을 갖는다"는 불변식을 지키고 있었다. 이 실사는 Unsplash·Pexels·Wikimedia
   Commons에서 **폭 2400px 이상 · 좋은 화질 · 종 동정이 확실한 컷을 사람이 직접 보고 고르는**
   별도 파이프라인(`docs/image-assets.md`)의 산출물이라, CSV 조사만으로는 채울 수 없다.
   이번 세션은 `WebFetch`가 전 도메인 차단이라 이미지 CDN에서 실제로 사진을 열어 보거나
   내려받을 방법이 없었다(§0). `birth_photos.csv`에 이미 있던 같은 두 꽃의 위키미디어 사진
   1장씩(`geumeocho.jpg`·`digitalriseu.jpg`, 둘 다 이미 이 저장소가 라이선스까지 확인해 둔
   자산)을 재사용하는 방안도 검토했지만, 갤러리 최소 요건(꽃마다 2~4장, 폭 2400px 이상)을
   채우려면 최소 1장씩 **새로** 확보해야 해서 같은 벽에 부딪혔다.
4. 트랙 A는 CSV 4종만으로 끝나지 않고 이미지 자산까지 같은 배치에 들어가야 `npm run test`가
   통과한다는 것이 이번에 드러난 사실이다. `git checkout`으로 4개 CSV를 원상 복구하고 트랙 B로
   전환했다.
5. **되돌린 뒤에 이 세션의 작업 브랜치 자체가 오래됐다는 것도 드러났다.** 되돌리는 작업까지는
   세션 시작 시점의 `HEAD`(`3e6c03b`, 이때 기준 `stories.csv` 438행) 위에서 했는데, 이 커밋은
   `weekly-research(2026-08-17)` 회차 PR(#2)이 이미 병합된 `origin/main`(`stories.csv` 444행)보다
   여러 커밋 뒤처져 있었다. 그대로 커밋했다면 이미 `main`에 들어간 그 배치를 PR diff에서
   되돌리는 것처럼 보였을 것이다. `git fetch`로 확인한 뒤 `research/weekly-20260824` 브랜치를
   `origin/main`(444행 기준)에서 다시 만들고, 트랙 B 3편을 그 위에 다시 적용했다 — 그래서 아래
   §7의 최종 증감은 `444 → 447`이다.

**조사 자체는 버리지 않고 남겨 둔다.** 연꽃·금어초·디기탈리스 세 종에서 실제로 확인한 소재
(연꽃: 저우둔이 「애련설」· 1300년 묵은 연씨 발아 · 연등회, 금어초: 피레네 자생 개체군의 색
경계 연구 · 유전학 모델식물사, 디기탈리스: 반 고흐 황시증 가설 · 요정 장갑 어원 · 디곡신의
현재 임상 사용)는 **다음 회차에 이미지 자산까지 함께 준비되면 그대로 다시 쓸 수 있다.**

## 2. 트랙 B — 심화 대상 선정

브리프가 지목한 9종의 현재 커버리지를 집계했다(`stories.csv`/`meanings.csv` 실제 행 수):

| 꽃 | stories | meanings |
|---|---|---|
| rose-red | 23 | 15 |
| tulip-white | 18 | 15 |
| lily-asiatic | 17 | 11 |
| chrysanthemum | 15 | 8 |
| gerbera | 14 | 11 |
| freesia | 13 | 8 |
| carnation | 13 | 13 |
| **lisianthus** | **9** | **5** |
| **babys-breath** | **8** | **7** |

가장 얇은 두 종 — `lisianthus`(리시안서스)와 `babys-breath`(안개꽃) — 를 골랐다. 커버리지가
얇을수록 새 소재를 찾았을 때 기존 소재와 겹칠 위험이 낮기 때문이다. 두 종 모두 기존 stories.csv
전체를 먼저 읽고(§3 참고), 겹치는 소재를 하나하나 배제한 뒤에 조사를 시작했다.

## 3. 기존 소재 확인 — 무엇이 이미 있었나

`grep`으로 두 꽃의 기존 `stories.csv`·`meanings.csv` 행 전체를 읽었다.

- **lisianthus 기존 9편**: 일본 통명 '터키 도라지'의 유래 오해, 프레리 젠티안(초원 자생) 유래,
  일본의 절화 육종사(1960~70년대, 사카타·다키이), '좋은 입' 이름 유래, 다섯 달을 기다려 피는
  생장 기간, 텍사스 1838년 이름 변천, 드러먼드·베드퍼드 씨앗 도입사, 더우면 웅크리는 로제트
  습성, "너무 예뻐서 사라진" 텍사스 야생종 채집사.
- **babys-breath 기존 8편**: 속명 어원(그리스어 '석고를 사랑하는'), 북미(캘리포니아·태평양
  연안·미시간 슬리핑베어 듄스) 침입종 지정과 원상복구 연구, '필러에서 스타로' 화훼 시장 지위
  변화(산지 페루), 지지 않고 마르는 습성, 케냐의 염색 가공, 한국 졸업식 꽃다발 가격 상승,
  더위를 싫어하는 재배 특성, 한국 부케의 절반이 안개꽃이라는 통계.

## 4. 새로 찾은 소재 — 채택 3편

### 4-1. `story-lisianthus-genus-renamed-trade-kept-old-name`

학명이 원래 *Lisianthus russellianus*였다가 분류학적으로 *Eustoma* 속으로 재분류돼 정식
학명은 *Eustoma grandiflorum*인데, 꽃시장은 재분류 이전 속명("리시안서스")을 그대로 유통명으로
쓰고 있다는 사실. 기존 `story-lisianthus-turkish-name`(일본 시장에서 부르는 '터키 도라지'라는
통명이 왜 틀렸는가)과는 다른 층위의 소재다 — 그쪽은 **통명 하나의 유래 오해**, 이쪽은 **학명
자체의 재분류와 유통명의 불일치**다.

- 열람: Missouri Botanical Garden Plant Finder(`missouribotanicalgarden.org`, 학명 정보) ·
  westflor.co.uk · flower.style — 세 자료가 "*Lisianthus russellianus* → *Eustoma
  grandiflorum*, 유통명은 여전히 lisianthus" 사실을 일치되게 확인.
- `story_type = history` · `source_kind = garden` · `confidence_level = repeated`.

### 4-2. `story-lisianthus-vase-life-genotype-environment`

품종에 따라 화병 수명이 5일~28일까지 갈리고, 2025년 Frontiers in Plant Science 논문이
유전형뿐 아니라 재배 환경도 수명에 크게 영향을 준다는 것을 확인했다는 소재. 노화의 화학적
기전(에틸렌이 분해 효소를 깨워 세포막을 무너뜨림)까지 포함했다. 기존
`story-lisianthus-prairie`가 "화병에서 2~3주"라고 스치듯 언급한 대목을 학술 자료로 더 깊이
파고든 것이라, 같은 소재의 확장이지 반복이 아니라고 판단했다.

- 열람: Frontiers in Plant Science 2025년 논문(genotype×environment interaction) ·
  ScienceDirect(전처리 연구) 개요 · ResearchGate 개요(에틸렌 기전) — 세 자료가 일치.
- `story_type = history` · `source_kind = paper` · `confidence_level = repeated`.

### 4-3. `story-babysbreath-turkish-delight-foam`

안개꽃 뿌리의 사포닌이 터키에서 로쿰(터키식 젤리 과자)·아이스크림·할와 같은 전통 과자에
거품을 내는 재료로, 또 소화기 거품·금속 광택제·섬유 유연제 원료로도 쓰인다는 산업·화학적
소재. 기존 8편이 전부 상징·경제·생태 관점이었던 것과 달리 **화학·산업 이용**이라는 새 축이다.

⚠ **종 혼동 함정을 피했다.** 사포닌으로 세탁·비누를 만든 역사는 원래 비누풀(*Saponaria
officinalis*, 석죽과의 다른 속)의 일화이지 안개꽃(*Gypsophila*, 같은 석죽과지만 다른 속)의
일화가 아니다. 두 식물이 같은 과라 자료가 자주 섞여서, 안개꽃(Gypsophila) 종만 다루는 논문을
따로 확인해 채택했다.

- 열람: ScienceDirect, *Determination of the yield, saponin content and profile... of three
  Gypsophila species*(Industrial Crops and Products) · ResearchGate 개요.
- `story_type = history` · `source_kind = paper` · `confidence_level = repeated`.

## 5. 제외 목록

| 후보 | 배제 사유 |
|---|---|
| 연꽃(lotus) 신규 종 전체 | ASPCA에 항목 부재, 2차 자료 상호 모순 — §1-1 |
| 금어초·디기탈리스 신규 종 전체 | 이미지 자산 파이프라인이 이 세션에서 실행 불가 — §1-3 |
| 안개꽃 "비누풀"과의 세탁용 사포닌 일화 | 실제 출처는 *Saponaria officinalis*(다른 속) — 종 혼동 함정, §4-3 |
| 안개꽃 영문 통명 "baby's breath"의 유래 | "정확한 유래는 불분명하다"고 자료 스스로 밝히는 추측성 민간어원 3~4가지뿐 — 확인 가능한 사실이 없어 보류 |
| 리시안서스 그리너웨이(1884)/뒤몽(1851) "Gentian" 항목 | 리시안서스(유스토마)는 용담과이지만 속이 다른 진짜 용담(Gentiana)과 다른 식물 — 정확한 문구를 확인하지 못한 채로 종을 섞을 위험이 있어 보류 |
| 리시안서스 색상별 꽃말(핑크=사랑, 흰색=영성, 보라=고귀함) | 출처가 SEO 성격의 꽃 블로그뿐이라 근거가 약해 보류 |
| 리시안서스 겹꽃 육종사(에코 시리즈 등) | 기존 `story-lisianthus-japan-breeding`(1960~70년대 사카타·다키이 육종)과 소재가 겹칠 위험이 커서 이번 회차는 보류 |

## 6. 출처 유형 분포 (이번 회차 신규 3편)

| source_kind | 건수 |
|---|---|
| paper | 2 |
| garden | 1 |

`story_type`은 3편 모두 `history`(위 §4가 밝힌 것처럼 전부 학술·기관 자료로 확인되는 사실이다).
`confidence_level`은 3편 모두 `repeated`(각각 2곳 이상의 검색 결과가 같은 사실을 확인).

## 7. 반영 결과

| 파일 | 이전 | 이후 | 증감 |
|---|---|---|---|
| `flowers.csv` | 59 | 59 | 0 |
| `meanings.csv` | 369 | 369 | 0 |
| `stories.csv` | 444 | 447 | +3 |
| `pet_safety.csv` | 118 | 118 | 0 |

`npm run seed` · `npm run test` · `npm run typecheck` 모두 통과를 확인했다(`tests/data/catalog.test.ts`의
`EXPECTED_STORIES` 상수만 444 → 447로 갱신).
