import { z } from 'zod';
import type { Weights } from './types';

/**
 * 적합도 가중치 기본값.
 * I: intent, R: relationship, S: season, A: aesthetic(색/분위기), P: personal(개인화), D: diversity
 * 합계 1.0.
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

/** config jsonb로 들어오는 가중치 검증용 스키마. 각 0~1, 합 0.99~1.01. */
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
