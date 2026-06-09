/* ============================================================================
 * 팡팡 던전 (Pop Dungeon) — 탑다운 불릿헬 로그라이크 (세로 모바일)
 * ----------------------------------------------------------------------------
 * 엔진: Phaser 4.1.0 (MIT) + VectorForge(절차 카툰 그래픽) + SoundForge(Tone.js 절차 사운드)
 *       + AbilityKit(스킬 런타임) + JoystickKit(아날로그 이동) + MobileHarness(웹뷰 스케일/터치).
 * 에셋·사운드·이름: 100% 코드 생성 오리지널(CC0/IP-safe). 엔터더건전 등 원작 자산 미사용.
 * 레퍼런스: game-dna/shooters-roguelite.md (닷지롤 무적·방클리어·층진행·아이템 시너지)를
 *           단일플레이 모바일 축소판으로 재현.
 * 데이터: window.POP_ABILITIES / POP_ITEMS / POP_AUDIO (data.js, 단일 소스).
 * ==========================================================================*/
(function () {
  'use strict';

  // ── 디자인 해상도 (세로 9:16) ───────────────────────────────────────────────
  var DESIGN_W = 540, DESIGN_H = 960;
  // 플레이필드(아레나): 위 HUD 밴드와 아래 컨트롤 밴드를 피한 사각형
  var ARENA = { x: 22, y: 150, w: 496, h: 668 };
  var ARENA_R = ARENA.x + ARENA.w, ARENA_B = ARENA.y + ARENA.h;

  // ── 공유 입력 (HUD 씬이 쓰고 Game 씬이 읽음) ────────────────────────────────
  var GAME_INPUT = { moveX: 0, moveY: 0, dodge: false, skill1: false, skill2: false, ult: false };

  // ── 오디오 (SoundForge, data.js 스펙) ───────────────────────────────────────
  var GAME_AUDIO = new SoundForge(window.POP_AUDIO);
  window.GAME_AUDIO = GAME_AUDIO; // mobile.js 음소거/가시성 가드가 참조

  // ── 메타 진행 (localStorage) ────────────────────────────────────────────────
  var META_KEY = 'pop-dungeon-meta-v1';
  function loadMeta() {
    try { var m = JSON.parse(localStorage.getItem(META_KEY)); if (m && typeof m === 'object') return m; } catch (e) {}
    return { bestFloor: 0, runs: 0, totalCoins: 0, wins: 0 };
  }
  function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(META)); } catch (e) {} }
  var META = loadMeta();

  // ── 런 상태 (런마다 리셋) ───────────────────────────────────────────────────
  var RUN = null;
  function freshRun() {
    return {
      floor: 1, maxHp: 4, hp: 4, coins: 0, items: [], itemCounts: {},
      stats: {}, boss: null, bossHpFrac: 0, bossName: '', kills: 0
    };
  }

  // ── 색 헬퍼 ─────────────────────────────────────────────────────────────────
  function hx(s) { return parseInt(s.replace('#', '0x')); }
  var RARITY_COLOR = { common: 0xcfd8e3, rare: 0x5ad1ff, epic: 0xc08bff, legendary: 0xffcf4a };

  // 아이템/스킬 스펙 인덱스
  var ITEM_BY_ID = {};
  (window.POP_ITEMS.items || []).forEach(function (it) { ITEM_BY_ID[it.id] = it; });
  // 런에서 뽑을 수 있는 장비/소모품 풀(통화 제외)
  var DROP_POOL = (window.POP_ITEMS.items || []).filter(function (it) { return it.kind === 'equipment' || it.kind === 'consumable'; });

  // ===========================================================================
  // VectorForge 아트 베이킹 — 귀여운 카툰 (둥근 실루엣 + 굵은 외곽선 + 글로우)
  // ===========================================================================
  function outline(ctx, fn, color, w) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = w == null ? 2 : w; ctx.strokeStyle = color || '#1a2233';
    fn(); ctx.stroke(); ctx.restore();
  }

  function bakeArt(scene) {
    var VF = VectorForge.helpers;

    // 플레이어 '팡이' — 둥근 청록 마스코트 + 큰 눈 + 작은 팝건. 2프레임 idle bob.
    function drawHero(ctx, w, h, t) {
      var cx = w / 2, bob = t ? -1.4 : 0, by = 9 + bob;
      // 그림자
      VF.ellipse(ctx, cx, h - 3, 10, 3); ctx.fillStyle = 'rgba(20,24,40,0.22)'; ctx.fill();
      // 팝건(오른쪽 작은 총)
      ctx.save();
      VF.rr(ctx, cx + 6, by + 9, 12, 5, 2.2);
      ctx.fillStyle = '#ff9f1a'; ctx.fill();
      outline(ctx, function () { VF.rr(ctx, cx + 6, by + 9, 12, 5, 2.2); }, '#1a2233', 1.6);
      ctx.restore();
      // 몸통(둥근 블롭 + 세로 그라데이션)
      VF.blob(ctx, cx, by + 8, 11, 10, 0.05, 1.2);
      ctx.fillStyle = VF.lin(ctx, cx, by - 3, cx, by + 19, [[0, '#7af0dc'], [0.55, '#33d2bd'], [1, '#1ba79c']]); ctx.fill();
      outline(ctx, function () { VF.blob(ctx, cx, by + 8, 11, 10, 0.05, 1.2); }, '#12463f', 2);
      // 배 하이라이트
      VF.ellipse(ctx, cx, by + 11, 6, 7); ctx.fillStyle = 'rgba(233,255,250,0.5)'; ctx.fill();
      // 눈
      [[-3.6, by + 6], [3.6, by + 6]].forEach(function (e) {
        VF.circle(ctx, cx + e[0], e[1], 3); ctx.fillStyle = '#ffffff'; ctx.fill();
        outline(ctx, function () { VF.circle(ctx, cx + e[0], e[1], 3); }, '#1a2233', 1);
        VF.circle(ctx, cx + e[0] + 0.6, e[1] + 0.5, 1.5); ctx.fillStyle = '#1a2233'; ctx.fill();
        VF.circle(ctx, cx + e[0] + 1.2, e[1] - 0.3, 0.6); ctx.fillStyle = '#fff'; ctx.fill();
      });
      // 볼터치 + 미소
      VF.circle(ctx, cx - 5.5, by + 9, 1.6); VF.circle(ctx, cx + 5.5, by + 9, 1.6); ctx.fillStyle = 'rgba(255,140,160,0.5)'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, by + 9, 2.2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 1.1; ctx.strokeStyle = '#12463f'; ctx.stroke();
    }
    VectorForge.bake(scene, 'hero', { w: 36, h: 38, frames: [function (c, w, h) { drawHero(c, w, h, 0); }, function (c, w, h) { drawHero(c, w, h, 1); }] });

    // 적: 슬라임(추적), 박쥐(비행), 포탑(사격), 오브(확산)
    function blobEnemy(ctx, w, h, t, top, bot, line, eyes) {
      var cx = w / 2, sq = t ? 1.0 : 1.06, by = h * 0.5;
      VF.ellipse(ctx, cx, h - 3, w * 0.32, 3); ctx.fillStyle = 'rgba(20,24,40,0.2)'; ctx.fill();
      ctx.save(); ctx.translate(cx, by); ctx.scale(1 / sq, sq); ctx.translate(-cx, -by);
      VF.blob(ctx, cx, by, w * 0.36, 9, 0.07, 2.0);
      ctx.fillStyle = VF.lin(ctx, cx, by - w * 0.4, cx, by + w * 0.4, [[0, top], [1, bot]]); ctx.fill();
      outline(ctx, function () { VF.blob(ctx, cx, by, w * 0.36, 9, 0.07, 2.0); }, line, 2);
      ctx.restore();
      // 눈
      var ex = eyes ? 3.4 : 0;
      [[-ex, by - 1], [ex, by - 1]].forEach(function (e) {
        VF.circle(ctx, cx + e[0], e[1], 2.4); ctx.fillStyle = '#fff'; ctx.fill();
        VF.circle(ctx, cx + e[0] + 0.4, e[1] + 0.3, 1.2); ctx.fillStyle = '#1a2233'; ctx.fill();
      });
    }
    VectorForge.bake(scene, 'slime', { w: 30, h: 28, frames: [function (c, w, h) { blobEnemy(c, w, h, 0, '#9be86b', '#4fae3a', '#2c6b22', true); }, function (c, w, h) { blobEnemy(c, w, h, 1, '#9be86b', '#4fae3a', '#2c6b22', true); }] });
    VectorForge.bake(scene, 'orb', { w: 28, h: 28, frames: [function (c, w, h) { blobEnemy(c, w, h, 0, '#c08bff', '#7a3fd0', '#3e1f70', true); }, function (c, w, h) { blobEnemy(c, w, h, 1, '#c08bff', '#7a3fd0', '#3e1f70', true); }] });

    function bat(ctx, w, h, t) {
      var cx = w / 2, cy = h / 2, flap = t ? -3 : 2;
      // 날개
      ctx.fillStyle = '#6b6fbf';
      VF.poly(ctx, [[cx - 3, cy], [cx - 13, cy + flap], [cx - 6, cy + 6]]); ctx.fill();
      VF.poly(ctx, [[cx + 3, cy], [cx + 13, cy + flap], [cx + 6, cy + 6]]); ctx.fill();
      outline(ctx, function () { VF.poly(ctx, [[cx - 3, cy], [cx - 13, cy + flap], [cx - 6, cy + 6]]); }, '#2f3270', 1.4);
      outline(ctx, function () { VF.poly(ctx, [[cx + 3, cy], [cx + 13, cy + flap], [cx + 6, cy + 6]]); }, '#2f3270', 1.4);
      VF.circle(ctx, cx, cy + 1, 6); ctx.fillStyle = VF.lin(ctx, cx, cy - 6, cx, cy + 7, [[0, '#9a9ee8'], [1, '#5a5eb0']]); ctx.fill();
      outline(ctx, function () { VF.circle(ctx, cx, cy + 1, 6); }, '#2f3270', 2);
      [[-2.2, cy], [2.2, cy]].forEach(function (e) { VF.circle(ctx, cx + e[0], e[1], 1.8); ctx.fillStyle = '#fff'; ctx.fill(); VF.circle(ctx, cx + e[0], e[1] + 0.3, 0.9); ctx.fillStyle = '#1a2233'; ctx.fill(); });
    }
    VectorForge.bake(scene, 'bat', { w: 30, h: 24, frames: [function (c, w, h) { bat(c, w, h, 0); }, function (c, w, h) { bat(c, w, h, 1); }] });

    function turret(ctx, w, h, t) {
      var cx = w / 2, cy = h / 2;
      VF.ellipse(ctx, cx, h - 3, 10, 3); ctx.fillStyle = 'rgba(20,24,40,0.2)'; ctx.fill();
      // 베이스
      VF.rr(ctx, cx - 10, cy - 2, 20, 12, 4); ctx.fillStyle = VF.lin(ctx, 0, cy - 2, 0, cy + 10, [[0, '#ff9f6b'], [1, '#d4583a']]); ctx.fill();
      outline(ctx, function () { VF.rr(ctx, cx - 10, cy - 2, 20, 12, 4); }, '#6e2418', 2);
      // 포신(펄스)
      var pl = t ? 9 : 7; VF.rr(ctx, cx - 2, cy - 9, 4, pl, 1.5); ctx.fillStyle = '#3a2230'; ctx.fill();
      // 눈
      VF.circle(ctx, cx, cy + 4, 3); ctx.fillStyle = '#ffe08a'; ctx.fill();
      VF.circle(ctx, cx + 0.4, cy + 4.3, 1.4); ctx.fillStyle = '#1a2233'; ctx.fill();
    }
    VectorForge.bake(scene, 'turret', { w: 30, h: 30, frames: [function (c, w, h) { turret(c, w, h, 0); }, function (c, w, h) { turret(c, w, h, 1); }] });

    // 탄알
    VectorForge.bake(scene, 'pbullet', { w: 14, h: 14, draw: function (ctx, w, h) {
      var cx = w / 2; VF.glow(ctx, 'rgba(120,240,255,0.9)', 6, function () { VF.circle(ctx, cx, cx, 5); ctx.fillStyle = VF.radial(ctx, cx, cx, 5, [[0, '#f0ffff'], [0.5, '#7af0ff'], [1, '#1ec8e0']]); ctx.fill(); }); }
    });
    VectorForge.bake(scene, 'ebullet', { w: 16, h: 16, draw: function (ctx, w, h) {
      var cx = w / 2;
      VF.glow(ctx, 'rgba(255,90,140,0.8)', 4, function () { VF.circle(ctx, cx, cx, 5.5); ctx.fillStyle = VF.radial(ctx, cx, cx, 5.5, [[0, '#fff0f4'], [0.45, '#ff6b9a'], [1, '#d12a5a']]); ctx.fill(); });
      outline(ctx, function () { VF.circle(ctx, cx, cx, 5.5); }, '#5a0f28', 1.6);
    } });
    // 황금 오비탈 탄(궁극기)
    VectorForge.bake(scene, 'gbullet', { w: 18, h: 18, draw: function (ctx, w, h) {
      var cx = w / 2; VF.glow(ctx, 'rgba(255,210,80,0.95)', 7, function () { VF.circle(ctx, cx, cx, 6.5); ctx.fillStyle = VF.radial(ctx, cx, cx, 6.5, [[0, '#fff6c0'], [0.5, '#ffcf3a'], [1, '#d98a1f']]); ctx.fill(); }); }
    });

    // 픽업: 코인 / 하트 / 기력 / 상자 / 스타(아이템)
    VectorForge.bake(scene, 'coin', VectorForge.LIB.vfCoin);
    VectorForge.bake(scene, 'heart', { w: 22, h: 20, draw: function (ctx, w, h) {
      var cx = w / 2; ctx.save(); ctx.translate(cx, 8);
      ctx.beginPath(); ctx.moveTo(0, 9); ctx.bezierCurveTo(-9, -1, -6, -9, 0, -3); ctx.bezierCurveTo(6, -9, 9, -1, 0, 9); ctx.closePath();
      ctx.fillStyle = VF.lin(ctx, 0, -8, 0, 9, [[0, '#ff8fb0'], [1, '#ff3f6e']]); ctx.fill();
      outline(ctx, function () { ctx.beginPath(); ctx.moveTo(0, 9); ctx.bezierCurveTo(-9, -1, -6, -9, 0, -3); ctx.bezierCurveTo(6, -9, 9, -1, 0, 9); ctx.closePath(); }, '#7a0f28', 2);
      VF.ellipse(ctx, -3, -1, 1.6, 2.4); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill(); ctx.restore();
    } });
    VectorForge.bake(scene, 'energy', { w: 20, h: 20, draw: function (ctx, w, h) {
      var cx = w / 2; VF.glow(ctx, 'rgba(90,230,255,0.8)', 5, function () { VF.circle(ctx, cx, cx, 7); ctx.fillStyle = VF.radial(ctx, cx, cx, 7, [[0, '#eaffff'], [1, '#2bb6e0']]); ctx.fill(); });
      ctx.fillStyle = '#1a3a44'; VF.poly(ctx, [[cx - 1, cx - 5], [cx + 3, cx - 1], [cx, cx], [cx + 1, cx + 5], [cx - 3, cx + 1], [cx, cx]]); ctx.fill();
    } });
    VectorForge.bake(scene, 'chest', { w: 38, h: 32, draw: function (ctx, w, h) {
      var cx = w / 2;
      VF.ellipse(ctx, cx, h - 3, 14, 3); ctx.fillStyle = 'rgba(20,24,40,0.2)'; ctx.fill();
      VF.rr(ctx, 5, 12, w - 10, 16, 3); ctx.fillStyle = VF.lin(ctx, 0, 12, 0, 28, [[0, '#b06a3a'], [1, '#7a4422']]); ctx.fill();
      outline(ctx, function () { VF.rr(ctx, 5, 12, w - 10, 16, 3); }, '#3e2010', 2);
      VF.rr(ctx, 4, 6, w - 8, 9, 4); ctx.fillStyle = VF.lin(ctx, 0, 6, 0, 15, [[0, '#caa06a'], [1, '#9a6a3a']]); ctx.fill();
      outline(ctx, function () { VF.rr(ctx, 4, 6, w - 8, 9, 4); }, '#3e2010', 2);
      VF.rr(ctx, cx - 3, 11, 6, 7, 1.5); ctx.fillStyle = '#ffd34a'; ctx.fill();
      outline(ctx, function () { VF.rr(ctx, cx - 3, 11, 6, 7, 1.5); }, '#6e4a10', 1.4);
    } });
    VectorForge.bake(scene, 'star', { w: 28, h: 28, draw: function (ctx, w, h) {
      var cx = w / 2; VF.glow(ctx, 'rgba(255,210,80,0.9)', 7, function () { VF.star(ctx, cx, cx, 11, 4.6, 5, -Math.PI / 2); ctx.fillStyle = VF.radial(ctx, cx, cx, 11, [[0, '#fff6c0'], [0.6, '#ffcf3a'], [1, '#e0941f']]); ctx.fill(); });
      outline(ctx, function () { VF.star(ctx, cx, cx, 11, 4.6, 5, -Math.PI / 2); }, '#8a5a10', 1.6);
    } });
    VectorForge.bake(scene, 'portal', { w: 70, h: 70, draw: function (ctx, w, h) {
      var cx = w / 2; VF.glow(ctx, 'rgba(120,200,255,0.9)', 12, function () { VF.ellipse(ctx, cx, cx, 26, 30); ctx.fillStyle = VF.radial(ctx, cx, cx, 30, [[0, 'rgba(220,245,255,0.95)'], [0.5, 'rgba(90,180,255,0.85)'], [1, 'rgba(40,90,200,0.2)']]); ctx.fill(); });
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(200,235,255,0.9)'; VF.ellipse(ctx, cx, cx, 22, 26); ctx.stroke();
      VF.ellipse(ctx, cx, cx, 12, 15); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    } });

    // 보스 3종(왕관 슬라임 / 큰 눈 / 둥근 봇) — 층마다 틴트·스케일·패턴으로 변주
    VectorForge.bake(scene, 'boss-king', { w: 96, h: 86, frames: [0, 1].map(function (t) { return function (ctx, w, h) {
      var cx = w / 2, by = h * 0.56, sq = t ? 1.0 : 1.05;
      VF.ellipse(ctx, cx, h - 5, 34, 6); ctx.fillStyle = 'rgba(20,24,40,0.22)'; ctx.fill();
      ctx.save(); ctx.translate(cx, by); ctx.scale(1 / sq, sq); ctx.translate(-cx, -by);
      VF.blob(ctx, cx, by, 36, 12, 0.06, 1.4); ctx.fillStyle = VF.lin(ctx, cx, by - 36, cx, by + 36, [[0, '#9be86b'], [1, '#3a8e2a']]); ctx.fill();
      outline(ctx, function () { VF.blob(ctx, cx, by, 36, 12, 0.06, 1.4); }, '#234d18', 3); ctx.restore();
      // 왕관
      ctx.fillStyle = '#ffd34a'; VF.poly(ctx, [[cx - 22, by - 30], [cx - 14, by - 44], [cx - 7, by - 32], [cx, by - 48], [cx + 7, by - 32], [cx + 14, by - 44], [cx + 22, by - 30]]); ctx.fill();
      outline(ctx, function () { VF.poly(ctx, [[cx - 22, by - 30], [cx - 14, by - 44], [cx - 7, by - 32], [cx, by - 48], [cx + 7, by - 32], [cx + 14, by - 44], [cx + 22, by - 30]]); }, '#8a5a10', 2);
      // 눈
      [[-12, by - 4], [12, by - 4]].forEach(function (e) { VF.circle(ctx, cx + e[0], e[1], 7); ctx.fillStyle = '#fff'; ctx.fill(); outline(ctx, function () { VF.circle(ctx, cx + e[0], e[1], 7); }, '#234d18', 1.6); VF.circle(ctx, cx + e[0] + 1, e[1] + 1, 3.4); ctx.fillStyle = '#1a2233'; ctx.fill(); });
      ctx.beginPath(); ctx.arc(cx, by + 8, 8, 0.1 * Math.PI, 0.9 * Math.PI); ctx.lineWidth = 2.4; ctx.strokeStyle = '#234d18'; ctx.stroke();
    }; }) });
    VectorForge.bake(scene, 'boss-eye', { w: 90, h: 90, frames: [0, 1].map(function (t) { return function (ctx, w, h) {
      var cx = w / 2, cy = h / 2, r = t ? 38 : 36;
      VF.glow(ctx, 'rgba(180,90,255,0.5)', 10, function () { VF.circle(ctx, cx, cy, r); ctx.fillStyle = VF.radial(ctx, cx, cy, r, [[0, '#e3c8ff'], [0.6, '#a86bff'], [1, '#5a2fb0']]); ctx.fill(); });
      outline(ctx, function () { VF.circle(ctx, cx, cy, r); }, '#3a1f70', 3);
      VF.circle(ctx, cx, cy, 18); ctx.fillStyle = '#fff'; ctx.fill();
      VF.circle(ctx, cx, cy, 10); ctx.fillStyle = '#1a2233'; ctx.fill();
      VF.circle(ctx, cx - 3, cy - 3, 3.4); ctx.fillStyle = '#fff'; ctx.fill();
    }; }) });
    VectorForge.bake(scene, 'boss-bot', { w: 92, h: 84, frames: [0, 1].map(function (t) { return function (ctx, w, h) {
      var cx = w / 2, cy = h / 2 + 2, bob = t ? -2 : 1;
      VF.ellipse(ctx, cx, h - 5, 30, 5); ctx.fillStyle = 'rgba(20,24,40,0.22)'; ctx.fill();
      VF.rr(ctx, cx - 34, cy - 28 + bob, 68, 56, 16); ctx.fillStyle = VF.lin(ctx, 0, cy - 28, 0, cy + 28, [[0, '#9ad0ff'], [1, '#4a78c8']]); ctx.fill();
      outline(ctx, function () { VF.rr(ctx, cx - 34, cy - 28 + bob, 68, 56, 16); }, '#22406e', 3);
      // 눈 패널
      VF.rr(ctx, cx - 22, cy - 12 + bob, 44, 20, 8); ctx.fillStyle = '#10243a'; ctx.fill();
      [[-11, cy - 2 + bob], [11, cy - 2 + bob]].forEach(function (e) { VF.circle(ctx, cx + e[0], e[1], 5); ctx.fillStyle = '#7af0ff'; ctx.fill(); });
      VF.rr(ctx, cx - 8, cy + 14 + bob, 16, 5, 2); ctx.fillStyle = '#ffd34a'; ctx.fill();
    }; }) });

    // 파티클 스파크(작은 흰 원)
    var g = scene.add.graphics();
    g.fillStyle(0xffffff, 1); g.fillCircle(4, 4, 4);
    g.generateTexture('spark', 8, 8); g.destroy();
    var g2 = scene.add.graphics();
    g2.fillStyle(0xffffff, 1); g2.fillRect(0, 0, 6, 6);
    g2.generateTexture('square', 6, 6); g2.destroy();

    // 애니메이션
    function mkAnim(key, tex, frames, rate) { if (!scene.anims.exists(key)) scene.anims.create({ key: key, frames: frames.map(function (f) { return { key: tex, frame: f }; }), frameRate: rate, repeat: -1 }); }
    mkAnim('hero-idle', 'hero', [0, 1], 3);
    mkAnim('slime-idle', 'slime', [0, 1], 4);
    mkAnim('orb-idle', 'orb', [0, 1], 4);
    mkAnim('bat-fly', 'bat', [0, 1], 8);
    mkAnim('turret-idle', 'turret', [0, 1], 3);
    mkAnim('boss-king-idle', 'boss-king', [0, 1], 2.5);
    mkAnim('boss-eye-idle', 'boss-eye', [0, 1], 2.5);
    mkAnim('boss-bot-idle', 'boss-bot', [0, 1], 3);
    mkAnim('coin-spin', 'coin', [0, 1, 2, 3], 10);
  }

  // ===========================================================================
  // 적 / 보스 정의 테이블
  // ===========================================================================
  var ENEMY_TYPES = {
    slime:  { tex: 'slime', anim: 'slime-idle', hp: 3, speed: 56, behavior: 'chase', radius: 11, touch: 1, score: 1 },
    bat:    { tex: 'bat', anim: 'bat-fly', hp: 2, speed: 96, behavior: 'dart', radius: 9, touch: 1, score: 1 },
    turret: { tex: 'turret', anim: 'turret-idle', hp: 5, speed: 0, behavior: 'shooter', radius: 12, touch: 1, score: 2, fireEvery: 1500, pattern: 'aimed' },
    orb:    { tex: 'orb', anim: 'orb-idle', hp: 4, speed: 34, behavior: 'spreader', radius: 11, touch: 1, score: 2, fireEvery: 2200, pattern: 'ring' }
  };

  // 10개 보스(3비주얼 변주 + 패턴 조합 + 스케일). 색 틴트로 변별.
  var BOSS_TABLE = [
    { name: '슬라임 대왕', tex: 'boss-king', anim: 'boss-king-idle', tint: 0xffffff, hp: 60, patterns: ['ring', 'aimed3'] },
    { name: '감시안',     tex: 'boss-eye', anim: 'boss-eye-idle', tint: 0xffffff, hp: 80, patterns: ['spiral', 'aimed3'] },
    { name: '강철 봇',    tex: 'boss-bot', anim: 'boss-bot-idle', tint: 0xffffff, hp: 100, patterns: ['fan', 'walls'] },
    { name: '독슬라임 군주', tex: 'boss-king', anim: 'boss-king-idle', tint: 0xb0ff8a, hp: 130, patterns: ['ring', 'spiral'] },
    { name: '심연안',     tex: 'boss-eye', anim: 'boss-eye-idle', tint: 0x8affd0, hp: 160, patterns: ['spiral', 'fan'] },
    { name: '파괴 봇 MkII', tex: 'boss-bot', anim: 'boss-bot-idle', tint: 0xffb0b0, hp: 200, patterns: ['fan', 'aimed3', 'walls'] },
    { name: '핏빛 대왕',  tex: 'boss-king', anim: 'boss-king-idle', tint: 0xff9a6b, hp: 250, patterns: ['ring', 'spiral', 'aimed3'] },
    { name: '허공안',     tex: 'boss-eye', anim: 'boss-eye-idle', tint: 0xffd36b, hp: 320, patterns: ['spiral', 'fan', 'ring'] },
    { name: '심판 봇',    tex: 'boss-bot', anim: 'boss-bot-idle', tint: 0xc8a0ff, hp: 400, patterns: ['fan', 'walls', 'spiral'] },
    { name: '던전의 핵',  tex: 'boss-eye', anim: 'boss-eye-idle', tint: 0xff6bd0, hp: 560, patterns: ['ring', 'spiral', 'fan', 'aimed3'] }
  ];

  // ===========================================================================
  // BootScene — 아트 베이크, 씬 등록, DOM 가드
  // ===========================================================================
  var BootScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function BootScene() { Phaser.Scene.call(this, { key: 'Boot' }); },
    create: function () {
      bakeArt(this);
      MobileHarness.installDomGuards();
      MobileHarness.onResume(function () { if (GAME_AUDIO.resume) GAME_AUDIO.resume(); });
      this.scene.start('Title');
    }
  });

  // ===========================================================================
  // TitleScene — 타이틀 + 직업 카드 + Tap to start(오디오 언락)
  // ===========================================================================
  var TitleScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function TitleScene() { Phaser.Scene.call(this, { key: 'Title' }); },
    create: function () {
      var W = DESIGN_W, H = DESIGN_H, cx = W / 2;
      this.cameras.main.setBackgroundColor('#161a2e');
      // 배경 장식 도트
      var g = this.add.graphics();
      for (var i = 0; i < 40; i++) { g.fillStyle(0xffffff, 0.05 + Math.random() * 0.06); g.fillCircle(Math.random() * W, Math.random() * H, 1 + Math.random() * 2); }
      // 마스코트
      var hero = this.add.sprite(cx, H * 0.34, 'hero', 0).setScale(3.4); hero.play('hero-idle');
      this.tweens.add({ targets: hero, y: H * 0.34 - 12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      // 타이틀
      this.add.text(cx, H * 0.5, '팡팡 던전', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '60px', color: '#ffd34a' }).setOrigin(0.5).setShadow(0, 4, '#7a4a00', 0, true, true);
      this.add.text(cx, H * 0.5 + 48, 'POP  DUNGEON', { fontFamily: 'monospace', fontSize: '20px', color: '#7af0ff' }).setOrigin(0.5);
      // 직업 카드
      var cardY = H * 0.62;
      var card = this.add.graphics(); card.fillStyle(0x223, 0); card.fillStyle(0x2a3050, 0.85); card.fillRoundedRect(cx - 150, cardY, 300, 70, 14); card.lineStyle(2, 0x5ad1ff, 0.7); card.strokeRoundedRect(cx - 150, cardY, 300, 70, 14);
      this.add.text(cx - 120, cardY + 18, '직업', { fontFamily: 'sans-serif', fontSize: '13px', color: '#9fb3c8' }).setOrigin(0, 0.5);
      this.add.text(cx, cardY + 22, '팝거너', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5, 0.5);
      this.add.text(cx, cardY + 50, '자동조준 팝건 · 닷지롤 · 4 스킬', { fontFamily: 'sans-serif', fontSize: '13px', color: '#9fb3c8' }).setOrigin(0.5);
      this.add.text(cx + 120, cardY - 6, '더 많은 직업 예정', { fontFamily: 'sans-serif', fontSize: '11px', color: '#6a7a90' }).setOrigin(1, 0.5);
      // 최고 기록
      if (META.bestFloor > 0) this.add.text(cx, H * 0.74, '최고 도달: 지하 ' + META.bestFloor + '층' + (META.wins ? '  ·  클리어 ' + META.wins + '회' : ''), { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffd34a' }).setOrigin(0.5);
      // Tap to start
      var tip = this.add.text(cx, H * 0.84, '탭하여 시작', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '26px', color: '#ffffff' }).setOrigin(0.5);
      this.tweens.add({ targets: tip, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
      this.add.text(cx, H * 0.88, '왼쪽=이동(드래그) · 자동 발사 · 우측 버튼=구르기/스킬', { fontFamily: 'sans-serif', fontSize: '12px', color: '#8a98ae' }).setOrigin(0.5);

      var self = this, started = false;
      function start() {
        if (started) return; started = true;
        if (GAME_AUDIO.unlock) { GAME_AUDIO.unlock(); GAME_AUDIO.startBgm(); }
        RUN = freshRun();
        META.runs++; saveMeta();
        self.scene.start('Game');
        self.scene.launch('HUD');
      }
      this.input.once('pointerdown', start);
      this.input.keyboard.once('keydown-SPACE', start);
      this.input.keyboard.once('keydown-ENTER', start);
      if (/[?&]autostart=1/.test(location.search)) this.time.delayedCall(80, start);
    }
  });

  // ===========================================================================
  // GameScene — 던전 본체
  // ===========================================================================
  var GameScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function GameScene() { Phaser.Scene.call(this, { key: 'Game' }); },

    create: function () {
      var self = this;
      this.cameras.main.setBackgroundColor('#1a1030');

      // 아레나 배경 + 벽
      this.drawArena();

      // 능력 킷
      this.kit = AbilityKit.attach(this, window.POP_ABILITIES, {
        onActivate: function (ab, ctx) { self.onAbility(ab, ctx); },
        unlockedAtStart: ['dodge_roll', 'pop_nova', 'turbo_pop', 'golden_storm']
      });
      window.GAME_ABILITIES = this.kit;

      // 풀
      this.pbullets = this.physics.add.group({ defaultKey: 'pbullet', maxSize: 80 });
      this.ebullets = this.physics.add.group({ defaultKey: 'ebullet', maxSize: 260 });
      this.gbullets = this.physics.add.group({ defaultKey: 'gbullet', maxSize: 24 });
      this.enemies = this.physics.add.group({ maxSize: 80 });
      this.pickups = this.physics.add.group({ maxSize: 60 });

      // 플레이어
      this.player = this.physics.add.sprite(DESIGN_W / 2, ARENA_B - 90, 'hero', 0).setDepth(20);
      this.player.play('hero-idle');
      this.player.body.setCircle(11, 7, 11);
      this.player.invuln = 0; this.player.aim = -Math.PI / 2;
      this.player.fireCd = 0; this.player.turboT = 0; this.player.ultT = 0; this.player.ultAngle = 0;
      this.player.dashT = 0; this.player.dashVX = 0; this.player.dashVY = 0;

      // 파티클 이미터(재사용)
      this.fxHit = this.add.particles(0, 0, 'spark', { lifespan: 320, speed: { min: 40, max: 150 }, scale: { start: 0.7, end: 0 }, alpha: { start: 0.9, end: 0 }, blendMode: 'ADD', emitting: false }).setDepth(30);
      this.fxKill = this.add.particles(0, 0, 'spark', { lifespan: 480, speed: { min: 60, max: 240 }, scale: { start: 1.1, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', emitting: false }).setDepth(30);
      this.fxPuff = this.add.particles(0, 0, 'spark', { lifespan: 260, speed: { min: 20, max: 70 }, scale: { start: 0.6, end: 0 }, alpha: { start: 0.5, end: 0 }, tint: 0x7af0dc, emitting: false }).setDepth(19);

      // 충돌
      this.physics.add.overlap(this.pbullets, this.enemies, this.hitEnemy, null, this);
      this.physics.add.overlap(this.gbullets, this.enemies, this.hitEnemyOrbital, null, this);
      this.physics.add.overlap(this.ebullets, this.player, this.hitPlayer, null, this);
      this.physics.add.overlap(this.enemies, this.player, this.touchPlayer, null, this);
      this.physics.add.overlap(this.pickups, this.player, this.grabPickup, null, this);

      // 키보드(데스크톱/테스트)
      this.keys = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D', up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT', dodge: 'SPACE', s1: 'J', s2: 'K', s3: 'L' });
      this.prevK = {};

      // 배너 텍스트
      this.banner = this.add.text(DESIGN_W / 2, ARENA.y + 200, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '34px', color: '#ffffff' }).setOrigin(0.5).setDepth(60).setAlpha(0).setShadow(0, 3, '#000', 4);
      this.toast = this.add.text(DESIGN_W / 2, ARENA_B - 40, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '18px', color: '#ffd34a' }).setOrigin(0.5).setDepth(60).setAlpha(0);

      this.state = 'play'; // play | clearing | transition | dead | win
      this.floorEnemiesLeft = 0; this.waveQueue = [];
      this.portal = null;

      recomputeStats();
      this.startFloor(RUN.floor);

      // 헤드리스/외부 핸들
      window.PopDungeon = window.PopDungeon || {};
      window.PopDungeon.scene = this; window.PopDungeon.run = function () { return RUN; };
    },

    // ── 아레나 그리기 ──────────────────────────────────────────────────────────
    drawArena: function () {
      var g = this.add.graphics().setDepth(1);
      // 바닥 그라데이션 느낌(타일 격자)
      g.fillStyle(0x241640, 1); g.fillRoundedRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h, 16);
      g.lineStyle(1, 0x3a2a60, 0.6);
      for (var x = ARENA.x + 40; x < ARENA_R; x += 40) g.lineBetween(x, ARENA.y + 6, x, ARENA_B - 6);
      for (var y = ARENA.y + 40; y < ARENA_B; y += 40) g.lineBetween(ARENA.x + 6, y, ARENA_R - 6, y);
      g.lineStyle(4, 0x6a4ad0, 0.9); g.strokeRoundedRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h, 16);
      g.lineStyle(2, 0xb89cff, 0.5); g.strokeRoundedRect(ARENA.x + 3, ARENA.y + 3, ARENA.w - 6, ARENA.h - 6, 14);
    },

    // ── 층 시작 ────────────────────────────────────────────────────────────────
    startFloor: function (n) {
      var self = this;
      RUN.floor = n;
      this.clearProjectiles();
      if (this.portal) { this.tweens.killTweensOf(this.portal); this.portal.destroy(); this.portal = null; }
      this.state = 'spawning';
      this.floorEnemiesLeft = 0; this.waveQueue = [];
      var isBoss = (n % 10 === 0);

      // 배경 색조: 10층 구간마다 변화
      var tier = Math.floor((n - 1) / 10);
      var bgcols = [0x1a1030, 0x101a30, 0x102a20, 0x2a1018, 0x101830, 0x281a30, 0x301a10, 0x102828, 0x281028, 0x1a1040];
      this.cameras.main.setBackgroundColor(bgcols[tier % bgcols.length]);

      if (isBoss) {
        if (GAME_AUDIO.setSection) GAME_AUDIO.setSection('boss');
        if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(1);
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('bossWarn');
        this.bannerShow('지하 ' + n + '층 — 보스!', 0xff6b9a);
        this.time.delayedCall(700, function () { self.spawnBoss(n); self.state = 'play'; });
      } else {
        if (GAME_AUDIO.setSection) GAME_AUDIO.setSection('combat');
        if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.45);
        this.bannerShow('지하 ' + n + '층', 0x7af0ff);
        this.buildWaves(n);
        this.time.delayedCall(450, function () { self.spawnNextWave(); self.state = 'play'; });
      }
    },

    buildWaves: function (n) {
      // 층 깊이에 따라 적 수·종류·웨이브 수 증가
      var pool = ['slime'];
      if (n >= 3) pool.push('bat');
      if (n >= 5) pool.push('turret');
      if (n >= 8) pool.push('orb');
      var waves = n < 6 ? 1 : 2;
      var perWave = Math.min(10, 3 + Math.floor(n / 4));
      this.waveQueue = [];
      for (var w = 0; w < waves; w++) {
        var list = [];
        for (var i = 0; i < perWave; i++) list.push(pool[Math.floor(Math.random() * pool.length)]);
        this.waveQueue.push(list);
      }
      this.floorEnemiesLeft = 0;
    },

    spawnNextWave: function () {
      if (!this.waveQueue.length) return;
      var list = this.waveQueue.shift();
      var n = RUN.floor;
      for (var i = 0; i < list.length; i++) {
        var ang = Math.random() * Math.PI * 2;
        var ex = DESIGN_W / 2 + Math.cos(ang) * (140 + Math.random() * 70);
        var ey = ARENA.y + 60 + Math.random() * (ARENA.h * 0.45);
        ex = Phaser.Math.Clamp(ex, ARENA.x + 30, ARENA_R - 30);
        ey = Phaser.Math.Clamp(ey, ARENA.y + 30, ARENA_B - 120);
        this.spawnEnemy(list[i], ex, ey, n);
      }
    },

    spawnEnemy: function (type, x, y, floor) {
      var def = ENEMY_TYPES[type];
      var e = this.enemies.get(x, y, def.tex);
      if (!e) return null;
      e.setActive(true).setVisible(true).setDepth(15).setScale(1).clearTint();
      if (e.body) { e.body.enable = true; e.body.reset(x, y); e.body.setCircle(def.radius, (def.tex === 'bat' ? 6 : 4), (def.tex === 'bat' ? 6 : 4)); }
      if (def.anim) e.play(def.anim);
      e.etype = type; e.def = def; e.isBoss = false;
      e.maxHp = Math.round(def.hp * (1 + (floor - 1) * 0.18));
      e.hp = e.maxHp;
      e.speed = def.speed * (1 + (floor - 1) * 0.015);
      e.fireT = (def.fireEvery || 0) * (0.4 + Math.random() * 0.6);
      e.dartT = 300 + Math.random() * 600;
      e.spawnGrace = 350; // 스폰 직후 잠깐 무적 + 페이드인
      e.setAlpha(0.2); this.tweens.add({ targets: e, alpha: 1, duration: 320 });
      this.floorEnemiesLeft++;
      return e;
    },

    spawnBoss: function (floor) {
      var idx = Math.floor(floor / 10) - 1;
      var bdef = BOSS_TABLE[Phaser.Math.Clamp(idx, 0, BOSS_TABLE.length - 1)];
      var x = DESIGN_W / 2, y = ARENA.y + 130;
      var e = this.enemies.get(x, y, bdef.tex);
      if (!e) return;
      e.setActive(true).setVisible(true).setDepth(16).setScale(1).setTint(bdef.tint);
      if (e.body) { e.body.enable = true; e.body.reset(x, y); e.body.setCircle(36, 9, 9); }
      e.play(bdef.anim);
      e.etype = 'boss'; e.isBoss = true; e.bdef = bdef;
      e.maxHp = Math.round(bdef.hp * (1 + idx * 0.05));
      e.hp = e.maxHp;
      e.speed = 30 + idx * 3;
      e.patternT = 1200; e.patternI = 0; e.phase = 0; e.moveDir = 1; e.spawnGrace = 600;
      e.setAlpha(0.2); this.tweens.add({ targets: e, alpha: 1, duration: 500 });
      this.floorEnemiesLeft = 1;
      RUN.boss = e; RUN.bossName = bdef.name; RUN.bossHpFrac = 1;
      this.cameras.main.shake(400, 0.006);
    },

    // ── 업데이트 ───────────────────────────────────────────────────────────────
    update: function (time, dt) {
      if (!RUN) return;
      var d = dt / 1000;
      if (this.state === 'dead' || this.state === 'win') return;

      this.handlePlayer(d, time);
      this.updateEnemies(d, time);
      this.updateBullets(d);
      this.updatePickups(d);

      // 적 처치로 층 클리어 / 다음 웨이브 체크
      if (this.state === 'play' && this.floorEnemiesLeft <= 0) {
        if (this.waveQueue.length) {
          this.state = 'spawning';
          var self = this;
          this.toastShow('다음 웨이브!', 0xffd34a);
          this.time.delayedCall(650, function () { self.spawnNextWave(); self.state = 'play'; });
        } else {
          this.onFloorCleared();
        }
      }
    },

    // ── 플레이어 ───────────────────────────────────────────────────────────────
    handlePlayer: function (d, time) {
      var p = this.player; if (!p.active) return;
      // 입력 합산(터치 + 키보드)
      var mx = GAME_INPUT.moveX, my = GAME_INPUT.moveY;
      if (this.keys.left.isDown || this.keys.left2.isDown) mx = -1; if (this.keys.right.isDown || this.keys.right2.isDown) mx = 1;
      if (this.keys.up.isDown || this.keys.up2.isDown) my = -1; if (this.keys.down.isDown || this.keys.down2.isDown) my = 1;
      var mag = Math.sqrt(mx * mx + my * my); if (mag > 1) { mx /= mag; my /= mag; }

      // 타이머
      if (p.invuln > 0) p.invuln -= d;
      if (p.turboT > 0) p.turboT -= d;

      // 닷지롤 대시
      if (p.dashT > 0) {
        p.dashT -= d;
        p.setVelocity(p.dashVX, p.dashVY);
      } else {
        var spd = RUN.stats.moveSpeed;
        p.setVelocity(mx * spd, my * spd);
        if (mag > 0.1) p.aim2 = Math.atan2(my, mx); // 이동 방향 기록(타깃 없을 때 발사 방향)
      }
      // 아레나 클램프
      p.x = Phaser.Math.Clamp(p.x, ARENA.x + 14, ARENA_R - 14);
      p.y = Phaser.Math.Clamp(p.y, ARENA.y + 16, ARENA_B - 14);
      p.setFlipX(p.aim ? Math.cos(p.aim) < 0 : false);

      // 닷지롤 입력(엣지)
      var dodgeEdge = (GAME_INPUT.dodge || this.keys.dodge.isDown) && !this.prevK.dodge;
      this.prevK.dodge = (GAME_INPUT.dodge || this.keys.dodge.isDown);
      if (dodgeEdge && p.dashT <= 0) this.tryDodge(mx, my);

      // 스킬 입력(엣지)
      this.edgeUse('skill1', GAME_INPUT.skill1 || this.keys.s1.isDown, 'pop_nova');
      this.edgeUse('skill2', GAME_INPUT.skill2 || this.keys.s2.isDown, 'turbo_pop');
      this.edgeUse('ult', GAME_INPUT.ult || this.keys.s3.isDown, 'golden_storm');

      // 자동조준 + 자동발사
      var target = this.nearestEnemy(p.x, p.y);
      if (target) p.aim = Phaser.Math.Angle.Between(p.x, p.y, target.x, target.y);
      else if (p.aim2 != null) p.aim = p.aim2;
      p.fireCd -= d;
      if (target && p.fireCd <= 0 && this.state !== 'transition') {
        var delay = RUN.stats.fireDelay / (p.turboT > 0 ? RUN.stats.turboMult : 1);
        p.fireCd = delay;
        this.firePlayer(p.aim);
      }

      // 궁극기 오비탈
      if (p.ultT > 0) {
        p.ultT -= d; p.ultAngle += d * 4.5;
        this.updateOrbitals();
      }

      // 무적 깜빡임
      p.setAlpha(p.invuln > 0 && Math.floor(time / 60) % 2 === 0 ? 0.4 : 1);
    },

    edgeUse: function (slot, held, abilityId) {
      if (!this.prevK[slot] && held) {
        var r = this.kit.use(abilityId, {});
        if (!r.ok && r.reason === 'cooldown') { /* 무시 */ }
        else if (!r.ok && r.reason === 'resource') { this.toastShow('기력 부족'); }
      }
      this.prevK[slot] = held;
    },

    tryDodge: function (mx, my) {
      var r = this.kit.use('dodge_roll', {});
      if (!r.ok) return;
      var p = this.player;
      var ang = (Math.abs(mx) + Math.abs(my) > 0.1) ? Math.atan2(my, mx) : p.aim;
      var dd = this.kit.get('dodge_roll').effect;
      p.dashT = 0.26; p.dashVX = Math.cos(ang) * dd.dashSpeed; p.dashVY = Math.sin(ang) * dd.dashSpeed;
      p.invuln = Math.max(p.invuln, dd.iframes);
      p.dashDamage = RUN.stats.dashDamage;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('dodge');
      // 잔상
      for (var i = 0; i < 3; i++) {
        var gh = this.add.sprite(p.x, p.y, 'hero', 0).setAlpha(0.4 - i * 0.1).setScale(1).setTint(0x7af0dc).setDepth(18);
        this.tweens.add({ targets: gh, alpha: 0, duration: 220 + i * 60, onComplete: function () { this.destroy(); }, callbackScope: gh });
      }
      this.fxPuff.explode(8, p.x, p.y);
    },

    // ── 능력 효과 dispatch (AbilityKit onActivate) ──────────────────────────────
    onAbility: function (ab, ctx) {
      var p = this.player;
      if (ab.id === 'pop_nova') {
        var e = ab.effect, dmg = e.damage + RUN.stats.skillDamage;
        this.novaBlast(p.x, p.y, e.radius, dmg, e.knockback);
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('nova');
        this.cameras.main.shake(220, 0.008);
      } else if (ab.id === 'turbo_pop') {
        p.turboT = ab.effect.duration;
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('skill');
        this.toastShow('터보 팝!');
      } else if (ab.id === 'golden_storm') {
        p.ultT = ab.effect.duration; p.ultAngle = 0; p.ultDamage = ab.effect.damage + RUN.stats.skillDamage; p.ultCount = ab.effect.orbitalCount;
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('skill');
        this.toastShow('황금 팝 폭풍!');
        this.cameras.main.flash(160, 255, 230, 120);
      } else if (ab.id === 'dodge_roll') {
        /* 효과는 tryDodge 에서 직접 처리 */
      }
    },

    novaBlast: function (x, y, radius, dmg, knock) {
      // 시각 링
      var ring = this.add.circle(x, y, 10, 0xffd34a, 0.5).setDepth(25);
      this.tweens.add({ targets: ring, radius: radius, alpha: 0, duration: 320, ease: 'Cubic.out', onUpdate: function () { ring.setRadius(ring.radius); } });
      this.tweens.add({ targets: ring, scale: 1, duration: 320, onComplete: function () { ring.destroy(); } });
      this.fxKill.explode(20, x, y);
      // 피해 + 넉백
      var self = this;
      this.enemies.getChildren().forEach(function (e) {
        if (!e.active) return;
        var dist = Phaser.Math.Distance.Between(x, y, e.x, e.y);
        if (dist <= radius + (e.isBoss ? 36 : 12)) {
          var ang = Phaser.Math.Angle.Between(x, y, e.x, e.y);
          if (!e.isBoss && e.body) { e.x += Math.cos(ang) * Math.min(knock * 0.2, 40); e.y += Math.sin(ang) * Math.min(knock * 0.2, 40); }
          self.damageEnemy(e, dmg);
        }
      });
      // 근처 적탄 제거
      this.ebullets.getChildren().forEach(function (b) { if (b.active && Phaser.Math.Distance.Between(x, y, b.x, b.y) < radius) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; } });
    },

    updateOrbitals: function () {
      var p = this.player, n = p.ultCount || 8;
      // 오비탈은 gbullets 풀을 매 프레임 재배치하지 않고, 충돌만 처리 — 시각은 별도 스프라이트
      if (!p.orbitals) {
        p.orbitals = [];
        for (var i = 0; i < n; i++) p.orbitals.push(this.add.sprite(p.x, p.y, 'gbullet').setDepth(22));
      }
      for (var j = 0; j < p.orbitals.length; j++) {
        var a = p.ultAngle + (j / p.orbitals.length) * Math.PI * 2;
        var ox = p.x + Math.cos(a) * 64, oy = p.y + Math.sin(a) * 64;
        p.orbitals[j].setPosition(ox, oy).setVisible(true);
      }
      // 충돌
      var self = this;
      this.enemies.getChildren().forEach(function (e) {
        if (!e.active) return;
        for (var j = 0; j < p.orbitals.length; j++) {
          if (Phaser.Math.Distance.Between(p.orbitals[j].x, p.orbitals[j].y, e.x, e.y) < (e.isBoss ? 40 : 14)) {
            self.damageEnemy(e, (p.ultDamage || 25) * 0.12);
            self.fxHit.explode(2, e.x, e.y);
            break;
          }
        }
      });
      if (p.ultT <= 0 && p.orbitals) { p.orbitals.forEach(function (o) { o.destroy(); }); p.orbitals = null; }
    },

    // ── 발사 ───────────────────────────────────────────────────────────────────
    firePlayer: function (baseAngle) {
      var s = RUN.stats, p = this.player;
      var count = s.projectiles, spread = (s.spreadAngle || 0) * Math.PI / 180;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('shoot');
      for (var i = 0; i < count; i++) {
        var off = count > 1 ? (i - (count - 1) / 2) * spread : 0;
        // 약간의 랜덤 산포
        var ang = baseAngle + off + (Math.random() - 0.5) * 0.03;
        this.spawnPBullet(p.x + Math.cos(baseAngle) * 12, p.y + Math.sin(baseAngle) * 12, ang, s, false);
      }
      // 총구 반동 살짝
      p.x -= Math.cos(baseAngle) * 0.6; p.y -= Math.sin(baseAngle) * 0.6;
    },

    spawnPBullet: function (x, y, ang, s, isSplit) {
      var b = this.pbullets.get(x, y); if (!b) return null;
      b.setActive(true).setVisible(true).setDepth(18).setBlendMode(Phaser.BlendModes.ADD);
      if (b.body) { b.body.enable = true; b.body.reset(x, y); b.body.setCircle(5, 2, 2); }
      var size = 1 + (s.bulletSize || 0) * (isSplit ? 0.4 : 1);
      b.setScale(size);
      var spd = s.bulletSpeed * (isSplit ? 0.8 : 1) * (1 - (s.bulletSize || 0) * 0.12);
      b.setVelocity(Math.cos(ang) * spd, Math.sin(ang) * spd);
      // 크리티컬
      var crit = Math.random() < (s.critChance || 0);
      b.damage = (s.damage * (isSplit ? 0.5 : 1)) + (crit ? (s.critBonusDamage || 0) : 0);
      b.crit = crit;
      b.pierceLeft = isSplit ? 0 : (s.pierce || 0);
      b.bounceLeft = isSplit ? 0 : (s.bounce || 0);
      b.homing = isSplit ? 0 : (s.homing || 0);
      b.splitLeft = isSplit ? 0 : (s.split || 0);
      b.hitSet = null;
      b.life = 2.2;
      return b;
    },

    // ── 적 탄막 ─────────────────────────────────────────────────────────────────
    spawnEBullet: function (x, y, ang, spd) {
      var b = this.ebullets.get(x, y); if (!b) return null;
      b.setActive(true).setVisible(true).setDepth(17);
      if (b.body) { b.body.enable = true; b.body.reset(x, y); b.body.setCircle(5.5, 2.5, 2.5); }
      b.setVelocity(Math.cos(ang) * spd, Math.sin(ang) * spd);
      b.life = 5;
      return b;
    },

    enemyPattern: function (e, kind) {
      var n = RUN.floor, base = 120 + n * 2;
      var px = this.player.x, py = this.player.y;
      var toP = Phaser.Math.Angle.Between(e.x, e.y, px, py);
      if (kind === 'aimed') { this.spawnEBullet(e.x, e.y, toP, base); }
      else if (kind === 'aimed3') { for (var i = -1; i <= 1; i++) this.spawnEBullet(e.x, e.y, toP + i * 0.22, base); }
      else if (kind === 'ring') { var c = 10 + Math.min(8, Math.floor(n / 3)); for (var j = 0; j < c; j++) this.spawnEBullet(e.x, e.y, (j / c) * Math.PI * 2, base * 0.8); }
      else if (kind === 'fan') { for (var k = -3; k <= 3; k++) this.spawnEBullet(e.x, e.y, toP + k * 0.18, base * 0.9); }
      else if (kind === 'spiral') { e._sp = (e._sp || 0) + 0.5; for (var m = 0; m < 3; m++) this.spawnEBullet(e.x, e.y, e._sp + m * (Math.PI * 2 / 3), base * 0.85); }
      else if (kind === 'walls') {
        // 양옆에서 좁은 틈 있는 벽
        var gap = Phaser.Math.Between(0, 8);
        for (var w = 0; w < 9; w++) { if (Math.abs(w - gap) <= 1) continue; this.spawnEBullet(ARENA.x + 10, ARENA.y + 40 + w * ((ARENA.h - 80) / 8), 0, base * 0.7); }
      }
    },

    updateEnemies: function (d, time) {
      var self = this, p = this.player;
      this.enemies.getChildren().forEach(function (e) {
        if (!e.active) return;
        if (e.spawnGrace > 0) e.spawnGrace -= d * 1000;
        if (e.isBoss) { self.updateBoss(e, d); return; }
        var def = e.def;
        if (def.behavior === 'chase') { self.physics.moveToObject(e, p, e.speed); }
        else if (def.behavior === 'spreader') { self.physics.moveToObject(e, p, e.speed); }
        else if (def.behavior === 'dart') {
          e.dartT -= d * 1000;
          if (e.dartT <= 0) { e.dartT = 700 + Math.random() * 700; var a = Phaser.Math.Angle.Between(e.x, e.y, p.x, p.y) + (Math.random() - 0.5); e.setVelocity(Math.cos(a) * e.speed * 2.4, Math.sin(a) * e.speed * 2.4); }
          else { e.setVelocity(e.body.velocity.x * 0.97, e.body.velocity.y * 0.97); }
        } else if (def.behavior === 'shooter') { e.setVelocity(0, 0); }
        // 사격
        if (def.fireEvery) {
          e.fireT -= d * 1000;
          if (e.fireT <= 0 && e.spawnGrace <= 0) { e.fireT = def.fireEvery; self.enemyPattern(e, def.pattern); }
        }
        // 아레나 클램프
        e.x = Phaser.Math.Clamp(e.x, ARENA.x + 12, ARENA_R - 12);
        e.y = Phaser.Math.Clamp(e.y, ARENA.y + 12, ARENA_B - 12);
      });
    },

    updateBoss: function (e, d) {
      var self = this, p = this.player;
      // 좌우 부유 이동
      e.x += e.moveDir * e.speed * d;
      if (e.x < ARENA.x + 60) e.moveDir = 1; if (e.x > ARENA_R - 60) e.moveDir = -1;
      e.y = ARENA.y + 120 + Math.sin(this.time.now / 700) * 24;
      // 페이즈(HP 비율)
      var frac = e.hp / e.maxHp;
      var ph = frac > 0.66 ? 0 : (frac > 0.33 ? 1 : 2);
      RUN.bossHpFrac = frac;
      // 패턴 사이클
      e.patternT -= d * 1000;
      if (e.patternT <= 0 && e.spawnGrace <= 0) {
        var rate = 1400 - ph * 350; e.patternT = rate;
        var pats = e.bdef.patterns;
        var kind = pats[e.patternI % pats.length]; e.patternI++;
        self.enemyPattern(e, kind);
        // 고페이즈에서 추가 탄
        if (ph >= 1) self.enemyPattern(e, 'aimed3');
        if (ph >= 2 && Math.random() < 0.5) self.enemyPattern(e, 'ring');
      }
    },

    // ── 충돌 핸들러 ─────────────────────────────────────────────────────────────
    hitEnemy: function (bullet, enemy) {
      if (!bullet.active || !enemy.active || enemy.spawnGrace > 0) return;
      if (bullet.hitSet && bullet.hitSet.indexOf(enemy) >= 0) return;
      this.damageEnemy(enemy, bullet.damage, bullet.crit);
      this.fxHit.explode(bullet.crit ? 6 : 3, bullet.x, bullet.y);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('hit');
      // 분열
      if (bullet.splitLeft > 0 && enemy.active === false) {
        for (var i = 0; i < 2; i++) this.spawnPBullet(bullet.x, bullet.y, Math.random() * Math.PI * 2, RUN.stats, true);
      }
      // 관통
      if (bullet.pierceLeft > 0) {
        bullet.pierceLeft--;
        if (!bullet.hitSet) bullet.hitSet = [];
        bullet.hitSet.push(enemy);
      } else {
        bullet.setActive(false).setVisible(false); if (bullet.body) bullet.body.enable = false;
      }
    },

    hitEnemyOrbital: function () { /* 오비탈은 updateOrbitals 에서 직접 처리 */ },

    damageEnemy: function (e, dmg, crit) {
      if (!e.active) return;
      e.hp -= dmg;
      // 피격 깜빡임(흰 플래시 후 원복)
      e.setTint(0xffffff); this.time.delayedCall(60, function () { if (e.active) { if (e.isBoss) e.setTint(e.bdef.tint); else e.clearTint(); } });
      if (e.hp <= 0) this.killEnemy(e);
    },

    killEnemy: function (e) {
      if (!e.active) return;
      var isBoss = e.isBoss;
      this.fxKill.explode(isBoss ? 40 : 12, e.x, e.y);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('enemyDie');
      this.cameras.main.shake(isBoss ? 500 : 120, isBoss ? 0.012 : 0.004);
      RUN.kills++;
      // 드랍
      this.dropLoot(e.x, e.y, isBoss);
      if (isBoss) {
        RUN.boss = null; RUN.bossHpFrac = 0;
        this.cameras.main.flash(300, 255, 240, 180);
        // 보스 보상: 확정 아이템 + 코인 더미
        var self = this;
        this.time.delayedCall(200, function () { self.spawnItemDrop(e.x, e.y); });
      }
      e.setActive(false).setVisible(false); if (e.body) e.body.enable = false;
      e.clearTint();
      this.floorEnemiesLeft--;
    },

    dropLoot: function (x, y, isBoss) {
      var s = RUN.stats, luck = s.luck || 0;
      // 코인
      var coins = isBoss ? 8 + Math.floor(Math.random() * 6) : (Math.random() < 0.6 ? 1 + Math.floor(Math.random() * 2) : 0);
      for (var i = 0; i < coins; i++) this.spawnPickup('coin', x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
      // 기력
      if (Math.random() < 0.18 + luck * 0.03) this.spawnPickup('energy', x, y);
      // 하트
      if (Math.random() < 0.06 + luck * 0.02) this.spawnPickup('heart', x, y);
      // 일반 적도 낮은 확률로 아이템 별
      if (!isBoss && Math.random() < 0.03 + luck * 0.02) this.spawnItemDrop(x, y);
    },

    // ── 픽업 ───────────────────────────────────────────────────────────────────
    spawnPickup: function (kind, x, y) {
      var pk = this.pickups.get(x, y, kind); if (!pk) return null;
      pk.setActive(true).setVisible(true).setDepth(14).setScale(kind === 'coin' ? 0.9 : 1);
      if (pk.body) { pk.body.enable = true; pk.body.reset(x, y); pk.body.setCircle(9, 1, 1); }
      pk.pkind = kind; pk.item = null;
      if (kind === 'coin') pk.play('coin-spin');
      // 살짝 튀어나오는 연출
      var ang = Math.random() * Math.PI * 2, f = 30 + Math.random() * 40;
      pk.setVelocity(Math.cos(ang) * f, Math.sin(ang) * f);
      pk.life = 18;
      return pk;
    },

    spawnItemDrop: function (x, y) {
      // 드랍 풀에서 행운 가중 랜덤(희귀도 높을수록 낮은 확률 + luck 보정)
      var luck = RUN.stats.luck || 0;
      var weights = { common: 60, rare: 28, epic: 11, legendary: 3 + luck * 1.5 };
      var pool = DROP_POOL.filter(function (it) { return it.kind === 'equipment'; });
      var bag = [];
      pool.forEach(function (it) { var w = Math.max(1, Math.round((weights[it.rarity] || 10) / Math.max(1, countRarity(pool, it.rarity)))); for (var i = 0; i < w; i++) bag.push(it); });
      var pick = bag[Math.floor(Math.random() * bag.length)] || pool[0];
      var pk = this.pickups.get(x, y, 'star'); if (!pk) return;
      pk.setActive(true).setVisible(true).setDepth(14).setScale(1).clearTint();
      pk.setTint(RARITY_COLOR[pick.rarity] || 0xffffff);
      if (pk.body) { pk.body.enable = true; pk.body.reset(x, y); pk.body.setCircle(11, 3, 3); }
      pk.pkind = 'item'; pk.item = pick; pk.life = 60;
      pk.setVelocity(0, -20);
      this.tweens.add({ targets: pk, y: y - 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    },

    updatePickups: function (d) {
      var p = this.player, rad = RUN.stats.pickupRadius || 40;
      this.pickups.getChildren().forEach(function (pk) {
        if (!pk.active) return;
        pk.life -= d; if (pk.life <= 0 && pk.pkind !== 'item') { pk.setActive(false).setVisible(false); if (pk.body) pk.body.enable = false; return; }
        // 자석
        var dist = Phaser.Math.Distance.Between(pk.x, pk.y, p.x, p.y);
        if (pk.pkind !== 'item' && dist < rad) {
          var a = Phaser.Math.Angle.Between(pk.x, pk.y, p.x, p.y);
          pk.x += Math.cos(a) * 260 * d; pk.y += Math.sin(a) * 260 * d;
        } else if (pk.pkind !== 'item') {
          pk.setVelocity(pk.body.velocity.x * 0.9, pk.body.velocity.y * 0.9);
        }
        pk.x = Phaser.Math.Clamp(pk.x, ARENA.x + 8, ARENA_R - 8);
        pk.y = Phaser.Math.Clamp(pk.y, ARENA.y + 8, ARENA_B - 8);
      });
    },

    // overlap(pickups, player) → (player, pickup) 순서(스프라이트 먼저).
    grabPickup: function (player, pk) {
      if (!pk.active) return;
      var k = pk.pkind;
      if (k === 'coin') { RUN.coins += Math.round(1 * (RUN.stats.coinMult || 1)); if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('coin'); }
      else if (k === 'energy') { this.kit.resources.energy.cur = Math.min(this.kit.resources.energy.max, this.kit.resources.energy.cur + 25); if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('coin'); }
      else if (k === 'heart') { RUN.hp = Math.min(RUN.maxHp, RUN.hp + 1); if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('powerup'); this.toastShow('+1 ♥'); }
      else if (k === 'item') { this.applyItem(pk.item); }
      this.fxHit.explode(4, pk.x, pk.y);
      pk.setActive(false).setVisible(false); if (pk.body) pk.body.enable = false;
    },

    applyItem: function (it) {
      if (!it) return;
      if (it.kind === 'consumable') {
        var e = it.effect || {};
        if (e.heal) { RUN.hp = Math.min(RUN.maxHp, RUN.hp + e.heal); }
        if (e.energyRestore) { this.kit.resources.energy.cur = Math.min(this.kit.resources.energy.max, this.kit.resources.energy.cur + e.energyRestore); }
        this.toastShow(it.name);
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('powerup');
        return;
      }
      // 장비: 보유 목록 추가 → 스탯 재계산
      RUN.items.push(it.id);
      RUN.itemCounts[it.id] = (RUN.itemCounts[it.id] || 0) + 1;
      var prevMax = RUN.maxHp;
      recomputeStats();
      // 능력 자원/충전 갱신 반영
      this.syncKitFromStats();
      // maxHp 변동 시 hp 보정
      if (RUN.maxHp > prevMax) RUN.hp += (RUN.maxHp - prevMax);
      RUN.hp = Phaser.Math.Clamp(RUN.hp, 1, RUN.maxHp);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('powerup');
      this.cameras.main.flash(140, 255, 220, 120);
      this.toastShow('획득: ' + it.name + ' (' + rarityName(it.rarity) + ')', RARITY_COLOR[it.rarity]);
    },

    syncKitFromStats: function () {
      var s = RUN.stats;
      // 기력 최대/리젠
      var er = this.kit.resources.energy;
      er.max = 100 + (s.energyMax || 0);
      er.def.regen = 9 + (s.energyRegen || 0);
      if (er.cur > er.max) er.cur = er.max;
      // 닷지 충전
      var want = 2 + (s.dodgeCharges || 0);
      this.kit.byId.dodge_roll.charges = want;
      if ((this.kit.charges.dodge_roll || 0) < want && this.kit.cd.dodge_roll <= 0) this.kit.charges.dodge_roll = want;
    },

    // Phaser overlap(group, sprite) 는 콜백에 (sprite, groupMember) 를 넘긴다(스프라이트 먼저).
    // overlap(ebullets, player) → (player, ebullet) 순서.
    hitPlayer: function (player, bullet) {
      if (!bullet.active) return;
      // 무적/닷지 중에는 피격 무시(탄은 통과)
      if (player.invuln > 0 || player.dashT > 0) return;
      bullet.setActive(false).setVisible(false); if (bullet.body) bullet.body.enable = false;
      this.playerHurt();
    },

    // overlap(enemies, player) → (player, enemy) 순서(스프라이트 먼저).
    touchPlayer: function (player, enemy) {
      if (!enemy.active || enemy.spawnGrace > 0) return;
      // 닷지 중 적 접촉: 부츠 대시 피해
      if (player.dashT > 0 && player.dashDamage) { this.damageEnemy(enemy, player.dashDamage); return; }
      if (player.invuln > 0 || player.dashT > 0) return;
      // 가시 등껍질 반사
      if (RUN.stats.contactDamage) this.damageEnemy(enemy, RUN.stats.contactDamage);
      this.playerHurt();
    },

    playerHurt: function () {
      var p = this.player;
      // 방어구(armor) 확률 방어
      if (RUN.stats.armor && Math.random() < Math.min(0.6, RUN.stats.armor * 0.22)) { this.toastShow('방어!'); p.invuln = 0.6; this.fxPuff.explode(6, p.x, p.y); return; }
      RUN.hp--;
      p.invuln = 1.2;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('hurt');
      this.cameras.main.shake(260, 0.01);
      this.cameras.main.flash(140, 255, 60, 60);
      if (RUN.hp <= 0) this.gameOver();
    },

    // ── 탄 업데이트(컬링·반사·유도·수명) ────────────────────────────────────────
    updateBullets: function (d) {
      var self = this;
      this.pbullets.getChildren().forEach(function (b) {
        if (!b.active) return;
        b.life -= d; if (b.life <= 0) { self.killBullet(b); return; }
        // 유도
        if (b.homing > 0) {
          var t = self.nearestEnemy(b.x, b.y);
          if (t) {
            var desired = Phaser.Math.Angle.Between(b.x, b.y, t.x, t.y);
            var cur = Math.atan2(b.body.velocity.y, b.body.velocity.x);
            var na = Phaser.Math.Angle.RotateTo(cur, desired, b.homing * 6 * d);
            var sp = Math.sqrt(b.body.velocity.x * b.body.velocity.x + b.body.velocity.y * b.body.velocity.y);
            b.setVelocity(Math.cos(na) * sp, Math.sin(na) * sp);
          }
        }
        // 벽 반사 / 컬
        var bx = b.x, by = b.y;
        if (bx < ARENA.x + 4 || bx > ARENA_R - 4) { if (b.bounceLeft > 0) { b.bounceLeft--; b.body.velocity.x *= -1; b.x = Phaser.Math.Clamp(bx, ARENA.x + 5, ARENA_R - 5); } else return self.killBullet(b); }
        if (by < ARENA.y + 4 || by > ARENA_B - 4) { if (b.bounceLeft > 0) { b.bounceLeft--; b.body.velocity.y *= -1; b.y = Phaser.Math.Clamp(by, ARENA.y + 5, ARENA_B - 5); } else return self.killBullet(b); }
      });
      this.ebullets.getChildren().forEach(function (b) {
        if (!b.active) return;
        b.life -= d; if (b.life <= 0) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; return; }
        if (b.x < ARENA.x - 6 || b.x > ARENA_R + 6 || b.y < ARENA.y - 6 || b.y > ARENA_B + 6) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; }
      });
    },

    killBullet: function (b) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; },

    // ── 유틸 ───────────────────────────────────────────────────────────────────
    nearestEnemy: function (x, y) {
      var best = null, bd = 1e9;
      this.enemies.getChildren().forEach(function (e) {
        if (!e.active || e.spawnGrace > 0) return;
        var dd = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
        if (dd < bd) { bd = dd; best = e; }
      });
      return best;
    },

    clearProjectiles: function () {
      this.ebullets && this.ebullets.getChildren().forEach(function (b) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; });
      this.pbullets && this.pbullets.getChildren().forEach(function (b) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; });
      this.pickups && this.pickups.getChildren().forEach(function (pk) { if (pk.pkind === 'item') return; pk.setActive(false).setVisible(false); if (pk.body) pk.body.enable = false; });
    },

    // ── 층 클리어 / 전환 ────────────────────────────────────────────────────────
    onFloorCleared: function () {
      if (this.state !== 'play') return;
      this.state = 'clearing';
      var self = this;
      if (RUN.floor >= 100) { this.win(); return; }
      if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.2);
      this.toastShow('클리어!', 0x7af0ff);
      // 포탈 생성(아레나 하단 중앙)
      this.time.delayedCall(500, function () {
        var px = DESIGN_W / 2, py = ARENA.y + ARENA.h * 0.5;
        self.portal = self.physics.add.sprite(px, py, 'portal').setDepth(12);
        self.portal.body.setCircle(26, 9, 9);
        self.tweens.add({ targets: self.portal, scale: 1.12, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        self.portal.angleSpin = self.tweens.add({ targets: self.portal, angle: 360, duration: 4000, repeat: -1 });
        self.bannerShow('포탈로 하강 ↓', 0xb89cff);
        self.portalOverlap = self.physics.add.overlap(self.player, self.portal, function () { self.descend(); });
      });
    },

    descend: function () {
      if (this.state !== 'clearing') return;
      this.state = 'transition';
      var self = this;
      if (this.portalOverlap) { this.physics.world.removeCollider(this.portalOverlap); this.portalOverlap = null; }
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('descend');
      this.cameras.main.flash(200, 180, 200, 255);
      // 업데이트 최고 기록
      if (RUN.floor > META.bestFloor) { META.bestFloor = RUN.floor; saveMeta(); }
      this.cameras.main.fadeOut(260, 10, 6, 24);
      this.cameras.main.once('camerafadeoutcomplete', function () {
        self.player.setPosition(DESIGN_W / 2, ARENA_B - 90);
        self.cameras.main.fadeIn(260, 10, 6, 24);
        self.startFloor(RUN.floor + 1);
      });
    },

    // ── 종료 ───────────────────────────────────────────────────────────────────
    gameOver: function () {
      if (this.state === 'dead') return;
      this.state = 'dead';
      var p = this.player;
      p.setVelocity(0, 0); p.dashT = 0;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('gameover');
      if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.1);
      this.fxKill.explode(30, p.x, p.y);
      this.cameras.main.shake(400, 0.012);
      p.setVisible(false);
      META.totalCoins += RUN.coins; if (RUN.floor > META.bestFloor) META.bestFloor = RUN.floor; saveMeta();
      var self = this;
      this.time.delayedCall(700, function () {
        self.scene.stop('HUD');
        self.scene.start('Result', { win: false, floor: RUN.floor, coins: RUN.coins, kills: RUN.kills });
      });
    },

    win: function () {
      if (this.state === 'win') return;
      this.state = 'win';
      this.player.setVelocity(0, 0);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('win');
      META.wins++; META.totalCoins += RUN.coins; META.bestFloor = 100; saveMeta();
      var self = this;
      this.cameras.main.flash(400, 255, 240, 180);
      this.time.delayedCall(800, function () {
        self.scene.stop('HUD');
        self.scene.start('Result', { win: true, floor: 100, coins: RUN.coins, kills: RUN.kills });
      });
    },

    // ── 배너/토스트 ─────────────────────────────────────────────────────────────
    bannerShow: function (txt, color) {
      this.banner.setText(txt).setColor('#' + (color || 0xffffff).toString(16).padStart(6, '0')).setAlpha(0).setScale(0.6);
      this.tweens.add({ targets: this.banner, alpha: 1, scale: 1, duration: 260, ease: 'Back.out' });
      this.tweens.add({ targets: this.banner, alpha: 0, delay: 1100, duration: 400 });
    },
    toastShow: function (txt, color) {
      this.toast.setText(txt).setColor('#' + (color || 0xffd34a).toString(16).padStart(6, '0')).setAlpha(1).setY(ARENA_B - 40);
      this.tweens.killTweensOf(this.toast);
      this.tweens.add({ targets: this.toast, y: ARENA_B - 70, alpha: 0, delay: 700, duration: 500 });
    }
  });

  // ===========================================================================
  // HUDScene — 컨트롤(조이스틱+버튼) + HUD 표시 (Game 위 오버레이)
  // ===========================================================================
  var HUDScene = new Phaser.Class({
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
        { id: 'dodge', x: W - 64, y: H - 70, r: 40, label: '↻', color: 0x7af0dc, ability: 'dodge_roll' },
        { id: 'skill1', x: W - 142, y: H - 92, r: 28, label: '✦', color: 0xffb13a, ability: 'pop_nova' },
        { id: 'skill2', x: W - 150, y: H - 158, r: 26, label: '▲', color: 0x6ff0ff, ability: 'turbo_pop' },
        { id: 'ult', x: W - 78, y: H - 156, r: 26, label: '◆', color: 0xffd34a, ability: 'golden_storm' }
      ];

      this.g = this.add.graphics().setDepth(1000);
      this.labels = {};
      this.cdText = {};
      this.buttons.forEach(function (b) {
        self.labels[b.id] = self.add.text(b.x, b.y, b.label, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: (b.r * 0.9) + 'px', color: '#ffffff' }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);
        self.cdText[b.id] = self.add.text(b.x, b.y + b.r + 8, '', { fontFamily: 'monospace', fontSize: '11px', color: '#ffffff' }).setOrigin(0.5).setDepth(1001);
      });

      // 상단 HUD 텍스트
      this.floorText = this.add.text(W / 2, 28, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '26px', color: '#ffffff' }).setOrigin(0.5).setDepth(1001).setShadow(0, 2, '#000', 3);
      this.coinText = this.add.text(W - 16, 22, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '18px', color: '#ffd34a' }).setOrigin(1, 0.5).setDepth(1001);
      this.hudG = this.add.graphics().setDepth(1000);
      this.itemText = this.add.text(16, 116, '', { fontFamily: 'sans-serif', fontSize: '12px', color: '#cfd8e3', wordWrap: { width: 250 } }).setDepth(1001);
      this.bossNameText = this.add.text(W / 2, 96, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '15px', color: '#ff8fb0' }).setOrigin(0.5).setDepth(1001);

      this.prevPressed = {};

      // 음소거 토글
      if (window.GAME_AUDIO) {
        var mute = this.add.text(W - 16, 50, '♪', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(1, 0).setDepth(1002).setInteractive({ useHandCursor: true });
        mute.on('pointerdown', function () { var m = window.GAME_AUDIO.toggleMute(); mute.setText(m ? '♪̸' : '♪').setAlpha(m ? 0.5 : 1); });
      }
    },

    update: function () {
      var self = this;
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
          self.g.fillStyle(0x000000, 0.5);
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
      var g = this.hudG; g.clear();
      // 하트
      var hx0 = 16, hy = 22;
      for (var i = 0; i < RUN.maxHp; i++) {
        var filled = i < RUN.hp;
        g.fillStyle(filled ? 0xff3f6e : 0x44364a, filled ? 1 : 0.7);
        // 하트 모양 근사(두 원 + 삼각)
        var cx = hx0 + i * 22 + 8, cy = hy;
        g.fillCircle(cx - 4, cy - 2, 4.4); g.fillCircle(cx + 4, cy - 2, 4.4);
        g.fillTriangle(cx - 8, cy, cx + 8, cy, cx, cy + 9);
      }
      // 기력 바
      var ex = 16, ey = 44, ew = 120, eh = 8;
      var er = kit ? kit.getResource('energy') / kit.getResourceMax('energy') : 0;
      g.fillStyle(0x10243a, 0.9); g.fillRoundedRect(ex, ey, ew, eh, 4);
      g.fillStyle(0x6ff0ff, 0.95); g.fillRoundedRect(ex, ey, Math.max(0, ew * er), eh, 4);
      g.lineStyle(1, 0x9fe0ff, 0.6); g.strokeRoundedRect(ex, ey, ew, eh, 4);
      // 보스 HP 바
      if (RUN.boss) {
        var bw = DESIGN_W - 120, bx = 60, by = 78;
        g.fillStyle(0x2a0e18, 0.9); g.fillRoundedRect(bx, by, bw, 12, 6);
        g.fillStyle(0xff4f7a, 0.95); g.fillRoundedRect(bx, by, Math.max(0, bw * RUN.bossHpFrac), 12, 6);
        g.lineStyle(2, 0xff9ab8, 0.7); g.strokeRoundedRect(bx, by, bw, 12, 6);
      }
    },

    itemSummary: function () {
      if (!RUN || !RUN.items.length) return '';
      var counts = RUN.itemCounts, parts = [];
      Object.keys(counts).forEach(function (id) {
        var it = ITEM_BY_ID[id]; if (!it) return;
        parts.push(it.name + (counts[id] > 1 ? '×' + counts[id] : ''));
      });
      return '🎒 ' + parts.join(' · ');
    }
  });

  // ===========================================================================
  // ResultScene — 게임오버 / 승리
  // ===========================================================================
  var ResultScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function ResultScene() { Phaser.Scene.call(this, { key: 'Result' }); },
    create: function (data) {
      var W = DESIGN_W, H = DESIGN_H, cx = W / 2;
      var win = data && data.win;
      this.cameras.main.setBackgroundColor(win ? '#102a20' : '#241018');
      this.add.text(cx, H * 0.28, win ? '클리어!' : '게임 오버', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '52px', color: win ? '#7af0ff' : '#ff6b9a' }).setOrigin(0.5).setShadow(0, 4, '#000', 4);
      if (win) this.add.text(cx, H * 0.28 + 50, '지하 100층 돌파! 팝거너의 전설', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffd34a' }).setOrigin(0.5);

      var hero = this.add.sprite(cx, H * 0.46, 'hero', 0).setScale(3); hero.play('hero-idle');
      if (!win) hero.setTint(0x9a9aa8).setAngle(180);

      var lines = [
        '도달: 지하 ' + (data ? data.floor : 1) + '층',
        '처치: ' + (data ? data.kills : 0) + '마리',
        '코인: ◉ ' + (data ? data.coins : 0),
        '최고 기록: 지하 ' + META.bestFloor + '층'
      ];
      this.add.text(cx, H * 0.62, lines.join('\n'), { fontFamily: 'sans-serif', fontSize: '20px', color: '#ffffff', align: 'center', lineSpacing: 8 }).setOrigin(0.5);

      var tip = this.add.text(cx, H * 0.82, '탭하여 다시 도전', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
      this.tweens.add({ targets: tip, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

      var self = this, go = false;
      function restart() {
        if (go) return; go = true;
        RUN = freshRun(); META.runs++; saveMeta();
        if (GAME_AUDIO.setSection) GAME_AUDIO.setSection('combat');
        self.scene.start('Game'); self.scene.launch('HUD');
      }
      this.time.delayedCall(600, function () {
        self.input.once('pointerdown', restart);
        self.input.keyboard.once('keydown-SPACE', restart);
      });
    }
  });

  // ===========================================================================
  // 파생 스탯 계산 (아이템 + 직업 패시브)
  // ===========================================================================
  function recomputeStats() {
    var s = {
      damage: 8,            // 기본 6 + 팝건 숙련 패시브 +2
      fireDelay: 0.36,      // 초
      bulletSpeed: 460,
      moveSpeed: 188,
      projectiles: 1, spreadAngle: 0,
      pierce: 0, bounce: 0, homing: 0, split: 0,
      bulletSize: 0, critChance: 0.1, critBonusDamage: 6,  // 매의 눈 패시브
      pickupRadius: 46, coinMult: 1, luck: 0,
      armor: 0, contactDamage: 0,
      energyMax: 0, energyRegen: 0, skillDamage: 0, dodgeCharges: 0, dashDamage: 0,
      maxHpBonus: 0, turboMult: 1.8
    };
    var flatDamage = 0, dmgMult = 1;
    (RUN.items || []).forEach(function (id) {
      var it = ITEM_BY_ID[id]; if (!it) return;
      var e = it.effect || {};
      if (e.extraProjectiles) s.projectiles += e.extraProjectiles;
      if (e.spreadAngle) s.spreadAngle = Math.max(s.spreadAngle, e.spreadAngle);
      if (e.pierce) s.pierce += e.pierce;
      if (e.bounce) s.bounce += e.bounce;
      if (e.homing) s.homing += e.homing;
      if (e.split) s.split += e.split;
      if (e.bulletSize) s.bulletSize += e.bulletSize;
      if (e.fireRateFlat) s.fireDelay += e.fireRateFlat;
      if (e.damage) flatDamage += e.damage;
      if (e.damageMult) dmgMult *= e.damageMult;
      if (e.pickupRadius) s.pickupRadius += e.pickupRadius;
      if (e.coinMult) s.coinMult *= e.coinMult;
      if (e.luck) s.luck += e.luck;
      if (e.armor) s.armor += e.armor;
      if (e.contactDamage) s.contactDamage += e.contactDamage;
      if (e.energyMax) s.energyMax += e.energyMax;
      if (e.energyRegen) s.energyRegen += e.energyRegen;
      if (e.skillDamage) s.skillDamage += e.skillDamage;
      if (e.dodgeCharges) s.dodgeCharges += e.dodgeCharges;
      if (e.dashDamage) s.dashDamage += e.dashDamage;
      if (e.maxHp) s.maxHpBonus += e.maxHp;
    });
    // 세트 보너스: 스킬 빌드(2) → 스킬 피해 +10, 기력 리젠 +2
    var hasEnergyCore = RUN.items.indexOf('energy_core') >= 0, hasSkillCharm = RUN.items.indexOf('skill_charm') >= 0;
    if (hasEnergyCore && hasSkillCharm) { s.skillDamage += 10; s.energyRegen += 2; }

    s.damage = (8 + flatDamage) * dmgMult;
    s.fireDelay = Math.max(0.09, s.fireDelay);
    RUN.stats = s;
    RUN.maxHp = Math.max(1, 4 + s.maxHpBonus);
    if (RUN.hp == null) RUN.hp = RUN.maxHp;
    if (RUN.hp > RUN.maxHp) RUN.hp = RUN.maxHp;
  }

  function countRarity(pool, r) { var c = 0; pool.forEach(function (it) { if (it.rarity === r) c++; }); return c || 1; }
  function rarityName(r) { var m = { common: '일반', rare: '희귀', epic: '영웅', legendary: '전설' }; return m[r] || r; }

  // ===========================================================================
  // 게임 부팅
  // ===========================================================================
  var config = {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#161a2e',
    render: { pixelArt: false, antialias: true, roundPixels: false, preserveDrawingBuffer: /[?&]capture=1/.test(location.search) },
    scale: Object.assign({ parent: 'game' }, MobileHarness.scaleConfig(DESIGN_W, DESIGN_H)),
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: /[?&]debug=1/.test(location.search) } },
    scene: [BootScene, TitleScene, GameScene, HUDScene, ResultScene]
  };
  var game = new Phaser.Game(config);
  window.PopDungeon = Object.assign(window.PopDungeon || {}, { game: game, input: GAME_INPUT, audio: GAME_AUDIO, meta: function () { return META; } });
})();
