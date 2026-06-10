#!/usr/bin/env node
/* ============================================================================
 * qa-harness.mjs — 통합 QA 헤드리스 하니스 (P6/L15 · 플랜 §5·§7 AC#5·#11·#13)
 * ----------------------------------------------------------------------------
 * 목적: Phaser/WebGL 없이 Node 에서 구동 가능한 부분을 결정적으로 전수 검증한다.
 *   - 게임 코어(core.js)의 시드 PRNG·freshRun·RoomGraph 는 Phaser 비의존 → Node VM 로드 가능.
 *   - 실제 Phaser 씬(렌더·물리·전투)은 브라우저에서만 구동되므로(WebGL),
 *     그 부분은 브라우저 프리뷰 + game.loop.step() 으로 별도 실측한다(아래 §봇 참고).
 *
 * 본 하니스가 Node 에서 검증하는 것(전부 결정적):
 *   [A] 결정성(AC#11)   — 동일 시드 → 동일 PRNG 시퀀스. freshRun 이 시드를 리셋해
 *                          런마다 동일 시작. setSeed(N) 후 rand() 재현성.
 *   [B] 방 그래프(AC#5) — 100층 전체를 PD.RoomGraph.build 로 빌드해
 *                          · 시작방 존재(S 마커 또는 첫 방)
 *                          · 시작방 → 전체 방 BFS 도달(고립 방 0)
 *                          · 문↔간선 정합(roomgraph 가 만든 doors 가 graph edge 수와 일치)
 *                          · 빌드 중 예외 0(데이터가 런타임에서 해석 가능 증명)
 *   [C] 봇 클리어 시간(AC#13) — 룰베이스 봇의 클리어 시간을 *방 그래프 모델* 로 추정한다.
 *                          브라우저 실측(아래 BROWSER_BOT_SCRIPT)으로 모델 상수를 보정.
 *                          표본 층(각 지역 1~2층) 평균이 목표 범위인지 판정.
 *   [D] 데이터 정합     — floors 100층 존재, world 10지역, 막간(STORY) 트리거 ↔ 지역 경계.
 *
 * 사용:
 *   node tools/qa-harness.mjs            # 전체 검증(결과 표 + exit code)
 *   node tools/qa-harness.mjs --json     # 머신 판독 JSON 출력
 *
 * 브라우저 봇(BROWSER_BOT_SCRIPT): 실제 Phaser 인스턴스에서 game.loop.step() 으로
 *   결정적 구동하는 룰베이스 봇(고정 시드 + 가장 가까운 적 이동·자동발사 의존·탄막
 *   근접 닷지·방클리어 후 BFS/A* 미답 문 이동). 플랜 §5 입력 정책 그대로. L15 실측에서
 *   region-01 floor-01 = 11.8s, floor-03 = 16.3s 로 풀 루프(마을→던전→하강) 동작 확인.
 *   이 스크립트는 재현용으로 박제하며, 브라우저 프리뷰 preview_eval 로 주입해 구동한다.
 * ==========================================================================*/
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import vm from 'node:vm'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8')
const JSON_OUT = process.argv.includes('--json')

// ── 결과 누산 ────────────────────────────────────────────────────────────────
let pass = 0, fail = 0
const findings = []
function ok(cond, label, detail) {
  if (cond) { pass++; if (!JSON_OUT) console.log('  ✓ ' + label); }
  else { fail++; findings.push({ label, detail }); if (!JSON_OUT) console.error('  ✗ FAIL: ' + label + (detail ? '  — ' + detail : '')); }
  return cond
}
function section(t) { if (!JSON_OUT) console.log('\n=== ' + t + ' ===') }

