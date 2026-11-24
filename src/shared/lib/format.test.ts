import { describe, expect, it } from 'vitest';
import { formatKRW, formatUSD } from './format';

describe('금액 표시', () => {
    it('천 단위 콤마만 붙인다', () => {
        expect(formatKRW(1147)).toBe('1,147원');
        expect(formatKRW(228971)).toBe('228,971원');
        expect(formatKRW(0)).toBe('0원');
    });

    it('달러는 소수 둘째 자리까지 보여 준다', () => {
        expect(formatUSD(0.83)).toBe('$0.83');
        expect(formatUSD(165.9)).toBe('$165.90');
    });
});
