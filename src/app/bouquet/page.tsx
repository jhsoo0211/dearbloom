import type { Metadata } from 'next';
import Link from 'next/link';

import BouquetStudio from '@/components/bouquet/BouquetStudio';
import { bouquetStats, buildBouquetIndex } from '@/components/bouquet/build';
import styles from '@/components/bouquet/bouquet.module.css';
import { loadCatalog } from '@/lib/data/catalog';

/**
 * `/bouquet` — 다발 짜기.
 *
 * 도감이 "이 꽃은 무엇인가" 를 말하는 자리라면, 여기는 **"이 꽃들을 함께 두면 어떤가"** 를
 * 말하는 자리다(design-spec §1.5v). 주 꽃 하나 · 곁들이 0~2 · 색 하나를 고르면 우리
 * 데이터가 아는 것만 판정 카드로 돌려준다 — 반려동물 교차 검사 · 색 · 향 · 꽃말.
 *
 * ── 이 화면이 하지 않는 일 ──────────────────────────────────────────
 * · **궁합 점수를 매기지 않는다.** 색 이론으로 별점을 주는 코드가 한 줄도 없다.
 *   말할 것이 없으면 없다고 말한다(`lib/engine/bouquet.ts` 의 금지선).
 * · **사진을 합성하지 않는다.** 다발 미리보기는 색 점과 세밀화 썸네일뿐이다.
 *   없는 사진을 지어내면 그 순간 이 화면이 상품 페이지가 된다.
 * · **결과를 공유하지 않는다.** 공유 부호 스키마가 아직 없다(후속).
 *
 * ── 서버가 하는 일은 한 번뿐이다 ────────────────────────────────────
 * `loadCatalog()` → `buildBouquetIndex()` 로 59종을 한 벌 좁혀 props 로 내려보내고 끝이다.
 * 조합을 바꿀 때마다 도는 판정은 전부 브라우저의 순수 계산이라 **서버 액션이 하나도 없다** —
 * 그래서 정적 드롭 데모(`out/`)에서도 이 화면이 통째로 그대로 선다.
 * ⚠ 여기에 서버 액션을 들이지 마라. 들이는 순간 `output: 'export'` 빌드가 깨진다.
 *
 * `revalidate = 3600` — `content/*.csv` 는 배포에 고정된 읽기 전용 데이터다
 * (`/flowers` · `/stories` · `/reads` 와 같은 판단).
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '다발 짜기 — dearbloom',
  description:
    '가운데 설 꽃 하나에 곁들이를 더해 다발을 짜 보세요. 반려동물에게 위험한 조합인지, 색과 향은 어떻게 만나는지, 그 다발이 어떤 말을 품는지 저희 데이터가 아는 것만 알려드려요.',
};

export default async function BouquetPage() {
  const catalog = await loadCatalog();
  const index = buildBouquetIndex(catalog);
  const { mainCount, accentCount, colorCount } = bouquetStats(index);

  return (
    <div className={styles.page}>
      <span className={styles.grain} aria-hidden="true" />

      <header className={styles.siteHead}>
        <div className={`${styles.wrap} ${styles.siteHeadRow}`}>
          <Link className={styles.logo} href="/">
            dearbloom
          </Link>
          <span className={styles.eyebrow}>Bouquet studio</span>
        </div>
      </header>

      {/* ── 1. 인트로 ───────────────────────────────────────────── */}
      <section className={styles.intro}>
        <div className={styles.introBg} aria-hidden="true" />
        <div className={styles.wrap}>
          <h1 className={styles.title}>다발 짜기</h1>
          <p className={`${styles.lead} ${styles.sub}`}>
            가운데 설 꽃 하나를 고르고, 곁에 둘 것을 더해 보세요. 그 조합이 반려동물에게
            안전한지, 색과 향은 어떻게 만나는지, 어떤 말을 품게 되는지 저희가 아는 만큼만
            읽어드릴게요.
          </p>

          {/* 실데이터 그대로 — 꽃이 늘면 이 숫자가 먼저 따라 움직인다. */}
          <ul className={styles.stats}>
            <li className={styles.stat}>
              <span className={styles.statNum}>{mainCount}</span>
              <span className={styles.statLabel}>종 중에 가운데 꽃</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{accentCount}</span>
              <span className={styles.statLabel}>가지 곁들이</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{colorCount}</span>
              <span className={styles.statLabel}>가지 색</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ── 2. 고르기 · 판정 ────────────────────────────────────── */}
      <main>
        <BouquetStudio flowers={index.flowers} />
      </main>

      {/* ── 3. 푸터 ─────────────────────────────────────────────── */}
      <footer className={styles.siteFoot}>
        <div className={styles.wrap}>
          <p className={styles.footSay}>
            여기서 짠 다발은 주문서가 아니에요. 실제로 어떤 꽃이 들어오는지는 그날 시장이
            정하니, 꽃집에 이 조합을 그대로 보여 주고 상의해 보세요.
          </p>

          <nav className={styles.footNav} aria-label="보조 메뉴">
            <Link href="/">홈으로</Link>
            <Link href="/flowers">꽃 도감</Link>
            <Link href="/recommend">추천받기</Link>
            <Link href="/groups">여러 명에게</Link>
          </nav>

          {/*
            도판 크레딧 — 칩에 그림을 걸었으니 이 화면도 출처를 진다
            (`docs/illustration-assets.md` 사용 규칙 4 · `/stories` · `/reads` 와 같은 형식).
            ⚠ 액자를 하나도 안 건 날에는 이 구획도 없다 — 있지도 않은 것을 설명하는 문장은
              사용자에게 아무 뜻이 없다.
          */}
          {index.credits.length > 0 ? (
            <section className={styles.credits} aria-labelledby="bq-credits-title">
              <h2 className={styles.creditsTitle} id="bq-credits-title">
                <span className={styles.eyebrow}>Image credits</span>
                <span className={styles.srOnly}>도판 출처</span>
              </h2>
              <p className={styles.creditsLead}>
                칩에 붙은 작은 그림은 그 꽃의 세밀화예요. 19세기 전후 식물 도감에서 온 퍼블릭
                도메인·CC0 도판이고, 어느 판본에서 왔는지 아래에 적어 둘게요.
              </p>
              <ul className={styles.creditList}>
                {index.credits.map((credit) => (
                  <li className={styles.creditItem} key={credit}>
                    {credit}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
