'use client';

import {
    Background,
    ConnectionMode,
    Handle,
    Position,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
    type Edge,
    type NodeProps,
    type NodeTypes,
    type OnConnect,
    type OnEdgesChange,
    type OnNodesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { ServiceIcon } from '@/shared/ui/service-icon';
import {
    NODE_SIZE,
    type FlowNode,
    type GroupFlowNode,
    type ServiceFlowNode,
} from './flow-elements';
import { pickSides, type Side } from './handles';
import { FIT_PADDING, FOCUS_PADDING } from './viewport';

/** 노드 모양이 알아야 하는 캔버스 설정 */
const CanvasModeContext = createContext({ linkable: false });

const POSITION: Record<Side, Position> = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
};
const SIDES: Side[] = ['top', 'right', 'bottom', 'left'];

function ServiceNode({ id, data, selected }: NodeProps<ServiceFlowNode>) {
    const { linkable } = useContext(CanvasModeContext);
    const { deleteElements } = useReactFlow();
    return (
        <div
            title={data.tooltip}
            data-testid={`node-${data.serviceType}`}
            style={{ '--c': data.color } as React.CSSProperties}
            className={cn(
                'node-card relative flex h-full w-full cursor-pointer flex-col items-center justify-center gap-[3px] rounded border border-border border-t-2 border-t-(--c) bg-surface px-[3px] py-1 shadow-card transition hover:-translate-y-px',
                selected && 'ring-2 ring-(--c)',
            )}
        >
            <span className="grid size-6 place-items-center rounded bg-(--c) text-white">
                <ServiceIcon icon={data.icon} className="size-[15px]" />
            </span>
            <span className="px-[3px] text-center text-[10px] leading-tight font-semibold">
                {data.label}
            </span>
            <span className="text-[7.5px] text-muted">{data.serviceName}</span>
            {SIDES.map((s) => (
                <Handle
                    key={s}
                    id={s}
                    type="source"
                    position={POSITION[s]}
                    isConnectable={linkable}
                    className="node-handle"
                />
            ))}
            {linkable && selected && (
                <button
                    type="button"
                    aria-label="서비스 삭제"
                    title="삭제 (Delete)"
                    className="nodrag absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-danger text-[11px] text-white hover:bg-danger-hover"
                    onClick={(e) => {
                        e.stopPropagation();
                        void deleteElements({ nodes: [{ id }] });
                    }}
                >
                    ✕
                </button>
            )}
        </div>
    );
}

function GroupNode({ data }: { data: GroupFlowNode['data'] }) {
    return (
        <div className={cn('group-box h-full w-full rounded', `kind-${data.kind}`)}>
            <span className="absolute top-1 left-[9px] text-[10.5px] font-semibold text-muted">
                {data.label}
            </span>
        </div>
    );
}

const nodeTypes: NodeTypes = { service: ServiceNode, group: GroupNode };

interface Props {
    nodes: FlowNode[];
    edges: Edge[];
    onNodesChange: OnNodesChange<FlowNode>;
    onEdgesChange: OnEdgesChange;
    onConnect?: OnConnect;
    /** 서비스를 끌어서 옮길 수 있다. (Edit 모드) */
    movable: boolean;
    /** 서비스끼리 잇고 지울 수 있다. (새 캔버스) */
    linkable?: boolean;
    /** 설정 단계에서 강조할 서비스. 있으면 그쪽으로 확대하고 나머지는 흐리게 한다. */
    focusIds?: ReadonlySet<string>;
    onSelectNode: (id: string | null) => void;
    /** Delete 키나 삭제 버튼으로 서비스·연결선을 지웠을 때 */
    onDeleted?: () => void;
    children?: ReactNode;
}

const NO_FOCUS: ReadonlySet<string> = new Set();

/** 구성도를 그린다. 상태(노드·연결선)는 부모가 들고 있고, 이 컴포넌트는 모양과 카메라만 맡는다. */
export function DiagramCanvas(props: Props) {
    return (
        <ReactFlowProvider>
            <Inner {...props} />
        </ReactFlowProvider>
    );
}

