/* ============================================================================
 * 팡팡 던전 — 인벤토리 / 장비창 (6슬롯 착용 + 보유 목록 + 장착/해제)
 * ----------------------------------------------------------------------------
 * SAVE.equipment(6슬롯) + SAVE.inventory(미착용 보유)를 시각화하고, 터치로
 * 장착/해제한다. 장착·해제마다 PD.recomputeStats() 즉시 호출 → RUN.runStats 반영
 * (마을에선 RUN 이 없을 수 있으므로 임시 RUN 을 만들어 미리보기 스탯을 보여준다).
 *
 * 영속/휘발 경계(SaveStore): 장비는 전부 영속(SAVE). 장착/해제는 SAVE 를 직접
 * 바꾸고 PD.SaveStore.save(SAVE) 로 디스크에 기록한다.
 *
 * 공개: PD.UI.openInventory(scene)
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt, rgba = PD.rgba;
  var WHITE = PD.WHITE, INK = PD.INK;
  var WHITE_INT = PD.WHITE_INT, INK_INT = PD.INK_INT;
  var ITEM_BY_ID = PD.ITEM_BY_ID || {};

  var SLOTS = ['weapon', 'helm', 'armor', 'boots', 'amulet', 'ring'];
  var SLOT_NAME = { weapon: '무기', helm: '투구', armor: '갑옷', boots: '신발', amulet: '목걸이', ring: '반지' };

  // effect 한 줄 요약(주요 키만)
  var EFFECT_LABEL = {
    flatDamage: '피해', extraProjectiles: '연발', pierce: '관통', bounce: '튕김', homing: '유도',
    split: '분열', bulletSize: '탄크기', fireRateFlat: '연사', pickupRadius: '획득반경',
    skillDamage: '스킬피해', energyMax: '기력최대', energyRegen: '기력회복', armor: '방어',
    contactDamage: '접촉피해', dashDamage: '돌진피해', luck: '행운', maxHpBonus: '체력',
    moveSpeed: '이속', damageMult: '피해배율', coinMult: '코인배율', spreadAngle: '퍼짐'
  };
  function effectSummary(item, enh) {
    var e = item.effect || {};
    var parts = [];
    Object.keys(e).forEach(function (k) {
      if (k === 'value') return;
      var label = EFFECT_LABEL[k] || k;
      var v = e[k];
      if (k === 'fireRateFlat') { parts.push(label + ' ' + (v < 0 ? '+' + Math.round(-v * 1000) / 10 : '-' + v)); return; }
      if (k.indexOf('Mult') >= 0) { parts.push(label + ' ×' + v); return; }
      parts.push(label + ' +' + v);
    });
    // 강화 보정
    if (enh > 0 && item.enhStep) {
      Object.keys(item.enhStep).forEach(function (k) {
        var label = EFFECT_LABEL[k] || k;
        var add = item.enhStep[k] * enh;
        if (k === 'fireRateFlat') parts.push('(+' + enh + ') ' + label + ' +' + Math.round(-add * 1000) / 10);
        else parts.push('(+' + enh + ') ' + label + ' +' + Math.round(add * 100) / 100);
      });
    }
    return parts.join(' · ') || '효과 없음';
  }
  PD.UI = PD.UI || {};
  PD.UI.effectSummary = effectSummary;
  PD.UI.EFFECT_LABEL = EFFECT_LABEL;
  PD.UI.SLOT_NAME = SLOT_NAME;
  PD.UI.EQUIP_SLOTS = SLOTS;

  // 임시 RUN 으로 미리보기 스탯 계산(마을에서 RUN 이 없거나 던전 RUN 을 안 건드리려 함)
  function previewStats(save) {
    var prevRun = PD.RUN;
    var tmp = { runItems: [], items: [], hp: null, maxHp: 4, runStats: {}, stats: {} };
    PD.RUN = tmp;
    try { PD.recomputeStats(save, tmp); } catch (e) {}
    PD.RUN = prevRun;
    return tmp.runStats || {};
  }
  PD.UI.previewStats = previewStats;

  // 주요 파생 스탯 한 줄 패널(장착 변화 즉시 반영)
  function statLine(s) {
    if (!s) return '';
    function r(n) { return Math.round(n * 10) / 10; }
    return '피해 ' + r(s.damage || 0) +
      '  ·  연사 ' + r(s.fireDelay || 0) + 's' +
      '  ·  이속 ' + r(s.moveSpeed || 0) +
      '  ·  방어 ' + (s.armor || 0) +
      '  ·  스킬 +' + (s.skillDamage || 0) +
      '  ·  HP ' + (PD.RUN && PD.RUN.maxHp ? PD.RUN.maxHp : (4 + (s.maxHpBonus || 0)));
  }
  PD.UI.statLine = statLine;

  PD.UI.openInventory = function (scene) {
    var SAVE = PD.SAVE;
    var UI = PD.UI;
    var m = UI.modal(scene, { title: '인벤토리 · 장비', subtitle: UI.fmtGold(SAVE.gold), w: PD.DESIGN_W - 28, h: PD.DESIGN_H - 150 });
    var cw = m.contentRect.w;

    var statTxt = null;
    function refresh() {
      build();
    }
    function build() {
      // 기존 콘텐츠 비우고 다시 그림
      m.body.removeAll(true);
      var SAVE = PD.SAVE;
      m.setSubtitle(UI.fmtGold(SAVE.gold));

      // 상단: 장착 슬롯 6칸(2열 × 3행)
      m.addText(0, 0, '착용 중 (탭하여 해제)', { fontSize: '14px', color: ramp('gold', 2) });
      var slotW = (cw - 12) / 2, slotH = 50, sy = 24;
      SLOTS.forEach(function (slot, i) {
        var col = i % 2, row = (i / 2) | 0;
        var x = col * (slotW + 12), y = sy + row * (slotH + 8);
        drawSlot(x, y, slotW, slotH, slot);
      });

      var listTop = sy + 3 * (slotH + 8) + 8;
      // 파생 스탯 미리보기 한 줄
      var prev = previewStats(SAVE);
      m.addText(0, listTop, statLine(prev), { fontSize: '13px', color: ramp('hero', 3), wordWrap: { width: cw } });

      // 보유 목록(미착용)
      m.addText(0, listTop + 36, '보유 장비 (탭하여 장착)', { fontSize: '14px', color: ramp('gold', 2) });
      var inv = (SAVE.inventory || []).slice();
      var listY = listTop + 56;
      var listH = m.contentRect.h - listY;
      if (!inv.length) {
        m.addText(6, listY + 8, '보유한 장비가 없습니다. 상점에서 사거나 던전에서 주우세요.', { fontSize: '13px', color: ramp('steel', 2) });
        return;
      }
      m.addList({
        x: 0, y: listY, w: cw, h: listH, rowH: 56, gap: 8, items: inv,
        renderRow: function (rc, entry, idx, rowW, rowH) {
          var item = ITEM_BY_ID[entry.id];
          if (!item) return;
          var g = scene.add.graphics();
          g.fillStyle(rampInt('stone', 1), 0.55); g.fillRect(0, 0, rowW, rowH);
          g.lineStyle(2, UI.rarityInt(item.rarity), 0.85); g.strokeRect(0, 0, rowW, rowH);
          rc.add(g);
          // 등급 칩
          var chip = scene.add.graphics(); chip.fillStyle(UI.rarityInt(item.rarity), 1); chip.fillRect(0, 0, 5, rowH); rc.add(chip);
          var nm = item.name + (entry.enh ? ' +' + entry.enh : '');
          rc.add(scene.add.text(14, 8, nm, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '15px', color: UI.rarityColor(item.rarity) }));
          rc.add(scene.add.text(14, 30, SLOT_NAME[item.slot] + ' · ' + effectSummary(item, entry.enh || 0), { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 3), wordWrap: { width: rowW - 110 } }));
          var b = UI.button(scene, rowW - 50, rowH / 2, 80, 36, '장착', function () { equip(entry, idx); }, { fontSize: '15px', fill: rampInt('hero', 1), stroke: rampInt('hero', 2) });
          rc.add(b);
        }
      });
    }

    function drawSlot(x, y, w, h, slot) {
      var SAVE = PD.SAVE;
      var entry = SAVE.equipment[slot];
      var item = entry && entry.id ? ITEM_BY_ID[entry.id] : null;
      var g = scene.add.graphics();
      g.fillStyle(rampInt('stone', 1), 0.5); g.fillRect(x, y, w, h);
      g.lineStyle(2, item ? UI.rarityInt(item.rarity) : rampInt('steel', 1), item ? 0.9 : 0.5); g.strokeRect(x, y, w, h);
      m.body.add(g);
      m.body.add(scene.add.text(x + 8, y + 6, SLOT_NAME[slot], { fontFamily: 'sans-serif', fontSize: '11px', color: ramp('steel', 2) }));
      if (item) {
        m.body.add(scene.add.text(x + 8, y + 22, item.name + (entry.enh ? ' +' + entry.enh : ''), { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '14px', color: UI.rarityColor(item.rarity), wordWrap: { width: w - 16 } }));
        // 탭하면 해제
        var z = scene.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive();
        z.on('pointerdown', function () { unequip(slot); });
        m.body.add(z);
      } else {
        m.body.add(scene.add.text(x + 8, y + 24, '— 비어 있음 —', { fontFamily: 'sans-serif', fontSize: '13px', color: ramp('steel', 1) }));
      }
    }

    function equip(entry, idx) {
      var SAVE = PD.SAVE;
      var item = ITEM_BY_ID[entry.id];
      if (!item || !item.slot) return;
      // 인벤토리에서 빼고
      SAVE.inventory.splice(idx, 1);
      // 기존 착용품은 인벤토리로 되돌림
      var prev = SAVE.equipment[item.slot];
      if (prev && prev.id) SAVE.inventory.push(prev);
      SAVE.equipment[item.slot] = { id: entry.id, enh: entry.enh || 0 };
      commit();
      UI.toast(scene, item.name + ' 장착!', { accent: roleInt('ui_accent') });
      refresh();
    }
    function unequip(slot) {
      var SAVE = PD.SAVE;
      var entry = SAVE.equipment[slot];
      if (!entry || !entry.id) return;
      SAVE.inventory.push(entry);
      SAVE.equipment[slot] = null;
      commit();
      UI.toast(scene, SLOT_NAME[slot] + ' 해제', { accent: rampInt('scarlet', 2) });
      refresh();
    }
    function commit() {
      PD.SaveStore.save(PD.SAVE);
      // 던전 진행 중이면 활성 RUN 스탯도 즉시 반영
      if (PD.RUN) { try { PD.recomputeStats(PD.SAVE, PD.RUN); } catch (e) {} }
    }

    build();
    return m;
  };
})();
