# 꽃말 데이터 확장 조사 기록 (seed-v2, 2026-08-15)

`content/meanings.csv` 를 20행 → **59행**(신규 39행)으로 늘리면서 실제로 열어 본 자료,
라이선스 확인 결과, 채택·제외 판단을 남긴다. 나중에 같은 자료를 다시 뒤지지 않기 위한 기록이다.

수집 방향은 design-spec §1.5f(문화권 무제한·재미 우선)와 §1.5d(이야기 톤)를 따랐다.
**신뢰성보다 스토리라인과 감정**을 우선하되, `confidence_level` 라벨만은 정직하게 붙였다.

---

## 1. 저작권 원칙 — 무엇을 가져왔고 무엇을 가져오지 않았나

- **꽃말 단어 자체는 사실·아이디어**라 자유롭게 참조했다(예: 튤립 노랑 = hopeless love).
- **설명 문장(`meaning_ko`·`caution_note`·`editorial_note`)은 전부 자체 작성**했다.
  원문 문장을 옮긴 곳은 한 군데도 없다. 원문은 `editorial_note` 안에 **출전 표시용 짧은 인용
  형태**(`'Tulip, Yellow — Hopeless love'`)로만 남겼다.
- 퍼블릭 도메인 원전(Gutenberg)은 본문 인용도 가능하지만, 화면 톤(§1.5d)을 지키려고
  그래도 전부 우리 문장으로 다시 썼다.

## 2. 라이선스 확인 결과 — 국립원예특작과학원·농사로

**결론: 어느 쪽도 "제1유형"으로 확정할 수 없었다. 그래서 꽃말 단어만 참조했다.**

| 확인한 곳 | URL | 확인 결과 |
|---|---|---|
| 국립원예특작과학원 저작권정책 | `https://www.nihhs.go.kr/usr/extras/datacprprot.do?mc=MN0000000194` | "저작재산권 전부를 보유한 저작물"은 **공공누리 제1유형을 부착하여 개방**한다고 명시. 단 **"공공누리 표시가 부착된 저작물인지를 확인한 이후에" 이용하라**는 단서가 붙어 있다 |
| 꽃말사전 목록·상세 페이지 | `https://www.nihhs.go.kr/usr/persnal/Flower_library.do` / `.../Flower_today.do?dataNo=140&mc=MN0000000089` | 푸터에 `kogl.or.kr` 링크만 있고 **유형 배지(제1~4유형)가 붙어 있지 않다.** HTML 원본에서 `openGradeImg` 류의 배지 이미지도 없음 → **유형 미확정** |
| 농사로 「애절한 사랑의 약속, 작약」 | `https://www.nongsaro.go.kr/portal/ps/psz/psza/contentSub.ps?menuId=PS04104&cntntsNo=205071` | 배지가 실제로 붙어 있고 **제2유형**이다. HTML 원본: `<img id="openGradeImg" src="/ps/img/cmmImg_2020/common/open_mark2.png" title="제2유형:출처표시+상업적 이용금지 …">` → **상업적 이용 금지** |
| 공공데이터포털 「오늘의 꽃 조회 서비스(2.0)」 (같은 꽃말 데이터의 API 판) | `https://www.data.go.kr/data/15084605/openapi.do` | 이용허락범위 = **저작자표시-비영리-동일조건변경허락(CC BY-NC-SA)** → 비상업 한정 |

같은 기관의 같은 데이터가 창구마다 제2유형·CC BY-NC-SA로 걸려 있으므로,
**꽃말사전 페이지도 제1유형이라고 가정하지 않는 쪽이 안전하다**고 판단했다.

따라서 국립원예특작과학원 유래 행(`source_id = nihhs-*`, 총 10행)은

- 꽃말 **단어만** 참조하고, 설명·주의 문구는 전부 자체 작성
- `source_url` 에 실제 열람한 상세 페이지 URL을 기록(출처 표시)
- `editorial_note` 에 `공공누리 유형 미표기 — 꽃말 단어만 참고` 라고 남김

**Advisor 판단이 필요한 지점**: 서비스가 상업화될 때 국립원예특작과학원에 유형 확인을
문의하거나, `nihhs-*` 행을 뺄 수 있게 `source_id` 접두사로 묶어 두었다.

### 조사 방법 메모 (재현용)

