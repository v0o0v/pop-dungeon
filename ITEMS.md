# 팡팡 던전 — 아이템 바이블 (ITEMS.md)

> **단일 진실(ITEMS-SINGLE-SOURCE).** 모든 아이템 효과·등급·강화·드랍·비주얼은 `data/items.data.js`(브라우저 전역 `window.POP_ITEMS` + Node `module.exports.ITEMS`) 가 유일한 출처다.
> `tools/emit-json.mjs` 가 `data/index.mjs` 집계 진입점을 통해 `items.json` 으로 추출하고, `game/stats.js` 의 `recomputeStats()` 가 효과를 가/곱연산으로 합산해 발사·이동·생존 스탯에 반영한다.
> 린트: `node tools/emit-json.mjs && node D:/ClaudeCowork/JSGameEngineForCC/skills/wgf-item-architect/tools/lint-items.mjs items.json` → error/warn 0.
> 설계 패스(③④)와 밸런스 검수 패스(⑤ lint)는 분리한다(ITEMS-AUTHOR-VS-REVIEW).

## §0. 메타 — 복잡도·핵심 모델

- **복잡도 티어 4(RPG 인벤토리).** Hades식 영속 진행 + 빌드 시너지(`FE-BUILD`) + 수집(`FE-COLLECT`) + 위험보상(`FE-RISK-REWARD`)이 코어 재미. 대규모 RPG 개편 플랜(§3 Phase 1 L2) 정합 — 단일 아레나 렐릭 14종에서 6슬롯 영속 장비 + 강화 + 런 휘발 분리로 격상.
- **핵심 모델 2층(영속/휘발 경계 — 플랜 §2.3):**
  - **영속(永)** — 마을에서 관리, 죽어도 유지: **6슬롯 장비**(무기1+방어구3+악세2) + 강화(+0~+9) + 마을 스탯 분배 + 골드.
  - **휘발(揮)** — 던전 런에서 줍고 죽으면 소멸: **런 부적**(기존 렐릭 메카닉 재활용·확장) + 소모품 + 던전 코인.
- **곱연산 희소 격리.** 6슬롯 장비는 **전부 가산**(슬롯 수가 곱폭발의 자연 상한이지만 보수적으로 가산만 사용 — `SYN-ADD-VS-MULT`). 곱연산 소스(`damageMult`·`coinMult`)는 **런 휘발 부적 2종에만**(`slot` 없음) 두고 `maxStacks:1` 캡으로 격리. → `lint-items.mjs` (d) mult-explode 통과(slot 장비는 곱산 검사 제외, 휘발 곱산 2 ≤ multCap 2).
- **서사 정합(IDENT-LUDO-HARMONY).** 무기 = 호두·별이가 만든 팝총의 개조 계보(STORY §8 '팝총'). 방어구·악세 = 솔뫼 마을 물건 + 별 모티프(반창고·수첩·손수건·별 지도 — STORY §6 setup 단서를 장비화). 강화 = 별빛으로 '고쳐 쓰는' 행위(쏘기=정화, 줍기=수복의 주제 반복).

## §1. 활성 범주 (행위축 — CAT-*)

| kind | slot | 영속/휘발 | 역할 | 카운트 |
|---|---|---|---|---|
| equipment | weapon | 영속 | 발사 메카닉 정체성 | 6 |
| equipment | helm | 영속 | 기력·스킬·시야 | 5 |
| equipment | armor | 영속 | 체력·방어·생존 | 6 |
| equipment | boots | 영속 | 이동·닷지 | 5 |
| equipment | amulet | 영속 | 크리·행운·특수 | 5 |
| equipment | ring | 영속 | 발사 보조·유틸 | 5 |
| equipment | (없음) | **휘발** | 런 부적(렐릭 재활용) | 8 |
| consumable | — | 휘발 | 회복·기력 | 3 |
| material | — | 영속 | 강화 재료(지역 드랍) | 4 |
| currency | — | 영속 | 골드(상점·강화·리롤) | 1 |

