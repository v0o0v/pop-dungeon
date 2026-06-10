/* ============================================================================
 * 팡팡 던전 — 파생 스탯 계산 (아이템 + 직업 패시브)
 * ----------------------------------------------------------------------------
 * recomputeStats(): RUN.items 를 가/곱연산으로 합산해 RUN.stats / RUN.maxHp 갱신.
 * window.PD.recomputeStats / countRarity / rarityName 로 노출(Game/HUD 씬이 공유).
 * 입력 소스(RUN.items)·산출 구조는 분할 전과 동일(거동 100% 동일, AC#10).
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = window.PD;
  var ITEM_BY_ID = PD.ITEM_BY_ID;

  function recomputeStats() {
    var RUN = PD.RUN;
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

  PD.recomputeStats = recomputeStats;
  PD.countRarity = countRarity;
  PD.rarityName = rarityName;
})();
