/* ============================================================================
 * 팡팡 던전 — 스탯 분배 (떠돌이 별엿장수) · vit/pow/agi/foc
 * ----------------------------------------------------------------------------
 * SAVE.statPoints 를 4스탯에 배분한다. game/stats.js STAT_DIST 환산:
 *   vit → maxHp +2/pt, pow → 피해 +3/pt, agi → 이속 +15/pt, foc → 스킬피해 +5/pt.
 * 분배는 영속(SAVE.stats). +/− 버튼으로 조정, 분배 즉시 recomputeStats 반영.
 * 환불(−)은 자유(마을 안에서) — 빌드 실험을 막지 않는다.
 *
 * 공개: PD.UI.openStatAlloc(scene)
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt;
  var WHITE = PD.WHITE;

  var STATS = [
    { key: 'vit', name: '활력 (VIT)', desc: '최대 체력 +2 / 포인트', color: 'scarlet' },
    { key: 'pow', name: '힘 (POW)', desc: '기본 피해 +3 / 포인트', color: 'torch' },
    { key: 'agi', name: '민첩 (AGI)', desc: '이동 속도 +15 / 포인트', color: 'hero' },
    { key: 'foc', name: '집중 (FOC)', desc: '스킬 피해 +5 / 포인트', color: 'arcane' }
  ];

  PD.UI.openStatAlloc = function (scene) {
    var UI = PD.UI;
    var SAVE = PD.SAVE;
    SAVE.stats = SAVE.stats || { vit: 0, pow: 0, agi: 0, foc: 0 };
    var m = UI.modal(scene, { title: '스탯 분배', subtitle: '남은 ◆' + (SAVE.statPoints || 0), w: PD.DESIGN_W - 28, h: PD.DESIGN_H - 230, accent: rampInt('hero', 2) });
    var cw = m.contentRect.w;

    function build() {
      m.body.removeAll(true);
      m.setSubtitle('남은 ◆' + (SAVE.statPoints || 0));
      m.addText(0, 0, '"별엿 한 입이면 다리에 별심이 돋아!"', { fontSize: '13px', color: ramp('steel', 2), fontStyle: 'italic' });
      var sy = 28, rowH = 58;
      STATS.forEach(function (st, i) {
        var y = sy + i * (rowH + 10);
        var g = scene.add.graphics();
        g.fillStyle(rampInt('stone', 1), 0.5); g.fillRect(0, y, cw, rowH);
        g.lineStyle(2, rampInt(st.color, 2), 0.7); g.strokeRect(0, y, cw, rowH);
        m.body.add(g);
        m.body.add(scene.add.text(12, y + 8, st.name, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '16px', color: ramp(st.color, 3) }));
        m.body.add(scene.add.text(12, y + 32, st.desc, { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 3) }));
        // 현재 값
        var val = SAVE.stats[st.key] || 0;
        m.body.add(scene.add.text(cw - 96, y + rowH / 2, String(val), { fontFamily: 'monospace', fontStyle: 'bold', fontSize: '22px', color: WHITE }).setOrigin(0.5));
        // − / + 버튼
        var minus = UI.button(scene, cw - 132, y + rowH / 2, 32, 36, '−', function () { dec(st.key); }, { fontSize: '20px', fill: rampInt('scarlet', 1), stroke: rampInt('scarlet', 2), disabled: val <= 0 });
        var plus = UI.button(scene, cw - 28, y + rowH / 2, 32, 36, '+', function () { inc(st.key); }, { fontSize: '20px', fill: rampInt('hero', 1), stroke: rampInt('hero', 2), disabled: (SAVE.statPoints || 0) <= 0 });
        m.body.add(minus); m.body.add(plus);
      });
      // 미리보기 스탯
      var prev = UI.previewStats(SAVE);
      m.addText(0, sy + STATS.length * (rowH + 10) + 4, UI.statLine(prev), { fontSize: '12px', color: ramp('gold', 2), wordWrap: { width: cw } });
    }

    function inc(key) {
      if ((SAVE.statPoints || 0) <= 0) return;
      SAVE.statPoints -= 1;
      SAVE.stats[key] = (SAVE.stats[key] || 0) + 1;
      commit(); build();
    }
    function dec(key) {
      if ((SAVE.stats[key] || 0) <= 0) return;
      SAVE.stats[key] -= 1;
      SAVE.statPoints = (SAVE.statPoints || 0) + 1;
      commit(); build();
    }
    function commit() {
      PD.SaveStore.save(SAVE);
      if (PD.RUN) { try { PD.recomputeStats(SAVE, PD.RUN); } catch (e) {} }
    }

    build();
    return m;
  };
})();
