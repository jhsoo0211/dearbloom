import type { Metadata } from 'next';
import Link from 'next/link';

import styles from './partners.module.css';

/**
 * `/partners` — 함께하는 꽃집.
 *
 * 확정 시안 `design/landing-v3/partners.html` 을 서버 컴포넌트로 옮긴 정적 화면이다.
 * 워딩은 §1.5d 개정본(이야기·설화 톤) 기준 — 이 페이지는 **해요체로 통일**돼 있다(FX 라운드).
 *
 * 시안에 있던 스크롤 진입 페이드는 옮기지 않았다. 페이드가 없어도 정보가 그대로 읽히고,
 * 그 효과 하나 때문에 이 화면 전체를 클라이언트 컴포넌트로 만들 이유가 없다.
 *
 * ── 가상 예시 → 실존 큐레이션 (2026-08-16) ──────────────────────────
 * 예전 이 자리에는 지어낸 상호 3곳(`밤의 온실`·`튤립과 편지`·`초저녁 식물상회`)과
 * 갈 곳 없는 비활성 버튼이 있었다. 예시라고 고지는 했지만 **갈 수 있는 곳이 하나도 없는
 * 소개 페이지**였다. 지금은 실존 확인·링크 검증을 마친 곳만 싣는다.
 *
 * 근거 원장은 `docs/partners-research.md` 다. 선정 기준(실존·링크 생존·내용 실재·
 * 취지 검증 가능·편중 금지)과 **제외한 후보의 사유**까지 거기 적혀 있다.
 * ⚠ 이 목록에 한 줄 더하기 전에 그 문서의 「취지 근거」 칸을 채울 수 있는지 먼저 보라.
 *   채울 수 없으면 넣지 않는다. 링크가 죽으면 문구를 고치지 말고 **항목을 빼라.**
 *
 * ── 아직 없는 길은 링크로 만들지 않는다 (접근성 리뷰 P2-11) ───────────
 * 갈 곳 없는 자리를 `href="#"` 로 두면 화면 낭독기에는 **멀쩡한 링크**로 읽히고, 누르면
 * 페이지 맨 위로 튄다. 그래서 갈 곳이 생길 때까지는 비활성 버튼 + 준비 중 한 줄로 둔다.
 * 반대로 이제 갈 곳이 **생긴** 자리(큐레이션 9곳·시장 1곳)는 전부 진짜 외부 링크다.
 *
 * ── 새 창 안내 (접근성 리뷰 P1-6) ────────────────────────────────────
 * 외부 링크는 새 탭으로 열리므로 `.srOnly` 로 "(새 창)" 을 미리 알린다 — 도감의 출처 링크와
 * 같은 패턴이다. 창이 바뀐 뒤에야 알아채면 돌아올 길을 잃는다.
 *
 * ── 랜드마크 (접근성 리뷰 P1-6) ──────────────────────────────────────
 * 본문 세 절은 `<main>` 안에 있다. `.siteHead` 는 `.intro` 위에 겹쳐 놓는 요소라 DOM 자리를
 * 옮기지 않고 그대로 둔다(그래서 banner 랜드마크는 되지 않는다 — 대신 로고·보조 메뉴가
 * 전부 main 안에 담겨 미아 영역이 남지 않는다).
 */

export const metadata: Metadata = {
  title: '함께하는 꽃집 — dearbloom',
  description:
    'dearbloom은 마음에 어울리는 꽃과 그 꽃에 얽힌 이야기를 고르고, 마지막 한 걸음은 가까운 꽃집으로 이어드려요. 공공이 운영하거나 좋은 취지로 꽃을 다루는 곳부터 소개해요.',
};

