'use client';

/**
 * 결과 화면 — 확정 시안 `design/app-v3/result.html` 을 실데이터로 옮긴 것.
 *
 * 위계는 §1.5i 가 확정한 5단이다(위 → 아래):
 *   ① 꽃(대표 실사) + 이름 + 꽃말 (+ 색 다시 고르기)
 *   ② 꽃에 얽힌 이야기 + 나라별 꽃말 ← 멘트보다 위. "정보"보다 "이야기"가 먼저다
 *   ③ 추천 이유 · 이런 날 건네보세요
 *   ④ 멘트 3톤(고쳐 쓰기·길이·새로 받기) + 문학 속의 이 꽃
 *   ⑤ 최하단 참고(작게) — 반려동물 배지 · 계절 · 향 · 관리 · 가격 1줄 ·
 *     「이 꽃 어디서 사지」 세 갈래(우체국 꽃배달 검색 · 지도 · 우리가 찾아본 곳들) + 정직 고지 2줄
 *
 * ⚠ ① 은 2026-08-15(#14)에 **3D 뷰어에서 대표 실사로 바뀌었다.** 절차적 3D 는 "이 꽃이
 *   어떻게 생겼나"에 답하지 못했다 — 도감이 실사를 먼저 세우는 것과 같은 이유다.
 *   되돌릴 수 있게 `FlowerViewer`·`flowerScene`·`FlowerFallback` 파일은 지우지 않았다.
 *
 * 값은 전부 서버가 만들어 준 `ResultPayload` 다. 여기서 문장을 새로 지어내지 않는다
 * (라벨 사전·엔진·카탈로그는 서버 쪽에만 있다).
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from 'react';
import Link from 'next/link';

import { searchBuyProducts } from '@/app/recommend/actions';
/*
 * §1.5t — 만료 판정은 `/reads` 와 **같은 함수**를 쓴다. 한 벌을 더 세우면 같은 축제가
 * 두 화면에서 다른 날 사라진다. `expiry.ts` 는 import 가 하나도 없는 순수 모듈이라
 * 정적 데모 번들에도 그대로 들어간다.
 */
import { hasEnded, todayInKst } from '@/components/reads/expiry';
import {
  MESSAGE_LENGTH_MAX_CHARS,
  RESPONSE_TONE_COUNT,
  type MessageLength,
} from '@/lib/llm/contracts';
import { MESSAGE_MAX_CHARS } from '@/lib/llm/prompt';
import { withParticle } from '@/lib/text';
import { buildBuyLinks, type BuyLinkKind } from './buy-links';
import { sortBuyProducts, type BuyProduct, type BuySort } from './buy-products';
import { shareUrl } from './share-link';
import type { MessageStreamState, ResultPayload, StoryCard } from './types';
import styles from './flow.module.css';

/** 색 칩 아래 「그 색이 품은 말」 한 줄. `note` 가 그 말의 출신(색별인지 색 무관인지)을 밝힌다. */
interface ColorMeaningLine {
  text: string;
  note: string;
  confidenceLabel?: string;
}

/** 결 필터의 `전체` 칸 — 서버가 내려보내는 필터 목록의 첫 값과 같은 key 다. */
const MOOD_ALL = 'all';

/**
 * 고쳐 쓰기 상한 — 멘트 생성 상한(`MESSAGE_MAX_CHARS`)과 **같은 값**을 쓴다.
 * 우리가 200자로 쓰는 이유(카드 한 장에 담긴다)는 사용자가 고쳐 쓸 때도 그대로다.
 */
const MESSAGE_EDIT_MAX = MESSAGE_MAX_CHARS;

/**
 * 멘트 길이 칸 — 어휘는 계약(`MESSAGE_LENGTHS`)과 같고, 라벨만 여기서 붙인다.
 *
 * 글자 수는 **계약에서 읽어 온다**(`MESSAGE_LENGTH_MAX_CHARS`). 화면이 제 숫자를 들고
 * 있으면 상한을 조인 날 화면만 옛말을 하게 된다 — 사용자에게 60자라고 해 놓고 90자를
 * 받아 주는 자리가 생기지 않게, 말하는 수와 막는 수를 한 벌로 묶는다.
 */
const MESSAGE_LENGTH_CHOICES: readonly { key: MessageLength; label: string }[] = [
  { key: 'short', label: '짧게' },
  { key: 'medium', label: '보통' },
];

/** 「이 결과 건네주기」가 Web Share API 로 띄우는 제목·설명. 링크에는 개인적인 값이 없다. */
const SHARE_TITLE = 'dearbloom — 이 꽃을 골랐어요';
const SHARE_TEXT = '당신에게 어울릴 꽃 세 가지를 골라 봤어요.';

/** 가격 구간 칸 수 — 라벨 사전(`labels.ts` PRICE_BAND_SLOTS)과 같은 값이다(#11). */
const PRICE_SLOTS = [1, 2, 3] as const;

/**
 * §1.5t 읽을거리 구획이 세우는 카드 수 — **최대 두 장.**
 *
 * 서버는 세 장까지 싣는다(만료로 한 장이 빠질 자리를 메우려고 — `types.ts` 의
 * `FlowOptionView.reads` 머리말). 국화처럼 여섯 건이 걸린 꽃도 있지만 이 자리는
 * 목록이 아니라 곁들임이라, 셋을 넘기면 결과 화면이 `/reads` 의 요약본이 된다.
 * 더 보고 싶은 사람의 목적지는 구획 아래 「읽을거리 더 보기」 한 줄이다.
 */
const RESULT_READ_SHOWN = 2;

/**
 * KST 기준 오늘 — 마운트 전에는 `null`.
 *
 * `components/reads/ReadsBoard.tsx` 의 같은 이름 훅과 **글자까지 같은 셈**이다
 * (거기 머리말이 이 방식의 근거를 다 적어 두었다: `useState` 초기값으로 시계를 읽으면
 * 서버 HTML 과 어긋나고, 이펙트로 채우면 저장소의 "이펙트 안 setState 금지" 에 걸린다).
 * 가져다 쓰지 않고 여기 한 벌을 더 둔 이유는 그쪽이 컴포넌트 파일 내부 함수라 내보내지
 * 않기 때문이다 — 어긋남은 `expiry.ts` 한 벌을 함께 쓰는 것으로 막는다.
 */
const NEVER_CHANGES = () => () => {};
const todaySnapshot = () => todayInKst(new Date());
const noTodayOnServer = () => null;

function useTodayKst(): string | null {
  return useSyncExternalStore(NEVER_CHANGES, todaySnapshot, noTodayOnServer);
}

/**
 * ── 「이 꽃 어디서 사지」에 답하는 두 개의 바깥 링크 (2026-08-17) ──────────────
 *
 * 2026-08-17 실측으로 고른 것이다. **바꾸기 전에 아래 셋을 다시 재 보라.**
 *
 * ① 우체국 꽃배달 검색 — `searchTerm={대표이름} 꽃배달`
 *    운영은 재단법인 한국우편사업진흥원(우정사업본부)이고, 이용안내에 목적이 그대로 적혀 있다:
 *    「우체국 꽃배달은 국내 화훼농가 육성을 위해서 1998년 1월 15일부터 시행된 서비스입니다.」
 *    ⚠ `꽃배달` 을 검색어에 **반드시 붙인다.** 이름만 넣으면 엉뚱한 것이 나온다 —
 *      `튤립` → 튤립닭발, `수국` → 수국차, `프리지아` → 후리지아 비누(실측).
 *      `{이름} 꽃배달` 이면 결과가 전부 꽃배달 칸이고, 없으면 「해당하는 상품이 없습니다」
 *      안내가 정상으로 뜬다(HTTP 200).
 *    ⚠ 꽃 칸 안쪽 검색(`flowerSend.do?srchGoodsNm=…`)은 쓰지 마라. 결과가 0건이면
 *      **500 에러 페이지**가 뜬다(실측). 빈손으로 돌아오는 것과 고장 난 화면은 다르다.
 *
 * ② 네이버 지도 `꽃집` 검색
 *    데스크톱·모바일 웹 양쪽에서 결과가 그대로 뜬다. 카카오맵(`map.kakao.com/?q=`)은
 *    모바일에서 앱 설치 안내(`applink.map.kakao.com`)로 가로막혀 목록을 못 본다(실측).
 *    ⚠ 검색어에 꽃 이름을 붙이지 마라. 지도는 **가게 이름**을 찾는다 — `장미 꽃집` 은
 *      수원·대전·경산·부산의 「장미꽃집」(32~333km)을 끌어온다. 그 가게에 장미가 있다는
 *      뜻이 전혀 아니면서, 있는 것처럼 읽힌다.
 *
 * ③ 재고·가격·배송을 약속하지 않는다. 우리는 파는 사람이 아니라 찾아보는 길만 안내한다.
 */
const POST_FLOWER_SEARCH = 'https://mall.epost.go.kr/fo/search/search.do?searchTerm=';
const MAP_FLORIST_SEARCH = 'https://map.naver.com/p/search/';

/**
 * 검색에 쓸 대표 이름 — `빨간 장미` → `장미`, `아시아틱 백합` → `백합`,
 * `미모사(은엽아카시아)` → `미모사`.
 *
 * 두 가지를 떼어 낸다. 둘 다 **검색 결과를 좁히기만** 하기 때문이다:
 *   · 괄호 속 딴이름 — 검색창에 괄호를 넣으면 걸리는 것이 없다
 *   · 앞에 붙은 색·품종 수식 — `빨간 장미 꽃배달` 은 0건이고 `장미 꽃배달` 은 12건이다
 * 한 낱말짜리 이름은 그대로 돌려준다.
 *
 * ⚠ 도감이 늘어도 이 규칙은 그대로 선다. 이름 목록을 여기 적어 두지 않는 이유다 —
 *   `content/flowers.csv` 는 계속 자란다(2026-08-17 하루에도 47종 → 59종이 됐다).
 */
function mainName(nameKo: string): string {
  const parts = nameKo.replace(/\([^)]*\)/g, ' ').trim().split(/\s+/);

  return parts[parts.length - 1] || nameKo;
}

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

/** 바깥으로 나가는 링크에만 쓴다 — 같은 탭에서 열리는 우리 화면에는 `IconArrow` 다. */
function IconExternal() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17 17 7M8.6 7H17v8.4" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * 이야기 한 편의 꼬리표들(갈래·문화권·신뢰).
 *
 * §1.5i 16차 — 이건 **본문 아래 각주 줄**이다. 칩으로 세워 카드 위쪽에 두면
 * "케냐 · 19세기" 같은 메타가 이야기보다 먼저 읽혀서, 읽는 순서가 뒤집힌다.
 * 그래서 칩을 버리고 한 줄 각주로 내렸다. 창작 라벨만 강조를 남긴다(§1.5f).
 */
