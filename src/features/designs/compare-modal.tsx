'use client';

import { formatKRW } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/shared/ui/dialog';
import type { ReactNode } from 'react';
import type { Design, Tier } from './schemas';
import { isFailedEntry, TIER_LABEL, type TierEntry } from './tiers';

const LEVEL_TONE = { 1: 'success', 2: 'warn', 3: 'danger' } as const;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entries: TierEntry[];
    currentDesignId: string | null;
    onPick: (tier: Tier) => void;
    onRetryTier: (tier: Tier) => void;
}

const List = ({ items, ordered }: { items: string[]; ordered?: boolean }) => {
    const Tag = ordered ? 'ol' : 'ul';
    return (
        <Tag className={ordered ? 'list-decimal pl-5' : 'list-disc pl-5'}>
            {items.map((x) => (
                <li key={x}>{x}</li>
            ))}
        </Tag>
    );
};

/** 3안을 나란히 비교한다. 월 비용은 서버가 계산한 값만 보여 준다. */
export function CompareModal({
    open,
    onOpenChange,
    entries,
    currentDesignId,
    onPick,
    onRetryTier,
}: Props) {
    const row = (label: string, render: (d: Design) => ReactNode) => (
        <tr key={label} className="border-t border-border align-top">
            <th scope="row" className="w-28 py-3 pr-3 text-left text-sub font-semibold text-muted">
                {label}
            </th>
            {entries.map((e) => (
                <td key={e.tier} className="py-3 pr-4 text-sub">
                    {isFailedEntry(e) ? <span className="text-muted">—</span> : render(e.design)}
                </td>
            ))}
        </tr>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                size="lg"
                title="3안 비교"
                description="월 비용은 백엔드가 계산한 값이에요. 마음에 드는 안을 골라 구성도와 설정 순서를 확인하세요."
            >
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse">
                        <thead>
                            <tr>
                                <td />
                                {entries.map((e) =>
                                    isFailedEntry(e) ? (
                                        <th key={e.tier} className="pr-4 pb-3 text-left align-top">
                                            <span className="block font-bold">
                                                {TIER_LABEL[e.tier]}
                                            </span>
                                            <p className="my-1 text-sub font-normal text-danger-text">
                                                만들지 못했어요
                                            </p>
                                            <Button
                                                variant="secondary"
                                                onClick={() => onRetryTier(e.tier)}
                                            >
                                                다시 시도
                                            </Button>
                                        </th>
                                    ) : (
                                        <th key={e.tier} className="pr-4 pb-3 text-left align-top">
                                            <span className="block font-bold">
                                                {TIER_LABEL[e.tier]}
                                            </span>
                                            <h4 className="my-1 text-sub font-normal text-muted">
                                                {e.design.title}
                                            </h4>
                                            {e.design.id === currentDesignId ? (
                                                <Badge tone="accent">보고 있는 안</Badge>
                                            ) : (
                                                <DialogClose asChild>
                                                    <Button onClick={() => onPick(e.tier)}>
                                                        이 안 선택
                                                    </Button>
                                                </DialogClose>
                                            )}
                                        </th>
                                    ),
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {row('월 예상 비용', (d) =>
                                d.monthlyCost ? (
                                    <>
                                        <b className="block text-body">
                                            {formatKRW(d.monthlyCost.total)}
                                        </b>
                                        <small className="block text-muted">
                                            ≈ ${d.monthlyCost.totalUsd} · 환율{' '}
                                            {d.monthlyCost.exchangeRate.toLocaleString('ko-KR')}원 (
                                            {d.monthlyCost.exchangeRateDate})
                                        </small>
                                        <em
                                            className={
                                                d.monthlyCost.overBudget
                                                    ? 'text-danger-text'
                                                    : 'text-success'
                                            }
                                        >
                                            {d.monthlyCost.overBudget
                                                ? '월 예산 초과'
                                                : '월 예산 안'}
                                        </em>
                                    </>
                                ) : (
                                    '비용을 계산하지 못했어요'
                                ),
                            )}
                            {row('Free Tier', (d) =>
                                d.monthlyCost ? (
                                    <>
                                        {d.monthlyCost.freeTier ? '적용' : '적용 안 됨'}
                                        {d.monthlyCost.freeTierNote && (
                                            <small className="block text-muted">
                                                {d.monthlyCost.freeTierNote}
                                            </small>
                                        )}
                                    </>
                                ) : (
                                    '—'
                                ),
                            )}
                            {row('운영 난이도', (d) => (
                                <>
                                    <Badge tone={LEVEL_TONE[d.difficulty.level]}>
                                        {d.difficulty.label}
                                    </Badge>
                                    <small className="mt-1 block text-muted">
                                        {d.difficulty.reason}
                                    </small>
                                </>
                            ))}
                            {row('한 줄 요약', (d) => d.summary)}
                            {row('예산 설명', (d) => d.budgetNote)}
                            {row('장점', (d) => (
                                <List items={d.pros} />
                            ))}
                            {row('단점', (d) => (
                                <List items={d.cons} />
                            ))}
                            {row('성장 로드맵', (d) => (
                                <List ordered items={d.scalingPath} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
