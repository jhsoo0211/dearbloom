# 추천 규칙 확장 — 전반부 27종 조사 (2026-08-18)

`content/rules.part1.csv` 73행의 **근거 원장**이다. 규칙을 고칠 때 여기부터 고친다.

시드 기준 `content/rules.csv` 는 7행뿐이었고, 규칙이 붙은 꽃은 6종(rose-red ·
tulip-white · freesia · gerbera · hyacinth · lily-asiatic)이었다. 나머지 53종은
관계·마음 축에서 **항상 0점**이라 계절(S)과 색·태그(A)만으로 줄을 섰다. 이 문서가
다루는 것은 그 구멍의 앞쪽 27종이다(뒤쪽은 `rules.part2.csv` 담당 worker 의 몫).

> ⚠ `content/rules.csv` 본체는 건드리지 않았다. part1·part2 병합과 시드 검증은
> Advisor 가 한다.

---

## 0. 요약

| 항목 | 값 |
|---|---|
| 총 행수 | **73** (가점 65 · 회피 8) |
| 다룬 꽃 | 28종 (담당 27종 + lily-asiatic 1행) |
| fit_score | 최저 70 · 중앙값 78 · 최고 92 · 평균 78.2 |
| 점수 분포 | 70~74: 20행 · 75~79: 20행 · 80~84: 18행 · 85~89: 4행 · 90~94: 3행 |
| rule_id | `rule-100` ~ `rule-172` (기존 `rule-001`~`rule-007` 과 충돌 없음) |

**마음(intent) 커버리지가 이 배치의 가장 큰 소득이다.** 기존 7행은
`confession`·`apology`·`gratitude` 세 마음만 알고 있었다. part1 은 나머지 네 마음을
처음으로 채운다.

| intent | 기존 7행 | part1 |
|---|---|---|
| anniversary | 0 | 14 |
| confession | 2 | 14 |
| celebration | 0 | 13 |
| comfort | 0 | 9 |
| gratitude | 2 | 8 |
| just_because | 0 | 8 |
| apology | 3 | 7 |

관계(relationship) 쪽도 같다. 기존 7행에는 `spouse`·`family` 가 **한 행도 없었다** —
"배우자에게" 와 "가족에게" 를 고른 사용자는 관계 가점을 받을 길이 없었다.

| relationship | 기존 7행 | part1 |
|---|---|---|
| friend | 1 | 21 |
| lover | 4 | 14 |
| spouse | 0 | 11 |
| (비움 — 회피 규칙) | 0 | 8 |
| family | 0 | 7 |
| colleague | 1 | 6 |
| crush | 1 | 6 |

---

## 1. 규칙을 세운 방식

### 1.1 엔진이 규칙을 어떻게 읽는가 (점수를 매기기 전에 확인한 것)

`src/lib/engine/score.ts` 의 `scoreCandidate` 는 한 행을 **두 축에 따로 투영한다.**

- `I` = 그 꽃의 행 중 `intent` 가 일치하는 행들의 `fit_score` **최댓값**
- `R` = 그 꽃의 행 중 `relationship` 이 일치하는 행들의 `fit_score` **최댓값**

즉 `(spouse, anniversary, 84)` 한 행은 **배우자 요청 전부**에 R=0.84 를 주고,
**기념일 요청 전부**에 I=0.84 를 준다. 짝으로 걸리는 게 아니라 각각 걸린다.

이 사실이 작성 방식을 정했다.

1. **관계×마음 짝이 어색한 행은 만들지 않았다.** `(colleague, confession)` 같은 행은
   두 축 어느 쪽으로 투영해도 거짓이 된다.
2. **같은 마음을 여러 관계로 나눠 적은 것은 중복이 아니다.** `lisianthus` 의
   `(spouse, anniversary, 84)` 와 `(lover, anniversary, 82)` 는 I 축에서는 84 하나로
   합쳐지지만, R 축에서는 배우자 84 · 연인 82 로 갈린다. 이 갈림이 필요해서 둘 다 뒀다.
3. `fit_score` 가 빈 회피 행은 `bestFit` 이 건너뛴다(score.ts 62행). 회피 행을 넣어도
   가점이 붙지 않는다.

### 1.2 점수 눈금

기존 7행(92 / 88 / 85 / 84 / 78 / 72)을 기준자로 삼고, 근거의 **종류와 겹침**으로
띠를 갈랐다. 전부 90점대로 몰면 가점이 무의미해지므로 상단은 의도적으로 비웠다 —
90 이상은 3행뿐이다.

| 띠 | 근거 조건 | 예 |
|---|---|---|
| **90~92** | 한국에서 사실상 관행으로 굳은 짝. `repeated` 꽃말 + 관행을 직접 서술한 국내 이야기 | carnation family/gratitude 92 · freesia friend/celebration 90 |
| **84~88** | `repeated` 꽃말 여러 행 또는 국내 유통·관행 자료가 뒷받침 | gerbera friend/celebration 86 · lavender friend/comfort 84 |
| **78~82** | `repeated` 꽃말 1행 + 같은 결의 이야기 1편 이상 | peony lover/confession 78 · hydrangea family/gratitude 80 |
| **72~76** | 이야기 1편뿐이거나 `single_source`·`varies` 꽃말에 기댐 | iris friend/comfort 72 · lily-of-the-valley spouse/anniversary 74 |
| **70** | 근거는 있으나 같은 표에 반대 방향 `caution_note` 가 있음 | narcissus crush/confession 70 · anemone lover/apology 70 |

`note` 마다 "왜 이 띠인지" 를 남겼다 — 점수를 다시 조정할 사람이 근거를 되짚을 수 있게.

### 1.3 근거 표기 규약

`note` 는 두 종류만 인용한다.

