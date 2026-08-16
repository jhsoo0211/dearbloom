# dearbloom 탄생화 사전 사진 조사 — 5~8월 (part 2)

> `content/birth_flowers.csv`에서 `flower_id`가 비어 있는 5~8월 전체 86일에 대해, Wikimedia Commons 실사 사진을 1장씩 배정한 기록.
> 산출물은 `content/birth_photos.part2.csv`이고, 이 문서는 그 근거·판단·한계를 남긴다.
> 1~4월은 part 1, 9~12월은 part 3이 같은 형식으로 담당한다.

---

## 조사 개요

| 항목 | 내용 |
|---|---|
| 조사일 | 2026-08-16 |
| 담당 범위 | 5월·6월·7월·8월 중 `flower_id`가 비어 있는 **86일** |
| 출처 | Wikimedia Commons 단일 소스 |
| 확보 | **84일 / 86일** (미확보 2일) |
| 고유 파일 수 | **77장** (같은 이름이 여러 날에 걸리는 7일은 동일 컷 재기입) |
| URL 검증 | 확보 84행 **전수** HTTP GET → 200 · `image/jpeg` 확인 (실패 0) |
| 종 검증 | 파일명·Commons 분류·`extmetadata` 대조 **+ 후보 이미지 전수 육안 확인** |
| 라이선스 검증 | Commons API `extmetadata.License` 기계 판독 → PD/CC0/CC BY/CC BY-SA만 통과, NC·ND 자동 배제 |
| 원본 해상도 | 최소 1374px · 중앙값 3094px · 최대 8032px (전 컷 폭 1200px 이상) |

### 작업 방식

1. **후보 수집** — 종별로 Commons 검색 API를 돌린다. 1차는 `<학명> incategory:"Quality images"`로 품질 보증 컷을 먼저 긁고, 부족하면 일반 검색으로 넓힌다. 종당 10~19장을 모았다.
2. **기계 필터** — `extmetadata.License`가 `pd`/`cc0`/`cc-by-*`/`cc-by-sa-*`가 아니면 이 단계에서 탈락한다. NC·ND는 정규식으로 차단했고, 원본 폭 1200px 미만과 SVG·GIF도 함께 걸렀다.
3. **육안 검증(전수)** — 남은 후보를 **330px 컨택트 시트 26장**으로 만들어 전부 눈으로 훑고, 채택한 77장은 다시 **500px 검증 시트 9장**으로 한 장씩 실물을 확인했다. 판별이 애매한 6건은 1280px 원본을 따로 열어 확대 확인했다.
4. **기입** — 채택 컷의 1280px 표준 썸네일 URL·파일 페이지·작가·라이선스·원본 폭을 CSV에 넣고, 종 검증 결과와 자체 서술 한 줄 소개를 붙인다.

### 육안 검증에서 걸러낸 것 — Commons 파일 설명은 검증된 값이 아니다

기계 필터만 믿으면 안 된다는 게 이번 작업의 가장 큰 교훈이다. 검색 결과와 파일 제목에는 다음이 섞여 들어왔고 **전부 육안 단계에서 탈락시켰다.**

**(A) 파일명·설명이 실물과 다른 오동정 파일 — 1건**

| 파일 | 표기 | 실제 |
|---|---|---|
| `Taraxacum officinale side makro.jpg` | 민들레(*Taraxacum officinale*) | **민들레속이 아니다.** 꽃대에 뻣뻣한 강모가 빽빽하고 총포편이 잎처럼 벌어져 있다. *Crepis*·*Picris* 계열의 특징이다. CC BY-SA 4.0에 4248×3088, 검은 배경 매크로라 스펙만 보면 이 조사 전체에서 가장 탐나는 컷이었지만 탈락시켰다 |

같은 업로더가 올린 다른 후보가 `Crepidinae sp. (Slovenia).jpg`(속 미상 표기)로 함께 검색된 것을 보면, 이 계열을 민들레로 오인한 업로드 묶음으로 보인다. **대체 컷으로 `Paardenbloem (Taraxacum officinale) 06.JPG`를 채택했고, 설상화만으로 이뤄진 두상화와 톱니 잎을 1280px에서 직접 확인했다.**

**(B) 검색어에 걸렸을 뿐 대상 식물이 아닌 파일 — 확인된 것만 50여 건**

정직하게 라벨링된 파일이지만 검색 노이즈로 딸려온 것들이다. 걸러낸 대표 사례:

- **다른 식물** — 카우슬립 검색의 빈카, 조밥나물 검색의 담쟁이덩굴(2장), 능소화 검색의 *Erythrina crista-galli*, 협죽도 검색의 *Plumeria rubra*, 안스륨 검색의 *Helenium*, 수박풀 검색의 *Rhododendron* 'Modesty'(2장), 배풍등 검색의 *Solanum jasminoides*, 향쑥 검색의 *Artemisia glacialis*, 단양쑥부쟁이 검색의 *Kalimeris pseudoyomena*
- **식물이 아예 아닌 것** — 아마(Flax) 검색의 영국 Flax Bourton 철도역 사진 4장, 향쑥 검색의 런던 Wormwood Scrubs 공원 찌르레기·앙티브 압생트 박물관·St Mary Axe 빌딩, 헬리오트로프 검색의 베르사유 분수 조각 2장·"Heliotrope Path" 표지판·헬리오트로프 나방, 튤립나무 검색의 꽃 문 마멋, 수박풀 검색의 Shoofly 유적 안내판, 골든로드 검색의 게거미·꿀벌 접사 2장, 잡초의 꽃 검색의 해질녘 들판 실루엣
- **꽃이 아닌 부위·가공물** — 라일락·딸기의 잎 표본 스캔 묶음(10장 이상), 구스베리 꽃 해부 모형 2장, 진달래 검색의 진달래화전 3장, 아마씨앗, 접시꽃 씨앗, 수박풀·매발톱꽃의 건조 표본 대지
- **실사가 아닌 것** — 무릇·레세다·양귀비·가막살나무·옥슬립·백부자·하이포시스·향쑥의 식물도감 판화·수채 도판·선묘 10장 이상

**(C) 채택 후 1280px 재확인 — 6건, 전부 통과**

- `Mentha arvensis 2` — 두상으로 보여 *M. aquatica* 의심이 들었으나, 확대해 보니 꽃차례 한가운데를 털 난 줄기가 관통해 위로 이어진다. 잎겨드랑이 윤산화서가 맞고 *M. arvensis*로 확정
- `Hieracium umbellatum–IMG 5860` · `Ranunculus japonicus Keelung` · `Aster altaicus kz03` · `Solidago virgaurea ENBLA02` — 중거리 컷이라 확대 확인, 전부 표기와 일치
- `Campsis grandiflora 06` — 종은 일치. 다만 배경에 담장이 들어와, 구도가 더 좋은 Korea.net 컷을 검토했으나 **워터마크가 박혀 있어** 원안을 유지했다

---

## 라이선스 분포

NC·ND는 기계 단계에서 전량 차단했으므로, 아래 전부가 상업적 이용과 2차 저작이 가능한 조건이다.

| 라이선스 | 고유 파일 수 | 기입 행 수 | 표기 의무 |
|---|---|---|---|
| `CC BY-SA 4.0` | 37 | 39 | 저작자 표시 + 동일조건변경허락 |
| `CC BY-SA 3.0` | 18 | 21 | 저작자 표시 + 동일조건변경허락 |
| `CC BY-SA 2.0` | 6 | 6 | 저작자 표시 + 동일조건변경허락 |
| `CC BY 2.0` | 5 | 5 | 저작자 표시 |
| `Public domain` | 4 | 6 | 없음 (권장) |
| `CC0` | 2 | 2 | 없음 (권장) |
| `CC BY 4.0` | 2 | 2 | 저작자 표시 |
| `CC BY-SA 2.5` | 1 | 1 | 저작자 표시 + 동일조건변경허락 |
| `CC BY 3.0` | 1 | 1 | 저작자 표시 |
| `CC BY 3.0 US` | 1 | 1 | 저작자 표시 |
| **합계** | **77** | **84** | |

**ShareAlike가 62/77장(80.5%)이다.** 이 조건은 "사진을 개작한 결과물"에 붙는다. 사진 위에 텍스트를 얹거나 색보정·크롭한 카드 이미지는 2차적 저작물로 볼 여지가 있으므로, **사진을 원형 그대로 배치하고 텍스트는 사진 바깥 레이어에 두는 구성**이 라이선스 부담이 가장 적다. 크레딧은 전 컷에 `작가명 / 라이선스` 형태로 노출하는 것을 전제로 스펙했다.

라이선스가 가장 깨끗한 6장(PD·CC0)은 히어로·공유 이미지처럼 노출이 큰 자리에 우선 배치할 만하다.

| 날짜 | 이름 | 라이선스 |
|---|---|---|
| 5/23 | 풀의 싹 | `Public domain` (미국 지질조사국 USGS 촬영물) |
| 5/26 | 올리브나무 | `Public domain` |
| 5/29 · 6/17 · 8/31 | 토끼풀 | `Public domain` |
| 7/11 | 아스포델 | `Public domain` |
| 5/2 | 미나리아재비 | `CC0` |
| 8/5 | 엘리카 | `CC0` |

---

## 월별 상세

