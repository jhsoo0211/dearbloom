import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache, type CSSProperties } from 'react';

import FlowerBuy from '@/components/flowers/FlowerBuy';
import FlowerGallery from '@/components/flowers/FlowerGallery';
import FlowerLiterature from '@/components/flowers/FlowerLiterature';
import FlowerPlate from '@/components/flowers/FlowerPlate';
import { CATEGORY_TONE } from '@/components/flowers/category';
import { buildFlowerDetail, flowerSlugs } from '@/components/flowers/data';
import styles from '@/components/flowers/flowers.module.css';
import { loadCatalog } from '@/lib/data/catalog';

/**
 * `/flowers/[slug]` — 도감 상세.
 *
 * 위계는 §1.5i 그대로다:
 * **꽃(실사 → 세밀화) → 꽃말 → 이야기 → 문학 → 상황 → 참고(작게) → 사러 가기 → CTA.**
 * 히어로 맨 위는 그 꽃의 **실사 갤러리**다 — 도감이 먼저 답해야 하는 질문이
 * "이 꽃이 어떻게 생겼나"이기 때문이다(2026-08-15). 2026-08-16 에 한 장에서 2~4장으로
 * 늘었고(색 변형 우선), 세밀화 액자는 히어로 안이 아니라 **바로 아래 제 소절**로 내려왔다.
 * "정보"보다 "이야기"가 먼저이고, 안전·계절·가격은 찾을 수 있는 위치면 충분해 맨 아래
 * 작은 블록으로 내린다(§1.5h 반려동물 위계 강등도 같은 자리에서 지켜진다).
 *
 * · 31종 전부 빌드 타임에 미리 만든다(`generateStaticParams`). 목록에 없는 slug 는
 *   요청 시 렌더를 시도하다 `notFound()` 로 떨어진다.
 * · `revalidate = 3600` — `content/*.csv` 는 배포에 고정된 읽기 전용 데이터다.
 * · 이야기 펼치기는 **`<details>` 다.** §1.5i 의 전면 시트(포커스 트랩·스크롤 잠금)는
 *   추천 결과 화면의 몫이고, 도감은 "한 번 눌러 이어 읽는" 인라인 확장으로 충분하다 —
 *   JS 가 아직 안 붙었거나 꺼져 있어도 그대로 열린다.
 * · 2026-08-18 에 **「문학 속의 이 꽃」이 붙었다**(이야기 아래·상황 위). 문학 발췌 86행은
 *   여태 추천 결과 화면에서만 보였다 — 추천을 거치지 않고 그 꽃을 알아보러 곧장 들어온
 *   사람에게는 없는 자료였던 셈이다. 자리가 이야기 바로 뒤인 이유는 위계다: 꽃말·이야기·
 *   문학까지가 **읽을 것**이고, 상황·참고·사러 가기부터가 **할 것**이다.
 * · 2026-08-18 에 **「사러 가기」가 붙었다**(참고 아래·CTA 위). 도감으로 곧장 들어온
 *   사람에게 이 화면은 여태 막다른 길이었다 — 다 읽고 나면 남는 질문이 "그래서 어디서
 *   사지"인데 그 답이 결과 화면에만 있었다. 목적지는 결과 화면과 **같은 데이터 모듈**
 *   (`components/flow/buy-links.ts`)에서 오고, 시트 UI 만 도감 쪽에 따로 세웠다.
 */

export const revalidate = 3600;

/**
 * 한 요청 안에서 뷰모델을 **한 번만** 조립한다(코드 리뷰 P1-12).
 *
 * Next 는 `generateMetadata()` 와 페이지 본체를 각각 부르는데, 둘 다 같은 slug 의 상세가
 * 필요하다. 예전에는 그래서 `buildFlowerDetail()` 이 페이지마다 두 번 돌았다 —
 * 꽃말 173행을 훑고 이야기 순서를 `pickStories` 로 다시 짜는 일까지 그대로 두 번이다.
 * 카탈로그 자체는 로더가 프로세스 단위로 캐시하지만, **조립은 캐시되지 않았다.**
 *
 * `cache()` 는 요청 단위라 SSG 32종을 만드는 동안에도 꽃마다 한 번씩만 돈다.
 */
