import type { Metadata } from 'next';
import Link from 'next/link';

import ReadsBoard from '@/components/reads/ReadsBoard';
import {
  readPeriodLabel,
  readPublishedLabel,
} from '@/components/reads/expiry';
import styles from '@/components/reads/reads.module.css';
import type { ReadCard, ReadFlowerLink } from '@/components/reads/types';
import { loadCatalog } from '@/lib/data/catalog';
import type { CatalogRead, ReadAccess, ReadKind } from '@/lib/data/types';

/**
 * `/reads` — 읽을거리.
 *
 * 꽃 축제·꽃을 다룬 글·절화 실용 정보·올해의 색을 **우리가 직접 열어 보고** 골라 두는
 * 자리다. 근거 원장은 `content/reads.csv` 이고, 그 선정·기각의 단일 원본은
 * `docs/reads-research.md` 다 — 한 줄 더하기 전에 그 문서의 선정 기준 여섯을 먼저 보라.
 *
 * ── 이 화면이 하지 않는 일 ──────────────────────────────────────────
 * · **크롤링하지 않는다.** 본문도, 요약문도, 남의 썸네일도 우리 쪽에 담지 않는다.
 *   싣는 것은 제목·출처·우리가 쓴 한 줄·링크뿐이다(조사 문서 §1).
 * · **만료를 서버에서 판정하지 않는다.** 여기서 거르면 배포한 날의 "오늘" 이 정적 HTML 에
 *   굳는다(§7-2). 54건을 그대로 내보내고, 지난 행사는 브라우저가 자기 오늘로 숨긴다 —
 *   `ReadsBoard` 머리말과 `components/reads/expiry.ts` 가 그 근거다.
 * · **상세 페이지를 두지 않는다.** 목적지는 원문이다. 우리 화면에 한 겹을 더 세우면
 *   그 겹은 남의 글을 대신 말하는 자리가 된다.
 *
 * 데이터는 서버가 통째로 확정해 내려보낸다(`loadCatalog()` → 카드 → 한국어 라벨).
 * 클라이언트는 사전도 로더도 갖지 않으므로, 어휘가 늘면 이 파일이 자동으로 따라간다.
 * `revalidate = 3600` — `content/*.csv` 는 배포에 고정된 읽기 전용 데이터다(/stories 와 같다).
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '읽을거리 — dearbloom',
  description:
    '지금 가 볼 수 있는 꽃 축제와 전시, 꽃을 둘러싼 오래 읽히는 글, 꽃을 더 오래 두는 방법, 올해의 색까지. dearbloom이 직접 열어 보고 골라 둔 바깥 읽을거리예요.',
};

/** 갈래 이름 — 카드 위에 서는 한 단어. 조사 문서 §4 의 표 이름을 그대로 쓴다. */
const KIND_LABELS: Record<ReadKind, string> = {
  event: '지금 가 볼 곳',
  article: '읽을거리',
  guide: '알아두면 좋은 것',
  trend: '빛깔·트렌드',
};

/**
 * 콘텐츠 장벽 고지 — **누르기 전에** 말한다(§3-4).
 *
 * `open` 은 아무 말도 하지 않는다. 「그냥 읽혀요」라고 적으면 아무 정보도 없는 줄이 53장에
 * 붙는다 — 말할 값이 있는 것은 막힐 수 있다는 사실뿐이다.
 */
const ACCESS_NOTES: Record<ReadAccess, string | undefined> = {
  open: undefined,
  paywall: '유료 매체예요. 열람 횟수 제한이 있어 막힐 수도 있어요.',
  registration: '무료지만 가입하거나 로그인해야 읽을 수 있어요.',
};

