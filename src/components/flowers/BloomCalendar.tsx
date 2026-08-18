'use client';

/**
 * 계절 달력 — 「이번 달엔 어떤 꽃이 필까요」에 답하는 열두 칸.
 *
 * ── 왜 아코디언(`<details>`)인가 ─────────────────────────────────────
 * 열두 달을 전부 펼치면 칩이 350칸 남짓 서서 화면이 스크롤 벽이 된다. 그렇다고 달 칩
 * 열두 개 + 패널 한 칸(탄생화 사전이 쓰는 그 짜임)으로 가면 **JS 가 없을 때 화면이
 * 빈손**이 된다 — 사전은 서버 액션으로 값을 가져오는 구획이라 그래도 되지만, 달력은
 * 값이 이미 HTML 안에 다 들어 있다. 네이티브 `<details>` 는 그 값을 버리지 않는다:
 * JS 가 꺼져 있어도 열두 칸이 그대로 열리고 닫힌다.
 *
 * ── 「지금 달」은 브라우저가 정한다 (`bloom-calendar.ts` 머리말) ───────
 * 서버에서 정하면 배포한 날의 "이번 달" 이 정적 HTML 에 박힌다(「읽을거리」 만료 판정과
 * 같은 원리). 그래서 이 컴포넌트는 두 갈래로 시계를 쓴다:
 *   · `useSyncExternalStore` — 서버 스냅숏 `null` / 클라이언트 스냅숏 KST 이번 달.
 *     첫 렌더가 서버 HTML 과 **글자 하나까지 같아야** 하므로 `지금` 표는 그다음 렌더에 붙는다.
 *   · 이펙트 한 줄 — 그 달의 `<details>` 를 **DOM 으로** 연다.
 *
 * ⚠ `open` 을 React 가 들고 있게 만들지 마라. 사람이 요약줄을 눌러 연 것은 DOM 에만
 *   남는데, React 가 `open` 을 그리고 있으면 다음 렌더가 그것을 되돌린다(제어·비제어가
 *   섞인 자리다). 그래서 여기서는 **처음 한 번만** 열어 주고 그 뒤로는 브라우저에 맡긴다.
 * ⚠ 이펙트 안에서 setState 를 부르지 않는다(저장소 lint 금지 규칙). 여는 일은 DOM 속성
 *   하나를 세우는 것이 전부라 상태가 필요 없다.
 *
 * 여기서 문장을 새로 지어내지 않는다 — 이름·라벨·숫자는 전부 서버가 확정해 준 값이다.
 */

import Link from 'next/link';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

import { currentMonthInKst } from './bloom-calendar';
import styles from './flowers.module.css';
import type { BloomChip, BloomMonthGroup } from './types';

/**
 * 브라우저의 이번 달(KST). 서버·하이드레이션 첫 렌더에서는 `null` 이다.
 *
 * 구독하지 않는 이유는 「읽을거리」와 같다 — 시계는 우리에게 아무것도 알려 주지 않는다.
 * 달이 바뀌는 순간을 붙잡아 봐야 얻는 것은 열려 있던 칸이 저 혼자 닫히는 일뿐이다.
 */
const NEVER_CHANGES = () => () => {};
const monthSnapshot = () => currentMonthInKst(new Date());
const noMonthOnServer = () => null;

function useCurrentMonth(): number | null {
  return useSyncExternalStore(NEVER_CHANGES, monthSnapshot, noMonthOnServer);
}

