import type { Metadata } from 'next';
import Link from 'next/link';

import {
  STORY_MOOD_FILTERS,
  STORY_MOOD_LABELS,
  colorChoice,
  eraLabel,
  regionLabel,
  storyConfidenceLabel,
  storyTypeLabel,
} from '@/components/flow/labels';
import { categoryOf } from '@/components/landing/landing-data';
import StoriesArchive from '@/components/stories/StoriesArchive';
import { STORY_CATEGORIES } from '@/components/stories/categories';
import { plateCredits } from '@/components/stories/plates';
import styles from '@/components/stories/stories.module.css';
import type { ArchiveFilterChip, ArchiveLane, ArchiveStory } from '@/components/stories/types';
import { loadCatalog } from '@/lib/data/catalog';
import type { CatalogFlower, CatalogStory } from '@/lib/data/types';

/**
 * `/stories` — 꽃에 얽힌 이야기들 (아카이브).
 *
 * 결과 화면은 "고른 꽃"의 이야기만 보여 준다. 그런데 stories.csv 는 이미 89편이고 계속
 * 늘어나는 중이라, 추천을 받지 않고도 **그냥 구경할 수 있는 자리**가 필요했다. 이 화면이
 * 그 자리다 — 이야기 전량을 꽃·결로 골라 보고, 한 장을 누르면 §1.5i 규격의 상세 시트가
 * 전문과 출처까지 펼친다.
 *
 * 보는 방식은 **꽃별 가로 레인**이다(넷플릭스식). 89편을 한 판에 늘어놓으면 "꽃 17종이
 * 있구나" 가 보이지 않고 스크롤만 길어져서, 꽃마다 한 줄로 접고 그 줄 안에서 밀어 본다.
 *
 * · 데이터는 서버가 통째로 확정해 내려보낸다(`loadCatalog()` → 꽃별로 접기 → 한국어 라벨).
 *   클라이언트는 라벨 사전도 엔진도 갖지 않는다 — 어휘가 늘면 이 파일이 자동으로 따라간다.
 * · `revalidate = 3600` — `content/*.csv` 는 배포에 고정된 읽기 전용 데이터라
 *   그 이상 자주 읽을 이유가 없다(랜딩과 같은 판단).
 * · 셸(헤더·인트로·CTA·푸터)은 상태가 없어 서버에서 그대로 렌더하고,
 *   필터·레인·시트만 클라이언트 컴포넌트가 맡는다.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '꽃에 얽힌 이야기들 — dearbloom',
  description:
    '오스만 궁정의 튤립부터 아프로디테의 장미까지. 꽃 한 송이마다 시대와 나라를 건너온 이야기가 있어요. 꽃과 이야기의 결로 골라 읽어 보세요.',
};

/** 필터의 `전체` 칸. 꽃 id·mood 어휘와 겹치지 않는 값이다(라벨 사전과 같은 키). */
const ALL = 'all';

/** stories.csv 한 행 + 꽃 이름 → 화면이 그대로 쓰는 카드. */
function toArchiveStory(story: CatalogStory, flowerNameKo: string): ArchiveStory {
  const isOriginal = story.storyType === 'original';
  const region = regionLabel(story.cultureRegion ?? '');
  const era = eraLabel(story.era);

  const card: ArchiveStory = {
    id: story.storyId,
    flowerId: story.flowerId,
    flowerNameKo,
    title: story.title,
    body: story.storyKo,
    isOriginal,
    typeLabel: storyTypeLabel(story.storyType),
    confidenceLabel: storyConfidenceLabel(story.confidenceLevel, story.sourceKind),
    moods: story.moods,
    moodLabels: story.moods.map((mood) => STORY_MOOD_LABELS[mood]),
  };

  if (story.hook) card.hook = story.hook;
  if (region) card.regionLabel = region;
  if (era) card.eraLabel = era;
  // 창작(original)만 출처가 면제다 — 나머지는 갈래를 각주로 밝힌다(§1.5d·§1.5f).
  if (!isOriginal && story.sourceTitle) {
    card.sourceTitle = story.sourceTitle;
    if (story.sourceUrl) card.sourceUrl = story.sourceUrl;
  }

  return card;
}

