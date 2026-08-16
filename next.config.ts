import type { NextConfig } from "next";

/**
 * 정적 데모 빌드 스위치 — `npm run build:static` 이 켠다.
 *
 * 기본 빌드(`npm run build`)에서는 이 값이 `false` 라 아래 분기가 통째로 서지 않는다.
 * 즉 **본배포 산출물은 이 파일이 생기기 전과 같다** — 회귀 0 이 이 스위치의 첫 조건이다.
 */
const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

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
   * 도판·탄생화 사진 캐시 — `public/plates/**`(본판 47 + 썸네일 47)와
   * `public/birth/**`(본판 248 + 썸네일 248).
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
    /**
     * 두 자산이 **같은 값**을 쓴다 — 성격이 같기 때문이다. 둘 다 우리가 한 번 정규화해 둔
     * 파일이고, 이름에 내용 해시가 없으며(`/birth/haedanghwa.jpg`), 더 나은 판본을 찾으면
     * 같은 이름으로 다시 받는다(`npm run birth:photos -- --force`).
     * 탄생화 쪽이 496장으로 훨씬 많아 이 헤더의 값어치도 그만큼 크다 — 사전 목록 한 달이
     * 썸네일을 서른한 장 동시에 부르고, 달을 넘길 때마다 그 일이 다시 일어난다.
     */
    const assetCache = {
      key: "Cache-Control",
      value: "public, max-age=86400, stale-while-revalidate=604800",
    };
    return [
      { source: "/plates/:path*", headers: [assetCache] },
      { source: "/birth/:path*", headers: [assetCache] },
    ];
  },
};

/**
 * ── 정적 드롭 데모 (`NEXT_PUBLIC_STATIC_DEMO=1`) ────────────────────────────
 *
 * `out/` 한 폴더로 뽑아 Netlify 드롭·로컬 정적 서버에 그대로 올리는 빌드다.
 * 서버가 없으므로 세 가지를 바꾼다.
 *
 *  1. `output: 'export'` — 라우트를 전부 빌드 타임에 HTML 로 굳힌다.
 *  2. `images.unoptimized` — `/_next/image` 최적화 엔드포인트가 없다(서버가 없다).
 *  3. `turbopack.resolveAlias` — 서버 액션 4벌을 **클라이언트 어댑터로 갈아 끼운다.**
 *
 * 3번이 이 파일에 있는 이유: `output:'export'` 는 서버 액션이 하나라도 살아 있으면
 * 빌드가 실패한다. import 하는 쪽(`components/flowers/BirthdayFinder.tsx`,
 * `components/stories/StorySheet.tsx` …)에 분기를 심는 대신 **번들러 해석 단계에서**
 * 모듈을 바꾸면, 화면 코드는 한 글자도 건드리지 않고 기본 빌드도 영향을 받지 않는다
 * (이 분기가 서지 않으면 alias 자체가 없다).
 *
 * 어댑터는 원본 액션과 **같은 이름·같은 시그니처**를 내보낸다(`src/lib/demo/*-actions.ts`).
 */
if (STATIC_DEMO) {
  nextConfig.output = "export";
  nextConfig.images = { unoptimized: true };

  /*
   * ⚠ `distDir` 은 여기서 건드리지 않는다.
   *
   * `output: 'export'` 에서 Next 는 `distDir` 을 **내보낼 곳**으로 읽고, 빌드 중간
   * 산물은 `.next` 로 되돌려 버린다(`next/dist/build/index.js` 의 `hasCustomExportOutput`).
   * 즉 폴더를 나눠 봐야 `.next` 는 어차피 데모 산출물로 덮인다 — 나눈 척만 하는 셈이라
   * 기본값(`out/` 으로 내보내기)을 그대로 쓰고, **덮였다는 사실을 감추지 않는 쪽**을 택했다.
   * `scripts/build-static.mjs` 가 빌드 끝에 `.next` 를 지우고 그 이유를 말한다.
   */

  /*
   * `headers()` 는 정적 export 에서 적용될 곳이 없다(Next 가 경고만 내고 무시한다).
   * 드롭 데모의 캐시 정책은 호스팅이 정한다 — 지키지도 못할 약속을 빌드 로그에
   * 경고로 남기지 않으려고 여기서 뗀다.
   */
  delete nextConfig.headers;

  nextConfig.turbopack = {
    resolveAlias: {
      "@/app/recommend/actions": "./src/lib/demo/recommend-actions.ts",
      "@/app/groups/actions": "./src/lib/demo/groups-actions.ts",
      "@/app/flowers/actions": "./src/lib/demo/flowers-actions.ts",
      "@/app/stories/actions": "./src/lib/demo/stories-actions.ts",
    },
  };
}

export default nextConfig;
