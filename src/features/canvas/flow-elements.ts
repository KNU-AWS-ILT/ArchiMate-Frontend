import type { Edge, Node } from '@xyflow/react';
import type { Architecture } from '@/features/designs/schemas';
import { categoryColor, getService, type AwsServiceType } from '@/shared/services/catalog';
import { layoutArchitecture, NODE_H, NODE_W } from './layout';

export interface ServiceNodeData extends Record<string, unknown> {
    label: string;
    serviceType: AwsServiceType;
    serviceName: string;
    color: string;
}

export interface GroupNodeData extends Record<string, unknown> {
    label: string;
    kind: string;
}

export type FlowNode = Node<ServiceNodeData, 'service'> | Node<GroupNodeData, 'group'>;

/**
 * 구성도(서버 JSON)를 React Flow 요소로 바꾼다. 좌표는 서버가 주지 않아서 자동 배치한다.
 * 그룹(리전·VPC·서브넷)은 맨 아래에 깔리는 상자로 그린다.
 */
export function toFlowElements(arch: Architecture): { nodes: FlowNode[]; edges: Edge[] } {
    const layout = layoutArchitecture(arch);
    const groupNodes: FlowNode[] = layout.groups.map((g) => ({
        id: `group:${g.id}`,
        type: 'group',
        position: { x: g.x, y: g.y },
        data: { label: g.label, kind: g.kind },
        style: { width: g.width, height: g.height },
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: g.depth - 10,
    }));
    const serviceNodes: FlowNode[] = arch.nodes.map((n) => ({
        id: n.id,
        type: 'service',
        position: layout.positions[n.id] ?? { x: 0, y: 0 },
        data: {
            label: n.label,
            serviceType: n.serviceType,
            serviceName: getService(n.serviceType).name,
            color: categoryColor(n.serviceType),
        },
        style: { width: NODE_W, height: NODE_H },
        draggable: false,
    }));
    const ids = new Set(arch.nodes.map((n) => n.id));
    const edges: Edge[] = arch.edges
        .filter((e) => ids.has(e.from) && ids.has(e.to))
        .map((e, i) => ({
            id: `e${i}:${e.from}->${e.to}`,
            source: e.from,
            target: e.to,
            label: e.label ?? undefined,
            markerEnd: { type: 'arrowclosed' as const },
        }));
    return { nodes: [...groupNodes, ...serviceNodes], edges };
}
