# 프론트엔드 필요 데이터 기록 (API 호출 대비)
작성 기준: `ArchiMate-Frontend/prototype/app.js`의 목 데이터 (2026-11-19)
최근 갱신: 2026-11-24 (프로토타입 3안 선택·비교와 목 데이터 교체 반영)
용도: 프로토타입이 목 데이터로 처리하는 값을 정리해, API 연동과 타입 정의의 기준으로 쓴다.

## 이 문서의 상태
- 백엔드 답변으로 API 명세 대부분이 정해졌다. 모양의 원본은 `ArchiMate-Backend/contracts/`(스키마, 예시)이고, 백엔드 PR #17이 머지되면 `contracts/openapi.json`이 추가된다.
- A~D 파일(`A-interview-questions.md` 등)을 정해진 내용으로 갱신했다. 이 문서의 5번(차이 기록)과 A~D가 어긋나면 백엔드 `contracts/`를 먼저 확인한다.
- 백엔드 Issue 원본에는 "두 백엔드 파트 합의 전"이라는 표시가 남아 있다. 답변은 백엔드(AI 생성)와 백엔드(API·비용)가 각각 낸 것이다.
- 프로토타입에 화면이 추가되거나 바뀌면 이 문서를 같이 갱신한다. 갱신 날짜를 위 "최근 갱신"에 적는다.

## 1. 프로토타입 목 데이터와 API 대응표
| 프로토타입 변수 | 내용 | 실제 출처 | 비고 |
| --- | --- | --- | --- |
| `TYPES` | 서비스 종류별 이름, 분류, 아이콘, 기본 역할 설명 | 서비스 종류는 `serviceType`(21종), 설명은 설계 응답의 `nodes[].role`·`reason`과 D | 프로토타입은 21종 키를 계약 값(`api_gateway` 등)과 같게 썼다. 월 비용은 프론트가 만들지 않고 `monthlyCost`만 표시한다. |
| `CAT`, `ICON` | 분류 색상, 아이콘 | 프론트엔드 자체 자산 | API에서 받지 않는다. `serviceType`으로 매핑한다. |
| `raw` / `nodes` | 노드 id, 서비스 종류 | 설계 응답의 `architecture.nodes` | **좌표는 서버가 주지 않는다.** 프론트가 그룹 구조로 자동 배치한다. (확정) 프로토타입은 `prototype/app.js`의 `layoutArchitecture()`로 배치한다. (x: 사용자에서 시작하는 흐름 순서, y: 리전·VPC·서브넷 띠) |
| `edges` | 노드 간 연결 | `architecture.edges` (`from`, `to`, `label`) | |
| `groups` | 노드 묶음 | `architecture.groups` (`id`, `kind`, `label`, `parentId`) | VPC·서브넷은 노드가 아니라 `kind`로 표현 |
| `GUIDE` | 단계별 절차(제목, 설명, 할 일, 콘솔 경로, 경고, 연결 노드) | 운영 절차 (B의 `operationsGuide` 또는 C) | `cli`는 없고 `consolePath`가 있다. 안마다 `phases[]`(탭)와 `checklists[]`(비용·장애 대응)가 다르다. |
| `state.done` | 완료 체크한 절차 id | 브라우저 `localStorage` | 키는 `guide:{designId}:{stepId}` (확정) |
| 스택 목록, 채팅 응답, Deploy | 프로토타입 전용 | 없음 | 범위 제외. 아래 3번 참고 |

