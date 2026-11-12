# Wordville Village 1.2

Android에서 실행되는 영어 학습 앱입니다. WebView 내부에서 HTML·JavaScript·Canvas로 픽셀 마을을 그립니다. Unity 프로젝트는 아닙니다.

## 마을과 학습

- 첨부 레퍼런스의 석조 건물·가로수·광장·카페·중앙 탑 구성을 참고한 자체 Canvas 픽셀 그래픽
- 주민 12명: 알렉스, 엘리엇, 하비, 샘, 세바스찬, 셰인, 헤일리, 레아, 마루, 페니, 애비게일, 에밀리
- 연결된 산책로 위 이동, 가까이 만난 주민끼리 대화, 대화 기록, 주민 선택 후 연관 단어 학습
- 기기의 현재 시간으로 낮(06–18시)·저녁(18–20시)·밤(20–06시) 전환. 일출·일몰 관측값은 사용하지 않습니다.
- 낮·밤 미리보기, 확대·축소, 주민 움직임 일시 정지
- 앱을 연 동안만 시뮬레이션이 실행됩니다. 오프라인에서도 마을은 동작합니다.
- 단어·표현 카드 5,622개, Day·검색 필터·복습·개념 조합. 기존 20개 단어의 예문을 유지합니다. Word Card 뜻 보기/숨기기는 반복 토글입니다.
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

## 1.2 단어장 확장

- 업로드한 PDF에서 6,251항목을 추출하고 중복을 합쳐 5,620개 단어·표현 카드로 구성했습니다. 이디엄 120개를 포함합니다.
- Day 01–30 / 이디엄 분류, 영문·뜻 검색, 한 화면 60개와 이전·다음 이동을 지원합니다.
- 복습은 선택한 Day와 검색 결과 중 복습할 시간이 된 단어에서 20개·40개·전체를 선택합니다. 단어 카드에 원본 PDF 쪽수를 표시합니다.
- 기존 20개 단어 ID, localStorage 키와 IndexedDB 이름을 유지합니다. 기존 배포 APK의 서명 키를 복구할 수 없어 applicationId를 `com.wordville.app.village.vocabulary.reviewed`로 분리했습니다. ‘Wordville 검수 단어장’으로 기존 앱과 함께 설치되며, 이전 앱과 데이터는 유지됩니다. 기존 앱에서 학습 기록 서버 저장·이미지 서버 복사 후, 새 앱에서 같은 계정으로 로그인하고 서버 학습 기록 불러오기를 선택합니다. 이 과정은 사용자가 직접 선택하며 자동 전송하지 않습니다.
- PDF 원본과 스캔 이미지는 APK에 포함하지 않습니다. 새 단어의 예문은 생성하지 않았으며, 기존 예문은 유지합니다.
- OCR 결과에는 잔여 오독이나 누락이 있을 수 있습니다. 책 전체 7,600여 표현을 모두 수록했다는 뜻은 아닙니다. 5,622개 기존 카드 텍스트를 직접 검토하고, 수정 후보 원본 435개 크롭 및 영문 불일치 후보 27개 크롭을 확인했습니다. 전체 원본 이미지의 수동 대조 완료나 절대 무오류를 뜻하지 않습니다. 추출 통계는 `docs/vocabulary-import.json`에 있습니다.

## 1.2.1 단어 검수

- 명시적 뜻 수정 433항목, 철자·표기 수정 73항목. 쉼표·마침표·중복 뜻도 정리했습니다. 변경 내역은 `docs/vocabulary-audit-changes.json`, 검수 범위는 `docs/vocabulary-audit.json`에 있습니다.
- effect / inform / representative 중복 카드의 옛 ID를 별칭으로 보존합니다. 기존 복습 기록과 개념 기록을 삭제하지 않으며, 옛 ID로 저장한 이미지도 찾습니다. 학습 기록 변환 전 기기 백업을 남깁니다.
- fair에 섞인 PDF 164쪽의 fall을 분리했습니다. fair의 실제 Day 9 / PDF 166쪽 연결은 유지합니다.
- 재현: `git show 080d91c:app/src/main/assets/words.json > /tmp/wordville-before-audit.json` 후 `python3 scripts/vocabulary-audit/apply.py /tmp/wordville-before-audit.json`.

## 검수 APK 서명과 설치

1.2.0 빌드의 서명 캐시 경로에 키 파일이 존재하지 않아 서명 키를 복구할 수 없었습니다. 1.2.1 검수 APK는 `com.wordville.app.village.vocabulary.reviewed` / “Wordville 검수 단어장”으로 별도 설치되며 이전 앱과 그 기록을 유지합니다. 새 빌드는 명시적인 키 경로를 사용하며, 키 캐시와 공개키로 암호화한 복구용 백업을 생성합니다. 개인키와 복호화된 서명 키는 저장소에 포함하지 않습니다. 로컬 빌드에는 `WORDVILLE_KEYSTORE`에 해당 키 파일 경로를 지정합니다.

## v1.9.0 원본 참고 이미지 직접 적용
- 기존 도형 배경 대신 사용자가 제공한 참고 이미지의 리사이즈 WebP를 앱 로컬 assets에 포함했습니다. 다운로드 없이 오프라인에서 표시됩니다.
- 전체 지도에 원본 마을 한 장을 사용하고, 17개 장소 화면은 제공된 8개 장소 이미지와 마을 장면에서 개별 크롭했습니다. 각 장소 이미지 해상도 640×525, 맵 이미지 840×1120입니다.
- 같은 원본 이미지가 여러 장소에 사용됩니다. 체육관·의료시설·아이스크림 등 정확한 기능별 외관이 원본에 없으므로 개별 장면의 1:1 시각적 일치를 보장하지 않습니다.
- 맵은 화면 크기에 맞춰 원본 이미지 비율을 유지하여 표시합니다. 주민 12명의 별도 걷기 애니메이션, 대화, 학습 데이터는 유지됩니다.


