import { describe, expect, it } from 'vitest';

import { readPartialTones } from '@/lib/llm/partial';

/**
 * 아직 끝나지 않은 JSON 에서 보여 줄 조각만 꺼내는 판독기.
 *
 * 여기서 지키는 것은 세 가지다.
 *   ① **아무 자리에서 잘려도 던지지 않는다.** 스트림은 어디서든 끊긴다.
 *   ② **톤이 섞이지 않는다.** 아직 안 닫힌 앞 톤이 뒤 톤의 글자를 삼키면 화면이
 *      다른 톤의 문장을 보여 주게 된다.
 *   ③ **순서를 가정하지 않는다.** 짝짓기는 `tone` 값으로만 한다.
 */

const FULL = JSON.stringify({
  tones: [
    { tone: 'plain', headline: '고마워', message: '덕분이야.', why_it_fits: 'x', safety_flags: [] },
    { tone: 'romantic', headline: '늘 곁에', message: '오래 함께해.', why_it_fits: 'y', safety_flags: [] },
    { tone: 'sincere', headline: '진심으로', message: '고맙습니다.', why_it_fits: 'z', safety_flags: [] },
  ],
});

describe('readPartialTones — 잘린 자리마다', () => {
  it('어느 자리에서 잘려도 던지지 않는다', () => {
    for (let at = 0; at <= FULL.length; at += 1) {
      expect(() => readPartialTones(FULL.slice(0, at)), `@${at}`).not.toThrow();
    }
  });

  it('다 받으면 세 톤이 온전히 나온다', () => {
    expect(readPartialTones(FULL)).toEqual([
      { tone: 'plain', headline: '고마워', message: '덕분이야.' },
      { tone: 'romantic', headline: '늘 곁에', message: '오래 함께해.' },
      { tone: 'sincere', headline: '진심으로', message: '고맙습니다.' },
    ]);
  });

  it('아직 안 온 칸은 아예 없다(빈 문자열로 채우지 않는다)', () => {
    const cut = '{"tones":[{"tone":"plain","headline":"고마';
    expect(readPartialTones(cut)).toEqual([{ tone: 'plain', headline: '고마' }]);
  });

  it('톤 이름만 왔으면 이름만 돌려준다', () => {
    expect(readPartialTones('{"tones":[{"tone":"plain",')).toEqual([{ tone: 'plain' }]);
  });

  it('안 닫힌 앞 톤이 뒤 톤의 글자를 삼키지 않는다', () => {
    const raw =
      '{"tones":[{"tone":"plain","headline":"가","message":"나"},' +
      '{"tone":"romantic","headline":"다","message":"라';
    expect(readPartialTones(raw)).toEqual([
      { tone: 'plain', headline: '가', message: '나' },
      { tone: 'romantic', headline: '다', message: '라' },
    ]);
  });

  it('톤이 어떤 차례로 와도 이름으로 짝을 짓는다', () => {
    const raw =
      '{"tones":[{"tone":"sincere","message":"셋"},' +
      '{"tone":"plain","message":"하나"},' +
      '{"tone":"romantic","message":"둘"}]}';
    const byTone = Object.fromEntries(readPartialTones(raw).map((part) => [part.tone, part.message]));
    expect(byTone).toEqual({ sincere: '셋', plain: '하나', romantic: '둘' });
  });

  it('같은 톤이 다시 시작되면 나중 것이 이긴다 (폴백으로 다른 모델이 새로 쓴다)', () => {
    const raw =
      '{"tones":[{"tone":"plain","message":"버려질 문장"}]}' +
      '{"tones":[{"tone":"plain","message":"새로 쓰는 문장"';
    expect(readPartialTones(raw)).toEqual([{ tone: 'plain', message: '새로 쓰는 문장' }]);
  });
});

describe('readPartialTones — 이스케이프와 잡음', () => {
  it('줄바꿈·따옴표 이스케이프를 되돌린다', () => {
    const raw = '{"tones":[{"tone":"plain","message":"첫 줄\\n둘째 \\"줄\\""}]}';
    expect(readPartialTones(raw)[0].message).toBe('첫 줄\n둘째 "줄"');
  });

  it('반쪽 이스케이프(백슬래시 하나로 끝)에서 멈춘다', () => {
    const raw = '{"tones":[{"tone":"plain","message":"괜찮은 데까지\\';
    expect(readPartialTones(raw)[0].message).toBe('괜찮은 데까지');
  });

  it('\\u 가 네 자리를 다 못 채웠으면 그 조각을 내지 않는다', () => {
    const raw = '{"tones":[{"tone":"plain","message":"가나\\u12';
    expect(readPartialTones(raw)[0].message).toBe('가나');
  });

  it('열린 코드펜스는 벗겨 낸다', () => {
    const raw = '```json\n{"tones":[{"tone":"plain","message":"안녕"';
    expect(readPartialTones(raw)).toEqual([{ tone: 'plain', message: '안녕' }]);
  });

  it('톤이 하나도 안 왔으면 빈 배열이다', () => {
    expect(readPartialTones('')).toEqual([]);
    expect(readPartialTones('{"ton')).toEqual([]);
    expect(readPartialTones('그냥 글자')).toEqual([]);
  });
});
