## 서비스 설명 (D 응답, 노드 클릭 시)
갱신: 2026-11-21 (백엔드 Issue #7, #10, #12 답변 반영)

`GET /api/v1/designs/{designId}/nodes/{nodeId}/explanation`. `designId`는 B의 `designs[].id`를 그대로 쓴다.

- 노드를 **클릭할 때 생성**하고 서버가 **30일 캐시**한다. 첫 클릭은 몇 초 걸릴 수 있어서 로딩 표시가 필요하다. 같은 노드를 다시 누르면 캐시된 값이 온다. (백엔드 #7)
- 노드 설명 Lambda의 제한 시간은 25초다. 시간을 넘으면 `504`가 온다. (백엔드 #7, 인프라 #7)
- 기본 정보는 B의 `architecture.nodes[]`에도 `role`, `reason`이 이미 있다. 첫 응답을 기다리는 동안, 또는 D가 실패했을 때 이 값을 먼저 보여 줄 수 있다. D는 `alternatives`, `cautions`, 더 자세한 `reason`을 더한다.
- **사용자 노드(`serviceType: "users"`)는 D를 호출하지 않는다.** 호출하면 `404`다.
- 모양의 원본은 `ArchiMate-Backend/contracts/node_explanation.schema.json`, `examples/node_explanation_app_db.json`이다.

### 필드
| 필드 | 설명 |
| --- | --- |
| `nodeId`, `serviceType`, `name`, `category` | 노드 id, 서비스 종류, 서비스 이름, 분류 |
| `role` | 서비스가 하는 일 |
| `reason` | 이 설계에서 이 서비스를 고른 이유 |
| `alternatives[]` | 대안 `{ serviceType, name, comparison }` |
| `cautions[]` | 쓸 때 주의할 점 (목록) |
| `monthlyCost` | `{ currency, amount, amountUsd, note }` 또는 `null`. 설계 생성 때 계산해 저장한 값을 그대로 가져온다. B의 `items[]`와 항상 같다. 비용 계산 대상이 아닌 노드는 `null`이다. |

### 실패 응답 (HTTP 에러로 온다)
| 상황 | HTTP | code | retryable |
| --- | --- | --- | --- |
| AI가 설명을 못 만듦 | 502 | `EXPLANATION_FAILED` | true |
| AI 응답 시간 초과 | 504 | `LLM_TIMEOUT` | true |
| 요청 한도 초과 | 429 | `RATE_LIMITED` | true |
| 없는 `designId`/`nodeId`, 사용자 노드, 보관 기간 만료 | 404 | `NOT_FOUND` | false |

`retryable`이 `true`일 때만 다시 시도 버튼을 보여 준다.

### JSON 예시
```json
{
  "nodeId": "app_db",
  "serviceType": "dynamodb",
  "name": "Amazon DynamoDB",
  "category": "database",
  "role": "동아리 공고와 지원서 저장",
  "reason": "지원서처럼 ID로 바로 찾는 단순한 데이터라 표를 엮는 관계형 DB가 필요 없어요. 모집 기간에만 지원자가 몰리는데, 온디맨드 모드는 읽기·쓰기만큼만 과금되고 서버를 켜 둘 필요가 없어요.",
  "alternatives": [
    {
      "serviceType": "rds",
      "name": "Amazon RDS",
      "comparison": "SQL로 여러 표를 엮어 조회해야 한다면 RDS가 낫지만, 켜 둔 시간만큼 매달 고정 비용이 나가요."
    }
  ],
  "cautions": [
    "어떤 값으로 데이터를 찾을지(조회 패턴)를 먼저 정하고 키를 설계해야 나중에 고생하지 않아요.",
    "실수로 지운 데이터를 되살리려면 특정 시점 복구(PITR)를 켜 두세요."
  ],
  "monthlyCost": { "currency": "KRW", "amount": 3720, "amountUsd": 2.70, "note": "요청 월 100만 건 기준" }
}
```
계약 예시(`node_explanation_app_db.json`)는 비용 계산 PR(백엔드 #18)이 머지되기 전이라 `monthlyCost`가 `null`이다.