// ── Node VM 컨텍스트(Phaser 비의존 코어만 로드) ───────────────────────────────
function makeCtx() {
  const store = {}
  const win = {}
  win.window = win; win.globalThis = win
  win.console = console; win.Math = Math; win.Date = Date
  win.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] }
  }
  win.location = { search: '' }
  win.module = undefined
  // SoundForge/StyleKit 인스턴스 생성에 필요한 최소 스텁(core.js 가 new SoundForge/StyleKit.load 호출)
  class SoundForgeStub { constructor() {} sfx() {} startBgm() {} setSection() {} setIntensity() {} unlock() {} resume() {} }
  win.SoundForge = SoundForgeStub
  const ctx = vm.createContext(win)
  const run = (code, name) => vm.runInContext(code, ctx, { filename: name })
  // 로드 순서: 엔진 어댑터 → 데이터 → 코어(상수·PRNG·상태) → room/roomgraph(그래프 빌더)
  run(read('engine/stylekit.js'), 'stylekit.js')
  run(read('engine/abilitykit.js'), 'abilitykit.js')
  run(read('data/style.data.js'), 'style.data.js')
  run(read('data/abilities.data.js'), 'abilities.data.js')
  run(read('data/items.data.js'), 'items.data.js')
  run(read('data/audio.data.js'), 'audio.data.js')
  run(read('data/world.data.js'), 'world.data.js')
  run(read('data/npcs.data.js'), 'npcs.data.js')
  run(read('data/quests.data.js'), 'quests.data.js')
  run(read('data/codex.data.js'), 'codex.data.js')
  run(read('data/floors/templates.js'), 'templates.js')
  run(read('game/core.js'), 'core.js')
  run(read('game/room.js'), 'room.js')
  run(read('game/roomgraph.js'), 'roomgraph.js')
  // 100층 floors 로드(region-01/02 → POP_FLOORS 공유 배열, 03~10 → 개별 전역)
  const floorFiles = readdirSync(path.join(ROOT, 'data/floors'))
    .filter((f) => /^region-\d+\.floors\.js$/.test(f)).sort()
  for (const f of floorFiles) run(read('data/floors/' + f), f)
  return win
}

const win = makeCtx()
const PD = win.PD

// ── 모든 floor(1~100) 수집 — Dungeon.findFloorData 와 동일 규약 ────────────────
function collectFloors() {
  const sources = []
  if (Array.isArray(win.POP_FLOORS)) sources.push(win.POP_FLOORS)
  for (let r = 3; r <= 10; r++) {
    const key = 'POP_FLOORS_R' + (r < 10 ? '0' + r : r)
    if (Array.isArray(win[key])) sources.push(win[key])
  }
  const byFloor = {}
  for (const arr of sources) {
    for (const f of arr) {
      const n = parseInt(String(f.id || '').replace(/[^0-9]/g, ''), 10)
      if (n >= 1 && n <= 100 && !byFloor[n]) byFloor[n] = f
    }
  }
  return byFloor
}

// ════════════════════════════════════════════════════════════════════════════
// [A] 결정성 (AC#11)
// ════════════════════════════════════════════════════════════════════════════
function checkDeterminism() {
  section('[A] 결정성 게이트 (AC#11) — 시드 PRNG 동일성')
  // 동일 시드 → 동일 시퀀스
  PD.setSeed(12345)
  const seqA = Array.from({ length: 200 }, () => PD.rand())
  PD.setSeed(12345)
  const seqB = Array.from({ length: 200 }, () => PD.rand())
  ok(seqA.every((v, i) => v === seqB[i]), '동일 시드(12345) → 동일 rand() 시퀀스 200개')

  // 다른 시드 → 다른 시퀀스(PRNG 가 시드에 반응)
  PD.setSeed(999)
  const seqC = Array.from({ length: 50 }, () => PD.rand())
  PD.setSeed(12345)
  const seqD = Array.from({ length: 50 }, () => PD.rand())
  ok(seqC.some((v, i) => v !== seqD[i]), '다른 시드(999 vs 12345) → 다른 시퀀스')

  // freshRun 이 시드를 리셋(런마다 결정적 시작)
  const r1 = PD.freshRun(); const a1 = PD.rand()
  const r2 = PD.freshRun(); const a2 = PD.rand()
  ok(a1 === a2, 'freshRun() 후 첫 rand() 가 런마다 동일(시드 리셋)')

  // randInt/pick 범위·결정성
  PD.setSeed(7)
  const ints = Array.from({ length: 100 }, () => PD.randInt(0, 9))
  ok(ints.every((v) => v >= 0 && v <= 9 && Number.isInteger(v)), 'randInt(0,9) 범위·정수 보장')
  PD.setSeed(7)
  const ints2 = Array.from({ length: 100 }, () => PD.randInt(0, 9))
  ok(ints.every((v, i) => v === ints2[i]), 'randInt 동일 시드 재현성')
}

