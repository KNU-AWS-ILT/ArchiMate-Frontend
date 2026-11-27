'use client';

import { useQuery } from '@tanstack/react-query';
import { useDesignsApi } from '@/shared/api/context';
import { isApiError } from '@/shared/api/errors';
import { formatKRW } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import type { ArchNode } from './schemas';

interface Props {
    designId: string;
    node: ArchNode;
    onClose: () => void;
}

/** 노드를 눌렀을 때 "왜 이 서비스인가 / 대안은 무엇인가"를 보여 준다. 설명은 눌렀을 때 생성된다. */
export function NodePanel({ designId, node, onClose }: Props) {
    const api = useDesignsApi();
    const explanation = useQuery({
        queryKey: ['explanation', designId, node.id],
        queryFn: ({ signal }) => api.getExplanation(designId, node.id, { signal }),
    });
    const data = explanation.data;
    return (
        <section aria-label="노드 설명" className="space-y-3">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h2 className="text-title font-bold">{data?.name ?? node.label}</h2>
                    <p className="text-sub text-muted">{node.role}</p>
                </div>
                <Button variant="secondary" onClick={onClose}>
                    닫기
                </Button>
            </div>
            {explanation.isPending && <p className="text-sub text-muted">설명을 만드는 중…</p>}
            {explanation.isError && (
                <div
                    role="alert"
                    className="rounded-lg bg-danger-soft p-3 text-sub text-danger-text"
                >
                    {isApiError(explanation.error)
                        ? explanation.error.userMessage
                        : '설명을 불러오지 못했어요.'}
                    <Button
                        className="mt-2"
                        variant="secondary"
                        onClick={() => void explanation.refetch()}
                    >
                        다시 시도
                    </Button>
                </div>
            )}
            {data && (
                <>
                    <div>
                        <h3 className="mb-1 font-bold">왜 이 서비스인가요?</h3>
                        <p className="text-body">{data.reason}</p>
                    </div>
                    {data.alternatives.length > 0 && (
                        <div>
                            <h3 className="mb-1 font-bold">대안은 무엇인가요?</h3>
                            <ul className="space-y-2">
                                {data.alternatives.map((a) => (
                                    <li key={a.serviceType} className="rounded-lg bg-surface-2 p-3">
                                        <b>{a.name}</b>
                                        <p className="text-sub text-muted">{a.comparison}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {data.cautions.length > 0 && (
                        <div>
                            <h3 className="mb-1 font-bold">주의할 점</h3>
                            <ul className="list-disc space-y-1 pl-5 text-sub">
                                {data.cautions.map((c) => (
                                    <li key={c}>{c}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {data.monthlyCost && (
                        <p className="text-sub text-muted">
                            이 서비스의 월 예상 비용: <b>{formatKRW(data.monthlyCost.amount)}</b>
                        </p>
                    )}
                </>
            )}
        </section>
    );
}
