'use client';

/**
 * 추천 플로우의 껍데기 — 질문과 결과를 **같은 페이지에서** 갈아 끼운다.
 *
 * 결과를 URL 로 넘기지 않는 이유는 개인적인 입력(관계·마음·반려동물)이 주소창과
 * 히스토리·리퍼러에 남지 않게 하기 위해서다. 대신 새로고침하면 질문 처음으로 돌아간다(MVP).
 */

import { useState } from 'react';

import ResultView from './ResultView';
import Wizard from './Wizard';
import type { FlowResponse, ResultPayload, WizardOptions, WizardSubmission } from './types';
import styles from './flow.module.css';

/**
 * 결과가 도착했다는 것을 화면을 못 보는 사람에게도 알리는 한 줄.
 * 아래 live 영역은 **처음부터 비어 있는 채로 서 있다** — 나중에 통째로 생겨나는 영역은
 * 스크린리더가 읽어 주지 않는다. 값이 채워지는 순간이 곧 안내다.
 */
const RESULT_ANNOUNCEMENT = '꽃 세 가지를 골라 두었어요. 아래에서 하나씩 들려드릴게요.';

export interface RecommendFlowProps {
  options: WizardOptions;
  /** 전하는 날의 기본값(서버가 정한 "내일"). 서버·화면이 같은 값을 그려야 한다. */
  defaultDateISO: string;
  action: (submission: WizardSubmission) => Promise<FlowResponse>;
}

export default function RecommendFlow({ options, defaultDateISO, action }: RecommendFlowProps) {
  const [payload, setPayload] = useState<ResultPayload | null>(null);

  /*
   * 질문 ↔ 결과를 오갈 때는 맨 위에서 시작한다.
   *
   * 이 일을 effect(`[payload]`)로 하지 않는 이유가 두 가지다. ① 최초 마운트에서도 한 번
   * 도는 바람에, 페이지에 막 들어온 사람의 스크롤 위치(뒤로가기 복원 포함)를 이유 없이
   * 꼭대기로 끌어올렸다. ② 스크롤은 "값이 바뀌어서 따라오는 일"이 아니라 **사용자가 누른
   * 결과**다 — 누른 자리에 두는 편이 언제 도는지 읽기 쉽다.
   */
  function toTop() {
    window.scrollTo({ top: 0 });
  }

  function showResult(next: ResultPayload) {
    setPayload(next);
    toTop();
  }

  function restart() {
    setPayload(null);
    toTop();
  }

  return (
    <div className={`${styles.flow} ${styles.frame}`}>
      {/* 결과 도착 안내 — 화면에는 없고 낭독에만 있다. 빈 채로 미리 서 있어야 읽힌다. */}
      <p className="sr-only" role="status">
        {payload ? RESULT_ANNOUNCEMENT : ''}
      </p>

      {payload ? (
        <ResultView payload={payload} onRestart={restart} />
      ) : (
        <Wizard
          options={options}
          defaultDateISO={defaultDateISO}
          action={action}
          onResult={showResult}
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
