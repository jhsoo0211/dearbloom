'use client';

/**
 * 본문 스크롤 잠금 — **겹쳐도 안전한 한 벌**.
 *
 * 랜딩에는 화면을 덮는 것이 둘이다: 로딩 게이트(#21)와 모바일 내비 메뉴(§1.6c).
 * 둘 다 "뒤 페이지가 밀리지 않게" `body` 를 잠가야 하는데, 각자 `overflow` 를 저장하고
 * 되돌리면 **겹치는 순간 값이 어긋난다** — 나중에 잠근 쪽이 `hidden` 을 원래 값으로 알고
 * 저장했다가, 자기가 풀 때 그 `hidden` 을 다시 써 넣어 먼저 잠근 쪽이 풀려도 화면이
 * 잠긴 채로 남는다(반대 순서면 아직 열려 있는 쪽의 잠금이 조용히 풀린다).
 *
 * 그래서 잠금을 **셈한다**. 처음 하나가 걸릴 때만 원래 값을 기억하고, 마지막 하나가
 * 풀릴 때만 되돌린다. 해제 함수는 멱등이다(React 이펙트 정리가 두 번 불려도 셈이 깨지지 않는다).
 *
 * ⚠ Lenis(스무스 스크롤)는 그대로 돈다 — 게이트가 이미 같은 방식으로 잠그고 있고,
 *   `overflow: hidden` 이면 문서가 스크롤될 자리 자체가 없어 Lenis 도 움직이지 못한다.
 */

let locks = 0;
let restoreTo = '';

export function lockBodyScroll(): () => void {
  if (locks === 0) {
    restoreTo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  locks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) document.body.style.overflow = restoreTo;
  };
}
