/* ============================================================================
 * 팡팡 던전 — 능력 배선 (abilities-wiring) · L1 산출
 * ----------------------------------------------------------------------------
 * abilities.json(data/abilities.data.js) 의 능력 데이터를 AbilityKit 런타임에
 * 배선하는 **얇은 헬퍼 모듈**. 엔진(engine/abilitykit.js)·기존 씬(game/scenes/*.js)
 * 을 수정하지 않고, 로드아웃 해석·효과 dispatch·별빛 자원·스킬포인트 배분을
 * window.PD 네임스페이스에 제공한다(플랜 부록 파일 경계: 본 lane 은 이 파일만 쓴다).
 *
 * 핵심 책임:
 *   1. resolveLoadout(save)        : SAVE.skills.loadout → {skill1, skill2, ult} 능력 id
 *   2. applyAbilityEffect(scene, ab, ctx) : ab.id 별 효과 dispatch(노바·산탄·…·궁극2)
 *   3. onKillStarlight(kit, n)     : 처치 시 별빛(starlight) 자원 충전
 *   4. learnNode / addSkillPoints  : AbilityKit.learn/addPoints 위임(별지기 할아버지 배분)
 *   5. attachWiring(scene, save)   : AbilityKit.attach + 위 콜백/로드아웃 연결 단일 진입점
 *
 * 설계 분리(AbilityKit 계약 준수):
 *   - 쿨다운·자원·충전·콤보·해금 **타이밍**은 AbilityKit 이 굴린다(엔진 무수정).
 *   - 능력의 **효과**(대미지·이동·CC)는 여기 dispatch 가 ab.effect 를 읽어 실행한다.
 *     → 효과를 코드에 중복 하드코딩하지 않고 abilities.json 단일 진실을 소비.
 *   - 기존 Game.js 는 자체 onAbility 를 갖고 있다(분할 결과). 본 모듈은 그것을 대체하지
 *     않고, **신규 Dungeon 씬(L6) 과 로드아웃 기반 HUD 가 채택할 수 있는** 배선을 제공한다.
 *
 * 로드 순서(index.html): data/* → engine/abilitykit.js → game/core.js → … →
 *   game/abilities-wiring.js (core 다음, 씬보다 먼저면 attachWiring 을 씬이 쓸 수 있음).
 * file:// 안전(전역 누적, ES module 아님).
 * ==========================================================================*/
