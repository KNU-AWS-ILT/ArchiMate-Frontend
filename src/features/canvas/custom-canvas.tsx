'use client';

import {
    addEdge as rfAddEdge,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type Connection,
    type Edge,
} from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import {
    getService,
    AWS_SERVICE_TYPES,
    categoryColor,
    type AwsServiceType,
} from '@/shared/services/catalog';
import { ServiceIcon } from '@/shared/ui/service-icon';
import { DiagramCanvas } from './diagram-canvas';
import {
    CUSTOM_KEY,
    addEdge,
    addService,
    fromFlow,
    hasEdge,
    parseCustom,
    serializeCustom,
    toFlow,
    type CustomModel,
} from './custom-model';
import type { FlowNode, ServiceFlowNode } from './flow-elements';

interface Props {
    /** `true`면 저장된 캔버스를 지우고 빈 캔버스로 시작한다. */
    fresh: boolean;
    onToast: (message: string) => void;
    /** 서비스·연결 개수가 바뀔 때 알린다. (3안 메뉴 표시용) */
    onSummary: (summary: { nodes: number; edges: number }) => void;
}

function loadInitial(fresh: boolean): CustomModel {
    if (fresh || typeof window === 'undefined') return parseCustom(null);
    try {
        return parseCustom(window.localStorage.getItem(CUSTOM_KEY));
    } catch {
        return parseCustom(null);
    }
}

/** 직접 구성하는 캔버스. 서비스를 더하고, 끌어서 옮기고, 모서리에서 끌어 이은 뒤 Delete로 지운다. */
export function CustomCanvas({ fresh, onToast, onSummary }: Props) {
    const [initial] = useState(() => loadInitial(fresh));
    const flow = useState(() => toFlow(initial))[0];
    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(flow.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(flow.edges);
    const seq = useRef(initial.seq);

    // 바뀔 때마다 저장하고 개수를 알린다.
    useEffect(() => {
        const services = nodes.filter((n): n is ServiceFlowNode => n.type === 'service');
        const model = fromFlow(services, edges, seq.current);
        try {
            window.localStorage.setItem(CUSTOM_KEY, serializeCustom(model));
        } catch {
            // 저장 실패는 무시한다. 화면은 그대로 동작한다.
        }
        onSummary({ nodes: model.nodes.length, edges: model.edges.length });
    }, [nodes, edges, onSummary]);

    const currentModel = (): CustomModel =>
        fromFlow(
            nodes.filter((n): n is ServiceFlowNode => n.type === 'service'),
            edges,
            seq.current,
        );

    const onConnect = (c: Connection) => {
        if (!c.source || !c.target) return;
        const next = addEdge(currentModel(), c.source, c.target);
        if (!next) {
            onToast(
                c.source === c.target || hasEdge(currentModel().edges, c.source, c.target)
                    ? '이미 연결돼 있어요'
                    : '연결할 수 없어요',
            );
            return;
        }
        setEdges((es) =>
            rfAddEdge({ id: `c:${c.source}->${c.target}`, source: c.source, target: c.target }, es),
        );
        onToast('연결했어요');
    };

    const add = (type: AwsServiceType, center: { x: number; y: number }) => {
        const { model, id } = addService(currentModel(), type, center);
        seq.current = model.seq;
        const node = toFlow(model).nodes.find((n) => n.id === id)!;
        setNodes((ns) => [
            ...ns.map((n) => ({ ...n, selected: false })),
            { ...node, selected: true },
        ]);
    };

    return (
        <DiagramCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            movable
            linkable
            onSelectNode={() => {}}
            onDeleted={() => onToast('지웠어요')}
        >
            <CustomTools onAdd={add} empty={nodes.length === 0} />
        </DiagramCanvas>
    );
}

interface ToolsProps {
    onAdd: (type: AwsServiceType, center: { x: number; y: number }) => void;
    empty: boolean;
}

/** 캔버스 위에 떠 있는 "서비스 추가" 버튼과 서비스 목록 */
function CustomTools({ onAdd, empty }: ToolsProps) {
    const flow = useReactFlow();
    const [open, setOpen] = useState(false);
    const addAtCenter = (type: AwsServiceType) => {
        const el = document.querySelector('.react-flow');
        const r = el?.getBoundingClientRect();
        const center = flow.screenToFlowPosition({
            x: (r?.left ?? 0) + (r?.width ?? 800) / 2,
            y: (r?.top ?? 0) + (r?.height ?? 600) / 2 + 30,
        });
        onAdd(type, center);
        setOpen(false);
    };
    return (
        <>
            <div className="absolute top-[88px] left-1/2 z-5 -translate-x-1/2">
                <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpen((o) => !o)}
                    className="rounded-full border border-border bg-surface px-4 py-2 font-semibold shadow-card hover:border-accent"
                >
                    ＋ 서비스 추가
                </button>
                {open && (
                    <div
                        role="menu"
                        aria-label="서비스 목록"
                        className="absolute top-12 left-1/2 grid max-h-[60vh] w-[min(92vw,560px)] -translate-x-1/2 grid-cols-2 gap-1.5 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-card sm:grid-cols-3"
                    >
                        {AWS_SERVICE_TYPES.map((t) => {
                            const info = getService(t);
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    role="menuitem"
                                    onClick={() => addAtCenter(t)}
                                    className="flex items-center gap-2 rounded-lg p-2 text-left hover:bg-accent-soft"
                                >
                                    <span
                                        className="grid size-7 shrink-0 place-items-center rounded text-white"
                                        style={{ background: categoryColor(t) }}
                                    >
                                        <ServiceIcon icon={info.icon} className="size-4" />
                                    </span>
                                    <span className="min-w-0">
                                        <b className="block truncate text-sub">{info.ko}</b>
                                        <small className="block truncate text-cap text-muted">
                                            {info.name}
                                        </small>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            {empty && (
                <div className="pointer-events-none absolute top-1/2 left-1/2 z-5 w-[min(80%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-dashed border-border bg-surface/90 p-5 text-center">
                    <b className="mb-1 block text-title">새 캔버스</b>
                    <span className="block text-body text-muted">
                        위쪽의 &quot;서비스 추가&quot;를 눌러 시작하세요.
                    </span>
                    <span className="block text-sub text-muted">
                        서비스를 끌어서 옮기고, 블록 모서리에서 다른 블록으로 끌면 선이 이어져요.
                    </span>
                </div>
            )}
        </>
    );
}
