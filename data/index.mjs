// ============================================================================
// data/index.mjs — Node 집계 진입점 (단일 소스 계약)
// ----------------------------------------------------------------------------
// 분할된 data/*.data.js 모듈(브라우저 전역 + Node module.exports 양립)을 모아
// { STYLE, ABILITIES, ITEMS, AUDIO } 단일 객체로 노출한다. tools/emit-json.mjs 가
// data.js 대신 이 진입점을 import 해 *.json 을 추출한다(드리프트 0, AC#12).
//
// 각 *.data.js 는 UMD 패턴((function(g){ ... })(window||globalThis))이라
// CommonJS require 로 로드하면 module.exports = { KEY } 를 그대로 돌려준다.
// ============================================================================
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

const { STYLE } = require('./style.data.js')
const { ABILITIES } = require('./abilities.data.js')
const { ITEMS } = require('./items.data.js')
const { AUDIO } = require('./audio.data.js')

export { STYLE, ABILITIES, ITEMS, AUDIO }
export default { STYLE, ABILITIES, ITEMS, AUDIO }
