'use client';

/**
 * 아카이브 검색 — 필터 바 맨 위의 입력 한 칸과 그 아래 드롭다운.
 *
 * ── 왜 필터가 아니라 "찾기" 인가 ────────────────────────────────────
 * 계열·꽃말·결 칩은 **거르기**(화면이 줄어든다)이고, 이 입력은 **찾기**(이미 아는 것으로
 * 곧장 간다)다. 그래서 결과를 레인 목록에 반영하지 않고 드롭다운으로만 띄운다 —
 * 꽃을 고르면 그 레인으로 건너뛰고, 이야기를 고르면 그 자리에서 시트가 열린다.
 * (검색이 레인을 거르면 "튤립" 을 찾은 순간 나머지 30줄이 사라져 아카이브가 아니게 된다.)
 *
 * ⚠ 검색은 **필터를 통과하지 않은 전량**을 훑는다. 지금 걸린 칩 때문에 안 보이는 이야기도
 *   이름만 알면 닿아야 하고, 고른 뒤에는 부모가 그 줄을 가리는 칩만 풀어 준다
 *   (`StoriesArchive.revealLane` — 정확한 지시가 거친 필터보다 우선한다).
 *
 * ⚠ 레인의 **지연 렌더와 무관**하다. 이야기 시트는 레인이 아니라 부모가 들고 있는 목록에서
 *   열리므로, 아직 카드가 서지 않은(화면 한참 아래의) 줄이라도 그대로 열린다.
 *
 * 접근성은 WAI-ARIA 콤보박스(listbox 팝업) 규격을 그대로 따른다 —
 * `role="combobox"` + `aria-expanded` + `aria-controls` + `aria-activedescendant`,
 * ↑↓ 이동 · Enter 선택 · Esc 닫기(닫혀 있으면 지우기). 포커스는 **입력에 머문다**
 * (활성 항목은 `aria-activedescendant` 로만 가리킨다 — DOM 포커스를 목록으로 옮기면
 * 화면 낭독기가 입력값을 잃는다).
 */

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { searchArchive, type SearchableFlower, type SearchableStory } from './search';
import styles from './stories.module.css';

/** 입력이 멈추길 기다리는 시간. 타이핑 중 매 글자마다 목록을 다시 세우지 않는다. */
const DEBOUNCE_MS = 150;

export interface ArchiveSearchProps {
  /** 레인이 서 있는 꽃 전량(필터 이전). */
  flowers: SearchableFlower[];
  /** 이야기 전량(필터 이전). */
  stories: SearchableStory[];
  /** 꽃 결과를 골랐다 — 그 레인으로 건너뛴다. */
  onPickFlower: (flowerId: string) => void;
  /** 이야기 결과를 골랐다 — 그 이야기의 시트를 연다. */
  onPickStory: (storyId: string) => void;
}

