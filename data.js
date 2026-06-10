/* ============================================================================
 * 팡팡 던전 (Pop Dungeon) — 게임 데이터 단일 소스
 * ----------------------------------------------------------------------------
 * 스타일(style-architect) · 스킬(ability-architect) · 아이템(item-architect) ·
 * 사운드(sound-architect) 스펙을 한 파일에서 정의한다. 브라우저에서는 window.POP_* 전역으로,
 * Node 에서는 module.exports 로 노출 → tools/emit-json.mjs 가 이 한 소스에서
 * style.json/abilities.json/items.json/audio.json + assets/palette.master.json 을
 * 추출해 각 린터로 검증한다(단일 소스, 드리프트 방지, 오프라인 file:// 안전).
 *
 * 모든 에셋·사운드·이름은 절차 생성 오리지널(CC0/IP-safe). 엔터더건전 등 원작
 * 스프라이트·BGM·고유명 미사용.
 * ==========================================================================*/
(function (g) {
  'use strict';

  // ===========================================================================
  // 0) 비주얼 스타일 (style-architect 계약 — lint-style.mjs · engine/stylekit.js)
  //    게임 전체 색의 상류 권위(단일 진실). game.js 는 모든 색을 이 램프/역할색에서
  //    참조하고, emit-json.mjs 가 style.json + assets/palette.master.json 으로 추출한다.
  //    무드: candy-pop-dungeon — 차가운 보라 어둠의 돌던전 위, 사탕처럼 쨍한 마스코트.
  //    매체: vector(스무스) — game.js render.pixelArt:false 와 1:1 (D7).
  // ===========================================================================
  var STYLE = {
    "slug": "pop-dungeon",
    "schema_version": 1,
    "medium": "vector",
    "tier": 2,
    "mood": "candy-pop-dungeon",
    "master_palette": {
      "ramps": {
        "hero":   ["#12463f", "#1ba79c", "#33d2bd", "#7af0dc"],
        "slime":  ["#234d18", "#2c6b22", "#3a8e2a", "#4fae3a", "#9be86b"],
        "royal":  ["#3e1f70", "#7a3fd0", "#a86bff", "#c08bff", "#e3c8ff"],
        "bat":    ["#2f3270", "#5a5eb0", "#6b6fbf", "#9a9ee8"],
        "ember":  ["#6e2418", "#d4583a", "#ff9f6b"],
        "candy":  ["#2a0e18", "#5a0f28", "#d12a5a", "#ff4f7a", "#ff6b9a", "#ff8fb0"],
        "gold":   ["#8a5a10", "#d98a1f", "#ff9f1a", "#ffd34a", "#fff6c0"],
        "cyan":   ["#1a3a44", "#2bb6e0", "#7af0ff", "#eaffff"],
        "steel":  ["#10243a", "#22406e", "#4a78c8", "#9ad0ff"],
        "portal": ["#285ac8", "#5ab4ff", "#c8ebff"],
        "wood":   ["#3e2010", "#7a4422", "#b06a3a", "#caa06a"],
        "stone":  ["#241640", "#3a2a60", "#6a4ad0", "#b89cff"],
        "mist":   ["#2a3050", "#44364a", "#6a7a90", "#9fb3c8", "#cfd8e3"]
      },
      "neutrals": { "black": "#1a2233", "white": "#ffffff" },
      "background": "#161a2e"
    },
    "role_colors": {
      "player": "#33d2bd",
      "enemy": "#ff8fb0",
      "danger": "#ff4f7a",
      "pickup": "#ffd34a",
      "ui_accent": "#7af0ff"
    },
    "variants": {
      "floor_backgrounds": ["#1a1030", "#101a30", "#102a20", "#2a1018", "#101830", "#281a30", "#301a10", "#102828", "#281028", "#1a1040"],
      "boss_tints": ["#b0ff8a", "#8affd0", "#ffb0b0", "#ff9a6b", "#ffd36b", "#c8a0ff", "#ff6bd0"]
    },
    "proportions": { "head_to_body": "1:1", "silhouette": "round-blob", "min_feature_px": 2 },
    "line": { "outline": "full", "outline_color": "darker-of-fill", "weight_px": 2 },
    "shading": { "model": "soft", "light_dir": "NW", "ramp_steps": 3, "hue_shift": "warm-light-cool-shadow" },
    "render": { "pixelArt": false, "antialias": true, "roundPixels": false },
    "lintConfig": {
      "min_contrast_ratio": 3.0,
      "max_palette_colors": 80,
      "known_moods": ["candy-pop-dungeon", "custom"],
      "ip_redwords": ["gungeon", "enter the gungeon", "엔터더건전", "isaac", "soul knight", "nuclear throne", "mario", "zelda"]
    }
  };

  // ===========================================================================
  // 1) 스킬 / 능력 (ability-architect 계약 — lint-abilities.mjs)
  //    직업 '팝거너(Pop Gunner)' 의 능력 킷. 자원=기력(energy).
  //    슬롯 예산: dodge · skill1 · skill2 · ult = 4 (모바일 버튼 예산 한도).
  // ===========================================================================
  var ABILITIES = {
    "version": 1,
    "meta": {
      "slug": "pop-dungeon",
      "tier": 3,
      "class": "pop-gunner",
      "className": "팝거너",
      "originalityNote": "전 능력 절차 설계 오리지널 — 어떤 게임의 고유 스킬명/수치도 인용하지 않음. 장르 관용 메카닉(닷지롤 무적·궁극기·자원/쿨다운)만 차용."
    },
    "resources": [
      { "id": "energy", "name": "기력", "max": 100, "start": 100, "startFull": true, "regen": 9, "rechargeDelay": 1.0 }
    ],
    "abilities": [
      {
        "id": "dodge_roll", "name": "팡 구르기", "kind": "movement", "input": "instant",
        "slot": "dodge", "cooldown": 1.05, "charges": 2,
        "effect": { "iframes": 0.36, "dashDistance": 150, "dashSpeed": 560 },
        "role": "mobility", "tags": ["mobility", "dodge"], "grantsVerb": "dodge", "budget": 8,
        "flavor": "전반 무적프레임으로 탄막을 통째로 통과한다. 엔터더건전식 닷지롤.",
        "visual": { "silhouette": "통통한 잔상이 도넛처럼 번지는 원형 롤", "material": "반투명 청록 모션블러+흰 림", "palette": "#5ef0d6/#2fd0bc/#ffffff", "focal_motif": "굴러가는 잔상 3겹" }
      },
      {
        "id": "pop_nova", "name": "팡 노바", "kind": "active", "input": "instant",
        "slot": "skill1", "resource": "energy", "cost": 35, "cooldown": 5,
        "effect": { "damage": 45, "radius": 150, "knockback": 260 },
        "role": "burst", "tags": ["burst", "aoe"], "budget": 12,
        "flavor": "주위로 팡! 하고 퍼지는 충격파. 탄막에 둘러싸였을 때 탈출구를 연다.",
        "visual": { "silhouette": "사방으로 퍼지는 링 충격파", "material": "노랑→주황 글로우 링", "palette": "#fff3a0/#ffb13a/#ff7a3a", "focal_motif": "확장하는 이중 링" }
      },
      {
        "id": "turbo_pop", "name": "터보 팝", "kind": "active", "input": "instant",
        "slot": "skill2", "resource": "energy", "cost": 30, "cooldown": 8,
        "effect": { "duration": 4, "fireRateMult": 1.8 }, "maxStacks": 1,
        "role": "sustain", "tags": ["firepower"], "budget": 12,
        "flavor": "잠깐 발사 속도가 폭발한다. 보스 페이즈 전환 직후 화력 집중.",
        "visual": { "silhouette": "총구 주위 회전 가속 링", "material": "청록 스파크 트레일", "palette": "#6ff0ff/#2fd0bc/#ffffff", "focal_motif": "가속 회오리" }
      },
      {
        "id": "golden_storm", "name": "황금 팝 폭풍", "kind": "ultimate", "input": "instant",
        "slot": "ult", "resource": "energy", "cost": 100, "cooldown": 30,
        "effect": { "damage": 30, "duration": 5, "orbitalCount": 8 },
        "role": "burst", "tags": ["ultimate", "aoe"], "budget": 30,
        "flavor": "황금 탄알 8발이 나를 돌며 닿는 모든 적을 분쇄한다. 위기 탈출 + 청소기.",
        "visual": { "silhouette": "플레이어를 도는 8개 오비탈 탄", "material": "금빛 글로우 구체", "palette": "#fff6c0/#ffcf3a/#d98a1f", "focal_motif": "회전하는 황금 고리" }
      },
      {
        "id": "pop_mastery", "name": "팝건 숙련", "kind": "passive", "input": "passive",
        "effect": { "flatDamage": 2 },
        "role": "core", "tags": ["firepower"], "budget": 6,
        "flavor": "팝건을 오래 다뤄 기본 화력이 단단하다.",
        "visual": { "silhouette": "총열에 새겨진 별 마크", "material": "에나멜 도트", "palette": "#ffd34a/#ffffff", "focal_motif": "작은 별 1개" }
      },
      {
        "id": "eagle_eye", "name": "매의 눈", "kind": "passive", "input": "passive",
        "effect": { "critChance": 0.1, "critBonusDamage": 6 },
        "role": "core", "tags": ["crit"], "budget": 6,
        "flavor": "10% 확률로 약점에 명중해 추가 피해.",
        "visual": { "silhouette": "조준 십자선 위 작은 눈", "material": "라인아트 글로우", "palette": "#9cff7a/#ffffff", "focal_motif": "타깃 십자선" }
      }
    ],
    "balanceConfig": {
      "inputBudgetMobile": 4,
      "multCap": 2
    }
  };

  // ===========================================================================
  // 2) 아이템 (item-architect 계약 — lint-items.mjs)
  //    대부분 equipment(렐릭): 발사·이동을 가/곱연산으로 변형해 빌드 시너지를 만든다.
  //    곱연산 소스(damageMult/coinMult)는 2종만 캡(maxStacks:1)으로 희소 격리.
  //    enabler/payoff 쌍은 공유 태그('skill')로 시너지 구조를 명시.
  // ===========================================================================
  var ITEMS = {
    "version": 1,
    "meta": {
      "slug": "pop-dungeon",
      "originalityNote": "전 아이템 절차 설계 오리지널 — 원작 아이템명/아이콘 미사용. 추상 룬/젬/마스코트 모티프."
    },
    "rarities": [
      { "id": "common", "name": "일반", "color": "#cfd8e3" },
      { "id": "rare", "name": "희귀", "color": "#5ad1ff" },
      { "id": "epic", "name": "영웅", "color": "#c08bff" },
      { "id": "legendary", "name": "전설", "color": "#ffcf4a" }
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

  // ===========================================================================
  // 3) 사운드 (sound-architect 계약 — lint-audio.mjs · SoundForge)
  //    무드: 경쾌·아기자기(explore) → 활기찬 전투(combat) → 긴박한 보스(boss).
  //    섹션 전환 + 인텐시티 레이어. 전부 절차 합성 오리지널(CC0).
  // ===========================================================================
  var AUDIO = {
    "version": 1,
    "meta": {
      "slug": "pop-dungeon",
      "tier": 3,
      "mood": "cheerful",
      "genre": "roguelike-shooter",
      "renderStyle": "smooth",
      "engine": "soundforge",
      "originalityNote": "전 트랙·SFX 절차 합성 오리지널 — 어떤 곡의 멜로디/진행도 인용하지 않음(스케일+진행에서 절차 생성). 100% CC0."
    },
    "master": { "volume": -7, "limiter": -1, "reverb": { "decay": 2.0, "send": 0.16 }, "delay": { "send": 0.1 } },
    "budget": { "maxVoices": 16 },
    "bgm": {
      "defaultTrack": "explore",
      "defaultIntensity": 0.4,
      "tracks": {
        "explore": {
          "mood": "cheerful", "scale": "major-pentatonic", "key": "C", "bpm": 124,
          "progression": ["i", "VI", "IV", "V"],
          "layers": [
            { "id": "pad",   "preset": "pad",            "pattern": "chords", "minIntensity": 0,   "vol": -15 },
            { "id": "bass",  "preset": "triangle-bass",  "pattern": "root8",  "minIntensity": 0.25, "vol": -12 },
            { "id": "drums", "preset": "kit",            "pattern": "backbeat", "minIntensity": 0.45, "vol": -12 },
            { "id": "lead",  "preset": "pluck",          "pattern": "arp",    "minIntensity": 0.7, "vol": -14 }
          ]
        },
        "combat": {
          "mood": "heroic", "scale": "mixolydian", "key": "C", "bpm": 132,
          "progression": ["i", "VII", "IV", "i"],
          "layers": [
            { "id": "pad",   "preset": "pad",           "pattern": "chords",   "minIntensity": 0,   "vol": -16 },
            { "id": "bass",  "preset": "triangle-bass", "pattern": "root8",    "minIntensity": 0,   "vol": -11 },
            { "id": "drums", "preset": "kit",           "pattern": "backbeat", "minIntensity": 0.2, "vol": -10 },
            { "id": "lead",  "preset": "square-lead",   "pattern": "arp",      "minIntensity": 0.5, "vol": -13 }
          ]
        },
        "boss": {
          "mood": "tense", "scale": "harmonic-minor", "key": "A", "bpm": 152,
          "progression": ["i", "VI", "V", "i"],
          "layers": [
            { "id": "pad",   "preset": "pad",         "pattern": "chords",     "minIntensity": 0,   "vol": -14 },
            { "id": "bass",  "preset": "saw-bass",    "pattern": "pulse",      "minIntensity": 0,   "vol": -10 },
            { "id": "drums", "preset": "kit",         "pattern": "four-floor", "minIntensity": 0,   "vol": -9 },
            { "id": "lead",  "preset": "supersaw",    "pattern": "arp",        "minIntensity": 0.35, "vol": -12 }
          ]
        }
      },
      "sections": { "explore": "explore", "combat": "combat", "boss": "boss" }
    },
    "sfx": {
      "shoot":   { "layers": [ { "kind": "tone", "wave": "square", "freq": 760, "to": 520, "dur": 0.06, "vol": 0.32 } ] },
      "hit":     { "layers": [ { "kind": "noise", "filter": 1400, "dur": 0.06, "vol": 0.42 },
                               { "kind": "tone", "wave": "square", "freq": 220, "dur": 0.07, "vol": 0.3 } ] },
      "enemyDie":{ "layers": [ { "kind": "noise", "filter": 3200, "dur": 0.05, "vol": 0.5 },
                               { "kind": "boom", "freq": "C3", "dur": 0.22, "vol": 0.55, "delay": 0.005 } ] },
      "dodge":   { "layers": [ { "kind": "noise", "filter": 5200, "dur": 0.14, "vol": 0.32 },
                               { "kind": "tone", "wave": "triangle", "freq": 440, "to": 900, "dur": 0.12, "vol": 0.28 } ] },
      "coin":    { "layers": [ { "kind": "tone", "wave": "square", "freq": 988, "dur": 0.05, "vol": 0.4 },
                               { "kind": "tone", "wave": "square", "freq": 1319, "dur": 0.11, "vol": 0.4, "delay": 0.05 } ] },
      "powerup": { "layers": [ { "kind": "tone", "wave": "square", "freq": 523, "dur": 0.1, "vol": 0.4 },
                               { "kind": "tone", "wave": "square", "freq": 784, "dur": 0.1, "vol": 0.4, "delay": 0.08 },
                               { "kind": "tone", "wave": "square", "freq": 1047, "dur": 0.16, "vol": 0.4, "delay": 0.16 } ] },
      "skill":   { "layers": [ { "kind": "fm", "freq": 660, "harmonicity": 2.5, "modIndex": 10, "dur": 0.3, "vol": 0.4 },
                               { "kind": "noise", "filter": 2200, "dur": 0.18, "vol": 0.28, "delay": 0.02 } ] },
      "nova":    { "layers": [ { "kind": "boom", "freq": "C2", "dur": 0.45, "vol": 0.7 },
                               { "kind": "noise", "filter": 900, "dur": 0.3, "vol": 0.4, "delay": 0.02 },
                               { "kind": "tone", "wave": "square", "freq": 300, "to": 120, "dur": 0.2, "vol": 0.3 } ] },
      "hurt":    { "layers": [ { "kind": "noise", "filter": 700, "dur": 0.18, "vol": 0.5 },
                               { "kind": "tone", "wave": "sawtooth", "freq": 180, "to": 90, "dur": 0.18, "vol": 0.45 } ] },
      "bossWarn":{ "layers": [ { "kind": "metal", "freq": 180, "dur": 0.5, "vol": 0.4 },
                               { "kind": "boom", "freq": "A1", "dur": 0.6, "vol": 0.6, "delay": 0.05 } ] },
      "descend": { "layers": [ { "kind": "tone", "wave": "square", "freq": 523, "dur": 0.12, "vol": 0.4 },
                               { "kind": "tone", "wave": "square", "freq": 659, "dur": 0.12, "vol": 0.4, "delay": 0.1 },
                               { "kind": "tone", "wave": "square", "freq": 1047, "dur": 0.2, "vol": 0.4, "delay": 0.2 } ] },
      "gameover":{ "layers": [ { "kind": "tone", "wave": "triangle", "freq": 392, "dur": 0.22, "vol": 0.5 },
                               { "kind": "tone", "wave": "triangle", "freq": 262, "dur": 0.22, "vol": 0.5, "delay": 0.18 },
                               { "kind": "tone", "wave": "triangle", "freq": 175, "dur": 0.4, "vol": 0.5, "delay": 0.36 } ] },
      "win":     { "layers": [ { "kind": "tone", "wave": "square", "freq": 659, "dur": 0.14, "vol": 0.45 },
                               { "kind": "tone", "wave": "square", "freq": 880, "dur": 0.14, "vol": 0.45, "delay": 0.12 },
                               { "kind": "tone", "wave": "square", "freq": 1319, "dur": 0.3, "vol": 0.45, "delay": 0.24 } ] }
    },
    "balanceConfig": { "maxReverbDecay": 4, "bpmTolerance": 12 }
  };

  g.POP_STYLE = STYLE;
  g.POP_ABILITIES = ABILITIES;
  g.POP_ITEMS = ITEMS;
  g.POP_AUDIO = AUDIO;
  if (typeof module !== 'undefined' && module.exports) module.exports = { STYLE: STYLE, ABILITIES: ABILITIES, ITEMS: ITEMS, AUDIO: AUDIO };
})(typeof window !== 'undefined' ? window : globalThis);
