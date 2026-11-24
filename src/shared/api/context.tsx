'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { DesignsApi } from '@/features/designs';

const DesignsApiContext = createContext<DesignsApi | null>(null);

export function DesignsApiProvider({ api, children }: { api: DesignsApi; children: ReactNode }) {
    return <DesignsApiContext.Provider value={api}>{children}</DesignsApiContext.Provider>;
}

/** 화면은 이 훅으로만 API를 받는다. 실제 API인지 목인지는 모른다. */
export function useDesignsApi(): DesignsApi {
    const api = useContext(DesignsApiContext);
    if (!api) throw new Error('DesignsApiProvider 안에서만 쓸 수 있습니다.');
    return api;
}
