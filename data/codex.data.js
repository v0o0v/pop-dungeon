/* ============================================================================
 * 팡팡 던전 — 도감 데이터 (codex: 적·장비·업적 — STORY.md §8·§12 정합)
 * ----------------------------------------------------------------------------
 * 도감(떠버리 쌍둥이 NPC 바인딩, §11.2)은 플레이어가 만난 적·획득 장비·달성
 * 업적을 기록한다. enemies 는 지역 바이옴(§12)·악몽 조각 정체(§8)와 정합.
 * 장비 도감은 data/items.data.js id 를 참조(중복 정의 금지 — items 가 단일 진실).
 * 도감 해금 = SaveStore codex.{enemies,items,achievements} 플래그.
 *
 * 반전 보호: 적 설명은 "악몽 조각=별이 아파서 새어나온 두려움"(§8)까지만 —
 * 별이가 제 발로 갔다는 진실은 도감에 없다(TW-FAIR-PLAY).
 *
 * 브라우저: window.POP_CODEX 전역. Node: module.exports.CODEX.
 * ==========================================================================*/
(function (g) {
  'use strict';

  var CODEX = {
    "version": 1,
    "meta": {
      "slug": "pop-dungeon",
      "originalityNote": "전 도감 항목 오리지널(STORY §8·§12). 상용 IP 미사용.",
      "storyRef": "STORY.md §8 (Glossary) · §12 (지역 보스)",
      "itemRef": "장비 도감은 data/items.data.js id 참조 — items 가 단일 진실(중복 정의 금지)"
    },
    // 적 도감 — 일반 잡몹(바이옴 공유) + 지역 보스 10종. 전부 악몽 조각(§8).
    "enemies": [
      { "id": "shard_drifter", "name": "떠도는 조각", "kind": "common", "regions": ["region-01", "region-02", "region-03"], "desc": "느리게 떠도는 작은 악몽 조각. 쏘면 빛이 되어 흩어진다." },
      { "id": "shard_darter", "name": "쏘는 조각", "kind": "common", "regions": ["region-03", "region-04", "region-05"], "desc": "빠르게 돌진하는 조각. 곧은 회랑에서 자주 나타난다." },
      { "id": "shard_splitter", "name": "갈라지는 조각", "kind": "common", "regions": ["region-05", "region-06"], "desc": "처치 시 더 작은 조각으로 갈라진다. 서고·수정굴에 서식." },
      { "id": "shard_weeper", "name": "우는 조각", "kind": "elite", "regions": ["region-07"], "desc": "쫓아오지 않고 웅크려 운다. 체력이 높지만 공격성은 낮다 — 악의가 아니라 두려움." },
      { "id": "shard_lightshy", "name": "빛 꺼리는 조각", "kind": "elite", "regions": ["region-08"], "desc": "켜진 횃불을 피한다. 밝은 길에서 약해진다." },
      { "id": "shard_faller", "name": "떨어지는 조각", "kind": "elite", "regions": ["region-09"], "desc": "비탈을 타고 빠르게 미끄러져 내려온다." },
      { "id": "boss_gateknot", "name": "굴 어귀의 응어리", "kind": "boss", "regions": ["region-01"], "floor": 10, "desc": "입구를 막은 첫 응어리. 어둠 속 첫 시련." },
      { "id": "boss_canyonblock", "name": "협곡을 막은 응어리", "kind": "boss", "regions": ["region-02"], "floor": 20, "desc": "반창고가 떨어진 협곡을 가로막은 덩어리." },
      { "id": "boss_hallwarden", "name": "회랑 끝의 문지기 응어리", "kind": "boss", "regions": ["region-03"], "floor": 30, "desc": "곧은 발자국이 향하는 회랑 끝을 지킨다." },
      { "id": "boss_knotcore", "name": "미궁 한복판의 매듭 응어리", "kind": "boss", "regions": ["region-04"], "floor": 40, "desc": "손수건 미궁의 중심에 얽힌 매듭." },
      { "id": "boss_inkblot", "name": "책장 사이의 먹물 응어리", "kind": "boss", "regions": ["region-05"], "floor": 50, "desc": "별 지도를 덮으려는 먹물 덩어리." },
      { "id": "boss_sobbingfacet", "name": "수정 속 흐느끼는 응어리", "kind": "boss", "regions": ["region-06"], "floor": 60, "desc": "수정에 갇혀 작아지는 소리로 운다." },
      { "id": "boss_deepsob", "name": "늪 바닥의 가장 큰 울음", "kind": "boss", "regions": ["region-07"], "floor": 70, "desc": "우는 그림자들이 모여든 가장 큰 슬픔." },
      { "id": "boss_lightfearer", "name": "빛을 두려워하는 응어리", "kind": "boss", "regions": ["region-08"], "floor": 80, "desc": "미리 밝혀진 횃불의 길 끝에서 빛을 두려워한다." },
      { "id": "boss_slopeblock", "name": "비탈을 막은 응어리", "kind": "boss", "regions": ["region-09"], "floor": 90, "desc": "서두르는 발자국 앞을 막아선 마지막 관문." },
      { "id": "boss_nightmare_core", "name": "악몽의 핵", "kind": "final", "regions": ["region-10"], "floor": 100, "desc": "별의 심장을 둘러싼 가장 큰 악몽 덩어리. 별이 아파서 새어나온 모든 두려움의 핵." }
    ],
    // 업적 — 진행/수집/도전. 마일스톤은 STORY 비트(§5)와 정합.
    "achievements": [
      { "id": "ach_first_descent", "name": "첫걸음", "desc": "구멍 아래로 첫 진입.", "trigger": { "type": "reach", "value": "region-01" } },
      { "id": "ach_bandage", "name": "한 통째로", "desc": "반창고 협곡에 도달.", "trigger": { "type": "reach", "value": "region-02" } },
      { "id": "ach_starmap", "name": "미리 그린 지도", "desc": "별지도 서고에 도달.", "trigger": { "type": "reach", "value": "region-05" } },
      { "id": "ach_lit_path", "name": "밝혀 둔 길", "desc": "켜진 횃불의 길에 도달.", "trigger": { "type": "reach", "value": "region-08" } },
      { "id": "ach_twist", "name": "올 줄 알았어", "desc": "별의 심장(91층)에 도달 — 흔적의 진짜 의미.", "trigger": { "type": "reach", "value": "region-10" } },
      { "id": "ach_clear", "name": "별이 떠오른 밤", "desc": "악몽의 핵을 격파하고 별을 하늘로 돌려보냄.", "trigger": { "type": "clear", "value": "boss_nightmare_core" } },
      { "id": "ach_codex_enemies", "name": "전부 빛으로", "desc": "모든 적 도감 완성.", "trigger": { "type": "codexFull", "value": "enemies" } },
      { "id": "ach_codex_items", "name": "수집가", "desc": "모든 장비 도감 완성.", "trigger": { "type": "codexFull", "value": "items" } },
      { "id": "ach_max_enhance", "name": "단단하게", "desc": "장비를 +9까지 강화.", "trigger": { "type": "enhance", "value": 9 } },
      { "id": "ach_questmaster", "name": "마을의 친구", "desc": "모든 사이드 퀘스트 완료.", "trigger": { "type": "questsAll" } },
      { "id": "ach_no_death", "name": "넘어지지 않고", "desc": "한 번도 송환되지 않고 한 지역 클리어.", "trigger": { "type": "regionNoDeath" } },
      { "id": "ach_merchant_stay", "name": "눌러앉은 별엿장수", "desc": "클리어 후 별엿장수가 솔뫼에 정착.", "trigger": { "type": "ending", "value": "merchant_stay" } }
    ]
  };

  g.POP_CODEX = CODEX;
  if (typeof module !== 'undefined' && module.exports) module.exports = { CODEX: CODEX };
})(typeof window !== 'undefined' ? window : globalThis);
