# Android APK 빌드 절차

팡팡 던전 Android 앱을 로컬에서 빌드하는 방법입니다.

---

## 사전 요구사항

| 도구 | 최소 버전 | 확인 명령 |
|------|-----------|-----------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Java JDK | 17+ | `java -version` |
| Android SDK | API 22+ (Android 5.0) | Android Studio 또는 command-line tools |
| Gradle | 8+ (Android Gradle Plugin 포함) | `./gradlew --version` |

> **JAVA_HOME**: `C:\Program Files\Android\Android Studio\jbr` (이 환경에 이미 존재)
>
> **ANDROID_HOME**: 현재 미설정 상태 — 아래 절차에 따라 설정 필요.

---

## 1단계: Android SDK 설치

### Android Studio 사용 (권장)

1. [Android Studio](https://developer.android.com/studio) 설치
2. Studio 실행 → SDK Manager → **Android 14 (API 34)** 또는 **API 33** 선택 후 설치
3. SDK 경로 확인: `C:\Users\<사용자명>\AppData\Local\Android\Sdk`

### 환경 변수 설정 (PowerShell — 관리자 권한)

```powershell
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME","C:\Users\<사용자명>\AppData\Local\Android\Sdk","Machine")
```

```powershell
[System.Environment]::SetEnvironmentVariable("PATH",$env:PATH+";$env:ANDROID_HOME\tools;$env:ANDROID_HOME\platform-tools","Machine")
```

설정 후 새 PowerShell 창에서 확인:

```powershell
echo $env:ANDROID_HOME
```

---

## 2단계: www/ 빌드

게임 정적 파일을 `www/` 로 복사합니다:

```powershell
node scripts/build-www.mjs
```

---

## 3단계: Capacitor 동기화

```powershell
npx cap sync android
```

성공 시 출력 예시:
```
√ Copying web assets from www to android\app\src\main\assets\public
√ copy android in Xms
√ update android in Xms
[info] Sync finished in X.Xs
```

---

## 4단계: APK 빌드

```powershell
cd android
```

```powershell
.\gradlew assembleDebug
```

빌드 완료 후 APK 위치:

```
android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 5단계: 디바이스 설치 (선택)

USB 디버깅 활성화된 Android 기기 연결 후:

```powershell
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

---

## Release APK (서명 필요)

```powershell
cd android
```

```powershell
.\gradlew assembleRelease
```

릴리즈 APK는 서명 키스토어가 필요합니다. `android/app/build.gradle` 의 `signingConfigs` 블록에
키스토어 경로·비밀번호를 설정하세요 (`.gitignore` 에 키스토어 파일 추가 필수).

---

## 문제 해결

| 증상 | 원인 | 해결 |
|------|------|------|
| `SDK location not found` | ANDROID_HOME 미설정 | 1단계 환경변수 설정 후 터미널 재시작 |
| `Minimum supported Gradle version is X.X` | Gradle 버전 불일치 | `android/gradle/wrapper/gradle-wrapper.properties` 의 `distributionUrl` 버전 업데이트 |
| `JAVA_HOME not set` | JDK 경로 미설정 | Android Studio JBR 경로로 JAVA_HOME 설정 |
| `Could not find com.android.tools.build:gradle` | 인터넷 차단 또는 프록시 | 빌드 시 인터넷 연결 확인, 프록시 설정 |

---

## 현재 환경 상태 (2026-06-10 기준, 실빌드 검증 완료)

- Node.js: v24.13.0 ✓
- npm: 11.14.1 ✓
- JAVA_HOME: `C:\Program Files\Android\Android Studio\jbr` ✓
- Android SDK: `C:\Users\v0o0v\AppData\Local\Android\Sdk` 설치됨 ✓ (platforms API 34/36, build-tools 34~36.1, 라이선스 동의 완료)
- ANDROID_HOME: 시스템 환경변수는 미설정 — 빌드 세션에서 지정하면 충분:

  ```powershell
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
  ```

- `npx cap sync android`: **성공** ✓
- `gradlew assembleDebug`: **성공** ✓ — `app-debug.apk` 4.25MB 산출 (Gradle 8.2.1)

> 과거 빌드 실패 이력: `drawable/splash` 리소스 중복(`splash.png` 템플릿 잔재 vs `splash.xml` 오리지널).
> 템플릿 PNG 11개 제거로 해결 — 스플래시는 `splash.xml`(torchlit 팔레트, CC0) 단일 진실.
