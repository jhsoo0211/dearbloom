import { describe, expect, it } from 'vitest';
import { exclude } from '@/lib/engine/exclude';
import { flowerIds, makeInput, testFlowers } from './fixtures';

describe('exclude', () => {
  it('고양이가 있으면 백합류를 제외한다', () => {
    const { candidates, excluded } = exclude(testFlowers, makeInput({ pets: ['cat'] }));

    expect(flowerIds(candidates)).not.toContain('lily-asiatic');

    const lilyExclusion = excluded.find((e) => e.flower.id === 'lily-asiatic');
    expect(lilyExclusion).toBeDefined();
    expect(lilyExclusion?.ruleId).toBe('EX_PET_TOXIC');
    expect(lilyExclusion?.reason).toContain('고양이');
  });

  it('mild_gi 독성(흰 튤립×강아지)은 제외하지 않고 caution만 남긴다', () => {
    const { candidates, excluded, cautionsByFlower } = exclude(
      testFlowers,
      makeInput({ pets: ['dog'] }),
    );

    expect(flowerIds(candidates)).toContain('tulip-white');
    expect(excluded.some((e) => e.flower.id === 'tulip-white')).toBe(false);

    const cautions = cautionsByFlower.get('tulip-white') ?? [];
    expect(cautions.length).toBeGreaterThan(0);
    expect(cautions.some((c) => c.includes('반려동물'))).toBe(true);
    expect(cautions.some((c) => c.includes('강아지'))).toBe(true);
  });

  it('예산 3만 원 미만이면 priceBand 2·3 꽃을 제외한다', () => {
    const { candidates, excluded } = exclude(
      testFlowers,
      makeInput({ budgetKrw: { max: 29000 } }),
    );

    expect(flowerIds(candidates).sort()).toEqual(['freesia', 'gerbera']);

    const budgetExcluded = excluded.filter((e) => e.ruleId === 'EX_BUDGET');
    expect(budgetExcluded.map((e) => e.flower.id).sort()).toEqual([
      'lily-asiatic',
      'rose-red',
      'tulip-white',
    ]);
  });

  it('제외 요청한 꽃은 EX_DISLIKED로 걸러낸다', () => {
    const { candidates, excluded } = exclude(
      testFlowers,
      makeInput({ dislikedFlowerIds: ['rose-red'] }),
    );

    expect(flowerIds(candidates)).not.toContain('rose-red');
    expect(excluded.find((e) => e.flower.id === 'rose-red')?.ruleId).toBe('EX_DISLIKED');
  });

  it('향에 민감하면 fragranceLevel 2 이상을 제외한다', () => {
    const { candidates, excluded } = exclude(testFlowers, makeInput({ fragranceSensitive: true }));

    expect(flowerIds(candidates).sort()).toEqual(['gerbera', 'tulip-white']);
    expect(excluded.filter((e) => e.ruleId === 'EX_FRAGRANCE').map((e) => e.flower.id).sort()).toEqual(
      ['freesia', 'lily-asiatic', 'rose-red'],
    );
  });
});
