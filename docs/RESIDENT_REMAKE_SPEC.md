# Wordville 주민 리메이크 도트 화풍 및 스프라이트 제작 규격서 (`residents128`)

다른 채팅 세션이나 작업자가 새로운 주민(또는 게스트 캐릭터)을 추가·리메이크할 때 기존 리메이크 주민 12명 및 먼작귀·게스트 주민들과 **100% 동일한 그림체·해상도·접지선·애니메이션 규격**을 유지할 수 있도록 정리한 표준 문서입니다.

---

## 1. 캐릭터 도트 화풍 및 비율 규격

리메이크 주민은 캐릭터 유형에 따라 **인간형(3등신 치비)** 과 **마스코트형(원작 비율 치비)** 두 가지 세부 도트 규격을 따르며, 공통적으로 **크리스프한 픽셀 경계(Nearest-Neighbor), 이진 알파(`0` 또는 `255`), 닫힌 어두운 외곽선**을 유지합니다.

### 1-1. 인간형 주민 (기존 주민 12명 + 인간형 애니메이션 게스트 주민)
- **비율**: **3등신(`3-head-tall`) 치비 비율** (머리 높이 : 몸통+다리 높이 ≈ `1 : 2`)
- **화풍**: 16비트 코지 타운 RPG 픽셀아트 (SNES / GBA 감성, Stardew Valley 고해상도 리마스터 톤)
- **외곽선**: 어두운 갈색~검정(`#141013` ~ `#241C22`) `1~2px` 닫힌 픽셀 외곽선
- **채색**: 재질당 **3단계 셀 셰이딩**(하이라이트 / 기본색 / 그림자). 부드러운 에어브러시 그라데이션·블러·포토리얼리즘·3D 렌더링 느낌 금지
- **이목구비**: 크고 또렷한 16비트 픽셀 눈(흰색 하이라이트 포함), 명확한 헤어 실루엣과 의상 포인트(하오리, 망토, 리본, 안경 등)

### 1-2. 마스코트형 주민 (먼작귀 5종: 치이카와·하치와레·우사기·랏코·쿠리만쥬 등)
- **비율**: 원작 **1.5등신 찹쌀떡(모찌) 1덩어리 몸통 비율** (목 잘록함 없이 머리에서 몸통으로 부드럽게 이어지는 실루엣)
- **외곽선**: 균일한 **`2px` 순검정(`#080808`) 픽셀 외곽선** (끊김이나 계단 뭉개짐 없음)
- **채색**: 그라데이션 없는 **플랫한 원작 고유 단색** + 양 볼의 분홍 타원 블러셔와 **4줄 대각선 검은 빗금(`////`)**
- **체형 디테일**:
  - 귀는 머리 외곽선과 자연스럽게 이어지며 밑단이 검은 선으로 막히지 않고 열려 있음(쿠리만쥬 옆모습은 밤색 경계선 아래 작은 `⊂` 곡선 귀)
  - 짧고 통통한 팔다리가 몸통 하단에 가깝게 붙어 있음

---

## 2. Step 1 — 3방향 마스터 턴어라운드 시트 규격 (`Front / Right Side / Back`)

모션 생성 전, 모든 캐릭터는 반드시 **정면 · 우측면 · 후면 3방향 턴어라운드 마스터 시트**를 먼저 생성·검수합니다.

- **권장 캔버스 크기**: `16:9` 가로형 (`1680×936` 또는 `1672×941`)
- **배치 순서 (좌 → 우)**:
  1. **좌측**: 정면 (`Front view`, 카메라 정면 응시)
  2. **중앙**: 우측면 (`Right Side Profile`, **오른쪽(`+X`)** 을 완전히 바라보는 90도 측면)
  3. **우측**: 후면 (`Back view`, 뒤를 돌아본 모습)
- **필수 정렬 불변 조건 (Invariants)**:
  1. **동일한 수직 스케일**: 정면·측면·후면의 정수리(Top Y)와 발바닥 접지선(Bottom Baseline Y)이 한 수평선 위에 정확히 일치해야 함.
  2. **동일한 RGB 팔레트**: 측면이나 후면만 색감이 밝아지거나 탁해지지 않도록 3개 뷰의 피부색·머리색·의상색 RGB를 완전히 통일할 것.
  3. **단색 크로마키 또는 순백 배경**: 캐릭터 외부 배경은 단색(`#FFFFFF` 또는 `#FF00FF`)으로 두며, 바닥 그림자·텍스트·라벨·구분선·체커보드를 절대 그리지 않음.

