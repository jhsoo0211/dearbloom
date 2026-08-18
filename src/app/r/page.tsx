import type { Metadata } from 'next';

import SharedPick from '@/components/flow/SharedPick';

/**
 * `/r` — 건네받은 추천 결과를 여는 화면 (2026-08-18).
 *
 * ── 주소가 `/r?c=…` 인 이유 (경로 세그먼트가 아니라) ─────────────────
 * 처음 설계는 `/r/[code]` 였다. 정적 드롭 데모(`output: 'export'`)에서 **그 주소가 존재할
 * 수 없어서** 바꿨다: 동적 세그먼트는 빌드 때 `generateStaticParams` 로 미리 뽑아 둔
 * 경로만 파일이 되는데, 공유 부호는 사용자가 그때 만드는 값이라 미리 알 길이 없다.
 * `npx serve out` 도 Netlify 드롭도 없는 파일에는 404 를 준다 — 링크가 데모에서 죽는다.
 * 쿼리는 정적 호스팅이 무시하고 지나가므로, 파일 하나(`/r`)로 모든 부호가 열린다.
 * (같은 이유로 본배포에서도 같은 주소를 쓴다 — 배포 방식에 따라 링크가 달라지면
 *  이미 건네준 링크가 다음 배포에서 깨진다.)
 *
 * ── 메타데이터 ───────────────────────────────────────────────────────
 * OG 이미지·절대 URL 은 **손대지 않는다.** 배포 도메인이 아직 없어 `SITE_URL` 이
 * `localhost` 로 굳어 있고(`src/lib/site.ts`), 잘못된 절대 주소는 없는 것보다 나쁘다.
 * 제목·설명도 **부호를 읽지 않고** 쓴다 — 읽으려면 요청 시점 렌더가 되어 정적 export 가
 * 깨지고, 무엇보다 미리보기에 남의 선택이 실릴 이유가 없다.
 *
 * `robots` 를 막아 둔 것은 이 주소가 **한 사람에게 건넨 링크**라서다. 검색 결과에
 * 남의 추천이 뜨는 것은 아무도 원하지 않는다(민감한 값이 없더라도 마찬가지다).
 */
export const metadata: Metadata = {
  title: 'dearbloom — 건네받은 꽃',
  description: '누군가 골라 건넨 꽃 세 가지와 그 꽃말을 읽어보세요.',
  robots: { index: false, follow: false },
};

export default function SharedResultPage() {
  return <SharedPick />;
}