## Wordville v2.0.0 — 12 residents at original resolution and fountain-safe stairs
- Portrait source is the provided 1536×1152 PNG, copied without any resizing or recompression; every resident has a 384×384 source region, instead of the old 80×80 source.
- Walking/standing sprites come from the user's 1536×1152 scene sheet. Original figures were cropped at native resolution, the cream card background masked, and the resulting 1312×756 RGBA atlas compressed **losslessly** as WebP. Pixel content of surviving characters is unchanged.
- Animation reuses these two supplied poses, adds a small timed stride, gentle sway, and stair-specific bob/lean. Additional truly drawn leg-direction frames were not present in the reference source; this procedural movement is not a claim of pixel-for-pixel new pose reproduction.
- The new connected 19-node sidewalk graph avoids an ellipse around the central fountain including safety margin, and the entrance steps have explicit stair edges and step motion. A deterministic simulation test checks 6000 ticks for fountain collisions.
- The exact original visual detail is preserved as file data; a mobile screen renders portraits smaller than their original 384×384 source dimensions. Portraits are downsampled smoothly for display rather than magnified from 80×80 pixels.
- Existing install package ID, signing identity, Wordville words, and local study history remain unchanged.

## v2.0.1 걷기 이미지 품질 재검수
- 기존 v2.0.0 1312×756 WebP 아틀라스에서 일부 옷/팔이 투명하게 뚫려 보이는 부분을 확인했습니다.
- 손실 없는 PNG 2560×768 아틀라스를 새로 적용했습니다. 주민 12명 각각 160×256 크기의 프레임 4개(원본 서기, 원본 걷기, 서기 변형, 걷기 변형)로 구성합니다. 원본 서기·걷기 픽셀은 마스킹된 앞쪽 부분을 제외하면 원본 색상을 유지합니다.
- 원본 초상화 PNG SHA-256: 0e70bab534788338dbc7e454a88205adb6019a3c39a7f212eba11ee073254219 (사용자가 보내주신 파일과 일치).
- 원본과 픽셀 단위로 같은 것은 초상화 원본 파일입니다. 작은 스마트폰 화면은 화소 수와 크기 때문에 원본 수준을 항상 그대로 표시할 수는 없으며, 새 포즈 2개는 기존 이미지에서 파생한 동작입니다.

## v2.1.0 실내 이동·주민 애니메이션 복구 (2026-11-11)

- 앱에 이미 포함된 `portraits/wordville-walk-4phase.png`(2560×768)을 실내 및 마을 캐릭터 렌더링에 직접 연결했습니다. 이전의 실제로 없는 `walk/<이름>.png` 요청은 제거했습니다.
- 원본 스프라이트는 주민별 4개 자세입니다. 8개의 재생 단계는 기존 4자세를 앞뒤로 배치한 것입니다. 위/아래 방향의 고유 원본 이미지가 별도 제공된 것은 아닙니다.
- 장소 17개별 타일 기반 실내 이동, 가구·벽 회피, NPC 간 이격, 터치·방향키 이동 및 '충돌 영역' 검사용 표시를 보강했습니다. 가구를 누르면 가장 가까운 접근 가능한 타일로 이동합니다.
- 수영장·햄버거 가게·서점에는 포함된 오프라인 WebP 배경을 유지합니다. **원본 참고 이미지 속 모든 가구 위치와 작성된 충돌 타일의 정확한 일치까지 검증하거나 보장하지 않습니다.** '충돌 영역' 버튼으로 현재 충돌 위치를 직접 확인할 수 있습니다.
- `npm test`에 17개 장소의 충돌·경로, 실사용 아틀라스 존재 여부 검사를 추가하고 Android 에뮬레이터 검사에도 주민 애니메이션 및 실내 이동 경로를 추가했습니다.
- 기존 설치 패키지 ID 및 서명 키 설정은 변경하지 않고 Android 버전 코드만 10으로 올렸습니다. 실제 갤럭시 기기의 모든 환경에서 설치·동작이 확인된 것은 아닙니다.

## v2.2.1 실내 출입구·배경 좌표 보완 (2026-11-12)
- 장소 화면에 **마을로 나가기** 버튼을 추가했습니다. 선택한 주민이 실제 출입구 타일로 걸어가 도착한 뒤 마을 탭으로 돌아갑니다. 도착 전 화면 전환이 발생하지 않도록 브라우저 회귀 테스트를 추가했습니다.
- 참고 배경 이미지 로딩 실패 시 나오는 대체 그림의 분수대 좌표·크기를 주민 경로에서 사용하는 충돌 영역과 일치시켰습니다. 자동 테스트로 두 값이 일치하는지 확인합니다.
- 버전 코드 12, 버전명 2.2.1. 설치 식별자와 서명 설정은 기존 값을 유지하며 학습 기록은 초기화하지 않습니다.
- 독립된 걷기 원본 포즈는 각 방향당 3개이며 4비트 재생 순서로 표시합니다. 원본 6~8개 독립 포즈나 제공된 모든 실내 이미지의 가구 좌표 완전 일치는 아직 보증하지 않습니다.
