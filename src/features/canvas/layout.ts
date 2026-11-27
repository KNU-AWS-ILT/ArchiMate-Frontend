import type { ArchGroup, Architecture, GroupKind } from '@/features/designs/schemas';

/** 노드 상자 크기 (프로토타입과 같다) */
export const NODE_W = 96;
export const NODE_H = 76;

const X_GAP = 190; // 열 간격
const Y_GAP = 110; // 같은 열의 노드 간격
const LANE_GAP = 96; // 그룹(띠) 사이 간격

export interface Position {
    x: number;
    y: number;
}

export interface GroupBox {
    id: string;
    kind: GroupKind;
    label: string;
    /** 가장 바깥 그룹이 0 */
    depth: number;
    x: number;
    y: number;
    width: number;
    height: number;
    /** 이 그룹과 하위 그룹에 속한 노드 id */
    nodeIds: string[];
}

export interface Layout {
    positions: Record<string, Position>;
    groups: GroupBox[];
}

/**
 * 서버는 좌표를 주지 않으므로 프론트가 그룹 구조로 자동 배치한다. (확정)
 * - x: 사용자에서 시작하는 흐름 순서(가장 긴 경로 길이)
 * - y: 그룹(리전·VPC·서브넷)별 띠. 소속 없는 노드가 맨 위 띠다.
 * 같은 입력이면 항상 같은 결과가 나오는 순수 함수다.
 */
export function layoutArchitecture(arch: Architecture): Layout {
    const { nodes, edges } = arch;
    const groups = arch.groups;

    // 1) 열: 간선을 따라 가장 긴 경로로 계산한다 (순환이 있어도 멈추도록 횟수를 제한한다)
    const layer: Record<string, number> = Object.fromEntries(nodes.map((n) => [n.id, 0]));
    for (let i = 0; i < nodes.length; i++) {
        let changed = false;
        for (const e of edges) {
            if (!(e.from in layer) || !(e.to in layer)) continue;
            if (layer[e.from] + 1 < nodes.length && layer[e.to] < layer[e.from] + 1) {
                layer[e.to] = layer[e.from] + 1;
                changed = true;
            }
        }
        if (!changed) break;
    }

    // 2) 띠 순서: 그룹 트리를 앞에서부터 늘어놓는다. 띠가 이어져 있어서 상자가 다른 노드를 덮지 않는다.
    const order: string[] = [];
    const walk = (parentId: string | null) => {
        for (const g of groups.filter((x) => (x.parentId ?? null) === parentId)) {
            order.push(g.id);
            walk(g.id);
        }
    };
    walk(null);
    const lanes = ['__out', ...order];
    const laneOf = (groupId: string | null | undefined) =>
        groupId && order.includes(groupId) ? groupId : '__out';

    // 3) 좌표
    const positions: Record<string, Position> = {};
    let top = 0;
    for (const lane of lanes) {
        const members = nodes.filter((n) => laneOf(n.groupId) === lane);
        if (members.length === 0) continue;
        const byLayer = new Map<number, typeof members>();
        for (const n of members) byLayer.set(layer[n.id], [...(byLayer.get(layer[n.id]) ?? []), n]);
        const rows = Math.max(...[...byLayer.values()].map((a) => a.length));
        for (const [lv, arr] of byLayer) {
            arr.forEach((n, i) => {
                positions[n.id] = { x: lv * X_GAP, y: top + ((rows - arr.length) / 2 + i) * Y_GAP };
            });
        }
        top += (rows - 1) * Y_GAP + NODE_H + LANE_GAP;
    }

    return {
        positions,
        groups: buildGroupBoxes(
            groups,
            nodes.map((n) => ({ id: n.id, groupId: n.groupId })),
            positions,
        ),
    };
}

/** 그룹 상자: 자기 노드와 하위 그룹 노드를 모두 감싼다. 안쪽 그룹일수록 여백이 작다. */
function buildGroupBoxes(
    groups: ArchGroup[],
    nodes: { id: string; groupId?: string | null }[],
    positions: Record<string, Position>,
): GroupBox[] {
    const children = (id: string) => groups.filter((g) => g.parentId === id);
    const nodeIds = (g: ArchGroup): string[] => [
        ...nodes.filter((n) => n.groupId === g.id).map((n) => n.id),
        ...children(g.id).flatMap(nodeIds),
    ];
    const height = (g: ArchGroup): number => {
        const kids = children(g.id).filter((c) => nodeIds(c).length > 0);
        return kids.length ? 1 + Math.max(...kids.map(height)) : 0;
    };
    const depth = (g: ArchGroup): number => {
        const parent = groups.find((x) => x.id === g.parentId);
        return parent ? 1 + depth(parent) : 0;
    };

    return groups
        .map((g): GroupBox | null => {
            const ids = nodeIds(g);
            if (ids.length === 0) return null;
            const pad = 18 + 16 * height(g);
            const xs = ids.map((id) => positions[id].x);
            const ys = ids.map((id) => positions[id].y);
            const x = Math.min(...xs) - pad;
            const y = Math.min(...ys) - pad;
            return {
                id: g.id,
                kind: g.kind,
                label: g.label,
                depth: depth(g),
                x,
                y,
                width: Math.max(...xs) + NODE_W + pad - x,
                height: Math.max(...ys) + NODE_H + pad - y,
                nodeIds: ids,
            };
        })
        .filter((g): g is GroupBox => g !== null)
        .sort((a, b) => a.depth - b.depth);
}
