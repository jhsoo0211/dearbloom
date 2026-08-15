'use client';

/**
 * 함께 보낼 꽃 고르기 — 카탈로그 전종을 실사 썸네일과 대표 꽃말로 세운다.
 *
 * ── 라디오로 만든 이유 ───────────────────────────────────────────────
 * 이 칸이 묻는 것은 "여럿 중 하나" 다. `<button aria-pressed>` 로도 그려지지만, 라디오는
 * 브라우저가 **화살표 이동·그룹 이름·선택 상태**를 공짜로 준다(32칸을 Tab 32번으로 지나지
 * 않아도 된다). 눈에 보이는 것은 카드고, 라디오는 `.srOnly` 로 카드 안에 숨어 있다 —
 * 그래서 포커스 링은 카드가 `:focus-within` 으로 받는다.
 *
 * 검색은 `/flowers`·`/stories` 와 **같은 색인·같은 정규화**를 쓴다(`normalizeQuery`).
 * 색인은 서버가 만들어 내려보낸다(영문명·학명이 화면에 없기 때문 — `types.ts` 참고).
 */

import { useId, useMemo, useState } from 'react';

import { normalizeQuery } from '@/components/flowers/category';
import styles from './letter.module.css';
import type { LetterFlowerOption } from './types';

export interface FlowerChoiceProps {
  flowers: readonly LetterFlowerOption[];
  /** 지금 고른 꽃 id. 빈 문자열이면 아직 고르지 않았다. */
  value: string;
  onChange: (flowerId: string) => void;
}

export default function FlowerChoice({ flowers, value, onChange }: FlowerChoiceProps) {
  const groupName = useId();
  const [query, setQuery] = useState('');

  const matched = useMemo(() => {
    const needle = normalizeQuery(query);
    if (needle === '') return flowers;
    return flowers.filter((flower) => flower.searchKey.includes(needle));
  }, [flowers, query]);

  return (
    <div>
      <div className={styles.pickerHead}>
        <div className={styles.search}>
          <label className={styles.srOnly} htmlFor={`${groupName}-q`}>
            꽃 이름으로 찾기
          </label>
          <input
            id={`${groupName}-q`}
            className={styles.searchInput}
            type="search"
            inputMode="search"
            autoComplete="off"
            placeholder="꽃 이름으로 찾아보세요"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <span className={styles.searchCount} aria-live="polite">
            {matched.length}종
          </span>
        </div>
      </div>

      {matched.length > 0 ? (
        <div className={styles.flowerGrid} role="group" aria-label="함께 보낼 꽃">
          {matched.map((flower) => {
            const selected = flower.flowerId === value;
            return (
              <label
                className={`${styles.flowerCard} ${selected ? styles.flowerCardOn : ''}`}
                key={flower.flowerId}
                data-flower={flower.flowerId}
              >
                <input
                  className={styles.srOnly}
                  type="radio"
                  name={groupName}
                  value={flower.flowerId}
                  checked={selected}
                  onChange={() => onChange(flower.flowerId)}
                />
                <span
                  className={`${styles.flowerThumbBox} ${
                    flower.bright ? styles.flowerThumbBright : ''
                  }`}
                >
                  {/* 실사가 없는 꽃은 폴백 면만 남긴다 — 빈 `src` 는 현재 주소를 다시 받아 온다. */}
                  {flower.thumbSrc !== '' ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Unsplash 원격 CDN. 승인 URL 을 그대로 쓴다(docs/image-assets.md — 핫링크가 권장 사용법).
                    <img
                      className={styles.flowerThumb}
                      src={flower.thumbSrc}
                      srcSet={flower.thumbSrcSet}
                      /* 카드는 최소 132px 그리드 칸이다 — 폰에서 44vw, 넓은 화면에서 160px 안쪽. */
                      sizes="(max-width: 640px) 44vw, 160px"
                      alt={flower.alt}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </span>
                <span className={styles.flowerName}>{flower.nameKo}</span>
                <span className={styles.flowerMeaning}>{flower.meaning}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <p className={styles.pickerEmpty}>
          그 이름의 꽃은 아직 없어요. 이름 일부만 적어도 찾아드려요.
        </p>
      )}
    </div>
  );
}
