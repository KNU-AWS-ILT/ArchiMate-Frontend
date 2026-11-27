'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';

/** 잠깐 보였다 사라지는 안내 글. `show("...")`로 띄운다. */
export function useToast(duration = 1800) {
    const [message, setMessage] = useState('');
    const [visible, setVisible] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const show = useCallback(
        (text: string) => {
            setMessage(text);
            setVisible(true);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setVisible(false), duration);
        },
        [duration],
    );
    useEffect(() => () => clearTimeout(timer.current), []);
    return { message, visible, show };
}

export function Toast({ message, visible }: { message: string; visible: boolean }) {
    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'pointer-events-none absolute bottom-7 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-text px-4 py-2 text-body text-surface transition',
                visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
            )}
        >
            {message}
        </div>
    );
}
