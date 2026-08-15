'use client';

/**
 * 이야기 아카이브의 움직이는 부분 — 필터 바 · 꽃 고르기 시트 · 꽃별 가로 레인 · 상세 시트.
 *
 * 이야기는 전부(196편+) 서버가 한 번에 내려보낸다. 텍스트뿐이라 통째로 들고 있어도
 * 가벼워서, 필터를 누를 때마다 서버를 다시 다녀오지 않고 **클라이언트에서 거른다**
 * (아카이브의 값은 "이것저것 눌러 보는 재미" 라 반응이 즉각적이어야 한다).
 *
 * ── 필터 바 (2026-08-15 사용자 17차 — "선택지가 너무 많다") ──────────
 *   · 검색 = **찾기**. 거르지 않는다 — 이미 아는 꽃·이야기로 곧장 건너뛰는 지름길이다.
 *   · 꽃 계열 = 필터. 5칸(§1.4c 테마 카테고리)이 레인 **줄 자체**를 거른다.
 *   · 꽃말   = 필터. 꽃말 테마 8종(`themes.ts`)이 역시 레인 **줄 자체**를 거른다.
 *   · 결(mood) = 필터. 레인 **안의** 카드를 거르고, 0편이 된 레인은 통째로 감춘다.
 *   결과 결은 **AND** 로 만난다. 칩에 붙는 숫자도 서로를 반영한 수다 —
 *   눌러도 0편이 되는 칩이 큰 숫자를 달고 있으면 그건 거짓말이다.
 *
 * ⚠ 계열과 꽃말은 **배타**다(한쪽을 켜면 다른 쪽이 꺼진다). 둘 다 "꽃을 부분집합으로
 *   자르는" 같은 축의 필터라 겹치면 교집합이 순식간에 0이 된다 — 흰 꽃(숲빛) 중에
 *   "행운·축복" 꽃말을 가진 종은 한둘이거나 없다. AND 로 두면 사람이 두 칩을 눌렀을 뿐인데
 *   빈 화면을 만나는 일이 잦아, 필터가 아니라 함정이 된다. 결(mood)은 이야기를 자르는
 *   **다른 축**이라 그대로 AND 로 만난다.
 *
 * ⚠ 예전에 이 자리에 있던 **꽃 31칸(건너뛰기 칩)** 은 `꽃 고르기` 시트로 옮겼다.
 *   390px 에서 여섯 줄로 접혀 바가 화면의 65%를 먹었고, 무엇을 고르든 그 전에 31개를
 *   읽어야 했다. 되돌리지 마라 — 대신 시트가 계열 묶음 + 이름 검색으로 같은 일을 한다.
 *   시트에서 고른 꽃은 예전과 똑같이 **그 레인으로 건너뛰고 헤더를 강조**한다(필터 아님 —
 *   레인 뷰에서 꽃을 하나로 좁히면 가로줄 하나만 남은 빈 화면이 된다).
 *
 * 레인 안의 **순서**는 여기서 다시 짠다(`diversifyByMood`). 레인은 앞의 8장만 카드로
 * 세우기 때문에(StoryLane 의 상한), csv 순서 그대로 두면 같은 결이 몰린 꽃은 8장이
 * 전부 한 가지 결로 채워진다 — 아카이브의 값인 "결이 여러 가지구나" 가 안 보인다.
 *
 * ⚠ 상한은 **보이는 카드**에만 걸린다. 시트의 이전/다음이 도는 `flat` 은 접힌 이야기까지
 *   전부 들고 있다 — 카드로 안 보이는 이야기도 넘겨서 읽을 수 있어야 탐색이 된다.
 *
 * 여기서 문장을 새로 지어내지 않는다 — 라벨은 전부 서버가 붙여 준 값이다.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import ArchiveSearch from './ArchiveSearch';
import FlowerPicker, { type PickableFlower } from './FlowerPicker';
import StoryLane from './StoryLane';
import StorySheet from './StorySheet';
import { storySearchKey, type SearchableFlower, type SearchableStory } from './search';
import styles from './stories.module.css';
import type { ArchiveFilterChip, ArchiveLane, ArchiveStory } from './types';

/** 결 필터의 `전체` 칸. mood 어휘와 겹치지 않는 값이다. */
const ALL = 'all';

