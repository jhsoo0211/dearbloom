import { describe, expect, it } from 'vitest';

import { resolveSiteUrl } from '@/lib/site';

describe('resolveSiteUrl', () => {
  it.each([undefined, '', '   '])('빈 값 %j은 로컬 주소로 폴백한다', (value) => {
    expect(resolveSiteUrl(value)).toBe('http://localhost:3000');
  });

  it('앞뒤 공백과 끝 슬래시를 정리한다', () => {
    expect(resolveSiteUrl('  https://dearbloom.example///  ')).toBe(
      'https://dearbloom.example',
    );
  });

  it.each(['dearbloom.example', 'ftp://dearbloom.example'])(
    'HTTP(S) 절대 주소가 아니면 명확히 실패한다: %s',
    (value) => {
      expect(() => resolveSiteUrl(value)).toThrow(/NEXT_PUBLIC_SITE_URL/);
    },
  );
});
