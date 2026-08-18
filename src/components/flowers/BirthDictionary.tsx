'use client';

/**
 * 탄생화 사전 — `/flowers` 의 세 번째 문(§1.5m ⑤).
 *
 * 이름 검색이 "아는 꽃"으로, 생일 꽃 찾기가 "내 날짜 하루"로 들어가는 문이라면
 * 여기는 **표 전체를 훑는** 문이다. 생일 찾기가 답하지 못하는 질문이 하나 있다 —
 * "탄생화가 366일이면 꽃도 그만큼 있어야 하는 것 아닌가?" 그 질문의 정직한 답이
 * **2단 티어**다: 정식 도감 32종(검증 완료) + 탄생화 사전 366일(이름·꽃말만).
 * 이 구획은 사전 쪽을 열람 가능하게 만들되, **두 티어를 눈으로 구별되게** 그린다.
 *
 * ── 상태는 셋뿐이다 ──────────────────────────────────────────────────
 *   · 달을 안 골랐다 → 자리 문구 한 줄(빈 화면 대신 무엇을 하면 되는지 말한다)
 *   · 고르는 중     → `그달의 꽃을 펼치는 중이에요…`
 *   · 골랐다        → 그달의 28~31줄 + (미매칭을 누르면) 사전 시트
 *
 * ── 왜 처음부터 이번 달을 펼쳐 두지 않나 ─────────────────────────────
 * 자동으로 한 달을 열면 `/flowers` 를 여는 **모든 사람**이 쓰지도 않을 9KB 남짓과 썸네일
 * 대여섯 장을 받는다. 이 구획은 도감의 곁문이고(검색·생일 찾기 아래에 선다), 표를 훑고
 * 싶은 사람만 달을 누른다 — 그 한 번의 클릭이 페이로드의 문지기다.
 * (`new Date()` 로 이번 달을 정하면 SSR·CSR 이 갈리는 문제도 함께 따라온다.)
 *
 * ⚠ 클라이언트가 갖는 것은 서버가 확정해 준 문자열과 `birth-copy.ts` 의 고정 문구뿐이다.
 *   `birth-dict.ts`(뷰모델 조립)를 여기서 import 하지 마라 — 엔진·라벨 사전이 딸려 온다.
 */

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';

import { listBirthMonth } from '@/app/flowers/actions';
import BirthDictSheet from './BirthDictSheet';
import {
  BIRTH_DICT_CATALOG_TITLE,
  BIRTH_DICT_EMPTY,
  BIRTH_DICT_FAILED,
  BIRTH_DICT_LEAD,
  BIRTH_DICT_MARK_CATALOG,
  BIRTH_DICT_MARK_DICT,
  BIRTH_DICT_PENDING,
  BIRTH_DICT_TITLE,
  BIRTH_SOURCE_NOTE,
} from './birth-copy';
import styles from './flowers.module.css';
import type { BirthDictEntry, BirthMonthView } from './types';

interface BirthDictionaryProps {
  /** 정식 도감에 실린 종의 수(32). 티어 각주가 두 숫자를 나란히 놓는다. */
  catalogCount: number;
  /** 표에 실린 날의 수(366). 서버가 표에서 세어 넘긴다. */
  dayCount: number;
  /** 표가 부르는 고유한 이름의 수(303). 366보다 적다 — 한 이름이 여러 날에 걸린다. */
  speciesCount: number;
}

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

/**
 * 목록 한 줄. 매칭·미매칭이 **다른 요소**로 갈린다.
 *
 * 매칭은 `<Link>`(도감 상세로 나간다), 미매칭은 `<button>`(사전 시트를 연다). 겉모습을
 * 같게 두고 클릭 동작만 바꾸면 스크린리더에서 둘이 구별되지 않는다 — 하나는 "링크",
 * 하나는 "버튼"으로 들려야 어디로 가는지 알 수 있다.
 */
