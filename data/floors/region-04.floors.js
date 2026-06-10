/* ============================================================================
 * region-04 floors — 손수건 미궁 (31~40층)
 * ----------------------------------------------------------------------------
 * 바이옴: kerchief-maze. 간판 적: shard_splitter(갈라짐) + shard_darter.
 * 보스: boss_knotcore(40층). 별이 흔적 기믹: kerchief_markers(31층 막간 S2-b).
 * 드랍 편향: utility·luck(행운/유틸 장비).
 * ==========================================================================*/
(function (g) {
  'use strict';

  var FLOORS = [

    // ══════════════════════════════════════════════════════════════════════
    // 31층 — 막간 S2-b: 손수건 길표시 (별이 흔적: kerchief_markers)
    // 방 8개: T_ENTRY / T_CROSS×2 / T_ARENA / T_SMALL / T_TREASURE / T_SECRET / T_CORRIDOR
    // graph: r1→r2, r2→r3, r2→r4, r2→r5, r3→r6, r4→r7, r5→r8
    // 차도: r1=1, r2=4, r3=2, r4=2, r5=2, r6=1, r7=1, r8=1
    // T_CROSS(r2) 4방향: N(r5)·S(r4)·W(r1)·E(r3)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-31', region: 'region-04', theme: 'kerchief-maze',
      rooms: [
        // r1: T_ENTRY 차수1 문E
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
        // r2: T_CROSS 차수4 문W(r1)·E(r3)·S(r4)·N(r5)
        {
          id: 'r2', template: 'T_CROSS',
          grid: [
            "####D####",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r3: T_CROSS 차수2 문W(r2)·S(r6)
        // 4방향 T_CROSS에서 N·E 막고 W·S만
        {
          id: 'r3', template: 'T_CROSS',
          grid: [
            "#########",
            "#.......#",
            "#..E.E..#",
            "D...S...#",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r4: T_ARENA 차수2 문N(r2)·E(r7)
        {
          id: 'r4', template: 'T_ARENA',
          grid: [
            "###D#########",
            "#...........#",
            "#...E...E...#",
            "#...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }, { type: 'shard_darter', count: 1 }]
        },
        // r5: T_SMALL 차수2 문S(r2)·E(r8)
        {
          id: 'r5', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "#.E.E.D",
            "#.....#",
            "###D###"
          ],
          spawns: [{ type: 'shard_darter', count: 1 }]
        },
        // r6: T_SECRET 차수1 문N(r3), gimmick: kerchief_markers
        {
          id: 'r6', template: 'T_SECRET',
          grid: [
            "###D###",
            "#.....#",
            "#..T..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'kerchief_markers'
        },
        // r7: T_CORRIDOR 차수1 문W(r4)
        {
          id: 'r7', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....#",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_darter', count: 1 }]
        },
        // r8: T_TREASURE 차수1 문W(r5)
        {
          id: 'r8', template: 'T_TREASURE',
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
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r4' },
        { from: 'r2', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' }
      ],
      special: { secret: 'r6', treasure: 'r8' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 32층 — splitter 본격 (갈라짐 압박)
    // 방 8개: T_ENTRY / T_ARENA×2 / T_CROSS / T_PILLARS / T_SMALL / T_TREASURE / T_SECRET
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r3→r6, r4→r7, r5→r8
    // 차도: r1=1, r2=3, r3=3, r4=2, r5=2, r6=1, r7=1, r8=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-32', region: 'region-04', theme: 'kerchief-maze',
      rooms: [
        // r1: T_ENTRY 차수1 문E
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
        // r2: T_ARENA 차수3 문W(r1)·E(r3)·S(r4)
        {
          id: 'r2', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "D...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r3: T_CROSS 차수3 문W(r2)·E(r5)·S(r6)
        {
          id: 'r3', template: 'T_CROSS',
          grid: [
            "#########",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r4: T_PILLARS 차수2 문N(r2)·E(r7)
        {
          id: 'r4', template: 'T_PILLARS',
          grid: [
            "###D#########",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r5: T_ARENA 차수2 문W(r3)·S(r8)
        {
          id: 'r5', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "D...........#",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r6: T_SECRET 차수1 문N(r3)
        {
          id: 'r6', template: 'T_SECRET',
          grid: [
            "###D###",
            "#.....#",
            "#..T..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'star_trace'
        },
        // r7: T_SMALL 차수1 문W(r4)
        {
          id: 'r7', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_darter', count: 1 }]
        },
        // r8: T_TREASURE 차수1 문N(r5)
        {
          id: 'r8', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....#",
            "#.TTT.#",
            "#..T..#",
            "#.....#",
            "#######"
          ],
          spawns: []
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' }
      ],
      special: { secret: 'r6', treasure: 'r8' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 33층 — 다분기 미로
    // 방 9개: T_ENTRY / T_CROSS×2 / T_ARENA / T_CORRIDOR×2 / T_SMALL / T_TREASURE / T_SECRET
    // graph: r1→r2, r2→r3, r2→r4, r2→r5, r3→r6, r3→r7, r4→r8, r5→r9
    // 차도: r1=1, r2=4, r3=3, r4=2, r5=2, r6=1, r7=1, r8=1, r9=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-33', region: 'region-04', theme: 'kerchief-maze',
      rooms: [
        // r1: T_ENTRY 차수1 문E
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
        // r2: T_CROSS 차수4 문W(r1)·E(r3)·S(r4)·N(r5)
        {
          id: 'r2', template: 'T_CROSS',
          grid: [
            "####D####",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r3: T_CROSS 차수3 문W(r2)·E(r6)·S(r7)
        {
          id: 'r3', template: 'T_CROSS',
          grid: [
            "#########",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }, { type: 'shard_darter', count: 1 }]
        },
        // r4: T_CORRIDOR 차수2 문N(r2)·E(r8)
        {
          id: 'r4', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "#.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r5: T_ARENA 차수2 문S(r2)·E(r9)
        {
          id: 'r5', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r6: T_CORRIDOR 차수1 문W(r3)
        {
          id: 'r6', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....#",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_darter', count: 1 }]
        },
        // r7: T_SECRET 차수1 문N(r3)
        {
          id: 'r7', template: 'T_SECRET',
          grid: [
            "###D###",
            "#.....#",
            "#..T..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'star_trace'
        },
        // r8: T_SMALL 차수1 문W(r4)
        {
          id: 'r8', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r9: T_TREASURE 차수1 문W(r5)... 아니, r5 N문=r2쪽 S, E문=r9
        // r5 S문은 r2에서 왔으므로(r2 N→r5): r5 차수2: 문S(r2연결)·E(r9)
        // r9: T_TREASURE 차수1 문W(r5)
        {
          id: 'r9', template: 'T_TREASURE',
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
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r4' },
        { from: 'r2', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r3', to: 'r7' },
        { from: 'r4', to: 'r8' },
        { from: 'r5', to: 'r9' }
      ],
      special: { secret: 'r7', treasure: 'r9' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 34층 — 손수건 분기 추적
    // 방 9개: T_ENTRY / T_CROSS / T_ARENA×2 / T_PILLARS / T_CORRIDOR / T_SMALL / T_TREASURE / T_SECRET
    // graph: r1→r2, r2→r3, r2→r4, r2→r5, r3→r6, r4→r7, r5→r8, r6→r9
    // 차도: r1=1, r2=4, r3=2, r4=2, r5=2, r6=2, r7=1, r8=1, r9=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-34', region: 'region-04', theme: 'kerchief-maze',
      rooms: [
        // r1: T_ENTRY 차수1 문E
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
        // r2: T_CROSS 차수4 문W(r1)·E(r3)·S(r4)·N(r5)
        {
          id: 'r2', template: 'T_CROSS',
          grid: [
            "####D####",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }, { type: 'shard_darter', count: 1 }]
        },
        // r3: T_ARENA 차수2 문W(r2)·S(r6)
        {
          id: 'r3', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "D...........#",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r4: T_PILLARS 차수2 문N(r2)·E(r7)
        {
          id: 'r4', template: 'T_PILLARS',
          grid: [
            "###D#########",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r5: T_ARENA 차수2 문S(r2)·E(r8)
        {
          id: 'r5', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r6: T_CORRIDOR 차수2 문N(r3)·E(r9)
        {
          id: 'r6', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "#.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_darter', count: 1 }]
        },
        // r7: T_SMALL 차수1 문W(r4)
        {
          id: 'r7', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r8: T_TREASURE 차수1 문W(r5)
        {
          id: 'r8', template: 'T_TREASURE',
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
        // r9: T_SECRET 차수1 문W(r6)
        {
          id: 'r9', template: 'T_SECRET',
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
        { from: 'r2', to: 'r4' },
        { from: 'r2', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' },
        { from: 'r6', to: 'r9' }
      ],
      special: { secret: 'r9', treasure: 'r8' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 35층 — 증식 군집 방
    // 방 9개: T_ENTRY / T_ARENA×3 / T_CROSS / T_SMALL / T_TREASURE / T_SECRET / T_CORRIDOR
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r3→r6, r4→r7, r5→r8, r6→r9
    // 차도: r1=1, r2=3, r3=3, r4=2, r5=2, r6=2, r7=1, r8=1, r9=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-35', region: 'region-04', theme: 'kerchief-maze',
      rooms: [
        // r1: T_ENTRY 차수1 문E
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
        // r2: T_ARENA 차수3 문W(r1)·E(r3)·S(r4)
        {
          id: 'r2', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "D...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r3: T_CROSS 차수3 문W(r2)·E(r5)·S(r6)
        {
          id: 'r3', template: 'T_CROSS',
          grid: [
            "#########",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }, { type: 'shard_darter', count: 1 }]
        },
        // r4: T_CORRIDOR 차수2 문N(r2)·E(r7)
        {
          id: 'r4', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "#.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r5: T_ARENA 차수2 문W(r3)·S(r8)
        {
          id: 'r5', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "D...........#",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r6: T_ARENA 차수2 문N(r3)·E(r9)
        {
          id: 'r6', template: 'T_ARENA',
          grid: [
            "###D#########",
            "#...........#",
            "#...E...E...#",
            "#...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r7: T_SMALL 차수1 문W(r4)
        {
          id: 'r7', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_darter', count: 1 }]
        },
        // r8: T_TREASURE 차수1 문N(r5)
        {
          id: 'r8', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....#",
            "#.TTT.#",
            "#..T..#",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r9: T_SECRET 차수1 문W(r6)
        {
          id: 'r9', template: 'T_SECRET',
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
        { from: 'r2', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' },
        { from: 'r6', to: 'r9' }
      ],
      special: { secret: 'r9', treasure: 'r8' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 36층 — 좁은 길목 매복
    // 방 9개: T_ENTRY / T_CORRIDOR×2 / T_PILLARS×2 / T_ARENA / T_SMALL / T_TREASURE / T_SECRET
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r3→r6, r4→r7, r5→r8, r6→r9
    // 차도: r1=1, r2=3, r3=3, r4=2, r5=2, r6=2, r7=1, r8=1, r9=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-36', region: 'region-04', theme: 'kerchief-maze',
      rooms: [
        // r1: T_ENTRY 차수1 문E
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
        // r2: T_CORRIDOR 차수3 문W(r1)·E(r3)·S(r4)
        // T_CORRIDOR 기본은 W/E. 아래 변에 S문 추가
        {
          id: 'r2', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "###D###"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r3: T_PILLARS 차수3 문W(r2)·E(r5)·S(r6)
        {
          id: 'r3', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "D...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r4: T_CORRIDOR 차수2 문N(r2)·E(r7)
        {
          id: 'r4', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "#.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r5: T_ARENA 차수2 문W(r3)·S(r8)
        {
          id: 'r5', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "D...........#",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r6: T_PILLARS 차수2 문N(r3)·E(r9)
        {
          id: 'r6', template: 'T_PILLARS',
          grid: [
            "###D#########",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }, { type: 'shard_darter', count: 1 }]
        },
        // r7: T_SMALL 차수1 문W(r4)
        {
          id: 'r7', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_darter', count: 1 }]
        },
        // r8: T_TREASURE 차수1 문N(r5)
        {
          id: 'r8', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....#",
            "#.TTT.#",
            "#..T..#",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r9: T_SECRET 차수1 문W(r6)
        {
          id: 'r9', template: 'T_SECRET',
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
        { from: 'r2', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' },
        { from: 'r6', to: 'r9' }
      ],
      special: { secret: 'r9', treasure: 'r8' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 37층 — 교차 미로 허브
    // 방 9개: T_ENTRY / T_CROSS×2 / T_ARENA×2 / T_PILLARS / T_TREASURE / T_SECRET
    // (9개: T_ENTRY + T_CROSS×2 + T_ARENA×2 + T_PILLARS + T_TREASURE + T_SECRET + T_SMALL)
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r3→r6, r4→r7, r5→r8, r6→r9
    // 차도: r1=1, r2=3, r3=3, r4=2, r5=2, r6=2, r7=1, r8=1, r9=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-37', region: 'region-04', theme: 'kerchief-maze',
      rooms: [
        // r1: T_ENTRY 차수1 문E
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
        // r2: T_CROSS 차수3 문W(r1)·E(r3)·S(r4)
        {
          id: 'r2', template: 'T_CROSS',
          grid: [
            "#########",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }, { type: 'shard_darter', count: 1 }]
        },
        // r3: T_CROSS 차수3 문W(r2)·E(r5)·S(r6)
        {
          id: 'r3', template: 'T_CROSS',
          grid: [
            "#########",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r4: T_PILLARS 차수2 문N(r2)·E(r7)
        {
          id: 'r4', template: 'T_PILLARS',
          grid: [
            "###D#########",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r5: T_ARENA 차수2 문W(r3)·S(r8)
        {
          id: 'r5', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "D...........#",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }, { type: 'shard_darter', count: 1 }]
        },
        // r6: T_ARENA 차수2 문N(r3)·E(r9)
        {
          id: 'r6', template: 'T_ARENA',
          grid: [
            "###D#########",
            "#...........#",
            "#...E...E...#",
            "#...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }, { type: 'shard_darter', count: 1 }]
        },
        // r7: T_SMALL 차수1 문W(r4)
        {
          id: 'r7', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_darter', count: 1 }]
        },
        // r8: T_TREASURE 차수1 문N(r5)
        {
          id: 'r8', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....#",
            "#.TTT.#",
            "#..T..#",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r9: T_SECRET 차수1 문W(r6)
        {
          id: 'r9', template: 'T_SECRET',
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
        { from: 'r2', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' },
        { from: 'r6', to: 'r9' }
      ],
      special: { secret: 'r9', treasure: 'r8' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 38층 — 갈라짐 + 속도 혼합 러시 (지역 최고난도)
    // 방 10개: T_ENTRY / T_ARENA×3 / T_CROSS / T_HALL / T_PILLARS / T_SMALL / T_TREASURE / T_SECRET
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r3→r6, r4→r7, r4→r8, r5→r9, r6→r10
    // 차도: r1=1, r2=3, r3=3, r4=3, r5=2, r6=2, r7=1, r8=1, r9=1, r10=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-38', region: 'region-04', theme: 'kerchief-maze',
      rooms: [
        // r1: T_ENTRY 차수1 문E
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
        // r2: T_CROSS 차수3 문W(r1)·E(r3)·S(r4)
        {
          id: 'r2', template: 'T_CROSS',
          grid: [
            "#########",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r3: T_ARENA 차수3 문W(r2)·E(r5)·S(r6)
        {
          id: 'r3', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "D...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }, { type: 'shard_darter', count: 1 }]
        },
        // r4: T_HALL 차수3 문N(r2)·E(r7)·W(r8)
        {
          id: 'r4', template: 'T_HALL',
          grid: [
            "###D###########",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.............#",
            "###############"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r5: T_ARENA 차수2 문W(r3)·S(r9)
        {
          id: 'r5', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "D...........#",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 3 }]
        },
        // r6: T_PILLARS 차수2 문N(r3)·E(r10)
        {
          id: 'r6', template: 'T_PILLARS',
          grid: [
            "###D#########",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r7: T_ARENA 차수1 문W(r4)
        {
          id: 'r7', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "D...........#",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r8: T_SMALL 차수1 문E(r4)
        {
          id: 'r8', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "#.E.E.D",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r9: T_TREASURE 차수1 문N(r5)
        {
          id: 'r9', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....#",
            "#.TTT.#",
            "#..T..#",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r10: T_SECRET 차수1 문W(r6)
        {
          id: 'r10', template: 'T_SECRET',
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
        { from: 'r2', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r4', to: 'r8' },
        { from: 'r5', to: 'r9' },
        { from: 'r6', to: 'r10' }
      ],
      special: { secret: 'r10', treasure: 'r9' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 39층 — 보스 전 정비
    // 방 8개: T_ENTRY / T_ARENA / T_REST / T_CROSS / T_SMALL / T_TREASURE / T_SECRET / T_CORRIDOR
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7, r6→r8
    // 차도: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=1, r8=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-39', region: 'region-04', theme: 'kerchief-maze',
      rooms: [
        // r1: T_ENTRY 차수1 문E
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
        // r2: T_CROSS 차수3 문W(r1)·E(r3)·S(r4)
        {
          id: 'r2', template: 'T_CROSS',
          grid: [
            "#########",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }, { type: 'shard_darter', count: 1 }]
        },
        // r3: T_ARENA 차수2 문W(r2)·S(r5)
        {
          id: 'r3', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "D...........#",
            "#...........#",
            "#...........#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }]
        },
        // r4: T_REST 차수2 문N(r2)·E(r6)
        {
          id: 'r4', template: 'T_REST',
          grid: [
            "###D###",
            "#.....#",
            "#..T..D",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r5: T_CORRIDOR 차수2 문N(r3)·E(r7)
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
          spawns: [{ type: 'shard_darter', count: 1 }]
        },
        // r6: T_SMALL 차수2 문W(r4)·S(r8)
        {
          id: 'r6', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "###D###"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r7: T_TREASURE 차수1 문W(r5)
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
        // r8: T_SECRET 차수1 문N(r6)
        {
          id: 'r8', template: 'T_SECRET',
          grid: [
            "###D###",
            "#.....#",
            "#..T..#",
            "#.....#",
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
        { from: 'r2', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r6', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 40층 — 보스: 미궁 한복판의 매듭 응어리 (boss_knotcore)
    // 방 2개: T_ENTRY / T_BOSS(+X)
    // graph: b1→b2, 차도: b1=1, b2=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-40', region: 'region-04', theme: 'kerchief-maze',
      rooms: [
        // b1: T_ENTRY 차수1 문E
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
        // b2: T_BOSS 차수1 문W(b1), 출구X 포함
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
          spawns: [{ type: 'boss_knotcore', count: 1 }]
        }
      ],
      graph: [{ from: 'b1', to: 'b2' }],
      special: { boss: 'b2' }
    }

  ];

  g.POP_FLOORS_R04 = FLOORS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { FLOORS: FLOORS };
})(typeof window !== 'undefined' ? window : globalThis);
