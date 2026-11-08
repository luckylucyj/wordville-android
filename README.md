# Wordville Village 1.1

Android에서 실행되는 영어 학습 앱입니다. WebView 내부에서 HTML·JavaScript·Canvas로 픽셀 마을을 그립니다. Unity 프로젝트는 아닙니다.

## 마을과 학습

- 첨부 레퍼런스의 석조 건물·가로수·광장·카페·중앙 탑 구성을 참고한 자체 Canvas 픽셀 그래픽
- 주민 12명: 알렉스, 엘리엇, 하비, 샘, 세바스찬, 셰인, 헤일리, 레아, 마루, 페니, 애비게일, 에밀리
- 연결된 산책로 위 이동, 가까이 만난 주민끼리 대화, 대화 기록, 주민 선택 후 연관 단어 학습
- 기기의 현재 시간으로 낮(06–18시)·저녁(18–20시)·밤(20–06시) 전환. 일출·일몰 관측값은 사용하지 않습니다.
- 낮·밤 미리보기, 확대·축소, 주민 움직임 일시 정지
- 앱을 연 동안만 시뮬레이션이 실행됩니다. 오프라인에서도 마을은 동작합니다.
- 예시 단어 20개, 검색·예문·복습·개념 조합. Word Card 뜻 보기/숨기기는 반복 토글입니다.
- 주민 대화는 준비된 문장입니다. AI 생성 대화나 여러 실제 사용자 간 멀티플레이는 아닙니다.

## 이미지 서버

Wordville 전용 Supabase 프로젝트(서울), 비공개 `wordville-images` 버킷을 사용합니다.

- 앱 하단에서 이메일로 회원가입 → 이메일 인증 → 로그인
- 로그인 후 단어 카드에서 선택한 이미지는 본인 계정의 서버 폴더에 저장
- 같은 계정으로 다른 기기에서 로그인하면 단어별 이미지 조회 가능
- PNG/JPEG/WebP/GIF, 개별 이미지 5 MiB 이하. SVG·그 외 파일은 차단
- RLS(행별 접근 규칙)로 본인 폴더만 조회·업로드·교체·삭제 가능
- 로그인 전 이미지는 IndexedDB(기기 안의 저장 공간)에 저장
- 서버 연결 실패 시 기기 저장 여부를 표시하고 재시도 버튼 제공
- 현재 앱의 로그인 전 기존 이미지는 사용자가 `이 기기의 기존 이미지 서버에 복사`를 눌러 이전
- 학습 점수·복습 기록·개념 도감은 기기 저장이며 서버 동기화 대상은 이미지입니다.

공개 클라이언트에는 publishable key만 포함합니다. service-role key는 포함하지 않습니다.
서버 설정 SQL: `server/storage.sql`. Wordville 전용 프로젝트에 적용되어 있습니다.

## 기존 앱과 설치

이전 1.0 설치본의 서명 키를 이어받을 수 없어서 새 테스트 앱 ID는 `com.wordville.app.village`, 이름은 **Wordville Village**입니다. 기존 Wordville을 삭제할 필요가 없습니다. 기존 앱의 기기 저장 기록은 새 앱으로 자동 이전되지 않습니다.

테스트용 debug 서명입니다. 향후 테스트 APK는 CI의 debug keystore 캐시를 재사용하지만 캐시 삭제·만료 시 서명이 달라질 수 있습니다. 정식 배포 시 소유자가 보관하는 별도 서명 키와 보안 CI 비밀 저장 설정이 필요합니다. 서명 키를 공개 저장소에 넣지 마세요.

## 개발·확인

Node.js 22 이상, Python 3:

```sh
npm ci
npm run build:web
npm test
npm run serve
```

`http://localhost:4173`에서 미리볼 수 있습니다. Supabase SDK는 로컬 파일로 묶이므로 CDN 스크립트가 필요 없습니다.

모바일 브라우저 테스트:

```sh
npx playwright install chromium --only-shell
node tests/browser.cjs
```

브라우저 테스트 전 `npm run serve`로 서버를 켜야 합니다. GitHub Actions는 Chrome을 지정해 같은 테스트를 실행합니다.

Android: JDK 17, Gradle 8.9, SDK 35.

```sh
gradle assembleDebug assembleDebugAndroidTest lintDebug
```

GitHub Actions의 Android 기기 테스트는 API 35 가상 기기에서 설치·시작·WebView 로딩·뜻 토글·주민 12명·야간 전환을 검사합니다. 본인의 실제 갤럭시에서 설치·사진 선택·이메일 로그인도 확인해야 합니다.

APK는 Actions 실행의 `wordville-android-apk`에서 받을 수 있습니다.

## Unity·Blender로 확장할 때

현재 저장소는 Android Studio에서 폴더를 열 수 있는 Gradle 프로젝트입니다. Unity는 사용하지 않습니다. 3D로 전환하려면 Blender에서 모델을 만들어 FBX로 내보내고 Unity에서 장면·이동·상호작용을 구현해야 합니다. Unity에서 Android APK를 바로 빌드하거나 Gradle 프로젝트를 내보내 Android Studio에서 빌드할 수 있습니다. 현재 웹 화면이 Unity 장면으로 자동 변환되지는 않습니다.
