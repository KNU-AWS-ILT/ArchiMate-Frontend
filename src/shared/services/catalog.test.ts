import { describe, expect, it } from 'vitest';
import completedJson from '@contracts/examples/design_job_completed.json';
import { designJobSchema } from '@/features/designs/schemas';
import {
    AWS_SERVICE_TYPES,
    CATEGORY_COLOR,
    SERVICE_CATALOG,
    categoryColor,
    explanationCategory,
} from './catalog';

describe('서비스 카탈로그', () => {
    it('계약의 serviceType 21종이 모두 있다', () => {
        expect(AWS_SERVICE_TYPES).toHaveLength(21);
        expect(Object.keys(SERVICE_CATALOG).sort()).toEqual([...AWS_SERVICE_TYPES].sort());
    });

    it('항목마다 이름, 한글 이름, 분류 색이 있다', () => {
        for (const s of Object.values(SERVICE_CATALOG)) {
            expect(s.name && s.ko && s.role && s.icon).toBeTruthy();
            expect(categoryColor(s.type)).toMatch(/^#[0-9A-F]{6}$/);
            expect(CATEGORY_COLOR[s.category]).toBe(categoryColor(s.type));
        }
    });

    it('계약 예시의 모든 노드 종류를 그릴 수 있다', () => {
        const job = designJobSchema.parse(completedJson);
        for (const d of job.designs)
            for (const n of d.architecture.nodes)
                expect(SERVICE_CATALOG[n.serviceType]).toBeDefined();
    });

    it('노드 설명 분류로 바꾼다', () => {
        expect(explanationCategory('api_gateway')).toBe('network');
        expect(explanationCategory('users')).toBe('external');
        expect(explanationCategory('cloudwatch')).toBe('monitoring');
    });
});
