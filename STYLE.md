# STYLE.md — 팡팡 던전 (Pop Dungeon) 아트 디렉션 바이블

> **단일 진실 체인:** 이 문서(설계 의도) → `data.js` `POP_STYLE`(런타임 단일 소스) →
> `tools/emit-json.mjs` → `style.json`(린트·생성기 입력) + `assets/palette.master.json`(상속용 마스터 팔레트).
> 색을 바꿀 때는 **반드시 `data.js` `POP_STYLE` 한 곳만** 고치고 emit 을 재실행한다.
> game.js 는 `engine/stylekit.js` 로 이 스펙을 로드해 **모든 색을 램프/역할색 참조로만** 쓴다(hex 직접 금지).

## §0 메타

| 항목 | 값 | 근거 |
|---|---|---|
| 복잡도 티어 | **T2** (팔레트 + 폼 + 셰이딩) | 룩이 이미 T2 수준으로 구현돼 있어 그대로 코드화. 라이팅/포스트FX(T3)는 무드가 핵심 동사가 아니므로 제외 (`STY-SCOPE-LADDER`) |
| 매체 | **vector** (스무스/카툰) | game.js `render.pixelArt:false` + VectorForge 전면 사용과 1:1 (`STY-SCOPE-MEDIUM-RENDER-MATCH`, D7) |
| 장르·코어 동사 | 탑다운 불릿헬 로그라이크 — 피하기(닷지롤)·자동발사·줍기 | |
| 플랫폼 | 모바일 웹뷰 세로 9:16 (540×960) | 과채도·과대비 절제, 작은 화면 가독 우선 |
| 엔진 배선 | `engine/stylekit.js` (`StyleKit.load(window.POP_STYLE)`) — **풀 배선**(스프라이트 draw·HUD·배너·파티클 전부 STYLE 참조) | |
| 톤 정합 | data.js AUDIO mood `cheerful`(경쾌·아기자기 → 보스 긴박)과 동일 결 (`STY-MOOD-COHESION`) | |

## §1 무드 한 줄

> **candy-pop-dungeon** — 차가운 보라 어둠의 돌던전 위에서, 사탕처럼 쨍한 카툰 마스코트들이 팡팡 터진다.

차가운 배경(보라 stone) ↔ 따뜻한 초점(청록 플레이어·골드 픽업·캔디핑크 위험)의 온도 대비가 시선을 유도한다
(`STY-PAL-WARM-COOL-CONTRAST`).

## §2 팔레트 — master_palette (단일 진실)

### 재질 램프 (dark → light, hue-shift: 그림자는 차갑게·빛은 따뜻하게 `STY-PAL-HUE-SHIFT`)

| 램프 | 색 (dark→light) | 쓰임 |
|---|---|---|
| `hero` | `#12463f #1ba79c #33d2bd #7af0dc` | 플레이어 '팡이' 몸통·잔상·닷지 버튼·구르기 퍼프 |
| `slime` | `#234d18 #2c6b22 #3a8e2a #4fae3a #9be86b` | 슬라임 적 + 슬라임 대왕(보스) |
| `royal` | `#3e1f70 #7a3fd0 #a86bff #c08bff #e3c8ff` | 오브 적 + 감시안(보스 눈) + epic 등급 결 |
| `bat` | `#2f3270 #5a5eb0 #6b6fbf #9a9ee8` | 박쥐 적 |
| `ember` | `#6e2418 #d4583a #ff9f6b` | 포탑 적 |
| `candy` | `#2a0e18 #5a0f28 #d12a5a #ff4f7a #ff6b9a #ff8fb0` | **위험의 시그니처** — 적탄·하트·보스 HP바·보스 배너·게임오버 |
| `gold` | `#8a5a10 #d98a1f #ff9f1a #ffd34a #fff6c0` | 코인·별(아이템 드랍)·궁극기 탄·왕관·팝건·타이틀 |
| `cyan` | `#1a3a44 #2bb6e0 #7af0ff #eaffff` | 플레이어 탄·기력(에너지)·UI 강조 |
| `steel` | `#10243a #22406e #4a78c8 #9ad0ff` | 강철 봇(보스)·기력바 바탕 |
| `portal` | `#285ac8 #5ab4ff #c8ebff` | 층 전환 포탈 |
| `wood` | `#3e2010 #7a4422 #b06a3a #caa06a` | 상자 |
| `stone` | `#241640 #3a2a60 #6a4ad0 #b89cff` | 던전 아레나 바닥·격자·벽 — 무드의 바닥 |
| `mist` | `#2a3050 #44364a #6a7a90 #9fb3c8 #cfd8e3` | 보조 UI 텍스트·빈 하트·카드 바탕 |