`직접 이미지 URL`은 Wikimedia 표준 썸네일 폭 중 1280px를 지정한 프로덕션용 주소다.
위키미디어가 허용하는 폭은 **120 / 250 / 330 / 500 / 1280 / 1920** 뿐이고 그 외 값은 `HTTP 400`을 돌려준다. 다른 크기가 필요하면 URL의 `1280px-`만 위 목록의 값으로 바꿔 쓸 것.


### 5월 — 21일 중 20일 확보 / 1일 미확보

| 날짜 | 이름 | 직접 이미지 URL (1280px) | Commons 파일 페이지 | 작가 | 라이선스 | 원본 px | 종 검증 | 한 줄 소개 |
|---|---|---|---|---|---|---|---|---|
| **5/1** | 카우슬립 앵초 | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Primula_veris20170513_7568.jpg/1280px-Primula_veris20170513_7568.jpg` | https://commons.wikimedia.org/wiki/File:Primula_veris20170513_7568.jpg | Bff | `CC BY-SA 4.0` | 2100 | Primula veris 종 일치 — 영문명 Cowslip의 정명. 검은 배경 근접컷 | 이른 봄 풀밭에서 노란 종 여러 개를 한 대에 매달고 고개를 숙여요. |
| **5/2** | 미나리아재비 | `https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Ranunculus_japonicus_Keelung.jpg/1280px-Ranunculus_japonicus_Keelung.jpg` | https://commons.wikimedia.org/wiki/File:Ranunculus_japonicus_Keelung.jpg | K1ng8766 | `CC0` | 2048 | Ranunculus japonicus 종 일치 — 국명 미나리아재비의 정명. CC0. 더 가까운 컷(1200~1237px급)은 1280px 썸네일을 만들 수 없어 제외했고, 이 컷은 중거리라 카드용으로는 크롭 필요 | 들판에 흔한 노란 다섯 잎 꽃인데, 꽃잎이 기름칠한 듯 반짝여요. |
| **5/3** | 민들레 | `https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Paardenbloem_%28Taraxacum_officinale%29_06.JPG/1280px-Paardenbloem_%28Taraxacum_officinale%29_06.JPG` | https://commons.wikimedia.org/wiki/File:Paardenbloem_%28Taraxacum_officinale%29_06.JPG | Dominicus Johannes Bergsma | `CC BY-SA 3.0` | 3094 | Taraxacum officinale 종 일치 — 설상화만으로 이뤄진 두상화와 톱니 잎을 육안 확인. 앞서 검토한 'Taraxacum officinale side makro.jpg'는 파일명과 달리 민들레속이 아니어서 탈락 | 밟혀도 다시 서고, 씨앗이 되고 나면 바람만 기다려요. |
| **5/4** | 딸기 | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Fragaria_vesca_-_metsmaasikas.jpg/1280px-Fragaria_vesca_-_metsmaasikas.jpg` | https://commons.wikimedia.org/wiki/File:Fragaria_vesca_-_metsmaasikas.jpg | Ivar Leidus | `CC BY-SA 3.0` | 4971 | Fragaria vesca(숲딸기) — 원 표에 학명이 없고 영문명 Strawberry만 있음. 재배 딸기 F. x ananassa와는 다른 종. 흰 꽃과 붉은 열매가 한 컷에 함께 담김 | 흰 다섯 잎 꽃이 지고 나면 그 자리에 붉은 열매가 앉아요. |
| **5/7** | 딸기 | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Fragaria_vesca_-_metsmaasikas.jpg/1280px-Fragaria_vesca_-_metsmaasikas.jpg` | https://commons.wikimedia.org/wiki/File:Fragaria_vesca_-_metsmaasikas.jpg | Ivar Leidus | `CC BY-SA 3.0` | 4971 | Fragaria vesca(숲딸기) — 원 표에 학명이 없고 영문명 Strawberry만 있음. 재배 딸기 F. x ananassa와는 다른 종. 흰 꽃과 붉은 열매가 한 컷에 함께 담김 · **5/4와 동일 컷** | 흰 다섯 잎 꽃이 지고 나면 그 자리에 붉은 열매가 앉아요. |
| **5/11** | 사과 | `https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/P%C3%B6rtschach_Winklern_10.-Oktober-Stra%C3%9Fe_67_Jonagold_Apfelbl%C3%BCte_23042015_2568.jpg/1280px-P%C3%B6rtschach_Winklern_10.-Oktober-Stra%C3%9Fe_67_Jonagold_Apfelbl%C3%BCte_23042015_2568.jpg` | https://commons.wikimedia.org/wiki/File:P%C3%B6rtschach_Winklern_10.-Oktober-Stra%C3%9Fe_67_Jonagold_Apfelbl%C3%BCte_23042015_2568.jpg | Johann Jaritz | `CC BY-SA 4.0` | 7360 | Malus domestica 종 일치 — 'Jonagold' 품종 사과꽃 접사 | 가지마다 분홍 봉오리가 열리면서 흰 꽃으로 벌어져요. |
| **5/12** | 라일락 | `https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Syringa_vulgaris_15-p.bot-syrin.vulga-18.jpg/1280px-Syringa_vulgaris_15-p.bot-syrin.vulga-18.jpg` | https://commons.wikimedia.org/wiki/File:Syringa_vulgaris_15-p.bot-syrin.vulga-18.jpg | Ayotte, Gilles, 1948- | `CC BY-SA 4.0` | 2454 | Syringa vulgaris 종 일치 — 검은 배경 원추꽃차례 접사. 5/30 보랏빛 라일락과 다른 컷 | 작은 통꽃이 원뿔로 모여 피고, 향이 늘 먼저 도착해요. |
| **5/13** | 산사나무 | `https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Crataegus_pinnatifida%27s_flower.JPG/1280px-Crataegus_pinnatifida%27s_flower.JPG` | https://commons.wikimedia.org/wiki/File:Crataegus_pinnatifida%27s_flower.JPG | Dalgial | `CC BY-SA 3.0` | 3264 | Crataegus pinnatifida 종 일치 — 국명 산사나무의 정명(영문명 Hawthorn은 속 단위 통칭) | 흰 꽃이 우산처럼 모여 피고, 가을엔 붉은 열매가 그 자리에 달려요. |
| **5/14** | 매발톱꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Aquilegia_vulgaris_Gemeindealpe_01.JPG/1280px-Aquilegia_vulgaris_Gemeindealpe_01.JPG` | https://commons.wikimedia.org/wiki/File:Aquilegia_vulgaris_Gemeindealpe_01.JPG | Uoaei1 | `CC BY-SA 4.0` | 4000 | Aquilegia vulgaris 종 일치 — 원예 매발톱의 기준종. 국내 자생 A. buergeriana var. oxysepala와는 별개 | 꽃잎 뒤로 매 발톱처럼 굽은 꿀주머니가 다섯 개 뻗어 있어요. |
| **5/16** | 조팝나물 | `https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Hieracium_umbellatum%E2%80%93IMG_5860.jpg/1280px-Hieracium_umbellatum%E2%80%93IMG_5860.jpg` | https://commons.wikimedia.org/wiki/File:Hieracium_umbellatum%E2%80%93IMG_5860.jpg | Kızıl | `CC BY-SA 4.0` | 2794 | Hieracium umbellatum 종 일치 — CSV 학명 Hieracium(조밥나물속)의 대표종. CSV editorial_note가 지적한 국명 혼선은 그대로 남음 | 가늘게 선 줄기 끝에서 노란 혀꽃이 사방으로 퍼져요. |
| **5/18** | 옥슬립 앵초 | `https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/02022_0057_Primula_elatior.jpg/1280px-02022_0057_Primula_elatior.jpg` | https://commons.wikimedia.org/wiki/File:02022_0057_Primula_elatior.jpg | Silar | `CC BY-SA 4.0` | 2622 | Primula elatior 종 일치 — 영문명 Oxlip의 정명 | 카우슬립보다 꽃이 크고, 한쪽만 바라보며 몰려 피어요. |
| **5/19** | 아리스타타 | — | — | — | — | — | 미확보 — Aristata는 종소명일 뿐이고 원 표가 갈린다(순천만=아이리스 / 로얄플라워=아리스타타). 식물 특정 불가 | — |
| **5/20** | 괭이밥 | `https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Oxalis_corniculata_-_blossom_top_%28aka%29.jpg/1280px-Oxalis_corniculata_-_blossom_top_%28aka%29.jpg` | https://commons.wikimedia.org/wiki/File:Oxalis_corniculata_-_blossom_top_%28aka%29.jpg | André Karwath aka Aka | `CC BY-SA 2.5` | 1632 | Oxalis corniculata 종 일치 — 국명 괭이밥의 정명. 서양 wood sorrel(O. acetosella)과는 다른 종. 정면 접사 | 하트 세 장이 모인 잎 사이에서 노란 별 같은 꽃이 올라와요. |
| **5/22** | 귀고리꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Fuchsia_magellanica_%27Pumile%27%2C_Jard%C3%ADn_Bot%C3%A1nico_de_M%C3%BAnich%2C_Alemania%2C_2013-05-04%2C_DD_01.jpg/1280px-Fuchsia_magellanica_%27Pumile%27%2C_Jard%C3%ADn_Bot%C3%A1nico_de_M%C3%BAnich%2C_Alemania%2C_2013-05-04%2C_DD_01.jpg` | https://commons.wikimedia.org/wiki/File:Fuchsia_magellanica_%27Pumile%27%2C_Jard%C3%ADn_Bot%C3%A1nico_de_M%C3%BAnich%2C_Alemania%2C_2013-05-04%2C_DD_01.jpg | Diego Delso | `CC BY-SA 3.0` | 2543 | Fuchsia magellanica 'Pumile' 종 일치 — 영문명 Ear Drops(lady's eardrops)가 가리키는 종 | 붉은 꽃받침 아래로 자줏빛 치마가 매달려 귀고리처럼 흔들려요. |
| **5/23** | 풀의 싹 | `https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Boxelder%2C_twig_upper_marlboro_2015-04-10-20.29.25_ZS_PMax_%2816916113178%29.jpg/1280px-Boxelder%2C_twig_upper_marlboro_2015-04-10-20.29.25_ZS_PMax_%2816916113178%29.jpg` | https://commons.wikimedia.org/wiki/File:Boxelder%2C_twig_upper_marlboro_2015-04-10-20.29.25_ZS_PMax_%2816916113178%29.jpg | USGS Bee Inventory and Monitoring Lab from Beltsville, Maryland, USA | `Public domain` | 4325 | 종 특정 항목 아님 — '풀의 싹/Leaf Buds'는 특정 식물이 아니라 새눈 자체. 대표 이미지로 Acer negundo 눈 접사(USGS 촬영, PD) 사용 | 잎이 되기 직전, 아직 접혀 있는 상태를 그대로 보여줘요. |
| **5/24** | 헬리오토로프 | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Close-up_of_heliotrope_flower_%28Heliotropium_arborescens%29%2C_Jardim_da_Funda%C3%A7%C3%A3o_Calouste_Gulbenkian%2C_Lisbon%2C_Portugal_julesvernex2.jpg/1280px-Close-up_of_heliotrope_flower_%28Heliotropium_arborescens%29%2C_Jardim_da_Funda%C3%A7%C3%A3o_Calouste_Gulbenkian%2C_Lisbon%2C_Portugal_julesvernex2.jpg` | https://commons.wikimedia.org/wiki/File:Close-up_of_heliotrope_flower_%28Heliotropium_arborescens%29%2C_Jardim_da_Funda%C3%A7%C3%A3o_Calouste_Gulbenkian%2C_Lisbon%2C_Portugal_julesvernex2.jpg | Jules Verne Times Two | `CC BY-SA 4.0` | 5148 | Heliotropium arborescens 종 일치 — 파일 제목에 학명 명시. 검은 배경 접사 | 작은 보랏빛 꽃이 뭉쳐 피고, 바닐라를 닮은 향이 나요. |
| **5/26** | 올리브나무 | `https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Olea_europaea_FlowersCloseup_SolanadelPino.jpg/1280px-Olea_europaea_FlowersCloseup_SolanadelPino.jpg` | https://commons.wikimedia.org/wiki/File:Olea_europaea_FlowersCloseup_SolanadelPino.jpg | Javier martin | `Public domain` | 2976 | Olea europaea 종 일치 — 열매가 아니라 꽃차례 접사. PD | 열매로만 알던 나무가 여름 앞에서 아주 작은 흰 꽃을 무더기로 달아요. |
| **5/28** | 박하 | `https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Mentha_arvensis_2_%285097344051%29.jpg/1280px-Mentha_arvensis_2_%285097344051%29.jpg` | https://commons.wikimedia.org/wiki/File:Mentha_arvensis_2_%285097344051%29.jpg | Superior National Forest | `CC BY 2.0` | 1600 | Mentha arvensis 종 일치 — 국명 박하의 기준종(재배형은 var. piperascens) | 잎겨드랑이마다 연보랏빛 꽃이 둥글게 뭉쳐 층층이 올라가요. |
| **5/29** | 토끼풀 | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Trifolium_repens_flower_April_2_2010.jpg/1280px-Trifolium_repens_flower_April_2_2010.jpg` | https://commons.wikimedia.org/wiki/File:Trifolium_repens_flower_April_2_2010.jpg | Supportstorm | `Public domain` | 2414 | Trifolium repens 종 일치 — 국명 토끼풀의 정명. PD. 5/29·6/17·8/31 동일 컷 | 작은 나비 모양 꽃 수십 개가 모여 하나의 공처럼 보여요. |
| **5/30** | 보랏빛 라일락 | `https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Syringa_%27Gastello%27_03.JPG/1280px-Syringa_%27Gastello%27_03.JPG` | https://commons.wikimedia.org/wiki/File:Syringa_%27Gastello%27_03.JPG | Kor!An (Андрей Корзун) | `CC BY-SA 3.0` | 2112 | Syringa vulgaris 'Gastello' 종 일치 — 짙은 보라 품종. 5/12 라일락과 다른 컷 | 같은 라일락이라도 보랏빛이 짙어질수록 꽃송이가 더 무거워 보여요. |
| **5/31** | 무릇 | `https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Barnardia_japonica-IMG_9388.jpg/1280px-Barnardia_japonica-IMG_9388.jpg` | https://commons.wikimedia.org/wiki/File:Barnardia_japonica-IMG_9388.jpg | C T Johansson | `CC BY 3.0` | 3539 | Barnardia japonica 종 일치 — 국명 무릇의 현행 정명. CSV 학명 Scilla scilloides와 이명 관계 | 늦여름에 분홍 꽃이 아래에서 위로 차례차례 올라가며 피어요. |

### 6월 — 20일 중 19일 확보 / 1일 미확보

| 날짜 | 이름 | 직접 이미지 URL (1280px) | Commons 파일 페이지 | 작가 | 라이선스 | 원본 px | 종 검증 | 한 줄 소개 |
|---|---|---|---|---|---|---|---|---|
| **6/2** | 빨강 매발톱꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Eastern_Red_Columbine_Aquilegia_canadensis_%2824439345658%29.jpg/1280px-Eastern_Red_Columbine_Aquilegia_canadensis_%2824439345658%29.jpg` | https://commons.wikimedia.org/wiki/File:Eastern_Red_Columbine_Aquilegia_canadensis_%2824439345658%29.jpg | gailhampshire from Cradley, Malvern, U.K | `CC BY 2.0` | 3075 | Aquilegia canadensis 종 일치 — 붉은 매발톱의 대표종 | 붉은 꽃이 고개를 숙이고, 노란 속만 아래로 내밀어요. |
| **6/3** | 아마 | `https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Linum_usitatissimum_qtl1.jpg/1280px-Linum_usitatissimum_qtl1.jpg` | https://commons.wikimedia.org/wiki/File:Linum_usitatissimum_qtl1.jpg | Quartl | `CC BY-SA 3.0` | 2692 | Linum usitatissimum 종 일치 — 국명 아마의 정명 | 하늘색에 가까운 꽃이 아침에 열렸다가 한나절이면 져요. |
| **6/7** | 슈미트티아나 | — | — | — | — | — | 미확보 — Schmidtiana는 종소명일 뿐. Artemisia schmidtiana 추정이 유력하나 원 표에 속명이 없어 확정 불가 | — |
| **6/10** | 수염패랭이꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/P%C3%B6rtschach_Winklern_10.-Oktober-Stra%C3%9Fe_67_Bartnelke_21062024_1161.jpg/1280px-P%C3%B6rtschach_Winklern_10.-Oktober-Stra%C3%9Fe_67_Bartnelke_21062024_1161.jpg` | https://commons.wikimedia.org/wiki/File:P%C3%B6rtschach_Winklern_10.-Oktober-Stra%C3%9Fe_67_Bartnelke_21062024_1161.jpg | Johann Jaritz | `CC BY-SA 4.0` | 4928 | Dianthus barbatus 종 일치 — 파일명의 독일어 Bartnelke가 이 종의 통칭 | 짧은 꽃대 위로 작은 패랭이꽃이 빽빽하게 모여 한 다발이 돼요. |
| **6/11** | 중국패모 | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Fritillaria_verticillata_var._thunbergii.jpg/1280px-Fritillaria_verticillata_var._thunbergii.jpg` | https://commons.wikimedia.org/wiki/File:Fritillaria_verticillata_var._thunbergii.jpg | titanium22 | `CC BY-SA 2.0` | 3872 | Fritillaria verticillata var. thunbergii = F. thunbergii — CSV 학명과 이명 관계로 종 일치 | 연둣빛 종이 아래를 보고 달리고, 안쪽에는 그물 무늬가 있어요. |
| **6/12** | 레제다 오도라타 | `https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Reseda_odorata_2019-06-18_2335.jpg/1280px-Reseda_odorata_2019-06-18_2335.jpg` | https://commons.wikimedia.org/wiki/File:Reseda_odorata_2019-06-18_2335.jpg | Salicyna | `CC BY-SA 4.0` | 3000 | Reseda odorata 종 일치 — CSV 학명과 동일 | 빛깔은 수수한데 향이 진해서 오래 향수 원료로 쓰였어요. |
| **6/13** | 디기탈리스 | `https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Purple_Foxglove_%28Digitalis_purpurea%29_2008_02.jpg/1280px-Purple_Foxglove_%28Digitalis_purpurea%29_2008_02.jpg` | https://commons.wikimedia.org/wiki/File:Purple_Foxglove_%28Digitalis_purpurea%29_2008_02.jpg | Godot13 | `CC BY-SA 4.0` | 2670 | Digitalis purpurea 종 일치 — 파일명에 학명 명시 | 종 모양 꽃이 한쪽으로만 줄지어 달리고, 안쪽에 점무늬가 박혀 있어요. |
| **6/14** | 뚜껑별꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Anagallis_arvensis_%28habitus%29.jpg/1280px-Anagallis_arvensis_%28habitus%29.jpg` | https://commons.wikimedia.org/wiki/File:Anagallis_arvensis_%28habitus%29.jpg | Hans Hillewaert | `CC BY-SA 3.0` | 3792 | Anagallis arvensis(현행 Lysimachia arvensis) 종 일치 — 국명 뚜껑별꽃이 가리키는 청색형. 접사가 아니라 군락 컷이라 카드용으로는 크롭 필요 | 파란 별 같은 꽃이 흐린 날에는 아예 문을 닫아버려요. |
| **6/16** | 튜베 로즈 | `https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Polianthes_tuberosa%2C_Burdwan%2C_West_Bengal%2C_India_31_01_2013.jpg/1280px-Polianthes_tuberosa%2C_Burdwan%2C_West_Bengal%2C_India_31_01_2013.jpg` | https://commons.wikimedia.org/wiki/File:Polianthes_tuberosa%2C_Burdwan%2C_West_Bengal%2C_India_31_01_2013.jpg | JDP90 (Joydeep) | `CC BY-SA 3.0` | 2408 | Polianthes tuberosa(현행 Agave amica) 종 일치 — 국명 튜베 로즈의 정명 | 해가 지고 나서야 향이 짙어지는 흰 꽃이에요. |
| **6/17** | 토끼풀 | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Trifolium_repens_flower_April_2_2010.jpg/1280px-Trifolium_repens_flower_April_2_2010.jpg` | https://commons.wikimedia.org/wiki/File:Trifolium_repens_flower_April_2_2010.jpg | Supportstorm | `Public domain` | 2414 | Trifolium repens 종 일치 — 국명 토끼풀의 정명. PD. 5/29·6/17·8/31 동일 컷 · **5/29와 동일 컷** | 작은 나비 모양 꽃 수십 개가 모여 하나의 공처럼 보여요. |
| **6/18** | 백리향 | `https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Thymus_quinquecostatus_%28flower%29.JPG/1280px-Thymus_quinquecostatus_%28flower%29.JPG` | https://commons.wikimedia.org/wiki/File:Thymus_quinquecostatus_%28flower%29.JPG | Alpsdake | `CC BY-SA 4.0` | 2048 | Thymus quinquecostatus 종 일치 — 국명 백리향의 정명. 영문명 Thyme의 T. vulgaris와는 다른 종 | 바위 위를 낮게 덮고, 스치기만 해도 향이 올라와요. |
| **6/20** | 꼬리풀 | `https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Veronica_linariifolia_91987120.jpg/1280px-Veronica_linariifolia_91987120.jpg` | https://commons.wikimedia.org/wiki/File:Veronica_linariifolia_91987120.jpg | Oleg Kosterin | `CC BY 4.0` | 1374 | Veronica linariifolia 종 일치 — 국명 꼬리풀의 정명. Commons 내 이 종 사진이 2장뿐이라 선택지가 좁았음 | 가는 잎 위로 연보랏빛 꽃이 꼬리처럼 길게 서요. |
| **6/21** | 달맞이꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Oenothera_biennis%2C_Vic-la-Gardiole_01.jpg/1280px-Oenothera_biennis%2C_Vic-la-Gardiole_01.jpg` | https://commons.wikimedia.org/wiki/File:Oenothera_biennis%2C_Vic-la-Gardiole_01.jpg | Christian Ferrer | `CC BY-SA 4.0` | 6016 | Oenothera biennis 종 일치 — 국명 달맞이꽃의 정명 | 해가 넘어가야 꽃잎을 열고, 아침이면 시들어요. |
| **6/22** | 가막살나무 | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Erie_Linden_Viburnum_Viburnum_dilatatum_%E2%80%98Erie%E2%80%99_leaves_summer_flower.jpg/1280px-Erie_Linden_Viburnum_Viburnum_dilatatum_%E2%80%98Erie%E2%80%99_leaves_summer_flower.jpg` | https://commons.wikimedia.org/wiki/File:Erie_Linden_Viburnum_Viburnum_dilatatum_%E2%80%98Erie%E2%80%99_leaves_summer_flower.jpg | Cossey25 | `CC BY-SA 4.0` | 3024 | Viburnum dilatatum 'Erie' 종 일치 — 국명 가막살나무의 정명 | 흰 꽃이 접시처럼 평평하게 모여 피고, 가을엔 붉은 열매만 남아요. |
| **6/23** | 접시꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Alcea_rosea_purple.jpg/1280px-Alcea_rosea_purple.jpg` | https://commons.wikimedia.org/wiki/File:Alcea_rosea_purple.jpg | PJDespa | `CC BY-SA 3.0` | 4288 | Alcea rosea 종 일치 — 국명 접시꽃의 정명. 6/23·8/18 동일 컷 | 곧게 선 줄기를 따라 접시만 한 꽃이 아래에서 위로 올라가며 펴요. |
| **6/24** | 버베나 | `https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Verbena_hybrida_2.JPG/1280px-Verbena_hybrida_2.JPG` | https://commons.wikimedia.org/wiki/File:Verbena_hybrida_2.JPG | Jwitos | `CC BY-SA 3.0` | 3008 | Verbena hybrida 종 일치 — CSV 영문명 Garden Verbena와 대응하는 원예 버베나 | 작은 꽃이 둥글게 모여 한 송이처럼 보이고, 색이 아주 진해요. |
| **6/25** | 나팔꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Ipomoea_nil_Gorlitsa20230530_20214.jpg/1280px-Ipomoea_nil_Gorlitsa20230530_20214.jpg` | https://commons.wikimedia.org/wiki/File:Ipomoea_nil_Gorlitsa20230530_20214.jpg | Bff | `CC BY-SA 4.0` | 4950 | Ipomoea nil 종 일치 — 국명 나팔꽃의 정명 | 새벽에 나팔을 열고 한낮이면 다시 오므려요. |
| **6/26** | 흰 라일락 | `https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/%D0%9F%D1%80%D0%B8%D0%BC%D0%BE%D1%80%D1%81%D0%BA%D0%B8%D0%B9_%D0%BF%D0%B0%D1%80%D0%BA_%D0%9F%D0%BE%D0%B1%D0%B5%D0%B4%D1%8B%2C_%D1%81%D0%B8%D1%80%D0%B5%D0%BD%D1%8C_04.jpg/1280px-%D0%9F%D1%80%D0%B8%D0%BC%D0%BE%D1%80%D1%81%D0%BA%D0%B8%D0%B9_%D0%BF%D0%B0%D1%80%D0%BA_%D0%9F%D0%BE%D0%B1%D0%B5%D0%B4%D1%8B%2C_%D1%81%D0%B8%D1%80%D0%B5%D0%BD%D1%8C_04.jpg` | https://commons.wikimedia.org/wiki/File:%D0%9F%D1%80%D0%B8%D0%BC%D0%BE%D1%80%D1%81%D0%BA%D0%B8%D0%B9_%D0%BF%D0%B0%D1%80%D0%BA_%D0%9F%D0%BE%D0%B1%D0%B5%D0%B4%D1%8B%2C_%D1%81%D0%B8%D1%80%D0%B5%D0%BD%D1%8C_04.jpg | Екатерина Борисова | `CC BY-SA 4.0` | 4896 | Syringa 속 흰 라일락 — 파일 제목이 러시아어 'сирень(라일락)'이라 종소명 미표기. 재배 흰 라일락은 통상 S. vulgaris 품종 | 흰 라일락은 색이 없는 대신 향이 더 크게 느껴져요. |
| **6/27** | 시계꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Passiflora_caerulea_%28makro_close-up%29.jpg/1280px-Passiflora_caerulea_%28makro_close-up%29.jpg` | https://commons.wikimedia.org/wiki/File:Passiflora_caerulea_%28makro_close-up%29.jpg | Petar Milošević | `CC BY-SA 4.0` | 4565 | Passiflora caerulea 종 일치 — 파일명에 makro close-up 명시 | 실 같은 부화관이 시계 눈금처럼 둘러서서 시계꽃이라 불려요. |
| **6/30** | 인동 | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Lonicera_japonica_%27hall%27s_prolific%27._14-06-2020_%28d.j.b.%29_01.jpg/1280px-Lonicera_japonica_%27hall%27s_prolific%27._14-06-2020_%28d.j.b.%29_01.jpg` | https://commons.wikimedia.org/wiki/File:Lonicera_japonica_%27hall%27s_prolific%27._14-06-2020_%28d.j.b.%29_01.jpg | Dominicus Johannes Bergsma | `CC BY-SA 4.0` | 3456 | Lonicera japonica 'Hall's Prolific' 종 일치 — 국명 인동의 정명 | 흰 꽃으로 피었다가 며칠 뒤 노랗게 변해, 두 색이 한 가지에 걸려요. |

