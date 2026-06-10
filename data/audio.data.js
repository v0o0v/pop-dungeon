/* ============================================================================
 * 팡팡 던전 — 사운드 데이터 (sound-architect 계약 · lint-audio.mjs · SoundForge)
 * ----------------------------------------------------------------------------
 * RPG 개편 대확장본 (L13). STORY.md '별이 떨어진 밤' 단일 진실 + world.data.js
 * 10지역 바이옴 + 신규 씬(Title/Village/WorldMap/Dungeon/Result) 정합.
 *
 * ── 설계 결정(인터뷰 위임 11 — 규모 자율) ───────────────────────────────────
 * STORY 핵심은 "수직 하강의 온도 곡선"이다 — 차가운 도입(region-01) → 별이의
 * 손길로 점점 따뜻해짐 → 가장 밝은 별의 심장(region-10). 단일 cheerful 무드는
 * 이 곡선을 담지 못하고, 10지역마다 독립 트랙은 보이스 예산·전환 피로를 폭발시킨다.
 * → 절충: 씬 허브 2 + 던전 탐험을 바이옴 온도 그룹 3 + 전투/보스/최종보스 3 +
 *   결과 1 = 9트랙. 10지역을 온도·색으로 묶어 곡선을 표현하되 트랙 수는 억제하고,
 *   setSection(수평 전환) + setIntensity(수직 레이어)로 적응형을 운용한다(티어 3).
 *
 * ── 무드 락(MOOD-LOCK-FIRST) ─────────────────────────────────────────────────
 * 게임 전역 기본 무드 = warm(따뜻한 경이 — STORY §1 톤 'warm wonder'와 1:1).
 * 트랙별 무드는 씬·바이옴에 맞춰 warm/calm/mystic/heroic/tense로 대비(MOOD-CONTRAST),
 * 단 한 음색 패밀리(따뜻한 신스 동화풍 — pad/pluck/fm-ep 중심)로 일관(TIMBRE-ONE-FAMILY).
 *
 * 모든 음원 절차 합성 오리지널(CC0). 외부 오디오 파일 0개.
 * 브라우저: window.POP_AUDIO 전역. Node: module.exports.AUDIO.
 * ==========================================================================*/
