import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `content/*.csv` 를 서버 번들 트레이스에 강제로 포함한다.
   *
   * `loadCatalog()` 는 런타임에 `node:fs` 로 CSV 를 읽는데(경로가 문자열로 조립되므로)
   * 트레이서가 정적 분석으로 그 의존을 찾지 못한다. 포함하지 않으면 로컬에서는 멀쩡하다가
   * 서버리스 배포에서만 "파일을 읽을 수 없습니다" 로 죽는다.
   * Supabase 로 옮기면 이 설정도 함께 지운다.
   */
  outputFileTracingIncludes: {
    "/*": ["./content/**/*.csv"],
  },
};

export default nextConfig;
