# 탄생화 사전 사진 조사 기록 — 1~4월 (part1, 2026-08-16)

`content/birth_flowers.csv` 에서 **flower_id 가 비어 있는 날**(도감 32종에 연결되지 않아
재사용할 실사가 없는 날) 중 **1~4월 담당분**에 대해, 그 꽃의 실사 사진 1장을
위키미디어 커먼즈에서 **종 검증 + 라이선스 검증 + 육안 검증**으로 확보한 기록이다.

산출물은 `content/birth_photos.part1.csv` 한 장이다.
5~8월·9~12월은 다른 작업자가 같은 형식으로 만들고 있으므로, **형식 규약(§3)을 바꾸지 말 것.**

한 줄 요약: **89일 전수 확보(미확보 0)**. 다만 그중 1건(논냉이)은 커먼즈 전체에
그 종 파일이 1장뿐이라 화질 기준(가로 1200px)을 못 맞춘 채 채택했다. 그리고
**설명이 붙어 있어도 사진이 그 종이 아닌 파일이 실제로 있었다**(§6) — 육안 검증을
거치지 않았다면 칼미아 자리에 등대꽃속 사진이, 도라지 자리에 잎사귀만 있는
사진이 들어갈 뻔했다.

---

## 1. 무엇을 수집했나

| 항목 | 값 |
|---|---|
| 담당 범위 | 1월 1일 ~ 4월 30일 |
| 그 범위의 전체 일수 | 121 |
| `flower_id` 가 채워진 날(도감 재사용, 건너뜀) | 32 |
| **조사 대상 = flower_id 가 빈 날** | **89** |
| CSV 행 수 | **89** (전수 커버) |
| 서로 다른 꽃 이름 | **79** (같은 이름이 여러 날에 오는 것이 정상) |
| 사진 확보 | **89 / 89** |
| 미확보(URL 칸 빈 행) | **0** |
| 원본 가로 1200px 이상 | 78종 / 79종 |
| 라이선스 부적합(NC·ND)으로 배제한 파일 | 후보 단계에서 전량 필터, 최종 0건 |

월별 대상 일수: 1월 20 · 2월 26 · 3월 25 · 4월 18.

같은 이름이 여러 날에 오는 9종(미나리아재비 3일, 이끼·황새냉이·빙카·아도니스·자운영·
수양버들·아몬드·금작화 각 2일)은 **사진을 한 번만 조사하고 각 날에 같은 값을 반복**했다.
통합기가 이름 단위로 정규화할 것을 전제로 한 형식이다.

---

## 2. 어떻게 찾고 어떻게 걸렀나

기계로 후보를 모으고, 사람이 눈으로 최종 확인하는 2단 구조로 했다.

**1단계 — 커먼즈 API로 후보 수집.** `commons.wikimedia.org/w/api.php` 에
`generator=categorymembers` (`Category:<학명>`) + `prop=imageinfo&iiprop=extmetadata`
로 종별 100~200건을 끌어와, `extmetadata` 의 `LicenseShortName`/`License` 로
**NC·ND·fair use 를 기계적으로 제거**하고 폭 1200px 미만을 감점했다.
영어·한국어 위키백과의 대표 이미지(`prop=pageimages`)도 후보에 넣어 가산점을 줬다 —
편집자들이 종 동정을 한 번 걸러 준 사진이기 때문이다.
파일명에 herbarium/illustration/plate/Koehler/leaf/fruit/bark 등이 들어간 것은 감점해
식물도감 삽화와 표본 사진을 밀어냈다.

**2단계 — 육안 검증.** 최종 후보 79장을 **전부 내려받아 직접 봤다.**
이 단계에서 15건을 교체했다(§6). 파일 설명의 학명만 믿으면 안 된다는 것이
이번 조사의 가장 큰 소득이다.

### 함정: 커먼즈 썸네일 폭이 이제 표준 목록으로 제한된다

`…/thumb/…/400px-…`, `640px-`, `800px-`, `1024px-` 는 **전부 HTTP 400** 을 돌려준다.
응답 본문이 `Use thumbnail sizes listed on https://w.wiki/GHai` 다.
직접 테스트로 확인한 결과 **1280px 는 200** 이다.
그래서 `direct_url` 은 1280px 썸네일로 통일했다(원본이 1280 미만이면 원본 직링크).
임의 폭으로 리사이즈하려던 코드가 있다면 지금 다 깨진다.

`upload.wikimedia.org` 는 초당 요청이 몰리면 **429** 를 돌려준다.
79장을 받는 데 요청 간 1.2초 간격 + 429 재시도가 필요했다. 다음에 같은 작업을 할 때
동시 다운로드로 짜면 절반쯤 실패한다.

