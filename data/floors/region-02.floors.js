/* ============================================================================
 * region-02 floors 데이터 — 반창고 협곡 (11~20층)
 * ----------------------------------------------------------------------------
 * P3-B1(#13) 산출물. 사양서: .omc/plans/floors-design/region-02.md
 * 포맷 참조: data/floors/templates.js · data/floors/region-01.sample.js
 * 검증: node tools/lint-floors.mjs data/floors/region-02.floors.js → error 0
 *
 * 핵심 규칙: 방의 grid 'D' 개수 = graph 인접 차수(무방향)
 * 바이옴: bandage-canyon — 좁은 다리·협곡, 첫 탄막 압박
 * 브라우저: window.POP_FLOORS 배열에 push. Node: module.exports.FLOORS.
 * ==========================================================================*/
(function (g) {
  'use strict';

  var FLOORS = [

    // ══════════════════════════════════════════════════════════════════════
    // 11층 — 막간 S1: 반창고 제단 (별이 흔적: bandage_altar)
    // 방 7: T_ENTRY(r1) / T_CORRIDOR(r2) / T_ARENA(r3,r4) / T_SMALL(r5) / T_TREASURE(r6) / T_SECRET(r7)
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r3-r7, r4-r6
    // 차수: r1=1, r2=2, r3=4(W E S N), r4=2(N E), r5=1(W), r6=1(W), r7=1(S)
    // r3: W=r2, S=r4(하단), E=r5(우), N=r7(상단)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-11', region: 'region-02', theme: 'bandage-canyon',
      rooms: [
        // r1 차수1: E
        {
          id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 차수2: W E
        {
          id: 'r2', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 1 }]
        },
        // r3 T_ARENA 차수4: W(r2) E(r5) S(r4) N(r7)
        {
          id: 'r3', template: 'T_ARENA',
          grid: [
            "####D####",
            "D.......D",
            "#.E...E.#",
            "#.......#",
            "#.E...E.#",
            "####D####"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r4 T_ARENA 차수2: N(r3 S) E(r6) — D 2개: 상단N + 우측E
        {
          id: 'r4', template: 'T_ARENA',
          grid: [
            "###D###",
            "#.....D",
            "#.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r5 T_SMALL 차수1: W(r3 E)
        {
          id: 'r5', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r6 T_TREASURE 차수1: W(r4 E)
        {
          id: 'r6', template: 'T_TREASURE',
          grid: [
            "#########",
            "#.......#",
            "#..TTT..#",
            "D...T...#",
            "#..TTT..#",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r7 T_SECRET 차수1: S(r3 N) — bandage_altar 기믹 (막간 S1)
        {
          id: 'r7', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'bandage_altar'
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r3', to: 'r7' },
        { from: 'r4', to: 'r6' }
      ],
      special: { secret: 'r7', treasure: 'r6' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 12층 — 좁은 다리 첫 통과
    // 방 7: T_ENTRY(r1) / T_CORRIDOR(r2,r3) / T_ARENA(r4,r5) / T_TREASURE(r6) / T_SECRET(r7)
    // graph: r1-r2, r2-r3, r3-r4, r4-r5, r4-r6, r4-r7, r5-r7(아님)
    // 재설계: r1-r2, r2-r3, r3-r4, r4-r5, r4-r6, r5-r7
    // 차수: r1=1, r2=2, r3=2, r4=3(W E S), r5=2(N E), r6=1(W), r7=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-12', region: 'region-02', theme: 'bandage-canyon',
      rooms: [
        // r1 차수1: E
        {
          id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 T_CORRIDOR 차수2: W E — 좁은 다리1
        {
          id: 'r2', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 1 }]
        },
        // r3 T_CORRIDOR 차수2: W(r2) E(r4) — 좁은 다리2
        {
          id: 'r3', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r4 T_ARENA 차수3: W(r3) E(r5) S(r6)
        {
          id: 'r4', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_drifter', count: 3 }]
        },
        // r5 T_ARENA 차수2: W(r4 E) E(r7) — D 2개: 좌W + 우E
        {
          id: 'r5', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r6 T_TREASURE 차수1: N(r4 S)
        {
          id: 'r6', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....#",
            "#.TTT.#",
            "#..T..#",
            "#.TTT.#",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r7 T_SECRET 차수1: W(r5 E)
        {
          id: 'r7', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'star_trace'
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r5', to: 'r7' }
      ],
      special: { secret: 'r7', treasure: 'r6' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 13층 — 구덩이 협곡 우회
    // 방 8: T_ENTRY(r1) / T_CORRIDOR(r2) / T_PITROOM(r3,r4) / T_ARENA(r5) / T_PILLARS(r6) / T_TREASURE(r7) / T_SECRET(r8)
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r4-r6, r4-r7, r5-r8
    // 차수: r1=1, r2=2, r3=3(W E S), r4=3(N E S), r5=2(S E), r6=1(N), r7=1(N), r8=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-13', region: 'region-02', theme: 'bandage-canyon',
      rooms: [
        // r1 차수1: E
        {
          id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 차수2: W E
        {
          id: 'r2', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 1 }]
        },
        // r3 T_PITROOM 차수3: W(r2) E(r5) S(r4)
        {
          id: 'r3', template: 'T_PITROOM',
          grid: [
            "#############",
            "#...........#",
            "#..PPPPP....#",
            "D..P...P....D",
            "#..P.E.P....#",
            "#..PPPPP....#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r4 T_PITROOM 차수3: N(r3 S) E(r7) S(r6)
        {
          id: 'r4', template: 'T_PITROOM',
          grid: [
            "###D#########",
            "#...........#",
            "#..PPPPP....D",
            "#..P...P....#",
            "#..P.E.P....#",
            "#..PPPPP....#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r5 T_ARENA 차수2: W(r3 E) E(r8) — D 2개: 좌W + 우E
        {
          id: 'r5', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_drifter', count: 3 }]
        },
        // r6 T_PILLARS 차수1: N(r4 S)
        {
          id: 'r6', template: 'T_PILLARS',
          grid: [
            "###D###",
            "#.P.P.#",
            "#.E.E.#",
            "#.P.P.#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r7 T_TREASURE 차수1: W(r4 E)
        {
          id: 'r7', template: 'T_TREASURE',
          grid: [
            "#########",
            "#.......#",
            "#..TTT..#",
            "D...T...#",
            "#..TTT..#",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r8 T_SECRET 차수1: W(r5 E)
        {
          id: 'r8', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'star_trace'
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 14층 — 밀집 교전 (다리 협공)
    // 방 8: T_ENTRY(r1) / T_CORRIDOR(r2) / T_ARENA(r3,r4,r5) / T_PILLARS(r6) / T_TREASURE(r7) / T_SECRET(r8)
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r3-r6, r4-r7, r5-r8
    // 차수: r1=1, r2=2, r3=4(W E S N), r4=2(N E), r5=2(S E), r6=1(N), r7=1(W), r8=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-14', region: 'region-02', theme: 'bandage-canyon',
      rooms: [
        // r1 차수1: E
        {
          id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 차수2: W E
        {
          id: 'r2', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 1 }]
        },
        // r3 T_ARENA 차수4: W(r2) E(r4) S(r6) N(r5)
        {
          id: 'r3', template: 'T_ARENA',
          grid: [
            "####D####",
            "D.......D",
            "#.E...E.#",
            "#.......#",
            "#.E...E.#",
            "####D####"
          ],
          spawns: [{ type: 'shard_drifter', count: 3 }]
        },
        // r4 T_ARENA 차수2: W(r3 E) E(r7) — D 2개: 좌W + 우E
        {
          id: 'r4', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_drifter', count: 3 }]
        },
        // r5 T_ARENA 차수2: S(r3 N) E(r8) — D 2개: 아래S + 우E
        {
          id: 'r5', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_drifter', count: 3 }]
        },
        // r6 T_PILLARS 차수1: N(r3 S)
        {
          id: 'r6', template: 'T_PILLARS',
          grid: [
            "###D###",
            "#.P.P.#",
            "#.E.E.#",
            "#.P.P.#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r7 T_TREASURE 차수1: W(r4 E)
        {
          id: 'r7', template: 'T_TREASURE',
          grid: [
            "#########",
            "#.......#",
            "#..TTT..#",
            "D...T...#",
            "#..TTT..#",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r8 T_SECRET 차수1: W(r5 E)
        {
          id: 'r8', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'star_trace'
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 15층 — 교차 협곡 분기
    // 방 8: T_ENTRY(r1) / T_CORRIDOR(r2) / T_CROSS(r3) / T_ARENA(r4,r5) / T_PILLARS(r6) / T_TREASURE(r7) / T_SECRET(r8)
    // graph: r1-r2, r2-r3(W), r3-r4(N), r3-r5(S), r3-r6(E), r5-r7, r6-r8
    // 차수: r1=1, r2=2, r3=4(W N S E), r4=1(S), r5=2(N E), r6=2(W E), r7=1(W), r8=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-15', region: 'region-02', theme: 'bandage-canyon',
      rooms: [
        // r1 차수1: E
        {
          id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 차수2: W E
        {
          id: 'r2', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 1 }]
        },
        // r3 T_CROSS 차수4: W(r2) N(r4) S(r5) E(r6)
        {
          id: 'r3', template: 'T_CROSS',
          grid: [
            "####D####",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r4 T_ARENA 차수1: S(r3 N)
        {
          id: 'r4', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#...........#",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r5 T_ARENA 차수2: N(r3 S) E(r7) — D 2개: 상단N + 우측E
        {
          id: 'r5', template: 'T_ARENA',
          grid: [
            "###D###",
            "#.....D",
            "#.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r6 T_PILLARS 차수2: W(r3 E) E(r8)
        {
          id: 'r6', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "D.....S.....D",
            "#.P..E..E.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r7 T_TREASURE 차수1: W(r5 E)
        {
          id: 'r7', template: 'T_TREASURE',
          grid: [
            "#########",
            "#.......#",
            "#..TTT..#",
            "D...T...#",
            "#..TTT..#",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r8 T_SECRET 차수1: W(r6 E)
        {
          id: 'r8', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'star_trace'
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r6', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 16층 — 긴 회랑 다리
    // 방 8: T_ENTRY(r1) / T_HALL(r2) / T_ARENA(r3,r4) / T_CORRIDOR(r5,r6) / T_TREASURE(r7) / T_SECRET(r8)
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r4-r6, r4-r7, r5-r8
    // 차수: r1=1, r2=2(W E), r3=3(W E S), r4=3(W E S), r5=2(S E), r6=1(N), r7=1(W), r8=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-16', region: 'region-02', theme: 'bandage-canyon',
      rooms: [
        // r1 차수1: E
        {
          id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 T_HALL 차수2: W(r1) E(r3) — 긴 회랑 다리
        {
          id: 'r2', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.....S.......#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r3 T_ARENA 차수3: W(r2) E(r4) S(r5)
        {
          id: 'r3', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_drifter', count: 3 }]
        },
        // r4 T_ARENA 차수3: W(r3) E(r7) S(r6)
        {
          id: 'r4', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_drifter', count: 3 }]
        },
        // r5 T_CORRIDOR 차수2: N(r3 S) E(r8) — D 2개: 상단N + 우측E
        {
          id: 'r5', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "#.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r6 T_CORRIDOR 차수1: N(r4 S)
        {
          id: 'r6', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "#.....#",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r7 T_TREASURE 차수1: W(r4 E)
        {
          id: 'r7', template: 'T_TREASURE',
          grid: [
            "#########",
            "#.......#",
            "#..TTT..#",
            "D...T...#",
            "#..TTT..#",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r8 T_SECRET 차수1: W(r5 E)
        {
          id: 'r8', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'star_trace'
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 17층 — 기둥 협곡 엄폐
    // 방 8: T_ENTRY(r1) / T_CORRIDOR(r2) / T_PILLARS(r3,r4) / T_PITROOM(r5) / T_ARENA(r6) / T_SMALL(r7) / T_TREASURE / T_SECRET
    // 방 수 = 8: r1~r8
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r4-r6, r4-r7, r5-r8
    // 차수: r1=1, r2=2, r3=3(W E S), r4=3(N E S), r5=2(S E), r6=1(N), r7=1(N), r8=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-17', region: 'region-02', theme: 'bandage-canyon',
      rooms: [
        // r1 차수1: E
        {
          id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 차수2: W E
        {
          id: 'r2', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 1 }]
        },
        // r3 T_PILLARS 차수3: W(r2) E(r4) S(r5)
        {
          id: 'r3', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "D.....S.....D",
            "#.P..E..E.P.#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_drifter', count: 3 }]
        },
        // r4 T_PILLARS 차수3: W(r3 E) E(r6) S(r7)
        {
          id: 'r4', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "D.....S.....D",
            "#.P..E..E.P.#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_drifter', count: 3 }]
        },
        // r5 T_PITROOM 차수2: N(r3 S) E(r8) — D 2개: 상단N + 우측E
        {
          id: 'r5', template: 'T_PITROOM',
          grid: [
            "###D#########",
            "#...........#",
            "#..PPPPP....D",
            "#..P...P....#",
            "#..P.E.P....#",
            "#..PPPPP....#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r6 T_ARENA 차수1: W(r4 E)
        {
          id: 'r6', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........#",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r7 T_TREASURE 차수1: N(r4 S)
        {
          id: 'r7', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....#",
            "#.TTT.#",
            "#..T..#",
            "#.TTT.#",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r8 T_SECRET 차수1: W(r5 E)
        {
          id: 'r8', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'star_trace'
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 18층 — 밀집 + 속도 혼합 (지역 내 최고난도)
    // 방 8: T_ENTRY(r1) / T_CORRIDOR(r2) / T_ARENA(r3,r4) / T_HALL(r5) / T_PILLARS(r6) / T_SMALL(r7) / T_TREASURE / T_SECRET
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r4-r6, r4-r7, r5-r8
    // 차수: r1=1, r2=2, r3=3(W E S), r4=3(N E S), r5=2(S E), r6=1(N), r7=1(N), r8=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-18', region: 'region-02', theme: 'bandage-canyon',
      rooms: [
        // r1 차수1: E
        {
          id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 차수2: W E
        {
          id: 'r2', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 1 }]
        },
        // r3 T_ARENA 차수3: W(r2) E(r4) S(r5)
        {
          id: 'r3', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_drifter', count: 3 }]
        },
        // r4 T_ARENA 차수3: W(r3) E(r7) S(r6)
        {
          id: 'r4', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "####D########"
          ],
          spawns: [
            { type: 'shard_drifter', count: 3 },
            { type: 'shard_darter', count: 1 }
          ]
        },
        // r5 T_HALL 차수2: N(r3 S) E(r8) — D 2개: 상단N + 우측E
        {
          id: 'r5', template: 'T_HALL',
          grid: [
            "###D###########",
            "#.............D",
            "#.E.........E.#",
            "#.....S.......#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [
            { type: 'shard_drifter', count: 2 },
            { type: 'shard_darter', count: 1 }
          ]
        },
        // r6 T_PILLARS 차수1: N(r4 S)
        {
          id: 'r6', template: 'T_PILLARS',
          grid: [
            "###D###",
            "#.P.P.#",
            "#.E.E.#",
            "#.P.P.#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r7 T_TREASURE 차수1: W(r4 E)
        {
          id: 'r7', template: 'T_TREASURE',
          grid: [
            "#########",
            "#.......#",
            "#..TTT..#",
            "D...T...#",
            "#..TTT..#",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r8 T_SECRET 차수1: W(r5 E)
        {
          id: 'r8', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'star_trace'
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 19층 — 보스 전 정비
    // 방 8: T_ENTRY(r1) / T_CORRIDOR(r2) / T_ARENA(r3) / T_REST(r4) / T_SMALL(r5,r6) / T_TREASURE(r7) / T_SECRET(r8)
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r4-r6, r4-r7, r5-r8
    // 차수: r1=1, r2=2, r3=3(W E S), r4=3(N E S), r5=2(S E), r6=1(N), r7=1(N), r8=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-19', region: 'region-02', theme: 'bandage-canyon',
      rooms: [
        // r1 차수1: E
        {
          id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 차수2: W E
        {
          id: 'r2', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 1 }]
        },
        // r3 T_ARENA 차수3: W(r2) E(r4) S(r5)
        {
          id: 'r3', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r4 T_REST 차수3: W(r3) E(r7) S(r6) — 보스 전 회복
        {
          id: 'r4', template: 'T_REST',
          grid: [
            "###D###",
            "D..T..D",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r5 T_SMALL 차수2: N(r3 S) E(r8) — D 2개: 상단N + 우측E
        {
          id: 'r5', template: 'T_SMALL',
          grid: [
            "###D###",
            "#.....D",
            "#.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r6 T_SMALL 차수1: N(r4 S)
        {
          id: 'r6', template: 'T_SMALL',
          grid: [
            "###D###",
            "#.....#",
            "#.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r7 T_TREASURE 차수1: W(r4 E)
        {
          id: 'r7', template: 'T_TREASURE',
          grid: [
            "#########",
            "#.......#",
            "#..TTT..#",
            "D...T...#",
            "#..TTT..#",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r8 T_SECRET 차수1: W(r5 E)
        {
          id: 'r8', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'star_trace'
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 20층 — 보스: 협곡을 막은 응어리 (boss_canyonblock)
    // 방 2(보스층 예외): T_ENTRY(b1) / T_BOSS(b2)
    // graph: b1-b2
    // 차수: b1=1(E), b2=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-20', region: 'region-02', theme: 'bandage-canyon',
      rooms: [
        // b1 차수1: E
        {
          id: 'b1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // b2 T_BOSS 차수1: W(b1). 출구 X 포함.
        // boss_canyonblock = BOSS_TABLE[1] 감시안, hp 80, patterns ['spiral','aimed3']
        {
          id: 'b2', template: 'T_BOSS',
          grid: [
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
          ],
          spawns: [{ type: 'boss_canyonblock', count: 1 }]
        }
      ],
      graph: [{ from: 'b1', to: 'b2' }],
      special: { boss: 'b2' }
    }

  ];

  // 브라우저 전역 등록(POP_FLOORS 배열에 누적)
  if (typeof g.POP_FLOORS === 'undefined') g.POP_FLOORS = [];
  for (var i = 0; i < FLOORS.length; i++) g.POP_FLOORS.push(FLOORS[i]);

  if (typeof module !== 'undefined' && module.exports) module.exports = { FLOORS: FLOORS };
})(typeof window !== 'undefined' ? window : globalThis);
