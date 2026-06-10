# 팡팡 던전 — 캐릭터 능력/스킬 바이블 (ABILITIES.md)

> 직업 **팝거너(Pop Gunner)** 의 능력 킷. 단일 진실 데이터는 `data/abilities.data.js` → `emit-json.mjs` → `abilities.json`(ability-architect 계약).
> 런타임은 `engine/abilitykit.js`(쿨다운·자원·충전·콤보·스킬트리 `learn`/`addPoints`/`serialize`)가 굴리고,
> 효과 dispatch·로드아웃 해석은 `game/abilities-wiring.js`(신규 배선 파일)가 담당한다. **게임 씬(Game.js 등)·엔진은 수정하지 않는다.**
> 린트: `node tools/emit-json.mjs && node D:/ClaudeCowork/JSGameEngineForCC/skills/wgf-ability-architect/tools/lint-abilities.mjs abilities.json` → 현재 결함 0(error/warn/info 0).

---

## §0 메타 (복잡도·핵심모델)

- **티어 3**(중간복잡도, RPG 개편). 코어 동사(이동·자동발사·줍기) 위에 **이동기 1(고정) + 액티브 풀 9종(loadout) + 패시브 6 + 스킬트리 3계열 35노드**.
- **핵심 모델 1개:** *단일 직업 + 로드아웃 + 특성 트리*. 클래스 분기 없이, 배운 액티브를 `skill1/skill2/ult` 슬롯에 자유 장착하고, 3계열(화력·기동·별빛) 트리로 빌드를 가른다.
- **모바일 버튼 예산 4 슬롯(dodge·skill1·skill2·ult)을 정확히** 채움 — 풀의 나머지 액티브는 `slot:null`(배워두고 마을에서 슬롯에 끼움). 과설계 회피.
- **서사 정합(STORY.md):** 화력=쏘기=정화, 기동=내려가기=호두의 성격, 별빛=별이가 가르쳐 준 빛(지키고·정화하고·되돌림). 스킬포인트는 **별지기 할아버지**가 배분(잊혀가던 별의 길을 다음 세대에 전함).

## §1 킷 · 역할 구성

| 슬롯 | 능력 | 종류 | 계열 | 역할 | 비용/쿨다운 |
|---|---|---|---|---|---|
| **dodge**(고정) | 팡 구르기 | movement | — | mobility | 충전 2 · 회복 1.05s |
| skill1/2/ult(풀) | 팡 노바 | active | 화력 | burst | 기력 35 · 쿨 5s |
| 〃 | 산탄 팡 | active(aim) | 화력 | burst | 기력 22 · 쿨 3.5s |
| 〃 | 응축 팡 | active(charge) | 화력 | burst | 기력 30 · 쿨 6s |
| 〃 | 터보 팝 | active | 화력 | sustain | 기력 30 · 쿨 8s |
| 〃 | 팡 점멸 | active(aim) | 기동 | mobility | 기력 28 · 쿨 7s |
| 〃 | 혜성 돌진 | active(aim) | 기동 | mobility | 기력 26 · 쿨 5.5s |
| 〃 | 별빛 보호막 | active | 별빛 | survival | 기력 34 · 쿨 12s |
| 〃 | 정화의 파동 | active | 별빛 | control | 별빛 40 · 쿨 14s |
| **ult**(풀) | 황금 팝 폭풍 | ultimate | 화력 | burst | 별빛 100 · 쿨 30s |
| **ult**(풀) | 별똥 소나기 | ultimate(aim) | 별빛 | burst | 별빛 100 · 쿨 28s |
| 패시브 | 팝건 숙련 / 매의 눈 | passive | — | core | — (시작 보유) |
| 패시브 | 과압 탄창 / 날랜 발놀림 / 별빛 심장 | passive | 화력/기동/별빛 | payoff·mobility | — (트리 해금) |

- **액티브 풀 9종**(노바·산탄·응축·터보·점멸·돌진·보호막·정화·궁극2) + 이동기 1 = **액티브 종 10**. 동시 바인딩은 4(dodge+3) → 모바일 버튼 예산 준수.
- 궁극기 2종은 **같은 ult 슬롯·같은 자원(별빛 100)** 으로 상호 배타 장착 — 빌드에 맞춰 근접(황금 폭풍) vs 원거리(별똥 소나기) 선택.

## §2 자원 · 이코노미

