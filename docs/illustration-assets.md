# dearbloom 세밀화 애셋 — 퍼블릭 도메인 보태니컬 도판 31종

> 이야기(설화·일화) 250편에 개별 이미지를 붙이는 대신, **꽃 단위 빈티지 보태니컬 도판**을 카드·시트·레인 헤더에 얹는다.
> 원문 기획 §2.3-11 "BHL·Rawpixel 퍼블릭 도메인 세밀화" 방침의 실행 목록이며, 실사 승인 목록인 `docs/image-assets.md`와 **별개로 병행 운용**한다.
> 다크 그린(`#141613`~`#1B2C21`) 위에 크림 도판을 **액자처럼 얹는** 것이 전제다(§1.4b). 도판 배경을 누끼로 날리지 않는다 — 종이가 곧 액자다.

---

## 조사 개요

| 항목 | 내용 |
|---|---|
| 조사일 | 2026-08-15 |
| 대상 | `content/flowers.csv` 31종 전수 |
| 확보 | **31/31** (완료 기준 26종 초과 달성) |
| 호스팅 출처 | Wikimedia Commons 30종 · plantillustrations.org 1종(gerbera) |
| 검증 | 31종 전부 ① 파일 페이지 열람 ② 라이선스 템플릿 원문 확인 ③ 도판 실물 육안 확인(종·배경톤·판면 상태) ④ 직접 URL `HTTP 200` + `image/*` 응답 실측 |
| 종 정확도 | 종 일치 **21종** · 같은 속 다른 종 **9종** · 속 일치·종 미확정 **1종**(벚꽃) |
| 배경톤 | 크림·아이보리 고전 판면 **29종** · 순백 누끼 1종(ranunculus) · 우키요에 담청 1종(cherry-blossom) |

---

## 라이선스 요약

31종 전부 **퍼블릭 도메인 또는 CC0**다. 근거 유형은 네 가지다.

| 근거 | 종수 | 의미 |
|---|---|---|
| `PD-old-70` / `PD-old-100` (+ `PD-US`: 1931년 이전 간행) | 27 | 원저작자 사후 70~100년 경과. 상업적 사용 자유, 표기 의무 없음 |
| `PD-Art` (2차원 저작물의 충실한 복제는 신규 저작권을 낳지 않음) | 2 | lisianthus, magnolia |
| `PD-scan` (기계적 스캔은 신규 저작권을 낳지 않음) | (위와 중복) | BHL 경유 파일 전반 |
| `CC0 1.0` | 1 | hyacinth (Rijksmuseum) |

### 반드시 알아야 할 두 가지

**1. BHL→Flickr 경유 파일에는 `CC BY 2.0` 상자가 함께 붙어 있다.**
`Favourite flowers of garden and greenhouse`, `Wayside and woodland blossoms`, `Flora conspicua`, `American medicinal plants`, `The Botanical register`, `Curtis's botanical magazine`, `Flore médicale des Antilles` 계열(총 16종)이 해당한다. 파일 페이지에는 `CC BY 2.0` 상자와 `PD-old-70` · `PD-US` · `PD-scan` 상자가 **동시에** 표시된다.

- 실질 상태는 **퍼블릭 도메인**이다. 원저작물(1815~1912년 간행)의 저작권이 소멸했고, 스캔은 기계적 복제라 신규 권리가 생기지 않는다. `CC BY 2.0`은 BHL이 Flickr에 업로드하는 파이프라인에서 기계적으로 붙은 태그다.
- 다만 dearbloom은 **표기를 기본값으로 운용**한다(`image-assets.md` 사용 규칙 2와 동일 방침). 분쟁 여지를 0으로 만드는 가장 싼 보험이고, "야간 식물 아카이브"라는 서비스 톤에도 출처 표기가 오히려 어울린다.

**2. `upload.wikimedia.org` 원본 파일 직접 핫링크는 위키미디어가 명시적으로 만류한다.**
원본 URL을 연속 요청하면 `HTTP 429`와 함께 다음 안내가 돌아온다 — *"please contact noc@wikimedia.org to discuss a less disruptive approach or instead use thumbnail images in sizes listed on https://w.wiki/GHai"*. 대응은 아래 **배포 규칙**을 따른다.

---

## 배포 규칙 (프로덕션 필수)

1. **자체 호스팅이 정답이다 — 2026-08-15 적용 완료(31/31).** 31종은 전부 PD/CC0라 재배포에 제약이 없다. 아래 표의 URL은 **취득용 주소이자 출처 증빙**이지, 프로덕션 `<img src>`가 아니다.

   | 항목 | 현재 상태 |
   |---|---|
   | 화면이 부르는 주소 | `/plates/{flower_id}.jpg` — 우리 `public/plates/` 사본. 런타임에 위키미디어·Internet Archive를 **부르지 않는다**(gerbera 포함 31종 전부) |
   | 단일 원본 | `src/lib/plates/index.ts` — 저장 경로(`src`)와 취득 주소(`remoteSrc`)를 함께 들고 있는 **유일한** 도판 상수. 컴포넌트 폴더에 사본을 다시 만들지 않는다 |
   | 다시 받는 법 | `node scripts/fetch-plates.mjs` (`--force` 재다운로드, `--reencode` 재다운로드 없이 다시 정규화). 설명적 User-Agent + 요청 간 500ms + 실패 1회 재시도. 저장 위치는 모듈의 `src`가 정한다 |
   | 정규화 파이프라인 | **입력 바이트 → `sharp` → `.jpg` 저장.** 폭 최대 **1100px**(`withoutEnlargement` — 작은 원본은 늘리지 않는다) · 알파는 흰 배경으로 flatten · JPEG 품질 82(mozjpeg). 원본 바이트는 보관하지 않는다 — 재현성은 `remoteSrc`가 담보한다 |
   | 폭을 1100px로 정한 근거 | 도판이 가장 크게 서는 자리(도감 상세 히어로 액자)의 실표시 폭이 ~550px 이하라 **레티나 2배 = 1100px면 충분하다.** 8 MB 예산에 맞추는 방법이 둘(폭 축소 / 품질 인하)이었는데, q82를 지키고 폭을 줄이는 쪽을 택했다 — 1280px 유지 시 q72까지 내려야 하고 그건 히어로 크기에서 손실이 눈에 띈다 |
   | 확장자 | **31종 전부 `.jpg`로 통일**(2026-08-15 적용). 이름만 바꾼 게 아니라 `sharp`가 실제로 JPEG로 **다시 인코딩**하므로 파일 바이트 자체가 JPEG다 — 정적 서버의 `Content-Type: image/jpeg`가 사실과 맞는다 |
   | 용량 | 합계 **7.19 MB** · 31종 평균 238 KB · 최대 354 KB(carnation). 정규화 전 38.8 MB에서 **81% 감소**. 폭은 전부 ≤1100px 한 벌 — 화면이 폭을 갈아 끼우지 않는다 |
   | ~~남은 과제: PNG 7종~~ | **해소.** anemone·hellebore·hydrangea·ranunculus·cherry-blossom·iris·pansy 7종이 장당 2.5~4.2 MB(전체의 2/3)를 먹던 문제는 위 정규화로 사라졌다 — 7종 합계 26.3 MB → 1.7 MB. 인코더 의존성 `sharp`는 `devDependencies`이자 `scripts/fetch-plates.mjs` 전용이다(런타임·`src/lib`는 건드리지 않는다) |
   | 불변식 | `tests/components/plates.test.ts`가 지킨다 — 전 도판 `.jpg` + 실파일 각 1MB 이하. 원본 확장자 그대로 받아 두던 시절로 조용히 돌아가는 것을 막는 그물이다 |

   다운로드가 실패한 꽃이 생기면 그 종만 `src`를 `remoteSrc` 값으로 되돌려 **원격 폴백**으로 둔다(그때는 `plateSrc()`의 폭 치환이 다시 의미를 갖는다). 나머지 30종은 로컬 사본을 그대로 쓴다.
