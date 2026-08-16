# 탄생화 사전 사진 리서치 — 9~12월 (part 3)

> `content/birth_flowers.csv`에서 **flower_id가 비어 있는 9~12월 전 일자**에 대해
> Wikimedia Commons 실사 1장씩을 확보한 기록. 산출물은 `content/birth_photos.part3.csv`.
> 1~4월(part 1)·5~8월(part 2)은 각각 별도 문서로 관리한다.

---

## 1. 조사 개요

| 항목 | 내용 |
|---|---|
| 조사일 | 2026-08-16 |
| 담당 범위 | 9월·10월·11월·12월 |
| 대상 | `birth_flowers.csv`의 `flower_id` 공란 일자 **105일** |
| 출처 | Wikimedia Commons 단일 소스 |
| 조사 대상 분류군 | 중복 이름을 1회로 묶어 **96종** |
| 확보 | **101일 / 94종** |
| 미확보 | **4일 / 2종**(+ 종 특정 불가 1일) |
| 라이선스 검증 | 전 건 Commons API `extmetadata`로 기계 확인 후 개별 판정 |
| 종 검증 | 파일 제목·Commons 분류의 학명 대조 + **채택 후보 전량 썸네일 육안 확인** |
| URL 검증 | 확보 101행의 `direct_url`·`commons_page_url` 전수 HTTP 확인 |

### 진행 방식

1. **1차 수확** — 96개 분류군의 학명으로 Commons 검색 API를 돌려 후보 2,060건 수집.
   수집 단계에서 라이선스·해상도·도판 여부를 기계 필터로 1차 거른다.
2. **2~4차 보강** — 1차에서 꽃이 아닌 컷(수형·수피·묘목)만 나온 분류군을 대상으로
   부위를 지정한 재검색(`… flower`, `… cone`, `… fruit`)을 3회 더 돌렸다.
3. **육안 검증** — 채택 후보 **126장을 500px 썸네일로 내려받아 전량 눈으로 확인**했다.
   이 단계에서 18건이 탈락하고 교체됐다(§6).
4. **확정·기록** — 확정본만 다시 API로 메타데이터를 받아 CSV를 생성하고 URL을 전수 검증했다.

---

## 2. 채택 기준

### 2a. 라이선스 (하드 게이트)

- **허용**: Public domain · CC0 · CC BY(전 버전) · CC BY-SA(전 버전)
- **금지**: NC(비영리)·ND(변경금지)가 붙은 모든 조합, GFDL 단독, 저작권 표시가 있는 파일
- 판정은 사람 눈이 아니라 Commons API의 `extmetadata.LicenseShortName` / `License` 값으로 한다.
  수집 스크립트가 `nc|nd|noncommercial|noderiv|fair use|copyright` 패턴을 만나면 후보에서 즉시 제외한다.
- `extmetadata.Restrictions`(인물권·상표권 등 부가 제한) 값이 있는 파일도 제외 대상으로 두었으나,
  **확보 101건 중 해당 파일은 하나도 없었다.**

### 2b. 종 검증

같은 꽃 이름이라도 한국·영미권이 서로 다른 식물을 가리키는 경우가 많아 **3단 판정**을 뒀다.

1. CSV에 `scientific_name`이 있으면 그 학명이 최우선이다.
2. 없으면 `name_ko`(화면에 실제로 노출되는 이름)를 따른다.
3. `name_ko`가 표준 종명이 아니거나 이미 다른 날짜가 그 학명을 쓰고 있으면 `name_en`을 따른다.

어느 쪽으로 판정했든 **어긋난 사실 자체를 `species_note`에 남겼다**(§5).
세 단계로도 좁혀지지 않으면 미확보가 정답이다(§4의 10/20 사례).

### 2c. 사진 자체

- **실사만.** 세밀화·식물화·표본대지·Flora Batava/Köhler 계열 도판은 수집 단계에서 제목 패턴으로 배제했다.
- **원본 1200px 이상.** 실제 확보분은 최소 1500px, 평균 4,108px, 98/101건이 2000px 이상이다.
- **근접컷 우선.** 꽃 정면·꽃차례·매크로를 먼저 고르고, 그 종의 정체성이 꽃이 아닌 경우
  (열매·단풍·구과·수형)에는 해당 부위로 대체한 뒤 `species_note`에 근거를 적었다.
- `Assessments`가 quality/featured/valued인 파일에 가점을 줬다. 확보분 다수가 여기에 해당한다.

### 2d. direct_url 형식

`https://upload.wikimedia.org/wikipedia/commons/thumb/{a}/{ab}/{file}/1280px-{file}` 표준 썸네일 패턴을 쓴다.
**주의 두 가지**(§7 참조): API가 붙여 주는 `?utm_source=…` 추적 파라미터는 반드시 떼야 하고,
1280은 허용 폭이지만 임의 폭(320·420·640·800·1024 등)은 400을 돌려준다.

---

## 3. 결과 요약

| 월 | 대상 일자 | 확보 | 미확보 |
|---|---|---|---|
| 9월 | 28 | **28** | 0 |
| 10월 | 27 | **26** | 1 |
| 11월 | 25 | **23** | 2 |
| 12월 | 25 | **24** | 1 |
| **합계** | **105** | **101** | **4** |

### 라이선스 분포 (확보 101건)

| 라이선스 | 건수 | 비중 |
|---|---|---|
| CC BY-SA 4.0 | 56 | 55.4% |
| CC BY-SA 3.0 | 23 | 22.8% |
| CC BY 2.0 | 5 | 5.0% |
| Public domain | 5 | 5.0% |
| CC BY 4.0 | 4 | 4.0% |
| CC0 | 2 | 2.0% |
| CC BY-SA 2.0 | 2 | 2.0% |
| CC BY 2.5 | 2 | 2.0% |
| CC BY-SA 2.5 | 1 | 1.0% |
| CC BY-SA 2.5 ar | 1 | 1.0% |

- **저작자 표시 불요(PD·CC0): 7건**, 나머지 **94건은 크레딧 표기 의무**가 있다.
- SA(동일조건변경허락) 계열이 83건으로 대부분이다. 사진을 **자르거나 보정하면 그 파생물에도
  같은 라이선스가 따라붙는다.** 원본을 그대로 쓰고 크롭만 CSS로 처리하면 이 문제를 피할 수 있다.
- NC/ND는 0건이다.

### 해상도

| 항목 | 값 |
|---|---|
| 최소 원본 폭 | 1,500px (10/5 종려나무) |
| 최대 원본 폭 | 7,952px (12/17 벚꽃난) |
| 평균 원본 폭 | 4,108px |
| 1200px 미만 | 0건 |
| 2000px 이상 | 98건 |

