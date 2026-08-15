/**
 * 사이트 절대 주소 — 메타데이터·robots·sitemap 이 함께 쓰는 단일 원본.
 *
 * 배포 도메인이 아직 정해지지 않았다(Supabase·호스팅 미연결). 그래서 값은 환경변수로 받고
 * 없으면 로컬로 떨어진다 — **가짜 도메인을 상수로 박지 않는다.** 잘못된 절대 URL 은
 * 없는 것보다 나쁘다(OG 크롤러·검색엔진이 그 주소를 그대로 믿는다).
 *
 * 배포할 때 `NEXT_PUBLIC_SITE_URL=https://…` 한 줄만 넣으면 다음 셋이 함께 맞춰진다:
 *   · `metadata.metadataBase` (app/layout.tsx) — OG·트위터 카드의 상대 경로 해석 기준
 *   · `app/robots.ts` 의 sitemap 주소
 *   · `app/sitemap.ts` 의 각 URL
 *
 * `NEXT_PUBLIC_` 접두사인 이유: 빌드 타임에 값이 인라인돼야 정적 생성(`revalidate`)된
 * 페이지의 메타데이터에도 같은 주소가 박힌다.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);
