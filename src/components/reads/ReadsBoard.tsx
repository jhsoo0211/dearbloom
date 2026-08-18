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
import type { ReadKind } from '@/lib/data/types';

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
 * 갈래 표식 — **도감과 이어지지 않은 카드**의 액자에 들어가는 선화 넷.
 *
 * 남의 썸네일을 걸지 않기로 한 화면이라(§1.5q 「하지 않는다」 표) 여기서 쓸 수 있는 것은
 * 우리가 그리는 선 몇 개뿐이다. 사진 대신 세우는 것이므로 **네 갈래가 서로 갈리되 넷 다
 * 같은 손글씨**여야 한다 — 24×24 격자·스트로크 1.2·라운드 캡, 카드 제목 옆 화살표
 * (`ArrowGlyph`)와 같은 굵기다. 색·바탕은 CSS(`.mark`)가 한 곳에서 건다.
 *
 * ⚠ 도판 크롭을 미리 만들어 여기 걸지 마라. 그 순간 「이 글이 그 꽃 이야기다」라는 거짓말이
 *   된다(액자에 도판이 서는 카드는 실제로 그 꽃과 이어진 24건뿐이라는 것이 이 화면의 규칙이다).
 */
const KIND_GLYPHS: Record<ReadKind, string> = {
  /** 지금 가 볼 곳 — 지도 핀. 「어디로 간다」가 이 갈래를 가른다. */
  event: 'M12 21.2C12 21.2 19 15.4 19 10.4A7 7 0 0 0 5 10.4C5 15.4 12 21.2 12 21.2ZM12 13a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4Z',
  /** 읽을거리 — 펼친 책. */
  article: 'M12 7.6A3.6 3.6 0 0 0 8.4 4H3.2v12.2h5.2A3.6 3.6 0 0 1 12 19.8 3.6 3.6 0 0 1 15.6 16.2h5.2V4h-5.2A3.6 3.6 0 0 0 12 7.6ZM12 7.6v12.2',
  /** 알아두면 좋은 것 — 물방울. 절화를 오래 두는 법이 이 갈래의 절반이다. */
  guide: 'M12 3.2S17.4 9 17.4 12.9A5.4 5.4 0 0 1 6.6 12.9C6.6 9 12 3.2 12 3.2ZM9.7 13.4a2.4 2.4 0 0 0 2.4 2.4',
  /** 빛깔·트렌드 — 겹친 색 스와치 셋. */
  trend: 'M9.2 14.4a4.8 4.8 0 1 1 0-9.6 4.8 4.8 0 0 1 0 9.6ZM14.8 14.4a4.8 4.8 0 1 1 0-9.6 4.8 4.8 0 0 1 0 9.6ZM12 19.4a4.8 4.8 0 1 1 0-9.6 4.8 4.8 0 0 1 0 9.6Z',
};

/**
 * 카드 액자 한 칸 — **모든 카드에 정확히 하나**가 선다.
 *
 * 두 갈래(도판 · 갈래 표식)의 상자는 크기도 테두리도 같다. 다른 것은 안에 든 것뿐이라,
 * 54장을 훑을 때 눈이 같은 격자를 따라간다 — 카드마다 다른 문법이면 없느니만 못하다.
 *
 * **장식이다(`aria-hidden`).** 도판이 말하는 「그 꽃」은 카드 아래 다리 링크가 이미 이름으로
 * 말하고, 갈래는 첫 줄의 `.kind` 라벨이 말한다. 여기서 한 번 더 읽으면 54장에서 소음이 된다
 * (`/stories` 레인 헤더의 도판을 장식으로 둔 것과 같은 판단).
 */
