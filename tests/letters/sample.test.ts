import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { buildLetterFlowers } from '@/components/letter/data';
import { SAMPLE_LETTER, SAMPLE_LETTER_ID } from '@/components/letter/sample';
import { loadCatalog } from '@/lib/data/catalog';
import { createLocalLetterStore, type LetterStorageLike } from '@/lib/letters/store';
import {
  LETTER_LIMITS,
  createLetterId,
  letterContentSchema,
  letterSchema,
} from '@/lib/letters/types';

/**
 * 내장 예시 편지의 그물.
 *
 * 잡고 싶은 것은 셋이다:
 *   · 예시가 **진짜 편지와 같은 모양**인가 — 스키마가 조여지는 날 예시만 몰래 낡아 있으면
 *     "이렇게 열려요" 가 거짓말이 된다(열람 화면은 예시를 특별 취급하지 않는다).
 *   · 꽃이 **카탈로그에 실제로 있는가** — 없는 꽃을 적어 두면 편지지의 액자·꽃말 줄이 통째로
 *     사라진 채 열린다. 그건 예시로 보여 줄 화면이 아니다.
 *   · 예시가 **저장소에 닿지 않는가** — 남의 편지 목록에 우리가 쓴 편지가 끼어드는 일은
 *     이 기능의 약속을 깨는 일이다(`sample.ts` 머리말).
 */

const SRC = new URL('../../src/components/letter/', import.meta.url);
const read = (name: string): string => readFileSync(fileURLToPath(new URL(name, SRC)), 'utf8');

/** localStorage 흉내 — `store.test.ts` 와 같은 모양(우리가 쓰는 셋만). */
function fakeStorage(): LetterStorageLike & { keys(): string[] } {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    keys: () => [...map.keys()],
  };
}

describe('예시 편지의 모양', () => {
  it('진짜 편지와 같은 스키마를 통과한다', () => {
    expect(letterSchema.safeParse(SAMPLE_LETTER).success).toBe(true);
    expect(letterContentSchema.safeParse(SAMPLE_LETTER).success).toBe(true);
  });

  it('폼이 받아 주는 상한 안에 있다 — 사람이 직접 쓸 수 있는 편지다', () => {
    expect(SAMPLE_LETTER.recipientName.length).toBeLessThanOrEqual(LETTER_LIMITS.recipientName);
    expect(SAMPLE_LETTER.title?.length ?? 0).toBeLessThanOrEqual(LETTER_LIMITS.title);
    expect(SAMPLE_LETTER.body.length).toBeLessThanOrEqual(LETTER_LIMITS.body);
    expect(SAMPLE_LETTER.signature.length).toBeLessThanOrEqual(LETTER_LIMITS.signature);
  });

  it('본문은 여섯 줄에서 아홉 줄 사이다 — 편지지 한 장에 앉는 분량', () => {
    const lines = SAMPLE_LETTER.body.split('\n').filter((line) => line.trim() !== '');
    expect(lines.length).toBeGreaterThanOrEqual(6);
    expect(lines.length).toBeLessThanOrEqual(9);
  });

  it('본문 안에서 예시라는 티를 내지 않는다 — 그 말은 열람 화면의 각주가 한다', () => {
    for (const word of ['예시', '샘플', 'sample', '더미', '테스트']) {
      expect(SAMPLE_LETTER.body, word).not.toContain(word);
      expect(SAMPLE_LETTER.title ?? '', word).not.toContain(word);
    }
  });

  it('꽃말을 본문에 그대로 옮겨 적지 않는다 — 꽃말 줄은 편지지 아래에 이미 있다', async () => {
    const catalog = await loadCatalog();
    const flower = buildLetterFlowers(catalog).find(
      (row) => row.flowerId === SAMPLE_LETTER.flowerId,
    );

    expect(flower).toBeDefined();
    expect(SAMPLE_LETTER.body).not.toContain(flower?.meaning);
  });
});

describe('예시 편지가 기대는 데이터', () => {
  it('꽃은 카탈로그에 실제로 있고, 편지지가 그릴 것을 다 갖고 있다', async () => {
    const catalog = await loadCatalog();
    const flower = buildLetterFlowers(catalog).find(
      (row) => row.flowerId === SAMPLE_LETTER.flowerId,
    );

    if (!flower) throw new Error(`${SAMPLE_LETTER.flowerId} 가 카탈로그에 없다`);
    expect(flower.nameKo.length).toBeGreaterThan(0);
    expect(flower.meaning.length).toBeGreaterThan(0);
    expect(flower.photoSrc.startsWith('https://')).toBe(true);
  });
});

describe('예시 편지는 저장소에 닿지 않는다', () => {
  it('예시 모듈이 저장소를 아예 부르지 않는다', () => {
    const source = read('sample.ts');

    // import 도, 그 이름을 스치는 일도 없다. (주석의 경로 언급은 `@/lib/letters/store` 뿐이라
    // 실제 import 문만 본다.)
    expect(source).not.toMatch(/^\s*import[^\n]*letters\/store/m);
    expect(source).not.toContain('createLocalLetterStore');
  });

  it('입구 화면은 편지를 저장하지 않는다 — 저장은 스튜디오의 일이다', () => {
    const source = read('LetterEntrance.tsx');

    expect(source).not.toContain('store.save');
  });

  it('번호를 갖지 않는다 — 번호로 여는 길에 예시가 걸릴 자리가 없다', () => {
    expect(SAMPLE_LETTER).not.toHaveProperty('code');
    expect(SAMPLE_LETTER).not.toHaveProperty('codeHash');
  });

  it('식별자가 저장된 편지와 부딪히지 않는다', () => {
    expect(SAMPLE_LETTER_ID).toBe('sample');
    for (let i = 0; i < 200; i += 1) {
      expect(createLetterId()).not.toBe(SAMPLE_LETTER_ID);
    }
  });

  it('예시를 열어도 저장소에는 한 글자도 쓰이지 않는다', async () => {
    const storage = fakeStorage();
    const store = createLocalLetterStore({ storage });

    // 열람 화면이 예시를 여는 길에는 저장소 호출이 없다. 그 상태를 그대로 재현한다 —
    // 목록은 비어 있고, 예시의 id·이름 어느 쪽으로도 편지가 나오지 않는다.
    expect(await store.list()).toEqual([]);
    expect(await store.get(SAMPLE_LETTER_ID)).toBeNull();
    expect(await store.findByCode('SAMPLE')).toBeNull();
    expect(storage.keys()).toEqual([]);
  });
});
