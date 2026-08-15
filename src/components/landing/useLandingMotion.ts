'use client';

/**
 * 랜딩 모션 — GSAP(ScrollTrigger) + Lenis.
 *
 * 원칙
 *  · **격리**: 모션은 이 훅 안에서만 산다. 실패하면 `db-motion` 을 떼고 정적 레이아웃으로 끝낸다
 *    (모션이 죽어도 콘텐츠가 사라지면 안 된다 — `[data-db-intro]{opacity:0}` 는 이 클래스에 매달려 있다).
 *  · **reduced-motion 이면 아예 기동하지 않는다**(§1.2·§1.6). 클래스 자체가 붙지 않는다.
 *  · 인트로는 게이트("들어가기")가 끝난 뒤 재생된다 — `entered` 로 신호를 받는다.
 *  · 정리는 `gsap.context().revert()` 한 번으로 끝낸다(이 컴포넌트가 만든 ScrollTrigger 만 죽는다).
 */

import { useEffect, useRef, useState, type RefObject } from 'react';

/** idle = 부팅 중 · ready = 모션 가동 · off = 모션 없음(리듀스드 모션·로드 실패) */
export type MotionState = 'idle' | 'ready' | 'off';

/**
 * 텍스트를 어절 단위 마스크로 쪼갠다.
 *
 * 접근성: 쪼갠 조각은 전부 `aria-hidden` 이고, 원문은 **`.sr-only` span 한 줄**로 남긴다.
 *
 * ⚠ 예전에는 원문을 `aria-label` 로 걸었다. 그런데 이 함수가 잡는 대상 중에는 `<p>` 가
 *   있고, `paragraph` 롤은 **이름을 가질 수 없는 롤**이라 그 속성이 금지 속성이 된다
 *   (axe `aria-prohibited-attr`, serious). 스크린리더가 문단을 통째로 건너뛰거나 라벨을
 *   무시하는 실패로 이어진다. sr-only 텍스트는 롤을 가리지 않고 같은 일을 한다.
 *   JSX 가 이미 `aria-label` 을 준 요소(히어로 h1 — 헤딩은 이름을 가질 수 있다)는 건드리지 않는다.
 */
function splitWords(el: HTMLElement) {
  if (el.dataset.dbSplit === '1') return;
  const full = (el.textContent ?? '').trim();
  if (!full) return;
  const needsSpokenCopy =
    el.getAttribute('aria-hidden') !== 'true' && !el.hasAttribute('aria-label');
  el.textContent = '';
  if (needsSpokenCopy) {
    const spoken = document.createElement('span');
    spoken.className = 'sr-only';
    spoken.textContent = full;
    el.appendChild(spoken);
  }
  full.split(/(\s+)/).forEach((part) => {
    if (!part) return;
    if (!part.trim()) {
      el.appendChild(document.createTextNode(part));
      return;
    }
    const mask = document.createElement('span');
    mask.className = 'db-mask';
    mask.setAttribute('aria-hidden', 'true');
    const word = document.createElement('span');
    word.className = 'db-word';
    word.textContent = part;
    mask.appendChild(word);
    el.appendChild(mask);
  });
  el.dataset.dbSplit = '1';
}

