/* ============================================================================
 * 팡팡 던전 — 스킬트리 (별지기 할아버지) · 노드 학습 + 로드아웃 장착
 * ----------------------------------------------------------------------------
 * 3계열(화력 fire · 기동 mobi · 별빛 star) 트리를 3열 그래프로 시각화한다.
 * root 에서 각 계열 1번 노드로 뻗고, 계열 안에서 줄기·분기. 노드를 탭하면
 * AbilityKit.learn(nodeId) — 포인트·선행 충족 시 학습. grants 액티브는 해금된다.
 *
 * 두 탭:
 *   [트리]    : 노드 그래프 + 학습. 포인트 잔량 표시.
 *   [로드아웃] : 학습/해금된 액티브를 skill1·skill2·ult 슬롯에 장착.
 *
 * 영속(SAVE.skills): AbilityKit.serialize() = { learnedNodes, unlocked, points }.
 *   여기에 loadout 을 더해 SAVE.skills 로 저장. 마을 전용 임시 kit 를 만들어
 *   진행을 복원/학습하고 SaveStore.save 로 기록(던전 kit 와 분리).
 *
 * 공개: PD.UI.openSkillTree(scene)
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt;
  var WHITE = PD.WHITE, INK = PD.INK;
  var AB = PD.abilities || {};
  var SPEC = (AB.SPEC) || window.POP_ABILITIES || { abilities: [], tree: { nodes: [], edges: [] } };
  var BY_ID = AB.BY_ID || {};

  var FAMILY_COLOR = { core: 'gold', fire: 'torch', mobi: 'hero', star: 'arcane' };
  var FAMILY_COL = { fire: 0, mobi: 1, star: 2 };

  PD.UI.openSkillTree = function (scene) {
    var UI = PD.UI;
    var SAVE = PD.SAVE;
    // 별지기 할아버지에게서 트리를 배운다 — SAVE.skills 복원한 임시 kit
    var Kit = window.AbilityKit;
    var kit = new Kit(SPEC, {});
    kit.restore(SAVE.skills || {});
    // 로드아웃은 kit 직렬화에 없으므로 SAVE 에서 직접 보존
    var loadout = Object.assign({ skill1: null, skill2: null, ult: null }, (SAVE.skills && SAVE.skills.loadout) || {});

    var tab = 'tree';
    var m = UI.modal(scene, { title: '별지기 · 스킬', subtitle: '포인트 ' + kit.points, w: PD.DESIGN_W - 24, h: PD.DESIGN_H - 130, accent: rampInt('arcane', 2) });
    var cw = m.contentRect.w, ch = m.contentRect.h;

    function persist() {
      var ser = kit.serialize();
      ser.loadout = loadout;
      SAVE.skills = ser;
      PD.SaveStore.save(SAVE);
      if (PD.RUN) { try { PD.recomputeStats(SAVE, PD.RUN); } catch (e) {} }
    }

    function build() {
      m.body.removeAll(true);
      m.setSubtitle('포인트 ' + kit.points);
      var tw = (cw - 10) / 2;
      m.addButton(tw / 2, 16, tw, 32, '트리', function () { tab = 'tree'; build(); }, { fontSize: '15px', fill: tab === 'tree' ? rampInt('arcane', 1) : rampInt('steel', 0), stroke: rampInt('arcane', 2) });
      m.addButton(tw + 10 + tw / 2, 16, tw, 32, '로드아웃', function () { tab = 'loadout'; build(); }, { fontSize: '15px', fill: tab === 'loadout' ? rampInt('arcane', 1) : rampInt('steel', 0), stroke: rampInt('arcane', 2) });
      if (tab === 'tree') buildTree(); else buildLoadout();
    }

    // ── 트리 탭 ──────────────────────────────────────────────────────────────
    function buildTree() {
      var topY = 40;
      // 계열 헤더
      var colW = cw / 3;
      ['fire', 'mobi', 'star'].forEach(function (fam, i) {
        var fname = { fire: '화력', mobi: '기동', star: '별빛' }[fam];
        m.addText(i * colW + colW / 2, topY, fname, { fontSize: '14px', fontStyle: 'bold', color: ramp(FAMILY_COLOR[fam], 3) }).setOrigin(0.5, 0);
      });

      // 노드를 계열별 컬럼에 줄세움(트리 순서 = 데이터 순)
      var nodes = (SPEC.tree.nodes || []);
      var byFam = { fire: [], mobi: [], star: [] };
      nodes.forEach(function (n) { if (byFam[n.family]) byFam[n.family].push(n); });

      // 스크롤 영역: 노드 그리드를 한 리스트(가짜 1행)에 직접 그린다 — 세로 스크롤
      var gridTop = topY + 22;
      var gridH = ch - gridTop;
      var nodeH = 44, nodeGap = 8;
      var maxRows = Math.max(byFam.fire.length, byFam.mobi.length, byFam.star.length);
      var totalH = maxRows * (nodeH + nodeGap) + 10;

      var listApi = m.addList({
        x: 0, y: gridTop, w: cw, h: gridH, rowH: totalH, gap: 0,
        items: [{}],  // 단일 캔버스 행
        renderRow: function (rc) {
          // 엣지 먼저(노드 뒤)
          var pos = {};
          ['fire', 'mobi', 'star'].forEach(function (fam) {
            byFam[fam].forEach(function (n, ri) {
              var col = FAMILY_COL[fam];
              var nx = col * colW + 6, ny = ri * (nodeH + nodeGap);
              pos[n.id] = { x: nx, y: ny, w: colW - 12, h: nodeH };
            });
          });
          pos['n_root'] = null;
          var eg = scene.add.graphics();
          (SPEC.tree.edges || []).forEach(function (ed) {
            var a = pos[ed.from], b = pos[ed.to];
            if (!a || !b) return;
            var ax = a.x + a.w / 2, ay = a.y + a.h, bx = b.x + b.w / 2, by = b.y;
            var learned = kit.learnedNodes[ed.to];
            eg.lineStyle(2, learned ? rampInt('gold', 2) : rampInt('steel', 1), learned ? 0.9 : 0.5);
            eg.lineBetween(ax, ay, bx, by);
          });
          rc.add(eg);
          // 노드
          ['fire', 'mobi', 'star'].forEach(function (fam) {
            byFam[fam].forEach(function (n, ri) {
              drawNode(rc, n, pos[n.id]);
            });
          });
        }
      });

      function drawNode(rc, n, p) {
        var learned = !!kit.learnedNodes[n.id];
        var canLearn = canLearnNode(n);
        var famc = FAMILY_COLOR[n.family] || 'steel';
        var g = scene.add.graphics();
        var fill = learned ? rampInt(famc, 1) : (canLearn ? rampInt('steel', 0) : rampInt('stone', 0));
        g.fillStyle(fill, learned ? 0.95 : 0.8); g.fillRect(p.x, p.y, p.w, p.h);
        g.lineStyle(2, learned ? rampInt(famc, 3) : (canLearn ? rampInt(famc, 2) : rampInt('steel', 1)), learned ? 1 : (canLearn ? 0.9 : 0.4));
        g.strokeRect(p.x, p.y, p.w, p.h);
        rc.add(g);
        var nameColor = learned ? WHITE : (canLearn ? ramp(famc, 3) : ramp('steel', 2));
        rc.add(scene.add.text(p.x + 6, p.y + 5, n.name, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '12px', color: nameColor, wordWrap: { width: p.w - 12 } }));
        var costStr = learned ? '습득' : (n.cost ? '◆' + n.cost : '◆0');
        rc.add(scene.add.text(p.x + p.w - 6, p.y + 5, costStr, { fontFamily: 'sans-serif', fontSize: '11px', color: learned ? ramp('gold', 2) : ramp('steel', 3) }).setOrigin(1, 0));
        // 효과/해금 요약
        var sub = nodeSub(n);
        rc.add(scene.add.text(p.x + 6, p.y + 24, sub, { fontFamily: 'sans-serif', fontSize: '10px', color: ramp('steel', 2), wordWrap: { width: p.w - 12 } }));
        if (!learned && canLearn) {
          var z = scene.add.zone(p.x, p.y, p.w, p.h).setOrigin(0, 0).setInteractive();
          z.on('pointerdown', function () { tryLearn(n); });
          rc.add(z);
        }
      }
    }

    function nodeSub(n) {
      if (n.grants && n.grants.length) {
        var ab = BY_ID[n.grants[0]];
        return ab ? ('해금: ' + ab.name) : '해금';
      }
      if (n.effect) {
        var k = Object.keys(n.effect)[0];
        var label = (PD.UI.EFFECT_LABEL && PD.UI.EFFECT_LABEL[k]) || k;
        return label + ' +' + n.effect[k];
      }
      return n.desc ? n.desc.slice(0, 18) : '';
    }

    function canLearnNode(n) {
      if (kit.learnedNodes[n.id]) return false;
      if ((kit.points || 0) < (n.cost == null ? 1 : n.cost)) return false;
      var reqs = (n.requires || []).slice();
      (SPEC.tree.edges || []).forEach(function (ed) { if (ed.to === n.id) reqs.push(ed.from); });
      return reqs.every(function (rq) { return kit.learnedNodes[rq]; });
    }

    function tryLearn(n) {
      var res = kit.learn(n.id);
      if (res && res.ok) {
        persist();
        var msg = '습득: ' + n.name;
        if (res.granted && res.granted.length) { var ab = BY_ID[res.granted[0]]; if (ab) msg += ' (' + ab.name + ' 해금)'; }
        UI.toast(scene, msg, { accent: rampInt('arcane', 2) });
        build();
      } else {
        var reason = res ? res.reason : 'fail';
        var rmsg = reason === 'points' ? '포인트 부족' : (reason === 'prereq' ? '선행 노드 필요' : '학습 불가');
        UI.toast(scene, rmsg, { accent: rampInt('scarlet', 2) });
      }
    }

    // ── 로드아웃 탭 ──────────────────────────────────────────────────────────
    function buildLoadout() {
      var topY = 40;
      m.addText(0, topY, '액티브를 슬롯에 끼우세요 (탭하여 변경).', { fontSize: '13px', color: ramp('steel', 3) });
      // 해금된 액티브 풀
      var skillPool = (AB.SKILL_POOL || []).filter(function (id) { return kit.unlocked[id]; });
      var ultPool = (AB.ULT_POOL || []).filter(function (id) { return kit.unlocked[id]; });

      var slotDefs = [
        { key: 'skill1', name: '스킬 1', pool: skillPool },
        { key: 'skill2', name: '스킬 2', pool: skillPool },
        { key: 'ult', name: '궁극기', pool: ultPool }
      ];
      var sy = topY + 26;
      slotDefs.forEach(function (sd) {
        var curId = loadout[sd.key];
        var cur = curId ? BY_ID[curId] : null;
        var g = scene.add.graphics();
        g.fillStyle(rampInt('stone', 1), 0.5); g.fillRect(0, sy, cw, 40);
        g.lineStyle(2, rampInt('arcane', 2), 0.7); g.strokeRect(0, sy, cw, 40);
        m.body.add(g);
        m.body.add(scene.add.text(8, sy + 4, sd.name, { fontFamily: 'sans-serif', fontSize: '11px', color: ramp('arcane', 3) }));
        m.body.add(scene.add.text(8, sy + 19, cur ? cur.name : '— 비어 있음 —', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '15px', color: cur ? WHITE : ramp('steel', 2) }));
        sy += 48;
      });

      // 풀 목록(탭하면 현재 선택 슬롯에 장착) — 슬롯별로 칸 클릭 후 능력 선택하는 대신
      // 능력 칩에 [S1][S2][U] 작은 버튼 3개로 직접 지정
      var poolY = sy + 6;
      m.addText(0, poolY - 18, '해금된 능력', { fontSize: '13px', color: ramp('gold', 2) });
      var actives = (AB.SKILL_POOL || []).concat(AB.ULT_POOL || []).filter(function (id, i, arr) { return arr.indexOf(id) === i && kit.unlocked[id]; });
      if (!actives.length) { m.addText(6, poolY + 6, '아직 해금된 액티브가 없습니다. 트리에서 *해금* 노드를 배우세요.', { fontSize: '12px', color: ramp('steel', 2), wordWrap: { width: cw } }); return; }
      var listH = ch - poolY;
      m.addList({
        x: 0, y: poolY, w: cw, h: listH, rowH: 56, gap: 8, items: actives,
        renderRow: function (rc, id, idx, rowW, rowH) {
          var ab = BY_ID[id];
          if (!ab) return;
          var isUlt = ab.kind === 'ultimate';
          var g = scene.add.graphics();
          g.fillStyle(rampInt('stone', 1), 0.55); g.fillRect(0, 0, rowW, rowH);
          g.lineStyle(2, isUlt ? rampInt('gold', 2) : rampInt('arcane', 2), 0.85); g.strokeRect(0, 0, rowW, rowH);
          rc.add(g);
          rc.add(scene.add.text(10, 6, ab.name + (isUlt ? ' (궁극기)' : ''), { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '14px', color: isUlt ? ramp('gold', 2) : ramp('arcane', 3) }));
          rc.add(scene.add.text(10, 28, (ab.flavor || '').slice(0, 40), { fontFamily: 'sans-serif', fontSize: '11px', color: ramp('steel', 3), wordWrap: { width: rowW - 130 } }));
          // 장착 버튼
          if (isUlt) {
            var bu = UI.button(scene, rowW - 40, rowH / 2, 64, 38, loadout.ult === id ? '장착됨' : '궁', function () { setSlot('ult', id); }, { fontSize: '13px', fill: loadout.ult === id ? rampInt('gold', 1) : rampInt('steel', 0), stroke: rampInt('gold', 2) });
            rc.add(bu);
          } else {
            var b1 = UI.button(scene, rowW - 96, rowH / 2, 52, 38, loadout.skill1 === id ? 'S1✓' : 'S1', function () { setSlot('skill1', id); }, { fontSize: '12px', fill: loadout.skill1 === id ? rampInt('arcane', 1) : rampInt('steel', 0), stroke: rampInt('arcane', 2) });
            var b2 = UI.button(scene, rowW - 40, rowH / 2, 52, 38, loadout.skill2 === id ? 'S2✓' : 'S2', function () { setSlot('skill2', id); }, { fontSize: '12px', fill: loadout.skill2 === id ? rampInt('arcane', 1) : rampInt('steel', 0), stroke: rampInt('arcane', 2) });
            rc.add(b1); rc.add(b2);
          }
        }
      });
    }

    function setSlot(slot, id) {
      // 다른 스킬 슬롯에 이미 같은 능력이면 비움(중복 방지)
      if (slot === 'skill1' && loadout.skill2 === id) loadout.skill2 = null;
      if (slot === 'skill2' && loadout.skill1 === id) loadout.skill1 = null;
      loadout[slot] = (loadout[slot] === id) ? null : id;
      persist();
      var ab = BY_ID[id];
      UI.toast(scene, (ab ? ab.name : id) + (loadout[slot] === id ? ' 장착' : ' 해제'), { accent: rampInt('arcane', 2) });
      build();
    }

    build();
    return m;
  };
})();
