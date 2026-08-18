/**
 * 아직 끝나지 않은 JSON 에서 **보여 줄 조각만** 꺼낸다 — 멘트 스트리밍의 표시용 판독기.
 *
 * ── 왜 필요한가 (2026-08-18) ─────────────────────────────────────────
 * 모델은 3톤을 JSON 한 덩이로 쓴다. 그 덩이가 다 오기 전에는 `JSON.parse` 가 통째로
 * 실패하므로, 흘러들어오는 도중의 텍스트는 표준 파서로는 한 글자도 읽을 수 없다.
 * 그렇다고 다 오기를 기다리면 지금과 똑같이 3초 뒤에 한꺼번에 나타난다(사용자 신고).
 * 그래서 **관용적으로** 훑어 `tone` · `headline` · `message` 세 칸만 집어낸다.
 *
 * ── 이 파일의 결과물은 화면에 보이는 글자일 뿐, 계약이 아니다 ────────
 * 여기서 나온 값은 `ToneView.body` 가 되지 않는다. 복사·고쳐 쓰기·새로 받기 어디에도
 * 쓰이지 않고, 확정은 스트림이 끝난 뒤 zod(`generateResponseSchemaFor`)가 한다.
 * 그 경계가 이 파일의 존재 이유다 — **부분 문자열로 화면 계약을 깨지 않는다.**
 *
 * ── 규칙 ─────────────────────────────────────────────────────────────
 *  · **못 읽으면 침묵한다.** 어느 칸이든 아직 안 왔으면 그 칸이 없는 채로 돌려준다.
 *  · **순서를 가정하지 않는다.** 톤이 어떤 차례로 오든 `tone` 값으로 짝을 짓는다
 *    (프로바이더마다 키 순서가 다르고, 폴백이 갈릴 수도 있다).
 *  · **던지지 않는다.** 반쪽 이스케이프(`\` 하나로 끝난 꼬리)도 값으로 흡수한다.
 */

/** 스트리밍 도중의 한 톤. 아직 안 온 칸은 아예 없다. */
export interface PartialTone {
  /** 톤 어휘(`plain` · `romantic` · `sincere` · `playful`). 이 값이 짝짓기의 열쇠다. */
  tone: string;
  headline?: string;
  message?: string;
}

/** 모델이 ```json 펜스를 열어 두었을 때의 머리 부분만 벗긴다(닫는 펜스는 아직 없다). */
function stripOpenFence(raw: string): string {
  const text = raw.trimStart();
  return text.startsWith('```') ? text.replace(/^```[a-zA-Z]*\s*/, '') : text;
}

/** JSON 문자열 이스케이프를 되돌린다. 끝이 잘렸으면 그 자리까지만 돌려준다. */
function unescapeJsonChunk(raw: string): string {
  let out = '';
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch !== '\\') {
      out += ch;
      continue;
    }
    const next = raw[i + 1];
    // 백슬래시 하나로 끝났다 — 짝이 될 글자가 아직 안 왔다. 여기서 멈춘다.
    if (next === undefined) return out;
    i += 1;
    switch (next) {
      case 'n':
        out += '\n';
        break;
      case 't':
        out += '\t';
        break;
      case 'r':
        out += '\r';
        break;
      case 'b':
      case 'f':
        // 화면에 낼 글자가 아니다 — 버린다(표시용이라 원본 복원 의무가 없다).
        break;
      case 'u': {
        const hex = raw.slice(i + 1, i + 5);
        // 네 자리가 아직 다 안 왔으면 이 조각은 통째로 보류한다(깨진 글자를 내지 않는다).
        if (hex.length < 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) return out;
        out += String.fromCharCode(Number.parseInt(hex, 16));
        i += 4;
        break;
      }
      default:
        // `\"` · `\\` · `\/` — 그 글자 자체다.
        out += next;
    }
  }
  return out;
}

/**
 * `at` 자리에서 시작하는 JSON 문자열 값을 읽는다(여는 따옴표 위치를 준다).
 * 닫는 따옴표가 아직 안 왔으면 `closed: false` 로, 온 데까지 돌려준다.
 */
function readString(text: string, at: number): { value: string; end: number; closed: boolean } {
  let i = at + 1;
  let rawValue = '';
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\') {
      rawValue += text.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (ch === '"') return { value: unescapeJsonChunk(rawValue), end: i + 1, closed: true };
    rawValue += ch;
    i += 1;
  }
  return { value: unescapeJsonChunk(rawValue), end: text.length, closed: false };
}

/** `"키"` 다음의 `:` 를 건너뛰고 값이 문자열이면 읽는다. 아직 안 왔으면 undefined. */
function valueAfterKey(text: string, key: string, from: number, until: number): string | undefined {
  const marker = `"${key}"`;
  const at = text.indexOf(marker, from);
  if (at === -1 || at >= until) return undefined;

  let i = at + marker.length;
  while (i < text.length && /\s/.test(text[i])) i += 1;
  if (text[i] !== ':') return undefined;
  i += 1;
  while (i < text.length && /\s/.test(text[i])) i += 1;
  if (text[i] !== '"') return undefined;

  return readString(text, i).value;
}

/** `"tone"` 이 나오는 자리들. 여기가 톤 한 칸의 시작이다. */
const TONE_KEY = /"tone"\s*:\s*"([a-z_]+)"/g;

/**
 * 지금까지 받은 텍스트에서 톤별 표시 조각을 뽑는다.
 *
 * 한 톤의 범위는 **다음 `"tone"` 직전까지**다 — 그래야 아직 안 닫힌 앞 톤의 `message` 가
 * 뒤 톤의 값을 삼키지 않는다. 마지막 톤은 텍스트 끝까지가 범위다(아직 쓰는 중이니까).
 *
 * 같은 톤이 두 번 나오면 **나중 것이 이긴다** — 모델이 앞부분을 다시 쓰는 일은 없지만,
 * 폴백으로 다른 프로바이더가 새로 쓰기 시작하면 같은 톤이 다시 등장한다. 그때 화면에
 * 서야 할 것은 지금 쓰이고 있는 쪽이다.
 */
export function readPartialTones(raw: string): PartialTone[] {
  const text = stripOpenFence(raw);
  const starts: { tone: string; at: number; after: number }[] = [];

  TONE_KEY.lastIndex = 0;
  for (let hit = TONE_KEY.exec(text); hit !== null; hit = TONE_KEY.exec(text)) {
    starts.push({ tone: hit[1], at: hit.index, after: hit.index + hit[0].length });
  }
  if (starts.length === 0) return [];

  const byTone = new Map<string, PartialTone>();
  for (let i = 0; i < starts.length; i += 1) {
    const { tone, after } = starts[i];
    const until = i + 1 < starts.length ? starts[i + 1].at : text.length;

    const part: PartialTone = { tone };
    const headline = valueAfterKey(text, 'headline', after, until);
    if (headline !== undefined && headline !== '') part.headline = headline;
    const message = valueAfterKey(text, 'message', after, until);
    if (message !== undefined && message !== '') part.message = message;

    byTone.set(tone, part);
  }

  return [...byTone.values()];
}
