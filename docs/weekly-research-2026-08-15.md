# 주간 콘텐츠 리서치 기록 (weekly-research, 2026-08-15)

꽃 17종 → **21종**으로 늘리며 실제로 확인한 자료, 판단 근거, 채택·제외 판단을 남긴다.
`docs/story-research.md`(설화)·`docs/meanings-research.md`(꽃말)·`docs/catalog-expansion-research.md`(seed-v3)의
후속 문서이며, **이번 확장분(weekly-research)의 단일 원본**이다.

수집 방향은 design-spec §1.5f(문화권 무제한·재미 우선)와 §1.5d(이야기 톤)를 따랐다.

---

## 0. 결과 요약

| 파일 | 이전 | 이후 | 증가 |
|---|---|---|---|
| `flowers.csv` | 17 | **21** | +4 |
| `meanings.csv` | 86 | **100** | +14 |
| `stories.csv` | 89 | **104** | +15 |
| `pet_safety.csv` | 34 | **42** | +8 |

신규 4종: `iris`(아이리스) `poppy`(개양귀비) `camellia`(동백꽃) `magnolia`(목련).
해외 설화 비중을 의식해 그리스·프랑스·일본·중국·미국을 고루 섞었고, 넷 다 국내 절화·정원수로도
실제로 유통되는 꽃이다.

---

## 1. ⚠️ 이번 조사의 방법론적 제약 — WebFetch 차단

**이번 조사 세션에서는 `WebFetch` 도구가 en.wikipedia.org·ko.wikipedia.org·ja.wikipedia.org·
aspca.org·plants.ces.ncsu.edu·gutenberg.org·archive.org 등 사실상 모든 외부 도메인에 대해
`EGRESS_BLOCKED`(네트워크 egress 프록시 403)로 막혀 있었다.** 메인 세션과 리서치를 나눠 맡은
서브에이전트 4개 모두, 그리고 `example.com` 같은 무관한 도메인으로도 동일하게 확인했다 —
세션 환경의 정책적 차단이지 특정 사이트 문제가 아니다.

- 이전 조사(`docs/catalog-expansion-research.md` 등)는 URL을 직접 열어(`WebFetch`) 본문을
  확인하는 것을 원칙으로 삼았다. 이번 조사는 그 경로가 막혀, **`WebSearch`(별도 백엔드 경유,
  차단 영향을 받지 않음)가 돌려주는 실제 페이지 스니펫을 근거로 삼는 방식으로 대체했다.**
- 이 방식으로 얻은 사실은 "실제 페이지에 그렇게 적혀 있다는 검색엔진의 발췌"이지, 내가 직접
  렌더링된 페이지를 열어 눈으로 확인한 것과는 신뢰 수준이 다르다. 그래서 이번 조사에서는:
  - **같은 사실을 최소 2개의 독립된 검색 결과로 교차 확인한 것만 채택**했다. 한 번의 검색
    스니펫에서만 나온 주장, 혹은 서로 다른 검색이 서로 다른 인용문을 내놓은 항목(예: 동백꽃에
    대한 그리너웨이 꽃말 사전 인용문이 검색마다 다르게 나온 경우)은 **정확한 인용으로 쓰지 않고
    제외하거나, 훨씬 약한 확신 수준(`single_source`/`varies`)으로만 실었다.**
  - ASPCA·NC State 같은 반려동물 독성 판정처럼 안전과 직결된 항목은 특히 보수적으로 판단했다
    (§3 참고).
  - 각 꽃의 `editorial_note` 에 `weekly-research:` 접두사로만 표기했고, 어떤 사실이 이런 식으로
    수집됐는지는 이 문서에 전부 남긴다 — CSV 행 각각에 "WebFetch 미확인"이라고 반복해 적지는
    않았다(가독성 저하). **이 문서 전체가 그 단서라고 보면 된다.**
- **다음 조사에서 WebFetch 가 정상 동작하면**, 아래 "Sources" 목록의 URL(특히 그리너웨이·뒤몽
  1차 문헌과 ASPCA 개별 페이지)을 직접 열어 정확한 원문과 대조하는 재검증을 권장한다.

---

## 2. 저작권 처리

