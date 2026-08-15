import type { Metadata } from 'next';
import Link from 'next/link';

import LetterStudio from '@/components/letter/LetterStudio';
import { buildLetterFlowers } from '@/components/letter/data';
import styles from '@/components/letter/letter.module.css';
import { loadCatalog } from '@/lib/data/catalog';
import { DEFAULT_LETTER_THEME } from '@/lib/letters/types';

/**
 * `/letter/studio` — 편지 만들기·고쳐 쓰기.
 *
 * 서버가 하는 일은 **꽃 목록을 확정해 넘기는 것뿐**이다. 편지는 이 기기의 저장소에만 있고
 * (`src/lib/letters/store.ts`), 고쳐 쓸 편지의 id 는 폼이 마운트 뒤에 주소에서 읽는다 —
 * 서버가 검색 파라미터를 읽으면 이 화면이 정적 렌더에서 떨어져 나가는데, 그렇게 해서
 * 얻을 것이 하나도 없다(서버는 그 편지를 볼 수 없다).
 *
 * `revalidate = 3600` — 꽃 목록의 원본인 `content/*.csv` 는 배포에 고정된 데이터다.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '편지 쓰기 — dearbloom',
  description:
    '받는 분과 하고 싶었던 말, 함께 보낼 꽃 한 송이와 색감을 고르면 번호로 잠긴 편지 한 통이 돼요.',
};

export default async function LetterStudioPage() {
  const catalog = await loadCatalog();
  const flowers = buildLetterFlowers(catalog);

  return (
    <div className={styles.page}>
      <span className={styles.grain} aria-hidden="true" />

      <header className={styles.siteHead}>
        <div className={`${styles.wrap} ${styles.siteHeadRow}`}>
          <Link className={styles.logo} href="/">
            dearbloom
          </Link>
          <span className={styles.eyebrow}>Letter studio</span>
        </div>
      </header>

      {/* ── 1. 인트로 ───────────────────────────────────────────── */}
      <section className={styles.intro}>
        <div className={styles.introBg} aria-hidden="true" />
        <div className={styles.wrap}>
          <h1 className={styles.title}>편지 쓰기</h1>
          <p className={`${styles.lead} ${styles.sub}`}>
            적는 대로 오른쪽 편지지에 그대로 앉아요. 다 쓰면 편지 번호를 정하고, 그 번호를 전할
            분께만 알려 주세요.
          </p>
        </div>
      </section>

      {/* ── 2. 폼 · 미리보기 ───────────────────────────────────── */}
      <main>
        <div className={styles.wrap}>
          <LetterStudio flowers={flowers} defaultTheme={DEFAULT_LETTER_THEME} />
        </div>
      </main>

      {/* ── 3. 푸터 ─────────────────────────────────────────────── */}
      <footer className={styles.siteFoot}>
        <div className={styles.wrap}>
          <p className={styles.footSay}>
            편지는 남기려고 쓰는 글이라 저장해요. 지금은 이 기기에만 간직해 두고, 서비스가 문을
            열면 번호를 아는 분이 어디서든 열어볼 수 있게 돼요.
          </p>
          <nav className={styles.footNav} aria-label="보조 메뉴">
            <Link href="/letter">편지 입구</Link>
            <Link href="/">홈으로</Link>
            <Link href="/flowers">꽃 도감</Link>
            <Link href="/stories">꽃에 얽힌 이야기</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