/**
 * ── API 축제 사진이 이 액자에 합류하는 규칙 (2026-08-18) ────────────────
 * 우선순위는 **자체 호스팅 도판 → 한국관광공사 장소 사진 → 갈래 선화**다.
 * 도판이 먼저인 이유: 그것은 우리가 그려 우리 서버에 둔 그림이라 언제나 뜨고, 화면의
 * 손글씨와 같은 결이다. 사진은 남의 CDN 에 있어 우리가 수명을 보장할 수 없다.
 *
 * ═══ 사진 한 장이 규범의 좁은 예외인 이유 ═════════════════════════════
 * 이 섹션은 활자 카드이고 남의 썸네일을 걸지 않는 것이 §2 다. 원장 54건은 지금도 그렇다.
 * 다만 TourAPI 의 `firstimage2` 는 **표시를 목적으로 제공되는 공공 API 이미지**라 예외로
 * 두되, 조건 셋을 전부 지키는 한에서만이다.
 *   ① **변경하지 않는다.** 공공누리 제3유형이 금지하는 것이 변경이라 다운로드 후 리사이즈·
 *      크롭·필터가 곧 위반이다. 우리가 정하는 것은 **표시 크기뿐**이고 그 일은 CSS
 *      (`object-fit`)가 한다 — 파일은 그들 CDN 원본 그대로다.
 *   ② **받아 두지 않는다.** `public/` 에 복사하는 순간 그것이 사본이자 재배포다.
 *   ③ **출처를 적는다.** 첫 줄의 `한국관광공사 제공` 라벨과 푸터 각주가 그 일을 한다.
 * ⚠ 이 예외는 **TourAPI 이미지 한 곳에 한정**된다. 「핫링크 금지」의 철회가 아니다 —
 *   큐레이션 카드에 남의 사진을 붙이려거든 §2 부터 다시 읽어라.
 *
 * `alt=""` 인 이유: 우리가 **보지 않은 사진**이라 무엇이 찍혔는지 말할 수 없다. 지어낸
 * 설명을 붙이는 것보다 장식으로 두고 제목이 뜻을 지게 하는 쪽이 정직하다.
 * `loading="lazy"` + 액자의 고정된 자리가 CLS 를 0 으로 묶는다(사진이 늦게 와도 안 밀린다).
 */
function PreviewFrame({ card }: { card: ReadCard }) {
  if (card.preview) {
    return (
      <span className={styles.preview} data-plate={card.preview.flowerId} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- 자체 호스팅 도판 160px 썸네일(`public/plates/thumbs`). next/image 최적화는 도입하지 않았다(docs/illustration-assets.md). */}
        <img
          className={styles.previewImg}
          src={card.preview.src}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }

  if (card.imageUrl) {
    return (
      <span className={styles.preview} data-provider={card.provider ?? ''} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element -- 한국관광공사 CDN 원본을 **변경 없이** 그대로 건다(위 머리말 ①②). next/image 는 크기를 바꾸는 것이 본업이라 이 자리에서 쓸 수 없다. */}
        <img
          className={styles.previewImg}
          src={card.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }

  return (
    <span
      className={`${styles.preview} ${styles.mark}`}
      data-kind={card.kind}
      aria-hidden="true"
    >
      <svg className={styles.markGlyph} viewBox="0 0 24 24" aria-hidden="true">
        <path d={KIND_GLYPHS[card.kind]} />
      </svg>
    </span>
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
 * 왼쪽에는 **액자 한 칸**이 선다(`PreviewFrame`). 도감과 이어진 카드는 그 꽃의 세밀화,
 * 나머지는 같은 크기의 액자에 갈래 표식 — 둘 다 장식이라 낭독기는 지나친다.
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
      {/*
        액자는 **첫 줄·제목과 한 덩이**로 묶는다(카드 폭의 나머지는 요약문이 넓게 쓴다).
        액자를 카드 맨 위 띠로 깔지 않은 이유가 여기 있다 — 54장이 한 화면에 실리는 목록이라
        카드마다 100px 짜리 띠가 붙으면 스크롤이 그만큼 길어지고, 그림이 제목을 밀어낸다.
        자리는 CSS 가 `aspect-ratio` 로 미리 잡아 두므로 그림이 늦게 와도 줄이 밀리지 않는다(CLS 0).
      */}
      <div className={styles.cardHead}>
        <PreviewFrame card={card} />

        <div className={styles.cardHeadText}>
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
                className={
                  status === 'open' ? `${styles.status} ${styles.statusOpen}` : styles.status
                }
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
            {/*
              ⚠ **주소가 없으면 앵커를 만들지 않는다.** API 축제 중에는 주최 페이지가 없거나
                https 로 열리지 않는 것이 있는데(수집 스크립트가 실제로 열어 보고 판정한다),
                그때 `href` 없는 `<a>` 를 남기면 낭독기가 「링크」라고 읽고 목적지를 못 댄다.
                제목을 맨 글자로 두는 쪽이 정직하다 — 기간·지역·사진만으로도 카드는 값을 한다.
            */}
            {card.url ? (
              <a className={styles.cardLink} href={card.url} target="_blank" rel="noreferrer">
                {card.title}
                <span className={styles.srOnly}> (새 창)</span>
                <ArrowGlyph />
              </a>
            ) : (
              <span className={styles.cardPlain}>{card.title}</span>
            )}
          </h3>
        </div>
      </div>

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