---

## 4. 미확보 4일

미확보 일자도 CSV에 행은 존재하며, `commons_page_url`·`direct_url`·`author`·`license`·`width`가 비고
`species_note`에 사유가 들어 있다. `family_line`은 비워 두었다.

### 10/20 · 마 (Indian Hemp) — **종 특정 불가**

`name_ko` 마는 참마(*Dioscorea*)를, `name_en` Indian Hemp는 삼(*Cannabis sativa*) 또는
인도삼(*Apocynum cannabinum*)을 가리킨다. **과(科)가 아예 다른 세 후보**가 경합하는데
CSV에 `scientific_name`이 없어 §2b의 3단 판정으로도 좁혀지지 않았다.
한쪽을 골라 사진을 붙이면 나머지 두 해석에 대해 명백한 오정보가 되므로 후보를 올리지 않았다.
**원 출처(로얄플라워/순천만 계열 목록)에서 이 날짜의 원 표기를 다시 확인하는 편집 판단이 필요하다.**

### 11/5, 12/11 · 단양쑥부쟁이 (Fig Marigold) — **실사 부재 + 이름 충돌**

`name_ko` 단양쑥부쟁이는 한국 고유종 *Aster altaicus* var. *uchiyamae*(멸종위기 II급)인데
Commons에 검증 가능한 실사가 **한 장도 없다**. `name_en` Fig Marigold는 *Mesembryanthemum*속
(번행초과)을 가리켜 국화과인 한글명과 과 단위로 어긋나므로 대체 촬영본으로 메우지 않았다.
국립생물자원관·국립수목원 등 국내 기관 이미지는 Commons 밖이라 이번 라이선스 게이트를 통과하지 못한다.
**국내 공공누리 소스를 별도 트랙으로 검토할 가치가 있다.**

### 11/9 · 몰약의 꽃 (Myrrh) — **원식물 실사 부재**

몰약의 원식물 *Commiphora myrrha*를 `Commiphora myrrha` / `Commiphora myrrha tree` /
`Commiphora`(속 전체)로 3회 검색했으나, 결과는 동방박사 도상이 담긴 종교화(PD)와
근연종 *Commiphora wightii*(인도 몰약)뿐이었다. 근연종을 몰약으로 올리는 것은 종 검증 실패이므로
미확보로 남겼다. 수지(樹脂) 덩어리 사진으로 대체하는 방향은 "꽃" 항목의 취지와 어긋나 보류했고,
**이 역시 편집 판단 사항이다.**

---

## 5. 이름이 어긋나는 행 — 인수인계 필수 항목

`name_ko`·`name_en`·`scientific_name`이 서로 다른 식물을 가리키는 행이 **13건** 있다.
전부 `species_note`에 판정 근거를 적어 두었지만, 화면 노출 전에 한 번 훑어볼 것을 권한다.

| 일자 | name_ko | name_en / 학명 | 채택 학명 | 판정 근거 |
|---|---|---|---|---|
| 9/9 | 갯개미취 | Michaelmas Daisy | *Tripolium pannonicum* | 한글명 기준. 영문명은 보통 *Symphyotrichum novi-belgii* |
| 9/21 | 사프란 | Autumn Crocus | *Crocus sativus* | 한글명 기준. 영문명은 *Colchicum autumnale*를 가리키기도 함 |
| 9/25 | 메귀리 | Animated Oat | *Avena fatua* | 한글명 기준. 영문명은 보통 *Avena sterilis* |
| 9/26 | 감 | Date Plum | *Diospyros kaki* | 한글명 기준. 영문명은 고욤나무 *Diospyros lotus* |
| 9/28 | 색비름 | Love-Lies-Bleeding | *Amaranthus tricolor* | 한글명 기준. 영문명은 *Amaranthus caudatus* |
| 9/30 | 삼나무 | Cedar | *Cryptomeria japonica* | 한글명 기준. 영문명은 *Cedrus*속 |
| 10/12 | 월귤 | Bilberry | *Vaccinium vitis-idaea* | 한글명 기준. 영문명은 *Vaccinium myrtillus* |
| 10/29 | 해당화 | Crab Apple | *Rosa rugosa* | 한글명 기준. 영문명은 *Malus*속 꽃사과 |
| 11/15 | 황금싸리 | Crown Vetch | *Securigera varia* | **영문명 기준.** 황금싸리는 이 종의 표준 한글명(왕관갈퀴나물)이 아님 |
| 11/17 | 머위 | Sweet-Scented Tussilago | *Petasites japonicus* | 한글명 기준. 영문명은 같은 속 *Petasites fragrans* |
| 11/19 | 범의귀 | Aaron's Beard | *Hypericum calycinum* | **영문명 기준.** 12/6 바위취가 이미 *Saxifraga*를 쓰고 있어 중복을 피함 |
| 11/25 | 개옻나무 | *Rhus cotinus* | *Cotinus coggygria* | **CSV 학명 기준.** 한글명은 보통 *Toxicodendron trichocarpum* — ★확인 권장 |
| 12/30 | 납매 | Carolina Allspice | *Chimonanthus praecox* | 한글명 기준. 영문명은 같은 과 *Calycanthus floridus* |

**11/25가 가장 위험하다.** CSV 학명(*Rhus cotinus* = *Cotinus coggygria*, 안개나무)과
한글명(개옻나무 = *Toxicodendron trichocarpum*)이 속·생김새 모두 다르다.
학명을 신뢰해 안개나무 꽃차례를 올렸으나, 화면에는 "개옻나무"라는 이름이 붙는다.
**둘 중 어느 쪽이 이 날짜의 원 의도인지는 데이터 소유자가 정해야 한다.**

### 종이 아닌 항목 (총칭·대표종 선정)

| 일자 | 항목 | 처리 |
|---|---|---|
| 11/23, 12/7 | 양치 (Fern) | 양치식물 총칭 → 대표종 *Dryopteris filix-mas* |
| 12/2 | 이끼 (Moss) | 선태식물 총칭 → 대표종 *Polytrichum commune* |
| 11/30 | 낙엽 마른 풀 (Dry Grasses) | 특정 종 아님 → Commons `Dry grass` 분류의 질감 근접컷 |

이 밖에 CSV가 속(genus)만 준 9건(9/2 Cobaea, 9/12 Clematis, 9/19 Carex, 10/11 Lythrum,
10/30 Lobelia, 11/2 Lupinus, 11/3 Bryonia, 11/29 Baccharis, 12/23 Platanus)은
그 속의 대표종·한국 자생종을 골라 `species_note`에 어떤 종을 택했는지 명시했다.

