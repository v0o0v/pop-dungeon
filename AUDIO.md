# 팡팡 던전 — 사운드 바이블 (AUDIO.md)

> 데이터는 `data.js` → `audio.json`(sound-architect 계약). 엔진은 `engine/soundforge.js`(Tone.js v15 절차 합성).
> 오디오 파일 0개 — 스케일·코드 진행에서 절차 생성한 100% 오리지널(CC0).
> 린트: `node .../sound-architect/tools/lint-audio.mjs audio.json` → 결함 0.

## 무드 (S1)
- **티어 3**, 기본 무드 **cheerful(경쾌·아기자기)**. 전투는 활기차게, 보스는 긴박하게.
- 마스터: volume -7dB, limiter -1dB, reverb decay 2.0s. 보이스 예산 16(모바일 폴리포니).

## 적응형 BGM (섹션 + 인텐시티)
3개 트랙을 **섹션 전환**(수평 리시퀀싱) + **인텐시티 레이어**(수직 크로스페이드)로 운용:

| 섹션 | 트랙 | 스케일 / 키 / BPM | 진행 | 무드 |
|---|---|---|---|---|
| explore | explore | major-pentatonic / C / 124 | i–VI–IV–V | cheerful |
| combat | combat | mixolydian / C / 132 | i–VII–IV–i | heroic |
| boss | boss | harmonic-minor / A / 152 | i–VI–V–i | tense |

- 각 트랙 레이어: **pad(베드, minIntensity 0)** + bass + drums + lead. 인텐시티가 오르면 드럼·리드가 켜진다.
- `game.js` 배선: 층 시작 시 `setSection('combat')`, 보스층 `setSection('boss')` + `setIntensity(1)`, 클리어 시 인텐시티 하강.

## 효과음 (SFX 팔레트)
전부 레이어드 절차 합성(트랜지언트+바디):

| 키 | 이벤트 | 음색 |
|---|---|---|
| shoot | 발사 | square 760→520, 짧고 작게(연사라 절제) |
| hit | 적 피격 | noise + square 220 |
| enemyDie | 적 처치 | noise + boom C3 |
| dodge | 닷지롤 | noise 스윕 + triangle 상승 |
| coin | 코인/기력 픽업 | square 988→1319 |
| powerup | 하트/소모품 | square 상승 아르페지오 |
| skill | 터보/궁 발동 | FM 660 + noise |
| nova | 팡 노바 | boom C2 + noise + square 하강 |
| hurt | 피격 | noise 700 + saw 하강 |
| bossWarn | 보스 등장 | metal + boom A1 |
| descend | 하강 | square 상승 3음 |
| gameover | 게임오버 | triangle 하강 3음 |
| win | 클리어 | square 상승 팡파르 |

## 모바일 / 믹스
- 첫 제스처('탭하여 시작')에서 `unlock()` + `startBgm()` (자동재생 정책 준수).
- `mobile.js` 가시성 가드가 백그라운드 시 `suspend`, 복귀 시 `resume`. 음소거 토글(♪) 우상단.
- 보이스 예산: 트랙 피크 ~10 + SFX 헤드룸 4 = 14 ≤ 16.

## CC0
- 모든 멜로디·진행은 스케일에서 절차 생성 — 어떤 곡도 인용하지 않음. 오디오 파일 의존 0.
