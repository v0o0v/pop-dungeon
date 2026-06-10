/* ============================================================================
 * 팡팡 던전 — SpikeMaze (Phase 0.5 미로 런타임 스파이크 PoC · 게이트)
 * ----------------------------------------------------------------------------
 * 진입: index.html?spike=1  → core.js boot 이 첫 씬으로 SpikeMaze 시작.
 * 목적: Phase 3(100층 양산) 선행 게이트. 하드코딩 미로 1개(방 4개 + 문 3개)로
 *       아래 6항목을 실제 런타임에서 증명한다(L6a 가 이 골격을 흡수):
 *
 *   (1) ARENA → room.bounds 추상화: 플레이어/적/탄/픽업 좌표 클램프·반사·스폰이
 *       전부 "현재 방 bounds" 기준으로 동작(고정 ARENA 의존 제거).
 *   (2) 신규 타일 물리: staticGroup 벽 콜라이더 + player/enemy/bullet 충돌.
 *   (3) 방 단위 전투 스코프: 적·웨이브를 방 단위로 격리(현재 방만 활성·충돌).
 *   (4) 문 잠금/개방: 전투 방 입실 시 인접 문 잠김(벽 콜라이더) → 전멸 시 개방.
 *   (5) 카메라 추적: startFollow(player) + 현재 방 bounds 로 setBounds.
 *   (6) 60fps: 비활성 방 적/탄 컬링 + 풀링 — 프리뷰 fps 오버레이로 확인.
 *
 * 전투 골격(이동/자동발사/적 AI/충돌)은 GameScene 에서 복사해 방 좌표계로
 * 일반화했다(스파이크는 골격 증명이 목적, L6a 가 정식 흡수). 텍스처/애니/팔레트는
 * Boot 가 베이크한 전역 자원(hero/slime/bat/turret/orb/pbullet/ebullet/spark)을 재사용.
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = window.PD;
  var spike = PD.spike;
  var TILE = spike.TILE, DIR = spike.DIR, OPP = spike.OPP;
  var ROLE = PD.ROLE, WHITE = PD.WHITE, INK = PD.INK;
  var WHITE_INT = PD.WHITE_INT, INK_INT = PD.INK_INT;
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt;
  var ENEMY_TYPES = PD.ENEMY_TYPES;
  var rand = PD.rand, randInt = PD.randInt;

  var MOVE_SPEED = 188, FIRE_DELAY = 0.34, BULLET_SPEED = 460, BULLET_DMG = 8;

  PD.scenes.SpikeMaze = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function SpikeMazeScene() { Phaser.Scene.call(this, { key: 'SpikeMaze' }); },

    create: function () {
      var self = this;
      // 결정성: 시드 초기화(헤드리스 step 재현)
      PD.setSeed(0x51b3e);

      this.cameras.main.setBackgroundColor(PD.FLOOR_BG[0]);

      // 미로 데이터(방 4개 + 문 3개)
      this.maze = spike.buildMaze();
      this.rooms = this.maze.rooms;
      this.curRoom = this.rooms[this.maze.start];

      // 월드 경계: 모든 방을 포괄(카메라 setBounds 가 방별로 다시 좁힘)
      var wb = this.worldExtent();
      this.physics.world.setBounds(wb.x, wb.y, wb.w, wb.h);

      // ── (2) 타일 물리: 벽 staticGroup + 시각 그리기 ─────────────────────────
      this.wallG = this.physics.add.staticGroup();   // 영구 벽
      this.doorWalls = {};                            // roomId|dir -> staticImage(문 잠금 콜라이더)
      this.floorGfx = this.add.graphics().setDepth(0);
      this.wallGfx = this.add.graphics().setDepth(1);
      this.drawAllRooms();
      this.bakeWalls();

      // 풀
      this.pbullets = this.physics.add.group({ defaultKey: 'pbullet', maxSize: 80 });
      this.ebullets = this.physics.add.group({ defaultKey: 'ebullet', maxSize: 200 });
      this.enemies = this.physics.add.group({ maxSize: 60 });

      // 플레이어(시작 방 중심)
      var c = this.curRoom.center();
      this.player = this.physics.add.sprite(c.x, c.y, 'hero', 0).setDepth(20);
      this.player.play('hero-idle');
      this.player.body.setCircle(11, 7, 11);
      this.player.invuln = 0; this.player.aim = -Math.PI / 2; this.player.aim2 = -Math.PI / 2;
      this.player.fireCd = 0; this.player.hp = 6; this.player.maxHp = 6;

      // 파티클
      this.fxHit = this.add.particles(0, 0, 'spark', { lifespan: 300, speed: { min: 40, max: 150 }, scale: { start: 0.7, end: 0 }, alpha: { start: 0.9, end: 0 }, blendMode: 'ADD', emitting: false }).setDepth(30);
      this.fxKill = this.add.particles(0, 0, 'spark', { lifespan: 460, speed: { min: 60, max: 230 }, scale: { start: 1.1, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', emitting: false }).setDepth(30);

      // ── (2) 충돌 배선 ───────────────────────────────────────────────────────
      this.physics.add.collider(this.player, this.wallG);           // 플레이어 ↔ 벽
      this.physics.add.collider(this.enemies, this.wallG);          // 적 ↔ 벽
      this.physics.add.collider(this.pbullets, this.wallG, this.bulletHitWall, null, this); // 내 탄 ↔ 벽
      this.physics.add.collider(this.ebullets, this.wallG, this.bulletHitWall, null, this); // 적탄 ↔ 벽
      this.physics.add.overlap(this.pbullets, this.enemies, this.hitEnemy, null, this);
      this.physics.add.overlap(this.ebullets, this.player, this.hitPlayer, null, this);
      this.physics.add.overlap(this.enemies, this.player, this.touchPlayer, null, this);

      // 키보드(데스크톱 검증) + 터치 입력 폴링(GAME_INPUT)
      this.keys = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D', up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT' });
      this.GAME_INPUT = PD.GAME_INPUT;

      // ── (5) 카메라: 플레이어 추적 + 현재 방 경계 ─────────────────────────────
      var cam = this.cameras.main;
      cam.startFollow(this.player, true, 0.15, 0.15);
      cam.setRoundPixels(true);
      this.applyCameraBounds(this.curRoom);

      // HUD 오버레이(스파이크 자체 — fps·방 상태·항목 체크. 카메라 스크롤 무시)
      this.hud = this.add.text(8, 8, '', { fontFamily: 'monospace', fontSize: '13px', color: WHITE, backgroundColor: 'rgba(10,12,20,0.55)', padding: { x: 6, y: 4 } }).setScrollFactor(0).setDepth(100);
      this.banner = this.add.text(PD.DESIGN_W / 2, 90, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '22px', color: WHITE }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0).setShadow(0, 2, INK, 3);

      // 입실 처리(시작 방은 안전 — 적 없음, 문 열림)
      this.enterRoom(this.curRoom);

      this._fpsAccum = 0; this._fpsFrames = 0; this._fps = 0;
      this._t = 0;

      // 헤드리스/외부 핸들 + 6항목 자가 점검 결과(QA 가 읽음)
      window.PopDungeon = window.PopDungeon || {};
      window.PopDungeon.spikeScene = this;
      window.PopDungeon.spikeReport = function () { return self.selfCheck(); };
    },

    // ── 월드 전체 사각형(모든 방 포괄) ──────────────────────────────────────────
    worldExtent: function () {
      var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
      var rs = this.rooms;
      Object.keys(rs).forEach(function (id) {
        var r = rs[id];
        minX = Math.min(minX, r.ox); minY = Math.min(minY, r.oy);
        maxX = Math.max(maxX, r.ox + r.ow); maxY = Math.max(maxY, r.oy + r.oh);
      });
      return { x: minX - TILE, y: minY - TILE, w: (maxX - minX) + TILE * 2, h: (maxY - minY) + TILE * 2 };
    },

    // ── (1)(5) 카메라 경계를 현재 방 outer rect 로 ──────────────────────────────
    applyCameraBounds: function (room) {
      this.cameras.main.setBounds(room.ox, room.oy, room.ow, room.oh);
    },

    // ── 방 바닥/벽 시각화(전 방 한 번에 — 비활성 방은 어둡게) ─────────────────────
    drawAllRooms: function () {
      var fg = this.floorGfx, wg = this.wallGfx;
      var rs = this.rooms, self = this;
      Object.keys(rs).forEach(function (id) {
        var room = rs[id];
        // 바닥(돌)
        fg.fillStyle(rampInt('stone', 0), 1);
        fg.fillRect(room.bounds.x, room.bounds.y, room.bounds.w, room.bounds.h);
        // 브릭 줄눈
        fg.fillStyle(rampInt('stone', 1), 1);
        for (var y = room.bounds.y + 24; y < room.bounds.b - 2; y += 24) fg.fillRect(room.bounds.x + 2, y, room.bounds.w - 4, 1);
        // 벽 타일
        for (var r = 0; r < room.rows; r++) {
          for (var cc = 0; cc < room.cols; cc++) {
            if (room.tiles[r][cc] === 1) self.drawWallTile(wg, room.tileRect(cc, r));
          }
        }
      });
    },

    drawWallTile: function (g, rect) {
      g.fillStyle(rampInt('stone', 2), 1);
      g.fillRect(rect.x, rect.y, rect.w, rect.h);
      g.fillStyle(rampInt('stone', 3), 1);          // NW 림라이트
      g.fillRect(rect.x, rect.y, rect.w, 2);
      g.fillRect(rect.x, rect.y, 2, rect.h);
      g.fillStyle(rampInt('stone', 1), 1);          // SE 그림자
      g.fillRect(rect.x, rect.y + rect.h - 2, rect.w, 2);
    },

    // ── (2) 벽 타일 → staticGroup 콜라이더 베이크 ──────────────────────────────
    bakeWalls: function () {
      var rs = this.rooms, self = this;
      Object.keys(rs).forEach(function (id) {
        var room = rs[id];
        for (var r = 0; r < room.rows; r++) {
          for (var cc = 0; cc < room.cols; cc++) {
            if (room.tiles[r][cc] === 1) {
              var rect = room.tileRect(cc, r);
              self.addWallBody(rect.x + TILE / 2, rect.y + TILE / 2);
            }
          }
        }
      });
    },

    // 보이지 않는 정사각 정적 바디(타일 1칸). 'square'(6x6) 텍스처를 TILE 로 스케일.
    addWallBody: function (cx, cy) {
      var w = this.wallG.create(cx, cy, 'square').setVisible(false);
      w.setDisplaySize(TILE, TILE);
      w.body.setSize(TILE, TILE);
      w.body.updateFromGameObject();
      return w;
    },

    // ── (3)(4) 방 입실: 전투 방이면 적 스폰 + 문 잠금 ───────────────────────────
    //   카운터는 방 객체(room.enemiesLeft)에 저장 — 전역 단일 변수는 방 전환 시 덮어써져
    //   다중 방 스코프가 깨진다(방 단위 전투 스코프의 핵심). this.roomEnemiesLeft 는
    //   "현재 방 카운터의 미러"로만 쓴다.
    enterRoom: function (room) {
      var self = this;
      // 같은 방 재진입은 무시(매 프레임 checkRoomTransition 이 호출해도 1회만 처리)
      if (this.curRoom === room && room.spawned) { return; }
      this.curRoom = room;
      this.applyCameraBounds(room);
      room.visited = true;

      if (room.spawns.length && !room.cleared && !room.spawned) {
        // (3) 방 단위 전투 스코프: 이 방의 적만 1회 스폰·활성(재입실해도 재스폰 안 함)
        room.spawned = true;
        room.enemiesLeft = 0;
        room.spawns.forEach(function (sp) {
          var def = ENEMY_TYPES[sp.type];
          var wx = room.ox + (sp.tx + 0.5) * TILE, wy = room.oy + (sp.ty + 0.5) * TILE;
          self.spawnEnemy(sp.type, def, wx, wy, room);
        });
        // (4) 인접 문 전부 잠금(벽 콜라이더 삽입) — 아직 미클리어 전투 방
        this.lockDoors(room, true);
        this.bannerShow(room.id + '실 — 적 ' + room.enemiesLeft, roleInt('enemy'));
      } else if (!room.spawns.length) {
        this.bannerShow(room.id + '실 — 안전', roleInt('ui_accent'));
      }
      // 현재 방 카운터 미러(전투 방이면 남은 적 수, 안전/클리어 방이면 0)
      this.roomEnemiesLeft = room.enemiesLeft || 0;
    },

    // ── (4) 문 잠금/개방 토글 ───────────────────────────────────────────────────
    lockDoors: function (room, locked) {
      var self = this;
      Object.keys(room.doors).forEach(function (dir) {
        room.doors[dir].locked = locked;
        var key = room.id + '|' + dir;
        if (locked) {
          if (!self.doorWalls[key]) {
            var w = room.doorWorld(dir);
            self.doorWalls[key] = self.addWallBody(w.x, w.y);
          }
          self.doorWalls[key].body.enable = true;
          self.doorWalls[key].setActive(true);
        } else if (self.doorWalls[key]) {
          self.doorWalls[key].body.enable = false;
          self.doorWalls[key].setActive(false);
        }
      });
      this.redrawDoors(room);
    },

    // 문 비주얼: 잠김=가로/세로 빗장, 열림=바닥색으로 비움
    redrawDoors: function (room) {
      if (!this._doorGfx) this._doorGfx = this.add.graphics().setDepth(2);
      var g = this._doorGfx;
      // 전부 다시(간단·결정적) — 모든 방 문 상태 반영
      g.clear();
      var rs = this.rooms, self = this;
      Object.keys(rs).forEach(function (id) {
        var rm = rs[id];
        Object.keys(rm.doors).forEach(function (dir) {
          var w = rm.doorWorld(dir);
          if (rm.doors[dir].locked) {
            g.fillStyle(rampInt('scarlet', 2), 1);
            g.fillRect(w.x - TILE / 2 + 3, w.y - TILE / 2 + 3, TILE - 6, TILE - 6);
            g.fillStyle(rampInt('scarlet', 0), 1);
            g.fillRect(w.x - TILE / 2 + 3, w.y - 2, TILE - 6, 4);
          } else {
            g.fillStyle(rampInt('hero', 1), 0.5);
            g.fillRect(w.x - TILE / 2 + 6, w.y - TILE / 2 + 6, TILE - 12, TILE - 12);
          }
        });
      });
    },

    // ── 적 스폰(방 소속) ────────────────────────────────────────────────────────
    spawnEnemy: function (type, def, x, y, room) {
      var e = this.enemies.get(x, y, def.tex);
      if (!e) return null;
      e.setActive(true).setVisible(true).setDepth(15).setScale(1).clearTint();
      if (e.body) { e.body.enable = true; e.body.reset(x, y); e.body.setCircle(def.radius, 4, 4); }
      if (def.anim) e.play(def.anim);
      e.etype = type; e.def = def; e.room = room;
      e.maxHp = def.hp + 2; e.hp = e.maxHp;
      e.speed = def.speed; e.fireT = (def.fireEvery || 0) * (0.4 + rand() * 0.6);
      e.dartT = 300 + rand() * 600; e.spawnGrace = 300;
      e.setAlpha(0.2); this.tweens.add({ targets: e, alpha: 1, duration: 300 });
      room.enemiesLeft = (room.enemiesLeft || 0) + 1;
      if (room === this.curRoom) this.roomEnemiesLeft = room.enemiesLeft;
      return e;
    },

    // ── 업데이트 루프 ───────────────────────────────────────────────────────────
    update: function (time, dt) {
      var d = dt / 1000;
      this._t += dt;
      // fps 측정(1초 윈도)
      this._fpsAccum += dt; this._fpsFrames++;
      if (this._fpsAccum >= 500) { this._fps = Math.round(this._fpsFrames * 1000 / this._fpsAccum); this._fpsAccum = 0; this._fpsFrames = 0; }

      this.handlePlayer(d, time);
      this.updateEnemies(d);
      this.updateBullets(d);
      this.checkRoomTransition();

      // (3) 방 클리어 판정 — 스폰된 전투 방이 전멸(room.enemiesLeft<=0)했을 때만
      var cr = this.curRoom;
      if (cr.spawned && !cr.cleared && (cr.enemiesLeft || 0) <= 0) {
        cr.cleared = true;
        this.lockDoors(cr, false);   // (4) 전멸 → 인접 문 개방
        this.bannerShow(cr.id + '실 클리어! 문 개방', roleInt('pickup'));
        if (PD.GAME_AUDIO && PD.GAME_AUDIO.sfx) PD.GAME_AUDIO.sfx('powerup');
      }

      this.updateHud();
    },

    // ── (1) 플레이어: 이동·자동조준·자동발사 (현재 방 bounds 기준 클램프) ─────────
    handlePlayer: function (d, time) {
      var p = this.player; if (!p.active) return;
      var gi = this.GAME_INPUT;
      var mx = gi.moveX || 0, my = gi.moveY || 0;
      if (this.keys.left.isDown || this.keys.left2.isDown) mx = -1; if (this.keys.right.isDown || this.keys.right2.isDown) mx = 1;
      if (this.keys.up.isDown || this.keys.up2.isDown) my = -1; if (this.keys.down.isDown || this.keys.down2.isDown) my = 1;
      var mag = Math.sqrt(mx * mx + my * my); if (mag > 1) { mx /= mag; my /= mag; }

      if (p.invuln > 0) p.invuln -= d;
      p.setVelocity(mx * MOVE_SPEED, my * MOVE_SPEED);
      if (mag > 0.1) p.aim2 = Math.atan2(my, mx);
      p.setFlipX(Math.cos(p.aim) < 0);

      // 자동조준 + 자동발사(현재 방 내 적만 — 방 단위 스코프)
      var target = this.nearestEnemy(p.x, p.y);
      if (target) p.aim = Phaser.Math.Angle.Between(p.x, p.y, target.x, target.y);
      else p.aim = p.aim2;
      p.fireCd -= d;
      if (target && p.fireCd <= 0) { p.fireCd = FIRE_DELAY; this.firePlayer(p.aim); }

      p.setAlpha(p.invuln > 0 && Math.floor(time / 60) % 2 === 0 ? 0.4 : 1);
    },

    // ── (5)(1) 방 전환: 문을 통과해 인접 방 bounds 로 진입하면 카메라/스코프 전환 ──
    checkRoomTransition: function () {
      var p = this.player;
      var room = this.curRoom;
      // 아직 현재 방 bounds 안이면 전환 없음(방 사이 여백에 있어도 현재 방 유지)
      if (room.contains(p.x, p.y)) return;
      var rs = this.rooms, self = this;
      // 1순위: 현재 방의 이웃(정상 플레이 경로 — 문으로 연결된 방)
      var keys = Object.keys(room.doors);
      for (var i = 0; i < keys.length; i++) {
        var nb = rs[room.doors[keys[i]].to];
        if (nb && nb.contains(p.x, p.y)) { self.enterRoom(nb); return; }
      }
      // 2순위: 어느 방 bounds 에 들어왔는지 전체 검사(견고성 — 어떤 경로로든 방 인식)
      var ids = Object.keys(rs);
      for (var j = 0; j < ids.length; j++) {
        var r = rs[ids[j]];
        if (r !== room && r.contains(p.x, p.y)) { self.enterRoom(r); return; }
      }
    },

    nearestEnemy: function (x, y) {
      var best = null, bd = 1e9;
      this.enemies.getChildren().forEach(function (e) {
        if (!e.active || e.spawnGrace > 0) return;
        var dd = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
        if (dd < bd) { bd = dd; best = e; }
      });
      return best;
    },

    firePlayer: function (ang) {
      var p = this.player;
      var b = this.pbullets.get(p.x + Math.cos(ang) * 12, p.y + Math.sin(ang) * 12);
      if (!b) return;
      b.setActive(true).setVisible(true).setDepth(18);
      if (b.body) { b.body.enable = true; b.body.reset(p.x + Math.cos(ang) * 12, p.y + Math.sin(ang) * 12); b.body.setCircle(5, 2, 2); }
      b.setVelocity(Math.cos(ang) * BULLET_SPEED, Math.sin(ang) * BULLET_SPEED);
      b.damage = BULLET_DMG; b.life = 1.6;
      if (PD.GAME_AUDIO && PD.GAME_AUDIO.sfx) PD.GAME_AUDIO.sfx('shoot');
    },

    spawnEBullet: function (x, y, ang, spd) {
      var b = this.ebullets.get(x, y); if (!b) return;
      b.setActive(true).setVisible(true).setDepth(17);
      if (b.body) { b.body.enable = true; b.body.reset(x, y); b.body.setCircle(5.5, 2.5, 2.5); }
      b.setVelocity(Math.cos(ang) * spd, Math.sin(ang) * spd);
      b.life = 4;
    },

    // ── 적 AI(현재 방 적만 능동) ────────────────────────────────────────────────
    updateEnemies: function (d) {
      var self = this, p = this.player, cur = this.curRoom;
      this.enemies.getChildren().forEach(function (e) {
        if (!e.active) return;
        if (e.spawnGrace > 0) e.spawnGrace -= d * 1000;
        // (3) 현재 방 소속 적만 능동(다른 방 적은 정지 — 컬링/스코프)
        if (e.room !== cur) { e.setVelocity(0, 0); return; }
        var def = e.def;
        if (def.behavior === 'chase' || def.behavior === 'spreader') { self.physics.moveToObject(e, p, e.speed); }
        else if (def.behavior === 'dart') {
          e.dartT -= d * 1000;
          if (e.dartT <= 0) { e.dartT = 700 + rand() * 700; var a = Phaser.Math.Angle.Between(e.x, e.y, p.x, p.y) + (rand() - 0.5); e.setVelocity(Math.cos(a) * e.speed * 2.2, Math.sin(a) * e.speed * 2.2); }
          else { e.setVelocity(e.body.velocity.x * 0.97, e.body.velocity.y * 0.97); }
        } else if (def.behavior === 'shooter') { e.setVelocity(0, 0); }
        // 사격
        if (def.fireEvery) {
          e.fireT -= d * 1000;
          if (e.fireT <= 0 && e.spawnGrace <= 0) {
            e.fireT = def.fireEvery;
            var toP = Phaser.Math.Angle.Between(e.x, e.y, p.x, p.y);
            if (def.pattern === 'ring') { for (var i = 0; i < 10; i++) self.spawnEBullet(e.x, e.y, (i / 10) * Math.PI * 2, 130); }
            else self.spawnEBullet(e.x, e.y, toP, 150);
          }
        }
      });
    },

    // ── 탄 수명·방 밖 컬링 ──────────────────────────────────────────────────────
    updateBullets: function (d) {
      var self = this, cur = this.curRoom;
      this.pbullets.getChildren().forEach(function (b) {
        if (!b.active) return;
        b.life -= d; if (b.life <= 0) self.killBullet(b);
      });
      this.ebullets.getChildren().forEach(function (b) {
        if (!b.active) return;
        b.life -= d; if (b.life <= 0) { self.killBullet(b); return; }
        // (3)(6) 현재 방 outer 밖으로 나간 적탄 컬링
        if (b.x < cur.ox - TILE || b.x > cur.ox + cur.ow + TILE || b.y < cur.oy - TILE || b.y > cur.oy + cur.oh + TILE) self.killBullet(b);
      });
    },

    killBullet: function (b) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; },

    // ── (2) 충돌 핸들러 ─────────────────────────────────────────────────────────
    bulletHitWall: function (bullet) {
      // collider 콜백 인자 순서는 (group1, group2) → 첫 인자가 탄
      this.killBullet(bullet);
    },

    hitEnemy: function (bullet, enemy) {
      if (!bullet.active || !enemy.active || enemy.spawnGrace > 0) return;
      enemy.hp -= bullet.damage;
      enemy.setTint(WHITE_INT); var self = this;
      this.time.delayedCall(50, function () { if (enemy.active) enemy.clearTint(); });
      this.fxHit.explode(3, bullet.x, bullet.y);
      if (PD.GAME_AUDIO && PD.GAME_AUDIO.sfx) PD.GAME_AUDIO.sfx('hit');
      this.killBullet(bullet);
      if (enemy.hp <= 0) this.killEnemy(enemy);
    },

    killEnemy: function (e) {
      if (!e.active) return;
      this.fxKill.explode(12, e.x, e.y);
      if (PD.GAME_AUDIO && PD.GAME_AUDIO.sfx) PD.GAME_AUDIO.sfx('enemyDie');
      e.setActive(false).setVisible(false); if (e.body) e.body.enable = false;
      e.clearTint();
      // 카운터는 적이 속한 방(e.room)에서 감소 — 방 단위 스코프 유지
      if (e.room) e.room.enemiesLeft = Math.max(0, (e.room.enemiesLeft || 1) - 1);
      if (e.room === this.curRoom) this.roomEnemiesLeft = e.room.enemiesLeft;
    },

    hitPlayer: function (player, bullet) {
      if (!bullet.active) return;
      this.killBullet(bullet);
      if (player.invuln > 0) return;
      this.playerHurt();
    },

    touchPlayer: function (player, enemy) {
      if (!enemy.active || enemy.spawnGrace > 0) return;
      if (player.invuln > 0) return;
      this.playerHurt();
    },

    playerHurt: function () {
      var p = this.player;
      p.hp--; p.invuln = 1.0;
      if (PD.GAME_AUDIO && PD.GAME_AUDIO.sfx) PD.GAME_AUDIO.sfx('hurt');
      this.cameras.main.shake(200, 0.008);
      this.cameras.main.flash(120, 255, 60, 60);
      if (p.hp <= 0) { p.hp = p.maxHp; this.bannerShow('리스폰(스파이크 데모)', roleInt('danger')); var c = this.rooms[this.maze.start].center(); p.setPosition(c.x, c.y); this.enterRoom(this.rooms[this.maze.start]); }
    },

    // ── HUD: fps·방 상태·6항목 자가 점검 표시 ───────────────────────────────────
    updateHud: function () {
      var r = this.selfCheck();
      var lines = [
        'SPIKE PoC  fps:' + this._fps,
        'room:' + this.curRoom.id + '  enemiesLeft:' + this.roomEnemiesLeft,
        'bounds:' + Math.round(this.curRoom.bounds.w) + 'x' + Math.round(this.curRoom.bounds.h),
        'walls:' + this.wallG.getLength() + '  hp:' + this.player.hp + '/' + this.player.maxHp,
        '[1]bounds:' + tick(r.bounds) + ' [2]tilephys:' + tick(r.tilePhysics) + ' [3]roomscope:' + tick(r.roomScope),
        '[4]doors:' + tick(r.doors) + ' [5]camera:' + tick(r.camera) + ' [6]fps60:' + tick(r.fps60)
      ];
      this.hud.setText(lines.join('\n'));
    },

    bannerShow: function (txt, color) {
      this.banner.setText(txt).setColor('#' + (color || WHITE_INT).toString(16).padStart(6, '0')).setAlpha(1).setScale(0.7);
      this.tweens.killTweensOf(this.banner);
      this.tweens.add({ targets: this.banner, scale: 1, duration: 220, ease: 'Back.out' });
      this.tweens.add({ targets: this.banner, alpha: 0, delay: 1300, duration: 400 });
    },

    // ── 6항목 자가 점검(헤드리스 QA + HUD 공용) ─────────────────────────────────
    selfCheck: function () {
      var anyLockedDoor = false, anyOpenedAfterClear = false;
      var rs = this.rooms;
      Object.keys(rs).forEach(function (id) {
        var rm = rs[id];
        Object.keys(rm.doors).forEach(function (dir) {
          if (rm.doors[dir].locked) anyLockedDoor = true;
          if (rm.cleared && !rm.doors[dir].locked) anyOpenedAfterClear = true;
        });
      });
      var cam = this.cameras.main;
      var camBoundsMatch = cam._bounds && Math.round(cam._bounds.width) === Math.round(this.curRoom.ow);
      return {
        // (1) 좌표계가 방 bounds 로 일반화됨(현재 방 bounds 가 ARENA 와 다른 값)
        bounds: this.curRoom.bounds.w > 0 && (this.curRoom.bounds.w !== PD.ARENA.w || this.rooms.C.bounds.h !== this.rooms.A.bounds.h),
        // (2) 타일 물리: 벽 staticGroup 바디 존재
        tilePhysics: this.wallG.getLength() > 0,
        // (3) 방 단위 전투 스코프: 적이 방 소속을 가지고 현재 방만 카운트
        roomScope: this.enemies.getChildren().every(function (e) { return !e.active || e.room; }),
        // (4) 문 잠금/개방: 한 번이라도 잠겼거나(전투중) 클리어 후 열렸음
        doors: anyLockedDoor || anyOpenedAfterClear,
        // (5) 카메라: follow 타깃 = player & bounds = 현재 방
        camera: cam._follow === this.player && !!camBoundsMatch,
        // (6) 60fps: 측정 fps 가 55 이상(워밍업 후)
        fps60: this._fps >= 55
      };
    }
  });

  function tick(b) { return b ? 'OK' : 'X'; }
})();
