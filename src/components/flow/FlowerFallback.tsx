'use client';

/* 2026-08-15 실사 교체로 미사용 — 롤백 후보(git 이력 + 이 파일) */

/**
 * 3D 뷰어의 폴백 일러스트.
 *
 * WebGL 을 못 쓰는 기기에서도 "무슨 꽃인지"는 보여야 한다. 절차적 3D 와 같은 세 형태
 * (장미형·튤립형·수상형)를 인라인 SVG 로 단순화해 그린다 — 확정 시안의 폴백 그대로이고,
 * 색만 지금 고른 색 칩을 따라간다.
 */

import { useId } from 'react';

import type { FlowerForm } from './types';

/** #RRGGBB 두 색을 섞는다. 그라디언트 스톱을 색 칩 하나에서 만들기 위해서다. */
function mix(hex: string, other: string, ratio: number): string {
  const parse = (h: string) => {
    const v = h.replace('#', '');
    const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(other);
  const t = Math.min(1, Math.max(0, ratio));
  const to = (a: number, b: number) => Math.round(a + (b - a) * t)
    .toString(16)
    .padStart(2, '0');
  return `#${to(r1, r2)}${to(g1, g2)}${to(b1, b2)}`;
}

const INK = '#0B0C0A';
const LIGHT = '#F6F1E8';
const STEM = '#3A5A43';

export interface FlowerFallbackProps {
  form: FlowerForm;
  /** 지금 고른 색. */
  colorHex: string;
  /** 예: `흰 튤립 일러스트`. */
  label: string;
}

export default function FlowerFallback({ form, colorHex, label }: FlowerFallbackProps) {
  const uid = useId().replace(/:/g, '');
  const gid = `fb-${uid}`;

  const light = mix(colorHex, LIGHT, 0.45);
  const deep = mix(colorHex, INK, 0.42);

  if (form === 'tulip') {
    return (
      <svg viewBox="0 0 200 200" role="img" aria-label={label}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={light} stopOpacity=".97" />
            <stop offset="1" stopColor={colorHex} stopOpacity=".45" />
          </linearGradient>
        </defs>
        <path
          d="M100 26c15 14 23 37 23 60s-10 39-23 39-23-16-23-39 8-46 23-60z"
          fill={`url(#${gid})`}
        />
        <path
          d="M100 125c-16 0-31-16-36-38-4-21-2-39 7-49 10 12 18 32 21 54"
          fill={`url(#${gid})`}
          opacity=".6"
        />
        <path
          d="M100 125c16 0 31-16 36-38 4-21 2-39-7-49-10 12-18 32-21 54"
          fill={`url(#${gid})`}
          opacity=".6"
        />
        <path d="M100 122v66" stroke={STEM} strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M100 152c-13-8-29-4-38 9 14 9 30 6 38-3z" fill={STEM} opacity=".9" />
        <path d="M100 172c13-8 29-4 38 9-14 9-30 6-38-3z" fill={STEM} opacity=".72" />
      </svg>
    );
  }

  if (form === 'spike') {
    return (
      <svg viewBox="0 0 200 200" role="img" aria-label={label}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={light} />
            <stop offset=".55" stopColor={colorHex} />
            <stop offset="1" stopColor={deep} />
          </linearGradient>
        </defs>
        <path d="M100 128v62" stroke={STEM} strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M92 150c-14 6-22 22-20 40 14-6 22-22 20-40z" fill={STEM} opacity=".8" />
        <path d="M108 158c14 6 22 22 20 40-14-6-22-22-20-40z" fill={STEM} opacity=".62" />
        <g fill={`url(#${gid})`}>
          <circle cx="100" cy="22" r="9" />
          <circle cx="88" cy="38" r="11" />
          <circle cx="112" cy="38" r="11" />
          <circle cx="100" cy="50" r="12" />
          <circle cx="79" cy="58" r="13" />
          <circle cx="121" cy="58" r="13" />
          <circle cx="98" cy="72" r="14" />
          <circle cx="72" cy="80" r="14" />
          <circle cx="126" cy="80" r="14" />
          <circle cx="100" cy="95" r="15" />
          <circle cx="74" cy="103" r="14" />
          <circle cx="126" cy="103" r="14" />
          <circle cx="100" cy="117" r="14" />
        </g>
        <g fill={deep} opacity=".55">
          <circle cx="88" cy="38" r="3" />
          <circle cx="112" cy="38" r="3" />
          <circle cx="79" cy="58" r="3.4" />
          <circle cx="121" cy="58" r="3.4" />
          <circle cx="98" cy="72" r="3.6" />
          <circle cx="72" cy="80" r="3.6" />
          <circle cx="126" cy="80" r="3.6" />
          <circle cx="100" cy="95" r="3.8" />
          <circle cx="74" cy="103" r="3.6" />
          <circle cx="126" cy="103" r="3.6" />
          <circle cx="100" cy="117" r="3.6" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={label}>
      <defs>
        <radialGradient id={gid} cx=".46" cy=".38" r=".68">
          <stop offset="0" stopColor={light} />
          <stop offset=".45" stopColor={mix(colorHex, LIGHT, 0.18)} />
          <stop offset=".8" stopColor={colorHex} />
          <stop offset="1" stopColor={deep} />
        </radialGradient>
      </defs>
      <g fill={`url(#${gid})`}>
        <g opacity=".7">
          <ellipse cx="100" cy="60" rx="42" ry="33" />
          <ellipse cx="100" cy="60" rx="42" ry="33" transform="rotate(72 100 100)" />
          <ellipse cx="100" cy="60" rx="42" ry="33" transform="rotate(144 100 100)" />
          <ellipse cx="100" cy="60" rx="42" ry="33" transform="rotate(216 100 100)" />
          <ellipse cx="100" cy="60" rx="42" ry="33" transform="rotate(288 100 100)" />
        </g>
        <g opacity=".85">
          <ellipse cx="100" cy="76" rx="30" ry="24" transform="rotate(36 100 100)" />
          <ellipse cx="100" cy="76" rx="30" ry="24" transform="rotate(108 100 100)" />
          <ellipse cx="100" cy="76" rx="30" ry="24" transform="rotate(180 100 100)" />
          <ellipse cx="100" cy="76" rx="30" ry="24" transform="rotate(252 100 100)" />
          <ellipse cx="100" cy="76" rx="30" ry="24" transform="rotate(324 100 100)" />
        </g>
        <g>
          <ellipse cx="100" cy="88" rx="19" ry="15" />
          <ellipse cx="100" cy="88" rx="19" ry="15" transform="rotate(90 100 100)" />
          <ellipse cx="100" cy="88" rx="19" ry="15" transform="rotate(180 100 100)" />
          <ellipse cx="100" cy="88" rx="19" ry="15" transform="rotate(270 100 100)" />
        </g>
      </g>
      <circle cx="100" cy="100" r="9" fill={deep} />
    </svg>
  );
}
