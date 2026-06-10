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
      // Phase 2 Village: ?village=1 이면 Title 대신 Village 로 직행(개발 테스트)
      if (PD.VILLAGE && PD.scenes.Village) { this.scene.start('Village'); return; }
      // L6a 던전 직행: ?dungeon=1[&region=N&floor=M] 이면 Title 대신 Dungeon 으로(개발 진입).
      //   RUN 을 셋업하고 HUD 도 함께 띄운다(Title.start 와 동일 계약).
      if (PD.DUNGEON_DIRECT && PD.scenes.Dungeon) {
        var qs = new URLSearchParams(location.search);
        PD.SAVE = PD.SAVE || (PD.SaveStore ? PD.SaveStore.load() : {});
        PD.RUN = PD.freshRun ? PD.freshRun() : {};
        var region = parseInt(qs.get('region'), 10); if (region > 0) PD.RUN.region = region;
        var floor = parseInt(qs.get('floor'), 10); if (floor > 0) PD.RUN.floor = floor;
        if (GAME_AUDIO.unlock) { GAME_AUDIO.unlock(); GAME_AUDIO.startBgm && GAME_AUDIO.startBgm(); }
        this.scene.start('Dungeon');
        this.scene.launch('HUD');
        return;
      }
      this.scene.start('Title');
    }
  });
})();
