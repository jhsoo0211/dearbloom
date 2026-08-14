import type { Metadata } from 'next';
import Link from 'next/link';

import { FlowerSprite, IconBack, IconShop } from '@/components/groups/icons';
import { GroupPlanner } from '@/components/groups/GroupPlanner';
import styles from '@/components/groups/groups.module.css';

/**
 * `/groups` — 여러 명에게 (각각 / 단체 부케).
 *
 * 확정 시안 `design/app-v3/group.html` 을 실동작으로 옮긴 화면이다.
 * 시안은 4명 목 데이터가 박혀 있었지만 여기서는 명단을 직접 편집하고,
 * 서버 액션이 추천 엔진을 실제로 돌린다(`src/app/groups/actions.ts`).
 *
 * 이 셸(상단 바·그레인·푸터·꽃 스프라이트)은 상태가 없어 서버에서 그대로 렌더하고,
 * 입력·결과는 클라이언트 컴포넌트 `GroupPlanner` 가 맡는다.
 */

export const metadata: Metadata = {
  title: '여러 명에게 — dearbloom',
  description:
    '팀·모임처럼 여러 명에게 꽃을 건넬 때. 같은 꽃이 겹치지 않게 나눠 드리고, 전원에게 안전한 꽃만 남긴 한 다발도 함께 골라드려요.',
};

export default function GroupsPage() {
  return (
    <div className={styles.shell}>
      <span className={styles.grain} aria-hidden="true" />
      <FlowerSprite className={styles.sprite} />

      <div className={styles.page}>
        <header className={styles.bar}>
          <Link className={styles.iconBtn} href="/" aria-label="이전 화면으로">
            <IconBack />
          </Link>
          <Link className={styles.pageTitle} href="/">
            dearbloom
          </Link>
          <span className={styles.spacer} />
          <Link className={styles.iconBtn} href="/partners" aria-label="함께하는 꽃집">
            <IconShop />
          </Link>
        </header>

        <main>
          <GroupPlanner />

          <footer className={styles.foot}>
            <p>
              꽃말은 시대와 나라를 건너며 조금씩 다른 이야기가 돼요. dearbloom은 그 갈래를 함께
              들려드려요.
            </p>
            <div className={styles.credits}>
              <h2>Image credits</h2>
              <p>Photos: Unsplash — dariana</p>
              <p>
                Unsplash License · 상업적 사용 가능 · 출처 표기는 dearbloom 자체 운용 원칙입니다.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
