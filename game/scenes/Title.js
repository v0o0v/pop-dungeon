/* ============================================================================
 * 팡팡 던전 — TitleScene (타이틀 + 직업 카드 + Tap to start, 오디오 언락)
 * ----------------------------------------------------------------------------
 * 배경 불티(아트)·bark 선택(UI 표시)은 게임플레이 결정성과 무관 → Math.random 유지.
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = window.PD;
  var DESIGN_W = PD.DESIGN_W, DESIGN_H = PD.DESIGN_H;
  var STYLE = PD.STYLE, ROLE = PD.ROLE, WHITE = PD.WHITE, INK = PD.INK;
  var WHITE_INT = PD.WHITE_INT;
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt;
  var RARITY_COLOR = PD.RARITY_COLOR;
  var STORY_TEXT = PD.STORY_TEXT;
  var GAME_AUDIO = PD.GAME_AUDIO;

  PD.scenes.Title = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function TitleScene() { Phaser.Scene.call(this, { key: 'Title' }); },
    create: function () {
      var META = PD.META;
      var W = DESIGN_W, H = DESIGN_H, cx = W / 2;
      this.cameras.main.setBackgroundColor(STYLE.master_palette.background);
      // 배경 잉걸 불티(사각 도트)
      var g = this.add.graphics();
      for (var i = 0; i < 36; i++) {
        var ec = i % 3 === 0 ? rampInt('torch', 2) : (i % 3 === 1 ? rampInt('gold', 2) : rampInt('steel', 2));
        g.fillStyle(ec, 0.08 + (i % 4) * 0.03);
        g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
      }
      // 밤하늘 — 클리어 횟수만큼 별이 하나씩 늘어난다 (STORY.md §7 E2: 結의 메타 회수)
      var starN = Math.min(META.wins, 20);
      for (var s = 0; s < starN; s++) {
        var sx = ((s * 173 + 41) % (W - 60)) + 30;
        var sy = ((s * 97 + 23) % Math.floor(H * 0.14)) + 26;
        g.fillStyle(rampInt('gold', 3), 0.95); g.fillRect(sx - 1, sy, 3, 1); g.fillRect(sx, sy - 1, 1, 3);
        g.fillStyle(WHITE_INT, 1); g.fillRect(sx, sy, 1, 1);
      }
      // 벽 횃불 + 마스코트(시그니처 구도: 어둠 속 횃불빛 받은 민트 히어로)
      var t1 = this.add.sprite(cx - 120, H * 0.33, 'wtorch', 0).setScale(2); t1.play('torch-burn');
      var t2 = this.add.sprite(cx + 120, H * 0.33, 'wtorch', 1).setScale(2); t2.play({ key: 'torch-burn', startFrame: 1 });
      var hero = this.add.sprite(cx, H * 0.34, 'hero', 0).setScale(3); hero.play('hero-idle');
      this.tweens.add({ targets: hero, y: H * 0.34 - 12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      // 타이틀
      this.add.text(cx, H * 0.5, '팡팡 던전', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '60px', color: ROLE.pickup }).setOrigin(0.5).setShadow(0, 4, ramp('gold', 0), 0, true, true);
      this.add.text(cx, H * 0.5 + 48, 'POP  DUNGEON', { fontFamily: 'monospace', fontSize: '20px', color: ROLE.ui_accent }).setOrigin(0.5);
      // 서사 인트로 1/2 + 마을 주민 bark (STORY.md §7 T1·B1)
      this.add.text(cx, H * 0.5 + 78, STORY_TEXT.tagline, { fontFamily: 'sans-serif', fontSize: '15px', color: ramp('steel', 3) }).setOrigin(0.5);
      this.add.text(cx, H * 0.78, STORY_TEXT.titleBarks[Math.floor(Math.random() * STORY_TEXT.titleBarks.length)], { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 2) }).setOrigin(0.5);
      // 직업 카드
      var cardY = H * 0.62;
      var card = this.add.graphics(); card.fillStyle(rampInt('steel', 0), 0.85); card.fillRect(cx - 150, cardY, 300, 70); card.lineStyle(2, RARITY_COLOR.rare, 0.7); card.strokeRect(cx - 150, cardY, 300, 70);
      this.add.text(cx - 120, cardY + 18, '직업', { fontFamily: 'sans-serif', fontSize: '13px', color: ramp('steel', 3) }).setOrigin(0, 0.5);
      this.add.text(cx, cardY + 22, '팝거너', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '24px', color: WHITE }).setOrigin(0.5, 0.5);
      this.add.text(cx, cardY + 50, '자동조준 팝건 · 닷지롤 · 4 스킬', { fontFamily: 'sans-serif', fontSize: '13px', color: ramp('steel', 3) }).setOrigin(0.5);
      this.add.text(cx + 120, cardY - 6, '더 많은 직업 예정', { fontFamily: 'sans-serif', fontSize: '11px', color: ramp('steel', 2) }).setOrigin(1, 0.5);
      // 최고 기록
      if (META.bestFloor > 0) this.add.text(cx, H * 0.74, '최고 도달: 지하 ' + META.bestFloor + '층' + (META.wins ? '  ·  클리어 ' + META.wins + '회' : ''), { fontFamily: 'sans-serif', fontSize: '16px', color: ROLE.pickup }).setOrigin(0.5);
      // Tap to start
      var tip = this.add.text(cx, H * 0.84, '탭하여 시작', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '26px', color: WHITE }).setOrigin(0.5);
      this.tweens.add({ targets: tip, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
      this.add.text(cx, H * 0.88, '왼쪽=이동(드래그) · 자동 발사 · 우측 버튼=구르기/스킬', { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 3) }).setOrigin(0.5);

      var self = this, started = false;
      function start() {
        if (started) return; started = true;
        if (GAME_AUDIO.unlock) { GAME_AUDIO.unlock(); }
        // Hades식 허브: 탭 → 마을(Village). 출정·런 준비는 Village 가 담당.
        //   Village 미등록(점진 통합) 시 던전 직행으로 안전 폴백(L6a 흐름 보존).
        if (self.scene.get('Village')) {
          self.scene.start('Village');
          return;
        }
        if (GAME_AUDIO.startBgm) GAME_AUDIO.startBgm();
        PD.RUN = PD.freshRun();
        META.runs++; PD.saveMeta();
        self.scene.start('Dungeon');   // L6a: GameScene → Dungeon(던전 본체)
        self.scene.launch('HUD');
      }
      this.input.once('pointerdown', start);
      this.input.keyboard.once('keydown-SPACE', start);
      this.input.keyboard.once('keydown-ENTER', start);
      if (/[?&]autostart=1/.test(location.search)) this.time.delayedCall(80, start);
    }
  });
})();
