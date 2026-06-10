/* ============================================================================
 * 팡팡 던전 — floor 데이터 → Room 그래프 어댑터 (L6a)
 * ----------------------------------------------------------------------------
 * floors 데이터(data/floors/*.js 의 한 층 객체)를 room.js 의 Room 인스턴스 그래프로
 * 변환한다. 스파이크 buildMaze() 가 하드코딩 4방 미로를 만들었던 자리를, 실제
 * floor.rooms[] + floor.graph[] 로부터 *데이터 주도*로 만드는 본구현이다.
 *
 * 입력(floor 객체 — region-01.sample.js 스키마):
 *   { id, region, theme, rooms:[ {id, template, grid:[ASCII...], spawns:[{type,count,at?}], gimmick? } ],
 *     graph:[ {from, to, door?} ], special:{ boss?, secret?, treasure?, shop?, event? } }
 *
 * 변환:
 *   1) 각 방의 ASCII grid → templates.gridToTiles(grid) 로 tiles/doors/spawns/markers 추출.
 *   2) Room 인스턴스 생성(room.js Room). grid 가 외벽을 명시 포함하므로 tiles 를 그대로 주입.
 *   3) 방을 월드 격자에 배치(BFS 레이아웃 — graph 를 따라 방향 문으로 이웃을 인접 슬롯에).
 *   4) graph 간선 → 양방향 door 연결(room.doors[dir] = { to, locked }). 문 자리 tiles 0.
 *   5) 'S'(시작) 마커가 있는 방을 start 로. 없으면 첫 방.
 *   6) room.spawns 를 floor.rooms[].spawns(권위) + grid 'E' 위치(보완)로 합성.
 *
 * 좌표·물리는 L6a Dungeon 씬이 PD.Tiles 로 베이크. 문 잠금/개방·방 단위 전투 스코프·
 * 방 전환은 L6b 가 이 그래프 위에서 구현한다(여기선 그래프 데이터만 권위 있게 만든다).
 *
 * window.PD.RoomGraph 노출(전역 누적).
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var spike = (PD.spike = PD.spike || {});
  var Room = spike.Room;
  var DIR = spike.DIR, OPP = spike.OPP;
  var TILE = spike.TILE || 32;

  // 방향(템플릿/문 dir) → 격자 슬롯 오프셋
  var DIR_OFFSET = {
    up:    { dx: 0,  dy: -1 },
    down:  { dx: 0,  dy: 1 },
    left:  { dx: -1, dy: 0 },
    right: { dx: 1,  dy: 0 }
  };

  // gridToTiles 어댑터(templates.js 가 권위). 없으면 폴백(직접 변환).
  function gridToTiles(grid) {
    var FT = window.POP_FLOOR_TEMPLATES;
    if (FT && typeof FT.gridToTiles === 'function') return FT.gridToTiles(grid);
    // 폴백: 최소 변환(' '/'#'/'P' → 1, 나머지 0)
    var H = grid.length, W = grid[0].length, tiles = [], doors = [], spawns = [], markers = { S: [], X: [], T: [] };
    for (var r = 0; r < H; r++) {
      var row = [];
      for (var c = 0; c < W; c++) {
        var ch = grid[r][c];
        var solid = (ch === ' ' || ch === '#' || ch === 'P');
        row.push(solid ? 1 : 0);
        if (ch === 'D') {
          var dir = (r === 0) ? 'up' : (r === H - 1) ? 'down' : (c === 0) ? 'left' : (c === W - 1) ? 'right' : 'inner';
          doors.push({ r: r, c: c, dir: dir });
        } else if (ch === 'E') spawns.push({ r: r, c: c });
        else if (ch === 'S' || ch === 'X' || ch === 'T') markers[ch].push({ r: r, c: c });
      }
      tiles.push(row);
    }
    return { tiles: tiles, doors: doors, spawns: spawns, markers: markers, cols: W, rows: H };
  }

  // 기둥(P) 위치 셋 — Tiles 가 시각 구분에 사용("c,r" → true)
  function pillarSet(grid) {
    var set = {};
    for (var r = 0; r < grid.length; r++) {
      for (var c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 'P') set[c + ',' + r] = true;
      }
    }
    return set;
  }

  // Room 인스턴스를 floor 방 데이터로 구성(격자 슬롯 gx,gy 는 레이아웃이 나중에 설정)
  function makeRoom(roomDef) {
    var parsed = gridToTiles(roomDef.grid);
    // Room(id, gx, gy, cols, rows) — gx,gy 는 레이아웃 단계에서 재배치하므로 임시 0,0.
    // 단 Room 생성자가 tiles 를 자체 생성하므로, 생성 후 parsed.tiles 로 덮어쓴다.
    var room = new Room(roomDef.id, 0, 0, parsed.cols, parsed.rows);
    room.tiles = parsed.tiles;               // grid 가 외벽 포함 → 그대로 주입(드리프트 0)
    room.parsed = parsed;                     // doors/markers/spawns(grid 힌트) 보관
    room.template = roomDef.template || null;
    room.gimmick = roomDef.gimmick || null;
    room.pillarSet = pillarSet(roomDef.grid);
    room.spawnDefs = roomDef.spawns || [];    // 권위 스폰(type,count,at?) — L6b 가 소비
    room.kindHint = templateKind(roomDef.template);
    // grid 의 'D' 문 위치를 방향별로 인덱싱(레이아웃·연결이 사용)
    room.doorCells = {};                      // dir -> {r,c}
    (parsed.doors || []).forEach(function (d) {
      if (d.dir && d.dir !== 'inner') room.doorCells[d.dir] = { r: d.r, c: d.c };
    });
    // 시작/출구/보물 마커(월드 좌표는 placeRoom 후 계산)
    room.markers = parsed.markers || { S: [], X: [], T: [] };
    return room;
  }

  // 템플릿 id → 종류 힌트(L6c 특수방 분기에 사용)
  function templateKind(tid) {
    if (!tid) return 'combat';
    var FT = window.POP_FLOOR_TEMPLATES;
    if (FT && FT.byId && FT.byId[tid]) return FT.byId[tid].kind || 'combat';
    return 'combat';
  }

  // 방을 격자 슬롯(gx,gy)에 배치 — ox/oy/bounds 재계산(Room 생성자 로직과 동일 공식)
  function placeRoom(room, gx, gy) {
    room.gx = gx; room.gy = gy;
    room.ox = gx * (room.cols + 2) * TILE;   // +2: 방 사이 여백(복도 느낌 — 스파이크 동일)
    room.oy = gy * (room.rows + 2) * TILE;
    room.ow = room.cols * TILE;
    room.oh = room.rows * TILE;
    // bounds: walkable bounding box(외벽 안쪽). grid 외벽이 1타일 가정이 아닐 수 있어
    // 실제 walkable 셀 범위로 계산(템플릿 계약 §gridToTiles).
    var minC = room.cols, maxC = -1, minR = room.rows, maxR = -1;
    for (var r = 0; r < room.rows; r++) {
      for (var c = 0; c < room.cols; c++) {
        if (room.tiles[r][c] === 0) {
          if (c < minC) minC = c; if (c > maxC) maxC = c;
          if (r < minR) minR = r; if (r > maxR) maxR = r;
        }
      }
    }
    if (maxC < 0) { minC = 1; maxC = room.cols - 2; minR = 1; maxR = room.rows - 2; } // 안전 폴백
    room.bounds = {
      x: room.ox + minC * TILE,
      y: room.oy + minR * TILE,
      w: (maxC - minC + 1) * TILE,
      h: (maxR - minR + 1) * TILE
    };
    room.bounds.r = room.bounds.x + room.bounds.w;
    room.bounds.b = room.bounds.y + room.bounds.h;
  }

  /* ── build(floor) ───────────────────────────────────────────────────────────
   *   floor 객체 → { rooms:{id:Room}, order:[id...], start:id, edges:[...], special }
   *   BFS 레이아웃: start 방을 (0,0) 에 두고, graph 간선을 따라 인접 슬롯에 배치한다.
   *   배치 방향은 양 방이 가진 'D' 문 방향을 우선 사용하고, 없으면 빈 슬롯을 탐색한다.
   */
  function build(floor) {
    if (!floor || !floor.rooms || !floor.rooms.length) {
      throw new Error('[RoomGraph] floor.rooms 비어있음');
    }
    var rooms = {};
    floor.rooms.forEach(function (rd) { rooms[rd.id] = makeRoom(rd); });

    // 인접 리스트(무방향)
    var adj = {};
    floor.rooms.forEach(function (rd) { adj[rd.id] = []; });
    (floor.graph || []).forEach(function (e) {
      if (rooms[e.from] && rooms[e.to]) {
        adj[e.from].push({ to: e.to, door: e.door || null });
        adj[e.to].push({ to: e.from, door: e.door || null });
      }
    });

    // 시작 방: 'S' 마커가 있는 방 우선, 없으면 special 없는 첫 방
    var startId = null;
    floor.rooms.forEach(function (rd) {
      if (startId) return;
      var rm = rooms[rd.id];
      if (rm.markers && rm.markers.S && rm.markers.S.length) startId = rd.id;
    });
    if (!startId) startId = floor.rooms[0].id;

    // BFS 격자 배치 — 슬롯 점유 맵으로 충돌 회피
    var slotOf = {};            // roomId -> {gx,gy}
    var occupied = {};          // "gx,gy" -> roomId
    function setSlot(id, gx, gy) { slotOf[id] = { gx: gx, gy: gy }; occupied[gx + ',' + gy] = id; }
    function freeSlot(gx, gy) { return !occupied[gx + ',' + gy]; }

    setSlot(startId, 0, 0);
    var queue = [startId], order = [];
    var seen = {}; seen[startId] = true;
    while (queue.length) {
      var id = queue.shift();
      order.push(id);
      var here = slotOf[id];
      var nbrs = adj[id] || [];
      // 이 방의 미배치 이웃을, 가능한 빈 슬롯에 배치
      var tryDirs = ['right', 'down', 'left', 'up'];
      nbrs.forEach(function (nb) {
        if (seen[nb.to]) return;
        seen[nb.to] = true;
        // 인접 슬롯 탐색: 우/하/좌/상 순으로 빈 곳
        var placed = false;
        for (var i = 0; i < tryDirs.length && !placed; i++) {
          var off = DIR_OFFSET[tryDirs[i]];
          var gx = here.gx + off.dx, gy = here.gy + off.dy;
          if (freeSlot(gx, gy)) { setSlot(nb.to, gx, gy); placed = true; }
        }
        if (!placed) {
          // 모든 인접 점유 — 나선형으로 빈 슬롯 탐색(드물게 발생)
          var radius = 2;
          while (!placed && radius < 64) {
            for (var ddx = -radius; ddx <= radius && !placed; ddx++) {
              for (var ddy = -radius; ddy <= radius && !placed; ddy++) {
                var sx = here.gx + ddx, sy = here.gy + ddy;
                if (freeSlot(sx, sy)) { setSlot(nb.to, sx, sy); placed = true; }
              }
            }
            radius++;
          }
        }
        queue.push(nb.to);
      });
    }
    // graph 에서 분리된(도달 불가) 방도 빈 슬롯에 배치(견고성)
    floor.rooms.forEach(function (rd) {
      if (slotOf[rd.id]) return;
      var gx = 0, gy = 0;
      while (!freeSlot(gx, gy)) gx++;
      setSlot(rd.id, gx, gy);
      order.push(rd.id);
    });

    // 슬롯 좌표로 방 배치(ox/oy/bounds 확정)
    Object.keys(slotOf).forEach(function (id) {
      var s = slotOf[id];
      placeRoom(rooms[id], s.gx, s.gy);
    });

    // graph 간선 → 양방향 door 연결. 배치된 슬롯의 상대 방향으로 dir 결정.
    var edges = [];
    (floor.graph || []).forEach(function (e) {
      var a = rooms[e.from], b = rooms[e.to];
      if (!a || !b) return;
      var dir = relDir(slotOf[e.from], slotOf[e.to]);
      if (!dir) return;   // 비인접(나선 배치 등) — 문 시각 생략, 그래프 연결만
      a.doors[dir] = { to: e.to, locked: false };
      b.doors[OPP[dir]] = { to: e.from, locked: false };
      // 문 자리 tiles 뚫기 — grid 의 'D' 위치(있으면) 우선, 없으면 변 중앙
      openDoorTile(a, dir);
      openDoorTile(b, OPP[dir]);
      edges.push({ from: e.from, to: e.to, dir: dir });
    });

    // 시작 방의 외부로 향한(이웃 없는) 'D' 문은 통로 입구 — 닫지 않고 둔다(L6b 가 처리).
    var graph = {
      rooms: rooms,
      order: order,
      start: startId,
      edges: edges,
      special: floor.special || {},
      floorId: floor.id || null,
      theme: floor.theme || null,
      region: floor.region || null
    };
    return graph;
  }

  // 두 슬롯의 상대 방향(인접일 때만 dir, 아니면 null)
  function relDir(sa, sb) {
    if (!sa || !sb) return null;
    var dx = sb.gx - sa.gx, dy = sb.gy - sa.gy;
    if (dx === 1 && dy === 0) return DIR.right;
    if (dx === -1 && dy === 0) return DIR.left;
    if (dx === 0 && dy === 1) return DIR.down;
    if (dx === 0 && dy === -1) return DIR.up;
    return null;
  }

  // 방 dir 문 자리 타일을 뚫는다(0). grid 'D'(doorCells) 우선, 없으면 변 중앙(doorTile).
  function openDoorTile(room, dir) {
    var cell = room.doorCells[dir];
    if (cell) { room.tiles[cell.r][cell.c] = 0; return; }
    var t = room.doorTile(dir);
    if (t && room.tiles[t.r] && room.tiles[t.r][t.c] != null) room.tiles[t.r][t.c] = 0;
  }

  // 월드 전체 사각형(모든 방 포괄) — 물리 월드 bounds 용
  function worldExtent(graph) {
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    Object.keys(graph.rooms).forEach(function (id) {
      var r = graph.rooms[id];
      minX = Math.min(minX, r.ox); minY = Math.min(minY, r.oy);
      maxX = Math.max(maxX, r.ox + r.ow); maxY = Math.max(maxY, r.oy + r.oh);
    });
    return { x: minX - TILE, y: minY - TILE, w: (maxX - minX) + TILE * 2, h: (maxY - minY) + TILE * 2 };
  }

  PD.RoomGraph = {
    build: build,
    worldExtent: worldExtent,
    makeRoom: makeRoom,
    placeRoom: placeRoom,
    relDir: relDir
  };
})();