function DictRow({ entry, onOpen }: { entry: BirthDictEntry; onOpen: (entry: BirthDictEntry) => void }) {
  /*
   * 썸네일은 **서버가 이미 골라 뒀다**(`entry.thumbSrc` 한 칸). 도감으로 이어지는 날은
   * 도감 대표컷, 나머지는 자체 호스팅 320px 사본이고, 둘 다 없는 92일은 값이 없다 —
   * 그때는 점선 빈 액자를 그대로 둔다. 화면이 두 표를 견주지 않는다.
   */
  const inner = (
    <>
      <span className={styles.dictDay}>{entry.day}</span>

      {entry.thumbSrc ? (
        /* eslint-disable-next-line @next/next/no-img-element -- 두 갈래가 섞인다: 원격 CDN(Unsplash·Pexels, 핫링크가 권장 사용법)과 자체 호스팅 정적 파일(`public/birth`). `next/image` 최적화 엔드포인트는 정적 데모(output:'export')에서 서지 않는다. */
        <img
          className={styles.dictThumb}
          src={entry.thumbSrc}
          /* 이름이 바로 옆에 있다 — 사진이 이름을 한 번 더 읽으면 목록이 두 배로 길어진다. */
          alt=""
          width={44}
          height={44}
          loading="lazy"
          decoding="async"
        />
      ) : (
        /* 사진이 없는 꽃은 **빈 액자**다. 다른 꽃 사진을 끌어다 쓰거나 아이콘을 지어내지 않는다. */
        <span className={styles.dictThumbEmpty} aria-hidden="true" />
      )}

      <span className={styles.dictText}>
        <span className={styles.dictName}>{entry.nameKo}</span>
        <span className={styles.dictMeaning}>{entry.meaning}</span>
      </span>

      {/* 티어 표시 — 눌리는 것이 아니므로 칩 모양(보더+필)을 쓰지 않는다(§1.6b). */}
      <span className={entry.link ? styles.dictMarkOn : styles.dictMark}>
        {entry.link ? BIRTH_DICT_MARK_CATALOG : BIRTH_DICT_MARK_DICT}
      </span>
    </>
  );

  return (
    <li>
      {entry.link ? (
        <Link className={styles.dictRow} href={entry.link.href}>
          {inner}
        </Link>
      ) : (
        <button type="button" className={styles.dictRow} onClick={() => onOpen(entry)}>
          {inner}
        </button>
      )}
    </li>
  );
}

