import { describe, expect, it } from 'vitest';
import { loadDoneSteps, saveStepDone } from './storage';

const memoryStorage = () => {
    const map = new Map<string, string>();
    return {
        get length() {
            return map.size;
        },
        key: (i: number) => [...map.keys()][i] ?? null,
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => void map.set(k, v),
        removeItem: (k: string) => void map.delete(k),
    };
};

describe('완료 체크 저장', () => {
    it('guide:{designId}:{stepId} 키로 저장하고 다시 읽는다', () => {
        const s = memoryStorage();
        saveStepDone(s, 'job_1_balanced', 'budget_alarm', true);
        expect(s.getItem('guide:job_1_balanced:budget_alarm')).toBe('1');
        expect(loadDoneSteps(s)).toEqual(new Set(['guide:job_1_balanced:budget_alarm']));
    });

    it('완료를 취소하면 지운다', () => {
        const s = memoryStorage();
        saveStepDone(s, 'd', 'a', true);
        saveStepDone(s, 'd', 'a', false);
        expect(loadDoneSteps(s).size).toBe(0);
    });

    it('같은 stepId라도 안마다 따로 저장된다', () => {
        const s = memoryStorage();
        saveStepDone(s, 'job_1_minimal_cost', 'budget_alarm', true);
        expect(loadDoneSteps(s).has('guide:job_1_balanced:budget_alarm')).toBe(false);
    });

    it('guide:로 시작하지 않는 키는 무시한다', () => {
        const s = memoryStorage();
        s.setItem('archimate-theme', 'dark');
        expect(loadDoneSteps(s).size).toBe(0);
    });

    it('저장소가 오류를 던져도 화면이 멈추지 않는다', () => {
        const broken = {
            length: 1,
            key: () => {
                throw new Error('blocked');
            },
            getItem: () => null,
            setItem: () => {
                throw new Error('quota');
            },
            removeItem: () => {},
        };
        expect(loadDoneSteps(broken).size).toBe(0);
        expect(() => saveStepDone(broken, 'd', 's', true)).not.toThrow();
    });
});
