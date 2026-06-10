# 팡팡 던전 — 사운드 바이블 (AUDIO.md)

> **단일 진실(AUDIO-SINGLE-SOURCE).** 모든 사운드 정의(무드·BGM 트랙/레이어·SFX·믹스)는
> `data/audio.data.js`(브라우저 런타임 `window.POP_AUDIO`) → `tools/emit-json.mjs` → `audio.json`
> (SoundForge 로드 + 린터 입력)에서만 생성한다. 이 문서(AUDIO.md)는 **의도 진실**(왜 이 사운드인가),
> `audio.json`은 **기계 진실**. 둘이 갈리면 AUDIO.md를 기준으로 audio.data.js를 고친다.
> 엔진은 `engine/soundforge.js`(Tone.js v15, MIT, vendored) 절차 합성 — 오디오 파일 0개, 100% CC0.
> 검수: `node D:/ClaudeCowork/JSGameEngineForCC/skills/wgf-sound-architect/tools/lint-audio.mjs audio.json` → 결함 0.
> 작성 패스(이 문서·audio.data.js)와 검수 패스(lint + 청취)는 분리한다(자기검수 금지) — 검수 로그 §7.

---

## 0. 메타

| 항목 | 값 |
|---|---|
| slug | pop-dungeon |
| 장르 | 탑다운 불릿헬 로그라이크 (세로 모바일) |
| 코어 동사 | 내려가기 · 피하기(닷지롤) · 쏘기(자동조준) · 줍기(코인·아이템) |
| 렌더 스타일 | smooth (VectorForge 베이크 → PX 도트 래스터, STYLE torchlit-pop-dungeon) |
| 복잡도 티어 | **T3** (적응형 — 씬 전환 + 바이옴 그룹 + 인텐시티 레이어) |
| 엔진 | `soundforge` (Tone.js v15 절차 합성) |
| 무드 토큰(전역) | **warm**(따뜻한 경이) |
| STORY 링크 | STORY.md §1(톤)·§12(10지역 바이옴)·§13(막간↔지역 재매핑) |

---

## 1. 무드 · 음악 정체성 (MOOD-LOCK-FIRST)

- **전역 무드 = warm(따뜻한 경이).** STORY.md §1 톤 "따뜻한 경이 — 끝낸 플레이어가 밤하늘을 한 번
  올려다보게 되는 여름밤 SF 동화"와 1:1 정합(MOOD-LUDO-HARMONY). 코어 동사 "호기심이 닿는 데까지
  내려가, 아픈 것을 빛으로 되돌린다"가 음악의 의미와 같은 방향을 향한다.
- **왜 cheerful 이 아니라 warm 인가:** 구버전은 `cheerful`(유쾌)였으나, RPG 대확장의 서사 무게중심은
  "씩씩함"보다 "따뜻함·그리움"이다. warm 은 major/mixolydian + 느린~중BPM + fm-ep/pad 따뜻한 음색을
  프레이밍해 동화 톤을 살린다. 전투·보스 구간만 대비(MOOD-CONTRAST)를 위해 heroic/tense 로 전환한다.
- **한 음색 패밀리(TIMBRE-ONE-FAMILY):** "따뜻한 신스 동화풍" — pad(베드)·pluck(별가루)·fm-ep(온기)를
  중심에 두고, 전투계는 같은 패밀리 안에서 saw-bass·supersaw·kit 로 강도만 올린다. 칩튠과 오케스트라를
  섞지 않는다 — 전 트랙·SFX 가 §6 합성 스타일가이드를 상속한다.

### 무드 → 스케일·BPM 곡선 (수직 하강 온도 곡선의 음악 번역)

STORY §12 핵심: "위(1층)는 차갑고 어둡다 → 아래로 갈수록 별이의 손길이 늘어 따뜻해진다 → 최심부(별의
심장)는 가장 밝다." 이 **온도 곡선을 트랙 무드로 매설**한다(룩과 1:1 — 차가운 도입 → 따뜻한 심부).

