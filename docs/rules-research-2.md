# 추천 규칙 확장 조사 기록 — 후반부 31종 (`content/rules.part2.csv`, 2026-08-18)

카탈로그 59종 중 규칙을 가진 꽃이 6종뿐이던 상태를 메우는 작업의 **후반부**다.
전반부(27종)는 `content/rules.part1.csv` · `docs/rules-research.md` 가 맡고, 이 문서는
나머지 **31종 73행**(가점 61 · 회피 12)의 근거와 판단을 남긴다.

파일은 `content/rules.csv` 를 건드리지 않는다. 병합은 Advisor 가 한다.
`rule_id` 는 **200번대**를 쓴다(기존 `rule-001~007`, 전반부 100번대와 충돌 방지).

---

## 1. 먼저 확인한 것 — 엔진이 실제로 읽는 컬럼은 셋뿐이다

규칙을 쓰기 전에 `src/lib/engine/score.ts` 와 `src/lib/engine/types.ts` 를 열어
**어느 컬럼이 점수에 닿는지** 확인했다. 이 확인이 아래 모든 판단의 전제라 먼저 적는다.

| 컬럼 | 엔진이 읽는가 | 실제 동작 |
|---|---|---|
| `intent` | **읽는다** | `intentRows` 필터 → `I` 파트. 같은 꽃의 같은 intent 행 중 `fit_score` **최댓값** |
| `relationship_type` | **읽는다** | `relationshipRows` 필터 → `R` 파트. 역시 최댓값 |
| `flower_id` | **읽는다** | 후보 꽃 매칭 |
| `fit_score` | **읽는다** | `/100` 하여 0~1 |
| `avoid_reason` | 아직 안 읽는다 | `catalog.ts` → `RecommendationRuleRow.avoidReason` 까지는 실려 오지만 `exclude.ts` 도 `score.ts` 도 소비하지 않는다. `bestFit()` 이 점수 없는 행을 건너뛰므로 **가점이 붙지 않는 효과만** 있다 |
| `occasion` | **안 읽는다** | `RecoInput` 에 `occasion` 필드 자체가 없다 |
| `apology_level` | **안 읽는다** | `RecoInput.apologyLevel` 은 있지만 `score.ts` 가 쓰지 않는다 |
| `budget_range` · `urgency` | **안 읽는다** | 예산은 `exclude.ts` 의 `allowedPriceBands(budgetKrw)` 가 `flowers.price_band` 로 따로 본다 |
| `aesthetic_tags` | **안 읽는다** | `A` 파트는 `recipientTraits ∩ flowers.aesthetic_tags` 로 계산한다. 규칙 쪽 태그는 어디에도 안 닿는다 |

여기서 두 가지가 따라 나온다.

**(1) `occasion` 은 규칙을 좁히지 못한다.**
`intent=celebration, occasion=christmas` 라고 적어도 엔진은 **모든 축하 자리**에 그 점수를
준다. 그래서 `fit_score` 는 "이 occasion 에서의 적합도"가 아니라 **"이 intent 전반의 적합도"**
로 잡았다. occasion 은 나중에 필터 단계가 생겼을 때를 위한 메모이고, 지금은 그 메모 때문에
점수를 높게 잡지 않았다. (스위트피가 대표적이다 — §4 참조)

**(2) `aesthetic_tags` 는 비워 두었다.**
기존 7행은 `romantic|classic` · `light|fresh` · `casual|round` 같은 값을 넣어 두었는데,
이 어휘는 `flowers.csv` 의 태그 어휘(`vivid` · `cute` · `elegant` · `calm` · `minimal`)와
**한 글자도 겹치지 않는다.** 즉 지금 그 칸은 어느 코드도 읽지 않는 죽은 값이다.
검증되지 않은 어휘를 73행에 더 퍼뜨리는 대신 비워 두고 이 문단을 남긴다.
→ **전반부와 갈릴 수 있는 지점이다. §6 에 다시 적는다.**

