/**
 * 편지지 한 장.
 *
 * **스튜디오의 미리보기와 받는 사람이 여는 화면이 이 컴포넌트 하나를 쓴다.** 두 자리를
 * 따로 그리면 쓴 사람이 본 편지와 받은 사람이 읽는 편지가 조금씩 달라지고, 그건 두 개의
 * 편지다. 다른 점은 `preview` 하나뿐이다 — 아직 비어 있는 칸을 자리 문구로 채울 것인가.
 *
 * 색감(§1.4c 5계열)은 `data-letter-theme` 한 속성으로 들어가고, 종이 자체는 어느 계열에서도
 * 아이보리다(letter.module.css 머리말 — 계열은 액자 색이지 종이 색이 아니다).
 *
 * 훅이 없어 `'use client'` 를 달지 않는다. 부르는 쪽(미리보기·열람)이 클라이언트라
 * 이 파일도 함께 클라이언트로 건너간다.
 */

import type { LetterTheme } from '@/lib/letters/types';
import styles from './letter.module.css';
import type { LetterFlowerOption } from './types';

export interface LetterSheetProps {
  recipientName: string;
  title?: string;
  body: string;
  signature: string;
  theme: LetterTheme;
  /** 고른 꽃. 아직 고르지 않았으면 꽃 칸 자체를 세우지 않는다(빈 액자를 그리지 않는다). */
  flower?: LetterFlowerOption;
  /** 스튜디오 미리보기 여부. 빈 칸을 자리 문구로 채운다. */
  preview?: boolean;
}

/** 미리보기에서만 쓰는 자리 문구(§1.5d 이야기 톤). 저장된 편지에는 절대 나가지 않는다. */
const PLACEHOLDER = {
  recipient: '받는 분',
  body: '여기에 적으신 글이 그대로 편지지에 앉아요.',
  signature: '보내는 분',
} as const;

export default function LetterSheet({
  recipientName,
  title,
  body,
  signature,
  theme,
  flower,
  preview = false,
}: LetterSheetProps) {
  const name = recipientName.trim();
  const text = body.trim();
  const from = signature.trim();
  const heading = title?.trim() ?? '';

  return (
    /* `paperTheme` 이 색 토큰을 든다 — 봉투(`LetterReveal`)도 같은 클래스를 단다. */
    <article className={`${styles.sheet} ${styles.paperTheme}`} data-letter-theme={theme}>
      <span className={styles.sheetEyebrow}>dearbloom letter</span>

      {heading !== '' ? <h3 className={styles.sheetTitle}>{heading}</h3> : null}

      <p className={`${styles.sheetHello} ${name === '' ? styles.sheetPlaceholder : ''}`}>
        {(name === '' ? PLACEHOLDER.recipient : name)}에게
      </p>

      <p className={`${styles.sheetBody} ${text === '' ? styles.sheetPlaceholder : ''}`}>
        {text === '' && preview ? PLACEHOLDER.body : text}
      </p>

      {flower ? (
        <section className={styles.sheetFlower}>
          {/* 아직 실사가 없는 꽃이면 액자를 비워 둔다 — 빈 `src` 는 브라우저가 현재 주소를
              다시 받아 오게 만든다(빈 문자열은 "이 페이지" 로 해석된다). */}
          {flower.photoSrc !== '' ? (
            <div className={styles.sheetPhotoBox}>
              {/* eslint-disable-next-line @next/next/no-img-element -- Unsplash 원격 CDN. 승인 URL 을 그대로 쓴다(docs/image-assets.md — 핫링크가 권장 사용법). */}
              <img
                className={styles.sheetPhoto}
                src={flower.photoSrc}
                srcSet={flower.photoSrcSet}
                /* 액자 폭은 clamp(84px, 22vw, 112px) — 레티나 2배까지 봐도 640 이면 넉넉하다. */
                sizes="(max-width: 640px) 22vw, 112px"
                alt={flower.alt}
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}

          <div className={styles.sheetFlowerText}>
            <p className={styles.sheetFlowerName}>{flower.nameKo}</p>
            <p className={styles.sheetMeaning}>{flower.meaning}</p>
            {/* 표기 의무는 없지만 표기를 기본값으로 운용한다(docs/image-assets.md §사용 규칙 2). */}
            {flower.credit !== '' ? <p className={styles.sheetCredit}>{flower.credit}</p> : null}
          </div>

          {flower.plate ? (
            <figure className={styles.sheetPlate}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 자체 호스팅 도판(본판 + 160px 썸네일 2벌). next/image 최적화는 도입하지 않았다(docs/illustration-assets.md). */}
              <img src={flower.plate.src} alt={flower.plate.alt} loading="lazy" decoding="async" />
            </figure>
          ) : null}
        </section>
      ) : null}

      <p className={`${styles.sheetSign} ${from === '' ? styles.sheetPlaceholder : ''}`}>
        <span className={styles.sheetSignFrom}>from</span>
        {from === '' ? PLACEHOLDER.signature : from}
      </p>
    </article>
  );
}
