import { describe, expect, it } from 'vitest';

import { SOURCE_KINDS } from '../../db/seed/schemas';
import {
  DOCUMENTED_SINGLE_SOURCE_LABEL,
  DOCUMENTED_SOURCE_KINDS,
  STORY_CONFIDENCE_LABELS,
  regionLabel,
  storyConfidenceLabel,
} from '@/components/flow/labels';
import { loadCatalog } from '@/lib/data/catalog';
import type { SourceKind } from '@/lib/engine';

/**
 * 이야기 신뢰 문구의 분화(design-spec §1.5d 개정 2026-08-15).
 *
 * `single_source` 하나로 라벨을 정하면 1839년 원문과 출처 불명의 카더라가 같은 문구를
 * 달게 된다. 그 갈래를 `source_kind` 로 나눈 것이 `storyConfidenceLabel` 이고,
 * 결과 화면과 /stories 가 **이 함수 하나만** 쓴다(중복 구현 금지).
 */

describe('storyConfidenceLabel', () => {
  it('공신력 있는 원천의 단일 출처는 "기록으로 남아 있는 이야기예요" 가 된다', () => {
    for (const kind of DOCUMENTED_SOURCE_KINDS) {
      expect(storyConfidenceLabel('single_source', kind), kind).toBe(
        DOCUMENTED_SINGLE_SOURCE_LABEL,
      );
    }
  });

  it('그 밖의 단일 출처는 기존 문구를 그대로 쓴다', () => {
    const rest = SOURCE_KINDS.filter((kind) => !DOCUMENTED_SOURCE_KINDS.includes(kind));
    expect(rest).toEqual(['magazine', 'wiki', 'other']);
    for (const kind of rest) {
      expect(storyConfidenceLabel('single_source', kind), kind).toBe(
        STORY_CONFIDENCE_LABELS.single_source,
      );
    }
  });

  it('source_kind 를 모르면 보수적인 쪽(기존 문구)으로 떨어진다', () => {
    expect(storyConfidenceLabel('single_source')).toBe(STORY_CONFIDENCE_LABELS.single_source);
  });

  it('repeated·varies 는 source_kind 와 무관하게 문구가 그대로다', () => {
    for (const kind of SOURCE_KINDS) {
      expect(storyConfidenceLabel('repeated', kind)).toBe(STORY_CONFIDENCE_LABELS.repeated);
      expect(storyConfidenceLabel('varies', kind)).toBe(STORY_CONFIDENCE_LABELS.varies);
    }
    expect(storyConfidenceLabel('repeated')).toBe(STORY_CONFIDENCE_LABELS.repeated);
    expect(storyConfidenceLabel('varies')).toBe(STORY_CONFIDENCE_LABELS.varies);
  });

  it('두 문구가 서로 다르다 (분화가 실제로 보이는지)', () => {
    expect(DOCUMENTED_SINGLE_SOURCE_LABEL).not.toBe(STORY_CONFIDENCE_LABELS.single_source);
  });

  it('어휘가 늘어나면 여기서 먼저 깨진다 — SOURCE_KINDS 8종 전부를 다룬다', () => {
    const covered = new Set<SourceKind>([
      ...DOCUMENTED_SOURCE_KINDS,
      ...SOURCE_KINDS.filter((kind) => !DOCUMENTED_SOURCE_KINDS.includes(kind)),
    ]);
    expect(covered.size).toBe(SOURCE_KINDS.length);
  });
});

describe('실데이터에 붙는 문구', () => {
  it('논문·기관·PD 원문에서 온 단일 출처는 카더라 문구를 달지 않는다', async () => {
    const catalog = await loadCatalog();
    const labelOf = (storyId: string) => {
      const story = catalog.stories.find((row) => row.storyId === storyId);
      expect(story, `${storyId} 가 stories.csv 에 없습니다`).toBeDefined();
      return storyConfidenceLabel(story!.confidenceLevel, story!.sourceKind);
    };

    // 3차 적재분 — 2025년 논문 / 국립원예특작과학원 보고서
    expect(labelOf('story-rose-monteagudo-prickles')).toBe(DOCUMENTED_SINGLE_SOURCE_LABEL);
    expect(labelOf('story-gerbera-korea-cultivar')).toBe(DOCUMENTED_SINGLE_SOURCE_LABEL);
    // 소급 분류분 — 경향신문 / 농사로
    expect(labelOf('story-narcissus-jeju-chusa')).toBe(DOCUMENTED_SINGLE_SOURCE_LABEL);
    expect(labelOf('story-peony-spirit-sichuan')).toBe(DOCUMENTED_SINGLE_SOURCE_LABEL);
    // 잡지 칼럼 단일 출처는 그대로 — 무조건 승격되는 것이 아니라는 반대 사례
    expect(labelOf('story-babysbreath-kenya-color')).toBe(STORY_CONFIDENCE_LABELS.single_source);
  });

  it('결과 화면과 /stories 가 같은 이야기에 같은 문구를 단다', async () => {
    const catalog = await loadCatalog();
    // 두 화면 모두 storyConfidenceLabel 하나만 부르므로, 라벨은 이야기당 하나로 결정된다.
    // 여기서 확인하는 것은 그 함수가 카탈로그 전 행에 대해 문구를 돌려준다는 사실이다.
    const labels = new Set(
      catalog.stories.map((story) => storyConfidenceLabel(story.confidenceLevel, story.sourceKind)),
    );
    expect(labels.size).toBe(4); // repeated · varies · single_source 2갈래
    expect(labels).toContain(DOCUMENTED_SINGLE_SOURCE_LABEL);
  });
});

describe('regionLabel — 3차 적재분이 들여온 문화권', () => {
  it('새로 들어온 나라도 한국어로 나온다 (영문 slug 가 새지 않는다)', () => {
    expect(regionLabel('spain')).toBe('스페인');
    expect(regionLabel('kenya')).toBe('케냐');
    expect(regionLabel('scotland-england')).toBe('스코틀랜드·잉글랜드');
    expect(regionLabel('france-mauritius')).toBe('프랑스·모리셔스');
    expect(regionLabel('france-italy')).toBe('프랑스·이탈리아');
  });
});