- **타 사이트 문장을 그대로 옮긴 곳은 없다.** `story_ko`·`meaning_ko`·`caution_note`·
  `editorial_note` 는 전부 사실관계만 참고해 새로 쓴 문장이다. WebFetch 가 막혀 원문 전체를
  볼 수 없었던 점도 오히려 "문장 그대로 베끼기"를 구조적으로 차단한 셈이다 — 검색 스니펫에서
  뽑아낸 사실만 다시 우리 말로 썼다.
- 원문 인용은 하지 않았다(1차 문헌 확인이 막혀 정확한 인용문을 보장할 수 없었기 때문 — §1).
- **실존 인물의 서사는 전설·명예 프레이밍으로만 실었다.** 중국 우희(虞美人) 이야기는
  `story_type = folklore` 로 넣고 "~라고 전해져요" 톤을 지켰으며, `caution_note`/
  `editorial_note` 에 후대 각색 가능성을 명시했다. 알렉상드르 뒤마 피스의 소설(1848, PD)은
  소설 속 인물(마르그리트 고티에) 이야기로만 다루고 실존 모델(마리 뒤플레시스)은 배경 설명에만
  짧게 언급했다.
- 실존 브랜드를 소재로 한 창작은 쓰지 않았다(예: 동백꽃 = 특정 패션 브랜드 로고 연상 소재는
  검토했으나 제외 — §5).

---

## 3. 반려동물 독성 — 판단 근거

| 꽃 | 판정 | severity | 근거 |
|---|---|---|---|
| iris | 개·고양이 모두 독성 | `mild_gi` | ASPCA "Iris" 페이지 — Toxic Principle: pentacyclic terpenoids(zeorin, missourin, missouriensin); Clinical Signs: salivation, vomiting, drooling, lethargy, diarrhea. 뿌리줄기(rhizome)에 독성이 가장 짙다는 서술과 함께 두 차례 독립 검색으로 동일하게 확인됨 |
| poppy | 개·고양이 모두 독성 | `mild_gi` | 국내 유통 개양귀비(*Papaver rhoeas*)는 ASPCA 개별 등재를 찾지 못했다(아이슬란드 포피 *P. nudicaule* 등 다른 종만 등재). 대신 NC State Extension 의 *Papaver rhoeas* 페이지가 "일부 양귀비속 식물은 알칼로이드가 풍부하고 유액에 기형유발 가능성이 있다"고 명시해 이를 근거로 삼음. 아편양귀비(*P. somniferum*)보다는 알칼로이드가 미량이라는 서술(복수 출처 일치)을 감안해 `life_threatening` 이 아닌 `mild_gi` 로 보수적으로 판단 |
| camellia | 비독성 | `none` | ASPCA "Camellia"/"Common Camellia" 페이지 — Non-Toxic to Dogs, Non-Toxic to Cats, Non-Toxic to Horses (두 개별 URL·두 차례 검색에서 동일하게 확인) |
| magnolia | 비독성 | `none` | ASPCA "Magnolia Bush"(*Magnolia stellata*) 페이지 — Non-Toxic to Dogs/Cats/Horses. 이 카드가 쓰는 백목련(*Magnolia denudata*)과 종은 다르지만, ASPCA 독성 목록에 목련속(Magnolia) 어느 종도 별도로 등재돼 있지 않아(비독성 계열로 일관) 속 전체에 같은 판정을 적용함(`editorial_note` 에 명시) |

- iris·poppy 는 hydrangea·carnation·ranunculus 등 기존 카탈로그의 `mild_gi` 등급과 같은
  기준선(구토·설사 중심의 위장관 자극, 심장·신경계 직접 침습 서술 없음)으로 맞췄다.
- poppy 의 toxic_parts 는 NC State 서술의 "유액(sap)"을 중심으로 `sap|stem|leaf|seed` 로 적었다.

---

## 4. 열람 확인한 자료 목록 (WebSearch 경유 — §1 참고)

