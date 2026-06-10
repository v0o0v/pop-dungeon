/* ============================================================================
 * 팡팡 던전 — GameScene (던전 본체: 전투·스폰·탄막·드랍·층진행)
 * ----------------------------------------------------------------------------
 * 게임플레이 난수(스폰·드랍·크리티컬·패턴 분기·웨이브)는 PD.rand()/randRange()/
 * randInt()/pick() 시드 PRNG 로 통일(AC#11 결정성). 발사 산포·아이템 드랍 선택까지
 * 포함. 거동 의미는 분할 전과 동일하되, Math.random → 시드 PRNG 로 치환된 것만 다르다
 * (동일 시드 → 동일 결과 보장).
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = window.PD;
  var DESIGN_W = PD.DESIGN_W, DESIGN_H = PD.DESIGN_H;
  var ARENA = PD.ARENA, ARENA_R = PD.ARENA_R, ARENA_B = PD.ARENA_B;
  var ROLE = PD.ROLE, WHITE = PD.WHITE, INK = PD.INK;
  var WHITE_INT = PD.WHITE_INT;
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt;
  var RARITY_COLOR = PD.RARITY_COLOR, ITEM_BY_ID = PD.ITEM_BY_ID, DROP_POOL = PD.DROP_POOL;
  var ENEMY_TYPES = PD.ENEMY_TYPES, BOSS_TABLE = PD.BOSS_TABLE;
  var STORY_TEXT = PD.STORY_TEXT;
  var GAME_INPUT = PD.GAME_INPUT, GAME_AUDIO = PD.GAME_AUDIO;
  // 시드 PRNG (게임플레이 결정성)
  var rand = PD.rand, randRange = PD.randRange, randInt = PD.randInt, pick = PD.pick;

  PD.scenes.Game = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function GameScene() { Phaser.Scene.call(this, { key: 'Game' }); },

    create: function () {
      var self = this;
      var RUN = PD.RUN;
      this.cameras.main.setBackgroundColor(PD.FLOOR_BG[0]);

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
      this.fxPuff = this.add.particles(0, 0, 'spark', { lifespan: 260, speed: { min: 20, max: 70 }, scale: { start: 0.6, end: 0 }, alpha: { start: 0.5, end: 0 }, tint: rampInt('hero', 3), emitting: false }).setDepth(19);

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
      this.banner = this.add.text(DESIGN_W / 2, ARENA.y + 200, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '34px', color: WHITE }).setOrigin(0.5).setDepth(60).setAlpha(0).setShadow(0, 3, INK, 4);
      this.toast = this.add.text(DESIGN_W / 2, ARENA_B - 40, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '18px', color: ROLE.pickup }).setOrigin(0.5).setDepth(60).setAlpha(0);
      // 막간 흔적 텍스트 (STORY.md §7 T2·T3 — 배너 아래 한 줄)
      this.trace = this.add.text(DESIGN_W / 2, ARENA.y + 252, '', { fontFamily: 'sans-serif', fontSize: '15px', color: ramp('steel', 3), align: 'center', wordWrap: { width: ARENA.w - 56 } }).setOrigin(0.5).setDepth(60).setAlpha(0).setShadow(0, 2, INK, 3);

      this.state = 'play'; // play | clearing | transition | dead | win
      this.floorEnemiesLeft = 0; this.waveQueue = [];
      this.portal = null;

      PD.recomputeStats();
      this.startFloor(RUN.floor);

      // 헤드리스/외부 핸들
      window.PopDungeon = window.PopDungeon || {};
      window.PopDungeon.scene = this; window.PopDungeon.run = function () { return PD.RUN; };
    },

    // ── 아레나 그리기(픽셀 브릭 타일 + 횃불 광 풀) ─────────────────────────────
    drawArena: function () {
      var g = this.add.graphics().setDepth(1);
      // 돌바닥
      g.fillStyle(rampInt('stone', 0), 1); g.fillRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);
      // 브릭 패턴: 가로줄 24px + 줄마다 오프셋된 세로 이음매(1px)
      g.fillStyle(rampInt('stone', 1), 1);
      var row = 0, y, x;
      for (y = ARENA.y + 24; y < ARENA_B - 4; y += 24, row++) {
        g.fillRect(ARENA.x + 4, y, ARENA.w - 8, 1);
        var off = (row % 2) * 24;
        for (x = ARENA.x + 24 + off; x < ARENA_R - 6; x += 48) g.fillRect(x, y - 24 < ARENA.y ? ARENA.y + 4 : y - 24, 1, 24);
      }
      // 바닥 잔돌·이끼 점(결정적 배치)
      for (var i = 0; i < 14; i++) {
        var dx = ARENA.x + 20 + ((i * 97) % (ARENA.w - 40));
        var dy = ARENA.y + 24 + ((i * 211) % (ARENA.h - 48));
        g.fillStyle(i % 4 === 0 ? rampInt('venom', 1) : rampInt('stone', 2), i % 4 === 0 ? 0.5 : 0.7);
        g.fillRect(dx, dy, 2, i % 3 === 0 ? 1 : 2);
      }
      // 벽 프레임(사각 도트 결): 3px 외벽 + 1px 상단 림라이트
      g.fillStyle(rampInt('stone', 2), 1);
      g.fillRect(ARENA.x, ARENA.y, ARENA.w, 3); g.fillRect(ARENA.x, ARENA_B - 3, ARENA.w, 3);
      g.fillRect(ARENA.x, ARENA.y, 3, ARENA.h); g.fillRect(ARENA_R - 3, ARENA.y, 3, ARENA.h);
      g.fillStyle(rampInt('stone', 3), 1);
      g.fillRect(ARENA.x, ARENA.y, ARENA.w, 1);
      // 모서리 초석
      g.fillStyle(rampInt('stone', 3), 1);
      g.fillRect(ARENA.x, ARENA.y, 6, 6); g.fillRect(ARENA_R - 6, ARENA.y, 6, 6);
      g.fillRect(ARENA.x, ARENA_B - 6, 6, 6); g.fillRect(ARENA_R - 6, ARENA_B - 6, 6, 6);
      // 벽 횃불 + 바닥의 따뜻한 광 풀(그려진 빛 — T2, 동적 라이팅 아님)
      var spots = [
        [ARENA.x + 52, ARENA.y + 20], [ARENA_R - 52, ARENA.y + 20],
        [ARENA.x + 16, ARENA.y + ARENA.h * 0.46], [ARENA_R - 16, ARENA.y + ARENA.h * 0.46]
      ];
      for (var s = 0; s < spots.length; s++) {
        g.fillStyle(rampInt('torch', 2), 0.06);
        g.fillEllipse(spots[s][0], spots[s][1] + 26, 96, 56);
        var tc = this.add.sprite(spots[s][0], spots[s][1], 'wtorch', s % 2).setDepth(2);
        tc.play({ key: 'torch-burn', startFrame: s % 2 });
      }
    },

    // ── 층 시작 ────────────────────────────────────────────────────────────────
    startFloor: function (n) {
      var self = this;
      var RUN = PD.RUN;
      RUN.floor = n;
      this.clearProjectiles();
      if (this.portal) { this.tweens.killTweensOf(this.portal); this.portal.destroy(); this.portal = null; }
      this.state = 'spawning';
      this.floorEnemiesLeft = 0; this.waveQueue = [];
      var isBoss = (n % 10 === 0);

      // 배경 색조: 10층 구간마다 변화 (STYLE.variants.floor_backgrounds)
      var tier = Math.floor((n - 1) / 10);
      this.cameras.main.setBackgroundColor(PD.FLOOR_BG[tier % PD.FLOOR_BG.length]);

      if (isBoss) {
        if (GAME_AUDIO.setSection) GAME_AUDIO.setSection('boss');
        if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(1);
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('bossWarn');
        this.bannerShow('지하 ' + n + '층 — 보스!', rampInt('scarlet', 3));
        this.time.delayedCall(700, function () { self.spawnBoss(n); self.state = 'play'; });
      } else {
        if (GAME_AUDIO.setSection) GAME_AUDIO.setSection('combat');
        if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.45);
        this.bannerShow('지하 ' + n + '층', roleInt('ui_accent'));
        this.buildWaves(n);
        this.time.delayedCall(450, function () { self.spawnNextWave(); self.state = 'play'; });
      }
      // 별이의 흔적 막간 (STORY.md §5 承·転 — x1층 진입마다 1문장)
      if (STORY_TEXT.traces[n]) this.traceShow(STORY_TEXT.traces[n]);
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
        for (var i = 0; i < perWave; i++) list.push(pick(pool));
        this.waveQueue.push(list);
      }
      this.floorEnemiesLeft = 0;
    },

    spawnNextWave: function () {
      if (!this.waveQueue.length) return;
      var list = this.waveQueue.shift();
      var n = PD.RUN.floor;
      for (var i = 0; i < list.length; i++) {
        var ang = rand() * Math.PI * 2;
        var ex = DESIGN_W / 2 + Math.cos(ang) * (140 + rand() * 70);
        var ey = ARENA.y + 60 + rand() * (ARENA.h * 0.45);
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
      e.fireT = (def.fireEvery || 0) * (0.4 + rand() * 0.6);
      e.dartT = 300 + rand() * 600;
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
      PD.RUN.boss = e; PD.RUN.bossName = bdef.name; PD.RUN.bossHpFrac = 1;
      this.cameras.main.shake(400, 0.006);
    },

    // ── 업데이트 ───────────────────────────────────────────────────────────────
    update: function (time, dt) {
      var RUN = PD.RUN;
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
          this.toastShow('다음 웨이브!', roleInt('pickup'));
          this.time.delayedCall(650, function () { self.spawnNextWave(); self.state = 'play'; });
        } else {
          this.onFloorCleared();
        }
      }
    },

    // ── 플레이어 ───────────────────────────────────────────────────────────────
    handlePlayer: function (d, time) {
      var RUN = PD.RUN;
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
      p.dashDamage = PD.RUN.stats.dashDamage;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('dodge');
      // 잔상
      for (var i = 0; i < 3; i++) {
        var gh = this.add.sprite(p.x, p.y, 'hero', 0).setAlpha(0.4 - i * 0.1).setScale(1).setTint(rampInt('hero', 3)).setDepth(18);
        this.tweens.add({ targets: gh, alpha: 0, duration: 220 + i * 60, onComplete: function () { this.destroy(); }, callbackScope: gh });
      }
      this.fxPuff.explode(8, p.x, p.y);
    },

    // ── 능력 효과 dispatch (AbilityKit onActivate) ──────────────────────────────
    onAbility: function (ab, ctx) {
      var RUN = PD.RUN;
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
      var ring = this.add.circle(x, y, 10, roleInt('pickup'), 0.5).setDepth(25);
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
      var s = PD.RUN.stats, p = this.player;
      var count = s.projectiles, spread = (s.spreadAngle || 0) * Math.PI / 180;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('shoot');
      for (var i = 0; i < count; i++) {
        var off = count > 1 ? (i - (count - 1) / 2) * spread : 0;
        // 약간의 랜덤 산포
        var ang = baseAngle + off + (rand() - 0.5) * 0.03;
        this.spawnPBullet(p.x + Math.cos(baseAngle) * 12, p.y + Math.sin(baseAngle) * 12, ang, s, false);
      }
      // 총구 반동 살짝
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
      // 크리티컬
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
      var n = PD.RUN.floor, base = 120 + n * 2;
      var px = this.player.x, py = this.player.y;
      var toP = Phaser.Math.Angle.Between(e.x, e.y, px, py);
      if (kind === 'aimed') { this.spawnEBullet(e.x, e.y, toP, base); }
      else if (kind === 'aimed3') { for (var i = -1; i <= 1; i++) this.spawnEBullet(e.x, e.y, toP + i * 0.22, base); }
      else if (kind === 'ring') { var c = 10 + Math.min(8, Math.floor(n / 3)); for (var j = 0; j < c; j++) this.spawnEBullet(e.x, e.y, (j / c) * Math.PI * 2, base * 0.8); }
      else if (kind === 'fan') { for (var k = -3; k <= 3; k++) this.spawnEBullet(e.x, e.y, toP + k * 0.18, base * 0.9); }
      else if (kind === 'spiral') { e._sp = (e._sp || 0) + 0.5; for (var m = 0; m < 3; m++) this.spawnEBullet(e.x, e.y, e._sp + m * (Math.PI * 2 / 3), base * 0.85); }
      else if (kind === 'walls') {
        // 양옆에서 좁은 틈 있는 벽
        var gap = randInt(0, 8);
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
          if (e.dartT <= 0) { e.dartT = 700 + rand() * 700; var a = Phaser.Math.Angle.Between(e.x, e.y, p.x, p.y) + (rand() - 0.5); e.setVelocity(Math.cos(a) * e.speed * 2.4, Math.sin(a) * e.speed * 2.4); }
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
      var RUN = PD.RUN;
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
        if (ph >= 2 && rand() < 0.5) self.enemyPattern(e, 'ring');
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
        for (var i = 0; i < 2; i++) this.spawnPBullet(bullet.x, bullet.y, rand() * Math.PI * 2, PD.RUN.stats, true);
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
      var s = PD.RUN.stats, luck = s.luck || 0;
      // 코인
      var coins = isBoss ? 8 + Math.floor(rand() * 6) : (rand() < 0.6 ? 1 + Math.floor(rand() * 2) : 0);
      for (var i = 0; i < coins; i++) this.spawnPickup('coin', x + (rand() - 0.5) * 30, y + (rand() - 0.5) * 30);
      // 기력
      if (rand() < 0.18 + luck * 0.03) this.spawnPickup('energy', x, y);
      // 하트
      if (rand() < 0.06 + luck * 0.02) this.spawnPickup('heart', x, y);
      // 일반 적도 낮은 확률로 아이템 별
      if (!isBoss && rand() < 0.03 + luck * 0.02) this.spawnItemDrop(x, y);
    },

    // ── 픽업 ───────────────────────────────────────────────────────────────────
    spawnPickup: function (kind, x, y) {
      var pk = this.pickups.get(x, y, kind); if (!pk) return null;
      pk.setActive(true).setVisible(true).setDepth(14).setScale(kind === 'coin' ? 0.9 : 1);
      if (pk.body) { pk.body.enable = true; pk.body.reset(x, y); pk.body.setCircle(9, 1, 1); }
      pk.pkind = kind; pk.item = null;
      if (kind === 'coin') pk.play('coin-spin');
      // 살짝 튀어나오는 연출
      var ang = rand() * Math.PI * 2, f = 30 + rand() * 40;
      pk.setVelocity(Math.cos(ang) * f, Math.sin(ang) * f);
      pk.life = 18;
      return pk;
    },

    spawnItemDrop: function (x, y) {
      // 드랍 풀에서 행운 가중 랜덤(희귀도 높을수록 낮은 확률 + luck 보정)
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
      var RUN = PD.RUN;
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
      var RUN = PD.RUN;
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
      PD.recomputeStats();
      // 능력 자원/충전 갱신 반영
      this.syncKitFromStats();
      // maxHp 변동 시 hp 보정
      if (RUN.maxHp > prevMax) RUN.hp += (RUN.maxHp - prevMax);
      RUN.hp = Phaser.Math.Clamp(RUN.hp, 1, RUN.maxHp);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('powerup');
      this.cameras.main.flash(140, 255, 220, 120);
      this.toastShow('획득: ' + it.name + ' (' + PD.rarityName(it.rarity) + ')', RARITY_COLOR[it.rarity]);
    },

    syncKitFromStats: function () {
      var s = PD.RUN.stats;
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
      if (PD.RUN.stats.contactDamage) this.damageEnemy(enemy, PD.RUN.stats.contactDamage);
      this.playerHurt();
    },

    playerHurt: function () {
      var RUN = PD.RUN;
      var p = this.player;
      // 방어구(armor) 확률 방어
      if (RUN.stats.armor && rand() < Math.min(0.6, RUN.stats.armor * 0.22)) { this.toastShow('방어!'); p.invuln = 0.6; this.fxPuff.explode(6, p.x, p.y); return; }
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
      var RUN = PD.RUN;
      if (RUN.floor >= 100) { this.win(); return; }
      if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.2);
      this.toastShow(STORY_TEXT.clearBarks[Math.floor(Math.random() * STORY_TEXT.clearBarks.length)], roleInt('ui_accent'));
      // 포탈 생성(아레나 하단 중앙)
      this.time.delayedCall(500, function () {
        var px = DESIGN_W / 2, py = ARENA.y + ARENA.h * 0.5;
        self.portal = self.physics.add.sprite(px, py, 'portal').setDepth(12);
        self.portal.body.setCircle(26, 9, 9);
        self.tweens.add({ targets: self.portal, scale: 1.12, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        self.portal.angleSpin = self.tweens.add({ targets: self.portal, angle: 360, duration: 4000, repeat: -1 });
        self.bannerShow('포탈로 하강 ↓', rampInt('stone', 3));
        self.portalOverlap = self.physics.add.overlap(self.player, self.portal, function () { self.descend(); });
      });
    },

    descend: function () {
      if (this.state !== 'clearing') return;
      this.state = 'transition';
      var self = this;
      var RUN = PD.RUN, META = PD.META;
      if (this.portalOverlap) { this.physics.world.removeCollider(this.portalOverlap); this.portalOverlap = null; }
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('descend');
      this.cameras.main.flash(200, 180, 200, 255);
      // 업데이트 최고 기록
      if (RUN.floor > META.bestFloor) { META.bestFloor = RUN.floor; PD.saveMeta(); }
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
      var RUN = PD.RUN, META = PD.META;
      var p = this.player;
      p.setVelocity(0, 0); p.dashT = 0;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('gameover');
      if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.1);
      this.fxKill.explode(30, p.x, p.y);
      this.cameras.main.shake(400, 0.012);
      p.setVisible(false);
      META.totalCoins += RUN.coins; if (RUN.floor > META.bestFloor) META.bestFloor = RUN.floor; PD.saveMeta();
      var self = this;
      this.time.delayedCall(700, function () {
        self.scene.stop('HUD');
        self.scene.start('Result', { win: false, floor: RUN.floor, coins: RUN.coins, kills: RUN.kills });
      });
    },

    win: function () {
      if (this.state === 'win') return;
      this.state = 'win';
      var RUN = PD.RUN, META = PD.META;
      this.player.setVelocity(0, 0);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('win');
      META.wins++; META.totalCoins += RUN.coins; META.bestFloor = 100; PD.saveMeta();
      var self = this;
      this.cameras.main.flash(400, 255, 240, 180);
      this.time.delayedCall(800, function () {
        self.scene.stop('HUD');
        self.scene.start('Result', { win: true, floor: 100, coins: RUN.coins, kills: RUN.kills });
      });
    },

    // ── 배너/토스트 ─────────────────────────────────────────────────────────────
    bannerShow: function (txt, color) {
      this.banner.setText(txt).setColor('#' + (color || WHITE_INT).toString(16).padStart(6, '0')).setAlpha(0).setScale(0.6);
      this.tweens.add({ targets: this.banner, alpha: 1, scale: 1, duration: 260, ease: 'Back.out' });
      this.tweens.add({ targets: this.banner, alpha: 0, delay: 1100, duration: 400 });
    },
    toastShow: function (txt, color) {
      this.toast.setText(txt).setColor('#' + (color || roleInt('pickup')).toString(16).padStart(6, '0')).setAlpha(1).setY(ARENA_B - 40);
      this.tweens.killTweensOf(this.toast);
      this.tweens.add({ targets: this.toast, y: ARENA_B - 70, alpha: 0, delay: 700, duration: 500 });
    },
    traceShow: function (txt) {
      this.trace.setText(txt).setAlpha(0);
      this.tweens.killTweensOf(this.trace);
      this.tweens.add({ targets: this.trace, alpha: 1, delay: 650, duration: 400 });
      this.tweens.add({ targets: this.trace, alpha: 0, delay: 4400, duration: 500 });
    }
  });
})();
