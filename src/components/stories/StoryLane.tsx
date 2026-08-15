'use client';

/**
 * 꽃 한 종의 가로 레인 — 헤더(세밀화 액자 · 카테고리 점 · 꽃 이름 · 편수 · 화살표)
 * + scroll-snap 카드 스트립.
 *
 * 아카이브의 기본 뷰는 세로 그리드가 아니라 **꽃마다 한 줄**이다(넷플릭스식). 이야기가
 * 89편이라 한 판에 늘어놓으면 "꽃 17종이 있구나"가 안 보이고, 스크롤만 길어진다.
 * 레인으로 접으면 세로는 꽃 목록, 가로는 그 꽃의 이야기 — 두 축이 각각 제 일을 한다.
 *
 * 넘기는 수단은 네 가지를 모두 둔다(§1.6):
 *   · 터치 스와이프 — 네이티브 스크롤에 맡긴다(제스처 가로채기 금지).
 *   · 마우스 드래그 — 데스크톱엔 스와이프가 없고 스크롤바를 감췄으므로 필요하다.
 *   · 좌우 화살표 버튼 — 44×44 터치 타깃.
 *   · 키보드 ← → Home End — 스트립 자체가 tabIndex=0 이라 포커스를 받는다.
 *     카드에 포커스가 있을 때는 **다음 카드로 포커스도 함께 옮긴다** — 안 그러면
 *     화면 밖으로 밀려난 카드에 포커스가 남는다.
 *
 * 가로 스크롤은 이 스트립 안에서만 일어난다. 스트립은 좌우로 `--pad` 만큼 삐져나가
 * (모바일에서 카드가 화면 끝까지 흐르게) 있지만 border-box 폭은 `.wrap` + 2·pad ≤ 100% 라
 * 페이지가 가로로 밀리지 않는다.
 *
 * ── 많아진 이야기를 감당하는 두 장치 ────────────────────────────────
 * 이야기는 196편(31레인)이고 매주 늘어난다. 그대로 두면 첫 화면에서 카드 196장을
 * 전부 세우게 되는데, 그중 사람이 실제로 보는 것은 한두 줄뿐이다.
 *
 *   ① **지연 렌더** — 레인은 헤더와 빈 스트립(유령 카드)만 먼저 세우고, 뷰포트에
 *      가까워지면(IntersectionObserver, 위아래 360px 여유) 그때 카드를 마운트한다.
 *      스트립에는 `min-height: --lane-h` 가 걸려 있어 **마운트 전후 높이가 같다** —
 *      자리가 미리 잡혀 있으니 레이아웃이 밀리지 않는다(CLS 0).
 *      ⚠ 꽃 칩으로 건너뛴 레인(`jumped`)은 관측을 기다리지 않고 즉시 마운트한다.
 *      ⚠ 스트립 자체가 tabIndex=0 이라 **키보드 포커스로도 마운트된다** — 그러지 않으면
 *        아래쪽 레인에 Tab 으로 닿을 수 없다(포커스 가능한 요소가 하나도 없는 줄이 된다).
 *
 *   ② **카드 상한 8장 + "+N편 더 보기"** — 한 줄에서 실제로 밀어 보는 카드는 몇 장
 *      되지 않는다. 넘치는 만큼은 마지막 카드 뒤로 접고, 누르면 그 줄만 인라인으로
 *      펼친다(페이지 이동 없음).
 *      ⚠ 접힌 이야기도 **상세 시트의 이전/다음으로는 전부 넘겨볼 수 있다** — 순환 목록은
 *        부모가 전체로 들고 있다. 여기서 자르는 것은 "한눈에 보이는 카드" 뿐이다.
 *
 * ── 카드 한 장의 위계 (§1.5i 2026-08-15 사용자 16차) ──────────────────
 * 위에서 아래로 **꽃 이름·결 칩 → 제목 → hook → 각주 줄 → "이야기 펼쳐 보기"**.
 *
 * 예전에는 "케냐 · 현대" 같은 문화권·시대 꼬리표가 제목과 같은 무게의 칩으로 붙어 있었다.
 * 그러면 이야기를 읽으러 온 사람이 분류표부터 읽게 된다 — 아카이브의 값은 분류가 아니라
 * 이야기 자체다. 그래서 지역·시대·갈래·신뢰는 전부 **본문 아래 작은 한 줄**(`.cardNote`)로
 * 내려보내고, 상단에는 꽃 이름과 결 칩만 남겼다(그 둘은 "무엇을 고르는 중인가" 라
 * 위계상 이야기보다 앞이어도 된다 — 스펙이 상단에 허용한 것도 그 둘뿐이다).
 * ⚠ 카드 상단에 지역·시대 칩을 다시 세우지 마라.
 *
 * reduced-motion 이면 JS 스크롤도 즉시 이동한다(CSS 의 scroll-behavior 만으로는
 * `scrollTo({behavior:'smooth'})` 를 막지 못한다). 카드 등장 애니메이션은 CSS 라
 * globals.css 의 전역 규칙이 0 으로 만든다 — 지연 렌더 자체는 그대로 남는다.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';

import PlateFrame from './PlateFrame';
import { metaNotes } from './meta';
import { plateFor } from './plates';
import styles from './stories.module.css';
import type { ArchiveLane, ArchiveStory } from './types';

function prefersReduce(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** 드래그로 판정하는 최소 이동량(px). 이보다 작으면 그냥 클릭이다. */
const DRAG_SLOP = 6;

