'use client';

/**
 * 모바일 내비 메뉴 (§1.6c · 2026-08-17 A안 확정).
 *
 * 860px 아래에서 `.db-nav-links` 가 통째로 숨는다. 그래서 폰에서는 상단에 로고와
 * `추천 시작` 만 남고 **이야기·도감·편지로 가는 길이 화면 위에 하나도 없었다** — 그 셋에
 * 닿으려면 페이지 끝의 푸터까지 내려가야 했고, 푸터 보조 메뉴에는 도감도 편지도 없다.
 *
 * 좁은 화면에서 줄을 접은 이유(유리 알약 하나에 항목 다섯이 들어가지 않는다)는 그대로
 * 유효하다. A안은 상단의 중복 `추천 시작`을 덜고 **워드마크 + 메뉴**만 남기며, 열면 화면
 * 전체가 목차가 된다. 추천 진입은 히어로와 이 시트 하단의 주 CTA가 맡는다.
 *
 * ── 설계 메모 ────────────────────────────────────────────────────────
 * · 시트는 `<header>`와 `<nav class="db-nav">` **밖**에 그린다. 내비는 `backdrop-filter` 를 쓰는
 *   `.db-glass` 라 고정 위치 자손의 컨테이닝 블록이 되고, 게다가 `overflow: hidden` 이다 —
 *   안에 두면 `position: fixed; inset: 0` 이 알약 크기로 잘린다(실측으로 확인한 자리).
 * · 닫혀 있으면 **아예 그리지 않는다.** 서버 HTML 과 하이드레이션 첫 렌더가 모두 `null`
 *   이라 불일치가 생길 자리가 없고(게이트가 `data-db-gate` 로 겪은 실패의 반대편),
 *   열 때마다 등장 연출이 처음부터 다시 재생된다.
 * · 항목은 데스크톱 내비와 같은 넷이다. `여러 명에게`(`/groups`)는 2026-08-17 사용자
 *   확정으로 시트에서도 뺐다 — "추천받기가 있으니까". 여러 명에게 가는 길은 추천 플로우
 *   1번 질문의 갈림길(`여러 분께` 칩)이 맡는다(#20 이 진입을 하나로 모은 그 자리다).
 *   페이지 자체는 그대로 살아 있다 — 시트가 지도가 아니라 **본류의 목차**가 된 것뿐이다.
 */

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';

import { lockBodyScroll } from './body-scroll-lock';

/**
 * 목차 네 줄 — 데스크톱 내비의 콘텐츠 목적지와 같다.
 *
 * `kind` 는 데스크톱 내비와 **같은 링크 종류**를 쓰기 위한 것이다 — 랜딩 앵커(`#db-today`)와
 * `/stories` 는 그쪽도 평범한 `<a>` 이고, 도감·편지는 `next/link`(`prefetch` 없음)다.
 */
const SHEET_ITEMS = [
  { no: '01', label: '오늘의 꽃', href: '#db-today', kind: 'anchor' },
  { no: '02', label: '이야기', href: '/stories', kind: 'anchor' },
  { no: '03', label: '도감', href: '/flowers', kind: 'link' },
  { no: '04', label: '편지', href: '/letter', kind: 'link' },
] as const;

/** 순차 등장의 자리 번호. CSS 가 `--db-i` × 55ms 로 지연을 만든다(reduced-motion 이면 없다). */
function order(index: number): React.CSSProperties {
  return { '--db-i': index } as React.CSSProperties;
}

export default function MobileNavSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  /* 뒤 페이지가 밀리지 않게 잠근다. 게이트와 **같은 셈**을 쓰므로 둘이 겹쳐도
     해제 순서가 어긋나지 않는다(`body-scroll-lock.ts` 머리말). */
  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  /* 열리는 즉시 대화상자 자체로 포커스를 옮긴다 — 첫 Tab 이 이미 트랩 안에 있어야 한다.
     닫을 때 연 버튼으로 되돌리는 것은 `LandingPage` 가 한다(그 버튼의 ref 를 가진 쪽). */
  useEffect(() => {
    if (!open) return;
    sheetRef.current?.focus({ preventScroll: true });
  }, [open]);

  /** Esc 는 닫기, Tab 은 시트 안에서 순환(게이트와 같은 규격). */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusables = Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) {
        event.preventDefault();
        sheet.focus({ preventScroll: true });
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || active === sheet) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || active === sheet) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  /**
   * 배경 탭으로 닫기.
   *
   * 시트가 화면을 다 덮으므로 "배경"은 항목 사이의 여백이다. 그래서 좌표가 아니라
   * **무엇을 눌렀는가**로 가른다 — 링크·버튼이 아니면 전부 배경이다.
   */
  const onBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const target = event.target;
      if (target instanceof Element && target.closest('a, button')) return;
      onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      className="db-navsheet"
      role="dialog"
      aria-modal="true"
      aria-label="전체 메뉴"
      ref={sheetRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onClick={onBackdropClick}
    >
      {/* 필름 그레인 — 필터는 `.db-page` 끝의 `#db-grain-noise` 한 벌을 같이 쓴다. */}
      <svg
        className="db-navsheet-grain"
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <rect width="100%" height="100%" filter="url(#db-grain-noise)" />
      </svg>

      <div className="db-navsheet-in">
        <div className="db-navsheet-top" style={order(0)}>
          <p className="db-navsheet-over">Night Botanical Archive</p>
          {/* §1.6b 아이콘 버튼 — 원형 44×44 · 1px 보더 · 스트로크 1.6 */}
          <button
            type="button"
            className="db-navsheet-x"
            aria-label="메뉴 닫기"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6 18 18M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <ul className="db-navsheet-list">
          {SHEET_ITEMS.map((item, index) => (
            <li key={item.href} className="db-navsheet-item" style={order(index + 1)}>
              {item.kind === 'link' ? (
                <Link href={item.href} prefetch={false} onClick={onClose}>
                  <span className="db-navsheet-no" aria-hidden="true">
                    {item.no}
                  </span>
                  <span className="db-navsheet-label">{item.label}</span>
                </Link>
              ) : (
                <a href={item.href} onClick={onClose}>
                  <span className="db-navsheet-no" aria-hidden="true">
                    {item.no}
                  </span>
                  <span className="db-navsheet-label">{item.label}</span>
                </a>
              )}
            </li>
          ))}
        </ul>

        <Link
          className="db-btn db-btn-primary db-navsheet-cta"
          href="/recommend"
          prefetch={false}
          onClick={onClose}
          style={order(SHEET_ITEMS.length + 1)}
        >
          45초 만에 추천받기
          <span className="db-arw" aria-hidden="true">
            →
          </span>
        </Link>

        <p className="db-navsheet-foot" style={order(SHEET_ITEMS.length + 2)}>
          밤에 자란 식물들의 기록 · dearbloom
        </p>
      </div>
    </div>
  );
}
