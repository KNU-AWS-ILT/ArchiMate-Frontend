## 인터뷰 질문 (A, 프론트 상수)
갱신: 2026-11-21 (백엔드 Issue #7, #8 답변 반영)

**API가 없다.** 프론트가 상수 파일로 갖고 쓴다. 원본은 `ArchiMate-Backend/contracts/examples/interview_questions.json`이고, 질문 문구는 PM이 검토를 마쳤다. (백엔드 #8)

- 질문 7개 + 자유 서술 1개다. 프론트는 이 파일을 복사해 `interview-questions.json` 상수로 둔다.
- 질문이 바뀌면 백엔드가 `contracts/`를 바꾸는 PR(제목에 `[contract]`)로 알려 준다. (백엔드 #11)
- 현재 계약 예시는 `trafficPattern`, `availability`를 `required: true`로 두고 있다. 백엔드 PR #9(미머지)가 두 질문을 `required: false`로 바꾼다. 최종 값은 머지 후 `contracts/`를 다시 확인한다.

### 질문 필드
| 필드 | 설명 |
| --- | --- |
| `id` | 질문 id. 요청 `answers`의 키로 쓴다. |
| `text`, `help` | 질문 문구, 보조 문구 (없으면 `null`) |
| `inputType` | `single`(하나 선택), `multi`(여러 개 선택), `number`(숫자), `text`(자유 입력) |
| `required` | 필수 여부 |
| `options[]` | 선택지. `value`, `label`, `description`(없으면 `null`) |
| `unit`, `placeholder` | `number`, `text` 입력에서 쓴다. 없으면 `null` |

### 질문과 값
| `id` | `inputType` | 질문 | 선택지 `value` (label) |
| --- | --- | --- | --- |
| `serviceType` | single | 어떤 서비스인가요? | `web_app`(웹 서비스), `api_only`(앱/서비스용 API), `static_site`(정적 사이트), `ai_chatbot`(AI 서비스), `data_batch`(데이터 수집·처리), `other`(기타) |
| `concurrentUsers` | single | 동시에 몇 명 정도 접속할까요? | `under_100`(100명 이하), `under_1k`(101~1,000명), `under_10k`(1,001~1만 명), `over_10k`(1만 명 초과) |
| `monthlyBudget` | number | 한 달 인프라 예산은 얼마인가요? | 숫자, `unit: "KRW"`, 0원이면 Free Tier 안에서만 설계 |
| `awsExperience` | single | AWS를 얼마나 다뤄 봤나요? | `none`(처음이에요), `beginner`(조금 써 봤어요), `intermediate`(배포해 봤어요), `advanced`(익숙해요) |
| `dataStorage` | **multi** | 어떤 데이터를 저장하나요? | `relational`, `key_value`, `file_storage`, `none`. 응답은 배열이다. `none`은 다른 값과 같이 고를 수 없다. |
| `trafficPattern` | single | 접속은 언제 몰리나요? | `steady`, `business_hours`, `spiky`, `unknown` |
| `availability` | single | 서비스가 잠깐 멈추면 얼마나 곤란한가요? | `best_effort`, `standard`, `high` |
| `freeText` | text | 서비스를 자유롭게 설명해 주세요 | 선택 입력. 선택한 답과 충돌하면 선택한 답이 우선한다. |

### 입력 검증 (서버가 400으로 거절하는 경우)
- 필수 답 누락
- `dataStorage`에서 `none`과 다른 항목을 함께 선택
- `dataStorage`의 중복 선택
- 서버 검증 실패는 `400 { code: "INVALID_REQUEST", message, retryable: false, requestId }`다. 프론트도 같은 규칙으로 먼저 막는다.
- `freeText` 길이 제한은 백엔드에 확인 중이다. (미확정)

### 요청 예시
`POST /api/v1/designs`의 요청은 B 파일을 본다. 답변은 질문 `id`를 키로 한다.
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
    "freeText": "바이브 코딩으로 만든 동아리 모집 사이트예요. 모집 기간에만 지원자가 몰려요."
  }
}
```
