import { describe, expect, it } from 'vitest';
import { oppositeSide, pickSides } from './handles';

const size = { width: 96, height: 76 };

describe('pickSides', () => {
    it('오른쪽에 있으면 오른쪽 변에서 나가 왼쪽 변으로 들어간다', () => {
        expect(pickSides({ x: 0, y: 0 }, { x: 200, y: 10 }, size)).toEqual({
            source: 'right',
            target: 'left',
        });
    });
    it('왼쪽에 있으면 왼쪽 변에서 나간다', () => {
        expect(pickSides({ x: 200, y: 0 }, { x: 0, y: 0 }, size)).toEqual({
            source: 'left',
            target: 'right',
        });
    });
    it('세로 차이가 더 크면 위아래 변을 쓴다', () => {
        expect(pickSides({ x: 0, y: 0 }, { x: 20, y: 200 }, size)).toEqual({
            source: 'bottom',
            target: 'top',
        });
        expect(pickSides({ x: 0, y: 200 }, { x: 20, y: 0 }, size)).toEqual({
            source: 'top',
            target: 'bottom',
        });
    });
    it('가로·세로 차이가 같으면 좌우를 쓴다', () => {
        expect(pickSides({ x: 0, y: 0 }, { x: 100, y: 100 }, size).source).toBe('right');
    });
});

describe('oppositeSide', () => {
    it('반대편 변을 돌려준다', () => {
        expect(oppositeSide('left')).toBe('right');
        expect(oppositeSide('top')).toBe('bottom');
    });
});
