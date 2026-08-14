/**
 * 그룹 화면의 아이콘·꽃 마크 — 전부 인라인 SVG다(이모지 금지, §1.6).
 *
 * 꽃 그림은 확정 시안 `design/app-v3/group.html` 의 스프라이트를 그대로 옮겼다.
 * 스프라이트를 페이지에 한 번만 심고 `<use>` 로 재사용하는 이유: 카드마다 SVG 를 통째로
 * 복제하면 그라디언트 id 가 문서 안에서 충돌한다.
 * 카탈로그 9종 중 시안에 그림이 있는 4종만 전용 마크를 쓰고, 나머지는 공용 마크로 떨어진다.
 */

interface IconProps {
  className?: string;
}

export function IconBack({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function IconShop({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 9.4 5.6 4.5h12.8L20 9.4a2.6 2.6 0 0 1-4.9 1.3 2.6 2.6 0 0 1-4.9 0 2.6 2.6 0 0 1-4.9-1.3z" />
      <path d="M5.6 11.6V19a1.5 1.5 0 0 0 1.5 1.5h9.8a1.5 1.5 0 0 0 1.5-1.5v-7.4" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 5.4v13.2M5.4 12h13.2" />
    </svg>
  );
}

export function IconRemove({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6.6 6.6l10.8 10.8M17.4 6.6L6.6 17.4" />
    </svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3.2l7 2.6v6c0 4.4-2.9 7.6-7 9-4.1-1.4-7-4.6-7-9v-6z" />
      <path d="M8.8 11.9l2.2 2.2 4.2-4.4" />
    </svg>
  );
}

export function IconArrowRight({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 12h13M12.5 6l6 6-6 6" />
    </svg>
  );
}

export function IconBloom({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 4.6c2 1.6 3 3.7 3 5.9s-1.3 3.6-3 3.6-3-1.4-3-3.6 1-4.3 3-5.9z" />
      <path d="M12 14.1V20" />
      <path d="M12 17.2c-1.5-1.1-3.4-.8-4.4 .9 1.6 1.1 3.5 .8 4.4-.9z" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────── *
 * 꽃 마크 (스프라이트)
 * ────────────────────────────────────────────────────────────────────────── */

/** 카탈로그 꽃 id → 스프라이트 symbol id. 없는 꽃은 공용 마크. */
const SYMBOL_BY_FLOWER: Record<string, string> = {
  freesia: 'fl-freesia',
  gerbera: 'fl-gerbera',
  'rose-red': 'fl-rose',
  'tulip-white': 'fl-tulip',
};

function symbolFor(flowerId: string): string {
  return SYMBOL_BY_FLOWER[flowerId] ?? 'fl-bloom';
}

interface FlowerMarkProps {
  flowerId: string;
  /** 그림에 붙는 대체 텍스트. 장식으로 쓸 때는 넘기지 않는다. */
  label?: string;
  className?: string;
}

export function FlowerMark({ flowerId, label, className }: FlowerMarkProps) {
  const common = { className, focusable: 'false' as const };
  const href = `#${symbolFor(flowerId)}`;

  if (label === undefined) {
    return (
      <svg {...common} aria-hidden="true">
        <use href={href} />
      </svg>
    );
  }

  return (
    <svg {...common} role="img" aria-label={label}>
      <use href={href} />
    </svg>
  );
}

/** 페이지당 한 번만 렌더한다. */
export function FlowerSprite({ className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true" focusable="false">
      <symbol id="fl-freesia" viewBox="0 0 200 200">
        <linearGradient id="grFreesia" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6F1E8" stopOpacity=".96" />
          <stop offset="1" stopColor="#F6F1E8" stopOpacity=".44" />
        </linearGradient>
        <path
          d="M62 190C62 152 68 112 92 86"
          stroke="#3A5A43"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M70 146c-16 3-27 17-26 35 16-4 26-17 26-35z" fill="#3A5A43" opacity=".78" />
        <g fill="url(#grFreesia)">
          <g transform="translate(92,92) rotate(-20)">
            <path d="M0 0c-14-3-22-16-20-30 1-10 10-16 20-16s19 6 20 16c2 14-6 27-20 30z" />
            <path d="M-20-30c-7-9-5-21 4-26 6 7 7 18-4 26z" opacity=".82" />
            <path d="M20-30c7-9 5-21-4-26-6 7-7 18 4 26z" opacity=".82" />
          </g>
          <g transform="translate(116,60) rotate(-12) scale(.76)">
            <path d="M0 0c-14-3-22-16-20-30 1-10 10-16 20-16s19 6 20 16c2 14-6 27-20 30z" />
            <path d="M-20-30c-7-9-5-21 4-26 6 7 7 18-4 26z" opacity=".82" />
            <path d="M20-30c7-9 5-21-4-26-6 7-7 18 4 26z" opacity=".82" />
          </g>
          <g transform="translate(134,34) rotate(-6) scale(.5)">
            <path d="M0 0c-14-3-22-16-20-30 1-10 10-16 20-16s19 6 20 16c2 14-6 27-20 30z" />
          </g>
        </g>
        <g fill="#C8963E" opacity=".7">
          <circle cx="92" cy="70" r="4.4" />
          <circle cx="114" cy="43" r="3.4" />
        </g>
      </symbol>

      <symbol id="fl-gerbera" viewBox="0 0 200 200">
        <linearGradient id="grGerbera" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E2BC79" />
          <stop offset="1" stopColor="#8A672B" />
        </linearGradient>
        <path d="M100 124v66" stroke="#3A5A43" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M100 156c-12-8-28-5-36 8 13 8 28 5 36-3z" fill="#3A5A43" opacity=".8" />
        <g fill="url(#grGerbera)">
          <ellipse cx="100" cy="32" rx="8" ry="26" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(22.5 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(45 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(67.5 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(90 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(112.5 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(135 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(157.5 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(180 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(202.5 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(225 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(247.5 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(270 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(292.5 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(315 100 78)" />
          <ellipse cx="100" cy="32" rx="8" ry="26" transform="rotate(337.5 100 78)" />
        </g>
        <circle cx="100" cy="78" r="20" fill="#8A672B" />
        <circle cx="100" cy="78" r="11" fill="#1F211E" opacity=".78" />
      </symbol>

      <symbol id="fl-rose" viewBox="0 0 200 200">
        <radialGradient id="grRose" cx=".46" cy=".36" r=".7">
          <stop offset="0" stopColor="#D6AFB4" />
          <stop offset=".45" stopColor="#B87F8C" />
          <stop offset=".8" stopColor="#8A3448" />
          <stop offset="1" stopColor="#5C2230" />
        </radialGradient>
        <path d="M100 122v68" stroke="#3A5A43" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M100 156c12-8 28-5 36 8-13 8-28 5-36-3z" fill="#3A5A43" opacity=".72" />
        <g fill="url(#grRose)">
          <g opacity=".72">
            <ellipse cx="100" cy="44" rx="32" ry="25" />
            <ellipse cx="100" cy="44" rx="32" ry="25" transform="rotate(72 100 74)" />
            <ellipse cx="100" cy="44" rx="32" ry="25" transform="rotate(144 100 74)" />
            <ellipse cx="100" cy="44" rx="32" ry="25" transform="rotate(216 100 74)" />
            <ellipse cx="100" cy="44" rx="32" ry="25" transform="rotate(288 100 74)" />
          </g>
          <g opacity=".86">
            <ellipse cx="100" cy="56" rx="23" ry="18" transform="rotate(36 100 74)" />
            <ellipse cx="100" cy="56" rx="23" ry="18" transform="rotate(108 100 74)" />
            <ellipse cx="100" cy="56" rx="23" ry="18" transform="rotate(180 100 74)" />
            <ellipse cx="100" cy="56" rx="23" ry="18" transform="rotate(252 100 74)" />
            <ellipse cx="100" cy="56" rx="23" ry="18" transform="rotate(324 100 74)" />
          </g>
          <g>
            <ellipse cx="100" cy="64" rx="14" ry="11" />
            <ellipse cx="100" cy="64" rx="14" ry="11" transform="rotate(90 100 74)" />
            <ellipse cx="100" cy="64" rx="14" ry="11" transform="rotate(180 100 74)" />
            <ellipse cx="100" cy="64" rx="14" ry="11" transform="rotate(270 100 74)" />
          </g>
        </g>
        <circle cx="100" cy="74" r="7" fill="#5C2230" />
      </symbol>

      <symbol id="fl-tulip" viewBox="0 0 200 200">
        <linearGradient id="grTulip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6F1E8" stopOpacity=".94" />
          <stop offset="1" stopColor="#F6F1E8" stopOpacity=".38" />
        </linearGradient>
        <path
          d="M100 34c14 13 21 34 21 55s-9 36-21 36-21-15-21-36 7-42 21-55z"
          fill="url(#grTulip)"
        />
        <path
          d="M100 125c-15 0-28-15-32-35-4-19-2-36 6-45 10 10 17 30 19 49"
          fill="url(#grTulip)"
          opacity=".62"
        />
        <path
          d="M100 125c15 0 28-15 32-35 4-19 2-36-6-45-10 10-17 30-19 49"
          fill="url(#grTulip)"
          opacity=".62"
        />
        <path d="M100 122v66" stroke="#3A5A43" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M100 154c-12-8-27-5-35 8 13 9 28 6 35-3z" fill="#3A5A43" opacity=".86" />
        <path d="M100 172c12-8 27-5 35 8-13 9-28 6-35-3z" fill="#3A5A43" opacity=".7" />
      </symbol>

      {/* 공용 마크 — 시안에 전용 그림이 없는 꽃(백합·아네모네·헬레보어·히아신스·작약) */}
      <symbol id="fl-bloom" viewBox="0 0 200 200">
        <linearGradient id="grBloom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6F1E8" stopOpacity=".92" />
          <stop offset="1" stopColor="#F6F1E8" stopOpacity=".40" />
        </linearGradient>
        <path d="M100 118v72" stroke="#3A5A43" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M100 152c-13-8-29-5-37 9 14 8 29 5 37-3z" fill="#3A5A43" opacity=".8" />
        <g fill="url(#grBloom)">
          <ellipse cx="100" cy="46" rx="17" ry="32" />
          <ellipse cx="100" cy="46" rx="17" ry="32" transform="rotate(60 100 78)" />
          <ellipse cx="100" cy="46" rx="17" ry="32" transform="rotate(120 100 78)" />
          <ellipse cx="100" cy="46" rx="17" ry="32" transform="rotate(180 100 78)" />
          <ellipse cx="100" cy="46" rx="17" ry="32" transform="rotate(240 100 78)" />
          <ellipse cx="100" cy="46" rx="17" ry="32" transform="rotate(300 100 78)" />
        </g>
        <circle cx="100" cy="78" r="12" fill="#C8963E" opacity=".72" />
      </symbol>
    </svg>
  );
}
