import type { Metadata, Viewport } from 'next';
import { Instrument_Serif } from 'next/font/google';

import SkipLink from '@/components/a11y/SkipLink';
import { SITE_URL } from '@/lib/site';
import { DEFAULT_FLOWER_THEME } from '@/lib/theme/flowers';
import './globals.css';

/**
 * 루트 레이아웃 — 언어·메타·폰트·기본 테마·건너뛰기 링크만 세운다.
 *
 * 폰트는 셋인데 받아 오는 길이 다르다(design-spec §1.3, 확정 시안 design/landing-v3).
 *   · Pretendard(본문·UI)   — jsDelivr **dynamic-subset** 스타일시트.
 *   · MaruBuri(제목·꽃말)   — globals.css 의 `@font-face`(네이버 CDN, 굵기 2벌).
 *   · Instrument Serif(로고) — **`next/font/google`**. 빌드 때 받아 우리 도메인에서 서빙한다.
 *
 * 앞의 둘만 CDN 링크로 남는 이유는 저장소에 폰트 파일이 없고 두 CDN 이 §1.3 에서 명시적으로
 * 허용된 외부 리소스이기 때문이다. 로고용 라틴 폰트는 사정이 다르다 — `next/font` 가
 * 서브셋 woff2 를 빌드 산출물에 넣어 주므로, 예전의 수동 `<link>` 두 줄(스타일시트 요청 →
 * 그 안의 woff2 요청)과 fonts.googleapis/gstatic preconnect 두 줄이 통째로 사라진다.
 * 렌더 차단 요청이 줄고, 폰트 파일이 같은 오리진에서 온다(성능 리뷰 P0-폰트).
 *
 * 기본 테마는 흰 튤립(나이트 보태니컬). `<html data-flower>` 값 하나로 배경·강조·CTA가
 * 세트로 바뀐다(§1.4c). 꽃 전환 UI 는 후속 작업.
 */

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  // globals.css 의 `--font-stack-logo` 가 이 변수를 읽는다(패밀리 이름은 빌드마다 달라진다).
  variable: '--font-instrument-serif',
});

const TITLE = 'dearbloom — 꽃이 대신 말해드려요';
const DESCRIPTION =
  '관계와 상황만 알려주세요. 어울리는 꽃과 꽃말, 추천 이유, 진짜로 쓸 수 있는 멘트까지 45초 안에 골라드려요.';

/**
 * ⚠ OG 이미지는 **일부러 비워 뒀다.** 대표 이미지가 아직 없고, 없는 파일을 가리키는
 *   `og:image` 는 카드에서 깨진 자리로 나온다. 이미지가 생기면 `openGraph.images` 와
 *   `twitter.card: 'summary_large_image'` 를 함께 올린다.
 * ⚠ `metadataBase` 는 배포 도메인이 정해질 때까지 환경변수를 본다(`@/lib/site`).
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'dearbloom',
  openGraph: {
    type: 'website',
    siteName: 'dearbloom',
    locale: 'ko_KR',
    url: '/',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark light',
  themeColor: DEFAULT_FLOWER_THEME.themeColor,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ko"
      data-flower={DEFAULT_FLOWER_THEME.slug}
      className={`h-full ${instrumentSerif.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preconnect" href="https://hangeul.pstatic.net" crossOrigin="" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        {/* 실사 163컷 중 123컷이 Pexels 에서 온다(2026-08-17 확장 배치 2) — Unsplash 보다 많다. */}
        <link rel="preconnect" href="https://images.pexels.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full antialiased">
        {/* 문서의 첫 포커스 대상 — 내비·캐러셀을 건너뛰어 본문으로 간다. */}
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
