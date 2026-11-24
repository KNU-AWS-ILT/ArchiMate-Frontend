import { z } from 'zod';
import { errorResponseSchema } from '@/shared/api/errors';
import { AWS_SERVICE_TYPES } from '@/shared/services/catalog';

// 백엔드 계약(`contracts/*.schema.json`)의 모양을 그대로 옮긴 zod 스키마다.
// 필드명은 camelCase, enum 값은 snake_case다. (coding-conventions 6번)

export const tierSchema = z.enum(['minimal_cost', 'balanced', 'scalable']);
export type Tier = z.infer<typeof tierSchema>;

export const awsServiceSchema = z.enum(AWS_SERVICE_TYPES);
export const groupKindSchema = z.enum([
    'plain',
    'region',
    'vpc',
    'availability_zone',
    'public_subnet',
    'private_subnet',
]);
export type GroupKind = z.infer<typeof groupKindSchema>;
export const jobStatusSchema = z.enum(['queued', 'running', 'completed', 'failed']);
export type JobStatus = z.infer<typeof jobStatusSchema>;

// ----- 구성도 -----
const usageSchema = z.object({
    monthlyRequests: z.number().nullish(),
    avgDurationMs: z.number().nullish(),
    memoryMb: z.number().nullish(),
    storageGb: z.number().nullish(),
    dataTransferOutGb: z.number().nullish(),
    monthlyReads: z.number().nullish(),
    monthlyWrites: z.number().nullish(),
    instanceType: z.string().nullish(),
    instanceCount: z.number().nullish(),
    hoursPerMonth: z.number().nullish(),
    multiAz: z.boolean().nullish(),
    vcpu: z.number().nullish(),
});

export const nodeSchema = z.object({
    id: z.string(),
    serviceType: awsServiceSchema,
    label: z.string(),
    groupId: z.string().nullish(),
    role: z.string(),
    reason: z.string(),
    usage: usageSchema.nullish(),
});
export type ArchNode = z.infer<typeof nodeSchema>;

export const edgeSchema = z.object({
    from: z.string(),
    to: z.string(),
    label: z.string().nullish(),
});
export type ArchEdge = z.infer<typeof edgeSchema>;

export const groupSchema = z.object({
    id: z.string(),
    kind: groupKindSchema,
    label: z.string(),
    parentId: z.string().nullish(),
});
export type ArchGroup = z.infer<typeof groupSchema>;

export const architectureSchema = z.object({
    nodes: z.array(nodeSchema),
    edges: z.array(edgeSchema),
    groups: z.array(groupSchema),
});
export type Architecture = z.infer<typeof architectureSchema>;

// ----- 월 비용 (표시만 한다. 프론트가 계산하지 않는다) -----
export const costItemSchema = z.object({
    nodeId: z.string(),
    amount: z.number().nullable(),
    amountUsd: z.number().nullable(),
    note: z.string().nullish(),
});

export const monthlyCostSchema = z.object({
    currency: z.string().optional(),
    total: z.number(),
    totalUsd: z.number(),
    exchangeRate: z.number(),
    exchangeRateDate: z.string(),
    priceDate: z.string(),
    freeTier: z.boolean(),
    freeTierNote: z.string().nullish(),
    overBudget: z.boolean(),
    items: z.array(costItemSchema),
});
export type MonthlyCost = z.infer<typeof monthlyCostSchema>;

// ----- 운영 절차 -----
export const guideStepSchema = z.object({
    id: z.string(),
    title: z.string(),
    desc: z.string(),
    nodeIds: z.array(z.string()),
    todo: z.array(z.string()),
    consolePath: z.string().nullish(),
    warn: z.string().nullish(),
});
export type GuideStep = z.infer<typeof guideStepSchema>;

export const guidePhaseSchema = z.object({
    key: z.string(),
    title: z.string(),
    sub: z.string(),
    intro: z.string(),
    steps: z.array(guideStepSchema),
});
export type GuidePhase = z.infer<typeof guidePhaseSchema>;

