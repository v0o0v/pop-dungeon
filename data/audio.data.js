/* ============================================================================
 * 팡팡 던전 — 사운드 데이터 (sound-architect 계약 · lint-audio.mjs · SoundForge)
 * ----------------------------------------------------------------------------
 * 무드: 경쾌·아기자기(explore) → 활기찬 전투(combat) → 긴박한 보스(boss).
 * 섹션 전환 + 인텐시티 레이어. 전부 절차 합성 오리지널(CC0).
 *
 * 브라우저: window.POP_AUDIO 전역. Node: module.exports.AUDIO.
 * ==========================================================================*/
(function (g) {
  'use strict';

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

  g.POP_AUDIO = AUDIO;
  if (typeof module !== 'undefined' && module.exports) module.exports = { AUDIO: AUDIO };
})(typeof window !== 'undefined' ? window : globalThis);
