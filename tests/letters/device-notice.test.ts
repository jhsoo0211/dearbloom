import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  LETTER_DEVICE_NOTICE,
  LETTER_DEVICE_NOTICE_TEXT,
  LETTER_LIST_EMPTY,
  LETTER_SAVED_KEPT_CODE,
  LETTER_SAVED_LEAD,
  LETTER_STORAGE_COPY,
  LETTER_STORAGE_NOTICE,
  LETTER_STUDIO_NOTICE,
  letterCodeHint,
  type LetterStorageCopy,
} from '@/components/letter/copy';

/**
 * 비밀 편지 — **화면이 말하는 사실**의 회귀 가드 (design-spec §1.5o).
 *
 * 2026-08-17 감사 P0-1: 화면은 "번호를 아는 분만 그 편지를 열 수 있어요" 라고 말했지만,
 * 편지는 만든 사람의 브라우저에만 있어서 받는 사람 기기에서는 **올바른 번호를 넣어도 열리지
 * 않았다.** 게다가 "이 기기에만 남아 있어요" 고지는 `mine.length > 0` 분기 안에 있어서
 * **편지가 없는 사람 = 바로 그 받는 사람에게는 한 번도 보이지 않았다.** 실패 문구는 오타를
 * 의심시켰고 다섯 번 어긋나면 20초를 기다리게 했다.
 *
 * ── 이제 사실이 두 단계다 ────────────────────────────────────────────
 * 편지가 어디에 남는지는 배포마다 다르다(`LETTER_STORAGE_MODE`). 그래서 문구도 두 벌이고,
 * **두 벌을 각각 잰다** — 한 벌의 문장이 다른 벌로 새어 들어가는 것이 이 파일이 막는 새 사고다.
 *   device — 기기 제약을 말한다. 과잉 약속("번호만 알면 열려요")이 다시 들어오면 안 된다.
 *   server — 어디서든 열린다는 사실과, **번호를 우리가 남기지 않는다**는 사실을 말한다.
 *            대신 '이 기기에서만' 류의 옛말이 남아 있으면 안 된다.
 *
 * ── 여기서 지킬 수 있는 것과 없는 것 ────────────────────────────────
 * 실제 렌더는 브라우저가 있어야 보인다(그건 Playwright 가 한다). 이 파일이 막는 것은
 * **문장과 자리가 되돌아가는 순간**이다. 무너질 수 있는 자리는 넷이고 넷 다 잡힌다:
 *   ① 그 벌에서 거짓인 주장이 다시 들어오는 것
 *   ② 고지가 `mine.length` 분기 안으로 되돌아가는 것(그 자리는 수신자에게만 안 보인다)
 *   ③ 고지가 번호 칸 **아래**로 내려가는 것 — 시도한 뒤에 읽히면 늦다
 *   ④ 실패·잠금 문구가 다시 오타만 의심시키는 것
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

const SOURCES: Array<[name: string, source: string]> = [
  ['LetterEntrance.tsx', entrance],
  ['LetterStudio.tsx', studio],
  ['app/letter/page.tsx', letterPage],
  ['app/letter/studio/page.tsx', studioPage],
];

/** 한 벌이 화면에 내보내는 문장 전부. 하나라도 빠지면 그 문장만 몰래 옛말을 하게 된다. */
function sentencesOf(copy: LetterStorageCopy): Array<[label: string, text: string]> {
  return [
    ['고지(강조)', copy.notice.lead],
    ['고지(본문)', copy.notice.body],
    ['고지(한 문장)', copy.noticeText],
    ['열기 리드', copy.openLead],
    ['못 찾음', copy.notFound],
    ['기다림(앞)', copy.wait.lead],
    ['기다림(뒤)', copy.wait.tail],
    ['목록 각주', copy.listNote],
    ['저장 완료 각주', copy.savedNote],
    ['번호 유지 안내', copy.codeKeepHint],
  ];
}

/** 어느 벌에도 매이지 않는 문장들. 두 배포가 같은 말을 하는 자리다. */
const SHARED: Array<[label: string, text: string]> = [
  ['빈 목록', LETTER_LIST_EMPTY],
  ['스튜디오 안내(강조)', LETTER_STUDIO_NOTICE.strong],
  ['스튜디오 안내(본문)', LETTER_STUDIO_NOTICE.body],
  ['저장 완료 리드', LETTER_SAVED_LEAD],
  ['번호 그대로 둠', LETTER_SAVED_KEPT_CODE],
  ['번호 칸 안내', letterCodeHint(4, 12)],
];

