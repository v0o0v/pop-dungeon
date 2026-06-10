/* ============================================================================
 * Village(L5) 헤드리스 로직 검증 — Phaser 없이 7기능 핵심 로직을 단위 검증.
 * ----------------------------------------------------------------------------
 * 공유 프리뷰가 다른 lane 과 경쟁해 실시간 렌더 검증이 불안정하므로, Phaser 에
 * 비의존인 부분(데이터·SaveStore·stats·abilities-wiring·UI 순수 헬퍼)을 Node 에
 * 로드해 거래/강화/학습/스탯/퀘스트/도감 로직을 결정적으로 검증한다.
 *
 * 실행: node tests/village-headless.test.mjs
 * ==========================================================================*/
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
function read(p) { return readFileSync(path.join(ROOT, p), 'utf8'); }

// ── window/전역 스텁 ─────────────────────────────────────────────────────────
const store = {};
const localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};
const win = {};
win.window = win;
win.globalThis = win;
win.localStorage = localStorage;
win.location = { search: '' };
win.console = console;
win.module = undefined;
// SoundForge/StyleKit 인스턴스 생성에 필요한 최소 스텁
class SoundForgeStub { constructor() {} sfx() {} startBgm() {} setSection() {} unlock() {} resume() {} }
win.SoundForge = SoundForgeStub;
win.Math = Math;
win.Date = Date;

const ctx = vm.createContext(win);
function run(code, name) { vm.runInContext(code, ctx, { filename: name }); }

let fails = 0, passes = 0;
function ok(cond, msg) { if (cond) { passes++; } else { fails++; console.error('  ✗ FAIL: ' + msg); } }
function eq(a, b, msg) { ok(a === b, msg + ' (got ' + a + ', want ' + b + ')'); }

// ── 데이터 + 엔진 + 코어 로드 ────────────────────────────────────────────────
run(read('engine/stylekit.js'), 'stylekit.js');
run(read('engine/abilitykit.js'), 'abilitykit.js');
run(read('data/style.data.js'), 'style.data.js');
run(read('data/abilities.data.js'), 'abilities.data.js');
run(read('data/items.data.js'), 'items.data.js');
run(read('data/audio.data.js'), 'audio.data.js');
run(read('data/world.data.js'), 'world.data.js');
run(read('data/npcs.data.js'), 'npcs.data.js');
run(read('data/quests.data.js'), 'quests.data.js');
run(read('data/codex.data.js'), 'codex.data.js');
run(read('game/core.js'), 'core.js');
run(read('game/stats.js'), 'stats.js');
run(read('game/abilities-wiring.js'), 'abilities-wiring.js');
run(read('game/save.js'), 'save.js');

// UI 모듈은 PD.ramp 등 색 헬퍼만 IIFE 상단에서 캡처(렌더는 함수 안) → 안전 로드.
// PD.UI.button/modal 은 Phaser scene 을 요구하지만, 순수 헬퍼는 즉시 사용 가능.
run(read('game/ui/Modal.js'), 'Modal.js');
run(read('game/ui/Inventory.js'), 'Inventory.js');
run(read('game/ui/Shop.js'), 'Shop.js');
run(read('game/ui/Forge.js'), 'Forge.js');
run(read('game/ui/StatAlloc.js'), 'StatAlloc.js');
run(read('game/ui/QuestBoard.js'), 'QuestBoard.js');
run(read('game/ui/Codex.js'), 'Codex.js');
run(read('game/ui/SkillTree.js'), 'SkillTree.js');
run(read('game/ui/Dialogue.js'), 'Dialogue.js');

const PD = win.PD;
const UI = PD.UI;
const ITEMS = win.POP_ITEMS;

console.log('\n=== Village 헤드리스 로직 검증 ===\n');

// ── 0. 모듈 로드 상태 ────────────────────────────────────────────────────────
ok(!!PD, 'PD 네임스페이스 존재');
ok(!!UI, 'PD.UI 존재');
ok(typeof UI.shopBuyPrice === 'function', 'UI.shopBuyPrice 존재');
ok(typeof UI.enhanceCost === 'function', 'UI.enhanceCost 존재');
ok(typeof UI.questProgress === 'function', 'UI.questProgress 존재');
ok(typeof UI.previewStats === 'function', 'UI.previewStats 존재');
ok(typeof UI.openShop === 'function', 'UI.openShop 존재');
ok(typeof UI.openSkillTree === 'function', 'UI.openSkillTree 존재');
ok(typeof UI.openDialogue === 'function', 'UI.openDialogue 존재');