- `meanings <꽃말>(문화권/시대·신뢰도)` — `content/meanings.csv` 의 실제 행
- `story-*` — `content/stories.csv` 의 `story_id`. `intents` 컬럼에 해당 마음이 적힌
  이야기만 인용했다(내가 읽어서 "그래 보인다" 가 아니라, 데이터가 이미 그렇게 태깅한 것)

**데이터 밖 통념은 한 건도 쓰지 않았다.** 외부 URL 을 `note` 에 적은 행은 0이다 —
meanings 305행·stories 438편 안에서 근거가 다 나왔기 때문이다. 근거가 안 나온 꽃은
규칙을 적게 가졌다(§3).

### 1.4 비워 둔 컬럼과 그 이유

| 컬럼 | 처리 | 이유 |
|---|---|---|
| `aesthetic_tags` | **전부 비움** | 기존 7행이 `romantic\|classic`·`casual\|round` 등을 쓰는데, 이 어휘는 `flowers.csv` 의 `aesthetic_tags`(`minimal\|calm\|cute\|vivid\|elegant`)와 다르다. 엔진도 이 컬럼을 읽지 않는다. 두 번째 어휘를 새로 지어내느니 비우는 쪽이 정직하다 — **Advisor 판단 필요**(§4.5) |
| `apology_level` | **전부 비움** | 사과의 무게를 1~5로 가르는 근거가 데이터에 없다. 비우면 "어느 단계에서든" 이라는 뜻이 되고, 회피 규칙은 그게 맞다 |
| `occasion` | 7행만 채움 | 기존 관례(`after-argument`·`job-change`)를 따라 **국내 관행이 이야기로 확인된 자리에만** 적었다: `graduation`(2) · `job-change`(2) · `new-business`(2) · `parents-day` · `teachers-day` · `after-argument`(2) · `wedding` |
| `budget_range` | 전부 채움 | 기존 7행이 `flowers.csv` 의 `price_band` 를 그대로 따랐다(band 1 → `1-2` · band 2 → `2-3`). band 3 은 선례가 없어 `3` 으로 적었다 — hellebore · peony · lily-of-the-valley · phalaenopsis 4종 |
| `urgency` | 전부 `normal` | 기존 7행에서도 `urgent` 는 rule-003 하나뿐이고, 같은 사과 규칙인 rule-007 은 `normal` 이다. 규칙이 급함을 정하는 축이 아니라고 봤다 |

### 1.5 회피 규칙의 문턱

가점보다 문턱을 높게 잡았다. **우리 데이터가 그 상황을 직접 지목한 경우에만** 세웠다 —
`meanings.caution_note` 가 "축하 자리" · "사과 자리" · "고백 자리" 처럼 마음을 명시한
8건이 전부다. "이 꽃은 좀 안 어울린다" 는 편집자 감각으로는 세우지 않았다.

`relationship_type` 은 회피 8행 모두 비웠다. 국화가 축하 자리에 안 맞는 것은 상대가
누구든 같기 때문이다(엔진이 R 축을 그냥 건너뛴다).

---

## 2. 꽃별 채택 규칙

가점은 `관계/마음 점수`, 회피는 `⛔마음`.