### 7월 — 20일 중 20일 확보 / 0일 미확보

| 날짜 | 이름 | 직접 이미지 URL (1280px) | Commons 파일 페이지 | 작가 | 라이선스 | 원본 px | 종 검증 | 한 줄 소개 |
|---|---|---|---|---|---|---|---|---|
| **7/1** | 단양쑥부쟁이 | `https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Aster_altaicus_kz03.jpg/1280px-Aster_altaicus_kz03.jpg` | https://commons.wikimedia.org/wiki/File:Aster_altaicus_kz03.jpg | Krzysztof Ziarnek, Kenraiz | `CC BY-SA 4.0` | 3495 | Aster altaicus — 국명 단양쑥부쟁이(A. altaicus var. uchiyamae)의 기준종. 변종 자체 사진은 Commons에 없음. CSV 영문명 'Fig Marigold'(Mesembryanthemum)는 국명과 어긋나 국명 쪽을 따랐음 | 가늘고 긴 잎 위에 연보랏빛 국화꽃이 한 송이씩 앉아요. |
| **7/2** | 금어초 | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Antirrhinum_majus_%28423941477%29.jpg/1280px-Antirrhinum_majus_%28423941477%29.jpg` | https://commons.wikimedia.org/wiki/File:Antirrhinum_majus_%28423941477%29.jpg | Dinesh Valke from Thane, India | `CC BY-SA 2.0` | 2816 | Antirrhinum majus 종 일치 — 국명 금어초의 정명 | 꽃 옆을 살짝 누르면 입처럼 벌어졌다가 다시 닫혀요. |
| **7/3** | 흰색 양귀비 | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Heilbronn_-_B%C3%B6ckingen_-_Friedhof_-_wei%C3%9Fe_Mohnbl%C3%BCte_auf_Grab_%281.1%29.jpg/1280px-Heilbronn_-_B%C3%B6ckingen_-_Friedhof_-_wei%C3%9Fe_Mohnbl%C3%BCte_auf_Grab_%281.1%29.jpg` | https://commons.wikimedia.org/wiki/File:Heilbronn_-_B%C3%B6ckingen_-_Friedhof_-_wei%C3%9Fe_Mohnbl%C3%BCte_auf_Grab_%281.1%29.jpg | Roman Eisele | `CC BY-SA 4.0` | 4200 | Papaver 속 일치 — CSV 학명도 속명 'Papaver'뿐. Commons 분류는 Papaver (cultivars), 업로더는 아이슬란드양귀비(P. nudicaule) 원예종으로 추정. 흰 꽃 조건은 충족 | 구겨진 종이 같은 흰 꽃잎이 펴지면서 주름을 그대로 남겨요. |
| **7/7** | 서양까지밥나무 | `https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Ribes_uva-crispa_kz04.jpg/1280px-Ribes_uva-crispa_kz04.jpg` | https://commons.wikimedia.org/wiki/File:Ribes_uva-crispa_kz04.jpg | Krzysztof Ziarnek, Kenraiz | `CC BY-SA 4.0` | 3033 | Ribes uva-crispa 종 일치 — 서양까치밥나무(구스베리)의 정명. CSV 표기 '서양까지밥나무'는 오탈자로 보임 | 가시 돋친 가지 아래로 초록빛 작은 꽃이 조용히 매달려요. |
| **7/8** | 버드푸트 | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Lotus_corniculatus_at_Lac_des_Plagnes_%282%29.jpg/1280px-Lotus_corniculatus_at_Lac_des_Plagnes_%282%29.jpg` | https://commons.wikimedia.org/wiki/File:Lotus_corniculatus_at_Lac_des_Plagnes_%282%29.jpg | Krzysztof Golik | `CC BY-SA 4.0` | 3837 | Lotus corniculatus 종 일치 — 영문명 Birdfoot(bird's-foot trefoil)의 정명 | 꼬투리가 새 발가락처럼 갈라져서 그런 이름이 붙었어요. |
| **7/10** | 초롱꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Flower%2C_Campanula_medium_%22Canterbury_bells%22_-_Flickr_-_nekonomania_%282%29.jpg/1280px-Flower%2C_Campanula_medium_%22Canterbury_bells%22_-_Flickr_-_nekonomania_%282%29.jpg` | https://commons.wikimedia.org/wiki/File:Flower%2C_Campanula_medium_%22Canterbury_bells%22_-_Flickr_-_nekonomania_%282%29.jpg | Yoko Nekonomania | `CC BY 2.0` | 3168 | Campanula medium 종 일치 — 영문명 Canterbury Bell의 정명. 국내에서 초롱꽃이라 부르는 C. punctata와는 다른 종 | 종처럼 부푼 꽃이 아래를 보고 매달려 흔들려요. |
| **7/11** | 아스포델 | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Asphodelus_albus_FlowersCloseup_2009March28_SierraMadrona.jpg/1280px-Asphodelus_albus_FlowersCloseup_2009March28_SierraMadrona.jpg` | https://commons.wikimedia.org/wiki/File:Asphodelus_albus_FlowersCloseup_2009March28_SierraMadrona.jpg | Javier martin | `Public domain` | 3200 | Asphodelus albus 종 일치 — PD. 꽃차례 접사 | 마른 땅에서 흰 별 같은 꽃이 층층이 올라가요. |
| **7/12** | 좁은입배풍동 | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Solanum_japonense_3.JPG/1280px-Solanum_japonense_3.JPG` | https://commons.wikimedia.org/wiki/File:Solanum_japonense_3.JPG | Qwert1234 | `CC BY-SA 4.0` | 3716 | Solanum japonense 종 일치 — 국명 좁은잎배풍등의 정명. CSV 표기 '좁은입배풍동'은 오탈자로 보임 | 흰 별 모양 꽃이 지고 나면 작고 붉은 열매가 달려요. |
| **7/13** | 잡초의 꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Phleum_pratense_macro_01.jpg/1280px-Phleum_pratense_macro_01.jpg` | https://commons.wikimedia.org/wiki/File:Phleum_pratense_macro_01.jpg | Humoyun Mehridinov | `CC BY-SA 4.0` | 2656 | 종 특정 항목 아님 — '잡초의 꽃/Flower of Grass'는 볏과 꽃 일반. 대표 이미지로 큰조아재비(Phleum pratense) 꽃차례 매크로 사용 | 꽃잎이 없어 지나치기 쉬운데, 가까이 보면 수술이 촘촘히 걸려 있어요. |
| **7/14** | 플록스 | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Phlox_paniculata_Tatjana20170812_9020.jpg/1280px-Phlox_paniculata_Tatjana20170812_9020.jpg` | https://commons.wikimedia.org/wiki/File:Phlox_paniculata_Tatjana20170812_9020.jpg | Bff | `CC BY-SA 4.0` | 3800 | Phlox paniculata 종 일치 — 국명 플록스의 정명 | 다섯 잎 꽃이 둥글게 뭉쳐 한여름 내내 같은 자리를 지켜요. |
| **7/19** | 백부자 | `https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Aconitum_napellus_RHu_003.JPG/1280px-Aconitum_napellus_RHu_003.JPG` | https://commons.wikimedia.org/wiki/File:Aconitum_napellus_RHu_003.JPG | Meneerke bloem | `CC BY-SA 4.0` | 3216 | Aconitum napellus — 속 일치. CSV 영문명 Aconite의 대표종이지만 국명 백부자(A. coreanum, 연노랑 꽃)와는 다른 종이며 Commons에 A. coreanum 사진 없음 | 투구 모양 꽃이 줄지어 서고, 아름다운 만큼 독이 강해요. |
| **7/20** | 가지 | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Solanum_melongena_flower_12_09_2012.JPG/1280px-Solanum_melongena_flower_12_09_2012.JPG` | https://commons.wikimedia.org/wiki/File:Solanum_melongena_flower_12_09_2012.JPG | JDP90 (Joydeep) | `CC BY-SA 3.0` | 3457 | Solanum melongena 종 일치 — 열매가 아니라 꽃 접사 | 보랏빛 별 모양 꽃 한가운데 노란 수술이 뭉쳐 있어요. |
| **7/22** | 패랭이꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Dianthus_superbus_var._speciosus_%28flower%29.JPG/1280px-Dianthus_superbus_var._speciosus_%28flower%29.JPG` | https://commons.wikimedia.org/wiki/File:Dianthus_superbus_var._speciosus_%28flower%29.JPG | Alpsdake | `CC BY-SA 4.0` | 2560 | Dianthus superbus var. speciosus 종 일치 — CSV 7/28행 학명 Dianthus superbus와 같은 종이라 7/22·7/28 동일 컷 | 꽃잎 끝이 실처럼 잘게 갈라져 술이 늘어진 것처럼 보여요. |
| **7/24** | 연령초 | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Trillium_camschatcense_%27Aomori%27_Ker_Gawl.%2C_Bot._Mag._22_t._855_%281805%29_%2849809064156%29.jpg/1280px-Trillium_camschatcense_%27Aomori%27_Ker_Gawl.%2C_Bot._Mag._22_t._855_%281805%29_%2849809064156%29.jpg` | https://commons.wikimedia.org/wiki/File:Trillium_camschatcense_%27Aomori%27_Ker_Gawl.%2C_Bot._Mag._22_t._855_%281805%29_%2849809064156%29.jpg | sunoochi from Sapporo, Hokkaido, Japan | `CC BY 2.0` | 8032 | Trillium camschatcense 종 일치 — 국명 연령초의 정명 | 잎 석 장 위에 흰 꽃 한 송이만 올려놓고 끝내요. |
| **7/25** | 말오줌나무 | `https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/00_3775_Schwarzer_Hollunder_%28Sambucus_nigra%29.jpg/1280px-00_3775_Schwarzer_Hollunder_%28Sambucus_nigra%29.jpg` | https://commons.wikimedia.org/wiki/File:00_3775_Schwarzer_Hollunder_%28Sambucus_nigra%29.jpg | W. Bulach | `CC BY-SA 4.0` | 5400 | Sambucus nigra — 속 일치. CSV 영문명 Elder-Tree의 정명이지만 국명 말오줌나무(S. racemosa subsp. pendula, 울릉도 특산)와는 다른 종. S. racemosa 쪽은 개화 컷이 1200px 미만뿐 | 작은 흰 꽃 수백 개가 접시처럼 펼쳐지고, 향이 달아요. |
| **7/26** | 향쑥 | `https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Artemisia_absinthium_in_Aveyron_%285%29.jpg/1280px-Artemisia_absinthium_in_Aveyron_%285%29.jpg` | https://commons.wikimedia.org/wiki/File:Artemisia_absinthium_in_Aveyron_%285%29.jpg | Tournasol7 | `CC BY 4.0` | 2086 | Artemisia absinthium 종 일치 — 국명 향쑥의 정명. 꽃차례 접사 | 은빛이 도는 잎에서 쓴 향이 나고, 압생트의 재료로 알려졌어요. |
| **7/28** | 패랭이꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Dianthus_superbus_var._speciosus_%28flower%29.JPG/1280px-Dianthus_superbus_var._speciosus_%28flower%29.JPG` | https://commons.wikimedia.org/wiki/File:Dianthus_superbus_var._speciosus_%28flower%29.JPG | Alpsdake | `CC BY-SA 4.0` | 2560 | Dianthus superbus var. speciosus 종 일치 — CSV 7/28행 학명 Dianthus superbus와 같은 종이라 7/22·7/28 동일 컷 · **7/22와 동일 컷** | 꽃잎 끝이 실처럼 잘게 갈라져 술이 늘어진 것처럼 보여요. |
| **7/29** | 선인장 | `https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/20200812_EchinopsisOxygona_DSC03453K1_PtrQs.jpg/1280px-20200812_EchinopsisOxygona_DSC03453K1_PtrQs.jpg` | https://commons.wikimedia.org/wiki/File:20200812_EchinopsisOxygona_DSC03453K1_PtrQs.jpg | PtrQs | `CC BY-SA 4.0` | 2671 | Echinopsis oxygona — 종 명시. CSV의 '선인장/Cactus'는 분류 단위가 넓어 대표 개화 컷으로 배정. 검은 배경 | 가시밖에 없던 몸에서 하룻밤 사이 큰 꽃이 열려요. |
| **7/30** | 서양종 보리수 | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Tilia_cordata_flowers_002.jpg/1280px-Tilia_cordata_flowers_002.jpg` | https://commons.wikimedia.org/wiki/File:Tilia_cordata_flowers_002.jpg | Meneerke bloem | `CC BY-SA 3.0` | 4288 | Tilia cordata 종 일치 — CSV '서양종 보리수(Lime Tree, Linden)'의 대표종. 7/30·8/23 동일 컷 | 잎처럼 생긴 포 아래로 연노란 꽃이 매달려 향을 퍼뜨려요. |
| **7/31** | 호박 | `https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Cucurbita_moschata_-_flower.jpg/1280px-Cucurbita_moschata_-_flower.jpg` | https://commons.wikimedia.org/wiki/File:Cucurbita_moschata_-_flower.jpg | bastus917 (영철 이) | `CC BY-SA 2.0` | 3888 | Cucurbita moschata 종 일치 — 국내 호박의 기준종. 꽃 접사 | 손바닥만 한 노란 꽃이 아침에 활짝 열려요. |

### 8월 — 25일 중 25일 확보 / 0일 미확보

| 날짜 | 이름 | 직접 이미지 URL (1280px) | Commons 파일 페이지 | 작가 | 라이선스 | 원본 px | 종 검증 | 한 줄 소개 |
|---|---|---|---|---|---|---|---|---|
| **8/3** | 수박풀 | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Hibiscus_trionum_kz01.jpg/1280px-Hibiscus_trionum_kz01.jpg` | https://commons.wikimedia.org/wiki/File:Hibiscus_trionum_kz01.jpg | Krzysztof Ziarnek, Kenraiz | `CC BY-SA 4.0` | 2466 | Hibiscus trionum 종 일치 — 국명 수박풀, 영문명 Flower of an Hour의 정명 | 한 시간이면 진다는 이름처럼, 아침에 열고 낮이면 접어요. |
| **8/4** | 옥수수 | `https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Starr-090801-3516-Zea_mays-female_flowers-Olinda-Maui_%2824970907975%29.jpg/1280px-Starr-090801-3516-Zea_mays-female_flowers-Olinda-Maui_%2824970907975%29.jpg` | https://commons.wikimedia.org/wiki/File:Starr-090801-3516-Zea_mays-female_flowers-Olinda-Maui_%2824970907975%29.jpg | Forest and Kim Starr | `CC BY 3.0 us` | 2736 | Zea mays 종 일치 — 암꽃(수염) 접사. 옥수수는 암꽃과 수꽃이 따로 달림 | 수염 한 올이 알 한 톨과 이어져 있어요. |
| **8/5** | 엘리카 | `https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Erica_carnea_IP0803009.jpg/1280px-Erica_carnea_IP0803009.jpg` | https://commons.wikimedia.org/wiki/File:Erica_carnea_IP0803009.jpg | Leo Michels | `CC0` | 2193 | Erica carnea 종 일치 — CSV '엘리카/Heath'가 가리키는 Erica 속의 대표 재배종. CC0 | 잔가지에 작은 항아리 모양 꽃이 줄줄이 매달려요. |
| **8/6** | 능소화 | `https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Campsis_grandiflora_06.JPG/1280px-Campsis_grandiflora_06.JPG` | https://commons.wikimedia.org/wiki/File:Campsis_grandiflora_06.JPG | Prenn | `CC BY-SA 3.0` | 2592 | Campsis grandiflora 종 일치 — 국명 능소화의 정명. 배경에 담장·벽돌이 들어와 크롭 필요(더 좋은 구도의 Korea.net 컷은 워터마크가 박혀 있어 제외) | 담을 타고 올라가 주황빛 나팔을 바깥으로 내밀어요. |
| **8/7** | 석류 | `https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Punica_June_2009-1.jpg/1280px-Punica_June_2009-1.jpg` | https://commons.wikimedia.org/wiki/File:Punica_June_2009-1.jpg | Alvesgaspar ( talk ) | `CC BY-SA 3.0` | 2999 | Punica 속 일치 — 파일명은 속명까지만. 재배 석류는 사실상 P. granatum 단일종이라 종 불일치 위험은 낮음 | 붉은 꽃받침이 두껍고 단단해서, 꽃일 때부터 열매를 닮았어요. |
| **8/8** | 진달래 | `https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Rhododendron_mucronulatum_pink_peignoir_%2870036%29.jpg/1280px-Rhododendron_mucronulatum_pink_peignoir_%2870036%29.jpg` | https://commons.wikimedia.org/wiki/File:Rhododendron_mucronulatum_pink_peignoir_%2870036%29.jpg | Rhododendrites | `CC BY-SA 4.0` | 4018 | Rhododendron mucronulatum 'Pink Peignoir' 종 일치 — 국명 진달래의 정명 | 잎보다 꽃이 먼저 나와서 가지 전체가 분홍으로 덮여요. |
| **8/9** | 시스터스 | `https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Cistus_May_2014-10.jpg/1280px-Cistus_May_2014-10.jpg` | https://commons.wikimedia.org/wiki/File:Cistus_May_2014-10.jpg | Alvesgaspar | `CC BY-SA 3.0` | 4448 | Cistus 속 일치 — CSV 학명도 속명 'Cistus'뿐이고 파일명도 속명까지만 명시 | 종이처럼 얇은 꽃잎이 하루 만에 지고, 다음 날 새 꽃이 다시 펴요. |
| **8/10** | 이끼 | `https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Polytrichum_commune_in_natural_monument_Knez_u_Hrazan_%281%29.JPG/1280px-Polytrichum_commune_in_natural_monument_Knez_u_Hrazan_%281%29.JPG` | https://commons.wikimedia.org/wiki/File:Polytrichum_commune_in_natural_monument_Knez_u_Hrazan_%281%29.JPG | Chmee2 | `CC BY-SA 3.0` | 4752 | Polytrichum commune 종 일치 — CSV '이끼/Moss'는 분류 단위가 넓어 대표종(솔이끼류) 접사로 배정 | 숲 바닥에 별 모양으로 촘촘히 서서 물기를 오래 붙잡아요. |
| **8/12** | 협죽도 | `https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Nerium_oleander_September_2007-1.jpg/1280px-Nerium_oleander_September_2007-1.jpg` | https://commons.wikimedia.org/wiki/File:Nerium_oleander_September_2007-1.jpg | Alvesgaspar | `CC BY-SA 3.0` | 2877 | Nerium oleander 종 일치 — 국명 협죽도의 정명 | 잎도 가지도 독이 있어서, 예쁜 만큼 조심해야 해요. |
| **8/13** | 골든 로드 | `https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Solidago_virgaurea_ENBLA02.jpg/1280px-Solidago_virgaurea_ENBLA02.jpg` | https://commons.wikimedia.org/wiki/File:Solidago_virgaurea_ENBLA02.jpg | Enrico Blasutto | `CC BY-SA 4.0` | 1942 | Solidago virgaurea 종 일치 — 영문명 Golden Rod의 유럽 기준종 | 가을 들판에서 노란 꽃이 막대처럼 곧게 서요. |
| **8/14** | 저먼더 | `https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Teucrium_chamaedrys_Ligerz.jpg/1280px-Teucrium_chamaedrys_Ligerz.jpg` | https://commons.wikimedia.org/wiki/File:Teucrium_chamaedrys_Ligerz.jpg | MurielBendel | `CC BY-SA 4.0` | 3182 | Teucrium chamaedrys 종 일치 — 영문명 Wall Germander의 정명. 8/14·8/30 동일 컷 | 돌담 틈에 뿌리내리고 분홍빛 입술 모양 꽃을 달아요. |
| **8/16** | 타마린드 | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Tamarindus_indica_%28517656695%29.jpg/1280px-Tamarindus_indica_%28517656695%29.jpg` | https://commons.wikimedia.org/wiki/File:Tamarindus_indica_%28517656695%29.jpg | Dinesh Valke from Thane, India | `CC BY-SA 2.0` | 2816 | Tamarindus indica 종 일치 — CSV 학명과 동일 | 연노랑 꽃이 지고 나면 신맛 나는 갈색 꼬투리가 열려요. |
| **8/17** | 튤립나무 | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/2015_Kwiat_tulipanowca_ameryka%C5%84skiego.jpg/1280px-2015_Kwiat_tulipanowca_ameryka%C5%84skiego.jpg` | https://commons.wikimedia.org/wiki/File:2015_Kwiat_tulipanowca_ameryka%C5%84skiego.jpg | Jacek Halicki | `CC BY-SA 4.0` | 4082 | Liriodendron tulipifera 종 일치 — 파일명의 폴란드어 'tulipanowiec amerykański'가 이 종의 통칭 | 높은 가지 위에 튤립을 닮은 꽃이 초록빛으로 피어요. |
| **8/18** | 접시꽃 | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Alcea_rosea_purple.jpg/1280px-Alcea_rosea_purple.jpg` | https://commons.wikimedia.org/wiki/File:Alcea_rosea_purple.jpg | PJDespa | `CC BY-SA 3.0` | 4288 | Alcea rosea 종 일치 — 국명 접시꽃의 정명. 6/23·8/18 동일 컷 · **6/23와 동일 컷** | 곧게 선 줄기를 따라 접시만 한 꽃이 아래에서 위로 올라가며 펴요. |
| **8/19** | 로사 캠피온 | `https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Silene_coronaria_Valternigo_02.jpg/1280px-Silene_coronaria_Valternigo_02.jpg` | https://commons.wikimedia.org/wiki/File:Silene_coronaria_Valternigo_02.jpg | Syrio | `CC BY-SA 4.0` | 3506 | Silene coronaria 종 일치 — CSV 로사 캠피온(Rose Campion), 이명 Lychnis coronaria | 은빛 솜털 잎 위로 진한 자홍색 꽃이 홀로 서요. |
| **8/21** | 짚신나물 | `https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Agrimonia_eupatoria_-_Keila.jpg/1280px-Agrimonia_eupatoria_-_Keila.jpg` | https://commons.wikimedia.org/wiki/File:Agrimonia_eupatoria_-_Keila.jpg | Ivar Leidus | `CC BY-SA 4.0` | 3800 | Agrimonia eupatoria — 속 일치. CSV 영문명 Agrimony의 정명이지만 국명 짚신나물(A. pilosa)과는 다른 종. Commons의 A. pilosa 사진은 개화 전 잎 컷뿐 | 가는 꽃대에 노란 꽃이 촘촘히 붙고, 열매는 옷에 잘 달라붙어요. |
| **8/22** | 스피리아 | `https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Spiraea_japonica_%28flower%29.JPG/1280px-Spiraea_japonica_%28flower%29.JPG` | https://commons.wikimedia.org/wiki/File:Spiraea_japonica_%28flower%29.JPG | Alpsdake | `CC BY-SA 4.0` | 3000 | Spiraea japonica 종 일치 — CSV 학명 Spiraea의 대표 재배종 | 잔꽃이 우산처럼 모여 분홍 구름 한 덩이처럼 보여요. |
| **8/23** | 서양종 보리수 | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Tilia_cordata_flowers_002.jpg/1280px-Tilia_cordata_flowers_002.jpg` | https://commons.wikimedia.org/wiki/File:Tilia_cordata_flowers_002.jpg | Meneerke bloem | `CC BY-SA 3.0` | 4288 | Tilia cordata 종 일치 — CSV '서양종 보리수(Lime Tree, Linden)'의 대표종. 7/30·8/23 동일 컷 · **7/30와 동일 컷** | 잎처럼 생긴 포 아래로 연노란 꽃이 매달려 향을 퍼뜨려요. |
| **8/25** | 안스륨 | `https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Anturio_rojo_%28Anthurium_andraeanum%29_-_Flickr_-_Alejandro_Bayer_%281%29.jpg/1280px-Anturio_rojo_%28Anthurium_andraeanum%29_-_Flickr_-_Alejandro_Bayer_%281%29.jpg` | https://commons.wikimedia.org/wiki/File:Anturio_rojo_%28Anthurium_andraeanum%29_-_Flickr_-_Alejandro_Bayer_%281%29.jpg | Alejandro Bayer Tamayo from Armenia, Colombia | `CC BY-SA 2.0` | 4608 | Anthurium andraeanum 종 일치 — 국명 안스륨, 영문명 Flaming Flower의 정명 | 꽃잎처럼 보이는 붉은 판은 사실 잎이 변한 포예요. |
| **8/26** | 하이포시스 오리어 | `https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Hypoxis_aurea_%283804595970%29.jpg/1280px-Hypoxis_aurea_%283804595970%29.jpg` | https://commons.wikimedia.org/wiki/File:Hypoxis_aurea_%283804595970%29.jpg | Dinesh Valke from Thane, India | `CC BY-SA 2.0` | 2048 | Hypoxis aurea 종 일치 — CSV 학명과 동일 | 풀 사이에서 노란 별 하나가 땅에 바짝 붙어 피어요. |
| **8/27** | 고비 | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Osmunda_japonica_001.jpg/1280px-Osmunda_japonica_001.jpg` | https://commons.wikimedia.org/wiki/File:Osmunda_japonica_001.jpg | Kropsoq | `CC BY-SA 3.0` | 1898 | Osmunda japonica 종 일치 — 국명 고비의 정명. 양치식물이라 꽃이 없어 어린 순(권상엽) 접사 | 돌돌 말린 어린 순이 천천히 풀리면서 잎이 돼요. |
| **8/28** | 에린지움 | `https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Eryngium_planum_kz21.jpg/1280px-Eryngium_planum_kz21.jpg` | https://commons.wikimedia.org/wiki/File:Eryngium_planum_kz21.jpg | Krzysztof Ziarnek, Kenraiz | `CC BY-SA 4.0` | 2011 | Eryngium planum 종 일치 — CSV 학명 Eryngium의 대표종 | 꽃도 잎도 금속처럼 푸르고, 만지면 뻣뻣해요. |
| **8/29** | 꽃담배 | `https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Nicotiana_alata.jpg/1280px-Nicotiana_alata.jpg` | https://commons.wikimedia.org/wiki/File:Nicotiana_alata.jpg | Swaminathan from Gurgaon, India | `CC BY 2.0` | 3888 | Nicotiana alata 종 일치 — 국명 꽃담배, 영문명 Flowering Tobacco Plant의 정명 | 해질 무렵 흰 별 모양 꽃이 열리고 향이 퍼져요. |
| **8/30** | 저먼더 | `https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Teucrium_chamaedrys_Ligerz.jpg/1280px-Teucrium_chamaedrys_Ligerz.jpg` | https://commons.wikimedia.org/wiki/File:Teucrium_chamaedrys_Ligerz.jpg | MurielBendel | `CC BY-SA 4.0` | 3182 | Teucrium chamaedrys 종 일치 — 영문명 Wall Germander의 정명. 8/14·8/30 동일 컷 · **8/14와 동일 컷** | 돌담 틈에 뿌리내리고 분홍빛 입술 모양 꽃을 달아요. |
| **8/31** | 토끼풀 | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Trifolium_repens_flower_April_2_2010.jpg/1280px-Trifolium_repens_flower_April_2_2010.jpg` | https://commons.wikimedia.org/wiki/File:Trifolium_repens_flower_April_2_2010.jpg | Supportstorm | `Public domain` | 2414 | Trifolium repens 종 일치 — 국명 토끼풀의 정명. PD. 5/29·6/17·8/31 동일 컷 · **5/29와 동일 컷** | 작은 나비 모양 꽃 수십 개가 모여 하나의 공처럼 보여요. |


