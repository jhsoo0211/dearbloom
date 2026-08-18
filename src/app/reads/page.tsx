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
import {
  FESTIVAL_PROVIDER_LABEL,
  hideDuplicates,
  loadFestivals,
  toFestivalCard,
} from '@/lib/data/reads-festivals';
import type { CatalogRead, ReadAccess, ReadKind } from '@/lib/data/types';
import { plateCredits, plateViewFor } from '@/lib/plates';

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

  /*
   * 카드 액자 — **도감과 이어진 카드만** 그 꽃의 도판을 건다(54건 중 24건).
   *
   * 여러 종이 걸린 카드는 **첫 종**이다(`links_to` 의 순서 = 편집자가 적은 순서). 두 장을
   * 나란히 걸면 액자가 카드마다 한 장이었다 두 장이었다 하고, 그 순간 목록이 한 화면으로
   * 읽히지 않는다 — 나머지 종은 카드 아래 다리(`.bridge`)가 이미 전부 이름으로 말한다.
   *
   * 도판이 없는 꽃이면 액자도 없다(=갈래 표식으로 간다). 지금은 카탈로그 59종 전원에
   * 도판이 있어 이 갈래로 빠지지 않지만, 꽃이 늘고 도판이 늦는 날을 위해 남겨 둔다.
   *
   * ⚠ 폭을 여기서 정한다(기본값 250 = **160px 썸네일**). 화면이 이 그림을 거는 자리는
   *   64px 액자 하나뿐이라 본판(≤1100px · 장당 200KB)을 물릴 이유가 없다 —
   *   `/stories` 레인 헤더가 예전에 그 값을 되돌려 첫 화면에서만 1.4MB 를 받았다.
   */
  const [firstFlower] = card.flowers;
  if (firstFlower) {
    const plate = plateViewFor(firstFlower.id);
    if (plate) card.preview = { flowerId: plate.flowerId, src: plate.src };
  }

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
 *
 * 종료일이 같으면 **큐레이션이 먼저 선다**(`provider` 가 없는 쪽). 기계가 모아 온 카드가
 * 사람이 고른 카드를 밀어내지 않게 하는 한 칸이고, 정렬을 실행마다 흔들리지 않게 한다.
 */
function inScreenOrder(cards: ReadCard[]): ReadCard[] {
  const events = cards
    .filter((card) => card.kind === 'event')
    .sort(
      (a, b) =>
        (a.endsAt ?? '').localeCompare(b.endsAt ?? '') ||
        Number(a.provider !== undefined) - Number(b.provider !== undefined),
    );
  const rest = cards.filter((card) => card.kind !== 'event');
  return [...events, ...rest];
}

/**
 * API 축제를 카드로 — **비어 있는 것이 정상 값이다.**
 *
 * `content/generated/festivals.json` 이 없거나(=아직 한 번도 안 받아 왔거나 키가 없거나)
 * 목록이 비면 빈 배열이 돌아오고, 그 결과 화면에는 **아무 흔적도 남지 않는다** — 안내
 * 문구도, 빈 구획도 두지 않는다. 사용자는 그런 것이 있었다는 사실 자체를 모르는 편이
 * 자연스럽다(파일이 깨져 있을 때만 로더가 던진다 — `reads-festivals.ts` 머리말).
 *
 * 중복은 **원장이 이긴다.** 같은 축제가 `reads.csv` 에도 있으면 API 쪽을 통째로 뗀다
 * (제목 근사 + 기간 근사 — 판정 규칙은 `hideDuplicates` 머리말).
 */
async function festivalCards(curated: ReadCard[]): Promise<ReadCard[]> {
  const records = await loadFestivals();
  if (records.length === 0) return [];

  const curatedEvents = curated.filter((card) => card.kind === 'event');
  return hideDuplicates(records, curatedEvents).map((record) =>
    toFestivalCard(record, KIND_LABELS.event),
  );
}