| 꽃 | 채택 규칙 | 핵심 근거 |
|---|---|---|
| **rose-red** | lover/anniversary **90** · spouse/anniversary 88 | [red] 열정적인 사랑과 깊은 애정(western/victorian·repeated) · anniversary 태깅 이야기 3편(aphrodite · cleopatra-carpet · thornless-korea) |
| **tulip-white** | spouse/apology 84 · colleague/celebration 80 · friend/apology 78 | [white] 용서를 구하는 마음과 새로운 시작(korea/modern) — 한 꽃말 안에 사과와 새 출발이 같이 있어 두 갈래로 씀 |
| **freesia** | friend/celebration **90** · colleague/celebration 80 | story-freesia-graduation-korea — 농촌진흥청 출하 시기가 졸업 시즌과 겹친다는 **재배 달력 근거**. celebration 태깅 국내 이야기가 5편 |
| **gerbera** | friend/celebration 86 · colleague/celebration 84 · friend/comfort 78 | story-gerbera-korea-wreath — 개업 화환에 가장 자주 꽂히는 꽃(농촌진흥청 거래량). 향 0 이라 자리를 안 가림 |
| **anemone** | friend/comfort 76 · lover/apology 70 · **⛔celebration** | comfort 태깅 이야기 3편 · 반대편으로 caution_note 2건이 축하 자리를 지목 |
| **hellebore** | friend/comfort 82 · lover/apology 72 · spouse/anniversary 72 | [white] 내 불안을 가라앉혀 주세요(uk/victorian·repeated) · story-hellebore-sepals(꽃잎이 아니어서 지지 않는다 → anniversary) |
| **hyacinth** | friend/comfort 76 · spouse/apology 72 | 기존 rule-007(lover/apology 72)의 아폴론 설화를 배우자로 넓히고, comfort 태깅 이야기 3편으로 위로 축을 세움 |
| **peony** | family/celebration 86 · spouse/anniversary 80 · lover/confession 78 · **⛔apology** | 부귀와 영화(china/tang·repeated) + 부귀 영화 성실(korea/modern·repeated) · 반대편 [red] 타오르는 분노가 사과 자리를 지목 |
| **hydrangea** | spouse/anniversary 82 · family/gratitude 80 · **⛔confession** | 만엽집 "여덟 겹으로 피니 여덟 대까지" · 둘러앉은 자리 가족과 화목 · 반대편 [blue] 변덕이 고백 자리를 지목 |
| **lavender** | friend/comfort 84 · family/comfort 80 · **⛔apology** | 씻어 내는 일(rome/ancient·repeated) · comfort 태깅 이야기 3편 · 반대편 [purple] 의심이 화해 자리를 지목 |
| **sunflower** | family/gratitude 80 · colleague/gratitude 76 · friend/celebration 76 | 존경 그리고 눈부심(japan/modern) · story-sunflower-van-gogh(gratitude) |
| **carnation** | family/gratitude **92** · colleague/gratitude 84 · **⛔confession** | [red] 5월 8일 가슴에 다는 꽃(korea/modern·repeated) + 어버이날·스승의 날 이야기 2편. **국내에서 가장 굳은 짝** |
| **lisianthus** | spouse/anniversary 84 · lover/anniversary 82 · lover/confession 72 | 변치 않는 사랑(korea/modern·repeated) · story-lisianthus-five-months(다섯 달을 기다려 피는 꽃) |
| **ranunculus** | crush/confession 82 · lover/confession 78 · **⛔gratitude** | 당신은 매력으로 빛나요(uk/victorian·repeated) + confession 태깅 이야기 2편 · 반대편 배은망덕이 감사 자리를 지목 |
| **lily-of-the-valley** | friend/celebration 80 · lover/confession 76 · spouse/anniversary 74 | 돌아오는 행복 · 5월 1일에 건네는 행운(둘 다 repeated) · dior·tchaikovsky·faberge-egg |
| **chrysanthemum** | **⛔celebration** · **⛔confession** (가점 0) | [white] 흰 국화 한 송이 애도(korea/modern·repeated) 의 caution_note 가 축하와 고백을 **직접 이름으로** 지목 |
| **narcissus** | friend/comfort 78 · crush/confession 70 | comfort 태깅 이야기 3편 · 눈여겨보는 마음(repeated)이지만 같은 표에 자기애 caution 이 있어 고백은 70 |
| **forget-me-not** | lover/anniversary 82 · crush/confession 78 · friend/comfort 74 | 나를 잊지 말아요 + [blue] 잊지 않겠다는 약속(둘 다 repeated) — 오래 기억하는 마음이 세 갈래로 반복 |
| **cherry-blossom** | friend/just_because 78 · lover/just_because 76 | 봄이 왔다는 소식(japan/ancient·repeated) · 이야기 6편 중 just_because 태깅이 4편으로 압도적 |
| **camellia** | lover/confession 80 · lover/anniversary 76 | [red] 사랑에 빠진 마음(japan/modern·repeated) · story-camellia-dumas(confession·anniversary 둘 다) |
| **violet** | crush/confession 76 · family/gratitude 74 · friend/just_because 72 | [purple] 겸손(repeated) + 사포 · story-violet-saintpaulia-father-son(아버지에게 보낸 씨앗) |
| **iris** | friend/just_because 78 · lover/anniversary 74 · friend/comfort 72 | 전하고 싶은 말 소식(uk/victorian·repeated) + 좋은 소식 그리고 변치 않음(japan/modern·repeated) |
| **daisy** | crush/confession 78 · spouse/anniversary 74 · friend/just_because 74 | confession 태깅 이야기 3편(chaucer · dickinson · latvia) · [white] 순수한 마음(repeated) |
| **babys-breath** | friend/celebration 78 · spouse/anniversary 74 · friend/gratitude 70 | 졸업 꽃다발 이야기 2편 · 다만 **오래 곁들이는 꽃**이라 불린 자리여서 freesia 90 과 크게 벌림 |
| **cosmos** | friend/just_because 74 · lover/just_because 70 | 꽃말이 3행 · 이야기가 3편뿐. 셋 다 just_because 로 몰려 있어 그 한 축만 |
| **magnolia** | crush/confession 74 · friend/just_because 72 | 북향화·kamadeva 두 confession 이야기 · 이루지 못한 사랑 결이라 lover 는 안 세움 |
| **phalaenopsis** | colleague/celebration **88** · family/celebration 76 | story-phalaenopsis-korea-auction-halved — "승진하면 보내고 가게를 열면 보냈죠". 2016년 청탁금지법 뒤 경매 주 2회→1회라는 **관행의 크기를 재는 숫자**까지 있음 |
| **lily-asiatic** | spouse/anniversary 76 (1행) | story-lily-baihe-wedding — 百年好合. §4.4 참조 |

---

## 3. 규칙을 적게 세운 꽃, 안 세운 자리

"모든 꽃은 축하에 좋다" 류 만능 규칙을 넣지 않기로 한 결과다. 근거가 없어 **비운
자리**를 여기 남긴다 — 나중에 자료가 붙으면 여기부터 채우면 된다.

### 3.1 가점 0 — chrysanthemum

국화는 회피 2행만 갖고 가점이 없다. 이야기 15편 중 comfort 태깅이 5편이나 되지만
(tao-yuanming · double-ninth · kikujido · oldest-herb · korea-white), 그 comfort 는
전부 **애도 쪽 위로**다. 우리 서비스의 `comfort` 는 라벨이 "지친 친구에게" 다
(`src/components/flow/labels.ts` 의 `PRESET_MOMENTS`). 지친 친구에게 국화를 보내는
추천은 만들 수 없다. 서리를 견디는 사군자 결(china/ancient·repeated)도 **선물 관행이
아니라 문인화 전통**이라 관계×마음 어느 칸에도 앉힐 수 없었다.

### 3.2 가점 1행 — lily-asiatic

브리프대로 회피 규칙(rule-006)이 이미 있는 꽃이라 가점은 최소로만 검토했다. §4.4.

### 3.3 가점 2행에 그친 꽃과 그 이유