## 2. 필요한 API 목록 (프론트엔드 관점)
| # | 용도 | 엔드포인트 | 결정 내용 |
| --- | --- | --- | --- |
| A | 인터뷰 질문 | 없음 | **API 없이 프론트 상수.** 질문 7개 + 자유 서술. 원본은 `contracts/examples/interview_questions.json`. 질문 문구는 PM 검토 완료 (백엔드 #8) |
| B | 설계 3안 생성 | `POST /api/v1/designs` | 요청 `{ answers }`, 응답 `202 { jobId }` |
| B' | 생성 상태·결과 조회 | `GET /api/v1/designs/jobs/{jobId}` | 폴링 3초, 최대 약 3분. 항상 200이고 결과는 `status`로 구분. 끝난 안부터 `designs[]`에 채워진다. |
| C | 운영 절차 조회 | `GET /api/v1/designs/{designId}/guide` | 3안 생성 시 함께 생성·저장된 값을 조회만 한다. B의 `operationsGuide`와 같은 값이다. |
| D | 서비스 설명 조회 | `GET /api/v1/designs/{designId}/nodes/{nodeId}/explanation` | 클릭할 때 생성하고 30일 캐시. 사용자 노드는 호출하지 않는다. |

공통 규칙 (확정)
- 경로는 `/api/v1/...`이고, 여러 단어는 kebab-case다. JSON 필드명은 camelCase다. enum 값은 snake_case다.
- **프론트는 `/api/v1/...` 상대 경로만 호출한다.** 백엔드 주소는 프록시가 처리한다. (인프라 #3)
- 에러 응답은 `{ code, message, retryable, requestId }`이고 `code`는 UPPER_SNAKE_CASE다. `requestId`는 헤더 `X-Request-Id`에도 온다.
- 프론트는 `message`를 그대로 보여 주지 않고 `code`별 한국어 문구로 매핑한다. `retryable`이 `true`일 때만 다시 시도 버튼을 보여 준다.
- HTTP 상태: 400 `INVALID_REQUEST`, 401 `UNAUTHORIZED`(Cognito 연결 후), 404 `NOT_FOUND`, 429 `RATE_LIMITED`, 500 `INTERNAL_ERROR`, D 전용 502 `EXPLANATION_FAILED`와 504 `LLM_TIMEOUT`. 생성 실패는 HTTP 에러가 아니라 B'의 `status: failed`다. 표는 `coding-conventions.md` 8번에 있다.
- 입력 검증 실패는 FastAPI 기본 422가 아니라 400이다.
- 작업 상태 값: `queued`, `running`, `completed`, `failed`.
- 비용 수치는 백엔드가 준 값만 표시한다. 프론트가 계산하거나 변환하지 않는다. 천 단위 콤마만 붙인다.
- 사용자 식별은 Cognito 연결 전까지 임시 `X-User-Id` 헤더다. 프론트는 지금은 보내지 않아도 된다.
- AWS 환경에서 API Gateway가 직접 보내는 에러는 `X-Request-Id` 대신 `x-amzn-RequestId` 헤더가 온다. `requestId`는 본문 값을 쓴다. (인프라 #7)
- 로그인은 Cognito 호스팅 로그인 페이지를 쓴다. 로그인 후 `Authorization` 헤더로 API를 호출한다. (아래 5번, 6번 질문 18)

## 3. 프로토타입에는 있지만 API로 만들지 않는 것
범위 제외 항목이라 데이터 요구사항에 넣지 않는다. 구현 단계로 넘어갈 때 제거 대상이다.
- AI 채팅 응답과 컨텍스트 (대화형 수정)
- AI 채팅 대화 기록 목록과 삭제 확인 모달. 프로토타입 `CHAT_HISTORY` 목 데이터(제목, 시간, 메시지 목록)를 쓴다.
- Deploy 버튼, 배포 상태 (원클릭 배포)
- 설계 히스토리와 여러 캔버스 관리 (P1, 이후 기능 개선). 이전 프로토타입의 스택 선택 메뉴(Architecture Testing 등)는 3안 선택(최소비용형·균형형·확장형)으로 바꿨다.
- 새 캔버스(직접 구성): 빈 캔버스에서 서비스를 직접 추가·연결하는 프로토타입 전용 기능이다. 백엔드 계약에 해당 API가 없고, 구성 내용은 브라우저 `localStorage`(`archimate-custom-canvas`)에만 저장하며 하나만 유지한다. 설정 가이드와 월 비용은 제공하지 않는다. Next.js로 옮길지는 팀 합의 후 정한다.
- 알림 벨, presence 커서 (실시간 협업)

## 4. 목 데이터 파일 구성 (제안)
프로토타입과 Next.js가 같은 모양을 쓰도록 파일로 나누어 둔다. 모양은 백엔드 계약 예시(`ArchiMate-Backend/contracts/examples/`)를 **복사**해서 쓴다. (submodule은 쓰지 않는다. 백엔드 #11)

| 파일 | 내용 | 계약 예시 |
| --- | --- | --- |
| `interview-questions.json` | A (프론트 상수로 사용) | `interview_questions.json` |
| `design-job-accepted.json` | B 요청 직후 `202` | `design_job_accepted.json` |
| `design-job-running.json` | 폴링 중 (일부 안만 완료) | `design_job_running.json` |
| `design-job-completed.json` | 폴링 완료 (3안) | `design_job_completed.json` |
| `design-job-partial-failed.json` | 일부 안 실패 (`status: completed`) | `design_job_partial_failed.json` (백엔드가 추가 예정) |
| `design-job-failed.json` | 전부 실패 (`status: failed`) | `design_job_failed.json` (백엔드가 추가 예정) |
| `guide-{designId}.json` | C 응답 | `operations_guide_minimal_cost.json` |
| `explanation-{nodeId}.json` | D 응답 | `node_explanation_app_db.json` |

- 계약 예시의 `monthlyCost`는 비용 계산 PR(백엔드 #18)이 머지되기 전이라 `null`이다. 비용 표시용 목 데이터는 `B-designs.md`의 월 비용 예시 형식을 쓴다.
- 백엔드는 모킹 LLM에 지연 옵션(`MOCK_DELAY_S`)을 넣어 `queued → running → completed`와 안이 하나씩 채워지는 흐름을 재현할 수 있게 한다. (백엔드 #11)
- 계약 복사본은 프론트 저장소 `contracts/`에 있다. (출처와 기준 커밋은 `contracts/SOURCE.md`) 타입은 `pnpm gen:api`로 `src/shared/api/schema.d.ts`에 생성한다. 백엔드 `main`에 `contracts/`가 머지되면 다시 복사한다.
- 로컬 실행: `pip install -e ".[dev]"` 후 `LLM_PROVIDER=mock uvicorn archimate.api.app:app --reload --app-dir src`, Swagger는 `http://localhost:8000/docs`다. 개발 서버는 Railway에 11.24.(화)까지 올리는 것이 목표다.
- 프로토타입은 `file://`로도 열려서 `fetch` 대신 `prototype/mock-data.js`(전역 `window.MOCK`)에 계약 예시를 그대로 복사해 둔다. `completed`(3안 성공), `partialFailed`(`design_job_partial_failed.json`), `failed`(`design_job_failed.json`) 3개다. 모양은 계약과 같게 유지하고 계약이 바뀌면 다시 복사한다.
- 실패 화면은 주소에 `?state=partial-failed`(일부 안 실패) 또는 `?state=failed`(전부 실패)를 붙여 확인한다. 기본은 3안 모두 성공이다. 다시 시도는 잠깐 기다린 뒤 성공으로 바뀐다. (실제는 `POST /designs`로 새로 생성한다.)
- 화면 흐름은 로그인 → 요구사항 인터뷰(채팅) → 3안 만드는 중 → 구성도다. 프로토타입 검토용으로 주소에 `?screen=login|interview|generating|app`을 붙이면 그 화면에서 시작한다. 모의 로그인은 `sessionStorage`의 `archimate-auth`에 저장한다. 인터뷰 질문 8개는 `MOCK.interview`(계약 예시 `interview_questions.json` 복사본)이고, 답변은 `POST /api/v1/designs`의 `answers`가 될 값이다.
- 3안 선택은 상단 바 드롭다운이고, 탭은 `designs[]`와 `failures[]`에 있는 tier로만 만든다. 안별 월 비용과 난이도는 메뉴와 가이드 패널 위쪽에 표시하고, 상단 바의 "3안 비교" 모달에서 장단점·성장 로드맵과 함께 나란히 비교한다.

## 5. 스키마 확정 후 반영 사항
프론트 초안(2026-11-19)과 백엔드·인프라 답변의 차이다. A~D 파일에는 이미 반영했다.

| 항목 | 프론트 초안 | 확정·계약 | 영향 |
| --- | --- | --- | --- |
| 필드명 표기법 | 임시 camelCase | camelCase 확정 | 타입, zod 스키마 |
| 인터뷰 질문 | `GET /api/v1/interview/questions` | API 없음, 프론트 상수 7개 + 자유 서술 | 상수 파일 생성 |
| 질문 `inputType` | `single`, `number`, `text` | `multi` 추가 (`dataStorage`는 배열) | 입력 요소 |
| 질문·선택지 필드 | `help`, `unit`, `options[].value/label` | `placeholder`, `options[].description` 추가. 없는 값은 `null` | 인터뷰 화면 |
| 답변 값 | `web`, `lt100` 등 | `web_app`, `under_100` 등. 질문 8개 | 요청 구성 |
| `awsExperience` 값 | `none`, `some`, `experienced` | `none`, `beginner`, `intermediate`, `advanced` | 선택지 |
| 3안 생성 | `POST` → `200` 동기 | `POST` → `202 { jobId }` + `GET jobs/{jobId}` 폴링 | 로딩 화면, 폴링 |
| 작업 상태 | 없음 | `queued`, `running`, `completed`, `failed` | 로딩·에러 화면 |
| 일부 실패 | 없음 | `failures[]`, `status: completed`, 안 개수 1~3 | 탭 개수 가변 |
| `tier` | `min`, `balanced`, `scale` | `minimal_cost`, `balanced`, `scalable` | 탭 이름 매핑 |
| 안 식별자 | `designs[].id` | `{jobId}_{tier}`, 이 값이 `designId` | C, D 호출 |
| `difficulty` | `{ level, label }` | `level`은 1~3, `reason` 추가 | 배지, 툴팁 |
| 안 부가 정보 | 없음 | `title`, `pros[]`, `cons[]`, `budgetNote`, `scalingPath[]` | 비교 화면, 로드맵 |
| 좌표 | `position` 선택 | 없음. 프론트 자동 배치 | 캔버스 레이아웃 |
| `serviceType` | `apigw` 등 임시 | 21종 (B 파일 참고), 사용자 노드 `users` | 아이콘·색상 매핑 |
| 노드 필드 | `id`, `serviceType`, `label`, `groupId` | `role`, `reason`, `usage` 추가 | 설명 패널 즉시 표시 |
| 엣지 | `{ from, to }` | `label` 추가 | 엣지 라벨 |
| 그룹 | `{ id, label, kind }` | `parentId` 추가, `kind` 6종 | 중첩 그룹 |
| 운영 절차 | `steps[].cli` | `cli` 없음, `consolePath` 추가. `warn`, `consolePath`는 없으면 `null` | 절차 패널 |
| 완료 체크 키 | `steps[].id` | `guide:{designId}:{stepId}` (`localStorage`) | 상태 저장 |
| 서비스 설명 `D` | `reason`, `alternatives[]`, `monthlyCost` | `cautions[]` 추가. 클릭 시 생성, 30일 캐시. 실패는 HTTP 502·504·429·404 | 설명 패널 로딩·실패 |
| 에러 응답 | `{ code, message }`, 422 | `{ code, message, retryable, requestId }`, 입력 오류는 400 | API 클라이언트 |
| 월 비용 통화 | USD 임시 | **KRW 표시** + USD 원금액, 환율, 기준일 제공 (C안) | 비용 표 |
| 월 비용 필드 | `total`, `currency`, `freeTier`, `items[]` | `totalUsd`, `exchangeRate`, `exchangeRateDate`, `priceDate`, `overBudget` 추가. `items[]`에 `amountUsd` | 비용 표 |
| 비용 계산 불가 노드 | 미정 | `items[]`에 `amount: null`, `note`에 사유. 합계에서 빠짐. 사용자 노드는 `items[]`에 없음 | 비용 표 |
| 설계 보관 | 미정 | job·설계 결과 30일 (DynamoDB TTL). 만료 후 404 | 새로고침 처리 |
| 새로고침 복원 | 미정 | `GET jobs/{jobId}`로 다시 조회. 새 API 없음 | 라우팅 |
| 접근 제한 | 미정 | 다른 사용자의 id는 404 (403 아님) | 에러 처리 |
| 로그인 | 없음 (MVP 범위에 없음) | Cognito 호스팅 로그인 페이지, 아이디는 이메일, 계정은 팀이 1개 생성(데모·파일럿용). 직접 가입은 이후 구현 | 인증 흐름, `Authorization` 헤더 |
| 환경 변수 | 없음 | `NEXT_PUBLIC_COGNITO_USER_POOL_ID`, `_CLIENT_ID`, `_REGION`, `_DOMAIN` (인프라 1차 배포 후 전달) | `.env.example` |
| 프론트 호출 방식 | 환경별 주소 | `/api/v1` 상대 경로만, 프록시가 백엔드로 전달, CORS 불필요 | API 클라이언트 |
| 라우팅 | `/designs/{id}` 같은 동적 경로 | 정적 내보내기라 쿼리 문자열 (예: `/designs/?jobId=...&tier=...`), `trailingSlash: true` | Next.js 설정 |

## 6. 의사결정 사항
질문 번호는 다른 문서가 참조하므로 기존 번호를 유지한다. 해결된 질문은 삭제했다.

해결됨
- 질문 1 노드 좌표: 프론트 자동 배치
- 질문 2 인터뷰 질문: 프론트 상수
- 질문 3 응답 방식: 비동기 폴링
- 질문 4 월 비용 통화: KRW 표시 + USD 근거
- 질문 5 `serviceType` 허용 값: 계약 21종
- 질문 6 선택 이유·대안: D 별도 API (클릭 시 생성). 노드의 `role`, `reason`은 B에도 포함
- 질문 8 완료 체크 저장: `localStorage` (키 `guide:{designId}:{stepId}`)
- 질문 9 `operationsGuide`와 C: 같은 값. 3안 화면은 B 것을 쓰고 C는 새로고침 시에만
- 질문 10 에러 `code`별 HTTP 상태: `coding-conventions.md` 8번
- 질문 11 폴링 간격: 3초, 최대 약 3분. 결과 보관 30일
- 질문 12 `queue`와 `queued`: 계약의 `queued`
- 질문 13 일부 안 실패: `status: completed` + `failures[]`. 1안 축소는 `designs` 길이 1, 남길 안은 `minimal_cost` 제안
- 질문 15 `monthlyCost` 시점: 안이 끝날 때마다 함께 계산·저장. 계산 불가 노드는 `amount: null`
- 질문 16 계약 파일 공유: 복사해서 사용, `[contract]` PR로 변경 알림
- 질문 17 상태 전달 방식: **폴링 확정** (3초, 최대 약 3분). 응답 모양이 같아서 나중에 SSE로 바꿔도 받는 부분만 바꾸면 된다. (백엔드 #7, 2026-11-23 댓글)
- 질문 18 로그인 방식: **Cognito 호스팅 로그인 페이지**, 아이디는 이메일, 계정은 팀이 1개 만들어 데모·파일럿용으로만 쓴다. 직접 가입 기능은 이후 구현. 환경 변수는 `NEXT_PUBLIC_COGNITO_*` 4개. (인프라 #4, #7, 2026-11-23 댓글)
- 비용 형식(질문 4): 프론트도 C안을 수락했다. (백엔드 #10, 2026-11-23 댓글)

남은 질문
7. 운영 절차에 AWS CLI 명령을 보여 줄지. 계약에는 `cli`가 없다. 프론트와 API·비용은 콘솔 절차만(A안)에 찬성했고, 백엔드(AI 생성)의 최종 확인을 기다린다. (백엔드 #13)
14. `nat_gateway`가 허용 목록에 있는 이유 (`product.md`는 NAT Gateway를 피하라고 함). 백엔드에서 답을 받지 못했다.
19. **Node 버전 값.** 인프라가 Node 26으로 정했고 프론트가 다른 버전을 원하는지 묻고 있다. (인프라 #2)
20. **로컬 개발 프록시.** `next dev`에서만 프록시를 켤지, 백엔드가 `http://localhost:3000`을 CORS 허용하게 할지 프론트가 정해야 한다. (인프라 #3) 정적 내보내기에서는 `next.config` `rewrites`를 빌드에 쓸 수 없다.
21. `freeText` 길이 제한 (백엔드 확인 중)
22. `nodeIds[]`가 `architecture.nodes[].id`와 맞는지 생성 단계에서 검증하는지 (백엔드(AI 생성) 확인 중, 백엔드 #13)
23. 5일차 게이트 판단과 1안 축소 여부: 백엔드(AI 생성)가 판단하고 백엔드 #14에 남긴다.
24. 인프라 #1(Vercel Hobby 계정·연동 방식)은 아직 답변이 없다. 계정 소유자는 인프라 #5에서 HJTN으로 정해졌다.
