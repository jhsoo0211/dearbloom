'use client';

/**
 * 「읽을거리」의 움직이는 부분 — 칩 세 줄 · 만료 거르기 · 두 구획의 카드 목록.
 *
 * ═══ 만료 거르기가 왜 여기 있는가 (조사 문서 §7-2) ══════════════════════
 * 서버 렌더에서 거르면 **배포한 날의 "오늘" 이 HTML 에 굳는다.** 10월에 배포한 정적
 * 사이트가 12월에도 10월 기준으로 행사를 보여 준다는 뜻이다. 그래서 서버는 54건을
 * 통째로 내보내고, 지난 행사는 **보는 사람의 브라우저**가 자기 오늘로 숨긴다.
 *
 * ⚠ 첫 렌더는 서버 HTML 과 **글자 하나까지 같아야 한다.** 그래서 `today` 는 상태
 *   초기값이 아니라 이펙트에서 채운다(`useState(todayInKst(new Date()))` 로 쓰면 서버가
 *   그린 목록과 어긋나 하이드레이션이 깨진다). 값이 `null` 인 동안은 아무것도 거르지 않는다.
 * ⚠ 그 결과 **JS 가 꺼진 브라우저에서는 목록이 그대로 다 보인다.** 그것이 의도다 —
 *   거르기만 JS 의 몫이고, 읽을거리 자체는 JS 없이도 읽힌다. 대가는 첫 페인트에 지난
 *   행사가 한 번 스쳤다 사라지는 것인데, 반대로 마운트 전까지 목록을 감추면 JS 없는
 *   사람에게는 **빈 화면**이 남는다. 둘 중 무엇이 더 나쁜지는 명백하다.
 *
 * ═══ 칩 세 줄 ═════════════════════════════════════════════════════════
 * 결·계절·자리는 서로 다른 질문이라 **AND** 로 만난다(`tags.ts` 머리말). 한 축 안에서는
 * 하나만 고르고, 같은 칩을 다시 누르면 꺼진다 — `전체` 칸을 두지 않아 한 줄이 짧아진다.
 * 칩에 붙는 숫자는 **다른 축과 만료를 이미 반영한 수**다. 눌러도 0건이 되는 칩이 큰 숫자를
 * 달고 있으면 그건 거짓말이다(`/stories` 필터 바와 같은 규칙).
 *
 * 여기서 문장을 새로 지어내지 않는다 — 라벨은 전부 서버가 붙여 준 값이다.
 */

import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';

import styles from './reads.module.css';
import { hasEnded, readStatus, readStatusLabel, todayInKst } from './expiry';
import { READ_TAG_GROUPS, type ReadTagAxis } from './tags';
import type { ReadCard, ReadFilterChip } from './types';

/** 축마다 고른 칩 하나. `null` 이면 그 축은 거르지 않는다. */
type Selection = Record<ReadTagAxis, string | null>;

const NOTHING_SELECTED: Selection = { strand: null, season: null, place: null };