| 트랙 | 무드 | 스케일 / 키 / BPM | 진행 | 왜 이 무드인가 |
|---|---|---|---|---|
| title | calm | lydian / C / 76 | I–II–vi–IV | 밤하늘을 올려다보는 부유·몽환. 별가루 pluck 반짝임 |
| village | warm | major / F / 96 | I–V–vi–IV | 솔뫼 마을 안식처(§11). 둥글게 흐르는 일상의 따뜻함 |
| explore_cold | calm | minor-pentatonic / A / 84 | i–VI–III–VII | "무서운 줄 알았던 어둠"(차가운 바이옴). 조심스러운 탐험 |
| explore_warm | warm | major / G / 100 | I–IV–vi–V | 별이의 손길이 쌓이는 따뜻한 바이옴. fm-ep 횃불 온기 |
| explore_mystic | mystic | lydian / D / 88 | I–II–vi–iii | 보라·수정빛 신비 바이옴. fm-bell 수정 공명 |
| combat | heroic | mixolydian / C / 124 | I–bVII–IV–I | 씩씩한 아이의 발걸음. 블루지·밝은 용맹 |
| boss | tense | harmonic-minor / A / 150 | i–VI–V–i | 긴박하지만 악의 없는 슬픔도 깔린 응어리 |
| finalboss | heroic | major / C / 132 | I–V–vi–IV | **転의 음악적 번역** — tense 를 뚫고 솟는 희망(깊은 곳엔 친구가 있었다) |
| result | warm | major / F / 84 | I–vi–IV–V | 잔잔히 돌아보는 따뜻함. 승패 양면(§9) |

> 무드↔스케일/BPM 은 sound-architect mood-music-theory.md 매핑 표 근거. lint (b)mood-scale 가 자동 검증(전 트랙 통과).
> **finalboss 무드 전환(tense→heroic)이 핵심 서사 장치**: 100층 보스 음악이 긴박이 아니라 장엄으로
> 솟아오르는 것이, 별이가 피해자가 아니라 별을 고치러 갔다는 反전(STORY §6)의 청각적 번역이다.

---

## 2. BGM 트랙 & 레이어 (적응형 9트랙)

각 트랙 = 베드(pad, minIntensity 0) + 인텐시티별 게이트 레이어(ADAPT-LAYER-GATE). 인텐시티가 0→1로
오르며 레이어가 순차 페이드 인 — 어떤 강도에서도 무음이 아니다(베드 보장).

**대표 트랙 레이어 표 (explore_warm — 따뜻한 바이옴):**

| layer | preset | role | pattern | minIntensity | vol(dB) | 의도 |
|---|---|---|---|---|---|---|
| pad | pad | bed | chords | 0 | -14 | 항상 깔리는 따뜻한 major 패드 베드 |
| bass | saw-bass | foundation | root8 | 0.3 | -12 | 둥근 베이스 — 탐험 진행하면 진입 |
| drums | kit | drive | backbeat | 0.5 | -12 | 중강도부터 backbeat 추진 |
| keys | fm-ep | warmth | arp | 0.7 | -15 | 고강도에서 fm-ep 횃불 온기 훅 |

**combat (heroic) 레이어**: pad(베드) + saw-bass(인텐시티 0 즉시) + kit(0.2) + supersaw(0.5 훅). 전투 즉시 활기.
**boss / finalboss**: 전 레이어 베드(즉시 만개) + supersaw 훅(0.35 / 0.2). four-floor 드럼이 압박을 민다.

- **보이스 예산(MIX-VOICE-BUDGET):** 각 트랙 피크 레이어 보이스 합 ≤ 11 + SFX 헤드룸 4 ≤ 16. 전 트랙
  lint (c)voice-budget 통과(pad=5, kit=3, fm-bell/fm-ep/pluck=2, supersaw/saw-bass/triangle-bass=1).

---

## 3. SFX 팔레트 (41키 — 레이어드 절차 합성)

전부 트랜지언트+바디+테일 레이어드(SFX-LAYER-3), 피치 방향=의미(SFX-PITCH-ENV: 상승=긍정, 하강=임팩트).
모든 수치는 audio.json 단일 진실(SFX-DATA-DRIVEN). 게임 코드는 `GAME_AUDIO.sfx('키')`만 호출.

### 전투 코어 (재점검)
| 키 | 이벤트 | 음색 |
|---|---|---|
| shoot | 발사 | square 760→520, 짧고 작게(연사 절제) |
| hit | 적 피격 | noise 1400 + square 220 |
| enemyDie | 적 처치 | noise + triangle 880→1320 상승(**빛이 되어 별로** — STORY E3) + boom C3 |
| hurt | 피격 | noise 700 + saw 180→90 하강 |
| coin | 코인/기력 픽업 | square 988→1319 상승 |
| powerup | 하트/소모품 | square 상승 아르페지오 |
| descend | 하강 | square 상승 3음 |

