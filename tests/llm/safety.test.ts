import { describe, expect, it } from 'vitest';

import { isBlockedForGeneration } from '@/lib/llm/safety';

/**
 * 생성 호출 **앞**에 선 차단문(`src/lib/llm/safety.ts`).
 *
 * 기획안 v2 의 후퇴 금지선이면서, 이 저장소에서 테스트가 한 건도 없던 자리다.
 * 여기서 지키려는 것은 서로 반대 방향의 두 가지이고, 둘 다 조용히 무너진다.
 *
 *   ① **놓치면 안 되는 것** — 자해·폭력·응급 신호가 섞인 글로 멘트를 지어내는 일.
 *      생성한 문장이 그 상황에 얹히는 것이 이 서비스가 낼 수 있는 가장 나쁜 결과다.
 *   ② **막으면 안 되는 것** — 조문·이별·다툼처럼 **꽃 선물의 정상 맥락**.
 *      넓게 잡으면 정작 꽃이 필요한 자리를 통째로 닫는다.
 *
 * 신호 목록을 여기 그대로 적어 두는 이유: `BLOCKED_MARKERS` 는 내보내지 않는 상수라
 * 테스트가 구현을 훔쳐볼 수 없고, 무엇보다 **줄어들면 알아야 하는 목록**이기 때문이다.
 * 여기 있는 낱말이 구현에서 빠지면 이 파일이 먼저 깨진다.
 */

/** 차단해야 하는 신호. 구현의 사본이 아니라 "이만큼은 반드시 막는다"는 약속이다. */
const MUST_BLOCK = [
  '자살',
  '자해',
  '죽고 싶',
  '죽고싶',
  '목숨을 끊',
  '극단적 선택',
  '유서',
  '폭행',
  '학대',
  '성폭력',
  '스토킹',
  '납치',
  '협박',
  '살해',
  '응급실',
  '중환자실',
] as const;

describe('isBlockedForGeneration — 막아야 하는 것', () => {
  it('신호 하나하나를 전부 막는다', () => {
    for (const marker of MUST_BLOCK) {
      expect(isBlockedForGeneration([marker]), marker).toBe(true);
    }
  });

  it('문장 한가운데 있어도 잡는다 — 낱말이 아니라 부분 문자열로 본다', () => {
    // 한국어는 조사가 붙는다. 낱말 단위로 끊어 보면 `자해를`·`유서가` 가 통째로 새어 나간다.
    expect(isBlockedForGeneration(['요즘 자해를 한다고 들었어요'])).toBe(true);
    expect(isBlockedForGeneration(['남긴 유서가 있었대요'])).toBe(true);
    expect(isBlockedForGeneration(['지금 응급실에 있어요'])).toBe(true);
  });

  it('여러 칸 중 한 칸만 걸려도 막는다 (자유 서술 · 직접 쓴 마음)', () => {
    // 호출부는 자유 서술과 `직접 쓸게요` 한 줄을 함께 넘긴다 — 어느 쪽이든 같은 문을 지난다.
    expect(isBlockedForGeneration(['평범한 이야기예요', '사실 죽고 싶다고 했어요'])).toBe(true);
    expect(isBlockedForGeneration(['협박을 당하고 있어요', ''])).toBe(true);
  });

  it('칸과 칸을 이어 붙여 없는 신호를 만들어 내지는 않는다', () => {
    // 칸 사이는 공백으로 잇는다. 앞 칸이 `자` 로 끝나고 뒤 칸이 `살` 로 시작한다고 해서
    // `자살` 이 되지는 않는다 — 서로 다른 칸의 글자는 붙은 말이 아니다.
    expect(isBlockedForGeneration(['오늘도 혼자', '살구꽃을 봤어요'])).toBe(false);
  });
});

describe('isBlockedForGeneration — 막으면 안 되는 것', () => {
  it('조문은 통과한다 — 국화를 찾으러 온 사람을 돌려보내지 않는다', () => {
    expect(isBlockedForGeneration(['할머니 장례식에 다녀왔어요. 국화를 놓고 왔어요.'])).toBe(false);
    expect(isBlockedForGeneration(['상을 당한 친구에게 위로를 전하고 싶어요'])).toBe(false);
    expect(isBlockedForGeneration(['돌아가신 지 한 해가 됐어요'])).toBe(false);
  });

  it('이별·다툼도 통과한다 — 꽃 선물의 정상 맥락이다', () => {
    expect(isBlockedForGeneration(['헤어지자는 말을 들었어요'])).toBe(false);
    expect(isBlockedForGeneration(['어제 크게 다퉜어요. 먼저 사과하고 싶어요.'])).toBe(false);
    expect(isBlockedForGeneration(['이별한 친구를 위로하고 싶어요'])).toBe(false);
  });

  it('아픈 사람을 향한 마음도 통과한다 (병문안은 응급 신호가 아니다)', () => {
    expect(isBlockedForGeneration(['수술을 앞둔 동료에게 건네고 싶어요'])).toBe(false);
    expect(isBlockedForGeneration(['오래 아팠던 친구가 퇴원했어요'])).toBe(false);
  });
});

describe('isBlockedForGeneration — 가장자리', () => {
  it('빈 입력은 막지 않는다 (자유 서술은 전부 선택이다)', () => {
    expect(isBlockedForGeneration([])).toBe(false);
    expect(isBlockedForGeneration([''])).toBe(false);
    expect(isBlockedForGeneration(['', ''])).toBe(false);
    expect(isBlockedForGeneration(['   ', '\n'])).toBe(false);
  });

  it('대소문자가 섞여 있어도 판정이 흔들리지 않는다', () => {
    // 판정은 소문자로 눕혀 놓고 본다. 한글에는 대소문자가 없지만, 영문이 섞인 글에서
    // 그 눕히기가 신호를 지우거나 없는 신호를 만들어서는 안 된다.
    expect(isBlockedForGeneration(['SOS 자살 HELP'])).toBe(true);
    expect(isBlockedForGeneration(['Happy Birthday, 축하해!'])).toBe(false);
    expect(isBlockedForGeneration(['ABC abc AbC'])).toBe(false);
  });

  it('판정은 boolean 하나뿐이다 — 어떤 낱말이 걸렸는지는 돌려주지 않는다(§1.5j)', () => {
    // 걸린 낱말을 돌려주면 그 값이 로그·에러로 흘러 나가는 길이 생긴다.
    expect(typeof isBlockedForGeneration(['자살'])).toBe('boolean');
  });
});
