'use client';

/**
 * 판정 카드 — 짜 놓은 다발을 우리 데이터가 읽어 주는 자리.
 *
 * 순서는 §1.5h·§1.5i 의 위계를 그대로 따른다:
 *   ① 담긴 것(무엇을 짰는지)  ② 안전  ③ 색  ④ 향  ⑤ 이 다발이 품는 말들  ⑥ 사러 가기
 * 안전이 위에 있는 이유는 그것만이 **되돌릴 수 없는 사실**이기 때문이고, 그 아래로는
 * "정보" 가 아니라 "이야기" 가 먼저다(§1.5i 의 원칙).
 *
 * 이 파일은 **문장을 만들지 않는다.** 화면에 나가는 한국어는 전부 엔진
 * (`lib/engine/bouquet.ts`)이 만들어 온 것을 그대로 건다 — 그래야 그 문장들이 테스트로
 * 잠기고, 화면이 데이터보다 다정해지는 일이 생기지 않는다.
 * ⚠ 여기서 판정 문장을 새로 쓰지 마라. 쓸 말이 있으면 엔진에 쓰고 테스트를 함께 남겨라.
 */

import type { BouquetVerdict as Verdict } from '@/lib/engine/bouquet';

import { MEANING_CONFIDENCE_KO, SPECIES_KO } from './labels';
import styles from './bouquet.module.css';
import type { BouquetFlowerView } from './types';

export interface BouquetVerdictProps {
  verdict: Verdict;
  /** 색의 hex·「사러 가기」 검색어·안전 출처를 되찾는 표. */
  flowers: BouquetFlowerView[];
  onBuy: (searchName: string) => void;
}

export default function BouquetVerdict({ verdict, flowers, onBuy }: BouquetVerdictProps) {
  const byId = new Map(flowers.map((flower) => [flower.id, flower]));

  /** 색 슬러그 → 스와치. 엔진 타입에는 hex 가 없다(엔진이 알 값이 아니다). */
  function swatchOf(flowerId: string, colorValue: string) {
    return byId.get(flowerId)?.paletteKo.find((color) => color.value === colorValue);
  }

  /**
   * 안전 판정의 **근거 주소**. 그 종의 행이 들고 있는 `source_url` 이다.
   * 위험하다고만 말하고 어디서 온 판정인지 못 보여 주면 그 경고는 우리 의견이 된다.
   */
  function safetySource(flowerId: string, species: 'cat' | 'dog') {
    return byId.get(flowerId)?.petSafety.find((row) => row.species === species)?.sourceUrl;
  }

  const { pet } = verdict;

  return (
    <section className={styles.verdict} aria-labelledby="bq-verdict-title">
      <div className={styles.wrap}>
        <p className={styles.stepNo}>04</p>
        <h2 className={styles.stepTitle} id="bq-verdict-title">
          짜 보신 다발
        </h2>

        {/* ── ① 담긴 것 ─────────────────────────────────────────── */}
        <ul className={styles.stems}>
          {verdict.stems.map((stem) => {
            const swatch = stem.color ? swatchOf(stem.flower.id, stem.color.value) : undefined;
            return (
              <li className={styles.stem} key={stem.flower.id}>
                <span
                  className={
                    swatch?.needsRing ? `${styles.dot} ${styles.dotRing}` : styles.dot
                  }
                  style={swatch ? { background: swatch.hex } : undefined}
                  aria-hidden="true"
                />
                <span className={styles.stemBody}>
                  <span className={styles.stemName}>{stem.flower.nameKo}</span>
                  <span className={styles.stemMeta}>
                    {stem.slot === 'main' ? '가운데' : '곁들이'}
                    {stem.color ? ` · ${stem.color.label}` : ''}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        {/* ── ② 안전 (§1.5h — 직설. 위험이 없으면 이 블록 자체가 없다) ── */}
        {pet !== null ? (
          <div className={styles.alert} role="status">
            <p className={styles.alertHead}>{pet.headline}</p>
            {pet.swap ? <p className={styles.alertSwap}>{pet.swap}</p> : null}
            <ul className={styles.sources}>
              {pet.blocked.map((flower) => {
                const href = safetySource(flower.id, pet.species[0]);
                if (href === undefined) return null;
                return (
                  <li key={flower.id}>
                    <a
                      className={styles.sourceLink}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {flower.nameKo} · {SPECIES_KO[pet.species[0]]} 독성 근거
                      <span className={styles.srOnly}> (새 창)</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {/*
          빼지는 않지만 알려야 하는 주의 — `exclude()` 가 쓴 문장 **그대로**다.
          접어 두는 것이 §1.5h 다("상세는 접힘/툴팁"): 세 줄기 다발이면 고양이·강아지 몫이
          각각 붙어 넉 줄이 되는데, 그 넉 줄이 펼쳐진 채로 서면 화면이 안전 고지문이 된다.
          위험(serious 이상)은 위 배너가 **접지 않고** 말한다 — 접는 것은 가벼운 쪽뿐이다.
        */}
        {verdict.mildCautions.length > 0 ? (
          <details className={styles.cautions}>
            <summary className={styles.cautionsHead}>
              가벼운 주의 {verdict.mildCautions.length}가지
            </summary>
            <ul className={styles.cautionList}>
              {verdict.mildCautions.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </details>
        ) : null}

        {/* ── ③ 색 · ④ 향 ──────────────────────────────────────── */}
        <div className={styles.readings}>
          <div className={styles.reading}>
            <h3 className={styles.readingTitle}>색은 어떻게 만나나</h3>
            {verdict.color.notes.map((note) => (
              <p className={styles.readingSay} key={note}>
                {note}
              </p>
            ))}
          </div>

          <div className={styles.reading}>
            <h3 className={styles.readingTitle}>향은 어떤가</h3>
            <p className={styles.readingSay}>{verdict.fragrance.note}</p>
          </div>
        </div>

        {/* ── ⑤ 이 다발이 품는 말들 ─────────────────────────────── */}
        {verdict.meanings.length > 0 ? (
          <div className={styles.meanings}>
            <h3 className={styles.readingTitle}>이 다발이 품는 말들</h3>
            <ul className={styles.meaningList}>
              {verdict.meanings.map((line) => (
                <li className={styles.meaning} key={`${line.flower.id}-${line.color.value}`}>
                  <p className={styles.meaningText}>‘{line.meaningKo}’</p>
                  <p className={styles.meaningFrom}>
                    {line.color.label} {line.flower.nameKo}
                    {line.confidence ? ` — ${MEANING_CONFIDENCE_KO[line.confidence]}` : ''}
                  </p>
                </li>
              ))}
            </ul>
            <p className={styles.meaningNote}>
              꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. 여기 적은 말은 저희가
              출처를 찾아 둔 갈래 하나예요.
            </p>
          </div>
        ) : null}

        {/* ── ⑥ 사러 가기 ──────────────────────────────────────── */}
        <div className={styles.buys}>
          <h3 className={styles.readingTitle}>이 다발, 어디서 사지</h3>
          <div className={styles.buyRow}>
            {verdict.stems.map((stem) => {
              const searchName = byId.get(stem.flower.id)?.buyName;
              if (searchName === undefined) return null;
              return (
                <button
                  key={stem.flower.id}
                  type="button"
                  className={styles.buyBtn}
                  onClick={() => onBuy(searchName)}
                >
                  ‘{searchName}’ 사러 가기
                </button>
              );
            })}
          </div>
          <p className={styles.buyDisc}>
            값과 재고는 저마다 그때그때 달라요 — 여기서는 길만 이어드려요.
          </p>
        </div>
      </div>
    </section>
  );
}
