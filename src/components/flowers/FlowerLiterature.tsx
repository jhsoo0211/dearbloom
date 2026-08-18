/**
 * 도감 상세의 「문학 속의 이 꽃」 — 그 꽃이 실제로 적혀 있던 원문 발췌들(§1.5k).
 *
 * ── 왜 도감에도 서나 (2026-08-18) ────────────────────────────────────
 * quotes.csv 의 문학 발췌 86행(36종)은 여태 **추천 결과 화면에서만** 보였다. 추천을 거치지
 * 않고 그 꽃을 알아보러 곧장 들어온 사람에게는 없는 자료였던 셈이다 — 「사러 가기」가
 * 겪은 것과 같은 모양의 구멍이라 같은 자리에서 메운다.
 *
 * ── 결과 화면과 무엇이 같고 무엇이 다른가 ───────────────────────────
 * **조판은 같다.** 세리프 이탤릭 발췌 · 소형 원문 병기 · 각주 한 줄 · 왼쪽 선을 두른
 * caveat — 같은 원전을 두 화면이 다른 결로 세우면 어느 쪽이 이 서비스의 인용인지 흐려진다.
 * (CSS 는 그러나 **도감 제 파일**에 있다. 결과 화면 모듈을 도감이 끌어다 쓰면 한쪽 화면의
 * 여백 조정이 다른 화면을 조용히 밀어 버린다.)
 *
 * **분량은 다르다.** 결과 화면은 대표 한 편만 세우고 나머지는 버튼 뒤로 넘긴다 —
 * 거기서 문학은 멘트 아래 곁들임이라 첫 화면이 목록이 되면 곁들임이 본문을 이긴다.
 * 도감은 아카이브라 **전 행을 그대로 편다.** 다만 다섯 편이 넘으면 나머지는 접어 둔다
 * (빨간 장미 9편 — 스크롤이 발췌 목록에 먹히면 아래의 참고·사러 가기가 사라진다).
 * 접는 도구는 `<details>` 다: JS 없이 열리고, 크레딧 폴드(`.creditFold`)와 같은 규칙이다.
 *
 * ⚠ **원문을 화면 사정으로 고치지 마라.** 한문·1925년 초판 표기는 이미 렌더 가능한
 *   형태로 적재돼 있고(옛한글 자모 → 현대 완성형 옮김, 어휘·어순·종성은 그대로 —
 *   복원 대조표는 `docs/literature-research-2.md` §6), 그 판단의 흔적은 `caveat` 와
 *   `translatorNote` 가 화면에서 직접 말한다. 여기서 덧붙이거나 덜어 내면 그 두 줄이
 *   거짓말이 된다.
 */

import type { LiteratureView } from './types';
import styles from './flowers.module.css';

/**
 * 접지 않고 그대로 세우는 편 수.
 *
 * 36종 중 이 선을 넘는 것은 빨간 장미(9편) 하나뿐이라, 사실상 "장미만 접힌다".
 * 그래도 상수로 두는 이유는 발췌가 늘어날 표이기 때문이다 — 다음 배치가 들어오면
 * 화면이 저절로 접는다.
 */
const OPEN_COUNT = 5;

export interface FlowerLiteratureProps {
  /** 서버가 §1.5k 차례로 세워 둔 발췌 전부. 빈 배열이면 호출부가 구획을 세우지 않는다. */
  items: LiteratureView[];
}

/** 발췌 한 편. 결과 화면의 `.lit` 조판을 도감 규격으로 옮긴 것이다. */
function Excerpt({ item }: { item: LiteratureView }) {
  return (
    <figure className={styles.lit}>
      {item.typeLabel && <p className={styles.litType}>{item.typeLabel}</p>}

      <blockquote className={styles.litQuote}>
        <p className={styles.litKo}>{item.textKo}</p>
      </blockquote>

      {/*
        원문 병기 — 번역으로는 살지 않는 것들이 여기 남는다(한시의 대구, 초판의 붙여쓰기).
        한자·라틴어·가나·옛 표기가 섞여 오므로 줄바꿈을 막지 않는다.
      */}
      {item.textOriginal && <p className={styles.litOrig}>{item.textOriginal}</p>}

      {/*
        각주 한 벌은 `<figcaption>` **하나**로 묶는다. 출처와 caveat 를 따로 세우면
        caption 이 figure 의 첫째도 막내도 아닌 자리에 놓여 HTML 이 깨지고(figcaption 은
        first/last child 여야 한다), 낭독기에도 그림 설명이 둘로 갈려 들린다.
      */}
      <figcaption className={styles.litFoot}>
        <p className={styles.litBy}>
          {/*
            링크는 **제목에만** 건다(§1.5i 각주 톤). 새 창으로 열리는 링크는 그 사실을 미리
            알린다(P1-6) — 화면 낭독기 사용자는 창이 바뀐 뒤에야 알아채면 돌아올 길을 잃는다.
          */}
          {item.sourceUrl ? (
            <a className={styles.sourceLink} href={item.sourceUrl} target="_blank" rel="noreferrer">
              {item.attribution}
              <span className={styles.srOnly}> (새 창)</span>
            </a>
          ) : (
            item.attribution
          )}
          {item.translatorNote && (
            <>
              <span className={styles.litSep} aria-hidden="true">
                ·
              </span>
              {item.translatorNote}
            </>
          )}
        </p>

        {/*
          밝히지 않으면 서비스가 틀린 정보를 주게 되는 한 줄이다 — 진달래와 철쭉이 다른
          종이라는 것, 매화가 매실나무의 꽃이라는 것, 초판 표기를 옮겨 적었다는 것.
          각주 중에서도 이것만 왼쪽 선을 둘러 따로 세운다(결과 화면 `.litCaveat` 과 같은 처리).
        */}
        {item.caveat && <p className={styles.litCaveat}>{item.caveat}</p>}
      </figcaption>
    </figure>
  );
}

export default function FlowerLiterature({ items }: FlowerLiteratureProps) {
  const shown = items.slice(0, OPEN_COUNT);
  const folded = items.slice(OPEN_COUNT);

  return (
    <>
      <div className={styles.lits}>
        {shown.map((item) => (
          <Excerpt item={item} key={item.id} />
        ))}
      </div>

      {folded.length > 0 && (
        <details className={styles.litFold}>
          <summary className={styles.litFoldSum}>
            남은 {folded.length}편 더 보기
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>
          <div className={styles.lits}>
            {folded.map((item) => (
              <Excerpt item={item} key={item.id} />
            ))}
          </div>
        </details>
      )}
    </>
  );
}
