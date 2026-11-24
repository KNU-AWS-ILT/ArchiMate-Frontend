import type { Design, DesignJob, Tier } from './schemas';

export const TIER_ORDER: readonly Tier[] = ['minimal_cost', 'balanced', 'scalable'];

export const TIER_LABEL: Record<Tier, string> = {
    minimal_cost: '최소비용형',
    balanced: '균형형',
    scalable: '확장형',
};

/** 3안 선택 메뉴(탭)의 한 항목. 만든 안이거나, 만들지 못한 안이다. */
export type TierEntry = { tier: Tier; design: Design } | { tier: Tier; failed: true };

/**
 * `designs[]`와 `failures[]`에 있는 tier로만 항목을 만든다. 안이 항상 3개라고 가정하지 않는다.
 * (1안 축소 때 만들지 않은 안은 실패가 아니라서 어디에도 없다.)
 */
export function tierEntries(job: DesignJob): TierEntry[] {
    const entries: TierEntry[] = [];
    for (const tier of TIER_ORDER) {
        const design = job.designs.find((d) => d.tier === tier);
        if (design) entries.push({ tier, design });
        else if (job.failures.some((f) => f.tier === tier)) entries.push({ tier, failed: true });
    }
    return entries;
}

export const isFailedEntry = (e: TierEntry): e is { tier: Tier; failed: true } => 'failed' in e;

/** 처음 보여 줄 안: 만든 안 중 가장 앞의 것 */
export function firstDesign(job: DesignJob): Design | undefined {
    const first = tierEntries(job).find((e) => !isFailedEntry(e));
    return first && 'design' in first ? first.design : undefined;
}

/** 화면이 구분해야 하는 작업 단계 */
export type JobStage = 'pending' | 'ready' | 'partial' | 'failed';

export function jobStage(job: DesignJob): JobStage {
    if (job.status === 'queued' || job.status === 'running') return 'pending';
    if (job.status === 'failed') return 'failed';
    return job.failures.length > 0 ? 'partial' : 'ready';
}

/** 폴링은 작업이 끝날 때(`completed`, `failed`)까지만 한다. */
export const shouldKeepPolling = (job: DesignJob | undefined): boolean =>
    !job || job.status === 'queued' || job.status === 'running';

/** 폴링 간격과 최대 시간 (백엔드 #7: 3초, 최대 약 3분) */
export const POLL_INTERVAL_MS = 3000;
export const POLL_TIMEOUT_MS = 180_000;