---

## 6. 육안 검증에서 걸러진 것들

기계 필터만으로는 못 거른다는 점이 이번 조사에서 가장 분명해졌다.
API가 통과시킨 후보 중 **18건이 눈으로 보고 나서 탈락**했다. 유형은 셋이다.

**(1) 오동정 — 파일 제목이 틀린 경우.** 가장 위험한 부류다.

- `Aloe vera flower at Nilgiris` → 실제로는 *Kniphofia*(횃불백합)로 보이는 붉은 꽃대. 탈락.
  최종 채택본은 노란 꽃대가 확인되는 개체로 교체했다(*Aloe vera*의 꽃은 노랑).
- `Fiore di Calla - Zantedeschia aethiopica` → 실제로는 분홍 칼라. *Z. aethiopica*는 흰색.
  흰 불염포가 확인되는 PD 사진으로 교체.
- `Prunus armeniaca flower` 검색 상위가 대부분 *Prunus mume*(매화)였다. 살구와 매화는
  검색으로 섞이므로 제목에 `armeniaca`가 박힌 것만 채택했다.

**(2) 대상이 아예 다른 것.**

- `Bryonia dioica 005` → 검은 천 위의 **뿌리** 사진. 꽃 근접컷으로 교체.
- `Humulus lupulus 012` → 잎만 모은 4분할 몽타주. 구화수 단독컷으로 교체.
- `Petroselinum crispum …` → 흙에 갓 난 **떡잎**. 곱슬 잎 근접컷으로 교체.
- `Kaki FR 2013` → 감나무가 아니라 어린 나무의 단풍. 열매 스튜디오컷으로 교체.

**(3) 종은 맞지만 쓸 수 없는 것.**

- `2016 Singapur, Ogrody botaniczne (183)` → *Aloe vera* 맞지만 **식물원 명찰이 화면에 박혀 있다.**
- `Abies holophylla 1` / `Alnus japonica …` → 역광으로 줄기만 보이는 수형컷.
- `Acer palmatum leaves in autumn` → 잎이 성글어 단풍으로 읽히지 않음. 매크로로 교체.
- `Berberis koreana 2016-04-28 8986` → 꽃 없이 가시 줄기만.

이 밖에 **색 지정을 맞추기 위한 교체**도 있었다.
10/19 "**빨강** 봉선화"는 자홍색 개체를 붉은 개체로, 10/23 "**흰**독말풀"은 연보라 개체를
흰 꽃 개체로 바꿨다. 이름에 색이 명시된 행은 색까지 검증 대상으로 본다.

---

## 7. 실무 함정 (다음 작업자용)

**① Commons API가 주는 `thumburl`을 그대로 쓰면 안 된다.**
`?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail`이 붙어 오는데,
`upload.wikimedia.org`는 이 쿼리스트링이 달린 요청에 **400을 돌려준다.**
CSV에 넣기 전에 `?` 이후를 잘라야 한다. 처음에 이걸 모르고 104건 전량 다운로드에 실패했다.

**② 썸네일 폭은 아무 값이나 못 쓴다.**
Wikimedia가 허용 폭을 표준 목록으로 제한했다(에러 메시지가 `Use thumbnail sizes listed on https://w.wiki/GHai`).
실측 결과 **120·250·500·1280·1920은 200**, **160·200·220·300·320·400·640·800·1024·2560은 400**이었다.
브리프가 지정한 1280은 유효 폭이다. 검증용 썸네일은 500px을 썼다.

**③ `upload.wikimedia.org`는 연속 요청에 429를 던진다.**
100건 넘게 받을 때는 요청 간 0.7~1.2초 간격과 `--retry`가 필요하다.
간격 없이 돌렸을 때 마지막 9건이 429로 깨졌다.

**④ 스크래치패드는 병렬 워커와 공유된다.**
`scratchpad/` 바로 아래에 `candidates.json` 같은 일반적인 이름으로 파일을 쓰면
동시에 도는 다른 워커가 덮어쓴다. 실제로 한 번 덮어써져 재수집했다.
**작업별 하위 디렉터리를 파고 그 안에서만 쓸 것.**

**⑤ PowerShell 5.1은 BOM 없는 `.ps1`의 비ASCII 리터럴을 깨뜨린다.**
스크립트 안에서 `'Reinhold Möller Ermell'` 같은 문자열과 비교하면 매칭이 조용히 실패한다.
비교는 ASCII 패턴(`'^Reinhold M\S+ller Ermell$'`)으로 하고, 한글 데이터는 파일에서
`-Encoding UTF8`로 읽어 들이는 쪽이 안전하다.

**⑥ Commons `Artist` 필드에는 라이선스 안내문이 통째로 섞여 온다.**
한 건은 699자짜리 이용 안내문이 그대로 작가명 자리에 들어 있었다. 크레딧 이름만 남기고 정리해야 한다.
정리한 4건: Citron, Medium69 (William Crochot), Herby (talk thyme), Reinhold Möller (Ermell).

**⑦ 검색 필터로 도판을 거를 때 제목 패턴이 필요하다.**
`filetype:bitmap`은 SVG만 걸러 낼 뿐 스캔된 세밀화는 통과시킨다.
`flora batava|mhnt.bot|köhler|sturm|descriptionfr|- pl\d{4}|prodromus|icones` 등을 제목에서 배제해야
19세기 식물도감 스캔본이 상위로 올라오지 않는다. (단 `(MHNT)` 접두 파일 중
툴루즈 자연사박물관이 **정원에서 찍은 생체 사진**도 있어, 표본대지와 구분해 2건은 채택했다.)

---

## 8. 크레딧 표기

PD·CC0 7건을 뺀 **94건은 저작자 표시가 의무**다. CSV의 `author`·`license` 두 컬럼이 그대로 표기 원본이다.
권장 형식은 다음과 같다.

```
사진: {author} / {license} · Wikimedia Commons
```

SA 계열(83건)을 **자르거나 보정해 재배포**하면 파생물도 동일 라이선스를 따라야 한다.
원본 URL을 그대로 쓰고 화면 크롭은 CSS로 처리하면 이 조항에 걸리지 않는다.

---

## 9. 월별 확보 목록

#### 9월

