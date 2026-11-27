'use client';

import {
    Background,
    Controls,
    Handle,
    Position,
    ReactFlow,
    type NodeProps,
    type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMemo } from 'react';
import type { Architecture } from '@/features/designs/schemas';
import { toFlowElements, type FlowNode } from './flow-elements';

function ServiceNode({ data, selected }: NodeProps<Extract<FlowNode, { type: 'service' }>>) {
    return (
        <div
            data-testid={`node-${data.serviceType}`}
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 bg-surface px-1 text-center shadow-card"
            style={{
                borderColor: data.color,
                boxShadow: selected ? `0 0 0 3px ${data.color}55` : undefined,
            }}
        >
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={false}
                className="opacity-0"
            />
            <span className="text-cap font-bold" style={{ color: data.color }}>
                {data.serviceName}
            </span>
            <span className="line-clamp-2 text-cap leading-tight text-muted">{data.label}</span>
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={false}
                className="opacity-0"
            />
        </div>
    );
}

function GroupNode({ data }: NodeProps<Extract<FlowNode, { type: 'group' }>>) {
    return (
        <div className="h-full w-full rounded-xl border border-dashed border-edge bg-surface-2/60">
            <span className="m-2 inline-block text-cap font-semibold text-muted">{data.label}</span>
        </div>
    );
}

const nodeTypes: NodeTypes = { service: ServiceNode, group: GroupNode };

interface Props {
    architecture: Architecture;
    selectedNodeId: string | null;
    onSelectNode: (id: string | null) => void;
}

/** 구성도를 그린다. 보기 전용이라 노드를 끌거나 잇지 못한다. */
export function DiagramCanvas({ architecture, selectedNodeId, onSelectNode }: Props) {
    const { nodes, edges } = useMemo(() => {
        const el = toFlowElements(architecture);
        return {
            edges: el.edges,
            nodes: el.nodes.map((n) => ({ ...n, selected: n.id === selectedNodeId })),
        };
    }, [architecture, selectedNodeId]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            nodesDraggable={false}
            nodesConnectable={false}
            minZoom={0.3}
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_, node) => {
                if (node.type === 'service') onSelectNode(node.id);
            }}
            onPaneClick={() => onSelectNode(null)}
        >
            <Background gap={16} />
            <Controls showInteractive={false} />
        </ReactFlow>
    );
}