- **기력(energy)** : 최대 100, 초당 9 리젠, 소비 후 1.0초 지연 뒤 리젠. 액티브 대부분의 주 연료. 트리·아이템(기력 코어)으로 최대치·리젠 증가.
- **별빛(starlight)** : 최대 100, **리젠 0 · 시작 0**. **처치로 충전**(런타임 `onKill` → 패시브 `starlightOnKill`/트리 `star_1·star_9`로 충전량↑). 궁극기 2종 + 정화의 파동이 소비. → "모아서 쓰는" 자원이라 **킬 루프가 곧 자원 루프**(별빛 빌드의 정체성).
- 기회비용: 기력 액티브는 쿨다운+기력으로 스팸 억제, 별빛 액티브는 처치 누적이라 함부로 못 씀. 두 자원이 다른 리듬(상시 vs 축적)을 만든다.

## §3 능력 카탈로그 (계열별)

### 화력계 (firepower · 색 torch/gold/scarlet)
- **팡 노바**: 반경 150 충격파, 피해 45 + 넉백 260, 근처 적탄 제거. 둘러싸였을 때 탈출 버스트.
- **산탄 팡**(조준): 부채꼴 7펠릿(각 16, 콘 50°, 사거리 230). 근접 전탄 명중=폭딜 / 원거리=광역. 저비용·저쿨(스팸 가능 화력 코어).
- **응축 팡**(차지): 0.7s 차지 → 직선 관통탄(피해 90, 관통 4, 사거리 520). 일렬 적·보스 약점 한 방. 고비용·고위험.
- **터보 팝**: 4초간 발사 속도 ×1.8(`maxStacks:1`). 자동발사 버프 → 화력 윈도. enabler(과압 탄창·매의 눈과 곱).

### 기동계 (mobility · 색 hero)
- **팡 점멸**(조준): 220px 순간이동 + 출발 자리 잔향 폭발(24, 반경 70). 끼인 데서 빠져나오며 역습.
- **혜성 돌진**(조준): 300px 긴 대시(궤적 피해 30, 무적 0.28s). 이동+화력+회피 삼중주. 진입기로 산탄 팡 콤보.

### 별빛계 (starlight · 색 arcane/gold)
- **별빛 보호막**: 5초 흡수막(60) + 반사 25%(`maxStacks:1`). 생존기.
- **정화의 파동**: 별빛 40 소비. 반경 200 적탄 정화 + 둔화 45%/3s + 치유 1칸. 별빛 자원으로 도는 control.
- **황금 팝 폭풍**(ult): 별빛 100. 5초간 오비탈 8개 회전(피해 30). 근접 회전 압박형 궁극.
- **별똥 소나기**(ult, 조준): 별빛 100. 지정 구역(반경 260)에 별똥 14발 낙하(각 22). 원거리 광역 폭격형 궁극 — 황금 폭풍의 대척점.

### 패시브
- **팝건 숙련**(코어): 기본 피해 +2. **매의 눈**(코어): 크리 10% + 추가피해 6. (둘 다 시작 보유)
- **과압 탄창**(트리 fire_10, payoff): 크리 추가피해 +10, 스킬 피해 +8.
- **날랜 발놀림**(트리 mobi_2): 이속 +18, 구르기 충전 +1.
- **별빛 심장**(트리 star_2, payoff): 최대체력 +1, 기력 리젠 +3, 처치당 별빛 +4.

## §4 발동 · 게임필 (선딜·발동·후딜)

- **팡 구르기:** 입력 즉시 대시 + 잔상 3겹 + 청록 퍼프, 전반 0.36s 무적. "죽을뻔→통과" 쾌감의 핵심.
- **응축 팡:** `cast 0.7 / active 0.1 / recovery 0.25` — 유일한 차지기. 차지 링 수축 텔레그래프 → 발사 섬광. 위험/보상이 선딜로 표현.
- **혜성 돌진/팡 점멸:** 조준 방향으로 발동(`input:aim`). 돌진은 잔상 5겹+충돌 스파크, 점멸은 출발 잔향+도착 글린트.
- **궁극기:** 황금 폭풍=화면 플래시+회전 오비탈 / 별똥 소나기=바닥 표적 링(텔레그래프) → 순차 착탄. 별빛 100을 모아 쓰는 한 방.

## §5 진행 · 획득 (스킬트리)

- **레벨 곡선**: maxLevel 50, `xpToNext(L) = round(40 × 1.18^(L-1))`. 레벨당 스킬포인트 1 + 보너스 레벨(10/20/30/40/50). 50렙까지 약 60포인트.
- **트리 총 비용 65포인트** → 풀 트리 직전에서 멈춤 = **의미 있는 분기 선택 강제**(한 런/한 캐릭터로 전 노드 못 찍음).
- **배분처**: 마을 **별지기 할아버지**(`village_star_keeper`). 리스펙 가능(골드 비용) → 빌드 실험 허용.
- **트리 구조(35노드 = root 1 + 화력 12 + 기동 11 + 별빛 11):**
  - **root `n_root`**(비용 0, 시작 학습) → 세 계열 1번 노드로 분기.
  - **화력**: 직선 줄기(fire_1~10) → **2캡스톤 분기**(fire_11 이중 장전 / fire_12 황금 폭풍 해금).
  - **기동**: 줄기(mobi_1~8) → **분기**(mobi_9 회피 숙달→mobi_11 픽업 확장 / mobi_10 민첩 사격).
  - **별빛**: 줄기(star_1~8) → **분기**(star_9 충만한 별빛→star_10 별똥 소나기 / star_11 수호의 가호).