/**
 * `links_to` → 도감으로 건너가는 다리.
 *
 * **`flower:` 만 링크가 된다.** `color:`·`theme:` 은 우리 화면에 그 값으로 바로 여는 목적지가
 * 아직 없다(도감·아카이브 어디에도 색·계열을 URL 로 받는 자리가 없다). 갈 곳 없는 자리를
 * 링크처럼 세우지 않는 것이 이 저장소의 규범이라(접근성 리뷰 P2-11) 화면에서 뗀다 —
 * 두 값은 원장에 그대로 남아 있고, 색·계열로 여는 길이 생기면 여기 한 줄을 더하면 된다.
 *
 * 없는 꽃 id 는 교차 검증 9 가 시드에서 막으므로 여기서 만나지 않는다. 그래도 이름을 못
 * 찾으면 **링크를 세우지 않는다** — 영문 slug 가 화면에 새는 쪽이 더 나쁘다.
 */
function bridgeFlowers(read: CatalogRead, names: Map<string, string>): ReadFlowerLink[] {
  const links: ReadFlowerLink[] = [];
  for (const entry of read.linksTo) {
    if (!entry.startsWith('flower:')) continue;
    const id = entry.slice('flower:'.length).trim();
    const nameKo = names.get(id);
    if (nameKo === undefined) continue;
    links.push({ id, nameKo });
  }
  return links;
}

function toCard(read: CatalogRead, names: Map<string, string>): ReadCard {
  const card: ReadCard = {
    id: read.readId,
    kind: read.kind,
    kindLabel: KIND_LABELS[read.kind],
    title: read.title,
    sourceTitle: read.sourceTitle,
    url: read.sourceUrl,
    summary: read.summaryKo,
    tags: read.tags,
    access: read.access,
    flowers: bridgeFlowers(read, names),
  };

  if (read.author) card.author = read.author;
  if (read.startsAt) card.startsAt = read.startsAt;
  if (read.endsAt) card.endsAt = read.endsAt;

  // 「온라인」 항목의 `region` 은 자리 태그가 이미 말하고 있다 — 같은 말을 두 번 하지 않는다.
  if (read.region && read.region !== '온라인') card.region = read.region;

  const period = readPeriodLabel(read.startsAt, read.endsAt);
  if (period) card.periodLabel = period;

  const published = readPublishedLabel(read.publishedAt);
  if (published) card.publishedLabel = published;

  const accessNote = ACCESS_NOTES[read.access];
  if (accessNote) card.accessNote = accessNote;

  return card;
}

/**
 * 화면 순서 — **행사 먼저, 그다음 읽을거리**(조사 문서 §6-3).
 *
 * 행사는 **종료일이 가까운 순**이다. 그 순서가 곧 사라지는 순서라, 위쪽이 늘 "지금 서두를
 * 것" 이 된다(조사 문서 §4-1 의 표가 같은 순서로 적혀 있다). 나머지는 CSV 순서 그대로다 —
 * 편집자가 정한 순서이고, 다시 찾아온 사람이 같은 자리에서 같은 글을 만난다.
 *
 * ⚠ **여기서 "오늘"을 보지 마라.** 열린 행사를 위로 올리고 싶어지겠지만, 그 정렬은 빌드
 *   시각의 오늘로 굳는다(§7-2). 정렬은 데이터만으로 정해지는 값이어야 한다.
 */
function inScreenOrder(cards: ReadCard[]): ReadCard[] {
  const events = cards
    .filter((card) => card.kind === 'event')
    .sort((a, b) => (a.endsAt ?? '').localeCompare(b.endsAt ?? ''));
  const rest = cards.filter((card) => card.kind !== 'event');
  return [...events, ...rest];
}

