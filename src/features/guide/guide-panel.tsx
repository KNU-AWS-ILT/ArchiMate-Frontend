'use client';

import { NodePanel } from '@/features/designs/node-panel';
import type { ArchNode, Design } from '@/features/designs/schemas';
import { formatKRW } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { categoryColor } from '@/shared/services/catalog';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { guideProgress, phaseProgress, stepKey } from './progress';

const LEVEL_TONE = { 1: 'success', 2: 'warn', 3: 'danger' } as const;

interface Props {
    design: Design;
    done: ReadonlySet<string>;
    phaseKey: string | null;
    openStepId: string | null;
    selectedNode: ArchNode | null;
    onPhase: (key: string) => void;
    onToggleStep: (stepId: string) => void;
    onToggleDone: (stepId: string) => void;
    onClearNode: () => void;
}

/** 오른쪽 설정 가이드: 단계 탭, 진행률, 단계별 할 일과 완료 체크. 비용은 서버가 준 값만 보여 준다. */
export function GuidePanel(p: Props) {
    const { design } = p;
    const guide = design.operationsGuide;
    const cost = design.monthlyCost;
    const phase = guide?.phases.find((x) => x.key === p.phaseKey) ?? guide?.phases[0];
    const progress = guide ? guideProgress(guide, design.id, p.done) : { total: 0, done: 0 };
    const nodeById = new Map(design.architecture.nodes.map((n) => [n.id, n]));
    const isLast = guide && phase && guide.phases[guide.phases.length - 1].key === phase.key;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-border px-5 pt-5">
                <h2 className="text-title font-bold">설정 가이드</h2>
                <small className="block text-sub text-muted">{design.title}</small>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-cap text-muted">
                        <b className="text-text">
                            {cost ? `월 ${formatKRW(cost.total)}` : '비용 계산 불가'}
                        </b>
                    </span>
                    <Badge tone={LEVEL_TONE[design.difficulty.level]}>
                        난이도 {design.difficulty.label}
                    </Badge>
                    {cost?.freeTier && <Badge tone="success">Free Tier 적용</Badge>}
                    {cost?.overBudget && <Badge tone="danger">예산 초과</Badge>}
                </div>
                <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                        <i
                            className="block h-full bg-success transition-all"
                            style={{
                                width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                            }}
                        />
                    </div>
                    <span className="text-sub text-muted">
                        {progress.done} / {progress.total} 완료
                    </span>
                </div>
                {guide && guide.phases.length > 0 && (
                    <div
                        role="tablist"
                        aria-label="설정 단계"
                        className="mt-3.5 mb-4 grid gap-0 rounded-md border border-border bg-surface p-[3px]"
                        style={{ gridTemplateColumns: `repeat(${guide.phases.length}, 1fr)` }}
                    >
                        {guide.phases.map((ph) => {
                            const pp = phaseProgress(ph, design.id, p.done);
                            const active = ph.key === phase?.key;
                            return (
                                <button
                                    key={ph.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => p.onPhase(ph.key)}
                                    className={cn(
                                        'rounded px-1 py-1.5 text-body break-keep',
                                        active ? 'bg-accent text-on-accent' : 'text-muted',
                                    )}
                                >
                                    {ph.title}
                                    <small className="block text-cap opacity-80">
                                        {ph.sub} · {pp.done}/{pp.total}
                                    </small>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {p.selectedNode && (
                    <div className="rounded-xl border border-border bg-surface p-4">
                        <NodePanel
                            key={`${design.id}:${p.selectedNode.id}`}
                            designId={design.id}
                            node={p.selectedNode}
                            onClose={p.onClearNode}
                        />
                    </div>
                )}
                {!guide || !phase ? (
                    <div className="py-10 text-center text-muted">
                        <h4 className="mb-1 text-title text-text">설정 가이드가 아직 없어요</h4>이
                        안의 설정 순서를 불러오지 못했어요.
                    </div>
                ) : (
                    <>
                        <p className="text-body text-muted">{phase.intro}</p>
                        {phase.steps.map((s, i) => {
                            const open = p.openStepId === s.id;
                            const isDone = p.done.has(stepKey(design.id, s.id));
                            return (
                                <div
                                    key={s.id}
                                    data-testid={`step-${s.id}`}
                                    className={cn(
                                        'rounded-xl border bg-surface',
                                        open ? 'border-accent' : 'border-border',
                                        isDone && 'opacity-80',
                                    )}
                                >
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={open}
                                        onClick={() => p.onToggleStep(s.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                p.onToggleStep(s.id);
                                            }
                                        }}
                                        className="flex cursor-pointer items-start gap-3 p-3.5"
                                    >
                                        <button
                                            type="button"
                                            aria-label={`${s.title} ${isDone ? '완료 취소' : '완료로 표시'}`}
                                            title="완료 표시"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                p.onToggleDone(s.id);
                                            }}
                                            className={cn(
                                                'grid size-7 shrink-0 place-items-center rounded-full border text-sub font-bold',
                                                isDone
                                                    ? 'border-success bg-success text-white'
                                                    : 'border-border text-muted',
                                            )}
                                        >
                                            {isDone ? '✓' : i + 1}
                                        </button>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold">{s.title}</div>
                                            <div className="text-sub text-muted">{s.desc}</div>
                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                {s.nodeIds
                                                    .map((id) => nodeById.get(id))
                                                    .filter((n): n is ArchNode => !!n)
                                                    .map((n) => (
                                                        <span
                                                            key={n.id}
                                                            className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-cap"
                                                        >
                                                            <i
                                                                className="size-2 rounded-full"
                                                                style={{
                                                                    background: categoryColor(
                                                                        n.serviceType,
                                                                    ),
                                                                }}
                                                            />
                                                            {n.label}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>
                                        <span
                                            aria-hidden
                                            className={cn(
                                                'text-muted transition',
                                                open && 'rotate-180',
                                            )}
                                        >
                                            ▾
                                        </span>
                                    </div>
                                    {open && (
                                        <div className="space-y-3 border-t border-border p-3.5 pt-3">
                                            {s.warn && (
                                                <div className="rounded-md border border-warn-border bg-warn-bg p-2.5 text-sub text-warn-text">
                                                    ⚠ {s.warn}
                                                </div>
                                            )}
                                            <ol className="list-decimal space-y-1 pl-5 text-body">
                                                {s.todo.map((t) => (
                                                    <li key={t}>{t}</li>
                                                ))}
                                            </ol>
                                            {s.consolePath && (
                                                <div className="rounded-md bg-surface-2 p-2.5">
                                                    <small className="block text-cap text-muted">
                                                        AWS 콘솔 경로
                                                    </small>
                                                    <b className="text-sub break-words">
                                                        {s.consolePath}
                                                    </b>
                                                </div>
                                            )}
                                            <Button onClick={() => p.onToggleDone(s.id)}>
                                                {isDone ? '완료 취소' : '완료로 표시'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {isLast &&
                            guide.checklists.map((c) => (
                                <section
                                    key={c.key}
                                    className="rounded-xl border border-border bg-surface p-3.5"
                                >
                                    <h5 className="mb-1.5 font-bold">{c.title}</h5>
                                    <ul className="list-disc space-y-1 pl-5 text-sub">
                                        {c.items.map((it) => (
                                            <li key={it}>{it}</li>
                                        ))}
                                    </ul>
                                </section>
                            ))}
                    </>
                )}
            </div>
        </div>
    );
}
