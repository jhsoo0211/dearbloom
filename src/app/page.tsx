import LandingPage from '@/components/landing/LandingPage';
import { buildLandingData, seoulTodayISO } from '@/components/landing/landing-data';
import { loadCatalog } from '@/lib/data/catalog';

/**
 * 랜딩(홈) — 서버에서 오늘의 꽃과 카탈로그를 확정해 내려보낸다.
 *
 * · 날짜는 **KST 달력** 기준이다(서버가 어느 시간대에 있든 서울의 오늘을 쓴다).
 * · `revalidate = 3600` — 매시 재생성. 자정을 넘기면 다음 재생성에서 꽃이 바뀐다.
 *   (`content/*.csv` 는 배포에 고정된 읽기 전용 데이터라 그 이상 자주 읽을 이유가 없다.)
 * · 화면 구성·모션은 클라이언트 컴포넌트가 맡는다. 여기서는 데이터만 만든다.
 */
export const revalidate = 3600;

export default async function Home() {
  const catalog = await loadCatalog();
  const data = buildLandingData(catalog, seoulTodayISO());

  return <LandingPage data={data} />;
}
