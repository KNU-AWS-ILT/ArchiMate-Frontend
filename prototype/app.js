/* ArchiMate canvas prototype — vanilla JS
 * Left: floating (non-modal) AI chat · Center: architecture canvas · Right: setup guide tabs
 */
(() => {
  // ---------- Service catalog ----------
  const CAT = {
    compute:    { c: '#ED7100', label: 'compute' },
    storage:    { c: '#7AA116', label: 'storage' },
    networking: { c: '#8C4FFF', label: 'networking' },
    security:   { c: '#DD344C', label: 'security' },
    messaging:  { c: '#E7157B', label: 'messaging' },
    database:   { c: '#C925D1', label: 'database' },
    media:      { c: '#ED7100', label: 'media' },
    ml:         { c: '#01A88D', label: 'machine_learning' },
    mgmt:       { c: '#E7157B', label: 'management' },
    general:    { c: '#5A6B86', label: 'actor' },
  };

  const ICON = {
    users: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5 2.5 5 6"/>',
    lambda: '<path d="M6 21l6-11M9 3h3l7 18"/>',
    bucket: '<path d="M4 6l2 14h12l2-14"/><ellipse cx="12" cy="6" rx="8" ry="2.5"/>',
    queue: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M8 7v10M12 7v10M16 7v10"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M14 10h4M14 13h3"/>',
    api: '<path d="M8 4H5v16h3M16 4h3v16h-3M10 12h4"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    bell: '<path d="M4 12h3l5-6v12l-5-6M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    bus: '<path d="M4 12h16M12 4v16"/><circle cx="12" cy="12" r="3"/><circle cx="4" cy="12" r="1.5"/><circle cx="20" cy="12" r="1.5"/>',
    eye: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    trail: '<path d="M4 18c4 0 4-12 8-12s4 12 8 12"/>',
    cdn: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
    dns: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  };

  const TYPES = {
    users:        { name: 'Users', cat: 'general', icon: 'users', tf: null, cost: 0, role: '서비스를 사용하는 최종 사용자(브라우저/모바일)입니다.' },
    route53:      { name: 'Amazon Route 53', cat: 'networking', icon: 'dns', tf: 'aws_route53_zone', cost: 0.5, role: '도메인 DNS를 관리하고 CloudFront로 트래픽을 라우팅합니다.' },
    cloudfront:   { name: 'Amazon CloudFront', cat: 'networking', icon: 'cdn', tf: 'aws_cloudfront_distribution', cost: 8.5, role: '정적 웹(S3)을 전 세계 엣지에서 캐싱해 제공하는 CDN입니다.' },
    s3:           { name: 'Amazon S3', cat: 'storage', icon: 'bucket', tf: 'aws_s3_bucket', cost: 2.3, role: '정적 웹 / 업로드 원본 / 변환 결과물을 저장하는 객체 스토리지입니다.' },
    cognito:      { name: 'Amazon Cognito', cat: 'security', icon: 'id', tf: 'aws_cognito_user_pool', cost: 5.5, role: '회원가입·로그인을 처리하고 API Gateway에 JWT를 제공합니다.' },
    waf:          { name: 'AWS WAF', cat: 'security', icon: 'shield', tf: 'aws_wafv2_web_acl', cost: 6, role: 'CloudFront 앞단에서 악성 요청과 과도한 트래픽을 차단합니다.' },
    lambda:       { name: 'AWS Lambda', cat: 'compute', icon: 'lambda', tf: 'aws_lambda_function', cost: 1.8, role: '이벤트 기반으로 비즈니스 로직을 실행하는 서버리스 함수입니다.' },
    apigw:        { name: 'Amazon API Gateway', cat: 'networking', icon: 'api', tf: 'aws_apigatewayv2_api', cost: 3.5, role: 'REST/HTTP API 진입점이며 Cognito 인증 후 Lambda를 호출합니다.' },
    dynamodb:     { name: 'Amazon DynamoDB', cat: 'database', icon: 'db', tf: 'aws_dynamodb_table', cost: 6.25, role: '메타데이터와 작업 상태를 저장하는 NoSQL DB입니다.' },
    sns:          { name: 'Amazon SNS', cat: 'messaging', icon: 'bell', tf: 'aws_sns_topic', cost: 0.5, role: '업로드 이벤트를 여러 SQS 큐로 팬아웃합니다.' },
    sqs:          { name: 'Amazon SQS', cat: 'messaging', icon: 'queue', tf: 'aws_sqs_queue', cost: 0.4, role: '작업을 버퍼링해 워커 Lambda가 안정적으로 처리하게 합니다.' },
    mediaconvert: { name: 'AWS Elemental MediaConvert', cat: 'media', icon: 'film', tf: 'aws_media_convert_queue', cost: 22, role: '업로드된 영상을 HLS/MP4 등으로 트랜스코딩합니다.' },
    eventbridge:  { name: 'Amazon EventBridge', cat: 'messaging', icon: 'bus', tf: 'aws_cloudwatch_event_rule', cost: 1, role: 'MediaConvert 작업 완료 이벤트를 후처리 Lambda로 전달합니다.' },
    rekognition:  { name: 'Amazon Rekognition', cat: 'ml', icon: 'eye', tf: null, cost: 12, role: '이미지/영상에서 라벨·얼굴·부적절 콘텐츠를 분석합니다.' },
    iam:          { name: 'AWS IAM', cat: 'security', icon: 'key', tf: 'aws_iam_role', cost: 0, role: '모든 서비스 간 접근 권한(역할/정책)을 정의합니다.' },
    kms:          { name: 'AWS KMS', cat: 'security', icon: 'lock', tf: 'aws_kms_key', cost: 1, role: 'S3·SQS·DynamoDB 데이터 암호화 키를 관리합니다.' },
    cloudwatch:   { name: 'Amazon CloudWatch', cat: 'mgmt', icon: 'chart', tf: 'aws_cloudwatch_log_group', cost: 3, role: '로그·지표·알람으로 시스템을 모니터링합니다.' },
    cloudtrail:   { name: 'AWS CloudTrail', cat: 'mgmt', icon: 'trail', tf: 'aws_cloudtrail', cost: 2, role: '계정 내 모든 API 호출을 감사 로그로 기록합니다.' },
  };

  // ---------- Diagram data ----------
  const S = 1.45;
  const raw = [
    ['users', 'users', 235, 190],
    ['r53', 'route53', 390, 80], ['cf', 'cloudfront', 467, 90], ['s3web', 's3', 563, 90],
    ['cog', 'cognito', 386, 158], ['waf', 'waf', 467, 158],
    ['s3up', 's3', 678, 228],
    ['fnApi', 'lambda', 430, 280], ['api', 'apigw', 309, 327], ['ddb', 'dynamodb', 532, 330], ['fnAuth', 'lambda', 427, 380],
    ['sns', 'sns', 770, 322],
    ['q1', 'sqs', 859, 207], ['q2', 'sqs', 857, 285], ['q3', 'sqs', 861, 358], ['q4', 'sqs', 861, 440], ['q5', 'sqs', 862, 510],
    ['fn1', 'lambda', 983, 202], ['fn2', 'lambda', 986, 282], ['fn3', 'lambda', 985, 362], ['fn4', 'lambda', 993, 436], ['fn5', 'lambda', 990, 513],
    ['mc', 'mediaconvert', 1088, 362], ['eb', 'eventbridge', 1188, 427], ['rek', 'rekognition', 1084, 513],
    ['s3out', 's3', 1281, 333],
    ['iam', 'iam', 342, 720], ['kms', 'kms', 437, 720], ['cw', 'cloudwatch', 541, 718], ['ct', 'cloudtrail', 635, 720],
  ];
  const nodes = raw.map(([id, type, x, y]) => ({ id, type, x: x * S, y: y * S }));
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));

  let edges = [
    ['users', 'r53'], ['r53', 'cf'], ['cf', 's3web'], ['waf', 'cf'], ['users', 'cog'],
    ['users', 'api'], ['cog', 'api'], ['api', 'fnApi'], ['api', 'fnAuth'],
    ['fnApi', 'ddb'], ['fnAuth', 'ddb'], ['fnApi', 's3up'], ['s3up', 'sns'], ['fnApi', 'sns'],
    ['sns', 'q1'], ['sns', 'q2'], ['sns', 'q3'], ['sns', 'q4'], ['sns', 'q5'],
    ['q1', 'fn1'], ['q2', 'fn2'], ['q3', 'fn3'], ['q4', 'fn4'], ['q5', 'fn5'],
    ['fn2', 'mc'], ['fn3', 'mc'], ['mc', 's3out'], ['mc', 'eb'], ['eb', 'fn4'],
    ['fn5', 'rek'], ['rek', 'q5'], ['fn1', 's3out'], ['fn3', 'ddb'],
  ];
  const groups = [{ label: 'Security & Observability', ids: ['iam', 'kms', 'cw', 'ct'] }];
  const NW = 74, NH = 58;

  // ---------- Setup guide (procedures per phase) ----------
  const GUIDE = [
    {
      key: 'net', title: '네트워크·보안', sub: '1단계',
      intro: '다른 리소스가 참조하는 권한·암호화·도메인·인증을 먼저 준비합니다. 이 단계가 끝나야 나머지 리소스에 ARN을 연결할 수 있습니다.',
      steps: [
        { id: 'iam', title: 'IAM 역할 & KMS 키 준비', desc: '배포용·실행용 역할과 데이터 암호화 키를 만듭니다.', nodes: ['iam', 'kms'],
          todo: ['배포 파이프라인용 IAM 역할 생성 (최소 권한)', 'Lambda 실행 역할을 함수 그룹별로 분리', 'KMS 고객 관리형 키(CMK) 생성 후 별칭 alias/archimate-data 지정', '키 정책에 Lambda·S3·SQS 서비스 사용 권한 추가'],
          cli: 'aws kms create-key --description "archimate-data"\naws kms create-alias --alias-name alias/archimate-data \\\n  --target-key-id <KEY_ID>\naws iam create-role --role-name archimate-lambda-exec \\\n  --assume-role-policy-document file://trust-lambda.json' },
        { id: 'r53', title: 'Route 53 호스팅 영역 생성', desc: '서비스 도메인의 DNS 영역을 만들고 네임서버를 등록합니다.', nodes: ['r53', 'users'],
          todo: ['퍼블릭 호스팅 영역 생성', '도메인 등록 기관에 NS 레코드 4개 등록', 'dig로 NS 전파 확인'],
          cli: 'aws route53 create-hosted-zone --name example.com \\\n  --caller-reference $(date +%s)' },
        { id: 'acm', title: 'ACM 인증서 발급', desc: 'CloudFront에서 사용할 TLS 인증서를 DNS 검증으로 발급합니다.', nodes: ['cf', 'r53'],
          warn: 'CloudFront용 인증서는 반드시 us-east-1 리전에서 발급해야 합니다.',
          todo: ['us-east-1에서 인증서 요청 (example.com, *.example.com)', 'Route 53에 CNAME 검증 레코드 자동 생성', '상태가 ISSUED가 될 때까지 대기'],
          cli: 'aws acm request-certificate --domain-name example.com \\\n  --subject-alternative-names "*.example.com" \\\n  --validation-method DNS --region us-east-1' },
        { id: 'waf', title: 'WAF Web ACL 구성', desc: 'CloudFront에 붙일 관리형 규칙과 요청 수 제한 규칙을 설정합니다.', nodes: ['waf', 'cf'],
          todo: ['Scope=CLOUDFRONT로 Web ACL 생성 (us-east-1)', 'AWSManagedRulesCommonRuleSet 추가', 'IP당 5분 2,000건 Rate-based 규칙 추가', 'CloudWatch 지표·샘플링 활성화'],
          cli: 'aws wafv2 create-web-acl --name archimate-acl \\\n  --scope CLOUDFRONT --region us-east-1 \\\n  --default-action Allow={} \\\n  --rules file://waf-rules.json \\\n  --visibility-config SampledRequestsEnabled=true,\\\nCloudWatchMetricsEnabled=true,MetricName=archimate-acl' },
        { id: 'cog', title: 'Cognito User Pool 구성', desc: '사용자 가입·로그인과 JWT 발급을 설정합니다.', nodes: ['cog', 'users'],
          todo: ['User Pool 생성 (이메일 로그인, MFA 선택)', '앱 클라이언트 생성 (Client secret 없음, SPA용)', '호스팅 UI 도메인과 콜백 URL 설정'],
          cli: 'aws cognito-idp create-user-pool --pool-name archimate-users \\\n  --auto-verified-attributes email\naws cognito-idp create-user-pool-client \\\n  --user-pool-id <POOL_ID> --client-name web' },
      ],
    },
    {
      key: 'data', title: '스토리지·DB', sub: '2단계',
      intro: '정적 웹, 업로드 원본, 변환 결과물용 버킷과 메타데이터 테이블을 만들고 CloudFront로 웹을 공개합니다.',
      steps: [
        { id: 's3', title: 'S3 버킷 3개 생성', desc: 'web / upload / output 버킷을 용도별로 분리합니다.', nodes: ['s3web', 's3up', 's3out'],
          todo: ['모든 버킷에 퍼블릭 액세스 차단', 'SSE-KMS(alias/archimate-data) 기본 암호화', 'upload 버킷: Presigned PUT용 CORS 설정', 'output 버킷: 90일 후 Glacier 수명 주기 규칙'],
          cli: 'for b in web upload output; do\n  aws s3api create-bucket --bucket archimate-$b \\\n    --region ap-northeast-2 \\\n    --create-bucket-configuration LocationConstraint=ap-northeast-2\ndone' },
        { id: 'cfd', title: 'CloudFront 배포 생성', desc: 'web 버킷을 OAC로 연결하고 WAF·인증서·도메인을 붙입니다.', nodes: ['cf', 's3web', 'waf', 'r53'],
          todo: ['Origin Access Control(OAC) 생성 후 web 버킷 연결', '버킷 정책에 CloudFront 서비스 주체만 허용', '대체 도메인 + ACM 인증서 + WAF ACL 지정', 'Route 53에 A(Alias) 레코드 생성'],
          cli: 'aws cloudfront create-distribution \\\n  --distribution-config file://cf-config.json' },
        { id: 'ddb', title: 'DynamoDB 테이블 생성', desc: '미디어 메타데이터와 처리 상태를 저장합니다.', nodes: ['ddb'],
          todo: ['파티션 키 id(String), 온디맨드 과금', '상태 조회용 GSI (status, createdAt)', 'Point-in-time recovery 활성화'],
          cli: 'aws dynamodb create-table --table-name archimate-media \\\n  --attribute-definitions AttributeName=id,AttributeType=S \\\n  --key-schema AttributeName=id,KeyType=HASH \\\n  --billing-mode PAY_PER_REQUEST' },
      ],
    },
    {
      key: 'compute', title: '컴퓨팅·메시징', sub: '3단계',
      intro: 'API → Lambda → SNS/SQS 팬아웃 → 워커 Lambda → MediaConvert / Rekognition 순서로 이벤트 흐름을 연결합니다.',
      steps: [
        { id: 'api', title: 'API Gateway + Cognito 인증', desc: 'HTTP API를 만들고 JWT Authorizer로 보호합니다.', nodes: ['api', 'cog', 'users'],
          todo: ['HTTP API 생성, CORS 허용 오리진 지정', 'JWT Authorizer: Issuer=Cognito, Audience=앱 클라이언트 ID', '라우트 POST /uploads, GET /media/{id} 생성', 'stage=dev, 자동 배포 활성화'],
          cli: 'aws apigatewayv2 create-api --name archimate-api \\\n  --protocol-type HTTP\naws apigatewayv2 create-authorizer --api-id <API_ID> \\\n  --authorizer-type JWT --name cognito \\\n  --identity-source \'$request.header.Authorization\' \\\n  --jwt-configuration Audience=<CLIENT_ID>,Issuer=<ISSUER_URL>' },
        { id: 'fnapi', title: 'API용 Lambda 배포', desc: '업로드 URL 발급·조회 함수를 배포하고 라우트에 연결합니다.', nodes: ['fnApi', 'fnAuth', 'ddb', 's3up', 'api'],
          todo: ['환경변수 TABLE_NAME, UPLOAD_BUCKET 설정', 'fnApi: s3:PutObject(Presigned), dynamodb:PutItem 권한', 'fnAuth: dynamodb:GetItem/Query 권한', 'API 라우트 통합(Integration) 연결'],
          cli: 'aws lambda create-function --function-name fnApi \\\n  --runtime nodejs20.x --handler index.handler \\\n  --role <EXEC_ROLE_ARN> --zip-file fileb://fnApi.zip \\\n  --environment "Variables={TABLE_NAME=archimate-media}"' },
        { id: 'fanout', title: 'SNS → SQS 팬아웃 구성', desc: '토픽 1개와 큐 5개를 만들고 구독시킵니다.', nodes: ['sns', 'q1', 'q2', 'q3', 'q4', 'q5'],
          todo: ['SNS 토픽 생성 (KMS 암호화)', 'SQS 큐 5개 + 각 큐별 DLQ(maxReceiveCount=5)', '큐 정책에 SNS 토픽 SendMessage 허용', '구독 생성 시 RawMessageDelivery=true'],
          cli: 'aws sns create-topic --name archimate-upload\naws sqs create-queue --queue-name q1 \\\n  --attributes VisibilityTimeout=180\naws sns subscribe --topic-arn <TOPIC_ARN> \\\n  --protocol sqs --notification-endpoint <Q1_ARN> \\\n  --attributes RawMessageDelivery=true' },
        { id: 's3evt', title: 'S3 업로드 이벤트 → SNS', desc: 'upload 버킷의 ObjectCreated 이벤트를 토픽으로 보냅니다.', nodes: ['s3up', 'sns'],
          todo: ['SNS 토픽 정책에 s3.amazonaws.com Publish 허용', '버킷 알림: s3:ObjectCreated:* → 토픽', '테스트 파일 업로드로 메시지 수신 확인'],
          cli: 'aws s3api put-bucket-notification-configuration \\\n  --bucket archimate-upload \\\n  --notification-configuration file://s3-notify.json' },
        { id: 'workers', title: '워커 Lambda ↔ SQS 연결', desc: '큐마다 워커 함수를 이벤트 소스 매핑으로 연결합니다.', nodes: ['q1', 'q2', 'q3', 'q4', 'q5', 'fn1', 'fn2', 'fn3', 'fn4', 'fn5'],
          warn: '큐의 VisibilityTimeout은 함수 Timeout의 6배 이상으로 설정하세요.',
          todo: ['fn1~fn5 배포 (Timeout 30s, Memory 512MB~)', '이벤트 소스 매핑 batch-size=10, ReportBatchItemFailures', '최대 동시성으로 다운스트림 보호'],
          cli: 'aws lambda create-event-source-mapping \\\n  --function-name fn1 --event-source-arn <Q1_ARN> \\\n  --batch-size 10 \\\n  --function-response-types ReportBatchItemFailures' },
        { id: 'mc', title: 'MediaConvert 트랜스코딩', desc: '변환 작업 템플릿과 서비스 역할을 설정합니다.', nodes: ['mc', 'fn2', 'fn3', 's3out'],
          todo: ['MediaConvert 서비스 역할 (upload 읽기 / output 쓰기)', '계정별 엔드포인트 조회 후 Lambda 환경변수에 저장', 'HLS + MP4 출력 Job Template 생성', 'fn2/fn3에 iam:PassRole, mediaconvert:CreateJob 권한'],
          cli: 'aws mediaconvert describe-endpoints\naws mediaconvert create-job-template \\\n  --name archimate-hls --settings file://job-template.json' },
        { id: 'eb', title: 'EventBridge 완료 이벤트 규칙', desc: '작업 완료(COMPLETE) 이벤트를 후처리 함수로 전달합니다.', nodes: ['eb', 'mc', 'fn4'],
          todo: ['source=aws.mediaconvert, status=COMPLETE|ERROR 패턴', '대상: fn4 (DynamoDB 상태 업데이트)', 'Lambda 리소스 정책에 events.amazonaws.com 허용'],
          cli: 'aws events put-rule --name mc-complete --event-pattern \\\n  \'{"source":["aws.mediaconvert"],\n    "detail":{"status":["COMPLETE","ERROR"]}}\'\naws events put-targets --rule mc-complete \\\n  --targets Id=fn4,Arn=<FN4_ARN>' },
        { id: 'rek', title: 'Rekognition 분석 연결', desc: 'fn5가 이미지/영상 분석 결과를 큐로 돌려보내도록 설정합니다.', nodes: ['fn5', 'rek', 'q5'],
          todo: ['fn5 역할에 rekognition:DetectLabels, DetectModerationLabels 권한', '영상 분석은 StartLabelDetection + SNS 완료 알림 사용', '결과를 DynamoDB에 저장'],
          cli: 'aws rekognition detect-labels \\\n  --image "S3Object={Bucket=archimate-upload,Name=sample.jpg}"' },
      ],
    },
    {
      key: 'ops', title: '운영·배포', sub: '4단계',
      intro: '모니터링과 감사 로그를 켠 뒤 스택을 배포하고 끝단까지 동작을 검증합니다.',
      steps: [
        { id: 'cw', title: 'CloudWatch 로그·알람', desc: '로그 보존 기간과 핵심 알람을 설정합니다.', nodes: ['cw', 'fn1', 'q1'],
          todo: ['모든 Lambda 로그 그룹 보존 30일', 'DLQ ApproximateNumberOfMessagesVisible > 0 알람', 'Lambda Errors / Throttles 알람 → SNS 이메일', '서비스 대시보드 생성'],
          cli: 'aws logs put-retention-policy \\\n  --log-group-name /aws/lambda/fn1 --retention-in-days 30' },
        { id: 'ct', title: 'CloudTrail 감사 로그', desc: '모든 리전의 관리 이벤트를 기록합니다.', nodes: ['ct'],
          todo: ['멀티 리전 Trail 생성', '로그 파일 무결성 검증 활성화', '전용 S3 버킷 + KMS 암호화'],
          cli: 'aws cloudtrail create-trail --name archimate-trail \\\n  --s3-bucket-name archimate-audit --is-multi-region-trail \\\n  --enable-log-file-validation\naws cloudtrail start-logging --name archimate-trail' },
        { id: 'deploy', title: '스택 배포 & 동작 검증', desc: 'Deploy 버튼으로 배포 후 업로드 → 변환 → 조회까지 확인합니다.', nodes: ['api', 'cf', 's3up', 'mc', 's3out'],
          todo: ['우측 상단 Deploy 실행', '웹 도메인 접속 후 로그인 확인', '샘플 영상 업로드 → output 버킷에 HLS 생성 확인', 'GET /media/{id} 상태 COMPLETE 확인'],
          cli: 'curl -H "Authorization: Bearer $TOKEN" \\\n  https://api.example.com/media/<ID>' },
      ],
    },
  ];
  const allSteps = GUIDE.flatMap(t => t.steps.map(s => ({ ...s, tab: t.key })));

  // ---------- State ----------
  const state = {
    tx: 0, ty: 0, scale: 1,
    selected: null, focus: new Set(),
    tab: 'net', openStep: null,
    edit: false, deployed: false,
    done: new Set(),
  };
  try { JSON.parse(localStorage.getItem('archimate-done') || '[]').forEach(id => state.done.add(id)); } catch {}
  const saveDone = () => { try { localStorage.setItem('archimate-done', JSON.stringify([...state.done])); } catch {} };

  // ---------- DOM ----------
  const $ = s => document.querySelector(s);
  const canvas = $('#canvas'), world = $('#world'), nodesEl = $('#nodes'), edgesEl = $('#edges');
  const panelBody = $('#panelBody'), tabsEl = $('#tabs');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const svg = icon => `<svg viewBox="0 0 24 24">${ICON[icon]}</svg>`;

  // ---------- Canvas render ----------
  function renderNodes() {
    nodesEl.innerHTML = '';
    groups.forEach(g => {
      const ns = g.ids.map(id => byId[id]).filter(Boolean);
      if (!ns.length) return;
      const pad = 14;
      const x1 = Math.min(...ns.map(n => n.x)) - pad, y1 = Math.min(...ns.map(n => n.y)) - pad;
      const x2 = Math.max(...ns.map(n => n.x + NW)) + pad, y2 = Math.max(...ns.map(n => n.y + NH)) + pad;
      const box = document.createElement('div');
      box.className = 'group-box';
      Object.assign(box.style, { left: x1 + 'px', top: y1 + 'px', width: x2 - x1 + 'px', height: y2 - y1 + 'px' });
      box.innerHTML = `<span>${g.label}</span>`;
      nodesEl.appendChild(box);
    });
    nodes.forEach(n => {
      const t = TYPES[n.type], cat = CAT[t.cat];
      const el = document.createElement('div');
      el.className = 'node';
      el.dataset.id = n.id;
      el.style.cssText = `left:${n.x}px;top:${n.y}px;--c:${cat.c}`;
      el.innerHTML = `<div class="tile">${svg(t.icon)}</div><div class="name">${t.name}</div><div class="cat">${cat.label}</div><i class="port"></i>`;
      nodesEl.appendChild(el);
      n.el = el;
    });
    paintHighlight();
  }

  function route(a, b) {
    const ac = { x: a.x + NW / 2, y: a.y + NH / 2 }, bc = { x: b.x + NW / 2, y: b.y + NH / 2 };
    const dx = bc.x - ac.x, dy = bc.y - ac.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      const sx = dx > 0 ? a.x + NW : a.x, tx = dx > 0 ? b.x : b.x + NW;
      const mx = Math.round((sx + tx) / 2);
      return `M${sx} ${ac.y}H${mx}V${bc.y}H${tx}`;
    }
    const sy = dy > 0 ? a.y + NH : a.y, ty = dy > 0 ? b.y : b.y + NH;
    const my = Math.round((sy + ty) / 2);
    return `M${ac.x} ${sy}V${my}H${bc.x}V${ty}`;
  }

  function renderEdges() {
    const f = state.focus, sel = state.selected;
    const hit = (a, b) => sel ? (a === sel || b === sel) : (f.has(a) && f.has(b));
    edgesEl.classList.toggle('dim', !!sel || f.size > 0);
    edgesEl.innerHTML = edges.filter(([a, b]) => byId[a] && byId[b]).map(([a, b]) =>
      `<path${hit(a, b) ? ' class="hl"' : ''} d="${route(byId[a], byId[b])}"/>`).join('');
  }

  function paintHighlight() {
    nodes.forEach(n => {
      n.el.classList.toggle('selected', n.id === state.selected);
      n.el.classList.toggle('focus', state.focus.has(n.id));
      n.el.classList.toggle('deployed', state.deployed && !!TYPES[n.type].tf);
    });
    nodesEl.classList.toggle('dim', state.focus.size > 0);
    renderEdges();
  }

  // ---------- Viewport ----------
  function applyView() {
    world.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
    const g = 16 * state.scale;
    canvas.style.backgroundSize = `${g}px ${g}px, 100% 100%`;
    canvas.style.backgroundPosition = `${state.tx}px ${state.ty}px, 0 0`;
  }
  function zoomAt(factor, cx, cy) {
    const ns = Math.min(3, Math.max(0.3, state.scale * factor)), k = ns / state.scale;
    state.tx = cx - (cx - state.tx) * k; state.ty = cy - (cy - state.ty) * k; state.scale = ns;
    applyView();
  }
  // 채팅 창이 넓어 캔버스가 좁아지면 상단 바의 배포 상태 칩을 숨긴다
  function updateTopbar() {
    const r = canvas.getBoundingClientRect(), chatEl = $('#chat');
    const docked = !chatEl.hidden && !chatEl.classList.contains('floating');
    document.querySelector('.topbar').classList.toggle('compact', r.width - (docked ? chatEl.offsetWidth : 0) - 48 < 560);
  }

  // 화면에 보이는 캔버스 영역 (채팅 창과 상단 바에 가려지는 부분 제외)
  function visibleBox() {
    const r = canvas.getBoundingClientRect(), chatEl = $('#chat');
    const left = !chatEl.hidden && r.width > 760 ? chatEl.offsetLeft + chatEl.offsetWidth + 8 : 0;
    const top = 76;
    return { left, top, w: r.width - left, h: r.height - top };
  }

  // 원 상태 복귀용 뷰 저장 / 부드러운 이동
  let animT;
  function animateTo(v) {
    canvas.classList.add('view-anim');
    state.tx = v.tx; state.ty = v.ty; state.scale = v.scale;
    applyView();
    clearTimeout(animT); animT = setTimeout(() => canvas.classList.remove('view-anim'), 520);
  }
  // 설정 단계에서 강조된 서비스로 확대 (처음 한 번만 현재 뷰를 저장)
  function zoomToFocus() {
    const ns = nodes.filter(n => state.focus.has(n.id));
    if (!ns.length) return;
    if (!state.homeView) state.homeView = { tx: state.tx, ty: state.ty, scale: state.scale };
    const { left, top, w, h } = visibleBox(), pad = 56, m = 24;
    const x1 = Math.min(...ns.map(n => n.x)) - pad, y1 = Math.min(...ns.map(n => n.y)) - pad;
    const x2 = Math.max(...ns.map(n => n.x + NW)) + pad, y2 = Math.max(...ns.map(n => n.y + NH)) + pad;
    const aw = w - m * 2, ah = h - m * 2;
    const scale = Math.min(aw / (x2 - x1), ah / (y2 - y1), 2.2);
    animateTo({
      scale,
      tx: left + m + (aw - (x2 - x1) * scale) / 2 - x1 * scale,
      ty: top + m + (ah - (y2 - y1) * scale) / 2 - y1 * scale,
    });
  }
  function restoreHome() {
    if (!state.homeView) return;
    const v = state.homeView; state.homeView = null;
    animateTo(v);
  }
  // 강조 서비스가 있으면 확대, 없으면 원래 뷰로 복귀
  const syncCamera = () => (state.focus.size ? zoomToFocus() : restoreHome());

  function fit() {
    state.homeView = null;
    const r = canvas.getBoundingClientRect();
    const { left, top, w, h } = visibleBox();
    const x1 = Math.min(...nodes.map(n => n.x)) - 30, y1 = Math.min(...nodes.map(n => n.y)) - 40;
    const x2 = Math.max(...nodes.map(n => n.x + NW)) + 30, y2 = Math.max(...nodes.map(n => n.y + NH)) + 30;
    state.scale = Math.min(w / (x2 - x1), h / (y2 - y1), 1.6);
    state.tx = left + (w - (x2 - x1) * state.scale) / 2 - x1 * state.scale;
    state.ty = top + (h - (y2 - y1) * state.scale) / 2 - y1 * state.scale;
    applyView();
  }
  const center = () => { const r = canvas.getBoundingClientRect(); return [r.width / 2, r.height / 2]; };
  $('#zoomIn').onclick = () => zoomAt(1.2, ...center());
  $('#zoomOut').onclick = () => zoomAt(1 / 1.2, ...center());
  $('#zoomFit').onclick = fit;

  // ---------- Pointer: pan / drag / select ----------
  let drag = null;
  canvas.addEventListener('pointerdown', e => {
    if (e.target.closest('.topbar, .zoom, .chat, .chat-fab')) return;
    canvas.classList.remove('view-anim');
    const nodeEl = e.target.closest('.node');
    if (nodeEl) {
      const n = byId[nodeEl.dataset.id];
      drag = { kind: 'node', n, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y, moved: false };
    } else {
      drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: state.tx, oy: state.ty, moved: false };
      canvas.classList.add('panning');
    }
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    movePresence(e);
    if (!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    if (drag.kind === 'pan') { state.tx = drag.ox + dx; state.ty = drag.oy + dy; applyView(); }
    else if (state.edit && drag.moved) {
      const n = drag.n;
      n.x = Math.round((drag.ox + dx / state.scale) / 8) * 8;
      n.y = Math.round((drag.oy + dy / state.scale) / 8) * 8;
      n.el.style.left = n.x + 'px'; n.el.style.top = n.y + 'px';
      renderEdges();
    }
  });
  canvas.addEventListener('pointerup', () => {
    if (!drag) return;
    canvas.classList.remove('panning');
    if (!drag.moved) selectNode(drag.kind === 'node' ? drag.n.id : null);
    else if (drag.kind === 'node' && state.edit) renderNodes();
    drag = null;
  });
  canvas.addEventListener('wheel', e => {
    if (e.target.closest('.chat')) return;
    canvas.classList.remove('view-anim');
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  const presence = $('#presence');
  function movePresence(e) {
    const r = canvas.getBoundingClientRect();
    presence.style.left = e.clientX - r.left + 18 + 'px';
    presence.style.top = e.clientY - r.top + 18 + 'px';
  }

  // Node click → highlight + jump to its guide step + chat context
  function selectNode(id) {
    state.selected = id;
    state.focus = new Set();
    if (id) {
      const step = allSteps.find(s => s.nodes.includes(id));
      if (step) openStep(step.id, { fromNode: true });
      const t = TYPES[byId[id].type];
      $('#chatCtx').textContent = `컨텍스트: ${id} (${t.name})`;
    } else {
      state.openStep = null;
      $('#chatCtx').textContent = '컨텍스트: 전체 스택';
      renderGuide();
    }
    paintHighlight();
    syncCamera();
  }

  // ---------- Guide panel ----------
  function renderTabs() {
    tabsEl.innerHTML = GUIDE.map(t => {
      const d = t.steps.filter(s => state.done.has(s.id)).length;
      return `<button class="tab${t.key === state.tab ? ' active' : ''}" data-tab="${t.key}">${t.title}<small>${t.sub} · ${d}/${t.steps.length}</small></button>`;
    }).join('');
    const total = allSteps.length, done = allSteps.filter(s => state.done.has(s.id)).length;
    $('#progBar').style.width = (done / total * 100) + '%';
    $('#progText').textContent = `${done} / ${total} 완료`;
  }
  tabsEl.addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    state.tab = b.dataset.tab; state.openStep = null; state.focus = new Set(); state.selected = null;
    renderGuide(); paintHighlight(); syncCamera();
  });

  function renderGuide() {
    renderTabs();
    const tab = GUIDE.find(t => t.key === state.tab);
    panelBody.innerHTML = `<p class="tab-intro">${tab.intro}</p>` + tab.steps.map((s, i) => {
      const open = state.openStep === s.id, done = state.done.has(s.id);
      const chips = s.nodes.filter(id => byId[id]).map(id => `<span style="--c:${CAT[TYPES[byId[id].type].cat].c}"><i></i>${id}</span>`).join('');
      return `<div class="step${open ? ' open' : ''}${done ? ' done' : ''}" data-step="${s.id}">
        <div class="step-head">
          <button class="check" data-check title="완료 표시">${done ? '✓' : i + 1}</button>
          <div><div class="step-title">${s.title}</div><div class="step-desc">${s.desc}</div><div class="step-svcs">${chips}</div></div>
          <svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="step-body">
          ${s.warn ? `<div class="warn">⚠ ${s.warn}</div>` : ''}
          <ol>${s.todo.map(t => `<li>${t}</li>`).join('')}</ol>
          <div class="code-wrap"><pre class="code">${esc(s.cli)}</pre><button class="copy" data-copy>Copy</button></div>
          <div class="step-actions">
            <button class="btn btn-primary" data-check>${done ? '완료 취소' : '완료로 표시'}</button>
            <button class="btn btn-ghost" data-ask>AI에게 묻기</button>
          </div>
        </div>
      </div>`;
    }).join('');
    const openEl = panelBody.querySelector('.step.open');
    if (openEl) openEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  panelBody.addEventListener('click', e => {
    const stepEl = e.target.closest('.step'); if (!stepEl) return;
    const id = stepEl.dataset.step, step = allSteps.find(s => s.id === id);
    if (e.target.closest('[data-check]')) {
      state.done.has(id) ? state.done.delete(id) : state.done.add(id);
      saveDone(); renderGuide();
      if (state.done.has(id)) toast(`✓ ${step.title}`);
      return;
    }
    if (e.target.closest('[data-copy]')) {
      navigator.clipboard?.writeText(step.cli).then(() => toast('명령어를 복사했습니다'), () => toast('복사 실패'));
      return;
    }
    if (e.target.closest('[data-ask]')) { showChat(); ask(`"${step.title}" 단계 자세히 설명해줘`); return; }
    if (e.target.closest('.step-body')) return;
    state.openStep === id ? closeStep() : openStep(id);
  });

  function openStep(id, { fromNode = false } = {}) {
    const step = allSteps.find(s => s.id === id); if (!step) return;
    state.tab = step.tab; state.openStep = id;
    if (!fromNode) { state.selected = null; state.focus = new Set(step.nodes); }
    renderGuide(); paintHighlight(); syncCamera();
  }
  function closeStep() { state.openStep = null; state.focus = new Set(); renderGuide(); paintHighlight(); syncCamera(); }

  // ---------- AI chat (non-modal) ----------
  const chat = $('#chat'), log = $('#chatLog'), input = $('#chatText'), fab = $('#chatFab');

  function addMsg(who, html) {
    const m = document.createElement('div');
    m.className = `msg ${who}`;
    m.innerHTML = html;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }
  const ref = id => { const s = allSteps.find(x => x.id === id); return s ? `<button class="ref" data-ref="${id}">↗ ${s.title}</button>` : ''; };
  log.addEventListener('click', e => { const b = e.target.closest('[data-ref]'); if (b) openStep(b.dataset.ref); });

  function greet() {
    log.innerHTML = ''; viewing = 'live';
    addMsg('ai', `안녕하세요! 현재 스택은 서비스 ${nodes.length}개, 설정 단계 ${allSteps.length}개로 구성돼 있어요.\n오른쪽 가이드를 따라가다 막히면 물어보세요. 캔버스에서 서비스를 클릭하면 그 서비스 기준으로 답해 드립니다.\n\n먼저 시작할 단계: ${ref(nextStep()?.id || 'iam')}`);
  }
  const nextStep = () => allSteps.find(s => !state.done.has(s.id));

  function reply(q) {
    const lc = q.toLowerCase();
    const sel = state.selected && byId[state.selected];

    if (/dlq|dead/.test(lc)) {
      const id = 'dlq' + (nodes.filter(n => n.id.startsWith('dlq')).length + 1);
      const n = { id, type: 'sqs', x: 862 * S - 120, y: 600 * S };
      nodes.push(n); byId[id] = n; edges.push(['q5', id]);
      renderNodes(); state.focus = new Set(['q5', id]); paintHighlight();
      return `q5 아래에 Dead-letter queue <b>${id}</b>를 추가했어요.\n• maxReceiveCount = 5\n• 메시지 보존 14일\nDLQ 알람은 다음 단계에서 설정하면 됩니다. ${ref('cw')}`;
    }
    if (/비용|가격|cost|price|요금/.test(lc)) {
      const agg = {};
      nodes.forEach(x => { const t = TYPES[x.type]; agg[t.name] = (agg[t.name] || 0) + t.cost; });
      const top = Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const total = Object.values(agg).reduce((a, b) => a + b, 0);
      return `저트래픽 기준 월 예상 비용은 약 <b>$${total.toFixed(2)}</b>이에요.\n상위 항목:\n${top.map(([k, v]) => `• ${k} — $${v.toFixed(2)}`).join('\n')}\n\nMediaConvert가 가장 크니 출력 해상도 수를 줄이면 효과가 커요.`;
    }
    if (/다음|뭘|무엇|next|어디/.test(lc)) {
      const s = nextStep();
      if (!s) return '모든 단계를 완료했어요 🎉 Deploy 후 CloudWatch 대시보드를 확인해 보세요.';
      openStep(s.id);
      return `다음은 <b>${GUIDE.find(t => t.key === s.tab).title}</b> 탭의 "${s.title}" 단계예요.\n${s.desc}\n\n관련 서비스를 캔버스에서 강조해 뒀어요. ${ref(s.id)}`;
    }
    const m = q.match(/"(.+?)"/);
    const stepByTitle = m && allSteps.find(s => s.title === m[1]);
    if (stepByTitle) {
      return `<b>${stepByTitle.title}</b>\n${stepByTitle.desc}\n\n${stepByTitle.todo.map((t, i) => `${i + 1}. ${t}`).join('\n')}${stepByTitle.warn ? `\n\n⚠ ${stepByTitle.warn}` : ''}\n\nCLI 명령어는 가이드 카드에서 복사할 수 있어요. ${ref(stepByTitle.id)}`;
    }
    const key = Object.keys(TYPES).find(k => lc.includes(k) || lc.includes(TYPES[k].name.toLowerCase().replace(/^(amazon|aws) /, '')));
    const target = key ? nodes.find(n => n.type === key) : sel;
    if (target) {
      const t = TYPES[target.type];
      const steps = allSteps.filter(s => s.nodes.includes(target.id));
      const ins = edges.filter(e => e[1] === target.id).map(e => e[0]);
      const outs = edges.filter(e => e[0] === target.id).map(e => e[1]);
      return `<b>${t.name}</b> (${target.id})\n${t.role}\n\n• 입력: ${ins.join(', ') || '—'}\n• 출력: ${outs.join(', ') || '—'}\n\n관련 설정 단계:\n${steps.map(s => ref(s.id)).join('') || '—'}`;
    }
    if (/구조|아키텍처|설명|흐름|architecture/.test(lc)) {
      return '전체 흐름은 이렇습니다.\n1. 사용자 → Route 53 → CloudFront(WAF) → S3 정적 웹\n2. 로그인은 Cognito, API는 API Gateway → Lambda → DynamoDB\n3. 업로드된 파일 → S3 이벤트 → SNS → SQS 5개로 팬아웃\n4. 워커 Lambda가 MediaConvert(영상 변환), Rekognition(분석) 실행\n5. 완료 이벤트는 EventBridge → Lambda가 상태 업데이트';
    }
    return `"${esc(q)}"에 대해서는 프로토타입이라 아직 답을 준비하지 못했어요.\n이런 걸 물어보세요:\n• 다음에 뭘 설정해야 해?\n• SQS / Lambda / CloudFront 설명\n• DLQ 추가해줘\n• 월 예상 비용`;
  }

  function ask(q) {
    if (!q.trim()) return;
    if (viewing !== 'live') openConversation('live');
    addMsg('me', esc(q));
    const typing = addMsg('ai typing', '<span></span><span></span><span></span>');
    setTimeout(() => { typing.remove(); addMsg('ai', reply(q)); }, 550 + Math.random() * 400);
  }

  $('#chatForm').addEventListener('submit', e => { e.preventDefault(); ask(input.value); input.value = ''; input.style.height = ''; });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#chatForm').requestSubmit(); } });
  input.addEventListener('input', () => { input.style.height = ''; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; });
  $('#suggests').addEventListener('click', e => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
  // --- 대화 기록 삭제 (확인 모달) ---
  const confirmModal = $('#confirmModal');
  $('#chatClear').onclick = () => { closeHistory(); confirmModal.hidden = false; $('#confirmCancel').focus(); };
  $('#confirmCancel').onclick = () => { confirmModal.hidden = true; };
  confirmModal.onclick = e => { if (e.target === confirmModal) confirmModal.hidden = true; };
  $('#confirmOk').onclick = () => { confirmModal.hidden = true; liveHTML = null; greet(); toast('대화 기록을 삭제했어요'); };

  // --- 대화 기록 리스트 (목 데이터) ---
  const CHAT_HISTORY = [
    { id: 'h1', title: 'DLQ 추가 방법 문의', when: '오늘 14:20', msgs: [
      ['me', 'SQS에 DLQ 추가해줘'],
      ['ai', 'q5 아래에 Dead-letter queue <b>dlq1</b>를 추가했어요.\n• maxReceiveCount = 5\n• 메시지 보존 14일'] ] },
    { id: 'h2', title: '월 예상 비용 확인', when: '어제 18:05', msgs: [
      ['me', '월 예상 비용 알려줘'],
      ['ai', '저트래픽 기준 월 예상 비용은 약 <b>$42.10</b>이에요.\nMediaConvert가 가장 크니 출력 해상도 수를 줄이면 효과가 커요.'] ] },
    { id: 'h3', title: 'Cognito 설정 순서', when: '11월 21일', msgs: [
      ['me', '다음에 뭘 설정해야 해?'],
      ['ai', '다음은 <b>네트워크·보안</b> 탭의 "Cognito User Pool 구성" 단계예요.\n사용자 가입·로그인과 JWT 발급을 설정합니다.'] ] },
  ];
  const histEl = $('#chatHistory'), histBtn = $('#chatHistoryBtn');
  let liveHTML = null, viewing = 'live';
  function renderHistory() {
    histEl.innerHTML = '<h5>대화 기록</h5>' +
      `<button data-h="live" class="${viewing === 'live' ? 'current' : ''}"><b>현재 대화</b><small>지금 진행 중</small></button>` +
      CHAT_HISTORY.map(h => `<button data-h="${h.id}" class="${viewing === h.id ? 'current' : ''}"><b>${h.title}</b><small>${h.when}</small></button>`).join('');
  }
  function closeHistory() { histEl.hidden = true; histBtn.classList.remove('on'); histBtn.setAttribute('aria-expanded', 'false'); }
  histBtn.onclick = e => {
    e.stopPropagation();
    if (!histEl.hidden) return closeHistory();
    renderHistory(); histEl.hidden = false; histBtn.classList.add('on'); histBtn.setAttribute('aria-expanded', 'true');
  };
  histEl.onclick = e => {
    e.stopPropagation();
    const b = e.target.closest('[data-h]'); if (!b) return;
    openConversation(b.dataset.h); closeHistory();
  };
  document.addEventListener('click', e => { if (!e.target.closest('#chatHistory')) closeHistory(); });
  function openConversation(id) {
    if (id === viewing) return;
    if (viewing === 'live') liveHTML = log.innerHTML;
    if (id === 'live') { if (liveHTML !== null) log.innerHTML = liveHTML; else greet(); }
    else {
      const h = CHAT_HISTORY.find(x => x.id === id);
      log.innerHTML = '';
      h.msgs.forEach(([who, text]) => addMsg(who, who === 'me' ? esc(text) : text));
    }
    viewing = id; log.scrollTop = log.scrollHeight;
  }

  function showChat() { chat.hidden = false; fab.hidden = true; updateTopbar(); }
  $('#chatClose').onclick = () => { closeHistory(); chat.hidden = true; fab.hidden = false; updateTopbar(); };
  fab.onclick = () => { showChat(); input.focus(); };

  // --- 폭 조절 (모서리 끌기, 더블클릭: 기본 폭) ---
  const rootEl = document.documentElement;
  const appEl = document.querySelector('.app');
  const WIDTH = { chat: { min: 340, max: 0.40, key: 'archimate-chat-w', css: '--chat-w' },
                  guide: { min: 380, max: 0.45, key: 'archimate-guide-w', css: '--guide-w' } };
  const narrow = () => matchMedia('(max-width: 760px)').matches;
  const guideWidth = () => appEl.classList.contains('guide-closed') ? 0 : document.querySelector('.panel').offsetWidth;
  const chatWidth = () => chat.hidden ? 0 : chat.offsetWidth;
  function limits(kind) {
    const W = innerWidth, c = WIDTH[kind];
    const other = kind === 'chat' ? guideWidth() : chatWidth();
    return [c.min, Math.max(c.min, Math.min(W * c.max, W * 0.70 - other))];
  }
  const clampW = (kind, w) => { const [lo, hi] = limits(kind); return Math.round(Math.min(hi, Math.max(lo, w))); };
  function setWidth(kind, w) { rootEl.style.setProperty(WIDTH[kind].css, w + 'px'); }
  function resetWidth(kind) {
    rootEl.style.removeProperty(WIDTH[kind].css);
    try { localStorage.removeItem(WIDTH[kind].key); } catch {}
  }
  function restoreWidths() {
    if (narrow()) return;
    ['chat', 'guide'].forEach(kind => {
      let v = null;
      try { v = parseFloat(localStorage.getItem(WIDTH[kind].key)); } catch {}
      if (Number.isFinite(v)) setWidth(kind, clampW(kind, v));
    });
  }
  function bindGrip(gripEl, kind, dir) {
    const getStart = () => kind === 'chat' ? chat.offsetWidth : document.querySelector('.panel').offsetWidth;
    gripEl.addEventListener('pointerdown', e => {
      if (narrow() || e.button > 0) return;
      e.preventDefault(); e.stopPropagation();
      const sx = e.clientX, sw = getStart();
      let w = sw;
      gripEl.classList.add('active'); appEl.classList.add('resizing'); document.body.classList.add('resizing');
      const move = ev => { w = clampW(kind, sw + dir * (ev.clientX - sx)); setWidth(kind, w); };
      const up = () => {
        removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
        gripEl.classList.remove('active'); appEl.classList.remove('resizing'); document.body.classList.remove('resizing');
        try { localStorage.setItem(WIDTH[kind].key, String(w)); } catch {}
        updateTopbar();
      };
      addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    });
    gripEl.addEventListener('dblclick', () => { resetWidth(kind); updateTopbar(); toast('기본 폭으로 되돌렸어요'); });
  }
  bindGrip($('#chatGrip'), 'chat', +1);    // 채팅 창: 오른쪽 모서리를 오른쪽으로 끌면 넓어짐
  bindGrip($('#guideGrip'), 'guide', -1);  // 설정 가이드: 왼쪽 모서리를 왼쪽으로 끌면 넓어짐
  restoreWidths();

  // --- 설정 가이드 패널 닫기/열기 ---
  const guideClose = $('#guideClose');
  guideClose.onclick = () => {
    const closed = appEl.classList.toggle('guide-closed');
    guideClose.title = guideClose.ariaLabel = closed ? '설정 가이드 열기' : '설정 가이드 닫기';
    setTimeout(updateTopbar, 280);
  };

  // drag chat window by its header (stays non-modal; canvas remains usable)
  $('#chatHead').addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const cr = canvas.getBoundingClientRect(), r = chat.getBoundingClientRect();
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    chat.classList.add('floating'); updateTopbar();
    const move = ev => {
      const x = Math.max(0, Math.min(ev.clientX - cr.left - ox, cr.width - r.width));
      const y = Math.max(0, Math.min(ev.clientY - cr.top - oy, cr.height - 120));
      chat.style.left = x + 'px'; chat.style.top = y + 'px';
    };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  });

  // ---------- Top bar ----------
  const modeBtn = $('#modeToggle');
  function toggleEdit() {
    state.edit = !state.edit;
    canvas.classList.toggle('edit', state.edit);
    modeBtn.classList.toggle('pill-warn', !state.edit);
    modeBtn.classList.toggle('pill-edit', state.edit);
    modeBtn.querySelector('span').textContent = state.edit ? 'Editing' : 'View only';
    toast(state.edit ? 'Edit mode — 서비스를 드래그해 이동' : 'View only');
  }
  modeBtn.onclick = toggleEdit;

  const menu = $('#stackMenu');
  $('#stackSelect').onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; };
  menu.onclick = e => {
    const b = e.target.closest('[data-stack]'); if (!b) return;
    $('#stackName').textContent = b.dataset.stack; menu.hidden = true;
    $('#guideSub').textContent = `${b.dataset.stack} · ap-northeast-2`;
    toast(`Switched to ${b.dataset.stack}`);
  };
  document.addEventListener('click', () => { menu.hidden = true; });
  $('#bellBtn').onclick = () => { $('#bellDot').hidden = true; toast(state.deployed ? 'Deployment completed successfully' : 'No new notifications'); };

  // ---------- Deploy ----------
  const deployBtn = $('#deployBtn'), status = $('#deployStatus');
  deployBtn.onclick = async () => {
    deployBtn.disabled = true; state.deployed = false; paintHighlight();
    const targets = nodes.filter(n => TYPES[n.type].tf);
    status.className = 'pill';
    for (let i = 0; i < targets.length; i++) {
      status.textContent = `Deploying… ${i + 1}/${targets.length}`;
      targets[i].el.classList.add('deploying');
      await new Promise(r => setTimeout(r, 80));
      targets[i].el.classList.remove('deploying');
      targets[i].el.classList.add('deployed');
    }
    state.deployed = true;
    status.textContent = 'Stack deployed ✓'; status.className = 'pill ok';
    deployBtn.disabled = false; $('#bellDot').hidden = false;
    state.done.add('deploy'); saveDone(); renderGuide();
    addMsg('ai', `배포가 완료됐어요 ✅ 리소스 ${targets.length}개가 생성되었습니다.\n이제 동작 검증을 진행해 보세요. ${ref('deploy')}`);
    showChat();
  };

  // ---------- Theme ----------
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem('archimate-theme'); } catch {}
  root.dataset.theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  $('#themeSwitch').onclick = () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('archimate-theme', root.dataset.theme); } catch {}
  };

  // ---------- Shortcuts ----------
  const modal = $('#shortcutsModal');
  $('#shortcutsBtn').onclick = () => { modal.hidden = false; };
  modal.onclick = e => { if (e.target === modal || e.target.hasAttribute('data-close')) modal.hidden = true; };
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.key === '+' || e.key === '=') zoomAt(1.2, ...center());
    else if (e.key === '-') zoomAt(1 / 1.2, ...center());
    else if (e.key === '0') fit();
    else if (e.key.toLowerCase() === 'e') toggleEdit();
    else if (e.key === '/') { e.preventDefault(); showChat(); input.focus(); }
    else if (e.key === 'Escape') { selectNode(null); closeStep(); modal.hidden = true; confirmModal.hidden = true; closeHistory(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && state.edit && state.selected) {
      const id = state.selected;
      nodes.splice(nodes.findIndex(n => n.id === id), 1); delete byId[id];
      edges = edges.filter(([a, b]) => a !== id && b !== id);
      state.selected = null; renderNodes(); renderGuide();
      toast(`Deleted ${id}`);
    }
  });

  // ---------- Toast ----------
  let tt;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 1800);
  }

  // ---------- Init ----------
  renderNodes(); renderGuide(); greet(); fit(); updateTopbar();
  addEventListener('resize', () => { restoreWidths(); updateTopbar(); });
})();
