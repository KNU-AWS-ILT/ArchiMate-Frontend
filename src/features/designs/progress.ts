import { POLL_TIMEOUT_MS, TIER_ORDER } from './tiers';
import type { DesignJob, Tier } from './schemas';

export type TierProgress = 'wait' | 'run' | 'done' | 'fail';

/**
 * 생성 중 화면에서 안마다 보여 줄 상태. 끝난 안은 `designs[]`에, 못 만든 안은 `failures[]`에 있다.
 * 작업이 `queued`면 모두 대기, `running`이면 아직 안 끝난 안은 만드는 중이다.
 */
export function tierProgress(job: DesignJob | undefined): Record<Tier, TierProgress> {
    const out = {} as Record<Tier, TierProgress>;
    for (const tier of TIER_ORDER) {
        if (job?.designs.some((d) => d.tier === tier)) out[tier] = 'done';
        else if (job?.failures.some((f) => f.tier === tier)) out[tier] = 'fail';
        else if (job?.status === 'running') out[tier] = 'run';
        else out[tier] = 'wait';
    }
    return out;
}

/** 폴링을 시작한 지 최대 시간(약 3분)이 지났는지 */
export const isPollTimedOut = (startedAt: number, now: number, limit = POLL_TIMEOUT_MS) =>
    now - startedAt >= limit;
