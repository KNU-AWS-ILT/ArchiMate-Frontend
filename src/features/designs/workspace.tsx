'use client';

import { useEdgesState, useNodesState } from '@xyflow/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccountMenu } from '@/features/auth/account-menu';
import { CustomCanvas } from '@/features/canvas/custom-canvas';
import { DiagramCanvas } from '@/features/canvas/diagram-canvas';
import { toFlowElements, type FlowNode } from '@/features/canvas/flow-elements';
import { GuidePanel } from '@/features/guide/guide-panel';
import { saveStepDone, loadDoneSteps } from '@/features/guide/storage';
import { stepKey } from '@/features/guide/progress';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/shared/ui/dialog';
import { ShortcutsModal } from '@/shared/ui/shortcuts-modal';
import { ThemeSwitch } from '@/shared/ui/theme-switch';
import { Toast, useToast } from '@/shared/ui/toast';
import { CompareModal } from './compare-modal';
import { FailModal } from './fail-modal';
import {
    PANEL_STORAGE_KEY,
    clampPanelWidth,
    defaultPanelWidth,
    parseStoredWidth,
} from './panel-width';
import type { Design, DesignJob, Tier } from './schemas';
import { TierMenu, type CustomSummary } from './tier-menu';
import { isFailedEntry, TIER_LABEL, tierEntries } from './tiers';
import type { Retry } from './use-retry';

interface Props {
    job: DesignJob;
    retry: Retry;
}

type Mode = 'design' | 'custom';
interface OpenStep {
    id: string;
    /** 단계를 눌러 열었을 때만 서비스를 강조하고 확대한다. 서비스를 눌러 열린 단계는 강조하지 않는다. */
    focus: boolean;
}

const NO_NODES = new Set<string>();