`budget_range` 와 `urgency` 는 기존 7행의 관례를 그대로 따랐다. 관례가 기계적이라 따르는
비용이 0 이기 때문이다: `price_band` 1 → `1-2`, 2 → `2-3` (기존 7행이 정확히 이 대응이다),
3 → `3` (아마릴리스 한 종. 선례가 없어 새로 정했다). `urgency` 는 전부 `normal`.

### `relationship_type` 을 비운 34행에 대하여

`relationship_type` 을 채우면 그 행은 **intent 와 무관하게** 그 관계 전체에 `R` 가점을 준다.
`rule-208`(재스민·family·gratitude·80)은 "가족에게 감사할 때 재스민"이 아니라
"**가족이면 언제나** 재스민 R=0.80" 으로도 동작한다는 뜻이다.

그래서 채우는 기준을 하나로 정했다: **근거가 그 관계 자체를 말할 때만 채운다.**
`진실한 우정`(제라늄·friend) · `수줍음`(시클라멘·crush) · `영원한 아름다움`(스토크·spouse)
처럼 꽃말이 관계를 지목하는 경우다. 그 외에는 비웠다 — 가점 61행 중 34행이 intent 전용이다.

---

## 2. `fit_score` 스케일 — 기존 7행 기준 상대화

| 기존 행 | 값 | 성격 |
|---|---|---|
| `rule-001` 장미·lover·confession | 92 | 고백의 기본값. 이 자리는 비워 둔다 |
| `rule-003` 흰 튤립·lover·apology | 88 | |
| `rule-004` 프리지아·friend·gratitude | 85 | |
| `rule-005` 거베라·colleague·gratitude | 84 | |
| `rule-002` 프리지아·crush·confession | 78 | |
| `rule-007` 히아신스·lover·apology | 72 | 근거는 있으나 향 리스크가 있는 자리 |

이 여섯 점을 눈금 삼아 part2 는 **70~86** 을 썼다(평균 76.4). 92 는 쓰지 않았다.

| 대역 | 뜻 | 예 |
|---|---|---|
| 84~86 | 꽃말·관습이 상황과 거의 1:1 로 겹치고 출처가 `repeated` | 팬지·just_because 86 · 글라디올러스·celebration 86 |
| 78~82 | 근거가 뚜렷하되 해석이 반 걸음 들어감 | 마리골드·comfort 80 · 제라늄·friend 82 |
| 74~77 | 근거가 단일 출처거나 색 한정 | 스토크·crush 76 · 스카비오사 제외 대부분 |
| 70~73 | 근거가 이야기 한 편뿐이거나 해석이 한 단계 건너뜀 | 포인세티아·apology 70 · 알스트로메리아·recovery 70 |

**근거 강도로 갈랐지 꽃의 인기로 가르지 않았다.** 안스리움·부바르디아처럼 실제 유통이 많은
꽃이 낮은 이유는 우리 `meanings.csv` 가 가진 근거가 전부 `single_source` 여서다.

---

## 3. 꽃별 규칙

가점은 `intent(relationship) 점수`, 회피는 `⛔ intent` 로 적는다. 근거 열은 요약이고
전문은 CSV 의 `note` 컬럼에 있다(전 행 `meanings:` 또는 `stories:` 행 id 를 단다).

