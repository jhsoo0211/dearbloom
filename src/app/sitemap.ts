import type { MetadataRoute } from 'next';

import { loadCatalog } from '@/lib/data/catalog';
import { SITE_URL } from '@/lib/site';

/**
 * `/sitemap.xml` — 정적 라우트 8개 + 도감 상세(카탈로그 전종).
 *
 * 도감은 `generateStaticParams` 로 종마다 한 장씩 미리 생성되는 실제 페이지들이라
 * (빌드 로그의 `● /flowers/[slug]` 32건) 지도에 그대로 싣는다. 목록을 손으로 적지 않고
 * **카탈로그에서 만드는 것이 핵심이다** — 꽃이 늘면 지도도 함께 는다.
 *
 * `changeFrequency`·`priority` 는 힌트일 뿐 순위를 만들지 않는다. 그래도 적어 두는 이유는
 * 우리 화면의 갱신 주기가 실제로 다르기 때문이다: 랜딩은 오늘의 꽃이 매일 바뀌고(daily),
 * 도감·이야기는 데이터가 늘 때만 바뀐다(monthly).
 *
 * `revalidate` 는 랜딩과 같은 1시간이다. 카탈로그가 CSV 라 빌드에 고정돼 있어 더 자주
 * 다시 만들 이유가 없다.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const catalog = await loadCatalog();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/recommend`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/flowers`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/stories`, changeFrequency: 'monthly', priority: 0.8 },
    /* 「읽을거리」는 다른 정적 화면보다 자주 바뀐다 — 주간 점검이 만료된 행사를 빼고 새
       회차를 넣는다(`docs/reads-research.md` §7-3). 그래서 여기만 weekly 다. */
    { url: `${SITE_URL}/reads`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/letter`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/groups`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/partners`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const flowerRoutes: MetadataRoute.Sitemap = catalog.flowers.map((flower) => ({
    url: `${SITE_URL}/flowers/${flower.id}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...flowerRoutes].map((entry) => ({ lastModified: now, ...entry }));
}
