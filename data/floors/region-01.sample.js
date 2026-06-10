/* ============================================================================
 * region-01 floors 샘플 (포맷 참조 · lint-floors 자체 검증용 — Phase 3 양산 X)
 * ----------------------------------------------------------------------------
 * 이 파일은 floors 포맷의 *살아있는 참조*다. Phase 3 디자이너(region-NN.floors.js)는
 * 이 구조를 본떠 작성하고 node tools/lint-floors.mjs data/floors/region-NN.floors.js
 * 로 검증한다. 정식 100층 데이터는 Phase 3 lane(#13~#17)이 별도 파일로 채운다.
 *
 * 층 객체 스키마(단일 진실):
 *   { id, region, theme, rooms:[ {id, template, grid:[ASCII행...], spawns:[{type,count,at?}], gimmick?} ],
 *     graph:[ {from, to, door?} ], special:{ boss?, secret?, treasure?, shop?, event? } }
 *   - grid 문자: data/floors/templates.js GRID_LEGEND (# 벽 / . 바닥 / D 문 / S 스폰 / E 적 / X 출구 / T 보물 / P 기둥)
 *   - graph: 무방향 간선. 방의 문('D') 수 = 그 방의 graph 인접 차수(lint 강제).
 *   - 일반층: 방 6~10, 비밀방 ≥1, 보물방 정확히 1. 보스층: 보스방 + 출구 X.
 *
 * 브라우저: window.POP_FLOORS_R01_SAMPLE. Node: module.exports.FLOORS.
 * ==========================================================================*/
(function (g) {
  'use strict';

  var FLOORS = [
    {
      id: 'floor-01', region: 'region-01', theme: 'mossy-cave',
      rooms: [
        { id: 'r1', template: 'T_ENTRY',    grid: ["#######", "#.....#", "#..S..D", "#.....#", "#######"], spawns: [] },
        { id: 'r2', template: 'T_ARENA',    grid: ["###D###", "D.....D", "#.E.E.#", "#.....#", "#######"], spawns: [{ type: 'shard_drifter', count: 2 }] },
        { id: 'r3', template: 'T_SMALL',    grid: ["###D###", "#.....#", "#.E.E.#", "#.....#", "#######"], spawns: [{ type: 'shard_drifter', count: 2 }] },
        { id: 'r4', template: 'T_PILLARS',  grid: ["#######", "D.P.P.#", "#.....#", "#.P.P.#", "###D###"], spawns: [{ type: 'shard_darter', count: 1 }] },
        { id: 'r5', template: 'T_TREASURE', grid: ["#######", "#.....#", "D..T..#", "#.....#", "#######"], spawns: [] },
        { id: 'r6', template: 'T_SECRET',   grid: ["##D##", "#...#", "#.T.#", "#...#", "#####"], spawns: [], gimmick: 'torch_lit_intro' },
        { id: 'r7', template: 'T_CORRIDOR', grid: ["##D##", "D...D", "#.E.#", "#...#", "#####"], spawns: [{ type: 'shard_drifter', count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' }, { from: 'r2', to: 'r3' }, { from: 'r2', to: 'r7' },
        { from: 'r7', to: 'r4' }, { from: 'r7', to: 'r5' }, { from: 'r4', to: 'r6' }
      ],
      special: { secret: 'r6', treasure: 'r5' }
    },
    {
      id: 'floor-10', region: 'region-01', theme: 'mossy-cave',
      rooms: [
        { id: 'b1', template: 'T_ENTRY', grid: ["#######", "#.....#", "#..S..D", "#.....#", "#######"], spawns: [] },
        { id: 'b2', template: 'T_BOSS', grid: [
          "###############",
          "#.............#",
          "#.............#",
          "#......E......#",
          "#.............#",
          "D.....S......X#",
          "#.............#",
          "#.............#",
          "#.............#",
          "###############"
        ], spawns: [{ type: 'boss_gateknot', count: 1 }] }
      ],
      graph: [{ from: 'b1', to: 'b2' }],
      special: { boss: 'b2' }
    }
  ];

  g.POP_FLOORS_R01_SAMPLE = FLOORS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { FLOORS: FLOORS };
})(typeof window !== 'undefined' ? window : globalThis);