(function () {
  'use strict';

  var PD = (window.PD = window.PD || {});
  var SPEC = window.POP_ABILITIES || { abilities: [], resources: [] };

  // 능력 인덱스(id → 레코드)
  var BY_ID = {};
  (SPEC.abilities || []).forEach(function (a) { if (a && a.id != null) BY_ID[a.id] = a; });

  // 계열·풀 분류(HUD/마을 UI 가 참조)
  var ACTIVE_POOL = (SPEC.abilities || []).filter(function (a) {
    return (a.kind === 'active' || a.kind === 'ultimate') && a.slot == null;
  }).map(function (a) { return a.id; });
  var ULT_POOL = (SPEC.abilities || []).filter(function (a) { return a.kind === 'ultimate'; }).map(function (a) { return a.id; });
  var SKILL_POOL = (SPEC.abilities || []).filter(function (a) {
    return a.kind === 'active' && a.slot == null;
  }).map(function (a) { return a.id; });

  // 기본 로드아웃(세이브 미설정 시) — 시작 보유 액티브 기준
  var DEFAULT_LOADOUT = { skill1: 'pop_nova', skill2: 'turbo_pop', ult: 'golden_storm' };

  // ── 1) 로드아웃 해석 ────────────────────────────────────────────────────────
  //   save.skills.loadout 우선. 미설정/유효하지 않으면 학습된 풀에서 채운다.
  function resolveLoadout(save) {
    var lo = (save && save.skills && save.skills.loadout) || {};
    var learned = (save && save.skills && save.skills.unlocked) || {};
    function pick(slot, isUlt) {
      var id = lo[slot];
      if (id && BY_ID[id]) return id;                       // 명시 장착 우선
      if (DEFAULT_LOADOUT[slot] && BY_ID[DEFAULT_LOADOUT[slot]]) return DEFAULT_LOADOUT[slot];
      // 폴백: 학습된 풀에서 종류에 맞는 첫 능력
      var pool = isUlt ? ULT_POOL : SKILL_POOL;
      for (var i = 0; i < pool.length; i++) if (learned[pool[i]] || Object.keys(learned).length === 0) return pool[i];
      return pool[0] || null;
    }
    return { skill1: pick('skill1', false), skill2: pick('skill2', false), ult: pick('ult', true) };
  }

  // ── 2) 효과 dispatch ────────────────────────────────────────────────────────
  //   scene 는 효과 실행에 필요한 헬퍼(novaBlast/firePlayer/spawn 등)를 제공할 수 있다.
  //   헬퍼가 없으면(헤드리스/단순 씬) 안전하게 무시 — AbilityKit 타이밍은 그대로 유효.
  //   기존 Game.js 의 효과 구현(novaBlast·turboT·ultT·tryDodge)과 호환되는 시그니처.
  function applyAbilityEffect(scene, ab, ctx) {
    if (!ab) return;
    var e = ab.effect || {};
    var RUN = PD.RUN || {};
    var stats = RUN.stats || {};
    var p = scene && scene.player;
    var skillDmg = stats.skillDamage || 0;
    ctx = ctx || {};
    switch (ab.id) {
      case 'pop_nova':
        if (scene && scene.novaBlast && p) scene.novaBlast(p.x, p.y, e.radius, e.damage + skillDmg, e.knockback);
        sfx(scene, 'nova'); shake(scene, 220, 0.008);
        break;
      case 'scatter_burst':
        // 부채꼴 펠릿: 씬이 firePellet/firePlayer 를 제공하면 콘으로 분사
        if (scene && p && (scene.firePellet || scene.firePlayer)) {
          var aim = (ctx.aim != null) ? ctx.aim : (p.aim != null ? p.aim : -Math.PI / 2);
          var spread = (e.coneAngle || 50) * Math.PI / 180;
          var n = e.pellets || 7;
          for (var i = 0; i < n; i++) {
            var t = (n === 1) ? 0 : (i / (n - 1) - 0.5);
            var a = aim + t * spread;
            if (scene.firePellet) scene.firePellet(a, e.damage + Math.round(skillDmg / 3), e.range);
            else scene.firePlayer(a);
          }
        }
        sfx(scene, 'skill');
        break;
      case 'charge_shot':
        if (scene && p && (scene.fireBeam || scene.firePlayer)) {
          var ca = (ctx.aim != null) ? ctx.aim : (p.aim != null ? p.aim : -Math.PI / 2);
          if (scene.fireBeam) scene.fireBeam(ca, e.damage + skillDmg, e.pierce, e.width, e.range);
          else scene.firePlayer(ca);
        }
        sfx(scene, 'skill'); shake(scene, 120, 0.006);
        break;
      case 'turbo_pop':
        if (p) p.turboT = e.duration;
        sfx(scene, 'skill'); toast(scene, '터보 팝!');
        break;
      case 'blink_pop':
        if (p) {
          var ba = (ctx.aim != null) ? ctx.aim : (p.aim != null ? p.aim : -Math.PI / 2);
          var ox = p.x, oy = p.y;
          var nx = p.x + Math.cos(ba) * (e.blinkDistance || 220);
          var ny = p.y + Math.sin(ba) * (e.blinkDistance || 220);
          if (scene && scene.clampToBounds) { var c = scene.clampToBounds(nx, ny); nx = c.x; ny = c.y; }
          p.x = nx; p.y = ny;
          if (p.invuln != null) p.invuln = Math.max(p.invuln, e.iframes || 0.18);
          if (scene && scene.novaBlast) scene.novaBlast(ox, oy, e.puffRadius, (e.puffDamage || 24) + skillDmg, 0);
        }
        sfx(scene, 'dodge');
        break;
      case 'comet_dash':
        if (p) {
          var da = (ctx.aim != null) ? ctx.aim : (p.aim != null ? p.aim : -Math.PI / 2);
          p.dashT = (e.dashDistance || 300) / (e.dashSpeed || 720);
          p.dashVX = Math.cos(da) * (e.dashSpeed || 720);
          p.dashVY = Math.sin(da) * (e.dashSpeed || 720);
          if (p.invuln != null) p.invuln = Math.max(p.invuln, e.iframes || 0.28);
          p.dashDamage = (e.trailDamage || 30) + skillDmg;   // 궤적 충돌 피해(씬 충돌이 읽음)
          p.dashTrailWidth = e.trailWidth || 40;
        }
        sfx(scene, 'dodge');
        break;
      case 'star_ward':
        if (p) { p.shield = (p.shield || 0) + (e.shield || 60); p.shieldT = e.duration || 5; p.reflectChance = e.reflectChance || 0.25; }
        sfx(scene, 'skill'); toast(scene, '별빛 보호막');
        break;
      case 'purify_pulse':
        // 적탄 정화 + 둔화 + 치유. 씬이 cleanseBullets/slowEnemies 를 제공하면 사용.
        if (scene && scene.cleanseBullets && p) scene.cleanseBullets(p.x, p.y, e.cleanseRadius || 200);
        if (scene && scene.slowEnemies && p) scene.slowEnemies(p.x, p.y, e.cleanseRadius || 200, e.slow || 0.45, e.slowDuration || 3);
        if (RUN && typeof RUN.hp === 'number' && typeof RUN.maxHp === 'number') RUN.hp = Math.min(RUN.maxHp, RUN.hp + (e.heal || 1));
        sfx(scene, 'nova');
        break;
      case 'golden_storm':
        if (p) { p.ultT = e.duration; p.ultAngle = 0; p.ultDamage = e.damage + skillDmg; p.ultCount = e.orbitalCount; }
        sfx(scene, 'skill'); toast(scene, '황금 팝 폭풍!');
        if (scene && scene.cameras) scene.cameras.main.flash(160, 255, 230, 120);
        break;
      case 'starfall':
        // 지정 구역 별똥 낙하: 씬이 rainMeteors 를 제공하면 사용.
        if (scene && scene.rainMeteors && p) {
          var tx = (ctx.tx != null) ? ctx.tx : p.x, ty = (ctx.ty != null) ? ctx.ty : p.y;
          scene.rainMeteors(tx, ty, e.areaRadius, e.meteors, e.damage + skillDmg, e.meteorRadius, e.duration);
        }
        sfx(scene, 'skill'); toast(scene, '별똥 소나기!');
        if (scene && scene.cameras) scene.cameras.main.flash(160, 200, 180, 255);
        break;
      case 'dodge_roll':
        /* 효과는 씬의 tryDodge 에서 직접 처리(이동기 시그니처) */
        break;
      default:
        /* 패시브/미구현 — AbilityKit 타이밍만(효과 없음) */
        break;
    }
  }

  // 안전 헬퍼(씬이 해당 기능을 가진 경우에만 호출)
  function sfx(scene, id) { var a = window.GAME_AUDIO; if (a && a.sfx) a.sfx(id); }
  function shake(scene, dur, amt) { if (scene && scene.cameras) scene.cameras.main.shake(dur, amt); }
  function toast(scene, msg) { if (scene && scene.toastShow) scene.toastShow(msg); }

  // ── 3) 별빛(starlight) 자원 — 처치 충전 ─────────────────────────────────────
  //   리젠 0 자원이라 킬 이벤트로만 찬다. 충전량 = stats.starlightOnKill(트리·패시브 합).
  function starlightGain(save) {
    var base = 0;
    var stats = (PD.RUN && PD.RUN.stats) || {};
    if (typeof stats.starlightOnKill === 'number') base += stats.starlightOnKill;
    return base > 0 ? base : 2;  // 최소 2(기본 충전)
  }
  function onKillStarlight(kit, amount) {
    if (!kit || !kit.resources || !kit.resources.starlight) return;
    var r = kit.resources.starlight;
    var add = (typeof amount === 'number') ? amount : starlightGain();
    r.cur = Math.max(0, Math.min(r.max, r.cur + add));
    if (kit._emit) kit._emit('onResourceChange', 'starlight', r.cur, r.max);
  }

  // ── 4) 스킬포인트 배분(별지기 할아버지) ─────────────────────────────────────
  function addSkillPoints(kit, n) { return kit && kit.addPoints ? kit.addPoints(n) : 0; }
  function learnNode(kit, nodeId) { return kit && kit.learn ? kit.learn(nodeId) : { ok: false, reason: 'no-kit' }; }
  function treeNodes() { return (SPEC.tree && SPEC.tree.nodes) || []; }
  // 학습 가능 노드(포인트·선행 충족) 목록 — 마을 스킬트리 UI 가 사용
  function learnableNodes(kit) {
    if (!kit) return [];
    return treeNodes().filter(function (n) {
      var r = kit.learn ? null : null; // 비파괴 판정은 아래 직접 검사
      if (kit.learnedNodes && kit.learnedNodes[n.id]) return false;
      if ((kit.points || 0) < (n.cost == null ? 1 : n.cost)) return false;
      var reqs = (n.requires || []).slice();
      (SPEC.tree.edges || []).forEach(function (ed) { if (ed.to === n.id && ed.requires) reqs = reqs.concat(ed.requires); });
      // edges 의 from 도 선행으로 취급(start 그래프)
      (SPEC.tree.edges || []).forEach(function (ed) { if (ed.to === n.id) reqs.push(ed.from); });
      return reqs.every(function (rq) { return kit.learnedNodes && kit.learnedNodes[rq]; });
    }).map(function (n) { return n.id; });
  }

  // ── 4b) getPassiveEffects — recomputeStats 입력 계약(worker-l4) ──────────────
  //   game/stats.js 의 소스[4] applyPassives 가 PD.getPassiveEffects(learnedNodes) 를
  //   호출해 [{ effect:{...} }, ...] 를 받아 flat/mult 에 합산한다. 본 함수가 그 제공자.
  //   수집: (1) 학습된 트리 노드의 effect, (2) 노드가 grants 하는 패시브 능력의 effect.
  //   ※ 코어 패시브(pop_mastery damage+2 · eagle_eye crit 0.1/6)는 game/stats.js 의
  //     BASE_DAMAGE=8 · critChance=0.1 · critBonusDamage=6 에 **이미 베이스로 반영**돼
  //     있으므로 여기서 다시 합산하면 이중 계산이다 → getPassiveEffects 에서 제외한다.
  //     (CORE_PASSIVES 는 HUD 표시·critFromPassives 보조 계산에만 참조)
  //   키 정규화: 본 데이터 키를 stats.js applyEffect 가 인식하는 키로 매핑한다(드리프트 0).
  //     - projectiles      → extraProjectiles  (applyEffect 는 extraProjectiles 가산)
  //     - damage           → damage            (applyEffect 가 flatDamage 로 흡수)
  //     - 나머지(skillDamage·energyMax·energyRegen·armor·moveSpeed·dodgeCharges·
  //       dashDamage·maxHpBonus·pickupRadius·fireRateFlat·coinMult·critChance·
  //       critBonusDamage·starlightOnKill·spreadAngle·pierce) 는 키 그대로 전달.
  //   ※ critChance/critBonusDamage/starlightOnKill 은 stats.js applyEffect 가 아직
  //     인식하지 않으면 무시되지만(무해), L4 가 키를 추가하면 즉시 반영된다(전방 호환).
  function normalizePassiveEffect(e) {
    if (!e) return null;
    var out = {};
    for (var k in e) {
      if (!e.hasOwnProperty(k)) continue;
      // 계약 정규화(worker-l4 확정 키): 본 데이터 키 → stats.js applyEffect 어휘
      if (k === 'projectiles') out.extraProjectiles = (out.extraProjectiles || 0) + e[k];
      else if (k === 'damage')  out.flatDamage      = (out.flatDamage || 0) + e[k];
      else out[k] = e[k];
    }
    return out;
  }
  // 코어 패시브(시작 보유) — stats.js 베이스에 이미 반영(이중 계산 방지로 stat 합산 제외)
  var CORE_PASSIVES = ['pop_mastery', 'eagle_eye'];
  function getPassiveEffects(learnedNodes) {
    learnedNodes = learnedNodes || {};
    var out = [];
    // (1)(2) 학습된 노드 + grants 패시브 (코어 패시브는 베이스에 반영돼 제외)
    treeNodes().forEach(function (n) {
      if (!learnedNodes[n.id]) return;
      if (n.effect) { var nf = normalizePassiveEffect(n.effect); if (nf) out.push({ id: n.id, effect: nf }); }
      (n.grants || []).forEach(function (gid) {
        var ab = BY_ID[gid];
        if (ab && ab.kind === 'passive' && ab.effect) {
          var gf = normalizePassiveEffect(ab.effect);
          if (gf) out.push({ id: gid, effect: gf });
        }
      });
    });
    return out;
  }
  // 별빛 충전량(starlightOnKill 합) — recomputeStats 가 키를 흘리지 않을 수 있으므로
  // 본 모듈이 learnedNodes 에서 직접 합산해 stats.starlightOnKill 보강에 쓴다.
  function starlightPerKill(learnedNodes) {
    var sum = 0;
    getPassiveEffects(learnedNodes).forEach(function (p) { if (p.effect && p.effect.starlightOnKill) sum += p.effect.starlightOnKill; });
    return sum;
  }
  // 크리 보강(critChance/critBonusDamage) — stats.js 가 base 고정값만 쓰는 경우,
  // 씬/HUD 가 본 헬퍼로 트리 크리를 합산해 RUN.stats 에 더할 수 있다(전방 호환 보조).
  function critFromPassives(learnedNodes) {
    var add = { critChance: 0, critBonusDamage: 0 };
    getPassiveEffects(learnedNodes).forEach(function (p) {
      if (p.effect && p.effect.critChance) add.critChance += p.effect.critChance;
      if (p.effect && p.effect.critBonusDamage) add.critBonusDamage += p.effect.critBonusDamage;
    });
    return add;
  }

  // ── 5) attach 단일 진입점 ───────────────────────────────────────────────────
  //   AbilityKit.attach(scene, SPEC, {...}) + 로드아웃·콜백 연결. save 로 진행 복원.
  //   기존 Game.js 는 자체 attach 를 유지(무수정). 본 진입점은 신규 Dungeon 씬(L6) 용.
  function attachWiring(scene, save) {
    var loadout = resolveLoadout(save);
    // 시작 보유: 로드아웃에 든 능력 + dodge + 코어 패시브 + 세이브 unlocked
    var startUnlocked = ['dodge_roll', 'pop_mastery', 'eagle_eye', loadout.skill1, loadout.skill2, loadout.ult];
    if (save && save.skills && save.skills.unlocked) startUnlocked = startUnlocked.concat(Object.keys(save.skills.unlocked));
    var kit = AbilityKit.attach(scene, SPEC, {
      onActivate: function (ab, ctx) { applyAbilityEffect(scene, ab, ctx); },
      unlockedAtStart: dedupe(startUnlocked)
    });
    // 진행 복원(learnedNodes/unlocked/points)
    if (save && save.skills) kit.restore(save.skills);
    kit._loadout = loadout;
    window.GAME_ABILITIES = kit;
    return kit;
  }

  // 로드아웃 슬롯 → 능력 id 사용(입력 배선에서 KIT.use 에 넘길 id 해석)
  function loadoutAbilityId(kit, slot) {
    var lo = (kit && kit._loadout) || resolveLoadout(PD.SAVE);
    if (slot === 'dodge') return 'dodge_roll';
    return lo[slot] || DEFAULT_LOADOUT[slot] || null;
  }

  function dedupe(arr) { var seen = {}, out = []; for (var i = 0; i < arr.length; i++) { if (arr[i] && !seen[arr[i]]) { seen[arr[i]] = 1; out.push(arr[i]); } } return out; }

  // ── PD 네임스페이스 노출 ─────────────────────────────────────────────────────
  //   PD.getPassiveEffects 는 game/stats.js 소스[4] applyPassives 가 직접 찾는 키이므로
  //   PD 최상위에도 노출한다(recomputeStats 입력 계약 — worker-l4).
  PD.getPassiveEffects = getPassiveEffects;

  PD.abilities = {
    SPEC: SPEC,
    BY_ID: BY_ID,
    ACTIVE_POOL: ACTIVE_POOL,
    SKILL_POOL: SKILL_POOL,
    ULT_POOL: ULT_POOL,
    DEFAULT_LOADOUT: DEFAULT_LOADOUT,
    CORE_PASSIVES: CORE_PASSIVES,
    resolveLoadout: resolveLoadout,
    applyAbilityEffect: applyAbilityEffect,
    onKillStarlight: onKillStarlight,
    starlightGain: starlightGain,
    starlightPerKill: starlightPerKill,
    critFromPassives: critFromPassives,
    getPassiveEffects: getPassiveEffects,
    addSkillPoints: addSkillPoints,
    learnNode: learnNode,
    learnableNodes: learnableNodes,
    treeNodes: treeNodes,
    attachWiring: attachWiring,
    loadoutAbilityId: loadoutAbilityId
  };
})();
