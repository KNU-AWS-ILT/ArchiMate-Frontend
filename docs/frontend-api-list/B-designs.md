## 설계 3안 (B 응답)

| 필드 | 타입 | 설명 | 사용 화면 |
| --- | --- | --- | --- |
| `designs[]` | 배열(3개) | 최소비용 / 균형 / 확장형 | 3안 비교 탭 |
| `designs[].id` | string | 안 식별자 | 운영 절차 조회(C)에 사용 |
| `designs[].tier` | enum | `min`, `balanced`, `scale` (값은 임시) | 탭 이름 |
| `designs[].summary` | string | 한국어 한 줄 설명 | 탭 상단 |
| `designs[].difficulty` | enum | 운영 난이도 등급 (등급 단계 수 미정) | 비교 표, 배지 |
| `designs[].monthlyCost.total` | number | 월 예상 비용 합계 | 비교 표 |
| `designs[].monthlyCost.currency` | string | `USD` 또는 `KRW` (미정) | 비교 표 |
| `designs[].monthlyCost.freeTier` | boolean | Free Tier 적용 여부 | 비교 표, 배지 |
| `designs[].monthlyCost.items[]` | 배열 | 서비스별 비용 (`nodeId`, `amount`, `note`) | 노드 설명 패널, 비용 표 |
| `designs[].architecture` | 객체 | 다이어그램 데이터 (아래) | 캔버스 |

비용 수치는 백엔드가 가격 데이터로 계산한 값만 내려준다. 프론트엔드는 합산하거나 변환하지 않는다. (환율 변환이 필요하면 백엔드에서 처리, 질문 4)

### 다이어그램 데이터 (`architecture`)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `nodes[].id` | string | 노드 식별자 (예: `fnApi`) |
| `nodes[].serviceType` | string | 서비스 종류 키 (예: `lambda`, `s3`). 허용 값 목록은 질문 5 |
| `nodes[].label` | string | 화면에 표시할 이름 (같은 서비스 여러 개 구분용, 선택) |
| `nodes[].groupId` | string | 소속 그룹 (선택) |
| `nodes[].position` | `{x, y}` | 서버가 좌표를 주는 경우만 (질문 1) |
| `edges[]` | `{from, to}` | 노드 id 쌍 |
| `groups[]` | `{id, label, kind}` | 묶음. `kind`로 VPC, 서브넷, 일반 묶음 구분 (값 미정) |

### JSON 예시: 설계 3안 생성 (B)

`POST /api/v1/designs`

요청

```json
{
  "answers": {
    "serviceType": "web",
    "concurrentUsers": "lt100",
    "monthlyBudget": 50000,
    "awsExperience": "none",
    "freeText": "동아리 모집 서비스를 만들었어요."
  }
}
```

응답 `200` (3안 중 첫 번째만 전체를 보이고, 나머지는 `architecture`를 줄였다)

```json
{
  "requestId": "req_01HX0000000000",
  "designs": [
    {
      "id": "design-min",
      "tier": "min",
      "title": "최소비용안",
      "summary": "서버를 직접 관리하지 않고, 사용한 만큼만 내는 구성이에요.",
      "difficulty": { "level": 1, "label": "쉬움" },
      "monthlyCost": {
        "total": 4.2,
        "currency": "USD",
        "freeTier": true,
        "freeTierNote": "첫 12개월은 대부분 무료 사용량 안에서 쓸 수 있어요.",
        "items": [
          { "nodeId": "cf", "amount": 0.0, "note": "무료 사용량 이내" },
          { "nodeId": "s3web", "amount": 0.5, "note": "" },
          { "nodeId": "fnApi", "amount": 0.0, "note": "무료 사용량 이내" },
          { "nodeId": "api", "amount": 1.2, "note": "" },
          { "nodeId": "ddb", "amount": 2.5, "note": "" }
        ]
      },
      "architecture": {
        "nodes": [
          { "id": "users", "serviceType": "users", "label": "사용자", "groupId": null },
          { "id": "cf", "serviceType": "cloudfront", "label": "CloudFront", "groupId": null },
          { "id": "s3web", "serviceType": "s3", "label": "웹 파일 저장소", "groupId": null },
          { "id": "api", "serviceType": "apigw", "label": "API Gateway", "groupId": null },
          { "id": "fnApi", "serviceType": "lambda", "label": "API 함수", "groupId": null },
          { "id": "ddb", "serviceType": "dynamodb", "label": "모집 데이터", "groupId": null },
          { "id": "cw", "serviceType": "cloudwatch", "label": "CloudWatch", "groupId": "ops" }
        ],
        "edges": [
          { "from": "users", "to": "cf" },
          { "from": "cf", "to": "s3web" },
          { "from": "users", "to": "api" },
          { "from": "api", "to": "fnApi" },
          { "from": "fnApi", "to": "ddb" }
        ],
        "groups": [
          { "id": "ops", "label": "운영·모니터링", "kind": "plain" }
        ]
      }
    },
    {
      "id": "design-balanced",
      "tier": "balanced",
      "title": "균형안",
      "summary": "로그인과 보안 기능을 더한 구성이에요.",
      "difficulty": { "level": 2, "label": "보통" },
      "monthlyCost": { "total": 18.7, "currency": "USD", "freeTier": true, "freeTierNote": "", "items": [] },
      "architecture": { "nodes": [], "edges": [], "groups": [] }
    },
    {
      "id": "design-scale",
      "tier": "scale",
      "title": "확장형안",
      "summary": "사용자가 늘어도 버티는 구성이에요.",
      "difficulty": { "level": 3, "label": "어려움" },
      "monthlyCost": { "total": 62.4, "currency": "USD", "freeTier": false, "freeTierNote": "", "items": [] },
      "architecture": {
        "nodes": [
          { "id": "vpc1", "serviceType": "vpc", "label": "VPC", "groupId": null }
        ],
        "edges": [],
        "groups": [
          { "id": "vpc-main", "label": "VPC", "kind": "vpc" },
          { "id": "subnet-private", "label": "프라이빗 서브넷", "kind": "subnet" }
        ]
      }
    }
  ]
}
```

에러 응답 예시 `422` (LLM 출력이 스키마 검증에 실패하고 재시도도 실패한 경우)

```json
{
  "code": "DESIGN_GENERATION_FAILED",
  "message": "구성도를 만들지 못했어요. 잠시 후 다시 시도해 주세요."
}
```

노드 좌표를 서버가 주기로 하면 `nodes[]`에 `"position": { "x": 340, "y": 120 }`을 추가한다. (질문 1)
응답을 작업 id + 폴링으로 받기로 하면, `POST`는 `202 { "jobId": "job_01HX..." }`를 주고 `GET /api/v1/designs/jobs/{jobId}`가 `{ "status": "running" }` 또는 위 응답을 준다. (질문 3)
