import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  LETTER_DEVICE_NOTICE,
  LETTER_DEVICE_NOTICE_TEXT,
  LETTER_LIST_EMPTY,
  LETTER_LIST_NOTE,
  LETTER_NOT_FOUND,
  LETTER_OPEN_LEAD,
  LETTER_SAVED_LEAD,
  LETTER_SAVED_NOTE,
  LETTER_STUDIO_NOTICE,
  LETTER_WAIT_NOTE,
  letterCodeHint,
} from '@/components/letter/copy';

/**
 * 비밀 편지 — **기기 저장 단계의 정직함** 회귀 가드 (design-spec §1.5o).
 *
 * 2026-08-17 감사 P0-1: 화면은 "번호를 아는 분만 그 편지를 열 수 있어요" 라고 말했지만,
 * 편지는 만든 사람의 브라우저에만 있어서 받는 사람 기기에서는 **올바른 번호를 넣어도 열리지
 * 않았다.** 게다가 "이 기기에만 남아 있어요" 고지는 `mine.length > 0` 분기 안에 있어서
 * **편지가 없는 사람 = 바로 그 받는 사람에게는 한 번도 보이지 않았다.** 실패 문구는 오타를
 * 의심시켰고 다섯 번 어긋나면 20초를 기다리게 했다.
 *
 * ── 여기서 지킬 수 있는 것과 없는 것 ────────────────────────────────
 * 실제 렌더는 브라우저가 있어야 보인다(그건 Playwright 가 한다). 이 파일이 막는 것은
 * **문장과 자리가 되돌아가는 순간**이다. 무너질 수 있는 자리는 넷이고 넷 다 잡힌다:
 *   ① 과잉 약속이 다시 들어오는 것 — "번호를 아는 분만 열 수 있어요" 류
 *   ② 고지가 `mine.length` 분기 안으로 되돌아가는 것(그 자리는 수신자에게만 안 보인다)
 *   ③ 고지가 번호 칸 **아래**로 내려가는 것 — 시도한 뒤에 읽히면 늦다
 *   ④ 실패·잠금 문구가 다시 오타만 의심시키는 것
 *
 * ⚠ Supabase 저장으로 넘어가는 날 이 테스트는 **먼저 빨개져야 한다.** 여기 적힌 문장이
 *   그날 거짓이 되기 때문이다. 저장소를 갈아 끼우기 전에 `copy.ts` 부터 고쳐라.
 */

const ROOT = path.resolve(__dirname, '../..');

/** 줄바꿈은 파일마다 다를 수 있다 — 검사는 그것과 무관해야 한다. */
function read(relative: string): string {
  return readFileSync(path.join(ROOT, relative), 'utf8').replaceAll('\r\n', '\n');
}

const entrance = read('src/components/letter/LetterEntrance.tsx');
const studio = read('src/components/letter/LetterStudio.tsx');
const letterPage = read('src/app/letter/page.tsx');
const studioPage = read('src/app/letter/studio/page.tsx');

/** 화면에 나가는 문장 전부. 하나라도 빠지면 그 문장만 몰래 옛말을 하게 된다. */
const COPY: Array<[label: string, text: string]> = [
  ['기기 고지(강조)', LETTER_DEVICE_NOTICE.lead],
  ['기기 고지(본문)', LETTER_DEVICE_NOTICE.body],
  ['기기 고지(한 문장)', LETTER_DEVICE_NOTICE_TEXT],
  ['열기 리드', LETTER_OPEN_LEAD],
  ['못 찾음', LETTER_NOT_FOUND],
  ['기다림(앞)', LETTER_WAIT_NOTE.lead],
  ['기다림(뒤)', LETTER_WAIT_NOTE.tail],
  ['목록 각주', LETTER_LIST_NOTE],
  ['빈 목록', LETTER_LIST_EMPTY],
  ['스튜디오 안내(강조)', LETTER_STUDIO_NOTICE.strong],
  ['스튜디오 안내(본문)', LETTER_STUDIO_NOTICE.body],
  ['저장 완료 리드', LETTER_SAVED_LEAD],
  ['저장 완료 각주', LETTER_SAVED_NOTE],
  ['번호 칸 안내', letterCodeHint(4, 10)],
];

/**
 * 지금 단계에서 **사실이 아닌** 약속들.
 *
 * 감사가 인용한 원문 그대로와, 같은 뜻으로 되살아나기 쉬운 변형들. 문장이 아니라 **주장**을
 * 막는 것이라 "번호가 유일한 열쇠" 와 "어디서든 열린다" 두 갈래만 본다.
 * (`어디서든 여는 길은 준비하고 있어요` 는 아직 아니라는 말이라 걸리지 않는다.)
 */
