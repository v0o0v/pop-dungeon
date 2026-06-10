/* ============================================================================
 * region-03 floors — 곧은 발자국 회랑 (21~30층)
 * ----------------------------------------------------------------------------
 * 바이옴: footprint-hall. 간판 적: shard_darter(돌진). 보스: boss_hallwarden(30층).
 * 별이 흔적 기믹: straight_footprints(21층 막간 S2-a).
 * 드랍 편향: mobility(이동/속도 장비).
 * ==========================================================================*/
(function (g) {
  'use strict';

  var FLOORS = [

    // ══════════════════════════════════════════════════════════════════════
    // 21층 — 막간 S2-a: 곧은 발자국 (별이 흔적: straight_footprints)
    // 방 7개: T_ENTRY / T_HALL×2 / T_CORRIDOR / T_TREASURE / T_SECRET / T_SMALL
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r4→r7
    // 차수: r1=1, r2=3, r3=2, r4=3, r5=1, r6=1, r7=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-21', region: 'region-03', theme: 'footprint-hall',
      rooms: [
        // r1: T_ENTRY — 차수1, 문 E 1개
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
        // r2: T_HALL — 차수3, 문 W(r1)·E(r3)·S(r4) → 상단 S문, 좌우 문
        // T_HALL 가로 회랑. W/E + 아래 변에 S문 추가
        {
          id: 'r2', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.....S.......#",
            "#.E...........#",
            "####D##########"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }, { type: 'shard_drifter', count: 1 }]
        },
        // r3: T_HALL — 차수2, 문 W(r2)·S(r5)
        {
          id: 'r3', template: 'T_HALL',
          grid: [
            "###############",
            "D.............#",
            "#.E.........E.#",
            "#.............#",
            "#.............#",
            "######D########"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r4: T_CORRIDOR — 차수3, 문 N(r2)·W(r6)·E(r7)
        {
          id: 'r4', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 1 }]
        },
        // r5: T_TREASURE — 차수1, 문 N(r3)
        {
          id: 'r5', template: 'T_TREASURE',
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
        // r6: T_SECRET — 차수1, 문 E(r4), gimmick: straight_footprints
        {
          id: 'r6', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "#.....D",
            "#.....#",
            "#######"
          ],
          spawns: [],
          gimmick: 'straight_footprints'
        },
        // r7: T_SMALL — 차수1, 문 W(r4)
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
          spawns: [{ type: 'shard_drifter', count: 1 }]
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r4', to: 'r7' }
      ],
      special: { secret: 'r6', treasure: 'r5' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 22층 — darter 본격 (긴 회랑 돌진)
    // 방 8개: T_ENTRY / T_HALL×2 / T_ARENA / T_CORRIDOR / T_TREASURE / T_SECRET / T_SMALL
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r3→r6, r4→r7, r5→r8
    // 차도: r1=1, r2=3, r3=3, r4=1, r5=2, r6=1, r7=1, r8=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-22', region: 'region-03', theme: 'footprint-hall',
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
        // r2: T_HALL 차수3 문W(r1)·E(r3)·S(r4)
        {
          id: 'r2', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.....S.......#",
            "#.............#",
            "####D##########"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r3: T_HALL 차수3 문W(r2)·E(r5)·S(r6)
        {
          id: 'r3', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E...........#",
            "####D##########"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
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
          spawns: [{ type: 'shard_darter', count: 1 }]
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
          spawns: [{ type: 'shard_darter', count: 2 }]
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
        // r7: T_SMALL 차수1 문E(r2... 수정: r4 차수1이므로 r4→r7)
        // r4 차수1(문N), r7 차수1(문W) — 별도 간선이 필요 없음
        // 재설계: r4→r7 추가, r4 차수2로 변경 → 문 2개 필요
        // 대신 단순하게: graph r4→r7 포함, r4 문N+E, r7 문W
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
    // 23층 — 발자국 길잡이 분기
    // 방 8개: T_ENTRY / T_CROSS / T_HALL×2 / T_PILLARS / T_TREASURE / T_SECRET / T_CORRIDOR
    // graph: r1→r2, r2→r3, r2→r4, r2→r5, r3→r6, r4→r7, r5→r8
    // 차도: r1=1, r2=4, r3=2, r4=2, r5=2, r6=1, r7=1, r8=1
    // T_CROSS 4방향문 → 차수4
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-23', region: 'region-03', theme: 'footprint-hall',
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
        // r2: T_CROSS 차수4 문N(r5)·S(r3)·W(r1... 아니, r1→r2이므로 W)·E(r4)
        // T_CROSS: N/S/W/E 4문 → 차수4
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
        // r3: T_HALL 차수2 문N(r2)·E(r6)
        {
          id: 'r3', template: 'T_HALL',
          grid: [
            "###D###########",
            "D.............#",
            "#.E.........E.#",
            "#.............#",
            "#.............#",
            "###############"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r4: T_HALL 차수2 문W(r2)·S(r7)
        {
          id: 'r4', template: 'T_HALL',
          grid: [
            "###############",
            "D.............#",
            "#.E.........E.#",
            "#.............#",
            "#.............#",
            "######D########"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r5: T_PILLARS 차수2 문S(r2)·E(r8)
        {
          id: 'r5', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_darter', count: 1 }]
        },
        // r6: T_SECRET 차수1 문W(r3)
        {
          id: 'r6', template: 'T_SECRET',
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
        // r7: T_CORRIDOR 차수1 문N(r4)
        {
          id: 'r7', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "#.....#",
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
    // 24층 — 교차 회랑 (직선 협공)
    // 방 8개: T_ENTRY / T_HALL×2 / T_CROSS / T_ARENA / T_TREASURE / T_SECRET / T_SMALL
    // graph: r1→r2, r2→r3, r3→r4, r3→r5, r4→r6, r4→r7, r5→r8
    // 차도: r1=1, r2=2, r3=3, r4=3, r5=2, r6=1, r7=1, r8=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-24', region: 'region-03', theme: 'footprint-hall',
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
        // r2: T_HALL 차수2 문W(r1)·E(r3)
        {
          id: 'r2', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.............#",
            "###############"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r3: T_CROSS 차수3 문W(r2)·E(r5)·S(r4)
        // 4방향 T_CROSS에서 N문 닫아 차수3 → N 위치를 '#'으로
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
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r4: T_HALL 차수3 문N(r3)·E(r6)·W(r7)
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
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r6: T_SECRET 차수1 문W(r4)
        {
          id: 'r6', template: 'T_SECRET',
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
        // r7: T_SMALL 차수1 문E(r4)
        {
          id: 'r7', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "#.E.E.D",
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
        { from: 'r3', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' }
      ],
      special: { secret: 'r6', treasure: 'r8' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 25층 — 기둥 회랑 (돌진 차단)
    // 방 8개: T_ENTRY / T_PILLARS×2 / T_HALL / T_ARENA / T_SMALL / T_TREASURE / T_SECRET
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r4→r7, r6→r8
    // 차도: r1=1, r2=3, r3=2, r4=3, r5=1, r6=2, r7=1, r8=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-25', region: 'region-03', theme: 'footprint-hall',
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
        // r2: T_PILLARS 차수3 문W(r1)·E(r3)·S(r4)
        {
          id: 'r2', template: 'T_PILLARS',
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
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r3: T_HALL 차수2 문W(r2)·S(r5)
        {
          id: 'r3', template: 'T_HALL',
          grid: [
            "###############",
            "D.............#",
            "#.E.........E.#",
            "#.............#",
            "#.............#",
            "######D########"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r4: T_PILLARS 차수3 문N(r2)·E(r6)·W(r7)
        {
          id: 'r4', template: 'T_PILLARS',
          grid: [
            "###D#########",
            "#...........#",
            "#.P..E..E.P.#",
            "D...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r5: T_TREASURE 차수1 문N(r3)
        {
          id: 'r5', template: 'T_TREASURE',
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
        // r6: T_ARENA 차수2 문W(r4)·S(r8)
        {
          id: 'r6', template: 'T_ARENA',
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
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r7: T_SMALL 차수1 문E(r4)
        {
          id: 'r7', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "#.E.E.D",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_darter', count: 1 }]
        },
        // r8: T_TREASURE 차수1 문N(r6) — secret이 없으므로 T_SECRET 추가 필요
        // r8을 T_SECRET으로 변경, r9를 T_TREASURE로... 방 8개 한계
        // r8: T_SECRET 차수1 문N(r6), 별도 r9 없이 special.treasure를 r5(T_CORRIDOR)로?
        // 아니면 r5를 T_TREASURE로 바꾸고 r8을 T_SECRET으로 — 재구성
        // r5: T_TREASURE(차수1 문N), r8: T_SECRET(차수1 문N(r6))
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
        { from: 'r4', to: 'r7' },
        { from: 'r6', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r5' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 26층 — 좁은 회랑 연쇄
    // 방 8개: T_ENTRY / T_CORRIDOR×2 / T_HALL×2 / T_SMALL / T_TREASURE / T_SECRET
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7, r6→r8
    // 차도: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=1, r8=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-26', region: 'region-03', theme: 'footprint-hall',
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
        // r2: T_HALL 차수3 문W(r1)·E(r3)·S(r4)
        {
          id: 'r2', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.............#",
            "######D########"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r3: T_CORRIDOR 차수2 문W(r2)·S(r5)
        {
          id: 'r3', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....#",
            "#.....#",
            "#..E..#",
            "#.....#",
            "###D###"
          ],
          spawns: [{ type: 'shard_darter', count: 1 }]
        },
        // r4: T_CORRIDOR 차수2 문N(r2)·E(r6)
        {
          id: 'r4', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "#.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 1 }]
        },
        // r5: T_HALL 차수2 문N(r3)·E(r7)
        {
          id: 'r5', template: 'T_HALL',
          grid: [
            "###D###########",
            "D.............#",
            "#.E.........E.#",
            "#.............#",
            "#.............#",
            "###############"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
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
          spawns: [{ type: 'shard_darter', count: 1 }]
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
    // 27층 — 개활+회랑 혼합
    // 방 9개: T_ENTRY / T_ARENA×2 / T_HALL×2 / T_PILLARS / T_SMALL / T_TREASURE / T_SECRET
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r3→r6, r4→r7, r5→r8, r6→r9
    // 차도: r1=1, r2=3, r3=3, r4=2, r5=2, r6=2, r7=1, r8=1, r9=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-27', region: 'region-03', theme: 'footprint-hall',
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
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r3: T_HALL 차수3 문W(r2)·E(r5)·S(r6)
        {
          id: 'r3', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.............#",
            "######D########"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
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
          spawns: [{ type: 'shard_darter', count: 2 }]
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
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r6: T_HALL 차수2 문N(r3)·E(r9)
        {
          id: 'r6', template: 'T_HALL',
          grid: [
            "###D###########",
            "D.............#",
            "#.E.........E.#",
            "#.............#",
            "#.............#",
            "###############"
          ],
          spawns: [{ type: 'shard_drifter', count: 1 }]
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
    // 28층 — 밀집 돌진 러시 (지역 최고난도)
    // 방 9개: T_ENTRY / T_HALL×3 / T_ARENA / T_PILLARS / T_TREASURE / T_SECRET / T_SMALL
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r3→r6, r4→r7, r5→r8, r6→r9
    // 차도: r1=1, r2=3, r3=3, r4=2, r5=2, r6=2, r7=1, r8=1, r9=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-28', region: 'region-03', theme: 'footprint-hall',
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
        // r2: T_HALL 차수3 문W(r1)·E(r3)·S(r4)
        {
          id: 'r2', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E...........#",
            "######D########"
          ],
          spawns: [{ type: 'shard_darter', count: 3 }]
        },
        // r3: T_HALL 차수3 문W(r2)·E(r5)·S(r6)
        {
          id: 'r3', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.............#",
            "#.E...........#",
            "######D########"
          ],
          spawns: [{ type: 'shard_darter', count: 3 }]
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
          spawns: [{ type: 'shard_darter', count: 2 }]
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
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r6: T_HALL 차수2 문N(r3)·W(r9)
        {
          id: 'r6', template: 'T_HALL',
          grid: [
            "###D###########",
            "D.............#",
            "#.E.........E.#",
            "#.............#",
            "#.............#",
            "###############"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
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
        // r9: T_SECRET 차수1 문E(r6)
        {
          id: 'r9', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "#.....D",
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
    // 29층 — splitter 맛보기 + 정비
    // 방 8개: T_ENTRY / T_ARENA / T_REST / T_HALL / T_SMALL / T_TREASURE / T_SECRET / T_CORRIDOR
    // graph: r1→r2, r2→r3, r2→r4, r3→r5, r4→r6, r5→r7, r6→r8
    // 차도: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=1, r8=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-29', region: 'region-03', theme: 'footprint-hall',
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
            "#...E.......#",
            "#...........#",
            "######D######"
          ],
          spawns: [{ type: 'shard_darter', count: 2 }]
        },
        // r3: T_HALL 차수2 문W(r2)·S(r5)
        {
          id: 'r3', template: 'T_HALL',
          grid: [
            "###############",
            "D.............#",
            "#.E.........E.#",
            "#.............#",
            "#.............#",
            "######D########"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
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
        // r5: T_SMALL 차수2 문N(r3)·E(r7)
        {
          id: 'r5', template: 'T_SMALL',
          grid: [
            "###D###",
            "#.....#",
            "#.E.E.D",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }]
        },
        // r6: T_CORRIDOR 차수2 문W(r4)·S(r8)
        {
          id: 'r6', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....#",
            "#.....#",
            "#..E..#",
            "#.....#",
            "###D###"
          ],
          spawns: [{ type: 'shard_darter', count: 1 }]
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
    // 30층 — 보스: 회랑 끝의 문지기 응어리 (boss_hallwarden)
    // 방 2개: T_ENTRY / T_BOSS(+X)
    // graph: b1→b2, 차도: b1=1, b2=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-30', region: 'region-03', theme: 'footprint-hall',
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
          spawns: [{ type: 'boss_hallwarden', count: 1 }]
        }
      ],
      graph: [{ from: 'b1', to: 'b2' }],
      special: { boss: 'b2' }
    }

  ];

  g.POP_FLOORS_R03 = FLOORS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { FLOORS: FLOORS };
})(typeof window !== 'undefined' ? window : globalThis);
