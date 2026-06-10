/* ============================================================================
 * 팡팡 던전 — VillageScene (솔뫼 마을 허브, Hades식)
 * ----------------------------------------------------------------------------
 * 마을 = 영속 진행의 거점. 밤하늘 + 따뜻한 창문 불빛 무드(STYLE torchlit 상속하되
 * Village 는 지상 밤 풍경). NPC 6종을 배치하고, 터치 접근 시 대화→기능 진입.
 * 하단 "출정" → WorldMap, 좌상 인벤토리 버튼.
 *
 * 7기능 = NPC 대화 1 + 진입점 6(상점·스킬사범·스탯·대장간·퀘스트·도감).
 * 각 기능은 game/ui/*.js 모달 모듈이 담당(Village 는 배치·진입·배경만).
 *
 * 진입 흐름:
 *   - Title "탭하여 시작" → 첫 실행/세이브 무관하게 Village(본 흐름은 Title 이 호출).
 *   - Result(죽음/클리어) → Village 복귀.
 *   - ?village=1 쿼리 → Boot 가 Village 직행(개발 테스트).
 *
 * 백버튼(native.js): PD.SCENES.VILLAGE 등록 → Village 에서 백 = 종료 확인.
 *   모달은 game/ui/Modal.js 가 PD.backStack 에 push/pop.
 *
 * 아트: VectorForge.bake(ss:1) 로 NPC·집·달 도트 텍스처를 자체 베이크
 *   (art.js 와 같은 PX 1px 패턴, 파일 경계 — Village 전용 키 'v_*').
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = window.PD;
  var DESIGN_W = PD.DESIGN_W, DESIGN_H = PD.DESIGN_H;
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt, rgba = PD.rgba;
  var WHITE = PD.WHITE, INK = PD.INK, ROLE = PD.ROLE;
  var WHITE_INT = PD.WHITE_INT, INK_INT = PD.INK_INT;

  // 씬 키 상수 등록(native.js 백버튼 정책이 참조)
  PD.SCENES = PD.SCENES || {};
  PD.SCENES.VILLAGE = 'Village';
  PD.SCENES.WORLDMAP = PD.SCENES.WORLDMAP || 'WorldMap';
  PD.SCENES.DUNGEON = PD.SCENES.DUNGEON || 'Dungeon';

  // 개발 직행 플래그(?village=1) — Boot 가 읽어 Title 대신 Village 로 분기(WorldMap 패턴 정합)
  PD.VILLAGE = /[?&]village=1/.test(location.search);

  // ── NPC 배치 (id → 좌표·기능. npcs.data.js 와 id 정합) ─────────────────────
  //   세로 화면: 2열 지그재그로 마을 광장에 배치. y 는 하늘/지면 사이.
  var NPC_SLOTS = [
    { id: 'elder',      x: 0.24, y: 0.42, color: 'torch',   label: '이장님',       sprite: 'v_npc_elder' },
    { id: 'shopkeeper', x: 0.72, y: 0.40, color: 'gold',    label: '잡화점',       sprite: 'v_npc_shop' },
    { id: 'stargazer',  x: 0.30, y: 0.58, color: 'arcane',  label: '별지기',       sprite: 'v_npc_star' },
    { id: 'blacksmith', x: 0.74, y: 0.58, color: 'scarlet', label: '대장간',       sprite: 'v_npc_smith' },
    { id: 'merchant',   x: 0.26, y: 0.74, color: 'hero',    label: '별엿장수',     sprite: 'v_npc_merchant' },
    { id: 'twins',      x: 0.70, y: 0.74, color: 'steel',   label: '쌍둥이',       sprite: 'v_npc_twins' }
  ];

  PD.scenes = PD.scenes || {};
  PD.scenes.Village = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function VillageScene() { Phaser.Scene.call(this, { key: 'Village' }); },

    create: function () {
      var self = this;
      var W = DESIGN_W, H = DESIGN_H, cx = W / 2;
      PD.currentScene = 'Village';
      // SAVE 보장
      PD.SAVE = PD.SAVE || (PD.SaveStore ? PD.SaveStore.load() : {});

      this.cameras.main.setBackgroundColor(PD.STYLE.master_palette.background);
      bakeVillageArt(this);
      drawNight(this, W, H);
      drawGround(this, W, H);
      drawHouses(this, W, H);

      // ── 상단 골드/스탯 배너 ──────────────────────────────────────────────
      var banner = this.add.graphics();
      banner.fillStyle(INK_INT, 0.55); banner.fillRect(0, 0, W, 46);
      banner.lineStyle(2, roleInt('ui_accent'), 0.5); banner.lineBetween(0, 46, W, 46);
      this.goldText = this.add.text(W - 16, 23, PD.UI.fmtGold(PD.SAVE.gold), { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '20px', color: ramp('gold', 2) }).setOrigin(1, 0.5);
      this.add.text(16, 14, '솔뫼 마을', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '20px', color: WHITE }).setOrigin(0, 0.5);
      this.add.text(16, 33, '별이 떨어진 밤', { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 3) }).setOrigin(0, 0.5);

      // 인벤토리 버튼(좌상 배너 아래)
      this.invBtn = PD.UI.button(this, 60, 70, 108, 34, '🎒 인벤토리', function () { PD.UI.openInventory(self); }, { fontSize: '14px', fill: rampInt('steel', 1), stroke: roleInt('ui_accent') });

      // 진행 요약(미니 포인트 표시 — 미사용 포인트가 있으면 강조)
      this.hintText = this.add.text(cx, 70, '', { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('gold', 3) }).setOrigin(0.5);
      this.refreshHints();

      // ── NPC 배치 ─────────────────────────────────────────────────────────
      NPC_SLOTS.forEach(function (slot) { self.placeNpc(slot); });

      // ── 하단 출정 버튼 ───────────────────────────────────────────────────
      var sortie = PD.UI.button(this, cx, H - 56, 260, 56, '⚔  출  정', function () { self.goSortie(); }, {
        fontSize: '26px', fill: rampInt('torch', 1), stroke: rampInt('gold', 2), color: WHITE
      });
      this.add.text(cx, H - 22, '구멍 아래로 — 별이를 찾으러', { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 3) }).setOrigin(0.5);

      // 입장 인트로 토스트(처음 마을 방문 시 1회)
      if (!PD.SAVE._villageGreeted) {
        PD.SAVE._villageGreeted = true;
        if (PD.SaveStore) PD.SaveStore.save(PD.SAVE);
        this.time.delayedCall(400, function () { PD.UI.toast(self, '솔뫼 마을에 온 걸 환영해요', { y: H * 0.2 }); });
      }

      // BGM(있으면 마을 섹션)
      if (PD.GAME_AUDIO && PD.GAME_AUDIO.setSection) { try { PD.GAME_AUDIO.setSection('village'); } catch (e) {} }
    },

    // ── NPC 한 명 배치(스프라이트 + 이름표 + 기능 아이콘 + 터치 존) ──────────
    placeNpc: function (slot) {
      var self = this;
      var W = DESIGN_W, H = DESIGN_H;
      var x = slot.x * W, y = slot.y * H;
      var npc = (window.POP_NPCS && window.POP_NPCS.npcs || []).filter(function (n) { return n.id === slot.id; })[0];

      // 발밑 그림자 + 따뜻한 등불 후광
      var glow = this.add.graphics();
      glow.fillStyle(rampInt(slot.color, 2), 0.10); glow.fillCircle(x, y, 46);
      glow.fillStyle(rampInt(slot.color, 2), 0.06); glow.fillCircle(x, y, 64);

      // 스프라이트(자체 베이크 키) — 가벼운 호버 보빙
      var spr = this.add.sprite(x, y, slot.sprite).setScale(2.4);
      this.tweens.add({ targets: spr, y: y - 5, duration: 1400 + (slot.x * 600), yoyo: true, repeat: -1, ease: 'Sine.inOut' });

      // 이름표
      var tagBg = this.add.graphics();
      var tw = slot.label.length * 13 + 20;
      tagBg.fillStyle(INK_INT, 0.7); tagBg.fillRect(x - tw / 2, y + 32, tw, 22);
      tagBg.lineStyle(1, rampInt(slot.color, 2), 0.8); tagBg.strokeRect(x - tw / 2, y + 32, tw, 22);
      this.add.text(x, y + 43, slot.label, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '14px', color: ramp(slot.color, 3) }).setOrigin(0.5);

      // 기능 아이콘(머리 위 작은 표식)
      var icon = { shop: '🛒', skillmaster: '✦', stats: '🍬', forge: '🔨', questboard: '📜', codex: '📖' }[npc ? npc.func : ''] || '?';
      this.add.text(x, y - 40, icon, { fontFamily: 'sans-serif', fontSize: '18px' }).setOrigin(0.5);

      // 새 퀘스트/보상 알림 점(이장=퀘스트보드일 때 수령 가능 표시)
      if (npc && npc.func === 'questboard' && this.hasClaimable()) {
        var dot = this.add.graphics(); dot.fillStyle(rampInt('scarlet', 2), 1); dot.fillCircle(x + tw / 2 - 4, y + 32, 5);
        this.tweens.add({ targets: dot, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
      }

      // 터치 존(접근=대화)
      var z = this.add.zone(x, y, 88, 110).setInteractive();
      z.on('pointerover', function () { spr.setScale(2.6); });
      z.on('pointerout', function () { spr.setScale(2.4); });
      z.on('pointerdown', function () {
        if (PD.GAME_AUDIO && PD.GAME_AUDIO.sfx) { try { PD.GAME_AUDIO.sfx('ui'); } catch (e) {} }
        var modal = PD.UI.openDialogue(self, slot.id);
        // 모달 닫힐 때 골드/힌트 갱신
        if (modal) { var oc = modal.close; modal.close = function () { oc(); self.refreshAll(); }; }
      });
    },

    hasClaimable: function () {
      var SAVE = PD.SAVE;
      if (!SAVE.quests || !SAVE.quests.active) return false;
      var QUESTS = (window.POP_QUESTS && window.POP_QUESTS.quests) || [];
      for (var i = 0; i < SAVE.quests.active.length; i++) {
        var q = QUESTS.filter(function (x) { return x.id === SAVE.quests.active[i]; })[0];
        if (!q) continue;
        var pr = PD.UI.questProgress(SAVE, q);
        if (pr.cur >= pr.total) return true;
      }
      return false;
    },

    refreshHints: function () {
      var SAVE = PD.SAVE;
      var msgs = [];
      var sp = (SAVE.skills && SAVE.skills.points) || 0;
      if (sp > 0) msgs.push('스킬 ◆' + sp);
      if ((SAVE.statPoints || 0) > 0) msgs.push('스탯 ◆' + SAVE.statPoints);
      if (this.hasClaimable()) msgs.push('퀘스트 보상!');
      this.hintText.setText(msgs.length ? ('미사용: ' + msgs.join('  ')) : '');
    },

    refreshAll: function () {
      if (this.goldText) this.goldText.setText(PD.UI.fmtGold(PD.SAVE.gold));
      this.refreshHints();
    },

    // ── 출정 → WorldMap (없으면 직접 던전/게임 폴백) ───────────────────────
    goSortie: function () {
      var self = this;
      // 새 런 준비(영속 SAVE 기반, 휘발 RUN 초기화)
      if (PD.SaveStore && PD.SaveStore.freshRun) {
        PD.SAVE = PD.SAVE || PD.SaveStore.load();
        PD.RUN = PD.SaveStore.freshRun(PD.SAVE);
        try { PD.recomputeStats(PD.SAVE, PD.RUN); } catch (e) {}
        PD.RUN.hp = PD.RUN.maxHp;
      }
      if (PD.GAME_AUDIO && PD.GAME_AUDIO.unlock) { try { PD.GAME_AUDIO.unlock(); } catch (e) {} }
      // WorldMap 씬이 등록돼 있으면 그리로, 아니면 기존 Game 으로 폴백(점진 통합 중)
      if (this.scene.get('WorldMap')) {
        this.scene.start('WorldMap');
      } else {
        // 폴백: 던전 본체 흐름(Dungeon + HUD). 통합 전까지 출정이 무효되지 않도록.
        if (PD.GAME_AUDIO && PD.GAME_AUDIO.startBgm) { try { PD.GAME_AUDIO.startBgm(); } catch (e) {} }
        this.scene.start('Dungeon');   // L6a: GameScene → Dungeon
        this.scene.launch('HUD');
      }
    }
  });

  // ── 마을 배경: 밤하늘 + 별 + 달 ────────────────────────────────────────────
  function drawNight(scene, W, H) {
    var g = scene.add.graphics();
    // 밤하늘 그라데이션(stone 어두운 위 → 살짝 따뜻한 지평선)
    var bands = 16, top = 46, skyH = H * 0.66 - top;
    for (var i = 0; i < bands; i++) {
      var t = i / (bands - 1);
      var col = t < 0.7 ? rampInt('stone', 0) : rampInt('stone', 1);
      g.fillStyle(col, 1 - t * 0.15);
      g.fillRect(0, top + skyH * (i / bands), W, skyH / bands + 1);
    }
    // 별(클리어 수만큼 밝은 별 + 배경 잔별) — STORY §7 結 메타 회수
    var wins = (PD.SAVE && (PD.SAVE.wins || 0)) || 0;
    var starN = Math.min(wins, 20);
    for (var s = 0; s < 40; s++) {
      var sx = ((s * 137 + 31) % (W - 30)) + 15;
      var sy = top + ((s * 71 + 17) % Math.floor(skyH * 0.8)) + 8;
      var bright = s < starN;
      g.fillStyle(bright ? rampInt('gold', 3) : rampInt('steel', 2), bright ? 0.95 : 0.35);
      g.fillRect(sx, sy, bright ? 2 : 1, bright ? 2 : 1);
      if (bright) { g.fillRect(sx - 1, sy + 0.5, 1, 1); g.fillRect(sx + 2, sy + 0.5, 1, 1); }
    }
    // 달(우상)
    var mx = W * 0.78, my = top + 56;
    g.fillStyle(rampInt('gold', 3), 0.18); g.fillCircle(mx, my, 40);
    g.fillStyle(rampInt('gold', 3), 0.95); g.fillCircle(mx, my, 22);
    g.fillStyle(rampInt('gold', 2), 0.5); g.fillCircle(mx + 6, my - 4, 18);
  }

  // ── 지면(마을 광장) ────────────────────────────────────────────────────────
  function drawGround(scene, W, H) {
    var g = scene.add.graphics();
    var groundY = H * 0.64;
    g.fillStyle(rampInt('stone', 1), 1); g.fillRect(0, groundY, W, H - groundY);
    g.fillStyle(rampInt('stone', 0), 0.6); g.fillRect(0, groundY, W, 6);
    // 길(중앙 광장으로 모이는 흙길)
    g.fillStyle(rampInt('torch', 0), 0.4);
    g.fillRect(W * 0.35, groundY, W * 0.30, H - groundY);
    // 잔돌 도트
    for (var i = 0; i < 60; i++) {
      var rx = (i * 89 + 13) % W, ry = groundY + ((i * 53 + 7) % Math.floor(H - groundY));
      g.fillStyle(rampInt('stone', i % 3 === 0 ? 2 : 0), 0.4); g.fillRect(rx, ry, 2, 1);
    }
  }

  // ── 집(따뜻한 창문 불빛) ──────────────────────────────────────────────────
  function drawHouses(scene, W, H) {
    var groundY = H * 0.64;
    var houses = [
      { x: 0.10, w: 90, h: 70 }, { x: 0.85, w: 84, h: 64 },
      { x: 0.50, w: 110, h: 80 }, { x: 0.30, w: 70, h: 56 }, { x: 0.70, w: 76, h: 60 }
    ];
    houses.forEach(function (ho, idx) {
      var g = scene.add.graphics();
      var hx = ho.x * W - ho.w / 2, hy = groundY - ho.h + 4;
      // 벽
      g.fillStyle(rampInt('stone', idx % 2 ? 1 : 2), 0.85); g.fillRect(hx, hy, ho.w, ho.h);
      g.lineStyle(2, INK_INT, 0.6); g.strokeRect(hx, hy, ho.w, ho.h);
      // 지붕(삼각)
      g.fillStyle(rampInt('torch', 0), 0.9);
      g.fillTriangle(hx - 6, hy, hx + ho.w + 6, hy, hx + ho.w / 2, hy - ho.h * 0.45);
      g.lineStyle(2, INK_INT, 0.6); g.strokeTriangle(hx - 6, hy, hx + ho.w + 6, hy, hx + ho.w / 2, hy - ho.h * 0.45);
      // 창문 불빛(따뜻한 노란빛, 깜빡임)
      var winW = 14, winH = 16;
      var wins2 = [[hx + ho.w * 0.22, hy + ho.h * 0.3], [hx + ho.w * 0.62, hy + ho.h * 0.3]];
      wins2.forEach(function (p, wi) {
        var wg = scene.add.graphics();
        wg.fillStyle(rampInt('gold', 3), 0.92); wg.fillRect(p[0], p[1], winW, winH);
        wg.fillStyle(rampInt('gold', 2), 0.15); wg.fillRect(p[0] - 4, p[1] - 4, winW + 8, winH + 8);
        wg.lineStyle(1, INK_INT, 0.7); wg.strokeRect(p[0], p[1], winW, winH);
        wg.lineStyle(1, INK_INT, 0.5); wg.lineBetween(p[0] + winW / 2, p[1], p[0] + winW / 2, p[1] + winH);
        scene.tweens.add({ targets: wg, alpha: 0.78, duration: 800 + (idx * 130 + wi * 90), yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      });
    });
  }

  // ── Village 전용 도트 스프라이트 베이크 (art.js PX 패턴 정합, 키 'v_*') ──────
  function bakeVillageArt(scene) {
    if (scene.textures.exists('v_npc_elder')) return;  // 1회만
    function dot(c, x, y, col) { c.fillStyle = col; c.fillRect(x | 0, y | 0, 1, 1); }
    function bar(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x | 0, y | 0, w | 0, h | 0); }

    // 공통 2등신 치비 베이스: 몸통 + 큰 머리 + 눈. col = 의상 램프 이름.
    function chibi(ctx, w, h, opts) {
      var cx = w / 2;
      var bodyTop = h - 18, headCy = h - 24;
      // 그림자
      bar(ctx, cx - 7, h - 3, 14, 2, rgba(INK, 0.3));
      // 몸통
      bar(ctx, cx - 7, bodyTop, 14, 14, ramp(opts.body, 1));
      bar(ctx, cx - 7, bodyTop, 14, 4, ramp(opts.body, 2));  // 좌상 하이라이트 밴드
      bar(ctx, cx - 7, bodyTop, 14, 14, ramp(opts.body, 1));
      // 외곽선(몸)
      strokeRect(ctx, cx - 7, bodyTop, 14, 14, ramp(opts.body, 0));
      // 머리
      circleFill(ctx, cx, headCy, 9, ramp(opts.skin || 'gold', 2), ramp(opts.skin || 'gold', 1));
      strokeCircle(ctx, cx, headCy, 9, INK);
      // 눈
      bar(ctx, cx - 4, headCy - 1, 2, 3, WHITE); bar(ctx, cx + 2, headCy - 1, 2, 3, WHITE);
      dot(ctx, cx - 3, headCy, INK); dot(ctx, cx + 3, headCy, INK);
      // 모자/머리장식(opts.hat 색)
      if (opts.hat) { bar(ctx, cx - 9, headCy - 9, 18, 3, ramp(opts.hat, 1)); bar(ctx, cx - 6, headCy - 12, 12, 3, ramp(opts.hat, 1)); }
      // 들고 있는 도구(opts.tool)
      if (opts.tool === 'hammer') { bar(ctx, cx + 7, bodyTop + 2, 2, 8, ramp('steel', 1)); bar(ctx, cx + 5, bodyTop + 1, 6, 3, ramp('steel', 2)); }
      if (opts.tool === 'staff') { bar(ctx, cx + 8, bodyTop - 6, 2, 16, ramp('arcane', 1)); dot(ctx, cx + 9, bodyTop - 7, ramp('arcane', 3)); bar(ctx, cx + 7, bodyTop - 8, 4, 2, ramp('arcane', 3)); }
      if (opts.tool === 'candy') { bar(ctx, cx + 7, bodyTop, 2, 6, ramp('scarlet', 1)); dot(ctx, cx + 8, bodyTop - 1, ramp('scarlet', 3)); }
      // 볼터치
      dot(ctx, cx - 6, headCy + 2, ramp('torch', 2)); dot(ctx, cx + 6, headCy + 2, ramp('torch', 2));
    }
    function strokeRect(ctx, x, y, w, h, col) {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1);
      ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
    }
    function circleFill(ctx, cx, cy, r, colMid, colDark) {
      for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) {
          var t = -(x * 0.4 + y * 0.6) / r;
          ctx.fillStyle = t > 0.2 ? ramp('gold', 3) : (t > -0.3 ? colMid : colDark);
          ctx.fillRect(cx + x, cy + y, 1, 1);
        }
      }
    }
    function strokeCircle(ctx, cx, cy, r, col) {
      for (var a = 0; a < 360; a += 8) {
        var x = Math.round(cx + Math.cos(a * Math.PI / 180) * r);
        var y = Math.round(cy + Math.sin(a * Math.PI / 180) * r);
        ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1);
      }
    }

    function bakeNpc(key, opts) {
      VectorForge.bake(scene, key, {
        w: 28, h: 36, ss: 1,
        frames: [function (c, w, h) { chibi(c, w, h, opts); }]
      });
    }
    bakeNpc('v_npc_elder',    { body: 'torch',   skin: 'gold', hat: 'stone' });
    bakeNpc('v_npc_shop',     { body: 'gold',    skin: 'gold', hat: 'torch' });
    bakeNpc('v_npc_star',     { body: 'arcane',  skin: 'gold', tool: 'staff', hat: 'arcane' });
    bakeNpc('v_npc_smith',    { body: 'scarlet', skin: 'gold', tool: 'hammer' });
    bakeNpc('v_npc_merchant', { body: 'hero',    skin: 'gold', tool: 'candy', hat: 'gold' });
    bakeNpc('v_npc_twins',    { body: 'steel',   skin: 'gold' });
  }
})();