function ArrowGlyph() {
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden="true">
      <path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

interface Place {
  key: string;
  /** 지역 표기 — 온라인만 있는 곳은 `온라인` 으로 적는다(있지도 않은 주소를 지어내지 않는다). */
  where: string;
  name: string;
  url: string;
  desc: string;
  /**
   * 기대와 실제가 어긋날 수 있는 곳에만 붙이는 한 줄.
   * ⚠ 이건 장식이 아니라 **정직 장치**다. "바로 살 수 있는 줄 알았는데" 를 미리 막는다.
   *   근거는 `docs/partners-research.md` 의 각 항목 「정직 주의」.
   */
  caveat?: string;
}

interface Group {
  key: string;
  no: string;
  title: string;
  /** 갈래의 취지 한 줄 — §1.5d 이야기 톤. */
  say: string;
  places: Place[];
}

/**
 * 실존 큐레이션 9곳 — 전부 `docs/partners-research.md` 에서 링크·취지를 검증했다.
 *
 * ⚠ 개별 점포는 넣지 않는다. 예컨대 양재꽃시장 안 특정 점포 페이지는 실재하지만
 *   **한 가게만 띄우는 셈**이라 편중이 된다. 시장은 언제나 대문으로 건다.
 *   (갈래 04 의 `e경남몰 화훼관` 은 점포가 아니라 공공몰 안의 **칸**이라 예외가 아니다.
 *    그 칸이 사라지면 대문으로 내리지 말고 항목을 빼라 — 화훼를 안 판다는 뜻이니까.)
 */
const CURATION: Group[] = [
  {
    key: 'work',
    no: '01',
    title: '일자리가 되는 꽃',
    say: '꽃을 파는 일이 누군가의 일자리가 되는 곳이에요.',
    places: [
      {
        key: 'flipflower',
        where: '서울 양천',
        name: '플립플라워',
        url: 'https://flipflower.co.kr/',
        desc: '청각장애 플로리스트를 길러 직접 고용하는 꽃 정기구독이에요.',
      },
      {
        key: 'bearbetter',
        where: '서울 성동',
        name: '베어베터',
        url: 'https://www.bearbetter.net/b2b/business/',
        desc: '발달장애인 사원이 플로리스트와 함께 꽃다발과 화분을 만들어요.',
        caveat: '기업 주문 위주라 개인 주문은 어려울 수 있어요.',
      },
      {
        key: 'gachiilteo',
        where: '온라인',
        name: '같이일터',
        url: 'https://gachiilteo.or.kr/',
        desc: '한국장애인고용공단이 장애인 표준사업장 생산품을 모아 둔 곳이에요. 식물류 칸에 화환이 있어요.',
      },
    ],
  },
  {
    key: 'public',
    no: '02',
    title: '공공이 열어 둔 꽃',
    say: '모두의 몫으로 열어 둔 시장이라, 드나듦도 값도 가려져 있지 않아요.',
    places: [
      {
        key: 'yangjae',
        where: '서울 서초',
        name: '양재꽃시장 (aT화훼공판장)',
        url: 'https://flower.at.or.kr/yfmc/',
        desc: '1991년에 열린, 전국에서 가장 큰 화훼 공영도매시장이에요.',
        caveat: '점포마다 여는 시간이 달라요 — 가기 전에 확인해 주세요.',
      },
      {
        key: 'flowerinfo',
        where: '온라인',
        name: '화훼유통정보시스템',
        url: 'https://flower.at.or.kr/',
        desc: '오늘 꽃이 얼마에 팔렸는지, 경매 결과를 그대로 공개해요.',
        caveat: '여기 값은 도매 경매가예요. 꽃집에서 사는 값과는 달라요.',
      },
    ],
  },
  {
    key: 'growers',
    no: '03',
    title: '기른 사람 쪽에 서는 꽃',
    say: '꽃을 길러 낸 손에게 값이 더 돌아가도록 서 있는 곳이에요.',
    places: [
      {
        key: 'kflower',
        where: '경기 고양',
        name: '한국화훼농협',
        url: 'https://kflower.nonghyup.com/user/indexMain.do?siteId=kflower',
        desc: '화훼 농가가 조합원인 품목농협이에요. 고양에서 공판장과 직판장을 열어요.',
        caveat: '조합원 중심이라 온라인으로 바로 사기는 어려워요.',
      },
      {
        key: 'jnmall',
        where: '전남 · 온라인',
        name: '남도장터',
        url: 'https://www.jnmall.kr/',
        desc: '전라남도가 조례로 세운 재단이 운영하는 공공 쇼핑몰이에요. 화훼 칸이 따로 있어요.',
      },
    ],
  },
  /**
   * 04 — 2026-08-17 추가. 사용자 지적: "지역 특산물로 꽃이 나오거나 공익적인 취지 or
   * 공공기관 쪽에서 운영하는 꽃집을 넣어 달라고 했는데 안 넣은 것 같아".
   *
   * 공익·공공 축은 위 세 갈래에 이미 다섯 곳이 있었지만, **지역 특산 축은 남도장터 하나뿐**이라
   * 실제로 비어 있었다. 그리고 위 세 갈래는 도매·조합원 전용·기업 주문이 섞여 있어
   * **"오늘 개인이 살 수 있는 곳"이 드물다.** 이 갈래는 그 두 구멍을 같이 메운다.
   *
   * ⚠ 그래서 이 갈래에 넣을 곳의 조건이 하나 더 있다 — **개인이 지금 주문할 수 있을 것.**
   *   그 조건을 못 채우면 위 세 갈래 중 맞는 곳으로 보내라.
   */
  {
    key: 'publicmall',
    no: '04',
    title: '공공 창구로 바로 사는 꽃',
    say: '지역이 기른 꽃을, 공공이 열어 둔 창구에서 오늘 바로 살 수 있어요.',
    places: [
      {
        key: 'epostflower',
        where: '온라인 · 전국',
        name: '우체국 꽃배달',
        url: 'https://mall.epost.go.kr/fo/pavln/flowerSend.do',
        desc: '국내 화훼농가를 키우려고 1998년에 연 우체국 서비스예요. 전국 우체국이 그 지역 화원과 이어 줘요.',
        caveat: '정해진 상품 안에서 고르는 곳이라 추천받은 꽃이 없을 수도 있어요.',
      },
      {
        key: 'egnmall',
        where: '경남 · 온라인',
        name: 'e경남몰 화훼관',
        url: 'https://egnmall.kr/kwa-ABS_goods_l-1036',
        desc: '경상남도가 운영하는 농특산물 쇼핑몰이에요. 화훼 칸에 김해에서 올라온 생화가 있어요.',
        caveat: '올라와 있는 품목이 몇 가지뿐이고, 철마다 달라져요.',
      },
    ],
  },
];

/**
 * 고속버스터미널 꽃도매상가 — 개별 점포가 아니라 **시장 자체**를 안내한다.
 *
 * ⚠ 시간은 안내처마다 다르다. 서울시(정보소통광장)는 생화 23:00~13:00 으로,
 *   한국관광공사(열린관광)는 23:30~12:00 으로 적는다. 하나로 우겨넣지 말고
 *   **서울시 기준 + 확인 한 줄**로 둔다 — 새벽에 헛걸음하는 것이 제일 나쁘다.
 */
const MARKET = {
  where: '서울 서초',
  name: '서울고속버스터미널 꽃도매상가',
  url: 'https://opengov.seoul.go.kr/civilappeal/2894973',
  linkLabel: '서울시 안내에서 보기',
  say: '밤에 열어 낮에 닫는, 새벽 꽃시장이에요.',
  facts: [
    { term: '가는 길', desc: '3·7호선 고속버스터미널역 경부선터미널 3층' },
    { term: '여는 때', desc: '생화 23:00~13:00 · 조화 23:00~18:00' },
    { term: '쉬는 날', desc: '매주 일요일' },
  ],
  caveats: [
    '한 단 단위로 사고파는 도매가 기본이에요.',
    '안내하는 곳마다 시간이 조금씩 달라요. 서울시 안내를 기준으로 적었고, 가기 전에 한 번 더 확인해 주세요.',
  ],
} as const;

/**
 * 정직 각주 — **현 단계의 사실**이다.
 *
 * ⚠ 제휴가 실제로 생기기 전까지 이 문장을 바꾸지 마라. 소개 페이지에서 제휴를 암시하는 순간
 *   위 일곱 곳의 취지까지 같이 의심받는다. 제휴가 생기면 이 문장을 **먼저** 고친다.
 */
const NO_AFFILIATION = '여기 소개하는 곳들과 아직 제휴 관계는 아니에요 — 좋은 곳을 먼저 알려 드리는 거예요.';

interface Row {
  no: string;
  title: string;
  body: string;
}

/**
 * 우리가 하는 일 = 랜딩의 **신뢰 3요소 그대로**(`components/landing/LandingPage.tsx`).
 *
 * 예전에는 이 자리에 폐기된 구버전 세 줄이 남아 있어, 같은 서비스가 홈과 파트너 페이지에서
 * 서로 다른 세 가지를 자기 일이라고 말했다. 꽃집 사장이 홈을 보고 온 다음 이 페이지를
 * 읽는 순서라 특히 어긋나 보이는 자리다 — 랜딩이 바뀌면 여기도 함께 바꾼다.
 */
const OUR_WORK: Row[] = [
  {
    no: '01',
    title: '이야기가 있는 꽃말',
    body: '같은 꽃도 시대와 나라마다 다른 이야기를 품어요. 그 갈래까지 들려드려요.',
  },
  {
    no: '02',
    title: '이런 날, 이 꽃',
    body: '꽃말만 알려주고 끝내지 않아요. 어떤 날 건네면 좋은 꽃인지, 상황까지 함께 골라드려요.',
  },
  {
    no: '03',
    title: '바로 쓰는 멘트 3가지 톤',
    body: '담백하게, 다정하게, 진지하게. 복사해서 바로 보내세요.',
  },
];

const JOIN_ROWS: Row[] = [
  {
    no: '01',
    title: '소개되는 자리',
    body: '가게 이름과 지역, 자주 다루는 꽃을 이 페이지에 소개해요.',
  },
  {
    no: '02',
    title: '이어지는 길',
    body: '추천이 끝난 자리에서 손님이 바로 가게로 찾아갈 수 있게 연결해요.',
  },
  {
    no: '03',
    title: '함께 맞춰가는 것',
    body: '소개되는 방식과 조건은 이야기 나누며 정해요.',
  },
];

function Rows({ items }: { items: Row[] }) {
  return (
    <ul className={styles.rows}>
      {items.map((row) => (
        <li key={row.no}>
          <span className={styles.no} aria-hidden="true">
            {row.no}
          </span>
          <div>
            <b>{row.title}</b>
            <p>{row.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

const JOIN_MAILTO =
  'mailto:hello@dearbloom.example?subject=%ED%95%A8%EA%BB%98%ED%95%98%EB%8A%94%20%EA%BD%83%EC%A7%91%20%EB%AC%B8%EC%9D%98';

export default function PartnersPage() {
  return (
    <div className={styles.page}>
      <span className={styles.grain} aria-hidden="true" />

      <main>
        {/* ── 1. 인트로 — 브랜드 소개 ─────────────────────────────── */}
        <section className={styles.intro}>
          <div className={styles.introBg} aria-hidden="true" />

          <header className={styles.siteHead}>
            <div className={`${styles.wrap} ${styles.siteHeadRow}`}>
              <Link className={styles.logo} href="/">
                dearbloom
              </Link>
              <span className={styles.eyebrow}>Partners &amp; Story</span>
            </div>
          </header>

          <div className={`${styles.wrap} ${styles.introInner}`}>
            <span className={`${styles.eyebrow} ${styles.eyebrowQuiet}`}>Brand note</span>
            <h1>꽃은 결국, 동네 꽃집에서 와요.</h1>
            <p className={styles.lead}>
              dearbloom은 어떤 마음에 어떤 꽃이 어울리는지, 그 꽃이 어떤 이야기를 품고 있는지를 골라
              들려드려요. 꽃을 다듬고 물을 갈아주는 손은 언제나 동네에 있고요. 그래서 마지막 한
              걸음은 가까운 꽃집으로 이어드려요.
            </p>
            <div className={styles.introRule} aria-hidden="true" />
          </div>
        </section>

        {/* ── 2. 먼저 알려 드리는 곳들 (실존 큐레이션) ────────────── */}
        <section className={styles.section} id="florists" aria-labelledby="florists-title">
          <div className={styles.wrap}>
            <div className={styles.sectionHead}>
              <span className={styles.eyebrow}>Places we found</span>
              <h2 id="florists-title">먼저 알려 드리는 곳들</h2>
              <p className={styles.lead}>
                공공이 운영하거나, 좋은 취지로 꽃을 다루는 곳부터 소개해요. 저희와 이어진 곳이
                아니라, 저희가 찾아보고 하나하나 확인한 곳이에요.
              </p>
            </div>

            <ul className={styles.groups}>
              {CURATION.map((group) => (
                <li key={group.key} className={styles.group}>
                  <div className={styles.groupHead}>
                    <span className={styles.no} aria-hidden="true">
                      {group.no}
                    </span>
                    <div>
                      <h3>{group.title}</h3>
                      <p className={styles.groupSay}>{group.say}</p>
                    </div>
                  </div>

                  <ul className={styles.places}>
                    {group.places.map((place) => (
                      <li key={place.key} className={styles.place}>
                        <span className={styles.placeWhere}>{place.where}</span>
                        <h4>
                          {/*
                            새 탭으로 열리는 링크는 그 사실을 미리 알린다(P1-6) — 도감 출처 링크와
                            같은 패턴이다. `rel="noreferrer"` 는 새 창에서 이 페이지를 되짚지
                            못하게 하는 것이라 지우지 마라.
                          */}
                          <a
                            className={styles.placeLink}
                            href={place.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {place.name}
                            <span className={styles.srOnly}> (새 창)</span>
                            <ArrowGlyph />
                          </a>
                        </h4>
                        <p className={styles.placeDesc}>{place.desc}</p>
                        {place.caveat ? <p className={styles.placeCaveat}>{place.caveat}</p> : null}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            {/*
              ── 새벽 꽃시장 카드 — 시장 자체를 안내한다 ─────────────
              `div` 가 아니라 `section` 이다. `aria-labelledby` 는 이름을 붙일 **자리**가 있는
              요소에만 붙는다 — 밋밋한 div 에 붙이면 낭독기는 그 이름을 어디에도 쓰지 않는다.
              section 이면 이름 붙은 region 이 되어 목록에서 바로 건너뛸 수 있다.
            */}
            <section className={styles.market} aria-labelledby="market-title">
              <div className={styles.marketBg} aria-hidden="true" />
              <span className={styles.placeWhere}>{MARKET.where}</span>
              <h3 id="market-title">{MARKET.name}</h3>
              <p className={styles.lead}>{MARKET.say}</p>

              <dl className={styles.marketFacts}>
                {MARKET.facts.map((fact) => (
                  <div key={fact.term}>
                    <dt>{fact.term}</dt>
                    <dd>{fact.desc}</dd>
                  </div>
                ))}
              </dl>

              <ul className={styles.marketNotes}>
                {MARKET.caveats.map((caveat) => (
                  <li key={caveat}>{caveat}</li>
                ))}
              </ul>

              <a className={styles.golink} href={MARKET.url} target="_blank" rel="noreferrer">
                {MARKET.linkLabel}
                <span className={styles.srOnly}> (새 창)</span>
                <ArrowGlyph />
              </a>
            </section>

            <p className={styles.note}>{NO_AFFILIATION}</p>
          </div>
        </section>

        {/* ── 3. 자리 잡은 이야기 ─────────────────────────────────── */}
        <section
          className={`${styles.section} ${styles.story}`}
          id="story"
          aria-labelledby="story-title"
        >
          <div className={styles.wrap}>
            <div className={styles.sectionHead}>
              <span className={styles.eyebrow}>Our story</span>
              <h2 id="story-title">자리 잡은 이야기</h2>
              <p className={styles.lead}>
                우리가 맡은 몫과, 꽃집이 맡은 몫. 이 자리는 앞으로 더 채워질 예정이에요.
              </p>
            </div>

            <div className={styles.cols}>
              <div className={styles.col}>
                <h3>우리가 하는 일</h3>
                <Rows items={OUR_WORK} />
              </div>

              <div className={`${styles.col} ${styles.join}`}>
                <div className={styles.joinBg} aria-hidden="true" />
                <h3>함께하고 싶은 꽃집이라면</h3>
                <p className={styles.lead}>
                  가게 이름과 자주 다루는 꽃, 그리고 한 줄만 들려주세요. 나머지는 함께 맞춰가요.
                </p>
                <Rows items={JOIN_ROWS} />
                {/* 실서비스: 입점 문의 폼(/partners/apply)으로 교체 예정. 지금은 mailto 더미 */}
                <a className={styles.btn} href={JOIN_MAILTO}>
                  함께하기
                </a>
                <p className={styles.joinAfter}>받은 이야기는 순서대로 읽고, 한 곳씩 찾아뵐게요.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── 4. 푸터 ─────────────────────────────────────────────── */}
      <footer className={styles.siteFoot}>
        <div className={styles.wrap}>
          <div className={styles.footTop}>
            <Link className={styles.footLogo} href="/">
              dearbloom
            </Link>
            <p className={styles.footSay}>
              꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
              들려드려요.
            </p>
          </div>

          {/*
            갈 곳이 있는 자리만 링크다. `화해의 꽃` 은 아직 화면이 없으므로 비활성 버튼으로
            두고, 무엇을 기다리는지 그 자리에서 말한다(`href="#"` 금지 — 위 파일 머리 주석).
            ⚠ `꽃 도감` 은 용어 확정본이다. 예전 이름 `꽃말 도감` 으로 되돌리지 마라 —
              같은 화면을 다른 이름으로 부르면 어디로 가는 링크인지 다시 배워야 한다.
          */}
          <ul className={styles.footNav}>
            <li>
              <Link href="/">홈으로</Link>
            </li>
            <li>
              <Link href="/flowers">꽃 도감</Link>
            </li>
            <li>
              <button className={styles.footSoon} type="button" disabled>
                화해의 꽃
                <span className={styles.soonTag}>준비 중</span>
              </button>
            </li>
            <li>
              <Link href="/groups">여러 명에게</Link>
            </li>
          </ul>

          {/*
            ⚠ 예전 두 줄(`소개된 꽃집은 예시예요` · `구매 링크는 제휴 링크로 연결돼요`)은
              지금 둘 다 **사실이 아니다** — 예시가 아니라 실존 큐레이션이고, 제휴 링크도 없다.
              사실이 아닌 고지는 없느니만 못하므로 정직 각주 한 줄로 갈음한다.
          */}
          <div className={styles.footNotes}>
            <p>{NO_AFFILIATION}</p>
            <p>
              소개하는 곳의 정보는 공식 안내를 따라 적었어요. 바뀌었을 수 있으니 가기 전에 한 번
              확인해 주세요.
            </p>
          </div>

          {/*
            ⚠ 크레딧은 **실제로 쓰는 사진만** 적는다. 가상 꽃집 3곳을 걷어내며 그 카드 배경
              사진(Waseem Khan · Bernd Dittrich · Christina)도 함께 사라졌으므로 크레딧에서도
              뺐다. 안 쓰는 사진을 크레딧에 남겨 두면 그것도 거짓말이다.
          */}
          <p className={styles.credits}>
            <span className={`${styles.eyebrow} ${styles.eyebrowQuiet}`}>Image credits</span>
            Photo: Spruce / Unsplash · Jens Riesenberg / Unsplash
          </p>
        </div>
      </footer>
    </div>
  );
}
