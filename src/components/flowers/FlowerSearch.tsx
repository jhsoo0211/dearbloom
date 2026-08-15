'use client';

/**
 * 꽃 검색 — `/flowers` 의 유일한 인터랙션.
 *
 * 두 가지 상태뿐이다.
 *   · 검색어가 없다  → **카테고리 5그룹으로 접은 전체 31종**(§1.4c v3.2). 한 판에 늘어놓지
 *                      않는 이유는 "무엇부터 볼지"가 사라지기 때문이다.
 *   · 검색어가 있다  → 부분 일치 결과 목록. 0건이면 안내 한 줄 + **전체 목록을 그대로 잇는다**
 *                      (빈손으로 돌려보내지 않는다).
 *
 * 매칭은 서버가 만들어 준 색인(`haystack`)에 `includes` 한 번이다 — 이름 세 가지
 * (한국어명·영문명·학명)를 정규화해 이어 붙인 문자열이라, 질의도 같은 `normalizeQuery` 를
 * 지나면 대소문자·공백·하이픈·`×` 차이가 저절로 사라진다.
 *   "튤" → 흰 튤립 / "rosa" → Rosa hybrida / "baby's breath" → Baby's Breath
 *
 * ⚠ 클라이언트가 갖는 것은 문자열뿐이다. 엔진·라벨 사전·카탈로그 로더는 들어오지 않는다
 *   (`types.ts`·`category.ts` 만 import — /stories 와 같은 경계).
 */

import Link from 'next/link';
import { useId, useMemo, useState, type CSSProperties } from 'react';

import { CATEGORY_TONE, normalizeQuery } from './category';
import styles from './flowers.module.css';
import type { FlowerGroup, FlowerSummary } from './types';

interface FlowerSearchProps {
  flowers: FlowerSummary[];
  groups: FlowerGroup[];
}

/** 카테고리 색면을 CSS 변수로 넘긴다(하드코딩 금지 — 값의 원본은 `category.ts`). */
function toneStyle(category: FlowerSummary['category']): CSSProperties {
  return { '--cat-tone': CATEGORY_TONE[category] } as CSSProperties;
}

/** 결과 카드 — 어디서 왔는지(카테고리)까지 보여 준다. */
function ResultCard({ flower }: { flower: FlowerSummary }) {
  return (
    <li>
      <Link className={styles.card} href={`/flowers/${flower.slug}`}>
        <span className={styles.cardTop}>
          <span className={styles.dot} style={toneStyle(flower.category)} aria-hidden="true" />
          <span className={styles.cardCat}>{flower.categoryLabel}</span>
        </span>
        <span className={styles.cardName}>{flower.nameKo}</span>
        <span className={styles.cardLatin}>
          {flower.nameEn ? `${flower.nameEn} · ` : ''}
          {flower.scientificName}
        </span>
        <span className={styles.cardMeaning}>{flower.meaning}</span>
        <span className={styles.cardCount}>이야기 {flower.storyCount}편</span>
      </Link>
    </li>
  );
}

/** 그룹 카드 — 카테고리는 줄 머리가 이미 말했으니 이름·꽃말·편수만(컴팩트). */
function GroupCard({ flower }: { flower: FlowerSummary }) {
  return (
    <li>
      <Link className={styles.card} href={`/flowers/${flower.slug}`}>
        <span className={styles.cardName}>{flower.nameKo}</span>
        <span className={styles.cardMeaning}>{flower.meaning}</span>
        <span className={styles.cardCount}>이야기 {flower.storyCount}편</span>
      </Link>
    </li>
  );
}

function GroupList({ groups }: { groups: FlowerGroup[] }) {
  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section key={group.category} aria-labelledby={`group-${group.category}`}>
          <h2 className={styles.groupHead} style={toneStyle(group.category)}>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.groupName} id={`group-${group.category}`}>
              {group.label}
            </span>
            <span className={styles.groupHint}>{group.hint}</span>
            <span className={styles.groupCount}>{group.flowers.length}종</span>
          </h2>
          <ul className={styles.grid}>
            {group.flowers.map((flower) => (
              <GroupCard key={flower.slug} flower={flower} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function FlowerSearch({ flowers, groups }: FlowerSearchProps) {
  const [query, setQuery] = useState('');
  const inputId = useId();
  const labelId = `${inputId}-label`;

  const key = normalizeQuery(query);
  const results = useMemo(
    () => (key === '' ? [] : flowers.filter((flower) => flower.haystack.includes(key))),
    [flowers, key],
  );

  const searching = key !== '';
  const empty = searching && results.length === 0;

  return (
    <section className={styles.board} aria-labelledby={labelId}>
      <div className={styles.wrap}>
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <label className={styles.srOnly} htmlFor={inputId} id={labelId}>
            꽃 이름으로 찾기
          </label>
          <input
            className={styles.searchInput}
            id={inputId}
            type="search"
            value={query}
            placeholder="꽃 이름으로 찾아보세요 — 튤립, Rosa …"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('');
            }}
          />
          {query !== '' && (
            <button className={styles.clear} type="button" onClick={() => setQuery('')}>
              <span className={styles.srOnly}>검색어 지우기</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6 18 18M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>

        {/* 결과 수는 눈으로도 보이고 스크린리더에도 들려야 한다(입력마다 조용히 갱신). */}
        <p className={styles.status} role="status">
          {searching ? (
            <>
              <b>{results.length}</b>
              <span>가지 꽃을 찾았어요</span>
            </>
          ) : (
            <>
              <b>{flowers.length}</b>
              {/* 묶음의 이름은 **꽃 계열**이다(용어 확정) — `갈래` 는 이 화면에서 이미
                  해석의 갈래·이야기의 출처로도 쓰여 무엇을 가리키는지 흐려진다. */}
              <span>가지 꽃을 꽃 계열로 묶어 두었어요</span>
            </>
          )}
        </p>

        {searching && results.length > 0 && (
          <ul className={styles.results}>
            {results.map((flower) => (
              <ResultCard key={flower.slug} flower={flower} />
            ))}
          </ul>
        )}

        {empty && (
          <div className={styles.empty}>
            {/* ⚠ "매주" 같은 **주기 약속**을 쓰지 마라 — 지킬 수 있는 말이 아니고,
                지키지 못하는 순간 도감 전체의 신뢰가 깎인다. */}
            <p className={styles.emptyTitle}>아직 없는 꽃이에요 — 새 꽃이 계속 들어오고 있어요</p>
            <p className={styles.emptyLead}>
              그동안 아래에서 다른 꽃을 둘러보시겠어요? 이름의 일부만 적어도 찾아드려요.
            </p>
          </div>
        )}

        {/* 검색 중이 아니거나 결과가 없을 때는 전체 목록이 그대로 이어진다. */}
        {(!searching || empty) && (
          <>
            {empty && <p className={styles.fallbackHead}>꽃 계열로 묶어 둔 꽃 전부</p>}
            <GroupList groups={groups} />
          </>
        )}
      </div>
    </section>
  );
}
