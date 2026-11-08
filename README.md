# Wordville Android

픽셀 마을을 배경으로 단어를 배우는 영어 학습 앱의 재구성 버전입니다.
기존 `wordville_toeic_prototype_v4.html`은 확인 시 0바이트였고 기존 ZIP은 찾지 못했기 때문에, 이전 요구사항에 맞춰 소스를 새로 작성했습니다. 원본 v4와 동일한 화면·데이터를 복원한 것은 아닙니다.

## 구현 기능

- 자체 작성 기초 TOEIC 상황 예시 단어 20개, 영어·한국어 검색
- 뜻 가리기, 영어 예문·한국어 번역, 주민 역할과 대화
- 단어별 기억용 이미지 업로드·조회·삭제 (IndexedDB, 개별 이미지 최대 5MB)
- 한국어 뜻 입력 복습, 오답 10분 후 재출제, 정답 1·3·7·14·30일 간격
- 복습 정답 XP·코인 보상, 같은 복습 주기의 반복 보상 방지
- 서로 다른 단어 2개 조합, 직접 개념 이름 입력, 도감 저장·중복 보상 방지
- localStorage 학습 기록, IndexedDB 이미지: 같은 기기에만 저장
- 외부 API·키·네트워크 없이 APK 내부 콘텐츠 실행

주민 설명은 미리 작성한 예문·대화이며 AI 생성 기능은 없습니다. 단어 조합은 사용자가 연결 의미와 개념 이름을 작성하는 기능입니다. 로그인, Supabase 동기화, 전체 TOEIC 단어장, 기존 기기 데이터 자동 이전은 포함하지 않았습니다. 앱 삭제·저장 데이터 삭제 시 기록이 사라집니다.

## 모바일에서 APK 받기

1. 저장소 상단 **Actions** 탭을 엽니다.
2. **Build wordville Android APK**의 초록색 완료 실행을 엽니다.
3. 아래 **Artifacts → wordville-android-apk**를 누릅니다. GitHub 로그인이 필요할 수 있습니다.
4. ZIP을 압축 해제하고 `wordville-debug.apk`를 갤럭시에서 엽니다.

`main` 업로드 시 자동 빌드합니다. 수동 빌드는 Actions → Build wordville Android APK → Run workflow입니다.
APK는 테스트용 debug 서명입니다. 서로 다른 빌드의 debug 서명이 달라 업데이트 설치가 안 될 수 있습니다. 기존 앱을 삭제하기 전에 학습 기록 손실을 고려해야 합니다. Play Store 출시용 서명은 별도로 설정해야 합니다.

## 웹 미리보기·테스트

Node.js 22 이상과 Python 3 사용:

```sh
npm test
npm run serve
```

브라우저에서 `http://localhost:4173`을 엽니다. HTML 파일을 직접 여는 대신 HTTP 서버를 사용하세요.

## Android 빌드

JDK 17, Android SDK 35, Gradle 8.9가 필요합니다. 저장소에는 Gradle Wrapper 바이너리를 포함하지 않았습니다. GitHub Actions가 지정한 Gradle을 설치합니다.

```sh
gradle assembleDebug lintDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk`

워크플로에서 학습 로직 테스트, Android 컴파일, Android lint를 실행하고 APK를 30일간 보관합니다. 실제 갤럭시 설치·이미지 선택은 기기 검증이 필요합니다.
