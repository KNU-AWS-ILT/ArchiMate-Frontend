import { describe, expect, it } from 'vitest';
import acceptedJson from '@contracts/examples/design_job_accepted.json';
import completedJson from '@contracts/examples/design_job_completed.json';
import createRequestJson from '@contracts/examples/create_design_request.json';
import failedJson from '@contracts/examples/design_job_failed.json';
import guideJson from '@contracts/examples/operations_guide_minimal_cost.json';
import explanationJson from '@contracts/examples/node_explanation_app_db.json';
import partialJson from '@contracts/examples/design_job_partial_failed.json';
import runningJson from '@contracts/examples/design_job_running.json';
import {
    designJobAcceptedSchema,
    designJobSchema,
    nodeExplanationSchema,
    operationsGuideSchema,
    requirementsSchema,
} from './schemas';

describe('계약 예시가 zod 스키마를 통과한다', () => {
    it.each([
        ['completed', completedJson],
        ['partial_failed', partialJson],
        ['failed', failedJson],
        ['running', runningJson],
    ])('design_job_%s', (_name, json) => {
        expect(designJobSchema.safeParse(json).success).toBe(true);
    });

    it('accepted, 운영 절차, 노드 설명, 생성 요청', () => {
        expect(designJobAcceptedSchema.safeParse(acceptedJson).success).toBe(true);
        expect(operationsGuideSchema.safeParse(guideJson).success).toBe(true);
        expect(nodeExplanationSchema.safeParse(explanationJson).success).toBe(true);
        expect(requirementsSchema.safeParse(createRequestJson.answers).success).toBe(true);
    });

    it('completed는 3안이고 모두 월 비용과 운영 절차가 있다', () => {
        const job = designJobSchema.parse(completedJson);
        expect(job.designs.map((d) => d.tier)).toEqual(['minimal_cost', 'balanced', 'scalable']);
        for (const d of job.designs) {
            expect(d.monthlyCost).toBeTruthy();
            expect(d.operationsGuide?.phases.length).toBeGreaterThan(0);
        }
    });

    it('전부 실패한 작업은 designs가 비고 error가 채워진다', () => {
        const job = designJobSchema.parse(failedJson);
        expect(job.status).toBe('failed');
        expect(job.designs).toEqual([]);
        expect(job.failures).toHaveLength(3);
        expect(job.error?.code).toBeTruthy();
    });

    it('designs·failures가 없으면 빈 배열이다', () => {
        const job = designJobSchema.parse({ jobId: 'j', status: 'queued' });
        expect(job.designs).toEqual([]);
        expect(job.failures).toEqual([]);
    });
});

describe('인터뷰 답변 검증 (서버가 400으로 거절하는 경우를 먼저 막는다)', () => {
    const ok = createRequestJson.answers;

    it('"없음"은 다른 항목과 함께 고를 수 없다', () => {
        expect(
            requirementsSchema.safeParse({ ...ok, dataStorage: ['none', 'relational'] }).success,
        ).toBe(false);
        expect(requirementsSchema.safeParse({ ...ok, dataStorage: ['none'] }).success).toBe(true);
    });

    it('같은 항목을 두 번 고를 수 없다', () => {
        expect(
            requirementsSchema.safeParse({ ...ok, dataStorage: ['relational', 'relational'] })
                .success,
        ).toBe(false);
    });

    it('필수 답이 빠지거나 예산이 음수면 실패한다', () => {
        const rest: Partial<typeof ok> = { ...ok };
        delete rest.serviceType;
        expect(requirementsSchema.safeParse(rest).success).toBe(false);
        expect(requirementsSchema.safeParse({ ...ok, monthlyBudget: -1 }).success).toBe(false);
    });

    it('자유 서술은 1000자까지다', () => {
        expect(requirementsSchema.safeParse({ ...ok, freeText: 'a'.repeat(1000) }).success).toBe(
            true,
        );
        expect(requirementsSchema.safeParse({ ...ok, freeText: 'a'.repeat(1001) }).success).toBe(
            false,
        );
    });
});
