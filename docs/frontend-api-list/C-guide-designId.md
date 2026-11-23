## 운영 절차 (C 응답)
갱신: 2026-11-21 (백엔드 Issue #7, #12, #13 답변 반영)

`GET /api/v1/designs/{designId}/guide`. `designId`는 B의 `designs[].id`(`{jobId}_{tier}`)를 그대로 쓴다.

- 3안을 만들 때 함께 생성·저장된 값을 **조회만** 한다. 호출할 때마다 다시 만들지 않는다.
- 3안 화면에서는 B의 `designs[].operationsGuide`를 쓴다. C는 운영 절차 화면에 바로 들어오거나 새로고침할 때만 쓴다. 두 값은 같다. (백엔드 #13)
- 보관 기간은 30일이고, 지나면 `404 NOT_FOUND`다.
- 모양의 원본은 `ArchiMate-Backend/contracts/operations_guide.schema.json`, `examples/operations_guide_minimal_cost.json`이다.

### 필드
| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `phases[]` | 배열 | 단계 묶음 (탭) |
| `phases[].key`, `title`, `sub`, `intro` | string | 단계 식별자, 이름, 보조 문구(예: "1단계"), 소개 |
| `phases[].steps[]` | 배열 | 절차 |
| `steps[].id` | string | 절차 식별자. 한 번 저장한 값을 그대로 돌려주므로 재조회해도 바뀌지 않는다. (예: `account_security`) |
| `steps[].title`, `desc` | string | 제목, 설명 |
| `steps[].nodeIds[]` | string[] | 캔버스에서 강조할 노드 id. 특정 노드와 관계없는 단계는 `[]`다. |
| `steps[].todo[]` | string[] | 할 일 목록 |
| `steps[].consolePath` | string 또는 `null` | AWS 콘솔 경로 (예: `IAM > 사용자 > 사용자 생성`) |
| `steps[].warn` | string 또는 `null` | 주의 문구 |
| `checklists[]` | 배열 | 비용·장애 대응 체크리스트 `{ key, title, items[] }` (예: `cost`, `incident`) |

- 없는 값은 빈 문자열이 아니라 항상 `null`이다. (`warn`, `consolePath`)
- **`cli` 필드는 없다.** 콘솔 절차만 제공한다. 프론트와 API·비용 쪽은 이 방식에 찬성했고, 백엔드(AI 생성)의 최종 확인을 기다린다. (백엔드 #13)
- `nodeIds[]`가 `architecture.nodes[].id`와 맞는지는 생성 단계에서 검증하는지 백엔드(AI 생성)가 확인 중이다.

### 완료 체크 저장
- `localStorage`에만 둔다. (확정, 백엔드 #12)
- 키는 `guide:{designId}:{stepId}`다. 설계안끼리 겹치지 않도록 `designId`를 앞에 붙인다.

### JSON 예시 (단계 2개, 절차 3개로 줄임)
```json
{
  "phases": [
    {
      "key": "account",
      "title": "계정 준비",
      "sub": "1단계",
      "intro": "리소스를 만들기 전에 계정을 안전하게 하고, 예산을 넘지 않게 알람부터 켜요.",
      "steps": [
        {
          "id": "account_security",
          "title": "AWS 계정 보안 설정",
          "desc": "루트 계정이 털리면 모든 리소스가 위험해져요. 로그인 2단계 인증을 켜고 평소에는 별도 사용자로 작업해요.",
          "nodeIds": [],
          "todo": [
            "루트 계정에 MFA(로그인 2단계 인증)를 켜요.",
            "일상 작업용 IAM 사용자를 만들고 그 사용자로 다시 로그인해요."
          ],
          "consolePath": "IAM > 사용자 > 사용자 생성",
          "warn": "루트 계정의 액세스 키는 만들지 마세요."
        },
        {
          "id": "create_db",
          "title": "데이터베이스 만들기",
          "desc": "지원서 데이터를 저장할 데이터베이스를 만들어요.",
          "nodeIds": ["app_db"],
          "todo": [
            "설계도의 데이터베이스 서비스로 저장소를 만들어요.",
            "자동 백업(또는 특정 시점 복구)을 켜요."
          ],
          "consolePath": null,
          "warn": null
        }
      ]
    }
  ],
  "checklists": [
    {
      "key": "incident",
      "title": "장애가 났을 때",
      "items": [
        "화면이 예전 버전으로 보이면 CloudFront 캐시 무효화(/*)를 실행해요.",
        "API가 5xx 오류를 내면 CloudWatch Logs에서 최근 오류 로그를 확인해요."
      ]
    }
  ]
}
```
