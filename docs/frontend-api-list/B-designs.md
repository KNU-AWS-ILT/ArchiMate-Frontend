## 설계 3안 생성 (B, 비동기)
갱신: 2026-11-21 (백엔드 Issue #7, #10, #12, #14 답변 반영)

모양의 원본은 `ArchiMate-Backend/contracts/` (`design_job.schema.json`, `examples/design_job_*.json`)다. 이 문서는 프론트가 쓰는 부분을 정리한 것이다. 백엔드 PR #17이 머지되면 `contracts/openapi.json`으로 타입을 만들 수 있다. (예: `pnpm dlx openapi-typescript contracts/openapi.json -o src/api/schema.d.ts`)

## 흐름
1. `POST /api/v1/designs` → 즉시 `202 { "jobId": "job_demo" }`
2. `GET /api/v1/designs/jobs/{jobId}`를 **3초마다** 조회 (최대 약 3분)
3. `status`가 `completed` 또는 `failed`면 조회를 멈춘다.
4. 3분 안에 끝나지 않으면 "시간이 걸려요, 다시 시도해 주세요"를 보여 준다. (정확한 시간은 인프라 Lambda 제한 시간 확정 후 안내됨)

폴링 vs SSE는 PM 결정 대기 중이다. 응답 모양(`DesignJob`)은 같아서 나중에 바꿔도 받는 부분만 바뀐다. (백엔드 #7)

## 요청
```json
{
  "answers": {
    "serviceType": "web_app",
    "concurrentUsers": "under_100",
    "monthlyBudget": 50000,
    "awsExperience": "none",
    "dataStorage": ["key_value"],
    "trafficPattern": "spiky",
    "availability": "best_effort",
    "freeText": "바이브 코딩으로 만든 동아리 모집 사이트예요."
  }
}
```
입력 오류는 `400 INVALID_REQUEST`다. (FastAPI 기본 422를 쓰지 않는다.)

## 작업 조회 응답 `DesignJob`
| 필드 | 설명 |
| --- | --- |
| `jobId` | 작업 id |
| `status` | `queued` → `running` → `completed` / `failed` |
| `designs[]` | 끝난 안만 들어 있다. 생성 중에도 안이 하나씩 채워진다. 안 개수는 **1~3개**다. |
| `failures[]` | 실패한 안 `{ tier, reason }`. `reason`은 로그용 내부 코드라 화면에 보여 주지 않는다. |
| `error` | 전부 실패했을 때만 `{ code, message, retryable, requestId }`. 아니면 `null` |

- 조회는 항상 HTTP 200이다. 결과는 `status`로 구분한다.
- **일부 안만 실패**: `status: "completed"`, 성공한 안은 `designs[]`, 실패한 안은 `failures[]`, `error`는 `null`이다. 실패한 안의 탭에만 "만들지 못했어요"와 다시 시도 버튼을 보여 준다. 다시 시도는 `POST /designs`로 새로 생성한다. (안별 재시도 API는 없다.)
- **전부 실패**: `status: "failed"`, `designs: []`, `failures`에 3개 tier, `error`에 코드(`DESIGN_GENERATION_FAILED`, `LLM_TIMEOUT`, `RATE_LIMITED`, `INTERNAL_ERROR`)가 들어간다. `retryable: true`일 때만 다시 시도 버튼을 보여 준다.
- **1안 축소**(5일차 게이트): 스키마는 같고 `designs` 길이가 1이다. 남기는 안은 `minimal_cost` 제안이다. 만들지 않은 안은 실패가 아니라서 `failures`에 넣지 않는다. 탭은 `designs[]`와 `failures[]`에 있는 tier로만 만든다. 3개를 가정하지 않는다. (백엔드 #14)

## 안 `designs[]` 필드
| 필드 | 설명 |
| --- | --- |
| `id` | `{jobId}_{tier}`. 이 값이 `designId`다. C, D 경로에 그대로 쓴다. |
| `tier` | `minimal_cost`, `balanced`, `scalable` |
| `title`, `summary` | 안 이름, 설명 |
| `difficulty` | `{ level: 1~3, label, reason }` |
| `architecture` | `nodes[]`, `edges[]`, `groups[]` (좌표 없음, 프론트가 자동 배치) |
| `pros[]`, `cons[]` | 장점, 단점 |
| `budgetNote` | 예산 설명 문구 (AI가 쓴 설명. 금액 비교에는 `overBudget`을 쓴다.) |
| `scalingPath[]` | 성장 단계 로드맵 |
| `operationsGuide` | 운영 절차. C 응답과 같은 값이다. |
| `monthlyCost` | 월 비용. 비용 계산이 아직 없거나 실패하면 `null`이다. |

## 월 비용 `monthlyCost` (백엔드 #10, API·비용 답변)
화면은 KRW가 기준이고 USD 원금액과 환율을 근거로 함께 준다. 프론트는 합산하거나 변환하지 않고, 천 단위 콤마만 붙인다.

```json
{
  "currency": "KRW",
  "total": 18420,
  "totalUsd": 13.37,
  "exchangeRate": 1378.0,
  "exchangeRateDate": "2026-11-20",
  "priceDate": "2026-11-20",
  "freeTier": true,
  "freeTierNote": "가입 후 12개월 무료 한도 안에서는 약 0원이에요.",
  "overBudget": false,
  "items": [
    { "nodeId": "app_api", "amount": 3720, "amountUsd": 2.70, "note": "요청 월 100만 건 기준" },
    { "nodeId": "app_cdn", "amount": null, "amountUsd": null, "note": "비용 계산 대상이 아니에요" }
  ]
}
```
- `total`은 `items[].amount`의 합이고 백엔드가 보장한다. 계산 대상이 아닌 노드는 `amount: null`이고 합계에서 빠진다. 사용자 노드(`users`)는 `items[]`에 없다.
- `overBudget`: `total`이 `monthlyBudget`보다 크면 `true`다.
- 반올림: KRW는 정수(원), USD는 소수 둘째 자리.
- 계산에 실패한 안은 그 안만 `monthlyCost: null`이고 안 자체는 보여 준다.
- 안이 끝날 때마다 비용을 함께 계산해 저장한다. 그래서 `running` 중이라도 `designs`에 들어온 안에는 비용이 있다.
- 비용 계산 PR(백엔드 #18)이 머지되기 전까지는 `monthlyCost: null`이다. 프론트 목 데이터는 위 예시를 쓴다.

## 다이어그램 `architecture`
| 필드 | 설명 |
| --- | --- |
| `nodes[].id`, `serviceType`, `label` | 노드 id, 서비스 종류(21종), 표시 이름 |
| `nodes[].groupId` | 소속 그룹. 그룹 밖이면 `null` |
| `nodes[].role`, `reason` | 서비스가 하는 일, 이 설계에서 고른 이유 (설명 패널에 바로 쓸 수 있다.) |
| `nodes[].usage` | 비용 계산 입력값(`monthlyRequests`, `storageGb` 등). 사용자·모니터링 노드는 `null`. 화면에 보이지 않는다. |
| `edges[]` | `{ from, to, label }` (`label`은 없으면 `null`) |
| `groups[]` | `{ id, kind, label, parentId }`. `kind`: `plain`, `region`, `vpc`, `availability_zone`, `public_subnet`, `private_subnet` |

`serviceType` 21종: `users`, `lambda`, `s3`, `dynamodb`, `rds`, `ec2`, `cloudfront`, `api_gateway`, `alb`, `ecs_fargate`, `nat_gateway`, `elasticache`, `cognito`, `route53`, `sqs`, `sns`, `eventbridge`, `cloudwatch`, `secrets_manager`, `ses`, `bedrock`. 사용자 노드는 `serviceType: "users"`다.

## 응답 예시
`POST /api/v1/designs` → `202`
```json
{ "jobId": "job_demo" }
```

`GET /api/v1/designs/jobs/job_demo` → `200` (생성 중, 한 안만 끝남. 노드 일부만 줄여 보임)
```json
{
  "jobId": "job_demo",
  "status": "running",
  "designs": [
    {
      "id": "job_demo_minimal_cost",
      "tier": "minimal_cost",
      "title": "서버리스 최소비용 구성",
      "summary": "정적 화면은 S3와 CloudFront로, API는 API Gateway와 Lambda로, 데이터는 DynamoDB에 저장합니다.",
      "difficulty": { "level": 1, "label": "쉬움", "reason": "서버를 직접 관리하지 않아 콘솔에서 몇 번의 설정만으로 운영할 수 있어요." },
      "architecture": {
        "nodes": [
          { "id": "users", "serviceType": "users", "label": "사용자", "groupId": null, "role": "브라우저로 모집 공고를 보고 지원서를 내는 사람", "reason": "모든 요청이 시작되는 지점이에요.", "usage": null },
          { "id": "app_db", "serviceType": "dynamodb", "label": "지원서 DB", "groupId": "region_seoul", "role": "동아리 공고와 지원서 저장", "reason": "온디맨드 모드는 읽기·쓰기만큼만 과금돼요.", "usage": { "storageGb": 1.0, "monthlyReads": 500000, "monthlyWrites": 50000 } }
        ],
        "edges": [
          { "from": "users", "to": "app_db", "label": "지원서 읽기/쓰기" }
        ],
        "groups": [
          { "id": "region_seoul", "kind": "region", "label": "서울 리전 (ap-northeast-2)", "parentId": null }
        ]
      },
      "pros": ["트래픽이 적을 때 비용이 거의 0원"],
      "cons": ["Lambda 콜드 스타트로 첫 응답이 느릴 수 있음"],
      "budgetNote": "월 5만 원 예산보다 훨씬 낮은 수준으로 운영할 수 있어요.",
      "scalingPath": ["사용자 1만 명: DynamoDB 키 설계 점검"],
      "operationsGuide": { "phases": [], "checklists": [] },
      "monthlyCost": null
    }
  ],
  "failures": [],
  "error": null
}
```
(`operationsGuide`의 실제 구조는 C 파일을 본다. `usage`는 실제로는 11개 키를 모두 가진다.)

전부 실패 (`status: "failed"`, HTTP 200)
```json
{
  "jobId": "job_demo",
  "status": "failed",
  "designs": [],
  "failures": [
    { "tier": "minimal_cost", "reason": "LLM_INVALID_OUTPUT" },
    { "tier": "balanced", "reason": "LLM_INVALID_OUTPUT" },
    { "tier": "scalable", "reason": "LLM_INVALID_OUTPUT" }
  ],
  "error": {
    "code": "DESIGN_GENERATION_FAILED",
    "message": "구성도를 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
    "retryable": true,
    "requestId": "job_demo"
  }
}
```
일부 실패, 부분 응답, 전부 실패의 계약 예시는 `contracts/examples/design_job_partial_failed.json`, `design_job_failed.json`으로 추가될 예정이다. (백엔드 #11)

## 새로고침과 재조회
- URL에 `jobId`를 둔다. 정적 내보내기라 동적 경로 대신 쿼리 문자열을 쓴다. (예: `/designs/?jobId=job_demo&tier=balanced`)
- 새로고침하면 `GET jobs/{jobId}`로 다시 불러온다. 이미 끝난 작업은 한 번만 조회하면 된다.
- 작업과 설계 결과는 30일 보관된다. 그 뒤는 `404 NOT_FOUND`다.
- 사용자 식별은 Cognito 연결 전까지 임시로 `X-User-Id` 헤더(없으면 `local-user`)다. 프론트는 지금은 보내지 않아도 된다. 다른 사용자의 `jobId`는 404로 응답한다. (백엔드 #12)
