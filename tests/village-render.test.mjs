/* ============================================================================
 * Village(L5) 렌더 harness — Phaser scene 을 mock 으로 대체해 Village.create 와
 * 7기능 모달 open* 가 throw 없이 완주하고 기대 객체를 생성하는지 검증한다.
 * ----------------------------------------------------------------------------
 * 공유 프리뷰가 다른 lane 과 동일 브라우저 탭을 공유해 실시간 렌더 검증이
 * 불안정하므로, Phaser API 표면을 집계 mock 으로 갈음해 씬 빌드 경로를 결정적으로
 * 실행한다. (WebGL 픽셀까지는 검증 못 하지만, 씬 그래프 생성·콜백 배선·모달
 * 빌드 경로의 런타임 에러 0 을 보장한다.)
 *
 * 실행: node tests/village-render.test.mjs
 * ==========================================================================*/
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');

// ── 집계 카운터 ──────────────────────────────────────────────────────────────
const counts = { graphics: 0, text: 0, sprite: 0, zone: 0, container: 0, tween: 0, image: 0, interactiveZones: 0 };

// ── Phaser mock ──────────────────────────────────────────────────────────────
function mkDisplay(extra) {
  const o = Object.assign({
    x: 0, y: 0, input: null,
    setOrigin() { return o; }, setScale() { return o; }, setDepth() { return o; },
    setInteractive(hit) { o.input = { enabled: true, hitArea: hit }; if (o._isZone) counts.interactiveZones++; return o; },
    disableInteractive() { o.input = null; return o; },
    setText(t) { o.text = t; return o; }, setTint() { return o; }, setAngle() { return o; },
    setSize() { return o; }, setShadow() { return o; }, setAlpha() { return o; },
    on() { return o; }, once() { return o; }, removeAll() { return o; }, add() { return o; },
    destroy() { return o; }, play() { return o; }, setStrokeStyle() { return o; }
  }, extra || {});
  return o;
}
function mkGraphics() {
  counts.graphics++;
  const g = mkDisplay({ type: 'Graphics' });
  ['fillStyle','fillRect','fillCircle','fillTriangle','lineStyle','strokeRect','strokeTriangle','lineBetween','clear','beginPath','strokePath','moveTo','lineTo','closePath','fillPath','strokeCircle'].forEach(m => g[m] = () => g);
  return g;
}
function makeScene(key) {
  const textures = {};
  const scene = {};
  scene.sys = { settings: { key } };
  scene.children = { list: [] };
  scene.cameras = { main: { setBackgroundColor() {}, shake() {}, flash() {}, fade() {} } };
  scene.textures = {
    exists: (k) => !!textures[k],
    remove: (k) => { delete textures[k]; },
    addCanvas: (k) => { textures[k] = { add() {} }; return textures[k]; },
    get: (k) => textures[k]
  };
  scene.tweens = { add() { counts.tween++; return mkDisplay(); } };
  scene.time = { delayedCall(d, fn) { /* 즉시 실행 안 함(렌더 후 비동기) */ return { remove() {} }; } };
  scene.make = { graphics() { const g = mkGraphics(); g.createGeometryMask = () => ({ destroy() {} }); return g; } };
  scene.input = { on() {}, once() {}, off() {}, keyboard: { on() {}, once() {} } };
  scene.scene = {
    get: (k) => (k === 'WorldMap' || k === 'Village' || k === 'Dungeon' || k === 'HUD' || k === 'Game') ? makeScene(k) : null,
    start() {}, launch() {}, stop() {}, pause() {}, resume() {}, isActive() { return false; }
  };
  scene.add = {
    graphics: () => { const g = mkGraphics(); scene.children.list.push(g); return g; },
    text: (x, y, t) => { counts.text++; const o = mkDisplay({ type: 'Text', text: t, x, y }); scene.children.list.push(o); return o; },
    sprite: (x, y, k) => { counts.sprite++; const o = mkDisplay({ type: 'Sprite', x, y, texture: { key: k } }); scene.children.list.push(o); return o; },
    image: (x, y, k) => { counts.image++; const o = mkDisplay({ type: 'Image', x, y }); scene.children.list.push(o); return o; },
    zone: (x, y, w, h) => { counts.zone++; const o = mkDisplay({ type: 'Zone', x, y, _isZone: true }); scene.children.list.push(o); return o; },
    container: (x, y) => { counts.container++; const o = mkDisplay({ type: 'Container', x: x || 0, y: y || 0, list: [] }); o.add = (c) => { if (Array.isArray(c)) o.list.push.apply(o.list, c); else o.list.push(c); return o; }; o.removeAll = () => { o.list = []; return o; }; o.setMask = () => o; scene.children.list.push(o); return o; },
    existing() {}
  };
  return scene;
}