export function Workspace({ job, retry }: Props) {
    const router = useRouter();
    const entries = useMemo(() => tierEntries(job), [job]);
    const firstTier = entries.find((e) => !isFailedEntry(e))?.tier ?? entries[0]?.tier;

    const [mode, setMode] = useState<Mode>('design');
    const [tier, setTier] = useState<Tier | undefined>(firstTier);
    const [edit, setEdit] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [openStep, setOpenStep] = useState<OpenStep | null>(null);
    const [phaseKey, setPhaseKey] = useState<string | null>(null);
    const [done, setDone] = useState<Set<string>>(() =>
        typeof window === 'undefined' ? new Set() : loadDoneSteps(window.localStorage),
    );
    const [customKey, setCustomKey] = useState(0);
    const [customFresh, setCustomFresh] = useState(false);
    const [customSummary, setCustomSummary] = useState<CustomSummary>(() => readCustomSummary());
    const [compareOpen, setCompareOpen] = useState(false);
    const [failTier, setFailTier] = useState<{ tier: Tier | null } | null>(null);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [restartOpen, setRestartOpen] = useState(false);
    const [resetCustomOpen, setResetCustomOpen] = useState(false);
    const { message, visible, show } = useToast();

    const design: Design | undefined = job.designs.find((d) => d.tier === tier);
    const guide = design?.operationsGuide ?? null;
    const selectedNode = design?.architecture.nodes.find((n) => n.id === selectedNodeId) ?? null;

    // 처음 열 때 일부 안이 실패했다면 한 번 알린다.
    const announced = useRef(false);
    useEffect(() => {
        if (announced.current) return;
        announced.current = true;
        show(job.failures.length ? '일부 안은 만들지 못했어요' : '3안을 만들었어요');
    }, [job.failures.length, show]);

    const focusIds = useMemo(() => {
        if (!openStep?.focus || !guide) return NO_NODES;
        const step = guide.phases.flatMap((p) => p.steps).find((s) => s.id === openStep.id);
        return step ? new Set(step.nodeIds) : NO_NODES;
    }, [openStep, guide]);

    const clearSelection = useCallback(() => {
        setSelectedNodeId(null);
        setOpenStep(null);
    }, []);

    const pickTier = (t: Tier) => {
        setMode('design');
        if (t !== tier) {
            setTier(t);
            clearSelection();
            const d = job.designs.find((x) => x.tier === t);
            setPhaseKey(d?.operationsGuide?.phases[0]?.key ?? null);
            show(`${TIER_LABEL[t]} 안으로 바꿨어요`);
        }
    };

    // 서비스를 누르면 그 서비스가 들어 있는 설정 단계를 연다.
    const selectNode = (id: string | null) => {
        setSelectedNodeId(id);
        if (!id || !guide) {
            setOpenStep(null);
            return;
        }
        for (const phase of guide.phases) {
            const step = phase.steps.find((s) => s.nodeIds.includes(id));
            if (step) {
                setPhaseKey(phase.key);
                setOpenStep({ id: step.id, focus: false });
                return;
            }
        }
        setOpenStep(null);
    };

    const toggleStep = (stepId: string) => {
        if (openStep?.id === stepId) {
            setOpenStep(null);
            return;
        }
        setSelectedNodeId(null);
        setOpenStep({ id: stepId, focus: true });
    };

    const toggleDone = (stepId: string) => {
        if (!design) return;
        const key = stepKey(design.id, stepId);
        const next = new Set(done);
        const nowDone = !next.has(key);
        if (nowDone) next.add(key);
        else next.delete(key);
        setDone(next);
        saveStepDone(window.localStorage, design.id, stepId, nowDone);
        if (nowDone) show('✓ 완료로 표시했어요');
    };

    const toggleEdit = useCallback(() => {
        setEdit((e) => {
            show(e ? '보기 전용' : '편집 모드 — 서비스를 끌어서 옮길 수 있어요');
            return !e;
        });
    }, [show]);

    // E: 편집 전환, Esc: 선택 해제
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (t?.closest('input, textarea, select, [contenteditable="true"]')) return;
            if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey && mode === 'design')
                toggleEdit();
            else if (e.key === 'Escape') clearSelection();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mode, toggleEdit, clearSelection]);

    // --- 패널 폭 ---
    const [panelOpen, setPanelOpen] = useState(true);
    const [panelWidth, setPanelWidth] = useState(() => {
        if (typeof window === 'undefined') return 440;
        let saved: number | null = null;
        try {
            saved = parseStoredWidth(window.localStorage.getItem(PANEL_STORAGE_KEY));
        } catch {
            saved = null;
        }
        return clampPanelWidth(saved ?? defaultPanelWidth(window.innerWidth), window.innerWidth);
    });
    const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const move = (ev: PointerEvent) =>
            setPanelWidth(clampPanelWidth(window.innerWidth - ev.clientX, window.innerWidth));
        const up = (ev: PointerEvent) => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            const w = clampPanelWidth(window.innerWidth - ev.clientX, window.innerWidth);
            try {
                window.localStorage.setItem(PANEL_STORAGE_KEY, String(w));
            } catch {
                // 저장 실패는 무시한다.
            }
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    const openCustom = () => {
        clearSelection();
        setCustomFresh(false);
        setMode('custom');
    };
    const newCustom = () => {
        if (customSummary.nodes > 0) {
            setResetCustomOpen(true);
            return;
        }
        startFreshCustom();
    };
    const startFreshCustom = () => {
        clearSelection();
        setCustomFresh(true);
        setCustomKey((k) => k + 1);
        setMode('custom');
        setResetCustomOpen(false);
        show('새 캔버스를 만들었어요');
    };

    return (
        <div className="flex h-screen flex-col">
            <div className="flex min-h-0 flex-1">
                <main className="relative min-w-0 flex-1 overflow-hidden" data-testid="canvas">
                    {mode === 'design' && design && (
                        <DesignCanvas
                            key={design.id}
                            design={design}
                            movable={edit}
                            focusIds={focusIds}
                            selectedNodeId={selectedNodeId}
                            onSelectNode={selectNode}
                        />
                    )}
                    {mode === 'custom' && (
                        <CustomCanvas
                            key={customKey}
                            fresh={customFresh}
                            onToast={show}
                            onSummary={setCustomSummary}
                        />
                    )}
                    <div className="absolute top-3.5 left-1/2 z-5 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-surface/90 px-4 py-2.5 shadow-card backdrop-blur">
                        <TierMenu
                            entries={entries}
                            currentDesignId={design?.id ?? null}
                            mode={mode}
                            custom={customSummary}
                            currentLabel={
                                mode === 'custom'
                                    ? '내 캔버스'
                                    : tier
                                      ? TIER_LABEL[tier]
                                      : '안 없음'
                            }
                            onPickTier={pickTier}
                            onPickFailed={(t) => setFailTier({ tier: t })}
                            onOpenCustom={openCustom}
                            onNewCustom={newCustom}
                            onRestart={() => setRestartOpen(true)}
                        />
                        <button
                            type="button"
                            onClick={() => setCompareOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 font-semibold hover:border-accent hover:text-accent-text"
                        >
                            3안 비교
                        </button>
                        {mode === 'design' && (
                            <button
                                type="button"
                                aria-pressed={edit}
                                onClick={toggleEdit}
                                className={cn(
                                    'rounded-full border px-3 py-1',
                                    edit
                                        ? 'border-accent bg-accent-soft text-accent-text'
                                        : 'border-warn-border bg-warn-bg text-warn-text',
                                )}
                            >
                                {edit ? 'Editing' : 'View only'}
                            </button>
                        )}
                        <AccountMenu />
                    </div>
                    {!panelOpen && (
                        <button
                            type="button"
                            onClick={() => setPanelOpen(true)}
                            className="absolute top-1/2 right-0 z-5 -translate-y-1/2 rounded-l-lg border border-r-0 border-border bg-surface px-1.5 py-4 shadow-card"
                            aria-label="설정 가이드 열기"
                            title="설정 가이드 열기"
                        >
                            ‹
                        </button>
                    )}
                    <Toast message={message} visible={visible} />
                </main>
                {panelOpen && (
                    <aside
                        aria-label="설정 가이드"
                        className="relative shrink-0 border-l border-border bg-surface-2"
                        style={{ width: panelWidth }}
                    >
                        <div
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="패널 폭 조절"
                            title="끌어서 폭 조절 · 더블클릭: 기본 폭"
                            onPointerDown={startResize}
                            onDoubleClick={() =>
                                setPanelWidth(
                                    clampPanelWidth(
                                        defaultPanelWidth(window.innerWidth),
                                        window.innerWidth,
                                    ),
                                )
                            }
                            className="absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize hover:bg-accent/30"
                        />
                        <button
                            type="button"
                            onClick={() => setPanelOpen(false)}
                            className="absolute top-1/2 -left-4 z-10 -translate-y-1/2 rounded-l-lg border border-r-0 border-border bg-surface px-1 py-4 shadow-card"
                            aria-label="설정 가이드 닫기"
                            title="설정 가이드 닫기"
                        >
                            ›
                        </button>
                        {mode === 'design' && design ? (
                            <GuidePanel
                                design={design}
                                done={done}
                                phaseKey={phaseKey}
                                openStepId={openStep?.id ?? null}
                                selectedNode={selectedNode}
                                onPhase={(k) => {
                                    setPhaseKey(k);
                                    clearSelection();
                                }}
                                onToggleStep={toggleStep}
                                onToggleDone={toggleDone}
                                onClearNode={clearSelection}
                            />
                        ) : (
                            <div className="grid h-full place-items-center p-8 text-center text-muted">
                                <div>
                                    <h4 className="mb-1 text-title text-text">
                                        {mode === 'custom'
                                            ? '직접 구성한 캔버스예요'
                                            : '설정 가이드가 아직 없어요'}
                                    </h4>
                                    {mode === 'custom'
                                        ? '설정 가이드와 월 비용은 3안에서만 보여 드려요. 구성한 뒤 3안 비교에서 비슷한 안을 골라 보세요.'
                                        : '3안을 만들면 선택한 안의 설정 순서가 여기에 나와요.'}
                                </div>
                            </div>
                        )}
                    </aside>
                )}
            </div>
            <footer className="flex h-12 shrink-0 items-center justify-between border-t border-border bg-surface-2 px-3 text-sub text-muted">
                <span>© 2026 ArchiMate</span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShortcutsOpen(true)}
                        className="rounded-full border border-border bg-surface px-2.5 py-1"
                    >
                        ⌨ 단축키
                    </button>
                    <ThemeSwitch />
                </div>
            </footer>

            <CompareModal
                open={compareOpen}
                onOpenChange={setCompareOpen}
                entries={entries}
                currentDesignId={mode === 'design' ? (design?.id ?? null) : null}
                onPick={pickTier}
                onRetryTier={(t) => {
                    setCompareOpen(false);
                    setFailTier({ tier: t });
                }}
            />
            <FailModal
                tier={failTier?.tier ?? null}
                open={failTier !== null}
                onOpenChange={(o) => !o && setFailTier(null)}
                job={job}
                retry={retry}
            />
            <ShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
            <Dialog open={restartOpen} onOpenChange={setRestartOpen}>
                <DialogContent
                    title="질문부터 다시 할까요?"
                    description="지금 보는 3안은 이 화면에서 사라지고, 질문 화면으로 돌아가요."
                >
                    <div className="flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">취소</Button>
                        </DialogClose>
                        <Button onClick={() => router.push('/interview/')}>질문으로 가기</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={resetCustomOpen} onOpenChange={setResetCustomOpen}>
                <DialogContent
                    title="새 캔버스를 만들까요?"
                    description="지금 내 캔버스는 지워지고 빈 캔버스로 시작해요."
                >
                    <div className="flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary">취소</Button>
                        </DialogClose>
                        <Button variant="danger" onClick={startFreshCustom}>
                            새로 만들기
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function readCustomSummary(): CustomSummary {
    if (typeof window === 'undefined') return { nodes: 0, edges: 0 };
    try {
        const raw = window.localStorage.getItem('archimate-custom-canvas');
        if (!raw) return { nodes: 0, edges: 0 };
        const m = JSON.parse(raw) as { nodes?: unknown[]; edges?: unknown[] };
        return { nodes: m.nodes?.length ?? 0, edges: m.edges?.length ?? 0 };
    } catch {
        return { nodes: 0, edges: 0 };
    }
}

interface DesignCanvasProps {
    design: Design;
    movable: boolean;
    focusIds: ReadonlySet<string>;
    selectedNodeId: string | null;
    onSelectNode: (id: string | null) => void;
}

/** 3안 하나의 구성도. 안이 바뀌면 `key`로 새로 만들어서 위치 변경과 카메라가 초기화된다. */
function DesignCanvas({
    design,
    movable,
    focusIds,
    selectedNodeId,
    onSelectNode,
}: DesignCanvasProps) {
    const initial = useMemo(() => toFlowElements(design.architecture), [design]);
    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initial.nodes);
    const [edges, , onEdgesChange] = useEdgesState(initial.edges);

    // 부모에서 선택을 풀면(Esc, 단계 열기) 캔버스의 선택 표시도 푼다.
    useEffect(() => {
        if (selectedNodeId === null) {
            setNodes((ns) =>
                ns.some((n) => n.selected) ? ns.map((n) => ({ ...n, selected: false })) : ns,
            );
        }
    }, [selectedNodeId, setNodes]);

    return (
        <DiagramCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            movable={movable}
            focusIds={focusIds}
            onSelectNode={onSelectNode}
        />
    );
}
