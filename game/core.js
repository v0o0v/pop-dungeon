/* ============================================================================
 * 팡팡 던전 (Pop Dungeon) — 코어 (부트·config·공유 상태·시드 PRNG)
 * ----------------------------------------------------------------------------
 * 단일 IIFE 였던 game.js 를 모듈 분할한 결과의 기반 모듈. 모든 공유 상태/헬퍼를
 * window.PD 내부 네임스페이스에 누적한다(ES module 아님 — 전역 누적, file:// 안전).
 *   로드 순서(index.html): core.js → art.js → story.js → stats.js →
 *                          scenes/{Boot,Title,Game,HUD,Result}.js → (인라인) PD.boot()
 *
 * 거동 100% 동일이 수용 기준(AC#10). 분할은 데이터/로직 의미를 바꾸지 않는다.
 *
 * 신규(Phase 0):
 *   · 시드 PRNG(mulberry32) — 게임플레이 난수를 결정적으로 만든다(AC#11). PD.rng()/PD.rand().
 *   · window.PopDungeon.step(dt) — 외부에서 고정 dt 로 씬 update 를 한 스텝씩 구동(헤드리스 QA).
 *   · window.PopDungeon.setSeed(n) — 런 시드 설정 진입점.
 * ==========================================================================*/
(function () {
  'use strict';

  var PD = (window.PD = window.PD || {});
  PD.scenes = PD.scenes || {};

  // ── 디자인 해상도 (세로 9:16) ───────────────────────────────────────────────
  var DESIGN_W = 540, DESIGN_H = 960;
  // 플레이필드(아레나): 위 HUD 밴드와 아래 컨트롤 밴드를 피한 사각형
  var ARENA = { x: 22, y: 150, w: 496, h: 668 };
  var ARENA_R = ARENA.x + ARENA.w, ARENA_B = ARENA.y + ARENA.h;
  PD.DESIGN_W = DESIGN_W; PD.DESIGN_H = DESIGN_H;
  PD.ARENA = ARENA; PD.ARENA_R = ARENA_R; PD.ARENA_B = ARENA_B;

  // ── 시드 PRNG (mulberry32) — 게임플레이 결정성(AC#11) ────────────────────────
  //   게임플레이 난수(스폰·드랍·크리티컬·패턴 분기·웨이브)는 PD.rand() 로 통일한다.
  //   동일 시드 + 동일 입력 시퀀스 → 동일 결과. 아트/UI 전용 난수(타이틀 불티·bark
  //   선택 등 비-게임플레이)는 Math.random 유지(결정성 무관).
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var DEFAULT_SEED = 0x9e3779b9;
  var _seed = DEFAULT_SEED;
  var _rng = mulberry32(_seed);
  PD.setSeed = function (n) { _seed = (n >>> 0) || DEFAULT_SEED; _rng = mulberry32(_seed); return _seed; };
  PD.getSeed = function () { return _seed; };
  PD.rand = function () { return _rng(); };                              // [0,1)
  PD.randRange = function (lo, hi) { return lo + _rng() * (hi - lo); };   // [lo,hi)
  PD.randInt = function (lo, hi) { return Math.floor(lo + _rng() * (hi - lo + 1)); }; // [lo,hi] 정수
  PD.pick = function (arr) { return arr[Math.floor(_rng() * arr.length)]; };

  // ── 공유 입력 (HUD 씬이 쓰고 Game 씬이 읽음) ────────────────────────────────
  var GAME_INPUT = { moveX: 0, moveY: 0, dodge: false, skill1: false, skill2: false, ult: false };
  PD.GAME_INPUT = GAME_INPUT;

  // ── 오디오 (SoundForge, data.js 스펙) ───────────────────────────────────────
  var GAME_AUDIO = new SoundForge(window.POP_AUDIO);
  window.GAME_AUDIO = GAME_AUDIO; // mobile.js 음소거/가시성 가드가 참조
  PD.GAME_AUDIO = GAME_AUDIO;

  // ── 메타 진행 (localStorage) ────────────────────────────────────────────────
  var META_KEY = 'pop-dungeon-meta-v1';
  function loadMeta() {
    try { var m = JSON.parse(localStorage.getItem(META_KEY)); if (m && typeof m === 'object') return m; } catch (e) {}
    return { bestFloor: 0, runs: 0, totalCoins: 0, wins: 0 };
  }
  function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(PD.META)); } catch (e) {} }
  PD.META = loadMeta();
  PD.saveMeta = saveMeta;

  // ── 런 상태 (런마다 리셋) ───────────────────────────────────────────────────
  //   RUN 은 PD.RUN 으로 노출(씬·stats 가 공유). freshRun 은 새 런 + 시드 초기화.
  PD.RUN = null;
  function freshRun() {
    PD.setSeed(DEFAULT_SEED);   // 런 시작 시 시드 초기화(결정적 시작)
    return {
      floor: 1, maxHp: 4, hp: 4, coins: 0, items: [], itemCounts: {},
      stats: {}, boss: null, bossHpFrac: 0, bossName: '', kills: 0
    };
  }
  PD.freshRun = freshRun;

  // ── 스타일 단일 진실 (style-architect: data.js POP_STYLE → StyleKit) ─────────
  // 모든 색은 master_palette 램프/역할색에서 나온다 — 코드에 hex 직접 쓰기 금지(STYLE.md §6).
  var STYLE = StyleKit.load(window.POP_STYLE);
  window.GAME_STYLE = STYLE;
  var RAMPS = STYLE.master_palette.ramps;
  var VARIANTS = (window.POP_STYLE && window.POP_STYLE.variants) || {};
  var FLOOR_BG = VARIANTS.floor_backgrounds || [STYLE.master_palette.background];
  var INK = STYLE.master_palette.neutrals.black;     // 외곽선·눈동자·텍스트 그림자
  var WHITE = STYLE.master_palette.neutrals.white;
  var ROLE = STYLE.role_colors;                      // player/enemy/danger/pickup/ui_accent
  var WHITE_INT = StyleKit.hexToInt(WHITE, 0xffffff);
  var INK_INT = StyleKit.hexToInt(INK, 0x000000);
  var BOSS_TINTS = (VARIANTS.boss_tints || []).map(function (h) { return StyleKit.hexToInt(h, 0xffffff); });
  function ramp(name, i) { return RAMPS[name][i]; }
  function rampInt(name, i) { return StyleKit.hexToInt(RAMPS[name][i], 0xffffff); }
  function roleInt(r) { return StyleKit.roleColorInt(STYLE, r); }
  function rgba(hex, a) { var c = StyleKit.parseRGBA(hex); return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')'; }
  // 등급색은 아이템 데이터(items.rarities)가 권위 — master gold/rarity 체계와 정합(STYLE.md §2)
  var RARITY_COLOR = {};
  (window.POP_ITEMS.rarities || []).forEach(function (r) { RARITY_COLOR[r.id] = StyleKit.hexToInt(r.color, 0xffffff); });

  // 색·스타일 헬퍼를 PD 에 노출(art/scenes/stats 가 공유)
  PD.STYLE = STYLE; PD.RAMPS = RAMPS; PD.VARIANTS = VARIANTS; PD.FLOOR_BG = FLOOR_BG;
  PD.INK = INK; PD.WHITE = WHITE; PD.ROLE = ROLE;
  PD.WHITE_INT = WHITE_INT; PD.INK_INT = INK_INT; PD.BOSS_TINTS = BOSS_TINTS;
  PD.ramp = ramp; PD.rampInt = rampInt; PD.roleInt = roleInt; PD.rgba = rgba;
  PD.RARITY_COLOR = RARITY_COLOR;

  // 아이템/스킬 스펙 인덱스
  var ITEM_BY_ID = {};
  (window.POP_ITEMS.items || []).forEach(function (it) { ITEM_BY_ID[it.id] = it; });
  // 런에서 뽑을 수 있는 장비/소모품 풀(통화 제외)
  var DROP_POOL = (window.POP_ITEMS.items || []).filter(function (it) { return it.kind === 'equipment' || it.kind === 'consumable'; });
  PD.ITEM_BY_ID = ITEM_BY_ID; PD.DROP_POOL = DROP_POOL;

  // ── 헤드리스/외부 핸들 + 결정적 스텝 진입점 ─────────────────────────────────
  //   window.PopDungeon.step(dt): 외부에서 고정 dt(ms)로 게임 한 스텝 전진.
  //   Phaser 의 자체 루프와 별개로 Game/HUD 씬 update 를 결정적으로 구동한다.
  //   AbilityKit 은 scene.events 'update' 에 훅돼 있으므로, 씬 update 호출 시
  //   events.emit('update') 도 함께 발화해 능력 쿨다운/자원도 같은 dt 로 전진시킨다.
  var PopDungeon = (window.PopDungeon = window.PopDungeon || {});
  PopDungeon.setSeed = function (n) { return PD.setSeed(n); };
  PopDungeon.getSeed = function () { return PD.getSeed(); };
  PopDungeon.run = function () { return PD.RUN; };
  PopDungeon.meta = function () { return PD.META; };

  function stepScene(scene, time, dtMs) {
    if (!scene || !scene.sys || !scene.sys.isActive()) return;
    // 능력 킷 등 events('update') 구독자 발화(자체 루프와 동일 계약)
    if (scene.sys.events) scene.sys.events.emit('update', time, dtMs);
    if (typeof scene.update === 'function') scene.update(time, dtMs);
  }
  PopDungeon.step = function (dtMs) {
    var dt = (dtMs == null ? 16.6667 : dtMs);
    var game = PopDungeon.game;
    if (!game) return;
    PopDungeon._t = (PopDungeon._t || 0) + dt;
    var time = PopDungeon._t;
    // 활성 씬을 등록 순서대로 한 스텝 구동(Game → HUD). 비활성 씬은 stepScene 가 무시.
    var sm = game.scene;
    stepScene(sm.getScene('Game'), time, dt);
    stepScene(sm.getScene('HUD'), time, dt);
    if (sm.getScene('SpikeMaze')) stepScene(sm.getScene('SpikeMaze'), time, dt); // Phase 0.5 스파이크(활성 시만)
    return time;
  };

  // ── config / 부팅 (모든 씬 클래스 등록 후 PD.boot() 로 트리거) ───────────────
  PD.boot = function () {
    var config = {
      type: Phaser.AUTO,
      parent: 'game',
      backgroundColor: STYLE.master_palette.background,
      // 렌더 설정은 style.json render 블록을 미러(D7: medium ↔ render 정합 — StyleKit.renderConfig)
      render: Object.assign(StyleKit.renderConfig(STYLE), { preserveDrawingBuffer: /[?&]capture=1/.test(location.search) }),
      scale: Object.assign({ parent: 'game' }, MobileHarness.scaleConfig(DESIGN_W, DESIGN_H)),
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: /[?&]debug=1/.test(location.search) } },
      // Phase 0.5 미로 스파이크 씬을 등록만 추가(?spike=1 일 때 Boot 가 직행). 미등록 시 본편 무영향.
      scene: [PD.scenes.Boot, PD.scenes.Title, PD.scenes.Game, PD.scenes.HUD, PD.scenes.Result].concat(PD.scenes.SpikeMaze ? [PD.scenes.SpikeMaze] : []).concat(PD.scenes.WorldMap ? [PD.scenes.WorldMap] : [])
    };
    // 스파이크 진입 플래그(Boot 가 읽어 Title 대신 SpikeMaze 로 분기)
    PD.SPIKE = /[?&]spike=1/.test(location.search);
    var game = new Phaser.Game(config);
    window.PopDungeon = Object.assign(window.PopDungeon || {}, { game: game, input: GAME_INPUT, audio: GAME_AUDIO, meta: function () { return PD.META; } });
    return game;
  };
})();