또 API 가 돌려주는 `thumburl` 에는 `?utm_source=commons.wikimedia.org&…` 가 붙어 온다.
**쿼리스트링을 떼고 저장**해야 한다(CSV에는 뗀 상태로 들어가 있다).

---

## 3. CSV 형식 규약 — 5~8월·9~12월과 맞춰야 하는 부분

`content/birth_photos.part1.csv`, UTF-8 **BOM 없음**, 줄바꿈 **LF**, 헤더 포함.

```
month,day,name_ko,commons_page_url,direct_url,author,license,width,species_note,family_line
```

| 열 | 규약 |
|---|---|
| `month`,`day` | `birth_flowers.csv` 의 값 그대로(0 패딩 없음) |
| `name_ko` | `birth_flowers.csv` 의 `name_ko` 와 **글자 단위로 동일**. 조인 키다 |
| `commons_page_url` | `https://commons.wikimedia.org/wiki/File:…` (쿼리스트링 없음) |
| `direct_url` | `…/thumb/…/1280px-…` 형식. **원본이 1280px 이하이면 원본 직링크**(논냉이 800px·월계수 1280px 2건이 여기 해당) |
| `author` | 파일 페이지의 저작자명. 위키 상용구는 벗겨서 이름만 남김(아래) |
| `license` | `LicenseShortName` 문자열 그대로 (`CC BY-SA 4.0`, `CC0`, `Public domain`, `CC BY-SA 2.0 fr` …) |
| `width` | **원본 파일의 가로 픽셀**. `direct_url` 의 폭이 아니다 — 화질 판정 근거값 |
| `species_note` | 종 검증 근거 한 줄 |
| `family_line` | 그 꽃을 소개하는 자체 서술 한 줄(해요체). 문장 복사 없음 |

**저작자명 정규화 규칙**(3건에만 적용, 이름 자체는 손대지 않음)
- `No machine-readable author provided. MPF assumed (based on copyright claims).` → `MPF`
- `Walter Siegmund (talk)` → `Walter Siegmund`
- `Giancarlo Dessì (Posted by -- gian_d 16:41, 17 June 2007 (UTC))` → `Giancarlo Dessì`

플리커 출신 파일의 `이름 from 지역` 형태(`Katja Schulz from Washington, D. C., USA`)는
커먼즈가 표기하는 그대로 뒀다. 쉼표가 들어가므로 CSV 인용이 필요하다.

---

## 4. 라이선스 분포

행 기준(89행) / 이름 기준(79종).

| 라이선스 | 행 | 종 |
|---|---|---|
| CC BY-SA 4.0 | 44 | 38 |
| CC BY-SA 3.0 | 16 | 14 |
| CC BY-SA 2.0 | 8 | 7 |
| CC BY 4.0 | 6 | 6 |
| CC0 | 5 | 5 |
| CC BY 3.0 | 4 | 3 |
| CC BY 2.0 | 3 | 3 |
| CC BY 2.5 | 1 | 1 |
| CC BY-SA 2.0 fr | 1 | 1 |
| Public domain | 1 | 1 |

- **NC·ND 는 0건.** 후보 수집 단계에서 `License`/`LicenseShortName` 에 nc/nd/noncommercial/
  noderivs 가 들어간 파일을 기계적으로 잘라냈다.
- **저작자 표기 의무가 있는 라이선스가 83/89행**(CC0·PD 6행 제외)이다.
  화면에 사진을 쓸 때 `author` + `license` + 파일 페이지 링크가 함께 나가야 한다.
- **CC BY-SA 가 68/89행**이다. 사진을 잘라 쓰는 것은 되지만, **파생물에 동일 라이선스를
  걸어야 하는 조항**이 있다. 사진 위에 텍스트를 얹은 합성 이미지를 만들 계획이라면
  CC BY·CC0 쪽으로 다시 고르는 판단이 필요하다(§8).
- `CC BY-SA 2.0 fr` 은 프랑스 이식본이다. BY-SA 계열이므로 조건은 같다.

---

## 5. 월별 표

`width` 는 원본 가로 픽셀이다. 전체 URL은 CSV를 볼 것.

### 1월 (20일)