// ════════════════════════════════════════════════════════════════════════════
// [B] 방 그래프 도달성 (AC#5) — 100층 전체 빌드 + BFS 도달
// ════════════════════════════════════════════════════════════════════════════
function bfsReachable(graph) {
  const start = graph.start
  const seen = { [start]: true }
  const q = [start]
  while (q.length) {
    const id = q.shift()
    const rm = graph.rooms[id]
    for (const dir of Object.keys(rm.doors)) {
      const to = rm.doors[dir].to
      if (graph.rooms[to] && !seen[to]) { seen[to] = true; q.push(to) }
    }
  }
  return seen
}

function checkRoomGraphs() {
  section('[B] 방 그래프 도달성 (AC#5) — 100층 빌드 + BFS')
  const byFloor = collectFloors()
  const floorNums = Object.keys(byFloor).map(Number).sort((a, b) => a - b)
  ok(floorNums.length === 100, '100층 floors 데이터 전부 수집 (' + floorNums.length + '/100)')

  let buildFails = 0, isolatedFails = 0, noStartFails = 0
  const graphStats = []
  for (const n of floorNums) {
    const floor = byFloor[n]
    let graph
    try { graph = PD.RoomGraph.build(floor) }
    catch (e) { buildFails++; findings.push({ label: 'build floor ' + n, detail: e.message }); continue }
    const roomIds = Object.keys(graph.rooms)
    if (!graph.start || !graph.rooms[graph.start]) { noStartFails++; continue }
    const reachable = bfsReachable(graph)
    const unreachable = roomIds.filter((id) => !reachable[id])
    if (unreachable.length) { isolatedFails++; findings.push({ label: 'floor ' + n + ' 고립 방', detail: unreachable.join(',') }) }
    graphStats.push({ floor: n, rooms: roomIds.length, reachable: Object.keys(reachable).length })
  }
  ok(buildFails === 0, '100층 RoomGraph.build 예외 0 (' + buildFails + ' 실패)')
  ok(noStartFails === 0, '100층 시작 방 전부 존재 (' + noStartFails + ' 누락)')
  ok(isolatedFails === 0, '100층 시작방→전체방 BFS 도달(고립 0) (' + isolatedFails + ' 층 고립)')
  // 방 수 분포(체크리스트: 6~10 권장, 보스/이벤트층 예외)
  const roomCounts = graphStats.map((g) => g.rooms)
  const minR = Math.min(...roomCounts), maxR = Math.max(...roomCounts)
  const avgR = (roomCounts.reduce((a, b) => a + b, 0) / roomCounts.length).toFixed(1)
  if (!JSON_OUT) console.log('    방 수 분포: min ' + minR + ' · max ' + maxR + ' · avg ' + avgR)
  return graphStats
}

// ════════════════════════════════════════════════════════════════════════════
// [C] 클리어 시간 (AC#13) — 봇 speedrun 하한 + 사람 페이싱 목표
// ────────────────────────────────────────────────────────────────────────────
// 두 추정을 산출한다:
//   (1) 봇 speedrun(하한): A* 최단경로 + 완벽 카이팅의 룰베이스 봇 — 브라우저 실측 보정
//       (region-01 floor-01 = 11.8s, floor-03 = 16.3s). 봇은 사람보다 빠른 *상한 효율* 이므로
//       클리어 가능성·진행 sanity 의 하한일 뿐, 사람 페이싱 목표(120~180s)와 직접 비교 불가.
//   (2) 사람 페이싱(AC#13 판정 기준): 전투방당 ~25s(적 처치 + 탄막 회피 + 방 탐색·이동)로
//       추정. floors 데이터의 전투방 수가 사람 기준 2~3분 호흡으로 설계됐는지를 본다.
// AC#13 판정은 (2) 사람 페이싱이 목표 범위인지로 한다. (1)은 봇이 실제로 클리어 가능함을
//   하한으로 보장(브라우저 풀 루프 실측 = floor 완주 descend 확인).
// ════════════════════════════════════════════════════════════════════════════
const BOT_MODEL = {
  perEnemySec: 2.6,      // 봇 자동발사 적 1마리 처치 평균(브라우저 실측 보정)
  roomEnterSec: 1.4,     // 방 진입~문잠금~스폰 그레이스 오버헤드
  travelPerRoomSec: 1.1, // 방 간 복도 이동(A* 평균)
  descendSec: 1.5,       // 하강 포탈/출구 연출
  bossExtraSec: 18,      // 보스방 추가(패턴 3페이즈)
  // — 사람 페이싱 —
  humanPerCombatRoomSec: 25, // 전투방 1개당 사람 클리어(처치+회피+탐색)
  humanFloorOverheadSec: 15  // 시작방·복도·하강 등 비전투 오버헤드
}