| 꽃 | rule_id | 규칙 | 근거 |
|---|---|---|---|
| 마리골드 | 200~202 | comfort(family) 80 · gratitude 76 · ⛔ confession | 셈파수칠(망자의 날) · 인도 사원 화환 · 우크라이나 초르노브리우치. 회피는 `greenaway-1884` 의 슬픔·질투 |
| 개양귀비 | 203~205 | comfort 84 · gratitude 74 · ⛔ celebration | 플랜더스·런던탑 도자기 꽃 · `remembrance-poppy`. 회피는 전몰자 추모 상징 |
| 재스민 | 206~208 | confession(lover) 80 · anniversary(spouse) 78 · gratitude(family) 80 | '마음을 맡깁니다' · 삼파기타(신부의 꽃) · 태국 어머니날 |
| 팬지 | 209~211 | just_because 86 · comfort 74 · confession(crush) 76 | 이름 자체가 pensée('생각') · 오필리아 · 한여름 밤의 꿈 |
| 포인세티아 | 212~213 | celebration(family) 82 · apology 70 | 거룩한 밤의 꽃 · 페피타 이야기(`intents=apology`) |
| 스위트피 | 214~217 | gratitude(colleague) 84 · just_because 72 · ⛔ confession · ⛔ celebration | '작별 — 그리고 새 출발'과 그 `caution_note` 두 방향 |
| 글라디올러스 | 218~220 | celebration 86 · confession(lover) 74 · comfort 70 | '승리 — 이겨 낸 사람에게' · 네이메헌 완주 행렬 · 보라=정열적 사랑 |
| 달리아 | 221~223 | celebration 80 · just_because 72 · ⛔ confession | 우아함과 기품(dumont) vs 변덕(greenaway) — 회피는 후자의 `caution_note` |
| 백일홍 | 224~225 | just_because(friend) 84 · comfort 74 | '떠나 있는 벗을 생각하며' · ISS 첫 꽃 · 오봉 영전 꽃 |
| 과꽃 | 226~227 | comfort(family) 78 · apology(lv2) 72 | 「과꽃」 1953 · '나를 믿어 주세요' · '뒤늦게 떠오른 생각' |
| 금잔화 | 228~230 | comfort 78 · ⛔ celebration · ⛔ confession | 셰익스피어 임종의 침상. 회피 둘 다 `caution_note` 원문 |
| 시클라멘 | 231 | confession(crush) 74 | '수줍음' · '내성적인 성격' |
| 제라늄 | 232~233 | gratitude(friend) 82 · just_because(friend) 70 | '진실한 우정' · 노랑='뜻하지 않은 만남' |
| 프리뮬러 | 234~236 | confession(crush) 78 · just_because 72 · ⛔ celebration | 흰 프리뮬러=첫사랑 · '가장 먼저 피는 꽃'. 회피는 dumont 의 '이른 슬픔' |
| 스토크 | 237~238 | anniversary(spouse) 84 · confession(crush) 76 | '영원한 아름다움' · '애정의 끈' · 흰 스토크='남몰래 품은 사랑' |
| 델피니움 | 239~241 | celebration 76 · just_because 72 · ⛔ apology | '청명' · 첼시 100년. 회피는 '가벼움'·'변덕' |
| 아마릴리스 | 242~243 | celebration 80 · confession(lover) 72 | '자랑스러움' · 시계공의 화재 · 테오크리토스의 사과 열 개 |
| 수레국화 | 244~245 | comfort 78 · gratitude 72 | 투탕카멘 화환 · Bleuet de France |
| 크로커스 | 246~247 | celebration 78 · confession(crush) 76 | '청춘의 기쁨' · '지나치지 마세요' · 크로코스 신화 |
| 수련 | 248 | comfort 70 | 모네의 휴전 이튿날 편지 · '맑고 깨끗한 마음' |
| 알스트로메리아 | 249~251 | gratitude(friend) 84 · anniversary(spouse) 76 · comfort 70 | '우정과 헌신' · '오래 가는 마음' · 리우토 추뇨 |
| 안스리움 | 252~253 | celebration 78 · confession(lover) 72 | '따뜻한 환대' · 붉은 안스리움='정열' |
| 치자 | 254~255 | confession(crush) 78 · celebration 76 | '남몰래 품은 사랑' · 코르사주 관습 · '나는 더없이 행복합니다' |
| 유칼립투스 | — | **없음** | §5 |
| 스타티스 | 256~257 | comfort 74 · ⛔ celebration | '위로'(서양) · '끊기지 않는 기억'. 회피는 `caution_note` 원문 |
| 미모사 | 258~259 | gratitude 84 · confession(crush) 74 | 이탈리아 여성의 날 · 1946년 · '비밀스러운 사랑' |
| 부바르디아 | 260~261 | confession(lover) 74 · just_because(friend) 70 | '정열'(repeated) · '오가는 마음 — 사귐' |
| 스카비오사 | 262~264 | comfort 82 · ⛔ celebration · ⛔ confession | '홀로 남은 사람의 꽃' · '나는 모든 것을 잃었습니다' · mourning bride |
| 매화 | 265~267 | comfort 82 · anniversary(spouse) 76 · celebration 74 | '추위에 굴하지 않는 절개' · 퇴계 · 레이와 연호 |
| 진달래 | 268~270 | comfort 76 · confession(crush) 72 · apology(lv2) 70 | 두견새 설화(`intents` 에 apology·comfort) · '사랑의 희열' |
| 목화 | 271~272 | comfort 76 · gratitude 70 | '나를 감싸 주세요' · 맨체스터 1862 |

