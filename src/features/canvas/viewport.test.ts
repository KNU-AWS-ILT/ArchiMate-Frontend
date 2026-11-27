import { describe, expect, it } from 'vitest';
import { boundsOf, viewForBounds } from './viewport';

const screenOf = (view: { x: number; y: number; zoom: number }, p: { x: number; y: number }) => ({
    x: p.x * view.zoom + view.x,
    y: p.y * view.zoom + view.y,
});

describe('boundsOf', () => {
    it('여러 사각형을 감싸는 사각형을 구한다', () => {
        expect(
            boundsOf([
                { x: 0, y: 0, width: 10, height: 10 },
                { x: 20, y: 5, width: 10, height: 10 },
            ]),
        ).toEqual({
            x: 0,
            y: 0,
            width: 30,
            height: 15,
        });
        expect(boundsOf([])).toBeNull();
    });
});

describe('viewForBounds', () => {
    const area = { left: 400, top: 76, width: 600, height: 500 };

    it('영역의 가운데가 보이는 곳의 가운데에 온다', () => {
        const b = { x: 100, y: 50, width: 200, height: 100 };
        const v = viewForBounds(b, area, { padding: 10, margin: 20 });
        const c = screenOf(v, { x: b.x + b.width / 2, y: b.y + b.height / 2 });
        expect(c.x).toBeCloseTo(area.left + area.width / 2);
        expect(c.y).toBeCloseTo(area.top + area.height / 2);
    });

    it('서비스 하나만 확대할 때는 최대 배율을 넘지 않는다', () => {
        const v = viewForBounds({ x: 0, y: 0, width: 96, height: 76 }, area, {
            padding: 56,
            maxZoom: 2.2,
        });
        expect(v.zoom).toBe(2.2);
    });

    it('넓은 영역은 보이는 곳에 모두 들어가도록 줄인다', () => {
        const b = { x: 0, y: 0, width: 2000, height: 1000 };
        const v = viewForBounds(b, area, { margin: 24 });
        const tl = screenOf(v, { x: b.x, y: b.y });
        const br = screenOf(v, { x: b.x + b.width, y: b.y + b.height });
        expect(tl.x).toBeGreaterThanOrEqual(area.left);
        expect(tl.y).toBeGreaterThanOrEqual(area.top);
        expect(br.x).toBeLessThanOrEqual(area.left + area.width);
        expect(br.y).toBeLessThanOrEqual(area.top + area.height);
    });

    it('확대 전 뷰로 되돌리려면 저장해 둔 뷰를 그대로 쓰면 된다 (순수 함수라 입력을 바꾸지 않는다)', () => {
        const b = { x: 0, y: 0, width: 100, height: 100 };
        const before = JSON.stringify(b);
        viewForBounds(b, area);
        expect(JSON.stringify(b)).toBe(before);
    });
});