export const checklistSchema = z.object({
    key: z.string(),
    title: z.string(),
    items: z.array(z.string()),
});

export const operationsGuideSchema = z.object({
    phases: z.array(guidePhaseSchema),
    checklists: z.array(checklistSchema),
});
export type OperationsGuide = z.infer<typeof operationsGuideSchema>;

// ----- 3안 -----
export const difficultySchema = z.object({
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    label: z.string(),
    reason: z.string(),
});

export const designSchema = z.object({
    id: z.string(), // `{jobId}_{tier}`. 프론트에서 조합하지 않고 받은 값을 그대로 쓴다.
    tier: tierSchema,
    title: z.string(),
    summary: z.string(),
    difficulty: difficultySchema,
    architecture: architectureSchema,
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    budgetNote: z.string(),
    scalingPath: z.array(z.string()),
    operationsGuide: operationsGuideSchema.nullish(),
    monthlyCost: monthlyCostSchema.nullish(),
});
export type Design = z.infer<typeof designSchema>;

export const tierFailureSchema = z.object({
    tier: tierSchema,
    reason: z.string(), // 로그용 내부 코드. 화면에 그대로 보여 주지 않는다.
});

export const designJobSchema = z.object({
    jobId: z.string(),
    status: jobStatusSchema,
    designs: z.array(designSchema).default([]),
    failures: z.array(tierFailureSchema).default([]),
    error: errorResponseSchema.nullish(),
});
export type DesignJob = z.infer<typeof designJobSchema>;

export const designJobAcceptedSchema = z.object({ jobId: z.string() });

// ----- 노드 설명 -----
export const nodeExplanationSchema = z.object({
    nodeId: z.string(),
    serviceType: awsServiceSchema,
    name: z.string(),
    category: z.enum([
        'external',
        'network',
        'compute',
        'storage',
        'database',
        'security',
        'integration',
        'monitoring',
        'ai',
    ]),
    role: z.string(),
    reason: z.string(),
    alternatives: z.array(
        z.object({ serviceType: awsServiceSchema, name: z.string(), comparison: z.string() }),
    ),
    cautions: z.array(z.string()),
    monthlyCost: z
        .object({
            currency: z.string().optional(),
            amount: z.number(),
            amountUsd: z.number(),
            note: z.string().nullish(),
        })
        .nullish(),
});
export type NodeExplanation = z.infer<typeof nodeExplanationSchema>;

// ----- 요청: 인터뷰 답변 (`requirements.schema.json`) -----
export const requirementsSchema = z
    .object({
        serviceType: z.enum([
            'web_app',
            'api_only',
            'static_site',
            'ai_chatbot',
            'data_batch',
            'other',
        ]),
        concurrentUsers: z.enum(['under_100', 'under_1k', 'under_10k', 'over_10k']),
        monthlyBudget: z.number().int().min(0).max(100_000_000),
        awsExperience: z.enum(['none', 'beginner', 'intermediate', 'advanced']),
        dataStorage: z.array(z.enum(['relational', 'key_value', 'file_storage', 'none'])).min(1),
        trafficPattern: z.enum(['steady', 'business_hours', 'spiky', 'unknown']).optional(),
        availability: z.enum(['best_effort', 'standard', 'high']).optional(),
        freeText: z.string().max(1000).nullish(),
    })
    // 서버가 400으로 거절하는 경우를 프론트도 먼저 막는다. (A-interview-questions.md)
    .refine((v) => !v.dataStorage.includes('none') || v.dataStorage.length === 1, {
        message: "'없음'은 다른 항목과 함께 고를 수 없어요.",
        path: ['dataStorage'],
    })
    .refine((v) => new Set(v.dataStorage).size === v.dataStorage.length, {
        message: '같은 항목을 두 번 고를 수 없어요.',
        path: ['dataStorage'],
    });
export type Requirements = z.infer<typeof requirementsSchema>;
