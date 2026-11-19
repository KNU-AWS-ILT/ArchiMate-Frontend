## 운영 절차 (C 응답)

| 필드 | 타입 | 설명 | 프로토타입 |
| --- | --- | --- | --- |
| `phases[]` | 배열 | 단계 묶음 (탭) | `GUIDE[]` |
| `phases[].key` | string | 단계 식별자 | `key` |
| `phases[].title`, `sub` | string | 단계 이름, 보조 문구 | `title`, `sub` |
| `phases[].intro` | string | 단계 소개 | `intro` |
| `phases[].steps[]` | 배열 | 절차 | `steps[]` |
| `steps[].id` | string | 절차 식별자. 완료 체크 저장 키로 쓰므로 안정적이어야 함 | `id` |
| `steps[].title`, `desc` | string | 제목, 설명 | `title`, `desc` |
| `steps[].nodeIds[]` | string[] | 캔버스에서 강조할 노드 id | `nodes` |
| `steps[].todo[]` | string[] | 할 일 목록 | `todo` |
| `steps[].warn` | string | 주의 문구 (선택) | `warn` |
| `steps[].cli` | string | AWS CLI 예시 (선택). 노출 여부 미정 (질문 7) | `cli` |

추가로 필요한 절차: 비용 알람 설정, 장애 대응 체크리스트. 프로토타입 `GUIDE`에는 CloudWatch 알람 일부만 있다. 프로토타입에서 화면 구성을 먼저 정한다.

### JSON 예시: 운영 절차 조회 (C)

`GET /api/v1/designs/{designId}/guide`

응답 `200` (단계 2개, 절차 3개로 줄인 예시)

```json
{
  "designId": "design-min",
  "phases": [
    {
      "key": "data",
      "title": "저장소·데이터베이스",
      "sub": "1단계",
      "intro": "웹 파일을 올릴 저장소와 데이터를 담을 테이블을 먼저 만들어요.",
      "steps": [
        {
          "id": "s3",
          "title": "S3 버킷 만들기",
          "desc": "웹 파일을 올려 둘 저장소를 만들어요.",
          "nodeIds": ["s3web"],
          "warn": "",
          "todo": [
            "버킷을 만들고 퍼블릭 액세스 차단을 켜요.",
            "기본 암호화를 켜요."
          ],
          "cli": ""
        },
        {
          "id": "ddb",
          "title": "DynamoDB 테이블 만들기",
          "desc": "모집 신청 데이터를 저장할 테이블을 만들어요.",
          "nodeIds": ["ddb"],
          "warn": "",
          "todo": [
            "테이블 이름과 기본 키를 정해요.",
            "요금 방식을 '온디맨드'로 골라요."
          ],
          "cli": ""
        }
      ]
    },
    {
      "key": "ops",
      "title": "운영",
      "sub": "2단계",
      "intro": "비용과 장애를 알려 주는 알람을 켜요.",
      "steps": [
        {
          "id": "costAlarm",
          "title": "비용 알람 설정",
          "desc": "예산을 넘기기 전에 이메일로 알려 줘요.",
          "nodeIds": ["cw"],
          "warn": "알람 이메일 인증을 해야 알림이 와요.",
          "todo": [
            "월 예산의 80% 금액으로 알람을 만들어요.",
            "알림을 받을 이메일을 등록하고 인증해요."
          ],
          "cli": ""
        }
      ]
    }
  ],
  "checklists": [
    {
      "key": "incident",
      "title": "장애가 났을 때",
      "items": [
        "CloudWatch 로그에서 오류 시간을 확인해요.",
        "최근에 바꾼 설정이 있는지 확인해요."
      ]
    }
  ]
}
```

`checklists`는 비용·장애 대응 체크리스트용 제안 필드다. 프로토타입 `GUIDE`에는 없다. 화면 구성이 정해지면 확정한다.
`cli` 값을 보여 주지 않기로 하면 필드를 빼도 된다. (질문 7)
