'use client';

/**
 * 생일 꽃 찾기 — `/flowers` 의 두 번째 문.
 *
 * 이름 검색(`FlowerSearch`)이 "아는 꽃"으로 들어가는 문이라면 여기는 **"내 날짜"로**
 * 들어가는 문이다. 월·일을 고르면 그 날의 탄생화를 한 장 보여 준다.
 *
 * ── 왜 네이티브 date 입력이 아닌가 (§1.6b) ─────────────────────────────
 * `<input type="date">` 는 **연도를 반드시 끼워 받는다.** 탄생화는 연도가 없는 값이라
 * (366일 달력) 사용자에게 뜻 없는 칸을 하나 더 채우게 만들고, 브라우저마다 위젯이 달라
 * 규격(h44·1px 보더)도 화면마다 흔들린다. 그래서 월·일 셀렉트 두 칸이다.
 *
 * ── 왜 서버 액션인가 ────────────────────────────────────────────────
 * 366행을 이 컴포넌트에 넘기면 첫 응답이 50~60KB 무거워지는데, 실제로 읽히는 것은
 * **하루치 한 장**이다(근거는 `app/flowers/actions.ts` 주석). 그래서 표는 서버에 두고
 * 고른 날짜만 물어본다. 미리 받는 것은 일 셀렉트가 필요로 하는 달력 12개 숫자뿐이다.
 *
 * ⚠ 워딩 대전제(`docs/birth-flowers-research.md` §2·§8): 이 표는 **전통적으로 정해진
 *   탄생화가 아니다.** 하루 한 종씩 꽃을 소개하던 페이지에서 퍼져 널리 통하게 된 목록이다.
 *   "전통"·"공식"·"예로부터 정해진" 류 단정을 이 화면에 쓰지 마라 — 계보 각주가 그 자리다.
 */

import Link from 'next/link';
import { useId, useRef, useState, useTransition } from 'react';

import { lookupBirthFlower } from '@/app/flowers/actions';
import { BIRTH_FINDER_MISS, BIRTH_SOURCE_NOTE } from './birth-copy';
import styles from './flowers.module.css';
import type { BirthFlowerView } from './types';

interface BirthdayFinderProps {
  /** `[0]` 이 1월. 값은 그 달의 마지막 날(2월은 29). 원본은 표 자체다(`birthCalendar`). */
  calendar: number[];
}

/** 셀렉트 옵션용 1..n. */
function range(n: number): number[] {
  return Array.from({ length: n }, (_, index) => index + 1);
}