function ArrowGlyph() {
  return (
    <svg width="16" height="9" viewBox="0 0 18 10" fill="none" aria-hidden="true">
      <path d="M0 5h16M12 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * 브라우저의 오늘(KST). 서버·하이드레이션 첫 렌더에서는 `null` 이다.
 *
 * ⚠ `useState` + `useEffect` 로 쓰지 마라. 첫 렌더가 서버 HTML 과 어긋나거나(초기값으로
 *   시계를 읽는 경우), 이펙트 안에서 setState 를 부르게 된다(그 자체가 이 저장소의 lint
 *   금지 규칙이고, 캐스케이딩 렌더를 만든다). `useSyncExternalStore` 는 **서버 스냅숏과
 *   클라이언트 스냅숏을 따로 주는** 바로 그 자리라, 여기 쓰라고 있는 훅이다.
 *
 * 구독하지 않는 이유: 시계는 우리에게 아무것도 알려 주지 않는다. 자정을 넘겨도 다음 렌더에
 * 새 값이 잡히면 그만이고, 그 사이에 지난 행사 하나가 남는 것이 이 화면이 감수하기로 한
 * 위험의 크기다(`expiry.ts` 머리말의 「기기 시계를 믿는 셈」과 같은 판단).
 */
const NEVER_CHANGES = () => () => {};
const todaySnapshot = () => todayInKst(new Date());
const noTodayOnServer = () => null;

function useTodayKst(): string | null {
  return useSyncExternalStore(NEVER_CHANGES, todaySnapshot, noTodayOnServer);
}

/** 그 카드가 고른 칩들을 전부 통과하는가. 축을 하나 건너뛰려면 `skip` 에 그 축을 넘긴다. */
function passes(card: ReadCard, selection: Selection, skip?: ReadTagAxis): boolean {
  for (const group of READ_TAG_GROUPS) {
    if (group.axis === skip) continue;
    const picked = selection[group.axis];
    if (picked !== null && !card.tags.includes(picked)) return false;
  }
  return true;
}

export interface ReadsBoardProps {
  /**
   * 54건 전부. **서버가 거르지 않은 목록**이다 — 거르기는 아래 이펙트가 브라우저의
   * 오늘로 한다. 순서는 서버가 정한다(행사 먼저, 종료일이 가까운 순).
   */
  cards: ReadCard[];
}

export default function ReadsBoard({ cards }: ReadsBoardProps) {
  const [selection, setSelection] = useState<Selection>(NOTHING_SELECTED);
  /** 마운트 전에는 `null` — 서버 HTML 과 **글자 하나까지 같은** 목록을 그린다. */
  const today = useTodayKst();

  /** 만료만 거른 목록 — 칩의 숫자도, 화면의 개수도 전부 이 위에서 센다. */
  const live = useMemo(
    () => (today === null ? cards : cards.filter((card) => !hasEnded(card, today))),
    [cards, today],
  );

  const visible = useMemo(() => live.filter((card) => passes(card, selection)), [live, selection]);

  /**
   * 축별 칩 숫자 — **자기 축은 빼고** 나머지 축으로 거른 수다.
   * 자기 축까지 반영하면 고른 칩만 숫자가 남고 나머지가 전부 0이 되어, 축을 바꿔 고르는
   * 일이 불가능해 보인다.
   */
  const chips = useMemo(() => {
    const table = new Map<ReadTagAxis, ReadFilterChip[]>();
    for (const group of READ_TAG_GROUPS) {
      const pool = live.filter((card) => passes(card, selection, group.axis));
      table.set(
        group.axis,
        group.tags.map((tag) => ({
          tag,
          count: pool.filter((card) => card.tags.includes(tag)).length,
        })),
      );
    }
    return table;
  }, [live, selection]);

  const events = visible.filter((card) => card.kind === 'event');
  const readings = visible.filter((card) => card.kind !== 'event');
  const filterOn = READ_TAG_GROUPS.some((group) => selection[group.axis] !== null);

  function pick(axis: ReadTagAxis, tag: string) {
    setSelection((previous) => ({ ...previous, [axis]: previous[axis] === tag ? null : tag }));
  }

  return (
    <>
      <section className={styles.board} aria-labelledby="reads-board-h">
        <div className={styles.filters}>
          <div className={styles.wrap}>
            <h2 className={styles.srOnly} id="reads-board-h">
              읽을거리 골라 보기
            </h2>

            {READ_TAG_GROUPS.map((group) => (
              <div
                className={styles.filterRow}
                key={group.axis}
                role="group"
                aria-labelledby={`reads-${group.axis}-label`}
              >
                <span className={styles.filterLabel} id={`reads-${group.axis}-label`}>
                  {group.label}
                  <span className={styles.srOnly}> 골라 거르기</span>
                </span>
                <div className={`${styles.chips} ${styles.chipsScroll}`}>
                  {(chips.get(group.axis) ?? []).map((chip) => {
                    const on = selection[group.axis] === chip.tag;
                    // 0건이면 잠근다. 단 **고른 칩은 잠그지 않는다** — 잠기면 끌 수가 없다.
                    const locked = chip.count === 0 && !on;
                    return (
                      <button
                        key={chip.tag}
                        type="button"
                        className={on ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                        data-testid="reads-chip"
                        data-axis={group.axis}
                        data-tag={chip.tag}
                        aria-pressed={on}
                        aria-label={`${chip.tag} ${chip.count}건`}
                        disabled={locked}
                        onClick={() => pick(group.axis, chip.tag)}
                      >
                        {chip.tag}
                        <span className={styles.chipCount} aria-hidden="true">
                          {chip.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* 개수는 **거른 뒤의 수**다(§7-2 접근성 항). 만료로 사라진 항목은 세지 않는다. */}
            <p className={styles.count} aria-live="polite" data-testid="reads-count">
              <b>{visible.length}건</b>
              <span className={styles.countTail}>
                {filterOn ? `모아 둔 ${live.length}건 중에서 골랐어요` : '지금 볼 수 있는 것만 모았어요'}
              </span>
              {filterOn ? (
                <button
                  type="button"
                  className={styles.reset}
                  onClick={() => setSelection(NOTHING_SELECTED)}
                >
                  전부 다시 보기
                </button>
              ) : null}
            </p>
          </div>
        </div>

        <div className={styles.wrap}>
          {visible.length === 0 ? (
            <p className={styles.empty}>
              고르신 것과 맞는 읽을거리가 아직 없어요. 다른 결이나 계절, 다른 자리로 한 번 더 골라
              보시겠어요?
            </p>
          ) : null}

          {/*
            ── 구획 1. 지금 가 볼 곳 ─────────────────────────────────────
            끝난 행사는 **조용히** 빠진다(§6-3). 「종료된 행사입니다」 카드를 남기지 않는다 —
            지난 것을 보여 주려고 만든 구획이 아니다. 남은 행사가 하나도 없으면 구획째 사라지고,
            아래 읽을거리가 화면을 채운다(가을 축제가 다 끝나는 11월 말~1월이 그런 때다).
          */}
          {events.length > 0 ? (
            <section className={styles.group} aria-labelledby="reads-events-h">
              <div className={styles.groupHead}>
                <h2 className={styles.groupTitle} id="reads-events-h">
                  지금 가 볼 곳
                </h2>
                <p className={styles.groupSay}>
                  주최 측 공식 안내에서 날짜를 확인한 것만 실었어요. 끝난 행사는 저절로 빠져요.
                </p>
              </div>
              <ul className={styles.cards}>
                {events.map((card) => (
                  <ReadItem card={card} key={card.id} today={today} />
                ))}
              </ul>
            </section>
          ) : null}

          {readings.length > 0 ? (
            <section className={styles.group} aria-labelledby="reads-articles-h">
              <div className={styles.groupHead}>
                <h2 className={styles.groupTitle} id="reads-articles-h">
                  읽을거리
                </h2>
                <p className={styles.groupSay}>
                  저희가 직접 열어 보고 고른 글이에요. 제목을 누르면 원문으로 건너가요.
                </p>
              </div>
              <ul className={styles.cards}>
                {readings.map((card) => (
                  <ReadItem card={card} key={card.id} today={today} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </section>
    </>
  );
}

/**
 * 카드 한 장.
 *
 * 행사와 글은 **먼저 읽히는 줄이 다르다**(브리프의 「갈래가 시각적으로 드러나게」).
 *   행사 — 기간·지역이 제목 위로 온다. 갈지 말지를 가르는 것이 그 둘이기 때문이다.
 *   글   — 갈래와 매체·발행일이 온다. 무엇을 읽게 되는지가 그것으로 갈린다.
 *
 * 제목이 곧 외부 링크다. 카드 전체를 링크로 감싸지 않는 이유: 안쪽에 도감으로 가는 내부
 * 링크가 함께 서므로 링크가 중첩되고, 그 순간 낭독기가 하나의 목적지를 말할 수 없게 된다.
 *
 * ── `provider` 가 있는 카드 (API 축제) ──────────────────────────────
 * 사람이 열어 보고 고른 카드와 **기계가 모아 온 카드**는 화면에서 갈려야 한다. 가르는
 * 방법이 둘인데 둘 다 조용하다: 왼쪽 골드 선을 흐린 헤어라인으로 바꾸고(`.cardApi`),
 * 첫 줄 끝에 `한국관광공사 제공` 을 단다. 카드를 통째로 다른 모양으로 만들지 않는 이유는
 * 그것이 「덜 좋은 것」처럼 읽히기 때문이다 — 출처가 다를 뿐 같은 값의 정보다.
 * (그 라벨은 공공누리 제1유형의 출처표시 의무를 지는 자리이기도 하다.)
 */
function ReadItem({ card, today }: { card: ReadCard; today: string | null }) {
  const isEvent = card.kind === 'event';
  const status = today === null ? null : readStatus(card, today);
  const statusText = today === null ? undefined : readStatusLabel(card, today);

  const shell = [
    styles.card,
    isEvent ? styles.cardEvent : '',
    card.provider ? styles.cardApi : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={shell} data-testid="reads-card" data-provider={card.provider ?? ''}>
      <div className={styles.cardTop}>
        {isEvent ? (
          <>
            {card.periodLabel ? <span className={styles.when}>{card.periodLabel}</span> : null}
            {card.region ? <span className={styles.where}>{card.region}</span> : null}
          </>
        ) : (
          <>
            <span className={styles.kind}>{card.kindLabel}</span>
            {card.publishedLabel ? (
              <span className={styles.where}>{card.publishedLabel}</span>
            ) : null}
          </>
        )}
        {card.provider ? <span className={styles.provider}>{card.provider}</span> : null}
        {statusText ? (
          <span
            className={status === 'open' ? `${styles.status} ${styles.statusOpen}` : styles.status}
          >
            {statusText}
          </span>
        ) : null}
      </div>

      <h3 className={styles.cardTitle}>
        {/*
          새 탭으로 열리는 링크는 그 사실을 **미리** 알린다(접근성 리뷰 P1-6) — 파트너
          페이지·도감 출처 링크와 같은 패턴이다. `rel="noreferrer"` 는 새 창에서 이 페이지를
          되짚지 못하게 하는 것이라 지우지 마라.
        */}
        <a className={styles.cardLink} href={card.url} target="_blank" rel="noreferrer">
          {card.title}
          <span className={styles.srOnly}> (새 창)</span>
          <ArrowGlyph />
        </a>
      </h3>

      <p className={styles.cardSummary}>{card.summary}</p>

      <p className={styles.cardSource}>
        {card.sourceTitle}
        {card.author ? <span className={styles.cardAuthor}> · {card.author}</span> : null}
      </p>

      {/* 유료 장벽·가입 필요는 **누르기 전에** 말한다(§3-4). 막혔을 때의 실망이 더 크다. */}
      {card.accessNote ? <p className={styles.access}>{card.accessNote}</p> : null}

      {card.flowers.length > 0 ? (
        <p className={styles.bridge}>
          {card.flowers.map((flower) => (
            <Link
              className={styles.bridgeLink}
              href={`/flowers/${flower.id}`}
              key={flower.id}
              prefetch={false}
            >
              {flower.nameKo}
              <span className={styles.srOnly}> 도감으로 가기</span>
              <span aria-hidden="true"> →</span>
            </Link>
          ))}
        </p>
      ) : null}

      <ul className={styles.cardTags}>
        {card.tags.map((tag) => (
          <li className={styles.cardTag} key={tag}>
            {tag}
          </li>
        ))}
      </ul>
    </li>
  );
}