### 보스 / 승패
| 키 | 이벤트 | 음색 |
|---|---|---|
| bossWarn | 보스 등장 | metal + boom A1 |
| gameover | 게임오버(별빛 송환) | triangle 하강 3음 |
| win | 클리어(별이 떠오른 밤) | square 상승 팡파르 + fm 1760 벨 |

### 능력 SFX (변별 — abilities-wiring.js 능력별 매핑)
| 키 | 능력 | 음색 |
|---|---|---|
| dodge | 팡 구르기 | noise 스윕 + triangle 440→900 상승(회피) |
| comet | 혜성 돌진 | 긴 noise 스윕 + saw 360→760 + 충돌 톤 |
| blink | 팡 점멸 | triangle 1200→300 + boom(잔향 폭발) |
| nova | 팡 노바 | boom C2 + noise + square 하강(충격파) |
| scatter | 산탄 팡 | noise burst + square 콘 발사 |
| charge | 응축 팡 | saw 200→900 차징 0.5s → boom G2 발사 |
| turbo | 터보 팝 | square 440→880 상승 버프 |
| ward | 별빛 보호막 | fm 523 벨 + triangle(전개) |
| purify | 정화의 파동 | fm 660 + noise 정화 + triangle 990→1320 |
| ultGolden | 황금 팝 폭풍 | boom C2 + fm 880 + noise(궁극 임팩트) |
| ultStar | 별똥 소나기 | fm 1320 + noise burst + boom F2(낙하) |
| skill | (폴백) | fm 660 + noise — 미배선 액티브용 |

> **배선 정합 메모(중요):** 현재 `abilities-wiring.js`(능력 lane 소유)는 능력 발동 시 `nova`/`skill`/`dodge`
> 3키만 호출한다. 위 변별 키(scatter/charge/turbo/comet/blink/ward/purify/ultGolden/ultStar)는 **데이터로
> 준비**돼 있으나 아직 배선 전이다 — `nova`/`skill`/`dodge` 가 audio.json 에 모두 존재해 **현 배선은
> 무수정으로 동작**(하위 호환). 능력 lane 이 `sfx(scene,'skill')` → `sfx(scene,'turbo')` 식으로 키만
> 바꾸면 변별 음색이 즉시 활성된다(데이터 단일 진실 — 사운드 lane 은 키를 준비, 배선은 능력 lane 소관).
> 사운드 파일 경계 밖 파일(abilities-wiring.js)을 사운드 lane 이 수정하지 않아 충돌 0.

### 시스템 SFX (마을·UI·던전 인터랙션 — 필수 커버 전부)
| 키 | 이벤트 | 음색 / 피치 방향 |
|---|---|---|
| uiSelect | UI 선택 | square 740 짧은 칩(중립) |
| uiConfirm | UI 확인 | square 660→990 상승 2음 |
| uiCancel | UI 취소 | square 520→300 하강 |
| uiError | UI 거절/불가 | saw 260→180 하강(부정) |
| equip | 장비 장착 | noise 가죽 + triangle 330(둔탁) |
| upgrade | 강화 성공 | **metal 망치 '탕!' + triangle 880→1320 + fm 별빛 띵**(무쇠 누나) |
| upgradeFail | 강화 실패 | metal 140 + saw 240→120 하강(불발) |
| buy | 구매 | square 880→1175 + noise 짤랑(거래) |
| sell | 판매 | square 660→880 + 440(내려놓음) |
| questAccept | 퀘스트 수주 | fm 523 + triangle(차분한 약속) |
| questDone | 퀘스트 완료 | square 상승 3음 + fm 1568 팡파레(달성) |
| learnSkill | 스킬트리 학습 | **fm 440/660 별빛 화음 + triangle 1320**(별지기의 가르침) |
| statUp | 스탯 분배 | triangle 523→784→1047 상승(별엿 한 입) |
| doorLock | 문 잠금(입실) | metal 160 + boom C2(철컥) |
| doorOpen | 문 개방(전멸 후) | noise + triangle 392→587 + fm(스르륵) |
| secret | 비밀방 발견 | **fm 784 + triangle 1175→1568 + fm 1568**(별이 흔적 — 가슴 뛰는 발견) |
| treasure | 보물 개봉 | boom 뚜껑 + noise + square 988→1319 반짝(확정 보상) |
| minimap | 미니맵 토글 | square 1320 짧은 칩 |
| transition | 씬 전환 | noise + triangle 392→784(부드러운 휘이) |