꽃말사전은 검색 폼이 `POST` 이고 목록이 서버 렌더링이다. 366일 전 항목을 훑어
우리 9종에 해당하는 행만 뽑았다. 상세 페이지는 `GET` 으로도 열린다:
`https://www.nihhs.go.kr/usr/persnal/Flower_today.do?dataNo={1~366}&mc=MN0000000089`
(`dataNo` 는 1월 1일=1 … 12월 31일=366). User-Agent 를 안 보내면 400을 돌려준다.

**366일 전수 확인 결과 튤립 항목은 없다.** 튤립 꽃말은 전부 해외 자료에서 가져왔다.

## 3. 열람한 자료 목록

| source_id | 자료 | URL | 성격 |
|---|---|---|---|
| `greenaway-1884` | Kate Greenaway, *Language of Flowers* (1884) | https://www.gutenberg.org/ebooks/31591 | 퍼블릭 도메인. 색상별 항목이 가장 촘촘한 빅토리아 원전 |
| `dumont-1851` | Henrietta Dumont, *The Language of Flowers* (Philadelphia, 1851) | https://www.gutenberg.org/ebooks/71779 | 퍼블릭 도메인. 꽃말마다 유래 산문이 붙어 있어 이야기 재료가 풍부 |
| `wikipedia-plant-symbolism` | List of plants with symbolism | https://en.wikipedia.org/wiki/List_of_plants_with_symbolism | 히아신스 색상별·프리지아·헬레보어 |
| `wikipedia-hanakotoba` | Hanakotoba (일본 꽃말) | https://en.wikipedia.org/wiki/Hanakotoba | 서양 해석과 어긋나는 대비가 많아 가치가 큼 |
| `wikipedia-rose-symbolism` | Rose symbolism | https://en.wikipedia.org/wiki/Rose_symbolism | 페르시아 골 오 볼볼, 노란 장미의 현대적 재해석 |
| `wikipedia-nightingale` | Common nightingale | https://en.wikipedia.org/wiki/Common_nightingale | 골 오 볼볼 교차 확인용(행에는 rose-symbolism 을 대표 출처로 기재) |
| `wikipedia-gerbera` | Gerbera | https://en.wikipedia.org/wiki/Gerbera | 속명 유래(린네의 친구 트라우고트 게르버) |
| `wikipedia-freesia` | Freesia | https://en.wikipedia.org/wiki/Freesia | 속명 유래(프리드리히 프레제) |
| `wikipedia-paeonia-lactiflora` | Paeonia lactiflora | https://en.wikipedia.org/wiki/Paeonia_lactiflora | 花相(꽃 중의 재상) ↔ 花王(꽃 중의 왕) |
| `nihhs-*` | 국립원예특작과학원 꽃말사전 | `.../Flower_today.do?dataNo=…` | 위 2절 참조 |

## 4. 수집 표 — 신규 39행

`C` = confidence_level (`R` repeated / `V` varies / `S` single_source)

### rose-red (7행)

| 색 | 꽃말 | 문화권·시대 | 출처 | C |
|---|---|---|---|---|
| red | 부끄러워 붉어진 얼굴 | uk / victorian | greenaway-1884 `Rose, Deep Red — Bashful shame` | V |
| pink | 믿음과 잔잔한 행복 | japan / modern | hanakotoba 桃色バラ | S |
| yellow | 식어 가는 사랑, 그리고 질투 | uk / victorian | dumont-1851 + greenaway-1884 | R |
| yellow | 연애가 아닌 사랑 — 우정의 색 | global / modern | rose-symbolism | V |
| — | 밤새 노래한 나이팅게일의 사랑 | persia / medieval | rose-symbolism + nightingale | R |
| red | 열렬한 사랑, 질투, 순결 | korea / modern | nihhs-rose (5/19) | S |
| — | 붉은 장미와 흰 장미를 함께 — 하나 됨 | uk / victorian | greenaway-1884 `Rose, White and Red together — Unity` | S |

### tulip-white (4행)

| 색 | 꽃말 | 문화권·시대 | 출처 | C |
|---|---|---|---|---|
| red | 사랑을 고백합니다 | uk / victorian | greenaway-1884 + dumont-1851 | R |
| yellow | 이루어지지 않는 사랑 | uk / victorian | greenaway-1884 `Hopeless love` | R |
| yellow | 혼자 품고 있는 마음 | japan / modern | hanakotoba `one-sided love` | R |
| variegated | 아름다운 눈동자 | uk / victorian | greenaway-1884 `Beautiful eyes` | S |

### freesia (3행)

