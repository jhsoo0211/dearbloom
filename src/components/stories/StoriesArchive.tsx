'use client';

/**
 * 이야기 아카이브의 움직이는 부분 — 건너뛰기 바 · 결 필터 · 꽃별 가로 레인 · 상세 시트.
 *
 * 이야기는 전부(89편+) 서버가 한 번에 내려보낸다. 텍스트뿐이라 통째로 들고 있어도
 * 가벼워서, 필터를 누를 때마다 서버를 다시 다녀오지 않고 **클라이언트에서 거른다**
 * (아카이브의 값은 "이것저것 눌러 보는 재미"라 반응이 즉각적이어야 한다).
 *
 * 필터 바의 두 줄은 **하는 일이 다르다.**
 *   · 꽃 = 건너뛰기(내비게이션). 누르면 그 꽃의 레인으로 스크롤해 포커스를 옮기고
 *     헤더에 표시를 남긴다. 레인이 17줄이라 목차가 없으면 아래쪽 꽃에 닿기 어렵다.
 *     ⚠ 예전처럼 "그 꽃만 남기는 필터" 로 되돌리지 마라 — 레인 뷰에서 꽃을 하나로 좁히면
 *       가로줄 하나만 남은 빈 화면이 된다.
 *   · 결(mood) = 진짜 필터. 레인 **안의** 카드를 거르고, 0편이 된 레인은 통째로 감춘다.
 *
 * 여기서 문장을 새로 지어내지 않는다 — 라벨은 전부 서버가 붙여 준 값이다.
 */

import { useCallback, useMemo, useRef, useState } from 'react';

import StoryLane from './StoryLane';
import StorySheet from './StorySheet';
import styles from './stories.module.css';
import type { ArchiveFilterChip, ArchiveLane, ArchiveStory } from './types';

/** 필터의 `전체` 칸. mood 어휘와 겹치지 않는 값이다. */
const ALL = 'all';