| 꽃 | 왜 적은가 |
|---|---|
| **cosmos** | 꽃말 3행 · 이야기 3편이 전부다. 셋 다 어원(질서·보석)과 계절 소식이라 마음 축이 `just_because` 하나로 수렴한다 |
| **magnolia** | 이야기 7편 중 confession 2편을 뺀 나머지가 전부 just_because 다. 목련 꽃말은 "꾸미지 않은 것"·"자연을 사랑하는 마음" 이라 선물 상황으로 번역되는 폭이 좁다 |
| **cherry-blossom** | 절화보다 **풍경의 꽃**이다. 이야기 6편 중 4편이 just_because, 나머지 2편은 전쟁 관련 comfort 라 선물 자리에 못 쓴다 |
| **camellia** | 꽃말 4행이 전부 repeated 로 튼튼한데, 그 4행이 사랑·기다림·기품 한 덩이로 겹쳐 있어 축을 나눌 수가 없다 |
| **narcissus** | 눈여겨보는 마음(repeated)이 고백 쪽 근거지만, 같은 표에 "자기애로 읽힐 수 있어요" caution 이 있다. 밀어 올릴 수 없어 70 에서 멈췄다 |
| **hyacinth** · **freesia** · **rose-red** | 기존 규칙이 이미 있어 **빈 축만** 채웠다 |

### 3.4 세우고 싶었지만 근거가 없어 뺀 것

- **병문안 상황.** 향 0 · 화분 형태 · 오래 가는 꽃(gerbera · lisianthus · phalaenopsis)이
  적합하지만, `occasion` 은 엔진이 읽지 않는 자유 문자열이고 `intent` 에 병문안이 없다.
  `comfort` 로 뭉뚱그리면 "지친 친구" 와 섞인다. **어휘가 생기면 그때 세울 자리다.**
- **결혼 축하.** `celebration` 안에 결혼이 접혀 있는데, peony·lily-asiatic·
  lily-of-the-valley 처럼 결혼 근거가 뚜렷한 꽃과 개업 축하 꽃(gerbera·phalaenopsis)이
  같은 칸을 나눠 쓴다. `occasion=wedding` 을 한 행(rule-172)에만 적어 뒀지만 엔진은 못 읽는다.
- **색 조건.** 규칙표에 색 컬럼이 없다. 카네이션 [yellow] 경멸 · [variegated] 거절합니다
  같은 **색 단위 금기**는 꽃 단위 회피로 옮기면 꽃 전체를 죽인다. 색 안내는
  `buildColorSuggestion`(explain.ts) 이 이미 꽃말과 함께 하고 있으므로 손대지 않았다.

---

## 4. 판단이 갈린 지점 (Advisor 확인 요청)

### 4.1 ⚠ 회피 행이 대체안 풀에 들어간다 — 엔진 쪽 함정

`src/lib/engine/explain.ts` 193~199행:

```ts
const intentFlowerIds = new Set(
  rules.filter((r) => r.intent !== undefined && r.intent === input.intent).map((r) => r.flowerId),
);
```

`fit_score` 유무를 **가리지 않는다.** score.ts 는 `bestFit` 에서 회피 행을 건너뛰지만
(62행, 주석까지 붙어 있다), 대체안 풀은 같은 방어를 하지 않는다. 그래서
`intent=celebration` 요청에서 국화가 `substitutes` 로 얼굴을 내밀 수 있다 — **축하
자리에는 놓지 않는 꽃이라고 우리가 방금 적어 둔 그 꽃이다.**

기존에도 rule-006(lily-asiatic·apology) 하나가 같은 경로에 있었지만, part1 이 회피를
8행으로 늘리면서 눈에 띄는 크기가 된다. part2 까지 합치면 더 커진다.

한 줄 고침으로 막힌다:

```ts
rules.filter((r) => r.fitScore !== undefined && r.intent === input.intent)
```

`src/` 는 이 작업의 읽기 전용 범위라 손대지 않았다. **Advisor 판단 요청.**

### 4.2 우리 데이터가 스스로 갈리는 세 자리

회피 규칙을 세울지 말지가 여기서 갈렸다. **셋 다 회피를 세우지 않았다** — 우리 표가
같은 상황을 두고 정반대로 말할 때는 규칙이 아니라 기록으로 남기는 게 맞다고 봤다.

| 꽃·상황 | 반대편 | 판단 |
|---|---|---|
| **hyacinth + celebration** | [purple] 깊은 슬픔과 애도 caution 은 "축하 자리에서는 뜻이 어긋납니다" ↔ story-hyacinth-nowruz(새해 상 위의 히아신스) · story-hyacinth-hyacinthia 는 **intents 에 celebration** | 회피 안 세움 · 가점도 안 세움. 축하 축을 통째로 비웠다 |
| **peony + celebration** | 혼자인 처지를 빗댄 꽃(korea/7c·varies) caution 이 축하 자리를 지목 ↔ 부귀와 영화(china/tang·**repeated**) + 부귀 영화 성실(korea/modern·**repeated**) | 가점(86)을 세웠다. repeated 2행이 varies 1행보다 무겁다고 봤다 |
| **tulip-white + celebration** | [white] 부와 열광 한 시대를 흔든 욕망(netherlands/17c) caution 이 축하 자리를 지목 ↔ [white] 새로운 시작 봄의 설렘(korea/modern) | 가점(80)을 세웠다. 튤립 버블 caution 은 **17세기 네덜란드 맥락**이고 국내 선물 자리와 겹치지 않는다 |

### 4.3 근거를 뒤집어 읽은 두 건

- **hydrangea ⛔confession** — story-hydrangea-otaksa 는 `intents` 에 `confession` 이
  적혀 있다(시볼트가 연인 이름을 꽃 이름에 숨긴 이야기). 하지만 결말이 이별이고,
  `meanings` 의 [blue] 변덕은 **repeated** 이며 caution_note 가 "고백 자리에서는
  오해될 수 있어요" 라고 직접 적는다. 꽃말 쪽을 택했다.
