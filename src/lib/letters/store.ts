/**
 * 비밀 편지 저장소 — **교체 가능한 포트**와 그 첫 어댑터(localStorage).
 *
 * ── 지금 어디까지 사실인가 (감추지 않는다) ───────────────────────────
 * 이 어댑터는 편지를 **그 브라우저 안에만** 둔다. 그러므로 이 어댑터가 서는 동안에는:
 *   · 번호를 아는 사람이라도 **다른 기기·다른 브라우저에서는 열 수 없다.**
 *   · 브라우저 저장소를 비우면 편지도 사라진다(우리 서버 어디에도 사본이 없다).
 *   · 시크릿 창·저장 차단 환경에서는 아예 저장되지 않는다 —
 *     그때는 조용히 넘어가지 않고 `LetterStorageUnavailableError` 로 화면에 말한다.
 * 화면 문구가 이 사실을 숨기지 않는 것이 이 기능의 유일한 금지선이다.
 *
 * ⚠ **이 어댑터가 언제나 서는 것은 아니다.** Supabase env(`NEXT_PUBLIC_SUPABASE_URL`
 *   ·`NEXT_PUBLIC_SUPABASE_ANON_KEY`)가 채워진 배포에서는 브라우저가 서버 어댑터를
 *   쓴다(`supabase-store.ts` 의 `createLetterStore()`). 화면 문구도 그 두 단계를
 *   나누어 말한다(`components/letter/copy.ts` 의 `LETTER_STORAGE_MODE`).
 *   **호출부(화면)는 어느 쪽인지 묻지 않는다** — 그것이 이 파일이 인터페이스를 먼저
 *   세운 이유다.
 *
 * ── 번호는 왜 `codeHash` 라는 이름을 갖는가 ─────────────────────────
 * 서버 어댑터에서 이 칸은 **해시**다(`db/migrations/0009_letters.sql` — `pgcrypto` 로
 * 심어 두고 서버 함수가 대조한다). 로컬에서는 해시가 지켜 주는 것이 없다(같은 기기에서
 * devtools 로 저장소를 열면 해시든 평문이든 다 보이고, 스튜디오의 `번호 다시 보기` 는
 * 애초에 되돌릴 수 있는 값을 요구한다). 그래서 **로컬은 정규화한 평문을 이 칸에 넣고**,
 * 이름만 서버 어댑터가 물려받을 자리로 둔다. 두 어댑터가 같은 자리를 쓰되 넣는 값이
 * 다르다는 사실을 이름이 아니라 이 주석이 말한다.
 *   ⚠ 서버 어댑터에는 `revealCode()` 가 **없다**(해시는 되돌아가지 않는다).
 *     서버 모드에서 번호는 만든 사람이 적어 두는 값이 된다 — 화면도 그렇게 안내한다.
 *
 * ⚠ 편지 본문은 **어디에도 기록하지 않는다.** 이 파일에 console 호출이 한 줄도 없는 것은
 *   실수가 아니다(에러 메시지에도 본문을 싣지 않는다).
 */

import { z } from 'zod';

import {
  createLetterId,
  letterCodeSchema,
  letterContentSchema,
  letterSchema,
  normalizeLetterCode,
  type Letter,
  type LetterContent,
} from './types';

/* ------------------------------------------------------------------ *
 * 오류
 * ------------------------------------------------------------------ */

/** 저장소가 던지는 모든 오류의 뿌리. 메시지는 그대로 화면에 나가므로 §1.5d 해요체다. */
export class LetterStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LetterStoreError';
  }
}

/** 저장할 자리가 없다(시크릿 창·저장 차단·용량 초과). */
export class LetterStorageUnavailableError extends LetterStoreError {
  constructor(
    message = '이 브라우저에는 편지를 간직해 둘 자리가 없어요. 시크릿 창이라면 평소 쓰는 창에서 다시 적어 주시겠어요?',
  ) {
    super(message);
    this.name = 'LetterStorageUnavailableError';
  }
}

/** 같은 번호를 쓰는 편지가 이미 있다 — 그대로 두면 어느 편지가 열릴지 정해지지 않는다. */
export class LetterCodeTakenError extends LetterStoreError {
  constructor(message = '이 번호는 다른 편지가 쓰고 있어요. 다른 번호로 정해 주시겠어요?') {
    super(message);
    this.name = 'LetterCodeTakenError';
  }
}

