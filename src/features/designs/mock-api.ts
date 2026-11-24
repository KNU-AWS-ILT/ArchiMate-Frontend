import { ApiError } from '@/shared/api/errors';
import { explanationCategory, getService } from '@/shared/services/catalog';
import acceptedJson from '@contracts/examples/design_job_accepted.json';
import completedJson from '@contracts/examples/design_job_completed.json';
import failedJson from '@contracts/examples/design_job_failed.json';
import partialJson from '@contracts/examples/design_job_partial_failed.json';
import runningJson from '@contracts/examples/design_job_running.json';
import type { DesignsApi } from './api';
import {
    designJobAcceptedSchema,
    designJobSchema,
    type Design,
    type DesignJob,
    type NodeExplanation,
} from './schemas';

/** 목이 재현하는 결과. 계약 예시(`contracts/examples/`)를 그대로 쓴다. */
export type MockScenario = 'success' | 'partial-failed' | 'failed';

export interface MockOptions {
    /** `createDesign`을 부를 때마다 차례로 쓴다. 마지막 값은 이후에도 반복한다. */
    scenarios?: MockScenario[];
    /** 응답 전에 기다리는 시간(ms) */
    latencyMs?: number;
    /** 이 횟수만큼 조회하면 최종 결과가 된다. (1번째 queued, 그 뒤 running, 마지막 최종) */
    pollsUntilDone?: number;
}

const FINAL: Record<MockScenario, DesignJob> = {
    success: designJobSchema.parse(completedJson),
    'partial-failed': designJobSchema.parse(partialJson),
    failed: designJobSchema.parse(failedJson),
};
const RUNNING = designJobSchema.parse(runningJson);
const ACCEPTED = designJobAcceptedSchema.parse(acceptedJson);

/** 예시의 `jobId`·`designId`를 새 작업 번호로 바꾼다. (`{jobId}_{tier}`) */
function rebase(template: DesignJob, jobId: string): DesignJob {
    const job = structuredClone(template);
    job.jobId = jobId;
    job.designs = job.designs.map((d) => ({ ...d, id: `${jobId}_${d.tier}` }));
    if (job.error) job.error = { ...job.error, requestId: jobId };
    return job;
}

const notFound = () =>
    new ApiError({ status: 404, code: 'NOT_FOUND', retryable: false, serverMessage: 'not found' });

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(signal.reason);
        });
    });
}

export function createMockDesignsApi(options: MockOptions = {}): DesignsApi {
    const { scenarios = ['success'], latencyMs = 0, pollsUntilDone = 3 } = options;
    const jobs = new Map<string, { scenario: MockScenario; polls: number }>();
    const designs = new Map<string, Design>();
    let created = 0;

    return {
        async createDesign(_answers, opts) {
            await sleep(latencyMs, opts?.signal);
            const scenario = scenarios[Math.min(created, scenarios.length - 1)] ?? 'success';
            created += 1;
            const jobId = `${ACCEPTED.jobId}_${created}`;
            jobs.set(jobId, { scenario, polls: 0 });
            return { jobId };
        },

        async getJob(jobId, opts) {
            await sleep(latencyMs, opts?.signal);
            const entry = jobs.get(jobId);
            if (!entry) throw notFound();
            entry.polls += 1;
            let job: DesignJob;
            if (entry.polls < 2 && pollsUntilDone > 1) {
                job = { jobId, status: 'queued', designs: [], failures: [], error: null };
            } else if (entry.polls < pollsUntilDone) {
                job = rebase(RUNNING, jobId);
            } else {
                job = rebase(FINAL[entry.scenario], jobId);
            }
            job.designs.forEach((d) => designs.set(d.id, d));
            return job;
        },

        async getGuide(designId, opts) {
            await sleep(latencyMs, opts?.signal);
            const guide = designs.get(designId)?.operationsGuide;
            if (!guide) throw notFound();
            return guide;
        },

        async getExplanation(designId, nodeId, opts) {
            await sleep(latencyMs, opts?.signal);
            const design = designs.get(designId);
            const node = design?.architecture.nodes.find((n) => n.id === nodeId);
            if (!design || !node) throw notFound();
            const cost = design.monthlyCost?.items.find((i) => i.nodeId === nodeId);
            const explanation: NodeExplanation = {
                nodeId,
                serviceType: node.serviceType,
                name: getService(node.serviceType).name,
                category: explanationCategory(node.serviceType),
                role: node.role,
                reason: node.reason,
                alternatives: [],
                cautions: [],
                monthlyCost:
                    cost && cost.amount !== null && cost.amountUsd !== null
                        ? { amount: cost.amount, amountUsd: cost.amountUsd, note: cost.note }
                        : null,
            };
            return explanation;
        },
    };
}