function prefersReduce(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * 같은 결이 연달아 나오지 않게 레인 안의 순서를 다시 짠다.
 *
 * 엔진의 `pickStories` 가 "다른 이야기도 보기" 를 고를 때 쓰는 그리디 1패스와 같은 규칙이다
 * (`src/lib/engine/stories.ts`의 `diversifyByMood`). 후보를 **버리지 않고** 자리만 미루므로
 * 편수는 그대로고, 결이 하나뿐인 꽃은 원래 순서를 유지한다.
 *
 * 무작위가 아니라 입력 순서만으로 정해지는 결정적 함수다 — 다시 찾아온 사람이 같은
 * 자리에서 같은 이야기를 만난다(서버가 csv 순서를 고정해 둔 이유와 같다).
 */
function diversifyByMood(stories: ArchiveStory[]): ArchiveStory[] {
  const rest = [...stories];
  const ordered: ArchiveStory[] = [];
  let lastMood: string | undefined;

  while (rest.length > 0) {
    let index = rest.findIndex((story) => story.moods[0] !== lastMood);
    if (index === -1) index = 0; // 남은 이야기가 전부 같은 결 — 원래 순서대로 채운다
    const [next] = rest.splice(index, 1);
    ordered.push(next);
    lastMood = next.moods[0];
  }

  return ordered;
}

export interface StoriesArchiveProps {
  /** 꽃별 레인. 순서는 서버가 정한다(카탈로그 순서). */
  lanes: ArchiveLane[];
  /** 전체 + 실제로 쓰인 결(엔진 STORY_MOODS 순서). */
  moodChips: ArchiveFilterChip[];
  /** 꽃 계열 5종(§1.4c 순서). 이야기가 없는 계열은 서버가 세우지 않는다. */
  categoryChips: ArchiveFilterChip[];
  /** 꽃말 테마(`themes.ts` 순서). 매칭된 꽃이 없는 테마는 서버가 세우지 않는다. */
  themeChips: ArchiveFilterChip[];
  /**
   * 꽃 id → 그 꽃이 가진 꽃말 테마.
   *
   * `meanings.csv` 를 훑는 일은 **서버가 한 번**만 한다(`themes.ts`). 화면은 그 결과를
   * 문자열로 비교만 한다 — 칩을 누를 때마다 브라우저에서 정규식을 돌리지 않는다.
   */
  flowerThemes: Record<string, string[]>;
}

export default function StoriesArchive({
  lanes,
  moodChips,
  categoryChips,
  themeChips,
  flowerThemes,
}: StoriesArchiveProps) {
  const [mood, setMood] = useState<string>(ALL);
  /** 고른 계열. null 이면 전 계열이다(`전체` 칩을 따로 두지 않고 다시 눌러 끈다). */
  const [category, setCategory] = useState<string | null>(null);
  /** 고른 꽃말 테마. 계열과 **동시에 켜지지 않는다**(위 주석의 배타 규칙). */
  const [theme, setTheme] = useState<string | null>(null);
  const [jumped, setJumped] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  /** 그 꽃이 이 테마를 갖는가. 없는 꽃은 빈 목록으로 본다(테마가 하나도 안 걸린 꽃). */
  const hasTheme = useCallback(
    (flowerId: string, key: string) => (flowerThemes[flowerId] ?? []).includes(key),
    [flowerThemes],
  );

  /** 지금 켜진 **꽃 축**(계열 또는 꽃말) 필터를 그 레인이 통과하는가. */
  const laneOnAxis = useCallback(
    (lane: ArchiveLane) =>
      (category === null || lane.category === category) &&
      (theme === null || hasTheme(lane.flowerId, theme)),
    [category, theme, hasTheme],
  );

  /** 넓은 화면에서 고정되는 필터 바. 건너뛸 때 이 높이만큼 더 내려가야 레인 헤더가 안 가린다. */
  const filtersRef = useRef<HTMLDivElement>(null);
  /** 건너뛰기 대상 — 레인이 스스로 등록한다(마운트 순서·필터와 무관하게 항상 최신). */
  const laneNodes = useRef(new Map<string, HTMLElement>());
  const registerLane = useCallback((flowerId: string, node: HTMLElement | null) => {
    if (node) laneNodes.current.set(flowerId, node);
    else laneNodes.current.delete(flowerId);
  }, []);

  /** 결로만 거른 레인 — 계열 칩의 숫자와 `꽃 고르기` 목록이 이 값을 본다. */
  const byMood = useMemo(
    () =>
      lanes.map((lane) => ({
        lane,
        stories:
          mood === ALL ? lane.stories : lane.stories.filter((story) => story.moods.includes(mood)),
      })),
    [lanes, mood],
  );

  /** 화면에 세우는 레인 = 결 AND (계열 또는 꽃말). 0편이 된 줄은 여기서 사라진다. */
  const visible = useMemo(
    () =>
      byMood
        .filter((row) => row.stories.length > 0)
        .filter((row) => laneOnAxis(row.lane))
        .map((row) => ({ lane: row.lane, stories: diversifyByMood(row.stories) })),
    [byMood, laneOnAxis],
  );

  /** 시트의 이전/다음이 도는 순서 = 화면에 보이는 순서(레인 순서대로 이어 붙인 것). */
  const flat: ArchiveStory[] = useMemo(() => visible.flatMap((row) => row.stories), [visible]);

  /** 필터 이전의 이야기 전량 — 검색이 훑는 자리다(지금 안 보이는 이야기도 찾아야 한다). */
  const everyStory: ArchiveStory[] = useMemo(() => lanes.flatMap((lane) => lane.stories), [lanes]);

  const total = everyStory.length;

  /** 계열 칩의 숫자 — **지금 결 필터 아래에서** 남는 편수. */
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of byMood) {
      counts.set(row.lane.category, (counts.get(row.lane.category) ?? 0) + row.stories.length);
    }
    return counts;
  }, [byMood]);

  /** 꽃말 칩의 숫자 — 계열 칩과 같은 기준(지금 결 필터 아래에서 남는 편수). */
  const themeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of byMood) {
      for (const key of flowerThemes[row.lane.flowerId] ?? []) {
        counts.set(key, (counts.get(key) ?? 0) + row.stories.length);
      }
    }
    return counts;
  }, [byMood, flowerThemes]);

  /** 결 칩의 숫자 — **지금 꽃 축 필터(계열·꽃말) 아래에서** 남는 편수. */
  const moodCounts = useMemo(() => {
    const pool = lanes.filter(laneOnAxis).flatMap((lane) => lane.stories);
    const counts = new Map<string, number>([[ALL, pool.length]]);
    for (const story of pool) {
      for (const key of story.moods) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [lanes, laneOnAxis]);

  /** `꽃 고르기` 시트에 세우는 목록 — 꽃 축 필터는 무시한다(시트는 그 필터를 건너뛰는 수단이다). */
  const pickable: PickableFlower[] = useMemo(
    () =>
      byMood
        .filter((row) => row.stories.length > 0)
        .map((row) => ({
          flowerId: row.lane.flowerId,
          nameKo: row.lane.flowerNameKo,
          category: row.lane.category,
          count: row.stories.length,
          searchKey: row.lane.searchKey,
        })),
    [byMood],
  );

  /** 검색이 훑는 꽃 — 필터 이전의 레인 전량. 색인은 서버가 만들어 준 것을 그대로 쓴다. */
  const searchFlowers: SearchableFlower[] = useMemo(
    () =>
      lanes.map((lane) => ({
        flowerId: lane.flowerId,
        nameKo: lane.flowerNameKo,
        searchKey: lane.searchKey,
        count: lane.stories.length,
      })),
    [lanes],
  );

  /**
   * 검색이 훑는 이야기 — 제목·hook 색인은 **여기서 한 번** 만든다.
   * 그 두 문장은 이미 화면에 있으므로 서버가 색인을 따로 실어 보낼 이유가 없다.
   */
  const searchStories: SearchableStory[] = useMemo(
    () =>
      everyStory.map((story) => ({
        storyId: story.id,
        title: story.title,
        flowerNameKo: story.flowerNameKo,
        searchKey: storySearchKey(story),
      })),
    [everyStory],
  );

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
   * **칩이 한 줄 더 접히는 순간 조용히 어긋난다** — 그래서 그때그때 잰다.
   * 좁은 화면에서는 바가 고정이 아니므로(position: static) 0 이 되어 그대로 맨 위에 붙는다.
   */
  const jumpTo = useCallback((flowerId: string) => {
    setJumped(flowerId);
    const node = laneNodes.current.get(flowerId);
    if (!node) return;

    const bar = filtersRef.current;
    const chrome =
      bar && getComputedStyle(bar).position === 'sticky' ? bar.getBoundingClientRect().height : 0;
    const top = node.getBoundingClientRect().top + window.scrollY - chrome - 18;
    window.scrollTo({ top: Math.max(0, top), behavior: prefersReduce() ? 'auto' : 'smooth' });
    node.focus({ preventScroll: true });
  }, []);

  function pickMood(key: string) {
    setMood(key);
    // 결이 바뀌면 레인 구성이 통째로 달라진다 — 아까 건너뛴 표시는 더 이상 맞지 않는다.
    setJumped(null);
  }

  /**
   * 같은 칩을 다시 누르면 꺼진다 — `전체` 칸을 따로 두지 않아 한 줄이 짧아진다.
   * 계열과 꽃말은 **배타**라 켜는 쪽이 반대쪽을 끈다(파일 머리 주석의 근거 참고).
   */
  function pickCategory(key: string) {
    setCategory((previous) => (previous === key ? null : key));
    setTheme(null);
    setJumped(null);
  }

  function pickTheme(key: string) {
    setTheme((previous) => (previous === key ? null : key));
    setCategory(null);
    setJumped(null);
  }

  /**
   * 그 꽃의 레인이 지금 화면에 서 있도록 **가로막는 필터만** 푼다.
   *
   * 시트에서 고르거나 검색에서 고르는 일은 "이것을 보러 가겠다" 는 정확한 지시라,
   * 거친 필터(계열·꽃말·결)보다 우선한다. 반대로 가로막지 않는 필터는 건드리지 않는다 —
   * 하나 골랐다고 화면 전체가 초기화되면 고르기 전의 맥락을 잃는다.
   *
   * @param story 이야기를 골라 온 경우 그 이야기. 결(mood) 판정을 편 단위로 한다.
   */
  function revealLane(flowerId: string, story?: ArchiveStory) {
    const lane = lanes.find((row) => row.flowerId === flowerId);
    if (!lane) return;
    if (category !== null && lane.category !== category) setCategory(null);
    if (theme !== null && !hasTheme(flowerId, theme)) setTheme(null);
    if (mood !== ALL) {
      const passes = story
        ? story.moods.includes(mood)
        : lane.stories.some((row) => row.moods.includes(mood));
      if (!passes) setMood(ALL);
    }
  }

  /**
   * 시트나 검색에서 꽃을 골랐다 — 그 레인으로 건너뛴다.
   *
   * ⚠ `flushSync` 를 쓰는 이유: 필터를 풀어야 그 레인이 DOM 에 서는데, 그 커밋을 기다리지
   *   않고 곧바로 스크롤하면 **아직 없는 노드**를 찾다가 조용히 아무 일도 안 일어난다.
   *   "상태를 화면에 반영한 뒤 자로 재서 스크롤한다" 는 flushSync 의 정석 용례다
   *   (effect 로 미루는 방법은 effect 안에서 setState 를 부르게 되어 금지 규칙에 걸린다).
   */
  function pickFlower(flowerId: string) {
    flushSync(() => {
      revealLane(flowerId);
      setPicking(false);
    });
    jumpTo(flowerId);
  }

  /**
   * 검색에서 이야기를 골랐다 — 그 자리에서 시트를 연다.
   *
   * 시트는 **레인이 카드를 세웠는지와 무관하다.** 여는 목록(`flat`)을 부모가 들고 있어서
   * 화면 한참 아래의(아직 지연 렌더 전인) 줄이라도 그대로 열린다. 다만 그 목록은 필터를
   * 통과한 것이라, 가리는 칩이 있으면 먼저 푼다 — 여기서는 재는 일이 없으므로 flushSync 가
   * 필요 없다(같은 이벤트의 setState 는 한 번에 묶여 한 렌더로 반영된다).
   */
  function pickStory(storyId: string) {
    const story = everyStory.find((row) => row.id === storyId);
    if (!story) return;
    revealLane(story.flowerId, story);
    setOpenId(storyId);
  }

  function resetAll() {
    setMood(ALL);
    setCategory(null);
    setTheme(null);
    setJumped(null);
  }

  const filterOn = mood !== ALL || category !== null || theme !== null;
  const moodLabel = moodChips.find((chip) => chip.key === mood)?.label;

  return (
    <>
      <section className={styles.board} aria-labelledby="archive-h">
        <div className={styles.filters} ref={filtersRef} data-testid="filters">
          <div className={styles.wrap}>
            <h2 className={styles.srOnly} id="archive-h">
              이야기 골라 보기
            </h2>

            {/*
              0줄 — 찾기. 거르기(칩)보다 위에 둔다. 이미 아는 것을 찾으러 온 사람에게는
              칩 열아홉 개를 지나 내려가는 길이 가장 먼 길이다.
            */}
            <ArchiveSearch
              flowers={searchFlowers}
              stories={searchStories}
              onPickFlower={pickFlower}
              onPickStory={pickStory}
            />

            {/*
              1줄 — 꽃 계열 5칸 + 꽃 한 종을 콕 집는 시트 손잡이.

              칩 다섯에 `꽃 고르기` 까지 여섯 칸이라 390px 에서는 두 줄로 접혔다(127px).
              꽃말 줄과 같은 **가로 스크롤 한 줄**(`.chipsScroll`)로 담아 79px 로 줄인다 —
              같은 축의 필터 두 줄이 같은 문법을 쓰게 되는 이득도 있다.
              `꽃 고르기` 는 스트립의 마지막 칸으로 함께 흐르되 §1.6b 규격(h44)은 그대로다.
            */}
            <div className={styles.filterRow} role="group" aria-labelledby="flower-cat-label">
              <span className={styles.filterLabel} id="flower-cat-label">
                꽃 계열<span className={styles.srOnly}> 골라 거르기</span>
              </span>
              <div className={`${styles.chips} ${styles.chipsScroll}`}>
                {categoryChips.map((chip) => {
                  const on = chip.key === category;
                  const count = categoryCounts.get(chip.key) ?? 0;
                  // 0편이면 잠근다. 단 **고른 칩은 잠그지 않는다** — 잠기면 끌 수가 없다.
                  const locked = count === 0 && !on;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      className={on ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                      data-testid="category-chip"
                      data-category={chip.key}
                      aria-pressed={on}
                      aria-label={`${chip.label} 계열 ${count}편`}
                      disabled={locked}
                      onClick={() => pickCategory(chip.key)}
                    >
                      {chip.label}
                      <span className={styles.chipCount} aria-hidden="true">
                        {count}
                      </span>
                    </button>
                  );
                })}

                {/* §1.6b 보조 버튼 — 필터가 아니라 "찾기" 손잡이라 채움이 아닌 고스트다. */}
                <button
                  type="button"
                  className={styles.pickBtn}
                  data-testid="flower-pick"
                  aria-haspopup="dialog"
                  aria-expanded={picking}
                  onClick={() => setPicking(true)}
                >
                  꽃 고르기
                  <span className={styles.pickNum} aria-hidden="true">
                    {pickable.length}
                  </span>
                  <span className={styles.srOnly}>
                    — 꽃 {pickable.length}종에서 이름으로 찾아 건너뛰기
                  </span>
                </button>
              </div>
            </div>

            {/*
              2줄 — 꽃말 테마.

              칩 여덟 칸이라 줄바꿈에 맡기면 390px 에서 두 줄(88px)이 된다. 필터 바는 이미
              두 줄짜리 칩 그룹을 둘 갖고 있어 그 높이를 감당할 여유가 없으므로,
              이 줄만 **가로 스크롤 한 줄**로 둔다(칩의 생김새는 §1.6b 그대로 — 담는 상자만
              다르다). 계열 5칸은 한 줄에 들어가므로 손대지 않는다.
            */}
            {themeChips.length > 0 ? (
              <div className={styles.filterRow} role="group" aria-labelledby="theme-filter-label">
                <span className={styles.filterLabel} id="theme-filter-label">
                  꽃말<span className={styles.srOnly}> 골라 거르기</span>
                </span>
                <div className={`${styles.chips} ${styles.chipsScroll}`}>
                  {themeChips.map((chip) => {
                    const on = chip.key === theme;
                    const count = themeCounts.get(chip.key) ?? 0;
                    // 0편이면 잠근다. 단 **고른 칩은 잠그지 않는다** — 잠기면 끌 수가 없다.
                    const locked = count === 0 && !on;
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        className={on ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                        data-testid="theme-chip"
                        data-theme={chip.key}
                        aria-pressed={on}
                        aria-label={`${chip.label} 꽃말 ${count}편`}
                        disabled={locked}
                        onClick={() => pickTheme(chip.key)}
                      >
                        {chip.label}
                        <span className={styles.chipCount} aria-hidden="true">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* 3줄 — 이야기의 결. */}
            <div className={styles.filterRow} role="group" aria-labelledby="mood-filter-label">
              <span className={styles.filterLabel} id="mood-filter-label">
                이야기의 결
              </span>
              <div className={styles.chips}>
                {moodChips.map((chip) => {
                  const on = chip.key === mood;
                  const count = moodCounts.get(chip.key) ?? 0;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      className={on ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                      data-testid="mood-chip"
                      aria-pressed={on}
                      aria-label={`${chip.label} ${count}편`}
                      disabled={count === 0 && !on}
                      onClick={() => pickMood(chip.key)}
                    >
                      {chip.label}
                      <span className={styles.chipCount} aria-hidden="true">
                        {count}
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
                <button type="button" className={styles.reset} onClick={resetAll}>
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
              고르신 조건에 맞는 이야기가 아직 없어요. 다른 계열·꽃말이나 결로 한 번 더 골라
              보세요.
            </p>
          )}
        </div>
      </section>

      {picking ? (
        <FlowerPicker
          flowers={pickable}
          moodLabel={mood === ALL ? undefined : moodLabel}
          onPick={pickFlower}
          onClose={() => setPicking(false)}
        />
      ) : null}

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