- **중립색:** black `#1a2233`(보라끼 잉크 — 외곽선·눈동자·텍스트 그림자), white `#ffffff`(눈 흰자·본문 텍스트.
  모바일 가독 최우선으로 순백 유지 — `STY-PAL-NEUTRALS` 의 의도적 예외, 외곽선 잉크는 색이 돈다).
- **배경 베이스:** `#161a2e` (타이틀·게임 config — `STY-PAL-BACKGROUND-BASE`).

### 역할색 — role_colors (의미색 `STY-PAL-ROLE-COLORS`, 전부 램프에서 재사용)

| 역할 | 색 | 출처 램프 | 쓰임 |
|---|---|---|---|
| `player` | `#33d2bd` | hero[2] | 플레이어 정체성 |
| `enemy` | `#ff8fb0` | candy[5] | 보스 이름 표시 |
| `danger` | `#ff4f7a` | candy[3] | HP 하트·보스 HP바 — 빨강계는 위험 전용 |
| `pickup` | `#ffd34a` | gold[3] | 코인 카운터·토스트·노바 링·궁 버튼 |
| `ui_accent` | `#7af0ff` | cyan[2] | 층 배너·클리어·서브타이틀·봇 눈 |

### 변주 데이터 — variants (룩 변주, 단일 진실에 포함)

- `floor_backgrounds` (10색): 10층 구간마다 카메라 배경 색조 변화. Result 씬 승/패 배경도 [2]/[3] 재사용.
- `boss_tints` (7색): 4번째 보스부터의 보스 변주 틴트(1~3번째는 흰색=무틴트).

### 등급색 정합 (D6 상속)

등급색(common `#cfd8e3` / rare `#5ad1ff` / epic `#c08bff` / legendary `#ffcf4a`)은 **items 데이터(`POP_ITEMS.rarities`)가
권위**이고 game.js 는 그걸 읽는다(중복 정의 제거됨). common=mist[4], epic=royal[3]으로 마스터 램프와 일치하며,
legendary `#ffcf4a` ≈ gold[3] `#ffd34a`(시각적 동일 계열), rare `#5ad1ff` 는 cyan 계열 변주로 정합.

## §3 폼·라인

- **비율:** head_to_body `1:1` — 머리가 곧 몸인 동글 블롭 마스코트(치비 극단). 실루엣 `round-blob`
  (`STY-FORM-SILHOUETTE-FIRST`: 적 4종은 색 이전에 실루엣—블롭/날개/포탑/구체—으로 먼저 구분된다).
- **라인:** outline `full` — 모든 캐릭터·픽업에 외곽선. 색은 `darker-of-fill`(채움색 램프의 최저단),
  기본 잉크는 `#1a2233`. 두께 기준 2px(소형 디테일 1~1.6, 보스 3).
- **min_feature_px:** 2 (눈 하이라이트 0.6은 3x 슈퍼샘플링으로 보존).
- **표정 문법:** 큰 흰 눈 + 잉크 눈동자 + 흰 하이라이트, 적도 같은 문법(귀여운 적 = cheerful 톤 정합).

## §4 셰이딩·광원

- **모델:** `soft` — VectorForge 세로 그라데이션(위=밝음) + 광택 하이라이트. 셀 단 없음.
- **광원:** `NW` 고정 — 광택 하이라이트는 좌상단(`VF.ellipse(cx-4, …)`), 그림자는 발밑 타원
  (`rgba(INK, 0.2~0.22)`). 모든 에셋이 같은 광원을 공유한다(`STY-SHADE-LIGHT-DIR`).