### 프롬프트 템플릿 (인간형 3방향 마스터 시트)
```text
Generate a 16:9 landscape (1680x936) 2D pixel-art character turnaround sheet showing the EXACT SAME character in 3 views side-by-side from left to right on one shared horizontal foot baseline:
1. Left: Front view (facing directly toward viewer, neutral standing pose)
2. Center: Right Side Profile view (facing 90 degrees to the RIGHT, strict profile)
3. Right: Back view (facing directly away from viewer)

Style: Premium 16-bit pixel art (SNES/GBA cozy RPG style), 3-head-tall chibi proportions, crisp chunky pixel clusters, clean dark 1-2px outline, 3-tone cel shading, identical color palette and exact same head/body/foot vertical alignment across all 3 views.
Character Identity: [캐릭터 외형·헤어·의상·소품 상세 묘사]
Constraints: Solid flat background only. NO ground shadow, NO text, NO labels, NO grid lines, NO boxes.
```

### 프롬프트 템플릿 (마스코트형 3방향 마스터 시트)
```text
Generate a 16:9 landscape (1680x936) 2D pixel-art character turnaround sheet of [캐릭터명] in 3 views side-by-side from left to right on one shared horizontal foot baseline:
1. Left: Front view
2. Center: Right Side Profile view (facing RIGHT)
3. Right: Back view

Style: Crisp 2D pixel-art translation of the official 2D illustration. Uniform 2-pixel black pixel outline (#080808), flat solid colors with NO shading gradients, 1-piece round mochi body without neck constriction, pink oval cheek blushes with 4 diagonal dark hash lines, short stubby arms and legs close together at the bottom. Identical RGB colors and exact vertical top/bottom alignment across all 3 views.
Constraints: Solid flat background only. NO ground shadow, NO text, NO labels, NO grid lines.
```

---

## 3. Step 2 — 게임 런타임 스프라이트 아틀라스 규격 (`residents128/<id>/`)

게임 엔진(`app/src/main/assets/resident128-loader.js`)이 읽어들여 렌더링하는 최종 에셋 규격입니다.

### 3-1. 폴더 및 파일 구조
```text
app/src/main/assets/residents128/<id>/
 ├── walk.png   (1536 × 1024 px, PNG8)
 ├── idle.png   (1536 × 1024 px, PNG8)
 ├── talk.png   (1536 × 1024 px, PNG8)
 └── sit.png    (1536 × 1024 px, PNG8)
```

### 3-2. 아틀라스 격자 및 셀 내 좌표 규격
| 항목 | 규격 값 | 설명 |
|---|---|---|
| **전체 이미지 해상도** | **`1536 × 1024` px** | `12열(Columns) × 8행(Rows)` |
| **단일 셀(Cell) 크기** | **`128 × 128` px** | `cell = 128`, `frameCount = 12` |
| **수평 중심축 (`anchorX`)** | **`x = 64` px** | 각 `128×128` 셀의 가로 정중앙 (`cell / 2`) |
| **발바닥 접지선 (`groundY`)** | **`y = 120` px** | 캐릭터 발바닥 최하단이 셀 내부 `y = 119~120`에 위치 (하단 8px 여백) |
| **캐릭터 본체 높이** | 인간형 **`96 ~ 104` px**<br>마스코트형 **`76 ~ 88` px** | 정수리부터 발바닥(`y=120`)까지의 픽셀 높이 |
| **PNG 포맷** | **8-bit Indexed PNG (`PNG8`)** | 투명 배경(`alpha = 0`), 캐릭터 내부 불투명(`alpha = 255`), 반투명/크로마키 잔여 픽셀 0개 |

### 3-3. 8방향 행(Row) 순서 (`directions` 인덱스 0 ~ 7)
`resident128-loader.js`의 `directions` 배열 순서와 정확히 일치해야 합니다:

