'use client';

/**
 * 도감 상세의 「사러 가기」 시트.
 *
 * ── 왜 결과 화면의 시트를 가져다 쓰지 않나 ───────────────────────────
 * **목적지는 같고 코드 소유는 다르다.** 목적지·검색어 규칙·실측 근거의 단일 원본은
 * `components/flow/buy-links.ts`(순수 데이터 모듈)이고 여기서 그대로 import 한다 —
 * 그래야 두 화면이 같은 곳으로 보낸다. 반면 시트 **UI** 는 결과 화면 것을 고치지 않고
 * 도감 쪽에 얇게 다시 세웠다(조판 결은 눈으로 맞췄다). 결과 화면의 시트에는 도감이
 * 갖지 않는 것이 붙어 있다 — 11번가 실상품 목록과 그 정렬(`searchBuyProducts` 서버 액션).
 * 도감 상세는 **순수 링크 조립**만 한다:
 *   · 정적 데모(서버 없음)에서도 그대로 선다 — 부를 서버가 없어도 목록이 성립한다.
 *   · 상세는 SSG 32종이라 화면마다 바깥 API 를 부를 이유가 없다.
 *
 * ⚠ **목적지를 여기 적지 마라.** URL 한 줄이라도 이 파일에 베끼는 순간 두 화면이 갈린다
 *   (`tests/components/flowers-buy.test.ts` 가 소스에서 잡는다). 늘리거나 고칠 곳은
 *   `flow/buy-links.ts` 하나다.
 * ⚠ 정직 고지 두 줄을 지우지 마라 — 지우면 이 목록이 재고와 제휴를 약속하는 말이 된다
 *   (결과 화면·파트너 페이지가 **글자 그대로 같은 문장**을 들고 있다).
 *
 * 대화상자 규격(포커스 트랩·ESC·배경 탭·스크롤 잠금·닫을 때 연 버튼으로 포커스 복귀)은
 * 같은 폴더의 `BirthDictSheet` 와 같은 문법이다. 등장 모션은 CSS 애니메이션이라
 * `prefers-reduced-motion` 전역 규칙(globals.css)이 알아서 0 으로 만든다.
 */

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { buildBuyLinks, type BuyLinkKind } from '@/components/flow/buy-links';
import styles from './flowers.module.css';

/** 필터 칸 — 결과 화면과 **같은 어휘**다(`바깥 장` 은 어색하다는 사용자 확정 워딩). */
const BUY_FILTERS: readonly { key: 'all' | BuyLinkKind; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'partner', label: '확인한 곳' },
  { key: 'market', label: '쇼핑몰' },
];

interface BuySheetProps {
  /** 검색어로 쓸 대표 이름 — `buySearchName()` 을 거친 값이다. */
  flowerName: string;
  onClose: () => void;
}

export default function BuySheet({ flowerName, onClose }: BuySheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [filter, setFilter] = useState<'all' | BuyLinkKind>('all');

  const links = useMemo(() => buildBuyLinks(flowerName), [flowerName]);
  const shown = filter === 'all' ? links : links.filter((link) => link.kind === filter);

  // 열려 있는 동안 뒤 화면이 따라 스크롤되지 않게 잠그고, 닫으면 부르던 자리로 포커스를 돌린다.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = sheetRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={styles.dictSheetRoot}>
      {/* 배경 탭으로도 닫힌다 — 같은 동작을 하는 닫기 버튼이 시트 안에 있어 여기는 장식이다. */}
      <div className={styles.dictScrim} onClick={onClose} aria-hidden="true" />

      <div
        className={styles.dictSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-sheet-title"
        ref={sheetRef}
        onKeyDown={onKeyDown}
      >
        <span className={styles.dictGrip} aria-hidden="true" />

        <div className={styles.dictSheetHead}>
          <p className={styles.dictSheetDate}>사러 가기</p>
          <button
            type="button"
            className={styles.dictClose}
            onClick={onClose}
            aria-label="사러 가기 닫기"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.dictSheetBody}>
          <h3 className={styles.dictSheetName} id="buy-sheet-title" tabIndex={-1} ref={titleRef}>
            ‘{flowerName}’ 살 수 있는 곳
          </h3>

          {/* §1.6b 칩 — pill h44 고정, 선택은 짝 채움 하나로만 말한다(밑줄·점 금지). */}
          <div className={styles.buyFilter} role="group" aria-label="구매처 갈래 고르기">
            {BUY_FILTERS.map((item) => {
              const on = item.key === filter;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={styles.dictMonth}
                  aria-pressed={on}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className={styles.buyList}>
            {shown.map((link) => (
              <a
                key={link.key}
                className={styles.buyRow}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.buyBody}>
                  <span className={styles.buyName}>
                    {link.name}
                    {/* 눌리지 않는 라벨이라 칩 모양을 쓰되 크기·색으로만 갈린다(§1.6b 캡션 하한 12px). */}
                    <span
                      className={
                        link.kind === 'partner'
                          ? `${styles.buyBadge} ${styles.buyBadgePartner}`
                          : styles.buyBadge
                      }
                    >
                      {link.kind === 'partner' ? '확인한 곳' : '쇼핑몰'}
                    </span>
                  </span>
                  {link.query ? (
                    <span className={styles.buyQuery}>‘{link.query}’ 검색 결과로 열려요</span>
                  ) : null}
                  <span className={styles.buyDesc}>{link.desc}</span>
                  {/* 새 창으로 열리는 링크는 **그 사실을 미리 알린다**(P1-6). */}
                  <span className={styles.srOnly}> (새 창)</span>
                </span>
                <span className={styles.buyAr} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M7 17 17 7M8.6 7H17v8.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </a>
            ))}
          </div>

          {/* 이 두 줄은 목록과 한 몸이다 — 지우면 목록이 재고와 제휴를 약속하는 말이 된다. */}
          <p className={styles.buyDisc}>
            값과 재고는 저마다 그때그때 달라요 — 여기서는 길만 이어드려요.
          </p>
          <p className={styles.buyDisc}>
            이어지는 곳들과 아직 제휴 관계는 아니에요 — 좋은 곳을 먼저 알려 드리는 거예요.
          </p>
        </div>
      </div>
    </div>
  );
}
