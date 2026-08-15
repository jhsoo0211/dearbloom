import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';

import FlowerPlate from '@/components/flowers/FlowerPlate';
import { CATEGORY_TONE } from '@/components/flowers/category';
import { buildFlowerDetail, flowerSlugs } from '@/components/flowers/data';
import styles from '@/components/flowers/flowers.module.css';
import { loadCatalog } from '@/lib/data/catalog';

/**
 * `/flowers/[slug]` — 도감 상세.
 *
 * 위계는 §1.5i 그대로다: **꽃(도판) → 꽃말 → 이야기 → 상황 → 참고(작게) → CTA.**
 * "정보"보다 "이야기"가 먼저이고, 안전·계절·가격은 찾을 수 있는 위치면 충분해 맨 아래
 * 작은 블록으로 내린다(§1.5h 반려동물 위계 강등도 같은 자리에서 지켜진다).
 *
 * · 31종 전부 빌드 타임에 미리 만든다(`generateStaticParams`). 목록에 없는 slug 는
 *   요청 시 렌더를 시도하다 `notFound()` 로 떨어진다.
 * · `revalidate = 3600` — `content/*.csv` 는 배포에 고정된 읽기 전용 데이터다.
 * · 이야기 펼치기는 **`<details>` 다.** §1.5i 의 전면 시트(포커스 트랩·스크롤 잠금)는
 *   추천 결과 화면의 몫이고, 도감은 "한 번 눌러 이어 읽는" 인라인 확장으로 충분하다 —
 *   JS 가 아직 안 붙었거나 꺼져 있어도 그대로 열린다.
 */

export const revalidate = 3600;

export async function generateStaticParams() {
  const catalog = await loadCatalog();
  return flowerSlugs(catalog).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<'/flowers/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const catalog = await loadCatalog();
  const flower = buildFlowerDetail(catalog, slug);
  if (!flower) return { title: '찾을 수 없는 꽃 — dearbloom' };

  return {
    title: `${flower.nameKo} 꽃말과 이야기 — dearbloom`,
    description: `${flower.nameKo}(${flower.scientificName})의 꽃말 ${flower.meaningCount}가지와 이야기 ${flower.stories.length}편. “${flower.headline}” — 색깔별·나라별로 갈라지는 갈래까지 함께 들려드려요.`,
  };
}

export default async function FlowerDetailPage(props: PageProps<'/flowers/[slug]'>) {
  const { slug } = await props.params;
  const catalog = await loadCatalog();
  const flower = buildFlowerDetail(catalog, slug);
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
        {/* ── ① 히어로 — 세밀화 액자 + 이름 + 대표 꽃말 ─────────── */}
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
              <figure className={styles.frame}>
                <div className={styles.matte}>
                  <div className={styles.plate}>
                    <FlowerPlate
                      src={flower.plate?.src}
                      alt={flower.plate?.alt}
                      grade={flower.plate?.grade}
                    />
                  </div>
                </div>
                {flower.plate && (
                  <figcaption className={styles.plateCredit}>{flower.plate.credit}</figcaption>
                )}
              </figure>

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
                                <a
                                  className={styles.sourceLink}
                                  href={item.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  이야기의 갈래
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
            <p className={styles.sectionLead}>
              누르면 전문이 이어서 펼쳐져요. 문화권·시대·갈래는 이야기가 끝난 자리에 작게
              적어 두었어요.
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
                          이야기의 갈래 —{' '}
                          {story.sourceUrl ? (
                            <a
                              className={styles.sourceLink}
                              href={story.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {story.sourceTitle}
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
                      {flower.pet.sourceUrl && (
                        <a
                          className={styles.sourceLink}
                          href={flower.pet.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          안전 정보의 출처
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