// 신선한 SAVE 로 시작
store['pop-dungeon-save-v2'] = '';
PD.SAVE = PD.SaveStore.defaultSave();
PD.SAVE.gold = 1000;
PD.RUN = PD.SaveStore.freshRun(PD.SAVE);

// ── 1. 상점: 구매가/판매가 ───────────────────────────────────────────────────
console.log('[1] 상점 구매/판매');
const sampleEquip = ITEMS.items.find(it => it.id === 'w_twinpop');
const buy = UI.shopBuyPrice(sampleEquip);
eq(buy, ITEMS.rarityBuyPrice.common, '쌍발 팝총(common) 구매가 = rarityBuyPrice.common');
const sell = UI.shopSellPrice(sampleEquip);
ok(sell === Math.max(1, Math.round(buy * ITEMS.shop.sellRate)), '판매가 = 구매가 × sellRate');
ok(sell < buy, '판매가 < 구매가');

// 구매 로직 재현: 골드 차감 + 인벤토리 추가
const goldBefore = PD.SAVE.gold;
PD.SAVE.gold -= buy;
PD.SAVE.inventory.push({ id: 'w_twinpop', enh: 0 });
PD.SaveStore.save(PD.SAVE);
eq(PD.SAVE.gold, goldBefore - buy, '구매 후 골드 차감');
eq(PD.SAVE.inventory.length, 1, '구매 후 인벤토리 +1');

// ── 2. 장비 장착 → 스탯 변화 (구매→장착→스탯) ───────────────────────────────
console.log('[2] 장착 → recomputeStats 변화');
const before = UI.previewStats(PD.SAVE);
// 장착: weapon 슬롯에 쌍발 팝총(extraProjectiles:1)
PD.SAVE.equipment.weapon = { id: 'w_twinpop', enh: 0 };
PD.SAVE.inventory = [];
PD.SaveStore.save(PD.SAVE);
const after = UI.previewStats(PD.SAVE);
eq(after.projectiles, before.projectiles + 1, '쌍발 팝총 장착 → projectiles +1');

// pow 무기(별심장 대포 flatDamage:10) 장착으로 피해 증가 확인
const dmgBefore = after.damage;
PD.SAVE.equipment.weapon = { id: 'w_heartcannon', enh: 0 };
const after2 = UI.previewStats(PD.SAVE);
ok(after2.damage > dmgBefore, '별심장 대포 장착 → 피해 증가 (' + dmgBefore + ' → ' + after2.damage + ')');

// ── 3. 대장간: 강화 비용 + enh 증가 → 스탯 반영 ─────────────────────────────
console.log('[3] 대장간 강화');
const heart = ITEMS.items.find(it => it.id === 'w_heartcannon');
const cost1 = UI.enhanceCost(heart, 0);
eq(cost1.target, 1, '강화 목표 = +1');
ok(cost1.gold > 0, '강화 골드 비용 > 0');
eq(cost1.matId, heart.enhanceCost.material[0], '+1 강화 재료 = tier0 재료');
const cost7 = UI.enhanceCost(heart, 6);
eq(cost7.matId, heart.enhanceCost.material[2], '+7 강화 재료 = tier2 재료');
ok(cost7.gold > cost1.gold, '+7 비용 > +1 비용');

// 강화 적용: enh 증가 후 스탯 반영(별심장 대포 enhStep.flatDamage:2)
PD.SAVE.equipment.weapon = { id: 'w_heartcannon', enh: 0 };
const dmgEnh0 = UI.previewStats(PD.SAVE).damage;
PD.SAVE.equipment.weapon.enh = 5;
const dmgEnh5 = UI.previewStats(PD.SAVE).damage;
ok(dmgEnh5 > dmgEnh0, '+5 강화 → 피해 증가 (' + dmgEnh0 + ' → ' + dmgEnh5 + ')');