- **노드 종류**: `unlock`(액티브/패시브 해금 grants) · `passive`(상시 스탯) · `enhance`(기존 능력 강화). 패시브 노드 effect 키는 `game/stats.js` recomputeStats 입력 계약(worker-l4 확정)을 따른다 — 본 데이터의 `damage`·`projectiles` 는 배선(`getPassiveEffects`)에서 계약 키 `flatDamage`·`extraProjectiles` 로 정규화된다(§9 참조). 합산 순서: 베이스 → 영속 장비6+강화 → 마을 스탯 → **스킬트리 패시브** → 런 휘발 아이템(곱산 multCap=2).

## §6 시너지 · 콤보 (sets · enabler/payoff)

- **세트 「정화의 화력」**(화력 태그 2+): 스킬 피해 +10%. enabler=터보 팝(fireRate↑) · payoff=과압 탄창(crit·skill↑).
- **세트 「호두의 발걸음」**(기동 태그 2+): 이동 중 피해 감소. 닷지·점멸·돌진 회전 빌드.
- **세트 「별의 가호」**(별빛 태그 2+): 별빛 충전 속도 +15%. enabler=별빛 심장(충전·생존) · payoff=별똥 소나기/정화.
- **콤보 의도**: 이동기(돌진/점멸)로 진입 → 산탄 팡 근접 전탄 명중=폭딜. 처치 → 별빛 충전 → 궁극/정화 회전. 곱연산은 터보 팝 한 종(`maxStacks:1`)으로 격리.
- 아이템 연계: 기력 코어(energyMax↑)+스킬 부적(skillDamage↑) → 별빛/화력 액티브 회전. 팡팡 부츠 → 닷지 충전·대시 피해(item-architect `grantsAbility`/effect 교차).

## §7 능력 게이트

- 본 게임은 능력 게이트(`gates`)를 쓰지 않는다 — 진행은 스킬트리(레벨·포인트)와 월드맵 체크포인트(L7 소관)로 처리. `grantsVerb`(dodge·blink·comet)는 던전 이동 동사로 활용 가능하나 softlock 게이트는 미사용.

## §8 비주얼 스타일가이드 (아이콘 핸드오프)

- **상류 권위**: `data/style.data.js` → `assets/palette.master.json`(style-architect). 모든 `visual.palette` 슬롯은 **master_palette 램프 참조 표기**(`torch.3`, `hero.2`, `arcane.2`, `gold.2`, `white` 등 — 자유 hex 금지)로 채워 게임 전체 룩과 응집.
- **계열 색 문법**: 화력=torch/gold/scarlet(따뜻), 기동=hero(청록), 별빛=arcane/gold(보라+금). 궁극기는 `rarity_visual`(궁극 테두리 글로우) 슬롯으로 등급 표시.
- **공통**: 광원 NW 상속, 셀 셰이딩, chibi-round, outline full(STYLE.md §shading). 각 능력 `visual.{silhouette,material,palette,focal_motif}` 필수 + 액티브는 `vfx_motif`, 위험/적 가시 능력은 `telegraph_read`.
- 핸드오프: 픽셀이므로 `sprite-forge`(아이콘 프레임) 입력으로 `visual.*` 한 블록을 결정론적으로 넘긴다.

## §9 HUD · 입력 (배선 — `game/abilities-wiring.js`)

- **HUD**(기존 `game/scenes/HUD.js`): 4버튼(dodge·skill1·skill2·ult) 유지. 버튼이 표시/발동하는 능력 id는 **로드아웃**(`SAVE.skills.loadout`)에서 동적으로 읽는다.
- **배선 파일 `game/abilities-wiring.js`**(신규, 본 lane 산출): 엔진/씬을 수정하지 않고 다음을 제공 —
  - `resolveLoadout(save)` : SAVE.skills.loadout → `{ skill1, skill2, ult }` 능력 id(미설정 시 학습된 풀에서 기본값).
  - `applyAbilityEffect(scene, ab, ctx)` : `ab.id` 별 효과 dispatch 헬퍼(노바·산탄·응축·터보·점멸·돌진·보호막·정화·궁극2). 씬이 onActivate 에서 호출.
  - `onKillStarlight(kit, amount)` : 처치 시 별빛 충전(`starlightOnKill` 합산값 반영).
  - `attachWiring(scene, save)` : AbilityKit `attach` 후 로드아웃·콜백을 연결하는 단일 진입점(Dungeon 씬 L6 가 사용).
  - `getPassiveEffects(learnedNodes)` : recomputeStats 소스[4] 입력 계약(worker-l4). **stats.js 가 인식하는 키만** 정규화해 `[{effect}]` 반환.
  - `critFromPassives(learnedNodes)` · `starlightPerKill(learnedNodes)` : 보조 경로(아래 참조).
