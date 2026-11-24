'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { createDesignsApi, resolveApiMode } from '@/features/designs';
import { DesignsApiProvider } from '@/shared/api/context';

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );
    const [api] = useState(() =>
        createDesignsApi({
            mode: resolveApiMode(process.env.NEXT_PUBLIC_API_MODE),
            search: typeof window === 'undefined' ? '' : window.location.search,
        }),
    );
    return (
        <QueryClientProvider client={queryClient}>
            <DesignsApiProvider api={api}>{children}</DesignsApiProvider>
        </QueryClientProvider>
    );
}