| Row Index | Y 좌표 범위 | 방향 키 (`direction`) | 설명 및 소스 뷰 매핑 |
|---|---|---|---|
| **Row 0** | `y = 0 .. 127` | `down` | **정면 (남쪽)** — 마스터 정면(`Front`) 기반 |
| **Row 1** | `y = 128 .. 255` | `down-right` | **남동쪽 대각선** — 정면 또는 우측면 기반 |
| **Row 2** | `y = 256 .. 383` | `right` | **우측면 (동쪽)** — 마스터 우측면(`Right Side`) 기반 |
| **Row 3** | `y = 384 .. 511` | `up-right` | **북동쪽 대각선** — 후면 또는 우측면 기반 |
| **Row 4** | `y = 512 .. 639` | `up` | **후면 (북쪽)** — 마스터 후면(`Back`) 기반 |
| **Row 5** | `y = 640 .. 767` | `up-left` | **북서쪽 대각선** — Row 3(`up-right`)을 셀 중심(`x=64`) 기준 좌우 반전 |
| **Row 6** | `y = 768 .. 895` | `left` | **좌측면 (서쪽)** — Row 2(`right`)를 셀 중심(`x=64`) 기준 좌우 반전 |
| **Row 7** | `y = 896 .. 1023` | `down-left` | **남서쪽 대각선** — Row 1(`down-right`)을 셀 중심(`x=64`) 기준 좌우 반전 |

> **참고**: 좌우 비대칭 요소(예: 랏코의 오른쪽 이마 십자 흉터 및 등 뒤 검 손잡이)가 있는 캐릭터도 런타임 표준은 셀 중심(`x=64`) 좌우 반전을 기본으로 하되, 필요 시 비대칭 디테일만 방향에 맞게 보정할 수 있습니다.

### 3-4. 4종 액션(`walk`, `idle`, `talk`, `sit`) 12프레임 구성 규격
모든 시트는 가로 12프레임(`Column 0 .. 11`)을 가지며, `resident128-loader.js`에서 아래 주기로 재생됩니다:

1. **`walk.png` (보행 루프 — 이동 거리 기반 또는 `83ms/frame`)**
   - **Frame 0 ~ 5 (첫 반주기)**: 왼발(측면에서는 앞쪽 `NEAR` 발) 내딛기(`Contact` → `Down` → `Passing` → `Up`) 및 반대쪽 팔 스윙
   - **Frame 6 ~ 11 (두 번째 반주기)**: 오른발(측면에서는 뒤쪽 `FAR` 발) 내딛기(`Contact` → `Down` → `Passing` → `Up`) 및 팔 스윙 교차
   - 8프레임 보행 시트로 생성한 경우, 12프레임에 균등 위상 매핑(`[0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7]` 또는 12프레임 원시 생성)하여 끊김 없는 루프를 구성합니다.
2. **`idle.png` (대기 루프 — `200ms/frame`, 12프레임 총 `2.4초` 주기)**
   - Frame 0에서 정지 기본 자세로 시작해 상체/머리가 `1~2px` 부드럽게 숨쉬듯 오르내리고, 중간 프레임에서 자연스러운 눈 깜빡임 또는 머리카락/귀 미세 흔들림 후 Frame 11에서 기본 자세로 복귀.
3. **`talk.png` (대화 루프 — `110ms/frame`, 12프레임 총 `1.32초` 주기)**
   - 정지 자세 기반에서 입이 열렸다 닫히는 대화 모션 + 가벼운 고개 끄덕임이나 짧은 손짓/몸통 리듬 포함.
4. **`sit.png` (착석 전환 및 유지 — `100ms/frame`, Frame 11에서 홀드)**
   - Frame 0(서 있는 자세) → 중간 프레임(무릎을 굽혀 앉는 전환) → **Frame 11(완전히 앉은 자세)**.
   - `resident128-loader.js`는 `sit` 상태에서 `Math.min(11, elapsedFrames)`로 재생하여 마지막 **Frame 11을 계속 유지**하므로, Frame 11이 안정적인 최종 착석 포즈여야 합니다.

---

## 4. Step 3 — 모션 생성 파이프라인 (2가지 방식)

