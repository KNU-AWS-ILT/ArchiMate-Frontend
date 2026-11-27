'use client';

import { messageOf } from '@/shared/api/errors';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogClose, DialogContent } from '@/shared/ui/dialog';
import type { Retry } from './use-retry';
import type { DesignJob, Tier } from './schemas';
import { TIER_LABEL } from './tiers';

interface Props {
    /** 못 만든 안. 없으면 작업 전체 실패 */
    tier: Tier | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    job: DesignJob;
    retry: Retry;
}

/** "만들지 못했어요" 안내와 다시 시도. 안별 재시도 API가 없어서 3안을 새로 만든다. */
export function FailModal({ tier, open, onOpenChange, job, retry }: Props) {
    const err = job.error;
    const text = tier
        ? '이 안은 만들지 못했어요. 다시 시도하면 3안을 새로 만들어요.'
        : messageOf(err ?? { code: 'DESIGN_GENERATION_FAILED', retryable: true });
    const canRetry = tier !== null || err?.retryable !== false;
    return (
        <Dialog open={open} onOpenChange={(o) => !retry.retrying && onOpenChange(o)}>
            <DialogContent
                title={tier ? `${TIER_LABEL[tier]}은 만들지 못했어요` : '구성도를 만들지 못했어요'}
            >
                <p className="mb-4 flex gap-2 text-body">
                    <span aria-hidden className="text-danger-text">
                        ⚠
                    </span>
                    {text}
                </p>
                {retry.error && (
                    <p role="alert" className="mb-3 text-sub text-danger-text">
                        {retry.error}
                    </p>
                )}
                <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" disabled={retry.retrying}>
                            닫기
                        </Button>
                    </DialogClose>
                    {canRetry && (
                        <Button disabled={retry.retrying} onClick={retry.retry}>
                            {retry.retrying ? '다시 만드는 중…' : '다시 시도'}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
