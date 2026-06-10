/* ============================================================================
 * 팡팡 던전 — 아이템 데이터 (item-architect 계약 · lint-items.mjs)
 * ----------------------------------------------------------------------------
 * 대부분 equipment(렐릭): 발사·이동을 가/곱연산으로 변형해 빌드 시너지를 만든다.
 * 곱연산 소스(damageMult/coinMult)는 2종만 캡(maxStacks:1)으로 희소 격리.
 * enabler/payoff 쌍은 공유 태그('skill')로 시너지 구조를 명시.
 *
 * 브라우저: window.POP_ITEMS 전역. Node: module.exports.ITEMS.
 * ==========================================================================*/
(function (g) {
  'use strict';

  var ITEMS = {
    "version": 1,
    "meta": {
      "slug": "pop-dungeon",
      "originalityNote": "전 아이템 절차 설계 오리지널 — 원작 아이템명/아이콘 미사용. 추상 룬/젬/마스코트 모티프."
    },
    "rarities": [
      { "id": "common", "name": "일반", "color": "#c6d4e6" },
      { "id": "rare", "name": "희귀", "color": "#3fd6a8" },
      { "id": "epic", "name": "영웅", "color": "#9a66e8" },
      { "id": "legendary", "name": "전설", "color": "#ffc63a" }
    ],
    "items": [
      {
        "id": "twin_pop", "name": "쌍둥이 팝", "kind": "equipment", "rarity": "common",
        "effect": { "extraProjectiles": 1, "spreadAngle": 8 },
        "role": "core", "tags": ["multishot"], "budget": 7,
        "flavor": "탄알이 하나 더 나간다.",
        "visual": { "silhouette": "두 개로 갈라진 둥근 총알", "material": "플랫 카툰+굵은 외곽선", "palette": "#cfd8e3/#8fa3b8", "focal_motif": "쌍알" }
      },
      {
        "id": "pierce_pip", "name": "관통 씨앗", "kind": "equipment", "rarity": "common",
        "effect": { "pierce": 1 },
        "role": "core", "tags": ["pierce"], "budget": 7,
        "flavor": "탄알이 적 1명을 더 뚫는다.",
        "visual": { "silhouette": "뾰족한 새싹 모양 탄", "material": "플랫 카툰", "palette": "#a8e6a1/#4aa84a", "focal_motif": "관통 화살촉" }
      },
      {
        "id": "rapid_rabbit", "name": "토끼 발", "kind": "equipment", "rarity": "common",
        "effect": { "fireRateFlat": -0.03 },
        "role": "core", "tags": ["firerate"], "budget": 7,
        "flavor": "발사 간격이 조금 짧아진다.",
        "visual": { "silhouette": "둥근 토끼 발바닥", "material": "말랑 카툰", "palette": "#ffd9e6/#ff8fb0", "focal_motif": "발바닥 젤리" }
      },
      {
        "id": "magnet_mush", "name": "자석 버섯", "kind": "equipment", "rarity": "common",
        "effect": { "pickupRadius": 70 },
        "role": "utility", "tags": ["utility", "pickup"], "budget": 6,
        "flavor": "코인·기력 픽업을 더 멀리서 끌어온다.",
        "visual": { "silhouette": "U자 자석을 쓴 둥근 버섯", "material": "플랫+소프트섀도우", "palette": "#ff6b6b/#ffffff", "focal_motif": "말굽 자석" }
      },
      {
        "id": "bounce_bean", "name": "통통 콩", "kind": "equipment", "rarity": "rare",
        "effect": { "bounce": 1 },
        "role": "core", "tags": ["bounce"], "budget": 9,
        "flavor": "탄알이 벽에서 한 번 튕긴다.",
        "visual": { "silhouette": "탱탱한 둥근 콩+모션 호", "material": "광택 젤리", "palette": "#7be07b/#2fa84a", "focal_motif": "튕김 궤적" }
      },
      {
        "id": "homing_heart", "name": "유도 하트", "kind": "equipment", "rarity": "rare",
        "effect": { "homing": 0.12 },
        "role": "core", "tags": ["homing", "seek"], "budget": 10,
        "flavor": "탄알이 가까운 적으로 살짝 휜다.",
        "visual": { "silhouette": "작은 날개 달린 하트", "material": "분홍 글로우", "palette": "#ff8fb0/#ff4f7a", "focal_motif": "유도 하트" }
      },
      {
        "id": "big_pop", "name": "왕 팝", "kind": "equipment", "rarity": "rare",
        "effect": { "bulletSize": 0.6, "damage": 4 },
        "role": "core", "tags": ["size", "damage"], "budget": 10,
        "flavor": "탄알이 커지고 피해가 늘지만 속도가 살짝 준다.",
        "visual": { "silhouette": "거대한 둥근 탄", "material": "두꺼운 외곽선 풍선", "palette": "#ffd34a/#ff9f1a", "focal_motif": "왕방울" }
      },
      {
        "id": "thorn_shell", "name": "가시 등껍질", "kind": "equipment", "rarity": "rare",
        "effect": { "contactDamage": 10, "armor": 1 },
        "role": "survival", "tags": ["defense"], "budget": 9,
        "flavor": "몸에 닿은 적이 가시에 찔리고, 피격을 가끔 막는다.",
        "visual": { "silhouette": "가시 돋은 둥근 등껍질", "material": "무광 갑각+가시", "palette": "#8fd0c0/#3a7a6a", "focal_motif": "가시 링" }
      },
      {
        "id": "energy_core", "name": "기력 코어", "kind": "equipment", "rarity": "rare",
        "effect": { "energyRegen": 4, "energyMax": 25 },
        "role": "enabler", "tags": ["skill", "energy"], "budget": 9,
        "flavor": "기력 회복과 최대치를 늘려 스킬을 더 자주 쓰게 한다.",
        "visual": { "silhouette": "맥동하는 육각 코어", "material": "네온 글로우 결정", "palette": "#6ff0ff/#2bb6e0", "focal_motif": "에너지 결정" }
      },
      {
        "id": "split_seed", "name": "분열 씨앗", "kind": "equipment", "rarity": "epic",
        "effect": { "split": 2 },
        "role": "core", "tags": ["split", "multishot"], "budget": 14,
        "flavor": "적에게 맞은 탄알이 작은 탄 2개로 갈라진다.",
        "visual": { "silhouette": "갈라지는 세 갈래 씨앗", "material": "광택 결정 파편", "palette": "#c08bff/#7a3fd0", "focal_motif": "분열 파편" }
      },
      {
        "id": "skill_charm", "name": "스킬 부적", "kind": "equipment", "rarity": "epic",
        "effect": { "skillDamage": 18 },
        "role": "payoff", "tags": ["skill"], "budget": 14,
        "flavor": "스킬 피해가 크게 늘어난다. 기력 코어와 함께면 스킬 빌드 완성.",
        "visual": { "silhouette": "룬이 새겨진 둥근 부적", "material": "금테 + 보라 룬 글로우", "palette": "#c08bff/#ffd34a", "focal_motif": "룬 부적" }
      },
      {
        "id": "glass_charm", "name": "유리 심장", "kind": "equipment", "rarity": "epic",
        "effect": { "damageMult": 1.4, "maxHp": -1 }, "maxStacks": 1,
        "role": "payoff", "tags": ["damage", "glass", "risk"], "budget": 15,
        "flavor": "피해가 40% 늘지만 체력 1칸을 잃는다. 고위험 고보상.",
        "visual": { "silhouette": "금이 간 둥근 유리 심장", "material": "투명 글래스+내부 붉은 글로우", "palette": "#ff6b6b/#ffd9d9", "focal_motif": "균열 하트" }
      },
      {
        "id": "lucky_clover", "name": "행운 클로버", "kind": "equipment", "rarity": "epic",
        "effect": { "luck": 2, "coinMult": 1.25 }, "maxStacks": 1,
        "role": "utility", "tags": ["luck", "economy"], "budget": 13,
        "flavor": "더 좋은 드랍과 25% 더 많은 코인.",
        "visual": { "silhouette": "네 잎 클로버", "material": "에메랄드 글로우", "palette": "#7be07b/#ffd34a", "focal_motif": "네 잎" }
      },
      {
        "id": "dash_boots", "name": "팡팡 부츠", "kind": "equipment", "rarity": "legendary",
        "effect": { "dodgeCharges": 1, "dashDamage": 14 },
        "role": "mobility", "tags": ["mobility", "dodge"], "grantsVerb": "extra_dodge", "budget": 19,
        "flavor": "닷지롤 충전이 1 늘고, 구르며 적을 들이받으면 피해를 준다.",
        "visual": { "silhouette": "스프링 달린 둥근 부츠 한 켤레", "material": "광택 고무+스프링", "palette": "#ff9f1a/#ffd34a", "focal_motif": "스프링 밑창" }
      },
      {
        "id": "pop_potion", "name": "팡 물약", "kind": "consumable", "rarity": "common",
        "effect": { "heal": 1 }, "cost": 6,
        "role": "sustain", "tags": ["heal"], "budget": 4,
        "flavor": "체력 1칸 회복.",
        "visual": { "silhouette": "둥근 물약 병", "material": "유리병+분홍 액체", "palette": "#ff8fb0/#ffffff", "focal_motif": "하트 거품" }
      },
      {
        "id": "mega_potion", "name": "왕 물약", "kind": "consumable", "rarity": "rare",
        "effect": { "heal": 3 }, "cost": 14,
        "role": "sustain", "tags": ["heal"], "budget": 9,
        "flavor": "체력 3칸 회복.",
        "visual": { "silhouette": "큰 둥근 물약 병", "material": "유리병+진분홍 액체+거품", "palette": "#ff5f8f/#ffffff", "focal_motif": "큰 하트 거품" }
      },
      {
        "id": "energy_drink", "name": "기력 드링크", "kind": "consumable", "rarity": "common",
        "effect": { "energyRestore": 60 }, "cost": 5,
        "role": "utility", "tags": ["energy"], "budget": 4,
        "flavor": "기력 60 즉시 회복.",
        "visual": { "silhouette": "둥근 캔", "material": "알루미늄 캔+청록 글로우", "palette": "#6ff0ff/#ffffff", "focal_motif": "번개 마크" }
      },
      {
        "id": "coin", "name": "코인", "kind": "currency",
        "effect": { "value": 1 },
        "role": "utility", "tags": ["economy"], "budget": 1,
        "flavor": "상점/리롤에 쓰는 기본 통화."
      }
    ],
    "sets": [
      { "id": "skill", "name": "스킬 빌드", "threshold": 2, "members": ["energy_core", "skill_charm"], "bonus": "스킬 쿨다운 -15%" }
    ],
    "balanceConfig": {
      "multCap": 2,
      "powerKinds": ["consumable", "equipment", "material"],
      "deadItemFactor": 0.4,
      "lowerIsBetter": ["cooldown", "cd", "weight", "ms", "fireRateFlat"]
    }
  };

  g.POP_ITEMS = ITEMS;
  if (typeof module !== 'undefined' && module.exports) module.exports = { ITEMS: ITEMS };
})(typeof window !== 'undefined' ? window : globalThis);