- **크리·별빛 키 처리(worker-l4 Q2 확정):** `critChance`·`critBonusDamage`·`starlightOnKill` 은 stats.js applyEffect 가 인식하지 않으므로 **`getPassiveEffects` 의 stat 스트림에서 제외**한다(계약 클린 — 금지 키 누출 0). 대신 트리 크리는 `critFromPassives`(씬/HUD 가 RUN.stats.crit* 에 가산), 별빛 충전은 `starlightPerKill`/`onKillStarlight`(처치 시 starlight 자원 충전) **전용 보조 경로**로 흐른다. 코어 패시브(pop_mastery·eagle_eye)는 stats.js BASE 에 반영돼 stat 스트림 제외(이중계산 방지).
- **AbilityKit 재사용**: `learn`/`addPoints`(스킬포인트 배분) · `serialize`/`restore`(SAVE.skills 영속) · 충전·쿨다운·콤보 — **엔진 수정 0**, 데이터+배선만.

## §10 밸런스 점검 로그 (작성과 분리)

| 일시 | 도구 | 결과 |
|---|---|---|
| 2026-06-10 | `emit-json.mjs` | 성공(abilities.json 동기화) |
| 2026-06-10 | `lint-abilities.mjs abilities.json` | **PASS** — error 0 · warn 0 · info 0. tree 35노드 도달성 OK·고아 0·grants/requires 무결성 OK·곱산 캡 OK·입력 예산 4 OK·세트 도달 OK |
| 2026-06-10 | `sim-abilities.mjs` 화력 4종(90s) | charge_shot 53% / scatter_burst 42% / pop_nova 5% — **지배(≥70%) 없음**. 고비용 차지 vs 저쿨 스팸 트레이드오프 정상 |
| 2026-06-10 | `sim-abilities.mjs` 빌드별(60s) | 기동·별빛 빌드는 단일 energy 데미저(산탄) + starlight 게이트 궁극으로 구성돼 sim 그리디 모델상 산탄 100%로 표시됨 — **sim 모델 한계(starlight 리젠 0이라 킬 이벤트 없이 궁극 미발동)**, 실 밸런스 아님. 정적 린터 dominant 검사 클린이 권위 |

**밸런스 가드 (린트 통과 근거):**
- **지배(파레토) 0**: 액티브 풀은 효과축이 분리(범위 vs 콘 vs 관통 vs 버프 vs 블링크 vs 대시 vs 막 vs 정화)되어 같은 slot(=null)·kind 안에서 상호 비지배. 궁극 2종은 거리·역할(근접 회전 vs 원거리 낙하)로 분리.
- **곱연산 캡**: 동시 적용 패시브 곱산 소스 0(패시브는 전부 가산) → multCap(2) 안전. 액티브 곱산(터보 fireRateMult)은 `maxStacks:1` 캡.
- **자원 지속성**: 모든 cost ≤ 자원 최대(영구 사용불가 0). 별빛 자원은 리젠 0 + 킬 충전이라 무비용 스팸 불가.
- **입력 예산**: 동시 바인딩 액티브 슬롯 4 = 모바일 버튼 예산 4(초과 0). 풀 나머지는 slot:null.
- **트리 무결성**: 35노드 전부 root 도달 가능(고아 0), 모든 grants 가 실재 능력, requires/edges 참조 무결.

## 확장 메모

- 추후 능력 추가: §3 카탈로그에 레코드(+`visual.*`) 등록 → 트리에 `unlock` 노드+edge 추가 → 린터 재실행. 삭제는 §3 + 트리 노드/edge + sets member + requires 동시 정리 후 린트.
- 런타임 배선은 `game/abilities-wiring.js` 에만 — Game.js/엔진 수정 금지(파일 경계, 플랜 부록).
- recomputeStats 입력 계약(worker-l4)은 **확정·반영 완료** — `getPassiveEffects(learnedNodes)` 가 `damage→flatDamage`·`projectiles→extraProjectiles` 정규화로 계약 키를 맞춘다. 코어 패시브(pop_mastery·eagle_eye)는 stats.js 베이스에 반영돼 이중 계산 방지로 제외. 헤드리스 통합 테스트(엔진+stats.js+save.js+wiring 실로드)로 검증 완료.