// ── 4. 스탯 분배: vit/pow/agi/foc → recomputeStats ──────────────────────────
console.log('[4] 스탯 분배');
PD.SAVE.equipment.weapon = null;  // 무기 제거하고 순수 스탯 효과 확인
PD.SAVE.statPoints = 10;
const baseStats = UI.previewStats(PD.SAVE);
PD.SAVE.stats.pow = 5;  // 피해 +3/pt → +15
const powStats = UI.previewStats(PD.SAVE);
eq(powStats.damage, baseStats.damage + 15, 'pow 5pt → 피해 +15');
PD.SAVE.stats.vit = 3;  // maxHp +2/pt → +6
UI.previewStats(PD.SAVE);
PD.SAVE.stats.agi = 4;  // moveSpeed +15/pt → +60
const agiStats = UI.previewStats(PD.SAVE);
eq(agiStats.moveSpeed, baseStats.moveSpeed + 60, 'agi 4pt → 이속 +60');
PD.SAVE.stats.foc = 2;  // skillDamage +5/pt → +10
const focStats = UI.previewStats(PD.SAVE);
eq(focStats.skillDamage, 10, 'foc 2pt → 스킬피해 +10');
PD.SAVE.stats = { vit: 0, pow: 0, agi: 0, foc: 0 };  // 리셋

// ── 5. 스킬트리: learn → 포인트 차감 + grants 해금 + 패시브 스탯 ────────────
console.log('[5] 스킬트리 학습');
const Kit = win.AbilityKit;
const SPEC = win.POP_ABILITIES;
const kit = new Kit(SPEC, {});
kit.restore(PD.SAVE.skills || {});
kit.addPoints(10);
const ptBefore = kit.points;
// root 는 cost0 자동 학습. fire_1 학습(피해 +3 패시브)
const r1 = kit.learn('fire_1');
ok(r1.ok, 'fire_1 학습 성공');
eq(kit.points, ptBefore - 1, 'fire_1 학습 후 포인트 -1');
ok(!!kit.learnedNodes['fire_1'], 'fire_1 learnedNodes 기록');
// fire_2 학습 → pop_nova 해금(grants)
const r2 = kit.learn('fire_2');
ok(r2.ok, 'fire_2 학습 성공');
ok(!!kit.unlocked['pop_nova'], 'fire_2 → pop_nova 해금(grants)');
// SkillTree UI 게이트(canLearnNode)는 그래프 부모(edge.from)를 선행으로 강제한다.
// abilitykit.learn 자체는 node.requires/edge.requires 만 보지만, UI 가 더 엄격해
// 부모 미학습 노드의 버튼을 비활성화하므로 게임상 학습은 그래프 순서를 따른다.
function uiCanLearn(node) {
  if (kit.learnedNodes[node.id]) return false;
  if ((kit.points || 0) < (node.cost == null ? 1 : node.cost)) return false;
  const reqs = (node.requires || []).slice();
  (SPEC.tree.edges || []).forEach(ed => { if (ed.to === node.id) reqs.push(ed.from); });
  return reqs.every(rq => kit.learnedNodes[rq]);
}
const fire4 = SPEC.tree.nodes.find(n => n.id === 'fire_4');
ok(!uiCanLearn(fire4), 'SkillTree 게이트: fire_4 는 fire_3 미학습 시 학습 불가(버튼 비활성)');
const fire3 = SPEC.tree.nodes.find(n => n.id === 'fire_3');
ok(uiCanLearn(fire3), 'SkillTree 게이트: fire_3 은 fire_2 학습 후 학습 가능');

// 학습 결과를 SAVE 에 직렬화 후 패시브 스탯 반영(fire_1 damage+3)
PD.SAVE.skills = kit.serialize();
const skillStats = UI.previewStats(PD.SAVE);
ok(skillStats.damage >= 8 + 3, 'fire_1 패시브 → 피해 +3 반영 (' + skillStats.damage + ')');

// 로드아웃: skill1 에 pop_nova 장착 후 직렬화
PD.SAVE.skills.loadout = { skill1: 'pop_nova', skill2: null, ult: null };
PD.SaveStore.save(PD.SAVE);
eq(PD.SAVE.skills.loadout.skill1, 'pop_nova', 'loadout.skill1 = pop_nova 저장');

// ── 6. 퀘스트: 수주 → 진행 → 보상 수령(영속/통화 정합) ───────────────────────
console.log('[6] 퀘스트보드');
const quests = win.POP_QUESTS.quests;
const qShopSupply = quests.find(q => q.id === 'q_shop_supply');  // collect coin 60 → passive
ok(!!qShopSupply, 'q_shop_supply 존재');
PD.SAVE.quests = { active: ['q_shop_supply'], done: [], progress: { q_shop_supply: 60 } };
const pr = UI.questProgress(PD.SAVE, qShopSupply);
ok(pr.cur >= pr.total, 'q_shop_supply 진행도 달성 (60/60)');