- **전체 48 레코드**(장비 32 + 휘발 부적 8 + 소모품 3 + 재료 4 + 통화 1) — 작은 카탈로그 상한(전체 24~40) 소폭 초과하나 6슬롯×4등급 RPG 정합 범위. 세션 풀(한 런 노출)은 휘발 부적 8 + 소모품 3 ≈ 11로 권장 범위(12~24) 내.

## §2. 이코노미 & 파워커브 (ECON-*)

### 통화 — 골드(영속)
- **골드**: 상점 구매·강화·리롤의 단일 영속 통화. 기존 '코인'을 골드로 격상(STORY 무관·시스템 통화). 던전에서 줍는 '던전 코인'은 런 종료 시 `goldRecovery(runGold)`(L4 SaveStore 게이트)로 영속 골드에 부분 커밋.
- **획득**: 적 처치·방 클리어·보물방·보스 확정 드랍·아이템 판매(매입가 = 구매가의 40%).

### 등급 파워예산 밴드 (budget 단위 · rarityBands)
| 등급 | 색역할 | weapon | helm/armor/boots/amulet/ring | 비고 |
|---|---|---|---|---|
| 일반(common) | steel 회청 | 6~10 | 5~9 | 시작·초반 |
| 희귀(rare) | hero 청록 | 10~15 | 9~14 | 중반 핵심 |
| 영웅(epic) | arcane 보라 | 15~21 | 14~20 | 후반 빌드 완성 |
| 전설(legendary) | gold 금 | 21~28 | 20~26 | 결정적 정체성 |

- 무기는 발사 정체성이 강해 동일 등급에서 타 슬롯보다 budget 상한 소폭 높음. lint `rarityBands` 는 슬롯 무관 통합 밴드로 설정(weapon 상단·타 슬롯 하단을 모두 포괄하는 넓은 밴드)해 거짓 경보 방지.

### 강화 (+0 ~ +9 · 실패 없음 단순형)
- **규칙:** 각 장비는 `enhance` 블록(키별 `perLevel` 증분 + 등급별 비용 곡선)을 가진다. 강화 +N 시 effect 의 해당 키가 `base + perLevel × N` 으로 스케일된다. **실패·파괴 없음**(모바일 캐주얼 — 호딩/스트레스 회피, `UTIL-NO-FRUSTRATION`).
- **비용 곡선(골드 + 재료):** 등급·레벨 단조 증가. `cost(N) = goldBase × (N+1) × rarityMult`, 재료는 `+1~+3` 일반재료, `+4~+6` 희귀재료, `+7~+9` 영웅재료(지역 드랍). 정확 수치는 §3 각 레코드 `enhance.costCurve`.
- **계산 위치(L4 정합 대기):** `SaveStore` 가 `effectAt(item, enh)` 로 effect 를 스케일해 `recomputeStats` 입력에 넘긴다(L4 공표 계약 준수). 본 데이터는 base effect + `enhance.perLevel` 만 정의하고, 합산 로직은 비포함(파일 경계 준수).

## §3. 아이템 카탈로그

> effect 키는 `game/stats.js recomputeStats` 가 해석하는 기존 키 집합과 정합(가산 키 다수 + 곱산 2 + spreadAngle max). 신규 직접 키(`maxHpFlat`·`moveSpeedFlat`·`critChance`·`critDamage`·`visionRadius`)는 L4 v2 recomputeStats 확장 입력으로 공표받아 정합(대기 시 보수적으로 기존 키 우선).

### A. 무기(weapon) — 팝총 개조 계보 6종

| id | 이름 | 등급 | 주 effect | focal 축 | budget | 서사 |
|---|---|---|---|---|---|---|
| w_twinpop | 쌍발 팝총 | common | extraProjectiles+1, spreadAngle 8 | 멀티샷 | 8 | 둘이 처음 만든 두 갈래 총 |
| w_longpip | 길쭉 씨앗총 | common | pierce+1, damage+2 | 관통 | 9 | 별이가 깎은 긴 총열 |
| w_bouncekit | 통통 개조관 | rare | bounce+1, damage+3 | 반사 | 13 | 벽을 타게 만든 개조 |
| w_seekerpop | 유도 팝총 | rare | homing 0.14, fireRateFlat-0.02 | 유도 | 13 | 별을 따라가는 탄 |
| w_splitstar | 별조각 산탄총 | epic | split+2, extraProjectiles+1 | 분열 | 19 | 별조각을 쏘는 총 |
| w_heartcannon | 별심장 대포 | legendary | damage+10, bulletSize 0.6, fireRateFlat-0.03 | 폭딜 | 26 | 별의 심장 파편을 장전한 결전 무기 |

