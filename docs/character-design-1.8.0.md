# Wordville 1.8.0 캐릭터 디자인

사용자가 제공한 도트 캐릭터 이미지를 스타일 참고로, 주민 12명의 초상화와 전신 도트 이미지를 제작했습니다. 남자 주민 6명은 추가 요청에 따라 머리 길이·형태·의상·액세서리를 다르게 수정했습니다.

| 주민 | 머리와 의상 |
| --- | --- |
| 알렉스 | 짧은 스포츠컷, 초록 운동복 |
| 엘리엇 | 낮게 묶은 붉은 장발, 멜빵 셔츠 |
| 하비 | 단정한 가르마, 콧수염·둥근 안경, 의사 가운 |
| 샘 | 높이 세운 금발, 헤드폰, 노랑·파랑 재킷 |
| 세바스찬 | 비대칭 긴 앞머리·은색 옆머리, 검은 긴 코트 |
| 셰인 | 뒤로 넘긴 짧은 머리·수염, 데님 작업복 |
| 헤일리 | 긴 금발 웨이브, 꽃 장식·분홍 블라우스 |
| 레아 | 붉은 땋은 머리, 초록 작업 앞치마 |
| 마루 | 갈색 단발·둥근 안경, 보라색 멜빵바지 |
| 페니 | 구릿빛 단발, 베이지 리본 블라우스 |
| 애비게일 | 보라색 단발, 라일락 니트 |
| 에밀리 | 파란 짧은 웨이브, 붉은 블라우스·청록 귀걸이 |

## 앱 적용

- 주민 도감 12명: 초상화·이름·디자인 설명, 선택 시 대화창 연결.
- 광장 대화창, 집 주인 소개, 시설 내 대화 참가자 초상화.
- 광장·생활 지도·시설 실내의 전신 캐릭터 이미지.
- 전신 그림은 투명 배경이며 발밑 기준점을 유지하고 이동 방향에 따라 좌우를 바꿉니다. 이동에는 작은 상하 크기 변화가 있으며 별도로 그린 4방향 보행 프레임은 아닙니다.
- 이미지 파일: app/src/main/assets/art/resident-portraits.webp, resident-sprites.webp.
- 두 파일은 1448×1086, 4열×3행의 정규 이미지 묶음입니다. 앱에서 영역을 나눠 사용하며 원본 디자인을 다른 주민과 혼용하지 않습니다.
- 원본 생성 후 WebP 형식으로 압축했습니다. 게임 코드에는 외부 이미지 서버 주소나 생성 서비스 인증키가 없습니다.

## 제작 지시 요약

기본 이미지 생성으로 제작했으며 CLI/API 키 경로는 사용하지 않았습니다. 첨부한 스타일 참고 이미지에서 선명한 사각 픽셀, 풍부한 머리카락 표현, 큰 눈, 크림·보라·세이지 계열 색채를 참고했습니다.

초상화 지시: Exactly 12 centered adult head-and-shoulder pixel-art portraits in a precise 4-column by 3-row regular grid, consistent scale, plain warm ivory background, no labels, no borders, no text. Distinct identities and silhouettes. Male redesign: short sports cut / low auburn ponytail / neat side part with moustache and round glasses / high golden quiff with headphones / raven asymmetric fringe with silver underlayer / brushed-back undercut with stubble. Preserve female identities.

전신 지시: Match the revised portrait identities and clothing in a precise transparent 4-column by 3-row atlas, complete adult full-body standing figures, consistent scale and foot baseline, no floor/shadow/text/checker pattern. Keep each figure in its cell. Preserve all six female designs while updating the six male silhouettes and outfits.

## 어원 기능 유지

이 버전은 Oxford 공식 출처를 참고한 어원 요약 18개와 전체 단어 Oxford 검색 링크를 함께 포함합니다. 5,620개 전체 어원 자동 조회는 연동되지 않았습니다.