// ── window 스텁 + Phaser 스텁 ────────────────────────────────────────────────
const store = {};
const win = {};
win.window = win; win.globalThis = win; win.console = console; win.Math = Math; win.Date = Date;
win.localStorage = { getItem: k => k in store ? store[k] : null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
win.location = { search: '?village=1' };
win.SoundForge = class { constructor() {} sfx() {} startBgm() {} setSection() {} unlock() {} resume() {} };
win.setTimeout = (fn) => 0; win.clearTimeout = () => {};
win.document = { createElement: () => ({ getContext: () => mkCtx(), width: 0, height: 0 }) };
function mkCtx() {
  return new Proxy({}, { get: (t, p) => { if (p === 'fillStyle' || p === 'imageSmoothingEnabled' || p === 'imageSmoothingQuality') return ''; return () => {}; }, set: () => true });
}
// VectorForge.bake 가 document.createElement('canvas') 를 쓰므로 위 document 스텁으로 동작.
// Phaser.Class / Phaser.Scene / Phaser.Geom 스텁
const Phaser = {
  Class: function (def) {
    function C() { if (def.initialize) def.initialize.apply(this, arguments); }
    Object.keys(def).forEach(k => { if (k !== 'initialize' && k !== 'Extends') C.prototype[k] = def[k]; });
    return C;
  },
  Scene: function () {},
  Geom: { Rectangle: function (x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }, },
};
Phaser.Geom.Rectangle.Contains = () => true;
win.Phaser = Phaser;

const ctx = vm.createContext(win);
const run = (code, name) => vm.runInContext(code, ctx, { filename: name });

// ── 로드 ─────────────────────────────────────────────────────────────────────
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.error('  ✗ ' + m); } };

try {
  run(read('engine/stylekit.js'), 'stylekit.js');
  run(read('engine/abilitykit.js'), 'abilitykit.js');
  run(read('engine/vectorforge.js'), 'vectorforge.js');
  run(read('data/style.data.js'), 's'); run(read('data/abilities.data.js'), 'a');
  run(read('data/items.data.js'), 'i'); run(read('data/audio.data.js'), 'au');
  run(read('data/world.data.js'), 'w'); run(read('data/npcs.data.js'), 'n');
  run(read('data/quests.data.js'), 'q'); run(read('data/codex.data.js'), 'c');
  run(read('game/core.js'), 'core.js');
  run(read('game/stats.js'), 'stats.js');
  run(read('game/abilities-wiring.js'), 'aw');
  run(read('game/save.js'), 'save.js');
  ['Modal','Inventory','Shop','Forge','SkillTree','StatAlloc','QuestBoard','Codex','Dialogue'].forEach(m => run(read('game/ui/' + m + '.js'), m));
  run(read('game/scenes/Village.js'), 'Village.js');
} catch (e) {
  console.error('로드 단계 에러:', e.stack);
  process.exit(1);
}

const PD = win.PD;
console.log('\n=== Village 렌더 harness 검증 ===\n');

ok(!!PD.scenes.Village, 'Village 씬 클래스 등록');
ok(PD.SCENES.VILLAGE === 'Village', 'PD.SCENES.VILLAGE 상수');