/**
 * 이야기를 꽃별 레인으로 접는다 — 화면의 기본 뷰가 그대로 이 모양이다.
 *
 * 줄 순서는 **카탈로그 순서**(flowers.csv)이고, 줄 안은 stories.csv 순서다. 둘 다
 * 결정적이라 다시 찾아온 사람이 같은 자리에서 같은 이야기를 만난다 — 무작위 금지.
 * 이야기가 한 편도 없는 꽃은 줄을 세우지 않는다(빈 레인은 스크롤만 잡아먹는다).
 *
 * 카테고리 점은 `flowers.csv` 대표색(colors[0])의 §1.4 승인 스와치를 쓴다. 테마 5종의
 * accent 는 튤립·프리지아가 같은 골드라 17줄을 갈라 주지 못한다 — 그 카테고리를 정하는
 * 원본이 애초에 대표색이므로(landing-data `CATEGORY_BY_COLOR`) 원본을 그대로 쓴다.
 */
function buildLanes(flowers: CatalogFlower[], stories: ArchiveStory[]): ArchiveLane[] {
  const buckets = new Map<string, ArchiveStory[]>();
  for (const story of stories) {
    const bucket = buckets.get(story.flowerId);
    if (bucket) bucket.push(story);
    else buckets.set(story.flowerId, [story]);
  }

  const lanes: ArchiveLane[] = [];
  for (const flower of flowers) {
    const own = buckets.get(flower.id);
    if (!own || own.length === 0) continue;
    const swatch = colorChoice(flower.colors[0] ?? '');
    lanes.push({
      flowerId: flower.id,
      flowerNameKo: flower.nameKo,
      // 꽃 계열(§1.4c v3.2) — 랜딩의 테마 배정과 **같은 함수**를 쓴다.
      // 화면마다 "이 꽃은 무슨 계열" 이 갈리면 같은 서비스가 두 가지 분류를 갖게 된다.
      category: categoryOf(flower),
      dotColor: swatch.hex,
      dotLabel: swatch.label,
      stories: own,
    });
  }
  return lanes;
}

/**
 * 꽃 계열 칩 — §1.4c 순서 그대로, 이야기가 한 편도 없는 계열은 세우지 않는다.
 *
 * 예전에는 이 자리에 **꽃 31칸**이 서서 390px 화면에서 여섯 줄로 접혔다(필터 바가 화면의
 * 65%를 먹었다). 고르는 값보다 고르는 부담이 커진 상태라, 계열 5칸으로 접고 꽃 한 종을
 * 직접 찾는 일은 `꽃 고르기` 시트로 옮겼다(2026-08-15 사용자 지시).
 */
function categoryChips(lanes: ArchiveLane[]): ArchiveFilterChip[] {
  return STORY_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    count: lanes
      .filter((lane) => lane.category === category.key)
      .reduce((sum, lane) => sum + lane.stories.length, 0),
  })).filter((chip) => chip.count > 0);
}

/** 전체 + 실제로 쓰인 결(엔진 STORY_MOODS 순서). */
function moodChips(stories: ArchiveStory[]): ArchiveFilterChip[] {
  return STORY_MOOD_FILTERS.map((filter) => ({
    key: filter.key,
    label: filter.label,
    count:
      filter.key === ALL
        ? stories.length
        : stories.filter((story) => story.moods.includes(filter.key)).length,
  })).filter((chip) => chip.count > 0);
}

