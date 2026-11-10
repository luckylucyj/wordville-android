# Wordville 1.7.0 Oxford 참고 어원 표시

## 현재 범위

전체 5,620개 단어 카드에 어원 영역을 추가했습니다. 그중 18개 단어는 Oxford Advanced Learner’s Dictionary의 Word Origin에 나온 역사적 사실을 참고해 한국어 학습 요약과 유래 흐름을 표시합니다. 나머지 5,602개에는 어원 요약 미확인 표시와 Oxford 검색 링크를 제공합니다. 확인하지 않은 단어에 어원을 추정해 표시하거나, 복수형·파생어·숙어에 다른 표제어의 어원을 자동 대입하지 않습니다.

Oxford Dictionaries API 전체 조회는 연결하지 않았습니다. 공식 조회에는 app_id와 app_key가 필요합니다. API 데이터의 오프라인 저장은 별도 이용 조건을 확인해야 합니다. 이 릴리스는 API 데이터를 내려받은 사전이 아니며, 출처를 참고한 소규모 한국어 학습 요약입니다. Oxford의 공식 번역이나 제휴 제품으로 표시하지 않습니다.

- API 안내: https://developer.oxforddictionaries.com/documentation/making-requests-to-the-api
- FAQ: https://developer.oxforddictionaries.com/faq
- 확인일: 2026-11-10

## 표시 방식

단어 카드 → 단어 어원 · Oxford 참고를 펼치세요. 요약은 기기에서 읽을 수 있고 원문·검색 링크는 외부 브라우저로 열립니다. 원문 사이트의 이용 가능 여부나 Word Origin 존재 여부는 표제어에 따라 다를 수 있습니다. 앱은 Oxford 페이지를 내부에 복사하거나 자동 수집하지 않습니다.

## 확인된 단어

| 단어 | 공식 출처 |
| --- | --- |
| attend | https://www.oxfordlearnersdictionaries.com/definition/english/attend |
| application | https://www.oxfordlearnersdictionaries.com/definition/english/application |
| appointment | https://www.oxfordlearnersdictionaries.com/definition/english/appointment |
| schedule | https://www.oxfordlearnersdictionaries.com/definition/english/schedule_1 |
| equipment | https://www.oxfordlearnersdictionaries.com/us/definition/english/equipment |
| available | https://www.oxfordlearnersdictionaries.com/us/definition/english/available |
| purchase | https://www.oxfordlearnersdictionaries.com/definition/english/purchase_2 |
| maintenance | https://www.oxfordlearnersdictionaries.com/definition/english/maintenance |
| reservation | https://www.oxfordlearnersdictionaries.com/definition/english/reservation |
| ship | https://www.oxfordlearnersdictionaries.com/definition/english/ship_1 |
| apply | https://www.oxfordlearnersdictionaries.com/definition/english/apply |
| reserve | https://www.oxfordlearnersdictionaries.com/definition/english/reserve_2 |
| applicant | https://www.oxfordlearnersdictionaries.com/us/definition/english/applicant |
| apparatus | https://www.oxfordlearnersdictionaries.com/definition/english/apparatus |
| make | https://www.oxfordlearnersdictionaries.com/us/definition/english/make_1 |
| valid | https://www.oxfordlearnersdictionaries.com/us/definition/english/valid |
| registration | https://www.oxfordlearnersdictionaries.com/definition/english/registration |
| submission | https://www.oxfordlearnersdictionaries.co.uk/definition/english/submission |

## 검증 계획 및 상태

- 로직 검사 25개 및 집·시설·생활·어원 DOM 검사 로컬 통과.
- 카드 전환 시 이전 어원이 남지 않음, 미확인 단어 상태, URL 안전성, 단어와 출처 매칭 검사 포함.
- Android 외부 링크는 명시된 Oxford HTTPS 호스트·사전/검색 경로만 브라우저로 전달합니다.
- 모바일 브라우저와 Android 가상기기 결과는 빌드 보고서에 기록합니다.
