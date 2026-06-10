# STYLE.md — 팡팡 던전 (Pop Dungeon) 아트 디렉션 바이블

> **단일 진실 체인:** 이 문서(설계 의도) → `data.js` `POP_STYLE`(런타임 단일 소스) →
> `tools/emit-json.mjs` → `style.json`(린트·생성기 입력) + `assets/palette.master.json`(상속용 마스터 팔레트).
> 색을 바꿀 때는 **반드시 `data.js` `POP_STYLE` 한 곳만** 고치고 emit 을 재실행한다.
> game.js 는 `engine/stylekit.js` 로 이 스펙을 로드해 **모든 색을 램프/역할색 참조로만** 쓴다(hex 직접 금지).

## §0 메타

| 항목 | 값 | 근거 |
|---|---|---|
| 복잡도 티어 | **T2** (팔레트 + 폼 + 셰이딩) | 인터뷰 확정(2026-06-10). 라이팅/포스트FX(T3)는 제외 — 무드는 팔레트와 그려진 빛으로 만든다 (`STY-SCOPE-LADDER`) |
| 매체 | **pixel** (도트) | 인터뷰 확정. game.js `render.pixelArt:true·antialias:false·roundPixels:true` 와 1:1 (`STY-SCOPE-MEDIUM-RENDER-MATCH`, D7) |
| 장르·코어 동사 | 탑다운 불릿헬 로그라이크 — 피하기(닷지롤)·자동발사·줍기 | |
| 플랫폼 | 모바일 웹뷰 세로 9:16 (540×960) | 과채도·과대비 절제, 작은 화면 가독 우선 |
| 엔진 배선 | `engine/stylekit.js` (`StyleKit.load(window.POP_STYLE)`) — **풀 배선**. 드로잉은 game.js **PX 래스터라이저**(1px 도트), `VectorForge.bake` 는 `ss:1` 캔버스→텍스처 플럼빙으로만 사용 | |
| 톤 정합 | data.js AUDIO mood `cheerful` 유지 — "귀여운 모험가 + 진지한 던전"의 갭이 매력 (`STY-MOOD-COHESION`) | |
| 시그니처 룩 | **"어둠 속 횃불빛 받은 민트 팝거너"** — 돌어둠(stone)+횃불(torch)+민트(hero) 3색 대비. 플레이어 스프라이트·타이틀·파비콘·클리어 화면이 같은 구도를 공유 | 인터뷰 확정 |

## §1 무드 한 줄

> **torchlit-pop-dungeon** — 차가운 청남색 돌어둠 속, 횃불의 따뜻한 빛을 받은 귀여운 도트 모험가가 탄막을 누빈다.

차가운 배경(청남 stone) ↔ 따뜻한 초점(횃불 torch·골드 픽업·선홍 위험)의 온도 대비가 시선을 유도한다
(`STY-PAL-WARM-COOL-CONTRAST`). 무드는 동적 라이팅이 아니라 **팔레트 + 그려진 빛**(벽 횃불 스프라이트 + 바닥 광 풀)로
만든다 — T2 에서 Canvas 폴백 이슈가 원천적으로 없다.

## §2 팔레트 — master_palette (단일 진실, 고유 45색 ≤ 48)

### 재질 램프 (dark → light, hue-shift: 그림자는 차갑게·빛은 횃불빛으로 따뜻하게 `STY-PAL-HUE-SHIFT`)

| 램프 | 색 (dark→light) | 쓰임 |
|---|---|---|
| `stone` | `#1b2030 #2a3349 #3f4f6b #5d7693` | 던전 아레나 바닥·브릭 격자·벽 — 무드의 바닥 |
| `torch` | `#4a2210 #8a3d1c #d96a28 #ffa53a #ffe9a8` | **무드의 시그니처** — 벽 횃불·광 풀·포탑·상자 나무·볼터치·스킬2 버튼 |
| `hero` | `#0f3f38 #188a72 #3fd6a8 #aef7dd` | 플레이어 '팡이'·아군 탄·기력(에너지)·닷지 버튼·잔상 |
| `scarlet` | `#531222 #a02038 #e83a52 #ff8d7a` | **위험의 시그니처** — 적탄·하트·보스 HP바·보스 배너·게임오버 |
| `gold` | `#7a4a12 #c98a1f #ffc63a #fff1b8` | 코인·별(아이템 드랍)·궁극기 탄·왕관·팝건·타이틀 |
| `venom` | `#173a1c #2f7a2c #5cc23e #c2f57e` | 슬라임 적 + 슬라임 대왕(보스) + 바닥 이끼 점 |
| `arcane` | `#2b1a4d #5d35a8 #9a66e8 #d9b8ff` | 오브 적·감시안(보스 눈)·층 전환 포탈·epic 등급 |
| `steel` | `#232c40 #45526e #7d8fae #c6d4e6` | 박쥐·강철 봇(보스)·횃불 브래킷·UI 중립 텍스트·기력바 바탕 |

