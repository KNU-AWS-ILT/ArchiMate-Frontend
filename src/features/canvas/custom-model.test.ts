import { describe, expect, it } from 'vitest';
import {
    addEdge,
    addService,
    emptyModel,
    findFreeSpot,
    fromFlow,
    parseCustom,
    removeNodes,
    serializeCustom,
    toFlow,
} from './custom-model';

const center = { x: 400, y: 300 };

describe('서비스 추가', () => {
    it('이름은 한글 이름이고 id는 n1, n2…로 늘어난다', () => {
        const a = addService(emptyModel(), 'lambda', center);
        expect(a.id).toBe('n1');
        expect(a.model.nodes[0].label).toBe('서버리스 함수');
        const b = addService(a.model, 's3', center);
        expect(b.id).toBe('n2');
    });

    it('같은 자리에 겹쳐 놓지 않는다', () => {
        let m = emptyModel();
        for (let i = 0; i < 6; i++) m = addService(m, 'lambda', center).model;
        const keys = new Set(m.nodes.map((n) => `${n.x},${n.y}`));
        expect(keys.size).toBe(6);
    });

    it('빈 캔버스에서는 중심에 놓고 8px 격자에 맞춘다', () => {
        const p = findFreeSpot([], center);
        expect(p.x % 8).toBe(0);
        expect(p.y % 8).toBe(0);
        expect(Math.abs(p.x + 48 - center.x)).toBeLessThanOrEqual(4);
    });
});

describe('연결', () => {
    const base = () => {
        let m = emptyModel();
        m = addService(m, 'lambda', center).model;
        m = addService(m, 's3', center).model;
        return m;
    };
    it('연결을 더한다', () => {
        expect(addEdge(base(), 'n1', 'n2')?.edges).toEqual([['n1', 'n2']]);
    });
    it('자기 자신과는 잇지 않는다', () => {
        expect(addEdge(base(), 'n1', 'n1')).toBeNull();
    });
    it('반대 방향이라도 이미 이어져 있으면 막는다', () => {
        const m = addEdge(base(), 'n1', 'n2')!;
        expect(addEdge(m, 'n2', 'n1')).toBeNull();
        expect(addEdge(m, 'n1', 'n2')).toBeNull();
    });
});

describe('삭제', () => {
    it('서비스를 지우면 그 서비스의 연결선도 함께 지운다', () => {
        let m = emptyModel();
        m = addService(m, 'lambda', center).model;
        m = addService(m, 's3', center).model;
        m = addService(m, 'dynamodb', center).model;
        m = addEdge(m, 'n1', 'n2')!;
        m = addEdge(m, 'n2', 'n3')!;
        const after = removeNodes(m, new Set(['n2']));
        expect(after.nodes.map((n) => n.id)).toEqual(['n1', 'n3']);
        expect(after.edges).toEqual([]);
    });
});

describe('저장과 읽기', () => {
    it('저장한 것을 그대로 읽는다', () => {
        let m = addService(emptyModel(), 'lambda', center).model;
        m = addService(m, 's3', center).model;
        m = addEdge(m, 'n1', 'n2')!;
        expect(parseCustom(serializeCustom(m))).toEqual(m);
    });
    it('없거나 깨진 값은 빈 캔버스다', () => {
        expect(parseCustom(null)).toEqual(emptyModel());
        expect(parseCustom('{not json')).toEqual(emptyModel());
        expect(parseCustom('{"nodes":[{"id":"n1","type":"unknown"}]}')).toEqual(emptyModel());
    });
    it('없는 서비스를 가리키는 연결선은 버린다', () => {
        const raw = JSON.stringify({
            seq: 1,
            nodes: [{ id: 'n1', type: 'lambda', label: 'x', x: 0, y: 0 }],
            edges: [['n1', 'n9']],
        });
        expect(parseCustom(raw).edges).toEqual([]);
    });
});

describe('화면 요소로 바꾸기', () => {
    it('옮긴 위치까지 저장 모양으로 되돌린다', () => {
        let m = addService(emptyModel(), 'lambda', center).model;
        m = addService(m, 's3', center).model;
        m = addEdge(m, 'n1', 'n2')!;
        const { nodes, edges } = toFlow(m);
        nodes[0].position = { x: 123.4, y: 55.6 };
        const back = fromFlow(nodes, edges, m.seq);
        expect(back.nodes[0]).toMatchObject({ id: 'n1', x: 123, y: 56, type: 'lambda' });
        expect(back.edges).toEqual([['n1', 'n2']]);
    });
});