export default function BirthDictionary({
  catalogCount,
  dayCount,
  speciesCount,
}: BirthDictionaryProps) {
  const [month, setMonth] = useState(0);
  /** `undefined` = 아직 안 물어봤다 / `null` = 물어봤는데 그런 달이 없다. */
  const [view, setView] = useState<BirthMonthView | null | undefined>(undefined);
  const [open, setOpen] = useState<BirthDictEntry | null>(null);
  const [pending, startTransition] = useTransition();

  /**
   * 늦게 도착한 응답을 버리는 표(생일 꽃 찾기와 같은 처리).
   * 달을 빠르게 넘기면 요청이 겹치고, 먼저 보낸 것이 나중에 도착할 수 있다 —
   * 그러면 화면이 **고르지 않은 달**을 보여 준다.
   */
  const latest = useRef(0);

  function pick(next: number) {
    setMonth(next);
    const ticket = (latest.current += 1);
    startTransition(async () => {
      const data = await listBirthMonth(next);
      if (latest.current !== ticket) return;
      setView(data);
    });
  }

  return (
    /*
       `id` 는 계절 달력(`/calendar`)의 다리 한 줄이 가리키는 자리다 — 달마다 그달의
       탄생화 날 수를 말하고 여기로 보낸다. ⚠ 그 링크는 **구획을 열 뿐 달을 골라 주지는
       않는다.** 자동으로 한 달을 펼치려면 마운트 시점에 서버 액션을 부르게 되는데,
       그것이 바로 위 머리말이 접어 둔 그 비용이다(그리고 이펙트 안 setState 가 된다).
    */
    <section className={styles.dict} id="birth-dict" aria-labelledby="dict-title">
      <div className={styles.wrap}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle} id="dict-title">
            {BIRTH_DICT_TITLE}
          </h2>
          <span className={styles.dictCount}>
            {dayCount}일 · {speciesCount}가지 이름
          </span>
        </div>
        <p className={`${styles.lead} ${styles.dictLead}`}>{BIRTH_DICT_LEAD}</p>

        {/*
          두 티어의 차이를 숫자와 함께 말해 두는 자리 — 인트로 통계(`32 종 · 정식 도감` /
          `366 일 · 탄생화 사전`)를 보고 "왜 다른 숫자인가" 를 묻는 사람이 닿는 곳이다.

          ⚠ 이 문단은 **인트로가 아니라 여기** 있어야 한다(CLS 0 규율, 2026-08-16 실측).
            인트로(= `<main>` 위)에 두면 웹폰트가 늦게 도착한 로드에서 줄 수가 바뀌며
            아래 화면 전체를 밀어 1280px CLS 가 0.005 → 0.17 로 뛴다. 여기서는 같은 재배치가
            첫 화면 밖에서 일어나 이동으로 세어지지 않는다.
          ⚠ 마지막 문장이 워딩 대전제다(§1.5m ①) — "전통"·"예로부터 정해진" 으로 바꾸지 마라.
        */}
        <p className={styles.dictTierNote}>
          {BIRTH_DICT_CATALOG_TITLE} {catalogCount}종은 색깔별 꽃말과 반려동물 안전성까지
          확인해 실은 꽃이에요. {BIRTH_DICT_TITLE} {dayCount}일은 날짜별 표에 실린{' '}
          {speciesCount}가지 이름을 꽃말과 함께 옮기고, 확인한 만큼 사진과 이야기를 붙여 둔
          것이고요.{' '}
          {/* 계보 각주는 **문장을 따로** 세운다 — 앞 문장 뒤에 대시로 이어 붙이면
              각주 안의 대시와 겹쳐 `것이고요 — 널리… — 예로부터…` 가 된다. */}
          {BIRTH_SOURCE_NOTE}
        </p>

        {/* §1.6b 칩 — pill h44 고정, 선택은 `--ctrl-on` 짝 채움 하나로만 말한다. */}
        <div className={styles.dictMonths} role="group" aria-label="달 고르기">
          {MONTHS.map((value) => (
            <button
              key={value}
              type="button"
              className={styles.dictMonth}
              aria-pressed={month === value}
              onClick={() => pick(value)}
            >
              {value}월
            </button>
          ))}
        </div>

        {/*
          결과 자리. 비어 있어도 높이를 갖는다 — 자리 문구 → "펼치는 중" → 목록으로 바뀔 때
          아래 CTA 가 밀리면 그것이 곧 레이아웃 이동이다(CLS 0 규율, 생일 찾기와 같은 처리).
        */}
        <div className={styles.dictPanel}>
          {/*
            ⚠ **live region 은 이 한 줄뿐이다.** 목록까지 감싸면 달을 고를 때마다 서른한 줄이
              통째로 낭독된다 — 눈으로는 한눈에 훑는 목록이 귀로는 1분짜리 낭독이 된다.
              그래서 바뀐 사실만 한 줄로 알리고(검색 결과 수를 알리는 `.status` 와 같은 처리),
              목록 자체는 사용자가 직접 훑게 둔다.
            상태 네 가지가 **한 자리**를 나눠 쓰는 것도 의도다 — 줄이 늘 하나라 자리 높이가
              흔들리지 않는다.
          */}
          <p className={styles.dictStatus} role="status">
            {pending
              ? BIRTH_DICT_PENDING
              : view === undefined
                ? BIRTH_DICT_EMPTY
                : view === null
                  ? BIRTH_DICT_FAILED
                  : `${view.monthLabel} — 탄생화 ${view.entries.length}일, 그중 도감에 있는 꽃 ${view.linkedCount}일`}
          </p>

          {!pending && view && (
            <ul className={styles.dictList}>
              {view.entries.map((entry) => (
                <DictRow key={entry.day} entry={entry} onOpen={setOpen} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/*
        시트는 **자기가 어느 달인지 모른다** — 목록 줄에는 일만 실려 있다(월은 구획 머리가
        이미 말했다). 사진 본판과 이야기를 다시 물으려면 달이 필요하므로 여기서 함께 넘긴다.
        `view.month` 를 쓰는 이유: `month` 상태는 누르는 즉시 바뀌지만 `view` 는 응답이
        도착해야 바뀐다 — 시트가 열려 있는 줄은 언제나 `view` 쪽 달의 것이다.
        `key` 로 날짜를 물려 다른 날을 열 때 상태(가져온 이야기)가 섞이지 않게 한다.
      */}
      {open && view && (
        <BirthDictSheet
          key={`${view.month}-${open.day}`}
          entry={open}
          month={view.month}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}
