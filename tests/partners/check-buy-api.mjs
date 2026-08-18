/**
 * 11번가 ProductSearch 실측 — **키를 받은 날 사람이 돌리는** 점검이다.
 *
 *   node tests/partners/check-buy-api.mjs
 *
 * `.env` 의 ELEVENST_API_KEY 를 읽어 '장미 꽃다발' 을 두 인코딩(EUC-KR·UTF-8)으로
 * 검색해 본다 — 문서는 EUC-KR 이라 하는데 실제가 다를 수 있어서다(원장 §6).
 * 확인할 것 셋:
 *   ① 어느 인코딩에서 상품이 나오나 (서버는 EUC-KR 먼저, 0건이면 UTF-8 로 한 번 더 묻는다)
 *   ② 응답 태그 이름이 파서 후보(DetailPageUrl/ProductDetailUrl · SalePrice/ProductPrice)와 맞나
 *   ③ 파싱된 상품에 이름·값·링크가 제대로 서나
 * 어긋나면 `src/lib/buy/elevenst.ts` 의 파서와 머리말 주석을 실측대로 고쳐라.
 *
 * ⚠ 네트워크를 타므로 vitest 로 돌리지 않는다(check-links.mjs 와 같은 이유).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import iconv from 'iconv-lite';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function readEnvKey(name) {
  if (process.env[name]) return process.env[name];
  try {
    const env = readFileSync(path.join(ROOT, '.env'), 'utf8');
    const line = env.split('\n').find((row) => row.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).trim() : '';
  } catch {
    return '';
  }
}

const KEY = readEnvKey('ELEVENST_API_KEY');
if (!KEY) {
  console.log('ELEVENST_API_KEY 가 없습니다 — .env 에 키를 넣고 다시 돌리세요.');
  console.log('발급: openapi.11st.co.kr → 11번가 회원 로그인 → API 신청 (.env.example 참조)');
  process.exit(1);
}

const KEYWORD = '장미 꽃다발';

function encodeKeyword(keyword, encoding) {
  if (encoding === 'utf-8') return encodeURIComponent(keyword);
  const bytes = iconv.encode(keyword, 'euc-kr');
  let out = '';
  for (const byte of bytes) out += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
  return out;
}

/** `src/lib/buy/elevenst.ts` 의 파서와 같은 규칙 — TS 를 import 할 수 없어 한 벌 더 있다.
 *  파서를 고치면 여기도 같이 고쳐라(이 스크립트가 곧 그 파서의 실측 도구다). */
function parseProducts(xml) {
  if (xml.includes('<ErrorCode>')) return { error: /<ErrorCode>(.*?)<\/ErrorCode>/.exec(xml)?.[1], products: [] };
  const blocks = xml.match(/<Product>[\s\S]*?<\/Product>/g) ?? [];
  const tag = (block, name) =>
    (new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(block)?.[1] ?? '')
      .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')
      .trim();
  return {
    products: blocks.map((block) => ({
      title: tag(block, 'ProductName'),
      link: tag(block, 'DetailPageUrl') || tag(block, 'ProductDetailUrl'),
      price: tag(block, 'SalePrice') || tag(block, 'ProductPrice'),
      seller: tag(block, 'SellerNick') || tag(block, 'Seller'),
    })),
  };
}

for (const encoding of ['euc-kr', 'utf-8']) {
  const url =
    `https://openapi.11st.co.kr/openapi/OpenApiService.tmall?key=${encodeURIComponent(KEY)}` +
    `&apiCode=ProductSearch&keyword=${encodeKeyword(KEYWORD, encoding)}&pageSize=20`;

  console.log(`\n── keyword 인코딩: ${encoding} ─────────────────────────────`);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const xml = new TextDecoder('euc-kr').decode(await response.arrayBuffer());
    const { error, products } = parseProducts(xml);

    console.log(`HTTP ${response.status} · 응답 ${xml.length}자`);
    if (error) console.log(`ErrorCode: ${error}`);
    console.log(`파싱된 상품: ${products.length}개`);
    for (const product of products.slice(0, 3)) {
      console.log(`  · ${product.title} — ${product.price}원 / ${product.seller} / ${product.link.slice(0, 60)}`);
    }
    if (products.length === 0 && !error) {
      // 파서가 태그 이름을 못 알아본 것일 수 있다 — 원문 앞머리를 보여 준다.
      console.log('원문 앞 600자:');
      console.log(xml.slice(0, 600));
    }
  } catch (cause) {
    console.log(`호출 실패: ${cause.message}`);
  }
}