// SAVE 준비(장비·골드·스킬 포인트 보유 상태로 풍부한 렌더 경로 커버)
store['pop-dungeon-save-v2'] = '';
PD.SAVE = PD.SaveStore.defaultSave();
PD.SAVE.gold = 500;
PD.SAVE.statPoints = 5;
PD.SAVE.skills.points = 8;
PD.SAVE.inventory = [{ id: 'w_twinpop', enh: 0 }, { id: 'h_starcrown', enh: 2 }];
PD.SAVE.equipment.weapon = { id: 'w_longpip', enh: 1 };
PD.SAVE.materials = { mat_starshard: 5, mat_brightore: 2 };
PD.SAVE.quests = { active: ['q_shop_supply'], done: [], progress: { q_shop_supply: 60 } };

// ── Village.create 실행 ──────────────────────────────────────────────────────
console.log('[A] Village.create 완주');
const vscene = makeScene('Village');
Object.setPrototypeOf(vscene, PD.scenes.Village.prototype);
let createErr = null;
try { PD.scenes.Village.prototype.create.call(vscene); }
catch (e) { createErr = e; }
ok(!createErr, 'Village.create throw 없음' + (createErr ? ': ' + createErr.message : ''));
ok(counts.sprite >= 6, 'NPC 스프라이트 6+ 생성 (' + counts.sprite + ')');
ok(counts.interactiveZones >= 6, 'NPC 터치 존 6+ 인터랙티브 (' + counts.interactiveZones + ')');
ok(counts.text >= 10, '텍스트 객체 다수 생성 (' + counts.text + ')');
ok(PD.currentScene === 'Village', 'PD.currentScene = Village 설정');
// NPC 텍스처 베이크 확인
const npcTex = ['v_npc_elder','v_npc_shop','v_npc_star','v_npc_smith','v_npc_merchant','v_npc_twins'];
ok(npcTex.every(k => vscene.textures.exists(k)), 'NPC 텍스처 6종 베이크');

// ── 각 모달 open* 가 throw 없이 빌드되는지 ──────────────────────────────────
console.log('[B] 7기능 모달 빌드');
const mscene = makeScene('Village');
function tryOpen(fn, name) {
  let err = null;
  try { PD.UI[fn](mscene); } catch (e) { err = e; }
  ok(!err, name + ' 모달 빌드 throw 없음' + (err ? ': ' + err.message + '\n' + (err.stack||'').split('\n').slice(0,3).join('\n') : ''));
}
tryOpen('openInventory', '인벤토리');
tryOpen('openShop', '상점');
tryOpen('openForge', '대장간');
tryOpen('openStatAlloc', '스탯분배');
tryOpen('openQuestBoard', '퀘스트보드');
tryOpen('openCodex', '도감');
tryOpen('openSkillTree', '스킬트리');

// NPC 대화 → 각 NPC
console.log('[C] NPC 대화 빌드 (6종)');
['elder','shopkeeper','stargazer','blacksmith','merchant','twins'].forEach(id => {
  let err = null;
  try { PD.UI.openDialogue(mscene, id); } catch (e) { err = e; }
  ok(!err, 'openDialogue(' + id + ') throw 없음' + (err ? ': ' + err.message : ''));
});

// ── 출정 → goSortie 가 throw 없이 동작(폴백 포함) ───────────────────────────
console.log('[D] 출정(goSortie)');
let sortieErr = null;
try { PD.scenes.Village.prototype.goSortie.call(vscene); } catch (e) { sortieErr = e; }
ok(!sortieErr, 'goSortie throw 없음' + (sortieErr ? ': ' + sortieErr.message : ''));
ok(PD.RUN && PD.RUN.floor === 1, 'goSortie → 새 RUN(floor=1) 준비');

console.log('\n=== 결과: ' + passes + ' 통과, ' + fails + ' 실패 ===');
console.log('   (생성 카운트: ' + JSON.stringify(counts) + ')\n');
process.exit(fails > 0 ? 1 : 0);
