# 계약 복사본 출처

- 원본: `KNU-AWS-ILT/ArchiMate-Backend` 의 `contracts/`
- 복사 기준: 브랜치 `feat/#2-ai-generation-pipeline` (백엔드 PR #45의 헤드, `main` 머지 전), 커밋 `071ecb5`
- 복사한 날: 2026-11-24
- 기준 변경: 이 브랜치에는 사용자별 하루 생성 횟수 제한(백엔드 PR #53, `POST /designs`의 `429 RATE_LIMITED`, `retryable: false`)이 아직 없다. 프론트는 이 응답을 미리 처리한다.
- 백엔드 `main`에 `contracts/`가 머지되면 그 내용으로 다시 복사하고 이 파일을 갱신한다. (`[contract]` PR 알림 기준)
- 이 폴더의 파일은 직접 고치지 않는다. 모양을 바꾸고 싶으면 백엔드에 요청한다.
