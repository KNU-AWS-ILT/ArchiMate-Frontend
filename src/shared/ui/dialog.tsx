'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

interface DialogContentProps {
    title: string;
    description?: string;
    /** `md`는 단축키처럼 줄이 긴 목록, `lg`는 3안 비교 표처럼 넓은 내용용이다. */
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
}

export function DialogContent({ title, description, size = 'sm', children }: DialogContentProps) {
    return (
        <RadixDialog.Portal>
            <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
            <RadixDialog.Content
                className={cn(
                    'fixed top-1/2 left-1/2 z-50 max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-surface p-6 shadow-card',
                    size === 'sm' && 'w-[min(92vw,420px)]',
                    size === 'md' && 'w-[min(92vw,560px)]',
                    size === 'lg' && 'w-[min(96vw,1080px)]',
                )}
            >
                <RadixDialog.Title className="mb-3 text-title font-bold">{title}</RadixDialog.Title>
                {description ? (
                    <RadixDialog.Description className="mb-4 text-body text-muted">
                        {description}
                    </RadixDialog.Description>
                ) : (
                    <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
                )}
                {children}
            </RadixDialog.Content>
        </RadixDialog.Portal>
    );
}
