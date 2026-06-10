/* ============================================================================
 * 팡팡 던전 — 월드 데이터 (world-map-architect 문서 계약 · STORY.md §12 단일 진실)
 * ----------------------------------------------------------------------------
 * 구멍 단면 수직 하강: 10지역 × 10층 = 100층. 각 지역은 바이옴 룩·별이 흔적
 * 기믹·보스(악몽 조각)·드랍 편향·해금 조건(체크포인트)을 가진다.
 * 테마색은 STYLE.md master_palette 역할색을 상속한다(여기선 ramp 키 + hex 힌트).
 * 막간(11/21/.../91층)은 각 지역 1층 진입 시 트리거 — STORY.md §13 재매핑 표.
 *
 * 브라우저: window.POP_WORLD 전역. Node: module.exports.WORLD.
 * ==========================================================================*/
(function (g) {
  'use strict';

  var WORLD = {
    "version": 1,
    "meta": {
      "slug": "pop-dungeon",
      "structure": "vertical-descent",
      "totalFloors": 100,
      "floorsPerRegion": 10,
      "regionCount": 10,
      "originalityNote": "전 지역명·바이옴·보스 오리지널. STORY.md §12 1:1. 상용 IP 미사용.",
      "storyRef": "STORY.md §12 (바이옴 서사) · §13 (막간↔지역 재매핑 AC#14)"
    },
    // 막간 흔적 → 지역 1층 트리거(STORY §13). 1회성: story.flags.seen_floor_NN(SaveStore 영속).
    "interludeMap": [
      { "floor": 1,  "region": "region-01", "setup": "intro",    "flag": "seen_floor_1" },
      { "floor": 11, "region": "region-02", "setup": "S1",       "flag": "seen_floor_11" },
      { "floor": 21, "region": "region-03", "setup": "S2a",      "flag": "seen_floor_21" },
      { "floor": 31, "region": "region-04", "setup": "S2b",      "flag": "seen_floor_31" },
      { "floor": 41, "region": "region-05", "setup": "S3",       "flag": "seen_floor_41" },
      { "floor": 51, "region": "region-06", "setup": "S4",       "flag": "seen_floor_51" },
      { "floor": 61, "region": "region-07", "setup": "S5a",      "flag": "seen_floor_61" },
      { "floor": 71, "region": "region-08", "setup": "S5b_E1",   "flag": "seen_floor_71" },
      { "floor": 81, "region": "region-09", "setup": "rush",     "flag": "seen_floor_81" },
      { "floor": 91, "region": "region-10", "setup": "twist",    "flag": "seen_floor_91" }
    ],
    "regions": [
      {
        "id": "region-01", "order": 1, "name": "이끼 낀 입구굴", "floors": [1, 10],
        "biome": "mossy-cave", "theme": { "ramp": "stone", "accent": "moss", "hint": "#6b7a6b/#9fc28a", "lightTemp": "cold" },
        "starTrace": { "gimmick": "torch_lit_intro", "interludeFloor": 1, "desc": "첫 횃불이 이미 켜져 있다(E1 복선 시작)" },
        "boss": { "id": "boss_gateknot", "name": "굴 어귀의 응어리", "floor": 10, "kind": "nightmare_shard" },
        "dropBias": ["coin", "common"], "unlock": { "type": "always" }
      },
      {
        "id": "region-02", "order": 2, "name": "반창고 협곡", "floors": [11, 20],
        "biome": "bandage-canyon", "theme": { "ramp": "torch", "accent": "stone", "hint": "#d8784a/#a44a3a", "lightTemp": "warm" },
        "starTrace": { "gimmick": "bandage_altar", "interludeFloor": 11, "desc": "S1 반창고 한 통째로(비밀방 제단)" },
        "boss": { "id": "boss_canyonblock", "name": "협곡을 막은 응어리", "floor": 20, "kind": "nightmare_shard" },
        "dropBias": ["consumable", "common"], "unlock": { "type": "clear", "region": "region-01" }
      },
      {
        "id": "region-03", "order": 3, "name": "곧은 발자국 회랑", "floors": [21, 30],
        "biome": "footprint-hall", "theme": { "ramp": "steel", "accent": "glow", "hint": "#7d93a8/#9fd0e6", "lightTemp": "neutral" },
        "starTrace": { "gimmick": "straight_footprints", "interludeFloor": 21, "desc": "S2-a 곧은 발자국이 출구를 가리킴(길잡이)" },
        "boss": { "id": "boss_hallwarden", "name": "회랑 끝의 문지기 응어리", "floor": 30, "kind": "nightmare_shard" },
        "dropBias": ["mobility", "common"], "unlock": { "type": "clear", "region": "region-02" }
      },
      {
        "id": "region-04", "order": 4, "name": "손수건 미궁", "floors": [31, 40],
        "biome": "kerchief-maze", "theme": { "ramp": "violet", "accent": "cloth", "hint": "#7a5a8a/#c9a8d0", "lightTemp": "neutral" },
        "starTrace": { "gimmick": "kerchief_markers", "interludeFloor": 31, "desc": "S2-b 손수건이 비밀방/보물방 방향 표시(분기 길잡이)" },
        "boss": { "id": "boss_knotcore", "name": "미궁 한복판의 매듭 응어리", "floor": 40, "kind": "nightmare_shard" },
        "dropBias": ["utility", "luck"], "unlock": { "type": "clear", "region": "region-03" }
      },
      {
        "id": "region-05", "order": 5, "name": "별지도 서고", "floors": [41, 50],
        "biome": "starmap-library", "theme": { "ramp": "parchment", "accent": "ink", "hint": "#d9c08a/#2a3a6a", "lightTemp": "warm" },
        "starTrace": { "gimmick": "starmap_prepared", "interludeFloor": 41, "desc": "S3 별이가 미리 그려 둔 별 지도(잉크 마름 — 준비의 증거)" },
        "boss": { "id": "boss_inkblot", "name": "책장 사이의 먹물 응어리", "floor": 50, "kind": "nightmare_shard" },
        "dropBias": ["epic"], "unlock": { "type": "clear", "region": "region-04" }
      },
      {
        "id": "region-06", "order": 6, "name": "속삭이는 수정굴", "floors": [51, 60],
        "biome": "whisper-crystal", "theme": { "ramp": "crystal", "accent": "glow", "hint": "#5ad0c8/#a8f0e8", "lightTemp": "cool" },
        "starTrace": { "gimmick": "fading_note", "interludeFloor": 51, "desc": "S4 수첩: 얘가 아파. 소리가 점점 작아져(환경음 연동)" },
        "boss": { "id": "boss_sobbingfacet", "name": "수정 속 흐느끼는 응어리", "floor": 60, "kind": "nightmare_shard" },
        "dropBias": ["skill", "energy"], "unlock": { "type": "clear", "region": "region-05" }
      },
      {
        "id": "region-07", "order": 7, "name": "우는 그림자 늪", "floors": [61, 70],
        "biome": "weeping-marsh", "theme": { "ramp": "ink", "accent": "cold", "hint": "#3a3a52/#5a6a7a", "lightTemp": "cold" },
        "starTrace": { "gimmick": "weeping_enemies", "interludeFloor": 61, "desc": "S5-a 적이 쫓기보다 웅크려 운다(공격성↓·체력↑, 두려움이지 악의 아님)" },
        "boss": { "id": "boss_deepsob", "name": "늪 바닥의 가장 큰 울음", "floor": 70, "kind": "nightmare_shard" },
        "dropBias": ["defense", "survival"], "unlock": { "type": "clear", "region": "region-06" }
      },
      {
        "id": "region-08", "order": 8, "name": "켜진 횃불의 길", "floors": [71, 80],
        "biome": "lit-corridor", "theme": { "ramp": "torch", "accent": "glow", "hint": "#f0a050/#ffd080", "lightTemp": "warm" },
        "starTrace": { "gimmick": "prelit_torches", "interludeFloor": 71, "desc": "S5-b 방마다 횃불이 이미 켜져 있다(E1 회수 — 별이가 길을 밝혀 둠). 어두운 방 없는 유일 지역" },
        "boss": { "id": "boss_lightfearer", "name": "빛을 두려워하는 응어리", "floor": 80, "kind": "nightmare_shard" },
        "dropBias": ["legendary", "epic"], "unlock": { "type": "clear", "region": "region-07" }
      },
      {
        "id": "region-09", "order": 9, "name": "서두른 발자국 비탈", "floors": [81, 90],
        "biome": "hasty-slope", "theme": { "ramp": "stone", "accent": "starfall", "hint": "#5a5a6a/#c0c8ff", "lightTemp": "cool" },
        "starTrace": { "gimmick": "running_footprints", "interludeFloor": 81, "desc": "발자국이 뛰기 시작(도망 아니라 서두름). 아래로 당기는 하강 흐름 기믹" },
        "boss": { "id": "boss_slopeblock", "name": "비탈을 막은 응어리", "floor": 90, "kind": "nightmare_shard" },
        "dropBias": ["material", "epic"], "unlock": { "type": "clear", "region": "region-08" }
      },
      {
        "id": "region-10", "order": 10, "name": "별의 심장", "floors": [91, 100],
        "biome": "star-heart", "theme": { "ramp": "starlight", "accent": "warmcore", "hint": "#ffd860/#fff0c0", "lightTemp": "radiant" },
        "starTrace": { "gimmick": "last_note", "interludeFloor": 91, "desc": "마지막 수첩: 호두야, 올 줄 알았어. 깊은 데서 기다릴게(転). 100층=별의 심장" },
        "boss": { "id": "boss_nightmare_core", "name": "악몽의 핵", "floor": 100, "kind": "nightmare_shard", "final": true },
        "dropBias": ["legendary"], "unlock": { "type": "clear", "region": "region-09" }
      }
    ]
  };

  g.POP_WORLD = WORLD;
  if (typeof module !== 'undefined' && module.exports) module.exports = { WORLD: WORLD };
})(typeof window !== 'undefined' ? window : globalThis);
