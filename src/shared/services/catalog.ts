/** 백엔드 계약의 `serviceType` 21종 (contracts/design_job.schema.json). */
export const AWS_SERVICE_TYPES = [
    'users',
    'lambda',
    's3',
    'dynamodb',
    'rds',
    'ec2',
    'cloudfront',
    'api_gateway',
    'alb',
    'ecs_fargate',
    'nat_gateway',
    'elasticache',
    'cognito',
    'route53',
    'sqs',
    'sns',
    'eventbridge',
    'cloudwatch',
    'secrets_manager',
    'ses',
    'bedrock',
] as const;
export type AwsServiceType = (typeof AWS_SERVICE_TYPES)[number];

/** 화면에서 쓰는 서비스 분류. AWS 공식 아이콘 분류 색과 맞춘다. */
export type ServiceCategory =
    | 'compute'
    | 'storage'
    | 'networking'
    | 'security'
    | 'messaging'
    | 'database'
    | 'ml'
    | 'mgmt'
    | 'general';

export const CATEGORY_COLOR: Record<ServiceCategory, string> = {
    compute: '#ED7100',
    storage: '#7AA116',
    networking: '#8C4FFF',
    security: '#DD344C',
    messaging: '#E7157B',
    database: '#C925D1',
    ml: '#01A88D',
    mgmt: '#E7157B',
    general: '#5A6B86',
};

/** 노드 설명 API(`node_explanation.schema.json`)의 `category` 값 */
export type ExplanationCategory =
    | 'external'
    | 'network'
    | 'compute'
    | 'storage'
    | 'database'
    | 'security'
    | 'integration'
    | 'monitoring'
    | 'ai';

const EXPLANATION_CATEGORY: Record<ServiceCategory, ExplanationCategory> = {
    compute: 'compute',
    storage: 'storage',
    networking: 'network',
    security: 'security',
    messaging: 'integration',
    database: 'database',
    ml: 'ai',
    mgmt: 'monitoring',
    general: 'external',
};

export interface ServiceInfo {
    type: AwsServiceType;
    /** AWS 서비스 이름 */
    name: string;
    /** 직접 구성 캔버스에서 블록 이름으로 쓰는 한글 이름 */
    ko: string;
    category: ServiceCategory;
    /** 아이콘 키. 실제 그림은 캔버스 기능에서 이 키로 찾는다. */
    icon: string;
    /** 초보자용 한 줄 역할 설명 */
    role: string;
}

