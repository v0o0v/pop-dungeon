/* ============================================================================
 * 팡팡 던전 — 미니맵 렌더러 (L6c)
 * ----------------------------------------------------------------------------
 * 방 그래프(roomgraph.build 결과)를 받아 화면 우상단에 미니맵을 그린다.
 *   · 방 노드: 격자 슬롯(gx,gy) 기반 미니 사각형. 상태별 색:
 *       현재 방   = 히어로색 강조 + 테두리
 *       클리어    = 채워진 돌색
 *       방문      = 옅은 돌색
 *       미방문    = 외곽선만(희미)
 *   · 특수방 배지: 보물(T·금색)·비밀(?·보라)·상점($·청록)·보스(★·주홍)·출구(↓)
 *   · 간선: 연결된 두 방 사이 선(문 방향). 잠긴 문은 주홍 점.
 *
 * 순수 렌더러(상태를 받아 graphics 에 그리기만 — 게임 상태 변경 없음).
 * HUD 씬이 toggle 오버레이로 호출하고, Dungeon 이 방문/클리어 상태를 공급한다.
 * window.PD.Minimap 노출.
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var rampInt = PD.rampInt, roleInt = PD.roleInt;

  // 미니맵 셀 크기·간격(px, 화면 좌표)
  var CELL = 14, GAP = 4, PAD = 8;

  // 방 종류 → 배지 글리프·색
  function badge(room) {
    var k = room.kindHint;
    if (k === 'boss') return { ch: '★', col: rampInt('scarlet', 3) };
    if (room.markers && room.markers.T && room.markers.T.length) return { ch: 'T', col: rampInt('gold', 3) };
    if (k === 'treasure') return { ch: 'T', col: rampInt('gold', 3) };
    if (k === 'special') {
      if (room.template === 'T_SHOP') return { ch: '$', col: roleInt('ui_accent') };
      if (room.template === 'T_SECRET') return { ch: '?', col: rampInt('arcane', 3) };
      return { ch: '◆', col: rampInt('gold', 2) };
    }
    if (room.markers && room.markers.X && room.markers.X.length) return { ch: '↓', col: rampInt('hero', 3) };
    return null;
  }

  /* ── Minimap.draw(g, opts) ──────────────────────────────────────────────────
   *   g:    Phaser graphics(스크롤 무시 — 화면 좌표). 호출 전 clear 권장.
   *   opts: { graph, current, visited, cleared, originX, originY, textFactory }
   *     graph    = roomgraph.build 결과(rooms, edges)
   *     current  = 현재 방 id
   *     visited  = { roomId: true }
   *     cleared  = { roomId: true }
   *     originX/Y= 미니맵 좌상단 화면 좌표(기본 우상단은 HUD 가 계산)
   *     textFactory(x,y,ch,colInt) → 배지 텍스트 생성/갱신(HUD 가 텍스트 풀 관리)
   *   반환: { w, h } 미니맵 픽셀 크기(HUD 가 배경 패널 크기에 사용)
   */
  function draw(g, opts) {
    var graph = opts.graph; if (!graph || !graph.rooms) return { w: 0, h: 0 };
    var rooms = graph.rooms;
    var current = opts.current, visited = opts.visited || {}, cleared = opts.cleared || {};
    var ox = opts.originX || 0, oy = opts.originY || 0;

    // 슬롯 범위(gx,gy) 정규화
    var minGX = 1e9, minGY = 1e9, maxGX = -1e9, maxGY = -1e9;
    Object.keys(rooms).forEach(function (id) {
      var r = rooms[id];
      if (r.gx < minGX) minGX = r.gx; if (r.gx > maxGX) maxGX = r.gx;
      if (r.gy < minGY) minGY = r.gy; if (r.gy > maxGY) maxGY = r.gy;
    });
    var cols = (maxGX - minGX + 1), rows = (maxGY - minGY + 1);
    var W = PAD * 2 + cols * CELL + (cols - 1) * GAP;
    var H = PAD * 2 + rows * CELL + (rows - 1) * GAP;

    function cellXY(r) {
      return {
        x: ox + PAD + (r.gx - minGX) * (CELL + GAP),
        y: oy + PAD + (r.gy - minGY) * (CELL + GAP)
      };
    }

    // 배경 패널
    g.fillStyle(rampInt('stone', 0), 0.72);
    g.fillRect(ox, oy, W, H);
    g.lineStyle(1, rampInt('stone', 2), 0.6);
    g.strokeRect(ox, oy, W, H);

    // 간선(연결선) 먼저
    (graph.edges || []).forEach(function (e) {
      var a = rooms[e.from], b = rooms[e.to];
      if (!a || !b) return;
      var ca = cellXY(a), cb = cellXY(b);
      var locked = (a.doors[e.dir] && a.doors[e.dir].locked);
      g.lineStyle(2, locked ? rampInt('scarlet', 2) : rampInt('stone', 3), locked ? 0.9 : 0.5);
      g.lineBetween(ca.x + CELL / 2, ca.y + CELL / 2, cb.x + CELL / 2, cb.y + CELL / 2);
    });

    // 방 노드
    var badges = [];
    Object.keys(rooms).forEach(function (id) {
      var r = rooms[id], c = cellXY(r);
      var isCur = (id === current);
      var isVisited = !!visited[id] || r.visited;
      var isCleared = !!cleared[id] || r.cleared;
      if (isCur) {
        g.fillStyle(roleInt('player'), 1); g.fillRect(c.x, c.y, CELL, CELL);
        g.lineStyle(2, rampInt('gold', 3), 1); g.strokeRect(c.x - 1, c.y - 1, CELL + 2, CELL + 2);
      } else if (isCleared) {
        g.fillStyle(rampInt('stone', 2), 0.95); g.fillRect(c.x, c.y, CELL, CELL);
      } else if (isVisited) {
        g.fillStyle(rampInt('stone', 1), 0.85); g.fillRect(c.x, c.y, CELL, CELL);
      } else {
        g.lineStyle(1, rampInt('stone', 2), 0.4); g.strokeRect(c.x, c.y, CELL, CELL);
      }
      // 배지(방문/현재 방만 표시 — 미방문은 숨김으로 탐험 동기 유지)
      if (isCur || isVisited) {
        var bd = badge(r);
        if (bd) badges.push({ x: c.x + CELL / 2, y: c.y + CELL / 2, ch: bd.ch, col: bd.col });
      }
    });

    // 배지 텍스트(HUD 가 텍스트 풀로 관리 — textFactory 위임)
    if (typeof opts.textFactory === 'function') {
      opts.textFactory(badges);
    }

    return { w: W, h: H };
  }

  PD.Minimap = { draw: draw, CELL: CELL, GAP: GAP, PAD: PAD, badge: badge };
})();
