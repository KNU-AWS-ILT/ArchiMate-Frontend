import { describe, expect, it } from 'vitest';
import completedJson from '@contracts/examples/design_job_completed.json';
import { designJobSchema } from '@/features/designs/schemas';
import { guideProgress, nextStep, phaseProgress, stepKey } from './progress';

const job = designJobSchema.parse(completedJson);
const [minimal, balanced] = job.designs;
const guide = minimal.operationsGuide!;

describe('완료 체크', () => {
    it('키는 guide:{designId}:{stepId}다', () => {
        expect(stepKey('job_demo_minimal_cost', 'budget_alarm')).toBe(
            'guide:job_demo_minimal_cost:budget_alarm',
        );
    });

    it('같은 stepId라도 안마다 따로 센다', () => {
        const done = new Set([stepKey(minimal.id, 'budget_alarm')]);
        expect(guideProgress(guide, minimal.id, done).done).toBe(1);
        expect(guideProgress(balanced.operationsGuide!, balanced.id, done).done).toBe(0);
    });

    it('전체와 단계별 진행도를 센다', () => {
        const total = guide.phases.flatMap((p) => p.steps).length;
        expect(guideProgress(guide, minimal.id, new Set())).toEqual({ total, done: 0 });
        const first = guide.phases[0];
        const done = new Set(first.steps.map((s) => stepKey(minimal.id, s.id)));
        expect(phaseProgress(first, minimal.id, done)).toEqual({
            total: first.steps.length,
            done: first.steps.length,
        });
    });

    it('다음에 할 단계는 끝내지 않은 첫 단계다', () => {
        const first = guide.phases[0].steps[0];
        expect(nextStep(guide, minimal.id, new Set())?.step.id).toBe(first.id);
        expect(nextStep(guide, minimal.id, new Set([stepKey(minimal.id, first.id)]))?.step.id).toBe(
            guide.phases[0].steps[1].id,
        );
    });

    it('모두 끝내면 다음 단계가 없다', () => {
        const all = new Set(
            guide.phases.flatMap((p) => p.steps.map((s) => stepKey(minimal.id, s.id))),
        );
        expect(nextStep(guide, minimal.id, all)).toBeUndefined();
    });
});
