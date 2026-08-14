'use client';

/**
 * 결과 화면 — 확정 시안 `design/app-v3/result.html` 을 실데이터로 옮긴 것.
 *
 * 위계는 시안 그대로다: 3D 무대 → 맥락 → (사과면) 배너 → 3안 세그먼트 →
 * 꽃 이름·꽃말 → 색 다시 고르기 → 추천 이유·주의·정보 → 이런 날 건네보세요 →
 * 꽃에 얽힌 설화 → 나라별 꽃말 → 멘트 → 함께 담을 한 줄 → CTA.
 *
 * 값은 전부 서버가 만들어 준 `ResultPayload` 다. 여기서 문장을 새로 지어내지 않는다
 * (라벨 사전·엔진·카탈로그는 서버 쪽에만 있다).
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';

import FlowerViewer from './FlowerViewer';
import type { FlowerForm, ResultPayload, StoryCard } from './types';
import styles from './flow.module.css';

/** 색 정보가 없는 꽃에 쓰는 형태별 기본 꽃잎 색(확정 시안 값). */
const FORM_PETAL: Record<FlowerForm, string> = {
  rose: '#B5768A',
  tulip: '#E9E1D3',
  spike: '#7E71A0',
};

/** 형태별 림라이트 — §1.4 팔레트 안에서 고른다. */
const FORM_RIM: Record<FlowerForm, string> = {
  rose: '#8A3448',
  tulip: '#C8963E',
  spike: '#83779C',
};

/** 무대 배경의 마지막 색면. */
const FORM_TONE: Record<FlowerForm, string> = {
  rose: 'rgba(138, 52, 72, 0.20)',
  tulip: 'rgba(200, 150, 62, 0.22)',
  spike: 'rgba(131, 119, 156, 0.34)',
};

function IconCopy() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11.2" height="11.2" rx="2.6" />
      <path d="M15 9V6.6A2.6 2.6 0 0 0 12.4 4H6.4A2.6 2.6 0 0 0 3.8 6.6v6A2.6 2.6 0 0 0 6.4 15.2H9" />
    </svg>
  );
}

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

export interface ResultViewProps {
  payload: ResultPayload;
  /** 질문 처음으로 돌아가기. */
  onRestart: () => void;
}