| 일 | 이름 | 커먼즈 파일 | 원본 폭 | 라이선스 | 저작자 |
|---|---|---|---|---|---|
| 1 | 스노드롭 | 20260307 Galanthus nivalis.jpg | 5079 | CC BY 4.0 | Flocci Nivis |
| 5 | 노루귀 | 尖瓣獐耳細辛 Hepatica asiatica f acutiloba -首爾切頭山公園 Seoul, South Korea- (33142022393).jpg | 2064 | CC BY-SA 2.0 | 阿橋 HQ |
| 10 | 회양목 | Buxus koreana's flowers.JPG | 3264 | CC BY-SA 3.0 | Dalgial |
| 11 | 측백나무 | Platycladus orientalis cones.jpg | 3072 | CC BY-SA 2.0 | Josef Grunig at Flickr |
| 12 | 향기 알리섬 | Lobularia maritima, Sète 01.jpg | 3961 | CC BY-SA 4.0 | Christian Ferrer |
| 15 | 가시 | Prunus spinosa 04.2025 (9).jpg | 8192 | CC BY-SA 4.0 | DidierFy |
| 17 | 수영 | Rumex acetosa (subsp. acetosa) sl18.jpg | 3096 | CC BY-SA 4.0 | Stefan.lefnaer |
| 18 | 어저귀 | Abutilon theophrasti RF.jpg | 2656 | CC BY 4.0 | Robert Flogaus-Faust |
| 19 | 소나무 | Pinus densiflora, Morris Arboretum 03.jpg | 4608 | CC BY-SA 4.0 | Shuvaev |
| 20 | 미나리아재비 | Ranunculus japonicus 3.JPG | 4272 | CC BY-SA 3.0 | Dalgial |
| 21 | 담쟁이덩굴 | Poertschach Hauptstrasse Parthenocissus tricuspidata Blattwerk 04062015 4423.jpg | 7360 | CC BY-SA 4.0 | Johann Jaritz |
| 22 | 이끼 | Polytrichum commune .jpg | 3800 | CC BY-SA 4.0 | Hans Hillewaert |
| 23 | 부들 | Bulrush (Typha latifolia) (8139113636).jpg | 2738 | CC BY-SA 2.0 | Peter O'Connor aka anemoneprojectors from Stevenage, United Kingdom |
| 24 | 가을에 피는 사프란 | Macro photograph of saffron flower (Crocus sativus).jpg | 9000 | CC BY-SA 4.0 | Koshur |
| 25 | 점나도나물 | Common Mouse-ear (Cerastium fontanum) (9163760223).jpg | 2664 | CC BY-SA 2.0 | Peter O'Connor aka anemoneprojectors from Stevenage, United Kingdom |
| 26 | 미모사 | Mimosa pudica flower DSC 4267.jpg | 6000 | CC BY-SA 4.0 | Ranjithsiji |
| 27 | 마가목 | (Sorbus commixta in Mount Nishi-Hotaka, Japan) - DPLA - 89bc6c…jpg | 1500 | CC BY 4.0 | Carlquist, Sherwin John, 1930-2021 |
| 28 | 검은 포플라 | PopulusNigra2a.jpg | 2000 | CC BY-SA 3.0 | Christian Fischer |
| 29 | 이끼 | Polytrichum commune .jpg | 3800 | CC BY-SA 4.0 | Hans Hillewaert |
| 30 | 매쉬 메리골드 | Caltha palustris in Avoriaz (3).jpg | 2977 | CC BY-SA 4.0 | Krzysztof Golik |

### 2월 (26일)

