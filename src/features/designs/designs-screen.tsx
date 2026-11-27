'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { AuthGuard } from '@/features/auth/auth-guard';
import { isApiError, messageOf } from '@/shared/api/errors';
import { Button } from '@/shared/ui/button';
import { CardActions, GenerationCard } from './generation-card';
import { tierProgress } from './progress';
import { jobStage } from './tiers';
import { useDesignJob } from './use-design-job';
import { useRetry } from './use-retry';
import { Workspace } from './workspace';

export function DesignsScreen() {
    const jobId = useSearchParams().get('jobId');
    const router = useRouter();
    useEffect(() => {
        if (!jobId) router.replace('/interview/');
    }, [jobId, router]);
    if (!jobId) return null;
    return (
        <AuthGuard>
            <JobView key={jobId} jobId={jobId} />
        </AuthGuard>
    );
}

function JobView({ jobId }: { jobId: string }) {
    const job = useDesignJob(jobId);
    const router = useRouter();
    const retry = useRetry();
    const data = job.data;
    const edit = () => router.push('/interview/');

    const retryBlock = (retryable: boolean) => (
        <>
            {retry.error && (
                <p role="alert" className="mb-3 text-sub text-danger-text">
                    {retry.error}
                </p>
            )}
            <CardActions>
                <Button variant="secondary" onClick={edit}>
                    답변 수정하기
                </Button>
                {retryable && (
                    <Button disabled={retry.retrying} onClick={retry.retry}>
                        {retry.retrying ? '다시 만드는 중…' : '다시 시도'}
                    </Button>
                )}
            </CardActions>
        </>
    );

    if (job.isError) {
        return (
            <GenerationCard
                title="상태를 불러오지 못했어요"
                sub={isApiError(job.error) ? job.error.userMessage : '네트워크를 확인해 주세요.'}
                progress={tierProgress(undefined)}
            >
                <CardActions>
                    <Button variant="secondary" onClick={edit}>
                        처음부터 다시
                    </Button>
                    <Button onClick={() => void job.refetch()}>다시 불러오기</Button>
                </CardActions>
            </GenerationCard>
        );
    }
    if (job.timedOut) {
        return (
            <GenerationCard
                title="생성이 오래 걸리고 있어요"
                sub="3분이 지나도 끝나지 않았어요. 다시 시도해 주세요."
                progress={tierProgress(data)}
            >
                {retryBlock(true)}
            </GenerationCard>
        );
    }
    const stage = data ? jobStage(data) : 'pending';
    if (stage === 'pending' || !data) {
        return (
            <GenerationCard
                title={data?.status === 'running' ? '3안을 만들고 있어요' : '요청을 접수했어요'}
                sub="끝난 안부터 하나씩 채워져요. 보통 30~90초 걸려요."
                progress={tierProgress(data)}
            >
                <CardActions>
                    <Button variant="secondary" onClick={edit}>
                        취소
                    </Button>
                </CardActions>
            </GenerationCard>
        );
    }
    if (stage === 'failed') {
        const err = data.error ?? { code: 'DESIGN_GENERATION_FAILED' as const, retryable: true };
        return (
            <GenerationCard
                title="구성도를 만들지 못했어요"
                sub={messageOf(err)}
                progress={{ minimal_cost: 'fail', balanced: 'fail', scalable: 'fail' }}
            >
                {retryBlock(err.retryable)}
            </GenerationCard>
        );
    }
    return <Workspace job={data} retry={retry} />;
}
