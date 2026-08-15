/**
 * 비밀 편지 — 편지 한 통의 **모양과 상한**을 정하는 단일 원본.
 *
 * ── 이 기능이 다른 화면과 다른 점 (읽고 시작하라) ────────────────────
 * dearbloom 의 자유 서술(§1.5j "적어주신 이야기는 추천과 멘트에만 쓰고, 저장하지 않아요")은
 * **무저장이 원칙**이다. 편지는 그 원칙의 예외가 아니라 **다른 물건**이다 — 추천을 받으려고
 * 흘려 적는 메모가 아니라, 남기려고 쓰는 글이고 사용자가 "저장"을 눌러 만든 결과물이다.
 * 그래서 편지는 저장한다. 대신 그 사실을 화면이 감추지 않는다(`store.ts` 머리말과
 * 스튜디오 안내 한 줄이 같은 말을 한다).
 *
 * ── 화면에서 부르는 이름 ─────────────────────────────────────────────
 * 코드에서는 `code`(인증번호)라고 부르지만 **화면에서는 언제나 "편지 번호"** 다(§1.5d —
 * 사무 어휘 금지). 라벨을 새로 짓지 마라.
 *
 * 순수 데이터·순수 함수만 둔다(React·fs·localStorage 의존 금지) —
 * 서버 컴포넌트·클라이언트 컴포넌트·테스트가 같은 파일을 읽는다.
 */

import { z } from 'zod';

/* ------------------------------------------------------------------ *
 * 색감 테마
 * ------------------------------------------------------------------ */

/**
 * 편지의 색감 5계열.
 *
 * 어휘는 **새로 만들지 않았다** — `/stories` 필터 칩과 도감의 계열(§1.4c v3.2,
 * `components/stories/categories.ts` 의 `StoryCategoryKey`)과 같은 다섯 값이다.
 * 그런데도 여기에 다시 적는 이유는 층 때문이다: `src/lib` 은 `src/components` 를
 * import 하지 않는다(반대 방향이 이 저장소의 규칙이다). 두 벌이 어긋나는 사고는
 * `tests/letters/types.test.ts` 가 두 목록을 맞대어 막는다 —
 * **한쪽만 고치면 테스트가 먼저 깨진다.**
 *
 * 한국어 표기(숲빛·상아빛·금빛·와인빛·보랏빛)는 `storyCategoryLabel()` 이 갖는다.
 * 여기서 라벨을 다시 짓지 마라.
 */
export const LETTER_THEMES = ['forest', 'ivory', 'gold', 'wine', 'dusk'] as const;

export type LetterTheme = (typeof LETTER_THEMES)[number];

/** 고르지 않았을 때의 기본 색감. 편지지는 어느 계열이든 아이보리 종이라 가장 중립적인 값이다. */
export const DEFAULT_LETTER_THEME: LetterTheme = 'ivory';

/* ------------------------------------------------------------------ *
 * 길이 상한
 * ------------------------------------------------------------------ */

/**
 * 글자 수 상한 — **화면 `maxLength` 와 스키마가 같은 값을 본다.**
 *
 * 입력칸이 막아 주는 것은 붙여넣기까지가 한계라, 상한은 스키마에도 반드시 있어야 한다
 * (플로우의 `INTENT_DETAIL_MAX_CHARS` 가 화면·서버·계약을 한 값으로 묶은 것과 같은 규율).
 */
export const LETTER_LIMITS = {
  recipientName: 20,
  title: 30,
  body: 1000,
  signature: 20,
  codeMin: 4,
  codeMax: 8,
} as const;

/* ------------------------------------------------------------------ *
 * 편지 번호
 * ------------------------------------------------------------------ */

/**
 * 편지 번호에 쓰는 글자 — **헷갈리는 넷을 뺐다**(`I` `L` `O` `0` `1`).
 *
 * 이 번호는 화면에서 읽어 입으로 전하거나 메시지로 옮겨 적는 값이다. `0`/`O`,
 * `1`/`I`/`L` 이 섞이면 "한 글자씩 다시 봐 주세요" 라는 안내가 사용자 잘못이 아닌 일로
 * 반복된다. 자릿수(31^6 ≈ 8.9억)는 그 넷을 뺀 뒤에도 충분하다.
 */
export const LETTER_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** 번호 형식. 상한 상수에서 만들어 두 곳이 어긋날 자리를 없앤다. */
export const LETTER_CODE_PATTERN = new RegExp(
  `^[A-Z0-9]{${LETTER_LIMITS.codeMin},${LETTER_LIMITS.codeMax}}$`,
);

/**
 * 입력받은 번호를 **대조에 쓰는 한 가지 모양**으로 만든다.
 * 앞뒤 공백을 털고 대문자로 세운다 — 사람이 소문자로 적어 와도 같은 편지를 연다.
 */
export function normalizeLetterCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/* ------------------------------------------------------------------ *
 * 스키마
 * ------------------------------------------------------------------ */

export const letterThemeSchema = z.enum(LETTER_THEMES);

export const recipientNameSchema = z
  .string()
  .trim()
  .min(1, { error: '받는 분의 이름을 적어 주세요.' })
  .max(LETTER_LIMITS.recipientName, {
    error: `받는 분 이름은 ${LETTER_LIMITS.recipientName}자까지 적을 수 있어요.`,
  });

/** 제목은 선택이다 — 비워 두면 편지지에 제목 줄이 서지 않는다. */
export const letterTitleSchema = z.string().trim().max(LETTER_LIMITS.title, {
  error: `편지 제목은 ${LETTER_LIMITS.title}자까지 적을 수 있어요.`,
});

