import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
    title: 'ArchiMate',
    description: '나의 첫 간편 클라우드 서비스',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
