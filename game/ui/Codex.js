/* ============================================================================
 * 팡팡 던전 — 도감 (떠버리 쌍둥이) · 적/장비/업적 수집 현황
 * ----------------------------------------------------------------------------
 * codex.data.js 항목을 SAVE.codex 플래그 기준으로 표시한다.
 *   적   : SAVE.codex.enemies[id] (처치 수) — 0 이면 '???' 실루엣.
 *   장비 : SAVE.codex.items[id] (획득 플래그) — 미획득은 회색.
 *   업적 : trigger 충족 여부를 진행도/플래그로 판정.
 * 반전 보호: 적 설명은 데이터(codex.data.js)가 단일 진실 — 별이의 진실 비노출.
 *
 * 공개: PD.UI.openCodex(scene)
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt;
  var WHITE = PD.WHITE;
  var CODEX = window.POP_CODEX || { enemies: [], achievements: [] };
  var ITEMS = window.POP_ITEMS || { items: [] };
  var ITEM_BY_ID = PD.ITEM_BY_ID || {};

  var KIND_NAME = { common: '일반', elite: '정예', boss: '보스', final: '최종' };

  PD.UI.openCodex = function (scene) {
    var UI = PD.UI;
    var SAVE = PD.SAVE;
    SAVE.codex = SAVE.codex || { enemies: {}, items: {}, achievements: {} };
    var tab = 'enemies';
    var m = UI.modal(scene, { title: '도감', subtitle: '', w: PD.DESIGN_W - 24, h: PD.DESIGN_H - 130, accent: rampInt('hero', 2) });
    var cw = m.contentRect.w;

    // 장비 = 6슬롯 + 휘발 부적 + 소모품(수집 대상은 slot 장비 + run 부적)
    var EQUIP_LIST = (ITEMS.items || []).filter(function (it) { return it.kind === 'equipment'; });

    function counts() {
      var enemiesTotal = (CODEX.enemies || []).length;
      var enemiesSeen = Object.keys(SAVE.codex.enemies || {}).length;
      var itemsTotal = EQUIP_LIST.length;
      var itemsSeen = Object.keys(SAVE.codex.items || {}).filter(function (k) { return SAVE.codex.items[k]; }).length;
      var achTotal = (CODEX.achievements || []).length;
      var achDone = (CODEX.achievements || []).filter(achieved).length;
      return { enemiesSeen: enemiesSeen, enemiesTotal: enemiesTotal, itemsSeen: itemsSeen, itemsTotal: itemsTotal, achDone: achDone, achTotal: achTotal };
    }

    function build() {
      m.body.removeAll(true);
      var c = counts();
      var subMap = { enemies: c.enemiesSeen + '/' + c.enemiesTotal, items: c.itemsSeen + '/' + c.itemsTotal, ach: c.achDone + '/' + c.achTotal };
      m.setSubtitle(subMap[tab]);
      m.addText(0, 0, '"넌 도감 다 채웠어? — 우리가 더 많이 안다! — 거짓말!"', { fontSize: '12px', color: ramp('steel', 2), fontStyle: 'italic', wordWrap: { width: cw } });
      // 탭 3개
      var tw = (cw - 16) / 3;
      var tabs = [['enemies', '적 ' + subMap.enemies], ['items', '장비 ' + subMap.items], ['ach', '업적 ' + subMap.ach]];
      tabs.forEach(function (t, i) {
        m.addButton(i * (tw + 8) + tw / 2, 36, tw, 32, t[1], function () { tab = t[0]; build(); }, { fontSize: '13px', fill: tab === t[0] ? rampInt('hero', 1) : rampInt('steel', 0), stroke: rampInt('hero', 2) });
      });
      var listY = 62, listH = m.contentRect.h - listY;
      if (tab === 'enemies') buildEnemies(listY, listH);
      else if (tab === 'items') buildItems(listY, listH);
      else buildAch(listY, listH);
    }

    function buildEnemies(listY, listH) {
      m.addList({
        x: 0, y: listY, w: cw, h: listH, rowH: 60, gap: 8, items: CODEX.enemies || [],
        renderRow: function (rc, en, idx, rowW, rowH) {
          var killed = (SAVE.codex.enemies && SAVE.codex.enemies[en.id]) || 0;
          var seen = killed > 0;
          var g = scene.add.graphics();
          g.fillStyle(rampInt('stone', 1), seen ? 0.55 : 0.3); g.fillRect(0, 0, rowW, rowH);
          var bc = en.kind === 'boss' || en.kind === 'final' ? rampInt('scarlet', 2) : (en.kind === 'elite' ? rampInt('gold', 2) : rampInt('steel', 1));
          g.lineStyle(2, bc, seen ? 0.85 : 0.4); g.strokeRect(0, 0, rowW, rowH);
          rc.add(g);
          var nm = seen ? en.name : '??? (미발견)';
          var nmColor = seen ? (en.kind === 'boss' || en.kind === 'final' ? ramp('scarlet', 2) : WHITE) : ramp('steel', 1);
          rc.add(scene.add.text(12, 8, nm + '   [' + (KIND_NAME[en.kind] || en.kind) + ']', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '14px', color: nmColor }));
          if (seen) {
            rc.add(scene.add.text(12, 30, en.desc, { fontFamily: 'sans-serif', fontSize: '11px', color: ramp('steel', 3), wordWrap: { width: rowW - 80 } }));
            rc.add(scene.add.text(rowW - 12, 8, '처치 ' + killed, { fontFamily: 'monospace', fontSize: '12px', color: ramp('hero', 3) }).setOrigin(1, 0));
          } else {
            rc.add(scene.add.text(12, 30, '아직 만나지 못한 조각입니다.', { fontFamily: 'sans-serif', fontSize: '11px', color: ramp('steel', 1) }));
          }
        }
      });
    }

    function buildItems(listY, listH) {
      m.addList({
        x: 0, y: listY, w: cw, h: listH, rowH: 52, gap: 6, items: EQUIP_LIST,
        renderRow: function (rc, it, idx, rowW, rowH) {
          var got = !!(SAVE.codex.items && SAVE.codex.items[it.id]);
          var g = scene.add.graphics();
          g.fillStyle(rampInt('stone', 1), got ? 0.55 : 0.28); g.fillRect(0, 0, rowW, rowH);
          g.lineStyle(2, got ? UI.rarityInt(it.rarity) : rampInt('steel', 1), got ? 0.85 : 0.35); g.strokeRect(0, 0, rowW, rowH);
          rc.add(g);
          var nm = got ? it.name : '???';
          rc.add(scene.add.text(12, 7, nm, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '14px', color: got ? UI.rarityColor(it.rarity) : ramp('steel', 1) }));
          rc.add(scene.add.text(12, 28, got ? (UI.SLOT_NAME[it.slot] + ' · ' + UI.rarityName(it.rarity)) : '미획득', { fontFamily: 'sans-serif', fontSize: '11px', color: ramp('steel', 3) }));
        }
      });
    }

    function buildAch(listY, listH) {
      m.addList({
        x: 0, y: listY, w: cw, h: listH, rowH: 56, gap: 8, items: CODEX.achievements || [],
        renderRow: function (rc, a, idx, rowW, rowH) {
          var done = achieved(a);
          var g = scene.add.graphics();
          g.fillStyle(rampInt('stone', 1), done ? 0.6 : 0.32); g.fillRect(0, 0, rowW, rowH);
          g.lineStyle(2, done ? rampInt('gold', 2) : rampInt('steel', 1), done ? 0.9 : 0.4); g.strokeRect(0, 0, rowW, rowH);
          rc.add(g);
          rc.add(scene.add.text(12, 8, (done ? '★ ' : '☆ ') + a.name, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '15px', color: done ? ramp('gold', 2) : ramp('steel', 2) }));
          rc.add(scene.add.text(12, 32, a.desc, { fontFamily: 'sans-serif', fontSize: '11px', color: ramp('steel', 3), wordWrap: { width: rowW - 24 } }));
        }
      });
    }

    // 업적 충족 판정 — 진행도/플래그 기반(런타임 commitRun 이 SAVE 를 갱신)
    function achieved(a) {
      if (SAVE.codex.achievements && SAVE.codex.achievements[a.id]) return true;
      var tr = a.trigger || {};
      if (tr.type === 'reach') {
        var region = parseInt(String(tr.value).replace('region-', ''), 10) || 99;
        return (SAVE.checkpoint || 0) + 1 >= region;
      }
      if (tr.type === 'clear') return !!(SAVE.story && SAVE.story.flags && SAVE.story.flags.cleared);
      if (tr.type === 'codexFull') {
        if (tr.value === 'enemies') return Object.keys(SAVE.codex.enemies || {}).length >= (CODEX.enemies || []).length;
        if (tr.value === 'items') return Object.keys(SAVE.codex.items || {}).filter(function (k) { return SAVE.codex.items[k]; }).length >= EQUIP_LIST.length;
      }
      if (tr.type === 'enhance') {
        var maxEnh = 0;
        PD.UI.EQUIP_SLOTS.forEach(function (s) { var e = SAVE.equipment[s]; if (e && e.enh > maxEnh) maxEnh = e.enh; });
        (SAVE.inventory || []).forEach(function (e) { if (e.enh > maxEnh) maxEnh = e.enh; });
        return maxEnh >= (tr.value || 9);
      }
      if (tr.type === 'questsAll') return (SAVE.quests.done || []).length >= ((window.POP_QUESTS.quests || []).length);
      return false;
    }

    build();
    return m;
  };
})();
