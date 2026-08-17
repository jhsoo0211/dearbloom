import { describe, expect, it } from 'vitest';
import * as engine from '@/lib/engine';
import { loadCatalog } from '@/lib/data/catalog';
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
 * 지켜지는지를 본다.
 *
 * ⚠ 꽃 사전 한 곳만 **카탈로그(content/flowers.csv)를 읽는다.** 엔진은 순수 TS 라 CSV 를
 *   모르고, 그래서 `FLOWER_KEYWORDS` 는 카탈로그의 사본이다 — 사본과 원본이 어긋나는지는
 *   원본을 읽어야만 알 수 있다. 예전에는 `toHaveLength(17)` 이라는 **스냅샷 숫자**로
 *   대신했는데, 카탈로그가 32종으로 늘어난 뒤에도 그 단언은 그대로 초록이었다.
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

  it('사전의 key 는 전부 flowers.csv 에 실존하고, 카탈로그 전종을 덮는다', async () => {
    const catalog = await loadCatalog();
    const catalogIds = catalog.flowers.map((flower) => flower.id).sort();

    // 양방향 불변식 — 없는 꽃을 가리키는 key 도, 사전이 빠뜨린 꽃도 없어야 한다.
    expect(Object.keys(FLOWER_KEYWORDS).sort()).toEqual(catalogIds);
  });

  it('모든 키워드가 그 꽃을 집어내고, 다른 꽃을 함께 끌고 오지 않는다', () => {
    for (const [slug, words] of Object.entries(FLOWER_KEYWORDS)) {
      for (const word of words) {
        // 별칭이 다른 꽃의 이름을 품으면(`삼색제비꽃` → 팬지 + 제비꽃) 단서가 둘이 된다.
        expect(inferCuesFromText(`${word} 기억이 있어요`).personalCues).toEqual([
          `${FLOWER_CUE_PREFIX}${slug}`,
        ]);
      }
    }
  });

  /**
   * 최장일치 (2026-08-17) — 이 describe 가 없던 시절의 부채를 못 박는다.
   *
   * 부분 일치 사전이라 `수레국화` 한 낱말이 수레국화와 국화를 함께 걸었고, 그래서
   * 수레국화의 **표준명이 사전에 없었다**(팬지의 `삼색제비꽃` 도 같은 이유로 빠져 있었다).
   * 이제 `matchKeys` 가 덮인 자리를 버리므로 둘 다 실린다.
   */
  describe('긴 이름이 짧은 이름을 품어도 단서는 하나다', () => {
    it('수레국화는 수레국화만 건다 (국화를 함께 끌고 오지 않는다)', () => {
      expect(inferCuesFromText('수레국화를 좋아하는 사람이에요').personalCues).toEqual([
        'flower:cornflower',
      ]);
    });

    it('삼색제비꽃은 팬지만 건다 (제비꽃을 함께 끌고 오지 않는다)', () => {
      expect(inferCuesFromText('삼색제비꽃 화분을 키워요').personalCues).toEqual([
        'flower:pansy',
      ]);
    });

    it('둘을 다 말하면 단서도 둘이다 (덮인 자리만 버리지, 낱말을 지우지 않는다)', () => {
      // 국화는 덮이지 않은 자리를 따로 가지므로 살아남는다 — 사람이 둘 다 말했으니까.
      const cues = inferCuesFromText('수레국화도 국화도 좋아해요').personalCues;
      expect(cues).toContain('flower:cornflower');
      expect(cues).toContain('flower:chrysanthemum');
      expect(cues).toHaveLength(2);
    });

    it('짧은 이름만 말하면 그 꽃만 걸린다 (최장일치가 짧은 쪽을 삼키지 않는다)', () => {
      expect(inferCuesFromText('국화 향을 좋아해요').personalCues).toEqual([
        'flower:chrysanthemum',
      ]);
      expect(inferCuesFromText('제비꽃을 처음 봤어요').personalCues).toEqual(['flower:violet']);
    });

    it('같은 꽃의 별칭끼리는 서로를 삼키지 않는다 (`은방울` ⊂ `은방울꽃`)', () => {
      expect(inferCuesFromText('은방울꽃').personalCues).toEqual(['flower:lily-of-the-valley']);
      expect(inferCuesFromText('은방울').personalCues).toEqual(['flower:lily-of-the-valley']);
    });
  });

  /**
   * 확장 배치 2(2026-08-17)에서 **일부러 사전에 넣지 않은 낱말**들.
   *
   * 위 `모든 키워드가 …` 테스트는 사전에 있는 낱말만 돈다 — 빠뜨린 이유는 지켜 주지 않는다.
   * 여기서 못 박아 두지 않으면 다음 배치에서 "이름이 빠졌네" 하고 조용히 되살아난다.
   */
  describe('겹치는 이름은 넣지 않는다 — 확장 배치 2', () => {
    it('한국어 어미 `-치자` 를 치자꽃으로 읽지 않는다', () => {
      expect(inferCuesFromText('같이 고치자고 했어요').personalCues).toEqual([]);
      expect(inferCuesFromText('치자꽃 향이 진했어요').personalCues).toEqual(['flower:gardenia']);
    });

    it('철쭉은 진달래가 아니고, 매실은 매화가 아니다', () => {
      expect(inferCuesFromText('철쭉이 흐드러진 산').personalCues).toEqual([]);
      expect(inferCuesFromText('매실청을 담갔어요').personalCues).toEqual([]);
      expect(inferCuesFromText('진달래가 먼저 피었어요').personalCues).toEqual(['flower:azalea']);
      expect(inferCuesFromText('매화 가지를 꽂아 두었어요').personalCues).toEqual([
        'flower:plum-blossom',
      ]);
    });

    it('목화와 국화는 서로를 건드리지 않는다', () => {
      expect(inferCuesFromText('목화솜 이불').personalCues).toEqual(['flower:cotton']);
      expect(inferCuesFromText('국화차를 마셨어요').personalCues).toEqual([
        'flower:chrysanthemum',
      ]);
    });
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