| 성격 | 자료 | URL |
|---|---|---|
| ASPCA | Iris | https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/iris |
| ASPCA | Camellia | https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/camellia |
| ASPCA | Magnolia Bush | https://www.aspca.org/pet-care/aspca-poison-control/toxic-and-non-toxic-plants/magnolia-bush |
| NC State | *Papaver rhoeas* | https://plants.ces.ncsu.edu/plants/papaver-rhoeas/ |
| `wikipedia-iris-mythology` | Iris (mythology) | https://en.wikipedia.org/wiki/Iris_(mythology) |
| `wikipedia-fleur-de-lis` | Fleur-de-lis | https://en.wikipedia.org/wiki/Fleur-de-lis |
| `wikipedia-hanakotoba` | Hanakotoba | https://en.wikipedia.org/wiki/Hanakotoba |
| — | Irises (painting) — Van Gogh | https://en.wikipedia.org/wiki/Irises_(painting) |
| — | Horikiri Iris Garden | https://www.metmuseum.org/art/collection/search/73562 |
| `greenaway-1884` | Kate Greenaway, *Language of Flowers* (1884) — PD | https://www.gutenberg.org/ebooks/31591 |
| `wikipedia-poppy` | Poppy | https://en.wikipedia.org/wiki/Poppy |
| `wikipedia-remembrance-poppy` | Remembrance poppy / In Flanders Fields | https://en.wikipedia.org/wiki/In_Flanders_Fields |
| `wikipedia-consort-yu` | Consort Yu (Xiang Yu's wife) | https://en.wikipedia.org/wiki/Consort_Yu_(Xiang_Yu%27s_wife) |
| — | Shirley poppy | https://en.wikipedia.org/wiki/Shirley_poppy |
| — | The Power of the Poppy (Wizard of Oz) — Smithsonian | https://americanhistory.si.edu/explore/stories/power-poppy-exploring-opium-through-wizard-oz |
| `wikipedia-camellia-japonica` | Camellia japonica | https://en.wikipedia.org/wiki/Camellia_japonica |
| `wikipedia-lady-of-the-camellias` | The Lady of the Camellias (Dumas fils, 1848) | https://en.wikipedia.org/wiki/The_Lady_of_the_Camellias |
| — | 한국민족문화대백과사전 — 제주 동백동산 습지 | https://encykorea.aks.ac.kr/Article/E0074922 |
| — | 문화재청 — 고창 선운사 동백나무 숲 | http://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1363501840000 |
| — | Magnolia (genus, Pierre Magnol / 딱정벌레 수분) | https://en.wikipedia.org/wiki/Magnolia |
| `wikipedia-magnolia-denudata` | Magnolia denudata | https://en.wikipedia.org/wiki/Magnolia_denudata |
| `wikipedia-ko-mokryeon` | 목련 (한국어 위키백과) | https://ko.wikipedia.org/wiki/목련 |

---

## 5. 꽃별 수집 요약과 종 함정

### iris (아이리스) — 꽃말 4 · 이야기 4
- 국내 절화로 도는 것은 튤립처럼 구근을 촉성재배하는 **더치 아이리스(Iris hollandica)**다.
  향수 원료 오리스 루트(Iris germanica 뿌리줄기)나 한국 자생 붓꽃(Iris sanguinea)과는 다른
  식물이라 `flowers.editorial_note` 에 명시했다.
- 일본 문화 함정: 단오절(어린이날) 관습의 창포(쇼부)는 진짜 붓꽃이 아니라 **다른 식물인
  창포(Acorus calamus)** 다. 두 이름이 겹쳐 자주 혼동되므로 `meanings.csv` 에 그 사실을 밝혔다.
- 플뢰르 드 리스는 백합·붓꽃 논쟁이 있고, 클로비스왕 개종 전설은 확인된 사료가 아니라
  `varies`+`caution_note` 로 처리했다.

### poppy (개양귀비) — 꽃말 4 · 이야기 4
- **가장 중요한 종 구분**: 관상용으로 합법 유통되는 개양귀비(Papaver rhoeas, 셜리 포피 포함)는
  마약류로 재배가 금지된 아편양귀비(양귀비, Papaver somniferum)와 다른 종이다. `flowers.csv`
  `editorial_note` 에 명시했다.
- 오즈의 마법사 속 "잠재우는 양귀비 들판"은 작중 종이 명시돼 있지 않아, 이 카드의 개양귀비와
  같은 종이라 단정하지 않고 `editorial_note` 에 그 한계를 남겼다.
- 중국 우희(虞美人) 설화는 실존 인물을 소재로 하되 `folklore`+명예 프레이밍으로 처리했다.

### camellia (동백꽃) — 꽃말 3 · 이야기 4
- 일본 "무사에게 건네지 않는 꽃" 통설은 여러 자료에 반복되지만 1차 문헌 근거를 찾지 못해
  `varies`+`caution_note` 로 신중하게 표시했다.
- 제주 동백동산·4·3 상징 이야기는 비극적 소재지만 위로·기억이라는 방향으로 다뤄
  `comfort` intent 를 붙였다.
- 뒤마 피스의 1848년 소설(퍼블릭 도메인)을 `literary` 로 실었다 — 실존 모델(마리 뒤플레시스)이
  아니라 소설 속 인물 이야기로만 서술했다.
- **제외**: 특정 패션 브랜드의 동백 로고 연상 소재는 실존(현존) 브랜드라 다루지 않았다.

### magnolia (목련) — 꽃말 3 · 이야기 3
- 국내 절화·가로수는 백목련(Magnolia denudata) 기준으로 잡고, 제주 자생 목련(M. kobus)·
  자목련(M. liliiflora)·미국 태산목(M. grandiflora, 다른 종·다른 계절)의 차이를
  `flowers.editorial_note` 에 명시했다.
- 딱정벌레 수분·벌보다 오래된 진화사는 여러 독립 자료에서 반복 확인되는 사실이라 `repeated`.
- **제외**: 한국 설화로 널리 도는 "북해 신을 사랑한 선녀" 이야기는 현대 웹 블로그·지역신문에서만
  반복될 뿐 전통 구비문학 자료로 거슬러 올라가는 근거를 찾지 못해 신지 않았다(§6).

---

## 6. 수집했으나 제외한 것

| 후보 | 제외 사유 |
|---|---|
| 목련 "북해 신을 사랑한 선녀" 설화 | 여러 블로그·지역신문에 같은 줄거리가 반복되지만 근대 이전 구비문학 자료로 확인되지 않음. 출처가 서로를 베낀 것으로 보임 |
| 이집트 아이리스(파라오 홀·투트모스 신전) | 상업 꽃집 블로그에서만 반복되고 이집트학 자료로 확인되지 않음 |
| 동백꽃 특정 패션 브랜드 로고 연상 | 실존(현존) 브랜드 소재라 창작·서술 대상에서 제외 |
| 동백꽃 그리너웨이 꽃말 인용문 | 두 차례 검색이 서로 다른 인용문("unpretending excellence" vs "you're a flame in my heart")을 내놓아 정확한 원문을 확신할 수 없어 제외 |
| 개양귀비 헨리에타 뒤몽(1851) 꽃말 | 개별 항목을 찾지 못함 |
| 아이리스 헨리에타 뒤몽(1851) 꽃말 | 검색에서 붓꽃 항목 자체를 찾지 못함(다른 주제의 아이리스 언급만 나옴) |

---

## 7. Advisor 판단이 필요한 후속 항목

1. **§1 의 WebFetch 차단이 이 세션에 한정된 것인지 확인 필요.** 다음 조사에서도 막혀 있다면
   반복 이슈로 보고해야 한다.
2. **그리너웨이·뒤몽 1차 문헌 재검증.** WebFetch 복구 시 `gutenberg.org/ebooks/31591`·
   `71779` 를 직접 열어 이번 조사의 `single_source` 인용문(특히 iris·magnolia 의 "소식"/
   "자연을 향한 사랑")을 원문과 대조할 것.
3. **magnolia 반려동물 판정의 종 간극.** ASPCA 가 등재한 것은 *Magnolia stellata* 뿐이라
   *M. denudata* 로 일반화한 것은 추정이다(§3).
4. **`rules.csv` 는 여전히 5종만 다룬다.** 신규 4종도 도감·이야기용으로만 존재한다.
5. **이미지가 전부 비어 있다.** `docs/image-assets.md` 승인 절차가 필요하다.