- **중립색:** black `#15121f`(보라끼 잉크 — 외곽선·눈동자·텍스트 그림자), white `#ffffff`(눈 흰자·탄 코어·본문 텍스트).
  잉크↔배경 저대비는 의도(잉크는 밝은 채움 위 외곽선이지 배경 위 전경색이 아님).
- **배경 베이스:** `#10131f` (타이틀·게임 config — `STY-PAL-BACKGROUND-BASE`).

### 역할색 — role_colors (의미색 `STY-PAL-ROLE-COLORS`, 전부 램프에서 재사용)

| 역할 | 색 | 출처 램프 | 쓰임 |
|---|---|---|---|
| `player` | `#3fd6a8` | hero[2] | 플레이어 정체성 |
| `enemy` | `#ff8d7a` | scarlet[3] | 보스 이름 표시 |
| `danger` | `#e83a52` | scarlet[2] | HP 하트·보스 HP바 — 빨강계는 위험 전용 |
| `pickup` | `#ffc63a` | gold[2] | 코인 카운터·토스트·노바 링·궁 버튼 |
| `ui_accent` | `#ffa53a` | torch[3] | 층 배너·클리어·서브타이틀·봇 눈 — UI까지 횃불 무드 |

### 변주 데이터 — variants (룩 변주, 단일 진실에 포함)

- `floor_backgrounds` (10색): 10층 구간마다 카메라 배경 색조 변화(전부 초저명도 — 어둠 유지). [0]은 배경 베이스 재사용.
  Result 씬 승/패 배경도 [2]/[3] 재사용.
- `boss_tints` (7색): 4번째 보스부터의 보스 변주 틴트 — **전부 램프 색 재사용**(venom[3]·hero[3]·scarlet[3]·torch[3]·
  gold[2]·arcane[3]·arcane[2])이라 고유 색 수 증가 0.

### 등급색 정합 (D6 상속)

등급색은 **items 데이터(`POP_ITEMS.rarities`)가 권위**이고 game.js 는 그걸 읽는다. 마스터 램프와 1:1 정합:
common `#c6d4e6`=steel[3] / rare `#3fd6a8`=hero[2] / epic `#9a66e8`=arcane[2] / legendary `#ffc63a`=gold[2].

## §3 폼·라인

- **비율:** head_to_body `1:1.4` — 머리 큰 **2등신 치비**(32px급 디테일 도트에서 몸·팔·팝건·부츠 표현). 실루엣
  `chibi-round` (`STY-FORM-SILHOUETTE-FIRST`: 적 4종은 색 이전에 실루엣—돔블롭/구체/날개/포탑—으로 먼저 구분된다).
- **해상도 감각:** 네이티브 도트 — 적 28~30px·플레이어 36px·보스 90~96px·탄 14~18px, 캔버스 1:1(스케일 1).
  540×960 논리 해상도가 기기에서 2~3배 업스케일되며 도트가 또렷해진다(`image-rendering: pixelated` + `roundPixels`).
- **라인:** outline `full` — 모든 캐릭터·픽업의 **가장자리 픽셀 1px**을 채움색 램프의 최저단(`darker-of-fill`)으로.
  기본 잉크는 `#15121f`(눈동자·총구·번개 등 디테일).
- **min_feature_px:** 1 (눈 캐치라이트·불티·리벳 = 1px 도트).
- **표정 문법:** 흰 눈 + 잉크 눈동자 + 1px 캐치라이트 + torch 볼터치, 적도 같은 문법(귀여운 적 = cheerful 톤 정합).

## §4 셰이딩·광원

- **모델:** `cell` — **셀 3단**(dark/mid/light = 램프 [1]/[2]/[3]). 그라데이션·글로우·소프트섀도우 금지.
- **광원:** `NW` 고정 — PX 래스터라이저의 셰이딩 함수가 좌상(밝음)→우하(어두움) 밴드를 계산한다
  (`t = -(nx·0.38 + ny·0.62)`). 모든 에셋이 같은 광원을 공유한다(`STY-SHADE-LIGHT-DIR`).
- **디더:** `sparse` — **밴드 경계의 체커 디더는 넓은 면(보스 3종)에만**. 소형 스프라이트는 디더 없이 깔끔한 셀 단.
- **hue_shift:** warm-light-cool-shadow — 램프의 어두운 끝은 차갑게(청남·암갈), 밝은 끝은 횃불빛으로 따뜻하게.
- **발광체 문법:** 탄알은 `pxOrb` **방사 4단 픽셀 링**(흰 코어 → light → mid → dark 림) — 어두운 배경에서
  게임플레이 요소가 가장 밝게 떠 보인다(`STY-PAL-CONTRAST-ACCESS`). 블렌드모드 ADD 미사용(도트 정합).
- **접지:** 발밑 잉크 타원 그림자 `rgba(INK, 0.28)` 플랫(셀 단 없음).

## §5 그려진 빛 (T2 — 동적 라이팅 아님)

