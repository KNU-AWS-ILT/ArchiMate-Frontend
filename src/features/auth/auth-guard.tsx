'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from './auth-provider';

/** 로그인한 사용자에게만 화면을 보여 준다. 아니면 로그인 화면(`/`)으로 보낸다. */
export function AuthGuard({ children }: { children: ReactNode }) {
    const { status } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (status === 'signedOut') router.replace('/');
    }, [status, router]);
    if (status !== 'signedIn') return null;
    return <>{children}</>;
}