/** 고쳐 쓰려는 편지가 없다(다른 기기에서 지웠거나 저장소를 비웠다). */
export class LetterNotFoundError extends LetterStoreError {
  constructor(message = '고쳐 쓰려던 편지를 찾지 못했어요. 목록에서 다시 골라 주시겠어요?') {
    super(message);
    this.name = 'LetterNotFoundError';
  }
}

/* ------------------------------------------------------------------ *
 * 포트
 * ------------------------------------------------------------------ */

/** 저장소가 실제로 들고 있는 한 줄 — 편지 + 번호 칸. */
export interface StoredLetter extends Letter {
  /** 위 머리말 참고: 로컬은 정규화한 평문, 서버는 해시. */
  codeHash: string;
}

/**
 * `save()` 의 입력. `id` 가 있으면 고쳐 쓰기, 없으면 새 편지다.
 *
 * `code` 는 사용자가 정하거나 `createLetterCode()` 가 만들어 준 **평문** 번호다.
 * 고쳐 쓸 때(`id` 있음)만 **빈 문자열**이 뜻을 갖는다 — "번호는 그대로 두세요".
 * 서버 어댑터에는 `revealCode()` 가 없어 고쳐 쓰기 화면이 번호를 채워 넣을 수 없는데,
 * 그때 번호를 다시 적으라고 요구하면 **적어 두지 않은 사람은 편지를 고칠 수 없게 된다.**
 * 두 어댑터가 같은 규칙을 쓴다(서버 쪽은 `p_code = null` 로 넘어간다).
 * 새 편지에는 여전히 번호가 있어야 한다 — 번호 없는 편지는 열 길이 없다.
 */
export interface SaveLetterInput extends LetterContent {
  id?: string;
  code: string;
}

/**
 * 편지 저장소 포트.
 *
 * 전부 `Promise` 를 돌려준다 — localStorage 는 동기지만 **다음 어댑터(Supabase)는
 * 네트워크**다. 동기 인터페이스로 시작하면 갈아 끼우는 날 화면을 전부 고쳐야 한다.
 */
export interface LetterStore {
  /** 내가 만든 편지 — 최근에 고친 것부터. */
  list(): Promise<Letter[]>;
  get(id: string): Promise<Letter | null>;
  /** 새로 쓰거나 고쳐 쓴다. 검증에 걸리면 zod 오류가, 규칙에 걸리면 위 오류가 나간다. */
  save(input: SaveLetterInput): Promise<Letter>;
  /** 지웠으면 true, 그런 편지가 없었으면 false. */
  remove(id: string): Promise<boolean>;
  /** 번호로 편지 한 통을 찾는다. 못 찾으면 null(왜 못 찾았는지는 말하지 않는다). */
  findByCode(code: string): Promise<Letter | null>;
  /**
   * 번호 다시 보기 — **로컬 어댑터에만 있다.**
   * 서버 어댑터는 해시만 갖고 있어 구현할 수 없다(그래서 선택 메서드다).
   * 화면은 이 메서드가 없으면 `번호 다시 보기` 버튼 자체를 세우지 않는다.
   */
  revealCode?(id: string): Promise<string | null>;
}

/* ------------------------------------------------------------------ *
 * localStorage 어댑터
 * ------------------------------------------------------------------ */

/**
 * 저장 키 — **버전이 이름에 박혀 있다.**
 * 편지의 모양이 바뀌는 날 `…v2` 를 새로 쓰고, 옮길지 버릴지는 그때 정한다.
 * (지금 v1 을 읽다가 모양이 안 맞는 줄은 아래 `readAll` 이 조용히 버린다.)
 */
export const LETTER_STORAGE_KEY = 'dearbloom.letters.v1';

/** localStorage 에서 우리가 쓰는 만큼만 추린 모양(테스트가 가짜를 끼울 수 있게). */
export interface LetterStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * 이 브라우저에 저장할 자리가 있는가.
 *
 * `typeof window` 만 보고 넘어가지 않는다 — Safari 의 저장 차단, 꽉 찬 저장소는
 * **읽을 때가 아니라 쓸 때** 던진다. 그래서 실제로 한 번 써 보고 지운다.
 */
