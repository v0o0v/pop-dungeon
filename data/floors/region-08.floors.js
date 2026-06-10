/* ============================================================================
 * region-08 floors — 켜진 횃불의 길 (71~80층)
 * ----------------------------------------------------------------------------
 * 바이옴: lit-corridor · 테마: torch ramp + glow accent (lightTemp warm)
 * 별이 흔적 기믹: prelit_torches (71층 막간 S5-b, E1 회수)
 * 보스(80층): boss_lightfearer — hp 320, patterns ['spiral','fan','ring']
 * 어두운 방 없음 — 전 지역 밝은 룩(유일 warm 지역). T_HALL 비중↑.
 * 사양서: .omc/plans/floors-design/region-08.md
 * ==========================================================================*/
(function (g) {
  'use strict';

  var FLOORS = [

    // ── 71층 — 막간 S5-b: 켜진 횃불 (prelit_torches) ───────────────────────
    // 방 8개: T_ENTRY/T_HALL×2/T_ARENA×1/T_TREASURE×1/T_SECRET×1/T_SMALL×1/T_CORRIDOR×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6(secret), r5→r7, r7→r8
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=1, r7=2, r8=1
    {
      id: 'floor-71', region: 'region-08', theme: 'lit-corridor',
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
        // r2 — T_HALL, 차수3: 문 W(r1), E(r3), S방향 추가(r4)
        { id: 'r2', template: 'T_HALL',
          grid: [
            "####D##########",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r4 — T_ARENA, 차수2: 문 N(r2), E(r6 secret)
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
        },
        // r6 — T_SECRET (prelit_torches 기믹), 차수1: 문 W(r4)
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
          gimmick: 'prelit_torches'
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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

    // ── 72층 — 밝은 회랑 첫 교전 ────────────────────────────────────────────
    // 방 8개: T_ENTRY/T_HALL×2/T_ARENA×1/T_PILLARS×1/T_TREASURE×1/T_SECRET×1/T_SMALL×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7(secret), r6→r8
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=1, r8=1
    {
      id: 'floor-72', region: 'region-08', theme: 'lit-corridor',
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
        // r2 — T_HALL, 차수3: 문 W(r1), E(r3), N(r4)
        { id: 'r2', template: 'T_HALL',
          grid: [
            "####D##########",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r4 — T_ARENA, 차수2: 문 S(r2), E(r6)
        { id: 'r4', template: 'T_ARENA',
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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
        // r8 — T_TREASURE, 차수1: 문 N(r6)
        { id: 'r8', template: 'T_TREASURE',
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
        { from: 'r4', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r6', to: 'r8' }
      ],
      special: { secret: 'r7', treasure: 'r8' }
    },

    // ── 73층 — 빛 그림자 술래잡기 ────────────────────────────────────────────
    // 방 9개: T_ENTRY/T_PILLARS×2/T_ARENA×1/T_REST×1/T_TREASURE×1/T_SECRET×1/T_CORRIDOR×1/T_SMALL×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7(secret), r6→r8, r8→r9
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=1, r8=2, r9=1
    {
      id: 'floor-73', region: 'region-08', theme: 'lit-corridor',
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
        // r2 — T_PILLARS, 차수3: 문 W(r1), N(r3), S(r4)
        { id: 'r2', template: 'T_PILLARS',
          grid: [
            "####D########",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........#",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r3 — T_PILLARS, 차수2: 문 S(r2), E(r5)
        { id: 'r3', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#...........D",
            "#...........#",
            "#.P.....P...#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r5 — T_REST, 차수2: 문 W(r3), E(r7 secret)
        { id: 'r5', template: 'T_REST',
          grid: [
            "#######",
            "#.....#",
            "D..T..D",
            "#.....#",
            "#######"
          ],
          spawns: []
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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

    // ── 74층 — 횃불 회랑 분기 ────────────────────────────────────────────────
    // 방 9개: T_ENTRY/T_CROSS×1/T_HALL×2/T_ARENA×1/T_CORRIDOR×1/T_TREASURE×1/T_SECRET×1/T_SMALL×1
    // graph: r1→r2(cross), r2→r3, r2→r4, r2→r5, r3→r6, r4→r7(secret), r5→r8, r8→r9
    // 차수: r1=1, r2=4, r3=2, r4=2, r5=2, r6=1, r7=1, r8=2, r9=1
    {
      id: 'floor-74', region: 'region-08', theme: 'lit-corridor',
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
        // r2 — T_CROSS, 차수4: 문 W(r1), N(r3), S(r4), E(r5)
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r3 — T_HALL, 차수2: 문 S(r2), E(r6)
        { id: 'r3', template: 'T_HALL',
          grid: [
            "###############",
            "#.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E.........E.#",
            "####D##########"
          ],
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r4 — T_HALL, 차수2: 문 N(r2), E(r7 secret)
        { id: 'r4', template: 'T_HALL',
          grid: [
            "####D##########",
            "#.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r5 — T_ARENA, 차수2: 문 W(r2), S(r8)
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
        // r8 — T_CORRIDOR, 차수2: 문 N(r5), E(r9)
        { id: 'r8', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "D.....#",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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

    // ── 75층 — 빛 약화 활용 방 ──────────────────────────────────────────────
    // 방 9개: T_ENTRY/T_ARENA×2/T_HALL×1/T_PILLARS×1/T_SMALL×1/T_TREASURE×1/T_SECRET×1/T_CORRIDOR×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7(secret), r6→r8, r8→r9
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=1, r8=2, r9=1
    {
      id: 'floor-75', region: 'region-08', theme: 'lit-corridor',
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r4 — T_HALL, 차수2: 문 N(r2), E(r6)
        { id: 'r4', template: 'T_HALL',
          grid: [
            "####D##########",
            "#.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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

    // ── 76층 — 밝은 개활 군집 ────────────────────────────────────────────────
    // 방 9개: T_ENTRY/T_ARENA×3/T_PILLARS×1/T_SMALL×1/T_TREASURE×1/T_SECRET×1/T_CORRIDOR×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7(secret), r6→r8, r8→r9
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=1, r8=2, r9=1
    {
      id: 'floor-76', region: 'region-08', theme: 'lit-corridor',
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 3 }]
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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

    // ── 77층 — 빛 통로 미니 챌린지 (빛/어둠 동선 트레이드오프) ──────────────
    // 방 9개: T_ENTRY/T_HALL×2/T_PILLARS×1/T_ARENA×1/T_SMALL×1/T_TREASURE×1/T_SECRET×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7(secret), r6→r8, r8→r9
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=1, r8=2, r9=1
    {
      id: 'floor-77', region: 'region-08', theme: 'lit-corridor',
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
        // r2 — T_HALL, 차수3: 문 W(r1), E(r3), N(r4)
        { id: 'r2', template: 'T_HALL',
          grid: [
            "####D##########",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r4 — T_PILLARS, 차수2: 문 S(r2), E(r6)
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r5 — T_ARENA, 차수2: 문 W(r3), E(r7 secret)
        { id: 'r5', template: 'T_ARENA',
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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

    // ── 78층 — legendary 대군 (지역 내 최고난도) ─────────────────────────────
    // 방 10개: T_ENTRY/T_ARENA×3/T_HALL×2/T_PILLARS×1/T_SMALL×1/T_TREASURE×1/T_SECRET×1
    // graph: r1→r2, r2→r3, r2→r4, r2→r5, r3→r6, r4→r7, r5→r8, r6→r9(secret), r7→r10
    // 차수: r1=1, r2=4, r3=2, r4=2, r5=2, r6=2, r7=2, r8=1, r9=1, r10=1
    {
      id: 'floor-78', region: 'region-08', theme: 'lit-corridor',
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
        // r2 — T_CROSS, 차수4: 문 W(r1), N(r3), S(r4), E(r5)
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r3 — T_ARENA, 차수2: 문 S(r2), E(r6)
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r4 — T_ARENA, 차수2: 문 N(r2), E(r7)
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
          spawns: [{ type: 'shard_lightshy', count: 3 }]
        },
        // r5 — T_HALL, 차수2: 문 W(r2), E(r8)
        { id: 'r5', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_lightshy', count: 3 }]
        },
        // r6 — T_HALL, 차수2: 문 W(r3), S(r9 secret)
        { id: 'r6', template: 'T_HALL',
          grid: [
            "###############",
            "D.............#",
            "#.E.........E.#",
            "#.............#",
            "#.E.........E.#",
            "####D##########"
          ],
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r7 — T_PILLARS, 차수2: 문 W(r4), E(r10)
        { id: 'r7', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_lightshy', count: 3 }]
        },
        // r8 — T_TREASURE, 차수1: 문 W(r5)
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
        },
        // r9 — T_SECRET, 차수1: 문 N(r6)
        { id: 'r9', template: 'T_SECRET',
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
        // r10 — T_SMALL, 차수1: 문 W(r7)
        { id: 'r10', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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
        { from: 'r6', to: 'r9' },
        { from: 'r7', to: 'r10' }
      ],
      special: { secret: 'r9', treasure: 'r8' }
    },

    // ── 79층 — 보스 전 정비 (legendary 보상) ─────────────────────────────────
    // 방 8개: T_ENTRY/T_REST×1/T_ARENA×1/T_HALL×1/T_SMALL×1/T_TREASURE×1/T_SECRET×1/T_CORRIDOR×1
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6(secret), r5→r7, r7→r8
    // 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=1, r7=2, r8=1
    {
      id: 'floor-79', region: 'region-08', theme: 'lit-corridor',
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
          spawns: [{ type: 'shard_lightshy', count: 2 }]
        },
        // r4 — T_HALL, 차수2: 문 N(r2), E(r6 secret)
        { id: 'r4', template: 'T_HALL',
          grid: [
            "####D##########",
            "#.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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
          spawns: [{ type: 'shard_lightshy', count: 1 }]
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

    // ── 80층 — 보스: 빛을 두려워하는 응어리 (boss_lightfearer) ───────────────
    // 방 2개: T_ENTRY + T_BOSS(boss_lightfearer, 'X')
    {
      id: 'floor-80', region: 'region-08', theme: 'lit-corridor',
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
          spawns: [{ type: 'boss_lightfearer', count: 1 }]
        }
      ],
      graph: [{ from: 'b1', to: 'b2' }],
      special: { boss: 'b2' }
    }

  ]; // end FLOORS

  g.POP_FLOORS_R08 = FLOORS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { FLOORS: FLOORS };
})(typeof window !== 'undefined' ? window : globalThis);
