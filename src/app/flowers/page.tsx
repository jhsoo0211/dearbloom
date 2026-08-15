import type { Metadata } from 'next';
import Link from 'next/link';

import FlowerSearch from '@/components/flowers/FlowerSearch';
import { buildFlowerIndex } from '@/components/flowers/data';
import styles from '@/components/flowers/flowers.module.css';
import { loadCatalog } from '@/lib/data/catalog';

/**
 * `/flowers` — 꽃 도감(검색 · 전체 목록).
 *
 * `/stories` 가 "이야기"로 들어가는 문이라면 여기는 **"꽃 이름"으로 들어가는 문**이다.
 * 아는 꽃 하나를 떠올린 사람(장미·튤립·프리지아)이 추천 플로우를 거치지 않고 곧장
 * 그 꽃의 꽃말과 이야기에 닿게 한다.
 *
 * · 데이터는 서버가 통째로 확정해 내려보낸다(`loadCatalog()` → 요약 31종 + 카테고리 5그룹).
 *   클라이언트는 라벨 사전도 엔진도 갖지 않고, 문자열 색인에 `includes` 만 한다.
 * · `revalidate = 3600` — `content/*.csv` 는 배포에 고정된 읽기 전용 데이터다(/stories 와 같은 판단).
 * · 셸(헤더·인트로·CTA·푸터)은 상태가 없어 서버에서 그대로 렌더하고, 검색만 클라이언트가 맡는다.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '꽃 도감 — dearbloom',
  description:
    '꽃 이름으로 찾아보세요. 흰 튤립부터 은방울꽃까지, 꽃 한 종마다 색깔별 꽃말과 시대·나라를 건너온 이야기를 모아 두었어요.',
};

export default async function FlowersPage() {
  const catalog = await loadCatalog();
  const { flowers, groups, meaningCount, storyCount } = buildFlowerIndex(catalog);

  return (
    <div className={styles.page}>
      <span className={styles.grain} aria-hidden="true" />

      <header className={styles.siteHead}>
        <div className={`${styles.wrap} ${styles.siteHeadRow}`}>
          <Link className={styles.logo} href="/">
            dearbloom
          </Link>
          <span className={styles.eyebrow}>Flower index</span>
        </div>
      </header>

      {/* ── 1. 인트로 ───────────────────────────────────────────── */}
      <section className={styles.intro}>
        <div className={styles.introBg} aria-hidden="true" />
        <div className={styles.wrap}>
          <h1 className={styles.title}>꽃 도감</h1>
          <p className={`${styles.lead} ${styles.sub}`}>
            떠오르는 꽃 이름이 있다면 여기서 바로 찾아보세요. 그 꽃이 색깔마다 어떤 말을
            품는지, 어느 나라에서 어떤 이야기로 전해졌는지 한자리에 모아 두었어요.
          </p>

          {/* 실데이터 그대로 — 꽃·꽃말·이야기가 늘면 이 숫자가 먼저 따라 움직인다. */}
          <ul className={styles.stats}>
            <li className={styles.stat}>
              <span className={styles.statNum}>{flowers.length}</span>
              <span className={styles.statLabel}>가지 꽃</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{meaningCount}</span>
              <span className={styles.statLabel}>가지 꽃말</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{storyCount}</span>
              <span className={styles.statLabel}>편의 이야기</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ── 2. 검색 · 카테고리 그리드 ───────────────────────────── */}
      <main>
        <FlowerSearch flowers={flowers} groups={groups} />

        {/* ── 3. 하단 CTA ──────────────────────────────────────── */}
        <section className={styles.cta} aria-labelledby="flowers-cta-title">
          <div className={styles.wrap}>
            <span className={styles.eyebrow}>Next</span>
            <h2 className={styles.ctaTitle} id="flowers-cta-title">
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
            <Link href="/recommend">추천받기</Link>
            <Link href="/stories">꽃에 얽힌 이야기</Link>
            <Link href="/groups">여러 명에게</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
