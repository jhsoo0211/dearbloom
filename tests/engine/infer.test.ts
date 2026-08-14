import { describe, expect, it } from 'vitest';
import * as engine from '@/lib/engine';
import {
  COLOR_KEYWORDS,
  FLOWER_CUE_PREFIX,
  FLOWER_KEYWORDS,
  TRAIT_KEYWORDS,
  flowerCueSlug,
  inferCuesFromText,
  inferCuesFromTexts,
} from '@/lib/engine/infer';
import { RECIPIENT_TRAITS } from '@/lib/engine/normalize';

/**
 * §1.5j 휴리스틱 테스트.
 * 사전(키워드 → slug)이 실제 어휘와 어긋나지 않는지, 그리고 "못 찾으면 침묵" 원칙이
 * 지켜지는지를 본다. 카탈로그 파일은 읽지 않는다(엔진은 순수 TS).
 */

describe('inferCuesFromText — 성격', () => {
  it('성격 표현을 분위기 태그 slug 로 옮긴다', () => {
    expect(inferCuesFromText('조용한 카페에서 책 읽는 걸 좋아해요').recipientTraits).toEqual([
      'calm',
    ]);
    expect(inferCuesFromText('늘 화려하고 에너지가 넘쳐요').recipientTraits).toEqual(['vivid']);
    expect(inferCuesFromText('아기자기한 소품을 모아요').recipientTraits).toEqual(['cute']);
    expect(inferCuesFromText('단정하고 고급스러운 걸 좋아해요').recipientTraits).toEqual([
      'elegant',
    ]);
    expect(inferCuesFromText('군더더기 없이 깔끔한 사람').recipientTraits).toEqual(['minimal']);
  });

  it('사전의 모든 키워드가 실제로 그 태그를 집어낸다', () => {
    for (const [slug, words] of Object.entries(TRAIT_KEYWORDS)) {
      for (const word of words) {
        expect(inferCuesFromText(`${word} 사람이에요`).recipientTraits).toContain(slug);
      }
    }
  });

  it('사전의 key 는 RECIPIENT_TRAITS 어휘를 그대로 덮는다', () => {
    expect(Object.keys(TRAIT_KEYWORDS).sort()).toEqual([...RECIPIENT_TRAITS].sort());
  });
});

describe('inferCuesFromText — 색', () => {
  it('색 이름을 colors 어휘로 옮긴다', () => {
    expect(inferCuesFromText('흰 옷만 입어요').colorPrefs).toEqual(['white']);
    expect(inferCuesFromText('분홍색을 제일 좋아해요').colorPrefs).toEqual(['pink']);
    expect(inferCuesFromText('빨간 립스틱을 자주 발라요').colorPrefs).toEqual(['red']);
    expect(inferCuesFromText('노란 우산을 들고 다녀요').colorPrefs).toEqual(['yellow']);
    expect(inferCuesFromText('보라색 가방').colorPrefs).toEqual(['purple']);
    expect(inferCuesFromText('파란 하늘을 좋아해요').colorPrefs).toEqual(['blue']);
    expect(inferCuesFromText('크림색 니트').colorPrefs).toEqual(['cream']);
  });

  it('사전의 모든 키워드가 실제로 그 색을 집어낸다', () => {
    for (const [slug, words] of Object.entries(COLOR_KEYWORDS)) {
      for (const word of words) {
        expect(inferCuesFromText(`${word} 계열을 좋아해요`).colorPrefs).toContain(slug);
      }
    }
  });
});

describe('inferCuesFromText — 꽃 이름', () => {
  it('꽃 이름은 personalCues 에 flower: 단서로 담긴다', () => {
    expect(inferCuesFromText('작년 봄에 튤립 축제에 갔어요').personalCues).toEqual([
      'flower:tulip-white',
    ]);
    // 카탈로그의 이름이 `아시아틱 백합` 이어도 '백합' 부분 일치로 걸린다.
    expect(inferCuesFromText('백합 향을 좋아해요').personalCues).toEqual(['flower:lily-asiatic']);
    expect(inferCuesFromText('은방울꽃을 처음 봤던 날').personalCues).toEqual([
      'flower:lily-of-the-valley',
    ]);
  });

  it('사전은 카탈로그 17종을 덮고, 모든 키워드가 그 꽃을 집어낸다', () => {
    expect(Object.keys(FLOWER_KEYWORDS)).toHaveLength(17);
    for (const [slug, words] of Object.entries(FLOWER_KEYWORDS)) {
      for (const word of words) {
        expect(inferCuesFromText(`${word} 기억이 있어요`).personalCues).toContain(
          `${FLOWER_CUE_PREFIX}${slug}`,
        );
      }
    }
  });

  it('flowerCueSlug 는 접두사가 붙은 단서만 되돌린다', () => {
    expect(flowerCueSlug('flower:tulip-white')).toBe('tulip-white');
    expect(flowerCueSlug('조용한 사람')).toBeUndefined();
  });
});