(function (g) {
  'use strict';

  var AUDIO = {
    "version": 2,
    "meta": {
      "slug": "pop-dungeon",
      "tier": 3,
      "mood": "warm",
      "genre": "roguelike-bullet-hell",
      "renderStyle": "smooth",
      "engine": "soundforge",
      "coreVerb": "내려가기·피하기·쏘기·줍기",
      "storyRef": "STORY.md §1(톤 warm wonder)·§12(10지역 바이옴 온도 곡선)·§13(막간↔지역)",
      "originalityNote": "전 트랙·SFX 절차 합성 오리지널 — 어떤 곡의 멜로디/진행도 인용하지 않음(스케일+코드 도수만 지정, 멜로디는 엔진 arp 절차 생성). 고유명(팝거너·별빛·악몽 조각)은 STORY.md Glossary 정합. 100% CC0."
    },

    /* 마스터: SFX가 BGM에 묻히지 않게 BGM 헤드룸 확보(MIX-HEADROOM). reverb decay 2.2s
     * (모바일 ConvolverNode 비용 ≤ maxReverbDecay 4). 따뜻한 공간감 위해 send 약간 높임. */
    "master": { "volume": -8, "limiter": -1, "reverb": { "decay": 2.2, "send": 0.18 }, "delay": { "send": 0.11 } },
    "budget": { "maxVoices": 16 },

    "bgm": {
      "defaultTrack": "title",
      "defaultIntensity": 0.4,
      "tracks": {

        /* ── 씬 허브 트랙 ──────────────────────────────────────────────────── */

        /* Title — '따뜻한 경이'의 첫인상. 밤하늘을 올려다보는 여름밤 동화(STORY §1).
         * calm/lydian = 부유·몽환. 느리고 별가루처럼 반짝이는 pluck. */
        "title": {
          "mood": "calm", "scale": "lydian", "key": "C", "bpm": 76,
          "progression": ["I", "II", "vi", "IV"],
          "layers": [
            { "id": "pad",   "preset": "pad",    "pattern": "chords",  "minIntensity": 0,    "vol": -13, "role": "bed" },
            { "id": "keys",  "preset": "fm-ep",  "pattern": "offbeat", "minIntensity": 0.3,  "vol": -16, "role": "warmth" },
            { "id": "glint", "preset": "pluck",  "pattern": "arp",     "minIntensity": 0.55, "vol": -15, "role": "starlight" }
          ]
        },

        /* Village — 솔뫼 마을 허브. 따뜻하고 살가운 일상(STORY §11). warm/major.
         * 출정 전후 돌아오는 안식처 — 베이스가 살짝 깔려 둥글게 흐른다. */
        "village": {
          "mood": "warm", "scale": "major", "key": "F", "bpm": 96,
          "progression": ["I", "V", "vi", "IV"],
          "layers": [
            { "id": "pad",   "preset": "pad",      "pattern": "chords",  "minIntensity": 0,    "vol": -14, "role": "bed" },
            { "id": "bass",  "preset": "saw-bass", "pattern": "root8",   "minIntensity": 0.25, "vol": -13, "role": "foundation" },
            { "id": "keys",  "preset": "fm-ep",    "pattern": "offbeat", "minIntensity": 0.4,  "vol": -15, "role": "warmth" },
            { "id": "lead",  "preset": "pluck",    "pattern": "arp",     "minIntensity": 0.65, "vol": -16, "role": "melody" }
          ]
        },

        /* ── 던전 탐험: 바이옴 온도 그룹 3 (수직 하강 곡선) ───────────────────── */

        /* explore_cold — 차가운 바이옴(region 01 이끼굴·03 회랑·07 우는늪·09 비탈).
         * "무서운 줄 알았던 어둠". calm/minor-pentatonic = 차분·조심스러운 탐험.
         * 낮은 인텐시티에선 패드만, 깊어질수록 드럼·플럭 진입. */
        "explore_cold": {
          "mood": "calm", "scale": "minor-pentatonic", "key": "A", "bpm": 84,
          "progression": ["i", "VI", "III", "VII"],
          "layers": [
            { "id": "pad",   "preset": "pad",           "pattern": "chords",  "minIntensity": 0,    "vol": -14, "role": "bed" },
            { "id": "bass",  "preset": "triangle-bass", "pattern": "root8",   "minIntensity": 0.3,  "vol": -13, "role": "foundation" },
            { "id": "drums", "preset": "kit",           "pattern": "backbeat","minIntensity": 0.5,  "vol": -13, "role": "drive" },
            { "id": "lead",  "preset": "pluck",         "pattern": "arp",     "minIntensity": 0.72, "vol": -15, "role": "melody" }
          ]
        },

        /* explore_warm — 따뜻한 바이옴(region 02 반창고협곡·05 별지도서고·08 켜진횃불·
         * 10 별의심장). 별이의 손길이 쌓이는 곳. warm/major = 따뜻·희망.
         * fm-ep가 횃불 같은 온기를 깐다. */
        "explore_warm": {
          "mood": "warm", "scale": "major", "key": "G", "bpm": 100,
          "progression": ["I", "IV", "vi", "V"],
          "layers": [
            { "id": "pad",   "preset": "pad",      "pattern": "chords",  "minIntensity": 0,    "vol": -14, "role": "bed" },
            { "id": "bass",  "preset": "saw-bass", "pattern": "root8",   "minIntensity": 0.3,  "vol": -12, "role": "foundation" },
            { "id": "drums", "preset": "kit",      "pattern": "backbeat","minIntensity": 0.5,  "vol": -12, "role": "drive" },
            { "id": "keys",  "preset": "fm-ep",    "pattern": "arp",     "minIntensity": 0.7,  "vol": -15, "role": "warmth" }
          ]
        },

        /* explore_mystic — 신비 바이옴(region 04 손수건미궁·06 속삭이는 수정굴).
         * 보라·수정빛. mystic/lydian = 부유·몽환. fm-bell이 메아리치는 수정 공명.
         * 가장 이상하고 아름다운 구간. */
        "explore_mystic": {
          "mood": "mystic", "scale": "lydian", "key": "D", "bpm": 88,
          "progression": ["I", "II", "vi", "iii"],
          "layers": [
            { "id": "pad",   "preset": "pad",           "pattern": "chords",  "minIntensity": 0,    "vol": -13, "role": "bed" },
            { "id": "bass",  "preset": "triangle-bass", "pattern": "root8",   "minIntensity": 0.32, "vol": -14, "role": "foundation" },
            { "id": "bell",  "preset": "fm-bell",       "pattern": "offbeat", "minIntensity": 0.55, "vol": -16, "role": "shimmer" },
            { "id": "glint", "preset": "pluck",         "pattern": "arp",     "minIntensity": 0.72, "vol": -15, "role": "melody" }
          ]
        },

        /* ── 전투 / 보스 / 최종보스 ───────────────────────────────────────── */

        /* combat — 방 입실 전투(문 잠김). 씩씩한 아이의 발걸음(STORY §1).
         * heroic/mixolydian = 블루지·밝은 용맹. 인텐시티 0부터 베이스·드럼이 깔려
         * 즉각 활기. 전투 격화 시 supersaw 훅. */
        "combat": {
          "mood": "heroic", "scale": "mixolydian", "key": "C", "bpm": 124,
          "progression": ["I", "bVII", "IV", "I"],
          "layers": [
            { "id": "pad",   "preset": "pad",      "pattern": "chords",  "minIntensity": 0,    "vol": -16, "role": "bed" },
            { "id": "bass",  "preset": "saw-bass", "pattern": "root8",   "minIntensity": 0,    "vol": -11, "role": "foundation" },
            { "id": "drums", "preset": "kit",      "pattern": "backbeat","minIntensity": 0.2,  "vol": -10, "role": "drive" },
            { "id": "lead",  "preset": "supersaw", "pattern": "arp",     "minIntensity": 0.5,  "vol": -13, "role": "hook" }
          ]
        },

        /* boss — 지역 보스(악몽 조각의 큰 덩어리). 긴박하지만 악의 없는 슬픔도 깔린.
         * tense/harmonic-minor = 긴박·드라마. four-floor 드럼이 압박을 민다. */
        "boss": {
          "mood": "tense", "scale": "harmonic-minor", "key": "A", "bpm": 150,
          "progression": ["i", "VI", "V", "i"],
          "layers": [
            { "id": "pad",   "preset": "pad",      "pattern": "chords",   "minIntensity": 0,    "vol": -14, "role": "bed" },
            { "id": "bass",  "preset": "saw-bass", "pattern": "pulse",    "minIntensity": 0,    "vol": -10, "role": "foundation" },
            { "id": "drums", "preset": "kit",      "pattern": "four-floor","minIntensity": 0,   "vol": -9,  "role": "drive" },
            { "id": "lead",  "preset": "supersaw", "pattern": "arp",      "minIntensity": 0.35, "vol": -12, "role": "hook" }
          ]
        },

        /* finalboss — 100층 '악몽의 핵'(region-10 별의 심장). 긴박을 뚫고 솟는 희망 —
         * tense가 아니라 heroic으로 전환(転의 음악적 번역: 깊은 곳엔 무서움이 아니라
         * 친구가 있었다). heroic/major + 빠른 BPM + 전부 베드(즉시 만개). */
        "finalboss": {
          "mood": "heroic", "scale": "major", "key": "C", "bpm": 132,
          "progression": ["I", "V", "vi", "IV"],
          "layers": [
            { "id": "pad",   "preset": "pad",      "pattern": "chords",   "minIntensity": 0,   "vol": -13, "role": "bed" },
            { "id": "bass",  "preset": "saw-bass", "pattern": "pulse",    "minIntensity": 0,   "vol": -10, "role": "foundation" },
            { "id": "drums", "preset": "kit",      "pattern": "four-floor","minIntensity": 0,  "vol": -9,  "role": "drive" },
            { "id": "lead",  "preset": "supersaw", "pattern": "arp",      "minIntensity": 0.2, "vol": -12, "role": "hook" }
          ]
        },

        /* result — 런 종료 요약(승/패 공용). 잔잔히 돌아보는 따뜻함.
         * warm/major + 느린 BPM. 승리는 인텐시티↑, 패배(별빛 송환)는 인텐시티↓로
         * 같은 트랙을 양면 운용(STORY §9 V1/V2). */
        "result": {
          "mood": "warm", "scale": "major", "key": "F", "bpm": 84,
          "progression": ["I", "vi", "IV", "V"],
          "layers": [
            { "id": "pad",   "preset": "pad",           "pattern": "chords",  "minIntensity": 0,    "vol": -13, "role": "bed" },
            { "id": "bass",  "preset": "triangle-bass", "pattern": "root8",   "minIntensity": 0.35, "vol": -14, "role": "foundation" },
            { "id": "lead",  "preset": "pluck",         "pattern": "arp",     "minIntensity": 0.6,  "vol": -15, "role": "melody" }
          ]
        }
      },

      /* 섹션 → 트랙 매핑(수평 리시퀀싱). 게임이 setSection(name)으로 전환.
       * 바이옴 그룹은 지역 입장 시 setSection('explore_cold'|'explore_warm'|
       * 'explore_mystic')로 라우팅(world.data.js region.id → 그룹은 AUDIO.md §4 표). */
      "sections": {
        "title": "title",
        "village": "village",
        "explore": "explore_cold",
        "explore_cold": "explore_cold",
        "explore_warm": "explore_warm",
        "explore_mystic": "explore_mystic",
        "combat": "combat",
        "boss": "boss",
        "finalboss": "finalboss",
        "result": "result"
      }
    },

    /* ── SFX 팔레트 (트랜지언트+바디+테일 레이어드 · SFX-LAYER-3/PITCH-ENV) ──────
     * 전투 SFX 재점검 + 능력 10종 변별 + 시스템 SFX 대확장.
     * 능력 SFX는 abilities-wiring.js 가 능력별 키를 부르도록 정합(아래 §능력 키 표).
     * ChipAudio 호환 키(jump/coin/hit/...)는 내장 폴백과 충돌 없게 유지. */
    "sfx": {

      /* ── 전투 코어(재점검) ───────────────────────────────────────────────── */
      "shoot":    { "layers": [ { "kind": "tone", "wave": "square", "freq": 760, "to": 520, "dur": 0.06, "vol": 0.3 } ] },
      "hit":      { "layers": [ { "kind": "noise", "filter": 1400, "dur": 0.06, "vol": 0.4 },
                                { "kind": "tone", "wave": "square", "freq": 220, "dur": 0.07, "vol": 0.3 } ] },
      "enemyDie": { "layers": [ { "kind": "noise", "filter": 3200, "dur": 0.05, "vol": 0.48 },
                                { "kind": "tone", "wave": "triangle", "freq": 880, "to": 1320, "dur": 0.14, "vol": 0.34, "delay": 0.01 },
                                { "kind": "boom", "freq": "C3", "dur": 0.2, "vol": 0.4, "delay": 0.02 } ] },
      "hurt":     { "layers": [ { "kind": "noise", "filter": 700, "dur": 0.18, "vol": 0.5 },
                                { "kind": "tone", "wave": "sawtooth", "freq": 180, "to": 90, "dur": 0.18, "vol": 0.42 } ] },
      "coin":     { "layers": [ { "kind": "tone", "wave": "square", "freq": 988, "dur": 0.05, "vol": 0.4 },
                                { "kind": "tone", "wave": "square", "freq": 1319, "dur": 0.11, "vol": 0.4, "delay": 0.05 } ] },
      "powerup":  { "layers": [ { "kind": "tone", "wave": "square", "freq": 523, "dur": 0.1, "vol": 0.4 },
                                { "kind": "tone", "wave": "square", "freq": 784, "dur": 0.1, "vol": 0.4, "delay": 0.08 },
                                { "kind": "tone", "wave": "square", "freq": 1047, "dur": 0.16, "vol": 0.4, "delay": 0.16 } ] },
      "descend":  { "layers": [ { "kind": "tone", "wave": "square", "freq": 523, "dur": 0.12, "vol": 0.4 },
                                { "kind": "tone", "wave": "square", "freq": 659, "dur": 0.12, "vol": 0.4, "delay": 0.1 },
                                { "kind": "tone", "wave": "square", "freq": 1047, "dur": 0.2, "vol": 0.4, "delay": 0.2 } ] },

      /* ── 보스 / 승패 ─────────────────────────────────────────────────────── */
      "bossWarn": { "layers": [ { "kind": "metal", "freq": 180, "dur": 0.5, "vol": 0.4 },
                                { "kind": "boom", "freq": "A1", "dur": 0.6, "vol": 0.55, "delay": 0.05 } ] },
      "gameover": { "layers": [ { "kind": "tone", "wave": "triangle", "freq": 392, "dur": 0.22, "vol": 0.5 },
                                { "kind": "tone", "wave": "triangle", "freq": 262, "dur": 0.22, "vol": 0.5, "delay": 0.18 },
                                { "kind": "tone", "wave": "triangle", "freq": 175, "dur": 0.4, "vol": 0.5, "delay": 0.36 } ] },
      "win":      { "layers": [ { "kind": "tone", "wave": "square", "freq": 659, "dur": 0.14, "vol": 0.45 },
                                { "kind": "tone", "wave": "square", "freq": 880, "dur": 0.14, "vol": 0.45, "delay": 0.12 },
                                { "kind": "tone", "wave": "square", "freq": 1319, "dur": 0.3, "vol": 0.45, "delay": 0.24 },
                                { "kind": "fm", "freq": 1760, "harmonicity": 2, "modIndex": 6, "dur": 0.5, "vol": 0.3, "delay": 0.36 } ] },

      /* ── 이동기(고정 + 기동 액티브) — dodge 계열 ─────────────────────────────
       * 닷지롤/혜성돌진/팡점멸: 바람 스윕 + 상승 톤(SFX-PITCH-ENV 상승=긍정/회피). */
      "dodge":     { "layers": [ { "kind": "noise", "filter": 5200, "dur": 0.14, "vol": 0.3 },
                                 { "kind": "tone", "wave": "triangle", "freq": 440, "to": 900, "dur": 0.12, "vol": 0.26 } ] },
      "comet":     { "layers": [ { "kind": "noise", "filter": 4200, "dur": 0.22, "vol": 0.34 },
                                 { "kind": "tone", "wave": "sawtooth", "freq": 360, "to": 760, "dur": 0.2, "vol": 0.3 },
                                 { "kind": "tone", "wave": "triangle", "freq": 720, "dur": 0.12, "vol": 0.24, "delay": 0.1 } ] },
      "blink":     { "layers": [ { "kind": "tone", "wave": "triangle", "freq": 1200, "to": 300, "dur": 0.1, "vol": 0.32 },
                                 { "kind": "boom", "freq": "C3", "dur": 0.18, "vol": 0.4, "delay": 0.06 },
                                 { "kind": "noise", "filter": 2600, "dur": 0.1, "vol": 0.26, "delay": 0.06 } ] },

      /* ── 화력 액티브 — 변별 음색 ──────────────────────────────────────────── */
      "nova":      { "layers": [ { "kind": "boom", "freq": "C2", "dur": 0.45, "vol": 0.68 },
                                 { "kind": "noise", "filter": 900, "dur": 0.3, "vol": 0.38, "delay": 0.02 },
                                 { "kind": "tone", "wave": "square", "freq": 300, "to": 120, "dur": 0.2, "vol": 0.3 } ] },
      "scatter":   { "layers": [ { "kind": "noise", "filter": 3000, "dur": 0.08, "vol": 0.4 },
                                 { "kind": "tone", "wave": "square", "freq": 520, "to": 380, "dur": 0.1, "vol": 0.32, "delay": 0.01 } ] },
      "charge":    { "layers": [ { "kind": "tone", "wave": "sawtooth", "freq": 200, "to": 900, "dur": 0.5, "vol": 0.3 },
                                 { "kind": "boom", "freq": "G2", "dur": 0.3, "vol": 0.5, "delay": 0.48 },
                                 { "kind": "noise", "filter": 4000, "dur": 0.12, "vol": 0.3, "delay": 0.48 } ] },
      "turbo":     { "layers": [ { "kind": "tone", "wave": "square", "freq": 440, "to": 880, "dur": 0.18, "vol": 0.34 },
                                 { "kind": "tone", "wave": "square", "freq": 660, "dur": 0.1, "vol": 0.3, "delay": 0.1 } ] },

      /* ── 별빛 액티브 — 빛·정화 음색(fm 벨 중심) ───────────────────────────── */
      "ward":      { "layers": [ { "kind": "fm", "freq": 523, "harmonicity": 3, "modIndex": 8, "dur": 0.4, "vol": 0.36 },
                                 { "kind": "tone", "wave": "triangle", "freq": 784, "dur": 0.3, "vol": 0.26, "delay": 0.04 } ] },
      "purify":    { "layers": [ { "kind": "fm", "freq": 660, "harmonicity": 2.5, "modIndex": 6, "dur": 0.5, "vol": 0.38 },
                                 { "kind": "noise", "filter": 2200, "dur": 0.3, "vol": 0.24, "delay": 0.02 },
                                 { "kind": "tone", "wave": "triangle", "freq": 990, "to": 1320, "dur": 0.3, "vol": 0.24, "delay": 0.06 } ] },

      /* ── 궁극기 — 가장 큰 임팩트(별빛 100 소비) ───────────────────────────── */
      "ultGolden": { "layers": [ { "kind": "boom", "freq": "C2", "dur": 0.5, "vol": 0.7 },
                                 { "kind": "fm", "freq": 880, "harmonicity": 2, "modIndex": 10, "dur": 0.5, "vol": 0.4, "delay": 0.02 },
                                 { "kind": "noise", "filter": 1200, "dur": 0.4, "vol": 0.32, "delay": 0.04 } ] },
      "ultStar":   { "layers": [ { "kind": "fm", "freq": 1320, "harmonicity": 3, "modIndex": 12, "dur": 0.5, "vol": 0.42 },
                                 { "kind": "noise", "filter": 5000, "dur": 0.16, "vol": 0.36, "delay": 0.0 },
                                 { "kind": "boom", "freq": "F2", "dur": 0.4, "vol": 0.5, "delay": 0.08 } ] },
      /* skill: 일반 스킬 폴백(특정 키 없는 액티브용 — abilities-wiring 호환) */
      "skill":     { "layers": [ { "kind": "fm", "freq": 660, "harmonicity": 2.5, "modIndex": 10, "dur": 0.3, "vol": 0.4 },
                                 { "kind": "noise", "filter": 2200, "dur": 0.18, "vol": 0.26, "delay": 0.02 } ] },

      /* ── 시스템 SFX (마을·UI·던전 인터랙션) — 필수 커버 항목 ─────────────────
       * UI 음은 BGM 중역과 안 겹치게 고역·짧게(SFX-FEEDBACK-CLARITY). 긍정=상승,
       * 거절/실패=하강, 묵직한 확정(강화 성공·보물)=boom 바디. */

      /* UI 공통 */
      "uiSelect":  { "layers": [ { "kind": "tone", "wave": "square", "freq": 740, "dur": 0.04, "vol": 0.3 } ] },
      "uiConfirm": { "layers": [ { "kind": "tone", "wave": "square", "freq": 660, "dur": 0.05, "vol": 0.34 },
                                 { "kind": "tone", "wave": "square", "freq": 990, "dur": 0.08, "vol": 0.34, "delay": 0.05 } ] },
      "uiCancel":  { "layers": [ { "kind": "tone", "wave": "square", "freq": 520, "to": 300, "dur": 0.08, "vol": 0.3 } ] },
      "uiError":   { "layers": [ { "kind": "tone", "wave": "sawtooth", "freq": 260, "to": 180, "dur": 0.14, "vol": 0.34 } ] },

      /* 장비 장착(둔탁한 가죽·금속 소리 — 무쇠 누나의 손길) */
      "equip":     { "layers": [ { "kind": "noise", "filter": 1800, "dur": 0.07, "vol": 0.34 },
                                 { "kind": "tone", "wave": "triangle", "freq": 330, "dur": 0.1, "vol": 0.3, "delay": 0.02 } ] },

      /* 강화 성공(대장간 '탕!' — 망치 임팩트 + 별빛 띵) */
      "upgrade":   { "layers": [ { "kind": "metal", "freq": 220, "dur": 0.16, "vol": 0.4 },
                                 { "kind": "tone", "wave": "triangle", "freq": 880, "to": 1320, "dur": 0.22, "vol": 0.32, "delay": 0.04 },
                                 { "kind": "fm", "freq": 1320, "harmonicity": 2, "modIndex": 5, "dur": 0.3, "vol": 0.28, "delay": 0.08 } ] },
      /* 강화 실패(불발 — 둔탁한 하강) */
      "upgradeFail": { "layers": [ { "kind": "metal", "freq": 140, "dur": 0.14, "vol": 0.34 },
                                   { "kind": "tone", "wave": "sawtooth", "freq": 240, "to": 120, "dur": 0.16, "vol": 0.3, "delay": 0.04 } ] },

      /* 구매(잡화점 동전 짤랑 — coin보다 따뜻한 거래음) */
      "buy":       { "layers": [ { "kind": "tone", "wave": "square", "freq": 880, "dur": 0.05, "vol": 0.36 },
                                 { "kind": "tone", "wave": "square", "freq": 1175, "dur": 0.08, "vol": 0.36, "delay": 0.05 },
                                 { "kind": "noise", "filter": 4200, "dur": 0.05, "vol": 0.2, "delay": 0.02 } ] },
      /* 판매(가벼운 하강 — 내려놓음) */
      "sell":      { "layers": [ { "kind": "tone", "wave": "square", "freq": 660, "to": 880, "dur": 0.06, "vol": 0.32 },
                                 { "kind": "tone", "wave": "square", "freq": 440, "dur": 0.07, "vol": 0.3, "delay": 0.05 } ] },

      /* 퀘스트 수주(차분한 약속음) / 완료(밝은 달성 팡파레) */
      "questAccept": { "layers": [ { "kind": "fm", "freq": 523, "harmonicity": 2, "modIndex": 4, "dur": 0.2, "vol": 0.32 },
                                   { "kind": "tone", "wave": "triangle", "freq": 784, "dur": 0.16, "vol": 0.26, "delay": 0.06 } ] },
      "questDone":   { "layers": [ { "kind": "tone", "wave": "square", "freq": 659, "dur": 0.1, "vol": 0.4 },
                                   { "kind": "tone", "wave": "square", "freq": 880, "dur": 0.1, "vol": 0.4, "delay": 0.08 },
                                   { "kind": "tone", "wave": "square", "freq": 1175, "dur": 0.14, "vol": 0.4, "delay": 0.16 },
                                   { "kind": "fm", "freq": 1568, "harmonicity": 2, "modIndex": 6, "dur": 0.3, "vol": 0.28, "delay": 0.24 } ] },

      /* 스킬트리 학습(별지기의 가르침 — 별빛이 깃드는 신비음) */
      "learnSkill": { "layers": [ { "kind": "fm", "freq": 440, "harmonicity": 3, "modIndex": 8, "dur": 0.3, "vol": 0.36 },
                                  { "kind": "fm", "freq": 660, "harmonicity": 3, "modIndex": 8, "dur": 0.3, "vol": 0.32, "delay": 0.08 },
                                  { "kind": "tone", "wave": "triangle", "freq": 1320, "dur": 0.26, "vol": 0.24, "delay": 0.16 } ] },
      /* 스탯 분배(별엿 한 입 — 톡 튀는 성장음) */
      "statUp":    { "layers": [ { "kind": "tone", "wave": "triangle", "freq": 523, "to": 784, "dur": 0.12, "vol": 0.34 },
                                 { "kind": "tone", "wave": "triangle", "freq": 1047, "dur": 0.12, "vol": 0.3, "delay": 0.08 } ] },

      /* 문 잠금(입실 시 철컥) / 문 개방(전멸 후 스르륵 열림) */
      "doorLock":  { "layers": [ { "kind": "metal", "freq": 160, "dur": 0.12, "vol": 0.36 },
                                 { "kind": "boom", "freq": "C2", "dur": 0.16, "vol": 0.4, "delay": 0.03 } ] },
      "doorOpen":  { "layers": [ { "kind": "noise", "filter": 1200, "dur": 0.22, "vol": 0.3 },
                                 { "kind": "tone", "wave": "triangle", "freq": 392, "to": 587, "dur": 0.24, "vol": 0.3, "delay": 0.04 },
                                 { "kind": "fm", "freq": 880, "harmonicity": 2, "modIndex": 4, "dur": 0.2, "vol": 0.24, "delay": 0.12 } ] },

      /* 비밀방 발견(별이 흔적 — 가슴 뛰는 발견음) */
      "secret":    { "layers": [ { "kind": "fm", "freq": 784, "harmonicity": 2.5, "modIndex": 6, "dur": 0.3, "vol": 0.38 },
                                 { "kind": "tone", "wave": "triangle", "freq": 1175, "to": 1568, "dur": 0.3, "vol": 0.3, "delay": 0.06 },
                                 { "kind": "fm", "freq": 1568, "harmonicity": 3, "modIndex": 5, "dur": 0.4, "vol": 0.26, "delay": 0.16 } ] },
      /* 보물 개봉(묵직한 뚜껑 + 반짝 — 확정 보상) */
      "treasure":  { "layers": [ { "kind": "boom", "freq": "C2", "dur": 0.2, "vol": 0.5 },
                                 { "kind": "noise", "filter": 3600, "dur": 0.06, "vol": 0.28, "delay": 0.04 },
                                 { "kind": "tone", "wave": "square", "freq": 988, "dur": 0.1, "vol": 0.36, "delay": 0.1 },
                                 { "kind": "tone", "wave": "square", "freq": 1319, "dur": 0.16, "vol": 0.36, "delay": 0.2 } ] },

      /* 미니맵 토글(짧은 UI 칩) / 씬 전환(부드러운 휘이 — 마을↔월드맵↔던전) */
      "minimap":   { "layers": [ { "kind": "tone", "wave": "square", "freq": 1320, "dur": 0.04, "vol": 0.26 } ] },
      "transition":{ "layers": [ { "kind": "noise", "filter": 3000, "dur": 0.2, "vol": 0.24 },
                                 { "kind": "tone", "wave": "triangle", "freq": 392, "to": 784, "dur": 0.26, "vol": 0.26 } ] }
    },

    "balanceConfig": { "maxReverbDecay": 4, "bpmTolerance": 12, "maxVoices": 16 }
  };

  g.POP_AUDIO = AUDIO;
  if (typeof module !== 'undefined' && module.exports) module.exports = { AUDIO: AUDIO };
})(typeof window !== 'undefined' ? window : globalThis);
