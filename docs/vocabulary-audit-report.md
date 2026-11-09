# Wordville 단어 검수 결과 · 1.2.1 수정 소스

기존 카드 5,622개의 영문·한국어 뜻 텍스트를 직접 검토하고, 확인한 오류와 반복 표기를 수정했습니다. 최종 데이터는 5,620개 카드입니다.

## 적용 내역

| 구분 | 결과 |
|---|---|
| 명시적으로 지정한 뜻 수정 | 기존 433항목 |
| 철자·띄어쓰기·대문자 표기 수정 | 기존 73항목 |
| 중복 카드 병합 | effect / inform / representative 3쌍 |
| 잘못 합쳐진 단어 분리 | fair에서 fall 분리, PDF 164쪽 연결 수정 |
| 기존 카드 식별자 보존 | 기존 5,622개 ID를 대표 ID 또는 별칭으로 모두 유지 |
| 숫자 복구 예 | decade 10년 / fortnight 2주간 / overnight stay 1박 |

쉼표·세미콜론·마침표로 나뉜 뜻을 정리하고, 괄호 내부의 설명을 유지했습니다. 같은 카드 안에서 공백과 범용 목적격 표지 차이만 있는 동일 뜻을 한 번만 표시합니다. 유의어와 서로 다른 용법은 함께 남깁니다.

## 실제 검토 범위

| 방법 | 범위 |
|---|---|
| 전체 텍스트 직접 검토 | 기존 카드 5,622개 |
| 수정 후보 원본 이미지 대조 | 435개 크롭 |
| 별도 OCR 영문 불일치 원본 대조 | 27개 크롭 |
| 추가 개별 원본 이미지 확인 | set down to work, practitioner, hit the store, owed, rewarding, momentum, consolidate 등 |
| 원본 재문자인식 | 관련 PDF 416쪽 |

전체 원본 이미지의 모든 단어와 모든 뜻을 하나씩 수동 대조한 완료본은 아닙니다. 전체 텍스트 검토, 의심 항목 이미지 대조, 자동 검사를 구분해 기록했습니다. 따라서 오류가 절대 없다는 보증이나 전 원본 수동 검수 완료 판정을 하지 않습니다.

## 검증 결과

- 자동 테스트 14개 통과, 실패 0개.
- 중복 단어·ID, 중복 뜻, 깨진 문자, 품사 기호 잔재, 괄호 불일치에 대한 설정된 검사 통과.
- 모바일 화면에서 검색·Day 필터·60개 페이지 이동·20/40/전체 복습·이미지 저장/삭제/재실행·학습 기록 유지 검사 통과.
- 병합 전 ID로 저장된 이미지와 복습 기록을 찾는 검사 통과. 클라우드 별칭 조회와 계정 간 이미지 분리는 실제 사용자 계정 변경 없이 가짜 응답을 사용하는 테스트로 검증했습니다. 실제 서버 데이터는 변경하지 않았습니다.
- 기존 20개 기본 단어 ID 유지 확인. 기존 학습 기록은 변환 전에 기기에 백업하고, 옛 기록과 개념 기록을 삭제하지 않습니다.

## 제공 파일과 빌드 상태

`wordville-vocabulary-reviewed.json`은 수정 단어 데이터입니다. `wordville-1.2.1-source.zip`은 수정 코드·전체 단어 데이터·변경 내역·검수 기록을 포함합니다. 상세 변경은 ZIP의 `docs/vocabulary-audit-changes.json`, 검수 범위는 `docs/vocabulary-audit.json`에 있습니다.

사용자의 빌드 진행 승인에 따라 이 수정본을 GitHub Actions에서 빌드합니다. 실제 빌드·Android 테스트 결과는 별도의 빌드 기록으로 제공합니다.

## 원문과 다른 표준 표현을 적용한 항목

| 항목 | 적용 | 근거 |
|---|---|---|
| set down to work | get down to work | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/get-down-to) |
| hit the store | hit the stores | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/hit_1) |
| practitioner | 의사; 전문직 종사자 | [Cambridge](https://dictionary.cambridge.org/dictionary/english/practitioner) |
| rewarding | 보람 있는; 가치 있는; 보상이 되는 | [Oxford](https://www.oxfordlearnersdictionaries.com/us/definition/english/rewarding) |
| momentum | 추진력; 기세 | [Cambridge](https://dictionary.cambridge.org/us/dictionary/english/momentum) |
| take a message | 다른 사람에게 전할 메시지를 받아 적다 | [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/message_1) |

원문의 인쇄 표현을 옮긴 것과 사전 근거로 편집한 것을 구분했습니다. 새 단어 예문은 생성하지 않았습니다.
