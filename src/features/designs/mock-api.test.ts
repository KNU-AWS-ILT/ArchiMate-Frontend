import { describe, expect, it } from 'vitest';
import createRequestJson from '@contracts/examples/create_design_request.json';
import { isApiError } from '@/shared/api/errors';
import { createMockDesignsApi } from './mock-api';
import { requirementsSchema } from './schemas';

const answers = requirementsSchema.parse(createRequestJson.answers);

async function poll(api: ReturnType<typeof createMockDesignsApi>, jobId: string, times: number) {
    const seen = [];
    for (let i = 0; i < times; i++) seen.push(await api.getJob(jobId));
    return seen;
}

describe('목 API', () => {
    it('조회할 때마다 queued → running → completed로 바뀐다', async () => {
        const api = createMockDesignsApi();
        const { jobId } = await api.createDesign(answers);
        const [a, b, c, d] = await poll(api, jobId, 4);
        expect([a.status, b.status, c.status, d.status]).toEqual([
            'queued',
            'running',
            'completed',
            'completed',
        ]);
        expect(a.designs).toEqual([]);
    });

    it('designId는 `{jobId}_{tier}` 형태다', async () => {
        const api = createMockDesignsApi();
        const { jobId } = await api.createDesign(answers);
        const job = (await poll(api, jobId, 3))[2];
        expect(job.jobId).toBe(jobId);
        expect(job.designs.map((d) => d.id)).toEqual(
            ['minimal_cost', 'balanced', 'scalable'].map((t) => `${jobId}_${t}`),
        );
    });

    it('일부 실패 후 다시 시도하면 성공한다 (시나리오 순서)', async () => {
        const api = createMockDesignsApi({ scenarios: ['partial-failed', 'success'] });
        const first = await api.createDesign(answers);
        const partial = (await poll(api, first.jobId, 3))[2];
        expect(partial.status).toBe('completed');
        expect(partial.failures.map((f) => f.tier)).toEqual(['scalable']);
        const retry = await api.createDesign(answers);
        expect(retry.jobId).not.toBe(first.jobId);
        const ok = (await poll(api, retry.jobId, 3))[2];
        expect(ok.failures).toEqual([]);
        expect(ok.designs).toHaveLength(3);
    });

    it('전부 실패하면 status failed와 error가 온다 (HTTP 오류가 아니다)', async () => {
        const api = createMockDesignsApi({ scenarios: ['failed'] });
        const { jobId } = await api.createDesign(answers);
        const job = (await poll(api, jobId, 3))[2];
        expect(job).toMatchObject({ status: 'failed', designs: [] });
        expect(job.error).toMatchObject({
            code: 'RATE_LIMITED',
            retryable: true,
            requestId: jobId,
        });
    });

    it('운영 절차와 노드 설명을 안 id로 조회한다', async () => {
        const api = createMockDesignsApi();
        const { jobId } = await api.createDesign(answers);
        const job = (await poll(api, jobId, 3))[2];
        const design = job.designs[0];
        const guide = await api.getGuide(design.id);
        expect(guide).toEqual(design.operationsGuide);
        const node = design.architecture.nodes[1];
        const ex = await api.getExplanation(design.id, node.id);
        expect(ex).toMatchObject({
            nodeId: node.id,
            serviceType: node.serviceType,
            role: node.role,
        });
    });

    it('없는 작업·안·노드는 404 NOT_FOUND다', async () => {
        const api = createMockDesignsApi();
        for (const run of [
            () => api.getJob('nope'),
            () => api.getGuide('nope'),
            () => api.getExplanation('nope', 'x'),
        ]) {
            const err = await run().catch((e) => e);
            expect(isApiError(err) && err.code === 'NOT_FOUND' && err.status === 404).toBe(true);
        }
    });
});