export default function BirthdayFinder({ calendar }: BirthdayFinderProps) {
  const baseId = useId();
  const monthId = `${baseId}-month`;
  const dayId = `${baseId}-day`;

  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  /** `undefined` = 아직 안 물어봤다 / `null` = 물어봤는데 그런 날짜가 없다. */
  const [found, setFound] = useState<BirthFlowerView | null | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  /**
   * 늦게 도착한 응답을 버리는 표.
   *
   * 월·일을 빠르게 바꾸면 요청이 겹치고, 먼저 보낸 것이 나중에 도착할 수 있다.
   * 그러면 화면이 **고르지 않은 날짜의 꽃**을 보여 준다 — 서버 액션은 응답 순서를
   * 보장하지 않으므로 호출부가 막아야 한다.
   */
  const latest = useRef(0);

  function ask(nextMonth: string, nextDay: string) {
    if (nextMonth === '' || nextDay === '') {
      // 한 칸이라도 비면 직전 답을 지운다 — 지우지 않으면 다른 날짜의 카드가 남아 읽힌다.
      latest.current += 1;
      setFound(undefined);
      return;
    }

    const ticket = (latest.current += 1);
    startTransition(async () => {
      const view = await lookupBirthFlower(Number(nextMonth), Number(nextDay));
      if (latest.current !== ticket) return;
      setFound(view);
    });
  }

  function onMonthChange(value: string) {
    setMonth(value);
    // 3월 31일에서 2월로 옮기면 31일이 사라진다. 남겨 두면 셀렉트가 값 없는 상태로 보이므로
    // 그 달의 마지막 날로 당긴다(고른 날짜를 통째로 잃지 않게).
    const limit = value === '' ? 0 : (calendar[Number(value) - 1] ?? 0);
    const nextDay = day !== '' && limit > 0 && Number(day) > limit ? String(limit) : day;
    if (nextDay !== day) setDay(nextDay);
    ask(value, nextDay);
  }

  function onDayChange(value: string) {
    setDay(value);
    ask(month, value);
  }

  const dayLimit = month === '' ? 31 : (calendar[Number(month) - 1] ?? 31);

  return (
    <section className={styles.birth} aria-labelledby="birth-title">
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle} id="birth-title">
            생일 꽃 찾기
          </h2>
        </div>
        <p className={`${styles.lead} ${styles.birthLead}`}>
          날짜를 고르면 그날의 탄생화를 보여드려요. 선물할 사람의 생일도 좋고, 오늘 날짜도
          좋아요.
        </p>

        <div className={styles.birthForm}>
          <div className={styles.birthField}>
            <label className={styles.birthLabel} htmlFor={monthId}>
              월
            </label>
            <select
              className={styles.birthSelect}
              id={monthId}
              value={month}
              onChange={(event) => onMonthChange(event.target.value)}
            >
              <option value="">선택</option>
              {range(12).map((value) => (
                <option key={value} value={value}>
                  {value}월
                </option>
              ))}
            </select>
          </div>

          <div className={styles.birthField}>
            <label className={styles.birthLabel} htmlFor={dayId}>
              일
            </label>
            <select
              className={styles.birthSelect}
              id={dayId}
              value={day}
              onChange={(event) => onDayChange(event.target.value)}
            >
              <option value="">선택</option>
              {range(dayLimit).map((value) => (
                <option key={value} value={value}>
                  {value}일
                </option>
              ))}
            </select>
          </div>
        </div>

        {/*
          결과는 `role="status"` 다 — 눈으로 보이는 변화가 화면 낭독기에도 들려야 한다
          (검색 결과 수를 알리는 `.status` 와 같은 처리).
          `min-height` 는 CSS 가 잡는다: 찾는 중 → 카드로 바뀔 때 아래 CTA 가 밀리지 않게.
        */}
        <div className={styles.birthPanel} role="status">
          {pending && <p className={styles.birthPending}>그날의 꽃을 찾고 있어요…</p>}

          {/*
            아직 안 물어본 상태(§1.5d). 이 칸은 카드가 들어올 자리를 미리 비워 둔 172px
            인데, 비워만 두면 화면에 이유 없는 구멍이 하나 뚫린 것으로 읽힌다. 그래서
            **무엇을 기다리는 자리인지** 한 줄로 말해 둔다 — 채우기 위한 문장이 아니라
            빈칸의 뜻을 밝히는 문장이라, 카드가 들어오면 조용히 비켜난다.
          */}
          {/* 문구는 두 줄 위 리드("날짜를 고르면 …")와 겹치지 않게 빈칸 자체를 가리킨다(QA 지적). */}
          {!pending && found === undefined && (
            <p className={styles.birthHint}>고르신 날의 꽃이 여기 놓여요.</p>
          )}

          {!pending && found === null && (
            <p className={styles.birthPending}>그 날짜는 아직 표에 없어요. 다시 골라주세요.</p>
          )}

          {!pending && found && (
            <div className={styles.birthCard}>
              <p className={styles.birthDate}>{found.dateLabel}</p>
              <p className={styles.birthName}>{found.nameKo}</p>
              {(found.nameEn || found.scientificName) && (
                <p className={styles.birthLatin}>
                  {[found.nameEn, found.scientificName].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className={styles.birthMeaning}>
                꽃말은 ‘{found.meaning}’{found.meaningCopula}.
              </p>

              {found.link ? (
                <Link className={styles.birthLink} href={found.link.href}>
                  도감에서 {found.link.nameKo} 보기
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ) : (
                /* 309일은 도감에 없는 꽃이다. 빈손으로 돌려보내지 않고 있는 것만 정직하게 건넨다.
                   문구의 원본은 `birth-copy.ts` — 사전 시트가 쓰는 티어 고지와 같은 자리에 산다. */
                <p className={styles.birthMiss}>{BIRTH_FINDER_MISS}</p>
              )}

              {/*
                계보 각주 — 이 한 줄이 워딩 대전제를 지키는 자리다(조사 문서 §2·§8).
                지우거나 "전통적으로 정해진 탄생화" 로 바꾸지 마라.
              */}
              <p className={styles.birthNote}>{BIRTH_SOURCE_NOTE}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
