import { describe, expect, it } from 'vitest';
import completedJson from '@contracts/examples/design_job_completed.json';
import failedJson from '@contracts/examples/design_job_failed.json';
import partialJson from '@contracts/examples/design_job_partial_failed.json';
import { designJobSchema, type DesignJob } from './schemas';
import { firstDesign, isFailedEntry, jobStage, shouldKeepPolling, tierEntries } from './tiers';

const completed = designJobSchema.parse(completedJson);
const partial = designJobSchema.parse(partialJson);
const failed = designJobSchema.parse(failedJson);

describe('3안 선택 항목', () => {
    it('3안이 모두 있으면 최소비용·균형·확장 순서다', () => {
        expect(tierEntries(completed).map((e) => e.tier)).toEqual([
            'minimal_cost',
            'balanced',
            'scalable',
        ]);
    });

    it('일부 실패한 안은 "만들지 못한" 항목으로 들어간다', () => {
        const entries = tierEntries(partial);
        expect(entries.map((e) => [e.tier, isFailedEntry(e)])).toEqual([
            ['minimal_cost', false],
            ['balanced', false],
            ['scalable', true],
        ]);
    });

    it('전부 실패하면 모두 실패 항목이고 처음 보여 줄 안이 없다', () => {
        expect(tierEntries(failed).every(isFailedEntry)).toBe(true);
        expect(firstDesign(failed)).toBeUndefined();
    });

    it('1안으로 줄면 안이 1개다 (만들지 않은 안은 항목에 없다)', () => {
        const one: DesignJob = {
            ...completed,
            designs: completed.designs.slice(0, 1),
            failures: [],
        };
        expect(tierEntries(one).map((e) => e.tier)).toEqual(['minimal_cost']);
    });

    it('처음 보여 줄 안은 만든 안 중 가장 앞의 것이다', () => {
        const noFirst: DesignJob = {
            ...completed,
            designs: completed.designs.slice(1),
            failures: [{ tier: 'minimal_cost', reason: 'LLM_INVALID_OUTPUT' }],
        };
        expect(firstDesign(noFirst)?.tier).toBe('balanced');
    });
});

describe('작업 단계', () => {
    it('queued·running은 pending이고 계속 조회한다', () => {
        for (const status of ['queued', 'running'] as const) {
            const job = { ...completed, status };
            expect(jobStage(job)).toBe('pending');
            expect(shouldKeepPolling(job)).toBe(true);
        }
        expect(shouldKeepPolling(undefined)).toBe(true);
    });

    it('completed는 ready 또는 partial, failed는 failed이며 조회를 멈춘다', () => {
        expect(jobStage(completed)).toBe('ready');
        expect(jobStage(partial)).toBe('partial');
        expect(jobStage(failed)).toBe('failed');
        expect([completed, partial, failed].some(shouldKeepPolling)).toBe(false);
    });
});
