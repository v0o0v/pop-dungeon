/**
 * tests/save.test.mjs — SaveStore v2 단위 테스트
 *
 * 의존성: Node 내장 assert 만 사용. 브라우저/Phaser 없음.
 * localStorage 는 간단한 인메모리 맵으로 모킹.
 * 실행: node tests/save.test.mjs
 *
 * 수용 기준 (AC#6):
 *   1. 죽음 → 귀환 → 재출정 시 영속(장비·스킬·골드·체크포인트·도감·퀘스트) 100% 유지
 *   2. 런 휘발 아이템 사망 후 0 잔존
 *   3. goldRecovery 정책 검증 (전액 회수)
 *   4. v1 메타 마이그레이션
 *   5. recomputeStats 5개 소스 합산 순서·가/곱 결합
 */

import assert from 'node:assert/strict';

// ── localStorage 모킹 ────────────────────────────────────────────────────────
const _store = {};
const localStorage = {
  getItem:    (k)    => _store[k] ?? null,
  setItem:    (k, v) => { _store[k] = String(v); },
  removeItem: (k)    => { delete _store[k]; }
};
function clearStore() { Object.keys(_store).forEach(k => delete _store[k]); }

// ── 브라우저 전역 심기 ────────────────────────────────────────────────────────
const window    = globalThis;
globalThis.localStorage = localStorage;

// POP_ITEMS 최소 스텁
globalThis.POP_ITEMS = {
  rarities: [],
  items: [
    {
      id: 'twin_pop', kind: 'equipment', rarity: 'common',
      effect: { extraProjectiles: 1, spreadAngle: 8 }
    },
    {
      id: 'glass_charm', kind: 'equipment', rarity: 'epic',
      effect: { damageMult: 1.4, maxHp: -1 }
    },
    {
      id: 'energy_core', kind: 'equipment', rarity: 'rare',
      effect: { energyRegen: 4, energyMax: 25 }
    },
    {
      id: 'skill_charm', kind: 'equipment', rarity: 'epic',
      effect: { skillDamage: 18 }
    },
    // 강화 보정 있는 무기
    {
      id: 'test_sword', kind: 'equipment', slot: 'weapon', rarity: 'rare',
      effect: { flatDamage: 5 },
      enhStep: { flatDamage: 1 }
    },
    // 런 휘발 아이템
    {
      id: 'run_relic_01', kind: 'run_relic', rarity: 'common',
      effect: { flatDamage: 3 }
    }
  ],
  sets: [
    { id: 'skill', threshold: 2, members: ['energy_core', 'skill_charm'] }
  ],
  balanceConfig: { multCap: 2 }
};

// PD 네임스페이스 초기화 + ITEM_BY_ID 구성
globalThis.PD = { scenes: {} };
PD.ITEM_BY_ID = {};
POP_ITEMS.items.forEach(it => { PD.ITEM_BY_ID[it.id] = it; });
PD.DROP_POOL = POP_ITEMS.items.filter(it => it.kind === 'equipment' || it.kind === 'consumable');

// PRNG 스텁
PD.setSeed = function(n) { return n; };

// ── save.js / stats.js 동적 로드 ─────────────────────────────────────────────
// 파일은 IIFE(즉시 실행 함수) 형태 — readFileSync + eval 로 실행
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join }  from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadModule(relPath) {
  const src = readFileSync(join(ROOT, relPath), 'utf8');
  // 파일 전역이 window를 참조하므로 globalThis 에서 실행
  eval(src);  // eslint-disable-line no-eval
}

loadModule('game/save.js');
loadModule('game/stats.js');

// ── 헬퍼 ────────────────────────────────────────────────────────────────────
function freshSave(overrides) {
  const base = PD.SaveStore.defaultSave();
  return Object.assign(base, overrides || {});
}

function makeSave(overrides) {
  const s = freshSave(overrides);
  PD.SAVE = s;
  PD.SaveStore.save(s);
  return s;
}

// ── 테스트 1: goldRecovery — 전액 회수 정책 ─────────────────────────────────
{
  assert.equal(PD.goldRecovery(100),  100,  'goldRecovery(100) === 100');
  assert.equal(PD.goldRecovery(0),      0,  'goldRecovery(0) === 0');
  assert.equal(PD.goldRecovery(-5),     0,  'goldRecovery(-5) === 0 (음수 무시)');
  assert.equal(PD.goldRecovery(null),   0,  'goldRecovery(null) === 0');
  console.log('PASS 1: goldRecovery 전액 회수 정책');
}

