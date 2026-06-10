/* ============================================================================
 * region-10 floors — 별의 심장 (91~100층, 최종) · P3-B5 산출
 * ----------------------------------------------------------------------------
 * 설계 진실: .omc/plans/floors-design/region-10.md (P3-A 사양서)
 * 정합 소스: STORY.md §12·§13(특히 §7 転 단일 채널·91층 막간 보호)
 *            / data/world.data.js region-10 / data/codex.data.js
 *            / data/floors/templates.js(GRID_LEGEND·템플릿) / tools/lint-floors.mjs
 *
 * 바이옴 `star-heart` — 빛의 공동(空洞), radiant 룩(온도 곡선 정점).
 * 91층 = 転(반전 막간) — 비밀방 기믹 `last_note`("호두야, 올 줄 알았어. 깊은
 *        데서 기다릴게."). 막간 텍스트는 STORY §7 단일 채널이라 데이터는 gimmick
 *        문자열만 표면화한다(명시 반전 텍스트 금지 — TW-FAIR-PLAY).
 * 100층 = 結 — 최종 보스 `boss_nightmare_core`(악몽의 핵, T_BOSS_LARGE, 4패턴).
 * 적 풀: 이전 elite 회상 혼합 — faller(91~95 주력) → +lightshy/+weeper(96~99) →
 *        100층 보스 단독. codex id 그대로.
 *
 * 포맷·grid 규약은 region-09.floors.js 와 동일(문 수 = graph 차수).
 * 브라우저: window.POP_FLOORS_R10. Node: module.exports.FLOORS.
 * ==========================================================================*/