function StoryMeta({ story }: { story: StoryCard }) {
  const rest = [story.regionLabel, story.confidenceLabel].filter(Boolean) as string[];
  return (
    <p className={styles.storyFoot}>
      <span className={story.isOriginal ? styles.storyFootOriginal : undefined}>
        {story.typeLabel}
      </span>
      {rest.map((label) => (
        <span key={label}>
          <span className={styles.sep} aria-hidden="true">
            ·
          </span>
          {label}
        </span>
      ))}
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * 이야기 상세 시트 (§1.5i)
 * ------------------------------------------------------------------ */

interface StorySheetProps {
  story: StoryCard;
  /** 필터를 통과한 이야기 안에서의 자리(1부터). */
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

/**
 * 바텀 시트. 열려 있는 동안만 마운트되므로 "마운트 = 열림" 이다.
 *
 * 접근성은 네 가지를 직접 챙긴다 — `aria-modal`, 포커스 트랩(Tab 순환),
 * ESC·배경 탭 닫기, body 스크롤 잠금. 등장 모션은 CSS 애니메이션이라
 * `prefers-reduced-motion` 전역 규칙(globals.css)이 알아서 0으로 만든다.
 */
function StorySheet({ story, position, total, onPrev, onNext, onClose }: StorySheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // 열려 있는 동안 뒤 화면이 따라 스크롤되지 않게 잠그고, 닫으면 부르던 자리로 포커스를 돌린다.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  // 이전/다음으로 넘길 때마다 제목으로 포커스를 옮긴다(스크린리더가 새 이야기를 읽게).
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    titleRef.current?.focus();
  }, [story.id]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = sheetRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={styles.sheetRoot}>
      {/* 배경 탭으로도 닫힌다 — 같은 동작을 하는 닫기 버튼이 시트 안에 있어 여기는 장식이다. */}
      <div className={styles.sheetScrim} onClick={onClose} aria-hidden="true" />

      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-sheet-title"
        ref={sheetRef}
        onKeyDown={onKeyDown}
      >
        <span className={styles.sheetGrip} aria-hidden="true" />

        <div className={styles.sheetHead}>
          <p className={styles.sheetCount}>
            {position} / {total}
          </p>
          <button
            type="button"
            className={styles.sheetClose}
            onClick={onClose}
            aria-label="이야기 닫기"
          >
            <IconClose />
          </button>
        </div>

        {/* §1.5i 16차 순서 — 제목·mood 칩(상단 허용) → hook → 본문 → 메타 각주 → 출처 */}
        <div className={styles.sheetBody} ref={bodyRef}>
          <h3 className={styles.storyTitle} id="story-sheet-title" tabIndex={-1} ref={titleRef}>
            {story.title}
          </h3>
          {story.moodLabels.length > 0 ? (
            <p className={styles.storyMoods}>
              {story.moodLabels.map((label) => (
                <span className={styles.tagline} key={label}>
                  {label}
                </span>
              ))}
            </p>
          ) : null}
          {story.hook ? <p className={styles.storyHook}>{story.hook}</p> : null}
          <p className={styles.storyBody}>{story.body}</p>
          <StoryMeta story={story} />
          {story.sourceTitle ? (
            <p className={styles.loreSrc}>
              이야기의 갈래 —{' '}
              {story.sourceUrl ? (
                <a
                  className={styles.sheetLink}
                  href={story.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {story.sourceTitle}
                </a>
              ) : (
                story.sourceTitle
              )}
            </p>
          ) : null}
        </div>

        <div className={styles.sheetNav}>
          <button
            type="button"
            className={styles.sheetNavBtn}
            onClick={onPrev}
            disabled={total < 2}
          >
            이전 이야기
          </button>
          <button
            type="button"
            className={styles.sheetNavBtn}
            onClick={onNext}
            disabled={total < 2}
          >
            다음 이야기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 「사러 가기」 시트 (2026-08-17)
 * ------------------------------------------------------------------ */

/** 필터 칸 — 전체 / 우리가 확인한 곳 / 쇼핑몰. (`바깥 장` 은 어색하다는 사용자 확정 워딩) */
const BUY_FILTERS: readonly { key: 'all' | BuyLinkKind; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'partner', label: '확인한 곳' },
  { key: 'market', label: '쇼핑몰' },
];

/** 상품 정렬 칸 — 추천순이 기본. 공익 판매처 가산점은 점수 안에만 있다(`buy-products.ts`). */
const BUY_SORTS: readonly { key: BuySort; label: string }[] = [
  { key: 'recommended', label: '추천순' },
  { key: 'priceAsc', label: '낮은 가격순' },
  { key: 'priceDesc', label: '높은 가격순' },
];

/** 화면에 세우는 상품 수 상한 — 시트는 목록이지 검색 결과 페이지가 아니다. */
const BUY_PRODUCT_LIMIT = 10;

interface BuySheetProps {
  /** 검색어로 쓸 대표 이름 — `mainName()` 을 거친 값이다. */
  flowerName: string;
  onClose: () => void;
}

/**
 * 사용자 요구(2026-08-17) 둘을 여기서 받는다: ① 눌러도 아무 일 없던 `카드에 담기`(더미)
 * 대신 실제 구매로 이어지는 길, ② "다나와처럼" 값을 한눈에 견주는 곳을 앞세우되
 * 우리가 확인한 곳과 바깥 큰 장을 **필터로 가를 수 있게**.
 *
 * 목적지·검색어 규칙·실측 근거는 `buy-links.ts` 머리말과 `docs/partners-research.md` 의
 * 「사러 가기 시트」 절에 있다. 대화상자 규격(포커스 트랩·ESC·배경 탭·스크롤 잠금·
 * 닫을 때 연 버튼으로 포커스 복귀)은 StorySheet 와 같은 문법이다.
 */
function BuySheet({ flowerName, onClose }: BuySheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [filter, setFilter] = useState<'all' | BuyLinkKind>('all');
  /**
   * 실상품 목록(2026-08-17 사용자 요구 — "그냥 검색한 느낌 말고 구체적 상품 링크").
   * null = 아직 안 왔거나 공급원이 없다(키 미설정·데모·실패·0건) — 그때는 사이트 목록이
   * 전면에 선다. 정렬은 받아 온 목록을 클라이언트에서 다시 세운다(호출 1번으로 3정렬).
   */
  const [products, setProducts] = useState<BuyProduct[] | null>(null);
  const [productsPending, setProductsPending] = useState(true);
  /**
   * 이 목록이 **지어낸 예시인가** (2026-08-18 — 정적 데모).
   *
   * 참이면 화면이 두 가지를 한다: ① 목록 위에 예시라고 적고, ② 행이 개별 상품이 아니라
   * 그 판매처로 간다고 미리 말한다. 이 플래그 없이 예시를 세우면 그건 그냥 거짓말이다.
   * 값의 출처는 서버 응답 한 곳뿐이고(`BuyProductsResponse.sample`), 본배포는 켜지 않는다.
   */
  const [sample, setSample] = useState(false);
  const [sort, setSort] = useState<BuySort>('recommended');
  /** 상품이 서면 사이트 목록은 접힌다 — 이 플래그가 다시 편다. */
  const [linksOpen, setLinksOpen] = useState(false);

  const links = useMemo(() => buildBuyLinks(flowerName), [flowerName]);
  const shown = filter === 'all' ? links : links.filter((link) => link.kind === filter);

  const sortedProducts = useMemo(
    () => (products === null ? [] : sortBuyProducts(products, sort).slice(0, BUY_PRODUCT_LIMIT)),
    [products, sort],
  );

  // 서버에 한 번 묻는다 — 빈손(키 없음·실패·0건)이면 products 는 null 로 남는다.
  useEffect(() => {
    let alive = true;
    searchBuyProducts(flowerName)
      .then((response) => {
        if (!alive) return;
        const found = response.ok && response.products.length > 0;
        setProducts(found ? response.products : null);
        // 목록이 서지 않으면 예시 고지도 세울 자리가 없다 — 두 값을 늘 함께 옮긴다.
        setSample(found && response.sample === true);
      })
      .catch(() => {
        if (alive) {
          setProducts(null);
          setSample(false);
        }
      })
      .finally(() => {
        if (alive) setProductsPending(false);
      });
    return () => {
      alive = false;
    };
  }, [flowerName]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusables = sheetRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={styles.sheetRoot}>
      <div className={styles.sheetScrim} onClick={onClose} aria-hidden="true" />

      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-sheet-title"
        ref={sheetRef}
        onKeyDown={onKeyDown}
      >
        <span className={styles.sheetGrip} aria-hidden="true" />

        <div className={styles.sheetHead}>
          <p className={styles.sheetCount}>사러 가기</p>
          <button
            type="button"
            className={styles.sheetClose}
            onClick={onClose}
            aria-label="사러 가기 닫기"
          >
            <IconClose />
          </button>
        </div>

        <div className={styles.sheetBody}>
          <h3 className={styles.storyTitle} id="buy-sheet-title" tabIndex={-1} ref={titleRef}>
            ‘{flowerName}’ 살 수 있는 곳
          </h3>

          {/* 상품은 뒤늦게 도착한다 — 그동안 아래 사이트 목록이 먼저 서 있는다(빈 화면 금지). */}
          {productsPending ? (
            <p className={styles.buyLoading} role="status">
              지금 살 수 있는 상품을 찾아보는 중이에요…
            </p>
          ) : null}

          {products !== null ? (
            <>
              {/*
                ⚠ 예시 고지 — **목록보다 먼저** 선다. 지우지 마라.
                  정적 데모에는 실상품 공급원이 없어 이 목록이 우리가 지어낸 예시다
                  (`lib/demo/sample-products.ts`). 그 사실을 목록 아래 각주로 미루면
                  값을 다 읽은 뒤에야 알게 되고, 그때는 이미 진짜로 읽힌 뒤다.
                  두 번째 줄이 있는 이유도 같다 — 행을 누르면 그 상품이 아니라 판매처가
                  열린다는 것을 **누르기 전에** 말한다(§3-4 의 접근 고지와 같은 자리).
              */}
              {sample ? (
                <p className={styles.sampleNote}>
                  지금은 어떤 상품이 오는지 보여드리는 예시예요. 값과 상품은 실제와 달라요 —
                  줄을 누르면 그 판매처에서 직접 찾아보실 수 있어요.
                </p>
              ) : null}

              {/* 상품 정렬 — 추천순 점수의 속(공익 판매처 가산점)은 buy-products.ts 만 안다. */}
              <div className={styles.moodFilter} role="group" aria-label="상품 정렬 고르기">
                {BUY_SORTS.map((item) => {
                  const on = item.key === sort;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={on ? `${styles.moodChip} ${styles.moodChipOn}` : styles.moodChip}
                      aria-pressed={on}
                      onClick={() => setSort(item.key)}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className={styles.buyList}>
                {/*
                  ⚠ 키에 자리(index)가 섞여 있다. 주소만으로는 유일하지 않기 때문이다 —
                    예시 목록에서는 한 판매처에 여러 줄이 걸리고(그 줄들은 같은 판매처
                    주소를 공유한다) 주소를 키로 쓰면 React 가 같은 줄로 읽어 목록이
                    조용히 짧아진다. 정렬로 자리가 바뀌면 다시 그려지지만, 이 행은
                    상태를 갖지 않는 링크라 잃을 것이 없다.
                */}
                {sortedProducts.map((product, index) => (
                  <a
                    key={`${index}-${product.link}`}
                    className={styles.buyRow}
                    href={product.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={styles.buyBody}>
                      <span className={styles.buyProdTitle}>{product.title}</span>
                      <span className={styles.buyProdMeta}>
                        {product.mallName}
                        <span className={styles.sep} aria-hidden="true">
                          ·
                        </span>
                        {product.price !== null ? (
                          <span className={styles.buyPrice}>
                            {product.price.toLocaleString('ko-KR')}원
                          </span>
                        ) : (
                          '값은 눌러서 확인해 주세요'
                        )}
                      </span>
                      <span className="sr-only"> (새 창)</span>
                    </span>
                    <span className={styles.buyAr} aria-hidden="true">
                      <IconExternal />
                    </span>
                  </a>
                ))}
              </div>
              {/*
                출처와 한계를 그대로 말한다 — 값·재고를 우리가 보증하는 것처럼 읽히면 안 된다.
                예시일 때는 **출처가 없다.** 있지도 않은 검색을 출처로 대면 그 줄 자체가
                거짓이 되므로, 지어낸 목록이라는 사실을 한 번 더 적는 쪽으로 갈린다.
              */}
              <p className={styles.disc}>
                {sample
                  ? '이 목록은 화면을 보여드리려고 저희가 만든 예시예요 — 실제 판매 상품이 아니에요.'
                  : '11번가 검색에서 가져온 상품이에요 — 값과 재고는 그 페이지 기준이에요.'}
              </p>

              <button
                type="button"
                className={styles.teaser}
                aria-expanded={linksOpen}
                onClick={() => setLinksOpen(!linksOpen)}
              >
                다른 곳에서 더 찾아보기 ({links.length})
                <span className={styles.tar} aria-hidden="true">
                  <IconArrow />
                </span>
              </button>
            </>
          ) : null}

          {products === null || linksOpen ? (
            <>
              <div className={styles.moodFilter} role="group" aria-label="구매처 갈래 고르기">
                {BUY_FILTERS.map((item) => {
                  const on = item.key === filter;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={on ? `${styles.moodChip} ${styles.moodChipOn}` : styles.moodChip}
                      aria-pressed={on}
                      onClick={() => setFilter(item.key)}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className={styles.buyList}>
                {shown.map((link) => (
                  <a
                    key={link.key}
                    className={styles.buyRow}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={styles.buyBody}>
                      <span className={styles.buyName}>
                        {link.name}
                        <span
                          className={
                            link.kind === 'partner'
                              ? `${styles.buyBadge} ${styles.buyBadgePartner}`
                              : styles.buyBadge
                          }
                        >
                          {link.kind === 'partner' ? '확인한 곳' : '쇼핑몰'}
                        </span>
                      </span>
                      {link.query ? (
                        <span className={styles.buyQuery}>‘{link.query}’ 검색 결과로 열려요</span>
                      ) : null}
                      <span className={styles.buyDesc}>{link.desc}</span>
                      <span className="sr-only"> (새 창)</span>
                    </span>
                    <span className={styles.buyAr} aria-hidden="true">
                      <IconExternal />
                    </span>
                  </a>
                ))}
              </div>
            </>
          ) : null}

          {/* 이 두 줄은 목록과 한 몸이다 — 지우면 목록이 재고와 제휴를 약속하는 말이 된다. */}
          <p className={styles.disc}>
            값과 재고는 저마다 그때그때 달라요 — 여기서는 길만 이어드려요.
          </p>
          <p className={styles.disc}>
            이어지는 곳들과 아직 제휴 관계는 아니에요 — 좋은 곳을 먼저 알려 드리는 거예요.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 결과 화면
 * ------------------------------------------------------------------ */

export interface ResultViewProps {
  payload: ResultPayload;
  /** 질문 처음으로 돌아가기. */
  onRestart: () => void;
  /**
   * 멘트만 다시 받아 온다(§1.5j 재료는 이 화면 밖의 상위가 들고 있다).
   * `true` 면 새 멘트가 payload 에 갈아 끼워졌고, `false` 면 아무것도 바뀌지 않았다.
   *
   * **없을 수 있다** — 정적 데모(서버 없음)와 새로고침으로 복원된 결과가 그렇다.
   * 그때는 길이·새로 받기 버튼 자체가 서지 않는다.
   */
  onRegenerate?: (length: MessageLength) => Promise<boolean>;
  /**
   * 흘러나오는 중인 멘트(2026-08-18). `null` 이면 스트리밍이 도는 중이 아니다.
   *
   * ⚠ 여기 담긴 글자는 **표시용**이다. 복사·고쳐 쓰기·새로 받기는 이 값을 만지지 못하고,
   *   확정된 톤(`payload.tones`)만 다룬다 — 부분 문자열이 화면 계약을 넘어오지 않게.
   */
  stream?: MessageStreamState | null;
}

export default function ResultView({
  payload,
  onRestart,
  onRegenerate,
  stream = null,
}: ResultViewProps) {
  const [active, setActive] = useState(0);
  const [colorIndex, setColorIndex] = useState<number[]>(() =>
    payload.options.map((option) => {
      const suggested = option.colors.findIndex((c) => c.isSuggested);
      return suggested === -1 ? 0 : suggested;
    }),
  );
  const [tone, setTone] = useState(0);
  /**
   * §1.5j **고쳐 쓰기 버퍼** — 사용자가 우리 멘트를 손본 결과. `null` 이면 편집 중이 아니다.
   *
   * ⚠ 이 값은 **어디에도 남지 않는다.** 로그·서버·sessionStorage·다음 LLM 프롬프트 —
   *   한 곳도 없다. 새로고침하면 사라지는 것이 고장이 아니라 규격이다. 톤을 바꾸거나
   *   다른 안으로 옮기면 버려진다(그 편집은 그 문장에 한 것이지 이 화면에 한 것이 아니다).
   *   재생성에 되먹이지 않는 이유는 `regenerateMessages` 머리말에 적어 두었다.
   */
  const [draft, setDraft] = useState<string | null>(null);
  /** 멘트 길이 축 — 생성 경로에서만 갈린다(예문 표에는 짧은 벌이 없다). */
  const [msgLength, setMsgLength] = useState<MessageLength>('medium');
  /** 재생성 진행 중 — 연타를 막고, 도는 동안 도구줄 전체를 잠근다. */
  const [regenPending, setRegenPending] = useState(false);
  /** 새로 받기가 빈손으로 돌아온 사실을 화면이 말해 주는 자리(조용히 실패하지 않는다). */
  const [regenFailed, setRegenFailed] = useState(false);
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [moodFilter, setMoodFilter] = useState<string>(MOOD_ALL);
  const [openStoryId, setOpenStoryId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  /** 「이 결과 건네주기」의 결말 — 무엇을 했는지 그대로 말한다(복사와 건네기는 다른 일이다). */
  const [handOff, setHandOff] = useState<'copied' | 'shared' | null>(null);
  /** 「사러 가기」 시트 — 활성 안의 대표 이름으로 열린다(2026-08-17). */
  const [buyOpen, setBuyOpen] = useState(false);
  /** §1.5k 문학 — 펼침 상태와 지금 보고 있는 발췌의 자리(0 = 대표). */
  const [litOpen, setLitOpen] = useState(false);
  const [litIndex, setLitIndex] = useState(0);
  /**
   * 실사를 실제로 받아 온 안의 자리들 — 처음에는 눈에 보이는 1안뿐이다.
   *
   * 3안이 전부 폭 1600 실사라, 셋을 한꺼번에 받으면 **보이지도 않는 두 장**이 첫 화면의
   * 대역폭을 나눠 갖는다(실측 175KB). 그래서 나머지는 그 탭에 손이 닿는 순간(hover ·
   * 포커스 · 누름 · 활성)에 받는다.
   *
   * ⚠ `<img>` 자체는 처음부터 셋 다 세워 둔다 — 크로스페이드는 "이미 opacity:0 으로 서 있던
   *   칸이 1 로 바뀔 때" 만 도는데, 활성화 시점에 요소를 새로 만들면 시작값이 곧 1 이라
   *   페이드가 아예 일어나지 않는다. 여기서 미루는 것은 요소가 아니라 `src` 하나다.
   */
  const [warmed, setWarmed] = useState<readonly number[]>(() => [0]);

  function warmPhoto(index: number) {
    setWarmed((current) => (current.includes(index) ? current : [...current, index]));
  }

  const option = payload.options[active];
  const chip = option.colors[colorIndex[active]];

  const meaning = chip?.meaningKo ?? option.fallbackMeaning?.meaningKo;
  const confidence = chip?.meaningKo
    ? chip.confidenceLabel
    : option.fallbackMeaning?.confidenceLabel;

  /**
   * 색 칩 아래에 서는 「그 색이 품은 말」 (2026-08-18).
   *
   * 재료는 이미 서버가 색마다 실어 보낸다(`ResultColorChip.meaningKo` — 원본은
   * `meanings.csv` 의 flower_id × color 행이다). 클라이언트가 새로 부를 것도,
   * meanings 표를 통째로 번들에 실을 것도 없다.
   *
   * ⚠ **지어내지 않는다.** 그 색의 행이 없으면 색 무관 꽃말(`fallbackMeaning`)로
   *   내려가되 각주가 그 사실을 밝히고, 그것도 없으면 `undefined` 를 돌려준다
   *   (화면은 문구를 통째로 생략한다). 없는 꽃말을 그럴듯하게 채우는 것이
   *   이 화면에서 가장 하면 안 되는 일이다.
   */
  const colorMeaning = useMemo((): ColorMeaningLine | undefined => {
    // 조사는 `withParticle` 한 번으로 끝낸다 — 꽃·색 이름은 데이터에서 오므로
    // 템플릿 리터럴로 이으면 `프리지아이` 같은 말이 화면에 그대로 나간다(src/lib/text.ts).
    const flower = withParticle(mainName(option.nameKo), 'subject');

    if (chip?.meaningKo) {
      const line: ColorMeaningLine = {
        text: chip.meaningKo,
        /*
         * 각주가 갈리는 자리 — 여기가 이 블록의 핵심이다.
         *
         * 칩에 꽃말이 붙어 있다고 그것이 **그 색의** 꽃말인 것은 아니다. 엔진은 색별
         * 행을 못 찾으면 색을 가리지 않는 행으로 조용히 내려간다(`meaningIsForColor`
         * 주석). 그 둘에 같은 각주를 달면 "노랑 백일홍이 품은 말"이라고 써 놓고 실제로는
         * 색과 상관없는 꽃말을 보여 주게 된다 — 지어내지 않기로 한 그 자리다.
         */
        note: chip.meaningIsForColor
          ? `${chip.label} ${flower} 품은 말이에요`
          : `색과 무관하게 ${flower} 품은 말이에요`,
      };
      if (chip.confidenceLabel) line.confidenceLabel = chip.confidenceLabel;
      return line;
    }

    // 칩에 꽃말 자체가 없을 때의 마지막 자리 — 그 꽃에 두루 전해지는 한 줄.
    const fallback = option.fallbackMeaning;
    if (!fallback) return undefined;
    const line: ColorMeaningLine = {
      text: fallback.meaningKo,
      note: `색과 무관하게 ${flower} 품은 말이에요`,
    };
    if (fallback.confidenceLabel) line.confidenceLabel = fallback.confidenceLabel;
    return line;
  }, [chip, option.fallbackMeaning, option.nameKo]);

  /** 대표 이야기를 맨 앞에 둔 그 꽃의 이야기 전부(§1.5i — k 제한 없이 내려온다). */
  const allStories = useMemo(() => {
    const featured = option.stories.featured;
    return featured ? [featured, ...option.stories.others] : option.stories.others;
  }, [option.stories]);

  /** 실제로 이야기가 있는 결만 칩으로 세운다(빈 필터를 눌러 보게 하지 않는다). */
  const moodChips = useMemo(
    () =>
      payload.storyMoodFilters.filter(
        (filter) =>
          filter.key === MOOD_ALL || allStories.some((story) => story.moods.includes(filter.key)),
      ),
    [payload.storyMoodFilters, allStories],
  );

  const filteredStories = useMemo(
    () =>
      moodFilter === MOOD_ALL
        ? allStories
        : allStories.filter((story) => story.moods.includes(moodFilter)),
    [allStories, moodFilter],
  );

  /**
   * 시트의 이전/다음이 도는 목록.
   * 대표 이야기는 필터와 상관없이 열 수 있어서, 열린 이야기가 필터 밖이면 전체를 돈다.
   */
  const navStories = filteredStories.some((story) => story.id === openStoryId)
    ? filteredStories
    : allStories;
  const navIndex = navStories.findIndex((story) => story.id === openStoryId);
  const openStory = navIndex === -1 ? null : navStories[navIndex];

  /**
   * §1.5k 문학 — 대표를 맨 앞에 둔 그 꽃의 발췌 전부(#1).
   * 화면은 이 목록을 한 편씩 넘겨 보고, 첫 칸(대표)이 접힌 상태의 기본값이다.
   */
  const literature = useMemo(() => {
    const block = option.literature;
    if (!block) return [];
    return [block.featured, ...block.others];
  }, [option.literature]);
  const currentLit = literature[Math.min(litIndex, literature.length - 1)];

  /** 마운트 전에는 `null` — 그동안은 아무것도 거르지 않는다(아래 `reads` 머리말). */
  const today = useTodayKst();

  /**
   * §1.5t 「이 꽃과 이어지는 읽을거리」 — 지금 보는 안의 꽃에 걸린 카드 최대 두 장.
   *
   * 서버는 세 장까지 싣고(`FlowOptionView.reads` 머리말) **거르는 일은 여기서** 한다:
   * 지난 행사를 서버가 걸러 보내면 배포한 날의 "오늘" 이 정적 HTML 에 굳는다
   * (`components/reads/expiry.ts` 머리말 — `/reads` 가 같은 이유로 같은 자리에서 거른다).
   * `today` 가 `null` 인 첫 렌더에서는 아무것도 거르지 않는다 — 그때 목록이 서버가 그린
   * 것과 어긋나면 하이드레이션이 깨진다.
   */
  const reads = useMemo(() => {
    const cards = option.reads ?? [];
    const live = today === null ? cards : cards.filter((card) => !hasEnded(card, today));
    return live.slice(0, RESULT_READ_SHOWN);
  }, [option.reads, today]);

  /**
   * 구획 머리 한 줄 — **지금 서 있는 카드로** 정한다.
   *
   * 행사가 하나라도 남아 있으면 「축제」라고 말한다(그쪽이 갈지 말지를 가르는 말이라
   * 먼저다). 다 끝나서 글만 남은 날에는 축제를 말하지 않는다 — 화면은 자기가 실제로
   * 세운 것만 말한다(§1.5s 의 규범).
   */
  const hasEvent = reads.some((card) => card.periodLabel !== undefined);
  const readsLede = hasEvent
    ? '이 꽃이 주인공인 축제가 있어요'
    : '이 꽃과 이어지는 읽을거리가 있어요';

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드를 못 쓰는 환경(비보안 컨텍스트 등)에서도 화면은 그대로 둔다.
    }
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1600);
  }

  /**
   * 「이 결과 건네주기」 — 링크 하나를 손에 쥐여 준다 (2026-08-18).
   *
   * 주소는 지금 보고 있는 origin 으로 만든다(`shareUrl` 주석 — 배포 도메인이 아직 없다).
   * 폰에는 기본 공유 시트가 있으니 그것을 먼저 열고, 없거나 사용자가 닫으면 복사로 간다.
   *
   * ⚠ **취소를 성공처럼 말하지 않는다.** 공유 시트를 닫은 것(`AbortError`)은 "안 건넸다"
   *   이므로 아무 피드백도 세우지 않는다. 눌렀는데 뭔가 됐다고 말하는 화면은 거짓말이다.
   * ⚠ 링크에 무엇이 실리는지는 `share-link.ts` 가 정한다 — 자유 서술도 멘트도 없다.
   */
  async function handOver() {
    const url = shareUrl(window.location.origin, payload.shareCode);

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url });
        setHandOff('shared');
        window.setTimeout(() => setHandOff(null), 2200);
        return;
      } catch (error) {
        // 사용자가 시트를 닫았다 — 여기서 몰래 복사까지 해 두면 누른 적 없는 일이 일어난다.
        if ((error as { name?: string } | null)?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setHandOff('copied');
    } catch {
      // 클립보드도 막힌 환경(비보안 컨텍스트). 아무 말도 하지 않는 편이 정직하다.
      return;
    }
    window.setTimeout(() => setHandOff(null), 2200);
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

  /** 다른 안으로 갈아탈 때 이야기·문학 상태는 초기화한다 — 꽃이 바뀌면 읽을 것도 다르다. */
  function selectOption(next: number) {
    warmPhoto(next);
    setActive(next);
    // 꽃이 바뀌면 멘트도 그 꽃의 것이 아니다 — 고쳐 쓰던 글도 함께 버린다.
    setDraft(null);
    setRegenFailed(false);
    setStoriesOpen(false);
    setMoodFilter(MOOD_ALL);
    setOpenStoryId(null);
    setLitOpen(false);
    setLitIndex(0);
  }

  /** 문학 발췌 넘기기 — 목록 안에서 순환한다(끝에서 처음으로 돌아온다). */
  function moveLit(delta: number) {
    if (literature.length < 2) return;
    setLitIndex((current) => (current + delta + literature.length) % literature.length);
  }

  function moveTab(delta: number) {
    const count = payload.options.length;
    const next = (active + delta + count) % count;
    selectOption(next);
    document.getElementById(`opt-tab-${next}`)?.focus();
  }

  /**
   * 톤을 바꾸면 편집 버퍼는 버린다 — 그 편집은 **그 문장에** 한 것이지 이 칸에 한 것이
   * 아니다. 담백 톤을 고쳐 쓰다 다정 톤으로 갔는데 고친 글이 따라오면, 어느 문장을
   * 보고 있는지 알 수 없게 된다.
   */
  function selectTone(next: number) {
    setTone(next);
    setDraft(null);
    setRegenFailed(false);
  }

  function moveTone(delta: number) {
    const count = payload.tones.length;
    const next = (tone + delta + count) % count;
    selectTone(next);
    document.getElementById(`tone-tab-${next}`)?.focus();
  }

  /** 시트의 이전/다음 — 필터 결과 안에서 순환한다. */
  function moveStory(delta: number) {
    if (navStories.length === 0 || navIndex === -1) return;
    const next = (navIndex + delta + navStories.length) % navStories.length;
    setOpenStoryId(navStories[next].id);
  }

  const currentTone = payload.tones[tone];
  // 복사는 화면에 보이는 그대로 — 첫 마디가 있으면 함께 담는다.
  const toneCopyText = currentTone.headline
    ? `${currentTone.headline}\n\n${currentTone.body ?? ''}`
    : (currentTone.body ?? '');

  const editing = draft !== null;

  /*
   * ── 흘러나오는 중인 멘트 (2026-08-18) ────────────────────────────────
   *
   * 생성은 앞 3톤만 바꾼다(계약이 3톤 1회 호출이다 — `RESPONSE_TONE_COUNT`). 그래서
   * 스트리밍 중에 "쓰는 중" 이 되는 칸도 앞 3톤뿐이고, 사과가 아닐 때 함께 서는 유쾌 톤은
   * 처음부터 끝까지 예문이라 그대로 읽힌다.
   *
   * ⚠ 쓰는 중인 칸에는 **예문을 세우지 않는다.** 곧 다른 문장으로 바뀔 자리에 예문을
   *   띄워 두면 사용자는 그것을 우리 답으로 읽고, 1초 뒤 글자가 통째로 갈리는 것을 본다.
   *   아직 못 쓴 것은 못 썼다고 말하는 편이 낫다.
   * ⚠ `liveDraft` 는 어떤 경로로도 `ToneView.body` 가 되지 않는다 — 아래 도구줄(복사·
   *   고쳐 쓰기·새로 받기)이 스트리밍 중에는 통째로 서지 않는 이유가 그것이다.
   */
  const writing = stream?.pending === true && tone < RESPONSE_TONE_COUNT;
  const liveDraft = writing ? stream?.drafts[currentTone.key] : undefined;

  /**
   * 길이·새로 받기를 세울 수 있는가.
   *
   * 두 조건이 함께 맞아야 한다: 상위가 재생성 길을 줬고(정적 데모·복원된 결과에는 없다),
   * 지금 이 톤이 **생성된 문장**이다. 예문 톤에서는 새로 받을 것도 짧게 할 것도 없다 —
   * `templates.csv` 가 조합마다 한 행뿐이기 때문이다(2026-08-18 실측).
   *
   * 흘러들어오는 중(`writing`)에는 서지 않는다 — 아직 확정되지 않은 문장을 두고
   * "새로 받기" 를 누를 수 있게 하면 두 요청이 겹친다.
   *
   * `payload.canReword` 는 **예문 경로에도 갈아 볼 문장이 있다**는 선언이다. 지금은
   * 정적 데모만 켠다(손으로 쓴 변주 한 벌이 거기 있다 — `demo/message-variants.ts`).
   * 금지선은 그대로다: 누를 수 있으면 반드시 무언가 일어나야 한다.
   */
  const canRegenerate =
    onRegenerate !== undefined &&
    (currentTone.source === 'llm' || payload.canReword === true) &&
    !writing;

  /** 고쳐 쓰기 열고 닫기. 열 때 지금 보이는 그대로를 버퍼에 담는다(빈 칸에서 시작시키지 않는다). */
  function toggleEdit() {
    setDraft((current) => (current === null ? toneCopyText.slice(0, MESSAGE_EDIT_MAX) : null));
  }

  /**
   * 멘트를 새로 받아 온다 — `새로 받기` 와 길이 토글이 같은 문을 쓴다(둘 다 "다시 써 줘"다).
   *
   * 연타 방지는 `regenPending` 하나로 끝난다(도는 동안 버튼이 전부 비활성).
   * ⚠ 편집 버퍼는 여기서 버린다 — 새 문장이 왔는데 옛 문장을 고친 글이 남아 있으면
   *   화면이 두 개의 진실을 들고 있게 된다. 그리고 그 버퍼는 **요청에 실리지 않는다**.
   */
  async function requestMessages(length: MessageLength) {
    if (!onRegenerate || regenPending) return;
    setMsgLength(length);
    setRegenPending(true);
    setRegenFailed(false);
    try {
      const ok = await onRegenerate(length);
      if (ok) setDraft(null);
      else setRegenFailed(true);
    } finally {
      setRegenPending(false);
    }
  }

  const hasCueBand = Boolean(payload.episodeText) || payload.storyCues.length > 0;
  const featured = option.stories.featured;

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
            strokeWidth="1.6"
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
        <main className={styles.rmain}>
          <h1 className="sr-only">추천 결과 — {payload.contextChips.join(' · ')}</h1>

          {/*
            데스크톱(1024px↑)은 2단이다 — 좌단은 꽃·이름·꽃말·색 칩을 sticky 로 붙들고,
            우단만 스크롤한다(이야기 → 나라별 → 이유 → 멘트 → 참고). 모바일에서는 이
            래퍼들이 그냥 블록이라 **DOM 순서 = 지금까지의 한 칼럼 순서** 그대로다.
            좌/우를 나눈 자리가 하필 탭 패널 한가운데라, 패널을 둘로 나누고 탭의
            aria-controls 가 두 id 를 함께 가리키게 했다(둘 다 이 탭이 바꾸는 영역이다).
          */}
          <div className={styles.two}>
            <div className={styles.colA}>
              <div className={styles.colAInner}>

                {/*
                  ═══ ① 꽃 — 주인공. 대표 실사 한 컷(#14) ═══

                  3안의 `<img>` 를 **전부 겹쳐 두고** 활성 안만 띄운다(3D 뷰어가 한 씬 안에서
                  활성 꽃을 바꾸던 것과 같은 문법이다). 요소가 처음부터 셋 다 서 있어야
                  크로스페이드가 성립한다 — opacity 0 으로 이미 있던 칸이 1 로 바뀌는 것이
                  전환이고, 그 순간에 요소를 만들면 시작값이 곧 1 이라 전환이 없다.

                  다만 **받아 오는 시점은 미룬다**(`warmed`) — 겹쳐 두는 것과 세 장을 한꺼번에
                  내려받는 것은 다른 일이다.
                */}
                <figure className={styles.shotFig}>
                  <div className={styles.shotStage}>
                    {payload.options.map((item, index) =>
                      item.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- Unsplash 원격 CDN. 승인 URL 을 그대로 쓴다(docs/image-assets.md — 핫링크가 권장 사용법).
                        <img
                          key={item.flowerId}
                          className={[
                            styles.shotImg,
                            item.photo.bright ? styles.shotBright : '',
                            index === active ? styles.shotOn : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          src={warmed.includes(index) ? item.photo.src : undefined}
                          alt={index === active ? item.photo.alt : ''}
                          aria-hidden={index === active ? undefined : true}
                          fetchPriority={index === 0 ? 'high' : 'low'}
                          decoding="async"
                        />
                      ) : null,
                    )}

                    <span className={styles.shotVig} aria-hidden="true" />
                    <span
                      className={
                        option.photo?.bright
                          ? `${styles.shotScrim} ${styles.shotScrimBright}`
                          : styles.shotScrim
                      }
                      aria-hidden="true"
                    />
                    <span className={styles.shotTopscrim} aria-hidden="true" />

                    <p className={styles.shotHead}>
                      <span className={styles.overline}>
                        No.&nbsp;{String(active + 1).padStart(2, '0')}{' '}
                        <span className={styles.ko}>추천 {payload.options.length}안</span>
                      </span>
                    </p>
                    <span className={styles.shotTag}>{option.segmentTag}</span>
                  </div>

                  {/*
                    사진 크레딧은 '출처' 한 단어 뒤로 접는다 — 도감 상세와 같은 문법이다
                    (2026-08-15 피드백: `Photo: … / Unsplash` 전문이 상시 노출되면 화면이
                    크레딧에 먹힌다). 표기가 사라지는 게 아니라 한 번의 클릭 뒤로 갈 뿐이고,
                    `<details>` 라 JS 없이 열리며 스크린리더는 접힌 내용까지 읽는다.
                  */}
                  {option.photo ? (
                    <figcaption className={styles.shotCredit}>
                      <details className={styles.creditFold}>
                        <summary className={styles.creditSum}>
                          출처
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </summary>
                        <span className={styles.creditText}>{option.photo.credit}</span>
                      </details>
                    </figcaption>
                  ) : null}
                </figure>

                <ul className={styles.ctx} aria-label="들려주신 이야기">
                  {payload.contextChips.map((chipText) => {
                    const isOwn = payload.ownWords.includes(chipText);
                    /*
                     * §1.5j — 우리가 이야기에서 읽어 낸 안전 신호. 사용자가 고른 칩과
                     * 눈으로 갈려야 한다(고르지 않은 조건 때문에 후보가 줄었다는 뜻이라,
                     * 고른 것처럼 보이면 그게 곧 거짓말이 된다).
                     */
                    const isRead = payload.readChips?.includes(chipText) ?? false;
                    return (
                      <li
                        key={chipText}
                        /* §1.5l — 사용자가 직접 쓴 한 줄만 말줄임 규격을 탄다(칩 높이는 그대로). */
                        className={
                          isRead ? styles.ctxRead : isOwn ? styles.ctxOwn : undefined
                        }
                        title={isOwn ? chipText : undefined}
                      >
                        {chipText}
                      </li>
                    );
                  })}
                </ul>

                {/* §1.5j — 적어 준 이야기에서 읽어 낸 단서를 먼저 되비춘다 */}
                {hasCueBand ? (
                  <section className={styles.cueBand} aria-label="들려주신 이야기에서 찾은 단서">
                    <p className={styles.cueLede}>당신이 들려준 이야기를 담아 골랐어요</p>
                    {payload.storyCues.length > 0 ? (
                      <ul className={styles.cueChips}>
                        {payload.storyCues.map((cue) => (
                          <li className={styles.tagline} key={cue}>
                            {cue}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {payload.episodeText ? (
                      <p className={styles.cueEcho}>{payload.episodeText}</p>
                    ) : null}
                  </section>
                ) : null}

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
                  className={`${styles.seg} ${styles.segTop}`}
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
                      aria-controls="opt-panel opt-panel-more"
                      aria-selected={index === active}
                      tabIndex={index === active ? 0 : -1}
                      onClick={() => selectOption(index)}
                      /*
                       * 누르기 전에 사진을 미리 받아 둔다 — 눌린 뒤에 받기 시작하면
                       * 크로스페이드가 빈 칸에서 시작한다. 셋 다 활성화보다 먼저 오는
                       * 신호다(마우스는 hover, 키보드는 포커스, 터치는 누름).
                       */
                      onMouseEnter={() => warmPhoto(index)}
                      onFocus={() => warmPhoto(index)}
                      onPointerDown={() => warmPhoto(index)}
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
                            ? '이 색의 꽃말은 아직 갈래를 고르는 중이에요.'
                            : '이 꽃의 꽃말은 아직 모으는 중이에요. 갈래가 잡히면 바로 들려드릴게요.'}
                        </p>
                      )}
                      {confidence ? (
                        <p className={`${styles.trustBadge} ${styles.trustTop}`}>{confidence}</p>
                      ) : null}
                    </div>
                  </section>

                  {/* ═══ 색 다시 고르기 (§1.5c) — 꽃말 바로 옆자리를 지킨다 ═══ */}
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
                            {/*
                              원래 추천이 어느 색이었는지는 이제 칩 자신이 말한다 —
                              아래 문구가 꽃말로 바뀌면서 `추천은 {색}이었어요` 안내가
                              사라졌기 때문이다(2026-08-18). 점 하나로 족하다:
                              §1.6b 안에서 새 표현 언어를 만들지 않는다.
                              낭독에는 점이 아니라 말로 전한다.
                            */}
                            {item.isSuggested ? (
                              <>
                                <span className={styles.swSuggested} aria-hidden="true" />
                                <span className="sr-only"> (추천한 색)</span>
                              </>
                            ) : null}
                          </button>
                        ))}
                      </div>

                      {/*
                        ═══ 고른 색이 품은 말 (2026-08-18) ═══

                        예전 이 자리는 `추천은 {색}이었어요 — 고른 색으로도 충분히
                        전해져요` 였다. 추천색을 벗어났을 때만 서는 위로의 말이라,
                        칩을 고르는 순간 정작 **그 색이 무슨 말을 품고 있는지**는
                        말해 주지 않았다. 이제 그 자리가 꽃말을 말한다.

                        세 갈래이고, **없는 꽃말을 지어내지 않는 것**이 규칙이다:
                          · 그 색의 행이 있으면      — 색을 밝혀 그 말을 세운다
                          · 색 무관 꽃말만 있으면    — 색과 무관함을 드러내고 세운다
                                                      (`fallbackMeaning` — 서버가 그 꽃의
                                                       가장 널리 전해지는 한 줄로 채운다)
                          · 둘 다 없으면            — 문구 자체를 생략한다(빈 자리 유지)
                        신뢰 라벨은 §1.5d 대로 각주로 내린다(`storyConfidenceLabel` 선례).

                        ⚠ 추천색 안내가 이 자리에서 사라졌으므로, 원래 추천이 어느
                          색이었는지는 **칩 자신**이 계속 말한다(`swSuggested` 점 표식).
                      */}
                      <div className={styles.pickOut} aria-live="polite">
                        {colorMeaning ? (
                          <p className={styles.meanNote}>
                            <span className={styles.meanKo}>‘{colorMeaning.text}’</span>
                            <span className={styles.meanBy}>{colorMeaning.note}</span>
                            {colorMeaning.confidenceLabel ? (
                              <span className={styles.meanTrust}>
                                {colorMeaning.confidenceLabel}
                              </span>
                            ) : null}
                          </p>
                        ) : option.colorReason ? (
                          <p className={styles.footNote}>{option.colorReason}</p>
                        ) : null}
                      </div>
                    </section>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              className={styles.colB}
              id="opt-panel-more"
              role="tabpanel"
              aria-labelledby={`opt-tab-${active}`}
              tabIndex={-1}
            >

              {/* ═══ ② 꽃에 얽힌 이야기 — 멘트보다 위(§1.5i) ═══ */}
              <section className={styles.sect} aria-labelledby="story-h">
                <p className={styles.overline} id="story-h">
                  Lore <span className={styles.ko}>꽃에 얽힌 이야기</span>
                </p>

                {featured ? (
                  <article>
                    <h3 className={styles.storyTitle}>
                      <button
                        type="button"
                        className={styles.storyOpen}
                        onClick={() => setOpenStoryId(featured.id)}
                      >
                        {featured.title}
                      </button>
                    </h3>
                    {featured.hook ? <p className={styles.storyHook}>{featured.hook}</p> : null}
                    <p className={styles.storyBody}>{featured.body}</p>
                    <StoryMeta story={featured} />
                    {featured.sourceNote ? (
                      <p className={styles.loreSrc}>{featured.sourceNote}</p>
                    ) : null}
                    <button
                      type="button"
                      className={styles.storyDetail}
                      onClick={() => setOpenStoryId(featured.id)}
                    >
                      이 이야기 자세히 보기
                    </button>
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
                      <>
                        {/* 결 필터 — 있는 결만 세운다(§1.5i) */}
                        {moodChips.length > 1 ? (
                          <div className={styles.moodFilter} role="group" aria-label="이야기 결 고르기">
                            {moodChips.map((filter) => {
                              const on = filter.key === moodFilter;
                              return (
                                <button
                                  key={filter.key}
                                  type="button"
                                  className={
                                    on ? `${styles.moodChip} ${styles.moodChipOn}` : styles.moodChip
                                  }
                                  aria-pressed={on}
                                  onClick={() => setMoodFilter(filter.key)}
                                >
                                  {filter.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}

                        <div className={styles.storyList}>
                          {filteredStories.map((story) => (
                            <button
                              key={story.id}
                              type="button"
                              className={styles.storyItem}
                              onClick={() => setOpenStoryId(story.id)}
                            >
                              <span className={styles.storyItemHead}>
                                {story.title}
                                <span className={styles.tar} aria-hidden="true">
                                  자세히
                                </span>
                              </span>
                              {story.hook ? (
                                <span className={styles.storyItemHook}>{story.hook}</span>
                              ) : null}
                              <span className={styles.storyItemMoods}>
                                {story.id === featured?.id ? (
                                  <span className={`${styles.tagline} ${styles.tagFeatured}`}>
                                    먼저 보여 드린 이야기
                                  </span>
                                ) : null}
                                {story.moodLabels.map((label) => (
                                  <span className={styles.tagline} key={label}>
                                    {label}
                                  </span>
                                ))}
                              </span>
                            </button>
                          ))}
                        </div>

                        {filteredStories.length === 0 ? (
                          <p className={styles.storyEmpty}>이 결의 이야기는 아직 없어요.</p>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : null}

                {/* ═══ 나라별 꽃말 — 이야기와 같은 블록에 붙인다(§1.5i) ═══ */}
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

              {/* ═══ ③ 추천 이유 · 이런 날 건네보세요 ═══ */}
              <section className={styles.optDetail} aria-label={`${option.nameKo} 추천 이유`}>
                <p className={styles.overline}>
                  Why <span className={styles.ko}>이 꽃을 고른 이유</span>
                </p>
                <ul className={styles.reasons}>
                  {option.reasons.length > 0 ? (
                    option.reasons.map((reason) => <li key={reason}>{reason}</li>)
                  ) : (
                    <li>들려주신 이야기와 어디 하나 부딪히지 않는 꽃이에요.</li>
                  )}
                </ul>

                {/* 안전에 걸리는 주의는 접지 않는다(§1.5h — 위계만 내리고 문구는 직설 유지) */}
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

              {/* ═══ ④ 멘트 ═══ */}
              <section className={styles.sect} aria-labelledby="msg-h">
                <p className={styles.overline} id="msg-h">
                  Message <span className={styles.ko}>방금 도착한 멘트</span>
                </p>

                {/* 톤 고르기는 3안 고르기와 같은 일이다 — §1.6b 대로 같은 세그먼트를 쓴다 */}
                <div
                  className={`${styles.seg} ${styles.segTones}`}
                  role="tablist"
                  aria-label="멘트 톤 선택"
                  style={{
                    ['--i' as string]: tone,
                    ['--n' as string]: payload.tones.length,
                  }}
                >
                  <span className={styles.segThumb} aria-hidden="true" />
                  {payload.tones.map((item, index) => (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      id={`tone-tab-${index}`}
                      aria-controls="tone-panel"
                      aria-selected={index === tone}
                      tabIndex={index === tone ? 0 : -1}
                      onClick={() => selectTone(index)}
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
                  {/* 이 톤이 방금 쓰인 문장일 때만 세운다 — 예문과 구별되게(§1.5j). */}
                  {writing ? (
                    <p className={styles.trustBadge} style={{ marginTop: 12 }}>
                      당신의 이야기를 담아 쓰고 있어요
                    </p>
                  ) : currentTone.source === 'llm' ? (
                    <p className={styles.trustBadge} style={{ marginTop: 12 }}>
                      당신의 이야기를 담아 썼어요
                    </p>
                  ) : null}
                  <div className={styles.msg} aria-busy={writing || undefined}>
                    <h3 className="sr-only">{currentTone.label} 톤 멘트</h3>
                    {/*
                      낭독은 **한 번만** 한다. 흘러들어오는 글자를 live 영역에 두면 글자마다
                      읽어 주느라 아무것도 알아들을 수 없다 — 상태 한 줄로 갈음하고,
                      본문은 다 쓰이면 그때 읽힌다(그 자리는 확정된 톤이다).
                    */}
                    <p className="sr-only" role="status">
                      {writing ? '멘트를 쓰고 있어요.' : ''}
                    </p>
                    {writing ? (
                      liveDraft?.headline !== undefined || liveDraft?.body !== undefined ? (
                        <>
                          {liveDraft.headline ? (
                            <p>
                              <b>{liveDraft.headline}</b>
                            </p>
                          ) : null}
                          <p className={styles.msgLive}>
                            {liveDraft.body ?? ''}
                            <span className={styles.caret} aria-hidden="true" />
                          </p>
                        </>
                      ) : (
                        <p className={styles.msgEmpty}>
                          지금 이 톤의 멘트를 쓰고 있어요
                          <span className={styles.caret} aria-hidden="true" />
                        </p>
                      )
                    ) : editing ? (
                      /*
                        고쳐 쓰기 (§1.5j) — 우리 문장은 출발점일 뿐, 마지막 말은 보내는
                        사람의 것이다. 상한은 멘트 생성과 **같은 200자**다(카드 한 장).

                        ⚠ 이 글은 어디에도 저장되지 않는다. `onChange` 가 하는 일은
                          state 하나를 바꾸는 것뿐이고, 저장·전송·로그로 가는 길이 없다.
                      */
                      <>
                        <label className="sr-only" htmlFor="msg-edit">
                          {currentTone.label} 톤 멘트 고쳐 쓰기
                        </label>
                        <textarea
                          id="msg-edit"
                          className={styles.msgEdit}
                          value={draft ?? ''}
                          maxLength={MESSAGE_EDIT_MAX}
                          rows={6}
                          onChange={(e) => setDraft(e.target.value.slice(0, MESSAGE_EDIT_MAX))}
                        />
                        <p className={styles.msgCount}>
                          <span aria-hidden="true">
                            {(draft ?? '').length} / {MESSAGE_EDIT_MAX}
                          </span>
                          <span className="sr-only">
                            {MESSAGE_EDIT_MAX}자 중 {(draft ?? '').length}자를 썼어요
                          </span>
                        </p>
                      </>
                    ) : currentTone.body ? (
                      <>
                        {currentTone.headline ? (
                          <p>
                            <b>{currentTone.headline}</b>
                          </p>
                        ) : null}
                        <p>{currentTone.body}</p>
                      </>
                    ) : (
                      <p className={styles.msgEmpty}>{currentTone.emptyNote}</p>
                    )}
                  </div>

                  {/*
                    멘트 도구줄 (2026-08-18) — 복사 · 고쳐 쓰기 · 길이 · 새로 받기.

                    길이와 새로 받기는 **생성 경로에서만** 선다. 예문 표
                    (`templates.csv`)는 (마음 × 톤) 조합마다 행이 하나뿐이라 갈아 볼
                    다른 예문도, 짧은 벌도 아예 없다 — 눌러도 아무 일 없는 버튼은 갈 곳
                    없는 링크와 같은 거짓말이라(바로 아래 사러 가기 섹션의 그 원칙) 그
                    자리에서는 세우지 않는다.
                  */}
                  {currentTone.body && !writing ? (
                    <div className={styles.msgTools}>
                      <button
                        type="button"
                        className={styles.copy}
                        onClick={() => copy(editing ? (draft ?? '') : toneCopyText, `tone-${tone}`)}
                      >
                        <IconCopy />
                        <span>{copied === `tone-${tone}` ? '복사했어요' : '복사'}</span>
                      </button>

                      <button
                        type="button"
                        className={`${styles.copy} ${styles.copySm}`}
                        aria-pressed={editing}
                        onClick={toggleEdit}
                      >
                        {editing ? '편집 끝내기' : '고쳐 쓰기'}
                      </button>

                      {editing && draft !== toneCopyText ? (
                        <button
                          type="button"
                          className={`${styles.copy} ${styles.copySm}`}
                          onClick={() => setDraft(toneCopyText)}
                        >
                          원래대로
                        </button>
                      ) : null}

                      {canRegenerate ? (
                        <>
                          <span className={styles.msgToolsGap} aria-hidden="true" />
                          <div
                            className={styles.moodFilter}
                            role="group"
                            aria-label="멘트 길이 고르기"
                          >
                            {MESSAGE_LENGTH_CHOICES.map((item) => {
                              const on = item.key === msgLength;
                              const cap = MESSAGE_LENGTH_MAX_CHARS[item.key];
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  className={
                                    on ? `${styles.moodChip} ${styles.moodChipOn}` : styles.moodChip
                                  }
                                  aria-pressed={on}
                                  // 화면이 말하는 수와 계약이 막는 수는 언제나 같은 상수다.
                                  aria-label={`${item.label} — ${cap}자 안으로`}
                                  title={`${cap}자 안으로 써 드려요`}
                                  disabled={regenPending}
                                  onClick={() => requestMessages(item.key)}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            className={`${styles.copy} ${styles.copySm}`}
                            disabled={regenPending}
                            onClick={() => requestMessages(msgLength)}
                          >
                            {regenPending ? '받는 중…' : '새로 받기'}
                          </button>
                        </>
                      ) : null}
                    </div>
                  ) : null}

                  {/* 편집본이 어디에도 남지 않는다는 사실은 화면이 먼저 말한다(§1.5j). */}
                  {editing ? (
                    <p className={styles.footNote}>
                      고친 글은 저장하지 않아요 — 복사해서 쓰시고, 화면을 새로 열면 원래
                      멘트로 돌아와요.
                    </p>
                  ) : null}
                  {/* 조용히 실패하지 않는다 — 빈손으로 돌아왔으면 그 사실을 말한다. */}
                  <p className={styles.footNote} role="status">
                    {regenFailed ? '지금은 새로 써 오지 못했어요. 잠시 뒤에 다시 눌러 주세요.' : ''}
                  </p>
                </div>

                {/*
                  각주는 **다 쓴 뒤에** 선다. 흘러들어오는 동안 "미리 적어 둔 예문이에요"
                  가 서 있으면, 그 문장은 1초 뒤에 거짓이 된다(그때 화면에 서는 것은
                  방금 쓴 멘트다). 아직 정해지지 않은 사실을 미리 말하지 않는다.
                */}
                {stream?.pending ? null : <p className={styles.footNote}>{payload.messageNote}</p>}
                {payload.toneOffNote ? (
                  <p className={styles.footNote}>{payload.toneOffNote}</p>
                ) : null}

                {/*
                  §1.5e `함께 담을 한 줄`(.qline)은 2026-08-18 에 **걷었다.**

                  그 줄의 내용은 고른 톤의 **첫 마디**였다(#13) — 곧 바로 위 멘트 카드의
                  첫 문장 그대로다. 각주(`CARD_LINE_NOTES`)가 "방금 쓴 멘트의 첫 마디"라고
                  적어 그 반복이 실수가 아님을 해명해야 했다는 사실 자체가, 같은 문장을 한
                  화면에 두 번 세우고 있었다는 증거다. 해명이 필요한 중복은 중복이다.
                  "옮겨 적을 한 줄"이라는 쓸모는 바로 아래 「문학 속의 이 꽃」이 이미 맡고
                  있고, 그쪽은 검증된 원전이라 인용으로서도 더 단단하다.

                  ⚠ §1.5e 의 인용 절제 원칙과 아래 문학 블록은 그대로다 — 걷은 것은
                    "멘트의 첫 마디를 다시 세우던 자리" 하나뿐이다.
                */}

                {/*
                  §1.5k 문학 속의 이 꽃 — 멘트 바로 아래, "곁들임" 위계다.
                  서버가 발췌를 못 찾았거나 중복 배제에 걸리면 필드가 아예 없고, 그때는
                  블록도 서지 않는다(§1.5k "있을 때만"). 억지로 채우지 않는 것이 규칙이다.

                  #1 — 한 편 고정에서 **넘겨 보기**로 바뀌었다. 기본은 여전히 대표 한 편이고
                  (첫 화면이 목록이 되면 곁들임이 본문을 이긴다), '다른 문학도 보기'를 눌러야
                  이전/다음이 열린다. 나오는 차례는 서버가 정한다(작가 인터리브·언어권 분산).
                */}
                {currentLit ? (
                  <>
                    <figure className={styles.lit} aria-live="polite">
                      <figcaption className={styles.litLab}>
                        문학 속의 이 꽃
                        {currentLit.typeLabel ? (
                          <span className={styles.litType}>{currentLit.typeLabel}</span>
                        ) : null}
                      </figcaption>
                      <blockquote>
                        <p className={styles.litKo}>{currentLit.textKo}</p>
                      </blockquote>
                      {/* 원문 병기 — 번역으로는 살지 않는 것들이 여기 남는다(아크로스틱·AI AI) */}
                      {currentLit.textOriginal ? (
                        <p className={styles.litOrig}>{currentLit.textOriginal}</p>
                      ) : null}
                      <p className={styles.litBy}>
                        {currentLit.sourceUrl ? (
                          <a
                            className={styles.litLink}
                            href={currentLit.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {currentLit.attribution}
                          </a>
                        ) : (
                          currentLit.attribution
                        )}
                        {currentLit.translatorNote ? (
                          <>
                            <span className={styles.sep} aria-hidden="true">
                              ·
                            </span>
                            {currentLit.translatorNote}
                          </>
                        ) : null}
                      </p>
                      {/* 밝히지 않으면 서비스가 틀린 정보를 주게 되는 한 줄 */}
                      {currentLit.caveat ? (
                        <p className={styles.litCaveat}>{currentLit.caveat}</p>
                      ) : null}
                    </figure>

                    {literature.length > 1 ? (
                      <>
                        <button
                          type="button"
                          className={styles.teaser}
                          aria-expanded={litOpen}
                          aria-controls="lit-more"
                          onClick={() => setLitOpen(!litOpen)}
                        >
                          다른 문학도 보기 ({literature.length - 1})
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

                        {litOpen ? (
                          <div className={styles.litNav} id="lit-more">
                            <button
                              type="button"
                              className={styles.litNavBtn}
                              onClick={() => moveLit(-1)}
                            >
                              앞 구절
                            </button>
                            <p className={styles.litCount}>
                              {litIndex + 1} / {literature.length}
                            </p>
                            <button
                              type="button"
                              className={styles.litNavBtn}
                              onClick={() => moveLit(1)}
                            >
                              다음 구절
                            </button>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : null}
              </section>

              {/*
                ═══ §1.5t 이 꽃과 이어지는 읽을거리 (2026-08-18) ═══

                원장 `content/reads.csv` 의 `links_to` 를 꽃 쪽에서 되짚어 서버가 실어 준
                카드들이다(`lib/data/reads-links.ts`). 59종 중 25종만 이어져 있고,
                **없는 꽃에는 아무것도 붙지 않는다** — 문학 블록과 같은 규칙이다.
                「아직 이어진 글이 없어요」 같은 빈 구획을 세우지 않는다.

                자리는 문학 바로 아래, 사러 가기 위다. 읽을 것이 다 끝난 뒤 마지막 걸음이
                「사러 가기」라는 §1.5r 의 순서를 지키면서, 곁들임끼리 모여 서게 한다.

                ⚠ 지난 행사는 **브라우저의 오늘**로 거른다(위 `reads` 머리말). 여기서
                  `new Date()` 를 부르지 마라 — 정적 배포에서 배포 날짜가 HTML 에 굳는다.
              */}
              {reads.length > 0 ? (
                <section className={styles.sect} aria-labelledby="reads-h">
                  <p className={styles.overline} id="reads-h">
                    Reading <span className={styles.ko}>{readsLede}</span>
                  </p>

                  <div className={styles.readList}>
                    {reads.map((card) => (
                      <a
                        className={styles.readRow}
                        key={card.id}
                        href={card.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className={styles.readBody}>
                          <span className={styles.readTitle}>{card.title}</span>
                          {/*
                            기간·지역은 **행사에만** 있다. 두 값이 카드의 첫 판단 재료라
                            (갈 수 있는 때인가 · 갈 만한 거리인가) 제목 바로 아래 선다.
                          */}
                          {card.periodLabel ? (
                            <span className={styles.readWhen}>
                              {card.periodLabel}
                              {card.region ? (
                                <>
                                  <span className={styles.sep} aria-hidden="true">
                                    ·
                                  </span>
                                  {card.region}
                                </>
                              ) : null}
                            </span>
                          ) : null}
                          <span className={styles.readDesc}>{card.summary}</span>
                          {/* 출처를 카드마다 밝힌다 — 우리가 쓴 글이 아니라는 사실이 제목만으로는 안 보인다. */}
                          <span className={styles.readFrom}>{card.sourceTitle}</span>
                          <span className="sr-only"> (새 창)</span>
                        </span>
                        <span className={styles.buyAr} aria-hidden="true">
                          <IconExternal />
                        </span>
                      </a>
                    ))}
                  </div>

                  {/*
                    ⚠ 정직 한 줄 — 지우지 마라. 여기 걸린 축제·글은 전부 **바깥 것**이고
                      우리와 아무 관계가 없다. `/reads` 푸터가 같은 자리에 같은 성격의
                      각주를 두고 있다(없으면 "왜 이 축제만 실렸지" 가 광고로 읽힌다).
                    ⚠ 일정 확인 부탁은 **행사가 서 있을 때만** 붙인다. 글 두 편만 선 화면에서
                      「행사 일정은 확인해 주세요」라고 적으면 있지도 않은 것을 설명하는 줄이
                      된다(§1.5s 의 "화면은 자기가 실제로 한 일만 말한다").
                  */}
                  <p className={styles.disc}>
                    저희가 직접 열어 보고 골라 둔 바깥 글이에요 — 제휴 관계는 없어요.
                    {hasEvent ? ' 행사 일정은 가시기 전에 주최 쪽 안내를 한 번 봐 주세요.' : ''}
                  </p>
                  <Link className={styles.teaser} href="/reads">
                    읽을거리 더 보기
                    <span className={styles.tar} aria-hidden="true">
                      <IconArrow />
                    </span>
                  </Link>
                </section>
              ) : null}

              {/*
                ═══ 사러 가기 · 다시 골라보기 ═══

                예전 이 자리는 `카드에 담기`·`링크로 공유` **더미 버튼**이었다
                (2026-08-17 사용자 신고: "카드에 담기 버튼이 작동하지 않는다").
                눌러도 아무 일 없는 버튼은 갈 곳 없는 링크와 같은 거짓말이라(P2-11 의
                정신) 실제 길이 생길 때까지 세우지 않는다. 지금 주 버튼은 이 꽃을
                실제로 살 수 있는 곳들의 시트(BuySheet)를 연다 — 공유·저장이 정말
                생기는 날 그 기능과 함께 되살린다.
              */}
              <section className={`${styles.sect} ${styles.share}`} aria-label="이 꽃 사러 가기">
                {/*
                  §1.6b 위계 — 주(채움)와 부(아웃라인)를 `.btn` 의 기존 두 변형으로만
                  가른다. 새 표현 언어를 만들지 않는다.

                  **주 버튼이 언제나 먼저다** — DOM 순서가 곧 낭독 순서이자 모바일의
                  세로 순서이고, 데스크톱에서도 `.shareRow` 가 자리를 바꾸지 않는다
                  (`row-reverse` 로 눈과 낭독이 어긋나게 만들지 않았다).
                  좁은 화면에서는 `flex-wrap` 이 알아서 세로로 쌓는다.
                */}
                <div className={styles.shareRow}>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    onClick={() => setBuyOpen(true)}
                  >
                    ‘{mainName(option.nameKo)}’ 사러 가기
                    <IconArrow />
                  </button>
                  {/*
                    「이 결과 건네주기」 (2026-08-18) — 2026-08-17 에 걷어 낸 더미
                    `링크로 공유` 자리에 **실제로 도는 길**이 생겨 돌아온 버튼이다.
                    그때 지운 이유("눌러도 아무 일 없는 버튼은 갈 곳 없는 링크와 같은
                    거짓말")가 이 자리의 조건이었고, 이제 그 조건이 채워졌다.
                    §1.6b 위계는 그대로 — 주 버튼은 사러 가기 하나이고 이쪽은 고스트다.
                  */}
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={handOver}
                  >
                    {handOff === 'shared'
                      ? '건네줬어요'
                      : handOff === 'copied'
                        ? '링크를 복사했어요'
                        : '이 결과 건네주기'}
                  </button>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={onRestart}
                  >
                    다시 골라보기
                  </button>
                </div>
                {/* 눌렀을 때 무슨 일이 일어났는지 눈으로도 낭독으로도 한 번씩 말한다. */}
                <p className={styles.footNote} role="status">
                  {handOff === 'shared'
                    ? '건네줄 곳을 열었어요.'
                    : handOff === 'copied'
                      ? '링크를 복사했어요. 붙여넣어 건네주세요.'
                      : ''}
                </p>
              </section>

              {/* ═══ ⑤ 최하단 참고 — 작게. 안전·계절·가격·구매는 "찾을 수 있으면 충분"(§1.5i) ═══ */}
              <section className={styles.sect} aria-labelledby="notes-h">
                <p className={styles.overline} id="notes-h">
                  Notes <span className={styles.ko}>참고</span>
                </p>

                <div className={styles.notes}>
                  {/* 반려동물은 소형 배지 1곳 + 접힌 상세가 전부다(§1.5h) */}
                  <div className={styles.noteLine}>
                    <span
                      className={`${styles.pet} ${
                        option.petBadge.toxic ? styles.petCare : styles.petSafe
                      }`}
                    >
                      {option.petBadge.label}
                    </span>
                    <span>{option.petBadge.summary}</span>
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
                          <li>대신 권하는 꽃: {option.petBadge.alternatives.join(', ')}</li>
                        ) : null}
                      </ul>
                    </details>
                  </div>

                  <div className={styles.noteLine}>
                    {option.availabilityLabel}
                    {option.substitutes.length > 0
                      ? ` · 대신 ${option.substitutes.join(', ')}도 좋아요`
                      : ''}
                  </div>
                  <div className={styles.noteLine}>{option.fragranceLabel}</div>
                  {option.careSummary ? (
                    <div className={styles.noteLine}>{option.careSummary}</div>
                  ) : null}
                  {/*
                    가격은 한 줄 언급까지다 — 표·강조 금지(§1.5i).
                    #11 로 그 한 줄이 두 가지를 더 말한다:
                      · `₩ ₩₩ ₩₩₩` 세 칸을 다 세우고 이 꽃의 구간까지만 채운다
                        (셋 중 어디인지가 보여야 낮은 구간이 "부족"으로 읽히지 않는다)
                      · 가장 낮은 구간에는 §1.5d 톤 한마디를 붙인다
                    ⚠ 가격이 마음의 크기에 비례한다는 함의는 여전히 금지다.
                  */}
                  <div className={styles.noteLine}>
                    <span className={styles.priceBand} aria-hidden="true">
                      {PRICE_SLOTS.map((slot) => (
                        <span
                          key={slot}
                          className={slot <= option.priceBand ? styles.priceOn : styles.priceOff}
                        >
                          ₩
                        </span>
                      ))}
                    </span>
                    <span className="sr-only">가격대는 셋 중 {option.priceBand}번째예요.</span>
                    <span>
                      {option.priceLabel}
                      {option.priceNote ? (
                        <span className={styles.priceNote}> — {option.priceNote}</span>
                      ) : null}
                    </span>
                  </div>
                </div>

                {/*
                  ── 마지막 한 걸음 — 이 꽃 어디서 사지 (2026-08-17) ──────────────
                  사용자 신고 둘: "꽃집 연결되는 링크가 실제로 안 넘어간다",
                  "실제 해당 꽃을 살 수 있는 곳으로 연결해줘야 해".

                  여기 있던 두 줄은 둘 다 `href="#"` 였다 — 눌러도 페이지 맨 위로 튀고,
                  낭독기에는 멀쩡한 링크로 읽힌다(접근성 리뷰 P2-11).
                  `app/partners/page.tsx` 머리 주석 · `GroupPlanner.tsx` 와 같은 규범이다:
                  **아직 없는 길은 링크로 만들지 않는다.**

                  지금은 셋이고, 좁은 답에서 넓은 답 순이다:
                    ① 이 꽃 이름 그대로 공공 창구에서 찾아보기(우체국 꽃배달)
                    ② 이름을 들고 가까운 꽃집에 물어보기(지도)
                    ③ 우리가 실제로 확인해 둔 곳들(`/partners#florists`)
                  검색어를 만드는 규칙과 그렇게 고른 근거는 파일 위 `POST_FLOWER_SEARCH` 주석에
                  전부 적어 두었다 — **링크를 고치기 전에 반드시 읽어라.**

                  ⚠ 옛 둘째 줄(`내일 도착 꽃 배달 알아보기`)은 살리지 않았다. 우리가 배달을
                    주선하는 것처럼 읽혔지만 그런 수단이 없다. ①은 우체국이 **자기 서비스로**
                    배달하는 것이고, 우리는 그 창구를 가리킬 뿐이다.
                  ⚠ 제휴·할인·재고·배송 보장을 암시하는 문구로 되돌리지 마라. 넷 다 없다.

                  화살표는 두 종류다. 바깥으로 나가면 ↗(`IconExternal`), 같은 탭에서 열리는
                  우리 화면이면 →(`IconArrow`). 섞으면 어디로 가는지 거짓말이 된다.
                */}
                <div className={styles.aff} style={{ marginTop: 18 }}>
                  <a
                    href={`${POST_FLOWER_SEARCH}${encodeURIComponent(
                      `${mainName(option.nameKo)} 꽃배달`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={styles.txt}>
                      우체국 꽃배달에서 ‘{mainName(option.nameKo)}’ 찾아보기
                      <span className="sr-only"> (새 창)</span>
                    </span>
                    <span className={styles.ar} aria-hidden="true">
                      <IconExternal />
                    </span>
                  </a>
                  <a
                    href={`${MAP_FLORIST_SEARCH}${encodeURIComponent('꽃집')}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={styles.txt}>
                      가까운 꽃집 지도에서 찾아보기
                      <span className="sr-only"> (새 창)</span>
                    </span>
                    <span className={styles.ar} aria-hidden="true">
                      <IconExternal />
                    </span>
                  </a>
                  <Link href="/partners#florists" prefetch={false}>
                    <span className={styles.txt}>우리가 찾아본 곳들 — 먼저 알려 드리는 꽃집</span>
                    <span className={styles.ar} aria-hidden="true">
                      <IconArrow />
                    </span>
                  </Link>
                </div>
                {/*
                  ⚠ 이 두 줄은 링크와 한 몸이다. 위 셋 중 어느 것도 "여기 있어요"라고 말하지
                    못하기 때문에 둔 것이다 — 지우면 링크가 재고를 약속하는 말이 된다.
                    첫 줄은 빈손으로 돌아왔을 때의 다음 걸음을, 둘째 줄은 우리와 그곳들의
                    관계를 말한다. 둘째 줄은 `/partners` 의 `NO_AFFILIATION` 과 **같은 사실**을
                    말해야 한다 — 두 화면이 다른 말을 하면 어느 쪽도 믿을 수 없다.
                    제휴가 실제로 생기면 그 상수와 **함께** 고친다.
                    `tests/components/no-dead-links.test.ts` 가 둘이 어긋나는 것을 잡는다.
                */}
                <p className={styles.disc}>
                  꽃은 철 따라 들고 나요. 찾아본 곳에 없으면 가까운 꽃집에 ‘
                  {mainName(option.nameKo)}’ 있는지 물어보시는 게 제일 빨라요.
                </p>
                <p className={styles.disc}>
                  이어지는 곳들과 아직 제휴 관계는 아니에요 — 좋은 곳을 먼저 알려 드리는 거예요.
                </p>
              </section>

              {/*
                ═══ 적어 주신 꽃 한 줄 (§1.5d · 2026-08-18) ═══

                에피소드에 꽃 이름을 직접 적었는데 그 꽃이 3안에 없을 때, **화면이 그
                사실을 먼저 말한다.** 규칙이 촘촘한 자리(고백 × 연인)에서는 이름을 적어도
                I·R 가점이 그것을 이긴다(실측) — 점수를 비틀어 억지로 끼워 넣는 대신
                고르지 않은 이유를 말하는 쪽을 택했다.

                ⚠ 사과하지 않는다. 이건 실수가 아니라 판단이다(문구는 서버가 만든다 —
                  `build-result.ts` 의 `MENTIONED_NOTE_TAIL`).
                ⚠ 제외된 꽃은 여기 오지 않는다(반려동물·예산·향). 그 사정은 제 문장을
                  이미 갖고 있고, 두 이유를 한 자리에 겹치지 않는다.
                ⚠ 여기 서는 것은 **꽃 이름뿐**이다 — 적어 준 이야기를 되비추지 않는다(§1.5j).
              */}
              {payload.mentionedNote ? (
                <p className={styles.mentioned}>
                  {payload.mentionedNote.lead}
                  {payload.mentionedNote.flowers.map((flower, index) => (
                    <span key={flower.id}>
                      {index > 0 ? (
                        <span className={styles.sep} aria-hidden="true">
                          ·
                        </span>
                      ) : null}
                      <Link
                        className={styles.mentionedLink}
                        href={`/flowers/${flower.id}`}
                        prefetch={false}
                      >
                        {flower.nameKo}
                      </Link>
                    </span>
                  ))}
                  {payload.mentionedNote.tail}
                </p>
              ) : null}
            </div>
          </div>

          <footer className={styles.foot}>
            <p>
              꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
              들려드려요.
            </p>
            <div className={styles.credits}>
              <h2>이 화면에 대하여</h2>
              <p>
                맨 위 사진은 그 꽃을 담은 한 컷이에요. 찍은 분의 이름은 사진 아래 ‘출처’에 적어
                두었어요. 꽃말과 이야기, 안전한지 아닌지는 갈래를 확인한 자료에서 가져와요.
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* 폰 프레임 밖(=.flow 바로 아래)에 세운다 — .phone 의 overflow:hidden 을 피하려고. */}
      {openStory ? (
        <StorySheet
          story={openStory}
          position={navIndex + 1}
          total={navStories.length}
          onPrev={() => moveStory(-1)}
          onNext={() => moveStory(1)}
          onClose={() => setOpenStoryId(null)}
        />
      ) : null}

      {/* 사러 가기 시트 — StorySheet 와 같은 이유로 폰 프레임 밖이다. */}
      {buyOpen ? (
        <BuySheet flowerName={mainName(option.nameKo)} onClose={() => setBuyOpen(false)} />
      ) : null}
    </>
  );
}
