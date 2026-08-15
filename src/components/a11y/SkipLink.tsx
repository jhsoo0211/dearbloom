'use client';

/**
 * "본문 바로가기" — 전 라우트 공통 건너뛰기 링크 (접근성 리뷰 P1-4).
 *
 * 키보드·스크린리더 사용자는 페이지마다 내비를 처음부터 통과해야 한다. 랜딩은 특히
 * 나쁘다(내비 → 캐러셀 64 정지점). 그래서 **문서의 첫 번째 포커스 가능한 요소**로
 * 이 링크를 둔다. 평소에는 화면 밖에 있고, 포커스를 받으면 좌상단에 내려온다(globals.css `.db-skip`).
 *
 * ⚠ 왜 순수 `<a href="#…">` 가 아닌가: 라우트마다 `<main>` 은 있지만 **id 가 제각각**이다
 *   (랜딩만 `#db-main`). 레이아웃은 어느 라우트가 올지 모르므로 앵커 하나로는 전부를
 *   맞출 수 없다. 그래서 클릭 때 첫 `<main>` 을 찾아 포커스를 옮긴다 —
 *   `tabindex="-1"` 은 그 자리에 **포커스를 받을 수 있게만** 하고 탭 순서는 늘리지 않는다.
 *   스크립트가 죽어도 `href="#db-main"` 이 살아 있어 랜딩에서는 그대로 동작한다.
 */
export default function SkipLink() {
  function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const main = document.querySelector('main');
    if (!main) return; // 앵커 기본 동작에 맡긴다
    event.preventDefault();
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    (main as HTMLElement).focus();
  }

  return (
    <a className="db-skip" href="#db-main" onClick={onClick}>
      본문 바로가기
    </a>
  );
}