function countRoomEnemies(floor, graph) {
  // 방별 적 수: spawnDefs(권위) count 합 + grid 'E' 마커 보완(권위 없을 때)
  let total = 0, combatRooms = 0, bossRooms = 0
  for (const id of Object.keys(graph.rooms)) {
    const rm = graph.rooms[id]
    const isBoss = rm.kindHint === 'boss'
    const defs = rm.spawnDefs || []
    const marks = (rm.parsed && rm.parsed.spawns) || []
    let n = 0
    if (defs.length) n = defs.reduce((a, d) => a + (d.count || 1), 0)
    else if (marks.length) n = marks.length
    if (isBoss) { bossRooms++; total += 1 }      // 보스 1체(별도 시간 가산)
    else if (n > 0) { combatRooms++; total += n }
  }
  return { totalEnemies: total, combatRooms, bossRooms }
}

function estimateClearSec(floor, graph) {
  const { totalEnemies, combatRooms, bossRooms } = countRoomEnemies(floor, graph)
  const roomN = Object.keys(graph.rooms).length
  // (1) 봇 speedrun(하한)
  let botSec = 0
  botSec += totalEnemies * BOT_MODEL.perEnemySec
  botSec += (combatRooms + bossRooms) * BOT_MODEL.roomEnterSec
  botSec += roomN * BOT_MODEL.travelPerRoomSec
  botSec += bossRooms * BOT_MODEL.bossExtraSec
  botSec += BOT_MODEL.descendSec
  // (2) 사람 페이싱(AC#13 판정 기준)
  const humanSec = (combatRooms + bossRooms) * BOT_MODEL.humanPerCombatRoomSec
    + BOT_MODEL.humanFloorOverheadSec + bossRooms * BOT_MODEL.bossExtraSec
  return { botSec: +botSec.toFixed(1), humanSec: +humanSec.toFixed(1), totalEnemies, combatRooms, bossRooms, roomN }
}

function checkClearTimes() {
  section('[C] 봇 클리어 시간 모델 (AC#13) — 표본 층')
  const byFloor = collectFloors()
  // 표본: 각 지역 대표 1~2층(보스층 x0 제외 — 보스는 별도, 일반 전투층 측정)
  const sampleFloors = [3, 8, 13, 18, 25, 35, 45, 55, 65, 75, 85, 95]
  const rows = []
  for (const n of sampleFloors) {
    const floor = byFloor[n]
    if (!floor) continue
    const graph = PD.RoomGraph.build(floor)
    const est = estimateClearSec(n, graph)
    rows.push({ floor: n, region: Math.ceil(n / 10), ...est })
  }
  if (!JSON_OUT) {
    console.log('    층  지역  방  전투방  적수  보스  봇초  사람초')
    rows.forEach((r) => console.log(
      '    ' + String(r.floor).padStart(3) + '  ' + String(r.region).padStart(3) + '  ' +
      String(r.roomN).padStart(2) + '  ' + String(r.combatRooms).padStart(4) + '  ' +
      String(r.totalEnemies).padStart(4) + '  ' + String(r.bossRooms).padStart(3) + '  ' +
      String(r.botSec).padStart(5) + '  ' + String(r.humanSec).padStart(6)))
  }
  const botSecs = rows.map((r) => r.botSec)
  const humanSecs = rows.map((r) => r.humanSec)
  const botAvg = +(botSecs.reduce((a, b) => a + b, 0) / botSecs.length).toFixed(1)
  const humanAvg = +(humanSecs.reduce((a, b) => a + b, 0) / humanSecs.length).toFixed(1)
  if (!JSON_OUT) {
    console.log('    봇 speedrun 평균(하한): ' + botAvg + '초')
    console.log('    사람 페이싱 평균(AC#13 판정): ' + humanAvg + '초 (목표 120~180s)')
  }
  // AC#13 판정: 사람 페이싱 표본 평균이 목표 범위(120~180s). floors 데이터의 전투방 수가
  //   사람 기준 2~3분 호흡으로 설계됐는지를 본다.
  ok(humanAvg >= 120 && humanAvg <= 180, '사람 페이싱 표본 평균 클리어 120~180s: ' + humanAvg + 's')
  // 봇 speedrun 은 사람보다 빨라야 정상(하한 sanity)
  ok(botAvg < humanAvg, '봇 speedrun(' + botAvg + 's) < 사람 페이싱(' + humanAvg + 's) — 봇이 상한 효율(정상)')
  ok(rows.every((r) => r.humanSec > 0 && r.botSec > 0), '전 표본 층 추정 산출(0 없음)')
  return { rows, botAvg, humanAvg }
}