/** 한 레인이 처음에 세우는 카드 수. 넘치는 만큼은 "+N편 더 보기" 뒤로 접는다. */
export const LANE_CAP = 8;

/** 자리표시 칸을 채우는 유령 카드 수 — 가장 넓은 중단점(4.2장)에서 한 줄이 차는 만큼. */
const GHOST_CARDS = 4;

/** 뷰포트에 닿기 전에 미리 세워 두는 거리. 빠르게 내려도 빈 줄을 만나지 않는다. */
const NEAR = '360px 0px';

export interface StoryLaneProps {
  lane: ArchiveLane;
  /**
   * 지금 필터를 통과한 이 꽃의 이야기 **전량**(순서는 부모가 결 다양성으로 짠다).
   * 0편인 레인은 부모가 아예 세우지 않는다. 화면에 카드로 세우는 것은 앞의 8장뿐이고,
   * 나머지는 "+N편 더 보기" 뒤에 있다 — 잘라서 넘기지 마라(편수 표시가 어긋난다).
   */
  stories: ArchiveStory[];
  /** 꽃 칩으로 방금 건너온 레인인지. 헤더를 강조하고, 지연 렌더를 건너뛴다. */
  jumped: boolean;
  onOpen: (storyId: string) => void;
  /** 부모(점프 담당)가 레인 노드를 들고 있게 한다. 언마운트 때 null 로 다시 부른다. */
  onMount: (flowerId: string, node: HTMLElement | null) => void;
}

