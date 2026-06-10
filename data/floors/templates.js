/* ============================================================================
 * 팡팡 던전 — 방 템플릿 라이브러리 (level-designer 계약 · 플랜 §2.2·§4)
 * ----------------------------------------------------------------------------
 * 100층 핸드 디자인의 분량·룩 균일화 장치. 디자이너는 템플릿을 고르고 스폰·기믹만
 * 채운다. ASCII grid 가 방의 단일 진실 — lint-floors.mjs 와 던전 런타임(room.js)이
 * 같은 GRID_LEGEND·TILE 을 읽는다(드리프트 0).
 *
 * 셀 크기 TILE = 32px. room.bounds = cols*TILE × rows*TILE.
 * 카메라가 플레이어를 추적하므로 방은 화면(540×960)보다 클 수 있다.
 *
 * grid 문자 규약(GRID_LEGEND — lint·런타임 공유 단일 진실):
 *   '#' 벽   (콜라이더, non-walkable)
 *   '.' 바닥 (walkable)
 *   'D' 문   (walkable, 인접 방 연결점. 가장자리 위치로 방향 추론. graph edge 와 정합)
 *   'S' 스폰 (walkable, 플레이어 시작 — 방당 최대 1, 시작방 필수)
 *   'E' 적   (walkable, grid 상 적 위치 힌트 — spawns[] 와 보완)
 *   'X' 출구 (walkable, 다음 층 계단 — 보스/종료방)
 *   'T' 보물 (walkable, 보물 픽업 — 보물방)
 *   'P' 기둥 (콜라이더, non-walkable, '#'과 물리 동일·시각만 다름)
 *   ' ' 외부 (렌더 안 함, 방 경계 밖)
 *
 * 스파이크(worker-spike game/room.js)와 협의된 규약 — staticGroup 콜라이더는
 * WALL_CHARS('#','P')를 읽고, walkable 판정은 그 외 전부.
 *
 * 브라우저: window.POP_FLOOR_TEMPLATES 전역. Node: module.exports.FLOOR_TEMPLATES.
 * ==========================================================================*/