2. **부득이 핫링크한다면 원본이 아니라 표준 썸네일 폭만 쓴다.** 위키미디어가 사전 생성해 두는 폭은 `20 / 40 / 60 / 120 / 250 / 330 / 500 / 960 / 1280 / 1920 / 3840` px다. 비표준 폭(예: 1100px)을 요청하면 거절된다.
3. 아래 표의 `직접 URL`은 전부 **1280px 표준 썸네일**로 통일해 실측했다(31종 전원 `HTTP 200`). 카드용으로 충분하고, 레인 헤더·히어로가 필요하면 URL의 `1280px-`를 `1920px-`로 바꾼다 — 단 **원본 가로폭이 1920 미만인 5종**(rose-red 1479 · tulip-white 1580 · freesia 1395 · lavender 1378 · ranunculus 1891)은 확대되지 않으므로 1280이 상한이다.
4. gerbera 1종만 Commons 밖(plantillustrations.org)이다. 이 호스트는 안정성을 신뢰할 수 없으니 **반드시 자체 호스팅**한다.

---

## 채택 도판 31종

`직접 URL`은 위키미디어 표준 1280px 썸네일(gerbera만 원 사이트 풀사이즈). `해상도`는 **원본** 픽셀이다.

| flower_id | 학명(도판 기준) | 종 일치 여부 | 직접 URL | 페이지 URL | 출처 기관·작품(화가·연도) | 라이선스 확인 결과 | 해상도 | 비고 |
|---|---|---|---|---|---|---|---|---|
| `rose-red` | *Rosa gallica* Regalis | **같은 속·다른 종** (카탈로그 기준종은 *Rosa hybrida*) | `https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Redoute_-_Rosa_gallica_regalis.jpg/1280px-Redoute_-_Rosa_gallica_regalis.jpg` | https://commons.wikimedia.org/wiki/File:Redoute_-_Rosa_gallica_regalis.jpg | Pierre-Joseph Redouté, *Les Roses* (1817–1824) | `PD-old-70` — "public domain in its country of origin … author's life plus 70 years or fewer" | 1479×2118 | 연분홍 만개 로제트. **와인레드가 아니라서 §1.4b 로맨스 코드 회피에 오히려 유리.** 배경이 흰 스티플 판면이라 아래 톤 통일 필터 필수 |
| `tulip-white` | *Tulipa gesneriana* | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Gc16_tulipa_gesneriana.jpg/1280px-Gc16_tulipa_gesneriana.jpg` | https://commons.wikimedia.org/wiki/File:Gc16_tulipa_gesneriana.jpg | Hans-Simon Holtzbecker, *Gottorfer Codex* (1649–1659), 양피지 구아슈 | `PD-old-100` + `CC-PD-Mark` | 1580×2100 | 4송이 중 **왼쪽에서 두 번째가 순백** — 흰 튤립 단독 크롭 가능. 크림 벨럼 바탕이 팔레트와 최상 궁합 |
| `freesia` | *Freesia refracta* Klatt | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Freesia-J.Eudes-02.JPG/1280px-Freesia-J.Eudes-02.JPG` | https://commons.wikimedia.org/wiki/File:Freesia-J.Eudes-02.JPG | Eugène-Jules Eudes 수채, in A. Guillaumin *Les Fleurs de Jardins* t.1 (Paul Lechevalier, 1929) | `PD-old-70` — 단 **본 세트에서 가장 약한 근거**(아래 주의) | 1395×1944 | 판면에 학명·개화기(`Décembre-mars`)·휴면 구근이 함께 인쇄됨. 연노랑 파스텔이라 `gold` 테마와 맞음 |
| `lily-asiatic` | *Lilium lancifolium* (= *L. tigrinum*) | **같은 속·다른 종** (카탈로그는 *Lilium hybridum*) | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Lilium_lancifolium_in_Les_liliacees.jpg/1280px-Lilium_lancifolium_in_Les_liliacees.jpg` | https://commons.wikimedia.org/wiki/File:Lilium_lancifolium_in_Les_liliacees.jpg | Pierre-Joseph Redouté, *Les Liliacées* (1802–1816) | `PD-old-70` | 3864×5698 | 참나리는 **아시아틱 하이브리드의 실제 모종**이라 대체가 정당하다. 도판 하단 `Lilium tigrinum / Lis de Chine` 필기체 |
| `gerbera` | *Gerbera jamesonii* Bolus ex Hook.f. | 종 일치 | `https://www.plantillustrations.org/ILLUSTRATIONS_FULL_SIZE/4557.jpg` | https://www.plantillustrations.org/illustration.php?id_illustration=4557 | Matilda Smith 원화 / John Nugent Fitch 석판, *Curtis's Botanical Magazine* v.115 [ser.3 v.45] t.7087 (1889) | 원저작물 `PD-old-70`(Smith 1926년·Fitch 1927년 몰). 사이트 문구는 "All available HD illustrations belong to the public domain according to the European law…"로 **느슨함** | 2120×3526 | **거베라의 정본 도판.** Commons에 사본이 없어 유일한 비-Commons 항목. 크림 판면, 살구빛+크림 2송이. → 자체 호스팅 필수, 대안은 아래 |
| `anemone` | *Anemone coronaria* Linn. | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/WitteHeinrichFlora1868-051-Anemone_coronaria.png/1280px-WitteHeinrichFlora1868-051-Anemone_coronaria.png` | https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-051-Anemone_coronaria.png | A.J. Wendel 원화 / G. Severeyns 석판, H. Witte *Flora* Pl.51 (Groningen: Wolters, 1868) | `PD-old-70` + `CC-PD-Mark` | 3315×4643 | 적·자·백 7송이 한 다발. 판면 하단에 학명 활자 인쇄 — 아카이브 라벨 느낌이 강해 카드 하단 크롭 시 살릴 것 |
| `hellebore` | *Helleborus niger* Linn. | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/WitteHeinrichFlora1868-033-Helleborus_niger.png/1280px-WitteHeinrichFlora1868-033-Helleborus_niger.png` | https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-033-Helleborus_niger.png | A.J. Wendel / Witte *Flora* Pl.33 (1868) | `PD-old-70` | 3321×4576 | 흰~연분홍 4송이 + 짙은 잎. `dusk` 테마 대비가 잘 붙음 |
| `hyacinth` | *Hyacinthus orientalis* 'Franciscus Primus' | 종 일치(품종 특정) | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/De_blauwe_hyacint_Franciscus_Primus%2C_RP-T-1948-46.jpg/1280px-De_blauwe_hyacint_Franciscus_Primus%2C_RP-T-1948-46.jpg` | https://commons.wikimedia.org/wiki/File:De_blauwe_hyacint_Franciscus_Primus,_RP-T-1948-46.jpg | Jan Augustini 수채·구아슈 (1762), **Rijksmuseum** RP-T-1948-46 | **`CC0 1.0`** — "made available under the Creative Commons CC0 1.0 Universal Public Domain Dedication" | 3644×5870 | 세트 중 라이선스가 가장 깨끗한 1종. 연푸른 겹히아신스 단독 직립 구도 — 세로 카드에 최적 |
| `peony` | *Paeonia albiflora* (= *P. lactiflora*) | 종 일치(이명) | `https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Favourite_flowers_of_garden_and_greenhouse_%28Pl._13%29_%287789025266%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._13%29_%287789025266%29.jpg` | https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(Pl._13)_(7789025266).jpg | Edward Step / William Watson, *Favourite Flowers of Garden and Greenhouse* Pl.13 (Frederick Warne, 1896) — BHL/Missouri Botanical Garden 스캔 | `PD-old-70` + `PD-US` + `PD-scan`, **Flickr 유래 `CC BY 2.0` 병기** | 1952×3200 | 판면 활자 `WHITE PEONY (PÆONIA ALBIFLORA)`. **흰 작약이라 design-spec §1.5b `ivory` 카테고리("흰 작약 대표")와 정확히 일치** |
| `hydrangea` | *Hydrangea japonica* Sieb. var. *versicolor* | **같은 종군·변종 다름** (현행 분류상 *H. macrophylla* 계열) | `https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/WitteHeinrichFlora1868-060-Hydrangea_macrophylla.png/1280px-WitteHeinrichFlora1868-060-Hydrangea_macrophylla.png` | https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-060-Hydrangea_macrophylla.png | A.J. Wendel / Witte *Flora* Pl.60 (1868) | `PD-old-70` | 3259×4649 | **국내 절화로 도는 둥근 겹꽃(마리)이 아니라 레이스캡형 복색종**이다. 붉은 얼룩 무늬가 강해 CSV의 대표색(`blue`·`purple`)과 어긋남 — 파랑 수국이 필요하면 별도 확보 필요 |
| `lavender` | *Lavandula officinalis* Chaix (= *L. angustifolia*) | 종 일치(이명) | `https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Illustration_Lavandula_angustifolia0.jpg/1280px-Illustration_Lavandula_angustifolia0.jpg` | https://commons.wikimedia.org/wiki/File:Illustration_Lavandula_angustifolia0.jpg | Otto Wilhelm Thomé, *Flora von Deutschland, Österreich und der Schweiz* (Gera, 1885) | `PD-old-70` ("The author died in 1925…") + `PD-US` | 1378×2360 | 꽃·수술·씨 해부도 8점이 함께 있는 **도감형 판면**. 다른 30종(관상형 도판)보다 학술적 인상이 강함 — 카드보다 레인 헤더·배경 워터마크에 적합 |
| `sunflower` | *Helianthus annuus* Linn. | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/American_medicinal_plants_%28Plate_83%29_%286025414321%29.jpg/1280px-American_medicinal_plants_%28Plate_83%29_%286025414321%29.jpg` | https://commons.wikimedia.org/wiki/File:American_medicinal_plants_(Plate_83)_(6025414321).jpg | Charles Frederick Millspaugh, *American Medicinal Plants* Pl.83 (1887) — BHL 스캔 | `PD-old-70` + `PD-US` + `PD-scan`, **`CC BY 2.0` 병기** | 2143×3064 | **왼쪽 반은 채색·오른쪽 반은 선묘**인 독특한 구성. CSV editorial_note의 "ASPCA는 *H. angustifolius* 기준" 종 불일치 이슈와 무관하게, 이 도판은 *H. annuus* 정확 일치 |
| `carnation` | *Dianthus caryophyllus* | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Favourite_flowers_of_garden_and_greenhouse_%28Pl._36%29_%287789066486%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._36%29_%287789066486%29.jpg` | https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(Pl._36)_(7789066486).jpg | Edward Step, *Favourite Flowers* Pl.36 (1896) | `PD-old-70` + `PD-US` + `PD-scan`, **`CC BY 2.0` 병기** | 2024×3156 | 판면 활자 `CARNATION (DIANTHUS CARYOPHYLLUS)`. **단색 4송이 + 복색(줄무늬) 2송이가 한 판에** 있어, CSV가 2026-08-15에 추가한 `variegated`(거절 꽃말) 노출에도 그대로 쓸 수 있다 |
| `lisianthus` | *Eustoma exaltatum* subsp. *russellianum* (= *E. grandiflorum*) | 종 일치(이명) | `https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Eustoma_exaltatum_subsp._russellianum_%28Lisianthius_russellianus%29_Bot._Mag._65._3626._1838.jpg/1280px-Eustoma_exaltatum_subsp._russellianum_%28Lisianthius_russellianus%29_Bot._Mag._65._3626._1838.jpg` | https://commons.wikimedia.org/wiki/File:Eustoma_exaltatum_subsp._russellianum_(Lisianthius_russellianus)_Bot._Mag._65._3626._1838.jpg | Walter Hood Fitch 원화, *Curtis's Botanical Magazine* v.65 **t.3626** (1838) | `PD-Art` (`PD-old-70`) + `CC-PD-Mark` | 3306×3868 | 리시안셔스의 **정본 도판**(t.3627은 선인장이니 혼동 금지). 자주빛 대형 꽃 4송이. ⚠ 상단 1/3에 **가로 접힘선**과 상단 여백 얼룩 — 리터치 후 사용. 가로세로비 0.85로 세트 중 가장 정방형에 가까움 |
| `ranunculus` | *Ranunculus asiaticus* | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Ranunculus_asiaticus-Favourite_Flowers_Garden_Greenhouse-1-0030-6.png/1280px-Ranunculus_asiaticus-Favourite_Flowers_Garden_Greenhouse-1-0030-6.png` | https://commons.wikimedia.org/wiki/File:Ranunculus_asiaticus-Favourite_Flowers_Garden_Greenhouse-1-0030-6.png | Edward Step, *Favourite Flowers* Pl.6 (1896) — 배경 마스킹 복원본 | `PD-old-70` + `PD-US` | 1891×2888 | ⚠ **세트에서 유일하게 종이 질감이 제거된 순백 누끼**다. 다른 도판과 나란히 놓으면 배경톤이 튄다 — 크림 백플레이트를 깔거나, 원 판면이 필요하면 `Gc19 ranunculus asiaticus.jpg`(Gottorfer Codex, 1637×2156)로 교체 |
| `lily-of-the-valley` | *Convallaria majalis* | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Convallaria_majalis_in_Les_liliacees.jpg/1280px-Convallaria_majalis_in_Les_liliacees.jpg` | https://commons.wikimedia.org/wiki/File:Convallaria_majalis_in_Les_liliacees.jpg | Pierre-Joseph Redouté, *Les Liliacées* (1802–1816) | `PD-old-70` | 3874×5796 | 뿌리까지 그린 전초 구도, 크림 바탕. 세트 최고 수준의 여백감 — 히어로·챕터 전환면 후보 |
| `chrysanthemum` | *Chrysanthemum* × *morifolium* | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flora_conspicua_%28Pl._51%29_%286046903472%29.jpg/1280px-Flora_conspicua_%28Pl._51%29_%286046903472%29.jpg` | https://commons.wikimedia.org/wiki/File:Flora_conspicua_(Pl._51)_(6046903472).jpg | William Clark 원화·판각 / Richard Morris, *Flora Conspicua* Pl.51 (London: Longman, 1826) | `PD-US`(1931년 이전 간행), **`CC BY 2.0` 병기** | 2003×3452 | 진분홍 대륜 1송이. 한국 상례 맥락(흰 국화)과 색이 다르니, **장례 맥락 이야기에는 쓰지 말 것** — 해당 이야기는 텍스트만 노출하거나 별도 흰 국화 도판 확보 |
| `narcissus` | *Narcissus pseudonarcissus* L. | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Narcissus_pseudonarcissus_-_Les_liliac%C3%A9es%2C_vol._3_-_t._158.jpg/1280px-Narcissus_pseudonarcissus_-_Les_liliac%C3%A9es%2C_vol._3_-_t._158.jpg` | https://commons.wikimedia.org/wiki/File:Narcissus_pseudonarcissus_-_Les_liliacées,_vol._3_-_t._158.jpg | Pierre-Joseph Redouté, *Les Liliacées* v.3 t.158 (1802) | `PD-old-70` | 4431×6652 | ⚠ 스캔 **오른쪽 가장자리에 책 여백의 어두운 띠** — 좌측 88% 크롭 필요. CSV가 한 id로 묶은 두 계열 중 **나팔수선화(*N. pseudonarcissus*) 쪽**이다. 김정희 이야기의 *N. tazetta*와는 종이 다르므로 해당 이야기 행에는 부적합 |
| `forget-me-not` | *Myosotis alpestris* | **같은 속·다른 종** (카탈로그는 *M. sylvatica*) | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Favourite_flowers_of_garden_and_greenhouse_%2810593688896%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810593688896%29.jpg` | https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10593688896).jpg | Edward Step, *Favourite Flowers* Pl.194 (1897) | `PD-old-70` + `PD-US` + `PD-scan`, **`CC BY 2.0` 병기** | 2002×3200 | 판면 활자 `ALPINE FORGET-ME-NOT (MYOSOTIS ALPESTRIS)`. *M. alpestris*와 *M. sylvatica*는 같은 원예 물망초군이라 외형 차이가 거의 없다. Commons에 *M. sylvatica* 채색 도판은 없음 |
| `cherry-blossom` | 櫻(사쿠라) — *Prunus* sp. | **같은 속·종 미확정** (카탈로그는 *P. serrulata*) | `https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Bairei_kach%C5%8D_gafu%2C_Spring_08%2C_cherry_blossoms_and_gulls.jpg/1280px-Bairei_kach%C5%8D_gafu%2C_Spring_08%2C_cherry_blossoms_and_gulls.jpg` | https://commons.wikimedia.org/wiki/File:Bairei_kachō_gafu,_Spring_08,_cherry_blossoms_and_gulls.jpg | 河野楳嶺 Kōno Bairei (1844–1895), *楳嶺花鳥画譜* 봄 8 (메이지 16년=1883) — 국립국회도서관 소장 | `PD-old-100-expired` + `PD-Japan` + `PD-US` + `CC-PD-Mark` | 3261×4897 | ⚠ **세트에서 가장 이질적인 1종.** 우키요에 화조화라 갈매기·물·담청 하늘·붉은 제자(題字)·테두리 문양이 함께 들어 있다. 서양 도감 30종과 화풍이 완전히 다르다. **Advisor 판단 필요** — 대안 2안은 아래 |
| `camellia` | *Camellia japonica* | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/The_Botanical_register_%28Plate_22%29_BHL8339.jpg/1280px-The_Botanical_register_%28Plate_22%29_BHL8339.jpg` | https://commons.wikimedia.org/wiki/File:The_Botanical_register_(Plate_22)_BHL8339.jpg | Sydenham Edwards 원화 / James Ridgway 간, *The Botanical Register* Pl.22 (1815) | `PD-old-70` + `PD-US` + `PD-scan`, **`CC BY 2.0` 병기** | 3018×4885 | 백~연분홍 겹동백 1송이 + 짙은 잎. ⚠ 판면 뒤로 **원서 활자가 비쳐 보임**(`CAMELLIA japonica … or Japan rose`) — 종 확인에는 유리하나 카드에서는 대비를 낮춰 눌러야 함 |
| `violet` | *Viola odorata* var. *parmensis* | 종 일치(변종) | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Favourite_flowers_of_garden_and_greenhouse_%28Pl._32%29_%287789059768%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._32%29_%287789059768%29.jpg` | https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(Pl._32)_(7789059768).jpg | Edward Step, *Favourite Flowers* Pl.32 (1896) | `PD-old-70` + `PD-US` + `PD-scan`, **`CC BY 2.0` 병기** | 1972×3072 | 판면 활자 `PARMA VIOLET (VIOLA ODORATA — var. parmensis)`. 겹꽃 파르마 제비꽃이라 홑꽃보다 화려하다. CSV가 밝힌 한국 자생 *V. mandshurica*와는 별개 |
| `iris` | *Iris xiphium* Linn. | **같은 속·다른 종** (카탈로그는 *I.* × *hollandica*) | `https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/WitteHeinrichFlora1868-049-Iris_xiphium.png/1280px-WitteHeinrichFlora1868-049-Iris_xiphium.png` | https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-049-Iris_xiphium.png | A.J. Wendel / Witte *Flora* Pl.49 (1868) | `PD-old-70` | 2502×3526 | ***I. xiphium*은 더치 아이리스(*I.* × *hollandica*)의 주 모종**이라 대체가 정당하다. 보라·황백·청자 5송이가 한 판에 있어 CSV의 색 선택 UI(`purple`·`blue`·`white`·`yellow`)를 한 장으로 커버 |
| `marigold` | *Tagetes erecta* | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Favourite_flowers_of_garden_and_greenhouse_%2810575191053%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810575191053%29.jpg` | https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10575191053).jpg | Edward Step, *Favourite Flowers* Pl.144 (1897) | `PD-old-70` + `PD-US` + `PD-scan`, **`CC BY 2.0` 병기** | 1987×3200 | 판면 활자 `AFRICAN MARIGOLD (TAGETES ERECTA)`. **CSV editorial_note가 지적한 ASPCA 종 불일치(Calendula) 문제와 달리, 이 도판은 *Tagetes erecta* 정확 일치** — 이미지 쪽에서는 종 문제가 없다 |
| `corn-poppy` | *Papaver rhoeas* | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Wayside_and_woodland_blossoms_%28Pl._61%29_%288747771268%29.jpg/1280px-Wayside_and_woodland_blossoms_%28Pl._61%29_%288747771268%29.jpg` | https://commons.wikimedia.org/wiki/File:Wayside_and_woodland_blossoms_(Pl._61)_(8747771268).jpg | Edward Step, *Wayside and Woodland Blossoms* Pl.61 (1895) | `PD-old-70` + `PD-US` + `PD-scan` + `CC-PD-Mark` | 2020×2996 | 판면 활자 `Red Poppy. Papaver rhoeas.` 단정한 1송이 구도에 여백이 넓어 카드 하단 텍스트 배치가 쉽다. 아편 양귀비와 혼동될 소지가 없는 전형적 개양귀비 형태 |
| `jasmine` | *Mogorium sambac* (= *Jasminum sambac*) | 종 일치(이명) | `https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Flore_m%C3%A9dicale_des_Antilles%2C_ou%2C_Trait%C3%A9_des_plantes_usuelles_%2810421471426%29.jpg/1280px-Flore_m%C3%A9dicale_des_Antilles%2C_ou%2C_Trait%C3%A9_des_plantes_usuelles_%2810421471426%29.jpg` | https://commons.wikimedia.org/wiki/File:Flore_médicale_des_Antilles,_ou,_Traité_des_plantes_usuelles_(10421471426).jpg | J. Théodore Descourtilz 원화 / Gabriel 판각, *Flore médicale des Antilles* v.6 **Pl.447** (Paris: Pichard, 1828) | `PD-old-70` + `PD-US` + `PD-scan`, **`CC BY 2.0` 병기** | 1571×2583 | 판면 활자 `MOGORI SAMBAC`(= *J. sambac* 이명). 꽃 해부도·씨 포함. `Category:Jasminum sambac - botanical illustrations`에 파일이 11개뿐인 희소 영역에서 최선 |
| `babys-breath` | *Gypsophila elegans* | **같은 속·다른 종** (절화 주력은 *G. paniculata*) | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Favourite_flowers_of_garden_and_greenhouse_%28Pl._34%29_%287789063128%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%28Pl._34%29_%287789063128%29.jpg` | https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(Pl._34)_(7789063128).jpg | Edward Step, *Favourite Flowers* Pl.34 (1896) | `PD-old-70` + `PD-US` + `PD-scan`, **`CC BY 2.0` 병기** | 1972×3189 | **CSV의 `pet_safety` 근거(ASPCA Baby's Breath)도 동일하게 *G. elegans*다** — 데이터와 이미지가 같은 종 불일치를 공유하므로 표기 일관성은 유지된다 |
| `cosmos` | *Cosmos bipinnatus* | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Favourite_flowers_of_garden_and_greenhouse_%2810575182183%29.jpg/1280px-Favourite_flowers_of_garden_and_greenhouse_%2810575182183%29.jpg` | https://commons.wikimedia.org/wiki/File:Favourite_flowers_of_garden_and_greenhouse_(10575182183).jpg | Edward Step, *Favourite Flowers* Pl.142 (1897) | `PD-old-70` + `PD-US` + `PD-scan`, **`CC BY 2.0` 병기** | 1987×3200 | 판면 활자 `COSMOS BIPINNATUS`. 연분홍~살구빛 3송이 + 씨·통상화 해부도 |
| `magnolia` | *Magnolia kobus* | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Magnolia_kobus_138-8428.jpg/1280px-Magnolia_kobus_138-8428.jpg` | https://commons.wikimedia.org/wiki/File:Magnolia_kobus_138-8428.jpg | Matilda Smith 원화 / John Nugent Fitch 석판, *Curtis's Botanical Magazine* v.138 [ser.4 v.8] **t.8428** (1912) | `PD-Art` (`PD-old-70`) + `CC-PD-Mark` | 2204×3517 | **CSV 기준종(한라산 자생 *M. kobus*)과 정확히 일치**한다. 중국 원산 백목련(*M. denudata*)이 아니다 — 카탈로그가 애써 구분한 지점을 이미지도 지킨다. 크림 바탕에 흰 꽃이라 다크 배경에서 특히 잘 뜬다 |
| `pansy` | *Viola tricolor* Linn. var. *grandiflora* | **같은 속·다른 종** (카탈로그는 *V.* × *wittrockiana*) | `https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/WitteHeinrichFlora1868-069-Viola_tricolor.png/1280px-WitteHeinrichFlora1868-069-Viola_tricolor.png` | https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-069-Viola_tricolor.png | A.J. Wendel / Witte *Flora* Pl.69 (1868) | `PD-old-70` | 3218×4627 | ***V. tricolor* var. *grandiflora*는 현대 팬지(*V.* × *wittrockiana*)의 직계 모종**이다. 자·황·적갈 9송이 대군락 구도라 정보량이 가장 많은 판 |
| `poinsettia` | *Euphorbia pulcherrima* | 종 일치 | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Curtis%27s_botanical_magazine_%28Plate_3493%29_%288043241073%29.jpg/1280px-Curtis%27s_botanical_magazine_%28Plate_3493%29_%288043241073%29.jpg` | https://commons.wikimedia.org/wiki/File:Curtis%27s_botanical_magazine_(Plate_3493)_(8043241073).jpg | *Curtis's Botanical Magazine* v.63 **Pl.3493** (1836) — Royal Botanic Gardens Kew / BHL | `PD-US`(1931년 이전 간행), **`CC BY 2.0` 병기** | 2077×**1696** | ⚠ **세트에서 유일한 가로 판면**이다. 세로 카드 그리드에 넣으려면 별도 처리 필요(1:1 크롭 또는 가로 전용 슬롯). 붉은 포엽이 화면을 채워, CSV가 강조한 "포엽은 꽃잎이 아니다"를 시각적으로 보여주기 좋음 |

