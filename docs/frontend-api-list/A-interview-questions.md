## JSON 예시: 인터뷰 질문 조회 (A)

`GET /api/v1/interview/questions`

응답 `200`

```json
{
  "questions": [
    {
      "id": "serviceType",
      "text": "어떤 종류의 서비스인가요?",
      "help": "가장 비슷한 것을 골라 주세요.",
      "inputType": "single",
      "required": true,
      "options": [
        { "value": "web", "label": "웹 서비스" },
        { "value": "api", "label": "API 서버" },
        { "value": "static", "label": "정적 웹사이트" }
      ]
    },
    {
      "id": "concurrentUsers",
      "text": "동시에 접속하는 사용자는 몇 명 정도인가요?",
      "help": "정확하지 않아도 괜찮아요.",
      "inputType": "single",
      "required": true,
      "options": [
        { "value": "lt100", "label": "100명 이하" },
        { "value": "lt1000", "label": "1,000명 이하" },
        { "value": "gte1000", "label": "1,000명 이상" }
      ]
    },
    {
      "id": "monthlyBudget",
      "text": "한 달에 쓸 수 있는 예산은 얼마인가요?",
      "help": "원 단위로 입력해 주세요.",
      "inputType": "number",
      "required": true,
      "unit": "KRW",
      "options": []
    },
    {
      "id": "awsExperience",
      "text": "AWS를 써 본 적이 있나요?",
      "help": "",
      "inputType": "single",
      "required": true,
      "options": [
        { "value": "none", "label": "처음이에요" },
        { "value": "some", "label": "조금 써 봤어요" },
        { "value": "experienced", "label": "익숙해요" }
      ]
    },
    {
      "id": "freeText",
      "text": "더 알려 주고 싶은 내용이 있나요?",
      "help": "예: 동아리 모집 서비스, 이미지 업로드 기능이 있어요.",
      "inputType": "text",
      "required": false,
      "options": []
    }
  ]
}
```

질문 목록을 프론트에 고정하기로 하면 이 API는 필요 없고, 위 JSON은 프론트 상수로 쓴다. (질문 2)