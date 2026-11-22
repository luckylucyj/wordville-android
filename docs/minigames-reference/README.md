# 사용자 제공 Wordville MiniGames 소스 참고본

이 폴더는 사용자가 2026-11-23 대화에서 제시한 **독립 게임 셸 HTML 및 CSS 원문**을 보관합니다.

- `index.html`: 사용자 제공 4.1 소스 그대로 보존
- `wordville-minigames.css`: 사용자 제공 4.2 CSS 그대로 보존

**실제 앱의 진입점이 아닙니다.** HTML은 아직 존재하지 않는 `js/wordville-engine.js`, `js/world-and-room-plus.js`를 참조하므로 이 파일 자체로 실행되지 않습니다. 현재 Wordville 실사용 소스는 `../../app/src/main/assets/index.html`, `../../app/src/main/assets/canvas-minigames.js`, `../../app/src/main/assets/canvas-minigames.css`입니다.

사용자가 제공한 4.3 JavaScript는 `bindEvents()`에서 중간에 끊겨 있고, 4.4의 `world-and-room-plus.js` 코드는 없었습니다. 파싱 실패하는 미완결 JS를 앱 `assets/js` 아래에 저장해 WebView가 로드하도록 하지 않습니다. JS 알고리즘과 화면별 이벤트·데이터 계약은 `../../MINIGAMES_SPEC.md`에 정리하였습니다.

원본 이미지 13개는 `../../app/src/main/assets/images/minigames-assets.json`에서 대상 경로를 확인할 수 있으며, 현재 실제 이미지 바이너리는 포함되지 않았습니다.
