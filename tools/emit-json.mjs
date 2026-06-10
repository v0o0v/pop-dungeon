#!/usr/bin/env node
// emit-json.mjs — data.js(단일 소스)에서 style/abilities/items/audio json 추출
// ─────────────────────────────────────────────────────────────────────────────
// data.js 는 브라우저 런타임이 쓰는 유일한 데이터 소스다. 린터들은 .json 을 읽으므로
// 이 스크립트가 data.js 의 module.exports 를 읽어 .json 들을 동기화한다(드리프트 0).
// style.json 의 master_palette/role_colors 는 assets/palette.master.json 으로도
// emit 한다(style-architect 상속 계약 — item §7 / ability §8 / 생성기가 읽는 상류 진실).
//   node tools/emit-json.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const mod = await import(pathToFileURL(resolve(root, 'data.js')).href)
const { STYLE, ABILITIES, ITEMS, AUDIO } = mod.default || mod

const out = [
  ['style.json', STYLE],
  ['abilities.json', ABILITIES],
  ['items.json', ITEMS],
  ['audio.json', AUDIO]
]
for (const [name, obj] of out) {
  writeFileSync(resolve(root, name), JSON.stringify(obj, null, 2) + '\n', 'utf8')
  console.log('wrote', name)
}

// 마스터 팔레트 emit (palette.master.json = master_palette + role_colors + variants)
mkdirSync(resolve(root, 'assets'), { recursive: true })
const masterPalette = {
  slug: STYLE.slug,
  master_palette: STYLE.master_palette,
  role_colors: STYLE.role_colors,
  variants: STYLE.variants
}
writeFileSync(resolve(root, 'assets/palette.master.json'), JSON.stringify(masterPalette, null, 2) + '\n', 'utf8')
console.log('wrote', 'assets/palette.master.json')
