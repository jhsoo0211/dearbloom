import type { Metadata } from 'next';
import Link from 'next/link';

import styles from './partners.module.css';

/**
 * `/partners` — 함께하는 꽃집.
 *
 * 확정 시안 `design/landing-v3/partners.html` 을 서버 컴포넌트로 옮긴 정적 화면이다.
 * 상호 3곳은 **가상 예시**이고(하단에 그대로 고지한다), 주문 경로는 아직 없다 —
 * 실서비스에서는 파트너 데이터로 렌더하고 `/go/[partner]` 아웃링크(클릭 측정 후 리다이렉트)로
 * 바뀐다. 워딩은 §1.5d 개정본(이야기·설화 톤) 기준.
 *
 * 시안에 있던 스크롤 진입 페이드는 옮기지 않았다. 페이드가 없어도 정보가 그대로 읽히고,
 * 그 효과 하나 때문에 이 화면 전체를 클라이언트 컴포넌트로 만들 이유가 없다.
 *
 * ── 아직 없는 길은 링크로 만들지 않는다 (접근성 리뷰 P2-11) ───────────
 * 예전에는 갈 곳 없는 자리를 전부 `href="#"` 로 두었다(주문 3 · 화해의 꽃 1). 눌러도 아무
 * 일이 없는 것보다 나쁜 건, 화면 낭독기에는 **멀쩡한 링크**로 읽힌다는 점이다 — 누르면
 * 페이지 맨 위로 튀어 "내가 뭘 잘못 눌렀나" 가 된다. 그래서 갈 곳이 생길 때까지는
 * **비활성 버튼 + 준비 중 한 줄**로 둔다. 갈 곳이 있는 하나(`꽃말 도감`)는 진짜 링크로 잇는다.
 *
 * ── 랜드마크 (접근성 리뷰 P1-6) ──────────────────────────────────────
 * 본문 세 절은 `<main>` 안에 있다. 없을 때는 axe 가 "어떤 랜드마크에도 속하지 않은 영역"
 * 네 개를 잡았다. `.siteHead` 는 `.intro` 위에 `position: absolute` 로 겹쳐 놓는 요소라
 * DOM 자리를 옮기지 않고 그대로 둔다(그래서 banner 랜드마크는 되지 않는다 — 대신
 * 로고·보조 메뉴가 전부 main 안에 담겨 미아 영역이 남지 않는다).
 */

export const metadata: Metadata = {
  title: '함께하는 꽃집 — dearbloom',
  description:
    'dearbloom은 마음에 어울리는 꽃과 그 꽃에 얽힌 이야기를 고르고, 마지막 한 걸음은 가까운 꽃집으로 이어드려요.',
};

function ArrowGlyph() {
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden="true">
      <path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

interface Shop {
  key: string;
  mediaClass: string;
  mediaAlt: string;
  place: string;
  name: string;
  desc: string;
  flowers: string[];
}

/** 가상 상호 3곳 — 실서비스에서는 파트너 데이터로 교체한다. */
const SHOPS: Shop[] = [
  {
    key: 'bam-onsil',
    mediaClass: styles.shopA,
    mediaAlt: '어둠 속 초록 잎사귀 사진',
    place: '서울 서촌',
    name: '밤의 온실',
    desc: '해가 진 뒤에도 작은 불을 켜 두는, 온실 같은 가게예요.',
    flowers: ['흰 튤립', '프리지아', '유칼립투스'],
  },
  {
    key: 'tulip-letter',
    mediaClass: styles.shopB,
    mediaAlt: '어둠 속에 홀로 핀 흰 튤립 사진',
    place: '부산 전포',
    name: '튤립과 편지',
    desc: '꽃을 고르면 편지지 한 장을 함께 넣어 보내드리는 곳이에요.',
    flowers: ['흰 튤립', '리시안셔스', '스토크'],
  },
  {
    key: 'chojeonyeok',
    mediaClass: styles.shopC,
    mediaAlt: '어두운 배경의 흰 꽃과 초록 잎 사진',
    place: '대전 소제동',
    name: '초저녁 식물상회',
    // ⚠ 세 곳의 소개는 **같은 문체**로 끝난다(`…예요`) — 한 줄만 습니다체면 목록이 어긋나 보인다.
    desc: '화병에 꽂을 한 송이부터 한 다발까지, 조용한 꽃만 모아 두는 곳이에요.',
    flowers: ['아네모네', '헬레보어', '유칼립투스'],
  },
];

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

        {/* ── 2. 함께하는 꽃집 ────────────────────────────────────── */}
        <section className={styles.section} id="florists" aria-labelledby="florists-title">
          <div className={styles.wrap}>
            <div className={styles.sectionHead}>
              <span className={styles.eyebrow}>Partner florists</span>
              <h2 id="florists-title">함께하는 꽃집</h2>
              <p className={styles.lead}>
                추천이 끝나는 자리에서, 꽃을 다듬는 손으로 이어드려요. 가까운 곳부터 차례로
                소개할게요.
              </p>
            </div>

            <ul className={styles.shops}>
              {SHOPS.map((shop) => (
                <li key={shop.key} className={`${styles.shop} ${shop.mediaClass}`}>
                  <div className={styles.shopMedia} role="img" aria-label={shop.mediaAlt} />
                  <div className={styles.shopBody}>
                    <span className={styles.shopPlace}>{shop.place}</span>
                    <h3>{shop.name}</h3>
                    <p className={styles.shopDesc}>{shop.desc}</p>
                    <ul className={styles.chips}>
                      {shop.flowers.map((flower) => (
                        <li key={flower}>{flower}</li>
                      ))}
                    </ul>
                    <p className={styles.shopGo}>
                      {/*
                        갈 곳이 아직 없다 — `href="#"` 링크로 두면 낭독기에는 멀쩡한 링크로
                        읽히고 누르면 페이지 맨 위로 튄다. 길이 날 때까지는 비활성 버튼이다.
                        실서비스: <a href={`/go/${shop.key}`} rel="sponsored nofollow">
                                   (클릭 측정 후 파트너 사이트로)
                      */}
                      <button className={styles.golinkOff} type="button" disabled>
                        주문하러 가기
                        <ArrowGlyph />
                      </button>
                      <span className={styles.soon}>가게로 이어지는 길은 지금 내는 중이에요.</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className={styles.note}>구매 링크는 제휴 링크로 연결돼요.</p>
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

          <div className={styles.footNotes}>
            <p>소개된 꽃집은 예시예요.</p>
            <p>구매 링크는 제휴 링크로 연결돼요.</p>
          </div>

          <p className={styles.credits}>
            <span className={`${styles.eyebrow} ${styles.eyebrowQuiet}`}>Image credits</span>
            Photo: Spruce / Unsplash · Waseem Khan / Unsplash · Bernd Dittrich / Unsplash · Christina
            / Unsplash · Jens Riesenberg / Unsplash
          </p>
        </div>
      </footer>
    </div>
  );
}
