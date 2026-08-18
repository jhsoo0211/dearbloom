'use client';

/**
 * 공유 화면 `/r` — **건네받은 결과를 읽는 자리.**
 *
 * ── 왜 클라이언트에서 푸는가 ─────────────────────────────────────────
 * 부호는 쿼리(`?c=…`)에 있다. 서버에서 `searchParams` 를 읽으면 그 페이지는 요청 시점
 * 렌더가 되고, 정적 드롭 데모(`output: 'export'`)에서는 그 자체가 빌드 실패다.
 * 반대로 여기서 `location.search` 를 읽으면 **한 벌의 코드가 두 배포에서 그대로 돈다** —
 * 본배포에서는 서버 액션이, 데모에서는 브라우저 어댑터가 카탈로그를 대 준다(쌍둥이 규칙).
 *
 * ── 읽기 전용이다 ────────────────────────────────────────────────────
 * 색 고르기·이야기 시트·멘트·구매 버튼이 없다. 받는 사람은 **무엇을 골랐는지** 보고,
 * 마음이 동하면 자기 것을 고르러 간다. 건넨 사람의 화면을 흉내 내면 그 사람이 아직
 * 고르는 중인 값(색·톤)을 남이 확정된 것처럼 보게 된다.
 *
 * ── 링크에 없는 것을 화면이 먼저 말한다 ──────────────────────────────
 * 자유 서술도 멘트도 이 주소에 실려 있지 않다(`share-link.ts`). 그 사실을 맨 아래에서
 * 한 줄로 밝힌다 — 받는 사람이 "내 얘기가 어디까지 넘어왔나" 를 궁금해할 자리다.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { describeShare } from '@/app/recommend/actions';
import { shareCodeFromSearch } from './share-link';
import type { SharePayload } from './types';
import styles from './flow.module.css';

/** 부호가 아예 없는 주소(`/r` 만 열었다). 조작된 부호와는 다른 사정이라 문장도 다르다. */
const NO_CODE = '건네받은 링크가 아니에요. 아래에서 직접 골라보시겠어요?';

/**
 * 링크에 무엇이 실려 있지 않은지 — 지우지 마라.
 *
 * 이 한 줄이 없으면 받는 사람은 보낸 사람이 적은 이야기까지 이 주소에 들어 있다고 여긴다.
 * 실제로는 꽃 셋과 관계·마음뿐이고(`share-link.ts` 머리말), 그 사실을 아는 것이
 * 보내는 쪽에도 안심이 된다.
 */
const NOTHING_PRIVATE =
  '이 링크에는 고른 꽃과 관계·마음만 담겨 있어요. 적어 주신 이야기나 멘트는 담기지 않아요.';

function IconArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h13M12.5 6l6 6-6 6" />
    </svg>
  );
}

export default function SharedPick() {
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  /*
   * 부호는 **주소창**에 있다 — 리액트 바깥의 값이라 첫 그리기 뒤에 읽는다.
   * 서버 HTML(불러오는 중)과 하이드레이션 첫 렌더가 같아야 하기 때문이기도 하다.
   *
   * 판정까지 통째로 async 안에서 하는 이유는 effect 본문에서 setState 를 부르지 않기
   * 위해서다(연쇄 렌더 규칙). 부호가 아예 없는 경우도 같은 문을 지난다 — 화면 상태를
   * 바꾸는 자리가 한 곳이면 "불러오는 중" 이 걸려 남는 경로가 생기지 않는다.
   */
  useEffect(() => {
    let alive = true;

    void (async () => {
      const code = shareCodeFromSearch(window.location.search);
      if (code === '') {
        if (alive) {
          setMessage(NO_CODE);
          setPending(false);
        }
        return;
      }

      let response;
      try {
        response = await describeShare(code);
      } catch {
        // 네트워크가 끊겼거나(본배포) 청크를 못 받았다(데모). 둘 다 화면은 문장으로 선다.
        if (alive) {
          setMessage('링크를 여는 길이 잠깐 끊겼어요. 조금 뒤에 다시 열어 주세요.');
          setPending(false);
        }
        return;
      }
      if (!alive) return;
      if (response.ok) setPayload(response.payload);
      else setMessage(response.message);
      setPending(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className={`${styles.flow} ${styles.frame}`}>
      <header className={`${styles.bar} ${styles.appbar}`}>
        <Link className={styles.wm} href="/">
          dearbloom
        </Link>
        <span className={styles.spacer} />
        <Link className={styles.iconBtn} href="/" aria-label="홈으로">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />
            <path d="M9.6 20.5v-5.6h4.8v5.6" />
          </svg>
        </Link>
      </header>

      <div className={`${styles.phone} ${styles.phoneResult}`}>
        <main className={styles.rmain}>
          <section className={styles.sect} aria-labelledby="share-h">
            <p className={styles.overline} id="share-h">
              Shared <span className={styles.ko}>건네받은 꽃</span>
            </p>

            {/* 값이 채워지는 순간이 곧 안내다 — 빈 채로 미리 서 있어야 낭독기가 읽는다. */}
            <p className="sr-only" role="status">
              {pending ? '' : payload ? '건네받은 꽃 세 가지를 불러왔어요.' : (message ?? '')}
            </p>

            {pending ? (
              <p className={styles.shareLede}>건네받은 꽃을 꺼내는 중이에요…</p>
            ) : payload ? (
              <>
                <p className={styles.shareLede}>이런 마음으로 골랐대요</p>
                <ul className={styles.cueChips}>
                  {payload.chips.map((chip) => (
                    <li className={styles.tagline} key={chip}>
                      {chip}
                    </li>
                  ))}
                </ul>

                <ul className={styles.shareList}>
                  {payload.flowers.map((flower) => (
                    <li className={styles.shareCard} key={flower.flowerId}>
                      {flower.photo ? (
                        <span className={styles.shareShot}>
                          {/* eslint-disable-next-line @next/next/no-img-element -- Unsplash 원격 CDN. 승인 URL 을 그대로 쓴다(docs/image-assets.md). */}
                          <img
                            className={
                              flower.photo.bright
                                ? `${styles.shareImg} ${styles.shotBright}`
                                : styles.shareImg
                            }
                            src={flower.photo.src}
                            alt={flower.photo.alt}
                            decoding="async"
                            loading="lazy"
                          />
                        </span>
                      ) : null}

                      <div className={styles.shareBody}>
                        <h2 className={styles.shareName}>{flower.nameKo}</h2>
                        <p className={styles.flSci}>{flower.scientificName}</p>

                        {flower.meaningKo ? (
                          <p className={styles.shareMean}>
                            <span className={styles.q} aria-hidden="true">
                              “
                            </span>
                            {flower.meaningKo}
                            <span className={styles.q} aria-hidden="true">
                              ”
                            </span>
                          </p>
                        ) : null}
                        {flower.confidenceLabel ? (
                          <p className={styles.trustBadge}>{flower.confidenceLabel}</p>
                        ) : null}
                        {flower.storyLine ? (
                          <p className={styles.shareStory}>{flower.storyLine}</p>
                        ) : null}

                        <Link
                          className={styles.storyDetail}
                          href={`/flowers/${flower.flowerId}`}
                          prefetch={false}
                        >
                          이 꽃 더 알아보기
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className={styles.shareLede}>{message}</p>
            )}

            <div className={styles.shareRow} style={{ marginTop: 26 }}>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/recommend">
                나도 골라 보기
                <IconArrow />
              </Link>
            </div>

            <p className={styles.disc} style={{ marginTop: 16 }}>
              {NOTHING_PRIVATE}
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