const OVERPROMISE: Array<[label: string, pattern: RegExp]> = [
  ['번호를 아는 사람만 열 수 있다', /번호를\s*아는\s*(분|사람)만/],
  ['이 번호를 아는 분만', /이\s*번호를\s*아는\s*(분|사람)만/],
  ['어디서든 열어볼 수 있다', /어디서든\s*열어(볼|서)/],
  ['어디서든 열 수 있다', /어디서든\s*열\s*수\s*있/],
  ['누구나 어디서나', /어디서나\s*열/],
];

/** 화면 문구에 내려오면 안 되는 개발 어휘(§1.5d). `브라우저 저장소` 까지가 지금의 결이다. */
const DEV_WORDS = ['localStorage', 'localstorage', 'Supabase', 'API', 'JSON', '캐시', '스토리지'];

/* ------------------------------------------------------------------ *
 * 1. 문장 자체
 * ------------------------------------------------------------------ */

describe('편지 문구 — 지금 단계의 사실만 말한다', () => {
  it('과잉 약속이 한 문장도 없다', () => {
    for (const [label, text] of COPY) {
      for (const [claim, pattern] of OVERPROMISE) {
        expect(pattern.test(text), `${label} 에 "${claim}" 이 들어 있다: ${text}`).toBe(false);
      }
    }
  });

  it('편지 화면 소스 어디에도 그 약속이 남아 있지 않다', () => {
    // 문구를 `copy.ts` 로 모았어도, 컴포넌트나 라우트 페이지에 한 줄을 직접 써 넣으면
    // 위 검사를 우회한다. 소스를 통째로 본다(주석까지 — 주석의 옛말도 다음 사람을 속인다).
    const sources: Array<[string, string]> = [
      ['LetterEntrance.tsx', entrance],
      ['LetterStudio.tsx', studio],
      ['app/letter/page.tsx', letterPage],
      ['app/letter/studio/page.tsx', studioPage],
    ];

    for (const [name, source] of sources) {
      for (const [claim, pattern] of OVERPROMISE) {
        expect(pattern.test(source), `${name} 에 "${claim}" 이 남아 있다`).toBe(false);
      }
    }
  });

  it('기기 고지가 세 가지를 다 말한다 — 어디에 있고, 그래서 지금 어떻고, 앞으로 어떻게 되는지', () => {
    expect(LETTER_DEVICE_NOTICE.lead).toContain('기기');
    // 편지가 어디에 있는가
    expect(LETTER_DEVICE_NOTICE.body).toContain('브라우저');
    // 그래서 다른 기기에서는 지금 어떻게 되는가
    expect(LETTER_DEVICE_NOTICE.body).toContain('다른 기기');
    expect(LETTER_DEVICE_NOTICE.body).toContain('아직');
    // 앞으로 어떻게 되는가 (없는 기능을 있다고 말하지 않되, 끝이라고도 하지 않는다)
    expect(LETTER_DEVICE_NOTICE.body).toContain('준비하고 있어요');
  });

  it('실패 문구가 오타만 의심시키지 않는다', () => {
    expect(LETTER_NOT_FOUND).toContain('다른 기기');
    // 번호를 다시 보라는 권유 자체는 남는다 — 정말 오타인 경우가 더 흔하다.
    expect(LETTER_NOT_FOUND).toContain('번호를 한 번 더');
  });

  it('20초 잠금 문구도 같은 사실을 담는다', () => {
    // 잠금 자체는 유지한다(무차별 대입을 늦추는 습관). 다만 기다린 뒤에도 열리지 않을 수
    // 있다는 것을 말하지 않으면 기다림이 두 번째 거짓말이 된다.
    expect(`${LETTER_WAIT_NOTE.lead}${LETTER_WAIT_NOTE.tail}`).toContain('다른 기기');
    expect(entrance).toContain('const MISS_LIMIT = 5');
    expect(entrance).toContain('const WAIT_SECONDS = 20');
  });

  it('해요체를 지키고 개발 어휘를 들이지 않는다 (§1.5d)', () => {
    for (const [label, text] of COPY) {
      expect(text.trimEnd().endsWith('요.') || text.trimEnd().endsWith('요'), label).toBe(true);
      for (const word of DEV_WORDS) {
        expect(text.includes(word), `${label} 에 개발 어휘 "${word}"`).toBe(false);
      }
    }
  });
});

/* ------------------------------------------------------------------ *
 * 2. 고지가 서는 자리 — 편지 유무와 무관하게, 시도하기 전에
 * ------------------------------------------------------------------ */

