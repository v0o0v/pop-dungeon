/* ============================================================================
 * 팡팡 던전 — NPC 대화 시스템 (npcs.data.js 대사 트리 + stage 분기)
 * ----------------------------------------------------------------------------
 * NPC 접근 시 stage(checkpoint/story.flags 로 계산)에 맞는 lines 를 순서대로
 * 보여준다. 대사 끝에서 그 NPC 의 기능(func)으로 진입하는 버튼을 노출.
 *   func 매핑: shop→openShop, skillmaster→openSkillTree, stats→openStatAlloc,
 *              forge→openForge, questboard→openQuestBoard, codex→openCodex.
 *
 * 반전 보호(TW-FAIR-PLAY): 대사는 데이터(STORY.md 캐논)가 단일 진실 — stage 가
 * 올라도 転(91층) 전엔 별이의 진실을 누구도 말하지 않는다(데이터가 이미 보장).
 *
 * 공개: PD.UI.openDialogue(scene, npcId)
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt;
  var WHITE = PD.WHITE, INK = PD.INK;
  var NPCS = (window.POP_NPCS && window.POP_NPCS.npcs) || [];
  var STAGE_ORDER = ['stage_0', 'stage_1', 'stage_2', 'stage_twist', 'stage_cleared'];

  var FUNC_OPENER = {
    shop: 'openShop', skillmaster: 'openSkillTree', stats: 'openStatAlloc',
    forge: 'openForge', questboard: 'openQuestBoard', codex: 'openCodex'
  };
  var FUNC_LABEL = {
    shop: '물건 보기', skillmaster: '스킬 배우기', stats: '스탯 분배하기',
    forge: '장비 강화하기', questboard: '퀘스트 보기', codex: '도감 보기'
  };

  function npcById(id) { for (var i = 0; i < NPCS.length; i++) if (NPCS[i].id === id) return NPCS[i]; return null; }

  // 현재 stage 키(npcs.data.js stageTriggers 규칙 — QuestBoard.currentStageIndex 와 동일 규칙)
  function currentStageKey(save) {
    var idx = (PD.UI && PD.UI.currentStageIndex) ? PD.UI.currentStageIndex(save) : 0;
    return STAGE_ORDER[idx] || 'stage_0';
  }
  PD.UI.currentStageKey = currentStageKey;

  // stage 우선순위(높은 것부터): 현재 stage 의 lines 가 없으면 한 단계씩 내려감
  function linesForStage(npc, stageKey) {
    var order = STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(stageKey) + 1).reverse();
    for (var i = 0; i < order.length; i++) {
      var l = npc.lines && npc.lines[order[i]];
      if (l && l.length) return l;
    }
    return ['…'];
  }

  PD.UI.openDialogue = function (scene, npcId) {
    var UI = PD.UI;
    var SAVE = PD.SAVE;
    var npc = npcById(npcId);
    if (!npc) return null;
    var stageKey = currentStageKey(SAVE);
    var lines = linesForStage(npc, stageKey);
    var idx = 0;

    var m = UI.modal(scene, { title: npc.name, subtitle: npc.role || '', w: PD.DESIGN_W - 40, h: 320, accent: rampInt('gold', 2) });
    var cw = m.contentRect.w, chH = m.contentRect.h;

    var bodyTxt = m.addText(4, 10, '', { fontSize: '17px', color: WHITE, lineSpacing: 8, wordWrap: { width: cw - 8 } });
    var hintTxt = m.addText(cw - 4, chH - 22, '탭하여 계속', { fontSize: '12px', color: ramp('steel', 2) }).setOrigin(1, 1);

    var funcBtn = null, started = false;

    function showLine() {
      bodyTxt.setText(lines[idx]);
      // 마지막 줄이면 기능 진입/닫기 버튼 노출
      if (idx >= lines.length - 1) {
        hintTxt.setText('');
        showActions();
      }
    }
    function showActions() {
      if (funcBtn) return;
      var opener = FUNC_OPENER[npc.func];
      var by = chH - 40;
      if (opener && PD.UI[opener]) {
        funcBtn = m.addButton(cw / 2 - 80, by, 150, 40, FUNC_LABEL[npc.func] || '기능', function () {
          m.close();
          PD.UI[opener](scene);
        }, { fontSize: '15px', fill: rampInt('gold', 1), stroke: rampInt('gold', 2) });
        m.addButton(cw / 2 + 90, by, 100, 40, '나가기', function () { m.close(); }, { fontSize: '15px', fill: rampInt('steel', 1), stroke: roleInt('ui_accent') });
      } else {
        funcBtn = m.addButton(cw / 2, by, 140, 40, '나가기', function () { m.close(); }, { fontSize: '15px', fill: rampInt('steel', 1), stroke: roleInt('ui_accent') });
      }
    }

    // 대사 영역 탭 → 다음 줄
    var z = scene.add.zone(m.panelRect.x, m.panelRect.y, m.panelRect.w, m.panelRect.h - 60).setOrigin(0, 0).setInteractive();
    z.on('pointerdown', function () {
      if (idx < lines.length - 1) { idx++; showLine(); }
    });
    m.root.add(z);

    showLine();
    return m;
  };

  PD.UI.npcById = npcById;
  PD.UI.FUNC_LABEL = FUNC_LABEL;
})();