- 슬롯 내 분산: 각 무기가 서로 다른 주축(멀티샷/관통/반사/유도/분열/폭딜)을 focal 로 가져 **같은 slot 파레토 지배 0**(effect 키 셋이 겹치되 한쪽이 다른 쪽 전 축 우월이 되지 않음 — 예: w_longpip 은 pierce 를, w_twinpop 은 extraProjectiles 를 가져 상호 비지배).

### B. 투구(helm) — 별 모티프 머리장식 5종

| id | 이름 | 등급 | 주 effect | focal 축 | budget |
|---|---|---|---|---|---|
| h_strawhat | 솔뫼 밀짚모자 | common | pickupRadius+50 | 픽업 | 6 |
| h_goggles | 별보기 고글 | common | energyRegen+3, energyMax+15 | 기력 | 8 |
| h_starcrown | 작은 별관 | rare | skillDamage+12 | 스킬 | 12 |
| h_owlhood | 부엉이 두건 | epic | energyRegen+5, skillDamage+14 | 스킬+기력 | 19 |
| h_starsight | 별빛 면류관 | legendary | skillDamage+20, energyMax+30 | 스킬 정점 | 24 |

### C. 갑옷(armor) — 솔뫼 마을 옷·반창고 6종

| id | 이름 | 등급 | 주 effect | focal 축 | budget |
|---|---|---|---|---|---|
| a_patchvest | 반창고 조끼 | common | maxHp+1 | 체력 | 7 |
| a_quilt | 누비 외투 | common | armor+1, contactDamage+8 | 방어 | 8 |
| a_thornshell | 가시 등껍질 갑옷 | rare | contactDamage+12, armor+1 | 가시 | 11 |
| a_starplate | 별무늬 흉갑 | rare | maxHp+2 | 체력 | 12 |
| a_guardianquilt | 수호 누비갑 | epic | maxHp+2, armor+2 | 탱크 | 18 |
| a_heartward | 별심장 보호대 | legendary | maxHp+3, armor+2, contactDamage+10 | 생존 정점 | 24 |

### D. 신발(boots) — 이동·닷지 5종

| id | 이름 | 등급 | 주 effect | focal 축 | budget |
|---|---|---|---|---|---|
| b_sandals | 마을 짚신 | common | pickupRadius+40 | 픽업 | 6 |
| b_rabbitsole | 토끼 밑창 | common | fireRateFlat-0.03 | 연사 | 8 |
| b_springboots | 통통 스프링 부츠 | rare | dodgeCharges+1 | 닷지 | 12 |
| b_dashshoes | 들이받기 부츠 | epic | dodgeCharges+1, dashDamage+14 | 대시딜 | 18 |
| b_starstep | 별걸음 신 | legendary | dodgeCharges+1, dashDamage+20, fireRateFlat-0.02 | 기동 정점 | 24 |

- `b_springboots`·`b_dashshoes`·`b_starstep` 은 `grantsVerb:"extra_dodge"`(닷지 충전 부여 — 기존 팡팡 부츠 메카닉 계승).

### E. 목걸이(amulet) — 별 부적 5종

| id | 이름 | 등급 | 주 effect | focal 축 | budget |
|---|---|---|---|---|---|
| m_cloverpend | 네잎 클로버 목걸이 | common | luck+1 | 행운 | 6 |
| m_clawtooth | 들짐승 이빨 | common | damage+3 | 화력 | 7 |
| m_starlocket | 별 로켓 | rare | skillDamage+10, energyRegen+2 | 스킬 | 12 |
| m_glasscharm | 유리 별 부적 | epic | damage+8, maxHp-1 | 글래스(가산) | 17 |
| m_starheart | 별의 심장 조각 | legendary | damage+10, skillDamage+12 | 만능딜 | 24 |