(function (g) {
  'use strict';

  var THEME = 'star-heart';
  var R = 'region-10';
  // 회상 elite(codex id) — region-10은 단일 elite가 아니라 혼합 정점.
  var FA = 'shard_faller';   // region-09 연속(91~95 주력)
  var LS = 'shard_lightshy'; // region-08 회상
  var WE = 'shard_weeper';   // region-07 회상

  // ── 방 grid 빌더(문 수 = graph 차수. 이름 끝 숫자 = 문 개수) ────────────────
  function entry() {
    return ["#########", "#.......#", "#..S....#", "#.......D", "#.......#", "#########"];
  }
  // ARENA — 1·2·3·4
  function arena1() { return ["#############", "#...........#", "#...E...E...#", "#...........#", "D.....E.....#", "#...........#", "#...E...E...#", "#############"]; }
  function arena2() { return ["#############", "#...........#", "#...E...E...#", "#...........#", "D.....E.....D", "#...........#", "#...E...E...#", "#############"]; }
  function arena3() { return ["#####D#######", "#...........#", "#...E...E...#", "#...........#", "D.....E.....D", "#...........#", "#...E...E...#", "#############"]; }
  // HALL — 2·3
  function hall2() { return ["###############", "D.............D", "#.E.........E.#", "#.....E.......#", "#.E.........E.#", "#.............#", "###############"]; }
  function hall3() { return ["######D########", "D.............D", "#.E.........E.#", "#.....E.......#", "#.E.........E.#", "#.............#", "###############"]; }
  // PILLARS — 2
  function pillars2() { return ["#############", "#...........#", "#.P..E..E.P.#", "#...........#", "D.....E.....D", "#...........#", "#.P..E..E.P.#", "#...........#", "#############"]; }
  // PITROOM(구덩이 우회) — 2
  function pitroom2() { return ["#############", "#...........#", "#..PPPPP....#", "D..P.E.P....D", "#..P...P....#", "#..PPPPP....#", "#...........#", "#############"]; }
  // CROSS(교차 허브) — 4
  function cross4() { return ["####D####", "#.......#", "#..E.E..#", "D...E...D", "#..E.E..#", "#.......#", "####D####"]; }
  // CORRIDOR — 2
  function corr2() { return ["#######", "D.....D", "#.....#", "#..E..#", "#.....#", "#######"]; }
  // SMALL — 2
  function small2() { return ["#######", "#.....#", "D.E.E.D", "#.....#", "#######"]; }
  // TREASURE — 1(층당 정확히 1)
  function treasure1() { return ["#########", "#.......#", "#..TTT..#", "D...T...#", "#..TTT..#", "#.......#", "#########"]; }
  // SECRET(비밀방·별이 흔적) — 1(W). gimmick 으로 막간 흔적. 층당 ≥1.
  function secret1() { return ["#######", "#.....#", "#..T..#", "D.....#", "#.....#", "#######"]; }
  // REST(휴식) — 2
  function rest2() { return ["#######", "#.....#", "D..T..D", "#.....#", "#######"]; }

  var FLOORS = [

    // ── 91층 — 転 막간: 마지막 수첩 (last_note) ─────────────────────────────
    // 정서 전환점 — 전투 밀도 완화(전투방 4). 비밀방=転 결정타(막간 T3-91 트리거).
    // 적은 region-09 연속(faller) — 톤 유지.
    // 차수: r1=1 r2=2 r3=3 r4=2 r5=1 r6=1 r7=1 r8=2
    {
      id: 'floor-91', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: FA, count: 1 }] },
        { id: 'r3', template: 'T_ARENA',    grid: arena3(),   spawns: [{ type: FA, count: 1 }] },
        { id: 'r4', template: 'T_REST',     grid: rest2(),    spawns: [] },
        { id: 'r5', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r6', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'last_note' },
        { id: 'r7', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: FA, count: 1 }] },
        { id: 'r8', template: 'T_CORRIDOR', grid: corr2(),    spawns: [{ type: FA, count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r8' },
        { from: 'r8', to: 'r4' }, { from: 'r4', to: 'r7' }, { from: 'r3', to: 'r5' },
        { from: 'r7', to: 'r6' }
      ],
      special: { secret: 'r6', treasure: 'r5' }
    },

    // ── 92층 — 빛의 공동 첫 종합전 ──────────────────────────────────────────
    // 차수: r1=1 r2=3 r3=2 r4=2 r5=2 r6=1 r7=1 r8=1 r9=2
    {
      id: 'floor-92', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_ARENA',    grid: arena3(),   spawns: [{ type: FA, count: 2 }] },
        { id: 'r3', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: FA, count: 1 }] },
        { id: 'r4', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: FA, count: 1 }] },
        { id: 'r5', template: 'T_PILLARS',  grid: pillars2(), spawns: [{ type: LS, count: 1 }] },
        { id: 'r6', template: 'T_REST',     grid: rest2(),    spawns: [] },
        { id: 'r7', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r8', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'star_trace' },
        { id: 'r9', template: 'T_CORRIDOR', grid: corr2(),    spawns: [] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' }, { from: 'r5', to: 'r9' }, { from: 'r2', to: 'r7' },
        { from: 'r9', to: 'r6' }, { from: 'r6', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ── 93층 — 두려움의 회상 (혼합 적) ──────────────────────────────────────
    // 차수: r1=1 r2=3 r3=2 r4=2 r5=2 r6=1 r7=1 r8=1 r9=2
    {
      id: 'floor-93', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_ARENA',    grid: arena3(),   spawns: [{ type: FA, count: 2 }] },
        { id: 'r3', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: LS, count: 2 }] },
        { id: 'r4', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: FA, count: 1 }] },
        { id: 'r5', template: 'T_PILLARS',  grid: pillars2(), spawns: [{ type: WE, count: 1 }] },
        { id: 'r6', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: FA, count: 1 }] },
        { id: 'r7', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r8', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'star_trace' },
        { id: 'r9', template: 'T_CORRIDOR', grid: corr2(),    spawns: [] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' }, { from: 'r5', to: 'r9' }, { from: 'r2', to: 'r7' },
        { from: 'r9', to: 'r6' }, { from: 'r6', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ── 94층 — 황금 회랑 러시 ────────────────────────────────────────────────
    // 차수: r1=1 r2=2 r3=3 r4=2 r5=2 r6=2 r7=1 r8=1 r9=2
    {
      id: 'floor-94', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: FA, count: 1 }] },
        { id: 'r3', template: 'T_HALL',     grid: hall3(),    spawns: [{ type: FA, count: 2 }] },
        { id: 'r4', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: LS, count: 1 }] },
        { id: 'r5', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: FA, count: 1 }] },
        { id: 'r6', template: 'T_PILLARS',  grid: pillars2(), spawns: [{ type: LS, count: 1 }] },
        { id: 'r7', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r8', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'star_trace' },
        { id: 'r9', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: FA, count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' }, { from: 'r5', to: 'r6' }, { from: 'r3', to: 'r7' },
        { from: 'r6', to: 'r9' }, { from: 'r9', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ── 95층 — 심장 가까이 (밀집 종합) ──────────────────────────────────────
    // 차수: r1=1 r2=3 r3=2 r4=2 r5=2 r6=2 r7=1 r8=1 r9=2
    {
      id: 'floor-95', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_ARENA',    grid: arena3(),   spawns: [{ type: FA, count: 2 }] },
        { id: 'r3', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: FA, count: 1 }] },
        { id: 'r4', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: WE, count: 2 }] },
        { id: 'r5', template: 'T_PILLARS',  grid: pillars2(), spawns: [{ type: FA, count: 1 }] },
        { id: 'r6', template: 'T_CORRIDOR', grid: corr2(),    spawns: [{ type: FA, count: 1 }] },
        { id: 'r7', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r8', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'star_trace' },
        { id: 'r9', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: FA, count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' }, { from: 'r5', to: 'r6' }, { from: 'r2', to: 'r7' },
        { from: 'r6', to: 'r9' }, { from: 'r9', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ── 96층 — 회상 미니 챌린지(시그니처: 구덩이 우회 종합) ──────────────────
    // 차수: r1=1 r2=2 r3=3 r4=2 r5=2 r6=2 r7=1 r8=1 r9=2
    {
      id: 'floor-96', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_PITROOM',  grid: pitroom2(), spawns: [{ type: FA, count: 1 }] }, // 시그니처 — 회상 미니챌린지
        { id: 'r3', template: 'T_HALL',     grid: hall3(),    spawns: [{ type: LS, count: 2 }] },
        { id: 'r4', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: FA, count: 1 }] },
        { id: 'r5', template: 'T_PILLARS',  grid: pillars2(), spawns: [{ type: WE, count: 1 }] },
        { id: 'r6', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: FA, count: 1 }] },
        { id: 'r7', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r8', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'star_trace' },
        { id: 'r9', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: FA, count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' }, { from: 'r5', to: 'r6' }, { from: 'r3', to: 'r7' },
        { from: 'r6', to: 'r9' }, { from: 'r9', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ── 97층 — 빛의 미궁 (CROSS 허브) ───────────────────────────────────────
    // 차수: r1=1 r2=4 r3=2 r4=2 r5=1 r6=2 r7=1 r8=1 r9=2
    {
      id: 'floor-97', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_CROSS',    grid: cross4(),   spawns: [{ type: FA, count: 1 }] },
        { id: 'r3', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: LS, count: 1 }] },
        { id: 'r4', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: FA, count: 1 }] },
        { id: 'r5', template: 'T_ARENA',    grid: arena1(),   spawns: [{ type: LS, count: 2 }] },
        { id: 'r6', template: 'T_CORRIDOR', grid: corr2(),    spawns: [{ type: FA, count: 1 }] },
        { id: 'r7', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r8', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'star_trace' },
        { id: 'r9', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: FA, count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r2', to: 'r4' },
        { from: 'r2', to: 'r6' }, { from: 'r3', to: 'r5' }, { from: 'r4', to: 'r7' },
        { from: 'r6', to: 'r9' }, { from: 'r9', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ── 98층 — 모든 두려움 대군 (일반층 절대 최고난도) ──────────────────────
    // 차수: r1=1 r2=3 r3=2 r4=2 r5=2 r6=2 r7=2 r8=2 r9=1 r10=1
    {
      id: 'floor-98', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_ARENA',    grid: arena3(),   spawns: [{ type: FA, count: 2 }] },
        { id: 'r3', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: LS, count: 2 }] },
        { id: 'r4', template: 'T_ARENA',    grid: arena2(),   spawns: [{ type: WE, count: 2 }] },
        { id: 'r5', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: FA, count: 2 }] },
        { id: 'r6', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: LS, count: 1 }] },
        { id: 'r7', template: 'T_PILLARS',  grid: pillars2(), spawns: [{ type: FA, count: 1 }] },
        { id: 'r8', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: FA, count: 1 }] },
        { id: 'r9', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r10', template: 'T_SECRET',  grid: secret1(),  spawns: [], gimmick: 'star_trace' }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' }, { from: 'r5', to: 'r6' }, { from: 'r6', to: 'r7' },
        { from: 'r2', to: 'r9' }, { from: 'r7', to: 'r8' }, { from: 'r8', to: 'r10' }
      ],
      special: { secret: 'r10', treasure: 'r9' }
    },

    // ── 99층 — 최종 보스 전 정비 (심장 앞) ──────────────────────────────────
    // 결전 직전 고요 — 전투 밀도 완화(전투방 5). 비밀방 legendary 최종 보상.
    // 차수: r1=1 r2=2 r3=3 r4=2 r5=2 r6=1 r7=1 r8=2
    {
      id: 'floor-99', region: R, theme: THEME,
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: entry(),    spawns: [] },
        { id: 'r2', template: 'T_REST',     grid: rest2(),    spawns: [] },
        { id: 'r3', template: 'T_ARENA',    grid: arena3(),   spawns: [{ type: FA, count: 2 }] },
        { id: 'r4', template: 'T_HALL',     grid: hall2(),    spawns: [{ type: LS, count: 1 }] },
        { id: 'r5', template: 'T_SMALL',    grid: small2(),   spawns: [{ type: FA, count: 1 }] },
        { id: 'r6', template: 'T_TREASURE', grid: treasure1(),spawns: [] },
        { id: 'r7', template: 'T_SECRET',   grid: secret1(),  spawns: [], gimmick: 'star_trace' },
        { id: 'r8', template: 'T_CORRIDOR', grid: corr2(),    spawns: [] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r3', to: 'r8' },
        { from: 'r8', to: 'r4' }, { from: 'r4', to: 'r5' }, { from: 'r3', to: 'r6' },
        { from: 'r5', to: 'r7' }
      ],
      special: { secret: 'r7', treasure: 'r6' }
    },

    // ── 100층 — 최종 보스: 악몽의 핵 (boss_nightmare_core) — 結 ───────────────
    // T_BOSS_LARGE(최종 전용, 가장 넓은 보스방) + 'X' + 4패턴 보스 단독.
    {
      id: 'floor-100', region: R, theme: THEME,
      rooms: [
        { id: 'b1', template: 'T_ENTRY', grid: entry(), spawns: [] },
        { id: 'b2', template: 'T_BOSS_LARGE', grid: [
          "#################",
          "#...............#",
          "#...............#",
          "#...............#",
          "#.......E.......#",
          "#...............#",
          "D......S......X.#",
          "#...............#",
          "#...............#",
          "#...............#",
          "#...............#",
          "#################"
        ], spawns: [{ type: 'boss_nightmare_core', count: 1 }] }
      ],
      graph: [{ from: 'b1', to: 'b2' }],
      special: { boss: 'b2' }
    }

  ];

  g.POP_FLOORS_R10 = FLOORS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { FLOORS: FLOORS };
})(typeof window !== 'undefined' ? window : globalThis);
