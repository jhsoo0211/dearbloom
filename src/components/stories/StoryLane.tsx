'use client';

/**
 * 꽃 한 종의 가로 레인 — 헤더(카테고리 점 · 꽃 이름 · 편수 · 화살표) + scroll-snap 카드 스트립.
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
 * reduced-motion 이면 JS 스크롤도 즉시 이동한다(CSS 의 scroll-behavior 만으로는
 * `scrollTo({behavior:'smooth'})` 를 막지 못한다). 자동 넘김은 애초에 없다.
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

import styles from './stories.module.css';
import type { ArchiveLane, ArchiveStory } from './types';

function prefersReduce(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** 드래그로 판정하는 최소 이동량(px). 이보다 작으면 그냥 클릭이다. */
const DRAG_SLOP = 6;

export interface StoryLaneProps {
  lane: ArchiveLane;
  /** 지금 필터를 통과한 이 꽃의 이야기. 0편인 레인은 부모가 아예 세우지 않는다. */
  stories: ArchiveStory[];
  /** 꽃 칩으로 방금 건너온 레인인지. 헤더를 강조해 "여기예요" 를 남긴다. */
  jumped: boolean;
  onOpen: (storyId: string) => void;
  /** 부모(점프 담당)가 레인 노드를 들고 있게 한다. 언마운트 때 null 로 다시 부른다. */
  onMount: (flowerId: string, node: HTMLElement | null) => void;
}

export default function StoryLane({ lane, stories, jumped, onOpen, onMount }: StoryLaneProps) {
  const stripRef = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ atStart: true, atEnd: true });

  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: 0 });
  const ticking = useRef(false);

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
  }, [stories, sync]);

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
      ref={(node) => onMount(lane.flowerId, node)}
    >
      <header className={styles.laneHead}>
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
            disabled={edge.atStart}
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
            disabled={edge.atEnd}
            onClick={() => goTo(nearest() + 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </span>
      </header>

      <ul
        className={styles.strip}
        ref={stripRef}
        tabIndex={0}
        aria-label={`${lane.flowerNameKo} 이야기 카드 — 좌우 화살표 키로 넘겨보세요`}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
      >
        {stories.map((story) => {
          const place = [story.regionLabel, story.eraLabel]
            .filter((part) => Boolean(part))
            .join(' · ');
          return (
            <li className={styles.slide} key={story.id}>
              <button
                type="button"
                className={styles.card}
                data-testid="story-card"
                onClick={() => onOpen(story.id)}
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
    </section>
  );
}
