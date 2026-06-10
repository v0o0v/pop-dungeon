/* ============================================================================
 * 팡팡 던전 — 대장간 (무쇠 누나) · 장비 강화 +1~+9
 * ----------------------------------------------------------------------------
 * 보유/착용 장비를 골드 + 재료로 강화한다. 강화 단계마다 enh +1 (최대 +9),
 * effect 에 enhStep × enh 가 합산된다(game/stats.js applyEquipment 정합).
 *
 * 비용(item.enhanceCost): gold = goldBase × rarityMult × (enh+1).
 *   재료: enhanceCost.material[tierIndex] — +1~3=star, +4~6=bright, +7~9=core.
 *   재료 보유 = SAVE.materials[matId]. 던전 드랍이 채운다(휘발 아님 — 영속).
 *
 * 공개: PD.UI.openForge(scene)
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt;
  var WHITE = PD.WHITE;
  var ITEM_BY_ID = PD.ITEM_BY_ID || {};
  var MAX_ENH = 9;

  // 강화 단계 → 재료 tier index (0:+1~3, 1:+4~6, 2:+7~9)
  function tierIndexFor(enhTarget) { return enhTarget <= 3 ? 0 : (enhTarget <= 6 ? 1 : 2); }

  function enhanceCost(item, curEnh) {
    var target = curEnh + 1;
    var ec = item.enhanceCost || { goldBase: 20, rarityMult: 1.0, material: ['mat_starshard', 'mat_brightore', 'mat_corefrag'] };
    var gold = Math.round((ec.goldBase || 20) * (ec.rarityMult || 1) * target);
    var ti = tierIndexFor(target);
    var matId = (ec.material && ec.material[ti]) || 'mat_starshard';
    var matCount = target <= 3 ? 1 : (target <= 6 ? 2 : 3);
    return { gold: gold, matId: matId, matCount: matCount, target: target };
  }
  PD.UI = PD.UI || {};
  PD.UI.enhanceCost = enhanceCost;

  function matName(id) { var it = ITEM_BY_ID[id]; return it ? it.name : id; }
  function matHave(save, id) { return (save.materials && save.materials[id]) || 0; }

  PD.UI.openForge = function (scene) {
    var UI = PD.UI;
    var m = UI.modal(scene, { title: '대장간', subtitle: UI.fmtGold(PD.SAVE.gold), w: PD.DESIGN_W - 28, h: PD.DESIGN_H - 150, accent: rampInt('torch', 2) });
    var cw = m.contentRect.w;

    // 강화 가능한 장비 = 착용 6 + 인벤토리(slot 有, enh < 9)
    function gatherEquip() {
      var SAVE = PD.SAVE;
      var list = [];
      PD.UI.EQUIP_SLOTS.forEach(function (slot) {
        var e = SAVE.equipment[slot];
        if (e && e.id) list.push({ entry: e, where: 'equip', slot: slot });
      });
      (SAVE.inventory || []).forEach(function (e, i) {
        if (e && e.id && ITEM_BY_ID[e.id] && ITEM_BY_ID[e.id].slot) list.push({ entry: e, where: 'inv', idx: i });
      });
      return list;
    }

    function build() {
      m.body.removeAll(true);
      m.setSubtitle(UI.fmtGold(PD.SAVE.gold));
      m.addText(0, 0, '"꼬맹이. 장비 가져와. 벼려줄게."', { fontSize: '13px', color: ramp('steel', 2), fontStyle: 'italic' });
      // 보유 재료 한 줄
      var matStr = ['mat_starshard', 'mat_brightore', 'mat_corefrag'].map(function (id) {
        return matName(id) + ' ' + matHave(PD.SAVE, id);
      }).join('   ');
      m.addText(0, 22, '재료: ' + matStr, { fontSize: '12px', color: ramp('hero', 3) });

      var listY = 44;
      var listH = m.contentRect.h - listY;
      var rows = gatherEquip();
      if (!rows.length) { m.addText(6, listY + 8, '강화할 장비가 없습니다.', { fontSize: '13px', color: ramp('steel', 2) }); return; }
      m.addList({
        x: 0, y: listY, w: cw, h: listH, rowH: 64, gap: 8, items: rows,
        renderRow: function (rc, row, idx, rowW, rowH) {
          var item = ITEM_BY_ID[row.entry.id];
          if (!item) return;
          var enh = row.entry.enh || 0;
          var g = scene.add.graphics();
          g.fillStyle(rampInt('stone', 1), 0.55); g.fillRect(0, 0, rowW, rowH);
          g.lineStyle(2, UI.rarityInt(item.rarity), 0.85); g.strokeRect(0, 0, rowW, rowH);
          rc.add(g);
          var maxed = enh >= MAX_ENH;
          var nm = item.name + (enh ? ' +' + enh : '') + (row.where === 'equip' ? ' (착용)' : '');
          rc.add(scene.add.text(12, 8, nm, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '15px', color: UI.rarityColor(item.rarity) }));
          if (maxed) {
            rc.add(scene.add.text(12, 32, '최대 강화 (+9)', { fontFamily: 'sans-serif', fontSize: '13px', color: ramp('gold', 2) }));
            return;
          }
          var cost = enhanceCost(item, enh);
          var have = matHave(PD.SAVE, cost.matId);
          var canDo = PD.SAVE.gold >= cost.gold && have >= cost.matCount;
          var costStr = UI.fmtGold(cost.gold) + ' · ' + matName(cost.matId) + ' ' + cost.matCount + '/' + have;
          rc.add(scene.add.text(12, 32, '+' + enh + ' → +' + cost.target + '   ' + costStr, { fontFamily: 'sans-serif', fontSize: '12px', color: canDo ? ramp('steel', 3) : ramp('scarlet', 2) }));
          var b = UI.button(scene, rowW - 52, rowH / 2, 86, 42, '강화', function () { enhance(row, item, cost); }, {
            fontSize: '15px', fill: rampInt('torch', 1), stroke: rampInt('torch', 2), disabled: !canDo
          });
          rc.add(b);
        }
      });
    }

    function enhance(row, item, cost) {
      var SAVE = PD.SAVE;
      var have = matHave(SAVE, cost.matId);
      if (SAVE.gold < cost.gold || have < cost.matCount) return;
      SAVE.gold -= cost.gold;
      SAVE.materials = SAVE.materials || {};
      SAVE.materials[cost.matId] = have - cost.matCount;
      row.entry.enh = (row.entry.enh || 0) + 1;
      // enhance:+N 퀘스트 진척(최고 강화 단계)
      try {
        var prog = (SAVE.quests.progress = SAVE.quests.progress || {});
        (window.POP_QUESTS.quests || []).forEach(function (q) {
          if (q.objective && q.objective.type === 'collect' && /^enhance:\+(\d+)$/.test(q.objective.target)) {
            var need = parseInt(q.objective.target.split('+')[1], 10);
            if (row.entry.enh >= need) prog[q.id] = Math.max(prog[q.id] || 0, 1);
          }
        });
      } catch (e) {}
      PD.SaveStore.save(SAVE);
      if (PD.RUN) { try { PD.recomputeStats(SAVE, PD.RUN); } catch (e) {} }
      UI.toast(scene, '탕! ' + item.name + ' +' + row.entry.enh, { accent: rampInt('torch', 2) });
      if (scene.cameras) scene.cameras.main.shake(120, 0.004);
      build();
    }

    build();
    return m;
  };
})();
