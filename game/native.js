/**
 * game/native.js — Capacitor 네이티브 백버튼 정책
 *
 * Android 하드웨어 백버튼(@capacitor/app backButton 이벤트)을
 * 현재 씬·모달 상태에 따라 분기 처리한다.
 *
 * 씬 정책 테이블:
 *   Village   → 종료 확인 다이얼로그 (App.exitApp)
 *   WorldMap  → Village 씬으로 복귀
 *   Dungeon   → 일시정지 (재개/포기 메뉴)
 *   그 외      → 안전 폴백 (no-op — 미구현 씬 대비)
 *
 * 모달 스택:
 *   window.PD.backStack 에 { close() } 객체를 push/pop.
 *   모달이 열려 있으면 백버튼은 항상 최상위 모달을 닫는다.
 *
 * Capacitor 미존재(브라우저 개발 테스트) 시 전체 no-op.
 *
 * 씬들이 이 인터페이스에 등록하는 방법:
 *   - 씬 키: window.PD.SCENES.VILLAGE / WORLDMAP / DUNGEON (string 상수)
 *   - 일시정지 핸들러: window.PD.onBackPause = function() { ... }
 *   - 모달 열기:  window.PD.backStack.push({ close() { ... } })
 *   - 모달 닫기:  window.PD.backStack.pop()
 *
 * 아직 씬이 미구현인 경우 등록만 안 하면 폴백(no-op)으로 안전 처리됨.
 */

(function initNative() {
  // ── 브라우저 환경 no-op 가드 ──────────────────────────────────────────
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) {
    // 브라우저 개발 테스트: backStack 인터페이스만 초기화하고 종료
    _ensureBackStack();
    return;
  }

  // ── @capacitor/app 플러그인 로드 ──────────────────────────────────────
  // capacitor/app 은 글로벌 Capacitor.Plugins.App 으로 접근 가능
  const App = cap.Plugins && cap.Plugins.App;
  if (!App || typeof App.addListener !== 'function') {
    console.warn('[native.js] @capacitor/app 플러그인을 찾을 수 없습니다. 백버튼 정책 비활성.');
    _ensureBackStack();
    return;
  }

  _ensureBackStack();

  // ── backButton 핸들러 등록 ─────────────────────────────────────────────
  App.addListener('backButton', function handleBack() {
    const PD = window.PD || {};

    // 1순위: 모달 스택이 있으면 최상위 모달 닫기
    const stack = PD.backStack;
    if (stack && stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top && typeof top.close === 'function') {
        top.close();
        stack.pop();
      }
      return;
    }

    // 2순위: 현재 활성 씬 확인 후 정책 테이블 분기
    const activeScene = _getActiveScene(PD);
    const SCENES = PD.SCENES || {};

    if (activeScene === SCENES.VILLAGE) {
      // Village — 종료 확인 다이얼로그
      _showExitConfirm(App);
    } else if (activeScene === SCENES.WORLDMAP) {
      // WorldMap — Village 복귀
      _goToScene(PD, SCENES.VILLAGE);
    } else if (activeScene === SCENES.DUNGEON) {
      // Dungeon — 일시정지
      _pauseDungeon(PD);
    } else {
      // 그 외 씬(Boot/Title/Result 등) 또는 미구현 씬 — 안전 폴백(no-op)
    }
  });

  console.log('[native.js] Capacitor 백버튼 정책 등록 완료');

  // ── 헬퍼 ───────────────────────────────────────────────────────────────

  /** window.PD.backStack 배열이 없으면 초기화 */
  function _ensureBackStack() {
    if (!window.PD) window.PD = {};
    if (!Array.isArray(window.PD.backStack)) {
      window.PD.backStack = [];
    }
  }

  /**
   * 현재 활성 씬 키 반환.
   * PD.game(Phaser.Game)이 있으면 getScene/manager 에서 조회,
   * 없으면 PD.currentScene 폴백.
   */
  function _getActiveScene(PD) {
    try {
      if (PD.game && PD.game.scene) {
        const scenes = PD.game.scene.getScenes(true); // active=true
        if (scenes && scenes.length > 0) {
          // 최상위 씬 key 반환 (HUD 는 항상 overlay 이므로 제외)
          for (let i = scenes.length - 1; i >= 0; i--) {
            const key = scenes[i].sys && scenes[i].sys.settings && scenes[i].sys.settings.key;
            if (key && key !== 'HUDScene') return key;
          }
        }
      }
    } catch (e) {
      // Phaser 접근 실패 시 폴백
    }
    return PD.currentScene || null;
  }

  /** Village 종료 확인 다이얼로그 */
  function _showExitConfirm(App) {
    // PD.SCENES 등록 전 단계(Title 등)에서도 동작하도록 기본 confirm 사용
    // 추후 씬 UI 모달로 교체 가능 — window.PD.backStack.push({ close }) 패턴 사용
    if (typeof window.confirm === 'function') {
      if (window.confirm('게임을 종료하시겠습니까?')) {
        App.exitApp();
      }
    } else {
      App.exitApp();
    }
  }

  /** 씬 전환 — PD.game.scene.start(key) 로 전환 */
  function _goToScene(PD, sceneKey) {
    if (!sceneKey) return;
    try {
      if (PD.game && PD.game.scene) {
        PD.game.scene.start(sceneKey);
        return;
      }
    } catch (e) {
      // 폴백: no-op
    }
  }

  /** Dungeon 일시정지 — PD.onBackPause 콜백 호출 */
  function _pauseDungeon(PD) {
    if (typeof PD.onBackPause === 'function') {
      PD.onBackPause();
    }
    // onBackPause 미등록 시 no-op (Dungeon 씬 미구현 단계 안전 폴백)
  }
})();