export default async function StoriesPage() {
  const catalog = await loadCatalog();

  const flowerNames = new Map(catalog.flowers.map((flower) => [flower.id, flower.nameKo]));
  const stories = catalog.stories.map((story) =>
    toArchiveStory(story, flowerNames.get(story.flowerId) ?? story.flowerId),
  );

  const lanes = buildLanes(catalog.flowers, stories);
  const moods = moodChips(stories);
  const categories = categoryChips(lanes);
  // 인트로 숫자는 실제로 화면에 세운 것만 센다(레인 = 이야기가 있는 꽃).
  const laneStoryCount = lanes.reduce((sum, lane) => sum + lane.stories.length, 0);
  // 도판 크레딧 — 화면에 실제로 쓴 꽃의 판본만, 판본 단위로 합쳐서(illustration-assets 사용 규칙 4).
  const credits = plateCredits(lanes.map((lane) => lane.flowerId));

  return (
    <div className={styles.page}>
      <span className={styles.grain} aria-hidden="true" />

      <header className={styles.siteHead}>
        <div className={`${styles.wrap} ${styles.siteHeadRow}`}>
          <Link className={styles.logo} href="/">
            dearbloom
          </Link>
          <span className={styles.eyebrow}>Story archive</span>
        </div>
      </header>

      {/* ── 1. 인트로 ───────────────────────────────────────────── */}
      <section className={styles.intro}>
        <div className={styles.introBg} aria-hidden="true" />
        <div className={styles.wrap}>
          <h1 className={styles.title}>꽃에 얽힌 이야기들</h1>
          <p className={`${styles.lead} ${styles.sub}`}>
            같은 꽃도 시대와 나라마다 다른 이야기를 품어요. 오스만 궁정이 신성하게 여긴 튤립,
            여신이 흘린 피로 붉어졌다는 장미 — dearbloom이 모아 온 갈래를 여기 펼쳐 둘게요.
          </p>

          {/* 실데이터 그대로 — 이야기가 늘면 이 숫자가 먼저 따라 움직인다. */}
          <ul className={styles.stats}>
            <li className={styles.stat}>
              <span className={styles.statNum}>{laneStoryCount}</span>
              <span className={styles.statLabel}>편의 이야기</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{lanes.length}</span>
              <span className={styles.statLabel}>가지 꽃</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{moods.length - 1}</span>
              <span className={styles.statLabel}>가지 결</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ── 2. 필터 · 꽃별 레인 · 상세 시트 ─────────────────────── */}
      <main>
        <StoriesArchive lanes={lanes} moodChips={moods} categoryChips={categories} />

        {/* ── 3. 하단 CTA ──────────────────────────────────────── */}
        <section className={styles.cta} aria-labelledby="stories-cta-title">
          <div className={styles.wrap}>
            <span className={styles.eyebrow}>Next</span>
            <h2 className={styles.ctaTitle} id="stories-cta-title">
              이 꽃으로 마음을 전해볼까요?
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
            도판 크레딧 — `docs/illustration-assets.md` 사용 규칙 4.
            표기 형식 `Plate: {작품명}, {연도} / {소장·제공 기관}` 을 그대로 쓴다.
            31종은 전부 퍼블릭 도메인·CC0 라 **표기 의무는 없다.** 그래도 적어 두는 이유는
            BHL→Flickr 경유 파일에 `CC BY 2.0` 상자가 기계적으로 함께 붙어 있어서다 —
            분쟁 여지를 0으로 만드는 가장 싼 보험이고, 아카이브라는 톤에도 출처가 어울린다.
          */}
          <section className={styles.credits} aria-labelledby="plate-credits-title">
            <h2 className={styles.creditsTitle} id="plate-credits-title">
              <span className={styles.eyebrow}>Image credits</span>
              <span className={styles.srOnly}>도판 출처</span>
            </h2>
            <p className={styles.creditsLead}>
              레인과 이야기 카드의 세밀화는 19세기 전후의 식물 도감에서 왔어요. 모두 퍼블릭
              도메인·CC0 도판이고, 판본을 아래에 밝혀 둘게요.
            </p>
            <ul className={styles.creditList}>
              {credits.map((credit) => (
                <li className={styles.creditItem} key={credit}>
                  {credit}
                </li>
              ))}
            </ul>
          </section>

          <p className={styles.footSay}>
            꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
            들려드려요.
          </p>
          <nav className={styles.footNav} aria-label="보조 메뉴">
            <Link href="/">홈으로</Link>
            <Link href="/recommend">추천받기</Link>
            <Link href="/groups">여러 명에게</Link>
            <Link href="/partners">함께하는 꽃집</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
