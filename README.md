# 팡팡 던전 (Pop Dungeon)

엔터더건전을 레퍼런스한 **세로형 모바일 탑다운 불릿헬 로그라이크**. 귀여운 도트 마스코트 **팝거너**로
지하 100층까지 내려가며, 10층마다 보스를 잡는다. 탄막을 **닷지롤 무적프레임**으로 피하고, 총은
**자동조준**으로 쏘며, **아이템·스킬트리 조합**으로 매 런 다른 빌드를 만든다.
룩은 **torchlit-pop-dungeon** — 차가운 돌어둠 속 횃불빛을 받은 픽셀(도트) 아트 디렉션(STYLE.md).

- **플랫폼:** Android 네이티브(Capacitor) · **세로 9:16**(540×960) · 오프라인
- **엔진:** Phaser 4.1.0 + PX 도트 래스터(VectorForge.bake ss:1 플럼빙) + StyleKit(스타일 단일 진실) + SoundForge(절차 사운드) + AbilityKit + JoystickKit
- **에셋:** 100% 코드 생성 오리지널(CC0/IP-safe) — 외부 이미지·오디오 파일 0개

## 조작
- **이동:** 화면 **왼쪽**을 드래그(아날로그 가상 조이스틱, 플로팅)
- **발사:** 자동(가장 가까운 적을 자동조준)
- **닷지롤(↻):** 우하단 큰 버튼 — 무적프레임으로 탄막 통과(충전 2회)
- **스킬:** ✦ 팡 노바(범위 충격파) · ▲ 터보 팝(연사 가속) · ◆ 황금 팝 폭풍(궁극기)
- **데스크톱 테스트:** WASD/방향키 이동, Space 닷지, J/K/L 스킬

## Android 빌드 (주 배포 타깃)

Capacitor 기반 Android 네이티브 앱으로 빌드합니다. 상세 절차는 `scripts/build-apk.md` 참조.

### 빠른 시작

```
node scripts/build-www.mjs
```

```
npx cap sync android
```

ANDROID_HOME 설정 후:

```
cd android && .\gradlew assembleDebug
```

빌드 결과물: `android\app\build\outputs\apk\debug\app-debug.apk`

SDK 설치 요구사항·환경변수 설정·문제 해결은 `scripts/build-apk.md` 참조.

## 브라우저 개발 테스트 (로컬 전용)

> 브라우저는 **개발·디버그 전용**입니다. 배포 타깃은 Android 앱입니다.

정적 서버로 루트를 띄워 테스트합니다:

```
python -m http.server 8777
```

접속: `http://127.0.0.1:8777/index.html`

- `?autostart=1` : 타이틀 건너뛰고 바로 시작(자동화·검증용)
- `?debug=1` : Arcade 물리 디버그 박스
- `?capture=1` : preserveDrawingBuffer(헤드리스 캡처용)
- `?spike=1` : 미로 런타임 스파이크 PoC 씬(Phase 0.5 개발용)

> 참고: `file://` 로 직접 열어도 `data/*.data.js`(전역 변수)로 데이터를 임베드해 동작하지만,
> 일부 브라우저는 로컬 파일 보안 정책으로 캔버스/오디오를 제한할 수 있어 정적 서버 권장.

## 파일 구조
```
enterthegundun/
├── index.html              # 모바일 하니스 + 스크립트 로드
├── package.json            # Capacitor 의존성
├── capacitor.config.json   # Capacitor 앱 설정 (appId·webDir·세로고정·스플래시)
├── game/
│   ├── core.js             # 상수·PRNG·상태·헬퍼·config
│   ├── art.js              # bakeArt (PX 도트 래스터)
│   ├── story.js            # STORY_TEXT
│   ├── stats.js            # recomputeStats
│   ├── native.js           # Capacitor 백버튼 정책 (브라우저 no-op)
│   └── scenes/             # Boot·Title·Game·HUD·Result·SpikeMaze
├── data/                   # 스타일·스킬·아이템·사운드 모듈 (window.POP_* 전역)
├── engine/                 # Phaser·Tone·VectorForge·StyleKit·SoundForge·AbilityKit·JoystickKit·MobileHarness
├── assets/palette.master.json   # 마스터 팔레트
├── android/                # Capacitor Android 프로젝트 (커밋 대상)
├── www/                    # 빌드 산출물 (.gitignore — scripts/build-www.mjs 생성)
├── scripts/
│   ├── build-www.mjs       # 게임 루트 → www/ 동기화
│   └── build-apk.md        # APK 빌드 절차 문서
├── tools/emit-json.mjs     # data/ → *.json 추출 (드리프트 0)
├── STYLE.md / ABILITIES.md / ITEMS.md / AUDIO.md / STORY.md   # 설계 바이블
└── CREDITS.txt             # 라이선스
```

## 데이터 검증(린트)
`data/` 가 단일 소스다. 린터는 추출된 `*.json` 을 읽는다:

```
node tools/emit-json.mjs
```

```
node D:/ClaudeCowork/JSGameEngineForCC/skills/wgf-ability-architect/tools/lint-abilities.mjs abilities.json
```

```
node D:/ClaudeCowork/JSGameEngineForCC/skills/wgf-item-architect/tools/lint-items.mjs items.json
```

```
node D:/ClaudeCowork/JSGameEngineForCC/skills/wgf-style-architect/tools/lint-style.mjs style.json
```

```
node D:/ClaudeCowork/JSGameEngineForCC/skills/wgf-sound-architect/tools/lint-audio.mjs audio.json
```

(현재 전부 error/warn/info 0 통과.)

## 진행/저장
- 마을 진행(장비·스킬·골드·체크포인트·도감·퀘스트)은 `localStorage`(`pop-dungeon-save-v2`)에 영속.
- 던전 런 아이템·쿨다운·자원은 휘발(로그라이크).
- 기존 `pop-dungeon-meta-v1` 데이터는 SaveStore v2로 자동 마이그레이션.