export const letterBodySchema = z
  .string()
  .trim()
  .min(1, { error: '편지 내용을 적어 주세요.' })
  .max(LETTER_LIMITS.body, {
    error: `편지 내용은 ${LETTER_LIMITS.body}자까지 담을 수 있어요.`,
  });

export const letterSignatureSchema = z
  .string()
  .trim()
  .min(1, { error: '보내는 분의 이름을 적어 주세요.' })
  .max(LETTER_LIMITS.signature, {
    error: `보내는 분 이름은 ${LETTER_LIMITS.signature}자까지 적을 수 있어요.`,
  });

/** 꽃 id 는 카탈로그가 정한다 — 여기서는 비어 있지만 않으면 통과시키고, 화면이 목록에서 고르게 한다. */
export const letterFlowerIdSchema = z
  .string()
  .trim()
  .min(1, { error: '함께 보낼 꽃을 한 송이 골라 주세요.' });

/**
 * 편지 번호.
 *
 * `.toUpperCase()` 를 검사 **앞**에 두어 소문자로 적어 온 번호도 같은 값이 된다
 * (`normalizeLetterCode` 와 같은 규칙 — 대조하는 쪽은 스키마를 지난 값만 본다).
 */
export const letterCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(LETTER_CODE_PATTERN, {
    error: `편지 번호는 영문과 숫자로 ${LETTER_LIMITS.codeMin}~${LETTER_LIMITS.codeMax}자예요.`,
  });

/** 저장 시각 — ISO 문자열. 엔진의 날짜 스키마와 같은 판정을 쓴다(해요체 메시지 포함). */
const isoDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: '날짜를 읽지 못했어요.',
});

/**
 * 편지의 내용 — 번호(`code`)와 식별자(`id`)를 뺀 나머지.
 * 스튜디오 폼이 그대로 이 모양을 만든다.
 */
export const letterContentSchema = z.object({
  recipientName: recipientNameSchema,
  // 빈 문자열은 **없는 것으로 접는다.** 저장소에 `title: ''` 이 남으면 화면이
  // "제목 없음" 과 "빈 제목" 두 상태를 구분해야 한다 — 구분할 이유가 없는 구분이다.
  // ⚠ `.optional()` 이 **바깥**에 있어야 키 자체가 선택이 된다(안쪽에 두면 타입이
  //   `title: string | undefined` 가 되어 부르는 쪽이 매번 `title: undefined` 를 적어야 한다).
  title: letterTitleSchema.transform((value) => (value ? value : undefined)).optional(),
  body: letterBodySchema,
  flowerId: letterFlowerIdSchema,
  theme: letterThemeSchema,
  signature: letterSignatureSchema,
});

export type LetterContent = z.infer<typeof letterContentSchema>;

/** 저장된 편지 한 통. 번호는 여기 없다 — 번호는 저장소가 `codeHash` 로 따로 든다. */
export const letterSchema = letterContentSchema.extend({
  id: z.string().min(1),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export type Letter = z.infer<typeof letterSchema>;

/* ------------------------------------------------------------------ *
 * 번호·식별자 만들기
 * ------------------------------------------------------------------ */

/**
 * `[0, max)` 의 정수 하나. 암호 난수를 쓰되 **모듈로 편향을 버림으로 없앤다**.
 *
 * 편지 번호는 남이 맞혀서는 안 되는 값이라 `Math.random()` 을 기본으로 두지 않는다.
 * `crypto` 가 없는 오래된 환경에서는 `Math.random()` 으로 떨어지되, 그때도 번호의
 * 모양(길이·글자)은 같다 — 화면이 갈라지지 않는다.
 */
function secureRandomInt(max: number): number {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.getRandomValues) {
    // 256 을 max 로 나눈 나머지 구간은 버린다(그 구간을 그대로 쓰면 앞 글자가 더 자주 나온다).
    const ceiling = Math.floor(256 / max) * max;
    const buffer = new Uint8Array(1);
    for (let guard = 0; guard < 64; guard += 1) {
      cryptoRef.getRandomValues(buffer);
      const value = buffer[0] ?? 0;
      if (value < ceiling) return value % max;
    }
  }
  return Math.floor(Math.random() * max);
}

/**
 * 편지 번호를 만들어 준다(스튜디오의 `만들어 줘` 버튼).
 *
 * @param length 자릿수. 상한 밖 값은 4~8 안으로 끌어당긴다 — 만들어 준 번호가
 *               스키마에서 떨어지는 일은 있어서는 안 된다.
 * @param randomInt 테스트가 난수를 고정할 때만 넘긴다.
 */
export function createLetterCode(
  length: number = 6,
  randomInt: (max: number) => number = secureRandomInt,
): string {
  const size = Math.min(
    LETTER_LIMITS.codeMax,
    Math.max(LETTER_LIMITS.codeMin, Math.floor(length) || LETTER_LIMITS.codeMin),
  );
  let code = '';
  for (let i = 0; i < size; i += 1) {
    const index = randomInt(LETTER_CODE_ALPHABET.length) % LETTER_CODE_ALPHABET.length;
    code += LETTER_CODE_ALPHABET.charAt(Math.abs(index));
  }
  return code;
}

/**
 * 편지 한 통의 식별자. `crypto.randomUUID()` 가 있으면 그것을 쓰고,
 * 없으면 시각 + 난수로 만든다(같은 기기 안에서만 유일하면 되는 값이다).
 */
export function createLetterId(): string {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.randomUUID) return cryptoRef.randomUUID();
  const tail = createLetterCode(8, secureRandomInt).toLowerCase();
  return `letter-${Date.now().toString(36)}-${tail}`;
}