// 서비스를 추가할 때는 이 표에 한 줄만 더하면 팔레트, 색, 이름이 함께 따라온다.
export const SERVICE_CATALOG: Record<AwsServiceType, ServiceInfo> = {
    users: {
        type: 'users',
        name: 'Users',
        ko: '사용자',
        category: 'general',
        icon: 'users',
        role: '서비스를 사용하는 최종 사용자입니다.',
    },
    lambda: {
        type: 'lambda',
        name: 'AWS Lambda',
        ko: '서버리스 함수',
        category: 'compute',
        icon: 'lambda',
        role: '이벤트가 있을 때만 실행되는 서버리스 함수입니다.',
    },
    ec2: {
        type: 'ec2',
        name: 'Amazon EC2',
        ko: '가상 서버',
        category: 'compute',
        icon: 'server',
        role: '직접 관리하는 가상 서버입니다.',
    },
    ecs_fargate: {
        type: 'ecs_fargate',
        name: 'Amazon ECS Fargate',
        ko: '컨테이너',
        category: 'compute',
        icon: 'container',
        role: '서버 관리 없이 컨테이너를 실행합니다.',
    },
    s3: {
        type: 's3',
        name: 'Amazon S3',
        ko: '파일 저장소',
        category: 'storage',
        icon: 'bucket',
        role: '파일과 정적 웹 화면을 저장하는 객체 스토리지입니다.',
    },
    dynamodb: {
        type: 'dynamodb',
        name: 'Amazon DynamoDB',
        ko: 'NoSQL DB',
        category: 'database',
        icon: 'db',
        role: '키로 빠르게 읽고 쓰는 NoSQL 데이터베이스입니다.',
    },
    rds: {
        type: 'rds',
        name: 'Amazon RDS',
        ko: '관계형 DB',
        category: 'database',
        icon: 'db',
        role: 'SQL을 쓰는 관리형 관계형 데이터베이스입니다.',
    },
    elasticache: {
        type: 'elasticache',
        name: 'Amazon ElastiCache',
        ko: '캐시',
        category: 'database',
        icon: 'cache',
        role: '자주 읽는 데이터를 메모리에 두는 캐시입니다.',
    },
    cloudfront: {
        type: 'cloudfront',
        name: 'Amazon CloudFront',
        ko: 'CDN',
        category: 'networking',
        icon: 'cdn',
        role: '정적 파일을 전 세계 엣지에서 빠르게 전달하는 CDN입니다.',
    },
    api_gateway: {
        type: 'api_gateway',
        name: 'Amazon API Gateway',
        ko: 'API 입구',
        category: 'networking',
        icon: 'api',
        role: 'API 요청을 받아 백엔드로 전달하는 입구입니다.',
    },
    alb: {
        type: 'alb',
        name: 'Application Load Balancer',
        ko: '로드밸런서',
        category: 'networking',
        icon: 'lb',
        role: '요청을 여러 서버나 컨테이너로 나눠 줍니다.',
    },
    nat_gateway: {
        type: 'nat_gateway',
        name: 'NAT Gateway',
        ko: 'NAT 게이트웨이',
        category: 'networking',
        icon: 'nat',
        role: '프라이빗 서브넷에서 인터넷으로 나가는 통로입니다.',
    },
    route53: {
        type: 'route53',
        name: 'Amazon Route 53',
        ko: '도메인(DNS)',
        category: 'networking',
        icon: 'dns',
        role: '도메인 DNS를 관리합니다.',
    },
    cognito: {
        type: 'cognito',
        name: 'Amazon Cognito',
        ko: '회원 인증',
        category: 'security',
        icon: 'id',
        role: '회원가입과 로그인을 처리합니다.',
    },
    secrets_manager: {
        type: 'secrets_manager',
        name: 'AWS Secrets Manager',
        ko: '비밀 보관',
        category: 'security',
        icon: 'key',
        role: '비밀번호와 API 키를 안전하게 보관합니다.',
    },
    sqs: {
        type: 'sqs',
        name: 'Amazon SQS',
        ko: '작업 대기열',
        category: 'messaging',
        icon: 'queue',
        role: '작업을 줄 세워 안정적으로 처리하게 합니다.',
    },
    sns: {
        type: 'sns',
        name: 'Amazon SNS',
        ko: '알림 발행',
        category: 'messaging',
        icon: 'bell',
        role: '알림과 이벤트를 여러 곳에 전달합니다.',
    },
    eventbridge: {
        type: 'eventbridge',
        name: 'Amazon EventBridge',
        ko: '이벤트 버스',
        category: 'messaging',
        icon: 'bus',
        role: '이벤트를 규칙에 따라 다른 서비스로 보냅니다.',
    },
    ses: {
        type: 'ses',
        name: 'Amazon SES',
        ko: '이메일 발송',
        category: 'messaging',
        icon: 'mail',
        role: '이메일을 보냅니다.',
    },
    cloudwatch: {
        type: 'cloudwatch',
        name: 'Amazon CloudWatch',
        ko: '로그·알람',
        category: 'mgmt',
        icon: 'chart',
        role: '로그, 지표, 알람으로 서비스 상태를 지켜봅니다.',
    },
    bedrock: {
        type: 'bedrock',
        name: 'Amazon Bedrock',
        ko: '생성형 AI',
        category: 'ml',
        icon: 'spark',
        role: '생성형 AI 모델을 API로 사용합니다.',
    },
};

export const getService = (type: AwsServiceType): ServiceInfo => SERVICE_CATALOG[type];
export const categoryColor = (type: AwsServiceType): string =>
    CATEGORY_COLOR[SERVICE_CATALOG[type].category];
export const explanationCategory = (type: AwsServiceType): ExplanationCategory =>
    EXPLANATION_CATEGORY[SERVICE_CATALOG[type].category];