// ── 테스트 2: commitRun — 죽음 후 영속 필드 유지 ────────────────────────────
{
  clearStore();
  const save = makeSave({
    gold: 50,
    equipment: { weapon: { id: 'test_sword', enh: 2 }, helm: null, armor: null, boots: null, amulet: null, ring: null },
    skills: { learnedNodes: { node_01: true }, unlocked: {}, points: 3, loadout: { skill1: 'pop_nova', skill2: null, ult: null } },
    stats: { vit: 1, pow: 2, agi: 0, foc: 0 },
    statPoints: 0,
    checkpoint: 2,
    codex: { enemies: {}, items: {}, achievements: {} },
    quests: { active: ['q1'], done: [], progress: { q1: 5 } },
    story: { flags: { intro_done: true } }
  });

  const run = {
    region: 2, floor: 5, roomId: 'r3',
    hp: 0, maxHp: 4,
    runGold: 120,
    kills: 10,
    runItems: ['twin_pop', 'run_relic_01'],
    runStats: {},
    visited: { r1: true, r2: true, r3: true },
    cleared: { r1: true, r2: true },
    codexSeen: { enemies: { goblin: 3 }, items: { twin_pop: true } },
    questProgress: { q1: 2 },
    storyFlags: { stage1_cleared: true }
  };

  const committed = PD.SaveStore.commitRun(run, save, 'death');

  // 골드: 50 + 120(전액) = 170
  assert.equal(committed.gold, 170, '골드 전액 귀환');
  // 장비 영속 유지
  assert.deepEqual(committed.equipment.weapon, { id: 'test_sword', enh: 2 }, '장비 유지');
  // 스킬 영속 유지
  assert.equal(committed.skills.learnedNodes.node_01, true, '스킬트리 유지');
  assert.equal(committed.skills.points, 3, '스킬 포인트 유지');
  // 체크포인트: max(2, 2) = 2 (런 region=2, 기존 checkpoint=2)
  assert.equal(committed.checkpoint, 2, '체크포인트 유지');
  // 도감 병합
  assert.equal(committed.codex.enemies.goblin, 3, '도감 enemy 병합');
  assert.equal(committed.codex.items.twin_pop, true, '도감 item 병합');
  // 퀘스트 진행 병합
  assert.equal(committed.quests.progress.q1, 7, '퀘스트 progress 병합(5+2)');
  // 스토리 플래그 병합
  assert.equal(committed.story.flags.intro_done, true, '기존 스토리 플래그 유지');
  assert.equal(committed.story.flags.stage1_cleared, true, '신규 스토리 플래그 병합');
  // runs 카운터 증가
  assert.equal(committed.runs, 1, '런 횟수 +1');
  // wins: death 이므로 변동 없음
  assert.equal(committed.wins || 0, 0, 'death 시 wins 미증가');

  console.log('PASS 2: commitRun(death) — 영속 필드 100% 유지');
}

// ── 테스트 3: freshRun — 런 휘발 아이템 0 잔존 ──────────────────────────────
{
  clearStore();
  const save = makeSave({ checkpoint: 1, gold: 200 });

  // 런 진행 시뮬: 아이템 줍기
  const run = PD.SaveStore.freshRun(save);
  run.runItems.push('twin_pop');
  run.runItems.push('run_relic_01');
  run.runGold = 80;

  // 사망 처리 — commitRun
  PD.SaveStore.commitRun(run, save, 'death');

  // 새 런 시작 — freshRun 으로 초기화
  const newRun = PD.SaveStore.freshRun(save);
  assert.equal(newRun.runItems.length, 0, '새 런에서 runItems 완전 초기화(휘발 0 잔존)');
  assert.equal(newRun.runGold, 0, 'runGold 초기화');
  assert.equal(newRun.runStats && Object.keys(newRun.runStats).length, 0, 'runStats 빈 객체로 초기화');
  // 영속 골드는 save 에 유지
  assert.equal(save.gold, 280, '사망 후 gold에 runGold 전액 귀환(200+80)');

  console.log('PASS 3: freshRun — 런 휘발 0 잔존, 영속 골드 유지');
}