### 회피 12행 요약

| intent | 꽃 | 공통 근거 |
|---|---|---|
| celebration 6 | 개양귀비 · 스위트피 · 금잔화 · 프리뮬러 · 스타티스 · 스카비오사 | 애도·이별 결. 넷은 `meanings.caution_note` 가 이미 "축하 자리에는 어울리지 않는다"고 적어 둔 문장을 규칙으로 옮긴 것이다 |
| confession 5 | 마리골드 · 스위트피 · 달리아 · 금잔화 · 스카비오사 | 슬픔·질투·변덕·실망·'이루지 못한 사랑' — 고백 카드에서 뜻이 뒤집히는 꽃말 |
| apology 1 | 델피니움 | '가벼움 — 들뜬 마음'. 사과 자리에서 정확히 반대 신호가 된다 |

**회피는 `caution_note` 가 이미 가진 경고만 옮겼다.** "왠지 안 어울린다" 로는 한 행도 쓰지
않았다. 반대로 `caution_note` 가 자리를 지목하면(금잔화·스위트피·프리뮬러·스타티스·
스카비오사 다섯 행이 그렇다) 빠짐없이 옮겼다.

---

## 4. 자리마다 갈린 판단

### 스위트피 — 같은 caution_note 가 가점과 회피를 동시에 만든다

`'작별 — 그리고 새 출발'` 의 `caution_note` 는 두 가지를 동시에 말한다: 보내는 자리에는
맞고, 곁에 있어 달라는 자리에는 어긋난다. 문제는 **송별을 겸한 축하**(졸업·이직)다.
`occasion` 이 필터가 아니라서(§1) `intent=celebration, occasion=farewell` 가점을 쓰면
결혼식·승진에도 같은 점수가 나간다.

→ 송별 자리는 **`gratitude`(rule-214)로 받고, `celebration` 은 통째로 회피**(rule-217)했다.
"떠나는 사람에게 고맙다"는 우리 어휘로 표현 가능한 마음이고, 그쪽이 정직하다.
`occasion` 필터가 생기면 celebration+farewell 가점을 되살릴 수 있다.

### 달리아 — 원전이 정반대인 꽃에 회피를 걸어도 되는가

`dumont-1851` 은 '우아함과 기품', `greenaway-1884` 는 '변덕'이다(`confidence=varies`).
가점(celebration 80)과 회피(confession)를 **같은 꽃에 함께** 걸었다. 축하 자리에서는
'변덕'이 사고가 되지 않지만 고백 카드에서는 된다고 봤다. 다만 `caution_note` 가
"어울리지 않는다"까지는 말하지 않아 **part2 의 회피 12행 중 가장 약한 근거**다.
Advisor 가 덜어 낸다면 이 행이 첫 후보다.

### 진달래 — 사과인가 배웅인가

