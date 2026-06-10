/* ============================================================================
 * 팡팡 던전 — WorldMapScene (구멍 수직 단면도 + 10지역 체크포인트)
 * ----------------------------------------------------------------------------
 * 플랜 §2.1 WorldMap + §3 Phase 2 L7.
 *
 * 레이아웃: 세로 스크롤 단면도 — 위(마을 입구, 밝음) → 아래(별의 심장, 어둠+별빛).
 *   STYLE 램프 수직 라이팅: 위쪽은 torch/stone 밝은 계열, 내려갈수록 어두워지고
 *   star-heart(region-10) 부근에서 gold 별빛으로 다시 밝아지는 STYLE.md 램프 그라디언트.
 *
 * 진입: ?worldmap=1 쿼리 또는 scene.start('WorldMap')
 * 씬 등록: core.js PD.scenes.WorldMap — concat 패턴(SpikeMaze 와 동일).
 *
 * 던전 진입 폴백(Dungeon 씬 미구현 단계):
 *   - PD.scenes.Dungeon / game.scene.getScene('Dungeon') 존재 시 → 'Dungeon' 으로 전환
 *   - 없으면 콘솔 로그 + 토스트 후 유지
 * Village 복귀:
 *   - game.scene.getScene('Village') 존재 시 → 'Village' 전환
 *   - 없으면 'Title' 폴백
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = window.PD;
  var DESIGN_W = PD.DESIGN_W, DESIGN_H = PD.DESIGN_H;
  var WHITE = PD.WHITE, INK = PD.INK;
  var WHITE_INT = PD.WHITE_INT, INK_INT = PD.INK_INT;
  var ROLE = PD.ROLE;
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt, rgba = PD.rgba;

  // world.data.js 가 먼저 로드돼 있어야 함
  var WORLD = window.POP_WORLD;

  // ── 레이아웃 상수 ────────────────────────────────────────────────────────────
  var PANEL_W = 460;                   // 지역 카드 너비
  var PANEL_H = 130;                   // 지역 카드 높이
  var PANEL_X = (DESIGN_W - PANEL_W) / 2;  // 좌측 기준 x
  var PANEL_GAP = 18;                  // 카드 간격
  var HEADER_H = 100;                  // 상단 헤더(제목+백버튼) 높이
  var SCROLL_PAD_TOP = 20;             // 헤더 아래 여유
  var SCROLL_PAD_BOT = 40;            // 최하단 여유

  // 단면도 세로 전체 높이 — 10개 카드 + 간격 + 패딩
  var CONTENT_H = SCROLL_PAD_TOP + (PANEL_H + PANEL_GAP) * 10 - PANEL_GAP + SCROLL_PAD_BOT;
  var SCROLL_MAX = Math.max(0, CONTENT_H - (DESIGN_H - HEADER_H));

  // ── 지역별 테마 → 팔레트 키 매핑 ─────────────────────────────────────────────
  // world.data.js theme.ramp 는 style.data.js ramps 와 직접 매핑되지 않는 키(parchment, crystal 등)도
  // 있으므로, 수동 fallback 테이블로 정합시킨다.
  var REGION_RAMP = {
    'stone':     { bg: 'stone', accent: 'steel',  nameIdx: 2, accentIdx: 3 },
    'torch':     { bg: 'torch', accent: 'gold',   nameIdx: 2, accentIdx: 3 },
    'steel':     { bg: 'steel', accent: 'hero',   nameIdx: 1, accentIdx: 2 },
    'violet':    { bg: 'arcane',accent: 'arcane', nameIdx: 1, accentIdx: 3 },
    'parchment': { bg: 'gold',  accent: 'torch',  nameIdx: 1, accentIdx: 2 },
    'crystal':   { bg: 'hero',  accent: 'steel',  nameIdx: 2, accentIdx: 3 },
    'ink':       { bg: 'stone', accent: 'arcane', nameIdx: 0, accentIdx: 2 },
    'starlight': { bg: 'gold',  accent: 'gold',   nameIdx: 2, accentIdx: 4 }
  };

  // 지역 ramp 키 → 실제 팔레트 항목 결정(world.data theme.ramp → REGION_RAMP)
  function regionTheme(region) {
    var rampKey = (region.theme && region.theme.ramp) || 'stone';
    return REGION_RAMP[rampKey] || REGION_RAMP['stone'];
  }

  // ── 깊이에 따른 배경색 라이팅 램프 ─────────────────────────────────────────────
  // order 1(밝음/torch) → order 9(가장 어두운 stone) → order 10(별빛 gold)
  function depthBgColor(order) {
    if (order <= 1) return rampInt('torch', 2);       // 입구: 따뜻한 횃불
    if (order <= 3) return rampInt('stone', 1);       // 얕은 층: 돌 어둠 밝음
    if (order <= 5) return rampInt('stone', 1);       // 중반: 돌 어둠
    if (order <= 7) return rampInt('stone', 0);       // 깊은 층: 매우 어두운 돌
    if (order <= 9) return rampInt('stone', 0);       // 거의 바닥: 칠흑
    return rampInt('gold', 0);                        // region-10: 별의 심장 — 황금 어둠
  }

  // ── 지역 카드 배경 알파(잠김 시 낮춤) ──────────────────────────────────────────
  function cardAlpha(unlocked) { return unlocked ? 1.0 : 0.45; }

  // ── WorldMap 씬 ─────────────────────────────────────────────────────────────
  PD.scenes.WorldMap = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function WorldMapScene() {
      Phaser.Scene.call(this, { key: 'WorldMap' });
    },

    create: function () {
      var self = this;
      var W = DESIGN_W, H = DESIGN_H;

      // ── 세이브에서 체크포인트 읽기 ────────────────────────────────────────────
      // checkpoint: 0 = 아직 없음(region-01만 해금), N = N번 지역까지 클리어
      var save = (PD.SaveStore && PD.SaveStore.load) ? PD.SaveStore.load() : (PD.SAVE || {});
      var checkpoint = (save && typeof save.checkpoint === 'number') ? save.checkpoint : 0;
      var bestFloor  = (save && typeof save.bestFloor  === 'number') ? save.bestFloor  : 0;

      // region order N은 checkpoint >= N-1 이면 해금 (region-01은 항상 해금)
      function isUnlocked(region) {
        var order = region.order;
        if (order <= 1) return true;
        return checkpoint >= (order - 1);
      }
      // 도달 최고 층(지역 범위 내)
      function regionBestFloor(region) {
        var lo = region.floors[0], hi = region.floors[1];
        if (bestFloor < lo) return 0;
        return Math.min(bestFloor, hi) - lo + 1;  // 지역 내 도달 층 수
      }

      // ── 배경(전체 단면도 어둠) ──────────────────────────────────────────────────
      this.cameras.main.setBackgroundColor('#10131f');

      // ── 고정 헤더(스크롤과 무관) ─────────────────────────────────────────────
      var headerBg = this.add.graphics().setScrollFactor(0).setDepth(20);
      headerBg.fillStyle(INK_INT, 0.92);
      headerBg.fillRect(0, 0, W, HEADER_H);
      // 헤더 하단 구분선
      headerBg.lineStyle(1, rampInt('stone', 2), 0.5);
      headerBg.lineBetween(0, HEADER_H, W, HEADER_H);

      // 타이틀
      this.add.text(W / 2, 28, '구멍 단면도', {
        fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '26px', color: WHITE
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

      this.add.text(W / 2, 60, '지역을 선택해 던전에 진입하세요', {
        fontFamily: 'sans-serif', fontSize: '13px', color: ramp('steel', 3)
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

      // 체크포인트 표시
      var cpLabel = checkpoint > 0
        ? ('체크포인트: ' + checkpoint + '지역 클리어')
        : '아직 클리어한 지역 없음';
      this.add.text(W / 2, 82, cpLabel, {
        fontFamily: 'sans-serif', fontSize: '12px', color: ramp('gold', 2)
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

      // 백 버튼
      var backBtn = this.add.text(30, 30, '< 마을', {
        fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '18px',
        color: ramp('torch', 3), backgroundColor: rgba(ramp('stone', 0), 0.7),
        padding: { x: 10, y: 6 }
      }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(22).setInteractive({ useHandCursor: true });
      backBtn.on('pointerover',  function () { backBtn.setAlpha(0.75); });
      backBtn.on('pointerout',   function () { backBtn.setAlpha(1.0);  });
      backBtn.on('pointerdown',  function () { self._goVillage(); });

      // ── 스크롤 컨테이너(카메라 scrollY로 구현) ─────────────────────────────────
      this._scrollY = 0;
      this._scrollMax = SCROLL_MAX;
      // 마스크: 헤더 아래 영역만 보이게
      var mask = this.add.graphics();
      mask.fillRect(0, HEADER_H, W, H - HEADER_H);

      // ── 지역 카드 그리기 ────────────────────────────────────────────────────────
      var regions = (WORLD && WORLD.regions) ? WORLD.regions : [];
      var cards = [];  // 클릭 인터랙션용

      regions.forEach(function (region) {
        var idx     = region.order - 1;  // 0-based
        var unlocked = isUnlocked(region);
        var cardY   = HEADER_H + SCROLL_PAD_TOP + idx * (PANEL_H + PANEL_GAP);
        var theme   = regionTheme(region);
        var bgCol   = depthBgColor(region.order);
        var alpha   = cardAlpha(unlocked);

        // ── 카드 배경 ─────────────────────────────────────────────────────────
        var cardG = self.add.graphics();
        cardG.setAlpha(alpha);

        // 배경 채우기 (깊이에 따라 어두워지는 배경)
        cardG.fillStyle(bgCol, 0.85);
        cardG.fillRect(PANEL_X, cardY, PANEL_W, PANEL_H);

        // 테두리 — 해금 시 accent 색, 잠김 시 stone 어두운 색
        var borderCol = unlocked ? rampInt(theme.accent, theme.accentIdx) : rampInt('stone', 1);
        cardG.lineStyle(2, borderCol, unlocked ? 0.9 : 0.4);
        cardG.strokeRect(PANEL_X, cardY, PANEL_W, PANEL_H);

        // ── 깊이 수직 가이드라인(왼쪽 5px 컬러 스트라이프) ────────────────────────
        var stripeCol = unlocked ? rampInt(theme.bg, theme.nameIdx) : rampInt('stone', 0);
        cardG.fillStyle(stripeCol, unlocked ? 1 : 0.3);
        cardG.fillRect(PANEL_X, cardY, 5, PANEL_H);

        // ── 지역 번호 배지 ─────────────────────────────────────────────────────
        var badgeCol = unlocked ? rampInt(theme.accent, theme.accentIdx) : rampInt('stone', 2);
        cardG.fillStyle(badgeCol, unlocked ? 0.9 : 0.35);
        cardG.fillRect(PANEL_X + 14, cardY + 12, 36, 36);

        // 번호 텍스트
        self.add.text(PANEL_X + 32, cardY + 30, String(region.order), {
          fontFamily: 'monospace', fontStyle: 'bold', fontSize: '20px', color: unlocked ? WHITE : ramp('stone', 3)
        }).setOrigin(0.5).setAlpha(alpha);

        // ── 지역명 ────────────────────────────────────────────────────────────
        var nameColor = unlocked ? ramp(theme.bg === 'torch' ? 'torch' : 'steel', 4) || WHITE : ramp('stone', 3);
        if (!ramp(theme.bg, 4)) nameColor = WHITE;
        self.add.text(PANEL_X + 62, cardY + 22, region.name, {
          fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '17px',
          color: unlocked ? WHITE : ramp('stone', 3)
        }).setOrigin(0, 0.5).setAlpha(alpha);

        // ── 층 범위 ────────────────────────────────────────────────────────────
        self.add.text(PANEL_X + 62, cardY + 45, region.floors[0] + '~' + region.floors[1] + '층', {
          fontFamily: 'monospace', fontSize: '13px', color: ramp('steel', 2)
        }).setOrigin(0, 0.5).setAlpha(alpha);

        // ── 바이옴 설명 / 잠금 안내 ───────────────────────────────────────────
        if (unlocked) {
          var rfBest = regionBestFloor(region);
          var progressTxt = rfBest > 0
            ? ('최고 도달: ' + rfBest + '층 / 10층')
            : '미진입';
          self.add.text(PANEL_X + 62, cardY + 65, progressTxt, {
            fontFamily: 'sans-serif', fontSize: '12px', color: ramp('gold', 2)
          }).setOrigin(0, 0.5);

          // 보스명
          self.add.text(PANEL_X + PANEL_W - 16, cardY + 22, '보스: ' + region.boss.name, {
            fontFamily: 'sans-serif', fontSize: '11px', color: ramp('scarlet', 2)
          }).setOrigin(1, 0.5);

          // starTrace 힌트
          self.add.text(PANEL_X + PANEL_W - 16, cardY + 43, region.starTrace.desc, {
            fontFamily: 'sans-serif', fontSize: '10px', color: ramp('steel', 2),
            wordWrap: { width: 200 }
          }).setOrigin(1, 0);

          // ── 던전 진입 버튼 ─────────────────────────────────────────────────
          var enterBtn = self.add.text(PANEL_X + PANEL_W - 16, cardY + PANEL_H - 20, '▶ 진입', {
            fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '15px',
            color: ramp('torch', 3),
            backgroundColor: rgba(ramp('torch', 0), 0.8),
            padding: { x: 10, y: 5 }
          }).setOrigin(1, 1).setInteractive({ useHandCursor: true });

          // 클로저로 region 값 캡처
          (function (reg) {
            enterBtn.on('pointerover',  function () { enterBtn.setAlpha(0.75); });
            enterBtn.on('pointerout',   function () { enterBtn.setAlpha(1.0);  });
            enterBtn.on('pointerdown',  function () { self._enterDungeon(reg); });
          })(region);

          cards.push({ region: region, btn: enterBtn });
        } else {
          // 잠금 아이콘 + 힌트
          self.add.text(PANEL_X + PANEL_W / 2, cardY + PANEL_H / 2 - 8, '🔒', {
            fontSize: '28px'
          }).setOrigin(0.5).setAlpha(0.6);

          var prevRegionName = regions[idx - 1] ? regions[idx - 1].name : '';
          self.add.text(PANEL_X + PANEL_W / 2, cardY + PANEL_H / 2 + 22, prevRegionName + ' 클리어 후 해금', {
            fontFamily: 'sans-serif', fontSize: '11px', color: ramp('stone', 3)
          }).setOrigin(0.5).setAlpha(0.7);
        }

        // ── 별빛 파티클(region-10 — 별의 심장) ───────────────────────────────
        if (region.order === 10 && unlocked) {
          var starG = self.add.graphics();
          for (var si = 0; si < 12; si++) {
            var sx = PANEL_X + 10 + (si * 41) % (PANEL_W - 20);
            var sy2 = cardY + 8 + (si * 17) % (PANEL_H - 16);
            starG.fillStyle(rampInt('gold', 3), 0.7 + (si % 3) * 0.1);
            starG.fillRect(sx, sy2, 2, 2);
          }
          // 반짝임 트윈
          self.tweens.add({ targets: starG, alpha: 0.3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: 200 });
        }

        // ── 연결선(지역 사이 수직 연결) ────────────────────────────────────────
        if (idx < regions.length - 1) {
          var connG = self.add.graphics();
          var connAlpha = (unlocked && isUnlocked(regions[idx + 1])) ? 0.5 : 0.15;
          connG.lineStyle(2, rampInt('stone', 2), connAlpha);
          var connX = PANEL_X + PANEL_W / 2;
          connG.lineBetween(connX, cardY + PANEL_H, connX, cardY + PANEL_H + PANEL_GAP);
          // 화살표 다운
          connG.fillStyle(rampInt('stone', 2), connAlpha);
          connG.fillTriangle(
            connX - 5, cardY + PANEL_H + PANEL_GAP - 6,
            connX + 5, cardY + PANEL_H + PANEL_GAP - 6,
            connX,     cardY + PANEL_H + PANEL_GAP - 1
          );
        }
      });

      // ── 최상단 마을 레이블 ─────────────────────────────────────────────────────
      var topY = HEADER_H + SCROLL_PAD_TOP - 16;
      self.add.text(W / 2, topY, '▲ 솔뫼 마을 입구', {
        fontFamily: 'sans-serif', fontSize: '12px', color: ramp('torch', 3)
      }).setOrigin(0.5);

      // ── 최하단 별의 심장 레이블 ────────────────────────────────────────────────
      var botY = HEADER_H + SCROLL_PAD_TOP + 10 * (PANEL_H + PANEL_GAP);
      self.add.text(W / 2, botY, '▼ 별의 심장 (100층)', {
        fontFamily: 'sans-serif', fontSize: '12px', color: ramp('gold', 3)
      }).setOrigin(0.5);

      // ── 스크롤 입력 ──────────────────────────────────────────────────────────
      // 터치/드래그 스크롤
      var dragStartY = null, dragCamStart = 0;
      this.input.on('pointerdown', function (p) {
        // 헤더 영역(y < HEADER_H)은 드래그 무시
        if (p.y < HEADER_H) return;
        dragStartY   = p.y;
        dragCamStart = self._scrollY;
      });
      this.input.on('pointermove', function (p) {
        if (dragStartY === null) return;
        if (!p.isDown) { dragStartY = null; return; }
        var delta = dragStartY - p.y;
        self._setScroll(dragCamStart + delta);
      });
      this.input.on('pointerup', function () { dragStartY = null; });
      this.input.on('pointerupoutside', function () { dragStartY = null; });

      // 마우스 휠 스크롤
      this.input.on('wheel', function (ptr, objs, dx, dy) {
        self._setScroll(self._scrollY + dy * 0.7);
      });

      // 키보드 스크롤(방향키)
      var cursors = this.input.keyboard.createCursorKeys();
      this._cursors = cursors;

      // 백 제스처(안드로이드 — MobileHarness 백버튼 이벤트)
      var backKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      backKey.on('down', function () { self._goVillage(); });

      // ?worldmap=1 디버그 진입 표시
      if (/[?&]worldmap=1/.test(location.search)) {
        console.log('[WorldMap] 쿼리 직행 진입 (체크포인트=' + checkpoint + ')');
      }
    },

    // ── update ─────────────────────────────────────────────────────────────────
    update: function () {
      var speed = 8;
      if (this._cursors) {
        if (this._cursors.up.isDown)   this._setScroll(this._scrollY - speed);
        if (this._cursors.down.isDown) this._setScroll(this._scrollY + speed);
      }
    },

    // ── 헬퍼: 스크롤 위치 설정 ─────────────────────────────────────────────────
    _setScroll: function (y) {
      this._scrollY = Math.max(0, Math.min(this._scrollMax, y));
      // 헤더 아래 콘텐츠만 카메라 스크롤(헤더는 scrollFactor 0으로 고정)
      this.cameras.main.scrollY = this._scrollY;
    },

    // ── 헬퍼: 던전 진입 ────────────────────────────────────────────────────────
    _enterDungeon: function (region) {
      // PD.RUN 에 선택 지역 기록
      if (!PD.RUN) {
        PD.SAVE = PD.SaveStore ? PD.SaveStore.load() : (PD.SAVE || {});
        PD.RUN  = PD.freshRun ? PD.freshRun() : {};
      }
      PD.RUN.region    = region.order;
      PD.RUN.floor     = region.floors[0];  // 해당 지역 1층부터
      PD.RUN.regionId  = region.id;
      console.log('[WorldMap] 던전 진입 → ' + region.name + ' (' + region.floors[0] + '층)');

      var sm = this.scene;
      // Phaser 4 ScenePlugin 은 getScene 이 없고 get 만 있다(다른 씬들과 동일 계약)
      if (sm.get('Dungeon')) {
        sm.start('Dungeon');
      } else {
        // Dungeon 씬 미구현 단계 폴백
        console.log('[WorldMap] Dungeon 씬 미등록 — 통합 시 자동 연결 예정');
        this._toastShow('던전 씬 준비 중 (통합 후 연결)', rampInt('torch', 3));
      }
    },

    // ── 헬퍼: 마을 복귀 ────────────────────────────────────────────────────────
    _goVillage: function () {
      var sm = this.scene;
      // Phaser 4 ScenePlugin 은 getScene 이 없고 get 만 있다
      if (sm.get('Village')) {
        sm.start('Village');
      } else {
        sm.start('Title');
      }
    },

    // ── 헬퍼: 토스트 메시지 ────────────────────────────────────────────────────
    _toastShow: function (msg, colorInt) {
      var self = this;
      var W = DESIGN_W;
      if (this._toast) { this._toast.destroy(); }
      var hexColor = '#' + ((colorInt || WHITE_INT) >>> 0).toString(16).padStart(6, '0');
      this._toast = this.add.text(W / 2, DESIGN_H - 120, msg, {
        fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '16px',
        color: hexColor,
        backgroundColor: rgba(ramp('stone', 0), 0.85),
        padding: { x: 14, y: 8 }
      }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(1);
      this.tweens.add({
        targets: this._toast, alpha: 0, y: DESIGN_H - 150,
        delay: 1200, duration: 600,
        onComplete: function () { if (self._toast) { self._toast.destroy(); self._toast = null; } }
      });
    }
  });

  // ── ?worldmap=1 쿼리 분기 지원 — Boot 가 읽어 직행 ────────────────────────────
  // Boot.js 와 동일한 패턴: PD.WORLDMAP 플래그를 세팅, core.js boot() 에서 concat 처리.
  PD.WORLDMAP = /[?&]worldmap=1/.test(location.search);

})();
