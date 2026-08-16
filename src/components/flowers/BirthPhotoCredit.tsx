'use client';

/**
 * 탄생화 사진의 **크레딧 디스클로저** — 사진이 서는 모든 자리에 이 한 조각이 함께 선다.
 *
 * ── 왜 이것이 컴포넌트인가 ──────────────────────────────────────────
 * 사진은 두 자리에 걸린다(생일 찾기 결과 카드 · 사전 시트). 두 곳에 크레딧을 따로 적으면
 * 한쪽만 고쳐지는 날이 오고, 그날 우리는 **라이선스를 어긴 화면**을 하나 갖게 된다.
 * 그래서 사진을 거는 자리는 언제나 이 컴포넌트를 함께 세운다 — 사진만 뽑아 쓰지 마라.
 *
 * ── 무엇을 밝히는가 (Advisor 확정 2026-08-16) ────────────────────────
 * 274장 중 218장이 CC BY / CC BY-SA 이고, 우리가 거는 것은 폭을 줄여 다시 인코딩한
 * **사본**이라 CC BY-SA 에서는 파생물이다. 그 의무는 이미지 단위로 이 셋을 밝히면 이행된다:
 *   ① 저작자  ② 라이선스 라벨(파일 페이지 표기 그대로)  ③ 원본 파일 페이지 링크
 * 여기에 "무엇을 바꿨는지" 한 줄(`BIRTH_PHOTO_CREDIT_NOTE`)을 더한다 — 폭만 줄였다는 사실이
 * 곧 변경 고지다. **사진 위에 글자를 합성하지 않는 규칙도 같은 자리에서 나온다.**
 *
 * ── 왜 접어 두는가 ──────────────────────────────────────────────────
 * 화면에 먼저 와야 하는 것은 꽃이지 저작권 표기가 아니다(§1.5i 본문 우선). `<details>` 는
 * 브라우저가 키보드·낭독기 동작을 이미 갖고 있어(열림 상태를 `aria-expanded` 로 알린다)
 * 우리가 다시 만들 이유가 없다 — 손으로 만든 토글보다 이쪽이 언제나 낫다.
 */

import {
  BIRTH_PHOTO_CREDIT_LINK,
  BIRTH_PHOTO_CREDIT_NOTE,
  BIRTH_PHOTO_CREDIT_SUMMARY,
} from './birth-copy';
import styles from './flowers.module.css';
import type { BirthPhotoView } from '@/lib/birth-photos/view';

interface BirthPhotoCreditProps {
  photo: BirthPhotoView;
}

export default function BirthPhotoCredit({ photo }: BirthPhotoCreditProps) {
  return (
    <details className={styles.credit}>
      <summary className={styles.creditSummary}>{BIRTH_PHOTO_CREDIT_SUMMARY}</summary>

      <div className={styles.creditBody}>
        {/*
          저작자와 라이선스는 **한 줄**로 붙여 둔다. 둘을 떼어 놓으면 사진이 여러 장 서는
          화면에서 어느 라이선스가 어느 저작자의 것인지 흐려진다.
          라벨은 파일 페이지 표기 그대로다 — 우리가 `CC BY-SA 4.0` 을 `CC BY-SA` 로 줄이면
          그 순간 크레딧이 부정확해진다.
        */}
        <p className={styles.creditLine} data-testid="birth-credit-line">
          {photo.author} · <span className={styles.creditLicense}>{photo.license}</span>
        </p>

        <p className={styles.creditLine}>
          <a
            className={styles.dictSourceLink}
            href={photo.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {BIRTH_PHOTO_CREDIT_LINK}
            <span className={styles.srOnly}> (새 창)</span>
          </a>
        </p>

        <p className={styles.creditNote}>{BIRTH_PHOTO_CREDIT_NOTE}</p>
      </div>
    </details>
  );
}
