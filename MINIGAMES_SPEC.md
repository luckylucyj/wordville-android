# Wordville MiniGames & Housing UI/UX Specification

> 작성 기준: 2026-11-23 · 사용자 제공 설계 및 코드(4.1~4.3) 기준 · **설계/레퍼런스 문서이며 설치 가능한 새 앱 구현 완료를 의미하지 않습니다.**
>
> 원본 요청의 JavaScript 붙여넣기는 `bindEvents()` 중간에서 끝났습니다. 따라서 해당 JS를 그대로 실행 파일로 저장하지 않으며 기존 앱 엔진을 덮어쓰지 않습니다. 현재 구동 중인 구현은 `app/src/main/assets/canvas-minigames.js`, 스타일은 `canvas-minigames.css`, 진입점은 `index.html`입니다.

## 1. 기술 스택·통합 계약

| 항목 | 명세 |
| --- | --- |
| 실행 환경 | Android WebView, HTML5 / CSS3 / Vanilla JavaScript / Canvas |
| 콘텐츠 경로 | `app/src/main/assets/`; 물리적 `file:///android_asset/...` 또는 WebViewAssetLoader의 `https://appassets.androidplatform.net/assets/...`로 접근 |
| 논리 해상도 | 고정 `600 × 1000`, 가로/세로 비율 3:5 |
| Retina 대응 | 기기 DPR를 반영하며 DPR=2일 때 백버퍼 `1200 × 2000` |
| Android → JS | `window.wordvilleGame.loadWordsFromAndroid(wordListJson)` — 기존 객체/배열 호환 여부 검증 |
| JS → Android | `window.AndroidBridge.onWordLearned(wordId, gameType)` — **실제 단어 학습 성공시에만** 호출 |
| 아트 방향 | 따뜻한 파스텔 동화풍, 크레용 질감, `#4A3B32` 다크 브라운 외곽선, SD 2~2.5등신 |

**기존 학습 데이터 우선:** 사용자 예시의 `harvest/sprout/cozy/meadow/breeze` 샘플은 디자인 목업용이며 기존 Wordville의 `WordvilleWords`, 복습 큐, 기록/XP/코인 로직을 대체하지 않습니다. Android 브릿지와 WebView 내부 보상 처리가 동일 학습에 이중 반영되지 않아야 합니다. 현재 앱의 저장소 오리진/서명 식별자와 이전 공부 기록을 유지합니다.

## 2. 디렉터리와 이미지 에셋 매핑

요청 이미지 13개는 아래 원본 참조 파일명과 대상 파일명을 **정확히** 일대일로 매핑합니다. 이미지 바이너리는 별도 확보·검증 후 커밋해야 하며, 이미지가 없다고 도형으로 대체하거나 다른 캐릭터 이미지로 추정 연결하지 않습니다.

| 기능 | 지정된 원본 참조 | 앱 내 목표 경로 |
| --- | --- | --- |
| 마을 월드맵 | `960a00eb.png` | `images/world/bg_world_map.png` |
| 낚시 배경 | `dd58ffc0.jpeg` | `images/fishing/bg_dock.png` |
| 하치와레 대기 | `6483ca8e.png` | `images/fishing/hachiware_idle.png` |
| 하치와레 낚아채기 | `cb91bc66.png` | `images/fishing/hachiware_catch.png` |
| 제초 배경 | `70d180b6.png` | `images/weeding/bg_meadow.png` |
| 제초 적합 | `1c5e8815.png` | `images/weeding/chiikawa_perfect.png` |
| 제초 중간 | `7d066ae4.png` | `images/weeding/chiikawa_medium.png` |
| 제초 비적합 | `bb91c328.png` | `images/weeding/chiikawa_bad.png` |
| 채집 배경 | `6f677588.jpeg` | `images/foraging/bg_forest.png` |
| 채집 발견 | `71ee2b26.png` | `images/foraging/chiikawa_food_1.png` |
| 채집 줍기 | `e7ab3e07.png` | `images/foraging/chiikawa_food_2.png` |
| 채집 획득 | `e2e7f6c8.png` | `images/foraging/chiikawa_food_3.png` |
| 방 쿼터뷰 | `faabd908.jpeg` | `images/room/bg_isometric_room.png` |

