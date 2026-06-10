/* ============================================================================
 * 팡팡 던전 — ResultScene (게임오버 / 승리 요약 + 재도전)
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = window.PD;
  var DESIGN_W = PD.DESIGN_W, DESIGN_H = PD.DESIGN_H;
  var ROLE = PD.ROLE, WHITE = PD.WHITE, INK = PD.INK;
  var ramp = PD.ramp, rampInt = PD.rampInt;
  var STORY_TEXT = PD.STORY_TEXT;
  var GAME_AUDIO = PD.GAME_AUDIO;

  PD.scenes.Result = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function ResultScene() { Phaser.Scene.call(this, { key: 'Result' }); },
    create: function (data) {
      var META = PD.META;
      var W = DESIGN_W, H = DESIGN_H, cx = W / 2;
      var win = data && data.win;
      this.cameras.main.setBackgroundColor(win ? PD.FLOOR_BG[2] : PD.FLOOR_BG[3]);
      this.add.text(cx, H * 0.28, win ? '별이 떠오른 밤' : '게임 오버', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: win ? '46px' : '52px', color: win ? ROLE.ui_accent : ramp('scarlet', 2) }).setOrigin(0.5).setShadow(0, 4, INK, 4);
      // 승패 카드 (STORY.md §7 T4 転+結 / T5 별빛 송환)
      if (win) {
        this.add.text(cx, H * 0.28 + 44, STORY_TEXT.win1 + '\n' + STORY_TEXT.win2, { fontFamily: 'sans-serif', fontSize: '15px', color: ROLE.pickup, align: 'center', lineSpacing: 6, wordWrap: { width: 440 } }).setOrigin(0.5, 0);
      } else {
        this.add.text(cx, H * 0.28 + 44, STORY_TEXT.lose, { fontFamily: 'sans-serif', fontSize: '14px', color: ramp('steel', 3), align: 'center', wordWrap: { width: 420 } }).setOrigin(0.5, 0);
      }

      var hero = this.add.sprite(cx, win ? H * 0.50 : H * 0.46, 'hero', 0).setScale(3); hero.play('hero-idle');
      if (!win) hero.setTint(rampInt('steel', 2)).setAngle(180);
      if (win) {
        // 떠오르는 별 (STORY.md §7 거울쌍 — 떨어진 별이 돌아간다)
        var star = this.add.text(cx, H * 0.50 - 56, '✦', { fontFamily: 'sans-serif', fontSize: '24px', color: ramp('gold', 2) }).setOrigin(0.5).setShadow(0, 2, INK, 4);
        this.tweens.add({ targets: star, y: H * 0.50 - 88, duration: 2600, ease: 'Sine.out' });
        this.tweens.add({ targets: star, alpha: 0.45, duration: 650, yoyo: true, repeat: -1 });
      }

      var lines = [
        '도달: 지하 ' + (data ? data.floor : 1) + '층',
        '처치: ' + (data ? data.kills : 0) + '마리',
        '코인: ◉ ' + (data ? data.coins : 0),
        '최고 기록: 지하 ' + META.bestFloor + '층'
      ];
      this.add.text(cx, H * 0.62, lines.join('\n'), { fontFamily: 'sans-serif', fontSize: '20px', color: WHITE, align: 'center', lineSpacing: 8 }).setOrigin(0.5);

      var tip = this.add.text(cx, H * 0.82, '탭하여 다시 도전', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '24px', color: WHITE }).setOrigin(0.5);
      this.tweens.add({ targets: tip, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

      var self = this, go = false;
      function restart() {
        if (go) return; go = true;
        PD.RUN = PD.freshRun(); META.runs++; PD.saveMeta();
        if (GAME_AUDIO.setSection) GAME_AUDIO.setSection('combat');
        self.scene.start('Dungeon'); self.scene.launch('HUD');   // L6a: GameScene → Dungeon
      }
      this.time.delayedCall(600, function () {
        self.input.once('pointerdown', restart);
        self.input.keyboard.once('keydown-SPACE', restart);
      });
    }
  });
})();
