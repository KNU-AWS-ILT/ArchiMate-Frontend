import { describe, expect, it, vi } from 'vitest';
import acceptedJson from '@contracts/examples/design_job_accepted.json';
import completedJson from '@contracts/examples/design_job_completed.json';
import createRequestJson from '@contracts/examples/create_design_request.json';
import { createHttpClient } from '@/shared/api/http';
import { createHttpDesignsApi } from './http-api';
import { requirementsSchema } from './schemas';

const res = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function setup(body: unknown, status = 200) {
    const fetchImpl = vi.fn(async () => res(body, status));
    const api = createHttpDesignsApi(
        createHttpClient({ fetchImpl: fetchImpl as unknown as typeof fetch }),
    );
    return { api, fetchImpl };
}
const call = (fetchImpl: ReturnType<typeof vi.fn>) =>
    fetchImpl.mock.calls[0] as unknown as [string, RequestInit];

describe('HTTP 어댑터', () => {
    it('POST /designs는 { answers }를 보내고 jobId를 받는다', async () => {
        const { api, fetchImpl } = setup(acceptedJson, 202);
        const answers = requirementsSchema.parse(createRequestJson.answers);
        // 202도 성공이다
        await expect(api.createDesign(answers)).resolves.toEqual({ jobId: acceptedJson.jobId });
        const [url, init] = call(fetchImpl);
        expect(url).toBe('/api/v1/designs');
        expect(JSON.parse(String(init.body))).toEqual({ answers });
    });

    it('GET jobs/{jobId}, guide, explanation 경로를 만든다', async () => {
        const { api, fetchImpl } = setup(completedJson);
        await api.getJob('job_demo');
        expect(call(fetchImpl)[0]).toBe('/api/v1/designs/jobs/job_demo');
    });

    it('경로에 들어가는 id는 인코딩한다', async () => {
        const { api, fetchImpl } = setup(
            { code: 'NOT_FOUND', message: 'x', retryable: false },
            404,
        );
        await api.getGuide('a/b c').catch(() => undefined);
        expect(call(fetchImpl)[0]).toBe('/api/v1/designs/a%2Fb%20c/guide');
    });
});
