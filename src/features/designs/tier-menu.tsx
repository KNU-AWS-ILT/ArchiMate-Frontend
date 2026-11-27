'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { formatKRW } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/badge';
import type { Tier } from './schemas';
import { isFailedEntry, TIER_LABEL, type TierEntry } from './tiers';

const LEVEL_TONE = { 1: 'success', 2: 'warn', 3: 'danger' } as const;

export interface CustomSummary {
    nodes: number;
    edges: number;
}

interface Props {
    entries: TierEntry[];
    /** 지금 보는 안. 새 캔버스를 보는 중이면 null */
    currentDesignId: string | null;
    mode: 'design' | 'custom';
    custom: CustomSummary;
    onPickTier: (tier: Tier) => void;
    onPickFailed: (tier: Tier) => void;
    onOpenCustom: () => void;
    onNewCustom: () => void;
    onRestart: () => void;
    currentLabel: string;
}

const item =
    'flex w-full cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2.5 text-left outline-none data-[highlighted]:bg-accent-soft';

/** 상단 바의 3안 선택 드롭다운. 만든 안, 못 만든 안, 새 캔버스를 한곳에서 고른다. */
export function TierMenu(p: Props) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                aria-label="3안 선택"
                title="3안 선택"
                className="flex min-w-[150px] items-center justify-between gap-5 rounded-lg border border-border bg-surface px-3 py-2 text-body"
            >
                <span>{p.currentLabel}</span>
                <span aria-hidden>▾</span>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="start"
                    sideOffset={10}
                    className="z-50 min-w-[340px] rounded-xl border border-border bg-surface p-1 shadow-card"
                >
                    {p.entries.map((e) => {
                        if (isFailedEntry(e)) {
                            return (
                                <DropdownMenu.Item
                                    key={e.tier}
                                    className={cn(item, 'bg-danger-soft')}
                                    onSelect={() => p.onPickFailed(e.tier)}
                                >
                                    <span className="font-bold">{TIER_LABEL[e.tier]}</span>
                                    <span className="text-sub text-danger-text">
                                        ⚠ 만들지 못했어요 · 눌러서 다시 시도
                                    </span>
                                </DropdownMenu.Item>
                            );
                        }
                        const d = e.design;
                        const current = p.mode === 'design' && d.id === p.currentDesignId;
                        return (
                            <DropdownMenu.Item
                                key={e.tier}
                                className={cn(item, current && 'bg-accent-soft')}
                                onSelect={() => p.onPickTier(e.tier)}
                            >
                                <span className="font-bold">
                                    {TIER_LABEL[e.tier]}
                                    {current && (
                                        <i className="ml-1.5 text-accent-text not-italic">✓</i>
                                    )}
                                </span>
                                <span className="text-sub text-muted">{d.title}</span>
                                <span className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <b className="text-sub">
                                        {d.monthlyCost
                                            ? `월 ${formatKRW(d.monthlyCost.total)}`
                                            : '비용 계산 불가'}
                                    </b>
                                    <Badge tone={LEVEL_TONE[d.difficulty.level]}>
                                        난이도 {d.difficulty.label}
                                    </Badge>
                                    {d.monthlyCost?.overBudget && (
                                        <Badge tone="danger">예산 초과</Badge>
                                    )}
                                </span>
                            </DropdownMenu.Item>
                        );
                    })}
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    {p.custom.nodes > 0 ? (
                        <>
                            <DropdownMenu.Item
                                className={cn(item, p.mode === 'custom' && 'bg-accent-soft')}
                                onSelect={p.onOpenCustom}
                            >
                                <span className="font-bold">
                                    내 캔버스
                                    {p.mode === 'custom' && (
                                        <i className="ml-1.5 text-accent-text not-italic">✓</i>
                                    )}
                                </span>
                                <span className="text-sub text-muted">
                                    직접 구성 · 서비스 {p.custom.nodes}개 · 연결 {p.custom.edges}개
                                </span>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item className={item} onSelect={p.onNewCustom}>
                                <span className="font-bold">＋ 새 캔버스 만들기</span>
                                <span className="text-sub text-muted">지금 캔버스는 지워져요</span>
                            </DropdownMenu.Item>
                        </>
                    ) : (
                        <DropdownMenu.Item className={item} onSelect={p.onNewCustom}>
                            <span className="font-bold">＋ 새 캔버스</span>
                            <span className="text-sub text-muted">
                                서비스를 직접 골라 구성해 보세요
                            </span>
                        </DropdownMenu.Item>
                    )}
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item className={item} onSelect={p.onRestart}>
                        <span className="font-bold">질문부터 다시 하기</span>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
