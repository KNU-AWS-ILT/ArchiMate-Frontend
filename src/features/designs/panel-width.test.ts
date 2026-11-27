import { describe, expect, it } from 'vitest';
import { clampPanelWidth, defaultPanelWidth, parseStoredWidth } from './panel-width';

describe('패널 폭', () => {
    it('기본 폭은 화면의 28%이고 400~480 사이다', () => {
        expect(defaultPanelWidth(1000)).toBe(400);
        expect(defaultPanelWidth(1600)).toBe(448);
        expect(defaultPanelWidth(3000)).toBe(480);
    });
    it('최소·최대 폭 안으로 맞춘다', () => {
        expect(clampPanelWidth(100, 1600)).toBe(360);
        expect(clampPanelWidth(900, 1600)).toBe(640);
    });
    it('좁은 화면에서는 화면의 60%를 넘지 않는다', () => {
        expect(clampPanelWidth(600, 800)).toBe(480);
    });
    it('저장된 값이 이상하면 쓰지 않는다', () => {
        expect(parseStoredWidth(null)).toBeNull();
        expect(parseStoredWidth('abc')).toBeNull();
        expect(parseStoredWidth('-5')).toBeNull();
        expect(parseStoredWidth('450')).toBe(450);
    });
});