---

## 미확보 2일 — 왜 비웠는가

두 날 모두 **사진을 못 찾은 게 아니라 어떤 식물을 찍어야 하는지 원 자료가 답하지 못한다.** 후보를 눈감고 고르면 그럴듯한 사진이 붙지만, 그 순간 도감이 거짓말을 하게 된다.

| 날짜 | 이름 | 원 표기 | 판단 |
|---|---|---|---|
| **5/19** | 아리스타타 | `Aristata` | `aristata`는 종소명(種小名)일 뿐 속명이 없다. CSV `editorial_note`도 이미 "두 표가 갈린다 — 순천만은 아이리스, 로얄플라워는 아리스타타"라고 적어 두었다. *Gaillardia aristata*(천인국)·*Aristea*·붓꽃 어느 쪽으로도 갈 수 있어 식물이 특정되지 않는다 |
| **6/7** | 슈미트티아나 | `Schmidtiana` | 같은 문제다. 원예 시장에서 "Schmidtiana"로 유통되는 것은 대개 *Artemisia schmidtiana*(실버마운드)지만 원 표에 속명이 없고, 그마저도 잎을 보는 식물이라 "탄생화"의 꽃 이미지와 맞지 않는다 |

**해소 방법 제안**: 두 날은 사진 문제가 아니라 데이터 문제다. `birth_flowers.csv` 쪽에서 속명을 확정하는 결정이 먼저 필요하다. 확정만 되면 사진은 어렵지 않다 — *Gaillardia aristata*와 *Artemisia schmidtiana* 모두 Commons에 CC BY-SA 컷이 충분하다.