export function useLandingMotion(
  rootRef: RefObject<HTMLElement | null>,
  entered: boolean,
): MotionState {
  const introRef = useRef<{ play: () => void } | null>(null);
  const wantsPlay = useRef(false);
  const [state, setState] = useState<MotionState>('idle');

  useEffect(() => {
    const scope = rootRef.current;
    if (!scope) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.setTimeout(() => setState('off'), 0);
      return;
    }

    let disposed = false;
    let dispose: (() => void) | null = null;

    void (async () => {
      try {
        const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
          import('gsap'),
          import('gsap/ScrollTrigger'),
          import('lenis'),
        ]);
        if (disposed) return;

        gsap.registerPlugin(ScrollTrigger);
        gsap.defaults({ ease: 'power3.out', duration: 0.85 });

        const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.92 });
        lenis.on('scroll', ScrollTrigger.update);
        const raf = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);

        const ctx = gsap.context(() => {
          const words = (el: Element | null) => {
            if (!el) return [];
            const found = el.querySelectorAll('.db-word');
            return found.length > 0 ? Array.from(found) : [el];
          };

          scope.querySelectorAll<HTMLElement>('[data-db-split]').forEach(splitWords);

          /* 히어로 인트로 — 게이트가 걷히는 순간과 이어진다 */
          const timeline = gsap.timeline({ paused: true });
          timeline
            .fromTo(
              '.db-nav',
              { autoAlpha: 0, y: -14 },
              { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out' },
              0,
            )
            .add(() => {
              gsap.set('.db-hero [data-db-intro]', { autoAlpha: 1 });
            }, 0)
            .fromTo(
              words(scope.querySelector('.db-hero-lead')),
              { yPercent: 122, autoAlpha: 0, filter: 'blur(8px)' },
              {
                yPercent: 0,
                autoAlpha: 1,
                filter: 'blur(0px)',
                duration: 1.05,
                ease: 'power4.out',
                stagger: 0.045,
              },
              0.1,
            )
            .fromTo(
              words(scope.querySelector('.db-logotype')),
              { yPercent: 126, autoAlpha: 0 },
              { yPercent: 0, autoAlpha: 1, duration: 1.25, ease: 'expo.out', stagger: 0.04 },
              0.3,
            )
            .fromTo(
              '.db-hero-card',
              { autoAlpha: 0, x: 18 },
              { autoAlpha: 1, x: 0, duration: 0.9 },
              0.85,
            )
            .fromTo(
              '.db-hero-foot > *',
              { autoAlpha: 0, y: 22 },
              { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.1 },
              0.95,
            );
          introRef.current = timeline;

          /* 스크롤 리빌 */
          scope.querySelectorAll<HTMLElement>('[data-db-split]').forEach((el) => {
            if (el.closest('.db-hero')) return;
            gsap.set(el, { autoAlpha: 1 });
            gsap.fromTo(
              words(el),
              { yPercent: 116, autoAlpha: 0, filter: 'blur(8px)' },
              {
                yPercent: 0,
                autoAlpha: 1,
                filter: 'blur(0px)',
                duration: 1,
                ease: 'power4.out',
                stagger: 0.04,
                scrollTrigger: { trigger: el, start: 'top 88%', once: true },
              },
            );
          });

          scope.querySelectorAll<HTMLElement>('[data-db-reveal]').forEach((el) => {
            if (el.closest('.db-hero')) return;
            gsap.fromTo(
              el,
              { autoAlpha: 0, y: 28 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.95,
                ease: 'power4.out',
                scrollTrigger: { trigger: el, start: 'top 90%', once: true },
              },
            );
          });

          /* scroll room — 사진이 방처럼 머무는 동안 정보가 지나간다 */
          scope.querySelectorAll<HTMLElement>('[data-db-trust]').forEach((row) => {
            ScrollTrigger.create({
              trigger: row,
              start: 'top 68%',
              end: 'bottom 42%',
              onToggle: (self) => row.classList.toggle('db-is-active', self.isActive),
            });
          });

          const roomBg = scope.querySelector('.db-room .db-media-bg');
          if (roomBg) {
            gsap.fromTo(
              roomBg,
              { scale: 1.14 },
              {
                scale: 1,
                ease: 'none',
                scrollTrigger: {
                  trigger: '.db-room',
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1.1,
                },
              },
            );
          }

          /* 색면 패럴랙스 */
          ['.db-example', '.db-band', '.db-finale'].forEach((selector) => {
            const section = scope.querySelector(selector);
            const bg = section?.querySelector('.db-media-bg');
            if (!bg) return;
            gsap.fromTo(
              bg,
              { yPercent: -6, scale: 1.1 },
              {
                yPercent: 6,
                scale: 1.1,
                ease: 'none',
                scrollTrigger: {
                  trigger: section,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1.1,
                },
              },
            );
          });

          /* 히어로 미디어 얕은 패럴랙스 */
          gsap.to('.db-hero-media', {
            yPercent: 9,
            ease: 'none',
            scrollTrigger: {
              trigger: '.db-hero',
              start: 'top top',
              end: 'bottom top',
              scrub: 1,
            },
          });

          /* 마그네틱 CTA — 포인터가 있는 환경만 */
          if (!window.matchMedia('(pointer: coarse)').matches) {
            scope.querySelectorAll<HTMLElement>('[data-db-magnetic]').forEach((el) => {
              const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
              const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
              const move = (event: PointerEvent) => {
                const rect = el.getBoundingClientRect();
                xTo((event.clientX - rect.left - rect.width / 2) * 0.2);
                yTo((event.clientY - rect.top - rect.height / 2) * 0.2);
              };
              const leave = () => {
                xTo(0);
                yTo(0);
              };
              el.addEventListener('pointermove', move);
              el.addEventListener('pointerleave', leave);
            });
          }
        }, scope);

        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener('load', refresh);
        if (document.fonts?.ready) void document.fonts.ready.then(refresh);

        setState('ready');
        if (wantsPlay.current) introRef.current?.play();

        dispose = () => {
          window.removeEventListener('load', refresh);
          gsap.ticker.remove(raf);
          lenis.destroy();
          ctx.revert();
          introRef.current = null;
        };
        if (disposed) dispose();
      } catch (error) {
        setState('off');
        console.warn('[dearbloom] 모션 스택을 불러오지 못해 정적 레이아웃으로 표시합니다.', error);
      }
    })();

    return () => {
      disposed = true;
      dispose?.();
    };
  }, [rootRef]);

  useEffect(() => {
    if (!entered) return;
    wantsPlay.current = true;
    introRef.current?.play();
  }, [entered]);

  return state;
}