// ── 테스트 4: v1 메타 마이그레이션 ──────────────────────────────────────────
{
  clearStore();
  // v1 메타 심기
  localStorage.setItem('pop-dungeon-meta-v1', JSON.stringify({
    bestFloor: 42, wins: 3, coins: 500, runs: 10
  }));
  // v2 없는 상태에서 load
  const s = PD.SaveStore.load();
  assert.equal(s.bestFloor, 42, 'v1 bestFloor 마이그레이션');
  assert.equal(s.wins,       3, 'v1 wins 마이그레이션');
  assert.equal(s.gold,     500, 'v1 coins → gold 마이그레이션');
  assert.equal(s.runs,      10, 'v1 runs 마이그레이션');
  assert.equal(s.version,    2, 'version=2 로 승격');

  console.log('PASS 4: v1 메타 마이그레이션');
}

// ── 테스트 5: recomputeStats — 소스 [1] 베이스만 ────────────────────────────
{
  clearStore();
  const save = freshSave();
  const run  = { runItems: [], items: [], runStats: {}, stats: {} };

  PD.SAVE = save;
  PD.RUN  = run;
  PD.recomputeStats(save, run);

  const s = run.runStats;
  assert.equal(s.damage,     8,     '[1] 베이스 damage=8');
  assert.equal(s.fireDelay,  0.36,  '[1] 베이스 fireDelay=0.36');
  assert.equal(s.moveSpeed,  188,   '[1] 베이스 moveSpeed=188');
  assert.equal(s.projectiles, 1,    '[1] 베이스 projectiles=1');
  assert.equal(run.maxHp,    4,     '[1] 베이스 maxHp=4');

  console.log('PASS 5: recomputeStats 베이스 스탯');
}

// ── 테스트 6: recomputeStats — 소스 [2] 영속 장비 + 강화 ────────────────────
{
  clearStore();
  const save = freshSave({
    equipment: {
      weapon: { id: 'test_sword', enh: 3 },  // effect.flatDamage=5, enhStep.flatDamage=1 × 3 = +3
      helm: null, armor: null, boots: null, amulet: null, ring: null
    }
  });
  const run = { runItems: [], items: [], runStats: {}, stats: {} };
  PD.recomputeStats(save, run);

  // damage = (8 + 5 + 3) * 1 = 16
  assert.equal(run.runStats.damage, 16, '[2] 장비 flatDamage + 강화 보정 합산');
  console.log('PASS 6: recomputeStats 영속 장비 + 강화');
}

// ── 테스트 7: recomputeStats — 소스 [3] 마을 스탯 분배 ─────────────────────
{
  clearStore();
  const save = freshSave({
    stats: { vit: 2, pow: 3, agi: 1, foc: 2 }
    // vit×2 → maxHpBonus +4, pow×3 → flatDamage +9, agi×1 → moveSpeed +15, foc×2 → skillDamage +10
  });
  const run = { runItems: [], items: [], runStats: {}, stats: {} };
  PD.recomputeStats(save, run);

  // damage = (8 + 9) * 1 = 17
  assert.equal(run.runStats.damage,     17,  '[3] pow 스탯 → flatDamage 반영');
  assert.equal(run.runStats.moveSpeed,  203, '[3] agi 스탯 → moveSpeed 반영(188+15)');
  assert.equal(run.runStats.skillDamage, 10, '[3] foc 스탯 → skillDamage 반영');
  assert.equal(run.maxHp,                8,  '[3] vit 스탯 → maxHp 반영(4+4)');

  console.log('PASS 7: recomputeStats 마을 스탯 분배');
}

// ── 테스트 8: recomputeStats — 소스 [5] 런 휘발 아이템 + multCap ────────────
{
  clearStore();
  const save = freshSave();
  const run = {
    runItems: ['glass_charm'],  // damageMult: 1.4, maxHp: -1
    items: ['glass_charm'],
    runStats: {}, stats: {}
  };
  PD.recomputeStats(save, run);

  // damage = (8 + 0) * min(1.4, 2) = 11.2
  assert.equal(run.runStats.damage, 8 * 1.4, '[5] 런 휘발 damageMult 적용');
  // maxHp = max(1, 4 + (-1)) = 3
  assert.equal(run.maxHp, 3, '[5] 런 휘발 maxHp -1 반영');
  console.log('PASS 8: recomputeStats 런 휘발 아이템 + damageMult');
}

