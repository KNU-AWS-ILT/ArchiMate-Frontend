'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toRequirements } from '@/features/interview/flow';
import { useInterviewStore } from '@/features/interview/store';
import { useDesignsApi } from '@/shared/api/context';
import { isApiError } from '@/shared/api/errors';

/** 같은 답변으로 3안 생성을 다시 요청한다. 안별 재시도 API는 없어서 새 작업을 만든다. */
export function useRetry() {
    const api = useDesignsApi();
    const router = useRouter();
    const answers = useInterviewStore((s) => s.answers);
    const [error, setError] = useState('');
    const mutation = useMutation({
        mutationFn: async () => {
            const req = toRequirements(answers);
            if (!req.ok) {
                throw new Error('답변이 없어서 다시 만들 수 없어요. 질문부터 다시 답해 주세요.');
            }
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
        clearError: () => setError(''),
    };
}

export type Retry = ReturnType<typeof useRetry>;
