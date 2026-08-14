'use client';

/**
 * 추천 플로우의 껍데기 — 질문과 결과를 **같은 페이지에서** 갈아 끼운다.
 *
 * 결과를 URL 로 넘기지 않는 이유는 개인적인 입력(관계·마음·반려동물)이 주소창과
 * 히스토리·리퍼러에 남지 않게 하기 위해서다. 대신 새로고침하면 질문 처음으로 돌아간다(MVP).
 */

import { useEffect, useState } from 'react';

import ResultView from './ResultView';
import Wizard from './Wizard';
import type { FlowResponse, ResultPayload, WizardOptions, WizardSubmission } from './types';
import styles from './flow.module.css';

export interface RecommendFlowProps {
  options: WizardOptions;
  /** 전하는 날의 기본값(서버가 정한 "내일"). 서버·화면이 같은 값을 그려야 한다. */
  defaultDateISO: string;
  action: (submission: WizardSubmission) => Promise<FlowResponse>;
}

export default function RecommendFlow({ options, defaultDateISO, action }: RecommendFlowProps) {
  const [payload, setPayload] = useState<ResultPayload | null>(null);

  // 질문 ↔ 결과를 오갈 때는 맨 위에서 시작한다.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [payload]);

  return (
    <div className={`${styles.flow} ${styles.frame}`}>
      {payload ? (
        <ResultView payload={payload} onRestart={() => setPayload(null)} />
      ) : (
        <Wizard
          options={options}
          defaultDateISO={defaultDateISO}
          action={action}
          onResult={setPayload}
        />
      )}

      {/* 필름 그레인 — 밴딩을 감춘다(확정 시안 공통) */}
      <svg
        className={styles.grain}
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="none"
      >
        <filter id="db-flow-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#db-flow-grain)" />
      </svg>
    </div>
  );
}
