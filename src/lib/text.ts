/**
 * 한국어 문장 조립 헬퍼 — **화면에 그대로 나가는 문자열**을 만드는 자리에서 함께 쓴다.
 *
 * 꽃 이름·색 이름은 전부 데이터(`content/*.csv`)에서 오므로, 문장을 템플릿 리터럴로
 * 이어 붙이면 받침을 알 수 없다. 그래서 예전 코드는 `프리지아은(는)` 처럼 **괄호 조사**를
 * 화면에 그대로 내보냈다(리뷰 지적 — 전부 사용자 눈에 닿는 문자열이었다).
 * 이 파일은 그 자리를 받침 판정 한 번으로 대신한다.
 *
 * ⚠ **같은 규칙이 `src/components/landing/landing-data.ts` 의 `withParticle` 에도 한 벌 있다.**
 *   이번 웨이브에서 랜딩 파일은 다른 작업자가 잡고 있어 건드리지 않았다 —
 *   **후속에서 이 파일로 통일**한다(랜딩 쪽 정의를 지우고 여기서 import 한다).
 *   두 벌이 함께 사는 동안에는 **판정 규칙이 같아야 한다.** 한쪽만 고치지 마라.
 *
 * 순수 함수만 둔다(React·fs·zod 의존 금지) — 엔진(`src/lib/engine/**`)이 import 한다.
 */

/**
 * 받침으로 갈리는 조사 다섯 갈래.
 *   · `topic`   은/는     · `subject` 이/가
 *   · `object`  을/를     · `copula`  이에요/예요
 *   · `to`      로/으로 — 유일하게 **ㄹ 받침은 '로'** 를 받는 예외가 있다(서울로, 라넌큘러스로).
 */
export type ParticleKind = 'topic' | 'subject' | 'object' | 'copula' | 'to';

/**
 * 한국어 조사 — 받침 유무로 갈린다.
 *
 * 마지막 글자가 한글 음절이 아니면(영문·숫자·기호로 끝나는 이름) 받침이 없는 것으로 본다.
 * 완벽한 규칙은 아니지만(`8월` 처럼 읽어야 아는 경우가 있다) 꽃·색 이름에서는 어긋나지 않고,
 * 무엇보다 **괄호 조사보다는 언제나 낫다**.
 */
export function withParticle(word: string, kind: ParticleKind): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const hasFinal = isHangul && (code - 0xac00) % 28 !== 0;
  if (kind === 'topic') return `${word}${hasFinal ? '은' : '는'}`;
  if (kind === 'subject') return `${word}${hasFinal ? '이' : '가'}`;
  if (kind === 'object') return `${word}${hasFinal ? '을' : '를'}`;
  if (kind === 'to') {
    // ㄹ 받침(종성 인덱스 8)은 '로' — '으로'가 아니라. (예: 라넌큘러스로, 목련으로)
    const isRieul = isHangul && (code - 0xac00) % 28 === 8;
    return `${word}${hasFinal && !isRieul ? '으로' : '로'}`;
  }
  return `${word}${hasFinal ? '이에요' : '예요'}`;
}
