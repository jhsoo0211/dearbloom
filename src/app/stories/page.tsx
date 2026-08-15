import type { Metadata } from 'next';
import Link from 'next/link';

import {
  STORY_CONFIDENCE_LABELS,
  STORY_MOOD_FILTERS,
  STORY_MOOD_LABELS,
  eraLabel,
  regionLabel,
  storyTypeLabel,
} from '@/components/flow/labels';
import StoriesArchive from '@/components/stories/StoriesArchive';
import styles from '@/components/stories/stories.module.css';
import type { ArchiveFilterChip, ArchiveStory } from '@/components/stories/types';
import { loadCatalog } from '@/lib/data/catalog';
import type { Catalog, CatalogStory } from '@/lib/data/types';

/**
 * `/stories` — 꽃에 얽힌 이야기들 (아카이브).
 *
 * 결과 화면은 "고른 꽃"의 이야기만 보여 준다. 그런데 stories.csv 는 이미 89편이고 계속
 * 늘어나는 중이라, 추천을 받지 않고도 **그냥 구경할 수 있는 자리**가 필요했다. 이 화면이
 * 그 자리다 — 이야기 전량을 꽃·결로 골라 보고, 한 장을 누르면 §1.5i 규격의 상세 시트가
 * 전문과 출처까지 펼친다.
 *
 * · 데이터는 서버가 통째로 확정해 내려보낸다(`loadCatalog()` → 꽃 이름과 조인 → 한국어 라벨).
 *   클라이언트는 라벨 사전도 엔진도 갖지 않는다 — 어휘가 늘면 이 파일이 자동으로 따라간다.
 * · `revalidate = 3600` — `content/*.csv` 는 배포에 고정된 읽기 전용 데이터라
 *   그 이상 자주 읽을 이유가 없다(랜딩과 같은 판단).
 * · 셸(헤더·인트로·CTA·푸터)은 상태가 없어 서버에서 그대로 렌더하고,
 *   필터·그리드·시트만 클라이언트 컴포넌트가 맡는다.
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
    confidenceLabel: STORY_CONFIDENCE_LABELS[story.confidenceLevel],
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
 * 꽃을 번갈아 세운 순서로 늘어놓는다.
 *
 * CSV 순서 그대로 두면 첫 화면이 한 꽃의 이야기로만 채워진다(장미 8편 → 튤립 10편 …).
 * 아카이브의 첫인상은 "여러 꽃이 있구나" 여야 해서, 꽃마다 한 편씩 돌아가며 뽑는다.
 * 무작위가 아니라 **결정적**이다 — 재생성마다 순서가 흔들리면 다시 찾아온 사람이 헤맨다.
 */
function interleaveByFlower(stories: ArchiveStory[], flowerOrder: string[]): ArchiveStory[] {
  const buckets = new Map<string, ArchiveStory[]>();
  for (const flowerId of flowerOrder) buckets.set(flowerId, []);
  for (const story of stories) {
    // 카탈로그에 없는 꽃은 교차 검증이 막아 주지만, 막히더라도 이야기를 잃지 않게 칸을 만든다.
    const bucket = buckets.get(story.flowerId);
    if (bucket) bucket.push(story);
    else buckets.set(story.flowerId, [story]);
  }

  const out: ArchiveStory[] = [];
  for (let depth = 0; out.length < stories.length; depth += 1) {
    let added = false;
    for (const bucket of buckets.values()) {
      const story = bucket[depth];
      if (!story) continue;
      out.push(story);
      added = true;
    }
    // 어느 칸에도 그 깊이의 이야기가 없으면 끝이다(길이 조건과 함께 무한 루프를 막는다).
    if (!added) break;
  }
  return out;
}

/** 전체 + 실제로 이야기가 있는 꽃(카탈로그 순서). 눌러도 빈 화면이 되는 칩은 세우지 않는다. */
function flowerChips(catalog: Catalog, stories: ArchiveStory[]): ArchiveFilterChip[] {
  const counts = new Map<string, number>();
  for (const story of stories) counts.set(story.flowerId, (counts.get(story.flowerId) ?? 0) + 1);

  const chips: ArchiveFilterChip[] = [{ key: ALL, label: '전체', count: stories.length }];
  for (const flower of catalog.flowers) {
    const count = counts.get(flower.id) ?? 0;
    if (count > 0) chips.push({ key: flower.id, label: flower.nameKo, count });
  }
  return chips;
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
  const stories = interleaveByFlower(
    catalog.stories.map((story) =>
      toArchiveStory(story, flowerNames.get(story.flowerId) ?? story.flowerId),
    ),
    catalog.flowers.map((flower) => flower.id),
  );

  const flowers = flowerChips(catalog, stories);
  const moods = moodChips(stories);
  // 칩의 첫 칸은 `전체` 라 꽃 수는 그만큼 뺀다.
  const flowerCount = flowers.length - 1;

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
              <span className={styles.statNum}>{stories.length}</span>
              <span className={styles.statLabel}>편의 이야기</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{flowerCount}</span>
              <span className={styles.statLabel}>가지 꽃</span>
            </li>
            <li className={styles.stat}>
              <span className={styles.statNum}>{moods.length - 1}</span>
              <span className={styles.statLabel}>가지 결</span>
            </li>
          </ul>
        </div>
      </section>

      {/* ── 2. 필터 · 그리드 · 상세 시트 ────────────────────────── */}
      <main>
        <StoriesArchive stories={stories} flowerChips={flowers} moodChips={moods} />

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
