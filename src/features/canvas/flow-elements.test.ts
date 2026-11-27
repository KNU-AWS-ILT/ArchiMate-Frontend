import { describe, expect, it } from 'vitest';
import completed from '@contracts/examples/design_job_completed.json';
import { designJobSchema } from '@/features/designs/schemas';
import { toFlowElements } from './flow-elements';

const arch = designJobSchema.parse(completed).designs[0].architecture;

describe('toFlowElements', () => {
    const { nodes, edges } = toFlowElements(arch);
    const services = nodes.filter((n) => n.type === 'service');
    const groups = nodes.filter((n) => n.type === 'group');

    it('노드마다 서비스 상자를 하나씩 만든다', () => {
        expect(services.map((n) => n.id).sort()).toEqual(arch.nodes.map((n) => n.id).sort());
    });

    it('그룹마다 크기가 있는 배경 상자를 만든다', () => {
        expect(groups).toHaveLength(arch.groups.length);
        for (const g of groups) {
            expect(g.style?.width).toBeGreaterThan(0);
            expect(g.selectable).toBe(false);
        }
    });

    it('그룹 상자가 서비스 상자보다 앞에 있어 아래에 깔린다', () => {
        const firstService = nodes.findIndex((n) => n.type === 'service');
        const lastGroup = nodes.map((n) => n.type).lastIndexOf('group');
        if (lastGroup >= 0) expect(lastGroup).toBeLessThan(firstService);
    });

    it('연결선은 구성도의 edges와 같은 수다', () => {
        expect(edges).toHaveLength(arch.edges.length);
        expect(edges[0].source).toBe(arch.edges[0].from);
    });

    it('없는 노드를 가리키는 연결선은 버린다', () => {
        const broken = { ...arch, edges: [...arch.edges, { from: 'x', to: 'y' }] };
        expect(toFlowElements(broken).edges).toHaveLength(arch.edges.length);
    });

    it('서비스 상자에 이름과 카테고리 색이 들어 있다', () => {
        const first = services[0];
        expect(first.data.serviceName).toBeTruthy();
        expect(first.data.color).toMatch(/^#|^var\(|^rgb|^hsl/);
    });
});