---

## 종 검증에서 남은 불일치 — Advisor 판단 필요

전부 CSV에 `species_note`로 기입해 두었지만, 서비스 노출 전에 결정이 필요한 것만 모았다.

### 1. 국명과 영문명이 서로 다른 식물을 가리키는 날 — 5건

원 표가 국명과 영문명을 짝지어 놓았는데 둘이 다른 종인 경우다. **이 조사는 화면에 뜨는 이름이 국명이라는 이유로 국명 쪽을 우선했고, 그럴 수 없을 때만 영문명을 따랐다.**

| 날짜 | 이름 | 충돌 | 채택 | 근거 |
|---|---|---|---|---|
| **7/1** | 단양쑥부쟁이 / Fig Marigold | 국명은 *Aster altaicus* var. *uchiyamae*(한국 특산 멸종위기종), 영문명은 *Mesembryanthemum*(아이스플랜트). **완전히 다른 과** | 국명 쪽 — *Aster altaicus* | 변종 자체 사진이 Commons에 없어 기준종으로 대체. CSV `editorial_note`도 순천만 표기가 '쑥부쟁이'였다고 기록 |
| **7/19** | 백부자 / Aconite | 국명은 *Aconitum coreanum*(연노랑 꽃), 영문명은 투구꽃속 통칭 | 영문명 쪽 — *Aconitum napellus* | Commons에 *A. coreanum* 사진이 없다. **꽃 색이 다르다(연노랑 vs 보라)는 점을 화면에서 어떻게 다룰지 결정 필요** |
| **7/25** | 말오줌나무 / Elder-Tree | 국명은 *Sambucus racemosa* subsp. *pendula*(울릉도 특산), 영문명은 *S. nigra* | 영문명 쪽 — *S. nigra* | *S. racemosa* 개화 컷은 전부 1200px 미만이거나 꽃봉오리 단계였다 |
| **8/21** | 짚신나물 / Agrimony | 국명은 *Agrimonia pilosa*, 영문명은 *A. eupatoria* | 영문명 쪽 — *A. eupatoria* | Commons의 *A. pilosa* 사진은 4월 촬영 잎 컷뿐이라 꽃이 없다 |
| **7/10** | 초롱꽃 / Canterbury Bell | 국내 초롱꽃은 *Campanula punctata*, Canterbury Bell은 *C. medium* | 영문명 쪽 — *C. medium* | 꽃 모양이 확연히 달라(점무늬 vs 무지 종형) 국명만 보고 온 사용자가 낯설어할 수 있다 |

