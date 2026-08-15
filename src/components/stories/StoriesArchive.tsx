'use client';

/**
 * 이야기 아카이브의 움직이는 부분 — 필터 바 · 카드 그리드 · 상세 시트.
 *
 * 이야기는 전부(89편+) 서버가 한 번에 내려보낸다. 텍스트뿐이라 통째로 들고 있어도
 * 가벼워서, 필터를 누를 때마다 서버를 다시 다녀오지 않고 **클라이언트에서 거른다**
 * (아카이브의 값은 "이것저것 눌러 보는 재미"라 반응이 즉각적이어야 한다).
 *
 * 여기서 문장을 새로 지어내지 않는다 — 라벨은 전부 서버가 붙여 준 값이다.
 */

import { useMemo, useState } from 'react';

import StorySheet from './StorySheet';
import styles from './stories.module.css';
import type { ArchiveFilterChip, ArchiveStory } from './types';

/** 필터의 `전체` 칸. 꽃 id·mood 어휘와 겹치지 않는 값이다. */
const ALL = 'all';

export interface StoriesArchiveProps {
  /** 이야기 전량. 순서는 서버가 정한다(꽃을 번갈아 세운 순서). */
  stories: ArchiveStory[];
  /** 전체 + 이야기가 있는 꽃(카탈로그 순서). */
  flowerChips: ArchiveFilterChip[];
  /** 전체 + 실제로 쓰인 결(엔진 STORY_MOODS 순서). */
  moodChips: ArchiveFilterChip[];
}

export default function StoriesArchive({ stories, flowerChips, moodChips }: StoriesArchiveProps) {
  const [flower, setFlower] = useState<string>(ALL);
  const [mood, setMood] = useState<string>(ALL);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      stories.filter(
        (story) =>
          (flower === ALL || story.flowerId === flower) &&
          (mood === ALL || story.moods.includes(mood)),
      ),
    [stories, flower, mood],
  );

  /** 시트의 이전/다음은 **지금 걸러 놓은 목록 안에서만** 순환한다. */
  const openIndex = filtered.findIndex((story) => story.id === openId);
  const openStory = openIndex === -1 ? null : filtered[openIndex];

  function moveStory(delta: number) {
    if (openIndex === -1) return;
    const next = (openIndex + delta + filtered.length) % filtered.length;
    setOpenId(filtered[next].id);
  }

  const filterOn = flower !== ALL || mood !== ALL;

  return (
    <>
      <section className={styles.board} aria-labelledby="archive-h">
        <div className={styles.filters}>
          <div className={styles.wrap}>
            <h2 className={styles.srOnly} id="archive-h">
              이야기 골라 보기
            </h2>

            <div className={styles.filterRow}>
              <span className={styles.filterLabel} id="flower-filter-label">
                꽃
              </span>
              <div className={styles.chips} role="group" aria-labelledby="flower-filter-label">
                {flowerChips.map((chip) => {
                  const on = chip.key === flower;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      className={on ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                      aria-pressed={on}
                      aria-label={`${chip.label} ${chip.count}편`}
                      onClick={() => setFlower(chip.key)}
                    >
                      {chip.label}
                      <span className={styles.chipCount} aria-hidden="true">
                        {chip.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.filterRow}>
              <span className={styles.filterLabel} id="mood-filter-label">
                이야기의 결
              </span>
              <div className={styles.chips} role="group" aria-labelledby="mood-filter-label">
                {moodChips.map((chip) => {
                  const on = chip.key === mood;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      className={on ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                      aria-pressed={on}
                      aria-label={`${chip.label} ${chip.count}편`}
                      onClick={() => setMood(chip.key)}
                    >
                      {chip.label}
                      <span className={styles.chipCount} aria-hidden="true">
                        {chip.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className={styles.count} aria-live="polite" data-testid="story-count">
              <b>{filtered.length}편</b>
              <span className={styles.countTail}>
                {filterOn ? `전체 ${stories.length}편 중에서 골랐어요` : '지금까지 모은 이야기예요'}
              </span>
              {filterOn ? (
                <button
                  type="button"
                  className={styles.reset}
                  onClick={() => {
                    setFlower(ALL);
                    setMood(ALL);
                  }}
                >
                  전부 다시 보기
                </button>
              ) : null}
            </p>
          </div>
        </div>

        <div className={styles.wrap}>
          {filtered.length > 0 ? (
            <ul className={styles.grid}>
              {filtered.map((story) => {
                const place = [story.regionLabel, story.eraLabel]
                  .filter((part) => Boolean(part))
                  .join(' · ');
                return (
                  <li key={story.id}>
                    <button
                      type="button"
                      className={styles.card}
                      onClick={() => setOpenId(story.id)}
                    >
                      <span className={styles.cardFlower}>{story.flowerNameKo}</span>
                      <span className={styles.cardTitle}>{story.title}</span>
                      {story.hook ? <span className={styles.cardHook}>{story.hook}</span> : null}

                      {story.moodLabels.length > 0 ? (
                        <span className={styles.cardMoods}>
                          {story.moodLabels.map((label) => (
                            <span className={`${styles.tag} ${styles.tagMood}`} key={label}>
                              {label}
                            </span>
                          ))}
                        </span>
                      ) : null}

                      <span className={styles.cardTags}>
                        {place ? <span className={styles.tag}>{place}</span> : null}
                        <span
                          className={
                            story.isOriginal ? `${styles.tag} ${styles.tagOriginal}` : styles.tag
                          }
                        >
                          {story.typeLabel}
                        </span>
                      </span>

                      <span className={styles.cardMore} aria-hidden="true">
                        이야기 펼쳐 보기
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.empty}>
              고르신 조건에 맞는 이야기가 아직 없어요. 다른 꽃이나 다른 결로 한 번 더 골라 보세요.
            </p>
          )}
        </div>
      </section>

      {openStory ? (
        <StorySheet
          story={openStory}
          position={openIndex + 1}
          total={filtered.length}
          onPrev={() => moveStory(-1)}
          onNext={() => moveStory(1)}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </>
  );
}
