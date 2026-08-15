'use client';

/**
 * 추천 결과 두 갈래를 그리는 표시 전용 컴포넌트.
 * 문장은 전부 엔진이 만든 실제 값이다 — 여기서 지어내는 문구는 라벨·안내뿐이다.
 */

import { FlowerMark, IconShield } from './icons';
import styles from './groups.module.css';
import type { FlowerView, GroupPlanView, MemberAssignment } from './types';

/** "프리지아 (흰색)" — 색 정보가 없는 꽃이면 이름만. */
function flowerTitle(flower: FlowerView): string {
  return flower.colorLabel ? `${flower.nameKo} (${flower.colorLabel})` : flower.nameKo;
}

function Cautions({ items, label }: { items: string[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <ul className={styles.cautions} aria-label={label}>
      {items.map((text) => (
        <li key={text}>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

function AssignmentRow({ item }: { item: MemberAssignment }) {
  const flower = item.flower;

  return (
    <li>
      <span className={styles.art}>
        {flower ? (
          <FlowerMark flowerId={flower.id} label={`${flower.nameKo} 일러스트`} />
        ) : (
          <FlowerMark flowerId="none" />
        )}
      </span>
      <div className={styles.aBody}>
        <p className={styles.aTo}>{item.name}</p>
        {flower === null ? (
          <>
            <h3 className={styles.aName}>고를 수 있는 꽃이 없었어요</h3>
            <p className={styles.aWhy}>
              골라 주신 것들이 서로 부딪혀서 남는 꽃이 없었어요. 색이나 향 하나만 풀어 주시겠어요?
            </p>
          </>
        ) : (
          <>
            <h3 className={styles.aName}>{flowerTitle(flower)}</h3>
            {flower.meaningKo ? <p className={styles.aMean}>“{flower.meaningKo}”</p> : null}
            {flower.colorReason ? <p className={styles.aWhy}>{flower.colorReason}</p> : null}
            {item.memo.length > 0 ? (
              <ul className={styles.memo} aria-label={`${item.name}에 대해 들려주신 이야기`}>
                {item.memo.map((chip) => (
                  <li key={chip}>{chip}</li>
                ))}
              </ul>
            ) : null}
            <Cautions items={flower.cautions} label={`${item.name}의 꽃에 붙은 안내`} />
          </>
        )}
      </div>
    </li>
  );
}

export function IndividualPanel({ view }: { view: GroupPlanView }) {
  return (
    <>
      <ul className={styles.assign}>
        {view.individual.map((item) => (
          <AssignmentRow key={`${item.name}-${item.flower?.id ?? 'none'}`} item={item} />
        ))}
      </ul>
      {/* §1.5c 각각 모드 각주 */}
      <p className={styles.note}>같은 꽃이 겹치지 않게 나눠 드려요.</p>
    </>
  );
}

export function BouquetPanel({ view }: { view: GroupPlanView }) {
  const { flowers, excluded, caution } = view.bouquet;

  return (
    <>
      <figure className={styles.bqMedia}>
        <span className={styles.bqPhoto} aria-hidden="true" />
        <span className={styles.bqScrim} aria-hidden="true" />
        <figcaption className={styles.bqCap}>
          {flowers.length > 0
            ? `${flowers.length}가지 꽃을 한 다발로 묶었어요.`
            : '한 다발로 묶을 꽃이 남지 않았어요.'}
        </figcaption>
        <span className={styles.bqCredit}>Photo: dariana / Unsplash</span>
      </figure>

      {flowers.length > 0 ? (
        <ul className={styles.bqList}>
          {flowers.map((flower) => (
            <li key={flower.id}>
              <span className={styles.bqArt}>
                <FlowerMark flowerId={flower.id} />
              </span>
              <div className={styles.bqBody}>
                <h3 className={styles.bqName}>{flowerTitle(flower)}</h3>
                {flower.meaningKo ? <p className={styles.bqMean}>{flower.meaningKo}</p> : null}
                {!flower.meaningKo && flower.colorReason ? (
                  <p className={styles.bqMean}>{flower.colorReason}</p>
                ) : null}
                <Cautions items={flower.cautions} label={`${flower.nameKo}에 붙은 안내`} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.note}>
          함께 받는 분 모두에게 안전한 꽃이 남지 않았어요. 아래에서 하나만 풀어 주시겠어요?
        </p>
      )}

      {/* 교집합 안전 검사 — 이 화면이 존재하는 이유 (§1.5c) */}
      {caution ? (
        <aside className={styles.safety} aria-label="모두에게 안전한지 살펴본 결과">
          <span className={styles.safetyIcon} aria-hidden="true">
            <IconShield />
          </span>
          <div>
            <p className={styles.safetyOver}>Safety check</p>
            <p className={styles.safetyBody}>{caution}</p>
          </div>
        </aside>
      ) : null}

      {excluded.length > 0 ? (
        <section aria-labelledby="bq-excluded">
          <p className={styles.note} id="bq-excluded">
            부케에서 뺀 꽃 {excluded.length}종
          </p>
          <ul className={styles.excluded}>
            {excluded.map((item) => (
              <li key={item.nameKo}>
                <p className={styles.exName}>{item.nameKo}</p>
                <p className={styles.exReason}>{item.reason}</p>
                {item.because.length > 0 ? (
                  <p className={styles.exBecause}>{item.because.join(' · ')}님을 생각해서예요</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