const detailFor = cache(async (slug: string) => {
  const catalog = await loadCatalog();
  return buildFlowerDetail(catalog, slug);
});

export async function generateStaticParams() {
  const catalog = await loadCatalog();
  return flowerSlugs(catalog).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<'/flowers/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const flower = await detailFor(slug);
  if (!flower) return { title: '찾을 수 없는 꽃 — dearbloom' };

  return {
    title: `${flower.nameKo} 꽃말과 이야기 — dearbloom`,
    description: `${flower.nameKo}(${flower.scientificName})의 꽃말 ${flower.meaningCount}가지와 이야기 ${flower.stories.length}편. “${flower.headline}” — 색깔별·나라별로 갈라지는 갈래까지 함께 들려드려요.`,
  };
}

export default async function FlowerDetailPage(props: PageProps<'/flowers/[slug]'>) {
  const { slug } = await props.params;
  const flower = await detailFor(slug);
  if (!flower) notFound();

  // 카테고리 색면은 CSS 변수 하나로만 흐른다(§1.4c v3.3 — 전역 테마는 건드리지 않는다).
  const tone = { '--cat-tone': CATEGORY_TONE[flower.category] } as CSSProperties;

  return (
    <div className={styles.page} style={tone}>
      <span className={styles.grain} aria-hidden="true" />

      <header className={styles.siteHead}>
        <div className={`${styles.wrap} ${styles.siteHeadRow}`}>
          <Link className={styles.logo} href="/">
            dearbloom
          </Link>
          <span className={styles.eyebrow}>Flower index</span>
        </div>
      </header>

      <main>
        {/* ── ① 히어로 — 대표 실사 + 이름 + 대표 꽃말, 세밀화는 보조 ─── */}
        <section className={styles.hero}>
          <div className={styles.introBg} aria-hidden="true" />
          <div className={styles.wrap}>
            <Link className={styles.back} href="/flowers">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 6 8 12l6 6" />
              </svg>
              꽃 도감
            </Link>

            <div className={styles.heroGrid}>
              {/*
                ① 실사 갤러리 — 도감이 먼저 답하는 것은 "이 꽃이 어떻게 생겼나"다.
                세밀화는 아름답지만 판본에 따라 종이 갈리므로(겹꽃 변종·근연종) **실사가
                앞이고 도판이 보조**다.

                ⚠ 첫 장은 **랜딩 카드가 쓰는 그 대표컷**이다(`photosFor()` 가 구조로 지킨다).
                  카드를 누르고 들어온 사람이 방금 본 사진을 여기서 다시 만나야 두 화면이
                  한 꽃을 가리킨다는 게 눈으로 읽힌다 — 넘기면 같은 꽃의 다른 색이 나온다.
              */}
              {flower.photos.length > 0 && (
                <FlowerGallery photos={flower.photos} flowerName={flower.nameKo} />
              )}

              <div className={styles.heroText}>
                <p className={styles.heroCat}>
                  <span className={styles.dot} aria-hidden="true" />
                  {flower.categoryLabel} · {flower.categoryHint}
                </p>
                <h1 className={styles.heroName}>{flower.nameKo}</h1>
                <p className={styles.heroLatin}>
                  {flower.nameEn ? `${flower.nameEn} · ` : ''}
                  {flower.scientificName}
                </p>
                <p className={styles.heroMeaning}>{flower.headline}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── ①-b 세밀화 — 실사 갤러리 아래 제 소절로 ─────────────── */}
        {/*
          2026-08-16 재배치. 예전에는 히어로 그리드 왼쪽 칸에 실사와 도판이 **위아래로
          나란히** 서 있었다. 실사가 한 장일 때도 "둘 중 뭐가 이 꽃이지" 싶은 배치였는데,
          갤러리가 되어 넘길 것이 생기자 액자가 그 밑에 붙어 컨트롤과 뒤엉켰다.

          그래서 도판을 **자기 소절로 내려보냈다.** 위계가 자리로 분명해지고(실사가
          주인공, 세밀화는 그다음 이야기), 액자는 오히려 제 크기를 되찾는다.
          버리지 않는 이유는 그대로다 — 19세기 판면이 있어야 "야간 식물 아카이브"라는
          톤이 성립하고, 크레딧·각주는 이 서비스가 쌓아 온 자산이다.
        */}
        {flower.plate && (
          <section className={styles.section} aria-labelledby="plate-title">
            <div className={styles.wrap}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle} id="plate-title">
                  도감의 세밀화
                </h2>
              </div>
              <p className={styles.sectionLead}>
                사진이 나오기 전, 식물학자들은 이 꽃을 이렇게 그려 두었어요.
              </p>

              <figure className={styles.frame}>
                <div className={styles.matte}>
                  <div className={styles.plate}>
                    <FlowerPlate src={flower.plate.src} alt={flower.plate.alt} />
                  </div>
                </div>
                {/*
                  도판 각주 — 종이 다르거나 판면에 손을 댄 도판은 `note` 로 그 사실을 밝힌다
                  (`/stories` 시트의 `.plateNoteTail` 과 같은 규칙이다). 감추면 "벚꽃이라며
                  다른 꽃을 보여 준" 화면이 된다. 없는 꽃에는 빈 요소도 세우지 않는다.
                */}
                <figcaption className={styles.plateCredit}>
                  {flower.plate.credit}
                  {flower.plate.note && (
                    <span className={styles.plateNote}>{flower.plate.note}</span>
                  )}
                </figcaption>
              </figure>
            </div>
          </section>
        )}

        {/* ── ② 꽃말 전체(색깔별·문화권별) ───────────────────────── */}
        <section className={styles.section} aria-labelledby="meanings-title">
          <div className={styles.wrap}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle} id="meanings-title">
                색깔마다 다른 꽃말
              </h2>
              <span className={styles.sectionCount}>{flower.meaningCount}가지</span>
            </div>
            <p className={styles.sectionLead}>
              같은 꽃도 색과 나라에 따라 다른 말을 품어요. 갈래가 나뉘는 해석은 아래 각주로
              표시해 드려요.
            </p>

            {flower.meaningGroups.length === 0 ? (
              <p className={styles.sectionLead}>아직 이 꽃의 꽃말을 모으는 중이에요.</p>
            ) : (
              <div className={styles.meaningGroups}>
                {flower.meaningGroups.map((group) => (
                  <section key={group.key} aria-label={`${group.colorLabel} 꽃말`}>
                    <h3 className={styles.meaningHead}>
                      {group.hex && (
                        <span
                          className={`${styles.swatch} ${group.needsRing ? styles.swatchRing : ''}`}
                          style={{ background: group.hex }}
                          aria-hidden="true"
                        />
                      )}
                      <span className={styles.meaningColor}>{group.colorLabel}</span>
                      <span className={styles.meaningCount}>{group.items.length}</span>
                    </h3>
                    <ul className={styles.meaningList}>
                      {group.items.map((item) => (
                        <li key={item.key}>
                          <p className={styles.meaningText}>{item.text}</p>
                          <p className={styles.meaningNote}>
                            {item.note}
                            {item.sourceUrl && (
                              <>
                                {' · '}
                                {/*
                                  링크 이름은 **목적지를 구별해야 한다**(접근성 리뷰 P1-9).
                                  이 자리에는 꽃말마다 출처가 붙어 한 화면에 최대 13개가 서는데,
                                  예전에는 전부 `이야기의 갈래` 라는 같은 이름이었다 —
                                  링크 목록을 훑으면 같은 말이 열세 번 나오고 어디가 어디인지
                                  알 수 없다. 출처 이름을 앞에 세우고, 어느 꽃말의 출처인지는
                                  낭독기에만 들리게 뒤에 붙인다.
                                  ⚠ 새 탭으로 열리는 링크는 **그 사실을 미리 알린다**(P1-6) —
                                  화면 낭독기 사용자는 창이 바뀐 뒤에야 알아채면 돌아올 길을 잃는다.
                                */}
                                <a
                                  className={styles.sourceLink}
                                  href={item.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  출처 {item.sourceLabel}
                                  <span className={styles.srOnly}>
                                    {` — “${item.text}” 꽃말의 출처 (새 창)`}
                                  </span>
                                </a>
                              </>
                            )}
                          </p>
                          {item.caution && <p className={styles.meaningCaution}>{item.caution}</p>}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── ③ 이야기 전체 ─────────────────────────────────────── */}
        <section className={styles.section} aria-labelledby="stories-title">
          <div className={styles.wrap}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle} id="stories-title">
                꽃에 얽힌 이야기
              </h2>
              <span className={styles.sectionCount}>{flower.stories.length}편</span>
            </div>
            {/*
              ⚠ 이 자리에서 `갈래` 라는 말은 쓰지 않는다(2026-08-15 확정 — 낱말 과부하).
              같은 화면에서 `갈래` 가 꽃 계열·해석의 갈래·이야기의 출처 세 가지를 가리키고
              있었다. story_type 은 자연어로 풀어서 말한다.
            */}
            <p className={styles.sectionLead}>
              누르면 전문이 이어서 펼쳐져요. 문화권과 시대, 어떤 기록에서 온 이야기인지는
              이야기가 끝난 자리에 작게 적어 두었어요.
            </p>

            {flower.stories.length === 0 ? (
              <p className={styles.sectionLead}>아직 이 꽃의 이야기를 모으는 중이에요.</p>
            ) : (
              <div className={styles.stories}>
                {flower.stories.map((story) => (
                  <details className={styles.story} key={story.id} open={story.featured}>
                    <summary className={styles.storySum}>
                      <svg className={styles.storyChev} viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                      <span className={styles.storySumText}>
                        <span className={styles.storyTitle}>{story.title}</span>
                        {story.hook && <span className={styles.storyHook}>{story.hook}</span>}
                        {story.moodLabels.length > 0 && (
                          <span className={styles.storyMoods}>
                            {story.moodLabels.map((mood) => (
                              <span className={styles.tag} key={mood}>
                                {mood}
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                    </summary>
                    <div className={styles.storyBody}>
                      <p className={styles.storyText}>{story.body}</p>
                      <p className={styles.storyNote}>
                        {story.notes.map((note, index) => (
                          <span key={note.key} className={note.accent ? styles.noteAccent : ''}>
                            {index > 0 && ' · '}
                            {note.text}
                          </span>
                        ))}
                      </p>
                      {story.sourceTitle && (
                        <p className={styles.storySource}>
                          이 이야기가 실린 기록 —{' '}
                          {story.sourceUrl ? (
                            <a
                              className={styles.sourceLink}
                              href={story.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {story.sourceTitle}
                              <span className={styles.srOnly}> (새 창)</span>
                            </a>
                          ) : (
                            story.sourceTitle
                          )}
                        </p>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── ③-b 문학 속의 이 꽃 (§1.5k · 2026-08-18) ──────────── */}
        {/*
          그 꽃이 실제로 적혀 있던 원문 발췌들. 결과 화면(§1.5k)에만 있던 블록을 도감에도
          세운다 — 86행 36종이 여태 추천을 거친 사람에게만 보였다.

          자리는 **이야기 아래·상황 위**다. 꽃말 → 이야기 → 문학까지가 이 화면에서 읽을
          것이고, 「이런 날 건네보세요」부터가 건네는 사람의 걸음이다. 문학을 그 뒤로 내리면
          읽던 사람이 행동 구획을 지나 다시 읽을 것으로 돌아와야 한다.

          ⚠ **발췌가 없는 23종에는 이 구획이 아예 없다**(빈 섹션 미렌더 — 이 화면의 기존
            규범이다: 세밀화·상황·탄생화 각주가 모두 같은 규칙을 따른다). 근대에 명명돼
            고전 문학에 나오지 않는 꽃들이라, 그 자리를 편집팀 문장으로 메우는 것은
            §1.5e "검증된 인용만" 에 어긋난다.
          ⚠ 차례는 결과 화면과 **같은 함수**가 정한다(`orderLiterature` — flow/labels.ts).
            도감이 제 순서를 가지면 같은 꽃에서 두 화면이 다른 편을 앞세운다.
        */}
        {flower.literature.length > 0 && (
          <section className={styles.section} aria-labelledby="literature-title">
            <div className={styles.wrap}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle} id="literature-title">
                  문학 속의 이 꽃
                </h2>
                <span className={styles.sectionCount}>{flower.literature.length}편</span>
              </div>
              <p className={styles.sectionLead}>
                이 꽃이 실제로 적혀 있던 문장들이에요. 원문이 우리말이 아닌 것은 원문을 함께
                두고, 저희가 옮긴 문장에는 그 사실을 밝혀 두었어요.
              </p>

              <FlowerLiterature items={flower.literature} />
            </div>
          </section>
        )}

        {/* ── ④ 이런 날 건네보세요 (§1.5h) ──────────────────────── */}
        {flower.occasions.length > 0 && (
          <section className={styles.section} aria-labelledby="occasions-title">
            <div className={styles.wrap}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle} id="occasions-title">
                  이런 날 건네보세요
                </h2>
              </div>
              <ul className={styles.occasions}>
                {flower.occasions.map((occasion) => (
                  <li className={styles.occasion} key={occasion}>
                    <span className={styles.occasionMark} aria-hidden="true" />
                    {occasion}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── ⑤ 참고(작게) — 반려동물·계절·가격 ─────────────────── */}
        <section className={styles.notes} aria-labelledby="notes-title">
          <div className={styles.wrap}>
            <h2 className={styles.notesTitle} id="notes-title">
              참고
            </h2>
            <div className={styles.noteGrid}>
              <div className={styles.noteCard}>
                <p className={styles.noteLabel}>반려동물</p>
                <p className={`${styles.badge} ${flower.pet.safe ? '' : styles.badgeWarn}`}>
                  {flower.pet.badge}
                </p>
                {flower.pet.lines.length > 0 && (
                  <details>
                    <summary className={styles.petSum}>자세히 보기</summary>
                    <div className={styles.petLines}>
                      {flower.pet.lines.map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                      {/*
                        2026-08-16 · 보조 버튼으로 승격. 밑줄 한 줄이던 것을 고스트 필로
                        세운다 — 독성 정보는 이 페이지에서 사람이 **실제로 확인하러
                        나가는** 항목인데, 줄 링크는 §1.6 의 44px 터치 타깃을 못 채웠다.
                        문구는 그대로고, 새 창 고지(P1-6)도 그대로다.
                      */}
                      {flower.pet.sourceUrl && (
                        <a
                          className={styles.sourceBtn}
                          href={flower.pet.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          안전 정보의 출처
                          <span className={styles.srOnly}> (새 창)</span>
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  </details>
                )}
              </div>

              <div className={styles.noteCard}>
                <p className={styles.noteLabel}>계절</p>
                <p className={styles.noteValue}>{flower.seasonLine}</p>
              </div>

              {/* ⚠ 가격은 한 줄만. 표·강조 금지이고, 마음의 크기와 잇는 표현도 금지다(§1.5·§1.5i). */}
              <div className={styles.noteCard}>
                <p className={styles.noteLabel}>가격</p>
                <p className={styles.noteValue}>{flower.priceLine}</p>
              </div>
            </div>

            {/*
              탄생화 각주 — 표에 걸린 꽃(32종 중 24종)만 한 줄. 카드가 아니라 각주인 이유는
              이것이 그 꽃의 성질이 아니라 **날짜 표가 그 꽃을 어디에 놓았는가**여서다.

              ⚠ **"전통"·"공식"·"예로부터 정해진" 이라고 쓰지 마라.** 이 표는 전통적으로
                정해진 탄생화가 아니라, 하루 한 종씩 꽃을 소개하던 페이지에서 퍼져 널리
                통하게 된 목록이다(`docs/birth-flowers-research.md` §2). "놓인 날" 이라는
                말과 뒤따르는 출처 한 마디가 그 사실을 지키고 있다 — 줄여 쓰지 마라.
            */}
            {flower.birthDays && (
              <p className={styles.birthDays}>
                이 꽃이 탄생화로 놓인 날 — {flower.birthDays}
                <span className={styles.birthDaysNote}>널리 통하는 탄생화 표에서 가져왔어요.</span>
              </p>
            )}
          </div>
        </section>

        {/* ── ⑤-b 사러 가기 (2026-08-18) ─────────────────────────── */}
        {/*
          결과 화면의 「사러 가기」와 **같은 목적지**를 도감에서도 연다. 도감으로 곧장
          들어온 사람(추천 플로우를 거치지 않은 사람)에게 이 화면은 지금까지 갈 곳이 없는
          막다른 길이었다 — 꽃말과 이야기를 다 읽고 나면 남는 질문이 "그래서 이건 어디서
          사지"인데, 그 답이 결과 화면에만 있었다.

          자리는 **참고 아래·CTA 위**다. 위계로는 결과 화면과 같은 순서다(읽을 것이 다
          끝난 뒤 마지막 걸음). 추천 CTA 보다 위인 이유는, 이미 이 꽃으로 마음이 정해진
          사람에게 "다시 추천받기"가 먼저 보이면 뒤로 돌리는 말이 되기 때문이다.

          ⚠ §1.6b **보조 버튼**이다(주 CTA 는 아래 한 벌뿐이다 — 같은 화면에 주 CTA 가
            둘이면 어느 쪽이 이 화면의 다음 걸음인지 사라진다).
          ⚠ 목적지·검색어 규칙의 단일 원본은 `components/flow/buy-links.ts` 다.
            여기서도, 시트에서도 URL 을 새로 적지 마라.
        */}
        <section className={styles.buy} aria-labelledby="buy-title">
          <div className={styles.wrap}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle} id="buy-title">
                이 꽃 어디서 살까요
              </h2>
            </div>
            <p className={styles.buyLead}>
              값을 한눈에 견주는 곳부터, 저희가 직접 열어 보고 좋았던 곳까지 모아 두었어요.
              어느 곳과도 제휴 관계는 아니에요.
            </p>
            <FlowerBuy nameKo={flower.nameKo} />
          </div>
        </section>

        {/* ── ⑥ CTA ─────────────────────────────────────────────── */}
        <section className={styles.cta} aria-labelledby="detail-cta-title">
          <div className={styles.wrap}>
            <span className={styles.eyebrow}>Next</span>
            <h2 className={styles.ctaTitle} id="detail-cta-title">
              이 꽃으로 마음을 전해볼까요?
            </h2>
            <p className={`${styles.lead} ${styles.ctaLead}`}>
              관계와 마음만 알려주시면, 어울리는 꽃과 그 꽃의 이야기, 건넬 첫 문장까지 함께
              골라드려요.
            </p>
            <Link className={styles.btn} href="/recommend">
              45초 만에 추천받기
            </Link>
          </div>
        </section>
      </main>

      <footer className={styles.siteFoot}>
        <div className={styles.wrap}>
          <p className={styles.footSay}>
            꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
            들려드려요.
          </p>
          <nav className={styles.footNav} aria-label="보조 메뉴">
            <Link href="/">홈으로</Link>
            <Link href="/flowers">꽃 도감</Link>
            <Link href="/stories">꽃에 얽힌 이야기</Link>
            <Link href="/recommend">추천받기</Link>
          </nav>
          {flower.plate && <p className={styles.footPlate}>{flower.plate.credit}</p>}
        </div>
      </footer>
    </div>
  );
}