| 일 | 이름 | 커먼즈 파일 | 원본 폭 | 라이선스 | 저작자 |
|---|---|---|---|---|---|
| 2 | 모과 | Pseudocydonia sinensis flower.JPG | 4608 | CC BY-SA 3.0 | Rorolinus |
| 3 | 황새냉이 | Cardamine flexuosa kz06.jpg | 3578 | CC BY-SA 4.0 | Krzysztof Ziarnek, Kenraiz |
| 5 | 양치 | Athyrium filix-femina0.jpg | 2848 | CC BY 2.5 | MPF |
| 6 | 바위솔 | Orostachys japonica (flower).jpg | 3981 | CC BY-SA 4.0 | Alpsdake |
| 8 | 범의귀 | Saxifraga fortunei GotBot 2015 001.jpg | 5496 | CC BY 4.0 | Averater |
| 9 | 은매화 | Myrtus communis11.jpg | 2608 | CC BY-SA 3.0 | Giancarlo Dessì |
| 10 | 서향 | Daphné odora en fleurs - panoramio.jpg | 4000 | CC BY 3.0 | chisloup |
| 11 | 멜리사 | Melissa officinalis J1.jpg | 3900 | CC BY-SA 3.0 | Jamain |
| 12 | 쥐꼬리망초 | Rostellularia procumbens by kadavoor.jpg | 1536 | CC BY-SA 4.0 | Jeevan Jose, Kerala, India |
| 13 | 갈풀 | Phalaris arundinacea flowers, rietgras bloempjes (1).jpg | 3264 | CC BY-SA 3.0 | Rasbak |
| 14 | 카모밀레 | Matricaria Chamomilla Flowers.jpg | 6000 | CC BY-SA 4.0 | Sarbast.T.Hameed |
| 15 | 삼나무 | Kanagawa-birin50-daiyuuzan.JPG | 2272 | CC BY-SA 3.0 | Σ64 |
| 16 | 월계수 | Laurus nobilis HRM1.jpg | 1280 | CC BY-SA 4.0 | Cillas |
| 17 | 야생화 | Wildflower Meadow (6997737191).jpg | 2560 | Public domain | Mount Rainier National Park from Ashford, WA, United States |
| 18 | 미나리아재비 | Ranunculus japonicus 3.JPG | 4272 | CC BY-SA 3.0 | Dalgial |
| 19 | 떡갈나무 | Daimyo Oak 20170513 IMG 8412.jpg | 3264 | CC BY-SA 4.0 | あおもりくま(Aomorikuma) |
| 20 | 칼미아 | Mountain Laurel in Bloom (33956585443).jpg | 4000 | CC BY 2.0 | Katja Schulz from Washington, D. C., USA |
| 21 | 네모필라 | Nemophila menziesii 7794.JPG | 3456 | CC BY-SA 4.0 | Walter Siegmund |
| 22 | 무궁화 | Flower of hibiscus syriacus in Hakozaki Campus, Kyushu University.jpg | 2448 | CC BY-SA 4.0 | そらみみ (Soramimi) |
| 23 | 살구꽃 | Алматы, роща Баума, цветение абрикоса (5).jpg | 3984 | CC BY-SA 4.0 | ElenaLitera |
| 24 | 빙카 | A flower of lesser periwinkle (Vinca minor) close up.jpg | 4624 | CC BY-SA 4.0 | Naturformidleren |
| 25 | 사향장미 | Rosa moschata - Rosengarten am Schloßberg.jpg | 5472 | CC BY-SA 4.0 | Wilrooij |
| 26 | 아도니스 | 側金盞花 Adonis amurensis -首爾切頭山公園 Seoul, South Korea- (33823991311).jpg | 2528 | CC BY-SA 2.0 | 阿橋 HQ |
| 27 | 아라비아의 별 | Ornithogalum arabicum.jpg | 3024 | CC0 | Smailtn |
| 28 | 보리 | Champ d'Orge carrée (Hordeum vulgare).jpg | 5366 | CC BY-SA 4.0 | JackyM59 |
| 29 | 아르메리아 | 20230519 Gewöhnliche Grasnelke (Armeria maritima).jpg | 6000 | CC BY-SA 4.0 | Matthias Bethke |

### 3월 (25일)