function IconChevron() {
  return (
    <svg className={styles.calChev} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface BloomCalendarProps {
  /**
   * 달력에 서는 꽃 **한 벌**. 달 칸들은 이 목록을 슬러그로 가리킨다 —
   * 한 꽃이 평균 다섯 달에 서므로 칩을 달마다 되풀이하면 같은 값이 다섯 벌씩 실려 온다.
   */
  flowers: BloomChip[];
  /** 열두 달. 서버가 카탈로그 순서 그대로 확정해 넘긴다. */
  months: BloomMonthGroup[];
}

export default function BloomCalendar({ flowers, months }: BloomCalendarProps) {
  const current = useCurrentMonth();
  /** 달 → 그 칸의 `<details>`. 이펙트가 이번 달 하나를 열 때만 쓴다. */
  const panels = useRef(new Map<number, HTMLDetailsElement>());

  /** 슬러그 → 칩. 열두 칸이 같은 표를 본다(달마다 다시 세우지 않는다). */
  const byslug = useMemo(
    () => new Map(flowers.map((flower) => [flower.slug, flower])),
    [flowers],
  );

  useEffect(() => {
    if (current === null) return;
    const panel = panels.current.get(current);
    if (panel) panel.open = true;
  }, [current]);

  return (
    <ol className={styles.calList}>
      {months.map((group) => {
        const isNow = current === group.month;
        /* 슬러그가 표에 없으면 **줄을 세우지 않는다** — 이름 없는 칩이 서는 쪽이 더 나쁘다. */
        const chips = group.slugs
          .map((slug) => byslug.get(slug))
          .filter((chip): chip is BloomChip => chip !== undefined);

        return (
          <li key={group.month}>
            <details
              className={styles.calMonth}
              ref={(node) => {
                if (node) panels.current.set(group.month, node);
                else panels.current.delete(group.month);
              }}
            >
              <summary className={styles.calSum}>
                <span className={styles.calSumMonth}>{group.monthLabel}</span>

                {/*
                  「지금」 표 — 마운트 뒤에 붙는다(서버 HTML 에는 없다). 요약줄은 높이가
                  고정이라 이 글자가 늦게 와도 아래가 밀리지 않는다(CLS 0).
                  칩 모양(보더+필)을 쓰지 않는 이유는 §1.6b 그대로다 — 눌리지 않는 라벨이다.
                */}
                {isNow && <span className={styles.calNow}>지금</span>}

                <span className={styles.calSumCount}>
                  {chips.length > 0 ? `${chips.length}종` : '준비 중'}
                </span>
                <IconChevron />
              </summary>

              <div className={styles.calBody}>
                {chips.length > 0 ? (
                  <ul className={styles.calChips}>
                    {chips.map((flower) => (
                      <li key={flower.slug}>
                        <Link className={styles.calChip} href={`/flowers/${flower.slug}`}>
                          {flower.thumbSrc ? (
                            /* eslint-disable-next-line @next/next/no-img-element -- 원격 CDN(Unsplash·Pexels — 핫링크가 권장 사용법). `next/image` 최적화 엔드포인트는 정적 데모(output:'export')에서 서지 않는다. */
                            <img
                              className={styles.calChipImg}
                              src={flower.thumbSrc}
                              /* 이름이 바로 옆에 있다 — 사진이 이름을 한 번 더 읽으면 목록이 두 배로 길어진다. */
                              alt=""
                              width={36}
                              height={36}
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            /* 컷이 없는 꽃은 **빈 액자**다(사전 목록과 같은 규칙 — 지어내지 않는다). */
                            <span className={styles.calChipEmpty} aria-hidden="true" />
                          )}
                          <span className={styles.calChipName}>{flower.nameKo}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.calEmpty}>
                    이 달에 피는 꽃은 아직 도감에 들이지 못했어요.
                  </p>
                )}

                {/*
                  탄생화 사전으로 가는 **다리 한 줄.** 사전 366행은 이 화면에 싣지 않는다 —
                  여기 있는 것은 그달의 날 수 하나뿐이고, 표 자체는 `/flowers` 가 달 단위로 펼친다.
                  ⚠ 링크가 여는 것은 사전 **구획**이다. 그 달을 미리 골라 주지는 못한다
                    (사전은 달을 누른 사람에게만 그달을 가져온다 — `BirthDictionary` 머리말).
                */}
                <Link className={styles.calBridge} href="/flowers#birth-dict">
                  {group.monthLabel}의 탄생화 {group.birthDayCount}일 보기
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h13M12.5 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
