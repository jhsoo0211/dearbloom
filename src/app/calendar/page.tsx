import type { Metadata } from 'next';
import Link from 'next/link';

import BloomCalendar from '@/components/flowers/BloomCalendar';
import { buildBloomCalendar } from '@/components/flowers/calendar-data';
import styles from '@/components/flowers/flowers.module.css';
import { loadCatalog } from '@/lib/data/catalog';

/**
 * `/calendar` — 계절 달력("이번 달 피는 꽃").
 *
 * 도감이 **이름**으로, 생일 찾기가 **날짜**로 들어가는 문이라면 여기는 **계절**로 들어가는
 * 문이다. 꽃 이름을 하나도 모르는 사람이 "지금 뭘 살 수 있지"에서 출발해 도감 상세까지
 * 닿는 길이라, 화면이 하는 일은 딱 하나다 — 달마다 그달에 피는 꽃을 늘어놓고 상세로 보낸다.
 *
 * ── 내비에 넣지 않는다 ──────────────────────────────────────────────
 * 진입점은 도감 안의 두 줄뿐이다(인트로 한 줄 · 생일 찾기 옆 한 줄). 상단 내비는 이미
 * 여섯 항목이고(§1.6c 는 다섯을 860px 레일에 겨우 세웠다) 이 화면은 도감의 곁문이지
 * 본류의 목차가 아니다. 넣고 싶어지면 §1.6c 의 레일 폭부터 다시 재라.
 *
 * ── 이 화면이 하지 않는 일 ─────────────────────────────────────────
 * · **탄생화 366행을 싣지 않는다.** 달마다 가는 것은 그리로 건너가는 다리가 쓸 숫자
 *   하나뿐이다(§1.5m ③ — 사전은 `/flowers` 가 달 단위로 펼친다).
 * · **오늘을 서버에서 보지 않는다.** 「지금 달」 판정은 브라우저의 몫이다(§1.5q 의 만료
 *   판정과 같은 원리) — 여기서 정하면 배포한 날의 이번 달이 정적 HTML 에 굳는다.
 * · **꽃말·이야기를 다시 말하지 않는다.** 칩을 누르면 도감 상세가 그것을 이미 갖고 있다.
 *
 * `revalidate = 3600` — `content/*.csv` 는 배포에 고정된 읽기 전용 데이터다(/flowers 와 같다).
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '계절 달력 — dearbloom',
  description:
    '이번 달엔 어떤 꽃이 필까요. 달마다 그때 피는 꽃을 모아 두었어요 — 봄의 프리지아부터 겨울의 동백까지, 지금 만날 수 있는 꽃부터 골라보세요.',
};

export default async function CalendarPage() {
  const catalog = await loadCatalog();
  const { flowers, months, bloomingCount, yearRoundCount, credits } = buildBloomCalendar(catalog);

  return (
    <div className={styles.page}>
      <span className={styles.grain} aria-hidden="true" />

      <header className={styles.siteHead}>
        <div className={`${styles.wrap} ${styles.siteHeadRow}`}>
          <Link className={styles.logo} href="/">
            dearbloom
          </Link>
          <span className={styles.eyebrow}>Bloom calendar</span>
        </div>
      </header>

      {/* ── 1. 인트로 ───────────────────────────────────────────── */}
      <section className={styles.intro}>
        <div className={styles.introBg} aria-hidden="true" />
        <div className={styles.wrap}>
          <h1 className={styles.title}>계절 달력</h1>
          <p className={`${styles.lead} ${styles.sub}`}>
            꽃은 철 따라 들고 나요. 달마다 그때 피는 꽃을 모아 두었으니, 지금 만날 수 있는
            꽃부터 골라보세요.
          </p>

          {/* 실데이터 그대로 — 꽃이 늘면 이 숫자가 먼저 따라 움직인다. */}
          <ul className={styles.stats}>
            <li className={styles.stat}>
              <span className={styles.statNum}>12</span>
              <span className={styles.statLabel}>달</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{bloomingCount}</span>
              <span className={styles.statLabel}>종이 달력에 서요</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{yearRoundCount}</span>
              <span className={styles.statLabel}>종은 사철 만나요</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ── 2. 열두 달 ──────────────────────────────────────────── */}
      <main>
        <section className={styles.cal} aria-labelledby="cal-title">
          <div className={styles.wrap}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle} id="cal-title">
                달마다 피는 꽃
              </h2>
              <span className={styles.dictCount}>이번 달이 먼저 열려요</span>
            </div>
            <p className={styles.dictLead}>
              달을 누르면 그때 피는 꽃이 펼쳐져요. 꽃을 누르면 그 꽃의 꽃말과 이야기로
              이어드릴게요.
            </p>

            {/*
              개화기는 **한국 기준으로 원장(`content/flowers.csv`)에 적어 둔 값**이다.
              그해 날씨와 지역, 그리고 하우스 재배에 따라 실제로는 앞뒤로 밀린다 —
              그 사실을 여기서 말해 두지 않으면 이 달력이 약속으로 읽힌다.
            */}
            <p className={styles.dictTierNote}>
              적어 둔 개화기는 한국에서 야외로 피는 철이에요. 그해 날씨와 지역에 따라 앞뒤로
              밀리고, 꽃집에서는 철이 아닌 꽃도 만날 수 있어요.
            </p>

            <BloomCalendar flowers={flowers} months={months} />
          </div>
        </section>

        {/* ── 3. 하단 CTA ──────────────────────────────────────── */}
        <section className={styles.cta} aria-labelledby="calendar-cta-title">
          <div className={styles.wrap}>
            <span className={styles.eyebrow}>Next</span>
            <h2 className={styles.ctaTitle} id="calendar-cta-title">
              어떤 꽃이 좋을지 모르겠다면
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
          <p className={styles.footSay}>
            꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
            들려드려요.
          </p>
          <nav className={styles.footNav} aria-label="보조 메뉴">
            <Link href="/">홈으로</Link>
            <Link href="/flowers">꽃 도감</Link>
            <Link href="/stories">꽃에 얽힌 이야기</Link>
            <Link href="/recommend">추천받기</Link>
          </nav>

          {/*
            사진 크레딧 — 랜딩 `Image credits` 와 같은 처리다. 칩 옆에 12px 로 붙이면
            목록이 크레딧 목록이 되고 어차피 읽히지 않는다. 한 벌로 접어 여기 둔다.
          */}
          {credits.length > 0 && (
            <details className={styles.calCredits}>
              <summary className={styles.calCreditSum}>Image credits · {credits.length}</summary>
              <p className={styles.calCreditText}>{credits.join(' · ')}</p>
            </details>
          )}
        </div>
      </footer>
    </div>
  );
}