---

## 4. 적응형 / 전환 (ADAPT-* · setSection + setIntensity)

### 섹션 전환 (수평 리시퀀싱 — setSection)
게임 상태 → 트랙 라우팅. `bgm.sections` 매핑:

| setSection 인자 | 트랙 | 트리거 위치 |
|---|---|---|
| `title` | title | Title 씬 진입 |
| `village` | village | Village 씬 진입(귀환·첫 실행) |
| `explore_cold` / `explore_warm` / `explore_mystic` | 동명 트랙 | 지역 입장 시 바이옴 그룹으로 라우팅(아래 표) |
| `combat` | combat | 방 입실(문 잠김·적 스폰) |
| `boss` | boss | 지역 보스층(x0층) 입장 |
| `finalboss` | finalboss | 100층 악몽의 핵 입장 |
| `result` | result | Result 씬(런 종료) |

### 바이옴 → 탐험 트랙 그룹 (world.data.js region.id → 온도 그룹)
10지역을 STORY §12 온도/색으로 3그룹에 매핑(트랙 수 억제 + 곡선 표현):

| 탐험 트랙 | 지역(region.id) | 온도/색 근거 |
|---|---|---|
| explore_cold | region-01(이끼굴) · 03(회랑) · 07(우는늪) · 09(비탈) | 차가운 바이옴(cold/cool/neutral lightTemp) |
| explore_warm | region-02(반창고협곡) · 05(별지도서고) · 08(켜진횃불) · 10(별의심장) | 따뜻한 바이옴(warm/radiant lightTemp) |
| explore_mystic | region-04(손수건미궁) · 06(속삭이는 수정굴) | 보라·수정 신비(violet/crystal) |

> region-10(별의 심장)은 explore_warm(가장 밝은 따뜻함)으로 탐험하다, 100층 보스에서 finalboss(heroic)로
> 전환 — 온도 곡선의 종착점이 가장 따뜻·밝음으로 완결(STORY §12 "최심부는 가장 밝다").
> 매핑 구현은 Dungeon 씬(L6)이 `world.json` region.id 를 읽어 setSection 인자를 결정(런타임 배선 소관).

### 인텐시티 매핑 (수직 레이어 — setIntensity)
| 게임 상태 | intensity | 효과 |
|---|---|---|
| 방 사이 이동·탐험 | 0.2~0.4 | 패드 베드 + 베이스만(조용) |
| 방 입실 전투 | 0.45~0.7 | 드럼·리드 진입(활기) |
| 보스 전투 | 1.0 | 전 레이어 만개 |
| 클리어 직후 | 0.1~0.2 | 인텐시티 하강(여운) |

---

## 5. 믹스 & 모바일 예산 (MIX-*)

- **마스터 체인:** Volume(-8dB) → Compressor → Limiter(-1dB) → destination. reverb decay 2.2s
  (≤ maxReverbDecay 4, 모바일 ConvolverNode 비용 안전), reverb send 0.18 / delay send 0.11(따뜻한 공간감).
- **헤드룸(MIX-HEADROOM):** 마스터 -8dB 로 BGM 을 낮춰 SFX 가 묻히지 않을 여유 확보(SFX-FEEDBACK-CLARITY).
  pad/pluck/fm-bell 레이어는 reverb send 로 분리, SFX 랙은 BGM 레이어와 독립 경로로 master 연결.
- **보이스 예산:** maxVoices 16. 트랙 피크 ~11 + SFX 헤드룸 4 ≤ 16(전 트랙 lint 통과).
- **라이프사이클(MIX-UNLOCK):** 첫 제스처('탭하여 시작', Title.js)에서 `unlock()` + `startBgm()`(자동재생
  정책 준수). `mobile.js` 가시성 가드가 백그라운드 시 `suspend`, 복귀 시 `resume`(_bgmWanted 보존 자동
  재가동). 음소거 토글(♪) 우상단.

---

## 6. 합성 스타일가이드 (TIMBRE-ONE-FAMILY · 전역 1회 선언, 전 트랙·SFX 상속)

