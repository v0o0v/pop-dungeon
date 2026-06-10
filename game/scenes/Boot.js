/* ============================================================================
 * 팡팡 던전 — BootScene (아트 베이크, 씬 등록, DOM 가드)
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = window.PD;
  var GAME_AUDIO = PD.GAME_AUDIO;

  PD.scenes.Boot = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function BootScene() { Phaser.Scene.call(this, { key: 'Boot' }); },
    create: function () {
      PD.bakeArt(this);
      MobileHarness.installDomGuards();
      MobileHarness.onResume(function () { if (GAME_AUDIO.resume) GAME_AUDIO.resume(); });
      this.scene.start('Title');
    }
  });
})();