모든 경로 앞에는 `app/src/main/assets/`가 붙습니다. 외부 JPEG 원본(`dd58ffc0.jpeg`, `6f677588.jpeg`, `faabd908.jpeg`)을 `.png`로 저장할 때는 실제 PNG로 **디코딩 후 재인코딩**해야 하며 확장자만 변경하지 않습니다. 순백색 배경 캐릭터는 로드 시 `createTransparentSprite` 처리하되 얼굴/몸의 흰 픽셀까지 지우지 않도록 가장자리와 연결된 배경 픽셀만 제거합니다.

**현행 앱과의 경로 차이:** 기존 `canvas-minigames.js`의 낚시 배경 키는 `images/fishing/bg_fishing.png`입니다(사용자 명세는 `bg_dock.png`). 통합 작업에서 실제 파일명과 매니페스트를 하나로 맞추고, 기존 렌더러가 사용하는 경로를 정확히 변경/매핑해야 합니다. 현재 이미지가 없는 상태에서 파일이 있다고 가정하면 안 됩니다.

## 3. 화면 정의 및 게임 규칙

### 0. 월드맵(`world`)

정사영 3/4 탑다운 마을 이미지를 `600×1000` 캔버스 전체에 표시합니다. 길로 연결된 아래 4개 거점을 클릭/탭하여 해당 게임으로 진입합니다.

| 위치 | 논리 좌표 | 액션 |
| --- | --- | --- |
| 좌측 부두 | (145, 470) | `fishing` · 🎣 하치와레 낚시터 |
| 우상단 풀밭 | (445, 275) | `weeding` · 🌱 치이카와 잡초밭 |
| 우하단 숲길 | (455, 555) | `foraging` · 🍙 음식 줍기 |
| 중앙 하단 오두막 | (300, 710) | `room` · 🏠 나의 방 |

터치 판정은 CSS 픽셀이 아닌 고정 논리 좌표로 변환합니다. 화면 위의 UI가 월드 좌표 접근을 가리지 않게 구성합니다. `world` 메뉴와 뒤로 가기 동작이 기존 앱 네비게이션과 충돌하지 않아야 합니다.

### 1. 낚시(`fishing`) — 하치와레

- HUD: 좌상단 낮/밤 게이지, 우측 세로 도감 4칸, 좌하단 `NEW` 영단어 결과 카드, 하단 낚싯대 타이밍 게이지.
- 타이밍 포인터는 0~1 사이를 왕복하며 목표 물고기 구간은 `[0.68, 0.86]`입니다.
- 목표 구간 진입 시 탭: 입질 성공 → `hachiware_catch.png` 표시 → 현재 단어 학습 성공 기록 → 해당 단어의 가구 보상 해금.
- 실패: 낚시만 다시 시도하며 학습 완료와 보상은 지급하지 않습니다.
- 배경은 캔버스 전체를 채우고, `hachiware_idle.png`/`hachiware_catch.png`는 이미지로만 표시합니다. 도형 Fallback을 실행하지 않으며 이미지 `onerror`로 누락 경로를 기록합니다.
- 앱 기존 엔진이 사용 중인 `bg_fishing.png`와 본 기획의 `bg_dock.png` 경로를 통일해야 합니다.

### 2. 잡초 뽑기(`weeding`) — 치이카와

판정 게이지는 **비적합 → 중간 → 적합 → 중간 → 비적합** 순서입니다. 경계값을 포함하여 다음 순서로 검사해야 판정이 중복되지 않습니다.

| 위치 `p` | 판정 | 표시 이미지 | 단어 처리 |
| --- | --- | --- | --- |
| `0.40 ≤ p ≤ 0.60` | 적합 (Perfect) | `chiikawa_perfect.png` | 완료/가구 해금 |
| `0.22 ≤ p < 0.40` 또는 `0.60 < p ≤ 0.78` | 중간 (Good) | `chiikawa_medium.png` | 성공/가구 해금 |
| 그 밖 | 비적합 (Bad) | `chiikawa_bad.png` | 완료 처리 금지, 기존 복습 큐에 재삽입 |

