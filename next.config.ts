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

  /**
   * 도판 캐시 — `public/plates/**`(본판 32 + 썸네일 32).
   *
   * `public/` 정적 파일에 Next 가 기본으로 붙이는 값은 `Cache-Control: public, max-age=0` 이라
   * 다시 찾아온 사람이 **매번 32장을 재검증**한다(성능 리뷰 P0-3 실측). 도판은 퍼블릭 도메인
   * 판면을 우리가 한 번 정규화해 둔 파일이라 그럴 이유가 없다.
   *
   * `immutable` 을 쓰지 않는 이유: 파일 이름에 내용 해시가 없다(`/plates/rose-red.jpg`).
   * 도판은 바뀔 수 있고(더 나은 판본을 찾거나 `--force` 로 다시 받는다) 그때 이름은 그대로다 —
   * `immutable` 이면 이미 받아 간 브라우저가 **1년 동안 옛 그림을 붙들고 있다.**
   * 그래서 하루(86400) 동안만 그대로 쓰고, 그 뒤로는 일주일(604800)까지 옛 그림을 보여 주면서
   * 뒤에서 새로 받아 오게 한다(`stale-while-revalidate`) — 보수적인 값을 택했다.
   */
  async headers() {
    return [
      {
        source: "/plates/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