`story-azalea-dugyeon-bird` 는 `intents=apology|comfort` 로 태그되어 있어 사과 가점의
직접 근거가 된다. 그런데 진달래의 한국 쪽 대표 텍스트인 소월의 「진달래꽃」은
**보내는 자리의 시**라 사과보다 배웅에 가깝다. 스위트피와 같은 결이 되어 버린다.
→ 태그를 존중해 `apology` 가점을 남기되 70(최저 대역)으로 두고 이 문단을 남긴다.

### 과꽃 — '뒤늦게 떠오른 생각'을 늦은 사과로 읽어도 되는가

`greenaway-1884` 의 Aster = afterthought 다. 원전은 사과를 말하지 않는다.
'당신 뜻에 함께합니다'·'나를 믿어 주세요'가 뒤를 받쳐 72 로 넣었지만 **해석이 한 단계
들어간 행**이다. 근거 강도로만 보면 part2 가점 중 이 행과 포인세티아 apology 가 가장 약하다.

### 시클라멘 — 색이 뜻을 가르는데 규칙에는 색 축이 없다

흰 시클라멘 '맑고 깨끗함' vs 붉은 시클라멘 '질투'. 규칙표에 색 컬럼이 없어
`confession` 가점과 `confession` 회피를 동시에 걸 수 없다(그 조합은 검증 스크립트가
모순으로 잡는다). → 가점 쪽만 74 로 남기고 색 조건은 `note` 에 적었다.
색 축이 필요한 첫 사례다 — 제라늄(붉은 제라늄 '어리석음')도 같은 문제를 갖는다.

### 제라늄 — `caution_note` 가 경고는 하는데 자리를 지목하지 않는다

`dumont-1851` 붉은 제라늄='어리석음'에 "카드에 옮겨 적기 전에 한 번 더 생각해 주세요"가
붙어 있다. 그런데 같은 색을 두고 `suncheonbay-birth-flowers` 는 '그대가 있어 행복합니다'다.
**자리를 지목하지 않은 경고는 회피 규칙으로 옮기지 않는다**는 원칙(§3)을 지켜 회피를 쓰지
않았다. 색 축이 생기면 재검토할 자리다.

### 수레국화 — 정치적 상징 주의는 규칙이 될 수 없다

`caution_note` 가 "지금은 정치적 상징으로도 쓰여요. 나라마다 읽히는 뜻이 다릅니다"라고
적는데, `RecoInput.region` 은 있지만 규칙표에 지역 축이 없다. `note` 에만 남겼다.

---

## 5. 규칙을 세우지 않은 꽃 · 최소한만 세운 꽃

### 유칼립투스 — 가점 0 · 회피 0

**단독 선물로 성립하지 않는 그린 소재다.** 다발의 결을 만드는 곁들이라
"어떤 마음일 때 유칼립투스를 보내세요"라는 문장 자체가 성립하지 않는다.
`meanings.csv` 가 가진 세 줄('새로 태어남' · '추억' · 이름 유래)도 전부 `single_source`
일본 자료고, `stories.csv` 다섯 편은 전부 나무 이야기(수도·백 미터·오클랜드 화재)라
선물 자리와 닿지 않는다. 억지로 `just_because` 70 을 하나 붙일 수 있었지만 붙이지 않았다.

**조합기(다발 구성) 기능이 생기면 그때 곁들이 규칙이 설 자리가 생긴다.**
그 규칙은 "이 마음에는 이 꽃"이 아니라 "이 주인공 꽃에는 이 곁들이"의 형태여야 하고,
지금 규칙표의 스키마로는 표현할 수 없다.

### 스타티스 — 가점 1 (comfort 74)

같은 곁들이지만 유칼립투스와 다르다. 드라이로 오래 가서 단독 다발이 실제로 성립하고,
'위로'라는 꽃말이 서양 쪽에서 `caution_note` 를 만들 만큼 뚜렷하다.
다만 **주인공이 아니라는 사실을 점수로 반영해** 74 에 묶었다.
`anniversary` 는 쓰지 않았다 — '변하지 않는 마음'이 기념일과 닿지만, 같은 꽃의
애도 결(`축하 자리에서는 뜻이 어긋날 수 있어요`)이 기념일까지 물들일 위험이 더 컸다.