/** 여는 표식과 닫는 표식 사이. (TSX 는 중괄호 세기가 통하지 않아 표식으로 자른다.) */
function between(source: string, open: string, close: string): string {
  const start = source.indexOf(open);
  const end = source.indexOf(close, start + 1);
  if (start < 0) throw new Error(`소스에 \`${open}\` 이 없다`);
  if (end < 0) throw new Error(`소스에 \`${close}\` 가 없다`);
  return source.slice(start, end);
}

describe('편지 열기 패널 — 기기 고지의 자리', () => {
  const openPanel = between(
    entrance,
    'aria-labelledby="letter-open-title"',
    'aria-labelledby="letter-mine-title"',
  );

  it('고지가 편지 열기 패널 안에 선다', () => {
    expect(openPanel).toContain('LETTER_DEVICE_NOTICE.lead');
    expect(openPanel).toContain('LETTER_DEVICE_NOTICE.body');
  });

  it('편지 유무를 따지는 조건이 그 패널에 아예 없다', () => {
    // 이것이 P0 의 핵심이었다. 목록 상태(`mine`·`loaded`)가 이 패널에 등장하는 순간
    // 고지가 다시 "편지를 가진 사람에게만" 보일 길이 열린다.
    expect(openPanel).not.toContain('mine.length');
    expect(openPanel).not.toContain('loaded ?');
  });

  it('번호 칸보다 **위**에 선다 — 시도한 뒤에 읽히면 늦다', () => {
    expect(openPanel.indexOf('LETTER_DEVICE_NOTICE')).toBeGreaterThan(0);
    expect(openPanel.indexOf('LETTER_DEVICE_NOTICE')).toBeLessThan(
      openPanel.indexOf('<form onSubmit={onOpen}'),
    );
  });

  it('목록 분기는 아래 패널에만 있고, 그 안에 고지가 없다', () => {
    const minePanel = entrance.slice(entrance.indexOf('aria-labelledby="letter-mine-title"'));

    expect(minePanel).toContain('mine.length > 0');
    expect(minePanel).not.toContain('LETTER_DEVICE_NOTICE');
  });
});

/* ------------------------------------------------------------------ *
 * 3. 만드는 쪽 — 번호를 건네기 전에
 * ------------------------------------------------------------------ */

describe('편지 스튜디오 — 번호를 건네기 전에 같은 사실을 읽는다', () => {
  it('폼 맨 위 안내에 기기 고지가 붙어 있다', () => {
    const form = studio.slice(studio.indexOf('<form className={styles.panel}'));
    expect(form).toContain('LETTER_DEVICE_NOTICE.lead');
  });

  it('저장을 마치고 번호를 보여 주는 화면에도 선다', () => {
    // 사람이 번호를 복사해 건네는 순간이 여기다. 여기서 말하지 않으면 만든 사람은
    // 열리지 않을 번호를 건네게 된다.
    const saved = between(studio, 'if (saved) {', '/* ── 폼 ─');

    expect(saved).toContain('LETTER_DEVICE_NOTICE.lead');
    expect(saved).toContain('LETTER_DEVICE_NOTICE.body');
    expect(saved.indexOf('LETTER_DEVICE_NOTICE')).toBeGreaterThan(saved.indexOf('saved-code'));
  });

  it('라우트 페이지(들어오는 문)도 같은 말을 한다', () => {
    // 화면 안쪽만 정직하고 인트로·메타데이터가 옛말을 하면 같은 거짓말이다.
    expect(letterPage).toContain('LETTER_DEVICE_NOTICE_TEXT');
    expect(studioPage).toContain('LETTER_DEVICE_NOTICE_TEXT');
  });
});

/* ------------------------------------------------------------------ *
 * 4. 문구는 한곳에서만 자란다
 * ------------------------------------------------------------------ */

describe('문구 원본', () => {
  it('화면이 기기 고지 문장을 직접 써 넣지 않는다', () => {
    // 같은 말을 화면마다 새로 지으면, Supabase 로 넘어가는 날 어느 하나가 반드시 남는다.
    for (const [name, source] of [
      ['LetterEntrance.tsx', entrance],
      ['LetterStudio.tsx', studio],
      ['app/letter/page.tsx', letterPage],
      ['app/letter/studio/page.tsx', studioPage],
    ] as const) {
      expect(source.includes(LETTER_DEVICE_NOTICE.lead), `${name} 에 문장이 박혀 있다`).toBe(false);
    }
  });

  it('편지 본문을 로그·에러 경로로 흘리지 않는다 (기존 금지선)', () => {
    for (const [name, source] of [
      ['LetterEntrance.tsx', entrance],
      ['LetterStudio.tsx', studio],
    ] as const) {
      expect(/\bconsole\./.test(source), `${name} 에 console 호출`).toBe(false);
    }
  });
});
