/* ============================================================================
 * 팡팡 던전 — 공용 모달 프레임워크 (Village 기능 UI 6종이 공유)
 * ----------------------------------------------------------------------------
 * Village 씬 위에 HUD 오버레이로 뜨는 모달의 공통 골격. 패널·헤더·닫기 버튼·
 * 스크롤 가능한 리스트·등급/색 칩·버튼·토스트를 한 곳에 모아 6개 기능 모듈이
 * 중복 없이 쓴다. 모든 색은 PD(StyleKit) 램프/역할색에서 나온다(STYLE §6).
 *
 * 백버튼 정합(game/native.js): open() 은 window.PD.backStack 에 { close } 를
 * push 하고, 닫힐 때 pop 한다. Android 백버튼이 최상위 모달부터 닫는다.
 *
 * 공개 API (window.PD.UI):
 *   PD.UI.modal(scene, opts) → { root, body, close(), addList(...), ... }
 *      opts: { title, subtitle, w, h, onClose }
 *   PD.UI.button(scene, x, y, w, h, label, onTap, opts)  → Phaser.Container
 *   PD.UI.toast(scene, msg, opts)
 *   PD.UI.rarityColor(rarityId) / PD.UI.fmtGold(n)
 *
 * 전역 누적(window.PD.UI), ES module 아님 — file:// 안전.
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var DESIGN_W = PD.DESIGN_W, DESIGN_H = PD.DESIGN_H;
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt, rgba = PD.rgba;
  var WHITE = PD.WHITE, INK = PD.INK, ROLE = PD.ROLE;
  var WHITE_INT = PD.WHITE_INT, INK_INT = PD.INK_INT;

  var UI = {};

  // ── 등급 색 (아이템 데이터 rarities 가 단일 진실) ─────────────────────────
  var RARITY_HEX = {};
  ((window.POP_ITEMS && window.POP_ITEMS.rarities) || []).forEach(function (r) { RARITY_HEX[r.id] = r.color; });
  var RARITY_NAME = { common: '일반', rare: '희귀', epic: '영웅', legendary: '전설' };
  UI.rarityColor = function (id) { return RARITY_HEX[id] || ramp('steel', 3); };
  UI.rarityInt = function (id) { return StyleKit.hexToInt(UI.rarityColor(id), 0xffffff); };
  UI.rarityName = function (id) { return RARITY_NAME[id] || id; };
  UI.fmtGold = function (n) { return '◉ ' + (n | 0); };

  // 화면 좌표 헬퍼 — 디자인 해상도 기준
  var W = DESIGN_W, H = DESIGN_H;

  // ── 버튼 (둥근 픽셀 패널 + 라벨 + 탭) ─────────────────────────────────────
  //   opts: { fill, stroke, color, fontSize, disabled, align }
  UI.button = function (scene, x, y, w, h, label, onTap, opts) {
    opts = opts || {};
    var c = scene.add.container(x, y);
    var fill = opts.fill != null ? opts.fill : rampInt('steel', 1);
    var stroke = opts.stroke != null ? opts.stroke : roleInt('ui_accent');
    var disabled = !!opts.disabled;
    var g = scene.add.graphics();
    function paint(hot) {
      g.clear();
      g.fillStyle(disabled ? rampInt('steel', 0) : fill, disabled ? 0.5 : (hot ? 1 : 0.92));
      g.fillRect(-w / 2, -h / 2, w, h);
      g.lineStyle(2, disabled ? rampInt('steel', 1) : stroke, disabled ? 0.4 : (hot ? 1 : 0.7));
      g.strokeRect(-w / 2, -h / 2, w, h);
    }
    paint(false);
    var txt = scene.add.text(0, 0, label, {
      fontFamily: 'sans-serif', fontStyle: 'bold',
      fontSize: (opts.fontSize || 18) + 'px',
      color: disabled ? ramp('steel', 2) : (opts.color || WHITE)
    }).setOrigin(0.5);
    c.add([g, txt]);
    c.setSize(w, h);
    if (!disabled) {
      c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
      c.on('pointerover', function () { paint(true); });
      c.on('pointerout', function () { paint(false); });
      c.on('pointerdown', function () { paint(true); if (onTap) onTap(); });
      c.on('pointerup', function () { paint(false); });
    }
    c._setLabel = function (s) { txt.setText(s); };
    c._setDisabled = function (d) { disabled = d; c.disableInteractive(); if (!d) { c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains); } paint(false); };
    c._txt = txt;
    return c;
  };

  // ── 토스트 (잠깐 떴다 사라지는 알림) ──────────────────────────────────────
  UI.toast = function (scene, msg, opts) {
    opts = opts || {};
    var y = opts.y != null ? opts.y : H * 0.16;
    var t = scene.add.container(W / 2, y).setDepth(9999);
    var bw = Math.max(180, msg.length * 11 + 40);
    var g = scene.add.graphics();
    g.fillStyle(INK_INT, 0.86); g.fillRect(-bw / 2, -20, bw, 40);
    g.lineStyle(2, opts.accent != null ? opts.accent : roleInt('ui_accent'), 0.9); g.strokeRect(-bw / 2, -20, bw, 40);
    var txt = scene.add.text(0, 0, msg, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '16px', color: opts.color || WHITE }).setOrigin(0.5);
    t.add([g, txt]);
    scene.tweens.add({ targets: t, y: y - 24, alpha: 0, delay: opts.hold || 900, duration: 420, ease: 'Sine.in', onComplete: function () { t.destroy(); } });
    return t;
  };

  // ── 모달 (전체 골격) ──────────────────────────────────────────────────────
  //   opts: { title, subtitle, w, h, onClose, accent }
  //   반환: { root(Container), body(Container, 콘텐츠 원점 좌상), close(),
  //           addText, addButton, addList, setSubtitle, contentRect }
  UI.modal = function (scene, opts) {
    opts = opts || {};
    var mw = opts.w || W - 36;
    var mh = opts.h || H - 200;
    var mx = (W - mw) / 2;
    var my = (H - mh) / 2;
    var accent = opts.accent != null ? opts.accent : roleInt('ui_accent');

    var root = scene.add.container(0, 0).setDepth(900);

    // 어둡게 깔린 배경(탭하면 닫힘)
    var scrim = scene.add.graphics();
    scrim.fillStyle(INK_INT, 0.62); scrim.fillRect(0, 0, W, H);
    scrim.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);
    root.add(scrim);

    // 패널
    var panel = scene.add.graphics();
    panel.fillStyle(rampInt('stone', 0), 0.98); panel.fillRect(mx, my, mw, mh);
    panel.fillStyle(rampInt('stone', 1), 0.6); panel.fillRect(mx, my, mw, 54);  // 헤더 밴드
    panel.lineStyle(3, accent, 0.95); panel.strokeRect(mx, my, mw, mh);
    panel.lineStyle(1, rampInt('stone', 2), 0.8); panel.lineBetween(mx, my + 54, mx + mw, my + 54);
    root.add(panel);

    // 헤더
    var titleTxt = scene.add.text(mx + 18, my + 16, opts.title || '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '22px', color: WHITE }).setOrigin(0, 0);
    root.add(titleTxt);
    var subTxt = scene.add.text(mx + mw - 60, my + 20, opts.subtitle || '', { fontFamily: 'sans-serif', fontSize: '15px', color: ramp('gold', 2) }).setOrigin(1, 0);
    root.add(subTxt);

    // 닫기 버튼(우상)
    var closeBtn = scene.add.container(mx + mw - 28, my + 27);
    var cg = scene.add.graphics();
    cg.fillStyle(rampInt('scarlet', 1), 0.9); cg.fillRect(-18, -18, 36, 36);
    cg.lineStyle(2, rampInt('scarlet', 2), 1); cg.strokeRect(-18, -18, 36, 36);
    var cx2 = scene.add.text(0, -1, '✕', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '20px', color: WHITE }).setOrigin(0.5);
    closeBtn.add([cg, cx2]);
    closeBtn.setSize(36, 36);
    closeBtn.setInteractive(new Phaser.Geom.Rectangle(-18, -18, 36, 36), Phaser.Geom.Rectangle.Contains);
    root.add(closeBtn);

    // 콘텐츠 영역(헤더 아래) 원점 좌상으로 잡은 컨테이너
    var contentX = mx + 16, contentY = my + 66;
    var contentW = mw - 32, contentH = mh - 66 - 14;
    var body = scene.add.container(contentX, contentY);
    root.add(body);

    var closed = false;
    var api = {
      root: root, body: body,
      contentRect: { x: 0, y: 0, w: contentW, h: contentH },
      panelRect: { x: mx, y: my, w: mw, h: mh },
      close: function () { if (closed) return; closed = true; _popBack(api); if (opts.onClose) opts.onClose(); root.destroy(); }
    };

    closeBtn.on('pointerdown', api.close);
    scrim.on('pointerdown', api.close);

    api.setSubtitle = function (s) { subTxt.setText(s); };
    api.setTitle = function (s) { titleTxt.setText(s); };

    // 본문 좌표(0,0 = 콘텐츠 좌상) 기준 텍스트
    api.addText = function (x, y, s, style) {
      var t = scene.add.text(x, y, s, Object.assign({ fontFamily: 'sans-serif', fontSize: '15px', color: ramp('steel', 3) }, style || {}));
      body.add(t); return t;
    };
    api.addButton = function (x, y, w2, h2, label, onTap, bopts) {
      var b = UI.button(scene, x, y, w2, h2, label, onTap, bopts);
      body.add(b); return b;
    };

    // 스크롤 리스트: items 각각을 renderRow(rowContainer, item, index, rowW) 로 그린다.
    //   영역 밖으로 클리핑(geometry mask), 드래그/휠 스크롤.
    api.addList = function (cfg) {
      cfg = cfg || {};
      var lx = cfg.x || 0, ly = cfg.y || 0;
      var lw = cfg.w || contentW, lh = cfg.h || (contentH - ly);
      var rowH = cfg.rowH || 56, gap = cfg.gap || 8;
      var items = cfg.items || [];
      var listC = scene.add.container(lx, ly);
      body.add(listC);

      var rowsC = scene.add.container(0, 0);
      listC.add(rowsC);
      var rowEls = [];
      items.forEach(function (it, i) {
        var rc = scene.add.container(0, i * (rowH + gap));
        rowsC.add(rc);
        if (cfg.renderRow) cfg.renderRow(rc, it, i, lw, rowH);
        rowEls.push(rc);
      });
      var totalH = items.length * (rowH + gap);

      // 마스크 (콘텐츠 좌표 → 화면 좌표 변환)
      var maskG = scene.make.graphics();
      var absX = contentX + lx, absY = contentY + ly;
      maskG.fillStyle(0xffffff); maskG.fillRect(absX, absY, lw, lh);
      var mask = maskG.createGeometryMask();
      rowsC.setMask(mask);

      var minY = Math.min(0, lh - totalH);
      var curY = 0;
      function clampY(v) { return Math.max(minY, Math.min(0, v)); }
      function applyY() { rowsC.y = curY; }

      // 빈 영역 + 행 위에서 드래그 스크롤
      var hit = scene.add.zone(lx, ly, lw, lh).setOrigin(0, 0);
      hit.setInteractive({ draggable: true });
      body.add(hit);
      var dragStartY = 0, dragStartCur = 0, dragging = false;
      hit.on('dragstart', function (p) { dragging = true; dragStartY = p.y; dragStartCur = curY; });
      hit.on('drag', function (p) { if (totalH <= lh) return; curY = clampY(dragStartCur + (p.y - dragStartY)); applyY(); });
      hit.on('dragend', function () { dragging = false; });
      // 휠(데스크톱 프리뷰)
      scene.input.on('wheel', function (pointer, over, dx, dy) {
        if (closed) return;
        if (totalH <= lh) return;
        // 포인터가 리스트 영역 안일 때만
        var px = pointer.x, py = pointer.y;
        if (px >= absX && px <= absX + lw && py >= absY && py <= absY + lh) {
          curY = clampY(curY - dy * 0.5); applyY();
        }
      });

      return {
        container: listC, rows: rowEls,
        scrollTo: function (y) { curY = clampY(y); applyY(); },
        destroy: function () { mask.destroy(); maskG.destroy(); listC.destroy(); hit.destroy(); }
      };
    };

    // 백스택 등록(Android 백버튼이 닫음)
    _pushBack(api);
    return api;
  };

  // ── 백스택 헬퍼 (native.js PD.backStack 계약) ─────────────────────────────
  function _pushBack(api) {
    if (!Array.isArray(PD.backStack)) PD.backStack = [];
    api._backEntry = { close: function () { api.close(); } };
    PD.backStack.push(api._backEntry);
  }
  function _popBack(api) {
    if (!Array.isArray(PD.backStack)) return;
    var i = PD.backStack.indexOf(api._backEntry);
    if (i >= 0) PD.backStack.splice(i, 1);
  }

  PD.UI = UI;
})();
