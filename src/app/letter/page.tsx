import type { Metadata } from 'next';
import Link from 'next/link';

import LetterEntrance from '@/components/letter/LetterEntrance';
import { buildLetterFlowers } from '@/components/letter/data';
import styles from '@/components/letter/letter.module.css';
import { loadCatalog } from '@/lib/data/catalog';

/**
 * `/letter` — 비밀 편지의 입구.
 *
 * 위는 **여는 문**(편지 번호를 아는 사람), 아래는 **쓰는 문**(편지를 만들 사람)이다.
 * 두 사람이 같은 주소로 오는 화면이라 위계가 흔들리면 안 된다 — 받은 사람은 번호를 들고
 * 오므로 그 칸이 첫 화면 맨 위에 선다.
 *
 * · 꽃 목록은 서버가 통째로 확정해 내려보낸다(`loadCatalog()` → 이름·대표 꽃말·실사·도판).
 *   클라이언트는 카탈로그도 라벨 사전도 갖지 않는다(/stories·/flowers 와 같은 규율).
 * · 편지 자체는 **서버가 모른다.** 지금 단계에서 편지는 그 브라우저의 저장소에만 있다
 *   (`src/lib/letters/store.ts` 머리말). 그래서 이 페이지는 정적으로 서고, 편지를 읽고 쓰는
 *   일은 전부 클라이언트에서 일어난다.
 * · `revalidate = 3600` — `content/*.csv` 는 배포에 고정된 읽기 전용 데이터다.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '비밀 편지 — dearbloom',
  description:
    '번호로 잠기는 편지 한 통. 하고 싶었던 말과 함께 보낼 꽃 한 송이를 골라 두면, 번호를 아는 분만 봉투를 열 수 있어요.',
};

export default async function LetterPage() {
  const catalog = await loadCatalog();
  const flowers = buildLetterFlowers(catalog);

  return (
    <div className={styles.page}>
      <span className={styles.grain} aria-hidden="true" />

      {/*
        머리·발은 본문과 **같은 폭**이어야 한다. `.wrapNarrow`(680) 로 좁힌 것은 본문뿐이라
        머리·발만 940 에 남으면 한 페이지에 왼쪽 끝이 둘 생긴다 — 1024px 위에서 로고가
        제목보다 133px 바깥에 서 있었다(2026-08-16 QA 실측). 스튜디오는 2단이라 940 그대로다.
      */}
      <header className={styles.siteHead}>
        <div className={`${styles.wrap} ${styles.wrapNarrow} ${styles.siteHeadRow}`}>
          <Link className={styles.logo} href="/">
            dearbloom
          </Link>
          <span className={styles.eyebrow}>Secret letter</span>
        </div>
      </header>

      {/* ── 1. 인트로 ───────────────────────────────────────────── */}
      <section className={styles.intro}>
        <div className={styles.introBg} aria-hidden="true" />
        <div className={`${styles.wrap} ${styles.wrapNarrow}`}>
          <h1 className={styles.title}>비밀 편지</h1>
          <p className={`${styles.lead} ${styles.sub}`}>
            꽃 한 송이와 함께 봉해 두는 편지예요. 번호를 아는 분만 봉투를 열 수 있고, 열면 고른
            꽃과 그 꽃말이 편지 끝에 함께 놓여 있어요.
          </p>
        </div>
      </section>

      {/* ── 2. 열기 · 만들기 ────────────────────────────────────── */}
      <main>
        <div className={`${styles.wrap} ${styles.wrapNarrow}`}>
          <LetterEntrance flowers={flowers} />
        </div>
      </main>

      {/* ── 3. 푸터 ─────────────────────────────────────────────── */}
      <footer className={styles.siteFoot}>
        <div className={`${styles.wrap} ${styles.wrapNarrow}`}>
          <p className={styles.footSay}>
            꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
            들려드려요.
          </p>
          <nav className={styles.footNav} aria-label="보조 메뉴">
            <Link href="/">홈으로</Link>
            <Link href="/recommend">추천받기</Link>
            <Link href="/flowers">꽃 도감</Link>
            <Link href="/stories">꽃에 얽힌 이야기</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