export default async function ReadsPage() {
  const catalog = await loadCatalog();
  const names = new Map(catalog.flowers.map((flower) => [flower.id, flower.nameKo]));
  const curated = catalog.reads.map((read) => toCard(read, names));
  const fromApi = await festivalCards(curated);
  const cards = inScreenOrder([...curated, ...fromApi]);

  /*
   * 인트로 숫자는 **원장 54건만** 센다(만료도, API 축제도 반영하지 않는다).
   *
   * 만료를 반영하지 않는 이유: 반영하려면 서버가 오늘을 알아야 하는데, 그 순간 §7-2 가
   * 경고한 대로 빌드 날짜가 HTML 에 굳는다.
   * API 축제를 세지 않는 이유: 이 세 줄이 말하는 것은 「저희가 직접 열어 보고 고른 것」의
   * 크기다. 기계가 모아 온 수를 여기 더하면 그 문장이 그 자리에서 거짓이 된다.
   * **지금 볼 수 있는 수**는 필터 바 아래 `.count` 가 브라우저의 오늘로 말한다.
   */
  const eventCount = curated.filter((card) => card.kind === 'event').length;
  const bridged = curated.filter((card) => card.flowers.length > 0).length;

  /*
   * 도판 크레딧 — **화면에 실제로 액자를 세운 꽃**만, 판본 단위로 합쳐서
   * (`docs/illustration-assets.md` 사용 규칙 4 · `/stories` 푸터와 같은 함수·같은 형식).
   *
   * `card.flowers` 가 아니라 `card.preview` 를 세는 이유: 여러 종이 걸린 카드는 액자에
   * 첫 종만 걸린다. 걸지도 않은 도판의 판본을 크레딧에 적으면 그 줄이 그 자리에서 거짓이 된다.
   * 만료로 숨은 카드까지 세는 것은 의도다 — 거르기는 브라우저의 오늘이 하는 일이라
   * 서버가 크레딧을 그 시계에 맞추면 §7-2 가 경고한 "빌드 날짜 굳기" 를 다시 부른다.
   */
  const credits = plateCredits(
    cards.flatMap((card) => (card.preview ? [card.preview.flowerId] : [])),
  );

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
              <span className={styles.statNum}>{curated.length}</span>
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
            도판 크레딧 — 카드 액자에 그림을 걸었으니 이 화면도 출처를 진다
            (`docs/illustration-assets.md` 사용 규칙 4 · `/stories` 푸터와 **같은 형식**).
            59종 전부 퍼블릭 도메인·CC0 라 표기 의무는 없지만, BHL→Flickr 경유 파일에
            `CC BY 2.0` 상자가 기계적으로 붙어 있어 분쟁 여지를 0으로 만드는 가장 싼 보험이다.
            ⚠ 액자를 하나도 안 건 날에는 이 구획도 없다 — 있지도 않은 것을 설명하는 문장은
              사용자에게 아무 뜻이 없다(아래 API 각주와 한 짝인 규칙).
          */}
          {credits.length > 0 ? (
            <section className={styles.credits} aria-labelledby="reads-credits-title">
              <h2 className={styles.creditsTitle} id="reads-credits-title">
                <span className={styles.eyebrow}>Image credits</span>
                <span className={styles.srOnly}>도판 출처</span>
              </h2>
              <p className={styles.creditsLead}>
                카드 왼쪽의 작은 그림은 그 글과 이어진 꽃의 세밀화예요. 19세기 전후 식물
                도감에서 온 퍼블릭 도메인·CC0 도판이고, 어느 판본에서 왔는지 아래에 적어 둘게요.
              </p>
              <ul className={styles.creditList}>
                {credits.map((credit) => (
                  <li className={styles.creditItem} key={credit}>
                    {credit}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

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
            {/*
              ⚠ 공공누리 제1유형의 **출처표시 의무**를 지는 줄이다. 지우지 마라.
                카드마다 붙는 `한국관광공사 제공` 라벨이 개별 출처를 말하고, 이 각주가
                그 목록이 어디서 왔는지를 한 번 더 밝힌다.
              ⚠ **API 카드가 하나도 없으면 이 줄도 없다.** 있지도 않은 것을 설명하는 문장은
                사용자에게 아무 뜻이 없다(빈 배열이면 구획째 조용히 사라진다는 규칙과 한 짝).
            */}
            {fromApi.length > 0 ? (
              <p>
                {FESTIVAL_PROVIDER_LABEL}이라고 적힌 축제는 한국관광공사 TourAPI 에서 받아 온
                것이라 저희가 직접 열어 보지는 못했어요(공공누리 제1유형). 그 카드의 장소
                사진도 한국관광공사가 제공한 것을 원본 그대로 걸었어요(공공누리 제3유형 —
                크기나 색을 바꾸지 않았어요).
              </p>
            ) : null}
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
