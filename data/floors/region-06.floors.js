/* ============================================================================
 * region-06 floors — 속삭이는 수정굴 (51~60층)
 * ----------------------------------------------------------------------------
 * 사양서: .omc/plans/floors-design/region-06.md
 * 바이옴: whisper-crystal — 빛나는 수정 동굴, 작아지는 메아리
 * 드랍 편향: skill·energy (기력/스킬 자원 장비)
 * 보스(60층): boss_sobbingfacet 「수정 속 흐느끼는 응어리」 hp 200, patterns ['fan','aimed3','walls']
 * 별이 흔적 기믹: fading_note (51층 막간 S4)
 * ==========================================================================*/
(function (g) {
  'use strict';

  var FLOORS = [

    /* ──────────────────────────────────────────────────────────────────────
     * 51층 — 막간 S4: 작아지는 소리 (별이 흔적: fading_note)
     * 방 8: T_ENTRY / T_ARENA / T_PILLARS×2 / T_TREASURE / T_SECRET(fading_note) / T_SMALL / T_CORRIDOR
     * 전투방 5, 특수방 3
     * graph: r1→r2, r2→r3, r3→r4, r4→r5, r5→r6(비밀), r4→r7, r7→r8
     * 차수: r1=1, r2=2, r3=2, r4=3, r5=2, r6=1, r7=2, r8=1
     * ──────────────────────────────────────────────────────────────────── */
    {
      id: 'floor-51', region: 'region-06', theme: 'whisper-crystal',
      rooms: [
        // r1: T_ENTRY — 차수1
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: [] },

        // r2: T_ARENA — 차수2(W,E) — 수정굴 입구
        { id: 'r2', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D.....S.....D",
            "#...........#",
            "#...........#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r3: T_PILLARS — 차수2(W,E) — 수정 기둥 사이
        { id: 'r3', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P.........#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r4: T_PILLARS — 차수3(W,E,S) — 수정 기둥 분기
        { id: 'r4', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P.........#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r5: T_TREASURE — 차수2(N,E) — 보물방
        { id: 'r5', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....D",
            "#.TTT.#",
            "#..T..#",
            "#.TTT.#",
            "#.....#",
            "#######"
          ],
          spawns: [] },

        // r6: T_SECRET(fading_note) — 차수1(W) — 별이 흔적 비밀방
        { id: 'r6', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [], gimmick: 'fading_note' },

        // r7: T_SMALL — 차수2(N,E)
        { id: 'r7', template: 'T_SMALL',
          grid: [
            "###D###",
            "#.....D",
            "#.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r8: T_CORRIDOR — 차수1(W)
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
          spawns: [{ type: 'shard_splitter', count: 1 }] }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' },
        { from: 'r5', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r7', to: 'r8' }
      ],
      special: { secret: 'r6', treasure: 'r5' }
    },

    /* ──────────────────────────────────────────────────────────────────────
     * 52층 — 수정 반사 미로
     * 방 9: T_ENTRY / T_PILLARS×2 / T_CROSS / T_ARENA / T_REST / T_TREASURE / T_SECRET / T_CORRIDOR
     * 전투방 6, 특수방 3
     * graph: r1→r2, r2→r3, r3→r4, r4→r5, r4→r6, r4→r7, r6→r8, r5→r9
     * 차수: r1=1, r2=2, r3=2, r4=4, r5=2, r6=2, r7=1, r8=1, r9=1
     * (T_CROSS 차수4)
     * ──────────────────────────────────────────────────────────────────── */
    {
      id: 'floor-52', region: 'region-06', theme: 'whisper-crystal',
      rooms: [
        // r1: T_ENTRY — 차수1
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: [] },

        // r2: T_PILLARS — 차수2(W,E)
        { id: 'r2', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P.........#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r3: T_PILLARS — 차수2(W,E)
        { id: 'r3', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P.........#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r4: T_CROSS — 차수4(N,S,W,E) — 수정 미로 교차로
        { id: 'r4', template: 'T_CROSS',
          grid: [
            "####D####",
            "#.......#",
            "#..E.E..#",
            "D...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r5: T_ARENA — 차수2(N,E)
        { id: 'r5', template: 'T_ARENA',
          grid: [
            "####D####",
            "#.......#",
            "#.E...E.#",
            "#...S...D",
            "#.......#",
            "#########"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r6: T_REST — 차수2(S,E) — 자원 회복
        { id: 'r6', template: 'T_REST',
          grid: [
            "#######",
            "#.....D",
            "#..T..#",
            "#.....#",
            "###D###"
          ],
          spawns: [] },

        // r7: T_CORRIDOR — 차수1(N)
        { id: 'r7', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "#.....#",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r8: T_TREASURE — 차수1(W)
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
          spawns: [] },

        // r9: T_SECRET — 차수1(W)
        { id: 'r9', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [], gimmick: 'star_trace' }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r4', to: 'r7' },
        { from: 'r6', to: 'r8' },
        { from: 'r5', to: 'r9' }
      ],
      special: { secret: 'r9', treasure: 'r8' }
    },

    /* ──────────────────────────────────────────────────────────────────────
     * 53층 — 메아리 증식 방
     * 방 9: T_ENTRY / T_ARENA×2 / T_PILLARS / T_PITROOM / T_SMALL / T_TREASURE / T_SECRET / T_CORRIDOR
     * 전투방 7, 특수방 2
     * graph: r1→r2, r2→r3, r2→r4, r4→r5, r5→r6, r6→r7, r7→r8, r3→r9
     * 차수: r1=1, r2=3, r3=2, r4=2, r5=2, r6=2, r7=2, r8=1, r9=1
     * ──────────────────────────────────────────────────────────────────── */
    {
      id: 'floor-53', region: 'region-06', theme: 'whisper-crystal',
      rooms: [
        // r1: T_ENTRY — 차수1
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: [] },

        // r2: T_ARENA — 차수3(W,E,S) — 메아리 첫 방
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
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r3: T_CORRIDOR — 차수2(N,E)
        { id: 'r3', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "#.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r4: T_ARENA — 차수2(N,E)
        { id: 'r4', template: 'T_ARENA',
          grid: [
            "####D####",
            "#.......#",
            "#.E...E.#",
            "#...S...D",
            "#.......#",
            "#########"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r5: T_PILLARS — 차수2(W,E)
        { id: 'r5', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P.........#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r6: T_PITROOM — 차수2(W,E)
        { id: 'r6', template: 'T_PITROOM',
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
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r7: T_SMALL — 차수2(W,E)
        { id: 'r7', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.D",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r8: T_TREASURE — 차수1(W)
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
          spawns: [] },

        // r9: T_SECRET — 차수1(W)
        { id: 'r9', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [], gimmick: 'star_trace' }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r4' },
        { from: 'r4', to: 'r5' },
        { from: 'r5', to: 'r6' },
        { from: 'r6', to: 'r7' },
        { from: 'r7', to: 'r8' },
        { from: 'r3', to: 'r9' }
      ],
      special: { secret: 'r9', treasure: 'r8' }
    },

    /* ──────────────────────────────────────────────────────────────────────
     * 54층 — 글로우 회랑
     * 방 9: T_ENTRY / T_HALL×2 / T_PILLARS / T_ARENA / T_SMALL / T_TREASURE / T_SECRET / (임의추가: T_CORRIDOR)
     * 전투방 7, 특수방 2
     * graph: r1→r2, r2→r3, r3→r4, r4→r5, r5→r6, r5→r7, r6→r8, r7→r9
     * 차수: r1=1, r2=2, r3=2, r4=2, r5=3, r6=2, r7=2, r8=1, r9=1
     * ──────────────────────────────────────────────────────────────────── */
    {
      id: 'floor-54', region: 'region-06', theme: 'whisper-crystal',
      rooms: [
        // r1: T_ENTRY — 차수1
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: [] },

        // r2: T_HALL — 차수2(W,E) — 글로우 회랑 1부
        { id: 'r2', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.....S.......#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r3: T_PILLARS — 차수2(W,E) — 수정 기둥 사이
        { id: 'r3', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P.........#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r4: T_HALL — 차수2(W,E) — 글로우 회랑 2부
        { id: 'r4', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.....S.......#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r5: T_ARENA — 차수3(W,E,S)
        { id: 'r5', template: 'T_ARENA',
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
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r6: T_SMALL — 차수2(N,E)
        { id: 'r6', template: 'T_SMALL',
          grid: [
            "###D###",
            "#.....D",
            "#.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r7: T_SMALL — 차수2(N,E)
        { id: 'r7', template: 'T_SMALL',
          grid: [
            "###D###",
            "#.....D",
            "#.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r8: T_TREASURE — 차수1(W)
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
          spawns: [] },

        // r9: T_SECRET — 차수1(W)
        { id: 'r9', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [], gimmick: 'star_trace' }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' },
        { from: 'r5', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r6', to: 'r8' },
        { from: 'r7', to: 'r9' }
      ],
      special: { secret: 'r9', treasure: 'r8' }
    },

    /* ──────────────────────────────────────────────────────────────────────
     * 55층 — 좁은 수정 협곡
     * 방 9: T_ENTRY / T_CORRIDOR×2 / T_PILLARS×2 / T_ARENA / T_SMALL / T_TREASURE / T_SECRET
     * 전투방 7, 특수방 2
     * graph: r1→r2, r2→r3, r3→r4, r4→r5, r5→r6, r6→r7, r7→r8, r5→r9
     * 차수: r1=1, r2=2, r3=2, r4=2, r5=3, r6=2, r7=2, r8=1, r9=1
     * ──────────────────────────────────────────────────────────────────── */
    {
      id: 'floor-55', region: 'region-06', theme: 'whisper-crystal',
      rooms: [
        // r1: T_ENTRY — 차수1
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: [] },

        // r2: T_CORRIDOR — 차수2(W,E) — 좁은 협곡 통로
        { id: 'r2', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r3: T_PILLARS — 차수2(W,E) — 수정 기둥 협곡
        { id: 'r3', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P.........#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r4: T_CORRIDOR — 차수2(W,E) — 협곡 2
        { id: 'r4', template: 'T_CORRIDOR',
          grid: [
            "#######",
            "D.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r5: T_PILLARS — 차수3(W,E,S)
        { id: 'r5', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r6: T_ARENA — 차수2(N,E)
        { id: 'r6', template: 'T_ARENA',
          grid: [
            "####D####",
            "#.......#",
            "#.E...E.#",
            "#...S...D",
            "#.......#",
            "#########"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r7: T_SMALL — 차수2(W,E)
        { id: 'r7', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.D",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r8: T_TREASURE — 차수1(W)
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
          spawns: [] },

        // r9: T_SECRET — 차수1(N)
        { id: 'r9', template: 'T_SECRET',
          grid: [
            "###D###",
            "#.....#",
            "#..T..#",
            "#.....#",
            "#######"
          ],
          spawns: [], gimmick: 'star_trace' }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' },
        { from: 'r5', to: 'r6' },
        { from: 'r6', to: 'r7' },
        { from: 'r7', to: 'r8' },
        { from: 'r5', to: 'r9' }
      ],
      special: { secret: 'r9', treasure: 'r8' }
    },

    /* ──────────────────────────────────────────────────────────────────────
     * 56층 — 수정 함정 (반사 탄, 시그니처 미니 챌린지)
     * 방 9: T_ENTRY / T_PILLARS×2 / T_ARENA / T_HALL / T_SMALL / T_TREASURE / T_SECRET / T_CORRIDOR
     * 전투방 7, 특수방 2
     * graph: r1→r2, r2→r3, r3→r4, r4→r5, r5→r6, r5→r7, r6→r8, r7→r9
     * 차수: r1=1, r2=2, r3=2, r4=2, r5=3, r6=2, r7=2, r8=1, r9=1
     * ──────────────────────────────────────────────────────────────────── */
    {
      id: 'floor-56', region: 'region-06', theme: 'whisper-crystal',
      rooms: [
        // r1: T_ENTRY — 차수1
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: [] },

        // r2: T_PILLARS — 차수2(W,E) — 수정 반사 시작
        { id: 'r2', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P.........#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r3: T_HALL — 차수2(W,E) — 글로우 좁은 통로
        { id: 'r3', template: 'T_HALL',
          grid: [
            "###############",
            "D.............D",
            "#.E.........E.#",
            "#.....S.......#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r4: T_PILLARS — 차수2(W,E) — 수정 기둥 반사 함정 (좁은 안전 통로)
        { id: 'r4', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P.P.E.P.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P.P.E.P.P.#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r5: T_ARENA — 차수3(W,E,S)
        { id: 'r5', template: 'T_ARENA',
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
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r6: T_SMALL — 차수2(N,E)
        { id: 'r6', template: 'T_SMALL',
          grid: [
            "###D###",
            "#.....D",
            "#.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r7: T_CORRIDOR — 차수2(N,E)
        { id: 'r7', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "#.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r8: T_TREASURE — 차수1(W)
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
          spawns: [] },

        // r9: T_SECRET — 차수1(W)
        { id: 'r9', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [], gimmick: 'star_trace' }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' },
        { from: 'r5', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r6', to: 'r8' },
        { from: 'r7', to: 'r9' }
      ],
      special: { secret: 'r9', treasure: 'r8' }
    },

    /* ──────────────────────────────────────────────────────────────────────
     * 57층 — 다분기 수정 미로
     * 방 9: T_ENTRY / T_CROSS×2 / T_PILLARS / T_ARENA / T_CORRIDOR / T_TREASURE / T_SECRET / T_SMALL
     * 전투방 7, 특수방 2
     * graph: r1→r2, r2→r3, r2→r4, r2→r5, r3→r6, r6→r7, r7→r8, r5→r9
     * 차수: r1=1, r2=4, r3=2, r4=1, r5=2, r6=2, r7=2, r8=1, r9=1
     * (T_CROSS 차수4: N,S,W,E)
     * ──────────────────────────────────────────────────────────────────── */
    {
      id: 'floor-57', region: 'region-06', theme: 'whisper-crystal',
      rooms: [
        // r1: T_ENTRY — 차수1
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: [] },

        // r2: T_CROSS — 차수4(N,S,W,E) — 수정 미로 분기
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
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r3: T_PILLARS — 차수2(S,E)
        { id: 'r3', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "#...........D",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r4: T_SMALL — 차수1(N) — 막다른 소형
        { id: 'r4', template: 'T_SMALL',
          grid: [
            "###D###",
            "#.....#",
            "#.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r5: T_CROSS — 차수2(S,E)
        { id: 'r5', template: 'T_CROSS',
          grid: [
            "#########",
            "#.......#",
            "#..E.E..#",
            "#...S...D",
            "#..E.E..#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r6: T_ARENA — 차수2(N,E)
        { id: 'r6', template: 'T_ARENA',
          grid: [
            "####D####",
            "#.......#",
            "#.E...E.#",
            "#...S...D",
            "#.......#",
            "#########"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r7: T_CORRIDOR — 차수2(W,E)
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
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r8: T_TREASURE — 차수1(W)
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
          spawns: [] },

        // r9: T_SECRET — 차수1(N)
        { id: 'r9', template: 'T_SECRET',
          grid: [
            "###D###",
            "#.....#",
            "#..T..#",
            "#.....#",
            "#######"
          ],
          spawns: [], gimmick: 'star_trace' }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r4' },
        { from: 'r2', to: 'r5' },
        { from: 'r3', to: 'r6' },
        { from: 'r6', to: 'r7' },
        { from: 'r7', to: 'r8' },
        { from: 'r5', to: 'r9' }
      ],
      special: { secret: 'r9', treasure: 'r8' }
    },

    /* ──────────────────────────────────────────────────────────────────────
     * 58층 — 증식 대군 클라이맥스 (splitter의 마지막 대규모)
     * 방 10: T_ENTRY / T_ARENA×3 / T_PILLARS×2 / T_HALL / T_SMALL / T_TREASURE / T_SECRET
     * 전투방 8, 특수방 2
     * graph: r1→r2, r2→r3, r2→r4, r4→r5, r5→r6, r6→r7, r7→r8, r4→r9, r3→r10
     * 차수: r1=1, r2=3, r3=2, r4=3, r5=2, r6=2, r7=2, r8=1, r9=1, r10=1
     * ──────────────────────────────────────────────────────────────────── */
    {
      id: 'floor-58', region: 'region-06', theme: 'whisper-crystal',
      rooms: [
        // r1: T_ENTRY — 차수1
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: [] },

        // r2: T_ARENA — 차수3(W,E,S) — 대군 첫 파도
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
          spawns: [{ type: 'shard_splitter', count: 4 }] },

        // r3: T_HALL — 차수2(N,E) — 대군 회랑
        { id: 'r3', template: 'T_HALL',
          grid: [
            "###D###########",
            "#.............D",
            "#.E.........E.#",
            "#.....S.......#",
            "#.E.........E.#",
            "###############"
          ],
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r4: T_ARENA — 차수3(N,E,S) — 대군 2파
        { id: 'r4', template: 'T_ARENA',
          grid: [
            "####D####",
            "#.......#",
            "#.E...E.#",
            "#...S...D",
            "#.E...E.#",
            "#.......#",
            "####D####"
          ],
          spawns: [{ type: 'shard_splitter', count: 4 }] },

        // r5: T_PILLARS — 차수2(W,E)
        { id: 'r5', template: 'T_PILLARS',
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
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r6: T_ARENA — 차수2(W,E)
        { id: 'r6', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D.....S.....D",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r7: T_PILLARS — 차수2(W,E)
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
          spawns: [{ type: 'shard_splitter', count: 3 }] },

        // r8: T_SMALL — 차수1(W)
        { id: 'r8', template: 'T_SMALL',
          grid: [
            "#######",
            "#.....#",
            "D.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r9: T_TREASURE — 차수1(N)
        { id: 'r9', template: 'T_TREASURE',
          grid: [
            "###D###",
            "#.....#",
            "#.TTT.#",
            "#..T..#",
            "#.TTT.#",
            "#.....#",
            "#######"
          ],
          spawns: [] },

        // r10: T_SECRET — 차수1(W)
        { id: 'r10', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [], gimmick: 'star_trace' }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r2', to: 'r4' },
        { from: 'r4', to: 'r5' },
        { from: 'r5', to: 'r6' },
        { from: 'r6', to: 'r7' },
        { from: 'r7', to: 'r8' },
        { from: 'r4', to: 'r9' },
        { from: 'r3', to: 'r10' }
      ],
      special: { secret: 'r10', treasure: 'r9' }
    },

    /* ──────────────────────────────────────────────────────────────────────
     * 59층 — 보스 전 정비 (자원 회복)
     * 방 8: T_ENTRY / T_REST / T_ARENA / T_PILLARS / T_SMALL / T_TREASURE / T_SECRET / T_CORRIDOR
     * 전투방 5, 특수방 3
     * graph: r1→r2, r2→r3, r3→r4, r4→r5, r4→r6, r5→r7, r6→r8
     * 차수: r1=1, r2=2, r3=2, r4=3, r5=2, r6=2, r7=1, r8=1
     * ──────────────────────────────────────────────────────────────────── */
    {
      id: 'floor-59', region: 'region-06', theme: 'whisper-crystal',
      rooms: [
        // r1: T_ENTRY — 차수1
        { id: 'r1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: [] },

        // r2: T_REST — 차수2(W,E) — 기력/HP 회복
        { id: 'r2', template: 'T_REST',
          grid: [
            "#######",
            "#.....#",
            "D..T..D",
            "#.....#",
            "#######"
          ],
          spawns: [] },

        // r3: T_ARENA — 차수2(W,E)
        { id: 'r3', template: 'T_ARENA',
          grid: [
            "#############",
            "#...........#",
            "#...E...E...#",
            "#...........#",
            "D.....S.....D",
            "#...........#",
            "#...........#",
            "#...........#",
            "#############"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r4: T_PILLARS — 차수3(W,E,S)
        { id: 'r4', template: 'T_PILLARS',
          grid: [
            "#############",
            "#...........#",
            "#.P..E..E.P.#",
            "#...........#",
            "D...........D",
            "#...........#",
            "#.P.........#",
            "#...........#",
            "####D########"
          ],
          spawns: [{ type: 'shard_splitter', count: 2 }] },

        // r5: T_CORRIDOR — 차수2(N,E)
        { id: 'r5', template: 'T_CORRIDOR',
          grid: [
            "###D###",
            "#.....D",
            "#.....#",
            "#..E..#",
            "#.....#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r6: T_SMALL — 차수2(N,E)
        { id: 'r6', template: 'T_SMALL',
          grid: [
            "###D###",
            "#.....D",
            "#.E.E.#",
            "#.....#",
            "#######"
          ],
          spawns: [{ type: 'shard_splitter', count: 1 }] },

        // r7: T_TREASURE — 차수1(W)
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
          spawns: [] },

        // r8: T_SECRET — 차수1(W)
        { id: 'r8', template: 'T_SECRET',
          grid: [
            "#######",
            "#.....#",
            "#..T..#",
            "D.....#",
            "#.....#",
            "#######"
          ],
          spawns: [], gimmick: 'star_trace' }
      ],
      graph: [
        { from: 'r1', to: 'r2' },
        { from: 'r2', to: 'r3' },
        { from: 'r3', to: 'r4' },
        { from: 'r4', to: 'r5' },
        { from: 'r4', to: 'r6' },
        { from: 'r5', to: 'r7' },
        { from: 'r6', to: 'r8' }
      ],
      special: { secret: 'r8', treasure: 'r7' }
    },

    /* ──────────────────────────────────────────────────────────────────────
     * 60층 — 보스: 수정 속 흐느끼는 응어리 (boss_sobbingfacet)
     * 방 2: T_ENTRY / T_BOSS(boss_sobbingfacet, X)
     * ──────────────────────────────────────────────────────────────────── */
    {
      id: 'floor-60', region: 'region-06', theme: 'whisper-crystal',
      rooms: [
        // b1: T_ENTRY — 차수1
        { id: 'b1', template: 'T_ENTRY',
          grid: [
            "#########",
            "#.......#",
            "#..S....#",
            "#.......D",
            "#.......#",
            "#########"
          ],
          spawns: [] },

        // b2: T_BOSS — 차수1(W) — boss_sobbingfacet, X 출구
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
          spawns: [{ type: 'boss_sobbingfacet', count: 1 }] }
      ],
      graph: [{ from: 'b1', to: 'b2' }],
      special: { boss: 'b2' }
    }

  ];

  g.POP_FLOORS_R06 = FLOORS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { FLOORS: FLOORS };
})(typeof window !== 'undefined' ? window : globalThis);