- **벽 횃불 스프라이트** `wtorch`(18×30, 2프레임 5fps 흔들림): 불꽃 셀 3단 + 백열 코어(torch[4]) + 알파 헤일로.
  아레나 4곳(상단 2 + 중단 측벽 2) + 타이틀 2곳(시그니처 구도).
- **바닥 광 풀:** 횃불 아래 `rgba(torch[2], 0.06)` 타원 — 어둠 위 온기. WebGL/Canvas 무관(그려진 픽셀이므로 R4 해당 없음).

## §6 상속·핸드오프

```
data.js POP_STYLE ──emit──▶ style.json ──lint──▶ lint-style.mjs
        │                          └──────▶ assets/palette.master.json (상속용 마스터)
        ├─ game.js: StyleKit.load → ramp()/rampInt()/roleInt()/rgba() — 풀 배선
        │    · 스프라이트 draw(bakeArt·PX 래스터) 전 색 → master_palette 램프
        │    · HUD(하트·기력바·보스바·버튼)·배너·토스트 → role_colors/램프 (바·카드는 사각 — 도트 결)
        │    · 층 배경·보스 틴트 → variants
        │    · 등급색 → POP_ITEMS.rarities (items 권위, §2 정합)
        ├─ ABILITIES.md §visual / ITEMS.md §visual → 아이콘 생성 시 palette.master.json 상속(D6)
        └─ index.html: theme-color=#10131f(배경), favicon=도트 민트 팡이, image-rendering: pixelated
```

- **의도적 예외(팔레트 밖):** 카메라 flash/fade 의 숫자 RGB(피격 플래시·골드 플래시·하강 페이드)는 순간 광
  효과(juice)로 리터럴 유지. HUD 버튼의 원형 모양은 터치 어포던스 우선의 의도적 예외(`STY-SCOPE-ONE-STYLE` 예외 규칙).
  흰색 폴백(`0xffffff` 기본값 인자)은 방어용.
- **알려진 핸드오프 캐비앗:** data.js 아이템/능력의 `visual.palette` 힌트 문자열은 일부가 이전(candy-pop) 색을
  담고 있다 — 현재 게임은 아이콘을 생성하지 않으므로(별+텍스트 표기) 무해하며, 아이콘 생성기를 돌릴 때
  `assets/palette.master.json` 상속(D6)이 우선한다. 아이콘 도입 시 §visual 일괄 갱신할 것.
- **새 에셋 추가 규칙:** 새 적/아이템은 ① 기존 램프 재사용을 먼저 검토(`STY-PAL-LIMITED`) ② 새 재질이 정말
  필요할 때만 data.js `POP_STYLE.master_palette.ramps` 에 dark→light 램프를 추가하고 emit 재실행(고유 48색 상한).
- **리스킨:** 무드만 바꾸려면 ramps/role_colors 를 갈고 emit — game.js 는 손대지 않는다(바이블 → 코드 한 방향).
  매체를 바꾸면(픽셀↔벡터) bakeArt 드로잉 파이프라인 재작업이 필요하다(이번 2026-06-10 리스킨이 그 사례).

## §7 검수 로그

- **2026-06-10 (candy-pop-dungeon → torchlit-pop-dungeon 전면 리스킨 · 작성과 분리된 검수 패스)**
  - 인터뷰 6라운드로 청사진 확정: 픽셀 전환·T2·횃불 돌던전·풍부한 도트 ≤48색·32px급 디테일·셀 3단+절제 디더·
    시그니처 "횃불빛 받은 민트 히어로".
  - `node tools/emit-json.mjs` → style.json + palette.master.json + items.json(등급색) emit, 드리프트 0.
  - `node …/wgf-style-architect/tools/lint-style.mjs style.json` → **error 0 · warn 0 · info 9**.
    - info `palette-contrast: neutrals.black vs 배경 1.00` — 의도된 값: 잉크는 외곽선 용도(§2).
    - info `dead-token: 램프 8종 내부 미참조` — 의도된 구조: 램프 참조는 game.js `ramp()` 호출에서 일어난다.
    - `palette-size` 경고 없음 = 고유 색 ≤ 48 충족(45색). `medium-match`(D7) 경고 없음 = render 정합.
  - **수동 검수(실행, chrome-devtools 스크린샷):** 타이틀(시그니처 구도: 횃불 2 + 민트 도트 팡이) / 8층 전투
    (스칼렛 탄막·아케인 오브·골드 픽업이 돌어둠 위에 또렷) / 10층 보스(왕관 슬라임 대왕 셀+디더, 스칼렛 보스바)
    모두 의도대로. 콘솔 에러 0. 헤드리스 스텝(`game.loop.step`)으로 층 점프 검증.
  - **한 세계로 보이나?** ✓ 한 매체(pixel)·한 광원(NW)·한 잉크(#15121f)·제한 램프 8종·셀 3단 — `STY-SCOPE-ONE-STYLE` 충족.
  - IP 안전: 던전 크롤러 무드 관습만 차용, `ip_redwords` 통과(에러 0).
