/* ============================================================================
 * region-01 floors 데이터 — 이끼 낀 입구굴 (1~10층)
 * ----------------------------------------------------------------------------
 * P3-B1(#13) 산출물. 사양서: .omc/plans/floors-design/region-01.md
 * 포맷 참조: data/floors/templates.js · data/floors/region-01.sample.js
 * 검증: node tools/lint-floors.mjs data/floors/region-01.floors.js → error 0
 *
 * 핵심 규칙: 방의 grid 'D' 개수 = graph 인접 차수(무방향)
 * 브라우저: window.POP_FLOORS 배열에 push. Node: module.exports.FLOORS.
 * ==========================================================================*/
(function (g) {
  'use strict';

  var FLOORS = [

    // ══════════════════════════════════════════════════════════════════════
    // 1층 — 첫걸음 (막간: intro / 별이 흔적: torch_lit_intro)
    // 방 7: T_ENTRY(r1) / T_CORRIDOR(r2) / T_ARENA(r3) / T_SMALL(r4,r5) / T_TREASURE(r6) / T_SECRET(r7)
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r3-r6, r4-r7
    // 차수: r1=1, r2=2, r3=4(W E S N방향 D 4개), r4=2(N E), r5=1(W), r6=1(N), r7=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-01', region: 'region-01', theme: 'mossy-cave',
      rooms: [
        // r1 차수1: E변 D 1개
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
        // r2 차수2: W E 각 1개 = 2개
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
        // r3 차수4: W(r2) E(r5) S(r4하단) N(r6) — D 4개
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
        // r4 차수2: N(r3 S쪽) E(r7) — D 2개: 상단N + 우측E
        {
          id: 'r4', template: 'T_SMALL',
          grid: [
            "###D###",
            "#.....D",
            "#.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r5 차수1: W(r3 E) — D 1개
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
        // r6 T_TREASURE 차수1: S(r3 N) — D 1개 아래변
        {
          id: 'r6', template: 'T_TREASURE',
          grid: [
            "#########",
            "#.......#",
            "#..TTT..#",
            "#...T...#",
            "#..TTT..#",
            "#.......#",
            "####D####"
          ],
          spawns: []
        },
        // r7 T_SECRET 차수1: W(r4 E) — D 1개
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
          gimmick: 'torch_lit_intro'
        }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r3', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r4', to: 'r7' }
      ],
      special: { secret: 'r7', treasure: 'r6' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 2층 — 떠도는 조각과의 첫 교전
    // 방 7: T_ENTRY(r1) / T_CORRIDOR(r2) / T_ARENA(r3,r4) / T_SMALL(r5) / T_TREASURE(r6) / T_SECRET(r7)
    // graph edges: r1-r2, r2-r3, r3-r4, r3-r5, r3-r6, r4-r7
    // 차수: r1=1, r2=2, r3=4, r4=2, r5=1, r6=1, r7=1
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-02', region: 'region-01', theme: 'mossy-cave',
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
        // r3 차수4: W(r2) N(r7) E(r5) S(r4) 문 4개
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
        // r4 차수2: N(r3 S) E(r6) — D 2개: 상단N + 우측E
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
        // r5 차수1: E(r3 W반대=W쪽←) — D 1개
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
        // r6 T_TREASURE 차수1: W(r4 E) — D 1개
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
        // r7 T_SECRET 차수1: S(r3 N) — D 1개 아래변
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
        { from: 'r3', to: 'r5' },
        { from: 'r3', to: 'r7' },
        { from: 'r4', to: 'r6' }
      ],
      special: { secret: 'r7', treasure: 'r6' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 3층 — 기둥 엄폐 학습
    // 방 7: T_ENTRY(r1) / T_CORRIDOR(r2) / T_PILLARS(r3,r5) / T_SMALL(r4) / T_TREASURE(r6) / T_SECRET(r7)
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r3-r6, r5-r7
    // 차수: r1=1, r2=2, r3=4(W,S,E,N), r4=1(N), r5=2(W,E), r6=1(N), r7=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-03', region: 'region-01', theme: 'mossy-cave',
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
        // r3 T_PILLARS 차수4: W(r2) E(r5) N(r4) S(r6) 문 4개
        {
          id: 'r3', template: 'T_PILLARS',
          grid: [
            "####D####",
            "D.......D",
            "#.P.E.P.#",
            "#.......#",
            "#.P.E.P.#",
            "####D####"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r4 차수1: S(→r3 N) 문 1개
        {
          id: 'r4', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "#.E.E.#",
            "#.....#",
            "###D###"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r5 T_PILLARS 차수2: W(r3) E(r7) 문 2개
        {
          id: 'r5', template: 'T_PILLARS',
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
        // r6 T_TREASURE 차수1: N(→r3 S) 문 1개
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
        // r7 T_SECRET 차수1: W(r5) 문 1개
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
        { from: 'r3', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r5', to: 'r7' }
      ],
      special: { secret: 'r7', treasure: 'r6' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 4층 — 분기 (교차로 첫 등장)
    // 방 8: T_ENTRY(r1) / T_CORRIDOR(r2) / T_CROSS(r3) / T_ARENA(r4,r5) / T_SMALL(r6) / T_TREASURE(r7) / T_SECRET(r8)
    // graph: r1-r2, r2-r3(W), r3-r4(N), r3-r5(S), r3-r6(E), r5-r7, r6-r8
    // 차수: r1=1, r2=2, r3=4(W,N,S,E), r4=1(S), r5=2(N,E), r6=2(W,E), r7=1(W), r8=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-04', region: 'region-01', theme: 'mossy-cave',
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
        // r4 T_ARENA 차수1: S(→r3 N)
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
        // r6 T_SMALL 차수2: W(r3 E) E(r8)
        {
          id: 'r6', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.D",
            "#.....#",
            "#######"
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
    // 5층 — 좁은 통로 다수
    // 방 8: T_ENTRY(r1) / T_CORRIDOR(r2,r3) / T_ARENA(r4,r5) / T_PILLARS(r6) / T_TREASURE(r7) / T_SECRET(r8)
    // graph: r1-r2, r2-r3, r3-r4, r4-r5, r4-r6, r4-r7, r5-r8
    // 차수: r1=1, r2=2, r3=2, r4=4(W=r3,S=r5,E=r6,N=r7), r5=2(N=r4,E=r8), r6=1(W=r4), r7=1(S=r4), r8=1(W=r5)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-05', region: 'region-01', theme: 'mossy-cave',
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
        // r3 T_CORRIDOR 차수2: W(r2) E(r4)
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
        // r4 T_ARENA 차수4: W(r3) S(r5) E(r6) N(r7)
        {
          id: 'r4', template: 'T_ARENA',
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
        // r5 T_ARENA 차수2: N(r4 S) E(r8) — D 2개: 상단N + 우측E
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
        // r6 T_PILLARS 차수1: W(r4 E)
        {
          id: 'r6', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "D.....S.....#",
            "#.P..E..E.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
        },
        // r7 T_TREASURE 차수1: S(r4 N)
        {
          id: 'r7', template: 'T_TREASURE',
          grid: [
            "#########",
            "#.......#",
            "#..TTT..#",
            "#...T...#",
            "#..TTT..#",
            "#.......#",
            "####D####"
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
        { from: 'r4', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r5', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 6층 — 개활 아레나 본격
    // 방 8: T_ENTRY(r1) / T_CORRIDOR(r2) / T_ARENA(r3,r4,r5) / T_PILLARS(r6) / T_TREASURE(r7) / T_SECRET(r8)
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r3-r6, r4-r7, r5-r8
    // 차수: r1=1, r2=2, r3=4(W,E,S,N), r4=2(W,E), r5=2(S,E), r6=1(N), r7=1(W), r8=1(W)
    // r3 4문: W=r2, E=r4, S=r6, N=r5(위로 연결)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-06', region: 'region-01', theme: 'mossy-cave',
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
        // r4 T_ARENA 차수2: W(r3) E(r7)
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
        // r5 T_ARENA 차수2: S(r3 N) E(r8) — D 2개: 아래변S + 우측E
        // r3 N→r5이므로 r5의 아래변(S)에 D
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
          spawns: [{ type: 'shard_drifter', count: 2 }]
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
        // r7 T_TREASURE 차수1: W(r4)
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
        // r8 T_SECRET 차수1: W(r5)
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
    // 7층 — 구덩이 우회 전투
    // 방 8: T_ENTRY(r1) / T_CORRIDOR(r2) / T_PITROOM(r3) / T_ARENA(r4,r5) / T_PILLARS(r6) / T_TREASURE(r7) / T_SECRET(r8)
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r4-r6, r4-r7, r5-r8
    // 차수: r1=1, r2=2, r3=3(W,E,S), r4=3(W,E,S), r5=2(S,E), r6=1(W), r7=1(W), r8=1(W)
    // r3 3문: W=r2, E=r4, S=r5
    // r4 3문: W=r3, E=r7, S=r6
    // r5 2문: N=r3, E=r8
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-07', region: 'region-01', theme: 'mossy-cave',
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
        // r3 T_PITROOM 차수3: W(r2) E(r4) S(r5)
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
        // r5 T_ARENA 차수2: N(r3 S) E(r8) — D 2개: 상단N + 우측E
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
    // 8층 — darter 맛보기 (속도 압박 도입)
    // 방 8: T_ENTRY(r1) / T_CORRIDOR(r2) / T_ARENA(r3,r5) / T_HALL(r4) / T_PILLARS(r6) / T_TREASURE(r7) / T_SECRET(r8)
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r4-r6, r4-r7, r5-r8
    // 차수: r1=1, r2=2, r3=3(W,E,S), r4=3(W,E,S), r5=2(S,E), r6=1(N), r7=1(W), r8=1(W)
    // r3 3문: W=r2, E=r4, S=r5
    // r4 T_HALL 3문: W=r3, E=r7, S=r6
    // r5 2문: N=r3(S), E=r8
    // r6 1문: N=r4(S)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-08', region: 'region-01', theme: 'mossy-cave',
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
        // r4 T_HALL 차수3: W(r3) E(r7) S(r6)
        // T_HALL 기본은 W/E 2문 — S 문 추가하여 3문으로
        {
          id: 'r4', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.....S.......#",
            "#.E.........E.#",
            "####D##########"
          ],
          spawns: [
            { type: 'shard_drifter', count: 2 },
            { type: 'shard_darter', count: 2 }
          ]
        },
        // r5 T_ARENA 차수2: N(r3 S) E(r8) — D 2개: 상단N + 우측E
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
          spawns: [
            { type: 'shard_drifter', count: 1 },
            { type: 'shard_darter', count: 1 }
          ]
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
    // 9층 — 보스 전 정비
    // 방 8: T_ENTRY(r1) / T_CORRIDOR(r2) / T_ARENA(r3) / T_SMALL(r4,r5) / T_REST(r6) / T_TREASURE(r7) / T_SECRET(r8)
    // graph: r1-r2, r2-r3, r3-r4, r3-r5, r4-r6, r4-r7, r5-r8
    // 차수: r1=1, r2=2, r3=3(W,E,S), r4=3(W,E,S), r5=2(S,E), r6=1(N), r7=1(W), r8=1(W)
    // r3 3문: W=r2, E=r4, S=r5
    // r4 3문: W=r3, E=r7, S=r6
    // r5 2문: N=r3(S), E=r8
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-09', region: 'region-01', theme: 'mossy-cave',
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
        // r4 T_SMALL 차수3: W(r3) E(r7) S(r6)
        {
          id: 'r4', template: 'T_SMALL',
          grid: [
            "###D###",
            "D.....D",
            "#.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_drifter', count: 2 }]
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
          spawns: [
            { type: 'shard_drifter', count: 1 },
            { type: 'shard_darter', count: 1 }
          ]
        },
        // r6 T_REST 차수1: N(r4 S)
        {
          id: 'r6', template: 'T_REST',
          grid: [
            "###D###",
            "#.....#",
            "#..T..#",
            "#.....#",
            "#######"
          ],
          spawns: []
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
    // 10층 — 보스: 굴 어귀의 응어리 (boss_gateknot)
    // 방 2(보스층 예외): T_ENTRY(b1) / T_BOSS(b2)
    // graph: b1-b2
    // 차수: b1=1(E), b2=1(W)
    // ══════════════════════════════════════════════════════════════════════
    {
      id: 'floor-10', region: 'region-01', theme: 'mossy-cave',
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
          spawns: [{ type: 'boss_gateknot', count: 1 }]
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