(function (g) {
  'use strict';

  // ── 공유 상수(lint·런타임 단일 진실) ──────────────────────────────────────
  var TILE = 32;
  var WALL_CHARS = ['#', 'P'];          // 콜라이더(non-walkable)
  var WALKABLE_CHARS = ['.', 'D', 'S', 'E', 'X', 'T']; // 이동 가능
  var GRID_LEGEND = {
    '#': { name: 'wall',    walkable: false, collider: true },
    'P': { name: 'pillar',  walkable: false, collider: true },
    '.': { name: 'floor',   walkable: true,  collider: false },
    'D': { name: 'door',    walkable: true,  collider: false },
    'S': { name: 'spawn',   walkable: true,  collider: false },
    'E': { name: 'enemy',   walkable: true,  collider: false },
    'X': { name: 'exit',    walkable: true,  collider: false },
    'T': { name: 'treasure',walkable: true,  collider: false },
    ' ': { name: 'void',    walkable: false, collider: false }
  };

  // ── 방 템플릿 14종 ─────────────────────────────────────────────────────────
  // 각 템플릿: { id, kind, role, grid, doors:[방향], desc }
  // kind: combat/transit/special/boss. role: 디자인 의도(체크리스트 정합).
  // grid 는 벽 폐합(테두리 '#')을 기본 — 'D' 가 뚫린 출입구. 디자이너는 'D'/스폰을
  // 그래프에 맞춰 조정한다. 모든 템플릿은 벽 폐합 + walkable 연결을 보장.
  var TEMPLATES = [
    {
      id: 'T_ARENA', kind: 'combat', role: '개활 전투 — 사방 적, 회피 공간',
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
      doors: ['W', 'E'], desc: '기본 전투 방. 넓고 장애물 없음.'
    },
    {
      id: 'T_CORRIDOR', kind: 'transit', role: '연결 통로 — 좁고 길다',
      grid: [
        "#######",
        "D.....D",
        "#.....#",
        "#..E..#",
        "#.....#",
        "#.....#",
        "D.....D",
        "#######"
      ],
      doors: ['W', 'E'], desc: '방을 잇는 통로. 양끝/십자 문.'
    },
    {
      id: 'T_PILLARS', kind: 'combat', role: '엄폐 전투 — 기둥 사이 탄막 회피',
      grid: [
        "#############",
        "#...........#",
        "#.P..E..E.P.#",
        "#...........#",
        "D.....S.....D",
        "#...........#",
        "#.P..E..E.P.#",
        "#...........#",
        "#############"
      ],
      doors: ['W', 'E'], desc: '기둥(P)으로 엄폐 가능한 전투 방.'
    },
    {
      id: 'T_HALL', kind: 'combat', role: '긴 회랑 전투 — region-03 곧은 발자국 정합',
      grid: [
        "###############",
        "D.............D",
        "#.E.........E.#",
        "#.....S.......#",
        "#.E.........E.#",
        "D.............D",
        "###############"
      ],
      doors: ['W', 'E'], desc: '가로로 긴 전투 회랑.'
    },
    {
      id: 'T_CROSS', kind: 'combat', role: '교차로 — 4방향 문, 분기 허브',
      grid: [
        "####D####",
        "#.......#",
        "#..E.E..#",
        "D...S...D",
        "#..E.E..#",
        "#.......#",
        "####D####"
      ],
      doors: ['N', 'S', 'W', 'E'], desc: '사거리 교차로. 미로 분기점.'
    },
    {
      id: 'T_SMALL', kind: 'combat', role: '소형 전투 — 빠른 클리어',
      grid: [
        "#######",
        "#.....#",
        "D.E.E.D",
        "#..S..#",
        "#.....#",
        "#######"
      ],
      doors: ['W', 'E'], desc: '작은 전투 방. 난이도 낮은 층.'
    },
    {
      id: 'T_PITROOM', kind: 'combat', role: '구덩이 방 — 중앙 기둥군, 우회 전투',
      grid: [
        "#############",
        "#...........#",
        "#..PPPPP....#",
        "D..P...P..S.D",
        "#..P.E.P....#",
        "#..PPPPP....#",
        "#...........#",
        "#############"
      ],
      doors: ['W', 'E'], desc: '중앙 구덩이(기둥 벽)를 끼고 도는 방.'
    },
    {
      id: 'T_ENTRY', kind: 'transit', role: '시작방 — 플레이어 진입, 적 없음',
      grid: [
        "#########",
        "#.......#",
        "#..S....#",
        "#.......D",
        "#.......#",
        "#########"
      ],
      doors: ['E'], desc: '층 시작방. 스폰만, 적 없음(안전 진입).'
    },
    {
      id: 'T_TREASURE', kind: 'special', role: '보물방 — 확정 아이템(T)',
      grid: [
        "#########",
        "#.......#",
        "#..TTT..#",
        "D...T...D",
        "#..TTT..#",
        "#.......#",
        "#########"
      ],
      doors: ['W', 'E'], desc: '보물(T) 확정. 층당 1개(체크리스트).'
    },
    {
      id: 'T_SECRET', kind: 'special', role: '비밀방 — 별이 흔적 기믹, 숨겨진 문',
      grid: [
        "#######",
        "#.....#",
        "#..T..#",
        "D.....#",
        "#.....#",
        "#######"
      ],
      doors: ['W'], desc: '비밀방(별이 흔적). 단일 숨겨진 문. 층당 ≥1.'
    },
    {
      id: 'T_SHOP', kind: 'special', role: '던전 상점방 — 런 골드 소비',
      grid: [
        "#########",
        "#.......#",
        "#.T.T.T.#",
        "D...S...D",
        "#.......#",
        "#########"
      ],
      doors: ['W', 'E'], desc: '던전 내 상점(T=구매대). 런 골드 소비.'
    },
    {
      id: 'T_REST', kind: 'special', role: '휴식방 — 체크포인트/회복',
      grid: [
        "#######",
        "#.....#",
        "D..T..D",
        "#.....#",
        "#######"
      ],
      doors: ['W', 'E'], desc: '휴식(T=회복 소품). 적 없음.'
    },
    {
      id: 'T_BOSS', kind: 'boss', role: '보스방 — 단일 보스, 출구(X)',
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
      doors: ['W'], desc: '보스방(E=보스 위치). 격파 시 X 출구 개방.'
    },
    {
      id: 'T_BOSS_LARGE', kind: 'boss', role: '최종 보스방 — 악몽의 핵(100층)',
      grid: [
        "#################",
        "#...............#",
        "#...............#",
        "#...............#",
        "#.......E.......#",
        "#...............#",
        "D.......S.......X",
        "#...............#",
        "#...............#",
        "#...............#",
        "#...............#",
        "#################"
      ],
      doors: ['W'], desc: '최종 보스방(악몽의 핵). 가장 넓다. 100층 전용.'
    }
  ];

  var FLOOR_TEMPLATES = {
    version: 1,
    meta: {
      slug: 'pop-dungeon',
      tile: TILE,
      legend: GRID_LEGEND,
      wallChars: WALL_CHARS,
      walkableChars: WALKABLE_CHARS,
      storyRef: 'plan §2.2 floors 포맷 · §4 방 템플릿 라이브러리',
      note: 'grid 단일 진실 — lint-floors.mjs·room.js 가 이 legend/tile 을 공유'
    },
    templates: TEMPLATES,
    // 룩업 헬퍼(런타임·lint 공용) — id → 템플릿
    byId: TEMPLATES.reduce(function (acc, t) { acc[t.id] = t; return acc; }, {})
  };

  // ── ASCII grid → 런타임 변환 계약(L6a 어댑터용 — 스파이크 game/room.js 정합) ──
  // 스파이크 Room.tiles 는 정수 배열(0=바닥, 1=벽)이고 문은 link 시 벽 한 칸을 뚫는다.
  // 핸드 디자인 floors 의 ASCII grid 를 그 런타임 표현으로 옮기는 표준 변환:
  //   gridToTiles(grid) → { tiles, spawns, doors, markers }
  //     tiles[r][c]: WALL_CHARS('#','P') → 1(콜라이더), 그 외 walkable → 0(바닥), ' ' → 1(외부=벽 취급)
  //     doors:   'D' 셀 위치 [{r,c,dir}] — dir 은 가장자리 기준(N=상,S=하,W=좌,E=우)
  //     spawns:  'E' 셀 위치(grid 힌트) — room.spawns[] 데이터와 보완
  //     markers: 'S'(시작) 'X'(출구) 'T'(보물) 위치
  // 이 함수는 데이터(순수 변환)라 런타임·lint·QA 어디서나 동일 결과(결정적).
  FLOOR_TEMPLATES.gridToTiles = function (grid) {
    var H = grid.length, W = grid[0].length;
    var tiles = [], doors = [], spawns = [], markers = { S: [], X: [], T: [] };
    for (var r = 0; r < H; r++) {
      var rowArr = [];
      for (var c = 0; c < W; c++) {
        var ch = grid[r][c];
        var solid = (ch === ' ') || (WALL_CHARS.indexOf(ch) >= 0);
        rowArr.push(solid ? 1 : 0);
        if (ch === 'D') {
          var dir = (r === 0) ? 'up' : (r === H - 1) ? 'down' : (c === 0) ? 'left' : (c === W - 1) ? 'right' : 'inner';
          doors.push({ r: r, c: c, dir: dir });
        } else if (ch === 'E') spawns.push({ r: r, c: c });
        else if (ch === 'S' || ch === 'X' || ch === 'T') markers[ch].push({ r: r, c: c });
      }
      tiles.push(rowArr);
    }
    return { tiles: tiles, doors: doors, spawns: spawns, markers: markers, cols: W, rows: H };
  };

  g.POP_FLOOR_TEMPLATES = FLOOR_TEMPLATES;
  if (typeof module !== 'undefined' && module.exports) module.exports = { FLOOR_TEMPLATES: FLOOR_TEMPLATES };
})(typeof window !== 'undefined' ? window : globalThis);