- `m_glasscharm` 은 **곱연산 없이 가산** 글래스(`damage+8, maxHp-1`) — 곱폭발 회피하며 위험보상 결을 유지(`FE-RISK-REWARD`). 곱연산 글래스(`damageMult`)는 휘발 부적으로 이동(§3-G).

### F. 반지(ring) — 작은 별 반지 5종

| id | 이름 | 등급 | 주 effect | focal 축 | budget |
|---|---|---|---|---|---|
| r_pebblering | 조약돌 반지 | common | damage+2 | 화력 | 6 |
| r_magnetring | 자석 반지 | common | pickupRadius+45 | 픽업 | 6 |
| r_pierceloop | 관통 고리 | rare | pierce+1 | 관통 | 11 |
| r_bounceloop | 반사 고리 | rare | bounce+1 | 반사 | 11 |
| r_twinstar | 쌍별 반지 | epic | extraProjectiles+1, spreadAngle 8 | 멀티샷 | 16 |

### G. 런 휘발 부적(equipment, slot 없음) — 던전에서 줍고 죽으면 소멸 8종

> 기존 렐릭 14종의 핵심 메카닉을 재활용·압축. `slot` 없음 → lint mult-explode 검사 대상(곱산 2종만, maxStacks:1 캡).

| id | 이름 | 등급 | 효과 | role/tags | budget |
|---|---|---|---|---|---|
| run_glassheart | 유리 심장 | epic | damageMult ×1.4, maxHp-1 (maxStacks:1) | payoff/glass·risk | 15 |
| run_clover | 행운 클로버 | epic | luck+2, coinMult ×1.25 (maxStacks:1) | utility/luck·economy | 13 |
| run_energycore | 기력 코어 | rare | energyRegen+4, energyMax+25 | enabler/skill·energy | 9 |
| run_skillcharm | 스킬 부적 | epic | skillDamage+18 | payoff/skill | 14 |
| run_splitseed | 분열 씨앗 | epic | split+2 | core/split·multishot | 14 |
| run_homingheart | 유도 하트 | rare | homing 0.12 | core/homing·seek | 10 |
| run_thornband | 가시 띠 | rare | contactDamage+10, armor+1 | survival/defense | 9 |
| run_bigpop | 왕 팝 | rare | bulletSize 0.6, damage+4 | core/size·damage | 10 |

- **곱연산 2종만**: `run_glassheart`(damageMult)·`run_clover`(coinMult) — 둘 다 `slot` 없음·`maxStacks:1`. → mult-explode (d): 동시 곱산 소스 2 ≤ multCap 2 통과, 각 cap 명시.
- enabler(`run_energycore`)/payoff(`run_skillcharm`)는 공유 태그 `skill` 로 시너지 성립 — lint (f) 고립 회피.

### H. 소모품 3종 (consumable · 휘발)

| id | 이름 | 등급 | 효과 | cost | budget |
|---|---|---|---|---|---|
| c_poppotion | 팡 물약 | common | heal+1 | 6 | 4 |
| c_megapotion | 왕 물약 | rare | heal+3 | 14 | 9 |
| c_energydrink | 기력 드링크 | common | energyRestore+60 | 5 | 4 |

### I. 강화 재료 4종 (material · 영속 · 지역 드랍)

| id | 이름 | 등급 | 용도 | 드랍 지역 | budget |
|---|---|---|---|---|---|
| mat_starshard | 별조각 | common | +1~+3 강화 | region 1~4 | 2 |
| mat_brightore | 빛돌 | rare | +4~+6 강화 | region 4~7 | 4 |
| mat_corefrag | 핵 파편 | epic | +7~+9 강화 | region 7~10 | 7 |
| mat_dreamdust | 악몽 먼지 | rare | 리롤·접사 재롤 | 전 지역(보스) | 3 |

### J. 통화 1종 (currency · 영속)

| id | 이름 | 효과 | budget |
|---|---|---|---|
| gold | 골드 | value 1 (상점·강화·리롤) | 1 |

