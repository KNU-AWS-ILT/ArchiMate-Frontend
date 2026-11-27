import type { Edge } from '@xyflow/react';
import { z } from 'zod';
import { AWS_SERVICE_TYPES, getService, type AwsServiceType } from '@/shared/services/catalog';
import { serviceNode, NODE_SIZE, type ServiceFlowNode } from './flow-elements';

// 새 캔버스(직접 구성)는 백엔드 계약에 없는 기능이라 브라우저(localStorage)에만 저장하고 하나만 유지한다.
export const CUSTOM_KEY = 'archimate-custom-canvas';

const nodeSchema = z.object({
    id: z.string(),
    type: z.enum(AWS_SERVICE_TYPES),
    label: z.string(),
    x: z.number(),
    y: z.number(),
});
const modelSchema = z.object({
    nodes: z.array(nodeSchema),
    edges: z.array(z.tuple([z.string(), z.string()])),
    seq: z.number().int().nonnegative(),
});

export type CustomNode = z.infer<typeof nodeSchema>;
export type CustomModel = z.infer<typeof modelSchema>;

export const emptyModel = (): CustomModel => ({ nodes: [], edges: [], seq: 0 });

/** 저장된 글을 읽는다. 깨졌거나 없으면 빈 캔버스다. 없는 서비스를 가리키는 연결선은 버린다. */
export function parseCustom(raw: string | null): CustomModel {
    if (!raw) return emptyModel();
    try {
        const parsed = modelSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) return emptyModel();
        const ids = new Set(parsed.data.nodes.map((n) => n.id));
        return {
            ...parsed.data,
            edges: parsed.data.edges.filter(([a, b]) => ids.has(a) && ids.has(b) && a !== b),
        };
    } catch {
        return emptyModel();
    }
}

export const serializeCustom = (model: CustomModel): string => JSON.stringify(model);

const snap = (v: number) => Math.round(v / 8) * 8;

/**
 * 화면 가운데에서 시작해 다른 서비스와 겹치지 않는 가장 가까운 빈자리를 찾는다.
 * 중심에서 바깥으로 한 칸씩 넓혀 가며 찾고, 못 찾으면 중심에 놓는다.
 */
export function findFreeSpot(
    taken: ReadonlyArray<{ x: number; y: number }>,
    center: { x: number; y: number },
): { x: number; y: number } {
    const cx = center.x - NODE_SIZE.width / 2;
    const cy = center.y - NODE_SIZE.height / 2;
    const free = (x: number, y: number) =>
        taken.every(
            (m) =>
                Math.abs(m.x - x) > NODE_SIZE.width + 20 ||
                Math.abs(m.y - y) > NODE_SIZE.height + 20,
        );
    for (let r = 0; r < 8; r++) {
        for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
                const x = snap(cx + dx * (NODE_SIZE.width + 36));
                const y = snap(cy + dy * (NODE_SIZE.height + 36));
                if (free(x, y)) return { x, y };
            }
        }
    }
    return { x: snap(cx), y: snap(cy) };
}

export function addService(
    model: CustomModel,
    type: AwsServiceType,
    center: { x: number; y: number },
): { model: CustomModel; id: string } {
    const seq = model.seq + 1;
    const id = `n${seq}`;
    const pos = findFreeSpot(model.nodes, center);
    const node: CustomNode = { id, type, label: getService(type).ko, ...pos };
    return { model: { ...model, seq, nodes: [...model.nodes, node] }, id };
}

export const hasEdge = (edges: ReadonlyArray<readonly [string, string]>, a: string, b: string) =>
    edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** 연결을 더한다. 자기 자신이거나 이미 (어느 방향이든) 이어져 있으면 `null`이다. */
export function addEdge(model: CustomModel, a: string, b: string): CustomModel | null {
    if (a === b || hasEdge(model.edges, a, b)) return null;
    return { ...model, edges: [...model.edges, [a, b]] };
}

export function removeNodes(model: CustomModel, ids: ReadonlySet<string>): CustomModel {
    return {
        ...model,
        nodes: model.nodes.filter((n) => !ids.has(n.id)),
        edges: model.edges.filter(([a, b]) => !ids.has(a) && !ids.has(b)),
    };
}

export function toFlow(model: CustomModel): { nodes: ServiceFlowNode[]; edges: Edge[] } {
    return {
        nodes: model.nodes.map((n) =>
            serviceNode({
                id: n.id,
                serviceType: n.type,
                label: n.label,
                position: { x: n.x, y: n.y },
            }),
        ),
        edges: model.edges.map(([a, b]) => ({ id: `c:${a}->${b}`, source: a, target: b })),
    };
}

/** 화면 상태(드래그로 바뀐 위치 포함)를 저장 모양으로 되돌린다. */
export function fromFlow(nodes: ServiceFlowNode[], edges: Edge[], seq: number): CustomModel {
    return {
        seq,
        nodes: nodes.map((n) => ({
            id: n.id,
            type: n.data.serviceType,
            label: n.data.label,
            x: Math.round(n.position.x),
            y: Math.round(n.position.y),
        })),
        edges: edges.map((e) => [e.source, e.target] as [string, string]),
    };
}