| 일 | 이름 | 커먼즈 파일 | 원본 폭 | 라이선스 | 저작자 |
|---|---|---|---|---|---|
| 2 | 미나리아재비 | Ranunculus japonicus 3.JPG | 4272 | CC BY-SA 3.0 | Dalgial |
| 3 | 자운영 | Astragalus sinicus 3.JPG | 3264 | CC BY 3.0 | Dalgial |
| 4 | 나무딸기 | Rubus idaeus kz05.jpg | 4058 | CC BY-SA 4.0 | Krzysztof Ziarnek, Kenraiz |
| 7 | 황새냉이 | Cardamine flexuosa kz06.jpg | 3578 | CC BY-SA 4.0 | Krzysztof Ziarnek, Kenraiz |
| 8 | 밤꽃 | Japanese Chestnut02.jpg | 3072 | CC BY-SA 3.0 | Apple2000 |
| 9 | 낙엽송 | Larix kaempferi 01.jpg | 3888 | CC BY 3.0 | Σ64 |
| 10 | 느릅나무 | SHHG Ulmus davidiana.jpg | 2108 | CC BY-SA 4.0 | Ptelea |
| 11 | 씀바귀 | Ixeridium dentatum 1.jpg | 3888 | CC BY-SA 2.0 | bastus917 |
| 12 | 수양버들 | Cornjum, Martenastate, (tuin) 03.jpg | 3048 | CC BY-SA 4.0 | Dominicus Johannes Bergsma |
| 13 | 산옥잠화 | Hosta sieboldiana (flower).jpg | 3200 | CC BY-SA 4.0 | Alpsdake |
| 14 | 아몬드 | Prunus dulcis in Jardins de la Fontaine in Nimes 13.jpg | 3263 | CC BY-SA 4.0 | Krzysztof Golik |
| 15 | 독당근 | Conium maculatum inflorescence (02).jpg | 3828 | CC BY-SA 2.0 fr | Marie Portas |
| 16 | 박하 | Mentha canadensis.jpg | 1663 | CC BY-SA 4.0 | Mjhuft |
| 17 | 콩꽃 | Flor de frijol (Phaseolus vulgaris) I.jpg | 7681 | CC BY-SA 4.0 | Juan Carlos Fonseca Mata |
| 18 | 아스파라거스 | Asparagus officinalis 15-p.bot-lilia.aspar-04.jpg | 3456 | CC BY-SA 4.0 | Ayotte, Gilles, 1948- |
| 19 | 치자나무 | Gardenia jasminoides flower Argentina.jpg | 4608 | CC BY-SA 4.0 | Adriel anv00 |
| 21 | 벚꽃난 | Hoya carnosa - umbel with nectar droplets.jpg | 7952 | CC BY-SA 4.0 | Franz van Duns |
| 22 | 당아욱 | Mallow January 2008-1.jpg | 3004 | CC BY-SA 3.0 | Alvesgaspar |
| 24 | 금영화 | Kaldari Eschscholzia californica 01.jpg | 2600 | CC0 | Kaldari |
| 25 | 덩굴성 식물 | Clématite montagnes FR 2013.jpg | 3368 | CC BY-SA 3.0 | JLPC |
| 27 | 칼세올라리아 | Calceolaria biflora kz01.jpg | 2815 | CC BY-SA 4.0 | Krzysztof Ziarnek, Kenraiz |
| 28 | 꽃아카시아나무 | Robinia hispida - Flickr - peganum.jpg | 4000 | CC BY-SA 2.0 | peganum from Small Dole, England |
| 29 | 우엉 | Arctium lappa - flowers.jpg | 1477 | CC BY-SA 3.0 | Bartosz Cuber |
| 30 | 금작화 | Cytisus scoparius 04.2026 (1).jpg | 8192 | CC BY-SA 4.0 | DidierFy |
| 31 | 흑종초 | Nigella damascena sl3.jpg | 4128 | CC BY-SA 4.0 | Stefan.lefnaer |

### 4월 (18일)

| 일 | 이름 | 커먼즈 파일 | 원본 폭 | 라이선스 | 저작자 |
|---|---|---|---|---|---|
| 1 | 아몬드 | Prunus dulcis in Jardins de la Fontaine in Nimes 13.jpg | 3263 | CC BY-SA 4.0 | Krzysztof Golik |
| 5 | 무화과 | 20210731 Hortus botanicus Leiden - Ficus carica.jpg | 4032 | CC BY-SA 4.0 | Rudolphous |
| 6 | 아도니스 | 側金盞花 Adonis amurensis -首爾切頭山公園 Seoul, South Korea- (33823991311).jpg | 2528 | CC BY-SA 2.0 | 阿橋 HQ |
| 7 | 공작고사리 | Adiantum pedatum (northern maidenhair fern), Willsboro, NY (32127843596).jpg | 2967 | CC BY 2.0 | Doug McGrady from Warwick, RI, USA |
| 8 | 금작화 | Cytisus scoparius 04.2026 (1).jpg | 8192 | CC BY-SA 4.0 | DidierFy |
| 10 | 빙카 | A flower of lesser periwinkle (Vinca minor) close up.jpg | 4624 | CC BY-SA 4.0 | Naturformidleren |
| 11 | 꽃고비 | Polemonium caeruleum RF.jpg | 4608 | CC BY 4.0 | Robert Flogaus-Faust |
| 12 | 복사꽃 | Alishan, Part II - Alishan5306.jpg | 4899 | CC0 | lumoplank |
| 13 | 페르시아 국화 | 2007 coreopsis tinctoria.jpg | 3008 | CC BY-SA 3.0 | Rl |
| 14 | 흰나팔꽃 | Ipomoea alba Alhambra Spain.jpg | 3083 | CC0 | Jebulon |
| 15 | 펜 오키드 | Groenknolorchis - fen orchid - Liparis loeselii 2.jpg | 2559 | CC BY 4.0 | Bouke ten Cate |
| 18 | 자운영 | Astragalus sinicus 3.JPG | 3264 | CC BY 3.0 | Dalgial |
| 20 | 배나무 | Pyrus pyrifolia (Shinko) inflorescence2.JPG | 6000 | CC BY-SA 4.0 | PumpkinSky |
| 21 | 수양버들 | Cornjum, Martenastate, (tuin) 03.jpg | 3048 | CC BY-SA 4.0 | Dominicus Johannes Bergsma |
| 23 | 도라지 | Platycodon grandiflorus (flower s2).jpg | 3840 | CC BY-SA 4.0 | Alpsdake |
| 25 | 중국 패모 | Fritillaria thunbergii.jpg | 2136 | CC BY-SA 3.0 | James Steakley |
| 26 | 논냉이 | Cardamine lyrata.jpg | 800 | CC BY 2.0 | batra3x |
| 30 | 금사슬나무 | Laburnum anagyroides Medik. Cytise - Aubour JdP.jpg | 3099 | CC0 | Jebulon |

