/* ============================================================================
 * 팡팡 던전 — SaveStore v2 (영속/휘발 경계 강제)
 * ----------------------------------------------------------------------------
 * 단일 localStorage 키 'pop-dungeon-save-v2' 가 영속 진행 전체를 보관한다.
 * 기존 'pop-dungeon-meta-v1'(bestFloor/wins/coins) → v2 마이그레이션 포함.
 *
 * 영속(SAVE):  장비·스킬·스탯·골드·체크포인트·도감·퀘스트·스토리 플래그.
 *             죽어도 유지된다.
 * 휘발(RUN):  던전 위치·HP·런 아이템·런 골드·방 상태.
 *             freshRun()으로 초기화하며, 런 종료/사망 시 commitRun()으로
 *             영속 파트만 SAVE 에 반영한 뒤 RUN 을 버린다.
 *
 * 공개 API (window.PD.SaveStore / window.PD.freshRun 덮어쓰기):
 *   PD.SaveStore.load()         → SAVE 객체 반환(없으면 기본값)
 *   PD.SaveStore.save(s)        → localStorage 기록
 *   PD.SaveStore.freshRun(s?)   → 새 RUN 객체(SAVE 기반으로 runStats 초기화)
 *   PD.SaveStore.commitRun(run, save, outcome)
 *                               → 사망/클리어 시 runGold·도감·퀘스트를 SAVE 에 반영
 *                                  + localStorage 기록. outcome: 'death'|'clear'
 *   PD.goldRecovery(runGold)    → 런에서 획득한 골드 중 영속 귀환 금액 계산
 *                                  기본값: 전액 회수(open-questions.md 기본값)
 * ==========================================================================*/
