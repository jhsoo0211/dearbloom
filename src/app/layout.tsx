import type { Metadata, Viewport } from 'next';

import { DEFAULT_FLOWER_THEME } from '@/lib/theme/flowers';
import './globals.css';

/**
 * 루트 레이아웃 — 언어·메타·폰트·기본 테마만 세운다.
 *
 * 폰트는 CDN link 로 받는다(design-spec §1.3, 확정 시안 design/landing-v3 와 같은 방식).
 * `next/font` 를 쓰지 않는 이유: Pretendard dynamic-subset 과 MaruBuri 는 로컬 폰트 파일이
 * 저장소에 없고, 두 CDN 이 §1.3 에서 명시적으로 허용된 외부 리소스이기 때문이다.
 *   · Pretendard(본문·UI)   — jsDelivr 스타일시트
 *   · MaruBuri(제목·꽃말)   — globals.css 의 @font-face
 *   · Instrument Serif(로고) — Google Fonts
 *
 * 기본 테마는 흰 튤립(나이트 보태니컬). `<html data-flower>` 값 하나로 배경·강조·CTA가
 * 세트로 바뀐다(§1.4c). 꽃 전환 UI 는 후속 작업.
 */

export const metadata: Metadata = {
  title: 'dearbloom — 꽃이 대신 말해드려요',
  description:
    '관계와 상황만 알려주세요. 어울리는 꽃과 꽃말, 추천 이유, 진짜로 쓸 수 있는 멘트까지 45초 안에 골라드려요.',
  applicationName: 'dearbloom',
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
    <html lang="ko" data-flower={DEFAULT_FLOWER_THEME.slug} className="h-full">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preconnect" href="https://hangeul.pstatic.net" crossOrigin="" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- 규칙은 pages/_document 기준이다. 여기는 App Router 루트 레이아웃이라 전 페이지에 한 번만 적용된다. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
        />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