- **ramp_steps:** 3 (그라데이션 스톱 기준 — dark/mid/light).
- **hue_shift:** warm-light-cool-shadow — 램프의 어두운 끝은 차갑게(보라·남색), 밝은 끝은 따뜻하게.
- **발광체 문법:** 탄알·포탈·기력은 `VF.glow(rgba(램프 light색, α))` + 방사 그라데이션(흰 중심) — 어두운
  배경에서 게임플레이 요소가 가장 밝게 떠 보인다(`STY-PAL-CONTRAST-ACCESS`).

## §6 상속·핸드오프

```
data.js POP_STYLE ──emit──▶ style.json ──lint──▶ lint-style.mjs
        │                          └──────▶ assets/palette.master.json (상속용 마스터)
        ├─ game.js: StyleKit.load → ramp()/rampInt()/roleInt()/rgba() — 풀 배선
        │    · 스프라이트 draw(bakeArt) 전 색 → master_palette 램프
        │    · HUD(하트·기력바·보스바·버튼)·배너·토스트 → role_colors/램프
        │    · 층 배경·보스 틴트 → variants
        │    · 등급색 → POP_ITEMS.rarities (items 권위, §2 정합)
        ├─ ABILITIES.md §visual / ITEMS.md §visual → 아이콘 생성 시 palette.master.json 상속(D6)
        └─ index.html: theme-color=#161a2e(배경), favicon=hero[2] 마스코트
```

- **의도적 예외(팔레트 밖):** 카메라 flash/fade 의 숫자 RGB(피격 붉은 플래시, 골드 플래시, 하강 페이드 등)는
  순간 광 효과(juice)로 팔레트 정체성이 아니므로 리터럴 유지. 외곽선 잉크/흰색 폴백(`0xffffff` 기본값 인자)도 방어용.
- **새 에셋 추가 규칙:** 새 적/아이템은 ① 기존 램프 재사용을 먼저 검토(`STY-PAL-LIMITED`) ② 새 재질이 정말
  필요할 때만 data.js `POP_STYLE.master_palette.ramps` 에 dark→light 램프를 추가하고 emit 재실행.
- **리스킨:** 무드만 바꾸려면 ramps/role_colors 를 갈고 emit — game.js 는 손대지 않는다(바이블 → 코드 한 방향).

## §7 검수 로그

- **2026-06-10 (최초 산출 · 작성과 분리된 검수 패스)**
  - `node tools/emit-json.mjs` → style.json + palette.master.json emit, abilities/items/audio.json 드리프트 0.
  - `node …/wgf-style-architect/tools/lint-style.mjs style.json` → **error 0 · warn 0 · info 14**.
    - info `palette-contrast: neutrals.black vs 배경 1.08` — 의도된 값: 잉크는 배경 위 전경색이 아니라 *밝은 채움
      위 외곽선*이므로 배경 대비가 낮은 게 정상.
    - info `dead-token: 램프 13종 내부 미참조` — 의도된 구조: 램프 참조는 style.json 내부가 아니라 game.js
      `ramp()` 호출에서 일어난다(린터 메시지도 외부 참조 가능성을 명시).
  - `lintConfig.max_palette_colors: 80` 상향 근거: vector 매체 + 재질 13종(적 4계열·보스 3종) + 10단 층 배경
    변주 = 총 76 고유색. 픽셀 관용 예산(48)은 픽셀아트 기준이며, 본 게임은 램프 재사용 원칙으로 응집 유지.
  - **수동 검수(실행):** 로컬 서버 + 스크린샷 — 타이틀/게임 씬 모두 리팩터 전과 동일 룩 확인, 콘솔 에러 0.
    캐노니컬라이즈로 인한 미세 변화(골드 3종 → `#ffd34a` 통일, HP 하트 `#ff3f6e`→`#ff4f7a`,
    Result 패배 배경 `#241018`→`#2a1018` 등)는 의도된 색 통일이며 육안 비교에서 차이 미미.
  - **한 세계로 보이나?** ✓ 한 매체(vector)·한 광원(NW)·한 잉크(#1a2233)·제한 램프 — `STY-SCOPE-ONE-STYLE` 충족.
