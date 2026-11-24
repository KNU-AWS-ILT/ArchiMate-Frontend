import { describe, expect, it } from 'vitest';
import { createDesignsApi, resolveApiMode, scenariosFromSearch } from './index';

describe('API 모드', () => {
    it('mock일 때만 목이고 비어 있으면 실제 API다', () => {
        expect(resolveApiMode('mock')).toBe('mock');
        expect(resolveApiMode(undefined)).toBe('http');
        expect(resolveApiMode('')).toBe('http');
        expect(resolveApiMode('anything')).toBe('http');
    });

    it('?state=로 목 시나리오를 고르고, 실패 뒤 다시 시도하면 성공한다', () => {
        expect(scenariosFromSearch('')).toEqual(['success']);
        expect(scenariosFromSearch('?state=partial-failed')).toEqual(['partial-failed', 'success']);
        expect(scenariosFromSearch('?state=failed')).toEqual(['failed', 'success']);
        expect(scenariosFromSearch('?state=other')).toEqual(['success']);
    });

    it('목 API도 같은 인터페이스로 동작한다 (지연 로딩)', async () => {
        const api = createDesignsApi({ mode: 'mock', mock: { latencyMs: 0 } });
        const { jobId } = await api.createDesign({
            serviceType: 'web_app',
            concurrentUsers: 'under_100',
            monthlyBudget: 50000,
            awsExperience: 'none',
            dataStorage: ['key_value'],
        });
        const jobs = [await api.getJob(jobId), await api.getJob(jobId), await api.getJob(jobId)];
        expect(jobs.map((j) => j.status)).toEqual(['queued', 'running', 'completed']);
    });
});