## §3.5 접사(Affix) 시스템 — 소폭 (AFX-*)

- **장비 드랍 시 1~2개 랜덤 부옵 접사**가 base effect 에 더해진다. 주스탯(slot focal)은 고정, 부옵만 롤.
- **접사 풀(affixPool)**: `data` 의 `affixes` 블록에 정의 — 키별 `{ id, key, tiers:[등급별 값], rarityWeight }`. 예: `affix_dmg`(damage +1~+4), `affix_pickup`(pickupRadius +20~+60), `affix_armor`(armor +1), `affix_luck`(luck +1), `affix_energyregen`(energyRegen +1~+3).
- **곱연산 접사 없음** — 전부 가산(곱폭발 회피). 접사는 base 와 같은 가산 키만 사용해 recomputeStats 가 추가 분기 없이 합산.
- **재롤**: `mat_dreamdust`(악몽 먼지) + 골드로 부옵 재롤. 데이터는 풀·등급별 값·가중치만 정의, 롤 로직은 SaveStore/획득 런타임 소관(파일 경계).

## §4. 시너지 & 세트 (SYN-*)

- **스킬 빌드 세트(set_skill):** `run_energycore`(enabler) + `run_skillcharm`(payoff) + helm `h_*`(skillDamage) 계열 → 2조각 보너스 `skillDamage+10, energyRegen+2`. 노바·궁 빌드 완성. (members ≥ threshold 보장 — lint (f) 도달 가능.)
- **별빛 정점 세트(set_starpeak):** 전설 장비 3개(`w_heartcannon`/`a_heartward`/`m_starheart` 중 2) → 보너스 `damage+6`. 엔드게임 보상.
- **탄막 빌드(비세트, 태그 시너지):** `w_twinpop`/`r_twinstar`(multishot) + `run_splitseed`(split) + `r_pierceloop`/`run_homingheart` → 한 발이 여럿으로 퍼지는 불릿헤븐. 곱 아닌 가산 누적이라 폭발 안전.
- **튕김 빌드:** `w_bouncekit`/`r_bounceloop`(bounce) + pierce → 좁은 방 누적 타격.
- **글래스 캐논:** `m_glasscharm`(가산 글래스) + `run_glassheart`(곱 글래스) + `w_heartcannon` → 체력 걸고 폭딜(`FE-RISK-REWARD`).
- **탱크 빌드:** `a_guardianquilt`/`a_heartward`(maxHp·armor) + `run_thornband`(가시) → 생존·반사딜.

## §5. 드랍 & 획득 (ECON-* · 지역별 테이블)

- **장비 드랍**: 적 처치 시 낮은 확률(luck 보정), 보물방 확정, 보스 확정. 등급은 지역 깊이 + luck 으로 가중.
- **지역별 드랍 테이블(dropTables)**: `data` 의 `dropTables` 블록 — region 1~10 각 `{ region, equipmentPool:[id...], materialPool:[id...], rarityWeights:{common,rare,epic,legendary} }`. 깊은 지역일수록 영웅·전설 가중 상승, 재료 등급 상향.
- **보스 확정 드랍(bossDrops)**: region 마다 보스 처치 시 확정 장비 1 + 재료 — region 10 최종보스 '악몽의 핵'은 전설 무기 `w_heartcannon` 확정(서사: 별의 심장 파편).

## §6. 진행 게이트 (UTIL-* · gates)

- 본 게임은 **능력 게이트(키·새 동사)를 장비로 강제하지 않는다**(미로 진행은 floors/방 그래프 소관 — L3·L6). 장비는 파워 성장이지 진행 잠금이 아님 → `gates` 블록 비움(softlock 검사 대상 없음, lint (g) 무위반).
- `grantsVerb:"extra_dodge"`(부츠 3종)는 진행 게이트가 아니라 **닷지 충전 부여**(능력 강화) — gates 그래프와 무관.

## §7. 비주얼 스타일가이드 (UX-* · 헤더 상수)

