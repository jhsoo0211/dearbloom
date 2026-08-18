/**
 * §1.5j AI 해석 층의 **호출 자리** — 서버 전용 (2026-08-18).
 *
 * ── 왜 `build-result.ts` 가 아니라 여기인가 ──────────────────────────
 * `build-result.ts` 는 정적 데모가 **브라우저에서** 부르는 파일이라 서버 전용 의존
 * (API 키 · `@/lib/llm/extract`)이 한 줄도 들어갈 수 없다. 그래서 병합 규칙은 거기 두고
 * (`resolveCues`), 모델을 실제로 부르는 일은 이 파일이 맡는다. 데모는 이 파일을 아예
 * import 하지 않으므로 **키가 없는 쪽 = 로컬 사전 경로**가 저절로 성립한다.
 *
 * ── 왜 `actions.ts` 가 아니라 여기인가 ───────────────────────────────
 * `'use server'` 파일이 내보내는 async 함수는 전부 **공개 HTTP 엔드포인트**가 된다.
 * 내부 헬퍼를 거기 두면 아무도 부르라고 만들지 않은 문이 하나 열린다(`messages.ts` 를
 * 갈라 둔 것과 같은 사정).
 */

import { extractCues } from '@/lib/llm/extract';
import type { ExtractedCues } from '@/lib/llm/extract-contracts';

import type { WizardAnswers } from './build-result';

/**
 * 답 한 벌에서 자유 서술 두 줄을 꺼내 AI 에게 읽힌다.
 *
 * `null` 이면 **기존 로컬 사전 경로**다(`prepareResult` 가 그렇게 다룬다):
 *   적어 준 글이 없음 / 키가 없음 / 타임아웃(4초) / 체인의 모든 프로바이더가 실패
 *
 * ⚠ **글이 둘 다 비면 부르지 않는다.** `extractCues` 안에도 같은 문이 있지만 여기서 한 번
 *   더 막는 이유는 이 자리가 "지연 0" 을 약속하는 자리이기 때문이다 — 칩만 고르고 넘어간
 *   사용자의 결과 화면은 이 기능이 붙기 전과 **정확히 같은 속도**로 서야 한다.
 * ⚠ **던지지 않는다.** 해석은 있으면 좋은 것이지 결과의 전제가 아니다. 어떤 이유로든
 *   실패하면 조용히 사전 경로로 내려간다 — 원문·예외 객체는 찍지 않는다(§1.5j).
 */
export async function readStoryCues(answers: WizardAnswers): Promise<ExtractedCues | null> {
  if (answers.recipientNote === '' && answers.episode === '') return null;

  try {
    return await extractCues({
      recipient_note: answers.recipientNote,
      episode: answers.episode,
    });
  } catch {
    console.error('[recommend] 이야기 해석이 실패했습니다. (내용은 남기지 않습니다)');
    return null;
  }
}
