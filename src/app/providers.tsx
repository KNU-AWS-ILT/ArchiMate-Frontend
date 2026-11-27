'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/features/auth';
import { createDesignsApi, resolveApiMode } from '@/features/designs';
import { DesignsApiProvider } from '@/shared/api/context';

function ApiProviders({ children }: { children: ReactNode }) {
    const { headers } = useAuth();
    const [api] = useState(() =>
        createDesignsApi({
            mode: resolveApiMode(process.env.NEXT_PUBLIC_API_MODE),
            headers,
            search: typeof window === 'undefined' ? '' : window.location.search,
        }),
    );
    return <DesignsApiProvider api={api}>{children}</DesignsApiProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    );
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ApiProviders>{children}</ApiProviders>
            </AuthProvider>
        </QueryClientProvider>
    );
}