---

## 6. 육안 검증에서 걸러낸 것들 — 이 단계를 생략하면 안 되는 이유

기계 후보 1순위를 그대로 썼다면 아래가 그대로 나갔다. 79장 전부를 눈으로 보고
**15건을 교체**했다. 종류별로 남긴다.

### (1) 종이 아예 다른 사진 — 1건, 가장 위험한 유형

- **칼미아(2/20)**: 파일 설명에 `Flowers of the Kalmia latifolia` 라고 적힌 커먼즈 파일이
  실제로는 **아래로 늘어진 줄무늬 종 모양 꽃**이었다. 칼미아는 접시·잔 모양 꽃이
  공처럼 뭉쳐 피므로 형태가 전혀 다르다(등대꽃속으로 보인다).
  → 배제하고 `Mountain Laurel in Bloom (33956585443).jpg` 로 교체.
  **파일 설명의 학명은 커먼즈에서 검증된 값이 아니다.**

### (2) 주인공이 그 꽃이 아닌 사진 — 4건

- **도라지(4/23)**: 후보 1순위가 파일명은 `Platycodon grandiflorus 4.jpg` 인데
  화면에는 **초록 잎만** 가득했다. 꽃이 한 송이도 없다.
- **흑종초(3/31)**: 풀밭 원경에 흑종초 꽃이 좁쌀만 하게 몇 개 박힌 사진.
- **야생화(2/17)**: 후보 1순위가 「Chico Wildflower Century」 — **자전거 대회 사진**이었다.
  파일명에 wildflower 가 들어갔을 뿐이다.
- **무화과(4/5)**: 철망 울타리와 주택·전선이 화면 절반을 차지.

### (3) 사람 손·인공물이 프레임에 든 사진 — 2건

- **가시(1/15)**: 개화한 블랙손 산울타리인데 **사람 둘이 걸어 들어와** 있었다.
- **어저귀(1/18)**: 꽃 옆에 **촬영자의 손가락**이 크게 들어와 있었다.
  (교체본 `Abutilon theophrasti RF.jpg` 는 손가락 없음)

### (4) 열매·마른 상태여서 그 꽃으로 안 보이는 사진 — 3건

- **부들(1/23)**: 후보가 **씨앗이 터져 솜처럼 부푼** 상태였다. 사람들이 아는 부들은
  갈색 소시지 모양이다 → 그 형태의 사진으로 교체.
- **마가목 후보**: 가을 열매·단풍 사진이 상위였다(개화 사진으로 교체).
- **아몬드 후보**: 껍질 깐 **아몬드 알맹이** 사진이 대표 이미지였다.

### (5) 어둡거나 산만해서 카드에 못 쓸 사진 — 5건

검은 포플라(어두운 수관 → 푸른 하늘 아래 노거수), 삼나무(어두운 줄기 근접 → 삼나무 숲),
월계수(원경 관목 → 개화 근접), 자운영(도시 건물 배경 → 물가 근접),
우엉·아스파라거스(잎에 파묻힌 꽃 → 꽃 근접)로 각각 교체.

---

## 7. 종을 어떻게 특정했나 — 갈린 지점만

`birth_flowers.csv` 는 학명이 있는 행이 드물다. 담당 79종 중 **학명 칸이 채워진 것은
23종뿐이고, 그중 16종은 속명만** 적혀 있다(종까지 적힌 것은 7종).
나머지 **56종은 영문 통칭 하나로 종을 특정**해야 했다. 그래서 종 특정이 곧 조사의 본체였다.
판단이 갈렸던 것만 남긴다. 나머지는 CSV의 `species_note` 에 한 줄씩 들어 있다.

### 한국명과 영문명이 서로 다른 식물을 가리키는 경우 → **한국명을 따랐다**

화면에 노출되는 것은 `name_ko` 이므로, 사용자가 읽는 이름과 사진이 어긋나면 안 된다.

