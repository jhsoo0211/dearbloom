'use client';

/**
 * 다발 짜기 — 주 꽃 하나 · 곁들이 0~2 · 색 하나를 고르면 판정 카드가 따라 선다.
 *
 * ── 서버를 부르지 않는다 ─────────────────────────────────────────────
 * 이 화면에는 서버 액션이 하나도 없다. 카탈로그 59종은 서버 컴포넌트가 props 로
 * 한 번에 실어 보내고(`build.ts`), 조합을 바꿀 때마다 브라우저가 `judgeBouquet()` 을
 * 다시 부른다. 정적 드롭 데모(`out/`)와 본배포가 **글자 한 자까지 같은 화면**인 이유다.
 * ⚠ 여기에 `fetch`·서버 액션을 들이지 마라. 들이는 순간 정적 zip 에서 이 화면이 죽는다.
 *
 * ── 순서가 곧 화면이다 ───────────────────────────────────────────────
 * ① 주 꽃 → ② 곁들이 → ③ 색 → ④ 판정. 뒤 단계를 숨기지 않는 이유: 주 꽃은 처음부터
 * 하나 정해져 있어서(목록 첫 종) 화면이 **빈 채로 시작하지 않는다.** 판정 카드가 처음부터
 * 서 있고, 고를 때마다 그 카드가 바뀐다 — "다 고른 뒤 결과 보기" 버튼을 누르는 화면보다
 * 무엇이 무엇을 바꾸는지 훨씬 빨리 알 수 있다.
 *
 * 컨트롤 규격은 §1.6b 다(pill · h44 고정 · 선택은 짝 채움 하나로만). 선택 표현을 밑줄·점으로
 * 늘리지 마라 — 같은 의미의 컨트롤이 화면마다 다른 모양이면 그것부터 읽힌다.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';

import BuySheet from '@/components/flowers/BuySheet';
import {
  MAX_ACCENTS,
  accentCandidates,
  judgeBouquet,
  mainCandidates,
} from '@/lib/engine/bouquet';

import BouquetVerdict from './BouquetVerdict';
import styles from './bouquet.module.css';
import type { BouquetFlowerView } from './types';

export interface BouquetStudioProps {
  flowers: BouquetFlowerView[];
}

/** 칩 하나에 서는 세밀화 썸네일. 도판이 없으면 자리 자체를 만들지 않는다. */
function ChipPlate({ flower }: { flower: BouquetFlowerView }) {
  if (!flower.plate) return null;
  return (
    <span className={styles.chipPlate} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- 자체 호스팅 도판(160px 썸네일). next/image 최적화는 도입하지 않았다(docs/illustration-assets.md). */}
      <img className={styles.chipImg} src={flower.plate.src} alt="" loading="lazy" decoding="async" />
    </span>
  );
}

