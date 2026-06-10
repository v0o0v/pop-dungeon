/* ============================================================================
 * 팡팡 던전 — 퀘스트보드 (이장님) · 수주/진행/완료
 * ----------------------------------------------------------------------------
 * quests.data.js 사이드 퀘스트를 NPC stage 게이트로 노출한다. 상태:
 *   - 잠김(stage 미달)        : 회색, 수주 불가.
 *   - 수주 가능(active 아님)   : "수주" 버튼.
 *   - 진행 중(active)          : 목표 진행도(SAVE.quests.progress) 표시.
 *   - 달성(진행 ≥ 목표)        : "보상 수령" 버튼 → 보상 지급, done 으로 이동.
 *   - 완료(done)               : storyFragment(NPC 내면 한 줄) 노출.
 *
 * 진행도는 던전 commitRun(kill/collect/reach) + 마을 거래(gold:spent·enhance)가
 * SAVE.quests.progress 에 누적한다. 보상은 L2·L4 통화 정합으로 지급:
 *   gold/statPoint/skillPoint → 영속, equipment → 인벤토리, consumable → 휘발 반입,
 *   passive/material/blueprint → SAVE 플래그/재료.
 *
 * 현재 stage 계산(npcs.data.js stageTriggers): checkpoint + story.flags.
 * 공개: PD.UI.openQuestBoard(scene)
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt;
  var WHITE = PD.WHITE;
  var QUESTS = (window.POP_QUESTS && window.POP_QUESTS.quests) || [];
  var STAGE_ORDER = ['stage_0', 'stage_1', 'stage_2', 'stage_twist', 'stage_cleared'];

  // 현재 진행 stage 인덱스(npcs.data.js stageTriggers 규칙)
  function currentStageIndex(save) {
    if (save.story && save.story.flags && save.story.flags.cleared) return 4;       // stage_cleared
    if (save.story && save.story.flags && save.story.flags.reached_region_10) return 3; // stage_twist
    var cp = save.checkpoint || 0;
    if (cp >= 7) return 2;   // stage_2
    if (cp >= 3) return 1;   // stage_1
    return 0;                // stage_0
  }
  PD.UI.currentStageIndex = currentStageIndex;

  // 퀘스트 목표 진행도/총량
  function questProgress(save, q) {
    var prog = (save.quests && save.quests.progress && save.quests.progress[q.id]) || 0;
    var total = (q.objective && q.objective.count) || 1;
    // reach 목표는 checkpoint 도달로 자동 충족
    if (q.objective && q.objective.type === 'reach') {
      var targetRegion = parseInt(String(q.objective.target).replace('region-', ''), 10) || 0;
      var reached = (save.checkpoint || 0) + 1;
      return { cur: reached >= targetRegion ? total : 0, total: total };
    }
    return { cur: Math.min(prog, total), total: total };
  }
  PD.UI.questProgress = questProgress;

  function objectiveLabel(q) {
    var o = q.objective || {};
    if (o.type === 'kill') return '처치: ' + (o.target || '') + (o.region ? ' (' + o.region + ')' : '') + ' ×' + (o.count || 1);
    if (o.type === 'collect') return '수집: ' + (o.target || '') + ' ' + (o.count || 1);
    if (o.type === 'reach') return '도달: ' + (o.target || '');
    return '';
  }

  PD.UI.openQuestBoard = function (scene) {
    var UI = PD.UI;
    var SAVE = PD.SAVE;
    SAVE.quests = SAVE.quests || { active: [], done: [], progress: {} };
    var m = UI.modal(scene, { title: '퀘스트 게시판', subtitle: '완료 ' + (SAVE.quests.done || []).length + '/' + QUESTS.length, w: PD.DESIGN_W - 24, h: PD.DESIGN_H - 130, accent: rampInt('gold', 2) });
    var cw = m.contentRect.w;

    function build() {
      m.body.removeAll(true);
      m.setSubtitle('완료 ' + (SAVE.quests.done || []).length + '/' + QUESTS.length);
      m.addText(0, 0, '"또 내려갈 작정이여? …하이고. 이거나 좀 해주면 고맙겄어."', { fontSize: '12px', color: ramp('steel', 2), fontStyle: 'italic', wordWrap: { width: cw } });
      var stageIdx = currentStageIndex(SAVE);
      var listY = 24, listH = m.contentRect.h - listY;
      m.addList({
        x: 0, y: listY, w: cw, h: listH, rowH: 86, gap: 8, items: QUESTS,
        renderRow: function (rc, q, idx, rowW, rowH) {
          var unlockIdx = STAGE_ORDER.indexOf(q.unlockStage || 'stage_0');
          var locked = stageIdx < unlockIdx;
          var done = (SAVE.quests.done || []).indexOf(q.id) >= 0;
          var active = (SAVE.quests.active || []).indexOf(q.id) >= 0;
          var pr = questProgress(SAVE, q);
          var complete = pr.cur >= pr.total;

          var g = scene.add.graphics();
          var border = done ? rampInt('hero', 2) : (locked ? rampInt('steel', 0) : rampInt('gold', 2));
          g.fillStyle(rampInt('stone', 1), locked ? 0.35 : 0.55); g.fillRect(0, 0, rowW, rowH);
          g.lineStyle(2, border, locked ? 0.4 : 0.85); g.strokeRect(0, 0, rowW, rowH);
          rc.add(g);

          var titleColor = locked ? ramp('steel', 1) : (done ? ramp('hero', 3) : ramp('gold', 2));
          var npc = npcName(q.npc);
          rc.add(scene.add.text(12, 8, q.title + '  · ' + npc, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '15px', color: titleColor }));

          if (locked) {
            rc.add(scene.add.text(12, 32, '🔒 ' + stageReqText(q.unlockStage), { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 1) }));
            return;
          }
          rc.add(scene.add.text(12, 30, objectiveLabel(q), { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 3), wordWrap: { width: rowW - 24 } }));
          // 보상 한 줄
          rc.add(scene.add.text(12, 48, '보상: ' + rewardLabel(q.reward), { fontFamily: 'sans-serif', fontSize: '11px', color: ramp('gold', 3) }));

          if (done) {
            rc.add(scene.add.text(12, 64, '✓ 완료 — "' + (q.storyFragment || '').slice(0, 38) + '…"', { fontFamily: 'sans-serif', fontSize: '11px', color: ramp('hero', 2), wordWrap: { width: rowW - 24 } }));
            return;
          }
          if (active) {
            // 진행도 바
            var barW = rowW - 120, barX = 12, barY = 66;
            var bg = scene.add.graphics(); bg.fillStyle(rampInt('stone', 0), 1); bg.fillRect(barX, barY, barW, 10); rc.add(bg);
            var frac = pr.total ? pr.cur / pr.total : 0;
            var bf = scene.add.graphics(); bf.fillStyle(complete ? rampInt('hero', 2) : rampInt('gold', 2), 1); bf.fillRect(barX, barY, barW * frac, 10); rc.add(bf);
            rc.add(scene.add.text(barX + barW + 6, barY + 5, pr.cur + '/' + pr.total, { fontFamily: 'monospace', fontSize: '11px', color: WHITE }).setOrigin(0, 0.5));
            if (complete) {
              var bc = UI.button(scene, rowW - 52, 30, 88, 36, '보상 수령', function () { claim(q); }, { fontSize: '13px', fill: rampInt('hero', 1), stroke: rampInt('hero', 2) });
              rc.add(bc);
            }
          } else {
            var ba = UI.button(scene, rowW - 52, rowH / 2, 88, 38, '수주', function () { accept(q); }, { fontSize: '14px', fill: rampInt('gold', 1), stroke: rampInt('gold', 2) });
            rc.add(ba);
          }
        }
      });
    }

    function accept(q) {
      SAVE.quests.active = SAVE.quests.active || [];
      if (SAVE.quests.active.indexOf(q.id) < 0) SAVE.quests.active.push(q.id);
      PD.SaveStore.save(SAVE);
      UI.toast(scene, '"' + q.title + '" 수주', { accent: rampInt('gold', 2) });
      build();
    }

    function claim(q) {
      // active → done
      var ai = SAVE.quests.active.indexOf(q.id);
      if (ai >= 0) SAVE.quests.active.splice(ai, 1);
      SAVE.quests.done = SAVE.quests.done || [];
      if (SAVE.quests.done.indexOf(q.id) < 0) SAVE.quests.done.push(q.id);
      grantRewards(q.reward);
      PD.SaveStore.save(SAVE);
      if (PD.RUN) { try { PD.recomputeStats(SAVE, PD.RUN); } catch (e) {} }
      UI.toast(scene, '보상 획득! ' + rewardLabel(q.reward), { accent: rampInt('hero', 2) });
      build();
    }

    function grantRewards(rewards) {
      (rewards || []).forEach(function (r) {
        switch (r.type) {
          case 'gold': SAVE.gold = (SAVE.gold || 0) + (r.amount || 0); break;
          case 'statPoint': SAVE.statPoints = (SAVE.statPoints || 0) + (r.amount || 1); break;
          case 'skillPoint': SAVE.skills = SAVE.skills || { points: 0 }; SAVE.skills.points = (SAVE.skills.points || 0) + (r.amount || 1); break;
          case 'equipment': grantEquipment(r.rarity); break;
          case 'consumable': SAVE.consumables = SAVE.consumables || {}; if (r.id) SAVE.consumables[r.id] = (SAVE.consumables[r.id] || 0) + 1; break;
          case 'material': SAVE.materials = SAVE.materials || {}; if (r.id) SAVE.materials[r.id] = (SAVE.materials[r.id] || 0) + (r.amount || 1); break;
          case 'passive': SAVE.story = SAVE.story || { flags: {} }; SAVE.story.flags['passive_' + r.id] = r.value || true; break;
          case 'blueprint': SAVE.story = SAVE.story || { flags: {} }; SAVE.story.flags['blueprint_' + r.id] = true; break;
        }
      });
    }
    // 등급 맞는 장비 1개를 인벤토리에 지급(결정적 선택)
    function grantEquipment(rarity) {
      var pool = (window.POP_ITEMS.items || []).filter(function (it) { return it.slot && it.rarity === rarity; });
      if (!pool.length) pool = (window.POP_ITEMS.items || []).filter(function (it) { return it.slot; });
      if (!pool.length) return;
      PD.setSeed(0x9151 + (SAVE.quests.done || []).length * 53);
      var pick = pool[Math.floor(PD.rand() * pool.length)];
      SAVE.inventory = SAVE.inventory || [];
      SAVE.inventory.push({ id: pick.id, enh: 0 });
    }

    function rewardLabel(rewards) {
      return (rewards || []).map(function (r) {
        if (r.type === 'gold') return '◉' + r.amount;
        if (r.type === 'statPoint') return '스탯◆' + (r.amount || 1);
        if (r.type === 'skillPoint') return '스킬◆' + (r.amount || 1);
        if (r.type === 'equipment') return UI.rarityName(r.rarity) + ' 장비';
        if (r.type === 'consumable') return '소모품';
        if (r.type === 'material') return '재료×' + (r.amount || 1);
        if (r.type === 'passive') return '패시브';
        if (r.type === 'blueprint') return '도면';
        return r.type;
      }).join(', ');
    }
    function npcName(id) {
      var n = ((window.POP_NPCS && window.POP_NPCS.npcs) || []).filter(function (x) { return x.id === id; })[0];
      return n ? n.name : id;
    }
    function stageReqText(stage) {
      return { stage_0: '', stage_1: 'region-03 도달 필요', stage_2: 'region-07 도달 필요', stage_twist: '91층 막간 필요', stage_cleared: '클리어 필요' }[stage] || '진행 필요';
    }

    build();
    return m;
  };
})();
