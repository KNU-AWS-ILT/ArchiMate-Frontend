'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AccountMenu } from '@/features/auth/account-menu';
import { AuthGuard } from '@/features/auth/auth-guard';
import { DiagramCanvas } from '@/features/canvas/diagram-canvas';
import { toRequirements } from '@/features/interview/flow';
import { useInterviewStore } from '@/features/interview/store';
import { useDesignsApi } from '@/shared/api/context';
import { isApiError, messageOf } from '@/shared/api/errors';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { CardActions, GenerationCard } from './generation-card';
import { DesignPanel } from './design-panel';
import { NodePanel } from './node-panel';
import { tierProgress } from './progress';
import type { Design, DesignJob, Tier } from './schemas';
import { isFailedEntry, jobStage, TIER_LABEL, tierEntries } from './tiers';
import { useDesignJob } from './use-design-job';

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

/** 같은 답변으로 3안 생성을 다시 요청한다. 안별 재시도 API는 없어서 새 작업을 만든다. */
function useRetry() {
    const api = useDesignsApi();
    const router = useRouter();
    const answers = useInterviewStore((s) => s.answers);
    const [error, setError] = useState('');
    const mutation = useMutation({
        mutationFn: async () => {
            const req = toRequirements(answers);
            if (!req.ok)
                throw new Error('답변이 없어서 다시 만들 수 없어요. 질문부터 다시 답해 주세요.');
            return api.createDesign(req.value);
        },
        onSuccess: ({ jobId }) => router.replace(`/designs/?jobId=${encodeURIComponent(jobId)}`),
        onError: (e) => setError(isApiError(e) ? e.userMessage : e.message),
    });
    return {
        retry: () => {
            setError('');
            mutation.mutate();
        },
        retrying: mutation.isPending,
        error,
    };
}

function JobView({ jobId }: { jobId: string }) {
    const job = useDesignJob(jobId);
    const router = useRouter();
    const { retry, retrying, error: retryError } = useRetry();
    const data = job.data;
    const edit = () => router.push('/interview/');

    const retryBlock = (retryable: boolean) => (
        <>
            {retryError && (
                <p role="alert" className="mb-3 text-sub text-danger-text">
                    {retryError}
                </p>
            )}
            <CardActions>
                <Button variant="secondary" onClick={edit}>
                    답변 수정하기
                </Button>
                {retryable && (
                    <Button disabled={retrying} onClick={retry}>
                        {retrying ? '다시 만드는 중…' : '다시 시도'}
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
    return <Workspace job={data} onRetry={retry} retrying={retrying} retryError={retryError} />;
}

interface WorkspaceProps {
    job: DesignJob;
    onRetry: () => void;
    retrying: boolean;
    retryError: string;
}

function Workspace({ job, onRetry, retrying, retryError }: WorkspaceProps) {
    const router = useRouter();
    const entries = tierEntries(job);
    const firstTier = entries.find((e) => !isFailedEntry(e))?.tier ?? entries[0]?.tier;
    const [tier, setTier] = useState<Tier | undefined>(firstTier);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const design: Design | undefined = job.designs.find((d) => d.tier === tier);
    const node = design?.architecture.nodes.find((n) => n.id === selectedNodeId) ?? null;

    return (
        <div className="flex h-screen flex-col">
            <header className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-6 py-3">
                <b className="text-title">ArchiMate</b>
                <div role="tablist" aria-label="3안 선택" className="flex gap-1">
                    {entries.map((e) => (
                        <button
                            key={e.tier}
                            type="button"
                            role="tab"
                            aria-selected={e.tier === tier}
                            disabled={isFailedEntry(e)}
                            onClick={() => {
                                setTier(e.tier);
                                setSelectedNodeId(null);
                            }}
                            className={cn(
                                'rounded-full border border-border px-4 py-1.5 text-sub font-semibold disabled:opacity-50',
                                e.tier === tier && 'border-accent bg-accent text-on-accent',
                            )}
                        >
                            {TIER_LABEL[e.tier]}
                            {isFailedEntry(e) && ' (실패)'}
                        </button>
                    ))}
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <Button variant="secondary" onClick={() => router.push('/interview/')}>
                        질문부터 다시
                    </Button>
                    <AccountMenu />
                </div>
            </header>
            {job.failures.length > 0 && (
                <div
                    role="status"
                    className="flex items-center gap-3 border-b border-warn-border bg-warn-bg px-6 py-2 text-sub text-warn-text"
                >
                    일부 안은 만들지 못했어요.
                    {retryError && <span className="text-danger-text">{retryError}</span>}
                    <Button
                        className="ml-auto"
                        variant="secondary"
                        disabled={retrying}
                        onClick={onRetry}
                    >
                        {retrying ? '다시 만드는 중…' : '다시 시도'}
                    </Button>
                </div>
            )}
            <div className="flex min-h-0 flex-1">
                <div className="min-w-0 flex-1" data-testid="canvas">
                    {design && (
                        <DiagramCanvas
                            key={design.id}
                            architecture={design.architecture}
                            selectedNodeId={selectedNodeId}
                            onSelectNode={setSelectedNodeId}
                        />
                    )}
                </div>
                <aside className="w-[min(440px,40vw)] shrink-0 overflow-y-auto border-l border-border bg-surface p-5">
                    {design && node ? (
                        <NodePanel
                            key={`${design.id}:${node.id}`}
                            designId={design.id}
                            node={node}
                            onClose={() => setSelectedNodeId(null)}
                        />
                    ) : design ? (
                        <DesignPanel design={design} />
                    ) : null}
                </aside>
            </div>
        </div>
    );
}
