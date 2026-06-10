/* ============================================================================
 * 팡팡 던전 (Pop Dungeon) — 탑다운 불릿헬 로그라이크 (세로 모바일)
 * ----------------------------------------------------------------------------
 * 엔진: Phaser 4.1.0 (MIT) + PX 도트 래스터라이저(VectorForge.bake ss:1 플럼빙 재사용)
 *       + SoundForge(Tone.js 절차 사운드) + AbilityKit + JoystickKit + MobileHarness.
 * 룩: torchlit-pop-dungeon — 픽셀(도트) 매체 · 셀 3단 NW 셰이딩 · 1px 풀 아웃라인 (STYLE.md).
 * 에셋·사운드·이름: 100% 코드 생성 오리지널(CC0/IP-safe). 엔터더건전 등 원작 자산 미사용.
 * 레퍼런스: game-dna/shooters-roguelite.md (닷지롤 무적·방클리어·층진행·아이템 시너지)를
 *           단일플레이 모바일 축소판으로 재현.
 * 데이터: window.POP_ABILITIES / POP_ITEMS / POP_AUDIO (data.js, 단일 소스).
 * ==========================================================================*/
(function () {
  'use strict';

  // ── 디자인 해상도 (세로 9:16) ───────────────────────────────────────────────
  var DESIGN_W = 540, DESIGN_H = 960;
  // 플레이필드(아레나): 위 HUD 밴드와 아래 컨트롤 밴드를 피한 사각형
  var ARENA = { x: 22, y: 150, w: 496, h: 668 };
  var ARENA_R = ARENA.x + ARENA.w, ARENA_B = ARENA.y + ARENA.h;

  // ── 공유 입력 (HUD 씬이 쓰고 Game 씬이 읽음) ────────────────────────────────
  var GAME_INPUT = { moveX: 0, moveY: 0, dodge: false, skill1: false, skill2: false, ult: false };

  // ── 오디오 (SoundForge, data.js 스펙) ───────────────────────────────────────
  var GAME_AUDIO = new SoundForge(window.POP_AUDIO);
  window.GAME_AUDIO = GAME_AUDIO; // mobile.js 음소거/가시성 가드가 참조

  // ── 메타 진행 (localStorage) ────────────────────────────────────────────────
  var META_KEY = 'pop-dungeon-meta-v1';
  function loadMeta() {
    try { var m = JSON.parse(localStorage.getItem(META_KEY)); if (m && typeof m === 'object') return m; } catch (e) {}
    return { bestFloor: 0, runs: 0, totalCoins: 0, wins: 0 };
  }
  function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(META)); } catch (e) {} }
  var META = loadMeta();

  // ── 런 상태 (런마다 리셋) ───────────────────────────────────────────────────
  var RUN = null;
  function freshRun() {
    return {
      floor: 1, maxHp: 4, hp: 4, coins: 0, items: [], itemCounts: {},
      stats: {}, boss: null, bossHpFrac: 0, bossName: '', kills: 0
    };
  }

  // ── 스타일 단일 진실 (style-architect: data.js POP_STYLE → StyleKit) ─────────
  // 모든 색은 master_palette 램프/역할색에서 나온다 — 코드에 hex 직접 쓰기 금지(STYLE.md §6).
  var STYLE = StyleKit.load(window.POP_STYLE);
  window.GAME_STYLE = STYLE;
  var RAMPS = STYLE.master_palette.ramps;
  var VARIANTS = (window.POP_STYLE && window.POP_STYLE.variants) || {};
  var FLOOR_BG = VARIANTS.floor_backgrounds || [STYLE.master_palette.background];
  var INK = STYLE.master_palette.neutrals.black;     // 외곽선·눈동자·텍스트 그림자
  var WHITE = STYLE.master_palette.neutrals.white;
  var ROLE = STYLE.role_colors;                      // player/enemy/danger/pickup/ui_accent
  var WHITE_INT = StyleKit.hexToInt(WHITE, 0xffffff);
  var INK_INT = StyleKit.hexToInt(INK, 0x000000);
  var BOSS_TINTS = (VARIANTS.boss_tints || []).map(function (h) { return StyleKit.hexToInt(h, 0xffffff); });
  function ramp(name, i) { return RAMPS[name][i]; }
  function rampInt(name, i) { return StyleKit.hexToInt(RAMPS[name][i], 0xffffff); }
  function roleInt(r) { return StyleKit.roleColorInt(STYLE, r); }
  function rgba(hex, a) { var c = StyleKit.parseRGBA(hex); return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')'; }
  // 등급색은 아이템 데이터(items.rarities)가 권위 — master gold/rarity 체계와 정합(STYLE.md §2)
  var RARITY_COLOR = {};
  (window.POP_ITEMS.rarities || []).forEach(function (r) { RARITY_COLOR[r.id] = StyleKit.hexToInt(r.color, 0xffffff); });

  // 아이템/스킬 스펙 인덱스
  var ITEM_BY_ID = {};
  (window.POP_ITEMS.items || []).forEach(function (it) { ITEM_BY_ID[it.id] = it; });
  // 런에서 뽑을 수 있는 장비/소모품 풀(통화 제외)
  var DROP_POOL = (window.POP_ITEMS.items || []).filter(function (it) { return it.kind === 'equipment' || it.kind === 'consumable'; });

  // ===========================================================================
  // 도트 아트 베이킹 — 횃불 돌던전 픽셀 룩 (STYLE §3·§4)
  //   · 32px급 디테일 도트 · 2등신 치비 · 1px 잉크 풀 아웃라인(darker-of-fill)
  //   · 셀 3단(NW 광원 고정) + 넓은 면에만 절제 디더 · 그라데이션·글로우 금지
  //   · VectorForge.bake 는 ss:1(슈퍼샘플 없음) 캔버스→텍스처 플럼빙으로만 쓰고,
  //     모든 드로잉은 아래 PX 래스터라이저가 정수 좌표 1px 단위로만 찍는다.
  // ===========================================================================

  // ── PX: 마스크 기반 1px 래스터라이저 ───────────────────────────────────────
  function dot(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, 1, 1); }
  function bar(ctx, x, y, bw, bh, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, bw | 0, bh | 0); }

  function pxShape(w, h) {
    var m = new Uint8Array(w * h);
    var s = { w: w, h: h, m: m };
    s.ellipse = function (cx, cy, rx, ry) {
      var y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(h - 1, Math.ceil(cy + ry));
      var x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(w - 1, Math.ceil(cx + rx));
      for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
        var nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) m[y * w + x] = 1;
      }
      return s;
    };
    s.rect = function (x0, y0, rw, rh) {
      var y1 = Math.min(h, Math.round(y0 + rh)), x1 = Math.min(w, Math.round(x0 + rw));
      for (var y = Math.max(0, Math.round(y0)); y < y1; y++)
        for (var x = Math.max(0, Math.round(x0)); x < x1; x++) m[y * w + x] = 1;
      return s;
    };
    s.poly = function (pts) {
      var minY = h, maxY = 0, i;
      for (i = 0; i < pts.length; i++) { if (pts[i][1] < minY) minY = pts[i][1]; if (pts[i][1] > maxY) maxY = pts[i][1]; }
      for (var y = Math.max(0, Math.floor(minY)); y <= Math.min(h - 1, Math.ceil(maxY)); y++) {
        var yc = y + 0.5, xs = [];
        for (i = 0; i < pts.length; i++) {
          var a = pts[i], b = pts[(i + 1) % pts.length];
          if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
        }
        xs.sort(function (p, q) { return p - q; });
        for (var k = 0; k + 1 < xs.length; k += 2)
          for (var x = Math.max(0, Math.round(xs[k])); x < Math.min(w, Math.round(xs[k + 1])); x++) m[y * w + x] = 1;
      }
      return s;
    };
    return s;
  }

  // 마스크 → 셀 3단 칠 + 1px 풀 아웃라인(가장자리 픽셀).
  // o = { cols:[dark,mid,light] 또는 [단색], outline, cx,cy,rx,ry(셰이딩 프레임), dither }
  function pxPaint(ctx, s, o) {
    var w = s.w, h = s.h, m = s.m, cols = o.cols, ink = o.outline;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      var edge = x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
        !m[y * w + x - 1] || !m[y * w + x + 1] || !m[(y - 1) * w + x] || !m[(y + 1) * w + x];
      if (edge && ink) { dot(ctx, x, y, ink); continue; }
      var c = cols[0];
      if (cols.length > 1) {
        var nx = (x + 0.5 - o.cx) / o.rx, ny = (y + 0.5 - o.cy) / o.ry;
        var t = -(nx * 0.38 + ny * 0.62);                  // NW 광원: 좌상이 밝다
        var band = t > 0.30 ? 2 : t > -0.26 ? 1 : 0;
        if (o.dither) {                                    // 경계 체커 디더(넓은 면 전용)
          if (band === 1 && t > 0.18 && ((x + y) & 1)) band = 2;
          else if (band === 0 && t > -0.38 && ((x + y) & 1)) band = 1;
        }
        c = cols[band];
      }
      dot(ctx, x, y, c);
    }
  }

  function pxShadow(ctx, w, h, cx, cy, rx, ry) {
    pxPaint(ctx, pxShape(w, h).ellipse(cx, cy, rx, ry), { cols: [rgba(INK, 0.28)] });
  }

  // 발광 탄 — 방사 4단 픽셀 링(코어→림). 글로우 셰이더 대체.
  function pxOrb(ctx, W, H, cx, cy, r, cols) {
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.sqrt(dx * dx + dy * dy);
      if (d > r) continue;
      dot(ctx, x, y, d <= r * 0.34 ? cols[0] : d <= r * 0.62 ? cols[1] : d <= r - 1.2 ? cols[2] : cols[3]);
    }
  }

  // 1px 타원 링(코인 각인 등)
  function pxRing(ctx, cx, cy, rx, ry, c) {
    for (var a = 0; a < 64; a++) { var th = a / 64 * Math.PI * 2; dot(ctx, cx + Math.cos(th) * rx, cy + Math.sin(th) * ry, c); }
  }

  function cel(name) { return [ramp(name, 1), ramp(name, 2), ramp(name, 3)]; }

  function bakeArt(scene) {
    function bakePx(key, w, h, frames) { VectorForge.bake(scene, key, { w: w, h: h, ss: 1, frames: frames }); }

    // 플레이어 '호두' — 민트 2등신 치비 팝거너(시그니처: 어둠 속 횃불빛 받은 민트 히어로, STORY.md §8)
    function drawHero(ctx, w, h, t) {
      var bob = t ? -1 : 0, by = 7 + bob;
      pxShadow(ctx, w, h, 18, 34.5, 9, 2.4);
      // 몸통(작은 하체)
      pxPaint(ctx, pxShape(w, h).ellipse(18, by + 20, 8, 6.5),
        { cols: cel('hero'), outline: ramp('hero', 0), cx: 18, cy: by + 20, rx: 8, ry: 6.5 });
      // 발(부츠)
      bar(ctx, 13, 33, 4, 2, ramp('hero', 1)); bar(ctx, 19, 33, 4, 2, ramp('hero', 1));
      bar(ctx, 13, 35, 4, 1, ramp('hero', 0)); bar(ctx, 19, 35, 4, 1, ramp('hero', 0));
      // 머리(큰 치비 헤드)
      pxPaint(ctx, pxShape(w, h).ellipse(18, by + 9, 10.5, 9.5),
        { cols: cel('hero'), outline: ramp('hero', 0), cx: 18, cy: by + 9, rx: 10.5, ry: 9.5 });
      // 배 패치
      pxPaint(ctx, pxShape(w, h).ellipse(18, by + 22, 4, 3), { cols: [ramp('hero', 3)] });
      // 좌상 스펙 하이라이트(횃불빛)
      bar(ctx, 12, by + 3, 3, 1, ramp('hero', 3)); bar(ctx, 11, by + 4, 2, 1, ramp('hero', 3));
      // 눈(흰자 3x4 + 잉크 동공 + 캐치라이트)
      bar(ctx, 12, by + 6, 3, 4, WHITE); bar(ctx, 21, by + 6, 3, 4, WHITE);
      bar(ctx, 13, by + 8, 2, 2, INK); bar(ctx, 22, by + 8, 2, 2, INK);
      dot(ctx, 13, by + 8, WHITE); dot(ctx, 22, by + 8, WHITE);
      // 볼터치(횃불 온기) + 미소
      bar(ctx, 10, by + 11, 2, 1, ramp('torch', 2)); bar(ctx, 24, by + 11, 2, 1, ramp('torch', 2));
      dot(ctx, 16, by + 12, INK); dot(ctx, 17, by + 13, INK); dot(ctx, 18, by + 13, INK); dot(ctx, 19, by + 12, INK);
      // 팝건(머리 옆, 골드)
      pxPaint(ctx, pxShape(w, h).rect(24, by + 16, 9, 4), { cols: [ramp('gold', 1)], outline: ramp('gold', 0) });
      bar(ctx, 25, by + 17, 7, 1, ramp('gold', 2));
      bar(ctx, 33, by + 17, 2, 2, INK);
    }
    bakePx('hero', 36, 38, [function (c, w, h) { drawHero(c, w, h, 0); }, function (c, w, h) { drawHero(c, w, h, 1); }]);

    // 슬라임(추적) — venom 돔 블롭
    function drawSlime(ctx, w, h, t) {
      pxShadow(ctx, w, h, 15, 25.5, 9, 2);
      var s = t ? pxShape(w, h).ellipse(15, 16, 11, 8).rect(4, 18, 22, 6)
                : pxShape(w, h).ellipse(15, 15, 10, 9).rect(5, 17, 20, 7);
      pxPaint(ctx, s, { cols: cel('venom'), outline: ramp('venom', 0), cx: 15, cy: 15, rx: 11, ry: 9 });
      dot(ctx, t ? 21 : 20, t ? 9 : 8, ramp('venom', 3));   // 젤리 방울
      bar(ctx, 10, 13, 2, 3, WHITE); bar(ctx, 18, 13, 2, 3, WHITE);
      dot(ctx, 11, 14, INK); dot(ctx, 11, 15, INK); dot(ctx, 19, 14, INK); dot(ctx, 19, 15, INK);
      bar(ctx, 13, 18, 4, 1, ramp('venom', 0)); dot(ctx, 12, 17, ramp('venom', 0)); dot(ctx, 17, 17, ramp('venom', 0));
    }
    bakePx('slime', 30, 28, [function (c, w, h) { drawSlime(c, w, h, 0); }, function (c, w, h) { drawSlime(c, w, h, 1); }]);

    // 오브(확산) — arcane 부유 구체
    function drawOrb(ctx, w, h, t) {
      var bob = t ? -1 : 0;
      pxShadow(ctx, w, h, 14, 25, 6, 1.6);
      pxPaint(ctx, pxShape(w, h).ellipse(14, 13 + bob, 9.5, 9.5),
        { cols: cel('arcane'), outline: ramp('arcane', 0), cx: 14, cy: 13 + bob, rx: 9.5, ry: 9.5 });
      bar(ctx, 9, 8 + bob, 2, 1, ramp('arcane', 3)); dot(ctx, 9, 8 + bob, WHITE);
      bar(ctx, 10, 12 + bob, 2, 3, WHITE); bar(ctx, 16, 12 + bob, 2, 3, WHITE);
      dot(ctx, 11, 13 + bob, INK); dot(ctx, 11, 14 + bob, INK); dot(ctx, 17, 13 + bob, INK); dot(ctx, 17, 14 + bob, INK);
      // 떠다니는 마력 불티
      if (t) { dot(ctx, 5, 18, ramp('arcane', 3)); dot(ctx, 23, 6, ramp('arcane', 3)); }
      else { dot(ctx, 4, 7, ramp('arcane', 3)); dot(ctx, 24, 17, ramp('arcane', 3)); }
    }
    bakePx('orb', 28, 28, [function (c, w, h) { drawOrb(c, w, h, 0); }, function (c, w, h) { drawOrb(c, w, h, 1); }]);

    // 박쥐(비행) — steel 날개
    function drawBat(ctx, w, h, t) {
      var flap = t ? -3 : 2;
      pxPaint(ctx, pxShape(w, h).poly([[13, 11], [2, 11 + flap], [8, 17]]), { cols: [ramp('steel', 1)], outline: ramp('steel', 0) });
      pxPaint(ctx, pxShape(w, h).poly([[17, 11], [28, 11 + flap], [22, 17]]), { cols: [ramp('steel', 1)], outline: ramp('steel', 0) });
      bar(ctx, 11, 6, 2, 3, ramp('steel', 1)); bar(ctx, 17, 6, 2, 3, ramp('steel', 1));   // 귀
      pxPaint(ctx, pxShape(w, h).ellipse(15, 13, 6.5, 5.5),
        { cols: cel('steel'), outline: ramp('steel', 0), cx: 15, cy: 13, rx: 6.5, ry: 5.5 });
      bar(ctx, 12, 11, 2, 2, WHITE); bar(ctx, 17, 11, 2, 2, WHITE);
      dot(ctx, 13, 12, INK); dot(ctx, 18, 12, INK);
      dot(ctx, 13, 16, WHITE); dot(ctx, 17, 16, WHITE);                                   // 송곳니
    }
    bakePx('bat', 30, 24, [function (c, w, h) { drawBat(c, w, h, 0); }, function (c, w, h) { drawBat(c, w, h, 1); }]);

    // 포탑(사격) — 잉걸불 화로 포탑
    function drawTurret(ctx, w, h, t) {
      var pl = t ? 12 : 10;
      pxShadow(ctx, w, h, 15, 27, 10, 2);
      // 포신
      pxPaint(ctx, pxShape(w, h).rect(13, 17 - pl, 4, pl), { cols: [ramp('steel', 1)], outline: ramp('steel', 0) });
      bar(ctx, 13, 17 - pl, 4, 1, INK);
      // 베이스 + 돔
      pxPaint(ctx, pxShape(w, h).rect(5, 17, 20, 9).ellipse(15, 17, 9, 5),
        { cols: [ramp('torch', 1), ramp('torch', 1), ramp('torch', 2)], outline: ramp('torch', 0), cx: 15, cy: 19, rx: 10, ry: 7 });
      dot(ctx, 7, 18, ramp('steel', 2)); dot(ctx, 22, 18, ramp('steel', 2));              // 리벳
      dot(ctx, 7, 24, ramp('steel', 2)); dot(ctx, 22, 24, ramp('steel', 2));
      // 골드 눈(화구)
      bar(ctx, 12, 18, 6, 6, ramp('torch', 0));
      bar(ctx, 13, 19, 4, 4, ramp('gold', 2)); dot(ctx, 13, 19, ramp('gold', 3));
      bar(ctx, 15, 20, 2, 2, INK);
    }
    bakePx('turret', 30, 30, [function (c, w, h) { drawTurret(c, w, h, 0); }, function (c, w, h) { drawTurret(c, w, h, 1); }]);

    // 탄알(방사 픽셀 링 — 어둠 위에서 가장 밝게 읽힌다)
    bakePx('pbullet', 14, 14, [function (ctx, w, h) { pxOrb(ctx, w, h, 7, 7, 5, [WHITE, ramp('hero', 3), ramp('hero', 2), ramp('hero', 1)]); }]);
    bakePx('ebullet', 16, 16, [function (ctx, w, h) { pxOrb(ctx, w, h, 8, 8, 6, [WHITE, ramp('scarlet', 3), ramp('scarlet', 2), ramp('scarlet', 1)]); }]);
    bakePx('gbullet', 18, 18, [function (ctx, w, h) { pxOrb(ctx, w, h, 9, 9, 6.5, [WHITE, ramp('gold', 3), ramp('gold', 2), ramp('gold', 1)]); }]);

    // 코인(회전 4프레임)
    bakePx('coin', 22, 22, [9, 6, 2.2, 6].map(function (rx) {
      return function (ctx, w, h) {
        var s = pxShape(w, h).ellipse(11, 11, rx, 8.5);
        if (rx > 3) {
          pxPaint(ctx, s, { cols: [ramp('gold', 1), ramp('gold', 2), ramp('gold', 3)], outline: ramp('gold', 0), cx: 11, cy: 11, rx: rx, ry: 8.5 });
          pxRing(ctx, 11, 11, rx - 2.5, 6, ramp('gold', 1));
          bar(ctx, 8, 6, 2, 1, ramp('gold', 3)); dot(ctx, 7, 7, WHITE);
        } else {
          pxPaint(ctx, s, { cols: [ramp('gold', 2)], outline: ramp('gold', 0) });
          bar(ctx, 10, 4, 1, 14, ramp('gold', 3));
        }
      };
    }));

    // 하트(체력)
    bakePx('heart', 22, 20, [function (ctx, w, h) {
      var s = pxShape(w, h).ellipse(7.5, 8, 4.5, 4).ellipse(14.5, 8, 4.5, 4).poly([[3.5, 9], [18.5, 9], [11, 17]]);
      pxPaint(ctx, s, { cols: cel('scarlet'), outline: ramp('scarlet', 0), cx: 11, cy: 9.5, rx: 8, ry: 7.5 });
      bar(ctx, 6, 6, 2, 1, WHITE);
    }]);

    // 기력(민트 다이아 + 잉크 번개)
    bakePx('energy', 20, 20, [function (ctx, w, h) {
      pxPaint(ctx, pxShape(w, h).poly([[10, 2.5], [16.5, 10], [10, 17.5], [3.5, 10]]),
        { cols: cel('hero'), outline: ramp('hero', 0), cx: 10, cy: 10, rx: 6.5, ry: 7.5 });
      pxPaint(ctx, pxShape(w, h).poly([[11.5, 5], [8, 11], [10.5, 11], [9, 15.5], [13, 9], [10.5, 9]]), { cols: [INK] });
    }]);

    // 상자(횃불빛 나무 + 강철 띠 + 골드 자물쇠)
    bakePx('chest', 38, 32, [function (ctx, w, h) {
      pxShadow(ctx, w, h, 19, 29, 13, 2.4);
      pxPaint(ctx, pxShape(w, h).rect(6, 14, 26, 13), { cols: [ramp('torch', 1)], outline: ramp('torch', 0) });
      bar(ctx, 7, 18, 24, 1, ramp('torch', 0)); bar(ctx, 7, 22, 24, 1, ramp('torch', 0));   // 판자
      pxPaint(ctx, pxShape(w, h).rect(5, 7, 28, 8), { cols: [ramp('torch', 1)], outline: ramp('torch', 0) });
      bar(ctx, 6, 8, 26, 1, ramp('torch', 2));                                              // 뚜껑 림라이트
      bar(ctx, 9, 8, 2, 18, ramp('steel', 1)); bar(ctx, 27, 8, 2, 18, ramp('steel', 1));   // 강철 띠
      dot(ctx, 9, 8, ramp('steel', 2)); dot(ctx, 27, 8, ramp('steel', 2));
      pxPaint(ctx, pxShape(w, h).rect(16, 12, 6, 7), { cols: [ramp('gold', 2)], outline: ramp('gold', 0) });
      dot(ctx, 18, 15, INK); bar(ctx, 18, 16, 1, 2, INK);
    }]);

    // 스타(아이템 드랍 — 등급 틴트가 잘 먹도록 페일 골드)
    bakePx('star', 28, 28, [function (ctx, w, h) {
      var pts = [];
      for (var i = 0; i < 10; i++) {
        var rr = i % 2 === 0 ? 11 : 4.8, a = -Math.PI / 2 + i / 10 * Math.PI * 2;
        pts.push([14 + Math.cos(a) * rr, 14 + Math.sin(a) * rr]);
      }
      pxPaint(ctx, pxShape(w, h).poly(pts), { cols: [ramp('gold', 2), ramp('gold', 3), ramp('gold', 3)], outline: ramp('gold', 0), cx: 14, cy: 14, rx: 11, ry: 11 });
      bar(ctx, 12, 11, 2, 2, WHITE);
    }]);

    // 포탈(아케인 소용돌이)
    bakePx('portal', 70, 70, [function (ctx, w, h) {
      pxPaint(ctx, pxShape(w, h).ellipse(35, 35, 26, 30), { cols: [ramp('arcane', 1)], outline: ramp('arcane', 0) });
      pxPaint(ctx, pxShape(w, h).ellipse(35, 35, 20, 24), { cols: [ramp('arcane', 2)] });
      pxPaint(ctx, pxShape(w, h).ellipse(35, 35, 14, 17), { cols: [ramp('arcane', 1)] });
      pxPaint(ctx, pxShape(w, h).ellipse(35, 35, 9, 11), { cols: [ramp('arcane', 3)] });
      pxPaint(ctx, pxShape(w, h).ellipse(35, 35, 4, 5), { cols: [WHITE] });
      var sw = [[35, 8], [50, 16], [58, 35], [50, 54], [35, 61], [20, 54], [12, 35], [20, 16]];
      for (var i = 0; i < sw.length; i++) dot(ctx, sw[i][0], sw[i][1], i % 2 ? ramp('arcane', 3) : WHITE);
    }]);

    // 보스 3종(왕관 슬라임 / 큰 눈 / 강철 봇) — 층마다 틴트·패턴으로 변주
    bakePx('boss-king', 96, 86, [0, 1].map(function (t) { return function (ctx, w, h) {
      var sq = t ? 1 : 0;
      pxShadow(ctx, w, h, 48, 80, 32, 5);
      var body = pxShape(w, h).ellipse(48, 50 + sq, 35 + sq, 27 - sq).rect(14, 52, 68, 18);
      pxPaint(ctx, body, { cols: cel('venom'), outline: ramp('venom', 0), cx: 48, cy: 50, rx: 35, ry: 27, dither: true });
      // 왕관 + 보석
      pxPaint(ctx, pxShape(w, h).poly([[27, 24 + sq], [33, 10 + sq], [40, 21 + sq], [48, 6 + sq], [56, 21 + sq], [63, 10 + sq], [69, 24 + sq], [69, 30 + sq], [27, 30 + sq]]),
        { cols: [ramp('gold', 2)], outline: ramp('gold', 0) });
      bar(ctx, 37, 25 + sq, 2, 2, ramp('scarlet', 2)); bar(ctx, 57, 25 + sq, 2, 2, ramp('scarlet', 2));
      // 눈 + 입
      pxPaint(ctx, pxShape(w, h).ellipse(37, 46 + sq, 5.5, 6.5), { cols: [WHITE], outline: ramp('venom', 0) });
      pxPaint(ctx, pxShape(w, h).ellipse(59, 46 + sq, 5.5, 6.5), { cols: [WHITE], outline: ramp('venom', 0) });
      bar(ctx, 36, 45 + sq, 3, 4, INK); bar(ctx, 58, 45 + sq, 3, 4, INK);
      dot(ctx, 36, 45 + sq, WHITE); dot(ctx, 58, 45 + sq, WHITE);
      bar(ctx, 42, 60 + sq, 12, 2, ramp('venom', 0)); dot(ctx, 41, 59 + sq, ramp('venom', 0)); dot(ctx, 54, 59 + sq, ramp('venom', 0));
      bar(ctx, 28, 52 + sq, 3, 2, ramp('venom', 3)); bar(ctx, 65, 52 + sq, 3, 2, ramp('venom', 3));
    }; }));
    bakePx('boss-eye', 90, 90, [0, 1].map(function (t) { return function (ctx, w, h) {
      var r = t ? 38 : 36;
      pxPaint(ctx, pxShape(w, h).ellipse(45, 45, r, r), { cols: cel('arcane'), outline: ramp('arcane', 0), cx: 45, cy: 45, rx: r, ry: r, dither: true });
      pxPaint(ctx, pxShape(w, h).ellipse(45, 45, 17, 17), { cols: [WHITE], outline: ramp('arcane', 0) });
      pxPaint(ctx, pxShape(w, h).ellipse(45, 45, 9, 9), { cols: [INK] });
      bar(ctx, 39, 39, 3, 2, WHITE);
      pxRing(ctx, 45, 45, 26, 26, ramp('arcane', 3));
    }; }));
    bakePx('boss-bot', 92, 84, [0, 1].map(function (t) { return function (ctx, w, h) {
      var bob = t ? -2 : 0;
      pxShadow(ctx, w, h, 46, 79, 28, 4.5);
      pxPaint(ctx, pxShape(w, h).poly([[26, 14 + bob], [66, 14 + bob], [80, 28 + bob], [80, 58 + bob], [66, 70 + bob], [26, 70 + bob], [12, 58 + bob], [12, 28 + bob]]),
        { cols: cel('steel'), outline: ramp('steel', 0), cx: 46, cy: 42 + bob, rx: 34, ry: 28, dither: true });
      // 안테나 + 경고등
      bar(ctx, 45, 8 + bob, 2, 6, ramp('steel', 1)); bar(ctx, 44, 6 + bob, 4, 2, ramp('scarlet', 2));
      // 눈 패널(횃불빛 화로 눈)
      pxPaint(ctx, pxShape(w, h).rect(26, 34 + bob, 40, 18), { cols: [ramp('steel', 0)], outline: INK });
      bar(ctx, 32, 40 + bob, 6, 6, ROLE.ui_accent); bar(ctx, 54, 40 + bob, 6, 6, ROLE.ui_accent);
      dot(ctx, 32, 40 + bob, WHITE); dot(ctx, 54, 40 + bob, WHITE);
      // 가슴 코어 + 리벳
      pxPaint(ctx, pxShape(w, h).rect(38, 60 + bob, 16, 5), { cols: [ramp('gold', 2)], outline: ramp('gold', 0) });
      dot(ctx, 16, 30 + bob, ramp('steel', 3)); dot(ctx, 75, 30 + bob, ramp('steel', 3));
      dot(ctx, 16, 56 + bob, ramp('steel', 3)); dot(ctx, 75, 56 + bob, ramp('steel', 3));
    }; }));

    // 벽 횃불(시그니처 드로운 라이트 — 동적 라이팅 아님, 그려진 빛)
    function drawTorch(ctx, w, h, t) {
      pxPaint(ctx, pxShape(w, h).ellipse(9, 11, 8, 9), { cols: [rgba(ramp('torch', 3), 0.10)] });   // 헤일로
      bar(ctx, 8, 20, 2, 8, ramp('steel', 1)); bar(ctx, 8, 27, 2, 1, ramp('steel', 0));            // 브래킷
      pxPaint(ctx, pxShape(w, h).rect(5, 18, 8, 3), { cols: [ramp('steel', 2)], outline: ramp('steel', 0) });
      var fl = t ? pxShape(w, h).ellipse(9, 10, 3.5, 6).ellipse(10, 5.5, 1.8, 2.6)
                 : pxShape(w, h).ellipse(9, 11, 4, 5.5).ellipse(8, 6, 1.8, 2.2);
      pxPaint(ctx, fl, { cols: [ramp('torch', 1), ramp('torch', 2), ramp('torch', 3)], outline: ramp('torch', 1), cx: 9, cy: 10, rx: 4, ry: 6 });
      bar(ctx, 8, (t ? 10 : 11), 2, 3, ramp('torch', 4));                                          // 백열 코어
      dot(ctx, 9, (t ? 8 : 9), ramp('torch', 4));
      dot(ctx, t ? 13 : 5, 2, ramp('torch', 3));                                                   // 불티
    }
    bakePx('wtorch', 18, 30, [function (c, w, h) { drawTorch(c, w, h, 0); }, function (c, w, h) { drawTorch(c, w, h, 1); }]);

    // 파티클 스파크(사각 도트 — 픽셀 매체 정합)
    var g = scene.add.graphics();
    g.fillStyle(WHITE_INT, 1); g.fillRect(1, 1, 6, 6);
    g.generateTexture('spark', 8, 8); g.destroy();
    var g2 = scene.add.graphics();
    g2.fillStyle(WHITE_INT, 1); g2.fillRect(0, 0, 6, 6);
    g2.generateTexture('square', 6, 6); g2.destroy();

    // 애니메이션
    function mkAnim(key, tex, frames, rate) { if (!scene.anims.exists(key)) scene.anims.create({ key: key, frames: frames.map(function (f) { return { key: tex, frame: f }; }), frameRate: rate, repeat: -1 }); }
    mkAnim('hero-idle', 'hero', [0, 1], 3);
    mkAnim('slime-idle', 'slime', [0, 1], 4);
    mkAnim('orb-idle', 'orb', [0, 1], 4);
    mkAnim('bat-fly', 'bat', [0, 1], 8);
    mkAnim('turret-idle', 'turret', [0, 1], 3);
    mkAnim('boss-king-idle', 'boss-king', [0, 1], 2.5);
    mkAnim('boss-eye-idle', 'boss-eye', [0, 1], 2.5);
    mkAnim('boss-bot-idle', 'boss-bot', [0, 1], 3);
    mkAnim('coin-spin', 'coin', [0, 1, 2, 3], 10);
    mkAnim('torch-burn', 'wtorch', [0, 1], 5);
  }

  // ===========================================================================
  // 적 / 보스 정의 테이블
  // ===========================================================================
  var ENEMY_TYPES = {
    slime:  { tex: 'slime', anim: 'slime-idle', hp: 3, speed: 56, behavior: 'chase', radius: 11, touch: 1, score: 1 },
    bat:    { tex: 'bat', anim: 'bat-fly', hp: 2, speed: 96, behavior: 'dart', radius: 9, touch: 1, score: 1 },
    turret: { tex: 'turret', anim: 'turret-idle', hp: 5, speed: 0, behavior: 'shooter', radius: 12, touch: 1, score: 2, fireEvery: 1500, pattern: 'aimed' },
    orb:    { tex: 'orb', anim: 'orb-idle', hp: 4, speed: 34, behavior: 'spreader', radius: 11, touch: 1, score: 2, fireEvery: 2200, pattern: 'ring' }
  };

  // 10개 보스(3비주얼 변주 + 패턴 조합 + 스케일). 색 틴트(STYLE.variants.boss_tints)로 변별.
  var BOSS_TABLE = [
    { name: '슬라임 대왕', tex: 'boss-king', anim: 'boss-king-idle', tint: WHITE_INT, hp: 60, patterns: ['ring', 'aimed3'] },
    { name: '감시안',     tex: 'boss-eye', anim: 'boss-eye-idle', tint: WHITE_INT, hp: 80, patterns: ['spiral', 'aimed3'] },
    { name: '강철 봇',    tex: 'boss-bot', anim: 'boss-bot-idle', tint: WHITE_INT, hp: 100, patterns: ['fan', 'walls'] },
    { name: '독슬라임 군주', tex: 'boss-king', anim: 'boss-king-idle', tint: BOSS_TINTS[0], hp: 130, patterns: ['ring', 'spiral'] },
    { name: '심연안',     tex: 'boss-eye', anim: 'boss-eye-idle', tint: BOSS_TINTS[1], hp: 160, patterns: ['spiral', 'fan'] },
    { name: '파괴 봇 MkII', tex: 'boss-bot', anim: 'boss-bot-idle', tint: BOSS_TINTS[2], hp: 200, patterns: ['fan', 'aimed3', 'walls'] },
    { name: '핏빛 대왕',  tex: 'boss-king', anim: 'boss-king-idle', tint: BOSS_TINTS[3], hp: 250, patterns: ['ring', 'spiral', 'aimed3'] },
    { name: '허공안',     tex: 'boss-eye', anim: 'boss-eye-idle', tint: BOSS_TINTS[4], hp: 320, patterns: ['spiral', 'fan', 'ring'] },
    { name: '심판 봇',    tex: 'boss-bot', anim: 'boss-bot-idle', tint: BOSS_TINTS[5], hp: 400, patterns: ['fan', 'walls', 'spiral'] },
    { name: '악몽의 핵',  tex: 'boss-eye', anim: 'boss-eye-idle', tint: BOSS_TINTS[6], hp: 560, patterns: ['ring', 'spiral', 'fan', 'aimed3'] }
  ];

  // ===========================================================================
  // 서사 텍스트 표면 (STORY.md §7 단일 진실과 1:1 미러 — 수정은 STORY.md 먼저)
  //   따뜻한 경이 · Kishōtenketsu — 起 타이틀+1층 / 承 x1층 막간 / 転 91층+승리 1행 / 結 승리 2행+타이틀 별
  // ===========================================================================
  var STORY_TEXT = {
    tagline: '혹성이 떨어진 밤, 별이는 말없이 사라졌다.',
    titleBarks: [
      '"구멍은 위험혀. 메워버려야 혀, 저런 건." — 이장님',
      '"그 집 애, 혹성 떨어진 뒤로 안 보인다더라." — 잡화점 아주머니',
      '"별은 길을 잃지 않아. 잠시 쉬어갈 뿐이지." — 별지기 할아버지',
      '"뒷산에서 빛이 났대! 진짜래!" — 떠버리 쌍둥이'
    ],
    traces: {
      1: '둘이 만든 팝총을 꼭 쥐고, 호두는 구멍 아래로 첫걸음을 디뎠다.',
      11: '바닥에 별이의 반창고가 떨어져 있다 — 한 장이 아니라 한 통째로.',
      21: '발자국이 흐트러짐 없이 곧다 — 도망친 아이의 걸음이 아니다.',
      31: '모퉁이마다 별이의 손수건이 길 표시처럼 묶여 있다.',
      41: '별이가 그린 별 지도 조각 — 잉크가 마른 지 오래다.',
      51: '수첩 한 장: "얘가 아파. 소리가 점점 작아져."',
      61: '악몽 조각들은 쫓아오는 게 아니라, 아파서 우는 것 같다.',
      71: '횃불이 이미 켜져 있다 — 길을 밝혀 둔 누군가의 손길.',
      81: '발자국이 뛰기 시작한다 — 도망이 아니라 서두름이다.',
      91: '수첩 마지막 장: "호두야, 올 줄 알았어. 깊은 데서 기다릴게."'
    },
    clearBarks: ['조각이 별빛으로 돌아갔다', '방이 조용해졌다', '팡! 깨끗해졌다', '별빛 한 줌이 떠올랐다', '조금만 더 깊이'],
    win1: '가장 깊은 곳, 별이는 별의 심장을 감싸고 있었다 — "왔구나. 도와줘, 얘가 아파."',
    win2: '되살아난 별은 두 아이를 안고 밤하늘로 돌아갔다.',
    lose: '어둠이 닿기 전, 따뜻한 별빛이 호두를 감싸 구멍 입구로 되돌려놓았다.'
  };

  // ===========================================================================
  // BootScene — 아트 베이크, 씬 등록, DOM 가드
  // ===========================================================================
  var BootScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function BootScene() { Phaser.Scene.call(this, { key: 'Boot' }); },
    create: function () {
      bakeArt(this);
      MobileHarness.installDomGuards();
      MobileHarness.onResume(function () { if (GAME_AUDIO.resume) GAME_AUDIO.resume(); });
      this.scene.start('Title');
    }
  });

  // ===========================================================================
  // TitleScene — 타이틀 + 직업 카드 + Tap to start(오디오 언락)
  // ===========================================================================
  var TitleScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function TitleScene() { Phaser.Scene.call(this, { key: 'Title' }); },
    create: function () {
      var W = DESIGN_W, H = DESIGN_H, cx = W / 2;
      this.cameras.main.setBackgroundColor(STYLE.master_palette.background);
      // 배경 잉걸 불티(사각 도트)
      var g = this.add.graphics();
      for (var i = 0; i < 36; i++) {
        var ec = i % 3 === 0 ? rampInt('torch', 2) : (i % 3 === 1 ? rampInt('gold', 2) : rampInt('steel', 2));
        g.fillStyle(ec, 0.08 + (i % 4) * 0.03);
        g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
      }
      // 밤하늘 — 클리어 횟수만큼 별이 하나씩 늘어난다 (STORY.md §7 E2: 結의 메타 회수)
      var starN = Math.min(META.wins, 20);
      for (var s = 0; s < starN; s++) {
        var sx = ((s * 173 + 41) % (W - 60)) + 30;
        var sy = ((s * 97 + 23) % Math.floor(H * 0.14)) + 26;
        g.fillStyle(rampInt('gold', 3), 0.95); g.fillRect(sx - 1, sy, 3, 1); g.fillRect(sx, sy - 1, 1, 3);
        g.fillStyle(WHITE_INT, 1); g.fillRect(sx, sy, 1, 1);
      }
      // 벽 횃불 + 마스코트(시그니처 구도: 어둠 속 횃불빛 받은 민트 히어로)
      var t1 = this.add.sprite(cx - 120, H * 0.33, 'wtorch', 0).setScale(2); t1.play('torch-burn');
      var t2 = this.add.sprite(cx + 120, H * 0.33, 'wtorch', 1).setScale(2); t2.play({ key: 'torch-burn', startFrame: 1 });
      var hero = this.add.sprite(cx, H * 0.34, 'hero', 0).setScale(3); hero.play('hero-idle');
      this.tweens.add({ targets: hero, y: H * 0.34 - 12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      // 타이틀
      this.add.text(cx, H * 0.5, '팡팡 던전', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '60px', color: ROLE.pickup }).setOrigin(0.5).setShadow(0, 4, ramp('gold', 0), 0, true, true);
      this.add.text(cx, H * 0.5 + 48, 'POP  DUNGEON', { fontFamily: 'monospace', fontSize: '20px', color: ROLE.ui_accent }).setOrigin(0.5);
      // 서사 인트로 1/2 + 마을 주민 bark (STORY.md §7 T1·B1)
      this.add.text(cx, H * 0.5 + 78, STORY_TEXT.tagline, { fontFamily: 'sans-serif', fontSize: '15px', color: ramp('steel', 3) }).setOrigin(0.5);
      this.add.text(cx, H * 0.78, STORY_TEXT.titleBarks[Math.floor(Math.random() * STORY_TEXT.titleBarks.length)], { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 2) }).setOrigin(0.5);
      // 직업 카드
      var cardY = H * 0.62;
      var card = this.add.graphics(); card.fillStyle(rampInt('steel', 0), 0.85); card.fillRect(cx - 150, cardY, 300, 70); card.lineStyle(2, RARITY_COLOR.rare, 0.7); card.strokeRect(cx - 150, cardY, 300, 70);
      this.add.text(cx - 120, cardY + 18, '직업', { fontFamily: 'sans-serif', fontSize: '13px', color: ramp('steel', 3) }).setOrigin(0, 0.5);
      this.add.text(cx, cardY + 22, '팝거너', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '24px', color: WHITE }).setOrigin(0.5, 0.5);
      this.add.text(cx, cardY + 50, '자동조준 팝건 · 닷지롤 · 4 스킬', { fontFamily: 'sans-serif', fontSize: '13px', color: ramp('steel', 3) }).setOrigin(0.5);
      this.add.text(cx + 120, cardY - 6, '더 많은 직업 예정', { fontFamily: 'sans-serif', fontSize: '11px', color: ramp('steel', 2) }).setOrigin(1, 0.5);
      // 최고 기록
      if (META.bestFloor > 0) this.add.text(cx, H * 0.74, '최고 도달: 지하 ' + META.bestFloor + '층' + (META.wins ? '  ·  클리어 ' + META.wins + '회' : ''), { fontFamily: 'sans-serif', fontSize: '16px', color: ROLE.pickup }).setOrigin(0.5);
      // Tap to start
      var tip = this.add.text(cx, H * 0.84, '탭하여 시작', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '26px', color: WHITE }).setOrigin(0.5);
      this.tweens.add({ targets: tip, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
      this.add.text(cx, H * 0.88, '왼쪽=이동(드래그) · 자동 발사 · 우측 버튼=구르기/스킬', { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 3) }).setOrigin(0.5);

      var self = this, started = false;
      function start() {
        if (started) return; started = true;
        if (GAME_AUDIO.unlock) { GAME_AUDIO.unlock(); GAME_AUDIO.startBgm(); }
        RUN = freshRun();
        META.runs++; saveMeta();
        self.scene.start('Game');
        self.scene.launch('HUD');
      }
      this.input.once('pointerdown', start);
      this.input.keyboard.once('keydown-SPACE', start);
      this.input.keyboard.once('keydown-ENTER', start);
      if (/[?&]autostart=1/.test(location.search)) this.time.delayedCall(80, start);
    }
  });

  // ===========================================================================
  // GameScene — 던전 본체
  // ===========================================================================
  var GameScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function GameScene() { Phaser.Scene.call(this, { key: 'Game' }); },

    create: function () {
      var self = this;
      this.cameras.main.setBackgroundColor(FLOOR_BG[0]);

      // 아레나 배경 + 벽
      this.drawArena();

      // 능력 킷
      this.kit = AbilityKit.attach(this, window.POP_ABILITIES, {
        onActivate: function (ab, ctx) { self.onAbility(ab, ctx); },
        unlockedAtStart: ['dodge_roll', 'pop_nova', 'turbo_pop', 'golden_storm']
      });
      window.GAME_ABILITIES = this.kit;

      // 풀
      this.pbullets = this.physics.add.group({ defaultKey: 'pbullet', maxSize: 80 });
      this.ebullets = this.physics.add.group({ defaultKey: 'ebullet', maxSize: 260 });
      this.gbullets = this.physics.add.group({ defaultKey: 'gbullet', maxSize: 24 });
      this.enemies = this.physics.add.group({ maxSize: 80 });
      this.pickups = this.physics.add.group({ maxSize: 60 });

      // 플레이어
      this.player = this.physics.add.sprite(DESIGN_W / 2, ARENA_B - 90, 'hero', 0).setDepth(20);
      this.player.play('hero-idle');
      this.player.body.setCircle(11, 7, 11);
      this.player.invuln = 0; this.player.aim = -Math.PI / 2;
      this.player.fireCd = 0; this.player.turboT = 0; this.player.ultT = 0; this.player.ultAngle = 0;
      this.player.dashT = 0; this.player.dashVX = 0; this.player.dashVY = 0;

      // 파티클 이미터(재사용)
      this.fxHit = this.add.particles(0, 0, 'spark', { lifespan: 320, speed: { min: 40, max: 150 }, scale: { start: 0.7, end: 0 }, alpha: { start: 0.9, end: 0 }, blendMode: 'ADD', emitting: false }).setDepth(30);
      this.fxKill = this.add.particles(0, 0, 'spark', { lifespan: 480, speed: { min: 60, max: 240 }, scale: { start: 1.1, end: 0 }, alpha: { start: 1, end: 0 }, blendMode: 'ADD', emitting: false }).setDepth(30);
      this.fxPuff = this.add.particles(0, 0, 'spark', { lifespan: 260, speed: { min: 20, max: 70 }, scale: { start: 0.6, end: 0 }, alpha: { start: 0.5, end: 0 }, tint: rampInt('hero', 3), emitting: false }).setDepth(19);

      // 충돌
      this.physics.add.overlap(this.pbullets, this.enemies, this.hitEnemy, null, this);
      this.physics.add.overlap(this.gbullets, this.enemies, this.hitEnemyOrbital, null, this);
      this.physics.add.overlap(this.ebullets, this.player, this.hitPlayer, null, this);
      this.physics.add.overlap(this.enemies, this.player, this.touchPlayer, null, this);
      this.physics.add.overlap(this.pickups, this.player, this.grabPickup, null, this);

      // 키보드(데스크톱/테스트)
      this.keys = this.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D', up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT', dodge: 'SPACE', s1: 'J', s2: 'K', s3: 'L' });
      this.prevK = {};

      // 배너 텍스트
      this.banner = this.add.text(DESIGN_W / 2, ARENA.y + 200, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '34px', color: WHITE }).setOrigin(0.5).setDepth(60).setAlpha(0).setShadow(0, 3, INK, 4);
      this.toast = this.add.text(DESIGN_W / 2, ARENA_B - 40, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '18px', color: ROLE.pickup }).setOrigin(0.5).setDepth(60).setAlpha(0);
      // 막간 흔적 텍스트 (STORY.md §7 T2·T3 — 배너 아래 한 줄)
      this.trace = this.add.text(DESIGN_W / 2, ARENA.y + 252, '', { fontFamily: 'sans-serif', fontSize: '15px', color: ramp('steel', 3), align: 'center', wordWrap: { width: ARENA.w - 56 } }).setOrigin(0.5).setDepth(60).setAlpha(0).setShadow(0, 2, INK, 3);

      this.state = 'play'; // play | clearing | transition | dead | win
      this.floorEnemiesLeft = 0; this.waveQueue = [];
      this.portal = null;

      recomputeStats();
      this.startFloor(RUN.floor);

      // 헤드리스/외부 핸들
      window.PopDungeon = window.PopDungeon || {};
      window.PopDungeon.scene = this; window.PopDungeon.run = function () { return RUN; };
    },

    // ── 아레나 그리기(픽셀 브릭 타일 + 횃불 광 풀) ─────────────────────────────
    drawArena: function () {
      var g = this.add.graphics().setDepth(1);
      // 돌바닥
      g.fillStyle(rampInt('stone', 0), 1); g.fillRect(ARENA.x, ARENA.y, ARENA.w, ARENA.h);
      // 브릭 패턴: 가로줄 24px + 줄마다 오프셋된 세로 이음매(1px)
      g.fillStyle(rampInt('stone', 1), 1);
      var row = 0, y, x;
      for (y = ARENA.y + 24; y < ARENA_B - 4; y += 24, row++) {
        g.fillRect(ARENA.x + 4, y, ARENA.w - 8, 1);
        var off = (row % 2) * 24;
        for (x = ARENA.x + 24 + off; x < ARENA_R - 6; x += 48) g.fillRect(x, y - 24 < ARENA.y ? ARENA.y + 4 : y - 24, 1, 24);
      }
      // 바닥 잔돌·이끼 점(결정적 배치)
      for (var i = 0; i < 14; i++) {
        var dx = ARENA.x + 20 + ((i * 97) % (ARENA.w - 40));
        var dy = ARENA.y + 24 + ((i * 211) % (ARENA.h - 48));
        g.fillStyle(i % 4 === 0 ? rampInt('venom', 1) : rampInt('stone', 2), i % 4 === 0 ? 0.5 : 0.7);
        g.fillRect(dx, dy, 2, i % 3 === 0 ? 1 : 2);
      }
      // 벽 프레임(사각 도트 결): 3px 외벽 + 1px 상단 림라이트
      g.fillStyle(rampInt('stone', 2), 1);
      g.fillRect(ARENA.x, ARENA.y, ARENA.w, 3); g.fillRect(ARENA.x, ARENA_B - 3, ARENA.w, 3);
      g.fillRect(ARENA.x, ARENA.y, 3, ARENA.h); g.fillRect(ARENA_R - 3, ARENA.y, 3, ARENA.h);
      g.fillStyle(rampInt('stone', 3), 1);
      g.fillRect(ARENA.x, ARENA.y, ARENA.w, 1);
      // 모서리 초석
      g.fillStyle(rampInt('stone', 3), 1);
      g.fillRect(ARENA.x, ARENA.y, 6, 6); g.fillRect(ARENA_R - 6, ARENA.y, 6, 6);
      g.fillRect(ARENA.x, ARENA_B - 6, 6, 6); g.fillRect(ARENA_R - 6, ARENA_B - 6, 6, 6);
      // 벽 횃불 + 바닥의 따뜻한 광 풀(그려진 빛 — T2, 동적 라이팅 아님)
      var spots = [
        [ARENA.x + 52, ARENA.y + 20], [ARENA_R - 52, ARENA.y + 20],
        [ARENA.x + 16, ARENA.y + ARENA.h * 0.46], [ARENA_R - 16, ARENA.y + ARENA.h * 0.46]
      ];
      for (var s = 0; s < spots.length; s++) {
        g.fillStyle(rampInt('torch', 2), 0.06);
        g.fillEllipse(spots[s][0], spots[s][1] + 26, 96, 56);
        var tc = this.add.sprite(spots[s][0], spots[s][1], 'wtorch', s % 2).setDepth(2);
        tc.play({ key: 'torch-burn', startFrame: s % 2 });
      }
    },

    // ── 층 시작 ────────────────────────────────────────────────────────────────
    startFloor: function (n) {
      var self = this;
      RUN.floor = n;
      this.clearProjectiles();
      if (this.portal) { this.tweens.killTweensOf(this.portal); this.portal.destroy(); this.portal = null; }
      this.state = 'spawning';
      this.floorEnemiesLeft = 0; this.waveQueue = [];
      var isBoss = (n % 10 === 0);

      // 배경 색조: 10층 구간마다 변화 (STYLE.variants.floor_backgrounds)
      var tier = Math.floor((n - 1) / 10);
      this.cameras.main.setBackgroundColor(FLOOR_BG[tier % FLOOR_BG.length]);

      if (isBoss) {
        if (GAME_AUDIO.setSection) GAME_AUDIO.setSection('boss');
        if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(1);
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('bossWarn');
        this.bannerShow('지하 ' + n + '층 — 보스!', rampInt('scarlet', 3));
        this.time.delayedCall(700, function () { self.spawnBoss(n); self.state = 'play'; });
      } else {
        if (GAME_AUDIO.setSection) GAME_AUDIO.setSection('combat');
        if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.45);
        this.bannerShow('지하 ' + n + '층', roleInt('ui_accent'));
        this.buildWaves(n);
        this.time.delayedCall(450, function () { self.spawnNextWave(); self.state = 'play'; });
      }
      // 별이의 흔적 막간 (STORY.md §5 承·転 — x1층 진입마다 1문장)
      if (STORY_TEXT.traces[n]) this.traceShow(STORY_TEXT.traces[n]);
    },

    buildWaves: function (n) {
      // 층 깊이에 따라 적 수·종류·웨이브 수 증가
      var pool = ['slime'];
      if (n >= 3) pool.push('bat');
      if (n >= 5) pool.push('turret');
      if (n >= 8) pool.push('orb');
      var waves = n < 6 ? 1 : 2;
      var perWave = Math.min(10, 3 + Math.floor(n / 4));
      this.waveQueue = [];
      for (var w = 0; w < waves; w++) {
        var list = [];
        for (var i = 0; i < perWave; i++) list.push(pool[Math.floor(Math.random() * pool.length)]);
        this.waveQueue.push(list);
      }
      this.floorEnemiesLeft = 0;
    },

    spawnNextWave: function () {
      if (!this.waveQueue.length) return;
      var list = this.waveQueue.shift();
      var n = RUN.floor;
      for (var i = 0; i < list.length; i++) {
        var ang = Math.random() * Math.PI * 2;
        var ex = DESIGN_W / 2 + Math.cos(ang) * (140 + Math.random() * 70);
        var ey = ARENA.y + 60 + Math.random() * (ARENA.h * 0.45);
        ex = Phaser.Math.Clamp(ex, ARENA.x + 30, ARENA_R - 30);
        ey = Phaser.Math.Clamp(ey, ARENA.y + 30, ARENA_B - 120);
        this.spawnEnemy(list[i], ex, ey, n);
      }
    },

    spawnEnemy: function (type, x, y, floor) {
      var def = ENEMY_TYPES[type];
      var e = this.enemies.get(x, y, def.tex);
      if (!e) return null;
      e.setActive(true).setVisible(true).setDepth(15).setScale(1).clearTint();
      if (e.body) { e.body.enable = true; e.body.reset(x, y); e.body.setCircle(def.radius, (def.tex === 'bat' ? 6 : 4), (def.tex === 'bat' ? 6 : 4)); }
      if (def.anim) e.play(def.anim);
      e.etype = type; e.def = def; e.isBoss = false;
      e.maxHp = Math.round(def.hp * (1 + (floor - 1) * 0.18));
      e.hp = e.maxHp;
      e.speed = def.speed * (1 + (floor - 1) * 0.015);
      e.fireT = (def.fireEvery || 0) * (0.4 + Math.random() * 0.6);
      e.dartT = 300 + Math.random() * 600;
      e.spawnGrace = 350; // 스폰 직후 잠깐 무적 + 페이드인
      e.setAlpha(0.2); this.tweens.add({ targets: e, alpha: 1, duration: 320 });
      this.floorEnemiesLeft++;
      return e;
    },

    spawnBoss: function (floor) {
      var idx = Math.floor(floor / 10) - 1;
      var bdef = BOSS_TABLE[Phaser.Math.Clamp(idx, 0, BOSS_TABLE.length - 1)];
      var x = DESIGN_W / 2, y = ARENA.y + 130;
      var e = this.enemies.get(x, y, bdef.tex);
      if (!e) return;
      e.setActive(true).setVisible(true).setDepth(16).setScale(1).setTint(bdef.tint);
      if (e.body) { e.body.enable = true; e.body.reset(x, y); e.body.setCircle(36, 9, 9); }
      e.play(bdef.anim);
      e.etype = 'boss'; e.isBoss = true; e.bdef = bdef;
      e.maxHp = Math.round(bdef.hp * (1 + idx * 0.05));
      e.hp = e.maxHp;
      e.speed = 30 + idx * 3;
      e.patternT = 1200; e.patternI = 0; e.phase = 0; e.moveDir = 1; e.spawnGrace = 600;
      e.setAlpha(0.2); this.tweens.add({ targets: e, alpha: 1, duration: 500 });
      this.floorEnemiesLeft = 1;
      RUN.boss = e; RUN.bossName = bdef.name; RUN.bossHpFrac = 1;
      this.cameras.main.shake(400, 0.006);
    },

    // ── 업데이트 ───────────────────────────────────────────────────────────────
    update: function (time, dt) {
      if (!RUN) return;
      var d = dt / 1000;
      if (this.state === 'dead' || this.state === 'win') return;

      this.handlePlayer(d, time);
      this.updateEnemies(d, time);
      this.updateBullets(d);
      this.updatePickups(d);

      // 적 처치로 층 클리어 / 다음 웨이브 체크
      if (this.state === 'play' && this.floorEnemiesLeft <= 0) {
        if (this.waveQueue.length) {
          this.state = 'spawning';
          var self = this;
          this.toastShow('다음 웨이브!', roleInt('pickup'));
          this.time.delayedCall(650, function () { self.spawnNextWave(); self.state = 'play'; });
        } else {
          this.onFloorCleared();
        }
      }
    },

    // ── 플레이어 ───────────────────────────────────────────────────────────────
    handlePlayer: function (d, time) {
      var p = this.player; if (!p.active) return;
      // 입력 합산(터치 + 키보드)
      var mx = GAME_INPUT.moveX, my = GAME_INPUT.moveY;
      if (this.keys.left.isDown || this.keys.left2.isDown) mx = -1; if (this.keys.right.isDown || this.keys.right2.isDown) mx = 1;
      if (this.keys.up.isDown || this.keys.up2.isDown) my = -1; if (this.keys.down.isDown || this.keys.down2.isDown) my = 1;
      var mag = Math.sqrt(mx * mx + my * my); if (mag > 1) { mx /= mag; my /= mag; }

      // 타이머
      if (p.invuln > 0) p.invuln -= d;
      if (p.turboT > 0) p.turboT -= d;

      // 닷지롤 대시
      if (p.dashT > 0) {
        p.dashT -= d;
        p.setVelocity(p.dashVX, p.dashVY);
      } else {
        var spd = RUN.stats.moveSpeed;
        p.setVelocity(mx * spd, my * spd);
        if (mag > 0.1) p.aim2 = Math.atan2(my, mx); // 이동 방향 기록(타깃 없을 때 발사 방향)
      }
      // 아레나 클램프
      p.x = Phaser.Math.Clamp(p.x, ARENA.x + 14, ARENA_R - 14);
      p.y = Phaser.Math.Clamp(p.y, ARENA.y + 16, ARENA_B - 14);
      p.setFlipX(p.aim ? Math.cos(p.aim) < 0 : false);

      // 닷지롤 입력(엣지)
      var dodgeEdge = (GAME_INPUT.dodge || this.keys.dodge.isDown) && !this.prevK.dodge;
      this.prevK.dodge = (GAME_INPUT.dodge || this.keys.dodge.isDown);
      if (dodgeEdge && p.dashT <= 0) this.tryDodge(mx, my);

      // 스킬 입력(엣지)
      this.edgeUse('skill1', GAME_INPUT.skill1 || this.keys.s1.isDown, 'pop_nova');
      this.edgeUse('skill2', GAME_INPUT.skill2 || this.keys.s2.isDown, 'turbo_pop');
      this.edgeUse('ult', GAME_INPUT.ult || this.keys.s3.isDown, 'golden_storm');

      // 자동조준 + 자동발사
      var target = this.nearestEnemy(p.x, p.y);
      if (target) p.aim = Phaser.Math.Angle.Between(p.x, p.y, target.x, target.y);
      else if (p.aim2 != null) p.aim = p.aim2;
      p.fireCd -= d;
      if (target && p.fireCd <= 0 && this.state !== 'transition') {
        var delay = RUN.stats.fireDelay / (p.turboT > 0 ? RUN.stats.turboMult : 1);
        p.fireCd = delay;
        this.firePlayer(p.aim);
      }

      // 궁극기 오비탈
      if (p.ultT > 0) {
        p.ultT -= d; p.ultAngle += d * 4.5;
        this.updateOrbitals();
      }

      // 무적 깜빡임
      p.setAlpha(p.invuln > 0 && Math.floor(time / 60) % 2 === 0 ? 0.4 : 1);
    },

    edgeUse: function (slot, held, abilityId) {
      if (!this.prevK[slot] && held) {
        var r = this.kit.use(abilityId, {});
        if (!r.ok && r.reason === 'cooldown') { /* 무시 */ }
        else if (!r.ok && r.reason === 'resource') { this.toastShow('기력 부족'); }
      }
      this.prevK[slot] = held;
    },

    tryDodge: function (mx, my) {
      var r = this.kit.use('dodge_roll', {});
      if (!r.ok) return;
      var p = this.player;
      var ang = (Math.abs(mx) + Math.abs(my) > 0.1) ? Math.atan2(my, mx) : p.aim;
      var dd = this.kit.get('dodge_roll').effect;
      p.dashT = 0.26; p.dashVX = Math.cos(ang) * dd.dashSpeed; p.dashVY = Math.sin(ang) * dd.dashSpeed;
      p.invuln = Math.max(p.invuln, dd.iframes);
      p.dashDamage = RUN.stats.dashDamage;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('dodge');
      // 잔상
      for (var i = 0; i < 3; i++) {
        var gh = this.add.sprite(p.x, p.y, 'hero', 0).setAlpha(0.4 - i * 0.1).setScale(1).setTint(rampInt('hero', 3)).setDepth(18);
        this.tweens.add({ targets: gh, alpha: 0, duration: 220 + i * 60, onComplete: function () { this.destroy(); }, callbackScope: gh });
      }
      this.fxPuff.explode(8, p.x, p.y);
    },

    // ── 능력 효과 dispatch (AbilityKit onActivate) ──────────────────────────────
    onAbility: function (ab, ctx) {
      var p = this.player;
      if (ab.id === 'pop_nova') {
        var e = ab.effect, dmg = e.damage + RUN.stats.skillDamage;
        this.novaBlast(p.x, p.y, e.radius, dmg, e.knockback);
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('nova');
        this.cameras.main.shake(220, 0.008);
      } else if (ab.id === 'turbo_pop') {
        p.turboT = ab.effect.duration;
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('skill');
        this.toastShow('터보 팝!');
      } else if (ab.id === 'golden_storm') {
        p.ultT = ab.effect.duration; p.ultAngle = 0; p.ultDamage = ab.effect.damage + RUN.stats.skillDamage; p.ultCount = ab.effect.orbitalCount;
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('skill');
        this.toastShow('황금 팝 폭풍!');
        this.cameras.main.flash(160, 255, 230, 120);
      } else if (ab.id === 'dodge_roll') {
        /* 효과는 tryDodge 에서 직접 처리 */
      }
    },

    novaBlast: function (x, y, radius, dmg, knock) {
      // 시각 링
      var ring = this.add.circle(x, y, 10, roleInt('pickup'), 0.5).setDepth(25);
      this.tweens.add({ targets: ring, radius: radius, alpha: 0, duration: 320, ease: 'Cubic.out', onUpdate: function () { ring.setRadius(ring.radius); } });
      this.tweens.add({ targets: ring, scale: 1, duration: 320, onComplete: function () { ring.destroy(); } });
      this.fxKill.explode(20, x, y);
      // 피해 + 넉백
      var self = this;
      this.enemies.getChildren().forEach(function (e) {
        if (!e.active) return;
        var dist = Phaser.Math.Distance.Between(x, y, e.x, e.y);
        if (dist <= radius + (e.isBoss ? 36 : 12)) {
          var ang = Phaser.Math.Angle.Between(x, y, e.x, e.y);
          if (!e.isBoss && e.body) { e.x += Math.cos(ang) * Math.min(knock * 0.2, 40); e.y += Math.sin(ang) * Math.min(knock * 0.2, 40); }
          self.damageEnemy(e, dmg);
        }
      });
      // 근처 적탄 제거
      this.ebullets.getChildren().forEach(function (b) { if (b.active && Phaser.Math.Distance.Between(x, y, b.x, b.y) < radius) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; } });
    },

    updateOrbitals: function () {
      var p = this.player, n = p.ultCount || 8;
      // 오비탈은 gbullets 풀을 매 프레임 재배치하지 않고, 충돌만 처리 — 시각은 별도 스프라이트
      if (!p.orbitals) {
        p.orbitals = [];
        for (var i = 0; i < n; i++) p.orbitals.push(this.add.sprite(p.x, p.y, 'gbullet').setDepth(22));
      }
      for (var j = 0; j < p.orbitals.length; j++) {
        var a = p.ultAngle + (j / p.orbitals.length) * Math.PI * 2;
        var ox = p.x + Math.cos(a) * 64, oy = p.y + Math.sin(a) * 64;
        p.orbitals[j].setPosition(ox, oy).setVisible(true);
      }
      // 충돌
      var self = this;
      this.enemies.getChildren().forEach(function (e) {
        if (!e.active) return;
        for (var j = 0; j < p.orbitals.length; j++) {
          if (Phaser.Math.Distance.Between(p.orbitals[j].x, p.orbitals[j].y, e.x, e.y) < (e.isBoss ? 40 : 14)) {
            self.damageEnemy(e, (p.ultDamage || 25) * 0.12);
            self.fxHit.explode(2, e.x, e.y);
            break;
          }
        }
      });
      if (p.ultT <= 0 && p.orbitals) { p.orbitals.forEach(function (o) { o.destroy(); }); p.orbitals = null; }
    },

    // ── 발사 ───────────────────────────────────────────────────────────────────
    firePlayer: function (baseAngle) {
      var s = RUN.stats, p = this.player;
      var count = s.projectiles, spread = (s.spreadAngle || 0) * Math.PI / 180;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('shoot');
      for (var i = 0; i < count; i++) {
        var off = count > 1 ? (i - (count - 1) / 2) * spread : 0;
        // 약간의 랜덤 산포
        var ang = baseAngle + off + (Math.random() - 0.5) * 0.03;
        this.spawnPBullet(p.x + Math.cos(baseAngle) * 12, p.y + Math.sin(baseAngle) * 12, ang, s, false);
      }
      // 총구 반동 살짝
      p.x -= Math.cos(baseAngle) * 0.6; p.y -= Math.sin(baseAngle) * 0.6;
    },

    spawnPBullet: function (x, y, ang, s, isSplit) {
      var b = this.pbullets.get(x, y); if (!b) return null;
      b.setActive(true).setVisible(true).setDepth(18);
      if (b.body) { b.body.enable = true; b.body.reset(x, y); b.body.setCircle(5, 2, 2); }
      var size = 1 + (s.bulletSize || 0) * (isSplit ? 0.4 : 1);
      b.setScale(size);
      var spd = s.bulletSpeed * (isSplit ? 0.8 : 1) * (1 - (s.bulletSize || 0) * 0.12);
      b.setVelocity(Math.cos(ang) * spd, Math.sin(ang) * spd);
      // 크리티컬
      var crit = Math.random() < (s.critChance || 0);
      b.damage = (s.damage * (isSplit ? 0.5 : 1)) + (crit ? (s.critBonusDamage || 0) : 0);
      b.crit = crit;
      b.pierceLeft = isSplit ? 0 : (s.pierce || 0);
      b.bounceLeft = isSplit ? 0 : (s.bounce || 0);
      b.homing = isSplit ? 0 : (s.homing || 0);
      b.splitLeft = isSplit ? 0 : (s.split || 0);
      b.hitSet = null;
      b.life = 2.2;
      return b;
    },

    // ── 적 탄막 ─────────────────────────────────────────────────────────────────
    spawnEBullet: function (x, y, ang, spd) {
      var b = this.ebullets.get(x, y); if (!b) return null;
      b.setActive(true).setVisible(true).setDepth(17);
      if (b.body) { b.body.enable = true; b.body.reset(x, y); b.body.setCircle(5.5, 2.5, 2.5); }
      b.setVelocity(Math.cos(ang) * spd, Math.sin(ang) * spd);
      b.life = 5;
      return b;
    },

    enemyPattern: function (e, kind) {
      var n = RUN.floor, base = 120 + n * 2;
      var px = this.player.x, py = this.player.y;
      var toP = Phaser.Math.Angle.Between(e.x, e.y, px, py);
      if (kind === 'aimed') { this.spawnEBullet(e.x, e.y, toP, base); }
      else if (kind === 'aimed3') { for (var i = -1; i <= 1; i++) this.spawnEBullet(e.x, e.y, toP + i * 0.22, base); }
      else if (kind === 'ring') { var c = 10 + Math.min(8, Math.floor(n / 3)); for (var j = 0; j < c; j++) this.spawnEBullet(e.x, e.y, (j / c) * Math.PI * 2, base * 0.8); }
      else if (kind === 'fan') { for (var k = -3; k <= 3; k++) this.spawnEBullet(e.x, e.y, toP + k * 0.18, base * 0.9); }
      else if (kind === 'spiral') { e._sp = (e._sp || 0) + 0.5; for (var m = 0; m < 3; m++) this.spawnEBullet(e.x, e.y, e._sp + m * (Math.PI * 2 / 3), base * 0.85); }
      else if (kind === 'walls') {
        // 양옆에서 좁은 틈 있는 벽
        var gap = Phaser.Math.Between(0, 8);
        for (var w = 0; w < 9; w++) { if (Math.abs(w - gap) <= 1) continue; this.spawnEBullet(ARENA.x + 10, ARENA.y + 40 + w * ((ARENA.h - 80) / 8), 0, base * 0.7); }
      }
    },

    updateEnemies: function (d, time) {
      var self = this, p = this.player;
      this.enemies.getChildren().forEach(function (e) {
        if (!e.active) return;
        if (e.spawnGrace > 0) e.spawnGrace -= d * 1000;
        if (e.isBoss) { self.updateBoss(e, d); return; }
        var def = e.def;
        if (def.behavior === 'chase') { self.physics.moveToObject(e, p, e.speed); }
        else if (def.behavior === 'spreader') { self.physics.moveToObject(e, p, e.speed); }
        else if (def.behavior === 'dart') {
          e.dartT -= d * 1000;
          if (e.dartT <= 0) { e.dartT = 700 + Math.random() * 700; var a = Phaser.Math.Angle.Between(e.x, e.y, p.x, p.y) + (Math.random() - 0.5); e.setVelocity(Math.cos(a) * e.speed * 2.4, Math.sin(a) * e.speed * 2.4); }
          else { e.setVelocity(e.body.velocity.x * 0.97, e.body.velocity.y * 0.97); }
        } else if (def.behavior === 'shooter') { e.setVelocity(0, 0); }
        // 사격
        if (def.fireEvery) {
          e.fireT -= d * 1000;
          if (e.fireT <= 0 && e.spawnGrace <= 0) { e.fireT = def.fireEvery; self.enemyPattern(e, def.pattern); }
        }
        // 아레나 클램프
        e.x = Phaser.Math.Clamp(e.x, ARENA.x + 12, ARENA_R - 12);
        e.y = Phaser.Math.Clamp(e.y, ARENA.y + 12, ARENA_B - 12);
      });
    },

    updateBoss: function (e, d) {
      var self = this, p = this.player;
      // 좌우 부유 이동
      e.x += e.moveDir * e.speed * d;
      if (e.x < ARENA.x + 60) e.moveDir = 1; if (e.x > ARENA_R - 60) e.moveDir = -1;
      e.y = ARENA.y + 120 + Math.sin(this.time.now / 700) * 24;
      // 페이즈(HP 비율)
      var frac = e.hp / e.maxHp;
      var ph = frac > 0.66 ? 0 : (frac > 0.33 ? 1 : 2);
      RUN.bossHpFrac = frac;
      // 패턴 사이클
      e.patternT -= d * 1000;
      if (e.patternT <= 0 && e.spawnGrace <= 0) {
        var rate = 1400 - ph * 350; e.patternT = rate;
        var pats = e.bdef.patterns;
        var kind = pats[e.patternI % pats.length]; e.patternI++;
        self.enemyPattern(e, kind);
        // 고페이즈에서 추가 탄
        if (ph >= 1) self.enemyPattern(e, 'aimed3');
        if (ph >= 2 && Math.random() < 0.5) self.enemyPattern(e, 'ring');
      }
    },

    // ── 충돌 핸들러 ─────────────────────────────────────────────────────────────
    hitEnemy: function (bullet, enemy) {
      if (!bullet.active || !enemy.active || enemy.spawnGrace > 0) return;
      if (bullet.hitSet && bullet.hitSet.indexOf(enemy) >= 0) return;
      this.damageEnemy(enemy, bullet.damage, bullet.crit);
      this.fxHit.explode(bullet.crit ? 6 : 3, bullet.x, bullet.y);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('hit');
      // 분열
      if (bullet.splitLeft > 0 && enemy.active === false) {
        for (var i = 0; i < 2; i++) this.spawnPBullet(bullet.x, bullet.y, Math.random() * Math.PI * 2, RUN.stats, true);
      }
      // 관통
      if (bullet.pierceLeft > 0) {
        bullet.pierceLeft--;
        if (!bullet.hitSet) bullet.hitSet = [];
        bullet.hitSet.push(enemy);
      } else {
        bullet.setActive(false).setVisible(false); if (bullet.body) bullet.body.enable = false;
      }
    },

    hitEnemyOrbital: function () { /* 오비탈은 updateOrbitals 에서 직접 처리 */ },

    damageEnemy: function (e, dmg, crit) {
      if (!e.active) return;
      e.hp -= dmg;
      // 피격 깜빡임(흰 플래시 후 원복)
      e.setTint(WHITE_INT); this.time.delayedCall(60, function () { if (e.active) { if (e.isBoss) e.setTint(e.bdef.tint); else e.clearTint(); } });
      if (e.hp <= 0) this.killEnemy(e);
    },

    killEnemy: function (e) {
      if (!e.active) return;
      var isBoss = e.isBoss;
      this.fxKill.explode(isBoss ? 40 : 12, e.x, e.y);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('enemyDie');
      this.cameras.main.shake(isBoss ? 500 : 120, isBoss ? 0.012 : 0.004);
      RUN.kills++;
      // 드랍
      this.dropLoot(e.x, e.y, isBoss);
      if (isBoss) {
        RUN.boss = null; RUN.bossHpFrac = 0;
        this.cameras.main.flash(300, 255, 240, 180);
        // 보스 보상: 확정 아이템 + 코인 더미
        var self = this;
        this.time.delayedCall(200, function () { self.spawnItemDrop(e.x, e.y); });
      }
      e.setActive(false).setVisible(false); if (e.body) e.body.enable = false;
      e.clearTint();
      this.floorEnemiesLeft--;
    },

    dropLoot: function (x, y, isBoss) {
      var s = RUN.stats, luck = s.luck || 0;
      // 코인
      var coins = isBoss ? 8 + Math.floor(Math.random() * 6) : (Math.random() < 0.6 ? 1 + Math.floor(Math.random() * 2) : 0);
      for (var i = 0; i < coins; i++) this.spawnPickup('coin', x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
      // 기력
      if (Math.random() < 0.18 + luck * 0.03) this.spawnPickup('energy', x, y);
      // 하트
      if (Math.random() < 0.06 + luck * 0.02) this.spawnPickup('heart', x, y);
      // 일반 적도 낮은 확률로 아이템 별
      if (!isBoss && Math.random() < 0.03 + luck * 0.02) this.spawnItemDrop(x, y);
    },

    // ── 픽업 ───────────────────────────────────────────────────────────────────
    spawnPickup: function (kind, x, y) {
      var pk = this.pickups.get(x, y, kind); if (!pk) return null;
      pk.setActive(true).setVisible(true).setDepth(14).setScale(kind === 'coin' ? 0.9 : 1);
      if (pk.body) { pk.body.enable = true; pk.body.reset(x, y); pk.body.setCircle(9, 1, 1); }
      pk.pkind = kind; pk.item = null;
      if (kind === 'coin') pk.play('coin-spin');
      // 살짝 튀어나오는 연출
      var ang = Math.random() * Math.PI * 2, f = 30 + Math.random() * 40;
      pk.setVelocity(Math.cos(ang) * f, Math.sin(ang) * f);
      pk.life = 18;
      return pk;
    },

    spawnItemDrop: function (x, y) {
      // 드랍 풀에서 행운 가중 랜덤(희귀도 높을수록 낮은 확률 + luck 보정)
      var luck = RUN.stats.luck || 0;
      var weights = { common: 60, rare: 28, epic: 11, legendary: 3 + luck * 1.5 };
      var pool = DROP_POOL.filter(function (it) { return it.kind === 'equipment'; });
      var bag = [];
      pool.forEach(function (it) { var w = Math.max(1, Math.round((weights[it.rarity] || 10) / Math.max(1, countRarity(pool, it.rarity)))); for (var i = 0; i < w; i++) bag.push(it); });
      var pick = bag[Math.floor(Math.random() * bag.length)] || pool[0];
      var pk = this.pickups.get(x, y, 'star'); if (!pk) return;
      pk.setActive(true).setVisible(true).setDepth(14).setScale(1).clearTint();
      pk.setTint(RARITY_COLOR[pick.rarity] || WHITE_INT);
      if (pk.body) { pk.body.enable = true; pk.body.reset(x, y); pk.body.setCircle(11, 3, 3); }
      pk.pkind = 'item'; pk.item = pick; pk.life = 60;
      pk.setVelocity(0, -20);
      this.tweens.add({ targets: pk, y: y - 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    },

    updatePickups: function (d) {
      var p = this.player, rad = RUN.stats.pickupRadius || 40;
      this.pickups.getChildren().forEach(function (pk) {
        if (!pk.active) return;
        pk.life -= d; if (pk.life <= 0 && pk.pkind !== 'item') { pk.setActive(false).setVisible(false); if (pk.body) pk.body.enable = false; return; }
        // 자석
        var dist = Phaser.Math.Distance.Between(pk.x, pk.y, p.x, p.y);
        if (pk.pkind !== 'item' && dist < rad) {
          var a = Phaser.Math.Angle.Between(pk.x, pk.y, p.x, p.y);
          pk.x += Math.cos(a) * 260 * d; pk.y += Math.sin(a) * 260 * d;
        } else if (pk.pkind !== 'item') {
          pk.setVelocity(pk.body.velocity.x * 0.9, pk.body.velocity.y * 0.9);
        }
        pk.x = Phaser.Math.Clamp(pk.x, ARENA.x + 8, ARENA_R - 8);
        pk.y = Phaser.Math.Clamp(pk.y, ARENA.y + 8, ARENA_B - 8);
      });
    },

    // overlap(pickups, player) → (player, pickup) 순서(스프라이트 먼저).
    grabPickup: function (player, pk) {
      if (!pk.active) return;
      var k = pk.pkind;
      if (k === 'coin') { RUN.coins += Math.round(1 * (RUN.stats.coinMult || 1)); if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('coin'); }
      else if (k === 'energy') { this.kit.resources.energy.cur = Math.min(this.kit.resources.energy.max, this.kit.resources.energy.cur + 25); if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('coin'); }
      else if (k === 'heart') { RUN.hp = Math.min(RUN.maxHp, RUN.hp + 1); if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('powerup'); this.toastShow('+1 ♥'); }
      else if (k === 'item') { this.applyItem(pk.item); }
      this.fxHit.explode(4, pk.x, pk.y);
      pk.setActive(false).setVisible(false); if (pk.body) pk.body.enable = false;
    },

    applyItem: function (it) {
      if (!it) return;
      if (it.kind === 'consumable') {
        var e = it.effect || {};
        if (e.heal) { RUN.hp = Math.min(RUN.maxHp, RUN.hp + e.heal); }
        if (e.energyRestore) { this.kit.resources.energy.cur = Math.min(this.kit.resources.energy.max, this.kit.resources.energy.cur + e.energyRestore); }
        this.toastShow(it.name);
        if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('powerup');
        return;
      }
      // 장비: 보유 목록 추가 → 스탯 재계산
      RUN.items.push(it.id);
      RUN.itemCounts[it.id] = (RUN.itemCounts[it.id] || 0) + 1;
      var prevMax = RUN.maxHp;
      recomputeStats();
      // 능력 자원/충전 갱신 반영
      this.syncKitFromStats();
      // maxHp 변동 시 hp 보정
      if (RUN.maxHp > prevMax) RUN.hp += (RUN.maxHp - prevMax);
      RUN.hp = Phaser.Math.Clamp(RUN.hp, 1, RUN.maxHp);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('powerup');
      this.cameras.main.flash(140, 255, 220, 120);
      this.toastShow('획득: ' + it.name + ' (' + rarityName(it.rarity) + ')', RARITY_COLOR[it.rarity]);
    },

    syncKitFromStats: function () {
      var s = RUN.stats;
      // 기력 최대/리젠
      var er = this.kit.resources.energy;
      er.max = 100 + (s.energyMax || 0);
      er.def.regen = 9 + (s.energyRegen || 0);
      if (er.cur > er.max) er.cur = er.max;
      // 닷지 충전
      var want = 2 + (s.dodgeCharges || 0);
      this.kit.byId.dodge_roll.charges = want;
      if ((this.kit.charges.dodge_roll || 0) < want && this.kit.cd.dodge_roll <= 0) this.kit.charges.dodge_roll = want;
    },

    // Phaser overlap(group, sprite) 는 콜백에 (sprite, groupMember) 를 넘긴다(스프라이트 먼저).
    // overlap(ebullets, player) → (player, ebullet) 순서.
    hitPlayer: function (player, bullet) {
      if (!bullet.active) return;
      // 무적/닷지 중에는 피격 무시(탄은 통과)
      if (player.invuln > 0 || player.dashT > 0) return;
      bullet.setActive(false).setVisible(false); if (bullet.body) bullet.body.enable = false;
      this.playerHurt();
    },

    // overlap(enemies, player) → (player, enemy) 순서(스프라이트 먼저).
    touchPlayer: function (player, enemy) {
      if (!enemy.active || enemy.spawnGrace > 0) return;
      // 닷지 중 적 접촉: 부츠 대시 피해
      if (player.dashT > 0 && player.dashDamage) { this.damageEnemy(enemy, player.dashDamage); return; }
      if (player.invuln > 0 || player.dashT > 0) return;
      // 가시 등껍질 반사
      if (RUN.stats.contactDamage) this.damageEnemy(enemy, RUN.stats.contactDamage);
      this.playerHurt();
    },

    playerHurt: function () {
      var p = this.player;
      // 방어구(armor) 확률 방어
      if (RUN.stats.armor && Math.random() < Math.min(0.6, RUN.stats.armor * 0.22)) { this.toastShow('방어!'); p.invuln = 0.6; this.fxPuff.explode(6, p.x, p.y); return; }
      RUN.hp--;
      p.invuln = 1.2;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('hurt');
      this.cameras.main.shake(260, 0.01);
      this.cameras.main.flash(140, 255, 60, 60);
      if (RUN.hp <= 0) this.gameOver();
    },

    // ── 탄 업데이트(컬링·반사·유도·수명) ────────────────────────────────────────
    updateBullets: function (d) {
      var self = this;
      this.pbullets.getChildren().forEach(function (b) {
        if (!b.active) return;
        b.life -= d; if (b.life <= 0) { self.killBullet(b); return; }
        // 유도
        if (b.homing > 0) {
          var t = self.nearestEnemy(b.x, b.y);
          if (t) {
            var desired = Phaser.Math.Angle.Between(b.x, b.y, t.x, t.y);
            var cur = Math.atan2(b.body.velocity.y, b.body.velocity.x);
            var na = Phaser.Math.Angle.RotateTo(cur, desired, b.homing * 6 * d);
            var sp = Math.sqrt(b.body.velocity.x * b.body.velocity.x + b.body.velocity.y * b.body.velocity.y);
            b.setVelocity(Math.cos(na) * sp, Math.sin(na) * sp);
          }
        }
        // 벽 반사 / 컬
        var bx = b.x, by = b.y;
        if (bx < ARENA.x + 4 || bx > ARENA_R - 4) { if (b.bounceLeft > 0) { b.bounceLeft--; b.body.velocity.x *= -1; b.x = Phaser.Math.Clamp(bx, ARENA.x + 5, ARENA_R - 5); } else return self.killBullet(b); }
        if (by < ARENA.y + 4 || by > ARENA_B - 4) { if (b.bounceLeft > 0) { b.bounceLeft--; b.body.velocity.y *= -1; b.y = Phaser.Math.Clamp(by, ARENA.y + 5, ARENA_B - 5); } else return self.killBullet(b); }
      });
      this.ebullets.getChildren().forEach(function (b) {
        if (!b.active) return;
        b.life -= d; if (b.life <= 0) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; return; }
        if (b.x < ARENA.x - 6 || b.x > ARENA_R + 6 || b.y < ARENA.y - 6 || b.y > ARENA_B + 6) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; }
      });
    },

    killBullet: function (b) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; },

    // ── 유틸 ───────────────────────────────────────────────────────────────────
    nearestEnemy: function (x, y) {
      var best = null, bd = 1e9;
      this.enemies.getChildren().forEach(function (e) {
        if (!e.active || e.spawnGrace > 0) return;
        var dd = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
        if (dd < bd) { bd = dd; best = e; }
      });
      return best;
    },

    clearProjectiles: function () {
      this.ebullets && this.ebullets.getChildren().forEach(function (b) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; });
      this.pbullets && this.pbullets.getChildren().forEach(function (b) { b.setActive(false).setVisible(false); if (b.body) b.body.enable = false; });
      this.pickups && this.pickups.getChildren().forEach(function (pk) { if (pk.pkind === 'item') return; pk.setActive(false).setVisible(false); if (pk.body) pk.body.enable = false; });
    },

    // ── 층 클리어 / 전환 ────────────────────────────────────────────────────────
    onFloorCleared: function () {
      if (this.state !== 'play') return;
      this.state = 'clearing';
      var self = this;
      if (RUN.floor >= 100) { this.win(); return; }
      if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.2);
      this.toastShow(STORY_TEXT.clearBarks[Math.floor(Math.random() * STORY_TEXT.clearBarks.length)], roleInt('ui_accent'));
      // 포탈 생성(아레나 하단 중앙)
      this.time.delayedCall(500, function () {
        var px = DESIGN_W / 2, py = ARENA.y + ARENA.h * 0.5;
        self.portal = self.physics.add.sprite(px, py, 'portal').setDepth(12);
        self.portal.body.setCircle(26, 9, 9);
        self.tweens.add({ targets: self.portal, scale: 1.12, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        self.portal.angleSpin = self.tweens.add({ targets: self.portal, angle: 360, duration: 4000, repeat: -1 });
        self.bannerShow('포탈로 하강 ↓', rampInt('stone', 3));
        self.portalOverlap = self.physics.add.overlap(self.player, self.portal, function () { self.descend(); });
      });
    },

    descend: function () {
      if (this.state !== 'clearing') return;
      this.state = 'transition';
      var self = this;
      if (this.portalOverlap) { this.physics.world.removeCollider(this.portalOverlap); this.portalOverlap = null; }
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('descend');
      this.cameras.main.flash(200, 180, 200, 255);
      // 업데이트 최고 기록
      if (RUN.floor > META.bestFloor) { META.bestFloor = RUN.floor; saveMeta(); }
      this.cameras.main.fadeOut(260, 10, 6, 24);
      this.cameras.main.once('camerafadeoutcomplete', function () {
        self.player.setPosition(DESIGN_W / 2, ARENA_B - 90);
        self.cameras.main.fadeIn(260, 10, 6, 24);
        self.startFloor(RUN.floor + 1);
      });
    },

    // ── 종료 ───────────────────────────────────────────────────────────────────
    gameOver: function () {
      if (this.state === 'dead') return;
      this.state = 'dead';
      var p = this.player;
      p.setVelocity(0, 0); p.dashT = 0;
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('gameover');
      if (GAME_AUDIO.setIntensity) GAME_AUDIO.setIntensity(0.1);
      this.fxKill.explode(30, p.x, p.y);
      this.cameras.main.shake(400, 0.012);
      p.setVisible(false);
      META.totalCoins += RUN.coins; if (RUN.floor > META.bestFloor) META.bestFloor = RUN.floor; saveMeta();
      var self = this;
      this.time.delayedCall(700, function () {
        self.scene.stop('HUD');
        self.scene.start('Result', { win: false, floor: RUN.floor, coins: RUN.coins, kills: RUN.kills });
      });
    },

    win: function () {
      if (this.state === 'win') return;
      this.state = 'win';
      this.player.setVelocity(0, 0);
      if (GAME_AUDIO.sfx) GAME_AUDIO.sfx('win');
      META.wins++; META.totalCoins += RUN.coins; META.bestFloor = 100; saveMeta();
      var self = this;
      this.cameras.main.flash(400, 255, 240, 180);
      this.time.delayedCall(800, function () {
        self.scene.stop('HUD');
        self.scene.start('Result', { win: true, floor: 100, coins: RUN.coins, kills: RUN.kills });
      });
    },

    // ── 배너/토스트 ─────────────────────────────────────────────────────────────
    bannerShow: function (txt, color) {
      this.banner.setText(txt).setColor('#' + (color || WHITE_INT).toString(16).padStart(6, '0')).setAlpha(0).setScale(0.6);
      this.tweens.add({ targets: this.banner, alpha: 1, scale: 1, duration: 260, ease: 'Back.out' });
      this.tweens.add({ targets: this.banner, alpha: 0, delay: 1100, duration: 400 });
    },
    toastShow: function (txt, color) {
      this.toast.setText(txt).setColor('#' + (color || roleInt('pickup')).toString(16).padStart(6, '0')).setAlpha(1).setY(ARENA_B - 40);
      this.tweens.killTweensOf(this.toast);
      this.tweens.add({ targets: this.toast, y: ARENA_B - 70, alpha: 0, delay: 700, duration: 500 });
    },
    traceShow: function (txt) {
      this.trace.setText(txt).setAlpha(0);
      this.tweens.killTweensOf(this.trace);
      this.tweens.add({ targets: this.trace, alpha: 1, delay: 650, duration: 400 });
      this.tweens.add({ targets: this.trace, alpha: 0, delay: 4400, duration: 500 });
    }
  });

  // ===========================================================================
  // HUDScene — 컨트롤(조이스틱+버튼) + HUD 표시 (Game 위 오버레이)
  // ===========================================================================
  var HUDScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function HUDScene() { Phaser.Scene.call(this, { key: 'HUD', active: false }); },
    create: function () {
      var self = this, W = DESIGN_W, H = DESIGN_H;
      this.input.addPointer(4);
      // 이동 조이스틱(좌측 영역, 플로팅)
      this.joy = JoystickKit.create(this, { move: { zone: 'left', mode: 'floating', x: 90, y: H - 90 }, radius: 52 });
      window.PopDungeon = window.PopDungeon || {}; window.PopDungeon.joy = this.joy;

      // 버튼 정의(우측 하단 엄지 영역) — dodge 가 가장 크고 손에 가깝다
      this.buttons = [
        { id: 'dodge', x: W - 64, y: H - 70, r: 40, label: '↻', color: rampInt('hero', 2), ability: 'dodge_roll' },
        { id: 'skill1', x: W - 142, y: H - 92, r: 28, label: '✦', color: rampInt('gold', 2), ability: 'pop_nova' },
        { id: 'skill2', x: W - 150, y: H - 158, r: 26, label: '▲', color: rampInt('torch', 2), ability: 'turbo_pop' },
        { id: 'ult', x: W - 78, y: H - 156, r: 26, label: '◆', color: roleInt('pickup'), ability: 'golden_storm' }
      ];

      this.g = this.add.graphics().setDepth(1000);
      this.labels = {};
      this.cdText = {};
      this.buttons.forEach(function (b) {
        self.labels[b.id] = self.add.text(b.x, b.y, b.label, { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: (b.r * 0.9) + 'px', color: WHITE }).setOrigin(0.5).setDepth(1001).setScrollFactor(0);
        self.cdText[b.id] = self.add.text(b.x, b.y + b.r + 8, '', { fontFamily: 'monospace', fontSize: '11px', color: WHITE }).setOrigin(0.5).setDepth(1001);
      });

      // 상단 HUD 텍스트
      this.floorText = this.add.text(W / 2, 28, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '26px', color: WHITE }).setOrigin(0.5).setDepth(1001).setShadow(0, 2, INK, 3);
      this.coinText = this.add.text(W - 16, 22, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '18px', color: ROLE.pickup }).setOrigin(1, 0.5).setDepth(1001);
      this.hudG = this.add.graphics().setDepth(1000);
      this.itemText = this.add.text(16, 116, '', { fontFamily: 'sans-serif', fontSize: '12px', color: ramp('steel', 3), wordWrap: { width: 250 } }).setDepth(1001);
      this.bossNameText = this.add.text(W / 2, 96, '', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '15px', color: ROLE.enemy }).setOrigin(0.5).setDepth(1001);

      this.prevPressed = {};

      // 음소거 토글
      if (window.GAME_AUDIO) {
        var mute = this.add.text(W - 16, 50, '♪', { fontFamily: 'monospace', fontSize: '20px', color: WHITE }).setOrigin(1, 0).setDepth(1002).setInteractive({ useHandCursor: true });
        mute.on('pointerdown', function () { var m = window.GAME_AUDIO.toggleMute(); mute.setText(m ? '♪̸' : '♪').setAlpha(m ? 0.5 : 1); });
      }
    },

    update: function () {
      var self = this;
      // 조이스틱 → 이동 입력
      var m = this.joy.state.move;
      GAME_INPUT.moveX = m.x; GAME_INPUT.moveY = m.y;

      // 버튼 폴링(우측 영역 멀티터치)
      var ptrs = this.input.manager.pointers;
      var pressed = { dodge: false, skill1: false, skill2: false, ult: false };
      for (var i = 0; i < ptrs.length; i++) {
        var p = ptrs[i]; if (!p.isDown) continue;
        for (var b = 0; b < this.buttons.length; b++) {
          var btn = this.buttons[b];
          var dx = p.x - btn.x, dy = p.y - btn.y;
          if (dx * dx + dy * dy <= (btn.r + 10) * (btn.r + 10)) pressed[btn.id] = true;
        }
      }
      GAME_INPUT.dodge = pressed.dodge; GAME_INPUT.skill1 = pressed.skill1; GAME_INPUT.skill2 = pressed.skill2; GAME_INPUT.ult = pressed.ult;

      // 버튼 그리기 + 쿨다운
      var kit = window.GAME_ABILITIES;
      this.g.clear();
      this.buttons.forEach(function (btn) {
        var active = pressed[btn.id];
        var cdf = kit ? kit.cooldownFrac(btn.ability) : 0;
        var ready = kit ? kit.isReady(btn.ability) : true;
        // 자원 체크
        var ab = kit && kit.get(btn.ability);
        var lowRes = false;
        if (ab && ab.resource && ab.cost) lowRes = kit.getResource(ab.resource) < ab.cost;
        self.g.fillStyle(btn.color, active ? 0.42 : 0.18);
        self.g.lineStyle(3, btn.color, (ready && !lowRes) ? 0.95 : 0.4);
        self.g.fillCircle(btn.x, btn.y, btn.r);
        self.g.strokeCircle(btn.x, btn.y, btn.r);
        // 쿨다운 파이
        if (cdf > 0) {
          self.g.fillStyle(INK_INT, 0.5);
          self.g.slice(btn.x, btn.y, btn.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cdf, false);
          self.g.fillPath();
        }
        self.labels[btn.id].setAlpha((ready && !lowRes) ? 1 : 0.45);
        // 닷지 충전 수 표시
        if (btn.id === 'dodge' && kit) self.cdText[btn.id].setText(kit.chargesLeft('dodge_roll') + '/' + (kit.byId.dodge_roll.charges || 2));
        else self.cdText[btn.id].setText('');
      });

      // 상단 HUD
      if (!RUN) return;
      this.floorText.setText('지하 ' + RUN.floor + '층');
      this.coinText.setText('◉ ' + RUN.coins);
      this.drawTopHud(kit);
      // 아이템 목록
      this.itemText.setText(this.itemSummary());
      // 보스 이름
      this.bossNameText.setText(RUN.boss ? RUN.bossName : '');
    },

    drawTopHud: function (kit) {
      var g = this.hudG; g.clear();
      // 하트
      var hx0 = 16, hy = 22;
      for (var i = 0; i < RUN.maxHp; i++) {
        var filled = i < RUN.hp;
        g.fillStyle(filled ? roleInt('danger') : rampInt('steel', 1), filled ? 1 : 0.7);
        // 하트 모양 근사(두 원 + 삼각)
        var cx = hx0 + i * 22 + 8, cy = hy;
        g.fillCircle(cx - 4, cy - 2, 4.4); g.fillCircle(cx + 4, cy - 2, 4.4);
        g.fillTriangle(cx - 8, cy, cx + 8, cy, cx, cy + 9);
      }
      // 기력 바(사각 도트 결)
      var ex = 16, ey = 44, ew = 120, eh = 8;
      var er = kit ? kit.getResource('energy') / kit.getResourceMax('energy') : 0;
      g.fillStyle(rampInt('steel', 0), 0.9); g.fillRect(ex, ey, ew, eh);
      g.fillStyle(rampInt('hero', 2), 0.95); g.fillRect(ex, ey, Math.max(0, ew * er), eh);
      g.lineStyle(1, rampInt('hero', 2), 0.6); g.strokeRect(ex, ey, ew, eh);
      // 보스 HP 바
      if (RUN.boss) {
        var bw = DESIGN_W - 120, bx = 60, by = 78;
        g.fillStyle(rampInt('scarlet', 0), 0.9); g.fillRect(bx, by, bw, 12);
        g.fillStyle(roleInt('danger'), 0.95); g.fillRect(bx, by, Math.max(0, bw * RUN.bossHpFrac), 12);
        g.lineStyle(2, rampInt('scarlet', 3), 0.7); g.strokeRect(bx, by, bw, 12);
      }
    },

    itemSummary: function () {
      if (!RUN || !RUN.items.length) return '';
      var counts = RUN.itemCounts, parts = [];
      Object.keys(counts).forEach(function (id) {
        var it = ITEM_BY_ID[id]; if (!it) return;
        parts.push(it.name + (counts[id] > 1 ? '×' + counts[id] : ''));
      });
      return '🎒 ' + parts.join(' · ');
    }
  });

  // ===========================================================================
  // ResultScene — 게임오버 / 승리
  // ===========================================================================
  var ResultScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function ResultScene() { Phaser.Scene.call(this, { key: 'Result' }); },
    create: function (data) {
      var W = DESIGN_W, H = DESIGN_H, cx = W / 2;
      var win = data && data.win;
      this.cameras.main.setBackgroundColor(win ? FLOOR_BG[2] : FLOOR_BG[3]);
      this.add.text(cx, H * 0.28, win ? '별이 떠오른 밤' : '게임 오버', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: win ? '46px' : '52px', color: win ? ROLE.ui_accent : ramp('scarlet', 2) }).setOrigin(0.5).setShadow(0, 4, INK, 4);
      // 승패 카드 (STORY.md §7 T4 転+結 / T5 별빛 송환)
      if (win) {
        this.add.text(cx, H * 0.28 + 44, STORY_TEXT.win1 + '\n' + STORY_TEXT.win2, { fontFamily: 'sans-serif', fontSize: '15px', color: ROLE.pickup, align: 'center', lineSpacing: 6, wordWrap: { width: 440 } }).setOrigin(0.5, 0);
      } else {
        this.add.text(cx, H * 0.28 + 44, STORY_TEXT.lose, { fontFamily: 'sans-serif', fontSize: '14px', color: ramp('steel', 3), align: 'center', wordWrap: { width: 420 } }).setOrigin(0.5, 0);
      }

      var hero = this.add.sprite(cx, win ? H * 0.50 : H * 0.46, 'hero', 0).setScale(3); hero.play('hero-idle');
      if (!win) hero.setTint(rampInt('steel', 2)).setAngle(180);
      if (win) {
        // 떠오르는 별 (STORY.md §7 거울쌍 — 떨어진 별이 돌아간다)
        var star = this.add.text(cx, H * 0.50 - 56, '✦', { fontFamily: 'sans-serif', fontSize: '24px', color: ramp('gold', 2) }).setOrigin(0.5).setShadow(0, 2, INK, 4);
        this.tweens.add({ targets: star, y: H * 0.50 - 88, duration: 2600, ease: 'Sine.out' });
        this.tweens.add({ targets: star, alpha: 0.45, duration: 650, yoyo: true, repeat: -1 });
      }

      var lines = [
        '도달: 지하 ' + (data ? data.floor : 1) + '층',
        '처치: ' + (data ? data.kills : 0) + '마리',
        '코인: ◉ ' + (data ? data.coins : 0),
        '최고 기록: 지하 ' + META.bestFloor + '층'
      ];
      this.add.text(cx, H * 0.62, lines.join('\n'), { fontFamily: 'sans-serif', fontSize: '20px', color: WHITE, align: 'center', lineSpacing: 8 }).setOrigin(0.5);

      var tip = this.add.text(cx, H * 0.82, '탭하여 다시 도전', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: '24px', color: WHITE }).setOrigin(0.5);
      this.tweens.add({ targets: tip, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

      var self = this, go = false;
      function restart() {
        if (go) return; go = true;
        RUN = freshRun(); META.runs++; saveMeta();
        if (GAME_AUDIO.setSection) GAME_AUDIO.setSection('combat');
        self.scene.start('Game'); self.scene.launch('HUD');
      }
      this.time.delayedCall(600, function () {
        self.input.once('pointerdown', restart);
        self.input.keyboard.once('keydown-SPACE', restart);
      });
    }
  });

  // ===========================================================================
  // 파생 스탯 계산 (아이템 + 직업 패시브)
  // ===========================================================================
  function recomputeStats() {
    var s = {
      damage: 8,            // 기본 6 + 팝건 숙련 패시브 +2
      fireDelay: 0.36,      // 초
      bulletSpeed: 460,
      moveSpeed: 188,
      projectiles: 1, spreadAngle: 0,
      pierce: 0, bounce: 0, homing: 0, split: 0,
      bulletSize: 0, critChance: 0.1, critBonusDamage: 6,  // 매의 눈 패시브
      pickupRadius: 46, coinMult: 1, luck: 0,
      armor: 0, contactDamage: 0,
      energyMax: 0, energyRegen: 0, skillDamage: 0, dodgeCharges: 0, dashDamage: 0,
      maxHpBonus: 0, turboMult: 1.8
    };
    var flatDamage = 0, dmgMult = 1;
    (RUN.items || []).forEach(function (id) {
      var it = ITEM_BY_ID[id]; if (!it) return;
      var e = it.effect || {};
      if (e.extraProjectiles) s.projectiles += e.extraProjectiles;
      if (e.spreadAngle) s.spreadAngle = Math.max(s.spreadAngle, e.spreadAngle);
      if (e.pierce) s.pierce += e.pierce;
      if (e.bounce) s.bounce += e.bounce;
      if (e.homing) s.homing += e.homing;
      if (e.split) s.split += e.split;
      if (e.bulletSize) s.bulletSize += e.bulletSize;
      if (e.fireRateFlat) s.fireDelay += e.fireRateFlat;
      if (e.damage) flatDamage += e.damage;
      if (e.damageMult) dmgMult *= e.damageMult;
      if (e.pickupRadius) s.pickupRadius += e.pickupRadius;
      if (e.coinMult) s.coinMult *= e.coinMult;
      if (e.luck) s.luck += e.luck;
      if (e.armor) s.armor += e.armor;
      if (e.contactDamage) s.contactDamage += e.contactDamage;
      if (e.energyMax) s.energyMax += e.energyMax;
      if (e.energyRegen) s.energyRegen += e.energyRegen;
      if (e.skillDamage) s.skillDamage += e.skillDamage;
      if (e.dodgeCharges) s.dodgeCharges += e.dodgeCharges;
      if (e.dashDamage) s.dashDamage += e.dashDamage;
      if (e.maxHp) s.maxHpBonus += e.maxHp;
    });
    // 세트 보너스: 스킬 빌드(2) → 스킬 피해 +10, 기력 리젠 +2
    var hasEnergyCore = RUN.items.indexOf('energy_core') >= 0, hasSkillCharm = RUN.items.indexOf('skill_charm') >= 0;
    if (hasEnergyCore && hasSkillCharm) { s.skillDamage += 10; s.energyRegen += 2; }

    s.damage = (8 + flatDamage) * dmgMult;
    s.fireDelay = Math.max(0.09, s.fireDelay);
    RUN.stats = s;
    RUN.maxHp = Math.max(1, 4 + s.maxHpBonus);
    if (RUN.hp == null) RUN.hp = RUN.maxHp;
    if (RUN.hp > RUN.maxHp) RUN.hp = RUN.maxHp;
  }

  function countRarity(pool, r) { var c = 0; pool.forEach(function (it) { if (it.rarity === r) c++; }); return c || 1; }
  function rarityName(r) { var m = { common: '일반', rare: '희귀', epic: '영웅', legendary: '전설' }; return m[r] || r; }

  // ===========================================================================
  // 게임 부팅
  // ===========================================================================
  var config = {
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: STYLE.master_palette.background,
    // 렌더 설정은 style.json render 블록을 미러(D7: medium ↔ render 정합 — StyleKit.renderConfig)
    render: Object.assign(StyleKit.renderConfig(STYLE), { preserveDrawingBuffer: /[?&]capture=1/.test(location.search) }),
    scale: Object.assign({ parent: 'game' }, MobileHarness.scaleConfig(DESIGN_W, DESIGN_H)),
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: /[?&]debug=1/.test(location.search) } },
    scene: [BootScene, TitleScene, GameScene, HUDScene, ResultScene]
  };
  var game = new Phaser.Game(config);
  window.PopDungeon = Object.assign(window.PopDungeon || {}, { game: game, input: GAME_INPUT, audio: GAME_AUDIO, meta: function () { return META; } });
})();