### 방식 A: `agent-sprite-forge` 이미지 시트 + 결정론적 후처리 파이프라인
영상 모델 없이 마스터 도트의 선명도와 팔레트를 그대로 유지하며 보행 시트를 생성하는 방식입니다.
1. **앵커 템플릿 생성 (`make_anchor_layout.py`)**:
   ```bash
   python skills/generate2dsprite/scripts/make_anchor_layout.py \
     --input <char>_side.png --rows 2 --cols 4 \
     --cell-width 384 --cell-height 512 --resampler nearest \
     --output <char>_side_anchor_2x4.png
   ```
2. **8프레임 보행 시트 생성 (`image_gen`)**:
   - 참조 이미지 1: `<char>_side.png` (마스터 도트)
   - 참조 이미지 2: `<char>_side_anchor_2x4.png` (스케일 및 접지선 고정 템플릿)
   - 프롬프트에 `NEAR/FAR` 다리 교차 8위상(`Contact, Down, Passing, Up × 2`)과 `#FF00FF` 마젠타 단색 배경을 명시.
3. **루트·접지선 정렬 및 `128×128` 스케일링 (`scale_frames.py`)**:
   ```bash
   python skills/generate2dsprite/scripts/scale_frames.py \
     --sheet <char>_walk_raw.png --rows 2 --cols 4 --key magenta \
     --scale-from 1/4 --resampler nearest \
     --root-lock torso-x --row-baseline \
     --canvas 128,128 --anchor-px 64,120 \
     --emit-clips --clip-name walk --ticks 6 \
     --output-dir <char>_scaled
   ```
4. **OKLab 시계열 팔레트 고정 (`palette_tool.py`)**:
   ```bash
   python skills/generate2dsprite/scripts/palette_tool.py build \
     --input <char>_scaled/frames --colors 24 --output-dir <char>_palette
   python skills/generate2dsprite/scripts/palette_tool.py quantize-seq \
     --input <char>_scaled/frames --palette <char>_palette/palette.json \
     --loop-policy cycle --output-dir <char>_quantized
   ```

### 방식 B: Flow 영상 생성 후 프레임 추출 파이프라인
1. 3방향 마스터 시트를 `#00FF00` 그린스크린 배경 입력 이미지로 변환.
2. Flow에서 정면·측면·후면 보행 루프 영상을 생성 후 12프레임 균등 샘플링.
3. HSV 크로마키 분리 + 그린 스필(Green spill) 제거 + 바운딩 박스 기준 `128×128` 캔버스(`anchorX = 64`, `groundY = 120`) 최근접(`NEAREST`) 정렬 및 PNG8 양자화.

---

## 5. Step 4 — 게임 연동 및 테스트 체크리스트

1. **에셋 배치**:
   - `app/src/main/assets/residents128/<id>/{walk,idle,talk,sit}.png` 4개 파일이 모두 `1536×1024` 해상도인지 확인합니다.
2. **로더 등록 (`app/src/main/assets/resident128-loader.js`)**:
   - `resident128-loader.js` 상단의 `ids` 배열에 새 주민 `<id>`를 추가합니다:
     ```javascript
     const ids = [
       'alex','elliott','harvey','sam','sebastian','shane',
       'haley','leah','maru','penny','abigail','emily',
       // 신규 리메이크 주민 ID 추가
     ];
     ```
3. **장소/타운 내 렌더링 스케일 참고 (`venue-runtime.js` & `village.js`)**:
   - 메인 타운(`town-v2`): 기본 `64×64` 논리 크기(`128×128` 원본의 정수 1/2 다운스케일)로 선명하게 렌더링됩니다.
   - 18개 장소(`venues-v2`, `1024×840` 5:4 캔버스): 방 크기(`cols`)에 비례하여 `roomRatio = s.cols <= 16 ? 0.20 : (s.cols <= 24 ? 0.18 : 0.15)`로 자동 스케일링됩니다.
4. **자동화 테스트 실행**:
   ```bash
   npm test
   node tests/browser.cjs
   ```
   모든 단위 테스트와 헤드리스 브라우저 렌더링 검증(`PASS`)을 확인한 뒤 커밋합니다. (`art-source/` 등 대용량 임시 작업 폴더는 Git에 커밋하지 않습니다.)