export default function StoryLane({ lane, stories, jumped, onOpen, onMount }: StoryLaneProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const stripRef = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ atStart: true, atEnd: true });

  /** 한 번 세운 레인은 다시 접지 않는다 — 스크롤을 되돌릴 때마다 카드가 깜빡이면 더 산만하다. */
  const [seen, setSeen] = useState(false);
  /** 이 레인의 카드를 전부 펼쳤는지(=상한 해제). 필터가 바뀌면 다시 접는다. */
  const [expanded, setExpanded] = useState(false);

  /**
   * 결 필터가 바뀌면(=`stories` 배열이 갈리면) 펼쳐 둔 상태는 무효다 — 그 구성에서만
   * 맞던 "+N편" 이기 때문이다. useEffect 로 되돌리면 한 프레임 동안 옛 상태로 그려지므로
   * React 가 권하는 **렌더 중 파생 상태 보정**을 쓴다(이 렌더는 커밋되지 않고 즉시 다시 돈다).
   */
  const [filtered, setFiltered] = useState(stories);
  if (filtered !== stories) {
    setFiltered(stories);
    setExpanded(false);
  }

  /**
   * 카드를 세울 때인가. 관측(`seen`)이 원칙이고, 꽃 칩으로 건너뛴 줄(`jumped`)은 예외로
   * 즉시 세운다 — 스크롤이 끝나기 전에 이미 카드가 서 있어야 "건너뛰었다" 가 된다.
   * 건너뛴 줄은 곧 화면에 들어와 관측도 걸리므로, 그때부터는 `seen` 이 이어받는다.
   */
  const live = seen || jumped;
  const shown = expanded ? stories : stories.slice(0, LANE_CAP);
  const hidden = stories.length - shown.length;
  /** 이 꽃의 세밀화. 아직 도판이 없는 꽃이면 헤더는 그대로 이름만 세운다. */
  const plate = plateFor(lane.flowerId);

  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: 0 });
  const ticking = useRef(false);
  /** "더 보기" 로 펼쳤는지(=포커스를 새 카드로 옮겨야 하는지). 필터로 접힌 것과 구분한다. */
  const revealing = useRef(false);

  /**
   * 스트립의 스크롤 좌표계에서 카드마다의 자리.
   *
   * `offsetLeft` 는 offsetParent 가 무엇이냐에 따라 padding 포함 여부가 흔들려서 쓰지 않는다.
   * 화면 좌표에서 스트립의 왼쪽 padding 을 빼면 `lefts[0] === 0` 이 되어
   * `scroll-padding-inline` 이 정한 스냅 위치와 정확히 맞는다.
   */
  const metrics = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return null;
    const pad = Number.parseFloat(getComputedStyle(strip).paddingLeft) || 0;
    const base = strip.getBoundingClientRect().left - strip.scrollLeft + pad;
    const lefts = Array.from(strip.children).map(
      (node) => (node as HTMLElement).getBoundingClientRect().left - base,
    );
    return { strip, lefts, max: Math.max(0, strip.scrollWidth - strip.clientWidth) };
  }, []);

  /** 지금 맨 앞에 걸린 카드. */
  const nearest = useCallback(() => {
    const m = metrics();
    if (!m) return 0;
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    m.lefts.forEach((left, i) => {
      const distance = Math.abs(left - m.strip.scrollLeft);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    return best;
  }, [metrics]);

  const goTo = useCallback(
    (target: number, smooth = true) => {
      const m = metrics();
      if (!m || m.lefts.length === 0) return;
      const index = Math.max(0, Math.min(m.lefts.length - 1, target));
      const left = Math.max(0, Math.min(m.max, m.lefts[index] ?? 0));
      m.strip.scrollTo({ left, behavior: smooth && !prefersReduce() ? 'smooth' : 'auto' });
    },
    [metrics],
  );

  /** 화살표 버튼의 비활성 여부. 스크롤할 것이 없으면 둘 다 잠근다. */
  const sync = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const max = strip.scrollWidth - strip.clientWidth;
    const atStart = strip.scrollLeft <= 1;
    const atEnd = max <= 1 || strip.scrollLeft >= max - 1;
    setEdge((previous) =>
      previous.atStart === atStart && previous.atEnd === atEnd ? previous : { atStart, atEnd },
    );
  }, []);

  const onScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      sync();
    });
  }, [sync]);

  /**
   * 필터로 카드 수가 바뀌면 스트립을 처음으로 되감고, 폭이 달라질 때마다 끝 판정을 다시 한다.
   *
   * ResizeObserver 를 쓰는 이유: 마운트 시점의 한 번 측정만으로는 부족하다. 폰트가 늦게
   * 붙거나 CSS 가 늦게 적용되면 그때는 `scrollWidth === clientWidth` 라 **화살표 두 개가
   * 모두 잠긴 채 굳는다.** 스트립(=보이는 폭)과 첫 카드(=카드 폭, 중단점 전환)를 함께
   * 지켜보면 창 리사이즈까지 이 하나로 덮인다.
   */
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollLeft = 0;
    const observer = new ResizeObserver(() => sync());
    observer.observe(strip);
    if (strip.firstElementChild) observer.observe(strip.firstElementChild);
    return () => observer.disconnect();
  }, [stories, sync, live]);

  /**
   * 지연 렌더 — 뷰포트에 가까워질 때 카드를 마운트한다.
   *
   * 관측 대상은 레인 전체(헤더 + 스트립)다. 자리표시 높이가 실제 높이와 같으므로
   * 마운트가 늦어도 그 아래 줄이 밀려 올라오지 않는다.
   * IntersectionObserver 가 없는 환경(구형 브라우저·JSDOM)에서는 그냥 전부 세운다 —
   * 최적화 때문에 이야기가 사라지는 쪽이 훨씬 나쁘다.
   */
  useEffect(() => {
    if (seen) return;
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setSeen(true);
      },
      { rootMargin: NEAR },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  /**
   * 펼친 직후 — 새로 드러난 첫 카드로 포커스와 스크롤을 옮긴다.
   *
   * "더 보기" 버튼은 눌리는 순간 DOM 에서 사라지므로, 포커스를 따로 옮기지 않으면
   * body 로 떨어져 키보드 사용자가 자리를 잃는다(그 자리에 정확히 새 카드가 들어선다).
   * 카드 수가 늘어 스크롤 끝 판정도 달라지므로 sync() 를 함께 부른다.
   */
  useEffect(() => {
    if (!expanded) return;
    sync();
    if (!revealing.current) return;
    revealing.current = false;
    const slide = stripRef.current?.children[LANE_CAP] as HTMLElement | undefined;
    goTo(LANE_CAP);
    slide?.querySelector('button')?.focus({ preventScroll: true });
  }, [expanded, sync, goTo]);

  /* ── 데스크톱 드래그 ────────────────────────────────────────────────
     터치는 네이티브 스크롤에 맡긴다(스와이프 제스처와 충돌 금지). */
  function onPointerDown(event: PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== 'mouse') return;
    const strip = stripRef.current;
    if (!strip) return;
    drag.current = { active: true, startX: event.clientX, startLeft: strip.scrollLeft, moved: 0 };
    strip.dataset.dragging = 'true';
  }

  function onPointerMove(event: PointerEvent<HTMLUListElement>) {
    const strip = stripRef.current;
    if (!strip || !drag.current.active) return;
    const dx = event.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    // 이미 시작된 텍스트 선택은 user-select 로 되돌릴 수 없다 — 드래그로 판정되는 순간 지운다.
    if (drag.current.moved > 4) window.getSelection()?.removeAllRanges();
    strip.scrollLeft = drag.current.startLeft - dx;
  }

  function endDrag() {
    const strip = stripRef.current;
    if (!strip || !drag.current.active) return;
    drag.current.active = false;
    delete strip.dataset.dragging;
    if (drag.current.moved > DRAG_SLOP) goTo(nearest());
  }

  /** 드래그로 끝난 포인터가 카드를 여는 것을 막는다. */
  function onClickCapture(event: MouseEvent<HTMLUListElement>) {
    if (drag.current.moved > DRAG_SLOP) {
      event.preventDefault();
      event.stopPropagation();
    }
    drag.current.moved = 0;
  }

  function reveal() {
    revealing.current = true;
    setExpanded(true);
  }

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const strip = stripRef.current;
    if (!strip) return;
    const { key } = event;
    if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') return;
    event.preventDefault();

    const slides = Array.from(strip.children) as HTMLElement[];
    if (slides.length === 0) return;

    // 카드에 포커스가 있으면 그 카드를 기준으로, 스트립 자체에 있으면 화면 기준으로 움직인다.
    const focused = slides.findIndex((slide) => slide.contains(document.activeElement));
    const from = focused === -1 ? nearest() : focused;
    const to =
      key === 'ArrowRight'
        ? from + 1
        : key === 'ArrowLeft'
          ? from - 1
          : key === 'Home'
            ? 0
            : slides.length - 1;
    const target = Math.max(0, Math.min(slides.length - 1, to));

    goTo(target);
    if (focused !== -1) slides[target]?.querySelector('button')?.focus({ preventScroll: true });
  }

  return (
    <section
      className={styles.lane}
      role="region"
      tabIndex={-1}
      aria-label={`${lane.flowerNameKo} 이야기 ${stories.length}편`}
      data-jumped={jumped ? 'true' : undefined}
      data-flower-lane={lane.flowerId}
      ref={(node) => {
        rootRef.current = node;
        onMount(lane.flowerId, node);
      }}
    >
      <header className={styles.laneHead}>
        {/*
          꽃 세밀화 소형 액자(§1.4b · docs/illustration-assets.md).
          꽃 이름이 바로 옆에 있으므로 **장식**으로 둔다 — 스크린리더가 줄마다 도판 설명을
          두 번 읽으면 31줄에서 소음이 된다. 도판이 없거나 못 받으면 아무것도 그리지 않는다.
        */}
        {plate ? <PlateFrame plate={plate} variant="thumb" decorative /> : null}
        <span
          className={styles.laneDot}
          style={{ background: lane.dotColor }}
          aria-hidden="true"
        />
        <h3 className={styles.laneName}>{lane.flowerNameKo}</h3>
        <span className={styles.laneCount}>
          {stories.length}편
          <span className={styles.srOnly}> · {lane.dotLabel} 계열</span>
        </span>

        <span className={styles.laneArrows}>
          <button
            type="button"
            className={styles.laneArrow}
            aria-label={`${lane.flowerNameKo} 이야기 이전으로`}
            disabled={!live || edge.atStart}
            onClick={() => goTo(nearest() - 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.laneArrow}
            aria-label={`${lane.flowerNameKo} 이야기 다음으로`}
            disabled={!live || edge.atEnd}
            onClick={() => goTo(nearest() + 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </span>
      </header>

      {/*
        스트립은 카드가 아직 없어도 **항상** 세운다. 같은 요소가 자리표시를 겸해야
        마운트 전후의 상자가 정확히 같고(`min-height: --lane-h`), tabIndex 도 그대로라
        키보드로 아래쪽 레인에 닿을 수 있다 — 포커스가 닿으면 그 자리에서 카드를 세운다.
      */}
      <ul
        className={styles.strip}
        ref={stripRef}
        tabIndex={0}
        data-live={live ? 'true' : undefined}
        aria-busy={live ? undefined : true}
        aria-label={`${lane.flowerNameKo} 이야기 카드 — 좌우 화살표 키로 넘겨보세요`}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        onFocus={live ? undefined : () => setSeen(true)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
      >
        {!live
          ? Array.from({ length: Math.min(stories.length, GHOST_CARDS) }, (_, index) => (
              <li className={styles.slide} key={`ghost-${index}`} aria-hidden="true">
                <span className={styles.ghost} />
              </li>
            ))
          : null}

        {live
          ? shown.map((story) => {
              const notes = metaNotes(story);
              return (
                <li className={styles.slide} key={story.id}>
                  <button
                    type="button"
                    className={styles.card}
                    data-testid="story-card"
                    onClick={() => onOpen(story.id)}
                  >
                    {/* 상단은 꽃 이름 + 결 칩까지만 — 지역·시대 칩 금지(§1.5i 16차). */}
                    <span className={styles.cardTop}>
                      <span className={styles.cardFlower}>{story.flowerNameKo}</span>
                      {story.moodLabels.map((label) => (
                        <span className={`${styles.tag} ${styles.tagMood}`} key={label}>
                          {label}
                        </span>
                      ))}
                    </span>

                    {/* 카드의 주인공 — 제목과 hook 이 시각적 중심이다. */}
                    <span className={styles.cardTitle}>{story.title}</span>
                    {story.hook ? <span className={styles.cardHook}>{story.hook}</span> : null}

                    {/* 각주 줄 — 문화권 · 시대 · 갈래 · 신뢰. 이야기 아래에만 온다. */}
                    <span className={styles.cardNote} data-testid="story-card-note">
                      {notes.map((note, index) => (
                        <span key={note.key}>
                          {index > 0 ? <span aria-hidden="true"> · </span> : null}
                          <span className={note.accent ? styles.noteOn : undefined}>
                            {note.text}
                          </span>
                        </span>
                      ))}
                    </span>

                    <span className={styles.cardMore} aria-hidden="true">
                      이야기 펼쳐 보기
                    </span>
                  </button>
                </li>
              );
            })
          : null}

        {/*
          접어 둔 나머지. 카드 자리를 그대로 쓰기 때문에 "옆으로 더 있다" 는 감각을 깨지 않고,
          누르면 이 줄만 그 자리에서 펼쳐진다(페이지 이동·재요청 없음).
        */}
        {live && hidden > 0 ? (
          <li className={styles.slide} key="more">
            <button
              type="button"
              className={styles.moreCard}
              data-testid="lane-more"
              aria-label={`${lane.flowerNameKo} 숨은 ${hidden}편 펼치기`}
              onClick={reveal}
            >
              <span className={styles.moreNum} aria-hidden="true">
                +{hidden}
              </span>
              <span className={styles.moreLabel} aria-hidden="true">
                편 더 보기
              </span>
              <span className={styles.moreHint} aria-hidden="true">
                {lane.flowerNameKo} 이야기를 이 줄에서 전부 펼쳐요
              </span>
            </button>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
