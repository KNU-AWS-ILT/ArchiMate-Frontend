import type { Edge, Node } from '@xyflow/react';
import type { Architecture } from '@/features/designs/schemas';
import { categoryColor, getService, type AwsServiceType } from '@/shared/services/catalog';
import { layoutArchitecture, NODE_H, NODE_W } from './layout';

export interface ServiceNodeData extends Record<string, unknown> {
    label: string;
    serviceType: AwsServiceType;
    /** AWS 서비스 이름 (노드 아래 작은 글씨) */
    serviceName: string;
    color: string;
    icon: string;
    /** 마우스를 올렸을 때 보이는 설명 */
    tooltip: string;
}

export interface GroupNodeData extends Record<string, unknown> {
    label: string;
    kind: string;
}

export type ServiceFlowNode = Node<ServiceNodeData, 'service'>;
export type GroupFlowNode = Node<GroupNodeData, 'group'>;
export type FlowNode = ServiceFlowNode | GroupFlowNode;

export const NODE_SIZE = { width: NODE_W, height: NODE_H };

/** 서비스 상자 하나. 3안과 새 캔버스가 같은 모양을 쓴다. */
export function serviceNode(init: {
    id: string;
    serviceType: AwsServiceType;
    label: string;
    position: { x: number; y: number };
    role?: string;
}): ServiceFlowNode {
    const info = getService(init.serviceType);
    return {
        id: init.id,
        type: 'service',
        position: init.position,
        data: {
            label: init.label,
            serviceType: init.serviceType,
            serviceName: info.name,
            color: categoryColor(init.serviceType),
            icon: info.icon,
            tooltip: init.role ? `${init.label} — ${init.role}` : init.label,
        },
        style: { width: NODE_W, height: NODE_H },
        draggable: true,
    };
}

/**
 * 구성도(서버 JSON)를 React Flow 요소로 바꾼다. 좌표는 서버가 주지 않아서 자동 배치한다.
 * 그룹(리전·VPC·서브넷)은 맨 아래에 깔리는 상자로 그린다.
 * 연결선이 어느 변을 쓰는지는 캔버스가 노드 위치로 정한다. (노드를 옮기면 따라서 바뀐다)
 */
export function toFlowElements(arch: Architecture): { nodes: FlowNode[]; edges: Edge[] } {
    const layout = layoutArchitecture(arch);
    const groupNodes: GroupFlowNode[] = layout.groups.map((g) => ({
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
    const serviceNodes: ServiceFlowNode[] = arch.nodes.map((n) =>
        serviceNode({
            id: n.id,
            serviceType: n.serviceType,
            label: n.label,
            role: n.role,
            position: layout.positions[n.id] ?? { x: 0, y: 0 },
        }),
    );
    const ids = new Set(arch.nodes.map((n) => n.id));
    const edges: Edge[] = arch.edges
        .filter((e) => ids.has(e.from) && ids.has(e.to))
        .map((e, i) => ({
            id: `e${i}:${e.from}->${e.to}`,
            source: e.from,
            target: e.to,
            label: e.label ?? undefined,
        }));
    return { nodes: [...groupNodes, ...serviceNodes], edges };
}
