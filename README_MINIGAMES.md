# Wordville 미니게임/하우징 적용 안내

**현재 상태 (2026-11-23): 기존 Canvas 엔진에 월드맵·하우징 기능을 통합한 개발 브랜치.** 원본 이미지 13개가 없으므로 최종 이미지 반영 및 Galaxy 실기기 검증은 미완료입니다. `main`과 현재 배포 APK는 변경하지 않았습니다. [전체 UI/UX 명세](MINIGAMES_SPEC.md)를 먼저 확인하세요.

## 1. 이미 Wordville에 구현된 내용

- 앱 실제 진입점: `app/src/main/assets/index.html`
- 실제 Canvas 엔진: `app/src/main/assets/canvas-minigames.js`
- 실제 스타일: `app/src/main/assets/canvas-minigames.css`
- 기존 게임 모드: `fishing`, `weeding`, `foraging`, `room`; 기존 단어장·복습 기록 연동
- 기존 독립 게임 문서: 루트 `README.md`의 `HTML5 Canvas 영단어 미니게임 4종` 절

위 파일들을 예시 코드의 `index.html`, `js/wordville-engine.js`, `css/wordville-minigames.css`로 무조건 바꿔치기하지 마세요. 기존 앱 화면/기능/스크립트 로딩 순서가 달라집니다. 마을 지도는 현재 별도 마을 UI가 있으며, 본 명세의 `world` 모드는 신규 미니게임 허브 요구사항입니다.

## 2. 이미지 등록

`app/src/main/assets/images/minigames-assets.json`에 13개 **원본 식별자 → 목표 경로**를 기록했습니다. 확인 당시 `main`에서 요청한 13개 대상 경로가 모두 존재하지 않았습니다. 기능을 개발 브랜치에 추가하되, 원본 바이너리 없이는 경로만 등록하고 **이미지를 생성한 것처럼 표시하지 않습니다**.

이미지 작업 순서:

1. 실제 생성된 원본 파일을 확보한 뒤 원본 식별자(예: `6483ca8e.png`)와 장면이 일치하는지 시각적으로 확인합니다.
2. 변환이 필요한 JPEG 원본은 실제 PNG로 변환하고 PNG가 정상 디코딩되는지 검사합니다. 단순 파일명 변경은 금지합니다.
3. 문서의 경로대로 파일을 배치합니다. `app/src/main/assets/` 아래의 상대 경로를 사용합니다.
4. **낚시 배경 경로 호환:** 기존 `images/fishing/bg_fishing.png`를 우선 사용하고 파일이 없으면 사용자 지정 `images/fishing/bg_dock.png`로 재시도하도록 엔진을 변경했습니다. 두 파일 모두 없다면 이미지 로드 실패를 표시합니다.
5. 흰 배경 스프라이트는 이미지 가장자리의 연속된 흰색 영역만 투명화하고 하치와레 몸통의 흰색은 보존합니다.
6. 누락 이미지 시 Console 에러, 시퀀스 재생, 크기/좌표, 실제 Galaxy WebView 빌드를 검사합니다.

이미지 경로표에는 13개 항목이 있으며 `status: "missing-unverified"`는 원본을 확보하지 못했다는 뜻입니다. 기획된 PNG와 캐릭터 이미지를 다른 그림으로 임의 치환하지 않습니다.

## 3. 구현 차이·주의 사항

| 항목 | 사용자 제공 설계 | 현재 앱 통합 시 조치 |
| --- | --- | --- |
| 화면 | 독립 `#game-shell` + 4개 탭 | 기존 Wordville index의 게임 패널과 공존, 중복 ID 방지 |
| 맵 | `world` + 4개 좌표 터치 핫스팟 | 미니게임 월드 모드와 5개 탭 네비게이션 추가 |
| 배경 | `bg_dock.png` | 기존 `bg_fishing.png` 우선, 없으면 새 `bg_dock.png`로 재시도 |
| 단어 | 5개 예시 데이터 | 실제 기존 VOCA 원본 사용 (샘플로 덮어쓰기 금지) |
| 결과 | 성공 시 Android 콜백 | 기존 JS 학습 기록·XP·코인과 이중 지급 방지 |
| 방 | 4테마, 가구 `flipX`, 회수, 저장 | `wordville_room_v1`에 테마·반전 상태를 추가하고 이전 배치 데이터 복원 |
| 투명화 | `createTransparentSprite` | 경계 배경만 제거하는 알고리즘 검증 |
| 터치 | `touch-action:none` | 기존 세로 스크롤 보존, 드래그에서만 포인터 캡처 |
| 애니메이션 | 프레임 값 이동 방식 예시 | 실제 시간 `dt` 기반; 화면 숨김/복귀 시 루프 중복 금지 |

