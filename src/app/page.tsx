import { loadCatalog } from '@/lib/data/catalog';
import { DEFAULT_FLOWER_THEME } from '@/lib/theme/flowers';

/**
 * 임시 홈 셸.
 *
 * 실제 랜딩은 확정 시안 `design/landing-v3/home.html`(웹)·`design/app-v3/home.html`(앱)을
 * 옮기는 후속 작업이다. 여기서는 **기반이 살아 있는지**만 보여 준다:
 * 폰트(로고 세리프·본문 산세리프)·꽃-테마 변수·서버에서 읽은 콘텐츠 카탈로그.
 *
 * 오늘의 꽃은 지금 기본 테마(흰 튤립) 고정이다. 꽃 칩으로 테마가 바뀌는 로테이션(§1.4c)은
 * 랜딩 구현에서 붙인다.
 */
export default async function Home() {
  const catalog = await loadCatalog();
  const theme = DEFAULT_FLOWER_THEME;
  const flower = catalog.flowers.find((item) => item.id === theme.catalogFlowerId);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-between px-6 py-14 sm:max-w-[560px]">
      <header>
        <p
          className="text-[clamp(38px,11vw,56px)] leading-none italic"
          style={{ fontFamily: 'var(--font-logo)' }}
        >
          dearbloom
        </p>
        <p className="mt-4 text-[15px]" style={{ color: 'var(--fg-70)' }}>
          하고 싶은 말부터 고르면, 꽃이 대신 말해드려요.
        </p>
      </header>

      {/* 오늘의 꽃 자리 — 사진·꽃 칩·크로스페이드는 후속 랜딩 작업에서 채운다 */}
      <section
        aria-label="오늘의 꽃"
        className="my-12 rounded-[18px] border p-6"
        style={{ borderColor: 'var(--hair)', background: 'var(--bg-2)' }}
      >
        <p
          className="text-[11px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--accent)' }}
        >
          오늘의 꽃
        </p>
        <p
          className="mt-3 text-[28px] leading-tight"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {theme.nameKo}
        </p>
        <p className="mt-1 text-[13px] italic" style={{ color: 'var(--fg-50)' }}>
          {flower?.scientificName ?? theme.latin}
        </p>
        <p
          className="mt-5 text-[20px] leading-relaxed"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          “{theme.meaning}”
        </p>
        <p className="mt-3 text-[14px]" style={{ color: 'var(--fg-70)' }}>
          {theme.note}
        </p>
        <p className="mt-4 text-[12px]" style={{ color: 'var(--fg-50)' }}>
          {theme.sourceLabel}
        </p>
      </section>

      <footer className="text-[12px]" style={{ color: 'var(--fg-50)' }}>
        <p>
          콘텐츠 {catalog.flowers.length}종 · 꽃말 {catalog.meanings.length}줄 · 이야기{' '}
          {catalog.stories.length}편을 읽었어요.
        </p>
        <p className="mt-2">
          화면 구현은 확정 시안 <code>design/landing-v3</code> · <code>design/app-v3</code> 참조.
        </p>
      </footer>
    </main>
  );
}
