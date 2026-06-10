/* ============================================================================
 * 팡팡 던전 — Room / Maze 추상화 (Phase 0.5 스파이크)
 * ----------------------------------------------------------------------------
 * 목적: 기존 GameScene 이 단일 ARENA 상수(PD.ARENA) 에 박혀 있던 좌표계를
 *       "방(room) 단위 bounds" 로 일반화할 수 있음을 증명한다(PoC 게이트).
 *       L6a(Dungeon 좌표계 본구현)가 이 골격을 흡수한다 — 버리는 코드 아님.
 *
 * 핵심 추상:
 *   room.bounds = { x, y, w, h }  ← ARENA 를 일반화한 방 내부 플레이필드 사각형
 *   room.tiles                    ← 타일 그리드(0=바닥, 1=벽). staticGroup 으로 베이크
 *   room.doors                    ← 상/하/좌/우 문(이웃 방 id + 잠금 상태)
 *   maze                          ← 방들의 그래프(하드코딩 1개: 방 4개 + 문 연결)
 *
 * 좌표계: 월드 좌표(world space). 각 방은 월드 안에서 격자 슬롯에 배치되고,
 *         방 사이는 문(door) 으로 연결된다. 카메라는 현재 방 bounds 로 제한된다.
 *
 * 이 모듈은 데이터/지오메트리만 담당한다(Phaser 의존 없음 — 헤드리스 step 안전).
 * 물리 콜라이더 베이크·스폰·전투는 SpikeMaze 씬이 이 데이터를 읽어서 한다.
 * window.PD.spike 네임스페이스에 누적(전역, file:// 안전).
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var spike = (PD.spike = PD.spike || {});

  // 타일 한 칸 px (벽 두께·문 폭의 기준). 픽셀 아트 결에 맞춰 정수 배수.
  var TILE = 32;
  spike.TILE = TILE;

  // 방향 상수 + 반대 방향(이웃 방의 마주보는 문)
  var DIR = { up: 'up', down: 'down', left: 'left', right: 'right' };
  var OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  spike.DIR = DIR; spike.OPP = OPP;

  /* ── Room ───────────────────────────────────────────────────────────────
   * gx,gy: 월드 격자 슬롯(방 좌상단을 격자로 배치). cols,rows: 타일 단위 방 크기.
   * 방 outer rect(벽 포함) = gx*slot .. , 그 안쪽 1타일이 벽, 나머지가 bounds(바닥).
   */
  function Room(id, gx, gy, cols, rows) {
    this.id = id;
    this.gx = gx; this.gy = gy;
    this.cols = cols; this.rows = rows;
    // 방 outer(벽 포함) 월드 사각형 — 격자 슬롯 간격은 충분히 떨어뜨려 방을 분리
    this.ox = gx * (cols + 2) * TILE;   // +2: 방 사이 여백(복도 느낌)
    this.oy = gy * (rows + 2) * TILE;
    this.ow = cols * TILE;
    this.oh = rows * TILE;
    // bounds: 벽(외곽 1타일) 안쪽 바닥 영역 — ARENA 를 일반화한 플레이필드
    this.bounds = { x: this.ox + TILE, y: this.oy + TILE, w: (cols - 2) * TILE, h: (rows - 2) * TILE };
    // 편의 우/하 경계(ARENA_R/ARENA_B 대응)
    this.bounds.r = this.bounds.x + this.bounds.w;
    this.bounds.b = this.bounds.y + this.bounds.h;
    // 문: dir -> { to: roomId, locked: bool }
    this.doors = {};
    // 타일 그리드 채움(벽=1) — 문 자리는 나중에 열어줌(연결 후)
    this.tiles = [];
    for (var r = 0; r < rows; r++) {
      var rowArr = [];
      for (var c = 0; c < cols; c++) {
        var isWall = (r === 0 || r === rows - 1 || c === 0 || c === cols - 1);
        rowArr.push(isWall ? 1 : 0);
      }
      this.tiles.push(rowArr);
    }
    // 적 스폰 정의(방 진입 시 SpikeMaze 가 소비) — 방 단위 전투 스코프
    this.spawns = [];        // [{ type, tx, ty }]  (tx,ty: 방 내부 타일 좌표)
    this.spawned = false;    // 적이 1회 스폰됐는지(재입실 시 재스폰 방지)
    this.enemiesLeft = 0;    // 방에 남은 적 수(전역 단일 변수 대신 방별 카운터 — 스코프 핵심)
    this.cleared = false;    // 방의 적 전멸 여부
    this.visited = false;
  }

  // 문 자리(가운데) 타일 좌표 — 벽 한 칸을 뚫는다
  Room.prototype.doorTile = function (dir) {
    var midC = (this.cols / 2) | 0, midR = (this.rows / 2) | 0;
    if (dir === DIR.up) return { c: midC, r: 0 };
    if (dir === DIR.down) return { c: midC, r: this.rows - 1 };
    if (dir === DIR.left) return { c: 0, r: midR };
    if (dir === DIR.right) return { c: this.cols - 1, r: midR };
    return null;
  };

  // 문 자리의 월드 좌표(중심)
  Room.prototype.doorWorld = function (dir) {
    var t = this.doorTile(dir);
    return { x: this.ox + (t.c + 0.5) * TILE, y: this.oy + (t.r + 0.5) * TILE };
  };

  // 방 중심 월드 좌표(스폰/입실 기준점)
  Room.prototype.center = function () {
    return { x: this.bounds.x + this.bounds.w / 2, y: this.bounds.y + this.bounds.h / 2 };
  };

  // 점이 방 bounds(바닥) 안인지
  Room.prototype.contains = function (x, y) {
    return x >= this.bounds.x && x <= this.bounds.r && y >= this.bounds.y && y <= this.bounds.b;
  };

  // 타일 (c,r) 의 월드 사각형
  Room.prototype.tileRect = function (c, r) {
    return { x: this.ox + c * TILE, y: this.oy + r * TILE, w: TILE, h: TILE };
  };

  spike.Room = Room;

  /* ── Maze: 하드코딩 미로 1개(방 4개 + 문 3개) ──────────────────────────────
   *   배치(격자 슬롯):        문 연결:
   *      [A]──[B]              A.right ↔ B.left
   *       │                    A.down  ↔ C.up
   *      [C]──[D]              C.right ↔ D.left
   *   A = 입실 방(적 없음·안전). B/C/D = 전투 방.
   *   방마다 크기를 살짝 다르게 줘서 bounds 가 진짜 가변임을 증명.
   */
  function buildMaze() {
    var rooms = {};
    rooms.A = new Room('A', 0, 0, 11, 9);   // 시작 방(넓음)
    rooms.B = new Room('B', 1, 0, 9, 9);    // 우측 전투 방
    rooms.C = new Room('C', 0, 1, 9, 11);   // 하단 전투 방(세로로 김)
    rooms.D = new Room('D', 1, 1, 11, 9);   // 우하단 전투 방(넓음)

    // 문 연결(양방향). 입실 방 A 의 문들은 처음엔 열림(자유 이동), 전투 방 문은
    // "입실 시 잠금 → 전멸 시 개방" 을 SpikeMaze 가 런타임에 토글.
    link(rooms, 'A', DIR.right, 'B');
    link(rooms, 'A', DIR.down, 'C');
    link(rooms, 'C', DIR.right, 'D');

    // 전투 방 스폰 정의(방 단위 전투 스코프 증명용) — 방 내부 타일좌표 기준
    rooms.B.spawns = [
      { type: 'slime', tx: 3, ty: 3 }, { type: 'slime', tx: 5, ty: 3 },
      { type: 'bat', tx: 4, ty: 5 }
    ];
    rooms.C.spawns = [
      { type: 'slime', tx: 3, ty: 3 }, { type: 'turret', tx: 4, ty: 6 },
      { type: 'bat', tx: 5, ty: 8 }
    ];
    rooms.D.spawns = [
      { type: 'slime', tx: 3, ty: 3 }, { type: 'slime', tx: 7, ty: 3 },
      { type: 'orb', tx: 5, ty: 4 }, { type: 'bat', tx: 4, ty: 5 }
    ];

    return { rooms: rooms, start: 'A' };
  }

  // 방 a 의 dir 문 ↔ 방 b 의 OPP[dir] 문 을 양방향 연결 + 양쪽 벽에 문 구멍
  function link(rooms, aId, dir, bId) {
    var a = rooms[aId], b = rooms[bId];
    a.doors[dir] = { to: bId, locked: false };
    b.doors[OPP[dir]] = { to: aId, locked: false };
    // 타일 벽에 문 자리 뚫기(0=통로). 잠금은 런타임에 staticGroup 으로 다시 막는다.
    var ta = a.doorTile(dir); a.tiles[ta.r][ta.c] = 0;
    var tb = b.doorTile(OPP[dir]); b.tiles[tb.r][tb.c] = 0;
  }

  spike.buildMaze = buildMaze;
})();