| 색 | 꽃말 | 문화권·시대 | 출처 | C |
|---|---|---|---|---|
| white | 순결과 순진한 마음 | korea / modern | nihhs-freesia (2/23) | R |
| — | 친구의 이름을 받은 꽃 | europe / 19c | wikipedia-freesia | S |
| — | 아직 여문 데 없는 마음 | japan / modern | hanakotoba `childish·immature` | S |

### lily-asiatic (5행)

| 색 | 꽃말 | 문화권·시대 | 출처 | C |
|---|---|---|---|---|
| white | 순결과 깨끗한 마음 | korea / modern | nihhs-lily (6/10) | R |
| yellow | 거짓말, 그리고 들뜬 마음 | uk / victorian | greenaway-1884 `Falsehood. Gaiety.` | R |
| orange | 살아 있다는 기쁨 | japan / modern | hanakotoba オレンジユリ | S |
| orange | 미움과 복수 | japan / modern | hanakotoba 鬼百合 | V |
| orange | 기개 — 꺾이지 않는 마음 | korea / modern | nihhs-tiger-lily (7/12) | S |

### gerbera (3행)

| 색 | 꽃말 | 문화권·시대 | 출처 | C |
|---|---|---|---|---|
| — | 신비, 풀 수 없는 수수께끼 | korea / modern | nihhs-gerbera (10/31) | S |
| white | 티 없는 마음 | western / victorian | greenaway-1884 `Daisy — Innocence` (차용) | V |
| — | 친구를 기억하려고 붙인 이름 | europe / 18c | wikipedia-gerbera | S |

### anemone (3행)

| 색 | 꽃말 | 문화권·시대 | 출처 | C |
|---|---|---|---|---|
| — | 고독, 정조, 성실 | korea / modern | nihhs-anemone (9/18) | S |
| white | 거짓 없는 진심 | japan / modern | hanakotoba | S |
| — | 바람이 데려간 사랑 — 짧아서 더 선명한 | greece-rome / ancient | dumont-1851 + greenaway-1884 | R |

### hellebore (3행)

| 색 | 꽃말 | 문화권·시대 | 출처 | C |
|---|---|---|---|---|
| — | 존재 이유 | korea / modern | nihhs-hellebore (12/15) | S |
| white | 내 불안을 가라앉혀 주세요 | uk / victorian | greenaway-1884 + plant-symbolism | R |
| — | 험담과 뒷말 | uk / victorian | greenaway-1884 `Hellebore — Scandal. Calumny.` | V |

### hyacinth (6행)

| 색 | 꽃말 | 문화권·시대 | 출처 | C |
|---|---|---|---|---|
| blue | 변치 않는 마음 | uk / victorian | dumont-1851 + plant-symbolism | R |
| purple | 용서해 주세요 | global / modern | plant-symbolism | V |
| white | 드러내지 않는 사랑스러움 | uk / victorian | greenaway-1884 + plant-symbolism | R |
| yellow | 질투 | global / modern | plant-symbolism | S |
| pink | 장난기 어린 마음 | uk / victorian | greenaway-1884 `Sport. Game. Play.` | R |
| — | 마음의 기쁨, 그리고 승리 | korea / modern | nihhs-hyacinth (3/21) | S |

### peony (5행)

| 색 | 꽃말 | 문화권·시대 | 출처 | C |
|---|---|---|---|---|
| — | 수줍음 | korea / modern | nihhs-peony 작약 (5/18) | R |
| red | 타오르는 분노 | uk / victorian | dumont-1851 `PEONY — Anger` | V |
| — | 부귀, 영화, 성실 | korea / modern | nihhs-mudan 모란 (5/9) | R |
| — | 꽃 중의 재상 — 왕 곁을 지키는 자리 | china / modern | wikipedia-paeonia-lactiflora | S |
| — | 용기 | japan / modern | hanakotoba 牡丹 | S |

## 5. 이번 확장의 축 — 같은 꽃, 갈라지는 이야기

색상 재선택 UI(§1.5c)와 "이야기가 있는 꽃말"(§1.5d)에 그대로 쓸 수 있는 대비쌍이다.

