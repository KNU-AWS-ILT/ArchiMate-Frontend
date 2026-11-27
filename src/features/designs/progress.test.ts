import { describe, expect, it } from 'vitest';
import { isPollTimedOut, tierProgress } from './progress';
import type { Design, DesignJob } from './schemas';

const job = (over: Partial<DesignJob>): DesignJob => ({
    jobId: 'job_1',
    status: 'running',
    designs: [],
    failures: [],
    ...over,
});
const design = (tier: Design['tier']) => ({ tier }) as Design;

describe('tierProgress', () => {
    it('조회 전이거나 queued면 모두 대기다', () => {
        expect(tierProgress(undefined)).toEqual({
            minimal_cost: 'wait',
            balanced: 'wait',
            scalable: 'wait',
        });
        expect(tierProgress(job({ status: 'queued' })).balanced).toBe('wait');
    });

    it('running이면 끝난 안은 완료, 나머지는 만드는 중이다', () => {
        expect(tierProgress(job({ designs: [design('minimal_cost')] }))).toEqual({
            minimal_cost: 'done',
            balanced: 'run',
            scalable: 'run',
        });
    });

    it('못 만든 안은 실패로 보여 준다', () => {
        const p = tierProgress(
            job({
                status: 'completed',
                designs: [design('minimal_cost'), design('balanced')],
                failures: [{ tier: 'scalable', reason: 'LLM_INVALID_OUTPUT' }],
            }),
        );
        expect(p.scalable).toBe('fail');
    });
});

describe('isPollTimedOut', () => {
    it('3분이 지나면 시간 초과다', () => {
        expect(isPollTimedOut(0, 179_999)).toBe(false);
        expect(isPollTimedOut(0, 180_000)).toBe(true);
    });
});