**소스 상태:** 사용자 채팅의 `wordville-engine.js`는 `bindEvents()` 부분에서 잘려 있고, `world-and-room-plus.js` 본문과 `createTransparentSprite` 구현은 별도로 제공되지 않았습니다. 제공된 코드만으로 완전한 신규 엔진을 실행할 수 없습니다. 따라서 실행 불가능한 미완성 예시 JS를 별도로 로드하지 않고, 기존 실제 엔진을 확장했습니다.

## 4. 완료 판정

- [x] 기능·좌표·배치·보상·데이터 계약 명세 등록
- [x] 파일별 원본 식별자와 목표 에셋 경로 목록 등록
- [x] 기존 구현과 충돌하는 경로·데이터 처리 차이 기록
- [ ] 13개 실제 이미지 파일 확보 및 바이너리 커밋
- [x] 미니게임 월드 허브, 4개 방 테마, `flipX`·회수·자동 저장 기존 엔진에 구현
- [x] 좌표 판정·테마/반전 저장 복원·기존 단어 보상 콜백 로직 검사
- [x] `tests/minigame-world-room.test.mjs` 자동 테스트 코드 등록
- [ ] 이미지 렌더링/타이밍/복습 큐와 WebView 실기기 테스트
- [ ] APK 빌드 및 성공 여부 확인

**실제 엔진 코드를 변경했지만 원본 이미지 파일은 없으며, 설치 APK의 빌드 및 Android 실기기 성공은 별도 확인이 필요합니다.** PR의 검사 결과를 확인한 뒤 병합하세요.

## 5. 사용자 제공 HTML·CSS 원문

- [`docs/minigames-reference/index.html`](docs/minigames-reference/index.html) — 독립 게임 화면의 HTML 원문
- [`docs/minigames-reference/wordville-minigames.css`](docs/minigames-reference/wordville-minigames.css) — 파스텔 게임 UI CSS 원문
- [`docs/minigames-reference/README.md`](docs/minigames-reference/README.md) — 원문 코드가 실제 앱 실행 경로가 아닌 이유 및 누락된 JS 안내

실제 메인 앱에서 이 참고 소스를 별도로 로드하지 않았습니다. 요청된 JS는 붙여넣기 도중 끊겼기 때문에 **기존 `canvas-minigames.js`를 직접 확장**하는 방식으로 월드맵과 하우징 기능을 구현했습니다.

## 6. 이번 PR의 실제 코드 변경

- Canvas 화면에 5개 모드 네비게이션과 4개 월드 거점 터치 판정을 추가했습니다.
- 방 테마 4종, 가구 선택·좌우 반전·회수, 최대 35개 배치 제한을 구현했습니다. 테마·반전·위치는 이전 저장 데이터와 함께 `wordville_room_v1`에 저장합니다.
- 학습 완료 후 기존 `WordvilleSolo.learnFromCanvas`가 성공했을 때만 해금 가구를 저장하는 로직을 추가했습니다.
- 배경 이미지 명칭은 `bg_fishing.png` 및 `bg_dock.png`를 모두 지원합니다.
- UI CSS는 기존 세로 스크롤을 유지하고 모바일 폭에 따라 버튼을 배치합니다.
- 13개 요청 이미지의 실제 바이너리는 미첨부 상태입니다. 누락된 월드 이미지는 경로 안내 UI를 표시하며 그림이 있는 것처럼 위장하지 않습니다.
- Android WebView·APK·실기기 검사는 GitHub Actions의 빌드 결과와 별도로 확인해야 합니다.