/**
 * **device 벌에서** 사실이 아닌 약속들.
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

/**
 * **server 벌에서** 사실이 아닌 옛말들.
 *
 * 서버에 남는 편지는 번호만 맞으면 어느 기기에서든 열린다. 기기를 탓하는 문장이 남아 있으면
 * 사람은 열리는 편지를 앞에 두고 "내 기기라서 안 열리나 보다" 하고 돌아간다.
 * ⚠ 목록이 이 브라우저의 것이라는 말은 **다른 사실**이라 걸리지 않는다(목록 ≠ 편지).
 */
const DEVICE_ONLY_CLAIMS: Array<[label: string, pattern: RegExp]> = [
  ['이 기기에서만 열린다', /기기에서만/],
  ['다른 기기에서는 아직', /다른\s*기기/],
  ['이 기기에서 쓴 편지뿐', /이\s*기기에서\s*쓴/],
];

/** 화면 문구에 내려오면 안 되는 개발 어휘(§1.5d). `브라우저 저장소` 까지가 지금의 결이다. */
const DEV_WORDS = ['localStorage', 'localstorage', 'Supabase', 'API', 'JSON', '캐시', '스토리지'];

/** 해요체 — 마침표·물음표·느낌표까지만 허용한다("…주시겠어요?" 도 해요체다). */
const POLITE_ENDING = /요[.?!]?$/;

/* ------------------------------------------------------------------ *
 * 1. 두 벌이 함께 지키는 것
 * ------------------------------------------------------------------ */

describe.each([
  ['device', LETTER_STORAGE_COPY.device],
  ['server', LETTER_STORAGE_COPY.server],
] as const)('편지 문구 — %s 벌', (mode, copy) => {
  const sentences = [...sentencesOf(copy), ...SHARED];

  it('해요체를 지키고 개발 어휘를 들이지 않는다 (§1.5d)', () => {
    for (const [label, text] of sentences) {
      expect(POLITE_ENDING.test(text.trimEnd()), `${mode}/${label}: ${text}`).toBe(true);
      for (const word of DEV_WORDS) {
        expect(text.includes(word), `${mode}/${label} 에 개발 어휘 "${word}"`).toBe(false);
      }
    }
  });

  it('고지가 강조 한 줄 + 본문 두 토막이고, 이어 붙인 문장이 그 둘과 같다', () => {
    expect(copy.notice.lead.length).toBeGreaterThan(0);
    expect(copy.notice.body.length).toBeGreaterThan(0);
    expect(copy.noticeText).toBe(`${copy.notice.lead} ${copy.notice.body}`);
  });

  it('실패 문구가 번호를 다시 보라고 권한다 — 정말 오타인 경우가 가장 흔하다', () => {
    expect(copy.notFound).toContain('번호를 한 번 더');
  });

  it('고쳐 쓸 때 번호를 비워 두면 그대로라고 말한다', () => {
    expect(copy.codeKeepHint).toContain('그대로');
  });
});

/* ------------------------------------------------------------------ *
 * 2. device 벌 — 과잉 약속이 다시 들어오지 않는다
 * ------------------------------------------------------------------ */

describe('device 벌 — 편지가 그 브라우저에만 남는 배포', () => {
  const copy = LETTER_STORAGE_COPY.device;

  it('기존 고지가 이 벌의 원본으로 남아 있다', () => {
    expect(copy.notice).toBe(LETTER_DEVICE_NOTICE);
    expect(copy.noticeText).toBe(LETTER_DEVICE_NOTICE_TEXT);
  });

  it('과잉 약속이 한 문장도 없다', () => {
    for (const [label, text] of [...sentencesOf(copy), ...SHARED]) {
      for (const [claim, pattern] of OVERPROMISE) {
        expect(pattern.test(text), `${label} 에 "${claim}" 이 들어 있다: ${text}`).toBe(false);
      }
    }
  });

  it('고지가 세 가지를 다 말한다 — 어디에 있고, 그래서 지금 어떻고, 앞으로 어떻게 되는지', () => {
    expect(copy.notice.lead).toContain('기기');
    // 편지가 어디에 있는가
    expect(copy.notice.body).toContain('브라우저');
    // 그래서 다른 기기에서는 지금 어떻게 되는가
    expect(copy.notice.body).toContain('다른 기기');
    expect(copy.notice.body).toContain('아직');
    // 앞으로 어떻게 되는가 (없는 기능을 있다고 말하지 않되, 끝이라고도 하지 않는다)
    expect(copy.notice.body).toContain('준비하고 있어요');
  });

  it('실패 문구가 오타만 의심시키지 않는다', () => {
    expect(copy.notFound).toContain('다른 기기');
  });

  it('20초 잠금 문구도 같은 사실을 담는다', () => {
    // 잠금 자체는 유지한다(무차별 대입을 늦추는 습관). 다만 기다린 뒤에도 열리지 않을 수
    // 있다는 것을 말하지 않으면 기다림이 두 번째 거짓말이 된다.
    expect(`${copy.wait.lead}${copy.wait.tail}`).toContain('다른 기기');
  });

  it('번호를 다시 볼 수 있다고 말한다 — 이 벌에서는 정말 그렇다', () => {
    expect(copy.savedNote).toContain('다시 볼 수 있어요');
  });
});