판정 직후 결과 포즈를 약 1.3초 보여주고 다음 입력 전에 상태를 초기화합니다. 실패에 대해서는 Android 단어 완료 콜백을 호출하지 않습니다.

### 3. 음식 줍기(`foraging`) — 치이카와

화면 음식(푸딩, 주먹밥, 케이크)의 뜻에 해당하는 영어 단어를 하단 3지선다 버튼에서 선택합니다. 정확한 단어에 정답 시 이미지 시퀀스 `chiikawa_food_1.png` 발견 → `chiikawa_food_2.png` 두 손으로 줍기 → `chiikawa_food_3.png` 획득 기쁨을 순서대로 진행합니다. 모든 단계가 완료된 뒤 **한 번만** 단어/보상을 확정하고 다음 문제로 넘어갑니다. 오답은 복습 대상이며 획득 보상을 지급하지 않습니다.

선택지 구성은 실제 서로 다른 영어 단어 3개를 사용하고 오답 보기를 무작위로 섞어야 합니다. 단어 수가 3개 미만일 경우 중복 보기를 만들지 말고 입력 불가 상태와 그 이유를 표시합니다.

### 4. 나의 방(`room`) — 쿼터뷰 하우징

- 바닥에 가구를 드래그 배치합니다. 가구 기본 ID: `bed`, `shelf`, `chair`, `plant`, `lamp`, `rug`.
- 하단 `Room Decor` 인벤토리에서 **실제로 해금된** 항목을 선택해 배치합니다. 배치 좌표는 방의 바닥 다각형 내부로 제한합니다.
- 테마: 코지 크림 / 민트 브리즈 / 피치 블라썸 / 나이트 스타.
- 선택 가구 좌우 반전(`flipX`), 회수, 배치 초기화. 초기화는 배치 목록만 지우며 해금 가구는 남겨 둡니다.
- `localStorage` 키: `wordville_room_v1`. 저장 데이터 필드: `unlocked`, `placed`(각 항목 `id,x,y,flipX`), `theme`. `dragIdx` 같은 일시적인 터치 상태는 저장하지 않습니다.
- 기존 사용자 저장 구조와 병합/마이그레이션이 필요하며 업데이트/화면 복귀 후 배치가 사라지면 안 됩니다.

## 4. UI 소스의 기준 구조

사용자가 제공한 `index.html` 예시는 독립 실행용 게임 셸로서 다음 핵심 요소 ID를 요구합니다:

```html
<nav class="mode-tabs" aria-label="미니게임 선택">
  <button class="tab-btn active" data-mode="fishing">🎣 낚시</button>
  <button class="tab-btn" data-mode="weeding">🌱 잡초뽑기</button>
  <button class="tab-btn" data-mode="foraging">🍙 음식줍기</button>
  <button class="tab-btn" data-mode="room">🏠 나의방</button>
</nav>
<div class="canvas-wrapper">
  <canvas id="wordvilleCanvas"></canvas>
  <div id="word-prompt-box" class="pastel-card">
    <span class="badge" id="game-badge">FISHING</span>
    <div class="word-target" id="target-meaning"></div>
    <div class="word-hint" id="target-hint"></div>
  </div>
  <div id="foraging-choices" class="choice-row hidden"></div>
  <div id="room-drawer" class="room-drawer hidden">
    <div class="drawer-header"><span>🛋️ 획득한 가구·소품</span><button id="btn-clear-room">초기화</button></div>
    <div id="room-item-list" class="item-scroll"></div>
  </div>
</div>
```

제안되는 별도 파일은 `css/wordville-minigames.css`, `js/wordville-engine.js`, `js/world-and-room-plus.js`입니다. **주의:** 이들은 새 구현 시의 대상 경로이지, 현재 메인 WebView에서 로드 중인 파일은 아닙니다. 기존 엔진을 사용하는 통합 경로에서는 신규 엔진 인스턴스를 중복 생성하지 마세요.

