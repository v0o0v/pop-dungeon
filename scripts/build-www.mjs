/**
 * build-www.mjs — 게임 루트 정적 파일을 www/ 로 동기화
 *
 * 동기화 대상: index.html, game/, data/, engine/, assets/
 * www/ 는 빌드 산출물 → .gitignore 에 포함됨
 *
 * 사용법: node scripts/build-www.mjs
 */

import { cpSync, mkdirSync, rmSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const WWW  = resolve(ROOT, 'www');

// www/ 초기화
if (existsSync(WWW)) {
  rmSync(WWW, { recursive: true, force: true });
}
mkdirSync(WWW, { recursive: true });

// 복사 대상 목록 (파일 또는 디렉터리)
const COPY_TARGETS = [
  'index.html',
  'game',
  'data',
  'engine',
  'assets',
];

let copied = 0;
for (const target of COPY_TARGETS) {
  const src = resolve(ROOT, target);
  const dst = resolve(WWW, target);
  if (!existsSync(src)) {
    console.warn(`[build-www] 건너뜀 (존재하지 않음): ${target}`);
    continue;
  }
  cpSync(src, dst, { recursive: true });
  console.log(`[build-www] 복사: ${target} → www/${target}`);
  copied++;
}

console.log(`\n[build-www] 완료 — ${copied}개 항목 → ${WWW}`);
