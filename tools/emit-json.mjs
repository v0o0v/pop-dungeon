#!/usr/bin/env node
// emit-json.mjs — data.js(단일 소스)에서 abilities.json/items.json/audio.json 추출
// ─────────────────────────────────────────────────────────────────────────────
// data.js 는 브라우저 런타임이 쓰는 유일한 데이터 소스다. 린터들은 .json 을 읽으므로
// 이 스크립트가 data.js 의 module.exports 를 읽어 세 .json 을 동기화한다(드리프트 0).
//   node tools/emit-json.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const mod = await import(pathToFileURL(resolve(root, 'data.js')).href)
const { ABILITIES, ITEMS, AUDIO } = mod.default || mod

const out = [
  ['abilities.json', ABILITIES],
  ['items.json', ITEMS],
  ['audio.json', AUDIO]
]
for (const [name, obj] of out) {
  writeFileSync(resolve(root, name), JSON.stringify(obj, null, 2) + '\n', 'utf8')
  console.log('wrote', name)
}