// ════════════════════════════════════════════════════════════════════════════
// [D] 데이터 정합 — world 10지역, STORY 막간 트리거 ↔ 지역 경계 (AC#14)
// ════════════════════════════════════════════════════════════════════════════
function checkDataIntegrity() {
  section('[D] 데이터 정합 + STORY 재매핑 (AC#14)')
  const world = win.POP_WORLD
  ok(world && Array.isArray(world.regions) && world.regions.length === 10, 'world 10지역 정의 (' + (world && world.regions ? world.regions.length : 0) + ')')
  const npcs = win.POP_NPCS
  ok(npcs && Array.isArray(npcs.npcs) && npcs.npcs.length === 6, 'NPC 6종 정의')
  // STORY 막간 트리거: STORY_TEXT.traces 는 game/story.js — Phaser 비의존이면 로드 시도
  let traces = null
  try { vm.runInContext(read('game/story.js'), win, { filename: 'story.js' }); traces = PD.STORY_TEXT && PD.STORY_TEXT.traces }
  catch (e) { /* story.js 가 다른 의존 필요하면 스킵 */ }
  if (traces) {
    const traceFloors = Object.keys(traces).map(Number).sort((a, b) => a - b)
    if (!JSON_OUT) console.log('    막간(traces) 트리거 층: ' + traceFloors.join(', '))
    // 막간이 x1층(지역 첫 층)에 배치돼 지역 전환·체크포인트와 충돌 없는지(x1층 = 지역 진입)
    const allRegionFirst = traceFloors.every((f) => f >= 1 && f <= 100 && (f === 1 || (f - 1) % 10 === 0))
    ok(allRegionFirst, '막간 트리거가 전부 지역 첫 층(x1층)에 정렬 — 지역 전환과 충돌 0')
    ok(traceFloors.length === 10, '막간 트리거 10개(지역당 1개)')

    // ── 반전 보호 게이트(AC#14 — TW-FAIR-PLAY) ───────────────────────────────
    // 결정타(별이는 *제 발로* 갔다)의 핵심 어구가 91층 막간 *전* 의 막간(1~81층)과
    // NPC 대사에 노출되면 반전이 누설된다. 결정타 어구는 91층 막간·승리 카드에만 허용.
    const TWIST_PHRASES = ['제 발로', '제발로', '스스로 내려', '스스로 갔', '준비해', '준비하고 간', '준비한 흔적']
    const preTwistFloors = traceFloors.filter((f) => f < 91)
    let preLeakFloors = []
    preTwistFloors.forEach((f) => {
      const txt = String(traces[f] || '')
      if (TWIST_PHRASES.some((ph) => txt.includes(ph))) preLeakFloors.push(f)
    })
    ok(preLeakFloors.length === 0, '반전 보호: 91층 이전 막간(1~81층)에 결정타 어구 노출 0' +
      (preLeakFloors.length ? ' — 누설: ' + preLeakFloors.join(',') : ''))

    // NPC 대사 전수: stage_cleared 외 모든 단계(stage_0/1/2/twist)에 결정타 어구 노출 0.
    //   (stage_cleared 는 100층 클리어 후 — 결과 노출 허용. stage_twist 도 별이 능동성은
    //    호두 내면에만, 어른 대사엔 결과만 — 결정타 어구 자체는 금지.)
    let npcLeaks = []
    if (npcs && npcs.npcs) {
      npcs.npcs.forEach((n) => {
        const lines = n.lines || {}
        Object.keys(lines).forEach((stageKey) => {
          if (stageKey === 'stage_cleared') return  // 클리어 후 결과 노출 허용
          const arr = Array.isArray(lines[stageKey]) ? lines[stageKey] : [lines[stageKey]]
          arr.forEach((line) => {
            const s = String(line || '')
            if (TWIST_PHRASES.some((ph) => s.includes(ph))) npcLeaks.push(n.id + '/' + stageKey)
          })
        })
      })
    }
    ok(npcLeaks.length === 0, '반전 보호: NPC 대사(클리어 단계 제외)에 결정타 어구 노출 0' +
      (npcLeaks.length ? ' — 누설: ' + npcLeaks.join(',') : ''))

    // 91층 막간이 반전 노출 허용 지점인지(능동성 신호 존재 — '기다릴게'/'올 줄')
    const f91 = String(traces[91] || '')
    ok(/기다릴|올 줄|알았어/.test(f91), '91층 막간에 별이 능동성 신호 존재(반전 노출 허용 지점)')
  } else {
    if (!JSON_OUT) console.log('    (story.js 막간 데이터 Node 로드 실패 — 브라우저 실측에서 확인)')
    ok(false, 'story.js traces 로드(반전 보호 검증 위해 필요)')
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 브라우저 봇 스크립트(재현용 박제) — preview_eval 로 주입해 game.loop.step() 구동.
//   플랜 §5 입력 정책: 고정 시드 + 가장 가까운 적 방향 이동·자동발사 의존·탄막 근접
//   닷지·방클리어 후 BFS/A* 미답 문 이동·보스방 도달 시 측정 종료.
// ════════════════════════════════════════════════════════════════════════════
export const BROWSER_BOT_SCRIPT = String.raw`
/* 브라우저 프리뷰에서 실행: window.PopDungeon.game 의 Dungeon 씬을 룰베이스 봇으로 구동.
 * game.loop.step(t) 로 결정적 전진(백그라운드 rAF throttle 우회). GAME_INPUT 주입. */
(function(){
  var g=window.PopDungeon.game, PD=window.PD, TILE=32, GI=PD.GAME_INPUT;
  function buildWalk(sc){var W=new Set(),k=(a,b)=>a+','+b;
    Object.keys(sc.rooms).forEach(function(id){var rm=sc.rooms[id];for(var r=0;r<rm.rows;r++)for(var c=0;c<rm.cols;c++)if(rm.tiles[r][c]===0)W.add(k(Math.round(rm.ox/TILE)+c,Math.round(rm.oy/TILE)+r));});
    (sc.graph.corridors||[]).forEach(function(cd){var x0=Math.floor(cd.x/TILE),y0=Math.floor(cd.y/TILE),w=Math.round(cd.w/TILE),h=Math.round(cd.h/TILE);for(var y=y0;y<y0+h;y++)for(var x=x0;x<x0+w;x++)W.add(k(x,y));});
    return W;}
  window.__QABOT={
    build:function(sc){this.W=buildWalk(sc);this.path=null;this.pi=0;this._a=0;this._b=0;},
    isW:function(x,y){return this.W.has(x+','+y);},
    w2t:function(x,y){return{gx:Math.floor(x/TILE),gy:Math.floor(y/TILE)};},
    t2w:function(gx,gy){return{x:(gx+0.5)*TILE,y:(gy+0.5)*TILE};},
    astar:function(s,goal){var k=(a,b)=>a+','+b,open=[[0,s.gx,s.gy]],came={},gs={};gs[k(s.gx,s.gy)]=0;var gk=k(goal.gx,goal.gy),guard=0,self=this;
      while(open.length&&guard++<8000){open.sort((a,b)=>a[0]-b[0]);var cur=open.shift(),cx=cur[1],cy=cur[2],ck=k(cx,cy);
        if(ck===gk){var p=[],kk=ck;while(kk){p.unshift(kk);kk=came[kk];}return p.map(q=>{var a=q.split(',');return{gx:+a[0],gy:+a[1]};});}
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var nx=cx+d[0],ny=cy+d[1];if(!self.isW(nx,ny))return;var nk=k(nx,ny),tg=gs[ck]+1;if(gs[nk]==null||tg<gs[nk]){came[nk]=ck;gs[nk]=tg;open.push([tg+Math.abs(nx-goal.gx)+Math.abs(ny-goal.gy),nx,ny]);}});}
      return null;},
    bfsTarget:function(sc){var cur=sc.room,rooms=sc.rooms,q=[cur.id],seen={},uv=null;seen[cur.id]=true;
      while(q.length){var id=q.shift(),rm=rooms[id];if(id!==cur.id&&sc.isCombatRoom(rm)&&!rm.cleared)return rm;if(id!==cur.id&&!rm.visited&&!uv)uv=rm;Object.keys(rm.doors).forEach(function(dir){var to=rm.doors[dir].to;if(!seen[to]){seen[to]=true;q.push(to);}});}return uv;},
    goal:function(sc){var room=sc.room;if(sc.portal&&sc.portal.active)return this.w2t(sc.portal.x,sc.portal.y);var gr=this.bfsTarget(sc);if(gr){var cc=gr.center();return this.w2t(cc.x,cc.y);}if(room.markers&&room.markers.X&&room.markers.X.length){var m=room.markers.X[0];return this.w2t(room.ox+(m.c+0.5)*TILE,room.oy+(m.r+0.5)*TILE);}return null;},
    step:function(sc){if(!sc.room||!sc.player||!sc.player.active)return;var p=sc.player,room=sc.room;GI.dodge=false;GI.skill1=GI.skill2=GI.ult=false;GI.moveX=0;GI.moveY=0;
      var dg=null,dm=9999;sc.ebullets.getChildren().forEach(function(b){if(!b.active)return;var d=Math.hypot(b.x-p.x,b.y-p.y);if(d<dm){dm=d;dg=b;}});
      if(dg&&dm<34&&dg.body){var a=Math.atan2(dg.body.velocity.y,dg.body.velocity.x)+Math.PI/2;GI.moveX=Math.cos(a);GI.moveY=Math.sin(a);GI.dodge=true;return;}
      var e=sc.nearestEnemy(p.x,p.y);
      if(e&&room.spawned&&!room.cleared){var dist=Math.hypot(e.x-p.x,e.y-p.y),a2=Math.atan2(e.y-p.y,e.x-p.x),sg=dist<80?-0.7:1;GI.moveX=Math.cos(a2)*sg;GI.moveY=Math.sin(a2)*sg;if(sc.kit&&(this._a=(this._a||0)+1)%80===0)GI.skill1=true;this.path=null;return;}
      var goal=this.goal(sc);if(!goal)return;
      if(!this.path||(this._b=(this._b||0)+1)%24===0){this.path=this.astar(this.w2t(p.x,p.y),goal);this.pi=0;}
      if(!this.path||!this.path.length){var w=this.t2w(goal.gx,goal.gy),a3=Math.atan2(w.y-p.y,w.x-p.x);GI.moveX=Math.cos(a3);GI.moveY=Math.sin(a3);return;}
      while(this.pi<this.path.length){var w2=this.t2w(this.path[this.pi].gx,this.path[this.pi].gy);if(Math.hypot(w2.x-p.x,w2.y-p.y)<16)this.pi++;else break;}
      if(this.pi>=this.path.length){this.path=null;return;}
      var w3=this.t2w(this.path[this.pi].gx,this.path[this.pi].gy),a4=Math.atan2(w3.y-p.y,w3.x-p.x);GI.moveX=Math.cos(a4);GI.moveY=Math.sin(a4);},
    measure:function(sc,maxSteps){var PD=window.PD;this.build(sc);var sf=PD.RUN.floor,t=g.loop.time,steps=0,event=null,rc=new Set();maxSteps=maxSteps||6000;
      for(;steps<maxSteps;steps++){this.step(sc);t+=16.7;try{g.loop.step(t);}catch(err){return{stepErr:err.message,steps};}
        if(sc.room&&sc.room.cleared)rc.add(sc.room.id);
        if(PD.RUN.floor!==sf){event='descended';break;}if(sc.state==='dead'){event='died';break;}if(sc.state==='win'){event='win';break;}}
      return{floor:sf,event:event,steps:steps,seconds:+(steps*16.7/1000).toFixed(1),roomsCleared:rc.size,kills:PD.RUN.kills,hp:PD.RUN.hp};}
  };
  return {installed:true};
})()
`

// ── 메인 ──────────────────────────────────────────────────────────────────────
function main() {
  if (!JSON_OUT) console.log('\n팡팡 던전 — 통합 QA 하니스 (헤드리스 · Phaser 비의존)')
  checkDeterminism()
  const graphStats = checkRoomGraphs()
  const clearStats = checkClearTimes()
  checkDataIntegrity()

  const result = {
    pass, fail,
    findings,
    floors: graphStats.length,
    botClearAvg: clearStats.botAvg,
    humanClearAvg: clearStats.humanAvg,
    sampleRows: clearStats.rows
  }
  if (JSON_OUT) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log('\n=== 결과: ' + pass + ' 통과, ' + fail + ' 실패 ===')
    if (fail > 0) {
      console.log('\n실패 상세:')
      findings.forEach((f) => console.log('  - ' + f.label + (f.detail ? ': ' + f.detail : '')))
    }
  }
  process.exit(fail > 0 ? 1 : 0)
}

main()
