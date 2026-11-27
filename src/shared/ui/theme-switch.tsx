'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';

type Theme = 'light' | 'dark';
const KEY = 'archimate-theme';

function initialTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    try {
        const saved = window.localStorage.getItem(KEY);
        if (saved === 'light' || saved === 'dark') return saved;
    } catch {
        // 저장소를 못 읽으면 시스템 설정을 따른다.
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** 라이트·다크 전환. 고른 값은 브라우저에 저장한다. */
export function ThemeSwitch() {
    const [theme, setTheme] = useState<Theme>(initialTheme);
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);
    const toggle = () => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        try {
            window.localStorage.setItem(KEY, next);
        } catch {
            // 저장 실패는 무시한다.
        }
    };
    const dot = 'grid size-[33px] place-items-center rounded-full text-title text-muted';
    return (
        <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="어두운 화면"
            title="화면 색상 바꾸기"
            onClick={toggle}
            className="flex gap-1 rounded-full border border-border bg-surface p-[3px]"
        >
            <span className={cn(dot, theme === 'light' && 'bg-accent text-on-accent')}>☀</span>
            <span className={cn(dot, theme === 'dark' && 'bg-accent text-on-accent')}>☾</span>
        </button>
    );
}
