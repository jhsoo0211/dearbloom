import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

/**
 * `/robots.txt` — 크롤러에게 "다 봐도 된다, 지도는 여기 있다"만 말한다.
 *
 * 막는 곳이 하나 있다: `/recommend` 의 **결과 쿼리**. 추천 플로우는 사용자의 선택이
 * 쿼리스트링에 실리는 동적 라우트라, 크롤러가 조합을 긁으면 같은 화면이 수백 개의
 * 주소로 색인된다. 진입점(`/recommend`) 자체는 열어 둔다.
 *
 * ⚠ 배포 도메인이 정해지면 `NEXT_PUBLIC_SITE_URL` 만 넣으면 된다(`@/lib/site`).
 *   그 전에는 sitemap 주소가 localhost 로 나오는데, 로컬에서만 보이는 값이라 문제되지 않는다.
 */
/**
 * 이 파일은 원래도 **빌드 때 한 번** 만들어져 그대로 나가는 정적 산출물이다
 * (빌드 로그의 `○ /robots.txt`). 그 사실을 명시로 적어 둔다 — 기본 빌드에서는 값이
 * 바뀌지 않는 한 줄이지만, 정적 export(`npm run build:static`)는 이 선언이 없으면
 * "이 라우트가 정적인지 확신할 수 없다"며 빌드를 멈춘다.
 */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/recommend?'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