describe('inferCuesFromText — 복합·중복·관용', () => {
  it('성격·색·꽃이 한 문장에 있으면 셋 다 잡는다', () => {
    const cues = inferCuesFromText('차분한 사람인데 흰 튤립을 특히 좋아해요');
    expect(cues.recipientTraits).toEqual(['calm']);
    expect(cues.colorPrefs).toEqual(['white']);
    expect(cues.personalCues).toEqual(['flower:tulip-white']);
  });

  it('같은 단서가 여러 번 나와도 한 번만 담는다', () => {
    const cues = inferCuesFromText('조용하고 차분한 사람. 조용한 카페, 잔잔한 음악.');
    expect(cues.recipientTraits).toEqual(['calm']);
  });

  it('대소문자·공백을 관용한다', () => {
    expect(inferCuesFromText('  차 분한   사람  ').recipientTraits).toEqual(['calm']);
    expect(inferCuesFromText('MINIMAL 한 취향').recipientTraits).toEqual([]);
    expect(inferCuesFromText('심플한 취향').recipientTraits).toEqual(['minimal']);
  });

  it('결과 순서는 사전 선언 순서를 따른다 (입력 순서에 흔들리지 않는다)', () => {
    const a = inferCuesFromText('깔끔하고 차분한 사람');
    const b = inferCuesFromText('차분하고 깔끔한 사람');
    expect(a.recipientTraits).toEqual(['calm', 'minimal']);
    expect(b.recipientTraits).toEqual(['calm', 'minimal']);
  });
});

describe('inferCuesFromText — 빈 문자열·무매칭', () => {
  it('빈 문자열·공백만 있으면 아무것도 돌려주지 않는다', () => {
    const empty = { recipientTraits: [], colorPrefs: [], personalCues: [] };
    expect(inferCuesFromText('')).toEqual(empty);
    expect(inferCuesFromText('   \n\t ')).toEqual(empty);
  });

  it('사전에 없는 말이면 억지로 집어내지 않는다', () => {
    expect(inferCuesFromText('작년에 같이 등산을 갔어요')).toEqual({
      recipientTraits: [],
      colorPrefs: [],
      personalCues: [],
    });
  });
});

describe('inferCuesFromTexts — 여러 덩이 합치기', () => {
  it('두 문장을 각각 훑어 합치고 중복을 지운다', () => {
    const cues = inferCuesFromTexts([
      '조용한 사람이에요',
      '작년 봄 튤립 축제에 갔어요. 조용한 곳이었어요.',
    ]);
    expect(cues.recipientTraits).toEqual(['calm']);
    expect(cues.personalCues).toEqual(['flower:tulip-white']);
  });

  it('문장 경계에서 없던 낱말을 만들지 않는다', () => {
    // 이어 붙였다면 '차' + '분한' → '차분' 이 생겼겠지만, 따로 훑으므로 걸리지 않는다.
    expect(inferCuesFromTexts(['홍차', '분한 일이 있었어요']).recipientTraits).toEqual([]);
  });

  it('빈 배열이면 빈 결과다', () => {
    expect(inferCuesFromTexts([])).toEqual({
      recipientTraits: [],
      colorPrefs: [],
      personalCues: [],
    });
  });
});

describe('엔진 배럴 export', () => {
  it('배럴에서도 그대로 꺼내 쓸 수 있다', () => {
    expect(engine.inferCuesFromText).toBe(inferCuesFromText);
    expect(engine.inferCuesFromTexts).toBe(inferCuesFromTexts);
    expect(engine.FLOWER_KEYWORDS).toBe(FLOWER_KEYWORDS);
  });
});
