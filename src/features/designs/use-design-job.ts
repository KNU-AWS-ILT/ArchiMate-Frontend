'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useDesignsApi } from '@/shared/api/context';
import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS, shouldKeepPolling } from './tiers';

/**
 * 작업 상태를 3초마다 조회한다. 끝나면(`completed`, `failed`) 멈추고, 최대 약 3분까지 기다린다.
 * `jobId`가 바뀌면 화면을 새로 만들어야 한다(`key={jobId}`). 시간 제한도 처음부터 다시 센다.
 */
export function useDesignJob(jobId: string) {
    const api = useDesignsApi();
    const [timerFired, setTimerFired] = useState(false);
    const timerFiredRef = useRef(false);

    const query = useQuery({
        queryKey: ['designJob', jobId],
        queryFn: ({ signal }) => api.getJob(jobId, { signal }),
        refetchInterval: (q) =>
            timerFiredRef.current || !shouldKeepPolling(q.state.data) ? false : POLL_INTERVAL_MS,
    });

    useEffect(() => {
        const t = setTimeout(() => {
            timerFiredRef.current = true;
            setTimerFired(true);
        }, POLL_TIMEOUT_MS);
        return () => clearTimeout(t);
    }, []);

    const pending = shouldKeepPolling(query.data) && !query.isError;
    return { ...query, timedOut: timerFired && pending };
}