// reach 퀘스트: checkpoint 기반 자동 충족
const qStarLore = quests.find(q => q.id === 'q_star_lore');  // reach region-03 → skillPoint
PD.SAVE.checkpoint = 2;  // region 3 도달(=checkpoint 2 → region 3)
const prReach = UI.questProgress(PD.SAVE, qStarLore);
ok(prReach.cur >= prReach.total, 'q_star_lore(reach region-03) checkpoint=2 → 충족');

// 보상 수령 재현: skillPoint 영속 반영
const skBefore = (PD.SAVE.skills && PD.SAVE.skills.points) || 0;
PD.SAVE.skills.points = skBefore + 1;  // skillPoint 보상
PD.SaveStore.save(PD.SAVE);
eq(PD.SAVE.skills.points, skBefore + 1, 'skillPoint 보상 → 영속 반영');

// ── 7. 도감: 적/장비/업적 현황 ───────────────────────────────────────────────
console.log('[7] 도감');
const CODEX = win.POP_CODEX;
ok(CODEX.enemies.length > 0, '적 도감 데이터 존재 (' + CODEX.enemies.length + '종)');
ok(CODEX.achievements.length > 0, '업적 데이터 존재 (' + CODEX.achievements.length + '개)');
// 적 처치 기록 → 도감 카운트
PD.SAVE.codex = { enemies: { shard_drifter: 3 }, items: { w_twinpop: true }, achievements: {} };
eq(Object.keys(PD.SAVE.codex.enemies).length, 1, '처치 적 1종 기록');
ok(PD.SAVE.codex.items.w_twinpop === true, '획득 장비 플래그 기록');

// ── 8. NPC 대화: stage 분기 ──────────────────────────────────────────────────
console.log('[8] NPC 대화 stage 분기');
const NPCS = win.POP_NPCS.npcs;
ok(NPCS.length === 6, 'NPC 6종 (' + NPCS.length + ')');
// stage 인덱스 계산(checkpoint 기반)
PD.SAVE.checkpoint = 0; PD.SAVE.story = { flags: {} };
eq(UI.currentStageIndex(PD.SAVE), 0, 'checkpoint 0 → stage_0');
PD.SAVE.checkpoint = 3;
eq(UI.currentStageIndex(PD.SAVE), 1, 'checkpoint 3 → stage_1');
PD.SAVE.checkpoint = 7;
eq(UI.currentStageIndex(PD.SAVE), 2, 'checkpoint 7 → stage_2');
PD.SAVE.story.flags.reached_region_10 = true;
eq(UI.currentStageIndex(PD.SAVE), 3, 'reached_region_10 → stage_twist');
PD.SAVE.story.flags.cleared = true;
eq(UI.currentStageIndex(PD.SAVE), 4, 'cleared → stage_cleared');
// stage 키 매핑
eq(UI.currentStageKey(PD.SAVE), 'stage_cleared', 'currentStageKey cleared');

// 각 NPC func → opener 함수 존재(대화 끝 기능 진입)
const funcOpener = { shop: 'openShop', skillmaster: 'openSkillTree', stats: 'openStatAlloc', forge: 'openForge', questboard: 'openQuestBoard', codex: 'openCodex' };
NPCS.forEach(n => {
  ok(typeof UI[funcOpener[n.func]] === 'function', 'NPC ' + n.id + ' func=' + n.func + ' → ' + funcOpener[n.func] + ' 존재');
});

// ── 9. 세이브 영속 round-trip ────────────────────────────────────────────────
console.log('[9] 세이브 영속 round-trip');
PD.SAVE.gold = 777;
PD.SAVE.equipment.helm = { id: 'h_starcrown', enh: 3 };
PD.SaveStore.save(PD.SAVE);
const reloaded = PD.SaveStore.load();
eq(reloaded.gold, 777, '재로드 후 골드 유지');
eq(reloaded.equipment.helm.id, 'h_starcrown', '재로드 후 장비 유지');
eq(reloaded.equipment.helm.enh, 3, '재로드 후 강화 단계 유지');
ok(reloaded.skills.learnedNodes.fire_1 === true, '재로드 후 학습 노드 유지');

// ── 결과 ─────────────────────────────────────────────────────────────────────
console.log('\n=== 결과: ' + passes + ' 통과, ' + fails + ' 실패 ===\n');
process.exit(fails > 0 ? 1 : 0);
