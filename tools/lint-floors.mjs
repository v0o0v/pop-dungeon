#!/usr/bin/env node
/* ============================================================================
 * lint-floors.mjs — 100층 floors 데이터 무결성 검증 (L3 산출 · 플랜 §4·§7 AC#4)
 * ----------------------------------------------------------------------------
 * Phase 3(100층 양산)의 진입 게이트. floors 포맷이 굳는 시점에 검증 도구도 함께
 * 굳혀, 양산된 층이 실제 런타임에서 해석 가능함을 기계 보장한다.
 *
 * 검증 규칙(severity):
 *   [graph-isolated]   error  — 그래프에서 고립된 방(어디서도 못 감)
 *   [graph-reach]      error  — 시작방 → 출구/보스방 도달 불가(BFS)
 *   [graph-edge-ref]   error  — graph edge 가 존재하지 않는 방 id 참조
 *   [room-count]       error  — 방 수 6~10 벗어남(보스/이벤트층은 예외 허용)
 *   [grid-rect]        error  — grid 행 길이 불균일(직사각형 아님)
 *   [grid-wall-seal]   error  — 방 경계(테두리)가 벽으로 폐합 안 됨(탄/적 누출)
 *   [grid-spawn]       error  — 스폰('S') 0개 또는 2개+(시작방 1개 필수)
 *   [grid-spawn-walk]  error  — 스폰이 walkable 아님(벽 위)
 *   [grid-door-edge]   error  — 문('D')이 가장자리 아님(방향 추론 불가)
 *   [grid-door-graph]  error  — 방의 문 수 ≠ graph 상 인접 차수(문↔간선 불일치)
 *   [grid-reach]       error  — 방 내부 walkable 영역이 분리됨(스폰에서 문 못 감)
 *   [special-secret]   error  — 비밀방 0개(층당 ≥1 — 별이 흔적 기믹)
 *   [special-treasure] error  — 보물방 ≠ 1(층당 정확히 1, 보스층 예외)
 *   [boss-room]        error  — 보스층에 보스방 없음 / 출구('X') 없음
 *   [boss-exit]        warn   — 비보스층에 출구('X') 있음(혼동 — 보스층만 X)
 *   [template-ref]     warn   — 방 template 이 templates.js 에 없음(검증만)
 *   [clear-time]       info   — 방 수 기반 예상 클리어 시간 힌트
 *
 * 사용:
 *   node tools/lint-floors.mjs <floors.json | region-NN.floors.js | --self-test>
 *   --self-test : 내장 샘플 층(통과 2 + 의도적 오류 1)으로 자체 검증
 *
 * 입력: floors 배열(층 객체) 또는 단일 층 객체. region-NN.floors.js(UMD)도 로드.
 * ==========================================================================*/
import { readFileSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

// ── 템플릿 legend 로드(단일 진실 — data/floors/templates.js) ──────────────────
let LEGEND = null, WALL_CHARS = ['#', 'P'], TILE = 32, TEMPLATE_IDS = new Set()
try {
  const require = createRequire(import.meta.url)
  const { FLOOR_TEMPLATES } = require(resolve(root, 'data/floors/templates.js'))
  LEGEND = FLOOR_TEMPLATES.meta.legend
  WALL_CHARS = FLOOR_TEMPLATES.meta.wallChars
  TILE = FLOOR_TEMPLATES.meta.tile
  for (const t of FLOOR_TEMPLATES.templates) TEMPLATE_IDS.add(t.id)
} catch (e) {
  // templates.js 없으면 기본 규약으로 진행(경고만)
}
const isWall = (c) => WALL_CHARS.indexOf(c) >= 0
const isWalkable = (c) => c !== ' ' && !isWall(c)

// ── 검증 본체 ──────────────────────────────────────────────────────────────
function lintFloor(floor, findings) {
  const fid = floor.id || '(no-id)'
  const tag = (rule, sev, id, message) => findings.push({ rule, severity: sev, id: `${fid}:${id}`, message })

  const rooms = Array.isArray(floor.rooms) ? floor.rooms : []
  const graph = Array.isArray(floor.graph) ? floor.graph : []
  const special = floor.special || {}
  const isBossFloor = !!special.boss || rooms.some(r => {
    const tpl = r.template || ''
    return tpl === 'T_BOSS' || tpl === 'T_BOSS_LARGE'
  })
  const isEventFloor = !!special.event

  // ── 1. 방 수 범위(6~10, 보스/이벤트층 예외) ─────────────────────────────
  if (!isBossFloor && !isEventFloor) {
    if (rooms.length < 6 || rooms.length > 10)
      tag('room-count', 'error', 'rooms', `방 수 ${rooms.length} — 6~10 범위 벗어남(보스/이벤트층 외)`)
  } else {
    if (rooms.length < 1) tag('room-count', 'error', 'rooms', `방 0개`)
  }

  const roomIds = new Set(rooms.map(r => r.id))

  // ── 2. graph edge 참조 무결성 + 인접 차수 집계 ──────────────────────────
  const adj = {}
  for (const id of roomIds) adj[id] = new Set()
  for (const e of graph) {
    if (!roomIds.has(e.from)) { tag('graph-edge-ref', 'error', `edge`, `graph from "${e.from}" 방 없음`); continue }
    if (!roomIds.has(e.to))   { tag('graph-edge-ref', 'error', `edge`, `graph to "${e.to}" 방 없음`); continue }
    adj[e.from].add(e.to); adj[e.to].add(e.from) // 무방향
  }

  // ── 3. 그래프 연결성: 고립 방 + 시작→출구/보스 도달성(BFS) ───────────────
  const startRoom = rooms.find(r => (r.template === 'T_ENTRY') || gridHas(r, 'S'))
    || rooms[0]
  if (rooms.length > 1) {
    // 고립: 차수 0인 방
    for (const r of rooms) {
      if ((adj[r.id] && adj[r.id].size === 0))
        tag('graph-isolated', 'error', r.id, `방 "${r.id}" 가 그래프에서 고립(간선 0)`)
    }
    // BFS 도달성
    if (startRoom) {
      const seen = new Set([startRoom.id]); const q = [startRoom.id]
      while (q.length) { const cur = q.shift(); for (const nx of (adj[cur] || [])) if (!seen.has(nx)) { seen.add(nx); q.push(nx) } }
      for (const r of rooms) if (!seen.has(r.id))
        tag('graph-reach', 'error', r.id, `방 "${r.id}" 가 시작방 "${startRoom.id}" 에서 도달 불가`)
      // 출구/보스방 도달성
      const exitRoom = rooms.find(r => gridHas(r, 'X') || r.template === 'T_BOSS' || r.template === 'T_BOSS_LARGE')
      if (exitRoom && !seen.has(exitRoom.id))
        tag('graph-reach', 'error', exitRoom.id, `출구/보스방 "${exitRoom.id}" 도달 불가`)
    }
  }

  // ── 4. 각 방 grid 유효성 ────────────────────────────────────────────────
  for (const r of rooms) {
    const grid = r.grid
    const rid = r.id || '(no-room-id)'
    if (!Array.isArray(grid) || grid.length === 0) { tag('grid-rect', 'error', rid, `grid 없음/빈 grid`); continue }
    const w = grid[0].length
    // 직사각형
    for (let y = 0; y < grid.length; y++) if (grid[y].length !== w) { tag('grid-rect', 'error', rid, `행 ${y} 길이 ${grid[y].length} ≠ ${w}`); }
    // 벽 폐합: 테두리 셀이 전부 벽 또는 문(문은 출입구라 허용) — 그 외 walkable 누출
    const H = grid.length
    for (let x = 0; x < w; x++) { checkBorder(grid, 0, x, rid, tag); checkBorder(grid, H - 1, x, rid, tag) }
    for (let y = 0; y < H; y++) { checkBorder(grid, y, 0, rid, tag); checkBorder(grid, y, w - 1, rid, tag) }
    // 스폰
    const spawns = countChar(grid, 'S')
    const isEntry = r.template === 'T_ENTRY'
    if (isEntry || r === startRoom) {
      if (spawns !== 1) tag('grid-spawn', 'error', rid, `시작방 스폰 'S' ${spawns}개(정확히 1 필요)`)
    } else if (spawns > 1) {
      tag('grid-spawn', 'error', rid, `스폰 'S' ${spawns}개(시작방 외엔 0 또는 1)`)
    }
    // 스폰 walkable
    forEachChar(grid, 'S', (y, x) => { if (!isWalkable(grid[y][x])) tag('grid-spawn-walk', 'error', rid, `스폰(${y},${x})이 walkable 아님`) })
    // 문 가장자리 + 차수 정합
    const doors = []
    forEachChar(grid, 'D', (y, x) => {
      doors.push([y, x])
      const onEdge = (y === 0 || y === H - 1 || x === 0 || x === w - 1)
      if (!onEdge) tag('grid-door-edge', 'error', rid, `문 'D'(${y},${x})가 가장자리 아님`)
    })
    // 문 수 ↔ graph 차수 정합(방이 2개 이상일 때만 의미)
    if (rooms.length > 1) {
      const degree = (adj[rid] ? adj[rid].size : 0)
      if (doors.length !== degree)
        tag('grid-door-graph', 'error', rid, `문 ${doors.length}개 ≠ graph 인접 차수 ${degree}(문↔간선 불일치)`)
    }
    // 방 내부 도달성: 스폰(또는 첫 walkable)에서 모든 문 도달 가능?
    if (doors.length > 0) {
      const start = firstChar(grid, 'S') || firstWalkable(grid)
      if (start) {
        const reached = floodWalkable(grid, start[0], start[1])
        for (const [dy, dx] of doors)
          if (!reached.has(dy + ',' + dx)) tag('grid-reach', 'error', rid, `문(${dy},${dx})이 방 내부에서 도달 불가(벽으로 막힘)`)
      }
    }
    // 템플릿 참조(검증만)
    if (r.template && TEMPLATE_IDS.size > 0 && !TEMPLATE_IDS.has(r.template))
      tag('template-ref', 'warn', rid, `template "${r.template}" 가 templates.js 에 없음`)
  }

  // ── 5. 특수방 규칙 ──────────────────────────────────────────────────────
  const secretCount = rooms.filter(r => r.template === 'T_SECRET' || (r.gimmick && /secret|star_trace|trace/.test(r.gimmick))).length
  const treasureCount = rooms.filter(r => r.template === 'T_TREASURE').length
  if (!isBossFloor) {
    if (secretCount < 1) tag('special-secret', 'error', 'special', `비밀방 0개(층당 ≥1 — 별이 흔적 기믹)`)
    if (treasureCount !== 1) tag('special-treasure', 'error', 'special', `보물방 ${treasureCount}개(층당 정확히 1)`)
  }

  // ── 6. 보스층 규칙 ──────────────────────────────────────────────────────
  if (isBossFloor) {
    const bossRoom = rooms.find(r => r.template === 'T_BOSS' || r.template === 'T_BOSS_LARGE')
    if (!bossRoom) tag('boss-room', 'error', 'boss', `보스층에 보스방(T_BOSS/T_BOSS_LARGE) 없음`)
    const hasExit = rooms.some(r => gridHas(r, 'X'))
    if (!hasExit) tag('boss-room', 'error', 'boss', `보스층에 출구 'X' 없음`)
  } else {
    // 비보스층에 X 있으면 혼동
    const strayExit = rooms.find(r => gridHas(r, 'X'))
    if (strayExit) tag('boss-exit', 'warn', strayExit.id, `비보스층에 출구 'X' 존재(보스층만 X 권장)`)
  }

  // ── 7. 클리어 시간 힌트(info) ───────────────────────────────────────────
  const combatRooms = rooms.filter(r => {
    const tpl = (r.template || '')
    return tpl !== 'T_ENTRY' && tpl !== 'T_TREASURE' && tpl !== 'T_REST' && tpl !== 'T_CORRIDOR'
  }).length
  tag('clear-time', 'info', 'time', `전투방 ${combatRooms}개 — 예상 ${combatRooms * 18}~${combatRooms * 30}초`)
}

// ── grid 헬퍼 ──────────────────────────────────────────────────────────────
function checkBorder(grid, y, x, rid, tag) {
  const c = grid[y][x]
  // 테두리는 벽('#'/'P') 또는 문('D')만 허용. 바닥/스폰/적/보물/출구가 테두리에 있으면 누출.
  if (c === ' ' || isWall(c) || c === 'D') return
  tag('grid-wall-seal', 'error', rid, `테두리(${y},${x})='${c}' — 벽 폐합 안 됨(walkable 누출)`)
}
function gridHas(r, ch) { return Array.isArray(r.grid) && r.grid.some(row => row.indexOf(ch) >= 0) }
function countChar(grid, ch) { let n = 0; for (const row of grid) for (const c of row) if (c === ch) n++; return n }
function forEachChar(grid, ch, fn) { for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y].length; x++) if (grid[y][x] === ch) fn(y, x) }
function firstChar(grid, ch) { for (let y = 0; y < grid.length; y++) { const x = grid[y].indexOf(ch); if (x >= 0) return [y, x] } return null }
function firstWalkable(grid) { for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y].length; x++) if (isWalkable(grid[y][x])) return [y, x]; return null }
function floodWalkable(grid, sy, sx) {
  const seen = new Set([sy + ',' + sx]); const q = [[sy, sx]]
  const H = grid.length
  while (q.length) {
    const [y, x] = q.shift()
    for (const [dy, dx] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const ny = y + dy, nx = x + dx
      if (ny < 0 || ny >= H || nx < 0 || nx >= grid[ny].length) continue
      const k = ny + ',' + nx
      if (seen.has(k)) continue
      if (!isWalkable(grid[ny][nx])) continue
      seen.add(k); q.push([ny, nx])
    }
  }
  return seen
}