// ── 테스트 9: recomputeStats — multCap=2 상한 ───────────────────────────────
{
  clearStore();
  const save = freshSave();
  // glass_charm(×1.4) 두 번 합산하면 1.4×1.4=1.96 — 여전히 2 미만이므로 그대로
  // 극단 케이스: 수동으로 multCap 초과 상황 시뮬
  // PD._stats.applyEffect 직접 호출로 검증
  const flat = {}, mult = {};
  PD._stats.applyEffect(flat, mult, { damageMult: 1.5 });
  PD._stats.applyEffect(flat, mult, { damageMult: 1.5 });
  // mult.damageMult = 1.5 * 1.5 = 2.25 > multCap=2
  assert.equal(mult.damageMult, 2.25, '곱산 누적 2.25');
  // 최종 적용 시 min(2.25, 2) = 2
  const save2 = freshSave();
  const run2  = { runItems: [], items: [], runStats: {}, stats: {} };
  // 직접 ITEM_BY_ID에 합성 아이템 등록
  PD.ITEM_BY_ID['_dmg_test_a'] = { id: '_dmg_test_a', effect: { damageMult: 1.5 } };
  PD.ITEM_BY_ID['_dmg_test_b'] = { id: '_dmg_test_b', effect: { damageMult: 1.5 } };
  run2.runItems = ['_dmg_test_a', '_dmg_test_b'];
  run2.items    = run2.runItems;
  PD.recomputeStats(save2, run2);
  // damage = (8) * min(2.25, 2) = 8 * 2 = 16
  assert.equal(run2.runStats.damage, 16, 'multCap=2 상한 적용 (8*2)');
  // 정리
  delete PD.ITEM_BY_ID['_dmg_test_a'];
  delete PD.ITEM_BY_ID['_dmg_test_b'];
  console.log('PASS 9: multCap=2 상한 준수');
}

// ── 테스트 10: recomputeStats — 세트 보너스 ─────────────────────────────────
{
  clearStore();
  const save = freshSave();
  const run  = {
    runItems: ['energy_core', 'skill_charm'],
    items:    ['energy_core', 'skill_charm'],
    runStats: {}, stats: {}
  };
  PD.recomputeStats(save, run);

  // energy_core: energyRegen+4, energyMax+25
  // skill_charm: skillDamage+18
  // 세트 보너스(skill): skillDamage+10, energyRegen+2
  assert.equal(run.runStats.skillDamage, 28,  '세트 보너스 skillDamage(18+10)');
  assert.equal(run.runStats.energyRegen,  6,  '세트 보너스 energyRegen(4+2)');
  assert.equal(run.runStats.energyMax,   25,  'energyMax 정상 합산');
  console.log('PASS 10: 세트 보너스 합산');
}

// ── 테스트 11: commitRun — clear 시 wins 증가 ────────────────────────────────
{
  clearStore();
  const save = makeSave({ wins: 0, gold: 0 });
  const run  = { region: 10, floor: 100, runGold: 300, runItems: [], codexSeen: null, questProgress: null, storyFlags: null };
  PD.SaveStore.commitRun(run, save, 'clear');

  assert.equal(save.wins,     1,   'clear 시 wins +1');
  assert.equal(save.gold,   300,   'clear 시 골드 귀환');
  assert.equal(save.checkpoint, 10,'clear 시 체크포인트 최신화');
  console.log('PASS 11: commitRun(clear) — wins 증가');
}

// ── 테스트 12: load/save 왕복 직렬화 ────────────────────────────────────────
{
  clearStore();
  const save = freshSave({
    gold: 999,
    checkpoint: 5,
    story: { flags: { chapter1: true, chapter2: false } }
  });
  PD.SaveStore.save(save);

  const loaded = PD.SaveStore.load();
  assert.equal(loaded.gold,       999,  'load 후 gold 복원');
  assert.equal(loaded.checkpoint,   5,  'load 후 checkpoint 복원');
  assert.equal(loaded.story.flags.chapter1, true,  'load 후 스토리 플래그 복원');
  assert.equal(loaded.version,      2,  'version=2 유지');
  console.log('PASS 12: load/save 왕복 직렬화');
}

// ── 테스트 13: recomputeStats — RUN.stats 하위 호환 별칭 ────────────────────
{
  clearStore();
  const save = freshSave();
  const run  = { runItems: [], items: [], runStats: {}, stats: {} };
  PD.recomputeStats(save, run);

  assert.equal(run.stats, run.runStats, 'RUN.stats === RUN.runStats (하위 호환 별칭)');
  console.log('PASS 13: RUN.stats 하위 호환 별칭');
}

// ── 모든 테스트 통과 ─────────────────────────────────────────────────────────
console.log('\n✓ 모든 테스트 통과 (13/13)');