function Inner({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    movable,
    linkable = false,
    focusIds = NO_FOCUS,
    onSelectNode,
    onDeleted,
    children,
}: Props) {
    const flow = useReactFlow<FlowNode>();
    const home = useRef<{ x: number; y: number; zoom: number } | null>(null);

    // 설정 단계 서비스로 확대하고, 강조가 풀리면 원래 보던 곳으로 돌아온다.
    useEffect(() => {
        if (focusIds.size > 0) {
            home.current ??= flow.getViewport();
            void flow.fitView({
                nodes: [...focusIds].map((id) => ({ id })),
                padding: FOCUS_PADDING,
                maxZoom: 2.2,
                duration: 450,
            });
        } else if (home.current) {
            const v = home.current;
            home.current = null;
            void flow.setViewport(v, { duration: 450 });
        }
    }, [focusIds, flow]);

    const fit = () => {
        home.current = null;
        void flow.fitView({ padding: FIT_PADDING, maxZoom: 1.6, duration: 250 });
    };

    // + / - / 0 단축키
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (t?.closest('input, textarea, select, [contenteditable="true"]')) return;
            if (e.key === '+' || e.key === '=') void flow.zoomIn({ duration: 150 });
            else if (e.key === '-') void flow.zoomOut({ duration: 150 });
            else if (e.key === '0') fit();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flow]);

    const selectedId = nodes.find((n) => n.selected && n.type === 'service')?.id ?? null;
    const dimming = focusIds.size > 0 || selectedId !== null;

    const displayNodes = useMemo(
        () =>
            nodes.map((n) => {
                if (n.type !== 'service') return n;
                const focused = focusIds.has(n.id);
                return {
                    ...n,
                    draggable: movable,
                    connectable: linkable,
                    className: cn(
                        focused && 'is-focus',
                        focusIds.size > 0 && !focused && !n.selected && 'is-dim',
                    ),
                };
            }),
        [nodes, focusIds, movable, linkable],
    );

    const displayEdges = useMemo(() => {
        const at = new Map(
            nodes.filter((n) => n.type === 'service').map((n) => [n.id, n.position]),
        );
        return edges.map((e) => {
            const a = at.get(e.source);
            const b = at.get(e.target);
            const sides =
                a && b
                    ? pickSides(a, b, NODE_SIZE)
                    : { source: 'right' as Side, target: 'left' as Side };
            const highlighted =
                selectedId !== null
                    ? e.source === selectedId || e.target === selectedId
                    : focusIds.has(e.source) && focusIds.has(e.target);
            return {
                ...e,
                type: 'step',
                sourceHandle: sides.source,
                targetHandle: sides.target,
                className: cn(
                    highlighted && 'is-hl',
                    dimming && !highlighted && !e.selected && 'is-dim',
                ),
                interactionWidth: linkable ? 18 : 0,
                labelStyle: { fontSize: 9.5, fill: 'var(--muted)' },
                labelBgStyle: { fill: 'var(--bg)' },
                labelBgPadding: [3, 2] as [number, number],
                focusable: linkable,
                selectable: linkable,
            };
        });
    }, [edges, nodes, selectedId, focusIds, dimming, linkable]);

    return (
        <CanvasModeContext.Provider value={{ linkable }}>
            <div
                className={cn(
                    'relative h-full w-full',
                    linkable && 'linkable',
                    movable && 'movable',
                )}
            >
                <ReactFlow
                    nodes={displayNodes}
                    edges={displayEdges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    connectionMode={ConnectionMode.Loose}
                    connectionRadius={64}
                    fitView
                    fitViewOptions={{ padding: FIT_PADDING, maxZoom: 1.6 }}
                    minZoom={0.3}
                    maxZoom={3}
                    nodesDraggable={movable}
                    nodesConnectable={linkable}
                    elementsSelectable
                    deleteKeyCode={linkable ? ['Delete', 'Backspace'] : null}
                    selectionKeyCode={null}
                    proOptions={{ hideAttribution: true }}
                    onNodeClick={(_, node) =>
                        onSelectNode(node.type === 'service' ? node.id : null)
                    }
                    onPaneClick={() => onSelectNode(null)}
                    onNodesDelete={onDeleted}
                    onEdgesDelete={onDeleted}
                >
                    <Background gap={16} size={1} color="var(--grid)" />
                </ReactFlow>
                <div className="absolute right-9 bottom-10 z-5 flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card">
                    <ZoomButton label="확대" onClick={() => void flow.zoomIn({ duration: 150 })}>
                        +
                    </ZoomButton>
                    <ZoomButton label="축소" onClick={() => void flow.zoomOut({ duration: 150 })}>
                        −
                    </ZoomButton>
                    <ZoomButton label="화면에 맞추기" onClick={fit}>
                        <svg
                            viewBox="0 0 24 24"
                            className="size-[15px] fill-none stroke-current stroke-2"
                        >
                            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
                        </svg>
                    </ZoomButton>
                </div>
                {children}
            </div>
        </CanvasModeContext.Provider>
    );
}

function ZoomButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className="grid size-10 place-items-center border-b border-border text-xl last:border-b-0 hover:bg-accent-soft"
        >
            {children}
        </button>
    );
}
