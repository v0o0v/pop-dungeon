/* ============================================================================
 * region-09 floors — 서두른 발자국 비탈 (81~90층) · P3-B5 산출
 * ----------------------------------------------------------------------------
 * 설계 진실: .omc/plans/floors-design/region-09.md (P3-A 사양서)
 * 정합 소스: STORY.md §12·§13 / data/world.data.js region-09 / data/codex.data.js
 *            / data/floors/templates.js(GRID_LEGEND·템플릿) / tools/lint-floors.mjs
 *
 * 바이옴 `hasty-slope` — 가파른 하강 비탈. 주력 적 `shard_faller`(elite, 고속 낙하).
 * 100층 일반층 중 최고난도 지역(최종 보스 직전). 90층 보스 `boss_slopeblock`.
 * 81층 막간 기믹 `running_footprints`(뛰는 발자국 — 도망 아닌 서두름).
 *
 * 포맷(region-01.sample.js 규약 그대로):
 *   { id, region, theme, rooms:[{id, template, grid:[ASCII], spawns:[{type,count}], gimmick?}],
 *     graph:[{from,to}], special:{boss?,secret?,treasure?} }
 *   - grid 문자: # 벽 / . 바닥 / D 문 / S 스폰 / E 적 / X 출구 / T 보물 / P 기둥
 *   - graph 무방향 간선. 방의 문('D') 수 = 그 방 graph 인접 차수(lint 강제).
 *   - 일반층: 방 6~10, 비밀방 ≥1, 보물방 정확히 1. 보스층: 보스방 + 출구 X.
 *
 * 브라우저: window.POP_FLOORS_R09. Node: module.exports.FLOORS.
 * ==========================================================================*/
