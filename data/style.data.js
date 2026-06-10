/* ============================================================================
 * 팡팡 던전 — 비주얼 스타일 데이터 (style-architect 계약 · lint-style.mjs)
 * ----------------------------------------------------------------------------
 * 게임 전체 색의 상류 권위(단일 진실). game.js 는 모든 색을 이 램프/역할색에서
 * 참조하고, emit-json.mjs 가 style.json + assets/palette.master.json 으로 추출한다.
 * 무드: torchlit-pop-dungeon — 차가운 청남색 돌어둠 속, 횃불빛을 받은 도트 모험가.
 * 매체: pixel(도트) — game.js render 블록과 1:1 미러 (D7).
 * 팔레트: 램프 8개(33색) + 중립 2 + 배경 1 + 층 변주 9(배경 1 재사용) = 고유 45색 ≤ 48.
 *   boss_tints 는 램프 색을 그대로 재사용(고유 색 수 증가 0).
 *
 * 브라우저: window.POP_STYLE 전역. Node: module.exports.STYLE.
 *   data/index.mjs 집계 진입점이 이 모듈을 import 해 emit-json.mjs 로 추출한다.
 * ==========================================================================*/
(function (g) {
  'use strict';

  var STYLE = {
    "slug": "pop-dungeon",
    "schema_version": 1,
    "medium": "pixel",
    "tier": 2,
    "mood": "torchlit-pop-dungeon",
    "master_palette": {
      "ramps": {
        "stone":   ["#1b2030", "#2a3349", "#3f4f6b", "#5d7693"],
        "torch":   ["#4a2210", "#8a3d1c", "#d96a28", "#ffa53a", "#ffe9a8"],
        "hero":    ["#0f3f38", "#188a72", "#3fd6a8", "#aef7dd"],
        "scarlet": ["#531222", "#a02038", "#e83a52", "#ff8d7a"],
        "gold":    ["#7a4a12", "#c98a1f", "#ffc63a", "#fff1b8"],
        "venom":   ["#173a1c", "#2f7a2c", "#5cc23e", "#c2f57e"],
        "arcane":  ["#2b1a4d", "#5d35a8", "#9a66e8", "#d9b8ff"],
        "steel":   ["#232c40", "#45526e", "#7d8fae", "#c6d4e6"]
      },
      "neutrals": { "black": "#15121f", "white": "#ffffff" },
      "background": "#10131f"
    },
    "role_colors": {
      "player": "#3fd6a8",
      "enemy": "#ff8d7a",
      "danger": "#e83a52",
      "pickup": "#ffc63a",
      "ui_accent": "#ffa53a"
    },
    "variants": {
      "floor_backgrounds": ["#10131f", "#150f24", "#0f1a1c", "#1c0f16", "#0d1426", "#1a1228", "#1d130c", "#0f1f17", "#1d0f20", "#141031"],
      "boss_tints": ["#c2f57e", "#aef7dd", "#ff8d7a", "#ffa53a", "#ffc63a", "#d9b8ff", "#9a66e8"]
    },
    "proportions": { "head_to_body": "1:1.4", "silhouette": "chibi-round", "min_feature_px": 1 },
    "line": { "outline": "full", "outline_color": "darker-of-fill", "weight_px": 1 },
    "shading": { "model": "cell", "light_dir": "NW", "ramp_steps": 3, "hue_shift": "warm-light-cool-shadow", "dither": "sparse" },
    "render": { "pixelArt": true, "antialias": false, "roundPixels": true },
    "lintConfig": {
      "min_contrast_ratio": 3.0,
      "max_palette_colors": 48,
      "known_moods": ["torchlit-pop-dungeon", "custom"],
      "ip_redwords": ["gungeon", "enter the gungeon", "엔터더건전", "isaac", "soul knight", "nuclear throne", "mario", "zelda"]
    }
  };

  g.POP_STYLE = STYLE;
  if (typeof module !== 'undefined' && module.exports) module.exports = { STYLE: STYLE };
})(typeof window !== 'undefined' ? window : globalThis);