(function () {
  'use strict';

  var SAVE_KEY = 'pop-dungeon-save-v2';
  var META_KEY = 'pop-dungeon-meta-v1';   // 마이그레이션 소스

  // ── 기본 SAVE 스키마 (§2.3 플랜) ───────────────────────────────────────────
  function defaultSave() {
    return {
      version: 2,
      gold: 0,
      equipment: {
        weapon:  null,   // { id, enh } 또는 null
        helm:    null,
        armor:   null,
        boots:   null,
        amulet:  null,
        ring:    null
      },
      inventory: [],         // [ { id, enh }, ... ] 미착용 보유 장비
      skills: {              // AbilityKit.serialize() 결과와 정합
        learnedNodes: {},
        unlocked: {},
        points: 0,
        loadout: { skill1: null, skill2: null, ult: null }
      },
      stats:      { vit: 0, pow: 0, agi: 0, foc: 0 },  // 마을 스탯 분배 포인트
      statPoints: 0,
      checkpoint: 0,          // 도달 최고 지역(0 = 시작, 1~10 = 지역 해금)
      codex:      { enemies: {}, items: {}, achievements: {} },
      quests:     { active: [], done: [], progress: {} },
      story:      { flags: {} },

      // v1 마이그레이션 흡수 필드
      bestFloor: 0,
      runs:      0,
      wins:      0
    };
  }

  // ── v1 메타 마이그레이션 ────────────────────────────────────────────────────
  function migrateV1(save) {
    try {
      var raw = localStorage.getItem(META_KEY);
      if (!raw) return save;
      var m = JSON.parse(raw);
      if (!m || typeof m !== 'object') return save;
      if (m.bestFloor > (save.bestFloor || 0)) save.bestFloor = m.bestFloor;
      if (m.wins      > (save.wins      || 0)) save.wins      = m.wins;
      // coins(v1) → gold 흡수(이미 gold가 있으면 합산 안 하고 최대값 사용)
      var legacyCoins = m.coins || m.totalCoins || 0;
      if (legacyCoins > save.gold) save.gold = legacyCoins;
      if (m.runs > (save.runs || 0)) save.runs = m.runs;
    } catch (e) {}
    return save;
  }

  // ── load / save ──────────────────────────────────────────────────────────────
  function load() {
    var base = defaultSave();
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === 2) {
          // 깊은 병합: 기본값의 누락 키를 채운다
          return deepMerge(base, parsed);
        }
      }
    } catch (e) {}
    // v1 메타 있으면 흡수 후 첫 v2 저장
    var fresh = migrateV1(base);
    saveToDisk(fresh);
    return fresh;
  }

  function saveToDisk(s) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  // 기본값 base 에 src 의 값을 재귀적으로 얹는다
  // — src 에 있는 키 우선, base 에만 있는 키 유지
  function deepMerge(base, src) {
    if (src === null || src === undefined) return base;
    if (typeof src !== 'object' || Array.isArray(src)) return src;
    var out = {};
    var keys = {};
    Object.keys(base).forEach(function (k) { keys[k] = true; });
    Object.keys(src).forEach(function (k) { keys[k] = true; });
    Object.keys(keys).forEach(function (k) {
      if (!(k in src)) { out[k] = base[k]; return; }
      if (!(k in base)) { out[k] = src[k]; return; }
      var bv = base[k], sv = src[k];
      if (bv !== null && typeof bv === 'object' && !Array.isArray(bv) &&
          sv !== null && typeof sv === 'object' && !Array.isArray(sv)) {
        out[k] = deepMerge(bv, sv);
      } else {
        out[k] = sv;
      }
    });
    return out;
  }

  // ── goldRecovery — 런 골드 영속 귀환 정책 ───────────────────────────────────
  //   기본값: 전액 회수(open-questions.md 플랜 기본값).
  //   추후 부분 회수(예: 50%)나 0% 로 변경 시 이 함수만 수정하면 된다.
  //   단위 테스트에서 회수 정책을 검증하는 단일 게이트.
  function goldRecovery(runGold) {
    if (typeof runGold !== 'number' || runGold <= 0) return 0;
    return runGold;   // 전액 회수
  }

  // ── freshRun — 새 런 초기화 (PD.freshRun 대체) ──────────────────────────────
  //   save: PD.SaveStore.load() 결과(또는 null → 기본값 사용)
  //   반환: PD.RUN 에 할당할 새 런 객체
  //
  //   runStats 는 빈 객체로 초기화 — 실제 합산은 PD.recomputeStats() 가 담당
  //   (save/run 양쪽 준비 완료 후 씬에서 명시적으로 호출)
  function freshRun(save) {
    var s = save || load();
    // PD.setSeed 가 있으면 런 시드 초기화(결정성 AC#11)
    var PD = window.PD;
    if (PD && typeof PD.setSeed === 'function') PD.setSeed(0x9e3779b9);
    return {
      // 던전 위치
      region: Math.max(1, (s.checkpoint || 0) + 1),
      floor:  1,
      roomId: null,
      // 체력 (recomputeStats 후 갱신될 예정이므로 임시값 4)
      hp:    4,
      maxHp: 4,
      // 런 경제
      runGold: 0,
      kills:   0,
      // 런 아이템 (던전에서 줍는 휘발 렐릭 — SAVE 에는 저장되지 않음)
      runItems: [],
      // 합산 스탯 캐시 (recomputeStats 가 채움)
      runStats: {},
      // 방 그래프 상태
      visited: {},
      cleared: {},
      // 하위 호환: 기존 씬이 RUN.items 를 참조하는 경우를 위한 별칭
      // Phase 2(씬 개편) 완료 후 제거 가능
      items: []
    };
  }

  // ── commitRun — 런 종료 시 SAVE 갱신 후 저장 ────────────────────────────────
  //   run:     현재 PD.RUN
  //   save:    현재 PD.SAVE
  //   outcome: 'death' | 'clear'
  //   반환:    갱신된 save 객체(localStorage 에도 기록됨)
  function commitRun(run, save, outcome) {
    if (!run || !save) return save;
    // 골드 귀환 (단일 게이트 — goldRecovery 만 통과)
    save.gold = (save.gold || 0) + goldRecovery(run.runGold || 0);
    // 런 통계 갱신
    save.runs = (save.runs || 0) + 1;
    if (outcome === 'clear') save.wins = (save.wins || 0) + 1;
    // 체크포인트 갱신 (도달한 지역이 더 깊으면 업데이트)
    if (typeof run.region === 'number' && run.region > (save.checkpoint || 0)) {
      save.checkpoint = run.region;
    }
    // bestFloor 갱신 (하위 호환)
    if (typeof run.floor === 'number' && run.floor > (save.bestFloor || 0)) {
      save.bestFloor = run.floor;
    }
    // 도감: 런 중 발견한 항목 병합 (run.codexSeen = { enemies:{}, items:{} })
    if (run.codexSeen) {
      var codex = save.codex || (save.codex = { enemies: {}, items: {}, achievements: {} });
      Object.keys(run.codexSeen.enemies || {}).forEach(function (k) {
        codex.enemies[k] = (codex.enemies[k] || 0) + (run.codexSeen.enemies[k] || 0);
      });
      Object.keys(run.codexSeen.items || {}).forEach(function (k) {
        codex.items[k] = true;
      });
    }
    // 퀘스트 진행 병합 (run.questProgress = { questId: delta, ... })
    if (run.questProgress) {
      var qp = save.quests.progress || (save.quests.progress = {});
      Object.keys(run.questProgress).forEach(function (qid) {
        qp[qid] = (qp[qid] || 0) + (run.questProgress[qid] || 0);
      });
    }
    // 스토리 플래그 병합
    if (run.storyFlags) {
      var sf = save.story.flags || (save.story.flags = {});
      Object.keys(run.storyFlags).forEach(function (k) { sf[k] = run.storyFlags[k]; });
    }
    saveToDisk(save);
    return save;
  }

  // ── PD 에 노출 ──────────────────────────────────────────────────────────────
  var PD = (window.PD = window.PD || {});

  PD.SaveStore = {
    load:        load,
    save:        saveToDisk,
    freshRun:    freshRun,
    commitRun:   commitRun,
    defaultSave: defaultSave
  };
  PD.goldRecovery = goldRecovery;

  // PD.freshRun 을 SaveStore 버전으로 덮어씀
  // (core.js 의 단순 freshRun 은 Phase 0 호환용이었고, 이제 SaveStore 가 책임진다)
  PD.freshRun = function () {
    PD.SAVE = PD.SAVE || load();
    PD.RUN  = freshRun(PD.SAVE);
    return PD.RUN;
  };

  // 부팅 시 SAVE 로드(씬이 참조하기 전에 준비)
  PD.SAVE = load();

})();