- **camellia** — story-camellia-whole-head 에 "무사의 목이 떨어지는 것 같다며 꺼렸다"
  는 기피 관행이 나온다. 병문안 회피의 근거가 될 만하지만, **이야기 자신이 곧바로
  뒤집는다**("시들어 가는 모습을 보이지 않기로 한 거예요"). 회피를 세우지 않았다.

### 4.4 lily-asiatic 을 1행 세운 근거

브리프의 경고("반려묘 위험 종이라 근거 없이 밀지 마라")를 이렇게 지켰다.

- **세운 것**: `(spouse, anniversary, 76)` 한 행. story-lily-baihe-wedding —
  百合의 발음이 결혼 축사 百年好合 과 겹쳐 중국에서 오래 가는 결혼의 표시가 됐다는,
  `intents` 에 `celebration|anniversary` 가 붙은 이야기다.
- **안 세운 것**: 축하·위로·감사 축. 특히 **밀폐 공간이 따라오는 자리에는 한 행도 안
  뒀다.** 고양이에게 `life_threatening` 인 꽃을 가점으로 밀어 올리는 것 자체가 결이
  어긋난다(안전 제외는 엔진이 하더라도).
- 점수 76은 같은 근거 강도의 다른 꽃들과 같은 띠다. 위험 종이라고 깎지는 않았다 —
  깎으면 점수의 뜻이 "적합도" 에서 "적합도 곱하기 안전" 으로 흐려진다.

**빼도 좋다면 빼도 된다.** 이 1행은 있으면 배우자·기념일 조합에서 후보 하나가 느는
것뿐이고, 없다고 다른 규칙이 무너지지 않는다.

### 4.5 `aesthetic_tags` 를 비운 것

기존 7행의 값(`romantic|classic` · `light|fresh` · `minimal|clean` · `fresh|light` ·
`casual|round` · `elegant|calm`)은 **어느 어휘표에도 없다.** `flowers.csv` 의
`aesthetic_tags` 는 `minimal|calm|cute|vivid|elegant` 5종이고, 겹치는 건 rule-007 의
`elegant|calm` 하나뿐이다. `crossValidate` 도 이 컬럼은 검사하지 않는다(rules 는
`relationship_type`·`intent` 두 컬럼만 어휘 검사).

세 갈래가 있었다: ① 기존 6행처럼 자유롭게 짓는다 ② `flowers.csv` 어휘로 통일한다
③ 비운다. **③을 택했다** — ①은 어휘를 73행만큼 더 늘리고, ②는 기존 6행과 어긋나는
새 규범을 worker 가 혼자 정하는 셈이 된다. 엔진이 안 읽는 컬럼이라 지금은 손해가 없다.

어느 쪽으로든 통일하려면 **기존 7행까지 함께 고쳐야** 하므로 Advisor 결정 사항으로 남긴다.

### 4.6 carnation ⛔confession — 유일하게 caution_note 없이 세운 회피

회피 8행 중 7행은 `meanings.caution_note` 가 그 마음을 직접 이름으로 지목한다.
rule-133 하나만 다르다.

근거는 caution 이 아니라 **관행의 강도**다. [red] 5월 8일 가슴에 다는 꽃
(korea/modern·**repeated**) + 어버이날·스승의 날 이야기 2편이 말하는 건, 한국에서
카네이션이 부모와 스승 쪽으로 **의미가 점유돼 있다**는 사실이다. 좋아하는 사람에게
카네이션을 건네면 마음이 다르게 읽힌다.

추론이 한 단계 들어간 유일한 회피 행이므로 표시해 둔다. 문턱을 엄격히 지키려면 **이
행만 빼면 된다.**

---

## 5. 검증

스크래치패드 스크립트로 직접 돌렸다(리포에 남기지 않음).

### 5.1 part1 단독

```
행 수: 73 · 스키마 통과 73 · 오류 0
가점 65행 · 최저 70 · 중앙값 78 · 최고 92 · 평균 78.2
구간: 70~74:20 · 75~79:20 · 80~84:18 · 85~89:4 · 90~94:3
파일 위생: 이상 없음(BOM 없음 · LF · 끝 개행 · 따옴표 없음)
결과: PASS
```

- `RuleRowSchema` 통과 — 어휘(`relationship_type`·`intent`) · 범위(`fit_score` 0~100) ·
  **XOR**(`fit_score` ⊕ `avoid_reason`) 전부 통과
- `flower_id` 73건 모두 `flowers.csv` 에 실재 · 담당 27종(+lily-asiatic) 밖 0건
- `rule_id` 중복 0 · 기존 `rules.csv` 7건과 충돌 0
- CSV 위생: UTF-8 BOM 없음 · LF · 따옴표 0개(모든 필드에 쉼표·줄바꿈 없음)

### 5.2 병합 dry-run (rules.csv + part1 을 **메모리에서만** 합침)

```
[OK] 참조 1263건 모두 flowers.csv 안에 있음 — 59종
[OK] rules 80행 · templates 31행 · stories 438편 · quotes 77행 · reads 54행 모두 어휘 안에 있음
… 교차 검증 9종 전부 OK
병합 dry-run: 스키마 오류 0 · 교차 오류 0 → PASS
```

7 + 73 = 80행으로 전체 `crossValidate` 를 통과한다.

### 5.3 기존 테스트

`npx vitest run` → **779 passed · 2 failed**. 실패 2건은 이 작업과 무관한
**선행 실패**다(`tests/seed/schemas.test.ts`).

- `expect(SEED_FILE_KEYS).toHaveLength(10)` → 실제 11 (`reads.csv` 가 들어오며 늘어남)
- `expect(checks).toHaveLength(8)` → 실제 9 (교차 검증 항목이 하나 늘어남)

둘 다 상수 개수 단언이고, `content/rules.part1.csv` 는 **어떤 로더도 읽지 않는다** —
`src/lib/data/catalog.ts`·`db/seed/seed.ts`·`scripts/build-demo-catalog.mjs` 전부
파일명을 명시해서 읽고, `content/` 를 훑는 코드는 없다. 병합 전까지 part1 은 불활성이다.

