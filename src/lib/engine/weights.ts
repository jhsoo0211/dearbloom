import { z } from 'zod';
import type { Weights } from './types';

/**
 * 적합도 가중치 기본값 — 명세의 점수식 `0.30I + 0.25R + 0.15S + 0.15A + 0.10P + 0.05D`.
 * I: intent, R: relationship, S: season, A: aesthetic(색/분위기), P: personal(개인화), D: diversity
 * 합계 1.0.
 *
 * ⚠ 여섯 항이 **모두 합산에 들어간다.** P 는 `scoreCandidate` 안에서, D 는 세 안이 정해진
 * 뒤 `diversify()` 에서 실린다. 2026-08-17 감사(P1-1)가 잡은 "0.85 가 상한" 은 P 가 스텁
 * 상수였고 D 가 식에 아예 없어서였다 — 그때는 합 1.0 을 강제하는 아래 refine 이
 * 화면 값과 어긋나 있었다. 항을 빼서 맞추지 않고 식을 채워서 맞췄다.
 */
export const DEFAULT_WEIGHTS: Weights = {
  I: 0.3,
  R: 0.25,
  S: 0.15,
  A: 0.15,
  P: 0.1,
  D: 0.05,
};

const ratio = z.number().min(0).max(1);

/**
 * config jsonb로 들어오는 가중치 검증용 스키마. 각 0~1, 합 0.99~1.01.
 * 이 refine 이 "관리자가 준 배분 = 실제로 적용되는 배분" 을 지키는 유일한 장치다.
 * 느슨하게 풀지 말 것 — 합이 1.0 이 아니면 fitScore 의 100 이 100 이 아니게 된다.
 */
export const weightsSchema = z
  .object({
    I: ratio,
    R: ratio,
    S: ratio,
    A: ratio,
    P: ratio,
    D: ratio,
  })
  .refine(
    (w) => {
      const sum = w.I + w.R + w.S + w.A + w.P + w.D;
      return sum >= 0.99 && sum <= 1.01;
    },
    { message: '가중치 합은 1.0(오차 ±0.01)이어야 합니다.' },
  );

export type WeightsInput = z.infer<typeof weightsSchema>;
