/* ============================================================================
 * 팡팡 던전 — 상점 (잡화점 아주머니) · 구매/판매
 * ----------------------------------------------------------------------------
 * 구매: rarityBuyPrice(등급별) × buyMarkup. 장비→SAVE.inventory(영속),
 *       소모품→SAVE.consumables(다음 런 휘발 반입 — items.persistence 정합).
 * 판매: 보유 장비를 구매가 × sellRate 로 되판다.
 *
 * 골드는 영속(SAVE.gold). 모든 거래는 SaveStore.save 로 즉시 기록.
 * 재고는 데이터 풀에서 등급 가중·진행도(checkpoint) 기반으로 결정적 구성
 * (PD.rand 시드 PRNG 사용 — 방문마다 같은 좌석엔 같은 물건이 일관되게).
 *
 * 공개: PD.UI.openShop(scene)
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = (window.PD = window.PD || {});
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt;
  var WHITE = PD.WHITE;
  var ITEMS = window.POP_ITEMS || {};
  var ITEM_BY_ID = PD.ITEM_BY_ID || {};
  var BUY_PRICE = ITEMS.rarityBuyPrice || { common: 30, rare: 80, epic: 180, legendary: 400 };
  var SHOP = ITEMS.shop || { buyMarkup: 1.0, sellRate: 0.4 };

  function buyPrice(item) {
    if (item.kind === 'consumable') return (item.cost || 6) * 4; // 소모품은 cost 기반 소액
    return Math.round((BUY_PRICE[item.rarity] || 30) * (SHOP.buyMarkup || 1));
  }
  function sellPrice(item) {
    return Math.max(1, Math.round(buyPrice(item) * (SHOP.sellRate || 0.4)));
  }
  PD.UI = PD.UI || {};
  PD.UI.shopBuyPrice = buyPrice;
  PD.UI.shopSellPrice = sellPrice;

  // 상점 재고 구성 — 진행도(checkpoint)에 맞는 풀에서 결정적으로 8종 + 소모품 3종
  function buildStock(save) {
    var region = Math.max(1, Math.min(10, (save.checkpoint || 0) + 1));
    var table = (ITEMS.dropTables || []).filter(function (t) { return t.region <= region; });
    var pool = {};
    table.forEach(function (t) { (t.equipmentPool || []).forEach(function (id) { pool[id] = true; }); });
    var ids = Object.keys(pool).filter(function (id) { var it = ITEM_BY_ID[id]; return it && it.slot; }); // 6슬롯 장비만
    // 결정적 셔플(시드 PRNG) — 방문 동안 일관
    PD.setSeed(0x5011 + region * 131 + (save.runs || 0) * 17);
    ids = ids.slice().sort(function () { return PD.rand() - 0.5; });
    var equip = ids.slice(0, 8).map(function (id) { return { id: id, enh: 0 }; });
    var consum = ['c_poppotion', 'c_megapotion', 'c_energydrink'].filter(function (id) { return ITEM_BY_ID[id]; }).map(function (id) { return { id: id }; });
    return { equip: equip, consum: consum };
  }

  PD.UI.openShop = function (scene) {
    var UI = PD.UI;
    var SAVE = PD.SAVE;
    var stock = buildStock(SAVE);
    var tab = 'buy';

    var m = UI.modal(scene, { title: '잡화점', subtitle: UI.fmtGold(SAVE.gold), w: PD.DESIGN_W - 28, h: PD.DESIGN_H - 150, accent: rampInt('gold', 2) });
    var cw = m.contentRect.w;

    function setTab(t) { tab = t; build(); }

    function build() {
      m.body.removeAll(true);
      m.setSubtitle(UI.fmtGold(PD.SAVE.gold));
      // 인사말(서사) — 잡화점 아주머니 stage_0 보이스
      m.addText(0, 0, '"뭐 살 거여? 깊은 데 가려면 물약은 챙겨야지."', { fontSize: '13px', color: ramp('steel', 2), fontStyle: 'italic' });
      // 탭
      var tw = (cw - 10) / 2;
      m.addButton(tw / 2, 38, tw, 34, '구매', function () { setTab('buy'); }, { fontSize: '16px', fill: tab === 'buy' ? rampInt('gold', 1) : rampInt('steel', 0), stroke: rampInt('gold', 2) });
      m.addButton(tw + 10 + tw / 2, 38, tw, 34, '판매', function () { setTab('sell'); }, { fontSize: '16px', fill: tab === 'sell' ? rampInt('gold', 1) : rampInt('steel', 0), stroke: rampInt('gold', 2) });

      var listY = 64;
      var listH = m.contentRect.h - listY;
      if (tab === 'buy') buildBuy(listY, listH);
      else buildSell(listY, listH);
    }

    function buildBuy(listY, listH) {
      var rows = stock.equip.concat(stock.consum);
      m.addList({
        x: 0, y: listY, w: cw, h: listH, rowH: 58, gap: 8, items: rows,
        renderRow: function (rc, entry, idx, rowW, rowH) {
          var item = ITEM_BY_ID[entry.id];
          if (!item) return;
          var price = buyPrice(item);
          var owned = entry._bought;
          var g = scene.add.graphics();
          g.fillStyle(rampInt('stone', 1), 0.55); g.fillRect(0, 0, rowW, rowH);
          g.lineStyle(2, UI.rarityInt(item.rarity), 0.85); g.strokeRect(0, 0, rowW, rowH);
          rc.add(g);
          rc.add(scene.add.text(12, 8, item.name, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '15px', color: UI.rarityColor(item.rarity) }));
          var sub = (item.slot ? UI.SLOT_NAME[item.slot] + ' · ' : '소모품 · ') + UI.effectSummary(item, 0);
          rc.add(scene.add.text(12, 30, sub, { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 3), wordWrap: { width: rowW - 120 } }));
          var canAfford = PD.SAVE.gold >= price && !owned;
          var b = UI.button(scene, rowW - 56, rowH / 2, 92, 40, owned ? '구매됨' : (UI.fmtGold(price)), function () { buy(entry, item, price); }, {
            fontSize: '14px', fill: rampInt('gold', 1), stroke: rampInt('gold', 2), disabled: !canAfford
          });
          rc.add(b);
        }
      });
    }

    function buildSell(listY, listH) {
      var inv = (PD.SAVE.inventory || []).slice();
      if (!inv.length) { m.addText(6, listY + 8, '되팔 장비가 없습니다.', { fontSize: '13px', color: ramp('steel', 2) }); return; }
      m.addList({
        x: 0, y: listY, w: cw, h: listH, rowH: 58, gap: 8, items: inv,
        renderRow: function (rc, entry, idx, rowW, rowH) {
          var item = ITEM_BY_ID[entry.id];
          if (!item) return;
          var price = sellPrice(item);
          var g = scene.add.graphics();
          g.fillStyle(rampInt('stone', 1), 0.55); g.fillRect(0, 0, rowW, rowH);
          g.lineStyle(2, UI.rarityInt(item.rarity), 0.7); g.strokeRect(0, 0, rowW, rowH);
          rc.add(g);
          rc.add(scene.add.text(12, 8, item.name + (entry.enh ? ' +' + entry.enh : ''), { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '15px', color: UI.rarityColor(item.rarity) }));
          rc.add(scene.add.text(12, 30, UI.SLOT_NAME[item.slot] + ' · ' + UI.effectSummary(item, entry.enh || 0), { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 3), wordWrap: { width: rowW - 120 } }));
          var b = UI.button(scene, rowW - 56, rowH / 2, 92, 40, UI.fmtGold(price), function () { sell(entry, idx, item, price); }, {
            fontSize: '14px', fill: rampInt('scarlet', 1), stroke: rampInt('scarlet', 2)
          });
          rc.add(b);
        }
      });
    }

    function buy(entry, item, price) {
      var SAVE = PD.SAVE;
      if (SAVE.gold < price || entry._bought) return;
      SAVE.gold -= price;
      if (item.kind === 'consumable') {
        SAVE.consumables = SAVE.consumables || {};
        SAVE.consumables[item.id] = (SAVE.consumables[item.id] || 0) + 1;
      } else {
        SAVE.inventory.push({ id: item.id, enh: 0 });
        entry._bought = true;  // 장비는 좌석당 1회
      }
      // gold:spent 퀘스트 진척
      bumpQuest('gold:spent', price);
      PD.SaveStore.save(SAVE);
      UI.toast(scene, item.name + ' 구매!', { accent: rampInt('gold', 2) });
      build();
    }
    function sell(entry, idx, item, price) {
      var SAVE = PD.SAVE;
      SAVE.inventory.splice(idx, 1);
      SAVE.gold += price;
      PD.SaveStore.save(SAVE);
      UI.toast(scene, item.name + ' 판매 (+' + price + ')', { accent: rampInt('gold', 2) });
      build();
    }

    function bumpQuest(target, amount) {
      // 마을에서 발생하는 collect 진척(gold:spent 등)을 SAVE.quests.progress 에 직접 반영
      try {
        var prog = (PD.SAVE.quests.progress = PD.SAVE.quests.progress || {});
        (window.POP_QUESTS.quests || []).forEach(function (q) {
          if (q.objective && q.objective.type === 'collect' && q.objective.target === target) {
            prog[q.id] = (prog[q.id] || 0) + amount;
          }
        });
      } catch (e) {}
    }

    build();
    return m;
  };
})();