/* ------------------------------------------------------------------ *
 * 3. server 벌 — 번호는 우리가 남기지 않는다
 * ------------------------------------------------------------------ */

describe('server 벌 — 편지를 우리가 간직하는 배포', () => {
  const copy = LETTER_STORAGE_COPY.server;

  it('기기를 탓하는 옛말이 한 문장도 없다', () => {
    for (const [label, text] of sentencesOf(copy)) {
      for (const [claim, pattern] of DEVICE_ONLY_CLAIMS) {
        expect(pattern.test(text), `${label} 에 "${claim}" 이 남아 있다: ${text}`).toBe(false);
      }
    }
  });

  it('고지가 이 벌에서 가장 무거운 사실을 말한다 — 번호를 남기지 않는다, 적어 두어라', () => {
    // 어디서든 열린다(좋은 소식)와 번호를 되돌려 줄 수 없다(무거운 소식)가 한 자리에 선다.
    expect(copy.notice.lead).toContain('어느 기기에서든');
    expect(copy.notice.body).toContain('번호는 남기지 않아요');
    expect(copy.notice.body).toContain('적어 두세요');
  });

  it('열기 리드가 번호 하나로 열린다고 말한다', () => {
    expect(copy.openLead).toContain('어느 기기에서든');
  });

  it('못 찾음이 기기 대신 진짜 이유(오타·보관 기한)를 말한다', () => {
    expect(copy.notFound).toContain('보관 기한');
  });

  it('목록이 사라지는 것과 편지가 사라지는 것을 갈라 말한다', () => {
    expect(copy.listNote).toContain('이 브라우저에서 쓴 편지만');
    expect(copy.listNote).toContain('번호로 계속 열려요');
  });

  it('저장 완료 각주가 번호를 다시 볼 수 없다고 말한다', () => {
    expect(copy.savedNote).toContain('다시 보여드릴 수 없어요');
    expect(copy.savedNote).toContain('적어 두거나');
  });
});

/* ------------------------------------------------------------------ *
 * 4. 화면 소스 — 문장을 직접 써 넣지 않는다
 * ------------------------------------------------------------------ */

