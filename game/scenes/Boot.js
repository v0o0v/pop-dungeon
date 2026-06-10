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
      // Phase 0.5 미로 스파이크: ?spike=1 이면 Title 대신 SpikeMaze 로 직행(본편 비침습)
      if (PD.SPIKE && PD.scenes.SpikeMaze) { this.scene.start('SpikeMaze'); return; }
      // Phase 2 WorldMap: ?worldmap=1 이면 Title 대신 WorldMap 으로 직행(개발 테스트)
      if (PD.WORLDMAP && PD.scenes.WorldMap) { this.scene.start('WorldMap'); return; }
      this.scene.start('Title');
    }
  });
})();