export function resolveBrowserStorage(): LetterStorageLike | null {
  try {
    if (typeof window === 'undefined') return null;
    const storage = window.localStorage;
    if (!storage) return null;
    const probe = `${LETTER_STORAGE_KEY}.probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export interface LocalLetterStoreOptions {
  /**
   * 쓸 저장소.
   *   · 넘기지 않으면 **부를 때마다** 브라우저에서 찾는다(서버 렌더 중에 만들어 둔
   *     저장소가 하이드레이션 뒤에 그대로 동작하는 이유다).
   *   · `null` 을 명시하면 "저장 불가 환경" 이다(테스트가 쓰는 길).
   */
  storage?: LetterStorageLike | null;
  /** 시각을 고정할 때만(테스트). */
  now?: () => Date;
  /** 식별자를 고정할 때만(테스트). */
  newId?: () => string;
}

/** 저장소에 들어가는 한 줄의 모양. 손상된 줄을 걸러 내는 그물이기도 하다. */
const storedLetterSchema = letterSchema.extend({
  codeHash: z.string().min(1),
});

/** 저장소 파일 전체의 모양. `version` 은 키의 v1 과 짝이다. */
interface LetterFile {
  version: 1;
  letters: unknown[];
}

/**
 * 로컬 번호 대조값.
 *
 * 로컬에서는 해시가 아무것도 지켜 주지 못하므로(머리말) **정규화한 평문**이다.
 * 대조 규칙을 이 함수 하나로 좁혀 두어, 서버 어댑터가 이 자리만 갈아 끼우면 되게 한다.
 */
export function localCodeDigest(code: string): string {
  return normalizeLetterCode(code);
}

/**
 * 저장소가 들고 있는 줄 → 화면에 나가는 편지.
 *
 * 나머지 연산(`...row`)으로 번호 칸만 떼지 않고 **실을 것을 하나씩 적는다.** 저장소 줄에
 * 칸이 늘어나는 날(서버 어댑터의 `openedAt`·`expiresAt` 같은) 그 값이 조용히 화면 쪽으로
 * 새어 나가지 않게 하려는 것이다 — 나가는 것은 여기 적힌 것뿐이다.
 */
function toLetter(row: StoredLetter): Letter {
  return {
    id: row.id,
    recipientName: row.recipientName,
    ...(row.title ? { title: row.title } : {}),
    body: row.body,
    flowerId: row.flowerId,
    theme: row.theme,
    signature: row.signature,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createLocalLetterStore(options: LocalLetterStoreOptions = {}): LetterStore {
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? createLetterId;

  const resolve = (): LetterStorageLike | null =>
    options.storage !== undefined ? options.storage : resolveBrowserStorage();

  /**
   * 저장된 편지 전부.
   *
   * 깨진 JSON·모양이 어긋난 줄은 **조용히 버린다**(예외로 올리지 않는다). 한 줄이
   * 상했다고 나머지 편지까지 못 열게 만드는 것이 더 나쁜 실패라서다. 대신 버린 줄을
   * 다시 쓰지 않는다 — 저장소를 덮어쓰는 것은 `save`·`remove` 뿐이다.
   */
  function readAll(storage: LetterStorageLike): StoredLetter[] {
    let raw: string | null = null;
    try {
      raw = storage.getItem(LETTER_STORAGE_KEY);
    } catch {
      return [];
    }
    if (!raw) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }

    const rows = (parsed as Partial<LetterFile> | null)?.letters;
    if (!Array.isArray(rows)) return [];

    const letters: StoredLetter[] = [];
    for (const row of rows) {
      const result = storedLetterSchema.safeParse(row);
      if (result.success) letters.push(result.data);
    }
    return letters;
  }

  function writeAll(storage: LetterStorageLike, letters: StoredLetter[]): void {
    const file: LetterFile = { version: 1, letters };
    try {
      storage.setItem(LETTER_STORAGE_KEY, JSON.stringify(file));
    } catch {
      // 용량 초과·저장 차단. 어느 쪽이든 사용자가 할 수 있는 일은 같으므로 한 문장으로 말한다.
      throw new LetterStorageUnavailableError();
    }
  }

  /** 최근에 고친 편지가 위로. 같은 시각이면 만든 순서를 지킨다(목록이 흔들리지 않게). */
  function sorted(letters: StoredLetter[]): StoredLetter[] {
    return [...letters].sort((a, b) => {
      const diff = Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      if (diff !== 0) return diff;
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  }

  return {
    async list(): Promise<Letter[]> {
      const storage = resolve();
      if (!storage) return [];
      return sorted(readAll(storage)).map(toLetter);
    },

    async get(id: string): Promise<Letter | null> {
      const storage = resolve();
      if (!storage) return null;
      const row = readAll(storage).find((letter) => letter.id === id);
      return row ? toLetter(row) : null;
    },

    async save(input: SaveLetterInput): Promise<Letter> {
      const storage = resolve();
      if (!storage) throw new LetterStorageUnavailableError();

      // 검증은 화면이 이미 한 번 하지만 여기서도 한다 — 저장소를 지나 들어간 값은
      // 다음 번에 그대로 화면으로 돌아 나온다(잘못된 값을 들이면 그때 고칠 자리가 없다).
      const content = letterContentSchema.parse({
        recipientName: input.recipientName,
        title: input.title,
        body: input.body,
        flowerId: input.flowerId,
        theme: input.theme,
        signature: input.signature,
      });
      // 고쳐 쓰기 + 빈 번호 = "번호는 그대로" (SaveLetterInput 주석). 그때는 대조값을
      // 만들지 않는다 — 아래에서 이전 줄의 것을 그대로 쓴다.
      const keepCode = Boolean(input.id) && input.code.trim() === '';
      const codeHash = keepCode ? null : localCodeDigest(letterCodeSchema.parse(input.code));

      const letters = readAll(storage);
      const taken =
        codeHash !== null && letters.some((row) => row.codeHash === codeHash && row.id !== input.id);
      if (taken) throw new LetterCodeTakenError();

      const stamp = now().toISOString();

      if (input.id) {
        const index = letters.findIndex((row) => row.id === input.id);
        if (index < 0) throw new LetterNotFoundError();
        const previous = letters[index] as StoredLetter;
        const updated: StoredLetter = {
          ...content,
          id: previous.id,
          createdAt: previous.createdAt,
          updatedAt: stamp,
          codeHash: codeHash ?? previous.codeHash,
        };
        letters[index] = updated;
        writeAll(storage, letters);
        return toLetter(updated);
      }

      const created: StoredLetter = {
        ...content,
        id: newId(),
        createdAt: stamp,
        updatedAt: stamp,
        // 새 편지에는 `keepCode` 가 설 수 없다(그 조건이 `input.id` 를 요구한다).
        // 스키마를 한 번 더 지나며 그 사실을 타입에도 못 박는다 — 값은 위와 같다.
        codeHash: codeHash ?? localCodeDigest(letterCodeSchema.parse(input.code)),
      };
      writeAll(storage, [...letters, created]);
      return toLetter(created);
    },

    async remove(id: string): Promise<boolean> {
      const storage = resolve();
      if (!storage) return false;
      const letters = readAll(storage);
      const rest = letters.filter((letter) => letter.id !== id);
      if (rest.length === letters.length) return false;
      writeAll(storage, rest);
      return true;
    },

    async findByCode(code: string): Promise<Letter | null> {
      const storage = resolve();
      if (!storage) return null;

      // 형식이 어긋난 번호는 **던지지 않고 못 찾은 것으로 답한다.** 화면이 하는 말은
      // 어느 쪽이든 한 문장이고("이 번호로 잠긴 편지를 찾지 못했어요"), 형식이 틀렸다고
      // 따로 알려 주면 그것 자체가 번호를 맞히려는 사람에게 주는 힌트가 된다.
      const parsed = letterCodeSchema.safeParse(code);
      if (!parsed.success) return null;

      const digest = localCodeDigest(parsed.data);
      const row = readAll(storage).find((letter) => letter.codeHash === digest);
      return row ? toLetter(row) : null;
    },

    async revealCode(id: string): Promise<string | null> {
      const storage = resolve();
      if (!storage) return null;
      const row = readAll(storage).find((letter) => letter.id === id);
      // 로컬이라 되돌려 줄 수 있다(머리말). 서버 어댑터에는 이 메서드가 없다.
      return row ? row.codeHash : null;
    },
  };
}