---

## 6. 병합 결정 2026-08-18

`content/rules.part1.csv` (rule-100~172, 73행) 과 `content/rules.part2.csv` (rule-200~272, 73행) 을
기존 `content/rules.csv` (rule-001~007, 7행) 뒤에 **번호순으로** 합치면서, 두 파트가 서로 다른
잣대로 쓴 자리를 하나로 맞췄다. part 파일 둘은 병합 후 삭제했다.

### 6.1 적용한 결정

| # | 결정 | 이 문서에 미치는 영향 |
|---|---|---|
| 1 | **`relationship_type` 기준은 part2 의 것** — 근거가 관계 자체를 말할 때만 채운다 | part1 의 relationship 채운 65행을 전수 감사 → **18행 유지 · 47행 비움** (§6.2) |
| 2 | **회피 문턱 통일** — 추론 근거 회피 2행 삭제 | `rule-133`(carnation ⛔confession · §4.6 에서 스스로 "유일하게 caution_note 없이 세운 회피"라 적은 행) 삭제. part2 쪽은 달리아 `rule-223` 삭제 |
| 3 | **`aesthetic_tags`** — 신규 행은 전부 공란 유지, 기존 6행 값도 그대로 둔다 | §4.5 결론 유지. 지우면 diff 만 늘어나므로 손대지 않았다 |
| 4 | **`occasion` 어휘 정리** — part2 의 `farewell` 을 기존 `job-change` 로 통일 | part1 의 `job-change`(rule-104·106) 와 겹치는 자리였다. 나머지 신규 어휘는 유지 |
| 5 | **`lily-asiatic` 1행 유지** | §4.4 그대로. 반려묘 케이스는 엔진의 제외 규칙이 막는다 |
| 6 | **`rule_id` 번호대 유지** (001~007 · 100번대 · 200번대), 병합 순서는 번호순 | 재번호 없음 |

**잣대 하나로 말하면 이렇다.** 회피는 우리 데이터가 **직접 경고한 것만** 세운다(관행 추론 금지).
`relationship_type` 은 근거가 **사이를 직접 가리킬 때만** 채운다(상황·분위기 추론 금지).

### 6.2 `relationship_type` 전수 감사

**왜 비우는가.** `scoreCandidate()` 는 R 을 `rows.filter(r => r.relationship === input.relationship)`
의 `fitScore` 최댓값으로 잡는다 — **intent 를 보지 않는다**(`src/lib/engine/score.ts:367`).
즉 `relationship` 을 채우면 그 꽃은 **그 관계의 모든 자리에서** 상시 가점을 받는다.
`friend/comfort` 근거로 채운 `friend` 가 `friend/confession`·`friend/apology` 에도 가점을 붙인다.
근거가 상황만 말하고 사이를 말하지 않으면, 그 가점은 근거 없이 붙은 것이다.

**판정 기준.** 근거(꽃말 행·이야기)를 실제로 열어, 그 글이

- 사이를 이름으로 부르거나 (`우정`·`벗`·`신부`·`어머니`·`누나`·`부부`),
- 사이의 갈래를 가리키는 말을 쓰거나 (`정열적인 사랑`→lover, `첫사랑`·`남몰래 품은 사랑`·
  `앞에 나서지 않는 마음`→crush, `변치 않는/한결같은 사랑`·`정절`→spouse),
- 주고받는 사람이 정해진 관행을 말할 때 (어버이날 · 직장 승진·개업)

**유지**, 그 밖은 **비움**. 비운 행은 `note` 끝에 `병합 감사에서 relationship 비움(사유)` 를 달았다.

#### 유지 18행

| rule_id | 꽃 | 값 | 근거가 사이를 말하는 대목 |
|---|---|---|---|
| rule-100 | rose-red | lover | 꽃말 `[red] 열정적인 사랑과 깊은 애정`(western/victorian·repeated) — 사랑의 갈래를 직접 말한다 |
| rule-122 | hydrangea | spouse | 꽃말 `[blue] 인내심 있는 사랑`·`[green] 한결같은 사랑` — 오래 이어진 사이. lisianthus·babys-breath 와 같은 눈금 |
| rule-123 | hydrangea | family | 꽃말 `둘러앉은 자리 — 가족과 화목` — **가족**을 이름으로 부른다 |
| rule-131 | carnation | family | `5월 8일 가슴에 다는 꽃` · story-carnation-korea-1956-mothers-day — 어버이날은 자식→부모로 방향이 정해진 관행 |
| rule-134 | lisianthus | spouse | 꽃말 `변치 않는 사랑`(korea/modern·repeated) |
| rule-137 | ranunculus | crush | story-ranunculus-persian-prince — "마음을 말로는 못 하고 노래만 불렀다 … 대답을 받지 못한 노래" |
| rule-142 | lily-of-the-valley | spouse | story-lotv-faberge-egg — 1898년 부활절에 **니콜라이 2세가 황후 알렉산드라에게** 준 달걀 |
| rule-146 | narcissus | crush | 꽃말 `눈여겨보는 마음 — 곁에 두고 계속 바라보게 되는 사람에게` · `[yellow] 답장을 기다리는 마음` |
| rule-152 | camellia | lover | 꽃말 `[red] 사랑에 빠진 마음` · story-camellia-dumas(동백의 색으로 **연인에게** 보내던 신호) |
| rule-153 | camellia | lover | 같은 story-camellia-dumas 의 anniversary 축 |
| rule-154 | violet | crush | 꽃말 `[purple] 겸손 — 앞에 나서지 않는 마음` · story-violet-sappho |
| rule-155 | violet | family | story-violet-saintpaulia-father-son — **아버지에게** 보낸 씨앗 한 봉지 |
| rule-160 | daisy | crush | 꽃말 `숨겨진 사랑` · story-daisy-dickinson-master-letters(사랑 편지에 데이지라 서명) |
| rule-161 | daisy | spouse | story-daisy-russia-family-day — 가족과 사랑과 **정절**의 날 · 결혼 25년을 넘긴 **부부**의 메달에 새긴 꽃 |
| rule-164 | babys-breath | spouse | 꽃말 `[white] 변치 않는 사랑`(korea/modern) |
| rule-168 | magnolia | crush | story-magnolia-north-facing — "북쪽에 사는 사내를 마음에 둔 공주" |
| rule-170 | phalaenopsis | colleague | story-phalaenopsis-korea-auction-halved — "승진하면 보내고, 가게를 열면 보냈죠" · 청탁금지법이 그 거래를 반으로 줄인 기록 |
| rule-172 | lily-asiatic | spouse | story-lily-baihe-wedding — 百年好合, **결혼** 축사가 곧 이름인 꽃 |

