/* ============================================================================
 * 팡팡 던전 — 타일 물리·렌더링 (L6a · 스파이크 SpikeMaze 골격 승격)
 * ----------------------------------------------------------------------------
 * floors 데이터(ASCII grid → room.tiles 정수배열)를 받아
 *   (1) STYLE 팔레트로 바닥/벽 타일을 그리고(픽셀 도트 결),
 *   (2) staticGroup 벽 콜라이더를 베이크한다.
 * 스파이크(SpikeMaze.drawWallTile/bakeWalls/addWallBody)에서 검증된 룩·물리를
 * 그대로 흡수하되, ARENA 고정이 아니라 임의 room.bounds·room.tiles 위에서 동작한다.
 *
 * 좌표 규약(room.js Room 과 정합):
 *   tiles[r][c] === 1  → 벽(콜라이더). '#'/'P'/' '(외부) 가 여기로 변환됨(templates.gridToTiles).
 *   tiles[r][c] === 0  → 바닥(walkable).
 *   타일 (c,r) 의 월드 사각형 = room.tileRect(c, r) (room.ox/oy 기준 TILE 격자).
 *
 * 벽 바디는 보이지 않는 'square'(6x6) 텍스처를 TILE 로 스케일한 정적 바디
 * (Boot 가 베이크한 전역 자원 재사용 — 스파이크 핸드오프).
 *
 * 이 모듈은 Phaser 의존(staticGroup·graphics)이라 헤드리스 step 자체는 데이터만
 * 다루지만, bake/draw 는 씬 create 단계에서만 호출되므로 step 안전성에 영향 없음.
 * window.PD.Tiles 네임스페이스에 노출(전역 누적, file:// 안전).
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var spike = (PD.spike = PD.spike || {});
  var TILE = spike.TILE || 32;

  var rampInt = PD.rampInt;

  // ── 보이지 않는 정사각 정적 벽 바디(타일 1칸) ─────────────────────────────────
  //   'square'(6x6) 텍스처를 TILE 로 스케일. 스파이크 addWallBody 와 동일 계약.
  function addWallBody(scene, group, cx, cy) {
    var w = group.create(cx, cy, 'square').setVisible(false);
    w.setDisplaySize(TILE, TILE);
    w.body.setSize(TILE, TILE);
    w.body.updateFromGameObject();
    return w;
  }

  // ── 벽 타일 1칸 그리기(NW 림라이트 + SE 그림자 — 픽셀 도트 결) ─────────────────
  function drawWallTile(g, rect) {
    g.fillStyle(rampInt('stone', 2), 1);
    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.fillStyle(rampInt('stone', 3), 1);          // NW 림라이트
    g.fillRect(rect.x, rect.y, rect.w, 2);
    g.fillRect(rect.x, rect.y, 2, rect.h);
    g.fillStyle(rampInt('stone', 1), 1);          // SE 그림자
    g.fillRect(rect.x, rect.y + rect.h - 2, rect.w, 2);
  }

  // ── 기둥 타일(P) — 벽과 물리 동일, 시각만 다르게(중앙 도트 강조) ───────────────
  function drawPillarTile(g, rect) {
    g.fillStyle(rampInt('stone', 1), 1);
    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.fillStyle(rampInt('steel', 2), 1);
    g.fillRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
    g.fillStyle(rampInt('steel', 3), 1);          // 하이라이트 점
    g.fillRect(rect.x + 6, rect.y + 6, 3, 3);
  }

  // ── 방 바닥 그리기(돌바닥 + 브릭 줄눈) ──────────────────────────────────────────
  //   스파이크 drawAllRooms 의 바닥 파트를 단일 방으로. bounds 가 가변이어도 동작.
  function drawFloor(g, room) {
    var b = room.bounds;
    g.fillStyle(rampInt('stone', 0), 1);
    g.fillRect(b.x, b.y, b.w, b.h);
    // 브릭 가로 줄눈(24px 간격)
    g.fillStyle(rampInt('stone', 1), 1);
    for (var y = b.y + 24; y < b.b - 2; y += 24) g.fillRect(b.x + 2, y, b.w - 4, 1);
    // 바닥 잔돌·이끼 점(결정적 배치 — 방 id 해시로 시드)
    var seed = 0;
    for (var i = 0; i < (room.id || 'r').length; i++) seed = (seed * 31 + room.id.charCodeAt(i)) >>> 0;
    for (var k = 0; k < 12; k++) {
      var dx = b.x + 14 + (((k + 1) * 97 + seed) % Math.max(1, (b.w - 28)));
      var dy = b.y + 18 + (((k + 1) * 211 + seed) % Math.max(1, (b.h - 36)));
      g.fillStyle(k % 4 === 0 ? rampInt('venom', 1) : rampInt('stone', 2), k % 4 === 0 ? 0.5 : 0.7);
      g.fillRect(dx, dy, 2, k % 3 === 0 ? 1 : 2);
    }
  }

  /* ── Tiles.bake(scene, room, opts) ──────────────────────────────────────────
   *   방 하나의 바닥·벽 시각 + 벽 콜라이더를 한 번에 베이크한다.
   *   opts.floorGfx / opts.wallGfx: 공유 graphics(여러 방을 한 graphics 에 누적 가능).
   *     미지정 시 방 전용 graphics 를 만든다.
   *   opts.wallGroup: 공유 staticGroup. 미지정 시 새로 만든다.
   *   opts.pillarMeta: room 에 기둥(P) 위치 셋이 있으면 시각 구분(선택).
   *   반환: { wallGroup, floorGfx, wallGfx, wallBodies:[...] }
   *
   *   콜라이더는 tiles[r][c]===1 인 모든 셀에 1:1 베이크(스파이크 bakeWalls 동일).
   *   문 자리(tiles 0)는 콜라이더 없음 — 잠금은 L6b 가 런타임 doorWall 로 처리.
   */
  function bake(scene, room, opts) {
    opts = opts || {};
    var floorGfx = opts.floorGfx || scene.add.graphics().setDepth(0);
    var wallGfx = opts.wallGfx || scene.add.graphics().setDepth(1);
    var wallGroup = opts.wallGroup || scene.physics.add.staticGroup();
    var pillars = room.pillarSet || null;   // "c,r" 문자열 셋(선택)
    var bodies = [];

    drawFloor(floorGfx, room);

    for (var r = 0; r < room.rows; r++) {
      for (var c = 0; c < room.cols; c++) {
        if (room.tiles[r][c] !== 1) continue;
        var rect = room.tileRect(c, r);
        var isPillar = pillars && pillars[c + ',' + r];
        if (isPillar) drawPillarTile(wallGfx, rect);
        else drawWallTile(wallGfx, rect);
        bodies.push(addWallBody(scene, wallGroup, rect.x + TILE / 2, rect.y + TILE / 2));
      }
    }
    return { wallGroup: wallGroup, floorGfx: floorGfx, wallGfx: wallGfx, wallBodies: bodies };
  }

  PD.Tiles = {
    TILE: TILE,
    bake: bake,
    addWallBody: addWallBody,
    drawWallTile: drawWallTile,
    drawPillarTile: drawPillarTile,
    drawFloor: drawFloor
  };
})();