---

## 사용 규칙 — 다크 그린 위에 크림 도판을 얹는 법

**1. 종이를 지우지 말고 액자로 만든다.** 도판 배경을 누끼로 날리면 19세기 판면 특유의 질감과 활자 라벨이 사라져 그냥 "꽃 클립아트"가 된다. 대신 크림 판면을 그대로 둔 채 **파스파르투(passe-partout) 카드**로 감싼다 — 잉크 베이스(`#0B0C0A`) 위에 아이보리 매트를 8~12px 두르고, 그 안쪽 경계에 골드(`#C8963E`) 1px 헤어라인을 넣은 뒤, 카드 전체에 아주 옅은 외부 그림자(`0 12px 32px rgba(0,0,0,.45)`)를 주면 어두운 방에 걸린 표본 액자처럼 읽힌다. 판면 하단의 인쇄 학명(`ANEMONE CORONARIA LINN.` 등)은 **자르지 말고 살린다.** 그게 "야간 식물 아카이브"라는 톤의 근거이자, 종 표기를 겸하는 무료 캡션이다. **2. 서로 다른 출처의 종이색을 하나로 수렴시킨다.** 31종은 1613~1929년 사이 8개 이상의 판본에서 왔고 종이 흰색이 제각각이다(레두테의 밝은 스티플 판면, 비테의 짙게 바랜 크림, 스텝의 중간 톤, 라넌큘러스의 순백 누끼). 공통 필터 `sepia(.12) saturate(.92) contrast(1.04) brightness(.98)` 한 겹과, 아이보리 토큰을 `mix-blend-mode: multiply`로 5~8% 덮는 오버레이 한 겹을 **전 애셋에 동일하게** 적용해 종이 톤을 통일한다. 예외 2종은 개별 처리한다 — `ranunculus`(순백 누끼)와 `poinsettia`(가로 판면)는 크림 백플레이트를 깔아 다른 판면과 같은 바탕을 만들고, `cherry-blossom`(우키요에)은 담청 하늘 탓에 필터만으로는 수렴되지 않으니 채도를 더 낮추거나 아래 대안으로 교체한다. **3. 도판 위에 본문 텍스트를 올리지 않는다.** 실사(`image-assets.md`)와 달리 이 도판들은 밝은 바탕이라 아이보리 타이포가 완전히 죽는다. 텍스트는 카드 **바깥**(아래 또는 옆)에 배치하고, 부득이 겹칠 때만 잉크 색(`#141613`) 타이포를 쓴다. **4. 표기는 `Plate: {작품명}, {연도} / {소장·제공 기관}` 형식으로 통일**하고 푸터 "Image credits" 블록에 일괄한다(예: `Plate: Witte, Flora, 1868 / Biodiversity Heritage Library`). PD라 의무는 아니지만 `CC BY 2.0` 병기 이슈를 한 번에 덮는다.