#### 비움 47행

| rule_id | 꽃 | 원래 값 | 비운 이유 |
|---|---|---|---|
| rule-101 | rose-red | spouse | rule-100 과 같은 근거뿐. "함께 지나온 시간"은 근거가 아니라 내 해석이었다 |
| rule-102 | tulip-white | spouse | `용서를 구하는 마음과 새로운 시작` 은 자리를 말하지 사이를 말하지 않는다 |
| rule-103 | tulip-white | friend | 같은 꽃말. "친구 사이 사과는 격식이 덜해"는 근거 밖 |
| rule-104 | tulip-white | colleague | `새로운 시작` 은 상황(이직)이지 직장 관계가 아니다 |
| rule-105 | freesia | friend | 졸업 관행은 **주는 사람을 가리지 않는다**(가족도 친구도 준다) |
| rule-106 | freesia | colleague | 꽃말이 말하는 것은 `우정` 이지 직장 관계가 아니다 |
| rule-107 | gerbera | friend | 화환 이야기는 놓이는 자리만 말한다 |
| rule-108 | gerbera | colleague | story-gerbera-korea-wreath·story-krwreath-three-tier 는 화환이 **서 있는 자리**만 적었다. 보내는 쪽까지 적은 rule-170 과 여기서 갈린다 |
| rule-109 | gerbera | friend | `언제나 곁에 있는 밝은 응원` 은 사이를 가리지 않는다 |
| rule-110 | anemone | friend | 위로 이야기 3편 어디에도 친구가 없다 |
| rule-111 | anemone | lover | story-anemone-adonis-blood 은 **연인을 잃은 애도**다. 연인 사이 전반을 말하지 않는다 |
| rule-113 | hellebore | friend | `내 불안을 가라앉혀 주세요` 는 청하는 말이지 사이가 아니다 |
| rule-114 | hellebore | lover | story-hellebore-madelon-tears 는 아기 예수 앞의 양치기 소녀 — 연인 사이가 아니다 |
| rule-115 | hellebore | spouse | `꽃잎이 아니어서 지지 않는다` 에 결혼이 없다 |
| rule-116 | hyacinth | friend | 아폴론 설화는 **사랑하던 사이**의 죽음이다. friend 를 가리키지 않는다 |
| rule-117 | hyacinth | spouse | 같은 설화 + `용서해 주세요`. 결혼이 없다 |
| rule-118 | peony | family | 부귀영화를 비는 말은 받는 사람을 가리지 않는다 |
| rule-119 | peony | spouse | `부귀·영화·성실` 의 성실은 세속의 덕목이지 부부의 언약이 아니다 |
| rule-120 | peony | lover | `수줍음` 은 crush 쪽 신호다(part2 의 시클라멘 rule-231 과 같은 말). lover 를 가리키지 않는다 |
| rule-125 | lavender | friend | `씻어 내는 일` 에 사이가 없다 |
| rule-126 | lavender | family | 같은 근거 |
| rule-128 | sunflower | family | `존경` 은 받는 사람을 가리지 않고, 고흐 이야기는 오히려 **친구**가 쓸 방 이야기다 |
| rule-129 | sunflower | colleague | 같은 `존경`. 직장 관행이 근거에 없다 |
| rule-130 | sunflower | friend | 페르보마이스크·호피 이야기에 사이가 없다 |
| rule-132 | carnation | colleague | 근거가 말하는 것은 **스승과 제자** 사이인데 어휘에 그 칸이 없어 `colleague` 로 바꿔 적은 값이었다. 바꿔 적은 값은 "근거가 직접 말한 것"이 아니다 |
| rule-135 | lisianthus | lover | rule-134 와 같은 `변치 않는 사랑` — 지속 계열은 spouse 를 가리켜 rule-134 한 자리로 받는다 |
| rule-136 | lisianthus | lover | story-lisianthus-good-mouth 는 이름의 유래다 |
| rule-138 | ranunculus | lover | rule-137 과 같은 근거. 그 근거가 가리키는 것은 대답을 못 받은 쪽(crush)이다 |
| rule-140 | lily-of-the-valley | friend | `돌아오는 행복`·`5월 1일의 행운` 에 사이가 없다 |
| rule-141 | lily-of-the-valley | lover | story-lotv-tchaikovsky 는 작곡가가 **꽃을 두고** 쓴 시다 |
| rule-145 | narcissus | friend | 위로 이야기 3편에 친구가 없다 |
| rule-147 | forget-me-not | lover | `진실한 사랑`·`잊지 않겠다는 약속` 둘 다 사이의 갈래를 가리지 않는다 |
| rule-148 | forget-me-not | crush | story-forget-me-not-danube 는 "기사가 **연인과** 도나우 강가를 걷다가" — 이미 연인인 두 사람이라 crush 가 아니다 |
| rule-149 | forget-me-not | friend | 추모의 꽃 이야기에 친구가 없다 |
| rule-150 | cherry-blossom | friend | `봄이 왔다는 소식`·`다정함` 에 사이가 없다 |
| rule-151 | cherry-blossom | lover | 같은 근거 |
| rule-156 | violet | friend | `소박한 행복` 에 사이가 없다 |
| rule-157 | iris | friend | `전하고 싶은 말·소식` 에 사이가 없다 |
| rule-158 | iris | lover | `변치 않음` 이 걸린 말은 **소식**이지 사랑이 아니다 |
| rule-159 | iris | friend | story-iris-van-gogh 는 요양원 정원 이야기다 |
| rule-162 | daisy | friend | `순수한 마음` 에 사이가 없다 |
| rule-163 | babys-breath | friend | 졸업 관행은 주는 사람을 가리지 않는다(rule-105 와 같은 판정) |
| rule-165 | babys-breath | friend | story-krbouquet-babysbreath-half 는 꽃다발 구성 이야기다 |
| rule-166 | cosmos | friend | `가을이 왔다는 소식`·`가지런함` 에 사이가 없다 |
| rule-167 | cosmos | lover | 같은 근거 |
| rule-169 | magnolia | friend | `꾸미지 않은 것` 에 사이가 없다 |
| rule-171 | phalaenopsis | family | rule-170 과 같은 이야기인데, 그 이야기가 말하는 것은 **직장 관행**이지 가족이 아니다 |

