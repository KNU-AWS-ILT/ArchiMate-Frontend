import { describe, expect, it } from 'vitest';
import { ApiError, ERROR_CODES, errorMessage, isApiError, messageOf } from './errors';

describe('오류 문구', () => {
    it('모든 code에 한국어 문구가 있다', () => {
        for (const code of ERROR_CODES) expect(errorMessage(code).length).toBeGreaterThan(5);
    });

    it('하루 생성 횟수를 넘은 경우(RATE_LIMITED, retryable false)는 다른 문구다', () => {
        expect(errorMessage('RATE_LIMITED', true)).toContain('잠시 후');
        expect(errorMessage('RATE_LIMITED', false)).toContain('내일');
    });

    it('ApiError는 서버 message가 아니라 code별 문구를 보여 준다', () => {
        const e = new ApiError({
            status: 502,
            code: 'EXPLANATION_FAILED',
            retryable: true,
            serverMessage: 'internal detail',
        });
        expect(e.message).toBe('internal detail');
        expect(e.userMessage).toBe(errorMessage('EXPLANATION_FAILED'));
        expect(isApiError(e)).toBe(true);
        expect(isApiError(new Error('x'))).toBe(false);
    });

    it('작업 조회의 error 본문도 같은 문구로 바꾼다', () => {
        expect(messageOf({ code: 'LLM_TIMEOUT', retryable: true })).toBe(
            errorMessage('LLM_TIMEOUT'),
        );
    });
});