### 2. 원 표의 학명이 속명까지만인 날 — 5건

CSV가 애초에 속만 지정했으므로 **속 일치로 조건은 충족**한다. 다만 화면에 학명을 노출한다면 종까지 특정할지 결정이 필요하다.

- **7/3 흰색 양귀비** (`Papaver`) — 채택 컷의 Commons 분류가 `Papaver (cultivars)`이고 업로더는 아이슬란드양귀비(*P. nudicaule*) 원예종으로 추정한다고 적었다. 흰 꽃 조건은 충족
- **8/9 시스터스** (`Cistus`) — 채택 컷은 흰 꽃잎에 진한 자주 반점이 있어 *C. ladanifer*로 보이나 파일 표기는 속명까지다
- **7/29 선인장** (`Cactus`) · **8/10 이끼** (`Moss`) · **8/5 엘리카** (`Heath`) — 분류 단위 자체가 넓다. 각각 *Echinopsis oxygona*, *Polytrichum commune*, *Erica carnea*를 대표 컷으로 배정했다
- **8/7 석류** (`Punica`) — 파일명이 속명까지지만 재배 석류는 사실상 *P. granatum* 단일종이라 위험이 낮다
- **6/26 흰 라일락** — 파일 제목이 러시아어 `сирень`(라일락)이라 종소명이 없다. 재배 흰 라일락은 통상 *S. vulgaris* 품종이다