export default function BouquetStudio({ flowers }: BouquetStudioProps) {
  const mains = useMemo(() => mainCandidates(flowers), [flowers]);
  const accents = useMemo(() => accentCandidates(flowers), [flowers]);

  /* 빈 화면으로 시작하지 않는다 — 목록의 첫 종이 처음부터 서 있고 판정도 함께 선다. */
  const [mainId, setMainId] = useState(() => mains[0]?.id ?? '');
  const [accentIds, setAccentIds] = useState<string[]>([]);
  const [colorValue, setColorValue] = useState<string | undefined>(undefined);
  /** 열려 있는 「사러 가기」 시트의 검색어. 닫혀 있으면 `null`. */
  const [buying, setBuying] = useState<string | null>(null);

  const main = flowers.find((flower) => flower.id === mainId);

  const verdict = useMemo(
    () => judgeBouquet({ mainId, colorValue, accentIds }, flowers),
    [mainId, colorValue, accentIds, flowers],
  );

  /**
   * 주 꽃 고르기.
   *   · 색은 다시 고른다 — 꽃마다 나오는 색이 다르다.
   *   · 곁들이로 이미 골라 뒀던 같은 꽃은 뗀다. 판정은 어차피 그 중복을 떨어뜨리는데
   *     (`judgeBouquet` 의 `taken`), 칩만 「채워진 채 잠긴」 상태로 남아 담기지도 않은 꽃이
   *     담긴 것처럼 보인다.
   */
  function pickMain(id: string) {
    setMainId(id);
    setColorValue(undefined);
    setAccentIds((prev) => (prev.includes(id) ? prev.filter((one) => one !== id) : prev));
  }

  /**
   * 곁들이 토글. 상한(2)을 넘기면 **가장 먼저 고른 것이 빠진다** — 잠긴 칩을 누르고
   * 아무 일도 안 일어나는 것보다, 방금 누른 것이 담기는 쪽이 손에 맞는다.
   */
  function toggleAccent(id: string) {
    setAccentIds((prev) => {
      if (prev.includes(id)) return prev.filter((one) => one !== id);
      const next = [...prev, id];
      return next.length > MAX_ACCENTS ? next.slice(next.length - MAX_ACCENTS) : next;
    });
  }

  if (!main || !verdict) {
    /* 카탈로그가 비어 있을 때만 닿는 갈래다(실제로는 59종이 늘 있다). */
    return null;
  }

  const palette = main.paletteKo;
  const activeColor = verdict.color.main?.value;

  return (
    <div className={styles.studio}>
      {/* ── ① 주 꽃 ─────────────────────────────────────────────── */}
      <section className={styles.step} aria-labelledby="bq-main-title">
        <div className={styles.wrap}>
          <p className={styles.stepNo}>01</p>
          <h2 className={styles.stepTitle} id="bq-main-title">
            가운데 설 꽃 하나
          </h2>
          <p className={styles.stepSay}>
            다발의 얼굴이 될 꽃이에요. 도감에 있는 {mains.length}종 전부에서 고를 수 있어요.
          </p>

          <div className={styles.chipGrid} role="group" aria-labelledby="bq-main-title">
            {mains.map((flower) => {
              const on = flower.id === mainId;
              return (
                <button
                  key={flower.id}
                  type="button"
                  className={on ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                  aria-pressed={on}
                  onClick={() => pickMain(flower.id)}
                >
                  <ChipPlate flower={flower} />
                  <span className={styles.chipName}>{flower.nameKo}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ② 곁들이 ────────────────────────────────────────────── */}
      <section className={styles.step} aria-labelledby="bq-accent-title">
        <div className={styles.wrap}>
          <p className={styles.stepNo}>02</p>
          <h2 className={styles.stepTitle} id="bq-accent-title">
            곁에 둘 것 (최대 {MAX_ACCENTS}가지)
          </h2>
          <p className={styles.stepSay}>
            가운데 꽃을 받쳐 주는 자리예요. 없어도 다발은 성립해요 — 안 고르셔도 괜찮아요.
          </p>

          <div className={styles.chipGrid} role="group" aria-labelledby="bq-accent-title">
            {accents.map((flower) => {
              const on = accentIds.includes(flower.id);
              const isMain = flower.id === mainId;
              return (
                <button
                  key={flower.id}
                  type="button"
                  className={on ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                  aria-pressed={on}
                  disabled={isMain}
                  onClick={() => toggleAccent(flower.id)}
                >
                  <ChipPlate flower={flower} />
                  <span className={styles.chipName}>{flower.nameKo}</span>
                  {isMain ? <span className={styles.srOnly}> (가운데 꽃으로 이미 골랐어요)</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ③ 색 ────────────────────────────────────────────────── */}
      <section className={styles.step} aria-labelledby="bq-color-title">
        <div className={styles.wrap}>
          <p className={styles.stepNo}>03</p>
          <h2 className={styles.stepTitle} id="bq-color-title">
            {main.nameKo}, 어떤 색으로
          </h2>
          <p className={styles.stepSay}>
            그 꽃이 실제로 나오는 색만 세워 뒀어요. 색마다 품는 말이 다를 때는 아래 카드가
            그 말을 함께 들려드려요.
          </p>

          {palette.length > 0 ? (
            <div className={styles.swatches} role="group" aria-labelledby="bq-color-title">
              {palette.map((color) => {
                const on = color.value === activeColor;
                return (
                  <button
                    key={color.value}
                    type="button"
                    className={on ? `${styles.swatch} ${styles.swatchOn}` : styles.swatch}
                    aria-pressed={on}
                    onClick={() => setColorValue(color.value)}
                  >
                    <span
                      className={color.needsRing ? `${styles.dot} ${styles.dotRing}` : styles.dot}
                      style={{ background: color.hex }}
                      aria-hidden="true"
                    />
                    <span className={styles.swatchName}>{color.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className={styles.stepSay}>이 꽃은 색 정보가 아직 없어요 — 색 없이 짜 볼게요.</p>
          )}
        </div>
      </section>

      {/* ── ④ 판정 ──────────────────────────────────────────────── */}
      <BouquetVerdict
        verdict={verdict}
        flowers={flowers}
        onBuy={(name) => setBuying(name)}
      />

      {/* ── ⑤ 이어지는 길 ───────────────────────────────────────── */}
      <section className={styles.next} aria-labelledby="bq-next-title">
        <div className={styles.wrap}>
          <span className={styles.eyebrow}>Next</span>
          <h2 className={styles.nextTitle} id="bq-next-title">
            이 조합, 마음에 드셨다면
          </h2>
          <p className={styles.lead}>
            담긴 꽃 하나하나가 어떤 이야기를 품는지는 도감에 더 적어 뒀어요. 무엇을 골라야
            할지부터 막막하다면 추천부터 받아 보셔도 좋아요.
          </p>
          <div className={styles.nextRow}>
            <Link className={styles.btn} href="/recommend">
              45초 만에 추천받기
            </Link>
            <Link className={styles.ghostBtn} href="/flowers">
              꽃 도감 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {buying !== null && <BuySheet flowerName={buying} onClose={() => setBuying(null)} />}
    </div>
  );
}