---

## 미확보·타협 내역

완료 기준(26종)은 넘겼으나, 아래 항목은 **Advisor 판단이 필요하거나 후속 교체 대상**이다.

### A. 판단이 필요한 1종 — `cherry-blossom`

*Prunus serrulata*로 라벨링된 **퍼블릭 도메인 채색 도판은 Commons에 존재하지 않는다.** `Category:Prunus serrulata - botanical illustrations`에는 파일이 1개뿐이고 그것도 6종이 섞인 나투랄리스 다종 스케치다. 지볼트 *Flora Japonica*에도 *serrulata*/*pseudo-cerasus* 판이 없다. 선택지는 둘이다.

| 안 | 도판 | 장점 | 단점 |
|---|---|---|---|
| **A안 (표에 채택)** | 河野楳嶺 *楳嶺花鳥画譜* 봄 8, 1883 (3261×4897) | 실제 벚꽃이 맞다. 고해상·PD 확실. 동아시아 문화 맥락에 정합 | 우키요에 화조화 — 새·물·담청 하늘·테두리 문양. 나머지 30종과 화풍이 완전히 다름 |
| **B안 (대안)** | A.J. Wendel / Witte *Flora* Pl.14 `AMYGDALUS NANA LINN. FLORE PLENA` (*Prunus tenella*) — 3461×4698 — `https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/WitteHeinrichFlora1868-014-Prunus_japonica.png/1280px-WitteHeinrichFlora1868-014-Prunus_japonica.png` · https://commons.wikimedia.org/wiki/File:WitteHeinrichFlora1868-014-Prunus_japonica.png | 비테 세트(anemone·hellebore·hydrangea·iris·pansy와 동일 판본)라 **시각적으로 완벽히 일관**. 겹분홍 꽃가지가 겹벚꽃과 사실상 구분되지 않음 | 벚나무가 아니라 **애기복사(*Prunus tenella*, 구명 *Amygdalus nana*)**. 같은 *Prunus* 속이지만 벚꽃은 아님. 판면 활자에 `AMYGDALUS NANA`라고 인쇄돼 있어 라벨을 살리면 들통남 |

> 권고: **이야기 카드에는 A안**(벚꽃 설화의 주인공은 벚꽃이어야 한다), **레인 헤더·배경 장식처럼 종 표기가 없는 자리에는 B안**을 쓰는 이원 운용. 다만 이건 설계 결정이므로 Advisor가 확정할 것. 어느 쪽이든 UI 라벨은 `벚꽃 / Japanese flowering cherry (*Prunus* sp.)`처럼 종을 단정하지 않는 게 안전하다.

### B. 호스팅이 불안한 1종 — `gerbera`

정본(Curtis t.7087)이 **Commons에 없다.** plantillustrations.org가 유일하게 접근 가능한 고해상 출처인데, 라이선스 문구가 사이트 전역 안내문 한 줄("…belong to the public domain according to the European law and may be reused under the Creative Commons License")뿐이라 파일 단위 근거가 없다. 원저작물 자체는 PD가 확실하다(Matilda Smith 1926년 몰, J.N. Fitch 1927년 몰 — 사후 70년 경과).

- **필수 조치**: 자체 호스팅. 런타임에 이 도메인을 부르지 않는다.
- **대안 1 (동일 스캔, 더 튼튼한 호스트)**: Internet Archive — `https://archive.org/details/mobot31753002721907/page/n169/mode/1up`, 직접 URL `https://archive.org/download/mobot31753002721907/page/n169_w1800.jpg` (2120×3526, 동일 해상도). 단 IA 메타데이터는 `permission to digitize granted by rights holder`라 명시적 PD 마크가 아니다 — 실질 근거는 위와 같은 `PD-old-70`.
- **대안 2 (Commons 호스팅·핫링크 즉시 가능)**: Henry Moon, *Hybrid Gerbera* 크로모리소그래프, 1903 — `https://upload.wikimedia.org/wikipedia/commons/e/e2/Henry_Moon_Hybrid_Gerbera_Chromolithograph_1903.png` · https://commons.wikimedia.org/wiki/File:Henry_Moon_Hybrid_Gerbera_Chromolithograph_1903.png — 1128×1600, `PD-old-70`(Moon 1905년 몰) + `PD US expired`. 적·분홍·노랑·살구 5송이라 CSV의 넓은 `colors`를 한 장으로 커버하는 장점. 단점은 ① 종이 *G. jamesonii*가 아니라 원예 잡종 ② 출처 크레딧이 eBay 판매 목록이라 provenance가 약함 ③ 바탕이 회백색에 갈변 얼룩.
- **최선책**: Curtis t.7087은 PD가 확실하므로 **우리가 Commons에 직접 업로드**하면 이 문제가 영구히 사라진다. 후속 과제로 남긴다.

### C. 라이선스 근거를 재확인할 1종 — `freesia`

Commons 파일 페이지가 `PD-old-70`을 걸었지만 **작가 Eugène-Jules Eudes의 몰년이 페이지에 기재돼 있지 않다.** 파일이 `PD-old missing SDC copyright status` 유지보수 카테고리에 들어 있고, 날짜 필드도 `before 1929`라는 추정값이다. 출처 도서는 1929년 간행이라 `PD-US`(1931년 이전)는 확실하지만, 원 저작권국(프랑스) 기준은 몰년에 달려 있다.

- 세트에서 **유일하게 근거가 완결되지 않은 항목**이다. 상업 배포 전 몰년 1차 확인 권장.
- 대안: `Boddington's quality bulbs, seeds and plants (Page 10) BHL45196095.jpg` (2250×3396, 1904년 종묘 카탈로그, BHL) — 연도가 낮아 PD가 더 확실하나 도판이 아니라 카탈로그 지면이라 격이 떨어짐.

### D. 종이 정확히 일치하지 않는 9종 (표에 명시, 대체 근거 있음)

| flower_id | 도판 종 | 카탈로그 종 | 대체가 정당한 이유 |
|---|---|---|---|
| `rose-red` | *Rosa gallica* | *Rosa hybrida* | *R. gallica*는 현대 원예장미의 원종 계열 |
| `lily-asiatic` | *L. lancifolium* | *Lilium hybridum* | 참나리는 아시아틱 하이브리드의 실제 모종 |
| `hydrangea` | *H. japonica* var. *versicolor* | *H. macrophylla* | 같은 종군의 역사적 이명·변종. 단 **꽃 형태(레이스캡)와 색이 다름 — 이 중 가장 타협이 큼** |
| `forget-me-not` | *M. alpestris* | *M. sylvatica* | 같은 원예 물망초군, 외형 차 미미 |
| `cherry-blossom` | *Prunus* sp. | *P. serrulata* | 위 A 참조 |
| `iris` | *I. xiphium* | *I.* × *hollandica* | *I. xiphium*이 더치 아이리스의 주 모종 |
| `babys-breath` | *G. elegans* | *G. paniculata* | CSV의 `pet_safety` 근거와 동일한 종 불일치 — 일관됨 |
| `pansy` | *V. tricolor* var. *grandiflora* | *V.* × *wittrockiana* | 현대 팬지의 직계 모종 |
| `violet` | *V. odorata* var. *parmensis* | *V. odorata* | 같은 종의 변종(겹꽃) — 실질 일치 |

### E. 판면 결함이 있어 리터치가 필요한 4종

| flower_id | 결함 | 조치 |
|---|---|---|
| `lisianthus` | 상단 1/3 가로 접힘선, 상단 여백 얼룩 | 힐링 브러시 1회 |
| `narcissus` | 우측 가장자리 책 여백 암부 | 좌측 88% 크롭 |
| `camellia` | 원서 활자 비침 | 대비 낮춰 눌러 사용(또는 그대로 살려 아카이브 질감으로) |
| `corn-poppy` | 없음(양호) — 참고: `A curious herbal` Pl.2(Blackwell 1737, 3910×5950)는 더 고해상이나 책 여백·제본부가 크게 잡힘 | 현행 유지 |

---

## 검토했으나 제외한 것

| 대상 | 제외 사유 |
|---|---|
| `Arabian Jasmine … Wellcome V0042672.jpg` (3091×2508, *Hortus Malabaricus*) | **CC BY 4.0 — PD 아님.** PD/CC0 한정 기준 위반 |
| `Ethel May Dixie - Gerbera jamesonii.jpg` | 작가 1973년 몰 → `PD-old-70` 미적용(2044년까지). Commons 태그가 부정확. **라이선스 리스크** |
| `Jacopo Ligozzi Tulipa Gesneriana.jpg`, `The botanic garden (Plate 2) - Helleborus niger.jpg` 등 | 업로더가 건 `CC BY-SA 4.0` — PD/CC0 한정 기준 위반 |
| Rawpixel 계열 `Illustration from Medical Botany, digitally enhanced from rawpixel's own original plates 12.jpg` | Rawpixel이 "digitally enhanced"를 근거로 `CC BY-SA 4.0` 주장. 원판은 PD지만 파일 단위 태그가 PD가 아니라 제외 |
| `Sambak lesmin Alpin 1735.png` (재스민, 3367×4297) | PD·정확한 종이나 **무채색 선각(線刻)** — 크림 채색 판면 기준 미달 |
| `Jasminum sambac Blanco1.6.jpg` (2099×1417) | PD이나 **가로 판면 + 2종 병기 + 순백 바탕 + 도서관 스탬프 2개** — Descourtilz판에 전면 열세 |
| Köhler *Medizinal-Pflanzen* 계열 (라벤더 등) | Commons 업로드본 다수가 438×597 — **800px 기준 미달** |
| `Plate 13 Papaver rhoeas Conversations on Botany`, NYPL `Rosa Gallica … .tiff`, Cleveland Museum Redouté 장미 3점 | 전부 **TIFF**. 브라우저 직접 렌더 불가 — 자체 호스팅 시 변환하면 사용 가능한 예비군 |
| `Curtis's botanical magazine` t.3627 | 리시안셔스가 아니라 **선인장(*Echinopsis eyriesii*)**. t.3626과 혼동 주의 |
| Gerbera 사진 다수 (`Gerbera jamesonii 1DS-II …` 등) | 실사 사진 + `CC BY-SA` — 본 문서는 세밀화 전용 |
| `The Metropolitan Museum of Art` 정물화류 | 회화 — 보태니컬 도판 아님 |

---

## 출처 분포

**호스팅 기준**

| 호스트 | 종수 |
|---|---|
| Wikimedia Commons | 30 |
| plantillustrations.org | 1 (`gerbera`) |

**원 작품 기준** — 31종이 14개 판본에서 왔고, 상위 4개 판본이 21종(68%)을 덮는다. 이 4개를 우선 쓰면 세트 일관성이 자연스럽게 확보된다.

| 작품 (화가, 연도) | 종수 | 해당 flower_id |
|---|---|---|
| *Favourite Flowers of Garden and Greenhouse* (Edward Step / Warne, 1896–97) | **8** | peony, carnation, ranunculus, forget-me-not, violet, marigold, babys-breath, cosmos |
| Witte *Flora* (A.J. Wendel 원화 / G. Severeyns 석판, 1868) | **5** | anemone, hellebore, hydrangea, iris, pansy (+ cherry-blossom B안) |
| Redouté *Les Liliacées* / *Les Roses* (1802–1824) | **4** | rose-red, lily-asiatic, lily-of-the-valley, narcissus |
| *Curtis's Botanical Magazine* (1836–1912) | **4** | gerbera(t.7087), lisianthus(t.3626), magnolia(t.8428), poinsettia(Pl.3493) |
| *The Botanical Register* (S. Edwards, 1815) | 1 | camellia |
| *Flora Conspicua* (W. Clark / R. Morris, 1826) | 1 | chrysanthemum |
| *American Medicinal Plants* (Millspaugh, 1887) | 1 | sunflower |
| *Wayside and Woodland Blossoms* (Edward Step, 1895) | 1 | corn-poppy |
| *Flore médicale des Antilles* (Descourtilz, 1828) | 1 | jasmine |
| *Gottorfer Codex* (Holtzbecker, 1649–59) | 1 | tulip-white |
| Rijksmuseum 소장 수채 (Jan Augustini, 1762) | 1 | hyacinth |
| *Flora von Deutschland* (O.W. Thomé, 1885) | 1 | lavender |
| *Les Fleurs de Jardins* (E.-J. Eudes, 1929) | 1 | freesia |
| *楳嶺花鳥画譜* (河野楳嶺, 1883) | 1 | cherry-blossom |

**원자료 제공 기관** — Biodiversity Heritage Library / Missouri Botanical Garden(15) · Internet Archive(6) · Royal Botanic Gardens Kew(4) · Statens Museum for Kunst(1) · Rijksmuseum(1) · 国立国会図書館(1) · 기타(3)
</content>
