## 서비스 설명 (D 응답, 노드 클릭 시)

| 필드 | 설명 | 프로토타입 |
| --- | --- | --- |
| `serviceType` | 서비스 종류 키 | `TYPES`의 키 |
| `name` | 서비스 이름 | `name` |
| `category` | 분류 | `cat` |
| `role` | 서비스가 하는 일 | `role` |
| `reason` | 이 설계에서 이 서비스를 고른 이유 | 없음 (추가 필요) |
| `alternatives[]` | 대안 서비스와 비교 한 줄 (`serviceType`, `comparison`) | 없음 (추가 필요) |

`reason`과 `alternatives`는 설계마다 달라질 수 있어서 B 응답에 포함할지, D로 따로 받을지 정해야 한다. (질문 6)

### JSON 예시: 서비스 설명 조회 (D)

`GET /api/v1/designs/{designId}/nodes/{nodeId}/explanation`

응답 `200`

```json
{
  "nodeId": "ddb",
  "serviceType": "dynamodb",
  "name": "Amazon DynamoDB",
  "category": "database",
  "role": "신청자 정보 같은 데이터를 저장하는 데이터베이스예요.",
  "reason": "서버를 따로 관리하지 않아도 되고, 쓴 만큼만 비용이 나와서 사용자가 적을 때 가장 저렴해요.",
  "alternatives": [
    {
      "serviceType": "rds",
      "name": "Amazon RDS",
      "comparison": "표 형태 데이터를 SQL로 다루기 좋지만, 켜 둔 시간만큼 매달 비용이 나가요."
    }
  ],
  "monthlyCost": { "amount": 2.5, "currency": "USD", "note": "" }
}
```

B 응답에 `reason`과 `alternatives`를 포함하기로 하면 D는 필요 없고, `architecture.nodes[]` 안에 같은 필드를 둔다. (질문 6)
