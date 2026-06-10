/* ============================================================================
 * 팡팡 던전 — HUDScene (컨트롤: 조이스틱+버튼 + HUD 표시, Game 위 오버레이)
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = window.PD;
  var DESIGN_W = PD.DESIGN_W, DESIGN_H = PD.DESIGN_H;
  var ROLE = PD.ROLE, WHITE = PD.WHITE, INK = PD.INK;
  var INK_INT = PD.INK_INT;
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt;
  var ITEM_BY_ID = PD.ITEM_BY_ID;
  var GAME_INPUT = PD.GAME_INPUT;

  PD.scenes.HUD = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function HUDScene() { Phaser.Scene.call(this, { key: 'HUD', active: false }); },
    create: function () {
      var self = this, W = DESIGN_W, H = DESIGN_H;
      this.input.addPointer(4);
      // 이동 조이스틱(좌측 영역, 플로팅)
      this.joy = JoystickKit.create(this, { move: { zone: 'left', mode: 'floating', x: 90, y: H - 90 }, radius: 52 });
      window.PopDungeon = window.PopDungeon || {}; window.PopDungeon.joy = this.joy;

      // 버튼 정의(우측 하단 엄지 영역) — dodge 가 가장 크고 손에 가깝다.
      // (L6c) 스킬 슬롯(skill1/skill2/ult)은 SAVE.skills.loadout 으로 동적화 — 마을 스킬트리에서
      //   장착한 능력으로 매핑(미설정 시 기본 능력). dodge 는 고정.
      var loadout = (PD.SAVE && PD.SAVE.skills && PD.SAVE.skills.loadout) || {};
      var ABDB = (window.POP_ABILITIES && window.POP_ABILITIES.abilities) || [];
      function abMeta(id) { for (var i = 0; i < ABDB.length; i++) if (ABDB[i].id === id) return ABDB[i]; return null; }
      function slotAbility(slot, fallback) { return loadout[slot] || fallback; }
      function slotLabel(id, fallback) { var a = abMeta(id); return (a && (a.icon || a.glyph)) || fallback; }
      var s1 = slotAbility('skill1', 'pop_nova'), s2 = slotAbility('skill2', 'turbo_pop'), su = slotAbility('ult', 'golden_storm');
      this.buttons = [
        { id: 'dodge', x: W - 64, y: H - 70, r: 40, label: '↻', color: rampInt('hero', 2), ability: 'dodge_roll' },
        { id: 'skill1', x: W - 142, y: H - 92, r: 28, label: slotLabel(s1, '✦'), color: rampInt('gold', 2), ability: s1 },
        { id: 'skill2', x: W - 150, y: H - 158, r: 26, label: slotLabel(s2, '▲'), color: rampInt('torch', 2), ability: s2 },
        { id: 'ult', x: W - 78, y: H - 156, r: 26, label: slotLabel(su, '◆'), color: roleInt('pickup'), ability: su }
      ];

      this.g = this.add.graphics().setDepth(1000);
      this.labels = {};
      this.cdText = {};
      this.buttons.forEach(function (b) {
        self.labels[b.id] = self.add.text(b.x, b.y, b.label, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: (b.r * 0.9) + 'px', color: WHITE }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);
        self.cdText[b.id] = self.add.text(b.x, b.y + b.r + 8, '', { fontFamily: 'monospace', fontSize: '11px', color: WHITE }).setOrigin(0.5).setDepth(1001);
      });

      // 상단 HUD 텍스트
      this.floorText = this.add.text(W / 2, 28, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '26px', color: WHITE }).setOrigin(0.5).setDepth(1001).setShadow(0, 2, INK, 3);
      this.coinText = this.add.text(W - 16, 22, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '18px', color: ROLE.pickup }).setOrigin(1, 0.5).setDepth(1001);
      this.hudG = this.add.graphics().setDepth(1000);
      this.itemText = this.add.text(16, 116, '', { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 3), wordWrap: { width: 250 } }).setDepth(1001);
      this.bossNameText = this.add.text(W / 2, 96, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '15px', color: ROLE.enemy }).setOrigin(0.5).setDepth(1001);

      this.prevPressed = {};

      // 음소거 토글
      if (window.GAME_AUDIO) {
        var mute = this.add.text(W - 16, 50, '♪', { fontFamily: 'monospace', fontSize: '20px', color: WHITE }).setOrigin(1, 0).setDepth(1002).setInteractive({ useHandCursor: true });
        mute.on('pointerdown', function () { var m = window.GAME_AUDIO.toggleMute(); mute.setText(m ? '♪̸' : '♪').setAlpha(m ? 0.5 : 1); });
      }

      // ── (L6c) 미니맵 오버레이 — 우상단. 토글 버튼으로 표시/숨김 ─────────────────────
      this.miniG = this.add.graphics().setScrollFactor(0).setDepth(1003);
      this.miniBadges = [];           // 배지 텍스트 풀(재사용)
      this.miniVisible = true;
      this.miniToggle = this.add.text(W - 16, 80, '🗺', { fontFamily: 'monospace', fontSize: '18px', color: WHITE }).setOrigin(1, 0).setDepth(1004).setScrollFactor(0).setInteractive({ useHandCursor: true });
      this.miniToggle.on('pointerdown', function () { self.miniVisible = !self.miniVisible; self.miniToggle.setAlpha(self.miniVisible ? 1 : 0.45); if (window.GAME_AUDIO && window.GAME_AUDIO.sfx) window.GAME_AUDIO.sfx('minimap'); });
    },

    // 배지 텍스트 풀 — 필요 수만큼 생성·재사용, 나머지 숨김
    miniBadgeFactory: function (badges) {
      var self = this;
      for (var i = 0; i < badges.length; i++) {
        var t = this.miniBadges[i];
        if (!t) { t = this.add.text(0, 0, '', { fontFamily: 'monospace', fontStyle: 'bold', fontSize: '9px' }).setOrigin(0.5).setScrollFactor(0).setDepth(1005); this.miniBadges[i] = t; }
        var bd = badges[i];
        t.setText(bd.ch).setColor('#' + (bd.col >>> 0).toString(16).padStart(6, '0')).setPosition(bd.x, bd.y).setVisible(self.miniVisible);
      }
      for (var j = badges.length; j < this.miniBadges.length; j++) this.miniBadges[j].setVisible(false);
    },

    // 미니맵 그리기(매 프레임 — 던전 상태에서 갱신)
    drawMinimap: function () {
      var dz = window.PopDungeon && window.PopDungeon.dungeon;
      this.miniG.clear();
      if (!this.miniVisible || !dz || typeof dz.minimapState !== 'function' || !PD.Minimap) {
        for (var k = 0; k < this.miniBadges.length; k++) this.miniBadges[k].setVisible(false);
        return;
      }
      var st = dz.minimapState();
      if (!st.graph) return;
      // 우상단 배치 — 폭을 먼저 추정해 originX 계산(2패스: 임시 그린 뒤 위치 보정 대신 고정 우측 정렬)
      var self = this;
      // 1차: 좌상단 0,0 기준으로 크기 측정용 호출은 비용↑ → Minimap.draw 가 W 반환하므로
      // originX 를 화면폭 - 추정폭으로. 추정: cols*(CELL+GAP). 안전 여백 포함.
      var originX = PD.DESIGN_W - 150, originY = 110;
      PD.Minimap.draw(this.miniG, {
        graph: st.graph, current: st.current, visited: st.visited, cleared: st.cleared,
        originX: originX, originY: originY,
        textFactory: function (badges) { self.miniBadgeFactory(badges); }
      });
    },

    update: function () {
      var self = this;
      var RUN = PD.RUN;
      // 조이스틱 → 이동 입력
      var m = this.joy.state.move;
      GAME_INPUT.moveX = m.x; GAME_INPUT.moveY = m.y;

      // 버튼 폴링(우측 영역 멀티터치)
      var ptrs = this.input.manager.pointers;
      var pressed = { dodge: false, skill1: false, skill2: false, ult: false };
      for (var i = 0; i < ptrs.length; i++) {
        var p = ptrs[i]; if (!p.isDown) continue;
        for (var b = 0; b < this.buttons.length; b++) {
          var btn = this.buttons[b];
          var dx = p.x - btn.x, dy = p.y - btn.y;
          if (dx * dx + dy * dy <= (btn.r + 10) * (btn.r + 10)) pressed[btn.id] = true;
        }
      }
      GAME_INPUT.dodge = pressed.dodge; GAME_INPUT.skill1 = pressed.skill1; GAME_INPUT.skill2 = pressed.skill2; GAME_INPUT.ult = pressed.ult;

      // 버튼 그리기 + 쿨다운
      var kit = window.GAME_ABILITIES;
      this.g.clear();
      this.buttons.forEach(function (btn) {
        var active = pressed[btn.id];
        var cdf = kit ? kit.cooldownFrac(btn.ability) : 0;
        var ready = kit ? kit.isReady(btn.ability) : true;
        // 자원 체크
        var ab = kit && kit.get(btn.ability);
        var lowRes = false;
        if (ab && ab.resource && ab.cost) lowRes = kit.getResource(ab.resource) < ab.cost;
        self.g.fillStyle(btn.color, active ? 0.42 : 0.18);
        self.g.lineStyle(3, btn.color, (ready && !lowRes) ? 0.95 : 0.4);
        self.g.fillCircle(btn.x, btn.y, btn.r);
        self.g.strokeCircle(btn.x, btn.y, btn.r);
        // 쿨다운 파이
        if (cdf > 0) {
          self.g.fillStyle(INK_INT, 0.5);
          self.g.slice(btn.x, btn.y, btn.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cdf, false);
          self.g.fillPath();
        }
        self.labels[btn.id].setAlpha((ready && !lowRes) ? 1 : 0.45);
        // 닷지 충전 수 표시
        if (btn.id === 'dodge' && kit) self.cdText[btn.id].setText(kit.chargesLeft('dodge_roll') + '/' + (kit.byId.dodge_roll.charges || 2));
        else self.cdText[btn.id].setText('');
      });

      // 상단 HUD
      if (!RUN) return;
      this.floorText.setText('지하 ' + RUN.floor + '층');
      this.coinText.setText('◉ ' + RUN.coins);
      this.drawTopHud(kit);
      // 아이템 목록
      this.itemText.setText(this.itemSummary());
      // 보스 이름
      this.bossNameText.setText(RUN.boss ? RUN.bossName : '');
      // (L6c) 미니맵 갱신
      this.drawMinimap();
    },

    drawTopHud: function (kit) {
      var RUN = PD.RUN;
      var g = this.hudG; g.clear();
      // 하트
      var hx0 = 16, hy = 22;
      for (var i = 0; i < RUN.maxHp; i++) {
        var filled = i < RUN.hp;
        g.fillStyle(filled ? roleInt('danger') : rampInt('steel', 1), filled ? 1 : 0.7);
        // 하트 모양 근사(두 원 + 삼각)
        var cx = hx0 + i * 22 + 8, cy = hy;
        g.fillCircle(cx - 4, cy - 2, 4.4); g.fillCircle(cx + 4, cy - 2, 4.4);
        g.fillTriangle(cx - 8, cy, cx + 8, cy, cx, cy + 9);
      }
      // 기력 바(사각 도트 결)
      var ex = 16, ey = 44, ew = 120, eh = 8;
      var er = kit ? kit.getResource('energy') / kit.getResourceMax('energy') : 0;
      g.fillStyle(rampInt('steel', 0), 0.9); g.fillRect(ex, ey, ew, eh);
      g.fillStyle(rampInt('hero', 2), 0.95); g.fillRect(ex, ey, Math.max(0, ew * er), eh);
      g.lineStyle(1, rampInt('hero', 2), 0.6); g.strokeRect(ex, ey, ew, eh);
      // 보스 HP 바
      if (RUN.boss) {
        var bw = DESIGN_W - 120, bx = 60, by = 78;
        g.fillStyle(rampInt('scarlet', 0), 0.9); g.fillRect(bx, by, bw, 12);
        g.fillStyle(roleInt('danger'), 0.95); g.fillRect(bx, by, Math.max(0, bw * RUN.bossHpFrac), 12);
        g.lineStyle(2, rampInt('scarlet', 3), 0.7); g.strokeRect(bx, by, bw, 12);
      }
    },

    itemSummary: function () {
      var RUN = PD.RUN;
      if (!RUN || !RUN.items.length) return '';
      var counts = RUN.itemCounts, parts = [];
      Object.keys(counts).forEach(function (id) {
        var it = ITEM_BY_ID[id]; if (!it) return;
        parts.push(it.name + (counts[id] > 1 ? '×' + counts[id] : ''));
      });
      return '🎒 ' + parts.join(' · ');
    }
  });
})();
