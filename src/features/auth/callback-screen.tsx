'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { useAuth } from './auth-provider';

/** Cognito가 돌려보낸 `?code=`를 토큰으로 바꾸고 인터뷰 화면으로 보낸다. */
export function CallbackScreen() {
    const { completeSignIn } = useAuth();
    const router = useRouter();
    const [failed, setFailed] = useState(false);
    // 인가 코드는 한 번만 쓸 수 있어서 개발 모드의 이중 실행을 막는다.
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        completeSignIn()
            .then(() => router.replace('/interview/'))
            .catch(() => setFailed(true));
    }, [completeSignIn, router]);

    return (
        <main className="grid min-h-screen place-items-center p-6 text-center">
            {failed ? (
                <div>
                    <p role="alert" className="mb-4 text-body">
                        로그인을 마무리하지 못했어요. 처음부터 다시 로그인해 주세요.
                    </p>
                    <Button onClick={() => router.replace('/')}>로그인 화면으로</Button>
                </div>
            ) : (
                <p className="text-body text-muted">로그인하는 중…</p>
            )}
        </main>
    );
}