export default async function ReadsPage() {
  const catalog = await loadCatalog();
  const names = new Map(catalog.flowers.map((flower) => [flower.id, flower.nameKo]));
  const cards = inScreenOrder(catalog.reads.map((read) => toCard(read, names)));

  /*
   * 인트로 숫자는 **원장 그대로**다(만료를 반영하지 않는다).
   * 반영하려면 서버가 오늘을 알아야 하는데, 그 순간 §7-2 가 경고한 대로 빌드 날짜가
   * HTML 에 굳는다. 그래서 여기 숫자는 "모아 둔 것" 을 말하고, **지금 볼 수 있는 수**는
   * 필터 바 아래 `.count` 가 브라우저의 오늘로 말한다.
   */
  const eventCount = cards.filter((card) => card.kind === 'event').length;
  const bridged = cards.filter((card) => card.flowers.length > 0).length;

  return (
    <div className={styles.page}>
      <span className={styles.grain} aria-hidden="true" />

      <header className={styles.siteHead}>
        <div className={`${styles.wrap} ${styles.siteHeadRow}`}>
          <Link className={styles.logo} href="/">
            dearbloom
          </Link>
          <span className={styles.eyebrow}>Reading room</span>
        </div>
      </header>

      {/* ── 1. 인트로 ───────────────────────────────────────────── */}
      <section className={styles.intro}>
        <div className={styles.introBg} aria-hidden="true" />
        <div className={styles.wrap}>
          <h1 className={styles.title}>읽을거리</h1>
          <p className={`${styles.lead} ${styles.sub}`}>
            이번 가을 어디서 꽃을 볼 수 있는지, 우리가 사는 꽃이 어디서 오는지, 받은 꽃다발을
            어떻게 하면 조금 더 오래 둘 수 있는지. 저희가 직접 열어 보고 고른 바깥 이야기들을
            여기 모아 둘게요.
          </p>

          <ul className={styles.stats}>
            <li className={styles.stat}>
              <span className={styles.statNum}>{cards.length}</span>
              <span className={styles.statLabel}>건을 모았어요</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{eventCount}</span>
              <span className={styles.statLabel}>곳의 축제와 전시</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{bridged}</span>
              <span className={styles.statLabel}>건이 도감과 이어져요</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ── 2. 칩 필터 · 카드 목록 ──────────────────────────────── */}
      <main>
        <ReadsBoard cards={cards} />

        {/* ── 3. 하단 CTA ──────────────────────────────────────── */}
        <section className={styles.cta} aria-labelledby="reads-cta-title">
          <div className={styles.wrap}>
            <span className={styles.eyebrow}>Next</span>
            <h2 className={styles.ctaTitle} id="reads-cta-title">
              마음을 전할 꽃도 골라 볼까요?
            </h2>
            <p className={`${styles.lead} ${styles.ctaLead}`}>
              관계와 마음만 알려주시면, 어울리는 꽃과 그 꽃의 이야기, 건넬 첫 문장까지 함께
              골라드려요.
            </p>
            <Link className={styles.btn} href="/recommend">
              45초 만에 추천받기
            </Link>
          </div>
        </section>
      </main>

      {/* ── 4. 푸터 ─────────────────────────────────────────────── */}
      <footer className={styles.siteFoot}>
        <div className={styles.wrap}>
          {/*
            ⚠ 정직 각주 — 이 문장을 장식으로 읽지 마라.
              여기 실린 곳들과 우리는 아무 관계가 없고, 링크를 눌러도 우리에게 돌아오는 것이
              없다. 그 사실을 적어 두어야 「왜 이 축제만 실렸지」가 광고로 읽히지 않는다.
              (파트너 페이지가 같은 자리에 같은 성격의 각주를 두고 있다.)
          */}
          <div className={styles.footNotes}>
            <p>
              여기 소개하는 곳·매체와 제휴 관계는 없어요 — 저희가 직접 열어 보고 좋았던 것을
              알려 드리는 거예요.
            </p>
            <p>
              행사 날짜는 주최 측 공식 안내를 따라 적었어요. 바뀌었을 수 있으니 가기 전에 한 번
              확인해 주세요.
            </p>
          </div>

          <p className={styles.footSay}>
            꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
            들려드려요.
          </p>
          <nav className={styles.footNav} aria-label="보조 메뉴">
            <Link href="/">홈으로</Link>
            <Link href="/flowers">꽃 도감</Link>
            <Link href="/stories">이야기</Link>
            <Link href="/partners">함께하는 꽃집</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