사용자 CSS 원칙:

```css
:root { --ink:#4a3b32; --cream:#fffaf0; --wood:#c89d7c; --mint:#b8e4d0; --gold:#ffd966; }
#wordvilleCanvas { display:block; width:100%; height:100%; touch-action:none; }
.mode-tabs { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
.pastel-card { position:absolute; top:12px; left:50%; transform:translateX(-50%); width:62%; }
.choice-row { position:absolute; bottom:20px; display:grid; grid-template-columns:repeat(3,1fr); }
.room-drawer { position:absolute; bottom:0; left:0; right:0; }
.hidden { display:none !important; }
```

기존 앱은 긴 세로 페이지 내 게임 패널에서 `touch-action:pan-y`를 활용합니다. 위 독립 화면의 `touch-action:none`을 그대로 기존 페이지에 넣으면 스크롤을 막을 수 있으므로 방 배치 드래그·게임 탭 입력에 한정하여 터치를 잡도록 통합해야 합니다.

## 5. 필수 판정·저장 의사 코드

```javascript
function judgeWeeding(p) {
  if (p >= .40 && p <= .60) return 'perfect';
  if (p >= .22 && p <= .78) return 'medium';
  return 'bad';
}
function isFishingCatch(pos) {
  return pos >= .68 && pos <= .86;
}
function commitSuccessfulWord(word, mode) {
  // 기존 학습 엔진에서 단 한 번만 성공 처리한 다음 보상/복습을 갱신합니다.
  // AndroidBridge가 존재할 때만 onWordLearned(String(word.id), mode) 호출.
}
function persistRoom(room) {
  localStorage.setItem('wordville_room_v1', JSON.stringify({
    unlocked: room.unlocked,
    placed: room.placed,
    theme: room.theme
  }));
}
```

현재 제공받은 `wordville-engine.js` 발췌본에는 `preloadSprites`, `loadRoomState`, `refreshHeaderUI`, `renderFishing`, `renderWeeding`, `renderForaging`, `renderRoom`, `onTapAction`, `grantReward`, `buildForagingChoices`, `renderRoomInventoryUI`와 `bindEvents`의 시작이 있습니다. 원문에 `bindEvents`의 나머지/터치 처리/`startLoop`/`world-and-room-plus.js` 구현은 포함되지 않아 **완성된 실행 소스라고 판단하면 안 됩니다.** 기존 실행 엔진은 우선 그대로 유지합니다.

## 6. 수용 조건 (검증 체크리스트)

1. 이미지 13개 원본과 대상 경로를 일대일 대조하고 PNG 헤더/파일 크기/디코딩 성공을 검증.
2. 낚시에서 이미지 누락 시 배경·캐릭터 도형이 대신 그려지지 않으며, 화면 오류 안내와 `console.error`에 실제 실패 경로 기록.
3. 고정 논리좌표 `600×1000`, DPR=1/2/3 및 360~540px 폭 기기에서 HUD/버튼 겹침 없이 동작.
4. 월드맵 네 거점 탭/뒤로가기/앱 복귀 후 동작 및 모든 모드 이동.
5. 낚시 `[.68,.86]` 판정, 제초 정확한 세 구간 경계값, 채집 정답 3프레임 순서 및 오답 복습 큐.
6. Android 콜백 성공시에만 한 번 호출, 기존 XP·코인·복습 기록 중복 지급 없음.
7. 해금 가구 6종, 4개 테마, 좌우 반전/회수/초기화 및 저장/재실행 복구.
8. 기존 전체 단어장, 다른 메뉴, 이미지 검색/첨부, 주거 및 주민 UI, 앱 설치 ID·기존 기록 보존.
9. `npm test`, 브라우저 테스트, Android Gradle/에뮬레이터 테스트, 성공 시에만 병합/배포 판단.

실제 이미지가 없는 상태에서 완성·이미지 반영·APK 빌드 성공을 선언하지 않습니다. 경로 상태는 [README_MINIGAMES.md](README_MINIGAMES.md)와 [minigames-assets.json](app/src/main/assets/images/minigames-assets.json)을 참고하세요.
