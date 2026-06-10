/* ============================================================================
 * 팡팡 던전 — DungeonScene (던전 본체 · L6a: ARENA→room.bounds 좌표계 + 타일 물리)
 * ----------------------------------------------------------------------------
 * 기존 GameScene(절차 아레나)을 대체한다. 전투 *로직*(자동조준·탄막·닷지롤·궁극기
 * 오비탈·픽업 자석·드랍·보스 패턴)은 그대로 이식하고, ARENA 고정 좌표 의존 39곳만
 * "현재 방 bounds(room.bounds)" 로 치환했다(스파이크 SpikeMaze 골격 흡수 · 해석 A).
 *
 * L6a 범위(이 파일):
 *   · floors 데이터(또는 샘플) → PD.RoomGraph.build → Room 그래프.
 *   · 시작 방 한 칸을 PD.Tiles.bake 로 타일 렌더 + staticGroup 벽 콜라이더.
 *   · 플레이어/적/탄/픽업의 클램프·반사·스폰·컬링을 현재 방 bounds 로 일반화.
 *   · 보스 walls 패턴을 ARENA 하드코딩 → 방 크기 가변으로 일반화.
 *   · 헤드리스 step 구동(core.js PopDungeon.step 가 'Dungeon' 씬 update 호출).
 *
 * L6b(다음): 방 그래프 순회·문 잠금/개방·방 단위 전투 스코프(enterRoom·방별 카운터·
 *   문 통과 전환). L6c: 카메라 폴리시·특수방(보물/비밀/상점)·미니맵 HUD.
 *   본 L6a 는 그 토대를 만들되, 한 방 안에서 전투·층클리어 풀 루프가 동작함을 증명한다.
 *
 * 좌표계 핵심: this.room = 현재 방. this.room.bounds = ARENA 를 일반화한 플레이필드.
 *   bounds.x/y/w/h/r/b 가 ARENA.x/y/w/h/ARENA_R/ARENA_B 를 대체한다.
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = window.PD;
  var DESIGN_W = PD.DESIGN_W, DESIGN_H = PD.DESIGN_H;
  var ROLE = PD.ROLE, WHITE = PD.WHITE, INK = PD.INK;
  var WHITE_INT = PD.WHITE_INT;
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt;
  var RARITY_COLOR = PD.RARITY_COLOR, ITEM_BY_ID = PD.ITEM_BY_ID, DROP_POOL = PD.DROP_POOL;
  var ENEMY_TYPES = PD.ENEMY_TYPES, BOSS_TABLE = PD.BOSS_TABLE;
  var STORY_TEXT = PD.STORY_TEXT;
  var GAME_INPUT = PD.GAME_INPUT, GAME_AUDIO = PD.GAME_AUDIO;
  var TILE = (PD.spike && PD.spike.TILE) || 32;
  // 시드 PRNG (게임플레이 결정성 — Game.js 동일)
  var rand = PD.rand, randRange = PD.randRange, randInt = PD.randInt, pick = PD.pick;

  PD.scenes.Dungeon = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function DungeonScene() { Phaser.Scene.call(this, { key: 'Dungeon' }); },

    create: function () {
      var self = this;
      // RUN 보장(개발 직행 진입 대비 — Title/WorldMap 경유 시 이미 존재)
      if (!PD.RUN) { PD.SAVE = PD.SAVE || (PD.SaveStore ? PD.SaveStore.load() : {}); PD.RUN = PD.freshRun ? PD.freshRun() : {}; }
      var RUN = PD.RUN;

      this.cameras.main.setBackgroundColor(PD.FLOOR_BG[0]);

      // ── 층 그래프 구성(floors 데이터 → Room 그래프) ─────────────────────────────
      this.graph = this.buildFloorGraph(RUN);
      this.rooms = this.graph.rooms;
      this.room = this.rooms[this.graph.start];     // 현재 방(L6a: 시작 방에서 시작)
      RUN.roomId = this.room.id;

      // 물리 월드: 모든 방 포괄(카메라가 방별로 좁힘 — L6c)
      var wb = PD.RoomGraph.worldExtent(this.graph);
      this.physics.world.setBounds(wb.x, wb.y, wb.w, wb.h);

      // ── 타일 물리·렌더(L6a 핵심) ────────────────────────────────────────────────
      // 모든 방을 한 graphics·staticGroup 에 베이크(L6b 가 방 전환·문 잠금 시 재사용).
      this.floorGfx = this.add.graphics().setDepth(0);
      this.wallGfx = this.add.graphics().setDepth(1);
      this.wallG = this.physics.add.staticGroup();
      var ids = this.graph.order;
      for (var i = 0; i < ids.length; i++) {
        PD.Tiles.bake(this, this.rooms[ids[i]], { floorGfx: this.floorGfx, wallGfx: this.wallGfx, wallGroup: this.wallG });
      }
      // (L6b) 방 사이 복도 바닥 렌더(문 어긋남 매끄럽게 연결 — walkable, 콜라이더 없음)
      this.bakeCorridors(this.graph.corridors);
      this.drawTorches();

      // ── (L6b) 문 잠금 구조 — 닫힌 문 콜라이더 풀 + 문 비주얼 graphics ──────────────
      this.doorWallG = this.physics.add.staticGroup();   // 런타임 문 잠금 콜라이더(벽과 분리)
      this.doorWalls = {};                                // "roomId|dir" -> staticImage
      this.doorGfx = this.add.graphics().setDepth(2);     // 문 빗장/통로 비주얼

      // ── 능력 킷(Game.js 동일) ───────────────────────────────────────────────────
      this.kit = AbilityKit.attach(this, window.POP_ABILITIES, {
        onActivate: function (ab, ctx) { self.onAbility(ab, ctx); },
        unlockedAtStart: ['dodge_roll', 'pop_nova', 'turbo_pop', 'golden_storm']
      });
      window.GAME_ABILITIES = this.kit;

      // ── 풀 ──────────────────────────────────────────────────────────────────────
      this.pbullets = this.physics.add.group({ defaultKey: 'pbullet', maxSize: 80 });
      this.ebullets = this.physics.add.group({ defaultKey: 'ebullet', maxSize: 260 });
      this.gbullets = this.physics.add.group({ defaultKey: 'gbullet', maxSize: 24 });
      this.enemies = this.physics.add.group({ maxSize: 80 });
      this.pickups = this.physics.add.group({ maxSize: 60 });

      // ── 플레이어(시작 방 'S' 마커 또는 방 중심) ──────────────────────────────────
      var sp = this.startSpawnWorld(this.room);
      this.player = this.physics.add.sprite(sp.x, sp.y, 'hero', 0).setDepth(20);
      this.player.play('hero-idle');
      this.player.body.setCircle(11, 7, 11);
      this.player.invuln = 0; this.player.aim = -Math.PI / 2; this.player.aim2 = -Math.PI / 2;
      this.player.fireCd = 0; this.player.turboT = 0; this.player.ultT = 0; this.player.ultAngle = 0;
      this.player.dashT = 0; this.player.dashVX = 0; this.player.dashVY = 0;

      // ── 파티클 이미터(재사용 — Game.js 동일) ────────────────────────────────────
      this.fxHit = this.add.particles(0, 0, 'spark', { lifespan: 320, speed: { min: 40, max: 150 }, scale: { start: 0.7, end: 0 }, alpha: { start: 0.9, end: 0 }, blendMode: 'ADD', emitting: false }).setDepth(30);
      this.fxKill = this.add.particles(0, 0, 'spark', { lifespan: 480, speed: { min: 60, max: 240 }, scale: { start: 1.1, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', emitting: false }).setDepth(30);
      this.fxPuff = this.add.particles(0, 0, 'spark', { lifespan: 260, speed: { min: 20, max: 70 }, scale: { start: 0.6, end: 0 }, alpha: { start: 0.5, end: 0 }, tint: rampInt('hero', 3), emitting: false }).setDepth(19);

      // ── 충돌(타일 벽 콜라이더 + 전투 오버랩) ────────────────────────────────────
      this.physics.add.collider(this.player, this.wallG);                 // (L6a) 플레이어 ↔ 벽
      this.physics.add.collider(this.enemies, this.wallG);                // (L6a) 적 ↔ 벽
      this.physics.add.collider(this.pbullets, this.wallG, this.bulletHitWall, null, this); // 내 탄 ↔ 벽
      this.physics.add.collider(this.ebullets, this.wallG, this.ebulletHitWall, null, this); // 적탄 ↔ 벽
      // (L6b) 닫힌 문 콜라이더 — 잠긴 동안만 활성(전멸 시 비활성). 플레이어/적/탄 모두 차단.
      this.physics.add.collider(this.player, this.doorWallG);
      this.physics.add.collider(this.enemies, this.doorWallG);
      this.physics.add.collider(this.pbullets, this.doorWallG, this.bulletHitWall, null, this);
      this.physics.add.collider(this.ebullets, this.doorWallG, this.ebulletHitWall, null, this);
      this.physics.add.overlap(this.pbullets, this.enemies, this.hitEnemy, null, this);
      this.physics.add.overlap(this.gbullets, this.enemies, this.hitEnemyOrbital, null, this);
      this.physics.add.overlap(this.ebullets, this.player, this.hitPlayer, null, this);
      this.physics.add.overlap(this.enemies, this.player, this.touchPlayer, null, this);
      this.physics.add.overlap(this.pickups, this.player, this.grabPickup, null, this);

      // ── 키보드(데스크톱/테스트) ─────────────────────────────────────────────────
      this.keys = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D', up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT', dodge: 'SPACE', s1: 'J', s2: 'K', s3: 'L' });
      this.prevK = {};

      // ── 카메라(플레이어 추적 + 현재 방 경계 — L6a 기본, L6c 가 정교화) ───────────
      var cam = this.cameras.main;
      cam.startFollow(this.player, true, 0.15, 0.15);
      cam.setRoundPixels(true);
      this.applyCameraBounds(this.room);

      // ── 배너/토스트/흔적 텍스트(스크롤 무시 — HUD 좌표계 고정) ─────────────────────
      this.banner = this.add.text(DESIGN_W / 2, 200, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '34px', color: WHITE }).setOrigin(0.5).setScrollFactor(0).setDepth(60).setAlpha(0).setShadow(0, 3, INK, 4);
      this.toast = this.add.text(DESIGN_W / 2, DESIGN_H - 150, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '18px', color: ROLE.pickup }).setOrigin(0.5).setScrollFactor(0).setDepth(60).setAlpha(0);
      this.trace = this.add.text(DESIGN_W / 2, 252, '', { fontFamily: 'sans-serif', fontSize: '15px', color: ramp('steel', 3), align: 'center', wordWrap: { width: DESIGN_W - 56 } }).setOrigin(0.5).setScrollFactor(0).setDepth(60).setAlpha(0).setShadow(0, 2, INK, 3);

      this.state = 'play'; // play | clearing | transition | dead | win
      this.roomEnemiesLeft = 0; this.waveQueue = [];
      this.portal = null;

      PD.recomputeStats();
      // HP 초기화: 새 층 진입은 RUN.hp 유지(층 전환 간 체력 이월), 첫 진입 시만 maxHp.
      if (RUN.hp == null || RUN.hp <= 0 || RUN._freshEntry !== false) { RUN.hp = RUN.maxHp || RUN.hp || 4; RUN._freshEntry = false; }
      RUN.hp = Phaser.Math.Clamp(RUN.hp, 1, RUN.maxHp || 4);

      // 층 진입 막간 텍스트(STORY — x1층 진입마다 1회. story.flags.seen_floor_NN 영속)
      this.maybeFloorIntro(RUN.floor);

      // ── 바이옴 → BGM 라우팅(AUDIO.md §4 — 사운드 lane 핸드오프) ───────────────────
      //   지역 입장 시 탐험 트랙(explore_cold/warm/mystic) 선택. enterRoom 이 전투/보스로
      //   수평 리시퀀싱(setSection)·수직 레이어(setIntensity)를 덮어쓴다.
      this.exploreTrack = this.biomeTrack(RUN.region || 1);
      if (GAME_AUDIO.setSection) GAME_AUDIO.setSection(this.exploreTrack);
      if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.3);  // 탐험 베드

      // 네이티브 백버튼 = 일시정지 등록(native.js 계약)
      PD.SCENES = PD.SCENES || {}; PD.SCENES.DUNGEON = 'Dungeon';
      PD.onBackPause = function () { self.togglePause(); };

      // (L6b) 시작 방 입실 — 그래프 순회의 첫 노드. 시작 방은 보통 안전(적 없음).
      this.enterRoom(this.room, null);

      // 헤드리스/외부 핸들(Game.js 와 동일 키 — QA 하니스 호환)
      window.PopDungeon = window.PopDungeon || {};
      window.PopDungeon.scene = this;
      window.PopDungeon.run = function () { return PD.RUN; };
      window.PopDungeon.dungeon = this;
    },

    // ── floors 데이터 → Room 그래프 ──────────────────────────────────────────────
    //   RUN.region/floor 에 맞는 floor 데이터를 찾는다. 없으면 샘플 층으로 폴백
    //   (L6a 검증·개발 진입 — Phase 3 양산 데이터 연결 전까지).
    buildFloorGraph: function (RUN) {
      var floor = this.findFloorData(RUN);
      if (!floor) floor = this.sampleFloor();
      return PD.RoomGraph.build(floor);
    },

    // ── 바이옴 → 탐험 트랙 그룹(AUDIO.md §4 — world.json region.id 온도 매핑) ─────────
    //   cold: region 01·03·07·09 / warm: 02·05·08·10 / mystic: 04·06.
    //   region 은 order(1~10) 또는 'region-NN' 문자열 모두 허용.
    biomeTrack: function (region) {
      var n = region;
      if (typeof region === 'string') { var m = region.match(/(\d+)/); n = m ? parseInt(m[1], 10) : 1; }
      n = n || 1;
      if (n === 4 || n === 6) return 'explore_mystic';
      if (n === 2 || n === 5 || n === 8 || n === 10) return 'explore_warm';
      return 'explore_cold';   // 1·3·7·9 (및 폴백)
    },

    // Phase 3 floors 데이터에서 현재 floor(1~100)의 층을 탐색(데이터 있으면 사용).
    //   lane 간 등록 규약 드리프트 흡수: region-01/02 는 window.POP_FLOORS(공유 배열)에 push,
    //   region-03~10 은 window.POP_FLOORS_R03..R10 (개별 전역)에 할당. 양쪽 모두 수집한다.
    findFloorData: function (RUN) {
      var floor = RUN.floor || 1;
      var sources = [];
      if (Array.isArray(window.POP_FLOORS)) sources.push(window.POP_FLOORS);       // region-01/02 공유 배열
      // region-03~10 개별 전역(POP_FLOORS_R03 ~ R10) — 숫자 0패딩 2자리
      for (var r = 3; r <= 10; r++) {
        var key = 'POP_FLOORS_R' + (r < 10 ? '0' + r : r);
        if (Array.isArray(window[key])) sources.push(window[key]);
      }
      // 폴백 샘플(데이터 미연결 개발 진입)
      if (Array.isArray(window.POP_FLOORS_R01_SAMPLE)) sources.push(window.POP_FLOORS_R01_SAMPLE);
      for (var s = 0; s < sources.length; s++) {
        var arr = sources[s];
        for (var i = 0; i < arr.length; i++) {
          var f = arr[i];
          var fnum = parseInt(String(f.id || '').replace(/[^0-9]/g, ''), 10);
          if (fnum === floor) return f;
        }
      }
      return null;
    },

    // 샘플 층(데이터 미연결 시 폴백) — region-01.sample.js 의 floor-01 구조를 그대로 사용.
    sampleFloor: function () {
      var sample = window.POP_FLOORS_R01_SAMPLE;
      if (sample && sample.length) return sample[0];
      // 최후 폴백: 인라인 미니 층(한 시작방 + 한 전투방)
      return {
        id: 'floor-fallback', region: 'region-01', theme: 'mossy-cave',
        rooms: [
          { id: 'r1', template: 'T_ENTRY', grid: ["#######", "#.....#", "#..S..D", "#.....#", "#######"], spawns: [] },
          { id: 'r2', template: 'T_ARENA', grid: ["###D###", "D.....D", "#.E.E.#", "#.....#", "#######"], spawns: [{ type: 'slime', count: 2 }] }
        ],
        graph: [{ from: 'r1', to: 'r2' }],
        special: {}
      };
    },

    // 시작 방의 플레이어 스폰 월드 좌표('S' 마커 우선, 없으면 방 중심)
    startSpawnWorld: function (room) {
      if (room.markers && room.markers.S && room.markers.S.length) {
        var m = room.markers.S[0];
        return { x: room.ox + (m.c + 0.5) * TILE, y: room.oy + (m.r + 0.5) * TILE };
      }
      return room.center();
    },

    // ── (L6c) 카메라 경계를 현재 방 outer rect + 복도 여백 포함으로. 전환 시 펄스 연출 ──
    //   pan=true(방 전환): 가벼운 줌 펄스로 전환을 알린다(픽셀 정합 위해 즉시 복귀).
    applyCameraBounds: function (room, pan) {
      var cam = this.cameras.main;
      // 복도가 방 밖으로 살짝 보이도록 경계를 1타일 확장(전환 시 인접 통로 가시)
      cam.setBounds(room.ox - TILE, room.oy - TILE, room.ow + TILE * 2, room.oh + TILE * 2);
      if (pan) {
        // 줌 펄스(0.92→1.0) — 부드러운 방 전환 피드백. roundPixels 유지.
        cam.zoomTo ? cam.zoomTo(1, 180, 'Sine.easeOut', true) : null;
        cam.setZoom(0.96);
        this.tweens.add({ targets: cam, zoom: 1, duration: 180, ease: 'Sine.out' });
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('transition');   // (사운드 §3) 방 전환 부드러운 휘이
      }
    },

    // ── (L6b) 복도 바닥 베이크 — 방 사이 gap 을 잇는 walkable 경로(콜라이더 없음) ────
    bakeCorridors: function (corridors) {
      if (!corridors || !corridors.length) return;
      var g = this.floorGfx;
      for (var i = 0; i < corridors.length; i++) {
        var c = corridors[i];
        // 복도 바닥(돌색) — 방 바닥과 동일 결, 줄눈 약하게
        g.fillStyle(rampInt('stone', 0), 1);
        g.fillRect(c.x, c.y, c.w, c.h);
        g.fillStyle(rampInt('stone', 1), 0.6);
        g.fillRect(c.x, c.y, c.w, 1);
        g.fillRect(c.x, c.y + c.h - 1, c.w, 1);
      }
    },

    // 점이 복도 안인지(방 전환 판정 보조 — 복도에 있으면 현재 방 유지)
    inCorridor: function (x, y) {
      var cs = this.graph.corridors;
      if (!cs) return false;
      for (var i = 0; i < cs.length; i++) {
        var c = cs[i];
        if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return true;
      }
      return false;
    },

    // ── 횃불 광 풀(현재 방 네 모서리 — 그려진 빛, 동적 라이팅 아님) ─────────────────
    drawTorches: function () {
      var self = this;
      var ids = this.graph.order;
      for (var i = 0; i < ids.length; i++) {
        var room = this.rooms[ids[i]];
        var b = room.bounds;
        var spots = [
          [b.x + 30, b.y + 8], [b.r - 30, b.y + 8],
          [b.x + 10, b.y + b.h * 0.5], [b.r - 10, b.y + b.h * 0.5]
        ];
        for (var s = 0; s < spots.length; s++) {
          var glow = this.add.graphics().setDepth(2);
          glow.fillStyle(rampInt('torch', 2), 0.06);
          glow.fillEllipse(spots[s][0], spots[s][1] + 26, 96, 56);
          var tc = this.add.sprite(spots[s][0], spots[s][1], 'wtorch', s % 2).setDepth(3);
          tc.play({ key: 'torch-burn', startFrame: s % 2 });
        }
      }
    },

    // ── (L6b) 방 입실 — 그래프 순회의 핵심. 카메라/스코프 이동 + 전투 방이면 스폰·잠금 ──
    //   카운터는 방 객체(room.enemiesLeft)에 저장 — 전역 단일 변수는 방 전환 시 덮어써져
    //   다중 방 스코프가 깨진다(스파이크 실증 결함). this.roomEnemiesLeft 는 현재 방 미러.
    enterRoom: function (room, fromDir) {
      var self = this, RUN = PD.RUN;
      var prev = this.room;
      this.room = room;
      RUN.roomId = room.id;
      RUN.visited = RUN.visited || {}; RUN.visited[room.id] = true;
      RUN.cleared = RUN.cleared || {};
      room.visited = true;
      // (L6c) 방 전환 시 카메라 경계를 부드럽게 — bounds 전환 + 살짝 줌 펄스(픽셀 정합 유지)
      this.applyCameraBounds(room, prev && prev !== room);

      var tier = Math.floor(((RUN.floor || 1) - 1) / 10);
      this.cameras.main.setBackgroundColor(PD.FLOOR_BG[tier % PD.FLOOR_BG.length]);

      var isBoss = (room.kindHint === 'boss');
      var hasSpawns = (room.spawnDefs && room.spawnDefs.length) ||
                      (room.parsed && room.parsed.spawns && room.parsed.spawns.length) || isBoss;

      if (hasSpawns && !room.cleared && !room.spawned) {
        // (L6b) 전투 방 첫 입실 — 적 1회 스폰 + 인접 문 잠금
        room.spawned = true; room.enemiesLeft = 0;
        if (isBoss) {
          // (사운드 §4) 100층 악몽의 핵 = finalboss 트랙, 그 외 지역 보스 = boss 트랙
          var bossTrack = ((RUN.floor || 10) >= 100) ? 'finalboss' : 'boss';
          if (GAME_AUDIO.setSection) GAME_AUDIO.setSection(bossTrack);
          if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(1);   // 보스 전 레이어 만개
          if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('bossWarn');
          this.bannerShow('보스 — ' + (BOSS_TABLE[Phaser.Math.Clamp(Math.floor((RUN.floor||10)/10)-1,0,BOSS_TABLE.length-1)].name), rampInt('scarlet', 3));
          this.time.delayedCall(700, function () { if (self.room === room) self.spawnBoss(RUN.floor, room); });
        } else {
          if (GAME_AUDIO.setSection) GAME_AUDIO.setSection('combat');
          if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.55);  // 전투 진입(0.45~0.7)
          this.spawnRoomEnemies(room, RUN.floor);
          this.bannerShow(room.id + ' — 적 ' + room.enemiesLeft, roleInt('enemy'));
        }
        this.lockDoors(room, true);   // 미클리어 전투 방 — 인접 문 잠금
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('doorLock');   // (사운드 §3) 문 잠금 철컥
      } else if (room.cleared || !hasSpawns) {
        // 안전 방(시작/보물/비밀/상점/휴식) 또는 이미 클리어한 방 — 문 열림 유지, 재스폰 없음.
        // (사운드 §4) 전투 밖으로 나오면 탐험 트랙으로 복귀 + 인텐시티 하강(여운/조용).
        if (GAME_AUDIO.setSection && this.exploreTrack) GAME_AUDIO.setSection(this.exploreTrack);
        if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(room.cleared ? 0.2 : 0.3);
        this.lockDoors(room, false);
        // (L6c) 특수방 기믹 디스패치(첫 입실 1회)
        this.enterSpecialRoom(room);
      }
      // 현재 방 카운터 미러
      this.roomEnemiesLeft = room.enemiesLeft || 0;
      this.state = 'play';
    },

    // ── (L6c) 특수방 기믹 — 보물·비밀·상점. 첫 입실 1회만(room._specialDone 가드) ──────
    enterSpecialRoom: function (room) {
      if (room._specialDone) return;
      var k = room.kindHint, tpl = room.template;
      // 보물방: 'T' 마커마다 확정 아이템/코인 드랍 연출(런 휘발)
      if (k === 'treasure' || tpl === 'T_TREASURE') {
        room._specialDone = true;
        this.bannerShow('보물방 — 확정 아이템!', rampInt('gold', 3));
        this.spawnTreasure(room);
      }
      // 비밀방: 별이 흔적 기믹 — 반짝임 + 스토리 조각 + 보상
      else if (tpl === 'T_SECRET' || (room.gimmick && /secret|star|흔적/.test(room.gimmick))) {
        room._specialDone = true;
        this.bannerShow('비밀방 — 별이의 흔적', rampInt('arcane', 3));
        this.spawnSecret(room);
      }
      // 던전 상점방: 골드 소비 구매대
      else if (tpl === 'T_SHOP' || k === 'shop') {
        room._specialDone = true;
        this.bannerShow('상점 — 골드로 구매', roleInt('ui_accent'));
        this.spawnShop(room);
      }
      // 휴식방: 소량 회복
      else if (tpl === 'T_REST') {
        room._specialDone = true;
        var RUN = PD.RUN;
        RUN.hp = Math.min(RUN.maxHp, RUN.hp + 1);
        this.bannerShow('휴식 — +1 ♥', roleInt('pickup'));
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('powerup');
      }
    },

    // 보물방: 'T' 마커 위치마다 확정 아이템 드랍(없으면 방 중심) + 코인
    spawnTreasure: function (room) {
      var self = this;
      var marks = (room.markers && room.markers.T) || [];
      var pts = marks.length ? marks.map(function (m) { return { x: room.ox + (m.c + 0.5) * TILE, y: room.oy + (m.r + 0.5) * TILE }; })
                             : [{ x: room.bounds.x + room.bounds.w / 2, y: room.bounds.y + room.bounds.h / 2 }];
      // 첫 보물칸은 확정 장비, 나머지는 코인(과보상 방지)
      this.spawnItemDrop(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) this.spawnPickup('coin', pts[i].x, pts[i].y);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('treasure');   // (사운드 §3) 보물 개봉 반짝
      this.cameras.main.flash(120, 255, 220, 120);
    },

    // 비밀방: 별이 흔적 반짝임(그려진 파티클) + 스토리 조각 + 회복/코인 보상
    spawnSecret: function (room) {
      var RUN = PD.RUN;
      var b = room.bounds, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      // 반짝임 — gold 별 파티클(짧게 분출)
      this.fxKill && this.fxKill.explode(16, cx, cy);
      // 스토리 조각(흔적 표면 재사용 — 비밀 발견 회상)
      this.traceShow('별이의 흔적을 발견했다 — 여기 잠시 머물렀던 모양이다.');
      RUN.storyFlags = RUN.storyFlags || {}; RUN.storyFlags['secret_' + (RUN.floor || 1) + '_' + room.id] = true;
      // 보상: 코인 + 낮은 확률 아이템
      for (var i = 0; i < 4; i++) this.spawnPickup('coin', cx + (rand() - 0.5) * 40, cy + (rand() - 0.5) * 40);
      if (rand() < 0.5) this.spawnItemDrop(cx, cy);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('secret');   // (사운드 §3) 비밀방 발견 — 별이 흔적
    },

    // 던전 상점방: 'T' 마커마다 구매대 픽업(닿으면 골드 차감 후 런 아이템 획득)
    spawnShop: function (room) {
      var self = this, RUN = PD.RUN;
      var marks = (room.markers && room.markers.T) || [];
      var pts = marks.length ? marks : [{ c: Math.floor(room.cols / 2), r: Math.floor(room.rows / 2) }];
      this.shopStands = this.shopStands || [];
      var prices = [15, 25, 40];
      pts.forEach(function (m, i) {
        var x = room.ox + (m.c + 0.5) * TILE, y = room.oy + (m.r + 0.5) * TILE;
        var stand = self.pickups.get(x, y, 'star');
        if (!stand) return;
        stand.setActive(true).setVisible(true).setDepth(14).setScale(1).setTint(rampInt('gold', 3));
        if (stand.body) { stand.body.enable = true; stand.body.reset(x, y); stand.body.setCircle(11, 3, 3); }
        stand.pkind = 'shop'; stand.price = prices[i % prices.length]; stand.life = 9999;
        // 상점 아이템: 드랍 풀에서 1개 미리 정함
        var pool = DROP_POOL.filter(function (it) { return it.kind === 'equipment'; });
        stand.item = pool[Math.floor(rand() * pool.length)] || pool[0];
        self.tweens.add({ targets: stand, y: y - 6, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        self.shopStands.push(stand);
      });
    },

    // 새 층 첫 입실 막간(STORY — x1층마다 1회, story.flags 영속)
    maybeFloorIntro: function (floor) {
      var RUN = PD.RUN;
      if (STORY_TEXT.traces[floor]) {
        var seen = (PD.SAVE && PD.SAVE.story && PD.SAVE.story.flags) || {};
        var key = 'seen_floor_' + floor;
        // 흔적은 매 런 보여주되, 영속 플래그도 기록(도감/회상용)
        this.traceShow(STORY_TEXT.traces[floor]);
        RUN.storyFlags = RUN.storyFlags || {}; RUN.storyFlags[key] = true;
      }
    },

    // 문 자리 월드 좌표(중심) — grid 'D' 위치(doorCells) 우선, 없으면 변 중앙(doorTile)
    doorWorld: function (room, dir) {
      var cell = room.doorCells && room.doorCells[dir];
      if (cell) return { x: room.ox + (cell.c + 0.5) * TILE, y: room.oy + (cell.r + 0.5) * TILE };
      return room.doorWorld(dir);  // room.js 폴백(변 중앙)
    },

    // ── (L6b) 문 잠금/개방 토글 — 닫힌 문은 staticGroup 콜라이더로 통로 차단 ─────────
    lockDoors: function (room, locked) {
      var self = this;
      Object.keys(room.doors).forEach(function (dir) {
        room.doors[dir].locked = locked;
        var key = room.id + '|' + dir;
        if (locked) {
          if (!self.doorWalls[key]) {
            var w = self.doorWorld(room, dir);
            var img = self.doorWallG.create(w.x, w.y, 'square').setVisible(false);
            img.setDisplaySize(TILE, TILE); img.body.setSize(TILE, TILE); img.body.updateFromGameObject();
            self.doorWalls[key] = img;
          }
          self.doorWalls[key].body.enable = true; self.doorWalls[key].setActive(true);
        } else if (self.doorWalls[key]) {
          self.doorWalls[key].body.enable = false; self.doorWalls[key].setActive(false);
        }
      });
      this.redrawDoors();
    },

    // 문 비주얼: 잠김=주홍 빗장, 열림=히어로색 통로 점(전 방 상태 반영 — 결정적)
    redrawDoors: function () {
      var g = this.doorGfx; g.clear();
      var rs = this.rooms, self = this;
      Object.keys(rs).forEach(function (id) {
        var rm = rs[id];
        Object.keys(rm.doors).forEach(function (dir) {
          var w = self.doorWorld(rm, dir);
          if (rm.doors[dir].locked) {
            g.fillStyle(rampInt('scarlet', 2), 1);
            g.fillRect(w.x - TILE / 2 + 3, w.y - TILE / 2 + 3, TILE - 6, TILE - 6);
            g.fillStyle(rampInt('scarlet', 0), 1);
            g.fillRect(w.x - TILE / 2 + 3, w.y - 2, TILE - 6, 4);
          } else {
            g.fillStyle(rampInt('hero', 1), 0.4);
            g.fillRect(w.x - TILE / 2 + 6, w.y - TILE / 2 + 6, TILE - 12, TILE - 12);
          }
        });
      });
    },

    // ── (L6b) 방 전환: 문을 통과해 인접 방 bounds 로 진입하면 카메라/스코프 전환 ──────
    //   현재 방 bounds 안이면 전환 없음(방 사이 여백에 있어도 현재 방 유지 — 스파이크 동일).
    checkRoomTransition: function () {
      if (this.state === 'transition' || this.state === 'dead' || this.state === 'win') return;
      var p = this.player, room = this.room;
      if (room.contains(p.x, p.y)) return;
      var rs = this.rooms, self = this;
      // 1순위: 현재 방의 이웃(문으로 연결된 방 — 정상 경로)
      var keys = Object.keys(room.doors);
      for (var i = 0; i < keys.length; i++) {
        var nb = rs[room.doors[keys[i]].to];
        if (nb && nb.contains(p.x, p.y)) { self.enterRoom(nb, null); return; }
      }
      // 2순위: 전체 방 검사(견고성 — 어떤 경로로든 방 인식)
      var ids = Object.keys(rs);
      for (var j = 0; j < ids.length; j++) {
        var r = rs[ids[j]];
        if (r !== room && r.contains(p.x, p.y)) { self.enterRoom(r, null); return; }
      }
    },

    // 방의 적 스폰 — 권위 스폰 정의(type,count) × 'E' 마커 위치 라운드로빈
    spawnRoomEnemies: function (room, floor) {
      var defs = room.spawnDefs || [];
      var marks = (room.parsed && room.parsed.spawns) || []; // grid 'E' 위치(타일좌표)
      var mi = 0;
      var self = this;
      // 안전한 방 내부 스폰 위치 생성기(마커 우선, 없으면 bounds 내 결정적 분산)
      function nextPos() {
        if (marks.length) {
          var m = marks[mi % marks.length]; mi++;
          return { x: room.ox + (m.c + 0.5) * TILE, y: room.oy + (m.r + 0.5) * TILE };
        }
        var b = room.bounds;
        var ang = rand() * Math.PI * 2;
        var x = b.x + b.w / 2 + Math.cos(ang) * (b.w * 0.28);
        var y = b.y + b.h / 2 + Math.sin(ang) * (b.h * 0.28);
        return { x: Phaser.Math.Clamp(x, b.x + 20, b.r - 20), y: Phaser.Math.Clamp(y, b.y + 20, b.b - 20) };
      }
      defs.forEach(function (def) {
        var count = def.count || 1;
        var base = self.resolveEnemyType(def.type);   // 거동 base
        for (var i = 0; i < count; i++) {
          var p = nextPos();
          self.spawnEnemy(base, p.x, p.y, floor, room, def.type);  // codexId = 원본 def.type
        }
      });
      // 권위 스폰이 비어있고 'E' 마커만 있으면(템플릿 기본) 마커 위치에 기본 적 스폰
      if (!defs.length && marks.length) {
        marks.forEach(function (m) {
          var p = { x: room.ox + (m.c + 0.5) * TILE, y: room.oy + (m.r + 0.5) * TILE };
          self.spawnEnemy('slime', p.x, p.y, floor, room, 'shard_drifter');
        });
      }
      this.roomEnemiesLeft = room.enemiesLeft || 0;
    },

    // floors 데이터의 적 타입명을 런타임 ENEMY_TYPES 키로 매핑(미지원 타입 폴백)
    resolveEnemyType: function (name) {
      if (ENEMY_TYPES[name]) return name;   // 이미 base 키면 그대로
      // ── shard_* codex id → ENEMY_TYPES base 별칭(P3-A 핸드오프) ──────────────────
      //   floors spawns[].type 은 codex.data.js 의 서사적 적 id 를 쓴다. 런타임 base
      //   4종(slime=chase / bat=dart / turret=shooter / orb=spreader·ring)에 거동 의미로 매핑.
      //   매핑 근거(codex desc): drifter=느리게 떠돎→chase, darter=쏘듯 빠름→dart,
      //   splitter=갈라짐(분열 base 부재→근접 chase), weeper=우는(원거리 탄)→shooter,
      //   lightshy=빛 꺼림(링 산포)→spreader, faller=떨어짐(불규칙)→dart.
      var SHARD_BASE = {
        shard_drifter: 'slime',
        shard_darter: 'bat',
        shard_splitter: 'slime',
        shard_weeper: 'turret',
        shard_lightshy: 'orb',
        shard_faller: 'bat'
      };
      if (SHARD_BASE[name]) return SHARD_BASE[name];
      // boss_* 는 보스 템플릿 방→spawnBoss(BOSS_TABLE)로 처리되어 여기 안 옴.
      // 방어적: 혹 일반 방이 boss_ 를 일반 적으로 스폰하면 강한 base(orb)로 폴백.
      if (/^boss_/.test(name)) return 'orb';
      return 'slime';   // 미지 타입 안전 폴백
    },

    // 도감 발견 기록 — RUN.codexSeen.enemies[codexId] 누적(commitRun 이 SAVE.codex 로 병합).
    markCodexSeen: function (codexId) {
      if (!codexId) return;
      var RUN = PD.RUN;
      RUN.codexSeen = RUN.codexSeen || { enemies: {}, items: {} };
      RUN.codexSeen.enemies = RUN.codexSeen.enemies || {};
      RUN.codexSeen.enemies[codexId] = (RUN.codexSeen.enemies[codexId] || 0) + 1;
    },

    spawnEnemy: function (type, x, y, floor, room, codexId) {
      var def = ENEMY_TYPES[type];
      var e = this.enemies.get(x, y, def.tex);
      if (!e) return null;
      e.setActive(true).setVisible(true).setDepth(15).setScale(1).clearTint();
      if (e.body) { e.body.enable = true; e.body.reset(x, y); e.body.setCircle(def.radius, (def.tex === 'bat' ? 6 : 4), (def.tex === 'bat' ? 6 : 4)); }
      if (def.anim) e.play(def.anim);
      e.etype = type; e.def = def; e.isBoss = false; e.room = room || this.room;
      e.codexId = codexId || type;   // 도감 발견 추적용 원본 codex id(없으면 base)
      // 도감 발견: 입실 스폰 시 1회 기록(commitRun 이 SAVE.codex.enemies 로 병합)
      this.markCodexSeen(e.codexId);
      e.maxHp = Math.round(def.hp * (1 + ((floor || 1) - 1) * 0.18));
      e.hp = e.maxHp;
      e.speed = def.speed * (1 + ((floor || 1) - 1) * 0.015);
      e.fireT = (def.fireEvery || 0) * (0.4 + rand() * 0.6);
      e.dartT = 300 + rand() * 600;
      e.spawnGrace = 350;
      e.setAlpha(0.2); this.tweens.add({ targets: e, alpha: 1, duration: 320 });
      // 방별 카운터(전역 단일 변수 대신 — 스파이크 핵심) + 현재 방 미러
      e.room.enemiesLeft = (e.room.enemiesLeft || 0) + 1;
      if (e.room === this.room) this.roomEnemiesLeft = e.room.enemiesLeft;
      return e;
    },

    spawnBoss: function (floor, room) {
      var idx = Math.floor(floor / 10) - 1;
      if (idx < 0) idx = 0;
      var bdef = BOSS_TABLE[Phaser.Math.Clamp(idx, 0, BOSS_TABLE.length - 1)];
      var b = room.bounds;
      var x = b.x + b.w / 2, y = b.y + Math.min(130, b.h * 0.25);
      var e = this.enemies.get(x, y, bdef.tex);
      if (!e) return;
      e.setActive(true).setVisible(true).setDepth(16).setScale(1).setTint(bdef.tint);
      if (e.body) { e.body.enable = true; e.body.reset(x, y); e.body.setCircle(36, 9, 9); }
      e.play(bdef.anim);
      e.etype = 'boss'; e.isBoss = true; e.bdef = bdef; e.room = room;
      e.maxHp = Math.round(bdef.hp * (1 + idx * 0.05));
      e.hp = e.maxHp;
      e.speed = 30 + idx * 3;
      e.patternT = 1200; e.patternI = 0; e.phase = 0; e.moveDir = 1; e.spawnGrace = 600;
      e.baseY = y;
      // 보스 codex id — 방 spawnDefs 의 boss_* type(있으면) 사용, 없으면 etype 폴백
      var bossSpawn = (room.spawnDefs || []).filter(function (s) { return /^boss_/.test(s.type); })[0];
      e.codexId = (bossSpawn && bossSpawn.type) || 'boss';
      this.markCodexSeen(e.codexId);
      e.setAlpha(0.2); this.tweens.add({ targets: e, alpha: 1, duration: 500 });
      room.enemiesLeft = 1; this.roomEnemiesLeft = 1;
      PD.RUN.boss = e; PD.RUN.bossName = bdef.name; PD.RUN.bossHpFrac = 1;
      this.cameras.main.shake(400, 0.006);
    },

    // ── 업데이트(Game.js 동일 골격) ──────────────────────────────────────────────
    update: function (time, dt) {
      var RUN = PD.RUN;
      if (!RUN) return;
      var d = dt / 1000;
      if (this.state === 'dead' || this.state === 'win' || this.paused) return;

      this.handlePlayer(d, time);
      this.updateEnemies(d, time);
      this.updateBullets(d);
      this.updatePickups(d);
      this.checkRoomTransition();   // (L6b) 문 통과 → 인접 방으로 스코프 전환

      // (L6b) 방 클리어 판정 — 스폰된 전투 방이 전멸했을 때만 문 개방 + 보상
      var cr = this.room;
      if (cr.spawned && !cr.cleared && (cr.enemiesLeft || 0) <= 0) {
        this.onRoomCleared(cr);
      }
      // (L6b) 출구 도달 판정 — 클리어된(또는 안전) 방의 'X' 마커에 플레이어가 닿으면 다음 층
      if (this.state === 'play') this.checkExitReached();
    },

    // ── 플레이어(ARENA → room.bounds 치환) ──────────────────────────────────────
    handlePlayer: function (d, time) {
      var RUN = PD.RUN;
      var p = this.player; if (!p.active) return;
      var b = this.room.bounds;
      var mx = GAME_INPUT.moveX, my = GAME_INPUT.moveY;
      if (this.keys.left.isDown || this.keys.left2.isDown) mx = -1; if (this.keys.right.isDown || this.keys.right2.isDown) mx = 1;
      if (this.keys.up.isDown || this.keys.up2.isDown) my = -1; if (this.keys.down.isDown || this.keys.down2.isDown) my = 1;
      var mag = Math.sqrt(mx * mx + my * my); if (mag > 1) { mx /= mag; my /= mag; }

      if (p.invuln > 0) p.invuln -= d;
      if (p.turboT > 0) p.turboT -= d;

      if (p.dashT > 0) {
        p.dashT -= d;
        p.setVelocity(p.dashVX, p.dashVY);
      } else {
        var spd = RUN.stats.moveSpeed;
        p.setVelocity(mx * spd, my * spd);
        if (mag > 0.1) p.aim2 = Math.atan2(my, mx);
      }
      // (L6b) 클램프 제거 — 문 통과(방 사이 여백 이동)를 허용해야 하므로 벽/문 콜라이더가
      // 이동을 통제한다. 누출 안전망은 물리 월드 bounds(create 의 setBounds 전체 방 포괄).
      p.setFlipX(p.aim ? Math.cos(p.aim) < 0 : false);

      var dodgeEdge = (GAME_INPUT.dodge || this.keys.dodge.isDown) && !this.prevK.dodge;
      this.prevK.dodge = (GAME_INPUT.dodge || this.keys.dodge.isDown);
      if (dodgeEdge && p.dashT <= 0) this.tryDodge(mx, my);

      this.edgeUse('skill1', GAME_INPUT.skill1 || this.keys.s1.isDown, 'pop_nova');
      this.edgeUse('skill2', GAME_INPUT.skill2 || this.keys.s2.isDown, 'turbo_pop');
      this.edgeUse('ult', GAME_INPUT.ult || this.keys.s3.isDown, 'golden_storm');

      var target = this.nearestEnemy(p.x, p.y);
      if (target) p.aim = Phaser.Math.Angle.Between(p.x, p.y, target.x, target.y);
      else if (p.aim2 != null) p.aim = p.aim2;
      p.fireCd -= d;
      if (target && p.fireCd <= 0 && this.state !== 'transition') {
        var delay = RUN.stats.fireDelay / (p.turboT > 0 ? RUN.stats.turboMult : 1);
        p.fireCd = delay;
        this.firePlayer(p.aim);
      }

      if (p.ultT > 0) {
        p.ultT -= d; p.ultAngle += d * 4.5;
        this.updateOrbitals();
      }

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
      p.dashDamage = PD.RUN.stats.dashDamage;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('dodge');
      for (var i = 0; i < 3; i++) {
        var gh = this.add.sprite(p.x, p.y, 'hero', 0).setAlpha(0.4 - i * 0.1).setScale(1).setTint(rampInt('hero', 3)).setDepth(18);
        this.tweens.add({ targets: gh, alpha: 0, duration: 220 + i * 60, onComplete: function () { this.destroy(); }, callbackScope: gh });
      }
      this.fxPuff.explode(8, p.x, p.y);
    },

    // ── 능력 효과 dispatch(Game.js 동일) ────────────────────────────────────────
    // 능력 → 변별 SFX 키(AUDIO.md §3 — 사운드 lane 데이터 준비, 배선은 본 lane).
    //   능력 데이터에 ab.sfx 가 있으면 그게 단일 진실, 없으면 id 매핑, 그 외 'skill' 폴백.
    abilitySfx: function (ab) {
      if (ab && ab.sfx) return ab.sfx;
      var map = {
        pop_nova: 'nova', turbo_pop: 'turbo', golden_storm: 'ultGolden', dodge_roll: 'dodge',
        scatter_burst: 'scatter', charge_shot: 'charge', comet_dash: 'comet', blink_pop: 'blink',
        star_ward: 'ward', purify_pulse: 'purify', starfall: 'ultStar'
      };
      return (ab && map[ab.id]) || 'skill';
    },

    onAbility: function (ab, ctx) {
      var RUN = PD.RUN;
      var p = this.player;
      var key = this.abilitySfx(ab);
      if (ab.id === 'pop_nova') {
        var e = ab.effect, dmg = e.damage + RUN.stats.skillDamage;
        this.novaBlast(p.x, p.y, e.radius, dmg, e.knockback);
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx(key);
        this.cameras.main.shake(220, 0.008);
      } else if (ab.id === 'turbo_pop') {
        p.turboT = ab.effect.duration;
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx(key);
        this.toastShow('터보 팝!');
      } else if (ab.id === 'golden_storm') {
        p.ultT = ab.effect.duration; p.ultAngle = 0; p.ultDamage = ab.effect.damage + RUN.stats.skillDamage; p.ultCount = ab.effect.orbitalCount;
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx(key);
        this.toastShow('황금 팝 폭풍!');
        this.cameras.main.flash(160, 255, 230, 120);
      } else if (ab.id === 'dodge_roll') {
        /* 효과는 tryDodge 에서 직접 처리 */
      } else {
        // 그 외(로드아웃으로 장착된 임의 액티브) — 변별 SFX만 재생(효과 미배선이면 무해)
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx(key);
      }
    },

    novaBlast: function (x, y, radius, dmg, knock) {
      var ring = this.add.circle(x, y, 10, roleInt('pickup'), 0.5).setDepth(25);
      this.tweens.add({ targets: ring, radius: radius, alpha: 0, duration: 320, ease: 'Cubic.out', onUpdate: function () { ring.setRadius(ring.radius); } });
      this.tweens.add({ targets: ring, scale: 1, duration: 320, onComplete: function () { ring.destroy(); } });
      this.fxKill.explode(20, x, y);
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
      this.ebullets.getChildren().forEach(function (b) { if (b.active && Phaser.Math.Distance.Between(x, y, b.x, b.y) < radius) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; } });
    },

    updateOrbitals: function () {
      var p = this.player, n = p.ultCount || 8;
      if (!p.orbitals) {
        p.orbitals = [];
        for (var i = 0; i < n; i++) p.orbitals.push(this.add.sprite(p.x, p.y, 'gbullet').setDepth(22));
      }
      for (var j = 0; j < p.orbitals.length; j++) {
        var a = p.ultAngle + (j / p.orbitals.length) * Math.PI * 2;
        var ox = p.x + Math.cos(a) * 64, oy = p.y + Math.sin(a) * 64;
        p.orbitals[j].setPosition(ox, oy).setVisible(true);
      }
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

    // ── 발사(Game.js 동일) ───────────────────────────────────────────────────────
    firePlayer: function (baseAngle) {
      var s = PD.RUN.stats, p = this.player;
      var count = s.projectiles, spread = (s.spreadAngle || 0) * Math.PI / 180;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('shoot');
      for (var i = 0; i < count; i++) {
        var off = count > 1 ? (i - (count - 1) / 2) * spread : 0;
        var ang = baseAngle + off + (rand() - 0.5) * 0.03;
        this.spawnPBullet(p.x + Math.cos(baseAngle) * 12, p.y + Math.sin(baseAngle) * 12, ang, s, false);
      }
      p.x -= Math.cos(baseAngle) * 0.6; p.y -= Math.sin(baseAngle) * 0.6;
    },

    spawnPBullet: function (x, y, ang, s, isSplit) {
      var b = this.pbullets.get(x, y); if (!b) return null;
      b.setActive(true).setVisible(true).setDepth(18);
      if (b.body) { b.body.enable = true; b.body.reset(x, y); b.body.setCircle(5, 2, 2); }
      var size = 1 + (s.bulletSize || 0) * (isSplit ? 0.4 : 1);
      b.setScale(size);
      var spd = s.bulletSpeed * (isSplit ? 0.8 : 1) * (1 - (s.bulletSize || 0) * 0.12);
      b.setVelocity(Math.cos(ang) * spd, Math.sin(ang) * spd);
      var crit = rand() < (s.critChance || 0);
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

    // ── 적 탄막(Game.js 동일, walls 패턴만 방 가변 일반화) ────────────────────────
    spawnEBullet: function (x, y, ang, spd) {
      var b = this.ebullets.get(x, y); if (!b) return null;
      b.setActive(true).setVisible(true).setDepth(17);
      if (b.body) { b.body.enable = true; b.body.reset(x, y); b.body.setCircle(5.5, 2.5, 2.5); }
      b.setVelocity(Math.cos(ang) * spd, Math.sin(ang) * spd);
      b.life = 5;
      return b;
    },

    enemyPattern: function (e, kind) {
      var n = PD.RUN.floor, base = 120 + n * 2;
      var px = this.player.x, py = this.player.y;
      var toP = Phaser.Math.Angle.Between(e.x, e.y, px, py);
      if (kind === 'aimed') { this.spawnEBullet(e.x, e.y, toP, base); }
      else if (kind === 'aimed3') { for (var i = -1; i <= 1; i++) this.spawnEBullet(e.x, e.y, toP + i * 0.22, base); }
      else if (kind === 'ring') { var c = 10 + Math.min(8, Math.floor(n / 3)); for (var j = 0; j < c; j++) this.spawnEBullet(e.x, e.y, (j / c) * Math.PI * 2, base * 0.8); }
      else if (kind === 'fan') { for (var k = -3; k <= 3; k++) this.spawnEBullet(e.x, e.y, toP + k * 0.18, base * 0.9); }
      else if (kind === 'spiral') { e._sp = (e._sp || 0) + 0.5; for (var m = 0; m < 3; m++) this.spawnEBullet(e.x, e.y, e._sp + m * (Math.PI * 2 / 3), base * 0.85); }
      else if (kind === 'walls') {
        // (L6a) ARENA 하드코딩 → 현재 방 bounds 가변. 좌측 벽에서 좁은 틈 있는 탄벽.
        var b = (e.room && e.room.bounds) || this.room.bounds;
        var rows = 9;
        var gap = randInt(0, rows - 1);
        for (var w = 0; w < rows; w++) { if (Math.abs(w - gap) <= 1) continue; this.spawnEBullet(b.x + 10, b.y + 40 + w * ((b.h - 80) / (rows - 1)), 0, base * 0.7); }
      }
    },

    updateEnemies: function (d, time) {
      var self = this, p = this.player, cur = this.room;
      this.enemies.getChildren().forEach(function (e) {
        if (!e.active) return;
        if (e.spawnGrace > 0) e.spawnGrace -= d * 1000;
        // (L6a/방 스코프 토대) 현재 방 소속 적만 능동(L6b 가 방 전환으로 다중 방 활용)
        if (e.room && e.room !== cur) { e.setVelocity(0, 0); return; }
        if (e.isBoss) { self.updateBoss(e, d); return; }
        var def = e.def;
        if (def.behavior === 'chase') { self.physics.moveToObject(e, p, e.speed); }
        else if (def.behavior === 'spreader') { self.physics.moveToObject(e, p, e.speed); }
        else if (def.behavior === 'dart') {
          e.dartT -= d * 1000;
          if (e.dartT <= 0) { e.dartT = 700 + rand() * 700; var a = Phaser.Math.Angle.Between(e.x, e.y, p.x, p.y) + (rand() - 0.5); e.setVelocity(Math.cos(a) * e.speed * 2.4, Math.sin(a) * e.speed * 2.4); }
          else { e.setVelocity(e.body.velocity.x * 0.97, e.body.velocity.y * 0.97); }
        } else if (def.behavior === 'shooter') { e.setVelocity(0, 0); }
        if (def.fireEvery) {
          e.fireT -= d * 1000;
          if (e.fireT <= 0 && e.spawnGrace <= 0) { e.fireT = def.fireEvery; self.enemyPattern(e, def.pattern); }
        }
        // (L6a) 현재 방 bounds 클램프 — 벽 콜라이더가 1차, 이건 안전망(누출 방지)
        var b = cur.bounds;
        e.x = Phaser.Math.Clamp(e.x, b.x + 12, b.r - 12);
        e.y = Phaser.Math.Clamp(e.y, b.y + 12, b.b - 12);
      });
    },

    updateBoss: function (e, d) {
      var self = this, p = this.player;
      var RUN = PD.RUN;
      var b = (e.room && e.room.bounds) || this.room.bounds;
      // (L6a) 좌우 부유 이동 — ARENA → 방 bounds
      e.x += e.moveDir * e.speed * d;
      if (e.x < b.x + 60) e.moveDir = 1; if (e.x > b.r - 60) e.moveDir = -1;
      e.y = (e.baseY != null ? e.baseY : (b.y + 120)) + Math.sin(this.time.now / 700) * 24;
      var frac = e.hp / e.maxHp;
      var ph = frac > 0.66 ? 0 : (frac > 0.33 ? 1 : 2);
      RUN.bossHpFrac = frac;
      e.patternT -= d * 1000;
      if (e.patternT <= 0 && e.spawnGrace <= 0) {
        var rate = 1400 - ph * 350; e.patternT = rate;
        var pats = e.bdef.patterns;
        var kind = pats[e.patternI % pats.length]; e.patternI++;
        self.enemyPattern(e, kind);
        if (ph >= 1) self.enemyPattern(e, 'aimed3');
        if (ph >= 2 && rand() < 0.5) self.enemyPattern(e, 'ring');
      }
    },

    // ── 충돌 핸들러(Game.js 동일 + 타일 벽) ──────────────────────────────────────
    bulletHitWall: function (bullet) {
      // collider(group1=pbullets, group2=wallG) → 첫 인자가 탄. 반사 가능하면 튕김.
      if (!bullet.active) return;
      if (bullet.bounceLeft > 0) { bullet.bounceLeft--; this.bounceBulletOffWall(bullet); return; }
      this.killBullet(bullet);
    },
    ebulletHitWall: function (bullet) {
      if (!bullet.active) return;
      bullet.setActive(false).setVisible(false); if (bullet.body) bullet.body.enable = false;
    },
    // 벽에 닿은 탄을 진입 속도 성분 기준으로 반사(타일 충돌 법선 근사)
    bounceBulletOffWall: function (b) {
      if (!b.body) { this.killBullet(b); return; }
      var bl = b.body.blocked || {}, tc = b.body.touching || {};
      if (bl.left || bl.right || tc.left || tc.right) b.body.velocity.x *= -1;
      if (bl.up || bl.down || tc.up || tc.down) b.body.velocity.y *= -1;
      // 어느 쪽인지 불명확하면 수평 반사(안전 폴백)
      if (!(bl.left || bl.right || bl.up || bl.down || tc.left || tc.right || tc.up || tc.down)) b.body.velocity.x *= -1;
    },

    hitEnemy: function (bullet, enemy) {
      if (!bullet.active || !enemy.active || enemy.spawnGrace > 0) return;
      if (bullet.hitSet && bullet.hitSet.indexOf(enemy) >= 0) return;
      this.damageEnemy(enemy, bullet.damage, bullet.crit);
      this.fxHit.explode(bullet.crit ? 6 : 3, bullet.x, bullet.y);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('hit');
      if (bullet.splitLeft > 0 && enemy.active === false) {
        for (var i = 0; i < 2; i++) this.spawnPBullet(bullet.x, bullet.y, rand() * Math.PI * 2, PD.RUN.stats, true);
      }
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
      e.setTint(WHITE_INT); this.time.delayedCall(60, function () { if (e.active) { if (e.isBoss) e.setTint(e.bdef.tint); else e.clearTint(); } });
      if (e.hp <= 0) this.killEnemy(e);
    },

    killEnemy: function (e) {
      if (!e.active) return;
      var RUN = PD.RUN;
      var isBoss = e.isBoss;
      this.fxKill.explode(isBoss ? 40 : 12, e.x, e.y);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('enemyDie');
      this.cameras.main.shake(isBoss ? 500 : 120, isBoss ? 0.012 : 0.004);
      RUN.kills++;
      this.dropLoot(e.x, e.y, isBoss);
      if (isBoss) {
        RUN.boss = null; RUN.bossHpFrac = 0;
        this.cameras.main.flash(300, 255, 240, 180);
        var self = this;
        this.time.delayedCall(200, function () { self.spawnItemDrop(e.x, e.y); });
      }
      e.setActive(false).setVisible(false); if (e.body) e.body.enable = false;
      e.clearTint();
      // 방별 카운터 감소(스파이크 핵심) + 현재 방 미러
      if (e.room) e.room.enemiesLeft = Math.max(0, (e.room.enemiesLeft || 1) - 1);
      if (e.room === this.room) this.roomEnemiesLeft = e.room.enemiesLeft;
    },

    dropLoot: function (x, y, isBoss) {
      var s = PD.RUN.stats, luck = s.luck || 0;
      var coins = isBoss ? 8 + Math.floor(rand() * 6) : (rand() < 0.6 ? 1 + Math.floor(rand() * 2) : 0);
      for (var i = 0; i < coins; i++) this.spawnPickup('coin', x + (rand() - 0.5) * 30, y + (rand() - 0.5) * 30);
      if (rand() < 0.18 + luck * 0.03) this.spawnPickup('energy', x, y);
      if (rand() < 0.06 + luck * 0.02) this.spawnPickup('heart', x, y);
      if (!isBoss && rand() < 0.03 + luck * 0.02) this.spawnItemDrop(x, y);
    },

    // ── 픽업(ARENA → room.bounds 클램프) ────────────────────────────────────────
    spawnPickup: function (kind, x, y) {
      var pk = this.pickups.get(x, y, kind); if (!pk) return null;
      pk.setActive(true).setVisible(true).setDepth(14).setScale(kind === 'coin' ? 0.9 : 1);
      if (pk.body) { pk.body.enable = true; pk.body.reset(x, y); pk.body.setCircle(9, 1, 1); }
      pk.pkind = kind; pk.item = null;
      if (kind === 'coin') pk.play('coin-spin');
      var ang = rand() * Math.PI * 2, f = 30 + rand() * 40;
      pk.setVelocity(Math.cos(ang) * f, Math.sin(ang) * f);
      pk.life = 18;
      return pk;
    },

    spawnItemDrop: function (x, y) {
      var luck = PD.RUN.stats.luck || 0;
      var weights = { common: 60, rare: 28, epic: 11, legendary: 3 + luck * 1.5 };
      var pool = DROP_POOL.filter(function (it) { return it.kind === 'equipment'; });
      var bag = [];
      pool.forEach(function (it) { var w = Math.max(1, Math.round((weights[it.rarity] || 10) / Math.max(1, PD.countRarity(pool, it.rarity)))); for (var i = 0; i < w; i++) bag.push(it); });
      var pick2 = bag[Math.floor(rand() * bag.length)] || pool[0];
      var pk = this.pickups.get(x, y, 'star'); if (!pk) return;
      pk.setActive(true).setVisible(true).setDepth(14).setScale(1).clearTint();
      pk.setTint(RARITY_COLOR[pick2.rarity] || WHITE_INT);
      if (pk.body) { pk.body.enable = true; pk.body.reset(x, y); pk.body.setCircle(11, 3, 3); }
      pk.pkind = 'item'; pk.item = pick2; pk.life = 60;
      pk.setVelocity(0, -20);
      this.tweens.add({ targets: pk, y: y - 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    },

    updatePickups: function (d) {
      var p = this.player, rad = PD.RUN.stats.pickupRadius || 40;
      var b = this.room.bounds;
      this.pickups.getChildren().forEach(function (pk) {
        if (!pk.active) return;
        // item(런 아이템 드랍)·shop(구매대)은 고정 — 자석/수명/클램프 제외
        var fixed = (pk.pkind === 'item' || pk.pkind === 'shop');
        if (!fixed) {
          pk.life -= d; if (pk.life <= 0) { pk.setActive(false).setVisible(false); if (pk.body) pk.body.enable = false; return; }
          var dist = Phaser.Math.Distance.Between(pk.x, pk.y, p.x, p.y);
          if (dist < rad) {
            var a = Phaser.Math.Angle.Between(pk.x, pk.y, p.x, p.y);
            pk.x += Math.cos(a) * 260 * d; pk.y += Math.sin(a) * 260 * d;
          } else {
            pk.setVelocity(pk.body.velocity.x * 0.9, pk.body.velocity.y * 0.9);
          }
          pk.x = Phaser.Math.Clamp(pk.x, b.x + 8, b.r - 8);
          pk.y = Phaser.Math.Clamp(pk.y, b.y + 8, b.b - 8);
        }
      });
    },

    grabPickup: function (player, pk) {
      if (!pk.active) return;
      var RUN = PD.RUN;
      var k = pk.pkind;
      if (k === 'coin') { RUN.coins = (RUN.coins || 0) + Math.round(1 * (RUN.stats.coinMult || 1)); RUN.runGold = (RUN.runGold || 0) + Math.round(1 * (RUN.stats.coinMult || 1)); if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('coin'); }
      else if (k === 'energy') { this.kit.resources.energy.cur = Math.min(this.kit.resources.energy.max, this.kit.resources.energy.cur + 25); if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('coin'); }
      else if (k === 'heart') { RUN.hp = Math.min(RUN.maxHp, RUN.hp + 1); if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('powerup'); this.toastShow('+1 ♥'); }
      else if (k === 'item') { this.applyItem(pk.item); }
      else if (k === 'shop') {
        // (L6c) 상점 구매대 — 런 골드(coins)로 구매. 부족하면 토스트만 띄우고 유지.
        var price = pk.price || 20;
        if ((RUN.coins || 0) >= price) {
          RUN.coins -= price;
          if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('coin');
          this.applyItem(pk.item);
          this.toastShow('구매! -' + price + 'G', roleInt('ui_accent'));
          pk.setActive(false).setVisible(false); if (pk.body) pk.body.enable = false;
        } else {
          // 구매 실패 — 구매대 유지. 중복 토스트 방지를 위해 쿨다운.
          if (!pk._noGoldT || this.time.now - pk._noGoldT > 800) { this.toastShow('골드 부족 (' + price + 'G)', roleInt('danger')); pk._noGoldT = this.time.now; }
        }
        return;  // 구매대는 fxHit/소멸 공통 처리 제외
      }
      this.fxHit.explode(4, pk.x, pk.y);
      pk.setActive(false).setVisible(false); if (pk.body) pk.body.enable = false;
    },

    applyItem: function (it) {
      if (!it) return;
      var RUN = PD.RUN;
      if (it.kind === 'consumable') {
        var e = it.effect || {};
        if (e.heal) { RUN.hp = Math.min(RUN.maxHp, RUN.hp + e.heal); }
        if (e.energyRestore) { this.kit.resources.energy.cur = Math.min(this.kit.resources.energy.max, this.kit.resources.energy.cur + e.energyRestore); }
        this.toastShow(it.name);
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('powerup');
        return;
      }
      // 장비: 런 휘발 아이템으로 추가(SaveStore v2 — runItems). 하위호환 items 도 갱신.
      RUN.runItems = RUN.runItems || []; RUN.runItems.push(it.id);
      RUN.items = RUN.items || []; RUN.items.push(it.id);
      RUN.itemCounts = RUN.itemCounts || {}; RUN.itemCounts[it.id] = (RUN.itemCounts[it.id] || 0) + 1;
      var prevMax = RUN.maxHp;
      PD.recomputeStats();
      this.syncKitFromStats();
      if (RUN.maxHp > prevMax) RUN.hp += (RUN.maxHp - prevMax);
      RUN.hp = Phaser.Math.Clamp(RUN.hp, 1, RUN.maxHp);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('powerup');
      this.cameras.main.flash(140, 255, 220, 120);
      this.toastShow('획득: ' + it.name + ' (' + PD.rarityName(it.rarity) + ')', RARITY_COLOR[it.rarity]);
    },

    syncKitFromStats: function () {
      var s = PD.RUN.stats;
      var er = this.kit.resources.energy;
      er.max = 100 + (s.energyMax || 0);
      er.def.regen = 9 + (s.energyRegen || 0);
      if (er.cur > er.max) er.cur = er.max;
      var want = 2 + (s.dodgeCharges || 0);
      this.kit.byId.dodge_roll.charges = want;
      if ((this.kit.charges.dodge_roll || 0) < want && this.kit.cd.dodge_roll <= 0) this.kit.charges.dodge_roll = want;
    },

    hitPlayer: function (player, bullet) {
      if (!bullet.active) return;
      if (player.invuln > 0 || player.dashT > 0) return;
      bullet.setActive(false).setVisible(false); if (bullet.body) bullet.body.enable = false;
      this.playerHurt();
    },

    touchPlayer: function (player, enemy) {
      if (!enemy.active || enemy.spawnGrace > 0) return;
      if (player.dashT > 0 && player.dashDamage) { this.damageEnemy(enemy, player.dashDamage); return; }
      if (player.invuln > 0 || player.dashT > 0) return;
      if (PD.RUN.stats.contactDamage) this.damageEnemy(enemy, PD.RUN.stats.contactDamage);
      this.playerHurt();
    },

    playerHurt: function () {
      var RUN = PD.RUN;
      var p = this.player;
      if (RUN.stats.armor && rand() < Math.min(0.6, RUN.stats.armor * 0.22)) { this.toastShow('방어!'); p.invuln = 0.6; this.fxPuff.explode(6, p.x, p.y); return; }
      RUN.hp--;
      p.invuln = 1.2;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('hurt');
      this.cameras.main.shake(260, 0.01);
      this.cameras.main.flash(140, 255, 60, 60);
      if (RUN.hp <= 0) this.gameOver();
    },

    // ── 탄 업데이트(ARENA → room.bounds 컬링/반사) ────────────────────────────────
    updateBullets: function (d) {
      var self = this;
      var room = this.room, b = room.bounds;
      this.pbullets.getChildren().forEach(function (bu) {
        if (!bu.active) return;
        bu.life -= d; if (bu.life <= 0) { self.killBullet(bu); return; }
        if (bu.homing > 0) {
          var t = self.nearestEnemy(bu.x, bu.y);
          if (t) {
            var desired = Phaser.Math.Angle.Between(bu.x, bu.y, t.x, t.y);
            var cur = Math.atan2(bu.body.velocity.y, bu.body.velocity.x);
            var na = Phaser.Math.Angle.RotateTo(cur, desired, bu.homing * 6 * d);
            var sp = Math.sqrt(bu.body.velocity.x * bu.body.velocity.x + bu.body.velocity.y * bu.body.velocity.y);
            bu.setVelocity(Math.cos(na) * sp, Math.sin(na) * sp);
          }
        }
        // (L6a) 현재 방 outer rect 밖으로 나간 내 탄 컬링(벽 콜라이더가 1차, 이건 안전망)
        if (bu.x < room.ox - TILE || bu.x > room.ox + room.ow + TILE || bu.y < room.oy - TILE || bu.y > room.oy + room.oh + TILE) self.killBullet(bu);
      });
      this.ebullets.getChildren().forEach(function (bu) {
        if (!bu.active) return;
        bu.life -= d; if (bu.life <= 0) { bu.setActive(false).setVisible(false); if (bu.body) bu.body.enable = false; return; }
        // (L6a) 현재 방 밖 적탄 컬링
        if (bu.x < room.ox - TILE || bu.x > room.ox + room.ow + TILE || bu.y < room.oy - TILE || bu.y > room.oy + room.oh + TILE) { bu.setActive(false).setVisible(false); if (bu.body) bu.body.enable = false; }
      });
    },

    killBullet: function (b) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; },

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

    // ── (L6b) 방 클리어 — 전멸한 전투 방의 문 개방 + 클리어 보상(골드·드랍) ──────────
    onRoomCleared: function (room) {
      room = room || this.room;
      if (room.cleared) return;
      room.cleared = true;
      PD.RUN.cleared = PD.RUN.cleared || {}; PD.RUN.cleared[room.id] = true;  // (L6c) 미니맵 상태
      this.lockDoors(room, false);       // 인접 문 개방
      this.bannerShow(room.id + ' 클리어! 문 개방', roleInt('pickup'));
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('doorOpen');   // (사운드 §3) 문 개방 스르륵
      // (사운드 §4) 전투 종료 — 탐험 트랙 복귀 + 인텐시티 하강(여운)
      if (GAME_AUDIO.setSection && this.exploreTrack) GAME_AUDIO.setSection(this.exploreTrack);
      if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.2);
      this.toastShow(STORY_TEXT.clearBarks[Math.floor(Math.random() * STORY_TEXT.clearBarks.length)], roleInt('ui_accent'));
      // 클리어 보상: 방 중심에 코인 더미 + 낮은 확률 아이템(보스방은 spawnBoss/killEnemy 가 별도 처리)
      if (room.kindHint !== 'boss') {
        var b = room.bounds, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        var coins = 2 + Math.floor(rand() * 3);
        for (var i = 0; i < coins; i++) this.spawnPickup('coin', cx + (rand() - 0.5) * 40, cy + (rand() - 0.5) * 40);
      }
      // 출구(X) 마커가 이 방에 있으면(보스/종료방) 출구 활성 안내
      if (room.markers && room.markers.X && room.markers.X.length) {
        this.bannerShow('출구 개방 — X로 하강', rampInt('gold', 3));
      }
      // (L6b) 층 전체 전투 방을 모두 클리어했고 출구 'X'가 층 어디에도 없으면(일반층 샘플)
      //   → 하강 포탈을 현재 방에 띄운다(출구 대체).
      if (this.allCombatCleared() && !this.floorHasExit() && !this.portal) {
        this.spawnDescentPortal(room);
      }
    },

    // 방이 전투 잠재력(스폰 정의·'E' 마커·보스)을 가진 전투 방인지(정적 판정)
    isCombatRoom: function (rm) {
      if (rm.kindHint === 'boss') return true;
      if (rm.spawnDefs && rm.spawnDefs.length) return true;
      if (rm.parsed && rm.parsed.spawns && rm.parsed.spawns.length) return true;
      return false;
    },

    // 층의 모든 전투 방(정적 정의 기준)이 클리어됐는지 — 미입실 방도 포함해야
    //   첫 방 클리어로 조기 하강 포탈이 뜨는 결함을 막는다.
    allCombatCleared: function () {
      var rs = this.rooms, self = this, ok = true;
      Object.keys(rs).forEach(function (id) {
        var rm = rs[id];
        if (self.isCombatRoom(rm) && !rm.cleared) ok = false;
      });
      return ok;
    },

    // 층 어딘가에 출구 'X' 마커가 있는지(보스층은 있음, 일반 샘플층은 없음)
    floorHasExit: function () {
      var rs = this.rooms, has = false;
      Object.keys(rs).forEach(function (id) {
        var rm = rs[id];
        if (rm.markers && rm.markers.X && rm.markers.X.length) has = true;
      });
      return has;
    },

    // 하강 포탈(출구 'X'가 없는 일반층용) — 닿으면 다음 층
    spawnDescentPortal: function (room) {
      var self = this;
      var b = room.bounds, px = b.x + b.w / 2, py = b.y + b.h / 2;
      this.portal = this.physics.add.sprite(px, py, 'portal').setDepth(12);
      this.portal.body.setCircle(26, 9, 9);
      this.tweens.add({ targets: this.portal, scale: 1.12, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.tweens.add({ targets: this.portal, angle: 360, duration: 4000, repeat: -1 });
      this.bannerShow('포탈로 하강 ↓', rampInt('stone', 3));
      this.portalOverlap = this.physics.add.overlap(this.player, this.portal, function () { self.descend(); });
    },

    // ── (L6b) 출구 도달 — 클리어/안전 방의 'X' 마커에 닿으면 다음 층 ───────────────
    checkExitReached: function () {
      var room = this.room;
      if (!room.markers || !room.markers.X || !room.markers.X.length) return;
      // 출구는 방이 클리어됐거나 전투 방이 아닐 때만 활성(보스방은 보스 처치 후)
      if (room.spawned && !room.cleared) return;
      var m = room.markers.X[0];
      var ex = room.ox + (m.c + 0.5) * TILE, ey = room.oy + (m.r + 0.5) * TILE;
      var p = this.player;
      if (Phaser.Math.Distance.Between(p.x, p.y, ex, ey) < TILE * 0.8) this.descend();
    },

    descend: function () {
      if (this.state !== 'play') return;
      this.state = 'transition';
      var self = this;
      var RUN = PD.RUN, SAVE = PD.SAVE;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('descend');
      this.cameras.main.flash(200, 180, 200, 255);
      // 최고 기록 갱신(SaveStore v2)
      if (SAVE && RUN.floor > (SAVE.bestFloor || 0)) { SAVE.bestFloor = RUN.floor; if (PD.SaveStore) PD.SaveStore.save(SAVE); }

      // 지역 경계 판정: 지역의 마지막 층(10층 단위)을 클리어하면 체크포인트·귀환 분기
      var region = RUN.region || 1;
      var isRegionLast = (RUN.floor % 10 === 0);   // x0층 = 각 지역 보스/종료층
      if (RUN.floor >= 100) { this.win(); return; }

      this.cameras.main.fadeOut(260, 10, 6, 24);
      this.cameras.main.once('camerafadeoutcomplete', function () {
        if (isRegionLast) {
          // 지역 클리어 → 체크포인트 갱신(commitRun clear 경로) → Village 귀환
          if (PD.SaveStore && PD.SaveStore.commitRun && SAVE) {
            RUN.region = region;  // 도달 지역 기록
            PD.SaveStore.commitRun(RUN, SAVE, 'clear');
          }
          self.returnToVillage('지역 클리어! 마을로 귀환');
        } else {
          // 같은 지역 다음 층 — 그래프 재구성 후 시작 방 재개(씬 재시작)
          RUN.floor = (RUN.floor || 1) + 1;
          self.scene.restart();
        }
      });
    },

    // 마을 귀환(없으면 Title 폴백) — HUD 정지
    returnToVillage: function (msg) {
      var self = this;
      this.scene.stop('HUD');
      if (this.scene.get('Village')) { this.scene.start('Village'); }
      else if (this.scene.get('WorldMap')) { this.scene.start('WorldMap'); }
      else { this.scene.start('Title'); }
    },

    // ── 종료(SaveStore v2 commitRun 단일 경로) ───────────────────────────────────
    gameOver: function () {
      if (this.state === 'dead') return;
      this.state = 'dead';
      var RUN = PD.RUN, SAVE = PD.SAVE;
      var p = this.player;
      p.setVelocity(0, 0); p.dashT = 0;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('gameover');
      if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.1);
      this.fxKill.explode(30, p.x, p.y);
      this.cameras.main.shake(400, 0.012);
      p.setVisible(false);
      // commitRun: 사망 경로(골드 귀환·체크포인트·도감·퀘스트·스토리 플래그 병합)
      if (PD.SaveStore && PD.SaveStore.commitRun && SAVE) PD.SaveStore.commitRun(RUN, SAVE, 'death');
      var self = this;
      this.time.delayedCall(700, function () {
        self.scene.stop('HUD');
        self.scene.start('Result', { win: false, floor: RUN.floor, coins: RUN.coins, kills: RUN.kills });
      });
    },

    win: function () {
      if (this.state === 'win') return;
      this.state = 'win';
      var RUN = PD.RUN, SAVE = PD.SAVE;
      this.player.setVelocity(0, 0);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('win');
      if (PD.SaveStore && PD.SaveStore.commitRun && SAVE) PD.SaveStore.commitRun(RUN, SAVE, 'clear');
      var self = this;
      this.cameras.main.flash(400, 255, 240, 180);
      this.time.delayedCall(800, function () {
        self.scene.stop('HUD');
        self.scene.start('Result', { win: true, floor: 100, coins: RUN.coins, kills: RUN.kills });
      });
    },

    // ── (L6c) 미니맵 상태 공급 — HUD 가 PD.Minimap.draw 에 넘긴다 ────────────────────
    minimapState: function () {
      return {
        graph: this.graph,
        current: this.room ? this.room.id : null,
        visited: (PD.RUN && PD.RUN.visited) || {},
        cleared: (PD.RUN && PD.RUN.cleared) || {},
        floor: (PD.RUN && PD.RUN.floor) || 1
      };
    },

    // ── 일시정지(native.js 백버튼 계약) ──────────────────────────────────────────
    togglePause: function () {
      this.paused = !this.paused;
      if (this.paused) { this.physics.world.pause(); this.bannerShow('일시정지', rampInt('stone', 3)); }
      else { this.physics.world.resume(); }
    },

    // ── 배너/토스트/흔적 ──────────────────────────────────────────────────────────
    bannerShow: function (txt, color) {
      this.banner.setText(txt).setColor('#' + (color || WHITE_INT).toString(16).padStart(6, '0')).setAlpha(0).setScale(0.6);
      this.tweens.add({ targets: this.banner, alpha: 1, scale: 1, duration: 260, ease: 'Back.out' });
      this.tweens.add({ targets: this.banner, alpha: 0, delay: 1100, duration: 400 });
    },
    toastShow: function (txt, color) {
      this.toast.setText(txt).setColor('#' + (color || roleInt('pickup')).toString(16).padStart(6, '0')).setAlpha(1).setY(DESIGN_H - 150);
      this.tweens.killTweensOf(this.toast);
      this.tweens.add({ targets: this.toast, y: DESIGN_H - 180, alpha: 0, delay: 700, duration: 500 });
    },
    traceShow: function (txt) {
      this.trace.setText(txt).setAlpha(0);
      this.tweens.killTweensOf(this.trace);
      this.tweens.add({ targets: this.trace, alpha: 1, delay: 650, duration: 400 });
      this.tweens.add({ targets: this.trace, alpha: 0, delay: 4400, duration: 500 });
    }
  });
})();
