import type { Metadata } from 'next';
import Link from 'next/link';

import BirthDictionary from '@/components/flowers/BirthDictionary';
import BirthdayFinder from '@/components/flowers/BirthdayFinder';
import FlowerSearch from '@/components/flowers/FlowerSearch';
import { BIRTH_DICT_CATALOG_TITLE, BIRTH_DICT_TITLE } from '@/components/flowers/birth-copy';
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
 * · **생일 꽃 찾기 · 탄생화 사전**은 예외적으로 값을 미리 내려보내지 않는다 — 탄생화
 *   366행은 실제로 하루치(찾기) 또는 한 달치(사전)만 읽히므로 서버 액션으로 그때
 *   가져온다(`actions.ts` 주석에 근거). 미리 가는 것은 달력 12개 숫자와 통계 두 개뿐이다.
 *
 * ⚠ 이 화면은 **2단 티어**를 드러내는 자리다(§1.5m ⑤). 정식 도감(검증 완료 32종)과
 *   탄생화 사전(이름·꽃말만 옮긴 366일)을 한 숫자로 합치지 마라 — 인트로 통계·사전 구획·
 *   목록 줄의 티어 표시가 전부 그 구분 위에 서 있다.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '꽃 도감 — dearbloom',
  description:
    '꽃 이름으로 찾아보세요. 흰 튤립부터 은방울꽃까지, 꽃 한 종마다 색깔별 꽃말과 시대·나라를 건너온 이야기를 모아 두었어요.',
};

export default async function FlowersPage() {
  const catalog = await loadCatalog();
  const {
    flowers,
    groups,
    meaningCount,
    storyCount,
    birthCalendar,
    birthDayCount,
    birthSpeciesCount,
  } = buildFlowerIndex(catalog);

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

          {/* 실데이터 그대로 — 꽃·꽃말·이야기가 늘면 이 숫자가 먼저 따라 움직인다.
              첫 두 칸이 **2단 티어**다(§1.5m ⑤): 검증을 마친 정식 도감과, 이름·꽃말만
              먼저 옮겨 둔 탄생화 사전. 둘을 한 숫자로 합치면 어느 쪽도 정직하지 않다. */}
          <ul className={styles.stats}>
            <li className={styles.stat}>
              <span className={styles.statNum}>{flowers.length}</span>
              <span className={styles.statLabel}>종 · {BIRTH_DICT_CATALOG_TITLE}</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{birthDayCount}</span>
              <span className={styles.statLabel}>일 · {BIRTH_DICT_TITLE}</span>
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

          {/*
            계절로 들어가는 문(`/calendar`) — 진입점 둘 중 하나다(다른 하나는 바로 아래
            생일 찾기 옆). 상단 내비에는 넣지 않는다: 항목이 이미 여섯이고(§1.6c 는 다섯을
            860px 레일에 겨우 세웠다) 달력은 도감의 곁문이지 본류의 목차가 아니다.

            ⚠ **줄 수가 늘 하나여야 한다**(CLS 0 규율 — 바로 아래 경고와 같은 자리).
              그래서 `.calLink` 가 `white-space: nowrap` 을 걸고 있다. 문구를 길게 고치면
              390px 에서 두 줄이 되면서 그 규율이 깨진다 — 늘리려거든 폭부터 재라.
          */}
          <Link className={`${styles.calLink} ${styles.calLinkIntro}`} href="/calendar">
            이번 달엔 어떤 꽃이 필까요
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13M12.5 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          {/* 다발 짜기(/bouquet)의 도감 쪽 진입점 — 달력 문과 같은 결·같은 한 줄 규율(§1.5v). */}
          <Link className={`${styles.calLink} ${styles.calLinkIntro}`} href="/bouquet">
            내 손으로 다발을 짜 볼 수도 있어요
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13M12.5 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>


          {/*
            ⚠ **여기에 설명 문단을 덧붙이지 마라**(CLS 0 규율, 2026-08-16 실측).
            인트로는 `<main>` **위**에 있어서, 이 자리의 텍스트가 웹폰트 교체로 한 줄만
            늘어도 아래 화면 전체가 밀린다. 실제로 두 티어를 설명하는 3줄짜리 문단을
            여기 뒀다가 1280px CLS 가 **0.005 → 0.17** 로 뛰었다(폰트 스왑이 늦게 도착한
            로드에서 재현). 그 설명은 사전 구획 안으로 옮겼다 — 거기서는 같은 재배치가
            화면 밖에서 일어나 이동으로 세어지지 않는다.
            티어 구분 자체는 위 통계 라벨(`종 · 정식 도감` / `일 · 탄생화 사전`)이 말한다.
          */}
        </div>
      </section>

      {/* ── 2. 검색 · 카테고리 그리드 ───────────────────────────── */}
      <main>
        <FlowerSearch flowers={flowers} groups={groups} />

        {/* ── 3. 생일 꽃 찾기 ──────────────────────────────────────
            이름 검색이 "아는 꽃"으로 들어가는 문이라면 여기는 **"내 날짜"로** 들어가는 문이다.
            검색 뒤에 두는 이유: 도감의 본 기능은 이름으로 찾는 것이고, 이쪽은 곁문이다.
            표 366행은 클라이언트로 내려보내지 않는다 — 일 셀렉트가 필요로 하는 달력
            12개 숫자만 넘기고, 고른 하루는 서버 액션이 가져온다(`app/flowers/actions.ts`). */}
        <BirthdayFinder calendar={birthCalendar} />

        {/* ── 4. 탄생화 사전 ───────────────────────────────────────
            생일 찾기가 "내 날짜 하루"라면 여기는 **표 전체를 훑는** 문이다(§1.5m ⑤).
            366일 전체를 열람 가능하게 하되 정식 도감과 티어를 눈으로 구별되게 그린다.
            여기 넘어가는 것도 366행이 아니라 **숫자 두 개**다 — 목록은 달을 고른 사람만
            서버 액션(`listBirthMonth`)으로 한 달치씩 받는다. */}
        <BirthDictionary
          catalogCount={flowers.length}
          dayCount={birthDayCount}
          speciesCount={birthSpeciesCount}
        />

        {/* ── 5. 하단 CTA ──────────────────────────────────────── */}
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

      {/* ── 6. 푸터 ─────────────────────────────────────────────── */}
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