function IconSearch() {
  return (
    <svg
      className={styles.searchIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      /* §1.6b 아이콘 스트로크 1.6 — 레인 화살표·시트 닫기와 같은 굵기. */
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export default function ArchiveSearch({
  flowers,
  stories,
  onPickFlower,
  onPickStory,
}: ArchiveSearchProps) {
  /** 입력에 보이는 글자(즉시 갱신 — 타이핑이 끊겨 보이면 안 된다). */
  const [query, setQuery] = useState('');
  /** 실제로 훑는 글자(150ms 뒤에 따라온다). */
  const [typed, setTyped] = useState('');
  const [open, setOpen] = useState(false);
  /** 지금 가리키는 항목(합친 목록의 자리). -1 이면 아직 아무것도 안 가리킨다. */
  const [active, setActive] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputId = useId();
  const listId = `${inputId}-list`;

  // 화면을 떠날 때 아직 기다리는 타이머를 지운다(닫힌 컴포넌트에 setState 금지).
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const result = useMemo(() => searchArchive(typed, flowers, stories), [typed, flowers, stories]);

  /** 키보드가 도는 **한 줄짜리 목록** — 꽃 결과 뒤에 이야기 결과를 이어 붙인 순서다. */
  const options = useMemo(
    () => [
      ...result.flowers.map((flower) => ({ kind: 'flower' as const, id: flower.flowerId })),
      ...result.stories.map((story) => ({ kind: 'story' as const, id: story.storyId })),
    ],
    [result],
  );

  /**
   * 훑는 글자가 바뀌면 가리키던 자리는 무효다(그 자리에 다른 것이 들어와 있다).
   * effect 로 되돌리면 한 프레임 동안 옛 자리를 가리키므로 **렌더 중 파생 상태 보정**을
   * 쓴다 — `StoryLane` 이 필터 변경에 쓰는 것과 같은 패턴이다.
   */
  const [seenTyped, setSeenTyped] = useState(typed);
  if (seenTyped !== typed) {
    setSeenTyped(typed);
    setActive(-1);
  }

  function run(next: string, immediate = false) {
    setQuery(next);
    if (timer.current) clearTimeout(timer.current);
    if (immediate) {
      setTyped(next);
      return;
    }
    timer.current = setTimeout(() => setTyped(next), DEBOUNCE_MS);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    setOpen(false);
    if (option.kind === 'flower') onPickFlower(option.id);
    else onPickStory(option.id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      // 열려 있으면 목록만 닫고, 이미 닫혀 있으면 적은 글자를 지운다(두 번 눌러 처음으로).
      if (open) setOpen(false);
      else run('', true);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (options.length === 0) return;
      event.preventDefault();
      setOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((previous) => {
        const next = previous + step;
        // 끝에서 한 번 더 누르면 반대쪽으로 돈다 — 목록이 짧아 되돌아가는 편이 빠르다.
        if (next < 0) return options.length - 1;
        if (next >= options.length) return 0;
        return next;
      });
      return;
    }

    if (event.key === 'Enter') {
      if (!open || options.length === 0) return;
      event.preventDefault();
      // 아직 아무것도 가리키지 않았으면 맨 위를 고른다("튤립" 치고 곧바로 Enter).
      choose(active === -1 ? 0 : active);
    }
  }

  const showList = open && typed !== '';
  const activeId = active >= 0 && options[active] ? `${inputId}-opt-${active}` : undefined;
  /** 이야기 결과가 시작되는 자리 — 합친 목록에서 이야기의 번호를 셀 때 쓴다. */
  const storyOffset = result.flowers.length;

  return (
    <div
      className={styles.searchRow}
      ref={rootRef}
      data-testid="archive-search"
      onKeyDown={onKeyDown}
    >
      <div className={styles.searchBar}>
        <IconSearch />
        <label className={styles.srOnly} htmlFor={inputId}>
          꽃이나 이야기 제목으로 찾기
        </label>
        <input
          className={styles.searchInput}
          id={inputId}
          ref={inputRef}
          /* 콤보박스는 `type="text"` 위에 세운다(검색 인풋의 브라우저 기본 목록과 겹치지 않게). */
          type="text"
          inputMode="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          spellCheck={false}
          placeholder="꽃이나 이야기 제목으로 찾기"
          value={query}
          data-testid="archive-search-input"
          onChange={(event) => {
            run(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query !== '') setOpen(true);
          }}
          onBlur={(event) => {
            // 목록 안을 누른 것이면 닫지 않는다(항목은 포커스를 받지 않지만 지우기 버튼은 받는다).
            if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
          }}
        />
        {query !== '' ? (
          <button
            type="button"
            className={styles.searchClear}
            data-testid="search-clear"
            onClick={() => {
              run('', true);
              inputRef.current?.focus();
            }}
          >
            <span className={styles.srOnly}>검색어 지우기</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        ) : null}
      </div>

      {/*
        결과 수는 눈으로 보이지 않아도 들려야 한다 — 드롭다운은 시각 요소라
        화면 낭독기 사용자에게는 이 한 줄이 유일한 신호다.
      */}
      <p className={styles.srOnly} role="status">
        {showList
          ? `꽃 ${result.flowers.length}종 · 이야기 ${result.stories.length}편을 찾았어요`
          : ''}
      </p>

      {showList ? (
        <div
          className={styles.combo}
          id={listId}
          role="listbox"
          aria-label="검색 결과"
          data-testid="search-results"
          /* 항목을 눌러도 입력의 포커스를 뺏지 않는다 — 뺏기면 blur 로 목록이 먼저 닫힌다. */
          onMouseDown={(event) => event.preventDefault()}
        >
          {result.hasHit ? null : (
            <p className={styles.comboEmpty}>
              그 이름의 꽃이나 이야기는 아직 없어요. 이름 일부만 적어도 찾아드려요.
            </p>
          )}

          {result.flowers.length > 0 ? (
            <div className={styles.comboGroup} role="group" aria-label="꽃">
              <p className={styles.comboHead} aria-hidden="true">
                꽃
              </p>
              {result.flowers.map((flower, index) => (
                <div
                  key={flower.flowerId}
                  id={`${inputId}-opt-${index}`}
                  className={
                    active === index ? `${styles.comboOpt} ${styles.comboOptOn}` : styles.comboOpt
                  }
                  role="option"
                  aria-selected={active === index}
                  aria-label={`${flower.nameKo} 이야기 ${flower.count}편으로 건너뛰기`}
                  data-testid="search-option"
                  data-kind="flower"
                  data-flower={flower.flowerId}
                  onClick={() => choose(index)}
                  onMouseEnter={() => setActive(index)}
                >
                  <span className={styles.comboName}>{flower.nameKo}</span>
                  <span className={styles.comboTail} aria-hidden="true">
                    {flower.count}편
                  </span>
                </div>
              ))}
              {result.flowerMore > 0 ? (
                <p className={styles.comboMore}>
                  꽃 {result.flowerMore}종이 더 있어요 — 조금 더 적어 보세요
                </p>
              ) : null}
            </div>
          ) : null}

          {result.stories.length > 0 ? (
            <div className={styles.comboGroup} role="group" aria-label="이야기">
              <p className={styles.comboHead} aria-hidden="true">
                이야기
              </p>
              {result.stories.map((story, index) => {
                const at = storyOffset + index;
                return (
                  <div
                    key={story.storyId}
                    id={`${inputId}-opt-${at}`}
                    className={
                      active === at ? `${styles.comboOpt} ${styles.comboOptOn}` : styles.comboOpt
                    }
                    role="option"
                    aria-selected={active === at}
                    aria-label={`${story.title} — ${story.flowerNameKo} 이야기 펼치기`}
                    data-testid="search-option"
                    data-kind="story"
                    data-story={story.storyId}
                    onClick={() => choose(at)}
                    onMouseEnter={() => setActive(at)}
                  >
                    <span className={styles.comboName}>{story.title}</span>
                    <span className={styles.comboTail} aria-hidden="true">
                      {story.flowerNameKo}
                    </span>
                  </div>
                );
              })}
              {result.storyMore > 0 ? (
                <p className={styles.comboMore}>
                  이야기 {result.storyMore}편이 더 있어요 — 조금 더 적어 보세요
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