### 3. 종 자체가 지정되지 않은 항목 — 3건

'특정 식물'이 아니라 '상태'나 '분류군'을 가리키는 날이다. **대표 이미지임을 `species_note`에 명시**해 두었다.

| 날짜 | 이름 | 배정 | 성격 |
|---|---|---|---|
| **5/23** | 풀의 싹 / Leaf Buds | *Acer negundo* 겨울눈 접사 (USGS 촬영, PD) | 잎이 되기 전 상태 그 자체. 검은 배경이라 다크 무드와 궁합이 좋다 |
| **7/13** | 잡초의 꽃 / Flower of Grass | 큰조아재비 *Phleum pratense* 꽃차례 매크로 | 볏과 꽃 일반. 꽃잎 없이 수술만 매달린 모습이 "잡초의 꽃"을 정확히 설명한다 |
| **8/10** | 이끼 / Moss | 솔이끼 *Polytrichum commune* | 선태식물 전체를 대표. 별 모양 로제트가 이끼의 전형이다 |

### 4. CSV 표기 오탈자로 보이는 것 — 3건 (사진과 무관, 데이터 정리용)

| 날짜 | 현재 표기 | 정정 후보 |
|---|---|---|
| 7/7 | 서양까**지**밥나무 | 서양까**치**밥나무 (*Ribes uva-crispa*) |
| 7/12 | 좁은**입**배풍**동** | 좁은**잎**배풍**등** (*Solanum japonense*) |
| 5/16 | 조**팝**나물 | 조**밥**나물 (*Hieracium umbellatum*) — CSV `editorial_note`가 이미 지적한 사항 |