#### 감사가 남긴 사실

- part1 은 relationship 을 채웠던 65행 중 18행만 살아남았다(72행 기준 25%).
  part2 는 72행 중 27행(38%)이 채워져 있다 — 같은 잣대를 쓰고도 part1 쪽이 낮은 것은,
  part1 의 꽃들이 상황(위로·축하·졸업)으로 걸리는 근거가 많고 사이를 이름으로 부르는 꽃말이
  적기 때문이다. 어느 쪽이든 이제 두 파트가 같은 문턱 위에 서 있다.
- **비워도 가점이 사라지지 않는다.** I(intent) 는 그대로 걸리므로, 예컨대 rule-105(freesia
  celebration 90)는 졸업 자리에서 여전히 1등 근거다. 없어지는 것은 "그 관계의 모든 자리에
  붙던 상시 가점"뿐이다.
- part1 에서 `friend` 는 한 행도 살아남지 못했다. `friend` 가점은 기존 rule-004(freesia 85)
  와 part2 의 4행(zinnia·geranium×2·alstroemeria)이 받는다.

### 6.3 회피 2행 삭제

- **`rule-133` (carnation ⛔confession)** — §4.6 에서 스스로 적었듯 이 표에서 유일하게
  `caution_note` 없이 관행 추론만으로 세운 회피였다. 나머지 회피 7행은 전부 꽃말 행의
  `caution_note` 가 그 자리를 직접 지목한다.
- **`rule-223` (dahlia ⛔confession)** — part2 문서가 "근거가 가장 얇음, 덜어낸다면 첫 후보"
  라 적은 행. `varies` 끼리 갈리는 원전 차이를 회피로 세운 자리였다.

남은 회피 19행은 모두 `caution_note` 가 그 자리(축하·고백·사과·감사)를 직접 지목한다.

### 6.4 최종 수치

```
rules.csv 151행 = 가점 132 + 회피 19
  기존   7행 (가점 6 · 회피 1)
  part1 72행 (가점 65 · 회피 7)   <- 73행에서 rule-133 삭제
  part2 72행 (가점 61 · 회피 11)  <- 73행에서 rule-223 삭제

꽃 59종 중 규칙 보유 58종 (가점 보유 57 · 회피 보유 15)
  규칙 0종: eucalyptus
  회피만: chrysanthemum
relationship 채운 행 52 / 151
  crush 14 · lover 12 · spouse 10 · family 7 · friend 6 · colleague 3
```

`npm run seed` -> **exit 0 · 교차 검증 9종 전부 OK · `rules.csv 151행`** 이 리포트에 그대로 찍힌다.

### 6.5 병합이 드러낸 것 — `tests/flow/actions.test.ts` 1건

`예산 '기타' 는 가격대 필터를 걸지 않는다 (band 1~3 전부 후보)` 가 깨진다.
`friend`/`gratitude`/2026-08-16 · 예산 무제한의 상위 3안이 **전부 `priceBand=1`** 이라
`some(priceBand > 1)` 이 false 가 된다.

```
alstroemeria band=1 total=0.6620 I=0.84 R=0.84 S=1
geranium     band=1 total=0.6510 I=0.82 R=0.82 S=1
freesia      band=1 total=0.5625 I=0.85 R=0.85 S=0.3
carnation    band=1 total=0.4760 I=0.92 R=0.00 S=1
hydrangea    band=2 total=0.4400 I=0.80 R=0.00 S=1   <- 첫 band 2
```

**이 감사 때문이 아니다.** 감사를 적용하지 않은 단순 병합(151행 + relationship 원본값)으로도
같은 테스트가 깨지고, 병합 전 7행으로 되돌리면 통과한다 — 규칙표가 7행에서 151행으로 자란
사실 자체가 원인이다. `friend` R 가점을 받는 꽃(freesia·zinnia·geranium·alstroemeria·bouvardia)
이 대부분 `priceBand=1` 이고, 첫 `band 2`(hydrangea) 와의 격차가 0.12 라 D(가중치 0.05)로는
뒤집히지 않는다.

이 테스트는 **소유 밖 파일**(`tests/flow/actions.test.ts`)이고, 규칙 행을 더하거나 점수를 올려
통과시키는 것은 이 작업의 권한 밖이라 손대지 않았다. Advisor 판단이 필요하다.