### 수련 — 가점 1 (comfort 70)

**건네는 형태 자체가 드물다.** 수반에 띄우는 꽃이라 다발이 되지 않는다.
모네 이야기가 위로 자리에 닿아 한 행만 최저 대역으로 남겼다.

### 시클라멘 — 가점 1 (confession 74) · 포인세티아 — 가점 2

둘 다 **화분으로만 유통되는 종**이라 "꽃다발"을 기대하는 자리에는 서지 않는다.
다만 두 꽃은 화분 자체가 선물의 완성형이라(크리스마스 포인세티아·겨울 시클라멘)
유칼립투스처럼 0 으로 두지는 않았다. 그 사실은 두 꽃의 `note` 에 적어 두었다.
**화분/절화 구분 축이 없다는 것이 여기서 드러난 구조적 결손이다.**

### 금잔화 · 스카비오사 — 가점 1 · 회피 2

둘 다 꽃말이 전부 상실·이별 쪽이라 **위로 말고는 설 자리가 없다.**
`just_because` 를 하나씩 붙일 수 있었지만(둘 다 이야기가 재미있다) 붙이지 않았다 —
"그냥 생각나서" 자리에 상실의 꽃말을 얹는 것은 그 자체로 사고다.

---

## 6. Advisor 판단이 필요한 지점 (병합 전)

1. **`aesthetic_tags` 를 비운 것** (§1-2). 기존 7행은 채웠고 part2 는 73행 전부 비웠다.
   전반부가 채웠다면 파일 사이가 갈린다. 어느 쪽으로 통일할지 정해야 한다.
   비우는 쪽을 권한다 — 그 어휘는 지금 어느 코드도 읽지 않는다.
2. **`relationship_type` 을 34행에서 비운 것** (§1). 기존 7행은 전부 채웠다.
   채우면 그 관계 **전반**에 `R` 가점이 붙는다는 부작용을 근거로 한 판단이다.
   전반부가 전부 채웠다면 같은 상황에서 part1 꽃이 part2 꽃보다 구조적으로 높게 나온다.
3. **`budget_range` = `3`** (아마릴리스 2행). `price_band` 3 짜리 꽃의 선례가 없어 새로 정했다.
4. **달리아 `confession` 회피** (§4). part2 회피 중 근거가 가장 얇다.
5. **`occasion` 값 어휘**. part2 가 새로 쓴 값은
   `memorial` · `remembrance` · `christmas` · `farewell` · `recovery` · `graduation` ·
   `housewarming` · `womens-day` · `hardship` · `new-year` 열 가지다.
   기존 두 값(`after-argument` · `job-change`)과 같은 kebab-case 영문을 따랐지만
   **어휘 목록이 어디에도 정의되어 있지 않다.** 전반부와 겹치는 개념을 다른 철자로
   적었을 수 있다(`farewell` vs `job-change` 가 이미 반쯤 겹친다).
6. **색 축 · 화분/절화 축의 부재** (§4 시클라멘 · §5). 규칙표 스키마가 표현하지 못해
   `note` 로 흘려보낸 사실이 여러 건이다. 후속 작업 후보로 남긴다.

---

## 7. 검증

스크래치패드 스크립트가 **프로젝트의 진짜 스키마와 진짜 CSV 파서를 그대로 import** 해서
본다(`db/seed/schemas.ts` 의 `RuleRowSchema` · `db/seed/parse.ts` 의 `readCsv`).

검사 항목: BOM 없음 · CRLF 없음 · 헤더가 `rules.csv` 와 동일 · zod 스키마 전수
(어휘 · `fit_score`/`avoid_reason` XOR · 0~100 범위 · slug 형식) · `flower_id` 가
`flowers.csv` 에 실재 · 담당 31종 밖의 꽃 없음 · `rule_id` 유일 · `rules.csv` 와 충돌 없음 ·
200번대 고정 · `intent=other` 없음 · relationship·intent 둘 다 빈 행 없음 ·
같은 꽃·같은 intent 에 가점과 회피가 공존하지 않음 · 전 행 `note` 에 `meanings:`/`stories:`
행 id 또는 URL 근거 존재.