---

## 같은 컷을 여러 날에 쓴 7일

브리프 규정대로 이름이 같은 날은 조사 1회 후 동일 컷을 반복 기입했다.

| 이름 | 날짜 | 컷 |
|---|---|---|
| 토끼풀 | 5/29 · 6/17 · 8/31 | *Trifolium repens* 두상꽃차례 (PD) |
| 접시꽃 | 6/23 · 8/18 | *Alcea rosea* 진자주 단화 |
| 패랭이꽃 | 7/22 · 7/28 | *Dianthus superbus* var. *speciosus* |
| 서양종 보리수 | 7/30 · 8/23 | *Tilia cordata* 꽃차례 |
| 저먼더 | 8/14 · 8/30 | *Teucrium chamaedrys* 꽃대 |

라일락은 세 날(5/12 라일락 · 5/30 보랏빛 라일락 · 6/26 흰 라일락)이 색으로 구분되므로 **서로 다른 컷 3장**을 배정했다. 매발톱꽃도 5/14(보라)과 6/2(빨강)이 색으로 갈려 다른 컷을 썼다.

---

## 사용 시 주의

1. **크롭이 필요한 컷** — 다음은 중거리 구도라 카드용으로 쓰려면 크롭해야 한다. 원본 해상도가 충분해 크롭 여유는 있다.
   `5/2 미나리아재비` · `5/16 조밥나물` · `6/14 뚜껑별꽃`(군락 컷) · `6/22 가막살나무`(잎이 화면을 많이 차지) · `8/3 수박풀` · `8/6 능소화`(배경에 담장)
2. **원본 2000px 미만 5장** — `6/20 꼬리풀`(1374px) · `5/20 괭이밥`(1632px) · `5/28 박하`(1600px) · `8/27 고비`(1898px) · `8/13 골든 로드`(1942px). 전부 1280px 썸네일은 정상 생성되지만 **1920px 썸네일은 만들 수 없다.** 풀스크린 배경에는 쓰지 말 것
3. **꼬리풀(6/20)은 대체 불가에 가깝다** — Commons 전체에 *Veronica linariifolia* 사진이 2장뿐이다. 더 나은 컷을 원하면 다른 출처를 찾아야 한다
4. **원본 직접 핫링크 금지** — 표에 적은 것은 전부 `/thumb/.../1280px-` 형태의 썸네일 URL이다. 위키미디어는 `upload.wikimedia.org` 원본 파일 직접 핫링크를 만류하므로 그대로 쓸 것
5. **허용 썸네일 폭은 6종뿐** — `120 / 250 / 330 / 500 / 1280 / 1920`. 그 외 값(예: 800, 1024, 1500)은 `HTTP 400`과 함께 "Use thumbnail sizes listed on https://w.wiki/GHai" 응답이 온다. 조사 초기에 340px·320px로 시도했다가 전량 실패했다
6. **요청 속도** — 짧은 시간에 병렬로 긁으면 `HTTP 429`가 뜬다. 동시 2연결·요청 간 0.25초 이상 간격이면 안정적이었다

---

## 산출 파일

- `content/birth_photos.part2.csv` — 86행. 스키마는 part 1과 동일한 `month,day,name_ko,commons_page_url,direct_url,author,license,width,species_note,family_line`
  - 미확보 2일도 행은 만들었고 URL 계열 칸은 비운 채 `species_note`에 사유를 적었다
  - `family_line`은 §1.5d 해요체로 직접 서술했다. 원문 문장 복사는 없고, 미확보 2일은 확신이 없으므로 빈 값으로 뒀다
