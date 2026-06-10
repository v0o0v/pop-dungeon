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

      // 버튼 정의(우측 하단 엄지 영역) — dodge 가 가장 크고 손에 가깝다
      this.buttons = [
        { id: 'dodge', x: W - 64, y: H - 70, r: 40, label: '↻', color: rampInt('hero', 2), ability: 'dodge_roll' },
        { id: 'skill1', x: W - 142, y: H - 92, r: 28, label: '✦', color: rampInt('gold', 2), ability: 'pop_nova' },
        { id: 'skill2', x: W - 150, y: H - 158, r: 26, label: '▲', color: rampInt('torch', 2), ability: 'turbo_pop' },
        { id: 'ult', x: W - 78, y: H - 156, r: 26, label: '◆', color: roleInt('pickup'), ability: 'golden_storm' }
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