// ── 입력 로드 ──────────────────────────────────────────────────────────────
function loadFloors(arg) {
  const ext = extname(arg)
  if (ext === '.js') {
    const require = createRequire(import.meta.url)
    const mod = require(resolve(arg))
    // region-NN.floors.js → { FLOORS } or { REGION_NN } — 배열 추출
    const obj = mod.FLOORS || mod.default || mod
    if (Array.isArray(obj)) return obj
    if (obj && Array.isArray(obj.floors)) return obj.floors
    // 첫 배열 값 탐색
    for (const k of Object.keys(obj)) if (Array.isArray(obj[k])) return obj[k]
    return [obj]
  }
  const raw = JSON.parse(readFileSync(resolve(arg), 'utf8'))
  if (Array.isArray(raw)) return raw
  if (raw.floors && Array.isArray(raw.floors)) return raw.floors
  return [raw]
}

// ── 자체 검증 샘플(region-01용 통과 2 + 의도적 오류 1) ───────────────────────
function selfTestSamples() {
  // 통과 샘플 A: 일반층 7방. graph 차수 = 방의 문('D') 수 정확히 일치해야 함.
  //   graph: r1-r2, r2-r3, r2-r7, r7-r4, r7-r5, r4-r6
  //   차수: r1=1, r2=3, r3=1, r4=2, r5=1, r6=1, r7=3
  const floorPass1 = {
    id: 'floor-01', region: 'region-01', theme: 'mossy-cave',
    rooms: [
      // r1 차수1: 문 1(E변)
      { id: 'r1', template: 'T_ENTRY', grid: ["#######", "#.....#", "#..S..D", "#.....#", "#######"], spawns: [] },
      // r2 차수3: 문 3(W=r1, E=r7, S=r3)
      { id: 'r2', template: 'T_ARENA', grid: ["###D###", "D.....D", "#.E.E.#", "#.....#", "#######"], spawns: [{ type: 'shard_drifter', count: 2 }] },
      // r3 차수1: 문 1(N=r2)
      { id: 'r3', template: 'T_SMALL', grid: ["###D###", "#.....#", "#.E.E.#", "#.....#", "#######"], spawns: [{ type: 'shard_drifter', count: 2 }] },
      // r4 차수2: 문 2(W=r7, S=r6)
      { id: 'r4', template: 'T_PILLARS', grid: ["#######", "D.P.P.#", "#.....#", "#.P.P.#", "###D###"], spawns: [{ type: 'shard_darter', count: 1 }] },
      // r5 차수1: 문 1(W=r7)
      { id: 'r5', template: 'T_TREASURE', grid: ["#######", "#.....#", "D..T..#", "#.....#", "#######"], spawns: [] },
      // r6 차수1: 문 1(N=r4)
      { id: 'r6', template: 'T_SECRET', grid: ["##D##", "#...#", "#.T.#", "#...#", "#####"], spawns: [], gimmick: 'star_trace' },
      // r7 차수3: 문 3(W=r2, E=r5, N=r4)
      { id: 'r7', template: 'T_CORRIDOR', grid: ["##D##", "D...D", "#.E.#", "#...#", "#####"], spawns: [{ type: 'shard_drifter', count: 1 }] }
    ],
    graph: [
      { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r2', to: 'r7' },
      { from: 'r7', to: 'r4' }, { from: 'r7', to: 'r5' }, { from: 'r4', to: 'r6' }
    ],
    special: { secret: 'r6', treasure: 'r5' }
  }
  // 통과 샘플 B: 보스층(10층) — 보스방 + 출구 X
  const floorPass2 = {
    id: 'floor-10', region: 'region-01', theme: 'mossy-cave',
    rooms: [
      { id: 'b1', template: 'T_ENTRY', grid: ["#######", "#.....#", "#..S..D", "#.....#", "#######"], spawns: [] },
      { id: 'b2', template: 'T_BOSS', grid: ["###############", "#.............#", "#.............#", "#......E......#", "#.............#", "D.....S......X#", "#.............#", "#.............#", "#.............#", "###############"], spawns: [{ type: 'boss_gateknot', count: 1 }] }
    ],
    graph: [{ from: 'b1', to: 'b2' }],
    special: { boss: 'b2' }
  }
  // 의도적 오류 샘플: 고립 방(r3 간선 0) + 막힌 문(r2 내부 벽으로 분리) + 비밀방 없음 + 보물방 2개
  const floorFail = {
    id: 'floor-bad', region: 'region-01', theme: 'mossy-cave',
    rooms: [
      { id: 'r1', template: 'T_ENTRY', grid: ["#######", "#.....#", "#..S..D", "#.....#", "#######"], spawns: [] },
      // r2: 문 2개인데 내부가 벽 기둥으로 막혀 한쪽 문 도달 불가
      { id: 'r2', template: 'T_ARENA', grid: ["#######", "D..#..D", "#..#..#", "#..#..#", "#######"], spawns: [] },
      { id: 'r3', template: 'T_SMALL', grid: ["#####", "#...#", "#.E.#", "#...#", "#####"], spawns: [] }, // 고립(간선 0, 문 없음)
      { id: 'r4', template: 'T_TREASURE', grid: ["#######", "#.....#", "D..T..#", "#.....#", "#######"], spawns: [] },
      { id: 'r5', template: 'T_TREASURE', grid: ["#######", "#.....#", "D..T..#", "#.....#", "#######"], spawns: [] } // 보물방 2개째(위반)
    ],
    graph: [{ from: 'r1', to: 'r2' }, { from: 'r2', to: 'r4' }, { from: 'r4', to: 'r5' }],
    special: {}
  }
  return { pass: [floorPass1, floorPass2], fail: [floorFail] }
}

function run(floors, label) {
  const findings = []
  for (const f of floors) lintFloor(f, findings)
  const counts = { error: 0, warn: 0, info: 0 }
  for (const f of findings) counts[f.severity]++
  const ok = counts.error === 0
  for (const f of findings) {
    const sym = f.severity === 'error' ? '✗' : f.severity === 'warn' ? '⚠' : 'ℹ'
    console.log(`${sym} [${f.rule}] ${f.id}: ${f.message}`)
  }
  console.log(`— ${label}: error ${counts.error} · warn ${counts.warn} · info ${counts.info}`)
  return { ok, counts, findings }
}

// ── main ───────────────────────────────────────────────────────────────────
const arg = process.argv[2]
if (!arg) {
  console.error('usage: node tools/lint-floors.mjs <floors.json|region-NN.floors.js|--self-test>')
  process.exit(2)
}

if (arg === '--self-test') {
  const { pass, fail } = selfTestSamples()
  console.log('=== 통과 샘플(error 0 기대) ===')
  const rPass = run(pass, 'pass-samples')
  console.log('\n=== 오류 샘플(error >0 기대 — 고립방·막힌문·비밀방없음·보물방2) ===')
  const rFail = run(fail, 'fail-samples')
  const passOk = rPass.counts.error === 0
  const failDetected = rFail.counts.error > 0
  // 검출되어야 할 핵심 규칙들
  const failRules = new Set(rFail.findings.filter(f => f.severity === 'error').map(f => f.rule))
  const expectedFail = ['graph-isolated', 'grid-reach', 'special-secret', 'special-treasure']
  const missed = expectedFail.filter(r => !failRules.has(r))
  console.log('\n=== self-test 판정 ===')
  console.log(`통과 샘플 error 0: ${passOk ? 'PASS' : 'FAIL'}`)
  console.log(`오류 샘플 검출(error>0): ${failDetected ? 'PASS' : 'FAIL'}`)
  console.log(`핵심 오류 규칙 검출 ${expectedFail.length - missed.length}/${expectedFail.length}${missed.length ? ' — 누락: ' + missed.join(',') : ''}`)
  const allOk = passOk && failDetected && missed.length === 0
  console.log(`\nSELF-TEST: ${allOk ? 'PASS ✓' : 'FAIL ✗'}`)
  process.exit(allOk ? 0 : 1)
}

const floors = loadFloors(arg)
const { ok, counts, findings } = run(floors, arg)
console.log(JSON.stringify({ ok, counts, findings, file: arg }))
process.exit(ok ? 0 : 1)