describe('문구 원본', () => {
  it('편지 화면 소스 어디에도 과잉 약속이 남아 있지 않다', () => {
    // 문구를 `copy.ts` 로 모았어도, 컴포넌트나 라우트 페이지에 한 줄을 직접 써 넣으면
    // 위 검사를 우회한다. 소스를 통째로 본다(주석까지 — 주석의 옛말도 다음 사람을 속인다).
    for (const [name, source] of SOURCES) {
      for (const [claim, pattern] of OVERPROMISE) {
        expect(pattern.test(source), `${name} 에 "${claim}" 이 남아 있다`).toBe(false);
      }
    }
  });

  it('화면이 어느 벌의 고지 문장도 직접 써 넣지 않는다', () => {
    // 같은 말을 화면마다 새로 지으면, 배포에 따라 벌이 갈릴 때 어느 하나가 반드시 남는다.
    for (const [name, source] of SOURCES) {
      for (const mode of ['device', 'server'] as const) {
        const { lead } = LETTER_STORAGE_COPY[mode].notice;
        expect(source.includes(lead), `${name} 에 ${mode} 벌 문장이 박혀 있다`).toBe(false);
      }
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

/* ------------------------------------------------------------------ *
 * 5. 고지가 서는 자리 — 편지 유무와 무관하게, 시도하기 전에
 * ------------------------------------------------------------------ */

/** 여는 표식과 닫는 표식 사이. (TSX 는 중괄호 세기가 통하지 않아 표식으로 자른다.) */
function between(source: string, open: string, close: string): string {
  const start = source.indexOf(open);
  const end = source.indexOf(close, start + 1);
  if (start < 0) throw new Error(`소스에 \`${open}\` 이 없다`);
  if (end < 0) throw new Error(`소스에 \`${close}\` 가 없다`);
  return source.slice(start, end);
}

describe('편지 열기 패널 — 저장 방식 고지의 자리', () => {
  const openPanel = between(
    entrance,
    'aria-labelledby="letter-open-title"',
    'aria-labelledby="letter-mine-title"',
  );

  it('고지가 편지 열기 패널 안에 선다', () => {
    expect(openPanel).toContain('LETTER_STORAGE_NOTICE.lead');
    expect(openPanel).toContain('LETTER_STORAGE_NOTICE.body');
  });

  it('편지 유무를 따지는 조건이 그 패널에 아예 없다', () => {
    // 이것이 P0 의 핵심이었다. 목록 상태(`mine`·`loaded`)가 이 패널에 등장하는 순간
    // 고지가 다시 "편지를 가진 사람에게만" 보일 길이 열린다.
    expect(openPanel).not.toContain('mine.length');
    expect(openPanel).not.toContain('loaded ?');
  });

  it('번호 칸보다 **위**에 선다 — 시도한 뒤에 읽히면 늦다', () => {
    expect(openPanel.indexOf('LETTER_STORAGE_NOTICE')).toBeGreaterThan(0);
    expect(openPanel.indexOf('LETTER_STORAGE_NOTICE')).toBeLessThan(
      openPanel.indexOf('<form onSubmit={onOpen}'),
    );
  });

  it('목록 분기는 아래 패널에만 있고, 그 안에 고지가 없다', () => {
    const minePanel = entrance.slice(entrance.indexOf('aria-labelledby="letter-mine-title"'));

    expect(minePanel).toContain('mine.length > 0');
    expect(minePanel).not.toContain('LETTER_STORAGE_NOTICE');
  });

  it('고지 문장은 이 배포가 고른 한 벌이다', () => {
    // 화면이 부르는 이름 하나가 두 벌 중 하나로 이어져 있어야 한다 —
    // 어느 쪽이든 위 §1~3 이 그 벌을 이미 쟀다.
    expect([LETTER_STORAGE_COPY.device.notice, LETTER_STORAGE_COPY.server.notice]).toContain(
      LETTER_STORAGE_NOTICE,
    );
  });
});

/* ------------------------------------------------------------------ *
 * 6. 만드는 쪽 — 번호를 건네기 전에
 * ------------------------------------------------------------------ */

describe('편지 스튜디오 — 번호를 건네기 전에 같은 사실을 읽는다', () => {
  it('폼 맨 위 안내에 저장 방식 고지가 붙어 있다', () => {
    const form = studio.slice(studio.indexOf('<form className={styles.panel}'));
    expect(form).toContain('LETTER_STORAGE_NOTICE.lead');
  });

  it('저장을 마치고 번호를 보여 주는 화면에도 선다', () => {
    // 사람이 번호를 복사해 건네는 순간이 여기다. 여기서 말하지 않으면 만든 사람은
    // 열리지 않을 번호를 건네거나(device) 다시 못 볼 번호를 흘려보낸다(server).
    const saved = between(studio, 'if (saved) {', '/* ── 폼 ─');

    expect(saved).toContain('LETTER_STORAGE_NOTICE.lead');
    expect(saved).toContain('LETTER_STORAGE_NOTICE.body');
    expect(saved.indexOf('LETTER_STORAGE_NOTICE')).toBeGreaterThan(saved.indexOf('saved-code'));
  });

  it('번호를 그대로 둔 저장에는 빈 번호를 크게 세우지 않는다', () => {
    const saved = between(studio, 'if (saved) {', '/* ── 폼 ─');
    expect(saved).toContain("saved.code !== ''");
    expect(saved).toContain('LETTER_SAVED_KEPT_CODE');
  });

  it('고쳐 쓰기에서 번호 칸 아래에 유지 안내가 선다', () => {
    const codeField = studio.slice(studio.indexOf('htmlFor="letter-code"'));
    expect(codeField).toContain('LETTER_CODE_KEEP_HINT');
    // 새 편지에는 서지 않는다 — 그때는 번호가 반드시 있어야 한다.
    expect(codeField).toContain('editingId ?');
  });

  it('라우트 페이지(들어오는 문)도 같은 말을 한다', () => {
    // 화면 안쪽만 정직하고 인트로·메타데이터가 옛말을 하면 같은 거짓말이다.
    expect(letterPage).toContain('LETTER_STORAGE_NOTICE_TEXT');
    expect(studioPage).toContain('LETTER_STORAGE_NOTICE_TEXT');
  });
});
