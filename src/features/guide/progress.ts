import type { GuidePhase, OperationsGuide } from '@/features/designs/schemas';

/**
 * 완료 체크 키는 `guide:{designId}:{stepId}`다. (백엔드 #12)
 * 같은 `stepId`(예: `budget_alarm`)가 안마다 있을 수 있어서 `designId`를 앞에 붙인다.
 * `localStorage`에만 저장하고 서버에는 보내지 않는다.
 */
export const stepKey = (designId: string, stepId: string): string => `guide:${designId}:${stepId}`;

export interface Progress {
    total: number;
    done: number;
}

export function guideProgress(
    guide: OperationsGuide,
    designId: string,
    done: ReadonlySet<string>,
): Progress {
    const steps = guide.phases.flatMap((p) => p.steps);
    return {
        total: steps.length,
        done: steps.filter((s) => done.has(stepKey(designId, s.id))).length,
    };
}

export function phaseProgress(
    phase: GuidePhase,
    designId: string,
    done: ReadonlySet<string>,
): Progress {
    return {
        total: phase.steps.length,
        done: phase.steps.filter((s) => done.has(stepKey(designId, s.id))).length,
    };
}

/** 아직 끝내지 않은 첫 단계 (채팅 안내, "다음에 뭘 해야 해?") */
export function nextStep(guide: OperationsGuide, designId: string, done: ReadonlySet<string>) {
    for (const phase of guide.phases) {
        const step = phase.steps.find((s) => !done.has(stepKey(designId, s.id)));
        if (step) return { phase, step };
    }
    return undefined;
}