| 대비 | 한쪽 | 다른 쪽 |
|---|---|---|
| **참나리(Lilium lancifolium)** | 한국 — 기개 | 일본 오니유리 — 미움과 복수 |
| **아네모네** | 서양 — 버려진 사랑 | 한국 — 고독·정조·성실 |
| **노란 장미** | 빅토리아 — 질투 | 오늘 — 우정, 연애가 아닌 사랑 |
| **작약** | 빅토리아 Greenaway — 수줍음 / 한국 — 수줍음 | 빅토리아 Dumont — 분노 |
| **헬레보어** | 크리스마스 로즈 — 불안을 가라앉혀 주세요 | 헬레보어 — 험담과 뒷말 |
| **프리지아** | 한국·영어권 — 순결·순수 | 일본 — 어리다·미숙하다 |
| **히아신스 보라** | 그리스 — 깊은 슬픔과 애도(기존) | 현대 — 용서해 주세요 |
| **작약 ↔ 모란** | 꽃 중의 재상(花相) | 꽃 중의 왕(花王, 기존) |

## 6. 제외 목록과 사유

| 후보 | 사유 |
|---|---|
| 장미 **송이 수**별 꽃말(1송이=첫눈에 반함, 100송이=… 등) | 위키피디아 Rose 는 "the number of roses received has symbolic representation" 이라고만 적고 목록이 없다. 나머지는 전부 꽃집 마케팅 글이라 1차 자료를 못 찾았다 → **미수록**. 브리프가 요청한 "송이수" 축은 대신 `Rose, White and Red together — Unity`(색 조합) 한 행으로 대체했다 |
| 농사로 「애절한 사랑의 약속, 작약」의 설화 2편(작약 정령·화타 일화) | 공공누리 **제2유형(상업적 이용 금지)** 배지가 붙어 있어 문장 인용 불가. 꽃말 단어도 국립원예특작과학원 꽃말사전과 같아 별도 행이 필요 없었다. **다만 이야기 소재로는 `stories.csv` 후보로 남길 만하다**(출처 표기 + 자체 서술 조건) |
| 공공데이터포털 오늘의 꽃 API(15084605) | CC BY-NC-SA. 데이터 재배포 성격이라 미사용 |
| Dumont 1851 `White Rose — I would be single` | 재미있지만 `rose-red`(빨간 장미)의 색 목록과 어긋나고, 뜻이 오해되기 쉬워 보류 |
| Greenaway 1884 `Tulip — Fame`(튤립 = 명예) | 색 없는 총론 항목이라 색상별 행들과 겹친다. 기존 튤립 6행이 이미 두꺼워 보류 |
| 마돈나 백합(Lilium candidum) = 성모의 순결 | 종이 아시아틱 백합과 달라 꽃말 행보다 `stories.csv` 쪽이 맞다고 판단 |
| 헬레보어 green·pink, 거베라 red·yellow·orange 색상별 꽃말 | 신뢰할 자료를 못 찾았다. 꽃집 마케팅 문구만 반복된다 |
| 하나코토바 프리지아·아네모네의 색 구분 | 원문이 색을 나누지 않았다. 지어내지 않고 `color` 를 비웠다 |
| 장미 `sub rosa`(비밀) | Rose symbolism 문서에 언급은 있으나 서술이 얕아, 꽃말 행보다 이야기 쪽이 낫다고 보고 보류 |

## 7. Advisor 판단이 필요한 후속 항목

1. **`flowers.csv` 의 `colors` 가 이번 꽃말보다 좁다.**
   - `tulip-white` = `white` 뿐인데 신규 행에 `red` · `yellow` · `variegated` 가 있다.
     (design-spec §1.5c 색 칩 목업도 이미 `흰·크림·분홍·보라` 4색이라 `flowers.csv` 쪽이 뒤처져 있다.)
   - `rose-red` = `red|pink` 인데 신규 행에 `yellow` 가 있다.
   - 색 선택 UI가 `flowers.colors` 를 기준으로 칩을 그린다면 이 행들은 화면에 못 오른다.
     `flowers.csv` 확장 여부는 편집 판단이라 **이번 작업에서는 건드리지 않았고**,
     해당 행 `editorial_note` 에 사실만 적어 두었다.
2. **`nihhs-*` 10행의 공공누리 유형 확인.** 상업화 시점에 기관 문의가 필요하다.
   빼야 할 경우 `source_id LIKE 'nihhs-%'` 로 한 번에 걸러진다.
3. **`caution_note` 톤.** "노란 튤립 = 이루어지지 않는 사랑"처럼 부정적인 색은
   경고로 끝내지 않고 `editorial_note` 에서 짝사랑을 긍정하는 방향으로 다시 읽어 두었다.
   화면에서 어느 쪽을 보여 줄지는 UI 판단이 필요하다.