| 일 | 이름 | 파일(Commons) | 작가 | 라이선스 | 원본 폭 |
|---|---|---|---|---|---|
| 1 | 호랑이꽃 | [Tigridia pavonia flower.jpg](https://commons.wikimedia.org/wiki/File:Tigridia_pavonia_flower.jpg) | Citron | CC BY-SA 3.0 | 3000 |
| 2 | 멕시칸 아이비 | [Cobaea scandens 4529.jpg](https://commons.wikimedia.org/wiki/File:Cobaea_scandens_4529.jpg) | Amada44 | CC BY-SA 3.0 | 4928 |
| 3 | 마거리트 | [00 4351 Strauchmargerite (Argyranthemum frutescens).jpg](https://commons.wikimedia.org/wiki/File:00_4351_Strauchmargerite_(Argyranthemum_frutescens).jpg) | W. Bulach | CC BY-SA 4.0 | 2667 |
| 4 | 뱀무 | [Geum japonicum 1.JPG](https://commons.wikimedia.org/wiki/File:Geum_japonicum_1.JPG) | Qwert1234 | CC BY-SA 3.0 | 3888 |
| 5 | 느릅나무 | [Ulmus davidiana var. japonica samara at winter.JPG](https://commons.wikimedia.org/wiki/File:Ulmus_davidiana_var._japonica_samara_at_winter.JPG) | Dalgial | CC BY-SA 3.0 | 3264 |
| 6 | 한련 | [Close-up of Tropaeolum majus flowers droplets -20190830-RM-081005.jpg](https://commons.wikimedia.org/wiki/File:Close-up_of_Tropaeolum_majus_flowers_droplets_-20190830-RM-081005.jpg) | Ermell | CC BY-SA 4.0 | 5182 |
| 7 | 오렌지 | [Citrus sinensis CloseupFlowerSolanadelPino.jpg](https://commons.wikimedia.org/wiki/File:Citrus_sinensis_CloseupFlowerSolanadelPino.jpg) | Javier martin | Public domain | 2976 |
| 8 | 갓 | [Brassica juncea Flower.jpg](https://commons.wikimedia.org/wiki/File:Brassica_juncea_Flower.jpg) | Shmunmun | CC BY-SA 3.0 | 1824 |
| 9 | 갯개미취 | [Tripolium pannonicum (flowers).jpg](https://commons.wikimedia.org/wiki/File:Tripolium_pannonicum_(flowers).jpg) | Le.Loup.Gris | CC BY-SA 3.0 | 2288 |
| 11 | 알로에 | [A.vera-suzana-1.jpg](https://commons.wikimedia.org/wiki/File:A.vera-suzana-1.jpg) | Philmarin | CC BY-SA 3.0 | 2128 |
| 12 | 클레마티스 | [Clematis terniflora s4.jpg](https://commons.wikimedia.org/wiki/File:Clematis_terniflora_s4.jpg) | Alpsdake | CC BY-SA 4.0 | 6000 |
| 13 | 버드나무 | [Salix babylonica (Saule pleureur) - 20150810 10h23 (11045).jpg](https://commons.wikimedia.org/wiki/File:Salix_babylonica_(Saule_pleureur)_-_20150810_10h23_(11045).jpg) | Medium69 (William Crochot) | CC BY-SA 4.0 | 5284 |
| 14 | 마르멜로 | [Blooming quince (Cydonia oblonga).jpg](https://commons.wikimedia.org/wiki/File:Blooming_quince_(Cydonia_oblonga).jpg) | Ввласенко | CC BY-SA 3.0 | 3082 |
| 16 | 용담 | [Gentiana scabra var. buergeri (flower s3).JPG](https://commons.wikimedia.org/wiki/File:Gentiana_scabra_var._buergeri_(flower_s3).JPG) | Alpsdake | CC BY-SA 4.0 | 3400 |
| 17 | 에리카 | [Erica carnea 3 RF.jpg](https://commons.wikimedia.org/wiki/File:Erica_carnea_3_RF.jpg) | Robert Flogaus-Faust | CC BY 4.0 | 2326 |
| 18 | 엉겅퀴 | [Japanese Thistle Cirsium japonicum bud-flower.jpg](https://commons.wikimedia.org/wiki/File:Japanese_Thistle_Cirsium_japonicum_bud-flower.jpg) | TANAKA Juuyoh (田中十洋) | CC BY 2.0 | 3648 |
| 19 | 사초 | [Carex pendula inflorescens (57).jpg](https://commons.wikimedia.org/wiki/File:Carex_pendula_inflorescens_(57).jpg) | Julia Kruse | CC BY-SA 3.0 | 2816 |
| 20 | 로즈메리 | [Rosmarinus officinalis-Romarin cultivé-Fleurs-20201009.jpg](https://commons.wikimedia.org/wiki/File:Rosmarinus_officinalis-Romarin_cultiv%C3%A9-Fleurs-20201009.jpg) | Daniel VILLAFRUELA | CC BY-SA 4.0 | 3024 |
| 21 | 사프란 | [Crocus sativus - Saffron crocus - Safran 03.JPG](https://commons.wikimedia.org/wiki/File:Crocus_sativus_-_Saffron_crocus_-_Safran_03.JPG) | Zeynel Cebeci | CC BY-SA 4.0 | 2232 |
| 22 | 퀘이킹 그라스 | [Briza media - keskmine värihein.jpg](https://commons.wikimedia.org/wiki/File:Briza_media_-_keskmine_v%C3%A4rihein.jpg) | Ivar Leidus | CC BY-SA 3.0 | 4000 |
| 23 | 주목 | [Japanese Yew Taxus cuspidata Leaf Closeup 3008px.jpg](https://commons.wikimedia.org/wiki/File:Japanese_Yew_Taxus_cuspidata_Leaf_Closeup_3008px.jpg) | Photo (c)2007 Derek Ramsey (Ram-Man) | CC BY-SA 2.5 | 3008 |
| 24 | 오렌지 | [Citrus sinensis CloseupFlowerSolanadelPino.jpg](https://commons.wikimedia.org/wiki/File:Citrus_sinensis_CloseupFlowerSolanadelPino.jpg) | Javier martin | Public domain | 2976 |
| 25 | 메귀리 | [Avena fatua sl6.jpg](https://commons.wikimedia.org/wiki/File:Avena_fatua_sl6.jpg) | Stefan.lefnaer | CC BY-SA 4.0 | 3096 |
| 26 | 감 | [Fuyu persimmon fruits, one cut open.jpg](https://commons.wikimedia.org/wiki/File:Fuyu_persimmon_fruits,_one_cut_open.jpg) | Frank Schulenburg | CC BY-SA 4.0 | 5472 |
| 27 | 떡갈나무 | [Quercus dentata (44354176202).jpg](https://commons.wikimedia.org/wiki/File:Quercus_dentata_(44354176202).jpg) | LiCheng Shih | CC BY 2.0 | 6016 |
| 28 | 색비름 | [Amaranthus tricolor (in a flowerbed) 02.jpg](https://commons.wikimedia.org/wiki/File:Amaranthus_tricolor_(in_a_flowerbed)_02.jpg) | Kor!An (Корзун Андрей) | CC BY-SA 3.0 | 2816 |
| 29 | 사과 | [Malus domestica (Apple) flowers 3.jpg](https://commons.wikimedia.org/wiki/File:Malus_domestica_(Apple)_flowers_3.jpg) | Relativity | CC BY-SA 4.0 | 5472 |
| 30 | 삼나무 | [Japanese cedar cones - Cryptomeria japonica.jpg](https://commons.wikimedia.org/wiki/File:Japanese_cedar_cones_-_Cryptomeria_japonica.jpg) | MrPanyGoff | CC BY-SA 3.0 | 3014 |

#### 10월

| 일 | 이름 | 파일(Commons) | 작가 | 라이선스 | 원본 폭 |
|---|---|---|---|---|---|
| 2 | 살구 | [Prunus armeniaca flowers in Kharkov.jpg](https://commons.wikimedia.org/wiki/File:Prunus_armeniaca_flowers_in_Kharkov.jpg) | Victor Vizu | CC BY-SA 3.0 | 3264 |
| 3 | 단풍나무 | [Japanischer Ahorn -- 2021 -- 3946.jpg](https://commons.wikimedia.org/wiki/File:Japanischer_Ahorn_--_2021_--_3946.jpg) | Dietmar Rabich | CC BY-SA 4.0 | 4268 |
| 4 | 홉 | [Humulus Lupulus Hopfendolde-mit-hopfengarten.jpg](https://commons.wikimedia.org/wiki/File:Humulus_Lupulus_Hopfendolde-mit-hopfengarten.jpg) | LuckyStarr | CC BY 2.5 | 2560 |
| 5 | 종려나무 | [Trachycarpus fortunei inflorescence.jpg](https://commons.wikimedia.org/wiki/File:Trachycarpus_fortunei_inflorescence.jpg) | Rillke | CC BY-SA 3.0 | 1500 |
| 6 | 개암나무 | [Male inflorescence of Corylus heterophylla var. thunbergii.jpg](https://commons.wikimedia.org/wiki/File:Male_inflorescence_of_Corylus_heterophylla_var._thunbergii.jpg) | 小石川人晃 | CC BY-SA 4.0 | 6048 |
| 7 | 전나무 | [Abies holophylla lt.jpg](https://commons.wikimedia.org/wiki/File:Abies_holophylla_lt.jpg) | Darius Baužys | CC BY-SA 4.0 | 4928 |
| 8 | 파슬리 | [Parsley leaves.jpg](https://commons.wikimedia.org/wiki/File:Parsley_leaves.jpg) | Jeffery Martin | CC0 | 4608 |
| 9 | 회향 | [Foeniculum vulgare FlowersCloseup 15July2009 ParqueNaturalLagunasdelaMata.jpg](https://commons.wikimedia.org/wiki/File:Foeniculum_vulgare_FlowersCloseup_15July2009_ParqueNaturalLagunasdelaMata.jpg) | Javier martin | Public domain | 3648 |
| 10 | 멜론 | [Flower of Cucumis melo.jpg](https://commons.wikimedia.org/wiki/File:Flower_of_Cucumis_melo.jpg) | Frantishak | CC BY-SA 4.0 | 2960 |
| 11 | 부처꽃 | [Lythrum salicaria flowers - Kulna.jpg](https://commons.wikimedia.org/wiki/File:Lythrum_salicaria_flowers_-_Kulna.jpg) | Ivar Leidus | CC BY-SA 4.0 | 4000 |
| 12 | 월귤 | [Vaccinium vitis-idaea (flowering).jpg](https://commons.wikimedia.org/wiki/File:Vaccinium_vitis-idaea_(flowering).jpg) | Hans Hillewaert | CC BY-SA 3.0 | 3604 |
| 13 | 조팝나무 | [Spiraea prunifolia var. simpliciflora 2014.4.5 (13679069895).jpg](https://commons.wikimedia.org/wiki/File:Spiraea_prunifolia_var._simpliciflora_2014.4.5_(13679069895).jpg) | 영철 이 from 광주 광역시 | CC BY-SA 2.0 | 3888 |
| 15 | 스위트 바즐 | [Ocimum basilicum CG NBG LR.jpg](https://commons.wikimedia.org/wiki/File:Ocimum_basilicum_CG_NBG_LR.jpg) | PumpkinSky | CC BY-SA 4.0 | 6000 |
| 17 | 포도 | [Bunch of grapes amidst vine leaves, Ponte de Sor (approx. GPS location) julesvernex2.jpg](https://commons.wikimedia.org/wiki/File:Bunch_of_grapes_amidst_vine_leaves,_Ponte_de_Sor_(approx._GPS_location)_julesvernex2.jpg) | Jules Verne Times Two | CC BY-SA 4.0 | 4072 |
| 18 | 넌출월귤 | [Vaccinium oxycoccos kz05.jpg](https://commons.wikimedia.org/wiki/File:Vaccinium_oxycoccos_kz05.jpg) | Krzysztof Ziarnek, Kenraiz | CC BY-SA 4.0 | 4602 |
| 19 | 빨강 봉선화 | [Impatiens balsamina hybrid-4-xavier cottage-yercaud-salem-India.jpg](https://commons.wikimedia.org/wiki/File:Impatiens_balsamina_hybrid-4-xavier_cottage-yercaud-salem-India.jpg) | Yercaud-elango | CC BY-SA 4.0 | 3456 |
| 20 | 마 | **미확보** | — | — | — |
| 21 | 엉겅퀴 | [Japanese Thistle Cirsium japonicum bud-flower.jpg](https://commons.wikimedia.org/wiki/File:Japanese_Thistle_Cirsium_japonicum_bud-flower.jpg) | TANAKA Juuyoh (田中十洋) | CC BY 2.0 | 3648 |
| 22 | 벗풀 | [野慈姑 Sagittaria trifolia -高雄原生植物園 Kaohsiung Original Botanical Garden, Taiwan- (26111914217).jpg](https://commons.wikimedia.org/wiki/File:%E9%87%8E%E6%85%88%E5%A7%91_Sagittaria_trifolia_-%E9%AB%98%E9%9B%84%E5%8E%9F%E7%94%9F%E6%A4%8D%E7%89%A9%E5%9C%92_Kaohsiung_Original_Botanical_Garden,_Taiwan-_(26111914217).jpg) | 阿橋 HQ | CC BY-SA 2.0 | 2736 |
| 23 | 흰독말풀 | [Datura stramonium flower (8975477148).jpg](https://commons.wikimedia.org/wiki/File:Datura_stramonium_flower_(8975477148).jpg) | John Tann from Sydney, Australia | CC BY 2.0 | 3289 |
| 24 | 매화 | [Flowers of Prunus mume (Armenaca mume ‘Bumpi’) at Nagai Botanical Garden, February 2024 - 5452.jpg](https://commons.wikimedia.org/wiki/File:Flowers_of_Prunus_mume_(Armenaca_mume_%E2%80%98Bumpi%E2%80%99)_at_Nagai_Botanical_Garden,_February_2024_-_5452.jpg) | Laitche | CC BY-SA 4.0 | 5144 |
| 25 | 단풍나무 | [Japanischer Ahorn -- 2021 -- 3946.jpg](https://commons.wikimedia.org/wiki/File:Japanischer_Ahorn_--_2021_--_3946.jpg) | Dietmar Rabich | CC BY-SA 4.0 | 4268 |
| 26 | 수영 | [Rumex acetosa - Hapu oblikas.jpg](https://commons.wikimedia.org/wiki/File:Rumex_acetosa_-_Hapu_oblikas.jpg) | Ivar Leidus | CC BY-SA 3.0 | 4000 |
| 28 | 무궁화 | [(MHNT) Hibiscus syriacus Pink Rose of Sharon hibiscus flower - Les Martels, Giroussens Tarn.jpg](https://commons.wikimedia.org/wiki/File:(MHNT)_Hibiscus_syriacus_Pink_Rose_of_Sharon_hibiscus_flower_-_Les_Martels,_Giroussens_Tarn.jpg) | Didier Descouens | CC BY-SA 4.0 | 7870 |
| 29 | 해당화 | [Rosa rugosa Tjörn June 2026 01.jpg](https://commons.wikimedia.org/wiki/File:Rosa_rugosa_Tj%C3%B6rn_June_2026_01.jpg) | ArildV | CC BY-SA 4.0 | 7543 |
| 30 | 로벨리아 | [Lobelia erinus flower (02).jpeg](https://commons.wikimedia.org/wiki/File:Lobelia_erinus_flower_(02).jpeg) | Nicola van Berkel | CC BY-SA 4.0 | 2048 |
| 31 | 칼라 | [Arum lily (Zantedeschia aethiopica) (46592567661).jpg](https://commons.wikimedia.org/wiki/File:Arum_lily_(Zantedeschia_aethiopica)_(46592567661).jpg) | Bernard Spragg. NZ from Christchurch, New Zealand | Public domain | 5023 |

#### 11월

| 일 | 이름 | 파일(Commons) | 작가 | 라이선스 | 원본 폭 |
|---|---|---|---|---|---|
| 1 | 서양모과 | [Medlar (Mespilus germanica) flower, Ayrshire.jpg](https://commons.wikimedia.org/wiki/File:Medlar_(Mespilus_germanica)_flower,_Ayrshire.jpg) | Rosser1954 | CC BY-SA 4.0 | 4608 |
| 2 | 루피너스 | [Lupinus polyphyllus UA 2026 G4.jpg](https://commons.wikimedia.org/wiki/File:Lupinus_polyphyllus_UA_2026_G4.jpg) | George Chernilevsky | CC BY 4.0 | 3880 |
| 3 | 브리오니아 | [P1000629 Bryonia dioica (Cucurbitaceae) Flower (detail).JPG](https://commons.wikimedia.org/wiki/File:P1000629_Bryonia_dioica_(Cucurbitaceae)_Flower_(detail).JPG) | Magnus Manske | CC BY-SA 3.0 | 3648 |
| 4 | 골고사리 | [Asplenium scolopendrium leaves.jpg](https://commons.wikimedia.org/wiki/File:Asplenium_scolopendrium_leaves.jpg) | Nicolas Weghaupt | CC0 | 4928 |
| 5 | 단양쑥부쟁이 | **미확보** | — | — | — |
| 6 | 등골나물 | [Eupatorium japonicum (at Tsukuba Botanical Garden, Ibaraki, Japan) 01.jpg](https://commons.wikimedia.org/wiki/File:Eupatorium_japonicum_(at_Tsukuba_Botanical_Garden,_Ibaraki,_Japan)_01.jpg) | 小石川人晃 | CC BY-SA 4.0 | 6492 |
| 8 | 가는동자꽃 | [Silene flos-cuculi flower - Niitvälja.jpg](https://commons.wikimedia.org/wiki/File:Silene_flos-cuculi_flower_-_Niitv%C3%A4lja.jpg) | Ivar Leidus | CC BY-SA 4.0 | 4000 |
| 9 | 몰약의 꽃 | **미확보** | — | — | — |
| 10 | 부용 | [Hibiscus mutabilis (190111-1618).jpg](https://commons.wikimedia.org/wiki/File:Hibiscus_mutabilis_(190111-1618).jpg) | Wee Hong | CC BY-SA 4.0 | 3120 |
| 12 | 레몬 | [Citrus limon (flower).jpg](https://commons.wikimedia.org/wiki/File:Citrus_limon_(flower).jpg) | Filo gèn' | CC BY-SA 4.0 | 4608 |
| 13 | 레몬 버베나 | [Aloysia citrodora - flowers.jpg](https://commons.wikimedia.org/wiki/File:Aloysia_citrodora_-_flowers.jpg) | Metrónomo | CC BY-SA 2.5 ar | 4320 |
| 14 | 소나무 | [Pinus densiflora, Morris Arboretum 04.jpg](https://commons.wikimedia.org/wiki/File:Pinus_densiflora,_Morris_Arboretum_04.jpg) | Shuvaev | CC BY-SA 4.0 | 4608 |
| 15 | 황금싸리 | [Bunten Kronwicke (Securigera varia) Blüte-20200626-RM-173640.jpg](https://commons.wikimedia.org/wiki/File:Bunten_Kronwicke_(Securigera_varia)_Bl%C3%BCte-20200626-RM-173640.jpg) | Ermell | CC BY-SA 4.0 | 4822 |
| 17 | 머위 | [Japans hoefblad (Petasites japonicus) 02.JPG](https://commons.wikimedia.org/wiki/File:Japans_hoefblad_(Petasites_japonicus)_02.JPG) | Dominicus Johannes Bergsma | CC BY-SA 3.0 | 4224 |
| 19 | 범의귀 | [Millepertuis à calice persistant (hypericum calycinum).jpg](https://commons.wikimedia.org/wiki/File:Millepertuis_%C3%A0_calice_persistant_(hypericum_calycinum).jpg) | JackyM59 | CC BY-SA 4.0 | 3899 |
| 20 | 뷰글라스 | [Anchusa officinalis inflorescence - Kulna.jpg](https://commons.wikimedia.org/wiki/File:Anchusa_officinalis_inflorescence_-_Kulna.jpg) | Ivar Leidus | CC BY-SA 4.0 | 6000 |
| 21 | 초롱꽃 | [20210620 Hortus botanicus Leiden - Campanula punctata var. hondoensis (flowers).jpg](https://commons.wikimedia.org/wiki/File:20210620_Hortus_botanicus_Leiden_-_Campanula_punctata_var._hondoensis_(flowers).jpg) | Rudolphous | CC BY-SA 4.0 | 6000 |
| 22 | 매자나무 | [Berberis koreana 2016-05-17 0149.jpg](https://commons.wikimedia.org/wiki/File:Berberis_koreana_2016-05-17_0149.jpg) | Salicyna | CC BY-SA 4.0 | 5152 |
| 23 | 양치 | [Uitrollend blad van een mannetjesvaren (Dryopteris filix-mas) 28-04-2025 (d.j.b.) 02.jpg](https://commons.wikimedia.org/wiki/File:Uitrollend_blad_van_een_mannetjesvaren_(Dryopteris_filix-mas)_28-04-2025_(d.j.b.)_02.jpg) | Dominicus Johannes Bergsma | CC BY-SA 4.0 | 4062 |
| 24 | 가막살나무 | [Gamaksal-tree-fruit.jpg](https://commons.wikimedia.org/wiki/File:Gamaksal-tree-fruit.jpg) | Ryuch | CC BY-SA 4.0 | 4032 |
| 25 | 개옻나무 | [(MHNT) Cotinus coggygria - inflorescence.jpg](https://commons.wikimedia.org/wiki/File:(MHNT)_Cotinus_coggygria_-_inflorescence.jpg) | Didier Descouens | CC BY-SA 4.0 | 6377 |
| 26 | 서양톱풀 | [Yarrow (Achillea millefolium).jpg](https://commons.wikimedia.org/wiki/File:Yarrow_(Achillea_millefolium).jpg) | Petar Milošević | CC BY-SA 4.0 | 3225 |
| 27 | 붉나무 | [Rhus javanica with autumn leaves.jpg](https://commons.wikimedia.org/wiki/File:Rhus_javanica_with_autumn_leaves.jpg) | 小石川人晃 | CC BY-SA 4.0 | 6048 |
| 29 | 바카리스 | [Baccharis halimifolia flower female NC1.jpg](https://commons.wikimedia.org/wiki/File:Baccharis_halimifolia_flower_female_NC1.jpg) | Macleay Grass Man | CC BY 2.0 | 4000 |
| 30 | 낙엽 마른 풀 | [Autumn Grass.jpg](https://commons.wikimedia.org/wiki/File:Autumn_Grass.jpg) | Serge Quadrado | CC BY-SA 4.0 | 5184 |

#### 12월

| 일 | 이름 | 파일(Commons) | 작가 | 라이선스 | 원본 폭 |
|---|---|---|---|---|---|
| 1 | 쑥국화 | [Bloemen van Boerenwormkruid (Tanacetum vulgare). 17-08-2025. (actm.) 02.jpg](https://commons.wikimedia.org/wiki/File:Bloemen_van_Boerenwormkruid_(Tanacetum_vulgare)._17-08-2025._(actm.)_02.jpg) | Agnes Monkelbaan | CC BY-SA 4.0 | 4396 |
| 2 | 이끼 | [Polytrichum commune .jpg](https://commons.wikimedia.org/wiki/File:Polytrichum_commune_.jpg) | Hans Hillewaert | CC BY-SA 4.0 | 3800 |
| 4 | 수영 | [Rumex acetosa - Hapu oblikas.jpg](https://commons.wikimedia.org/wiki/File:Rumex_acetosa_-_Hapu_oblikas.jpg) | Ivar Leidus | CC BY-SA 3.0 | 4000 |
| 5 | 앰브로시아 | [Ambrosia artemisiifolia male and female flowers 01.jpg](https://commons.wikimedia.org/wiki/File:Ambrosia_artemisiifolia_male_and_female_flowers_01.jpg) | Meneerke bloem | CC BY-SA 3.0 | 3216 |
| 6 | 바위취 | [Saxifraga stolonifera (flower s7).jpg](https://commons.wikimedia.org/wiki/File:Saxifraga_stolonifera_(flower_s7).jpg) | Alpsdake | CC BY-SA 4.0 | 3456 |
| 7 | 양치 | [Uitrollend blad van een mannetjesvaren (Dryopteris filix-mas) 28-04-2025 (d.j.b.) 02.jpg](https://commons.wikimedia.org/wiki/File:Uitrollend_blad_van_een_mannetjesvaren_(Dryopteris_filix-mas)_28-04-2025_(d.j.b.)_02.jpg) | Dominicus Johannes Bergsma | CC BY-SA 4.0 | 4062 |
| 8 | 갈대 | [Phragmites australis (inflorescences).jpg](https://commons.wikimedia.org/wiki/File:Phragmites_australis_(inflorescences).jpg) | Le.Loup.Gris | CC BY-SA 3.0 | 1712 |
| 11 | 단양쑥부쟁이 | **미확보** | — | — | — |
| 12 | 목화 | [Gossypium hirsutum Florida.jpg](https://commons.wikimedia.org/wiki/File:Gossypium_hirsutum_Florida.jpg) | Mason Brock (Masebrock) | Public domain | 2476 |
| 14 | 소나무 | [Pinus densiflora, Morris Arboretum 04.jpg](https://commons.wikimedia.org/wiki/File:Pinus_densiflora,_Morris_Arboretum_04.jpg) | Shuvaev | CC BY-SA 4.0 | 4608 |
| 15 | 서향 | [Daphne Odora flower.jpg](https://commons.wikimedia.org/wiki/File:Daphne_Odora_flower.jpg) | Herby (talk thyme) | CC BY 2.5 | 2272 |
| 16 | 오리나무 | [Alnus japonica Olsza japońska 2021-10-02 06.jpg](https://commons.wikimedia.org/wiki/File:Alnus_japonica_Olsza_japo%C5%84ska_2021-10-02_06.jpg) | Agnieszka Kwiecień, Nova | CC BY-SA 4.0 | 3237 |
| 17 | 벚꽃난 | [Hoya carnosa - umbel with nectar droplets.jpg](https://commons.wikimedia.org/wiki/File:Hoya_carnosa_-_umbel_with_nectar_droplets.jpg) | Franz van Duns | CC BY-SA 4.0 | 7952 |
| 18 | 세이지 | [20260614 Salvia officinalis 05.jpg](https://commons.wikimedia.org/wiki/File:20260614_Salvia_officinalis_05.jpg) | Flocci Nivis | CC BY 4.0 | 3647 |
| 19 | 스노 플레이크 | [Lenteklokje (Leucojum vernum), 05-03-2026. (d.j.b.).jpg](https://commons.wikimedia.org/wiki/File:Lenteklokje_(Leucojum_vernum),_05-03-2026._(d.j.b.).jpg) | Dominicus Johannes Bergsma | CC BY-SA 4.0 | 3456 |
| 20 | 파인애플 | [20260317 Ananas comosus.jpg](https://commons.wikimedia.org/wiki/File:20260317_Ananas_comosus.jpg) | Flocci Nivis | CC BY 4.0 | 3934 |
| 21 | 박하 | [Mentha arvensis - põldmünt Keila.jpg](https://commons.wikimedia.org/wiki/File:Mentha_arvensis_-_p%C3%B5ldm%C3%BCnt_Keila.jpg) | Ivar Leidus | CC BY-SA 3.0 | 3991 |
| 23 | 플라타너스 | [Proteales - Platanus orientalis - 8.jpg](https://commons.wikimedia.org/wiki/File:Proteales_-_Platanus_orientalis_-_8.jpg) | Emőke Dénes | CC BY-SA 4.0 | 5184 |
| 24 | 겨우살이 | [Viscum album 004.jpg](https://commons.wikimedia.org/wiki/File:Viscum_album_004.jpg) | H. Zell | CC BY-SA 3.0 | 3582 |
| 25 | 서양호랑가시나무 | [Fruits of holly (Ilex aquifolium). Locatie, Jonkersvallei.jpg](https://commons.wikimedia.org/wiki/File:Fruits_of_holly_(Ilex_aquifolium)._Locatie,_Jonkersvallei.jpg) | Dominicus Johannes Bergsma | CC BY-SA 4.0 | 3248 |
| 27 | 매화 | [Flowers of Prunus mume (Armenaca mume ‘Bumpi’) at Nagai Botanical Garden, February 2024 - 5452.jpg](https://commons.wikimedia.org/wiki/File:Flowers_of_Prunus_mume_(Armenaca_mume_%E2%80%98Bumpi%E2%80%99)_at_Nagai_Botanical_Garden,_February_2024_-_5452.jpg) | Laitche | CC BY-SA 4.0 | 5144 |
| 28 | 석류 | [Pomegranate flowers (Punica granatum), Ponte de Sor, Portugal (approx. GPS location) julesvernex2.jpg](https://commons.wikimedia.org/wiki/File:Pomegranate_flowers_(Punica_granatum),_Ponte_de_Sor,_Portugal_(approx._GPS_location)_julesvernex2.jpg) | Jules Verne Times Two | CC BY-SA 4.0 | 6780 |
| 29 | 꽈리 | [Lampionblume (Physalis alkekengi)-20260208-RM-121159.jpg](https://commons.wikimedia.org/wiki/File:Lampionblume_(Physalis_alkekengi)-20260208-RM-121159.jpg) | Reinhold Möller (Ermell) | CC BY-SA 4.0 | 5182 |
| 30 | 납매 | [Chimonanthus praecox f. concolor, Nagai Botanical Garden, January 2026 -1841.jpg](https://commons.wikimedia.org/wiki/File:Chimonanthus_praecox_f._concolor,_Nagai_Botanical_Garden,_January_2026_-1841.jpg) | Laitche | CC BY-SA 4.0 | 4950 |
| 31 | 노송나무 | [Chamaecyparis obtusa, Morris Arboretum 05.jpg](https://commons.wikimedia.org/wiki/File:Chamaecyparis_obtusa,_Morris_Arboretum_05.jpg) | Shuvaev | CC BY-SA 4.0 | 4608 |


---

## 10. 같은 이름 반복 기입

브리프대로 같은 이름이 여러 날에 걸린 경우 **조사는 1회만 하고 같은 사진을 반복 기입**했다.
확보분 7쌍이 여기 해당한다.

| 사진 | 반복된 일자 |
|---|---|
| *Citrus sinensis* 꽃 | 9/7 오렌지 · 9/24 오렌지 |
| *Cirsium japonicum* 꽃 | 9/18 엉겅퀴 · 10/21 엉겅퀴 |
| *Acer palmatum* 단풍잎 | 10/3 단풍나무 · 10/25 단풍나무 |
| *Prunus mume* 꽃 | 10/24 매화 · 12/27 매화 |
| *Rumex acetosa* 꽃차례 | 10/26 수영 · 12/4 수영 |
| *Pinus densiflora* 구과 | 11/14 소나무 · 12/14 소나무 |
| *Dryopteris filix-mas* 새순 | 11/23 양치 · 12/7 양치 |

미확보인 단양쑥부쟁이(11/5 · 12/11)도 같은 이름 2일 쌍이며, 양쪽 모두 동일한 사유가 들어 있다.

---

## 11. 남은 일

1. **10/20 마 · 11/9 몰약의 꽃 · 11/5·12/11 단양쑥부쟁이** — 원 출처 재확인 또는
   Commons 밖(공공누리 등) 소스 검토가 필요한 편집 판단 건.
2. **11/25 개옻나무** — CSV 학명과 한글명이 다른 식물을 가리킨다. 어느 쪽이 원 의도인지 확정 필요.
3. **`family_line` 검수** — 101건 모두 사실관계만 참고해 새로 쓴 문장이며(문장 복사 없음),
   design-spec §1.5d의 해요체를 따랐다. 10/23 흰독말풀 한 건만 §1.5d 예외 규정에 따라
   안전 문구("만지고 나면 손을 씻어 주세요")를 직설로 남겼다.
4. **파생물 라이선스** — SA 83건을 크롭·보정해 저장하는 파이프라인을 만들 경우
   §8의 동일조건변경허락 조항을 먼저 정리할 것.
