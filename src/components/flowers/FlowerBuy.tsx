'use client';

/**
 * 도감 상세 하단의 「사러 가기」 — 버튼 하나와 그 버튼이 여는 시트.
 *
 * 상세 페이지는 서버 컴포넌트라(SSG 59종) 시트를 여닫는 상태를 들 수 없다. 그 상태만
 * 여기로 떼어 낸다 — 화면에 서는 것은 §1.6b **보조 버튼** 하나뿐이라 클라이언트로
 * 내려가는 코드가 목록 조립(`buildBuyLinks`)과 시트 하나로 끝난다.
 *
 * ⚠ 버튼 문구는 결과 화면과 **같은 결**이다(`‘장미’ 사러 가기`). 같은 일을 하는 컨트롤이
 *   화면마다 다른 이름이면 그것부터 읽힌다(§1.6b).
 * ⚠ 검색어로 쓰는 이름은 `buySearchName()` 을 거친 값이다 — `빨간 장미 꽃다발` 은 0건이고
 *   `장미 꽃다발` 은 결과가 나온다(그 규칙의 근거는 `buy-name.ts` 머리말).
 */

import { useState } from 'react';

import BuySheet from './BuySheet';
import { buySearchName } from './buy-name';
import styles from './flowers.module.css';

export interface FlowerBuyProps {
  /** 도감이 부르는 이름 그대로(`빨간 장미`). 검색어로 좁히는 일은 이 컴포넌트가 한다. */
  nameKo: string;
}

export default function FlowerBuy({ nameKo }: FlowerBuyProps) {
  const [open, setOpen] = useState(false);
  const searchName = buySearchName(nameKo);

  return (
    <>
      <button type="button" className={styles.buyOpen} onClick={() => setOpen(true)}>
        ‘{searchName}’ 사러 가기
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h13M12.5 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && <BuySheet flowerName={searchName} onClose={() => setOpen(false)} />}
    </>
  );
}
