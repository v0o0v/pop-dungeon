/* ============================================================================
 * region-07 floors — 우는 그림자 늪 (61~70층)
 * ----------------------------------------------------------------------------
 * 바이옴: weeping-marsh · 테마: ink ramp + cold accent
 * 별이 흔적 기믹: weeping_enemies (61층 막간 S5-a)
 * 보스(70층): boss_deepsob — hp 250, patterns ['ring','spiral','aimed3']
 * 사양서: .omc/plans/floors-design/region-07.md
 * ==========================================================================*/
(function (g) {
  'use strict';

  var FLOORS = [

    // ── 61층 — 막간 S5-a: 우는 적 (weeping_enemies) ────────────────────────
    // 방 8개: T_ENTRY/T_ARENA×1/T_PITROOM×2/T_TREASURE×1/T_SECRET×1/T_SMALL×1/T_CORRIDOR×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6(secret), r5→r7, r7→r8
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=1, r7=2, r8=1
    {
      id: 'floor-61', region: 'region-07', theme: 'weeping-marsh',
      rooms: [
        // r1 — T_ENTRY, 차수1: 문 E쪽 1개
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 — T_ARENA, 차수3: 문 W(r1), N(r3), S(r4)
        { id: 'r2', template: 'T_ARENA',
          grid: [
            "####D####",
            "#.......#",
            "#..E.E..#",
            "D...S...#",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_weeper', count: 3 }]
        },
        // r3 — T_PITROOM, 차수2: 문 S(r2), E(r5)
        { id: 'r3', template: 'T_PITROOM',
          grid: [
            "#############",
            "#...........#",
            "#..PPPPP....#",
            "#..P...P..S.D",
            "#..P.E.P....#",
            "#..PPPPP....#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r4 — T_PITROOM, 차수2: 문 N(r2), E(r6 secret)
        { id: 'r4', template: 'T_PITROOM',
          grid: [
            "####D########",
            "#...........#",
            "#..PPPPP....#",
            "#..P...P..S.D",
            "#..P.E.P....#",
            "#..PPPPP....#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r5 — T_SMALL, 차수2: 문 W(r3), E(r7)
        { id: 'r5', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.D",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r6 — T_SECRET (weeping_enemies 기믹), 차수1: 문 W(r4)
        { id: 'r6', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'weeping_enemies'
        },
        // r7 — T_CORRIDOR, 차수2: 문 W(r5), E(r8)
        { id: 'r7', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r8 — T_TREASURE, 차수1: 문 W(r7)
        { id: 'r8', template: 'T_TREASURE',
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
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r7', to: 'r8' }
      ],
      special: { secret: 'r6', treasure: 'r8' }
    },

    // ── 62층 — 안개 늪 첫 지구전 ────────────────────────────────────────────
    // 방 8개: T_ENTRY/T_ARENA×2/T_PILLARS×1/T_PITROOM×1/T_TREASURE×1/T_SECRET×1/T_SMALL×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7, r6→r8(secret)
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=1, r8=1
    {
      id: 'floor-62', region: 'region-07', theme: 'weeping-marsh',
      rooms: [
        // r1 — T_ENTRY, 차수1: 문 E
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 — T_ARENA, 차수3: 문 W(r1), E(r3), S(r4)
        { id: 'r2', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D.....S.....D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r3 — T_ARENA, 차수2: 문 W(r2), S(r5)
        { id: 'r3', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........#",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r4 — T_PILLARS, 차수2: 문 N(r2), E(r6)
        { id: 'r4', template: 'T_PILLARS',
          grid: [
            "####D########",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#.....S.....D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r5 — T_PITROOM, 차수2: 문 N(r3), E(r7)
        { id: 'r5', template: 'T_PITROOM',
          grid: [
            "####D########",
            "#...........#",
            "#..PPPPP....#",
            "#..P...P..S.D",
            "#..P.E.P....#",
            "#..PPPPP....#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r6 — T_SMALL, 차수2: 문 W(r4), S(r8)
        { id: 'r6', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "###D###"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r7 — T_TREASURE, 차수1: 문 W(r5)
        { id: 'r7', template: 'T_TREASURE',
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
        // r8 — T_SECRET, 차수1: 문 N(r6)
        { id: 'r8', template: 'T_SECRET',
          grid: [
            "###D###",
            "#.....#",
            "#..T..#",
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

    // ── 63층 — 웅크린 그림자 다수 ────────────────────────────────────────────
    // 방 8개: T_ENTRY/T_ARENA×2/T_PILLARS×1/T_HALL×1/T_TREASURE×1/T_SECRET×1/T_CORRIDOR×1
    // graph: r1→r2, r2→r3, r2→r5, r3→r4, r4→r6(secret), r5→r7, r7→r8
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=1, r7=2, r8=1
    {
      id: 'floor-63', region: 'region-07', theme: 'weeping-marsh',
      rooms: [
        // r1 — T_ENTRY, 차수1: 문 E
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 — T_ARENA, 차수3: 문 W(r1), N(r3), S(r5)
        { id: 'r2', template: 'T_ARENA',
          grid: [
            "####D####",
            "#.......#",
            "#..E.E..#",
            "D...S...#",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r3 — T_ARENA, 차수2: 문 S(r2), E(r4)
        { id: 'r3', template: 'T_ARENA',
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
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r4 — T_SECRET, 차수2: 문 W(r3), S(r6) — gimmick star_trace
        { id: 'r4', template: 'T_SECRET',
          grid: [
            "#########",
            "#.......#",
            "#...T...#",
            "D.......#",
            "#.......#",
            "####D####"
          ],
          spawns: [],
          gimmick: 'star_trace'
        },
        // r5 — T_PILLARS, 차수2: 문 N(r2), E(r7)
        { id: 'r5', template: 'T_PILLARS',
          grid: [
            "####D########",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r6 — T_TREASURE, 차수1: 문 N(r4)
        { id: 'r6', template: 'T_TREASURE',
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
        // r7 — T_HALL, 차수2: 문 W(r5), E(r8)
        { id: 'r7', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r8 — T_CORRIDOR, 차수1: 문 W(r7)
        { id: 'r8', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....#",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r5' },
        { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r7', to: 'r8' }
      ],
      special: { secret: 'r4', treasure: 'r6' }
    },

    // ── 64층 — 안개 시야 제한 미로 ──────────────────────────────────────────
    // 방 9개: T_ENTRY/T_CROSS×1/T_PILLARS×2/T_ARENA×1/T_REST×1/T_TREASURE×1/T_SECRET×1/T_CORRIDOR×1
    // graph: r1→r2(cross), r2→r3, r2→r4, r2→r5, r3→r6, r4→r7(secret), r5→r8, r8→r9
    // 차수: r1=1, r2=4, r3=2, r4=2, r5=2, r6=1, r7=1, r8=2, r9=1
    {
      id: 'floor-64', region: 'region-07', theme: 'weeping-marsh',
      rooms: [
        // r1 — T_ENTRY, 차수1: 문 E
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 — T_CROSS, 차수4: 문 N/S/W(r1)/E
        { id: 'r2', template: 'T_CROSS',
          grid: [
            "####D####",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r3 — T_PILLARS, 차수2: 문 N(r2), E(r6)
        { id: 'r3', template: 'T_PILLARS',
          grid: [
            "####D########",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r4 — T_PILLARS, 차수2: 문 S(r2), E(r7 secret)
        { id: 'r4', template: 'T_PILLARS',
          grid: [
            "####D########",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#...........D",
            "#...........#",
            "#.P.....P...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r5 — T_ARENA, 차수2: 문 W(r2, E방향 간선이므로 r2 E쪽=r5), S(r8)
        { id: 'r5', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........#",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r6 — T_TREASURE, 차수1: 문 W(r3)
        { id: 'r6', template: 'T_TREASURE',
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
        // r7 — T_SECRET, 차수1: 문 W(r4)
        { id: 'r7', template: 'T_SECRET',
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
        },
        // r8 — T_REST, 차수2: 문 N(r5), E(r9)
        { id: 'r8', template: 'T_REST',
          grid: [
            "###D###",
            "#.....#",
            "D..T..#",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r9 — T_CORRIDOR, 차수1: 문 W(r8)
        { id: 'r9', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....#",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
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
        { from: 'r8', to: 'r9' }
      ],
      special: { secret: 'r7', treasure: 'r6' }
    },

    // ── 65층 — 늪 구덩이 우회 ────────────────────────────────────────────────
    // 방 9개: T_ENTRY/T_PITROOM×2/T_ARENA×1/T_PILLARS×1/T_SMALL×1/T_TREASURE×1/T_SECRET×1/T_CORRIDOR×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7(secret), r6→r8, r8→r9
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=1, r8=2, r9=1
    {
      id: 'floor-65', region: 'region-07', theme: 'weeping-marsh',
      rooms: [
        // r1 — T_ENTRY, 차수1: 문 E
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 — T_PITROOM, 차수3: 문 W(r1), N(r3), S(r4)
        { id: 'r2', template: 'T_PITROOM',
          grid: [
            "####D########",
            "#...........#",
            "#..PPPPP....#",
            "D..P...P..S.#",
            "#..P.E.P....#",
            "#..PPPPP....#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r3 — T_PITROOM, 차수2: 문 S(r2), E(r5)
        { id: 'r3', template: 'T_PITROOM',
          grid: [
            "#############",
            "#...........#",
            "#..PPPPP....#",
            "#..P...P..S.D",
            "#..P.E.P....#",
            "#..PPPPP....#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r4 — T_ARENA, 차수2: 문 N(r2), E(r6)
        { id: 'r4', template: 'T_ARENA',
          grid: [
            "####D########",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r5 — T_PILLARS, 차수2: 문 W(r3), E(r7 secret)
        { id: 'r5', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P.....P...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r6 — T_SMALL, 차수2: 문 W(r4), S(r8)
        { id: 'r6', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "###D###"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r7 — T_SECRET, 차수1: 문 W(r5)
        { id: 'r7', template: 'T_SECRET',
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
        },
        // r8 — T_TREASURE, 차수2: 문 N(r6), E(r9)
        { id: 'r8', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....#",
            "#.TTT.#",
            "D..T..#",
            "#.TTT.#",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r9 — T_CORRIDOR, 차수1: 문 W(r8)
        { id: 'r9', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....#",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r6', to: 'r8' },
        { from: 'r8', to: 'r9' }
      ],
      special: { secret: 'r7', treasure: 'r8' }
    },

    // ── 66층 — 우는 군집 (체력전) ────────────────────────────────────────────
    // 방 9개: T_ENTRY/T_ARENA×3/T_PILLARS×1/T_SMALL×1/T_TREASURE×1/T_SECRET×1/T_CORRIDOR×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7(secret), r6→r8, r8→r9
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=1, r8=2, r9=1
    {
      id: 'floor-66', region: 'region-07', theme: 'weeping-marsh',
      rooms: [
        // r1 — T_ENTRY, 차수1
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 — T_ARENA, 차수3: 문 W(r1), N(r3), S(r4)
        { id: 'r2', template: 'T_ARENA',
          grid: [
            "####D####",
            "#.......#",
            "#..E.E..#",
            "D...S...#",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r3 — T_ARENA, 차수2: 문 S(r2), E(r5)
        { id: 'r3', template: 'T_ARENA',
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
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r4 — T_ARENA, 차수2: 문 N(r2), E(r6)
        { id: 'r4', template: 'T_ARENA',
          grid: [
            "####D########",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r5 — T_PILLARS, 차수2: 문 W(r3), E(r7 secret)
        { id: 'r5', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P.....P...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r6 — T_SMALL, 차수2: 문 W(r4), S(r8)
        { id: 'r6', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "###D###"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r7 — T_SECRET, 차수1: 문 W(r5)
        { id: 'r7', template: 'T_SECRET',
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
        },
        // r8 — T_TREASURE, 차수2: 문 N(r6), E(r9)
        { id: 'r8', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....#",
            "#.TTT.#",
            "D..T..#",
            "#.TTT.#",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r9 — T_CORRIDOR, 차수1: 문 W(r8)
        { id: 'r9', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....#",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r6', to: 'r8' },
        { from: 'r8', to: 'r9' }
      ],
      special: { secret: 'r7', treasure: 'r8' }
    },

    // ── 67층 — 안개 회랑 매복 ────────────────────────────────────────────────
    // 방 9개: T_ENTRY/T_HALL×2/T_PILLARS×1/T_ARENA×1/T_SMALL×1/T_TREASURE×1/T_SECRET×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7, r6→r8(secret), r7→r9
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=2, r8=1, r9=1
    {
      id: 'floor-67', region: 'region-07', theme: 'weeping-marsh',
      rooms: [
        // r1 — T_ENTRY, 차수1: 문 E
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 — T_HALL, 차수3: 문 W(r1), E(r3), S방향은 Hall이 N/S 문 없으므로
        //   Hall은 W/E 문이 기본. 차수3을 위해 N문 추가.
        { id: 'r2', template: 'T_HALL',
          grid: [
            "####D##########",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r3 — T_HALL, 차수2: 문 W(r2), E(r5)
        { id: 'r3', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r4 — T_PILLARS, 차수2: 문 N(r2), E(r6)
        { id: 'r4', template: 'T_PILLARS',
          grid: [
            "####D########",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#...........D",
            "#...........#",
            "#.P.....P...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r5 — T_ARENA, 차수2: 문 W(r3), S(r7)
        { id: 'r5', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D...........#",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r6 — T_SMALL, 차수2: 문 W(r4), S(r8 secret)
        { id: 'r6', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "###D###"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r7 — T_TREASURE, 차수2: 문 N(r5), E(r9)
        { id: 'r7', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....#",
            "#.TTT.#",
            "D..T..#",
            "#.TTT.#",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r8 — T_SECRET, 차수1: 문 N(r6)
        { id: 'r8', template: 'T_SECRET',
          grid: [
            "###D###",
            "#.....#",
            "#..T..#",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'star_trace'
        },
        // r9 — T_SMALL, 차수1: 문 W(r7)
        { id: 'r9', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r6', to: 'r8' },
        { from: 'r7', to: 'r9' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ── 68층 — 대규모 지구전 ─────────────────────────────────────────────────
    // 방 9개: T_ENTRY/T_ARENA×3/T_PITROOM×1/T_PILLARS×1/T_TREASURE×1/T_SECRET×1/T_SMALL×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7(secret), r6→r8, r8→r9
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=1, r8=2, r9=1
    {
      id: 'floor-68', region: 'region-07', theme: 'weeping-marsh',
      rooms: [
        // r1 — T_ENTRY, 차수1
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 — T_ARENA, 차수3: 문 W(r1), N(r3), S(r4)
        { id: 'r2', template: 'T_ARENA',
          grid: [
            "####D####",
            "#.......#",
            "#..E.E..#",
            "D...S...#",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r3 — T_ARENA, 차수2: 문 S(r2), E(r5)
        { id: 'r3', template: 'T_ARENA',
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
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r4 — T_ARENA, 차수2: 문 N(r2), E(r6)
        { id: 'r4', template: 'T_ARENA',
          grid: [
            "####D########",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#...........D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 3 }]
        },
        // r5 — T_PITROOM, 차수2: 문 W(r3), E(r7 secret)
        { id: 'r5', template: 'T_PITROOM',
          grid: [
            "#############",
            "#...........#",
            "#..PPPPP....#",
            "D..P...P....D",
            "#..P.E.P....#",
            "#..PPPPP....#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r6 — T_PILLARS, 차수2: 문 W(r4), S(r8)
        { id: 'r6', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........#",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_weeper', count: 2 }]
        },
        // r7 — T_SECRET, 차수1: 문 W(r5)
        { id: 'r7', template: 'T_SECRET',
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
        },
        // r8 — T_TREASURE, 차수2: 문 N(r6), E(r9)
        { id: 'r8', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....#",
            "#.TTT.#",
            "D..T..#",
            "#.TTT.#",
            "#.....#",
            "#######"
          ],
          spawns: []
        },
        // r9 — T_SMALL, 차수1: 문 W(r8)
        { id: 'r9', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r6', to: 'r8' },
        { from: 'r8', to: 'r9' }
      ],
      special: { secret: 'r7', treasure: 'r8' }
    },

    // ── 69층 — 보스 전 정비 (방어 보상) ─────────────────────────────────────
    // 방 8개: T_ENTRY/T_REST×1/T_ARENA×1/T_PILLARS×1/T_SMALL×1/T_TREASURE×1/T_SECRET×1/T_CORRIDOR×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6(secret), r5→r7, r7→r8
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=1, r7=2, r8=1
    {
      id: 'floor-69', region: 'region-07', theme: 'weeping-marsh',
      rooms: [
        // r1 — T_ENTRY, 차수1
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r2 — T_REST, 차수3: 문 W(r1), N(r3), S(r4)
        { id: 'r2', template: 'T_REST',
          grid: [
            "####D####",
            "#.......#",
            "D...T...#",
            "#.......#",
            "####D####"
          ],
          spawns: []
        },
        // r3 — T_ARENA, 차수2: 문 S(r2), E(r5)
        { id: 'r3', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#...........D",
            "#...........#",
            "#...........#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r4 — T_PILLARS, 차수2: 문 N(r2), E(r6 secret)
        { id: 'r4', template: 'T_PILLARS',
          grid: [
            "####D########",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#...........D",
            "#...........#",
            "#.P.....P...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r5 — T_SMALL, 차수2: 문 W(r3), E(r7)
        { id: 'r5', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.D",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        },
        // r6 — T_SECRET, 차수1: 문 W(r4)
        { id: 'r6', template: 'T_SECRET',
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
        },
        // r7 — T_TREASURE, 차수2: 문 W(r5), E(r8)
        { id: 'r7', template: 'T_TREASURE',
          grid: [
            "#########",
            "#.......#",
            "#..TTT..#",
            "D...T...D",
            "#..TTT..#",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // r8 — T_CORRIDOR, 차수1: 문 W(r7)
        { id: 'r8', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....#",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_weeper', count: 1 }]
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r7', to: 'r8' }
      ],
      special: { secret: 'r6', treasure: 'r7' }
    },

    // ── 70층 — 보스: 늪 바닥의 가장 큰 울음 (boss_deepsob) ─────────────────
    // 방 2개: T_ENTRY + T_BOSS(boss_deepsob, 'X')
    {
      id: 'floor-70', region: 'region-07', theme: 'weeping-marsh',
      rooms: [
        // b1 — T_ENTRY, 차수1: 문 E(b2)
        { id: 'b1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....D",
            "#.......#",
            "#########"
          ],
          spawns: []
        },
        // b2 — T_BOSS + X, 차수1: 문 W(b1)
        { id: 'b2', template: 'T_BOSS',
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
          spawns: [{ type: 'boss_deepsob', count: 1 }]
        }
      ],
      graph: [{ from: 'b1', to: 'b2' }],
      special: { boss: 'b2' }
    }

  ]; // end FLOORS

  g.POP_FLOORS_R07 = FLOORS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { FLOORS: FLOORS };
})(typeof window !== 'undefined' ? window : globalThis);
