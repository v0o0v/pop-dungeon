/* ============================================================================
 * 팡팡 던전 — 아트 (도트 베이킹 + PX 래스터라이저 + 적/보스 테이블)
 * ----------------------------------------------------------------------------
 * 횃불 돌던전 픽셀 룩(STYLE §3·§4). VectorForge.bake 는 ss:1 캔버스→텍스처
 * 플럼빙으로만 쓰고, 모든 드로잉은 PX 래스터라이저가 정수 좌표 1px 단위로 찍는다.
 *
 * 색 헬퍼·상수는 core.js(window.PD)에서 가져온다. 아트 전용 난수(잔돌·불티 등)는
 * 게임플레이 결정성과 무관하므로 시드 PRNG 대상에서 제외(Math.random 미사용 — 이 모듈은
 * 결정적 배치 인덱스 기반이라 애초에 난수 없음).
 * ==========================================================================*/
(function () {
  'use strict';
  var PD = window.PD;
  var ramp = PD.ramp, rampInt = PD.rampInt, roleInt = PD.roleInt, rgba = PD.rgba;
  var INK = PD.INK, WHITE = PD.WHITE, ROLE = PD.ROLE, WHITE_INT = PD.WHITE_INT;
  var BOSS_TINTS = PD.BOSS_TINTS;

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
  PD.bakeArt = bakeArt;

  // ===========================================================================
  // 적 / 보스 정의 테이블
  // ===========================================================================
  var ENEMY_TYPES = {
    slime:  { tex: 'slime', anim: 'slime-idle', hp: 3, speed: 56, behavior: 'chase', radius: 11, touch: 1, score: 1 },
    bat:    { tex: 'bat', anim: 'bat-fly', hp: 2, speed: 96, behavior: 'dart', radius: 9, touch: 1, score: 1 },
    turret: { tex: 'turret', anim: 'turret-idle', hp: 5, speed: 0, behavior: 'shooter', radius: 12, touch: 1, score: 2, fireEvery: 1500, pattern: 'aimed' },
    orb:    { tex: 'orb', anim: 'orb-idle', hp: 4, speed: 34, behavior: 'spreader', radius: 11, touch: 1, score: 2, fireEvery: 2200, pattern: 'ring' }
  };
  PD.ENEMY_TYPES = ENEMY_TYPES;

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
  PD.BOSS_TABLE = BOSS_TABLE;
})();
