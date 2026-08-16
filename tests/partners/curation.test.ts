import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * `/partners` 실존 큐레이션의 **약속**을 지킨다.
 *
 * 이 페이지가 파는 것은 꽃이 아니라 신뢰다. "여기 적힌 곳은 진짜 있고, 눌러서 갈 수 있고,
 * 우리와 이해관계가 없다" — 이 셋이 무너지면 페이지가 있을 이유가 없다.
 * 그래서 무너지기 쉬운 자리만 골라 못을 박는다.
 *
 * ── 왜 소스를 문자열로 읽나 ───────────────────────────────────────────
 * `CURATION` 을 `export` 하면 테스트가 편하지만, Next.js 앱 라우터의 page 파일은
 * 정해진 것 말고 다른 것을 내보내는 자리가 아니다. 데이터를 별도 모듈로 빼는 방법도 있으나
 * 목록이 일곱 줄인데 파일을 하나 더 만들 이유가 없다. 그래서 **소스를 읽어** 검사한다.
 * 대신 정규식이 낡아 아무것도 못 잡는 경우를 대비해, 건수부터 먼저 확인한다.
 *
 * 네트워크로 링크가 살아 있는지 확인하는 것은 여기 없다 — `tests/partners/check-links.mjs`
 * 가 따로 한다. 남의 서버 사정으로 CI 가 빨개지면 안 된다.
 */

const ROOT = path.resolve(__dirname, '../..');
const SOURCE = readFileSync(path.join(ROOT, 'src/app/partners/page.tsx'), 'utf8');
const RESEARCH = readFileSync(path.join(ROOT, 'docs/partners-research.md'), 'utf8');

/**
 * 주석을 걷어낸 본문.
 *
 * ⚠ 이걸 안 하면 검사가 **거꾸로** 선다. 이 페이지의 주석은 "예전에 `밤의 온실` 이라는 가상
 *   상호가 있었고, `구매 링크는 제휴 링크로 연결돼요` 는 이제 사실이 아니라 뺐다" 처럼
 *   **하지 말아야 할 것을 이름으로 적어 두는** 성격이다. 원문을 그대로 훑으면 그 경고문에
 *   걸려 빨간불이 켜지고, 그걸 끄려고 정작 중요한 주석을 지우게 된다.
 *   화면에 나가는 것만 본다.
 */
const PAGE = SOURCE.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(?<!:)\/\/[^\n]*/g, ''); // `https://` 의 `//` 는 건드리지 않는다.

/** `name: '…'` 와 `url: '…'` 이 이웃한 블록 — check-links.mjs 와 같은 규칙으로 뽑는다. */
const ENTRIES = [...PAGE.matchAll(/name:\s*'([^']+)',\s*\n\s*url:\s*'([^']+)'/g)].map((match) => ({
  name: match[1],
  url: match[2],
}));

describe('실존 큐레이션 목록', () => {
  it('추출 자체가 되고 있다 — 갈래별 2~3곳, 시장 카드 1', () => {
    // 0건이면 아래 검사가 전부 공허하게 통과한다. 그 함정을 여기서 막는다.
    expect(ENTRIES.length).toBeGreaterThanOrEqual(6);
  });

  it('모든 링크가 https 다', () => {
    const insecure = ENTRIES.filter((entry) => !entry.url.startsWith('https://'));

    expect(insecure).toEqual([]);
  });

  it('page.tsx 의 링크가 전부 조사 문서에 근거로 남아 있다', () => {
    // 근거 없이 슬쩍 한 줄 끼워 넣는 것을 막는다 — 목록과 원장은 늘 같아야 한다.
    const undocumented = ENTRIES.filter((entry) => !RESEARCH.includes(entry.url));

    expect(undocumented).toEqual([]);
  });
});

describe('링크의 접근성 약속', () => {
  it('갈 곳 없는 링크(href="#")를 만들지 않는다', () => {
    // 낭독기에는 멀쩡한 링크로 읽히고, 누르면 페이지 맨 위로 튄다(P2-11).
    expect(PAGE).not.toContain('href="#"');
  });

  it('새 탭으로 여는 링크는 그 사실을 미리 알린다', () => {
    const opened = [...PAGE.matchAll(/target="_blank"/g)];
    expect(opened.length).toBeGreaterThan(0);

    // 각 target="_blank" 뒤로 같은 <a> 안에서 (새 창) 과 rel 이 나와야 한다.
    for (const match of opened) {
      const tail = PAGE.slice(match.index, match.index + 400);

      expect(tail).toContain('(새 창)');
      expect(tail).toContain('rel="noreferrer"');
    }
  });
});

describe('정직 고지', () => {
  it('제휴 관계가 아니라는 사실을 페이지에 적는다', () => {
    expect(PAGE).toContain('아직 제휴 관계는 아니에요');
  });

  it('있지도 않은 제휴 링크를 있다고 하지 않는다', () => {
    // 예전 고지 "구매 링크는 제휴 링크로 연결돼요" — 지금은 사실이 아니다.
    expect(PAGE).not.toContain('제휴 링크로 연결');
  });

  it('실존 큐레이션을 예시라고 부르지 않는다', () => {
    expect(PAGE).not.toContain('꽃집은 예시');
  });

  it('지어낸 상호가 남아 있지 않다', () => {
    for (const fake of ['밤의 온실', '튤립과 편지', '초저녁 식물상회']) {
      expect(PAGE).not.toContain(fake);
    }
  });
});
