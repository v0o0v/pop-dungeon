# 팡팡 던전 (Pop Dungeon)

엔터더건전을 레퍼런스한 **세로형 모바일 탑다운 불릿헬 로그라이크**. 귀여운 도트 마스코트 **팝거너**로
지하 100층까지 내려가며, 10층마다 보스를 잡는다. 탄막을 **닷지롤 무적프레임**으로 피하고, 총은
**자동조준**으로 쏘며, **아이템 조합**으로 매 런 다른 빌드를 만든다.
룩은 **torchlit-pop-dungeon** — 차가운 돌어둠 속 횃불빛을 받은 픽셀(도트) 아트 디렉션(STYLE.md).

- **플랫폼:** 모바일 웹뷰(Android WebView) · **세로 9:16**(540×960) · 오프라인
- **엔진:** Phaser 4.1.0 + PX 도트 래스터(VectorForge.bake ss:1 플럼빙) + StyleKit(스타일 단일 진실) + SoundForge(절차 사운드) + AbilityKit + JoystickKit
- **에셋:** 100% 코드 생성 오리지널(CC0/IP-safe) — 외부 이미지·오디오 파일 0개

## 조작
- **이동:** 화면 **왼쪽**을 드래그(아날로그 가상 조이스틱, 플로팅)
- **발사:** 자동(가장 가까운 적을 자동조준)
- **닷지롤(↻):** 우하단 큰 버튼 — 무적프레임으로 탄막 통과(충전 2회)
- **스킬:** ✦ 팡 노바(범위 충격파) · ▲ 터보 팝(연사 가속) · ◆ 황금 팝 폭풍(궁극기)
- **데스크톱 테스트:** WASD/방향키 이동, Space 닷지, J/K/L 스킬

## 실행 (로컬)
정적 파일이라 아무 정적 서버로 띄우면 된다(루트에서):

```bash
python -m http.server 8777
```

브라우저에서:

```
http://127.0.0.1:8777/index.html
```

- `?autostart=1` : 타이틀을 건너뛰고 바로 시작(자동화/검증용)
- `?debug=1` : Arcade 물리 디버그 박스
- `?capture=1` : preserveDrawingBuffer(헤드리스 캡처용)

> 주의: `file://` 로 직접 열어도 데이터는 `data.js`(전역 변수)로 임베드되어 동작하지만,
> 일부 브라우저는 로컬 파일 보안 정책으로 캔버스/오디오를 제한할 수 있어 **정적 서버 권장**.

## 파일 구조
```
enterthegundun/
├── index.html          # 모바일 하니스 + 스크립트 로드
├── game.js             # 게임 본체(씬·던전·전투·보스·아이템·스킬·주스) — 색은 전부 STYLE 참조
├── data.js             # 스타일·스킬·아이템·사운드 단일 소스(window.POP_* 전역)
├── style.json          # data.js 에서 추출(린트용) — style-architect 계약
├── abilities.json      # data.js 에서 추출(린트용) — ability-architect 계약
├── items.json          # data.js 에서 추출(린트용) — item-architect 계약
├── audio.json          # data.js 에서 추출(린트용) — sound-architect 계약
├── assets/palette.master.json   # 마스터 팔레트(상속용 — item/ability 아이콘 생성기)
├── STYLE.md / ABILITIES.md / ITEMS.md / AUDIO.md   # 설계 바이블
├── CREDITS.txt         # 라이선스
├── tools/emit-json.mjs # data.js → *.json 추출(드리프트 0)
└── engine/             # Phaser·Tone·VectorForge·StyleKit·SoundForge·AbilityKit·JoystickKit·MobileHarness
```

## 데이터 검증(린트)
`data.js` 가 유일한 런타임 소스다. 린터는 추출된 `*.json` 을 읽는다:

```bash
node tools/emit-json.mjs
```

```bash
node ../JSGameEngineForCC/skills/ability-architect/tools/lint-abilities.mjs abilities.json
```

(items/audio 도 동일. 현재 셋 다 error/warn/info 0 통과.)

스타일(아트 디렉션)은 style-architect 린터로 검증한다(error/warn 0 통과 — STYLE.md §7 검수 로그 참조):

```bash
node <web-game-builder>/skills/wgf-style-architect/tools/lint-style.mjs style.json
```

## Android 패키징(오프라인 앱)
이 폴더 전체를 WebView 컨테이너로 감싸면 오프라인 Android 앱이 된다:
- **Capacitor / Cordova:** `www/` 에 이 폴더를 넣고 빌드. 에셋이 `capacitor://`/`http://localhost`
  스킴으로 서빙되어 모든 기능(오디오·터치) 정상.
- 세로 고정: 앱 매니페스트에서 `screenOrientation="portrait"` 권장.

## 확장 (추후 직업 추가)
직업은 **데이터 주도**다. 새 직업 추가 절차:
1. `data.js` 의 `POP_ABILITIES.abilities` 에 새 직업의 능력 세트를 추가(또는 직업별 abilities 스펙 분리).
2. `game.js` `recomputeStats()` 의 기본 스탯(기본 무기·이동속도 등)을 직업별로 분기.
3. `TitleScene` 에 직업 선택 카드를 추가하고, 선택값을 `RUN.class` 로 저장.
4. `node tools/emit-json.mjs && node .../lint-abilities.mjs abilities.json` 로 밸런스 검수.

현재는 1직업(**팝거너**)만 구현 — 타이틀에 "더 많은 직업 예정" 표기.

## 진행/저장
- 메타 진행은 `localStorage`(`pop-dungeon-meta-v1`)에 최고 도달 층·클리어 횟수·누적 코인 저장.
- 런 진행(현재 층·아이템·HP)은 휘발(로그라이크).
