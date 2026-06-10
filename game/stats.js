/* ============================================================================
 * 팡팡 던전 — 파생 스탯 계산 (5개 입력 소스 합산)
 * ----------------------------------------------------------------------------
 * recomputeStats(save?, run?):
 *   5개 입력 소스를 순서대로 가/곱연산 합산해 RUN.runStats / RUN.maxHp 갱신.
 *
 *   합산 순서 (worker-l1·l2 와 공표한 계약 — 변경 금지):
 *     [1] 베이스 스탯 (코드 하드코딩)
 *     [2] 영속 6슬롯 장비 effect + 강화(enhStep × enh)
 *     [3] 마을 스탯 분배 (SAVE.stats — vit/pow/agi/foc)
 *     [4] 스킬트리 패시브 (PD.getPassiveEffects(learnedNodes) — worker-l1 제공)
 *     [5] 런 휘발 아이템 (RUN.runItems)
 *     [세트 보너스] 소스 5 처리 후 runItems 기반 세트 보너스
 *
 *   effect 키 네이밍은 items.data.js 기존 구조 재사용(공표 계약).
 *   multCap = 2.0 (balanceConfig.multCap).
 *
 * 기존 API (Phase 0 회귀 호환):
 *   PD.recomputeStats()  — 인수 없이 호출 시 PD.SAVE / PD.RUN 사용
 *   PD.countRarity(pool, r) / PD.rarityName(r)  — 변경 없음
 * ==========================================================================*/
