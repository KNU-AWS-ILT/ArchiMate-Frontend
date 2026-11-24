import { describe, expect, it } from 'vitest';
import completedJson from '@contracts/examples/design_job_completed.json';
import { designJobSchema, type Architecture } from '@/features/designs/schemas';
import { layoutArchitecture, NODE_H, NODE_W } from './layout';

const job = designJobSchema.parse(completedJson);
const rect = (p: { x: number; y: number }) => ({
    x1: p.x,
    y1: p.y,
    x2: p.x + NODE_W,
    y2: p.y + NODE_H,
});
const overlap = (a: ReturnType<typeof rect>, b: ReturnType<typeof rect>) =>
    a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

describe.each(job.designs.map((d) => [d.tier, d.architecture] as const))(
    '자동 배치 (%s)',
    (_tier, arch) => {
        const layout = layoutArchitecture(arch);

        it('모든 노드에 좌표가 있고 서로 겹치지 않는다', () => {
            expect(Object.keys(layout.positions).sort()).toEqual(
                arch.nodes.map((n) => n.id).sort(),
            );
            const rects = arch.nodes.map((n) => rect(layout.positions[n.id]));
            for (let i = 0; i < rects.length; i++)
                for (let j = i + 1; j < rects.length; j++)
                    expect(overlap(rects[i], rects[j])).toBe(false);
        });

        it('그룹 상자는 자기 노드를 모두 감싸고 다른 노드를 덮지 않는다', () => {
            for (const g of layout.groups) {
                const box = { x1: g.x, y1: g.y, x2: g.x + g.width, y2: g.y + g.height };
                for (const n of arch.nodes) {
                    const r = rect(layout.positions[n.id]);
                    const inside =
                        r.x1 >= box.x1 && r.y1 >= box.y1 && r.x2 <= box.x2 && r.y2 <= box.y2;
                    expect(inside).toBe(g.nodeIds.includes(n.id));
                    if (!g.nodeIds.includes(n.id)) expect(overlap(r, box)).toBe(false);
                }
            }
        });

        it('흐름 방향(왼쪽 → 오른쪽)을 따른다: 사용자가 가장 왼쪽 열이다', () => {
            const minX = Math.min(...Object.values(layout.positions).map((p) => p.x));
            expect(layout.positions['users'].x).toBe(minX);
        });

        it('같은 입력이면 같은 결과다', () => {
            expect(layoutArchitecture(arch)).toEqual(layout);
        });
    },
);

describe('그룹 중첩', () => {
    it('확장형은 리전 ⊃ VPC ⊃ 서브넷이고, 바깥 그룹일수록 크다', () => {
        const arch = job.designs.find((d) => d.tier === 'scalable')!.architecture;
        const { groups } = layoutArchitecture(arch);
        const byId = Object.fromEntries(groups.map((g) => [g.id, g]));
        expect(byId.region_seoul.depth).toBe(0);
        expect(byId.vpc_main.depth).toBe(1);
        expect(byId.public_subnet.depth).toBe(2);
        const contains = (o: (typeof groups)[number], i: (typeof groups)[number]) =>
            o.x < i.x &&
            o.y < i.y &&
            o.x + o.width > i.x + i.width &&
            o.y + o.height > i.y + i.height;
        expect(contains(byId.region_seoul, byId.vpc_main)).toBe(true);
        expect(contains(byId.vpc_main, byId.private_subnet)).toBe(true);
    });

    it('노드가 없는 그룹은 그리지 않는다', () => {
        const arch: Architecture = {
            nodes: [
                { id: 'a', serviceType: 'users', label: 'a', role: '', reason: '', groupId: null },
            ],
            edges: [],
            groups: [{ id: 'empty', kind: 'vpc', label: 'x', parentId: null }],
        };
        expect(layoutArchitecture(arch).groups).toEqual([]);
    });

    it('간선이 순환해도 멈춘다', () => {
        const n = (id: string) => ({
            id,
            serviceType: 'lambda' as const,
            label: id,
            role: '',
            reason: '',
            groupId: null,
        });
        const arch: Architecture = {
            nodes: [n('a'), n('b')],
            edges: [
                { from: 'a', to: 'b' },
                { from: 'b', to: 'a' },
            ],
            groups: [],
        };
        expect(Object.keys(layoutArchitecture(arch).positions)).toHaveLength(2);
    });
});