결과 (마지막 항목의 줄바꿈만 읽기 위해 넣었다):

```
행 73 = 가점 61 + 회피 12
꽃 31종 중 규칙 있는 꽃 30종
가점 없는 꽃: eucalyptus
fit_score 범위 70~86 · 평균 76.4
intent 분포: comfort 15 · confession 13 · gratitude 9 · celebration 9 · just_because 8 · anniversary 4 · apology 3
relationship 분포: (없음) 34 · crush 8 · lover 5 · friend 5 · family 4 · spouse 4 · colleague 1
회피 분포: confession 5 · celebration 6 · apology 1
꽃별 (가점/회피): marigold 2/1 · corn-poppy 2/1 · jasmine 3/0 · pansy 3/0 · poinsettia 2/0 ·
  sweet-pea 2/2 · gladiolus 3/0 · dahlia 2/1 · zinnia 2/0 · aster 2/0 · calendula 1/2 ·
  cyclamen 1/0 · geranium 2/0 · primula 2/1 · stock 2/0 · delphinium 2/1 · amaryllis 2/0 ·
  cornflower 2/0 · crocus 2/0 · water-lily 1/0 · alstroemeria 3/0 · anthurium 2/0 ·
  gardenia 2/0 · eucalyptus 0/0 · statice 1/1 · mimosa 2/0 · bouvardia 2/0 · scabiosa 1/2 ·
  plum-blossom 3/0 · azalea 3/0 · cotton 2/0

모든 검사 통과
```

반려동물 위험 종(시클라멘 · 델피니움 · 아마릴리스 · 유칼립투스 · 매화 · 진달래가
`serious`)에는 밀폐 공간을 전제하는 가점을 하나도 쓰지 않았다.
애초에 규칙표에 그런 축이 없어 `occasion=housewarming` 을 쓴 한 행(안스리움)만 확인 대상이었고,
안스리움은 `mild_gi` 다. `serious` 여섯 종에는 공간을 전제하는 `occasion` 을 붙이지 않았다.

---

## 8. 병합 결정 2026-08-18

`content/rules.part2.csv` (rule-200~272) 를 `content/rules.part1.csv` (rule-100~172) 와 함께
기존 `content/rules.csv` (rule-001~007) 뒤에 **번호순으로** 합쳤다. part 파일 둘은 삭제했다.
전체 감사 표와 최종 수치는 `docs/rules-research-1.md` §6 에 한곳으로 모았다.
여기에는 **이 문서(part2)에 해당하는 결정**만 적는다.

### 8.1 이 파트에 적용된 결정

| # | 결정 | part2 에 미친 변화 |
|---|---|---|
| 1 | **`relationship_type` 기준을 part2 의 것으로 통일** — 근거가 관계 자체를 말할 때만 채운다 | **변경 없음.** §1 "`relationship_type` 을 비운 34행에 대하여" 가 그대로 전체 표의 기준이 됐다. part1 쪽 65행을 이 잣대로 다시 재서 47행을 비웠다(연쇄 효과는 research-1 §6.2) |
| 2 | **회피 문턱 통일** — 추론 근거 회피 삭제 | **`rule-223`(dahlia ⛔confession) 삭제.** §4 "달리아 — 원전이 정반대인 꽃에 회피를 걸어도 되는가" 에서 스스로 "근거가 가장 얇음, 덜어낸다면 첫 후보"라 적은 행이다. part1 쪽은 `rule-133`(carnation ⛔confession) 삭제 |
| 3 | **`aesthetic_tags` 공란 유지** | **변경 없음.** part1 과 독립적으로 같은 결론에 닿았던 자리다 |
| 4 | **`occasion` 어휘 정리** | **`rule-214` 의 `farewell` -> `job-change`.** 기존 표에 이미 `job-change` 가 있었고(rule-005 · part1 의 rule-104·106), 스위트피 `rule-214` 가 받는 자리(이직·퇴사 배웅)와 같은 칸이었다. 나머지 신규 어휘 — `memorial`·`remembrance`·`christmas`·`recovery`·`housewarming`·`womens-day`·`new-year`·`hardship` — 는 유지 |
| 5 | `lily-asiatic` 1행 유지 | part1 소관 |
| 6 | `rule_id` 번호대 유지 | 200번대 그대로 |