(function (g) {
  'use strict';

  var THEME = 'hasty-slope';
  var R = 'region-09';
  var F = 'shard_faller'; // region-09 단독 elite(고속 낙하)

  // ── 방 grid 빌더(템플릿 정합·벽 폐합·문 차수 일치) ────────────────────────────
  // 핵심 규약: grid 의 문('D') 개수 = 그 방의 graph 인접 차수(lint grid-door-graph).
  // 그래서 빌더 이름 끝 숫자 = 문 개수다. 전투/특수방은 'S' 없음(시작방 T_ENTRY 단 1).
  // 내부는 개활(한 덩어리)이라 grid-reach 안전. 문은 가장자리에만(grid-door-edge).
  // 차수 d 인 방은 dN()을 쓴다 — 문을 W/E/N/S 순서로 배치.

  // T_ENTRY (문 1, E변) — 모든 층 시작방. 차수 1 고정.
  function entry() {
    return ["#########", "#.......#", "#..S....#", "#.......D", "#.......#", "#########"];
  }

  // ARENA 계열(개활 전투) — 차수 1·2·3·4
  function arena1(n) { // 문 1(W)
    return ["#############", "#...........#", "#...E...E...#", "#...........#", "D.....E.....#", "#...........#", "#...E...E...#", "#############"];
  }
  function arena2() { // 문 2(W,E)
    return ["#############", "#...........#", "#...E...E...#", "#...........#", "D.....E.....D", "#...........#", "#...E...E...#", "#############"];
  }
  function arena3() { // 문 3(W,E,N)
    return ["#####D#######", "#...........#", "#...E...E...#", "#...........#", "D.....E.....D", "#...........#", "#...E...E...#", "#############"];
  }

  // HALL 계열(긴 회랑) — 차수 2·3
  function hall2() { // 문 2(W,E)
    return ["###############", "D.............D", "#.E.........E.#", "#.....E.......#", "#.E.........E.#", "#.............#", "###############"];
  }
  function hall3() { // 문 3(W,E,N)
    return ["######D########", "D.............D", "#.E.........E.#", "#.....E.......#", "#.E.........E.#", "#.............#", "###############"];
  }

  // PILLARS 계열(엄폐 전투) — 차수 2
  function pillars2() { // 문 2(W,E)
    return ["#############", "#...........#", "#.P..E..E.P.#", "#...........#", "D.....E.....D", "#...........#", "#.P..E..E.P.#", "#...........#", "#############"];
  }

  // PITROOM(구덩이 미니챌린지) — 차수 2(W,E). 구덩이 우회 통로 연결 보장.
  function pitroom2() {
    return ["#############", "#...........#", "#..PPPPP....#", "D..P.E.P....D", "#..P...P....#", "#..PPPPP....#", "#...........#", "#############"];
  }

  // CROSS(교차 허브) — 차수 4(N,S,W,E)
  function cross4() {
    return ["####D####", "#.......#", "#..E.E..#", "D...E...D", "#..E.E..#", "#.......#", "####D####"];
  }

  // CORRIDOR(통로) — 차수 2
  function corr2() { return ["#######", "D.....D", "#.....#", "#..E..#", "#.....#", "#######"]; }

  // SMALL(소형 전투) — 차수 1·2
  function small1() { return ["#######", "#.....#", "D.E.E.#", "#.....#", "#######"]; }
  function small2() { return ["#######", "#.....#", "D.E.E.D", "#.....#", "#######"]; }

  // TREASURE(보물) — 차수 1. 보물방은 층당 정확히 1.
  function treasure1() { return ["#########", "#.......#", "#..TTT..#", "D...T...#", "#..TTT..#", "#.......#", "#########"]; }

  // SECRET(비밀방·별이 흔적) — 차수 1(W). gimmick 으로 막간 흔적. 층당 ≥1.
  function secret1() { return ["#######", "#.....#", "#..T..#", "D.....#", "#.....#", "#######"]; }

  // REST(휴식) — 차수 2
  function rest2() { return ["#######", "#.....#", "D..T..D", "#.....#", "#######"]; }

  var FLOORS = [

    // ── 81층 — 막간 뛰는 발자국 (running_footprints) ─────────────────────────
    // 토폴로지: r1→r2→r3(차수3 분기)→r4 / r3→r6(보물) · r4→r5→r7(비밀)
    // 차수: r1=1 r2=2 r3=3 r4=3 r5=2 r6=1 r7=1 r8=2
    {
      id: 'floor-81', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r3', template: 'T_HALL',     grid: hall3(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r4', template: 'T_ARENA',    grid: arena3(),   spawns: [{ type: F, count: 2 }] },
        { id: 'r5', template: 'T_CORRIDOR', grid: corr2(),    spawns: [] },
        { id: 'r6', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r7', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'running_footprints' },
        { id: 'r8', template: 'T_SMALL',    grid: small1(),   spawns: [{ type: F, count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r4' },
        { from: 'r3', to: 'r6' }, { from: 'r4', to: 'r8' }, { from: 'r4', to: 'r5' },
        { from: 'r5', to: 'r7' }
      ],
      special: { secret: 'r7', treasure: 'r6' }
    },

    // ── 82층 — 비탈 첫 낙하 돌진 ──────────────────────────────────────────────
    // 차수: r1=1 r2=2 r3=3 r4=2 r5=1 r6=1 r7=1 r8=2 r9=2
    {
      id: 'floor-82', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r3', template: 'T_ARENA',    grid: arena3(),   spawns: [{ type: F, count: 1 }] },
        { id: 'r4', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r5', template: 'T_REST',     grid: rest2(),    spawns: [] },
        { id: 'r6', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r7', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'running_footprints' },
        { id: 'r8', template: 'T_CORRIDOR', grid: corr2(),    spawns: [] },
        { id: 'r9', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: F, count: 2 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r8' },
        { from: 'r8', to: 'r4' }, { from: 'r4', to: 'r9' }, { from: 'r3', to: 'r5' },
        { from: 'r5', to: 'r6' }, { from: 'r9', to: 'r7' }
      ],
      special: { secret: 'r7', treasure: 'r6' }
    },

    // ── 83층 — 가속 회랑 (긴 회랑 연쇄) ────────────────────────────────────────
    // 차수: r1=1 r2=2 r3=3 r4=2 r5=2 r6=2 r7=1 r8=1 r9=2
    {
      id: 'floor-83', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r3', template: 'T_HALL',     grid: hall3(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r4', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r5', template: 'T_PILLARS',  grid: pillars2(), spawns: [{ type: F, count: 1 }] },
        { id: 'r6', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: F, count: 1 }] },
        { id: 'r7', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r8', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'running_footprints' },
        { id: 'r9', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: F, count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' }, { from: 'r5', to: 'r6' }, { from: 'r3', to: 'r7' },
        { from: 'r6', to: 'r9' }, { from: 'r9', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ── 84층 — 하강 흐름 미니 챌린지(시그니처: 구덩이 우회) ────────────────────
    // 차수: r1=1 r2=2 r3=3 r4=2 r5=2 r6=2 r7=1 r8=1 r9=2
    {
      id: 'floor-84', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_PITROOM',  grid: pitroom2(), spawns: [{ type: F, count: 1 }] }, // 시그니처 — 구덩이 우회
        { id: 'r3', template: 'T_HALL',     grid: hall3(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r4', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r5', template: 'T_PILLARS',  grid: pillars2(), spawns: [{ type: F, count: 1 }] },
        { id: 'r6', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: F, count: 1 }] },
        { id: 'r7', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r8', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'running_footprints' },
        { id: 'r9', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: F, count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' }, { from: 'r5', to: 'r6' }, { from: 'r3', to: 'r7' },
        { from: 'r6', to: 'r9' }, { from: 'r9', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ── 85층 — 다단 비탈 분기 (CROSS 허브) ────────────────────────────────────
    // 차수: r1=1 r2=4 r3=2 r4=2 r5=1 r6=2 r7=1 r8=1 r9=2
    {
      id: 'floor-85', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_CROSS',    grid: cross4(),   spawns: [{ type: F, count: 1 }] },
        { id: 'r3', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r4', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r5', template: 'T_ARENA',    grid: arena1(),   spawns: [{ type: F, count: 1 }] },
        { id: 'r6', template: 'T_CORRIDOR', grid: corr2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r7', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r8', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'running_footprints' },
        { id: 'r9', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: F, count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r2', to: 'r4' },
        { from: 'r2', to: 'r6' }, { from: 'r3', to: 'r5' }, { from: 'r4', to: 'r7' },
        { from: 'r6', to: 'r9' }, { from: 'r9', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ── 86층 — 낙하 대군 ─────────────────────────────────────────────────────
    // 차수: r1=1 r2=3 r3=2 r4=2 r5=2 r6=2 r7=1 r8=1 r9=2
    {
      id: 'floor-86', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_ARENA',    grid: arena3(),   spawns: [{ type: F, count: 2 }] },
        { id: 'r3', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: F, count: 1 }] },
        { id: 'r4', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: F, count: 1 }] },
        { id: 'r5', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r6', template: 'T_PILLARS',  grid: pillars2(), spawns: [{ type: F, count: 1 }] },
        { id: 'r7', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r8', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'running_footprints' },
        { id: 'r9', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: F, count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' }, { from: 'r5', to: 'r6' }, { from: 'r2', to: 'r7' },
        { from: 'r6', to: 'r9' }, { from: 'r9', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ── 87층 — 좁은 비탈 협곡 ────────────────────────────────────────────────
    // 차수: r1=1 r2=2 r3=2 r4=3 r5=2 r6=2 r7=1 r8=1 r9=2
    {
      id: 'floor-87', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_CORRIDOR', grid: corr2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r3', template: 'T_CORRIDOR', grid: corr2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r4', template: 'T_HALL',     grid: hall3(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r5', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r6', template: 'T_PILLARS',  grid: pillars2(), spawns: [{ type: F, count: 2 }] },
        { id: 'r7', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r8', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'running_footprints' },
        { id: 'r9', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: F, count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' }, { from: 'r5', to: 'r6' }, { from: 'r4', to: 'r7' },
        { from: 'r6', to: 'r9' }, { from: 'r9', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ── 88층 — 최종 직전 러시 (일반층 최고난도) ──────────────────────────────
    // 차수: r1=1 r2=3 r3=2 r4=2 r5=2 r6=2 r7=2 r8=2 r9=1 r10=1
    {
      id: 'floor-88', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_ARENA',    grid: arena3(),   spawns: [{ type: F, count: 2 }] },
        { id: 'r3', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: F, count: 1 }] },
        { id: 'r4', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: F, count: 1 }] },
        { id: 'r5', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r6', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r7', template: 'T_PILLARS',  grid: pillars2(), spawns: [{ type: F, count: 1 }] },
        { id: 'r8', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: F, count: 1 }] },
        { id: 'r9', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r10', template: 'T_SECRET',  grid: secret1(),  spawns: [], gimmick: 'running_footprints' }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' }, { from: 'r5', to: 'r6' }, { from: 'r6', to: 'r7' },
        { from: 'r2', to: 'r9' }, { from: 'r7', to: 'r8' }, { from: 'r8', to: 'r10' }
      ],
      special: { secret: 'r10', treasure: 'r9' }
    },

    // ── 89층 — 보스 전 정비 (강화 재료) ───────────────────────────────────────
    // 차수: r1=1 r2=2 r3=3 r4=2 r5=2 r6=1 r7=1 r8=2
    {
      id: 'floor-89', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_REST',     grid: rest2(),    spawns: [] },
        { id: 'r3', template: 'T_ARENA',    grid: arena3(),   spawns: [{ type: F, count: 2 }] },
        { id: 'r4', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: F, count: 1 }] },
        { id: 'r5', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: F, count: 1 }] },
        { id: 'r6', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r7', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'running_footprints' },
        { id: 'r8', template: 'T_CORRIDOR', grid: corr2(),    spawns: [] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r8' },
        { from: 'r8', to: 'r4' }, { from: 'r4', to: 'r5' }, { from: 'r3', to: 'r6' },
        { from: 'r5', to: 'r7' }
      ],
      special: { secret: 'r7', treasure: 'r6' }
    },

    // ── 90층 — 보스: 비탈을 막은 응어리 (boss_slopeblock) ─────────────────────
    {
      id: 'floor-90', region: R, theme: THEME,
      rooms: [
        { id: 'b1', template: 'T_ENTRY', grid: entry(), spawns: [] },
        { id: 'b2', template: 'T_BOSS', grid: [
          "###############",
          "#.............#",
          "#.............#",
          "#......E......#",
          "#.............#",
          "D......S.....X#",
          "#.............#",
          "#.............#",
          "#.............#",
          "###############"
        ], spawns: [{ type: 'boss_slopeblock', count: 1 }] }
      ],
      graph: [{ from: 'b1', to: 'b2' }],
      special: { boss: 'b2' }
    }

  ];

  g.POP_FLOORS_R09 = FLOORS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { FLOORS: FLOORS };
})(typeof window !== 'undefined' ? window : globalThis);