- **음색 패밀리:** 따뜻한 신스 동화풍. **베드=pad**(fatsine 3, 긴 ADSR) · **별가루=pluck**(PluckSynth) ·
  **온기=fm-ep**(FMSynth harmonicity 1, 따뜻) · **신비=fm-bell**(FMSynth harmonicity 3, 공명).
- **전투 보강(같은 패밀리 내 강도 상승):** saw-bass(MonoSynth lowpass) · supersaw(fatsawtooth 5 detune) ·
  kit(kick membrane + snare/hat noise). 칩튠 square-lead/pulse-lead 는 SFX 에서만(UI·코인) 사용.
- **이펙트 상수:** reverb decay 2.2s / send 0.18, delay 8n feedback 0.32 / send 0.11. 마스터 -8dB.
- **SFX 합성 kind:** tone(square/triangle/sawtooth) · fm(별빛·벨) · noise(질감·스윕) · boom(저역 임팩트) ·
  metal(망치·금속). 능력 변별은 화력=boom/square, 별빛=fm 벨, 기동=noise 스윕으로 계열 구분.
- **CC0 보증:** 멜로디는 스케일+코드 도수만 지정하고 arp 패턴이 절차 생성(MOOD-ORIGINAL-MELODY).
  특정 곡 멜로디/진행+멜로디 결합 인용 0. 전 음원 절차 합성(오디오 파일 0개) → 100% CC0.

---

## 7. 검수 로그 (작성/검수 분리 — AUDIO-SINGLE-SOURCE)

| 일시 | 코드 | 위치 | 결과 | 조치 |
|---|---|---|---|---|
| 2026-06-10 | (a)~(g) | audio.json 전체 | **PASS** — `lint-audio.mjs audio.json` → error 0 · warn 0 · info 0 | 없음 |
| 2026-06-10 | (a)schema | 9트랙 + 41 SFX | PASS — engine/scale/preset/pattern/sfx.kind enum 정합, tier 3, 섹션 매핑 무결성 | 없음 |
| 2026-06-10 | (b)mood-scale | 전 트랙 | PASS — warm/calm/mystic/heroic/tense ↔ 권장 스케일·BPM 범위 전부 정합 | 없음 |
| 2026-06-10 | (c)voice-budget | 전 트랙 | PASS — 피크 보이스 합 ≤ 11 + SFX 4 ≤ 16(모바일 폴리포니 예산) | 없음 |
| 2026-06-10 | (d)layer-reach | 전 트랙 | PASS — 전 트랙 pad 베드(minIntensity 0) 존재, minIntensity ∈ [0,1] | 없음 |
| 2026-06-10 | (배선 정합) | abilities-wiring.js·Game.js | 확인 — 현 호출 키(nova/skill/dodge 등)·Game.js 키 전부 audio.json 정의(하위 호환). 변별 키는 데이터 준비·배선 대기 | 능력 lane 핸드오프(키 교체 시 즉시 활성) |
| (대기) | (h)청취 | 프리뷰 | **미실시** — Village/WorldMap/Dungeon 씬 미완(L5/L6/L7 진행 중). 통합 QA(L15)에서 오디오 언락·BGM 전환·SFX 명료성 청취 점검 예정 | L15 QA 게이트 |

> **청취 점검 보류 근거:** 신규 씬(Village/WorldMap/Dungeon)이 아직 구현 중이라 setSection 전환을 실제로
> 들을 수 없다. 데이터·lint 검증은 완료, 청취(h)는 씬 완성 후 통합 QA(L15)가 "무드가 게임과 같은 말을
> 하나? SFX 가 BGM 에 묻히나? 모바일에서 끊기나? 루프 이음새가 튀나?"를 점검한다.

---

## 8. CC0 / IP 안전

- 전 트랙·SFX **절차 합성 오리지널** — 스케일+코드 도수만 지정, 멜로디는 엔진 arp 절차 생성(어떤 곡도
  인용 안 함). 오디오 파일 의존 0 → 음원 저작권·인접권 비해당, 100% CC0.
- 고유명(팝거너·기력·별빛·악몽 조각·악몽의 핵)은 STORY.md Glossary 정합. 상용 게임/곡 인용 0.
- vendored Tone.js(v15, MIT)는 `engine/tone.LICENSE.txt`/`CREDITS.txt`에 고지. 상세는 ip-license-guard.