(function () {
  'use strict';

  var PD = window.PD;
  var ITEM_BY_ID = PD.ITEM_BY_ID;
  var MULT_CAP   = 2.0;   // balanceConfig.multCap

  // ── 마을 스탯 분배 환산 비율 ──────────────────────────────────────────────
  //   vit  → maxHp +2/pt
  //   pow  → flatDamage +3/pt
  //   agi  → moveSpeed +15/pt
  //   foc  → skillDamage +5/pt
  var STAT_DIST = {
    vit:  { maxHpBonus:  2  },
    pow:  { flatDamage:  3  },
    agi:  { moveSpeed:   15 },
    foc:  { skillDamage: 5  }
  };

  // ── effect 1건을 누산 객체(flat·mult 분리)에 반영 ─────────────────────────
  function applyEffect(flat, mult, e) {
    if (!e) return;
    // — 가산 필드 —
    if (e.extraProjectiles) flat.projectiles  = (flat.projectiles  || 0) + e.extraProjectiles;
    if (e.spreadAngle)      flat.spreadAngle  = Math.max(flat.spreadAngle || 0, e.spreadAngle);
    if (e.pierce)           flat.pierce       = (flat.pierce       || 0) + e.pierce;
    if (e.bounce)           flat.bounce       = (flat.bounce       || 0) + e.bounce;
    if (e.homing)           flat.homing       = (flat.homing       || 0) + e.homing;
    if (e.split)            flat.split        = (flat.split        || 0) + e.split;
    if (e.bulletSize)       flat.bulletSize   = (flat.bulletSize   || 0) + e.bulletSize;
    if (e.fireRateFlat)     flat.fireRateFlat = (flat.fireRateFlat || 0) + e.fireRateFlat;
    if (e.flatDamage || e.damage)
                            flat.flatDamage   = (flat.flatDamage   || 0) + (e.flatDamage || e.damage || 0);
    if (e.pickupRadius)     flat.pickupRadius = (flat.pickupRadius || 0) + e.pickupRadius;
    if (e.coinMult_flat)    flat.coinMult_flat= (flat.coinMult_flat|| 0) + e.coinMult_flat;
    if (e.luck)             flat.luck         = (flat.luck         || 0) + e.luck;
    if (e.armor)            flat.armor        = (flat.armor        || 0) + e.armor;
    if (e.contactDamage)    flat.contactDamage= (flat.contactDamage|| 0) + e.contactDamage;
    if (e.energyMax)        flat.energyMax    = (flat.energyMax    || 0) + e.energyMax;
    if (e.energyRegen)      flat.energyRegen  = (flat.energyRegen  || 0) + e.energyRegen;
    if (e.skillDamage)      flat.skillDamage  = (flat.skillDamage  || 0) + e.skillDamage;
    if (e.dodgeCharges)     flat.dodgeCharges = (flat.dodgeCharges || 0) + e.dodgeCharges;
    if (e.dashDamage)       flat.dashDamage   = (flat.dashDamage   || 0) + e.dashDamage;
    if (e.maxHp || e.maxHpBonus)
                            flat.maxHpBonus   = (flat.maxHpBonus   || 0) + (e.maxHp || e.maxHpBonus || 0);
    if (e.moveSpeed)        flat.moveSpeed    = (flat.moveSpeed    || 0) + e.moveSpeed;
    if (e.bulletSpeed)      flat.bulletSpeed  = (flat.bulletSpeed  || 0) + e.bulletSpeed;

    // — 곱산 필드 (누적 곱, multCap 은 최종 단계에서 적용) —
    if (e.damageMult)       mult.damageMult   = (mult.damageMult   || 1) * e.damageMult;
    if (e.coinMult)         mult.coinMult     = (mult.coinMult     || 1) * e.coinMult;
    if (e.fireRateMult)     mult.fireRateMult = (mult.fireRateMult || 1) * e.fireRateMult;
    if (e.moveSpeedMult)    mult.moveSpeedMult= (mult.moveSpeedMult|| 1) * e.moveSpeedMult;
  }

  // ── 소스 [2]: 영속 6슬롯 장비 + 강화 보정 ───────────────────────────────
  var EQUIP_SLOTS = ['weapon', 'helm', 'armor', 'boots', 'amulet', 'ring'];

  function applyEquipment(flat, mult, equipment) {
    if (!equipment) return;
    EQUIP_SLOTS.forEach(function (slot) {
      var entry = equipment[slot];
      if (!entry || !entry.id) return;
      var item = ITEM_BY_ID[entry.id];
      if (!item) return;
      // 기본 effect
      applyEffect(flat, mult, item.effect);
      // 강화 보정: enhStep × enh
      var enh = entry.enh || 0;
      if (enh > 0 && item.enhStep) {
        var scaled = {};
        Object.keys(item.enhStep).forEach(function (k) {
          scaled[k] = item.enhStep[k] * enh;
        });
        applyEffect(flat, mult, scaled);
      }
    });
  }

  // ── 소스 [3]: 마을 스탯 분배 (SAVE.stats) ───────────────────────────────
  function applyStatDist(flat, stats) {
    if (!stats) return;
    Object.keys(STAT_DIST).forEach(function (attr) {
      var pts = stats[attr] || 0;
      if (!pts) return;
      var mapping = STAT_DIST[attr];
      Object.keys(mapping).forEach(function (effectKey) {
        flat[effectKey] = (flat[effectKey] || 0) + mapping[effectKey] * pts;
      });
    });
  }

  // ── 소스 [4]: 스킬트리 패시브 (PD.getPassiveEffects) ─────────────────────
  //   worker-l1 이 PD.getPassiveEffects(learnedNodes) 를 제공하면 호출,
  //   아직 없으면 조용히 스킵(Phase 1 병렬 작업 호환).
  function applyPassives(flat, mult, learnedNodes) {
    if (!learnedNodes) return;
    var fn = (window.PD && window.PD.getPassiveEffects);
    if (typeof fn !== 'function') return;
    var passives = fn(learnedNodes);
    if (!Array.isArray(passives)) return;
    passives.forEach(function (node) {
      applyEffect(flat, mult, node && node.effect);
    });
  }

  // ── 소스 [5]: 런 휘발 아이템 (RUN.runItems) ─────────────────────────────
  function applyRunItems(flat, mult, runItems) {
    if (!Array.isArray(runItems)) return;
    runItems.forEach(function (id) {
      var item = ITEM_BY_ID[id];
      if (!item) return;
      applyEffect(flat, mult, item.effect);
    });
  }

  // ── 세트 보너스 (runItems 기반, 소스 5 이후) ─────────────────────────────
  function applySetBonuses(flat, runItems) {
    if (!Array.isArray(runItems) || !runItems.length) return;
    var sets = (window.POP_ITEMS && window.POP_ITEMS.sets) || [];
    sets.forEach(function (set) {
      var threshold = set.threshold || set.members.length;
      var count = 0;
      (set.members || []).forEach(function (mid) { if (runItems.indexOf(mid) >= 0) count++; });
      if (count >= threshold) {
        // 하드코딩 세트 보너스 (skill 세트 → 스킬 피해 +10, 기력 리젠 +2)
        if (set.id === 'skill') { flat.skillDamage = (flat.skillDamage || 0) + 10; flat.energyRegen = (flat.energyRegen || 0) + 2; }
      }
    });
  }

  // ── 메인 함수 ────────────────────────────────────────────────────────────
  function recomputeStats(saveArg, runArg) {
    var save = saveArg || (window.PD && window.PD.SAVE) || {};
    var RUN  = runArg  || (window.PD && window.PD.RUN);
    if (!RUN) return;

    // 누산 버킷
    var flat = {};
    var mult = {};

    // [1] 베이스는 최종 합산 시 하드코딩으로 추가
    // [2] 영속 장비 + 강화
    applyEquipment(flat, mult, save.equipment);
    // [3] 마을 스탯 분배
    applyStatDist(flat, save.stats);
    // [4] 스킬트리 패시브
    var learnedNodes = (save.skills && save.skills.learnedNodes) || {};
    applyPassives(flat, mult, learnedNodes);
    // [5] 런 휘발 아이템
    var runItems = RUN.runItems || RUN.items || [];
    applyRunItems(flat, mult, runItems);
    // 세트 보너스
    applySetBonuses(flat, runItems);

    // ── [1] 베이스 합산 + multCap 적용 ──────────────────────────────────
    var BASE_DAMAGE       = 8;
    var BASE_FIRE_DELAY   = 0.36;
    var BASE_BULLET_SPEED = 460;
    var BASE_MOVE_SPEED   = 188;
    var BASE_HP           = 4;
    var BASE_TURBO_MULT   = 1.8;

    var dmgMult    = Math.min(mult.damageMult    || 1, MULT_CAP);
    var coinMult   = Math.min(mult.coinMult      || 1, MULT_CAP);
    var frMult     = Math.min(mult.fireRateMult  || 1, MULT_CAP);
    var msMult     = Math.min(mult.moveSpeedMult || 1, MULT_CAP);

    var s = {
      damage:          (BASE_DAMAGE     + (flat.flatDamage   || 0)) * dmgMult,
      fireDelay:        Math.max(0.09, (BASE_FIRE_DELAY  + (flat.fireRateFlat || 0)) / frMult),
      bulletSpeed:     (BASE_BULLET_SPEED + (flat.bulletSpeed  || 0)),
      moveSpeed:       (BASE_MOVE_SPEED   + (flat.moveSpeed    || 0)) * msMult,
      projectiles:     1    + (flat.projectiles   || 0),
      spreadAngle:           (flat.spreadAngle    || 0),
      pierce:                (flat.pierce         || 0),
      bounce:                (flat.bounce         || 0),
      homing:                (flat.homing         || 0),
      split:                 (flat.split          || 0),
      bulletSize:            (flat.bulletSize     || 0),
      critChance:      0.1,                              // 기본 패시브 고정(분할 전 그대로)
      critBonusDamage: 6,
      pickupRadius:    46   + (flat.pickupRadius  || 0),
      coinMult:        coinMult,
      luck:                  (flat.luck           || 0),
      armor:                 (flat.armor          || 0),
      contactDamage:         (flat.contactDamage  || 0),
      energyMax:             (flat.energyMax      || 0),
      energyRegen:           (flat.energyRegen    || 0),
      skillDamage:           (flat.skillDamage    || 0),
      dodgeCharges:          (flat.dodgeCharges   || 0),
      dashDamage:            (flat.dashDamage     || 0),
      maxHpBonus:            (flat.maxHpBonus     || 0),
      turboMult:       BASE_TURBO_MULT
    };

    RUN.runStats = s;
    // 하위 호환: 기존 씬이 RUN.stats 를 읽으면 동일 객체 제공
    RUN.stats    = s;

    var newMaxHp = Math.max(1, BASE_HP + (flat.maxHpBonus || 0));
    RUN.maxHp = newMaxHp;
    if (RUN.hp == null)       RUN.hp = RUN.maxHp;
    if (RUN.hp > RUN.maxHp)   RUN.hp = RUN.maxHp;
  }

  function countRarity(pool, r) { var c = 0; pool.forEach(function (it) { if (it.rarity === r) c++; }); return c || 1; }
  function rarityName(r)        { var m = { common: '일반', rare: '희귀', epic: '영웅', legendary: '전설' }; return m[r] || r; }

  PD.recomputeStats = recomputeStats;
  PD.countRarity    = countRarity;
  PD.rarityName     = rarityName;

  // 헬퍼 노출 (테스트·씬 등에서 개별 소스 적용 가능)
  PD._stats = {
    applyEffect:    applyEffect,
    applyEquipment: applyEquipment,
    applyStatDist:  applyStatDist,
    applyPassives:  applyPassives,
    applyRunItems:  applyRunItems,
    applySetBonuses:applySetBonuses,
    STAT_DIST:      STAT_DIST,
    MULT_CAP:       MULT_CAP
  };
})();