### 8.2 이 파트에서 손대지 않은 것

- **`relationship_type` 재감사 없음.** 이 문서의 기준이 곧 채택된 잣대라 27행 전부 그대로 두었다.
- **`memorial`(rule-200) 과 `remembrance`(rule-204·245) 를 합치지 않았다.** 둘 다 이번에 새로
  들어온 어휘라 "기존 어휘와 겹치는 자리"가 아니고, 결정 4 의 대상이 아니었다.
  `memorial` 은 망자의 날처럼 **가족이 개인을 부르는 자리**, `remembrance` 는 전몰자 추모처럼
  **공동체가 기억하는 자리**라 뜻도 갈린다. 다만 둘 다 지금은 **엔진이 읽지 않는 칸**이라
  화면 동작에는 차이가 없다 — 조건 매칭을 붙일 때 한 번 더 볼 자리로 남겨 둔다.
- **`housewarming`(rule-252) 과 `new-business`(part1 rule-108·170) 도 합치지 않았다.**
  개업과 집들이는 다른 자리이고, `rule-252` 의 근거(`따뜻한 환대` · 화분으로 오래 가는 종)가
  둘 다를 덮는다. 역시 결정 4 의 "기존 어휘와 겹치는 경우"가 아니다.

### 8.3 최종 수치

part2 몫은 §7 에서 적은 값이 **회피 한 행(rule-223)만 빠진 채 그대로**다.

```
part2 72행 = 가점 61 + 회피 11 (confession 4 · celebration 6 · apology 1)
  relationship 채운 행 27 — crush 8 · lover 5 · friend 5 · family 4 · spouse 4 · colleague 1
  (§7 의 분포와 같다. rule-223 은 회피 행이라 relationship 이 원래 비어 있었다)
```

합친 표 전체는 이렇다.

```
rules.csv 151행 = 가점 132 + 회피 19
  기존   7행 (가점 6 · 회피 1)
  part1 72행 (가점 65 · 회피 7)   <- 73행에서 rule-133 삭제
  part2 72행 (가점 61 · 회피 11)  <- 73행에서 rule-223 삭제

꽃 59종 중 규칙 보유 58종 (가점 보유 57 · 회피 보유 15)
  규칙 0종: eucalyptus (§5 의 판단 그대로 — 꽃말 3줄이 전부 single_source,
            이야기 5편이 전부 just_because 라 세울 자리가 안 나왔다)
  회피만 있는 종: chrysanthemum (part1)
relationship 채운 행 52 / 151 — crush 14 · lover 12 · spouse 10 · family 7 · friend 6 · colleague 3
```

`npm run seed` -> **exit 0 · 교차 검증 9종 전부 OK · `rules.csv 151행`**.

### 8.4 병합 뒤 남은 한 건

`tests/flow/actions.test.ts` 의 `예산 '기타' 는 가격대 필터를 걸지 않는다` 가 깨진다.
규칙표가 7행 -> 151행으로 자라면서 `friend`/`gratitude` 상위 3안이 전부 `priceBand=1` 이 된
것이 원인이고, **relationship 감사와는 무관하다**(감사 없는 단순 병합에서도 같이 깨진다).
자세한 재현·수치는 `docs/rules-research-1.md` §6.5 에 있다. 소유 밖 파일이라 손대지 않았다.
