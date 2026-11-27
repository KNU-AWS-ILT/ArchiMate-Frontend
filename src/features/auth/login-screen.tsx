'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { useAuth } from './auth-provider';

export function LoginScreen() {
    const { status, signIn } = useAuth();
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (status === 'signedIn') router.replace('/interview/');
    }, [status, router]);

    if (status !== 'signedOut') return null;

    const onSignIn = async () => {
        setBusy(true);
        setFailed(false);
        try {
            await signIn();
        } catch {
            setFailed(true);
            setBusy(false);
        }
    };

    return (
        <main className="grid min-h-screen place-items-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
                <div className="mb-4 flex items-center justify-center gap-2 text-title font-bold">
                    <span className="grid size-8 place-items-center rounded-lg bg-accent text-on-accent">
                        ✦
                    </span>
                    ArchiMate
                </div>
                <h1 className="mb-3 text-title font-bold">나의 첫 간편 클라우드 서비스</h1>
                <p className="mb-6 text-body text-muted">
                    질문 몇 개에 답하면 예산과 경험에 맞는 AWS 구성도 3안, 월 예상 비용, 배포·운영
                    절차를 쉬운 한국어로 알려 드려요.
                </p>
                <Button className="w-full py-3 text-body" disabled={busy} onClick={onSignIn}>
                    {busy ? '로그인 페이지로 이동하는 중…' : '로그인하고 시작하기'}
                </Button>
                {failed && (
                    <p role="alert" className="mt-3 text-sub text-danger-text">
                        로그인 페이지로 이동하지 못했어요. 잠시 후 다시 시도해 주세요.
                    </p>
                )}
            </div>
        </main>
    );
}