function prefersReduce(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export interface StoriesArchiveProps {
  /** 꽃별 레인. 순서는 서버가 정한다(카탈로그 순서). */
  lanes: ArchiveLane[];
  /** 전체 + 실제로 쓰인 결(엔진 STORY_MOODS 순서). */
  moodChips: ArchiveFilterChip[];
}

export default function StoriesArchive({ lanes, moodChips }: StoriesArchiveProps) {
  const [mood, setMood] = useState<string>(ALL);
  const [jumped, setJumped] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  /** 넓은 화면에서 고정되는 필터 바. 건너뛸 때 이 높이만큼 더 내려가야 레인 헤더가 안 가린다. */
  const filtersRef = useRef<HTMLDivElement>(null);
  /** 건너뛰기 대상 — 레인이 스스로 등록한다(마운트 순서·필터와 무관하게 항상 최신). */
  const laneNodes = useRef(new Map<string, HTMLElement>());
  const registerLane = useCallback((flowerId: string, node: HTMLElement | null) => {
    if (node) laneNodes.current.set(flowerId, node);
    else laneNodes.current.delete(flowerId);
  }, []);

  /** 결로 거른 레인. 0편이 된 줄은 여기서 사라진다. */
  const visible = useMemo(
    () =>
      lanes
        .map((lane) => ({
          lane,
          stories:
            mood === ALL
              ? lane.stories
              : lane.stories.filter((story) => story.moods.includes(mood)),
        }))
        .filter((row) => row.stories.length > 0),
    [lanes, mood],
  );

  /** 시트의 이전/다음이 도는 순서 = 화면에 보이는 순서(레인 순서대로 이어 붙인 것). */
  const flat: ArchiveStory[] = useMemo(() => visible.flatMap((row) => row.stories), [visible]);

  const total = useMemo(() => lanes.reduce((sum, lane) => sum + lane.stories.length, 0), [lanes]);

  const openIndex = flat.findIndex((story) => story.id === openId);
  const openStory = openIndex === -1 ? null : flat[openIndex];

  function moveStory(delta: number) {
    if (openIndex === -1) return;
    const next = (openIndex + delta + flat.length) % flat.length;
    setOpenId(flat[next].id);
  }

  /**
   * 그 꽃의 레인으로 데려간다. 포커스까지 옮겨야 키보드 사용자도 실제로 "건너뛴" 것이 된다.
   *
   * `scrollIntoView` 대신 직접 계산하는 이유: 1040px 위에서는 필터 바가 고정되어 있어
   * 레인 헤더가 그 밑으로 숨는다. 바 높이를 CSS `scroll-margin-top` 상수로 박으면
   * **꽃이 늘어 칩이 한 줄 더 접히는 순간 조용히 어긋난다** — 그래서 그때그때 잰다.
   * 좁은 화면에서는 바가 고정이 아니므로(position: static) 0 이 되어 그대로 맨 위에 붙는다.
   */
  function jumpTo(flowerId: string) {
    setJumped(flowerId);
    const node = laneNodes.current.get(flowerId);
    if (!node) return;

    const bar = filtersRef.current;
    const chrome =
      bar && getComputedStyle(bar).position === 'sticky' ? bar.getBoundingClientRect().height : 0;
    const top = node.getBoundingClientRect().top + window.scrollY - chrome - 18;
    window.scrollTo({ top: Math.max(0, top), behavior: prefersReduce() ? 'auto' : 'smooth' });
    node.focus({ preventScroll: true });
  }

  function pickMood(key: string) {
    setMood(key);
    // 결이 바뀌면 레인 구성이 통째로 달라진다 — 아까 건너뛴 표시는 더 이상 맞지 않는다.
    setJumped(null);
  }

  const filterOn = mood !== ALL;

  return (
    <>
      <section className={styles.board} aria-labelledby="archive-h">
        <div className={styles.filters} ref={filtersRef}>
          <div className={styles.wrap}>
            <h2 className={styles.srOnly} id="archive-h">
              이야기 골라 보기
            </h2>

            <div className={styles.filterRow}>
              <span className={styles.filterLabel} id="flower-jump-label">
                꽃<span className={styles.srOnly}> 골라 건너뛰기</span>
              </span>
              <div className={styles.chips} role="group" aria-labelledby="flower-jump-label">
                {visible.map(({ lane, stories }) => {
                  const on = lane.flowerId === jumped;
                  return (
                    <button
                      key={lane.flowerId}
                      type="button"
                      className={on ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                      aria-current={on ? 'true' : undefined}
                      aria-label={`${lane.flowerNameKo} 이야기 ${stories.length}편으로 건너뛰기`}
                      onClick={() => jumpTo(lane.flowerId)}
                    >
                      {lane.flowerNameKo}
                      <span className={styles.chipCount} aria-hidden="true">
                        {stories.length}
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
                      onClick={() => pickMood(chip.key)}
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
              <b>
                {visible.length}개 꽃에서 {flat.length}편
              </b>
              <span className={styles.countTail}>
                {filterOn ? `전체 ${total}편 중에서 골랐어요` : '지금까지 모은 이야기예요'}
              </span>
              {filterOn ? (
                <button type="button" className={styles.reset} onClick={() => pickMood(ALL)}>
                  전부 다시 보기
                </button>
              ) : null}
            </p>
          </div>
        </div>

        <div className={styles.wrap}>
          {visible.length > 0 ? (
            <>
              <p className={styles.laneHint} aria-hidden="true">
                카드를 좌우로 밀어 보세요 · 누르면 이야기가 펼쳐져요
              </p>
              <div className={styles.lanes}>
                {visible.map(({ lane, stories }) => (
                  <StoryLane
                    key={lane.flowerId}
                    lane={lane}
                    stories={stories}
                    jumped={lane.flowerId === jumped}
                    onOpen={setOpenId}
                    onMount={registerLane}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className={styles.empty}>
              고르신 결에 맞는 이야기가 아직 없어요. 다른 결로 한 번 더 골라 보세요.
            </p>
          )}
        </div>
      </section>

      {openStory ? (
        <StorySheet
          story={openStory}
          position={openIndex + 1}
          total={flat.length}
          onPrev={() => moveStory(-1)}
          onNext={() => moveStory(1)}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </>
  );
}
