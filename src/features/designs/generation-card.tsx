import { cn } from '@/shared/lib/cn';
import type { TierProgress } from './progress';
import { TIER_LABEL, TIER_ORDER } from './tiers';
import type { Tier } from './schemas';

const PROGRESS_TEXT: Record<TierProgress, string> = {
    wait: '대기 중',
    run: '만드는 중',
    done: '완료',
    fail: '만들지 못했어요',
};

const ICON: Record<TierProgress, string> = { wait: '·', run: '', done: '✓', fail: '⚠' };

interface CardProps {
    title: string;
    sub: string;
    progress: Record<Tier, TierProgress>;
    children?: React.ReactNode;
}

/** 3안이 하나씩 채워지는 모습을 보여 주는 카드. 실패 안내에도 같은 모양을 쓴다. */
export function GenerationCard({ title, sub, progress, children }: CardProps) {
    return (
        <main className="grid min-h-screen place-items-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-card">
                <h1 className="mb-1 text-title font-bold">{title}</h1>
                <p className="mb-5 text-body text-muted">{sub}</p>
                <ul className="mb-5 space-y-2">
                    {TIER_ORDER.map((t) => (
                        <li
                            key={t}
                            className={cn(
                                'flex items-center gap-3 rounded-lg border border-border px-4 py-3',
                                progress[t] === 'done' && 'border-success bg-success-soft',
                                progress[t] === 'fail' && 'border-danger bg-danger-soft',
                            )}
                        >
                            <span aria-hidden className="grid size-5 place-items-center">
                                {progress[t] === 'run' ? (
                                    <span className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                                ) : (
                                    ICON[progress[t]]
                                )}
                            </span>
                            <b>{TIER_LABEL[t]}</b>
                            <small className="ml-auto text-sub text-muted">
                                {PROGRESS_TEXT[progress[t]]}
                            </small>
                        </li>
                    ))}
                </ul>
                {children}
            </div>
        </main>
    );
}

export function CardActions({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-wrap justify-end gap-2">{children}</div>;
}