- **master_palette 상속(D6):** 색은 `data/style.data.js`(style-architect 상류 권위) `master_palette.ramps` 를 참조한다. visual.palette 는 자유 hex 가 아니라 램프 색을 명시(아이템 아이콘이 게임 전체 룩과 응집).
- **슬롯별 시각 문법:**
  - weapon → torch/gold 램프(따뜻한 금속·불빛), focal = 총열 실루엣 + 팝총 둥근 입구.
  - helm → steel/arcane(머리장식), focal = 별 모티프.
  - armor → hero/steel(천·갑각), focal = 반창고·별무늬.
  - boots → hero/torch(고무·스프링), focal = 밑창.
  - amulet → gold/arcane(별 부적), focal = 별·클로버.
  - ring → gold/steel(작은 고리), focal = 보석 1점.
  - 휘발 부적 → arcane/scarlet(룬·결정), focal = 추상 룬.
- **등급 시각언어(UX-RARITY-MULTI-CHANNEL · 색 단독 금지):** 테두리 두께 + 모서리 핍 수(common 0·rare 1·epic 2·legendary 3) + 글로우 강도로 등급을 다채널 표현. 색역할: common=steel, rare=hero, epic=arcane, legendary=gold(§2 밴드 정합).
- **광원:** STYLE NW 상속. **각 레코드 visual.{silhouette,material,palette,focal_motif} 필수 채움**(lint (a) 비주얼 슬롯 — currency 제외).

## §8. 인벤토리 & UX (UX-*)

- **6슬롯 패널**: weapon·helm·armor·boots·amulet·ring 도식 + 착용/해제·강화·매도 진입(Village 대장간·상점 — L5 소관). 미착용 장비는 inventory 리스트.
- **툴팁**: 이름·등급색·effect 축·강화수치(+N)·접사 부옵·flavor. 비교 시 착용 중 장비와 델타 표시.
- **모바일**: 큰 탭 타깃, 등급색 + 핍으로 한눈 식별, 스크롤 그리드.

## §9. 밸런스 점검 로그 (검수 패스 — 작성과 분리)

| 일시 | 도구 | 결과 | 조치 |
|---|---|---|---|
| (검수 패스에서 기록) | `emit-json.mjs` + `lint-items.mjs items.json` | error/warn 0 목표 | — |

- **밸런스 가드(린트 통과 근거):**
  - (c) dominant: 6슬롯 분리 + 슬롯 내 focal 축 분산 → 파레토 지배 0.
  - (d) mult-explode: 곱산 2종(`run_glassheart`·`run_clover`) 모두 `slot` 없음·`maxStacks:1` ≤ multCap 2.
  - (e) rarity-band: 통합 밴드(weapon 상단·타슬롯 하단 포괄)로 거짓경보 0, 각 레코드 budget 밴드 내.
  - (b) dead-item: 슬롯 내 등급별 budget 단조 증가, 효율 중앙값 0.4배 이상.
  - (f) synergy: enabler/payoff(`run_energycore`/`run_skillcharm`) 공유 태그 `skill`, 세트 members ≥ threshold.
  - (a) schema: 전 레코드 kind enum·visual 4슬롯(currency 제외) 채움.

## §10. 빌드 라우팅 메모

- 데이터 로드: `data/items.data.js` → `window.POP_ITEMS` → `game/stats.js recomputeStats` effect 디스패치. 강화 스케일(`effectAt`)·접사 롤·드랍 롤은 SaveStore(L4)·획득 런타임 소관(본 파일은 base effect + enhance.perLevel + affixPool + dropTables 데이터만).
- 영속/휘발 경계: equipment(slot 有)·material·currency = 영속(SAVE), equipment(slot 無 = 런 부적)·consumable = 휘발(RUN). SaveStore 가 단일 게이트로 강제(L4).
- 아이콘 핸드오프: 각 레코드 visual.* → sprite-forge(픽셀) — §7 헤더 상수(master_palette·등급 색·NW 광원) 전달.
- IP 안전: 전 아이템명·외형 오리지널(추상 룬·젬·솔뫼 마을·별 모티프). 상용 게임 고유 아이템명/아이콘 미사용(`ip-license-guard`). STYLE `ip_redwords` 정합.