| 날짜 | name_ko | CSV의 name_en | 채택 | 이유 |
|---|---|---|---|---|
| 1/21 | 담쟁이덩굴 | Ivy | *Parthenocissus tricuspidata* | 담쟁이덩굴은 포도과, 서양 Ivy(*Hedera*)는 두릅나무과. 완전히 다른 식물 |
| 2/15 | 삼나무 | Cedar | *Cryptomeria japonica* | 삼나무는 스기. Cedar(*Cedrus*)는 개잎갈나무 |
| 3/10 | 느릅나무 | Hackberry | *Ulmus davidiana* | Hackberry 는 팽나무(*Celtis*). 느릅나무는 *Ulmus* |
| 3/13 | 산옥잠화 | Day Lily | *Hosta* | 산옥잠화는 비비추속. Day Lily(원추리, *Hemerocallis*)는 별개 — 원자료 표기 오류로 판단 |

### 구학명이 적혀 있던 경우

- **2/2 모과**: `name_en` 이 `Chaenomeles` 였다. 모과나무의 옛 학명이
  *Chaenomeles sinensis* 이고 현재는 ***Pseudocydonia sinensis*** 다.
  명자나무(*Chaenomeles speciosa* 등)와 헷갈리기 쉬운 자리라 개화 사진으로 확인했다.
- **2/12 쥐꼬리망초**: 채택 파일명이 *Rostellularia procumbens* 인데 이는
  *Justicia procumbens* 의 이명이다. 파일 설명에 두 이름이 함께 적혀 있어 확인 가능.
- **3/11 씀바귀**: CSV 속명 `Ixeris` → 씀바귀는 *Ixeridium dentatum*(= *Ixeris dentata*).

### 속명만 있어 속 대표종을 골라야 했던 경우

원칙은 **한국 자생종이 있으면 그것**, 없으면 **종 라벨이 확인된 식물원 촬영본**이다.

| 이름 | CSV 값 | 채택 종 | 근거 |
|---|---|---|---|
| 노루귀 | *Hepatica* | *H. asiatica* | 한국 자생 노루귀. 서울 촬영본 |
| 아도니스 | *Adonis* | *A. amurensis* | 한국 복수초. 서울 촬영본 |
| 자운영 | *Astragalus* | *A. sinicus* | 자운영의 학명 |
| 마가목 | *Sorbus* | *S. commixta* | 한국 마가목 |
| 밤꽃 | *Castanea* | *C. crenata* | 한국·일본 밤나무 |
| 황새냉이 | *Cardamine* | *C. flexuosa* | 황새냉이의 학명 |
| 점나도나물 | *Cerastium* | *C. fontanum* | 점나도나물의 학명 |
| 수영 | *Rumex* | *R. acetosa* | 수영의 학명 |
| 범의귀 | Saxifrage | *Saxifraga fortunei* | 국내 '범의귀'가 가리키는 종이 자료마다 갈림 → 예테보리 식물원 라벨(plant id 기재)이 붙은 개체로 |
| 칼세올라리아 | *Calceolaria* | *C. biflora* | 괴팅겐 식물원 라벨 확인 |
| 산옥잠화 | (Hosta) | *H. sieboldiana* | *Hosta longissima* 사진이 커먼즈에 **한 장도 없음** → 속 대표 개화 사진 |

### 학명도 종도 특정 불가라 '총칭'으로 처리한 5건

이 5건은 애초에 종이 아니다. 사진은 **그 총칭을 대표하는 식물**로 골랐고,
`species_note` 에 총칭임을 명시했다.

| 날짜 | 이름 | 채택 | 메모 |
|---|---|---|---|
| 1/15 | 가시 (Thorn) | *Prunus spinosa* 개화 | 가시나무를 대표하는 장미과 관목 |
| 1/22, 1/29 | 이끼 (Moss) | *Polytrichum commune* 군락 | 대표 선태식물 |
| 2/5 | 양치 (Fern) | *Athyrium filix-femina* | 대표 양치식물 |
| 2/17 | 야생화 (Wild Flower) | 아고산 야생화 군락 | 루피너스·인디언페인트브러시 등 혼생 |
| 3/25 | 덩굴성 식물 (Climbing Plant) | *Clematis montana* 개화 | 대표 덩굴식물 |

### 판단이 완전히 깨끗하지 않은 2건 — 사용 전에 한 번 더 보는 게 좋다

- **1/23 부들**: CSV에 학명이 없고 `name_en` 이 `Bulrush` 다. 한국 자생 부들은
  *Typha orientalis* 지만, 커먼즈의 *T. orientalis* 사진은 대부분 **씨앗이 터진 상태**라
  '부들'로 알아보기 어려웠다. 그래서 `Bulrush` 에 해당하는 같은 속의
  ***Typha latifolia*** 갈색 이삭 사진을 채택했다. 외형이 동일한 근연종이지만
  **엄밀히는 다른 종**이다.
