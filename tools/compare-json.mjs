#!/usr/bin/env node
// compare-json.mjs — 두 디렉터리의 동명 json 을 키 정렬 정규화 후 deep-equal 비교
// ─────────────────────────────────────────────────────────────────────────────
// AC#12(data 분할 드리프트 0) 검증용. 분할 전 emit 한 json 을 보관한 디렉터리(A)와
// 분할 후 emit 한 json 디렉터리(B)를 비교한다. 바이트 동일이 아니라 *의미 동등*:
// 객체 키를 재귀 정렬해 직렬화 순서 차이로 인한 거짓 실패를 막는다.
//   node tools/compare-json.mjs <dirA> <dirB> [file1.json file2.json ...]
// 파일 인자가 없으면 기본 4종(style/abilities/items/audio) 비교.
// 모두 동등이면 exit 0, 하나라도 다르면 exit 1 + diff 경로 출력.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const [dirA, dirB, ...rest] = process.argv.slice(2)
if (!dirA || !dirB) {
  console.error('usage: node tools/compare-json.mjs <dirA> <dirB> [files...]')
  process.exit(2)
}
const files = rest.length ? rest : ['style.json', 'abilities.json', 'items.json', 'audio.json']

// 객체 키를 재귀 정렬해 정규형으로 직렬화(배열 순서는 유지 — 의미 있는 순서)
function canon(v) {
  if (Array.isArray(v)) return v.map(canon)
  if (v && typeof v === 'object') {
    const out = {}
    for (const k of Object.keys(v).sort()) out[k] = canon(v[k])
    return out
  }
  return v
}
function norm(p) { return JSON.stringify(canon(JSON.parse(readFileSync(p, 'utf8')))) }

let allEqual = true
for (const f of files) {
  const a = resolve(dirA, f), b = resolve(dirB, f)
  let equal
  try { equal = norm(a) === norm(b) } catch (e) { console.error('ERR  ' + f + ': ' + e.message); allEqual = false; continue }
  if (equal) console.log('EQUAL  ' + f)
  else { console.error('DIFF   ' + f + '  (' + a + ' vs ' + b + ')'); allEqual = false }
}
if (!allEqual) { console.error('\n드리프트 감지 — 분할이 데이터 의미를 바꿨다.'); process.exit(1) }
console.log('\n드리프트 0 — 분할 전후 ' + files.length + '종 json 의미 동등 (AC#12 통과).')
