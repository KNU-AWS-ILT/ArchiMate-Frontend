import { formatKRW, formatUSD } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/badge';
import type { Design } from './schemas';

const LEVEL_TONE = { 1: 'success', 2: 'warn', 3: 'danger' } as const;

/** 선택한 안의 요약, 월 비용, 장단점. 비용은 서버가 준 값만 보여 준다. */
export function DesignPanel({ design }: { design: Design }) {
    const cost = design.monthlyCost;
    return (
        <section aria-label="선택한 안 요약" className="space-y-4">
            <div>
                <h2 className="text-title font-bold">{design.title}</h2>
                <p className="mt-1 text-body text-muted">{design.summary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Badge tone={LEVEL_TONE[design.difficulty.level]}>
                    운영 난이도 {design.difficulty.label}
                </Badge>
                {cost?.freeTier && <Badge tone="success">Free Tier 적용</Badge>}
                {cost?.overBudget && <Badge tone="danger">예산 초과</Badge>}
            </div>
            <p className="text-sub text-muted">{design.difficulty.reason}</p>
            {cost && (
                <div className="rounded-xl border border-border bg-surface-2 p-4">
                    <small className="block text-cap text-muted">월 예상 비용</small>
                    <b className="text-title">{formatKRW(cost.total)}</b>
                    <span className="ml-2 text-sub text-muted">({formatUSD(cost.totalUsd)})</span>
                    {cost.freeTierNote && (
                        <p className="mt-2 text-cap text-muted">{cost.freeTierNote}</p>
                    )}
                </div>
            )}
            <p className="text-sub">{design.budgetNote}</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <h3 className="mb-1 font-bold text-success">좋은 점</h3>
                    <ul className="list-disc space-y-1 pl-5 text-sub">
                        {design.pros.map((p) => (
                            <li key={p}>{p}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="mb-1 font-bold text-danger-text">아쉬운 점</h3>
                    <ul className="list-disc space-y-1 pl-5 text-sub">
                        {design.cons.map((c) => (
                            <li key={c}>{c}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