export default function ResultView({ payload, onRestart }: ResultViewProps) {
  const [active, setActive] = useState(0);
  const [colorIndex, setColorIndex] = useState<number[]>(() =>
    payload.options.map((option) => {
      const suggested = option.colors.findIndex((c) => c.isSuggested);
      return suggested === -1 ? 0 : suggested;
    }),
  );
  const [tone, setTone] = useState(0);
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [openStory, setOpenStory] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const option = payload.options[active];
  const chip = option.colors[colorIndex[active]];
  const suggestedChip = option.colors.find((c) => c.isSuggested);

  const meaning = chip?.meaningKo ?? option.fallbackMeaning?.meaningKo;
  const confidence = chip?.meaningKo
    ? chip.confidenceLabel
    : option.fallbackMeaning?.confidenceLabel;

  const viewerFlowers = useMemo(
    () =>
      payload.options.map((item, index) => {
        const picked = item.colors[colorIndex[index]];
        return {
          form: item.form,
          colorHex: picked?.hex ?? FORM_PETAL[item.form],
          rimHex: FORM_RIM[item.form],
          stageTone: FORM_TONE[item.form],
          alt: item.nameKo,
        };
      }),
    [payload.options, colorIndex],
  );

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드를 못 쓰는 환경(비보안 컨텍스트 등)에서도 화면은 그대로 둔다.
    }
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1600);
  }

  function pickColor(next: number, focus = false) {
    const count = option.colors.length;
    if (count === 0) return;
    const index = ((next % count) + count) % count;
    setColorIndex((current) => current.map((value, i) => (i === active ? index : value)));
    if (focus) {
      const node = document.getElementById(`color-${index}`);
      node?.focus();
    }
  }

  function moveTab(delta: number) {
    const count = payload.options.length;
    const next = (active + delta + count) % count;
    setActive(next);
    document.getElementById(`opt-tab-${next}`)?.focus();
  }

  function moveTone(delta: number) {
    const count = payload.tones.length;
    const next = (tone + delta + count) % count;
    setTone(next);
    document.getElementById(`tone-tab-${next}`)?.focus();
  }

  const currentTone = payload.tones[tone];

  function renderStoryMeta(story: StoryCard) {
    return (
      <p className={styles.storyMeta}>
        {story.isOriginal && story.originalLabel ? (
          <span className={`${styles.tagline} ${styles.tagOriginal}`}>{story.originalLabel}</span>
        ) : null}
        {story.regionLabel ? <span className={styles.tagline}>{story.regionLabel}</span> : null}
        <span className={styles.tagline}>{story.confidenceLabel}</span>
      </p>
    );
  }

  return (
    <>
      <header className={`${styles.bar} ${styles.appbar}`}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onRestart}
          aria-label="질문 처음으로 돌아가기"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
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
        <main>
          <h1 className="sr-only">추천 결과 — {payload.contextChips.join(' · ')}</h1>

          <FlowerViewer flowers={viewerFlowers} activeIndex={active} tag={option.segmentTag} />

          <ul className={styles.ctx} aria-label="입력한 조건">
            {payload.contextChips.map((chipText) => (
              <li key={chipText}>{chipText}</li>
            ))}
          </ul>

          {payload.isApology ? (
            <aside className={styles.apology} aria-label="마음을 먼저 전하는 방법 안내">
              <span className={styles.aic} aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 11.6a7.4 7.4 0 0 1-7.4 7.4c-1.2 0-2.3-.3-3.3-.8L4.6 19.4 5.9 15A7.4 7.4 0 1 1 20 11.6z" />
                  <path d="M12 8v3.6M12 14.3v.1" />
                </svg>
              </span>
              <p>
                <b>꽃보다 마음이 먼저예요.</b> 아래 문장부터 건네보세요.
              </p>
            </aside>
          ) : null}

          {/* ═══ 3안 세그먼트 ═══ */}
          <div
            className={styles.seg}
            role="tablist"
            aria-label={`꽃 ${payload.options.length}안 선택`}
            style={{
              ['--i' as string]: active,
              ['--n' as string]: payload.options.length,
            }}
          >
            <span className={styles.segThumb} aria-hidden="true" />
            {payload.options.map((item, index) => (
              <button
                key={item.flowerId}
                type="button"
                role="tab"
                id={`opt-tab-${index}`}
                aria-controls="opt-panel"
                aria-selected={index === active}
                tabIndex={index === active ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    moveTab(1);
                  }
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    moveTab(-1);
                  }
                }}
              >
                {item.segmentLabel}
              </button>
            ))}
          </div>

          <div id="opt-panel" role="tabpanel" aria-labelledby={`opt-tab-${active}`} tabIndex={-1}>
            {/* ═══ 꽃 이름·꽃말 ═══ */}
            <section className={styles.optHead} key={`head-${option.flowerId}`}>
              <p className={styles.optNo}>
                {String(active + 1).padStart(2, '0')}{' '}
                <span className={styles.ko}>{option.headline}</span>
              </p>
              <h2 className={styles.flName}>{option.nameKo}</h2>
              <p className={styles.flSci}>{option.scientificName}</p>
              {/* 색 칩을 바꾸면 이 꽃말과 라벨이 함께 바뀐다 — 그래서 여기가 live 영역이다. */}
              <div aria-live="polite">
                {meaning ? (
                  <p className={styles.flMean}>
                    <span className={styles.q} aria-hidden="true">
                      “
                    </span>
                    {meaning}
                    <span className={styles.q} aria-hidden="true">
                      ”
                    </span>
                  </p>
                ) : (
                  <p className={styles.flMeanEmpty}>
                    {chip
                      ? `${chip.label} 꽃말은 아직 출처를 찾는 중이에요.`
                      : '이 꽃의 꽃말은 아직 모으는 중이에요. 출처를 찾는 대로 들려드릴게요.'}
                  </p>
                )}
                {confidence ? (
                  <p className={styles.trustBadge} style={{ marginTop: 16 }}>
                    {confidence}
                  </p>
                ) : null}
              </div>
            </section>

            {/* ═══ 색 다시 고르기 (§1.5c) ═══ */}
            {option.colors.length > 0 ? (
              <section className={styles.sect} aria-labelledby="pick-h">
                <p className={styles.overline} id="pick-h">
                  Color <span className={styles.ko}>이 색으로 주세요</span>
                </p>
                <p className={styles.pickLede}>다른 색이 더 그 사람답다면, 직접 골라보세요.</p>

                <div className={styles.swatches} role="radiogroup" aria-labelledby="pick-h">
                  {option.colors.map((item, index) => (
                    <button
                      key={item.value}
                      id={`color-${index}`}
                      type="button"
                      role="radio"
                      className={styles.sw}
                      aria-checked={index === colorIndex[active]}
                      tabIndex={index === colorIndex[active] ? 0 : -1}
                      onClick={() => pickColor(index)}
                      onKeyDown={(e) => {
                        const delta =
                          e.key === 'ArrowRight' || e.key === 'ArrowDown'
                            ? 1
                            : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
                              ? -1
                              : 0;
                        if (!delta) return;
                        e.preventDefault();
                        pickColor(index + delta, true);
                      }}
                    >
                      <span
                        className={
                          item.needsRing ? `${styles.swDot} ${styles.swDotRing}` : styles.swDot
                        }
                        style={{ background: item.hex }}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* 고른 색의 꽃말·신뢰 라벨은 위(꽃 이름 아래)에서 함께 바뀐다 — 여기서 또 쓰지 않는다. */}
                <div className={styles.pickOut}>
                  {chip && suggestedChip && !chip.isSuggested ? (
                    <p className={styles.pickNote}>
                      <span className={styles.nic} aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="8.4" />
                          <path d="M12 8v4.6M12 15.6v.1" />
                        </svg>
                      </span>
                      <span>
                        추천은 {suggestedChip.label}이었어요 — 고른 색으로도 충분히 전해져요.
                      </span>
                    </p>
                  ) : option.colorReason ? (
                    <p className={styles.footNote}>{option.colorReason}</p>
                  ) : null}
                </div>
              </section>
            ) : null}

            {/* ═══ 추천 이유 · 주의 · 정보 ═══ */}
            <section className={styles.optDetail} aria-label={`${option.nameKo} 상세`}>
              <p className={styles.overline}>
                Why <span className={styles.ko}>이 꽃을 고른 이유</span>
              </p>
              <ul className={styles.reasons}>
                {option.reasons.length > 0 ? (
                  option.reasons.map((reason) => <li key={reason}>{reason}</li>)
                ) : (
                  <li>고르신 조건에서 크게 어긋나는 데가 없는 꽃이에요.</li>
                )}
              </ul>

              {option.otherCautions.map((caution) => (
                <div className={styles.warn} key={caution}>
                  <span className={styles.wic} aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 4.4 21 19.6H3z" />
                      <path d="M12 10v4M12 16.7v.1" />
                    </svg>
                  </span>
                  <div>
                    <h4>먼저 봐주세요</h4>
                    <p>{caution}</p>
                  </div>
                </div>
              ))}

              <dl className={styles.facts}>
                <div className={styles.row}>
                  <dt>계절·수급</dt>
                  <dd>
                    {option.availabilityLabel}
                    {option.substitutes.length > 0
                      ? ` · 대신 ${option.substitutes.join(', ')}도 좋아요`
                      : ''}
                  </dd>
                </div>
                <div className={styles.row}>
                  <dt>향</dt>
                  <dd>{option.fragranceLabel}</dd>
                </div>
                <div className={styles.row}>
                  <dt>가격대</dt>
                  <dd className={styles.price}>{option.priceLabel}</dd>
                </div>
                {option.careSummary ? (
                  <div className={styles.row}>
                    <dt>관리</dt>
                    <dd>{option.careSummary}</dd>
                  </div>
                ) : null}
                <div className={styles.row}>
                  <dt>반려동물</dt>
                  <dd>
                    <span
                      className={`${styles.pet} ${
                        option.petBadge.toxic ? styles.petCare : styles.petSafe
                      }`}
                    >
                      {option.petBadge.label}
                    </span>
                    <span className={styles.petNote}>{option.petBadge.summary}</span>
                    <details className={styles.petMore}>
                      <summary>자세히</summary>
                      <ul>
                        {option.petBadge.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                        {option.petCautions.map((caution) => (
                          <li key={caution}>{caution}</li>
                        ))}
                        {option.petBadge.alternatives.length > 0 ? (
                          <li>
                            대신 권하는 꽃: {option.petBadge.alternatives.join(', ')}
                          </li>
                        ) : null}
                      </ul>
                    </details>
                  </dd>
                </div>
              </dl>

              {option.occasions.length > 0 ? (
                <>
                  <p className={styles.loreH}>이런 날 건네보세요</p>
                  <ul className={styles.occasions}>
                    {option.occasions.map((occasion) => (
                      <li key={occasion}>{occasion}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>

            {/* ═══ 꽃에 얽힌 설화 ═══ */}
            <section className={styles.sect} aria-labelledby="story-h">
              <p className={styles.overline} id="story-h">
                Lore <span className={styles.ko}>꽃에 얽힌 설화</span>
              </p>

              {option.stories.featured ? (
                <article>
                  <h3 className={styles.storyTitle}>{option.stories.featured.title}</h3>
                  {option.stories.featured.hook ? (
                    <p className={styles.storyHook}>{option.stories.featured.hook}</p>
                  ) : null}
                  <p className={styles.storyBody}>{option.stories.featured.body}</p>
                  {renderStoryMeta(option.stories.featured)}
                  {option.stories.featured.sourceNote ? (
                    <p className={styles.loreSrc}>{option.stories.featured.sourceNote}</p>
                  ) : null}
                </article>
              ) : (
                <p className={styles.storyBody}>
                  이 꽃의 이야기는 아직 모으는 중이에요. 곧 들려드릴게요.
                </p>
              )}

              {option.stories.others.length > 0 ? (
                <>
                  <button
                    type="button"
                    className={styles.teaser}
                    aria-expanded={storiesOpen}
                    onClick={() => setStoriesOpen(!storiesOpen)}
                  >
                    다른 이야기 보기 ({option.stories.others.length})
                    <span className={styles.tar} aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h13M12.5 6l6 6-6 6" />
                      </svg>
                    </span>
                  </button>

                  {storiesOpen ? (
                    <div className={styles.storyList}>
                      {option.stories.others.map((story) => {
                        const open = openStory === story.id;
                        return (
                          <button
                            key={story.id}
                            type="button"
                            className={styles.storyItem}
                            aria-expanded={open}
                            onClick={() => setOpenStory(open ? null : story.id)}
                          >
                            <span className={styles.storyItemHead}>
                              {story.title}
                              <span className={styles.tar} aria-hidden="true">
                                {open ? '접기' : '펼치기'}
                              </span>
                            </span>
                            {story.hook ? (
                              <span className={styles.storyItemHook}>{story.hook}</span>
                            ) : null}
                            {open ? (
                              <>
                                <span className={styles.storyItemBody}>{story.body}</span>
                                {story.isOriginal && story.originalLabel ? (
                                  <span className={styles.storyItemHook}>
                                    {story.originalLabel}
                                  </span>
                                ) : null}
                                {story.sourceNote ? (
                                  <span className={styles.loreSrc} style={{ display: 'block' }}>
                                    {story.sourceNote}
                                  </span>
                                ) : null}
                              </>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </>
              ) : null}

              {/* ═══ 나라별 꽃말 ═══ */}
              {option.cultureMeanings.length > 0 ? (
                <>
                  <h3 className={styles.loreH}>나라별 꽃말</h3>
                  <dl className={styles.lore}>
                    {option.cultureMeanings.map((row) => (
                      <div className={styles.row} key={`${row.regionLabel}-${row.meaningKo}`}>
                        <dt>
                          {row.regionLabel}
                          {row.eraLabel ? ` · ${row.eraLabel}` : ''}
                        </dt>
                        <dd>
                          {row.meaningKo}
                          <br />
                          <span className={styles.petNote}>{row.confidenceLabel}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className={styles.loreNote}>
                    같은 꽃이 나라마다 다른 이야기를 품어요. 갈래가 나뉘는 해석은 표시해 드려요.
                  </p>
                </>
              ) : null}
            </section>
          </div>

          {/* ═══ 멘트 ═══ */}
          <section className={styles.sect} aria-labelledby="msg-h">
            <p className={styles.overline} id="msg-h">
              Message <span className={styles.ko}>방금 도착한 멘트</span>
            </p>

            <div className={styles.tones} role="tablist" aria-label="멘트 톤 선택">
              {payload.tones.map((item, index) => (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  id={`tone-tab-${index}`}
                  aria-controls="tone-panel"
                  aria-selected={index === tone}
                  tabIndex={index === tone ? 0 : -1}
                  onClick={() => setTone(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      moveTone(1);
                    }
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      moveTone(-1);
                    }
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div
              className={styles.tonePanel}
              id="tone-panel"
              role="tabpanel"
              aria-labelledby={`tone-tab-${tone}`}
              tabIndex={0}
            >
              <p className={styles.toneHint}>{currentTone.hint}</p>
              <div className={styles.msg}>
                <h3 className="sr-only">{currentTone.label} 톤 멘트</h3>
                {currentTone.body ? (
                  <p>{currentTone.body}</p>
                ) : (
                  <p className={styles.msgEmpty}>{currentTone.emptyNote}</p>
                )}
              </div>
              {currentTone.body ? (
                <button
                  type="button"
                  className={styles.copy}
                  onClick={() => copy(currentTone.body as string, `tone-${tone}`)}
                >
                  <IconCopy />
                  <span>{copied === `tone-${tone}` ? '복사했어요' : '복사'}</span>
                </button>
              ) : null}
            </div>

            <p className={styles.footNote}>{payload.messageNote}</p>
            {payload.toneOffNote ? <p className={styles.footNote}>{payload.toneOffNote}</p> : null}

            {/* §1.5e 인용 한 줄 — 멘트가 주인공, 이건 곁들임 */}
            <figure className={styles.qline}>
              <figcaption className={styles.qlineLab}>함께 담을 한 줄</figcaption>
              <blockquote>
                <p className={styles.qlineKo}>{payload.quote.textKo}</p>
              </blockquote>
              <p className={styles.qlineBy}>{payload.quote.attribution}</p>
              <button
                type="button"
                className={`${styles.copy} ${styles.copySm}`}
                aria-label="함께 담을 한 줄 복사"
                onClick={() => copy(payload.quote.textKo, 'quote')}
              >
                <IconCopy />
                <span>{copied === 'quote' ? '복사했어요' : '복사'}</span>
              </button>
            </figure>
          </section>

          {/* ═══ 공유·저장 (더미) ═══ */}
          <section className={styles.sect} aria-label="공유하고 저장하기">
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
              카드에 담기
              <IconArrow />
            </button>
            <div className={styles.btnPair}>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`}>
                링크로 공유
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onRestart}>
                다시 골라보기
              </button>
            </div>
          </section>

          {/* ═══ 제휴 ═══ */}
          <section className={styles.sect} aria-labelledby="aff-h">
            <p className={styles.overline} id="aff-h">
              Where to buy <span className={styles.ko}>주문하기</span>
            </p>
            <div className={styles.aff}>
              <a href="#">
                <span className={styles.txt}>이 꽃 주문하러 가기 — 제휴 꽃집 보기</span>
                <span className={styles.ar} aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17 17 7M8.6 7H17v8.4" />
                  </svg>
                </span>
              </a>
              <a href="#">
                <span className={styles.txt}>내일 도착 꽃 배달 알아보기</span>
                <span className={styles.ar} aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17 17 7M8.6 7H17v8.4" />
                  </svg>
                </span>
              </a>
            </div>
            <p className={styles.disc}>구매 링크는 제휴 링크로 연결돼요.</p>
          </section>

          <footer className={styles.foot}>
            <p>
              꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
              들려드려요.
            </p>
            <div className={styles.credits}>
              <h2>About this view</h2>
              <p>
                이 화면의 꽃은 사진이 아니라 절차적으로 그린 3D 모델이에요. 꽃말·이야기·안전
                정보는 출처를 확인한 콘텐츠에서 가져옵니다.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