- **4/14 흰나팔꽃**: 학명 없음, `name_en` 은 `Morning-Glory`.
  커먼즈의 *Ipomoea nil*(나팔꽃) 사진 171장을 훑었으나 **흰 꽃 단독 사진이 없었다**.
  나팔꽃속의 백색 종인 ***Ipomoea alba*** 를 채택했다 — 흰 나팔 모양 꽃이라는
  이름의 조건은 만족하지만, 이 종은 밤에 피는 것으로 알려져 있다.
  '흰나팔꽃'이 원자료에서 무엇을 가리켰는지는 끝내 확정하지 못했다.

---

## 8. 화질·상태가 기준에 못 미치는 행

| 이름 | 날짜 | 원본 폭 | 문제 | 판단 |
|---|---|---|---|---|
| 논냉이 | 4/26 | **800px** | 1200 미달 + 비개화(테라리엄 수중잎) | **커먼즈 전체에 *Cardamine lyrata* 파일이 1장뿐.** 다른 선택지가 없어 채택. 대체 소스를 찾는다면 이 행부터 |
| 월계수 | 2/16 | 1280px | 하한 근처, 화질 평범 | 개화가 확실히 보이는 쪽을 택함 |
| 우엉 | 3/29 | 1477px | 하한 근처 | 꽃 근접컷 우선 |
| 마가목 | 1/27 | 1500px | 하한 근처 + **개체 원경** | *S. commixta* 개화 사진이 커먼즈에 이것 하나뿐 |
| 쥐꼬리망초 | 2/12 | 1536px | 하한 근처 | 화질 자체는 좋음(quality image) |

이 5건 외 74종은 원본 1600px 이상이다(중앙값 3368px, 최대 9000px).

`direct_url` 이 **원본 직링크인 것은 2종**이다 — 논냉이(원본 800px, 1280 미만)와
월계수(원본이 정확히 1280px라 썸네일을 만들 필요가 없어 API가 원본을 돌려줌).
나머지 77종은 `…/thumb/…/1280px-…` 형식이다.

---

## 9. URL 검증

`content/birth_photos.part1.csv` 의 `direct_url` **고유 79개 전수**에 대해
GET 요청을 보내 다음을 확인했다.

- HTTP 상태 **200**
- `Content-Type` 이 `image/*`
- 응답 본문 선두 바이트가 **JPEG(`FF D8 FF`) 또는 PNG(`89 50 4E 47`) 매직넘버**

결과: **79 / 79 통과** (실패 0). 검증 로그는 조사용 스크래치패드에 남겼고
저장소에는 커밋하지 않았다.

CSV 자체 검증:
- 89행 + 헤더, 재파싱 시 전 행 **10열**
- UTF-8 **BOM 없음**, **CR 0개**(LF 단독), 끝에 개행 1개
- `direct_url` 빈 행 0개, `name_ko` 고유값 79개
- 89행의 `month`/`day`/`name_ko` 가 `birth_flowers.csv` 의 미보유 89일과 **완전 일치**

---

## 10. 다음 사람에게 넘기는 판단 지점

1. **CC BY-SA 68행의 파생물 조항.** 사진 위에 문구를 얹은 카드 이미지를 만들어
   배포한다면 그 합성물에 동일 라이선스를 걸어야 한다. 그게 곤란하면
   CC BY·CC0·PD(총 15행)만 합성에 쓰고 나머지는 원본 그대로 노출하는 식으로
   나눠야 한다. **지금 CSV는 그 구분을 하지 않았다.**
2. **저작자 표기 UI.** 83/89행이 표기 의무가 있다. `author` + `license` +
   `commons_page_url` 세 값이 화면 어딘가에 함께 나가야 한다.
3. **부들·흰나팔꽃(§7 마지막)** 은 종 특정이 완전하지 않다. 원자료(순천만·로얄플라워
   표)를 다시 볼 기회가 있으면 이 두 항목부터 확인할 것.
4. **논냉이**는 커먼즈로는 더 나은 사진이 없다. 국립생물자원관·국가생물종지식정보시스템
   등 국내 공공 이미지에서 대체할 수 있는지가 남은 선택지다.
5. `direct_url` 은 위키미디어가 허용하는 **표준 썸네일 폭(1280)** 에 묶여 있다.
   화면에서 다른 폭이 필요하면 클라이언트에서 리사이즈하거나 자체 호스팅으로
   옮겨야 한다 — 커먼즈에 임의 폭을 요청하면 400이 돌아온다(§2).
