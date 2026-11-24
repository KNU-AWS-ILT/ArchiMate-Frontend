'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;

interface DialogContentProps {
    title: string;
    description?: string;
    children: ReactNode;
}

export function DialogContent({ title, description, children }: DialogContentProps) {
    return (
        <RadixDialog.Portal>
            <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
            <RadixDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-card">
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
